// 运行：node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getMap, ALL_MAP_IDS, MAP_IDS, findPath, walkable, mapRoute } from '../src/maps.js';
import { NPCS } from '../src/npcs.js';
import { MONSTERS, SKILLS, SCHOOLS, ROLES, PARTNERS, ITEMS, expNeed } from '../src/data.js';
import { mkUnit, execute, endRound, outcome, simulate, aiAction, canUse } from '../src/battle-core.js';
import { enemyUnit, layoutEnemies } from '../src/enemies.js';
import { G, newGame, gainExp, addItem, removeItem, countItem, makeEquip, equipFromBag, recruit, allyUnits, addPet, makePet, stats, syncFromBattle } from '../src/state.js';
import { MAIN } from '../src/game.js';
import { seeded } from '../src/util.js';

const mem = new Map();
globalThis.localStorage = { getItem: k => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)), removeItem: k => mem.delete(k) };

test('所有地图可生成，出生点、出口与 NPC 均可到达', () => {
  for (const id of ALL_MAP_IDS) {
    const m = getMap(id);
    const [sx, sy] = m.spawn;
    assert.ok(walkable(m, sx, sy), `${id} 出生点不可走`);
    for (const e of m.exits) {
      assert.ok(getMap(e.to), `${id} 出口指向未知地图 ${e.to}`);
      assert.ok(findPath(m, sx, sy, e.x, e.y), `${id} 无法到达出口 ${e.label}`);
      const dest = getMap(e.to);
      assert.ok(walkable(dest, e.tx, e.ty), `${id}→${e.to} 落点(${e.tx},${e.ty})不可走`);
      assert.ok(!dest.exits.some(x => x.x === e.tx && x.y === e.ty), `${id}→${e.to} 落点位于传送圈上`);
    }
    for (const n of m.npcs) {
      assert.ok(NPCS[n.id], `${id} 缺少 NPC 定义 ${n.id}`);
      const near = [[0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]].some(([dx, dy]) => walkable(m, n.x + dx, n.y + dy) && findPath(m, sx, sy, n.x + dx, n.y + dy));
      assert.ok(near, `${id} 无法靠近 NPC ${n.id}`);
    }
  }
});

test('世界地图互相连通，出口双向', () => {
  for (const a of MAP_IDS) for (const b of MAP_IDS) assert.ok(mapRoute(a, b) !== null, `${a} 到 ${b} 不连通`);
  for (const id of MAP_IDS) for (const e of getMap(id).exits) assert.ok(getMap(e.to).exits.some(x => x.to === id), `${e.to} 没有回到 ${id} 的出口`);
});

test('主线任务引用的 NPC、怪物与首领位置有效', () => {
  const npcMaps = {};
  for (const id of ALL_MAP_IDS) for (const n of getMap(id).npcs) npcMaps[n.id] = id;
  for (const st of MAIN) {
    for (const k of ['giver', 'turnin']) if (st[k] && st[k] !== 'master') assert.ok(npcMaps[st[k]], `${st.title} 的 ${k} ${st[k]} 不在任何地图上`);
    const g = st.goal;
    if (g.type === 'talk') assert.ok(npcMaps[g.npc], `${st.title} 对话目标不存在`);
    if (g.type === 'kill') { assert.ok(MONSTERS[g.mid]); assert.ok(getMap(g.map).encounter.mobs.includes(g.mid), `${st.title} 的怪物不在 ${g.map} 出没`); }
    if (g.type === 'boss') {
      const m = getMap(g.map);
      assert.ok(MONSTERS[g.boss]?.boss, `${st.title} 首领无效`);
      const reach = [[0, 1], [1, 0], [-1, 0], [0, -1]].some(([dx, dy]) => walkable(m, g.x + dx, g.y + dy) && findPath(m, m.spawn[0], m.spawn[1], g.x + dx, g.y + dy));
      assert.ok(reach, `${st.title} 首领位置无法到达`);
    }
  }
});

