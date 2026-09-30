// 敌方单位生成
import { MONSTERS, SKILLS } from './data.js';
import { monsterStats } from './stats.js';
import { mkUnit } from './battle-core.js';

export function enemyUnit(mid, level, opts = {}) {
  const m = MONSTERS[mid];
  const st = monsterStats(mid, level);
  if (opts.hpMul) st.maxHp = Math.floor(st.maxHp * opts.hpMul);
  if (opts.statMul) for (const k of ['atk', 'def', 'mpow', 'spd']) st[k] = Math.floor(st[k] * opts.statMul);
  const baby = !!opts.baby;
  if (baby) { st.maxHp = Math.floor(st.maxHp * 1.1); st.atk = Math.floor(st.atk * 1.1); }
  return mkUnit({
    side: 'enemy', kind: 'monster', mid, name: opts.name || (baby ? m.name + '宝宝' : m.name), level,
    hp: st.maxHp, maxHp: st.maxHp, mp: st.maxMp, maxMp: st.maxMp, atk: st.atk, def: st.def, spd: st.spd, mpow: st.mpow,
    skills: (m.skills || []).map(id => ({ id, lv: level })), traits: [...(m.traits || [])], look: m.look,
    ghost: !!m.ghost, boss: !!(m.boss || opts.boss), baby, enrage: !!(m.enrage || opts.enrage),
    catchable: !m.boss && !opts.boss && !opts.noCatch && m.pet !== undefined && m.pet < 900,
    ai: m.boss || opts.boss ? 'boss' : 'monster', exp: opts.exp, leader: !!opts.leader,
  });
}

export function layoutEnemies(units) {
  // 前排 0..4，后排 5..9
  const order = [2, 1, 3, 0, 4, 7, 6, 8, 5, 9];
  units.forEach((u, i) => { u.slot = order[i % 10] % 5; u.row = order[i % 10] >= 5 ? 'back' : 'front'; });
  return units;
}
export const skillName = id => SKILLS[id]?.name || id;
