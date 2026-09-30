// 单机向新玩法：渡劫突破、镇妖塔、秘境降妖、三界答题、华山论剑、天降异象、高级藏宝图、活动面板
import { ROLES, RACES, SCHOOLS, ITEMS, MONSTERS, PARTNERS, SHENSHOU, expNeed, tierForLevel, LEVEL_CAPS, MAX_LEVEL, TOWER_MAX } from './data.js';
import { G, save, stats, fullHeal, addItem, addEquip, makeEquip, makePet, addPet, levelCap, bagFree } from './state.js';
import { autoAttr, stdEquip, derive, passiveBonus, partnerStats, monsterStats } from './stats.js';
import { mkUnit } from './battle-core.js';
import { enemyUnit } from './enemies.js';
import { getMap, MAP_IDS, MAP_NAMES, WORLD_ORDER, randomWalkable } from './maps.js';
import { NPCS } from './npcs.js';
import { dialog, toast, log, banner, confirmBox, panel, closePanel, UI } from './ui.js';
import { navigate } from './world.js';
import * as Game from './game.js';
import * as Mall from './mall.js';
import * as P from './panels.js';
import { pick, randi, shuffle, chance, fmt, esc, clamp, weighted } from './util.js';
import { Audio2 } from './audio.js';

const S_ = () => G.S;
const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
// 每日次数（按本机日期重置）
export function daily() {
  const S = S_();
  if (S.daily.date !== today()) S.daily = { date: today(), mj: 0, quiz: 0, quizRight: 0, arena: 0, freePull: 0, vipJade: false };
  return S.daily;
}
export const mijingMax = () => 3 + (Mall.vipLevel() >= 4 ? 1 : 0);
export const arenaMax = () => 5 + (Mall.vipLevel() >= 4 ? 2 : 0);
const npcTalk = (id, pages, options) => dialog({ look: NPCS[id].look, name: NPCS[id].name, title: NPCS[id].title, pages, options });

// 该等级附近的野外怪物
function mobsForLevel(L) {
  const maps = MAP_IDS.filter(id => { const e = getMap(id).encounter; return e && !['chenchuan', 'baigu'].includes(id) && L >= e.lv[0] - 3 && L <= e.lv[1] + 3; });
  const pool = [...new Set(maps.flatMap(id => getMap(id).encounter.mobs))];
  return pool.length ? pool : getMap(Game.fieldMapFor(L)).encounter.mobs;
}
function giveItems(list) {
  const got = [];
  for (const [id, n] of list) {
    if (id === 'gj_baotu') { for (let i = 0; i < n; i++) if (addHighMap()) got.push(ITEMS[id].name); continue; }
    if (addItem(id, n)) got.push(`${ITEMS[id].name}×${n}`);
  }
  return got;
}
function reward({ expF = 0, gold = 0, jade = 0, items = [] }) {
  const S = S_(), out = [];
  if (expF) out.push(`经验+${fmt(Game.grantExp(Math.floor(expNeed(S.level) * expF)).gained)}`);
  if (gold) { gold = Math.floor(gold * (1 + Mall.vipPerk('gold'))); S.gold += gold; out.push(`银两+${fmt(gold)}`); }
  if (jade) { Mall.addJade(jade); out.push(`仙玉+${jade}`); }
  out.push(...giveItems(items));
  return out.join('，');
}

// ================= 渡劫突破 =================
const REALMS = ['凡体', '仙体', '圣体', '天人', '至尊'];
const BREAK_TITLES = ['渡劫飞升', '超凡入圣', '天人合一', '三界至尊'];
export const realmName = () => REALMS[S_().breaks || 0];
function taibaiServices(list) {
  const S = S_(), cap = levelCap();
  if (S.breaks >= LEVEL_CAPS.length - 1) { list.text = `你已是<b>${realmName()}</b>，再无瓶颈可言，只管向${MAX_LEVEL}级进发吧！`; return; }
  if (S.level < cap) { list.text = `你当前境界：<b>${realmName()}</b>。<br>下一道瓶颈在<b>${cap}级</b>，到时候经验会先储存起来，再来找老夫渡劫即可。`; return; }
  list.text = `你已修到<b>${cap}级</b>瓶颈，体内经验积蓄如潮（已储存 ${fmt(S.exp)}）。<br>渡劫须战胜自己的<b>心魔</b>——它拥有你的全部本领，且更加凶狠！`;
  list.push({ label: '渡劫（挑战心魔）', cls: 'primary', fn: () => fightXinmo() });
}
async function fightXinmo() {
  const S = S_(), cap = levelCap(), role = ROLES[S.role];
  if (!await confirmBox(`挑战<b>心魔·${esc(S.name)}</b>？<br><small>失败不会有任何损失，可以反复挑战。开战前气血魔法回满。</small>`, '渡劫！', '再准备一下')) return;
  fullHeal();
  Game.fight(xinmoFoes(), {
    boss: true, noCatch: true, noLoot: true, noPenalty: true,
    onWin: () => {
      const i = S.breaks;
      S.breaks++;
      S.free += 10;
      S.title = BREAK_TITLES[i];
      Mall.addJade([300, 500, 800, 1200][i]);
      Game.R.afterBattle = () => {
        Audio2.sfx('levelup');
        banner('渡劫成功！', `境界提升为「${realmName()}」，等级上限提升至 ${levelCap()}`);
        log(`【渡劫】战胜心魔，境界提升为${realmName()}！潜力点+10，仙玉+${[300, 500, 800, 1200][i]}，称号「${BREAK_TITLES[i]}」`, '#ffd23a');
        Game.grantExp(0);
        P.refreshHud(); save();
      };
      return `渡劫成功！境界「${REALMS[i + 1]}」，潜力点+10，仙玉+${[300, 500, 800, 1200][i]}`;
    },
  });
}

