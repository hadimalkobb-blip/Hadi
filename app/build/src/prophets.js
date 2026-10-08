/* =====================================================================================
   5.0 · «ليل الأنبياء وضحاهم» (planned 4.6): every prophet passed through a night, and every night had its
   forenoon. Yusuf's path, Yunus in the darknesses, the mother of Musa, Ayyub, Ibrahim under tonight's real sky,
   the Hijra on a real map, the prayers of the prophets, a prophet's character each day, bedtime stories from the
   Quran alone, and a Friday story from the two Sahihs. Verses: Tanzil text, recited by Mishary Alafasy.
   No image of any prophet, ever: only skies, water, light and symbols.
   ===================================================================================== */
const PRD = __PRD__;
const PRN = __PRN__;
const PA = new Audio(); PA.preload = 'auto';
const Pr = { tok: 0, res: null };
const p3 = n => String(n).padStart(3, '0');
const prRef = (s, a) => `${PRD.sura[s] || ''} ${ARN(a)}`;
const prV = (s, a) => PRD.verses[s + ':' + a] || '';
function prPlay(url, rate = 1) {
  stopAll(); prStop(); const my = ++Pr.tok;
  if (typeof Amb !== 'undefined') Amb.set(null);
  if (Pr.sea) { Pr.sea.stop(); Pr.sea = null; }
  return new Promise(res => {
    Pr.res = res; PA.src = url; PA.playbackRate = rate;
    PA.onended = () => { if (Pr.res === res) Pr.res = null; res(my === Pr.tok); };
    PA.onerror = () => { if (Pr.res === res) Pr.res = null; res(false); };
    PA.play().catch(() => { if (Pr.res === res) Pr.res = null; res(false); });
  });
}
function prStop() { Pr.tok++; try { PA.pause(); } catch (e) { } if (Pr.res) { const r = Pr.res; Pr.res = null; r(false); } }
const prAyah = (s, a) => prPlay(`extra/ayat/${p3(s)}${p3(a)}.mp3`);
const prNarr = key => prPlay(`extra/narr2/${key}.mp3`, S.settings.narrRate || 1);
const _stopAll50 = stopAll;
stopAll = function () { _stopAll50(); prStop(); };
function prVerse(s, a, o = {}) {
  return `<div class="prverse ${o.cls || ''}"><div class="qt night">${esc(prV(s, a))}<span class="am"> ﴿${ARN(a)}﴾</span></div><div class="row prvr"><small class="dim">${prRef(s, a)}</small><button class="chip" data-ay="${s}:${a}">${ic('sound')} استمع</button></div></div>`;
}
const prFrag = (t, s, a) => `<span class="qinline">﴿${esc(t)}﴾</span> <small class="dim">(${prRef(s, a)})</small>`;
function prSeen(id) { S.pr = S.pr || {}; S.pr.seen = S.pr.seen || []; if (!S.pr.seen.includes(id)) { S.pr.seen.push(id); addXP(6); if (S.pr.seen.length >= 5) award('prophets'); save(); } }
/* every [data-ay] button inside the prophets' screens plays that verse */
document.addEventListener('click', e => { const b = e.target.closest('[data-ay]'); if (!b) return; const [s, a] = b.dataset.ay.split(':').map(Number); Sfx.init(); prAyah(s, a); });

/* =====================================================================================
   the main screen
   ===================================================================================== */
