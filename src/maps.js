// 地图定义：用构建器生成地块、建筑、NPC 与出口
import { seeded, hashStr } from './util.js';
import { TILE, BLOCKED } from './mapart.js';
import { SCHOOLS } from './data.js';

const { GRASS, ROAD, STONE, WATER, SAND, WOOD, DEEP, ROCK, FLOWER, BRIDGE, DARK, CAVE, LAVA, CLOUD, WALL } = TILE;
const NONBLOCK_PROPS = new Set(['bones', 'skull', 'shell', 'web', 'cloud', 'lotus']);
const REMOVABLE = new Set(['tree', 'bush', 'rock', 'stump', 'crate', 'barrel', 'haystack', 'flowerpot', 'coral', 'crystal', 'bluefire', 'torch', 'stonelamp', 'lantern', 'fence']);

class MB {
  constructor(id, name, w, h, o = {}) {
    Object.assign(this, { id, name, w, h, theme: o.theme || 'town', music: o.music || 'changan', spawn: o.spawn || [Math.floor(w / 2), Math.floor(h / 2)], encounter: o.encounter || null, city: !!o.city, dark: o.dark || 0, weather: o.weather || null });
    this.tiles = new Uint8Array(w * h).fill(o.base ?? GRASS);
    this.objs = []; this.npcs = []; this.exits = []; this.reserved = []; this.points = [];
    this.rnd = seeded(hashStr(id) + 7);
  }
  in(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  set(x, y, t) { if (this.in(x, y)) this.tiles[y * this.w + x] = t; }
  get(x, y) { return this.in(x, y) ? this.tiles[y * this.w + x] : -1; }
  fill(x, y, w, h, t) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, t); return this; }
  circle(cx, cy, rx, ry, t, jit = 0) {
    for (let y = Math.floor(cy - ry - 2); y <= cy + ry + 2; y++) for (let x = Math.floor(cx - rx - 2); x <= cx + rx + 2; x++) {
      const a = Math.atan2(y - cy, x - cx);
      const k = 1 + jit * Math.sin(a * 3 + cx) * 0.5 + jit * Math.cos(a * 5 + cy) * 0.3;
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= k * k) this.set(x, y, t);
    }
    return this;
  }
  path(pts, width, t, over) {
    const r = width / 2;
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
      for (let y = Math.floor(Math.min(ay, by) - r - 1); y <= Math.max(ay, by) + r + 1; y++) for (let x = Math.floor(Math.min(ax, bx) - r - 1); x <= Math.max(ax, bx) + r + 1; x++) {
        const dx = bx - ax, dy = by - ay;
        const tt = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
        if (Math.hypot(x - ax - dx * tt, y - ay - dy * tt) <= r) {
          const cur = this.get(x, y);
          if (over && !over.includes(cur)) continue;
          this.set(x, y, (cur === WATER || cur === DEEP) && t !== WATER && t !== DEEP ? BRIDGE : t);
        }
      }
    }
    return this;
  }
  obj(type, x, y, o = {}) { const ob = { type, x, y, w: 1, h: 1, ...o }; this.objs.push(ob); return ob; }
  house(x, y, w, h, o = {}) { return this.obj('house', x, y, { w, h, ...o }); }
  wall(x, y, w, h, o = {}) { return this.obj('citywall', x, y, { w, h, ...o }); }
  tree(x, y, kind = 'round') { return this.obj('tree', x, y, { kind, variant: Math.floor(this.rnd() * 4) }); }
  npc(id, x, y, dir = 'down') { this.npcs.push({ id, x, y, dir }); this.reserve(x, y, 1); return this; }
  exit(x, y, to, tx, ty, label) { this.exits.push({ x, y, to, tx, ty, label }); this.reserve(x, y, 2); return this; }
  point(x, y) { this.points.push([x, y]); this.reserve(x, y, 1); return this; }
  reserve(x, y, r) { this.reserved.push([x, y, r]); }
  isReserved(x, y) { return this.reserved.some(([rx, ry, r]) => Math.abs(rx - x) <= r && Math.abs(ry - y) <= r); }
  occupied(x, y, w = 1, h = 1) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
      if (this.isReserved(i, j)) return true;
      if (this.objs.some(o => i >= o.x - (o.type === 'tree' ? 1 : 0) && i < o.x + o.w + (o.type === 'tree' ? 1 : 0) && j >= o.y - (o.type === 'house' ? 2 : 0) && j < o.y + o.h + 1)) return true;
    }
    return false;
  }
  // 在区域内随机放置物件，只放在指定地块上
  scatter(type, n, area, o = {}) {
    const on = o.on || [GRASS, FLOWER];
    const [ax, ay, aw, ah] = area || [0, 0, this.w, this.h];
    let placed = 0, tries = 0;
    while (placed < n && tries++ < n * 30) {
      const x = ax + Math.floor(this.rnd() * aw), y = ay + Math.floor(this.rnd() * ah);
      if (!on.includes(this.get(x, y))) continue;
      if (o.margin !== 0 && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !on.includes(this.get(x + dx, y + dy)) && this.get(x + dx, y + dy) !== -1) && !o.edge) continue;
      if (this.occupied(x, y)) continue;
      const kinds = o.kinds;
      if (type === 'tree') this.tree(x, y, kinds ? kinds[Math.floor(this.rnd() * kinds.length)] : 'round');
      else this.obj(type, x, y, { variant: Math.floor(this.rnd() * 4), color: o.color });
      placed++;
    }
    return this;
  }
  border(kind, t = 2, kinds) {
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (x >= t && y >= t && x < this.w - t && y < this.h - t) continue;
      if (this.occupied(x, y) || BLOCKED.has(this.get(x, y))) continue;
      if (this.rnd() < 0.8) { if (kind === 'tree') this.tree(x, y, kinds[Math.floor(this.rnd() * kinds.length)]); else this.obj(kind, x, y); }
    }
    return this;
  }
  build() {
    const { w, h } = this;
    const block = new Uint8Array(w * h);
    const owner = new Array(w * h).fill(null);
    for (let i = 0; i < w * h; i++) if (BLOCKED.has(this.tiles[i])) block[i] = 1;
    for (const o of this.objs) {
      if (o.walk || NONBLOCK_PROPS.has(o.type)) continue;
      const fw = o.type === 'fence' ? 2 : o.w;
      for (let j = o.y; j < o.y + o.h; j++) for (let i = o.x; i < o.x + fw; i++) if (this.in(i, j)) { block[j * w + i] = 2; owner[j * w + i] = o; }
    }
    // 连通性修复：保证出生点能走到所有NPC、出口与关键点
    const targets = [...this.npcs.map(n => [n.x, n.y + 1, n]), ...this.exits.map(e => [e.x, e.y]), ...this.points];
    const [sx, sy] = this.spawn;
    block[sy * w + sx] = 0;
    for (const [tx, ty, npc] of targets) {
      const goal = npc ? nearestFree(block, w, h, npc.x, npc.y) : [tx, ty];
      if (!goal) continue;
      if (block[goal[1] * w + goal[0]]) { block[goal[1] * w + goal[0]] = 0; }
      const p = carvePath(block, owner, w, h, sx, sy, goal[0], goal[1]);
      for (const [x, y] of p) {
        const k = y * w + x;
        if (block[k] === 2 && owner[k] && REMOVABLE.has(owner[k].type)) { const o = owner[k]; this.objs.splice(this.objs.indexOf(o), 1); for (let j = o.y; j < o.y + o.h; j++) for (let i = o.x; i < o.x + (o.type === 'fence' ? 2 : o.w); i++) if (this.in(i, j)) { block[j * w + i] = BLOCKED.has(this.tiles[j * w + i]) ? 1 : 0; owner[j * w + i] = null; } }
        else if (block[k] === 1) { const t = this.tiles[k]; this.tiles[k] = t === WATER || t === DEEP ? BRIDGE : t === WALL ? (this.theme === 'cave' ? CAVE : WOOD) : ROAD; block[k] = 0; }
      }
    }
    // NPC 自身占位
    for (const n of this.npcs) block[n.y * w + n.x] = 3;
    return { id: this.id, name: this.name, w, h, tiles: this.tiles, block, objs: this.objs, npcs: this.npcs, exits: this.exits, theme: this.theme, music: this.music, spawn: this.spawn, encounter: this.encounter, city: this.city, dark: this.dark, weather: this.weather };
  }
}