// 心魔：外形与门派技能照搬玩家本人，属性取同等级的标准修为（所以强化、修炼、伙伴升星都能帮你渡劫），气血 8 倍起、每次渡劫再加一倍，另带幻影
export function xinmoFoes() {
  const S = S_(), cap = levelCap(), role = ROLES[S.role];
  const school = S.school || pick(Object.keys(SCHOOLS).filter(k => SCHOOLS[k].race === role.race));
  const sc = SCHOOLS[school];
  const st = derive(autoAttr(role.race, cap, sc.build), cap, stdEquip(cap), passiveBonus(school, { [sc.passive]: cap }));
  const x = enemyUnit('xinmo', cap + 2);
  Object.assign(x, {
    name: '心魔·' + S.name, look: { ...role.look, ghostly: true, cloth: '#3a1a4a', cloth2: '#b83a6a', hair: '#8a1a2a', ribbon: '#ff3a6a' }, weapon: role.weapon,
    maxHp: st.maxHp * (8 + S.breaks), hp: st.maxHp * (8 + S.breaks), maxMp: 99999, mp: 99999, atk: Math.floor(st.atk * 1.1), def: st.def, spd: Math.floor(st.spd * 1.1), mpow: Math.floor(st.mpow * 1.1),
    skills: sc.skills.map(id => ({ id, lv: cap })), ai: 'boss', kind: 'rival',
  });
  const mobs = mobsForLevel(cap);
  return [x, ...Array.from({ length: 3 }, () => enemyUnit(pick(mobs), cap + 1, { name: '心魔幻影', noCatch: true, hpMul: 1.2 }))];
}

// ================= 镇妖塔 =================

const TOWER_BOSSES = ['shanzeitou', 'yaofeng', 'baigujing', 'hunshi', 'jiutouchong', 'jiaomowang', 'honghaier', 'niumowang', 'diyong', 'pengmowang', 'shituowang', 'yurongwang'];
const towerLv = f => Math.min(MAX_LEVEL, 25 + f);
const towerReq = f => Math.max(30, towerLv(f) - 3);
function towerServices(list) {
  const S = S_(), f = S.tower.best + 1;
  if (S.level < 30) { list.text = '镇妖塔凶险万分，<b>30级</b>之后再来吧。'; return; }
  if (S.tower.best >= TOWER_MAX) { list.text = `你已登顶镇妖塔全部 ${TOWER_MAX} 层，威震三界！`; return; }
  list.text = `镇妖塔共 <b>${TOWER_MAX}</b> 层，你已通过第 <b>${S.tower.best}</b> 层。<br>每层首次通关都有经验、银两、仙玉奖励，每十层镇守着一位妖王，奖励更丰厚。<br><i>挑战前气血魔法回满，失败无损失。</i>`;
  list.push({ label: S.level >= towerReq(f) ? `挑战第 ${f} 层（妖怪 ${towerLv(f)} 级）` : `第 ${f} 层需要等级 ${towerReq(f)}`, cls: 'primary', disabled: S.level < towerReq(f), fn: () => towerFight(f) });
  const to = sweepTo();
  if (to > S.tower.best) list.push({ label: `扫荡至第 ${to} 层（低于你10级的楼层，经验减半）`, fn: () => towerSweep(to) });
}
// 妖怪比人物低 10 级以上的楼层可以直接扫荡
const sweepTo = () => Math.min(TOWER_MAX, S_().level - 35);
function towerReward(f) {
  const boss = f % 10 === 0 || f === TOWER_MAX;
  const items = boss ? [[['qianghua', 5]], [['shoujue', 1]], [['baohu', 1], ['qianghua', 3]]][(f / 10) % 3].map(x => [...x]) : [];
  if (boss && f % 30 === 0) items.push(['gj_shoujue', 1]);
  if (boss && f % 50 === 0) items.push(['shenshou_sp', 20]);
  if (f === TOWER_MAX) items.push(['gj_shoujue', 2]);
  return { expF: boss ? 0.35 : 0.1, gold: f * 400 * (boss ? 3 : 1), jade: boss ? 60 : 10, items };
}
function towerSweep(to) {
  const S = S_(), sum = { expF: 0, gold: 0, jade: 0, items: [] };
  const from = S.tower.best + 1;
  for (let f = from; f <= to; f++) {
    const r = towerReward(f);
    sum.expF += r.expF / 2; sum.gold += r.gold; sum.jade += r.jade;
    for (const [id, n] of r.items) { const e = sum.items.find(x => x[0] === id); if (e) e[1] += n; else sum.items.push([id, n]); }
  }
  S.tower.best = to;
  const txt = reward(sum);
  Audio2.sfx('levelup');
  banner('镇妖塔扫荡', `第 ${from}~${to} 层`);
  log(`【镇妖塔】扫荡第${from}~${to}层：${txt}`, '#c8a0ff');
  P.refreshHud(); save();
}
// 每层：普通层 4~6 只塔中妖怪；每十层一位妖王带 3~4 只小妖
export function towerFoes(f) {
  const L = towerLv(f), boss = f % 10 === 0 || f === TOWER_MAX;
  const mobs = mobsForLevel(L);
  const n = boss ? 3 + (f >= 60 ? 1 : 0) : Math.min(6, 4 + Math.floor(f / 50));
  const foes = boss ? [enemyUnit(f === TOWER_MAX ? 'liuer' : TOWER_BOSSES[(f / 10 - 1) % TOWER_BOSSES.length], L + 1)] : [];
  for (let i = 0; i < n; i++) foes.push(enemyUnit(pick(mobs), L, { noCatch: true, name: '塔中' + MONSTERS[pick(mobs)].name, hpMul: 1.1 }));
  for (const u of foes) if (!u.boss) u.name = '塔中' + MONSTERS[u.mid].name;
  return foes;
}
function towerFight(f) {
  const S = S_();
  if (S.level < towerReq(f)) { toast(`需要等级 ${towerReq(f)}`); return; }
  fullHeal();
  const boss = f % 10 === 0 || f === TOWER_MAX;
  const foes = towerFoes(f);
  banner(`镇妖塔 · 第 ${f} 层`, boss ? '妖王镇守！' : '');
  Game.fight(foes, {
    boss, noCatch: true, noPenalty: true,
    onWin: () => {
      S.tower.best = Math.max(S.tower.best, f);
      const txt = reward(towerReward(f));
      log(`【镇妖塔】首次通过第${f}层：${txt}`, '#c8a0ff');
      if (f < TOWER_MAX && S.level >= towerReq(f + 1)) Game.R.afterBattle = async () => { if (await confirmBox(`镇妖塔第 ${f} 层已通过！<br>继续挑战第 <b>${f + 1}</b> 层吗？`, '继续', '休息一下')) towerFight(f + 1); };
      return `镇妖塔第${f}层首通：${txt}`;
    },
  });
}