const prTrait = () => PRD.traits[dayIdx() % PRD.traits.length];
const prFridayStory = () => PRD.friday[Math.floor(dayIdx() / 7) % PRD.friday.length];
const isFriday = () => new Date().getDay() === 5;
function openProphets() {
  const L = Gx.open('pv', 'ليل الأنبياء وضحاهم', 'lantern');
  const draw = () => {
    const tr = prTrait(), did = S.pr && S.pr.trait && S.pr.trait[dayKey()] === tr.id, got = Object.keys((S.pr && S.pr.duas) || {}).length, fr = prFridayStory();
    html(L.body, `<div class="prwrap">
      <div class="prhero"><span class="eyebrow prq">${qfmt('﴿وَٱلضُّحَىٰ ۝ وَٱلَّيْلِ إِذَا سَجَىٰ﴾')}</span><h2>كل نبيٍّ مرّ بليل… ثم جاء الضحى</h2><p class="muted">يوسف في البئر، ويونس في بطن الحوت، وأمّ موسى وقلبها فارغ، وأيوب في مرضه. ولم يدم ليلٌ منها. وكذلك ليلك.</p></div>
      <div class="card prtrait"><span class="eyebrow">${ic('star')} خُلُق نبيٍّ اليوم: ${esc(tr.t)}</span><p style="margin-top:6px">${esc(tr.who)}: ${prFrag(tr.frag, tr.ref[0], tr.ref[1])}</p>
        <div class="row wrap" style="gap:8px;margin-top:8px"><button class="chip ${did ? 'on' : ''}" id="prTr">${did ? ic('check') + ' فعلتُها اليوم' : esc(tr.act)}</button><button class="chip" data-ay="${tr.ref[0]}:${tr.ref[1]}">${ic('sound')} الآية</button></div></div>
      <div><span class="eyebrow">${ic('moon')} ليلٌ… ثم ضحى</span></div>
      <div class="prline">${PRD.nights.map(x => `<button class="prn" data-open="${x.open}"><span class="prni">${ic(x.ic)}</span><span class="grow"><b>${esc(x.who)}</b><span class="prnight">${esc(x.night)}</span><span class="prdawn">${prFrag(x.dawn, x.ref[0], x.ref[1])}</span></span>${ic('chev')}</button>`).join('')}</div>
      <div class="card prduasc"><div class="row"><div class="grow"><span class="eyebrow">${ic('hands')} أدعية الأنبياء</span><h3>${got ? `جمعت ${ARN(got)} من ${ARN(PRD.duas.length)} أدعية` : 'ثمانية أدعية تجمعها بالحفظ'}</h3></div></div>
        <div class="prduas">${PRD.duas.map(d => `<button class="prdua ${S.pr && S.pr.duas && S.pr.duas[d.id] ? 'got' : ''}" data-dua="${d.id}"><b>${esc(d.who.replace(/ عليه.*| عليهما.*/, ''))}</b><span>${esc(d.when)}</span></button>`).join('')}</div></div>
      <div><span class="eyebrow">${ic('moon')} حكاية قبل النوم · من القرآن وحده</span></div>
      <div class="prstories">${PRD.stories.map(s => `<button class="card prst" data-story="${s.id}"><span class="prni">${ic(s.ic)}</span><b>${esc(s.t)}</b><span class="dim">نحو ${ARN(s.min)} دقائق · الراوي يحكي والآيات بصوت القارئ</span></button>`).join('')}</div>
      <button class="card prfri" data-fri="${fr.id}"><span class="eyebrow">${ic('calendar')} قصة الجمعة${isFriday() ? ' · اليوم' : ''} · من الصحيحين</span><h3>${esc(fr.t)}</h3><span class="dim">قصةٌ قصيرة بصوت الراوي، وسؤالٌ تتحدثون فيه على الغداء</span></button>
      <div class="row wrap" style="gap:8px">${PRD.friday.filter(f => f.id !== fr.id).map(f => `<button class="chip" data-fri="${f.id}">${esc(f.t)}</button>`).join('')}</div>
      <button class="card prwhy" id="prWhy"><span class="eyebrow">${ic('bulb')} ليش أرسل الله الأنبياء؟</span><p>${qfmt(PRD.why.note)}</p></button>
      <p class="dim tjhonest">${ic('info')} الآيات بالرسم العثماني من Tanzil.net بصوت مشاري العفاسي (EveryAyah)، والراوي صوتٌ مولَّد يحكي ولا يقرأ القرآن. لا صور للأنبياء في هذا التطبيق.</p>
    </div>`);
  };
  draw();
  L.body.onclick = e => {
    const o = e.target.closest('[data-open]'); if (o) { prOpen(o.dataset.open); return; }
    const d = e.target.closest('[data-dua]'); if (d) { prDua(d.dataset.dua, draw); return; }
    const st = e.target.closest('[data-story]'); if (st) { prStory(st.dataset.story, 'bed'); return; }
    const f = e.target.closest('[data-fri]'); if (f) { prStory(f.dataset.fri, 'fri'); return; }
    if (e.target.closest('#prWhy')) { prWhy(); return; }
    if (e.target.closest('#prTr')) { S.pr = S.pr || {}; S.pr.trait = S.pr.trait || {}; const k = dayKey(); if (S.pr.trait[k]) delete S.pr.trait[k]; else { S.pr.trait[k] = prTrait().id; addXP(8); fxBurst(); } save(); draw(); }
  };
  L.onClose = () => prStop();
}
function prOpen(id) {
  prSeen(id);
  ({ yusuf: prYusuf, yunus: prYunus, musa: prMusa, ayyub: prAyyub, ibrahim: prIbrahim, hijra: prHijra, duha: () => go('doc') })[id]?.();
}

