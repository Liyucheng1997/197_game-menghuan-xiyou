// 启动：标题、创建角色、主循环、输入
import { ROLES, RACES, SCHOOLS } from './data.js';
import { G, newGame, load, hasSave, save, stats, onSave } from './state.js';
import { Cloud } from './cloud.js';
import { petStats } from './stats.js';
import { drawChibi } from './art.js';
import { updateTweens, esc, pick } from './util.js';
import { $, toast, log, UI, closePanel, dialog } from './ui.js';
import { Audio2 } from './audio.js';
import * as World from './world.js';
import * as Battle from './battle.js';
import * as Game from './game.js';
import * as P from './panels.js';

const VW = 960, VH = 640;
const cv = $('#cv');
const ctx = cv.getContext('2d');

function fit() {
  const s = Math.min(window.innerWidth / VW, window.innerHeight / VH);
  const st = $('#stage');
  st.style.transform = `scale(${s})`;
  st.style.left = Math.max(0, (window.innerWidth - VW * s) / 2) + 'px';
  st.style.top = Math.max(0, (window.innerHeight - VH * s) / 2) + 'px';
}
window.addEventListener('resize', fit);
fit();

// ---------------- 标题画面 ----------------
const title = { t: 0, clouds: Array.from({ length: 7 }, (_, i) => ({ x: Math.random() * VW, y: 40 + Math.random() * 200, s: 40 + Math.random() * 60, v: 6 + Math.random() * 10 })) };
function drawTitleBg(dt) {
  title.t += dt / 1000;
  const t = title.t;
  const g = ctx.createLinearGradient(0, 0, 0, VH);
  g.addColorStop(0, '#7ec8f0'); g.addColorStop(0.55, '#fbe3b8'); g.addColorStop(1, '#f6c98a');
  ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
  // 太阳
  const sg = ctx.createRadialGradient(760, 150, 10, 760, 150, 130); sg.addColorStop(0, 'rgba(255,250,210,1)'); sg.addColorStop(1, 'rgba(255,240,180,0)');
  ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(760, 150, 130, 0, 7); ctx.fill();
  // 云
  for (const c of title.clouds) {
    c.x += c.v * dt / 1000; if (c.x > VW + 120) c.x = -120;
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    for (const [dx, dy, r] of [[0, 0, 1], [0.7, 0.1, 0.8], [-0.7, 0.15, 0.7], [0.3, -0.35, 0.7]]) { ctx.beginPath(); ctx.ellipse(c.x + dx * c.s, c.y + dy * c.s, c.s * r, c.s * r * 0.55, 0, 0, 7); ctx.fill(); }
  }
  // 远山
  const hills = [['#9cc7a8', 380, 0.5, 60], ['#7fb58a', 430, 0.8, 50], ['#6aa874', 480, 1.1, 40]];
  for (const [col, base, f, amp] of hills) {
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, VH);
    for (let x = 0; x <= VW; x += 20) ctx.lineTo(x, base - Math.sin(x * 0.006 * f + f) * amp - Math.sin(x * 0.017 + f * 3) * amp * 0.3);
    ctx.lineTo(VW, VH); ctx.fill();
  }
  // 宝塔
  ctx.fillStyle = 'rgba(90,110,100,.55)';
  for (let i = 0; i < 6; i++) { const w = 46 - i * 6, y = 360 - i * 26; ctx.fillRect(150 - w / 2, y, w, 20); ctx.beginPath(); ctx.moveTo(150 - w / 2 - 10, y); ctx.lineTo(150 + w / 2 + 10, y); ctx.lineTo(150, y - 10); ctx.fill(); }
  // 草地
  ctx.fillStyle = '#86c85a'; ctx.beginPath(); ctx.moveTo(0, VH); ctx.lineTo(0, 540); ctx.quadraticCurveTo(480, 480, VW, 540); ctx.lineTo(VW, VH); ctx.fill();
  // 角色
  const roles = Object.values(ROLES);
  roles.forEach((r, i) => {
    const x = 120 + i * 103, y = 580 + Math.sin(i) * 6;
    drawChibi(ctx, x, y, r.look, { dir: 'down', t: t + i * 0.7, scale: 1.45, weapon: r.weapon });
  });
  // 花瓣
  for (let i = 0; i < 24; i++) {
    const x = (i * 97 + t * (30 + i % 5 * 8)) % (VW + 40) - 20, y = (i * 53 + t * (25 + i % 7 * 5)) % (VH + 40) - 20;
    ctx.save(); ctx.translate(x, y); ctx.rotate(t + i); ctx.fillStyle = 'rgba(255,160,200,.8)'; ctx.beginPath(); ctx.ellipse(0, 0, 4, 2.4, 0, 0, 7); ctx.fill(); ctx.restore();
  }
}

