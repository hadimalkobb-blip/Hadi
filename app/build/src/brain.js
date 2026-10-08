/* =====================================================================================
   5.0 · العقل الذكي — a memory model for every verse (FSRS-4.5, the algorithm Anki uses), a coach that
   builds today's session, games that adapt to you, your best hour, a word before a verse slips away,
   and you compared only with yourself a month ago. Everything stays on the device.
   ===================================================================================== */
const FSRS_W = [0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031, 1.6474, 0.1367, 1.0461, 2.1072, 0.0793, 0.3246, 1.587, 0.2272, 2.8755];
const FS_F = 19 / 81, FS_DEC = -0.5, DAYMS = 864e5, FS_KEEP = .9;
const memOf = n => (S.mem && S.mem[n]) || null;
const memR = (m, t = Date.now()) => m ? Math.pow(1 + FS_F * Math.max(0, (t - m.last) / DAYMS) / m.s, FS_DEC) : 0;
const fsD0 = g => clamp(FSRS_W[4] - (g - 3) * FSRS_W[5], 1, 10);
const fsInterval = s => s / FS_F * (Math.pow(FS_KEEP, 1 / FS_DEC) - 1);   // days until R falls to 90%
function fsNext(m, g, t) {
  if (!m) return { s: FSRS_W[g - 1], d: fsD0(g), last: t, reps: 1, lapses: g === 1 ? 1 : 0 };
  const r = memR(m, t), d = m.d, s = m.s;
  let ns = g === 1
    ? Math.min(s, FSRS_W[11] * Math.pow(d, -FSRS_W[12]) * (Math.pow(s + 1, FSRS_W[13]) - 1) * Math.exp(FSRS_W[14] * (1 - r)))
    : s * (1 + Math.exp(FSRS_W[8]) * (11 - d) * Math.pow(s, -FSRS_W[9]) * (Math.exp(FSRS_W[10] * (1 - r)) - 1) * (g === 2 ? FSRS_W[15] : 1) * (g === 4 ? FSRS_W[16] : 1));
  const nd = clamp(FSRS_W[7] * fsD0(3) + (1 - FSRS_W[7]) * (d - FSRS_W[6] * (g - 3)), 1, 10);
  return { s: clamp(ns, .1, 36500), d: nd, last: t, reps: (m.reps || 0) + 1, lapses: (m.lapses || 0) + (g === 1 ? 1 : 0) };
}
/* every recall of a verse lands here: 1 forgot · 2 hard · 3 good · 4 easy */
function brainNote(n, g, src = '') {
  const t = Date.now();
  if (src === 'tj' || !n || n > NV) return;
  const mem = memorizedVerses(); if (!mem.includes(n) && src !== 'station') return;
  S.mem = S.mem || {};
  const m = S.mem[n];
  if (m && g === 1 && m.lg === 1 && t - m.last < 36e5) return;     // one lapse per hour is enough
  const nx = fsNext(m, g, t);
  S.mem[n] = { ...nx, lg: g, due: t + fsInterval(nx.s) * DAYMS };
  save();
}
/* the verses that are about to slip (memorized, retrievability under 90%) */
function memDue(th = FS_KEEP) {
  return memorizedVerses().map(n => ({ n, m: memOf(n), r: memR(memOf(n)) })).filter(x => x.m && x.r < th).sort((a, b) => a.r - b.r);
}
function memState(n) {
  const m = memOf(n); if (!m) return { k: 'new', t: 'لم تُراجع بعد', r: 0 };
  const r = memR(m);
  if (r < .85) return { k: 'dry', t: 'تحتاج سقاية', r, m };
  if (r >= .9 && m.s >= 7) return { k: 'firm', t: 'ثابتة', r, m };
  return { k: 'grow', t: 'تنمو', r, m };
}
/* the station review follows the verses' memory once every verse in it has a model */
const _dueReviews = dueReviews;
dueReviews = function () {
  const old = _dueReviews();
  return [1, 2, 3, 4, 5].filter(id => {
    if (!(S.st[id] && S.st[id].done)) return false;
    const vs = STATIONS[id - 1].verses, ms = vs.map(memOf);
    if (id <= 4 && ms.every(Boolean)) return Math.min(...ms.map(m => memR(m))) < FS_KEEP;
    return old.includes(id);
  });
};
const _markStation = markStation;
markStation = function (id, stars) {
  const first = !stDone(id);
  _markStation(id, stars);
  if (first && id <= 4) STATIONS[id - 1].verses.forEach(n => brainNote(n, stars >= 2 ? 3 : 2, 'station'));
};
const _markReview = markReview;
markReview = function (id) {
  _markReview(id);
  const today = Date.now() - 6 * 36e5;
  (STATIONS[id - 1] || { verses: [] }).verses.forEach(n => { const m = memOf(n); if (!m || m.last < today) brainNote(n, 3, 'review'); });
};

