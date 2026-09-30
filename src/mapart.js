// 地图地块与场景物件的程序绘制
import { seeded, hashStr } from './util.js';
import { shade } from './art.js';

export const T = 32;
export const TILE = { GRASS: 0, ROAD: 1, STONE: 2, WATER: 3, SAND: 4, WOOD: 5, DEEP: 6, ROCK: 7, FLOWER: 8, BRIDGE: 9, DARK: 10, CAVE: 11, LAVA: 12, CLOUD: 13, WALL: 15 };
export const BLOCKED = new Set([3, 6, 7, 12, 15]);

export const THEMES = {
  town: { grass: '#8fcf62', road: '#e2c98f', stone: '#cfc6b4', sand: '#f0dca0', water: '#5ab8e8', deep: '#3a8ad0', rock: '#9a8a78', dark: '#8a7a5a', cave: '#6a5a50', wood: '#c89a62', cloud: '#f4f6ff', lava: '#f05a1a', wall: '#4a3a3a' },
  beach: { grass: '#9ad46a', road: '#e8d098', stone: '#d8d0c0', sand: '#f6e4a8', water: '#58c4e8', deep: '#2f8fd6', rock: '#a89a88', dark: '#9a8a6a', cave: '#6a5a50', wood: '#c89a62', cloud: '#fff', lava: '#f05a1a', wall: '#4a3a3a' },
  field: { grass: '#86c85a', road: '#dcc088', stone: '#c8c0b0', sand: '#ecd8a0', water: '#56b0e0', deep: '#3a88c8', rock: '#8a8a7a', dark: '#8a7a5a', cave: '#6a5a50', wood: '#c89a62', cloud: '#fff', lava: '#f05a1a', wall: '#4a3a3a' },
  city: { grass: '#8ccc64', road: '#dcc494', stone: '#d6cdbd', sand: '#ecd8a0', water: '#5ab4e4', deep: '#3a88c8', rock: '#9a8a7a', dark: '#8a7a5a', cave: '#6a5a50', wood: '#c89a62', cloud: '#fff', lava: '#f05a1a', wall: '#8a8480' },
  wild: { grass: '#74b44e', road: '#c8aa78', stone: '#b8b0a0', sand: '#dcc890', water: '#4aa0d0', deep: '#2f78b8', rock: '#8a7e70', dark: '#7a6a4a', cave: '#6a5a50', wood: '#b88a52', cloud: '#fff', lava: '#f05a1a', wall: '#4a3a3a' },
  desert: { grass: '#a8b060', road: '#d2b27a', stone: '#b8a890', sand: '#e0c890', water: '#5a98b8', deep: '#3a78a0', rock: '#8a6e5a', dark: '#b89a6a', cave: '#6a5a50', wood: '#a8804a', cloud: '#fff', lava: '#f05a1a', wall: '#5a4030' },
  cave: { grass: '#6a7a5a', road: '#8a7a6a', stone: '#8a8290', sand: '#9a8a70', water: '#3a6a8a', deep: '#2a4a6a', rock: '#4a4050', dark: '#5a4a50', cave: '#6e6068', wood: '#8a6a4a', cloud: '#fff', lava: '#f05a1a', wall: '#2e2630' },
  ship: { grass: '#6a8a5a', road: '#8a7a6a', stone: '#8a8a90', sand: '#b8a880', water: '#3a7a9a', deep: '#2a5a7a', rock: '#5a4a40', dark: '#5a4a40', cave: '#6a5a50', wood: '#a87a4a', cloud: '#fff', lava: '#f05a1a', wall: '#3a2a22' },
  mountain: { grass: '#7ec85a', road: '#d8bc84', stone: '#c0b8a8', sand: '#e6d29a', water: '#4ab4e0', deep: '#2f88c8', rock: '#8a8478', dark: '#8a7a5a', cave: '#6a5a50', wood: '#c89a62', cloud: '#fff', lava: '#f05a1a', wall: '#4a3a3a' },
  palace: { grass: '#8ccc64', road: '#dcc494', stone: '#e0d0b8', sand: '#ecd8a0', water: '#5ab4e4', deep: '#3a88c8', rock: '#9a8a7a', dark: '#8a7a5a', cave: '#6a5a50', wood: '#c89a62', cloud: '#fff', lava: '#f05a1a', wall: '#b83a2a' },
  temple: { grass: '#90cc6a', road: '#e8d4a0', stone: '#e4dcc8', sand: '#f0e0b0', water: '#5ab8e0', deep: '#3a88c8', rock: '#9a8a7a', dark: '#8a7a5a', cave: '#6a5a50', wood: '#c89a62', cloud: '#fff', lava: '#f05a1a', wall: '#d8a040' },
  village: { grass: '#96d46e', road: '#f0d4b0', stone: '#f0dcd0', sand: '#f4e0b0', water: '#6ac0ec', deep: '#3a88c8', rock: '#a89a88', dark: '#8a7a5a', cave: '#6a5a50', wood: '#d8a878', cloud: '#fff', lava: '#f05a1a', wall: '#e890a0' },
  taoist: { grass: '#80c070', road: '#d8c8a0', stone: '#d0ccc0', sand: '#e8d8a8', water: '#5ab0d8', deep: '#3a88c8', rock: '#8a8a88', dark: '#8a7a5a', cave: '#6a5a50', wood: '#c89a62', cloud: '#f0f4ff', lava: '#f05a1a', wall: '#6a7a8a' },
  sea: { grass: '#5ac0a8', road: '#9ad8d0', stone: '#a8dce0', sand: '#d8e8c8', water: '#3aa0d8', deep: '#2a70b8', rock: '#5a8aa0', dark: '#4a7a8a', cave: '#4a6a7a', wood: '#c89a62', cloud: '#fff', lava: '#f05a1a', wall: '#2a5a8a' },
  island: { grass: '#8ad070', road: '#f0e0b0', stone: '#e0e0d0', sand: '#f6ecc0', water: '#5ac8ec', deep: '#2f90d8', rock: '#a0a098', dark: '#8a7a5a', cave: '#6a5a50', wood: '#c89a62', cloud: '#fff', lava: '#f05a1a', wall: '#4a3a3a' },
  heaven: { grass: '#b8d8f0', road: '#e8eefc', stone: '#f0f0f8', sand: '#f8f0d8', water: '#8ac8f0', deep: '#6aa8e0', rock: '#c8c8d8', dark: '#a8a8c8', cave: '#8888a8', wood: '#e0c890', cloud: '#fbfcff', lava: '#f05a1a', wall: '#d8b040' },
  garden: { grass: '#7ccc62', road: '#e0cc98', stone: '#d8d0b8', sand: '#ecdca8', water: '#5ab8e0', deep: '#3a88c8', rock: '#9a9a88', dark: '#8a7a5a', cave: '#6a5a50', wood: '#c89a62', cloud: '#fff', lava: '#f05a1a', wall: '#6a8a4a' },
  volcano: { grass: '#8a6a4a', road: '#a87a5a', stone: '#8a6a60', sand: '#b08a6a', water: '#f07a2a', deep: '#d04a1a', rock: '#4a3a3a', dark: '#6a4a3a', cave: '#5a4040', wood: '#8a5a3a', cloud: '#fff', lava: '#f05a1a', wall: '#3a2020' },
  rock: { grass: '#8aa060', road: '#b8a888', stone: '#a8a098', sand: '#c8b890', water: '#5a98c0', deep: '#3a78a0', rock: '#6a625a', dark: '#8a7a6a', cave: '#6a5a50', wood: '#a8804a', cloud: '#fff', lava: '#f05a1a', wall: '#4a4038' },
  web: { grass: '#7a6a8a', road: '#9a8aa0', stone: '#8a8098', sand: '#a898a8', water: '#5a5a8a', deep: '#3a3a6a', rock: '#4a3a50', dark: '#6a5a70', cave: '#766680', wood: '#8a6a5a', cloud: '#fff', lava: '#f05a1a', wall: '#3a2a40' },
  snow: { grass: '#e6edf3', road: '#c4ccd6', stone: '#d6dce4', sand: '#f2f4f6', water: '#a8d8f0', deep: '#6aa8d8', rock: '#8a98a8', dark: '#b8c4d0', cave: '#8a90a0', wood: '#b89a7a', cloud: '#ffffff', lava: '#f05a1a', wall: '#5a6070' },
  leiyin: { grass: '#c8b070', road: '#e8cc88', stone: '#ecdcb0', sand: '#f0d890', water: '#6ab0d0', deep: '#3a80b0', rock: '#8a6a4a', dark: '#a88a50', cave: '#7a6040', wood: '#c89a5a', cloud: '#fff', lava: '#f05a1a', wall: '#6a3a1a' },
  underworld: { grass: '#4a5a5a', road: '#5a5a6a', stone: '#5a5a6e', sand: '#6a6070', water: '#3a5a7a', deep: '#1a2a4a', rock: '#2a2a3a', dark: '#3a3a4a', cave: '#4a4458', wood: '#5a4a4a', cloud: '#fff', lava: '#7a3ad0', wall: '#1a1a26' },
};

