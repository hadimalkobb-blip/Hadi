/* ===== The surah lives with your real day: Duha clock, live sky, Duha around the world, night mode, Mecca from space ===== */
const IMG_CREDITS = [
  ['مكة من محطة الفضاء الدولية (٢٦ يوليو ٢٠٢٣)', 'NASA · iss069e037428 · ملكية عامة', 'https://images.nasa.gov/details/iss069e037428'],
  ['القمر', 'NASA Goddard / LRO · ملكية عامة', 'https://images.nasa.gov/details/GSFC_20171208_Archive_e000868'],
  ['الأرض (Blue Marble)', 'NASA Visible Earth · ملكية عامة', 'https://visibleearth.nasa.gov/images/73909'],
];

/* ---------- Duha window and the golden session ---------- */
function duhaState(now = new Date()) {
  const t = dayTimes(now); if (!t.duha) return { t, state: 'none' };
  const [a, b] = t.duha;
  return { t, a, b, state: now < a ? 'before' : now <= b ? 'now' : 'after' };
}
const isGolden = () => duhaState().state === 'now';
const _addXP = addXP;
addXP = function (n) {
  if (n > 0 && isGolden()) {
    n = n * 2;
    if (!SESSION.goldenToast) { SESSION.goldenToast = true; toast('جلسة ذهبية: نقاطك مضاعفة في وقت الضحى', 'sun'); }
  }
  return _addXP(n);
};
function duhaCard() {
  const d = duhaState(), k = dayKey(), prayed = S.duhaPr && S.duhaPr[k];
  if (d.state === 'none') return '';
  const head = d.state === 'now' ? `<span class="eyebrow gold">الآن وقت الضحى في ${esc(d.t.city.name)} · نقاط مضاعفة ×٢</span><h3>جلستك الذهبية مفتوحة حتى ${hm(d.b)}</h3>`
    : d.state === 'before' ? `<span class="eyebrow">وقت الضحى اليوم في ${esc(d.t.city.name)}</span><h3>من ${hm(d.a)} إلى ${hm(d.b)}</h3>`
      : `<span class="eyebrow">انتهى وقت الضحى اليوم</span><h3>غدًا من ${hm(duhaState(new Date(Date.now() + 864e5)).a)} تقريبًا</h3>`;
  return `<div class="card duhacard ${d.state}">${head}
    <p class="dim">«ويجزئ من ذلك ركعتان يركعهما من الضحى»: صدقةٌ عن كل مفصل فيك (مسلم ٧٢٠). الأوقات تقريبية.</p>
    ${(() => { const dd = duhaDots(); return dd.month ? `<button class="duharow" data-go="duhapr">${dd.html}<span class="dim">${cnt(dd.month, ['يومٌ واحد', 'يومان', 'أيام', 'يومًا'])} في ثلاثين يومًا · لك وحدك</span></button>` : ''; })()}
    <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:10px">${d.state !== 'after' || prayed ? `<button class="chip ${prayed ? 'on' : ''}" id="duhaPr">${prayed ? ic('check') + ' صلّيت الضحى اليوم' : 'صلّيت الضحى اليوم'}</button>` : ''}<button class="chip" data-go="duhapr">${ic('book')} عن ركعتي الضحى</button><button class="chip" data-go="world">${ic('sun')} الضحى حول العالم</button><button class="chip" id="duhaCity">${ic('pin')} ${esc(d.t.city.name)}</button></div></div>`;
}
function bindDuhaCard() {
  const p = $('#duhaPr'); if (p) p.onclick = () => {
    S.duhaPr = S.duhaPr || {}; const k = dayKey();
    if (S.duhaPr[k]) delete S.duhaPr[k]; else { S.duhaPr[k] = 1; addXP(10); Sfx.ok(); if (Object.keys(S.duhaPr).length >= 7) award('duha7'); }
    save(); renderHome();
  };
  const c = $('#duhaCity'); if (c) c.onclick = () => pickCity(() => renderHome());
}

