/* 本地经典玩法原型。程序绘图仅为占位素材，不是原版资源。 */
const Classic = {
  escape(value) { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); },
  asset(group, key) { return window.CLASSIC_ASSETS?.[group]?.[key] || ''; },
  actor(key) {
    const src = this.asset('actors', key);
    if (src) return `<img class="asset-actor" src="${this.escape(src)}" alt="角色素材" onerror="this.outerHTML=Classic.fallbackActor('${/^[a-z]+$/.test(key)?key:'jxk'}')">`;
    return this.fallbackActor(key);
  },
  fallbackActor(key) {
    const color = {jxk:'#3779b8',ltz:'#dedad0',xce:'#cc78a9',yao:'#9e7450',inn:'#a84e66',bing:'#637a86'}[key] || '#6f9074';
    if (['dahaigui','juwa','haimaochong','xiejiang','shuguai'].includes(key)) {
      const body = key === 'dahaigui' ? '<ellipse cx="31" cy="53" rx="22" ry="17" fill="#506951"/><path d="m15 47 17-9 16 11-8 15-17-1Z" fill="#809568" stroke="#344f44" stroke-width="3"/><circle cx="52" cy="55" r="8" fill="#b1b982"/>' : key === 'haimaochong' ? '<path d="M12 60 Q22 35 43 53" fill="none" stroke="#d9a457" stroke-width="17"/><circle cx="46" cy="48" r="10" fill="#e8c26e"/><circle cx="49" cy="45" r="2"/>' : '<ellipse cx="32" cy="55" rx="23" ry="17" fill="#7ca175"/><circle cx="20" cy="40" r="8" fill="#b3c98c"/><circle cx="44" cy="40" r="8" fill="#b3c98c"/><circle cx="21" cy="39" r="3"/><circle cx="43" cy="39" r="3"/>';
      return `<svg viewBox="0 0 64 86" xmlns="http://www.w3.org/2000/svg"><ellipse cx="32" cy="78" rx="25" ry="6" fill="#17313255"/>${body}</svg>`;
    }
    return `<svg viewBox="0 0 64 86" xmlns="http://www.w3.org/2000/svg"><ellipse cx="32" cy="80" rx="22" ry="5" fill="#17313255"/><path d="m24 64-5 14h12l2-14m7 0 4 14h10l-7-19" fill="#293741"/><path d="m22 38-9 28 22 6 15-9-8-25" fill="${color}" stroke="#344753" stroke-width="2"/><path d="m25 40 9 24 7-25M16 59l29 3" fill="none" stroke="#e9cf8b" stroke-width="3"/><path d="m19 43-9 16m32-17 11 12" stroke="${color}" stroke-width="9" stroke-linecap="round"/><circle cx="32" cy="26" r="13" fill="#e9c09c"/><path d="M19 28Q10 5 30 9Q49 7 47 29L39 18l-18 6Z" fill="#25353e"/><path d="m28 10 8-9 6 12" fill="#25353e"/><path d="m18 15 28 1" stroke="#d2ac5e" stroke-width="3"/><path d="m28 29 2 0m9 0 2 0" stroke="#47372f" stroke-width="2"/><path d="m52 58 7-32" stroke="#dae7e7" stroke-width="4"/><path d="m47 59 12 3" stroke="#c7a660" stroke-width="3"/></svg>`;
  },
  blocked(scene,x,y){
    const real=World.blocked(scene,x,y);if(real!==null)return real;
    if(x<15||x>945||y<95||y>645)return true;
    if(scene==='donghai'&&x>590)return true;
    if(['changan','jianye'].includes(scene))return [[75,115,260,270],[355,60,565,210],[645,150,830,300],[80,0,225,125]].some(([l,t,r,b])=>x>=l&&x<=r&&y>=t&&y<=b);
    return false;
  },
  route(scene,from,to){
    const cols=48,rows=33,cell=20;
    const nearest=p=>{let best=-1,dist=Infinity;for(let n=0;n<cols*rows;n++){const x=n%cols*cell+10,y=Math.floor(n/cols)*cell+10;if(this.blocked(scene,x,y))continue;const d=(x-p.x)**2+(y-p.y)**2;if(d<dist){best=n;dist=d;}}return best;};
    const start=nearest(from),end=nearest(to);if(start<0||end<0)return [];
    const queue=[start],prev=new Map([[start,null]]);
    for(let i=0;i<queue.length&&!prev.has(end);i++){const n=queue[i],x=n%cols,y=Math.floor(n/cols);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const a=x+dx,b=y+dy,k=b*cols+a;if(a<0||a>=cols||b<0||b>=rows||prev.has(k)||this.blocked(scene,a*cell+10,b*cell+10))continue;prev.set(k,n);queue.push(k);}}
    if(!prev.has(end))return [];const path=[];for(let n=end;n!==start;n=prev.get(n))path.push({x:n%cols*cell+10,y:Math.floor(n/cols)*cell+10});path.push({x:start%cols*cell+10,y:Math.floor(start/cols)*cell+10});return path.reverse();
  },
  moveTo(x,y,callback=null){const area=World.size(S.scene);movePath=this.route(S.scene,{x:pPos.x*960/area.width,y:pPos.y*660/area.height},{x:x*960/area.width,y:y*660/area.height}).map(p=>({x:p.x*area.width/960,y:p.y*area.height/660}));moveTarget=movePath.shift()||null;pendingAction=moveTarget?callback:null;},
  configure() {
    SCENES.changan.decor = [];
    SCENES.changan.exits = [{name:'江南野外',emoji:'◎',x:89,y:78,to:'jiaowai',px:15,py:72}];
    SCENES.jiaowai = {name:'江南野外',wild:true,cls:'jiaowai',decor:[],npcs:[],pool:['juwa','shuguai','qiangdao'],exits:[{name:'长安城',emoji:'◎',x:10,y:72,to:'changan',px:82,py:76},{name:'建邺城',emoji:'◎',x:88,y:72,to:'jianye',px:15,py:73}]};
    SCENES.jianye = {name:'建邺城',wild:false,cls:'changan',decor:[],npcs:[{id:'yao',name:'药店老板',x:25,y:53},{id:'inn',name:'客栈老板娘',x:49,y:46},{id:'bing',name:'巡城守卫',x:68,y:64}],exits:[{name:'江南野外',emoji:'◎',x:9,y:74,to:'jiaowai',px:81,py:72},{name:'东海湾',emoji:'◎',x:90,y:74,to:'donghai',px:16,py:72}]};
    SCENES.donghai = {name:'东海湾',wild:true,cls:'jiaowai',decor:[],npcs:[],pool:['dahaigui','haimaochong'],exits:[{name:'建邺城',emoji:'◎',x:10,y:74,to:'jianye',px:82,py:72}]};
  },
  mapArt(area, scene) {
    const source=this.asset('maps',scene);
    if(source){
      const img=document.createElement('img');img.className='map-art original-map';img.alt=SCENES[scene].name;img.src=source;img.draggable=false;
      img.onerror=()=>{img.remove();area.classList.add('asset-missing');log('场景原图读取失败，请检查本地 assets/maps 文件。');};
      area.prepend(img);return;
    }
    const canvas = document.createElement('canvas');canvas.width=960;canvas.height=660;canvas.className='map-art';area.prepend(canvas);
    const c=canvas.getContext('2d');
    const coast=scene==='donghai',city=['changan','jianye'].includes(scene);
    c.fillStyle=coast?'#cebd8d':city?'#a6b490':'#8ca777';c.fillRect(0,0,960,660);
    let seed=scene.length*739; const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    for(let i=0;i<2400;i++){c.fillStyle=i%2?'#fff8cc14':'#304e3814';c.fillRect(rand()*960,rand()*660,2+rand()*5,1+rand()*2);}
    c.lineCap='round';c.strokeStyle=city?'#c9c5a6':'#bfb58a';c.lineWidth=city?110:85;c.beginPath();c.moveTo(-40,490);c.bezierCurveTo(280,440,420,530,1000,475);c.stroke();
    if(city){c.lineWidth=80;c.beginPath();c.moveTo(240,80);c.lineTo(240,460);c.moveTo(470,40);c.lineTo(490,500);c.stroke();c.strokeStyle='#8e9b872e';c.lineWidth=1;for(let y=435;y<540;y+=16){c.beginPath();c.moveTo(0,y);c.lineTo(960,y);c.stroke();for(let x=(y%32)*2;x<960;x+=48)c.strokeRect(x,y,48,16);}}
    const tree=(x,y,s=1)=>{c.save();c.translate(x,y);c.scale(s,s);c.fillStyle='#1b48362b';c.beginPath();c.ellipse(10,12,40,13,0,0,7);c.fill();c.fillStyle='#705b40';c.fillRect(-5,-48,10,58);for(const [a,b,r] of [[0,-75,34],[-22,-51,29],[22,-53,30],[0,-40,29]]){c.fillStyle=b===-75?'#668754':'#477653';c.beginPath();c.arc(a,b,r,0,7);c.fill();}c.restore();};
    const house=(x,y,w,label)=>{c.save();c.translate(x,y);c.fillStyle='#1d393933';c.fillRect(7,10,w,88);c.fillStyle='#d9c89d';c.fillRect(0,0,w,80);c.fillStyle='#9a7352';c.fillRect(0,65,w,15);c.fillStyle='#415b60';c.beginPath();c.moveTo(-17,5);c.lineTo(15,-53);c.lineTo(w-15,-53);c.lineTo(w+18,5);c.closePath();c.fill();c.strokeStyle='#738b86';c.lineWidth=3;for(let k=0;k<5;k++){c.beginPath();c.moveTo(-15+k*6,3-k*11);c.lineTo(w+15-k*6,3-k*11);c.stroke();}c.fillStyle='#594b3a';c.fillRect(w*.4,32,w*.2,48);c.fillStyle='#4c6260';c.fillRect(12,27,22,27);c.fillRect(w-34,27,22,27);c.fillStyle='#584831';c.fillRect(w/2-35,5,70,24);c.fillStyle='#efd99c';c.font='15px SimSun';c.textAlign='center';c.fillText(label,w/2,23);for(const k of [5,w-5]){c.fillStyle='#b44f3c';c.beginPath();c.ellipse(k,26,8,12,0,0,7);c.fill();c.fillStyle='#edc374';c.fillRect(k-1,36,2,10);}c.restore();};
    if(city){house(90,180,150,'药铺');house(370,120,175,'客栈');house(660,210,155,scene==='changan'?'长安商会':'建邺民居');house(95,40,120,'民居');tree(65,330,1.2);tree(595,260,1.2);tree(845,380,1.2);tree(340,340,.8);}
    else if(coast){c.fillStyle='#578e9d';c.beginPath();c.moveTo(670,0);c.bezierCurveTo(490,250,850,350,700,660);c.lineTo(960,660);c.lineTo(960,0);c.fill();c.strokeStyle='#d6e6c4';c.lineWidth=8;c.beginPath();c.moveTo(670,0);c.bezierCurveTo(490,250,850,350,700,660);c.stroke();for(let i=0;i<30;i++){c.strokeStyle='#c2e0d04a';c.lineWidth=2;const x=760+rand()*180,y=rand()*650;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+15,y+6,x+35,y);c.stroke();}tree(100,160,1.3);tree(200,240);}
    else {for(const [x,y,s] of [[80,140,1.2],[210,250,1],[390,170,1.3],[590,260,1.2],[840,190,1.4],[700,380,.9],[55,620,1],[850,645,1.3]])tree(x,y,s);c.fillStyle='#6a8d86';c.beginPath();c.ellipse(490,300,85,45,-.2,0,7);c.fill();}
    const path=this.asset('maps',scene);if(path){const img=document.createElement('img');img.className='map-art';img.alt=SCENES[scene].name;img.src=path;img.onerror=()=>{img.remove();log('地图资源加载失败，已回退占位图。');};area.append(img);}
  },
  effect(actor,key){const el=document.createElement('div');el.className='skill-effect'+(key==='pdzs'?' healing':'');el.style.left=actor.bx+'%';el.style.top=actor.by+'%';const src=this.asset('effects',key);if(src)el.innerHTML=`<img src="${this.escape(src)}" alt="">`;$('#battle-field').append(el);setTimeout(()=>el.remove(),700);},
  refresh(){if(!S)return;$('#coordinates').textContent=`${Math.round(S.px*3.2)}, ${Math.round(S.py*2.4)}　·　${SCENES[S.scene].wild?'野外':'安全区'}`;const q=S.quest;$('#quest-tracker').innerHTML='<strong>任务追踪</strong>'+(q?`巡逻试炼（试玩任务）<br>野外战斗 ${q.kills} / 3<br>${q.kills>=3?'返回任一城镇守卫处交付':'前往东海湾或江南野外'}`:'与城镇守卫对话<br>领取巡逻试炼');},
  quest(){const q=S.quest;openModal('巡逻试炼',q?(q.kills>=3?'巡逻完成。<div class="row">奖励：150 两银子、3 个包子<button class="mh-btn" onclick="Classic.claimQuest()">交付任务</button></div>':`已完成 ${q.kills} / 3 场野外战斗。`):'到野外完成三场战斗，再回来向我报到。<p class="muted">这是用于验证任务流程的本地试玩任务，不是原版剧情。</p><button class="mh-btn" onclick="Classic.acceptQuest()">领取任务</button>');},
  acceptQuest(){if(!S.quest)S.quest={kills:0};save();this.refresh();closeModal();},
  claimQuest(){if(!S.quest||S.quest.kills<3)return;S.money+=150;S.items.baozi=(S.items.baozi||0)+3;S.quest=null;save();updateHUD();this.refresh();closeModal();log('巡逻完成：获得150两、包子×3。');},
  atlas(){openModal('地图',`<div id="atlas">${Object.entries(SCENES).map(([id,s])=>`<button class="mh-btn" onclick="Classic.navigate('${id}')">${s.name}${id===S.scene?' · 当前':''}<br><small>${s.wild?'野外遇敌':'城镇安全区'}</small></button>`).join('')}</div><p class="muted">路线：长安城 ↔ 江南野外 ↔ 建邺城 ↔ 东海湾。点击相邻地图可自动走向出口。</p>`);},
  navigate(id){if(id===S.scene)return closeModal();const e=SCENES[S.scene].exits.find(e=>e.to===id);if(!e){openModal('路线提示','请沿地图连接逐一前往：长安城 ↔ 江南野外 ↔ 建邺城 ↔ 东海湾。');return;}closeModal();walkThen(e.x,e.y,()=>{enterMap(e.to,e.px,e.py);save();});},
  skills(){openModal('门派法术',`<p>${CLASSES[S.cls].school}</p>${CLASSES[S.cls].skills.map(id=>`<div class="row"><strong>${SKILLS[id].name}</strong><span>${SKILLS[id].desc}</span></div>`).join('')}<p class="muted">技能数值、等级开放与持续回合为试玩配置，尚未逐项校准历史版本。</p>`);},
  audio:null,
  music(scene){
    if(this.audio){this.audio.pause();this.audio.remove();this.audio=null;}
    if(!bgmOn)return;
    const src=this.asset('music',scene);if(!src){log('该场景尚未配置音乐资源。');return;}
    const a=new Audio(src);this.audio=a;a.id='scene-audio';a.hidden=true;a.loop=true;a.volume=.35;a.preload='auto';$('#stage').append(a);
    const failure=()=>{if(this.audio!==a)return;log('音乐未能播放，请检查资源路径和格式。');const status=$('#music-status');if(status)status.textContent='音乐加载失败 · 点击音符重试';};
    a.onerror=failure;a.play().catch(failure);
  },
  init(){const coord=document.createElement('div');coord.id='coordinates';$('#screen-map').append(coord);const q=document.createElement('div');q.id='quest-tracker';$('#screen-map').append(q);const chat=document.createElement('div');chat.id='chatline';chat.innerHTML='[系统] <span>单机游历　·　点击地面行走</span>';$('#screen-map').append(chat);const label=document.createElement('div');label.id='round-label';$('#screen-battle').append(label);
    for(const [text,fn] of [['地图',()=>this.atlas()],['法术',()=>this.skills()],['任务',()=>this.quest()]]){const b=document.createElement('button');b.className='mh-btn';b.textContent=text;b.onclick=fn;$('#hud-btns').prepend(b);}
    const fit=()=>{$('#stage').style.transform=`scale(${Math.min(1,innerWidth/964,innerHeight/724)})`;};addEventListener('resize',fit);fit();
    document.addEventListener('keydown',e=>{if(e.target.matches('input,textarea'))return;if(e.key==='Escape'){closeModal();return;}if(!S||inBattle)return;if(e.altKey&&['e','p','q','w'].includes(e.key.toLowerCase())){e.preventDefault();({e:openBag,p:openPet,q:()=>this.quest(),w:()=>this.skills()})[e.key.toLowerCase()]();}if(e.key==='Tab'){e.preventDefault();this.atlas();}});
    $('#btn-bgm').onclick=()=>{bgmOn=!bgmOn;$('#btn-bgm').textContent=bgmOn?'🔊':'🔇';this.music(inBattle?'battle':S?.scene||'title');};
    $('#title-tip').textContent='经典端游方向 · 单机试玩 · 当前使用程序绘制占位素材';
  }
};
