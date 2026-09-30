// 大地图场景：移动、镜头、NPC、传送、遇敌
import { getMap, findPath, walkable, mapRoute, MAP_NAMES } from './maps.js';
import { renderGround, objectSprite, T } from './mapart.js';
import { drawChibi, drawActor } from './art.js';
import { NPCS } from './npcs.js';
import { ROLES, PARTNERS, MONSTERS } from './data.js';
import { G, save, activePet } from './state.js';
import { clamp } from './util.js';
import { Audio2 } from './audio.js';
import { UI, banner, toast } from './ui.js';
import * as Game from './game.js';

export const VW = 960, VH = 640;
const SPEED = 175;
const groundCache = new Map();

export const W = {
  map: null, ground: null, statics: [], px: 0, py: 0, tx: 0, ty: 0, path: [], dir: 'down', moving: false, t: 0,
  cam: { x: 0, y: 0 }, trail: [], stepCount: 0, target: null, nav: null, clickFx: null, weather: [], hover: null, fade: 0, busy: false, keyDir: null,
};

export function enterMap(id, tx, ty, opts = {}) {
  const map = getMap(id);
  W.map = map;
  if (!groundCache.has(id)) groundCache.set(id, renderGround(map));
  W.ground = groundCache.get(id);
  W.statics = map.objs.map(o => {
    const s = objectSprite(o, map.theme);
    const anchored = o.type === 'house' || o.type === 'citywall';
    const bx = anchored || o.type === 'fence' || o.type === 'wreck' ? o.x * T : o.x * T + T / 2;
    const by = anchored ? o.y * T : o.type === 'fence' ? o.y * T + T / 2 : o.type === 'wreck' ? (o.y + o.h) * T : o.y * T + T - 4;
    const flat = ['bones', 'skull', 'shell', 'web', 'lotus'].includes(o.type);
    return { img: s.img, x: bx - s.ax, y: by - s.ay, sortY: flat ? -1 : (o.y + o.h) * T - (o.type === 'tree' ? 6 : 2), w: s.img.width, h: s.img.height, flat };
  });
  if (tx == null || !walkable(map, tx, ty)) {
    [tx, ty] = map.spawn;
    if (!walkable(map, tx, ty)) { const p = findPath(map, map.spawn[0], map.spawn[1], map.spawn[0], map.spawn[1]); if (p && p.length) [tx, ty] = p[p.length - 1]; }
  }
  W.tx = tx; W.ty = ty;
  W.px = tx * T + T / 2; W.py = ty * T + T / 2;
  W.path = []; W.moving = false; W.target = null; W.stepCount = 0;
  W.trail = Array.from({ length: 80 }, () => ({ x: W.px, y: W.py, dir: 'down' }));
  W.weather = [];
  G.S.map = id; G.S.x = tx; G.S.y = ty;
  if (G.S.unlocked) G.S.unlocked[id] = 1;
  Audio2.play(map.music);
  if (!opts.silent) banner(map.name, map.encounter ? `怪物等级 ${map.encounter.lv[0]}~${map.encounter.lv[1]}` : '');
  if (map.encounter && map.encounter.lv[0] > G.S.level + 4) toast(`<b style="color:#ff8a6a">此地妖怪强大，请小心行事！</b>`, 2600);
  snapCam();
  save();
  Game.onEnterMap?.(id);
  continueNav();
}

function snapCam() {
  const m = W.map;
  W.cam.x = clamp(W.px - VW / 2, 0, Math.max(0, m.w * T - VW));
  W.cam.y = clamp(W.py - VH / 2 - 20, 0, Math.max(0, m.h * T - VH));
}

// ---------- 导航 ----------
export function walkTo(tx, ty, then) {
  const p = findPath(W.map, W.tx, W.ty, tx, ty);
  if (!p) { toast('无法到达那里'); return false; }
  W.path = p;
  W.target = then || null;
  if (!p.length && then) arrive();
  return true;
}
export function navigate(target) {
  // target: {map, x, y} 或 {map, npc}
  W.nav = target;
  continueNav();
}
export function stopNav() { W.nav = null; }
function continueNav() {
  const nav = W.nav;
  if (!nav || !W.map) return;
  if (nav.map !== W.map.id) {
    const route = mapRoute(W.map.id, nav.map);
    if (!route || !route.length) { toast('找不到前往' + (MAP_NAMES[nav.map] || nav.map) + '的道路'); W.nav = null; return; }
    const e = route[0].exit;
    walkTo(e.x, e.y);
    return;
  }
  W.nav = null;
  if (nav.npc) {
    const n = findNpc(nav.npc);
    if (n) { approachNpc(n); return; }
  }
  if (nav.x != null) walkTo(nav.x, nav.y, nav.then ? { fn: nav.then } : null);
}
function findNpc(id) {
  return allNpcs().find(n => n.id === id);
}

