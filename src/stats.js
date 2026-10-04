// 属性推导：角色、召唤兽、伙伴、怪物
import { RACES, ROLES, SCHOOLS, SKILLS, EQUIP_BASE, MONSTERS, PARTNERS, EQ_FX, tierForLevel } from './data.js';

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

// 装备强化：每强化一级，装备全部属性提升 7%
export const plusMul = plus => 1 + 0.07 * (plus || 0);
export function eqStats(e) {
  const m = plusMul(e.plus), out = {};
  for (const k in e.stats) out[k] = Math.round(e.stats[k] * m);
  return out;
}
export function equipSum(equip) {
  const sum = {};
  for (const k in equip) {
    const e = equip[k];
    if (!e || e.unid) continue;
    const st = eqStats(e);
    for (const x in st) sum[x] = (sum[x] || 0) + st[x];
  }
  return sum;
}

// 修炼：攻击/防御/法术修炼按百分比提升对应属性，抗法修炼减少受到的法术伤害。单机版修炼效果全队共享
export const CULT = [
  ['atk', '攻击修炼', '全队伤害 +2%/级'],
  ['def', '防御修炼', '全队防御 +2.5%/级'],
  ['mag', '法术修炼', '全队灵力 +2%/级（法术伤害与治疗）'],
  ['res', '抗法修炼', '全队受到的法术伤害 -1.5%/级'],
];
export const cultCap = level => Math.min(25, Math.floor(level / 6));
export function applyCult(st, cult) {
  if (!cult) return st;
  st.atk = Math.floor(st.atk * (1 + 0.02 * (cult.atk || 0)));
  st.def = Math.floor(st.def * (1 + 0.025 * (cult.def || 0)));
  st.mpow = Math.floor(st.mpow * (1 + 0.02 * (cult.mag || 0)));
  st.resist = 0.015 * (cult.res || 0);
  return st;
}

export function passiveBonus(school, skills) {
  const out = {};
  if (!school) return out;
  const p = SKILLS[SCHOOLS[school].passive];
  const lv = skills[SCHOOLS[school].passive] || 0;
  for (const k in p.bonus) out[k] = Math.floor(p.bonus[k] * lv);
  return out;
}

// 已穿戴装备的特效汇总：{ 特效id: 叠加后的数值 }
export function eqFxSum(equip) {
  const out = {};
  for (const k in equip || {}) {
    const e = equip[k];
    if (!e || e.unid) continue;
    for (const f of e.fx || []) { const d = EQ_FX[f]; if (d?.v) out[f] = Math.min(d.cap ?? 9, (out[f] || 0) + d.v); }
  }
  return out;
}
// 已穿戴装备带来的特技（去重）
export function eqTj(equip) {
  return [...new Set(Object.values(equip || {}).filter(e => e && !e.unid && e.tj && SKILLS[e.tj]).map(e => e.tj))];
}

export function playerStats(S) {
  const st = applyCult(derive(S.attr, S.level, equipSum(S.equip), passiveBonus(S.school, S.skills)), S.cult);
  const fx = eqFxSum(S.equip);
  if (fx.qiangti) st.maxHp = Math.floor(st.maxHp * (1 + fx.qiangti));
  if (fx.xunjie) st.spd = Math.floor(st.spd * (1 + fx.xunjie));
  return st;
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

// 伙伴星级：每星气血、伤害、防御、灵力 +10%，速度 +4%
export function partnerStats(id, level, star = 0, cult = null) {
  const p = PARTNERS[id];
  const sc = SCHOOLS[p.school];
  const attr = autoAttr(p.race, level, sc.build);
  const skills = { [sc.passive]: level };
  const eq = stdEquip(level);
  // 伙伴装备略低于标准
  for (const k in eq) eq[k] = Math.floor(eq[k] * 0.85);
  const st = derive(attr, level, eq, passiveBonus(p.school, skills));
  if (star) {
    for (const k of ['maxHp', 'atk', 'def', 'mpow']) st[k] = Math.floor(st[k] * (1 + 0.1 * star));
    st.spd = Math.floor(st.spd * (1 + 0.04 * star));
  }
  return applyCult(st, cult);
}

// 怪物基础曲线：55 级以后气血与伤害改为线性增长，与人物、装备的成长速度匹配
export function monsterBase(L) {
  const k = Math.min(L, 55), x = Math.max(0, L - 55);
  return {
    maxHp: Math.floor(45 + 11 * k + 0.4 * k * k + 36 * x),
    maxMp: Math.floor(40 + 6 * L),
    atk: Math.floor(20 + 6 * k + 0.04 * k * k + 7.5 * x),
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
    if (bo.mpowPct) out.mpow = Math.floor(out.mpow * (1 + bo.mpowPct));
    if (bo.hpPct) out.maxHp = Math.floor(out.maxHp * (1 + bo.hpPct));
  }
  // 属性点加成
  const pa = pet.points || {};
  out.maxHp += (pa.con || 0) * 6; out.maxMp += (pa.mag || 0) * 3; out.atk += Math.floor((pa.str || 0) * 1.0);
  out.def += Math.floor((pa.end || 0) * 1.5); out.spd += Math.floor((pa.agi || 0) * 0.8); out.mpow += Math.floor((pa.mag || 0) * 0.8);
  return out;
}

export function roleRace(role) { return ROLES[role].race; }
