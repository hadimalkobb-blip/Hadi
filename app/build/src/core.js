/* ===== Core: helpers, Quran rendering, state, sound, audio engine, progress ===== */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.random() * a.length | 0];
const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const keyDate = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (k, n) => { const d = keyDate(k); d.setDate(d.getDate() + n); return dayKey(d); };
const daysBetween = (a, b) => Math.round((keyDate(b) - keyDate(a)) / 864e5);
const html = (el, s) => { el.innerHTML = s; return el; };
const node = s => { const t = document.createElement('template'); t.innerHTML = s.trim(); return t.content.firstElementChild; };
const fmtTime = s => `${ARN(Math.floor(s / 60))}:${ARN(String(Math.floor(s % 60)).padStart(2, '0'))}`;
const reduceMotion = () => (S.settings.reduce ?? window.matchMedia('(prefers-reduced-motion: reduce)').matches);

/* ---------- Quran text ---------- */
const NV = 11;
const MARKS = /[ً-ٰٕ]/;
function wordHTML(n, w) {
  const word = QD.verses[n][w], rs = QD.tj[n + ':' + w] || [];
  let out = '', i = 0;
  for (const [a, b, c] of rs) { if (a > i) out += esc(word.slice(i, a)); out += `<span class="t-${c}">${esc(word.slice(a, b))}</span>`; i = b; }
  return out + esc(word.slice(i));
}
const marker = n => `<span class="am">۝${ARN(n)}</span>`;
const qfmt = s => esc(s).replace(/﴿([^﴾]+)﴾/g, '<span class="qinline">﴿$1﴾</span>');
function verseHTML(n, o = {}) {
  const words = QD.verses[n].map((_, w) => `<span class="w" data-v="${n}" data-w="${w}">${wordHTML(n, w)}</span>`).join(' ');
  return words + (o.marker !== false && n > 0 ? '\u00a0' + marker(n) : '');
}
const plainVerse = n => QD.verses[n].join(' ');
function firstCluster(word) { let i = 1; while (i < word.length && MARKS.test(word[i])) i++; return word.slice(0, i); }
function firstLetterHTML(n) {
  return QD.verses[n].map((w, i) => `<span class="w" data-v="${n}" data-w="${i}">${esc(firstCluster(w))}<span style="opacity:.35">ـ…</span></span>`).join(' ');
}
const bareLetter = w => { const c = w[0]; return c === 'ٱ' ? 'ا' : c; };
const lettersOf = n => QD.verses[n].map(bareLetter).join(' ');
const verseRange = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

