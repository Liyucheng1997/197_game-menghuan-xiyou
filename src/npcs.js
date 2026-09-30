// NPC 外观、称号与闲聊
import { SCHOOLS } from './data.js';

const L = (o) => ({ skin: '#ffe0c4', hair: '#2a2020', hairStyle: 'topknot', cloth: '#8a7a5a', cloth2: '#e8dcc0', belt: '#5a4a2a', pants: '#5a4a3a', shoe: '#3a2a1a', ribbon: '#c83a2a', ...o });

export const NPCS = {
  laosun: { name: '老孙头', title: '新手指引', look: L({ hairStyle: 'oldman', hair: '#e8e8e8', cloth: '#7a6a4a', cloth2: '#d8c8a0', weapon: 'staff' }), chat: ['少侠，江湖路远，多加小心。'] },
  wangdasao: { name: '王大嫂', look: L({ hairStyle: 'bun', gender: 'f', cloth: '#c86a5a', cloth2: '#f8e0c8', belt: '#8a3a2a', pants: '#e8c0a8', ribbon: '#e8a040' }), chat: ['我家那口子天天出海，也不知道今天收成如何。'] },
  niudadan: { name: '牛大胆', look: L({ hairStyle: 'bandana', cloth: '#5a6a3a', cloth2: '#b8c090', ribbon: '#6a3a1a', big: true, beard: true, skin: '#e8b890' }), chat: ['俺牛大胆天不怕地不怕！就是……有点怕鬼。'] },
  lishanren: { name: '李善人', title: '建邺首富', look: L({ hairStyle: 'hat', cloth: '#8a3a6a', cloth2: '#f0c860', belt: '#f0c860', pants: '#5a2a4a', beard: true }), chat: ['行善积德，福寿绵长。'] },
  jy_inn: { name: '客栈老板', look: L({ hairStyle: 'hat', cloth: '#6a5a3a', cloth2: '#d8c890' }), chat: ['客官，住店吗？'] },
  jy_grocer: { name: '杂货店老板', look: L({ hairStyle: 'bandana', cloth: '#3a6a8a', cloth2: '#c8e0f0', ribbon: '#3a6a8a' }), chat: ['包子热乎的，快来买！'] },
  jy_weapon: { name: '武器店老板', look: L({ hairStyle: 'bald', skin: '#e8b080', cloth: '#5a3a2a', cloth2: '#a87a4a', big: true, weapon: 'axe' }), chat: ['好马配好鞍，好汉配好刀！'] },
  jy_guard: { name: '衙门守卫', look: L({ hairStyle: 'helmet', cloth: '#b83a2a', cloth2: '#f0c040', weapon: 'spear' }), chat: ['衙门重地，闲人免进。'] },
  jy_kid: { name: '小虎子', look: L({ hairStyle: 'twin', cloth: '#e8603a', cloth2: '#ffe0a0', ribbon: '#3a8ae8' }), chat: ['听说东海湾的沉船里有好多宝贝！', '我长大了也要当大侠！'] },
  jy_teacher: { name: '教书先生', look: L({ hairStyle: 'scholar', cloth: '#e8e4d8', cloth2: '#4a6a8a', weapon: 'fan' }), chat: ['温故而知新。战斗中可按“自动”让角色自行作战，但首领战最好亲自指挥。', '升级后属性点会按门派自动分配，也可在人物界面手动调整。'] },
  yufu: { name: '渔夫', look: L({ hairStyle: 'hat', cloth: '#5a7a8a', cloth2: '#c8d8e0', skin: '#e0b088', beard: true }), chat: ['海上风浪大，捕鱼可不容易。'] },
  dh_girl: { name: '赶海姑娘', look: L({ hairStyle: 'pony', gender: 'f', cloth: '#3aa8b8', cloth2: '#f0ffff', ribbon: '#ff8a6a' }), chat: ['退潮的时候能捡到好多贝壳哦～', '海毛虫有毒，被咬了要赶紧吃包子。'] },
  jn_woodcutter: { name: '樵夫', look: L({ hairStyle: 'bandana', cloth: '#6a5a3a', cloth2: '#a89a6a', ribbon: '#4a3a2a', weapon: 'axe' }), chat: ['林子里的树怪会自己回血，打它要趁早。', '往西北走就是长安城啦。'] },
  jn_farmer: { name: '农夫', look: L({ hairStyle: 'hat', cloth: '#8a8a4a', cloth2: '#e8e8b0' }), chat: ['今年收成不错，就是野猪老来拱庄稼。'] },
  ca_weapon: { name: '兵器铺老板', look: L({ hairStyle: 'bald', skin: '#e0a878', cloth: '#4a3a3a', cloth2: '#a86a4a', big: true, weapon: 'sword' }), chat: ['长安城最好的兵器都在这儿了！'] },
  ca_armor: { name: '服饰店老板娘', look: L({ hairStyle: 'bun', gender: 'f', cloth: '#e86a9a', cloth2: '#fff0f4', ribbon: '#ffd040' }), chat: ['人靠衣装，佛靠金装～'] },
  ca_guard: { name: '皇宫守卫', look: L({ hairStyle: 'helmet', cloth: '#d8b040', cloth2: '#fff4c0', ribbon: '#e8403a', weapon: 'spear' }), chat: ['大明宫乃天子居所，不得擅闯！'] },
  ca_acc: { name: '首饰店老板', look: L({ hairStyle: 'hat', cloth: '#6a4a8a', cloth2: '#e8d0ff', beard: true }), chat: ['项链腰带鞋子，一应俱全。'] },
  ca_drug: { name: '药店老板', look: L({ hairStyle: 'oldman', hair: '#e0e0e0', cloth: '#4a8a5a', cloth2: '#d8f0d8' }), chat: ['良药苦口利于病。'] },
  ca_grocer: { name: '杂货铺老板', look: L({ hairStyle: 'bandana', cloth: '#8a5a3a', cloth2: '#f0d0a0', ribbon: '#8a5a3a' }), chat: ['摄妖香、飞行符，出门必备！'] },
  ca_bank: { name: '钱庄老板', look: L({ hairStyle: 'hat', cloth: '#b8903a', cloth2: '#fff0c0', beard: true }), chat: ['本钱庄童叟无欺。', '听说钟馗那儿抓鬼的赏钱不少呢。'] },
  ca_inn: { name: '客栈老板', look: L({ hairStyle: 'hat', cloth: '#6a5a3a', cloth2: '#d8c890' }), chat: ['客官里边请！'] },
  yizhan: { name: '驿站老板', title: '门派传送', look: L({ hairStyle: 'hat', cloth: '#3a5a8a', cloth2: '#c8d8f0', beard: true }), chat: ['客官要去哪里？'] },
  yuantiangang: { name: '袁天罡', title: '钦天监', look: L({ hairStyle: 'oldman', hair: '#f0f0f0', cloth: '#3a4a7a', cloth2: '#e8e0b0', weapon: 'staff' }), chat: ['天象有变，妖魔将出。'] },
  ca_monk: { name: '化生寺僧人', look: L({ hairStyle: 'bald', cloth: '#e8a030', cloth2: '#c83a2a', belt: '#c83a2a' }), chat: ['阿弥陀佛，施主有礼了。'] },
  xiayi: { name: '侠义堂主', title: '招募伙伴', look: L({ hairStyle: 'topknot', cloth: '#2a3a4a', cloth2: '#e8403a', ribbon: '#e8403a', beard: true, weapon: 'sword' }), chat: ['独行江湖不如结伴而行。'] },
  petfairy: { name: '宠物仙子', title: '召唤兽', look: L({ hairStyle: 'fairy', gender: 'f', hair: '#ff9ac8', cloth: '#ffc8e0', cloth2: '#fff', ribbon: '#8ad0ff', weapon: 'ribbon' }), chat: ['召唤兽也需要细心照顾哦～'] },
  xiaoer: { name: '店小二', title: '宝图任务', look: L({ hairStyle: 'bandana', cloth: '#e8e0d0', cloth2: '#6a8aa8', ribbon: '#6a8aa8' }), chat: ['客官要点什么？'] },
  zhongkui: { name: '钟馗', title: '抓鬼任务', look: L({ hairStyle: 'hat', hair: '#1a1a1a', skin: '#d89a78', cloth: '#b82a2a', cloth2: '#1a1a2a', belt: '#1a1a2a', beard: true, big: true, weapon: 'sword' }), chat: ['人间鬼怪横行，谁愿随我降妖？'] },
  ca_scholar: { name: '赶考书生', look: L({ hairStyle: 'scholar', cloth: '#f0f0e8', cloth2: '#8a6ad8', weapon: 'fan' }), chat: ['大唐境外有土地公公，他知道白骨精的下落。', '伙伴可以在侠义堂招募，组满三人，打首领就轻松多了。'] },
  ca_girl: { name: '丫鬟', look: L({ hairStyle: 'twin', gender: 'f', cloth: '#8ac8e8', cloth2: '#fff', ribbon: '#ff8ab0' }), chat: ['小姐让我来买胭脂～'] },
  ca_beggar: { name: '乞丐', look: L({ hairStyle: 'bandana', cloth: '#8a7a6a', cloth2: '#6a5a4a', ribbon: '#5a4a3a', skin: '#d8b090', beard: true, weapon: 'staff' }), chat: ['行行好吧……对了，摄妖香能让你不遇到比你弱的妖怪。'] },
  ca_kid: { name: '顽童', look: L({ hairStyle: 'topknot', cloth: '#6ac86a', cloth2: '#fff', ribbon: '#e8403a' }), chat: ['花果山的猴子可凶了！'] },
  gj_hunter: { name: '猎户', look: L({ hairStyle: 'bandana', cloth: '#6a5a3a', cloth2: '#c8a870', ribbon: '#3a5a3a', weapon: 'spear' }), chat: ['山贼的营地就在北边，他们老大可厉害了。', '老虎速度快，黑熊皮糙肉厚会反击。'] },
  gj_monk: { name: '云游僧', look: L({ hairStyle: 'bald', cloth: '#a8804a', cloth2: '#6a4a2a', weapon: 'staff' }), chat: ['阿弥陀佛。前方是大唐境外，妖气冲天。'] },
  tudi: { name: '土地公公', title: '境外土地', look: L({ hairStyle: 'oldman', hair: '#f4f4f4', cloth: '#a8803a', cloth2: '#f0e0a0', weapon: 'staff' }), chat: ['老朽守护这方土地已有千年。'] },
  jw_merchant: { name: '行脚商人', look: L({ hairStyle: 'hat', cloth: '#8a6a3a', cloth2: '#e8c890', beard: true }), chat: ['境外风沙大，带足金创药再往里走。'] },
  hg_monkey: { name: '通臂猿猴', look: { shape: 'quad', kind: 'monkey', c1: '#b88a4a', c2: '#f0d8b0' }, chat: ['大圣爷不在，花果山的猴儿们都野了。', '这里的妖怪等级在40以上，小心！', '往西南走能到北俱芦洲，那里冰天雪地，妖怪更凶。'] },
  // 长安城 · 新玩法
  taibai: { name: '太白金星', title: '渡劫突破', look: L({ hairStyle: 'oldman', hair: '#f8f8f8', cloth: '#f4f0e0', cloth2: '#e8b830', belt: '#e8b830', beard: true, weapon: 'staff' }), chat: ['凡人修行到 69、89、109、129 级都会遇到瓶颈，须渡过心魔劫方能更进一步。'] },
  tower_keeper: { name: '镇塔神将', title: '镇妖塔', look: L({ hairStyle: 'helmet', cloth: '#6a4a8a', cloth2: '#f0c040', ribbon: '#f0c040', big: true, beard: true, weapon: 'spear' }), chat: ['镇妖塔中封印着历代妖魔，层数越高越凶险，首次登顶每层都有重赏！'] },
  mijing: { name: '秘境仙使', title: '秘境降妖', look: L({ hairStyle: 'fairy', gender: 'f', hair: '#6a8ae8', cloth: '#b8d8ff', cloth2: '#fff', ribbon: '#ffd0f0', weapon: 'ribbon' }), chat: ['秘境每日开放三次，一路闯关还能挑选仙缘祝福，越战越强！'] },
  fuzi: { name: '书院夫子', title: '三界答题', look: L({ hairStyle: 'scholar', hair: '#e8e8e8', cloth: '#f0ece0', cloth2: '#8a3a2a', beard: true, weapon: 'fan' }), chat: ['学海无涯。每日十道题，答对有赏，全对更有仙玉相赠。'] },
  arena: { name: '论剑长老', title: '华山论剑', look: L({ hairStyle: 'topknot', hair: '#c8c8c8', cloth: '#3a3a4a', cloth2: '#e8e8f0', beard: true, weapon: 'sword' }), chat: ['三界英豪齐聚论剑台，每日五场切磋，按积分评定段位。'] },
  zhenbao: { name: '藏宝阁掌柜', title: '仙玉商城', look: L({ hairStyle: 'hat', cloth: '#a83a2a', cloth2: '#ffd040', belt: '#ffd040', beard: true }), chat: ['客官，祈愿、商城、福利一应俱全，神兽也在这里等你！'] },
  // 东海龙宫
  lg_guicheng: { name: '龟丞相', title: '龙宫丞相', look: L({ hairStyle: 'oldman', hair: '#e8e8e8', skin: '#c8e0b8', cloth: '#3a7a5a', cloth2: '#d8c88a', belt: '#8a6a2a', beard: true, weapon: 'staff' }), chat: ['龙宫宝物被盗，龙王寝食难安呐……'] },
  lg_xia: { name: '虾兵小贩', title: '补给', look: { shape: 'shrimp', c1: '#ff8a6a', c2: '#ffd8c0' }, chat: ['海底物资稀缺，客官要点什么？'] },
  // 北俱芦洲
  bj_elder: { name: '雪山老人', title: '北俱芦洲', look: L({ hairStyle: 'oldman', hair: '#ffffff', cloth: '#8aa8c8', cloth2: '#f0f4ff', beard: true, weapon: 'staff' }), chat: ['北俱芦洲终年飞雪，雪狼成群，年轻人小心些。'] },
  bj_shop: { name: '行脚客商', title: '补给', look: L({ hairStyle: 'hat', cloth: '#6a5a7a', cloth2: '#e0d8f0', beard: true }), chat: ['翻过雪山就是南天门了，带足药品再走。'] },
  // 火焰山
  hy_tudi: { name: '火焰山土地', title: '火焰山', look: L({ hairStyle: 'oldman', hair: '#f4f4f4', cloth: '#c8603a', cloth2: '#f8d8a0', weapon: 'staff' }), chat: ['八百里火焰，寸草不生，唯有芭蕉扇能灭此火。'] },
  hy_shop: { name: '避火商人', title: '补给', look: L({ hairStyle: 'bandana', cloth: '#8a3a2a', cloth2: '#f0c080', ribbon: '#e8603a', skin: '#e0a878' }), chat: ['火焰山里什么都贵，客官多担待。'] },
  // 无底洞
  wd_monk: { name: '落难僧人', title: '无底洞', look: L({ hairStyle: 'bald', cloth: '#c89a5a', cloth2: '#8a5a3a', weapon: 'staff' }), chat: ['阿弥陀佛……洞中妖精害人无数，施主救我！'] },
  // 南天门
  nt_general: { name: '增长天王', title: '南天门守将', look: L({ hairStyle: 'helmet', cloth: '#3a6ab8', cloth2: '#f0d060', ribbon: '#e8403a', big: true, beard: true, weapon: 'sword' }), chat: ['妖王大军压境，南天门绝不能失守！'] },
  nt_shop: { name: '天庭仙官', title: '补给', look: L({ hairStyle: 'hat', cloth: '#f0f0f8', cloth2: '#6a8ae8', beard: true, weapon: 'fan' }), chat: ['蟠桃仙露，天界特产，凡间可买不到。'] },
  // 幽冥地府
  ym_panguan: { name: '崔判官', title: '幽冥地府', look: L({ hairStyle: 'hat', hair: '#1a1a1a', skin: '#c8a888', cloth: '#8a2a2a', cloth2: '#1a1a2a', beard: true, weapon: 'staff' }), chat: ['生死簿上的名字接连消失，阴阳两界都要乱了！'] },
  ym_diting: { name: '谛听', title: '神兽', look: { shape: 'quad', kind: 'fox', c1: '#f4f0e8', c2: '#e8b830' }, chat: ['……（谛听伏地而听，似乎知晓三界一切秘密）'] },
  // 小雷音寺
  ly_mile: { name: '弥勒佛', title: '小雷音寺', look: L({ hairStyle: 'bald', skin: '#ffe0b8', cloth: '#e8a030', cloth2: '#fff0c0', belt: '#c83a2a', big: true }), chat: ['呵呵呵，我那司磬的黄眉童子偷了宝贝下界，施主可要当心。'] },
  ly_shop: { name: '香客', title: '补给', look: L({ hairStyle: 'hat', cloth: '#8a6a3a', cloth2: '#f0e0b0', beard: true }), chat: ['这小雷音寺古怪得很，进去的人都没出来过。'] },
};

