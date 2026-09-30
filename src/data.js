// 游戏数据：种族、角色、门派、技能、物品、装备、怪物、伙伴
export const MAX_LEVEL = 150;
// 等级瓶颈：69/89/109/129 级需在长安城太白金星处渡劫突破后才能继续升级
export const LEVEL_CAPS = [69, 89, 109, 129, 150];
export const PET_MAX = 6;
export const PARTY_MAX = 3;
export const BAG_SIZE = 42;

export const ATTRS = [
  ['con', '体质', '提升气血'],
  ['mag', '魔力', '提升魔法、灵力'],
  ['str', '力量', '提升伤害'],
  ['end', '耐力', '提升防御'],
  ['agi', '敏捷', '提升速度'],
];

export const RACES = {
  ren: { name: '人族', base: { con: 10, mag: 10, str: 10, end: 10, agi: 10 } },
  xian: { name: '仙族', base: { con: 9, mag: 13, str: 9, end: 10, agi: 9 } },
  mo: { name: '魔族', base: { con: 12, mag: 9, str: 12, end: 9, agi: 8 } },
};

// 角色外观：用于程序绘制 Q 版小人
export const ROLES = {
  jxk: { name: '剑侠客', race: 'ren', gender: 'm', weapon: 'sword', desc: '仗剑走天涯的少年侠客，攻守兼备。',
    look: { skin: '#ffe0c4', hair: '#2b2230', hairStyle: 'topknot', cloth: '#3f7fd0', cloth2: '#f1f4ff', belt: '#c83a2a', pants: '#2c3a66', shoe: '#3a2a22', ribbon: '#e2433a' } },
  xys: { name: '逍遥生', race: 'ren', gender: 'm', weapon: 'fan', desc: '风流倜傥的书生，擅长以扇入道。',
    look: { skin: '#ffe4cc', hair: '#241c28', hairStyle: 'scholar', cloth: '#f4f1e6', cloth2: '#6db38f', belt: '#4a8a6a', pants: '#dcd8c8', shoe: '#384848', ribbon: '#6db38f' } },
  fyn: { name: '飞燕女', race: 'ren', gender: 'f', weapon: 'ring', desc: '身轻如燕的少女，灵巧敏捷。',
    look: { skin: '#ffe6d2', hair: '#3a2430', hairStyle: 'twin', cloth: '#ff8fb1', cloth2: '#fff0f5', belt: '#e2436e', pants: '#ffd1de', shoe: '#c83a6a', ribbon: '#ff5a8a' } },
  ynx: { name: '英女侠', race: 'ren', gender: 'f', weapon: 'whip', desc: '英姿飒爽的女侠，鞭法凌厉。',
    look: { skin: '#ffe0c8', hair: '#40221a', hairStyle: 'pony', cloth: '#d8483a', cloth2: '#ffe2a6', belt: '#f0b43a', pants: '#7a2a2a', shoe: '#402020', ribbon: '#f0b43a' } },
  ltz: { name: '龙太子', race: 'xian', gender: 'm', weapon: 'spear', desc: '东海龙王之子，龙角初生，气宇轩昂。',
    look: { skin: '#ffe4d0', hair: '#2e5aa8', hairStyle: 'dragon', cloth: '#2f9cb8', cloth2: '#ffe38a', belt: '#e8b830', pants: '#1f5a78', shoe: '#1a3a50', ribbon: '#ffd24a' } },
  xce: { name: '玄彩娥', race: 'xian', gender: 'f', weapon: 'ribbon', desc: '月宫仙子，彩带翩翩，仙气缭绕。',
    look: { skin: '#fff0e4', hair: '#8a6ad8', hairStyle: 'fairy', cloth: '#b99cff', cloth2: '#fff6ff', belt: '#ff9ad2', pants: '#e8dcff', shoe: '#8a6ad8', ribbon: '#ff9ad2' } },
  jmw: { name: '巨魔王', race: 'mo', gender: 'm', weapon: 'axe', desc: '力大无穷的魔族勇士，一斧开山。',
    look: { skin: '#f2c8a8', hair: '#c83020', hairStyle: 'demon', cloth: '#5a3a7a', cloth2: '#e8b830', belt: '#2a1a2a', pants: '#3a2450', shoe: '#2a1a1a', ribbon: '#e8b830', big: true } },
  hmr: { name: '狐美人', race: 'mo', gender: 'f', weapon: 'claw', desc: '千年灵狐所化，妩媚而致命。',
    look: { skin: '#fff0e0', hair: '#f08a3a', hairStyle: 'fox', cloth: '#7a2a5a', cloth2: '#ffcf8a', belt: '#e84a8a', pants: '#5a1a40', shoe: '#401030', ribbon: '#ffcf8a', tail: '#f08a3a' } },
};

export const WEAPON_NAMES = {
  sword: ['青铜短剑', '铁齿剑', '吴越剑', '青锋剑', '龙泉剑', '黄金剑', '游龙剑', '北斗七星剑', '碧玉剑', '鱼肠', '倚天', '湛卢', '魏武青虹', '灵犀神剑', '四法青云', '霜冷九州'],
  fan: ['折扇', '铁骨扇', '精钢扇', '铁面扇', '百折扇', '劈水扇', '神火扇', '阴风扇', '风云雷电', '太极', '玉龙', '秋风', '画龙点睛', '秋水人家', '逍遥江湖', '浩气长舒'],
  ring: ['黄铜圈', '精钢日月圈', '离情环', '金刺轮', '风火圈', '赤炎环', '蛇形月', '子母双月', '斜月狼牙', '如意', '乾坤', '月光双环', '别情离恨', '金玉双环', '九天金线', '无关风月'],
  whip: ['牛皮鞭', '牛筋鞭', '乌龙鞭', '钢结鞭', '蛇骨鞭', '玉竹金铃', '青藤柳叶鞭', '雷鸣嗜血鞭', '混元金钩', '龙筋拂尘', '百花', '吹雪', '游龙惊鸿', '仙人指路', '血之刺藤', '牧云清歌'],
  spear: ['红缨枪', '曲尖枪', '锯齿矛', '乌金三叉戟', '火焰枪', '墨杆金钩', '玄铁矛', '金蛇信', '丈八点钢矛', '暗夜', '梨花', '霹雳', '刑天之逆', '五虎断魂', '飞龙在天', '天龙破城'],
  ribbon: ['五色缎带', '幻彩银纱', '金丝彩带', '无极丝', '天蚕丝带', '云龙绸带', '七彩罗刹', '缚神绫', '九天仙绫', '彩虹', '流云', '碧波', '秋水落霞', '晃金仙绳', '此最相思', '揽月摘星'],
  axe: ['青铜斧', '开山斧', '双面斧', '双弦钺', '精钢禅钺', '黄金钺', '乌金鬼头镰', '狂魔镰', '恶龙之齿', '破魄', '肃魂', '无敌', '五丁开山', '元神禁锢', '护法灭魔', '碧血干戚'],
  claw: ['铁爪', '天狼爪', '幽冥鬼爪', '青龙牙', '勾魂爪', '玄冰刺', '青刚刺', '华光刺', '龙鳞刺', '撕天', '毒牙', '胭脂', '九阴勾魂', '雪蚕之刺', '贵霜之牙', '忘川三途'],
};
export const WEAPON_TYPE_NAMES = { sword: '剑', fan: '扇', ring: '环', whip: '鞭', spear: '枪', ribbon: '飘带', axe: '斧钺', claw: '爪刺' };

export const SLOTS = [
  ['weapon', '武器'], ['helm', '头盔'], ['neck', '项链'], ['armor', '衣服'], ['belt', '腰带'], ['boots', '鞋子'],
];
export const EQUIP_NAMES = {
  helm: ['方巾', '布帽', '面具', '纶巾', '缨络丝带', '羊角盔', '水晶帽', '乾坤帽', '黑魔冠', '白玉龙冠', '水晶夔帽', '翡翠曜冠', '金丝黑玉冠', '白玉琉璃冠', '兽鬼珐琅面', '紫金磐龙冠'],
  armor: ['布衣', '皮衣', '鳞甲', '锁子甲', '紧身衣', '钢甲', '夜魔披风', '龙骨甲', '死亡斗篷', '神谕披风', '珊瑚玉衣', '金蚕披风', '乾坤护心甲', '蝉翼金丝甲', '金丝鱼鳞甲', '紫金磐龙甲'],
  neck: ['护身符', '五色飞石', '珍珠链', '骷髅吊坠', '苍魂珠', '江湖夜雨', '九宫坠', '荧光坠子', '高速之星', '风月宝链', '八卦坠', '碧水青龙', '鬼牙攫魂', '万里卷云', '疾风之铃', '七彩玲珑'],
  belt: ['腰带', '缎带', '银腰带', '水晶腰带', '琥珀腰链', '白面狼牙', '乱牙咬', '魔童大牙', '攫魂铃', '双魂引', '兽王腰带', '百窜云', '八卦锻带', '圣王坠', '幻彩玉带', '磐龙凤翔带'],
  boots: ['布鞋', '牛皮靴', '马靴', '侠客履', '神行靴', '绿靴', '追星踏月', '九州履', '万里追云履', '踏雪无痕', '平步青云', '追云逐电', '乾坤天罡履', '七星逐月靴', '碧霞彩云履', '金丝逐日履'],
};
// 每档装备的基础属性（tier 0..15，需求等级 tier*10）
export const MAX_TIER = 15;
export const TOWER_MAX = 125;   // 镇妖塔层数
export const EQUIP_BASE = {
  weapon: t => ({ atk: 12 + t * 26 }),
  helm: t => ({ def: 4 + t * 9, mp: 10 + t * 12 }),
  armor: t => ({ def: 8 + t * 18 }),
  neck: t => ({ mpow: 5 + t * 11 }),
  belt: t => ({ hp: 25 + t * 45, def: 2 + t * 4 }),
  boots: t => ({ spd: 3 + t * 5, def: 2 + t * 4 }),
};
export const STAT_NAMES = { hp: '气血', mp: '魔法', atk: '伤害', def: '防御', spd: '速度', mpow: '灵力' };
export const RARITY = [
  { name: '普通', color: '#f4efe0' },
  { name: '精良', color: '#6fe07a' },
  { name: '稀有', color: '#5ab8ff' },
  { name: '史诗', color: '#d68aff' },
];