function nearestFree(block, w, h, x, y) {
  for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [-1, 1]]) {
    const nx = x + dx, ny = y + dy;
    if (nx >= 0 && ny >= 0 && nx < w && ny < h && block[ny * w + nx] !== 1) return [nx, ny];
  }
  return [x, y + 1];
}
// 带权A*：可穿越可移除物件(代价高)与障碍地形(代价更高)，房屋不可穿越
function carvePath(block, owner, w, h, sx, sy, gx, gy) {
  const cost = k => block[k] === 0 ? 1 : block[k] === 2 ? (owner[k] && REMOVABLE.has(owner[k].type) ? 25 : Infinity) : block[k] === 1 ? 60 : block[k] === 3 ? Infinity : 1;
  const dist = new Float64Array(w * h).fill(Infinity), prev = new Int32Array(w * h).fill(-1);
  const heap = [];
  const push = (k, d) => { heap.push([d, k]); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = i * 2 + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
  const s = sy * w + sx, g = gy * w + gx;
  dist[s] = 0; push(s, 0);
  while (heap.length) {
    const [d, k] = pop();
    if (k === g) break;
    if (d > dist[k]) continue;
    const x = k % w, y = (k / w) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const nk = ny * w + nx;
      const c = nk === g ? 1 : cost(nk);
      if (!isFinite(c)) continue;
      const nd = d + c + Math.abs(nx - gx) * 0 ;
      if (nd < dist[nk]) { dist[nk] = nd; prev[nk] = k; push(nk, nd); }
    }
  }
  const out = [];
  if (prev[g] < 0 && g !== s) return out;
  for (let k = g; k !== -1 && k !== s; k = prev[k]) out.push([k % w, (k / w) | 0]);
  return out;
}

