// 回合制战斗核心逻辑（与渲染无关，可在 Node 中测试）
import { SKILLS, ITEMS } from './data.js';

let UID = 1;
export function mkUnit(o) {
  return { uid: UID++, gone: false, skills: [], traits: [], level: 1, ...o, status: { buffs: {}, seal: 0, rest: 0, defend: false, poison: null, regen: null, charge: null, ghostTimer: 0, revivedOnce: false, ...(o.status || {}) } };
}
export const isAlive = u => u.hp > 0 && !u.gone;
export const has = (u, t) => u.traits.includes(t);
// 普通/高级技能取较高的一档
const tier = (u, t, lo, hi) => (has(u, 'gj_' + t) ? hi : has(u, t) ? lo : 0);
// 装备特效数值（只有人物带装备特效）
export const fxv = (u, k) => u.efx?.[k] || 0;
export const enemiesOf = (B, u) => B.units.filter(x => x.side !== u.side && isAlive(x));
export const alliesOf = (B, u) => B.units.filter(x => x.side === u.side && isAlive(x));
export const deadAlliesOf = (B, u) => B.units.filter(x => x.side === u.side && !x.gone && x.hp <= 0);

export function buffMul(u, stat) {
  let m = 1;
  for (const k in u.status.buffs) { const b = u.status.buffs[k]; if (b.stat === stat) m *= 1 + b.pct; }
  return m;
}
export const eff = (u, stat) => u[stat] * buffMul(u, stat);

export function targetType(id) {
  const s = SKILLS[id];
  if (!s) return 'enemy';
  if (s.kind === 'buff') return s.target === 'team' ? 'team' : 'self';
  if (s.kind === 'heal' || s.kind === 'hot') return 'ally';
  if (s.kind === 'revive') return 'allyDead';
  return 'enemy';
}
export function skillMp(id, lv) { const s = SKILLS[id]; return s.mp ? s.mp(lv) : 0; }
export function skillLv(u, id) { const s = u.skills.find(x => x.id === id); return s ? s.lv : 0; }

export function canUse(u, id) {
  const lv = skillLv(u, id);
  const s = SKILLS[id];
  if (!lv || !s) return { ok: false, why: '未习得' };
  if (s.uses && (u.used?.[id] || 0) >= s.uses) return { ok: false, why: '次数已用完' };
  if (u.mp < skillMp(id, lv)) return { ok: false, why: '魔法不足' };
  if (s.hpReq && u.hp < u.maxHp * s.hpReq) return { ok: false, why: '气血不足' + Math.round(s.hpReq * 100) + '%' };
  return { ok: true };
}

function pickRandom(list, rng) { return list[Math.floor(rng() * list.length)]; }
function groupTargets(B, u, primary, n, rng, pool) {
  const out = primary && pool.includes(primary) ? [primary] : [];
  const rest = pool.filter(x => !out.includes(x));
  while (out.length < n && rest.length) out.push(rest.splice(Math.floor(rng() * rest.length), 1)[0]);
  return out;
}
function fixEnemyTarget(B, u, t, rng) {
  if (t && isAlive(t) && t.side !== u.side) return t;
  const f = enemiesOf(B, u);
  return f.length ? pickRandom(f, rng) : null;
}

