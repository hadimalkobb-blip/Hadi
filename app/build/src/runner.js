/* ===== Runner: lessons, reviews and games in a focused full-screen layer ===== */
const CLOSED = Symbol('closed');
const Run = { el: null, body: null, pending: new Set(), xp: 0, combo: 0, best: 0, steps: 1, step: 0, alive: false, onClose: null };
const PRAISE = ['أحسنت!', 'ممتاز!', 'بارك الله فيك!', 'رائع!', 'إجابة موفّقة!', 'هكذا تُحفظ الآيات!'];
function pend(fn) {
  return new Promise((res, rej) => {
    const p = { rej };
    Run.pending.add(p);
    fn(v => { Run.pending.delete(p); res(v); }, e => { Run.pending.delete(p); rej(e); });
  });
}
function openRunner(title) {
  closeRunner(true);
  closeSheet(); closePop(); stopAll();
  Run.el = node(`<div class="runner" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <div class="run-top"><button class="iconbtn" data-x aria-label="إغلاق">${ic('x')}</button><div class="rp" aria-hidden="true"><i></i></div><span class="combo" id="rCombo" hidden></span><span class="rx" id="rXp">+٠</span></div>
    <div class="run-body"><div class="run-in" id="rIn"></div></div></div>`);
  document.body.appendChild(Run.el);
  document.body.style.overflow = 'hidden';
  Run.body = $('#rIn', Run.el); Run.xp = 0; Run.combo = 0; Run.best = 0; Run.step = 0; Run.steps = 1; Run.alive = true; Run.game = null; Run.h = 0; Run.m = 0;
  Run.el.querySelector('[data-x]').onclick = () => closeRunner();
  return Run.body;
}
function closeRunner(silent) {
  for (const p of Run.pending) p.rej(CLOSED);
  Run.pending.clear();
  if (Run.onClose) { const f = Run.onClose; Run.onClose = null; try { f(); } catch (e) { console.error(e); } }
  if (!Run.el) return;
  stopAll(); Narr.stop(); Amb.set(null);
  Run.el.remove(); Run.el = null; Run.alive = false;
  document.body.style.overflow = '';
  if (!silent) { updateHeader(); if (tab === 'home') renderHome(); if (tab === 'play') renderPlay(); }
}
function setProg(i, n) { Run.step = i; Run.steps = n; const b = Run.el && Run.el.querySelector('.rp i'); if (b) b.style.width = (100 * clamp(i / n)).toFixed(1) + '%'; }
function gain(n) { addXP(n); Run.xp += Math.round(n); const x = $('#rXp'); if (x) { x.textContent = '+' + ARN(Run.xp); x.animate([{ transform: 'scale(1.35)' }, { transform: 'scale(1)' }], { duration: 300 }); } }
function hit() {
  Run.combo++; Run.best = Math.max(Run.best, Run.combo);
  const mult = 1 + Math.min(2, Math.floor(Run.combo / 3)) * .5;
  gain(10 * mult);
  const c = $('#rCombo'); if (c) { c.hidden = Run.combo < 3; c.innerHTML = `${ic('flame')}${ARN(Run.combo)}`; }
  if (Run.combo >= 10) award('combo10');
  Sfx.ok(); buzz(14);
}
function miss() { Run.combo = 0; const c = $('#rCombo'); if (c) c.hidden = true; Sfx.bad(); buzz([30, 40, 30]); }
const until = el => pend(res => { el.onclick = () => res(true); });
function stepHead(k, sub) { return `<div class="step-t"><span class="k">${k}</span>${sub ? `<span class="muted">${sub}</span>` : ''}</div>`; }
const vsLabel = vs => vs.length === 1 ? `الآية ${ARN(vs[0])}` : `الآيات ${ARN(vs[0])}–${ARN(vs[vs.length - 1])}`;

/* ---------- step: listen ---------- */
function stepListen(vs, times = 2) {
  const b = Run.body;
  html(b, `${stepHead('اسمع', `${vsLabel(vs)} · ${ARN(times)} مرات · تابع الكلمات بعينك`)}
    <div class="panel"><div class="qt night qbig" id="lText" style="font-size:clamp(24px,6.4vw,34px)">${vs.map(n => verseHTML(n)).join(' ')}</div></div>
    <div class="row" style="justify-content:center"><button class="btn btn-line" id="lPlay">${ic('play')} استمع</button><span class="dim" id="lCnt"></span></div>
    <button class="btn btn-sun btn-wide" id="lGo" disabled>تابع</button><button class="btn btn-line btn-wide" id="lSkip">تخطَّ هذه الخطوة</button>`);
  const list = []; for (let i = 0; i < times; i++) list.push(...vs);
  let heard = 0;
  const hl = t => { if (!Run.alive) return; $$('#lText .w').forEach(w => w.classList.toggle('on', +w.dataset.v === t.n && +w.dataset.w === t.w)); };
  const sub = (ev, d) => { if (ev === 'verseEnd') { heard++; $('#lCnt').textContent = `الاستماع ${ARN(Math.min(times, Math.ceil(heard / vs.length)))} من ${ARN(times)}`; if (heard >= vs.length) $('#lGo').disabled = false; } if (ev === 'end') { $('#lPlay').innerHTML = `${ic('repeat')} أعد`; $$('#lText .w.on').forEach(w => w.classList.remove('on')); } };
  Ticks.add(hl); Player.subs.add(sub);
  const start = () => { heard = 0; $('#lPlay').innerHTML = `${ic('pause')} أوقف`; playSeq(list, { gap: 450 }); };
  $('#lPlay').onclick = () => { Sfx.init(); if (Player.state !== 'idle') { stopAll(); return; } start(); };
  start();
  return pend(res => {
    const done = () => { Ticks.delete(hl); Player.subs.delete(sub); stopAll(); res(true); };
    $('#lGo').onclick = done; $('#lSkip').onclick = done;
  }).catch(e => { Ticks.delete(hl); Player.subs.delete(sub); throw e; });
}

