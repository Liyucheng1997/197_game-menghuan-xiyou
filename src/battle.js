// 战斗场景：渲染、动画、指令
import { execute, aiAction, turnOrder, endRound, outcome, isAlive, canUse, targetType, skillMp, deadAlliesOf } from './battle-core.js';
import { SKILLS, ITEMS } from './data.js';
import { drawActor, drawChibi } from './art.js';
import { G, countItem, removeItem, petUnit } from './state.js';
import { tween, wait, ease, esc } from './util.js';
import { Audio2 } from './audio.js';
import { $, toast } from './ui.js';
import { vipLevel } from './mall.js';

export const fast = () => BT.active && vipLevel() >= 2 && !!G.S.flags.fastBattle;

const VW = 960, VH = 640;
export const BT = { active: false, B: null, bg: null, t: 0, fx: [], floats: [], phase: 'idle', auto: false, sel: null, shake: 0, flash: 0, intro: 0 };

function slotPos(u) {
  const k = (u.slot ?? 2) - 2;
  if (u.side === 'ally') {
    const x = 640 + k * 64, y = 405 - k * 44;
    return u.row === 'back' ? { x: x + 88, y: y + 72 } : { x, y };
  }
  const x = 320 + k * 64, y = 245 - k * 44;
  return u.row === 'back' ? { x: x - 88, y: y - 70 } : { x, y };
}
function initView(u) {
  const p = slotPos(u);
  u.v = { bx: p.x, by: p.y, x: p.x, y: p.y, pose: 'idle', flash: 0, alpha: 1, hpShow: u.hp, scale: u.boss ? 1.45 : u.kind === 'pet' ? 1.15 : 1.3, shake: 0 };
}

// ---------- 开始战斗 ----------
export function startBattle(B, bg, onEnd) {
  BT.B = B; BT.bg = bg; BT.onEnd = onEnd; BT.active = true; BT.fx = []; BT.floats = []; BT.phase = 'intro'; BT.intro = 0; BT.sel = null;
  BT.auto = !!G.S.flags.autoBattle;
  for (const u of B.units) initView(u);
  B.hooks = {
    useItem: id => removeItem(id, 1),
    onCatch: u => BT.onCatch?.(u),
    summon: (idx, owner) => {
      const pet = G.S.pets[idx];
      if (!pet || pet.hp <= 0 || G.S.petActive === idx) return null;
      G.S.petActive = idx;
      const nu = petUnit(pet, owner);
      initView(nu);
      return nu;
    },
  };
  Audio2.play('battle');
  Audio2.sfx('encounter');
  buildUI();
  tween(BT, { intro: 1 }, 650, ease.out).then(() => { BT.phase = 'command'; startRound(); });
}

// ---------- 界面 ----------
function buildUI() {
  const ui = $('#battle-ui');
  ui.innerHTML = `
    <div id="bt-top"><span id="bt-round">第 1 回合</span><button id="bt-auto" class="btn small">自动</button>${vipLevel() >= 2 ? '<button id="bt-fast" class="btn small">二倍速</button>' : ''}</div>
    <div id="bt-hint"></div>
    <div id="bt-cmd" class="hidden"><div id="bt-who"></div>
      <button data-c="attack">攻击<kbd>A</kbd></button><button data-c="skill">法术<kbd>W</kbd></button><button data-c="item">道具<kbd>E</kbd></button>
      <button data-c="defend">防御<kbd>D</kbd></button><button data-c="catch">捕捉<kbd>G</kbd></button><button data-c="summon">召唤<kbd>S</kbd></button>
      <button data-c="flee">逃跑<kbd>F</kbd></button></div>
    <div id="bt-pop" class="hidden"></div>
    <div id="bt-result" class="hidden"></div>`;
  ui.classList.remove('hidden');
  $('#bt-auto').onclick = () => toggleAuto();
  const fb = $('#bt-fast');
  if (fb) { const upd = () => fb.classList.toggle('on', !!G.S.flags.fastBattle); upd(); fb.onclick = () => { G.S.flags.fastBattle = !G.S.flags.fastBattle; upd(); }; }
  for (const b of ui.querySelectorAll('#bt-cmd button')) b.onclick = () => command(b.dataset.c);
  refreshAutoBtn();
}
function refreshAutoBtn() { const b = $('#bt-auto'); if (b) { b.classList.toggle('on', BT.auto); b.textContent = BT.auto ? '取消自动' : '自动'; } }
export function toggleAuto() {
  BT.auto = !BT.auto; G.S.flags.autoBattle = BT.auto; refreshAutoBtn();
  if (BT.auto && BT.phase === 'command' && BT.cmdResolve) { hideCmd(); autoCommands(); }
}
function hint(text) { const h = $('#bt-hint'); if (h) { h.textContent = text || ''; h.style.display = text ? 'block' : 'none'; } }

const player = () => BT.B.units.find(u => u.kind === 'player');
const myPet = () => BT.B.units.find(u => u.kind === 'pet' && u.side === 'ally' && !u.gone);
const canCommand = u => u && isAlive(u) && !u.status.seal && !u.status.rest && !u.status.charge;

