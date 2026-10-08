/* =====================================================================================
   5.0 · new games: «غرفة الهروب», «القافلة», «شو الآية؟», «حروف تتلاقى», «الكلمات المتقاطعة».
   Words of the Quran are built, lit, collected under lanterns and spelled — never walked on, broken or hit.
   ===================================================================================== */
const g2w = (n, w) => QD.verses[n][w];
const bareOf = w => wdNorm(w).join('');
const memOr = (k = 3) => { const m = memorizedVerses(); return m.length >= k ? m : verseRange(1, NV); };

/* ---------- 14 · «غرفة الهروب»: three puzzles, three digits, one door ---------- */
const ER = { L: null };
function openEscape() {
  const pool = shuffle(verseRange(2, 9));
  const [nL, nC, nW] = [pool.find(n => QD.verses[n].length >= 3 && QD.verses[n].length <= 5) || 3, ...pool.filter(n => true)].filter((x, i, a) => a.indexOf(x) === i).slice(0, 3);
  const g = ER.g = { t0: Date.now(), left: 300, solved: {}, digits: { lantern: nL, chest: nC, window: nW }, hints: 0, done: false };
  const L = ER.L = Gx.open('erv', 'غرفة الهروب', 'key');
  L.onClose = () => { clearInterval(g.iv); ER.L = null; };
  const draw = () => {
    const s = g.solved, lit = !!s.lantern;
    html(L.body, `<div class="erw ${lit ? 'lit' : ''} ${g.done ? 'out' : ''}">
      <div class="erbar"><span class="ertime" id="erT">${fmtTime(g.left)}</span><span class="grow"></span><span class="erinv">${['lantern', 'chest', 'window'].map(k => `<b class="${s[k] ? 'on' : ''}"><i>${ic(k === 'window' ? 'moon' : k)}</i>${s[k] ? ARN(g.digits[k]) : '؟'}</b>`).join('')}</span></div>
      <div class="erroom">
        <button class="erobj ernight ${s.window ? 'open' : ''}" data-o="window" aria-label="النافذة"><span class="erwin"><i></i></span><em>${s.window ? ic('check') : ic('lock')}</em><small>النافذة</small></button>
        <button class="erobj erlamp ${s.lantern ? 'on' : ''}" data-o="lantern" aria-label="الفانوس">${ic('lantern')}<em>${s.lantern ? ic('check') : ic('lock')}</em><small>الفانوس</small></button>
        <button class="erobj erchest ${s.chest ? 'open' : ''}" data-o="chest" aria-label="الصندوق">${ic('chest')}<em>${s.chest ? ic('check') : ic('lock')}</em><small>الصندوق</small></button>
        <button class="erobj erdoor ${g.done ? 'open' : ''}" data-o="door" aria-label="الباب"><svg class="erdsvg" viewBox="0 0 60 90" aria-hidden="true"><path d="M6 88V30a24 24 0 0 1 48 0v58z" fill="none" stroke="currentColor" stroke-width="3"/><path d="M30 8v80M6 52h48" stroke="currentColor" stroke-width="2" opacity=".5"/><circle cx="40" cy="56" r="3" fill="currentColor"/></svg><em>${ic('key')}</em><small>الباب</small></button>
      </div>
      <p class="dim ertip">${g.done ? '' : 'كل قفلٍ يُفتح يعطيك رقمًا في خانته فوق. الأرقام الثلاثة بترتيب الخانات من اليمين (الفانوس، الصندوق، النافذة) هي رمز الباب.'}</p>
      <div id="erP"></div>
    </div>`);
  };
  g.iv = setInterval(() => { if (g.done || !ER.L) return; g.left = Math.max(0, 300 - Math.round((Date.now() - g.t0) / 1000) - g.hints * 30); const t = $('#erT', L.body); if (t) t.textContent = fmtTime(g.left); if (!g.left) { clearInterval(g.iv); erLose(); } }, 500);
  draw();
  L.body.onclick = e => {
    const o = e.target.closest('[data-o]'); if (!o || g.done) return;
    const k = o.dataset.o; Sfx.tap();
    if (k === 'door') return erDoor(draw);
    if (g.solved[k]) { toast(`رقم ${({ lantern: 'الفانوس', chest: 'الصندوق', window: 'النافذة' })[k]}: ${ARN(g.digits[k])}`, 'key'); return; }
    erPuzzle(k, draw);
  };
}
function erPuzzle(k, redraw) {
  const g = ER.g, n = g.digits[k], P = $('#erP', ER.L.body);
  const solve = () => { g.solved[k] = true; Sfx.ok(); fxBurst(); buzz([20, 40, 20]); addXP(10); playSeq([n]); redraw(); toast(`انفتح! الرقم: ${ARN(n)}`, 'key'); };
  if (k === 'lantern') {
    /* build the verse: tap its words in order */
    const words = QD.verses[n].map((w, i) => ({ w, i })), tiles = shuffle(words); let pos = 0;
    html(P, `<div class="card erpz"><h3>${ic('lantern')} الفانوس: ركّب الآية لتضيء الغرفة</h3><div class="answer qt night" id="erA"></div><div class="tiles">${tiles.map((t, j) => `<button class="tile qt night" data-j="${j}">${esc(t.w)}</button>`).join('')}</div><button class="chip" id="erH">${ic('bulb')} تلميح (−٣٠ ثانية)</button></div>`);
    P.onclick = e => {
      if (e.target.closest('#erH')) { g.hints++; playSeq([n]); return; }
      const b = e.target.closest('.tile'); if (!b || b.classList.contains('used')) return;
      const t = tiles[+b.dataset.j];
      if (t.i === pos) { b.classList.add('used'); $('#erA', P).insertAdjacentHTML('beforeend', `<span class="w">${wordHTML(n, t.i)}</span> `); pos++; playWord(n, t.i); if (pos === words.length) setTimeout(solve, 700); }
      else { b.classList.remove('wrong'); void b.offsetWidth; b.classList.add('wrong'); buzz(20); }
    };
  } else if (k === 'chest') {
    const q = missingQ(n), words = q.opts.map(x => esc(x)); g.qk = q.ok;
    html(P, `<div class="card erpz"><h3>${ic('chest')} الصندوق: أكمل الآية ليُفتح</h3><div class="qt night qbig">${blankVerse(q.n, q.w)}</div><div class="opts two">${words.map((w, i) => `<button class="opt qt night" data-i="${i}">${w}</button>`).join('')}</div><button class="chip" id="erH">${ic('bulb')} تلميح (−٣٠ ثانية)</button></div>`);
    P.onclick = e => {
      if (e.target.closest('#erH')) { g.hints++; playSeq([n]); return; }
      const b = e.target.closest('.opt'); if (!b) return;
      if (+b.dataset.i === q.ok) { b.classList.add('right'); setTimeout(solve, 500); } else { b.classList.add('wrong'); buzz(20); }
    };
  } else {
    /* the window: which verse comes after this one? */
    const prev = n - 1, opts = shuffle([n, ...shuffle(verseRange(1, NV).filter(x => x !== n && x !== prev)).slice(0, 2)]);
    html(P, `<div class="card erpz"><h3>${ic('moon')} النافذة: ما الآية التي تلي؟</h3><div class="qt night qbig">${verseHTML(prev)}</div><div class="opts">${opts.map(x => `<button class="opt qt night" data-n="${x}">${verseHTML(x, { marker: false })}</button>`).join('')}</div><button class="chip" id="erH">${ic('bulb')} تلميح (−٣٠ ثانية)</button></div>`);
    P.onclick = e => {
      if (e.target.closest('#erH')) { g.hints++; playSeq([prev, n]); return; }
      const b = e.target.closest('.opt'); if (!b) return;
      if (+b.dataset.n === n) { b.classList.add('right'); setTimeout(solve, 500); } else { b.classList.add('wrong'); buzz(20); }
    };
  }
  P.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}