const KEY = ['grass', 'road', 'stone', 'water', 'sand', 'wood', 'deep', 'rock', 'grass', 'road', 'dark', 'cave', 'lava', 'cloud', 'grass', 'wall'];

// 地面绘制：返回离屏画布
export function renderGround(map) {
  const { w, h, tiles, theme } = map;
  const P = THEMES[theme] || THEMES.town;
  const c = document.createElement('canvas');
  c.width = w * T; c.height = h * T;
  const g = c.getContext('2d');
  const rnd = seeded(hashStr(map.id));
  const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? -1 : tiles[y * w + x]);
  // 底色：草地
  g.fillStyle = P.grass; g.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < w * h * 0.6; i++) {
    const x = rnd() * c.width, y = rnd() * c.height, r = 6 + rnd() * 22;
    g.fillStyle = rnd() < 0.5 ? shade(P.grass, 0.035) : shade(P.grass, -0.035);
    g.globalAlpha = 0.5; g.beginPath(); g.ellipse(x, y, r, r * 0.6, 0, 0, Math.PI * 2); g.fill();
  }
  g.globalAlpha = 1;
  // 分层绘制地块，圆角外扩形成柔和边缘
  const layers = [4, 10, 11, 1, 13, 2, 5, 7, 15, 3, 6, 12, 9];
  for (const type of layers) {
    const col = P[KEY[type]];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (at(x, y) !== type && !(type === 3 && at(x, y) === 6)) continue;
      const px = x * T, py = y * T;
      if (type === 7 || type === 15) { drawRockTile(g, px, py, col, at, x, y, type, rnd); continue; }
      if (type === 9) { drawBridge(g, px, py, at, x, y); continue; }
      g.fillStyle = type === 3 && at(x, y) === 6 ? P.water : col;
      if (type === 3 || type === 12) { g.beginPath(); g.arc(px + T / 2, py + T / 2, T * 0.74, 0, Math.PI * 2); g.fill(); continue; }
      const ex = type === 2 || type === 5 ? 1 : 4;
      roundTile(g, px - ex, py - ex, T + ex * 2, T + ex * 2, 8);
    }
    // 细节
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (at(x, y) !== type) continue;
      const px = x * T, py = y * T;
      if (type === 2) { g.strokeStyle = shade(col, -0.08); g.lineWidth = 1; g.strokeRect(px + 0.5, py + 0.5, T / 2, T / 2); g.strokeRect(px + T / 2 + 0.5, py + T / 2 + 0.5, T / 2 - 1, T / 2 - 1); }
      if (type === 5) { g.strokeStyle = shade(col, -0.12); g.lineWidth = 1; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(px, py + k * 8 + 0.5); g.lineTo(px + T, py + k * 8 + 0.5); g.stroke(); } g.beginPath(); g.moveTo(px + ((y * 13) % 4) * 8, py); g.lineTo(px + ((y * 13) % 4) * 8, py + 8); g.stroke(); }
      if (type === 1 || type === 4 || type === 10 || type === 11) for (let k = 0; k < 2; k++) { g.fillStyle = shade(col, rnd() < 0.5 ? -0.06 : 0.05); g.beginPath(); g.arc(px + rnd() * T, py + rnd() * T, 1 + rnd() * 1.8, 0, Math.PI * 2); g.fill(); }
      if (type === 13) { g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.arc(px + rnd() * T, py + rnd() * T, 5 + rnd() * 6, 0, Math.PI * 2); g.fill(); }
      if (type === 6) { g.fillStyle = P.deep; g.beginPath(); g.arc(px + T / 2, py + T / 2, T * 0.72, 0, Math.PI * 2); g.fill(); }
      if (type === 3 && rnd() < 0.25) { g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1.5; const wx = px + rnd() * T, wy = py + rnd() * T; g.beginPath(); g.moveTo(wx - 5, wy); g.quadraticCurveTo(wx, wy - 3, wx + 5, wy); g.stroke(); }
      if (type === 12) { g.fillStyle = 'rgba(255,230,120,.5)'; g.beginPath(); g.arc(px + rnd() * T, py + rnd() * T, 3 + rnd() * 4, 0, Math.PI * 2); g.fill(); }
    }
  }
  // 水岸泡沫
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const v = at(x, y);
    if (v !== 3 && v !== 6) continue;
    const px = x * T, py = y * T;
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2.5;
    const shore = n => n !== 3 && n !== 6 && n !== 9 && n !== -1;
    if (shore(at(x, y - 1))) { g.beginPath(); g.moveTo(px, py + 3); g.quadraticCurveTo(px + T / 2, py + 6, px + T, py + 3); g.stroke(); }
    if (shore(at(x, y + 1))) { g.beginPath(); g.moveTo(px, py + T - 3); g.quadraticCurveTo(px + T / 2, py + T - 6, px + T, py + T - 3); g.stroke(); }
    if (shore(at(x - 1, y))) { g.beginPath(); g.moveTo(px + 3, py); g.quadraticCurveTo(px + 6, py + T / 2, px + 3, py + T); g.stroke(); }
    if (shore(at(x + 1, y))) { g.beginPath(); g.moveTo(px + T - 3, py); g.quadraticCurveTo(px + T - 6, py + T / 2, px + T - 3, py + T); g.stroke(); }
  }
  // 草地点缀
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const v = at(x, y);
    if (v !== 0 && v !== 8) continue;
    const px = x * T, py = y * T;
    if (rnd() < 0.35) {
      g.strokeStyle = shade(P.grass, -0.18); g.lineWidth = 1.3;
      const gx = px + rnd() * T, gy = py + rnd() * T;
      g.beginPath(); g.moveTo(gx - 3, gy - 4); g.lineTo(gx, gy); g.lineTo(gx + 1, gy - 6); g.moveTo(gx, gy); g.lineTo(gx + 4, gy - 4); g.stroke();
    }
    const fl = v === 8 ? 3 : rnd() < 0.05 ? 1 : 0;
    for (let k = 0; k < fl; k++) {
      const fx = px + 4 + rnd() * (T - 8), fy = py + 4 + rnd() * (T - 8);
      const colr = ['#fff', '#ffd84a', '#ff8ab0', '#b89aff', '#ff6a5a'][Math.floor(rnd() * 5)];
      g.fillStyle = colr;
      for (let p = 0; p < 5; p++) { const a = p / 5 * Math.PI * 2; g.beginPath(); g.arc(fx + Math.cos(a) * 2.2, fy + Math.sin(a) * 2.2, 1.7, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = '#ffec6a'; g.beginPath(); g.arc(fx, fy, 1.3, 0, Math.PI * 2); g.fill();
    }
  }
  return c;
}
function roundTile(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.fill();
}
function drawRockTile(g, px, py, col, at, x, y, type, rnd) {
  const same = (dx, dy) => { const v = at(x + dx, y + dy); return v === type || v === -1; };
  g.fillStyle = shade(col, -0.05); g.fillRect(px, py, T, T);
  g.fillStyle = shade(col, 0.08);
  for (let k = 0; k < 3; k++) { g.beginPath(); g.ellipse(px + rnd() * T, py + rnd() * T, 5 + rnd() * 6, 3 + rnd() * 4, 0, 0, Math.PI * 2); g.fill(); }
  if (!same(0, 1)) { g.fillStyle = shade(col, -0.22); g.fillRect(px, py + T - 10, T, 10); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(px, py + T, T, 5); }
  if (!same(0, -1)) { g.fillStyle = shade(col, 0.18); g.fillRect(px, py, T, 3); }
  if (!same(-1, 0)) { g.fillStyle = shade(col, -0.12); g.fillRect(px, py, 3, T); }
  if (!same(1, 0)) { g.fillStyle = shade(col, -0.12); g.fillRect(px + T - 3, py, 3, T); }
}
function drawBridge(g, px, py, at, x, y) {
  const horiz = at(x - 1, y) === 9 || at(x + 1, y) === 9 || (at(x - 1, y) !== 3 && at(x + 1, y) !== 3);
  g.fillStyle = '#b8864a'; g.fillRect(px, py, T, T);
  g.strokeStyle = '#8a5a2a'; g.lineWidth = 1.5;
  for (let k = 0; k < 4; k++) { g.beginPath(); if (horiz) { g.moveTo(px + k * 8 + 4, py); g.lineTo(px + k * 8 + 4, py + T); } else { g.moveTo(px, py + k * 8 + 4); g.lineTo(px + T, py + k * 8 + 4); } g.stroke(); }
  g.fillStyle = '#7a4a1a';
  if (horiz) { g.fillRect(px, py, T, 3); g.fillRect(px, py + T - 3, T, 3); } else { g.fillRect(px, py, 3, T); g.fillRect(px + T - 3, py, 3, T); }
}

