/* =====================================================================================
   5.0 · «أول المئة» (planned 4.4): the daily Duha word, celebrations that pulse, ten reasons the religion
   is beautiful with a deed for today, your Duha prayer counted for you alone, and a backup of your journey.
   ===================================================================================== */

/* ---------- 11 · «كلمة الضحى»: one word a day for everyone, six tries ---------- */
const WD_WORDS = [['الضحى', 1, 0], ['والليل', 2, 0], ['ودعك', 3, 1], ['للآخرة', 4, 0], ['الأولى', 4, 4], ['ولسوف', 5, 0], ['يعطيك', 5, 1], ['فترضى', 5, 3], ['يجدك', 6, 1], ['يتيما', 6, 2], ['فآوى', 6, 3], ['ووجدك', 7, 0], ['ضالا', 7, 1], ['فهدى', 7, 2], ['عائلا', 8, 1], ['فأغنى', 8, 2], ['اليتيم', 9, 1], ['تقهر', 9, 3], ['السائل', 10, 1], ['تنهر', 10, 3], ['بنعمة', 11, 1], ['فحدث', 11, 3]];
const WD_NORM = { 'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ٱ': 'ا', 'ى': 'ي', 'ئ': 'ي', 'ؤ': 'و', 'ة': 'ه' };
const wdNorm = s => [...s].map(c => WD_NORM[c] || c).filter(c => /[ء-ي]/.test(c));
const WD_KEYS = [['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح'], ['ج', 'ش', 'س', 'ي', 'ب', 'ل', 'ا', 'ت', 'ن', 'م'], ['⏎', 'ك', 'ط', 'ذ', 'د', 'ز', 'ر', 'و', 'ظ', '⌫']];
const WD_EPOCH = Date.UTC(2026, 9, 8) / 864e5;   // number 1 = the day 5.0 shipped
function wdToday() {
  const d = Math.floor(keyDate(dayKey()) / 864e5) - Math.floor(new Date(2026, 9, 8) / 864e5), num = d + 1;
  const order = pshuffle(WD_WORDS.map((_, i) => i), prng(9311));
  const [word, n, w] = WD_WORDS[order[((d % order.length) + order.length) % order.length]];
  return { num, word, n, w, key: dayKey(), L: wdNorm(word) };
}
function wdScore(guess, target) {   // standard colouring, repeated letters counted once each
  const res = guess.map(() => 'x'), left = {};
  target.forEach((c, i) => { if (guess[i] === c) res[i] = 'g'; else left[c] = (left[c] || 0) + 1; });
  guess.forEach((c, i) => { if (res[i] !== 'g' && left[c]) { res[i] = 'y'; left[c]--; } });
  return res;
}
function wdSt() { S.wordle = S.wordle || { d: {}, played: 0, wins: 0, streak: 0, best: 0, dist: [0, 0, 0, 0, 0, 0] }; S.wordle.d = S.wordle.d || {}; return S.wordle; }
function openWordle() {
  const T = wdToday(), st = wdSt(), day = st.d[T.key] = st.d[T.key] || { g: [], st: 'play' };
  const L = Gx.open('wdv', `كلمة الضحى ${ARN(T.num)}`, 'grid');
  let cur = [];
  const draw = () => {
    const rows = [];
    for (let r = 0; r < 6; r++) {
      const g = day.g[r], sc = g ? wdScore(g, T.L) : null, letters = g || (r === day.g.length && day.st === 'play' ? cur : []);
      rows.push(`<div class="wdrow ${r === day.g.length && day.st === 'play' ? 'cur' : ''}" style="--n:${T.L.length}">${T.L.map((_, i) => `<span class="wdt ${sc ? 'w' + sc[i] : letters[i] ? 'in' : ''}" style="--d:${i * 90}ms">${letters[i] || ''}</span>`).join('')}</div>`);
    }
    const used = {}; day.g.forEach(g => wdScore(g, T.L).forEach((s, i) => { const c = g[i]; if (used[c] !== 'g') used[c] = s === 'g' ? 'g' : (used[c] === 'y' || s === 'y') ? 'y' : 'x'; }));
    const done = day.st !== 'play', hintN = day.g.length;
    html(L.body, `<div class="wdwrap">
      <p class="dim wdsub">كلمةٌ واحدة من سورة الضحى اليوم، للجميع. لها ${cnt(T.L.length, ['حرف', 'حرفان', 'أحرف', 'حرفًا'])}، ولك ست محاولات.</p>
      <div class="wdgrid">${rows.join('')}</div>
      ${!done && hintN >= 3 ? `<p class="wdhint">${ic('bulb')} تلميح: الكلمة في الآية ${ARN(T.n)}${hintN >= 5 ? `، وأولها «${T.word[0] === 'ا' && T.word[1] === 'ل' ? T.word.slice(0, 3) : T.word[0]}»` : ''}</p>` : ''}
      ${done ? `<div class="card wdres"><span class="eyebrow">${day.st === 'win' ? `وجدتها في ${cnt(day.g.length, ['محاولة', 'محاولتين', 'محاولات', 'محاولة'])}` : 'كلمة اليوم'}</span>
          <div class="qt night wdverse">${tjVerseHTML(T.n, { hl: [[T.n, T.w, 0, QD.verses[T.n][T.w].length]] }, { color: '#f7b844' })}</div>
          ${VERSES[T.n].words && VERSES[T.n].words[T.w] ? `<p class="muted">${qfmt(VERSES[T.n].words[T.w])}</p>` : ''}
          <div class="row wrap" style="gap:8px;margin-top:6px"><button class="btn btn-sun" id="wdShare">${ic('share')} شارك نتيجتك</button><button class="btn btn-line" id="wdHear">${ic('sound')} اسمعها</button></div>
          <div class="wdstats"><span><b>${ARN(st.played)}</b>لعبت</span><span><b>${ARN(st.played ? Math.round(st.wins / st.played * 100) : 0)}٪</b>فوز</span><span><b>${ARN(st.streak)}</b>متتالية</span><span><b>${ARN(st.best)}</b>الأطول</span></div>
          <p class="dim">كلمةٌ جديدة غدًا. النتيجة تُشارَك مربعاتٍ لا تكشف الكلمة.</p></div>`
        : `<div class="wdkb">${WD_KEYS.map(r => `<div>${r.map(k => `<button class="wdk ${used[k] ? 'u' + used[k] : ''} ${k === '⏎' || k === '⌫' ? 'wide' : ''}" data-k="${k}">${k === '⏎' ? 'أدخل' : k === '⌫' ? '⌫' : k}</button>`).join('')}</div>`).join('')}</div>
          <p class="dim wdnote">الألف تشمل أ إ آ، والياء تشمل ى ئ، والهاء تشمل ة.</p>`}
    </div>`);
  };
  const enter = () => {
    if (cur.length !== T.L.length) { toast(`الكلمة ${cnt(T.L.length, ['حرف', 'حرفان', 'أحرف', 'حرفًا'])}`, 'grid'); const r = $('.wdrow.cur', L.body); if (r) r.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 300 }); return; }
    day.g.push(cur); cur = [];
    const win = day.g[day.g.length - 1].join('') === T.L.join('');
    if (win || day.g.length >= 6) {
      day.st = win ? 'win' : 'lose'; st.played++;
      const prev = st.lastDay; st.lastDay = T.key;
      if (win) { st.wins++; st.dist[day.g.length - 1]++; st.streak = prev === addDays(T.key, -1) ? st.streak + 1 : 1; st.best = Math.max(st.best, st.streak); award('wordle'); if (st.streak >= 7) award('wordle7'); addXP(15 + (6 - day.g.length) * 5); Sfx.win(); fxBurst(innerWidth / 2, innerHeight / 3, '#46d39a'); }
      else { st.streak = 0; addXP(5); }
      save(); draw(); setTimeout(() => { if (L.el.isConnected) playWord(T.n, T.w); }, 600); return;
    }
    save(); draw(); Sfx.tap();
  };
  L.body.onclick = e => {
    const k = e.target.closest('[data-k]');
    if (k && day.st === 'play') { const c = k.dataset.k; buzz(5); if (c === '⌫') cur.pop(); else if (c === '⏎') return enter(); else if (cur.length < T.L.length) cur.push(c); draw(); return; }
    if (e.target.closest('#wdHear')) { playWord(T.n, T.w); return; }
    if (e.target.closest('#wdShare')) wdShare(T, day);
  };
  const onKey = e => { if (!L.el.isConnected) return document.removeEventListener('keydown', onKey); if (day.st !== 'play') return; const c = WD_NORM[e.key] || e.key; if (e.key === 'Enter') enter(); else if (e.key === 'Backspace') { cur.pop(); draw(); } else if (/^[ء-ي]$/.test(c) && cur.length < T.L.length) { cur.push(c); draw(); } };
  document.addEventListener('keydown', onKey);
  L.onClose = () => document.removeEventListener('keydown', onKey);
  draw();
}
function wdShare(T, day) {
  const sq = { g: '🟩', y: '🟨', x: '⬛' };
  const txt = `كلمة الضحى ${ARN(T.num)} · ${day.st === 'win' ? ARN(day.g.length) : 'X'}/٦\n` + day.g.map(g => '‏' + wdScore(g, T.L).map(s => sq[s]).join('')).join('\n') + '\nمن تطبيق «رحلة الضحى»';
  award('share');
  if (navigator.share && !window.claude) { navigator.share({ text: txt }).catch(() => { }); return; }
  const sheet = () => openSheet('شارك نتيجتك', `<textarea class="search" style="min-height:140px;border-radius:16px;padding:12px" readonly>${esc(txt)}</textarea>`);
  try { navigator.clipboard.writeText(txt).then(() => toast('نُسخت النتيجة: الصقها لمن تحب', 'copy'), sheet); } catch (e) { sheet(); }
}
function wordleCard() {
  const T = wdToday(), d = wdSt().d[T.key];
  return `<button class="card wdcard" data-go="wordle"><span class="wdmini">${T.L.map((_, i) => `<i class="${d && d.st === 'win' ? 'g' : ''}"></i>`).join('')}</span><span class="grow"><span class="eyebrow">كلمة الضحى ${ARN(T.num)}</span><b>${d && d.st !== 'play' ? (d.st === 'win' ? `وجدتها في ${cnt(d.g.length, ['محاولة', 'محاولتين', 'محاولات', 'محاولة'])}` : 'كلمةٌ جديدة غدًا') : 'كلمةٌ من السورة، ست محاولات'}</b></span>${ic('chev')}</button>`;
}

