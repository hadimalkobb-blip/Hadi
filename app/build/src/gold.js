/* ===== The golden features (v4.0)
   «مصحفك المذهّب»: page 596 of the Madinah mushaf, line for line; every verse you master turns to gold and the
   illumination grows around the page until it can be printed.
   «سماء الكلمات»: every word of the surah lights its whole root family across the Quran (corpus morphology).
   «قصر الذاكرة»: a real old Damascene house as a memory palace, one verse in each place. ===== */

/* ---------- stacked full-screen layers (Android back closes the top one) ---------- */
const Gx = {
  stack: [],
  open(cls, title, icon) {
    stopAll(); closePop(); closeSheet(); if (cls !== 'ppv') ppYield();
    const el = node(`<div class="gx ${cls}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="gxtop"><button class="iconbtn" data-gx aria-label="إغلاق">${ic('x')}</button><span class="gxt">${ic(icon)} ${title}</span><span class="grow"></span><span class="gxs"></span></div>
      <div class="gxbody"></div></div>`);
    document.body.appendChild(el); document.body.style.overflow = 'hidden';
    const L = { el, body: $('.gxbody', el), stat: $('.gxs', el), onClose: null };
    el.querySelector('[data-gx]').onclick = () => Gx.close(L);
    this.stack.push(L);
    return L;
  },
  close(L = this.top()) {
    if (!L) return false;
    this.stack = this.stack.filter(x => x !== L);
    try { if (L.onClose) L.onClose(); } catch (e) { console.error(e); }
    stopAll(); closePop(); L.el.remove();
    if (!this.stack.length && !Run.el) document.body.style.overflow = '';
    updateHeader(); if (tab === 'home') renderHome(); if (tab === 'read') renderRead();
    return true;
  },
  top() { return this.stack[this.stack.length - 1] || null; },
};

/* =====================================================================================
   101 · مصحفك المذهّب
   ===================================================================================== */
const GM_STEPS = [
  { at: 1, k: 'frame', t: 'الإطار', d: 'خيطٌ من ذهب يحيط بالصفحة' },
  { at: 8, k: 'corners', t: 'الزوايا', d: 'زخارف مذهّبة في الزوايا الأربع' },
  { at: 16, k: 'head', t: 'رأس السورة', d: 'رأس «سورة الضحى» مذهّبًا' },
  { at: 24, k: 'shamsa', t: 'الشمسات', d: 'شمساتٌ مذهّبة في الهامش' },
  { at: 32, k: 'band', t: 'الحاشية', d: 'حاشيةٌ مزخرفة تحيط بالصفحة' },
  { at: 44, k: 'full', t: 'اكتمال التذهيب', d: 'صفحةٌ مذهّبة كاملة، جاهزة للطباعة' },
];
const GM_MAX = NV * 4;
const GM_LV = ['لم تُحفظ بعد', 'حبرٌ ذهبي', 'ذهبٌ لامع', 'ذهبٌ مضيء', 'ذهبٌ خالص'];
function stLevelOf(n) { const st = STATIONS.find(s => s.id <= 4 && s.verses.includes(n)); if (!st || !stDone(st.id)) return 0; return Math.min(4, 1 + (S.st[st.id].stage || 0)); }
function gLevel(n) { const g = (S.gold && S.gold[n]) || {}; return Math.min(4, Math.max(stLevelOf(n), g.c || 0)); }
function gTotal() { let t = 0; for (let n = 1; n <= NV; n++) t += gLevel(n); return t; }
const gSteps = (t = gTotal()) => GM_STEPS.filter(s => t >= s.at).map(s => s.k);
const gNext = (t = gTotal()) => GM_STEPS.find(s => t < s.at);

/* geometry of the page in a 1000 × 1440 box (HTML overlay, canvas export and SVG ornaments share it) */
const GP = { W: 1000, H: 1440, bx0: 36, by0: 66, bx1: 964, by1: 1378, fx0: 64, fy0: 94, fx1: 936, fy1: 1350, tx0: 88, ty0: 110, tx1: 912, ty1: 1334 };
GP.lh = (GP.ty1 - GP.ty0) / 15;
const gpLineY = i => GP.ty0 + (i + .5) * GP.lh;   // i: 0-based line