/* ---------- daily log, hints, the best hour ---------- */
function dlogAdd(k, v = 1) { S.dlog = S.dlog || {}; const d = dayKey(); const x = S.dlog[d] = S.dlog[d] || {}; x[k] = (x[k] || 0) + v; }
function noteHint() { dlogAdd('h'); }
const HOUR_B = [['fajr', 'بعد الفجر', 4, 7, '06:30'], ['duha', 'وقت الضحى', 7, 11, 'duha'], ['noon', 'الظهيرة', 11, 15, '13:30'], ['asr', 'العصر', 15, 18, '17:00'], ['eve', 'المساء', 18, 21, '19:30'], ['night', 'الليل', 21, 28, '21:00']];
const hourBucket = (h = new Date().getHours()) => HOUR_B.find(b => (h >= b[2] && h < b[3]) || (h + 24 >= b[2] && h + 24 < b[3])) || HOUR_B[5];
function noteAnswer(ok) {
  S.hours = S.hours || {};
  const b = hourBucket()[0], x = S.hours[b] || [0, 0];
  S.hours[b] = [x[0] + (ok ? 1 : 0), x[1] + 1];
  dlogAdd(ok ? 'c' : 'w');
}
function bestHour() {
  const H = S.hours || {}, rows = HOUR_B.map(b => ({ b, ok: (H[b[0]] || [0, 0])[0], n: (H[b[0]] || [0, 0])[1] })).filter(x => x.n >= 12);
  const total = rows.reduce((a, x) => a + x.n, 0);
  if (rows.length < 2 || total < 40) return null;
  rows.forEach(x => { x.acc = x.ok / x.n; });
  rows.sort((a, b) => b.acc - a.acc);
  return { best: rows[0], second: rows[1], rows };
}
/* ---------- you compared with you ---------- */
function dlogSum(from, to) {
  const out = { c: 0, w: 0, h: 0, s: 0, days: 0 };
  for (let i = from; i <= to; i++) { const x = (S.dlog || {})[addDays(dayKey(), -i)]; if (!x) continue; out.days++; for (const k of ['c', 'w', 'h', 's']) out[k] += x[k] || 0; }
  out.acc = out.c + out.w ? out.c / (out.c + out.w) : null; out.hpd = out.days ? out.h / out.days : null;
  return out;
}
function youVsYou() {
  const keys = Object.keys(S.dlog || {}).sort(); if (!keys.length) return null;
  const age = daysBetween(keys[0], dayKey());
  if (age < 14) return { wait: 14 - age };
  const now = dlogSum(0, 6), back = age >= 35 ? 28 : age - 7, then = dlogSum(back, back + 6);
  if (!now.days || !then.days || now.acc == null || then.acc == null) return { wait: 3 };
  return { now, then, back };
}

/* ---------- adaptive difficulty: S.adapt[game] = { lv 0..3, h: last scores } ---------- */
function adaptLevel(id) { return ((S.adapt || {})[id] || {}).lv ?? 1; }
function adaptNote(id, score) {
  if (!id || score == null || isNaN(score)) return;
  S.adapt = S.adapt || {}; const a = S.adapt[id] = S.adapt[id] || { lv: 1, h: [] };
  a.h = [...(a.h || []), Math.round(score * 100) / 100].slice(-3);
  const avg = a.h.reduce((x, y) => x + y, 0) / a.h.length;
  if (a.h.length >= 2 && avg >= .9 && a.lv < 3) { a.lv++; a.h = []; toast('أحسنت! صارت اللعبة أصعب قليلًا لتبقى ممتعة', 'bolt'); }
  else if (a.h.length >= 2 && avg <= .55 && a.lv > 0) { a.lv--; a.h = []; toast('خففنا اللعبة قليلًا… خطوة خطوة', 'heart'); }
  save();
}
/* every answer in every game counts for the best hour and for you-vs-you */
const _hit = hit, _miss = miss;
hit = function () { _hit(); Run.h = (Run.h || 0) + 1; noteAnswer(true); };
miss = function () { _miss(); Run.m = (Run.m || 0) + 1; noteAnswer(false); };

