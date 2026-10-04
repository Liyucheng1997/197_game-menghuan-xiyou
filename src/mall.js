// 藏宝阁：仙玉、祈愿（抽卡）、仙玉商城、神兽兑换、充值、签到、等级礼包、成就、VIP
import { ITEMS, MONSTERS, PARTNERS, SHENSHOU, MAX_LEVEL, TOWER_MAX } from './data.js';
import { G, save, addItem, makePet, addPet, bagFree } from './state.js';
import { portrait } from './art.js';
import { panel, toast, log, banner, confirmBox, UI, $ } from './ui.js';
import * as P from './panels.js';
import * as Game from './game.js';
import { daily, addHighMap } from './activity.js';
import { pick, fmt, esc, weighted } from './util.js';
import { Audio2 } from './audio.js';

const S_ = () => G.S;

// ---------------- VIP ----------------
export const VIP_STEPS = [0, 100, 600, 2000, 5000, 12000, 30000, 80000];
const VIP_EXP = [0, 0.05, 0.08, 0.1, 0.12, 0.15, 0.18, 0.2];
const VIP_GOLD = [0, 0, 0, 0.1, 0.1, 0.15, 0.2, 0.25];
export const VIP_DESC = ['', '经验 +5%', '经验 +8%，解锁战斗二倍速', '经验 +10%，银两 +10%，每日免费祈愿一次', '经验 +12%，秘境与论剑次数增加，客栈免费', '经验 +15%，名字变为金色', '经验 +18%，银两 +20%，每日签到奖励翻倍', '经验 +20%，银两 +25%，每日额外领取 100 仙玉'];
export function vipLevel() {
  const s = S_()?.mall?.spent || 0;
  let v = 0;
  VIP_STEPS.forEach((t, i) => { if (s >= t) v = i; });
  return v;
}
export function vipPerk(k) { const v = vipLevel(); return k === 'exp' ? VIP_EXP[v] : k === 'gold' ? VIP_GOLD[v] : 0; }
export function addJade(n) { S_().jade += n; }
function spend(n) {
  const S = S_();
  if (S.jade < n) { toast('仙玉不足，可以去「充值」领取'); return false; }
  const before = vipLevel();
  S.jade -= n; S.mall.spent += n;
  const after = vipLevel();
  if (after > before) setTimeout(() => { Audio2.sfx('levelup'); banner(`VIP ${after}`, VIP_DESC[after]); log(`【VIP】恭喜升到 VIP${after}：${VIP_DESC[after]}`, '#ffd040'); }, 300);
  return true;
}

