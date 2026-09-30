// 程序绘制的 Q 版角色、怪物
const TAU = Math.PI * 2;
const OUT = 'rgba(40,24,20,.85)';

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = Math.max(0, Math.min(255, Math.round(r + amt * 255)));
  g = Math.max(0, Math.min(255, Math.round(g + amt * 255)));
  b = Math.max(0, Math.min(255, Math.round(b + amt * 255)));
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}
export { shade };

function ell(ctx, x, y, rx, ry, fill, stroke = OUT, lw = 1.2) {
  ctx.beginPath(); ctx.ellipse(x, y, Math.abs(rx), Math.abs(ry), 0, 0, TAU);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}
function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function poly(ctx, pts, fill, stroke = OUT, lw = 1.2) {
  ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}
export function shadow(ctx, x, y, rx = 13, ry = 4.5) {
  ctx.fillStyle = 'rgba(0,0,0,.22)';
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill();
}

// ---------------- 武器 ----------------
function weapon(ctx, type, lk, swing = 0) {
  ctx.save();
  ctx.rotate(swing);
  const metal = '#dfe8f4', dark = '#6a7080', gold = '#f0c040';
  switch (type) {
    case 'sword': case 'saber':
      rrect(ctx, -1.5, -2, 3, 6, 1); ctx.fillStyle = '#7a4a2a'; ctx.fill();
      poly(ctx, [-5, -2, 5, -2, 5, -4, -5, -4], gold);
      poly(ctx, type === 'saber' ? [-2, -4, 3, -4, 5, -22, -1, -26] : [-2, -4, 2, -4, 1.5, -26, 0, -29, -1.5, -26], metal, dark, 1);
      break;
    case 'fan':
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 14, -Math.PI * 0.85, -Math.PI * 0.15); ctx.closePath();
      ctx.fillStyle = '#fff8e8'; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1; ctx.stroke();
      ctx.strokeStyle = '#a8864a'; ctx.lineWidth = 0.7;
      for (let a = -0.85; a <= -0.15; a += 0.14) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a * Math.PI) * 14, Math.sin(a * Math.PI) * 14); ctx.stroke(); }
      ctx.fillStyle = '#6db38f'; ctx.beginPath(); ctx.arc(0, -9, 2.5, 0, TAU); ctx.fill();
      break;
    case 'ring':
      ell(ctx, 0, -6, 7, 7, null, gold, 3); ell(ctx, 0, -6, 7, 7, null, OUT, 0.8);
      ctx.fillStyle = lk?.ribbon || '#ff5a8a'; ctx.beginPath(); ctx.arc(0, 1, 2, 0, TAU); ctx.fill();
      break;
    case 'whip':
      ctx.strokeStyle = '#8a4a2a'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(10, -8, 4, -16); ctx.quadraticCurveTo(-2, -22, 8, -26); ctx.stroke();
      rrect(ctx, -1.5, -1, 3, 6, 1); ctx.fillStyle = gold; ctx.fill();
      break;
    case 'spear':
      ctx.fillStyle = '#8a4a2a'; ctx.fillRect(-1.2, -30, 2.4, 40);
      poly(ctx, [-3, -30, 3, -30, 0, -40], metal, dark, 1);
      ctx.fillStyle = '#e2433a'; ctx.beginPath(); ctx.moveTo(-3, -29); ctx.lineTo(3, -29); ctx.lineTo(4, -24); ctx.lineTo(-4, -24); ctx.fill();
      break;
    case 'ribbon':
      ctx.strokeStyle = lk?.ribbon || '#ff9ad2'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(12, -6, -6, -14, 8, -22); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
      break;
    case 'axe':
      ctx.fillStyle = '#6a3a1a'; ctx.fillRect(-1.5, -24, 3, 30);
      ctx.beginPath(); ctx.moveTo(1, -22); ctx.quadraticCurveTo(14, -26, 12, -14); ctx.quadraticCurveTo(8, -14, 1, -14); ctx.closePath();
      ctx.fillStyle = metal; ctx.fill(); ctx.strokeStyle = dark; ctx.lineWidth = 1; ctx.stroke();
      break;
    case 'claw':
      ctx.strokeStyle = metal; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      for (const dx of [-3, 0, 3]) { ctx.beginPath(); ctx.moveTo(dx, -1); ctx.quadraticCurveTo(dx + 2, -8, dx + 5, -12); ctx.stroke(); }
      break;
    case 'staff':
      ctx.fillStyle = '#7a5a3a'; ctx.fillRect(-1.2, -30, 2.4, 38);
      ell(ctx, 0, -32, 4, 4, '#8ad0ff');
      break;
    case 'dice':
      rrect(ctx, -4, -9, 8, 8, 2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#d02020'; ctx.beginPath(); ctx.arc(0, -5, 1.4, 0, TAU); ctx.fill();
      break;
    case 'basket':
      ell(ctx, 0, -2, 7, 4.5, '#c89a5a');
      ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(0, -3, 6, Math.PI, TAU); ctx.stroke();
      break;
  }
  ctx.restore();
}