async function startRound() {
  if (!BT.active) return;
  $('#bt-round').textContent = `第 ${BT.B.round} 回合`;
  BT.pending = {};
  const me = player();
  if (BT.auto) autoCommands();
  else {
    if (canCommand(me)) BT.pending.player = await ask('player');
    if (!BT.active) return;
    const pet2 = myPet();
    if (canCommand(pet2) && !(BT.pending.player && BT.pending.player.type === 'summon') && !BT.auto) BT.pending.pet = await ask('pet');
    if (BT.auto && !BT.pending.player && canCommand(me)) autoCommands();
  }
  if (!BT.active) return;
  await runRound();
}

function ask(who) {
  return new Promise(res => {
    BT.cmdFor = who;
    BT.cmdResolve = (a) => { BT.cmdResolve = null; hideCmd(); res(a); };
    showCmd(who);
  });
}
function showCmd(who) {
  const c = $('#bt-cmd');
  c.classList.remove('hidden');
  $('#bt-who').textContent = who === 'player' ? '人物指令' : '召唤兽指令';
  for (const b of c.querySelectorAll('button')) {
    const k = b.dataset.c;
    b.style.display = who === 'pet' && ['catch', 'summon', 'flee', 'item'].includes(k) ? 'none' : '';
  }
  hint(who === 'player' ? '请选择人物的行动' : '请选择召唤兽的行动');
}
function hideCmd() { $('#bt-cmd')?.classList.add('hidden'); $('#bt-pop')?.classList.add('hidden'); BT.sel = null; hint(''); }

function autoCommands() {
  const me = player();
  if (canCommand(me)) {
    const last = G.S.lastCmd;
    let a = null;
    // 自动战斗时，装备特技在队友倒地或残血时自动救场
    const emergency = aiAction(BT.B, me);
    if (emergency.type === 'skill' && SKILLS[emergency.skill]?.tj && ['revive', 'heal'].includes(SKILLS[emergency.skill].kind)) a = emergency;
    else if (last && last.type === 'skill' && canUse(me, last.skill).ok) {
      const tt = targetType(last.skill);
      a = { type: 'skill', skill: last.skill };
      if (tt === 'enemy') a.target = randomFoe();
      else if (tt === 'ally') a.target = lowestAlly();
      else if (tt === 'allyDead') { const d = deadAlliesOf(BT.B, me)[0]; a = d ? { ...a, target: d } : { type: 'attack', target: randomFoe() }; }
    }
    BT.pending.player = a || { type: 'attack', target: randomFoe() };
  }
  if (BT.cmdResolve && BT.cmdFor === 'player') BT.cmdResolve(BT.pending.player);
  else if (BT.cmdResolve && BT.cmdFor === 'pet') BT.cmdResolve(null);
}
const randomFoe = () => { const f = BT.B.units.filter(u => u.side === 'enemy' && isAlive(u)); return f[Math.floor(Math.random() * f.length)]; };
const lowestAlly = () => BT.B.units.filter(u => u.side === 'ally' && isAlive(u)).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];

