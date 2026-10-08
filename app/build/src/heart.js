/* ===== «اعرف ربّك… تحبّه» and «لماذا تحفظ؟»: the heart of the journey =====
   Every hadith is sahih or hasan and cited by collection and number; the Quran appears only through exact-text placeholders. */

/* ---------- sun & night times (NOAA-style sunrise equation; good to a minute or two) ---------- */
const CITIES = [
  ['فيينا', 48.2082, 16.3738, 'Europe/Vienna'], ['برلين', 52.52, 13.405, 'Europe/Berlin'], ['ميونخ', 48.137, 11.575, null], ['هامبورغ', 53.551, 9.993, null],
  ['زيورخ', 47.377, 8.541, 'Europe/Zurich'], ['باريس', 48.857, 2.352, 'Europe/Paris'], ['لندن', 51.507, -0.128, 'Europe/London'], ['أمستردام', 52.37, 4.895, 'Europe/Amsterdam'],
  ['بروكسل', 50.85, 4.352, 'Europe/Brussels'], ['ستوكهولم', 59.329, 18.069, 'Europe/Stockholm'], ['كوبنهاغن', 55.676, 12.568, 'Europe/Copenhagen'], ['أوسلو', 59.914, 10.752, 'Europe/Oslo'],
  ['روما', 41.903, 12.496, 'Europe/Rome'], ['مدريد', 40.417, -3.704, 'Europe/Madrid'], ['إسطنبول', 41.008, 28.978, 'Europe/Istanbul'], ['أثينا', 37.984, 23.728, 'Europe/Athens'],
  ['دمشق', 33.513, 36.292, 'Asia/Damascus'], ['حلب', 36.202, 37.134, null], ['حمص', 34.733, 36.717, null], ['بيروت', 33.894, 35.502, 'Asia/Beirut'],
  ['عمّان', 31.954, 35.911, 'Asia/Amman'], ['القدس', 31.778, 35.235, 'Asia/Jerusalem'], ['غزة', 31.502, 34.467, 'Asia/Gaza'], ['بغداد', 33.315, 44.366, 'Asia/Baghdad'],
  ['مكة المكرمة', 21.4225, 39.8262, 'Asia/Riyadh'], ['المدينة المنورة', 24.467, 39.611, null], ['الرياض', 24.713, 46.675, null], ['جدة', 21.485, 39.193, null],
  ['الكويت', 29.376, 47.977, 'Asia/Kuwait'], ['الدوحة', 25.285, 51.531, 'Asia/Qatar'], ['دبي', 25.205, 55.271, 'Asia/Dubai'], ['مسقط', 23.588, 58.383, 'Asia/Muscat'],
  ['القاهرة', 30.044, 31.236, 'Africa/Cairo'], ['الخرطوم', 15.501, 32.56, 'Africa/Khartoum'], ['تونس', 36.806, 10.181, 'Africa/Tunis'], ['الجزائر', 36.754, 3.059, 'Africa/Algiers'],
  ['الدار البيضاء', 33.573, -7.59, 'Africa/Casablanca'], ['طرابلس', 32.887, 13.191, 'Africa/Tripoli'], ['صنعاء', 15.37, 44.191, 'Asia/Aden'], ['طهران', 35.689, 51.389, 'Asia/Tehran'],
  ['كراتشي', 24.861, 67.01, 'Asia/Karachi'], ['جاكرتا', -6.208, 106.846, 'Asia/Jakarta'], ['كوالالمبور', 3.139, 101.687, 'Asia/Kuala_Lumpur'], ['نيويورك', 40.713, -74.006, 'America/New_York'],
  ['تورونتو', 43.653, -79.383, 'America/Toronto'], ['سيدني', -33.869, 151.209, 'Australia/Sydney'],
];
function guessCity() {
  let tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { }
  const c = CITIES.find(c => c[3] === tz) || CITIES.find(c => c[0] === 'مكة المكرمة');
  return { name: c[0], lat: c[1], lon: c[2] };
}
const myCity = () => S.settings.city || guessCity();
function solarDay(date, lat, lon) {
  const R = Math.PI / 180, J0 = 2451545;
  const jdNoon = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12) / 864e5 + 2440587.5;
  const n = Math.round(jdNoon - J0);
  const Js = n - lon / 360;
  const M = (357.5291 + 0.98560028 * Js) % 360;
  const C = 1.9148 * Math.sin(M * R) + 0.02 * Math.sin(2 * M * R) + 0.0003 * Math.sin(3 * M * R);
  const L = (M + C + 180 + 102.9372) % 360;
  const Jt = J0 + Js + 0.0053 * Math.sin(M * R) - 0.0069 * Math.sin(2 * L * R);
  const dec = Math.asin(Math.sin(L * R) * Math.sin(23.4397 * R));
  const toDate = jd => new Date((jd - 2440587.5) * 864e5);
  const at = h => { const c = (Math.sin(h * R) - Math.sin(lat * R) * Math.sin(dec)) / (Math.cos(lat * R) * Math.cos(dec)); if (c < -1 || c > 1) return null; const w = Math.acos(c) / R; return [toDate(Jt - w / 360), toDate(Jt + w / 360)]; };
  const rs = at(-0.833), dawn = at(-18) || at(-12);
  return { noon: toDate(Jt), rise: rs && rs[0], set: rs && rs[1], fajr: dawn ? dawn[0] : (rs ? new Date(rs[0] - 90 * 6e4) : null) };
}
function dayTimes(now = new Date()) {
  const c = myCity(), t = solarDay(now, c.lat, c.lon);
  const y = new Date(now); y.setDate(y.getDate() - 1); const tm = new Date(now); tm.setDate(tm.getDate() + 1);
  const ty = solarDay(y, c.lat, c.lon), tt = solarDay(tm, c.lat, c.lon);
  const night = now < t.fajr ? [ty.set, t.fajr] : [t.set, tt.fajr];
  const third = new Date(night[1] - (night[1] - night[0]) / 3);
  const duha = t.rise ? [new Date(+t.rise + 15 * 6e4), new Date(+t.noon - 10 * 6e4)] : null;
  return { city: c, ...t, night, third, duha };
}
const hm = d => { if (!d) return '—'; try { return ARN(d.toLocaleTimeString('ar-EG-u-nu-latn', { hour: 'numeric', minute: '2-digit' })); } catch (e) { return ARN(`${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`); } };
const inLastThird = (now = new Date()) => { const t = dayTimes(now); return now >= t.third && now < t.night[1]; };

