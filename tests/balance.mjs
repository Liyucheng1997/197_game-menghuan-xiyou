// 平衡模拟：node tests/balance.mjs
import { G, newGame, gainExp, makeEquip, addPet, makePet, recruit, allyUnits, fullHeal } from '../src/state.js';
import { enemyUnit, layoutEnemies } from '../src/enemies.js';
import { simulate } from '../src/battle-core.js';
import { SCHOOLS, ROLES, expNeed, tierForLevel } from '../src/data.js';

function setup(role, school, L, partners = [], petMid = null) {
  newGame(role, 't');
  const S = G.S;
  if (L > 1) gainExp([...Array(L - 1).keys()].reduce((s, l) => s + expNeed(l + 1), 0));
  S.school = school;
  if (school) { for (const id of [...SCHOOLS[school].skills, SCHOOLS[school].passive]) S.skills[id] = Math.max(1, L - 2); }
  const t = tierForLevel(L);
  for (const slot of ['weapon', 'helm', 'neck', 'armor', 'belt', 'boots']) S.equip[slot] = makeEquip(slot, t, ROLES[role].weapon, 0);
  partners.forEach(p => recruit(p));
  if (petMid) addPet(makePet(petMid, L));
  fullHeal();
}
function run(label, enemyFn, n = 300) {
  let w = 0, rounds = 0, hpLeft = 0;
  for (let i = 0; i < n; i++) {
    fullHeal();
    const allies = allyUnits();
    const B = { units: [...allies, ...layoutEnemies(enemyFn())], round: 1, canFlee: false };
    const o = simulate(B);
    if (o === 'win') { w++; const me = B.units[0]; hpLeft += me.hp / me.maxHp; }
    rounds += B.round;
  }
  console.log(label.padEnd(40), 'win', (w / n * 100).toFixed(0) + '%', 'rounds', (rounds / n).toFixed(1), 'hpLeft', (hpLeft / Math.max(1, w) * 100).toFixed(0) + '%');
}
const grp = (mids, L, k) => () => Array.from({ length: k }, (_, i) => enemyUnit(mids[i % mids.length], L));
setup('jxk', null, 2); run('L2 solo vs 2 donghai L3', grp(['dahaigui', 'haimaochong', 'juwa'], 3, 2));
setup('jxk', null, 1); run('L1 solo vs 1 donghai L2', grp(['dahaigui', 'haimaochong', 'juwa'], 2, 1));
setup('jxk', null, 4, [], 'dahaigui'); run('L4 +pet vs 3 donghai L4', grp(['dahaigui', 'haimaochong', 'juwa'], 4, 3));
setup('jxk', null, 7, [], 'juwa'); run('L7 +pet vs 2 chenchuan L7', grp(['xiabing', 'xiejiang', 'yegui'], 7, 2));
setup('jxk', null, 7, [], 'juwa'); run('L7 +pet vs BOSS shangren', () => [enemyUnit('shangren', 9), enemyUnit('yegui', 7), enemyUnit('yegui', 7)]);
setup('jxk', null, 8, ['wushuang'], 'juwa'); run('L8 +wushuang+pet vs BOSS shangren', () => [enemyUnit('shangren', 9), enemyUnit('yegui', 7), enemyUnit('yegui', 7)]);
setup('jxk', 'datang', 10, ['wushuang'], 'yezhu'); run('L10 datang+1 vs 3 jiangnan L10', grp(['shuguai', 'yezhu', 'qiangdao', 'dutu'], 10, 3));
setup('ltz', 'longgong', 10, ['wushuang'], 'yezhu'); run('L10 longgong+1 vs 3 jiangnan L10', grp(['shuguai', 'yezhu', 'qiangdao', 'dutu'], 10, 3));
setup('jxk', 'datang', 16, ['wushuang'], 'laohu'); run('L16 datang+1 vs 3 guojing L17', grp(['shanzei', 'laohu', 'heixiong', 'huayao'], 17, 3));
setup('jxk', 'datang', 17, ['wushuang'], 'laohu'); run('L17 datang+1 vs BOSS shanzeitou', () => [enemyUnit('shanzeitou', 18), enemyUnit('shanzei', 16), enemyUnit('shanzei', 16)]);
setup('xce', 'putuo', 17, ['wushuang'], 'laohu'); run('L17 putuo+1 vs BOSS shanzeitou', () => [enemyUnit('shanzeitou', 18), enemyUnit('shanzei', 16), enemyUnit('shanzei', 16)]);
setup('hmr', 'pansi', 25, ['wushuang', 'qinchuan'], 'hulijing'); run('L25 pansi+2 vs 4 jingwai L26', grp(['hulijing', 'yangtou', 'hamajing', 'kulou', 'niuyao'], 26, 4));
setup('hmr', 'pansi', 26, ['wushuang', 'qinchuan'], 'hulijing'); run('L26 pansi+2 vs BOSS yaofeng', () => [enemyUnit('yaofeng', 29), enemyUnit('hulijing', 27), enemyUnit('hulijing', 27), enemyUnit('niuyao', 27), enemyUnit('yangtou', 27)]);
setup('jmw', 'mowang', 35, ['wushuang', 'qinchuan', 'mingyue'], 'zhizhu'); run('L35 mowang+3 vs 5 baigu L36', grp(['jiangshi', 'zhizhu', 'yuanhun', 'kulou'], 36, 5));
setup('jmw', 'mowang', 36, ['wushuang', 'qinchuan', 'mingyue'], 'zhizhu'); run('L36 mowang+3 vs BOSS baigujing', () => [enemyUnit('baigujing', 42), enemyUnit('jiangshi', 38), enemyUnit('jiangshi', 38), enemyUnit('yuanhun', 38), enemyUnit('zhizhu', 38), enemyUnit('kulou', 38)]);
setup('jmw', 'mowang', 34, ['wushuang', 'qinchuan'], 'zhizhu'); run('L34 mowang+2 vs BOSS cungu', () => [enemyUnit('cungu', 38), enemyUnit('jiangshi', 36), enemyUnit('zhizhu', 36), enemyUnit('yuanhun', 36)]);
run('L35 mowang+2 vs 7 baigu L36', grp(['jiangshi', 'zhizhu', 'yuanhun', 'kulou'], 36, 7));
setup('ynx', 'nverer', 20, ['wushuang', 'qinchuan'], 'laohu'); run('L20 nverer+2 ghost x5 L20', grp(['niutou', 'mamian', 'yegui'], 20, 5));
setup('ynx', 'nverer', 40, ['wushuang', 'qinchuan','zixia'], 'laohu'); run('L40 nverer+3 vs 5 huaguo L46', grp(['julishenyuan', 'changmei', 'tianjiang'], 46, 5));
setup('ynx', 'nverer', 60, ['wushuang', 'qinchuan','zixia'], 'tianjiang'); run('L60 nverer+3 vs 5 huaguo L55', grp(['julishenyuan', 'changmei', 'tianjiang'], 55, 5));