// ---------------- 门派 ----------------
export const SCHOOLS = {
  datang: { name: '大唐官府', race: 'ren', master: '程咬金', role: 'phys', theme: 'palace', skills: ['hsqj', 'hfzr', 'sqj'], passive: 'wgzd', build: { str: 4, con: 1 }, desc: '物理输出，横扫千军一往无前' },
  huasheng: { name: '化生寺', race: 'ren', master: '空度禅师', role: 'heal', theme: 'temple', skills: ['tqgg', 'wfcb', 'jghf'], passive: 'xcff', build: { mag: 3, con: 2 }, desc: '治疗辅助，推气过宫妙手回春' },
  nverer: { name: '女儿村', race: 'ren', master: '孙婆婆', role: 'seal', theme: 'village', skills: ['mthy', 'rhjy', 'ylhs'], passive: 'byxh', build: { agi: 3, mag: 2 }, desc: '速度封印，暗器淬毒' },
  fangcun: { name: '方寸山', race: 'ren', master: '菩提祖师', role: 'seal', theme: 'taoist', skills: ['wlz', 'cmf', 'sxf'], passive: 'htj', build: { mag: 3, con: 2 }, desc: '符咒封印，五雷专克鬼怪' },
  longgong: { name: '龙宫', race: 'xian', master: '东海龙王', role: 'magic', theme: 'sea', skills: ['ljyj', 'lt', 'elxz'], passive: 'jlj', build: { mag: 4, con: 1 }, desc: '群体法术，龙卷雨击横扫千里' },
  putuo: { name: '普陀山', race: 'xian', master: '观音姐姐', role: 'heal', theme: 'island', skills: ['rgh', 'pdzs', 'ldjt'], passive: 'jgj', build: { mag: 3, con: 2 }, desc: '持续治疗，日光华无视防御' },
  tiangong: { name: '天宫', race: 'xian', master: '李靖', role: 'seal', theme: 'heaven', skills: ['tlz', 'cuoluan', 'wlhd'], passive: 'tgq', build: { str: 3, con: 2 }, desc: '雷霆封印，五雷轰顶' },
  wuzhuang: { name: '五庄观', race: 'xian', master: '镇元子', role: 'seal', theme: 'garden', skills: ['yyjf', 'rqkq', 'smzq'], passive: 'zyx', build: { str: 3, end: 2 }, desc: '剑法封印兼修，乾坤袖里藏' },
  mowang: { name: '魔王寨', race: 'mo', master: '牛魔王', role: 'magic', theme: 'volcano', skills: ['fszs', 'smzh', 'nj'], passive: 'hnz', build: { mag: 4, con: 1 }, desc: '烈火法术，飞砂走石' },
  shituo: { name: '狮驼岭', race: 'mo', master: '大大王', role: 'phys', theme: 'rock', skills: ['bs', 'yj', 'sb'], passive: 'msg', build: { str: 4, con: 1 }, desc: '变身狂攻，鹰击长空' },
  pansi: { name: '盘丝洞', race: 'mo', master: '白晶晶', role: 'seal', theme: 'web', skills: ['hqmm', 'tldw', 'psz'], passive: 'qbas', build: { agi: 2, mag: 3 }, desc: '魅惑封印，天罗地网' },
  difu: { name: '阴曹地府', race: 'mo', master: '地藏王', role: 'magic', theme: 'underworld', skills: ['ylnl', 'pgl', 'sfd'], passive: 'ymj', build: { mag: 3, con: 2 }, desc: '幽冥之术，尸毒阎罗' },
};

