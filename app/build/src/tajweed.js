/* =====================================================================================
   5.0 · أكاديمية التجويد — every rule in Surah Ad-Duha (Hafs from 'Asim), why it is this rule,
   and why it is not its neighbour. Six games: «ليش هيك؟», «ميزان المدّ», «شمسية أم قمرية؟»,
   «نون وتنوين», «أذن المجوّد», «لوّن الآية». Quran words are only lit, heard and coloured.
   ===================================================================================== */
/* 5.0 registries: the new modules add their routes and games here */
const V50_ROUTES = {};
const GAMES_50 = [];

const TJD = __TJD__;
const TJ_SP = Object.fromEntries(TJD.spots.map(s => [s.id, s]));
const tjR = id => TJD.rules[id] || { name: id, d: '', c: '#ccc' };
const tjFam = id => TJD.fams.find(f => f.id === id);
const tjAt = (n, w) => TJD.spots.filter(s => s.hl.some(h => h[0] === n && h[1] === w));
const tjColor = r => tjR(r).c;
const TJ_COUNT = 450;   // one haraka, in ms, for the madd balance and «عدّ معي»
const TJ_HSET = { m2: '٢', badal: '٢', m45: '٤–٥', mun: '٤–٥', arid: '٢ أو ٤ أو ٦', m6: '٦' };
const TJ_EAR = {
  m6: 'مدٌّ طويلٌ جدًّا: ستّ حركات', m45: 'مدٌّ طويلٌ تليه همزة', gh: 'صوتٌ رخيم من الأنف على الميم',
  qal: 'نبرةٌ ترتدّ على حرفٍ ساكن', ikh: 'تنوينٌ خفيٌّ بغنةٍ قبل الفاء', izh: 'نونٌ ساكنة واضحة بلا غنة',
  idg: 'التنوين يختفي في لامٍ مشدّدة', izs: 'ميمٌ ساكنة واضحة بإطباق الشفتين',
};

/* ---------- progress: S.tja = { s: {spot: [ok, n]}, best: {...}, seen: [fam] } ---------- */
function tjSt() { S.tja = S.tja || { s: {}, best: {}, seen: [] }; S.tja.s = S.tja.s || {}; S.tja.best = S.tja.best || {}; S.tja.seen = S.tja.seen || []; return S.tja; }
function tjNote(id, ok) {
  const st = tjSt(), x = st.s[id] || [0, 0];
  st.s[id] = [x[0] + (ok ? 1 : 0), x[1] + 1];
  if (typeof brainNote === 'function') { const sp = TJ_SP[id]; if (sp) brainNote(sp.n, ok ? 3 : 1, 'tj'); }
  save();
}
const tjSpotScore = id => { const x = tjSt().s[id]; if (!x) return 0; const [ok, n] = x; return clamp((ok - (n - ok) * .5) / 2); };
function tjMastery(fam) {
  const sp = TJD.spots.filter(s => (!fam || s.f === fam));
  return sp.length ? sp.reduce((a, s) => a + tjSpotScore(s.id), 0) / sp.length : 0;
}
function tjCheckAll() { if (TJD.fams.every(f => tjMastery(f.id) >= .8)) award('tjall'); }
/* adaptive pick: weak spots first, harder spots only once the easy ones are known */
function tjPick(pool, k) {
  const lvlMax = tjMastery() > .55 ? 3 : tjMastery() > .2 ? 2 : 1;
  let cand = pool.filter(s => s.lvl <= lvlMax); if (cand.length < k) cand = pool;
  const w = cand.map(s => ({ s, k: (1.2 - tjSpotScore(s.id)) * (0.6 + Math.random()) }));
  w.sort((a, b) => b.k - a.k);
  const out = []; const usedN = {};
  for (const { s } of w) { if (out.length >= k) break; if ((usedN[s.r] || 0) >= 3 && w.length > k * 1.5) continue; usedN[s.r] = (usedN[s.r] || 0) + 1; out.push(s); }
  return shuffle(out.length >= k ? out : [...out, ...shuffle(cand)].slice(0, k));
}

/* ---------- text with a lit spot (plain letters, so the colours never give the answer away) ---------- */
function tjWordHTML(n, w, ranges, color) {
  const word = QD.verses[n][w];
  if (!ranges || !ranges.length) return esc(word);
  const rs = [...ranges].sort((a, b) => a[0] - b[0]);
  let out = '', i = 0;
  for (const [a, b] of rs) { if (a > i) out += esc(word.slice(i, a)); out += `<span class="tjh"${color ? ` style="--tjc:${color}"` : ''}>${esc(word.slice(a, b))}</span>`; i = b; }
  return out + esc(word.slice(i));
}
function tjVerseHTML(n, spot, o = {}) {
  const words = QD.verses[n].map((_, w) => {
    const rs = spot ? spot.hl.filter(h => h[0] === n && h[1] === w).map(h => [h[2], h[3]]) : [];
    return `<span class="w" data-v="${n}" data-w="${w}">${tjWordHTML(n, w, rs, o.color)}</span>`;
  }).join(' ');
  return words + (n > 0 && o.marker !== false ? ' ' + marker(n) : '');
}
const tjRuleChip = (r, extra = '') => `<span class="tjchip" style="--tjc:${tjColor(r)}"><i></i>${esc(tjR(r).name)}${extra}</span>`;
function tjHear(sp) { if (!sp) return; const [n, a, b] = sp.hear; Sfx.init(); return a === b ? playWord(n, a) : playWords(n, a, b); }

