// 装备开箱：鉴定、宝箱、打造、洗练、一键出售，以及开出装备时的揭晓动画
import { ITEMS, SKILLS, EQ_FX, RARITY, SLOTS, STAT_NAMES, MAX_TIER, ROLES, WEAPON_TYPE_NAMES, tierForLevel } from './data.js';
import { G, save, stats, addEquip, addItem, makeEquip, rollRarity, rollSpecial, removeItem, countItem, bagFree, equipFromBag, canEquip } from './state.js';
import { eqStats } from './stats.js';
import { eqName, eqGlow, eqTags } from './growth.js';
import { panel, toast, log, UI, confirmBox } from './ui.js';
import * as P from './panels.js';
import { esc, fmt, pick } from './util.js';
import { Audio2 } from './audio.js';

const S_ = () => G.S;
const slotName = s => SLOTS.find(x => x[0] === s)[1];
const statLines = e => Object.entries(eqStats(e)).map(([k, v]) => `${STAT_NAMES[k]} +${v}`);

// 揭晓后记账：成就、日志、横幅
function track(eqs) {
  const S = S_();
  S.stat.opened = (S.stat.opened || 0) + eqs.length;
  for (const e of eqs) {
    if (e.rarity >= 5) S.stat.shenqi = (S.stat.shenqi || 0) + 1;
    if (e.rarity >= 4) log(`【开箱】${RARITY[e.rarity].name}现世！<b style="color:${RARITY[e.rarity].color}">${esc(e.name)}</b>${e.tj || e.fx?.length ? '（' + esc(eqTags(e)) + '）' : ''}`, RARITY[e.rarity].color);
  }
}

// ---------------- 揭晓动画 ----------------
// 单件：宝箱抖动、光芒变色，然后翻出装备卡片，属性、特技、特效逐行亮起；多件：卡片依次翻开
export function reveal(eqs, opts = {}) {
  if (!eqs.length) return Promise.resolve();
  track(eqs);
  save();
  return new Promise(res => {
    const best = Math.max(...eqs.map(e => e.rarity));
    const ov = document.createElement('div');
    ov.className = 'reveal';
    ov.innerHTML = `<div class="rv-stage"><div class="rv-rays"></div><div class="rv-box">${opts.icon || '🎁'}</div></div><div class="rv-title">${esc(opts.title || '开启中……')}</div>`;
    document.getElementById('ui').append(ov);
    Audio2.sfx('magic');
    const stage = ov.querySelector('.rv-stage');
    // 蓄力：先白光，再透出最高品质的颜色（史诗以上才「变色」）
    setTimeout(() => stage.classList.add('charge', 'r' + best), 550);
    setTimeout(() => {
      ov.classList.add('open', 'best' + best);
      Audio2.sfx(best >= 4 ? 'levelup' : best >= 3 ? 'quest' : 'coin');
      ov.innerHTML = (best >= 4 ? `<div class="rv-head r${best}">${best >= 5 ? '神器现世' : '传说降临'}</div>` : '') + (eqs.length === 1 ? cardBig(eqs[0]) : `<div class="rv-grid">${eqs.map((e, i) => cardSmall(e, i)).join('')}</div>`) +
        `<div class="row-btns center rv-btns">${eqs.length === 1 && !canEquip(eqs[0]) && S_().inv.some(x => x.eq === eqs[0]) ? '<button class="btn primary" data-a="eq">立即装备</button>' : ''}<button class="btn ${eqs.length === 1 && canEquip(eqs[0]) ? 'primary' : ''}" data-a="ok">收下</button></div>`;
      ov.querySelector('[data-a="eq"]')?.addEventListener('click', () => {
        const i = S_().inv.findIndex(x => x.eq === eqs[0]);
        const r = i >= 0 ? equipFromBag(i) : '找不到装备';
        if (r) toast(r); else { Audio2.sfx('click'); toast(`已装备 ${esc(eqs[0].name)}`); P.refreshHud(); save(); }
        close();
      });
      ov.querySelector('[data-a="ok"]').onclick = close;
    }, 1250);
    function close() { ov.remove(); opts.onClose?.(); res(); }
  });
}
function specialLines(e) {
  const out = [];
  if (e.tj) out.push(`<div class="rv-l tj">✦ 特技「${SKILLS[e.tj].name}」<small>${SKILLS[e.tj].desc.replace('特技：', '')}（每场${SKILLS[e.tj].uses}次）</small></div>`);
  for (const f of e.fx || []) out.push(`<div class="rv-l fx">◆ 特效「${EQ_FX[f].name}」<small>${EQ_FX[f].desc}</small></div>`);
  return out;
}
function cardBig(e) {
  const lines = [...statLines(e).map(t => `<div class="rv-l">${t}</div>`), ...specialLines(e)];
  return `<div class="rv-card r${e.rarity}"><div class="rv-rar">${RARITY[e.rarity].name}</div>
    <div class="it-name ${eqGlow(e)}" style="color:${RARITY[e.rarity].color}">${esc(eqName(e))}</div>
    <div class="muted">${slotName(e.slot)}${e.wtype ? '（' + WEAPON_TYPE_NAMES[e.wtype] + '）' : ''} · ${e.req ? `需要等级 ${e.req}` : '<b class="up">无级别限制</b>'}</div>
    <div class="rv-lines">${lines.map((l, i) => l.replace('class="rv-l', `style="animation-delay:${0.25 + i * 0.22}s" class="rv-l`)).join('')}</div></div>`;
}
function cardSmall(e, i) {
  return `<div class="rv-mini r${e.rarity}" style="animation-delay:${i * 0.12}s" title="${esc(statLines(e).join(' ') + (eqTags(e) ? ' · ' + eqTags(e) : ''))}"><div class="rv-rar">${RARITY[e.rarity].name}</div><b style="color:${RARITY[e.rarity].color}">${esc(e.name)}</b><small>${slotName(e.slot)} · ${e.req}级</small>${e.tj ? `<i class="tj">✦${SKILLS[e.tj].name}</i>` : ''}${(e.fx || []).map(f => `<i>${EQ_FX[f].name}</i>`).join('')}</div>`;
}