function erDoor(redraw) {
  const g = ER.g, P = $('#erP', ER.L.body); let code = '';
  html(P, `<div class="card erpz"><h3>${sy('door', 'erdi')} رمز الباب</h3><div class="erkey" id="erK">${'<b></b>'.repeat(3)}</div>
    <div class="erpad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => `<button data-d="${d}">${ARN(d)}</button>`).join('')}<button data-d="x">⌫</button></div></div>`);
  P.onclick = e => {
    const b = e.target.closest('[data-d]'); if (!b) return; buzz(6); Sfx.tap();
    if (b.dataset.d === 'x') code = code.slice(0, -1); else if (code.length < 3) code += b.dataset.d;
    $$('#erK b', P).forEach((x, i) => { x.textContent = code[i] ? ARN(code[i]) : ''; });
    if (code.length === 3) {
      const want = `${g.digits.lantern}${g.digits.chest}${g.digits.window}`;
      if (code === want) { g.done = true; clearInterval(g.iv); redraw(); erWin(); }
      else { const k = $('#erK', P); k.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'translateX(0)' }], { duration: 320 }); buzz([40, 30, 40]); code = ''; setTimeout(() => $$('#erK b', P).forEach(x => x.textContent = ''), 350); if (Object.keys(g.solved).length < 3) toast('افتح الأقفال الثلاثة أولًا لتعرف الأرقام', 'lock'); }
    }
  };
}
function erWin() {
  const g = ER.g, secs = 300 - g.left, stars = g.left >= 150 ? 3 : g.left >= 60 ? 2 : 1;
  S.best.escape = S.best.escape == null ? secs : Math.min(S.best.escape, secs); award('escape'); addXP(30 + stars * 10); save();
  Sfx.win(); buzz([30, 60, 30, 60, 90]); if (S.settings.nature !== false && typeof Amb !== 'undefined') Amb.set('dawn', .2);
  html($('#erP', ER.L.body), `<div class="card erend"><div class="sunrise" aria-hidden="true"></div><h2>خرجت إلى الضحى!</h2><p class="muted">في ${fmtTime(secs)} · ${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</p><button class="btn btn-sun btn-wide" id="erAgain">${ic('repeat')} غرفةٌ جديدة</button></div>`);
  $('#erAgain', ER.L.body).onclick = () => { Gx.close(ER.L); openEscape(); };
}
function erLose() {
  if (!ER.L) return;
  html($('#erP', ER.L.body), `<div class="card erend"><h3>انتهى الوقت</h3><p class="muted">الرمز كان ${ARN(ER.g.digits.lantern)}${ARN(ER.g.digits.chest)}${ARN(ER.g.digits.window)}. كل محاولة تقرّبك من الآيات.</p><button class="btn btn-sun btn-wide" id="erAgain">${ic('repeat')} حاول مرة أخرى</button></div>`);
  $('#erAgain', ER.L.body).onclick = () => { Gx.close(ER.L); openEscape(); };
}

