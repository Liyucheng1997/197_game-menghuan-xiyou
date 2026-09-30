// 养成：装备强化、修炼、伙伴升星
import { SLOTS, STAT_NAMES, RARITY, PARTNERS } from './data.js';
import { G, save, stats, countItem, removeItem } from './state.js';
import { eqStats, CULT, cultCap } from './stats.js';
import { panel, toast, log, banner, UI } from './ui.js';
import * as P from './panels.js';
import { fmt, esc } from './util.js';
import { Audio2 } from './audio.js';

// ---------------- 装备强化 ----------------
export const MAX_PLUS = 15;
const RATE = [1, 1, 1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.42, 0.35, 0.3, 0.25, 0.2, 0.15, 0.1];
export const forgeCost = e => ({ stones: 1 + Math.floor((e.plus || 0) / 2), gold: (e.tier + 1) * 600 * ((e.plus || 0) + 1) });
export const eqName = e => e.name + (e.plus ? ` +${e.plus}` : '');
export const eqGlow = e => ((e.plus || 0) >= 12 ? 'glow3' : (e.plus || 0) >= 9 ? 'glow2' : (e.plus || 0) >= 6 ? 'glow1' : '');
export const eqStatText = e => Object.entries(eqStats(e)).map(([s, v]) => STAT_NAMES[s] + '+' + v).join(' ');

function allEquips() {
  const S = G.S, out = [];
  for (const [k, n] of SLOTS) if (S.equip[k]) out.push({ key: 'e' + k, e: S.equip[k], where: '已装备·' + n });
  S.inv.forEach(x => { if (x.eq) out.push({ key: 'b' + x.eq.uid, e: x.eq, where: '背包' }); });
  return out;
}
let forgeSel = null, protect = true;
export function forgePanel(sel) {
  const S = G.S;
  if (sel !== undefined) forgeSel = sel;
  const list = allEquips();
  const cur = list.find(x => x.key === forgeSel) || list[0];
  if (cur) forgeSel = cur.key;
  const b = panel('装备强化', '', { id: 'forge', width: 700 });
  if (!cur) { b.innerHTML = '<div class="empty-tip">没有可以强化的装备。</div>'; return; }
  const e = cur.e, plus = e.plus || 0;
  const c = forgeCost(e), rate = RATE[plus];
  const risky = plus >= 6;
  const next = { ...e, plus: plus + 1 };
  b.innerHTML = `<div class="forge"><div class="flist">${list.map(x => `<div class="fitem ${x.key === forgeSel ? 'sel' : ''}" data-k="${x.key}"><b class="${eqGlow(x.e)}" style="color:${RARITY[x.e.rarity].color}">${esc(eqName(x.e))}</b><small>${x.where} · ${x.e.req}级</small></div>`).join('')}</div>
    <div class="fdetail"><div class="it-name ${eqGlow(e)}" style="color:${RARITY[e.rarity].color}">${esc(eqName(e))}</div>
      <div class="muted">${RARITY[e.rarity].name} · 强化等级 ${plus}/${MAX_PLUS} · 每级全属性 +7%</div>
      <div class="fcmp"><div><div class="muted">当前</div>${Object.entries(eqStats(e)).map(([s, v]) => `<div>${STAT_NAMES[s]} <b>+${v}</b></div>`).join('')}</div>
      ${plus < MAX_PLUS ? `<div class="arrow">➜</div><div><div class="muted">+${plus + 1}</div>${Object.entries(eqStats(next)).map(([s, v]) => `<div>${STAT_NAMES[s]} <b class="up">+${v}</b></div>`).join('')}</div>` : ''}</div>
      ${plus < MAX_PLUS ? `<div class="fcost">成功率 <b class="${rate < 0.5 ? 'warn' : ''}">${Math.round(rate * 100)}%</b>　消耗 💎强化石 <b>${c.stones}</b>（有 ${countItem('qianghua')}）　银两 <b>${fmt(c.gold)}</b></div>
      ${risky ? `<div class="muted">+7 以上强化失败会<b>掉一级</b>。<label class="chk inline"><input type="checkbox" id="f-pro" ${protect ? 'checked' : ''}> 使用强化保护符（有 ${countItem('baohu')}）</label></div>` : '<div class="muted">+6 以内失败不会掉级。</div>'}
      <div class="row-btns"><button class="btn big primary" id="f-go">强化</button></div>` : '<div class="fmax">已强化到满级！</div>'}
      <div class="muted">强化石可在藏宝阁购买，也能从镇妖塔、秘境、祈愿、签到中获得。</div></div></div>`;
  b.querySelectorAll('.fitem').forEach(x => x.onclick = () => forgePanel(x.dataset.k));
  b.querySelector('#f-pro')?.addEventListener('change', ev => { protect = ev.target.checked; });
  b.querySelector('#f-go')?.addEventListener('click', () => doForge(e));
}
function doForge(e) {
  const S = G.S, plus = e.plus || 0;
  if (plus >= MAX_PLUS) return;
  const c = forgeCost(e);
  if (countItem('qianghua') < c.stones) { toast('强化石不足，可在藏宝阁购买'); return; }
  if (S.gold < c.gold) { toast('银两不足'); return; }
  const useP = plus >= 6 && protect && countItem('baohu') > 0;
  removeItem('qianghua', c.stones); S.gold -= c.gold; S.stat.forge++;
  const fx = document.querySelector('#panel .fdetail');
  if (Math.random() < RATE[plus]) {
    e.plus = plus + 1;
    Audio2.sfx(e.plus >= 7 ? 'levelup' : 'quest');
    if (e.plus >= 9) banner(`强化成功 +${e.plus}`, eqName(e));
    toast(`<b style="color:#6fe07a">强化成功！</b> ${esc(eqName(e))}`);
    if (e.plus >= 7) log(`【强化】${esc(eqName(e))} 强化成功！`, '#ffd040');
    fx?.classList.add('ok');
  } else {
    let t = '强化失败';
    if (plus >= 6) { if (useP) { removeItem('baohu', 1); t += '，保护符生效，装备没有掉级'; } else { e.plus = plus - 1; t += `，装备掉到 +${e.plus}`; } }
    Audio2.sfx('lose');
    toast(`<b style="color:#ff6a4a">${t}</b>`);
    fx?.classList.add('fail');
  }
  stats();
  setTimeout(() => { if (UI.panelOpen === 'forge') forgePanel(); }, 380);
  P.refreshHud(); save();
}

