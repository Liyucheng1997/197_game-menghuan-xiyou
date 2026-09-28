// 界面面板：HUD、人物、道具、召唤兽、技能、任务、队伍、地图、商店、系统
import { ROLES, RACES, SCHOOLS, SKILLS, ITEMS, MONSTERS, PARTNERS, ATTRS, SLOTS, STAT_NAMES, RARITY, WEAPON_TYPE_NAMES, PET_MAX, PARTY_MAX, BAG_SIZE, expNeed, skillCost, MAX_LEVEL } from './data.js';
import { G, save, stats, autoAssign, equipFromBag, unequip, makeEquip, addItem, addEquip, activePet, recruit, toggleParty, rarityColor, canEquip, wipe } from './state.js';
import { petStats, partnerStats } from './stats.js';
import { portrait } from './art.js';
import { $, el, panel, closePanel, toast, log, bar, confirmBox, promptBox, UI } from './ui.js';
import { W, minimap, navigate } from './world.js';
import { MAP_NAMES, getMap } from './maps.js';
import { NPCS } from './npcs.js';
import * as Game from './game.js';
import { esc, fmt } from './util.js';
import { Audio2 } from './audio.js';

const pc = (look, size) => { const c = document.createElement('canvas'); c.width = c.height = size; c.getContext('2d').drawImage(portrait(look, size), 0, 0); return c; };

// ---------------- HUD ----------------
let hudBuilt = false;
let miniCache = { id: null, c: null, sc: 1 };
export function buildHud() {
  if (hudBuilt) return;
  hudBuilt = true;
  const hud = $('#hud');
  hud.innerHTML = `
    <div id="hud-map"><div id="hud-mapname"></div><canvas id="hud-mini" width="150" height="100"></canvas></div>
    <div id="hud-status">
      <div class="st-row"><div class="face" id="hud-face"></div><div class="st-info"><div id="hud-name"></div><div id="hud-bars"></div></div></div>
      <div class="st-row pet" id="hud-pet"></div>
    </div>
    <div id="hud-track"></div>
    <div id="hud-log"></div>
    <div id="hud-bar">
      <button data-k="char" title="人物 (W)"><i>👤</i>人物</button>
      <button data-k="bag" title="道具 (E)"><i>🎒</i>道具</button>
      <button data-k="pet" title="召唤兽 (P)"><i>🐾</i>召唤兽</button>
      <button data-k="skill" title="技能 (F)"><i>📖</i>技能</button>
      <button data-k="quest" title="任务 (Q)"><i>📜</i>任务</button>
      <button data-k="team" title="队伍 (T)"><i>👥</i>队伍</button>
      <button data-k="map" title="地图 (Tab)"><i>🗺️</i>地图</button>
      <button data-k="sys" title="系统 (Esc)"><i>⚙️</i>系统</button>
    </div>`;
  for (const b of hud.querySelectorAll('#hud-bar button')) b.onclick = () => openPanel(b.dataset.k);
  $('#hud-mini').onclick = () => openPanel('map');
}
export function hideHud(h) { $('#hud').classList.toggle('battle', h); }

