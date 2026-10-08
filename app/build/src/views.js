/* ===== Views: journey, cinema, mushaf, arcade, ideas, sheets ===== */
const EST = ['maher', 'yasser', 'qatami', 'ghamdi', 'ajmi', 'fares'];
const TABS = ['home', 'watch', 'read', 'heart', 'play', 'ideas'];
let tab = 'home';
const dayIdx = () => Math.floor(keyDate(dayKey()) / 864e5);
const stLabel = st => st.id === 5 ? 'السورة كاملة' : `الآيات ${ARN(st.verses[0])}–${ARN(st.verses[st.verses.length - 1])}`;

/* ---------- header ---------- */
function updateHeader() {
  document.body.classList.toggle('no-m2', !S.settings.m2);
  const fl = $('#hStreak'); if (!fl) return;
  const live = S.streak.last === dayKey() || (S.streak.last && daysBetween(S.streak.last, dayKey()) === 1);
  fl.classList.toggle('cold', !live);
  $('#hStreakN').textContent = ARN(live ? S.streak.n : 0);
  const li = levelOf(S.xp), cur = LEVELS[li].xp, nxt = LEVELS[li + 1] ? LEVELS[li + 1].xp : cur + 1;
  const f = LEVELS[li + 1] ? (S.xp - cur) / (nxt - cur) : 1;
  $('#hLvlArc').setAttribute('stroke-dasharray', `${(f * 100).toFixed(1)} 100`);
  $('#hLvlN').textContent = ARN(li + 1);
  $('#hLevel').setAttribute('aria-label', `المستوى ${li + 1}: ${LEVELS[li].name}، ${S.xp} نقطة`);
  const p = skyProgress();
  const top = ['#070a1a', '#0b1030', '#141a45', '#1b2558', '#202d66', '#26357a'][Math.round(p * 5)];
  document.documentElement.style.setProperty('--bg-top', top);
  document.documentElement.style.setProperty('--bg-glow', `rgba(255,${126 + p * 80},${95 + p * 40},${.16 + p * .14})`);
}

