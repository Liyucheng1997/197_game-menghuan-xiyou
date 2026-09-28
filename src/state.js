// 存档状态：角色、背包、装备、召唤兽、伙伴
import { ROLES, RACES, SCHOOLS, SKILLS, MONSTERS, PARTNERS, EQUIP_BASE, EQUIP_NAMES, WEAPON_NAMES, RARITY,
  BAG_SIZE, PET_MAX, PARTY_MAX, MAX_LEVEL, expNeed, PET_TRAIT_POOL, PET_RARE_POOL } from './data.js';
import { playerStats, petStats, partnerStats } from './stats.js';
import { mkUnit } from './battle-core.js';
import { rand, randi, pick, shuffle } from './util.js';

const SAVE_KEY = 'mhxy-q-save-v2';
export const G = { S: null };
let uidSeq = Date.now() % 100000;
const nextUid = () => ++uidSeq;

export function newGame(role, name) {
  const race = ROLES[role].race;
  const attr = { ...RACES[race].base };
  for (const k in attr) attr[k] += 1;
  const S = {
    v: 2, name, role, school: null, level: 1, exp: 0, gold: 500, attr, free: 5,
    hp: 1, mp: 1, skills: {}, inv: [], equip: { weapon: null, helm: null, neck: null, armor: null, belt: null, boots: null },
    pets: [], petActive: -1, partners: [], party: [],
    map: 'jianye', x: 32, y: 27, dir: 'down',
    quests: { main: { step: 0, state: 'accept', progress: 0 }, school: null, ghost: null, treasure: null, shimenCount: 0, ghostCount: 0 },
    flags: {}, incense: 0, lastCmd: null, playTime: 0, kills: 0, title: '初出茅庐',
  };
  G.S = S;
  addItem('baozi', 5);
  addItem('zhenlu', 2);
  addItem('feixing', 2);
  const armor = makeEquip('armor', 0, null, 0);
  S.equip.armor = armor;
  S.equip.weapon = makeEquip('weapon', 0, ROLES[role].weapon, 0);
  autoAssign(S);
  fullHeal();
  return S;
}

export function save() {
  if (!G.S) return;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(G.S)); } catch (e) { /* 存储不可用 */ }
}
export function hasSave() {
  try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
}
export function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const S = JSON.parse(raw);
    if (!S || S.v !== 2 || !ROLES[S.role]) return null;
    G.S = S;
    return S;
  } catch (e) { return null; }
}
export function wipe() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* 忽略 */ } }

// ---------- 属性 ----------
export function stats() {
  const st = playerStats(G.S);
  G.S.hp = Math.min(G.S.hp, st.maxHp);
  G.S.mp = Math.min(G.S.mp, st.maxMp);
  return st;
}
export function fullHeal() {
  const st = playerStats(G.S);
  G.S.hp = st.maxHp; G.S.mp = st.maxMp;
  for (const p of G.S.pets) { const ps = petStats(p); p.hp = ps.maxHp; p.mp = ps.maxMp; }
}
export function autoAssign(S = G.S) {
  const build = S.school ? SCHOOLS[S.school].build : { str: 3, con: 2 };
  const total = Object.values(build).reduce((a, b) => a + b, 0);
  const pts = S.free;
  let used = 0;
  const keys = Object.keys(build);
  keys.forEach((k, i) => {
    const n = i === keys.length - 1 ? pts - used : Math.floor(pts * build[k] / total);
    S.attr[k] += n; used += n;
  });
  S.free = 0;
}

export function gainExp(amount) {
  const S = G.S;
  const out = { levels: 0 };
  if (S.level >= MAX_LEVEL) return out;
  S.exp += Math.floor(amount);
  while (S.level < MAX_LEVEL && S.exp >= expNeed(S.level)) {
    S.exp -= expNeed(S.level);
    S.level++;
    for (const k in S.attr) S.attr[k] += 1;
    S.free += 5;
    out.levels++;
  }
  if (out.levels) {
    if (S.flags.autoPoints !== false) autoAssign(S);
    const st = playerStats(S);
    S.hp = st.maxHp; S.mp = st.maxMp;
  }
  if (S.level >= MAX_LEVEL) S.exp = 0;
  return out;
}

export function petGainExp(pet, amount) {
  if (!pet) return 0;
  pet.exp += Math.floor(amount);
  let lv = 0;
  const cap = Math.min(MAX_LEVEL, G.S.level + 5);
  while (pet.level < cap && pet.exp >= expNeed(pet.level)) {
    pet.exp -= expNeed(pet.level);
    pet.level++; lv++;
  }
  if (pet.level >= cap) pet.exp = Math.min(pet.exp, expNeed(pet.level) - 1);
  if (lv) { const ps = petStats(pet); pet.hp = ps.maxHp; pet.mp = ps.maxMp; }
  return lv;
}