export function refreshHud() {
  const S = G.S;
  if (!S || !hudBuilt) return;
  const st = stats();
  const role = ROLES[S.role];
  const face = $('#hud-face');
  if (!face.firstChild) face.append(pc(role.look, 54));
  $('#hud-name').innerHTML = `<b>${esc(S.name)}</b> <span class="lv">Lv${S.level}</span> <span class="sc">${S.school ? SCHOOLS[S.school].name : '无门派'}</span>`;
  $('#hud-bars').innerHTML = bar(S.hp, st.maxHp, 'hp') + bar(S.mp, st.maxMp, 'mp') + bar(S.exp, expNeed(S.level), 'exp');
  const pet = activePet();
  const pd = $('#hud-pet');
  if (pet) {
    const ps = petStats(pet);
    const key = pet.uid;
    if (pd.dataset.k !== String(key)) { pd.innerHTML = '<div class="face small"></div><div class="st-info"><div class="pn"></div><div class="pb"></div></div>'; pd.querySelector('.face').append(pc(MONSTERS[pet.mid].look, 36)); pd.dataset.k = key; }
    pd.querySelector('.pn').innerHTML = `${esc(pet.name)} <span class="lv">Lv${pet.level}</span>`;
    pd.querySelector('.pb').innerHTML = bar(pet.hp, ps.maxHp, 'hp') + bar(pet.mp, ps.maxMp, 'mp');
    pd.style.display = '';
  } else { pd.style.display = 'none'; pd.dataset.k = ''; }
  if (W.map) {
    $('#hud-mapname').innerHTML = `${W.map.name} <span>(${W.tx},${W.ty})</span>`;
    drawMini();
  }
  // 任务追踪
  const tr = $('#hud-track');
  const list = Game.trackList();
  const html = '<div class="tr-head">任务追踪</div>' + list.map((t, i) => `<div class="tr-item" data-i="${i}"><div class="tr-t" style="color:${t.color}">【${t.cat}】${t.title}</div><div class="tr-d">${t.text}</div></div>`).join('');
  if (tr.dataset.html === html) return;
  tr.dataset.html = html;
  tr.innerHTML = html;
  tr.querySelectorAll('.tr-item').forEach(d => { const t = list[+d.dataset.i]; if (t.nav) { d.classList.add('nav'); d.title = '点击自动寻路'; d.onclick = () => { Audio2.sfx('click'); Game.followTrack(t.nav); }; } });
}
function drawMini() {
  const c = $('#hud-mini');
  const g = c.getContext('2d');
  if (miniCache.id !== W.map.id) { const m = minimap(300); miniCache = { id: W.map.id, c: m.canvas, sc: m.scale }; }
  const m = miniCache;
  // 以玩家为中心显示局部
  const z = 1.2;
  const px = W.px * m.sc * z, py = W.py * m.sc * z;
  g.fillStyle = '#20180f'; g.fillRect(0, 0, 150, 100);
  g.save();
  g.translate(75 - px, 50 - py);
  g.scale(z, z);
  g.drawImage(m.c, 0, 0);
  g.restore();
  // 出口与NPC
  const sx = x => 75 + (x - W.px) * m.sc * z, sy = y => 50 + (y - W.py) * m.sc * z;
  for (const e of W.map.exits) { g.fillStyle = '#6ae0ff'; g.beginPath(); g.arc(sx(e.x * 32 + 16), sy(e.y * 32 + 16), 3, 0, 7); g.fill(); }
  for (const n of W.map.npcs) { g.fillStyle = '#ffe860'; g.fillRect(sx(n.x * 32 + 16) - 1.5, sy(n.y * 32 + 16) - 1.5, 3, 3); }
  for (const n of Game.dynNpcs(W.map.id)) { g.fillStyle = '#ff5a4a'; g.beginPath(); g.arc(sx(n.x * 32 + 16), sy(n.y * 32 + 16), 3, 0, 7); g.fill(); }
  g.fillStyle = '#7dff7a'; g.beginPath(); g.arc(75, 50, 3.5, 0, 7); g.fill(); g.strokeStyle = '#000'; g.lineWidth = 1; g.stroke();
}

export function openPanel(k) {
  if (Game.R.scene !== 'world') return;
  if (UI.panelOpen === k) { closePanel(); return; }
  ({ char: charPanel, bag: bagPanel, pet: petPanel, skill: skillPanel, quest: questPanel, team: partnerPanel, map: mapPanel, sys: systemPanel })[k]?.();
}
export function closeAll() { closePanel(); }