test('数据完整：技能、门派、怪物、伙伴互相引用正确', () => {
  for (const [id, sc] of Object.entries(SCHOOLS)) {
    assert.equal(sc.skills.length, 3);
    for (const s of [...sc.skills, sc.passive]) assert.ok(SKILLS[s], `${id} 技能 ${s} 不存在`);
    assert.ok(Object.values(ROLES).some(r => r.race === sc.race), `${id} 没有可拜师的角色`);
  }
  for (const [id, m] of Object.entries(MONSTERS)) {
    for (const s of [...(m.skills || []), ...(m.traits || [])]) assert.ok(SKILLS[s], `${id} 技能 ${s} 不存在`);
    for (const [it] of m.drops || []) assert.ok(ITEMS[it], `${id} 掉落 ${it} 不存在`);
  }
  for (const p of Object.values(PARTNERS)) assert.ok(SCHOOLS[p.school]);
  for (const id of MAP_IDS) { const e = getMap(id).encounter; if (e) for (const mid of e.mobs) assert.ok(MONSTERS[mid], `${id} 怪物 ${mid} 不存在`); }
});

function duel(a, b) {
  const x = mkUnit({ side: 'ally', kind: 'player', name: 'A', level: 10, hp: 1000, maxHp: 1000, mp: 500, maxMp: 500, atk: 200, def: 50, spd: 50, mpow: 100, ...a });
  const y = mkUnit({ side: 'enemy', kind: 'monster', name: 'B', level: 10, hp: 5000, maxHp: 5000, mp: 100, maxMp: 100, atk: 50, def: 20, spd: 10, mpow: 50, ...b });
  return { B: { units: [x, y], round: 1 }, x, y };
}

test('横扫千军：三次攻击同一目标并需要休息', () => {
  const { B, x, y } = duel({ skills: [{ id: 'hsqj', lv: 10 }] });
  const ev = execute(B, x, { type: 'skill', skill: 'hsqj', target: y }, seeded(1));
  assert.equal(ev.filter(e => e.t === 'hit' && e.u === y).length, 3);
  assert.ok(x.status.rest > 0);
  endRound(B);
  const ev2 = execute(B, x, { type: 'attack', target: y }, seeded(2));
  assert.ok(ev2.some(e => e.text === '休息'));
  endRound(B);
  assert.equal(x.status.rest, 0);
});

test('气血不足时无法使用横扫；魔法不足时改为普通攻击', () => {
  const { B, x, y } = duel({ skills: [{ id: 'hsqj', lv: 10 }], hp: 300 });
  assert.equal(canUse(x, 'hsqj').ok, false);
  x.hp = 1000; x.mp = 0;
  const ev = execute(B, x, { type: 'skill', skill: 'hsqj', target: y }, seeded(3));
  assert.ok(ev.some(e => e.t === 'swing'));
  assert.equal(x.status.rest, 0);
});

test('封印使目标无法行动，回合结束后解除', () => {
  const { B, x, y } = duel({ skills: [{ id: 'cmf', lv: 60 }], level: 60 });
  execute(B, x, { type: 'skill', skill: 'cmf', target: y }, () => 0.01);
  assert.ok(y.status.seal > 0);
  const ev = execute(B, y, { type: 'attack', target: x }, seeded(4));
  assert.ok(ev.some(e => e.text === '封印中'));
  for (let i = 0; i < 4; i++) endRound(B);
  assert.equal(y.status.seal, 0);
});

test('治疗不超过上限，复活仅作用于倒地队友', () => {
  const { B, x } = duel({ skills: [{ id: 'tqgg', lv: 20 }, { id: 'wfcb', lv: 20 }] });
  const ally = mkUnit({ side: 'ally', kind: 'partner', name: 'C', level: 10, hp: 0, maxHp: 500, mp: 0, maxMp: 0, atk: 1, def: 1, spd: 1, mpow: 1 });
  B.units.push(ally);
  x.hp = 990;
  execute(B, x, { type: 'skill', skill: 'tqgg', target: x }, seeded(5));
  assert.equal(x.hp, 1000);
  execute(B, x, { type: 'skill', skill: 'wfcb', target: ally }, seeded(6));
  assert.equal(ally.hp, 250);
});