/* ---------- navigation ---------- */
function showTab(t, opts = {}) {
  if (!TABS.includes(t)) t = 'home';
  if (t !== tab && Player.state !== 'idle' && !opts.keepAudio) stopAll();
  if (t !== tab) Narr.stop();
  tab = t;
  TABS.forEach(k => { $('#v-' + k).hidden = k !== t; });
  $$('.nav button').forEach(b => { if (b.dataset.tab === (t === 'ideas' ? 'play' : t)) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  if (t === 'home') renderHome(); else Hero.stop();
  if (t === 'watch') Cine.mount(); else Cine.unmount();
  if (t === 'read') renderRead();
  if (t === 'play') renderPlay();
  if (t === 'heart') renderHeart();
  if (t === 'ideas') renderIdeas();
  if (!opts.noScroll) window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  try { history.replaceState(null, '', t === 'home' ? location.pathname + location.search : '#' + t); } catch (e) { }
}
function go(action) {
  if (!action) return;
  if (TABS.includes(action)) return showTab(action);
  if (action === 'meanings' || action === 'tajweed' || action === 'mushaf') { Read.sub = action; return showTab('read'); }
  if (action === 'tutor') { Read.sub = 'meanings'; showTab('read'); setTimeout(() => { const t = $('#tutorQ'); if (t) { t.scrollIntoView({ block: 'center' }); t.focus(); } }, 120); return; }
  if (action === 'echo') { S.settings.echo = true; save(); return showTab('watch'); }
  if (action === 'reciters') return openReciters();
  if (action === 'tja') return openTajweed();
  if (action === 'coach') return openCoach();
  if (V50_ROUTES[action]) return V50_ROUTES[action]();
  if (action === 'badges') return openAchievements();
  if (action === 'settings') return openSettings();
  if (action === 'share') return openShare();
  if (action === 'story') return runStory();
  if (action === 'doc') return Doc.open(0);
  if (action === 'credits') return openCredits();
  if (action === 'world') return openWorld();
  if (action === 'calm') return Calm.open();
  if (action === 'grat') return openGrat();
  if (action === 'acts') return openActs();
  if (action === 'seal') return openSeal();
  if (action === 'orphan') return openOrphan();
  if (action === 'oasis') return openOasis();
  if (action === 'listen' || action === 'live') return openLive();
  if (action === 'mirror') return openMirror();
  if (action === 'imm') return openImmersive();
  if (action === 'treasure') return openTreasure();
  if (action === 'studio') return openStudio();
  if (action === 'pp') return openProPlayer();
  if (action === 'square') return openSquare();
  if (action === 'library') return openLibrary();
  if (action === 'kawn') return libHas('kawn') || libOK() ? openKawn() : openLibrary();
  if (action === 'nature') return openNature();
  if (action === 'oasis3d') return openWorld3D('lantern');
  if (action === 'kawkaba') return openKawkaba();
  if (action === 'scenes') return openScenes();
  if (action === 'rhythm') return openRhythm();
  if (action === 'rec') return openRec();
  if (action === 'course') return Course.open();
  if (action === 'chal') return openChal();
  if (action === 'duo') return openDuo();
  if (action === 'card') return openCard('card');
  if (action === 'wall') return openCard('wall');
  if (action === 'cert') return openCert();
  if (action === 'gallery') return openGallery();
  if (action === 'gold') return openGoldMushaf();
  if (action === 'sky') return openSky();
  if (action === 'palace') return openPalace();
  if (action === 'plan') { showTab('home'); setTimeout(() => $('#planCard')?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 80); return; }
  if (/^st\d$/.test(action)) return startStation(+action.slice(2));
  if (/^rv\d$/.test(action)) return startReview(+action.slice(2));
  if (action.startsWith('g-')) return startGame(action.slice(2));
}

/* ---------- home: the sky of progress ---------- */
const ARC = u => ({ x: .85 - .66 * u, y: .55 - .39 * Math.sin(u * Math.PI / 2) });
World.SCENES[99] = p => {
  const k = Math.round(p * 5), u = k === 0 ? 0 : (k - 1) / 4, a = ARC(u);
  const sunY = k === 0 ? -.06 : (.66 - a.y) / (.66 * .95);
  return { tod: [.12, .33, .45, .58, .7, .82][k], sunX: a.x, sunY, stars: clamp(1 - k * .4), moon: k ? 0 : .6, palms: .4 + .12 * k, green: k >= 3 ? .25 * (k - 2) : 0, fruit: k >= 4 ? .8 : 0, bloom: k >= 5 ? .8 : 0, hglow: k === 0 ? .4 : .15 };
};
const Hero = {
  w: null,
  mount(host) { this.stop(); this.w = RealScene(host, { scene: hasScene(skyScene()) ? skyScene() : 'v0', reduce: reduceMotion() }); this.w.start(); },
  stop() { if (this.w) this.w.stop(); },
};
function nextStation() { return STATIONS.find(s => !stDone(s.id)); }
function renderHome() {
  const v = $('#v-home');
  const due = dueReviews(), nx = nextStation(), p = skyProgress(), li = levelOf(S.xp);
  const goal = S.settings.goal, tx = todayXP(), gf = clamp(tx / goal);
  const stars = Object.values(S.st).reduce((a, s) => a + (s.stars || 0), 0);
  const greet = (() => { const h = new Date().getHours(); return h < 5 ? 'ليلة هادئة' : h < 12 ? 'صباح النور' : h < 17 ? 'نهارك نور' : 'مساء النور'; })();
  let cta;
  if (due.length) { const st = STATIONS[due[0] - 1]; cta = `<span class="eyebrow">حان موعد المراجعة</span><h3>راجع «${st.name}» لتثبّت حفظك</h3><p class="dim">المراجعة في وقتها تحفظ الآيات أطول بكثير. ${due.length > 1 ? `لديك ${ARN(due.length)} مراجعات اليوم.` : ''}</p><button class="btn btn-sun btn-wide" data-go="rv${st.id}">${ic('repeat')} ابدأ المراجعة</button>`; }
  else if (nx) cta = `<span class="eyebrow">المحطة ${ARN(nx.id)} من ٥</span><h3>${nx.id === 5 ? 'التحدي الأخير: الضحى كاملة' : `${nx.name}: ${nx.hint}`}</h3><p class="dim">${stLabel(nx)} · نحو ٦ دقائق · اسمع، ردّد، افهم، العب، سمّع</p><button class="btn btn-sun btn-wide" data-go="st${nx.id}">${ic('play')} ${doneCount() ? 'تابع الرحلة' : 'ابدأ الرحلة'}</button>`;
  else cta = `<span class="eyebrow">أشرقت شمسك كاملة</span><h3>حفظت سورة الضحى! ثبّتها باللعب والمراجعة</h3><p class="dim">ستظهر المراجعات هنا في مواعيدها تلقائيًا.</p><div class="row wrap"><button class="btn btn-sun" data-go="cert">${ic('crown')} شهادتك</button><button class="btn btn-line" data-go="play">${ic('pad')} العب الآن</button></div>`;
  const planDone = [stDone(1), stDone(2), stDone(3), stDone(4) && !!S.badges.memory, S.best.orderTime != null, stDone(5), !!S.badges.share];
  const gem = GEMS[dayIdx() % GEMS.length];
  const idea = IDEAS[dayIdx() % IDEAS.length];
  html(v, `
  <div class="hero" id="hero">
    <div class="hmedia" aria-hidden="true"></div><div class="hdim" style="opacity:${(.62 * (1 - p)).toFixed(2)}"></div>
    <div class="hcopy"><b>${p >= 1 ? 'شمسك في كبد الضحى' : p > 0 ? `أشرقت شمسك ${ARN(Math.round(p * 100))}٪` : 'شمسك لم تشرق بعد'}</b><span class="dim">${greet} · مستواك: ${LEVELS[li].name}</span></div>
    ${STATIONS.map((s, i) => { const a = ARC(i / 4), d = stDone(s.id), st = S.st[s.id]; return `<button class="node ${d ? 'done' : ''} ${nx && nx.id === s.id ? 'next' : ''}" style="left:${(a.x * 100).toFixed(1)}%;top:${(a.y * 100).toFixed(1)}%" data-go="st${s.id}" aria-label="المحطة ${s.id}: ${s.name}${d ? '، مكتملة' : ''}"><span class="lbl">${s.name}</span>${s.id === 5 ? ic('crown') : ARN(s.id)}${d ? `<span class="stars">${'★'.repeat(st.stars || 1)}</span>` : ''}</button>`; }).join('')}
  </div>
  ${whatsNewCard()}
  <div class="card cta">${cta}</div>
  ${coachCard()}
  ${wordleCard()}
  ${goldRow()}
  ${lifeRow()}
  ${bedtimeCard()}
  ${duhaCard()}
  ${fridayCard()}
  ${deedCard()}
  <button class="card doccard" data-go="doc"><img src="scenes/v1.jpg" alt="" loading="lazy"><span class="dcc"><span class="eyebrow">مشاهد حقيقية · تلاوة · شرح بصوت الراوي</span><b>وثائقي الضحى</b><span class="dim">عِش السورة آية آية في نحو ١٠ دقائق</span></span><span class="playc">${ic('play')}</span></button>
  <div class="stats">
    <div class="stat"><svg class="ring" viewBox="0 0 36 36"><circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="3.2"/><circle cx="18" cy="18" r="15.9" fill="none" stroke="#f7b844" stroke-width="3.2" stroke-linecap="round" pathLength="100" stroke-dasharray="${(gf * 100).toFixed(1)} 100" transform="rotate(-90 18 18)"/></svg><span>هدف اليوم ${ARN(Math.min(tx, goal))}/${ARN(goal)}</span></div>
    <div class="stat"><b style="color:#ffb36b">${ARN(S.streak.last && daysBetween(S.streak.last, dayKey()) <= 1 ? S.streak.n : 0)}</b><span>أيام متتالية</span></div>
    <div class="stat"><b style="color:var(--sun-2)">${ARN(stars)}</b><span>نجمة · ${ARN(S.xp)} نقطة</span></div>
  </div>
  ${(() => { const g = dailyGame(), done = S.daily === dayKey(); return `<div class="card" style="display:grid;gap:8px;border-color:rgba(247,184,68,.35)"><div class="row"><span class="gi" style="width:42px;height:42px;border-radius:13px;display:grid;place-items:center;background:rgba(247,184,68,.13);color:var(--sun-2)">${ic(g.ic)}</span><div class="grow"><span class="eyebrow">تحدي اليوم ${done ? '· مكتمل' : '· +٥٠ نقطة إضافية'}</span><h3>${g.name}</h3></div><button class="btn ${done ? 'btn-line' : 'btn-sun'}" data-go="g-${g.id}">${done ? 'العب مجددًا' : 'العب'}</button></div><p class="dim">${g.d}. يتغيّر التحدي كل يوم.</p></div>`; })()}
  ${meccaCard()}
  <div class="card plan" id="planCard">
    <div class="row"><div class="grow"><span class="eyebrow">اقتراح</span><h3>خطة ٧ أيام لحفظ الضحى</h3></div><span class="dim">${ARN(planDone.filter(Boolean).length)}/٧</span></div>
    <ol>${PLAN.map((d, i) => `<li><span class="dn ${planDone[i] ? 'ok' : ''}">${planDone[i] ? ic('check') : ARN(d.d)}</span><span class="grow">${d.t}</span><button class="chip" data-go="${d.go}">${planDone[i] ? 'أعد' : 'ابدأ'}</button></li>`).join('')}</ol>
  </div>
  <div class="card gem"><span class="eyebrow">لطيفة اليوم</span><p style="margin-top:6px" id="gemText">${qfmt(gem)}</p><div class="row" style="margin-top:10px"><button class="chip" id="gemNext">${ic('sparkle')} لطيفة أخرى</button></div></div>
  <div class="card"><span class="eyebrow">فكرة اليوم من المئة</span><h3 style="margin-top:4px">${idea[1]}</h3><p class="muted" style="margin-top:4px">${idea[2]}</p><div class="row" style="margin-top:10px">${idea[3] ? `<button class="btn btn-line" data-go="${idea[3]}">جرّبها</button>` : ''}<button class="chip" data-go="ideas">كل الأفكار المئة</button></div></div>
  `);
  Hero.mount($('#hero .hmedia'));
  bindCoachCard(); bindDuhaCard(); bindDeedCard(); const mc = $('#moonC'); if (mc) drawMoon(mc, moonPhase());
  $('#meccaCard').onclick = openMecca;
  let gi = dayIdx() % GEMS.length;
  $('#gemNext').onclick = () => { gi = (gi + 1) % GEMS.length; $('#gemText').innerHTML = qfmt(GEMS[gi]); Sfx.tap(); };
}

/* ---------- watch: the cinema ---------- */
const Cine = {
  w: null, mounted: false, n: 1, playing: false, from: 1, to: 11,
  mount() {
    const v = $('#v-watch');
    if (!this.built) this.build(v);
    this.w.setReduce(reduceMotion());
    this.w.resize(); this.w.start(); this.mounted = true;
    this.setVerse(this.n, true);
    this.syncControls();
  },
  unmount() { if (this.w) this.w.stop(); if (this.session) this.halt(); this.mounted = false; this.exitImm(); keepAwake(false); },
  build(v) {
    this.built = true;
    html(v, `
    <div class="cine" id="cine">
      <div class="cmedia" aria-hidden="true"></div>
      <div class="ctop"><span class="badge" id="cBadge"></span><span class="grow"></span><button class="iconbtn" id="cImm" aria-label="ملء الشاشة" style="background:rgba(5,8,24,.45)">${ic('expand')}</button></div>
      <div class="echo" id="cEcho" hidden><div class="ebox"><svg width="64" height="64" viewBox="0 0 36 36"><circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,.15)" stroke-width="3"/><circle id="cEchoArc" cx="18" cy="18" r="15.9" fill="none" stroke="#f7b844" stroke-width="3" stroke-linecap="round" pathLength="100" stroke-dasharray="100 100" transform="rotate(-90 18 18)"/></svg><b>دورك</b><span class="muted">ردّد الآية بصوتك</span></div></div>
      <button class="bigplay" id="cBig" aria-label="تشغيل">${ic('play')}</button>
      <div class="caps" id="cCaps" aria-live="polite"></div>
      <div class="cbot"><div class="qt night cq" id="cText"></div><div class="cm" id="cMean"></div></div>
    </div>
    <div class="prog" id="cProg">${verseRange(1, NV).map(n => `<i data-n="${n}"><b></b></i>`).join('')}</div>
    <div class="ctrl">
      <button class="sm" id="cPrev" aria-label="الآية السابقة">${ic('next')}</button>
      <button class="main" id="cPlay" aria-label="تشغيل">${ic('play')}</button>
      <button class="sm" id="cNext" aria-label="الآية التالية">${ic('prev')}</button>
    </div>
    <div class="cextra" id="cExtra"></div>
    <div class="strip" id="cStrip">${verseRange(1, NV).map(n => `<button data-n="${n}" aria-label="الآية ${n}">${sy(VERSES[n].sym)}<span>${ARN(n)}</span></button>`).join('')}</div>
    <div id="cDeep"></div>
    <div class="card" style="display:grid;gap:14px">
      <button class="rit on" id="cRec" style="grid-template-columns:auto 1fr auto"><span class="av">${ic('headphones')}</span><span><b id="cRecName"></b><small id="cRecNote"></small></span><span class="chip">تغيير</span></button>
      <div class="field">تكرار كل آية<div class="chips" id="cRep">${[1, 3, 5, 7, 10, 20].map(r => `<button class="chip" data-r="${r}">${ARN(r)}×</button>`).join('')}</div></div>
      <div class="field">المقطع<div class="chips" id="cRange"><button class="chip" data-a="1" data-b="11">السورة كاملة</button>${STATIONS.slice(0, 4).map(s => `<button class="chip" data-a="${s.verses[0]}" data-b="${s.verses[s.verses.length - 1]}">${ARN(s.verses[0])}–${ARN(s.verses[s.verses.length - 1])}</button>`).join('')}<button class="chip" data-a="one" data-b="one">الآية الحالية فقط</button></div></div>
      <div class="field">السرعة<div class="chips" id="cRate">${[.75, .9, 1, 1.15, 1.3].map(r => `<button class="chip" data-r="${r}">${ARN(String(r).replace('.', '٫'))}×</button>`).join('')}</div></div>
      <div class="field">النص على الشاشة<div class="seg" id="cMode" role="tablist"><button data-m="full" role="tab">كامل</button><button data-m="letters" role="tab">أوائل الحروف</button><button data-m="hidden" role="tab">يظهر بعد سماعه</button><button data-m="off" role="tab">بلا نص</button></div></div>
      <label class="toggle"><span>${ic('echo')} وضع الترديد: يقرأ الشيخ ثم تعيد أنت</span><input type="checkbox" id="cEchoT"></label>
      <label class="toggle"><span>تشغيل متواصل للمقطع</span><input type="checkbox" id="cLoop"></label>
      <label class="toggle"><span>ابدأ بالبسملة</span><input type="checkbox" id="cBism"></label>
      <label class="toggle"><span>المعنى تحت الآية</span><input type="checkbox" id="cMeanT"></label>
      <label class="toggle"><span>ألوان التجويد</span><input type="checkbox" id="cTj"></label>
      <label class="toggle"><span>${ic('voice')} الراوي يشرح بعد كل آية</span><input type="checkbox" id="cNarrAuto"></label>
      <label class="toggle"><span>${ic('cc')} نص الشرح على الشاشة</span><input type="checkbox" id="cCapsT"></label>
      <div class="field">سرعة الراوي<div class="chips" id="cNRate">${[.9, 1, 1.15].map(r => `<button class="chip" data-r="${r}">${ARN(String(r).replace('.', '٫'))}×</button>`).join('')}</div></div>
      <p class="dim">المشاهد حقيقية من مكتبات مفتوحة الترخيص، بلا وجوه. الراوي يشرح ولا يقرأ القرآن؛ الآيات دائمًا بصوت القارئ. <button class="linkish" data-go="credits">المصادر والحقوق</button></p>
    </div>`);
    this.w = RealScene($('#cine .cmedia'), { scene: 1, reduce: reduceMotion() });
    Narr.subs.add((ev, d) => {
      if (ev === 'cap') { const c = $('#cCaps'); if (c) { c.textContent = S.settings.caps ? d.text : ''; c.classList.toggle('on', !!(S.settings.caps && d.text)); } }
      if ((ev === 'pause' || ev === 'resume' || ev === 'end') && this.mounted) this.syncControls();
    });
    const play = () => this.toggle();
    $('#cBig').onclick = play; $('#cPlay').onclick = play;
    $('#cPrev').onclick = () => this.step(-1); $('#cNext').onclick = () => this.step(1);
    $('#cStrip').onclick = e => { const b = e.target.closest('button'); if (!b) return; this.jump(+b.dataset.n); };
    $('#cProg').onclick = e => { const b = e.target.closest('i'); if (b) this.jump(+b.dataset.n); };
    $('#cRec').onclick = () => openReciters();
    $('#cRep').onclick = e => { const b = e.target.closest('button'); if (!b) return; S.settings.rep = +b.dataset.r; save(); this.syncControls(); this.restartIfPlaying(); };
    $('#cRate').onclick = e => { const b = e.target.closest('button'); if (!b) return; S.settings.rate = +b.dataset.r; Player.rate = S.settings.rate; A.playbackRate = Player.rate; save(); this.syncControls(); };
    $('#cRange').onclick = e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.a === 'one') { this.from = this.to = this.n; } else { this.from = +b.dataset.a; this.to = +b.dataset.b; this.setVerse(this.from); } this.syncControls(); this.restartIfPlaying(); };
    $('#cMode').onclick = e => { const b = e.target.closest('button'); if (!b) return; S.settings.textMode = b.dataset.m; save(); this.syncControls(); this.renderText(); };
    $('#cEchoT').onchange = e => { S.settings.echo = e.target.checked; save(); this.restartIfPlaying(); };
    $('#cLoop').onchange = e => { this.loop = e.target.checked; this.restartIfPlaying(); };
    $('#cBism').onchange = e => { S.settings.bism = e.target.checked; save(); };
    $('#cMeanT').onchange = e => { S.settings.meaning = e.target.checked; save(); this.renderText(); };
    $('#cTj').onchange = e => { S.settings.tj = e.target.checked; save(); this.renderText(); };
    $('#cNarrAuto').onchange = e => { S.settings.narr = e.target.checked ? 'auto' : 'tap'; save(); this.restartIfPlaying(); };
    $('#cCapsT').onchange = e => { S.settings.caps = e.target.checked; save(); if (!e.target.checked) { $('#cCaps').textContent = ''; $('#cCaps').classList.remove('on'); } };
    $('#cNRate').onclick = e => { const b = e.target.closest('button'); if (!b) return; S.settings.narrRate = +b.dataset.r; Narr.a.playbackRate = S.settings.narrRate; save(); this.syncControls(); };
    $('#cImm').onclick = () => this.toggleImm();
    $('#cText').onclick = e => { const w = e.target.closest('.w'); if (w && Player.state === 'idle') playWord(+w.dataset.v, +w.dataset.w); };
    Player.subs.add((ev, d) => {
      if (!this.session) return;
      if (ev === 'verse') { this.setVerse(d.n); $('#cEcho').hidden = true; }
      if (ev === 'echo') { this.echo(d.ms); }
      if (ev === 'echoEnd') $('#cEcho').hidden = true;
      if (ev === 'pause' || ev === 'resume') this.syncControls();
      if (ev === 'blocked') toast('اضغط زر التشغيل لتبدأ التلاوة', 'play');
      if (ev === 'end' && this.autoRun) return;
      if (ev === 'end') { this.session = false; this.playing = false; $('#cEcho').hidden = true; keepAwake(false); this.syncControls(); if (d.done) { this.w.setScene(12); this.w.setProgress(1); addXP(10); } }
    });
    Ticks.add(t => {
      if (!this.session || !this.mounted) return;
      this.w.setProgress(t.p);
      if (t.w !== this.lastW || t.n !== this.lastN) {
        this.lastW = t.w; this.lastN = t.n;
        $$('#cText .w').forEach(el => { const i = +el.dataset.w; el.classList.toggle('on', i === t.w); if (S.settings.textMode === 'hidden' && i <= t.w) el.classList.remove('slot'); });
      }
      const bar = $(`#cProg i[data-n="${t.n}"] b`); if (bar) bar.style.width = (t.p * 100).toFixed(1) + '%';
    });
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.setActionHandler('play', () => this.toggle());
        navigator.mediaSession.setActionHandler('pause', () => this.toggle());
        navigator.mediaSession.setActionHandler('nexttrack', () => this.step(1));
        navigator.mediaSession.setActionHandler('previoustrack', () => this.step(-1));
      } catch (e) { }
    }
  },
  syncControls() {
    const s = S.settings;
    $$('#cRep button').forEach(b => b.setAttribute('aria-pressed', +b.dataset.r === s.rep));
    $$('#cRate button').forEach(b => b.setAttribute('aria-pressed', +b.dataset.r === s.rate));
    $$('#cRange button').forEach(b => b.setAttribute('aria-pressed', b.dataset.a === 'one' ? (this.from === this.to) : (+b.dataset.a === this.from && +b.dataset.b === this.to && this.from !== this.to)));
    $$('#cMode button').forEach(b => b.setAttribute('aria-selected', b.dataset.m === s.textMode));
    $('#cEchoT').checked = !!s.echo; $('#cLoop').checked = !!this.loop; $('#cBism').checked = !!s.bism; $('#cMeanT').checked = !!s.meaning; $('#cTj').checked = !!s.tj;
    $('#cNarrAuto').checked = s.narr === 'auto'; $('#cCapsT').checked = !!s.caps;
    $$('#cNRate button').forEach(b => b.setAttribute('aria-pressed', +b.dataset.r === (s.narrRate || 1)));
    $('#cRecName').textContent = RNAME(Player.rid);
    const r = RECITERS.find(x => x.id === Player.rid);
    $('#cRecNote').textContent = r.note + (EST.includes(r.id) ? ' · تزامن الكلمات تقريبي' : '');
    const playing = this.session && !(Player.tok && Player.tok.paused) && Narr.state !== 'paused';
    $('#cPlay').innerHTML = ic(playing ? 'pause' : 'play');
    $('#cPlay').setAttribute('aria-label', playing ? 'إيقاف مؤقت' : 'تشغيل');
    $('#cBig').hidden = !!this.session;
  },
  setVerse(n, initial) {
    this.n = n;
    this.w.setScene(n); if (!this.session) this.w.setProgress(initial ? .05 : .5);
    const vv = VERSES[n];
    $('#cBadge').innerHTML = n ? `${sy(vv.sym)}<span>الآية ${ARN(n)} · ${vv.symName}</span>` : `${sy('star8')}<span>البسملة</span>`;
    $$('#cStrip button').forEach(b => b.classList.toggle('on', +b.dataset.n === n));
    $$('#cProg i').forEach(i => { const k = +i.dataset.n; i.querySelector('b').style.width = k < n ? '100%' : '0'; });
    this.lastW = -2; this.renderText();
    if (this.dn !== n) { this.dn = n; $('#cDeep').innerHTML = n ? deepHTML(n) : ''; $('#cExtra').innerHTML = `${n ? narrBtn('v' + n) : ''}<button class="btn btn-line" data-go="doc">${ic('film')} الوثائقي</button>${verseLifeBtn(n)}`; }
  },
  renderText() {
    const n = this.n, m = S.settings.textMode, el = $('#cText');
    el.classList.toggle('notj', !S.settings.tj);
    if (m === 'off') el.innerHTML = '';
    else if (m === 'letters') el.innerHTML = firstLetterHTML(n);
    else { el.innerHTML = verseHTML(n, { marker: n > 0 }); if (m === 'hidden') $$('.w', el).forEach(w => w.classList.add('slot')); }
    $('#cMean').textContent = S.settings.meaning ? VERSES[n].mean : '';
  },
  list() {
    const vs = verseRange(this.from, this.to);
    const start = this.n >= this.from && this.n <= this.to ? this.n : this.from;
    const rest = vs.slice(vs.indexOf(start));
    return (S.settings.bism && start === 1 && this.from === 1 ? [0] : []).concat(rest);
  },
  toggle() {
    Sfx.init();
    if (this.session) {
      if (Narr.state === 'playing') Narr.pause(); else if (Narr.state === 'paused') Narr.resume();
      else if (Player.tok && Player.tok.paused) resumeP(); else pauseP();
      this.syncControls(); return;
    }
    if (Narr.state !== 'idle') Narr.stop();
    this.start();
  },
  start() {
    this.session = true; this.playing = true; keepAwake(true);
    if (S.settings.narr === 'auto') this.runAuto();
    else playSeq(this.list(), { repeat: S.settings.rep, echo: S.settings.echo, loop: !!this.loop });
    this.syncControls();
  },
  /* recitation, then the narrator explains, verse after verse */
  async runAuto() {
    const my = this.autoTok = (this.autoTok || 0) + 1; this.autoRun = true;
    const list = this.list();
    for (let k = 0; k < list.length; k++) {
      const n = list[k];
      const ok = await playSeq([n], { repeat: S.settings.rep, echo: S.settings.echo });
      if (!ok || my !== this.autoTok || !this.session) break;
      if (n > 0 && Narr.has('v' + n)) { await Narr.play('v' + n); if (my !== this.autoTok || !this.session) break; }
      if (this.loop && k === list.length - 1) k = -1;
    }
    if (my === this.autoTok) { this.autoRun = false; this.session = false; this.playing = false; $('#cEcho').hidden = true; keepAwake(false); this.syncControls(); }
  },
  halt() { this.autoTok = (this.autoTok || 0) + 1; this.autoRun = false; Narr.stop(); stopAll(); this.session = false; },
  restartIfPlaying() { if (this.session) { this.halt(); this.start(); } },
  step(d) {
    const n = clamp(this.n + d, 0, NV);
    if (this.session) { this.halt(); this.setVerse(n || 1); this.start(); }
    else { Narr.stop(); this.setVerse(n || 1); }
  },
  jump(n) {
    if (n < this.from || n > this.to) { this.from = 1; this.to = NV; this.syncControls(); }
    if (this.session) { this.halt(); this.setVerse(n); this.start(); } else { Narr.stop(); this.setVerse(n); }
  },
  echo(ms) {
    const box = $('#cEcho'), arc = $('#cEchoArc'); box.hidden = false;
    const t0 = performance.now();
    const tick = () => { if (box.hidden) return; const f = clamp((performance.now() - t0) / ms); arc.setAttribute('stroke-dasharray', `${((1 - f) * 100).toFixed(1)} 100`); if (f < 1) requestAnimationFrame(tick); };
    tick();
  },
  toggleImm() { const c = $('#cine'); if (c.classList.contains('immersive')) return this.exitImm(); c.classList.add('immersive'); $('#cImm').innerHTML = ic('x'); $('#cImm').setAttribute('aria-label', 'إغلاق ملء الشاشة'); requestAnimationFrame(() => this.w.resize()); try { c.requestFullscreen?.().catch(() => { }); } catch (e) { } },
  exitImm() { const c = $('#cine'); if (!c || !c.classList.contains('immersive')) return; c.classList.remove('immersive'); $('#cImm').innerHTML = ic('expand'); $('#cImm').setAttribute('aria-label', 'ملء الشاشة'); try { if (document.fullscreenElement) document.exitFullscreen().catch(() => { }); } catch (e) { } requestAnimationFrame(() => this.w.resize()); },
};