// ---------------- 人物 ----------------
export function charPanel() {
  const S = G.S, st = stats(), role = ROLES[S.role];
  const b = panel('人物属性', '', { id: 'char', width: 640 });
  const eqHtml = SLOTS.map(([k, n]) => { const e = S.equip[k]; return `<div class="eq-slot ${e ? 'has' : ''}" data-k="${k}"><span class="eq-n">${n}</span>${e ? `<b style="color:${rarityColor(e.rarity)}">${e.name}</b><small>${Object.entries(e.stats).map(([s, v]) => STAT_NAMES[s] + '+' + v).join(' ')}</small>` : '<small>空</small>'}</div>`; }).join('');
  b.innerHTML = `<div class="char">
    <div class="char-l"><div class="char-face"></div>
      <div class="char-id"><b>${esc(S.name)}</b><div>${role.name} · ${RACES[role.race].name}</div><div>${S.school ? SCHOOLS[S.school].name : '无门派'}</div><div class="title-tag">${esc(S.title)}</div></div>
      <div class="eqs">${eqHtml}</div></div>
    <div class="char-r">
      <div class="kv"><span>等级</span><b>${S.level}</b><span>银两</span><b>${fmt(S.gold)}</b></div>
      ${bar(S.exp, expNeed(S.level), 'exp')}
      <div class="stats">
        <div><span>气血</span><b>${S.hp}/${st.maxHp}</b></div><div><span>魔法</span><b>${S.mp}/${st.maxMp}</b></div>
        <div><span>伤害</span><b>${st.atk}</b></div><div><span>防御</span><b>${st.def}</b></div>
        <div><span>速度</span><b>${st.spd}</b></div><div><span>灵力</span><b>${st.mpow}</b></div>
      </div>
      <div class="attrs">${ATTRS.map(([k, n, d]) => `<div class="attr"><span title="${d}">${n}</span><b>${S.attr[k]}</b><button class="btn tiny" data-a="${k}" ${S.free ? '' : 'disabled'}>+</button></div>`).join('')}
      <div class="attr free"><span>潜力点</span><b>${S.free}</b><button class="btn tiny" id="auto-pts" ${S.free ? '' : 'disabled'}>推荐</button></div></div>
      <label class="chk"><input type="checkbox" id="auto-lv" ${S.flags.autoPoints !== false ? 'checked' : ''}> 升级时按门派自动加点</label>
      <div class="muted">击杀：${S.kills} · 师门：${S.quests.shimenCount}环 · 抓鬼：${S.quests.ghostCount}只</div>
    </div></div>`;
  b.querySelector('.char-face').append(pc(role.look, 120));
  b.querySelectorAll('[data-a]').forEach(x => x.onclick = () => { if (S.free > 0) { S.attr[x.dataset.a]++; S.free--; Audio2.sfx('click'); charPanel(); refreshHud(); } });
  b.querySelector('#auto-pts').onclick = () => { autoAssign(S); charPanel(); refreshHud(); };
  b.querySelector('#auto-lv').onchange = e => { S.flags.autoPoints = e.target.checked; };
  b.querySelectorAll('.eq-slot.has').forEach(x => x.onclick = () => { const r = unequip(x.dataset.k); if (r) toast(r); else { Audio2.sfx('click'); charPanel(); refreshHud(); } });
}

