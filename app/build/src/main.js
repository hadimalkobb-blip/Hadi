/* ===== Boot: shell, global wiring ===== */
function shell() {
  document.documentElement.lang = 'ar';
  document.documentElement.dir = 'rtl';
  document.body.insertAdjacentHTML('afterbegin', iconSprite());
  const NAV = [['home', 'الرحلة', 'journey'], ['watch', 'شاهد', 'film'], ['read', 'اقرأ', 'book'], ['heart', 'ربّك', 'heart'], ['play', 'العب', 'pad']];
  const NAMES = { ideas: '١٠٠ فكرة' };
  html($('#app'), `
  <header class="top">
    <div class="brand"><svg class="i" style="color:var(--sun);width:26px;height:26px" aria-hidden="true"><use href="#i-sun"/></svg><b>رحلة الضحى</b></div>
    <button class="chipx flame" id="hStreak" aria-label="الأيام المتتالية">${ic('flame')}<span id="hStreakN">٠</span></button>
    <button class="lvl" id="hLevel"><svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="3"/><circle id="hLvlArc" cx="18" cy="18" r="15.9" fill="none" stroke="#f7b844" stroke-width="3" stroke-linecap="round" pathLength="100" stroke-dasharray="0 100"/></svg><span id="hLvlN">١</span></button>
    <button class="iconbtn" id="hSet" aria-label="الإعدادات">${ic('gear')}</button>
  </header>
  <main class="wrap">${TABS.map(t => `<section class="view" id="v-${t}" aria-label="${(NAV.find(x => x[0] === t) || [0, NAMES[t]])[1]}" ${t === 'home' ? '' : 'hidden'}></section>`).join('')}</main>
  <nav class="nav" aria-label="الأقسام">${NAV.map(([k, l, i]) => `<button data-tab="${k}">${ic(i)}<span>${l}</span></button>`).join('')}</nav>
  <div id="toasts" class="toasts" aria-live="polite"></div>`);
}
function unlockAudio() {
  if (unlockAudio.done) return; unlockAudio.done = true;
  Sfx.init();
  if (Player.state !== 'idle' || A.dataset.src) return;
  const u = aurl(Player.rid, 1); A.dataset.src = u; A.src = u; A.muted = true;
  const p = A.play();
  if (p) p.then(() => { if (Player.state === 'idle') A.pause(); A.muted = false; }).catch(() => { A.muted = false; });
  else A.muted = false;
}
function wire() {
  $('.nav').onclick = e => { const b = e.target.closest('button'); if (b) showTab(b.dataset.tab); };
  $('#hStreak').onclick = openAchievements; $('#hLevel').onclick = openAchievements; $('#hSet').onclick = openSettings;
  document.addEventListener('click', e => {
    const sl = e.target.closest('[data-sleep]'); if (sl) { startSleep(+sl.dataset.sleep); return; }
    const nb = e.target.closest('[data-narr]'); if (nb) { e.preventDefault(); Sfx.init(); toggleNarr(nb.dataset.narr); return; }
    const dp = e.target.closest('[data-deep]'); if (dp) { const n = +dp.dataset.deep; openSheet(`تعمّق في الآية ${ARN(n)}`, `<div class="qt night" style="margin-bottom:12px">${verseHTML(n)}</div>${deepHTML(n)}`); return; }
    if (e.target.closest('.dc summary')) { S.deepN = (S.deepN || 0) + 1; save(); if (S.deepN >= 11) award('deep'); }
    const g = e.target.closest('[data-go]'); if (g) { e.preventDefault(); go(g.dataset.go); }
  });
  document.addEventListener('pointerdown', unlockAudio, { capture: true, once: true });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (Doc.el) return Doc.close();
    if (Run.el) return closeRunner();
    if (Gx.top()) return Gx.close();
    if ($('.pop')) return closePop();
    if ($('.sheet')) return closeSheet();
    if ($('#cine.immersive')) return Cine.exitImm();
  });
  let rz = 0;
  window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { Hero.w && tab === 'home' && Hero.w.resize(); Cine.w && Cine.mounted && Cine.w.resize(); }, 120); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { Hero.stop(); Cine.w && Cine.w.stop(); Doc.scene && Doc.el && Doc.scene.stop(); }
    else { if (Doc.el) { if (!Doc.paused) Doc.scene.start(); } else { if (tab === 'home' && Hero.w) Hero.w.start(); if (tab === 'watch' && Cine.w) Cine.w.start(); } updateHeader(); }
  });
}
/* hardware back button (Android app): close the top layer first, then go home */
window.__back = () => {
  if ($('.pop')) { closePop(); return true; }
  if ($('.sheet')) { closeSheet(); return true; }
  if (Doc.el) { Doc.close(); return true; }
  if (Calm.el) { Calm.close(); return true; }
  const sv = $('.sceneview'); if (sv) { stopAll(); sv.remove(); return true; }
  if ($('.sheet')) { closeSheet(); return true; }
  if (Run.el) { closeRunner(); return true; }
  if (Gx.top()) { Gx.close(); return true; }
  if ($('#cine.immersive')) { Cine.exitImm(); return true; }
  if (tab !== 'home') { showTab('home'); return true; }
  return false;
};
function boot(data) {
  data = data || {};
  shell(); wire();
  Player.rid = QD.timing[S.settings.reciter] ? S.settings.reciter : 'alafasy';
  Player.rate = S.settings.rate || 1;
  updateHeader();
  const h = (location.hash || '').slice(1);
  showTab(data.tab || (TABS.includes(h) ? h : 'home'), { noScroll: true });
  initSync();
  applyNight(); setInterval(applyNight, 5 * 6e4);
  playIntro(); syncWidget(); syncReminders();
  if (START_CH) setTimeout(() => openChal(START_CH), 900);
  try { window.claude && window.claude.hot && window.claude.hot.snapshot && window.claude.hot.snapshot(() => ({ tab })); } catch (e) { }
}
const H = window.claude && window.claude.hot;
if (H && H.ready) H.ready(boot); else boot(H && H.data ? H.data : {});
