/* =====================================================================================
   4.4 · مكتبة الضحى — content packs you choose, the cosmos and nature galleries,
   the 3D oasis with its games, and «مع القارئ»
   ===================================================================================== */

/* ---------- the library: packs live in the GitHub repository and are kept in Cache Storage ---------- */
const LIB_BASE = ['https://raw.githubusercontent.com/hadimalkobb-blip/Hadi/main/docs/packs/', 'https://cdn.jsdelivr.net/gh/hadimalkobb-blip/Hadi@main/docs/packs/'];
const LIB_CACHE = 'duha-packs-v1';
const libKey = (id, f) => `https://duha.pack/${id}/${f}`;
/* the app and web builds carry the packs inside (make_app.py / standalone.py flip this flag); the claude.ai page streams them */
const PACKS_BUNDLED = false;   // web build: every pack file sits next to the page
const PACKS_THUMBS = false;    // app and web builds: every thumbnail ships inside, so browsing works offline
const libHasFile = id => { const p = PACKS.find(x => x.id === id); return !!(p && PACKS_BUNDLED && p.b); };
function pkUrl(id, f) { const k = libKey(id, f); if (Lib.urls.has(k)) return Lib.urls.get(k); return libHasFile(id) ? `packs/${id}/${f}` : LIB_BASE[0] + id + '/' + f; }
const pkThumb = (id, th) => (PACKS_BUNDLED || PACKS_THUMBS) && (PACKS.find(x => x.id === id) || {}).b ? `packs/${id}/${th}` : pkUrl(id, th);
const libLocal = (id, f) => libHasFile(id) || Lib.cached.has(libKey(id, f));
const Lib = { L: null, dl: {}, urls: new Map(), cached: new Set(), busy: new Map() };
const libOK = () => typeof caches !== 'undefined' && typeof fetch === 'function' && window.isSecureContext !== false;
const libPack = id => PACKS.find(p => p.id === id);
const libHas = id => libHasFile(id) || !!(S.packs && S.packs[id] && S.packs[id].v === (libPack(id) || {}).v);
const fmtMB = b => ARN((b / 1048576).toFixed(b < 10485760 ? 1 : 0).replace('.', '٫')) + ' ميغا';
/* a pack file: next to the page (web), or kept on the phone, or fetched once from GitHub and then kept */
async function libFile(id, f, keep = true) {
  const k = libKey(id, f);
  if (Lib.urls.has(k)) return Lib.urls.get(k);
  if (libHasFile(id)) return `packs/${id}/${f}`;
  if (Lib.busy.has(k)) return Lib.busy.get(k);
  const job = (async () => {
    try { const c = await caches.open(LIB_CACHE), r = await c.match(k); if (r) { const u = URL.createObjectURL(await r.blob()); Lib.urls.set(k, u); Lib.cached.add(k); return u; } } catch (e) { }
    if (keep && libOK() && navigator.onLine !== false) {
      try {
        const b = await libFetch(id + '/' + f), c = await caches.open(LIB_CACHE);
        await c.put(k, new Response(b, { headers: { 'content-type': f.endsWith('.mp4') ? 'video/mp4' : f.endsWith('.json') ? 'application/json' : 'image/jpeg' } }));
        const u = URL.createObjectURL(b); Lib.urls.set(k, u); Lib.cached.add(k); return u;
      } catch (e) { }
    }
    return LIB_BASE[0] + id + '/' + f;   // could not keep it: stream it
  })();
  Lib.busy.set(k, job); try { return await job; } finally { Lib.busy.delete(k); }
}
/* which files are already on the phone, and blob URLs for the ones the app shows by itself (each verse's chosen scene) */
async function libWarm() {
  if (!libOK()) return;
  try { const c = await caches.open(LIB_CACHE); for (const r of await c.keys()) Lib.cached.add(r.url); } catch (e) { return; }
  for (const key of new Set(Object.values(S.sceneOf || {}))) { const r = pkItem(key); if (r && Lib.cached.has(libKey(r.p.id, r.it.f))) await libFile(r.p.id, r.it.f); }
}
setTimeout(() => libWarm().catch(() => { }), 600);
async function libFetch(path, onBytes) {
  let err;
  for (const base of LIB_BASE) {
    try {
      const r = await fetch(base + path, { cache: 'no-store' }); if (!r.ok) throw new Error('http ' + r.status);
      if (!r.body || !onBytes) return await r.blob();
      const rd = r.body.getReader(), parts = [];
      for (; ;) { const { done, value } = await rd.read(); if (done) break; parts.push(value); onBytes(value.length); }
      return new Blob(parts, { type: r.headers.get('content-type') || '' });
    } catch (e) { err = e; }
  }
  throw err;
}
async function libInstall(id) {
  const p = libPack(id); if (!p || Lib.dl[id]) return;
  if (!libOK()) { toast('التنزيل غير متاح هنا: افتح التطبيق أو نسخة الويب', 'x'); return; }
  const D = Lib.dl[id] = { got: 0, total: p.size, dead: false };
  libDraw();
  try {
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => { });
    const c = await caches.open(LIB_CACHE);
    for (const f of p.files) {
      if (D.dead) throw new Error('cancel');
      const k = libKey(id, f.p);
      if (await c.match(k)) { D.got += f.s; Lib.cached.add(k); libProg(id); continue; }
      const b = await libFetch(id + '/' + f.p, n => { D.got += n; libProg(id); });
      await c.put(k, new Response(b, { headers: { 'content-type': f.p.endsWith('.mp4') ? 'video/mp4' : f.p.endsWith('.json') ? 'application/json' : 'image/jpeg' } })); Lib.cached.add(k);
    }
    S.packs = S.packs || {}; S.packs[id] = { v: p.v, at: Date.now() }; save();
    award('pack'); toast(`نزلت «${p.t}»، وصارت تعمل بلا إنترنت`, 'check');
  } catch (e) {
    if (!D.dead) toast(e && e.name === 'QuotaExceededError' ? 'مساحة الجهاز لا تكفي لهذه الحزمة' : 'انقطع التنزيل، جرّب مرة أخرى', 'x');
  }
  delete Lib.dl[id]; libDraw();
}
async function libRemove(id) {
  const p = libPack(id); if (!p) return;
  try { const c = await caches.open(LIB_CACHE); for (const f of p.files) { await c.delete(libKey(id, f.p)); Lib.cached.delete(libKey(id, f.p)); } } catch (e) { }
  for (const f of p.files) { const k = libKey(id, f.p), u = Lib.urls.get(k); if (u && u.startsWith('blob:')) URL.revokeObjectURL(u); Lib.urls.delete(k); }
  if (S.packs) delete S.packs[id]; save(); libDraw();
  toast(`حُذفت «${p.t}» من جهازك`, 'check');
}
function libProg(id) {
  const D = Lib.dl[id], el = Lib.L && $(`[data-pk="${id}"] .lbbar i`, Lib.L.body), tx = Lib.L && $(`[data-pk="${id}"] .lbpct`, Lib.L.body);
  if (!D) return; const pct = clamp(D.got / D.total) * 100;
  if (el) el.style.width = pct.toFixed(1) + '%'; if (tx) tx.textContent = ARN(Math.round(pct)) + '٪';
}
function openLibrary() {
  const L = Gx.open('libv', 'مكتبة الضحى', 'download'); Lib.L = L;
  L.onClose = () => { Lib.L = null; };
  libDraw();
  if (navigator.storage && navigator.storage.estimate) navigator.storage.estimate().then(e => { const b = Lib.L && $('#lbSpace', Lib.L.body); if (b && e.quota) b.textContent = `المساحة المتاحة للتطبيق على جهازك: نحو ${fmtMB(Math.max(0, e.quota - e.usage))}`; }).catch(() => { });
}
function libDraw() {
  const L = Lib.L; if (!L) return;
  const total = PACKS.filter(p => libHas(p.id)).reduce((a, p) => a + p.size, 0);
  html(L.body, `<div class="lbwrap">
    <p class="muted sthint">كل ما في المكتبة جزءٌ من التطبيق: تختار منه مشهد كل آية، وخلفية أفلام الاستوديو، وتتأمله هنا. يبقى على GitHub ليخفّ التطبيق، ويُعرض لك بجودته الكاملة، وكل ما تختاره أو تشاهده يُحفظ على جهازك. ونزّل الحزمة كاملةً إن أردتها كلها بلا إنترنت.</p>
    <button class="btn btn-sun btn-wide" data-lbgo="scenes">${ic('film')} اختر مشهد كل آية</button>
    ${libOK() ? '' : '<p class="warn">التنزيل يعمل في تطبيق أندرويد ونسخة الويب. هنا تستطيع تصفّح الحزم وفتحها مباشرة من الإنترنت.</p>'}
    <div class="lbgrid">${PACKS.map(p => {
      const has = libHas(p.id), D = Lib.dl[p.id], pct = D ? clamp(D.got / D.total) * 100 : 0;
      return `<div class="lbcard${has ? ' has' : ''}" data-pk="${p.id}">
        <div class="lbcov" style="background-image:url('${pkThumb(p.id, p.cover)}')"><span class="lbic">${ic(p.ic)}</span>${has ? `<em>${ic('check')} ${libHasFile(p.id) ? 'مع الموقع' : 'كلها على جهازك'}</em>` : ''}</div>
        <div class="lbtx"><b>${p.t}</b><span>${p.d}</span><small class="dim">${ARN(p.n)} ${p.unit} · ${fmtMB(p.size)}</small></div>
        ${D ? `<div class="lbdl"><div class="gbar lbbar"><i style="width:${pct.toFixed(1)}%"></i></div><span class="lbpct">${ARN(Math.round(pct))}٪</span><button class="iconbtn" data-lb="stop" aria-label="إيقاف التنزيل">${ic('x')}</button></div>`
          : `<div class="row lbbtns"><button class="btn ${has ? 'btn-sun' : 'btn-line'}" data-lb="open">${ic(has ? 'play' : 'eye')} ${has ? 'افتح' : 'تصفّح'}</button>${libHasFile(p.id) ? '' : has ? `<button class="btn btn-line" data-lb="del">${ic('x')} احذف</button>` : `<button class="btn btn-sun" data-lb="get">${ic('download')} نزّلها كلها</button>`}</div>`}
      </div>`; }).join('')}</div>
    <p class="dim stsmall" id="lbSpace"></p>
    <p class="dim stsmall">${total ? `على جهازك الآن ${fmtMB(total)} من الحزم. ` : ''}الصور والمشاهد كلها حقيقية وبلا وجوه، وبلا موسيقى؛ ومصادرها في «المصادر والحقوق» بالإعدادات.</p>
  </div>`);
  L.body.onclick = e => {
    if (e.target.closest('[data-lbgo]')) { openScenes(); return; }
    const c = e.target.closest('[data-pk]'), a = e.target.closest('[data-lb]')?.dataset.lb; if (!c || !a) return;
    const id = c.dataset.pk;
    if (a === 'get') libInstall(id);
    if (a === 'stop') { if (Lib.dl[id]) Lib.dl[id].dead = true; }
    if (a === 'del') libRemove(id);
    if (a === 'open') libOpen(id);
  };
}
function libOpen(id) {
  const p = libPack(id); if (!p) return;
  if (p.kind === 'pano') { libImm(true); openImmersive('p_' + p.items[0].k); }
  if (p.kind === 'gallery') openKawn(0, id);
  if (p.kind === 'video') openNature(id);
}
/* the immersive view gains every panorama of the pack */
function libImm(all) {
  const p = libPack('pano360'); if (!p || !(all || libHas('pano360'))) return;
  const AMB = { fajr: [['dawn', 95, .5], ['palms', 180, .22]], duha: [['dawn', 85, .42], ['palms', 180, .3]], asr: [['palms', 160, .34], ['water', -90, .22]], layl: [['night', -95, .5], ['night', 100, .3]] };
  const VS = { fajr: [3, 4, 5], duha: [1, 6, 7, 8], asr: [9, 10, 11], layl: [2] };
  for (const it of p.items) {
    const k = 'p_' + it.k; if (IMM.some(x => x.k === k)) continue;
    IMM.push({ k, t: it.t, d: it.t, get: () => libFile('pano360', it.f), front: .5, pitch: 3, vs: VS[it.mood] || [1], amb: (AMB[it.mood] || AMB.duha).map(a => [...a]), pack: true });
  }
}

