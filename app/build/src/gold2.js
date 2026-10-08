/* ===== The golden features, part two (v4.1)
   «التسميع الحيّ» (103): the verses hide; every word you say right turns to gold, a pause brings a hint,
   a wrong word shakes, and every stumble is kept for «كلماتك الصعبة».
   «مرآة التلاوة» (104): the reciter's voice drawn as a ribbon of light — madd stretches it, ghunnah makes it glow —
   the counts of each madd lit as dots and felt as pulses, and your own recording laid under it. ===== */

/* =====================================================================================
   103 · التسميع الحيّ
   ===================================================================================== */
const LR_HINT_MS = 5000;
const LR_ST = { ok: 'من حفظك', hint: 'بعد تلميح', shown: 'كُشفت لك', skip: 'فاتتك' };
const LR_MARK = /[ً-ٰٟۖ-ۭـ]/;
const Live = { L: null, s: null };

/* like alignWords, and also where the last matching heard token sits (what follows it was not the next word) */
function lrAlign(expected, heard) {
  const st = expected.map(() => 0); let p = 0, lastH = -1;
  for (let hi = 0; hi < heard.length && p < expected.length; hi++) {
    let best = -1, bs = 0;
    for (let j = p; j < Math.min(expected.length, p + 4); j++) { const s = wordSim(heard[hi], expected[j]) - (j - p) * .04; if (s > bs) { bs = s; best = j; } }
    if (best >= 0 && bs >= .58) { for (let j = p; j < best; j++) st[j] = 2; st[best] = 1; p = best + 1; lastH = hi; }
  }
  return { st, lastH };
}
/* «كلماتك الصعبة»: S.weak['n:w'] = { c: stumbles not yet repaired, d: last stumble } */
function weakNote(k, bad) {
  S.weak = S.weak || {};
  const w = S.weak[k];
  if (bad) S.weak[k] = { c: Math.min(9, ((w && w.c) || 0) + 1), d: dayKey() };
  else if (w) { if (w.c <= 1) delete S.weak[k]; else S.weak[k] = { ...w, c: w.c - 1 }; }
}
function weakList(lim = 12) {
  return Object.entries(S.weak || {}).map(([k, v]) => { const [n, w] = k.split(':').map(Number); return { k, n, w, c: v.c, d: v.d || '' }; })
    .filter(x => x.n >= 1 && QD.verses[x.n] && QD.verses[x.n][x.w])
    .sort((a, b) => b.c - a.c || (b.d > a.d ? 1 : b.d < a.d ? -1 : 0)).slice(0, lim);
}
/* the hint: the first letter (past a silent «ٱل», which tells nothing) */
function lrHintText(w) {
  const cl = [];
  for (const ch of w) { if (LR_MARK.test(ch) && cl.length) cl[cl.length - 1] += ch; else cl.push(ch); }
  let k = 1;
  if (cl[0] && cl[0][0] === 'ٱ') k = 3;
  else if (cl.length > 3 && /^[وف]/.test(cl[0]) && cl[1][0] === 'ٱ') k = 4;
  return cl.slice(0, Math.min(k, cl.length)).join('') + 'ـ';
}