function gStar8(cx, cy, r, fill, stroke = '') {
  let d = '';
  for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8 - Math.PI / 2, rr = i % 2 ? r * .55 : r; d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr).toFixed(1); }
  return `<path d="${d}Z" fill="${fill}" ${stroke ? `stroke="${stroke}" stroke-width="1.2"` : ''}/>`;
}
function shamsaSVG(cx, cy, r) {
  let s = '';
  for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; s += `<circle cx="${(cx + Math.cos(a) * r * .8).toFixed(1)}" cy="${(cy + Math.sin(a) * r * .8).toFixed(1)}" r="${(r * .2).toFixed(1)}" fill="url(#gg)" stroke="#8a6526" stroke-width=".8"/>`; }
  s += `<circle cx="${cx}" cy="${cy}" r="${(r * .66).toFixed(1)}" fill="#1f3a78" stroke="url(#gg)" stroke-width="${(r * .1).toFixed(1)}"/>`;
  s += gStar8(cx, cy, r * .52, 'url(#gg)', '#8a6526');
  s += `<circle cx="${cx}" cy="${cy}" r="${(r * .13).toFixed(1)}" fill="#b0402c"/>`;
  return `<g class="gshamsa">${s}</g>`;
}
function cornerSVG(x, y, sx, sy) {
  return `<g transform="translate(${x} ${y}) scale(${sx} ${sy})">
    <path d="M0 0H50A50 50 0 0 1 0 50Z" fill="url(#gg)"/><path d="M0 0H37A37 37 0 0 1 0 37Z" fill="#1f3a78"/><path d="M0 0H23A23 23 0 0 1 0 23Z" fill="url(#gg)"/>
    <circle cx="9" cy="9" r="4" fill="#b0402c"/>
    <path d="M50 2H128M2 50V128" stroke="url(#gg)" stroke-width="5" stroke-linecap="round"/>
    <circle cx="136" cy="2" r="6" fill="url(#gg)"/><circle cx="2" cy="136" r="6" fill="url(#gg)"/></g>`;
}
function cartoucheSVG(cx, cy, w, h, gold, id) {
  const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2, k = h * .5;
  const fill = gold ? '#1f3a78' : '#fbf3df', st = gold ? `url(#${id})` : '#8a6526';
  return `<path d="M${x0 + k} ${y0}H${x1 - k}L${x1} ${cy}L${x1 - k} ${y1}H${x0 + k}L${x0} ${cy}Z" fill="${fill}" stroke="${st}" stroke-width="${gold ? 4 : 1.8}"/>
    <path d="M${x0 + k + 9} ${y0 + 7}H${x1 - k - 9}L${x1 - 12} ${cy}L${x1 - k - 9} ${y1 - 7}H${x0 + k + 9}L${x0 + 12} ${cy}Z" fill="none" stroke="${st}" stroke-width="${gold ? 1.6 : 1}"/>
    ${gold ? gStar8(x0 + k * .9, cy, h * .22, `url(#${id})`) + gStar8(x1 - k * .9, cy, h * .22, `url(#${id})`) : `<circle cx="${x0 + k * .9}" cy="${cy}" r="3.5" fill="#8a6526"/><circle cx="${x1 - k * .9}" cy="${cy}" r="3.5" fill="#8a6526"/>`}`;
}
const GG_DEFS = id => `<linearGradient id="${id}" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#fff1b8"/><stop offset=".32" stop-color="#e6b84f"/><stop offset=".68" stop-color="#b8821f"/><stop offset="1" stop-color="#f5d887"/></linearGradient>`;
/* the ornament layer; o.headers draws both surah cartouches (canvas export), o.size sets width/height attributes */
function gmOrnSVG(steps, o = {}) {
  const has = k => steps.includes(k);
  const { bx0, by0, bx1, by1, fx0, fy0, fx1, fy1 } = GP;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" class="gorn" viewBox="0 0 1000 1440" preserveAspectRatio="none" ${o.size ? `width="${o.size[0]}" height="${o.size[1]}"` : ''} aria-hidden="true">
  <defs>${GG_DEFS('gg')}${GG_DEFS('gh')}
    <pattern id="gband" width="28" height="28" patternUnits="userSpaceOnUse" x="${bx0}" y="${by0}"><rect width="28" height="28" fill="#1f3a78"/>
      <path d="M14 3L25 14L14 25L3 14Z" fill="url(#gg)"/><path d="M14 8L20 14L14 20L8 14Z" fill="#1f3a78"/><circle cx="14" cy="14" r="2.6" fill="#b0402c"/>
      <circle cx="0" cy="0" r="2.2" fill="#e6b84f"/><circle cx="28" cy="0" r="2.2" fill="#e6b84f"/><circle cx="0" cy="28" r="2.2" fill="#e6b84f"/><circle cx="28" cy="28" r="2.2" fill="#e6b84f"/></pattern>
    <radialGradient id="gglow" cx=".5" cy=".5" r=".6"><stop offset=".55" stop-color="rgba(255,214,120,0)"/><stop offset="1" stop-color="rgba(232,170,60,.28)"/></radialGradient>
  </defs>`;
  if (has('full')) s += `<rect x="0" y="0" width="1000" height="1440" fill="url(#gglow)"/>`;
  /* the plain ink frame every mushaf page has */
  s += `<rect x="${fx0}" y="${fy0}" width="${fx1 - fx0}" height="${fy1 - fy0}" fill="none" stroke="#8a6526" stroke-width="2.4"/>
    <rect x="${fx0 + 6}" y="${fy0 + 6}" width="${fx1 - fx0 - 12}" height="${fy1 - fy0 - 12}" fill="none" stroke="#8a6526" stroke-width="1"/>`;
  if (has('band')) s += `<g class="m-band"><path fill-rule="evenodd" d="M${bx0} ${by0}H${bx1}V${by1}H${bx0}Z M${fx0} ${fy0}V${fy1}H${fx1}V${fy0}Z" fill="url(#gband)"/>
    <rect x="${bx0}" y="${by0}" width="${bx1 - bx0}" height="${by1 - by0}" fill="none" stroke="url(#gg)" stroke-width="4"/></g>`;
  if (has('frame')) s += `<g class="m-frame"><rect class="gdraw" x="${fx0}" y="${fy0}" width="${fx1 - fx0}" height="${fy1 - fy0}" fill="none" stroke="url(#gg)" stroke-width="8"/>
    <rect class="gdraw" x="${fx0 + 10}" y="${fy0 + 10}" width="${fx1 - fx0 - 20}" height="${fy1 - fy0 - 20}" fill="none" stroke="url(#gg)" stroke-width="2"/></g>`;
  if (has('corners')) s += `<g class="m-corners">${cornerSVG(bx0, by0, 1, 1)}${cornerSVG(bx1, by0, -1, 1)}${cornerSVG(bx0, by1, 1, -1)}${cornerSVG(bx1, by1, -1, -1)}</g>`;
  if (has('head')) { const y = gpLineY(3); s += `<g class="m-head">${shamsaSVG(bx0 + 14, y, 20)}${shamsaSVG(bx1 - 14, y, 20)}</g>`; }
  if (has('shamsa')) s += `<g class="m-shamsa">${[5, 7, 9].map(i => shamsaSVG(bx0 + 14, gpLineY(i), 30)).join('')}</g>`;
  if (has('full')) s += `<g class="m-full"><path d="M410 ${by0}Q420 ${by0 - 44} 500 ${by0 - 52}Q580 ${by0 - 44} 590 ${by0}Z" fill="url(#gg)" stroke="#8a6526" stroke-width="1.2"/>
    <path d="M436 ${by0}Q446 ${by0 - 30} 500 ${by0 - 36}Q554 ${by0 - 30} 564 ${by0}Z" fill="#1f3a78"/>${gStar8(500, by0 - 16, 13, 'url(#gg)')}
    <circle cx="500" cy="${by1 + 30}" r="25" fill="url(#gg)" stroke="#8a6526" stroke-width="1.2"/><circle cx="500" cy="${by1 + 30}" r="19" fill="#fbf3df"/></g>`;
  if (o.headers) for (const [i, name] of [[3, 'الضحى'], [10, 'الشرح']]) s += cartoucheSVG(500, gpLineY(i), 640, 58, name === 'الضحى' && has('head'), 'gh');
  return s + '</svg>';
}
function gmCartouche(name, gold) {
  const id = 'gc' + name.length + (gold ? 'g' : 'p');
  return `<svg class="gcart${gold ? ' gold' : ''}" viewBox="0 0 640 64" aria-label="سورة ${name}">
    <defs>${GG_DEFS(id)}</defs>${cartoucheSVG(320, 32, 636, 58, gold, id)}
    <text x="320" y="43" text-anchor="middle" font-size="30" fill="${gold ? `url(#${id})` : '#3b2a10'}">سورة ${name}</text></svg>`;
}
function gmLineHTML(line, i) {
  if (line.h) return `<div class="gl gh">${gmCartouche(line.h, line.h === 'الضحى' && gSteps().includes('head'))}</div>`;
  if (line.b) return `<div class="gl gb"><span class="ow">${QD.verses[0].join(' ')}</span></div>`;
  return `<div class="gl" data-l="${i}">${line.map(t => {
    if (t[0] === 'm') return `<span class="am gam lv${gLevel(t[1])}" data-n="${t[1]}" role="button" aria-label="الآية ${ARN(t[1])}">۝${ARN(t[1])}</span>`;
    if (t[0] === 'e') return `<span class="am oam">۝${ARN(t[1])}</span>`;
    if (t[0] === 't') return `<span class="ow">${esc(t[1])}</span>`;
    const [n, w] = t;
    return `<span class="w gw lv${gLevel(n)}" data-v="${n}" data-w="${w}">${esc(QD.verses[n][w])}</span>`;
  }).join('')}</div>`;
}
function gmPageHTML() {
  return `<div class="gpage${gSteps().includes('full') ? ' gfull' : ''}" id="gPage">${gmOrnSVG(gSteps())}
    <div class="grun"><span>الضحى</span><span>الجزء ٣٠</span></div>
    <div class="gtxt" id="gTxt">${GOLDD.page.map(gmLineHTML).join('')}</div>
    <div class="gpn">٥٩٦</div></div>`;
}
/* one font size for the whole page: the widest line (at natural spacing) just fits */
function gmFit(page) {
  const box = $('#gTxt', page); if (!box) return;
  const W = box.clientWidth, lh = box.clientHeight / 15;
  page.style.setProperty('--gfs', '20px');
  let worst = 1;
  for (const l of $$('.gl:not(.gh):not(.gb)', box)) { l.classList.add('measure'); worst = Math.max(worst, l.getBoundingClientRect().width); l.classList.remove('measure'); }
  const f = Math.min(20 * W * .985 / worst, lh * .58);
  page.style.setProperty('--gfs', f.toFixed(2) + 'px');
}
const GM = { L: null, mode: null, hl: null, onT: null, resize: null };
function openGoldMushaf() {
  const L = Gx.open('gmv', 'مصحفك المذهّب', 'crown'); GM.L = L; GM.mode = null;
  S.gold = S.gold || {};
  const draw = (anim) => {
    const t = gTotal(), nx = gNext(t), st = gSteps(t);
    L.stat.textContent = `${ARN(t)} / ${ARN(GM_MAX)}`;
    html(L.body, `<div class="gmwrap">
      <div class="gstat"><div class="gbar" role="progressbar" aria-valuemin="0" aria-valuemax="${GM_MAX}" aria-valuenow="${t}"><i style="width:${(100 * t / GM_MAX).toFixed(1)}%"></i>${GM_STEPS.map(s => `<b class="${t >= s.at ? 'on' : ''}" style="inset-inline-start:${(100 * s.at / GM_MAX).toFixed(1)}%" title="${s.t}"></b>`).join('')}</div>
        <p>${nx ? `التذهيب ${ARN(t)} من ${ARN(GM_MAX)} · التالي: <b>${nx.t}</b> عند ${ARN(nx.at)}` : '<b>اكتمل التذهيب.</b> صفحتك مذهّبة كاملة: احفظها واطبعها.'}</p></div>
      <div class="gzoom" id="gZoom">${gmPageHTML()}</div>
      <div class="gdock">
        <button class="btn btn-sun" id="gPlay">${ic('play')} استمع</button>
        <button class="btn btn-line" id="gGild">${ic('crown')} ذهّب آية</button>
        <button class="btn btn-line" id="gLive">${ic('mic')} سمّع على الصفحة</button>
        <button class="btn btn-line" id="gEye">${ic('eye')} أين مكانها؟</button>
        <button class="btn btn-line" id="gSave">${ic('download')} احفظ صفحتك</button>
        <button class="iconbtn" id="gZ" aria-label="تكبير الصفحة">${ic('expand')}</button>
      </div>
      <div class="gpanel" id="gPanel" hidden></div>
      <div class="card gsteps"><h3>مراحل التذهيب</h3><ol>${GM_STEPS.map(s => `<li class="${st.includes(s.k) ? 'on' : ''}"><i>${st.includes(s.k) ? ic('check') : ARN(s.at)}</i><span><b>${s.t}</b><small>${s.d}</small></span></li>`).join('')}</ol>
        <p class="dim" style="margin-top:8px">كل آية تتقنها تصير ذهبًا، وتزداد لمعانًا كلما راجعتها في يومٍ جديد: من «حبرٍ ذهبي» إلى «ذهبٍ خالص». التذهيب فنٌّ قديم كان الخطّاطون يزيّنون به المصاحف بماء الذهب.</p></div>
      <div class="card glevels"><h3>آياتك</h3><div class="glv">${verseRange(1, NV).map(n => `<button class="gvchip lv${gLevel(n)}" data-gv="${n}"><b>${ARN(n)}</b><span>${GM_LV[gLevel(n)]}</span><i>${'●'.repeat(gLevel(n))}${'○'.repeat(4 - gLevel(n))}</i></button>`).join('')}</div></div>
      <small class="dim gsrc">الصفحة ٥٩٦ بتخطيط مصحف المدينة النبوية (١٥ سطرًا)، والنص العثماني من Quran.com. الخط: Scheherazade New.</small>
    </div>`);
    const page = $('#gPage', L.body);
    requestAnimationFrame(() => gmFit(page));
    if (anim) gmCelebrate(anim);
  };
  GM.draw = draw;
  draw(gmNewSteps());
  GM.resize = () => { const p = $('#gPage', L.body); if (p) gmFit(p); };
  window.addEventListener('resize', GM.resize);
  /* highlight the word being recited */
  GM.onT = t => { const p = $('#gPage', L.body); if (!p) return; const k = t.n + ':' + t.w; if (p.dataset.hl === k) return; p.dataset.hl = k; $$('.gw.on', p).forEach(x => x.classList.remove('on')); if (t.w >= 0) { const w = $(`.gw[data-v="${t.n}"][data-w="${t.w}"]`, p); if (w) w.classList.add('on'); } };
  GM.onP = ev => { if (ev === 'end') { const p = $('#gPage', L.body); if (p) { p.dataset.hl = ''; $$('.gw.on', p).forEach(x => x.classList.remove('on')); } const b = $('#gPlay', L.body); if (b) b.innerHTML = `${ic('play')} استمع`; } };
  Ticks.add(GM.onT); Player.subs.add(GM.onP);
  L.onClose = () => { Ticks.delete(GM.onT); Player.subs.delete(GM.onP); window.removeEventListener('resize', GM.resize); GM.L = null; GM.mode = null; };
  L.body.onclick = e => {
    if (GM.mode) return;
    const gv = e.target.closest('[data-gv]'); if (gv) { gmGild(+gv.dataset.gv); return; }
    const id = e.target.closest('button')?.id;
    if (id === 'gPlay') { Sfx.init(); if (Player.state !== 'idle') { stopAll(); return; } playSeq([0, ...verseRange(1, NV)]); e.target.closest('button').innerHTML = `${ic('pause')} أوقف`; return; }
    if (id === 'gGild') { gmPick(); return; }
    if (id === 'gLive') { openLive({ mode: 'page' }); return; }
    if (id === 'gEye') { gmQuiz(); return; }
    if (id === 'gSave') { gmSave(); return; }
    if (id === 'gZ') { const z = $('#gZoom', L.body); z.classList.toggle('big'); requestAnimationFrame(() => gmFit($('#gPage', L.body))); return; }
    const am = e.target.closest('.gam'); if (am) { Sfx.init(); playSeq([+am.dataset.n]); return; }
    const w = e.target.closest('.gw'); if (w) { Sfx.init(); wordPop(w, +w.dataset.v, +w.dataset.w); }
  };
}
/* milestones not yet celebrated */
function gmNewSteps() {
  const st = gSteps(), seen = S.goldSeen || 0, idx = GM_STEPS.filter(s => st.includes(s.k)).length;
  if (idx > seen) { S.goldSeen = idx; save(); return GM_STEPS.slice(seen, idx).map(s => s.k); }
  return null;
}
function gmCelebrate(keys) {
  const L = GM.L; if (!L || !keys || !keys.length) return;
  const p = $('#gPage', L.body); if (!p) return;
  for (const k of keys) { const g = $('.m-' + k, p); if (g) g.classList.add('gnew'); }
  if (keys.includes('head')) $$('.gcart.gold', p).forEach(x => x.classList.add('gnew'));
  const last = GM_STEPS.find(s => s.k === keys[keys.length - 1]);
  setTimeout(() => { toast(`اكتمل في صفحتك: ${last.t}`, 'crown'); Sfx.win(); buzz([20, 40, 20, 40, 60]); }, 500);
  if (keys.includes('full')) award('goldfull');
}
function gmPanel(htmlStr) { const pn = $('#gPanel', GM.L.body); pn.hidden = !htmlStr; pn.innerHTML = htmlStr || ''; if (htmlStr) pn.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); return pn; }
function gmPick() {
  const today = dayKey();
  gmPanel(`<p><b>اختر آية لتذهّبها.</b> تسمّعها من حفظك، فإن أتقنتها ازداد ذهبها درجة (مرة في اليوم لكل آية).</p>
    <div class="glv">${verseRange(1, NV).map(n => { const g = (S.gold && S.gold[n]) || {}; const done = g.d === today, lv = gLevel(n); return `<button class="gvchip lv${lv}${done ? ' today' : ''}" data-pk="${n}" ${lv >= 4 ? 'disabled' : ''}><b>${ARN(n)}</b><span>${lv >= 4 ? 'ذهبٌ خالص' : done ? 'ذُهّبت اليوم' : GM_LV[lv]}</span></button>`; }).join('')}</div>
    <button class="btn btn-line btn-wide" data-pc>إلغاء</button>`).onclick = e => {
    if (e.target.closest('[data-pc]')) { gmPanel(''); return; }
    const b = e.target.closest('[data-pk]'); if (b && !b.disabled) gmGild(+b.dataset.pk);
  };
}
async function gmGild(n) {
  const L = GM.L, p = $('#gPage', L.body); if (!p) return;
  const g = (S.gold = S.gold || {})[n] || { c: 0, d: null };
  if (gLevel(n) >= 4) { toast(`الآية ${ARN(n)} ذهبٌ خالص`, 'crown'); return; }
  GM.mode = 'gild'; stopAll();
  const ws = $$(`.gw[data-v="${n}"]`, p);
  p.classList.add('gfocus'); ws.forEach(w => w.classList.add('ghid', 'gsel'));
  ws[0]?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  const end = () => { p.classList.remove('gfocus'); ws.forEach(w => w.classList.remove('ghid', 'gsel')); GM.mode = null; };
  const pn = gmPanel(`<p><b>الآية ${ARN(n)}</b>: سمّعها من حفظك بصوتٍ مسموع، ثم اكشفها وقارن.</p>
    <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn btn-sun" data-a="show">${ic('eye')} اكشف الآية</button><button class="btn btn-line" data-a="hint">تلميح: أول كلمة</button><button class="btn btn-line" data-a="x">إلغاء</button></div>`);
  const act = await new Promise(res => { pn.onclick = e => { const a = e.target.closest('[data-a]')?.dataset.a; if (a === 'hint') { ws[0].classList.remove('ghid'); return; } if (a) res(a); }; });
  if (act === 'x') { end(); gmPanel(''); return; }
  ws.forEach(w => w.classList.remove('ghid'));
  pn.innerHTML = `<p><b>هل قلتها كما هي؟</b> كن صادقًا مع نفسك: الذهب لا يلمع بالمجاملة.</p>
    <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn btn-sun" data-a="ok">${ic('check')} أتقنتها</button><button class="btn btn-line" data-a="no">ليس بعد</button><button class="btn btn-line" data-a="hear">${ic('sound')} اسمعها</button></div>`;
  let r;
  for (;;) { r = await new Promise(res => { pn.onclick = e => { const a = e.target.closest('[data-a]')?.dataset.a; if (a) res(a); }; }); if (r !== 'hear') break; Sfx.init(); playSeq([n]); }
  stopAll(); end();
  if (r === 'no') { gmPanel(`<p>لا بأس. اسمعها ثلاث مرات وردّدها، ثم عُد إليها: الذهب ينتظرك.</p><button class="btn btn-line btn-wide" data-a="x">حسنًا</button>`).onclick = e => { if (e.target.closest('[data-a]')) gmPanel(''); }; return; }
  const today = dayKey();
  if (g.d === today) { gmPanel(''); toast('أحسنت! ذهّبتها اليوم، وعُد غدًا ليزداد لمعانها', 'crown'); Sfx.ok(); return; }
  const before = gLevel(n);
  S.gold[n] = { c: Math.min(4, (g.c || 0) + 1), d: today }; save(); sqNote([n]);
  addXP(8); award('goldfirst');
  const after = gLevel(n);
  gmPanel('');
  GM.draw(gmNewSteps());
  const p2 = $('#gPage', GM.L.body);
  $$(`.gw[data-v="${n}"], .gam[data-n="${n}"]`, p2).forEach(w => w.classList.add('gilding'));
  if (after > before) { toast(`الآية ${ARN(n)}: ${GM_LV[after]}`, 'crown'); Sfx.ok(); buzz([16, 30, 16]); }
  else toast('أحسنت! مستواها من محطتك أعلى أصلًا؛ راجع المحطة ليزداد', 'check');
}
/* «أين مكانها؟»: the words are hidden in their places; find where a word lives on the page */
async function gmQuiz() {
  const L = GM.L, p = $('#gPage', L.body); if (!p) return;
  GM.mode = 'quiz'; stopAll();
  const all = $$('.gw', p), byText = {};
  for (const w of all) { const t = QD.verses[+w.dataset.v][+w.dataset.w]; (byText[t] = byText[t] || []).push(w); }
  const uniq = Object.values(byText).filter(a => a.length === 1).map(a => a[0]);
  const qs = shuffle(uniq).slice(0, 6);
  p.classList.add('gq'); p.scrollIntoView({ block: 'start', behavior: 'smooth' });
  let good = 0;
  const finish = () => { p.classList.remove('gq'); $$('.gok,.gbad,.gshow', p).forEach(x => x.classList.remove('gok', 'gbad', 'gshow')); GM.mode = null; };
  for (let i = 0; i < qs.length; i++) {
    const target = qs[i], word = QD.verses[+target.dataset.v][+target.dataset.w];
    const pn = gmPanel(`<div class="gqh"><span class="dim">${ARN(i + 1)} / ${ARN(qs.length)}</span><span>أين مكان</span><span class="qt gqw">${esc(word)}</span><span>في الصفحة؟</span></div><p class="dim" style="text-align:center">اضغط موضعها بين الكلمات المخفية. <button class="linkb" data-a="x">إنهاء</button></p>`);
    const res = await new Promise(rs => {
      pn.onclick = e => { if (e.target.closest('[data-a="x"]')) rs('x'); };
      p.onclick = e => { const w = e.target.closest('.gw'); if (w) { e.stopPropagation(); rs(w); } };
    });
    p.onclick = null;
    if (res === 'x') { finish(); gmPanel(''); return; }
    if (res === target) { good++; target.classList.add('gok'); Sfx.ok(); buzz(14); }
    else { res.classList.add('gbad'); target.classList.add('gshow'); Sfx.bad(); buzz([30, 40, 30]); }
    await new Promise(r => setTimeout(r, 1100));
    res.classList.remove('gbad');
  }
  finish();
  addXP(good * 4);
  if (good === qs.length) award('goldeye');
  S.best.goldeye = Math.max(S.best.goldeye || 0, good); save();
  gmPanel(`<div class="gqh"><b>${ARN(good)} من ${ARN(qs.length)}</b></div><p style="text-align:center">${good === qs.length ? 'عينك تحفظ الصفحة كما يحفظها الحفّاظ!' : 'الحافظ يرى موضع الآية في الصفحة. أعد اللعبة بعد استماعٍ للصفحة.'}</p><button class="btn btn-line btn-wide" data-a="ok">تم</button>`).onclick = e => { if (e.target.closest('[data-a]')) gmPanel(''); };
}
function svgToImage(svg) {
  return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });
}
/* print-quality render of the page as it stands (canvas, real fonts) */
async function gmRender(px = 1500) {
  await fontsReady();
  try { await document.fonts.load(`700 60px "Scheherazade New"`, 'وَٱلضُّحَىٰ ۝١'); } catch (e) { }
  const W = px, H = Math.round(px * 1.44), k = W / 1000, steps = gSteps();
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  const bg = c.createRadialGradient(W / 2, H * .45, W * .08, W / 2, H / 2, W * .95);
  bg.addColorStop(0, '#fcf6e6'); bg.addColorStop(1, steps.includes('full') ? '#ead39c' : '#eadcb8'); c.fillStyle = bg; c.fillRect(0, 0, W, H);
  const orn = await svgToImage(gmOrnSVG(steps, { headers: true, size: [W, H] }));
  c.drawImage(orn, 0, 0, W, H);
  const x0 = GP.tx0 * k, x1 = GP.tx1 * k, lh = GP.lh * k, top = GP.ty0 * k, lineW = x1 - x0;
  const tokTxt = t => t[0] === 'm' || t[0] === 'e' ? '۝' + ARN(t[1]) : t[0] === 't' ? t[1] : QD.verses[t[0]][t[1]];
  const F0 = 40;
  c.font = `400 ${F0}px "Scheherazade New"`; c.direction = 'rtl';
  let worst = 1;
  for (const line of GOLDD.page) if (Array.isArray(line)) { const ws = line.map(t => c.measureText(tokTxt(t)).width); worst = Math.max(worst, ws.reduce((a, b) => a + b, 0) + (ws.length - 1) * F0 * .28); }
  const F = Math.min(F0 * lineW * .985 / worst, lh * .6);
  const gold = (y) => { const g = c.createLinearGradient(0, y - F * .9, 0, y + F * .5); g.addColorStop(0, '#f8e39a'); g.addColorStop(.5, '#c9962a'); g.addColorStop(1, '#8a5f14'); return g; };
  GOLDD.page.forEach((line, i) => {
    const yc = top + (i + .5) * lh, base = yc + F * .3;
    c.textAlign = 'center'; c.shadowBlur = 0;
    if (line.h) { const gl = line.h === 'الضحى' && steps.includes('head'); c.font = `700 ${F * 1.05}px "Aref Ruqaa"`; c.fillStyle = gl ? gold(base) : '#3b2a10'; c.fillText('سورة ' + line.h, W / 2, yc + F * .35); return; }
    c.font = `400 ${F}px "Scheherazade New"`;
    if (line.b) { c.fillStyle = '#2b2013'; c.fillText(QD.verses[0].join(' '), W / 2, base); return; }
    const ws = line.map(t => c.measureText(tokTxt(t)).width), sum = ws.reduce((a, b) => a + b, 0);
    const gap = line.length > 1 ? (lineW - sum) / (line.length - 1) : 0;
    let x = x1; c.textAlign = 'right';
    line.forEach((t, j) => {
      const lv = t[0] === 'm' ? gLevel(t[1]) : typeof t[0] === 'number' ? gLevel(t[0]) : -1;
      if (lv >= 2) { c.fillStyle = gold(base); c.shadowColor = 'rgba(236,184,70,.55)'; c.shadowBlur = lv >= 3 ? 10 * k : 0; }
      else if (lv === 1) { c.fillStyle = '#a77d24'; c.shadowBlur = 0; }
      else { c.fillStyle = lv === 0 ? '#22190e' : 'rgba(34,25,14,.78)'; c.shadowBlur = 0; }
      c.fillText(tokTxt(t), x, base);
      x -= ws[j] + gap;
    });
  });
  c.shadowBlur = 0; c.textAlign = 'center';
  c.font = `600 ${18 * k}px "Readex Pro"`; c.fillStyle = '#6b5428';
  c.fillText('الضحى', (GP.tx1 - 60) * k, 46 * k); c.fillText('الجزء ٣٠', (GP.tx0 + 60) * k, 46 * k);
  c.font = `700 ${22 * k}px "Readex Pro"`; c.fillStyle = '#5a4520'; c.fillText('٥٩٦', W / 2, (GP.by1 + 38) * k);
  c.font = `500 ${14 * k}px "Readex Pro"`; c.fillStyle = 'rgba(90,69,32,.78)';
  let hd = ''; try { hd = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()); } catch (e) { }
  c.fillText('مصحفي المذهّب · رحلة الضحى', W * .75, (GP.by1 + 38) * k);
  if (hd) c.fillText(hd, W * .25, (GP.by1 + 38) * k);
  return cv;
}
async function gmSave() {
  const b = $('#gSave', GM.L.body); if (b) { b.disabled = true; b.innerHTML = `${ic('timer')} لحظة…`; }
  try { const cv = await gmRender(1500); await saveImage(cv, 'mushaf-mudhahhab-596.png'); }
  catch (e) { console.error(e); toast('تعذّر حفظ الصفحة', 'x'); }
  finally { if (b) { b.disabled = false; b.innerHTML = `${ic('download')} احفظ صفحتك`; } }
}