/* the old colour legend (read › tajweed) links each colour to its spots */
const TJ_OLD = { sil: ['duha_sh', 'sail_sh', 'layl_sh'], idg: ['khayr'], gh: ['amma9', 'amma10', 'amma11'], ikh: ['yatiman', 'dallan', 'ailan'], qal: ['yajidk', 'taqhar_q'], taf: ['rabbuka3', 'tarda_r', 'taqhar_r', 'rabbika_r'], m6: ['dalla6'], m45: ['aila45', 'sail45'], mj: ['tarda_mun', 'rahim_arid'], m2: ['idha_m2', 'akhira_b', 'awa_b', 'ula_b'] };
function tjLinkFor(k) {
  const ids = (TJ_OLD[k] || []).filter(id => TJ_SP[id]); if (!ids.length) return '';
  return `<div class="row wrap tjlinks">${ids.map(id => { const s = TJ_SP[id], h = s.hl[0]; return `<button class="chip" data-tjs="${id}">لماذا في «${esc(QD.verses[h[0]][h[1]])}»؟</button>`; }).join('')}</div>`;
}

/* ---------- the «why» card: this rule, and why not the others ---------- */
function tjWhyHTML(sp, o = {}) {
  const r = tjR(sp.r), h = TJ_HSET[sp.r];
  return `<div class="tjcard">
    ${o.verse !== false ? `<div class="qt night tjverse">${tjVerseHTML(sp.n, sp, { color: r.c })}</div>` : ''}
    <div class="tjrh">${tjRuleChip(sp.r)}${h ? `<span class="tjh2">${h} ${sp.r === 'arid' ? 'حركات' : (h === '٢' ? 'حركتان' : 'حركات')}</span>` : ''}</div>
    <p class="tjwhy"><b>لماذا؟</b> ${qfmt(sp.why)}</p>
    ${sp.not.map(([k, t]) => `<div class="tjnot" style="--tjc:${tjColor(k)}"><b>ولماذا ليس «${esc(tjR(k).name)}»؟</b><span>${qfmt(t)}</span></div>`).join('')}
    <p class="dim tjdef">${esc(r.d)}</p>
  </div>`;
}
function tjWhy(id) {
  const sp = TJ_SP[id]; if (!sp) return;
  closePop();
  openSheet('لماذا هذا الحكم؟', `${tjWhyHTML(sp)}
    <div class="row wrap" style="gap:8px;margin-top:12px"><button class="btn btn-sun" id="tjwHear">${ic('sound')} اسمع القارئ</button>${TJ_HSET[sp.r] ? `<button class="btn btn-line" id="tjwCount">${ic('timer')} عُدّ معي</button>` : ''}<button class="btn btn-line" id="tjwPlay">${ic('target')} تدرّب على «${esc(tjFam(sp.f).name)}»</button></div>
    <div class="tjcount" id="tjwDots" hidden></div>`, sh => {
    $('#tjwHear', sh).onclick = () => tjHear(sp);
    const c = $('#tjwCount', sh); if (c) c.onclick = () => tjCountDots($('#tjwDots', sh), sp);
    $('#tjwPlay', sh).onclick = () => { closeSheet(); startTjWhy(sp.f); };
  });
  tjHear(sp);
}
/* «عدّ معي»: the reciter says the word while the harakat light one by one */
function tjCountDots(box, sp) {
  const max = { m2: 2, badal: 2, m45: 5, mun: 5, arid: 6, m6: 6 }[sp.r] || 2;
  box.hidden = false;
  box.innerHTML = Array.from({ length: max }, (_, i) => `<i class="${(sp.r === 'm45' || sp.r === 'mun') && i === 4 ? 'opt' : sp.r === 'arid' && (i === 2 || i === 3 || i === 4 || i === 5) ? 'opt' : ''}">${ARN(i + 1)}</i>`).join('');
  tjHear(sp);
  const dots = $$('i', box); let k = 0;
  clearInterval(box._iv);
  box._iv = setInterval(() => { if (k >= dots.length || !box.isConnected) { clearInterval(box._iv); return; } dots[k++].classList.add('on'); buzz(8); }, TJ_COUNT);
}

/* =====================================================================================
   the academy screen
   ===================================================================================== */
