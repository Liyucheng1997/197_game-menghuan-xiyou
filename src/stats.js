// 属性推导：角色、召唤兽、伙伴、怪物
import { RACES, ROLES, SCHOOLS, SKILLS, EQUIP_BASE, MONSTERS, PARTNERS, tierForLevel } from './data.js';

export function derive(attr, level, equipSum = {}, passive = {}) {
  const s = {
    maxHp: Math.floor(100 + attr.con * 5 + level * 4 + (equipSum.hp || 0) + (passive.hp || 0)),
    maxMp: Math.floor(80 + attr.mag * 3 + level * 2 + (equipSum.mp || 0) + (passive.mp || 0)),
    atk: Math.floor(20 + attr.str * 0.8 + (equipSum.atk || 0) + (passive.atk || 0)),
    def: Math.floor(attr.end * 1.4 + (equipSum.def || 0) + (passive.def || 0)),
    spd: Math.floor(attr.agi * 0.75 + (attr.str + attr.end + attr.con) * 0.1 + (equipSum.spd || 0) + (passive.spd || 0)),
    mpow: Math.floor(attr.mag * 0.7 + attr.con * 0.3 + attr.end * 0.2 + attr.str * 0.4 + (equipSum.mpow || 0) + (passive.mpow || 0)),
  };
  return s;
}

export function equipSum(equip) {
  const sum = {};
  for (const k in equip) {
    const e = equip[k];
    if (!e) continue;
    for (const st in e.stats) sum[st] = (sum[st] || 0) + e.stats[st];
  }
  return sum;
}

export function passiveBonus(school, skills) {
  const out = {};
  if (!school) return out;
  const p = SKILLS[SCHOOLS[school].passive];
  const lv = skills[SCHOOLS[school].passive] || 0;
  for (const k in p.bonus) out[k] = Math.floor(p.bonus[k] * lv);
  return out;
}

export function playerStats(S) {
  return derive(S.attr, S.level, equipSum(S.equip), passiveBonus(S.school, S.skills));
}

// 按加点方案自动生成某等级的属性（伙伴使用）
export function autoAttr(race, level, build) {
  const a = { ...RACES[race].base };
  for (const k in a) a[k] += level;
  const total = Object.values(build).reduce((x, y) => x + y, 0);
  let pts = level * 5 + 5;
  for (const k in build) a[k] += Math.floor(pts * build[k] / total);
  return a;
}

export function stdEquip(level) {
  const t = tierForLevel(level);
  const sum = {};
  for (const slot in EQUIP_BASE) {
    const st = EQUIP_BASE[slot](t);
    for (const k in st) sum[k] = (sum[k] || 0) + st[k];
  }
  return sum;
}

export function partnerStats(id, level) {
  const p = PARTNERS[id];
  const sc = SCHOOLS[p.school];
  const attr = autoAttr(p.race, level, sc.build);
  const skills = { [sc.passive]: level };
  const eq = stdEquip(level);
  // 伙伴装备略低于标准
  for (const k in eq) eq[k] = Math.floor(eq[k] * 0.85);
  return derive(attr, level, eq, passiveBonus(p.school, skills));
}

// 怪物基础曲线
export function monsterBase(L) {
  return {
    maxHp: Math.floor(45 + 11 * L + 0.4 * L * L),
    maxMp: Math.floor(40 + 6 * L),
    atk: Math.floor(20 + 6 * L + 0.04 * L * L),
    def: Math.floor(5 + 2.8 * L),
    spd: Math.floor(8 + 1.2 * L),
    mpow: Math.floor(12 + 3 * L),
  };
}
const MUL_KEYS = { hp: 'maxHp', atk: 'atk', def: 'def', spd: 'spd', mpow: 'mpow' };
export function monsterStats(mid, L) {
  const m = MONSTERS[mid];
  const b = monsterBase(L);
  for (const k in m.mul || {}) b[MUL_KEYS[k]] = Math.floor(b[MUL_KEYS[k]] * m.mul[k]);
  if (m.boss) { b.maxMp *= 3; }
  return b;
}

export function petStats(pet) {
  const m = MONSTERS[pet.mid];
  const b = monsterBase(pet.level);
  const g = pet.growth;
  const out = {
    maxHp: Math.floor(b.maxHp * 1.35 * g * (m.mul?.hp || 1)),
    maxMp: Math.floor(b.maxMp * 1.2 * g),
    atk: Math.floor(b.atk * 1.05 * g * (m.mul?.atk || 1)),
    def: Math.floor(b.def * 1.1 * g * (m.mul?.def || 1)),
    spd: Math.floor(b.spd * g * (m.mul?.spd || 1)),
    mpow: Math.floor(b.mpow * 1.05 * g * (m.mul?.mpow || 1)),
  };
  for (const t of pet.skills) {
    const bo = SKILLS[t]?.bonus;
    if (!bo) continue;
    if (bo.atkPct) out.atk = Math.floor(out.atk * (1 + bo.atkPct));
    if (bo.defPct) out.def = Math.floor(out.def * (1 + bo.defPct));
    if (bo.spdPct) out.spd = Math.floor(out.spd * (1 + bo.spdPct));
  }
  // 属性点加成
  const pa = pet.points || {};
  out.maxHp += (pa.con || 0) * 6; out.maxMp += (pa.mag || 0) * 3; out.atk += Math.floor((pa.str || 0) * 1.0);
  out.def += Math.floor((pa.end || 0) * 1.5); out.spd += Math.floor((pa.agi || 0) * 0.8); out.mpow += Math.floor((pa.mag || 0) * 0.8);
  return out;
}

export function roleRace(role) { return ROLES[role].race; }