/* =====================================================================================
   108 · سماء الكلمات
   ===================================================================================== */
const SKY_FACT = {
  'ض ح و': 'جذرٌ نادر: ورد ٧ مرات فقط في ٥ سور، وبه أقسم الله في أول السورة: ﴿وَٱلضُّحَىٰ﴾.',
  'ل ي ل': 'ورد ٩٢ مرة في ٤٩ سورة، منها «ليلة» ٨ مرات.',
  'س ج و': 'كلمةٌ فريدة: جذرها لم يرد في القرآن كله إلا في هذا الموضع.',
  'و د ع': 'فعل «ودّع» لم يرد في القرآن إلا هنا. ومن جذره «مستودع» مرتين، و«دَعْ» مرة.',
  'ر ب ب': 'من أكثر جذور القرآن: ٩٨٠ مرة في ٩٤ سورة. وتكررت «ربك» في هذه السورة ثلاث مرات.',
  'ق ل ي': 'فعل «قلى» لم يرد إلا هنا، ومن جذره «القالين» مرة واحدة في سورة الشعراء.',
  'أ خ ر': 'ورد ٢٥٠ مرة في ٦٤ سورة: الآخرة والآخِر والتأخير.',
  'خ ي ر': 'ورد ١٩٦ مرة، منها كلمة «خير» ١٧٨ مرة.',
  'أ و ل': 'ورد ١٢٥ مرة، منها «الأول» بصيغه ٨٢ مرة، و«التأويل» ١٧ مرة.',
  'ع ط و': 'جذرٌ قليل: ١٤ مرة فقط، منها «عطاء» ٥ مرات.',
  'ر ض و': 'ورد ٧٣ مرة: الرضا والرضوان ومرضاة الله.',
  'و ج د': 'فعل «وجد» ورد ١٠٦ مرات، ثلاثٌ منها متتالية في هذه السورة: يجدك، ووجدك، ووجدك.',
  'ي ت م': 'ورد ٢٣ مرة في ١٢ سورة، مرتين منها في هذه السورة.',
  'أ و ي': 'ورد ٣٦ مرة، أكثرها «مأوى» ٢٢ مرة، و«آوى» ٩ مرات.',
  'ض ل ل': 'ورد ١٩١ مرة في ٥٦ سورة، وجاءت بعده في الآية نفسها: «فهدى».',
  'ه د ي': 'من أكثر جذور القرآن: ٣١٦ مرة في ٦٢ سورة، و«هدى» فعلًا ١٤٤ مرة.',
  'ع ي ل': 'كلمةٌ نادرة: «عائلًا» لم ترد إلا هنا، ومن جذرها «عَيْلة» (أي الفقر) مرة في سورة التوبة.',
  'غ ن ي': 'ورد ٧٣ مرة، منها «الغنيّ» ٢٤ مرة.',
  'ق ه ر': 'فعل «تقهر» لم يرد إلا هنا، ومن جذره «القهّار» ٦ مرات و«القاهر» ٣ مرات.',
  'س أ ل': 'ورد ١٢٩ مرة، و«السائل» بصيغها ٧ مرات.',
  'ن ه ر': 'فعل «تنهر» ورد مرتين فقط: هنا عن السائل، وفي سورة الإسراء عن الوالدين: ﴿وَلَا تَنْهَرْهُمَا﴾. ومن جذره: النهار والأنهار.',
  'ن ع م': 'ورد ١٤٠ مرة، منها «نعمة» ٥٠ مرة.',
  'ح د ث': 'ورد ٣٦ مرة، أكثره «حديث» ٢٨ مرة، و«تحدّث» فعلًا ٣ مرات.',
};
const Sky = { L: null, key: null, occ: [], oi: -1, raf: 0, texts: null, P: null, base: null };
const skySurah = gi => { const st = GOLDD.sky.start; let lo = 0, hi = st.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (st[m] <= gi) lo = m; else hi = m - 1; } return [lo + 1, gi - st[lo] + 1]; };
const SkyA = new Audio(); SkyA.preload = 'none';
async function skyTexts() {
  if (Sky.texts) return Sky.texts;
  try { const r = await fetch('data/sky_verses.json'); if (r.ok) Sky.texts = await r.json(); } catch (e) { }
  return Sky.texts;
}
function openSky(startKey) {
  const L = Gx.open('skyv', 'سماء الكلمات', 'star'); Sky.L = L; Sky.key = null; Sky.oi = -1;
  S.sky = S.sky || [];
  html(L.body, `<div class="skywrap">
    <p class="muted skyhint">كل نقطةٍ هنا آيةٌ من القرآن: الفاتحة في القلب، والسور تدور حولها إلى «الناس» في الأطراف. المس كلمةً من السورة لتضيء أسرتها في القرآن كله.</p>
    <div class="skybox"><canvas id="skyCv" aria-label="سماء آيات القرآن"></canvas><span class="skytip" id="skyTip" hidden></span></div>
    <div class="skyinfo card" id="skyInfo"><p class="dim" style="text-align:center">اختر كلمةً من الآيات أدناه</p></div>
    <div class="skyverse card" id="skyVerse" hidden></div>
    <div class="skysura qt night" id="skySura">${verseRange(1, NV).map(n => QD.verses[n].map((w, i) => `<span class="w sw${GOLDD.sky.w[n + ':' + i].particle ? ' pt' : ''}" data-k="${n}:${i}">${esc(w)}</span>`).join(' ') + ' ' + marker(n)).join(' ')}</div>
    <small class="dim skysrc">الجذور من «المدوّنة القرآنية العربية» (Quranic Arabic Corpus v0.4) بعد مطابقتها بالنص العثماني من مشروع تنزيل. الأرقام تعدّ كل كلمة فيها الجذر مرة واحدة.</small>
  </div>`);
  L.stat.textContent = `${ARN(S.sky.length)} / ${ARN(SKY_ROOTS.length)}`;
  skyMount();
  $('#skySura', L.body).onclick = e => { const w = e.target.closest('.sw'); if (w) skySelect(w.dataset.k); };
  $('#skyVerse', L.body).onclick = e => {
    const a = e.target.closest('[data-sa]')?.dataset.sa; if (!a) return;
    if (a === 'prev') skyOcc(Sky.oi - 1); if (a === 'next') skyOcc(Sky.oi + 1);
    if (a === 'play') skyPlay(); if (a === 'x') { Sky.oi = -1; $('#skyVerse', L.body).hidden = true; SkyA.pause(); stopAll(); }
  };
  L.onClose = () => { cancelAnimationFrame(Sky.raf); SkyA.pause(); Sky.L = null; window.removeEventListener('resize', Sky.rs); };
  skySelect(startKey || '1:0');
}
const SKY_ROOTS = [...new Set(Object.values(GOLDD.sky.w).filter(x => x.root).map(x => x.root))];
function skyMount() {
  const L = Sky.L, cv = $('#skyCv', L.body), box = cv.parentElement;
  const size = Math.min(box.clientWidth, 560), dpr = Math.min(2.5, window.devicePixelRatio || 1);
  cv.style.width = size + 'px'; cv.style.height = size + 'px'; cv.width = Math.round(size * dpr); cv.height = Math.round(size * dpr);
  Sky.size = size; Sky.dpr = dpr;
  /* phyllotaxis: verse i sits at radius √i, turning by the golden angle — every verse of the Quran gets its own place */
  const N = 6236, R = size * .47, P = new Float32Array(N * 2), ga = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) { const r = R * Math.sqrt((i + .5) / N), t = i * ga - Math.PI / 2; P[2 * i] = size / 2 + r * Math.cos(t); P[2 * i + 1] = size / 2 + r * Math.sin(t); }
  Sky.P = P;
  const base = document.createElement('canvas'); base.width = cv.width; base.height = cv.height;
  const b = base.getContext('2d'); b.scale(dpr, dpr);
  const g = b.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size * .55);
  g.addColorStop(0, '#1b2358'); g.addColorStop(.6, '#0c1236'); g.addColorStop(1, '#05081a');
  b.fillStyle = g; b.beginPath(); b.arc(size / 2, size / 2, size * .5, 0, Math.PI * 2); b.fill();
  b.fillStyle = 'rgba(205,214,255,.30)';
  for (let i = 0; i < N; i++) b.fillRect(P[2 * i] - .55, P[2 * i + 1] - .55, 1.1, 1.1);
  /* Ad-Duha's own verses: a faint golden arc near the rim */
  b.fillStyle = 'rgba(255,214,140,.55)';
  for (let a = 1; a <= NV; a++) { const gi = GOLDD.sky.start[92] + a - 1; b.beginPath(); b.arc(P[2 * gi], P[2 * gi + 1], 1.6, 0, Math.PI * 2); b.fill(); }
  Sky.base = base;
  const sprite = (core, glow) => { const s = document.createElement('canvas'), n = Math.round(64 * dpr); s.width = s.height = n; const x = s.getContext('2d'), g = x.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
    g.addColorStop(0, core); g.addColorStop(.18, core); g.addColorStop(.32, glow); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, n, n); return s; };
  Sky.spW = sprite('#ffffff', 'rgba(205,220,255,.55)'); Sky.spG = sprite('#fff1c8', 'rgba(255,200,90,.7)');
  cancelAnimationFrame(Sky.raf);
  const loop = t => { skyDraw(t / 1000); Sky.raf = requestAnimationFrame(loop); };
  Sky.raf = requestAnimationFrame(loop);
  cv.onpointerdown = e => {
    const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    let best = -1, bd = 22 * 22;
    Sky.occ.forEach((gi, j) => { const dx = Sky.P[2 * gi] - x, dy = Sky.P[2 * gi + 1] - y, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = j; } });
    if (best >= 0) skyOcc(best);
  };
  Sky.rs = () => { if (!Sky.L) return; const w = Math.min($('.skybox', Sky.L.body).clientWidth, 560); if (Math.abs(w - Sky.size) > 4) skyMount(); };
  window.addEventListener('resize', Sky.rs);
}
function skyDraw(t) {
  if (!Sky.L || document.hidden) return;
  const cv = $('#skyCv', Sky.L.body); if (!cv) return;
  const c = cv.getContext('2d'), dpr = Sky.dpr, P = Sky.P;
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height); c.drawImage(Sky.base, 0, 0);
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const occ = Sky.occ, many = occ.length > 300, duhaStart = GOLDD.sky.start[92];
  if (occ.length > 1 && occ.length <= 40) {
    c.strokeStyle = 'rgba(255,220,150,.22)'; c.lineWidth = 1; c.beginPath();
    occ.forEach((gi, j) => { const x = P[2 * gi], y = P[2 * gi + 1]; if (j) c.lineTo(x, y); else c.moveTo(x, y); }); c.stroke();
  }
  const still = reduceMotion();
  occ.forEach((gi, j) => {
    const x = P[2 * gi], y = P[2 * gi + 1], duha = gi >= duhaStart && gi < duhaStart + NV;
    const tw = still ? .9 : .62 + .38 * Math.sin(t * 2.2 + gi * 1.7), r = duha ? 6 : many ? 2.4 : 3.6, s = r * 6.4;
    c.globalAlpha = tw; c.drawImage(duha ? Sky.spG : Sky.spW, x - s / 2, y - s / 2, s, s); c.globalAlpha = 1;
    if (j === Sky.oi) { c.strokeStyle = '#ffd27a'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, r * 2.6 + (still ? 0 : 2 * Math.sin(t * 4)), 0, Math.PI * 2); c.stroke(); }
  });
}
function skySelect(k) {
  const L = Sky.L, e = GOLDD.sky.w[k]; if (!L || !e) return;
  Sky.key = k; Sky.oi = -1; SkyA.pause();
  $$('.sw', L.body).forEach(x => x.classList.toggle('on', x.dataset.k === k || (e.root && GOLDD.sky.w[x.dataset.k].root === e.root)));
  const [n, w] = k.split(':').map(Number), word = QD.verses[n][w];
  $('#skyVerse', L.body).hidden = true;
  if (e.particle) {
    Sky.occ = [];
    html($('#skyInfo', L.body), `<div class="skyw qt">${esc(word)}</div><p style="text-align:center">كلمةٌ أداة تخدم المعنى ولا جذر لها، فلا سماء لها هنا. المس كلمةً أخرى.</p>`);
    return;
  }
  Sky.occ = e.refs.map(v => Math.floor(v / 200));
  if (!S.sky.includes(e.root)) { S.sky.push(e.root); save(); if (S.sky.length >= 10) award('sky'); L.stat.textContent = `${ARN(S.sky.length)} / ${ARN(SKY_ROOTS.length)}`; }
  const same = Object.entries(GOLDD.sky.w).filter(([kk, x]) => x.root === e.root).length;
  html($('#skyInfo', L.body), `<div class="skyw qt">${esc(word)}</div>
    <div class="skyroot"><span class="dim">الجذر</span>${e.root.split(' ').map(ch => `<b>${ch}</b>`).join('')}</div>
    <div class="skynums"><span><b>${ARN(e.n)}</b> ${e.n === 1 ? 'موضع' : e.n === 2 ? 'موضعان' : e.n <= 10 ? 'مواضع' : 'موضعًا'}</span><span><b>${ARN(e.sur)}</b> ${e.sur === 1 ? 'سورة' : e.sur === 2 ? 'سورتان' : e.sur <= 10 ? 'سور' : 'سورة'}</span>${same > 1 ? `<span><b>${ARN(same)}</b> في الضحى</span>` : ''}</div>
    <p class="skyfact">${qfmt(SKY_FACT[e.root] || `ورد هذا الجذر في القرآن ${ARN(e.n)} مرة في ${ARN(e.sur)} سورة.`)}</p>
    <button class="btn btn-line btn-wide" data-sk="first">${ic('star')} تجوّل بين مواضعها</button>`);
  $('#skyInfo', L.body).onclick = ev => { if (ev.target.closest('[data-sk]')) skyOcc(0); };
}
async function skyOcc(j) {
  const L = Sky.L, e = GOLDD.sky.w[Sky.key]; if (!L || !e || e.particle) return;
  j = (j + Sky.occ.length) % Sky.occ.length; Sky.oi = j;
  const v = e.refs[j], gi = Math.floor(v / 200), wi = v % 200, [s, a] = skySurah(gi);
  const box = $('#skyVerse', L.body); box.hidden = false;
  html(box, `<div class="row skyvh"><b>${GOLDD.sky.names[s - 1]}</b><span class="dim">الآية ${ARN(a)} · ${ARN(j + 1)} من ${ARN(Sky.occ.length)}</span></div><div class="qt night skyvt">…</div>
    <div class="row" style="gap:8px;justify-content:center;flex-wrap:wrap"><button class="iconbtn" data-sa="next" aria-label="الموضع التالي">${ic('chev')}</button><button class="btn btn-line" data-sa="play">${ic('sound')} اسمع</button><button class="iconbtn" data-sa="prev" aria-label="الموضع السابق" style="transform:scaleX(-1)">${ic('chev')}</button><button class="btn btn-line" data-sa="x">إغلاق</button></div>`);
  const T = await skyTexts(); if (Sky.oi !== j || !Sky.L) return;
  const text = (T && T[gi]) || '';
  let k = -1;
  const out = text.split(' ').map(tok => { if (/^[ۖ-ۭ۞۩]+$/.test(tok)) return `<span class="wm">${esc(tok)}</span>`; k++; return k === wi ? `<span class="hl">${esc(tok)}</span>` : esc(tok); }).join(' ');
  $('.skyvt', box).innerHTML = text ? `${out} <span class="am">۝${ARN(a)}</span>` : '<span class="dim">تعذّر تحميل نص الآية</span>';
  box.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}
