// 音乐（官网原声）与合成音效
const TRACKS = {
  title: 'assets/music/title.mp3', jianye: 'assets/music/jianye.mp3', donghai: 'assets/music/donghai.mp3',
  jiaowai: 'assets/music/jiaowai.mp3', changan: 'assets/music/changan.mp3', battle: 'assets/music/battle.mp3',
};
export const Audio2 = {
  musicOn: true, sfxOn: true, cur: null, el: null, ctx: null, unlocked: false,
  load() {
    try { const s = JSON.parse(localStorage.getItem('mhxy-q-audio') || '{}'); if (s.musicOn === false) this.musicOn = false; if (s.sfxOn === false) this.sfxOn = false; } catch (e) { /* 忽略 */ }
  },
  persist() { try { localStorage.setItem('mhxy-q-audio', JSON.stringify({ musicOn: this.musicOn, sfxOn: this.sfxOn })); } catch (e) { /* 忽略 */ } },
  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.ctx = null; }
    if (this.cur) { const c = this.cur; this.cur = null; this.play(c); }
  },
  play(track) {
    if (!TRACKS[track]) track = 'changan';
    if (this.cur === track && this.el) { if (this.musicOn && this.el.paused && this.unlocked) this.el.play().catch(() => {}); return; }
    this.cur = track;
    if (!this.unlocked) return;
    const old = this.el;
    if (old) { const o = old; let v = o.volume; const iv = setInterval(() => { v -= 0.08; if (v <= 0) { o.pause(); clearInterval(iv); } else o.volume = v; }, 40); }
    const el = new Audio(TRACKS[track]);
    el.loop = true; el.volume = 0; this.el = el;
    if (this.musicOn) {
      el.play().then(() => { let v = 0; const iv = setInterval(() => { v += 0.04; if (v >= 0.45 || this.el !== el) { clearInterval(iv); } el.volume = Math.min(0.45, v); }, 40); }).catch(() => {});
    }
  },
  toggleMusic() {
    this.musicOn = !this.musicOn; this.persist();
    if (this.el) { if (this.musicOn) { this.el.volume = 0.45; this.el.play().catch(() => {}); } else this.el.pause(); }
    return this.musicOn;
  },
  toggleSfx() { this.sfxOn = !this.sfxOn; this.persist(); return this.sfxOn; },
  tone(freq, dur, type = 'sine', vol = 0.15, slide = 0, delay = 0) {
    const c = this.ctx; if (!c) return;
    const t = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
  },
  noise(dur, vol = 0.2, freq = 1200, delay = 0) {
    const c = this.ctx; if (!c) return;
    const t = c.currentTime + delay;
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq;
    const g = c.createGain(); g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(c.destination); src.start(t);
  },
  sfx(name) {
    if (!this.sfxOn || !this.ctx) return;
    switch (name) {
      case 'click': this.tone(880, 0.06, 'triangle', 0.08); break;
      case 'open': this.tone(520, 0.08, 'triangle', 0.08); this.tone(780, 0.08, 'triangle', 0.06, 0, 0.05); break;
      case 'hit': this.noise(0.12, 0.25, 900); this.tone(160, 0.1, 'square', 0.06, -80); break;
      case 'crit': this.noise(0.2, 0.35, 700); this.tone(220, 0.18, 'sawtooth', 0.08, -150); break;
      case 'swing': this.noise(0.08, 0.12, 2400); break;
      case 'magic': this.tone(440, 0.3, 'sine', 0.1, 440); this.tone(660, 0.3, 'triangle', 0.06, 300, 0.05); break;
      case 'fire': this.noise(0.4, 0.25, 500); break;
      case 'thunder': this.noise(0.5, 0.4, 300); this.tone(90, 0.4, 'sawtooth', 0.1, -40); break;
      case 'water': this.noise(0.5, 0.18, 1600); break;
      case 'heal': [523, 659, 784].forEach((f, i) => this.tone(f, 0.25, 'sine', 0.08, 0, i * 0.07)); break;
      case 'seal': this.tone(300, 0.3, 'triangle', 0.1, 200); break;
      case 'levelup': [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.1, 0, i * 0.1)); break;
      case 'coin': this.tone(1318, 0.08, 'square', 0.05); this.tone(1760, 0.12, 'square', 0.05, 0, 0.06); break;
      case 'catch': this.tone(600, 0.4, 'sine', 0.1, 600); break;
      case 'win': [659, 784, 988, 1318].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.1, 0, i * 0.09)); break;
      case 'lose': [440, 392, 330, 262].forEach((f, i) => this.tone(f, 0.3, 'sine', 0.1, 0, i * 0.15)); break;
      case 'portal': this.tone(300, 0.5, 'sine', 0.1, 600); break;
      case 'encounter': this.noise(0.3, 0.2, 400); this.tone(200, 0.3, 'sawtooth', 0.08, 300); break;
      case 'quest': [784, 988, 1175].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.09, 0, i * 0.08)); break;
    }
  },
};