const TJ_GAMES = [
  { id: 'tjwhy', name: 'ليش هيك؟', d: 'موضعٌ مضيء: ما حكمه؟ ولماذا ليس الحكم الآخر؟', ic: 'bulb', best: () => tjSt().best.why != null ? ARN(tjSt().best.why) + '/١٠' : null },
  { id: 'tjmadd', name: 'ميزان المدّ', d: 'اضغط مطوّلًا بقدر حركات المدّ، واعرف سبب طوله', ic: 'scale', best: () => tjSt().best.madd != null ? ARN(tjSt().best.madd) + '/٨' : null },
  { id: 'tjsun', name: 'شمسية أم قمرية؟', d: 'حروفٌ تتوالى: أين تذهب لام «ال»؟', ic: 'sun', best: () => tjSt().best.sun != null ? ARN(tjSt().best.sun) + '٪' : null },
  { id: 'tjnun', name: 'نون وتنوين', d: 'نونٌ ساكنة وحرفٌ بعدها: إظهار أم إدغام أم إقلاب أم إخفاء؟', ic: 'text', best: () => tjSt().best.nun != null ? ARN(tjSt().best.nun) + '٪' : null },
  { id: 'tjear', name: 'أذن المجوّد', d: 'اسمع الكلمة بصوت القارئ قبل أن تراها، وسمِّ الحكم', ic: 'ear', best: () => tjSt().best.ear != null ? ARN(tjSt().best.ear) + '/٨' : null },
  { id: 'tjpaint', name: 'لوّن الآية', d: 'اختر لون الحكم والمس موضعه حتى تتلوّن الآية كلها', ic: 'brush', best: () => tjSt().best.paint != null ? ARN(tjSt().best.paint) + '٪' : null },
];
const TJ = { L: null };
function tjRing(p, size = 44) {
  return `<svg class="tjring" viewBox="0 0 36 36" width="${size}" height="${size}" aria-hidden="true"><circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="3.2"/><circle cx="18" cy="18" r="15.9" fill="none" stroke="#f7b844" stroke-width="3.2" stroke-linecap="round" pathLength="100" stroke-dasharray="${(p * 100).toFixed(1)} 100" transform="rotate(-90 18 18)"/><text x="18" y="21" text-anchor="middle" font-size="8.2" fill="currentColor">${ARN(Math.round(p * 100))}٪</text></svg>`;
}
function openTajweed() {
  const L = Gx.open('tjv', 'أكاديمية التجويد', 'bulb'); TJ.L = L;
  L.onClose = () => { TJ.L = null; };
  tjDraw();
  L.body.onclick = e => {
    const g = e.target.closest('[data-tjg]'); if (g) { startGame(g.dataset.tjg); return; }
    const f = e.target.closest('[data-tjf]'); if (f) { tjLesson(f.dataset.tjf); return; }
    const w = e.target.closest('.tjmap .w'); if (w) { const list = tjAt(+w.dataset.v, +w.dataset.w).filter(s => s.r !== 'plain' && s.f !== 'isti'); if (list.length) tjPickSpot(w, list); else playWord(+w.dataset.v, +w.dataset.w); }
  };
}
function tjDraw() {
  if (!TJ.L) return;
  const all = tjMastery();
  html(TJ.L.body, `<div class="tjwrap">
    <div class="card tjhero"><div class="row" style="gap:14px;align-items:center">${tjRing(all, 64)}<div class="grow"><span class="eyebrow">رواية حفص عن عاصم · ${ARN(TJD.spots.length)} موضعًا في سورة الضحى</span><h3>كل حكمٍ في السورة، ولماذا هو هكذا لا غيره</h3></div></div>
      <p class="muted" style="margin-top:8px">لكل موضعٍ بطاقة: الحكم، وسببه، ولماذا ليس الحكم الذي يشبهه. اسمع كل موضع بصوت ${esc(RNAME(Player.rid))}، ثم العب لتثبّته.</p>
      <button class="btn btn-sun btn-wide" data-tjg="tjwhy" style="margin-top:10px">${ic('bulb')} ابدأ بـ«ليش هيك؟»</button></div>
    <div><span class="eyebrow">${ic('pad')} العب</span></div>
    <div class="games">${TJ_GAMES.map(g => { const b = g.best(); return `<button class="game goldg" data-tjg="${g.id}"><span class="gi">${ic(g.ic)}</span><b>${g.name}</b><span>${g.d}</span>${b != null ? `<em>الأفضل: ${b}</em>` : ''}</button>`; }).join('')}</div>
    <div><span class="eyebrow">${ic('book')} تعلّم: ثمانية أبواب</span></div>
    <div class="tjfams">${TJD.fams.map(f => { const n = TJD.spots.filter(s => s.f === f.id).length; return `<button class="card tjfam" data-tjf="${f.id}">${tjRing(tjMastery(f.id), 46)}<span class="grow"><b>${esc(f.name)}</b><span class="dim">${ARN(n)} ${n > 2 && n < 11 ? 'مواضع' : 'موضعًا'} في السورة</span></span>${ic('chev')}</button>`; }).join('')}</div>
    <div><span class="eyebrow">${ic('eye')} خريطة التجويد: المس أي كلمة ملوّنة</span></div>
    <div class="card paper tjmap qt">${verseRange(1, NV).map(n => verseHTML(n)).join(' ')}</div>
    <div class="tjlegend">${['ikh', 'idg', 'gh', 'qal', 'taf', 'm6', 'm45', 'mj', 'sil'].map(k => `<span><i style="background:var(--tj-${k})"></i>${esc((TJ_RULES[k] || {}).name || '')}</span>`).join('')}</div>
    <p class="dim tjhonest">${ic('info')} هذه الأكاديمية تعرّفك بالأحكام وتدرّب أذنك على صوت القرّاء. أما إتقان التجويد فيُتلقّى بالمشافهة من معلّمٍ متقن، فاقرأ على شيخٍ إن تيسّر لك.</p>
  </div>`);
}
/* a word on the map may hold several spots: choose one */
function tjPickSpot(w, list) {
  if (list.length === 1) return tjWhy(list[0].id);
  closePop();
  const p = node(`<div class="pop" role="dialog" aria-label="أحكام الكلمة"><div class="qw qt night">${esc(QD.verses[+w.dataset.v][+w.dataset.w])}</div><div class="tjpl">${list.map(s => `<button data-tjs="${s.id}">${tjRuleChip(s.r)}${ic('chev')}</button>`).join('')}</div></div>`);
  document.body.appendChild(p);
  const r = w.getBoundingClientRect(), pw = p.offsetWidth, ph = p.offsetHeight;
  p.style.left = clamp(r.left + r.width / 2 - pw / 2, 12, window.innerWidth - pw - 12) + 'px';
  p.style.top = (r.top - ph - 10 < 70 ? r.bottom + 10 : r.top - ph - 10) + 'px';
  playWord(+w.dataset.v, +w.dataset.w);
  setTimeout(() => document.addEventListener('pointerdown', closePopOut, { once: true }), 0);
}
/* one family: the rule table, every spot in the surah, and a practice button */
function tjLesson(fid) {
  const f = tjFam(fid); if (!f) return;
  const st = tjSt(); if (!st.seen.includes(fid)) { st.seen.push(fid); save(); }
  const L = Gx.open('tjv tjl', f.name, f.ic);
  const sps = TJD.spots.filter(s => s.f === fid);
  html(L.body, `<div class="tjwrap">
    <div class="card"><p>${qfmt(f.intro)}</p>
      <div class="tjtable">${f.table.map(r => `<div><b>${esc(r[0])}</b><span>${qfmt(r[1])}</span><em>${qfmt(r[2])}</em></div>`).join('')}</div>
      <p class="dim" style="margin-top:10px">${qfmt(f.note)}</p></div>
    <div><span class="eyebrow">${ic('sound')} في سورة الضحى: المس «لماذا؟»</span></div>
    ${sps.map(s => `<div class="card tjspot"><div class="row" style="gap:10px;align-items:center"><button class="iconbtn" data-hear="${s.id}" aria-label="اسمع">${ic('sound')}</button><span class="qt night grow tjsv">${s.hl.map(h => tjWordHTML(h[0], h[1], [[h[2], h[3]]], tjColor(s.r))).join(' ')}</span>${tjRuleChip(s.r)}</div>
      <div class="row" style="margin-top:6px;gap:8px"><span class="dim grow">${s.n ? 'الآية ' + ARN(s.n) : 'البسملة'}${s.trap ? ' · فخّ شائع' : ''}</span><button class="chip" data-tjs="${s.id}">لماذا؟</button></div></div>`).join('')}
    <button class="btn btn-sun btn-wide" id="tjlGo">${ic('target')} تدرّب على هذا الباب</button>
  </div>`);
  L.body.onclick = e => {
    const h = e.target.closest('[data-hear]'); if (h) { tjHear(TJ_SP[h.dataset.hear]); return; }
    if (e.target.closest('#tjlGo')) startTjWhy(fid);
  };
}