// ================= 秘境降妖 =================
const BLESS = {
  atk: { name: '战意', desc: '全队伤害 +18%', fn: u => { u.atk = Math.floor(u.atk * 1.18); } },
  mag: { name: '灵泉', desc: '全队灵力 +18%', fn: u => { u.mpow = Math.floor(u.mpow * 1.18); } },
  def: { name: '金身', desc: '全队防御 +22%', fn: u => { u.def = Math.floor(u.def * 1.22); } },
  spd: { name: '神行', desc: '全队速度 +15%', fn: u => { u.spd = Math.floor(u.spd * 1.15); } },
  hp: { name: '仙体', desc: '全队气血上限 +20%', fn: u => { u.maxHp = Math.floor(u.maxHp * 1.2); u.hp = Math.floor(u.hp * 1.2); } },
  crit: { name: '杀意', desc: '全队物理暴击率 +15%', fn: u => { u.critUp = (u.critUp || 0) + 0.15; } },
  vamp: { name: '嗜血', desc: '全队物理攻击吸血', fn: u => { if (!u.traits.includes('xixue')) u.traits.push('xixue'); } },
  regen: { name: '长生', desc: '全队每回合回复气血', fn: u => { if (!u.traits.includes('zaisheng')) u.traits.push('zaisheng'); } },
  heal: { name: '甘霖', desc: '立即回满气血魔法', now: true },
  gold: { name: '聚宝', desc: '通关时银两翻倍', later: true },
  luck: { name: '福缘', desc: '通关宝箱多开一次', later: true },
};
function mijingServices(list) {
  const S = S_(), d = daily();
  if (S.level < 40) { list.text = '秘境妖气太重，<b>40级</b>之后再来吧。'; return; }
  list.text = `秘境共五关，每过一关可从三种<b>仙缘祝福</b>中挑选一种，效果在本次秘境中一直有效。第五关有秘境首领镇守，通关可开宝箱。<br>今日剩余次数：<b>${mijingMax() - d.mj}</b>/${mijingMax()}`;
  if (d.mj < mijingMax()) list.push({ label: '进入秘境', cls: 'primary', fn: () => startMijing() });
}
function startMijing() {
  const d = daily();
  if (d.mj >= mijingMax()) { toast('今日秘境次数已用完'); return; }
  d.mj++;
  fullHeal();
  Game.R.mj = { wave: 1, bless: [] };
  log('【秘境】进入秘境降妖', '#7ae0c8');
  mijingWave();
}
function mijingWave() {
  const S = S_(), run = Game.R.mj;
  if (!run) return;
  const L = S.level, mobs = mobsForLevel(L + 2);
  const last = run.wave === 5;
  const foes = [];
  if (last) foes.push(enemyUnit(pick(TOWER_BOSSES.filter(b => Math.abs(monsterLv(b) - L) < 40)) || 'baigujing', L + 1, { name: '秘境首领', hpMul: 0.55 }));
  const n = last ? 3 : Game.teamSize() + randi(0, 1);
  while (foes.length < n + (last ? 1 : 0)) foes.push(enemyUnit(pick(mobs), L + randi(0, 2), { noCatch: true }));
  banner(`秘境 · 第 ${run.wave} 关`, run.bless.length ? '祝福：' + run.bless.map(b => BLESS[b].name).join('、') : '');
  Game.fight(foes, {
    boss: last, noCatch: true, noPenalty: true,
    allyMod: units => { for (const b of run.bless) if (BLESS[b].fn) units.forEach(BLESS[b].fn); },
    onLose: () => { Game.R.mj = null; log('【秘境】挑战失败，秘境关闭', '#7ae0c8'); },
    onWin: () => {
      const txt = reward({ expF: 0.06, gold: L * 60 });
      if (last) {
        const chests = run.bless.includes('luck') ? 2 : 1, got = [];
        for (let i = 0; i < chests; i++) got.push(...giveItems([weighted([[['qianghua', 3], 36], [['shoujue', 1], 18], [['xiulian', 2], 14], [['jinke', 1], 10], [['baohu', 1], 9], [['xinwu', 1], 7], [['gj_shoujue', 1], 3], [['shenshou_sp', 5], 3]])]));
        const fin = reward({ expF: 0.25, gold: L * 400 * (run.bless.includes('gold') ? 2 : 1), jade: 30 });
        Game.R.mj = null;
        Game.R.afterBattle = () => { Audio2.sfx('levelup'); banner('秘境通关！', `宝箱：${got.join('、')}`); log(`【秘境】通关奖励：${fin}，宝箱：${got.join('、')}`, '#7ae0c8'); P.refreshHud(); save(); };
        return `秘境通关！${fin}`;
      }
      run.wave++;
      Game.R.afterBattle = () => chooseBlessing();
      return `第${run.wave - 1}关通过：${txt}`;
    },
  });
}
const monsterLv = mid => ({ shanzeitou: 18, yaofeng: 29, baigujing: 42, hunshi: 50, jiutouchong: 60, jiaomowang: 70, honghaier: 78, niumowang: 89, diyong: 100, pengmowang: 112, shituowang: 118, yurongwang: 129 }[mid] || 50);
async function chooseBlessing() {
  const S = S_(), run = Game.R.mj;
  if (!run) return;
  // 关与关之间回复三成气血
  const st = stats();
  S.hp = Math.min(st.maxHp, S.hp + Math.floor(st.maxHp * 0.3)); S.mp = Math.min(st.maxMp, S.mp + Math.floor(st.maxMp * 0.3));
  const opts = shuffle(Object.keys(BLESS).filter(k => !run.bless.includes(k) || BLESS[k].now)).slice(0, 3);
  const v = await dialog({ look: NPCS.mijing.look, name: '秘境仙使', title: `第 ${run.wave} 关之前`, pages: [`仙缘降临！请选择一种祝福（第 ${run.wave}/5 关）：<br>${opts.map(k => `<b>${BLESS[k].name}</b>：${BLESS[k].desc}`).join('<br>')}`], options: [...opts.map(k => ({ label: `${BLESS[k].name}·${BLESS[k].desc}`, value: k, cls: 'primary' })), { label: '离开秘境', value: 'quit' }] });
  if (!v || v === 'quit') { Game.R.mj = null; toast('你离开了秘境'); return; }
  if (BLESS[v].now) fullHeal(); else run.bless.push(v);
  Audio2.sfx('heal');
  mijingWave();
}