// ---------------- 地图 ----------------
function jianye() {
  const m = new MB('jianye', '建邺城', 64, 48, { theme: 'town', music: 'jianye', spawn: [32, 27], city: true, weather: 'petal' });
  m.circle(12, 42, 7, 4, FLOWER, 0.3).circle(56, 10, 6, 4, FLOWER, 0.3);
  m.path([[0, 24], [63, 24]], 3, STONE).path([[32, 14], [32, 45]], 3, STONE);
  m.path([[10, 24], [10, 38]], 2, ROAD).path([[52, 24], [52, 36]], 2, ROAD).path([[19, 24], [19, 35]], 2, ROAD).path([[41, 24], [41, 35]], 2, ROAD);
  m.circle(32, 25, 5, 3.5, STONE);
  m.circle(54, 40, 5, 3, WATER, 0.2);
  m.house(27, 8, 10, 6, { style: 'office', sign: '建邺衙门' });
  m.house(4, 17, 8, 5, { style: 'shop', sign: '客栈' });
  m.house(15, 17, 7, 5, { style: 'shop', sign: '杂货' });
  m.house(37, 17, 7, 5, { style: 'shop', sign: '兵器' });
  m.house(45, 16, 9, 6, { style: 'rich', sign: '李府' });
  m.house(15, 28, 7, 5, { style: 'common' });
  m.house(37, 28, 7, 5, { style: 'common' });
  m.house(3, 30, 6, 5, { style: 'hut' });
  m.house(55, 27, 6, 5, { style: 'common' });
  m.house(22, 38, 6, 4, { style: 'hut' });
  m.obj('well', 26, 30); m.obj('stall', 36, 26, { color: '#e8503a' }); m.obj('stall', 27, 21, { color: '#3a8ae8' });
  m.obj('lion', 30, 14); m.obj('lion', 34, 14);
  m.npc('laosun', 30, 27, 'down').npc('wangdasao', 19, 33, 'down').npc('niudadan', 41, 33, 'down').npc('lishanren', 49, 23, 'down');
  m.npc('jy_inn', 8, 23).npc('jy_grocer', 18, 23).npc('jy_weapon', 40, 23).npc('jy_guard', 34, 15).npc('jy_kid', 25, 34).npc('jy_teacher', 11, 36);
  m.exit(1, 24, 'jiangnan', 67, 30, '江南野外').exit(62, 24, 'donghai', 3, 22, '东海湾');
  for (const [x, y] of [[26, 24], [38, 24], [14, 24], [48, 24], [58, 24]]) m.obj('stonelamp', x, y - 2);
  m.scatter('tree', 70, null, { kinds: ['round', 'willow', 'cherry', 'round'] });
  m.scatter('bush', 25).scatter('flowerpot', 8, [12, 20, 40, 20]);
  return m.build();
}

