// 2.3 新内容：等级上限与渡劫、七大圣主线、新地图、强化、修炼、伙伴星级、高级技能、祈愿、平衡
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getMap, WORLD_ORDER, mapRoute } from '../src/maps.js';
import { MONSTERS, SKILLS, ITEMS, PARTNERS, SHENSHOU, MAX_LEVEL, LEVEL_CAPS, expNeed, tierForLevel, WEAPON_NAMES, EQUIP_NAMES } from '../src/data.js';
import { mkUnit, execute, endRound, simulate } from '../src/battle-core.js';
import { enemyUnit, layoutEnemies } from '../src/enemies.js';
import { G, newGame, gainExp, load, save, makeEquip, makePet, addPet, recruit, allyUnits, stats, levelCap, fullHeal } from '../src/state.js';
import { eqStats, equipSum, partnerStats } from '../src/stats.js';
import { MAIN } from '../src/game.js';
import { STORY2, BOSS_FIGHTS2 } from '../src/story2.js';
import { xinmoFoes, towerFoes, arenaFoes } from '../src/activity.js';
import { drawMany, vipLevel, PITY } from '../src/mall.js';
import { seeded } from '../src/util.js';

const mem = new Map();
globalThis.localStorage = { getItem: k => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)), removeItem: k => mem.delete(k) };
const levelTo = L => { let e = 0; for (let l = G.S.level; l < L; l++) e += expNeed(l); gainExp(e); };

test('等级上限 150，瓶颈处储存经验，渡劫后一口气升级', () => {
  newGame('jxk', 't');
  assert.equal(MAX_LEVEL, 150);
  levelTo(80);
  assert.equal(G.S.level, 69, '未渡劫时卡在 69 级');
  assert.ok(G.S.exp > expNeed(69), '瓶颈期经验被储存');
  assert.ok(G.S.exp <= expNeed(69) * 5, '最多储存 5 倍');
  G.S.breaks = 1;
  gainExp(0);
  assert.ok(G.S.level > 69 && G.S.level <= 89, `突破后升级到 ${G.S.level}`);
  G.S.breaks = LEVEL_CAPS.length - 1;
  levelTo(160);
  assert.equal(G.S.level, 150);
  assert.equal(levelCap(), 150);
});

test('旧存档读入时补齐新字段', () => {
  newGame('xce', '旧档');
  const S = JSON.parse(JSON.stringify(G.S));
  for (const k of ['jade', 'breaks', 'cult', 'pstar', 'mall', 'daily', 'tower', 'arena', 'stat', 'doubleMs', 'unlocked']) delete S[k];
  mem.set('mhxy-q-save-v2', JSON.stringify(S));
  const L = load();
  assert.equal(L.jade, 0);
  assert.equal(L.breaks, 0);
  assert.deepEqual(L.cult, { atk: 0, def: 0, mag: 0, res: 0 });
  assert.equal(L.tower.best, 0);
  assert.equal(L.arena.score, 1000);
  assert.ok(L.mall && L.stat && L.daily);
  save();
});

test('七大圣主线：接在第一部之后，等级递增，首领战完整', () => {
  assert.equal(MAIN.length, 15 + STORY2.length);
  assert.ok(STORY2.length >= 25);
  let lv = 0;
  for (const st of STORY2) {
    assert.ok(st.lv >= lv, `${st.title} 等级倒退`);
    lv = st.lv;
    if (st.goal.type === 'boss') {
      assert.ok(MONSTERS[st.goal.boss]?.boss, `${st.title} 首领无效`);
      assert.ok(BOSS_FIGHTS2[st.goal.boss], `${st.title} 缺少首领战阵容`);
    }
    if (st.reward.partner) assert.ok(PARTNERS[st.reward.partner]);
    if (st.reward.pet) assert.ok(MONSTERS[st.reward.pet]);
    for (const [id] of st.reward.items || []) assert.ok(ITEMS[id], `${st.title} 奖励物品 ${id} 不存在`);
  }
  assert.ok(lv >= 140, '主线延续到 140 级以上');
  for (const list of Object.values(BOSS_FIGHTS2)) for (const [mid, l] of list) { assert.ok(MONSTERS[mid], mid); assert.ok(l <= MAX_LEVEL); }
});