// ---------- 伤害 ----------
export function physDamage(a, d, mult, rng, critBonus = 0, pierce = 0) {
  const atk = eff(a, 'atk'), def = eff(d, 'def') * (1 - Math.min(0.9, pierce + fxv(a, 'pojia')));
  let dmg = (atk - def * 0.75) * mult;
  dmg = Math.max(dmg, atk * mult * 0.1);
  dmg *= 0.92 + rng() * 0.16;
  let crit = false;
  if (rng() < 0.03 + tier(a, 'bisha', 0.2, 0.3) + (a.critUp || 0) + fxv(a, 'baoji') + critBonus) { dmg *= 1.6 + fxv(a, 'kuangbao'); crit = true; }
  if (d.status.defend) dmg *= 0.5;
  if (d.ghost && has(a, 'qugui')) dmg *= 1.3;
  return { dmg: Math.max(1, Math.round(dmg)), crit };
}
export function magicDamage(a, d, s, lv, rng) {
  const pow = eff(a, 'mpow');
  const lvTerm = s.pet ? lv * 1.0 : lv * 2.5;
  let dmg = (pow + lvTerm + (s.flat || 0)) * s.mult;
  if (a.kind === 'monster') dmg *= 0.6;
  dmg -= eff(d, 'mpow') * 0.35;
  dmg = Math.max(dmg, pow * s.mult * 0.12);
  dmg *= 0.95 + rng() * 0.1;
  if (d.ghost && s.vsGhost) dmg *= s.vsGhost;
  if (d.status.defend) dmg *= 0.75;
  if (d.resist) dmg *= 1 - d.resist;
  dmg *= 1 + fxv(a, 'fachuan');
  return Math.max(1, Math.round(dmg));
}
function healAmount(a, s, lv) {
  return Math.round(eff(a, 'mpow') * s.mult + lv * 3 + (s.flat || 0));
}

function clearStatus(u) {
  u.status.buffs = {}; u.status.seal = 0; u.status.rest = 0; u.status.poison = null; u.status.regen = null; u.status.charge = null; u.status.defend = false;
}
function onDeath(B, d, ev, info, rng) {
  clearStatus(d);
  const sy = Math.max(tier(d, 'shenyou', 0.25, 0.45), fxv(d, 'shenyou'));
  if (sy && rng() < sy) {
    d.hp = d.maxHp;
    ev.push({ t: 'revive', u: d, hp: d.hp, text: '神佑复生' });
    return;
  }
  if (has(d, 'guihun') && !d.status.revivedOnce && !info.noRevive) d.status.ghostTimer = 3;
}
function damage(B, d, dmg, ev, info, rng, list) {
  if (fxv(d, 'huti')) dmg = Math.max(1, Math.round(dmg * (1 - fxv(d, 'huti'))));
  d.hp = Math.max(0, d.hp - dmg);
  const e = { u: d, dmg, crit: !!info.crit, hp: d.hp, dead: d.hp <= 0 };
  if (list) list.push(e); else ev.push({ t: 'hit', ...e });
  if (d.hp <= 0) onDeath(B, d, ev, info, rng);
  else if (d.enrage && !d.status.enraged && d.hp < d.maxHp * 0.4) {
    // 首领残血狂暴：伤害与灵力大涨，直到战斗结束
    d.status.enraged = true;
    d.status.buffs.enrage = { stat: 'atk', pct: 0.35, turns: 99 };
    d.status.buffs.enrage2 = { stat: 'mpow', pct: 0.35, turns: 99 };
    ev.push({ t: 'status', u: d, text: '狂暴！', color: '#ff4a2a' });
  }
}
function heal(u, amt) {
  const before = u.hp;
  u.hp = Math.min(u.maxHp, u.hp + amt);
  return u.hp - before;
}