function showTitle() {
  Game.R.scene = 'title';
  const scr = $('#scr-title');
  scr.innerHTML = `<div class="logo"><img src="assets/ui/logo.png" alt="梦幻西游"><div class="logo-q">Q版 · 单机重制</div></div>
    <div class="t-account" id="t-account"></div>
    <div class="t-btns"><button class="btn big primary" id="t-new">开始新游戏</button>${hasSave() ? '<button class="btn big" id="t-cont">继续游戏</button>' : ''}<button class="btn big" id="t-help">操作说明</button></div>
    <div class="t-foot">音乐为梦幻西游官网原声 · 美术为程序绘制的Q版风格 · ${Cloud.mode === 'offline' ? '进度保存在浏览器本地' : '进度保存在云端账号'}</div>`;
  scr.classList.remove('hidden');
  Cloud.mount($('#t-account'));
  // 有服务端时必须先登录；没有服务端（如 GitHub Pages）则直接以离线模式游玩
  if (Cloud.mode === 'guest' || Cloud.mode === 'connecting') scr.querySelector('.t-btns').style.display = 'none';
  $('#t-new').onclick = () => { Audio2.unlock(); Audio2.play('title'); showCreate(); };
  $('#t-cont') && ($('#t-cont').onclick = () => { Audio2.unlock(); if (load()) startGame(); else toast('存档损坏，请重新开始'); });
  $('#t-help').onclick = () => { Audio2.unlock(); Audio2.play('title'); P.helpPanel(); };
}

// ---------------- 创建角色 ----------------
const SURNAMES = ['李', '王', '张', '刘', '陈', '杨', '赵', '周', '吴', '慕容', '上官', '欧阳', '司马', '令狐', '独孤', '云', '风', '叶', '林', '萧'];
const GIVEN = ['逍遥', '无忌', '青云', '凌霄', '飞雪', '若水', '星河', '子墨', '清风', '明月', '长歌', '紫萱', '灵儿', '晓晓', '天行', '寒烟', '剑心', '小白', '琉璃', '千寻'];
function showCreate() {
  $('#scr-title').classList.add('hidden');
  const scr = $('#scr-create');
  let sel = 'jxk';
  const render = () => {
    const r = ROLES[sel];
    const schools = Object.values(SCHOOLS).filter(s => s.race === r.race).map(s => `<span class="sch" title="${s.desc}">${s.name}</span>`).join('');
    scr.innerHTML = `<div class="cr-title">选择你的角色</div>
      <div class="cr-roles">${Object.entries(ROLES).map(([id, x]) => `<div class="cr-card ${id === sel ? 'sel' : ''}" data-r="${id}"><canvas width="90" height="110"></canvas><b>${x.name}</b><small>${RACES[x.race].name}</small></div>`).join('')}</div>
      <div class="cr-info"><canvas id="cr-big" width="220" height="220"></canvas><div class="cr-desc"><div class="cr-name">${r.name} <small>${RACES[r.race].name} · ${r.gender === 'm' ? '男' : '女'}</small></div><p>${r.desc}</p><div class="muted">可拜门派：</div><div class="schs">${schools}</div>
        <div class="cr-form"><input class="inp" id="cr-inp" maxlength="8" placeholder="输入角色名"><button class="btn" id="cr-rand">🎲</button></div>
        <div class="row-btns"><button class="btn big primary" id="cr-go">踏入江湖</button><button class="btn" id="cr-back">返回</button></div></div></div>`;
    scr.querySelectorAll('.cr-card').forEach(c => {
      const id = c.dataset.r, cc = c.querySelector('canvas').getContext('2d');
      drawChibi(cc, 45, 100, ROLES[id].look, { dir: 'down', scale: 1.5, weapon: ROLES[id].weapon });
      c.onclick = () => { const n = $('#cr-inp').value; sel = id; Audio2.sfx('click'); render(); $('#cr-inp').value = n; };
    });
    const inp = $('#cr-inp');
    if (!inp.value) inp.value = pick(SURNAMES) + pick(GIVEN);
    $('#cr-rand').onclick = () => { inp.value = pick(SURNAMES) + pick(GIVEN); };
    $('#cr-back').onclick = () => { scr.classList.add('hidden'); showTitle(); };
    $('#cr-go').onclick = () => {
      const name = inp.value.trim().slice(0, 8);
      if (!name) { toast('请输入角色名'); return; }
      newGame(sel, name);
      save();
      scr.classList.add('hidden');
      startGame(true);
    };
  };
  scr.classList.remove('hidden');
  render();
  createAnim = () => {
    const c = $('#cr-big'); if (!c) return;
    const g = c.getContext('2d');
    g.clearRect(0, 0, 220, 220);
    const bg = g.createRadialGradient(110, 150, 10, 110, 150, 110); bg.addColorStop(0, 'rgba(255,240,200,.9)'); bg.addColorStop(1, 'rgba(255,240,200,0)');
    g.fillStyle = bg; g.fillRect(0, 0, 220, 220);
    const dirs = ['down', 'left', 'up', 'right'];
    const d = dirs[Math.floor(title.t / 1.6) % 4];
    drawChibi(g, 110, 200, ROLES[sel].look, { dir: d, t: title.t, moving: true, scale: 3.2, weapon: ROLES[sel].weapon });
  };
}
let createAnim = null;