// ---------------- 祈愿 ----------------
// [稀有度, 权重, 奖励, 数量]；金 2%、紫 13%、蓝 85%，60 抽必出金，十连必出紫
const POOL = [
  [3, 0.5, 'shenshou'], [3, 0.8, 'gj_shoujue', 1], [3, 0.7, 'jade', 888],
  [3, 0.6, 'tiangong', 1],
  [2, 3, 'shenshou_sp', 10], [2, 3, 'shenbing', 1], [2, 2, 'baohu', 2], [2, 2, 'jinke2', 1], [2, 2, 'xinwu', 3], [2, 2, 'shuangbei', 2], [2, 2, 'gj_baotu', 1],
  [1, 10, 'baoxiang', 2], [1, 6, 'lingxi', 2], [1, 18, 'qianghua', 3], [1, 12, 'shoujue', 1], [1, 14, 'shenshou_sp', 2], [1, 10, 'jinke', 1], [1, 9, 'xiulian', 2], [1, 8, 'jingyan', 1], [1, 8, 'xinwu', 1], [1, 6, 'wanyao', 2],
];
export const PITY = 60;
function rollOne(minR = 1) {
  const S = S_();
  S.mall.pity++; S.stat.pulls++;
  let pool = POOL.filter(e => e[0] >= minR);
  if (S.mall.pity >= PITY) pool = POOL.filter(e => e[0] === 3);
  const e = weighted(pool.map(x => [x, x[1]]));
  if (e[0] === 3) S.mall.pity = 0;
  return grant(e);
}
function grant([r, , id, n]) {
  const S = S_();
  if (id === 'shenshou') {
    const p = makePet(pick(SHENSHOU), S.level, true);
    if (addPet(p)) return { r, icon: '🐉', name: p.name, look: MONSTERS[p.mid].look, big: true };
    addItem('shenshou_sp', 100);
    return { r, icon: '✨', name: `${p.name}（召唤兽已满，化为碎片×100）`, look: MONSTERS[p.mid].look, big: true };
  }
  if (id === 'jade') { addJade(n); return { r, icon: '💠', name: `仙玉×${n}` }; }
  if (id === 'gj_baotu') addHighMap(); else addItem(id, n);
  return { r, icon: ITEMS[id].icon, name: `${ITEMS[id].name}${n > 1 ? '×' + n : ''}` };
}
// 连抽：十连至少一个紫色
export function drawMany(times) {
  const S = S_(), res = [];
  for (let i = 0; i < times; i++) res.push(rollOne());
  if (times > 1 && !res.some(x => x.r >= 2)) { S.mall.pity--; S.stat.pulls--; res[times - 1] = rollOne(2); }
  return res;
}
async function pull(times, free) {
  const S = S_();
  if (bagFree() < (times > 1 ? 6 : 2)) { toast('背包空位不足，先整理一下吧'); return; }
  if (free) { const d = daily(); if (d.freePull) return; d.freePull = 1; }
  else if (!spend(times > 1 ? 900 : 100)) return;
  const res = drawMany(times);
  const gold = res.filter(x => x.r === 3);
  for (const g of gold) log(`【祈愿】天降祥瑞！获得 <b style="color:#ffd040">${g.name}</b>`, '#ffd040');
  save();
  showPulls(res);
  checkRedDot();
}
function showPulls(res) {
  const box = document.createElement('div');
  box.className = 'gacha-res';
  box.innerHTML = `<div class="g-cards ${res.length > 1 ? 'ten' : ''}">${res.map((x, i) => `<div class="gcard r${x.r}" style="animation-delay:${i * 0.12}s"><div class="gc-in"><div class="gc-ic">${x.look ? '' : x.icon}</div><div class="gc-n">${esc(x.name)}</div></div></div>`).join('')}</div><button class="btn primary">收下</button>`;
  res.forEach((x, i) => { if (x.look) { const c = document.createElement('canvas'); c.width = c.height = 64; c.getContext('2d').drawImage(portrait(x.look, 64), 0, 0); box.querySelectorAll('.gc-ic')[i].append(c); } });
  const win = $('#panel .win');
  win.append(box);
  const best = Math.max(...res.map(x => x.r));
  setTimeout(() => { Audio2.sfx(best === 3 ? 'levelup' : 'quest'); if (best === 3) { win.classList.add('gold-flash'); banner('天降祥瑞', res.filter(x => x.r === 3).map(x => x.name).join('、')); } }, res.length * 120 + 200);
  box.querySelector('button').onclick = () => { box.remove(); win.classList.remove('gold-flash'); mallPanel('gacha'); };
}

