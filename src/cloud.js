// 账号与云存档：localStorage 只作为本地缓存，服务器才是存档的权威来源
// 模式：offline（无服务端，如 GitHub Pages）、guest（需要登录）、user（已登录，自动同步）
import { SAVE_KEY } from './state.js';
import { esc } from './util.js';

const OWNER_KEY = 'mhxy-q-save-owner';
const readLocal = () => { try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { return null; } };

async function call(method, url, body) {
  const res = await fetch(url, { method, credentials: 'same-origin', headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
  let data = null; try { data = await res.json(); } catch (e) { /* 非 JSON：没有服务端 */ }
  if (!data || typeof data !== 'object') throw Object.assign(new Error('no api'), { offline: true });
  if (!res.ok) throw Object.assign(new Error(data.error || '请求失败'), { status: res.status });
  return data;
}

export const Cloud = {
  mode: 'connecting', user: null, note: '', pending: null, timer: null, busy: null, warned: false,
  onChange: () => {}, notify: () => {},

  async boot({ onChange, notify } = {}) {
    if (onChange) this.onChange = onChange;
    if (notify) this.notify = notify;
    try {
      const me = await call('GET', 'api/me');
      if (me.username) { this.user = me.username; await this.syncDown(); this.mode = 'user'; } else this.mode = 'guest';
    } catch (e) { this.mode = 'offline'; }
    addEventListener('pagehide', () => this.flush(true));
    this.onChange();
  },

  // 登录后比较本地缓存与云端存档，保留较新的一份
  async syncDown() {
    const { data: remote } = await call('GET', 'api/save');
    const local = readLocal(), owner = localStorage.getItem(OWNER_KEY);
    const mine = local && local.v === 2 && (owner === this.user || !owner) ? local : null;
    localStorage.setItem(OWNER_KEY, this.user);
    if (mine && (!remote || (mine.savedAt || 0) > (remote.savedAt || 0))) {
      await call('PUT', 'api/save', { data: mine });
      this.say(remote ? '本机有更新的进度，已同步到云端。' : '已将本浏览器中的存档迁移到账号。');
    } else if (remote) localStorage.setItem(SAVE_KEY, JSON.stringify(remote));
    else localStorage.removeItem(SAVE_KEY);
  },

  say(msg) { this.note = msg; this.notify(msg); },

  push(data) {
    if (this.mode !== 'user' || !data) return;
    this.pending = JSON.stringify(data);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), 800);
  },

  // 立即上传待同步的存档；返回 true 表示云端已是最新
  async flush(unloading) {
    clearTimeout(this.timer);
    if (this.mode !== 'user') return false;
    if (this.busy) await this.busy;
    if (!this.pending) return true;
    const snapshot = this.pending, body = `{"data":${snapshot}}`;
    this.pending = null;
    const opts = { method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body };
    if (unloading) { fetch('api/save', { ...opts, keepalive: true }).catch(() => {}); return true; }
    this.busy = fetch('api/save', opts)
      .then(res => {
        if (res.ok) { this.warned = false; return true; }
        if (res.status === 401) { this.mode = 'guest'; this.say('登录已过期，进度已暂存在本机，请刷新页面重新登录，登录后会自动同步。'); return false; }
        throw new Error(res.status);
      })
      .catch(() => {
        if (this.pending === null) this.pending = snapshot;   // 期间没有更新的存档，就重试这一份
        if (!this.warned) { this.warned = true; this.say('云端同步失败，进度已暂存在本机，稍后自动重试。'); }
        this.timer = setTimeout(() => this.flush(), 20000);
        return false;
      })
      .finally(() => { this.busy = null; });
    return this.busy;
  },

  // 删除存档（云端会先把当前存档留进历史记录）
  async wipe() {
    clearTimeout(this.timer); this.pending = null;
    if (this.mode === 'user') await call('DELETE', 'api/save');
  },

  async auth(kind, username, password) {
    const r = await call('POST', `api/${kind}`, { username, password });
    this.user = r.username; await this.syncDown(); this.mode = 'user';
    this.onChange();
  },

  async logout() {
    await this.flush();
    try { await call('POST', 'api/logout'); } catch (e) { /* 忽略 */ }
    localStorage.removeItem(SAVE_KEY); localStorage.removeItem(OWNER_KEY);
    this.user = null; this.mode = 'guest'; this.onChange();
  },

  // 标题画面的账号面板
  mount(box) {
    if (this.mode === 'guest') {
      box.innerHTML = `<div class="acc-form">
          <input class="inp" id="acc-user" maxlength="16" placeholder="账号" autocomplete="username">
          <input class="inp" id="acc-pass" type="password" maxlength="72" placeholder="密码（至少6位）" autocomplete="current-password">
          <button class="btn primary" id="acc-login">登录</button><button class="btn" id="acc-register">注册</button></div>
        <div class="acc-msg" id="acc-msg">${esc(this.note || '登录后进度自动保存到服务器，换浏览器、清缓存都不会丢失')}</div>`;
      const go = async kind => {
        const u = box.querySelector('#acc-user').value.trim(), p = box.querySelector('#acc-pass').value, msg = box.querySelector('#acc-msg');
        if (!u || !p) { msg.textContent = '请输入账号和密码'; return; }
        msg.textContent = kind === 'register' ? '注册中…' : '登录中…';
        try { this.note = ''; await this.auth(kind, u, p); } catch (e) { msg.textContent = e.offline ? '无法连接服务器' : e.message; }
      };
      box.querySelector('#acc-login').onclick = () => go('login');
      box.querySelector('#acc-register').onclick = () => go('register');
      box.querySelector('#acc-pass').onkeydown = e => { if (e.key === 'Enter') go('login'); };
    } else if (this.mode === 'user') {
      box.innerHTML = `<div class="acc-who">当前账号：<b>${esc(this.user)}</b> · 云存档已开启 <button class="btn small" id="acc-logout">退出登录</button></div>
        ${this.note ? `<div class="acc-msg">${esc(this.note)}</div>` : ''}`;
      box.querySelector('#acc-logout').onclick = () => this.logout();
    } else box.innerHTML = this.mode === 'connecting' ? '<div class="acc-msg">正在连接服务器…</div>' : '';
    this.note = '';
  },
};