function donghai() {
  const m = new MB('donghai', '东海湾', 60, 46, { theme: 'beach', base: SAND, music: 'donghai', spawn: [4, 22], encounter: { lv: [1, 5], mobs: ['haimaochong', 'dahaigui', 'juwa'] }, weather: 'bubble' });
  for (let y = 0; y < 46; y++) { const sx = Math.round(44 + Math.sin(y * 0.3) * 2 + Math.sin(y * 0.11) * 2); m.fill(sx, y, 60 - sx, 1, WATER); m.fill(sx + 3, y, 60 - sx, 1, DEEP); }
  for (let x = 0; x < 60; x++) { const sy = Math.round(40 + Math.sin(x * 0.25) * 1.5); m.fill(x, sy, 1, 46 - sy, WATER); m.fill(x, sy + 3, 1, 46, DEEP); }
  m.circle(10, 8, 13, 8, GRASS, 0.3).circle(6, 34, 8, 5, GRASS, 0.3).circle(9, 9, 5, 3, FLOWER, 0.3);
  m.path([[0, 22], [14, 22], [24, 18], [32, 26], [37, 32]], 2, ROAD);
  m.obj('wreck', 33, 29, { w: 5, h: 2 });
  m.obj('boat', 42, 14); m.obj('boat', 40, 36);
  m.npc('yufu', 24, 16, 'down').npc('dh_girl', 12, 12, 'down');
  m.exit(1, 22, 'jianye', 61, 24, '建邺城').exit(36, 33, 'chenchuan', 20, 23, '沉船');
  m.scatter('tree', 30, [0, 0, 42, 40], { kinds: ['palm'], on: [SAND, GRASS] });
  m.scatter('tree', 16, [0, 0, 24, 16], { kinds: ['round', 'pine'] });
  m.scatter('shell', 26, null, { on: [SAND] }).scatter('rock', 14, null, { on: [SAND], color: '#b8aa98' }).scatter('coral', 8, [30, 0, 16, 40], { on: [SAND] });
  return m.build();
}

function chenchuan() {
  const m = new MB('chenchuan', '沉船', 40, 30, { theme: 'ship', base: WALL, music: 'donghai', spawn: [20, 24], dark: 0.35, encounter: { lv: [4, 8], mobs: ['xiabing', 'xiejiang', 'yegui'] }, weather: 'bubble' });
  m.fill(3, 3, 34, 24, WOOD);
  m.fill(13, 3, 2, 15, WALL).fill(25, 11, 2, 16, WALL).fill(3, 12, 6, 2, WALL).fill(31, 18, 6, 2, WALL);
  m.circle(8, 22, 2.5, 1.6, WATER).circle(20, 8, 2, 1.4, WATER).circle(32, 24, 2, 1.4, WATER);
  m.point(32, 6);
  m.exit(20, 25, 'donghai', 36, 31, '东海湾');
  m.scatter('barrel', 14, [3, 3, 34, 24], { on: [WOOD], edge: true }).scatter('crate', 14, [3, 3, 34, 24], { on: [WOOD], edge: true }).scatter('bones', 6, [3, 3, 34, 24], { on: [WOOD] });
  m.obj('torch', 4, 4, { walk: true }); m.obj('torch', 35, 4, { walk: true }); m.obj('torch', 16, 20, { walk: true }); m.obj('torch', 28, 10, { walk: true });
  return m.build();
}

function jiangnan() {
  const m = new MB('jiangnan', '江南野外', 70, 50, { theme: 'field', music: 'jiaowai', spawn: [66, 30], encounter: { lv: [6, 12], mobs: ['shuguai', 'yezhu', 'qiangdao', 'dutu'] }, weather: 'leaf' });
  m.path([[35, 0], [33, 12], [36, 24], [35, 36], [38, 50]], 3.2, WATER);
  m.circle(52, 10, 6, 4, WATER, 0.3).circle(14, 38, 9, 5, FLOWER, 0.3).circle(55, 42, 7, 4, FLOWER, 0.3);
  m.path([[69, 30], [52, 30], [42, 24], [28, 20], [14, 12], [2, 8]], 2.4, ROAD);
  m.path([[42, 24], [44, 40], [30, 44]], 2, ROAD);
  m.obj('haystack', 46, 36); m.obj('haystack', 48, 38); m.house(26, 40, 5, 4, { style: 'hut' }); m.obj('fence', 26, 45); m.obj('fence', 28, 45);
  m.npc('jn_woodcutter', 46, 27, 'down').npc('jn_farmer', 32, 45, 'down');
  m.exit(68, 30, 'jianye', 2, 24, '建邺城').exit(2, 8, 'changan', 86, 32, '长安城');
  m.scatter('tree', 170, null, { kinds: ['round', 'pine', 'round', 'willow', 'maple'] });
  m.scatter('bush', 40).scatter('rock', 16).scatter('stump', 10);
  m.obj('signpost', 64, 28);
  return m.build();
}