// ---------- 背包 ----------
export function countItem(id) { return G.S.inv.filter(e => e.id === id).reduce((s, e) => s + (e.n || 1), 0); }
export function bagFree() { return BAG_SIZE - G.S.inv.length; }
export function addItem(id, n = 1, extra) {
  const S = G.S;
  if (extra) { if (S.inv.length >= BAG_SIZE) return false; S.inv.push({ id, n: 1, ...extra }); return true; }
  const stack = S.inv.find(e => e.id === id && !e.data);
  if (stack) { stack.n += n; return true; }
  if (S.inv.length >= BAG_SIZE) return false;
  S.inv.push({ id, n });
  return true;
}
export function removeItem(id, n = 1) {
  const S = G.S;
  for (let i = S.inv.length - 1; i >= 0 && n > 0; i--) {
    const e = S.inv[i];
    if (e.id !== id) continue;
    const take = Math.min(e.n, n);
    e.n -= take; n -= take;
    if (e.n <= 0) S.inv.splice(i, 1);
  }
  return n === 0;
}
export function addEquip(eq) {
  if (G.S.inv.length >= BAG_SIZE) return false;
  G.S.inv.push({ id: 'equip', n: 1, eq });
  return true;
}

// ---------- 装备 ----------
const BONUS_AMT = { hp: t => 20 + t * 25, mp: t => 15 + t * 15, atk: t => 5 + t * 8, def: t => 4 + t * 6, spd: t => 2 + t * 3, mpow: t => 4 + t * 6 };
export function rollRarity(bias = 0) {
  const r = Math.random();
  if (r < 0.02 + bias * 0.5) return 3;
  if (r < 0.12 + bias) return 2;
  if (r < 0.4 + bias) return 1;
  return 0;
}
export function makeEquip(slot, tier, wtype, rarity = 0) {
  const base = EQUIP_BASE[slot](tier);
  const stats = {};
  const jitter = rarity === 0 ? 1 : 0.95 + Math.random() * 0.25;
  for (const k in base) stats[k] = Math.round(base[k] * jitter);
  const pool = shuffle(Object.keys(BONUS_AMT).filter(k => !(k in base)));
  for (let i = 0; i < rarity && i < pool.length; i++) stats[pool[i]] = Math.round(BONUS_AMT[pool[i]](tier) * rand(0.6, 1.2));
  const name = slot === 'weapon' ? WEAPON_NAMES[wtype][tier] : EQUIP_NAMES[slot][tier];
  return { uid: nextUid(), slot, tier, wtype: slot === 'weapon' ? wtype : null, name, stats, rarity, req: tier * 10, price: Math.floor(70 * (tier + 1) ** 2 * (1 + rarity * 0.6)) };
}
export function randomDrop(tier, bias = 0) {
  const slot = pick(['weapon', 'helm', 'neck', 'armor', 'belt', 'boots']);
  return makeEquip(slot, tier, ROLES[G.S.role].weapon, rollRarity(bias));
}
export function canEquip(eq) {
  if (G.S.level < eq.req) return '等级不足';
  if (eq.slot === 'weapon' && eq.wtype !== ROLES[G.S.role].weapon) return '无法使用该类武器';
  return null;
}
export function equipFromBag(index) {
  const S = G.S;
  const e = S.inv[index];
  if (!e || !e.eq) return '不是装备';
  const why = canEquip(e.eq);
  if (why) return why;
  const old = S.equip[e.eq.slot];
  S.equip[e.eq.slot] = e.eq;
  if (old) S.inv[index] = { id: 'equip', n: 1, eq: old }; else S.inv.splice(index, 1);
  stats();
  return null;
}
export function unequip(slot) {
  const S = G.S;
  if (!S.equip[slot]) return;
  if (!addEquip(S.equip[slot])) return '背包已满';
  S.equip[slot] = null;
  stats();
  return null;
}
export function rarityColor(r) { return RARITY[r || 0].color; }