test('新区域：按等级衔接到 150 级，怪物等级范围与地图一致，从长安可以走到', () => {
  const ranges = WORLD_ORDER.map(id => getMap(id).encounter?.lv).filter(Boolean);
  assert.ok(ranges.some(r => r[1] >= 150), '有 150 级的练级区');
  for (const id of WORLD_ORDER) {
    assert.ok(mapRoute('changan', id) !== null, `长安到不了 ${id}`);
    const e = getMap(id).encounter;
    if (!e) continue;
    for (const mid of e.mobs) { const m = MONSTERS[mid]; assert.ok(m.lv[0] <= e.lv[1] && m.lv[1] >= e.lv[0], `${id} 的 ${mid} 等级不匹配`); }
  }
  for (let L = 40; L <= 150; L += 5) assert.ok(ranges.some(([a, b]) => L >= a - 2 && L <= b + 2), `${L} 级没有合适的练级地图`);
});

test('装备 16 档名称齐全，强化按每级 7% 提升属性', () => {
  for (const k in WEAPON_NAMES) assert.equal(WEAPON_NAMES[k].length, 16, k);
  for (const k in EQUIP_NAMES) assert.equal(EQUIP_NAMES[k].length, 16, k);
  assert.equal(tierForLevel(150), 15);
  newGame('jxk', 't');
  const e = makeEquip('weapon', 10, 'sword', 0);
  const base = e.stats.atk;
  e.plus = 10;
  assert.equal(eqStats(e).atk, Math.round(base * 1.7));
  assert.equal(equipSum({ weapon: e }).atk, Math.round(base * 1.7));
});

test('修炼提升全队属性，抗法修炼减少法术伤害；伙伴升星变强', () => {
  newGame('ltz', 't');
  G.S.school = 'longgong';
  recruit('wushuang');
  const a0 = stats().atk, p0 = allyUnits().find(u => u.kind === 'partner').atk;
  G.S.cult = { atk: 10, def: 10, mag: 10, res: 10 };
  assert.equal(stats().atk, Math.floor(a0 * 1.2));
  const partner = allyUnits().find(u => u.kind === 'partner');
  assert.ok(partner.atk > p0 && partner.resist > 0.14);
  assert.ok(partnerStats('wushuang', 60, 3).maxHp > partnerStats('wushuang', 60, 0).maxHp * 1.25);
  // 抗法
  const mk = resist => ({ side: 'ally', kind: 'player', name: 'x', level: 60, hp: 9999, maxHp: 9999, mp: 0, maxMp: 0, atk: 1, def: 1, spd: 1, mpow: 100, resist });
  const caster = () => mkUnit({ side: 'enemy', kind: 'rival', name: 'c', level: 60, hp: 999, maxHp: 999, mp: 999, maxMp: 999, atk: 1, def: 1, spd: 1, mpow: 800, skills: [{ id: 'lt', lv: 60 }] });
  const hit = resist => { const t = mkUnit(mk(resist)), c = caster(); execute({ units: [t, c], round: 1 }, c, { type: 'skill', skill: 'lt', target: t }, () => 0.5); return 9999 - t.hp; };
  assert.ok(hit(0.3) < hit(0) * 0.75);
});

test('高级技能与首领狂暴', () => {
  const duel = (a, b) => {
    const x = mkUnit({ side: 'ally', kind: 'pet', name: 'A', level: 60, hp: 5000, maxHp: 5000, mp: 999, maxMp: 999, atk: 800, def: 50, spd: 50, mpow: 600, ...a });
    const y = mkUnit({ side: 'enemy', kind: 'monster', name: 'B', level: 60, hp: 50000, maxHp: 50000, mp: 0, maxMp: 0, atk: 50, def: 20, spd: 10, mpow: 50, ...b });
    return { B: { units: [x, y], round: 1 }, x, y };
  };
  let d = duel({ traits: ['gj_lianji'] });
  let ev = execute(d.B, d.x, { type: 'attack', target: d.y }, () => 0.45);
  assert.equal(ev.filter(e => e.t === 'hit' && e.u === d.y).length, 2, '高级连击 50% 触发');
  d = duel({ traits: ['lianji'] });
  ev = execute(d.B, d.x, { type: 'attack', target: d.y }, () => 0.45);
  assert.equal(ev.filter(e => e.t === 'hit' && e.u === d.y).length, 1, '普通连击 35% 不触发');
  d = duel({ traits: ['fs_lianji'], skills: [{ id: 'leiji', lv: 60 }] });
  ev = execute(d.B, d.x, { type: 'skill', skill: 'leiji', target: d.y }, () => 0.1);
  assert.equal(ev.filter(e => e.t === 'spell').length, 2, '法术连击再放一次');
  d = duel({}, { traits: ['gj_shenyou'], hp: 10 });
  execute(d.B, d.x, { type: 'attack', target: d.y }, () => 0.4);
  assert.equal(d.y.hp, d.y.maxHp, '高级神佑 45% 满血复活');
  d = duel({}, { enrage: true, boss: true, hp: 20300 });
  ev = execute(d.B, d.x, { type: 'attack', target: d.y }, () => 0.5);
  assert.ok(d.y.status.enraged && ev.some(e => e.text === '狂暴！'), '残血狂暴');
});