/* =====================================================================================
   games
   ===================================================================================== */
function tjOptsFor(sp) {
  const o = [sp.r]; for (const [k] of sp.not) if (!o.includes(k)) o.push(k);
  return shuffle(o.slice(0, 3));
}
function tjExplainHTML(sp, chosen) {
  const right = chosen === sp.r;
  const others = sp.not.filter(([k]) => k !== chosen || right);
  const chosenNot = sp.not.find(([k]) => k === chosen);
  return `<div class="tjexp ${right ? 'good' : 'bad'}">
    <div class="tjok" style="--tjc:${tjColor(sp.r)}"><b>${ic('check')} «${esc(tjR(sp.r).name)}»${TJ_HSET[sp.r] ? ` · ${TJ_HSET[sp.r]}` : ''}</b><span>${qfmt(sp.why)}</span></div>
    ${!right && chosenNot ? `<div class="tjno" style="--tjc:${tjColor(chosen)}"><b>${ic('x')} ولماذا ليس «${esc(tjR(chosen).name)}»؟</b><span>${qfmt(chosenNot[1])}</span></div>` : ''}
    ${right ? others.slice(0, 2).map(([k, t]) => `<div class="tjno soft" style="--tjc:${tjColor(k)}"><b>ولماذا ليس «${esc(tjR(k).name)}»؟</b><span>${qfmt(t)}</span></div>`).join('') : ''}
  </div>`;
}
function startTjWhy(fam) {
  Sfx.init(); openRunner('ليش هيك؟'); Run.game = 'tjwhy'; S.played = (S.played || 0) + 1; save();
  tjWhyRun(fam).catch(e => { if (e !== CLOSED) console.error(e); });
}
async function tjWhyRun(fam) {
  const pool = TJD.spots.filter(s => !fam || s.f === fam);
  const N = Math.min(10, pool.length >= 6 ? 10 : pool.length * 2);
  const list = []; while (list.length < N) list.push(...tjPick(pool, Math.min(N - list.length, pool.length)));
  let good = 0;
  for (let i = 0; i < list.length; i++) {
    const sp = list[i], opts = tjOptsFor(sp);
    setProg(i, list.length);
    html(Run.body, `${stepHead('ليش هيك؟', `${fam ? esc(tjFam(fam).name) + ' · ' : ''}السؤال ${ARN(i + 1)} من ${ARN(list.length)}`)}
      <div class="panel"><div class="qt night qbig tjq">${tjVerseHTML(sp.n, sp)}</div><div class="row" style="justify-content:center;margin-top:6px"><button class="chip" id="tjH">${ic('sound')} اسمع الموضع</button></div></div>
      <p class="tjprompt">ما حكم ما يضيء؟</p>
      <div class="opts">${opts.map(k => `<button class="opt ui" data-k="${k}">${esc(tjR(k).name)}</button>`).join('')}</div>
      <div id="tjX"></div><button class="btn btn-sun btn-wide" id="tjN" hidden>التالي</button>`);
    $('#tjH').onclick = () => tjHear(sp);
    const ok = await pend(res => {
      let done = false;
      $('.opts', Run.body).onclick = e => {
        const b = e.target.closest('.opt'); if (!b || done) return; done = true;
        const k = b.dataset.k, right = k === sp.r;
        $$('.opt', Run.body).forEach(x => { if (x.dataset.k === sp.r) x.classList.add('right'); else if (x === b) x.classList.add('wrong'); x.disabled = true; });
        if (right) { hit(); good++; } else miss();
        tjNote(sp.id, right);
        $('#tjX').innerHTML = tjExplainHTML(sp, k);
        tjHear(sp);
        const n = $('#tjN'); n.hidden = false; n.textContent = i + 1 < list.length ? 'التالي' : 'النتيجة'; n.onclick = () => res(right);
        $('#tjX').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      };
    });
  }
  const st = tjSt(); if (!fam) st.best.why = Math.max(st.best.why || 0, good); save();
  if (good === list.length && list.length >= 10) award('tjwhy');
  tjCheckAll(); adaptNote('tjwhy', good / list.length);
  await celebrate({ title: good === list.length ? 'فقيهٌ بالأحكام!' : `${ARN(good)} من ${ARN(list.length)}`, sub: 'كل جوابٍ معه سببه، وسبب أنه ليس غيره', stars: good >= list.length - 1 ? 3 : good >= list.length * .6 ? 2 : 1, gemReward: false, again: fam ? () => startTjWhy(fam) : again('tjwhy') });
}

