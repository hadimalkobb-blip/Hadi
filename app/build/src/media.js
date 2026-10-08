/* ===== Real scenes, the narrator, deep cards and the documentary =====
   MEDIA is injected by the build: { scenes: { v0..v11: {t,a,l,u} }, narr: { intro|v1..v11|outro: {dur, caps:[[t0,t1,text]]} } }
   The narrator explains; it never recites the Quran. Verses always play in a reciter's voice. */
/* a scene key is a built-in scene (v0…v11, desert, sun…) or a pack item «pk:<pack>:<item>»; each verse's scene can be
   replaced by the viewer's own choice (S.sceneOf), and everything that shows a verse's scene follows that choice */
const sceneOf = k => (typeof k === 'string' && S.sceneOf && S.sceneOf[k]) || k;
function pkItem(key) { const [, id, k] = String(key).split(':'), p = (typeof PACKS !== 'undefined') && PACKS.find(x => x.id === id), it = p && p.items.find(x => x.k === k); return it ? { p, it } : null; }
const isStill = k => { k = sceneOf(k); if (!String(k).startsWith('pk:')) return !!(MEDIA.scenes && MEDIA.scenes[k] && MEDIA.scenes[k].s); const r = pkItem(k); return !!r && r.p.kind !== 'video'; };
const sceneUrl = k => { k = sceneOf(k); if (String(k).startsWith('pk:')) { const r = pkItem(k); return r && r.p.kind === 'video' ? pkUrl(r.p.id, r.it.f) : ''; } return `scenes/${k}.mp4`; };
const posterUrl = k => { k = sceneOf(k); if (String(k).startsWith('pk:')) { const r = pkItem(k); return r ? (r.p.kind === 'video' ? pkThumb(r.p.id, r.it.th) : pkUrl(r.p.id, r.it.f)) : ''; } return `scenes/${k}.jpg`; };
const thumbUrl = k => { k = sceneOf(k); if (String(k).startsWith('pk:')) { const r = pkItem(k); return r ? pkThumb(r.p.id, r.it.th) : ''; } return `scenes/${k}.jpg`; };
const hasScene = k => { k = sceneOf(k); return String(k).startsWith('pk:') ? !!pkItem(k) : !!(MEDIA.scenes && MEDIA.scenes[k]); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* A crossfading pair of muted looping videos. Same surface as the old canvas World, so callers did not change. */
function RealScene(host, o = {}) {
  host.classList.add('rs');
  const mk = () => {
    const v = document.createElement('video');
    v.muted = true; v.defaultMuted = true; v.playsInline = true; v.loop = true; v.preload = 'auto';
    v.setAttribute('playsinline', ''); v.setAttribute('webkit-playsinline', ''); v.setAttribute('muted', '');
    v.setAttribute('aria-hidden', 'true'); v.disablePictureInPicture = true;
    host.appendChild(v); return v;
  };
  const L = [mk(), mk()];
  let cur = 0, key = null, running = false, reduce = !!o.reduce, seq = 0;
  const self = {
    get key() { return key; },
    setScene(n) {
      const k = typeof n === 'string' ? n : 'v' + n;
      if (!hasScene(k) || k === key) return;
      key = k;
      const my = ++seq, nxt = L[1 - cur];
      nxt.classList.remove('on'); nxt.dataset.k = k;
      if (isStill(k)) { nxt.removeAttribute('src'); nxt.poster = posterUrl(k); try { nxt.load(); } catch (e) { } const old = L[cur]; nxt.classList.add('on'); old.classList.remove('on'); cur = 1 - cur; setTimeout(() => { if (L[cur] !== old) old.pause(); }, 900); return; }
      nxt.poster = posterUrl(k); nxt.src = sceneUrl(k);
      let shown = false;
      const reveal = () => {
        if (shown || my !== seq) return; shown = true;
        const old = L[cur]; nxt.classList.add('on'); old.classList.remove('on'); cur = 1 - cur;
        if (running && !reduce) nxt.play().catch(() => { });
        setTimeout(() => { if (L[cur] !== old) old.pause(); }, 900);
      };
      if (running && !reduce) nxt.play().then(reveal, reveal);
      else { nxt.addEventListener('loadeddata', reveal, { once: true }); try { nxt.load(); } catch (e) { } }
      setTimeout(reveal, 1500);
    },
    start() { running = true; if (!reduce) (L.find(v => v.dataset.k === key) || L[cur]).play().catch(() => { }); },
    stop() { running = false; L.forEach(v => v.pause()); },
    setReduce(r) { reduce = !!r; if (reduce) L.forEach(v => v.pause()); else if (running) (L.find(v => v.dataset.k === key) || L[cur]).play().catch(() => { }); },
    still(n) { this.setScene(n); },
    setProgress() { }, resize() { },
  };
  if (o.scene != null) self.setScene(o.scene);
  return self;
}

/* ---------- the narrator ---------- */
const Narr = {
  a: new Audio(), k: null, state: 'idle', subs: new Set(), res: null, lastCap: '',
  has(k) { return !!(MEDIA.narr && MEDIA.narr[k]) && S.settings.narr !== 'off'; },
  play(k) {
    this.stop();
    if (!(MEDIA.narr && MEDIA.narr[k])) return Promise.resolve(false);
    if (Player.state !== 'idle') stopAll();
    this.k = k; this.state = 'playing'; this.lastCap = '';
    const a = this.a; a.src = `narr/${k}.mp3`; a.playbackRate = S.settings.narrRate || 1;
    try { a.preservesPitch = true; } catch (e) { }
    const p = new Promise(res => { this.res = res; });
    a.onended = () => this.end(true);
    a.onerror = () => this.end(false);
    a.play().catch(err => { if (err && err.name === 'NotAllowedError') toast('اضغط مرة أخرى لسماع الشرح', 'voice'); this.end(false); });
    this.emit('start', { k }); keepAwake(true); this.capLoop();
    return p;
  },
  end(ok) {
    if (this.state === 'idle') return;
    this.state = 'idle'; const r = this.res; this.res = null;
    this.emit('cap', { text: '' }); this.emit('end', { k: this.k, ok }); r && r(ok);
  },
  stop() { if (this.state === 'idle') return; this.a.pause(); this.end(false); },
  pause() { if (this.state !== 'playing') return; this.a.pause(); this.state = 'paused'; this.emit('pause'); },
  resume() { if (this.state !== 'paused') return; this.state = 'playing'; this.a.play().catch(() => { }); this.emit('resume'); this.capLoop(); },
  caption() {
    const m = MEDIA.narr[this.k]; if (!m) return '';
    const t = this.a.currentTime, c = m.caps.find(c => t >= c[0] - .05 && t < c[1] + .45);
    return c ? c[2] : '';
  },
  capLoop() {
    const tick = () => {
      if (this.state !== 'playing') return;
      const c = this.caption(); if (c !== this.lastCap) { this.lastCap = c; this.emit('cap', { text: c }); }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  },
  emit(ev, d) { for (const f of this.subs) { try { f(ev, d || {}); } catch (e) { console.error(e); } } },
};
Player.subs.add(ev => { if (ev === 'start' || ev === 'word') Narr.stop(); });
/* every «اسمع الشرح» button on the page reflects the narrator's state */
Narr.subs.add((ev, d) => {
  if (ev !== 'start' && ev !== 'end') return;
  $$('[data-narr]').forEach(b => {
    const on = ev === 'start' && b.dataset.narr === d.k;
    b.classList.toggle('on', on);
    const lab = b.querySelector('.nl'); if (lab) lab.textContent = on ? 'إيقاف الشرح' : 'اسمع الشرح';
  });
});
Narr.subs.add((ev, d) => {
  if (ev !== 'end' || !d.ok || !/^v\d+$/.test(d.k)) return;
  S.narrHeard = S.narrHeard || [];
  if (!S.narrHeard.includes(d.k)) { S.narrHeard.push(d.k); addXP(3); save(); if (S.narrHeard.length >= 5) award('narr'); }
});
function toggleNarr(k) {
  if (Narr.k === k && Narr.state === 'playing') { Narr.stop(); return; }
  if (Narr.k === k && Narr.state === 'paused') { Narr.resume(); return; }
  Narr.play(k);
}

/* ---------- real nature sounds instead of music: never under a recitation ---------- */
const Amb = {
  /* two players that hand over with a 1 s crossfade before the end, so the loop never gaps */
  els: [new Audio(), new Audio()], cur: 0, k: null, want: null, vol: .3, under: false, level: 0, target: 0, speed: 1, raf: 0, xf: 0,
  has(k) { return !!(MEDIA.amb && MEDIA.amb[k]); },
  /* a view states what it would like to hear; null = silence */
  set(k, vol = .3, under = false) {
    this.want = k && this.has(k) && S.settings.nature !== false ? k : null; this.vol = vol; this.under = under;
    this.sync();
  },
  busy() { return Player.state !== 'idle' || (Narr.state === 'playing' && !this.under); },
  sync() {
    if (document.hidden) { this.halt(); return; }
    const k = this.want && !this.busy() ? this.want : null;
    if (!k) { this.target = 0; this.speed = Player.state !== 'idle' ? 5 : 1.6; if (this.level > 0) this.loop(); else this.halt(); return; }
    if (k !== this.k) { this.halt(); this.k = k; this.cur = 0; this.els.forEach(e => { e.src = `amb/${k}.mp3`; e.loop = false; e.volume = 0; }); }
    this.target = this.vol; this.speed = .8;
    const a = this.els[this.cur]; if (a.paused) a.play().catch(() => { });
    this.loop();
  },
  halt() { cancelAnimationFrame(this.raf); this.raf = 0; this.xf = 0; this.level = 0; this.els.forEach(e => e.pause()); },
  loop() {
    if (this.raf) return;
    let last = performance.now();
    const step = now => {
      const dt = Math.min(.1, (now - last) / 1000); last = now;
      const d = this.target - this.level, mv = dt * this.speed * Math.max(this.vol, .2);
      this.level = Math.abs(d) <= mv ? this.target : this.level + Math.sign(d) * mv;
      const a = this.els[this.cur], b = this.els[1 - this.cur];
      if (a.ended && this.target > 0) { a.currentTime = 0; a.play().catch(() => { }); }
      if (!this.xf && a.duration && !a.paused && a.currentTime > a.duration - 1.2) { b.currentTime = 0; b.play().catch(() => { }); this.xf = now; }
      if (this.xf) {
        const p = clamp((now - this.xf) / 1000); a.volume = clamp(this.level * (1 - p)); b.volume = clamp(this.level * p);
        if (p >= 1) { a.pause(); this.cur = 1 - this.cur; this.xf = 0; }
      } else a.volume = clamp(this.level);
      if (this.level === 0 && this.target === 0) { this.raf = 0; this.halt(); return; }
      this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  },
};
Amb.els.forEach(e => { e.preload = 'auto'; });
Player.subs.add(ev => { if (ev === 'start' || ev === 'end') Amb.sync(); });
Narr.subs.add(ev => { if (ev !== 'cap') Amb.sync(); });
document.addEventListener('visibilitychange', () => Amb.sync());

/* ---------- deep cards: one expressive line, then «تعمّق» ---------- */
function deepCard(c) {
  const K = CARD_KINDS[c.k];
  const src = c.src ? `<small class="src">${ic('book')} ${esc(c.src)}</small>` : '';
  const body = c.d ? `<details><summary>تعمّق</summary><p class="dd">${qfmt(c.d)}</p>${src}</details>` : src;
  return `<article class="dc t-${K.tone}" role="listitem"><header>${ic(K.ic)}<span>${K.t}</span></header><p class="ds">${qfmt(c.s)}</p>${body}</article>`;
}
function narrBtn(k, cls = 'btn btn-line') {
  if (!Narr.has(k)) return '';
  const on = Narr.k === k && Narr.state !== 'idle';
  return `<button class="${cls} narrb ${on ? 'on' : ''}" data-narr="${k}">${ic('voice')}<span class="nl">${on ? 'إيقاف الشرح' : 'اسمع الشرح'}</span></button>`;
}
function deepHTML(n) {
  const D = DEEP[n]; if (!D) return '';
  return `<section class="deep" data-n="${n}">
    <div class="dhead"><div class="grow"><span class="eyebrow">تعمّق في الآية ${ARN(n)}</span><p class="dline">${qfmt(D.line)}</p></div>${narrBtn('v' + n)}</div>
    <div class="dcards" role="list">${D.cards.map(deepCard).join('')}</div>
  </section>`;
}

/* ---------- the documentary: real scenes + recitation + narrator, chapter by chapter ---------- */
const Doc = {
  el: null, i: 0, tok: 0, paused: false, scene: null,
  chapters: ['intro', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 'outro'],
  open(start = 0) {
    if (this.el) this.close();
    stopAll(); Narr.stop(); Hero.stop(); if (Cine.w) Cine.w.stop();
    this.el = node(`<div class="doc" role="dialog" aria-label="وثائقي الضحى">
      <div class="dmedia"></div><div class="dshade"></div>
      <div class="dtop"><span class="dtitle">${ic('film')} وثائقي الضحى</span><span class="grow"></span><span class="dch" id="dCh"></span><button class="iconbtn" id="dX" aria-label="إغلاق">${ic('x')}</button></div>
      <div class="dmid"><div class="dverse qt night" id="dVerse"></div><div class="dsub" id="dSub"></div></div>
      <div class="caps" id="dCaps" aria-live="polite"></div>
      <div class="dbot">
        <div class="ddots" id="dDots">${this.chapters.map((c, i) => `<button data-i="${i}" aria-label="${c === 'intro' ? 'المقدمة' : c === 'outro' ? 'الخاتمة' : 'الآية ' + c}"></button>`).join('')}</div>
        <div class="dctl"><button class="sm" id="dPrev" aria-label="السابق">${ic('next')}</button><button class="main" id="dPlay" aria-label="إيقاف مؤقت">${ic('pause')}</button><button class="sm" id="dNext" aria-label="التالي">${ic('prev')}</button></div>
      </div>
    </div>`);
    document.body.appendChild(this.el);
    document.body.classList.add('noscroll');
    this.scene = RealScene($('.dmedia', this.el), { reduce: reduceMotion() });
    this.scene.start();
    $('#dX').onclick = () => this.close();
    $('#dPlay').onclick = () => this.toggle();
    $('#dPrev').onclick = () => this.go(Math.max(0, this.i - 1));
    $('#dNext').onclick = () => this.go(Math.min(this.chapters.length - 1, this.i + 1));
    $('#dDots').onclick = e => { const b = e.target.closest('button'); if (b) this.go(+b.dataset.i); };
    this.capSub = (ev, d) => { if (ev === 'cap' && this.el) $('#dCaps').textContent = d.text; };
    Narr.subs.add(this.capSub);
    this.tick = t => {
      if (!this.el || typeof this.chapters[this.i] !== 'number') return;
      $$('#dVerse .w').forEach(el => el.classList.toggle('on', +el.dataset.w === t.w));
    };
    Ticks.add(this.tick);
    keepAwake(true); addXP(5);
    this.go(start);
  },
  close() {
    if (!this.el) return;
    this.tok++; Narr.stop(); stopAll();
    this.scene && this.scene.stop(); Narr.subs.delete(this.capSub); Ticks.delete(this.tick);
    this.el.remove(); this.el = null; document.body.classList.remove('noscroll'); keepAwake(false);
    if (tab === 'home') renderHome(); else if (tab === 'watch') Cine.mount();
  },
  ui() {
    const ch = this.chapters[this.i];
    $$('#dDots button').forEach((b, i) => { b.classList.toggle('on', i === this.i); b.classList.toggle('done', i < this.i); });
    $('#dCh').textContent = ch === 'intro' ? 'المقدمة' : ch === 'outro' ? 'الخاتمة' : `الآية ${ARN(ch)} من ١١`;
    $('#dPlay').innerHTML = ic(this.paused ? 'play' : 'pause');
    $('#dPlay').setAttribute('aria-label', this.paused ? 'تشغيل' : 'إيقاف مؤقت');
  },
  async go(i) {
    const my = ++this.tok; this.i = i; this.paused = false;
    Narr.stop(); stopAll();
    const ch = this.chapters[i], V = $('#dVerse'), sub = $('#dSub');
    $('#dCaps').textContent = ''; this.ui();
    const live = () => my === this.tok && this.el;
    if (ch === 'intro' || ch === 'outro') {
      this.scene.setScene(ch === 'intro' ? 'v0' : 'v1');
      V.innerHTML = `<span class="dtitlebig">سورة الضحى</span>`;
      sub.innerHTML = ch === 'intro' ? 'إحدى عشرة آية · مكية' : `<div class="row" style="justify-content:center;gap:10px;margin-top:14px"><button class="btn btn-sun" id="dStart">${ic('play')} ابدأ الحفظ</button><button class="btn btn-line" id="dAgain">${ic('repeat')} من البداية</button></div>`;
      if (ch === 'outro') { $('#dStart').onclick = () => { this.close(); go(nextStation() ? 'st' + nextStation().id : 'play'); }; $('#dAgain').onclick = () => this.go(0); }
      await sleep(700); if (!live()) return;
      await Narr.play(ch); if (!live()) return;
      if (ch === 'intro') { await sleep(500); if (live()) this.go(i + 1); }
      else if (!S.badges.doc) { award('doc'); }
      return;
    }
    this.scene.setScene(ch);
    V.innerHTML = verseHTML(ch, { marker: true }); V.classList.toggle('notj', !S.settings.tj);
    sub.textContent = DEEP[ch].line;
    await sleep(900); if (!live()) return;
    await playSeq([ch], { repeat: 1 }); if (!live()) return;
    await sleep(450); if (!live()) return;
    await Narr.play('v' + ch); if (!live()) return;
    await sleep(600); if (live()) this.go(i + 1);
  },
  toggle() {
    this.paused = !this.paused;
    if (this.paused) { pauseP(); Narr.pause(); this.scene.stop(); }
    else { resumeP(); Narr.resume(); this.scene.start(); }
    this.ui();
  },
};

/* ---------- credits: every scene's source and license ---------- */
function openCredits() {
  const sc = Object.entries(MEDIA.scenes || {}).sort((a, b) => (+a[0].slice(1) || 99) - (+b[0].slice(1) || 99));
  openSheet('المصادر والحقوق', `
    <p class="muted">كل المشاهد حقيقية من مكتبات مفتوحة الترخيص، وكل معلومة في الشرح لها مصدر.</p>
    <h4>المشاهد</h4>
    <ul class="credits">${sc.map(([k, s]) => `<li><b>${k === 'v0' ? 'المقدمة' : /^v\d+$/.test(k) ? 'الآية ' + ARN(k.slice(1)) : ({ sun: 'قوّة الله: الشمس', desert: 'قصة الصحراء', citron: 'الأترجّة' }[k] || k)}</b><span>${esc(s.t)}</span><small>${esc(s.a || '')} · ${esc(s.l)} · <a href="${esc(s.u)}" target="_blank" rel="noopener">المصدر</a></small></li>`).join('')}</ul>
    <h4>مصادر الفوائد</h4>
    <ul class="credits">${SRC_LINKS.map(([t, u]) => `<li><span>${esc(t)}</span><small><a href="${esc(u)}" target="_blank" rel="noopener">${esc(u.replace(/^https?:\/\//, '').split('/')[0])}</a></small></li>`).join('')}</ul>
    <h4>صور ناسا</h4>
    <ul class="credits">${IMG_CREDITS.map(([t, a, u]) => `<li><span>${esc(t)}</span><small>${esc(a)} · <a href="${esc(u)}" target="_blank" rel="noopener">المصدر</a></small></li>`).join('')}</ul>
    <h4>صور الواحة والنخيل وقصر الذاكرة</h4>
    <ul class="credits">${Object.entries(MEDIA.img || {}).map(([k, x]) => `<li><b>${({ oasis: 'الواحة', oasis2: 'سقي النخيل', palm0: 'أرضٌ تنتظر', palm1: 'نبتة', palm2: 'فسيلة', palm3: 'نخلة', palm4: 'نخلة مثمرة' }[k] || (/^pal\d+$/.test(k) ? 'قصر الذاكرة: ' + PALACE[+k.slice(3) - 1].name : k))}</b><span>${esc(x.title)}</span><small>${esc(x.creator || '')} · ${esc(x.license)} · <a href="${esc(x.page)}" target="_blank" rel="noopener">المصدر</a></small></li>`).join('')}</ul>
    <h4>الأصوات</h4>
    <ul class="credits">${Object.entries(MEDIA.amb || {}).map(([k, x]) => `<li><b>${({ dawn: 'عصافير الفجر', night: 'ليلٌ هادئ', palms: 'ريحٌ بين النخيل', water: 'ماءٌ جارٍ' }[k] || k)}</b><span>${esc(x.title)}</span><small>${esc(x.creator || '')} · ${esc(x.license)} · <a href="${esc(x.page)}" target="_blank" rel="noopener">المصدر</a></small></li>`).join('')}<li><span>التلاوات</span><small>EveryAyah وQuran.com</small></li><li><span>صوت الراوي</span><small>مولَّد بالذكاء الاصطناعي (Piper، صوت ar_JO-kareem). الراوي يشرح ولا يقرأ القرآن.</small></li><li><span>صفحة «مصحفك المذهّب»</span><small>تخطيط الصفحة ٥٩٦ من مصحف المدينة (١٥ سطرًا) والنص العثماني: Quran.com</small></li><li><span>«الضحى الغامر ٣٦٠°»</span><small>${Object.values(MEDIA.pano || {}).map(p => `${esc(p.title)}: ${esc(p.creator)} · ${esc(p.license)} · Poly Haven`).join(' — ')} · صورٌ حقيقية من صحراء ناماكوالاند في جنوب أفريقيا</small></li><li><span>العالم ثلاثي الأبعاد</span><small>three.js r147 (MIT)</small></li>${PACKS.map(pk => `<li><span>حزمة «${esc(pk.t)}»</span><small>${pk.items.map(it => `${esc(it.t)}: ${esc(it.by)} · ${esc(it.lic)}${it.src ? ` · <a href="${esc(it.src)}" target="_blank" rel="noopener">المصدر</a>` : ''}`).join(' — ')}</small></li>`).join('')}<li><span>رموز «كنز الضحى»</span><small>qrcode-generator (Kazuhiko Arase، MIT) وjsQR (Cosmo Wolfe، Apache 2.0)</small></li><li><span>«سماء الكلمات»</span><small>الجذور: Quranic Arabic Corpus v0.4 (GNU GPL) عبر مشروع quran-morphology · نص الآيات: Tanzil.net (النص العثماني)</small></li></ul>`);
}