function openLive(o = {}) {
  const L = Gx.open('lrv', 'التسميع الحيّ', 'mic'); Live.L = L;
  S.live = S.live || {};
  L.onClose = () => { lrStop(); Live.L = null; Live.s = null; if (GM.L && GM.draw) GM.draw(gmNewSteps()); };
  if (o.vs) lrStart(o.vs, o.mode || S.live.mode || 'page');
  else lrSetup(o.mode);
}
function lrSetup(forceMode) {
  const L = Live.L; if (!L) return;
  lrStop(); Live.s = null;
  const kind = Listen.kind(), mem = memorizedVerses();
  const R = [
    ...(mem.length ? [{ k: 'mem', t: 'ما حفظته', s: cnt(mem.length, ['آية واحدة', 'آيتان', 'آيات', 'آية']), vs: mem }] : []),
    ...STATIONS.slice(0, 4).map(s => ({ k: 'st' + s.id, t: s.name, s: `الآيات ${ARN(s.verses[0])}–${ARN(s.verses[s.verses.length - 1])}`, vs: s.verses })),
    { k: 'all', t: 'السورة كاملة', s: '١١ آية', vs: verseRange(1, NV) },
  ];
  let sel = R.find(r => r.k === S.live.r) || R[0], mode = forceMode || S.live.mode || 'page';
  const weak = weakList(8);
  L.stat.textContent = S.live.best != null ? `أفضل نتيجة ${ARN(S.live.best)}٪` : '';
  html(L.body, `<div class="lrwrap">
    <div class="lrintro"><span class="lrmic">${ic('mic')}</span><p>${kind ? 'الآيات مخفية. سمّع من حفظك بصوتٍ واضح، فتظهر كل كلمةٍ ذهبيةً لحظة تقولها صحيحة. وإن توقفتَ ظهر لك أول حرفها، وإن أخطأتَ اهتزّت الكلمة بلطف.' : 'الآيات مخفية. سمّعها من حفظك بصوتٍ مسموع، ثم اكشفها وحدّد أين تعثّرت، فتُحفظ مواضع تعثّرك في «كلماتك الصعبة».'}</p></div>
    ${kind ? '' : `<div class="panel lrnote"><b>${ic('info')} التسميع هنا ذاتي</b><p class="muted">${IN_CLAUDE ? 'هذه النسخة داخل Claude لا تصل إلى الميكروفون.' : 'متصفحك لا يدعم التعرّف على الكلام.'} في تطبيق أندرويد${IN_CLAUDE ? ' وفي متصفح Chrome' : ''} يسمعك التطبيق نفسه ويكشف الكلمات وحده.</p></div>`}
    <h4 class="lrh">ماذا تسمّع؟</h4>
    <div class="chips lrchips" id="lrR">${R.map(r => `<button class="chip${r === sel ? ' on' : ''}" data-r="${r.k}"><b>${r.t}</b><small>${r.s}</small></button>`).join('')}</div>
    <h4 class="lrh">أين تراها؟</h4>
    <div class="seg" id="lrM" role="tablist"><button role="tab" data-m="page" aria-selected="${mode === 'page'}">على صفحة المصحف</button><button role="tab" data-m="verse" aria-selected="${mode === 'verse'}">آياتٌ كبيرة</button></div>
    ${kind ? `<label class="toggle"><span>${ic('bulb')} تلميحٌ تلقائي إذا توقفت</span><input type="checkbox" id="lrA" ${S.live.auto === false ? '' : 'checked'}></label>` : ''}
    <button class="btn btn-sun btn-wide" id="lrGo">${ic('mic')} ${kind ? 'ابدأ التسميع' : 'ابدأ التسميع الذاتي'}</button>
    ${weak.length ? `<div class="card lrwk"><h4>${ic('target')} كلماتك الصعبة</h4><p class="dim">مواضع تعثّرت فيها من قبل. اضغط الكلمة لتسمعها، ثم سمّع آياتها.</p>
      <div class="lrweak">${weak.map(x => `<button data-wk="${x.k}">${esc(QD.verses[x.n][x.w])}</button>`).join('')}</div>
      <button class="btn btn-line btn-wide" data-lw>${ic('mic')} سمّع آياتها الآن</button></div>` : ''}
    <p class="dim lrsmall">${kind === 'native' ? 'يستعمل خدمة التعرّف على الكلام في جوالك، وقد تحتاج اتصالًا بالإنترنت. التطبيق لا يحفظ صوتك. ' : kind === 'web' ? 'يستعمل خدمة التعرّف على الكلام في متصفحك، وتحتاج اتصالًا بالإنترنت. التطبيق لا يحفظ صوتك. ' : ''}${kind ? 'التعرّف على التلاوة المجوّدة ليس دقيقًا دائمًا، فإن فاتته كلمةٌ قلتها صحيحة فلا تحزن.' : ''}</p>
  </div>`);
  L.body.onclick = e => {
    const r = e.target.closest('[data-r]'); if (r) { sel = R.find(x => x.k === r.dataset.r); $$('#lrR .chip', L.body).forEach(x => x.classList.toggle('on', x === r)); return; }
    const m = e.target.closest('[data-m]'); if (m) { mode = m.dataset.m; $$('#lrM button', L.body).forEach(x => x.setAttribute('aria-selected', x === m)); return; }
    const wk = e.target.closest('[data-wk]'); if (wk) { const [n, w] = wk.dataset.wk.split(':').map(Number); Sfx.init(); playWord(n, w); return; }
    const begin = vs => { S.live.r = sel.k; S.live.mode = mode; const a = $('#lrA', L.body); if (a) S.live.auto = a.checked; save(); lrStart(vs, mode); };
    if (e.target.closest('[data-lw]')) { begin([...new Set(weak.map(x => x.n))]); return; }
    if (e.target.closest('#lrGo')) begin(sel.vs);
  };
}
function lrStart(vs, mode) {
  const L = Live.L; if (!L) return;
  lrStop(); stopAll();
  const self = !Listen.kind();
  const s = Live.s = { vs: [...new Set(vs)].sort((a, b) => a - b), mode, self, auto: S.live.auto !== false, p: 0, last: performance.now() + 2000, wrong: 0, done: false, cur: 0, phase: 'hidden', hints: 0, prev: {} };
  s.exp = s.vs.flatMap(n => QD.verses[n].map((w, i) => ({ n, i, k: normAr(w), word: w }))).filter(x => x.k);
  s.st = s.exp.map(() => ''); s.help = s.exp.map(() => 0);
  const inR = new Set(s.vs);
  L.stat.textContent = '';
  html(L.body, `<div class="lrwrap">
    <div class="lrbar"><span class="lsdot${self ? ' off' : ''}" id="lrDot"></span><span id="lrH" class="dim">${self ? `سمّع الآية ${ARN(s.vs[0])} بصوتك، ثم اكشفها` : `أستمع… ابدأ من أول الآية ${ARN(s.vs[0])}`}</span><b id="lrP">${ic('crown')} ٠ / ${ARN(s.exp.length)}</b></div>
    ${mode === 'page' ? `<div class="gzoom lrzoom">${gmPageHTML()}</div>`
      : `<div class="panel lrbig"><div class="qt night lrtxt">${s.vs.map(n => QD.verses[n].map((w, i) => `<span class="lw2" data-v="${n}" data-w="${i}">${esc(w)}</span>`).join(' ') + ' ' + marker(n)).join(' ')}</div></div>`}
    <div class="gdock lrdock" id="lrDock"></div>
    <div id="lrRes"></div>
  </div>`);
  const root = s.root = mode === 'page' ? $('#gPage', L.body) : $('.lrtxt', L.body);
  const sel = mode === 'page' ? '.gw' : '.lw2';
  s.els = s.exp.map(x => $(`${sel}[data-v="${x.n}"][data-w="${x.i}"]`, root));
  if (mode === 'page') {
    $$('.gw', root).forEach(el => { if (!inR.has(+el.dataset.v)) el.classList.add('lr-out'); });
    $$('.gam', root).forEach(el => { if (!inR.has(+el.dataset.n)) el.classList.add('lr-out'); });
    $$('.ow, .oam', root).forEach(el => el.classList.add('lr-out'));
    requestAnimationFrame(() => gmFit(root));
    s.rs = () => gmFit(root); window.addEventListener('resize', s.rs);
  }
  s.els.forEach(el => el && el.classList.add('lr-hid'));
  L.body.onclick = e => {
    const x = e.target.closest('[data-x]')?.dataset.x;
    if (x === 'again') return lrStart(s.vs, s.mode);
    if (x === 'weak') return lrStart(s.exp.filter((_, j) => ['hint', 'shown', 'skip'].includes(s.st[j])).map(y => y.n), s.mode);
    if (x === 'setup') return lrSetup();
    if (x === 'gold') { if (GM.L) Gx.close(L); else openGoldMushaf(); return; }
    const wk = e.target.closest('[data-wk]'); if (wk) { const [n, w] = wk.dataset.wk.split(':').map(Number); Sfx.init(); playWord(n, w); return; }
    const w = e.target.closest(mode === 'page' ? '.gw' : '.lw2'); if (!w) return;
    const n = +w.dataset.v, i = +w.dataset.w;
    if (s.done) { Sfx.init(); playWord(n, i); return; }
    if (s.self && s.phase === 'mark' && n === s.vs[s.cur]) lrSelfToggle(s.exp.findIndex(y => y.n === n && y.i === i));
  };
  lrMarkNext(); lrDock();
  if (self) lrSelfCur(); else lrListen();
}
function lrStop() {
  const s = Live.s; if (!s) return;
  const was = !s.done; s.done = true; clearInterval(s.iv);
  if (s.rs) window.removeEventListener('resize', s.rs);
  if (was && !s.self) Listen.stop();
}
function lrListen() {
  const s = Live.s;
  Listen.start((ev, d) => {
    if (Live.s !== s || s.done) return;
    if (ev === 'text' && !s.self) lrHeard();
    if (ev === 'error') lrToSelf(d === 'denied' ? 'لم يُسمح بالوصول إلى الميكروفون، فأكمل التسميع ذاتيًا.' : 'تعذّر الاستماع على هذا الجهاز، فأكمل التسميع ذاتيًا.');
  });
  s.iv = setInterval(lrTick, 300);
}
function lrHeard() {
  const s = Live.s, toks = Listen.text().split(/\s+/).filter(Boolean), heard = toks.map(normAr).filter(Boolean);
  const { st, lastH } = lrAlign(s.exp.map(x => x.k), heard);
  let moved = false;
  st.forEach((a, j) => {
    const cur = s.st[j], h = s.help[j];
    if (a === 1 && (cur === '' || cur === 'skip')) { lrSet(j, h === 0 ? 'ok' : h === 1 ? 'hint' : 'shown'); moved = true; }
    else if (a === 2 && cur === '') { lrSet(j, h >= 2 ? 'shown' : 'skip'); moved = true; }
  });
  /* heard words after the last match that were not the next word (the newest one may still change) */
  lrMarkNext();
  const extra = Math.max(0, heard.length - 2 - lastH);
  if (moved) s.last = performance.now();
  if (extra > (moved ? 0 : s.wrong)) lrShake();
  s.wrong = extra;
  const hb = $('#lrH', Live.L.body); if (hb) { hb.textContent = toks.slice(-5).join(' ') || 'أستمع…'; hb.classList.remove('dim'); }
  if (s.st.every(Boolean)) setTimeout(() => { if (Live.s === s && !s.done) lrFinish(); }, 700);
}
function lrSet(j, v) {
  const s = Live.s, el = s.els[j]; s.st[j] = v;
  if (el) {
    el.classList.remove('lr-hid', 'lr-next', 'lr-peek', 'lr-ok', 'lr-hint', 'lr-shown', 'lr-skip', 'lr-shake', 'lr-cur');
    el.removeAttribute('data-h');
    el.classList.add('lr-' + v);
  }
  const p = $('#lrP', Live.L.body); if (p) p.innerHTML = `${ic('crown')} ${ARN(s.st.filter(x => x === 'ok').length)} / ${ARN(s.exp.length)}`;
}
function lrMarkNext() {
  const s = Live.s; let p = 0;
  if (s.self) { p = s.st.findIndex(x => !x); if (p < 0) p = s.st.length; }
  else for (let j = s.st.length - 1; j >= 0; j--) if (s.st[j]) { p = j + 1; break; }
  s.p = p;
  s.els.forEach((el, j) => el && el.classList.toggle('lr-next', !s.self && j === p && !s.st[j]));
  const el = s.els[p];
  if (el && s.exp[p].n !== s.curN) { s.curN = s.exp[p].n; el.scrollIntoView({ block: 'center', inline: 'center', behavior: reduceMotion() ? 'auto' : 'smooth' }); }
}
function lrTick() {
  const s = Live.s; if (!s || s.done || s.self || !s.auto) return;
  const j = s.p; if (j >= s.exp.length || s.st[j]) return;
  if (performance.now() - s.last > LR_HINT_MS && s.help[j] < 2) lrHint(j);
}
function lrHint(j = Live.s.p) {
  const s = Live.s; if (j >= s.exp.length || s.st[j] || s.help[j] >= 2) return;
  s.help[j]++; s.hints++; s.last = performance.now();
  const el = s.els[j]; if (!el) return;
  if (s.help[j] === 1) el.setAttribute('data-h', lrHintText(s.exp[j].word));
  else { el.removeAttribute('data-h'); el.classList.remove('lr-hid', 'lr-next'); el.classList.add('lr-peek'); }
}
function lrShake() {
  const s = Live.s, el = s.els[s.p]; if (!el || s.st[s.p]) return;
  el.classList.remove('lr-shake'); void el.offsetWidth; el.classList.add('lr-shake');
}
function lrDock() {
  const s = Live.s, d = $('#lrDock', Live.L.body); if (!d) return;
  if (s.done) { d.innerHTML = ''; return; }
  const zoom = s.mode === 'page' ? `<button class="iconbtn" data-a="zoom" aria-label="تكبير الصفحة">${ic('expand')}</button>` : '';
  if (!s.self) d.innerHTML = `<button class="btn btn-line" data-a="hint">${ic('bulb')} تلميح</button><button class="btn btn-sun" data-a="done">${ic('check')} انتهيت</button>${zoom}`;
  else {
    const n = s.vs[s.cur], last = s.cur === s.vs.length - 1;
    d.innerHTML = s.phase === 'hidden'
      ? `<button class="btn btn-line" data-a="hint">${ic('bulb')} تلميح</button><button class="btn btn-sun" data-a="reveal">${ic('eye')} اكشف الآية ${ARN(n)}</button>${zoom}`
      : `<p class="lrask">اضغط كل كلمةٍ نسيتها أو أخطأت فيها، ثم تابع.</p><button class="btn btn-sun" data-a="next">${last ? `${ic('check')} أنهيت` : `الآية التالية ${ic('chev')}`}</button>${zoom}`;
  }
  d.onclick = e => {
    const a = e.target.closest('[data-a]')?.dataset.a; if (!a) return;
    if (a === 'hint') { if (s.self) { const j = lrSelfIdx().find(j => !s.st[j] && s.help[j] < 2); if (j != null) lrHint(j); } else lrHint(); }
    if (a === 'done') lrFinish();
    if (a === 'reveal') lrSelfReveal();
    if (a === 'next') lrSelfNext();
    if (a === 'zoom') { const z = $('.lrzoom', Live.L.body); z.classList.toggle('big'); gmFit(s.root); const el = s.els[Math.min(s.p, s.els.length - 1)]; if (el) el.scrollIntoView({ block: 'center', inline: 'center' }); }
  };
}
/* ---------- self mode: no microphone here, so you recite, reveal, and mark your own stumbles ---------- */
const lrSelfIdx = () => { const s = Live.s, n = s.vs[s.cur]; return s.exp.map((x, j) => x.n === n ? j : -1).filter(j => j >= 0); };
function lrSelfCur() {
  const s = Live.s;
  s.els.forEach(el => el && el.classList.remove('lr-cur'));
  const js = lrSelfIdx(); js.forEach(j => { if (!s.st[j]) s.els[j]?.classList.add('lr-cur'); });
  const el = s.els[js[0]]; if (el) el.scrollIntoView({ block: 'center', inline: 'center', behavior: reduceMotion() ? 'auto' : 'smooth' });
  const hb = $('#lrH', Live.L.body); if (hb) hb.textContent = `سمّع الآية ${ARN(s.vs[s.cur])} بصوتك، ثم اكشفها`;
}
function lrSelfReveal() {
  const s = Live.s;
  for (const j of lrSelfIdx()) if (!s.st[j]) lrSet(j, s.help[j] === 0 ? 'ok' : s.help[j] === 1 ? 'hint' : 'shown');
  s.phase = 'mark'; Sfx.init(); Sfx.tap();
  const hb = $('#lrH', Live.L.body); if (hb) hb.textContent = 'اضغط الكلمات التي تعثّرت فيها';
  lrDock();
}
function lrSelfToggle(j) {
  const s = Live.s; if (j < 0) return;
  if (s.st[j] === 'skip') lrSet(j, s.prev[j] || 'ok');
  else { s.prev[j] = s.st[j]; lrSet(j, 'skip'); buzz(12); }
}
function lrSelfNext() {
  const s = Live.s;
  if (s.cur >= s.vs.length - 1) return lrFinish();
  s.cur++; s.phase = 'hidden'; lrSelfCur(); lrDock();
}
/* the microphone failed mid-way: carry on by yourself from the verse you reached */
function lrToSelf(msg) {
  const s = Live.s; if (!s || s.done || s.self) return;
  Listen.stop(); clearInterval(s.iv); s.self = true;
  const p = s.st.findIndex(x => !x); if (p < 0) return lrFinish();
  s.cur = s.vs.indexOf(s.exp[p].n); s.phase = 'hidden';
  s.els.forEach(el => el && el.classList.remove('lr-next'));
  $('#lrDot', Live.L.body)?.classList.add('off');
  toast(msg, 'mic');
  lrSelfCur(); lrDock();
}
function lrFinish() {
  const s = Live.s; if (!s || s.done) return;
  lrStop();
  s.st.forEach((v, j) => { if (!v) lrSet(j, s.help[j] >= 2 ? 'shown' : s.help[j] ? 'skip' : 'rest'); });
  s.els.forEach(el => el && el.classList.remove('lr-next', 'lr-cur'));
  const reached = s.st.filter(v => v !== 'rest').length, okN = s.st.filter(v => v === 'ok').length;
  const pct = reached ? Math.round(100 * okN / reached) : 0, today = dayKey();
  /* stumbles go to «كلماتك الصعبة»; a word said cleanly heals one old stumble */
  const weak = [];
  s.exp.forEach((x, j) => { const v = s.st[j], k = x.n + ':' + x.i; if (v === 'rest') return; if (v === 'ok') weakNote(k, false); else { weakNote(k, true); if (!weak.includes(k)) weak.push(k); } });
  /* a verse recited cleanly is a recall: it adds gold, once a day */
  const ups = [];
  S.gold = S.gold || {};
  for (const n of s.vs) {
    const js = s.exp.map((x, j) => x.n === n ? j : -1).filter(j => j >= 0);
    if (!js.length || !js.every(j => s.st[j] === 'ok')) continue;
    const g = S.gold[n] || { c: 0, d: null };
    if (g.d === today || (g.c || 0) >= 4) continue;
    S.gold[n] = { c: (g.c || 0) + 1, d: today }; ups.push(n);
  }
  if (ups.length) award('goldfirst');
  S.live.n = (S.live.n || 0) + 1; S.live.last = today;
  sqNote([...new Set(s.exp.filter((x, j) => s.st[j] === 'ok').map(x => x.n))]);
  if (!s.self && reached >= 8) S.live.best = Math.max(S.live.best || 0, pct);
  if (!s.self && reached >= 8 && pct >= 80) award('listen');
  if (!s.self && s.vs.length === NV && reached === s.exp.length && !s.hints && pct >= 95) award('livefull');
  addXP(5 + okN); save();
  if (pct >= 80 && reached >= 4) { Sfx.init(); Sfx.win(); buzz([20, 40, 20]); }
  const L = Live.L;
  $('#lrDot', L.body)?.classList.add('off');
  const hb = $('#lrH', L.body); if (hb) { hb.textContent = 'انتهى التسميع'; hb.classList.add('dim'); }
  lrDock();
  const verdict = !reached ? 'لم يبدأ التسميع بعد' : pct >= 95 ? 'ما شاء الله! تلاوةٌ من الصدر' : pct >= 80 ? 'أحسنت! والقليل الباقي بالمراجعة' : pct >= 50 ? 'بدايةٌ طيبة. أعد ما تعثّرت فيه' : 'لا بأس. اسمع الآيات مرة، ثم سمّع من جديد';
  html($('#lrRes', L.body), `<div class="gpanel lrres">
    <div class="lrscore"><b>${ARN(pct)}٪</b><span>${s.self ? 'تسميعٌ ذاتي · ' : ''}كلماتٌ من حفظك: ${ARN(okN)} من ${ARN(reached)}</span><small>${verdict}</small></div>
    <div class="lrkey">${['ok', 'hint', 'shown', 'skip'].map(k => `<span class="${k}"><i></i>${LR_ST[k]}</span>`).join('')}</div>
    ${ups.length ? `<p class="lrgold">${ic('crown')} ازداد ذهبُ ${ups.length === 1 ? 'الآية' : 'الآيات'} ${ups.map(ARN).join('، ')} في مصحفك المذهّب</p>` : ''}
    ${weak.length ? `<p><b>مواضع تعثّرك</b> حُفظت في «كلماتك الصعبة» لنثبّتها معًا:</p><div class="lrweak">${weak.map(k => { const [n, w] = k.split(':').map(Number); return `<button data-wk="${k}">${esc(QD.verses[n][w])}</button>`; }).join('')}</div>`
      : reached ? `<p>${ic('check')} لا تعثّر واحد!</p>` : ''}
    <p class="dim lrsmall">اضغط أي كلمة لتسمعها بصوت القارئ.</p>
    <div class="row lrbtns">${weak.length ? `<button class="btn btn-sun" data-x="weak">${ic('mic')} سمّع ما تعثّرت فيه</button>` : ''}
      <button class="btn ${weak.length ? 'btn-line' : 'btn-sun'}" data-x="again">${ic('repeat')} مرة أخرى</button>
      <button class="btn btn-line" data-x="setup">آياتٌ أخرى</button>
      ${ups.length ? `<button class="btn btn-line" data-x="gold">${ic('crown')} مصحفك المذهّب</button>` : ''}</div>
  </div>`);
  $('#lrRes', L.body).scrollIntoView({ block: 'nearest', behavior: reduceMotion() ? 'auto' : 'smooth' });
}