// ---------------- 头发 ----------------
function hairBack(ctx, lk, dir) {
  const h = lk.hair, st = lk.hairStyle;
  const long = ['fairy', 'fox', 'longhair', 'twin', 'pony'].includes(st);
  if (st === 'pony') {
    const side = dir === 'right' ? -1 : 1;
    ctx.save();
    poly(ctx, [side * 4, -44, side * 16, -40, side * 17, -24, side * 11, -18, side * 8, -30], h);
    ctx.restore();
    ctx.fillStyle = lk.ribbon; ctx.beginPath(); ctx.arc(side * 6, -44, 2.6, 0, TAU); ctx.fill();
  }
  if (long && st !== 'pony') {
    const bottom = st === 'twin' ? -26 : -14;
    ctx.beginPath();
    ctx.moveTo(-13, -36); ctx.quadraticCurveTo(-17, -22, -12, bottom); ctx.lineTo(12, bottom); ctx.quadraticCurveTo(17, -22, 13, -36); ctx.closePath();
    ctx.fillStyle = h; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.2; ctx.stroke();
  }
  if (st === 'fox' && lk.tail) {
    // 尾巴
    ctx.save(); ctx.translate(dir === 'right' ? -8 : 9, -10);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(14, 4, 20, -14, 12, -22); ctx.bezierCurveTo(10, -10, 6, -6, 0, -4); ctx.closePath();
    ctx.fillStyle = lk.tail; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.1; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(13, -19, 3, 0, TAU); ctx.fill();
    ctx.restore();
  }
  if (st === 'horse') poly(ctx, [-4, -48, 4, -48, 6, -20, -6, -20], h);
}
function hairFront(ctx, lk, dir) {
  const h = lk.hair, st = lk.hairStyle;
  const hl = shade(h, 0.12);
  if (st === 'bald') {
    if (lk.skeleton) return;
    ctx.fillStyle = shade(lk.skin, -0.08);
    for (const [x, y] of [[-3, -43], [0, -44], [3, -43]]) { ctx.beginPath(); ctx.arc(x, y, 0.8, 0, TAU); ctx.fill(); }
    return;
  }
  if (dir === 'up') {
    ctx.beginPath(); ctx.arc(0, -34, 13.6, 0, TAU); ctx.fillStyle = h; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.2; ctx.stroke();
  } else {
    // 头顶与刘海
    ctx.beginPath();
    ctx.arc(0, -34, 13.8, Math.PI * 1.02, Math.PI * 1.98);
    if (dir === 'right') { ctx.lineTo(13, -34); ctx.quadraticCurveTo(8, -40, 3, -37); ctx.quadraticCurveTo(-4, -40, -9, -35); ctx.lineTo(-13.5, -28); }
    else { ctx.quadraticCurveTo(10, -36, 7, -38); ctx.quadraticCurveTo(4, -35, 2, -38); ctx.quadraticCurveTo(-2, -35, -4, -39); ctx.quadraticCurveTo(-8, -35, -11, -37); ctx.lineTo(-13.6, -30); }
    ctx.closePath();
    ctx.fillStyle = h; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.strokeStyle = hl; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(-2, -38, 8, Math.PI * 1.15, Math.PI * 1.45); ctx.stroke();
  }
  const side = dir === 'right' ? 1 : 0;
  switch (st) {
    case 'topknot':
      ell(ctx, 0, -49, 5, 4.5, h); ctx.fillStyle = lk.ribbon;
      ctx.fillRect(-6, -46.5, 12, 2.4);
      if (dir !== 'up') { poly(ctx, [-6, -45, -12, -40, -9, -38], lk.ribbon); }
      break;
    case 'scholar':
      poly(ctx, [-12, -40, 12, -40, 9, -52, -9, -52], lk.cloth2 || '#6db38f');
      ctx.fillStyle = '#fff'; ctx.fillRect(-9, -43, 18, 1.5);
      poly(ctx, [side ? -10 : 9, -44, side ? -18 : 16, -34, side ? -14 : 13, -32], lk.cloth2 || '#6db38f');
      break;
    case 'twin':
      for (const sx of [-1, 1]) { ell(ctx, sx * 12, -44, 5.5, 5.5, h); ctx.fillStyle = lk.ribbon; ctx.beginPath(); ctx.arc(sx * 12, -38.5, 2.2, 0, TAU); ctx.fill(); }
      break;
    case 'dragon':
      for (const sx of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(sx * 6, -45); ctx.quadraticCurveTo(sx * 12, -54, sx * 8, -60); ctx.quadraticCurveTo(sx * 9, -52, sx * 3, -47); ctx.closePath();
        ctx.fillStyle = '#f4ecd0'; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1; ctx.stroke();
      }
      poly(ctx, [-5, -46, 0, -52, 5, -46], lk.ribbon);
      break;
    case 'fairy':
      for (const sx of [-1, 1]) ell(ctx, sx * 11, -46, 4, 6, h);
      ctx.fillStyle = lk.ribbon; ctx.beginPath(); ctx.arc(7, -46, 2.5, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff4a0'; ctx.beginPath(); ctx.arc(-6, -47, 1.8, 0, TAU); ctx.fill();
      break;
    case 'demon':
      for (let i = -2; i <= 2; i++) poly(ctx, [i * 5 - 4, -44, i * 5 + 4, -44, i * 6, -54 - (2 - Math.abs(i)) * 2], h);
      for (const sx of [-1, 1]) poly(ctx, [sx * 9, -42, sx * 13, -44, sx * 17, -54], '#f4ecd0');
      break;
    case 'fox':
      for (const sx of [-1, 1]) { poly(ctx, [sx * 4, -45, sx * 13, -44, sx * 12, -57], h); poly(ctx, [sx * 6.5, -46, sx * 11, -45.5, sx * 11, -52], '#ffd8e0', null); }
      break;
    case 'bun':
      ell(ctx, dir === 'right' ? -7 : 0, dir === 'up' ? -40 : -47, 6, 5, h);
      ctx.fillStyle = lk.ribbon; ctx.fillRect(-1, -52, 2, 6);
      break;
    case 'oldman':
      break;
    case 'hat':
      ell(ctx, 0, -44, 15, 4, lk.cloth2 || '#555');
      poly(ctx, [-8, -44, 8, -44, 7, -53, -7, -53], lk.cloth || '#444');
      break;
    case 'helmet':
      ctx.beginPath(); ctx.arc(0, -36, 14.5, Math.PI, TAU); ctx.closePath(); ctx.fillStyle = lk.cloth; ctx.fill(); ctx.strokeStyle = OUT; ctx.stroke();
      ctx.fillStyle = lk.ribbon; ctx.beginPath(); ctx.moveTo(0, -50); ctx.quadraticCurveTo(6, -58, 2, -62); ctx.quadraticCurveTo(-2, -56, 0, -50); ctx.fill();
      ctx.fillStyle = lk.cloth2; ctx.fillRect(-14, -38, 28, 2.5);
      break;
    case 'bandana':
      ctx.beginPath(); ctx.arc(0, -35, 14, Math.PI * 1.02, Math.PI * 1.98); ctx.closePath(); ctx.fillStyle = lk.ribbon; ctx.fill(); ctx.strokeStyle = OUT; ctx.stroke();
      poly(ctx, [side ? -12 : 12, -38, side ? -19 : 19, -42, side ? -18 : 18, -34], lk.ribbon);
      break;
    case 'goat':
      for (const sx of [-1, 1]) {
        ctx.strokeStyle = '#c8b890'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(sx * 13, -44, 6, sx > 0 ? Math.PI : 0, sx > 0 ? Math.PI * 2.4 : -Math.PI * 1.4, sx < 0); ctx.stroke();
      }
      break;
    case 'bull':
      for (const sx of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(sx * 9, -42); ctx.quadraticCurveTo(sx * 22, -44, sx * 20, -56); ctx.quadraticCurveTo(sx * 16, -47, sx * 8, -46); ctx.closePath();
        ctx.fillStyle = '#f4ecd0'; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1; ctx.stroke();
      }
      break;
    case 'horse':
      for (const sx of [-1, 1]) poly(ctx, [sx * 5, -45, sx * 10, -46, sx * 9, -54], lk.skin);
      break;
    case 'qing':
      poly(ctx, [-13, -41, 13, -41, 10, -50, -10, -50], '#2a2a3a');
      ell(ctx, 0, -51, 3, 2.5, '#d02a2a');
      break;
  }
}

// ---------------- Q 版人物 ----------------
// o: {dir, t, moving, pose:'idle'|'walk'|'attack'|'cast'|'hurt'|'dead', alpha, weapon, flash}
export function drawChibi(ctx, x, y, lk, o = {}) {
  const dir = o.dir || 'down';
  const t = o.t || 0;
  const s = o.scale || 1;
  ctx.save();
  ctx.translate(x, y);
  if (o.pose === 'dead') {
    shadow(ctx, 0, 0, 20 * s, 5 * s);
    ctx.scale(s, s); ctx.translate(0, -6); ctx.rotate(-Math.PI / 2 * (dir === 'left' ? -1 : 1)); ctx.globalAlpha = 0.85;
    drawBody(ctx, lk, 'down', 0, false, {}, o);
    ctx.restore();
    return;
  }
  shadow(ctx, 0, 0, (lk.big ? 16 : 13) * s, 4.5 * s);
  ctx.scale(dir === 'left' ? -s : s, s);
  if (o.alpha != null) ctx.globalAlpha = o.alpha;
  if (lk.ghostly) ctx.globalAlpha *= 0.82;
  const bob = o.moving ? -Math.abs(Math.sin(t * 12)) * 2 : Math.sin(t * 3) * 0.6;
  ctx.translate(0, bob);
  drawBody(ctx, lk, dir === 'left' ? 'right' : dir, t, o.moving, o, o);
  ctx.restore();
}

function drawBody(ctx, lk, dir, t, moving, o) {
  const big = lk.big ? 1.22 : 1;
  const fem = lk.gender === 'f';
  const wtype = o.weapon || lk.weapon;
  const phase = moving ? Math.sin(t * 12) : 0;
  const swing = o.pose === 'attack' ? -1.6 * (o.swing ?? 1) : o.pose === 'cast' ? -0.9 : 0;
  // 武器（背面时在身后）
  const handX = dir === 'right' ? 6 : 11 * big, handY = -16 + (moving ? phase * 1.5 : 0);
  if (dir === 'up' && wtype && wtype !== 'none') { ctx.save(); ctx.translate(-11 * big, -16); weapon(ctx, wtype, lk, 0.3); ctx.restore(); }
  hairBack(ctx, lk, dir);
  // 腿
  if (lk.ghostly) {
    ctx.beginPath(); ctx.moveTo(-9, -10); ctx.quadraticCurveTo(-4, 4 + Math.sin(t * 5) * 2, 2, -2); ctx.quadraticCurveTo(6, 2, 9, -10); ctx.closePath();
    ctx.fillStyle = lk.pants; ctx.globalAlpha *= 0.8; ctx.fill(); ctx.globalAlpha /= 0.8;
  } else {
    const legs = dir === 'right' ? [[-3, phase * 3], [1, -phase * 3]] : [[-5.5 * big, phase > 0 ? -2 * phase : 0], [1.5 * big, phase < 0 ? 2 * phase : 0]];
    for (const [lx, off] of legs) {
      const dx = dir === 'right' ? off : 0, dy = dir === 'right' ? 0 : off;
      rrect(ctx, lx + dx, -10 + dy, 4.5 * big, 9, 2); ctx.fillStyle = lk.pants; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1; ctx.stroke();
      rrect(ctx, lx + dx - 0.5, -3 + dy, 5.5 * big, 3.5, 1.5); ctx.fillStyle = lk.shoe; ctx.fill();
    }
  }
  // 手臂（后侧）
  const armSw = moving ? phase * 3 : 0;
  if (dir === 'right') { ell(ctx, -4 - armSw, -16, 3.5, 5, shade(lk.cloth, -0.12)); }
  // 身体
  const hem = fem ? -3 : -7;
  const w1 = 8.5 * big, w2 = (fem ? 12.5 : 11) * big;
  ctx.beginPath();
  ctx.moveTo(-w1, -23); ctx.lineTo(w1, -23); ctx.quadraticCurveTo(w2 + 1, -12, w2, hem); ctx.quadraticCurveTo(0, hem + 3, -w2, hem); ctx.quadraticCurveTo(-w2 - 1, -12, -w1, -23);
  ctx.closePath();
  const grd = ctx.createLinearGradient(-w2, 0, w2, 0);
  grd.addColorStop(0, shade(lk.cloth, 0.08)); grd.addColorStop(1, shade(lk.cloth, -0.1));
  ctx.fillStyle = grd; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.2; ctx.stroke();
  // 衣摆与衣领
  ctx.save(); ctx.clip();
  ctx.fillStyle = lk.cloth2; ctx.fillRect(-w2 - 2, hem - 2.5, w2 * 2 + 4, 4);
  if (dir !== 'up') {
    if (dir === 'right') poly(ctx, [2, -23, 8, -23, 5, -15], lk.cloth2, null);
    else poly(ctx, [-5, -23, 5, -23, 0, -15], lk.cloth2, null);
  }
  ctx.fillStyle = lk.belt; ctx.fillRect(-w2, -14, w2 * 2, 3);
  if (lk.skeleton) { ctx.strokeStyle = '#e8e4d8'; ctx.lineWidth = 1.2; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-6, -21 + i * 3); ctx.lineTo(6, -21 + i * 3); ctx.stroke(); } }
  ctx.restore();
  if (lk.talisman && dir !== 'up') { ctx.fillStyle = '#f0d850'; ctx.fillRect(-3, -44, 6, 14); ctx.strokeStyle = '#c02020'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(0, -42); ctx.lineTo(0, -32); ctx.moveTo(-2, -38); ctx.lineTo(2, -38); ctx.stroke(); }
  // 头
  const hx = dir === 'right' ? 1 : 0;
  ctx.beginPath(); ctx.arc(hx, -34, 13, 0, TAU);
  const hg = ctx.createRadialGradient(hx - 4, -38, 2, hx, -34, 14);
  hg.addColorStop(0, shade(lk.skin, 0.06)); hg.addColorStop(1, shade(lk.skin, -0.06));
  ctx.fillStyle = hg; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.2; ctx.stroke();
  // 脸
  if (dir !== 'up') {
    const ex = dir === 'right' ? [3, 9.5] : [-5, 5];
    if (lk.skeleton) {
      for (const e of ex) ell(ctx, e, -33, 3, 3.4, '#2a1a2a', null);
      ctx.fillStyle = '#2a1a2a'; ctx.fillRect(ex[0] + 2, -27, 5, 1.2);
    } else {
      const blink = (Math.floor(t * 10) % 37) === 36;
      for (const e of ex) {
        if (blink || o.pose === 'hurt') { ctx.strokeStyle = '#2a1a2a'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(e - 2, -32); ctx.lineTo(e + 2, -32); ctx.stroke(); continue; }
        ell(ctx, e, -32, 2.3, 3.1, lk.eye || '#2a1a2a', null);
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(e + 0.8, -33.2, 0.95, 0, TAU); ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,110,120,.35)';
      for (const e of dir === 'right' ? [7] : [-8, 8]) { ctx.beginPath(); ctx.ellipse(e, -27.5, 2.6, 1.6, 0, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = '#8a3a3a'; ctx.lineWidth = 1; ctx.beginPath();
      const mx = dir === 'right' ? 6.5 : 0;
      if (o.pose === 'attack' || o.pose === 'cast') { ctx.arc(mx, -27, 1.6, 0, Math.PI); ctx.fillStyle = '#8a3a3a'; ctx.fill(); }
      else { ctx.arc(mx, -27.8, 1.6, 0.2, Math.PI - 0.2); ctx.stroke(); }
    }
    if (lk.beard) { poly(ctx, [hx - 5, -26, hx + 5, -26, hx, -20], lk.hairStyle === 'oldman' ? '#f4f4f4' : lk.hair, null); }
  }
  if (lk.hairStyle === 'oldman') {
    ctx.fillStyle = '#f0f0f0';
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx * 11, -36, 4, 6, 0, 0, TAU); ctx.fill(); }
    if (dir !== 'up') { poly(ctx, [hx - 6, -26, hx + 6, -26, hx, -16], '#f4f4f4', 'rgba(0,0,0,.2)'); }
  }
  hairFront(ctx, lk, dir);
  // 前侧手臂 + 武器
  if (dir === 'right') {
    ctx.save(); ctx.translate(handX, handY); ctx.rotate(swing * 0.5);
    ell(ctx, 0, 0, 3.6, 5, lk.cloth); ell(ctx, 0.5, 4, 2.4, 2.4, lk.skin);
    if (wtype && wtype !== 'none') { ctx.translate(0.5, 4); weapon(ctx, wtype, lk, swing * 0.6 + 0.2); }
    ctx.restore();
  } else if (dir === 'down') {
    ell(ctx, -11 * big, -16 + armSw, 3.6, 5, lk.cloth); ell(ctx, -11 * big, -12 + armSw, 2.4, 2.4, lk.skin);
    ctx.save(); ctx.translate(11 * big, -16 - armSw); ctx.rotate(swing * 0.4);
    ell(ctx, 0, 0, 3.6, 5, lk.cloth); ell(ctx, 0, 4, 2.4, 2.4, lk.skin);
    if (wtype && wtype !== 'none') { ctx.translate(0, 4); weapon(ctx, wtype, lk, swing * 0.5 + 0.35); }
    ctx.restore();
  } else {
    ell(ctx, -11 * big, -16 + armSw, 3.6, 5, lk.cloth); ell(ctx, 11 * big, -16 - armSw, 3.6, 5, lk.cloth);
  }
}