function command(c) {
  if (!BT.cmdResolve) return;
  Audio2.sfx('click');
  const who = BT.cmdFor === 'player' ? player() : myPet();
  const pop = $('#bt-pop');
  pop.classList.add('hidden');
  switch (c) {
    case 'attack': select('enemy', t => ({ type: 'attack', target: t }), '选择攻击目标'); break;
    case 'defend': done({ type: 'defend' }); break;
    case 'flee': done({ type: 'flee' }); break;
    case 'catch': {
      if (BT.B.noCatch) { toast('此战斗无法捕捉'); return; }
      if (who.mp < 20) { toast('魔法不足20点'); return; }
      select('catch', t => ({ type: 'catch', target: t }), '选择要捕捉的目标（残血更容易成功）');
      break;
    }
    case 'skill': {
      const list = who.skills.filter(s => SKILLS[s.id] && !['passive', 'trait'].includes(SKILLS[s.id].kind));
      if (!list.length) { toast(G.S.school || who.kind === 'pet' ? '没有可用的法术' : '尚未拜师，没有法术'); return; }
      pop.innerHTML = '<div class="pop-title">法术</div>' + list.map(s => {
        const sk = SKILLS[s.id], ok = canUse(who, s.id);
        const left = sk.uses ? `剩${sk.uses - (who.used?.[s.id] || 0)}次 · ` : '';
        return `<button data-s="${s.id}" class="${sk.tj ? 'tj' : ''}" ${ok.ok ? '' : 'disabled'} title="${esc(sk.desc)}"><b>${sk.tj ? '✦' : ''}${sk.name}</b><small>${ok.ok ? left + '魔法 ' + skillMp(s.id, s.lv) : ok.why}</small></button>`;
      }).join('') + '<button class="pop-x">返回</button>';
      pop.classList.remove('hidden');
      pop.querySelector('.pop-x').onclick = () => pop.classList.add('hidden');
      for (const b of pop.querySelectorAll('button[data-s]')) b.onclick = () => {
        pop.classList.add('hidden');
        const id = b.dataset.s, tt = targetType(id);
        const mk = t => ({ type: 'skill', skill: id, target: t });
        if (tt === 'self' || tt === 'team') done(mk(who));
        else if (tt === 'ally') select('ally', mk, '选择' + SKILLS[id].name + '的目标');
        else if (tt === 'allyDead') select('allyDead', mk, '选择要复活的队友');
        else select('enemy', mk, '选择' + SKILLS[id].name + '的目标');
      };
      break;
    }
    case 'item': {
      const items = Object.keys(ITEMS).filter(id => ['food', 'revive'].includes(ITEMS[id].type) && countItem(id) > 0);
      if (!items.length) { toast('没有可用的道具'); return; }
      pop.innerHTML = '<div class="pop-title">道具</div>' + items.map(id => `<button data-i="${id}"><b>${ITEMS[id].icon} ${ITEMS[id].name}</b><small>×${countItem(id)}</small></button>`).join('') + '<button class="pop-x">返回</button>';
      pop.classList.remove('hidden');
      pop.querySelector('.pop-x').onclick = () => pop.classList.add('hidden');
      for (const b of pop.querySelectorAll('button[data-i]')) b.onclick = () => {
        pop.classList.add('hidden');
        const id = b.dataset.i;
        select(ITEMS[id].type === 'revive' ? 'allyDead' : 'ally', t => ({ type: 'item', id, target: t }), '选择使用对象');
      };
      break;
    }
    case 'summon': {
      const S = G.S;
      const list = S.pets.map((p, i) => ({ p, i })).filter(({ p, i }) => i !== S.petActive && p.hp > 0);
      if (!list.length) { toast('没有可召唤的召唤兽'); return; }
      pop.innerHTML = '<div class="pop-title">召唤</div>' + list.map(({ p, i }) => `<button data-p="${i}"><b>${esc(p.name)}</b><small>Lv${p.level}</small></button>`).join('') + '<button class="pop-x">返回</button>';
      pop.classList.remove('hidden');
      pop.querySelector('.pop-x').onclick = () => pop.classList.add('hidden');
      for (const b of pop.querySelectorAll('button[data-p]')) b.onclick = () => { pop.classList.add('hidden'); done({ type: 'summon', index: +b.dataset.p }); };
      break;
    }
  }
}
function done(a) {
  if (BT.cmdFor === 'player') {
    if (a.type === 'skill') G.S.lastCmd = { type: 'skill', skill: a.skill };
    else if (a.type === 'attack') G.S.lastCmd = { type: 'attack' };
  }
  BT.cmdResolve?.(a);
}
function select(kind, make, text) {
  BT.sel = { kind, make };
  hint(text + '（右键/Esc 取消）');
}
function validTarget(u, kind) {
  if (u.gone) return false;
  if (kind === 'enemy') return u.side === 'enemy' && isAlive(u);
  if (kind === 'catch') return u.side === 'enemy' && isAlive(u) && u.catchable;
  if (kind === 'ally') return u.side === 'ally' && isAlive(u);
  if (kind === 'allyDead') return u.side === 'ally' && u.hp <= 0;
  return false;
}
function unitAt(x, y) {
  let best = null, bd = 50;
  for (const u of BT.B.units) {
    if (u.gone) continue;
    const d = Math.hypot(u.v.x - x, u.v.y - 28 - y);
    if (d < bd) { bd = d; best = u; }
  }
  return best;
}
export function click(x, y) {
  if (!BT.active) return;
  if (BT.phase === 'result') { finish(); return; }
  if (!BT.sel) return;
  const u = unitAt(x, y);
  if (u && validTarget(u, BT.sel.kind)) { Audio2.sfx('click'); const a = BT.sel.make(u); BT.sel = null; done(a); }
  else if (u && BT.sel.kind === 'catch' && u.side === 'enemy') toast('这个目标无法捕捉');
}
export function cancel() {
  if (BT.sel) { BT.sel = null; showCmd(BT.cmdFor); return true; }
  const pop = $('#bt-pop'); if (pop && !pop.classList.contains('hidden')) { pop.classList.add('hidden'); return true; }
  return false;
}
export function key(k) {
  if (!BT.active) return;
  if (BT.phase === 'result' && (k === 'Enter' || k === ' ')) { finish(); return; }
  if (!BT.cmdResolve) { if (k === 'q' || k === 'Q') toggleAuto(); return; }
  const map = { a: 'attack', w: 'skill', e: 'item', d: 'defend', g: 'catch', s: 'summon', f: 'flee' };
  if (k === 'q' || k === 'Q') { toggleAuto(); return; }
  if (map[k.toLowerCase()]) command(map[k.toLowerCase()]);
  else if (k === 'Enter' && !BT.sel) command('attack');
}

// ---------- 回合执行 ----------
async function runRound() {
  BT.phase = 'anim';
  const B = BT.B;
  const order = turnOrder(B);
  for (const u of order) {
    if (!BT.active) return;
    if (!isAlive(u)) continue;
    let action;
    if (u.kind === 'player') action = BT.pending.player || { type: 'defend' };
    else if (u.kind === 'pet' && u.side === 'ally' && BT.pending.pet && u === myPet()) action = BT.pending.pet;
    else action = aiAction(B, u);
    const ev = execute(B, u, action);
    await play(ev);
    if (outcome(B)) break;
  }
  if (!outcome(B)) await play(endRound(B));
  else B.round++;
  const o = outcome(B);
  if (o) return end(o);
  BT.phase = 'command';
  startRound();
}