/* ---------- 15 · «القافلة»: the caravan walks beneath lanterns; move to the lantern of the next word ---------- */
const CV = { L: null };
function openCaravan() {
  const L = CV.L = Gx.open('cvv', 'القافلة', 'camel');
  const vs = memOr(3);
  const g = CV.g = { vs: [...vs].sort((a, b) => a - b).slice(0, 6), vi: 0, wi: 0, lane: 1, x: 1, lives: 3, speed: .3, z: [], t: 0, got: 0, miss: 0, state: 'intro', last: performance.now() };
  html(L.body, `<div class="cvw"><canvas id="cvCv"></canvas><div class="w3top"><div class="w3verse" id="cvV"></div></div><div class="cvhud"><span id="cvL">${'💧'.repeat(3)}</span></div>
    <div class="w3setup" id="cvS"><div class="card"><h3>${ic('camel')} القافلة</h3><p class="muted">قافلةٌ تسير في الصحراء عند الغروب، وفوق طريقها فوانيس معلّقة على كلٍّ منها كلمة. انتقل يمينًا أو يسارًا لتمرّ القافلة تحت فانوس <b>الكلمة التالية</b> من الآية، فيُضاء ويتلوها القارئ.</p><button class="btn btn-sun btn-wide" id="cvGo">${ic('play')} انطلق</button><p class="dim stsmall">المس يمين الشاشة أو يسارها، أو اسحب، أو استعمل الأسهم.</p></div></div></div>`);
  const cv = $('#cvCv', L.body), ctx = cv.getContext('2d');
  L.onClose = () => { cancelAnimationFrame(g.raf); CV.L = null; document.removeEventListener('keydown', key); };
  const key = e => { if (e.key === 'ArrowRight') move(-1); if (e.key === 'ArrowLeft') move(1); };
  const move = d => { if (g.state !== 'run') return; g.lane = clamp(g.lane + d, 0, 2); Sfx.tap(); };   // lanes: 0 right · 1 middle · 2 left
  document.addEventListener('keydown', key);
  let sx = null;
  cv.onpointerdown = e => { sx = e.clientX; };
  cv.onpointerup = e => { if (sx == null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 30) move(dx > 0 ? -1 : 1); else { const r = cv.getBoundingClientRect(); move(e.clientX - r.left > r.width / 2 ? -1 : 1); } };
  $('#cvGo', L.body).onclick = () => { $('#cvS', L.body).hidden = true; Sfx.init(); g.state = 'run'; cvWave(); cvVerse(); };
  const loop = now => { if (!CV.L) return; const dt = Math.min(.05, (now - g.last) / 1000); g.last = now; cvStep(dt); cvDraw(ctx, cv); g.raf = requestAnimationFrame(loop); };
  g.raf = requestAnimationFrame(loop);
}
function cvVerse() {
  const g = CV.g, b = CV.L && $('#cvV', CV.L.body); if (!b) return; const n = g.vs[g.vi];
  b.innerHTML = `<span class="w3n">${ARN(n)}</span>${QD.verses[n].map((w, i) => `<span class="${i < g.wi ? 'got' : i === g.wi ? 'next' : ''}">${i < g.wi ? esc(w) : '<i></i>'}</span>`).join(' ')}`;
}
function cvWave() {
  const g = CV.g, n = g.vs[g.vi], right = g2w(n, g.wi);
  const pool = shuffle(verseRange(1, NV).flatMap(x => QD.verses[x]).filter(w => w !== right));
  const lane = Math.random() * 3 | 0, words = [0, 1, 2].map(l => l === lane ? right : pool.pop());
  g.z.push({ z: 1, words, ok: lane, done: false });
}
function cvStep(dt) {
  const g = CV.g; if (g.state !== 'run') { g.x += (g.lane - g.x) * Math.min(1, dt * 10); return; }
  g.t += dt; g.x += (g.lane - g.x) * Math.min(1, dt * 10);
  for (const w of g.z) {
    w.z -= dt * g.speed;
    if (!w.done && w.z <= .06) {
      w.done = true; const n = g.vs[g.vi];
      if (g.lane === w.ok) { g.got++; w.hit = performance.now(); playWord(n, g.wi); g.wi++; noteAnswer(true); Sfx.drop(); buzz(10); if (g.wi >= QD.verses[n].length) { g.state = 'verse'; cvVerse(); setTimeout(() => cvNextVerse(), 700); } else { cvVerse(); setTimeout(() => CV.L && g.state === 'run' && cvWave(), 260); } }
      else { g.miss++; g.lives--; w.bad = performance.now(); noteAnswer(false); buzz([30, 40, 30]); const l = $('#cvL', CV.L.body); if (l) l.textContent = '💧'.repeat(Math.max(0, g.lives)); if (g.lives <= 0) cvEnd(false); else setTimeout(() => CV.L && g.state === 'run' && cvWave(), 260); }
    }
  }
  g.z = g.z.filter(w => w.z > -.12);
}
function cvNextVerse() {
  const g = CV.g; if (!CV.L) return;
  playSeq([g.vs[g.vi]]).then(() => {
    if (!CV.L) return; g.vi++; g.wi = 0; g.speed = Math.min(.55, g.speed + .04);
    if (g.vi >= g.vs.length) return cvEnd(true);
    g.state = 'run'; cvVerse(); cvWave();
  });
}
function cvEnd(win) {
  const g = CV.g; g.state = 'end'; if (!CV.L) return;
  const verses = g.vi; S.best.caravan = Math.max(S.best.caravan || 0, verses); if (win) award('caravan'); addXP(10 + g.got * 2); save();
  const s = $('#cvS', CV.L.body); s.hidden = false;
  s.innerHTML = `<div class="card"><h3>${win ? 'وصلت القافلة إلى الواحة!' : 'نفد الماء…'}</h3><p class="muted">${cnt(verses, ['آية واحدة', 'آيتان', 'آيات', 'آية'])} · ${ARN(g.got)} كلمة تحت فوانيسها</p><button class="btn btn-sun btn-wide" id="cvAgain">${ic('repeat')} مرة أخرى</button></div>`;
  $('#cvAgain', CV.L.body).onclick = () => { Gx.close(CV.L); openCaravan(); };
  if (win) { Sfx.win(); fxBurst(innerWidth / 2, innerHeight / 2, '#ffd27a'); }
}
function cvDraw(ctx, cv) {
  const g = CV.g, dpr = devicePixelRatio || 1, W = cv.clientWidth, H = cv.clientHeight;
  if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const hz = H * .38, vx = W / 2;
  const sky = ctx.createLinearGradient(0, 0, 0, hz); sky.addColorStop(0, '#1b1f5a'); sky.addColorStop(.6, '#a8546a'); sky.addColorStop(1, '#f2a65a');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, hz);
  ctx.fillStyle = '#ffd27a'; ctx.globalAlpha = .9; ctx.beginPath(); ctx.arc(W * .28, hz - 6, 26, Math.PI, 0); ctx.fill(); ctx.globalAlpha = 1;
  const sand = ctx.createLinearGradient(0, hz, 0, H); sand.addColorStop(0, '#8a5a3a'); sand.addColorStop(1, '#3a2418');
  ctx.fillStyle = sand; ctx.fillRect(0, hz, W, H - hz);
  ctx.fillStyle = 'rgba(40,22,18,.55)'; ctx.beginPath(); ctx.moveTo(0, hz); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, hz - 10 - 8 * Math.sin(x / 70 + 1)); ctx.lineTo(W, hz); ctx.fill();
  /* the road: three lanes converging to the horizon */
  const laneX = (l, z) => { const p = 1 - z; const half = W * .46 * (.08 + .92 * p); return vx + (1 - l) * half * .66; };
  const zy = z => hz + (H - hz) * Math.pow(1 - z, 1.6);
  ctx.strokeStyle = 'rgba(255,220,170,.25)'; ctx.lineWidth = 2;
  for (const b of [-.5, .5, 1.5, 2.5]) { ctx.beginPath(); for (let z = 1; z >= 0; z -= .05) { const x = laneX(b, z), y = zy(z); z === 1 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); }
  /* lanterns: hanging on posts above each lane, the word on the lantern (never on the ground) */
  const t = performance.now() / 1000;
  for (const w of [...g.z].sort((a, b) => b.z - a.z)) {
    const p = clamp(1 - w.z, 0, 1.2), s = .25 + p * .9, y0 = zy(Math.max(0, w.z));
    for (let l = 0; l < 3; l++) {
      const x = laneX(l, Math.max(0, w.z)), top = y0 - 150 * s;
      ctx.strokeStyle = 'rgba(30,18,10,.8)'; ctx.lineWidth = 3 * s; ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, top - 30 * s); ctx.lineTo(x + 22 * s, top - 30 * s); ctx.stroke();
      const lit = w.hit && l === w.ok, badL = w.bad && l === g.lane;
      const glow = ctx.createRadialGradient(x + 22 * s, top, 2, x + 22 * s, top, 60 * s);
      glow.addColorStop(0, lit ? 'rgba(255,230,140,.95)' : badL ? 'rgba(255,110,110,.6)' : 'rgba(255,200,110,.5)'); glow.addColorStop(1, 'rgba(255,200,110,0)');
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x + 22 * s, top, 60 * s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = lit ? '#ffe9a8' : '#ffcf7a'; ctx.strokeStyle = '#5a3412'; ctx.lineWidth = 2 * s;
      ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x + 22 * s - 34 * s, top - 18 * s, 68 * s, 40 * s, 10 * s); else ctx.rect(x + 22 * s - 34 * s, top - 18 * s, 68 * s, 40 * s); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#2a1702'; ctx.font = `${Math.round(20 * s)}px "Scheherazade New", serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'rtl';
      ctx.fillText(w.words[l], x + 22 * s, top + 3 * s, 64 * s);
    }
  }
  /* the caravan: a camel in silhouette with a small lantern, walking in its lane */
  const cx = clamp(laneX(g.x, 0), 70, W - 70), cy = H - 22, bob = Math.sin(t * 6) * 2;
  const camel = (x, y, k, a) => {
    ctx.save(); ctx.translate(x, y + bob * k); ctx.scale(k, k); ctx.globalAlpha = a; ctx.fillStyle = '#1d120b'; ctx.strokeStyle = '#1d120b';
    ctx.beginPath(); ctx.moveTo(-34, -32); ctx.quadraticCurveTo(-40, -48, -24, -52); ctx.quadraticCurveTo(-8, -74, 6, -54); ctx.quadraticCurveTo(16, -47, 24, -45);
    ctx.lineTo(34, -62); ctx.quadraticCurveTo(40, -70, 48, -66); ctx.lineTo(53, -60); ctx.lineTo(45, -57); ctx.lineTo(37, -49); ctx.lineTo(31, -35); ctx.lineTo(27, -30); ctx.closePath(); ctx.fill();
    ctx.lineWidth = 5; ctx.lineCap = 'round'; const sw = Math.sin(t * 6) * 4;
    [[-28, sw], [-19, -sw], [17, -sw], [25, sw]].forEach(([lx, d]) => { ctx.beginPath(); ctx.moveTo(lx, -32); ctx.lineTo(lx + d * .5, 0); ctx.stroke(); });
    ctx.restore();
  };
  camel(cx + 52, cy - 10, .78, .55); camel(cx, cy, 1.15, 1);
  const lg = ctx.createRadialGradient(cx - 30, cy - 72, 1, cx - 30, cy - 72, 26); lg.addColorStop(0, 'rgba(255,214,130,.9)'); lg.addColorStop(1, 'rgba(255,214,130,0)'); ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(cx - 30, cy - 72, 26, 0, Math.PI * 2); ctx.fill();
}