// ---------------- 鉴定 ----------------
export const unidList = () => S_().inv.filter(x => x.eq?.unid).map(x => x.eq);
export function identify(eqs, onClose) {
  if (!eqs.length) { toast('没有需要鉴定的装备'); return; }
  for (const e of eqs) delete e.unid;
  stats();
  return reveal(eqs, { title: eqs.length > 1 ? `鉴定 ${eqs.length} 件装备……` : '鉴定中……', icon: '🔍', onClose });
}

// ---------------- 宝箱 ----------------
export function boxEquip(id, L = S_().level) {
  const it = ITEMS[id];
  return makeEquip(pick(SLOTS.map(s => s[0])), Math.min(MAX_TIER, tierForLevel(L)), ROLES[S_().role].weapon, rollRarity(it.bias || 0, it.minR || 0));
}
export function openBox(id, onClose) {
  const S = S_();
  if (countItem(id) < 1) return;
  const n = countItem(id) > 1 ? 0 : 1;          // 最后一个宝箱打开后会空出一格
  if (bagFree() + n < 1) { toast('背包已满，先整理一下吧'); return; }
  removeItem(id, 1);
  const eq = boxEquip(id);
  addEquip(eq);
  if (id === 'baoxiang') { const g = S.level * 40 + 200; S.gold += g; toast(`宝箱里还有 ${fmt(g)} 两银子`); }
  P.refreshHud();
  return reveal([eq], { title: `开启${ITEMS[id].name}……`, icon: ITEMS[id].icon, onClose });
}

// ---------------- 打造 ----------------
export const craftCost = t => (t + 1) ** 2 * 400 + 200;
const CRAFT_BIAS = 0.2;
const craftTiers = () => { const top = Math.min(MAX_TIER, tierForLevel(S_().level) + 1); return Array.from({ length: top + 1 }, (_, i) => i).slice(Math.max(0, top - 7)); };
let craftSel = { slot: 'weapon', tier: null };
export function craftPanel() {
  const S = S_();
  const tiers = craftTiers();
  if (craftSel.tier === null || !tiers.includes(craftSel.tier)) craftSel.tier = Math.min(tierForLevel(S.level), tiers[tiers.length - 1]);
  const t = craftSel.tier, cost = craftCost(t);
  const k = 1 + CRAFT_BIAS * 2.4, w = [46, 28, 15, 7.5, 2.8, 0.7].map((x, i) => x * k ** i), sum = w.reduce((a, b) => a + b, 0);
  const sample = makeEquip(craftSel.slot, t, ROLES[S.role].weapon, 0);
  const b = panel('装备打造', '', { id: 'craft', width: 640 });
  b.innerHTML = `<div class="craft">
    <div class="sub">部位</div><div class="row-btns">${SLOTS.map(([k2, n]) => `<button class="btn small ${k2 === craftSel.slot ? 'primary' : ''}" data-s="${k2}">${n}</button>`).join('')}</div>
    <div class="sub">等级</div><div class="row-btns">${tiers.map(x => `<button class="btn small ${x === t ? 'primary' : ''}" data-t="${x}">${x * 10}级</button>`).join('')}</div>
    <div class="cf-info"><b>${esc(sample.name)}</b>　<span class="muted">基础 ${statLines(sample).join(' ')}</span></div>
    <div class="cf-odds">${RARITY.map((r, i) => `<span style="color:${r.color}">${r.name} ${(w[i] / sum * 100).toFixed(i >= 4 ? 1 : 0)}%</span>`).join('')}</div>
    <div class="muted">品质越高，基础属性越高、附加属性越多。史诗以上必带特效，传说、神器大概率附带特技。</div>
    <div class="row-btns center"><button class="btn big primary" id="cr1">打造一次<small>${fmt(cost)} 两</small></button><button class="btn big" id="cr10">打造十次<small>${fmt(cost * 9)} 两 · 必出史诗以上</small></button></div>
    <div class="muted center">银两：<b>${fmt(S.gold)}</b>　背包空位：${bagFree()}</div></div>`;
  b.querySelectorAll('[data-s]').forEach(x => x.onclick = () => { craftSel.slot = x.dataset.s; craftPanel(); });
  b.querySelectorAll('[data-t]').forEach(x => x.onclick = () => { craftSel.tier = +x.dataset.t; craftPanel(); });
  b.querySelector('#cr1').onclick = () => craft(1);
  b.querySelector('#cr10').onclick = () => craft(10);
}
function craft(times) {
  const S = S_(), t = craftSel.tier, cost = craftCost(t) * (times > 1 ? 9 : 1);
  if (bagFree() < times) { toast(`背包空位不足（需要 ${times} 格）`); return; }
  if (S.gold < cost) { toast('银两不足'); return; }
  S.gold -= cost;
  const out = [];
  for (let i = 0; i < times; i++) out.push(makeEquip(craftSel.slot, t, ROLES[S.role].weapon, rollRarity(CRAFT_BIAS)));
  if (times > 1 && !out.some(e => e.rarity >= 3)) out[times - 1] = makeEquip(craftSel.slot, t, ROLES[S.role].weapon, rollRarity(CRAFT_BIAS, 3));
  out.forEach(e => addEquip(e));
  P.refreshHud();
  reveal(out, { title: '叮叮当当，打造中……', icon: '⚒️', onClose: () => { if (UI.panelOpen === 'craft') craftPanel(); } });
}