const FLEE_OUT = u => (u.side === 'ally' ? 1 : -1);
async function play(events) {
  for (const e of events) {
    if (!BT.active) return;
    const u = e.u;
    switch (e.t) {
      case 'shout':
        u.v.pose = 'cast';
        float(u, e.text, '#ffe45a', 20, -70);
        Audio2.sfx('magic');
        await wait(380);
        break;
      case 'approach': {
        const tg = e.tgt;
        const dx = tg.side === 'enemy' ? 46 : -46, dy = tg.side === 'enemy' ? 10 : -8;
        u.v.pose = 'walk';
        await tween(u.v, { x: tg.v.bx + dx, y: tg.v.by + dy }, e.fast ? 150 : 240, ease.inOut);
        break;
      }
      case 'swing':
        u.v.pose = 'attack'; u.v.swing = 0;
        Audio2.sfx('swing');
        await tween(u.v, { swing: 1 }, 110, ease.out);
        break;
      case 'hit':
        applyHit(e);
        await wait(e.poison ? 280 : 200);
        if (u.v.pose !== 'dead') u.v.pose = 'idle';
        break;
      case 'back':
        if (!isAlive(u)) break;
        u.v.pose = 'walk';
        await tween(u.v, { x: u.v.bx, y: u.v.by }, 220, ease.inOut);
        u.v.pose = 'idle';
        break;
      case 'fx':
        spawnFx(e.fx, e.tgts, u, true);
        await wait(90);
        break;
      case 'spell': {
        u.v.pose = 'cast';
        const tgts = e.list.map(x => x.u);
        const dur = spawnFx(e.fx, tgts, u);
        sfxFor(e.fx);
        await wait(dur);
        for (const it of e.list) {
          if (it.miss && !it.text) float(it.u, '未命中', '#ddd', 16);
          else if (it.text) float(it.u, it.text, it.color || '#a8ffb0', 17);
          if (it.heal) { float(it.u, '+' + it.heal, '#6aff7a', 22, it.text ? -20 : 0); it.u.v.hpShow = it.hp; if (it.revive) { it.u.v.pose = 'idle'; it.u.v.alpha = 1; } }
          if (it.dmg) applyHit({ u: it.u, dmg: it.dmg, crit: it.crit, hp: it.hp, dead: it.dead });
        }
        await wait(380);
        if (isAlive(u)) u.v.pose = 'idle';
        break;
      }
      case 'heal':
        float(u, '+' + e.amt, '#6aff7a', 18);
        u.v.hpShow = e.hp;
        await wait(180);
        break;
      case 'status':
        float(u, e.text, e.color || '#fff', 17, -60);
        await wait(360);
        break;
      case 'revive':
        u.v.pose = 'idle'; u.v.alpha = 1; u.v.hpShow = e.hp;
        spawnFx('holy', [u], u);
        float(u, e.text || '复活', '#ffe45a', 18, -60);
        await wait(500);
        break;
      case 'catch': {
        const tg = e.tgt;
        spawnFx('catch', [tg], u);
        Audio2.sfx('catch');
        await wait(600);
        if (e.ok) {
          float(tg, '捕捉成功！', '#ffe45a', 20, -60);
          await tween(tg.v, { alpha: 0, scale: 0.2, x: u.v.x, y: u.v.y - 30 }, 450, ease.in);
        } else float(tg, e.text || '捕捉失败', '#ccc', 18, -60);
        await wait(300);
        break;
      }
      case 'flee':
        u.v.pose = 'walk';
        if (e.ok) { float(u, '逃跑成功', '#fff', 18, -60); await tween(u.v, { x: u.v.x + FLEE_OUT(u) * 300, alpha: 0 }, 500, ease.in); }
        else { await tween(u.v, { x: u.v.x + 30 }, 180); float(u, '逃跑失败', '#ccc', 18, -60); await tween(u.v, { x: u.v.bx }, 180); u.v.pose = 'idle'; }
        break;
      case 'summon': {
        if (e.old) { await tween(e.old.v, { alpha: 0 }, 250); }
        u.v.alpha = 0;
        spawnFx('buffGold', [u], u);
        await tween(u.v, { alpha: 1 }, 350);
        float(u, '参战！', '#ffe45a', 18, -60);
        await wait(250);
        break;
      }
    }
  }
}
function applyHit(e) {
  const u = e.u;
  u.v.hpShow = e.hp;
  u.v.flash = 1; u.v.shake = 1;
  if (!e.self) u.v.pose = 'hurt';
  float(u, (e.crit ? '暴击 ' : '') + '-' + e.dmg, e.poison ? '#9aff5a' : e.crit ? '#ff9a2a' : '#ff5a4a', e.crit ? 28 : 22);
  Audio2.sfx(e.crit ? 'crit' : 'hit');
  if (e.crit) BT.shake = 1;
  if (e.dead) { setTimeout(() => { u.v.pose = 'dead'; if (u.side === 'enemy') tween(u.v, { alpha: u.status.ghostTimer > 0 ? 0.35 : 0 }, 500); }, 160); }
}
function float(u, text, color, size = 20, dy = 0) {
  BT.floats.push({ x: u.v.x + (Math.random() - 0.5) * 16, y: u.v.y - 70 * (u.v.scale / 1.3) + dy, text, color, size, t: 0 });
}
function sfxFor(fx) {
  const m = { fire: 'fire', thunder: 'thunder', water: 'water', dragon: 'water', heal: 'heal', holy: 'heal', seal: 'seal', charm: 'seal', curse: 'seal' };
  if (m[fx]) Audio2.sfx(m[fx]);
}