/* ---------- «ميزان المدّ»: hold for as many harakat as the madd needs ---------- */
async function tjMaddRun() {
  const pool = TJD.spots.filter(s => s.f === 'madd');
  const list = tjPick(pool, 8);
  let good = 0;
  for (let i = 0; i < list.length; i++) {
    const sp = list[i], want = { m2: [2], badal: [2], m45: [4, 5], mun: [4, 5], arid: [2, 4, 6], m6: [6] }[sp.r];
    setProg(i, list.length);
    html(Run.body, `${stepHead('ميزان المدّ', `المدّ ${ARN(i + 1)} من ${ARN(list.length)}`)}
      <div class="panel"><div class="qt night qbig tjq">${tjVerseHTML(sp.n, sp)}</div><div class="row" style="justify-content:center;margin-top:6px"><button class="chip" id="tjH">${ic('sound')} اسمع</button></div></div>
      <p class="tjprompt">كم حركة يُمدّ ما يضيء؟ اضغط على الميزان مطوّلًا، وارفع إصبعك عند العدد.</p>
      <div class="tjscale"><button class="tjhold" id="tjHold" aria-label="اضغط مطوّلًا">${Array.from({ length: 6 }, (_, k) => `<i style="--k:${k}"></i>`).join('')}<b id="tjCnt">٠</b><span>حركة</span></button></div>
      <div class="row wrap tjpicks"><span class="dim">أو اختر:</span>${['٢', '٤–٥', '٦', '٢ أو ٤ أو ٦'].map((t, k) => `<button class="chip" data-p="${k}">${t}</button>`).join('')}</div>
      <div id="tjX"></div><button class="btn btn-sun btn-wide" id="tjN" hidden>التالي</button>`);
    $('#tjH').onclick = () => tjHear(sp);
    const ok = await pend(res => {
      let done = false, t0 = 0, iv = 0, c = 0;
      const btn = $('#tjHold'), cnt = $('#tjCnt'), ticks = $$('i', btn);
      const finish = (val, picked) => {
        if (done) return; done = true; clearInterval(iv); btn.classList.remove('on');
        const PICK = [[2], [4, 5], [6], [2, 4, 6]];
        const right = picked != null ? JSON.stringify(PICK[picked]) === JSON.stringify(want) : want.includes(val);
        if (right) { hit(); good++; } else miss();
        tjNote(sp.id, right);
        btn.classList.add(right ? 'right' : 'wrong');
        $('#tjX').innerHTML = `<div class="feedback ${right ? 'good' : 'bad'}">${right ? pick(PRAISE) : `الصحيح: ${TJ_HSET[sp.r]} ${TJ_HSET[sp.r] === '٢' ? 'حركتان' : 'حركات'}`}${picked == null ? ` <span class="dim">(ضغطت ${ARN(val)})</span>` : ''}</div>${tjExplainHTML(sp, sp.r)}<div class="tjcount" id="tjDots"></div>`;
        tjCountDots($('#tjDots'), sp);
        const n = $('#tjN'); n.hidden = false; n.textContent = i + 1 < list.length ? 'التالي' : 'النتيجة'; n.onclick = () => res(right);
        $$('.tjpicks .chip', Run.body).forEach(x => x.disabled = true);
      };
      btn.onpointerdown = e => {
        if (done) return; e.preventDefault(); btn.setPointerCapture(e.pointerId); stopAll(); Sfx.init();
        t0 = performance.now(); c = 0; btn.classList.add('on'); cnt.textContent = '٠';
        ticks.forEach(t => t.classList.remove('on'));
        clearInterval(iv); iv = setInterval(() => { const k = Math.min(7, Math.floor((performance.now() - t0) / TJ_COUNT)); if (k !== c) { c = k; cnt.textContent = ARN(c); ticks.forEach((t, j) => t.classList.toggle('on', j < c)); Sfx.tap(); buzz(6); } }, 30);
      };
      btn.onpointerup = btn.onpointercancel = () => { if (!t0 || done) return; finish(Math.round((performance.now() - t0) / TJ_COUNT)); };
      $('.tjpicks', Run.body).onclick = e => { const p = e.target.closest('[data-p]'); if (p) finish(null, +p.dataset.p); };
    });
  }
  const st = tjSt(); st.best.madd = Math.max(st.best.madd || 0, good); save();
  if (good === list.length) award('tjmadd');
  tjCheckAll(); adaptNote('tjmadd', good / list.length);
  await celebrate({ title: good === list.length ? 'ميزانك دقيق!' : `${ARN(good)} من ${ARN(list.length)}`, sub: 'طول المدّ يحدّده ما قبله وما بعده', stars: good >= 7 ? 3 : good >= 5 ? 2 : 1, gemReward: false, again: again('tjmadd') });
}

