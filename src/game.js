// 游戏规则：NPC 交互、任务、遇敌、奖励
import { ROLES, SCHOOLS, SKILLS, ITEMS, MONSTERS, PARTNERS, GHOST_NAMES, GHOST_PREFIX, expNeed, monsterExp, tierForLevel, DRUG_SHOP, GROCERY_SHOP, HIGH_DRUG_SHOP, PET_MAX, PET_TRAIT_POOL, PET_RARE_POOL, PET_HIGH_POOL, MAX_LEVEL } from './data.js';
import { G, save, gainExp, petGainExp, addItem, removeItem, countItem, addEquip, randomDrop, makeEquip, makePet, addPet, recruit, allyUnits, syncFromBattle, activePet, fullHeal, stats, bagFree, levelCap } from './state.js';
import { STORY2, BOSS_FIGHTS2 } from './story2.js';
import * as Act from './activity.js';
import * as Mall from './mall.js';
import { enemyUnit, layoutEnemies } from './enemies.js';
import { getMap, MAP_IDS, MAP_NAMES, WORLD_ORDER, randomWalkable } from './maps.js';
import { NPCS } from './npcs.js';
import { petStats } from './stats.js';
import { W, enterMap, navigate, transition, snapshot } from './world.js';
import { BT, startBattle } from './battle.js';
import { dialog, toast, log, banner, confirmBox } from './ui.js';
import * as P from './panels.js';
import { randi, pick, clamp, esc, fmt, chance } from './util.js';
import { Audio2 } from './audio.js';

export const R = { scene: 'title' };

// ---------------- 主线任务 ----------------
export const MAIN = [
  { title: '初入江湖', giver: 'laosun', lv: 1,
    accept: ['少侠初来建邺，老夫看你骨骼清奇，是块练武的好材料！', '从城东出口可以到东海湾，那里的<b>大海龟</b>皮糙肉厚，正好拿来练手。去消灭<b>3只大海龟</b>吧！', '<i>提示：点击地面移动，点击NPC对话。在野外行走会随机遇到怪物。右侧任务栏可以点击自动寻路。</i>'],
    goal: { type: 'kill', mid: 'dahaigui', n: 3, map: 'donghai' }, turnin: 'laosun',
    done: ['好！果然后生可畏。这顶帽子和些许盘缠你拿着。'], reward: { expF: 1.2, gold: 300, items: [['baozi', 5]], equip: { slot: 'helm', tier: 0 } } },
  { title: '收服召唤兽', giver: 'laosun', lv: 1,
    accept: ['行走江湖，怎能没有召唤兽相伴？', '在战斗中选择<b>「捕捉」</b>，把野怪打到残血再捉更容易成功（消耗20点魔法）。', '捉到的召唤兽会自动参战，也可以在召唤兽界面（P）调整。去东海湾<b>捉一只召唤兽</b>吧！'],
    goal: { type: 'catch', n: 1, map: 'donghai' }, turnin: 'laosun',
    done: ['不错不错，好好培养它，它会成为你最忠实的伙伴。'], reward: { expF: 1, gold: 200, items: [['zhenlu', 3]] } },
  { title: '渔夫的烦恼', giver: 'wangdasao', lv: 2,
    accept: ['少侠留步！我家那口子在东海湾打渔，好几天都没回家了……', '能帮我去海边看看他吗？'],
    goal: { type: 'talk', npc: 'yufu' },
    done: ['唉，别提了！几只<b>巨蛙</b>把我的渔网全扯烂了，我哪还有脸回家……'], reward: { expF: 0.4, gold: 100 } },
  { title: '清理巨蛙', giver: 'yufu', auto: true, lv: 2,
    accept: ['少侠若能帮我赶走<b>4只巨蛙</b>，我就能重新出海了！'],
    goal: { type: 'kill', mid: 'juwa', n: 4, map: 'donghai' }, turnin: 'yufu',
    done: ['多谢少侠！这些银两你收下。', '我有位远房亲戚叫<b>无双</b>，是化生寺的俗家弟子，医术高明，正想找人结伴闯荡。就让她跟着你吧！', '对了，建邺城的<b>李善人</b>好像在找能人异士，你去看看吧。'],
    reward: { expF: 1.2, gold: 400, items: [['kaoya', 2]], partner: 'wushuang' } },
  { title: '沉船冤魂', giver: 'lishanren', lv: 5,
    accept: ['东海湾的沉船里夜夜传来哭声，据说是一位遇难商人的鬼魂在作祟……', '少侠若能超度他，老夫必有重谢！<br><i>建议等级7以上，记得带上伙伴和召唤兽。沉船入口在东海湾南边的破船旁。</i>'],
    goal: { type: 'boss', boss: 'shangren', map: 'chenchuan', x: 32, y: 6 }, turnin: 'lishanren',
    done: ['真是太好了！商人的亡魂终于可以安息了。', '这是老夫的一点心意。少侠前途无量，去找<b>牛大胆</b>聊聊吧，他知道怎么去长安城。'],
    reward: { expF: 2, gold: 1500, items: [['jinchuang', 1]], equip: { slot: 'boots', tier: 0, rarity: 1 } } },
  { title: '拜师学艺', giver: 'niudadan', lv: 5,
    accept: ['嘿！听说你把沉船的鬼都收拾了？俺牛大胆佩服！', '要想变得更强，就得拜入门派。从建邺城西门出去，穿过江南野外就是<b>长安城</b>，找<b>驿站老板</b>就能前往各大门派拜师。', '<i>每个种族只能拜入本族的门派。拜师后可以学习门派技能、领取师门任务。</i>'],
    goal: { type: 'join' }, turnin: 'master',
    done: ['好徒儿，从今日起你便是本门弟子！先传你本门功夫，日后勤加修炼。', '每次来为师这里都可领取<b>师门任务</b>，完成后可获得大量经验和银两。技能可以在为师这里花银两学习。', '钦天监<b>袁天罡</b>近日夜观天象，说妖气渐盛，你去长安城观星台拜见他吧。'],
    reward: { expF: 1.5, gold: 1000, skills: 3 } },
  { title: '拜见袁天罡', giver: 'master', auto: true, lv: 5,
    accept: ['去长安城观星台拜见袁天罡。'],
    goal: { type: 'talk', npc: 'yuantiangang' },
    done: ['你就是那位新晋的少侠？好！大唐国境最近有山贼作乱，正需要你这样的人才。', '<i>长安城侠义堂可以招募更多伙伴，队伍越强，降妖越轻松。</i>'], reward: { expF: 0.6, gold: 300 } },
  { title: '国境山贼', giver: 'yuantiangang', auto: true, lv: 12,
    accept: ['出长安城西门就是大唐国境。山贼在那里拦路抢劫，扰得百姓不得安宁。', '先去消灭<b>5个山贼</b>，挫挫他们的锐气！'],
    goal: { type: 'kill', mid: 'shanzei', n: 5, map: 'guojing' }, turnin: 'yuantiangang',
    done: ['干得好！不过，山贼头子还在北边营地里逍遥。'], reward: { expF: 1.5, gold: 1200 } },
  { title: '擒贼擒王', giver: 'yuantiangang', lv: 15,
    accept: ['山贼头子盘踞在大唐国境北面的营地，力大无穷，惯用<b>横扫千军</b>。', '务必做好准备再去！<br><i>建议等级17以上，多带些药品。</i>'],
    goal: { type: 'boss', boss: 'shanzeitou', map: 'guojing', x: 26, y: 12 }, turnin: 'yuantiangang',
    done: ['山贼已平，国境安宁！', '我手下校尉<b>秦川</b>武艺不凡，今后就让他随你闯荡江湖！'],
    reward: { expF: 2.5, gold: 3000, partner: 'qinchuan', items: [['jinchuang', 3]] } },
  { title: '境外妖风', giver: 'yuantiangang', lv: 20,
    accept: ['我夜观天象，大唐境外妖气冲天。境外的<b>土地公公</b>或许知道些什么，你去问问他。'],
    goal: { type: 'talk', npc: 'tudi' },
    done: ['少侠来得正好！最近境外刮起一阵妖风，卷走了好几个过路的行人……'], reward: { expF: 0.6, gold: 500 } },
  { title: '除妖风', giver: 'tudi', auto: true, lv: 22,
    accept: ['<b>妖风</b>就藏在西北的沙地里（坐标30,14），会飞砂走石，法术十分厉害。', '<i>建议等级26以上，封印类和治疗类伙伴会很有帮助。</i>'],
    goal: { type: 'boss', boss: 'yaofeng', map: 'jingwai', x: 30, y: 14 }, turnin: 'tudi',
    done: ['妖风已除！可是……老朽发现妖风只是个喽啰，真正的幕后黑手是<b>白骨洞</b>里的<b>白骨精</b>！'],
    reward: { expF: 2.5, gold: 5000, equip: { slot: 'neck', tier: 2, rarity: 2 } } },
  { title: '白骨洞前', giver: 'tudi', lv: 28,
    accept: ['白骨精手下的<b>骷髅怪</b>在境外游荡，先消灭<b>6只骷髅怪</b>，削弱她的势力。'],
    goal: { type: 'kill', mid: 'kulou', n: 6, map: 'jingwai' }, turnin: 'tudi',
    done: ['很好！白骨洞就在境外西北角。白骨精狡猾多变，常化作村姑、老妇迷惑人心，千万小心！'], reward: { expF: 1.5, gold: 3000 } },
  { title: '一打白骨精', giver: 'tudi', lv: 30,
    accept: ['进入白骨洞，找到化作<b>村姑</b>的白骨精。<br><i>建议等级32以上，组满伙伴。</i>'],
    goal: { type: 'boss', boss: 'cungu', map: 'baigu', x: 12, y: 23 },
    done: ['（村姑化作一缕青烟，逃向洞穴东侧……）'], reward: { expF: 1.5, gold: 2000 } },
  { title: '二打白骨精', giver: null, auto: true, lv: 30,
    accept: ['白骨精又化作<b>老妇</b>，就在洞穴东侧！'],
    goal: { type: 'boss', boss: 'laofu', map: 'baigu', x: 40, y: 21 },
    done: ['（老妇也化作一缕青烟，逃向洞穴最深处……）'], reward: { expF: 1.5, gold: 2500 } },
  { title: '三打白骨精', giver: null, auto: true, lv: 30,
    accept: ['白骨精现出了原形，就在洞穴最深处！这是最后的决战！<br><i>建议等级36以上。</i>'],
    goal: { type: 'boss', boss: 'baigujing', map: 'baigu', x: 26, y: 6 }, turnin: 'tudi',
    done: ['三打白骨精，少侠威名将传遍三界！', '老朽这里有一只<b>小白龙</b>，它仰慕少侠已久，愿追随左右。', '<i>第一部完结！花果山的<b>通臂猿猴</b>似乎有急事找你，40级后去看看吧。</i>'],
    reward: { expF: 4, gold: 20000, pet: 'xiaobailong', title: '降妖除魔' } },
  ...STORY2,
];