// ---------------- 物件精灵 ----------------
const spriteCache = new Map();
function sprite(key, w, h, draw) {
  if (spriteCache.has(key)) return spriteCache.get(key);
  const c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h);
  draw(c.getContext('2d'), c.width, c.height);
  spriteCache.set(key, c);
  return c;
}
const O = 'rgba(40,24,20,.8)';
function blob(g, x, y, rx, ry, fill, stroke = O) { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fillStyle = fill; g.fill(); if (stroke) { g.strokeStyle = stroke; g.lineWidth = 1.2; g.stroke(); } }

// 返回 {img, ax, ay}：ax/ay 为锚点（精灵内对应物件脚下中心的位置）
export function objectSprite(o, theme) {
  const v = o.variant || 0;
  switch (o.type) {
    case 'tree': return treeSprite(o.kind || 'round', v, theme);
    case 'house': return houseSprite(o);
    case 'citywall': return wallSprite(o);
    default: return propSprite(o.type, v, o);
  }
}

function treeSprite(kind, v, theme) {
  const key = 'tree' + kind + v + theme;
  const W = 80, H = 110;
  const img = sprite(key, W, H, (g) => {
    const r = seeded(hashStr(key));
    const cx = W / 2, by = H - 8;
    g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(cx, by, 20, 6, 0, 0, Math.PI * 2); g.fill();
    const trunk = kind === 'cherry' ? '#7a4a3a' : kind === 'dead' ? '#6a5040' : kind === 'birch' ? '#e8e0d0' : '#8a5a32';
    if (kind === 'palm') {
      g.strokeStyle = O; g.lineWidth = 8; g.beginPath(); g.moveTo(cx, by); g.quadraticCurveTo(cx + 10, by - 40, cx + 4, by - 76); g.stroke();
      g.strokeStyle = '#a87a4a'; g.lineWidth = 6; g.stroke();
      g.strokeStyle = '#8a5a32'; g.lineWidth = 1;
      for (let k = 0; k < 8; k++) { g.beginPath(); g.moveTo(cx + 6 - k * 0.2, by - k * 9 - 4); g.lineTo(cx + 12 - k * 0.8, by - k * 9 - 6); g.stroke(); }
      for (let k = 0; k < 7; k++) {
        const a = -Math.PI / 2 + (k - 3) * 0.55;
        g.save(); g.translate(cx + 4, by - 76); g.rotate(a);
        g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(14, -8, 32, 6); g.quadraticCurveTo(14, 2, 0, 0); g.fillStyle = k % 2 ? '#4fae4a' : '#62c05a'; g.fill(); g.strokeStyle = O; g.lineWidth = 1; g.stroke();
        g.restore();
      }
      blob(g, cx + 2, by - 72, 4, 4, '#8a5a2a'); blob(g, cx + 8, by - 71, 4, 4, '#8a5a2a');
      return;
    }
    if (kind === 'bamboo') {
      for (const [dx, hgt] of [[-10, 88], [0, 100], [9, 80], [16, 70]]) {
        g.fillStyle = '#6ab84a'; g.fillRect(cx + dx - 2.5, by - hgt, 5, hgt); g.strokeStyle = O; g.lineWidth = 1; g.strokeRect(cx + dx - 2.5, by - hgt, 5, hgt);
        g.fillStyle = '#4a8a3a'; for (let y = by - 12; y > by - hgt; y -= 14) g.fillRect(cx + dx - 3, y, 6, 2);
        for (let y = by - hgt + 8; y < by - 20; y += 20) { g.save(); g.translate(cx + dx, y); g.rotate(dx < 0 ? -0.8 : 0.8); blob(g, 8, 0, 9, 2.6, '#7ccc5a', null); g.restore(); }
      }
      return;
    }
    // 树干
    g.fillStyle = trunk; g.strokeStyle = O; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(cx - 6, by); g.quadraticCurveTo(cx - 4, by - 20, cx - 4, by - 36); g.lineTo(cx + 4, by - 36); g.quadraticCurveTo(cx + 4, by - 20, cx + 7, by); g.closePath(); g.fill(); g.stroke();
    if (kind === 'dead') {
      g.strokeStyle = trunk; g.lineWidth = 4; g.lineCap = 'round';
      for (const [a, len] of [[-2.2, 26], [-0.9, 24], [-1.6, 30]]) { g.beginPath(); g.moveTo(cx, by - 34); g.lineTo(cx + Math.cos(a) * len, by - 34 + Math.sin(a) * len); g.stroke(); }
      g.lineWidth = 2; g.beginPath(); g.moveTo(cx - 10, by - 50); g.lineTo(cx - 18, by - 58); g.stroke();
      return;
    }
    const pal = {
      round: ['#4fa84a', '#62bc56', '#7ad066'], pine: ['#2f7a4a', '#3a9058', '#4aa468'], willow: ['#6ab84a', '#80c85a', '#9ad86a'],
      cherry: ['#ff9ab8', '#ffb4cc', '#ffd0e0'], maple: ['#e0582a', '#f07a3a', '#f89a4a'], peach: ['#4fa84a', '#62bc56', '#7ad066'],
      ginseng: ['#3a9a5a', '#4ab06a', '#6ac880'], ghost: ['#4a5a6a', '#5a6a7a', '#6a7a8a'], birch: ['#8ac860', '#9ad870', '#b0e080'],
      snowpine: ['#d4e2ec', '#e8f0f6', '#ffffff'], gold: ['#d8a830', '#e8c040', '#f8e070'],
    }[kind] || ['#4fa84a', '#62bc56', '#7ad066'];
    if (kind === 'pine' || kind === 'snowpine') {
      for (let k = 0; k < 4; k++) {
        const yy = by - 30 - k * 17, ww = 34 - k * 7;
        g.beginPath(); g.moveTo(cx - ww, yy); g.quadraticCurveTo(cx, yy + 6, cx + ww, yy); g.lineTo(cx, yy - 26); g.closePath();
        g.fillStyle = pal[k % 3]; g.fill(); g.strokeStyle = O; g.lineWidth = 1.2; g.stroke();
      }
      return;
    }
    if (kind === 'willow') {
      blob(g, cx, by - 58, 30, 24, pal[0]);
      g.strokeStyle = pal[1]; g.lineWidth = 3; g.lineCap = 'round';
      for (let k = -4; k <= 4; k++) { g.beginPath(); g.moveTo(cx + k * 6, by - 52); g.quadraticCurveTo(cx + k * 7.5, by - 30, cx + k * 7, by - 18 - Math.abs(k) * 2); g.stroke(); }
      blob(g, cx - 6, by - 64, 16, 12, pal[2], null);
      return;
    }
    const clusters = [[-16, -48, 18], [16, -50, 18], [0, -66, 22], [-8, -56, 16], [10, -60, 14]];
    for (const [dx, dy, rr] of clusters) blob(g, cx + dx, by + dy, rr, rr * 0.88, pal[0]);
    for (const [dx, dy, rr] of clusters) blob(g, cx + dx - 3, by + dy - 3, rr * 0.75, rr * 0.65, pal[1], null);
    blob(g, cx - 6, by - 70, 10, 7, pal[2], null);
    if (kind === 'peach' || kind === 'round' && v % 3 === 1) for (let k = 0; k < 6; k++) blob(g, cx + (r() - 0.5) * 50, by - 44 - r() * 34, 3.2, 3.2, kind === 'peach' ? '#ff9a8a' : '#ff5a4a', O);
    if (kind === 'cherry') for (let k = 0; k < 10; k++) { g.fillStyle = '#fff'; g.beginPath(); g.arc(cx + (r() - 0.5) * 56, by - 40 - r() * 40, 1.6, 0, Math.PI * 2); g.fill(); }
  });
  return { img, ax: W / 2, ay: H - 8 };
}