// ---------------- 技能 ----------------
// kind: phys 物理 / magic 法术 / true 固定伤害 / percent 百分比 / heal 治疗 / hot 持续恢复 / revive 复活
//       seal 封印 / buff 增益 / debuff 减益 / charge 蓄力 / poison 毒 / passive 心法
// count(lv) 目标数；mp(lv) 消耗
const lvCount = (base, per, max) => lv => Math.min(max, base + Math.floor(lv / per));
export const SKILLS = {
  // 大唐官府
  hsqj: { name: '横扫千军', kind: 'phys', hits: 3, mult: 0.78, mp: lv => 20 + lv, rest: 1, hpReq: 0.5, fx: 'slash', desc: '连续攻击同一目标三次，下回合需休息。气血需高于50%。' },
  hfzr: { name: '后发制人', kind: 'charge', mult: 2.3, mp: lv => 25 + lv, fx: 'slash', desc: '本回合蓄力防御，下回合对目标造成巨额伤害。' },
  sqj: { name: '杀气诀', kind: 'buff', target: 'self', stat: 'atk', pct: 0.3, turns: 4, mp: lv => 20 + (lv >> 1), fx: 'buffRed', desc: '提升自身30%伤害，持续4回合。' },
  wgzd: { name: '为官之道', kind: 'passive', bonus: { atk: 2.2, hp: 2 }, desc: '心法：每级提升伤害与气血。' },
  // 化生寺
  tqgg: { name: '推气过宫', kind: 'heal', target: 'allyGroup', count: lvCount(2, 12, 5), mult: 0.55, flat: 40, mp: lv => 30 + lv, fx: 'heal', desc: '为多名队友恢复气血。' },
  wfcb: { name: '我佛慈悲', kind: 'revive', target: 'allyDead', pct: 0.5, mp: lv => 60 + lv, fx: 'holy', desc: '复活一名倒地队友并恢复50%气血。' },
  jghf: { name: '金刚护法', kind: 'buff', target: 'team', stat: 'atk', pct: 0.15, turns: 4, mp: lv => 40 + lv, fx: 'buffGold', desc: '提升全队15%伤害，持续4回合。' },
  xcff: { name: '小乘佛法', kind: 'passive', bonus: { mpow: 1.4, hp: 3 }, desc: '心法：每级提升灵力与气血。' },
  // 女儿村
  mthy: { name: '满天花雨', kind: 'magic', mult: 1.0, flat: 20, mp: lv => 18 + (lv >> 1), poison: 0.7, fx: 'petal', desc: '以花瓣暗器伤敌，有几率使其中毒。' },
  rhjy: { name: '如花解语', kind: 'seal', turns: 3, rate: 0.65, mp: lv => 25 + (lv >> 1), fx: 'seal', desc: '封印一名敌人，使其无法行动。' },
  ylhs: { name: '雨落寒沙', kind: 'magic', target: 'enemyGroup', count: lvCount(2, 15, 4), mult: 0.6, flat: 15, poison: 0.4, mp: lv => 30 + lv, fx: 'petal', desc: '对多名敌人造成伤害并可能中毒。' },
  byxh: { name: '闭月羞花', kind: 'passive', bonus: { spd: 1.0, mpow: 0.8 }, desc: '心法：每级提升速度与灵力。' },
  // 方寸山
  wlz: { name: '五雷咒', kind: 'magic', mult: 1.2, flat: 25, vsGhost: 1.8, mp: lv => 22 + (lv >> 1), fx: 'thunder', desc: '召唤天雷轰击敌人，对鬼怪伤害更高且令其无法复活。' },
  cmf: { name: '催眠符', kind: 'seal', turns: 3, rate: 0.7, mp: lv => 25 + (lv >> 1), fx: 'seal', desc: '封印一名敌人，使其昏睡不醒。' },
  sxf: { name: '失心符', kind: 'debuff', stat: ['def', 'mpow'], pct: 0.3, turns: 4, mp: lv => 20 + (lv >> 1), fx: 'curse', desc: '降低目标30%防御与灵力。' },
  htj: { name: '黄庭经', kind: 'passive', bonus: { mpow: 1.1, hp: 3 }, desc: '心法：每级提升灵力与气血。' },
  // 龙宫
  ljyj: { name: '龙卷雨击', kind: 'magic', target: 'enemyGroup', count: lvCount(2, 10, 5), mult: 0.85, flat: 20, mp: lv => 30 + lv, fx: 'water', desc: '召唤暴雨龙卷攻击多名敌人。' },
  lt: { name: '龙腾', kind: 'magic', mult: 1.55, flat: 30, mp: lv => 28 + lv, fx: 'dragon', desc: '化身神龙冲击单个敌人，伤害极高。' },
  elxz: { name: '二龙戏珠', kind: 'magic', target: 'enemyGroup', count: () => 2, mult: 1.15, flat: 25, mp: lv => 35 + lv, fx: 'water', desc: '双龙出海攻击两名敌人。' },
  jlj: { name: '九龙诀', kind: 'passive', bonus: { mpow: 1.6, mp: 3 }, desc: '心法：每级提升灵力与魔法。' },
  // 普陀山
  rgh: { name: '日光华', kind: 'true', mult: 0.9, flat: 30, mp: lv => 22 + (lv >> 1), fx: 'light', desc: '以日光灼烧敌人，造成无视防御的伤害。' },
  pdzs: { name: '普度众生', kind: 'hot', target: 'allyGroup', count: lvCount(1, 20, 3), mult: 0.32, flat: 20, turns: 4, mp: lv => 28 + lv, fx: 'heal', desc: '使队友每回合恢复气血，持续4回合。' },
  ldjt: { name: '灵动九天', kind: 'buff', target: 'team', stat: 'mpow', pct: 0.2, turns: 4, mp: lv => 35 + lv, fx: 'buffBlue', desc: '提升全队20%灵力，持续4回合。' },
  jgj: { name: '金刚经', kind: 'passive', bonus: { mpow: 1.3, def: 1.0 }, desc: '心法：每级提升灵力与防御。' },
  // 天宫
  tlz: { name: '天雷斩', kind: 'phys', hits: 1, mult: 1.35, mp: lv => 22 + (lv >> 1), fx: 'thunder', desc: '引天雷入刃，重创单个敌人。' },
  cuoluan: { name: '错乱', kind: 'seal', turns: 2, rate: 0.72, mp: lv => 25 + (lv >> 1), fx: 'seal', desc: '使敌人神志错乱无法行动。' },
  wlhd: { name: '五雷轰顶', kind: 'percent', pct: 0.25, rate: 0.7, mp: lv => 45 + lv, fx: 'thunder', desc: '有70%几率削减目标25%当前气血（首领减半）。' },
  tgq: { name: '天罡气', kind: 'passive', bonus: { atk: 1.6, def: 1.0 }, desc: '心法：每级提升伤害与防御。' },
  // 五庄观
  yyjf: { name: '烟雨剑法', kind: 'phys', hits: 2, mult: 0.9, mp: lv => 20 + (lv >> 1), fx: 'slash', desc: '剑光如烟雨，连击目标两次。' },
  rqkq: { name: '日月乾坤', kind: 'seal', turns: 3, rate: 0.75, mp: lv => 30 + (lv >> 1), fx: 'seal', desc: '将敌人收入袖中，使其无法行动。' },
  smzq: { name: '生命之泉', kind: 'hot', target: 'ally', mult: 0.5, flat: 30, turns: 4, mp: lv => 25 + (lv >> 1), fx: 'heal', desc: '使一名队友每回合恢复大量气血。' },
  zyx: { name: '周易学', kind: 'passive', bonus: { def: 1.5, hp: 3 }, desc: '心法：每级提升防御与气血。' },
  // 魔王寨
  fszs: { name: '飞砂走石', kind: 'magic', target: 'enemyGroup', count: lvCount(2, 12, 5), mult: 0.88, flat: 20, mp: lv => 30 + lv, fx: 'fire', desc: '烈火飞石攻击多名敌人。' },
  smzh: { name: '三昧真火', kind: 'magic', mult: 1.6, flat: 30, mp: lv => 28 + lv, fx: 'fire', desc: '以三昧真火灼烧单个敌人。' },
  nj: { name: '牛劲', kind: 'buff', target: 'self', stat: 'mpow', pct: 0.3, turns: 4, mp: lv => 20 + (lv >> 1), fx: 'buffRed', desc: '提升自身30%灵力，持续4回合。' },
  hnz: { name: '火牛阵', kind: 'passive', bonus: { mpow: 1.5, hp: 2 }, desc: '心法：每级提升灵力与气血。' },
  // 狮驼岭
  bs: { name: '变身', kind: 'buff', target: 'self', stat: 'atk', pct: 0.35, turns: 5, spd: 0.1, mp: lv => 20 + (lv >> 1), fx: 'buffRed', desc: '化出狮驼真身，提升35%伤害，持续5回合。' },
  yj: { name: '鹰击', kind: 'phys', target: 'enemyGroup', count: lvCount(2, 12, 5), hits: 1, mult: 0.8, rest: 1, mp: lv => 30 + lv, fx: 'claw', desc: '化鹰俯冲攻击多名敌人，下回合需休息。' },
  sb: { name: '狮搏', kind: 'phys', hits: 1, mult: 1.6, mp: lv => 22 + (lv >> 1), fx: 'claw', desc: '猛狮扑击单个敌人。' },
  msg: { name: '魔兽神功', kind: 'passive', bonus: { atk: 1.8, hp: 4 }, desc: '心法：每级提升伤害与气血。' },
  // 盘丝洞
  hqmm: { name: '含情脉脉', kind: 'seal', turns: 3, rate: 0.7, mp: lv => 25 + (lv >> 1), fx: 'charm', desc: '魅惑一名敌人，使其无法行动。' },
  tldw: { name: '天罗地网', kind: 'magic', target: 'enemyGroup', count: lvCount(2, 15, 4), mult: 0.6, flat: 15, slow: 0.3, mp: lv => 30 + lv, fx: 'web', desc: '以蛛网困住多名敌人，造成伤害并减速。' },
  psz: { name: '盘丝阵', kind: 'buff', target: 'team', stat: 'def', pct: 0.25, turns: 4, mp: lv => 35 + lv, fx: 'buffBlue', desc: '提升全队25%防御，持续4回合。' },
  qbas: { name: '秋波暗送', kind: 'passive', bonus: { spd: 1.0, mpow: 0.9 }, desc: '心法：每级提升速度与灵力。' },
  // 阴曹地府
  ylnl: { name: '阎罗令', kind: 'magic', target: 'enemyGroup', count: lvCount(2, 10, 5), mult: 0.8, flat: 20, mp: lv => 30 + lv, fx: 'dark', desc: '阎罗催命，攻击多名敌人。' },
  pgl: { name: '判官令', kind: 'magic', mult: 1.15, flat: 25, drainMp: 0.5, mp: lv => 22 + (lv >> 1), fx: 'dark', desc: '伤害单个敌人并吸取其魔法。' },
  sfd: { name: '尸腐毒', kind: 'magic', mult: 0.5, flat: 10, poison: 1, poisonPct: 0.1, mp: lv => 22 + (lv >> 1), fx: 'poison', desc: '使敌人身中尸毒，每回合流失10%气血。' },
  ymj: { name: '幽冥术', kind: 'passive', bonus: { mpow: 1.2, hp: 3 }, desc: '心法：每级提升灵力与气血。' },

  // ---------- 召唤兽/怪物技能 ----------
  leiji: { name: '雷击', kind: 'magic', mult: 1.0, flat: 15, mp: () => 20, fx: 'thunder', pet: true, desc: '法术：雷电攻击单个目标。' },
  luoyan: { name: '落岩', kind: 'magic', mult: 1.0, flat: 15, mp: () => 20, fx: 'rock', pet: true, desc: '法术：落石攻击单个目标。' },
  shuigong: { name: '水攻', kind: 'magic', mult: 1.0, flat: 15, mp: () => 20, fx: 'water', pet: true, desc: '法术：水流攻击单个目标。' },
  liehuo: { name: '烈火', kind: 'magic', mult: 1.0, flat: 15, mp: () => 20, fx: 'fire', pet: true, desc: '法术：火焰攻击单个目标。' },
  benlei: { name: '奔雷咒', kind: 'magic', target: 'enemyGroup', count: () => 3, mult: 0.75, flat: 20, mp: () => 45, fx: 'thunder', pet: true, rare: true, desc: '高级法术：雷电攻击三个目标。' },
  shuiman: { name: '水漫金山', kind: 'magic', target: 'enemyGroup', count: () => 3, mult: 0.75, flat: 20, mp: () => 45, fx: 'water', pet: true, rare: true, desc: '高级法术：洪水攻击三个目标。' },
  taishan: { name: '泰山压顶', kind: 'magic', target: 'enemyGroup', count: () => 3, mult: 0.75, flat: 20, mp: () => 45, fx: 'rock', pet: true, rare: true, desc: '高级法术：巨石攻击三个目标。' },
  diyu: { name: '地狱烈火', kind: 'magic', target: 'enemyGroup', count: () => 3, mult: 0.75, flat: 20, mp: () => 45, fx: 'fire', pet: true, rare: true, desc: '高级法术：烈焰攻击三个目标。' },
  bisha: { name: '必杀', kind: 'trait', pet: true, desc: '物理攻击有20%几率造成1.6倍暴击。' },
  lianji: { name: '连击', kind: 'trait', pet: true, desc: '物理攻击有35%几率追加一次攻击。' },
  xixue: { name: '吸血', kind: 'trait', pet: true, desc: '物理攻击时吸取伤害的25%。' },
  fanji: { name: '反击', kind: 'trait', pet: true, desc: '受到物理攻击时有30%几率反击。' },
  qiangli: { name: '强力', kind: 'trait', pet: true, bonus: { atkPct: 0.12 }, desc: '伤害提升12%。' },
  fangyu: { name: '防御', kind: 'trait', pet: true, bonus: { defPct: 0.15 }, desc: '防御提升15%。' },
  minjie: { name: '敏捷', kind: 'trait', pet: true, bonus: { spdPct: 0.15 }, desc: '速度提升15%。' },
  shenyou: { name: '神佑复生', kind: 'trait', pet: true, rare: true, desc: '倒地时有25%几率满血复活。' },
  zaisheng: { name: '再生', kind: 'trait', pet: true, desc: '每回合恢复少量气血。' },
  du: { name: '毒', kind: 'trait', pet: true, desc: '物理攻击有30%几率使目标中毒。' },
  qugui: { name: '驱鬼', kind: 'trait', pet: true, desc: '攻击鬼魂类目标时伤害提升，且使其无法复活。' },
  guihun: { name: '鬼魂术', kind: 'trait', pet: true, desc: '倒地后3回合复活（每场一次）。' },
  mingsi: { name: '冥思', kind: 'trait', pet: true, desc: '每回合恢复少量魔法。' },
  // 高级技能（高级魔兽要诀、神兽）
  gj_bisha: { name: '高级必杀', kind: 'trait', pet: true, rare: true, desc: '物理攻击有30%几率造成1.6倍暴击。' },
  gj_lianji: { name: '高级连击', kind: 'trait', pet: true, rare: true, desc: '物理攻击有50%几率追加一次攻击。' },
  gj_xixue: { name: '高级吸血', kind: 'trait', pet: true, rare: true, desc: '物理攻击时吸取伤害的40%。' },
  gj_fanji: { name: '高级反击', kind: 'trait', pet: true, rare: true, desc: '受到物理攻击时有45%几率反击。' },
  gj_qiangli: { name: '高级强力', kind: 'trait', pet: true, rare: true, bonus: { atkPct: 0.22 }, desc: '伤害提升22%。' },
  gj_fangyu: { name: '高级防御', kind: 'trait', pet: true, rare: true, bonus: { defPct: 0.28 }, desc: '防御提升28%。' },
  gj_minjie: { name: '高级敏捷', kind: 'trait', pet: true, rare: true, bonus: { spdPct: 0.28 }, desc: '速度提升28%。' },
  gj_shenyou: { name: '高级神佑复生', kind: 'trait', pet: true, rare: true, desc: '倒地时有45%几率满血复活。' },
  gj_zaisheng: { name: '高级再生', kind: 'trait', pet: true, rare: true, desc: '每回合恢复较多气血。' },
  gj_mingsi: { name: '高级冥思', kind: 'trait', pet: true, rare: true, desc: '每回合恢复较多魔法。' },
  fs_lianji: { name: '法术连击', kind: 'trait', pet: true, rare: true, desc: '施放伤害法术后有25%几率再施放一次（七成威力）。' },
  fs_baoji: { name: '法术暴击', kind: 'trait', pet: true, rare: true, desc: '法术伤害有15%几率造成1.5倍暴击。' },
  mozhixin: { name: '魔之心', kind: 'trait', pet: true, rare: true, bonus: { mpowPct: 0.2 }, desc: '灵力提升20%。' },
  yeshen: { name: '夜战', kind: 'trait', pet: true, bonus: { hpPct: 0.08 }, desc: '气血提升8%。' },
};
export const PET_TRAIT_POOL = ['bisha', 'lianji', 'xixue', 'fanji', 'qiangli', 'fangyu', 'minjie', 'zaisheng', 'du', 'mingsi', 'leiji', 'luoyan', 'shuigong', 'liehuo', 'yeshen'];
export const PET_RARE_POOL = ['shenyou', 'benlei', 'shuiman', 'taishan', 'diyu', 'qugui'];
// 高级魔兽要诀的技能池
export const PET_HIGH_POOL = ['gj_bisha', 'gj_lianji', 'gj_xixue', 'gj_fanji', 'gj_qiangli', 'gj_fangyu', 'gj_minjie', 'gj_shenyou', 'gj_zaisheng', 'gj_mingsi', 'fs_lianji', 'fs_baoji', 'mozhixin', 'benlei', 'shuiman', 'taishan', 'diyu'];