function meleeHit(B, a, d, mult, rng, ev, critBonus = 0, allowCounter = true, pierce = 0) {
  ev.push({ t: 'swing', u: a, tgt: d });
  const r = physDamage(a, d, mult, rng, critBonus, pierce);
  damage(B, d, r.dmg, ev, { crit: r.crit, noRevive: d.ghost && has(a, 'qugui') }, rng);
  // 反震：把一部分伤害弹回给攻击者
  if (allowCounter && isAlive(d) && isAlive(a) && fxv(d, 'fanzhen') && rng() < fxv(d, 'fanzhen')) {
    ev.push({ t: 'status', u: d, text: '反震', color: '#ffb040' });
    damage(B, a, Math.max(1, Math.round(r.dmg * 0.3)), ev, {}, rng);
  }
  const xx = tier(a, 'xixue', 0.25, 0.4) + fxv(a, 'xixue');
  if (xx && isAlive(a)) {
    const h = heal(a, Math.round(r.dmg * xx));
    if (h > 0) ev.push({ t: 'heal', u: a, amt: h, hp: a.hp });
  }
  if (has(a, 'du') && isAlive(d) && rng() < 0.3) {
    d.status.poison = { pct: 0.05, turns: 3 };
    ev.push({ t: 'status', u: d, text: '中毒', color: '#7ad84a' });
  }
  if (allowCounter && isAlive(d) && isAlive(a) && tier(d, 'fanji', 0.3, 0.45) && !d.status.seal && rng() < tier(d, 'fanji', 0.3, 0.45)) {
    ev.push({ t: 'status', u: d, text: '反击', color: '#ffb040' });
    meleeHit(B, d, a, 0.8, rng, ev, 0, false);
  }
  return r;
}

// ---------- 执行一个行动 ----------
export function execute(B, u, action, rng = Math.random) {
  const ev = [];
  if (!isAlive(u)) return ev;
  const st = u.status;
  if (st.rest > 0) { ev.push({ t: 'status', u, text: '休息', color: '#bbb' }); return ev; }
  if (st.seal > 0) { ev.push({ t: 'status', u, text: '封印中', color: '#d0a8ff' }); return ev; }
  if (st.charge) {
    const tgt = fixEnemyTarget(B, u, B.units.find(x => x.uid === st.charge.tgt), rng);
    const s = SKILLS.hfzr;
    st.charge = null;
    if (!tgt) return ev;
    ev.push({ t: 'shout', u, text: '后发制人' });
    ev.push({ t: 'approach', u, tgt });
    meleeHit(B, u, tgt, s.mult, rng, ev, 0.1);
    ev.push({ t: 'back', u });
    return ev;
  }
  switch (action.type) {
    case 'attack': return doAttack(B, u, action, rng, ev);
    case 'skill': return doSkill(B, u, action, rng, ev);
    case 'item': return doItem(B, u, action, rng, ev);
    case 'defend': st.defend = true; ev.push({ t: 'status', u, text: '防御', color: '#9ad0ff' }); return ev;
    case 'catch': return doCatch(B, u, action, rng, ev);
    case 'flee': return doFlee(B, u, action, rng, ev);
    case 'summon': return doSummon(B, u, action, rng, ev);
    default: return ev;
  }
}

function doAttack(B, u, action, rng, ev) {
  const tgt = fixEnemyTarget(B, u, action.target, rng);
  if (!tgt) return ev;
  ev.push({ t: 'approach', u, tgt });
  meleeHit(B, u, tgt, 1, rng, ev);
  const lj = tier(u, 'lianji', 0.35, 0.5) + fxv(u, 'lianji');
  if (isAlive(u) && isAlive(tgt) && lj && rng() < lj) {
    ev.push({ t: 'status', u, text: '连击', color: '#ffe060' });
    meleeHit(B, u, tgt, 0.75, rng, ev);
  }
  ev.push({ t: 'back', u });
  return ev;
}