function skyPlay() {
  const e = GOLDD.sky.w[Sky.key]; if (!e || Sky.oi < 0) return;
  const gi = Math.floor(e.refs[Sky.oi] / 200), [s, a] = skySurah(gi);
  stopAll(); SkyA.pause(); Sfx.init();
  if (s === 93) { playSeq([a]); return; }
  const pad = x => String(x).padStart(3, '0');
  SkyA.src = `https://everyayah.com/data/Alafasy_64kbps/${pad(s)}${pad(a)}.mp3`;
  SkyA.onerror = () => toast('الاستماع لآيات السور الأخرى يحتاج اتصالًا بالإنترنت', 'sound');
  SkyA.play().catch(() => toast('الاستماع لآيات السور الأخرى يحتاج اتصالًا بالإنترنت', 'sound'));
}

/* =====================================================================================
   107 · قصر الذاكرة: a real old house, one verse in each place
   ===================================================================================== */
const PALACE = [
  { name: 'الباب الخشبي', x: 50, y: 34, cue: 'شمس الصباح تسقط على خشب الباب فيلمع كالذهب. هنا يبدأ الضحى.' },
  { name: 'الدهليز المعتم', x: 26, y: 40, cue: 'ممرٌّ ساكنٌ معتم كليلٍ هادئ، وفي آخره قمرٌ صغير.' },
  { name: 'قنديل القوس', x: 51, y: 72, cue: 'تحت القوس قنديلٌ معلّق لم يُطفأ ولم يُترك.' },
  { name: 'الرواق الطويل', x: 48, y: 66, cue: 'رواقٌ يمتد أمامك، وكل قوسٍ بعده أجمل من الذي قبله.' },
  { name: 'الليوان المزخرف', x: 50, y: 70, cue: 'الليوان مليءٌ بالهدايا، تفتحها واحدةً بعد واحدة حتى ترضى.' },
  { name: 'البحرة في الفناء', x: 44, y: 80, cue: 'البحرة في قلب البيت، والفناء يضمّ كل من جاءه كأنه مأوى.' },
  { name: 'المشربية', x: 45, y: 38, cue: 'من بين خشب المشربية يلمع نجمٌ يدلّك على الطريق.' },
  { name: 'شجرة النارنج', x: 36, y: 30, cue: 'شجرةٌ مثقلة بالثمر، وثمرها يملأ الأرض حولها.' },
  { name: 'الدرج الحجري', x: 30, y: 62, cue: 'على الدرج فسيلةٌ صغيرة، فتمشي بلطفٍ كي لا تؤذيها.' },
  { name: 'حلقة الباب الداخلي', x: 45, y: 52, cue: 'أحدهم يطرق الحلقة… فتفتح الباب بابتسامة ولا تردّه.' },
  { name: 'السقف المضيء', x: 74, y: 30, cue: 'نورٌ يتسلل من النافذة العالية فيملأ السقف المزخرف، فتحدّث به.' },
];
const palImg = n => `img/pal${n}.jpg`;
const palCred = n => { const m = MEDIA.img && MEDIA.img['pal' + n]; return m ? `${esc(m.creator)} · ${esc(m.license)}` : ''; };
function palFigure(n, withSym = true) {
  const P = PALACE[n - 1];
  return `<figure class="palph"><span class="palimg"><img src="${palImg(n)}" alt="${P.name}">${withSym ? `<span class="palsym" style="left:${P.x}%;top:${P.y}%">${sy(VERSES[n].sym)}</span>` : ''}</span><figcaption>${palCred(n)}</figcaption></figure>`;
}
function openPalace() {
  const b = openRunner('قصر الذاكرة'); Run.game = 'palace';
  S.palace2 = S.palace2 || {};
  (async () => {
    html(b, `${stepHead('قصر الذاكرة', 'طريقة يستعملها أبطال الذاكرة في العالم: تضع كل آية في مكان، ثم تمشي في المكان بخيالك فتخرج الآيات بالترتيب')}
      <div class="palmos">${[1, 3, 6, 9].map(n => `<img src="${palImg(n)}" alt="" loading="lazy">`).join('')}<span>بيتٌ عربي قديم · ١١ مكانًا لـ١١ آية</span></div>
      <div class="panel"><p>تدخل من الباب، وتمشي في الدهليز، إلى الفناء والليوان والدرج… وفي كل مكان رمزُ آية. بعد جولتين يكفيك أن تتخيّل البيت لتستدعي السورة كلها بالترتيب.</p><p class="dim" style="font-size:13px;margin-top:6px">صورٌ حقيقية لأماكن من بيوتٍ عربية قديمة، أكثرها في دمشق، وبعضها من حلب والقاهرة.</p></div>
      <button class="btn btn-sun btn-wide" data-pa="tour">${ic('palace')} ادخل البيت</button>
      ${S.palace2.toured ? `<button class="btn btn-line btn-wide" data-pa="test">${ic('bolt')} امتحن ذاكرتك في البيت${S.palace2.best != null ? ` · أفضل نتيجة ${ARN(S.palace2.best)}٪` : ''}</button>` : ''}
      <button class="btn btn-line btn-wide" data-pa="own">${ic('home')} ابنِ قصرك في بيتك أنت</button>`);
    const ch = await pend(res => { b.onclick = e => { const x = e.target.closest('[data-pa]'); if (x) { b.onclick = null; res(x.dataset.pa); } }; });
    if (ch === 'own') return runPalace();
    if (ch === 'tour') await palTour();
    await palTest();
  })().catch(e => { if (e !== CLOSED) console.error(e); });
}
async function palTour() {
  for (let n = 1; n <= NV; n++) {
    setProg(n - 1, NV + 1);
    const P = PALACE[n - 1], v = VERSES[n];
    html(Run.body, `${stepHead(P.name, `المكان ${ARN(n)} من ${ARN(NV)} · رمزه: ${v.symName}`)}
      ${palFigure(n)}
      <p class="palcue">${P.cue}</p>
      <div class="qt night qbig palv" id="palV" hidden>${verseHTML(n)}</div>
      <button class="btn btn-sun btn-wide" id="palB">${ic('eye')} أظهر آية هذا المكان</button>`);
    await until($('#palB'));
    $('#palV').hidden = false; Sfx.init(); playSeq([n]);
    $('#palB').innerHTML = n < NV ? `المكان التالي ${ic('chev')}` : 'أنهيت الجولة';
    await until($('#palB'));
    stopAll(); gain(5);
  }
  award('palace');
  S.palace2.toured = dayKey(); save();
  setProg(NV, NV + 1);
  html(Run.body, `${stepHead('أغمض عينيك', 'امشِ في البيت بخيالك: الباب، الدهليز، القنديل… وقل آية كل مكان')}
    <div class="palmos small">${verseRange(1, NV).map(n => `<img src="${palImg(n)}" alt="" loading="lazy">`).join('')}</div>
    <button class="btn btn-sun btn-wide" id="palGo">${ic('bolt')} الآن امتحن ذاكرتك</button>`);
  await until($('#palGo'));
}
async function palTest() {
  const order = verseRange(1, NV); let good = 0, total = 0;
  /* 1) walk the house in order: the place alone, the verse from memory */
  for (let i = 0; i < order.length; i++) {
    const n = order[i]; setProg(i, NV + 5);
    html(Run.body, `${stepHead('امشِ وسمّع', `${PALACE[n - 1].name} · ما آية هذا المكان؟`)}
      ${palFigure(n, false)}
      <div class="qt night qbig palv" id="palV" hidden>${verseHTML(n)}</div>
      <button class="btn btn-sun btn-wide" id="palB">${ic('eye')} أظهر الآية</button>`);
    await until($('#palB'));
    $('#palV').hidden = false; Sfx.init(); playSeq([n]);
    html($('#palB').parentElement.appendChild(node('<div class="row palgr" style="gap:10px;justify-content:center"></div>')), `<button class="btn btn-sun" data-r="1">${ic('check')} عرفتها</button><button class="btn btn-line" data-r="0">نسيتها</button>`);
    $('#palB').remove();
    const r = await pend(res => { $('.palgr').onclick = e => { const x = e.target.closest('[data-r]'); if (x) res(+x.dataset.r); }; });
    stopAll(); total++; if (r) { good++; hit(); } else miss();
  }
  /* 2) the other direction: a verse, and where it lives */
  const qs = shuffle(order).slice(0, 5);
  for (let i = 0; i < qs.length; i++) {
    const n = qs[i]; setProg(NV + i, NV + 5);
    const opts = shuffle([n, ...shuffle(order.filter(x => x !== n)).slice(0, 3)]);
    html(Run.body, `${stepHead('أين وضعتها؟', 'اختر مكان هذه الآية في البيت')}
      <div class="panel"><div class="qt night qbig">${verseHTML(n)}</div></div>
      <div class="palopts">${opts.map(o => `<button class="palopt" data-o="${o}"><img src="${palImg(o)}" alt=""><span>${PALACE[o - 1].name}</span></button>`).join('')}</div>`);
    const pickd = await pend(res => { Run.body.onclick = e => { const x = e.target.closest('[data-o]'); if (x) { Run.body.onclick = null; res(+x.dataset.o); } }; });
    total++;
    const btn = $(`.palopt[data-o="${pickd}"]`), right = $(`.palopt[data-o="${n}"]`);
    if (pickd === n) { good++; hit(); btn.classList.add('ok'); } else { miss(); btn.classList.add('bad'); right.classList.add('ok'); }
    await new Promise(r => setTimeout(r, 900));
  }
  const pct = Math.round(100 * good / total);
  S.palace2.best = Math.max(S.palace2.best || 0, pct); save();
  if (pct === 100) award('palace2');
  gain(20 + good * 2);
  await celebrate({ title: `${ARN(pct)}٪`, sub: pct === 100 ? 'ذاكرتك تمشي في البيت ولا تضيع فيه!' : 'كرّر الجولة في خيالك قبل النوم: المكان يستدعي الآية', stars: pct >= 95 ? 3 : pct >= 75 ? 2 : 1, again: () => openPalace() });
}