function changan() {
  const m = new MB('changan', '长安城', 90, 64, { theme: 'city', music: 'changan', spawn: [45, 35], city: true, weather: 'petal' });
  m.path([[0, 31.5], [89, 31.5]], 4, STONE).path([[44.5, 4], [44.5, 62]], 4, STONE);
  m.path([[5, 16], [85, 16]], 3, STONE).path([[5, 48], [85, 48]], 3, STONE);
  m.path([[22, 5], [22, 59]], 3, STONE).path([[68, 5], [68, 59]], 3, STONE);
  m.circle(44.5, 31.5, 7, 5, STONE);
  m.circle(33, 55, 6, 3, WATER, 0.2).circle(58, 56, 6, 3, FLOWER, 0.3).circle(12, 56, 5, 3, FLOWER, 0.3);
  // 城墙
  for (const r of [[0, 0, 90, 2], [0, 62, 90, 2], [0, 2, 2, 28], [0, 34, 2, 28], [88, 2, 2, 28], [88, 34, 2, 28]]) m.wall(...r);
  // 北排
  m.house(6, 9, 7, 6, { style: 'shop', sign: '兵器铺' });
  m.house(14, 9, 7, 6, { style: 'shop', sign: '服饰' });
  m.house(27, 6, 14, 8, { style: 'palace', sign: '大明宫' });
  m.house(48, 9, 7, 6, { style: 'shop', sign: '首饰' });
  m.house(56, 9, 8, 6, { style: 'shop', sign: '药店' });
  m.house(71, 9, 7, 6, { style: 'shop', sign: '杂货' });
  m.house(79, 9, 7, 6, { style: 'rich', sign: '钱庄' });
  // 中排
  m.house(5, 23, 9, 6, { style: 'shop', sign: '客栈' });
  m.house(24, 23, 8, 6, { style: 'red', sign: '驿站' });
  m.house(33, 22, 8, 7, { style: 'jade', sign: '观星台' });
  m.house(49, 21, 11, 8, { style: 'temple', sign: '化生寺' });
  m.house(60, 23, 7, 6, { style: 'rich', sign: '侠义堂' });
  m.house(71, 23, 8, 6, { style: 'shop', sign: '宠物' });
  // 南排
  m.house(5, 40, 8, 6, { style: 'shop', sign: '酒楼' });
  m.house(25, 40, 7, 6); m.house(33, 40, 7, 6, { style: 'hut' });
  m.house(49, 40, 7, 6); m.house(57, 40, 8, 6, { style: 'shop', sign: '茶馆' });
  m.house(71, 40, 7, 6, { style: 'hut' }); m.house(79, 40, 7, 6);
  m.house(6, 52, 6, 5, { style: 'hut' }); m.house(24, 51, 6, 5); m.house(71, 52, 7, 5);
  m.obj('statue', 44, 29); m.obj('lion', 30, 15); m.obj('lion', 37, 15);
  m.obj('stall', 40, 36, { color: '#e8503a' }); m.obj('stall', 50, 27, { color: '#3aa05a' }); m.obj('stall', 38, 26, { color: '#e8a030' }); m.obj('stall', 52, 36, { color: '#8a5ae8' });
  m.obj('stonelamp', 48, 36, {}); m.obj('stonelamp', 40, 27, {});
  for (let x = 8; x < 86; x += 7) { if (Math.abs(x - 44) < 4 || Math.abs(x - 22) < 3 || Math.abs(x - 68) < 3) continue; m.tree(x, 19, 'willow'); m.tree(x, 35, 'willow'); }
  m.npc('ca_weapon', 9, 16).npc('ca_armor', 17, 16).npc('ca_guard', 34, 16).npc('ca_acc', 51, 16).npc('ca_drug', 60, 16).npc('ca_grocer', 74, 16).npc('ca_bank', 82, 16);
  m.npc('ca_inn', 9, 30).npc('yizhan', 28, 30).npc('yuantiangang', 37, 30).npc('ca_monk', 54, 30).npc('xiayi', 63, 30).npc('petfairy', 75, 30);
  m.npc('xiaoer', 9, 47).npc('zhongkui', 48, 34, 'down').npc('ca_scholar', 61, 47).npc('ca_girl', 30, 47).npc('ca_beggar', 40, 50).npc('ca_kid', 79, 47);
  m.exit(88, 31, 'jiangnan', 4, 8, '江南野外').exit(1, 31, 'guojing', 72, 30, '大唐国境');
  m.scatter('tree', 40, [2, 50, 86, 12], { kinds: ['cherry', 'willow', 'round'] });
  m.scatter('bush', 20, [2, 50, 86, 12]).scatter('flowerpot', 12, [4, 17, 82, 30], { on: [GRASS, FLOWER] });
  return m.build();
}