/* ---------- the tab's tiles ---------- */
const HEART = [
  { id: 'msg', t: 'رسالة من ربّك', s: '٤٠ كلمة، ولا مرة «الله»… بل «ربّك» ٣ مرات و«ـكَ» ٩ مرات.', ic: 'name', tone: 'love' },
  { id: 'drop', t: 'قطرة من مئة', s: 'كل حنان الدنيا من جزء واحد… والـ٩٩ مخبّأة ليوم القيامة.', ic: 'drop', tone: 'mercy' },
  { id: 'mother', t: 'أرحم من الأم', s: 'أحنّ قلب تعرفه… الله أرحم منه.', ic: 'heart', tone: 'mercy' },
  { id: 'steps', t: 'خطوة… ويأتيك هرولة', s: 'تقترب شبرًا، فيقترب ذراعًا.', ic: 'steps', tone: 'love' },
  { id: 'camel', t: 'أفرح برجوعك', s: 'فرحُ الله بتوبتك أعظم من فرح من وجد حياته بعد ضياعها.', ic: 'sun', tone: 'gold' },
  { id: 'night', t: 'هل من داعٍ؟', s: 'في ثلث الليل الأخير… نداءٌ لك.', ic: 'moon', tone: 'justice' },
  { id: 'sun', t: 'قوّته', s: 'الشمس التي تدفئك آيةٌ صغيرة بيده.', ic: 'radiance', tone: 'power' },
  { id: 'scale', t: 'رحمته ليست ضعفًا', s: 'رحمةٌ تسبق، وعدلٌ لا يغيب.', ic: 'scale', tone: 'justice' },
  { id: 'bird', t: 'طيرٌ بجناحين', s: 'المحبة رأس، والخوف والرجاء جناحان.', ic: 'bird', tone: 'love' },
  { id: 'first', t: 'حبّه سبق', s: '﴿يُحِبُّهُمْ وَيُحِبُّونَهُۥٓ﴾ قدّم محبته لهم.', ic: 'heart', tone: 'love' },
  { id: 'names', t: 'أسماء الله في الضحى', s: 'في كل آية اسمٌ يتجلّى… اجمعها.', ic: 'star', tone: 'gold' },
  { id: 'duas', t: 'دعاء لكل آية', s: '١١ دعاءً صحيحًا يكمّل معنى الآيات.', ic: 'hands', tone: 'mercy' },
];
const WHY = [
  { id: 'letters', t: 'كل حرف بحسنة', s: 'لا كل كلمة… بل كل حرف، والحسنة بعشر أمثالها.', ic: 'text', tone: 'gold' },
  { id: 'ladder', t: 'كل آية درجة', s: '«اقرأ وارتقِ»: الضحى ١١ درجة.', ic: 'ladder', tone: 'gold' },
  { id: 'hard', t: 'صعبة عليك؟', s: 'من يتتعتع فيه وهو عليه شاقّ… له أجران.', ic: 'flame', tone: 'power' },
  { id: 'shafi', t: 'يدافع عنك', s: '«يأتي يوم القيامة شفيعًا لأصحابه».', ic: 'shield', tone: 'sky' },
  { id: 'rise', t: 'يرفعك', s: '«إن الله يرفع بهذا الكتاب أقوامًا».', ic: 'next', tone: 'sky' },
  { id: 'citron', t: 'طعمٌ وريح', s: 'قارئ القرآن كالأترجّة: ريحها طيب وطعمها طيب.', ic: 'fruit', tone: 'mercy' },
  { id: 'ifnot', t: 'وإذا لم أحفظ؟', s: 'الجواب بصدق: لا إثم عليك… لكن انظر ماذا تخسر.', ic: 'info', tone: 'justice' },
  { id: 'tether', t: 'عقال الحفظ', s: 'الحفظ يتفلّت أسرع من الإبل… شُدّ عقاله بالمراجعة.', ic: 'rope', tone: 'power' },
  { id: 'forgot', t: 'لا تقل «نسيت»', s: 'كلمةٌ علّمنا النبي ﷺ ألّا نقولها.', ic: 'repeat', tone: 'love' },
];