function doSkill(B, u, action, rng, ev) {
  const id = action.skill;
  const s = SKILLS[id];
  const chk = canUse(u, id);
  if (!chk.ok) {
    ev.push({ t: 'status', u, text: chk.why, color: '#ff8080' });
    if (chk.why === '魔法不足' || chk.why === '次数已用完' || chk.why.startsWith('气血')) return doAttack(B, u, action, rng, ev);
    return ev;
  }
  const lv = skillLv(u, id);
  u.mp -= skillMp(id, lv);
  if (s.uses) { u.used ??= {}; u.used[id] = (u.used[id] || 0) + 1; }
  ev.push({ t: 'shout', u, text: s.name, mp: u.mp });
  const n = s.count ? s.count(lv) : 1;
  switch (s.kind) {
    case 'phys': {
      if (s.target === 'enemyGroup') {
        const tg = groupTargets(B, u, action.target, n, rng, enemiesOf(B, u));
        for (const t of tg) {
          if (!isAlive(u)) break;
          if (!isAlive(t)) continue;
          ev.push({ t: 'approach', u, tgt: t, fast: true, fx: s.fx });
          if (s.tj) ev.push({ t: 'fx', u, fx: s.fx, tgts: [t], small: true });
          meleeHit(B, u, t, s.mult, rng, ev, 0, true, s.pierce || 0);
        }
      } else {
        let t = fixEnemyTarget(B, u, action.target, rng);
        if (!t) break;
        ev.push({ t: 'approach', u, tgt: t, fx: s.fx });
        for (let i = 0; i < (s.hits || 1); i++) {
          if (!isAlive(u)) break;
          if (!isAlive(t)) { t = fixEnemyTarget(B, u, null, rng); if (!t) break; ev.push({ t: 'approach', u, tgt: t, fast: true }); }
          ev.push({ t: 'fx', u, fx: s.fx, tgts: [t], small: true });
          meleeHit(B, u, t, s.mult, rng, ev, 0, true, s.pierce || 0);
        }
      }
      ev.push({ t: 'back', u });
      if (s.rest && isAlive(u)) u.status.rest = 2;
      if (id === 'hsqj' && isAlive(u)) { const cost = Math.round(u.maxHp * 0.08); u.hp = Math.max(1, u.hp - cost); ev.push({ t: 'hit', u, dmg: cost, hp: u.hp, dead: false, self: true }); }
      break;
    }
    case 'magic': case 'true': case 'percent': {
      const pool = enemiesOf(B, u);
      let tg = s.target === 'enemyGroup' ? groupTargets(B, u, action.target, n, rng, pool) : [fixEnemyTarget(B, u, action.target, rng)].filter(Boolean);
      for (let rep = 0; rep < 2 && tg.length; rep++) {
      const list = [];
      const after = [];
      for (const t of tg) {
        let dmg, crit = false;
        if (s.kind === 'true') dmg = Math.round((eff(u, 'mpow') * s.mult + lv * 3 + s.flat) * (0.95 + rng() * 0.1));
        else if (s.kind === 'percent') {
          if (rng() > s.rate) { list.push({ u: t, dmg: 0, miss: true, hp: t.hp }); continue; }
          dmg = Math.min(Math.round(t.hp * s.pct * (t.boss ? 0.5 : 1)), lv * 25 + 150);
        } else {
          dmg = magicDamage(u, t, s, lv, rng);
          if (rng() < (has(u, 'fs_baoji') ? 0.15 : 0) + fxv(u, 'fabao')) { dmg = Math.round(dmg * 1.5); crit = true; }
        }
        if (rep) dmg = Math.round(dmg * 0.7);
        if (t.resist && s.kind === 'true') dmg = Math.round(dmg * (1 - t.resist));
        damage(B, t, Math.max(1, dmg), after, { crit, noRevive: t.ghost && !!s.vsGhost }, rng, list);
        if (isAlive(t) && s.poison && rng() < s.poison) { t.status.poison = { pct: s.poisonPct || 0.05, turns: 3 }; after.push({ t: 'status', u: t, text: '中毒', color: '#7ad84a' }); }
        if (isAlive(t) && s.slow) { t.status.buffs.slow = { stat: 'spd', pct: -s.slow, turns: 3 }; after.push({ t: 'status', u: t, text: '减速', color: '#a0a0ff' }); }
        if (s.drainMp) { const m = Math.min(t.mp, Math.round(dmg * s.drainMp)); t.mp -= m; u.mp = Math.min(u.maxMp, u.mp + m); }
      }
      ev.push({ t: 'spell', u, fx: s.fx, list });
      ev.push(...after);
      // 法术连击：再施放一次（七成威力）
      tg = tg.filter(isAlive);
      if (rep || s.kind !== 'magic' || !isAlive(u) || rng() >= (has(u, 'fs_lianji') ? 0.25 : 0) + fxv(u, 'falian')) break;
      ev.push({ t: 'status', u, text: '法术连击', color: '#ffe060' });
      }
      break;
    }
    case 'heal': case 'hot': {
      const allies = alliesOf(B, u);
      let tg;
      if (s.target === 'allyGroup') {
        const sorted = allies.slice().sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
        const prim = action.target && isAlive(action.target) && action.target.side === u.side ? action.target : sorted[0];
        tg = [prim, ...sorted.filter(x => x !== prim)].slice(0, n);
      } else tg = [action.target && isAlive(action.target) && action.target.side === u.side ? action.target : u];
      const amt = healAmount(u, s, lv);
      const list = [];
      for (const t of tg) {
        if (s.cleanse) { t.status.poison = null; t.status.seal = 0; }
        if (s.kind === 'heal') list.push({ u: t, heal: heal(t, amt + (s.pctHp ? Math.round(t.maxHp * s.pctHp) : 0)), hp: t.hp });
        else { t.status.regen = { amt, turns: s.turns }; list.push({ u: t, heal: 0, hp: t.hp, text: s.name }); }
      }
      ev.push({ t: 'spell', u, fx: s.fx, list, heal: true });
      break;
    }
    case 'revive': {
      const dead = deadAlliesOf(B, u);
      const t = action.target && dead.includes(action.target) ? action.target : dead[0];
      if (!t) { ev.push({ t: 'status', u, text: '无需复活', color: '#bbb' }); break; }
      const tg = s.all ? dead : [t];
      for (const x of tg) { x.hp = Math.round(x.maxHp * s.pct); x.status.ghostTimer = 0; }
      ev.push({ t: 'spell', u, fx: s.fx, list: tg.map(x => ({ u: x, heal: x.hp, hp: x.hp, revive: true })), heal: true });
      break;
    }
    case 'seal': {
      const t = fixEnemyTarget(B, u, action.target, rng);
      if (!t) break;
      let rate = s.rate + (lv - t.level) * 0.02;
      if (t.boss) rate *= 0.35;
      rate = Math.max(0.1, Math.min(0.92, rate));
      const ok = rng() < rate;
      if (ok) { t.status.seal = s.turns; t.status.charge = null; }
      ev.push({ t: 'spell', u, fx: s.fx, list: [{ u: t, dmg: 0, hp: t.hp, text: ok ? '封印' : '抵抗', color: ok ? '#d0a8ff' : '#ccc', miss: !ok }] });
      break;
    }
    case 'buff': {
      const tg = s.target === 'team' ? alliesOf(B, u) : [u];
      for (const t of tg) {
        t.status.buffs[id] = { stat: s.stat, pct: s.pct, turns: s.turns };
        if (s.spd) t.status.buffs[id + '_spd'] = { stat: 'spd', pct: s.spd, turns: s.turns };
      }
      ev.push({ t: 'spell', u, fx: s.fx, list: tg.map(t => ({ u: t, dmg: 0, hp: t.hp, text: s.name, color: '#ffd060' })), heal: true });
      break;
    }
    case 'debuff': {
      const t = fixEnemyTarget(B, u, action.target, rng);
      if (!t) break;
      for (const stat of s.stat) t.status.buffs[id + '_' + stat] = { stat, pct: -s.pct, turns: s.turns };
      ev.push({ t: 'spell', u, fx: s.fx, list: [{ u: t, dmg: 0, hp: t.hp, text: s.tj ? s.name : '破防', color: '#c080ff' }] });
      break;
    }
    case 'charge': {
      const t = fixEnemyTarget(B, u, action.target, rng);
      if (!t) break;
      u.status.charge = { tgt: t.uid };
      u.status.defend = true;
      ev.push({ t: 'status', u, text: '蓄力', color: '#ff9050' });
      break;
    }
  }
  return ev;
}