/* ---------- the golden row on Home ---------- */
function goldRow() {
  const t = gTotal();
  return `<div class="goldrow"><span class="eyebrow gold-eb">${ic('crown')} الذهبية</span>
    <button class="card goldc tjc" data-go="tja">${ic('bulb')}<b>أكاديمية التجويد</b><span class="dim">${S.tja && Object.keys(S.tja.s || {}).length ? `إتقانك ${ARN(Math.round(tjMastery() * 100))}٪ · لماذا هذا الحكم؟` : 'كل حكمٍ في السورة، ولماذا هو هكذا لا غيره'}</span></button>
    ${prophetsTile()}
    <button class="card goldc libc" data-go="library">${ic('download')}<b>مكتبة الضحى</b><span class="dim">${PACKS.filter(p => libHas(p.id)).length ? `على جهازك ${ARN(PACKS.filter(p => libHas(p.id)).length)} من ${ARN(PACKS.length)} حزم` : 'اختر حزم المشاهد والصور التي تحبها'}</span></button>
    <button class="card goldc" data-go="oasis3d">${ic('lantern')}<b>واحة الضحى ٣D</b><span class="dim">${S.best && S.best.world3d ? `جمعت ${cnt(S.best.world3d, AYA)}` : 'فوانيس الكلمات في ليل الواحة'}</span></button>
    <button class="card goldc" data-go="gold"><span class="gmini" aria-hidden="true">${verseRange(1, NV).map(n => `<i class="lv${gLevel(n)}"></i>`).join('')}</span><b>مصحفك المذهّب</b><span class="dim">${t >= GM_MAX ? 'صفحتك مذهّبة كاملة' : `التذهيب ${ARN(t)} من ${ARN(GM_MAX)}`}</span></button>
    <button class="card goldc" data-go="live">${ic('mic')}<b>التسميع الحيّ</b><span class="dim">${S.live && S.live.best != null ? `أفضل نتيجة ${ARN(S.live.best)}٪` : 'سمّع، وكل كلمة تقولها تصير ذهبًا'}</span></button>
    <button class="card goldc" data-go="mirror">${ic('wave')}<b>مرآة التلاوة</b><span class="dim">${S.mirror && S.mirror.rec && S.mirror.rec.length ? `سجّلت ${ARN(S.mirror.rec.length)} من ${ARN(NV)} آية` : 'ترى صوت القارئ وتعدّ حركات المدّ'}</span></button>
    <button class="card goldc" data-go="imm">${ic('globe')}<b>الضحى الغامر ٣٦٠°</b><span class="dim">${S.imm && S.imm.seen ? `زرت ${ARN(S.imm.seen.length)} من ${ARN(IMM.length)} مشاهد` : 'ادخل المشهد والتفت حولك'}</span></button>
    <button class="card goldc" data-go="treasure">${ic('chest')}<b>كنز الضحى في بيتك</b><span class="dim">${S.treasure && S.treasure.wins ? `وجدتم الكنز ${ARN(S.treasure.wins)} مرة` : 'بطاقات مخبّأة وكنزٌ حقيقي'}</span></button>
    <button class="card goldc" data-go="pp">${ic('headphones')}<b>مشغّل الحفظ</b><span class="dim">تكرار الحفّاظ، والشاشة مطفأة</span></button>
    <button class="card goldc" data-go="studio">${ic('film')}<b>استوديو الضحى</b><span class="dim">${S.studio && S.studio.made ? `صنعت ${ARN(S.studio.made)} فيلم` : 'فيلمٌ بآياتك للحالة والستوري'}</span></button>
    <button class="card goldc" data-go="square">${ic('people')}<b>ساحة الأمة الحية</b><span class="dim">نقاطٌ ذهبية لمن يسمّع اليوم</span></button>
    <button class="card goldc" data-go="sky">${ic('star')}<b>سماء الكلمات</b><span class="dim">${S.sky && S.sky.length ? `اكتشفت ${ARN(S.sky.length)} من ${ARN(SKY_ROOTS.length)} جذرًا` : 'كل كلمة وأسرتها في القرآن كله'}</span></button>
    <button class="card goldc" data-go="palace">${ic('palace')}<b>قصر الذاكرة</b><span class="dim">${S.palace2 && S.palace2.toured ? `أفضل نتيجة ${ARN(S.palace2.best || 0)}٪` : 'بيتٌ عربي قديم بصورٍ حقيقية'}</span></button>
  </div>`;
}