// ---------------- 进入游戏 ----------------
function startGame(fresh) {
  $('#scr-title').classList.add('hidden');
  $('#scr-create').classList.add('hidden');
  createAnim = null;
  Game.R.scene = 'world';
  P.buildHud();
  $('#hud').classList.remove('hidden');
  const S = G.S;
  World.enterMap(S.map, S.x, S.y);
  P.refreshHud();
  if (fresh) {
    log(`欢迎来到梦幻西游，${esc(S.name)}！`, '#ffd23a');
    log('点击头顶有 <b style="color:#ffd23a">!</b> 的NPC领取任务。右侧任务栏可自动寻路。', '#fff6d8');
    setTimeout(() => dialog({ look: ROLES[S.role].look, name: S.name, pages: ['这里就是建邺城了……听说城里的<b>老孙头</b>专门指点初入江湖的新人，先去找他看看吧！<br><i>（点击右侧任务栏「找老孙头」即可自动寻路）</i>'] }), 700);
  } else log(`欢迎回来，${esc(S.name)}！`, '#ffd23a');
}

// ---------------- 主循环 ----------------
let last = performance.now(), hudTimer = 0, regenTimer = 0, saveTimer = 0;
function loop(now) {
  const dt = Math.min(50, now - last);
  last = now;
  updateTweens(dt);
  const scene = Game.R.scene;
  if (scene === 'title') { drawTitleBg(dt); createAnim?.(); }
  else if (scene === 'world') {
    World.update(dt);
    World.render(ctx);
    hudTimer += dt; regenTimer += dt; saveTimer += dt;
    if (hudTimer > 250) { hudTimer = 0; P.refreshHud(); }
    if (regenTimer > 3000) { regenTimer = 0; regen(); }
    if (saveTimer > 30000) { saveTimer = 0; G.S.playTime += 30; save(); }
  } else if (scene === 'battle') { Battle.update(dt); Battle.render(ctx); }
  requestAnimationFrame(loop);
}
function regen() {
  const S = G.S; if (!S) return;
  const st = stats();
  S.hp = Math.min(st.maxHp, S.hp + Math.ceil(st.maxHp * 0.03));
  S.mp = Math.min(st.maxMp, S.mp + Math.ceil(st.maxMp * 0.03));
  for (const p of S.pets) { const ps = petStats(p); p.hp = Math.min(ps.maxHp, p.hp + Math.ceil(ps.maxHp * 0.03)); p.mp = Math.min(ps.maxMp, p.mp + Math.ceil(ps.maxMp * 0.03)); }
}

// ---------------- 输入 ----------------
function stagePos(e) {
  const r = cv.getBoundingClientRect();
  return [(e.clientX - r.left) / r.width * VW, (e.clientY - r.top) / r.height * VH];
}
cv.addEventListener('pointerdown', e => {
  Audio2.unlock();
  const [x, y] = stagePos(e);
  if (e.button === 2) { if (Game.R.scene === 'battle') Battle.cancel(); return; }
  if (Game.R.scene === 'world' && !UI.dialogOpen) World.click(x, y);
  else if (Game.R.scene === 'battle') Battle.click(x, y);
});
cv.addEventListener('pointermove', e => { if (Game.R.scene === 'world') { const [x, y] = stagePos(e); World.hover(x, y); } });
document.addEventListener('contextmenu', e => e.preventDefault());
$('#battle-ui').addEventListener('pointerdown', e => { if (Game.R.scene === 'battle' && Battle.BT.phase === 'result') Battle.click(0, 0); });

const ARROWS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  const scene = Game.R.scene;
  if (e.key === 'Escape') {
    if (!$('#confirm').classList.contains('hidden')) return;
    if (scene === 'battle') { Battle.cancel(); return; }
    if (UI.panelOpen) { closePanel(); return; }
    if (UI.dialogOpen) { UI.closeDialog?.(); return; }
    if (scene === 'world') P.openPanel('sys');
    return;
  }
  if (scene === 'battle') { Battle.key(e.key); if (e.key === 'Tab') e.preventDefault(); return; }
  if (scene !== 'world') return;
  if (ARROWS[e.key]) { World.keyMove(ARROWS[e.key]); e.preventDefault(); return; }
  if (UI.dialogOpen) return;
  const k = e.key.toLowerCase();
  const map = { w: 'char', e: 'bag', p: 'pet', f: 'skill', q: 'quest', t: 'team', tab: 'map', m: 'map' };
  if (map[k]) { e.preventDefault(); P.openPanel(map[k]); }
});
document.addEventListener('keyup', e => { if (ARROWS[e.key] && World.W.keyDir === ARROWS[e.key]) World.keyMove(null); });
window.addEventListener('beforeunload', () => { if (G.S && Game.R.scene !== 'title') save(); });

// ---------------- 启动 ----------------
Audio2.load();
onSave(S => Cloud.push(S));
showTitle();
Cloud.boot({
  onChange: () => { if (Game.R.scene === 'title' && !$('#scr-title').classList.contains('hidden')) showTitle(); },
  notify: msg => { if (Game.R.scene !== 'title') toast(msg); },
});
requestAnimationFrame(loop);
window.__game = { G, Game, World, Battle, P };