/* ---------- read: mushaf, meanings, tajweed ---------- */
const Read = { sub: 'mushaf', hide: 'none', focus: null };
function renderRead() {
  const v = $('#v-read');
  html(v, `<div class="goldread"><button class="card goldc" data-go="gold"><span class="gmini" aria-hidden="true">${verseRange(1, NV).map(n => `<i class="lv${gLevel(n)}"></i>`).join('')}</span><b>مصحفك المذهّب</b><span class="dim">الصفحة ٥٩٦ كما في المصحف، وكل آية تتقنها تصير ذهبًا</span></button><button class="card goldc" data-go="sky">${ic('star')}<b>سماء الكلمات</b><span class="dim">كل كلمة وأسرتها في القرآن كله</span></button></div><div class="seg" role="tablist" id="rSeg"><button role="tab" data-s="mushaf">المصحف</button><button role="tab" data-s="meanings">المعاني</button><button role="tab" data-s="tajweed">التجويد</button></div><div id="rBody" style="display:grid;gap:16px"></div>`);
  $$('#rSeg button').forEach(b => b.setAttribute('aria-selected', b.dataset.s === Read.sub));
  $('#rSeg').onclick = e => { const b = e.target.closest('button'); if (!b) return; Read.sub = b.dataset.s; stopAll(); renderRead(); };
  ({ mushaf: renderMushaf, meanings: renderMeanings, tajweed: renderTajweed })[Read.sub]();
}
const surahHead = () => `<svg class="mhead" viewBox="0 0 420 64" role="img" aria-label="سورة الضحى">
  <defs><linearGradient id="mhg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#e9d39c"/><stop offset="1" stop-color="#c79d4e"/></linearGradient></defs>
  <path d="M30 6h360l24 26-24 26H30L6 32z" fill="url(#mhg)" stroke="#8a6526" stroke-width="2"/>
  <path d="M44 13h332l17 19-17 19H44L27 32z" fill="#fbf4e2" stroke="#8a6526" stroke-width="1.2"/>
  <circle cx="17" cy="32" r="4" fill="#8a6526"/><circle cx="403" cy="32" r="4" fill="#8a6526"/>
  <text x="210" y="40" text-anchor="middle" font-size="26" font-weight="700" fill="#3b2a10">سورة الضحى</text>
  <text x="66" y="38" text-anchor="middle" font-size="12" fill="#6b5428" font-family="Readex Pro, sans-serif">آياتها ١١</text>
  <text x="354" y="38" text-anchor="middle" font-size="12" fill="#6b5428" font-family="Readex Pro, sans-serif">مكية</text></svg>`;