/* ---------- the live sky: the hero shows the sky that is above you now ---------- */
function skyScene(now = new Date()) {
  const t = dayTimes(now); if (!t.rise) return 'v0';
  const m = 6e4;
  if (now < t.fajr || now > new Date(+t.set + 50 * m)) return 'v2';
  if (now < new Date(+t.rise + 25 * m)) return 'v0';
  if (t.duha && now <= t.duha[1]) return 'v1';
  if (now > new Date(+t.set - 45 * m)) return 'v5';
  return 'v3';
}
function moonPhase(now = new Date()) {
  const syn = 29.530588853, ref = Date.UTC(2000, 0, 6, 18, 14);
  const age = (((now - ref) / 864e5) % syn + syn) % syn, f = age / syn;
  const illum = (1 - Math.cos(2 * Math.PI * f)) / 2;
  const names = ['محاق', 'هلال', 'تربيع أول', 'أحدب متزايد', 'بدر', 'أحدب متناقص', 'تربيع أخير', 'هلال أخير'];
  return { age, f, illum, name: names[Math.round(f * 8) % 8] };
}
/* the real Moon photograph, shadowed to tonight's phase */
function drawMoon(cv, ph) {
  const g = cv.getContext('2d'), S2 = cv.width, R = S2 / 2;
  const img = drawMoon.img || (drawMoon.img = Object.assign(new Image(), { src: 'img/moon.jpg' }));
  const paint = () => {
    g.clearRect(0, 0, S2, S2); g.save(); g.beginPath(); g.arc(R, R, R - 1, 0, Math.PI * 2); g.clip();
    g.drawImage(img, 0, 0, S2, S2);
    const k = Math.cos(2 * Math.PI * ph.f), waxing = ph.f < .5;
    g.fillStyle = 'rgba(4,6,18,.9)'; g.beginPath();
    g.arc(R, R, R, -Math.PI / 2, Math.PI / 2, waxing);
    g.ellipse(R, R, Math.abs(k) * R, R, 0, Math.PI / 2, -Math.PI / 2, (k > 0) === waxing);
    g.fill(); g.restore();
  };
  if (img.complete && img.naturalWidth) paint(); else img.onload = paint;
}

/* ---------- Duha around the world: Earth from NASA, the band where it is forenoon right now ---------- */
function sunPos(now = new Date()) {
  const R = Math.PI / 180, d = now / 864e5 + 2440587.5 - 2451545;
  const M = (357.5291 + 0.98560028 * d) % 360, C = 1.9148 * Math.sin(M * R) + .02 * Math.sin(2 * M * R) + .0003 * Math.sin(3 * M * R);
  const L = (M + C + 180 + 102.9372) % 360;
  const dec = Math.asin(Math.sin(L * R) * Math.sin(23.4397 * R)) / R;
  const ra = Math.atan2(Math.sin(L * R) * Math.cos(23.4397 * R), Math.cos(L * R)) / R;
  const gmst = (280.16 + 360.9856235 * d) % 360;
  let lon = ((ra - gmst) % 360 + 540) % 360 - 180;
  return { dec, lon };
}
function renderWorld(cv, now = new Date()) {
  const g = cv.getContext('2d'), W = cv.width, H = cv.height, R = Math.PI / 180, sp = sunPos(now);
  const img = renderWorld.img || (renderWorld.img = Object.assign(new Image(), { src: 'img/earth.jpg' }));
  const paint = () => {
    g.drawImage(img, 0, 0, W, H);
    const cw = 4, sd = Math.sin(sp.dec * R), cd = Math.cos(sp.dec * R);
    for (let y = 0; y < H; y += cw) {
      const lat = 90 - (y + cw / 2) / H * 180, sl = Math.sin(lat * R), cl = Math.cos(lat * R);
      for (let x = 0; x < W; x += cw) {
        const lon = (x + cw / 2) / W * 360 - 180; let h = ((lon - sp.lon) % 360 + 540) % 360 - 180;
        const alt = Math.asin(sl * sd + cl * cd * Math.cos(h * R)) / R;
        if (alt < -6) g.fillStyle = 'rgba(2,4,16,.72)';
        else if (alt < 0) g.fillStyle = `rgba(2,4,16,${(.72 * (-alt / 6)).toFixed(2)})`;
        else if (h < -2 && alt >= 4) g.fillStyle = 'rgba(255,196,80,.30)';
        else continue;
        g.fillRect(x, y, cw, cw);
      }
    }
    const sx = (sp.lon + 180) / 360 * W, sy = (90 - sp.dec) / 180 * H;
    g.fillStyle = '#ffe28a'; g.shadowColor = '#ffd27a'; g.shadowBlur = 18; g.beginPath(); g.arc(sx, sy, 7, 0, Math.PI * 2); g.fill(); g.shadowBlur = 0;
  };
  if (img.complete && img.naturalWidth) paint(); else img.onload = paint;
  /* which of our cities are in their forenoon now */
  return CITIES.filter(c => {
    const h = ((c[2] - sp.lon) % 360 + 540) % 360 - 180;
    const alt = Math.asin(Math.sin(c[1] * R) * Math.sin(sp.dec * R) + Math.cos(c[1] * R) * Math.cos(sp.dec * R) * Math.cos(h * R)) / R;
    return h < -2 && alt >= 4;
  }).map(c => c[0]);
}
function openWorld() {
  const b = openRunner('الضحى حول العالم');
  html(b, `<div class="hx"><span class="hxi">${ic('sun')}</span><h2>الضحى حول العالم</h2>
    <p class="muted" style="text-align:center">صورة الأرض الحقيقية من ناسا. الحزام الذهبي: حيث يعيش الناس ضحاهم الآن. الضحى لا ينقطع عن الأرض لحظة.</p>
    <div class="worldbox"><canvas id="wC" width="1440" height="720"></canvas></div>
    <div class="card"><b>الآن وقت الضحى في:</b><p id="wCities" class="wcities"></p></div>
    <small class="src">${ic('book')} صورة الأرض: NASA Visible Earth · الحساب فلكي تقريبي</small>
    <button class="btn btn-sun btn-wide" data-x2>سبحان من يقلّب الليل والنهار</button></div>`);
  const draw = () => { if (!Run.el || !$('#wC')) return; const list = renderWorld($('#wC')); $('#wCities').textContent = list.length ? list.join('، ') : 'لا مدينة من قائمتنا الآن، لكن الضحى قائم في مكانٍ ما على الأرض.'; };
  draw(); const iv = setInterval(() => { if (!Run.el) { clearInterval(iv); return; } draw(); }, 60000);
  $('[data-x2]', b).onclick = () => closeRunner();
  heartSeen('world');
}