function renderHeart() {
  const v = $('#v-heart'), t = dayTimes(), third = inLastThird();
  const tile = x => `<button class="htile t-${x.tone}" data-h="${x.id}"><span class="hti">${ic(x.ic)}</span><b>${x.t}</b><span>${qfmt(x.s)}</span>${S.heart && S.heart[x.id] ? `<em>${ic('check')}</em>` : ''}</button>`;
  html(v, `
  <div class="hhead">
    <span class="eyebrow">قلب الرحلة</span>
    <h2>اعرف ربّك… تحبّه</h2>
    <p class="muted">«القلب في سيره إلى الله بمنزلة الطائر؛ فالمحبة رأسه، والخوف والرجاء جناحاه» — ابن القيم، مدارج السالكين</p>
  </div>
  ${third ? `<button class="card nightnow" data-h="night">${ic('moon')}<span><b>الآن ثلث الليل الأخير في ${esc(t.city.name)}</b><span>ربّك ينادي: «من يدعوني فأستجيب له؟»</span></span></button>` : ''}
  <div class="htiles">${HEART.map(tile).join('')}</div>
  <div class="hhead" style="margin-top:6px"><span class="eyebrow">لماذا تحفظ؟</span><h2>بالدليل… وبصدق</h2></div>
  <div class="htiles">${WHY.map(tile).join('')}</div>
  <div class="hhead" style="margin-top:6px"><span class="eyebrow">جديد · ليل الأنبياء وضحاهم</span><h2>كل ليلٍ يعقبه ضحى</h2></div>
  <div class="htiles">${[['prophets', 'lantern', 'ليل الأنبياء وضحاهم', 'يوسف في البئر، ويونس في بطن الحوت… ثم الضحى', 'love'], ['yunus', 'whale', 'يونس في الظلمات', 'تجربةٌ في العتمة، ودعاءٌ يُخرج إلى النور', 'sky'], ['duas', 'hands', 'أدعية الأنبياء', 'ثمانية أدعية تجمعها بالحفظ', 'gold'], ['bedtime', 'moon', 'حكاية قبل النوم', 'قصص الأنبياء من القرآن وحده، بصوت الراوي', 'sky'], ['friday', 'calendar', 'قصة الجمعة', 'من الصحيحين، وسؤالٌ للغداء', 'love'], ['deeds', 'heart', 'ليش الدين جميل؟', 'عشر بطاقات، وفعلٌ صغير لليوم', 'gold']].map(([go, i, t, s, tone]) => `<button class="htile t-${tone}" data-go="${go}"><span class="hti">${ic(i)}</span><b>${t}</b><span>${s}</span></button>`).join('')}</div>
  <div class="hhead" style="margin-top:6px"><span class="eyebrow">من الآية لحياتك</span><h2>عِشها في يومك</h2></div>
  <div class="htiles">${LIFE.map(x => `<button class="htile t-${x.tone}" data-go="${x.id}"><span class="hti">${ic(x.ic)}</span><b>${x.t}</b><span>${qfmt(x.s)}</span></button>`).join('')}</div>
  <p class="dim" style="text-align:center">كل حديث هنا صحيح أو حسن ومعه رقمه. <button class="linkish" data-go="credits">المصادر</button></p>`);
  v.onclick = e => { const b = e.target.closest('[data-h]'); if (b) openHeartItem(b.dataset.h); };
}
function heartSeen(id) { S.heart = S.heart || {}; if (!S.heart[id]) { S.heart[id] = dayKey(); addXP(5); save(); const n = Object.keys(S.heart).length; if (n >= 10) award('heart10'); if (n >= HEART.length + WHY.length) award('heartAll'); } }

/* one full-screen experience per tile, inside the runner layer */
function openHeartItem(id) {
  const all = [...HEART, ...WHY], it = all.find(x => x.id === id); if (!it) return;
  const b = openRunner(it.t);
  Run.el.classList.add('heartrun', 't-' + it.tone);
  const f = HEART_X[id]; f(b, it);
  heartSeen(id);
}
const hx = (it, body) => `<div class="hx"><span class="hxi">${ic(it.ic)}</span><h2>${it.t}</h2>${body}</div>`;
const hsrc = s => `<small class="src">${ic('book')} ${esc(s)}</small>`;
const hadith = (txt, src) => `<blockquote class="hd">${esc(txt)}${hsrc(src)}</blockquote>`;
const doneBtn = (t = 'الحمد لله') => `<button class="btn btn-sun btn-wide" data-x2>${t}</button>`;
function bindDone(b) { const d = $('[data-x2]', b); if (d) d.onclick = () => closeRunner(); }