// ---------------- 道具 ----------------
export function bagPanel(sel = -1) {
  const S = G.S;
  const b = panel('道具行囊', '', { id: 'bag', width: 620 });
  const cells = [];
  for (let i = 0; i < BAG_SIZE; i++) {
    const e = S.inv[i];
    if (!e) { cells.push('<div class="cell empty"></div>'); continue; }
    if (e.eq) cells.push(`<div class="cell ${i === sel ? 'sel' : ''}" data-i="${i}" style="border-color:${rarityColor(e.eq.rarity)}"><span class="ic">${slotIcon(e.eq.slot)}</span><span class="nm" style="color:${rarityColor(e.eq.rarity)}">${e.eq.name}</span></div>`);
    else cells.push(`<div class="cell ${i === sel ? 'sel' : ''}" data-i="${i}"><span class="ic">${ITEMS[e.id].icon}</span><span class="nm">${ITEMS[e.id].name}</span>${e.n > 1 ? `<span class="ct">${e.n}</span>` : ''}</div>`);
  }
  b.innerHTML = `<div class="bag"><div class="grid">${cells.join('')}</div><div class="detail" id="bag-detail"><div class="muted">点击物品查看详情</div></div></div><div class="gold">银两：<b>${fmt(S.gold)}</b>　<span class="muted">${S.inv.length}/${BAG_SIZE}</span></div>`;
  b.querySelectorAll('.cell[data-i]').forEach(c => c.onclick = () => bagPanel(+c.dataset.i));
  if (sel >= 0 && S.inv[sel]) showItem(b.querySelector('#bag-detail'), sel);
}
const slotIcon = s => ({ weapon: '⚔️', helm: '🎩', neck: '📿', armor: '👘', belt: '🎗️', boots: '👢' }[s]);
function equipDesc(eq) {
  return `<div class="it-name" style="color:${rarityColor(eq.rarity)}">${eq.name}</div><div class="muted">${RARITY[eq.rarity].name} · ${SLOTS.find(s => s[0] === eq.slot)[1]}${eq.wtype ? '（' + WEAPON_TYPE_NAMES[eq.wtype] + '）' : ''} · 需要等级${eq.req}</div>
    <div class="it-stats">${Object.entries(eq.stats).map(([k, v]) => `<div>${STAT_NAMES[k]} <b>+${v}</b></div>`).join('')}</div>`;
}
function showItem(d, i) {
  const S = G.S, e = S.inv[i];
  if (e.eq) {
    const why = canEquip(e.eq);
    const cur = S.equip[e.eq.slot];
    d.innerHTML = equipDesc(e.eq) + (cur ? `<div class="cmp">当前：${equipDesc(cur)}</div>` : '') + `<div class="row-btns"><button class="btn primary" id="b-eq" ${why ? 'disabled' : ''}>${why || '装备'}</button><button class="btn" id="b-sell">出售 ${Math.floor(e.eq.price * 0.3)}两</button></div>`;
    d.querySelector('#b-eq').onclick = () => { const r = equipFromBag(i); if (r) toast(r); else { Audio2.sfx('click'); bagPanel(); refreshHud(); save(); } };
  } else {
    const it = ITEMS[e.id];
    let extra = '';
    if (e.id === 'baotu' && e.data) extra = `<div class="muted">宝藏位置：${MAP_NAMES[e.data.map]}（${e.data.x},${e.data.y}）</div>`;
    const usable = !['revive'].includes(it.type);
    d.innerHTML = `<div class="it-name">${it.icon} ${it.name}</div><div>${it.desc}</div>${extra}<div class="row-btns">${usable ? '<button class="btn primary" id="b-use">使用</button>' : ''}${it.type === 'food' && activePet() ? '<button class="btn" id="b-pet">给召唤兽</button>' : ''}${it.price ? `<button class="btn" id="b-sell">出售 ${Math.floor(it.price * 0.3)}两</button>` : '<button class="btn" id="b-drop">丢弃</button>'}</div>`;
    d.querySelector('#b-use')?.addEventListener('click', async () => { await Game.useItem(i); if (UI.panelOpen === 'bag') bagPanel(G.S.inv[i] && G.S.inv[i].id === e.id ? i : -1); });
    d.querySelector('#b-pet')?.addEventListener('click', async () => { await Game.useItem(i, 'pet'); if (UI.panelOpen === 'bag') bagPanel(G.S.inv[i] && G.S.inv[i].id === e.id ? i : -1); });
    d.querySelector('#b-drop')?.addEventListener('click', async () => { if (await confirmBox(`确定丢弃${it.name}吗？`)) { S.inv.splice(i, 1); bagPanel(); } });
  }
  d.querySelector('#b-sell')?.addEventListener('click', () => {
    const price = e.eq ? Math.floor(e.eq.price * 0.3) : Math.floor(ITEMS[e.id].price * 0.3);
    if (e.n > 1) e.n--; else S.inv.splice(i, 1);
    S.gold += price; Audio2.sfx('coin'); toast(`出售获得 ${price} 两`);
    bagPanel(S.inv[i] ? i : -1); refreshHud(); save();
  });
}