// ---------- 召唤兽 ----------
export function makePet(mid, level, baby = false) {
  const m = MONSTERS[mid];
  const growth = +(baby ? rand(1.1, 1.24) : rand(0.92, 1.06)).toFixed(3);
  const skills = [...new Set([...(m.skills || []).filter(s => SKILLS[s]?.pet), ...(m.traits || [])])];
  const extra = baby ? randi(1, 2) : (Math.random() < 0.3 ? 1 : 0);
  const pool = shuffle(PET_TRAIT_POOL.filter(t => !skills.includes(t)));
  for (let i = 0; i < extra; i++) skills.push(pool[i]);
  if (baby && Math.random() < 0.3) skills.push(pick(PET_RARE_POOL.filter(t => !skills.includes(t))));
  const pet = { uid: nextUid(), mid, name: m.name, level, exp: 0, growth, baby, skills, hp: 1, mp: 1 };
  const ps = petStats(pet);
  pet.hp = ps.maxHp; pet.mp = ps.maxMp;
  return pet;
}
export function addPet(pet) {
  const S = G.S;
  if (S.pets.length >= PET_MAX) return false;
  S.pets.push(pet);
  if (S.petActive < 0) S.petActive = S.pets.length - 1;
  return true;
}
export function activePet() { const S = G.S; return S.petActive >= 0 ? S.pets[S.petActive] : null; }

// ---------- 伙伴 ----------
export function recruit(id) {
  const S = G.S;
  if (S.partners.includes(id)) return false;
  S.partners.push(id);
  if (S.party.length < PARTY_MAX) S.party.push(id);
  return true;
}
export function toggleParty(id) {
  const S = G.S;
  const i = S.party.indexOf(id);
  if (i >= 0) { S.party.splice(i, 1); return true; }
  if (S.party.length >= PARTY_MAX) return false;
  S.party.push(id);
  return true;
}

// ---------- 战斗单位 ----------
export function schoolActives(school, skills) {
  if (!school) return [];
  return SCHOOLS[school].skills.filter(id => (skills[id] || 0) > 0).map(id => ({ id, lv: skills[id] }));
}
const SLOT_ORDER = [2, 1, 3, 0, 4];
export function allyUnits() {
  const S = G.S;
  const st = stats();
  const units = [];
  const role = ROLES[S.role];
  const me = mkUnit({
    side: 'ally', kind: 'player', name: S.name, level: S.level, hp: Math.max(1, S.hp), maxHp: st.maxHp, mp: S.mp, maxMp: st.maxMp,
    atk: st.atk, def: st.def, spd: st.spd, mpow: st.mpow, skills: schoolActives(S.school, S.skills), traits: [],
    look: role.look, weapon: role.weapon, gender: role.gender, slot: 2, ai: S.school ? SCHOOLS[S.school].role : 'phys',
  });
  units.push(me);
  S.party.forEach((pid, i) => {
    const p = PARTNERS[pid];
    const ps = partnerStats(pid, S.level);
    const lvl = S.level;
    const sk = SCHOOLS[p.school].skills.map(id => ({ id, lv: lvl }));
    units.push(mkUnit({ side: 'ally', kind: 'partner', pid, name: p.name, level: lvl, hp: ps.maxHp, maxHp: ps.maxHp, mp: ps.maxMp, maxMp: ps.maxMp,
      atk: ps.atk, def: ps.def, spd: ps.spd, mpow: ps.mpow, skills: sk, traits: [], look: p.look, weapon: p.look.weapon, slot: SLOT_ORDER[i + 1], ai: SCHOOLS[p.school].role }));
  });
  const pet = activePet();
  if (pet && pet.hp > 0) units.push(petUnit(pet, me));
  return units;
}
export function petUnit(pet, owner) {
  const ps = petStats(pet);
  const m = MONSTERS[pet.mid];
  return mkUnit({ side: 'ally', kind: 'pet', petUid: pet.uid, name: pet.name, level: pet.level, hp: Math.max(1, Math.min(pet.hp, ps.maxHp)), maxHp: ps.maxHp, mp: Math.min(pet.mp, ps.maxMp), maxMp: ps.maxMp,
    atk: ps.atk, def: ps.def, spd: ps.spd, mpow: ps.mpow, skills: pet.skills.filter(s => SKILLS[s]?.kind !== 'trait').map(id => ({ id, lv: pet.level })),
    traits: pet.skills.filter(s => SKILLS[s]?.kind === 'trait'), look: m.look, mid: pet.mid, ghost: !!m.ghost, slot: owner.slot, ownerUid: owner.uid, row: 'back', ai: 'pet', baby: pet.baby });
}
export function syncFromBattle(units) {
  const S = G.S;
  const st = stats();
  const me = units.find(u => u.kind === 'player');
  if (me) { S.hp = Math.max(1, Math.min(st.maxHp, me.hp)); S.mp = Math.max(0, Math.min(st.maxMp, me.mp)); }
  for (const u of units) {
    if (u.kind !== 'pet') continue;
    const p = S.pets.find(x => x.uid === u.petUid);
    if (p) { p.hp = u.hp > 0 ? u.hp : Math.ceil(u.maxHp * 0.15); p.mp = Math.max(0, u.mp); }
  }
}