function renderMushaf() {
  const b = $('#rBody'), fs = S.settings.fs;
  html(b, `
  <div class="mtools">
    <button class="chip" id="mTj" aria-pressed="${S.settings.tj}">ألوان التجويد</button>
    <button class="chip" id="mM2" aria-pressed="${S.settings.m2}">المد الطبيعي</button>
    <button class="chip" id="mPlay">${ic('play')} استمع للصفحة</button>
    <span class="grow"></span>
    <span class="fsz" role="group" aria-label="حجم الخط"><button id="mMinus" aria-label="تصغير الخط" style="font-size:13px">أ−</button><button id="mPlus" aria-label="تكبير الخط" style="font-size:17px">أ+</button></span>
  </div>
  <div class="field">وضع الحفظ<div class="seg" id="mHide"><button data-h="none">ظاهر</button><button data-h="letters">أوائل الحروف</button><button data-h="blur">ضبابي</button><button data-h="slot">مخفي</button></div></div>
  <div class="mushaf paper qt ${S.settings.tj ? '' : 'notj'}" id="mPage" style="font-size:${(26 * fs).toFixed(1)}px">
    ${surahHead()}
    <div class="bism">${verseHTML(0, { marker: false })}</div>
    <div class="mtext" id="mText"></div>
    <div class="pg">٥٩٦</div>
  </div>
  <p class="dim">اضغط على أي كلمة لتسمعها بصوت ${esc(RNAME(Player.rid))} وتعرف معناها، أو على رقم الآية لتسمعها كاملة. ${Read.hide !== 'none' ? 'في وضع الحفظ: اضغط الكلمة المخفية لتلمحها.' : ''}</p>
  <div class="card"><div class="row" style="margin-bottom:10px"><h3 class="grow">دليل الألوان</h3><span class="dim">اضغط حكمًا لتراه وحده</span></div><div class="legend" id="mLegend">${TJ_ORDER.map(k => `<button class="lg" data-k="${k}" aria-pressed="${Read.focus === k}"><i style="background:var(--tj-${k})"></i><span>${TJ_RULES[k].name}</span></button>`).join('')}</div></div>`);
  $$('#mHide button').forEach(x => x.setAttribute('aria-selected', x.dataset.h === Read.hide));
  fillMushaf();
  $('#mTj').onclick = () => { S.settings.tj = !S.settings.tj; save(); renderMushaf(); };
  $('#mM2').onclick = () => { S.settings.m2 = !S.settings.m2; save(); updateHeader(); renderMushaf(); };
  $('#mMinus').onclick = () => { S.settings.fs = clamp(+(S.settings.fs - .1).toFixed(2), .7, 1.6); save(); $('#mPage').style.fontSize = (26 * S.settings.fs).toFixed(1) + 'px'; };
  $('#mPlus').onclick = () => { S.settings.fs = clamp(+(S.settings.fs + .1).toFixed(2), .7, 1.6); save(); $('#mPage').style.fontSize = (26 * S.settings.fs).toFixed(1) + 'px'; };
  $('#mHide').onclick = e => { const x = e.target.closest('button'); if (!x) return; Read.hide = x.dataset.h; renderMushaf(); };
  $('#mLegend').onclick = e => { const x = e.target.closest('button'); if (!x) return; Read.focus = Read.focus === x.dataset.k ? null : x.dataset.k; renderMushaf(); };
  $('#mPlay').onclick = () => { Sfx.init(); if (Player.state !== 'idle') { stopAll(); return; } playSeq(S.settings.bism ? [0, ...verseRange(1, NV)] : verseRange(1, NV)); };
  $('#mPage').onclick = e => {
    const am = e.target.closest('.am');
    if (am) { const n = +am.dataset.n; Sfx.init(); playSeq([n]); return; }
    const w = e.target.closest('.w'); if (!w) return;
    if (Read.hide !== 'none' && (w.classList.contains('slot') || Read.hide === 'blur' || Read.hide === 'letters') && !w.classList.contains('peek')) { w.classList.add('peek'); if (Read.hide === 'letters') w.innerHTML = wordHTML(+w.dataset.v, +w.dataset.w); return; }
    Sfx.init(); wordPop(w, +w.dataset.v, +w.dataset.w);
  };
}
function fillMushaf() {
  const t = $('#mText'), page = $('#mPage');
  page.classList.remove('focus-rule', 'blurw');
  if (Read.hide === 'letters') t.innerHTML = verseRange(1, NV).map(n => firstLetterHTML(n) + '\u00a0' + marker(n).replace('class="am"', `class="am" data-n="${n}"`)).join(' ');
  else t.innerHTML = verseRange(1, NV).map(n => verseHTML(n, { marker: false }) + '\u00a0' + marker(n).replace('class="am"', `class="am" data-n="${n}"`)).join(' ');
  if (Read.hide === 'slot') $$('.w', t).forEach(w => w.classList.add('slot'));
  if (Read.hide === 'blur') page.classList.add('blurw');
  if (Read.focus) {
    page.classList.add('focus-rule'); page.style.setProperty('--focus-color', `var(--tj-${Read.focus})`);
    $$('.t-' + Read.focus, page).forEach(s => { s.classList.add('t-focus'); s.closest('.w')?.classList.add('has-focus'); });
  }
}
function wordPop(w, n, i) {
  closePop();
  const word = QD.verses[n][i], mean = VERSES[n].words && VERSES[n].words[i];
  const rules = [...new Set((QD.tj[n + ':' + i] || []).map(r => r[2]))].filter(k => k !== 'm2' || S.settings.m2);
  const p = node(`<div class="pop" role="dialog" aria-label="الكلمة"><div class="row"><span class="qw qt night grow">${wordHTML(n, i)}</span><button class="iconbtn" data-act="play" aria-label="استمع">${ic('sound')}</button></div>
    ${mean ? `<p style="margin-top:4px">${qfmt(mean)}</p>` : `<p class="dim">${n ? 'الآية ' + ARN(n) + ' · ' + VERSES[n].symName : 'البسملة'}</p>`}
    ${rules.length ? `<div style="display:grid;gap:4px;margin-top:8px">${rules.map(k => `<div class="row" style="gap:8px;font-size:13px"><i style="width:10px;height:10px;border-radius:3px;background:var(--tj-${k})"></i><b>${TJ_RULES[k].name}</b><span class="dim">${TJ_RULES[k].d}</span></div>`).join('')}</div>` : ''}
    ${tjAt(n, i).filter(s => s.r !== 'plain' && s.f !== 'isti').length ? `<div class="tjpl" style="margin-top:8px">${tjAt(n, i).filter(s => s.r !== 'plain' && s.f !== 'isti').map(s => `<button data-tjs="${s.id}">${tjRuleChip(s.r)}<span class="dim">لماذا؟</span>${ic('chev')}</button>`).join('')}</div>` : ''}</div>`);
  document.body.appendChild(p);
  const r = w.getBoundingClientRect(), pw = p.offsetWidth, ph = p.offsetHeight;
  let x = r.left + r.width / 2 - pw / 2; x = clamp(x, 12, window.innerWidth - pw - 12);
  let y = r.top - ph - 10; if (y < 70) y = r.bottom + 10;
  p.style.left = x + 'px'; p.style.top = y + 'px';
  p.querySelector('[data-act="play"]').onclick = () => playWord(n, i);
  playWord(n, i);
  setTimeout(() => document.addEventListener('pointerdown', closePopOut, { once: true }), 0);
}
function closePopOut(e) { if (!e.target.closest('.pop')) closePop(); else document.addEventListener('pointerdown', closePopOut, { once: true }); }
function closePop() { $$('.pop').forEach(p => p.remove()); }
/* highlight in the mushaf / meanings while audio plays */
Ticks.add(t => {
  if (tab !== 'read') return;
  const host = $('#rBody'); if (!host) return;
  const key = t.n + ':' + t.w;
  if (host.dataset.hl === key) return; host.dataset.hl = key;
  $$('.w.on', host).forEach(x => x.classList.remove('on'));
  if (t.w >= 0) $$(`.w[data-v="${t.n}"][data-w="${t.w}"]`, host).forEach(x => x.classList.add('on'));
});
Player.subs.add(ev => { if (ev === 'end' && tab === 'read') { const h = $('#rBody'); if (h) { h.dataset.hl = ''; $$('.w.on', h).forEach(x => x.classList.remove('on')); } } });