/* ---------- 32 · celebrations that pulse: light where you touched, a drop or a bird, and the verse that shines ---------- */
const Fx = { x: innerWidth / 2, y: innerHeight / 2, k: 0 };
document.addEventListener('pointerdown', e => { Fx.x = e.clientX; Fx.y = e.clientY; }, true);
function fxBurst(x = Fx.x, y = Fx.y, color = '#ffd27a') {
  if (reduceMotion()) return;
  const el = node(`<div class="fxb" style="left:${x}px;top:${y}px;--c:${color}">${Array.from({ length: 8 }, (_, i) => `<i style="--a:${i * 45}deg"></i>`).join('')}</div>`);
  document.body.appendChild(el); setTimeout(() => el.remove(), 800);
}
/* a water drop and a small bird, made from sound itself (no recordings, no music); never under recitation */
Sfx.drop = function () {
  if (!S.settings.sfx || !this.ctx || !A.paused || Player.state !== 'idle') return;
  const t = this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(1350, t); o.frequency.exponentialRampToValueAtTime(420, t + .13);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.07, t + .008); g.gain.exponentialRampToValueAtTime(.0001, t + .2);
  o.connect(g).connect(this.ctx.destination); o.start(t); o.stop(t + .25);
};
Sfx.bird = function () {
  if (!S.settings.sfx || !this.ctx || !A.paused || Player.state !== 'idle') return;
  const t0 = this.ctx.currentTime;
  [0, .11].forEach((dt, k) => {
    const t = t0 + dt, o = this.ctx.createOscillator(), m = this.ctx.createOscillator(), mg = this.ctx.createGain(), g = this.ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(2600 + k * 380, t); o.frequency.exponentialRampToValueAtTime(3900 + k * 300, t + .07);
    m.frequency.value = 48; mg.gain.value = 140; m.connect(mg).connect(o.frequency);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.035, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + .09);
    o.connect(g).connect(this.ctx.destination); o.start(t); m.start(t); o.stop(t + .12); m.stop(t + .12);
  });
};
const _sfxOk = Sfx.ok;
Sfx.ok = function () { if (Player.state !== 'idle') return; if (S.settings.nature === false) return _sfxOk.call(this); (++Fx.k % 3 ? this.drop() : this.bird()); };
const _hit2 = hit;
hit = function () { _hit2(); fxBurst(); };
/* the verse that is complete shines like the forenoon sun */
function vShine(el) { if (!el || reduceMotion()) return; el.classList.remove('vshine'); void el.offsetWidth; el.classList.add('vshine'); }
/* the seal of a station: a cinematic moment */
function sealMoment(st, stars) {
  return new Promise(res => {
    const n = st.verses[0], img = typeof sceneUrl === 'function' ? posterUrl(sceneOf('v' + n)) : `scenes/v${n}.jpg`;
    const el = node(`<div class="sealm" role="dialog" aria-label="ختم المحطة"><div class="sealbg" style="background-image:url('${img}')"></div><div class="sealdim"></div>
      <div class="sealc"><div class="sealstamp">${ic('star8')}<b>${ARN(st.id)}</b></div><span class="eyebrow">خُتمت المحطة</span><h2>${esc(st.name)}</h2><p>${vsLabel(st.verses)}</p><div class="stars3">${[1, 2, 3].map(i => i <= stars ? '<b>★</b>' : '★').join('')}</div><span class="dim sealtap">المس للمتابعة</span></div></div>`);
    document.body.appendChild(el);
    if (S.settings.nature !== false && typeof Amb !== 'undefined') Amb.set('dawn', .22);
    buzz([30, 60, 30, 60, 80]);
    let done = false;
    const fin = () => { if (done) return; done = true; el.classList.add('out'); if (typeof Amb !== 'undefined') Amb.set(null); setTimeout(() => { el.remove(); res(); }, 450); };
    el.onclick = fin; setTimeout(fin, reduceMotion() ? 2500 : 5200);
  });
}