// ---------------- 怪物 ----------------
// 以脚底为原点，朝右绘制
export function drawMonster(ctx, x, y, lk, o = {}) {
  if (lk.shape === 'human') return drawChibi(ctx, x, y, lk, { ...o, dir: o.flip ? 'left' : 'right' });
  const t = o.t || 0, s = o.scale || 1;
  ctx.save();
  ctx.translate(x, y);
  if (o.pose === 'dead') { ctx.globalAlpha = 0.6; }
  shadow(ctx, 0, 0, 18 * s, 5 * s);
  ctx.scale(o.flip ? -s : s, s);
  if (o.pose === 'dead') { ctx.translate(0, -4); ctx.scale(1, 0.55); }
  if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  const b = Math.sin(t * 4) * 1.2;
  const eyes = (ex, ey, r = 2.6, look = 1) => {
    for (const [dx] of [[0], [r * 2.4]]) { ell(ctx, ex + dx, ey, r, r * 1.2, '#fff', OUT, 1); ell(ctx, ex + dx + look * 0.8, ey + 0.4, r * 0.55, r * 0.75, '#2a1a2a', null); }
  };
  const c1 = lk.c1, c2 = lk.c2;
  switch (lk.shape) {
    case 'caterpillar': {
      for (let i = 3; i >= 0; i--) { const yy = -9 - Math.abs(Math.sin(t * 5 + i)) * 3; ell(ctx, -18 + i * 9, yy, 8, 8, i % 2 ? c1 : shade(c1, -0.08)); ctx.fillStyle = c2; ctx.beginPath(); ctx.arc(-18 + i * 9, yy - 5, 1.6, 0, TAU); ctx.fill(); }
      const hy = -14 - Math.abs(Math.sin(t * 5 + 4)) * 3;
      ell(ctx, 18, hy, 10, 10, c1);
      ctx.strokeStyle = OUT; ctx.lineWidth = 1.2;
      for (const d of [-3, 3]) { ctx.beginPath(); ctx.moveTo(18 + d, hy - 9); ctx.quadraticCurveTo(18 + d * 2, hy - 18, 18 + d * 3, hy - 17); ctx.stroke(); ell(ctx, 18 + d * 3, hy - 17, 2, 2, c2, null); }
      eyes(15, hy - 2, 2.4);
      ctx.fillStyle = 'rgba(255,100,120,.4)'; ctx.beginPath(); ctx.arc(24, hy + 4, 2, 0, TAU); ctx.fill();
      break;
    }
    case 'turtle': {
      for (const lx of [-14, -4, 6, 14]) ell(ctx, lx, -4, 4.5, 5, c2);
      ell(ctx, 22, -14 + b, 8, 7.5, c2); eyes(21, -16 + b, 2.1);
      ctx.beginPath(); ctx.ellipse(0, -12, 22, 15, 0, Math.PI, TAU); ctx.lineTo(22, -8); ctx.lineTo(-22, -8); ctx.closePath();
      ctx.fillStyle = c1; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.3; ctx.stroke();
      ctx.strokeStyle = shade(c1, -0.2); ctx.lineWidth = 1.2;
      for (const [hx, hy] of [[-10, -16], [0, -21], [10, -16], [0, -12]]) { ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = k * TAU / 6; ctx.lineTo(hx + Math.cos(a) * 5, hy + Math.sin(a) * 4); } ctx.closePath(); ctx.stroke(); }
      ctx.fillStyle = shade(c2, -0.05); ctx.fillRect(-22, -10, 44, 3);
      break;
    }
    case 'frog': {
      ell(ctx, -12, -6, 7, 5, shade(c1, -0.1)); ell(ctx, 12, -5, 6, 4, shade(c1, -0.1));
      ell(ctx, 0, -14 + b, 19, 14, c1);
      ell(ctx, 2, -10 + b, 12, 8, c2, null);
      for (const ex of [-8, 8]) { ell(ctx, ex, -27 + b, 6, 6, c1); ell(ctx, ex, -27 + b, 4, 4, '#fff', null); ell(ctx, ex + 1, -27 + b, 2, 2.6, '#2a1a2a', null); }
      ctx.strokeStyle = OUT; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(0, -18 + b, 9, 0.2, Math.PI - 0.2); ctx.stroke();
      break;
    }
    case 'crab': {
      ctx.strokeStyle = shade(c1, -0.2); ctx.lineWidth = 2.5;
      for (const lx of [-14, -8, 8, 14]) { ctx.beginPath(); ctx.moveTo(lx * 0.7, -8); ctx.lineTo(lx * 1.3, 0); ctx.stroke(); }
      const cl = Math.sin(t * 6) * 0.2;
      for (const sx of [-1, 1]) { ctx.save(); ctx.translate(sx * 20, -20); ctx.rotate(sx * cl); ell(ctx, 0, -4, 7, 6, c1); poly(ctx, [sx * 2, -8, sx * 9, -14, sx * 4, -4], c1); ctx.restore(); }
      ell(ctx, 0, -12 + b, 18, 11, c1);
      ell(ctx, 0, -9 + b, 12, 5, shade(c1, 0.12), null);
      for (const ex of [-5, 5]) { ctx.strokeStyle = OUT; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(ex, -20 + b); ctx.lineTo(ex, -27 + b); ctx.stroke(); ell(ctx, ex, -28 + b, 3.2, 3.2, '#fff', OUT, 1); ell(ctx, ex + 0.8, -28 + b, 1.5, 1.9, '#2a1a2a', null); }
      break;
    }
    case 'shrimp': {
      ctx.fillStyle = '#8a4a2a'; ctx.fillRect(12, -44, 2, 44);
      poly(ctx, [10, -44, 16, -44, 13, -52], '#dfe8f4');
      for (let i = 0; i < 5; i++) ell(ctx, -2 + Math.sin(i * 0.6) * 4, -6 - i * 7 + b * 0.5, 9 - i * 0.6, 5, i % 2 ? c1 : shade(c1, -0.08));
      ell(ctx, 4, -40 + b, 9, 8, c1);
      ctx.strokeStyle = c1; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(8, -46); ctx.quadraticCurveTo(22, -60, 30, -48); ctx.stroke();
      eyes(3, -41 + b, 2.2);
      ell(ctx, 12, -26, 3, 3, c2);
      break;
    }
    case 'ghost': {
      const f = Math.sin(t * 3) * 3 - 10;
      ctx.globalAlpha *= 0.85;
      ctx.beginPath(); ctx.moveTo(-14, -26 + f); ctx.arc(0, -30 + f, 14, Math.PI, TAU); ctx.lineTo(14, -8 + f);
      for (let i = 0; i < 4; i++) ctx.quadraticCurveTo(10 - i * 7, -2 + f + Math.sin(t * 6 + i) * 2, 7 - i * 7, -8 + f);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, -44 + f, 0, -4 + f); g.addColorStop(0, c1); g.addColorStop(1, shade(c2, 0.1));
      ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.2; ctx.stroke();
      ell(ctx, 16, -22 + f, 4, 3, c1);
      for (const ex of [-3, 6]) { ell(ctx, ex, -32 + f, 2.4, 3.4, '#2a1a3a', null); }
      ctx.strokeStyle = '#2a1a3a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(2, -24 + f, 2.5, Math.PI + 0.3, TAU - 0.3); ctx.stroke();
      ctx.globalAlpha /= 0.85;
      break;
    }
    case 'tree': {
      ctx.strokeStyle = c2; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (const [a, bb] of [[-8, -12], [8, 12], [0, 4]]) { ctx.beginPath(); ctx.moveTo(a * 0.5, -8); ctx.quadraticCurveTo(a, -2, bb, 0); ctx.stroke(); }
      rrect(ctx, -9, -34, 18, 28, 5); ctx.fillStyle = c2; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.2; ctx.stroke();
      for (const [fx, fy, r] of [[-12, -42, 12], [10, -44, 12], [0, -54, 13], [-4, -44, 10]]) ell(ctx, fx + b * 0.5, fy, r, r * 0.9, fx === -4 ? shade(c1, 0.08) : c1);
      ell(ctx, -3, -24, 2.5, 3, '#2a1a10', null); ell(ctx, 4, -24, 2.5, 3, '#2a1a10', null);
      ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(0.5, -16, 3.5, Math.PI + 0.4, TAU - 0.4); ctx.stroke();
      for (const [ax, dirx] of [[-9, -1], [9, 1]]) { ctx.strokeStyle = c2; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ax, -24); ctx.lineTo(ax + dirx * 8, -30 + b); ctx.stroke(); }
      break;
    }
    case 'flower': {
      ctx.strokeStyle = '#4a9a3a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-4, -14, 0, -26); ctx.stroke();
      for (const sx of [-1, 1]) { ctx.save(); ctx.translate(0, -12); ctx.rotate(sx * (0.9 + Math.sin(t * 4) * 0.2)); ell(ctx, sx * 0, -8, 4, 9, '#6ac04a'); ctx.restore(); }
      for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + t * 0.5; ell(ctx, Math.cos(a) * 11, -36 + Math.sin(a) * 11, 7, 7, c1); }
      ell(ctx, 0, -36, 10, 10, c2);
      eyes(-4, -37, 2);
      ctx.strokeStyle = OUT; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(1, -33, 2.5, 0.2, Math.PI - 0.2); ctx.stroke();
      break;
    }
    case 'spider': {
      ctx.strokeStyle = shade(c1, -0.2); ctx.lineWidth = 2.2;
      for (let i = 0; i < 4; i++) for (const sx of [-1, 1]) {
        const w = Math.sin(t * 8 + i + sx) * 2;
        ctx.beginPath(); ctx.moveTo(sx * 4 + i * 3 - 4, -14); ctx.quadraticCurveTo(sx * 14 + i * 4 - 6, -24 + w, sx * 18 + i * 5 - 8, 0); ctx.stroke();
      }
      ell(ctx, -10, -18 + b, 14, 12, c1);
      ctx.fillStyle = c2; ctx.beginPath(); ctx.moveTo(-10, -26 + b); ctx.lineTo(-6, -18 + b); ctx.lineTo(-10, -10 + b); ctx.lineTo(-14, -18 + b); ctx.closePath(); ctx.fill();
      ell(ctx, 8, -16 + b, 9, 8, shade(c1, 0.1));
      for (const [ex, ey] of [[7, -19], [12, -19], [9, -15], [14, -15]]) ell(ctx, ex, ey + b, 1.6, 1.6, '#ff4a6a', null);
      break;
    }
    case 'quad': quad(ctx, lk, t, b, o); break;
  }
  ctx.restore();
}