const BOSS_FIGHTS = {
  shangren: () => [enemyUnit('shangren', 9), enemyUnit('yegui', 7), enemyUnit('yegui', 7)],
  shanzeitou: () => [enemyUnit('shanzeitou', 18), enemyUnit('shanzei', 16), enemyUnit('shanzei', 16)],
  yaofeng: () => [enemyUnit('yaofeng', 29), enemyUnit('hulijing', 27), enemyUnit('hulijing', 27), enemyUnit('niuyao', 27), enemyUnit('yangtou', 27)],
  cungu: () => [enemyUnit('cungu', 38), enemyUnit('jiangshi', 36), enemyUnit('zhizhu', 36), enemyUnit('yuanhun', 36)],
  laofu: () => [enemyUnit('laofu', 39), enemyUnit('jiangshi', 37), enemyUnit('jiangshi', 37), enemyUnit('kulou', 37), enemyUnit('zhizhu', 37)],
  baigujing: () => [enemyUnit('baigujing', 42), enemyUnit('jiangshi', 38), enemyUnit('jiangshi', 38), enemyUnit('yuanhun', 38), enemyUnit('zhizhu', 38), enemyUnit('kulou', 38)],
};
for (const [boss, list] of Object.entries(BOSS_FIGHTS2)) BOSS_FIGHTS[boss] = () => list.map(([mid, lv]) => enemyUnit(mid, lv));

// NPC 所在地图索引
let npcIndex = null;
export function npcMap(id) {
  if (!npcIndex) {
    npcIndex = {};
    for (const m of [...MAP_IDS, ...Object.keys(SCHOOLS).map(s => 's_' + s)]) for (const n of getMap(m).npcs) npcIndex[n.id] = m;
  }
  return npcIndex[id];
}
const resolveNpc = id => (id === 'master' ? (G.S.school ? 'master_' + G.S.school : null) : id);
const npcName = id => { const r = resolveNpc(id); return r ? NPCS[r].name : '师父'; };
const mq = () => G.S.quests.main;
export const mainStep = () => MAIN[mq().step];

function setMainState(state) {
  const q = mq();
  q.state = state;
  if (state === 'active') { q.progress = 0; checkMainGoal(); }
}
export function checkMainGoal() {
  const q = mq(), st = mainStep();
  if (!st || q.state !== 'active') return;
  const g = st.goal;
  let ok = false;
  if (g.type === 'kill') ok = q.progress >= g.n;
  if (g.type === 'catch') ok = G.S.pets.length >= g.n && q.progress >= 0 && (q.progress >= g.n || G.S.pets.length >= g.n);
  if (g.type === 'join') ok = !!G.S.school;
  if (ok) {
    q.state = 'turnin';
    Audio2.sfx('quest');
    toast(`任务目标完成：回复 <b>${npcName(st.turnin)}</b>`);
    log(`【主线】${st.title} 目标完成，回复${npcName(st.turnin)}`, '#ffd23a');
  }
}
async function completeMain(extraPagesBefore = []) {
  const st = mainStep();
  const pages = [...extraPagesBefore, ...st.done];
  const rw = await giveReward(st.reward, st.title);
  const q = mq();
  q.step++; q.progress = 0;
  const next = MAIN[q.step];
  q.state = 'accept';
  Audio2.sfx('quest');
  banner('任务完成', st.title);
  if (next && next.auto && G.S.level >= next.lv) {
    q.state = 'active';
    pages.push(...next.accept.map(p => `<span class="q-new">【新任务·${next.title}】</span>${p}`));
    q.progress = 0;
  }
  save();
  return { pages, rw };
}

export async function giveReward(r, source) {
  const S = G.S;
  const out = [];
  if (r.expF) { const e = grantExp(Math.floor(expNeed(S.level) * r.expF)).gained; out.push(`经验 +${fmt(e)}`); }
  if (r.gold) { S.gold += r.gold; out.push(`银两 +${fmt(r.gold)}`); Audio2.sfx('coin'); }
  if (r.jade) { Mall.addJade(r.jade); out.push(`<span style="color:#ff7ad8">仙玉 +${r.jade}</span>`); }
  for (const [id, n] of r.items || []) { addItem(id, n); out.push(`${ITEMS[id].name} ×${n}`); }
  if (r.equip) { const eq = makeEquip(r.equip.slot, r.equip.tier, ROLES[S.role].weapon, r.equip.rarity || 0); if (addEquip(eq)) out.push(eq.name); }
  if (r.partner && recruit(r.partner)) { out.push(`伙伴「${PARTNERS[r.partner].name}」加入队伍`); banner('新伙伴加入', PARTNERS[r.partner].name + ' · ' + SCHOOLS[PARTNERS[r.partner].school].name); }
  if (r.pet) { const p = makePet(r.pet, Math.max(1, S.level), true); if (!p.shenshou) p.growth = 1.26; if (addPet(p)) out.push(`召唤兽「${p.name}」`); else { out.push(`召唤兽已满，${p.name}在长安城等你领取`); S.flags.pendingPet = r.pet; } }
  if (r.skills && S.school) { for (const id of [...SCHOOLS[S.school].skills, SCHOOLS[S.school].passive]) S.skills[id] = Math.max(S.skills[id] || 0, r.skills); out.push(`门派技能提升至${r.skills}级`); }
  if (r.title) { S.title = r.title; out.push(`称号「${r.title}」`); }
  log(`【${source}】获得：${out.join('，')}`, '#ffd23a');
  P.refreshHud();
  return out;
}