/* ---------- 61–70 · «ليش الدين جميل؟»: a short card, its source, and one deed for today ---------- */
const DEEDS = [
  { id: 'dog', t: 'الرجل الذي سقى الكلب', s: 'رجلٌ اشتدّ عليه العطش فنزل بئرًا فشرب، ثم رأى كلبًا يلهث من العطش، فنزل البئر مرةً أخرى وملأ خفّه ماءً وسقاه، فشكر الله له فغفر له. قالوا: يا رسول الله، وإن لنا في البهائم أجرًا؟ قال:', q: 'في كلّ كبدٍ رطبةٍ أجر', src: 'البخاري ٢٣٦٣، مسلم ٢٢٤٤', act: 'ضع ماءً لطائرٍ أو قطةٍ اليوم.', ic: 'drop' },
  { id: 'smile', t: 'ابتسامتك صدقة', s: 'قال رسول الله ﷺ:', q: 'تبسُّمك في وجه أخيك لك صدقة', src: 'الترمذي ١٩٥٦، وصحّحه الألباني', act: 'ابتسم في وجه ثلاثة أشخاص اليوم.', ic: 'sun' },
  { id: 'maruf', t: 'كل معروف صدقة', s: 'قال رسول الله ﷺ:', q: 'كلُّ معروفٍ صدقة', src: 'البخاري ٦٠٢١', act: 'قل كلمةً طيبة لمن لا يتوقعها منك.', ic: 'heart' },
  { id: 'yusr', t: 'الدين يسر', s: 'قال رسول الله ﷺ:', q: 'إنّ الدين يسر', src: 'البخاري ٣٩', ayah: '﴿يُرِيدُ ٱللَّهُ بِكُمُ ٱلْيُسْرَ﴾ (البقرة ١٨٥)', act: 'يسّر على أحدٍ أمرًا اليوم، ولو في الانتظار.', ic: 'hands' },
  { id: 'khuluq', t: 'أثقل شيء في الميزان', s: 'قال رسول الله ﷺ:', q: 'ما من شيءٍ أثقل في الميزان من حسن الخلق', src: 'أبو داود ٤٧٩٩، وصحّحه الألباني', act: 'إذا أغضبك أحدٌ اليوم فأجبه بهدوء.', ic: 'scale' },
  { id: 'adha', t: 'أزِل الأذى', s: 'قال رسول الله ﷺ في الصدقات التي على كل إنسان كل يوم:', q: 'وتُميط الأذى عن الطريق صدقة', src: 'مسلم ١٠٠٩، والبخاري ٢٩٨٩ بنحوه', act: 'ارفع من الطريق شيئًا قد يؤذي الناس.', ic: 'path' },
  { id: 'adwam', t: 'القليل الدائم', s: 'سُئل رسول الله ﷺ: أيّ الأعمال أحبّ إلى الله؟ قال:', q: 'أدومها وإن قلّ', src: 'البخاري ٦٤٦٥، مسلم ٧٨٣', act: 'دقيقتان مع الضحى اليوم تكفيان.', ic: 'timer' },
  { id: 'jar', t: 'جارك', s: 'قال رسول الله ﷺ:', q: 'ما زال جبريل يوصيني بالجار حتى ظننت أنه سيورّثه', src: 'البخاري ٦٠١٥، مسلم ٢٦٢٥', act: 'أهدِ جارك شيئًا صغيرًا، أو سلّم عليه بابتسامة.', ic: 'home' },
  { id: 'umm', t: 'أمك، ثم أمك، ثم أمك', s: 'جاء رجلٌ فقال: يا رسول الله، من أحقّ الناس بحسن صحابتي؟ قال: «أمّك». قال: ثم من؟ قال: «أمّك». قال: ثم من؟ قال: «أمّك». قال: ثم من؟ قال:', q: 'ثم أبوك', src: 'البخاري ٥٩٧١، مسلم ٢٥٤٨', act: 'اتصل بأمك أو قبّل يدها، وقل لها كلمةً تفرحها.', ic: 'heart' },
  { id: 'tawba', t: 'باب الرجوع مفتوح', s: 'قال رسول الله ﷺ:', q: 'إنّ الله عزّ وجلّ يبسط يده بالليل ليتوب مسيء النهار، ويبسط يده بالنهار ليتوب مسيء الليل', src: 'مسلم ٢٧٥٩', ayah: '﴿قُلْ يَٰعِبَادِىَ ٱلَّذِينَ أَسْرَفُوا۟ عَلَىٰٓ أَنفُسِهِمْ لَا تَقْنَطُوا۟ مِن رَّحْمَةِ ٱللَّهِ﴾ (الزمر ٥٣)', act: 'استغفر الله مئة مرة اليوم، فالباب مفتوح.', ic: 'door' },
];
const deedToday = () => DEEDS[dayIdx() % DEEDS.length];
function deedsDone() { return Object.keys(S.deeds || {}).length; }
function deedCard() {
  const d = deedToday(), did = S.deeds && S.deeds[d.id] && S.deeds[d.id].includes(dayKey());
  return `<div class="card deedc"><div class="row" style="gap:10px"><span class="gi">${ic(d.ic)}</span><div class="grow"><span class="eyebrow">ليش الدين جميل؟ · فعل اليوم</span><h3>${esc(d.t)}</h3></div></div>
    <p class="deedq">«${esc(d.q)}» <small class="dim">${esc(d.src)}</small></p>
    <div class="row wrap" style="gap:8px"><button class="chip ${did ? 'on' : ''}" id="deedDo">${did ? ic('check') + ' فعلتُها اليوم' : esc(d.act)}</button><button class="chip" data-go="deeds">${ic('book')} البطاقات العشر</button></div></div>`;
}
function bindDeedCard() {
  const b = $('#deedDo'); if (!b) return;
  b.onclick = () => { deedToggle(deedToday().id); renderHome(); };
}
function deedToggle(id) {
  S.deeds = S.deeds || {}; const k = dayKey(), a = S.deeds[id] = S.deeds[id] || [];
  if (a.includes(k)) a.splice(a.indexOf(k), 1); else { a.push(k); addXP(8); Sfx.ok(); fxBurst(); if (deedsDone() >= DEEDS.length) award('deeds10'); }
  if (!a.length) delete S.deeds[id];
  save();
}
function openDeeds() {
  const L = Gx.open('dv', 'ليش الدين جميل؟', 'heart');
  const draw = () => html(L.body, `<div class="tjwrap">
    <p class="muted">عشر بطاقات قصيرة: حديثٌ صحيح أو حسن بمصدره، وفعلٌ صغير تعيشه اليوم. علّم عليها حين تفعلها، فهي لك وحدك.</p>
    ${DEEDS.map(d => { const n = (S.deeds && S.deeds[d.id] || []).length, today = S.deeds && S.deeds[d.id] && S.deeds[d.id].includes(dayKey()); return `<div class="card deedc"><div class="row" style="gap:10px"><span class="gi">${ic(d.ic)}</span><h3 class="grow">${esc(d.t)}</h3>${n ? `<span class="dim">${ARN(n)}×</span>` : ''}</div>
      <p>${esc(d.s)} <b class="deedq">«${esc(d.q)}»</b></p><small class="src">${ic('book')} ${esc(d.src)}</small>
      ${d.ayah ? `<p class="qcenter sm">${qfmt(d.ayah)}</p>` : ''}
      <button class="chip ${today ? 'on' : ''}" data-deed="${d.id}" style="margin-top:8px">${today ? ic('check') + ' فعلتُها اليوم' : ic('hands') + ' ' + esc(d.act)}</button></div>`; }).join('')}</div>`);
  draw();
  L.body.onclick = e => { const b = e.target.closest('[data-deed]'); if (b) { deedToggle(b.dataset.deed); draw(); } };
}