/* ---------- «شمسية أم قمرية؟»: letters first, then the words of the surah ---------- */
const TJ_SUN = 'تثدذرزسشصضطظلن', TJ_MOON = 'ءبغحجكوخفعقيمه';
async function tjSunRun() {
  const letters = shuffle([...TJ_SUN, ...TJ_MOON]).slice(0, 10);
  const words = shuffle(['duha_sh', 'layl_sh', 'sail_sh', 'akhira_q', 'ula_q', 'yatim_q']).map(id => TJ_SP[id]);
  const total = letters.length + words.length; let good = 0, i = 0;
  let speed = adaptLevel('tjsun') >= 2 ? 3200 : 4500;
  for (const ch of letters) {
    setProg(i, total);
    const sun = TJ_SUN.includes(ch);
    html(Run.body, `${stepHead('شمسية أم قمرية؟', `الحرف ${ARN(i + 1)} من ${ARN(letters.length)} · بعده الكلمات`)}
      <div class="tjmedal"><span class="qt">ٱلْ</span><b class="qt">${ch === 'ء' ? 'أ' : ch}</b></div>
      <div class="tjbar"><i id="tjT"></i></div>
      <div class="tjsm"><button class="tjsb sun" data-a="1">${ic('sun')}<b>شمسية</b><span>اللام لا تُنطق</span></button><button class="tjsb moon" data-a="0">${ic('moon')}<b>قمرية</b><span>اللام تُنطق</span></button></div>
      <div id="tjX" class="feedback"></div>`);
    const right = await pend(res => {
      let done = false; const bar = $('#tjT'); bar.style.transition = `width ${speed}ms linear`; requestAnimationFrame(() => { bar.style.width = '0%'; });
      const to = setTimeout(() => go(null), speed);
      function go(a) {
        if (done) return; done = true; clearTimeout(to);
        const ok = a != null && (+a === 1) === sun;
        if (ok) { hit(); good++; } else miss();
        $('#tjX').className = 'feedback ' + (ok ? 'good' : 'bad');
        $('#tjX').innerHTML = ok ? pick(PRAISE) : `${a == null ? 'انتهى الوقت. ' : ''}«${ch === 'ء' ? 'الهمزة' : ch}» حرفٌ ${sun ? 'شمسي' : 'قمري'}. القمرية تجمعها «ابغِ حجّك وخَفْ عقيمَه».`;
        setTimeout(() => res(ok), ok ? 650 : 1900);
      }
      $('.tjsm', Run.body).onclick = e => { const b = e.target.closest('[data-a]'); if (b) go(b.dataset.a); };
    });
    i++; if (right) speed = Math.max(2400, speed - 120);
  }
  for (const sp of words) {
    setProg(i, total);
    const sun = sp.r === 'sham';
    html(Run.body, `${stepHead('شمسية أم قمرية؟', 'من كلمات السورة')}
      <div class="panel"><div class="qt night qbig tjq">${tjVerseHTML(sp.n, sp)}</div></div>
      <div class="tjsm"><button class="tjsb sun" data-a="1">${ic('sun')}<b>شمسية</b></button><button class="tjsb moon" data-a="0">${ic('moon')}<b>قمرية</b></button></div>
      <div id="tjX"></div><button class="btn btn-sun btn-wide" id="tjN" hidden>التالي</button>`);
    await pend(res => {
      let done = false;
      $('.tjsm', Run.body).onclick = e => {
        const b = e.target.closest('[data-a]'); if (!b || done) return; done = true;
        const ok = (+b.dataset.a === 1) === sun; if (ok) { hit(); good++; } else miss();
        tjNote(sp.id, ok);
        $('#tjX').innerHTML = tjExplainHTML(sp, ok ? sp.r : (sun ? 'qam' : 'sham'));
        tjHear(sp);
        const n = $('#tjN'); n.hidden = false; n.onclick = () => res(ok);
      };
    });
    i++;
  }
  const pct = Math.round(good / total * 100), st = tjSt(); st.best.sun = Math.max(st.best.sun || 0, pct); save();
  if (good === total) award('tjsun');
  tjCheckAll(); adaptNote('tjsun', good / total);
  await celebrate({ title: good === total ? 'شمسٌ وقمر بلا خطأ!' : `${ARN(pct)}٪`, sub: 'ابغِ حجّك وخَفْ عقيمَه: هذه حروف القمر', stars: pct >= 90 ? 3 : pct >= 65 ? 2 : 1, gemReward: false, again: again('tjsun') });
}

/* ---------- «نون وتنوين»: which rule does the next letter decide? ---------- */
function tjNunRule(ch) { if ('ءهعحغخ'.includes(ch)) return 'izh'; if ('ينمو'.includes(ch)) return 'idgG'; if ('لر'.includes(ch)) return 'idg'; if (ch === 'ب') return 'iql'; return 'ikh'; }
function tjMimRule(ch) { return ch === 'ب' ? 'ikhs' : ch === 'م' ? 'idgs' : 'izs'; }
const TJ_NUN_WHY = {
  izh: 'حروف الحلق الستة (ء هـ ع ح غ خ) بعيدةٌ عن مخرج النون، فتبقى النون واضحة.',
  idgG: 'حروف «ينمو» تُدغم فيها النون مع غنة حركتين.',
  idg: 'اللام والراء تأخذان النون كلها، فإدغامٌ بلا غنة.',
  iql: 'قبل الباء وحدها تُقلب النون ميمًا مخفاة بغنة.',
  ikh: 'الحروف الخمسة عشر الباقية: إخفاءٌ بين الإظهار والإدغام مع غنة.',
  izs: 'كل الحروف غير الباء والميم: الميم واضحة.', ikhs: 'قبل الباء: إخفاءٌ شفوي بغنة.', idgs: 'قبل الميم: ميمٌ مشدّدة بغنة.',
};
async function tjNunRun() {
  const AL = 'ءهعحغخينمولربتثجدذزسشصضطظفقك';
  const nun = shuffle([...shuffle([...'ءهعحغخ']).slice(0, 2), ...shuffle([...'ينمو']).slice(0, 2), ...shuffle([...'لر']).slice(0, 1), 'ب', ...shuffle([...'تثجدذزسشصضطظفقك']).slice(0, 4)]);
  const mim = shuffle(['ب', 'م', ...shuffle([...AL.replace(/[بم]/g, '')]).slice(0, 2)]);
  const duha = shuffle(['khayr', 'yatiman', 'tanhar', 'alam', 'dallan']).slice(0, 3).map(id => TJ_SP[id]);
  const total = nun.length + mim.length + duha.length; let good = 0, i = 0;
  const NUN_OPTS = ['izh', 'idgG', 'idg', 'iql', 'ikh'], MIM_OPTS = ['izs', 'ikhs', 'idgs'];
  for (const [arr, kind] of [[nun, 'nun'], [mim, 'mim']]) for (const ch of arr) {
    setProg(i, total);
    const want = kind === 'nun' ? tjNunRule(ch) : tjMimRule(ch), opts = kind === 'nun' ? NUN_OPTS : MIM_OPTS;
    html(Run.body, `${stepHead(kind === 'nun' ? 'النون الساكنة والتنوين' : 'الميم الساكنة', `${ARN(i + 1)} من ${ARN(total)}`)}
      <div class="tjmedal tjpair"><b class="qt">${kind === 'nun' ? 'نْ' : 'مْ'}</b><span>+</span><b class="qt">${ch === 'ء' ? 'أ' : ch}</b></div>
      <div class="opts ${opts.length > 3 ? 'tjgrid' : ''}">${opts.map(k => `<button class="opt ui" data-k="${k}">${esc(tjR(k).name)}</button>`).join('')}</div>
      <div id="tjX" class="feedback"></div>`);
    await pend(res => {
      let done = false;
      $('.opts', Run.body).onclick = e => {
        const b = e.target.closest('.opt'); if (!b || done) return; done = true;
        const ok = b.dataset.k === want; if (ok) { hit(); good++; } else miss();
        $$('.opt', Run.body).forEach(x => { if (x.dataset.k === want) x.classList.add('right'); else if (x === b) x.classList.add('wrong'); });
        $('#tjX').className = 'feedback ' + (ok ? 'good' : 'bad'); $('#tjX').innerHTML = `${ok ? pick(PRAISE) + ' ' : ''}<span class="dim">${TJ_NUN_WHY[want]}</span>`;
        setTimeout(() => res(ok), ok ? 1100 : 2300);
      };
    });
    i++;
  }
  for (const sp of duha) {
    setProg(i, total);
    const opts = tjOptsFor(sp);
    html(Run.body, `${stepHead('من سورة الضحى', `${ARN(i + 1)} من ${ARN(total)}`)}
      <div class="panel"><div class="qt night qbig tjq">${tjVerseHTML(sp.n, sp)}</div><div class="row" style="justify-content:center;margin-top:6px"><button class="chip" id="tjH">${ic('sound')} اسمع</button></div></div>
      <div class="opts">${opts.map(k => `<button class="opt ui" data-k="${k}">${esc(tjR(k).name)}</button>`).join('')}</div>
      <div id="tjX"></div><button class="btn btn-sun btn-wide" id="tjN" hidden>التالي</button>`);
    $('#tjH').onclick = () => tjHear(sp);
    await pend(res => {
      let done = false;
      $('.opts', Run.body).onclick = e => {
        const b = e.target.closest('.opt'); if (!b || done) return; done = true;
        const ok = b.dataset.k === sp.r; if (ok) { hit(); good++; } else miss(); tjNote(sp.id, ok);
        $$('.opt', Run.body).forEach(x => { if (x.dataset.k === sp.r) x.classList.add('right'); else if (x === b) x.classList.add('wrong'); });
        $('#tjX').innerHTML = tjExplainHTML(sp, b.dataset.k); tjHear(sp);
        const n = $('#tjN'); n.hidden = false; n.onclick = () => res(ok);
      };
    });
    i++;
  }
  const pct = Math.round(good / total * 100), st = tjSt(); st.best.nun = Math.max(st.best.nun || 0, pct); save();
  if (good === total) award('tjnun');
  tjCheckAll(); adaptNote('tjnun', good / total);
  await celebrate({ title: good === total ? 'فارس النون والميم!' : `${ARN(pct)}٪`, sub: 'الحرف الذي بعد النون هو الذي يقرّر', stars: pct >= 90 ? 3 : pct >= 65 ? 2 : 1, gemReward: false, again: again('tjnun') });
}