/* ---------- night mode and the bedtime review ---------- */
function isNightNow(now = new Date()) { const t = dayTimes(now); return !!t.set && (now > new Date(+t.set + 80 * 6e4) || now < t.fajr); }
function applyNight() { document.body.classList.toggle('nightmode', isNightNow()); }
function bedtimeCard() {
  if (!isNightNow()) return '';
  const ph = moonPhase();
  return `<div class="card bedcard"><canvas class="moonc" width="160" height="160" id="moonC" aria-label="القمر الليلة: ${ph.name}"></canvas>
    <div class="grow"><span class="eyebrow">والليل إذا سجى · القمر الليلة ${ph.name} (${ARN(Math.round(ph.illum * 100))}٪)</span><h3>راجع قبل النوم</h3><p class="dim">النوم بعد المراجعة يثبّت الحفظ. شغّل التلاوة واتركها تنطفئ وحدها.</p>
    <div class="chips" style="margin-top:8px">${[10, 20, 30].map(m => `<button class="chip" data-sleep="${m}">${ARN(m)} دقيقة</button>`).join('')}<button class="chip" data-go="bedtime">${ic('moon')} حكاية الليلة: ${esc(prTonight().t)}</button></div></div></div>`;
}
const Sleep = { t: 0 };
function startSleep(min) {
  clearTimeout(Sleep.t); Sfx.init();
  const vs = [1, 2, 3, 4].filter(stDone).flatMap(id => STATIONS[id - 1].verses);
  playSeq(vs.length ? vs : verseRange(1, NV), { loop: true, gap: 1200 });
  toast(`تلاوة هادئة لمدة ${ARN(min)} دقيقة ثم تتوقف وحدها`, 'moon');
  Sleep.t = setTimeout(() => { stopAll(); Amb.set('night', .2); Sleep.t = setTimeout(() => Amb.set(null), 18e4); }, min * 6e4);
}

/* ---------- Mecca from space: the real photograph uncovers itself as you memorize ---------- */
function meccaCard() {
  const mem = new Set(); [1, 2, 3, 4].forEach(id => { if (stDone(id)) STATIONS[id - 1].verses.forEach(v => mem.add(v)); });
  return `<button class="card meccacard" id="meccaCard"><div class="mimg"><img src="img/mecca.jpg" alt="مكة ليلًا من محطة الفضاء الدولية" loading="lazy"><div class="mtiles">${verseRange(1, NV).map(n => `<i class="${mem.has(n) ? 'open' : ''}"></i>`).join('')}<i class="${mem.size === 11 ? 'open' : ''}"></i></div></div>
    <span class="mcap"><span class="eyebrow">مكة من الفضاء · ${ARN(mem.size)} من ١١</span><b>كل آية تحفظها تكشف جزءًا من الصورة</b><span class="dim">صورة حقيقية التقطها رواد محطة الفضاء الدولية، المدينة التي نزلت فيها السورة.</span></span></button>`;
}
function openMecca() {
  const b = openRunner('مكة من الفضاء');
  html(b, `<div class="hx"><span class="hxi">${ic('star')}</span><h2>مكة من الفضاء</h2>
    <div class="uscene tall"><img src="img/mecca.jpg" alt=""></div>
    <p class="muted" style="text-align:center">أضواء مكة ليلًا كما رآها رواد محطة الفضاء الدولية من ارتفاع ٤١٧ كم تقريبًا. في هذه المدينة نزلت سورة الضحى قبل أكثر من ١٤ قرنًا على قلبٍ حزين.</p>
    <small class="src">${ic('book')} NASA · iss069e037428 (٢٦ يوليو ٢٠٢٣) · ملكية عامة</small>
    <button class="btn btn-sun btn-wide" data-x2>تم</button></div>`);
  $('[data-x2]', b).onclick = () => closeRunner();
}