test('鬼魂术倒地三回合后复活一次；五雷咒令其无法复活', () => {
  const { B, x, y } = duel({}, { traits: ['guihun'], ghost: true, hp: 10 });
  execute(B, x, { type: 'attack', target: y }, seeded(7));
  assert.equal(y.hp, 0);
  assert.equal(outcome(B), 'win');
  for (let i = 0; i < 3; i++) endRound(B);
  assert.ok(y.hp > 0);
  const d = duel({ skills: [{ id: 'wlz', lv: 30 }] }, { traits: ['guihun'], ghost: true, hp: 10 });
  execute(d.B, d.x, { type: 'skill', skill: 'wlz', target: d.y }, seeded(8));
  for (let i = 0; i < 4; i++) endRound(d.B);
  assert.equal(d.y.hp, 0);
});

test('捕捉成功后目标离场，逃跑结束战斗', () => {
  const { B, x, y } = duel({}, { catchable: true, hp: 1 });
  let caught = null;
  B.hooks = { onCatch: u => { caught = u; return true; } };
  execute(B, x, { type: 'catch', target: y }, () => 0);
  assert.equal(caught, y);
  assert.equal(y.gone, true);
  assert.equal(outcome(B), 'win');
  const d = duel();
  execute(d.B, d.x, { type: 'flee' }, () => 0);
  assert.equal(outcome(d.B), 'flee');
});

test('AI 行动总是合法，模拟战斗能结束', () => {
  const r = seeded(9);
  for (let i = 0; i < 20; i++) {
    newGame('ltz', 't');
    G.S.school = 'longgong';
    for (const id of SCHOOLS.longgong.skills) G.S.skills[id] = 10;
    gainExp(expNeed(1) + expNeed(2) + expNeed(3) + expNeed(4) + expNeed(5) + expNeed(6) + expNeed(7) + expNeed(8) + expNeed(9));
    recruit('wushuang');
    const B = { units: [...allyUnits(), ...layoutEnemies([enemyUnit('shuguai', 10), enemyUnit('dutu', 10), enemyUnit('yezhu', 10)])], round: 1 };
    for (const u of B.units) { const a = aiAction(B, u, r); assert.ok(['attack', 'skill', 'defend'].includes(a.type)); }
    assert.notEqual(simulate(B, r), 'timeout');
  }
});

test('平衡：新手单挑东海湾怪物、带伙伴打首领均有合理胜率', () => {
  const r = seeded(11);
  let win = 0;
  for (let i = 0; i < 60; i++) {
    newGame('jxk', 't'); gainExp(expNeed(1));
    const B = { units: [...allyUnits(), ...layoutEnemies([enemyUnit('dahaigui', 3), enemyUnit('haimaochong', 3)])], round: 1 };
    if (simulate(B, r) === 'win') win++;
  }
  assert.ok(win >= 54, `新手胜率过低：${win}/60`);
  win = 0;
  for (let i = 0; i < 40; i++) {
    newGame('jxk', 't'); let e = 0; for (let l = 1; l < 8; l++) e += expNeed(l); gainExp(e);
    recruit('wushuang'); addPet(makePet('juwa', 8));
    const B = { units: [...allyUnits(), ...layoutEnemies([enemyUnit('shangren', 9), enemyUnit('yegui', 7), enemyUnit('yegui', 7)])], round: 1 };
    if (simulate(B, r) === 'win') win++;
  }
  assert.ok(win >= 24, `沉船首领过难：${win}/40`);
});

test('背包、装备、升级与存档', () => {
  newGame('xce', '测试');
  const S = G.S;
  assert.equal(countItem('baozi'), 5);
  addItem('baozi', 3); removeItem('baozi', 7);
  assert.equal(countItem('baozi'), 1);
  const before = stats().atk;
  S.inv.push({ id: 'equip', n: 1, eq: makeEquip('weapon', 1, 'ribbon', 0) });
  assert.equal(equipFromBag(S.inv.length - 1), '等级不足');
  gainExp(expNeed(1) * 400);
  assert.ok(S.level >= 10);
  assert.equal(equipFromBag(S.inv.length - 1), null);
  assert.ok(stats().atk > before);
  S.inv.push({ id: 'equip', n: 1, eq: makeEquip('weapon', 0, 'sword', 0) });
  assert.equal(equipFromBag(S.inv.length - 1), '无法使用该类武器');
  addPet(makePet('dahaigui', 3));
  const units = allyUnits();
  units.find(u => u.kind === 'pet').hp = 0;
  syncFromBattle(units);
  assert.ok(S.pets[0].hp > 0, '倒地召唤兽战后应复苏');
});