/* ---------- step: echo (repeat after the reciter) ---------- */
function stepEcho(vs, rounds = 2) {
  const b = Run.body;
  html(b, `${stepHead('ردّد', 'يقرأ الشيخ الآية، ثم يصمت لتعيدها أنت بصوتٍ مسموع')}
    <div class="panel" style="display:grid;gap:12px;justify-items:center">
      <div class="qt night qbig" id="eText"></div>
      <div id="eTurn" class="row" style="justify-content:center;min-height:56px"></div>
    </div>
    <div class="row" style="justify-content:center"><button class="btn btn-line" id="ePlay">${ic('play')} ابدأ الترديد</button><span class="dim" id="eCnt"></span></div>
    <button class="btn btn-sun btn-wide" id="eGo" disabled>تابع</button><button class="btn btn-line btn-wide" id="eSkip">تخطَّ هذه الخطوة</button>`);
  const list = []; for (let i = 0; i < rounds; i++) list.push(...vs);
  let count = 0;
  const show = n => { $('#eText').innerHTML = verseHTML(n); };
  show(vs[0]);
  const hl = t => { if (!Run.alive) return; $$('#eText .w').forEach(w => w.classList.toggle('on', +w.dataset.w === t.w)); };
  const sub = (ev, d) => {
    if (ev === 'verse') { show(d.n); $('#eTurn').innerHTML = `<span class="badge">${ic('headphones')} استمع…</span>`; }
    if (ev === 'echo') {
      $('#eTurn').innerHTML = `<div style="display:grid;justify-items:center;gap:8px;width:100%"><span class="badge" style="font-size:16px;padding:8px 14px;color:var(--sun-2)">${ic('hand')} دورك! ردّد الآية</span><div class="eturn"><i></i></div></div>`;
      $$('#eText .w').forEach(w => w.classList.remove('on'));
      const bar = $('#eTurn .eturn i'); if (bar) bar.animate([{ width: '100%' }, { width: '0%' }], { duration: d.ms, easing: 'linear', fill: 'forwards' });
    }
    if (ev === 'echoEnd') { count++; $('#eCnt').textContent = `${ARN(count)} من ${ARN(list.length)}`; if (count >= vs.length) $('#eGo').disabled = false; gain(3); }
    if (ev === 'end') { $('#eTurn').innerHTML = ''; $('#ePlay').innerHTML = `${ic('repeat')} أعد الترديد`; }
  };
  Ticks.add(hl); Player.subs.add(sub);
  const start = () => { count = 0; $('#ePlay').innerHTML = `${ic('pause')} أوقف`; playSeq(list, { echo: true }); };
  $('#ePlay').onclick = () => { Sfx.init(); if (Player.state !== 'idle') { stopAll(); return; } start(); };
  start();
  return pend(res => {
    const done = () => { Ticks.delete(hl); Player.subs.delete(sub); stopAll(); res(true); };
    $('#eGo').onclick = done; $('#eSkip').onclick = done;
  }).catch(e => { Ticks.delete(hl); Player.subs.delete(sub); throw e; });
}

/* ---------- step: understand ---------- */
async function stepUnderstand(vs) {
  for (let i = 0; i < vs.length; i++) {
    const n = vs[i], v = VERSES[n], wm = v.words ? Object.values(v.words) : [];
    html(Run.body, `${stepHead('افهم', `${ARN(i + 1)} من ${ARN(vs.length)} · المعنى يفتح باب الحفظ`)}
      <div class="panel" style="display:grid;gap:12px">
        ${hasScene('v' + n) ? `<div class="uscene"><img src="${posterUrl('v' + n)}" alt=""><span class="usym">${sy(v.sym)}</span></div>` : `<div class="recall-sym">${sy(v.sym)}</div>`}
        <h3 style="text-align:center;font:700 24px var(--f-display);color:var(--sun-2)">${v.symName}</h3>
        <div class="qt night qbig">${verseHTML(n)}</div>
        <p style="text-align:center;font-size:16.5px">${v.mean}</p>
        ${wm.length ? `<div class="wm">${wm.map(x => `<span>${qfmt(x)}</span>`).join('')}</div>` : ''}
        ${DEEP[n] ? `<p class="dline-s" style="text-align:center">${qfmt(DEEP[n].line)}</p>` : ''}
        <div class="row" style="justify-content:center;gap:8px;flex-wrap:wrap">${narrBtn('v' + n, 'chip')}${DEEP[n] ? `<button class="chip" data-deep="${n}">${ic('spark')} تعمّق</button>` : ''}</div>
      </div>
      <button class="btn btn-line" id="uPlay">${ic('sound')} استمع للآية</button>
      <button class="btn btn-sun btn-wide" id="uGo">${i < vs.length - 1 ? 'الآية التالية' : 'تابع'}</button>`);
    $('#uPlay').onclick = () => { Sfx.init(); playSeq([n]); };
    await until($('#uGo'));
    stopAll(); Narr.stop();
  }
}