/* ---------- state ---------- */
const DEF_SETTINGS = { reciter: 'alafasy', rate: 1, goal: 50, sfx: true, haptic: true, bism: true, m2: false, tj: true, fs: 1, meaning: true, textMode: 'full', echo: false, rep: 1, reduce: null, narr: 'tap', narrRate: 1, caps: true, nature: true };
const fresh = () => ({ v: 1, daily: null, xp: 0, days: {}, streak: { n: 0, last: null, best: 0 }, st: {}, badges: {}, best: {}, ideas: [], seen: [], ears: [], reviews: 0, plan: [], palace: null, played: 0, settings: { ...DEF_SETTINGS }, created: Date.now(), updated: 0 });
const LS_KEY = 'duha-journey-v1';
function loadLocal() {
  try { const raw = localStorage.getItem(LS_KEY); if (raw) { const s = JSON.parse(raw); return { ...fresh(), ...s, settings: { ...DEF_SETTINGS, ...(s.settings || {}) }, streak: { ...fresh().streak, ...(s.streak || {}) } }; } } catch (e) { }
  return fresh();
}
let S = loadLocal();
let saveTimer = 0;
function save() {
  S.updated = Date.now();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) { } pushRemote(); if (typeof syncWidget === 'function') syncWidget(); }, 250);
}
function mergeState(a, b) {
  const m = { ...b, ...a };  // fields only one side has survive the merge
  /* personal journals: union by day / entry, never lose what was written on either device */
  if (a.grat || b.grat) { m.grat = { ...(b.grat || {}) }; for (const d in a.grat || {}) { const x = a.grat[d] || [], y = m.grat[d] || []; m.grat[d] = x.length >= y.length ? x : y; } }
  if (a.sealed || b.sealed) { const seen = new Set(); m.sealed = [...(b.sealed || []), ...(a.sealed || [])].filter(x => { const k = x.at + '|' + x.t; if (seen.has(k)) return false; seen.add(k); return true; }); }
  m.seal = a.seal || b.seal || null;
  if (m.seal && (m.sealed || []).some(x => x.at === m.seal.at && x.t === m.seal.t)) m.seal = null;
  if (a.acts || b.acts) m.acts = (a.acts?.stars || 0) >= (b.acts?.stars || 0) ? a.acts : b.acts;
  if (a.heart || b.heart) m.heart = { ...(b.heart || {}), ...(a.heart || {}) };
  for (const k of ['names', 'narrHeard']) if (a[k] || b[k]) m[k] = [...new Set([...(a[k] || []), ...(b[k] || [])])];
  for (const k of ['letters', 'calm']) if (a[k] != null || b[k] != null) m[k] = Math.max(a[k] || 0, b[k] || 0);
  m.xp = Math.max(a.xp || 0, b.xp || 0);
  m.days = { ...b.days }; for (const k in a.days) m.days[k] = Math.max(a.days[k] || 0, m.days[k] || 0);
  const la = a.streak?.last || '', lb = b.streak?.last || '';
  m.streak = { ...(la >= lb ? a.streak : b.streak) }; m.streak.best = Math.max(a.streak?.best || 0, b.streak?.best || 0);
  m.st = { ...b.st };
  for (const k in a.st) {
    const x = a.st[k], y = m.st[k];
    if (!y) { m.st[k] = x; continue; }
    m.st[k] = { done: [x.done, y.done].filter(Boolean).sort()[0] || null, stars: Math.max(x.stars || 0, y.stars || 0), stage: Math.max(x.stage || 0, y.stage || 0), next: (x.stage || 0) >= (y.stage || 0) ? x.next : y.next };
  }
  m.badges = { ...b.badges, ...a.badges };
  m.best = { ...b.best };
  for (const k in a.best) { const lower = /time/i.test(k); m.best[k] = m.best[k] == null ? a.best[k] : (lower ? Math.min(a.best[k], m.best[k]) : Math.max(a.best[k], m.best[k])); }
  for (const k of ['ideas', 'seen', 'ears', 'plan']) m[k] = [...new Set([...(a[k] || []), ...(b[k] || [])])];
  m.reviews = Math.max(a.reviews || 0, b.reviews || 0);
  m.played = Math.max(a.played || 0, b.played || 0);
  m.palace = a.palace || b.palace;
  m.daily = [a.daily, b.daily].filter(Boolean).sort().pop() || null;
  m.settings = { ...DEF_SETTINGS, ...(b.settings || {}), ...(a.settings || {}) };
  return m;
}
/* optional cloud copy of the viewer's own progress (private per person) */
const Sync = { ref: null, ready: false, timer: 0 };
async function initSync() {
  try {
    if (!window.claude || typeof window.claude.use !== 'function') return;
    const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
    if (!db || !user) return;
    const id = await user.id(); if (!id) return;
    const ref = db.doc('data/users/' + id + '/progress');
    const snap = await ref.get();
    if (snap.exists) {
      const d = snap.data();
      if (d && typeof d.state === 'string') { const remote = JSON.parse(d.state); const freshLocal = !S.updated; S = mergeState(S, remote); if (freshLocal) S.settings = { ...DEF_SETTINGS, ...(remote.settings || {}) }; try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) { } refreshAll(); }
    }
    Sync.ref = ref; Sync.ready = true; pushRemote();
  } catch (e) { Sync.ready = false; }
}
function pushRemote() {
  if (!Sync.ready) return;
  clearTimeout(Sync.timer);
  Sync.timer = setTimeout(async () => {
    try { await Sync.ref.set({ state: JSON.stringify(S), updated: Date.now() }); }
    catch (e) { if (e && e.code === 'invalid_argument') Sync.ready = false; }
  }, 2500);
}