/* =====================================================================================
   the coach: today's session, built from what you know
   ===================================================================================== */
function weakestTjFam() {
  if (!(S.tja && Object.keys(S.tja.s || {}).length)) return null;
  return [...TJD.fams].sort((a, b) => tjMastery(a.id) - tjMastery(b.id))[0];
}
function coachPlan(min = 5) {
  const due = memDue(), nx = nextStation(), weak = typeof weakList === 'function' ? weakList(min >= 15 ? 6 : 3) : [];
  const items = [];
  const revN = min <= 2 ? 1 : min <= 5 ? 3 : 6;
  if (due.length) items.push({ k: 'rev', vs: due.slice(0, revN).map(x => x.n).sort((a, b) => a - b), t: `راجع ${due.length === 1 || revN === 1 ? 'الآية ' + ARN(due[0].n) : 'آياتٍ تكاد تفلت'}`, d: due.slice(0, revN).map(x => `الآية ${ARN(x.n)} (${ARN(Math.round(x.r * 100))}٪)`).join('، '), min: Math.min(revN, due.length) });
  if (weak.length && min >= 5) items.push({ k: 'weak', ws: weak.slice(0, min >= 15 ? 6 : 3), t: 'كلماتك الصعبة', d: weak.slice(0, 3).map(x => QD.verses[x.n][x.w]).join('، '), min: 1 });
  if (nx && (min >= 15 || (!due.length && min >= 5))) items.push({ k: 'station', id: nx.id, t: nx.id === 5 ? 'التحدي الأخير' : `محطة «${nx.name}»`, d: stLabel(nx), min: 6 });
  if (!items.length && memorizedVerses().length) items.push({ k: 'rev', vs: shuffle(memorizedVerses()).slice(0, revN).sort((a, b) => a - b), t: 'مراجعةٌ خفيفة', d: 'كل الآيات ثابتة؛ نمرّ عليها مرورًا', min: 1 });
  if (!items.length && nx) items.push({ k: 'station', id: nx.id, t: `محطة «${nx.name}»`, d: stLabel(nx), min: 6 });
  if (min >= 5) {
    const f = weakestTjFam(), g = f && tjMastery(f.id) < .6 ? { id: 'tjwhy', fam: f.id, name: `ليش هيك؟ · ${f.name}` } : dailyGame();
    items.push({ k: 'game', g: g.id, fam: g.fam, t: g.name, d: g.fam ? 'أضعف أبواب التجويد عندك' : 'تحدي اليوم', min: 2 });
  }
  return items;
}
/* a single-verse quick review, used by the home alert and the stability oasis */
function quickReview(vs) {
  Sfx.init(); openRunner('مراجعة سريعة'); Run.game = 'quick';
  (async () => {
    const r = await stepRecall(vs, 'ثبّت');
    const failed = vs.filter((_, i) => r.marks && r.marks[i] === false);
    if (failed.length) await stepMissing(failed, Math.min(3, failed.length * 2), 'مرّةً أخرى');
    gain(10);
    await celebrate({ title: 'سُقيت!', sub: vs.length === 1 ? `الآية ${ARN(vs[0])} أثبت الآن` : `${ARN(vs.length)} آيات أثبت الآن`, stars: failed.length ? 2 : 3, gemReward: false });
  })().catch(e => { if (e !== CLOSED) console.error(e); });
}
async function stepWeakWords(ws, title = 'كلماتك الصعبة') {
  let good = 0;
  for (let i = 0; i < ws.length; i++) {
    const { n, w } = ws[i], right = QD.verses[n][w];
    const pool = shuffle([...new Set(verseRange(1, NV).flatMap(x => QD.verses[x]))].filter(x => x !== right));
    const near = pool.filter(x => x[0] === right[0] || x.slice(-2) === right.slice(-2));
    const opts = shuffle([right, ...[...new Set([...near.slice(0, 2), ...pool])].slice(0, 3)]);
    const ok = await mcq({ head: stepHead(title, `${ARN(i + 1)} من ${ARN(ws.length)} · كلمةٌ تعثّرت فيها من قبل`), prompt: `<div class="panel"><div class="qt night qbig">${blankVerse(n, w)}</div></div>`, opts: opts.map(x => esc(x)), ok: opts.indexOf(right), two: true });
    if (typeof weakNote === 'function') weakNote(n + ':' + w, !ok);
    if (ok) good++; else brainNote(n, 2, 'weak');
  }
  save();
  return { score: good / Math.max(1, ws.length) };
}
function runCoach(min = 5) {
  const plan = coachPlan(min);
  Sfx.init(); openRunner(`جلستك: ${ARN(min)} دقائق`); Run.game = 'coach';
  const t0 = Date.now(); S.coach = S.coach || {}; S.coach.n = (S.coach.n || 0) + 1; S.coach.last = dayKey(); save();
  (async () => {
    const after = [];
    for (const it of plan) {
      if (it.k === 'rev') { const r = await stepRecall(it.vs, 'ثبّت'); const failed = it.vs.filter((_, i) => r.marks && r.marks[i] === false); if (failed.length) await stepMissing(failed, failed.length * 2, 'مرّةً أخرى'); }
      else if (it.k === 'weak') await stepWeakWords(it.ws.map(x => ({ n: x.n, w: x.w })));
      else after.push(it);
    }
    const mins = Math.max(1, Math.round((Date.now() - t0) / 6e4));
    award('coach');
    setProg(1, 1);
    html(Run.body, `<div class="result"><div class="sunrise" aria-hidden="true"></div><h2>${plan.some(p => p.k === 'rev' || p.k === 'weak') ? 'ثبّتّ ما يكاد يفلت' : 'جلستك جاهزة'}</h2><p class="muted">${ARN(mins)} ${mins <= 2 ? 'دقيقة' : 'دقائق'} · +${ARN(Run.xp)} نقطة</p></div>
      ${after.map(it => `<button class="card coachnext" data-k="${it.k}" data-id="${it.id || it.g}" data-fam="${it.fam || ''}"><span class="gi">${ic(it.k === 'station' ? 'journey' : 'pad')}</span><span class="grow"><span class="eyebrow">التالي</span><b>${esc(it.t)}</b><span class="dim">${esc(it.d)}</span></span>${ic('chev')}</button>`).join('')}
      <button class="btn btn-sun btn-wide" id="cDone">تم</button>`);
    Run.body.onclick = e => {
      const b = e.target.closest('.coachnext'); if (!b) return;
      if (b.dataset.k === 'station') startStation(+b.dataset.id);
      else if (b.dataset.fam) startTjWhy(b.dataset.fam); else startGame(b.dataset.id);
    };
    await until($('#cDone')); closeRunner();
  })().catch(e => { if (e !== CLOSED) console.error(e); });
}