/* ---------- step / game: build the verse from tiles ---------- */
function buildUnits(vs) { const out = []; for (const n of vs) { if (n === 1) { out.push([1, 2]); continue; } if (n === 2 && vs.includes(1)) continue; out.push([n]); } return out; }
async function stepBuild(vs, title = 'ركّب') {
  const units = buildUnits(vs);
  let mistakes = 0, total = 0;
  for (let u = 0; u < units.length; u++) {
    const unit = units[u], m0 = mistakes;
    const seq = []; unit.forEach(n => QD.verses[n].forEach((w, i) => seq.push({ n, i, w })));
    total += seq.length;
    const lvB = Run.game === 'build' ? adaptLevel('build') : 0;
    const decoyW = lvB >= 2 ? shuffle(verseRange(1, NV).filter(x => !unit.includes(x)).flatMap(x => QD.verses[x].map((w, i) => ({ n: x, i, w })))).filter(d => !seq.some(q => q.w === d.w)).slice(0, lvB - 1) : [];
    let tiles = shuffle([...seq.map((x, k) => ({ ...x, k })), ...decoyW.map(d => ({ ...d, k: -1, decoy: true }))]);
    if (seq.length > 1) while (tiles.every((t, k) => t.k === k || t.decoy)) tiles = shuffle(tiles);
    html(Run.body, `${stepHead(title, `${vsLabel(unit)} · اضغط الكلمات بالترتيب`)}
      <div class="answer qt night" id="bAns" aria-live="polite"></div>
      <div class="tiles" id="bTiles">${tiles.map((t, j) => `<button class="tile qt night" data-j="${j}">${wordHTML(t.n, t.i)}</button>`).join('')}</div>
      <div class="feedback" id="bFb"></div>
      <button class="btn btn-line" id="bHint">${ic('sound')} تلميح: اسمع الآية</button>
      <button class="btn btn-sun btn-wide" id="bGo" hidden>تابع</button>`);
    let pos = 0;
    $('#bHint').onclick = () => { Sfx.init(); playSeq(unit); mistakes += .5; };
    await pend(res => {
      $('#bTiles').onclick = e => {
        const el = e.target.closest('.tile'); if (!el || el.classList.contains('used')) return;
        const t = tiles[+el.dataset.j], want = seq[pos];
        if (t.w === want.w) {
          el.classList.add('used');
          const lastOfVerse = pos === seq.length - 1 || seq[pos + 1].n !== want.n;
          $('#bAns').insertAdjacentHTML('beforeend', `<span class="w">${wordHTML(want.n, want.i)}</span>${lastOfVerse && want.n ? '\u00a0' + marker(want.n) : ''} `);
          pos++; Sfx.tap(); buzz(8);
          if (pos === seq.length) { if (mistakes - m0 >= 2) unit.forEach(n => brainNote(n, 2, 'build')); vShine($('#bAns')); hit(); $('#bFb').className = 'feedback good'; $('#bFb').textContent = pick(PRAISE); playSeq(unit); $('#bGo').hidden = false; $('#bHint').hidden = true; $('#bGo').onclick = () => { stopAll(); res(true); }; }
          else playWord(want.n, want.i);
        } else {
          mistakes++; el.classList.remove('wrong'); void el.offsetWidth; el.classList.add('wrong'); miss();
          $('#bFb').className = 'feedback bad'; $('#bFb').textContent = 'ليست هذه. فكّر في الكلمة التالية…';
        }
      };
    });
  }
  return { score: clamp(1 - mistakes / Math.max(1, total)), mistakes };
}

/* ---------- multiple choice engine ---------- */
function mcq({ head, prompt, opts, ok, ui, explain, two }) {
  html(Run.body, `${head || ''}${prompt}<div class="opts ${two ? 'two' : ''}">${opts.map((o, i) => `<button class="opt ${ui ? 'ui' : 'qt night'}" data-i="${i}">${o}</button>`).join('')}</div><div class="feedback" id="qFb" aria-live="polite"></div><button class="btn btn-sun btn-wide" id="qGo" hidden>التالي</button>`);
  return pend(res => {
    let done = false;
    $('.opts', Run.body).onclick = e => {
      const b = e.target.closest('.opt'); if (!b || done) return;
      done = true;
      const i = +b.dataset.i, right = i === ok;
      $$('.opt', Run.body)[ok].classList.add('right');
      const fb = $('#qFb');
      if (right) { hit(); fb.className = 'feedback good'; fb.innerHTML = pick(PRAISE) + (explain ? ` <span class="dim">${qfmt(explain)}</span>` : ''); setTimeout(() => res(true), explain ? 1500 : 750); }
      else { b.classList.add('wrong'); miss(); fb.className = 'feedback bad'; fb.innerHTML = `الإجابة الصحيحة باللون الأخضر.${explain ? ' ' + qfmt(explain) : ''}`; $('#qGo').hidden = false; $('#qGo').onclick = () => res(false); }
    };
  });
}
function blankVerse(n, w) { return QD.verses[n].map((x, i) => i === w ? `<span class="w" style="display:inline-block;min-width:3.2em;border-bottom:2px dashed var(--sun);color:var(--sun-2)">؟</span>` : `<span class="w">${wordHTML(n, i)}</span>`).join(' ') + '\u00a0' + marker(n); }
function missingQ(n) {
  const words = QD.verses[n]; const w = Math.random() * words.length | 0, right = words[w];
  const pool = shuffle([...new Set(verseRange(1, NV).filter(x => x !== n).flatMap(x => QD.verses[x]))].filter(x => x !== right));
  const sameEnd = pool.filter(x => x.slice(-2) === right.slice(-2) || x[0] === right[0]);
  const lv = Run.game === 'missing' ? adaptLevel('missing') : 1, nd = [2, 3, 3, 4][lv], ns = [0, 1, 2, 3][lv];
  const ds = [...new Set([...sameEnd.slice(0, ns), ...pool])].slice(0, nd);
  const opts = shuffle([right, ...ds]);
  return { n, w, opts, ok: opts.indexOf(right) };
}
async function stepMissing(vs, count, title = 'أكمل') {
  const qs = []; for (let i = 0; i < count; i++) qs.push(missingQ(vs[i % vs.length]));
  let good = 0;
  for (let i = 0; i < qs.length; i++) {
    const q = qs[i];
    const words = q.opts.map(x => { for (let n = 1; n <= NV; n++) { const k = QD.verses[n].indexOf(x); if (k >= 0) return wordHTML(n, k); } return esc(x); });
    if (await mcq({ head: stepHead(title, `${ARN(i + 1)} من ${ARN(qs.length)} · اختر الكلمة الناقصة`), prompt: `<div class="panel"><div class="qt night qbig">${blankVerse(q.n, q.w)}</div></div>`, opts: words, ok: q.ok, two: true })) good++;
    else brainNote(q.n, 2, 'missing');
  }
  return { score: good / qs.length, good, total: qs.length };
}