function renderMeanings() {
  const b = $('#rBody');
  const counts = verseRange(1, NV).map(n => QD.verses[n].length);
  html(b, `
  <div class="card"><span class="eyebrow">سبب النزول</span><p style="margin-top:6px;line-height:1.9">${qfmt(SABAB)}</p></div>
  <div class="card struct"><h3>بنية السورة</h3>${STRUCTURE.map(s => `<div class="sb"><span class="rg">${ARN(s.r[0])}–${ARN(s.r[1])}</span><b>${s.name}</b><span class="dim">${s.d}</span></div>`).join('')}
    <p class="dim">عدد كلمات كل آية: ${counts.map(ARN).join(' - ')} · المجموع ٤٠ كلمة</p></div>
  <div class="card mirror"><h3>المرآة: ثلاث نِعَم ← ثلاث وصايا</h3><p class="dim">كما أنعم الله عليك، أحسِن أنت إلى غيرك. احفظ الآيات ٩–١١ بالنظر إلى ٦–٨.</p>
    ${MIRROR.map(([a, c, l]) => `<div class="mrow"><div class="mc"><div class="qt night">${verseHTML(a, { marker: false })}</div><span class="dim">${ARN(a)}</span></div><div class="mid">${ic('repeat')}<span>${l}</span></div><div class="mc"><div class="qt night">${verseHTML(c, { marker: false })}</div><span class="dim">${ARN(c)}</span></div></div>`).join('')}</div>
  <div style="display:grid;gap:12px" id="mCards">${verseRange(1, NV).map(n => {
    const v = VERSES[n], wm = v.words ? Object.values(v.words) : [];
    return `<div class="card vcard" data-n="${n}"><div class="vh"><span class="vn">${sy(v.sym)}</span><div class="grow"><span class="eyebrow">الآية ${ARN(n)}</span><h3>${v.symName}</h3></div><button class="iconbtn" data-play="${n}" aria-label="استمع للآية">${ic('play')}</button></div>
      <div class="qt night">${verseHTML(n)}</div><p>${v.mean}</p>${wm.length ? `<div class="wm">${wm.map(x => `<span>${qfmt(x)}</span>`).join('')}</div>` : ''}<p class="dline-s">${qfmt(DEEP[n].line)}</p><div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap"><button class="chip" data-deep="${n}">${ic('spark')} تعمّق</button>${narrBtn('v' + n, 'chip')}</div></div>`;
  }).join('')}</div>
  <div class="card"><h3>أخطاء شائعة في الحفظ</h3>${MISTAKES.map(m => `<div class="mistake"><span><s>${esc(m.bad)}</s></span><span class="ok">${esc(m.good)}</span><span class="dim">${m.d}</span></div>`).join('')}</div>
  <div class="card"><h3>لطائف السورة</h3><ol style="margin:8px 0 0;padding-inline-start:20px;display:grid;gap:8px;line-height:1.85">${GEMS.map(g => `<li>${qfmt(g)}</li>`).join('')}</ol></div>
  <div class="card tutor" id="tutorCard" hidden><span class="eyebrow">اسأل عن الآية</span><h3>سؤالٌ عن معنى أو لطيفة؟</h3><p class="dim">الجواب من محتوى التطبيق الموثّق فقط، مع مصدره. وإن لم يكن عندنا مصدر قلنا: ما عندي.</p>
    <div class="chips" id="tutorChips" style="margin:10px 0">${['لماذا قال «وما قلى» ولم يقل «وما قلاك»؟', 'ما معنى «سجى»؟', 'ما الوعد الذي تحقّق في «ولسوف يعطيك ربك فترضى»؟', 'كيف أطبّق «وأما السائل فلا تنهر» اليوم؟'].map(q => `<button class="chip">${q}</button>`).join('')}</div>
    <textarea id="tutorQ" placeholder="اكتب سؤالك هنا…" aria-label="سؤالك"></textarea>
    <div class="row" style="margin-top:10px"><button class="btn btn-sun" id="tutorGo">${ic('sparkle')} اسأل</button><button class="btn btn-line" id="tutorStop" hidden>إيقاف</button></div>
    <div class="ans" id="tutorA" style="margin-top:12px"></div></div>
  `);
  b.onclick = e => { const p = e.target.closest('[data-play]'); if (p) { Sfx.init(); playSeq([+p.dataset.play]); return; } const w = e.target.closest('.w'); if (w) { Sfx.init(); playWord(+w.dataset.v, +w.dataset.w); } };
  if (!S.seen.includes('meanings')) {
    const io = new IntersectionObserver(es => { es.forEach(x => { if (x.isIntersecting) { S.seen.push('meanings'); save(); award('meanings'); io.disconnect(); } }); });
    io.observe($('#mCards .vcard:last-child'));
  }
  Tutor.mount();
}

const Tutor = {
  sample: undefined, ctl: null,
  async mount() {
    if (this.sample === undefined) { try { this.sample = window.claude && window.claude.use ? await window.claude.use('sample') : null; } catch (e) { this.sample = null; } }
    const card = $('#tutorCard'); if (!card || !this.sample) return;
    card.hidden = false;
    $('#tutorChips').onclick = e => { const c = e.target.closest('button'); if (c) { $('#tutorQ').value = c.textContent; this.ask(); } };
    $('#tutorGo').onclick = () => this.ask();
    $('#tutorStop').onclick = () => this.ctl && this.ctl.abort();
  },
  async ask() {
    const q = $('#tutorQ').value.trim(); if (!q || !this.sample) return;
    const out = $('#tutorA'), go = $('#tutorGo'), stop = $('#tutorStop');
    this.ctl = new AbortController(); go.disabled = true; stop.hidden = false; out.textContent = 'يفكّر…';
    const clean = t => String(t || '').replace(/\s+/g, ' ').trim();
    const kb = verseRange(1, NV).map(n => `الآية ${n}: ${plainVerse(n)}\nالمعنى: ${clean(VERSES[n].mean)}\n` + DEEP[n].cards.map(c => `- ${CARD_KINDS[c.k].t}: ${clean(c.s)}${c.d ? ' — ' + clean(c.d) : ''}${c.src ? ` [المصدر: ${clean(c.src)}]` : ''}`).join('\n')).join('\n\n');
    const prompt = `أنت مساعد داخل تطبيق «رحلة الضحى» لحفظ سورة الضحى وفهمها. أجب بالعربية الفصحى المبسّطة في حدود ١٢٠ كلمة.
القاعدة الأهم: أجب فقط مما في «المحتوى الموثّق» أدناه. لا تضف حديثًا ولا قولًا ولا رقمًا ولا معلومةً ليست فيه، ولا تستنتج أحكامًا فقهية.
اختم جوابك بسطرٍ يبدأ بـ«المصدر:» وانقل فيه المصدر كما هو مكتوب بين [ ] في المحتوى.
إن لم يكن جواب السؤال في المحتوى فاكتب هذه الجملة وحدها: «ما عندي جوابٌ موثّق عن هذا في التطبيق. اسأل أهل العلم.»
لا تكتب آياتٍ من غير سورة الضحى، وإذا ذكرت كلمات من السورة فانقلها كما هي في المحتوى.

المحتوى الموثّق:
${kb}

