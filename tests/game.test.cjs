const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
function boot(){
  const nodes=new Map();
  const node=()=>({style:{},children:[],classList:{add(){},remove(){},toggle(){},contains(){return false;}},appendChild(n){this.children.push(n);},append(){},prepend(){},remove(){},addEventListener(){},querySelector(){return node();},set innerHTML(v){this.children=[];},get innerHTML(){return '';},clientWidth:960,clientHeight:660});
  const store=new Map();
  const context={console,document:{querySelector(s){if(!nodes.has(s))nodes.set(s,node());return nodes.get(s);},querySelectorAll(){return [];},createElement:node,addEventListener(){}},setTimeout(fn){fn();return 1;},clearTimeout(){},setInterval(){},clearInterval(){},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},innerWidth:1280,innerHeight:720,addEventListener(){}};
  context.window=context;vm.createContext(context);
  for(const file of ['assets/manifest.js','classic.js','world.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const code=html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
  new vm.Script(code); // 包括初始化部分在内的完整语法检查
  vm.runInContext(code.split('/* ==================== 初始化')[0],context);
  return source=>vm.runInContext(source,context);
}
test('旧龙宫存档可迁移，未知职业被拒绝',()=>{const run=boot();assert.equal(run(`localStorage.setItem(SAVE_KEY,JSON.stringify({cls:'xys',scene:'lost'}));load().cls`),'ltz');assert.equal(run('load().scene'),'jianye');assert.equal(run(`localStorage.setItem(SAVE_KEY,'{"cls":"missing"}');load()`),null);});
test('地图出口双向连接，出生点与所有NPC/出口可达',()=>{const run=boot();assert.equal(run(`Object.entries(SCENES).every(([id,s])=>s.exits.every(e=>SCENES[e.to].exits.some(back=>back.to===id)))`),true);assert.equal(run(`Object.entries(SCENES).every(([id,s])=>[...s.exits,...s.npcs].every(p=>Classic.route(id,{x:300,y:480},{x:p.x*9.6,y:p.y*6.6}).length>0))`),true);});
test('寻路绕过建筑且沿原图道路行走',()=>{const run=boot();assert.equal(run(`Classic.route('jianye',{x:50,y:200},{x:300,y:200}).every(p=>!Classic.blocked('jianye',p.x,p.y))`),true);assert.equal(run(`Classic.route('donghai',{x:200,y:480},{x:900,y:300}).every(p=>!World.blocked('donghai',p.x,p.y))`),true);});
function battle(run){run(`newGame('jxk','test');const el=()=>document.createElement('div');B={over:false,me:{...S,kind:'player',side:'ally',alive:true,el:el()},enemies:[{name:'target',hp:1000,maxHp:1000,def:0,alive:true,side:'enemy',el:el(),bx:20,by:30}],allies:[]};B.allies=[B.me];B.me.bx=70;B.me.by=60;`);}
test('横扫三次打同一目标、扣血并设置一回合休息',async()=>{const run=boot();battle(run);await run(`execAction({type:'skill',actor:B.me,skill:'hsqj',target:B.enemies[0]})`);assert.equal(run('B.me.hp'),117);assert.equal(run('B.me.restTurns'),1);assert.ok(run('B.enemies[0].hp')<950);assert.equal(run('S.hp'),117);});
test('低血横扫不执行；防御减伤；休息不攻击',async()=>{const run=boot();battle(run);run('B.me.hp=65');await run(`execAction({type:'skill',actor:B.me,skill:'hsqj',target:B.enemies[0]})`);assert.equal(run('B.enemies[0].hp'),1000);run('Math.random=()=>0.5');const base=run('physDmg(B.me,B.enemies[0])');run('B.enemies[0].defending=true');assert.ok(run('physDmg(B.me,B.enemies[0])')<=Math.ceil(base/2));await run(`execAction({type:'rest',actor:B.me})`);assert.equal(run('B.enemies[0].hp'),1000);});
test('普度设置持续恢复；日光华固定伤害不受防御影响',async()=>{const run=boot();battle(run);run('B.me.hp=40;B.me.mp=100');await run(`execAction({type:'skill',actor:B.me,skill:'pdzs',target:B.me})`);assert.equal(run('B.me.regen.turns'),3);assert.ok(run('B.me.hp')>40);run('B.enemies[0].def=999');await run(`execAction({type:'skill',actor:B.me,skill:'rgh',target:B.enemies[0]})`);assert.equal(run('B.enemies[0].hp'),975);});
test('任务奖励只能领取一次',()=>{const run=boot();run(`newGame('jxk','test');S.quest={kills:3};Classic.refresh=()=>{};Classic.claimQuest();Classic.claimQuest();`);assert.equal(run('S.money'),450);assert.equal(run('S.items.baozi'),6);});
test('角色名字转义HTML',()=>{const run=boot();assert.equal(run(`Classic.escape('<img src=x>')`),'&lt;img src=x&gt;');});
test('捕获同种新宠也不会被旧出战宠物血量覆盖',()=>{const run=boot();battle(run);run(`const oldPet={mid:'dahaigui',hp:10};B.pet={savedPet:oldPet,mid:'dahaigui',hp:1};S.pet={mid:'dahaigui',hp:56};refreshHudFromBattle();`);assert.equal(run('S.pet.hp'),56);});
test('滚动相机跟随玩家且不会超出地图边界',()=>{const run=boot();run(`newGame('jxk','test');S.scene='donghai';pPos={x:900,y:900};World.follow();`);assert.equal(run('World.camera.x'),420);run(`pPos={x:9999,y:9999};World.follow();`);assert.equal(run('World.camera.x'),840);assert.equal(run('World.camera.y'),1140);run(`pPos={x:0,y:0};World.follow();`);assert.equal(run('World.camera.x'),0);assert.equal(run('World.camera.y'),0);});