export function allNpcs() {
  const list = W.map.npcs.map(n => ({ ...n, def: NPCS[n.id], kind: 'npc' }));
  for (const d of Game.dynNpcs(W.map.id)) list.push({ ...d, kind: 'dyn' });
  return list;
}
function approachNpc(n) {
  // 走到 NPC 旁边
  const opts = [[0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1], [0, 2], [2, 0], [-2, 0]];
  let best = null, bl = Infinity;
  if (Math.max(Math.abs(W.tx - n.x), Math.abs(W.ty - n.y)) <= 1) { W.path = []; W.target = { npc: n }; arrive(); return; }
  for (const [dx, dy] of opts) {
    const x = n.x + dx, y = n.y + dy;
    if (!walkable(W.map, x, y)) continue;
    const p = findPath(W.map, W.tx, W.ty, x, y);
    if (p && p.length < bl) { bl = p.length; best = p; }
  }
  if (!best) { toast('无法靠近'); return; }
  W.path = best; W.target = { npc: n };
  if (!best.length) arrive();
}
function arrive() {
  const tg = W.target; W.target = null;
  if (!tg) return;
  if (tg.npc) {
    const n = tg.npc;
    W.dir = faceTo(n.x * T + T / 2 - W.px, n.y * T + T / 2 - W.py);
    Game.interact(n);
  } else if (tg.fn) tg.fn();
}
function faceTo(dx, dy) { return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'); }

// ---------- 输入 ----------
export function click(sx, sy) {
  if (!W.map || W.busy) return;
  const wx = sx + W.cam.x, wy = sy + W.cam.y;
  W.nav = null;
  // NPC 命中
  const npcs = allNpcs();
  let hit = null, hd = Infinity;
  for (const n of npcs) {
    const cx = n.x * T + T / 2, cy = n.y * T + T - 4;
    if (wx > cx - 20 && wx < cx + 20 && wy > cy - 62 && wy < cy + 6) { const d = Math.abs(wy - cy + 25); if (d < hd) { hd = d; hit = n; } }
  }
  if (hit) { approachNpc(hit); W.clickFx = null; return; }
  const tx = Math.floor(wx / T), ty = Math.floor(wy / T);
  if (walkTo(tx, ty)) W.clickFx = { x: tx * T + T / 2, y: ty * T + T / 2, t: 0 };
}
export function hover(sx, sy) {
  if (!W.map) return;
  const wx = sx + W.cam.x, wy = sy + W.cam.y;
  W.hover = null;
  for (const n of allNpcs()) {
    const cx = n.x * T + T / 2, cy = n.y * T + T - 4;
    if (wx > cx - 20 && wx < cx + 20 && wy > cy - 62 && wy < cy + 6) { W.hover = n; break; }
  }
  document.getElementById('stage').style.cursor = W.hover ? 'pointer' : 'default';
}
export function keyMove(dir) { W.keyDir = dir; if (dir) W.nav = null; }

// ---------- 更新 ----------
export function update(dt) {
  if (!W.map) return;
  W.t += dt / 1000;
  const blocked = UI.dialogOpen || W.busy;
  if (!blocked && W.keyDir && !W.path.length) {
    const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[W.keyDir];
    if (walkable(W.map, W.tx + d[0], W.ty + d[1])) W.path = [[W.tx + d[0], W.ty + d[1]]];
    else W.dir = W.keyDir;
  }
  W.moving = false;
  if (!blocked && W.path.length) {
    let move = SPEED * dt / 1000;
    while (move > 0 && W.path.length) {
      const [nx, ny] = W.path[0];
      const gx = nx * T + T / 2, gy = ny * T + T / 2;
      const dx = gx - W.px, dy = gy - W.py, d = Math.hypot(dx, dy);
      if (d > 0.01) W.dir = faceTo(dx, dy);
      if (d <= move) {
        W.px = gx; W.py = gy; move -= d; W.path.shift();
        W.tx = nx; W.ty = ny;
        W.moving = true;
        if (onStep()) { move = 0; break; }
        if (!W.path.length) { arrive(); }
      } else { W.px += dx / d * move; W.py += dy / d * move; move = 0; W.moving = true; }
    }
    W.trail.push({ x: W.px, y: W.py, dir: W.dir });
    if (W.trail.length > 120) W.trail.shift();
  }
  // 镜头平滑
  const m = W.map;
  const cx = clamp(W.px - VW / 2, 0, Math.max(0, m.w * T - VW)), cy = clamp(W.py - VH / 2 - 20, 0, Math.max(0, m.h * T - VH));
  W.cam.x += (cx - W.cam.x) * Math.min(1, dt / 90);
  W.cam.y += (cy - W.cam.y) * Math.min(1, dt / 90);
  if (W.clickFx) { W.clickFx.t += dt; if (W.clickFx.t > 600) W.clickFx = null; }
  updateWeather(dt);
}

function onStep() {
  const S = G.S;
  S.x = W.tx; S.y = W.ty;
  // 传送点
  const ex = W.map.exits.find(e => e.x === W.tx && e.y === W.ty);
  if (ex) {
    W.path = [];
    Audio2.sfx('portal');
    const nav = W.nav;
    transition(() => { enterMap(ex.to, ex.tx, ex.ty); if (nav) { W.nav = nav; continueNav(); } });
    return true;
  }
  if (S.incense > 0) { S.incense--; if (S.incense === 0) toast('摄妖香的效果消失了'); }
  W.stepCount++;
  if (Game.checkEncounter(W.map, W.stepCount)) { W.path = []; W.stepCount = 0; return true; }
  return false;
}

export function transition(fn) {
  W.busy = true;
  const f = document.getElementById('fade');
  f.classList.add('on');
  setTimeout(() => { fn(); setTimeout(() => { f.classList.remove('on'); W.busy = false; }, 60); }, 260);
}

// ---------- 天气粒子 ----------
function updateWeather(dt) {
  const kind = W.map.weather;
  if (!kind) return;
  const max = { petal: 26, leaf: 18, bubble: 20, dust: 30, ember: 26, cloud: 8, snow: 40 }[kind] || 0;
  while (W.weather.length < max) W.weather.push(newParticle(kind, true));
  for (const p of W.weather) {
    p.x += p.vx * dt / 1000; p.y += p.vy * dt / 1000; p.a += p.va * dt / 1000; p.life -= dt;
    if (p.life <= 0 || p.y > VH + 20 || p.y < -30 || p.x < -30 || p.x > VW + 30) Object.assign(p, newParticle(kind, false));
  }
}
function newParticle(kind, init) {
  const r = Math.random;
  const p = { x: r() * VW, y: init ? r() * VH : -10, vx: 0, vy: 0, a: r() * 6, va: 0, life: 6000 + r() * 6000, s: 1 };
  if (kind === 'petal') Object.assign(p, { vx: 20 + r() * 30, vy: 25 + r() * 25, va: 2, s: 2 + r() * 2 });
  if (kind === 'leaf') Object.assign(p, { vx: 25 + r() * 25, vy: 20 + r() * 20, va: 1.5, s: 3 + r() * 2 });
  if (kind === 'dust') Object.assign(p, { x: init ? r() * VW : -10, y: r() * VH, vx: 60 + r() * 60, vy: 5 - r() * 10, s: 1 + r() * 1.5 });
  if (kind === 'bubble') Object.assign(p, { y: init ? r() * VH : VH + 10, vy: -20 - r() * 20, vx: 0, s: 2 + r() * 3 });
  if (kind === 'ember') Object.assign(p, { y: init ? r() * VH : VH + 10, vy: -15 - r() * 25, vx: -5 + r() * 10, s: 1.2 + r() * 1.6 });
  if (kind === 'snow') Object.assign(p, { vx: -10 + r() * 20, vy: 30 + r() * 30, s: 1.5 + r() * 2 });
  if (kind === 'cloud') Object.assign(p, { x: init ? r() * VW : -80, y: r() * VH, vx: 12 + r() * 10, vy: 0, s: 30 + r() * 30, life: 40000 });
  return p;
}
function drawWeather(ctx) {
  const kind = W.map.weather;
  for (const p of W.weather) {
    ctx.save(); ctx.translate(p.x, p.y);
    if (kind === 'petal') { ctx.rotate(p.a); ctx.fillStyle = 'rgba(255,170,200,.8)'; ctx.beginPath(); ctx.ellipse(0, 0, p.s, p.s * 0.6, 0, 0, 7); ctx.fill(); }
    else if (kind === 'leaf') { ctx.rotate(p.a); ctx.fillStyle = 'rgba(240,160,60,.75)'; ctx.beginPath(); ctx.ellipse(0, 0, p.s, p.s * 0.45, 0, 0, 7); ctx.fill(); }
    else if (kind === 'dust') { ctx.fillStyle = 'rgba(230,200,150,.5)'; ctx.fillRect(0, 0, p.s * 3, p.s); }
    else if (kind === 'bubble') { ctx.strokeStyle = 'rgba(220,245,255,.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, p.s, 0, 7); ctx.stroke(); }
    else if (kind === 'ember') { ctx.fillStyle = W.map.theme === 'underworld' || W.map.theme === 'web' ? 'rgba(150,180,255,.7)' : 'rgba(255,160,60,.75)'; ctx.beginPath(); ctx.arc(0, 0, p.s, 0, 7); ctx.fill(); }
    else if (kind === 'snow') { ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(0, 0, p.s, 0, 7); ctx.fill(); }
    else if (kind === 'cloud') { ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(0, 0, p.s, p.s * 0.4, 0, 0, 7); ctx.fill(); }
    ctx.restore();
  }
}

// ---------- 绘制 ----------
export function render(ctx, opts = {}) {
  if (!W.map) return;
  const cx = Math.round(W.cam.x), cy = Math.round(W.cam.y);
  ctx.fillStyle = '#1a1410'; ctx.fillRect(0, 0, VW, VH);
  ctx.drawImage(W.ground, cx, cy, VW, VH, 0, 0, VW, VH);
  ctx.save();
  ctx.translate(-cx, -cy);
  const t = W.t;
  // 水面闪光
  // 传送圈
  if (!opts.noActors) for (const e of W.map.exits) drawPortal(ctx, e.x * T + T / 2, e.y * T + T / 2, t, e.label);
  // 点击标记
  if (W.clickFx) { const k = W.clickFx.t / 600; ctx.strokeStyle = `rgba(255,240,120,${1 - k})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(W.clickFx.x, W.clickFx.y + 8, 6 + k * 14, (6 + k * 14) * 0.45, 0, 0, 7); ctx.stroke(); }
  // 可见范围
  const vx0 = cx - 120, vx1 = cx + VW + 120, vy0 = cy - 60, vy1 = cy + VH + 180;
  const items = [];
  for (const s of W.statics) {
    if (s.x > vx1 || s.x + s.w < vx0 || s.y > vy1 || s.y + s.h < vy0) continue;
    if (s.flat) ctx.drawImage(s.img, s.x, s.y); else items.push({ y: s.sortY, s });
  }
  const S = G.S;
  const npcs = allNpcs();
  for (const n of opts.noActors ? [] : npcs) {
    const x = n.x * T + T / 2, y = n.y * T + T - 4;
    if (x < vx0 || x > vx1 || y < vy0 || y > vy1) continue;
    items.push({ y: y, npc: n, x });
  }
  // 跟随者（伙伴、召唤兽）
  const followers = [];
  S.party.forEach(pid => followers.push({ look: PARTNERS[pid].look, weapon: PARTNERS[pid].look.weapon, name: PARTNERS[pid].name }));
  const pet = activePet();
  if (pet) followers.push({ look: MONSTERS[pet.mid].look, pet: true, name: pet.name });
  if (!opts.noActors) followers.forEach((f, i) => {
    const tr = W.trail[Math.max(0, W.trail.length - 1 - (i + 1) * 13)];
    items.push({ y: tr.y + T / 2 - 4 - 0.1, follower: f, x: tr.x, fy: tr.y + T / 2 - 4, dir: tr.dir });
  });
  if (!opts.noActors) items.push({ y: W.py + T / 2 - 4, player: true });
  items.sort((a, b) => a.y - b.y);
  const role = ROLES[S.role];
  for (const it of items) {
    if (it.s) ctx.drawImage(it.s.img, it.s.x, it.s.y);
    else if (it.player) {
      drawChibi(ctx, W.px, W.py + T / 2 - 4, role.look, { dir: W.dir, t, moving: W.moving, weapon: role.weapon });
      nameTag(ctx, W.px, W.py + T / 2 + 10, S.name, (S.mall?.spent || 0) >= 12000 ? '#ffd040' : '#7dff7a', S.title !== '初出茅庐' ? S.title : null);
    } else if (it.follower) {
      const f = it.follower;
      const mv = W.moving;
      if (f.pet) drawActor(ctx, it.x, it.fy, f.look, { t, flip: it.dir === 'left', dir: it.dir, moving: mv, scale: 0.75 });
      else drawChibi(ctx, it.x, it.fy, f.look, { dir: it.dir, t: t + 0.3, moving: mv, weapon: f.weapon });
    } else if (it.npc) drawNpc(ctx, it.npc, it.x, it.y, t);
  }
  ctx.restore();
  // 黑暗/氛围
  if (W.map.dark) {
    const g = ctx.createRadialGradient(W.px - cx, W.py - cy, 60, W.px - cx, W.py - cy, 420);
    g.addColorStop(0, 'rgba(0,0,10,0)'); g.addColorStop(1, `rgba(0,0,15,${W.map.dark + 0.25})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
  }
  if (!opts.noActors) drawWeather(ctx);
}

function drawNpc(ctx, n, x, y, t) {
  const def = n.def || {};
  const look = n.look || def.look;
  const hov = W.hover && W.hover.id === n.id;
  if (n.kind === 'dyn') {
    // 任务目标：脚下红色光环
    ctx.strokeStyle = `rgba(255,80,60,${0.5 + Math.sin(t * 5) * 0.3})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(x, y, 20, 7, 0, 0, 7); ctx.stroke();
  }
  if (look.shape && look.shape !== 'human') drawActor(ctx, x, y, look, { t: t + n.x, scale: n.scale || 1, flip: true });
  else drawChibi(ctx, x, y, look, { dir: n.dir || 'down', t: t + n.x * 0.37, weapon: look.weapon, scale: n.scale || 1 });
  const name = n.name || def.name;
  nameTag(ctx, x, y + 14, name, n.kind === 'dyn' ? '#ff9a7a' : '#ffe860', n.title || def.title, hov);
  const mark = Game.questMark(n);
  if (mark) {
    const by = y - 70 - Math.abs(Math.sin(t * 4)) * 5 - ((look.hairStyle && ['dragon', 'demon', 'fox', 'bull', 'helmet', 'topknot'].includes(look.hairStyle)) ? 8 : 0);
    ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center';
    ctx.lineWidth = 4; ctx.strokeStyle = '#5a2a00'; ctx.strokeText(mark, x, by);
    ctx.fillStyle = mark === '!' ? '#ffd23a' : '#7ae0ff'; ctx.fillText(mark, x, by);
  }
}

export function nameTag(ctx, x, y, name, color, title, hl) {
  ctx.font = '13px "Microsoft YaHei","PingFang SC",sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (title) {
    ctx.font = '11px "Microsoft YaHei","PingFang SC",sans-serif';
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.75)'; ctx.strokeText(title, x, y);
    ctx.fillStyle = '#8ad8ff'; ctx.fillText(title, x, y);
    y += 14;
    ctx.font = '13px "Microsoft YaHei","PingFang SC",sans-serif';
  }
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.8)'; ctx.strokeText(name, x, y);
  ctx.fillStyle = hl ? '#ffffff' : color; ctx.fillText(name, x, y);
  ctx.textBaseline = 'alphabetic';
}

function drawPortal(ctx, x, y, t, label) {
  ctx.save();
  ctx.translate(x, y + 6);
  ctx.scale(1, 0.45);
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = `rgba(${120 + i * 40},${220 - i * 20},255,${0.75 - i * 0.2})`;
    ctx.lineWidth = 4 - i;
    ctx.beginPath(); ctx.arc(0, 0, 22 - i * 6, t * (2 + i) + i, t * (2 + i) + i + Math.PI * 1.4); ctx.stroke();
  }
  const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 26); g.addColorStop(0, 'rgba(160,230,255,.6)'); g.addColorStop(1, 'rgba(80,160,255,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 26, 0, 7); ctx.fill();
  ctx.restore();
  for (let i = 0; i < 4; i++) { const a = t * 1.5 + i * 1.57; ctx.fillStyle = 'rgba(200,240,255,.8)'; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 14, y + 4 - ((t * 30 + i * 12) % 40), 1.8, 0, 7); ctx.fill(); }
  nameTag(ctx, x, y - 30, label, '#9ae8ff');
}

// 当前视图快照（用于战斗背景）
export function snapshot() {
  const raw = document.createElement('canvas'); raw.width = VW; raw.height = VH;
  render(raw.getContext('2d'), { noActors: true });
  const c = document.createElement('canvas'); c.width = VW; c.height = VH;
  const g = c.getContext('2d');
  g.filter = 'blur(3px) brightness(0.62) saturate(0.85)';
  g.drawImage(raw, 0, 0);
  g.filter = 'none';
  return c;
}

export function minimap(size = 420) {
  const m = W.map;
  const sc = size / Math.max(m.w * T, m.h * T);
  const c = document.createElement('canvas'); c.width = Math.ceil(m.w * T * sc); c.height = Math.ceil(m.h * T * sc);
  const g = c.getContext('2d');
  g.drawImage(W.ground, 0, 0, c.width, c.height);
  for (const s of W.statics) { if (!s.flat) g.drawImage(s.img, s.x * sc, s.y * sc, s.w * sc, s.h * sc); }
  return { canvas: c, scale: sc };
}