// 经验加成：双倍经验丹、VIP
export function expMul() { return (G.S.doubleMs > 0 ? 2 : 1) * (1 + Mall.vipPerk('exp')); }
let capToastAt = 0;
export function grantExp(e) {
  const before = G.S.level;
  e = Math.floor(e * expMul());
  const r = gainExp(e);
  r.gained = e;
  if (r.capped && e > 0 && performance.now() - capToastAt > 60000) {
    capToastAt = performance.now();
    toast(`已到达<b>${levelCap()}级</b>瓶颈，经验会先储存起来。<br>去长安城找<b>太白金星</b>渡劫突破吧！`, 3200);
  }
  if (r.levels) {
    Audio2.sfx('levelup');
    banner(`升级！等级 ${G.S.level}`, '气血魔法已回满');
    log(`恭喜你升到了 ${G.S.level} 级！`, '#7dff7a');
    const q = mq(), st = mainStep();
    if (st && q.state === 'accept' && before < st.lv && G.S.level >= st.lv) toast(`新的主线任务：<b>${st.title}</b>`);
    Mall.checkRedDot();
  }
  return r;
}

// ---------------- 动态 NPC（任务目标） ----------------
export function dynNpcs(mapId) {
  const S = G.S, out = [];
  if (!S) return out;
  const st = mainStep(), q = mq();
  if (st && q.state === 'active' && st.goal.type === 'boss' && st.goal.map === mapId) {
    const m = MONSTERS[st.goal.boss];
    out.push({ id: 'boss_' + st.goal.boss, name: m.name, title: '主线首领', look: m.look, x: st.goal.x, y: st.goal.y, scale: 1.25, onTalk: () => fightMainBoss(st) });
  }
  const gq = S.quests.ghost;
  if (gq && gq.map === mapId) out.push({ id: 'ghost', name: gq.name, title: '抓鬼目标', look: MONSTERS[gq.mid].look, x: gq.x, y: gq.y, onTalk: fightGhost });
  const tq = S.quests.treasure;
  if (tq && tq.map === mapId) out.push({ id: 'bandit', name: '强盗头目', title: '宝图任务', look: MONSTERS[S.level >= 12 ? 'shanzei' : 'qiangdao'].look, x: tq.x, y: tq.y, onTalk: fightBandit });
  const sq = S.quests.school;
  if (sq && sq.type === 'fight' && sq.map === mapId) out.push({ id: 'provoker', name: sq.name, title: '师门任务', look: MONSTERS[sq.mid].look, x: sq.x, y: sq.y, onTalk: fightProvoker });
  if (mapId === 'changan' && S.flags.pendingPet) out.push({ id: 'pendingpet', name: MONSTERS[S.flags.pendingPet].name, title: '等你领取', look: MONSTERS[S.flags.pendingPet].look, x: 77, y: 31, onTalk: claimPendingPet });
  Act.dynNpcs(mapId, out);
  return out;
}

export function questMark(n) {
  const S = G.S;
  if (!S || n.kind === 'dyn') return null;
  const id = n.id, st = mainStep(), q = mq();
  if (st) {
    if (q.state === 'accept' && resolveNpc(st.giver) === id && S.level >= st.lv) return '!';
    if (q.state === 'active' && st.goal.type === 'talk' && st.goal.npc === id) return '?';
    if (q.state === 'turnin' && resolveNpc(st.turnin) === id) return '?';
  }
  if (S.school && id === 'master_' + S.school && !S.quests.school) return '!';
  if (S.quests.school?.type === 'deliver' && S.quests.school.npc === id) return '?';
  if (S.quests.school?.type === 'buy' && id === 'master_' + S.school && countItem(S.quests.school.item) > 0) return '?';
  if (id === 'zhongkui' && S.level >= 15 && !S.quests.ghost) return '!';
  if (id === 'xiaoer' && S.level >= 10 && !S.quests.treasure) return '!';
  return Act.questMark(id);
}

// ---------------- 交互 ----------------
export async function interact(n) {
  if (R.scene !== 'world') return;
  if (n.kind === 'dyn') { n.onTalk(); return; }
  const id = n.id;
  const def = NPCS[id];
  const S = G.S;
  const st = mainStep(), q = mq();
  const base = { look: def.look, name: def.name, title: def.title };
  // 主线交互优先
  if (st) {
    if (q.state === 'accept' && resolveNpc(st.giver) === id) {
      if (S.level < st.lv) { await dialog({ ...base, pages: [`少侠，等你修炼到<b>${st.lv}级</b>再来找我吧。<br><i>可以去野外练级，或者做师门、抓鬼任务。</i>`] }); return; }
      const v = await dialog({ ...base, pages: st.accept.map(p => `<span class="q-new">【主线·${st.title}】</span>${p}`), options: [{ label: '接受任务', value: 1, cls: 'primary' }, { label: '稍后再说', value: 0 }] });
      if (v === 1) { setMainState('active'); log(`【主线】接受任务：${st.title}`, '#ffd23a'); Audio2.sfx('quest'); save(); P.refreshHud(); }
      return;
    }
    if (q.state === 'active' && st.goal.type === 'talk' && st.goal.npc === id) {
      const { pages } = await completeMain();
      await dialog({ ...base, pages });
      P.refreshHud(); return;
    }
    if (q.state === 'turnin' && resolveNpc(st.turnin) === id) {
      const { pages } = await completeMain();
      await dialog({ ...base, pages });
      P.refreshHud(); return;
    }
  }
  // 师门送信
  if (S.quests.school?.type === 'deliver' && S.quests.school.npc === id) {
    await dialog({ ...base, pages: ['原来是' + (SCHOOLS[S.school]?.master || '') + '的书信，辛苦少侠跑一趟了！'] });
    finishShimen();
    return;
  }
  const svc = services(id);
  const chat = def.chat[Math.floor(Math.random() * def.chat.length)];
  const opts = svc.map(s => ({ label: s.label, value: s.fn, cls: s.cls, disabled: s.disabled }));
  opts.push({ label: '离开', value: null });
  const fn = await dialog({ ...base, pages: [svc.text || chat], options: opts });
  if (typeof fn === 'function') fn();
}

function services(id) {
  const S = G.S;
  const list = [];
  const shop = (label, items) => list.push({ label, fn: () => P.shopPanel(NPCS[id].name, items) });
  switch (id) {
    case 'jy_inn': list.push({ label: '住店休息（50两）', fn: () => rest(50) }); break;
    case 'ca_inn': list.push({ label: Mall.vipLevel() >= 4 ? '住店休息（VIP免费）' : '住店休息（100两）', fn: () => rest(Mall.vipLevel() >= 4 ? 0 : 100) }); break;
    case 'jy_grocer': shop('购买物品', { items: ['baozi', 'kaoya', 'zhenlu', 'sheyao', 'feixing'] }); break;
    case 'jy_weapon': shop('购买装备', { equip: ['weapon', 'armor', 'helm'], tiers: [0, 1] }); break;
    case 'ca_weapon': shop('购买武器', { equip: ['weapon'], tiers: shopTiers() }); list.push({ label: '装备强化', fn: () => P.forgePanel() }); break;
    case 'ca_armor': shop('购买服饰', { equip: ['armor', 'helm'], tiers: shopTiers() }); break;
    case 'ca_acc': shop('购买饰品', { equip: ['neck', 'belt', 'boots'], tiers: shopTiers() }); break;
    case 'ca_drug': shop('购买药品', { items: DRUG_SHOP }); break;
    case 'ca_grocer': shop('购买杂货', { items: GROCERY_SHOP }); break;
    case 'jw_merchant': shop('购买补给', { items: ['kaoya', 'jinchuang', 'dahuan', 'nverhong', 'xianniang', 'sheli', 'feixing', 'sheyao'] }); break;
    case 'lg_xia': case 'bj_shop': case 'hy_shop': case 'nt_shop': case 'ly_shop': shop('购买补给', { items: HIGH_DRUG_SHOP }); break;
    case 'ca_bank': list.push({ label: '充值仙玉（藏宝阁）', cls: 'primary', fn: () => Mall.mallPanel('charge') }); break;
    case 'yizhan': yizhanServices(list); break;
    case 'xiayi': list.push({ label: '招募伙伴 / 调整队伍', fn: () => P.partnerPanel(), cls: 'primary' }); break;
    case 'petfairy':
      list.push({ label: '治疗召唤兽（免费）', fn: () => { for (const p of S.pets) { const ps = petStats(p); p.hp = ps.maxHp; p.mp = ps.maxMp; } toast('召唤兽已恢复健康'); Audio2.sfx('heal'); P.refreshHud(); } });
      shop('购买宠物口粮', { items: ['wanyao'] });
      break;
    case 'zhongkui': ghostServices(list); break;
    case 'xiaoer': treasureServices(list); break;
    default: Act.services(id, list);
  }
  if (id.startsWith('master_')) masterServices(id.slice(7), list);
  return list;
}

