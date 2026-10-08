/* ===== Finishing touches: a short opening, the scene gallery as a reward, daily reminders and the home-screen widget (Android app) ===== */
const IS_APP = !!(window.DuhaApp && window.DuhaApp.syncWidget);

/* ---------- opening: one quiet sunrise, once per session ---------- */
function playIntro() {
  let seen = false; try { seen = sessionStorage.getItem('duha-intro') === '1'; sessionStorage.setItem('duha-intro', '1'); } catch (e) { }
  if (seen || reduceMotion() || /^#c=/.test(location.hash)) return;
  const el = node(`<div class="intro" aria-hidden="true"><div class="isun"></div><b>رحلة الضحى</b><span>احفظها… وعِشها</span></div>`);
  document.body.appendChild(el);
  setTimeout(() => el.classList.add('out'), 1250);
  setTimeout(() => el.remove(), 1900);
  el.onclick = () => el.remove();
}

/* ---------- the scene gallery: every verse you memorize opens its real scene ---------- */
const GALLERY = [
  ['v0', 'الافتتاح', () => true, 'مفتوح دائمًا'],
  ...verseRange(1, NV).map(n => ['v' + n, `الآية ${ARN(n)}`, () => [1, 2, 3, 4].some(id => stDone(id) && STATIONS[id - 1].verses.includes(n)), 'احفظها ليُفتح']),
  ['sun', 'قوّة الله: الشمس', () => !!(S.heart && S.heart.sun), 'افتح «قوّته» في تبويب ربّك'],
  ['desert', 'قصة الصحراء', () => !!(S.heart && S.heart.camel), 'افتح «أفرح برجوعك» في تبويب ربّك'],
].filter(g => hasScene(g[0]));
function openGallery() {
  const b = openRunner('معرض المشاهد'); lifeTone('gold');
  const open = GALLERY.filter(g => g[2]()).length;
  if (GALLERY.filter(g => /^v\d+$/.test(g[0])).every(g => g[2]())) award('gallery');
  html(b, hx({ ic: 'film', t: 'معرض المشاهد' }, `
    <p class="muted" style="text-align:center">مشاهد حقيقية لا رسوم. كل آية تحفظها تفتح مشهدها هنا. فتحت ${ARN(open)} من ${ARN(GALLERY.length)}.</p>
    <div class="gal">${GALLERY.map(([k, t, ok, how]) => { const on = ok(); return `<button class="gtile ${on ? '' : 'lock'}" data-gk="${k}" ${on ? '' : 'aria-disabled="true"'}><img src="${posterUrl(k)}" alt="" loading="lazy"><span class="gt">${t}</span>${on ? '' : `<span class="gl">${ic('lock')}<small>${how}</small></span>`}</button>`; }).join('')}</div>`));
  b.onclick = e => { const t = e.target.closest('[data-gk]'); if (!t) return; if (t.classList.contains('lock')) { Sfx.bad(); t.animate([{ transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'none' }], { duration: 240 }); return; } showScene(t.dataset.gk); };
}
function showScene(k) {
  const m = MEDIA.scenes[k], n = /^v(\d+)$/.test(k) ? +k.slice(1) : 0;
  const el = node(`<div class="doc sceneview" role="dialog" aria-label="مشهد">
    <div class="dmedia"></div><div class="dshade"></div>
    <div class="dtop"><span class="dtitle">${ic('film')} ${n ? `الآية ${ARN(n)}` : esc(GALLERY.find(g => g[0] === k)?.[1] || '')}</span><span class="grow"></span><button class="iconbtn" data-sx aria-label="إغلاق">${ic('x')}</button></div>
    <div class="dmid">${n ? `<div class="dverse qt night">${verseHTML(n)}</div>` : ''}<small class="scred">${esc(m.t)} · ${esc(m.a)} · ${esc(m.l)}</small></div>
    <div class="dbot"><div class="row" style="justify-content:center;gap:10px">${n ? `<button class="btn btn-sun" data-sp>${ic('play')} اسمع الآية</button>` : ''}<button class="btn btn-line" data-sx>رجوع</button></div></div></div>`);
  document.body.appendChild(el);
  const sc = RealScene($('.dmedia', el), { scene: k, reduce: reduceMotion() }); sc.start();
  el.onclick = e => {
    if (e.target.closest('[data-sp]')) { playSeq([n]); return; }
    if (e.target.closest('[data-sx]')) { stopAll(); sc.stop(); el.remove(); }
  };
}

/* ---------- Android app: daily reminder and the home-screen widget ---------- */
function widgetData() {
  const due = dueReviews(), nx = nextStation(), streak = S.streak.last && daysBetween(S.streak.last, dayKey()) <= 1 ? S.streak.n : 0;
  const fire = streak ? ` · ${cnt(streak, ['يومٌ متتالٍ', 'يومان متتاليان', 'أيام متتالية', 'يومًا متتاليًا'])}` : '';
  if (due.length) { const st = STATIONS[due[0] - 1]; return { t: 'حان موعد المراجعة', v: plainVerse(st.verses[0]), s: `راجع «${st.name}»${fire}` }; }
  if (nx && nx.id <= 4) return { t: doneCount() ? 'تابع رحلتك' : 'ابدأ رحلتك', v: plainVerse(nx.verses[0]), s: `المحطة ${ARN(nx.id)}: ${nx.name}${fire}` };
  const n = 1 + dayIdx() % NV; return { t: 'آية اليوم', v: plainVerse(n), s: `الضحى: ${ARN(n)}${fire}` };
}
let widgetTimer = 0;
function syncWidget() {
  if (!IS_APP) return;
  clearTimeout(widgetTimer);
  widgetTimer = setTimeout(() => { try { window.DuhaApp.syncWidget(JSON.stringify(widgetData())); } catch (e) { } }, 600);
}
const REMIND = [['off', 'بلا تذكير'], ['duha', 'وقت الضحى في مدينتي'], ['08:30', 'صباحًا ٨:٣٠'], ['21:00', 'قبل النوم ٩:٠٠ م']];
const REMIND_MSG = ['دقيقتان مع الضحى تكفيان اليوم', '﴿مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ﴾ هل نراجعها معًا؟', 'آيةٌ واحدة اليوم خيرٌ من لا شيء', 'كل آية درجة… اصعد درجةً اليوم', 'شمسك تنتظر أن تشرق أكثر'];
function reminderPlan(mode, days = 30) {
  const out = [], now = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, 12);
    let t;
    if (mode === 'duha') { const tt = dayTimes(d); if (!tt.duha) continue; t = new Date(tt.duha[0].getTime() + 10 * 60e3); }
    else { const [h, m] = mode.split(':').map(Number); t = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m); }
    if (t <= now) continue;
    const k = dayKey(t), due = [1, 2, 3, 4, 5].filter(id => S.st[id] && S.st[id].done && S.st[id].next && S.st[id].next <= k);
    const title = mode === 'duha' ? 'حان وقت الضحى' : mode >= '18' ? 'قبل النوم' : 'صباح النور';
    const body = due.length ? `عندك مراجعة اليوم: «${STATIONS[due[0] - 1].name}». ثلاث دقائق وتثبت` : REMIND_MSG[(dayIdx() + i) % REMIND_MSG.length];
    out.push({ t: t.getTime(), title, body });
  }
  return out;
}
function syncReminders() {
  if (!(window.DuhaApp && window.DuhaApp.setReminders)) return;
  const mode = S.settings.remind || 'off';
  try { window.DuhaApp.setReminders(JSON.stringify(mode === 'off' ? [] : reminderPlan(mode))); } catch (e) { }
}
function reminderField() {
  if (!(window.DuhaApp && window.DuhaApp.setReminders)) return '';
  const cur = S.settings.remind || 'off';
  return `<div class="field" style="margin-top:8px">${ic('timer')} تذكير يومي لطيف<div class="chips" id="sRem">${REMIND.map(([v, t]) => `<button class="chip" data-rm="${v}" aria-pressed="${cur === v}">${t}</button>`).join('')}</div></div>`;
}
/* a challenge link opened while the app is already open */
window.addEventListener('hashchange', () => { const m = (location.hash || '').match(/^#c=([\w-]+)/); if (m) openChal(m[1]); });