/* ---------- sound effects & haptics (never during recitation) ---------- */
const Sfx = {
  ctx: null,
  init() { if (!this.ctx) { const C = window.AudioContext || window.webkitAudioContext; if (C) this.ctx = new C(); } if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
  tone(f, d, type = 'sine', vol = .05, at = 0) {
    if (!S.settings.sfx || !this.ctx || !A.paused) return;
    const t = this.ctx.currentTime + at, o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g).connect(this.ctx.destination); o.start(t); o.stop(t + d + .05);
  },
  ok() { this.tone(880, .25); this.tone(1318.5, .35, 'sine', .04, .08); },
  bad() { this.tone(196, .22, 'triangle', .05); },
  tap() { this.tone(660, .06, 'sine', .025); },
  win() { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, .5, 'sine', .045, i * .11)); },
};
const buzz = p => { if (S.settings.haptic && navigator.vibrate) try { navigator.vibrate(p); } catch (e) { } };

/* ---------- audio engine: per-verse files + word timings ---------- */
const A = new Audio(); A.preload = 'auto';
/* Each verse file is small, so it is kept in memory as a blob: fully seekable whatever the host supports.
   If blob media is refused, fall back to the direct file; if the direct file cannot seek, fall back to the blob. */
const AC = { blobs: new Map(), pending: new Map(), blobOK: true, seekOK: null };
const aurl = (rid, n) => `audio/${rid}/${n}.mp3`;
function blobFor(url) {
  if (!AC.blobOK || typeof fetch !== 'function') return Promise.resolve(null);
  if (AC.blobs.has(url)) return Promise.resolve(AC.blobs.get(url));
  if (!AC.pending.has(url)) {
    const p = fetch(url).then(r => r.ok ? r.blob() : null).then(b => { if (!b || !b.size) return null; const u = URL.createObjectURL(b); AC.blobs.set(url, u); return u; }).catch(() => null);
    AC.pending.set(url, p); p.then(() => AC.pending.delete(url));
  }
  return AC.pending.get(url);
}
let prefetching = null;
function prefetchReciter(rid) { if (prefetching === rid) return; prefetching = rid; (async () => { for (let n = 0; n <= NV; n++) { if (prefetching !== rid) return; await blobFor(aurl(rid, n)); } })(); }
function tim(rid, n) { const t = QD.timing[rid][n]; return { t0: t[0], t1: t[1], d: t[2], b: t[3], rep: t[4] }; }
function wordAt(rid, n, ms) {
  const t = tim(rid, n);
  if (t.rep && ms >= t.rep.b[0] - 80) { const b = t.rep.b; for (let i = b.length - 2; i >= 0; i--) if (ms >= b[i]) return t.rep.w + i; return t.rep.w; }
  const b = t.b;
  if (ms < b[0] - 80) return -1;
  if (t.rep && ms > b[b.length - 1] + 200) return -1;
  for (let i = b.length - 2; i >= 0; i--) if (ms >= b[i] - 40) return i;
  return 0;
}
const Player = { rid: S.settings.reciter, rate: S.settings.rate, tok: null, state: 'idle', cur: null, n: 0, subs: new Set(), blocked: false };
const RNAME = id => { const r = RECITERS.find(x => x.id === id) || RECITERS[0]; return r.name + (r.style !== 'مرتّل' ? ' (' + r.style + ')' : ''); };
function emitP(ev, d) { for (const f of Player.subs) { try { f(ev, d || {}); } catch (e) { console.error(e); } } }
function setSrc(url, startSec) {
  const real = AC.blobs.get(url) || url;
  if (A.dataset.src !== url || A.dataset.real !== real) { A.dataset.src = url; A.dataset.real = real; A.src = real + '#t=' + startSec.toFixed(2); }
  else { try { A.currentTime = startSec; } catch (e) { } }
}
async function recover() {
  const url = A.dataset.src, cur = Player.cur; if (!url || !cur) return false;
  let real;
  if ((A.dataset.real || '').startsWith('blob:')) { AC.blobOK = false; real = url; }
  else real = await blobFor(url);
  if (!real || A.dataset.src !== url) return false;
  A.dataset.real = real; A.src = real + '#t=' + cur.start.toFixed(2);
  A.playbackRate = Player.rate;
  if (Player.state !== 'idle' && !(Player.tok && Player.tok.paused)) A.play().catch(() => { });
  return true;
}
let audioErrShown = false;
A.addEventListener('error', async () => { if (!(await recover())) { emitP('error'); if (!audioErrShown) { audioErrShown = true; toast('تعذّر تشغيل التلاوة هنا. جرّب قارئًا آخر أو أعد فتح الصفحة', 'sound'); } } });
function preload(n, rid = Player.rid) { if (n != null) blobFor(aurl(rid, n)); }
function playSegment(n, sMs, eMs, tok, rid = Player.rid) {
  return new Promise(resolve => {
    const url = aurl(rid, n), start = sMs / 1000;
    Player.cur = { n, start, end: eMs / 1000, rid };
    let done = false, iv = 0;
    const fin = ok => { if (done) return; done = true; A.removeEventListener('timeupdate', chk); A.removeEventListener('ended', end); clearInterval(iv); resolve(ok); };
    const chk = () => { if (tok.dead) { fin(false); return; } if (!tok.paused && A.dataset.src === url && A.currentTime >= Player.cur.end) { A.pause(); fin(true); } };
    const end = () => fin(!tok.dead);
    const go = () => {
      if (tok.dead) { fin(false); return; }
      setSrc(url, start);
      A.playbackRate = Player.rate;
      if (!(A.dataset.real || '').startsWith('blob:') && start > .25) {
        A.addEventListener('playing', () => { if (A.dataset.src === url && Math.abs(A.currentTime - start) > .45) { AC.seekOK = false; recover(); } }, { once: true });
      }
      const pr = A.play();
      if (pr) pr.then(() => { Player.blocked = false; }).catch(err => { if (err && err.name === 'NotAllowedError') { Player.blocked = true; emitP('blocked'); } });
      A.addEventListener('timeupdate', chk); A.addEventListener('ended', end);
      iv = setInterval(chk, 90);
    };
    if (!AC.blobs.has(url) && AC.blobOK && AC.seekOK === false && start > .25) blobFor(url).then(go);
    else { go(); blobFor(url); }
  });
}
function waitTok(ms, tok) {
  return new Promise(res => {
    let left = ms, last = performance.now();
    const iv = setInterval(() => { const now = performance.now(); if (!tok.paused) left -= now - last; last = now; if (tok.dead) { clearInterval(iv); res(false); } else if (left <= 0) { clearInterval(iv); res(true); } }, 70);
  });
}
function stopAll() { if (Player.tok) { Player.tok.dead = true; if (Player.tok.stop) try { Player.tok.stop(); } catch (e) { } } Player.tok = null; Player.sampleId = null; A.pause(); if (Player.state !== 'idle') { Player.state = 'idle'; emitP('end', { done: false }); } }
function pauseP() { if (!Player.tok || Player.tok.paused) return; Player.tok.paused = true; A.pause(); emitP('pause'); }
function resumeP() { if (!Player.tok || !Player.tok.paused) return; Player.tok.paused = false; if (Player.state === 'playing') A.play().catch(() => { }); emitP('resume'); }
async function playSeq(list, o = {}) {
  stopAll(); ppYield();
  const tok = { dead: false, paused: false }; Player.tok = tok; Player.state = 'playing';
  const rep = o.repeat || 1, rid = o.rid || Player.rid;
  emitP('start', { list, rid });
  noteListen(rid); prefetchReciter(rid);
  let finished = false;
  try {
    for (let k = 0; k < list.length; k++) {
      const n = list[k];
      for (let r = 0; r < rep; r++) {
        if (tok.dead) return false;
        const t = tim(rid, n);
        Player.n = n;
        emitP('verse', { n, r, k, rep, total: list.length, rid });
        mediaMeta(n, rid);
        preload(r + 1 < rep ? null : (list[k + 1] ?? (o.loop ? list[0] : null)), rid);
        const ok = await playSegment(n, Math.max(0, t.t0 - 120), Math.min(t.d, t.t1 + 220), tok, rid);
        if (!ok || tok.dead) return false;
        emitP('verseEnd', { n, r });
        if (o.echo) {
          const ms = ((t.t1 - t.t0) / Player.rate) * (o.echoFactor || 1.15) + 700;
          Player.state = 'echo'; emitP('echo', { n, ms });
          const ok2 = await waitTok(ms, tok);
          if (!ok2 || tok.dead) return false;  // stopped during the echo: leave the player idle
          Player.state = 'playing'; emitP('echoEnd', { n });
        } else if (!(k === list.length - 1 && r === rep - 1 && !o.loop)) {
          if (!(await waitTok(o.gap ?? 380, tok))) return false;
        }
      }
      if (o.loop && k === list.length - 1) k = -1;
    }
    finished = true;
    return true;
  } finally {
    if (Player.tok === tok) { Player.tok = null; Player.state = 'idle'; Player.sampleId = null; emitP('end', { done: finished }); }
  }
}
/* a single word: cut from the decoded verse with Web Audio, so it ends exactly before the next word begins
   (an <audio> element checked by timers ran up to ~150 ms late and let the next word's first letters through) */