test('神兽自带全部高级技能，成长 1.30 以上', () => {
  newGame('jxk', 't');
  for (const mid of SHENSHOU) {
    const p = makePet(mid, 80, true);
    assert.ok(p.shenshou && p.growth >= 1.3);
    assert.ok(p.skills.length >= 4 && p.skills.every(s => SKILLS[s]));
  }
});

test('祈愿：十连必出紫色，保底必出金色；VIP 按消费仙玉升级', () => {
  newGame('jxk', 't');
  for (let i = 0; i < 30; i++) { G.S.inv = []; assert.ok(drawMany(10).some(x => x.r >= 2)); }
  G.S.inv = []; G.S.mall.pity = PITY - 1;
  assert.equal(drawMany(1)[0].r, 3);
  assert.equal(G.S.mall.pity, 0);
  assert.equal(vipLevel(), 0);
  G.S.mall.spent = 600; assert.equal(vipLevel(), 2);
  G.S.mall.spent = 80000; assert.equal(vipLevel(), 7);
});

test('平衡：七大圣首领、渡劫心魔、镇妖塔、论剑在对应等级都打得过', () => {
  const r = seeded(21);
  const setup = (role, school, L, partners, pet) => {
    newGame(role, 't'); G.S.breaks = 4; levelTo(L); G.S.school = school;
    for (const id of [...SCHOOLS_OF[school]]) G.S.skills[id] = L - 2;
    for (const slot of ['weapon', 'helm', 'neck', 'armor', 'belt', 'boots']) G.S.equip[slot] = makeEquip(slot, tierForLevel(L), ROLES_W[role], 0);
    partners.forEach(p => recruit(p)); addPet(makePet(pet, L)); fullHeal();
  };
  const rate = (fn, n) => { let w = 0; for (let i = 0; i < n; i++) { fullHeal(); const B = { units: [...allyUnits(), ...layoutEnemies(fn())], round: 1 }; if (simulate(B, r) === 'win') w++; } return w / n; };
  const boss = id => () => BOSS_FIGHTS2[id].map(([m, l]) => enemyUnit(m, l));
  setup('jxk', 'datang', 58, ['wushuang', 'qinchuan', 'zixia'], 'yecha');
  assert.ok(rate(boss('jiutouchong'), 30) >= 0.6, '九头虫过难');
  setup('ltz', 'longgong', 111, ['wushuang', 'nezha', 'longnv'], 'jinjia');
  assert.ok(rate(boss('pengmowang'), 30) >= 0.5, '鹏魔王过难');
  setup('xys', 'huasheng', 147, ['wushuang', 'qinchuan', 'zixia'], 'mohou');
  assert.ok(rate(boss('liuer'), 20) >= 0.35, '六耳猕猴过难');
  setup('ltz', 'longgong', 89, ['wushuang', 'qinchuan', 'mingyue'], 'niujiang'); G.S.breaks = 1; G.S.level = 89;
  assert.ok(rate(() => xinmoFoes(), 30) >= 0.4, '心魔过难');
  setup('ltz', 'longgong', 72, ['wushuang', 'qinchuan', 'zixia'], 'niujiang');
  assert.ok(rate(() => towerFoes(50), 30) >= 0.6, '镇妖塔 50 层过难');
  G.S.arena.score = 1000;
  assert.ok(rate(() => arenaFoes().foes, 30) >= 0.8, '论剑新手段过难');
});

import { SCHOOLS, ROLES } from '../src/data.js';
const SCHOOLS_OF = Object.fromEntries(Object.entries(SCHOOLS).map(([k, v]) => [k, [...v.skills, v.passive]]));
const ROLES_W = Object.fromEntries(Object.entries(ROLES).map(([k, v]) => [k, v.weapon]));