// ---------------- 修炼 ----------------
export const cultCost = lv => 2000 + 800 * lv * lv;
export function cultHtml() {
  const S = G.S, cap = cultCap(S.level);
  return `<div class="cults">${CULT.map(([k, n, d]) => { const lv = S.cult[k] || 0; return `<div class="skl"><div class="skl-n"><b>${n}</b> <span class="lv">${lv}/${cap}</span><small>${d}</small></div>
    <div class="row-btns"><button class="btn primary small" data-c="${k}" data-n="1" ${lv >= cap || S.gold < cultCost(lv) ? 'disabled' : ''}>修炼 (${fmt(cultCost(lv))}两)</button><button class="btn small" data-c="${k}" data-n="5" ${lv >= cap ? 'disabled' : ''}>连修5级</button></div></div>`; }).join('')}
    <div class="muted">修炼等级上限为人物等级÷6（最高25）。单机特别版：修炼效果对人物、伙伴、召唤兽全队生效。</div></div>`;
}
export function bindCult(b, refresh) {
  b.querySelectorAll('[data-c]').forEach(x => x.onclick = () => {
    const S = G.S, k = x.dataset.c, cap = cultCap(S.level);
    let n = +x.dataset.n, done = 0;
    while (n-- > 0 && (S.cult[k] || 0) < cap && S.gold >= cultCost(S.cult[k] || 0)) { S.gold -= cultCost(S.cult[k] || 0); S.cult[k] = (S.cult[k] || 0) + 1; done++; }
    if (done) { Audio2.sfx('levelup'); toast(`${CULT.find(c => c[0] === k)[1]} 提升到 ${S.cult[k]} 级`); } else toast('银两不足');
    stats(); refresh(); P.refreshHud(); save();
  });
}

// ---------------- 伙伴升星 ----------------
export const STAR_MAX = 5;
export const starCost = star => ({ items: (star + 1) * 2, gold: 20000 * (star + 1) });
export function starUp(pid) {
  const S = G.S, star = S.pstar[pid] || 0;
  if (star >= STAR_MAX) return;
  const c = starCost(star);
  if (countItem('xinwu') < c.items) { toast(`伙伴信物不足（需要${c.items}个），可在藏宝阁获得`); return; }
  if (S.gold < c.gold) { toast('银两不足'); return; }
  removeItem('xinwu', c.items); S.gold -= c.gold;
  S.pstar[pid] = star + 1;
  Audio2.sfx('levelup');
  banner('伙伴升星', `${PARTNERS[pid].name} ${'★'.repeat(star + 1)}`);
  save();
}