// ================= 三界答题 =================
const QUIZ = [
  ['孙悟空的师父菩提祖师住在哪里？', '灵台方寸山', '花果山', '五庄观', '普陀山'],
  ['孙悟空被压在哪座山下五百年？', '五行山', '火焰山', '花果山', '须弥山'],
  ['唐僧的坐骑白龙马原本是？', '西海龙王三太子', '东海龙王之子', '南海龙女', '泾河龙王'],
  ['猪八戒被贬下凡之前的封号是？', '天蓬元帅', '卷帘大将', '托塔天王', '弼马温'],
  ['沙僧在天庭时的官职是？', '卷帘大将', '天蓬元帅', '赤脚大仙', '巡海夜叉'],
  ['孙悟空的兵器如意金箍棒原本是？', '东海定海神针', '太上老君的炼丹杵', '二郎神的三尖刀', '哪吒的火尖枪'],
  ['铁扇公主的丈夫是谁？', '牛魔王', '蛟魔王', '鹏魔王', '混世魔王'],
  ['红孩儿最厉害的法术是？', '三昧真火', '五雷轰顶', '龙卷雨击', '飞砂走石'],
  ['过火焰山需要借什么宝物？', '芭蕉扇', '紫金葫芦', '人种袋', '照妖镜'],
  ['白骨精一共变化了几次？', '三次', '两次', '四次', '七次'],
  ['孙悟空在天庭第一次被封的官职是？', '弼马温', '齐天大圣', '天蓬元帅', '托塔天王'],
  ['人参果树种在哪里？', '五庄观', '蟠桃园', '兜率宫', '灵山'],
  ['五庄观的观主是谁？', '镇元子', '太上老君', '菩提祖师', '元始天尊'],
  ['真假美猴王中，假悟空的真身是？', '六耳猕猴', '通臂猿猴', '赤尻马猴', '混世魔王'],
  ['能分辨真假美猴王的神兽是？', '谛听', '麒麟', '白泽', '貔貅'],
  ['哪吒的父亲是谁？', '托塔天王李靖', '二郎神', '东海龙王', '太白金星'],
  ['黄眉大王的法宝是？', '人种袋', '芭蕉扇', '紫金铃', '幌金绳'],
  ['无底洞的地涌夫人真身是？', '金鼻白毛老鼠精', '蜘蛛精', '蝎子精', '白骨精'],
  ['梦幻西游中，大唐官府的师父是？', '程咬金', '李靖', '空度禅师', '镇元子'],
  ['梦幻西游中，化生寺的师父是？', '空度禅师', '观音姐姐', '地藏王', '菩提祖师'],
  ['梦幻西游中，龙宫的师父是？', '东海龙王', '西海龙王', '敖烈', '龙女'],
  ['梦幻西游中，魔王寨的师父是？', '牛魔王', '大大王', '白晶晶', '红孩儿'],
  ['梦幻西游中，普陀山的师父是？', '观音姐姐', '孙婆婆', '白晶晶', '嫦娥'],
  ['梦幻西游中，阴曹地府的师父是？', '地藏王', '阎罗王', '崔判官', '孟婆'],
  ['「横扫千军」是哪个门派的技能？', '大唐官府', '狮驼岭', '天宫', '五庄观'],
  ['「龙卷雨击」是哪个门派的技能？', '龙宫', '普陀山', '魔王寨', '方寸山'],
  ['「推气过宫」有什么效果？', '恢复队友气血', '封印敌人', '提升速度', '群体攻击'],
  ['游戏中召唤兽的「神佑复生」是什么效果？', '倒地时有几率满血复活', '每回合回复气血', '攻击吸血', '免疫封印'],
  ['七十二变和筋斗云是谁教给孙悟空的？', '菩提祖师', '太上老君', '观音菩萨', '如来佛祖'],
  ['孙悟空一个筋斗云能翻多远？', '十万八千里', '八万四千里', '三千里', '九万里'],
  ['唐僧取经一共经历了多少难？', '九九八十一难', '七十二难', '一百零八难', '三十六难'],
  ['「七大圣」中排行老大的是？', '平天大圣牛魔王', '齐天大圣孙悟空', '覆海大圣蛟魔王', '混天大圣鹏魔王'],
  ['「覆海大圣」是谁的名号？', '蛟魔王', '鹏魔王', '狮驼王', '禺狨王'],
  ['「移山大圣」是谁的名号？', '狮驼王', '猕猴王', '禺狨王', '牛魔王'],
  ['二郎神身边的神犬叫什么？', '哮天犬', '谛听', '白泽', '金毛犼'],
  ['观音菩萨的道场在哪里？', '南海普陀山', '五台山', '峨眉山', '九华山'],
  ['蟠桃园中最珍贵的蟠桃多少年一熟？', '九千年', '三千年', '六千年', '一万年'],
  ['孙悟空大闹天宫时被谁用金刚琢打中？', '太上老君', '二郎神', '哪吒', '李靖'],
  ['孙悟空在八卦炉中炼出了什么？', '火眼金睛', '铜头铁臂', '七十二变', '金刚不坏之身'],
  ['车迟国的三个妖怪不包括？', '白象精', '虎力大仙', '鹿力大仙', '羊力大仙'],
  ['梦幻西游里，想让召唤兽学会新技能可以使用？', '魔兽要诀', '金柳露', '修炼果', '宠物口粮'],
  ['本游戏中渡劫突破需要战胜？', '自己的心魔', '天兵天将', '四大天王', '十殿阎罗'],
];
function quizServices(list) {
  const S = S_(), d = daily();
  if (S.level < 20) { list.text = '小友学问尚浅，<b>20级</b>之后再来答题吧。'; return; }
  list.text = `每日十题，答对一题赏经验银两，<b>七题以上</b>另赠仙玉，<b>全对</b>重赏！<br>今日进度：<b>${d.quiz}</b>/10，答对 ${d.quizRight} 题。`;
  if (d.quiz < 10) list.push({ label: d.quiz ? '继续答题' : '开始答题', cls: 'primary', fn: () => askQuiz() });
}
async function askQuiz() {
  const S = S_(), d = daily();
  if (d.quiz >= 10) return;
  // 用日期做种子挑题，同一天题目固定
  const seed = [...d.date].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0;
  const order = QUIZ.map((q, i) => [q, (i * 2654435761 + seed) % 1000003]).sort((a, b) => a[1] - b[1]).map(x => x[0]);
  const [q, right, ...wrong] = order[d.quiz];
  const opts = shuffle([right, ...wrong]);
  const v = await npcTalk('fuzi', [`【第 ${d.quiz + 1}/10 题】${q}`], [...opts.map(o => ({ label: o, value: o })), { label: '稍后再答', value: null }]);
  if (v == null) return;
  d.quiz++;
  if (v === right) {
    d.quizRight++;
    const txt = reward({ expF: 0.03, gold: S.level * 80 });
    Audio2.sfx('quest'); toast(`回答正确！${txt}`);
  } else { Audio2.sfx('lose'); toast(`答错了，正确答案是「${right}」`); }
  if (d.quiz >= 10) {
    const jade = d.quizRight === 10 ? 80 : d.quizRight >= 7 ? 30 : 0;
    const txt = reward({ jade, items: d.quizRight === 10 ? [['jingyan', 1]] : [] });
    await npcTalk('fuzi', [`今日答题结束，共答对 <b>${d.quizRight}</b> 题。${jade ? `<br>赏：${txt}` : '<br>明日再来！'}`]);
    P.refreshHud(); save();
    return;
  }
  P.refreshHud(); save();
  askQuiz();
}

