// 奇遇：在野外行走时随机触发的小事件——拾金、仙人指点、路边宝箱、神秘商人、落难小妖、神兵守护、江湖赌客、财神显灵……
import { ITEMS, MONSTERS, expNeed } from './data.js';
import { G, save, addItem, countItem, bagFree, fullHeal, makePet, addPet } from './state.js';
import { enemyUnit } from './enemies.js';
import { getMap, MAP_NAMES, randomWalkable } from './maps.js';
import { NPCS } from './npcs.js';
import { dialog, toast, log, banner } from './ui.js';
import * as Game from './game.js';
import * as Act from './activity.js';
import * as Loot from './loot.js';
import * as P from './panels.js';
import { pick, randi, rand, chance, fmt, weighted } from './util.js';
import { Audio2 } from './audio.js';

const S_ = () => G.S;
const COOLDOWN = 120;        // 两次奇遇之间至少走这么多步
const RATE = 0.006;          // 冷却结束后每一步的触发几率
// [事件, 权重, 最低等级]
const EVENTS = [
  ['qian', 26, 1], ['xianren', 12, 1], ['box', 16, 1], ['lingquan', 8, 1], ['baotu', 6, 10],
  ['merchant', 9, 5], ['xiaoyao', 8, 5], ['guard', 7, 15], ['gamble', 6, 10], ['caishen', 2.5, 1], ['tiangong', 1, 30],
];
const look = id => NPCS[id].look;
const talk = (id, name, title, pages, options) => dialog({ look: typeof id === 'string' ? look(id) : id, name, title, pages, options });
function note(title, msg) {
  banner('奇遇 · ' + title, msg.replace(/<[^>]+>/g, ''));
  log(`【奇遇】${msg}`, '#7af0ff');
}

// 每走一步调用：返回 true 表示需要停下脚步（弹出了对话或进入战斗）
export function check(map) {
  const S = S_();
  if (!map.encounter || S.level < 3 || Game.R.scene !== 'world') return false;
  S.qiyuCd = (S.qiyuCd || 0) + 1;
  if (S.qiyuCd < COOLDOWN || Math.random() > RATE) return false;
  S.qiyuCd = 0;
  return trigger(map);
}
export function trigger(map, type) {
  const S = S_();
  type ??= weighted(EVENTS.filter(e => S.level >= e[2]).map(e => [e[0], e[1]]));
  S.stat.qiyu = (S.stat.qiyu || 0) + 1;
  Audio2.sfx('quest');
  const fn = HANDLERS[type];
  const stop = fn(map);
  P.refreshHud(); save();
  return stop;
}