/* =====================================================================================
   104 · مرآة التلاوة
   ===================================================================================== */
const MR_RULE = {
  m6: { c: 6, sl: '٦', lab: 'ست حركات', name: 'مدّ لازم', col: '#ff5f8f', madd: 1 },
  m45: { c: 4, sl: '٤–٥', lab: 'أربع حركات أو خمس', name: 'مدّ واجب متصل', col: '#ff6b5d', madd: 1 },
  mj: { c: 4, sl: '٢–٦', lab: 'حركتان أو أربع أو ست', name: 'مدّ عارض للسكون', col: '#ffad52', madd: 1 },
  m2: { c: 2, sl: '٢', lab: 'حركتان', name: 'مدّ حركتان', col: '#f2d27c', madd: 1 },
  gh: { c: 2, sl: 'غ', lab: 'غنّة بمقدار حركتين', name: 'غنّة', col: '#52e08c', madd: 0 },
  ikh: { c: 2, sl: 'غ', lab: 'غنّة بمقدار حركتين', name: 'إخفاء بغنّة', col: '#52e08c', madd: 0 },
};
/* each verse here ends with a stop: «فترضى» then takes two counts (its separated madd is only when joined to «ألم») */
const mrRule = (n, cls) => n === 5 && cls === 'mj' ? { ...MR_RULE.m2, name: 'مدّ حركتان عند الوقف' } : MR_RULE[cls];
const MRL = { lbl: 36, rh: 118, bar: 24, gap: 30, uh: 96, pad: 14 };
const Mirror = { L: null, n: 7, rid: null, envs: new Map(), d: null, u: null, rec: null, live: null, hap: true, slow: false, band: -1, playing: false, tok: 0 };
const mrSec = ms => ARN((ms / 1000).toFixed(1)).replace('.', '٫') + ' ث';
const hexA = (h, a) => `rgba(${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)},${a})`;