// ---------------- 物品 ----------------
export const ITEMS = {
  baozi: { name: '包子', icon: '🥟', type: 'food', hp: 150, price: 50, desc: '恢复150点气血。' },
  kaoya: { name: '烤鸭', icon: '🍗', type: 'food', hp: 420, price: 180, desc: '恢复420点气血。' },
  jinchuang: { name: '金创药', icon: '💊', type: 'food', hp: 1000, price: 520, desc: '恢复1000点气血。' },
  zhenlu: { name: '珍露酒', icon: '🍶', type: 'food', mp: 150, price: 100, desc: '恢复150点魔法。' },
  nverhong: { name: '女儿红', icon: '🏺', type: 'food', mp: 450, price: 380, desc: '恢复450点魔法。' },
  sheli: { name: '佛光舍利子', icon: '📿', type: 'revive', revive: 0.5, price: 900, desc: '战斗中复活一名倒地单位并恢复50%气血。' },
  sheyao: { name: '摄妖香', icon: '🪔', type: 'incense', price: 150, desc: '使用后600步内不会遇到等级低于你的野怪。' },
  feixing: { name: '飞行符', icon: '📜', type: 'fly', price: 80, desc: '瞬间飞往建邺城或长安城。' },
  baotu: { name: '藏宝图', icon: '🗺️', type: 'map', price: 0, desc: '记载着宝藏位置，到达标记处使用即可挖宝。' },
  wanyao: { name: '宠物口粮', icon: '🦴', type: 'petfood', price: 300, desc: '使出战召唤兽获得大量经验。' },
  xiulian: { name: '修炼果', icon: '🍑', type: 'point', price: 0, desc: '食用后获得2点属性点。' },
  jinke: { name: '金柳露', icon: '🧪', type: 'petgrow', price: 0, desc: '使出战召唤兽成长提高0.01（上限1.30）。' },
  // 高级补给
  dahuan: { name: '大还丹', icon: '🔴', type: 'food', hp: 3000, price: 1500, desc: '恢复3000点气血。' },
  xianlu: { name: '蟠桃仙露', icon: '🍯', type: 'food', hp: 6500, price: 3200, desc: '恢复6500点气血。' },
  xianniang: { name: '天香仙酿', icon: '🍷', type: 'food', mp: 1200, price: 1300, desc: '恢复1200点魔法。' },
  jiuzhuan: { name: '九转还魂丹', icon: '💫', type: 'revive', revive: 1, price: 3000, desc: '战斗中复活一名倒地单位并恢复全部气血。' },
  // 养成材料（多由仙玉、活动获得）
  qianghua: { name: '强化石', icon: '💎', type: 'mat', price: 0, desc: '装备强化的材料。在人物界面「装备强化」中使用。' },
  baohu: { name: '强化保护符', icon: '🛡️', type: 'mat', price: 0, desc: '强化+7以上失败时，保护装备不掉级。' },
  shoujue: { name: '魔兽要诀', icon: '📘', type: 'petbook', price: 0, desc: '让出战召唤兽学会书中记载的技能。技能越多，越容易顶替掉已有技能。' },
  gj_shoujue: { name: '高级魔兽要诀', icon: '📕', type: 'petbook', price: 0, desc: '记载着高级技能的秘籍，让出战召唤兽学会书中的高级技能。' },
  jinke2: { name: '超级金柳露', icon: '⚗️', type: 'petgrow', grow: 0.02, cap: 1.4, price: 0, desc: '使出战召唤兽成长提高0.02（上限1.40）。' },
  shuangbei: { name: '双倍经验丹', icon: '🌟', type: 'double', price: 0, desc: '服用后60分钟内获得的经验翻倍（可叠加时长）。' },
  xinwu: { name: '伙伴信物', icon: '🎎', type: 'mat', price: 0, desc: '伙伴升星的材料。在队伍界面为伙伴升星。' },
  shenshou_sp: { name: '神兽碎片', icon: '✨', type: 'mat', price: 0, desc: '集齐100片可在藏宝阁兑换一只神兽。' },
  gj_baotu: { name: '高级藏宝图', icon: '📜', type: 'map', price: 0, desc: '记载着上古宝藏，挖出神兽、高级兽决、仙玉的几率很高，也可能惊动妖王。' },
  jingyan: { name: '修炼秘籍', icon: '📗', type: 'expbook', price: 0, desc: '阅读后获得相当于当前等级升级所需30%的经验。' },
};
export const DRUG_SHOP = ['baozi', 'kaoya', 'jinchuang', 'dahuan', 'zhenlu', 'nverhong', 'xianniang', 'sheli'];
export const HIGH_DRUG_SHOP = ['jinchuang', 'dahuan', 'xianlu', 'nverhong', 'xianniang', 'sheli', 'jiuzhuan', 'feixing', 'sheyao'];
export const GROCERY_SHOP = ['baozi', 'zhenlu', 'sheyao', 'feixing', 'wanyao'];