function guojing() {
  const m = new MB('guojing', '大唐国境', 76, 56, { theme: 'wild', music: 'jiaowai', spawn: [72, 30], encounter: { lv: [12, 21], mobs: ['shanzei', 'laohu', 'heixiong', 'huayao'] }, weather: 'leaf' });
  m.circle(8, 8, 12, 7, ROCK, 0.4).circle(66, 50, 12, 7, ROCK, 0.4).circle(14, 50, 9, 5, ROCK, 0.3).circle(58, 8, 8, 5, ROCK, 0.3);
  m.path([[48, 0], [50, 12], [56, 20]], 2.6, WATER).circle(58, 22, 5, 3.5, WATER, 0.2);
  m.circle(40, 46, 8, 4, FLOWER, 0.3);
  m.path([[75, 30], [56, 28], [40, 34], [25, 40], [1, 40]], 2.4, ROAD).path([[40, 34], [38, 20], [26, 13]], 2, ROAD);
  m.circle(26, 10, 9, 5, DARK, 0.25);
  m.obj('tent', 21, 8, { color: '#a88a5a' }); m.obj('tent', 29, 8, { color: '#8a6a4a' }); m.obj('tent', 25, 7, { color: '#b89a6a' });
  m.obj('campfire', 25, 11); m.obj('fence', 18, 15); m.obj('fence', 20, 15); m.obj('fence', 30, 15); m.obj('fence', 32, 15);
  m.point(26, 12);
  m.npc('gj_hunter', 52, 30, 'down').npc('gj_monk', 10, 38, 'down');
  m.exit(74, 30, 'changan', 3, 31, '长安城').exit(1, 40, 'jingwai', 76, 40, '大唐境外');
  m.scatter('tree', 190, null, { kinds: ['pine', 'pine', 'round', 'maple'] });
  m.scatter('rock', 24).scatter('bush', 30).scatter('stump', 12);
  return m.build();
}

function jingwai() {
  const m = new MB('jingwai', '大唐境外', 80, 56, { theme: 'desert', base: DARK, music: 'title', spawn: [76, 40], encounter: { lv: [20, 32], mobs: ['hulijing', 'yangtou', 'hamajing', 'kulou', 'niuyao'] }, weather: 'dust' });
  m.circle(30, 44, 14, 7, SAND, 0.4).circle(62, 16, 10, 7, SAND, 0.4).circle(14, 26, 8, 6, GRASS, 0.4);
  m.circle(4, 3, 9, 6, ROCK, 0.3).circle(24, 4, 6, 4, ROCK, 0.4).circle(50, 50, 8, 5, ROCK, 0.3).circle(76, 4, 5, 4, ROCK, 0.3).circle(70, 54, 10, 4, ROCK, 0.3);
  m.circle(46, 12, 5, 3, WATER, 0.3);
  m.path([[79, 40], [56, 38], [40, 28], [22, 20], [9, 10]], 2.4, ROAD).path([[56, 38], [62, 22], [68, 8]], 2, ROAD).path([[40, 28], [30, 16]], 2, ROAD);
  m.circle(30, 14, 5, 3.5, SAND, 0.2);
  m.point(30, 14);
  m.npc('tudi', 46, 31, 'down').npc('jw_merchant', 60, 40, 'down');
  m.exit(78, 40, 'guojing', 3, 40, '大唐国境').exit(9, 9, 'baigu', 25, 34, '白骨洞').exit(68, 7, 'huaguo', 34, 44, '花果山');
  m.scatter('tree', 60, null, { kinds: ['dead', 'dead', 'pine'], on: [DARK, SAND, GRASS] });
  m.scatter('rock', 40, null, { on: [DARK, SAND], color: '#a88a6a' }).scatter('bones', 30, null, { on: [DARK, SAND] }).scatter('skull', 10, null, { on: [DARK, SAND] });
  return m.build();
}

function baigu() {
  const m = new MB('baigu', '白骨洞', 50, 40, { theme: 'cave', base: WALL, music: 'title', spawn: [25, 35], dark: 0.45, encounter: { lv: [30, 40], mobs: ['jiangshi', 'zhizhu', 'yuanhun', 'kulou'] }, weather: 'ember' });
  m.circle(26, 34, 6, 4, CAVE, 0.2);
  m.path([[26, 33], [20, 28], [14, 24]], 3, CAVE).circle(13, 24, 7, 5, CAVE, 0.3);
  m.path([[26, 33], [32, 27], [38, 22]], 3, CAVE).circle(38, 22, 7, 5, CAVE, 0.3);
  m.path([[14, 20], [18, 12], [26, 8]], 3, CAVE).path([[38, 18], [34, 12], [26, 8]], 3, CAVE).circle(26, 7, 9, 4.5, CAVE, 0.2);
  m.circle(24, 10, 2, 1.3, WATER);
  m.point(12, 23).point(40, 21).point(26, 6);
  m.exit(25, 37, 'jingwai', 9, 11, '大唐境外');
  m.scatter('bones', 24, null, { on: [CAVE] }).scatter('skull', 14, null, { on: [CAVE] }).scatter('crystal', 8, null, { on: [CAVE], edge: true }).scatter('web', 10, null, { on: [CAVE] });
  for (const [x, y] of [[22, 31], [30, 31], [10, 20], [42, 18], [20, 5], [32, 5]]) m.obj('torch', x, y, { walk: true });
  return m.build();
}