/* ---------- step: the washing tablet ---------- */
async function stepTablet(vs, title = 'اللوح') {
  const levels = [0, .34, .67, 1];
  const all = []; vs.forEach(n => QD.verses[n].forEach((_, i) => all.push(n + ':' + i)));
  const order = shuffle(all);
  let peeks = 0;
  for (let r = 0; r < levels.length; r++) {
    const hidden = new Set(order.slice(0, Math.round(levels[r] * all.length)));
    const msg = r === 0 ? 'اقرأ اللوح بصوتك ٣ مرات، ثم اضغط «سمّعتُه»' : r < levels.length - 1 ? `مُحي ${ARN(Math.round(levels[r] * 100))}٪ من اللوح. سمّع من ذاكرتك، واضغط الكلمة المخفية لتلمحها` : 'مُحي اللوح كله! سمّعه كاملًا من ذاكرتك';
    html(Run.body, `${stepHead(title, msg)}
      <div class="tablet ${r ? 'wash' : ''}"><div class="qt" id="tText">${vs.map(n => QD.verses[n].map((_, i) => `<span class="w ${hidden.has(n + ':' + i) ? 'slot' : ''}" data-v="${n}" data-w="${i}">${wordHTML(n, i)}</span>`).join(' ') + '\u00a0' + marker(n)).join(' ')}</div></div>
      <div class="row" style="justify-content:center"><button class="btn btn-line" id="tPlay">${ic('sound')} استمع</button><span class="dim">لمحات: <b id="tPk">${ARN(peeks)}</b></span></div>
      <button class="btn btn-sun btn-wide" id="tGo">${ic('check')} سمّعتُه</button>`);
    $('#tText').classList.add('notj');
    $('#tText').onclick = e => { const w = e.target.closest('.w.slot'); if (!w || w.classList.contains('peek')) return; w.classList.add('peek'); peeks++; $('#tPk').textContent = ARN(peeks); Sfx.tap(); };
    $('#tPlay').onclick = () => { Sfx.init(); peeks += r ? 1 : 0; $('#tPk').textContent = ARN(peeks); playSeq(vs); };
    await until($('#tGo'));
    stopAll(); gain(8); Sfx.tap();
  }
  const g = peeks === 0 ? 3 : peeks <= 2 ? 2 : 1; vs.forEach(n => brainNote(n, g, 'tablet'));
  return { peeks, score: clamp(1 - peeks / Math.max(4, all.length / 2)) };
}

/* ---------- step: recall and self-grade ---------- */
async function stepRecall(vs, title = 'سمّع') {
  let good = 0; const marks = [];
  for (let i = 0; i < vs.length; i++) {
    const n = vs[i], v = VERSES[n];
    html(Run.body, `${stepHead(title, `${ARN(i + 1)} من ${ARN(vs.length)} · سمّع الآية بصوتك ثم تحقّق`)}
      <div class="panel" style="display:grid;gap:12px;justify-items:center;text-align:center">
        <div class="recall-sym">${sy(v.sym)}</div>
        <span class="eyebrow">الآية ${ARN(n)} · ${v.symName}</span>
        <div class="qt night qbig" id="rText"><span class="w">${wordHTML(n, 0)}</span> <span style="opacity:.4">…</span></div>
      </div>
      <button class="btn btn-sun btn-wide" id="rShow">${ic('eye')} أظهر الآية</button>
      <div class="selfgrade" id="rGrade" hidden><button class="btn btn-good" data-ok="1">${ic('check')} أصبت</button><button class="btn btn-bad" data-ok="0">${ic('x')} أخطأت</button></div>`);
    await until($('#rShow'));
    $('#rText').innerHTML = verseHTML(n); $('#rShow').hidden = true; $('#rGrade').hidden = false;
    Sfx.init(); playSeq([n]);
    const ok = await pend(res => { $('#rGrade').onclick = e => { const b = e.target.closest('[data-ok]'); if (b) res(b.dataset.ok === '1'); }; });
    stopAll();
    if (ok) { good++; hit(); } else miss();
    marks.push(ok); brainNote(n, ok ? 3 : 1, 'recall');
  }
  return { score: good / vs.length, good, total: vs.length, marks };
}

/* ---------- order the verses (race) ---------- */
async function stepOrder(vs, title = 'رتّب السورة') {
  let mistakes = 0, next = 0;
  const cards = shuffle(vs);
  const t0 = performance.now();
  html(Run.body, `${stepHead(title, 'اضغط الآيات بترتيبها في المصحف · كل خطأ يضيف ٣ ثوانٍ')}
    <div class="row" style="justify-content:center"><span class="timer" id="oT">٠:٠٠</span></div>
    <div class="ordered" id="oDone"></div>
    <div class="vcards" id="oCards">${cards.map(n => `<button class="vc qt night" data-n="${n}">${verseHTML(n, { marker: false })}</button>`).join('')}</div>`);
  const tick = setInterval(() => { const el = $('#oT'); if (!el) return clearInterval(tick); el.textContent = fmtTime((performance.now() - t0) / 1000 + mistakes * 3); }, 250);
  try {
    await pend(res => {
      $('#oCards').onclick = e => {
        const c = e.target.closest('.vc'); if (!c || c.classList.contains('placed')) return;
        const n = +c.dataset.n;
        if (n === vs[next]) {
          c.classList.add('placed'); next++; Sfx.tap(); buzz(8); gain(4); setProg(next, vs.length);
          $('#oDone').insertAdjacentHTML('beforeend', `<div><span>${ARN(n)}</span><span class="qt night">${verseHTML(n, { marker: false })}</span></div>`);
          c.remove();
          if (next === vs.length) res(true);
        } else { mistakes++; c.classList.remove('wrong'); void c.offsetWidth; c.classList.add('wrong'); miss(); }
      };
    });
  } finally { clearInterval(tick); }
  const secs = (performance.now() - t0) / 1000 + mistakes * 3;
  return { secs, mistakes, score: clamp(1 - mistakes / vs.length) };
}

/* ---------- next verse quiz ---------- */
async function stepNext(count, title = 'ما بعدها؟') {
  const ns = shuffle(verseRange(1, NV - 1)).slice(0, count);
  let good = 0;
  for (let i = 0; i < ns.length; i++) {
    const n = ns[i];
    const others = shuffle(verseRange(1, NV).filter(x => x !== n + 1 && x !== n)).slice(0, 2);
    const opts = shuffle([n + 1, ...others]);
    if (await mcq({ head: stepHead(title, `${ARN(i + 1)} من ${ARN(ns.length)} · ما الآية التي تأتي بعد هذه؟`), prompt: `<div class="panel"><div class="qt night qbig">${verseHTML(n)}</div></div>`, opts: opts.map(x => verseHTML(x, { marker: false })), ok: opts.indexOf(n + 1) })) good++;
  }
  return { score: good / ns.length, good, total: ns.length };
}