/* ---------- «أذن المجوّد»: hear before you see ---------- */
async function tjEarRun() {
  const pool = TJD.spots.filter(s => TJ_EAR[s.r]);
  const list = tjPick(pool, 8); let good = 0;
  for (let i = 0; i < list.length; i++) {
    const sp = list[i];
    const others = shuffle(Object.keys(TJ_EAR).filter(k => k !== sp.r && !(sp.r === 'ikh' && k === 'izh' && false))).slice(0, 2);
    const opts = shuffle([sp.r, ...others]);
    setProg(i, list.length);
    html(Run.body, `${stepHead('أذن المجوّد', `${ARN(i + 1)} من ${ARN(list.length)} · اسمع ثم اختر`)}
      <div class="panel tjearp"><button class="tjearb" id="tjH" aria-label="اسمع">${ic('ear')}<span>اسمع مرة أخرى</span></button><div class="qt night qbig tjq tjhide" id="tjV">${tjVerseHTML(sp.n, sp)}</div></div>
      <p class="tjprompt">ماذا سمعت؟</p>
      <div class="opts">${opts.map(k => `<button class="opt ui tjeo" data-k="${k}"><b>${esc(tjR(k).name)}</b><small>${TJ_EAR[k]}</small></button>`).join('')}</div>
      <div id="tjX"></div><button class="btn btn-sun btn-wide" id="tjN" hidden>التالي</button>`);
    $('#tjH').onclick = () => tjHear(sp);
    setTimeout(() => { if (Run.alive) tjHear(sp); }, 350);
    await pend(res => {
      let done = false;
      $('.opts', Run.body).onclick = e => {
        const b = e.target.closest('.opt'); if (!b || done) return; done = true;
        const ok = b.dataset.k === sp.r; if (ok) { hit(); good++; } else miss(); tjNote(sp.id, ok);
        $$('.opt', Run.body).forEach(x => { if (x.dataset.k === sp.r) x.classList.add('right'); else if (x === b) x.classList.add('wrong'); });
        $('#tjV').classList.remove('tjhide');
        $('#tjX').innerHTML = tjExplainHTML(sp, sp.not.some(([k]) => k === b.dataset.k) ? b.dataset.k : sp.r);
        const n = $('#tjN'); n.hidden = false; n.onclick = () => res(ok);
      };
    });
  }
  const st = tjSt(); st.best.ear = Math.max(st.best.ear || 0, good); save();
  if (good >= 7) award('tjear');
  tjCheckAll(); adaptNote('tjear', good / list.length);
  await celebrate({ title: good === list.length ? 'أذنٌ مجوّدة!' : `${ARN(good)} من ${ARN(list.length)}`, sub: 'الأذن تتعلّم بالتكرار، فاسمع القرّاء كثيرًا', stars: good >= 7 ? 3 : good >= 5 ? 2 : 1, gemReward: false, again: again('tjear') });
}