const MASTER_LOOK = {
  datang: L({ hairStyle: 'helmet', cloth: '#b83a2a', cloth2: '#f0c040', big: true, beard: true, weapon: 'axe' }),
  huasheng: L({ hairStyle: 'bald', cloth: '#e8a030', cloth2: '#c83a2a', belt: '#c83a2a', beard: true, weapon: 'staff' }),
  nverer: L({ hairStyle: 'bun', hair: '#e8e8e8', gender: 'f', cloth: '#8a5aa8', cloth2: '#f0d8ff', weapon: 'staff' }),
  fangcun: L({ hairStyle: 'oldman', hair: '#f4f4f4', cloth: '#f0f0f8', cloth2: '#4a6aa8', weapon: 'staff' }),
  longgong: L({ hairStyle: 'dragon', hair: '#2e5aa8', cloth: '#2f6cb8', cloth2: '#ffe38a', beard: true, weapon: 'spear' }),
  putuo: L({ hairStyle: 'longhair', hair: '#1a1a2a', gender: 'f', cloth: '#fafafa', cloth2: '#8ad0c8', ribbon: '#8ad0c8', weapon: 'ribbon' }),
  tiangong: L({ hairStyle: 'helmet', cloth: '#d8b040', cloth2: '#fff4c0', ribbon: '#e8403a', beard: true, weapon: 'spear' }),
  wuzhuang: L({ hairStyle: 'oldman', hair: '#f0f0f0', cloth: '#4a8a5a', cloth2: '#f0f8f0', weapon: 'fan' }),
  mowang: L({ hairStyle: 'bull', skin: '#8a5a3a', cloth: '#2a1a1a', cloth2: '#c83a2a', big: true, weapon: 'axe' }),
  shituo: L({ hairStyle: 'demon', hair: '#e8b030', skin: '#f0c890', cloth: '#8a5a1a', cloth2: '#f0d060', big: true, weapon: 'axe' }),
  pansi: L({ hairStyle: 'fox', hair: '#f0f0ff', gender: 'f', cloth: '#6a3a8a', cloth2: '#e8c8ff', tail: '#f0f0ff', weapon: 'whip' }),
  difu: L({ hairStyle: 'bald', cloth: '#d8a830', cloth2: '#8a2a2a', belt: '#8a2a2a', weapon: 'staff' }),
};
const DISC_COLORS = { datang: '#c83a2a', huasheng: '#e8a030', nverer: '#ff8ab0', fangcun: '#6a8ae8', longgong: '#3a9ac8', putuo: '#8ad0c8', tiangong: '#e8c040', wuzhuang: '#5aa86a', mowang: '#8a2a2a', shituo: '#a87a3a', pansi: '#8a5aa8', difu: '#4a4a6a' };
for (const id in SCHOOLS) {
  const sc = SCHOOLS[id];
  NPCS['master_' + id] = { name: sc.master, title: sc.name + '师父', look: MASTER_LOOK[id], chat: ['好好修炼，莫负师门。'] };
  NPCS['disciple_' + id] = { name: sc.name + '弟子', look: L({ hairStyle: 'topknot', cloth: DISC_COLORS[id], cloth2: '#fff' }), chat: ['每天完成师门任务，可以获得大量经验和银两。', '学习技能需要花费银两，技能等级不能超过人物等级+10。'] };
}