const ROOF = {
  common: ['#5a6a82', '#6e7e98'], shop: ['#4a5a7a', '#5e6e90'], rich: ['#3a7a6a', '#4a8e7c'], palace: ['#e0a830', '#f0c040'],
  temple: ['#e0a830', '#f0c040'], office: ['#8a3a2a', '#a04a36'], hut: ['#a8844a', '#c09a5a'], red: ['#b83a2a', '#d04a36'],
  jade: ['#2a8a7a', '#3aa08c'], dark: ['#3a3040', '#4a4050'], coral: ['#e87a6a', '#f8968a'], cloud: ['#d8e4f8', '#f0f4ff'],
};
function houseSprite(o) {
  const style = o.style || 'common';
  const w = o.w * T, h = o.h * T;
  const roofUp = Math.round(T * 1.1);
  const W = w + 24, H = h + roofUp + 6;
  const key = 'house' + style + o.w + 'x' + o.h + (o.sign || '');
  const img = sprite(key, W, H, (g) => {
    const x0 = 12, y0 = roofUp, x1 = x0 + w, y1 = y0 + h;
    const wallH = Math.min(62, Math.max(40, h * 0.5));
    const wy = y1 - wallH;
    const palace = style === 'palace' || style === 'temple' || style === 'office';
    const wallC = style === 'hut' ? '#d8b888' : palace ? '#c83a2a' : style === 'coral' ? '#f8e0d0' : style === 'cloud' ? '#f4f0e0' : style === 'dark' ? '#6a6070' : '#f4e6c8';
    // 阴影
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x0 + 4, y1 - 2, w, 6);
    // 墙
    g.fillStyle = wallC; g.fillRect(x0 + 4, wy, w - 8, wallH);
    g.strokeStyle = O; g.lineWidth = 1.4; g.strokeRect(x0 + 4, wy, w - 8, wallH);
    g.fillStyle = shade(wallC, -0.12); g.fillRect(x0 + 4, y1 - 7, w - 8, 7);
    // 柱子
    const pillar = palace ? '#8a1a14' : '#8a4a2a';
    const cols = Math.max(2, Math.round(o.w / 2) + 1);
    for (let i = 0; i < cols; i++) { const px = x0 + 4 + i * (w - 16) / (cols - 1); g.fillStyle = pillar; g.fillRect(px, wy, 8, wallH); g.strokeStyle = O; g.lineWidth = 1; g.strokeRect(px, wy, 8, wallH); }
    // 门
    const dw = Math.min(30, w * 0.25), dh = wallH * 0.72, dx = x0 + w / 2 - dw / 2;
    g.fillStyle = palace ? '#6a1010' : '#6a3a1a'; g.fillRect(dx, y1 - dh, dw, dh);
    g.strokeStyle = O; g.strokeRect(dx, y1 - dh, dw, dh);
    g.fillStyle = '#f0c040'; g.beginPath(); g.arc(dx + dw / 2 - 4, y1 - dh / 2, 1.8, 0, Math.PI * 2); g.arc(dx + dw / 2 + 4, y1 - dh / 2, 1.8, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.moveTo(dx + dw / 2, y1 - dh); g.lineTo(dx + dw / 2, y1); g.stroke();
    // 窗
    const winW = 22, winH = Math.min(20, wallH * 0.4);
    for (const wx of [x0 + w * 0.22 - winW / 2, x0 + w * 0.78 - winW / 2]) {
      if (w < 150 && Math.abs(wx + winW / 2 - (x0 + w / 2)) < dw) continue;
      g.fillStyle = '#f8f0d8'; g.fillRect(wx, wy + 12, winW, winH); g.strokeStyle = '#8a4a2a'; g.lineWidth = 1.5; g.strokeRect(wx, wy + 12, winW, winH);
      g.lineWidth = 1; for (let k = 1; k < 3; k++) { g.beginPath(); g.moveTo(wx + k * winW / 3, wy + 12); g.lineTo(wx + k * winW / 3, wy + 12 + winH); g.stroke(); }
      g.beginPath(); g.moveTo(wx, wy + 12 + winH / 2); g.lineTo(wx + winW, wy + 12 + winH / 2); g.stroke();
    }
    // 屋顶
    const [rc, rc2] = ROOF[style] || ROOF.common;
    const eave = wy + 6, top = 6, over = 10;
    g.beginPath();
    g.moveTo(x0 - over, eave); g.quadraticCurveTo(x0 - over - 4, eave - 8, x0 - over - 8, eave - 14);
    g.lineTo(x0 + w * 0.14, top + 8); g.lineTo(x1 - w * 0.14, top + 8);
    g.lineTo(x1 + over + 8, eave - 14); g.quadraticCurveTo(x1 + over + 4, eave - 8, x1 + over, eave);
    g.closePath();
    const gr = g.createLinearGradient(0, top, 0, eave); gr.addColorStop(0, rc2); gr.addColorStop(1, rc);
    g.fillStyle = gr; g.fill(); g.strokeStyle = O; g.lineWidth = 1.5; g.stroke();
    // 瓦片
    g.save(); g.clip();
    g.strokeStyle = shade(rc, -0.12); g.lineWidth = 1;
    for (let yy = top + 16; yy < eave; yy += 9) { g.beginPath(); for (let xx = x0 - 20; xx < x1 + 20; xx += 10) { g.moveTo(xx, yy); g.arc(xx + 5, yy, 5, Math.PI, 0, true); } g.stroke(); }
    g.restore();
    g.fillStyle = shade(rc, -0.2); g.fillRect(x0 - over, eave - 3, w + over * 2, 4);
    // 屋脊
    g.fillStyle = shade(rc, -0.25); g.fillRect(x0 + w * 0.12, top + 4, w * 0.76, 6);
    for (const [ex, dirx] of [[x0 + w * 0.12, -1], [x1 - w * 0.12, 1]]) { g.beginPath(); g.moveTo(ex, top + 10); g.quadraticCurveTo(ex + dirx * 8, top + 6, ex + dirx * 10, top - 2); g.lineWidth = 4; g.strokeStyle = shade(rc, -0.25); g.stroke(); }
    if (palace) { blob(g, x0 + w / 2, top + 4, 5, 5, '#f8d850'); }
    // 招牌
    if (o.sign) {
      const sw = Math.max(34, o.sign.length * 18 + 12), sx = x0 + w / 2 - sw / 2, sy = wy - 2;
      g.fillStyle = '#3a2010'; g.fillRect(sx - 2, sy - 2, sw + 4, 24);
      g.fillStyle = '#f4d060'; g.fillRect(sx, sy, sw, 20);
      g.fillStyle = '#6a1a10'; g.font = 'bold 15px "KaiTi","STKaiti",serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(o.sign, x0 + w / 2, sy + 10.5);
    }
    // 灯笼
    if (o.lantern !== false && (o.sign || palace)) for (const lx of [x0 + 14, x1 - 14]) { g.strokeStyle = '#3a2010'; g.beginPath(); g.moveTo(lx, eave); g.lineTo(lx, eave + 5); g.stroke(); blob(g, lx, eave + 12, 6, 8, '#e8402a'); g.fillStyle = '#f0c040'; g.fillRect(lx - 3, eave + 3, 6, 2); g.fillRect(lx - 3, eave + 19, 6, 2); }
  });
  return { img, ax: 12, ay: roofUp, box: true };
}