/* ---------- «لوّن الآية»: choose a rule's colour, touch where it lives ---------- */
async function tjPaintRun() {
  const ok = s => s.r !== 'plain' && s.f !== 'isti';
  const vs = shuffle(verseRange(1, NV).filter(n => TJD.spots.filter(s => s.n === n && ok(s)).length >= 2)).slice(0, 3);
  let good = 0, bad = 0;
  for (let vi = 0; vi < vs.length; vi++) {
    const n = vs[vi], sps = TJD.spots.filter(s => s.n === n && ok(s)), done = new Set();
    const rules = [...new Set(sps.map(s => s.r))];
    const decoy = shuffle(['ikh', 'idg', 'gh', 'qal', 'm6', 'm45', 'badal', 'sham', 'qam', 'taf', 'izh', 'izs'].filter(k => !rules.includes(k)))[0];
    const pal = shuffle([...rules, decoy]);
    let sel = null;
    setProg(vi, vs.length);
    html(Run.body, `${stepHead('لوّن الآية', `الآية ${ARN(n)} · ${ARN(vi + 1)} من ${ARN(vs.length)}`)}
      <div class="panel"><div class="qt night qbig tjq tjpaintv" id="tjPv">${QD.verses[n].map((w, k) => `<span class="w" data-w="${k}">${esc(w)}</span>`).join(' ')} ${marker(n)}</div></div>
      <p class="tjprompt" id="tjPm">اختر لونًا، ثم المس الكلمة التي فيها هذا الحكم.</p>
      <div class="tjpal">${pal.map(k => `<button class="tjpc" data-k="${k}" style="--tjc:${tjColor(k)}"><i></i>${esc(tjR(k).name)}</button>`).join('')}</div>
      <div class="row" style="justify-content:space-between"><span class="dim" id="tjPc">${ARN(0)} من ${ARN(sps.length)}</span><button class="chip" id="tjPh">${ic('sound')} اسمع الآية</button></div>
      <div id="tjX"></div><button class="btn btn-sun btn-wide" id="tjN" hidden>${vi + 1 < vs.length ? 'الآية التالية' : 'النتيجة'}</button>`);
    $('#tjPh').onclick = () => playSeq([n]);
    const paint = sp => {
      for (const [nn, w, a, b] of sp.hl) {
        if (nn !== n) continue;
        const el = $(`#tjPv .w[data-w="${w}"]`); if (!el) continue;
        el.dataset.r = (el.dataset.r ? el.dataset.r + ',' : '') + [a, b, sp.r].join(':');
        const ranges = el.dataset.r.split(',').map(x => x.split(':')).map(([a, b, r]) => [+a, +b, r]).sort((x, y) => x[0] - y[0]);
        const word = QD.verses[n][w]; let out = '', i = 0;
        for (const [a2, b2, r] of ranges) { if (a2 < i) continue; if (a2 > i) out += esc(word.slice(i, a2)); out += `<span class="tjh" style="--tjc:${tjColor(r)}">${esc(word.slice(a2, b2))}</span>`; i = b2; }
        el.innerHTML = out + esc(word.slice(i)); el.classList.add('painted');
      }
    };
    await pend(res => {
      $('.tjpal', Run.body).onclick = e => { const b = e.target.closest('.tjpc'); if (!b) return; sel = b.dataset.k; $$('.tjpc', Run.body).forEach(x => x.classList.toggle('on', x === b)); Sfx.tap(); $('#tjPm').textContent = `«${tjR(sel).name}»: المس موضعه في الآية.`; };
      $('#tjPv').onclick = e => {
        const w = e.target.closest('.w'); if (!w || done.size >= sps.length) return;
        if (!sel) { $('#tjPm').textContent = 'اختر لونًا أولًا من الألوان تحت الآية.'; return; }
        const k = +w.dataset.w, sp = sps.find(s => !done.has(s.id) && s.r === sel && s.hl.some(h => h[0] === n && h[1] === k));
        if (!sp) {
          bad++; miss(); w.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(0)' }], { duration: 260 });
          const here = sps.filter(s => s.hl.some(h => h[0] === n && h[1] === k) && !done.has(s.id));
          $('#tjPm').textContent = here.length ? `ليس «${tjR(sel).name}» هنا. في هذه الكلمة حكمٌ آخر.` : `لا «${tjR(sel).name}» في هذه الكلمة.`;
          return;
        }
        done.add(sp.id); good++; hit(); tjNote(sp.id, true); paint(sp); playWord(n, k);
        $('#tjPc').textContent = `${ARN(done.size)} من ${ARN(sps.length)}`;
        $('#tjX').innerHTML = `<div class="tjok soft" style="--tjc:${tjColor(sp.r)}"><b>${esc(tjR(sp.r).name)}</b><span>${qfmt(sp.why)}</span></div>`;
        if (done.size >= sps.length) {
          $('#tjPm').textContent = 'اكتملت ألوان الآية!'; setTimeout(() => { if (Run.alive) playSeq([n]); }, 900);
          const nb = $('#tjN'); nb.hidden = false; nb.onclick = () => res(true);
        }
      };
    });
  }
  const pct = Math.round(good / Math.max(1, good + bad) * 100), st = tjSt(); st.best.paint = Math.max(st.best.paint || 0, pct); save();
  if (bad === 0) award('tjpaint');
  tjCheckAll(); adaptNote('tjpaint', pct / 100);
  await celebrate({ title: bad === 0 ? 'لوحةٌ بلا خطأ!' : `${ARN(pct)}٪ دقة`, sub: 'كل لونٍ في المصحف الملوّن له سبب', stars: bad === 0 ? 3 : pct >= 75 ? 2 : 1, gemReward: false, again: again('tjpaint') });
}

Object.assign(GAME_FNS, { tjwhy: () => tjWhyRun(), tjmadd: tjMaddRun, tjsun: tjSunRun, tjnun: tjNunRun, tjear: tjEarRun, tjpaint: tjPaintRun });
