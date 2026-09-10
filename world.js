// 用公开场景图建立可游览区域；道路宽度是手工适配，不是客户端碰撞数据。
const World = {
  camera: {x:0,y:0},
  layouts: {
    changan:{width:4400,height:2240,spawn:[52,49],paths:[
      {width:4,points:[[14,86],[28,72],[44,57],[58,44],[72,30],[92,11]]},
      {width:4,points:[[40,91],[53,78],[65,64],[80,49],[96,34]]},
      {width:3,points:[[28,72],[39,83],[53,78]]},
      {width:3,points:[[44,57],[54,68],[65,64]]},
      {width:4,points:[[58,44],[69,56],[80,49]]},
      {width:3,points:[[72,30],[82,41],[96,34]]}
    ]},
    donghai:{width:1800,height:1800,spawn:[12,64],paths:[
      {width:7,points:[[12,65],[21,62],[29,67],[39,64],[50,66],[55,75],[59,82],[72,79],[78,68],[79,55],[81,46]]},
      {width:7,points:[[12,65],[16,53],[24,49],[29,41],[20,36],[13,32],[10,27],[13,23]]},
      {width:6,points:[[29,41],[33,46],[40,45],[46,42],[48,33],[51,29],[59,25],[66,23],[72,18]]},
      {width:6,points:[[48,33],[61,34],[64,36]]},
      {width:7,points:[[59,82],[45,86],[34,90]]}
    ]},
    jiaowai:{width:2400,height:1800,spawn:[12,8],paths:[
      {width:8,points:[[12,8],[17,18],[27,25],[35,38],[39,52],[47,65],[59,67],[73,59],[91,53]]},
      {width:7,points:[[47,65],[47,77],[37,85],[22,92]]},
      {width:5,points:[[27,25],[38,17],[45,13],[55,14],[68,20],[85,22],[92,27]]}
    ]}
  },
  size(scene){return this.layouts[scene]&&Classic.asset('maps',scene)?this.layouts[scene]:{width:960,height:660};},
  distance(x,y,a,b){const dx=b[0]-a[0],dy=b[1]-a[1];const t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t);},
  blocked(scene,x,y){const l=this.layouts[scene];if(!l||!Classic.asset('maps',scene))return null;const px=x/9.6,py=y/6.6;return !l.paths.some(p=>p.points.slice(1).some((b,i)=>this.distance(px,py,p.points[i],b)<=p.width/2));},
  configure(){
    SCENES.changan.npcs=[{id:'yao',name:'药店老板',x:54,y:68},{id:'inn',name:'客栈老板娘',x:58,y:44},{id:'bing',name:'守城老兵',x:80,y:49}];
    SCENES.changan.exits=[{name:'江南野外',emoji:'◎',x:94,y:35,to:'jiaowai',px:12,py:8}];
    SCENES.jiaowai.exits=[{name:'长安城',emoji:'◎',x:12,y:8,to:'changan',px:92,py:36},{name:'建邺城',emoji:'◎',x:91,y:53,to:'jianye',px:15,py:73}];
    SCENES.donghai.exits=[{name:'建邺城',emoji:'◎',x:12,y:65,to:'jianye',px:82,py:72}];
    SCENES.jianye.exits.find(e=>e.to==='donghai').px=12;
    SCENES.jianye.exits.find(e=>e.to==='donghai').py=65;
    SCENES.jianye.exits.find(e=>e.to==='jiaowai').px=89;
    SCENES.jianye.exits.find(e=>e.to==='jiaowai').py=53;
  },
  create(area,scene){const l=this.size(scene);const world=document.createElement('div');world.id='map-world';world.style.width=l.width+'px';world.style.height=l.height+'px';area.append(world);this.camera={x:0,y:0};return world;},
  follow(){const el=$('#map-world');if(!el||!S)return;const area=$('#map-area'),l=this.size(S.scene);this.camera.x=clamp(pPos.x-area.clientWidth/2,0,Math.max(0,l.width-area.clientWidth));this.camera.y=clamp(pPos.y-area.clientHeight*.58,0,Math.max(0,l.height-area.clientHeight));el.style.transform=`translate(${-this.camera.x}px,${-this.camera.y}px)`;},
  snap(scene,px,py){const l=this.size(scene);const point={x:px*9.6,y:py*6.6};const route=Classic.route(scene,point,point);const p=route[0]||point;return {x:p.x*l.width/960,y:p.y*l.height/660};},
  portrait(key){const src=Classic.asset('portraits',key);return src?`<img class="portrait" src="${Classic.escape(src)}" alt="${Classic.escape(CLASSES[key].name)}">`:Classic.actor(key);},
  atlas(){
    const src=Classic.asset('maps',S.scene)||Classic.asset('previews',S.scene);
    const title=S.scene==='jianye'?'建邺城 · 历史资料小地图（非游戏背景）':SCENES[S.scene].name+' · 场景全图';
    openModal('地图',`${src?`<div id="world-overview"><img src="${Classic.escape(src)}" alt="${title}"><i style="left:${S.px}%;top:${S.py}%"></i></div><p class="muted">${title}</p>`:''}<div id="atlas">${Object.entries(SCENES).map(([id,s])=>`<button class="mh-btn" onclick="Classic.navigate('${id}')">${s.name}${id===S.scene?' · 当前':''}</button>`).join('')}</div><p class="muted">点击相邻场景前往出口。地图背景已接入长安、江南野外与东海湾原图。</p>`);
  },
  musicReady:false,
  init(){
    Classic.atlas=()=>this.atlas();
    $('#logo').innerHTML=`<img src="${Classic.asset('ui','logo')}" alt="梦幻西游电脑版">`;
    $('#logo-sub').textContent='经典场景 · 本地试玩';
    $('#title-tip').textContent='已接入公开场景、角色与原声音乐 · 部分素材仍待补齐';
    $('#btn-bgm').title='官网原声音乐 · 点击开启/静音';
    const status=document.createElement('div');status.id='music-status';status.textContent='原声音乐 · 点击右下角开启';$('#stage').append(status);
    const existing=$('#btn-bgm').onclick;$('#btn-bgm').onclick=()=>{existing();this.musicReady=true;};
    for(const id of ['#btn-create','#btn-continue']){const handler=$(id).onclick;$(id).onclick=()=>{handler();if(S&&!this.musicReady){bgmOn=true;$('#btn-bgm').textContent='🔊';Classic.music(S.scene);this.musicReady=true;}};}
    const originalMusic=Classic.music.bind(Classic);Classic.music=scene=>{originalMusic(scene);status.textContent=bgmOn?`原声 · ${scene==='battle'?'战斗':scene==='title'?'长寿郊外':SCENES[scene]?.name||scene}`:'原声音乐 · 已静音';};
  }
};