// ================= 华山论剑 =================
export const RANKS = [[0, '青铜', '#c08050'], [1100, '白银', '#c8d0d8'], [1250, '黄金', '#ffd040'], [1400, '铂金', '#7ae0e0'], [1600, '钻石', '#8ab0ff'], [1800, '王者', '#ff7ad8']];
const RANK_GIFT = { 白银: 100, 黄金: 200, 铂金: 300, 钻石: 500, 王者: 1000 };
export const rankOf = score => RANKS.filter(r => score >= r[0]).pop();
const SURN = ['李', '王', '张', '慕容', '上官', '欧阳', '令狐', '独孤', '云', '叶', '萧', '白', '楚', '沈'];
const GIVN = ['逍遥', '无忌', '青云', '凌霄', '飞雪', '若水', '星河', '长歌', '紫萱', '剑心', '寒烟', '天行', '千寻', '无痕'];
function arenaServices(list) {
  const S = S_(), d = daily(), rk = rankOf(S.arena.score);
  if (S.level < 30) { list.text = '论剑台高手如云，<b>30级</b>之后再来吧。'; return; }
  list.text = `论剑积分：<b style="color:${rk[2]}">${S.arena.score}（${rk[1]}）</b>，历史最高 ${S.arena.best}。<br>胜利加分、失败扣分，段位越高对手越强，首次晋级各段位有仙玉奖励。<br>今日剩余：<b>${arenaMax() - d.arena}</b>/${arenaMax()} 场`;
  if (d.arena < arenaMax()) list.push({ label: '寻找对手', cls: 'primary', fn: () => arenaMatch() });
}
function rivalUnit(role, school, L, mult, name) {
  const sc = SCHOOLS[school], r = ROLES[role];
  const st = derive(autoAttr(r.race, L, sc.build), L, stdEquip(L), passiveBonus(school, { [sc.passive]: L }));
  const k = x => Math.floor(x * mult);
  return mkUnit({ side: 'enemy', kind: 'rival', name, level: L, hp: k(st.maxHp), maxHp: k(st.maxHp), mp: st.maxMp, maxMp: st.maxMp, atk: k(st.atk), def: k(st.def), spd: k(st.spd), mpow: k(st.mpow),
    skills: sc.skills.map(id => ({ id, lv: L })), traits: [], look: r.look, weapon: r.weapon, ai: sc.role });
}
async function arenaMatch() {
  const S = S_(), d = daily();
  if (d.arena >= arenaMax()) { toast('今日论剑次数已用完'); return; }
  const { foes, name, role, school, L } = arenaFoes();
  const ok = await confirmBox(`对手：<b>${name}</b>（${ROLES[role].name} · ${SCHOOLS[school].name} · ${L}级）<br>携伙伴 ${foes.length - 2} 名与召唤兽一只。<br><small>论剑开始前气血魔法回满。</small>`, '开战', '换一个');
  if (!ok) return;
  d.arena++;
  fullHeal();
  const before = rankOf(S.arena.score)[1];
  Game.fight(foes, {
    noCatch: true, noLoot: true, noPenalty: true, boss: false,
    onWin: () => {
      S.arena.score += 25; S.arena.best = Math.max(S.arena.best, S.arena.score); S.stat.arenaWin++;
      const rk = rankOf(S.arena.score)[1];
      let extra = '';
      if (rk !== before && RANK_GIFT[rk] && !S.arena.ranks[rk]) { S.arena.ranks[rk] = 1; Mall.addJade(RANK_GIFT[rk]); extra = `，晋级「${rk}」！仙玉+${RANK_GIFT[rk]}`; Game.R.afterBattle = () => { Audio2.sfx('levelup'); banner('论剑晋级', `${rk}段位`); }; }
      return `论剑胜利！积分+25（${S.arena.score}），${reward({ expF: 0.05, gold: L * 200, jade: 10 })}${extra}`;
    },
    onLose: () => { S.arena.score = Math.max(800, S.arena.score - 15); log(`【论剑】惜败于${name}，积分-15（${S.arena.score}）`, '#ff9a7a'); },
  });
}
// 对手：同等级的玩家角色 + 2~3 名伙伴 + 1 只召唤兽，积分越高越强
export function arenaFoes() {
  const S = S_(), L = S.level;
  const mult = clamp(0.86 + (S.arena.score - 1000) / 2600, 0.84, 1.35);
  const role = pick(Object.keys(ROLES));
  const school = pick(Object.keys(SCHOOLS).filter(s => SCHOOLS[s].race === ROLES[role].race));
  const name = pick(SURN) + pick(GIVN);
  const foes = [rivalUnit(role, school, L, mult, name)];
  const star = clamp(Math.floor((S.arena.score - 1000) / 200), 0, 5);
  for (const pid of shuffle(Object.keys(PARTNERS)).slice(0, S.arena.score < 1150 ? 2 : 3)) {
    const p = PARTNERS[pid], ps = partnerStats(pid, L, star);
    const k = x => Math.floor(x * mult);
    foes.push(mkUnit({ side: 'enemy', kind: 'rival', name: p.name, level: L, hp: k(ps.maxHp), maxHp: k(ps.maxHp), mp: ps.maxMp, maxMp: ps.maxMp, atk: k(ps.atk), def: k(ps.def), spd: k(ps.spd), mpow: k(ps.mpow),
      skills: SCHOOLS[p.school].skills.map(id => ({ id, lv: L })), traits: [], look: p.look, weapon: p.look.weapon, ai: SCHOOLS[p.school].role }));
  }
  const pm = pick(mobsForLevel(L));
  foes.push(enemyUnit(pm, L, { noCatch: true, statMul: mult, name: name + '的' + MONSTERS[pm].name }));
  return { foes, name, role, school, L };
}

