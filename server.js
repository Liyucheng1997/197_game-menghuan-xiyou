// 梦幻西游 · 账号与云存档服务（零依赖：Node 22.13+ 内置 node:sqlite）
// 运行：node server.js    环境变量：PORT(默认8195) DATA_DIR(默认./data)
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 8195;
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(ROOT, 'data'));
const SESSION_DAYS = 30;
const HISTORY_KEEP = 30;          // 每个账号保留的历史存档份数
const BACKUP_KEEP = 14;           // 数据库每日备份保留天数
const MAX_SAVE_BYTES = 256 * 1024;
const STATIC_FILES = new Set(['index.html', 'style.css']);
const STATIC_DIRS = ['assets/', 'src/'];
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.md': 'text/plain; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav' };

/* ==================== 数据库 ==================== */
function openDb(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(`PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      pass_hash TEXT NOT NULL, created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS saves (user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      data TEXT NOT NULL, updated_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS save_history (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      data TEXT NOT NULL, saved_at INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS idx_history_user ON save_history(user_id, id);`);
  return db;
}

/* ==================== 密码与会话 ==================== */
function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(pw, salt, 64);
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}
function verifyPassword(pw, stored) {
  const [alg, saltHex, keyHex] = String(stored).split('$');
  if (alg !== 'scrypt' || !saltHex || !keyHex) return false;
  const key = crypto.scryptSync(pw, Buffer.from(saltHex, 'hex'), 64);
  return crypto.timingSafeEqual(key, Buffer.from(keyHex, 'hex'));
}
const sha256 = s => crypto.createHash('sha256').update(s).digest('hex');

// 简单的登录失败限速：同一 IP 15 分钟内最多失败 10 次
const failures = new Map();
function tooManyFailures(ip) {
  const f = failures.get(ip);
  if (!f || Date.now() - f.since > 15 * 60e3) { failures.delete(ip); return false; }
  return f.count >= 10;
}
function noteFailure(ip) {
  const f = failures.get(ip);
  if (!f || Date.now() - f.since > 15 * 60e3) failures.set(ip, { count: 1, since: Date.now() });
  else f.count++;
}