// ---------------- 召唤兽 ----------------
export function petPanel(sel) {
  const S = G.S;
  if (sel == null) sel = S.petActive >= 0 ? S.petActive : 0;
  const b = panel('召唤兽', '', { id: 'pet', width: 640 });
  if (!S.pets.length) { b.innerHTML = '<div class="empty-tip">还没有召唤兽。<br>在野外战斗中使用<b>「捕捉」</b>即可收服怪物（带宝宝字样的更加珍贵）。</div>'; return; }
  const p = S.pets[sel] || S.pets[0];
  const ps = petStats(p);
  const m = MONSTERS[p.mid];
  b.innerHTML = `<div class="pets"><div class="plist">${S.pets.map((q, i) => `<div class="pitem ${i === sel ? 'sel' : ''}" data-i="${i}"><div class="pf"></div><div><b style="color:${q.baby ? '#ffd040' : '#fff6d8'}">${esc(q.name)}</b><small>Lv${q.level}${i === S.petActive ? ' · 参战' : ''}</small></div></div>`).join('')}<div class="muted">${S.pets.length}/${PET_MAX}</div></div>
    <div class="pdetail"><div class="ptop"><div class="pbig"></div><div><div class="it-name" style="color:${p.baby ? '#ffd040' : '#fff6d8'}">${esc(p.name)}${p.baby ? ' <small>宝宝</small>' : ''}</div><div class="muted">${m.name} · 等级 ${p.level} · 成长 ${p.growth.toFixed(3)}</div>${bar(p.exp, expNeed(p.level), 'exp')}</div></div>
      <div class="stats"><div><span>气血</span><b>${p.hp}/${ps.maxHp}</b></div><div><span>魔法</span><b>${p.mp}/${ps.maxMp}</b></div><div><span>伤害</span><b>${ps.atk}</b></div><div><span>防御</span><b>${ps.def}</b></div><div><span>速度</span><b>${ps.spd}</b></div><div><span>灵力</span><b>${ps.mpow}</b></div></div>
      <div class="pskills">${p.skills.map(s => `<span class="sk ${SKILLS[s].rare ? 'rare' : ''}" title="${esc(SKILLS[s].desc)}">${SKILLS[s].name}</span>`).join('')}</div>
      <div class="row-btns"><button class="btn primary" id="p-act">${sel === S.petActive ? '休息' : '参战'}</button><button class="btn" id="p-name">改名</button><button class="btn" id="p-free">放生</button></div>
      <div class="muted">召唤兽等级最多比人物高5级。技能悬停可查看说明。</div></div></div>`;
  b.querySelectorAll('.pitem').forEach((d, i) => { d.querySelector('.pf').append(pc(MONSTERS[S.pets[i].mid].look, 40)); d.onclick = () => petPanel(i); });
  b.querySelector('.pbig').append(pc(m.look, 90));
  b.querySelector('#p-act').onclick = () => { S.petActive = sel === S.petActive ? -1 : sel; petPanel(sel); refreshHud(); save(); };
  b.querySelector('#p-name').onclick = async () => { const n = await promptBox('给召唤兽起个名字', p.name); if (n) { p.name = n.slice(0, 8); petPanel(sel); refreshHud(); save(); } };
  b.querySelector('#p-free').onclick = async () => { if (await confirmBox(`确定放生${esc(p.name)}吗？此操作无法撤销。`)) { S.pets.splice(sel, 1); if (S.petActive === sel) S.petActive = -1; else if (S.petActive > sel) S.petActive--; petPanel(0); refreshHud(); save(); } };
}

// ---------------- 技能 ----------------
export function skillPanel() {
  const S = G.S;
  const b = panel('门派技能', '', { id: 'skill', width: 560 });
  if (!S.school) { b.innerHTML = '<div class="empty-tip">尚未拜入门派。<br>5级后前往长安城<b>驿站老板</b>处拜师，即可学习门派技能。</div>'; return; }
  const sc = SCHOOLS[S.school];
  b.innerHTML = `<div class="skl-head">${sc.name} · 师父 ${sc.master}<div class="muted">${sc.desc}</div></div>` + [...sc.skills, sc.passive].map(id => {
    const s = SKILLS[id], lv = S.skills[id] || 0;
    return `<div class="skl"><div class="skl-n"><b>${s.name}</b> <span class="lv">${lv}级</span>${s.mp ? `<small>消耗魔法 ${s.mp(lv)}</small>` : '<small>被动心法</small>'}</div><div class="muted">${s.desc}</div></div>`;
  }).join('') + '<div class="muted">技能需回门派找师父花费银两学习，等级上限为人物等级+10。</div>';
}
export function learnPanel() {
  const S = G.S, sc = SCHOOLS[S.school];
  const b = panel(`学习技能 · ${sc.name}`, '', { id: 'learn', width: 580 });
  const cap = Math.min(MAX_LEVEL + 10, S.level + 10);
  b.innerHTML = [...sc.skills, sc.passive].map(id => {
    const s = SKILLS[id], lv = S.skills[id] || 0, cost = skillCost(lv);
    return `<div class="skl"><div class="skl-n"><b>${s.name}</b> <span class="lv">${lv}/${cap}</span></div><div class="muted">${s.desc}</div><div class="row-btns"><button class="btn primary" data-s="${id}" data-n="1" ${lv >= cap || S.gold < cost ? 'disabled' : ''}>学习 (${fmt(cost)}两)</button><button class="btn" data-s="${id}" data-n="10" ${lv >= cap ? 'disabled' : ''}>连学10级</button></div></div>`;
  }).join('') + `<div class="gold">银两：<b>${fmt(S.gold)}</b></div>`;
  b.querySelectorAll('[data-s]').forEach(x => x.onclick = () => {
    let n = +x.dataset.n, learned = 0;
    const id = x.dataset.s;
    while (n-- > 0 && (S.skills[id] || 0) < cap && S.gold >= skillCost(S.skills[id] || 0)) { S.gold -= skillCost(S.skills[id] || 0); S.skills[id] = (S.skills[id] || 0) + 1; learned++; }
    if (learned) { Audio2.sfx('levelup'); toast(`${SKILLS[id].name} 提升到 ${S.skills[id]} 级`); } else toast('银两不足');
    stats(); learnPanel(); refreshHud(); save();
  });
}