function doItem(B, u, action, rng, ev) {
  const it = ITEMS[action.id];
  if (!it || (B.hooks?.useItem && !B.hooks.useItem(action.id))) { ev.push({ t: 'status', u, text: '道具不足', color: '#bbb' }); return ev; }
  let t = action.target || u;
  ev.push({ t: 'shout', u, text: it.name });
  if (it.type === 'revive') {
    if (t.hp > 0 || t.gone) { const d = deadAlliesOf(B, u)[0]; if (!d) { ev.push({ t: 'status', u, text: '无效', color: '#bbb' }); return ev; } t = d; }
    t.hp = Math.round(t.maxHp * it.revive);
    t.status.ghostTimer = 0;
    ev.push({ t: 'spell', u, fx: 'holy', list: [{ u: t, heal: t.hp, hp: t.hp, revive: true }], heal: true });
    return ev;
  }
  if (!isAlive(t)) t = u;
  const list = [];
  if (it.hp) list.push({ u: t, heal: heal(t, it.hp), hp: t.hp });
  if (it.mp) { t.mp = Math.min(t.maxMp, t.mp + it.mp); list.push({ u: t, heal: 0, hp: t.hp, text: '魔法+' + it.mp, color: '#7ab8ff' }); }
  ev.push({ t: 'spell', u, fx: 'heal', list, heal: true });
  return ev;
}