/* ---------- 54 · the path of Yusuf ---------- */
function prYusuf() {
  const L = Gx.open('pv prys', 'من البئر إلى «أحسن بي»', 'lantern');
  html(L.body, `<div class="prwrap">
    <p class="muted">سبع محطات في قصة يوسف كما جاءت في سورته. المس المحطة لتقرأ آيتها وتسمعها.</p>
    <div class="prpath">${PRD.yusuf.map((x, i) => `<details class="prstop" ${i === 0 ? 'open' : ''}><summary><span class="prsi">${ic(x.ic)}</span><b>${ARN(i + 1)}. ${esc(x.t)}</b></summary><div class="prsd"><p>${qfmt(x.d)}</p>${prVerse(x.ref[0], x.ref[1])}</div></details>`).join('')}</div>
    <div class="card"><span class="eyebrow">${ic('eye')} وفي الطرف الآخر من القصة: ليل يعقوب</span><p class="muted" style="margin-top:4px">أبٌ فقد ابنه سنين طويلة، فلم يشكُ حزنه إلا إلى الله.</p>${PRD.yusufx.yaqub.map(r => prVerse(r[0], r[1])).join('')}</div>
    <div class="card"><span class="eyebrow">${ic('heart')} وحين قدر يوسف على إخوته…</span>${prVerse(PRD.yusufx.forgive[0], PRD.yusufx.forgive[1])}</div>
  </div>`);
}

