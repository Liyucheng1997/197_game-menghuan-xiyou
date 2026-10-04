// 2.4 新内容：装备品质、特技、特效、未鉴定装备、宝箱、奇遇与银两
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SKILLS, ITEMS, EQ_FX, EQ_TJ, RARITY, EQUIP_BASE } from '../src/data.js';
import { mkUnit, execute, endRound, canUse, physDamage } from '../src/battle-core.js';
import { G, newGame, makeEquip, rollRarity, rollSpecial, randomDrop, canEquip, allyUnits, stats, countItem } from '../src/state.js';
import { equipSum, eqFxSum, eqTj, playerStats } from '../src/stats.js';
import { boxEquip } from '../src/loot.js';
import { seeded } from '../src/util.js';

const mem = new Map();
globalThis.localStorage = { getItem: k => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)), removeItem: k => mem.delete(k) };
const unit = o => mkUnit({ side: 'ally', kind: 'player', name: 'a', level: 50, hp: 1000, maxHp: 1000, mp: 500, maxMp: 500, atk: 400, def: 100, spd: 100, mpow: 300, ...o });
const foe = o => unit({ side: 'enemy', kind: 'monster', name: 'b', ...o });

test('特技、特效数据完整', () => {
  assert.equal(RARITY.length, 6);
  for (const id of EQ_TJ) { assert.ok(SKILLS[id]?.tj, id); assert.ok(SKILLS[id].uses >= 1, id); }
  for (const id in EQ_FX) assert.ok(EQ_FX[id].name && EQ_FX[id].w > 0, id);
  for (const id of ['baoxiang', 'shenbing', 'tiangong']) assert.equal(ITEMS[id].type, 'box');
});

test('品质越高，基础属性、附加属性、特效越多；保底品质有效', () => {
  newGame('jxk', 't');
  for (let i = 0; i < 300; i++) assert.ok(rollRarity(0.5, 3) >= 3);
  const n = Array(6).fill(0);
  for (let i = 0; i < 20000; i++) n[rollRarity(0)]++;
  assert.ok(n[0] > n[1] && n[1] > n[2] && n[3] > n[4] && n[4] > n[5] && n[5] > 0, n.join(','));
  const plain = makeEquip('weapon', 8, 'sword', 0);
  assert.deepEqual(plain.fx, []); assert.equal(plain.tj, null); assert.equal(plain.req, 80);
  for (let i = 0; i < 50; i++) {
    const god = makeEquip('weapon', 8, 'sword', 5);
    assert.ok(god.stats.atk > EQUIP_BASE.weapon(8).atk * 1.6, '神器基础属性高得多');
    assert.ok(Object.keys(god.stats).length >= 5, '神器带满附加属性');
    assert.ok(god.fx.length >= 2 && new Set(god.fx).size === god.fx.length, '神器至少两条不重复特效');
    assert.ok(EQ_TJ.includes(god.tj), '神器必带特技');
    assert.equal(god.req, god.fx.includes('wujibie') ? 0 : god.fx.includes('jianyi') ? 75 : 80);
  }
  const epic = makeEquip('armor', 5, null, 3);
  assert.ok(epic.fx.length >= 1);
  for (let i = 0; i < 30; i++) assert.ok(boxEquip('tiangong', 60).rarity >= 4);
});

test('未鉴定装备不能穿、不计属性；鉴定后生效', () => {
  newGame('jxk', 't');
  G.S.level = 60;
  const e = randomDrop(6, 0.3);
  assert.ok(e.unid);
  assert.equal(canEquip(e), '尚未鉴定');
  assert.deepEqual(equipSum({ weapon: e }), {});
  delete e.unid;
  assert.ok(Object.keys(equipSum({ x: e })).length > 0);
  assert.equal(countItem('shenbing'), 1, '新手礼包含神兵宝匣');
  assert.equal(countItem('baoxiang'), 3);
});

test('特效叠加有上限，并作用到人物属性与战斗单位', () => {
  newGame('jxk', 't');
  const S = G.S;
  const before = playerStats(S);
  const mk = (slot, fx, tj = null) => Object.assign(makeEquip(slot, 0, 'sword', 0), { fx, tj });
  S.equip.helm = mk('helm', ['qiangti', 'xunjie', 'shenyou']);
  S.equip.neck = mk('neck', ['shenyou', 'jubao'], 'tj_chpd');
  S.equip.belt = mk('belt', ['shenyou']);
  S.equip.boots = mk('boots', ['shenyou']);
  const f = eqFxSum(S.equip);
  assert.equal(f.shenyou, EQ_FX.shenyou.cap, '神佑叠加不超过上限');
  const after = playerStats(S);
  assert.ok(after.maxHp > before.maxHp && after.spd > before.spd);
  assert.deepEqual(eqTj(S.equip), ['tj_chpd']);
  const me = allyUnits()[0];
  assert.ok(me.efx.shenyou > 0);
  assert.ok(me.skills.some(s => s.id === 'tj_chpd'), '特技进入战斗技能列表');
});

test('特技每场次数有限；慈航普渡复活全部队友', () => {
  const a = unit({ skills: [{ id: 'tj_chpd', lv: 50 }] });
  const d1 = unit({ hp: 0 }), d2 = unit({ hp: 0, kind: 'partner' });
  const B = { units: [a, d1, d2, foe({})], round: 1 };
  assert.ok(canUse(a, 'tj_chpd').ok);
  execute(B, a, { type: 'skill', skill: 'tj_chpd', target: d1 }, seeded(1));
  assert.ok(d1.hp > 0 && d2.hp > 0);
  assert.equal(canUse(a, 'tj_chpd').why, '次数已用完');
});

test('护体减伤、破甲穿透、神佑复活、回春回血', () => {
  const r = seeded(3);
  const atk = foe({}), tank = unit({ efx: { huti: 0.3 } }), plainU = unit({});
  const B = { units: [atk, tank, plainU], round: 1 };
  execute(B, atk, { type: 'attack', target: tank }, seeded(7));
  execute(B, atk, { type: 'attack', target: plainU }, seeded(7));
  assert.ok(1000 - tank.hp < 1000 - plainU.hp, '护体受到的伤害更少');
  const pierce = unit({ efx: { pojia: 0.6 } }), d = foe({ def: 400 });
  assert.ok(physDamage(pierce, d, 1, () => 0.5).dmg > physDamage(unit({}), d, 1, () => 0.5).dmg);
  const sy = unit({ hp: 5, efx: { shenyou: 1 } });
  const B2 = { units: [foe({ atk: 9999 }), sy], round: 1 };
  execute(B2, B2.units[0], { type: 'attack', target: sy }, r);
  assert.equal(sy.hp, sy.maxHp, '神佑满血复活');
  const hc = unit({ hp: 100, efx: { huichun: 0.04 } });
  endRound({ units: [hc], round: 1 });
  assert.equal(hc.hp, 140);
});

test('洗练保留品质与基础属性，只改附加属性、特技、特效', () => {
  newGame('jxk', 't');
  const e = makeEquip('weapon', 6, 'sword', 4);
  const base = e.stats.atk;
  const nu = rollSpecial(JSON.parse(JSON.stringify(e)));
  assert.equal(nu.rarity, 4);
  assert.equal(nu.stats.atk, base);
  assert.ok(nu.fx.length >= 1);
});