// ---------------- 商城 ----------------
const SHOP = [['baoxiang', 40], ['shenbing', 280], ['tiangong', 1500], ['lingxi', 30], ['qianghua', 20], ['baohu', 60], ['shoujue', 100], ['gj_shoujue', 800], ['jinke', 40], ['jinke2', 200], ['xiulian', 30], ['shuangbei', 80], ['xinwu', 120], ['jingyan', 150], ['gj_baotu', 150], ['jiuzhuan', 30], ['xianlu', 20], ['feixing', 5], ['sheyao', 5]];
function buy(id, price, n) {
  if (id !== 'gj_baotu' && bagFree() < 1 && !S_().inv.some(e => e.id === id && !e.data)) { toast('背包已满'); return; }
  if (!spend(price * n)) return;
  for (let i = 0; i < n; i++) { if (id === 'gj_baotu') addHighMap(); else addItem(id, 1); }
  Audio2.sfx('coin'); toast(`购买了${ITEMS[id].name}×${n}`);
  save(); mallPanel('shop');
}
function exchangeBeast(mid) {
  const S = S_();
  const have = S.inv.filter(e => e.id === 'shenshou_sp').reduce((s, e) => s + e.n, 0);
  if (have < 100) { toast('神兽碎片不足100片'); return; }
  const p = makePet(mid, S.level, true);
  if (!addPet(p)) { toast('召唤兽已满，先放生一只吧'); return; }
  let n = 100;
  for (let i = S.inv.length - 1; i >= 0 && n > 0; i--) { const e = S.inv[i]; if (e.id !== 'shenshou_sp') continue; const k = Math.min(n, e.n); e.n -= k; n -= k; if (!e.n) S.inv.splice(i, 1); }
  Audio2.sfx('levelup'); banner('神兽降临', p.name); log(`【藏宝阁】兑换了神兽「${p.name}」`, '#ffd040');
  save(); P.refreshHud(); mallPanel('shop');
}

// ---------------- 充值（单机版：点击即到账，不花钱也不花银两） ----------------
// [仙玉, 标价]：标价只是模拟商城档位的展示
const CHARGE = [[60, 6], [300, 30], [680, 68], [1280, 128], [3280, 328], [6480, 648]];
const CHARGE_GIFTS = [[1000, '高级魔兽要诀×1、强化保护符×3', [['gj_shoujue', 1], ['baohu', 3]]], [5000, '神兽碎片×50、超级金柳露×3', [['shenshou_sp', 50], ['jinke2', 3]]], [20000, '神兽碎片×100、高级魔兽要诀×3', [['shenshou_sp', 100], ['gj_shoujue', 3]]]];
function charge(i) {
  const S = S_(), [jade] = CHARGE[i];
  const first = !S.mall.tiersBought[i];
  const got = first ? jade * 2 : jade;
  S.mall.tiersBought[i] = 1; S.mall.charged += got;
  addJade(got);
  Audio2.sfx('coin'); banner('充值成功', `仙玉 +${got}`);
  save(); P.refreshHud(); mallPanel('charge'); checkRedDot();
}
function claimFirstGift() {
  const S = S_();
  if (S.mall.firstCharge || !S.mall.charged) return;
  if (bagFree() < 4) { toast('背包空位不足'); return; }
  const p = makePet('ss_pao', S.level, true);
  if (!addPet(p)) { toast('召唤兽已满，先放生一只吧'); return; }
  S.mall.firstCharge = true;
  addItem('qianghua', 20); addItem('shuangbei', 3); addItem('jinke', 5);
  Audio2.sfx('levelup'); banner('首充礼包', '超级泡泡 · 强化石×20 · 双倍经验丹×3 · 金柳露×5');
  save(); P.refreshHud(); mallPanel('charge'); checkRedDot();
}
function claimChargeGift(i) {
  const S = S_(), [need, , items] = CHARGE_GIFTS[i];
  if (S.mall.charged < need || S.mall.chargeGifts[i]) return;
  if (bagFree() < 2) { toast('背包空位不足'); return; }
  S.mall.chargeGifts[i] = 1;
  for (const [id, n] of items) addItem(id, n);
  Audio2.sfx('levelup'); toast('领取成功');
  save(); mallPanel('charge'); checkRedDot();
}