// ---------- 结束 ----------
async function end(o) {
  BT.phase = 'ending';
  await wait(400);
  const res = BT.onEnd ? BT.onEnd(o, BT.B) : null;
  if (o === 'win') Audio2.sfx('win');
  if (o === 'lose') Audio2.sfx('lose');
  if (o === 'flee') { finish(); return; }
  const r = $('#bt-result');
  const title = o === 'win' ? '战斗胜利' : '战斗失败';
  r.innerHTML = `<div class="res-box ${o}"><div class="res-title">${title}</div>${res?.html || ''}<div class="res-tip">点击任意处继续</div></div>`;
  r.classList.remove('hidden');
  BT.phase = 'result';
  if (BT.auto && o === 'win') BT.autoClose = setTimeout(() => { if (BT.phase === 'result') finish(); }, 2200);
}
function finish() {
  clearTimeout(BT.autoClose);
  BT.phase = 'idle';
  BT.active = false;
  const ui = $('#battle-ui');
  ui.classList.add('hidden'); ui.innerHTML = '';
  BT.afterClose?.();
}

// ---------- 特效 ----------
const FX_DUR = { slash: 260, claw: 260, thunder: 620, fire: 700, water: 720, dragon: 760, rock: 680, petal: 620, heal: 620, holy: 700, seal: 620, charm: 620, curse: 620, poison: 620, web: 620, dark: 700, light: 640, buffRed: 560, buffGold: 560, buffBlue: 560, catch: 600 };
function spawnFx(type, tgts, src, small) {
  const dur = small ? 220 : FX_DUR[type] || 600;
  BT.fx.push({ type, tgts: tgts.map(u => ({ x: u.v.x, y: u.v.y - 28 * (u.v.scale / 1.3) })), src: { x: src.v.x, y: src.v.y - 30 }, t: 0, dur, parts: [], small });
  if (['thunder', 'light', 'holy'].includes(type) && !small) BT.flash = 0.6;
  if (['thunder', 'rock', 'dragon'].includes(type) && !small) BT.shake = 0.8;
  return small ? 120 : Math.round(dur * 0.75);
}
function drawFx(ctx, f, dt) {
  f.t += dt;
  const r = Math.random;
  ctx.save();
  for (const [i, p] of f.tgts.entries()) {
    const d = Math.max(0, Math.min(1, (f.t - i * 40) / f.dur));
    switch (f.type) {
      case 'slash': case 'claw': {
        const n = f.type === 'claw' ? 3 : 2;
        for (let j = 0; j < n; j++) {
          ctx.strokeStyle = f.type === 'claw' ? `rgba(255,120,60,${1 - d})` : `rgba(230,245,255,${1 - d})`;
          ctx.lineWidth = 4 * (1 - d) + 1; ctx.lineCap = 'round';
          const off = (j - (n - 1) / 2) * 10;
          ctx.beginPath();
          if (f.type === 'claw') { ctx.moveTo(p.x - 18 + off, p.y - 22); ctx.lineTo(p.x - 18 + off + 36 * Math.min(1, d * 3), p.y - 22 + 40 * Math.min(1, d * 3)); }
          else { ctx.arc(p.x, p.y, 26 + off, -2.2 + j * 1.6, -2.2 + j * 1.6 + Math.min(1, d * 3) * 2.2); }
          ctx.stroke();
        }
        break;
      }
      case 'thunder': {
        if (Math.floor(f.t / 70) % 2 === 0 && d < 0.8) {
          ctx.strokeStyle = '#fff8a0'; ctx.lineWidth = 4; ctx.shadowColor = '#ffe860'; ctx.shadowBlur = 16;
          ctx.beginPath(); let x = p.x + (r() - 0.5) * 30, y = -10; ctx.moveTo(x, y);
          while (y < p.y) { y += 24; x += (r() - 0.5) * 28; ctx.lineTo(x, Math.min(y, p.y)); }
          ctx.stroke(); ctx.shadowBlur = 0;
        }
        if (d > 0.3 && f.parts.length < 30) f.parts.push({ x: p.x, y: p.y, vx: (r() - 0.5) * 240, vy: -r() * 200, c: '#ffe860', s: 2.5, life: 400 });
        break;
      }
      case 'fire': {
        const t1 = Math.min(1, d * 2.2);
        const fx = f.src.x + (p.x - f.src.x) * t1, fy = f.src.y + (p.y - f.src.y) * t1 - Math.sin(t1 * Math.PI) * 60;
        if (t1 < 1) { const g = ctx.createRadialGradient(fx, fy, 2, fx, fy, 18); g.addColorStop(0, '#fff6a0'); g.addColorStop(0.5, '#ff8a2a'); g.addColorStop(1, 'rgba(255,60,20,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(fx, fy, 18, 0, 7); ctx.fill(); }
        else if (f.parts.length < 60 * f.tgts.length) for (let j = 0; j < 4; j++) f.parts.push({ x: p.x + (r() - 0.5) * 40, y: p.y + 10, vx: (r() - 0.5) * 40, vy: -60 - r() * 120, c: r() < 0.5 ? '#ff7a2a' : '#ffd040', s: 4 + r() * 5, life: 500, grow: -6 });
        break;
      }
      case 'water': case 'dragon': {
        if (f.type === 'dragon' && d < 0.6) {
          const t1 = d / 0.6;
          for (let j = 0; j < 14; j++) { const tt = Math.max(0, t1 - j * 0.03); const x = f.src.x + (p.x - f.src.x) * tt, y = f.src.y + (p.y - f.src.y) * tt + Math.sin(tt * 12 + j) * 18; ctx.fillStyle = j === 0 ? '#e8f8ff' : `rgba(80,180,255,${1 - j / 14})`; ctx.beginPath(); ctx.arc(x, y, 11 - j * 0.6, 0, 7); ctx.fill(); }
        } else {
          if (f.parts.length < 50 * f.tgts.length && d < 0.7) for (let j = 0; j < 3; j++) f.parts.push({ x: p.x + (r() - 0.5) * 60, y: p.y - 120, vx: 0, vy: 420, c: 'rgba(150,210,255,.9)', s: 2, life: 300, line: true });
          ctx.strokeStyle = `rgba(120,200,255,${1 - d})`; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.ellipse(p.x, p.y + 26, 10 + d * 40, (10 + d * 40) * 0.35, 0, 0, 7); ctx.stroke();
          ctx.beginPath(); ctx.ellipse(p.x, p.y, 20 + d * 10, 30, d * 6, 0, 5); ctx.stroke();
        }
        break;
      }
      case 'rock': {
        const t1 = Math.min(1, d * 1.8);
        for (let j = 0; j < 3; j++) { const y = -40 + (p.y + 10 + 40) * Math.min(1, t1 + j * 0.1); ctx.fillStyle = '#8a7a6a'; ctx.strokeStyle = '#3a2a20'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(p.x - 16 + j * 16, y, 12, 10, j, 0, 7); ctx.fill(); ctx.stroke(); }
        if (t1 >= 1 && f.parts.length < 30 * f.tgts.length) for (let j = 0; j < 5; j++) f.parts.push({ x: p.x, y: p.y + 20, vx: (r() - 0.5) * 200, vy: -r() * 120, c: 'rgba(180,160,130,.8)', s: 5, life: 500 });
        break;
      }
      case 'petal': case 'charm': {
        const t1 = Math.min(1, d * 1.6);
        for (let j = 0; j < 7; j++) {
          const tt = Math.max(0, t1 - j * 0.05);
          const x = f.src.x + (p.x - f.src.x) * tt + Math.sin(j * 2 + f.t / 80) * 14, y = f.src.y + (p.y - f.src.y) * tt + Math.cos(j * 3 + f.t / 90) * 14;
          if (f.type === 'charm') { ctx.fillStyle = '#ff6aa8'; ctx.font = '18px sans-serif'; ctx.fillText('♥', x, y); }
          else { ctx.fillStyle = j % 2 ? '#ff9ac8' : '#ffd0e4'; ctx.beginPath(); ctx.ellipse(x, y, 5, 3, f.t / 100 + j, 0, 7); ctx.fill(); }
        }
        break;
      }
      case 'heal': case 'buffRed': case 'buffGold': case 'buffBlue': {
        const col = { heal: '120,255,140', buffRed: '255,110,80', buffGold: '255,220,90', buffBlue: '110,180,255' }[f.type];
        for (let j = 0; j < 3; j++) { const dd = (d + j * 0.25) % 1; ctx.strokeStyle = `rgba(${col},${1 - dd})`; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(p.x, p.y + 28 - dd * 70, 26, 8, 0, 0, 7); ctx.stroke(); }
        if (f.parts.length < 24 * f.tgts.length) f.parts.push({ x: p.x + (r() - 0.5) * 40, y: p.y + 20, vx: 0, vy: -70 - r() * 60, c: `rgba(${col},.95)`, s: 3, life: 600, plus: f.type === 'heal' });
        break;
      }
      case 'holy': case 'light': {
        const a = Math.sin(d * Math.PI);
        const g = ctx.createLinearGradient(p.x - 30, 0, p.x + 30, 0);
        const c = f.type === 'holy' ? '255,240,160' : '255,220,120';
        g.addColorStop(0, `rgba(${c},0)`); g.addColorStop(0.5, `rgba(${c},${a * 0.85})`); g.addColorStop(1, `rgba(${c},0)`);
        ctx.fillStyle = g; ctx.fillRect(p.x - 30, 0, 60, p.y + 40);
        if (f.parts.length < 20 * f.tgts.length) f.parts.push({ x: p.x + (r() - 0.5) * 50, y: p.y + 20, vx: 0, vy: -100, c: '#fff6c0', s: 2.5, life: 500 });
        break;
      }
      case 'seal': case 'curse': {
        const col = f.type === 'seal' ? '200,140,255' : '150,80,200';
        ctx.save(); ctx.translate(p.x, p.y + 26); ctx.scale(1, 0.4); ctx.rotate(d * 6);
        ctx.strokeStyle = `rgba(${col},${1 - d * 0.6})`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 0, 36, 0, 7); ctx.stroke();
        ctx.beginPath(); for (let j = 0; j < 6; j++) { const a = j / 6 * Math.PI * 2; ctx.lineTo(Math.cos(a * 2) * 34, Math.sin(a * 2) * 34); } ctx.closePath(); ctx.stroke();
        ctx.restore();
        if (f.type === 'seal') { ctx.fillStyle = `rgba(255,230,120,${1 - d})`; ctx.font = 'bold 26px KaiTi,serif'; ctx.textAlign = 'center'; ctx.fillText('封', p.x, p.y - 10 - d * 20); }
        break;
      }
      case 'poison': case 'dark': {
        if (f.parts.length < 30 * f.tgts.length) f.parts.push({ x: p.x + (r() - 0.5) * 50, y: p.y + 20, vx: (r() - 0.5) * 20, vy: -40 - r() * 50, c: f.type === 'poison' ? 'rgba(120,220,80,.8)' : 'rgba(90,40,120,.8)', s: 5 + r() * 6, life: 600, grow: 6, ring: f.type === 'poison' });
        if (f.type === 'dark') { ctx.fillStyle = `rgba(40,10,60,${Math.sin(d * Math.PI) * 0.5})`; ctx.beginPath(); ctx.ellipse(p.x, p.y, 44, 50, 0, 0, 7); ctx.fill(); }
        break;
      }
      case 'web': {
        ctx.strokeStyle = `rgba(255,255,255,${1 - d * 0.7})`; ctx.lineWidth = 1.2;
        const R = 40 * Math.min(1, d * 2);
        for (let j = 0; j < 8; j++) { const a = j / 8 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + Math.cos(a) * R, p.y + Math.sin(a) * R); ctx.stroke(); }
        for (const rr of [0.35, 0.7, 1]) { ctx.beginPath(); for (let j = 0; j <= 8; j++) { const a = j / 8 * Math.PI * 2; ctx.lineTo(p.x + Math.cos(a) * R * rr, p.y + Math.sin(a) * R * rr); } ctx.stroke(); }
        break;
      }
      case 'catch': {
        ctx.strokeStyle = `rgba(255,220,90,${1 - d * 0.5})`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(f.src.x, f.src.y); ctx.quadraticCurveTo((f.src.x + p.x) / 2, Math.min(f.src.y, p.y) - 80, p.x, p.y); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(p.x, p.y, 34 - d * 12, 40 - d * 12, 0, 0, 7); ctx.stroke();
        break;
      }
    }
  }
  // 粒子
  for (const q of f.parts) {
    q.life -= dt; if (q.life <= 0) continue;
    q.x += q.vx * dt / 1000; q.y += q.vy * dt / 1000; if (q.grow) q.s = Math.max(0.5, q.s + q.grow * dt / 1000);
    ctx.globalAlpha = Math.min(1, q.life / 300);
    if (q.line) { ctx.strokeStyle = q.c; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x, q.y + 14); ctx.stroke(); }
    else if (q.plus) { ctx.fillStyle = q.c; ctx.fillRect(q.x - 4, q.y - 1, 8, 2.5); ctx.fillRect(q.x - 1.2, q.y - 4, 2.5, 8); }
    else if (q.ring) { ctx.strokeStyle = q.c; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(q.x, q.y, q.s, 0, 7); ctx.stroke(); }
    else { ctx.fillStyle = q.c; ctx.beginPath(); ctx.arc(q.x, q.y, q.s, 0, 7); ctx.fill(); }
  }
  ctx.restore();
  return f.t < f.dur + 500;
}

