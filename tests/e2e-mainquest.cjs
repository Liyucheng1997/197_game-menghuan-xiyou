// 浏览器端到端测试：自动打通全部主线任务并检查页面报错。
// 需要 Playwright：npm i -D playwright（或全局安装）。运行：node tests/e2e-mainquest.cjs
const http = require('http'), fs = require('fs'), path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
const root = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.mp3': 'audio/mpeg', '.jpg': 'image/jpeg' };
const server = http.createServer((req, res) => {
  const f = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/^\/$/, '/index.html'));
  if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
server.listen(0, async () => {
  const url = `http://localhost:${server.address().port}/index.html`;
  const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const p = await b.newPage({ viewport: { width: 960, height: 640 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e.stack || e)));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const fail = (msg) => { console.error('FAIL:', msg); console.error(errs.join('\n')); process.exit(1); };
  try {
    await p.goto(url);
    await p.evaluate(() => localStorage.clear());
    await p.reload();
    await p.waitForTimeout(300);
    await p.click('#t-new'); await p.click('.cr-card[data-r="hmr"]'); await p.click('#cr-go');
    await p.waitForTimeout(900);
    const clickAll = async () => { for (let i = 0; i < 10; i++) { const o = await p.$('#dialog:not(.hidden) .opt'); if (!o) break; const prim = await p.$('#dialog .opt.primary'); await (prim || o).click(); await p.waitForTimeout(60); } };
    await clickAll();
    const state = () => p.evaluate(() => { const S = window.__game.G.S; return { step: S.quests.main.step, state: S.quests.main.state, lv: S.level, school: S.school }; });
    const boost = lv => p.evaluate(async lv => { const st = await import('./src/state.js'); const { expNeed } = await import('./src/data.js'); const S = st.G.S; let e = 0; for (let l = S.level; l < lv; l++) e += expNeed(l); st.gainExp(e); st.fullHeal(); }, lv);
    const talk = id => p.evaluate(async id => { const { npcMap } = await import('./src/game.js'); const W = window.__game.World; const m = npcMap(id); if (W.W.map.id !== m) W.enterMap(m); await new Promise(r => setTimeout(r, 30)); window.__game.Game.interact(W.allNpcs().find(x => x.id === id)); }, id);
    const win = async () => { for (let i = 0; i < 400; i++) { await p.waitForTimeout(100); if (await p.evaluate(() => window.__game.Game.R.scene) === 'world') return; await p.evaluate(() => { const B = window.__game.Battle.BT.B; if (B) for (const u of B.units) if (u.side === 'enemy') u.hp = Math.min(u.hp, 1); }); const a = await p.$('#bt-auto:not(.on)'); if (a) await a.click(); if (await p.$('#bt-result:not(.hidden)')) await p.mouse.click(480, 320); } fail('战斗未结束'); };
    for (let guard = 0; guard < 80; guard++) {
      const s = await state();
      const st = await p.evaluate(async () => { const { MAIN } = await import('./src/game.js'); return MAIN[window.__game.G.S.quests.main.step] || null; });
      if (!st) break;
      if (s.lv < st.lv + 8) await boost(Math.min(69, st.lv + 12));
      const who = k => (k === 'master' ? 'master_' + s.school : k);
      if (s.state === 'accept') { await talk(who(st.giver)); await p.waitForTimeout(100); await clickAll(); }
      else if (s.state === 'turnin') { await talk(who(st.turnin)); await p.waitForTimeout(100); await clickAll(); }
      else {
        const g = st.goal;
        if (g.type === 'kill') for (let k = 0; k < g.n; k++) { await p.evaluate(async g => { window.__game.World.enterMap(g.map); const { enemyUnit } = await import('./src/enemies.js'); window.__game.Game.fight([enemyUnit(g.mid, 5)], {}); }, g); await win(); }
        if (g.type === 'catch') await p.evaluate(async () => { const st = await import('./src/state.js'); st.addPet(st.makePet('dahaigui', 3)); (await import('./src/game.js')).checkMainGoal(); });
        if (g.type === 'talk') { await talk(g.npc); await p.waitForTimeout(100); await clickAll(); }
        if (g.type === 'join') { await talk('yizhan'); await p.waitForTimeout(100); await p.click('#dialog .opt'); await p.waitForTimeout(600); const m = await p.evaluate(() => window.__game.G.S.map); await talk('master_' + m.slice(2)); await p.waitForTimeout(100); await p.click('#dialog .opt.primary'); await p.waitForTimeout(200); await clickAll(); }
        if (g.type === 'boss') { await p.evaluate(async g => { window.__game.World.enterMap(g.map); await new Promise(r => setTimeout(r, 30)); window.__game.World.allNpcs().find(x => x.id === 'boss_' + g.boss).onTalk(); }, g); await p.waitForTimeout(150); await p.click('#confirm .btn.primary'); await win(); await p.waitForTimeout(200); await clickAll(); }
      }
      await p.waitForTimeout(100);
    }
    const final = await state();
    const total = await p.evaluate(async () => (await import('./src/game.js')).MAIN.length);
    if (final.step !== total) fail(`主线未完成：停在第 ${final.step} 步`);
    if (errs.length) fail('页面报错');
    console.log(`OK：主线 ${total} 步全部完成，最终等级 ${final.lv}，门派 ${final.school}`);
  } catch (e) { fail(e.stack || e); }
  await b.close();
  server.close();
});