/* ---------- 52 · Yunus in the darknesses: an experience in the dark ---------- */
function prSea() {
  Sfx.init(); const ctx = Sfx.ctx; if (!ctx || S.settings.nature === false) return null;
  const len = ctx.sampleRate * 4, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
  let last = 0; for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + .02 * w) / 1.02; d[i] = last * 3.5; }
  const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
  const g = ctx.createGain(); g.gain.value = 0; const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = .09; lg.gain.value = .1;
  lfo.connect(lg).connect(g.gain); src.connect(lp).connect(g).connect(ctx.destination); src.start(); lfo.start();
  g.gain.setTargetAtTime(.2, ctx.currentTime, 1.5);
  return { stop() { try { g.gain.setTargetAtTime(0, ctx.currentTime, .35); setTimeout(() => { try { src.stop(); lfo.stop(); } catch (e) { } }, 1600); } catch (e) { } } };
}
function prYunus() {
  const Y = PRD.yunus, L = Gx.open('pv pyv', 'يونس في الظلمات', 'whale');
  let alive = true, raf = 0, light = 0;
  L.onClose = () => { alive = false; cancelAnimationFrame(raf); prStop(); if (Pr.sea) { Pr.sea.stop(); Pr.sea = null; } };
  html(L.body, `<div class="pyw"><canvas id="pyCv"></canvas><div class="pyc" id="pyC"></div></div>`);
  const cv = $('#pyCv', L.body), g = cv.getContext('2d');
  const loop = t => {
    if (!alive) return;
    const W = cv.width = cv.clientWidth * devicePixelRatio, H = cv.height = cv.clientHeight * devicePixelRatio;
    const top = `rgba(${Math.round(4 + 240 * light)},${Math.round(6 + 170 * light)},${Math.round(16 + 80 * light)},1)`;
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, top); gr.addColorStop(1, `rgba(${Math.round(2 + 60 * light)},${Math.round(8 + 60 * light)},${Math.round(20 + 50 * light)},1)`);
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.strokeStyle = `rgba(120,170,220,${.06 + .1 * light})`; g.lineWidth = 2 * devicePixelRatio;
    for (let k = 0; k < 6; k++) { g.beginPath(); for (let x = 0; x <= W; x += 12) { const y = H * (.35 + k * .11) + Math.sin(x / 90 + t / 1600 + k) * 10 * devicePixelRatio; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
    if (light > 0) { const sun = g.createRadialGradient(W / 2, H * .18, 0, W / 2, H * .18, H * .55 * light); sun.addColorStop(0, `rgba(255,220,150,${.55 * light})`); sun.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = sun; g.fillRect(0, 0, W, H); }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  const C = $('#pyC', L.body);
  const say = (h) => { C.classList.remove('in'); void C.offsetWidth; C.innerHTML = h; C.classList.add('in'); };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const tap = (label) => new Promise(r => { const b = node(`<button class="btn btn-line pyb">${label}</button>`); C.appendChild(b); b.onclick = () => { b.remove(); r(); }; });
  (async () => {
    Pr.sea = prSea();
    for (const line of Y.intro) { say(`<p class="pyt">${qfmt(line)}</p>`); await wait(reduceMotion() ? 1400 : 3600); if (!alive) return; }
    say(`<p class="pyt">اسمع القصة كما نزلت.</p>`); await tap(`${ic('play')} استمع`); if (!alive) return;
    for (const [s, a] of Y.story) { say(`<div class="qt pyq">${esc(prV(s, a))}<span class="am"> ﴿${ARN(a)}﴾</span></div><small class="dim">${prRef(s, a)}</small>`); await prAyah(s, a); if (!alive) return; await wait(300); }
    say(`<p class="pyt">وفي الظلمات نادى…</p>`); await wait(1600); if (!alive) return;
    say(`<div class="qt pyq">${esc(prV(Y.call[0], Y.call[1]))}<span class="am"> ﴿${ARN(Y.call[1])}﴾</span></div>`); await prAyah(Y.call[0], Y.call[1]); if (!alive) return;
    for (let k = 1; k <= 3; k++) {
      say(`<div class="pydua qt">${esc(Y.dua)}</div><p class="dim">ردّدها بقلبك ولسانك (${ARN(k)} من ٣)</p>`);
      await tap(`${ic('hands')} قلتُها`); if (!alive) return;
      light = k / 3 * .55; buzz(20);
    }
    say(`<p class="pyt">فجاء الجواب…</p>`); await wait(1200); if (!alive) return;
    const grow = setInterval(() => { light = Math.min(1, light + .01); if (light >= 1 || !alive) clearInterval(grow); }, 60);
    say(`<div class="qt pyq">${esc(prV(Y.answer[0], Y.answer[1]))}<span class="am"> ﴿${ARN(Y.answer[1])}﴾</span></div>`); await prAyah(Y.answer[0], Y.answer[1]); if (!alive) return;
    for (const [s, a] of Y.after) { say(`<div class="qt pyq">${esc(prV(s, a))}<span class="am"> ﴿${ARN(a)}﴾</span></div><small class="dim">${prRef(s, a)}</small>`); await prAyah(s, a); if (!alive) return; }
    S.pr = S.pr || {}; S.pr.duas = S.pr.duas || {}; if (!S.pr.duas.yunus) { S.pr.duas.yunus = dayKey(); } award('yunus'); addXP(20); save();
    say(`<blockquote class="hd pyhd">«${esc(Y.hadith)}»<small class="src">${ic('book')} ${esc(Y.hsrc)}</small></blockquote><p class="pyt">أُضيف دعاء يونس إلى «أدعية الأنبياء» عندك. خذه معك لكل ضيق.</p>`);
    await tap(`${ic('check')} الحمد لله`); if (alive) Gx.close(L);
  })();
}

/* ---------- 53 · the mother of Musa ---------- */
function prMusa() {
  const M = PRD.musa, L = Gx.open('pv prwater', 'موسى يرجع إلى أمه', 'drop');
  html(L.body, `<div class="prwrap"><p class="muted">قصة أمٍّ وعدها الله وعدًا، فوفّى. خمس خطوات من سورة القصص.</p>
    ${M.steps.map((x, i) => `<div class="card prstep"><span class="prnum">${ARN(i + 1)}</span><p>${qfmt(x.d)}</p>${prVerse(x.ref[0], x.ref[1])}</div>`).join('')}
    <div class="card prlink"><span class="eyebrow">${ic('sun')} ومن سورة الضحى</span><p>${qfmt(M.note)}</p><button class="btn btn-line" id="prM6">${ic('sound')} اسمع الآية ٦ من الضحى</button></div></div>`);
  $('#prM6', L.body).onclick = () => playSeq([6]);
}
/* ---------- 55 · Ayyub ---------- */
function prAyyub() {
  const Y = PRD.ayyub, L = Gx.open('pv', 'صبر أيوب', 'heart');
  html(L.body, `<div class="prwrap"><div class="card"><p class="big">${qfmt(Y.note[0])}</p></div>
    ${prVerse(Y.call[0], Y.call[1], { cls: 'card' })}<div class="card"><p>${qfmt(Y.note[1])}</p></div>
    ${prVerse(Y.answer[0], Y.answer[1], { cls: 'card' })}<div class="card"><p>${qfmt(Y.note[2])}</p></div>${prVerse(Y.praise[0], Y.praise[1], { cls: 'card' })}
    <button class="btn btn-sun btn-wide" data-dua-open="ayyub">${ic('hands')} خذ دعاءه في «أدعية الأنبياء»</button></div>`);
  L.body.onclick = e => { if (e.target.closest('[data-dua-open]')) prDua('ayyub'); };
}
/* ---------- 56 · Ibrahim under tonight's real sky ---------- */
function prIbrahim() {
  const I = PRD.ibrahim, L = Gx.open('pv pibv', 'إبراهيم والسماء', 'star');
  const ph = moonPhase(), tm = dayTimes(new Date(Date.now() + 864e5));
  html(L.body, `<div class="prwrap">
    <div class="card pibsky"><canvas id="pibMoon" width="200" height="200" aria-label="القمر الليلة"></canvas><div><span class="eyebrow">سماؤك أنت الليلة · ${esc(tm.city ? tm.city.name : '')}</span><h3>القمر الليلة ${esc(ph.name)} (${ARN(Math.round(ph.illum * 100))}٪)</h3><p class="dim">${tm.rise ? `وتشرق الشمس غدًا قرابة ${hm(tm.rise)}` : ''}. القمر يطلع ويغيب، والشمس تطلع وتغيب.</p></div></div>
    <p class="muted">${qfmt(I.note)}</p>
    ${I.steps.map((x, i) => `<div class="card prstep"><span class="prnum">${ic(['star', 'moon', 'sun', 'radiance'][i])}</span><p>${qfmt(x.d)}</p>${prVerse(x.ref[0], x.ref[1])}</div>`).join('')}</div>`);
  try { drawMoon($('#pibMoon', L.body), ph); } catch (e) { }
}
/* ---------- 57 · the Hijra on a real map ---------- */
function prHijra() {
  const H = PRD.hijra, M = H.map, L = Gx.open('pv', 'الهجرة: اثنان، الله ثالثهما', 'map');
  const P = (lon, lat) => [(lon - M.bb[0]) * M.kx * M.s, (M.bb[3] - lat) * M.s];
  const pts = Object.fromEntries(H.places.map(p => [p.id, P(p.lon, p.lat)]));
  /* an approximate road on land: south to Thawr, west toward the coastal road, north to Quba (Catmull-Rom → Bézier) */
  const way = [[39.8262, 21.4225], [39.8497, 21.3772], [39.62, 21.62], [39.42, 22.15], [39.30, 22.85], [39.33, 23.55], [39.47, 24.10], [39.6172, 24.4392], [39.6111, 24.4672]].map(([lo, la]) => P(lo, la));
  let route = `M${way[0].join(',')}`;
  for (let k = 0; k < way.length - 1; k++) {
    const p0 = way[Math.max(0, k - 1)], p1 = way[k], p2 = way[k + 1], p3_ = way[Math.min(way.length - 1, k + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3_[0] - p1[0]) / 6, p2[1] - (p3_[1] - p1[1]) / 6];
    route += ` C${c1.map(v => v.toFixed(1)).join(',')} ${c2.map(v => v.toFixed(1)).join(',')} ${p2.map(v => v.toFixed(1)).join(',')}`;
  }
  const LBL = { makka: [16, -4, 'start'], thawr: [16, 24, 'start'], madina: [16, -8, 'start'], quba: [-16, 22, 'end'] };
  html(L.body, `<div class="prwrap">
    <div class="card prmap"><svg viewBox="0 0 ${M.w} ${M.h}" role="img" aria-label="خريطة الهجرة من مكة إلى المدينة" style="direction:ltr">
      <rect width="${M.w}" height="${M.h}" fill="#0d2a44"/><path d="${M.land}" fill="#3b2f22" stroke="#7a6248" stroke-width="1.2"/>
      <text x="${P(38.0, 22.6)[0]}" y="${P(38.0, 22.6)[1]}" fill="#7fb4d8" font-size="17" text-anchor="middle" font-family="var(--f-ui)">البحر الأحمر</text>
      <path d="${route}" fill="none" stroke="#f7b844" stroke-width="4" stroke-linecap="round" stroke-dasharray="2 11" class="prroute"/>
      ${H.places.map(p => { const [dx, dy, an] = LBL[p.id] || [14, -8, 'start']; return `<g class="prpl" data-pl="${p.id}"><circle cx="${pts[p.id][0]}" cy="${pts[p.id][1]}" r="7" fill="#ffd27a" stroke="#2a1702" stroke-width="2"/><text x="${pts[p.id][0] + dx}" y="${pts[p.id][1] + dy}" fill="#fff" font-size="21" font-weight="700" font-family="Readex Pro, sans-serif" text-anchor="${an}" paint-order="stroke" stroke="#1a1208" stroke-width="4">${esc(p.t)}</text></g>`; }).join('')}
    </svg><p class="dim" id="prPl">${esc(H.route)} المس مكانًا لتعرف قصته. اليابسة والساحل من Natural Earth.</p></div>
    ${prVerse(H.ref[0], H.ref[1], { cls: 'card' })}
    <div class="card"><p>${esc(H.ctx)}</p><blockquote class="hd">«${esc(H.hadith)}»<small class="src">${ic('book')} ${esc(H.hsrc)}</small></blockquote></div></div>`);
  L.body.onclick = e => { const g = e.target.closest('[data-pl]'); if (g) { const p = H.places.find(x => x.id === g.dataset.pl); $('#prPl', L.body).textContent = `${p.t}: ${p.d}`; Sfx.tap(); } };
}
/* ---------- 58 · the prayers of the prophets: collect them by memorizing ---------- */
function prDua(id, after) {
  const d = PRD.duas.find(x => x.id === id); if (!d) return;
  const got = S.pr && S.pr.duas && S.pr.duas[id];
  openSheet(`دعاء ${d.who}`, `<div class="prduac">
    <span class="eyebrow">${esc(d.when)}</span>
    <div class="qt night prduat" id="pdT">${esc(d.dua)}</div><small class="dim">${prRef(d.ref[0], d.ref[1])}</small>
    <div class="row wrap" style="gap:8px;margin-top:10px"><button class="btn btn-line" data-ay="${d.ref[0]}:${d.ref[1]}">${ic('sound')} الآية بصوت القارئ</button>${got ? `<span class="chip on">${ic('check')} في مجموعتك</span>` : `<button class="btn btn-sun" id="pdTry">${ic('eye')} سمّعها من حفظك</button>`}</div>
    <div id="pdG"></div></div>`, sh => {
    const t = $('#pdTry', sh); if (!t) return;
    t.onclick = () => {
      $('#pdT', sh).classList.add('tjhide'); t.hidden = true;
      $('#pdG', sh).innerHTML = `<p class="muted">قلها من حفظك، ثم اكشفها وتحقّق.</p><button class="btn btn-line btn-wide" id="pdShow">${ic('eye')} اكشف</button>`;
      $('#pdShow', sh).onclick = () => {
        $('#pdT', sh).classList.remove('tjhide');
        $('#pdG', sh).innerHTML = `<div class="selfgrade"><button class="btn btn-good" data-ok="1">${ic('check')} حفظتُها</button><button class="btn btn-bad" data-ok="0">ليس بعد</button></div>`;
        $('#pdG', sh).onclick = e => {
          const b = e.target.closest('[data-ok]'); if (!b) return;
          if (b.dataset.ok === '1') {
            S.pr = S.pr || {}; S.pr.duas = S.pr.duas || {}; S.pr.duas[id] = dayKey(); addXP(15); Sfx.win(); fxBurst(innerWidth / 2, innerHeight / 2, '#ffd27a');
            if (Object.keys(S.pr.duas).length >= PRD.duas.length) award('duas8'); save();
            $('#pdG', sh).innerHTML = `<p class="feedback good">${ic('check')} أضيف إلى مجموعتك. ادعُ به ${esc(d.when)}.</p>`;
            if (after) after();
          } else $('#pdG', sh).innerHTML = `<p class="muted">اسمعها مرةً أخرى وردّدها، ثم جرّب لاحقًا.</p>`;
        };
      };
    };
  });
}
/* ---------- 59 · why were the prophets sent? ---------- */
function prWhy() {
  const W = PRD.why;
  openSheet('ليش أرسل الله الأنبياء؟', `<div style="display:grid;gap:10px">${W.main.map(r => prVerse(r[0], r[1])).join('')}
    <p>${qfmt(W.note)}</p>${W.human.map(h => `<div class="tjnot" style="--tjc:#ffb38a"><b>${esc(h.t)}</b><span>${prFrag(h.frag, h.s, h.a)}</span></div>`).join('')}</div>`);
}

/* =====================================================================================
   92 · bedtime stories and 100 · the Friday story: the narrator tells, the reciter recites
   ===================================================================================== */
function prStory(id, kind) {
  const story = kind === 'fri' ? PRD.friday.find(x => x.id === id) : PRD.stories.find(x => x.id === id);
  if (!story) return;
  const key = i => (kind === 'fri' ? 'f-' : '') + story.id + '-' + i;
  const L = Gx.open('pv psv', story.t, kind === 'fri' ? 'calendar' : 'moon');
  let i = 0, playing = false, alive = true, capT = 0;
  L.onClose = () => { alive = false; clearInterval(capT); prStop(); };
  html(L.body, `<div class="psw"><div class="psstars" aria-hidden="true"></div>
    <div class="pshead"><span class="eyebrow">${kind === 'fri' ? `قصة الجمعة · ${esc(story.src)}` : 'حكاية قبل النوم · من القرآن وحده'}</span><h2>${esc(story.t)}</h2></div>
    <div class="psbody" id="psB"></div>
    <div class="psdots">${story.parts.map((_, k) => `<i data-k="${k}"></i>`).join('')}</div>
    <div class="psctl"><button class="iconbtn" id="psPrev" aria-label="السابق">${ic('next')}</button><button class="psplay" id="psPlay" aria-label="تشغيل">${ic('play')}</button><button class="iconbtn" id="psNext" aria-label="التالي">${ic('prev')}</button></div></div>`);
  const B = $('#psB', L.body);
  const show = () => {
    const p = story.parts[i];
    $$('.psdots i', L.body).forEach((d, k) => { d.classList.toggle('on', k === i); d.classList.toggle('done', k < i); });
    if (p.n) B.innerHTML = `<p class="psn" id="psN">${esc(p.n)}</p>`;
    else B.innerHTML = `<div class="qt psq">${esc(prV(p.a[0], p.a[1]))}<span class="am"> ﴿${ARN(p.a[1])}﴾</span></div><small class="dim">${prRef(p.a[0], p.a[1])} · بصوت القارئ</small>`;
  };
  const caps = (p, k) => {
    clearInterval(capT); const c = PRN[key(k)]; if (!c || !c.caps) return;
    capT = setInterval(() => { const el = $('#psN', L.body); if (!el) return clearInterval(capT); const t = PA.currentTime; const cur = c.caps.find(x => t >= x[0] - .1 && t <= x[1] + .4); if (cur && el.dataset.c !== String(cur[0])) { el.dataset.c = cur[0]; el.innerHTML = c.caps.map(x => `<span class="${x === cur ? 'on' : t > x[1] ? 'past' : ''}">${esc(x[2])}</span>`).join(' '); } }, 150);
  };
  const run = async () => {
    playing = true; $('#psPlay', L.body).innerHTML = ic('pause');
    while (alive && playing && i < story.parts.length) {
      show(); const p = story.parts[i], my = Pr.tok + 1;
      let ok;
      if (p.n) { caps(p, i); ok = await prNarr(key(i)); if (!ok && my === Pr.tok && alive && playing) { await new Promise(r => setTimeout(r, Math.min(9000, p.n.length * 70))); ok = true; } }
      else ok = await prAyah(p.a[0], p.a[1]);
      clearInterval(capT);
      if (!alive || !playing || !ok) return;
      await new Promise(r => setTimeout(r, 450));
      i++;
    }
    if (!alive || i < story.parts.length) return;
    playing = false; $('#psPlay', L.body).innerHTML = ic('repeat');
    S.pr = S.pr || {};
    if (kind === 'fri') { S.pr.fri = [...new Set([...(S.pr.fri || []), story.id])]; if (S.pr.fri.length >= 4) award('friday'); B.innerHTML = `<div class="card psq2"><span class="eyebrow">${ic('people')} سؤالٌ للغداء</span><h3>${esc(story.q)}</h3><p class="dim">تحدّثوا فيه معًا. القصة من ${esc(story.src)}.</p></div>`; }
    else { S.pr.bed = [...new Set([...(S.pr.bed || []), story.id])]; award('bedtime'); B.innerHTML = `<div class="psend"><p class="psn">تصبح على خير.</p><p class="dim">الذي سمع يونس في بطن الحوت يسمعك. نم مطمئنًّا.</p><div class="chips" style="justify-content:center;margin-top:8px">${[10, 20, 30].map(m => `<button class="chip" data-sleep="${m}">تلاوة ${ARN(m)} دقيقة ثم صمت</button>`).join('')}</div></div>`; }
    addXP(10); save(); i = 0;
  };
  $('#psPlay', L.body).onclick = () => { Sfx.init(); if (playing) { playing = false; prStop(); clearInterval(capT); $('#psPlay', L.body).innerHTML = ic('play'); } else run(); };
  $('#psNext', L.body).onclick = () => { const was = playing; playing = false; prStop(); i = Math.min(story.parts.length - 1, i + 1); show(); if (was) setTimeout(run, 50); };
  $('#psPrev', L.body).onclick = () => { const was = playing; playing = false; prStop(); i = Math.max(0, i - 1); show(); if (was) setTimeout(run, 50); };
  show();
}

/* ---------- home, heart, bedtime ---------- */
function prophetsTile() {
  const n = (S.pr && S.pr.seen || []).length;
  return `<button class="card goldc prc" data-go="prophets">${ic('lantern')}<b>ليل الأنبياء وضحاهم</b><span class="dim">${n ? `فتحت ${ARN(n)} من ${ARN(PRD.nights.length)} قصص` : 'كل نبيٍّ مرّ بليل… ثم جاء الضحى'}</span></button>`;
}
function fridayCard() {
  if (!isFriday()) return '';
  const f = prFridayStory();
  return `<button class="card prfri" data-go="friday"><span class="eyebrow">${ic('calendar')} جمعة مباركة · قصة الجمعة</span><h3>${esc(f.t)}</h3><span class="dim">قصةٌ قصيرة من الصحيحين بصوت الراوي، وسؤالٌ للغداء</span></button>`;
}
const prTonight = () => PRD.stories[dayIdx() % PRD.stories.length];
Object.assign(V50_ROUTES, {
  prophets: openProphets, yunus: () => { prSeen('yunus'); prYunus(); }, yusuf: () => { prSeen('yusuf'); prYusuf(); }, hijra: () => { prSeen('hijra'); prHijra(); },
  duas: () => { openProphets(); setTimeout(() => $('.prduasc')?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 150); },
  bedtime: () => prStory(prTonight().id, 'bed'), friday: () => prStory(prFridayStory().id, 'fri'),
});