/* ---------- celebration ---------- */
async function celebrate({ title, sub, stars = 0, gemReward = true, again }) {
  let daily = false;
  if (Run.game && !/^tj|^(coach|quick|weak)$/.test(Run.game) && (Run.h || 0) + (Run.m || 0) >= 3) adaptNote(Run.game, Run.h / (Run.h + Run.m));
  if (Run.game && Run.game === dailyGame().id && S.daily !== dayKey()) { S.daily = dayKey(); gain(50); daily = true; }
  const nb = SESSION.newBadges.splice(0);
  Sfx.win(); buzz([20, 50, 20, 50, 40]);
  setProg(1, 1);
  html(Run.body, `<div class="result">
    <div class="sunrise" aria-hidden="true"></div>
    <h2>${title}</h2>${sub ? `<p class="muted">${sub}</p>` : ''}
    ${stars ? `<div class="stars3" aria-label="${stars} من ٣ نجوم">${[1, 2, 3].map(i => i <= stars ? '<b>★</b>' : '★').join('')}</div>` : ''}
    <div class="big">+${ARN(Run.xp)}</div><span class="dim">نقطة في هذه الجولة${Run.best >= 3 ? ` · أطول سلسلة: ${ARN(Run.best)}` : ''}</span>${daily ? `<span class="badge" style="color:var(--sun-2)">${ic('star')} أتممت تحدي اليوم: +٥٠</span>` : ''}
    ${nb.length ? `<div class="newbadges">${nb.map(id => { const b = BADGES.find(x => x.id === id); return `<div class="bd got" style="width:120px"><span class="bi">${ic(b.ic)}</span><b>${b.name}</b><span>${b.d}</span></div>`; }).join('')}</div>` : ''}
    ${gemReward ? `<div class="card gem" style="text-align:start"><span class="eyebrow">هديتك: لطيفة جديدة</span><p style="margin-top:6px">${qfmt(pick(GEMS))}</p></div>` : ''}
  </div>
  ${again ? `<button class="btn btn-line btn-wide" id="cAgain">${ic('repeat')} مرة أخرى</button>` : ''}
  <button class="btn btn-sun btn-wide" id="cDone">تم</button>`);
  if (again) $('#cAgain').onclick = () => again();
  await until($('#cDone'));
  closeRunner();
}

/* ---------- lessons ---------- */
function startStation(id) {
  const st = STATIONS[id - 1]; if (!st) return;
  Sfx.init();
  openRunner(st.name);
  const flow = id === 5 ? bossFlow : stationFlow;
  flow(st).catch(e => { if (e !== CLOSED) console.error(e); });
}
async function stationFlow(st) {
  const vs = st.verses, N = 7;
  setProg(0, N); await stepListen(vs, 2);
  setProg(1, N); await stepEcho(vs, 2);
  setProg(2, N); await stepUnderstand(vs);
  setProg(3, N); const b = await stepBuild(vs);
  setProg(4, N); const m = await stepMissing(vs, Math.max(3, vs.length + 1));
  setProg(5, N); const t = await stepTablet(vs);
  setProg(6, N); const r = await stepRecall(vs);
  const score = (b.score + m.score + t.score + r.score * 2) / 5;
  const stars = score >= .9 ? 3 : score >= .7 ? 2 : 1;
  gain(100 + stars * 20);
  markStation(st.id, stars);
  await sealMoment(st, stars);
  await celebrate({ title: `أشرقت محطة «${st.name}»`, sub: `${vsLabel(vs)} · ستذكّرك الرحلة بمراجعتها غدًا`, stars });
}
async function bossFlow(st) {
  const N = 4;
  setProg(0, N); await stepListen(verseRange(1, NV), 1);
  setProg(1, N); const o = await stepOrder(verseRange(1, NV), 'رتّب السورة');
  if (S.best.orderTime == null || o.secs < S.best.orderTime) S.best.orderTime = Math.round(o.secs);
  if (o.secs < 45) award('speed');
  setProg(2, N); const nx = await stepNext(6);
  setProg(3, N); const r = await stepRecall(verseRange(1, NV), 'التسميع الكامل');
  const score = (o.score + nx.score + r.score * 2) / 4;
  const stars = score >= .9 ? 3 : score >= .7 ? 2 : 1;
  gain(150 + stars * 30);
  markStation(5, stars);
  if (score >= .85) award('boss');
  await celebrate({ title: score >= .85 ? 'أتقنت سورة الضحى!' : 'أتممت التحدي الأخير', sub: score >= .85 ? 'هنيئًا لك: سورة كاملة في صدرك. راجعها لتبقى.' : 'أعد التحدي بعد مراجعة قصيرة لتظفر بوسام المتقن.', stars });
}
function startReview(id) {
  const st = STATIONS[id - 1]; if (!st) return;
  openRunner('مراجعة ' + st.name);
  (async () => {
    const vs = st.verses, N = 3;
    setProg(0, N); await stepTablet(vs, 'مراجعة: اللوح');
    setProg(1, N); await stepRecall(vs, 'مراجعة: سمّع');
    setProg(2, N); await stepMissing(vs, 3, 'مراجعة: أكمل');
    gain(40); markReview(id);
    await celebrate({ title: 'مراجعة موفّقة', sub: `ثبتت «${st.name}» أكثر · موعدها القادم بعد ${ARN(INTERVALS[S.st[id].stage])} ${INTERVALS[S.st[id].stage] > 2 ? 'أيام' : 'يوم'}` });
  })().catch(e => { if (e !== CLOSED) console.error(e); });
}