function quad(ctx, lk, t, b, o) {
  const k = lk.kind, c1 = lk.c1, c2 = lk.c2;
  const run = o.moving ? Math.sin(t * 12) * 4 : Math.sin(t * 2) * 0.5;
  if (k === 'dragon') {
    ctx.beginPath();
    for (let i = 0; i <= 20; i++) { const xx = -26 + i * 2.4; const yy = -22 + Math.sin(t * 4 + i * 0.5) * 5; i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
    ctx.strokeStyle = OUT; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.stroke();
    ctx.strokeStyle = c1; ctx.lineWidth = 10; ctx.stroke();
    ctx.strokeStyle = c2; ctx.lineWidth = 3; ctx.stroke();
    const hy = -22 + Math.sin(t * 4 + 10) * 5;
    ell(ctx, 24, hy - 4, 10, 8, c1);
    for (const sx of [-1, 1]) poly(ctx, [20 + sx * 3, hy - 10, 18 + sx * 5, hy - 22, 24 + sx * 2, hy - 11], '#f0e0a0');
    ctx.strokeStyle = c2; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(32, hy - 2); ctx.quadraticCurveTo(40, hy, 42, hy - 8); ctx.stroke();
    ell(ctx, 26, hy - 6, 2, 2.4, '#2a1a3a', null);
    return;
  }
  const big = k === 'bear' ? 1.2 : k === 'monkey' ? 0.95 : 1;
  // 尾巴
  ctx.save(); ctx.translate(-18 * big, -18);
  if (k === 'fox') { ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-18, -2 + b, -22, -22, -10, -26); ctx.bezierCurveTo(-10, -14, -4, -8, 2, -6); ctx.closePath(); ctx.fillStyle = c1; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.2; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-11, -23, 4, 0, TAU); ctx.fill(); }
  else if (k === 'monkey') { ctx.strokeStyle = c1; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-14, 4, -16, -18, -6, -16); ctx.stroke(); }
  else if (k === 'tiger') { ctx.strokeStyle = c1; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-12, -4 + b, -10, -16); ctx.stroke(); }
  else { ctx.strokeStyle = shade(c1, -0.1); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-6, 2 + b); ctx.stroke(); }
  ctx.restore();
  // 腿
  for (const [lx, ph] of [[-12, 1], [-6, -1], [8, -1], [14, 1]]) { rrect(ctx, lx * big - 2.5, -12, 5.5 * big, 12, 2.4); ctx.fillStyle = shade(c1, lx % 2 ? -0.12 : 0); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = c2; ctx.fillRect(lx * big - 2.5 + ph * run * 0, -2, 5.5 * big, 2); }
  // 身体
  ell(ctx, 0, -18 + b * 0.5, 21 * big, 12 * big, c1);
  ell(ctx, 2, -13 + b * 0.5, 13 * big, 5 * big, c2, null);
  if (k === 'tiger') { ctx.strokeStyle = '#3a2010'; ctx.lineWidth = 2; for (const sx of [-12, -4, 4]) { ctx.beginPath(); ctx.moveTo(sx, -29); ctx.quadraticCurveTo(sx + 3, -24, sx, -20); ctx.stroke(); } }
  // 头
  const hx = 20 * big, hy = -28 + b;
  if (k === 'fox' || k === 'tiger' || k === 'bear' || k === 'monkey') {
    const ear = k === 'fox' ? [[-7, -8, -3, -20, 1, -9], [2, -9, 7, -20, 9, -6]] : null;
    if (ear) for (const e of ear) poly(ctx, [hx + e[0], hy + e[1], hx + e[2], hy + e[3], hx + e[4], hy + e[5]], c1);
    else for (const sx of [-6, 6]) ell(ctx, hx + sx, hy - 9, 4.5, 4.5, c1);
  }
  if (k === 'boar') { poly(ctx, [hx - 6, hy - 8, hx - 1, hy - 16, hx + 1, hy - 7], c1); }
  ell(ctx, hx, hy, 12 * big, 11 * big, c1);
  if (k === 'monkey') ell(ctx, hx + 2, hy + 2, 8, 7, c2, null);
  // 口鼻
  if (k === 'boar') { ell(ctx, hx + 10, hy + 3, 5, 4.5, shade(c1, 0.15)); ctx.fillStyle = '#3a1a1a'; ctx.fillRect(hx + 9, hy + 2, 1.2, 2); ctx.fillRect(hx + 11.5, hy + 2, 1.2, 2); poly(ctx, [hx + 5, hy + 6, hx + 9, hy + 6, hx + 7, hy - 1], '#fffbe8'); }
  else if (k !== 'monkey') { ell(ctx, hx + 7, hy + 4, 5.5, 4, c2); ctx.fillStyle = '#2a1a1a'; ctx.beginPath(); ctx.arc(hx + 10, hy + 2.5, 1.6, 0, TAU); ctx.fill(); }
  if (k === 'tiger') { ctx.strokeStyle = '#3a2010'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(hx - 3, hy - 10); ctx.lineTo(hx - 1, hy - 6); ctx.moveTo(hx + 2, hy - 10); ctx.lineTo(hx + 2, hy - 6); ctx.stroke(); }
  for (const ex of [hx - 2, hx + 5]) { ell(ctx, ex, hy - 2, 2, 2.6, '#2a1a1a', null); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex + 0.7, hy - 3, 0.8, 0, TAU); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,110,120,.35)'; ctx.beginPath(); ctx.ellipse(hx - 5, hy + 4, 2.5, 1.5, 0, 0, TAU); ctx.fill();
}