/* ==================== 工具 ==================== */
function send(res, status, body, headers = {}) {
  const data = body === undefined ? '' : JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.end(data);
}
function readJson(req, limit = MAX_SAVE_BYTES + 4096) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size <= limit) chunks.push(c); });  // 超限部分直接丢弃，读完后返回 413
    req.on('end', () => {
      if (size > limit) return reject(Object.assign(new Error('too large'), { status: 413 }));
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch { reject(Object.assign(new Error('bad json'), { status: 400 })); } });
    req.on('error', reject);
  });
}
function parseCookies(req) {
  const out = {};
  for (const part of String(req.headers.cookie || '').split(';')) {
    const i = part.indexOf('='); if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}
const clientIp = req => String(req.headers['x-real-ip'] || req.socket.remoteAddress || '');
const isHttps = req => req.headers['x-forwarded-proto'] === 'https';
function sessionCookie(req, token, maxAge) {
  return `mhxy_sid=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${isHttps(req) ? '; Secure' : ''}`;
}
function validUsername(u) { return typeof u === 'string' && /^[\p{L}\p{N}_]{2,16}$/u.test(u); }
function validPassword(p) { return typeof p === 'string' && p.length >= 6 && p.length <= 72; }

/* ==================== 应用 ==================== */
function createApp({ dataDir = DATA_DIR } = {}) {
  const db = openDb(path.join(dataDir, 'mhxy.db'));
  const q = {
    userByName: db.prepare('SELECT * FROM users WHERE username = ?'),
    addUser: db.prepare('INSERT INTO users (username, pass_hash, created_at) VALUES (?, ?, ?)'),
    addSession: db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)'),
    session: db.prepare('SELECT u.id, u.username FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?'),
    delSession: db.prepare('DELETE FROM sessions WHERE token_hash = ?'),
    purgeSessions: db.prepare('DELETE FROM sessions WHERE expires_at <= ?'),
    getSave: db.prepare('SELECT data, updated_at FROM saves WHERE user_id = ?'),
    putSave: db.prepare(`INSERT INTO saves (user_id, data, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`),
    delSave: db.prepare('DELETE FROM saves WHERE user_id = ?'),
    addHistory: db.prepare('INSERT INTO save_history (user_id, data, saved_at) VALUES (?, ?, ?)'),
    trimHistory: db.prepare(`DELETE FROM save_history WHERE user_id = ? AND id NOT IN
      (SELECT id FROM save_history WHERE user_id = ? ORDER BY id DESC LIMIT ${HISTORY_KEEP})`),
    lastHistory: db.prepare('SELECT saved_at FROM save_history WHERE user_id = ? ORDER BY id DESC LIMIT 1'),
  };

  function startSession(req, userId) {
    const token = crypto.randomBytes(32).toString('base64url');
    q.addSession.run(sha256(token), userId, Date.now() + SESSION_DAYS * 86400e3);
    return sessionCookie(req, token, SESSION_DAYS * 86400);
  }
  function currentUser(req) {
    const token = parseCookies(req).mhxy_sid;
    return token ? q.session.get(sha256(token), Date.now()) || null : null;
  }

  async function api(req, res, route) {
    const m = req.method;
    if (route === '/api/register' && m === 'POST') {
      const { username, password } = await readJson(req);
      if (!validUsername(username)) return send(res, 400, { error: '账号需为 2-16 位中文、字母、数字或下划线' });
      if (!validPassword(password)) return send(res, 400, { error: '密码长度需为 6-72 位' });
      if (q.userByName.get(username)) return send(res, 409, { error: '该账号已被注册' });
      const { lastInsertRowid } = q.addUser.run(username, hashPassword(password), Date.now());
      return send(res, 201, { username }, { 'Set-Cookie': startSession(req, Number(lastInsertRowid)) });
    }
    if (route === '/api/login' && m === 'POST') {
      const ip = clientIp(req);
      if (tooManyFailures(ip)) return send(res, 429, { error: '尝试次数过多，请 15 分钟后再试' });
      const { username, password } = await readJson(req);
      const user = typeof username === 'string' && q.userByName.get(username);
      if (!user || typeof password !== 'string' || !verifyPassword(password, user.pass_hash)) {
        noteFailure(ip); return send(res, 401, { error: '账号或密码错误' });
      }
      return send(res, 200, { username: user.username }, { 'Set-Cookie': startSession(req, user.id) });
    }
    if (route === '/api/logout' && m === 'POST') {
      const token = parseCookies(req).mhxy_sid;
      if (token) q.delSession.run(sha256(token));
      return send(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie(req, '', 0) });
    }

    const user = currentUser(req);
    if (route === '/api/me' && m === 'GET') return send(res, 200, { username: user ? user.username : null });
    if (!user) return send(res, 401, { error: '登录已过期，请重新登录' });

    if (route === '/api/save' && m === 'GET') {
      const row = q.getSave.get(user.id);
      return send(res, 200, row ? { data: JSON.parse(row.data), updatedAt: row.updated_at } : { data: null, updatedAt: 0 });
    }
    if (route === '/api/save' && m === 'PUT') {
      const { data } = await readJson(req);
      if (!data || typeof data !== 'object' || Array.isArray(data) || data.v !== 2 || typeof data.role !== 'string')
        return send(res, 400, { error: '存档格式不正确' });
      const text = JSON.stringify(data);
      if (Buffer.byteLength(text) > MAX_SAVE_BYTES) return send(res, 413, { error: '存档过大' });
      const now = Date.now();
      db.exec('BEGIN');
      try {
        q.putSave.run(user.id, text, now);
        // 历史版本最多每 5 分钟留一份，防止误覆盖后无法找回
        const last = q.lastHistory.get(user.id);
        if (!last || now - last.saved_at > 5 * 60e3) { q.addHistory.run(user.id, text, now); q.trimHistory.run(user.id, user.id); }
        db.exec('COMMIT');
      } catch (e) { db.exec('ROLLBACK'); throw e; }
      return send(res, 200, { updatedAt: now });
    }
    if (route === '/api/save' && m === 'DELETE') {
      // 删档前把当前进度写进历史，误删后仍可由管理员找回
      const row = q.getSave.get(user.id);
      if (row) { q.addHistory.run(user.id, row.data, Date.now()); q.trimHistory.run(user.id, user.id); q.delSave.run(user.id); }
      return send(res, 200, { ok: true });
    }
    return send(res, 404, { error: '接口不存在' });
  }

  function serveStatic(req, res, route) {
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'Method Not Allowed' });
    let rel;
    try { rel = decodeURIComponent(route).replace(/^\/+/, '') || 'index.html'; } catch { return send(res, 400, { error: 'Bad path' }); }
    const norm = path.posix.normalize(rel);
    // 只对外提供游戏页面与 assets 目录，数据库、源码目录等一律不可访问
    const allowed = STATIC_FILES.has(norm) || (STATIC_DIRS.some(d => norm.startsWith(d)) && !norm.split('/').some(p => p.startsWith('.')));
    const file = path.join(ROOT, norm);
    if (!allowed || !file.startsWith(ROOT + path.sep)) return send(res, 404, { error: 'Not Found' });
    fs.stat(file, (err, st) => {
      if (err || !st.isFile()) return send(res, 404, { error: 'Not Found' });
      const headers = { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'Accept-Ranges': 'bytes', 'Last-Modified': st.mtime.toUTCString(),
        'Cache-Control': norm.startsWith('assets/') ? 'public, max-age=604800' : 'no-cache' };
      if (req.headers['if-modified-since'] && new Date(req.headers['if-modified-since']) >= new Date(st.mtime.toUTCString())) {
        res.writeHead(304, headers); return res.end();
      }
      let start = 0, end = st.size - 1, status = 200;
      const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
      if (range && (range[1] || range[2])) {
        if (range[1]) { start = Number(range[1]); if (range[2]) end = Math.min(Number(range[2]), end); }
        else start = Math.max(0, st.size - Number(range[2]));
        if (start > end) { res.writeHead(416, { 'Content-Range': `bytes */${st.size}` }); return res.end(); }
        status = 206; headers['Content-Range'] = `bytes ${start}-${end}/${st.size}`;
      }
      headers['Content-Length'] = end - start + 1;
      res.writeHead(status, headers);
      if (req.method === 'HEAD') return res.end();
      fs.createReadStream(file, { start, end }).pipe(res);
    });
  }

  const server = http.createServer((req, res) => {
    const route = new URL(req.url, 'http://x').pathname;
    if (!route.startsWith('/api/')) return serveStatic(req, res, route);
    api(req, res, route).catch(err => {
      if (!err.status) console.error(err);
      if (!res.headersSent) send(res, err.status || 500, { error: err.status === 413 ? '存档过大' : err.status ? '请求内容不正确' : '服务器内部错误' });
    });
  });

  // 每日备份数据库（VACUUM INTO 生成一致的快照），并清理过期会话
  function dailyMaintenance() {
    try {
      q.purgeSessions.run(Date.now());
      const dir = path.join(dataDir, 'backups'); fs.mkdirSync(dir, { recursive: true });
      const file = path.join(dir, `mhxy-${new Date().toISOString().slice(0, 10)}.db`);
      if (!fs.existsSync(file)) db.exec(`VACUUM INTO '${file.replace(/'/g, "''")}'`);
      fs.readdirSync(dir).filter(f => /^mhxy-\d{4}-\d{2}-\d{2}\.db$/.test(f)).sort().slice(0, -BACKUP_KEEP)
        .forEach(f => fs.unlinkSync(path.join(dir, f)));
    } catch (e) { console.error('备份失败', e); }
  }
  const timer = setInterval(dailyMaintenance, 3600e3); timer.unref();

  return { server, db, dailyMaintenance };
}

module.exports = { createApp, hashPassword, verifyPassword };

if (require.main === module) {
  const { server, dailyMaintenance } = createApp();
  dailyMaintenance();
  server.listen(PORT, () => console.log(`梦幻西游服务已启动：http://localhost:${PORT}  数据目录：${DATA_DIR}`));
}