/* ---------- 16 · «شو الآية؟»: the phone on your forehead, the family hints at the meaning ---------- */
function openHeadsUp() {
  const L = Gx.open('huv', 'شو الآية؟', 'people');
  html(L.body, `<div class="huw"><div class="card"><h3>${ic('people')} لعبة العيلة</h3><p class="muted">ضع الجوال على جبينك والشاشة نحو أهلك. يرون الآية ومعناها فيلمّحون لك بالمعنى دون أن يقرؤوها، وأنت تسمّعها. أمِل الجوال للأسفل إن أصبت، وللأعلى لتتجاوز.</p>
    <div class="row wrap" style="gap:8px">${[60, 90, 120].map(s => `<button class="btn ${s === 90 ? 'btn-sun' : 'btn-line'}" data-sec="${s}">${ARN(s)} ثانية</button>`).join('')}</div></div></div>`);
  let st = null;
  L.onClose = () => { if (st) { clearInterval(st.iv); window.removeEventListener('deviceorientation', st.or); } };
  L.body.onclick = async e => {
    const b = e.target.closest('[data-sec]'); if (!b) return;
    try { if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) await DeviceOrientationEvent.requestPermission(); } catch (er) { }
    huRun(L, +b.dataset.sec, s => st = s);
  };
}
function huRun(L, secs, keep) {
  const deck = shuffle(memOr(4)), res = []; let i = 0, t0 = 0, lock = false;
  const st = { iv: 0, or: null }; keep(st);
  const show = () => { const n = deck[i % deck.length]; html($('.huw', L.body), `<div class="hucard"><span class="hutime" id="huT">${ARN(secs)}</span><div class="qt huq">${verseHTML(n)}</div><p class="hum">${VERSES[n] && VERSES[n].symName ? esc(VERSES[n].symName) : ''}</p><div class="row hub"><button class="btn btn-line" data-r="0">↷ تجاوز</button><button class="btn btn-good" data-r="1">${ic('check')} أصاب</button></div></div>`); };
  const mark = ok => { if (lock) return; lock = true; res.push([deck[i % deck.length], ok]); buzz(ok ? [20, 30, 20] : 40); ok ? Sfx.ok() : Sfx.tap(); const c = $('.hucard', L.body); if (c) c.classList.add(ok ? 'ok' : 'pass'); setTimeout(() => { i++; lock = false; show(); }, 600); };
  let n = 3; html($('.huw', L.body), `<div class="hucard"><div class="hucount">${ARN(n)}</div><p class="muted">ضع الجوال على جبينك</p></div>`);
  const cd = setInterval(() => { n--; if (n > 0) { $('.hucount', L.body).textContent = ARN(n); buzz(10); return; } clearInterval(cd); t0 = Date.now(); show();
    st.iv = setInterval(() => { const left = secs - Math.floor((Date.now() - t0) / 1000), el = $('#huT', L.body); if (el) el.textContent = ARN(Math.max(0, left)); if (left <= 0) { clearInterval(st.iv); window.removeEventListener('deviceorientation', st.or); huEnd(L, res); } }, 250);
    let base = null;
    st.or = e => { if (e.beta == null) return; const v = Math.abs(e.gamma) > 45 ? e.gamma : e.beta; if (base == null) { base = v; return; } const d = v - base; if (d > 40) { mark(true); base = null; } else if (d < -40) { mark(false); base = null; } };
    window.addEventListener('deviceorientation', st.or);
  }, 900);
  L.body.onclick = e => { const b = e.target.closest('[data-r]'); if (b) mark(b.dataset.r === '1'); };
}
function huEnd(L, res) {
  const ok = res.filter(r => r[1]).length; S.best.headsup = Math.max(S.best.headsup || 0, ok); if (ok >= 5) award('headsup'); addXP(5 + ok * 3); save(); Sfx.win();
  html($('.huw', L.body), `<div class="card"><h3>${cnt(ok, ['آية واحدة', 'آيتان', 'آيات', 'آية'])} من حفظك!</h3><ul class="hulist">${res.map(([n, k]) => `<li class="${k ? 'ok' : ''}">${k ? ic('check') : '↷'} <span class="qt">${esc(QD.verses[n].slice(0, 3).join(' '))}…</span></li>`).join('')}</ul><button class="btn btn-sun btn-wide" data-sec="90">${ic('repeat')} جولة أخرى</button></div>`);
  L.body.onclick = async e => { const b = e.target.closest('[data-sec]'); if (b) huRun(L, +b.dataset.sec, () => { }); };
}