const WBUF = new Map();
function wordBuf(rid, n) {
  const k = rid + ':' + n;
  if (!WBUF.has(k)) WBUF.set(k, (async () => {
    const u = (await blobFor(aurl(rid, n))) || aurl(rid, n), ab = await (await fetch(u)).arrayBuffer();
    return await new Promise((res, rej) => { const p = Sfx.ctx.decodeAudioData(ab, res, rej); if (p && p.then) p.then(res, rej); });
  })().catch(e => { WBUF.delete(k); throw e; }));
  return WBUF.get(k);
}
function wordSpan(rid, n, w) {
  const t = tim(rid, n), last = !(w + 1 < t.b.length - 1), c = (QD.cut && QD.cut[rid] && QD.cut[rid][n]) || t.b;
  const s = Math.max(0, w ? c[w] - 10 : t.b[w] - 40), e = last ? Math.min(t.d, t.t1 + 140) : c[w + 1] - 10;
  return [s, Math.max(s + 90, e)];
}
function playWord(n, w) { const [s, e] = wordSpan(Player.rid, n, w); return playCut(n, s, e, { n, w }); }
/* several neighbouring words as one cut (a tajweed spot that spans a word boundary: «خيرٌ لّك») */
function playWords(n, w0, w1) { const rid = Player.rid; return playCut(n, wordSpan(rid, n, w0)[0], wordSpan(rid, n, w1)[1], { n, w: w0, w1 }); }
function playCut(n, s, e, ev) {
  stopAll(); Sfx.init();
  const tok = { dead: false, paused: false }; Player.tok = tok; Player.state = 'playing'; Player.n = n;
  emitP('word', ev); prefetchReciter(Player.rid);
  const fin = () => { if (Player.tok === tok) { Player.tok = null; Player.state = 'idle'; emitP('end', { done: true, word: true }); } };
  if (!Sfx.ctx) return playSegment(n, s, e, tok).finally(fin);
  return wordBuf(Player.rid, n).then(buf => new Promise(res => {
    if (tok.dead) return res(false);
    const ctx = Sfx.ctx; if (ctx.state === 'suspended') ctx.resume();
    const src = ctx.createBufferSource(), g = ctx.createGain(), rate = Player.rate || 1, dur = (e - s) / 1000, real = dur / rate, t0 = ctx.currentTime + .02;
    src.buffer = buf; src.playbackRate.value = rate;
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(1, t0 + .01); g.gain.setValueAtTime(1, t0 + Math.max(.02, real - .035)); g.gain.linearRampToValueAtTime(0, t0 + real);
    src.connect(g).connect(ctx.destination); src.start(t0, s / 1000, dur);
    tok.stop = () => { try { g.gain.cancelScheduledValues(ctx.currentTime); g.gain.setTargetAtTime(0, ctx.currentTime, .01); src.stop(ctx.currentTime + .05); } catch (er) { } };
    src.onended = () => res(!tok.dead);
  })).catch(() => tok.dead ? false : playSegment(n, s, e, tok)).finally(fin);
}
function setReciter(id) {
  if (!QD.timing[id]) return;
  stopAll(); Player.rid = id; S.settings.reciter = id; save();
  A.removeAttribute('src'); A.dataset.src = ''; A.dataset.real = ''; prefetchReciter(id);
  emitP('reciter', { id });
}
function noteListen(rid) { if (!S.ears.includes(rid)) { S.ears.push(rid); save(); if (S.ears.length >= 3) award('ears'); } }
function mediaMeta(n, rid = Player.rid) {
  try {
    if (!('mediaSession' in navigator) || typeof MediaMetadata === 'undefined') return;
    navigator.mediaSession.metadata = new MediaMetadata({ title: n ? `سورة الضحى — الآية ${ARN(n)}` : 'سورة الضحى — البسملة', artist: RNAME(rid), album: 'رحلة الضحى' });
  } catch (e) { }
}
/* one clock for highlighting: everyone subscribes to ticks */
const Ticks = new Set();
(function loop() {
  if (Player.cur && Player.state !== 'idle' && Ticks.size) {
    const ms = A.currentTime * 1000, n = Player.cur.n, rid = Player.cur.rid, t = tim(rid, n);
    const w = Player.state === 'echo' ? -1 : wordAt(rid, n, ms);
    const p = Player.state === 'echo' ? 1 : clamp((ms - t.t0) / Math.max(1, t.t1 - t.t0));
    for (const f of Ticks) { try { f({ n, ms, w, p, state: Player.state }); } catch (e) { console.error(e); } }
  }
  requestAnimationFrame(loop);
})();
let wakeLock = null;
async function keepAwake(on) {
  try { if (window.DuhaApp && window.DuhaApp.keepAwake) window.DuhaApp.keepAwake(!!on); } catch (e) { }
  try {
    if (on && !wakeLock && navigator.wakeLock) { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null; }); }
    if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch (e) { wakeLock = null; }
}