/* decode audio → loudness every 10 ms */
async function mrDecode(src) {
  const buf = src instanceof ArrayBuffer ? src : await (await fetch(src)).arrayBuffer();
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const ctx = new OAC(1, 1, 22050);
  const ab = await new Promise((res, rej) => { const p = ctx.decodeAudioData(buf, res, rej); if (p && p.then) p.then(res, rej); });
  const sr = ab.sampleRate, N = Math.floor(ab.length / sr * 100), ch = [];
  for (let c = 0; c < ab.numberOfChannels; c++) ch.push(ab.getChannelData(c));
  const env = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const a = Math.floor(i * sr / 100), b = Math.min(ab.length, Math.floor((i + 1) * sr / 100)); let s = 0;
    for (let j = a; j < b; j++) { let v = 0; for (const x of ch) v += x[j]; v /= ch.length; s += v * v; }
    env[i] = Math.sqrt(s / Math.max(1, b - a));
  }
  return env;
}
/* where the voice is, its pauses, and its sustained stretches (a run that never dips below 45% of its own peak) */
function mrAnalyze(env, i0 = 0, i1 = env.length) {
  const raw = env.subarray(i0, i1), n = raw.length, s = new Float32Array(n);
  for (let i = 0; i < n; i++) s[i] = (raw[Math.max(0, i - 1)] + raw[i] + raw[Math.min(n - 1, i + 1)]) / 3;
  const srt = Float32Array.from(s).sort(), floor = srt[Math.floor(n * .1)] || 0, mx = srt[n - 1] || 1e-6;
  const thr = Math.max(floor * 2.5, mx * .08, 2e-4);
  const out = { ok: false, s, i0, thr, mx };
  if (n < 5) return out;
  const on = i => s[i] > thr && s[i + 1] > thr && s[i + 2] > thr;
  let a = -1, b = -1;
  for (let i = 0; i < n - 2; i++) if (on(i)) { a = i; break; }
  for (let i = n - 3; i >= 0; i--) if (on(i)) { b = i + 2; break; }
  if (a < 0 || b <= a) return out;
  let pauses = 0, gap = 0;
  for (let i = a; i <= b; i++) { if (s[i] < thr) gap++; else { if (gap >= 30) pauses++; gap = 0; } }
  const runs = []; let cur = null;
  for (let i = a; i <= b; i++) {
    const v = s[i];
    if (!cur) { if (v > thr) cur = { a: i, b: i, pk: v }; }
    else if (v < thr || v < cur.pk * .45) { runs.push(cur); cur = null; }
    else { cur.b = i; if (v > cur.pk) cur.pk = v; }
  }
  if (cur) runs.push(cur);
  const lg = runs.reduce((m, r) => r.b - r.a > m.b - m.a ? r : m, { a: 0, b: 0 });
  return { ...out, ok: true, a: (a + i0) * 10, b: (b + i0) * 10, span: (b - a) * 10, pauses, longest: (lg.b - lg.a) * 10, runs: runs.map(r => ({ a: (r.a + i0) * 10, b: (r.b + i0) * 10 })) };
}
/* the madd and ghunnah of each word placed in time: letters share the voiced part of the word, a madd letter
   weighing its counts; a long madd snaps to the sustained stretch it falls in */
function mrBands(n, t, an) {
  const out = [], words = QD.verses[n], val = ms => an.s[Math.round(ms / 10) - an.i0] || 0, thr = an.thr;
  for (let w = 0; w < words.length; w++) {
    const all = QD.tj[n + ':' + w] || [], rules = all.filter(r => MR_RULE[r[2]]);
    if (!rules.length) continue;
    const a0 = t.b[w], b0 = w + 1 < t.b.length ? t.b[w + 1] : t.t1;
    let va = a0, vb = b0;
    while (va < b0 && val(va) <= thr) va += 10;
    while (vb > va && val(vb) <= thr) vb -= 10;
    if (vb - va < 60) { va = a0; vb = b0; }
    /* did the reciter stop after this word? then the tanween rules that join it to the next word do not happen */
    let gap = 0; for (let ms = vb + 10; ms < t.t1 + 200 && val(ms) <= thr; ms += 10) gap += 10;
    const stop = w === words.length - 1 || gap >= 250;
    const word = words[w], wt = [...word].map(c => LR_MARK.test(c) ? 0 : 1);
    for (const [ca, cb, cls] of all) if (cls === 'sil') for (let i = ca; i < cb; i++) wt[i] = 0;
    for (const [ca, cb, cls] of rules) { for (let i = ca; i < cb; i++) if (wt[i] > 0) { wt[i] = mrRule(n, cls).madd ? mrRule(n, cls).c : 2; break; } }
    const cum = [0]; wt.forEach((x, i) => cum.push(cum[i] + x)); const tot = cum[cum.length - 1] || 1;
    for (const [ca, cb, cls] of rules) {
      if ((cls === 'ikh' || cls === 'idg') && stop) continue;
      const R = mrRule(n, cls);
      let a = va + (vb - va) * cum[ca] / tot, b = va + (vb - va) * cum[Math.min(cb, wt.length)] / tot;
      if (R.madd && R.c >= 4 && an.runs) {
        let best = null, bo = 0;
        for (const r of an.runs) { const o = Math.min(r.b, b + 150, vb) - Math.max(r.a, a - 150, va); if (o > bo) { bo = o; best = r; } }
        if (best) { a = Math.max(best.a, va); b = Math.min(best.b, vb); }
      }
      if (b - a >= 30) out.push({ a, b, w, cls, ...R });
    }
  }
  return out.sort((x, y) => x.a - y.a);
}
async function mrLoad(n, rid) {
  const key = rid + '/' + n;
  let env = Mirror.envs.get(key);
  if (!env) { env = await mrDecode(AC.blobs.get(aurl(rid, n)) || aurl(rid, n)); Mirror.envs.set(key, env); }
  const t = tim(rid, n), i0 = Math.max(0, Math.floor((t.t0 - 120) / 10)), i1 = Math.max(i0 + 5, Math.min(env.length, Math.ceil(Math.min(t.d, t.t1 + 220) / 10)));
  const an = mrAnalyze(env, i0, i1);
  return { n, rid, t, an, words: QD.verses[n].map((w, i) => ({ i, text: w, a: t.b[i], b: i + 1 < t.b.length ? t.b[i + 1] : t.t1 })), bands: an.ok ? mrBands(n, t, an) : [] };
}
/* haptics: one pulse per count, spread over the madd as this reciter draws it */
function mrPattern(b, rate = 1) {
  const dur = Math.max(b.c * 110, (b.b - b.a) / rate), per = dur / b.c;
  const on = Math.round(clamp(per * .5, 40, 150)), off = Math.max(30, Math.round(per - on)), p = [];
  for (let i = 0; i < b.c; i++) { p.push(on); if (i < b.c - 1) p.push(off); }
  return p;
}