function huaguo() {
  const m = new MB('huaguo', '花果山', 70, 50, { theme: 'mountain', music: 'jiaowai', spawn: [34, 45], encounter: { lv: [40, 55], mobs: ['julishenyuan', 'changmei', 'tianjiang'] }, weather: 'petal' });
  m.circle(35, 6, 14, 5, ROCK, 0.3).circle(6, 20, 6, 10, ROCK, 0.3).circle(64, 24, 6, 10, ROCK, 0.3);
  m.path([[35, 11], [36, 18], [30, 26]], 2.4, WATER).circle(30, 28, 7, 4, WATER, 0.25);
  m.circle(16, 36, 9, 5, FLOWER, 0.3).circle(52, 38, 8, 5, FLOWER, 0.3);
  m.path([[34, 49], [34, 36], [44, 26], [40, 14]], 2.2, ROAD).path([[34, 36], [18, 30]], 2, ROAD);
  m.npc('hg_monkey', 40, 15, 'down');
  m.exit(34, 47, 'jingwai', 68, 9, '大唐境外');
  m.scatter('tree', 140, null, { kinds: ['peach', 'peach', 'round', 'pine', 'cherry'] });
  m.scatter('rock', 20).scatter('bush', 30);
  return m.build();
}

// 门派场景
const SCHOOL_DECOR = {
  palace: { floor: STONE, house: 'palace', trees: ['willow', 'round'], props: ['lion', 'stonelamp'] },
  temple: { floor: STONE, house: 'temple', trees: ['round', 'pine'], props: ['stonelamp', 'lotus'] },
  village: { floor: FLOWER, house: 'common', trees: ['cherry', 'peach'], props: ['flowerpot', 'well'] },
  taoist: { floor: GRASS, house: 'jade', trees: ['pine', 'pine'], props: ['stonelamp', 'rock'] },
  sea: { floor: SAND, house: 'coral', trees: ['palm'], props: ['coral', 'shell'] },
  island: { floor: SAND, house: 'temple', trees: ['bamboo', 'palm'], props: ['lotus', 'rock'] },
  heaven: { floor: CLOUD, house: 'palace', trees: ['birch'], props: ['pillar', 'cloud'] },
  garden: { floor: GRASS, house: 'jade', trees: ['ginseng', 'round'], props: ['stonelamp', 'flowerpot'] },
  volcano: { floor: DARK, house: 'red', trees: ['dead'], props: ['torch', 'rock'] },
  rock: { floor: ROAD, house: 'hut', trees: ['pine', 'dead'], props: ['rock', 'bones'] },
  web: { floor: CAVE, house: 'dark', trees: ['dead'], props: ['web', 'crystal'] },
  underworld: { floor: DARK, house: 'dark', trees: ['ghost', 'dead'], props: ['bluefire', 'skull'] },
};
function schoolMap(id) {
  const sc = SCHOOLS[id];
  const d = SCHOOL_DECOR[sc.theme];
  const m = new MB('s_' + id, sc.name, 36, 28, { theme: sc.theme, base: d.floor, music: 'changan', spawn: [18, 24], weather: { heaven: 'cloud', sea: 'bubble', underworld: 'ember', volcano: 'ember', village: 'petal', web: 'ember' }[sc.theme] || 'leaf', dark: sc.theme === 'underworld' || sc.theme === 'web' ? 0.25 : 0 });
  if (sc.theme === 'sea') { m.fill(0, 0, 36, 28, WATER); m.circle(18, 14, 16, 12, SAND, 0.15); }
  if (sc.theme === 'island') { m.fill(0, 0, 36, 28, WATER); m.circle(18, 14, 16, 12, SAND, 0.2); m.circle(18, 10, 9, 5, GRASS, 0.2); }
  if (sc.theme === 'volcano') { m.circle(5, 20, 3, 2, LAVA, 0.3); m.circle(31, 19, 3, 2, LAVA, 0.3); }
  if (sc.theme === 'heaven') { m.fill(0, 0, 36, 1, CLOUD); }
  m.path([[18, 27], [18, 10]], 3, STONE);
  m.house(12, 2, 12, 6, { style: d.house, sign: sc.name });
  m.house(2, 8, 6, 5, { style: d.house === 'palace' ? 'red' : d.house });
  m.house(28, 8, 6, 5, { style: d.house === 'palace' ? 'red' : d.house });
  m.obj(d.props[0], 15, 9); m.obj(d.props[0], 21, 9);
  m.npc('master_' + id, 18, 9, 'down').npc('disciple_' + id, 10, 16, 'down');
  m.exit(18, 26, 'changan', 28, 32, '长安城');
  m.scatter('tree', 26, null, { kinds: d.trees, on: [GRASS, FLOWER, SAND, CLOUD, DARK, CAVE, ROAD] });
  m.scatter(d.props[1], 10, null, { on: [GRASS, FLOWER, SAND, CLOUD, DARK, CAVE, ROAD] });
  return m.build();
}