/* ---------- 17 · «حروف تتلاقى»: trace neighbouring letters to spell the surah's words ---------- */
function bgBuild() {
  const N = 5, words = shuffle(WD_WORDS.filter(w => wdNorm(w[0]).length >= 4 && wdNorm(w[0]).length <= 5)).slice(0, 6);
  for (let tries = 0; tries < 200; tries++) {
    const grid = Array(N * N).fill(null), placed = [];
    for (const w of words) {
      if (placed.length >= 4) break;
      const L = wdNorm(w[0]);
      let ok = false;
      for (let a = 0; a < 60 && !ok; a++) {
        let cur = Math.random() * N * N | 0; const path = [cur]; if (grid[cur] && grid[cur] !== L[0]) continue;
        let good = true;
        for (let k = 1; k < L.length; k++) {
          const r = cur / N | 0, c = cur % N, nb = [];
          for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { if (!dr && !dc) continue; const rr = r + dr, cc = c + dc; if (rr < 0 || cc < 0 || rr >= N || cc >= N) continue; const j = rr * N + cc; if (path.includes(j)) continue; if (grid[j] && grid[j] !== L[k]) continue; nb.push(j); }
          if (!nb.length) { good = false; break; }
          cur = nb[Math.random() * nb.length | 0]; path.push(cur);
        }
        if (!good) continue;
        path.forEach((j, k) => grid[j] = L[k]); placed.push({ w, path, L: L.join('') }); ok = true;
      }
    }
    if (placed.length >= 4) {
      const freq = 'الاللمكيونهترفعدبسج'; for (let j = 0; j < grid.length; j++) if (!grid[j]) grid[j] = freq[Math.random() * freq.length | 0];
      return { N, grid, placed };
    }
  }
  return null;
}
function openLetters() {
  const L = Gx.open('bgv', 'حروف تتلاقى', 'grid');
  const B = window.__bg = bgBuild(); if (!B) { toast('حاول مرة أخرى', 'x'); return; }
  const found = new Set(); let path = [], drag = false, hints = 0;
  const draw = () => html(L.body, `<div class="bgw"><p class="muted" style="text-align:center">اسحب إصبعك على حروفٍ متجاورة لتكوّن كلمةً من سورة الضحى. في الشبكة ${cnt(B.placed.length, ['كلمة', 'كلمتان', 'كلمات', 'كلمة'])}.</p>
    <div class="bggrid" id="bgG" style="--n:${B.N}">${B.grid.map((c, j) => `<span class="bgc ${B.placed.some(p => found.has(p.L) && p.path.includes(j)) ? 'found' : ''}" data-j="${j}">${c}</span>`).join('')}</div>
    <div class="bgword" id="bgW"></div>
    <div class="bgfound">${B.placed.map(p => found.has(p.L) ? `<button class="chip on" data-v="${p.w[1]}:${p.w[2]}">${esc(p.w[0])}</button>` : `<span class="chip">${'ـ'.repeat(p.L.length)}</span>`).join('')}</div>
    <div class="row" style="justify-content:center;gap:8px"><button class="chip" id="bgH">${ic('bulb')} تلميح</button></div><div id="bgX"></div></div>`);
  draw();
  const cellAt = e => { const el = document.elementFromPoint(e.clientX, e.clientY); return el && el.closest('.bgc') ? +el.closest('.bgc').dataset.j : null; };
  const adj = (a, b) => Math.abs((a / B.N | 0) - (b / B.N | 0)) <= 1 && Math.abs(a % B.N - b % B.N) <= 1;
  const upd = () => { $$('.bgc', L.body).forEach(c => c.classList.toggle('sel', path.includes(+c.dataset.j))); $('#bgW', L.body).textContent = path.map(j => B.grid[j]).join(''); };
  L.body.onpointerdown = e => { const j = cellAt(e); if (j == null) return; drag = true; path = [j]; upd(); e.target.releasePointerCapture && e.target.releasePointerCapture(e.pointerId); };
  L.body.onpointermove = e => { if (!drag) return; const j = cellAt(e); if (j == null) return; if (path.length > 1 && path[path.length - 2] === j) { path.pop(); upd(); return; } if (!path.includes(j) && adj(path[path.length - 1], j)) { path.push(j); buzz(5); upd(); } };
  L.body.onpointerup = () => {
    if (!drag) return; drag = false;
    const word = path.map(j => B.grid[j]).join(''), p = B.placed.find(x => x.L === word && !found.has(x.L));
    if (p) {
      found.add(p.L); Sfx.ok(); fxBurst(); noteAnswer(true); const [, n, w] = p.w; playWord(n, w);
      draw();
      $('#bgX', L.body).innerHTML = `<div class="card bgcard"><div class="qt night">${tjVerseHTML(n, { hl: [[n, w, 0, QD.verses[n][w].length]] }, { color: '#f7b844' })}</div>${VERSES[n].words && VERSES[n].words[w] ? `<p class="muted">${qfmt(VERSES[n].words[w])}</p>` : ''}</div>`;
      if (found.size === B.placed.length) { award('letters2'); addXP(20); S.best.letters2 = Math.max(S.best.letters2 || 0, 1); save(); Sfx.win(); $('#bgX', L.body).insertAdjacentHTML('beforeend', `<button class="btn btn-sun btn-wide" id="bgNew">${ic('repeat')} شبكةٌ جديدة</button>`); }
    } else if (word.length >= 3) { noteAnswer(false); const w = $('#bgW', L.body); w.classList.add('bad'); setTimeout(() => w.classList.remove('bad'), 400); }
    path = []; upd();
  };
  L.body.onclick = e => {
    if (e.target.closest('#bgNew')) { Gx.close(L); openLetters(); return; }
    if (e.target.closest('#bgH')) { const p = B.placed.find(x => !found.has(x.L)); if (!p) return; hints++; const c = $(`.bgc[data-j="${p.path[0]}"]`, L.body); c.classList.add('hint'); setTimeout(() => c.classList.remove('hint'), 1600); return; }
    const v = e.target.closest('[data-v]'); if (v) { const [n, w] = v.dataset.v.split(':').map(Number); playWord(n, w); }
  };
}