function doCatch(B, u, action, rng, ev) {
  const t = action.target;
  if (!t || !isAlive(t) || !t.catchable) { ev.push({ t: 'status', u, text: '无法捕捉', color: '#bbb' }); return ev; }
  if (u.mp < 20) { ev.push({ t: 'status', u, text: '魔法不足', color: '#ff8080' }); return ev; }
  u.mp -= 20;
  const p = (0.3 + 0.6 * (1 - t.hp / t.maxHp)) * (t.baby ? 0.65 : 1);
  const ok = rng() < p;
  ev.push({ t: 'catch', u, tgt: t, ok });
  if (ok) {
    if (B.hooks?.onCatch && !B.hooks.onCatch(t)) { ev.pop(); ev.push({ t: 'catch', u, tgt: t, ok: false, text: '召唤兽已满' }); return ev; }
    t.gone = true;
  }
  return ev;
}

function doFlee(B, u, action, rng, ev) {
  const ok = B.canFlee !== false && rng() < 0.75;
  ev.push({ t: 'flee', u, ok });
  if (ok) B.fled = true;
  return ev;
}

function doSummon(B, u, action, rng, ev) {
  const nu = B.hooks?.summon?.(action.index, u);
  if (!nu) { ev.push({ t: 'status', u, text: '无法召唤', color: '#bbb' }); return ev; }
  const old = B.units.find(x => x.side === u.side && x.kind === 'pet' && x.ownerUid === u.uid && !x.gone);
  if (old) old.gone = true;
  nu.ownerUid = u.uid;
  nu.slot = old ? old.slot : u.slot;
  B.units.push(nu);
  ev.push({ t: 'summon', u: nu, old });
  return ev;
}

// ---------- AI ----------
function lowest(list) { return list.slice().sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0]; }
function strongest(list) { return list.slice().sort((a, b) => (b.atk + b.mpow) - (a.atk + a.mpow))[0]; }
function usable(u, ids) { return ids.filter(id => canUse(u, id).ok); }