// ---------------- 福利：签到、等级礼包、成就 ----------------
const SIGN = [{ jade: 50 }, { items: [['qianghua', 5]] }, { jade: 80 }, { items: [['shuangbei', 1]] }, { items: [['xiulian', 3]] }, { items: [['shoujue', 1]] }, { jade: 200, items: [['shenshou_sp', 10], ['shenbing', 1]] }];
const signText = r => [r.jade && `仙玉×${r.jade}`, ...(r.items || []).map(([id, n]) => `${ITEMS[id].name}×${n}`)].filter(Boolean).join('、');
const canSign = () => S_().mall.sign.last !== daily().date;
function doSign() {
  const S = S_(), d = daily();
  if (!canSign()) return;
  const r = SIGN[S.mall.sign.days % 7], k = vipLevel() >= 6 ? 2 : 1;
  S.mall.sign.last = d.date; S.mall.sign.days++;
  if (r.jade) addJade(r.jade * k);
  for (const [id, n] of r.items || []) addItem(id, n * k);
  Audio2.sfx('quest'); toast(`签到成功：${signText(r)}${k > 1 ? '（VIP双倍）' : ''}`);
  save(); mallPanel('welfare'); checkRedDot();
}
const LV_GIFTS = Array.from({ length: 15 }, (_, i) => (i + 1) * 10);
const lvGift = lv => ({ jade: lv * 3, items: [lv % 50 === 0 ? ['gj_shoujue', 1] : lv % 30 === 0 ? ['shuangbei', 2] : ['qianghua', lv / 10], lv % 50 === 0 ? ['tiangong', 1] : ['shenbing', 1]] });
function claimLv(lv) {
  const S = S_();
  if (S.level < lv || S.mall.lvGifts[lv]) return;
  const g = lvGift(lv);
  S.mall.lvGifts[lv] = 1;
  addJade(g.jade);
  for (const [id, n] of g.items) addItem(id, n);
  Audio2.sfx('quest'); toast(`${lv}级礼包：${signText(g)}`);
  save(); mallPanel('welfare'); checkRedDot();
}
const sumV = o => Object.values(o || {}).reduce((a, b) => a + b, 0);
const maxPlus = S => Math.max(0, ...Object.values(S.equip).filter(Boolean).map(e => e.plus || 0), ...S.inv.filter(e => e.eq).map(e => e.eq.plus || 0));
export const ACH = [
  ['lv60', '初窥门径', '人物达到60级', S => S.level, 60, 100],
  ['lv80', '登堂入室', '人物达到80级', S => S.level, 80, 200],
  ['lv100', '百级大侠', '人物达到100级', S => S.level, 100, 400],
  ['lv120', '一代宗师', '人物达到120级', S => S.level, 120, 600],
  ['lv150', '三界传说', '人物达到150级', S => S.level, 150, 1500],
  ['kill1k', '斩妖除魔', '累计击杀1000只妖怪', S => S.kills, 1000, 100],
  ['kill5k', '万妖辟易', '累计击杀5000只妖怪', S => S.kills, 5000, 300],
  ['kill20k', '杀神', '累计击杀20000只妖怪', S => S.kills, 20000, 800],
  ['shimen200', '尊师重道', '累计完成师门任务200次', S => S.stat.shimen, 200, 150],
  ['ghost200', '钟馗门生', '累计抓鬼200只', S => S.stat.ghost, 200, 150],
  ['tower30', '镇妖塔·三十层', '镇妖塔通过第30层', S => S.tower.best, 30, 200],
  ['tower60', '镇妖塔·六十层', '镇妖塔通过第60层', S => S.tower.best, 60, 400],
  ['tower100', '镇妖塔·百层', '镇妖塔通过第100层', S => S.tower.best, 100, 800],
  ['towerAll', '镇妖塔·登顶', `镇妖塔通过全部${TOWER_MAX}层`, S => S.tower.best, TOWER_MAX, 1500],
  ['ss', '神兽之主', '拥有一只神兽', S => (S.pets.some(p => p.shenshou) ? 1 : 0), 1, 300],
  ['forge7', '精工巧匠', '任意装备强化到+7', maxPlus, 7, 100],
  ['forge12', '神兵利器', '任意装备强化到+12', maxPlus, 12, 400],
  ['forge15', '至臻完美', '任意装备强化到+15', maxPlus, 15, 1000],
  ['cult50', '勤修不辍', '修炼总等级达到50', S => sumV(S.cult), 50, 300],
  ['star10', '众星捧月', '伙伴星级总和达到10', S => sumV(S.pstar), 10, 300],
  ['partners', '侠义满堂', '集齐全部伙伴', S => S.partners.length, Object.keys(PARTNERS).length, 500],
  ['arenaGold', '论剑·黄金', '华山论剑达到黄金段位', S => S.arena.best, 1250, 200],
  ['arenaKing', '论剑·王者', '华山论剑达到王者段位', S => S.arena.best, 1800, 1000],
  ['boss30', '首领克星', '击败首领30次', S => S.stat.bosses, 30, 200],
  ['pulls100', '天命之子', '祈愿100次', S => S.stat.pulls, 100, 300],
  ['break4', '三界至尊', '完成全部四次渡劫', S => S.breaks, 4, 1000],
  ['qiyu20', '奇遇连连', '触发20次奇遇', S => S.stat.qiyu || 0, 20, 200],
  ['qiyu100', '天选之人', '触发100次奇遇', S => S.stat.qiyu || 0, 100, 600],
  ['open100', '开箱达人', '鉴定、开启、打造共100件装备', S => S.stat.opened || 0, 100, 300],
  ['shenqi1', '神兵在手', '开出一件神器装备', S => S.stat.shenqi || 0, 1, 500],
  ['story', '七大圣', '完成七大圣篇主线', S => (S.quests.main.step >= Game.MAIN.length ? 1 : 0), 1, 1000],
];
function claimAch(id) {
  const S = S_(), a = ACH.find(x => x[0] === id);
  if (!a || S.mall.ach[id] || a[3](S) < a[4]) return;
  S.mall.ach[id] = 1;
  addJade(a[5]);
  Audio2.sfx('levelup'); banner('成就达成', `${a[1]} · 仙玉+${a[5]}`);
  save(); mallPanel('welfare'); checkRedDot();
}
function claimVipDaily() {
  const d = daily();
  if (vipLevel() < 7 || d.vipJade) return;
  d.vipJade = true; addJade(100); toast('VIP7 每日仙玉 +100'); save(); mallPanel('welfare'); checkRedDot();
}
// 有可领取的福利时，HUD 按钮亮红点
export function hasClaimable() {
  const S = S_();
  if (!S) return false;
  if (canSign()) return true;
  if (vipLevel() >= 3 && !daily().freePull) return true;
  if (vipLevel() >= 7 && !daily().vipJade) return true;
  if (LV_GIFTS.some(lv => S.level >= lv && !S.mall.lvGifts[lv])) return true;
  if (S.mall.charged && !S.mall.firstCharge) return true;
  return ACH.some(a => !S.mall.ach[a[0]] && a[3](S) >= a[4]);
}
let dotAt = 0;
export function checkRedDot(force = true) {
  if (!force && performance.now() - dotAt < 2000) return;
  dotAt = performance.now();
  const b = document.querySelector('#hud-bar [data-k="mall"]');
  if (b) b.classList.toggle('dot', hasClaimable());
}