/* ---------- 20 · «الكلمات المتقاطعة»: a calm puzzle, clues from the meanings ---------- */
function cwBuild() {
  const cands = shuffle(WD_WORDS.map(w => ({ w, L: wdNorm(w[0]) })).filter(x => x.L.length >= 3 && x.L.length <= 6));
  for (let tries = 0; tries < 60; tries++) {
    const N = 11, grid = {}, placed = [];
    const put = (x, r, c, dir) => { x.L.forEach((ch, k) => { const rr = r + (dir === 'd' ? k : 0), cc = c - (dir === 'a' ? k : 0); grid[rr + ',' + cc] = ch; }); placed.push({ ...x, r, c, dir }); };
    const can = (x, r, c, dir) => {
      let cross = 0;
      for (let k = 0; k < x.L.length; k++) {
        const rr = r + (dir === 'd' ? k : 0), cc = c - (dir === 'a' ? k : 0); if (rr < 0 || cc < 0 || rr >= N || cc >= N) return -1;
        const g = grid[rr + ',' + cc]; if (g && g !== x.L[k]) return -1; if (g) cross++;
        else { const n1 = dir === 'a' ? [[rr - 1, cc], [rr + 1, cc]] : [[rr, cc - 1], [rr, cc + 1]]; if (n1.some(([a, b]) => grid[a + ',' + b])) return -1; }
      }
      const b0 = dir === 'a' ? [r, c + 1] : [r - 1, c], b1 = dir === 'a' ? [r, c - x.L.length] : [r + x.L.length, c];
      if (grid[b0.join(',')] || grid[b1.join(',')]) return -1;
      return cross;
    };
    const pool = shuffle(cands);
    put(pool[0], 5, 8, 'a');
    for (const x of pool.slice(1)) {
      if (placed.length >= 6 || placed.some(p => p.L.join('') === x.L.join(''))) continue;
      let best = null;
      for (const p of placed) for (let i = 0; i < p.L.length; i++) for (let j = 0; j < x.L.length; j++) {
        if (p.L[i] !== x.L[j]) continue;
        const dir = p.dir === 'a' ? 'd' : 'a', pr = p.r + (p.dir === 'd' ? i : 0), pc = p.c - (p.dir === 'a' ? i : 0);
        const r = dir === 'd' ? pr - j : pr, c = dir === 'a' ? pc + j : pc, k = can(x, r, c, dir);
        if (k > 0 && (!best || k > best.k)) best = { r, c, dir, k };
      }
      if (best) put(x, best.r, best.c, best.dir);
    }
    if (placed.length >= 5) {
      const rs = Object.keys(grid).map(k => +k.split(',')[0]), cs = Object.keys(grid).map(k => +k.split(',')[1]);
      return { grid, placed, r0: Math.min(...rs), r1: Math.max(...rs), c0: Math.min(...cs), c1: Math.max(...cs) };
    }
  }
  return null;
}
function cwClue(p) {
  const [word, n, w] = p.w, mean = VERSES[n].words && VERSES[n].words[w];
  if (mean) return mean.split(':').slice(1).join(':').trim() || mean;
  const prev = w > 0 ? QD.verses[n][w - 1] : null;
  return prev ? `في الآية ${ARN(n)}، بعد «${prev}»` : `أول كلمة في الآية ${ARN(n)}`;
}
function openCrossword() {
  const X = window.__cw = cwBuild(); if (!X) { toast('حاول مرة أخرى', 'x'); return; }
  const L = Gx.open('cwv', 'الكلمات المتقاطعة', 'grid');
  const solved = new Set(); let sel = 0, typed = [];
  X.placed.forEach((p, i) => { p.i = i; p.no = i + 1; });
  const draw = () => {
    const rows = []; for (let r = X.r0; r <= X.r1; r++) { const cells = []; for (let c = X.c1; c >= X.c0; c--) { const ch = X.grid[r + ',' + c]; if (!ch) { cells.push('<span class="cwx"></span>'); continue; } const own = X.placed.filter(p => p.L.some((_, k) => (p.r + (p.dir === 'd' ? k : 0)) === r && (p.c - (p.dir === 'a' ? k : 0)) === c)); const show = own.some(p => solved.has(p.i)), start = X.placed.find(p => p.r === r && p.c === c); cells.push(`<span class="cwc ${own.some(p => p.i === sel) ? 'sel' : ''} ${show ? 'ok' : ''}" data-p="${own[0].i}">${start ? `<sup>${ARN(start.no)}</sup>` : ''}${show ? ch : ''}</span>`); } rows.push(`<div class="cwr">${cells.join('')}</div>`); }
    const p = X.placed[sel];
    html(L.body, `<div class="cww"><div class="cwgrid">${rows.join('')}</div>
      <div class="card cwclue"><span class="eyebrow">${ARN(p.no)} · ${p.dir === 'a' ? 'أفقي' : 'عمودي'} · ${cnt(p.L.length, ['حرف', 'حرفان', 'أحرف', 'حرفًا'])}</span><p>${qfmt(cwClue(p))}</p>
        <div class="cwin">${p.L.map((_, k) => `<b>${solved.has(p.i) ? p.L[k] : typed[k] || ''}</b>`).join('')}</div></div>
      <div class="cwlist">${X.placed.map(q => `<button class="chip ${solved.has(q.i) ? 'on' : ''} ${q.i === sel ? 'cur' : ''}" data-s="${q.i}">${ARN(q.no)}</button>`).join('')}</div>
      ${solved.size < X.placed.length ? `<div class="wdkb">${WD_KEYS.map(r => `<div>${r.map(k => `<button class="wdk ${k === '⏎' || k === '⌫' ? 'wide' : ''}" data-k="${k}">${k === '⏎' ? 'تحقّق' : k}</button>`).join('')}</div>`).join('')}</div>` : `<div class="card" style="text-align:center"><h3>اكتملت الشبكة!</h3><button class="btn btn-sun btn-wide" id="cwNew">${ic('repeat')} شبكةٌ جديدة</button></div>`}</div>`);
  };
  draw();
  L.body.onclick = e => {
    if (e.target.closest('#cwNew')) { Gx.close(L); openCrossword(); return; }
    const s = e.target.closest('[data-s],[data-p]'); if (s) { sel = +(s.dataset.s ?? s.dataset.p); typed = []; draw(); return; }
    const k = e.target.closest('[data-k]'); if (!k || solved.has(sel)) return;
    const p = X.placed[sel], c = k.dataset.k; buzz(5);
    if (c === '⌫') typed.pop(); else if (c === '⏎' || typed.length >= p.L.length) { /* check below */ } else typed.push(c);
    if ((c === '⏎' || typed.length === p.L.length) && typed.length === p.L.length) {
      if (typed.join('') === p.L.join('')) { solved.add(sel); Sfx.ok(); fxBurst(); noteAnswer(true); playWord(p.w[1], p.w[2]); typed = []; const nx = X.placed.find(q => !solved.has(q.i)); if (nx) sel = nx.i; else { award('crossword'); addXP(25); S.best.crossword = (S.best.crossword || 0) + 1; save(); Sfx.win(); } }
      else { noteAnswer(false); buzz([30, 30, 30]); typed = []; toast('ليست هذه. فكّر في المعنى…', 'bulb'); }
    }
    draw();
  };
}