const HEART_X = {
  msg(b, it) {
    const kafs = [], rabb = [];
    for (let n = 1; n <= NV; n++) QD.verses[n].forEach((w, i) => { const base = w.replace(/[^ء-ي]/g, ''); if (base.endsWith('ك')) kafs.push(`${n}:${i}`); if (base === 'ربك') rabb.push(`${n}:${i}`); });
    let found = new Set();
    html(b, hx(it, `<p class="muted">في السورة ٩ كلمات تنتهي بـ«ـكَ»: خطابٌ مباشر. المس الكلمات لتجدها كلها.</p>
      <div class="panel"><div class="qt night hsurah">${verseRange(1, NV).map(n => verseHTML(n)).join(' ')}</div></div>
      <div class="row" style="justify-content:center"><span class="badge" id="kCnt">٠ من ٩</span></div>
      <div id="kMsg"></div>`));
    $$('.hsurah .w', b).forEach(w => { const k = `${w.dataset.v}:${w.dataset.w}`; if (rabb.includes(k)) w.classList.add('rabb'); });
    $('.hsurah', b).onclick = e => {
      const w = e.target.closest('.w'); if (!w) return; const k = `${w.dataset.v}:${w.dataset.w}`;
      if (!kafs.includes(k)) { w.animate([{ transform: 'translateX(-3px)' }, { transform: 'translateX(3px)' }, { transform: 'none' }], { duration: 220 }); Sfx.bad(); return; }
      if (found.has(k)) return; found.add(k); w.classList.add('kaf'); hit();
      $('#kCnt').textContent = `${ARN(found.size)} من ٩`;
      if (found.size === kafs.length) {
        $('#kMsg').innerHTML = `<div class="card reveal"><p class="big">كأنها رسالةٌ باسمك.</p><p>الخطاب للنبي ﷺ في أصعب أيامه، ولم تُذكر فيها كلمة «الله» ولا مرة، بل «ربّك» ثلاث مرات. والربّ في اللغة: المالك والمربّي والمصلح، الذي يرعاك خطوة بخطوة.</p>${doneBtn('سبحان ربّي')}</div>`; bindDone(b); Sfx.win && Sfx.win();
      }
    };
  },
  drop(b, it) {
    html(b, hx(it, `<p class="muted">مئة قطرة. واحدةٌ فقط نزلت إلى الأرض… المسها.</p>
      <div class="drops" id="drops">${Array.from({ length: 100 }, (_, i) => `<i class="${i === 57 ? 'one' : ''}"></i>`).join('')}</div>
      <div id="dMsg"></div>`));
    const show = (html_, after) => { $('#dMsg').innerHTML = html_; after && after(); };
    $('#drops').onclick = e => {
      const d = e.target.closest('i.one'); if (!d || b.dataset.s) return; b.dataset.s = 1; Sfx.ok();
      d.classList.add('fall');
      setTimeout(() => show(`<div class="card reveal"><div class="mercyreel">${['v9', 'v10', 'v6'].filter(hasScene).map(k => `<img src="${posterUrl(k)}" alt="">`).join('')}</div>
        <p class="big">من هذا الجزء وحده يتراحم الخلق كلهم.</p>
        ${hadith('«جعل الله الرحمة مئة جزء، فأمسك عنده تسعة وتسعين جزءًا، وأنزل في الأرض جزءًا واحدًا، فمن ذلك الجزء يتراحم الخلق، حتى ترفع الفرس حافرها عن ولدها خشية أن تصيبه».', 'البخاري ٦٠٠٠')}
        <button class="btn btn-line btn-wide" id="d99">${ic('sparkle')} وأين التسعة والتسعون؟</button></div>`, () => {
        $('#d99').onclick = () => { $$('#drops i').forEach((x, i) => setTimeout(() => x.classList.add('lit'), i * 12)); show(`<div class="card reveal"><p class="big">مخبّأةٌ لك… ليوم القيامة.</p>${hadith('«وأخّر تسعًا وتسعين رحمةً يرحم بها عباده يوم القيامة».', 'مسلم ٢٧٥٢')}${doneBtn('اللهم ارحمنا')}</div>`, () => bindDone(b)); };
      }), 900);
    };
  },
  mother(b, it) {
    const steps = [
      'قُدِم على النبي ﷺ بسبي، فإذا امرأةٌ من السبي قد تحلّب ثديها تسعى…',
      'فلما وجدت صبيًّا من السبي أخذته، فألصقته ببطنها وأرضعته.',
      'فقال النبي ﷺ لأصحابه: «أترون هذه طارحةً ولدها في النار؟»',
      'قالوا: لا، وهي تقدر على ألّا تطرحه.',
      'فقال: «لَلّهُ أرحمُ بعباده من هذه بولدها».',
    ];
    let i = 0;
    html(b, hx(it, `${hasScene('v9') ? `<div class="uscene"><img src="${posterUrl('v9')}" alt=""></div>` : ''}<div class="panel story" id="mStory"></div><button class="btn btn-sun btn-wide" id="mGo">تابع</button><p class="dim" style="text-align:center">البخاري ٥٩٩٩، مسلم ٢٧٥٤</p>`));
    const draw = () => { $('#mStory').innerHTML = steps.slice(0, i + 1).map((s, k) => `<p class="${k === i ? 'now' : ''}">${esc(s)}</p>`).join(''); if (i === steps.length - 1) { $('#mGo').textContent = 'اللهم ارحمني'; $('#mGo').onclick = () => closeRunner(); } };
    draw(); $('#mGo').onclick = () => { if (i < steps.length - 1) { i++; draw(); Sfx.tap(); } };
  },
  steps(b, it) {
    const L = [['تقرّب إليه شبرًا', 1, 2, '«وإن تقرّب إليّ شبرًا تقرّبتُ إليه ذراعًا»'], ['تقرّب ذراعًا', 2, 4, '«وإن تقرّب إليّ ذراعًا تقرّبتُ إليه باعًا»'], ['امشِ إليه', 3, 9, '«وإن أتاني يمشي أتيتُه هرولة»']];
    let k = 0;
    html(b, hx(it, `<div class="track"><span class="me" id="tMe">${ic('steps')}</span><span class="light" id="tHim"></span></div>
      <div class="panel" id="tTxt"><p class="big">«أنا عند ظنّ عبدي بي، وأنا معه إذا ذكرني».</p></div>
      <button class="btn btn-sun btn-wide" id="tGo">${L[0][0]}</button><p class="dim" style="text-align:center">البخاري ٧٤٠٥، مسلم ٢٦٧٥</p>`));
    const ME = [0, 7, 19, 26], HIM = [0, 14, 38, 56];
    const put = () => { $('#tMe').style.insetInlineStart = `${ME[k]}%`; $('#tHim').style.insetInlineEnd = `${HIM[k]}%`; };
    put();
    $('#tGo').onclick = () => {
      if (k >= L.length) return closeRunner();
      const [, , , q] = L[k]; k++; put(); k--; Sfx.ok(); buzz(12);
      $('#tTxt').innerHTML = `<p class="big">${esc(q)}</p>`; k++;
      $('#tGo').textContent = k < L.length ? L[k][0] : 'سأقترب كل يوم';
      if (k >= L.length) { $('#tHim').classList.add('arrive'); }
    };
  },
  camel(b, it) {
    const steps = [
      'رجلٌ في صحراء قاحلة، على راحلته طعامه وشرابه…',
      'فانفلتت منه وضاعت، فبحث عنها حتى أيس.',
      'فأتى شجرةً فاضطجع في ظلها، قد أيس من راحلته.',
      'فبينما هو كذلك، إذا هي قائمةٌ عنده!',
      'فأخذ بخطامها، ثم قال من شدة الفرح: «اللهم أنت عبدي وأنا ربك» — أخطأ من شدة الفرح.',
      'قال النبي ﷺ: «لَلّهُ أشدُّ فرحًا بتوبة عبده حين يتوب إليه من أحدكم…»',
    ];
    let i = 0;
    html(b, hx(it, `<div class="uscene tall"><div class="cmedia" id="camScene"></div></div><div class="panel story" id="cStory"></div><button class="btn btn-sun btn-wide" id="cGo">تابع</button><p class="dim" style="text-align:center">مسلم ٢٧٤٧</p>`));
    const sc = RealScene($('#camScene'), { scene: hasScene('desert') ? 'desert' : 'v0', reduce: reduceMotion() }); sc.start();
    const draw = () => { $('#cStory').innerHTML = steps.slice(0, i + 1).map((s, k) => `<p class="${k === i ? 'now' : ''}">${esc(s)}</p>`).join(''); if (i === steps.length - 1) { $('#cGo').textContent = 'أستغفر الله وأتوب إليه'; $('#cGo').onclick = () => { sc.stop(); closeRunner(); }; } };
    draw(); $('#cGo').onclick = () => { if (i < steps.length - 1) { i++; draw(); Sfx.tap(); } };
  },
  night(b, it) {
    const t = dayTimes(), now = new Date(), live = now >= t.third && now < t.night[1];
    html(b, hx(it, `<div class="uscene tall"><div class="cmedia" id="nScene"></div></div>
      ${hadith('«ينزل ربنا تبارك وتعالى كل ليلة إلى السماء الدنيا حين يبقى ثلث الليل الآخر، يقول: من يدعوني فأستجيب له؟ من يسألني فأعطيه؟ من يستغفرني فأغفر له؟»', 'البخاري ١١٤٥، مسلم ٧٥٨')}
      <div class="card times"><div class="row"><b class="grow">${ic('pin')} ${esc(t.city.name)}</b><button class="chip" id="nCity">تغيير المدينة</button></div>
        <div class="tgrid"><span>المغرب</span><b>${hm(t.night[0])}</b><span>بداية الثلث الأخير</span><b class="gold">${hm(t.third)}</b><span>الفجر</span><b>${hm(t.night[1])}</b></div>
        <p class="dim">${live ? 'أنت الآن في الثلث الأخير. هذه لحظتك.' : `الثلث الأخير الليلة يبدأ نحو ${hm(t.third)}. الأوقات تقريبية بحسب الحساب الفلكي.`}</p></div>
      <div class="card"><b>دعاؤك (خاصٌّ بك، لا يراه غيرك)</b><textarea id="nDua" placeholder="اكتب ما تريد أن تسأل ربّك…">${esc(S.dua || '')}</textarea></div>
      ${doneBtn('آمين')}`));
    const sc = RealScene($('#nScene'), { scene: 'v2', reduce: reduceMotion() }); sc.start(); Amb.set('night', .26);
    $('#nDua').oninput = e => { S.dua = e.target.value; save(); };
    $('#nCity').onclick = () => pickCity(() => { sc.stop(); openHeartItem('night'); });
    $('[data-x2]', b).onclick = () => { sc.stop(); closeRunner(); };
  },
  sun(b, it) {
    const t0 = performance.now();
    html(b, hx(it, `<div class="uscene tall"><div class="cmedia" id="sScene"></div></div>
      <div class="sunstats"><div><b id="sTons">٠</b><span>مليون طن من الهيدروجين حوّلتها الشمس منذ فتحت هذه الصفحة</span></div><div><b>٨:٢٠</b><span>دقيقة: عمر ضوء الضحى الذي على وجهك الآن</span></div></div>
      <div class="panel"><p class="big qcenter">﴿وَٱلسَّمَـٰوَٰتُ مَطْوِيَّـٰتٌۢ بِيَمِينِهِۦ﴾</p><p class="muted" style="text-align:center">الشمس تحوّل نحو ٦٠٠ مليون طن من الهيدروجين كل ثانية، وتبعد عنا نحو ١٥٠ مليون كم. ومع ذلك فالسماوات كلها مطويّاتٌ بيمينه يوم القيامة.</p></div>
      <small class="src">${ic('book')} Science in School (CERN)؛ NASA؛ الزمر: ٦٧</small>${doneBtn('سبحان الله العظيم')}`));
    const sc = RealScene($('#sScene'), { scene: hasScene('sun') ? 'sun' : 'v1', reduce: reduceMotion() }); sc.start();
    const tick = () => { const el = $('#sTons'); if (!el || !Run.el) return; el.textContent = ARN(Math.floor((performance.now() - t0) / 1000 * 600).toLocaleString('en').replace(/,/g, '٬')); requestAnimationFrame(tick); };
    tick(); $('[data-x2]', b).onclick = () => { sc.stop(); closeRunner(); };
  },
  scale(b, it) {
    html(b, hx(it, `<div class="balance" id="bal"><div class="beam"><span class="pan l">رحمة</span><span class="pan r">عدل</span></div><i class="post"></i></div>
      <div class="panel"><p class="big qcenter">﴿نَبِّئْ عِبَادِىٓ أَنِّىٓ أَنَا ٱلْغَفُورُ ٱلرَّحِيمُ ۝ وَأَنَّ عَذَابِى هُوَ ٱلْعَذَابُ ٱلْأَلِيمُ﴾</p><p class="muted" style="text-align:center">بدأ بالمغفرة والرحمة، ثم ذكر العذاب. وفي الحديث القدسي: «إن رحمتي سبقت غضبي».</p>${hsrc('الحجر: ٤٩–٥٠؛ البخاري ٧٥٥٤')}</div>
      <div class="panel"><p><b>والعدل يحمي الضعيف.</b> الربّ الذي آوى النبي ﷺ يتيمًا قال فيمن يأكل مال اليتيم ظلمًا:</p><p class="qcenter">﴿إِنَّ ٱلَّذِينَ يَأْكُلُونَ أَمْوَٰلَ ٱلْيَتَـٰمَىٰ ظُلْمًا إِنَّمَا يَأْكُلُونَ فِى بُطُونِهِمْ نَارًا ۖ وَسَيَصْلَوْنَ سَعِيرًا﴾</p></div>
      ${doneBtn('أرجو رحمته وأخشى عذابه')}`));
    setTimeout(() => $('#bal').classList.add('tilt'), 400); bindDone(b);
  },
  bird(b, it) {
    html(b, hx(it, `<div class="birdbox"><div class="birdv" id="birdV"><div class="cmedia" id="bScene"></div></div><div class="bird" id="bird">${ic('bird')}</div></div>
      <div class="field">الخوف<input type="range" id="bF" min="0" max="100" value="20"></div>
      <div class="field">الرجاء<input type="range" id="bH" min="0" max="100" value="80"></div>
      <label class="toggle"><span>${ic('heart')} المحبة (الرأس)</span><input type="checkbox" id="bL" checked></label>
      <div class="panel" id="bMsg"></div>${hsrc('ابن القيم، مدارج السالكين')}${doneBtn('اللهم ارزقني حبك')}`));
    const sc = RealScene($('#bScene'), { scene: 'v1', reduce: reduceMotion() }); sc.start();
    const upd = () => {
      const f = +$('#bF').value, h = +$('#bH').value, l = $('#bL').checked, d = h - f;
      $('#bird').style.transform = `rotate(${clamp(d / 100, -1, 1) * -28}deg) translateY(${l ? 0 : 60}px)`;
      $('#bird').classList.toggle('dead', !l);
      $('#bMsg').innerHTML = !l ? '<p class="big">«متى قُطع الرأس مات الطائر».</p><p>بلا محبة لا يطير القلب.</p>'
        : Math.abs(d) <= 15 ? '<p class="big">«فمتى سلم الرأس والجناحان فالطائر جيد الطيران».</p>'
          : d > 0 ? '<p class="big">رجاءٌ بلا خوف يورث الأمن من مكر الله.</p><p class="muted">ارفع جناح الخوف قليلًا.</p>'
            : '<p class="big">خوفٌ بلا رجاء يورث اليأس من رحمة الله.</p><p class="muted">ارفع جناح الرجاء.</p>';
    };
    ['bF', 'bH', 'bL'].forEach(id => $('#' + id).oninput = upd); upd();
    $('[data-x2]', b).onclick = () => { sc.stop(); closeRunner(); };
  },
  first(b, it) {
    html(b, hx(it, `<div class="panel"><p class="big qcenter">﴿يُحِبُّهُمْ وَيُحِبُّونَهُۥٓ﴾</p><p class="muted" style="text-align:center">لاحظ الترتيب: «يحبهم» قبل «ويحبونه». محبته لهم سبقت محبتهم له.</p>${hsrc('المائدة: ٥٤')}</div>
      ${hadith('«إذا أحبّ الله عبدًا نادى جبريل: إن الله يحب فلانًا فأحببه، فيحبه جبريل، فينادي جبريل في أهل السماء: إن الله يحب فلانًا فأحبوه، فيحبه أهل السماء، ثم يوضع له القبول في الأرض».', 'البخاري ٣٢٠٩، مسلم ٢٦٣٧')}
      ${doneBtn('اللهم اجعلني ممن تحبهم')}`)); bindDone(b);
  },
  names(b, it) {
    S.names = S.names || [];
    const list = verseRange(1, NV).map(n => ({ n, c: DEEP[n].cards.find(c => c.k === 'name') })).filter(x => x.c);
    html(b, hx(it, `<p class="muted">في كل آية من الضحى اسمٌ من أسماء الله يتجلّى. المس الاسم لتجمعه.</p><div class="names">${list.map(x => { const nm = x.c.s.split(':')[0]; const got = S.names.includes(x.n); return `<button class="nm ${got ? 'got' : ''}" data-n="${x.n}"><span class="nn">${esc(nm)}</span><span class="nv">الآية ${ARN(x.n)}</span></button>`; }).join('')}</div><div id="nmBox"></div>`));
    $('.names', b).onclick = e => {
      const x = e.target.closest('.nm'); if (!x) return; const n = +x.dataset.n, c = list.find(y => y.n === n).c;
      if (!S.names.includes(n)) { S.names.push(n); save(); x.classList.add('got'); hit(); if (S.names.length === list.length) award('names'); }
      $('#nmBox').innerHTML = `<div class="card reveal"><p class="big">${qfmt(c.s)}</p><p class="qcenter">${qfmt(c.d)}</p>${hsrc(c.src)}</div>`;
    };
  },
  duas(b, it) {
    const list = verseRange(1, NV).map(n => ({ n, c: DEEP[n].cards.find(c => c.k === 'dua') })).filter(x => x.c);
    html(b, hx(it, `<div class="duas">${list.map(x => `<div class="card"><span class="eyebrow">بعد الآية ${ARN(x.n)}</span><p class="big">${esc(x.c.s)}</p>${x.c.d ? `<p class="muted">${esc(x.c.d)}</p>` : ''}${hsrc(x.c.src)}</div>`).join('')}</div>${doneBtn('آمين')}`)); bindDone(b);
  },
  letters(b, it) {
    const total = S.letters || 0;
    html(b, hx(it, `<div class="bigstat"><b>${ARN(total.toLocaleString('en').replace(/,/g, '٬'))}</b><span>حرفًا تلوتها أو استمعت إليها في هذه الرحلة</span></div>
      ${hadith('«من قرأ حرفًا من كتاب الله فله به حسنة، والحسنة بعشر أمثالها، لا أقول «الم» حرف، ولكن ألفٌ حرف، ولامٌ حرف، وميمٌ حرف».', 'الترمذي ٢٩١٠')}
      <div class="panel"><p>سورة الضحى ٤٠ كلمة ونحو ١٦٥ حرفًا. قراءتها مرةً واحدة: أكثر من ١٦٠٠ حسنة بوعد النبي ﷺ… والله يضاعف لمن يشاء.</p><p class="dim">العدد تقريبي؛ طرق عدّ الحروف تختلف بين الرسم العثماني والإملائي.</p></div>${doneBtn('سأقرؤها الآن')}`));
    $('[data-x2]', b).onclick = () => { closeRunner(); showTab('watch'); };
  },
  ladder(b, it) {
    const mem = new Set(); [1, 2, 3, 4].forEach(id => { if (stDone(id)) STATIONS[id - 1].verses.forEach(v => mem.add(v)); });
    html(b, hx(it, `<div class="ladder">${verseRange(1, NV).reverse().map(n => `<div class="rung ${mem.has(n) ? 'on' : ''}"><span>${ARN(n)}</span><b>${VERSES[n].symName}</b></div>`).join('')}</div>
      <div class="bigstat"><b>${ARN(mem.size)} / ١١</b><span>درجة صعدتها بالحفظ</span></div>
      ${hadith('«يقال لصاحب القرآن: اقرأ وارتقِ ورتّل كما كنت ترتّل في الدنيا، فإن منزلتك عند آخر آية تقرأ بها».', 'الترمذي ٢٩١٤ (صحّحه الألباني)')}
      <div class="panel"><p>قال الخطابي: «جاء في الأثر أن عدد آي القرآن على قدر درج الجنة».</p></div>
      ${mem.size < 11 ? `<button class="btn btn-sun btn-wide" id="lGo2">اصعد درجة الآن</button>` : doneBtn('الحمد لله')}`));
    const g = $('#lGo2', b); if (g) g.onclick = () => { closeRunner(); const nx = nextStation(); go(nx ? 'st' + nx.id : 'play'); }; else bindDone(b);
  },
  hard(b, it) {
    html(b, hx(it, `${hadith('«الماهر بالقرآن مع السفرة الكرام البررة، والذي يقرأ القرآن ويتتعتع فيه وهو عليه شاق له أجران».', 'البخاري ٤٩٣٧، مسلم ٧٩٨ واللفظ له')}
      <div class="panel"><p class="big">تعبك ليس عيبًا… تعبك أجرٌ ثانٍ.</p><p class="muted">أجرٌ للقراءة، وأجرٌ للمشقة. فلا تخجل من التعثّر، واستمر.</p></div>${doneBtn('سأستمر')}`)); bindDone(b);
  },
  shafi(b, it) {
    html(b, hx(it, `${hadith('«اقرؤوا القرآن؛ فإنه يأتي يوم القيامة شفيعًا لأصحابه».', 'مسلم ٨٠٤')}<div class="panel"><p class="big">السورة التي تحفظها اليوم… تشفع لك غدًا.</p></div>${doneBtn()}`)); bindDone(b);
  },
  rise(b, it) {
    html(b, hx(it, `${hadith('«إن الله يرفع بهذا الكتاب أقوامًا ويضع به آخرين».', 'مسلم ٨١٧')}${hadith('«خيركم من تعلّم القرآن وعلّمه».', 'البخاري ٥٠٢٧')}${doneBtn()}`)); bindDone(b);
  },
  citron(b, it) {
    html(b, hx(it, `${hasScene('citron') ? `<div class="uscene square"><img src="${posterUrl('citron')}" alt="ثمرة الأترجّة على شجرتها"></div>` : ''}
      ${hadith('«مثل المؤمن الذي يقرأ القرآن كمثل الأترجّة: ريحها طيب وطعمها طيب».', 'البخاري ٥٠٢٠، مسلم ٧٩٧')}
      <div class="panel"><p class="big">طعمٌ في قلبك، وريحٌ يشمّه من حولك.</p></div>${doneBtn()}`)); bindDone(b);
  },
  ifnot(b, it) {
    html(b, hx(it, `<div class="panel"><p class="big">بصدق: لا إثم عليك إن لم تحفظ سورة الضحى.</p>
      <p>الواجب على كل مسلم أن يحفظ ما تصحّ به صلاته، وحفظ القرآن كله فرضُ كفاية على الأمة، كما قرّر العلماء.</p></div>
      <div class="panel"><p class="big">لكن انظر ماذا تخسر:</p><ul class="lose"><li>١١ درجة في الجنة كانت محجوزة لك.</li><li>أكثر من ١٦٠٠ حسنة في كل قراءة.</li><li>رفيقٌ يشفع لك يوم القيامة.</li><li>سورةٌ نزلت لتطمئن قلبًا حزينًا… قد يكون قلبك يومًا.</li></ul></div>
      <p class="qcenter">﴿وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰٓ﴾</p><p class="muted" style="text-align:center">هديةٌ من ربّك… ومن يردّ هدية؟</p>${doneBtn('سأحفظها')}`));
    $('[data-x2]', b).onclick = () => { closeRunner(); const nx = nextStation(); go(nx ? 'st' + nx.id : 'play'); };
  },
  tether(b, it) {
    const k = dayKey();
    const rows = [1, 2, 3, 4].map(id => {
      const st = S.st[id], s = STATIONS[id - 1];
      if (!st || !st.done) return { id, s, state: 'none', f: 0 };
      const left = daysBetween(k, st.next), span = INTERVALS[st.stage || 0] || 1;
      const f = clamp(left / span); return { id, s, state: left < 0 ? 'loose' : f < .34 ? 'weak' : 'tight', f, left };
    });
    html(b, hx(it, `${hadith('«تعاهدوا القرآن، فوالذي نفسي بيده لهو أشدّ تفصّيًا من الإبل في عُقُلها».', 'البخاري ٥٠٣٣، مسلم ٧٩١')}
      <div class="tethers">${rows.map(r => `<div class="teth ${r.state}"><span class="tn">${r.s.name}</span><span class="rope"><i style="width:${r.state === 'none' ? 0 : Math.max(.12, r.f) * 100}%"></i></span><span class="tl">${r.state === 'none' ? 'لم يُربط بعد' : r.state === 'loose' ? 'العقال مرتخٍ!' : r.state === 'weak' ? 'يرتخي قريبًا' : 'مشدود'}</span>${r.state === 'loose' || r.state === 'weak' ? `<button class="chip" data-rv="${r.id}">شُدّه</button>` : ''}</div>`).join('')}</div>
      <p class="dim">كل مراجعة في موعدها تشدّ العقال وتطيل المدة حتى المراجعة التالية.</p>${doneBtn()}`));
    $('.tethers', b).onclick = e => { const r = e.target.closest('[data-rv]'); if (r) { closeRunner(); startReview(+r.dataset.rv); } };
    bindDone(b);
  },
  forgot(b, it) {
    html(b, hx(it, `${hadith('«بئسما لأحدهم أن يقول: نسيتُ آية كيت وكيت، بل هو نُسِّي، واستذكروا القرآن…».', 'البخاري ٥٠٣٢، مسلم ٧٩٠')}
      <div class="panel"><p class="big">لهذا لن تقرأ في هذه الرحلة كلمة «نسيت».</p><p class="muted">إن تفلّتت منك آية فقل: «نُسّيتها… وسأرجعها»، ثم راجعها.</p></div>${doneBtn('سأرجعها')}`)); bindDone(b);
  },
};
function pickCity(after) {
  const cur = myCity();
  openSheet('مدينتك', `<p class="dim">لحساب الضحى والليل بدقة. لا يُرسل موقعك إلى أي مكان.</p>
    ${navigator.geolocation ? `<button class="btn btn-line btn-wide" id="cGeo">${ic('pin')} استخدم موقعي الحالي</button>` : ''}
    <div class="citylist">${CITIES.map((c, i) => `<button class="chip ${c[0] === cur.name ? 'on' : ''}" data-ci="${i}">${c[0]}</button>`).join('')}</div>`, sh => {
    sh.onclick = e => {
      const c = e.target.closest('[data-ci]'); if (c) { const x = CITIES[+c.dataset.ci]; S.settings.city = { name: x[0], lat: x[1], lon: x[2] }; save(); closeSheet(); after && after(); return; }
      if (e.target.closest('#cGeo')) navigator.geolocation.getCurrentPosition(p => { S.settings.city = { name: 'موقعي', lat: +p.coords.latitude.toFixed(3), lon: +p.coords.longitude.toFixed(3) }; save(); closeSheet(); after && after(); }, () => toast('تعذّر تحديد الموقع، اختر مدينتك من القائمة', 'pin'), { timeout: 8000 });
    };
  });
}

/* letters heard or recited, for «كل حرف بحسنة» (approximate: written base letters of each verse) */
const VLET = QD.verses.map(ws => ws.join('').replace(/[^\u0621-\u064A\u0671]/g, '').replace(/\u0640/g, '').length);
Player.subs.add((ev, d) => { if (ev === 'verseEnd' && d.n > 0) { S.letters = (S.letters || 0) + VLET[d.n]; save(); } });