export function aiAction(B, u, rng = Math.random) {
  const foes = enemiesOf(B, u), friends = alliesOf(B, u);
  if (!foes.length) return { type: 'defend' };
  const ids = u.skills.map(s => s.id).filter(id => SKILLS[id] && SKILLS[id].kind !== 'passive' && SKILLS[id].kind !== 'trait');
  const ok = usable(u, ids);
  const kinds = k => ok.filter(id => SKILLS[id].kind === k);
  const rndFoe = () => (rng() < 0.35 ? lowest(foes) : foes[Math.floor(rng() * foes.length)]);
  const role = u.ai || 'monster';
  // 装备特技：危急时优先救场
  const tjs = ok.filter(id => SKILLS[id].tj);
  if (tjs.length) {
    const dead = deadAlliesOf(B, u).filter(x => x.kind !== 'pet');
    const rv = tjs.find(id => SKILLS[id].kind === 'revive');
    if (dead.length && rv) return { type: 'skill', skill: rv, target: dead[0] };
    const hurt = friends.filter(x => x.hp < x.maxHp * 0.45);
    const hl = tjs.find(id => SKILLS[id].kind === 'heal');
    if (hurt.length && hl) return { type: 'skill', skill: hl, target: lowest(hurt) };
  }

  if (role === 'heal') {
    const dead = deadAlliesOf(B, u).filter(x => x.kind !== 'pet');
    const rev = kinds('revive')[0];
    if (dead.length && rev) return { type: 'skill', skill: rev, target: dead[0] };
    const hurt = friends.filter(x => x.hp < x.maxHp * 0.6);
    const heal = kinds('heal')[0] || kinds('hot')[0];
    if (hurt.length && heal) return { type: 'skill', skill: heal, target: lowest(hurt) };
    const hot = kinds('hot')[0];
    if (hot && friends.some(x => x.hp < x.maxHp * 0.85 && !x.status.regen) && rng() < 0.5) return { type: 'skill', skill: hot, target: lowest(friends) };
    const buff = kinds('buff')[0];
    if (buff && B.round <= 2 && !u.status.buffs[buff] && rng() < 0.6) return { type: 'skill', skill: buff };
  }
  if (role === 'seal') {
    const seal = kinds('seal')[0];
    const cand = foes.filter(x => !x.status.seal);
    if (seal && foes.length >= 2 && cand.length && rng() < 0.55) return { type: 'skill', skill: seal, target: strongest(cand) };
    const buff = kinds('buff')[0];
    if (buff && B.round <= 2 && !u.status.buffs[buff] && rng() < 0.5) return { type: 'skill', skill: buff };
  }
  if (role === 'phys') {
    const buff = kinds('buff')[0];
    if (buff && !u.status.buffs[buff] && rng() < 0.5) return { type: 'skill', skill: buff };
  }
  if (role === 'magic') {
    const buff = kinds('buff')[0];
    if (buff && !u.status.buffs[buff] && B.round <= 2 && rng() < 0.35) return { type: 'skill', skill: buff };
  }
  // 伤害技能
  const dmgSkills = ok.filter(id => ['phys', 'magic', 'true', 'percent'].includes(SKILLS[id].kind) || (SKILLS[id].kind === 'charge'));
  const group = dmgSkills.filter(id => SKILLS[id].target === 'enemyGroup');
  const single = dmgSkills.filter(id => SKILLS[id].target !== 'enemyGroup');
  let useRate = { phys: 0.8, magic: 0.9, seal: 0.7, heal: 0.6, pet: 0.6, monster: 0.35, boss: 0.65 }[role] ?? 0.4;
  if (dmgSkills.length && rng() < useRate) {
    if (foes.length >= 2 && group.length && rng() < 0.8) return { type: 'skill', skill: group[Math.floor(rng() * group.length)], target: rndFoe() };
    if (single.length) {
      const sk = single[Math.floor(rng() * single.length)];
      if (SKILLS[sk].kind === 'charge' && rng() < 0.6) return { type: 'attack', target: rndFoe() };
      return { type: 'skill', skill: sk, target: rndFoe() };
    }
    if (group.length) return { type: 'skill', skill: group[0], target: rndFoe() };
  }
  // 怪物/首领的封印、减益
  if ((role === 'boss' || role === 'monster') && rng() < (role === 'boss' ? 0.4 : 0.15)) {
    const other = kinds('seal').concat(kinds('debuff'));
    if (other.length) return { type: 'skill', skill: other[Math.floor(rng() * other.length)], target: rndFoe() };
  }
  return { type: 'attack', target: rndFoe() };
}