/* ---------- 80 · «ركعتا الضحى»: your own quiet counter, and the hadith behind it ---------- */
function duhaDots() {
  const days = Array.from({ length: 30 }, (_, i) => addDays(dayKey(), i - 29)), pr = S.duhaPr || {};
  const month = days.filter(d => pr[d]).length;
  return { month, html: `<div class="duhadots" aria-label="صلاة الضحى في آخر ثلاثين يومًا">${days.map(d => `<i class="${pr[d] ? 'on' : ''}"></i>`).join('')}</div>` };
}
function openDuhaPrayer() {
  const d = duhaState(), dots = duhaDots();
  openSheet('ركعتا الضحى', `<div style="display:grid;gap:12px">
    <blockquote class="hd">«يُصبح على كلّ سُلامى من أحدكم صدقة: فكلّ تسبيحةٍ صدقة، وكلّ تحميدةٍ صدقة، وكلّ تهليلةٍ صدقة، وكلّ تكبيرةٍ صدقة، وأمرٌ بالمعروف صدقة، ونهيٌ عن المنكر صدقة، ويُجزئ من ذلك ركعتان يركعهما من الضحى».<small class="src">${ic('book')} مسلم ٧٢٠</small></blockquote>
    <p class="muted">السُّلامى: كل مفصلٍ في جسمك. فكأن ركعتين في وقت الضحى شكرٌ عن كل مفصلٍ فيك.</p>
    ${d.state !== 'none' ? `<div class="card"><span class="eyebrow">وقتها اليوم في ${esc(d.t.city.name)}</span><h3>من ${hm(d.a)} إلى ${hm(d.b)} تقريبًا</h3><p class="dim">من ارتفاع الشمس بعد الشروق إلى ما قبل الزوال بقليل.</p></div>` : ''}
    <div class="card"><span class="eyebrow">عدّادك أنت وحدك</span><h3>${dots.month ? `صلّيتها ${cnt(dots.month, ['يومًا واحدًا', 'يومين', 'أيام', 'يومًا'])} في آخر ثلاثين يومًا` : 'ابدأ اليوم، ولو مرة'}</h3>${dots.html}<p class="dim">لا مقارنة بأحد، ولا تأنيب إن فات يوم.</p></div>
    ${window.DuhaApp && window.DuhaApp.setReminders ? `<button class="btn btn-line btn-wide" id="dpRem">${ic('timer')} ${S.settings.remind === 'duha' ? 'التذكير مفعّل في وقت الضحى' : 'ذكّرني بلطف في وقت الضحى'}</button>` : ''}
  </div>`, sh => { const r = $('#dpRem', sh); if (r) r.onclick = () => { S.settings.remind = 'duha'; save(); syncReminders(); r.textContent = 'التذكير مفعّل في وقت الضحى'; toast('سيصلك تذكيرٌ لطيف في وقت الضحى', 'sun'); }; });
}

