// 高等级平衡模拟：node tests/balance-high.mjs
import { G, newGame, gainExp, makeEquip, addPet, makePet, recruit, allyUnits, fullHeal } from '../src/state.js';
import { enemyUnit, layoutEnemies } from '../src/enemies.js';
import { simulate } from '../src/battle-core.js';
import { SCHOOLS, ROLES, expNeed, tierForLevel } from '../src/data.js';
import { BOSS_FIGHTS2 } from '../src/story2.js';

const mem = new Map();
globalThis.localStorage = { getItem: k => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)), removeItem: k => mem.delete(k) };

export function setup(role, school, L, partners = [], petMid = null, extra = {}) {
  newGame(role, 't');
  const S = G.S;
  S.breaks = 4;
  if (L > 1) gainExp([...Array(L - 1).keys()].reduce((s, l) => s + expNeed(l + 1), 0));
  S.school = school;
  if (school) { for (const id of [...SCHOOLS[school].skills, SCHOOLS[school].passive]) S.skills[id] = Math.max(1, L - 2); }
  const t = tierForLevel(L);
  for (const slot of ['weapon', 'helm', 'neck', 'armor', 'belt', 'boots']) S.equip[slot] = makeEquip(slot, t, ROLES[role].weapon, 0, extra.plus || 0);
  partners.forEach(p => recruit(p));
  if (petMid) addPet(makePet(petMid, L));
  if (extra.cult) for (const k in S.cult) S.cult[k] = extra.cult;
  fullHeal();
}
export function run(label, enemyFn, n = 200) {
  let w = 0, rounds = 0, hpLeft = 0;
  for (let i = 0; i < n; i++) {
    fullHeal();
    const B = { units: [...allyUnits(), ...layoutEnemies(enemyFn())], round: 1, canFlee: false };
    const o = simulate(B);
    if (o === 'win') { w++; const me = B.units[0]; hpLeft += me.hp / me.maxHp; }
    rounds += B.round;
  }
  const pct = w / n * 100;
  console.log(label.padEnd(46), 'win', pct.toFixed(0).padStart(3) + '%', 'rounds', (rounds / n).toFixed(1), 'hpLeft', (hpLeft / Math.max(1, w) * 100).toFixed(0) + '%');
  return pct;
}
const grp = (mids, L, k) => () => Array.from({ length: k }, (_, i) => enemyUnit(mids[i % mids.length], L));
const boss = id => () => BOSS_FIGHTS2[id].map(([m, l]) => enemyUnit(m, l));

if (process.argv[1].endsWith('balance-high.mjs')) {
  const team = ['wushuang', 'qinchuan', 'zixia'];
  const cases = [
    ['jxk', 'datang', 50, ['julishenyuan', 'changmei', 'tianjiang'], 'hunshi', 'julishenyuan'],
    ['ltz', 'longgong', 58, ['yecha', 'bangjing', 'jiaoren', 'guijiang'], 'jiutouchong', 'yecha'],
    ['hmr', 'pansi', 69, ['xuelang', 'bingyao', 'xueguai', 'fengbo'], 'jiaomowang', 'xuelang'],
    ['jmw', 'mowang', 78, ['huojing', 'niujiang', 'yanhu'], 'honghaier', 'yanhu'],
    ['xce', 'putuo', 88, ['huojing', 'niujiang', 'yanhu'], 'niumowang', 'niujiang'],
    ['ynx', 'nverer', 99, ['shujing', 'xiezi', 'zhizhunv', 'kuloujiang'], 'diyong', 'shujing'],
    ['jxk', 'datang', 110, ['yaobing', 'tianbing', 'leigong', 'jinjia'], 'pengmowang', 'jinjia'],
    ['ltz', 'tiangong', 118, ['yaobing', 'tianbing', 'leigong', 'jinjia'], 'shituowang', 'tianbing'],
    ['hmr', 'difu', 128, ['yinbing', 'gouhun', 'wuchang', 'youhun'], 'yurongwang', 'yinbing'],
    ['jmw', 'shituo', 138, ['yaoseng', 'jingang', 'mohou'], 'huangmei', 'jingang'],
    ['xys', 'huasheng', 147, ['yaoseng', 'jingang', 'mohou'], 'liuer', 'mohou'],
  ];
  for (const [role, school, L, mobs, b, pet] of cases) {
    setup(role, school, L, team, pet);
    run(`L${L} ${school}+3 vs 5 field L${L}`, grp(mobs, L, 5));
    run(`L${L} ${school}+3 vs 7 field L${L + 2}`, grp(mobs, L + 2, 7));
    run(`L${L} ${school}+3 vs BOSS ${b}`, boss(b), 120);
    setup(role, school, L, team, pet, { plus: 5, cult: Math.floor(L / 12) });
    run(`  +5强化 修炼${Math.floor(L / 12)} vs BOSS ${b}`, boss(b), 120);
  }
}