// 通用绘制：根据外观类型选择人物或怪物
export function drawActor(ctx, x, y, lk, o = {}) {
  if (!lk.shape || lk.shape === 'human') {
    const dir = o.dir || (o.flip ? 'left' : 'right');
    drawChibi(ctx, x, y, lk, { ...o, dir });
  } else drawMonster(ctx, x, y, lk, o);
}

// 生成头像（离屏画布）
const portraitCache = new Map();
export function portrait(lk, size = 64, key) {
  const k = key || JSON.stringify(lk) + size;
  if (portraitCache.has(k)) return portraitCache.get(k);
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const s = size / 34;
  if (!lk.shape || lk.shape === 'human') drawChibi(ctx, size / 2, size * 1.62, lk, { dir: 'down', scale: s * 1.25 });
  else {
    const wide = ['quad', 'turtle', 'caterpillar', 'crab', 'spider'].includes(lk.shape);
    // 鬼魂类身体悬浮在较高处，头像里往下挪一些免得被裁掉
    drawMonster(ctx, size / 2 - (wide ? 7 : 2) * s * 0.85, size * (wide ? 0.88 : lk.shape === 'ghost' ? 1.12 : 0.95), lk, { scale: s * (wide ? 0.62 : 0.8) });
  }
  portraitCache.set(k, c);
  return c;
}
