// 通用工具：随机数、数学、补间动画、HTML 转义
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const rand = (a, b) => a + Math.random() * (b - a);
export const randi = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
export const pick = (arr, r = Math.random) => arr[Math.floor(r() * arr.length)];
export const chance = p => Math.random() < p;
export const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);

export function seeded(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function weighted(list, r = Math.random) {
  const total = list.reduce((s, e) => s + e[1], 0);
  let x = r() * total;
  for (const e of list) { x -= e[1]; if (x <= 0) return e[0]; }
  return list[list.length - 1][0];
}

export const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export const fmt = n => (n >= 10000 ? (n / 10000).toFixed(n >= 100000 ? 0 : 1) + '万' : String(Math.floor(n)));

// ---------- 补间与计时（由主循环驱动） ----------
const tweens = [];
export const ease = {
  linear: t => t,
  inOut: t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  out: t => 1 - (1 - t) * (1 - t),
  in: t => t * t,
  back: t => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
};
export function tween(obj, props, dur, fn = ease.inOut) {
  return new Promise(res => {
    const from = {};
    for (const k in props) from[k] = obj[k];
    tweens.push({ obj, from, to: props, dur: Math.max(1, dur), t: 0, fn, res });
  });
}
export function wait(ms) { return tween({ v: 0 }, { v: 1 }, ms, ease.linear); }
export function updateTweens(dt) {
  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    tw.t += dt;
    const k = tw.fn(Math.min(1, tw.t / tw.dur));
    for (const p in tw.to) tw.obj[p] = tw.from[p] + (tw.to[p] - tw.from[p]) * k;
    if (tw.t >= tw.dur) { tweens.splice(i, 1); tw.res(); }
  }
}
export function clearTweens() { while (tweens.length) tweens.pop().res(); }