// ---------------- 洗练 ----------------
export const xilianCost = e => ({ yu: 1, gold: (e.tier + 1) * 800 });
export async function xilian(e, onDone) {
  const S = S_();
  if (!e.rarity) { toast('普通装备没有附加属性，无法洗练'); return; }
  const c = xilianCost(e);
  if (countItem('lingxi') < c.yu) { toast('灵犀玉不足，可在藏宝阁购买，奇遇和活动中也能获得'); return; }
  if (S.gold < c.gold) { toast('银两不足'); return; }
  removeItem('lingxi', c.yu); S.gold -= c.gold;
  const nu = rollSpecial(JSON.parse(JSON.stringify(e)));
  Audio2.sfx('magic');
  const col = (x, t) => `<div class="xl-col"><div class="muted">${t}</div>${statLines(x).map(l => `<div>${l}</div>`).join('')}${specialLines(x).join('')}<div class="muted">${x.req ? `需要等级 ${x.req}` : '无级别限制'}</div></div>`;
  const ov = document.createElement('div');
  ov.className = 'reveal open';
  ov.innerHTML = `<div class="rv-card r${e.rarity} xl"><div class="it-name ${eqGlow(e)}" style="color:${RARITY[e.rarity].color}">${esc(eqName(e))} · 洗练</div><div class="xl-cmp">${col(e, '原属性')}<div class="arrow">➜</div>${col(nu, '新属性')}</div></div>
    <div class="row-btns center rv-btns"><button class="btn" data-k="old">保留原属性</button><button class="btn primary" data-k="new">使用新属性</button></div>`;
  document.getElementById('ui').append(ov);
  const keep = await new Promise(r => ov.querySelectorAll('[data-k]').forEach(x => x.onclick = () => r(x.dataset.k)));
  ov.remove();
  if (keep === 'new') {
    for (const k of ['stats', 'fx', 'tj', 'req', 'price']) e[k] = nu[k];
    Audio2.sfx('levelup'); toast('洗练成功，已使用新属性');
    if (e.fx.length >= 3 || (e.tj && e.fx.length >= 2)) log(`【洗练】${esc(e.name)} 洗出了 ${esc(eqTags(e))}！`, '#ffd040');
  }
  stats(); P.refreshHud(); save();
  onDone?.();
}

// ---------------- 一键出售 ----------------
export async function sellJunk(maxR = 2, onDone) {
  const S = S_();
  const list = S.inv.filter(x => x.eq && !x.eq.unid && x.eq.rarity <= maxR);
  if (!list.length) { toast(`背包里没有${RARITY[maxR].name}及以下的装备`); return; }
  const gold = list.reduce((s, x) => s + Math.floor(x.eq.price * 0.3), 0);
  if (!await confirmBox(`出售背包中 <b>${list.length}</b> 件${RARITY[maxR].name}及以下品质的装备，获得 <b>${fmt(gold)}</b> 两？`, '出售', '取消')) return;
  S.inv = S.inv.filter(x => !list.includes(x));
  S.gold += gold;
  Audio2.sfx('coin'); toast(`出售 ${list.length} 件装备，获得 ${fmt(gold)} 两`);
  P.refreshHud(); save();
  onDone?.();
}
