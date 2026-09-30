const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {createApp}=require('../server.js');
let app,base,dir;
before(async()=>{dir=fs.mkdtempSync(path.join(os.tmpdir(),'mhxy-'));app=createApp({dataDir:dir});await new Promise(r=>app.server.listen(0,r));base=`http://127.0.0.1:${app.server.address().port}`;});
after(()=>{app.server.close();app.db.close();fs.rmSync(dir,{recursive:true,force:true});});
async function req(method,url,body,cookie){const res=await fetch(base+url,{method,headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:body&&JSON.stringify(body)});const set=res.headers.get('set-cookie');return {status:res.status,json:await res.json().catch(()=>null),cookie:set&&set.split(';')[0]};}
test('注册、登录、存取云存档',async()=>{
  const r=await req('POST','/api/register',{username:'剑侠客01',password:'secret1'});assert.equal(r.status,201);assert.match(r.cookie,/^mhxy_sid=.+/);
  assert.equal((await req('POST','/api/register',{username:'剑侠客01',password:'secret1'})).status,409);
  assert.equal((await req('GET','/api/me',null,r.cookie)).json.username,'剑侠客01');
  assert.deepEqual((await req('GET','/api/save',null,r.cookie)).json,{data:null,updatedAt:0});
  assert.equal((await req('PUT','/api/save',{data:{v:2,role:'jxk',level:5,savedAt:1}},r.cookie)).status,200);
  const l=await req('POST','/api/login',{username:'剑侠客01',password:'secret1'});assert.equal(l.status,200);
  assert.equal((await req('GET','/api/save',null,l.cookie)).json.data.level,5);
  assert.equal(app.db.prepare('SELECT count(*) n FROM save_history').get().n,1);
  const pw=app.db.prepare('SELECT pass_hash FROM users').get().pass_hash;assert.ok(pw.startsWith('scrypt$')&&!pw.includes('secret1'));
});
test('错误密码、未登录、退出后均被拒绝',async()=>{
  await req('POST','/api/register',{username:'xce',password:'abcdef'});
  assert.equal((await req('POST','/api/login',{username:'xce',password:'wrong!'})).status,401);
  assert.equal((await req('GET','/api/save')).status,401);
  assert.equal((await req('PUT','/api/save',{data:{v:2,role:'x'}},'mhxy_sid=forged')).status,401);
  const l=await req('POST','/api/login',{username:'XCE',password:'abcdef'});assert.equal(l.status,200);
  await req('POST','/api/logout',null,l.cookie);assert.equal((await req('GET','/api/me',null,l.cookie)).json.username,null);
});
test('非法注册与存档格式被拒绝',async()=>{
  assert.equal((await req('POST','/api/register',{username:'a',password:'abcdef'})).status,400);
  assert.equal((await req('POST','/api/register',{username:'bad name',password:'abcdef'})).status,400);
  assert.equal((await req('POST','/api/register',{username:'shortpw',password:'123'})).status,400);
  const r=await req('POST','/api/register',{username:'ltz',password:'abcdef'});
  assert.equal((await req('PUT','/api/save',{data:[1]},r.cookie)).status,400);
  assert.equal((await req('PUT','/api/save',{data:{cls:'jxk'}},r.cookie)).status,400);
  assert.equal((await req('PUT','/api/save',{data:{v:2,role:'ltz',pad:'x'.repeat(300000)}},r.cookie)).status,413);
});
test('只提供游戏文件，数据库和源码不可下载；支持断点续传',async()=>{
  assert.equal((await fetch(base+'/')).status,200);
  assert.equal((await fetch(base+'/src/cloud.js')).status,200);
  assert.equal((await fetch(base+'/style.css')).status,200);
  for(const p of ['/data/mhxy.db','/server.js','/.git/config','/tests/game.test.mjs','/package.json','/src/../server.js','/assets/../server.js','/%2e%2e/server.js'])assert.equal((await fetch(base+p)).status,404,p);
  const res=await fetch(base+'/assets/inventory.json',{headers:{Range:'bytes=0-9'}});assert.equal(res.status,206);assert.equal((await res.arrayBuffer()).byteLength,10);
});
test('删除存档后云端为空，但保留在历史记录中',async()=>{
  const r=await req('POST','/api/register',{username:'fyn',password:'abcdef'});
  await req('PUT','/api/save',{data:{v:2,role:'fyn',level:30}},r.cookie);
  assert.equal((await req('DELETE','/api/save',null,r.cookie)).status,200);
  assert.equal((await req('GET','/api/save',null,r.cookie)).json.data,null);
  const uid=app.db.prepare('SELECT id FROM users WHERE username=?').get('fyn').id;
  assert.equal(app.db.prepare('SELECT count(*) n FROM save_history WHERE user_id=?').get(uid).n,2);
});
test('每日备份生成数据库快照',()=>{app.dailyMaintenance();assert.ok(fs.readdirSync(path.join(dir,'backups')).some(f=>/^mhxy-\d{4}-\d{2}-\d{2}\.db$/.test(f)));});