/* ---------- arcade games ---------- */
function startGame(id) {
  Sfx.init();
  const g = allGames().find(x => x.id === id);
  if (id === 'palace') return openPalace();
  openRunner(g ? g.name : 'لعبة');
  Run.game = id;
  S.played = (S.played || 0) + 1; save();
  const fn = GAME_FNS[id];
  if (!fn) { closeRunner(); return; }
  fn().catch(e => { if (e !== CLOSED) console.error(e); });
}
const again = id => () => startGame(id);
const allGames = () => [...GAMES, ...GAMES_GEO, ...GAMES_NEW, ...GAMES_ART, ...(typeof TJ_GAMES !== 'undefined' ? TJ_GAMES : []), ...(typeof GAMES_50 !== 'undefined' ? GAMES_50 : [])];
const GAME_FNS = {
  async build() {
    const vs = shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10, 11]).slice(0, 5);
    const parts = []; let sc = 0;
    for (let i = 0; i < vs.length; i++) { setProg(i, vs.length); const r = await stepBuild([vs[i]], 'ركّب الآية'); sc += r.score; parts.push(r); }
    const pct = Math.round(sc / vs.length * 100); S.best.build = Math.max(S.best.build || 0, pct); save(); gain(20);
    await celebrate({ title: `دقة ${ARN(pct)}٪`, sub: 'رتّبت خمس آيات كلمةً كلمة', stars: pct >= 90 ? 3 : pct >= 70 ? 2 : 1, gemReward: false, again: again('build') });
  },
  async missing() {
    const vs = shuffle(verseRange(2, NV)).slice(0, 8);
    setProg(0, 1);
    const r = await stepMissing(vs, 8, 'الكلمة الناقصة');
    S.best.missing = Math.max(S.best.missing || 0, r.good); save(); gain(20);
    await celebrate({ title: `${ARN(r.good)} من ${ARN(r.total)}`, sub: 'الكلمة الناقصة', stars: r.score >= .9 ? 3 : r.score >= .6 ? 2 : 1, gemReward: false, again: again('missing') });
  },
  async next() {
    const r = await stepNext(8);
    S.best.next = Math.max(S.best.next || 0, r.good); save(); gain(20);
    await celebrate({ title: `${ARN(r.good)} من ${ARN(r.total)}`, sub: 'ربطت الآيات ببعضها', stars: r.score >= .9 ? 3 : r.score >= .6 ? 2 : 1, gemReward: false, again: again('next') });
  },
  async order() {
    const o = await stepOrder(verseRange(1, NV));
    const prev = S.best.orderTime; const rec = prev == null || o.secs < prev;
    if (rec) S.best.orderTime = Math.round(o.secs);
    if (o.secs < 45) award('speed');
    save(); gain(30);
    await celebrate({ title: fmtTime(o.secs), sub: `${rec ? 'رقم قياسي جديد! ' : `رقمك الأفضل ${fmtTime(prev)} · `}الأخطاء: ${ARN(o.mistakes)}`, stars: o.mistakes === 0 ? 3 : o.mistakes <= 2 ? 2 : 1, gemReward: false, again: again('order') });
  },
  async hunter() {
    const hs = shuffle(HUNTS).slice(0, 6);
    let mistakes = 0, found = 0;
    for (let r = 0; r < hs.length; r++) {
      setProg(r, hs.length);
      const h = hs[r], need = Math.min(h.a.length, 3), got = new Set();
      html(Run.body, `<div class="huntq"><b>${h.q}</b><div class="dim">اضغط ${ARN(need)} ${need > 2 ? 'مواضع' : need === 2 ? 'موضعين' : 'موضعًا واحدًا'} في النص · <span id="hN">٠</span>/${ARN(need)}</div></div>
        <div class="panel hunt"><div class="qt night" id="hText" style="font-size:clamp(23px,6vw,30px);text-align:justify;text-align-last:center">${verseRange(1, NV).map(n => QD.verses[n].map((w, i) => `<span class="w" data-k="${n}:${i}">${esc(w)}</span>`).join(' ') + '\u00a0' + marker(n)).join(' ')}</div></div>
        <div class="feedback" id="hFb"></div>`);
      await pend(res => {
        $('#hText').onclick = e => {
          const w = e.target.closest('.w'); if (!w || w.classList.contains('found')) return;
          const k = w.dataset.k;
          if (h.a.includes(k) && !got.has(k)) {
            got.add(k); found++; hit();
            const [n, i] = k.split(':').map(Number), word = QD.verses[n][i];
            const rs = (QD.tj[k] || []).filter(x => x[2] === h.rule);
            let out = '', p = 0; for (const [a, b] of rs) { out += esc(word.slice(p, a)) + `<span style="color:var(--tn-${h.rule})">${esc(word.slice(a, b))}</span>`; p = b; }
            w.innerHTML = rs.length ? out + esc(word.slice(p)) : `<span style="color:var(--tn-${h.rule})">${esc(word)}</span>`;
            w.classList.add('found'); $('#hN').textContent = ARN(got.size);
            if (got.size >= need) { $('#hFb').className = 'feedback good'; $('#hFb').textContent = h.tip; setTimeout(() => res(true), 1900); }
          } else { mistakes++; miss(); w.classList.remove('miss'); void w.offsetWidth; w.classList.add('miss'); }
        };
      });
    }
    const total = hs.reduce((a, h) => a + Math.min(h.a.length, 3), 0);
    const pct = Math.round(100 * clamp(1 - mistakes / Math.max(1, total)));
    if (mistakes === 0) award('hunter');
    S.best.hunter = Math.max(S.best.hunter || 0, pct); save(); gain(25);
    await celebrate({ title: mistakes ? `${ARN(pct)}٪ دقة` : 'صيدٌ بلا خطأ!', sub: `اكتشفت ${ARN(found)} موضعًا · أخطاء: ${ARN(mistakes)}`, stars: mistakes === 0 ? 3 : mistakes <= 3 ? 2 : 1, gemReward: false, again: again('hunter') });
  },
  async memory() {
    const W = (n, a, b) => QD.verses[n].slice(a, b).map((_, k) => wordHTML(n, a + k)).join(' ');
    const pairs = [
      [`<div class="qt night">${W(6, 2, 4)}</div>`, `<div class="qt night">${W(9, 0, 4)}</div>`],
      [`<div class="qt night">${W(7, 1, 3)}</div>`, `<div class="qt night">${W(10, 0, 4)}</div>`],
      [`<div class="qt night">${W(8, 1, 3)}</div>`, `<div class="qt night">${W(11, 0, 4)}</div>`],
      [sy('sun'), `<div class="qt night">${W(1, 0, 1)}</div>`],
      [sy('moon'), `<div class="qt night">${W(2, 0, 3)}</div>`],
      [sy('gift'), `<div class="qt night">${W(5, 0, 2)}</div>`],
    ];
    const cards = shuffle(pairs.flatMap((p, i) => [{ i, h: p[0] }, { i, h: p[1] }]));
    let moves = 0, open = [], matched = 0, lock = false;
    setProg(0, pairs.length);
    html(Run.body, `${stepHead('ذاكرة المرآة', 'اقلب بطاقتين: نعمةٌ ووصيتها، أو رمزٌ وآيته')}
      <div class="memgrid" id="mg">${cards.map((c, k) => `<button class="mem" data-k="${k}" aria-label="بطاقة ${ARN(k + 1)}"><div><span class="f"><b>ض</b></span><span class="b">${c.h}</span></div></button>`).join('')}</div>
      <div class="row" style="justify-content:center"><span class="dim">النقلات: <b id="mMv">٠</b></span></div>`);
    await pend(res => {
      $('#mg').onclick = e => {
        const b = e.target.closest('.mem'); if (!b || lock || b.classList.contains('flip') || b.classList.contains('done')) return;
        b.classList.add('flip'); open.push(b); Sfx.tap();
        if (open.length === 2) {
          moves++; $('#mMv').textContent = ARN(moves);
          const [x, y] = open, cx = cards[+x.dataset.k], cy = cards[+y.dataset.k];
          if (cx.i === cy.i) { x.classList.add('done'); y.classList.add('done'); open = []; matched++; hit(); setProg(matched, pairs.length); if (matched === pairs.length) setTimeout(() => res(true), 700); }
          else { lock = true; miss(); setTimeout(() => { x.classList.remove('flip'); y.classList.remove('flip'); open = []; lock = false; }, 950); }
        }
      };
    });
    award('memory');
    if (S.best.memoryMoves == null || moves < S.best.memoryMoves) S.best.memoryMoves = moves;
    save(); gain(25);
    await celebrate({ title: `${ARN(moves)} نقلة`, sub: 'كل نعمة تقابلها وصية: يتيمًا فآوى ↔ فلا تقهر…', stars: moves <= 9 ? 3 : moves <= 13 ? 2 : 1, gemReward: false, again: again('memory') });
  },
  async audio() {
    const freq = {}; verseRange(1, NV).forEach(n => new Set(QD.verses[n]).forEach(w => { freq[w] = (freq[w] || 0) + 1; }));
    const cands = []; verseRange(1, NV).forEach(n => QD.verses[n].forEach((w, i) => { if (freq[w] === 1 && w.replace(/[ً-ٰٕ]/g, '').length >= 3) cands.push([n, i]); }));
    const rounds = shuffle(cands).slice(0, 8);
    html(Run.body, `${stepHead('سمعتُها أين؟', 'ستسمع كلمة واحدة بصوت القارئ، فاختر الآية التي فيها')}<div class="panel" style="text-align:center"><div class="recall-sym">${ic('headphones')}</div></div><button class="btn btn-sun btn-wide" id="aGo">${ic('play')} ابدأ</button>`);
    await pend(res => { $('#aGo').onclick = () => { playWord(rounds[0][0], rounds[0][1]); res(true); }; });
    let good = 0;
    for (let r = 0; r < rounds.length; r++) {
      setProg(r, rounds.length);
      const [n, i] = rounds[r];
      const others = shuffle(verseRange(1, NV).filter(x => x !== n)).slice(0, 3);
      const opts = shuffle([n, ...others]);
      const p = mcq({ head: stepHead('سمعتُها أين؟', `${ARN(r + 1)} من ${ARN(rounds.length)}`), prompt: `<div class="row" style="justify-content:center"><button class="btn btn-line" id="aRe">${ic('sound')} أعد الاستماع</button></div>`, opts: opts.map(x => verseHTML(x, { marker: false })), ok: opts.indexOf(n) });
      $('#aRe').onclick = () => playWord(n, i);
      if (r > 0) playWord(n, i);
      if (await p) good++;
      stopAll();
    }
    S.best.audio = Math.max(S.best.audio || 0, good); save(); gain(20);
    await celebrate({ title: `${ARN(good)} من ${ARN(rounds.length)}`, sub: 'أذنك تحفظ أكثر مما تظن', stars: good >= 7 ? 3 : good >= 5 ? 2 : 1, gemReward: false, again: again('audio') });
  },
  async tablet() {
    const r = await stepTablet(verseRange(1, NV), 'امسح اللوح');
    if (r.peeks <= 3) award('tablet');
    gain(30);
    await celebrate({ title: r.peeks ? `مسحت اللوح بـ${ARN(r.peeks)} لمحات` : 'مسحت اللوح دون أي لمحة!', sub: 'هكذا يحفظ طلاب المحاظر: يكتبون ويكررون ثم يمحون', stars: r.peeks === 0 ? 3 : r.peeks <= 3 ? 2 : 1, again: again('tablet') });
  },
  async letters() {
    const ns = shuffle(verseRange(2, NV)).slice(0, 8);
    let good = 0;
    for (let i = 0; i < ns.length; i++) {
      setProg(i, ns.length);
      const n = ns[i], uniq = shuffle([n, ...shuffle(verseRange(1, NV).filter(x => x !== n)).slice(0, 3)]);
      if (await mcq({ head: stepHead('أوائل الحروف', `${ARN(i + 1)} من ${ARN(ns.length)} · أي آية تبدأ كلماتها بهذه الحروف؟`), prompt: `<div class="panel" style="text-align:center"><div style="font:700 clamp(30px,9vw,46px)/1.6 var(--f-ui);letter-spacing:.35em;color:var(--sun-2)">${esc(lettersOf(n))}</div></div>`, opts: uniq.map(x => verseHTML(x, { marker: false })), ok: uniq.indexOf(n) })) good++;
    }
    S.best.letters = Math.max(S.best.letters || 0, good); save(); gain(20);
    await celebrate({ title: `${ARN(good)} من ${ARN(ns.length)}`, sub: 'أوائل الحروف مفاتيح الذاكرة', stars: good >= 7 ? 3 : good >= 5 ? 2 : 1, gemReward: false, again: again('letters') });
  },
  async symbol() {
    const ns = shuffle(verseRange(1, NV)).slice(0, 8);
    let good = 0;
    for (let i = 0; i < ns.length; i++) {
      setProg(i, ns.length);
      const n = ns[i], others = shuffle(verseRange(1, NV).filter(x => x !== n)).slice(0, 3), opts = shuffle([n, ...others]);
      const head = stepHead('الرمز والآية', `${ARN(i + 1)} من ${ARN(ns.length)}`);
      const ok = i % 2 === 0
        ? await mcq({ head, prompt: `<div class="panel" style="display:grid;justify-items:center;gap:8px"><div class="recall-sym">${sy(VERSES[n].sym)}</div><b style="font:700 22px var(--f-display);color:var(--sun-2)">${VERSES[n].symName}</b><span class="dim">أي آية يرمز إليها؟</span></div>`, opts: opts.map(x => verseHTML(x, { marker: false })), ok: opts.indexOf(n) })
        : await mcq({ head, prompt: `<div class="panel"><div class="qt night qbig">${verseHTML(n)}</div><p class="dim" style="text-align:center">اختر رمز هذه الآية</p></div>`, opts: opts.map(x => `<span style="display:inline-flex;align-items:center;gap:10px;justify-content:center">${sy(VERSES[x].sym)}<span>${VERSES[x].symName}</span></span>`), ok: opts.indexOf(n), ui: true, two: true });
      if (ok) good++;
    }
    S.best.symbol = Math.max(S.best.symbol || 0, good); save(); gain(20);
    await celebrate({ title: `${ARN(good)} من ${ARN(ns.length)}`, sub: 'الرموز تحمل الآيات في ذاكرتك', stars: good >= 7 ? 3 : good >= 5 ? 2 : 1, gemReward: false, again: again('symbol') });
  },
  async similar() {
    const qs = shuffle(SIMILAR);
    let good = 0;
    for (let i = 0; i < qs.length; i++) {
      setProg(i, qs.length);
      const q = qs[i], opts = shuffle([q.a, ...q.o]), isQ = /[ً-ْ]/.test(q.a);
      if (await mcq({ head: stepHead('تحدي المتشابهات', `${ARN(i + 1)} من ${ARN(qs.length)}`), prompt: `<div class="panel" style="text-align:center;font-size:19px;line-height:2">${qfmt(q.q)}</div>`, opts: opts.map(o => esc(o)), ok: opts.indexOf(q.a), ui: !isQ, explain: q.tip, two: !isQ })) good++;
    }
    if (good === qs.length) award('similar');
    S.best.similar = Math.max(S.best.similar || 0, good); save(); gain(25);
    await celebrate({ title: `${ARN(good)} من ${ARN(qs.length)}`, sub: 'من يفرّق المتشابه لا يخلط بين السور', stars: good >= 9 ? 3 : good >= 6 ? 2 : 1, gemReward: false, again: again('similar') });
  },
  async recall() {
    const r = await stepRecall(verseRange(1, NV), 'سمّع لنفسك');
    S.best.recall = Math.max(S.best.recall || 0, r.good); save(); gain(20);
    await celebrate({ title: `${ARN(r.good)} من ١١`, sub: 'الاسترجاع النشط أقوى من إعادة القراءة', stars: r.good >= 10 ? 3 : r.good >= 7 ? 2 : 1, again: again('recall') });
  },
};