// 长安装备铺出售到比人物高一档的装备（最高 12 档），更高档只能靠掉落、活动与剧情
function shopTiers() { const top = Math.min(12, Math.max(6, tierForLevel(G.S.level) + 1)); return Array.from({ length: top + 1 }, (_, i) => i).slice(Math.max(0, top - 7)); }
function rest(cost) {
  const S = G.S;
  if (S.gold < cost) { toast('银两不足'); return; }
  S.gold -= cost;
  fullHeal();
  Audio2.sfx('heal');
  toast('一夜好眠，气血魔法全部恢复！');
  P.refreshHud(); save();
}

function yizhanServices(list) {
  const S = G.S;
  const race = ROLES[S.role].race;
  list.text = S.school ? `客官，是要回${SCHOOLS[S.school].name}吗？` : '客官想拜入哪个门派？我可以送你过去。<br><i>只能拜入本种族门派。</i>';
  if (S.school) list.push({ label: `回${SCHOOLS[S.school].name}`, fn: () => teleport('s_' + S.school), cls: 'primary' });
  else for (const [sid, sc] of Object.entries(SCHOOLS)) if (sc.race === race) list.push({ label: `前往${sc.name}（${sc.desc}）`, fn: () => teleport('s_' + sid) });
  list.push({ label: '送我去建邺城', fn: () => teleport('jianye') });
  const far = WORLD_ORDER.filter(id => S.unlocked?.[id] && getMap(id).encounter && getMap(id).encounter.lv[0] >= 40);
  if (far.length) list.push({ label: '直达已去过的远方（500两）', fn: async () => {
    const v = await dialog({ look: NPCS.yizhan.look, name: '驿站老板', pages: ['客官要去哪儿？'], options: [...far.map(id => ({ label: `${MAP_NAMES[id]}（${getMap(id).encounter.lv[0]}~${getMap(id).encounter.lv[1]}级）`, value: id })), { label: '算了', value: null }] });
    if (!v) return;
    if (S.gold < 500) { toast('银两不足'); return; }
    S.gold -= 500; teleport(v);
  } });
}
export function teleport(mapId, x, y) {
  transition(() => enterMap(mapId, x, y));
  Audio2.sfx('portal');
}

function masterServices(sid, list) {
  const S = G.S, sc = SCHOOLS[sid];
  if (!S.school) {
    if (sc.race !== ROLES[S.role].race) { list.text = '你我种族不同，本门不收外族弟子。'; return; }
    if (S.level < 5) { list.text = '你根基尚浅，<b>5级</b>之后再来拜师吧。'; return; }
    list.text = `${sc.name}：${sc.desc}。<br>你可愿拜入我门下？`;
    list.push({ label: `拜入${sc.name}`, cls: 'primary', fn: () => joinSchool(sid) });
    return;
  }
  if (S.school !== sid) { list.text = '你已有师门，好好修炼吧。'; return; }
  list.text = '徒儿，今日想做什么？';
  list.push({ label: '学习技能', fn: () => P.learnPanel(), cls: 'primary' });
  const sq = S.quests.school;
  if (!sq) list.push({ label: `师门任务（第${(S.quests.shimenCount % 10) + 1}环）`, fn: () => giveShimen() });
  else if (sq.type === 'buy' && countItem(sq.item) > 0) list.push({ label: `上交${ITEMS[sq.item].name}`, cls: 'primary', fn: () => { removeItem(sq.item, 1); finishShimen(); } });
  else list.push({ label: '查看师门任务', fn: () => dialog({ look: NPCS['master_' + sid].look, name: sc.master, pages: [shimenText(sq)] }) });
  if (sq) list.push({ label: '放弃师门任务', fn: () => { S.quests.school = null; S.quests.shimenCount = 0; toast('已放弃师门任务，环数清零'); P.refreshHud(); } });
  list.push({ label: '回长安城', fn: () => teleport('changan', 28, 32) });
}
async function joinSchool(sid) {
  const S = G.S;
  S.school = sid;
  for (const id of [...SCHOOLS[sid].skills, SCHOOLS[sid].passive]) S.skills[id] = Math.max(1, S.skills[id] || 0);
  Audio2.sfx('levelup');
  banner('拜师成功', SCHOOLS[sid].name);
  log(`你拜入了${SCHOOLS[sid].name}，习得${SCHOOLS[sid].skills.map(s => SKILLS[s].name).join('、')}`, '#ffd23a');
  checkMainGoal();
  stats();
  save();
  P.refreshHud();
  const st = mainStep();
  if (st && mq().state === 'turnin' && st.turnin === 'master') {
    const { pages } = await completeMain();
    await dialog({ look: NPCS['master_' + sid].look, name: SCHOOLS[sid].master, pages });
  } else {
    await dialog({ look: NPCS['master_' + sid].look, name: SCHOOLS[sid].master, pages: ['好徒儿！从今日起你便是本门弟子。可以在我这里学习技能和领取师门任务。'] });
  }
  P.refreshHud();
}