/* ---------- progress, levels, badges ---------- */
function levelOf(xp) { let i = 0; LEVELS.forEach((l, k) => { if (xp >= l.xp) i = k; }); return i; }
const SESSION = { newBadges: [] };
function toast(text, icon = 'sparkle') {
  const box = $('#toasts'); if (!box) return;
  const t = node(`<div class="toast" role="status">${ic(icon)}<span>${qfmt(text)}</span></div>`);
  box.appendChild(t); setTimeout(() => t.remove(), 3000);
}
/* save a canvas as a PNG: Android app → native share/save; claude.ai → viewer-confirmed download; browser → share sheet or download */
window.__saved = ok => toast(ok ? 'حُفظت في معرض الصور' : 'اختر أين تحفظها', 'check');
async function saveImage(cv, name) {
  try { if (window.DuhaApp && window.DuhaApp.shareImage) { window.DuhaApp.shareImage(cv.toDataURL('image/png').split(',')[1], name); return true; } } catch (e) { }
  let blob = null; try { blob = await new Promise(r => cv.toBlob(r, 'image/png')); } catch (e) { }
  if (!blob) { toast('تعذّر حفظ الصورة', 'x'); return false; }
  if (window.claude && typeof window.claude.use === 'function') {
    let dl = null; try { dl = await window.claude.use('downloads'); } catch (e) { }
    if (dl) {
      try { await dl.save({ filename: name, data: blob }); toast('حُفظت الصورة', 'check'); return true; }
      catch (e) { const c = e && e.code; if (c === 'declined') return false; if (c === 'rate_limited') { toast('لحظة… ثم جرّب مرة أخرى', 'x'); return false; } }
    }
  }
  try {
    const f = new File([blob], name, { type: 'image/png' });
    if (!window.claude && navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: 'رحلة الضحى' }); return true; }
  } catch (e) { if (e && e.name === 'AbortError') return false; }
  const u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 5000); return true;
}
function award(id) {
  if (S.badges[id]) return false;
  const b = BADGES.find(x => x.id === id); if (!b) return false;
  S.badges[id] = dayKey(); SESSION.newBadges.push(id); save();
  toast(`وسام جديد: ${b.name}`, b.ic); Sfx.win(); buzz([20, 40, 20]);
  updateHeader();
  return true;
}
function touchDay() {
  const k = dayKey();
  if (S.streak.last === k) return;
  const prev = S.streak.last;
  if (prev && daysBetween(prev, k) === 1) S.streak.n += 1;
  else { if (prev && daysBetween(prev, k) > 1) { award('comeback'); toast('﴿مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ﴾ أهلًا بعودتك', 'lantern'); } S.streak.n = 1; }
  S.streak.last = k; S.streak.best = Math.max(S.streak.best || 0, S.streak.n);
  if (S.streak.n >= 3) award('streak3'); if (S.streak.n >= 7) award('streak7'); if (S.streak.n >= 30) award('streak30');
}
function hourBadges() { const h = new Date().getHours(); if (h >= 21 || h < 4) award('night'); if (h >= 8 && h < 11) award('duha'); }
function addXP(n) {
  n = Math.round(n); if (n <= 0) return;
  const before = levelOf(S.xp);
  S.xp += n; const k = dayKey(); S.days[k] = (S.days[k] || 0) + n;
  touchDay(); hourBadges();
  if (S.xp >= 1000) award('xp1000');
  const after = levelOf(S.xp);
  if (after > before) { toast(`مستوى جديد: ${LEVELS[after].name}`, 'sun'); Sfx.win(); }
  save(); updateHeader();
}
const todayXP = () => S.days[dayKey()] || 0;
const stDone = id => !!(S.st[id] && S.st[id].done);
const doneCount = () => [1, 2, 3, 4].filter(stDone).length;
function dueReviews() {
  const k = dayKey();
  return [1, 2, 3, 4, 5].filter(id => S.st[id] && S.st[id].done && S.st[id].next && S.st[id].next <= k);
}
const INTERVALS = [1, 3, 7, 14, 30, 60];
function markStation(id, stars) {
  const k = dayKey(), cur = S.st[id] || {};
  const first = !cur.done;
  S.st[id] = { done: cur.done || k, stars: Math.max(cur.stars || 0, stars), stage: first ? 0 : (cur.stage || 0), next: first ? addDays(k, INTERVALS[0]) : cur.next };
  if (id === 1) award('first');
  if (STATIONS[id - 1]) sqNote(STATIONS[id - 1].verses);
  if ([1, 2, 3, 4].every(stDone)) award('all4');
  save();
}
function markReview(id) {
  const k = dayKey(), cur = S.st[id]; if (!cur) return;
  const stage = Math.min((cur.stage || 0) + 1, INTERVALS.length - 1);
  S.st[id] = { ...cur, stage, next: addDays(k, INTERVALS[stage]) };
  S.reviews = (S.reviews || 0) + 1; if (S.reviews >= 5) award('reviews5');
  if (STATIONS[id - 1]) sqNote(STATIONS[id - 1].verses);
  save();
}
const skyProgress = () => clamp((doneCount() + (stDone(5) ? 1 : 0)) / 5);