سؤال المتعلّم: ${q}`;
    try {
      await this.sample(prompt, { signal: this.ctl.signal, onText: ({ text }) => { out.textContent = text; } });
      addXP(5);
    } catch (e) {
      if (e && e.code === 'cancelled') { out.textContent = e.text || ''; }
      else if (e && ['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'].includes(e.code)) { $('#tutorCard').hidden = true; this.sample = null; }
      else if (e && e.code === 'rate_limited') out.textContent = (e.text || '') + '\n\nأسئلة كثيرة في وقت قصير. حاول بعد قليل.';
      else out.textContent = (e && e.text ? e.text + '\n\n' : '') + 'تعذّر الحصول على إجابة الآن. حاول مرة أخرى.';
    } finally { go.disabled = false; stop.hidden = true; }
  },
};

function renderTajweed() {
  const b = $('#rBody');
  const inst = {};
  for (const key in QD.tj) for (const [, , c] of QD.tj[key]) { (inst[c] = inst[c] || []); if (!inst[c].includes(key)) inst[c].push(key); }
  inst.taf = [...new Set([...(inst.taf || []), '4:1'])].sort((a, b) => a.split(':')[0] - b.split(':')[0] || a.split(':')[1] - b.split(':')[1]);
  html(b, `
  <div class="card"><span class="eyebrow">رواية حفص عن عاصم</span><h3 style="margin-top:4px">أحكام التجويد في سورة الضحى</h3><p class="muted" style="margin-top:6px">الألوان على طريقة مصحف التجويد الملوّن. اضغط أي مثال لتسمعه بصوت ${esc(RNAME(Player.rid))}، وعُدّ الحركات بأصابعك.</p>
    <div class="row" style="margin-top:12px;gap:8px;flex-wrap:wrap"><button class="btn btn-sun" data-go="tja">${ic('bulb')} أكاديمية التجويد: لماذا هذا الحكم؟</button><button class="btn btn-line" data-go="g-hunter">${ic('target')} صيّاد التجويد</button><button class="btn btn-line" data-go="mirror">${ic('wave')} شاهد المدّ في مرآة التلاوة</button></div></div>
  ${TJ_ORDER.map(k => {
    const ex = (inst[k] || []).filter(x => !x.startsWith('0:') || k === 'mj');
    if (!ex.length) return '';
    return `<div class="card rule-card"><div class="rh"><i style="background:var(--tj-${k})"></i><h3 class="grow">${TJ_RULES[k].name}</h3><span class="dim">${ARN(ex.length)} ${ex.length > 2 ? 'مواضع' : 'موضع'}</span></div><p class="muted">${TJ_RULES[k].d}</p>${tjLinkFor(k)}
    <div class="ex night">${ex.map(x => { const [n, w] = x.split(':').map(Number); return `<button data-v="${n}" data-w="${w}">${ic('sound')}<span class="qt">${wordHTML(n, w)}</span><small class="dim" style="font-family:var(--f-ui)">${n ? ARN(n) : 'البسملة'}</small></button>`; }).join('')}</div></div>`;
  }).join('')}
  <div class="card"><h3>لاحظ</h3><ul style="margin:8px 0 0;padding-inline-start:20px;line-height:1.9;display:grid;gap:4px">
    <li>كل الراءات في السورة مفخّمة (٨ مواضع).</li>
    <li>لا قلقلة في «ودّعك» ولا «فحدّث» لأن الدال متحركة؛ القلقلة للساكن فقط.</li>
    <li>ألف «فأمّا» و«وأمّا» قبل «اليتيم» و«السائل» تسقط في النطق عند الوصل لالتقاء الساكنين.</li>
    <li>«ألم يجدك»: إظهار شفوي للميم الساكنة قبل الياء، و«تنهر»: إظهار حلقي للنون قبل الهاء.</li>
    <li>عند الوقف على رؤوس الآي تُمدّ الألف في آخرها حركتين: الضحى، سجى، قلى…</li></ul></div>`);
  b.onclick = e => { const x = e.target.closest('.ex button'); if (x) { Sfx.init(); playWord(+x.dataset.v, +x.dataset.w); } };
}

/* ---------- play: the arcade ---------- */
const GAMES = [
  { id: 'build', name: 'ركّب الآية', d: 'رتّب الكلمات المبعثرة واسمع كل كلمة', ic: 'tablet', best: () => S.best.build },
  { id: 'missing', name: 'الكلمة الناقصة', d: 'اختر الكلمة المفقودة من الآية', ic: 'sparkle', best: () => S.best.missing },
  { id: 'next', name: 'ما بعدها؟', d: 'اربط كل آية بالتي تليها', ic: 'next', best: () => S.best.next },
  { id: 'order', name: 'رتّب السورة', d: 'سباق ضد الوقت لترتيب الآيات', ic: 'timer', best: () => S.best.orderTime != null ? fmtTime(S.best.orderTime) : null },
  { id: 'hunter', name: 'صيّاد التجويد', d: 'اكتشف الأحكام في النص', ic: 'target', best: () => S.best.hunter },
  { id: 'memory', name: 'ذاكرة المرآة', d: 'اقلب البطاقات وطابق النعمة بالوصية', ic: 'cards', best: () => S.best.memoryMoves != null ? ARN(S.best.memoryMoves) + ' نقلة' : null },
  { id: 'audio', name: 'سمعتُها أين؟', d: 'اسمع كلمة وحدّد آيتها', ic: 'headphones', best: () => S.best.audio },
  { id: 'tablet', name: 'امسح اللوح', d: 'النص يتلاشى وأنت تسمّع من ذاكرتك', ic: 'book2', best: () => null },
  { id: 'letters', name: 'أوائل الحروف', d: 'تعرّف على الآية من أوائل حروفها', ic: 'text', best: () => S.best.letters },
  { id: 'symbol', name: 'الرمز والآية', d: 'كل رمز يفتح آية', ic: 'star', best: () => S.best.symbol },
  { id: 'similar', name: 'تحدي المتشابهات', d: '«والليل إذا…؟» وأخواتها', ic: 'twins', best: () => S.best.similar },
  { id: 'recall', name: 'سمّع لنفسك', d: 'الرمز وأول كلمة، والباقي عليك', ic: 'echo', best: () => S.best.recall },
];
function dailyGame() { const pool = [...GAMES, ...GAMES_GEO, ...GAMES_NEW].filter(g => g.id !== 'tablet'); return pool[dayIdx() % pool.length]; }
const gameBtn = g => { const b = g.best(); return `<button class="game${g.gold ? ' goldg' : ''}" ${g.go ? `data-go="${g.go}"` : `data-g="${g.id}"`}><span class="gi">${ic(g.ic)}</span><b>${g.name}</b><span>${g.d}</span>${b != null ? `<em>الأفضل: ${typeof b === 'number' ? ARN(b) : b}</em>` : ''}</button>`; };
function renderPlay() {
  const v = $('#v-play');
  html(v, `
  <div><span class="eyebrow">العب وتعلّم</span><h2>كل لعبة تُثبّت الآيات من زاوية جديدة</h2><p class="muted" style="margin-top:6px">الإجابات المتتالية تشعل السلسلة الذهبية وتضاعف نقاطك.</p></div>
  <div class="card tjplay"><span class="eyebrow">${ic('bulb')} جديد في ٥٫٠ · أكاديمية التجويد</span><h3 style="margin-top:4px">ألعابٌ تعلّمك لماذا هذا الحكم، لا غيره</h3>
    <div class="games" style="margin-top:10px">${TJ_GAMES.map(gameBtn).join('')}<button class="game goldg" data-go="tja"><span class="gi">${ic('book')}</span><b>الأكاديمية</b><span>ثمانية أبواب، و${ARN(TJD.spots.length)} موضعًا في السورة لكلٍّ منها «لماذا؟»</span></button></div></div>
  ${GAMES_50.length ? `<div><span class="eyebrow">${ic('sparkle')} جديد في ٥٫٠ · ألعاب</span></div><div class="games">${GAMES_50.filter(g => !g.hide).map(gameBtn).join('')}</div>` : ''}
  <div><span class="eyebrow">${ic('sparkle')} عوالم وألعاب</span></div>
  <div class="games">
    <button class="game goldg" data-go="oasis3d"><span class="gi">${ic('lantern')}</span><b>فوانيس الآيات ٣D</b><span>امشِ في واحةٍ ثلاثية الأبعاد واجمع الكلمات بالترتيب حتى يطلع الضحى</span></button>
    <button class="game goldg" data-go="kawkaba"><span class="gi">${ic('star')}</span><b>كوكبة الآية</b><span>نجومٌ على كل نجمةٍ كلمة: صِلها بالترتيب فتضيء الآية</span></button>
    <button class="game goldg" data-go="scenes"><span class="gi">${ic('film')}</span><b>مشهد كل آية</b><span>اختر لكل آية صورتها أو فيديوها من كل محتوى التطبيق</span></button>
    <button class="game goldg" data-go="rhythm"><span class="gi">${ic('headphones')}</span><b>مع القارئ</b><span>التقط كل كلمة في اللحظة التي ينطقها القارئ</span></button>
    <button class="game goldg" data-go="library"><span class="gi">${ic('download')}</span><b>مكتبة الضحى</b><span>حزم مشاهد وصور تختارها وتنزّلها: ٣٦٠°، طبيعة، الكون</span></button>
  </div>
  <div><span class="eyebrow">صوتك ومع الناس</span></div>
  <div class="games">${PEOPLE.map(x => `<button class="game" data-go="${x.id}"><span class="gi">${ic(x.ic)}</span><b>${x.t}</b><span>${x.d}</span></button>`).join('')}</div>
  <div><span class="eyebrow">ألغاز هندسية</span></div>
  <div class="games">${GAMES_GEO.map(gameBtn).join('')}</div>
  <div><span class="eyebrow">ألعاب خارج الصندوق</span></div>
  <div class="games">${GAMES_NEW.map(gameBtn).join('')}</div>
  <div><span class="eyebrow">فن</span></div>
  <div class="games">${GAMES_ART.map(gameBtn).join('')}</div>
  <div><span class="eyebrow">الألعاب الكلاسيكية</span></div>
  <div class="games">${GAMES.map(gameBtn).join('')}
    <button class="game" data-go="st5" style="border-color:rgba(247,184,68,.45)"><span class="gi">${ic('crown')}</span><b>التحدي الأخير</b><span>سمّع السورة كاملة واظفر بوسام المتقن</span></button></div>
  <div><span class="eyebrow">أدوات الذاكرة</span></div>
  <div class="games">
    <button class="game goldg" data-go="gold"><span class="gi">${ic('crown')}</span><b>مصحفك المذهّب</b><span>ذهّب آياتك والعب «أين مكانها؟»</span></button>
    <button class="game goldg" data-go="live"><span class="gi">${ic('mic')}</span><b>التسميع الحيّ</b><span>سمّع من حفظك، وكل كلمة تقولها تظهر ذهبًا</span></button>
    <button class="game goldg" data-go="mirror"><span class="gi">${ic('wave')}</span><b>مرآة التلاوة</b><span>ترى صوت القارئ وتعدّ حركات المدّ</span></button>
    <button class="game goldg" data-go="imm"><span class="gi">${ic('globe')}</span><b>الضحى الغامر ٣٦٠°</b><span>ادخل المشهد والتفت حولك، والقارئ أمامك</span></button>
    <button class="game goldg" data-go="treasure"><span class="gi">${ic('chest')}</span><b>كنز الضحى في بيتك</b><span>بطاقات مخبّأة في البيت وكنزٌ حقيقي</span></button>
    <button class="game goldg" data-go="studio"><span class="gi">${ic('film')}</span><b>استوديو الضحى</b><span>فيلم بآياتك لحالة واتساب والستوري</span></button>
    <button class="game goldg" data-go="pp"><span class="gi">${ic('headphones')}</span><b>مشغّل الحفظ</b><span>تكرار الحفّاظ والشاشة مطفأة</span></button>
    <button class="game goldg" data-go="square"><span class="gi">${ic('people')}</span><b>ساحة الأمة الحية</b><span>نقاطٌ ذهبية لمن يسمّع اليوم، وغرف مراجعة حيّة</span></button>
    <button class="game goldg" data-go="sky"><span class="gi">${ic('star')}</span><b>سماء الكلمات</b><span>كل كلمة تضيء أسرتها في القرآن</span></button>
    <button class="game goldg" data-g="palace"><span class="gi">${ic('palace')}</span><b>قصر الذاكرة</b><span>بيتٌ عربي قديم بصورٍ حقيقية: ١١ مكانًا لآياتك</span></button>
    <button class="game" data-go="gallery"><span class="gi">${ic('film')}</span><b>معرض المشاهد</b><span>كل آية تحفظها تفتح مشهدها الحقيقي</span></button>
    <button class="game" data-go="story"><span class="gi">${ic('book')}</span><b>قصة السورة</b><span>١١ رمزًا في قصة واحدة تحفظ الترتيب</span></button>
    <button class="game" data-go="ideas"><span class="gi">${ic('bulb')}</span><b>١٠٠ فكرة للحفظ</b><span>من علم الذاكرة وطرق الحفّاظ حول العالم</span></button>
  </div>`);
  v.onclick = e => { const g = e.target.closest('[data-g]'); if (g) startGame(g.dataset.g); };
}

/* ---------- ideas ---------- */
const Ideas = { q: '', cat: -1 };
function renderIdeas() {
  const v = $('#v-ideas'), tried = S.ideas.length;
  html(v, `
  <div><span class="eyebrow">مكتبة الأفكار</span><h2>١٠٠ فكرة لتحفظ الضحى بمتعة وتثبّتها للأبد</h2><p class="muted" style="margin-top:6px">جمعناها من علم الذاكرة وطرق الحفّاظ حول العالم وعلم العادات. الأفكار التي عليها «جرّبها» مبنية داخل هذه الصفحة.</p></div>
  <div class="card" style="display:grid;gap:10px"><div class="row"><b class="grow">جرّبت ${ARN(tried)} من ١٠٠</b><button class="btn btn-line" id="iRand">${ic('shuffle')} فكرة عشوائية</button></div><div class="bar"><i style="width:${tried}%"></i></div></div>
  <input class="search" id="iSearch" type="search" placeholder="ابحث في الأفكار…" aria-label="ابحث في الأفكار" value="${esc(Ideas.q)}">
  <div class="chips" id="iCats"><button class="chip" data-c="-1">الكل</button>${IDEA_CATS.map((c, i) => `<button class="chip" data-c="${i}">${c}</button>`).join('')}</div>
  <div class="card" id="iList" style="padding-block:4px"></div>`);
  const paint = () => {
    $$('#iCats button').forEach(b => b.setAttribute('aria-pressed', +b.dataset.c === Ideas.cat));
    const q = Ideas.q.trim();
    let out = '', lastCat = -2;
    IDEAS.forEach((it, i) => {
      if (Ideas.cat >= 0 && it[0] !== Ideas.cat) return;
      if (q && !(it[1] + ' ' + it[2]).includes(q)) return;
      if (it[0] !== lastCat) { out += `<div class="catt">${IDEA_CATS[it[0]]}</div>`; lastCat = it[0]; }
      const t = S.ideas.includes(i);
      out += `<div class="idea ${t ? 'tried' : ''}" id="idea-${i}"><span class="no">${ARN(i + 1)}</span><b>${it[1]}</b><p>${it[2]}</p><div class="acts">${it[3] ? `<button class="btn btn-line" data-try="${it[3]}" data-i="${i}">جرّبها</button>` : ''}<button class="chip" data-t="${i}" aria-pressed="${t}">${t ? ic('check') + ' جرّبتها' : 'علّم كمجرّبة'}</button></div></div>`;
    });
    $('#iList').innerHTML = out || '<p class="dim" style="padding:14px 0">لا توجد أفكار مطابقة.</p>';
  };
  paint();
  $('#iSearch').oninput = e => { Ideas.q = e.target.value; paint(); };
  $('#iCats').onclick = e => { const b = e.target.closest('button'); if (!b) return; Ideas.cat = +b.dataset.c; paint(); };
  $('#iRand').onclick = () => { Ideas.cat = -1; Ideas.q = ''; $('#iSearch').value = ''; paint(); const i = Math.random() * IDEAS.length | 0; const el = $('#idea-' + i); el.scrollIntoView({ block: 'center', behavior: 'smooth' }); el.animate([{ background: 'rgba(247,184,68,.25)' }, { background: 'transparent' }], { duration: 1600 }); Sfx.tap(); };
  $('#iList').onclick = e => {
    const t = e.target.closest('[data-t]');
    if (t) { const i = +t.dataset.t; if (S.ideas.includes(i)) S.ideas = S.ideas.filter(x => x !== i); else { S.ideas.push(i); addXP(3); Sfx.ok(); } save(); if (S.ideas.length >= 10) award('ideas10'); renderIdeas(); return; }
    const g = e.target.closest('[data-try]');
    if (g) { const i = +g.dataset.i; if (!S.ideas.includes(i)) { S.ideas.push(i); save(); if (S.ideas.length >= 10) award('ideas10'); } go(g.dataset.try); }
  };
}

/* ---------- sheets ---------- */
function openSheet(title, body, onMount) {
  closeSheet();
  const scr = node('<div class="scrim" id="scrim"></div>');
  const sh = node(`<div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="grab"></div><div class="sh"><h3>${title}</h3><button class="iconbtn" data-close aria-label="إغلاق">${ic('x')}</button></div><div class="sbody">${body}</div></div>`);
  document.body.append(scr, sh);
  scr.onclick = closeSheet; sh.querySelector('[data-close]').onclick = closeSheet;
  if (onMount) onMount(sh);
  return sh;
}
function closeSheet() { if (Player.sampleId) stopAll(); $('#scrim')?.remove(); $$('.sheet').forEach(s => s.remove()); }
function openReciters() {
  const sh = openSheet('اختر القارئ', `<p class="dim" style="margin-bottom:10px">اضغط ▶ لتسمع عيّنة، ثم اختر الصوت الذي تحبه. الحب يجعل التكرار متعة.</p><div class="rlist">${RECITERS.map(r => `<div class="rit ${r.id === Player.rid ? 'on' : ''}" data-id="${r.id}"><button class="iconbtn" data-sample="${r.id}" aria-label="عيّنة من ${esc(r.name)}">${ic('play')}</button><button style="text-align:start" data-pick="${r.id}"><b>${r.name}</b>${r.style !== 'مرتّل' ? `<span class="tag">${r.style}</span>` : ''}<small>${r.note}${EST.includes(r.id) ? ' · تزامن تقريبي' : ''}</small></button><button class="chip" data-pick="${r.id}" aria-pressed="${r.id === Player.rid}">${r.id === Player.rid ? 'مختار' : 'اختر'}</button></div>`).join('')}</div>`, s => {
    s.onclick = e => {
      const sm = e.target.closest('[data-sample]');
      if (sm) { Sfx.init(); if (Player.state !== 'idle' && Player.sampleId === sm.dataset.sample) { stopAll(); return; } playSeq([1, 2], { rid: sm.dataset.sample }); Player.sampleId = sm.dataset.sample; return; }
      const pk = e.target.closest('[data-pick]');
      if (pk) { setReciter(pk.dataset.pick); toast(`القارئ: ${RNAME(pk.dataset.pick)}`, 'headphones'); closeSheet(); if (tab === 'watch') Cine.syncControls(); if (tab === 'read') renderRead(); }
    };
  });
  return sh;
}
function openAchievements() {
  const li = levelOf(S.xp), L = LEVELS[li], N = LEVELS[li + 1];
  const f = N ? (S.xp - L.xp) / (N.xp - L.xp) : 1;
  const got = BADGES.filter(b => S.badges[b.id]).length;
  openSheet('إنجازاتي', `
  <div class="card" style="display:grid;gap:8px"><span class="eyebrow">المستوى ${ARN(li + 1)} من ${ARN(LEVELS.length)}</span><h3 style="font:700 26px var(--f-display);color:var(--sun-2)">${L.name}</h3><div class="bar"><i style="width:${(f * 100).toFixed(0)}%"></i></div><span class="dim">${ARN(S.xp)} نقطة${N ? ` · بقي ${ARN(N.xp - S.xp)} للوصول إلى «${N.name}»` : ' · بلغت أعلى مستوى'}</span></div>
  <div class="stats" style="margin:12px 0"><div class="stat"><b style="color:#ffb36b">${ARN(S.streak.n || 0)}</b><span>السلسلة الحالية</span></div><div class="stat"><b>${ARN(S.streak.best || 0)}</b><span>أطول سلسلة</span></div><div class="stat"><b>${ARN(got)}/${ARN(BADGES.length)}</b><span>وسام</span></div></div>
  <div class="bgrid">${BADGES.map(b => `<div class="bd ${S.badges[b.id] ? 'got' : ''}"><span class="bi">${ic(b.ic)}</span><b>${b.name}</b><span>${b.d}</span></div>`).join('')}</div>`);
}
function openSettings() {
  const s = S.settings;
  openSheet('الإعدادات', `
  <div style="display:grid;gap:6px">
    <button class="rit" id="sRec" style="grid-template-columns:auto 1fr auto"><span class="av">${ic('headphones')}</span><span><b>${esc(RNAME(Player.rid))}</b><small>القارئ</small></span><span class="chip">تغيير</span></button>
    <div class="field" style="margin-top:8px">الهدف اليومي<div class="chips" id="sGoal">${[20, 50, 100, 150].map(g => `<button class="chip" data-g="${g}" aria-pressed="${s.goal === g}">${ARN(g)} نقطة</button>`).join('')}</div></div>
    <label class="toggle"><span>مؤثرات صوتية في الألعاب</span><input type="checkbox" id="sSfx" ${s.sfx ? 'checked' : ''}></label>
    <label class="toggle"><span>أصوات طبيعة حقيقية (لا تُسمع أثناء التلاوة)</span><input type="checkbox" id="sNat" ${s.nature !== false ? 'checked' : ''}></label>
    ${reminderField()}
    ${backupField()}
    <label class="toggle"><span>اهتزاز عند الإجابة</span><input type="checkbox" id="sHap" ${s.haptic ? 'checked' : ''}></label>
    <label class="toggle"><span>ابدأ التلاوة بالبسملة</span><input type="checkbox" id="sBism" ${s.bism ? 'checked' : ''}></label>
    <label class="toggle"><span>تقليل الحركة (صور ثابتة بدل الفيديو)</span><input type="checkbox" id="sRed" ${reduceMotion() ? 'checked' : ''}></label>
    <div class="field" style="margin-top:8px">${ic('voice')} الراوي (يشرح ولا يقرأ القرآن)<div class="seg" id="sNarr"><button data-m="off" aria-selected="${s.narr === 'off'}">مخفي</button><button data-m="tap" aria-selected="${s.narr === 'tap'}">عند الطلب</button><button data-m="auto" aria-selected="${s.narr === 'auto'}">بعد كل آية</button></div></div>
    <label class="toggle"><span>نص الشرح على الشاشة</span><input type="checkbox" id="sCaps" ${s.caps ? 'checked' : ''}></label>
    <button class="rit" id="sCity" style="grid-template-columns:auto 1fr auto;margin-top:6px"><span class="av">${ic('pin')}</span><span><b>${esc(myCity().name)}</b><small>مدينتك لحساب وقت الضحى وثلث الليل</small></span><span class="chip">تغيير</span></button>
    <button class="btn btn-line btn-wide" data-go="credits" style="margin-top:6px">${ic('info')} المصادر والحقوق</button>
    <div class="sep" style="margin:8px 0"></div>
    <div id="sReset"><button class="btn btn-line btn-wide">مسح التقدّم والبدء من جديد</button></div>
    <button class="btn btn-line btn-wide" data-go="whatsnew" style="margin-top:6px">${ic('sparkle')} الجديد في الإصدار ${APP_VERSION}</button>
    <p class="credits" style="margin-top:12px">النص القرآني برواية حفص بالرسم العثماني من Quran.com · التلاوات من EveryAyah.com وQuran.com · توقيت الكلمات من Quran.com ومطابقة صوتية للقرّاء الآخرين.${Sync.ready ? ' · تقدّمك محفوظ في حسابك.' : ''}</p>
  </div>`, sh => {
    sh.querySelector('#sRec').onclick = () => openReciters();
    sh.querySelector('#sGoal').onclick = e => { const b = e.target.closest('button'); if (!b) return; S.settings.goal = +b.dataset.g; save(); $$('#sGoal button').forEach(x => x.setAttribute('aria-pressed', x === b)); if (tab === 'home') renderHome(); };
    sh.querySelector('#sSfx').onchange = e => { S.settings.sfx = e.target.checked; save(); };
    sh.querySelector('#sNat').onchange = e => { S.settings.nature = e.target.checked; save(); if (!e.target.checked) Amb.set(null); };
    const rm = sh.querySelector('#sRem'); if (rm) rm.onclick = e => { const b = e.target.closest('[data-rm]'); if (!b) return; S.settings.remind = b.dataset.rm; save(); syncReminders(); $$('#sRem .chip').forEach(x => x.setAttribute('aria-pressed', x === b)); toast(b.dataset.rm === 'off' ? 'أوقفت التذكير' : 'سيصلك تذكيرٌ لطيف كل يوم', 'timer'); };
    sh.querySelector('#sHap').onchange = e => { S.settings.haptic = e.target.checked; save(); };
    bindBackupField(sh);
    sh.querySelector('#sBism').onchange = e => { S.settings.bism = e.target.checked; save(); };
    sh.querySelector('#sRed').onchange = e => { S.settings.reduce = e.target.checked; save(); Hero.w && Hero.w.setReduce(e.target.checked); Cine.w && Cine.w.setReduce(e.target.checked); };
    sh.querySelector('#sNarr').onclick = e => { const b = e.target.closest('button'); if (!b) return; S.settings.narr = b.dataset.m; save(); if (b.dataset.m === 'off') Narr.stop(); $$('#sNarr button').forEach(x => x.setAttribute('aria-selected', x === b)); if (tab === 'watch') { Cine.dn = null; Cine.setVerse(Cine.n); Cine.syncControls(); } };
    sh.querySelector('#sCaps').onchange = e => { S.settings.caps = e.target.checked; save(); };
    sh.querySelector('#sCity').onclick = () => pickCity(() => { if (tab === 'heart') renderHeart(); });
    sh.querySelector('#sReset').onclick = e => {
      const box = sh.querySelector('#sReset');
      if (e.target.closest('[data-yes]')) { const keep = S.settings; S = fresh(); S.settings = keep; save(); closeSheet(); refreshAll(); toast('بدأت رحلة جديدة', 'sun'); return; }
      if (e.target.closest('[data-no]')) { box.innerHTML = '<button class="btn btn-line btn-wide">مسح التقدّم والبدء من جديد</button>'; return; }
      box.innerHTML = '<div class="confirm"><b>سيُحذف كل تقدّمك ونقاطك وأوسمتك. متأكد؟</b><div class="row"><button class="btn btn-bad" data-yes>نعم، امسح</button><button class="btn btn-line" data-no>تراجع</button></div></div>';
    };
  });
}
function openShare() {
  const n = doneCount(), verses = [1, 2, 3, 4].filter(stDone).reduce((a, id) => a + STATIONS[id - 1].verses.length, 0);
  const link = window.claude || /androidplatform\.net$/.test(location.hostname) || location.protocol === 'file:' ? '' : location.origin + location.pathname;
  const head = n >= 4 ? 'الحمد لله، حفظتُ سورة الضحى كاملة' : verses ? `حفظتُ ${ARN(verses)} من ١١ آية من سورة الضحى` : 'بدأتُ رحلة حفظ سورة الضحى';
  const stats = S.xp ? `\nسلسلتي: ${ARN(S.streak.n || 0)} أيام · ${ARN(S.xp)} نقطة${S.best.orderTime != null ? ` · رتّبت السورة في ${fmtTime(S.best.orderTime)}` : ''}` : '';
  const text = `${head} في «رحلة الضحى» 🌅${stats}\n﴿وَأَمَّا بِنِعْمَةِ رَبِّكَ فَحَدِّثْ﴾${link ? `\nجرّبها معي: ${link}` : ''}`;
  const wa = 'https://wa.me/?text=' + encodeURIComponent(text);
  openSheet('حدّث بنعمة ربك', `<p class="muted" style="margin-bottom:10px">أرسل الرسالة لمن تحب؛ لعلها تكون سببًا في حفظه هو أيضًا.</p><textarea id="shText" aria-label="نص الرسالة" style="width:100%;min-height:120px;border-radius:14px;border:1px solid var(--line-2);background:var(--night);color:var(--ink);padding:12px;font:inherit;line-height:1.8">${esc(text)}</textarea>
    <div class="row" style="margin-top:10px"><a class="btn btn-sun" id="shWa" href="${esc(wa)}" target="_blank" rel="noopener">${ic('share')} أرسل عبر واتساب</a><button class="btn btn-line" id="shCopy">${ic('copy')} انسخ</button>${navigator.share && !window.claude ? `<button class="btn btn-line" id="shNative">${ic('share')} مشاركة</button>` : ''}</div>`, sh => {
    const done = () => { award('share'); addXP(10); };
    const ta = sh.querySelector('#shText');
    ta.oninput = () => { sh.querySelector('#shWa').href = 'https://wa.me/?text=' + encodeURIComponent(ta.value); };
    sh.querySelector('#shWa').onclick = done;
    sh.querySelector('#shCopy').onclick = async () => {
      try { await navigator.clipboard.writeText(ta.value); toast('نُسخت الرسالة', 'check'); }
      catch (e) { ta.focus(); ta.select(); toast('حدّد النص وانسخه يدويًا', 'copy'); }
      done();
    };
    const nat = sh.querySelector('#shNative');
    if (nat) nat.onclick = () => { navigator.share({ title: 'رحلة الضحى', text: ta.value }).then(done).catch(() => { }); };
  });
}
function refreshAll() { Player.rid = S.settings.reciter; Player.rate = S.settings.rate; updateHeader(); if (tab === 'home') renderHome(); else if (tab === 'play') renderPlay(); else if (tab === 'ideas') renderIdeas(); }