// ---------------- 师门任务 ----------------
const DELIVER_NPCS = ['laosun', 'wangdasao', 'lishanren', 'jy_teacher', 'ca_weapon', 'ca_armor', 'ca_drug', 'ca_bank', 'yuantiangang', 'ca_monk', 'xiayi', 'petfairy', 'xiaoer', 'ca_scholar', 'jn_woodcutter', 'gj_hunter'];
export function fieldMapFor(L) {
  const cands = MAP_IDS.filter(id => { const e = getMap(id).encounter; return e && !['chenchuan', 'baigu'].includes(id) && e.lv[0] <= L + 2; });
  const best = cands.sort((a, b) => Math.abs(getMap(b).encounter.lv[1] - L) - Math.abs(getMap(a).encounter.lv[1] - L)).pop();
  return best || 'donghai';
}
export function giveShimen(quiet) {
  const S = G.S;
  const types = ['deliver', 'buy', 'patrol', 'fight'];
  const type = pick(types);
  const q = { type };
  if (type === 'deliver') q.npc = pick(DELIVER_NPCS.filter(id => id !== 'master_' + S.school));
  if (type === 'buy') q.item = pick(S.level < 15 ? ['baozi', 'zhenlu', 'sheyao', 'feixing'] : S.level < 60 ? ['kaoya', 'zhenlu', 'jinchuang', 'nverhong', 'sheyao'] : ['jinchuang', 'dahuan', 'nverhong', 'xianniang', 'sheyao']);
  if (type === 'fight') {
    q.map = fieldMapFor(S.level);
    const m = getMap(q.map);
    [q.x, q.y] = randomWalkable(m);
    q.mid = pick(m.encounter.mobs);
    q.name = '挑衅的' + MONSTERS[q.mid].name;
  }
  S.quests.school = q;
  Audio2.sfx('quest');
  log('【师门】' + shimenText(q), '#8ad8ff');
  if (!quiet) dialog({ look: NPCS['master_' + S.school].look, name: SCHOOLS[S.school].master, pages: [shimenText(q)] });
  P.refreshHud(); save();
}
export function shimenText(q) {
  if (q.type === 'deliver') return `把这封书信送给<b>${NPCS[q.npc].name}</b>（${MAP_NAMES[npcMap(q.npc)]}）。`;
  if (q.type === 'buy') return `师门缺少<b>${ITEMS[q.item].name}</b>，去买一个回来交给为师。`;
  if (q.type === 'patrol') return '最近有妖怪在门派附近捣乱，去<b>门派里巡逻</b>，把它们赶走！';
  return `有<b>${q.name}</b>在${MAP_NAMES[q.map]}（${q.x},${q.y}）挑衅本门，去教训他！`;
}
function finishShimen(inBattle) {
  const S = G.S;
  const n = ++S.quests.shimenCount;
  S.stat.shimen++;
  const round = ((n - 1) % 10) + 1;
  const L = S.level;
  const gold = Math.floor((40 + L * 10 + round * 15) * (1 + Mall.vipPerk('gold')));
  S.quests.school = null;
  S.gold += gold;
  const exp = grantExp(Math.floor(expNeed(L) * (0.07 + round * 0.007))).gained;
  const pet = activePet(); if (pet) petGainExp(pet, exp * 0.6);
  let extra = '';
  if (round === 10) {
    const eq = randomDrop(tierForLevel(L), 0.15);
    if (addEquip(eq)) extra = `，额外奖励 ${eq.name}`;
    addItem('xiulian', 1); extra += '，修炼果×1';
  }
  Audio2.sfx('quest');
  banner(`师门任务完成（第${round}环）`, `经验+${fmt(exp)} 银两+${gold}${extra}`);
  log(`【师门】第${round}环完成：经验+${fmt(exp)}，银两+${gold}${extra}`, '#8ad8ff');
  P.refreshHud(); save();
  // 连续任务：自动领取下一环并出发
  if (S.quests.chain && S.school) {
    const go = () => { if (S.quests.school || R.scene !== 'world') return; giveShimen(true); const t = trackList().find(x => x.cat === '师门'); if (t?.nav) followTrack(t.nav); };
    if (inBattle) R.afterBattle = go; else setTimeout(go, 600);
  }
}
async function fightProvoker() {
  const S = G.S, q = S.quests.school;
  const n = teamSize() + randi(0, 1);
  const enemies = Array.from({ length: n }, (_, i) => enemyUnit(q.mid, clamp(S.level + (i ? 0 : 1), 1, 69), { name: i ? undefined : q.name, noCatch: true, leader: i === 0 }));
  fight(enemies, { noCatch: true, onWin: () => { finishShimen(true); } });
}
function patrolFight() {
  const S = G.S;
  const mid = pick(getMap(fieldMapFor(S.level)).encounter.mobs);
  const n = teamSize();
  const enemies = Array.from({ length: n }, () => enemyUnit(mid, S.level, { name: '捣乱的' + MONSTERS[mid].name, noCatch: true }));
  fight(enemies, { noCatch: true, onWin: () => finishShimen(true) });
}

// ---------------- 抓鬼 ----------------
function ghostServices(list) {
  const S = G.S;
  if (S.level < 15) { list.text = '人间鬼怪凶恶，你还太弱了，<b>15级</b>之后再来找我吧。'; return; }
  const gq = S.quests.ghost;
  list.text = `鬼怪作乱，谁愿随我降妖？<br>本轮已抓 <b>${S.quests.ghostCount % 10}</b>/10 只。${S.party.length < 2 ? '<br><i>鬼怪成群出没，建议带上至少两名伙伴。</i>' : ''}`;
  if (!gq) list.push({ label: '领取抓鬼任务', cls: 'primary', fn: () => giveGhost() });
  else list.push({ label: `查看任务：${gq.name}`, fn: () => toast(`${gq.name}在${MAP_NAMES[gq.map]}（${gq.x},${gq.y}）`) });
}
export function giveGhost(quiet) {
  const S = G.S;
  const maps = S.level < 60 ? ['jianye', 'jiangnan', 'changan', 'donghai', 'guojing'] : ['changan', 'guojing', 'jingwai'];
  if (S.level >= 25 && S.level < 60) maps.push('jingwai');
  for (const id of ['huaguo', 'longgong', 'beiju', 'huoyan', 'wudi', 'nantian', 'youming']) { const e = getMap(id).encounter; if (S.level >= e.lv[0] && S.level <= e.lv[1] + 25) maps.push(id); }
  const map = pick(maps);
  const [x, y] = randomWalkable(getMap(map));
  const name = pick(GHOST_PREFIX) + pick(GHOST_NAMES);
  S.quests.ghost = { map, x, y, name, mid: pick(['yegui', 'yuanhun', 'niutou', 'mamian', 'jiangshi', ...(S.level >= 90 ? ['kuloujiang', 'youhun'] : []), ...(S.level >= 118 ? ['yinbing', 'wuchang'] : [])]) };
  Audio2.sfx('quest');
  log(`【抓鬼】${name}出现在${MAP_NAMES[map]}（${x},${y}）`, '#d8a8ff');
  if (quiet) { P.refreshHud(); save(); return; }
  dialog({ look: NPCS.zhongkui.look, name: '钟馗', pages: [`<b>${name}</b>正在${MAP_NAMES[map]}（${x},${y}）作祟，速去收服！<br><i>点击右侧任务追踪可以自动寻路。</i>`] });
  P.refreshHud(); save();
}
function fightGhost() {
  const S = G.S, gq = S.quests.ghost;
  const L = S.level;
  const n = Math.min(6, teamSize() + randi(1, 2));
  const enemies = [enemyUnit(gq.mid, L + 1, { name: gq.name, hpMul: 1.5, leader: true, noCatch: true })];
  const mobs = ['yegui', 'niutou', 'mamian', 'kulou', 'jiangshi', 'yuanhun'];
  for (let i = 1; i < n; i++) enemies.push(enemyUnit(pick(mobs), L, { noCatch: true }));
  fight(enemies, {
    noCatch: true,
    onWin: () => {
      const c = ++S.quests.ghostCount;
      S.stat.ghost++;
      const round = ((c - 1) % 10) + 1;
      const gold = Math.floor((L * 25 + round * 40) * (1 + Mall.vipPerk('gold')));
      S.gold += gold;
      const exp = grantExp(Math.floor(expNeed(L) * 0.09 * (1 + round * 0.06))).gained;
      const pet = activePet(); if (pet) petGainExp(pet, exp * 0.6);
      S.quests.ghost = null;
      let extra = '';
      if (round === 10) { const eq = randomDrop(tierForLevel(L), 0.2); if (addEquip(eq)) extra = `，钟馗赏赐 ${eq.name}`; addItem('jinke', 1); extra += '，金柳露×1'; }
      banner(`收服${gq.name}（第${round}只）`, `经验+${fmt(exp)} 银两+${gold}${extra}`);
      log(`【抓鬼】第${round}只完成：经验+${fmt(exp)}，银两+${gold}${extra}`, '#d8a8ff');
      if (S.quests.chain) R.afterBattle = () => { if (S.quests.ghost) return; giveGhost(true); const g2 = S.quests.ghost; navigate({ map: g2.map, npc: 'ghost' }); };
      return `抓鬼奖励：经验+${fmt(exp)}，银两+${gold}${extra}`;
    },
  });
}