// ---------------- 怪物 ----------------
// look.shape: caterpillar / turtle / frog / crab / shrimp / ghost / tree / quad / flower / spider / human
export const MONSTERS = {
  haimaochong: { name: '海毛虫', lv: [1, 4], look: { shape: 'caterpillar', c1: '#8fd35a', c2: '#f3e36a' }, mul: { hp: 0.9, atk: 0.9, def: 0.8 }, traits: ['du'], pet: 0, drops: [['baozi', 0.12]] },
  dahaigui: { name: '大海龟', lv: [1, 4], look: { shape: 'turtle', c1: '#5aa86a', c2: '#e8d28a' }, mul: { hp: 1.25, atk: 0.8, def: 1.5, spd: 0.6 }, traits: ['fangyu'], pet: 0, drops: [['baozi', 0.12]] },
  juwa: { name: '巨蛙', lv: [2, 5], look: { shape: 'frog', c1: '#6ac05a', c2: '#fff3b0' }, mul: { atk: 1.1 }, traits: ['lianji'], pet: 0, drops: [['zhenlu', 0.08]] },
  xiabing: { name: '虾兵', lv: [4, 8], look: { shape: 'shrimp', c1: '#ff8a6a', c2: '#ffd8c0' }, mul: { atk: 1.1, spd: 1.1 }, traits: ['bisha'], pet: 5, drops: [['baozi', 0.12]] },
  xiejiang: { name: '蟹将', lv: [5, 8], look: { shape: 'crab', c1: '#e8563a', c2: '#ffe0b0' }, mul: { hp: 1.1, def: 1.4, spd: 0.8 }, traits: ['fanji'], pet: 5, drops: [['kaoya', 0.06]] },
  yegui: { name: '野鬼', lv: [5, 9], look: { shape: 'ghost', c1: '#b8c8ff', c2: '#6a5aa8' }, mul: { mpow: 1.2 }, skills: ['leiji'], traits: ['guihun'], pet: 5, ghost: true, drops: [['zhenlu', 0.1]] },
  shuguai: { name: '树怪', lv: [6, 11], look: { shape: 'tree', c1: '#4fa34a', c2: '#8a5a32' }, mul: { hp: 1.4, def: 1.3, spd: 0.5 }, skills: ['luoyan'], traits: ['zaisheng'], pet: 5, drops: [['kaoya', 0.06]] },
  yezhu: { name: '野猪', lv: [6, 11], look: { shape: 'quad', kind: 'boar', c1: '#8a5a3a', c2: '#d8b090' }, mul: { atk: 1.15, hp: 1.1 }, traits: ['qiangli'], pet: 5, drops: [['baozi', 0.15]] },
  qiangdao: { name: '强盗', lv: [7, 12], look: { shape: 'human', skin: '#f2c8a0', hair: '#2a2020', hairStyle: 'bandana', cloth: '#6a5a4a', cloth2: '#a89878', belt: '#3a2a1a', pants: '#4a3a2a', shoe: '#2a1a10', ribbon: '#c83a2a', weapon: 'saber', beard: true }, mul: { atk: 1.1 }, traits: ['bisha'], pet: 5, drops: [['kaoya', 0.08]] },
  dutu: { name: '赌徒', lv: [7, 12], look: { shape: 'human', skin: '#f5d0b0', hair: '#302020', hairStyle: 'hat', cloth: '#8a7a3a', cloth2: '#e8d88a', belt: '#5a4a1a', pants: '#5a4a2a', shoe: '#2a1a10', ribbon: '#e8d88a', weapon: 'dice' }, mul: { mpow: 1.2 }, skills: ['shuigong'], traits: [], pet: 5, drops: [['zhenlu', 0.1]] },
  shanzei: { name: '山贼', lv: [12, 20], look: { shape: 'human', skin: '#e8b890', hair: '#1a1010', hairStyle: 'bandana', cloth: '#4a5a3a', cloth2: '#8a9a6a', belt: '#2a1a0a', pants: '#3a3a2a', shoe: '#1a1a10', ribbon: '#3a3a3a', weapon: 'saber', beard: true }, mul: { atk: 1.15 }, traits: ['bisha', 'lianji'], pet: 15, drops: [['kaoya', 0.1]] },
  laohu: { name: '老虎', lv: [13, 21], look: { shape: 'quad', kind: 'tiger', c1: '#f0a030', c2: '#fff4e0' }, mul: { atk: 1.25, spd: 1.1 }, traits: ['bisha'], pet: 15, drops: [['kaoya', 0.08]] },
  heixiong: { name: '黑熊', lv: [13, 21], look: { shape: 'quad', kind: 'bear', c1: '#3a3030', c2: '#c8a080' }, mul: { hp: 1.4, def: 1.2, spd: 0.8 }, traits: ['fanji'], pet: 15, drops: [['jinchuang', 0.04]] },
  huayao: { name: '花妖', lv: [12, 20], look: { shape: 'flower', c1: '#ff7ab0', c2: '#ffe35a' }, mul: { mpow: 1.3, hp: 0.9 }, skills: ['luoyan', 'shuigong'], traits: ['zaisheng'], pet: 15, drops: [['zhenlu', 0.12]] },
  hulijing: { name: '狐狸精', lv: [20, 30], look: { shape: 'quad', kind: 'fox', c1: '#f08a3a', c2: '#fff0e0' }, mul: { mpow: 1.3, spd: 1.2 }, skills: ['liehuo'], traits: ['minjie'], pet: 25, drops: [['nverhong', 0.05]] },
  yangtou: { name: '羊头怪', lv: [21, 30], look: { shape: 'human', skin: '#f0e8d8', hair: '#e8e0d0', hairStyle: 'goat', cloth: '#6a4a8a', cloth2: '#c8a8e8', belt: '#3a2a4a', pants: '#4a3a5a', shoe: '#2a1a2a', ribbon: '#e8c040', weapon: 'staff' }, mul: { atk: 1.1, hp: 1.1 }, traits: ['qiangli'], pet: 25, drops: [['jinchuang', 0.05]] },
  hamajing: { name: '蛤蟆精', lv: [20, 29], look: { shape: 'frog', c1: '#8a5ab8', c2: '#f0d8ff' }, mul: { mpow: 1.2, hp: 1.1 }, skills: ['shuigong'], traits: ['du'], pet: 25, drops: [['nverhong', 0.05]] },
  kulou: { name: '骷髅怪', lv: [22, 32], look: { shape: 'human', skeleton: true, skin: '#f4f0e0', hair: '#f4f0e0', hairStyle: 'bald', cloth: '#5a5a6a', cloth2: '#a0a0b0', belt: '#3a3a4a', pants: '#4a4a5a', shoe: '#2a2a3a', ribbon: '#a0a0b0', weapon: 'saber' }, mul: { atk: 1.15 }, traits: ['guihun', 'bisha'], pet: 25, ghost: true, drops: [['jinchuang', 0.05]] },
  niuyao: { name: '牛妖', lv: [23, 32], look: { shape: 'human', skin: '#8a5a3a', hair: '#4a2a1a', hairStyle: 'bull', cloth: '#a83a2a', cloth2: '#e8b830', belt: '#3a1a0a', pants: '#5a2a1a', shoe: '#2a1a0a', ribbon: '#e8b830', weapon: 'axe', big: true }, mul: { atk: 1.25, hp: 1.25, spd: 0.85 }, traits: ['fanji'], pet: 25, drops: [['kaoya', 0.12]] },
  jiangshi: { name: '僵尸', lv: [30, 40], look: { shape: 'human', skin: '#b8d0a8', hair: '#1a1a1a', hairStyle: 'qing', cloth: '#3a4a6a', cloth2: '#c8a040', belt: '#2a2a3a', pants: '#2a3a4a', shoe: '#1a1a1a', ribbon: '#e8d060', weapon: 'none', talisman: true }, mul: { hp: 1.3 }, traits: ['guihun', 'du'], pet: 35, ghost: true, drops: [['jinchuang', 0.06]] },
  zhizhu: { name: '蜘蛛精', lv: [30, 40], look: { shape: 'spider', c1: '#5a3a6a', c2: '#e84a8a' }, mul: { atk: 1.15, spd: 1.1 }, traits: ['du', 'lianji'], pet: 35, drops: [['nverhong', 0.06]] },
  yuanhun: { name: '冤魂', lv: [30, 40], look: { shape: 'ghost', c1: '#a8f0e0', c2: '#3a8a8a' }, mul: { mpow: 1.3 }, skills: ['benlei'], traits: ['guihun'], pet: 35, ghost: true, drops: [['nverhong', 0.06]] },
  julishenyuan: { name: '巨力神猿', lv: [40, 52], look: { shape: 'quad', kind: 'monkey', c1: '#a8703a', c2: '#f0d0a0' }, mul: { atk: 1.3, hp: 1.2 }, traits: ['qiangli', 'bisha'], pet: 45, drops: [['jinchuang', 0.08]] },
  changmei: { name: '长眉灵猴', lv: [40, 50], look: { shape: 'quad', kind: 'monkey', c1: '#d8d0c0', c2: '#fff4e8' }, mul: { mpow: 1.35, spd: 1.2 }, skills: ['benlei', 'leiji'], traits: ['minjie'], pet: 45, drops: [['nverhong', 0.08]] },
  tianjiang: { name: '天将', lv: [44, 55], look: { shape: 'human', skin: '#ffe0c8', hair: '#2a2a3a', hairStyle: 'helmet', cloth: '#d8b040', cloth2: '#fff4c0', belt: '#a83a2a', pants: '#8a6a2a', shoe: '#4a3a1a', ribbon: '#e8403a', weapon: 'spear' }, mul: { def: 1.3, hp: 1.2 }, skills: ['tlz'], traits: ['fangyu'], pet: 45, drops: [['jinchuang', 0.08]] },
  // ---------- 50 级以后的新区域 ----------
  // 东海龙宫
  yecha: { name: '巡海夜叉', lv: [50, 66], look: { shape: 'human', skin: '#6a9ab8', hair: '#1a3a5a', hairStyle: 'demon', cloth: '#2a5a7a', cloth2: '#a8e0f0', belt: '#1a2a3a', pants: '#1a3a4a', shoe: '#0a1a2a', ribbon: '#a8e0f0', weapon: 'spear' }, mul: { atk: 1.2, spd: 1.1 }, traits: ['lianji', 'bisha'], pet: 55, drops: [['dahuan', 0.05]] },
  bangjing: { name: '蚌精', lv: [50, 66], look: { shape: 'turtle', c1: '#f0b8c8', c2: '#fff0e8' }, mul: { hp: 1.4, def: 1.5, spd: 0.6 }, skills: ['shuigong'], traits: ['fangyu', 'zaisheng'], pet: 55, drops: [['xianniang', 0.05]] },
  jiaoren: { name: '鲛人', lv: [52, 66], look: { shape: 'human', skin: '#d8f0f0', hair: '#3ab8a8', hairStyle: 'longhair', gender: 'f', cloth: '#3aa8b8', cloth2: '#e0ffff', belt: '#1a6a7a', pants: '#8ad8d8', shoe: '#1a5a6a', ribbon: '#ffffff', weapon: 'ribbon' }, mul: { mpow: 1.35, spd: 1.1 }, skills: ['shuiman', 'shuigong'], traits: ['mingsi'], pet: 55, drops: [['xianniang', 0.06]] },
  guijiang: { name: '龟将', lv: [52, 66], look: { shape: 'turtle', c1: '#3a7a5a', c2: '#d8c88a' }, mul: { hp: 1.3, def: 1.6, atk: 1.1, spd: 0.7 }, traits: ['fanji', 'fangyu'], pet: 55, drops: [['dahuan', 0.05]] },
  // 北俱芦洲
  xuelang: { name: '雪狼', lv: [62, 80], look: { shape: 'quad', kind: 'fox', c1: '#e8eef8', c2: '#a8b8d0' }, mul: { atk: 1.15, spd: 1.25 }, traits: ['lianji', 'minjie'], pet: 65, drops: [['dahuan', 0.05]] },
  bingyao: { name: '冰妖', lv: [62, 80], look: { shape: 'ghost', c1: '#c8f0ff', c2: '#3a8ad8' }, mul: { mpow: 1.25 }, skills: ['shuiman'], traits: ['guihun', 'mingsi'], pet: 65, ghost: true, drops: [['xianniang', 0.06]] },
  xueguai: { name: '雪怪', lv: [64, 80], look: { shape: 'quad', kind: 'bear', c1: '#f4f8ff', c2: '#9ab0c8' }, mul: { hp: 1.5, def: 1.3, atk: 1.15, spd: 0.8 }, traits: ['fanji', 'qiangli'], pet: 65, drops: [['dahuan', 0.06]] },
  fengbo: { name: '风伯', lv: [64, 80], look: { shape: 'human', skin: '#e8d8c0', hair: '#c8d8e8', hairStyle: 'oldman', cloth: '#6a8ab8', cloth2: '#e8f0ff', belt: '#3a4a7a', pants: '#4a5a8a', shoe: '#2a3a5a', ribbon: '#e8f0ff', weapon: 'fan', beard: true }, mul: { mpow: 1.2, spd: 1.15 }, skills: ['benlei', 'leiji'], traits: ['minjie'], pet: 65, drops: [['xianniang', 0.06]] },
  // 火焰山
  huojing: { name: '火精', lv: [76, 92], look: { shape: 'ghost', c1: '#ffb040', c2: '#e8401a' }, mul: { mpow: 1.3 }, skills: ['diyu', 'liehuo'], traits: [], pet: 78, drops: [['xianniang', 0.06]] },
  niujiang: { name: '牛魔将', lv: [76, 92], look: { shape: 'human', skin: '#7a4a2a', hair: '#2a1a0a', hairStyle: 'bull', cloth: '#8a2a1a', cloth2: '#f0a030', belt: '#2a1a0a', pants: '#4a1a0a', shoe: '#1a0a0a', ribbon: '#f0a030', weapon: 'axe', big: true }, mul: { atk: 1.2, hp: 1.3, spd: 0.85 }, traits: ['qiangli', 'fanji'], pet: 78, drops: [['dahuan', 0.06]] },
  yanhu: { name: '炎狐', lv: [78, 92], look: { shape: 'quad', kind: 'fox', c1: '#ff6a2a', c2: '#ffe0a0' }, mul: { mpow: 1.15, spd: 1.3 }, skills: ['liehuo'], traits: ['minjie', 'lianji'], pet: 78, drops: [['xianniang', 0.06]] },
  // 无底洞
  shujing: { name: '鼠精', lv: [90, 108], look: { shape: 'quad', kind: 'mouse', c1: '#8a8a9a', c2: '#f0d8e0' }, mul: { atk: 1.1, spd: 1.3 }, traits: ['du', 'lianji', 'xixue'], pet: 90, drops: [['xianlu', 0.04]] },
  xiezi: { name: '蝎子精', lv: [90, 108], look: { shape: 'spider', c1: '#a83a1a', c2: '#f0c040' }, mul: { atk: 1.2 }, traits: ['du', 'bisha'], pet: 90, drops: [['xianlu', 0.04]] },
  zhizhunv: { name: '蛛女', lv: [92, 108], look: { shape: 'human', skin: '#f4e4f0', hair: '#4a1a5a', hairStyle: 'twin', gender: 'f', cloth: '#6a2a7a', cloth2: '#f0a0e0', belt: '#3a0a4a', pants: '#8a4a9a', shoe: '#2a0a3a', ribbon: '#f0a0e0', weapon: 'whip' }, mul: { mpow: 1.25 }, skills: ['hqmm', 'taishan'], traits: ['du'], pet: 90, drops: [['xianniang', 0.06]] },
  kuloujiang: { name: '骷髅将军', lv: [92, 108], look: { shape: 'human', skeleton: true, skin: '#f4f0e0', hair: '#8a2a2a', hairStyle: 'helmet', cloth: '#4a3a3a', cloth2: '#a86a4a', belt: '#2a1a1a', pants: '#3a2a2a', shoe: '#1a1a1a', ribbon: '#c83a2a', weapon: 'spear' }, mul: { atk: 1.2, hp: 1.2 }, traits: ['guihun', 'bisha', 'fanji'], pet: 90, ghost: true, drops: [['xianlu', 0.04]] },
  // 南天门
  yaobing: { name: '妖兵', lv: [104, 120], look: { shape: 'human', skin: '#9ab870', hair: '#3a2a1a', hairStyle: 'demon', cloth: '#4a3a2a', cloth2: '#a8905a', belt: '#2a1a0a', pants: '#3a2a1a', shoe: '#1a1a0a', ribbon: '#c83a2a', weapon: 'saber' }, mul: { atk: 1.2, hp: 1.2 }, traits: ['bisha', 'lianji'], pet: 105, drops: [['xianlu', 0.05]] },
  tianbing: { name: '天兵', lv: [104, 120], look: { shape: 'human', skin: '#ffe0c8', hair: '#2a2a3a', hairStyle: 'helmet', cloth: '#b8c8d8', cloth2: '#f0f4ff', belt: '#3a5a8a', pants: '#6a7a9a', shoe: '#2a3a5a', ribbon: '#3a8ae8', weapon: 'spear' }, mul: { def: 1.35, hp: 1.25 }, skills: ['tlz'], traits: ['fangyu'], pet: 105, drops: [['xianlu', 0.05]] },
  leigong: { name: '雷公', lv: [106, 120], look: { shape: 'human', skin: '#6a7ab8', hair: '#e8d040', hairStyle: 'demon', cloth: '#3a3a6a', cloth2: '#e8d040', belt: '#1a1a3a', pants: '#2a2a4a', shoe: '#1a1a2a', ribbon: '#e8d040', weapon: 'axe' }, mul: { mpow: 1.35 }, skills: ['benlei', 'wlhd'], traits: ['minjie'], pet: 105, drops: [['xianniang', 0.06]] },
  jinjia: { name: '金甲神将', lv: [106, 120], look: { shape: 'human', skin: '#ffe0c0', hair: '#2a2a2a', hairStyle: 'helmet', cloth: '#e8c040', cloth2: '#fff4b0', belt: '#a83a2a', pants: '#a87a2a', shoe: '#5a3a1a', ribbon: '#e8403a', weapon: 'axe', big: true }, mul: { atk: 1.25, def: 1.3, hp: 1.35, spd: 0.85 }, traits: ['fanji', 'qiangli'], pet: 105, drops: [['xianlu', 0.05]] },
  // 幽冥地府
  yinbing: { name: '阴兵', lv: [118, 136], look: { shape: 'human', skeleton: true, skin: '#e0e8e0', hair: '#3a4a5a', hairStyle: 'helmet', cloth: '#3a4a5a', cloth2: '#8a9aaa', belt: '#1a2a3a', pants: '#2a3a4a', shoe: '#1a1a2a', ribbon: '#6a8a9a', weapon: 'spear' }, mul: { atk: 1.2 }, traits: ['guihun', 'bisha'], pet: 120, ghost: true, drops: [['xianlu', 0.05]] },
  gouhun: { name: '勾魂使者', lv: [118, 136], look: { shape: 'ghost', c1: '#4a4a5a', c2: '#a8ff8a' }, mul: { mpow: 1.35 }, skills: ['ylnl', 'sfd'], traits: ['guihun'], pet: 120, ghost: true, drops: [['xianniang', 0.06]] },
  wuchang: { name: '无常', lv: [120, 136], look: { shape: 'human', skin: '#f4f4f4', hair: '#1a1a1a', hairStyle: 'hat', cloth: '#f4f4f4', cloth2: '#3a3a3a', belt: '#1a1a1a', pants: '#e0e0e0', shoe: '#1a1a1a', ribbon: '#c83a2a', weapon: 'staff' }, mul: { spd: 1.25, mpow: 1.2 }, skills: ['pgl', 'hqmm'], traits: ['guihun', 'minjie'], pet: 120, ghost: true, drops: [['xianniang', 0.06]] },
  youhun: { name: '幽魂', lv: [120, 136], look: { shape: 'ghost', c1: '#d8c8ff', c2: '#6a3aa8' }, mul: { mpow: 1.3, spd: 1.15 }, skills: ['benlei', 'sfd'], traits: ['guihun', 'mingsi'], pet: 120, ghost: true, drops: [['xianniang', 0.06]] },
  // 小雷音寺
  yaoseng: { name: '妖僧', lv: [132, 150], look: { shape: 'human', skin: '#e8c8a0', hair: '#2a2a2a', hairStyle: 'bald', cloth: '#c89a3a', cloth2: '#8a2a1a', belt: '#8a2a1a', pants: '#a8803a', shoe: '#3a2a1a', ribbon: '#8a2a1a', weapon: 'staff' }, mul: { hp: 1.3, mpow: 1.25 }, skills: ['rgh', 'sxf'], traits: ['zaisheng'], pet: 135, drops: [['xianlu', 0.05]] },
  jingang: { name: '伪金刚', lv: [132, 150], look: { shape: 'human', skin: '#e8c060', hair: '#2a2a2a', hairStyle: 'bald', cloth: '#e8a030', cloth2: '#c83a2a', belt: '#8a2a1a', pants: '#c8802a', shoe: '#5a3a1a', ribbon: '#c83a2a', weapon: 'axe', big: true }, mul: { atk: 1.3, hp: 1.4, def: 1.3, spd: 0.8 }, traits: ['gj_fanji', 'qiangli'], pet: 135, drops: [['xianlu', 0.05]] },
  mohou: { name: '魔猴', lv: [134, 150], look: { shape: 'quad', kind: 'monkey', c1: '#5a4a6a', c2: '#d0c0e0' }, mul: { atk: 1.25, spd: 1.3 }, traits: ['gj_lianji', 'bisha'], pet: 135, drops: [['xianlu', 0.05]] },
  // 抓鬼 / 特殊
  niutou: { name: '牛头', lv: [1, 150], look: { shape: 'human', skin: '#6a4a3a', hair: '#3a2010', hairStyle: 'bull', cloth: '#3a3a4a', cloth2: '#8a2a2a', belt: '#1a1a1a', pants: '#2a2a3a', shoe: '#1a1a1a', ribbon: '#8a2a2a', weapon: 'axe', big: true }, mul: { atk: 1.15, hp: 1.1 }, traits: ['guihun'], pet: 999, ghost: true },
  mamian: { name: '马面', lv: [1, 150], look: { shape: 'human', skin: '#8a8a9a', hair: '#2a2a3a', hairStyle: 'horse', cloth: '#3a3a4a', cloth2: '#3a6a8a', belt: '#1a1a1a', pants: '#2a2a3a', shoe: '#1a1a1a', ribbon: '#3a6a8a', weapon: 'spear' }, mul: { spd: 1.1 }, skills: ['leiji'], traits: ['guihun'], pet: 999, ghost: true },
  // 首领
  shangren: { name: '商人的鬼魂', boss: true, look: { shape: 'human', ghostly: true, skin: '#d8e0ff', hair: '#5a5a7a', hairStyle: 'hat', cloth: '#8a9ab8', cloth2: '#e8e8ff', belt: '#5a5a7a', pants: '#6a6a8a', shoe: '#4a4a6a', ribbon: '#e8e8ff', weapon: 'none' }, mul: { hp: 5.5, atk: 1.15, def: 1.0, mpow: 1.2 }, skills: ['leiji'], traits: [], ghost: true },
  shanzeitou: { name: '山贼头子', boss: true, look: { shape: 'human', skin: '#e0a880', hair: '#1a1010', hairStyle: 'bandana', cloth: '#8a2a2a', cloth2: '#e8b830', belt: '#1a0a0a', pants: '#3a1a1a', shoe: '#1a1010', ribbon: '#e8b830', weapon: 'axe', beard: true, big: true }, mul: { hp: 6, atk: 1.25, def: 1.15 }, skills: ['hsqj'], traits: ['bisha'] },
  yaofeng: { name: '妖风', boss: true, look: { shape: 'human', skin: '#a8e0d0', hair: '#3a8a7a', hairStyle: 'demon', cloth: '#2a6a6a', cloth2: '#a8f0e0', belt: '#1a3a3a', pants: '#1a4a4a', shoe: '#0a2a2a', ribbon: '#a8f0e0', weapon: 'fan' }, mul: { hp: 9, mpow: 1.4, spd: 1.15, atk: 1.1 }, skills: ['fszs', 'benlei'], traits: [] },
  cungu: { name: '村姑', boss: true, look: { shape: 'human', skin: '#fff0e8', hair: '#2a1a1a', hairStyle: 'bun', cloth: '#e8a0b0', cloth2: '#fff8f0', belt: '#c86a80', pants: '#f0c8d0', shoe: '#8a4a5a', ribbon: '#ff8aa0', weapon: 'basket', gender: 'f' }, mul: { hp: 8, mpow: 1.3, spd: 1.1 }, skills: ['hqmm', 'pgl'], traits: [] },
  laofu: { name: '老妇', boss: true, look: { shape: 'human', skin: '#f0dcc8', hair: '#e8e8e8', hairStyle: 'bun', cloth: '#6a5a4a', cloth2: '#c8b8a8', belt: '#4a3a2a', pants: '#5a4a3a', shoe: '#2a1a10', ribbon: '#c8b8a8', weapon: 'staff', gender: 'f' }, mul: { hp: 9, mpow: 1.4, def: 1.15 }, skills: ['sfd', 'ylnl'], traits: ['zaisheng'] },
  baigujing: { name: '白骨精', boss: true, look: { shape: 'human', skin: '#f8f8ff', hair: '#e8e8f8', hairStyle: 'fairy', cloth: '#f0f0f8', cloth2: '#6a4a8a', belt: '#3a2a4a', pants: '#d8d8e8', shoe: '#3a2a4a', ribbon: '#8a5ab8', weapon: 'claw', gender: 'f', ghostly: true }, mul: { hp: 12, mpow: 1.5, atk: 1.25, spd: 1.2, def: 1.2 }, skills: ['ylnl', 'sfd', 'hqmm'], traits: ['zaisheng'], ghost: true },
  // ---------- 七大圣篇首领 ----------
  hunshi: { name: '混世魔王', boss: true, enrage: true, look: { shape: 'human', skin: '#d8a078', hair: '#1a1010', hairStyle: 'demon', cloth: '#3a2a3a', cloth2: '#c83a2a', belt: '#1a0a0a', pants: '#2a1a2a', shoe: '#1a0a0a', ribbon: '#c83a2a', weapon: 'saber', big: true, beard: true }, mul: { hp: 11, atk: 1.15, def: 1.2, spd: 1.1 }, skills: ['hsqj', 'sb'], traits: ['bisha'] },
  jiutouchong: { name: '九头虫', boss: true, enrage: true, look: { shape: 'quad', kind: 'dragon', c1: '#8a2a5a', c2: '#ffd040' }, mul: { hp: 12, mpow: 1.35, spd: 1.15 }, skills: ['shuiman', 'ljyj', 'lt'], traits: ['zaisheng'] },
  jiaomowang: { name: '蛟魔王', boss: true, enrage: true, look: { shape: 'human', skin: '#c8e8e0', hair: '#1a6a6a', hairStyle: 'dragon', cloth: '#1a5a6a', cloth2: '#e8d060', belt: '#0a2a3a', pants: '#1a3a4a', shoe: '#0a1a2a', ribbon: '#e8d060', weapon: 'spear', big: true }, mul: { hp: 12, atk: 1.2, mpow: 1.25, def: 1.2 }, skills: ['elxz', 'lt', 'tlz'], traits: ['fanji'] },
  honghaier: { name: '红孩儿', boss: true, enrage: true, look: { shape: 'human', skin: '#ffe0c8', hair: '#c82a1a', hairStyle: 'topknot', cloth: '#e83a2a', cloth2: '#ffd040', belt: '#8a1a0a', pants: '#ffb08a', shoe: '#8a2a1a', ribbon: '#ffd040', weapon: 'spear' }, mul: { hp: 12, mpow: 1.4, spd: 1.25 }, skills: ['smzh', 'fszs', 'diyu'], traits: [] },
  tieshan: { name: '铁扇公主', boss: true, enrage: true, look: { shape: 'human', skin: '#fff0e4', hair: '#1a1a2a', hairStyle: 'bun', gender: 'f', cloth: '#3a8a5a', cloth2: '#f0e0a0', belt: '#1a4a2a', pants: '#a8d8b0', shoe: '#1a3a2a', ribbon: '#f0e0a0', weapon: 'fan' }, mul: { hp: 12, mpow: 1.35, spd: 1.2, def: 1.15 }, skills: ['fszs', 'taishan', 'hqmm'], traits: ['zaisheng'] },
  niumowang: { name: '魔化牛王', boss: true, enrage: true, look: { shape: 'human', skin: '#6a3a2a', hair: '#1a0a0a', hairStyle: 'bull', cloth: '#1a1a1a', cloth2: '#c83a2a', belt: '#3a0a0a', pants: '#2a1a1a', shoe: '#0a0a0a', ribbon: '#c83a2a', weapon: 'axe', big: true }, mul: { hp: 13, atk: 1.3, def: 1.3, mpow: 1.25 }, skills: ['fszs', 'smzh', 'hsqj'], traits: ['fanji', 'bisha'] },
  diyong: { name: '地涌夫人', boss: true, enrage: true, look: { shape: 'human', skin: '#fff4f4', hair: '#e8e0f0', hairStyle: 'fairy', gender: 'f', cloth: '#f0c8d8', cloth2: '#8a3a5a', belt: '#5a1a3a', pants: '#e8b8c8', shoe: '#5a1a3a', ribbon: '#8a3a5a', weapon: 'claw', tail: '#c8c0c8' }, mul: { hp: 13, mpow: 1.35, spd: 1.3, atk: 1.15 }, skills: ['tldw', 'hqmm', 'sfd'], traits: ['lianji', 'du'] },
  pengmowang: { name: '鹏魔王', boss: true, enrage: true, look: { shape: 'human', skin: '#f0d0a0', hair: '#e8b030', hairStyle: 'demon', cloth: '#2a2a3a', cloth2: '#e8b030', belt: '#1a1a1a', pants: '#3a3a4a', shoe: '#1a1a1a', ribbon: '#e8b030', weapon: 'spear', big: true }, mul: { hp: 12, atk: 1.2, spd: 1.3 }, skills: ['yj', 'sb'], traits: ['gj_bisha'] },
  shituowang: { name: '狮驼王', boss: true, enrage: true, look: { shape: 'human', skin: '#f0c890', hair: '#f08a2a', hairStyle: 'demon', cloth: '#8a5a1a', cloth2: '#f0d060', belt: '#3a2a0a', pants: '#5a3a1a', shoe: '#2a1a0a', ribbon: '#f0d060', weapon: 'axe', big: true }, mul: { hp: 12, atk: 1.15, def: 1.2 }, skills: ['sb', 'hfzr', 'yj'], traits: ['fanji'] },
  yurongwang: { name: '禺狨王', boss: true, enrage: true, look: { shape: 'quad', kind: 'monkey', c1: '#4a3a5a', c2: '#c8b8e0' }, mul: { hp: 14, atk: 1.25, mpow: 1.35, spd: 1.35 }, skills: ['benlei', 'ylnl', 'sxf'], traits: ['gj_lianji'] },
  huangmei: { name: '黄眉大王', boss: true, enrage: true, look: { shape: 'human', skin: '#f0d0a0', hair: '#f0c030', hairStyle: 'bald', cloth: '#e8a030', cloth2: '#8a2a1a', belt: '#8a2a1a', pants: '#c8802a', shoe: '#3a2a1a', ribbon: '#f0c030', weapon: 'staff', big: true, beard: true }, mul: { hp: 15, mpow: 1.4, atk: 1.25, def: 1.35 }, skills: ['rgh', 'ylnl', 'rqkq'], traits: ['zaisheng'] },
  liuer: { name: '六耳猕猴', boss: true, enrage: true, look: { shape: 'quad', kind: 'monkey', c1: '#d8a040', c2: '#fff0c0' }, mul: { hp: 17, atk: 1.4, mpow: 1.4, spd: 1.45, def: 1.4 }, skills: ['hsqj', 'benlei', 'wlhd', 'sxf'], traits: ['gj_lianji', 'gj_bisha'] },
  // 渡劫心魔：外观与属性在战斗时按玩家本人生成
  xinmo: { name: '心魔', boss: true, enrage: true, look: { shape: 'human', skin: '#e8d0d8', hair: '#8a1a2a', hairStyle: 'topknot', cloth: '#3a1a4a', cloth2: '#b83a6a', belt: '#1a0a1a', pants: '#2a1a2a', shoe: '#1a0a1a', ribbon: '#ff3a6a', ghostly: true }, mul: {}, skills: [], traits: [] },
  // ---------- 神兽（祈愿、兑换、首充获得） ----------
  ss_hu: { name: '超级神虎', shenshou: true, look: { shape: 'quad', kind: 'tiger', c1: '#f8f4e8', c2: '#e8b830' }, mul: { hp: 1.3, atk: 1.45, spd: 1.2, def: 1.2 }, traits: ['gj_bisha', 'gj_lianji', 'gj_qiangli', 'gj_shenyou'], pet: 0 },
  ss_long: { name: '超级神龙', shenshou: true, look: { shape: 'quad', kind: 'dragon', c1: '#ffd84a', c2: '#ff8a2a' }, mul: { mpow: 1.5, hp: 1.3, spd: 1.2 }, skills: ['benlei', 'shuiman'], traits: ['fs_lianji', 'fs_baoji', 'mozhixin', 'gj_shenyou'], pet: 0 },
  ss_pao: { name: '超级泡泡', shenshou: true, look: { shape: 'ghost', c1: '#ffc8e8', c2: '#ff6aa8' }, mul: { hp: 1.7, def: 1.5, atk: 1.1 }, traits: ['gj_fangyu', 'gj_zaisheng', 'gj_shenyou', 'gj_fanji', 'gj_mingsi'], pet: 0 },
  ss_hu2: { name: '超级灵狐', shenshou: true, look: { shape: 'quad', kind: 'fox', c1: '#f4f4ff', c2: '#ff8ad0' }, mul: { atk: 1.35, spd: 1.5, hp: 1.2 }, traits: ['gj_minjie', 'gj_lianji', 'gj_xixue', 'gj_bisha'], pet: 0 },
  ss_qilin: { name: '超级麒麟', shenshou: true, look: { shape: 'quad', kind: 'tiger', c1: '#6ad0c8', c2: '#ffe060' }, mul: { mpow: 1.45, hp: 1.35, spd: 1.25, def: 1.25 }, skills: ['diyu', 'taishan'], traits: ['fs_lianji', 'mozhixin', 'gj_minjie'], pet: 0 },
  xiaobailong: { name: '小白龙', look: { shape: 'quad', kind: 'dragon', c1: '#f0f4ff', c2: '#8ad0ff' }, mul: { mpow: 1.3, hp: 1.2, spd: 1.1 }, skills: ['shuiman'], traits: ['shenyou', 'mingsi'], pet: 0 },
};
export const SHENSHOU = Object.keys(MONSTERS).filter(id => MONSTERS[id].shenshou);
export const GHOST_NAMES = ['吊死鬼', '冤死鬼', '饿死鬼', '赌鬼', '酒鬼', '淹死鬼', '无头鬼', '懒惰鬼', '倒霉鬼', '胆小鬼'];
export const GHOST_PREFIX = ['昏昏', '嘻嘻', '呜呜', '咕咕', '哼哼', '嘿嘿', '悠悠', '叽叽'];