function wallSprite(o) {
  const w = o.w * T, h = o.h * T;
  const up = 30;
  const key = 'wall' + o.w + 'x' + o.h + (o.color || '');
  const img = sprite(key, w, h + up, (g) => {
    const col = o.color || '#9a948a';
    g.fillStyle = shade(col, -0.1); g.fillRect(0, up, w, h);
    g.fillStyle = col; g.fillRect(0, 0, w, up + 8);
    g.strokeStyle = shade(col, -0.25); g.lineWidth = 1;
    for (let y = 4; y < up + h; y += 10) for (let x = (y / 10 % 2) * 10; x < w; x += 20) g.strokeRect(x + 0.5, y + 0.5, 20, 10);
    g.fillStyle = shade(col, 0.1);
    for (let x = 0; x < w; x += 16) g.fillRect(x, 0, 10, 6);
    g.strokeStyle = O; g.lineWidth = 1.5; g.strokeRect(0.5, 0.5, w - 1, h + up - 1);
  });
  return { img, ax: 0, ay: up, box: true };
}

function propSprite(type, v, o) {
  const key = type + v + (o.color || '');
  const W = 64, H = 80;
  const img = sprite(key, W, H, (g) => {
    const cx = W / 2, by = H - 8;
    const sh = (rx = 14) => { g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(cx, by, rx, rx * 0.3, 0, 0, Math.PI * 2); g.fill(); };
    switch (type) {
      case 'bush': sh(16); blob(g, cx - 8, by - 8, 11, 9, '#4a9a42'); blob(g, cx + 8, by - 8, 11, 9, '#4a9a42'); blob(g, cx, by - 14, 12, 10, '#5cb050'); if (v % 2) for (let k = 0; k < 4; k++) blob(g, cx - 10 + k * 7, by - 12 - (k % 2) * 6, 2.4, 2.4, '#ff6a8a', null); break;
      case 'rock': sh(16); g.beginPath(); g.moveTo(cx - 16, by); g.lineTo(cx - 12, by - 14); g.lineTo(cx - 2, by - 20); g.lineTo(cx + 12, by - 14); g.lineTo(cx + 16, by); g.closePath(); g.fillStyle = o.color || '#9a9488'; g.fill(); g.strokeStyle = O; g.lineWidth = 1.2; g.stroke(); g.fillStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.moveTo(cx - 10, by - 12); g.lineTo(cx - 2, by - 18); g.lineTo(cx + 4, by - 13); g.closePath(); g.fill(); break;
      case 'lantern': sh(8); g.fillStyle = '#6a4a2a'; g.fillRect(cx - 2, by - 44, 4, 44); g.fillRect(cx - 10, by - 46, 20, 3); blob(g, cx - 8, by - 34, 5, 7, '#e8402a'); blob(g, cx + 8, by - 34, 5, 7, '#e8402a'); break;
      case 'stonelamp': sh(10); g.fillStyle = '#b0aaa0'; g.fillRect(cx - 4, by - 26, 8, 26); g.fillRect(cx - 10, by - 4, 20, 4); g.fillRect(cx - 9, by - 36, 18, 10); g.fillStyle = '#ffe080'; g.fillRect(cx - 5, by - 34, 10, 6); g.beginPath(); g.moveTo(cx - 13, by - 36); g.lineTo(cx, by - 46); g.lineTo(cx + 13, by - 36); g.fillStyle = '#8a847a'; g.fill(); g.strokeStyle = O; g.stroke(); break;
      case 'well': sh(18); blob(g, cx, by - 8, 18, 9, '#9a948a'); blob(g, cx, by - 10, 13, 6, '#3a6a8a', null); g.fillStyle = '#6a4a2a'; g.fillRect(cx - 17, by - 38, 4, 30); g.fillRect(cx + 13, by - 38, 4, 30); g.beginPath(); g.moveTo(cx - 22, by - 36); g.lineTo(cx, by - 48); g.lineTo(cx + 22, by - 36); g.fillStyle = '#6a7a92'; g.fill(); g.strokeStyle = O; g.stroke(); break;
      case 'stall': sh(24); g.fillStyle = '#8a5a2a'; g.fillRect(cx - 22, by - 16, 44, 16); g.strokeStyle = O; g.strokeRect(cx - 22, by - 16, 44, 16); g.fillStyle = '#6a4a2a'; g.fillRect(cx - 22, by - 44, 3, 28); g.fillRect(cx + 19, by - 44, 3, 28); for (let k = 0; k < 6; k++) { g.fillStyle = k % 2 ? '#f4f0e0' : o.color || '#e8503a'; g.fillRect(cx - 26 + k * 9, by - 50, 9, 10); } for (let k = 0; k < 5; k++) blob(g, cx - 16 + k * 8, by - 19, 3.5, 3, ['#ffb030', '#ff6a4a', '#8ad040', '#f8e060', '#c07ae0'][k], O); break;
      case 'barrel': sh(10); g.fillStyle = '#a8703a'; g.beginPath(); g.ellipse(cx, by - 14, 11, 15, 0, 0, Math.PI * 2); g.fill(); g.strokeStyle = O; g.stroke(); g.fillStyle = '#5a4030'; g.fillRect(cx - 11, by - 22, 22, 3); g.fillRect(cx - 11, by - 8, 22, 3); break;
      case 'crate': sh(12); g.fillStyle = '#c0904a'; g.fillRect(cx - 12, by - 22, 24, 22); g.strokeStyle = O; g.strokeRect(cx - 12, by - 22, 24, 22); g.strokeStyle = '#8a5a2a'; g.beginPath(); g.moveTo(cx - 12, by - 22); g.lineTo(cx + 12, by); g.moveTo(cx + 12, by - 22); g.lineTo(cx - 12, by); g.stroke(); break;
      case 'bones': g.strokeStyle = '#f0ece0'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx - 12, by - 2); g.lineTo(cx + 8, by - 8); g.moveTo(cx - 6, by - 10); g.lineTo(cx + 12, by - 1); g.stroke(); blob(g, cx - 4, by - 12, 6, 5, '#f4f0e4'); g.fillStyle = '#3a2a2a'; g.fillRect(cx - 7, by - 13, 2, 2); g.fillRect(cx - 3, by - 13, 2, 2); break;
      case 'skull': blob(g, cx, by - 8, 8, 7, '#f4f0e4'); g.fillStyle = '#3a2a2a'; g.beginPath(); g.arc(cx - 3, by - 8, 2, 0, 7); g.arc(cx + 3, by - 8, 2, 0, 7); g.fill(); break;
      case 'tent': sh(26); g.beginPath(); g.moveTo(cx - 26, by); g.lineTo(cx, by - 44); g.lineTo(cx + 26, by); g.closePath(); g.fillStyle = o.color || '#c8a870'; g.fill(); g.strokeStyle = O; g.lineWidth = 1.4; g.stroke(); g.beginPath(); g.moveTo(cx - 8, by); g.lineTo(cx, by - 26); g.lineTo(cx + 8, by); g.fillStyle = '#4a3020'; g.fill(); break;
      case 'campfire': blob(g, cx, by - 3, 14, 5, '#6a4a2a'); for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(cx - 8 + k * 8, by - 4); g.quadraticCurveTo(cx - 10 + k * 8, by - 16, cx - 6 + k * 8, by - 24 + k * 3); g.quadraticCurveTo(cx - 2 + k * 8, by - 14, cx - 2 + k * 8, by - 4); g.fillStyle = ['#ff8a2a', '#ffc040', '#ff6a1a'][k]; g.fill(); } break;
      case 'boat': sh(26); g.beginPath(); g.moveTo(cx - 28, by - 14); g.quadraticCurveTo(cx, by + 4, cx + 28, by - 14); g.lineTo(cx + 22, by - 6); g.quadraticCurveTo(cx, by + 2, cx - 22, by - 6); g.closePath(); g.fillStyle = '#9a6a3a'; g.fill(); g.strokeStyle = O; g.stroke(); g.fillStyle = '#6a4020'; g.fillRect(cx - 1, by - 50, 3, 42); g.beginPath(); g.moveTo(cx + 2, by - 48); g.lineTo(cx + 20, by - 20); g.lineTo(cx + 2, by - 16); g.fillStyle = '#f4ecd8'; g.fill(); g.stroke(); break;
      case 'coral': for (const [dx, c] of [[-8, '#ff7a8a'], [6, '#ffa05a'], [0, '#ff5a7a']]) { g.strokeStyle = c; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx + dx, by); g.lineTo(cx + dx, by - 20); g.moveTo(cx + dx, by - 12); g.lineTo(cx + dx - 6, by - 22); g.moveTo(cx + dx, by - 16); g.lineTo(cx + dx + 6, by - 26); g.stroke(); } break;
      case 'shell': blob(g, cx, by - 5, 8, 6, '#ffd8c8'); g.strokeStyle = '#d8a898'; g.lineWidth = 1; for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(cx, by); g.lineTo(cx + k * 3.5, by - 10); g.stroke(); } break;
      case 'stump': sh(12); g.fillStyle = '#8a5a32'; g.fillRect(cx - 10, by - 12, 20, 12); g.strokeStyle = O; g.strokeRect(cx - 10, by - 12, 20, 12); blob(g, cx, by - 12, 10, 4, '#d8b080'); break;
      case 'statue': sh(16); g.fillStyle = '#b8b0a0'; g.fillRect(cx - 14, by - 14, 28, 14); g.strokeStyle = O; g.strokeRect(cx - 14, by - 14, 28, 14); blob(g, cx, by - 30, 10, 14, '#c8c0b0'); blob(g, cx, by - 48, 8, 8, '#c8c0b0'); break;
      case 'lion': sh(14); g.fillStyle = '#a8a098'; g.fillRect(cx - 12, by - 10, 24, 10); blob(g, cx, by - 22, 12, 12, '#b8b0a4'); blob(g, cx + 3, by - 30, 9, 9, '#c8c0b4'); g.fillStyle = '#3a3030'; g.fillRect(cx + 4, by - 32, 2, 2); break;
      case 'signpost': sh(8); g.fillStyle = '#8a5a2a'; g.fillRect(cx - 2, by - 40, 4, 40); g.fillStyle = '#c89a5a'; g.fillRect(cx - 16, by - 40, 32, 12); g.strokeStyle = O; g.strokeRect(cx - 16, by - 40, 32, 12); break;
      case 'torch': g.fillStyle = '#5a4030'; g.fillRect(cx - 2, by - 30, 4, 30); for (let k = 0; k < 2; k++) { g.beginPath(); g.moveTo(cx - 6, by - 30); g.quadraticCurveTo(cx - 4 + k * 4, by - 46, cx + 1, by - 50 + k * 6); g.quadraticCurveTo(cx + 6, by - 40, cx + 6, by - 30); g.fillStyle = k ? '#ffd040' : '#ff7a1a'; g.fill(); } break;
      case 'web': g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1; for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; g.beginPath(); g.moveTo(cx, by - 30); g.lineTo(cx + Math.cos(a) * 26, by - 30 + Math.sin(a) * 26); g.stroke(); } for (const rr of [8, 16, 24]) { g.beginPath(); for (let k = 0; k <= 8; k++) { const a = k / 8 * Math.PI * 2; g.lineTo(cx + Math.cos(a) * rr, by - 30 + Math.sin(a) * rr); } g.stroke(); } break;
      case 'pillar': sh(12); g.fillStyle = o.color || '#c83a2a'; g.fillRect(cx - 7, by - 64, 14, 64); g.strokeStyle = O; g.strokeRect(cx - 7, by - 64, 14, 64); g.fillStyle = '#f0c040'; g.fillRect(cx - 9, by - 66, 18, 6); g.fillRect(cx - 9, by - 4, 18, 4); break;
      case 'lotus': blob(g, cx, by - 4, 16, 6, '#4aa85a'); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI - Math.PI; g.beginPath(); g.ellipse(cx + Math.cos(a) * 6, by - 10 + Math.sin(a) * 4, 3.5, 7, a + Math.PI / 2, 0, Math.PI * 2); g.fillStyle = '#ffb0c8'; g.fill(); g.strokeStyle = '#d87a98'; g.stroke(); } break;
      case 'bluefire': blob(g, cx, by - 4, 8, 3, '#3a3a5a'); for (let k = 0; k < 2; k++) { g.beginPath(); g.moveTo(cx - 6, by - 4); g.quadraticCurveTo(cx - 5 + k * 3, by - 22, cx, by - 30 + k * 8); g.quadraticCurveTo(cx + 6, by - 16, cx + 6, by - 4); g.fillStyle = k ? '#c8e8ff' : '#6a8aff'; g.fill(); } break;
      case 'haystack': sh(16); g.beginPath(); g.moveTo(cx - 18, by); g.quadraticCurveTo(cx - 16, by - 30, cx, by - 32); g.quadraticCurveTo(cx + 16, by - 30, cx + 18, by); g.closePath(); g.fillStyle = '#e8c860'; g.fill(); g.strokeStyle = O; g.stroke(); break;
      case 'fence': g.fillStyle = '#b8864a'; g.fillRect(0, by - 14, W, 4); g.fillRect(0, by - 6, W, 3); for (let x = 4; x < W; x += 16) { g.fillRect(x, by - 22, 5, 22); g.strokeStyle = O; g.lineWidth = 1; g.strokeRect(x, by - 22, 5, 22); } break;
      case 'flowerpot': sh(10); g.fillStyle = '#b8603a'; g.beginPath(); g.moveTo(cx - 10, by - 14); g.lineTo(cx + 10, by - 14); g.lineTo(cx + 7, by); g.lineTo(cx - 7, by); g.fill(); blob(g, cx, by - 20, 10, 8, '#4a9a42'); for (let k = 0; k < 4; k++) blob(g, cx - 6 + k * 4, by - 24 + (k % 2) * 4, 2.5, 2.5, o.color || '#ff6a8a', null); break;
      case 'cloud': g.globalAlpha = 0.9; blob(g, cx - 10, by - 10, 14, 9, '#fff', null); blob(g, cx + 8, by - 12, 14, 10, '#fff', null); blob(g, cx, by - 18, 12, 9, '#fff', null); break;
      case 'crystal': sh(10); for (const [dx, hh, c] of [[-6, 26, '#8ad0ff'], [5, 34, '#a8e0ff'], [0, 20, '#6ab0f0']]) { g.beginPath(); g.moveTo(cx + dx - 5, by); g.lineTo(cx + dx, by - hh); g.lineTo(cx + dx + 5, by); g.closePath(); g.fillStyle = c; g.fill(); g.strokeStyle = O; g.stroke(); } break;
      case 'wreck': {
        g.canvas.width = 200; g.canvas.height = 110;
        const c2 = 100, b2 = 100;
        g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(c2, b2, 90, 14, 0, 0, Math.PI * 2); g.fill();
        g.beginPath(); g.moveTo(c2 - 90, b2 - 40); g.quadraticCurveTo(c2 - 40, b2 + 6, c2 + 80, b2 - 10); g.lineTo(c2 + 88, b2 - 46); g.lineTo(c2 - 90, b2 - 40); g.closePath();
        g.fillStyle = '#7a5030'; g.fill(); g.strokeStyle = O; g.lineWidth = 2; g.stroke();
        g.strokeStyle = '#5a3820'; g.lineWidth = 1.5; for (let y = b2 - 36; y < b2; y += 9) { g.beginPath(); g.moveTo(c2 - 86, y); g.quadraticCurveTo(c2, y + 14, c2 + 84, y - 4); g.stroke(); }
        g.fillStyle = '#3a2010'; g.beginPath(); g.ellipse(c2 - 10, b2 - 20, 14, 10, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#6a4020'; g.save(); g.translate(c2 + 20, b2 - 44); g.rotate(0.35); g.fillRect(-3, -60, 6, 62); g.restore();
        g.beginPath(); g.moveTo(c2 + 26, b2 - 90); g.lineTo(c2 + 60, b2 - 70); g.lineTo(c2 + 30, b2 - 60); g.fillStyle = 'rgba(230,220,200,.85)'; g.fill();
        break;
      }
      default: blob(g, cx, by - 8, 10, 8, '#999');
    }
  });
  if (type === 'wreck') return { img, ax: 100, ay: 100 };
  if (type === 'fence') return { img, ax: 0, ay: H - 8 - T / 2 };
  return { img, ax: W / 2, ay: H - 8 };
}