// ---------------- 面板 ----------------
const TABS = [['gacha', '祈愿'], ['shop', '商城'], ['charge', '充值'], ['welfare', '福利'], ['vip', 'VIP']];
export function mallPanel(tab = 'gacha') {
  const S = S_();
  const b = panel('藏宝阁', '', { id: 'mall', width: 720 });
  const head = `<div class="mall-head"><div class="tabs">${TABS.map(([k, n]) => `<button class="tab ${k === tab ? 'on' : ''}" data-tab="${k}">${n}</button>`).join('')}</div><div class="jade">💠 仙玉 <b>${fmt(S.jade)}</b>　<span class="vip v${vipLevel()}">VIP${vipLevel()}</span></div></div>`;
  let body = '';
  if (tab === 'gacha') {
    const free = vipLevel() >= 3 && !daily().freePull;
    body = `<div class="gacha"><div class="g-banner"><div class="g-title">天命祈愿 · 神兽降世</div><div class="g-beasts"></div><div class="g-desc">金色 2%：<b>神兽</b>、高级魔兽要诀、仙玉×888<br>紫色 13%：神兽碎片×10、超级金柳露、双倍经验丹、高级藏宝图……<br>十连必出紫色，<b>${PITY}</b> 抽内必出金色（还差 <b>${PITY - S.mall.pity}</b> 抽）</div></div>
      <div class="row-btns center"><button class="btn big" id="g1">祈愿一次<small>💠100</small></button><button class="btn big primary" id="g10">祈愿十次<small>💠900</small></button>${free ? '<button class="btn big on" id="gf">VIP免费一次</button>' : ''}</div>
      <div class="muted">累计祈愿 ${S.stat.pulls} 次。神兽也可以在「商城」用100片神兽碎片兑换。</div></div>`;
  } else if (tab === 'shop') {
    const shards = S.inv.filter(e => e.id === 'shenshou_sp').reduce((s, e) => s + e.n, 0);
    body = `<div class="shop mall-shop">${SHOP.map(([id, pr], i) => `<div class="srow"><div class="sinfo"><span class="ic">${ITEMS[id].icon}</span><b>${ITEMS[id].name}</b><small>${ITEMS[id].desc}</small></div><div class="sp jd">💠${pr}</div><button class="btn small primary" data-b="${i}" data-n="1" ${S.jade < pr ? 'disabled' : ''}>购买</button><button class="btn small" data-b="${i}" data-n="5" ${S.jade < pr * 5 ? 'disabled' : ''}>×5</button></div>`).join('')}</div>
      <div class="beasts"><div class="muted">神兽兑换（神兽碎片 <b>${shards}</b>/100）：</div><div class="bst">${SHENSHOU.map(mid => `<button class="btn small" data-x="${mid}" ${shards < 100 ? 'disabled' : ''}><span class="bf" data-m="${mid}"></span>${MONSTERS[mid].name}</button>`).join('')}</div></div>`;
  } else if (tab === 'charge') {
    body = `<div class="charge">${CHARGE.map(([j, g], i) => `<div class="ctier"><div class="cj">💠${j}${!S.mall.tiersBought[i] ? '<span class="dbl">首充双倍</span>' : ''}</div><div class="cg">￥${g}</div><button class="btn small primary" data-c="${i}">充值</button></div>`).join('')}</div>
      <div class="first ${S.mall.firstCharge ? 'got' : ''}"><b>首充礼包</b>：任意充值一次即可领取 —— <b style="color:#ff6aa8">神兽·超级泡泡</b>、强化石×20、双倍经验丹×3、金柳露×5
      <button class="btn small ${S.mall.charged && !S.mall.firstCharge ? 'primary' : ''}" id="c-first" ${S.mall.charged && !S.mall.firstCharge ? '' : 'disabled'}>${S.mall.firstCharge ? '已领取' : '领取'}</button></div>
      <div class="muted">累计充值仙玉：<b>${fmt(S.mall.charged)}</b>（单机版充值免费，点击即到账；每档首次双倍）</div>
      ${CHARGE_GIFTS.map(([need, txt], i) => `<div class="srow"><div class="sinfo">累计充值 ${need} 仙玉：${txt}</div><button class="btn small" data-g="${i}" ${S.mall.charged >= need && !S.mall.chargeGifts[i] ? '' : 'disabled'}>${S.mall.chargeGifts[i] ? '已领取' : S.mall.charged >= need ? '领取' : '未达成'}</button></div>`).join('')}`;
  } else if (tab === 'welfare') {
    const day = S.mall.sign.days % 7;
    body = `<div class="sub">每日签到 <span class="muted">（已签 ${S.mall.sign.days} 天）</span></div><div class="sign">${SIGN.map((r, i) => `<div class="sday ${i < day || (i === day && !canSign() && false) ? 'done' : ''} ${i === day && canSign() ? 'now' : ''}"><div>第${i + 1}天</div><small>${signText(r)}</small></div>`).join('')}</div>
      <div class="row-btns"><button class="btn primary" id="w-sign" ${canSign() ? '' : 'disabled'}>${canSign() ? '签到' : '今日已签到'}</button>${vipLevel() >= 7 ? `<button class="btn" id="w-vip" ${daily().vipJade ? 'disabled' : ''}>VIP7 每日100仙玉</button>` : ''}</div>
      <div class="sub">等级礼包</div><div class="lvg">${LV_GIFTS.map(lv => `<button class="btn small ${S.level >= lv && !S.mall.lvGifts[lv] ? 'primary' : ''}" data-l="${lv}" ${S.level >= lv && !S.mall.lvGifts[lv] ? '' : 'disabled'} title="${signText(lvGift(lv))}">${lv}级${S.mall.lvGifts[lv] ? '✔' : ''}</button>`).join('')}</div>
      <div class="sub">成就</div><div class="achs">${ACH.map(([id, n, d, f, need, jade]) => { const cur = Math.min(need, f(S)), got = S.mall.ach[id]; return `<div class="ach ${got ? 'got' : ''}"><div><b>${n}</b><small>${d}</small></div><div class="ap">${cur}/${need}</div><button class="btn small ${!got && cur >= need ? 'primary' : ''}" data-a="${id}" ${!got && cur >= need ? '' : 'disabled'}>${got ? '已领' : `💠${jade}`}</button></div>`; }).join('')}</div>`;
  } else {
    const v = vipLevel(), next = VIP_STEPS[v + 1];
    body = `<div class="vipbox"><div class="vip big v${v}">VIP ${v}</div><div>累计消费仙玉 <b>${fmt(S.mall.spent)}</b>${next ? `，再消费 <b>${fmt(next - S.mall.spent)}</b> 升到 VIP${v + 1}` : '，已满级'}</div>
      ${next ? `<div class="bar exp"><i style="width:${Math.min(100, (S.mall.spent - VIP_STEPS[v]) / (next - VIP_STEPS[v]) * 100)}%"></i><span>${S.mall.spent}/${next}</span></div>` : ''}</div>
      <div class="viplist">${VIP_DESC.map((t, i) => i ? `<div class="vrow ${i <= v ? 'on' : ''}"><span class="vip v${i}">VIP${i}</span><span>累计消费 ${fmt(VIP_STEPS[i])}</span><span>${t}</span></div>` : '').join('')}</div>`;
  }
  b.innerHTML = head + body;
  b.querySelectorAll('.tab').forEach(x => x.onclick = () => mallPanel(x.dataset.tab));
  if (tab === 'gacha') {
    const bg = b.querySelector('.g-beasts');
    for (const mid of SHENSHOU) { const c = document.createElement('canvas'); c.width = c.height = 72; c.getContext('2d').drawImage(portrait(MONSTERS[mid].look, 72), 0, 0); c.title = MONSTERS[mid].name; bg.append(c); }
    b.querySelector('#g1').onclick = () => pull(1);
    b.querySelector('#g10').onclick = () => pull(10);
    b.querySelector('#gf')?.addEventListener('click', () => pull(1, true));
  }
  b.querySelectorAll('[data-b]').forEach(x => x.onclick = () => { const [id, pr] = SHOP[+x.dataset.b]; buy(id, pr, +x.dataset.n); });
  b.querySelectorAll('.bf').forEach(x => { const c = document.createElement('canvas'); c.width = c.height = 28; c.getContext('2d').drawImage(portrait(MONSTERS[x.dataset.m].look, 28), 0, 0); x.append(c); });
  b.querySelectorAll('[data-x]').forEach(x => x.onclick = () => exchangeBeast(x.dataset.x));
  b.querySelectorAll('[data-c]').forEach(x => x.onclick = () => charge(+x.dataset.c));
  b.querySelector('#c-first')?.addEventListener('click', claimFirstGift);
  b.querySelectorAll('[data-g]').forEach(x => x.onclick = () => claimChargeGift(+x.dataset.g));
  b.querySelector('#w-sign')?.addEventListener('click', doSign);
  b.querySelector('#w-vip')?.addEventListener('click', claimVipDaily);
  b.querySelectorAll('[data-l]').forEach(x => x.onclick = () => claimLv(+x.dataset.l));
  b.querySelectorAll('[data-a]').forEach(x => x.onclick = () => claimAch(x.dataset.a));
}