/* ---------- registry ---------- */
Object.assign(V50_ROUTES, { escape: openEscape, caravan: openCaravan, headsup: openHeadsUp, letters2: openLetters, crossword: openCrossword });
GAMES_50.push(
  { id: 'escape', go: 'escape', name: 'غرفة الهروب', d: 'ثلاثة أقفال من السورة، ورمزٌ يفتح باب الضحى في خمس دقائق', ic: 'key', best: () => S.best.escape != null ? fmtTime(S.best.escape) : null },
  { id: 'caravan', go: 'caravan', name: 'القافلة', d: 'سِر بالقافلة تحت فانوس الكلمة التالية حتى الواحة', ic: 'camel', best: () => S.best.caravan ? cnt(S.best.caravan, ['آية', 'آيتان', 'آيات', 'آية']) : null },
  { id: 'letters2', go: 'letters2', name: 'حروف تتلاقى', d: 'اسحب على الحروف المتجاورة لتكوّن كلمات السورة', ic: 'grid', best: () => null },
  { id: 'crossword', go: 'crossword', name: 'الكلمات المتقاطعة', d: 'شبكةٌ هادئة من كلمات الضحى، وتلميحها المعنى', ic: 'grid', best: () => S.best.crossword ? ARN(S.best.crossword) + ' شبكة' : null },
  { id: 'headsup', go: 'headsup', name: 'شو الآية؟', d: 'لعبة العيلة: الجوال على جبينك وهم يلمّحون بالمعنى', ic: 'people', best: () => S.best.headsup ? ARN(S.best.headsup) + ' آيات' : null },
);