export function turnOrder(B, rng = Math.random) {
  return B.units.filter(isAlive).map(u => ({ u, s: eff(u, 'spd') * (0.9 + rng() * 0.2) })).sort((a, b) => b.s - a.s).map(x => x.u);
}

export function endRound(B, rng = Math.random) {
  const ev = [];
  for (const u of B.units) {
    if (u.gone) continue;
    const st = u.status;
    if (u.hp <= 0) {
      if (st.ghostTimer > 0 && --st.ghostTimer === 0) {
        st.revivedOnce = true;
        u.hp = Math.round(u.maxHp * 0.5);
        ev.push({ t: 'revive', u, hp: u.hp, text: '鬼魂复活' });
      }
      continue;
    }
    if (st.poison) {
      const dmg = Math.max(1, Math.round(Math.min(u.maxHp * st.poison.pct, u.boss ? 400 : 99999)));
      u.hp = Math.max(0, u.hp - dmg);
      ev.push({ t: 'hit', u, dmg, hp: u.hp, dead: u.hp <= 0, poison: true });
      if (u.hp <= 0) { onDeath(B, u, ev, {}, rng); continue; }
      if (--st.poison.turns <= 0) st.poison = null;
    }
    if (st.regen) {
      const h = heal(u, st.regen.amt);
      if (h > 0) ev.push({ t: 'heal', u, amt: h, hp: u.hp });
      if (--st.regen.turns <= 0) st.regen = null;
    }
    if (has(u, 'zaisheng') || has(u, 'gj_zaisheng')) { const h = heal(u, Math.round(has(u, 'gj_zaisheng') ? u.level * 4 + 30 : u.level * 1.5 + 10)); if (h > 0) ev.push({ t: 'heal', u, amt: h, hp: u.hp }); }
    if (has(u, 'mingsi') || has(u, 'gj_mingsi')) u.mp = Math.min(u.maxMp, u.mp + Math.round(has(u, 'gj_mingsi') ? u.level * 1.2 + 15 : u.level / 2 + 5));
    if (fxv(u, 'huichun')) { const h = heal(u, Math.round(u.maxHp * fxv(u, 'huichun'))); if (h > 0) ev.push({ t: 'heal', u, amt: h, hp: u.hp }); }
    if (fxv(u, 'mingxiang')) u.mp = Math.min(u.maxMp, u.mp + Math.round(u.maxMp * fxv(u, 'mingxiang')));
    if (st.seal > 0) st.seal--;
    if (st.rest > 0) st.rest--;
    st.defend = false;
    for (const k in st.buffs) if (--st.buffs[k].turns <= 0) delete st.buffs[k];
  }
  B.round++;
  return ev;
}

export function outcome(B) {
  if (B.fled) return 'flee';
  if (!B.units.some(u => u.side === 'enemy' && isAlive(u))) return 'win';
  if (!B.units.some(u => u.side === 'ally' && u.kind !== 'pet' && isAlive(u))) return 'lose';
  return null;
}

// 无界面快速模拟（用于平衡测试与自动战斗）
export function simulate(B, rng = Math.random, maxRounds = 30) {
  while (B.round <= maxRounds) {
    for (const u of turnOrder(B, rng)) {
      if (!isAlive(u)) continue;
      execute(B, u, aiAction(B, u, rng), rng);
      const o = outcome(B);
      if (o) return o;
    }
    endRound(B, rng);
    const o = outcome(B);
    if (o) return o;
  }
  return 'timeout';
}