// ================= 天降异象 =================
const XINGXIU = ['角木蛟', '亢金龙', '氐土貉', '房日兔', '心月狐', '尾火虎', '箕水豹', '斗木獬', '牛金牛', '女土蝠', '虚日鼠', '危月燕', '室火猪', '壁水貐', '奎木狼', '娄金狗', '胃土雉', '昴日鸡', '毕月乌', '觜火猴', '参水猿', '井木犴', '鬼金羊', '柳土獐', '星日马', '张月鹿', '翼火蛇', '轸水蚓'];
const EVENT_GAP = 9 * 60 * 1000, EVENT_TTL = 15 * 60 * 1000;
export function tick(dt) {
  const S = S_();
  if (S.level < 30) return;
  const ev = S.quests.event;
  if (ev) {
    ev.ttl -= dt;
    if (ev.ttl <= 0) { S.quests.event = null; log(`【天降异象】${ev.name}已经离去……`, '#ff9a7a'); P.refreshHud(); }
    return;
  }
  S.evTimer = (S.evTimer ?? EVENT_GAP * 0.6) + dt;
  if (S.evTimer >= EVENT_GAP && Game.R.scene === 'world') { S.evTimer = 0; spawnEvent(); }
}
function eventMaps(L) {
  const maps = WORLD_ORDER.filter(id => { const e = getMap(id).encounter; return e && L >= e.lv[0] - 8 && L <= e.lv[1] + 25; });
  return maps.length ? maps : ['changan'];
}
export function spawnEvent(type) {
  const S = S_(), L = S.level;
  const map = pick(eventMaps(L));
  const [x, y] = randomWalkable(getMap(map));
  type ??= weighted([['star', 50], ['chest', 30], ['yaowang', 20]]);
  let ev;
  if (type === 'star') { const mid = pick(mobsForLevel(L)); ev = { type, name: pick(XINGXIU), mid, look: MONSTERS[mid].look }; }
  else if (type === 'chest') ev = { type, name: '聚宝盆精灵', look: { shape: 'ghost', c1: '#ffe060', c2: '#ff9a2a' } };
  else { const mid = pick(TOWER_BOSSES.filter(b => Math.abs(monsterLv(b) - L) <= 45)) || 'baigujing'; ev = { type, name: '妖王·' + MONSTERS[mid].name, mid, look: MONSTERS[mid].look }; }
  Object.assign(ev, { map, x, y, ttl: EVENT_TTL });
  S.quests.event = ev;
  Audio2.sfx('encounter');
  const what = { star: `二十八星宿之<b>「${ev.name}」</b>下凡`, chest: '一只<b>聚宝盆精灵</b>现身', yaowang: `<b>${ev.name}</b>现世作乱` }[type];
  banner('天降异象', `${what.replace(/<\/?b>/g, '')}于${MAP_NAMES[map]}`);
  log(`【天降异象】${what}于${MAP_NAMES[map]}（${x},${y}），限时15分钟！点击任务栏可自动前往。`, '#ffb040');
  P.refreshHud(); save();
}
export function dynNpcs(mapId, out) {
  const ev = S_().quests.event;
  if (ev && ev.map === mapId) out.push({ id: 'event', name: ev.name, title: { star: '星宿下凡', chest: '天降宝藏', yaowang: '妖王现世' }[ev.type], look: ev.look, x: ev.x, y: ev.y, scale: ev.type === 'yaowang' ? 1.25 : 1, onTalk: talkEvent });
}
async function talkEvent() {
  const S = S_(), ev = S.quests.event;
  if (!ev) return;
  const L = S.level;
  if (ev.type === 'chest') {
    S.quests.event = null;
    const got = [reward({ gold: L * randi(200, 500), jade: randi(20, 60) }), ...giveItems([weighted([[['qianghua', 5], 30], [['shoujue', 1], 20], [['shuangbei', 1], 15], [['xinwu', 2], 15], [['shenshou_sp', 8], 12], [['gj_shoujue', 1], 8]])])].join('，');
    Audio2.sfx('levelup'); banner('聚宝盆', got); log(`【天降异象】聚宝盆精灵留下了：${got}`, '#ffb040');
    P.refreshHud(); save();
    return;
  }
  if (!await confirmBox(`要挑战<b>${esc(ev.name)}</b>吗？<br><small>${ev.type === 'star' ? '星宿战力远超普通妖怪' : '妖王带着手下，残血还会狂暴'}，胜利可得丰厚奖励。</small>`, '挑战', '再等等')) return;
  const mobs = mobsForLevel(L);
  const foes = ev.type === 'star'
    ? [enemyUnit(ev.mid, L + 3, { name: ev.name, hpMul: 5, statMul: 1.15, noCatch: true, leader: true, enrage: true }), ...Array.from({ length: 3 }, () => enemyUnit(pick(mobs), L + 1, { noCatch: true, name: '星宿侍从' }))]
    : [enemyUnit(ev.mid, L + 2, { name: ev.name, hpMul: 0.7 }), ...Array.from({ length: 3 }, () => enemyUnit(pick(mobs), L + 1, { noCatch: true }))];
  Game.fight(foes, {
    boss: ev.type === 'yaowang', noCatch: true,
    onWin: () => {
      S.quests.event = null;
      const items = ev.type === 'star'
        ? [weighted([[['shoujue', 1], 35], [['qianghua', 5], 30], [['shenshou_sp', 5], 20], [['gj_shoujue', 1], 10], [['gj_baotu', 1], 5]])]
        : [weighted([[['gj_shoujue', 1], 30], [['shenshou_sp', 15], 30], [['baohu', 2], 25], [['gj_baotu', 1], 15]])];
      const txt = reward({ expF: ev.type === 'star' ? 0.35 : 0.5, gold: L * (ev.type === 'star' ? 300 : 500), jade: ev.type === 'star' ? 40 : 80, items });
      if (ev.type === 'yaowang') { const eq = makeEquip(pick(['weapon', 'armor', 'helm', 'neck', 'belt', 'boots']), tierForLevel(L), ROLES[S.role].weapon, 3, randi(1, 4)); if (addEquip(eq)) log(`【天降异象】妖王掉落史诗装备「${eq.name} +${eq.plus}」`, '#d68aff'); }
      log(`【天降异象】击败${ev.name}：${txt}`, '#ffb040');
      return `击败${esc(ev.name)}！${txt}`;
    },
  });
}