// ---------- 绘制 ----------
export function update(dt) {
  if (!BT.active) return;
  BT.t += dt / 1000;
  for (const u of BT.B.units) { if (!u.v) initView(u); u.v.flash = Math.max(0, u.v.flash - dt / 250); u.v.shake = Math.max(0, u.v.shake - dt / 300); }
  BT.shake = Math.max(0, BT.shake - dt / 350);
  BT.flash = Math.max(0, BT.flash - dt / 400);
  for (const f of BT.floats) f.t += dt;
  BT.floats = BT.floats.filter(f => f.t < 1100);
  BT.dt = dt;
}
export function render(ctx) {
  if (!BT.active) return;
  const dt = BT.dt || 16;
  ctx.save();
  if (BT.shake > 0) ctx.translate((Math.random() - 0.5) * 10 * BT.shake, (Math.random() - 0.5) * 8 * BT.shake);
  // 背景
  if (BT.bg) ctx.drawImage(BT.bg, 0, 0);
  ctx.fillStyle = 'rgba(20,12,40,.25)'; ctx.fillRect(0, 0, VW, VH);
  const g = ctx.createRadialGradient(480, 330, 60, 480, 330, 420);
  g.addColorStop(0, 'rgba(255,240,200,.12)'); g.addColorStop(1, 'rgba(0,0,0,.35)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
  // 战场地面光圈
  ctx.strokeStyle = 'rgba(255,230,160,.18)'; ctx.lineWidth = 2;
  for (const [x, y] of [[320, 245], [690, 430]]) { ctx.beginPath(); ctx.ellipse(x, y + 10, 190, 80, -0.6, 0, 7); ctx.stroke(); }
  // 选择目标高亮
  const units = BT.B.units.filter(u => !u.gone || u.v.alpha > 0.02).slice().sort((a, b) => a.v.y - b.v.y);
  if (BT.sel) for (const u of units) if (validTarget(u, BT.sel.kind)) { ctx.strokeStyle = `rgba(255,230,90,${0.5 + Math.sin(BT.t * 8) * 0.4})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(u.v.x, u.v.y + 2, 30, 11, 0, 0, 7); ctx.stroke(); }
  for (const u of units) drawUnit(ctx, u);
  // 特效
  BT.fx = BT.fx.filter(f => drawFx(ctx, f, dt));
  // 血条
  for (const u of units) if (!u.gone && u.v.alpha > 0.5) drawBars(ctx, u);
  // 飘字
  for (const f of BT.floats) {
    const k = f.t / 1100;
    const y = f.y - Math.min(1, f.t / 250) * 26 - k * 10;
    ctx.globalAlpha = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1;
    const sc = f.t < 120 ? 1 + (1 - f.t / 120) * 0.6 : 1;
    ctx.font = `bold ${Math.round(f.size * sc)}px "Microsoft YaHei","PingFang SC",sans-serif`;
    ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(40,10,0,.9)';
    ctx.strokeText(f.text, f.x, y); ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, y);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  if (BT.flash > 0) { ctx.fillStyle = `rgba(255,255,240,${BT.flash * 0.5})`; ctx.fillRect(0, 0, VW, VH); }
  // 入场旋涡
  if (BT.intro < 1) {
    ctx.save();
    ctx.fillStyle = '#0a0612';
    const R = 700 * BT.intro;
    ctx.beginPath(); ctx.rect(0, 0, VW, VH); ctx.arc(480, 320, R, 0, Math.PI * 2, true); ctx.fill('evenodd');
    ctx.restore();
  }
}
function drawUnit(ctx, u) {
  const v = u.v;
  if (v.alpha <= 0.02) return;
  const shx = v.shake ? (Math.random() - 0.5) * 8 * v.shake : 0;
  const o = { t: BT.t + u.uid * 0.7, scale: v.scale, alpha: v.alpha, pose: v.pose === 'walk' ? 'idle' : v.pose, moving: v.pose === 'walk', swing: v.swing };
  ctx.save();
  if (u.status.seal > 0 && v.pose !== 'dead') { ctx.filter = 'grayscale(0.6)'; }
  const lk = u.look;
  if (!lk.shape || lk.shape === 'human') {
    drawChibi(ctx, v.x + shx, v.y, lk, { ...o, dir: u.side === 'ally' ? 'left' : 'right', weapon: u.weapon || lk.weapon });
  } else {
    drawActor(ctx, v.x + shx, v.y, lk, { ...o, flip: u.side === 'ally' });
  }
  ctx.filter = 'none';
  if (v.flash > 0) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = v.flash * 0.5;
    ctx.fillStyle = '#ff6040';
    ctx.beginPath(); ctx.ellipse(v.x, v.y - 30 * v.scale / 1.3, 26, 34, 0, 0, 7); ctx.fill();
  }
  ctx.restore();
  // 状态图标
  const icons = [];
  if (u.status.seal > 0) icons.push(['封', '#c080ff']);
  if (u.status.poison) icons.push(['毒', '#6ad040']);
  if (u.status.regen) icons.push(['愈', '#5ad07a']);
  if (u.status.rest > 0) icons.push(['歇', '#aaa']);
  if (u.status.charge) icons.push(['蓄', '#ff8040']);
  for (const k in u.status.buffs) { const b = u.status.buffs[k]; icons.push(b.pct > 0 ? ['↑', '#ffd040'] : ['↓', '#8080ff']); }
  if (icons.length && v.pose !== 'dead') {
    ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
    icons.slice(0, 5).forEach(([c, col], i) => { const x = v.x - (icons.length - 1) * 7 + i * 14, y = v.y + 16; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillText(c, x, y + 4); });
  }
}
function drawBars(ctx, u) {
  const v = u.v;
  const w = 46, x = v.x - w / 2, y = v.y - 72 * v.scale / 1.3 - 8;
  const hp = Math.max(0, v.hpShow) / u.maxHp;
  ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(x - 1, y - 1, w + 2, u.side === 'ally' ? 9 : 6);
  ctx.fillStyle = u.side === 'ally' ? '#e8403a' : '#d85a3a'; ctx.fillRect(x, y, w * hp, 4);
  if (u.side === 'ally') { ctx.fillStyle = '#3a8ae8'; ctx.fillRect(x, y + 4, w * Math.max(0, u.mp) / u.maxMp, 3); }
  ctx.font = '12px "Microsoft YaHei",sans-serif'; ctx.textAlign = 'center';
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.8)';
  const name = u.name + (u.side === 'enemy' ? ` Lv${u.level}` : '');
  ctx.strokeText(name, v.x, v.y + 32); ctx.fillStyle = u.side === 'ally' ? (u.kind === 'player' ? '#7dff7a' : '#ffe860') : u.boss ? '#ff7a5a' : u.baby ? '#ffd040' : '#ffffff';
  ctx.fillText(name, v.x, v.y + 32);
}
