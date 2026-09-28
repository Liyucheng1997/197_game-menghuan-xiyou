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
  hg_monkey: { name: '通臂猿猴', look: { shape: 'quad', kind: 'monkey', c1: '#b88a4a', c2: '#f0d8b0' }, chat: ['大圣爷不在，花果山的猴儿们都野了。', '这里的妖怪等级在40以上，小心！'] },
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