/* ---------- your journey in a file: save it, and bring it back on a new phone or a new install ---------- */
async function backupMake(withRecs) {
  const out = { app: 'rihlat-al-duha', kind: 'backup', v: 5, at: new Date().toISOString(), state: S };
  if (withRecs && typeof RecDB !== 'undefined') {
    const recs = await RecDB.all();
    out.recs = await Promise.all(recs.map(r => new Promise(res => { if (!r.blob) return res({ ...r }); const fr = new FileReader(); fr.onload = () => res({ ...r, blob: undefined, data: fr.result }); fr.onerror = () => res({ ...r, blob: undefined }); fr.readAsDataURL(r.blob); })));
  }
  return JSON.stringify(out);
}
window.__fileSaved = ok => toast(ok ? 'حُفظت النسخة في «التنزيلات/RihlatAlDuha»' : 'اختر أين تحفظ النسخة', 'check');
async function backupSave(withRecs) {
  const json = await backupMake(withRecs), name = `rihlat-al-duha-backup-${dayKey()}.json`;
  S.backupAt = dayKey(); save();
  try { if (window.DuhaApp && window.DuhaApp.shareFile) { window.DuhaApp.shareFile(btoa(unescape(encodeURIComponent(json))), name, 'application/json'); return; } } catch (e) { }
  const blob = new Blob([json], { type: 'application/json' });
  if (window.claude && typeof window.claude.use === 'function') { try { const dl = await window.claude.use('downloads'); if (dl) { await dl.save({ filename: name, data: blob }); toast('حُفظت النسخة', 'check'); return; } } catch (e) { if (e && e.code === 'declined') return; } }
  const u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 5000);
  toast('حُفظت النسخة في التنزيلات', 'check');
}
async function backupRestore(file, mode) {
  let data;
  try { data = JSON.parse(await file.text()); } catch (e) { toast('هذا الملف ليس نسخةً من «رحلة الضحى»', 'x'); return false; }
  if (!data || data.app !== 'rihlat-al-duha' || !data.state) { toast('هذا الملف ليس نسخةً من «رحلة الضحى»', 'x'); return false; }
  const keep = S.settings;
  S = mode === 'replace' ? { ...fresh(), ...data.state, settings: { ...DEF_SETTINGS, ...(data.state.settings || {}) } } : mergeState(S, data.state);
  if (mode !== 'replace') S.settings = keep;
  for (const k of ['tja', 'mem', 'wordle', 'deeds', 'adapt', 'hours', 'dlog', 'pr', 'weak', 'gold', 'duhaPr']) if (data.state[k] && !S[k]) S[k] = data.state[k];
  if (data.recs && typeof RecDB !== 'undefined') {
    for (const r of data.recs) { if (!r.data) continue; try { const blob = await (await fetch(r.data)).blob(); await RecDB.put({ ...r, data: undefined, blob }); } catch (e) { } }
  }
  save(); refreshAll(); syncReminders();
  toast('رجعت رحلتك كما كانت', 'sun'); Sfx.win();
  return true;
}
function backupField() {
  return `<div class="field" style="margin-top:8px">${ic('backup')} نسختك الاحتياطية
    <p class="dim" style="font-size:12.5px;margin:4px 0 8px">احفظ رحلتك في ملف، وأرجعها إن غيّرت جوالك أو أعدت تثبيت التطبيق.${S.backupAt ? ` آخر نسخة: ${fmtDay(S.backupAt)}.` : ''}</p>
    <div class="row wrap" style="gap:8px"><button class="btn btn-line sm" id="bkSave">${ic('backup')} احفظ نسخة</button><button class="btn btn-line sm" id="bkSaveR">مع تسجيلاتي</button><label class="btn btn-line sm" style="cursor:pointer">${ic('repeat')} أرجِع من ملف<input type="file" accept="application/json,.json" id="bkFile" hidden></label></div>
    <div id="bkAsk"></div></div>`;
}
function bindBackupField(sh) {
  const s = $('#bkSave', sh); if (!s) return;
  s.onclick = () => backupSave(false);
  $('#bkSaveR', sh).onclick = () => backupSave(true);
  $('#bkFile', sh).onchange = e => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    const box = $('#bkAsk', sh);
    box.innerHTML = `<div class="confirm" style="margin-top:8px"><b>كيف نُرجعها؟</b><div class="row wrap" style="gap:8px"><button class="btn btn-sun sm" data-m="merge">ادمجها مع تقدّمي</button><button class="btn btn-line sm" data-m="replace">استبدل تقدّمي بها</button></div></div>`;
    box.onclick = async ev => { const b = ev.target.closest('[data-m]'); if (!b) return; box.innerHTML = ''; if (await backupRestore(f, b.dataset.m)) closeSheet(); };
  };
}

Object.assign(V50_ROUTES, { wordle: openWordle, deeds: openDeeds, duhapr: openDuhaPrayer, weak: () => { Sfx.init(); openRunner('كلماتك الصعبة'); Run.game = 'weak'; const ws = weakList(6); (ws.length ? stepWeakWords(ws).then(() => celebrate({ title: 'ثبّتّها!', stars: 3, gemReward: false })) : celebrate({ title: 'لا كلمات صعبة الآن', sub: 'كل كلمة تتعثّر فيها تُحفظ هنا لنثبّتها معًا', gemReward: false })).catch(e => { if (e !== CLOSED) console.error(e); }); } });
GAMES_50.push({ id: 'wordle', go: 'wordle', name: 'كلمة الضحى اليومية', d: 'كلمةٌ من السورة كل يوم للجميع، ست محاولات، والحروف تتلوّن', ic: 'grid', best: () => wdSt().streak ? ARN(wdSt().streak) + ' متتالية' : null });