/* ---------- الكون والضحى: real NASA photographs ---------- */
const Kawn = { L: null, i: 0, auto: false, t: 0 };
function openKawn(i = 0, id = 'kawn') {
  const p = libPack(id); if (!p) return; Kawn.id = id;
  const L = Gx.open('kwv', p.t, 'globe'); Kawn.L = L; Kawn.i = i;
  html(L.body, `<div class="kwwrap">
    <div class="kwstage" id="kwSt"><img id="kwImg" alt=""><div class="kwcap" id="kwCap"></div></div>
    <div class="kwbar"><button class="iconbtn" data-kw="prev" aria-label="السابقة">${ic('next')}</button>
      <button class="btn btn-sun" data-kw="v" id="kwV">${ic('sound')} اسمع الآية</button>
      <button class="iconbtn" data-kw="auto" id="kwA" aria-label="عرضٌ متتابع">${ic('play')}</button>
      <button class="iconbtn" data-kw="next" aria-label="التالية">${ic('prev')}</button></div>
    <div class="kwthumbs" id="kwTh">${p.items.map((it, j) => `<button data-kt="${j}" aria-label="${esc(it.t)}"><img loading="lazy" alt="" data-f="${it.th}"></button>`).join('')}</div>
  </div>`);
  $$('#kwTh img', L.body).forEach(im => { im.src = pkThumb(id, im.dataset.f); });
  L.onClose = () => { clearTimeout(Kawn.t); Kawn.auto = false; Kawn.L = null; };
  L.body.onclick = e => {
    const t = e.target.closest('[data-kt]'); if (t) { kwShow(+t.dataset.kt); return; }
    const a = e.target.closest('[data-kw]')?.dataset.kw; if (!a) return;
    if (a === 'next') kwShow(Kawn.i + 1); if (a === 'prev') kwShow(Kawn.i - 1);
    if (a === 'v') { const it = p.items[Kawn.i]; if (it.v) { Sfx.init(); playSeq([it.v]); sqNote([it.v]); } }
    if (a === 'auto') { Kawn.auto = !Kawn.auto; $('#kwA', L.body).innerHTML = ic(Kawn.auto ? 'pause' : 'play'); kwShow(Kawn.i); }
  };
  let sx = null; const st = $('#kwSt', L.body);
  st.onpointerdown = e => { sx = e.clientX; }; st.onpointerup = e => { if (sx == null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 40) kwShow(Kawn.i + (dx > 0 ? 1 : -1)); };
  kwShow(i); award(id === 'kawn' ? 'kawn' : 'suwar');
}
async function kwShow(i) {
  const p = libPack(Kawn.id), L = Kawn.L; if (!L) return;
  const n = p.items.length; i = ((i % n) + n) % n; Kawn.i = i; const it = p.items[i];
  const img = $('#kwImg', L.body), cap = $('#kwCap', L.body); img.classList.remove('on');
  const url = await libFile(Kawn.id, it.f); if (Kawn.i !== i || !Kawn.L) return;
  img.onload = () => { img.classList.toggle('kb', !reduceMotion()); requestAnimationFrame(() => img.classList.add('on')); };
  img.src = url; img.alt = it.t;
  cap.innerHTML = `<b>${esc(it.t)}</b><span>${esc(it.c || '')}</span>${it.v ? `<span class="qinline">${esc(plainVerse(it.v))}</span>` : ''}<small>${esc(it.by)} · ${esc(it.lic === 'Public domain' ? 'ملكية عامة' : it.lic)}</small>`;
  $('#kwV', L.body).hidden = !it.v;
  $$('#kwTh button', L.body).forEach((b, j) => b.classList.toggle('on', j === i));
  clearTimeout(Kawn.t); if (Kawn.auto) Kawn.t = setTimeout(() => kwShow(Kawn.i + 1), 7000);
}