// ================= 高级藏宝图 =================
export function addHighMap() {
  const S = S_();
  const map = pick(eventMaps(S.level).filter(id => id !== 'changan').concat(['changan', 'guojing']));
  const [x, y] = randomWalkable(getMap(map));
  return addItem('gj_baotu', 1, { data: { map, x, y } });
}
export function digHighTreasure() {
  const S = S_(), L = S.level;
  const r = Math.random();
  let msg;
  if (r < 0.07) {
    const p = makePet(pick(SHENSHOU), L, true);
    if (addPet(p)) msg = `挖出了神兽蛋，孵出了<b>${p.name}</b>！`; else { addItem('shenshou_sp', 100); msg = '挖出了神兽蛋！召唤兽已满，化为神兽碎片×100'; }
    Audio2.sfx('levelup'); banner('天降祥瑞', msg.replace(/<\/?b>/g, ''));
  } else if (r < 0.22) {
    toast('宝藏被妖王守护着！');
    const mid = pick(TOWER_BOSSES.filter(b => Math.abs(monsterLv(b) - L) <= 45)) || 'baigujing';
    const mobs = mobsForLevel(L);
    Game.fight([enemyUnit(mid, L + 1, { name: '守宝妖王', hpMul: 0.6 }), ...Array.from({ length: 3 }, () => enemyUnit(pick(mobs), L + 1, { noCatch: true }))], {
      boss: true, noCatch: true,
      onWin: () => { const txt = reward({ jade: 60, items: [chance(0.5) ? ['gj_shoujue', 1] : ['shenshou_sp', 20]] }); log(`【宝图】击败守宝妖王：${txt}`, '#ffb060'); return `守宝妖王的宝藏：${txt}`; },
    });
    return;
  } else if (r < 0.4) msg = '挖到了 ' + reward({ items: [['gj_shoujue', 1]] }) + '！';
  else if (r < 0.62) msg = '挖到了一箱仙玉：' + reward({ jade: randi(100, 300) });
  else if (r < 0.8) msg = '挖到了大量银两：' + reward({ gold: L * randi(600, 1200) });
  else {
    const eq = makeEquip(pick(['weapon', 'armor', 'helm', 'neck', 'belt', 'boots']), tierForLevel(L), ROLES[S.role].weapon, 3, randi(2, 5));
    msg = addEquip(eq) ? `挖到了史诗装备「${eq.name} +${eq.plus}」！` : '背包已满，宝物散落了……';
  }
  banner('高级宝图', msg.replace(/<\/?b>/g, ''));
  log('【高级宝图】' + msg, '#ffb060');
  P.refreshHud(); save();
}