/* ---------- home: the coach card and the gentle alert ---------- */
function coachCard() {
  if (!doneCount() && !Object.keys(S.mem || {}).length) return '';
  const due = memDue(), slip = due[0], bh = bestHour(), plan = coachPlan(S.coachMin || 5);
  return `<div class="card coachc">
    <div class="row" style="gap:10px"><span class="gi">${ic('atom')}</span><div class="grow"><span class="eyebrow">مدرّبك · يتعلّم من حفظك</span><h3>${slip ? `الآية ${ARN(slip.n)} تشتاق إليك` : 'آياتك ثابتة اليوم'}</h3></div><button class="chip" data-go="coach">${ic('chev')}</button></div>
    <p class="dim">${slip ? `${slip.r > .8 ? 'تكاد تفلت' : 'بدأت تبتعد'}، ودقيقة واحدة تكفي لتعود ثابتة.` : 'المدرّب يراقب متى تبدأ كل آية بالابتعاد، ويخبرك قبل ذلك بقليل.'}${bh ? ` تحفظ أفضل ${bh.best.b[1]}.` : ''}</p>
    <div class="row wrap" style="gap:6px;margin-top:8px"><span class="dim">عندي:</span>${[2, 5, 15].map(m => `<button class="chip ${(S.coachMin || 5) === m ? 'on' : ''}" data-cmin="${m}">${ARN(m)} دقائق</button>`).join('')}</div>
    <ol class="coachplan">${plan.map(it => `<li><b>${esc(it.t)}</b><span class="dim">${esc(it.d)}</span></li>`).join('')}</ol>
    <button class="btn btn-sun btn-wide" id="coachGo">${ic('play')} ابدأ جلسة ${ARN(S.coachMin || 5)} دقائق</button>
  </div>`;
}
function bindCoachCard() {
  const c = $('.coachc'); if (!c) return;
  c.onclick = e => {
    const m = e.target.closest('[data-cmin]'); if (m) { S.coachMin = +m.dataset.cmin; save(); renderHome(); return; }
    if (e.target.closest('#coachGo')) runCoach(S.coachMin || 5);
  };
}