/* ---------- مشاهد الطبيعة: real footage, always silent ---------- */
const Nat = { L: null };
function openNature(id = 'tabia') {
  const p = libPack(id); if (!p) return; Nat.id = id;
  const L = Gx.open('ntv', p.t, 'eye'); Nat.L = L;
  html(L.body, `<div class="ntwrap"><p class="muted sthint">مشاهد حقيقية صامتة. اختر مشهدًا، ويمكنك أن تسمع معه آيةً بصوت القارئ.</p>
    <div class="ntgrid">${p.items.map((it, j) => `<button class="ntcard" data-nt="${j}"><img loading="lazy" alt="" data-f="${it.th}"><b>${esc(it.t)}</b>${libLocal(id, it.f) ? '' : `<i class="ntcloud">${ic('download')}</i>`}</button>`).join('')}</div></div>`);
  $$('.ntcard img', L.body).forEach(im => { im.src = pkThumb(Nat.id, im.dataset.f); });
  L.onClose = () => { Nat.L = null; };
  L.body.onclick = e => { const c = e.target.closest('[data-nt]'); if (c) ntPlay(+c.dataset.nt); };
  award('tabia');
}
async function ntPlay(j) {
  const p = libPack(Nat.id), it = p.items[j];
  const L = Gx.open('ntplay', it.t, 'eye');
  html(L.body, `<div class="ntstage"><video id="ntV" muted playsinline loop autoplay poster="${pkThumb(p.id, it.th)}"></video><div class="ntload" id="ntLoad">${libLocal(p.id, it.f) ? '' : 'أحضر المشهد بجودته الكاملة، ويبقى على جهازك بعدها…'}</div>
    <div class="ntcap"><b>${esc(it.t)}</b><span>${esc(it.c || '')}</span><small>${esc(it.by)} · ${esc(it.lic)}</small></div>
    <div class="ntbar"><span class="dim">آية مع المشهد:</span>${verseRange(1, NV).map(n => `<button class="chip" data-nv="${n}">${ARN(n)}</button>`).join('')}<button class="chip" data-nv="all">السورة</button></div></div>`);
  const v = $('#ntV', L.body), u = await libFile(p.id, it.f); if (!L.el.isConnected) return; v.src = u; v.play().catch(() => { }); const ld = $('#ntLoad', L.body); if (ld) ld.remove();
  L.onClose = () => { try { v.pause(); v.removeAttribute('src'); v.load(); } catch (e) { } };
  L.body.onclick = e => { const b = e.target.closest('[data-nv]'); if (!b) return; Sfx.init(); const vs = b.dataset.nv === 'all' ? verseRange(1, NV) : [+b.dataset.nv]; playSeq(vs, { gap: 600 }); sqNote(vs); };
}

/* =====================================================================================
   واحة الضحى ثلاثية الأبعاد — a procedural oasis (three.js) with two games
   ===================================================================================== */