function openMirror(n) {
  const L = Gx.open('mrv', 'مرآة التلاوة', 'wave'); Mirror.L = L;
  S.mirror = S.mirror || {};
  Mirror.rid = QD.timing[Mirror.rid] ? Mirror.rid : Player.rid;
  Mirror.n = n != null ? n : (S.mirror.last != null ? S.mirror.last : 7);
  Mirror.hap = S.mirror.hap !== false; Mirror.u = null; Mirror.d = null;
  const canVib = typeof navigator.vibrate === 'function', canRec = canRecord() && !IN_CLAUDE;
  L.stat.textContent = S.mirror.rec && S.mirror.rec.length ? `${ARN(S.mirror.rec.length)} / ${ARN(NV)}` : '';
  html(L.body, `<div class="mrwrap">
    <p class="muted mrintro">شريطٌ من نورٍ يرسمه صوت القارئ: يطول مع المدّ، ويتوهّج أخضر مع الغنّة، ويسكن عند الوقف. ومع كل مدٍّ تضيء نقاطٌ بعدد حركاته${canVib ? '، ويهتز جوالك بعددها' : ''}.</p>
    <div class="chips mrvs" id="mrVs">${[0, ...verseRange(1, NV)].map(v => `<button class="chip${v === Mirror.n ? ' on' : ''}" data-mv="${v}">${v ? ARN(v) : 'البسملة'}</button>`).join('')}</div>
    <div class="mrcard">
      <div class="mrhead"><b id="mrT"></b><label class="mrsel">${ic('headphones')}<select id="mrRid" aria-label="القارئ">${RECITERS.filter(r => QD.timing[r.id]).map(r => `<option value="${r.id}"${r.id === Mirror.rid ? ' selected' : ''}>${esc(RNAME(r.id))}</option>`).join('')}</select></label></div>
      <div class="qt night mrtext" id="mrTxt"></div>
      <canvas class="mrcv" id="mrCv" role="img" aria-label="شريط صوت القارئ"></canvas>
      <div class="mrcount" id="mrCount" aria-live="polite"></div>
      <div class="mrdock">
        <button class="btn btn-sun" id="mrPlay">${ic('play')} اسمع وشاهد</button>
        <button class="chip${Mirror.slow ? ' on' : ''}" id="mrSlow" aria-pressed="${Mirror.slow}">${ic('speed')} أبطأ</button>
        ${canVib ? `<button class="chip${Mirror.hap ? ' on' : ''}" id="mrHap" aria-pressed="${Mirror.hap}">${ic('hand')} اهتزاز المدّ</button>` : ''}
      </div>
      <div class="mrlegend">${[['m6', 'مدّ ٦'], ['m45', 'مدّ ٤–٥'], ['mj', 'مدّ عارض'], ['m2', 'مدّ حركتان'], ['gh', 'غنّة']].map(([k, t]) => `<span><i style="background:${MR_RULE[k].col}"></i>${t}</span>`).join('')}</div>
    </div>
    <div class="mrcard" id="mrMe">
      <h3 class="mrh">${ic('voice')} صوتك في المرآة</h3>
      ${canRec ? `<p class="dim">سجّل الآية نفسها من حفظك، فيظهر شريطك تحت شريط القارئ: ترى إيقاعك، وأين وقفت، وكم مددت صوتك.</p>
        <button class="recbtn mrrec" id="mrRec" aria-label="ابدأ التسجيل">${ic('voice')}<span>سجّل</span></button>
        <p class="warn mrmsg" id="mrMsg" hidden></p><div id="mrRes"></div>`
      : `<p class="muted">${IN_CLAUDE ? 'هذه النسخة داخل Claude لا تصل إلى الميكروفون. سجّل صوتك في المرآة من تطبيق أندرويد أو من المتصفح.' : 'متصفحك لا يدعم التسجيل. جرّب Chrome أو تطبيق أندرويد.'}</p>`}
    </div>
    <small class="dim mrsrc">مواضع المدّ والغنّة على الشريط تقريبية داخل الكلمة، والمقارنة بصوتك تقيس الإيقاع وامتداد الصوت فقط: لا تحكم على صحة الحروف والتجويد كما يحكم معلّمٌ حقيقي. تسجيلك يبقى على جهازك.</small>
  </div>`);
  /* the recitation drives the ribbon */
  Mirror.onT = t => {
    if (!Mirror.L || !Mirror.d || !Mirror.playing || !Player.cur || Player.cur.rid !== Mirror.rid || t.n !== Mirror.n) return;
    mrFrame(t.ms, 'r');
    if (t.w !== Mirror.hw) { Mirror.hw = t.w; $$('#mrTxt .w', Mirror.L.body).forEach((x, i) => x.classList.toggle('on', i === t.w)); }
    const bands = Mirror.d.bands, bi = bands.findIndex(b => t.ms >= b.a && t.ms <= b.b);
    if (bi !== Mirror.band) {
      Mirror.band = bi;
      if (bi >= 0) { const b = bands[bi]; mrCountShow(b); if (b.madd && Mirror.hap && typeof navigator.vibrate === 'function') { try { navigator.vibrate(mrPattern(b, A.playbackRate || 1)); } catch (e) { } } }
      else mrCountIdle();
    }
    if (bi >= 0) mrCountTick(bands[bi], t.ms);
  };
  Mirror.onP = ev => {
    if (ev !== 'end' || !Mirror.playing) return;
    Mirror.playing = false; Mirror.band = -1; Mirror.hw = null;
    if (Mirror.keepRate != null) { Player.rate = Mirror.keepRate; Mirror.keepRate = null; }
    if (!Mirror.L) return;
    $$('#mrTxt .w', Mirror.L.body).forEach(x => x.classList.remove('on'));
    const b = $('#mrPlay', Mirror.L.body); if (b) b.innerHTML = `${ic('play')} اسمع وشاهد`;
    mrFrame(); mrCountIdle();
  };
  Ticks.add(Mirror.onT); Player.subs.add(Mirror.onP);
  Mirror.rs = () => { clearTimeout(Mirror.rz); Mirror.rz = setTimeout(() => { if (Mirror.L && Mirror.d) mrLayout(); }, 120); };
  window.addEventListener('resize', Mirror.rs);
  L.onClose = () => {
    Ticks.delete(Mirror.onT); Player.subs.delete(Mirror.onP); window.removeEventListener('resize', Mirror.rs);
    if (Mirror.rec) { Mirror.rec.cancel = true; mrRecStop(); }
    mrStopMine(); if (Mirror.keepRate != null) { Player.rate = Mirror.keepRate; Mirror.keepRate = null; }
    if (Mirror.u && Mirror.u.url) URL.revokeObjectURL(Mirror.u.url);
    Mirror.playing = false; Mirror.L = null; Mirror.u = null; Mirror.d = null; Mirror.live = null;
  };
  L.body.onclick = e => {
    const v = e.target.closest('[data-mv]'); if (v) { if (Mirror.rec) { Mirror.rec.cancel = true; mrRecStop(); } mrShow(+v.dataset.mv); return; }
    const id = e.target.closest('button')?.id;
    if (id === 'mrPlay') { mrPlay(); return; }
    if (id === 'mrSlow') { Mirror.slow = !Mirror.slow; const b = $('#mrSlow', L.body); b.classList.toggle('on', Mirror.slow); b.setAttribute('aria-pressed', Mirror.slow); return; }
    if (id === 'mrHap') { Mirror.hap = !Mirror.hap; S.mirror.hap = Mirror.hap; save(); const b = $('#mrHap', L.body); b.classList.toggle('on', Mirror.hap); b.setAttribute('aria-pressed', Mirror.hap); if (Mirror.hap) try { navigator.vibrate([60, 60, 60]); } catch (er) { } return; }
    if (id === 'mrRec') { if (Mirror.rec) mrRecStop(); else mrRecStart(); return; }
    if (id === 'mrMine') { mrPlayMine(); return; }
    if (id === 'mrKeep') { mrKeep(); return; }
  };
  $('#mrRid', L.body).onchange = e => { if (Mirror.rec) { Mirror.rec.cancel = true; mrRecStop(); } Mirror.rid = e.target.value; mrShow(Mirror.n, true); };
  mrShow(Mirror.n);
}
async function mrShow(n, keepMine) {
  const L = Mirror.L; if (!L) return;
  stopAll(); mrStopMine();
  if (!keepMine && Mirror.u) { if (Mirror.u.url) URL.revokeObjectURL(Mirror.u.url); Mirror.u = null; }
  Mirror.n = n; Mirror.d = null; Mirror.band = -1; Mirror.hw = null;
  S.mirror.last = n; save();
  $$('#mrVs .chip', L.body).forEach(x => x.classList.toggle('on', +x.dataset.mv === n));
  $(`#mrVs [data-mv="${n}"]`, L.body)?.scrollIntoView({ block: 'nearest', inline: 'center' });
  $('#mrT', L.body).textContent = n ? `الآية ${ARN(n)}` : 'البسملة';
  html($('#mrTxt', L.body), QD.verses[n].map((w, i) => `<span class="w" data-w="${i}">${wordHTML(n, i)}</span>`).join(' ') + (n ? ' ' + marker(n) : ''));
  html($('#mrCount', L.body), '<span class="dim">لحظة…</span>');
  if (!keepMine) { const r = $('#mrRes', L.body); if (r) r.innerHTML = ''; }
  const my = ++Mirror.tok;
  try {
    await fontsReady();
    const d = await mrLoad(n, Mirror.rid);
    if (my !== Mirror.tok || !Mirror.L) return;
    Mirror.d = d; mrLayout(); mrCountIdle();
    if (keepMine && Mirror.u) mrResults();
  } catch (e) {
    console.error(e);
    if (my === Mirror.tok && Mirror.L) html($('#mrCount', L.body), '<span class="warn">تعذّر تحميل صوت هذه الآية هنا</span>');
  }
}
/* sizes, one time scale for both ribbons (each starts at its own first sound), and the two static layers */
function mrLayout() {
  const L = Mirror.L, d = Mirror.d; if (!L || !d) return;
  const cv = $('#mrCv', L.body), W = Math.max(240, cv.clientWidth || cv.parentElement.clientWidth);
  const dpr = Math.min(2.5, window.devicePixelRatio || 1), u = Mirror.u, rec = !!(u || Mirror.live);
  const H = MRL.lbl + MRL.rh + MRL.bar + (rec ? MRL.gap + MRL.uh : 0) + 4;
  cv.style.height = H + 'px'; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  Object.assign(Mirror, { W, H, dpr });
  const rSpan = d.an.ok ? d.an.span : d.t.t1 - d.t.t0, uSpan = u && u.an.ok ? u.an.span : 0;
  Mirror.k = (W - 2 * MRL.pad) / (Math.max(rSpan, uSpan, 1200) + 240);
  Mirror.r0 = (d.an.ok ? d.an.a : d.t.t0) - 120;
  Mirror.u0 = u && u.an.ok ? u.an.a - 120 : 0;
  Mirror.dim = mrPaint(.32); Mirror.bright = mrPaint(1);
  mrFrame();
}
const mrX = ms => Mirror.W - MRL.pad - (ms - Mirror.r0) * Mirror.k;
const mrXu = ms => Mirror.W - MRL.pad - (ms - Mirror.u0) * Mirror.k;
function mrRibbon(c, an, xOf, yc, hh, kind, alpha, bands) {
  /* loudness against the 97th percentile, slightly expanded: steady madd stands tall, consonants dip */
  const s = an.s, w = Math.max(1, Mirror.k * 10) + .7, srt = Float32Array.from(s).sort();
  const mx = Math.max(1e-6, srt[Math.min(srt.length - 1, Math.floor(srt.length * .97))] || 0);
  const grad = col => { const g = c.createLinearGradient(0, yc - hh, 0, yc + hh); g.addColorStop(0, hexA(col, 0)); g.addColorStop(.28, hexA(col, .78)); g.addColorStop(.5, '#fffaf0'); g.addColorStop(.72, hexA(col, .78)); g.addColorStop(1, hexA(col, 0)); return g; };
  const base = grad(kind === 'gold' ? '#ffc65a' : '#8ccfff'), gs = {};
  c.globalAlpha = .4 * alpha; c.fillStyle = kind === 'gold' ? '#ffd77a' : '#9fd2ff'; c.fillRect(MRL.pad, yc - .5, Mirror.W - 2 * MRL.pad, 1);
  for (let i = 0; i < s.length; i++) {
    const ms = (an.i0 + i) * 10, x = xOf(ms); if (x < MRL.pad - 2 || x > Mirror.W - MRL.pad + 2) continue;
    const h = Math.max(.5, Math.pow(Math.min(1, s[i] / mx), 1.15) * hh);
    const b = bands && bands.find(z => ms >= z.a && ms <= z.b);
    c.globalAlpha = alpha;
    if (b) { c.fillStyle = gs[b.col] || (gs[b.col] = grad(b.col)); if (!b.madd) { c.shadowColor = b.col; c.shadowBlur = 9; } }
    else c.fillStyle = base;
    c.fillRect(x - w, yc - h, w, 2 * h);
    c.shadowBlur = 0;
  }
  c.globalAlpha = 1;
}
function mrPaint(alpha) {
  const d = Mirror.d, W = Mirror.W, dpr = Mirror.dpr;
  const cv = document.createElement('canvas'); cv.width = Math.round(W * dpr); cv.height = Math.round(Mirror.H * dpr);
  const c = cv.getContext('2d'); c.scale(dpr, dpr); c.direction = 'rtl';
  const y0 = MRL.lbl, yc = y0 + MRL.rh / 2, hh = MRL.rh / 2 - 8;
  /* madd and ghunnah bands behind the ribbon, with their counts beneath */
  for (const b of d.bands) {
    const xa = mrX(b.a), xb = mrX(b.b);
    c.globalAlpha = .17 * (alpha < 1 ? .6 : 1); c.fillStyle = b.col;
    c.beginPath(); c.roundRect ? c.roundRect(xb, y0 + 2, xa - xb, MRL.rh - 4, 8) : c.rect(xb, y0 + 2, xa - xb, MRL.rh - 4); c.fill();
    c.globalAlpha = alpha < 1 ? .45 : .95; c.fillRect(xb, y0 + MRL.rh + 2, xa - xb, 4);
    c.font = '700 12px "Readex Pro", sans-serif'; c.textAlign = 'center'; c.fillText(b.sl, (xa + xb) / 2, y0 + MRL.rh + 19);
  }
  c.globalAlpha = 1;
  /* words: separators and names */
  d.words.forEach((wd, i) => {
    const xa = mrX(wd.a), xb = mrX(wd.b), room = xa - xb - 4;
    if (i) { c.strokeStyle = 'rgba(255,230,170,.18)'; c.setLineDash([3, 4]); c.beginPath(); c.moveTo(xa, 6); c.lineTo(xa, y0 + MRL.rh); c.stroke(); c.setLineDash([]); }
    let f = 20; c.font = `400 ${f}px "Scheherazade New", serif`;
    const tw = c.measureText(wd.text).width; if (tw > room && room > 0) { f = Math.max(10, f * room / tw); c.font = `400 ${f}px "Scheherazade New", serif`; }
    c.fillStyle = alpha < 1 ? 'rgba(255,236,190,.42)' : '#ffe9b4'; c.textAlign = 'center';
    c.fillText(wd.text, clamp((xa + xb) / 2, MRL.pad + 10, W - MRL.pad - 10), y0 - 9);
  });
  if (d.an.ok) mrRibbon(c, d.an, mrX, yc, hh, 'gold', alpha, d.bands);
  c.font = '600 11px "Readex Pro", sans-serif'; c.textAlign = 'left'; c.fillStyle = 'rgba(255,215,122,.62)'; c.fillText('القارئ', MRL.pad, y0 + MRL.rh - 6);
  /* your ribbon */
  const u = Mirror.u;
  if (u || Mirror.live) {
    const uy0 = y0 + MRL.rh + MRL.bar + MRL.gap, uyc = uy0 + MRL.uh / 2;
    c.font = '700 13px "Readex Pro", sans-serif'; c.textAlign = 'right'; c.fillStyle = '#bfe4ff'; c.fillText('صوتك', W - MRL.pad, uy0 - 9);
    if (u && u.an.ok) mrRibbon(c, u.an, mrXu, uyc, MRL.uh / 2 - 8, 'silver', alpha);
    c.font = '600 11px "Readex Pro", sans-serif'; c.textAlign = 'left'; c.fillStyle = 'rgba(160,210,255,.62)'; c.fillText('أنت', MRL.pad, uy0 + MRL.uh - 6);
  }
  return cv;
}
/* one frame: everything bright, except the part of the playing ribbon not reached yet; then the cursor */
function mrFrame(ms = null, who = 'r') {
  const L = Mirror.L, cv = L && $('#mrCv', L.body); if (!cv || !Mirror.bright) return;
  const c = cv.getContext('2d'), dpr = Mirror.dpr;
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height);
  c.drawImage(Mirror.bright, 0, 0);
  if (Mirror.live) mrLiveDraw(c);
  if (ms == null) return;
  const split = MRL.lbl + MRL.rh + MRL.bar, ya = who === 'r' ? 0 : split, yb = who === 'r' ? split : Mirror.H;
  const x = clamp(who === 'r' ? mrX(ms) : mrXu(ms), MRL.pad - 2, Mirror.W - MRL.pad + 2);
  c.save(); c.beginPath(); c.rect(0, ya * dpr, x * dpr, (yb - ya) * dpr); c.clip();
  c.clearRect(0, ya * dpr, x * dpr, (yb - ya) * dpr); c.drawImage(Mirror.dim, 0, 0); c.restore();
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.strokeStyle = who === 'r' ? '#fff3cf' : '#e2f3ff'; c.lineWidth = 2; c.shadowColor = who === 'r' ? '#ffcf6a' : '#8ccfff'; c.shadowBlur = 10;
  c.beginPath(); c.moveTo(x, ya + 4); c.lineTo(x, yb - 4); c.stroke(); c.shadowBlur = 0;
}
function mrCountShow(b) {
  const box = Mirror.L && $('#mrCount', Mirror.L.body); if (!box) return;
  box.innerHTML = `<span class="mrcn" style="color:${b.col}"><b>${b.name}</b>${b.madd ? `<span class="mrdots">${'<i></i>'.repeat(b.c)}</span>` : `<span class="mrglow"></span>`}<small>${b.lab}</small></span>`;
}
function mrCountTick(b, ms) {
  if (!b.madd) return;
  const k = Math.min(b.c, Math.floor((ms - b.a) / Math.max(1, (b.b - b.a) / b.c)) + 1);
  $$('#mrCount .mrdots i', Mirror.L.body).forEach((x, i) => x.classList.toggle('on', i < k));
}
function mrCountIdle() {
  const box = Mirror.L && $('#mrCount', Mirror.L.body), d = Mirror.d; if (!box) return;
  if (!d) { box.innerHTML = ''; return; }
  const seen = [], names = [];
  for (const b of d.bands) { const k = b.name + b.lab; if (!seen.includes(k)) { seen.push(k); names.push(`<span style="color:${b.col}">${b.name}${b.madd ? ` (${b.sl})` : ''}</span>`); } }
  box.innerHTML = names.length ? `<span class="dim">في هذه الآية:</span> ${names.join('<span class="dim"> · </span>')}` : '<span class="dim">لا مدّ ولا غنّة في هذه الآية</span>';
}
function mrPlay() {
  const L = Mirror.L, d = Mirror.d; if (!L || !d || Mirror.rec) return;
  if (Mirror.playing) { stopAll(); return; }
  stopAll(); mrStopMine(); Sfx.init();
  if (Mirror.keepRate == null) Mirror.keepRate = Player.rate;
  Player.rate = Mirror.slow ? .7 : Mirror.keepRate;
  Mirror.playing = true; Mirror.band = -1;
  $('#mrPlay', L.body).innerHTML = `${ic('pause')} أوقف`;
  playSeq([Mirror.n], { rid: Mirror.rid });
}
/* ---------- your voice under the reciter's ---------- */
function mrMsg(t) { const m = Mirror.L && $('#mrMsg', Mirror.L.body); if (m) { m.hidden = !t; m.textContent = t || ''; } }
function mrRecBtn(on) {
  const b = Mirror.L && $('#mrRec', Mirror.L.body); if (!b) return;
  b.classList.toggle('on', on); b.innerHTML = on ? `${ic('pause')}<span>أوقف</span>` : `${ic('voice')}<span>${Mirror.u ? 'سجّل ثانيةً' : 'سجّل'}</span>`;
  b.setAttribute('aria-label', on ? 'أوقف التسجيل' : 'ابدأ التسجيل');
}
async function mrRecStart() {
  if (!Mirror.d || Mirror.rec) return;
  stopAll(); mrStopMine(); mrMsg('');
  let stream;
  /* no noise suppression: it treats a long, steady madd as noise and cuts it */
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: true } }); }
  catch (e) { mrMsg(e && e.name === 'NotAllowedError' ? 'لم يُسمح بالوصول إلى الميكروفون.' : 'تعذّر بدء التسجيل هنا.'); return; }
  if (!Mirror.L) { stream.getTracks().forEach(t => t.stop()); return; }
  const C = window.AudioContext || window.webkitAudioContext, ac = new C(), an = ac.createAnalyser();
  an.fftSize = 1024; ac.createMediaStreamSource(stream).connect(an);
  const mime = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find(m => window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m));
  const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  const R = Mirror.rec = { stream, ac, an, mr, chunks: [], t0: performance.now(), env: [], buf: new Float32Array(an.fftSize), floor: null, voiced: false, lastV: 0 };
  mr.ondataavailable = e => { if (e.data && e.data.size) R.chunks.push(e.data); };
  mr.onstop = () => mrRecDone(R);
  if (Mirror.u) { if (Mirror.u.url) URL.revokeObjectURL(Mirror.u.url); Mirror.u = null; }
  const res = $('#mrRes', Mirror.L.body); if (res) res.innerHTML = '';
  Mirror.live = { env: R.env };
  mr.start(250); mrRecBtn(true); mrLayout();
  const maxMs = clamp((Mirror.d.an.span || 4000) * 3, 8000, 30000);
  const loop = () => {
    if (Mirror.rec !== R) return;
    an.getFloatTimeDomainData(R.buf); let s = 0; for (const v of R.buf) s += v * v;
    const rms = Math.sqrt(s / R.buf.length), el = performance.now() - R.t0;
    while (R.env.length <= el / 10) R.env.push(rms);
    if (el < 400) R.floor = R.floor == null ? rms : Math.min(R.floor, rms);
    if (rms > Math.max(.012, Math.min(R.floor || 0, .02) * 3)) { R.voiced = true; R.lastV = el; }
    if ((R.voiced && el - R.lastV > 2000) || el > maxMs) { mrRecStop(); return; }
    mrFrame();
    R.raf = requestAnimationFrame(loop);
  };
  R.raf = requestAnimationFrame(loop);
}
function mrLiveDraw(c) {
  const R = Mirror.rec, env = Mirror.live && Mirror.live.env; if (!R || !env || !env.length) return;
  const dpr = Mirror.dpr, uy0 = MRL.lbl + MRL.rh + MRL.bar + MRL.gap, yc = uy0 + MRL.uh / 2, hh = MRL.uh / 2 - 8;
  const el = env.length * 10, k = Math.min(Mirror.k, (Mirror.W - 2 * MRL.pad) / (el + 200)), w = Math.max(1, k * 10) + .7;
  let mx = .02; for (const v of env) if (v > mx) mx = v;
  c.save(); c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const g = c.createLinearGradient(0, yc - hh, 0, yc + hh); g.addColorStop(0, 'rgba(140,207,255,0)'); g.addColorStop(.5, '#f2faff'); g.addColorStop(1, 'rgba(140,207,255,0)');
  c.fillStyle = g;
  for (let i = 0; i < env.length; i++) { const x = Mirror.W - MRL.pad - i * 10 * k, h = Math.max(.5, Math.pow(env[i] / mx, 1.15) * hh); c.fillRect(x - w, yc - h, w, 2 * h); }
  const x = Mirror.W - MRL.pad - el * k;
  c.fillStyle = '#ff6b81'; c.beginPath(); c.arc(x, yc, 5, 0, Math.PI * 2); c.fill();
  c.restore();
}
function mrRecStop() { const R = Mirror.rec; if (!R) return; cancelAnimationFrame(R.raf); try { if (R.mr.state !== 'inactive') R.mr.stop(); else mrRecDone(R); } catch (e) { mrRecDone(R); } }
async function mrRecDone(R) {
  if (R.finished) return; R.finished = true;
  cancelAnimationFrame(R.raf);
  try { R.stream.getTracks().forEach(t => t.stop()); } catch (e) { }
  try { R.ac.close(); } catch (e) { }
  if (Mirror.rec === R) Mirror.rec = null;
  Mirror.live = null;
  if (!Mirror.L) return;
  mrRecBtn(false);
  if (R.cancel) { if (Mirror.d) mrLayout(); return; }
  const blob = new Blob(R.chunks, { type: R.mr.mimeType || 'audio/webm' });
  let env = Float32Array.from(R.env);
  try { if (blob.size) env = await mrDecode(await blob.arrayBuffer()); } catch (e) { /* keep the live envelope */ }
  if (!Mirror.L) return;
  const an = mrAnalyze(env);
  if (!an.ok || an.span < 400) { mrMsg('لم أسمع صوتًا واضحًا. اقترب من الجوال وأعد المحاولة.'); mrLayout(); return; }
  Mirror.u = { an, blob, url: URL.createObjectURL(blob), mime: blob.type, dur: env.length / 100, kept: false };
  mrRecBtn(false); mrLayout(); mrResults();
  S.mirror.rec = [...new Set([...(S.mirror.rec || []), Mirror.n])].filter(v => v >= 1);
  S.mirror.n = (S.mirror.n || 0) + 1; save(); sqNote([Mirror.n]);
  award('mirror'); if (verseRange(1, NV).every(v => S.mirror.rec.includes(v))) award('mirror11');
  addXP(6);
  Mirror.L.stat.textContent = `${ARN(S.mirror.rec.length)} / ${ARN(NV)}`;
}
function mrResults() {
  const d = Mirror.d, u = Mirror.u, box = Mirror.L && $('#mrRes', Mirror.L.body); if (!box || !d || !u || !d.an.ok) return;
  /* the madd is judged against your own pace: a slower reader's madd is rightly longer */
  const r = d.an, m = u.an, ratio = m.span / Math.max(1, r.span), sr = (m.longest / Math.max(1, m.span)) / Math.max(1e-6, r.longest / Math.max(1, r.span));
  const longMadd = d.bands.some(b => b.madd && b.c >= 4), canVib = typeof navigator.vibrate === 'function';
  const tempo = ratio < .8 ? `أسرع من القارئ بنحو ${ARN(Math.round((1 - ratio) * 100))}٪. تمهّل: القراءة ترتيلٌ لا سباق.`
    : ratio > 1.25 ? `أبطأ من القارئ بنحو ${ARN(Math.round((ratio - 1) * 100))}٪. لا بأس: الإتقان أولًا ثم الانسياب.`
    : 'إيقاعك قريبٌ من إيقاع القارئ، ما شاء الله.';
  const madd = sr < .6 ? `أطول صوتٍ مددتَه أقصر بكثير مما عند القارئ نسبةً إلى سرعتك.${longMadd ? ` في هذه الآية مدٌّ طويل: عُدّ حركاته مع النقاط${canVib ? ' والاهتزاز' : ''}.` : ''}`
    : sr > 1.6 ? 'مددتَ صوتك أطول من القارئ نسبةً إلى سرعتك. أعطِ كل مدٍّ حقّه بلا زيادة.'
    : 'امتداد صوتك قريبٌ مما عند القارئ نسبةً إلى سرعتك.';
  const pz = m.pauses > r.pauses ? `توقفتَ داخل الآية ${cnt(m.pauses, ['مرةً واحدة', 'مرتين', 'مرات', 'مرة'])}${r.pauses ? '' : '، والقارئ وصلها'}. جرّب أن تصلها إن استطعت.`
    : m.pauses === 0 ? 'قرأتَ الآية موصولةً بلا توقف.' : 'وقفاتك ليست أكثر من وقفات القارئ.';
  html(box, `<div class="mrstats">
    <div class="mrstat"><span>${ic('timer')} مدة التلاوة</span><b>${mrSec(r.span)}<small>القارئ</small></b><b class="me">${mrSec(m.span)}<small>أنت</small></b><p>${tempo}</p></div>
    <div class="mrstat"><span>${ic('wave')} أطول صوتٍ ممدود</span><b>${mrSec(r.longest)}<small>القارئ</small></b><b class="me">${mrSec(m.longest)}<small>أنت</small></b><p>${madd}</p></div>
    <div class="mrstat"><span>${ic('pause')} وقفات داخل الآية</span><b>${ARN(r.pauses)}<small>القارئ</small></b><b class="me">${ARN(m.pauses)}<small>أنت</small></b><p>${pz}</p></div>
  </div>
  <div class="mrdock"><button class="btn btn-line" id="mrMine">${ic('play')} اسمع تسجيلك</button>${window.indexedDB ? `<button class="btn btn-line" id="mrKeep"${u.kept ? ' disabled' : ''}>${ic('download')} ${u.kept ? 'حُفظ في «صوتك قبل وبعد»' : 'احفظه في «صوتك قبل وبعد»'}</button>` : ''}</div>
  <p class="dim mrnote">مقارنةٌ تقريبية بالمدة وامتداد الصوت، لا بصحة الحروف.</p>`);
}
function mrPlayMine() {
  const u = Mirror.u; if (!u) return;
  if (Mirror.ua) { mrStopMine(); return; }
  stopAll();
  const a = Mirror.ua = new Audio(u.url), b = $('#mrMine', Mirror.L.body);
  if (b) b.innerHTML = `${ic('pause')} أوقف`;
  const loop = () => { if (Mirror.ua !== a) return; mrFrame(a.currentTime * 1000, 'u'); Mirror.uraf = requestAnimationFrame(loop); };
  a.onplaying = () => { cancelAnimationFrame(Mirror.uraf); Mirror.uraf = requestAnimationFrame(loop); };
  a.onended = () => mrStopMine();
  a.play().catch(() => mrStopMine());
}
function mrStopMine() {
  const a = Mirror.ua; if (!a) return;
  Mirror.ua = null; cancelAnimationFrame(Mirror.uraf);
  try { a.pause(); } catch (e) { }
  const b = Mirror.L && $('#mrMine', Mirror.L.body); if (b) b.innerHTML = `${ic('play')} اسمع تسجيلك`;
  mrFrame();
}
async function mrKeep() {
  const u = Mirror.u; if (!u || u.kept) return;
  try {
    await RecDB.put({ id: Date.now(), at: dayKey(), dur: u.dur, mime: u.mime, blob: u.blob });
    u.kept = true; addXP(4);
    const all = await RecDB.all(); if (all.length >= 2 && daysBetween(all[0].at, all[all.length - 1].at) >= 7) award('voice');
    const b = Mirror.L && $('#mrKeep', Mirror.L.body); if (b) { b.disabled = true; b.innerHTML = `${ic('check')} حُفظ في «صوتك قبل وبعد»`; }
    toast('حُفظ تسجيلك على جهازك', 'voice');
  } catch (e) { toast('تعذّر حفظ التسجيل', 'x'); }
}