// ---------------- 任务 ----------------
export function questPanel() {
  const S = G.S;
  const b = panel('任务', '', { id: 'quest', width: 600 });
  const list = Game.trackList();
  const st = Game.mainStep();
  const hist = Game.MAIN.slice(0, S.quests.main.step).map(s => `<span class="done">✔ ${s.title}</span>`).join('');
  b.innerHTML = list.map((t, i) => `<div class="qitem" data-i="${i}"><div class="qt" style="color:${t.color}">【${t.cat}】${t.title}</div><div>${t.text}</div>${t.nav ? '<button class="btn small">自动寻路</button>' : ''}</div>`).join('')
    + (st && S.quests.main.state !== 'accept' ? `<div class="qdesc">${st.accept.join('<br>')}</div>` : '')
    + `<div class="qhist"><div class="muted">主线进度 ${S.quests.main.step}/${Game.MAIN.length}</div>${hist}</div>`
    + `<div class="qhelp"><b>日常玩法</b><br>· 师门任务：拜师后找师父领取，每10环有额外奖励<br>· 抓鬼任务：15级后找长安城<b>钟馗</b><br>· 宝图任务：10级后找长安城酒楼<b>店小二</b><br>· 伙伴：长安城<b>侠义堂主</b>处招募</div>`;
  b.querySelectorAll('.qitem button').forEach(x => x.onclick = () => { const t = list[+x.parentElement.dataset.i]; closePanel(); Game.followTrack(t.nav); });
}

// ---------------- 伙伴 ----------------
export function partnerPanel() {
  const S = G.S;
  const b = panel('伙伴 · 队伍', '', { id: 'team', width: 680 });
  b.innerHTML = `<div class="muted">出战伙伴 ${S.party.length}/${PARTY_MAX}，等级与你同步。伙伴在战斗中自动行动。${Game.R.scene === 'world' && W.map?.id === 'changan' ? '' : '<br>招募新伙伴需要前往长安城侠义堂。'}</div><div class="partners">` + Object.entries(PARTNERS).map(([id, p]) => {
    const own = S.partners.includes(id), inP = S.party.includes(id);
    const ps = partnerStats(id, S.level);
    const near = W.map?.id === 'changan';
    return `<div class="partner ${inP ? 'in' : ''}"><div class="pf"></div><div class="pi"><b>${p.name}</b> <small>${SCHOOLS[p.school].name}</small><div class="muted">${p.desc}</div><div class="muted">气血${ps.maxHp} 伤害${ps.atk} 灵力${ps.mpow} 速度${ps.spd}</div></div>
      <div class="pa">${own ? `<button class="btn ${inP ? '' : 'primary'}" data-t="${id}">${inP ? '休息' : '出战'}</button>` : p.price ? `<button class="btn primary" data-r="${id}" ${near && S.gold >= p.price ? '' : 'disabled'}>招募 ${fmt(p.price)}两</button>` : '<small class="muted">剧情解锁</small>'}</div></div>`;
  }).join('') + '</div>';
  b.querySelectorAll('.partner').forEach((d, i) => d.querySelector('.pf').append(pc(Object.values(PARTNERS)[i].look, 56)));
  b.querySelectorAll('[data-t]').forEach(x => x.onclick = () => { if (!toggleParty(x.dataset.t)) toast('出战伙伴已满'); partnerPanel(); save(); });
  b.querySelectorAll('[data-r]').forEach(x => x.onclick = () => { const p = PARTNERS[x.dataset.r]; if (S.gold < p.price) return; S.gold -= p.price; recruit(x.dataset.r); Audio2.sfx('levelup'); toast(`${p.name}加入了你的队伍！`); log(`伙伴「${p.name}」加入`, '#ffd23a'); partnerPanel(); refreshHud(); save(); });
}

