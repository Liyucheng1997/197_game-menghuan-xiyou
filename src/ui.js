// 界面工具：对话框、面板、提示、日志
import { esc } from './util.js';
import { portrait } from './art.js';
import { Audio2 } from './audio.js';

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export function el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }

export const UI = { dialogOpen: false, panelOpen: null };

export function log(msg, color = '#fff6d8') {
  const box = $('#hud-log');
  if (!box) return;
  const d = document.createElement('div');
  d.innerHTML = `<span style="color:${color}">${msg}</span>`;
  box.append(d);
  while (box.children.length > 40) box.firstChild.remove();
  box.scrollTop = box.scrollHeight;
}

let toastTimer = null;
export function toast(msg, ms = 1800) {
  const t = $('#toast');
  t.innerHTML = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}

export function banner(msg, sub = '') {
  const b = $('#banner');
  b.innerHTML = `<div class="b-main">${msg}</div>${sub ? `<div class="b-sub">${sub}</div>` : ''}`;
  b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
}

// NPC 对话：pages 为多段文字，options 为最后一页的选项
export function dialog({ look, name, title, pages, options }) {
  return new Promise(resolve => {
    const box = $('#dialog');
    let i = 0;
    const list = Array.isArray(pages) ? pages : [pages];
    UI.dialogOpen = true;
    const render = () => {
      const last = i >= list.length - 1;
      const opts = last ? (options && options.length ? options : [{ label: '好的', value: null }]) : [{ label: '继续 ▸', next: true }];
      box.innerHTML = '';
      const face = look ? portrait(look, 96) : null;
      const inner = el(`<div class="dlg-inner"><div class="dlg-face"></div><div class="dlg-body"><div class="dlg-name">${esc(name || '')}${title ? `<small>${esc(title)}</small>` : ''}</div><div class="dlg-text">${list[i] || ''}</div><div class="dlg-opts"></div></div></div>`);
      if (face) { const c = document.createElement('canvas'); c.width = c.height = 96; c.getContext('2d').drawImage(face, 0, 0); inner.querySelector('.dlg-face').append(c); }
      const wrap = inner.querySelector('.dlg-opts');
      opts.forEach((o, k) => {
        const b = el(`<button class="opt ${o.cls || ''}">${o.label}</button>`);
        if (o.disabled) b.disabled = true;
        b.onclick = (e) => {
          e.stopPropagation();
          Audio2.sfx('click');
          if (o.next) { i++; render(); return; }
          close();
          resolve(o.value !== undefined ? o.value : k);
          if (o.fn) o.fn();
        };
        wrap.append(b);
      });
      box.append(inner);
      box.classList.remove('hidden');
    };
    const close = () => { box.classList.add('hidden'); box.innerHTML = ''; UI.dialogOpen = false; };
    box.onclick = (e) => { if (e.target === box) { /* 点击空白不关闭 */ } };
    render();
    UI.closeDialog = () => { close(); resolve(null); };
  });
}

// 记录面板内各滚动区域的位置（按 DOM 下标路径定位），重绘后原样恢复
function scrollSnapshot(root) {
  const out = [];
  const walk = (node, path) => {
    [...node.children].forEach((c, i) => {
      const p = [...path, i];
      if (c.scrollTop > 0) out.push([p, c.scrollTop]);
      if (c.children.length) walk(c, p);
    });
  };
  if (root.scrollTop > 0) out.push([[], root.scrollTop]);
  walk(root, []);
  return out;
}
function scrollRestore(root, snap) {
  for (const [path, top] of snap) {
    let n = root;
    for (const i of path) { n = n?.children[i]; if (!n) break; }
    if (n) n.scrollTop = top;
  }
}

export function panel(title, content, opts = {}) {
  const p = $('#panel');
  const id = opts.id || title;
  // 同一面板重绘（加点、学技能、买东西等）时复用窗口：不重播弹出动画、不重置滚动位置，避免整页闪一下
  const old = p.querySelector('.win');
  if (old && UI.panelOpen === id && !p.classList.contains('hidden')) {
    const body = old.querySelector('.win-body');
    const snap = scrollSnapshot(body);
    old.querySelector('.win-title span').innerHTML = title;
    old.style.width = (opts.width || 560) + 'px';
    body.innerHTML = '';
    if (typeof content === 'string') body.innerHTML = content; else if (content) body.append(content);
    UI.panelClose = opts.onClose;
    // 调用方会在拿到 body 后同步填充内容，等它填完再恢复滚动（微任务在绘制前执行，不会闪）
    queueMicrotask(() => scrollRestore(body, snap));
    return body;
  }
  p.innerHTML = '';
  const win = el(`<div class="win" style="width:${opts.width || 560}px"><div class="win-title"><span>${title}</span><button class="win-x">✕</button></div><div class="win-body"></div></div>`);
  const body = win.querySelector('.win-body');
  if (typeof content === 'string') body.innerHTML = content; else if (content) body.append(content);
  win.querySelector('.win-x').onclick = () => closePanel();
  p.append(win);
  p.classList.remove('hidden');
  UI.panelOpen = opts.id || title;
  UI.panelClose = opts.onClose;
  Audio2.sfx('open');
  return body;
}
export function closePanel() {
  const p = $('#panel');
  if (p.classList.contains('hidden')) return;
  p.classList.add('hidden'); p.innerHTML = '';
  const cb = UI.panelClose; UI.panelOpen = null; UI.panelClose = null;
  if (cb) cb();
}

export function confirmBox(text, yes = '确定', no = '取消') {
  return new Promise(res => {
    const c = $('#confirm');
    c.innerHTML = '';
    const box = el(`<div class="win confirm"><div class="win-body"><p>${text}</p><div class="row-btns"><button class="btn primary">${yes}</button><button class="btn">${no}</button></div></div></div>`);
    const [b1, b2] = box.querySelectorAll('button');
    b1.onclick = () => { c.classList.add('hidden'); res(true); };
    b2.onclick = () => { c.classList.add('hidden'); res(false); };
    c.append(box); c.classList.remove('hidden');
  });
}

export function promptBox(text, def = '') {
  return new Promise(res => {
    const c = $('#confirm');
    c.innerHTML = '';
    const box = el(`<div class="win confirm"><div class="win-body"><p>${text}</p><input class="inp" maxlength="8" value="${esc(def)}"><div class="row-btns"><button class="btn primary">确定</button><button class="btn">取消</button></div></div></div>`);
    const inp = box.querySelector('input');
    const [b1, b2] = box.querySelectorAll('button');
    b1.onclick = () => { c.classList.add('hidden'); res(inp.value.trim()); };
    b2.onclick = () => { c.classList.add('hidden'); res(null); };
    c.append(box); c.classList.remove('hidden');
    inp.focus(); inp.select();
  });
}

export function bar(cur, max, cls) {
  const pct = max > 0 ? Math.max(0, Math.min(100, cur / max * 100)) : 0;
  return `<div class="bar ${cls}"><i style="width:${pct}%"></i><span>${Math.floor(cur)}/${Math.floor(max)}</span></div>`;
}
export function canvasOf(img, size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  c.getContext('2d').drawImage(img, 0, 0, size, size);
  return c;
}