/* ---------- memory palace ---------- */
function runPalace() {
  openRunner('قصر الذاكرة');
  (async () => {
    const places = (S.palace && S.palace.length === NV) ? S.palace : PALACE_DEFAULT;
    html(Run.body, `${stepHead('قصر الذاكرة', 'ضع كل آية في مكان من بيتك. تخيّل رمزها هناك بوضوح')}
      <div class="panel" style="display:grid;gap:10px">${verseRange(1, NV).map(n => `<label class="field" style="grid-template-columns:auto 1fr;align-items:center;gap:10px"><span class="row" style="gap:6px;color:var(--sun-2)">${sy(VERSES[n].sym)}<b style="color:var(--ink)">${ARN(n)}</b></span><input type="text" id="pl${n}" value="${esc(places[n - 1])}" aria-label="مكان الآية ${n}"></label>`).join('')}</div>
      <button class="btn btn-sun btn-wide" id="pGo">${ic('palace')} ابدأ الجولة</button>`);
    $$('.sym', Run.body).forEach(s => { s.style.width = '26px'; s.style.height = '26px'; });
    await until($('#pGo'));
    S.palace = verseRange(1, NV).map(n => ($('#pl' + n).value || PALACE_DEFAULT[n - 1]).trim()); save();
    for (let n = 1; n <= NV; n++) {
      setProg(n - 1, NV);
      const v = VERSES[n];
      html(Run.body, `${stepHead(S.palace[n - 1], `المحطة ${ARN(n)} من ${ARN(NV)} في بيتك`)}
        <div class="panel" style="display:grid;gap:10px;justify-items:center;text-align:center"><div class="recall-sym">${sy(v.sym)}</div><p>تخيّل <b style="color:var(--sun-2)">${v.symName}</b> عند «${esc(S.palace[n - 1])}». ما الآية؟</p><div class="qt night qbig" id="pT" style="min-height:2em"></div></div>
        <button class="btn btn-sun btn-wide" id="pShow">${ic('eye')} أظهر الآية</button>`);
      await until($('#pShow'));
      $('#pT').innerHTML = verseHTML(n); playSeq([n]);
      $('#pShow').innerHTML = n < NV ? 'المكان التالي' : 'أنهيت الجولة';
      await until($('#pShow'));
      stopAll(); gain(4);
    }
    award('palace');
    await celebrate({ title: 'تجوّلت في قصرك', sub: 'كرّر الجولة في خيالك قبل النوم: المكان يستدعي الآية', again: () => runPalace() });
  })().catch(e => { if (e !== CLOSED) console.error(e); });
}

/* ---------- story of the symbols ---------- */
function runStory() {
  openRunner('قصة السورة');
  (async () => {
    for (let n = 1; n <= NV; n++) {
      setProg(n - 1, NV);
      const v = VERSES[n];
      html(Run.body, `${stepHead('قصة السورة', `${ARN(n)} من ${ARN(NV)}`)}
        <div class="panel" style="display:grid;gap:12px;justify-items:center;text-align:center"><div class="recall-sym">${sy(v.sym)}</div><p style="font-size:18px;line-height:1.9">${v.story}</p><div class="qt night qbig">${verseHTML(n)}</div></div>
        <button class="btn btn-sun btn-wide" id="sGo">${n < NV ? 'تابع القصة' : 'النهاية'}</button>`);
      Sfx.init(); playSeq([n]);
      await until($('#sGo'));
      stopAll();
    }
    gain(15);
    await celebrate({ title: 'احفظ القصة… تحفظ الترتيب', sub: 'شمس، ليل، قنديل، طريق، هدايا، مأوى، نجم، نخلة، فسيلة، باب، نور', gemReward: false });
  })().catch(e => { if (e !== CLOSED) console.error(e); });
}