// ---------------- 宝图 ----------------
function treasureServices(list) {
  const S = G.S;
  if (S.level < 10) { list.text = '客官，这里有打听消息的地方，不过您得<b>10级</b>以后才能帮上忙。'; return; }
  const tq = S.quests.treasure;
  list.text = '最近强盗猖獗，听说他们身上带着藏宝图呢……';
  if (!tq) list.push({ label: '领取宝图任务', cls: 'primary', fn: () => giveTreasure() });
  else list.push({ label: '查看任务', fn: () => toast(`强盗头目在${MAP_NAMES[tq.map]}（${tq.x},${tq.y}）`) });
}
function giveTreasure() {
  const S = G.S;
  const map = pick(S.level < 60 ? ['jiangnan', 'guojing', 'donghai', ...(S.level >= 22 ? ['jingwai'] : [])] : ['guojing', 'jingwai', 'huaguo', ...(S.level >= 75 ? ['beiju'] : [])]);
  const [x, y] = randomWalkable(getMap(map));
  S.quests.treasure = { map, x, y };
  Audio2.sfx('quest');
  log(`【宝图】强盗头目出没于${MAP_NAMES[map]}（${x},${y}）`, '#ffb060');
  dialog({ look: NPCS.xiaoer.look, name: '店小二', pages: [`有个强盗头目在<b>${MAP_NAMES[map]}（${x},${y}）</b>出没，打败他就能拿到藏宝图！`] });
  P.refreshHud(); save();
}
function fightBandit() {
  const S = G.S;
  const mid = S.level >= 12 ? 'shanzei' : 'qiangdao';
  const n = teamSize() + randi(0, 1);
  const enemies = Array.from({ length: n }, (_, i) => enemyUnit(mid, S.level + (i ? 0 : 1), { name: i ? undefined : '强盗头目', hpMul: i ? 1 : 1.5, noCatch: true, leader: i === 0 }));
  fight(enemies, {
    noCatch: true,
    onWin: () => {
      const maps = S.level < 60 ? ['jianye', 'jiangnan', 'donghai', 'guojing', 'changan', ...(S.level >= 22 ? ['jingwai'] : [])] : ['changan', 'guojing', 'jingwai', 'huaguo', 'longgong', ...(S.level >= 75 ? ['beiju'] : [])];
      const map = pick(maps);
      const [x, y] = randomWalkable(getMap(map));
      S.quests.treasure = null;
      if (!addItem('baotu', 1, { data: { map, x, y } })) return '背包已满，藏宝图掉在了地上……';
      log(`【宝图】获得藏宝图：宝藏在${MAP_NAMES[map]}（${x},${y}）`, '#ffb060');
      return `获得<b>藏宝图</b>：${MAP_NAMES[map]}（${x},${y}）`;
    },
  });
}
export async function digTreasure(index) {
  const S = G.S;
  const e = S.inv[index];
  const d = e.data;
  if (S.map !== d.map || Math.max(Math.abs(S.x - d.x), Math.abs(S.y - d.y)) > 2) {
    const ok = await confirmBox(`宝藏位于<b>${MAP_NAMES[d.map]}（${d.x},${d.y}）</b>，要自动寻路过去吗？`, '前往', '取消');
    if (ok) { P.closeAll(); navigate({ map: d.map, x: d.x, y: d.y }); }
    return;
  }
  S.inv.splice(index, 1);
  P.closeAll();
  if (e.id === 'gj_baotu') { Act.digHighTreasure(); return; }
  const r = Math.random();
  const L = S.level;
  if (r < 0.15) {
    toast('挖出了一群妖怪！');
    const m = getMap(fieldMapFor(L));
    const enemies = Array.from({ length: teamSize() + 1 }, () => enemyUnit(pick(m.encounter.mobs), L, { name: undefined }));
    fight(enemies, { onWin: () => { const eq = randomDrop(tierForLevel(L), 0.2); addEquip(eq); return `妖怪守护的宝物：${eq.name}`; } });
    return;
  }
  let msg;
  if (r < 0.5) { const g = L * 60 + randi(100, 500); S.gold += g; msg = `挖到了 ${g} 两银子！`; Audio2.sfx('coin'); }
  else if (r < 0.75) { const eq = randomDrop(tierForLevel(L), 0.12); addEquip(eq); msg = `挖到了装备「${eq.name}」！`; }
  else if (r < 0.95) { const id = pick(['jinchuang', 'nverhong', 'sheli', 'xiulian', 'jinke', 'wanyao']); addItem(id, 1); msg = `挖到了${ITEMS[id].name}！`; }
  else { const g = L * 300; S.gold += g; addItem('xiulian', 2); msg = `鸿运当头！挖到了 ${g} 两银子和两个修炼果！`; Audio2.sfx('levelup'); }
  banner('挖宝', msg);
  log('【宝图】' + msg, '#ffb060');
  P.refreshHud(); save();
}

// ---------------- 遇敌与战斗 ----------------
export const teamSize = () => 1 + G.S.party.length;
export function checkEncounter(map, steps) {
  const S = G.S;
  if (map.id === 's_' + S.school && S.quests.school?.type === 'patrol' && steps > 4 && Math.random() < 0.12) { patrolFight(); return true; }
  const enc = map.encounter;
  if (!enc || steps < 6 || Math.random() > 0.05) return false;
  if (S.incense > 0 && enc.lv[1] < S.level) return false;
  const team = teamSize();
  let n = randi(Math.max(1, Math.ceil(team * 0.8)), Math.min(7, team + 1));
  if (S.level <= 2 && team === 1) n = randi(1, 2);
  const enemies = [];
  const st = mainStep(), q = mq();
  const want = st && q.state === 'active' && st.goal.type === 'kill' && st.goal.map === map.id && chance(0.6) ? st.goal.mid : null;
  for (let i = 0; i < n; i++) {
    const mid = i === 0 && want ? want : pick(enc.mobs);
    const m = MONSTERS[mid];
    const lv = clamp(S.level + randi(-3, 2), Math.max(m.lv[0], enc.lv[0]), Math.min(m.lv[1], enc.lv[1]));
    const baby = m.pet < 900 && chance(0.04);
    enemies.push(enemyUnit(mid, lv, { baby }));
  }
  fight(enemies, {});
  return true;
}

async function fightMainBoss(st) {
  const m = MONSTERS[st.goal.boss];
  const ok = await confirmBox(`要挑战<b>${m.name}</b>吗？<br><small>建议先回满气血魔法，带足药品。</small>`, '开战！', '再准备一下');
  if (!ok) return;
  fight(BOSS_FIGHTS[st.goal.boss](), {
    noCatch: true, noFlee: false, boss: true,
    onWin: () => {
      const q = mq();
      if (st.turnin) { q.state = 'turnin'; toast(`击败${m.name}！回复${npcName(st.turnin)}`); log(`【主线】击败${m.name}，回复${npcName(st.turnin)}`, '#ffd23a'); return `主线目标完成：击败${m.name}`; }
      completeMain().then(({ pages }) => { R.afterBattle = () => dialog({ look: m.look, name: m.name, pages }); });
      return `击败${m.name}！`;
    },
  });
}
async function claimPendingPet() {
  const S = G.S;
  if (S.pets.length >= PET_MAX) { toast('召唤兽已满，先在召唤兽界面放生一只吧'); return; }
  const p = makePet(S.flags.pendingPet, S.level, true); if (!p.shenshou) p.growth = 1.26;
  addPet(p); S.flags.pendingPet = null;
  toast(`${p.name}加入了你的队伍！`); P.refreshHud(); save();
}

export function fight(enemies, opts = {}) {
  if (R.scene !== 'world') return;
  const S = G.S;
  R.scene = 'battle';
  W.path = []; W.nav = null;
  const allies = allyUnits();
  opts.allyMod?.(allies);
  layoutEnemies(enemies);
  const B = { units: [...allies, ...enemies], round: 1, canFlee: !opts.boss && opts.noFlee !== true, noCatch: !!opts.noCatch, kind: opts.boss ? 'boss' : 'field' };
  const bg = snapshot();
  P.hideHud(true);
  document.getElementById('banner').classList.remove('show');
  BT.onCatch = (u) => {
    if (S.pets.length >= PET_MAX) return false;
    const pet = makePet(u.mid, u.baby ? 0 : u.level, u.baby);
    if (u.baby) pet.level = Math.max(1, Math.min(S.level, u.level));
    addPet(pet);
    log(`捕捉成功！获得召唤兽「${pet.name}」${pet.baby ? '（宝宝）' : ''}`, '#ffd23a');
    const q = mq(), st = mainStep();
    if (st && q.state === 'active' && st.goal.type === 'catch') { q.progress++; }
    return true;
  };
  startBattle(B, bg, (result, B2) => onBattleEnd(result, B2, opts));
  BT.afterClose = () => {
    R.scene = 'world';
    P.hideHud(false);
    Audio2.play(W.map.music);
    if (R.afterLose) { const f = R.afterLose; R.afterLose = null; f(); }
    if (R.afterBattle) { const f = R.afterBattle; R.afterBattle = null; f(); }
    R.afterFlee = null;
    checkMainGoal();
    P.refreshHud();
    save();
  };
}