// ---------------- 地图 ----------------
export function mapPanel() {
  const b = panel('地图 · ' + W.map.name, '', { id: 'map', width: 720 });
  const m = minimap(520);
  const wrap = el('<div class="mapwrap"></div>');
  const cv = m.canvas;
  cv.className = 'bigmap';
  const g = cv.getContext('2d');
  const sc = m.scale;
  for (const e of W.map.exits) { g.fillStyle = '#6ae0ff'; g.beginPath(); g.arc((e.x * 32 + 16) * sc, (e.y * 32 + 16) * sc, 5, 0, 7); g.fill(); g.font = '12px sans-serif'; g.textAlign = 'center'; g.lineWidth = 3; g.strokeStyle = '#000'; g.strokeText(e.label, (e.x * 32 + 16) * sc, (e.y * 32) * sc - 4); g.fillStyle = '#9ae8ff'; g.fillText(e.label, (e.x * 32 + 16) * sc, (e.y * 32) * sc - 4); }
  for (const n of [...W.map.npcs.map(n => ({ ...n, name: NPCS[n.id].name })), ...Game.dynNpcs(W.map.id)]) { g.fillStyle = n.onTalk ? '#ff5a4a' : '#ffe860'; g.beginPath(); g.arc((n.x * 32 + 16) * sc, (n.y * 32 + 16) * sc, 3.5, 0, 7); g.fill(); g.font = '11px sans-serif'; g.textAlign = 'center'; g.lineWidth = 3; g.strokeStyle = '#000'; g.strokeText(n.name, (n.x * 32 + 16) * sc, (n.y * 32 + 16) * sc - 6); g.fillStyle = '#fff'; g.fillText(n.name, (n.x * 32 + 16) * sc, (n.y * 32 + 16) * sc - 6); }
  g.fillStyle = '#7dff7a'; g.beginPath(); g.arc(W.px * sc, W.py * sc, 5, 0, 7); g.fill(); g.strokeStyle = '#000'; g.lineWidth = 1.5; g.stroke();
  cv.onclick = (ev) => {
    const r = cv.getBoundingClientRect();
    const x = Math.floor((ev.clientX - r.left) / r.width * cv.width / sc / 32), y = Math.floor((ev.clientY - r.top) / r.height * cv.height / sc / 32);
    closePanel();
    navigate({ map: W.map.id, x, y });
  };
  wrap.append(cv);
  b.append(wrap);
  const worldList = el(`<div class="worldlist"><div class="muted">点击小地图可自动寻路。世界地图：</div>${['jianye', 'donghai', 'jiangnan', 'changan', 'guojing', 'jingwai', 'huaguo'].map(id => { const e = getMap(id).encounter; return `<button class="btn small" data-m="${id}">${MAP_NAMES[id]}${e ? ` <small>${e.lv[0]}-${e.lv[1]}级</small>` : ''}</button>`; }).join('')}</div>`);
  worldList.querySelectorAll('[data-m]').forEach(x => x.onclick = () => { closePanel(); const mm = getMap(x.dataset.m); navigate({ map: x.dataset.m, x: mm.spawn[0], y: mm.spawn[1] }); });
  b.append(worldList);
}