const BUILDERS = { jianye, donghai, chenchuan, jiangnan, changan, guojing, jingwai, baigu, huaguo };
const cache = {};
export function getMap(id) {
  if (cache[id]) return cache[id];
  if (id.startsWith('s_')) return (cache[id] = schoolMap(id.slice(2)));
  if (!BUILDERS[id]) throw new Error('未知地图 ' + id);
  return (cache[id] = BUILDERS[id]());
}
export const MAP_IDS = Object.keys(BUILDERS);
export const ALL_MAP_IDS = [...MAP_IDS, ...Object.keys(SCHOOLS).map(s => 's_' + s)];
export const MAP_NAMES = { jianye: '建邺城', donghai: '东海湾', chenchuan: '沉船', jiangnan: '江南野外', changan: '长安城', guojing: '大唐国境', jingwai: '大唐境外', baigu: '白骨洞', huaguo: '花果山' };
for (const s in SCHOOLS) MAP_NAMES['s_' + s] = SCHOOLS[s].name;

export function walkable(map, x, y) {
  return x >= 0 && y >= 0 && x < map.w && y < map.h && map.block[y * map.w + x] === 0;
}

// A* 寻路（8方向，禁止切角）
export function findPath(map, sx, sy, gx, gy, maxNodes = 20000) {
  const { w, h } = map;
  if (!walkable(map, gx, gy)) {
    // 找目标附近最近的可走点
    let best = null, bd = Infinity;
    for (let r = 1; r <= 4 && !best; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const x = gx + dx, y = gy + dy;
      if (walkable(map, x, y)) { const d = Math.hypot(dx, dy) + Math.hypot(x - sx, y - sy) * 0.01; if (d < bd) { bd = d; best = [x, y]; } }
    }
    if (!best) return null;
    [gx, gy] = best;
  }
  if (sx === gx && sy === gy) return [];
  const N = w * h;
  const g = new Float32Array(N).fill(Infinity), prev = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
  const heap = [];
  const hfn = (x, y) => { const dx = Math.abs(x - gx), dy = Math.abs(y - gy); return Math.max(dx, dy) + 0.414 * Math.min(dx, dy); };
  const push = (k, f) => { heap.push([f, k]); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = i * 2 + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
  const s = sy * w + sx, goal = gy * w + gx;
  g[s] = 0; push(s, hfn(sx, sy));
  let n = 0;
  while (heap.length && n++ < maxNodes) {
    const [, k] = pop();
    if (closed[k]) continue;
    closed[k] = 1;
    if (k === goal) break;
    const x = k % w, y = (k / w) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = x + dx, ny = y + dy;
      if (!walkable(map, nx, ny)) continue;
      if (dx && dy && (!walkable(map, x + dx, y) || !walkable(map, x, y + dy))) continue;
      const nk = ny * w + nx;
      const ng = g[k] + (dx && dy ? 1.414 : 1);
      if (ng < g[nk]) { g[nk] = ng; prev[nk] = k; push(nk, ng + hfn(nx, ny)); }
    }
  }
  if (prev[goal] < 0) return null;
  const out = [];
  for (let k = goal; k !== s; k = prev[k]) out.push([k % w, (k / w) | 0]);
  return out.reverse();
}

// 地图间路线（BFS）
export function mapRoute(from, to) {
  if (from === to) return [];
  const q = [[from, []]], seen = new Set([from]);
  while (q.length) {
    const [id, path] = q.shift();
    for (const e of getMap(id).exits) {
      if (seen.has(e.to)) continue;
      const np = [...path, { map: id, exit: e }];
      if (e.to === to) return np;
      seen.add(e.to); q.push([e.to, np]);
    }
  }
  return null;
}

export function randomWalkable(map, rnd = Math.random, margin = 3) {
  for (let i = 0; i < 500; i++) {
    const x = margin + Math.floor(rnd() * (map.w - margin * 2)), y = margin + Math.floor(rnd() * (map.h - margin * 2));
    if (walkable(map, x, y) && !map.exits.some(e => Math.abs(e.x - x) < 3 && Math.abs(e.y - y) < 3)) return [x, y];
  }
  return map.spawn;
}