// ---------------- 伙伴（助战） ----------------
export const PARTNERS = {
  wushuang: { name: '无双', school: 'huasheng', race: 'ren', price: 0, look: { skin: '#fff0e4', hair: '#2a1a24', hairStyle: 'bun', cloth: '#f4d0a0', cloth2: '#fff8ec', belt: '#c8803a', pants: '#f0e0c8', shoe: '#8a5a3a', ribbon: '#e8a040', gender: 'f', weapon: 'ring' }, desc: '化生寺俗家弟子，擅长治疗。' },
  qinchuan: { name: '秦川', school: 'datang', race: 'ren', price: 0, look: { skin: '#ffe0c4', hair: '#1a1418', hairStyle: 'topknot', cloth: '#b83a2a', cloth2: '#f0d8a0', belt: '#3a2a1a', pants: '#4a2a2a', shoe: '#2a1a1a', ribbon: '#f0d8a0', weapon: 'sword' }, desc: '大唐官府校尉，刀剑无双。' },
  mingyue: { name: '明月', school: 'fangcun', race: 'ren', price: 3000, look: { skin: '#ffe8d4', hair: '#1a1a24', hairStyle: 'twin', cloth: '#6a8ae8', cloth2: '#f0f4ff', belt: '#e8c040', pants: '#dce4ff', shoe: '#3a4a8a', ribbon: '#e8c040', weapon: 'fan' }, desc: '方寸山道童，符咒封印。' },
  zixia: { name: '紫霞', school: 'longgong', race: 'xian', price: 5000, look: { skin: '#fff0ea', hair: '#6a3aa8', hairStyle: 'fairy', cloth: '#a86ae8', cloth2: '#fff0ff', belt: '#e8a0e0', pants: '#e0d0ff', shoe: '#6a3aa8', ribbon: '#ffd0f0', gender: 'f', weapon: 'ribbon' }, desc: '龙宫仙子，擅长群体法术。' },
  yuner: { name: '云儿', school: 'putuo', race: 'xian', price: 6000, look: { skin: '#fff4ec', hair: '#3a2a4a', hairStyle: 'longhair', cloth: '#8ad8c8', cloth2: '#ffffff', belt: '#4aa898', pants: '#e0f8f4', shoe: '#3a7a70', ribbon: '#ffffff', gender: 'f', weapon: 'ribbon' }, desc: '普陀山侍女，持续治疗。' },
  tieniu: { name: '铁牛', school: 'shituo', race: 'mo', price: 6000, look: { skin: '#d8a078', hair: '#2a1a0a', hairStyle: 'demon', cloth: '#8a6a2a', cloth2: '#f0d060', belt: '#3a2a0a', pants: '#4a3a1a', shoe: '#2a1a0a', ribbon: '#f0d060', weapon: 'axe', big: true }, desc: '狮驼岭力士，鹰击群攻。' },
  hongxiu: { name: '红袖', school: 'mowang', race: 'mo', price: 8000, look: { skin: '#fff0e0', hair: '#a82a2a', hairStyle: 'pony', cloth: '#e84a3a', cloth2: '#ffe0a0', belt: '#8a1a1a', pants: '#8a2a2a', shoe: '#4a1010', ribbon: '#ffe0a0', gender: 'f', weapon: 'claw' }, desc: '魔王寨女将，三昧真火。' },
  longnv: { name: '龙女', school: 'wuzhuang', race: 'xian', price: 0, look: { skin: '#fff0ea', hair: '#3a6ad8', hairStyle: 'dragon', cloth: '#6ab8e8', cloth2: '#ffffff', belt: '#e8c040', pants: '#d8f0ff', shoe: '#3a6ad8', ribbon: '#ffd0f0', gender: 'f', weapon: 'ribbon' }, desc: '东海龙王之女，乾坤袖里藏，兼修生命之泉。' },
  shancai: { name: '善财童子', school: 'putuo', race: 'xian', price: 0, look: { skin: '#ffe8d8', hair: '#1a1a1a', hairStyle: 'topknot', cloth: '#e84a3a', cloth2: '#ffe080', belt: '#e8a030', pants: '#ffd0a0', shoe: '#8a3a1a', ribbon: '#ffe080', weapon: 'spear' }, desc: '红孩儿皈依观音后的法号，普度众生。' },
  nezha: { name: '哪吒', school: 'tiangong', race: 'xian', price: 0, look: { skin: '#ffe8d8', hair: '#1a1a2a', hairStyle: 'twin', cloth: '#e83a4a', cloth2: '#fff0c0', belt: '#e8b830', pants: '#f0c0a0', shoe: '#8a2a2a', ribbon: '#e83a4a', weapon: 'ring' }, desc: '三坛海会大神，乾坤圈、混天绫，雷霆封印。' },
  qingyi: { name: '青衣', school: 'nverer', race: 'ren', price: 40000, look: { skin: '#fff0e4', hair: '#1a2a1a', hairStyle: 'pony', cloth: '#4ab88a', cloth2: '#f0fff0', belt: '#2a6a4a', pants: '#c8f0d8', shoe: '#2a5a3a', ribbon: '#ffb0c0', gender: 'f', weapon: 'whip' }, desc: '女儿村暗器高手，出手极快，擅长封印。' },
  mengpo: { name: '孟婆', school: 'difu', race: 'mo', price: 80000, look: { skin: '#f0e0d0', hair: '#e0e0e0', hairStyle: 'bun', cloth: '#5a4a6a', cloth2: '#c8b8d8', belt: '#3a2a4a', pants: '#8a7a9a', shoe: '#2a1a3a', ribbon: '#c8b8d8', gender: 'f', weapon: 'staff' }, desc: '奈何桥边熬汤人，阎罗令群攻，尸毒缠身。' },
};

// ---------------- 经验与数值曲线 ----------------
export const expNeed = L => Math.floor(80 + 20 * L * L + 0.8 * L * L * L);
export const monsterExp = L => Math.floor(20 + 12 * L + 0.6 * L * L);
// 60 级以后改为线性增长，避免高等级学技能贵得离谱
export const skillCost = lv => Math.floor(lv <= 60 ? 10 + lv * lv * 1.5 : 5410 + (lv - 60) * 190);
export const tierForLevel = L => Math.min(MAX_TIER, Math.floor(L / 10));