function onBattleEnd(result, B, opts) {
  const S = G.S;
  syncFromBattle(B.units);
  const lines = [];
  if (result === 'win' && opts.noLoot) {
    if (opts.onWin) { const extra = opts.onWin(); if (extra) lines.push(`<div class="res-row q">${extra}</div>`); }
    if (opts.boss) S.stat.bosses++;
  } else if (result === 'win') {
    let exp = 0, gold = 0;
    const drops = [];
    const q = mq(), st = mainStep();
    if (opts.boss) S.stat.bosses++;
    for (const u of B.units) {
      if (u.side !== 'enemy' || u.gone) continue;
      let e = monsterExp(u.level) * (u.boss ? 4 : u.leader ? 2 : 1);
      if (u.level < S.level - 10) e *= 0.3;
      exp += e;
      gold += Math.floor(u.level * 3 + 5 + Math.random() * u.level * 2) * (u.boss ? 5 : 1);
      S.kills++;
      if (st && q.state === 'active' && st.goal.type === 'kill' && u.mid === st.goal.mid) q.progress++;
      const m = MONSTERS[u.mid] || {};
      for (const [id, p] of m.drops || []) if (chance(p)) { if (addItem(id, 1)) drops.push(ITEMS[id].name); }
      if (chance(u.boss ? 1 : 0.035)) { const eq = randomDrop(tierForLevel(u.level), u.boss ? 0.25 : 0); if (addEquip(eq)) drops.push(`<span style="color:${['#fff', '#6fe07a', '#5ab8ff', '#d68aff'][eq.rarity]}">${eq.name}</span>`); }
    }
    exp = Math.floor(exp);
    gold = Math.floor(gold * (1 + Mall.vipPerk('gold')));
    S.gold += gold;
    const before = S.level;
    const petExp = exp;
    exp = grantExp(exp).gained;
    const pet = activePet();
    let petLv = 0;
    if (pet) petLv = petGainExp(pet, petExp * (G.S.doubleMs > 0 ? 2 : 1));
    lines.push(`<div class="res-row">经验 <b>+${fmt(exp)}</b>${G.S.doubleMs > 0 ? ' <span class="dbl">双倍</span>' : ''}</div>`, `<div class="res-row">银两 <b>+${gold}</b></div>`);
    if (pet) lines.push(`<div class="res-row">${esc(pet.name)} 经验 +${fmt(exp)}${petLv ? `，升到 ${pet.level} 级！` : ''}</div>`);
    if (drops.length) lines.push(`<div class="res-row">获得：${drops.join('、')}</div>`);
    if (S.level > before) lines.push(`<div class="res-lv">升级！当前等级 ${S.level}</div>`);
    if (st && q.state === 'active' && st.goal.type === 'kill') lines.push(`<div class="res-row q">【${st.title}】${MONSTERS[st.goal.mid].name} ${Math.min(q.progress, st.goal.n)}/${st.goal.n}</div>`);
    if (opts.onWin) { const extra = opts.onWin(); if (extra) lines.push(`<div class="res-row q">${extra}</div>`); }
    if (bagFree() <= 0) lines.push('<div class="res-row warn">背包已满！</div>');
    checkMainGoal();
  } else if (result === 'lose' && opts.noPenalty) {
    lines.push('<div class="res-row">挑战失败，再接再厉！</div>', '<div class="res-row">（挑战类玩法失败不会损失银两）</div>');
    R.afterLose = () => {
      const st2 = stats();
      S.hp = Math.max(S.hp, Math.ceil(st2.maxHp / 2)); S.mp = Math.max(S.mp, Math.ceil(st2.maxMp / 2));
      for (const p of S.pets) { const ps = petStats(p); p.hp = Math.max(p.hp, Math.ceil(ps.maxHp / 2)); }
      opts.onLose?.();
    };
  } else if (result === 'lose') {
    opts.onLose?.();
    const lost = Math.floor(S.gold * 0.1);
    S.gold -= lost;
    lines.push(`<div class="res-row">你被打败了……损失银两 ${lost}</div>`, '<div class="res-row">醒来时已在客栈，气血恢复了一半。</div>');
    R.afterLose = () => {
      const st2 = stats();
      S.hp = Math.ceil(st2.maxHp / 2); S.mp = Math.ceil(st2.maxMp / 2);
      for (const p of S.pets) { const ps = petStats(p); p.hp = Math.max(p.hp, Math.ceil(ps.maxHp / 2)); }
      const town = S.level >= 10 && S.school ? ['changan', 9, 31] : ['jianye', 8, 24];
      teleport(...town);
    };
  }
  if (result === 'flee') opts.onLose?.();
  save();
  return { html: lines.join('') };
}

// ---------------- 物品使用 ----------------
export async function useItem(index, target = 'player') {
  const S = G.S;
  const e = S.inv[index];
  if (!e) return;
  if (e.eq) return;
  const it = ITEMS[e.id];
  const st = stats();
  switch (it.type) {
    case 'food': {
      if (target === 'pet') {
        const pet = activePet(); if (!pet) { toast('没有参战召唤兽'); return; }
        const ps = petStats(pet);
        if ((!it.hp || pet.hp >= ps.maxHp) && (!it.mp || pet.mp >= ps.maxMp)) { toast('召唤兽状态很好，不需要'); return; }
        if (it.hp) pet.hp = Math.min(ps.maxHp, pet.hp + it.hp);
        if (it.mp) pet.mp = Math.min(ps.maxMp, pet.mp + it.mp);
      } else {
        if ((!it.hp || S.hp >= st.maxHp) && (!it.mp || S.mp >= st.maxMp)) { toast('状态很好，不需要'); return; }
        if (it.hp) S.hp = Math.min(st.maxHp, S.hp + it.hp);
        if (it.mp) S.mp = Math.min(st.maxMp, S.mp + it.mp);
      }
      removeItem(e.id, 1); Audio2.sfx('heal'); break;
    }
    case 'revive': toast('只能在战斗中使用'); return;
    case 'incense': S.incense = 600; removeItem(e.id, 1); toast('点燃了摄妖香，600步内不会遇到比你弱的妖怪'); break;
    case 'fly': {
      P.closeAll();
      const v = await dialog({ look: null, name: '飞行符', pages: ['要飞往哪里？'], options: [{ label: '长安城', value: 'changan' }, { label: '建邺城', value: 'jianye' }, { label: '取消', value: null }] });
      if (!v) return;
      removeItem('feixing', 1);
      teleport(v);
      break;
    }
    case 'map': digTreasure(index); return;
    case 'petfood': { const pet = activePet(); if (!pet) { toast('没有参战召唤兽'); return; } removeItem(e.id, 1); const lv = petGainExp(pet, expNeed(pet.level) * 0.35); toast(`${pet.name}吃得很开心${lv ? `，升到了${pet.level}级！` : '！'}`); break; }
    case 'point': removeItem(e.id, 1); S.free += 2; toast('获得2点属性点，可在人物界面分配'); break;
    case 'petgrow': { const pet = activePet(); if (!pet) { toast('没有参战召唤兽'); return; } const cap = it.cap || 1.3, g = it.grow || 0.01; if (pet.growth >= cap) { toast('成长已达上限'); return; } removeItem(e.id, 1); pet.growth = +Math.min(cap, pet.growth + g).toFixed(3); toast(`${pet.name}的成长提升到了${pet.growth}`); break; }
    case 'petbook': { const pet = activePet(); if (!pet) { toast('没有参战召唤兽，先在召唤兽界面设为参战'); return; } P.closeAll(); await learnBook(pet, e.id); break; }
    case 'double': removeItem(e.id, 1); S.doubleMs += 60 * 60 * 1000; banner('双倍经验', `剩余 ${Math.round(S.doubleMs / 60000)} 分钟`); Audio2.sfx('levelup'); break;
    case 'expbook': { removeItem(e.id, 1); const g2 = grantExp(Math.floor(expNeed(S.level) * 0.3)).gained; toast(`获得经验 ${fmt(g2)}`); break; }
    case 'mat': toast(it.desc); return;
  }
  P.refreshHud(); save();
}