// ---------------- 商店 ----------------
export function shopPanel(title, cfg, tab = 'buy') {
  const S = G.S;
  const b = panel(title, '', { id: 'shop', width: 620 });
  const wtype = ROLES[S.role].weapon;
  let rows = [];
  if (tab === 'buy') {
    for (const id of cfg.items || []) rows.push({ html: `<span class="ic">${ITEMS[id].icon}</span><b>${ITEMS[id].name}</b><small>${ITEMS[id].desc}</small>`, price: ITEMS[id].price, buy: n => { for (let k = 0; k < n; k++) if (!addItem(id, 1)) return false; return true; }, multi: true });
    for (const slot of cfg.equip || []) for (const t of cfg.tiers) {
      const eq = makeEquip(slot, t, wtype, 0);
      rows.push({ html: `<span class="ic">${slotIcon(slot)}</span><b>${eq.name}</b><small>${Object.entries(eq.stats).map(([k, v]) => STAT_NAMES[k] + '+' + v).join(' ')} · ${eq.req}级</small>`, price: eq.price, dim: S.level < eq.req, buy: () => addEquip(makeEquip(slot, t, wtype, 0)) });
    }
  } else {
    S.inv.forEach((e, i) => {
      const price = e.eq ? Math.floor(e.eq.price * 0.3) : Math.floor((ITEMS[e.id].price || 0) * 0.3);
      if (!price) return;
      rows.push({ html: e.eq ? `<span class="ic">${slotIcon(e.eq.slot)}</span><b style="color:${rarityColor(e.eq.rarity)}">${e.eq.name}</b>` : `<span class="ic">${ITEMS[e.id].icon}</span><b>${ITEMS[e.id].name}</b><small>×${e.n}</small>`, price, sell: i });
    });
  }
  b.innerHTML = `<div class="tabs"><button class="tab ${tab === 'buy' ? 'on' : ''}" data-tab="buy">购买</button><button class="tab ${tab === 'sell' ? 'on' : ''}" data-tab="sell">出售</button></div>
    <div class="shop">${rows.map((r, i) => `<div class="srow ${r.dim ? 'dim' : ''}"><div class="sinfo">${r.html}</div><div class="sp">${fmt(r.price)}两</div>${r.sell != null ? `<button class="btn small" data-i="${i}">出售</button>` : `<button class="btn small primary" data-i="${i}" ${S.gold < r.price ? 'disabled' : ''}>购买</button>${r.multi ? `<button class="btn small" data-i="${i}" data-n="5" ${S.gold < r.price * 5 ? 'disabled' : ''}>×5</button>` : ''}`}</div>`).join('') || '<div class="muted">没有可出售的物品</div>'}</div>
    <div class="gold">银两：<b>${fmt(S.gold)}</b>　背包 ${S.inv.length}/${BAG_SIZE}</div>`;
  b.querySelectorAll('.tab').forEach(x => x.onclick = () => shopPanel(title, cfg, x.dataset.tab));
  b.querySelectorAll('.srow button').forEach(x => x.onclick = () => {
    const r = rows[+x.dataset.i];
    if (r.sell != null) {
      const e = S.inv[r.sell];
      if (e.n > 1) e.n--; else S.inv.splice(r.sell, 1);
      S.gold += r.price; Audio2.sfx('coin');
    } else {
      const n = +(x.dataset.n || 1);
      if (S.gold < r.price * n) { toast('银两不足'); return; }
      if (!r.buy(n)) { toast('背包已满'); return; }
      S.gold -= r.price * n; Audio2.sfx('coin'); toast('购买成功');
    }
    shopPanel(title, cfg, tab); refreshHud(); save();
  });
}

// ---------------- 系统 ----------------
export function systemPanel() {
  const b = panel('系统', '', { id: 'sys', width: 460 });
  b.innerHTML = `<div class="sys">
    <button class="btn" id="s-save">保存游戏</button>
    <button class="btn" id="s-music">音乐：${Audio2.musicOn ? '开' : '关'}</button>
    <button class="btn" id="s-sfx">音效：${Audio2.sfxOn ? '开' : '关'}</button>
    <button class="btn" id="s-help">操作说明</button>
    <button class="btn danger" id="s-new">删除存档，重新开始</button></div>
    <div class="muted">游戏每次切换地图、战斗结束时自动保存到浏览器本地。</div>`;
  b.querySelector('#s-save').onclick = () => { save(); toast('已保存'); };
  b.querySelector('#s-music').onclick = () => { Audio2.toggleMusic(); systemPanel(); };
  b.querySelector('#s-sfx').onclick = () => { Audio2.toggleSfx(); systemPanel(); };
  b.querySelector('#s-help').onclick = () => helpPanel();
  b.querySelector('#s-new').onclick = async () => { if (await confirmBox('确定删除存档吗？所有进度将丢失！', '删除', '取消')) { wipe(); location.reload(); } };
}
export function helpPanel() {
  panel('操作说明', `<div class="help">
    <p><b>移动</b>：点击地面行走，或使用方向键。点击NPC自动走近并对话。蓝色传送圈通往其他地图。</p>
    <p><b>快捷键</b>：W 人物　E 道具　P 召唤兽　F 技能　Q 任务　T 队伍　Tab 地图　Esc 关闭/系统</p>
    <p><b>任务追踪</b>：点击右侧任务条目会自动寻路（可跨地图）。</p>
    <p><b>战斗</b>：先下人物指令，再下召唤兽指令，然后按速度顺序行动。快捷键 A攻击 W法术 E道具 D防御 G捕捉 S召唤 F逃跑，Q切换自动。右键/Esc 取消选择。</p>
    <p><b>成长</b>：5级拜师，师父处学技能；长安侠义堂招募伙伴；师门、抓鬼、宝图是主要的经验和银两来源。</p>
    <p><b>回复</b>：非战斗状态会缓慢回复气血魔法；客栈可以立即回满；宠物仙子免费治疗召唤兽。</p></div>`, { id: 'help', width: 600 });
}