const W3 = { L: null };
const w3Noise = (x, z) => Math.sin(x * .045) * 2.2 + Math.sin(z * .038 + 1.3) * 2.6 + Math.sin((x + z) * .02) * 3.2 + Math.sin(x * .11 + z * .07) * .6;
function w3Height(x, z) {
  const r = Math.hypot(x, z), flat = clamp((r - 26) / 30);   // the oasis is a gentle bowl, the dunes rise around it
  return w3Noise(x, z) * flat * 1.6 + flat * flat * 4 - (r < 12 ? (1 - r / 12) * 1.2 : 0);
}
function w3Sky(T) {
  /* T: 0 deep night … .25 dawn … .45 duha … .75 late afternoon */
  const sunEl = Math.sin((T - .25) * Math.PI * 1.25), day = clamp(sunEl * 2.2 + .15);
  const lerp = (a, b, t) => a.map((x, i) => x + (b[i] - x) * t);
  const night = [.03, .04, .12], dawn = [.98, .6, .38], noon = [.42, .66, .95];
  const top = lerp([.01, .02, .07], [.2, .42, .86], day), hor = day < .5 ? lerp(night, dawn, day * 2) : lerp(dawn, noon, (day - .5) * 2);
  return { sunEl, day, top, hor };
}
function w3Text(text, opt = {}) {
  const c = document.createElement('canvas'), g = c.getContext('2d'), fs = opt.fs || 92;
  g.font = `${fs}px ${getComputedStyle(document.documentElement).getPropertyValue('--f-quran') || 'serif'}`;
  const w = Math.ceil(g.measureText(text).width) + 60; c.width = Math.max(128, w); c.height = Math.round(fs * 1.9);
  g.font = `${fs}px ${getComputedStyle(document.documentElement).getPropertyValue('--f-quran') || 'serif'}`;
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'rtl';
  if (opt.bg) { g.fillStyle = opt.bg; g.beginPath(); g.roundRect ? g.roundRect(4, 4, c.width - 8, c.height - 8, 30) : g.rect(4, 4, c.width - 8, c.height - 8); g.fill(); }
  g.shadowColor = opt.glow || 'rgba(255,200,90,.9)'; g.shadowBlur = 18; g.fillStyle = opt.color || '#fff6dc'; g.fillText(text, c.width / 2, c.height / 2 + fs * .08);
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; if ('colorSpace' in t) t.colorSpace = THREE.SRGBColorSpace; else t.encoding = THREE.sRGBEncoding;
  return { t, a: c.width / c.height };
}
function w3Glow() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,240,200,1)'); r.addColorStop(.25, 'rgba(255,200,110,.7)'); r.addColorStop(1, 'rgba(255,170,60,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
function w3Palm(rnd) {
  const g = new THREE.Group(), h = 6 + rnd() * 4, lean = (rnd() - .5) * 1.6;
  const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push(new THREE.Vector3(lean * t * t, h * t, lean * .4 * t * t)); }
  const curve = new THREE.CatmullRomCurve3(pts);
  const trunk = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, .22, 7), W3.mat.trunk); g.add(trunk);
  const top = curve.getPoint(1);
  for (let i = 0; i < 9; i++) {
    const a = i / 9 * Math.PI * 2 + rnd() * .3, len = 3.2 + rnd() * 1.2;
    const geo = new THREE.PlaneGeometry(len, .7, 8, 1); const pos = geo.attributes.position;
    for (let k = 0; k < pos.count; k++) { const x = pos.getX(k) + len / 2, droop = -(x * x) * .09, wid = 1 - x / len; pos.setXYZ(k, x, droop, pos.getY(k) * wid); }
    geo.computeVertexNormals();
    const leaf = new THREE.Mesh(geo, W3.mat.leaf); leaf.position.copy(top); leaf.rotation.y = a; leaf.rotation.z = .25 + rnd() * .25; g.add(leaf);
  }
  return g;
}
function openWorld3D(mode = 'lantern') {
  if (typeof THREE === 'undefined') { toast('العرض ثلاثي الأبعاد غير متاح هنا', 'x'); return; }
  const L = Gx.open('w3v', 'فوانيس الآيات', 'globe'); mode = 'lantern'; W3.L = L; W3.mode = mode;
  const mem = memorizedVerses(), nx = nextStation();
  const o = W3.o = Object.assign({ from: nx && nx.id <= 4 ? nx.verses[0] : 1, to: nx && nx.id <= 4 ? nx.verses[nx.verses.length - 1] : 3 }, (S.w3 || {}).o || {});
  html(L.body, `<div class="w3wrap"><canvas id="w3Cv"></canvas>
    <div class="w3top"><div class="w3verse" id="w3Verse"></div><div class="w3arrow" id="w3Arr" hidden><svg viewBox="0 0 24 24" width="26" height="26"><path d="M12 3l7 9h-4.5v9h-5v-9H5z" fill="currentColor"/></svg></div></div>
    <div class="w3msg" id="w3Msg"></div>
    ${mode === 'lantern' ? '<div class="w3joy" id="w3Joy" aria-label="امشِ"><i></i></div>' : ''}
    <div class="w3setup" id="w3Set"><div class="card">
      <h3>فوانيس الآيات</h3>
      <p class="muted">الليل يغطّي الواحة، وفوانيس الكلمات معلّقة في الهواء حولك. امشِ نحو الفانوس الذي يحمل الكلمة التالية من الآية والمسه لتجمعه، ومع كل آية تكملها يقترب الضحى.</p>
      <div class="row strange"><label>من الآية ${vRangeSel('w3From', o.from)}</label><label>إلى الآية ${vRangeSel('w3To', o.to)}</label></div>
      <button class="btn btn-sun btn-wide" id="w3Go">${ic('play')} ابدأ</button>
      <p class="dim stsmall">حرّك الدائرة في الأسفل لتمشي، واسحب على المشهد لتلتفت، والمس الفانوس حين تقترب منه.</p>
    </div></div></div>`);
  const cv = $('#w3Cv', L.body);
  let R; try { R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' }); } catch (e) { R = null; }
  if (!R) { html($('#w3Set', L.body), '<div class="card"><p>جهازك لا يدعم العرض ثلاثي الأبعاد (WebGL) هنا.</p></div>'); return; }
  W3.R = R; R.setPixelRatio(Math.min(2, window.devicePixelRatio || 1) * .85);
  if ('outputColorSpace' in R) R.outputColorSpace = THREE.SRGBColorSpace; else R.outputEncoding = THREE.sRGBEncoding;
  w3Build(mode);
  W3.keys = {}; W3.joy = [0, 0];
  const kd = e => { W3.keys[e.key.toLowerCase()] = e.type === 'keydown'; }; window.addEventListener('keydown', kd); window.addEventListener('keyup', kd);
  w3Bind(cv);
  let last = performance.now();
  const loop = now => {
    if (!W3.L) return;
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (!document.hidden) w3Tick(dt, now / 1000);
    W3.raf = requestAnimationFrame(loop);
  };
  W3.raf = requestAnimationFrame(loop);
  L.onClose = () => {
    cancelAnimationFrame(W3.raf); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', kd); stopAll();
    W3.scene.traverse(x => { if (x.geometry) x.geometry.dispose(); if (x.material) { const ms = Array.isArray(x.material) ? x.material : [x.material]; ms.forEach(m => { if (m.map) m.map.dispose(); m.dispose(); }); } });
    R.dispose(); try { R.forceContextLoss(); } catch (e) { } W3.L = null;
  };
  $('#w3Go', L.body).onclick = () => {
    o.from = +$('#w3From', L.body).value; o.to = +$('#w3To', L.body).value; S.w3 = S.w3 || {}; S.w3.o = { ...o }; save();
    $('#w3Set', L.body).hidden = true; Sfx.init(); w3Start();
  };
}
function w3Build(mode) {
  const sc = W3.scene = new THREE.Scene(), cam = W3.cam = new THREE.PerspectiveCamera(62, 1, .1, 900);
  W3.mat = {
    trunk: new THREE.MeshLambertMaterial({ color: 0x7a5534 }),
    leaf: new THREE.MeshLambertMaterial({ color: 0x3f7a2c, side: THREE.DoubleSide }),
    rock: new THREE.MeshLambertMaterial({ color: 0x9b7a5a, flatShading: true }),
  };
  /* sky dome: a gradient that follows the sun */
  W3.skyU = { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, sun: { value: new THREE.Vector3() }, glow: { value: 1 } };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(600, 32, 16), new THREE.ShaderMaterial({
    uniforms: W3.skyU, side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform vec3 top; uniform vec3 hor; uniform vec3 sun; uniform float glow; varying vec3 vP;
      void main(){ float h = clamp(vP.y, -0.2, 1.0); vec3 c = mix(hor, top, pow(max(h,0.0), 0.55));
        float d = max(dot(vP, normalize(sun)), 0.0); c += vec3(1.0,0.82,0.55) * pow(d, 18.0) * 0.45 * glow + vec3(1.0,0.95,0.85) * pow(d, 900.0) * 1.6;
        gl_FragColor = vec4(c, 1.0); }`,
  })); sc.add(sky); W3.sky = sky;
  /* stars */
  const sp = []; for (let i = 0; i < 900; i++) { const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, y = Math.abs(u), r = Math.sqrt(1 - y * y); sp.push(Math.cos(a) * r * 550, y * 550 + 10, Math.sin(a) * r * 550); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  W3.stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, depthWrite: false })); sc.add(W3.stars);
  sc.fog = new THREE.Fog(0x000000, 60, 420);
  W3.hemi = new THREE.HemisphereLight(0xbfd8ff, 0x8a6a45, .6); sc.add(W3.hemi);
  W3.sun = new THREE.DirectionalLight(0xffe2b0, 1); sc.add(W3.sun);
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  if (mode === 'lantern') {
    /* dunes, the green bowl and the spring */
    const geo = new THREE.PlaneGeometry(700, 700, 140, 140); geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position, col = [];
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i), y = w3Height(x, z), r = Math.hypot(x, z); pos.setY(i, y);
      const g = clamp(1 - (r - 14) / 18), sand = [.86 + Math.sin(x * .3) * .02, .7, .48];
      col.push(sand[0] * (1 - g) + .33 * g, sand[1] * (1 - g) + .55 * g, sand[2] * (1 - g) + .22 * g);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
    sc.add(new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true })));
    const water = new THREE.Mesh(new THREE.CircleGeometry(10.5, 48), new THREE.MeshPhongMaterial({ color: 0x2f7fa8, shininess: 90, transparent: true, opacity: .88 }));
    water.rotation.x = -Math.PI / 2; water.position.y = -.55; sc.add(water); W3.water = water;
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2 + rnd() * .3, r = 13 + rnd() * 9, p = w3Palm(rnd); p.position.set(Math.cos(a) * r, w3Height(Math.cos(a) * r, Math.sin(a) * r) - .1, Math.sin(a) * r); p.rotation.y = rnd() * 6; sc.add(p); }
    for (let i = 0; i < 26; i++) {
      const g = new THREE.DodecahedronGeometry(.6 + rnd() * 1.8, 0), pp = g.attributes.position; for (let k = 0; k < pp.count; k++) pp.setXYZ(k, pp.getX(k) * (1 + rnd() * .3), pp.getY(k) * (.6 + rnd() * .3), pp.getZ(k) * (1 + rnd() * .3)); g.computeVertexNormals();
      const m = new THREE.Mesh(g, W3.mat.rock), a = rnd() * Math.PI * 2, r = 24 + rnd() * 60; m.position.set(Math.cos(a) * r, w3Height(Math.cos(a) * r, Math.sin(a) * r) - .3, Math.sin(a) * r); m.rotation.y = rnd() * 6; sc.add(m);
    }
    W3.pos = new THREE.Vector3(0, 0, 20); W3.yaw = 0; W3.pitch = -.05;
  }
  W3.glowTex = w3Glow();
  W3.T = mode === 'lantern' ? .08 : .3; W3.Tgoal = W3.T;
}
function w3Bind(cv) {
  let last = null;
  cv.onpointerdown = e => { cv.setPointerCapture(e.pointerId); last = [e.clientX, e.clientY, e.clientX, e.clientY, performance.now()]; };
  cv.onpointermove = e => { if (!last) return; const dx = e.clientX - last[0], dy = e.clientY - last[1]; last[0] = e.clientX; last[1] = e.clientY; W3.yaw -= dx * .006; W3.pitch = clamp(W3.pitch - dy * .005, -1.1, .9); };
  cv.onpointerup = e => { if (!last) return; const moved = Math.hypot(e.clientX - last[2], e.clientY - last[3]), quick = performance.now() - last[4] < 350; last = null; if (moved < 8 && quick) w3Tap(e); };
  const joy = W3.L && $('#w3Joy', W3.L.body);
  if (joy) {
    const dot = joy.querySelector('i'); let id = null;
    joy.onpointerdown = e => { id = e.pointerId; joy.setPointerCapture(id); mv(e); };
    const mv = e => { if (e.pointerId !== id) return; const r = joy.getBoundingClientRect(), x = clamp((e.clientX - r.left) / r.width * 2 - 1, -1, 1), y = clamp((e.clientY - r.top) / r.height * 2 - 1, -1, 1); W3.joy = [x, y]; dot.style.transform = `translate(${x * 34}px,${y * 34}px)`; };
    joy.onpointermove = mv; joy.onpointerup = joy.onpointercancel = () => { id = null; W3.joy = [0, 0]; dot.style.transform = ''; };
  }
}
function w3Tick(dt, t) {
  const R = W3.R, cv = R.domElement, w = cv.clientWidth, h = cv.clientHeight;
  if (cv.width !== Math.round(w * R.getPixelRatio()) || cv.height !== Math.round(h * R.getPixelRatio())) { R.setSize(w, h, false); W3.cam.aspect = w / Math.max(1, h); W3.cam.updateProjectionMatrix(); }
  /* the day moves toward its goal */
  W3.T += (W3.Tgoal - W3.T) * Math.min(1, dt * .8);
  const sk = w3Sky(W3.T), az = .6 + W3.T * 2.2, sv = new THREE.Vector3(Math.cos(az) * Math.cos(Math.asin(clamp(sk.sunEl, -1, 1))), sk.sunEl, Math.sin(az) * Math.cos(Math.asin(clamp(sk.sunEl, -1, 1))));
  W3.skyU.top.value.setRGB(...sk.top); W3.skyU.hor.value.setRGB(...sk.hor); W3.skyU.sun.value.copy(sv); W3.skyU.glow.value = clamp(sk.sunEl * 3 + .6);
  W3.scene.fog.color.setRGB(...sk.hor); W3.stars.material.opacity = clamp(1 - sk.day * 2.2);
  W3.sun.position.copy(sv).multiplyScalar(100); W3.sun.intensity = clamp(sk.sunEl * 2.5) * 1.1; W3.hemi.intensity = .18 + sk.day * .62;
  W3.sun.color.setRGB(1, .72 + sk.day * .2, .5 + sk.day * .35);
  /* walking */
  if (W3.mode === 'lantern' && W3.run) {
    const k = W3.keys, fw = (k.w || k.arrowup ? 1 : 0) - (k.s || k.arrowdown ? 1 : 0) - W3.joy[1], st = (k.d || k.arrowright ? 1 : 0) - (k.a || k.arrowleft ? 1 : 0) + W3.joy[0];
    if (k.q) W3.yaw += dt * 1.6; if (k.e) W3.yaw -= dt * 1.6;
    const sp = 7.5 * dt, fx = -Math.sin(W3.yaw), fz = -Math.cos(W3.yaw), rx = Math.cos(W3.yaw), rz = -Math.sin(W3.yaw);
    let nx = W3.pos.x + (fx * fw + rx * st) * sp, nz = W3.pos.z + (fz * fw + rz * st) * sp;
    const r = Math.hypot(nx, nz); if (r < 11.2) { nx *= 11.2 / r; nz *= 11.2 / r; } if (r > 140) { nx *= 140 / r; nz *= 140 / r; }
    W3.pos.x = nx; W3.pos.z = nz;
  }
  if (W3.mode === 'lantern') W3.pos.y = w3Height(W3.pos.x, W3.pos.z) + 1.7;
  W3.cam.position.copy(W3.pos);
  W3.cam.rotation.set(W3.pitch, W3.yaw, 0, 'YXZ');
  if (W3.water) W3.water.material.color.setRGB(.12 + sk.day * .1, .3 + sk.day * .22, .45 + sk.day * .2);
  if (W3.tick) W3.tick(dt, t);
  R.render(W3.scene, W3.cam);
}
/* ---------- the verse bar shared by both games ---------- */
function w3Verse() {
  const g = W3.g, b = W3.L && $('#w3Verse', W3.L.body); if (!b || !g) return;
  const ws = QD.verses[g.n];
  b.innerHTML = `<span class="w3n">${ARN(g.n)}</span>${ws.map((w, i) => `<span class="${i < g.w ? 'got' : i === g.w ? 'next' : ''}">${i < g.w ? esc(w) : '<i></i>'}</span>`).join(' ')}`;
}
function w3Say(t, ms = 2600) { const m = W3.L && $('#w3Msg', W3.L.body); if (!m) return; m.textContent = t; m.classList.add('on'); clearTimeout(W3.msgT); W3.msgT = setTimeout(() => m.classList.remove('on'), ms); }
function w3Start() {
  const o = W3.o, vs = verseRange(Math.min(o.from, o.to), Math.max(o.from, o.to));
  W3.g = { vs, vi: 0, n: vs[0], w: 0, wrong: 0, items: [], t0: Date.now() }; W3.run = true;
  W3.T = W3.mode === 'lantern' ? .06 : .32; W3.Tgoal = W3.T;
  w3Round();
}
function w3Round() {
  const g = W3.g; g.n = g.vs[g.vi]; g.w = 0; g.wrong = 0;
  for (const it of g.items) W3.scene.remove(it.obj); g.items = [];
  const words = QD.verses[g.n];
  if (W3.mode === 'lantern') {
    words.forEach((w, i) => {
      const grp = new THREE.Group(), tx = w3Text(w), r = 16 + Math.random() * 22, a = Math.random() * Math.PI * 2;
      const lamp = new THREE.Mesh(new THREE.CylinderGeometry(.32, .42, .9, 8), new THREE.MeshBasicMaterial({ color: 0xffd27a })); grp.add(lamp);
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: W3.glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); glow.scale.set(3.4, 3.4, 1); grp.add(glow);
      const lab = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx.t, transparent: true, depthWrite: false })); lab.scale.set(2 * tx.a, 2, 1); lab.position.y = 2; grp.add(lab);
      const x = Math.cos(a) * r, z = Math.sin(a) * r; grp.position.set(x, w3Height(x, z) + 3.6, z); W3.scene.add(grp);
      g.items.push({ i, obj: grp, base: grp.position.y, ph: Math.random() * 6, done: false });
    });
    W3.tick = w3LanternTick;
  }
  w3Verse(); w3Say(`الآية ${ARN(g.n)}: اجمع كلماتها بالترتيب`);
}
function w3Next(it) {
  const g = W3.g;
  if (it.i !== g.w) {
    g.wrong++; Sfx.bad(); it.shake = .5;
    w3Say(g.wrong >= 2 ? 'اتبع السهم إلى الكلمة التالية' : 'ليست هذه، أيّ كلمةٍ تأتي الآن؟', 1800);
    return false;
  }
  it.done = true; it.fly = 0; g.w++; playWord(g.n, it.i); w3Verse();
  if (g.w >= QD.verses[g.n].length) setTimeout(w3VerseDone, 700);
  return true;
}
function w3VerseDone() {
  const g = W3.g; if (!W3.L) return;
  sqNote([g.n]); addXP(5);
  playSeq([g.n]);
  g.vi++;
  if (W3.mode === 'lantern') W3.Tgoal = clamp(.06 + (.5 - .06) * g.vi / g.vs.length, 0, .55);
  if (g.vi >= g.vs.length) {
    W3.run = false; award('world3d'); addXP(15);
    const secs = Math.round((Date.now() - g.t0) / 1000);
    S.best.world3d = Math.max(S.best.world3d || 0, g.vs.length); save();
    setTimeout(() => {
      if (!W3.L) return; const s = $('#w3Set', W3.L.body); s.hidden = false;
      html(s, `<div class="card"><h3>${ic('sun')} أشرق الضحى على الواحة</h3>
        <p>جمعت ${cnt(g.vs.length, ['آيةً واحدة', 'آيتين', 'آيات', 'آيةً'])} كلمةً كلمة في ${fmtTime(secs)}.</p>
        <div class="row trbtns"><button class="btn btn-sun" id="w3Again">${ic('repeat')} مرة أخرى</button><button class="btn btn-line" id="w3All">${ic('play')} اسمع ${g.vs.length > 1 ? 'الآيات' : 'الآية'}</button></div></div>`);
      $('#w3Again', s).onclick = () => { s.hidden = true; w3Start(); };
      $('#w3All', s).onclick = () => playSeq(g.vs, { gap: 500 });
    }, 1600);
    return;
  }
  setTimeout(() => { if (W3.L) w3Round(); }, 1400);
}
function w3LanternTick(dt, t) {
  const g = W3.g; if (!g) return;
  let nextIt = null;
  for (const it of g.items) {
    const o = it.obj;
    if (it.done) { it.fly += dt * 1.6; const p = W3.cam.position; o.position.lerp(new THREE.Vector3(p.x, p.y + 3, p.z), Math.min(1, it.fly * .25)); o.scale.setScalar(Math.max(0, 1 - it.fly)); if (it.fly >= 1) { W3.scene.remove(o); it.gone = true; } continue; }
    o.position.y = it.base + Math.sin(t * 1.4 + it.ph) * .25;
    if (it.shake) { it.shake = Math.max(0, it.shake - dt); o.position.x += Math.sin(t * 50) * .03; }
    if (it.i === g.w) nextIt = it;
  }
  g.items = g.items.filter(x => !x.gone);
  /* the compass toward the next word, after two wrong tries or when it is far */
  const ar = W3.L && $('#w3Arr', W3.L.body);
  if (ar && nextIt) {
    const dx = nextIt.obj.position.x - W3.pos.x, dz = nextIt.obj.position.z - W3.pos.z, far = Math.hypot(dx, dz) > 30;
    ar.hidden = !(g.wrong >= 2 || far);
    const fw = -dx * Math.sin(W3.yaw) - dz * Math.cos(W3.yaw), rt = dx * Math.cos(W3.yaw) - dz * Math.sin(W3.yaw); ar.style.transform = `rotate(${Math.atan2(rt, fw) * 180 / Math.PI}deg)`;
  } else if (ar) ar.hidden = true;
}
function w3Tap(e) {
  if (!W3.run || !W3.g) return;
  const r = W3.R.domElement.getBoundingClientRect(), m = new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  const rc = new THREE.Raycaster(); rc.setFromCamera(m, W3.cam);
  const live = W3.g.items.filter(x => !x.done), hits = rc.intersectObjects(live.map(x => x.obj), true);
  if (!hits.length) return;
  let ob = hits[0].object; while (ob.parent && !live.some(x => x.obj === ob)) ob = ob.parent;
  const it = live.find(x => x.obj === ob); if (!it) return;
  if (W3.mode === 'lantern' && Math.hypot(ob.position.x - W3.pos.x, ob.position.z - W3.pos.z) > 14) { w3Say('اقترب أكثر من الفانوس ثم المسه', 1500); return; }
  w3Next(it);
}

/* =====================================================================================
   «مع القارئ» — catch each word as the reciter says it
   ===================================================================================== */
const Ry = { L: null };
function openRhythm() {
  const L = Gx.open('ryv', 'مع القارئ', 'headphones'); Ry.L = L;
  const mem = memorizedVerses();
  const o = Ry.o = Object.assign({ from: mem[0] || 1, to: Math.min(NV, (mem[0] || 1) + 1), speed: 1 }, (S.ry || {}).o || {});
  html(L.body, `<div class="rywrap"><canvas id="ryCv"></canvas><div class="ryhud"><b id="ryScore">٠</b><span id="ryCombo"></span></div>
    <div class="w3setup" id="rySet"><div class="card"><h3>مع القارئ</h3>
      <p class="muted">كل كلمة نجمةٌ تنزل في أحد المسارات الثلاثة، وتصل إلى الخط الذهبي في اللحظة التي ينطقها القارئ. المس مسارها عندها لتلتقطها: الالتقاط في وقته يضيء الكلمة.</p>
      <div class="row strange"><label>من الآية ${vRangeSel('ryFrom', o.from)}</label><label>إلى الآية ${vRangeSel('ryTo', o.to)}</label></div>
      <button class="btn btn-sun btn-wide" id="ryGo">${ic('play')} ابدأ</button>
      <p class="dim stsmall">على الحاسوب: المفاتيح ← ↓ → للمسارات.</p></div></div></div>`);
  const cv = Ry.cv = $('#ryCv', L.body);
  L.onClose = () => { cancelAnimationFrame(Ry.raf); if (Ry.au) { Ry.au.pause(); Ry.au = null; } window.removeEventListener('keydown', Ry.kd); Ry.L = null; };
  Ry.kd = e => { const m = { arrowright: 0, arrowdown: 1, arrowleft: 2 }[e.key.toLowerCase()]; if (m != null && Ry.run) { e.preventDefault(); ryHit(m); } };
  window.addEventListener('keydown', Ry.kd);
  cv.onpointerdown = e => { if (!Ry.run) return; const r = cv.getBoundingClientRect(); ryHit(2 - Math.floor(clamp((e.clientX - r.left) / r.width, 0, .999) * 3)); };
  $('#ryGo', L.body).onclick = () => {
    o.from = +$('#ryFrom', L.body).value; o.to = +$('#ryTo', L.body).value; S.ry = S.ry || {}; S.ry.o = { ...o }; save();
    $('#rySet', L.body).hidden = true; Sfx.init(); ryStart();
  };
  const loop = () => { if (!Ry.L) return; ryDraw(); Ry.raf = requestAnimationFrame(loop); }; Ry.raf = requestAnimationFrame(loop);
}
function ryStart() {
  const o = Ry.o; Ry.vs = verseRange(Math.min(o.from, o.to), Math.max(o.from, o.to)); Ry.vi = 0; Ry.score = 0; Ry.combo = 0; Ry.best = 0; Ry.hits = 0; Ry.total = 0; Ry.run = true;
  stopAll(); ryVerse();
}
async function ryVerse() {
  const n = Ry.vs[Ry.vi], rid = Player.rid, t = tim(rid, n), b = t.b, words = QD.verses[n];
  Ry.n = n; Ry.lead = 2.2;   // seconds a star takes to fall
  let lane = 1;
  Ry.notes = words.map((w, i) => { lane = (lane + 1 + Math.floor(Math.random() * 2)) % 3; return { i, w, at: (b[i] + Math.min(b[i + 1] ?? t.t1, b[i] + 600)) / 2 / 1000, lane, st: 0 }; });
  Ry.total += words.length;
  const url = (await blobFor(aurl(rid, n))) || aurl(rid, n);
  const au = Ry.au = new Audio(url); au.preload = 'auto';
  Ry.start = performance.now() / 1000 + Ry.lead + .4; Ry.playing = false; Ry.t0 = Math.max(0, t.t0 - 150) / 1000;
  /* the clip starts just before the verse: the audio clock (not timers) drives the stars */
  const go = () => { try { au.currentTime = Ry.t0; } catch (e) { } };
  au.addEventListener('loadedmetadata', go, { once: true }); if (au.readyState >= 1) go();
  Ry.endAt = t.t1 / 1000 + .6;
}
function ryNow() {
  const au = Ry.au; if (!au) return -9;
  const wall = performance.now() / 1000;
  if (!Ry.playing) { if (wall >= Ry.start) { Ry.playing = true; au.play().catch(() => { }); } return Ry.t0 - (Ry.start - wall); }
  return au.currentTime;
}
function ryHit(lane) {
  const now = ryNow(); let best = null;
  for (const x of Ry.notes || []) if (!x.st && x.lane === lane && Math.abs(x.at - now) < .45 && (!best || Math.abs(x.at - now) < Math.abs(best.at - now))) best = x;
  if (!best) { Ry.combo = 0; Ry.flash = { lane, bad: true, t: performance.now() }; return; }
  const d = Math.abs(best.at - now); best.st = d < .16 ? 2 : 1; Ry.hits++;
  Ry.combo++; Ry.best = Math.max(Ry.best, Ry.combo); Ry.score += (best.st === 2 ? 100 : 60) + Math.min(50, Ry.combo * 5);
  Ry.flash = { lane, t: performance.now(), st: best.st }; Sfx.tap(); buzz(8);
}
function ryDraw() {
  const cv = Ry.cv; if (!cv) return; const g = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1), W = cv.clientWidth, H = cv.clientHeight;
  if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#0b1030'); gr.addColorStop(1, '#2a1f45'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const lw = W / 3, lineY = H * .78;
  for (let l = 0; l < 3; l++) { g.fillStyle = l % 2 ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.055)'; g.fillRect(W - (l + 1) * lw, 0, lw, H); }
  g.strokeStyle = 'rgba(255,215,122,.85)'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, lineY); g.lineTo(W, lineY); g.stroke();
  if (Ry.flash && performance.now() - Ry.flash.t < 220) { const l = Ry.flash.lane; g.fillStyle = Ry.flash.bad ? 'rgba(255,120,120,.16)' : 'rgba(255,215,122,.22)'; g.fillRect(W - (l + 1) * lw, 0, lw, H); }
  if (!Ry.run || !Ry.notes) return;
  const now = ryNow(), font = getComputedStyle(document.documentElement).getPropertyValue('--f-quran') || 'serif';
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'rtl';
  for (const x of Ry.notes) {
    const y = lineY - (x.at - now) / Ry.lead * lineY, cx = W - (x.lane + .5) * lw;
    if (!x.st && now - x.at > .45) { x.st = -1; Ry.combo = 0; }
    if (y < -60 || (x.st && now - x.at > .9)) continue;
    const a = x.st > 0 ? clamp(1 - (now - x.at) / .9) : x.st < 0 ? .3 : 1;
    g.globalAlpha = a;
    const rr = x.st > 0 ? 34 + (now - x.at) * 40 : 30, glow = g.createRadialGradient(cx, y, 0, cx, y, rr * 1.8);
    glow.addColorStop(0, x.st < 0 ? 'rgba(150,160,200,.5)' : 'rgba(255,236,180,.95)'); glow.addColorStop(1, 'rgba(255,200,90,0)');
    g.fillStyle = glow; g.beginPath(); g.arc(cx, y, rr * 1.8, 0, Math.PI * 2); g.fill();
    g.fillStyle = x.st < 0 ? '#9aa3c8' : '#fff7e2'; g.font = `${Math.min(30, lw / Math.max(3, x.w.length * .5))}px ${font}`; g.fillText(x.w, cx, y);
    g.globalAlpha = 1;
  }
  /* the verse fills as you catch it */
  g.font = `22px ${font}`; g.fillStyle = 'rgba(255,255,255,.18)';
  const caught = Ry.notes.map(x => x.st > 0 ? x.w : '·').join(' ');
  g.fillStyle = '#ffd77a'; g.fillText(caught, W / 2, H * .9, W - 24);
  const sc = $('#ryScore', Ry.L.body), cb = $('#ryCombo', Ry.L.body); if (sc) sc.textContent = ARN(Ry.score); if (cb) cb.textContent = Ry.combo > 2 ? `متتالية ${ARN(Ry.combo)}` : '';
  if (Ry.playing && Ry.au && (Ry.au.ended || Ry.au.currentTime >= Ry.endAt)) { Ry.au.pause(); Ry.playing = false; Ry.au = null; ryVerseEnd(); }
}
function ryVerseEnd() {
  const got = Ry.notes.filter(x => x.st > 0).length;
  if (got === Ry.notes.length) sqNote([Ry.n]);
  Ry.vi++;
  if (Ry.vi < Ry.vs.length) { setTimeout(() => { if (Ry.L && Ry.run) ryVerse(); }, 900); return; }
  Ry.run = false; Ry.notes = null; award('rhythm'); addXP(10);
  const pct = Math.round(100 * Ry.hits / Math.max(1, Ry.total));
  S.best.rhythm = Math.max(S.best.rhythm || 0, Ry.score); save();
  const s = $('#rySet', Ry.L.body); s.hidden = false;
  html(s, `<div class="card"><h3>${ic('star')} ${pct >= 90 ? 'كأنك تتلو معه' : pct >= 60 ? 'أحسنت' : 'بداية طيبة'}</h3>
    <p>التقطت ${ARN(pct)}٪ من الكلمات · أطول متتالية ${ARN(Ry.best)} · النقاط ${ARN(Ry.score)}</p>
    <button class="btn btn-sun btn-wide" id="ryAgain">${ic('repeat')} مرة أخرى</button></div>`);
  $('#ryAgain', s).onclick = () => { s.hidden = true; ryStart(); };
}

/* =====================================================================================
   كوكبة الآية — every star carries a word; join them in order and the verse shines as a constellation
   ===================================================================================== */
const Kk = { L: null };
function openKawkaba() {
  const L = Gx.open('kkv', 'كوكبة الآية', 'star'); Kk.L = L;
  const mem = memorizedVerses(), nx = nextStation();
  const o = Kk.o = Object.assign({ from: nx && nx.id <= 4 ? nx.verses[0] : mem[0] || 1, to: nx && nx.id <= 4 ? nx.verses[nx.verses.length - 1] : 3 }, (S.kk || {}).o || {});
  html(L.body, `<div class="kkwrap"><div class="kkbg" id="kkBg"></div><canvas id="kkCv"></canvas>
    <div class="w3top"><div class="w3verse" id="kkVerse"></div></div><div class="w3msg" id="kkMsg"></div>
    <div class="w3setup" id="kkSet"><div class="card"><h3>${ic('star')} كوكبة الآية</h3>
      <p class="muted">في السماء نجومٌ، على كل نجمةٍ كلمة. صِلها بالترتيب من أول الآية إلى آخرها، فتصير الآية كوكبةً تضيء، ويتلوها القارئ.</p>
      <div class="row strange"><label>من الآية ${vRangeSel('kkFrom', o.from)}</label><label>إلى الآية ${vRangeSel('kkTo', o.to)}</label></div>
      <button class="btn btn-sun btn-wide" id="kkGo">${ic('play')} ابدأ</button>
      <p class="dim stsmall">المس النجمة الأولى ثم التي تليها، أو اسحب من نجمةٍ إلى التالية.</p></div></div></div>`);
  const bg = mediaFind('layl', 'image'); if (bg) { const el = $('#kkBg', L.body); el.style.backgroundImage = `url('${mediaThumb(bg.key)}')`; mediaFileUrl(bg.key).then(u => { el.style.backgroundImage = `url('${u}')`; }); }
  const cv = Kk.cv = $('#kkCv', L.body);
  L.onClose = () => { cancelAnimationFrame(Kk.raf); Kk.L = null; stopAll(); };
  $('#kkGo', L.body).onclick = () => {
    o.from = +$('#kkFrom', L.body).value; o.to = +$('#kkTo', L.body).value; S.kk = S.kk || {}; S.kk.o = { ...o }; save();
    $('#kkSet', L.body).hidden = true; Sfx.init(); kkStart();
  };
  let drag = null;
  cv.onpointerdown = e => { if (!Kk.g || Kk.g.busy) return; cv.setPointerCapture(e.pointerId); const st = kkAt(e); if (st) { drag = { from: st, x: e.clientX, y: e.clientY }; kkPick(st); } };
  cv.onpointermove = e => { if (drag) { Kk.drag = { x: e.clientX, y: e.clientY }; const st = kkAt(e); if (st && st !== drag.from && !st.on) { drag.from = st; kkPick(st); } } };
  cv.onpointerup = cv.onpointercancel = () => { drag = null; Kk.drag = null; };
  const loop = () => { if (!Kk.L) return; kkDraw(); Kk.raf = requestAnimationFrame(loop); }; Kk.raf = requestAnimationFrame(loop);
  /* a field of quiet background stars */
  Kk.dust = Array.from({ length: 160 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.2 + .3, p: Math.random() * 6 }));
}
function kkStart() {
  const o = Kk.o; Kk.g = { vs: verseRange(Math.min(o.from, o.to), Math.max(o.from, o.to)), vi: 0, miss: 0, t0: Date.now() };
  kkRound();
}
function kkRound() {
  const g = Kk.g, n = g.n = g.vs[g.vi], words = QD.verses[n], cv = Kk.cv;
  g.w = 0; g.wrong = 0; g.busy = false; g.done = false;
  const W = cv.clientWidth, H = cv.clientHeight, top = 120, pad = 46;
  /* stars scattered, never too close, so every word stays readable */
  const pts = [];
  for (let i = 0; i < words.length; i++) {
    let best = null, bd = -1;
    for (let k = 0; k < 60; k++) {
      const p = { x: pad + Math.random() * (W - pad * 2), y: top + Math.random() * (H - top - 110) };
      const d = pts.length ? Math.min(...pts.map(q => Math.hypot(q.x - p.x, q.y - p.y))) : 999;
      if (d > bd) { bd = d; best = p; }
    }
    pts.push(best);
  }
  g.stars = words.map((w, i) => ({ i, w, x: pts[i].x / W, y: pts[i].y / H, on: false, shake: 0, tw: Math.random() * 6 }));
  kkVerse(); kkSay(`الآية ${ARN(n)}: صِل كلماتها بالترتيب`);
}
function kkVerse() {
  const g = Kk.g, b = Kk.L && $('#kkVerse', Kk.L.body); if (!b || !g) return;
  b.innerHTML = `<span class="w3n">${ARN(g.n)}</span>${QD.verses[g.n].map((w, i) => `<span class="${i < g.w ? 'got' : i === g.w ? 'next' : ''}">${i < g.w ? esc(w) : '<i></i>'}</span>`).join(' ')}`;
}
function kkSay(t, ms = 2400) { const m = Kk.L && $('#kkMsg', Kk.L.body); if (!m) return; m.textContent = t; m.classList.add('on'); clearTimeout(Kk.mT); Kk.mT = setTimeout(() => m.classList.remove('on'), ms); }
function kkAt(e) {
  const g = Kk.g; if (!g || !g.stars) return null; const r = Kk.cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
  let best = null, bd = 44;
  for (const s of g.stars) { const d = Math.hypot(s.x * r.width - x, s.y * r.height - y); if (d < bd) { bd = d; best = s; } }
  return best;
}
function kkPick(st) {
  const g = Kk.g; if (g.busy || st.on) return;
  if (st.i !== g.w) { g.wrong++; g.miss++; st.shake = .45; buzz(12); if (g.wrong >= 2) kkSay('النجمة التي تومض هي التالية', 1800); return; }
  st.on = true; st.at = performance.now(); g.w++; playWord(g.n, st.i); kkVerse(); g.wrong = 0;
  if (g.w >= g.stars.length) {
    g.busy = true; g.done = true; g.doneAt = performance.now(); vShine($('#kkVerse', Kk.L.body)); Sfx.bird();
    setTimeout(() => {
      if (!Kk.L) return; sqNote([g.n]); playSeq([g.n]).then(() => {
        if (!Kk.L) return; g.vi++;
        if (g.vi < g.vs.length) kkRound(); else kkEnd();
      });
    }, 700);
  }
}
function kkEnd() {
  const g = Kk.g; award('kawkaba'); addXP(12);
  const secs = Math.round((Date.now() - g.t0) / 1000), s = $('#kkSet', Kk.L.body); s.hidden = false;
  S.best.kawkaba = Math.max(S.best.kawkaba || 0, g.vs.length); save();
  html(s, `<div class="card"><h3>${ic('star')} ${g.miss ? 'أضاءت كوكبتك' : 'كوكبةٌ بلا خطأ واحد'}</h3>
    <p>وصلت ${cnt(g.vs.length, ['آيةً واحدة', 'آيتين', 'آيات', 'آيةً'])} في ${fmtTime(secs)}${g.miss ? `، ومع ${cnt(g.miss, ['محاولةٍ واحدة', 'محاولتين', 'محاولات', 'محاولة'])} للتصحيح` : ''}.</p>
    <div class="row trbtns"><button class="btn btn-sun" id="kkAgain">${ic('repeat')} سماءٌ جديدة</button><button class="btn btn-line" id="kkAll">${ic('play')} اسمع ${g.vs.length > 1 ? 'الآيات' : 'الآية'}</button></div></div>`);
  $('#kkAgain', s).onclick = () => { s.hidden = true; kkStart(); };
  $('#kkAll', s).onclick = () => playSeq(g.vs, { gap: 500 });
}
function kkDraw() {
  const cv = Kk.cv; if (!cv) return; const g2 = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1), W = cv.clientWidth, H = cv.clientHeight;
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  g2.setTransform(dpr, 0, 0, dpr, 0, 0); g2.clearRect(0, 0, W, H);
  const t = performance.now() / 1000;
  for (const d of Kk.dust || []) { g2.globalAlpha = .25 + .35 * (.5 + .5 * Math.sin(t * 1.3 + d.p)); g2.fillStyle = '#fff'; g2.beginPath(); g2.arc(d.x * W, d.y * H, d.r, 0, 7); g2.fill(); }
  g2.globalAlpha = 1;
  const g = Kk.g; if (!g || !g.stars) return;
  const on = g.stars.filter(s => s.on).sort((a, b) => a.i - b.i);
  /* the constellation lines, drawn as they are joined */
  g2.lineCap = 'round';
  for (let k = 1; k < on.length; k++) {
    const a = on[k - 1], b = on[k], p = clamp((performance.now() - b.at) / 450);
    g2.strokeStyle = g.done ? `rgba(255,220,140,${.75 + .25 * Math.sin(t * 3)})` : 'rgba(255,220,140,.8)'; g2.lineWidth = g.done ? 3 : 2;
    g2.shadowColor = 'rgba(255,200,90,.9)'; g2.shadowBlur = 12;
    g2.beginPath(); g2.moveTo(a.x * W, a.y * H); g2.lineTo((a.x + (b.x - a.x) * p) * W, (a.y + (b.y - a.y) * p) * H); g2.stroke();
  }
  g2.shadowBlur = 0;
  const font = getComputedStyle(document.documentElement).getPropertyValue('--f-quran') || 'serif';
  g2.textAlign = 'center'; g2.textBaseline = 'top'; g2.direction = 'rtl';
  for (const s of g.stars) {
    let x = s.x * W, y = s.y * H; if (s.shake > 0) { s.shake = Math.max(0, s.shake - 1 / 60); x += Math.sin(t * 60) * 5 * s.shake; }
    const hint = !s.on && g.wrong >= 2 && s.i === g.w, r = s.on ? 7 : 5 + Math.sin(t * 2 + s.tw) * 1.2 + (hint ? 3 + Math.sin(t * 8) * 2 : 0);
    const gl = g2.createRadialGradient(x, y, 0, x, y, r * 5); gl.addColorStop(0, s.on ? 'rgba(255,230,170,.95)' : 'rgba(220,235,255,.9)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
    g2.fillStyle = gl; g2.beginPath(); g2.arc(x, y, r * 5, 0, 7); g2.fill();
    g2.fillStyle = s.on ? '#fff3c4' : '#ffffff'; g2.beginPath(); g2.arc(x, y, r * .55, 0, 7); g2.fill();
    g2.font = `${s.on ? 26 : 23}px ${font}`; g2.fillStyle = s.on ? '#ffd77a' : 'rgba(255,255,255,.92)';
    g2.shadowColor = 'rgba(0,0,0,.85)'; g2.shadowBlur = 6; g2.fillText(s.w, x, y + 12); g2.shadowBlur = 0;
  }
}

/* =====================================================================================
   كل المشاهد في مكانٍ واحد: built-in scenes and every pack photo and video, chosen per verse
   ===================================================================================== */
const VMOOD = { 0: 'fajr', 1: 'duha', 2: 'layl', 3: 'fajr', 4: 'fajr', 5: 'duha', 6: 'duha', 7: 'layl', 8: 'duha', 9: 'asr', 10: 'asr', 11: 'duha' };
const mediaThumb = key => String(key).startsWith('pk:') ? (r => r ? pkThumb(r.p.id, r.it.th) : '')(pkItem(key)) : `scenes/${key}.jpg`;
const mediaLocal = key => !String(key).startsWith('pk:') || (r => !!r && libLocal(r.p.id, r.it.f))(pkItem(key));
async function mediaFileUrl(key) { const r = String(key).startsWith('pk:') && pkItem(key); return r ? libFile(r.p.id, r.it.f) : mediaUrl(key); }
const mediaUrl = key => String(key).startsWith('pk:') ? (r => r ? pkUrl(r.p.id, r.it.f) : '')(pkItem(key)) : `scenes/${key}.${MEDIA.scenes[key] && MEDIA.scenes[key].s ? 'jpg' : 'mp4'}`;
function mediaAll() {
  const out = [];
  for (const [k, m] of Object.entries(MEDIA.scenes || {})) out.push({ key: k, kind: m.s ? 'image' : 'video', t: /^v\d+$/.test(k) ? (k === 'v0' ? 'مشهد البسملة' : 'مشهد الآية ' + ARN(+k.slice(1))) : (m.ar || m.t), src: 'التطبيق', mood: m.mood, vs: /^v\d+$/.test(k) ? [+k.slice(1)] : (m.vs || []) });
  for (const p of PACKS) if (p.kind === 'video' || p.kind === 'gallery') for (const it of p.items) out.push({ key: `pk:${p.id}:${it.k}`, kind: p.kind === 'video' ? 'video' : 'image', t: it.t, src: p.t, mood: it.mood, vs: it.vs || (it.v != null ? [it.v] : []) });
  return out;
}
const mediaFind = (mood, kind) => mediaAll().find(m => m.mood === mood && (!kind || m.kind === kind));
function openScenes() {
  const L = Gx.open('scv', 'مشهد كل آية', 'film');
  const draw = () => html(L.body, `<div class="scwrap"><p class="muted sthint">لكل آيةٍ مشهدها في المشاهدة والحفظ والاستوديو. اختر لها ما تحب من كل صور التطبيق وفيديوهاته.</p>
    <div class="sclist">${verseRange(0, NV).map(n => { const k = 'v' + n, own = S.sceneOf && S.sceneOf[k]; return `<button class="scrow" data-sn="${n}">
      <span class="scth" style="background-image:url('${thumbUrl(k)}')">${isStill(k) ? '' : `<i>${ic('play')}</i>`}</span>
      <span class="sctx"><b>${n ? 'الآية ' + ARN(n) : 'البسملة'}</b><span class="qinline">${esc(plainVerse(n))}</span><small class="dim">${own ? 'اخترته أنت' : 'المشهد الأصلي'}</small></span>
      <span class="scgo">${ic('chev')}</span></button>`; }).join('')}</div></div>`);
  draw(); L.onClose = () => { if (tab === 'home') renderHome(); };
  L.body.onclick = e => { const r = e.target.closest('[data-sn]'); if (r) scPick(+r.dataset.sn, draw); };
}
function scPick(n, after) {
  const L = Gx.open('scpick', n ? `مشهد الآية ${ARN(n)}` : 'مشهد البسملة', 'film'), k = 'v' + n;
  let f = 'sug';
  const all = mediaAll();
  const draw = () => {
    const cur = sceneOf(k), own = all.filter(m => m.vs.includes(n)), near = all.filter(m => !m.vs.includes(n) && m.mood === VMOOD[n]).slice(0, Math.max(0, 16 - own.length));
    const list = f === 'all' ? all : f === 'video' ? all.filter(m => m.kind === 'video') : f === 'image' ? all.filter(m => m.kind === 'image') : [...own, ...near];
    html(L.body, `<div class="scwrap"><p class="qinline" style="text-align:center">${esc(plainVerse(n))}</p>
      <div class="chips">${[['sug', 'مقترحة لهذه الآية'], ['video', 'فيديو'], ['image', 'صور'], ['all', 'الكل']].map(([v, t]) => `<button class="chip${f === v ? ' on' : ''}" data-f="${v}">${t}</button>`).join('')}${S.sceneOf && S.sceneOf[k] ? `<button class="chip" data-reset="1">${ic('repeat')} الأصلي</button>` : ''}</div>
      <div class="scgrid">${list.map(m => `<button class="sccard${m.key === cur ? ' on' : ''}" data-key="${m.key}"><span style="background-image:url('${mediaThumb(m.key)}')"></span>${m.kind === 'video' ? `<i>${ic('play')}</i>` : ''}<b>${esc(m.t)}</b><small>${esc(m.src)}${mediaLocal(m.key) ? '' : ' · من الإنترنت'}</small></button>`).join('') || '<p class="dim">لا شيء هنا بعد</p>'}</div>
      <p class="dim stsmall">ما تختاره يُحضَر مرةً واحدة بجودته الكاملة، ثم يبقى على جهازك ويعمل بلا إنترنت.</p></div>`);
  };
  draw();
  L.body.onclick = e => {
    const c = e.target.closest('[data-f]'); if (c) { f = c.dataset.f; draw(); return; }
    if (e.target.closest('[data-reset]')) { delete S.sceneOf[k]; save(); toast('رجع المشهد الأصلي', 'check'); Gx.close(L); after && after(); return; }
    const m = e.target.closest('[data-key]'); if (!m) return;
    S.sceneOf = S.sceneOf || {}; if (m.dataset.key === k) delete S.sceneOf[k]; else S.sceneOf[k] = m.dataset.key; save();
    const pr = pkItem(m.dataset.key); if (pr) libFile(pr.p.id, pr.it.f).then(() => after && after());   // keep the chosen scene on the phone
    award('scenes'); toast(n ? `صار للآية ${ARN(n)} مشهدٌ جديد` : 'صار للبسملة مشهدٌ جديد', 'check'); Gx.close(L); after && after();
  };
}
const isStillKey = key => String(key).startsWith('pk:') ? (r => !!r && r.p.kind !== 'video')(pkItem(key)) : !!(MEDIA.scenes[key] && MEDIA.scenes[key].s);