// ================= NPC、任务追踪、活动面板 =================
export function services(id, list) {
  switch (id) {
    case 'taibai': taibaiServices(list); break;
    case 'tower_keeper': towerServices(list); break;
    case 'mijing': mijingServices(list); break;
    case 'fuzi': quizServices(list); break;
    case 'arena': arenaServices(list); break;
    case 'zhenbao': list.text = '客官，藏宝阁里祈愿、商城、福利一应俱全！'; list.push({ label: '打开藏宝阁', cls: 'primary', fn: () => Mall.mallPanel() }); break;
  }
}
export function questMark(id) {
  const S = S_(), d = daily();
  if (id === 'taibai' && S.level >= levelCap() && S.level < MAX_LEVEL) return '!';
  if (id === 'fuzi' && S.level >= 20 && d.quiz < 10) return '!';
  if (id === 'mijing' && S.level >= 40 && d.mj < mijingMax()) return '!';
  if (id === 'arena' && S.level >= 30 && d.arena < arenaMax()) return '!';
  return null;
}
export function trackItems(out) {
  const S = S_(), ev = S.quests.event;
  if (ev) out.push({ cat: '异象', title: ev.name, text: `${MAP_NAMES[ev.map]}（${ev.x},${ev.y}）剩余 ${Math.ceil(ev.ttl / 60000)} 分钟`, nav: { map: ev.map, npc: 'event' }, color: '#ffb040' });
  if (S.level >= levelCap() && S.level < MAX_LEVEL) out.push({ cat: '渡劫', title: `${levelCap()}级瓶颈`, text: '找长安城<b>太白金星</b>渡劫突破', nav: { map: 'changan', npc: 'taibai' }, color: '#ff7ad8' });
  if (Game.R.mj) out.push({ cat: '秘境', title: `第${Game.R.mj.wave}/5关`, text: '秘境进行中', color: '#7ae0c8' });
}

export function activityPanel() {
  const S = S_(), d = daily(), L = S.level;
  const rk = rankOf(S.arena.score);
  const ev = S.quests.event;
  const rows = [
    ['师门任务', '#8ad8ff', S.school ? `已完成 ${S.stat.shimen} 次，本轮第 ${(S.quests.shimenCount % 10) + 1} 环` : '拜师后开放', S.school && { map: 's_' + S.school, npc: 'master_' + S.school }, 5],
    ['钟馗抓鬼', '#d8a8ff', `已抓 ${S.stat.ghost} 只，本轮第 ${(S.quests.ghostCount % 10) + 1} 只`, { map: 'changan', npc: 'zhongkui' }, 15],
    ['宝图任务', '#ffb060', '打败强盗头目得藏宝图', { map: 'changan', npc: 'xiaoer' }, 10],
    ['镇妖塔', '#c8a0ff', `已通过 ${S.tower.best}/${TOWER_MAX} 层 · 首通奖励仙玉`, { map: 'changan', npc: 'tower_keeper' }, 30],
    ['秘境降妖', '#7ae0c8', `今日 ${d.mj}/${mijingMax()} · 五关闯关，挑选祝福`, { map: 'changan', npc: 'mijing' }, 40],
    ['三界答题', '#f0d080', `今日 ${d.quiz}/10 · 答对 ${d.quizRight}`, { map: 'changan', npc: 'fuzi' }, 20],
    ['华山论剑', rk[2], `今日 ${d.arena}/${arenaMax()} · ${rk[1]} ${S.arena.score}分`, { map: 'changan', npc: 'arena' }, 30],
    ['天降异象', '#ffb040', ev ? `${ev.name}在${MAP_NAMES[ev.map]}，剩余${Math.ceil(ev.ttl / 60000)}分钟` : '30级后，游戏中每隔约9分钟随机出现星宿、宝箱精灵或妖王', ev && { map: ev.map, npc: 'event' }, 30],
    ['渡劫突破', '#ff7ad8', `境界：${realmName()} · 当前等级上限 ${levelCap()}`, { map: 'changan', npc: 'taibai' }, 1],
  ];
  const b = panel('活动', '', { id: 'act', width: 640 });
  b.innerHTML = `<div class="acts">${rows.map(([n, c, t, nav, lv], i) => `<div class="act ${L < lv ? 'dim' : ''}"><div class="act-n" style="color:${c}">${n}</div><div class="act-t">${L < lv ? `${lv}级开放` : t}</div>${nav && L >= lv ? `<button class="btn small" data-i="${i}">前往</button>` : ''}</div>`).join('')}</div>
    <div class="act-opts"><label class="chk"><input type="checkbox" id="a-chain" ${S.quests.chain ? 'checked' : ''}> 连续任务：师门、抓鬼完成后自动领取下一个并自动寻路</label>
    <div class="muted">双倍经验剩余：<b>${Math.ceil(S.doubleMs / 60000)}</b> 分钟　·　VIP${Mall.vipLevel()} 经验加成 ${Math.round(Mall.vipPerk('exp') * 100)}%</div></div>`;
  b.querySelectorAll('[data-i]').forEach(x => x.onclick = () => { closePanel(); navigate(rows[+x.dataset.i][3]); });
  b.querySelector('#a-chain').onchange = e => { S.quests.chain = e.target.checked; save(); toast(S.quests.chain ? '已开启连续任务' : '已关闭连续任务'); };
}