// 魔兽要诀：技能越多越容易顶替掉已有技能（经典「打书」）
export async function learnBook(pet, bookId) {
  const S = G.S;
  const high = bookId === 'gj_shoujue';
  const pool = (high ? PET_HIGH_POOL : [...PET_TRAIT_POOL, ...PET_TRAIT_POOL, ...PET_RARE_POOL]).filter(t => !pet.skills.includes(t));
  if (!pool.length) { toast('这只召唤兽已经学会书中所有技能了'); return; }
  const ok = await confirmBox(`让<b>${esc(pet.name)}</b>（现有 ${pet.skills.length} 个技能）阅读${ITEMS[bookId].name}？<br><small>技能越多，新技能越容易顶替掉已有技能。</small>`, '打书！', '算了');
  if (!ok) return;
  removeItem(bookId, 1);
  const sk = pick(pool);
  const n = pet.skills.length;
  const replaceP = n >= 10 ? 1 : Math.max(0, Math.min(0.85, (n - 2) * 0.15));
  let msg;
  if (Math.random() < replaceP) {
    const i = randi(0, n - 1), old = pet.skills[i];
    pet.skills[i] = sk;
    msg = `<b>${SKILLS[sk].name}</b> 顶替了 ${SKILLS[old].name}`;
  } else { pet.skills.push(sk); msg = `学会了 <b>${SKILLS[sk].name}</b>！技能数 ${pet.skills.length}`; }
  const ps = petStats(pet); pet.hp = Math.min(pet.hp, ps.maxHp);
  Audio2.sfx(SKILLS[sk].rare ? 'levelup' : 'quest');
  banner(SKILLS[sk].rare ? '打书·高级技能！' : '打书', `${pet.name}${msg.replace(/<\/?b>/g, '')}`);
  log(`【打书】${esc(pet.name)}${msg}`, SKILLS[sk].rare ? '#ffb040' : '#8ad8ff');
  P.refreshHud(); save();
}

// ---------------- 任务追踪 ----------------
export function trackList() {
  const S = G.S, out = [];
  const st = mainStep(), q = mq();
  if (st) {
    let text, nav;
    if (q.state === 'accept') {
      const g = resolveNpc(st.giver);
      text = S.level < st.lv ? `需要等级 ${st.lv}（当前${S.level}）` : `找<b>${npcName(st.giver)}</b>（${MAP_NAMES[npcMap(g)] || ''}）`;
      if (g) nav = { map: npcMap(g), npc: g };
    } else if (q.state === 'turnin') {
      const g = resolveNpc(st.turnin);
      text = `回复<b>${npcName(st.turnin)}</b>`;
      if (g) nav = { map: npcMap(g), npc: g };
    } else {
      const g = st.goal;
      if (g.type === 'kill') { text = `消灭${MONSTERS[g.mid].name} <b>${q.progress}/${g.n}</b>（${MAP_NAMES[g.map]}）`; nav = { map: g.map, rnd: true }; }
      if (g.type === 'catch') { text = `捕捉召唤兽 <b>${Math.min(S.pets.length, g.n)}/${g.n}</b>（${MAP_NAMES[g.map]}）`; nav = { map: g.map, rnd: true }; }
      if (g.type === 'talk') { text = `与<b>${NPCS[g.npc].name}</b>对话（${MAP_NAMES[npcMap(g.npc)]}）`; nav = { map: npcMap(g.npc), npc: g.npc }; }
      if (g.type === 'boss') { text = `击败<b>${MONSTERS[g.boss].name}</b>（${MAP_NAMES[g.map]} ${g.x},${g.y}）`; nav = { map: g.map, npc: 'boss_' + g.boss }; }
      if (g.type === 'join') { text = S.level < 5 ? '达到5级后去长安驿站拜师' : '去长安城<b>驿站老板</b>处拜师'; nav = { map: 'changan', npc: 'yizhan' }; }
    }
    out.push({ cat: '主线', title: st.title, text, nav, color: '#ffd23a' });
  } else out.push({ cat: '主线', title: '已完成', text: G.S.level < MAX_LEVEL ? '三界太平，继续历练，冲击150级吧' : '你已是三界传说', color: '#ffd23a' });
  const sq = S.quests.school;
  if (sq) {
    let nav;
    if (sq.type === 'deliver') nav = { map: npcMap(sq.npc), npc: sq.npc };
    if (sq.type === 'buy') nav = countItem(sq.item) ? { map: 's_' + S.school, npc: 'master_' + S.school } : { map: 'changan', npc: ['baozi', 'kaoya', 'jinchuang', 'nverhong'].includes(sq.item) ? 'ca_drug' : 'ca_grocer' };
    if (sq.type === 'patrol') nav = { map: 's_' + S.school, rnd: true };
    if (sq.type === 'fight') nav = { map: sq.map, npc: 'provoker' };
    out.push({ cat: '师门', title: `第${(S.quests.shimenCount % 10) + 1}环`, text: shimenText(sq).replace(/<\/?b>/g, ''), nav, color: '#8ad8ff' });
  }
  const gq = S.quests.ghost;
  if (gq) out.push({ cat: '抓鬼', title: `第${(S.quests.ghostCount % 10) + 1}只`, text: `${gq.name}（${MAP_NAMES[gq.map]} ${gq.x},${gq.y}）`, nav: { map: gq.map, npc: 'ghost' }, color: '#d8a8ff' });
  const tq = S.quests.treasure;
  if (tq) out.push({ cat: '宝图', title: '强盗头目', text: `${MAP_NAMES[tq.map]}（${tq.x},${tq.y}）`, nav: { map: tq.map, npc: 'bandit' }, color: '#ffb060' });
  const maps = S.inv.filter(e => (e.id === 'baotu' || e.id === 'gj_baotu') && e.data);
  if (maps.length) { const d = maps[0].data; out.push({ cat: '宝图', title: `藏宝图×${maps.length}`, text: `挖宝：${MAP_NAMES[d.map]}（${d.x},${d.y}）`, nav: { map: d.map, x: d.x, y: d.y, dig: true }, color: '#ffb060' }); }
  Act.trackItems(out);
  return out;
}
export function followTrack(nav) {
  if (!nav || R.scene !== 'world') return;
  if (nav.rnd) {
    const m = getMap(nav.map);
    const [x, y] = randomWalkable(m, Math.random, 5);
    navigate({ map: nav.map, x, y });
    return;
  }
  if (nav.dig) {
    navigate({ map: nav.map, x: nav.x, y: nav.y, then: () => { const i = G.S.inv.findIndex(e => (e.id === 'baotu' || e.id === 'gj_baotu') && e.data && e.data.map === nav.map && e.data.x === nav.x && e.data.y === nav.y); if (i >= 0) digTreasure(i); } });
    return;
  }
  navigate(nav);
}

export function onEnterMap() { P.refreshHud(); }

// 主循环每步调用：双倍经验计时、天降异象
export function tick(dt) {
  const S = G.S;
  if (!S) return;
  if (S.doubleMs > 0) { S.doubleMs = Math.max(0, S.doubleMs - dt); if (!S.doubleMs) toast('双倍经验时间结束了'); }
  Act.tick(dt);
}