const HANDLERS = {
  // —— 即时奖励，不打断行走 ——
  qian() {
    const S = S_(), big = chance(0.15);
    const g = Math.floor((S.level * (big ? 600 : rand(60, 150)) + (big ? 5000 : 300)) * Game.goldMul());
    S.gold += g; Audio2.sfx('coin');
    note(big ? '金元宝' : '拾金', big ? `路边草丛里埋着一锭<b>金元宝</b>！银两 +${fmt(g)}` : `捡到一个钱袋，银两 +${fmt(g)}`);
    return false;
  },
  xianren() {
    const S = S_();
    const e = Game.grantExp(Math.floor(expNeed(S.level) * rand(0.2, 0.45))).gained;
    note('仙人指点', `一位云游仙人点化了你，经验 +${fmt(e)}`);
    return false;
  },
  lingquan() {
    const S = S_();
    fullHeal(); S.doubleMs += 10 * 60 * 1000;
    Audio2.sfx('heal');
    note('灵泉', '饮下一口灵泉，气血魔法全满，并获得<b>双倍经验 10 分钟</b>');
    return false;
  },
  baotu(map) {
    if (chance(0.3) && Act.addHighMap()) { note('残图', '捡到一张泛黄的<b>高级藏宝图</b>！'); return false; }
    const m = getMap(Game.fieldMapFor(S_().level));
    const [x, y] = randomWalkable(m);
    if (addItem('baotu', 1, { data: { map: m.id, x, y } })) note('残图', `捡到一张藏宝图，宝藏在${MAP_NAMES[m.id]}（${x},${y}）`);
    else toast('捡到一张藏宝图，可惜背包满了……');
    return false;
  },
  caishen() {
    const S = S_();
    const g = Math.floor((S.level * 1500 + 20000) * Game.goldMul());
    S.gold += g; S.jade += 88; addItem('baoxiang', 2);
    Audio2.sfx('levelup');
    note('财神显灵', `<b>财神爷</b>路过，撒下金银无数！银两 +${fmt(g)}、仙玉 +88、神秘宝箱 ×2`);
    return false;
  },
  // —— 需要玩家选择 ——
  box() {
    talk('jy_kid', '路边宝箱', '奇遇', ['草丛里露出一角雕花木箱，箱子上还贴着一张褪色的封条……'], [{ label: '当场打开！', value: 'open', cls: 'primary' }, { label: '先收进背包', value: 'keep' }]).then(v => {
      if (!addItem('baoxiang', 1)) { toast('背包已满，宝箱带不走了……'); return; }
      if (v === 'open') Loot.openBox('baoxiang');
      else toast('获得神秘宝箱，可在背包中打开');
      save();
    });
    return true;
  },
  tiangong() {
    talk('taibai', '天工遗宝', '奇遇', ['天边一道霞光坠地，竟是一只刻满云纹的<b>天工宝匣</b>！', '传说里面封存着上古神匠的得意之作——传说、神器，必居其一。'], [{ label: '打开宝匣', value: 'open', cls: 'primary' }, { label: '收进背包', value: 'keep' }]).then(v => {
      if (!addItem('tiangong', 1)) { toast('背包已满……宝匣化作霞光飞走了'); return; }
      log('【奇遇】获得<b style="color:#ffa53a">天工宝匣</b>！', '#ffa53a');
      if (v === 'open') Loot.openBox('tiangong');
      save();
    });
    return true;
  },
  merchant() {
    const S = S_(), L = S.level;
    const goods = [
      ['baoxiang', 1, L * 150 + 1000],
      ['shenbing', 1, L * 800 + 8000],
      ['lingxi', 2, L * 100 + 1000],
    ];
    talk('jw_merchant', '神秘商人', '奇遇', [`客官留步！小人走南闯北，手里有几样好东西，今天<b>便宜卖给有缘人</b>。<br><small>银两：${fmt(S.gold)}</small>`],
      [...goods.map(([id, n, pr], i) => ({ label: `${ITEMS[id].icon}${ITEMS[id].name}×${n}　${fmt(pr)}两`, value: i, disabled: S.gold < pr })), { label: '不买了', value: -1 }]).then(i => {
      if (i === null || i < 0) return;
      const [id, n, pr] = goods[i];
      if (S.gold < pr) { toast('银两不足'); return; }
      if (!addItem(id, n)) { toast('背包已满'); return; }
      S.gold -= pr; Audio2.sfx('coin');
      log(`【奇遇】从神秘商人处买到 ${ITEMS[id].name}×${n}`, '#7af0ff');
      if (ITEMS[id].type === 'box') Loot.openBox(id);
      P.refreshHud(); save();
    });
    return true;
  },
  xiaoyao(map) {
    const S = S_();
    const mid = pick(map.encounter.mobs.filter(m => MONSTERS[m].pet !== undefined && MONSTERS[m].pet < 900)) || pick(map.encounter.mobs);
    const m = MONSTERS[mid];
    talk(m.look, '落难的' + m.name, '奇遇', [`一只受了伤的${m.name}蜷在路边，可怜巴巴地望着你……`], [{ label: '放它一条生路', value: 'free' }, { label: '收服它', value: 'catch', cls: 'primary' }]).then(v => {
      if (v === 'catch') {
        const pet = makePet(mid, S.level, true);
        pet.growth = +rand(1.2, 1.3).toFixed(3);
        if (addPet(pet)) { Audio2.sfx('levelup'); note('收服', `收服了<b>${m.name}宝宝</b>，成长 ${pet.growth}！`); }
        else toast('召唤兽已满，它趁机溜走了……');
      } else {
        addItem('xiulian', 2); addItem('jinke', 1); addItem('lingxi', 1);
        note('善有善报', `${m.name}感激涕零，叼来了修炼果×2、金柳露×1、灵犀玉×1`);
      }
      P.refreshHud(); save();
    });
    return true;
  },
  guard(map) {
    const S = S_(), L = S.level;
    const mobs = map.encounter.mobs;
    talk('tower_keeper', '神兵守护者', '奇遇', ['山壁裂开一道缝隙，里面插着一柄寒光凛凛的神兵——守护者拦住了去路：', '「想取神兵，先过我这一关！」'], [{ label: '接受挑战', value: 'fight', cls: 'primary' }, { label: '绕道而行', value: 'no' }]).then(v => {
      if (v !== 'fight') return;
      const foes = [enemyUnit(pick(mobs), L + 2, { name: '神兵守护者', hpMul: 4, statMul: 1.15, noCatch: true, leader: true, enrage: true }),
        ...Array.from({ length: Math.min(4, 1 + S.party.length) }, () => enemyUnit(pick(mobs), L, { noCatch: true }))];
      Game.fight(foes, {
        onWin: () => {
          if (!addItem('shenbing', 1)) return '背包已满，神兵宝匣没能带走……';
          Game.R.afterBattle = () => Loot.openBox('shenbing');
          return '获得<b>神兵宝匣</b>！';
        },
      });
    });
    return true;
  },
  gamble() {
    const S = S_(), bet = S_().level * 200 + 500;
    talk('ca_beggar', '江湖赌客', '奇遇', [`「来来来，三颗骰子定输赢！」<br>押大押小赢一倍，押中<b>豹子</b>赢十五倍。每把 <b>${fmt(bet)}</b> 两。`],
      [{ label: '押大', value: 'big', disabled: S.gold < bet }, { label: '押小', value: 'small', disabled: S.gold < bet }, { label: '押豹子', value: 'tri', disabled: S.gold < bet }, { label: '不赌', value: null }]).then(v => {
      if (!v || S.gold < bet) return;
      const d = [randi(1, 6), randi(1, 6), randi(1, 6)], sum = d[0] + d[1] + d[2];
      const tri = d[0] === d[1] && d[1] === d[2];
      const res = tri ? 'tri' : sum >= 11 ? 'big' : 'small';
      const face = d.map(x => '⚀⚁⚂⚃⚄⚅'[x - 1]).join(' ');
      let win = 0;
      if (v === res) win = v === 'tri' ? bet * 15 : bet;
      else win = -bet;
      S.gold += win;
      Audio2.sfx(win > 0 ? 'coin' : 'lose');
      const what = tri ? '豹子' : res === 'big' ? '大' : '小';
      talk('ca_beggar', '江湖赌客', '奇遇', [`<span style="font-size:28px">${face}</span>　${sum}点，<b>${what}</b>！<br>${win > 0 ? `你赢了 <b style="color:#3a8a2a">${fmt(win)}</b> 两！` : `你输了 ${fmt(bet)} 两……`}`]);
      if (win >= bet * 15) note('豹子', `押中豹子，赢了 ${fmt(win)} 两！`);
      P.refreshHud(); save();
    });
    return true;
  },
};