/* =====================================================================================
   the coach's room: stability oasis, before-forgetting, best hour, you vs you
   ===================================================================================== */
function openCoach() {
  const L = Gx.open('brv', 'مدرّبك', 'atom');
  const draw = () => {
    const rows = verseRange(1, NV).map(n => ({ n, st: memState(n), mem: memorizedVerses().includes(n) }));
    const bh = bestHour(), yy = youVsYou(), due = memDue();
    const firm = rows.filter(r => r.st.k === 'firm').length, dry = rows.filter(r => r.mem && r.st.k === 'dry').length;
    html(L.body, `<div class="tjwrap">
      <div class="card"><span class="eyebrow">${ic('palm')} مقياس الثبات</span><h3 style="margin-top:4px">${firm ? `${cnt(firm, ['آيةٌ ثابتة', 'آيتان ثابتتان', 'آيات ثابتة', 'آيةً ثابتة'])}` : 'كل آية تحفظها تظهر هنا'}${dry ? ` · ${cnt(dry, ['آيةٌ تحتاج سقاية', 'آيتان تحتاجان سقاية', 'آيات تحتاج سقاية', 'آيةً تحتاج سقاية'])}` : ''}</h3>
        <p class="dim">لكل آية نموذج ذاكرة (FSRS، خوارزمية تطبيق Anki): كم يومًا تبقى ثابتة، ومتى تبدأ بالابتعاد. كل تسميعٍ صحيح في وقته يطيل عمرها.</p>
        <div class="memgrid">${rows.map(r => `<button class="memv ${r.mem ? r.st.k : 'none'}" data-mv="${r.n}"><b>${ARN(r.n)}</b><i style="--r:${r.mem && r.st.m ? r.st.r : 0}"></i><span>${r.mem ? r.st.t : 'لم تُحفظ'}</span>${r.mem && r.st.m ? `<small>${ARN(Math.round(r.st.r * 100))}٪ · تبقى نحو ${ARN(Math.max(1, Math.round(fsInterval(r.st.m.s))))} يومًا</small>` : ''}</button>`).join('')}</div>
        ${due.length ? `<button class="btn btn-sun btn-wide" id="bWater" style="margin-top:10px">${ic('drop')} اسقِ ${due.length === 1 ? 'الآية ' + ARN(due[0].n) : cnt(due.length, ['آية', 'آيتين', 'آيات', 'آية'])} الآن</button>` : ''}</div>
      <div class="card"><span class="eyebrow">${ic('timer')} عندي وقتٌ قليل</span><h3 style="margin-top:4px">اختر وقتك، ويبني المدرّب جلستك</h3>
        <div class="row wrap" style="gap:8px;margin-top:8px">${[2, 5, 15].map(m => `<button class="btn ${m === 5 ? 'btn-sun' : 'btn-line'}" data-run="${m}">${ARN(m)} دقائق</button>`).join('')}</div>
        <p class="dim" style="margin-top:8px">المراجعة المستحقة أولًا، ثم كلماتك الصعبة، ثم الجديد، ثم لعبة.</p></div>
      <div class="card"><span class="eyebrow">${ic('sun')} أفضل وقتٍ لك</span>
        ${bh ? `<h3 style="margin-top:4px">تحفظ أفضل ${bh.best.b[1]}</h3><p class="dim">دقتك ${bh.best.b[1]} ${ARN(Math.round(bh.best.acc * 100))}٪، و${bh.second.b[1]} ${ARN(Math.round(bh.second.acc * 100))}٪.</p>
          ${window.DuhaApp && window.DuhaApp.setReminders ? `<button class="btn btn-line" id="bRem" data-t="${bh.best.b[4]}">${ic('timer')} اجعل تذكيري ${bh.best.b[1]}</button>` : ''}`
        : `<p class="dim" style="margin-top:6px">العب وراجع في أوقاتٍ مختلفة من اليوم، وبعد نحو أربعين إجابة سيعرف المدرّب في أي وقتٍ تحفظ أسرع.</p>`}
        <div class="hourbars">${HOUR_B.map(b => { const x = (S.hours || {})[b[0]] || [0, 0]; const acc = x[1] ? x[0] / x[1] : 0; return `<span><i style="height:${Math.round(acc * 100)}%"></i><small>${b[1]}</small></span>`; }).join('')}</div></div>
      <div class="card"><span class="eyebrow">${ic('twins')} أنت مقابل أنت</span>
        ${!yy ? `<p class="dim" style="margin-top:6px">لا مقارنة بالناس هنا، بل بنفسك قبل شهر. ابدأ اليوم، وستظهر مقارنتك بعد أسبوعين.</p>`
        : yy.wait ? `<p class="dim" style="margin-top:6px">بعد ${cnt(yy.wait, ['يوم', 'يومين', 'أيام', 'يومًا'])} تظهر مقارنتك بنفسك.</p>`
          : `<h3 style="margin-top:4px">${yy.now.acc >= yy.then.acc ? 'أنت اليوم أدقّ منك' : 'أنت ما زلت على الطريق'} قبل ${yy.back >= 28 ? 'شهر' : cnt(yy.back, ['يوم', 'يومين', 'أيام', 'يومًا'])}</h3>
            <div class="yvy"><div><small>قبل ${yy.back >= 28 ? 'شهر' : ARN(yy.back) + ' يومًا'}</small><b>${ARN(Math.round(yy.then.acc * 100))}٪</b><span>دقة الإجابات</span></div><div class="now"><small>هذا الأسبوع</small><b>${ARN(Math.round(yy.now.acc * 100))}٪</b><span>دقة الإجابات</span></div></div>
            ${yy.then.hpd != null && yy.then.h ? `<p class="dim">${yy.now.h < yy.then.h ? `كنت تحتاج ${ARN(Math.round(yy.then.hpd))} تلميحات في اليوم، واليوم ${yy.now.hpd < .5 ? 'ولا واحد' : ARN(Math.round(yy.now.hpd))}.` : 'التلميحات صديقتك ما دمت تتعلّم.'}</p>` : ''}`}</div>
      <div class="card"><span class="eyebrow">${ic('target')} كلماتك الصعبة</span>
        ${(typeof weakList === 'function' && weakList(6).length) ? `<div class="lrweak" style="margin-top:8px">${weakList(6).map(x => `<button data-wk="${x.k}">${esc(QD.verses[x.n][x.w])}</button>`).join('')}</div><button class="btn btn-line btn-wide" id="bWeak" style="margin-top:10px">${ic('target')} ثبّتها الآن</button>` : `<p class="dim" style="margin-top:6px">كل كلمة تتعثّر فيها في التسميع أو الألعاب تُحفظ هنا، ثم نثبّتها معًا.</p>`}</div>
      <p class="dim tjhonest">${ic('info')} كل ما يعرفه المدرّب محفوظٌ على جهازك فقط.</p>
    </div>`);
  };
  draw();
  L.body.onclick = e => {
    const r = e.target.closest('[data-run]'); if (r) { runCoach(+r.dataset.run); return; }
    const v = e.target.closest('[data-mv]'); if (v) { const n = +v.dataset.mv; if (memorizedVerses().includes(n)) quickReview([n]); else go('st' + (verseStation(n) || STATIONS[0]).id); return; }
    if (e.target.closest('#bWater')) { quickReview(memDue().slice(0, 4).map(x => x.n).sort((a, b) => a - b)); return; }
    if (e.target.closest('#bWeak')) { Sfx.init(); openRunner('كلماتك الصعبة'); Run.game = 'weak'; stepWeakWords(weakList(6)).then(() => celebrate({ title: 'ثبّتّها!', stars: 3, gemReward: false })).catch(er => { if (er !== CLOSED) console.error(er); }); return; }
    const wk = e.target.closest('[data-wk]'); if (wk) { const [n, w] = wk.dataset.wk.split(':').map(Number); playWord(n, w); return; }
    const rem = e.target.closest('#bRem'); if (rem) { S.settings.remind = rem.dataset.t; save(); syncReminders(); toast('سيصلك تذكيرٌ لطيف في وقتك الأفضل', 'timer'); }
  };
}
/* the oasis follows the memory model where it exists */
const _palmOf = palmOf;
palmOf = function (n) {
  const p = _palmOf(n), m = memOf(n);
  if (!p.lvl || !m) return p;
  const r = memR(m), lvl = m.s >= 30 ? 4 : m.s >= 10 ? 3 : m.s >= 3 ? 2 : 1;
  return { ...p, lvl, thirsty: r < .85, r, mem: m };
};
