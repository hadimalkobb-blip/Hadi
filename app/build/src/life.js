/* ===== From the verse to your life: comfort, gratitude, the three commands, a sealed promise, the orphan's years, and the oasis ===== */
const LIFE = [
  { id: 'calm', t: 'قلبك ضيّق؟', s: 'نزلت هذه السورة لقلبٍ حزين… اسمعها الآن.', ic: 'breath', tone: 'love' },
  { id: 'grat', t: 'دفتر النعم', s: 'ثلاث نِعم كل يوم… تعود إليك يوم الضيق.', ic: 'quill', tone: 'gold' },
  { id: 'acts', t: 'وصايا الضحى', s: 'يتيمٌ، وسائلٌ، ونعمة: ثلاث مهمات كل أسبوع.', ic: 'hands', tone: 'sky' },
  { id: 'seal', t: 'الوعد المختوم', s: 'رسالةٌ لنفسك تُفتح بعد شهرٍ من المراجعة.', ic: 'seal', tone: 'justice' },
  { id: 'orphan', t: 'يتيمٌ… فآوى', s: 'يُتم النبي ﷺ بالسنين، ومأوى بعد كل فقد.', ic: 'shield', tone: 'mercy' },
  { id: 'oasis', t: 'واحة الحفظ', s: 'كل آية نخلة: تكبر بالمراجعة، وتعطش بالنسيان.', ic: 'palm', tone: 'gold' },
];
const fmtDay = k => { const d = keyDate(k); try { return ARN(d.toLocaleDateString('ar-SY-u-nu-latn', { day: 'numeric', month: 'long' })); } catch (e) { return ARN(k); } };
/* a doorway from a verse in the cinema to the matching life feature */
const VERSE_LIFE = { 3: ['calm', 'breath', 'قلبك ضيّق؟'], 6: ['orphan', 'shield', 'يتيمٌ… فآوى'], 9: ['acts', 'hands', 'مهمة هذا الأسبوع'], 10: ['acts', 'hands', 'مهمة هذا الأسبوع'], 11: ['grat', 'quill', 'دفتر النعم'] };
const verseLifeBtn = n => { const x = VERSE_LIFE[n]; return x ? `<button class="btn btn-line" data-go="${x[0]}">${ic(x[1])} ${x[2]}</button>` : ''; };
/* Arabic counted nouns: [one, two, 3–10, 11+] */
const cnt = (n, [one, two, few, many]) => n === 1 ? one : n === 2 ? two : `${ARN(n)} ${n % 100 >= 3 && n % 100 <= 10 ? few : many}`;
const lifeTone = tone => { if (Run.el) Run.el.classList.add('heartrun', 't-' + tone); };

/* ---------- «قلبك ضيّق؟»: sunrise, the story of the revelation, then the surah ---------- */
const Calm = {
  el: null, tok: 0, scene: null,
  open() {
    if (this.el) this.close();
    closeRunner(true); closeSheet(); stopAll(); Narr.stop(); Hero.stop(); if (Cine.w) Cine.w.stop();
    this.el = node(`<div class="doc calm" role="dialog" aria-label="لحظة سكينة">
      <div class="dmedia"></div><div class="dshade"></div>
      <div class="dtop"><span class="dtitle">${ic('breath')} لحظة سكينة</span><span class="grow"></span><button class="iconbtn" id="kX" aria-label="إغلاق">${ic('x')}</button></div>
      <div class="dmid"><div class="breath" aria-hidden="true"><i></i></div><div class="dverse qt night" id="kVerse"></div><div class="dsub" id="kSub"></div></div>
      <div class="caps" id="kCaps" aria-live="polite"></div>
      <div class="dbot" id="kBot"></div>
    </div>`);
    document.body.appendChild(this.el); document.body.classList.add('noscroll');
    this.scene = RealScene($('.dmedia', this.el), { scene: 'v0', reduce: reduceMotion() }); this.scene.start();
    $('#kX').onclick = () => this.close();
    this.capSub = (ev, d) => { if (ev === 'cap' && this.el) $('#kCaps').textContent = d.text; };
    Narr.subs.add(this.capSub);
    this.vSub = (ev, d) => { if (!this.el || ev !== 'verse') return; this.scene.setScene(d.n); const V = $('#kVerse'); V.innerHTML = verseHTML(d.n, { marker: true }); V.classList.toggle('notj', !S.settings.tj); };
    Player.subs.add(this.vSub);
    this.tick = t => { if (this.el) $$('#kVerse .w').forEach(el => el.classList.toggle('on', +el.dataset.w === t.w)); };
    Ticks.add(this.tick);
    keepAwake(true);
    this.run();
  },
  async say(k, live) {  // the narrator, or its words alone when the narrator is switched off
    const m = MEDIA.narr && MEDIA.narr[k]; if (!m) return;
    if (S.settings.narr !== 'off') { await Narr.play(k); return; }
    for (const [a, b, txt] of m.caps) { if (!live()) return; $('#kCaps').textContent = txt; await sleep((b - a) * 1000 + 900); }
    $('#kCaps').textContent = '';
  },
  async run() {
    const my = ++this.tok, live = () => my === this.tok && this.el;
    $('#kVerse').innerHTML = ''; $('#kSub').textContent = ''; $('#kBot').innerHTML = '';
    this.scene.setScene('v0'); this.el.classList.add('breathing'); Amb.set('dawn', .16, true);
    await sleep(700); if (!live()) return;
    await this.say('dayiq', live); if (!live()) return;
    this.el.classList.remove('breathing'); Amb.set(null);
    await sleep(600); if (!live()) return;
    await playSeq(verseRange(1, NV), { gap: 650 }); if (!live()) return;
    this.scene.setScene('v1'); $('#kVerse').innerHTML = '';
    S.calm = (S.calm || 0) + 1; save(); Amb.set('dawn', .14);
    this.end();
  },
  end() {
    const g = gratPick(3);
    $('#kBot').innerHTML = `<div class="calmend reveal">
      ${g.length ? `<span class="eyebrow">نِعَمٌ كتبتها بيدك، دليلٌ على أنه ما تركك</span><ul class="gpick">${g.map(x => `<li><span>${esc(x.t)}</span><small>${fmtDay(x.d)}</small></li>`).join('')}</ul>` : ''}
      <p class="qcenter">${qfmt('﴿مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ﴾')}</p>
      <blockquote class="hd">«لا إله إلا الله العظيم الحليم، لا إله إلا الله ربّ العرش العظيم، لا إله إلا الله ربّ السماوات وربّ الأرض وربّ العرش الكريم».<small class="src">${ic('book')} كان النبي ﷺ يقوله عند الكرب · البخاري ٦٣٤٦، مسلم ٢٧٣٠</small></blockquote>
      <small class="src">${ic('book')} قصة النزول: البخاري ٤٩٥٠، مسلم ١٧٩٧ (بتصرّف، والسياق مجموعٌ من الروايتين)</small>
      <div class="row wrap"><button class="btn btn-line" id="kGrat">${ic('quill')} ${g.length ? 'أضف نِعم اليوم' : 'اكتب ثلاث نِعم الآن'}</button><button class="btn btn-line" id="kCard">${ic('share')} ابعثها لقلبٍ حزين</button><button class="btn btn-line" id="kAgain">${ic('repeat')} مرةً أخرى</button><button class="btn btn-sun" id="kDone">الحمد لله</button></div>
    </div>`;
    $('#kGrat').onclick = () => { this.close(); openGrat(); };
    $('#kAgain').onclick = () => this.run();
    $('#kCard').onclick = () => { this.close(); openCard('card', 3); };
    $('#kDone').onclick = () => this.close();
  },
  close() {
    if (!this.el) return;
    this.tok++; Narr.stop(); stopAll(); Amb.set(null); this.scene && this.scene.stop();
    Narr.subs.delete(this.capSub); Player.subs.delete(this.vSub); Ticks.delete(this.tick);
    this.el.remove(); this.el = null; document.body.classList.remove('noscroll'); keepAwake(false);
    if (tab === 'home') renderHome(); else if (tab === 'watch') Cine.mount(); else if (tab === 'heart') renderHeart();
  },
};

/* ---------- دفتر النعم: three blessings a day ---------- */
const GRAT_HINTS = ['نَفَسٌ يدخل صدري بلا تعب', 'أهلٌ يحبّونني', 'بيتٌ يؤويني', 'طعامٌ أكلته اليوم', 'صديقٌ سأل عني', 'آيةٌ حفظتها', 'عافيةٌ في بدني', 'صلاةٌ صلّيتها', 'عينان أرى بهما', 'شيءٌ جديد تعلّمته', 'ماءٌ باردٌ شربته', 'نومٌ هادئ'];
const gratDays = () => Object.keys(S.grat || {}).filter(k => (S.grat[k] || []).length).sort();
function gratAll() { const out = []; for (const d of gratDays()) for (const t of S.grat[d]) out.push({ d, t }); return out; }
function gratPick(n) { const all = gratAll(), old = all.filter(x => x.d !== dayKey()); return shuffle(old.length >= n ? old : all).slice(0, n); }
function gratHistHTML() {
  const days = gratDays().reverse().slice(0, 40);
  if (!days.length) return '';
  return `<h4 class="ghead">ما كتبته من قبل</h4><div class="ghist">${days.map(d => `<div class="gday"><div class="row"><b class="grow">${fmtDay(d)}</b><button class="chip" data-gs="${d}">${ic('share')} حدّث بها</button><button class="iconbtn sm" data-gx="${d}" aria-label="احذف هذا اليوم">${ic('x')}</button></div><ul>${S.grat[d].map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>`).join('')}</div>`;
}
function gratShare(d) {
  const txt = `من نِعم الله عليّ${d === dayKey() ? ' اليوم' : ''}:\n${S.grat[d].map(t => '• ' + t).join('\n')}\n\n﴿وَأَمَّا بِنِعْمَةِ رَبِّكَ فَحَدِّثْ﴾`;
  openSheet('حدّث بنعمة ربك', `<p class="dim">شكرًا لا فخرًا. اختر ما تحب أن تشاركه.</p><textarea id="gsT" rows="6">${esc(txt)}</textarea>
    <div class="row wrap" style="margin-top:10px"><a class="btn btn-sun" id="gsW" target="_blank" rel="noopener">${ic('share')} واتساب</a><button class="btn btn-line" id="gsC">${ic('copy')} انسخ</button></div>`, sh => {
    const t = $('#gsT', sh), w = $('#gsW', sh);
    const upd = () => { w.href = 'https://wa.me/?text=' + encodeURIComponent(t.value); }; upd(); t.oninput = upd;
    $('#gsC', sh).onclick = async () => { try { await navigator.clipboard.writeText(t.value); toast('نُسخت', 'check'); } catch (e) { t.select(); toast('حدّد النص وانسخه', 'copy'); } };
  });
}
function openGrat() {
  const b = openRunner('دفتر النعم'); lifeTone('gold');
  S.grat = S.grat || {};
  const k = dayKey(), today = S.grat[k] || [], hint = i => GRAT_HINTS[(dayIdx() + i * 4) % GRAT_HINTS.length];
  const draw = () => {
    const total = gratAll().length, days = gratDays().length, cur = S.grat[k] || [];
    html(b, hx({ ic: 'quill', t: 'دفتر النعم' }, `
      <p class="qcenter">${qfmt('﴿وَأَمَّا بِنِعْمَةِ رَبِّكَ فَحَدِّثْ﴾')}</p>
      <p class="muted" style="text-align:center">اكتب ثلاث نِعم من يومك، صغيرةً كانت أو كبيرة. يوم يضيق صدرك، تعود إليك.</p>
      <div class="gform">${[0, 1, 2].map(i => `<label class="gin"><span>${ARN(i + 1)}</span><input id="gI${i}" maxlength="120" value="${esc(cur[i] || '')}" placeholder="${esc(hint(i))}" autocomplete="off"></label>`).join('')}</div>
      <div class="ghints">${shuffle(GRAT_HINTS).slice(0, 6).map(h => `<button class="chip" data-gh="${esc(h)}">${esc(h)}</button>`).join('')}</div>
      <button class="btn btn-sun btn-wide" id="gSave">${ic('check')} ${cur.length ? 'حدّث نِعم اليوم' : 'احفظ نِعم اليوم'}</button>
      ${total ? `<div class="bigstat"><b>${ARN(total)}</b><span>عدد النِّعم التي كتبتها، في ${cnt(days, ['يومٍ واحد', 'يومين', 'أيام', 'يومًا'])}… وما هي إلا قطرة: ${qfmt('﴿وَإِن تَعُدُّوا۟ نِعْمَةَ ٱللَّهِ لَا تُحْصُوهَآ﴾')}</span></div>` : ''}
      <div id="gHist">${gratHistHTML()}</div>
      <p class="dim" style="text-align:center">${ic('lock')} دفترك خاصٌّ بك، لا يراه غيرك.</p>`));
  };
  draw(); Amb.set('water', .2);
  b.onclick = e => {
    const h = e.target.closest('[data-gh]');
    if (h) { const inp = [0, 1, 2].map(i => $('#gI' + i)).find(x => !x.value.trim()) || $('#gI2'); inp.value = h.dataset.gh; inp.focus(); Sfx.tap(); return; }
    if (e.target.closest('#gSave')) {
      const items = [0, 1, 2].map(i => $('#gI' + i).value.trim().slice(0, 120)).filter(Boolean);
      if (!items.length) { toast('اكتب نعمةً واحدة على الأقل', 'quill'); return; }
      const first = !(S.grat[k] || []).length; S.grat[k] = items; save();
      if (first) { addXP(10); toast('الحمد لله… هكذا يكون الشكر', 'check'); Sfx.win && Sfx.win(); if (gratDays().length >= 7) award('grat7'); }
      else toast('حُدّثت نِعم اليوم', 'check');
      draw(); return;
    }
    const s = e.target.closest('[data-gs]'); if (s) { gratShare(s.dataset.gs); return; }
    const x = e.target.closest('[data-gx]');
    if (x) { if (confirm('تحذف ما كتبته في هذا اليوم؟')) { delete S.grat[x.dataset.gx]; save(); draw(); } }
  };
}

/* ---------- وصايا الضحى: the three commands, one week at a time ---------- */
const ACTS = [
  { id: 'yatim', v: 9, t: 'أكرِم يتيمًا', ideas: ['كلمةٌ طيبة أو هديةٌ ليتيمٍ تعرفه', 'ساهم في كفالة يتيم عبر جهةٍ موثوقة', 'ادعُ لأيتامٍ تعرفهم بأسمائهم'], hd: '«أنا وكافل اليتيم في الجنة هكذا»، وأشار بالسبابة والوسطى.', src: 'البخاري ٥٣٠٤' },
  { id: 'sail', v: 10, t: 'لا تردّ سائلًا', ideas: ['أعطِ من سألك ما تيسّر، أو ردّه بلطف', 'أجب من يسألك عن علمٍ بصبرٍ ولطف', 'إن لم تقدر فردّ بكلمةٍ طيبة'], hd: '«والكلمة الطيبة صدقة».', src: 'البخاري ٢٩٨٩، مسلم ١٠٠٩' },
  { id: 'ni', v: 11, t: 'حدّث بنعمة', ideas: ['أخبر أحدًا بنعمةٍ من الله عليك، شكرًا لا فخرًا', 'اشكر شخصًا أحسن إليك', 'علّم أحدًا آيةً من الضحى'], hd: '«لا يشكر اللهَ من لا يشكر الناس».', src: 'أبو داود ٤٨١١ واللفظ له، الترمذي ١٩٥٤ (صحيح)' },
];
const weekKey = (d = new Date()) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12); x.setDate(x.getDate() - (x.getDay() + 6) % 7); return dayKey(x); };
function actsState() {
  S.acts = S.acts || { wk: null, done: {}, stars: 0, weeks: 0, log: [] };
  const A = S.acts; if (A.wk !== weekKey()) { A.wk = weekKey(); A.done = {}; }
  return A;
}
function openActs() {
  const b = openRunner('وصايا الضحى'); lifeTone('sky');
  const draw = () => {
    const A = actsState(), n = ACTS.filter(a => A.done[a.id]).length;
    html(b, hx({ ic: 'hands', t: 'وصايا الضحى' }, `
      <p class="muted" style="text-align:center">بعد ثلاث نِعم جاءت ثلاث وصايا: فكما آواك فلا تقهر اليتيم، وكما أغناك وهداك فلا تنهر السائل، سائلَ مالٍ أو علم، وكما أنعم عليك فحدّث بنعمته. كل أسبوع ثلاث مهمات صغيرة.</p>
      <div class="weekbar"><span>هذا الأسبوع</span><b>${ARN(n)} من ٣</b><span class="rope"><i style="width:${(n / 3) * 100}%"></i></span></div>
      ${ACTS.map(a => { const d = A.done[a.id]; return `<div class="card act ${d ? 'done' : ''}">
        <div class="qt night qv">${verseHTML(a.v)}</div>
        <h3>${a.t}</h3>
        <ul class="ideas">${a.ideas.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
        ${hadith(a.hd, a.src)}
        ${d ? `<div class="row"><span class="good grow">${ic('check')} فعلتها ${fmtDay(d)}، تقبّل الله</span><button class="chip" data-au="${a.id}">تراجع</button></div>`
          : `<input class="actnote" id="an-${a.id}" maxlength="140" placeholder="ماذا فعلت؟ (اختياري، خاصٌّ بك)"><button class="btn btn-sun btn-wide" data-ad="${a.id}">${ic('check')} فعلتها هذا الأسبوع</button>`}
      </div>`; }).join('')}
      <div class="bigstat"><b>${ARN(A.stars || 0)}</b><span>نجوم العمل حتى الآن · ${A.weeks ? cnt(A.weeks, ['أسبوعٌ مكتمل', 'أسبوعان مكتملان', 'أسابيع مكتملة', 'أسبوعًا مكتملًا']) : 'لم يكتمل أسبوعٌ بعد'}</span></div>
      <p class="dim" style="text-align:center">لا أحد يراقبك هنا إلا الله. سجّلها بصدق، وأخفِ من عملك ما استطعت.</p>`));
  };
  draw();
  b.onclick = e => {
    const A = actsState();
    const dn = e.target.closest('[data-ad]');
    if (dn) {
      const id = dn.dataset.ad, note = ($('#an-' + id)?.value || '').trim().slice(0, 140);
      A.done[id] = dayKey(); A.stars = (A.stars || 0) + 1; A.log = [...(A.log || []), { d: dayKey(), id, note }].slice(-80);
      addXP(15); Sfx.ok(); buzz(14);
      if (ACTS.every(a => A.done[a.id])) { A.weeks = (A.weeks || 0) + 1; award('acts'); toast('أتممت وصايا الضحى هذا الأسبوع', 'hands'); Sfx.win && Sfx.win(); }
      save(); draw(); return;
    }
    const un = e.target.closest('[data-au]');
    if (un) {
      const id = un.dataset.au, all = ACTS.every(a => A.done[a.id]);
      delete A.done[id]; A.stars = Math.max(0, (A.stars || 0) - 1); if (all) A.weeks = Math.max(0, (A.weeks || 0) - 1);
      const i = (A.log || []).map(x => x.id).lastIndexOf(id); if (i >= 0) A.log.splice(i, 1);
      save(); draw();
    }
  };
}

/* ---------- الوعد المختوم: a letter to yourself, opened after a month of reviews ---------- */
const SEAL_DAYS = 30;
function sealInfo() {
  const s = S.seal; if (!s) return null;
  const days = daysBetween(s.at, dayKey()), due = dueReviews().length, rev = (S.reviews || 0) - (s.rev || 0);
  return { ...s, days, due, rev, ready: days >= SEAL_DAYS && due === 0 };
}
function openSeal() {
  const b = openRunner('الوعد المختوم'); lifeTone('justice');
  const PROMPTS = ['ماذا تعِد نفسك أن تحفظ خلال هذا الشهر؟', 'ما العادة التي تريد أن تتركها أو تبدأها؟', 'دعاءٌ تريد أن تتذكّر أنك دعوت به اليوم.', 'كلمةٌ لنفسك حين تقرأ هذا بعد شهر.'];
  const draw = (opened) => {
    const s = sealInfo(), hist = (S.sealed || []).slice().reverse();
    let body;
    if (opened) body = `<div class="letter open reveal"><span class="eyebrow">كتبتها في ${fmtDay(opened.at)}</span><p>${esc(opened.t).replace(/\n/g, '<br>')}</p></div>
      <p class="muted" style="text-align:center">هل وفيت؟ الحمد لله على ما كان، وما بقي فاسأل الله العون عليه.</p>
      <button class="btn btn-sun btn-wide" id="sNew">${ic('quill')} اكتب وعدًا جديدًا</button>`;
    else if (!s) body = `<p class="muted" style="text-align:center">اكتب رسالةً لنفسك. ستُختم ولا تُفتح إلا بعد ${ARN(SEAL_DAYS)} يومًا، وحين تكون قد أتممت مراجعاتك المستحقة.</p>
      <div class="ghints">${PROMPTS.map(p => `<button class="chip" data-sp="${esc(p)}">${esc(p)}</button>`).join('')}</div>
      <textarea id="sT" rows="6" maxlength="1200" placeholder="بعد شهر من اليوم، أرجو أن أكون…"></textarea>
      <button class="btn btn-sun btn-wide" id="sSeal">${ic('seal')} اختم الرسالة</button>`;
    else body = `<div class="envelope ${s.ready ? 'ready' : ''}"><i class="wax">${ic('seal')}</i><span>مختومة منذ ${fmtDay(s.at)}</span></div>
      <div class="sealprog">
        <div><span>الأيام</span><b>${ARN(Math.min(s.days, SEAL_DAYS))} من ${ARN(SEAL_DAYS)}</b><span class="rope"><i style="width:${clamp(s.days / SEAL_DAYS) * 100}%"></i></span></div>
        <div><span>مراجعات مستحقة الآن</span><b class="${s.due ? 'warn' : 'good'}">${s.due ? ARN(s.due) : 'لا شيء'}</b><span class="dim">${s.rev > 0 ? `راجعت ${cnt(s.rev, ['مرةً واحدة', 'مرتين', 'مرات', 'مرةً'])} منذ الختم` : 'لم تراجع منذ الختم بعد'}</span></div>
      </div>
      ${s.ready ? `<button class="btn btn-sun btn-wide" id="sOpen">${ic('mail')} افتح رسالتك</button>`
        : s.due ? `<button class="btn btn-sun btn-wide" data-go="rv${s.due && dueReviews()[0]}">${ic('repeat')} راجع الآن</button>`
          : `<p class="dim" style="text-align:center">${s.days < SEAL_DAYS ? `تبقّى ${cnt(SEAL_DAYS - s.days, ['يومٌ واحد', 'يومان', 'أيام', 'يومًا'])}.` : ''} استمر في مراجعاتك حين يحين موعدها.</p>`}
      <button class="linkish" id="sTear" style="justify-self:center">مزّق الرسالة</button>`;
    html(b, hx({ ic: 'seal', t: 'الوعد المختوم' }, `${body}
      ${hist.length ? `<h4 class="ghead">رسائل فُتحت</h4><div class="ghist">${hist.map(x => `<div class="gday"><b>${fmtDay(x.at)} ← ${fmtDay(x.opened)}</b><p>${esc(x.t).replace(/\n/g, '<br>')}</p></div>`).join('')}</div>` : ''}
      <p class="dim" style="text-align:center">${ic('lock')} رسالتك خاصةٌ بك، لا يراها غيرك.</p>`));
  };
  draw();
  b.onclick = e => {
    const p = e.target.closest('[data-sp]'); if (p) { const t = $('#sT'); t.value = (t.value ? t.value + '\n' : '') + p.dataset.sp + ' '; t.focus(); return; }
    if (e.target.closest('#sSeal')) {
      const t = $('#sT').value.trim(); if (t.length < 3) { toast('اكتب رسالتك أولًا', 'quill'); return; }
      S.seal = { t, at: dayKey(), rev: S.reviews || 0 }; addXP(5); save(); Sfx.ok(); toast('خُتمت رسالتك. نلتقي بعد شهر', 'seal'); draw(); return;
    }
    if (e.target.closest('#sOpen')) {
      const s = S.seal; if (!s) return;
      const x = { t: s.t, at: s.at, opened: dayKey() }; S.sealed = [...(S.sealed || []), x]; S.seal = null; save();
      award('seal'); Sfx.win && Sfx.win(); draw(x); return;
    }
    if (e.target.closest('#sNew')) { draw(); return; }
    if (e.target.closest('#sTear')) { if (confirm('تمزّق الرسالة قبل موعدها؟ لن تُحفظ.')) { S.seal = null; save(); draw(); } }
  };
}

/* ---------- يتيمٌ… فآوى: the Prophet's ﷺ orphanhood, year by year ---------- */
const ORPHAN = [
  { a: 'قبل مولده', t: 'تُوفّي أبوه عبد الله', d: 'والنبي ﷺ حملٌ في بطن أمه، على المشهور.' },
  { a: 'في السادسة', t: 'تُوفّيت أمه آمنة بنت وهب', d: 'بالأبواء بين مكة والمدينة، وهي راجعةٌ به من زيارة أخواله.' },
  { a: 'في الثامنة', t: 'تُوفّي جدّه عبد المطلب', d: 'وأوصى به إلى عمّه أبي طالب.' },
  { a: 'بعدها', t: 'كفله عمّه أبو طالب', d: 'فرعاه، وظلّ يحميه حتى بعد البعثة.' },
];
function openOrphan() {
  const b = openRunner('يتيمٌ… فآوى'); lifeTone('mercy');
  let i = 0;
  html(b, hx({ ic: 'shield', t: 'يتيمٌ… فآوى' }, `
    ${hasScene('v6') ? `<div class="uscene"><img src="${posterUrl('v6')}" alt=""></div>` : ''}
    <ol class="tline" id="oLine"></ol>
    <div id="oEnd"></div>
    <button class="btn btn-sun btn-wide" id="oGo">ابدأ</button>
    <small class="src">${ic('book')} ابن كثير، البداية والنهاية (المولد، ووفاة آمنة)؛ تفسير ابن كثير، الضحى: ٦</small>`));
  const step = () => {
    if (i < ORPHAN.length) {
      const o = ORPHAN[i++];
      $('#oLine').insertAdjacentHTML('beforeend', `<li class="reveal"><span class="ta">${o.a}</span><b>${o.t}</b><span>${o.d}</span></li>`);
      $('#oGo').textContent = i < ORPHAN.length ? 'ثم…' : 'وماذا قال له ربّه؟'; Sfx.tap(); return;
    }
    $('#oGo').remove();
    $('#oEnd').innerHTML = `<div class="card reveal">
      <div class="qt night qv">${verseHTML(6)}</div>
      <p class="big">يُتمٌ بعد يُتم… وفي كل مرةٍ كان الله يهيّئ له مأوى.</p>
      <p class="muted">إن مرّ بك فقدٌ، فالذي آوى نبيّه يتيمًا لا ينساك.</p>
      <div class="row wrap"><button class="btn btn-line" id="oPlay">${ic('play')} اسمع الآية</button>${narrBtn('v6')}<button class="btn btn-line" data-go="acts">${ic('hands')} مهمة اليتيم هذا الأسبوع</button></div>
      ${doneBtn('اللهم آوِنا في كنفك')}</div>`;
    $('#oPlay').onclick = () => playSeq([6]);
    bindDone(b);
  };
  $('#oGo').onclick = step;
}

/* ---------- واحة الحفظ: every verse is a palm ---------- */
const PALM = [
  { img: 'palm0', t: 'أرضٌ تنتظر', d: 'لم تُحفظ بعد' },
  { img: 'palm1', t: 'نبتة', d: 'حُفظت للتو' },
  { img: 'palm2', t: 'فسيلة', d: 'سُقيت بالمراجعة' },
  { img: 'palm3', t: 'نخلة', d: 'ثبتت جذورها' },
  { img: 'palm4', t: 'نخلة مثمرة', d: 'راسخةٌ تؤتي أُكُلها' },
];
const verseStation = n => STATIONS.find(s => s.id <= 4 && s.verses.includes(n));
function palmOf(n) {
  const s = verseStation(n), st = s && S.st[s.id];
  if (!st || !st.done) return { n, s, lvl: 0, thirsty: false };
  const g = st.stage || 0, lvl = g >= 5 ? 4 : g >= 3 ? 3 : g >= 1 ? 2 : 1;
  return { n, s, st, lvl, thirsty: !!(st.next && st.next < dayKey()) };
}
const palms = () => verseRange(1, NV).map(palmOf);
function lifeRow() {
  const P = palms(), th = P.filter(p => p.thirsty).length, grown = P.filter(p => p.lvl).length, gt = !!(S.grat && (S.grat[dayKey()] || []).length);
  return `<div class="liferow">
    <button class="card lifec oasisc" data-go="oasis"><span class="lmini" aria-hidden="true">${P.map(p => `<i class="l${p.lvl}${p.thirsty ? ' th' : ''}"></i>`).join('')}</span><b>واحتك</b><span class="dim">${th ? `${cnt(th, ['نخلةٌ عطشى', 'نخلتان عطشيان', 'نخلات عطشى', 'نخلةً عطشى'])}، اسقها` : grown ? `${ARN(grown)} من ١١ نخلة` : 'كل آية نخلة'}</span></button>
    <button class="card lifec" data-go="grat">${ic('quill')}<b>دفتر النعم</b><span class="dim">${gt ? 'كتبت نِعم اليوم' : 'ثلاث نِعم من يومك'}</span></button>
    <button class="card lifec calmc" data-go="calm">${ic('breath')}<span class="grow"><b>قلبك ضيّق؟</b><span class="dim">اسمع ما نزل لقلبٍ حزين، على مشهد شروق</span></span>${ic('chev')}</button>
  </div>`;
}
function openOasis() {
  const b = openRunner('واحة الحفظ'); lifeTone('gold');
  const draw = (sel) => {
    const P = palms(), fruit = P.filter(p => p.lvl === 4).length, grown = P.filter(p => p.lvl >= 1).length, th = P.filter(p => p.thirsty).length;
    if (P.every(p => p.lvl >= 3)) award('oasis');
    html(b, `<div class="oasis">
      <div class="ohero"><img src="img/oasis.jpg" alt="واحة حقيقية"><div class="otxt"><b>واحتك</b><span>${ARN(grown)} من ١١ نخلة${fruit ? ` · ${ARN(fruit)} مثمرة` : ''}${th ? ` · <em>${ARN(th)} عطشى</em>` : ''}</span></div></div>
      <div class="ogrid">${P.map(p => `<button class="opalm l${p.lvl} ${p.thirsty ? 'th' : ''} ${sel === p.n ? 'sel' : ''}" data-pn="${p.n}"><img src="img/${PALM[p.lvl].img}.jpg" alt="" loading="lazy"><span class="pn">${ARN(p.n)}</span><span class="pt">${p.thirsty ? 'عطشى' : PALM[p.lvl].t}</span>${p.thirsty ? `<i class="thd">${ic('drop')}</i>` : ''}</button>`).join('')}</div>
      <div id="oDet">${sel ? palmDetail(P[sel - 1]) : `<p class="dim" style="text-align:center">المس نخلةً لتعرف حالها.</p>`}</div>
      <div class="panel ohow"><img src="img/oasis2.jpg" alt="سقي النخيل في واحة" loading="lazy">
        <p class="big">الحفظ يزرع… والمراجعة في موعدها تسقي.</p>
        <p class="muted">نبتة ← فسيلة ← نخلة ← نخلة مثمرة. كل مراجعة في وقتها تكبّر النخلة وتباعد موعد السقي التالي، وإن فات الموعد عطشت.</p>
        ${hadith('«إن من الشجر شجرةً لا يسقط ورقها، وإنها مثل المسلم… هي النخلة».', 'البخاري ٦١، مسلم ٢٨١١')}
        <p class="qcenter sm">${qfmt('﴿كَلِمَةً طَيِّبَةً كَشَجَرَةٍ طَيِّبَةٍ أَصْلُهَا ثَابِتٌ وَفَرْعُهَا فِى ٱلسَّمَآءِ﴾')}</p>
        <p class="muted" style="text-align:center">فسّر ابن مسعود وأنس وجمهور السلف «الشجرة الطيبة» في هذه الآية بالنخلة، وذكر البخاري حديث النخلة في تفسير سورة إبراهيم.</p>${hsrc('تفسير ابن كثير، إبراهيم: ٢٤؛ البخاري ٤٦٩٨')}
      </div></div>`);
  };
  draw(); Amb.set('palms', .3);
  b.onclick = e => {
    const p = e.target.closest('[data-pn]'); if (p) { Sfx.tap(); draw(+p.dataset.pn); $('#oDet')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); return; }
    const w = e.target.closest('[data-water]'); if (w) { closeRunner(); startReview(+w.dataset.water); return; }
    const l = e.target.closest('[data-plisten]'); if (l) playSeq([+l.dataset.plisten]);
  };
}
function palmDetail(p) {
  const st = p.st, next = st && st.next;
  return `<div class="card pdet reveal">
    <div class="qt night qv">${verseHTML(p.n)}</div>
    <div class="row"><b class="grow">${PALM[p.lvl].t}</b><span class="dim">${PALM[p.lvl].d}</span></div>
    ${!p.lvl ? `<p class="muted">احفظها في محطة «${p.s.name}» فتُزرع نبتتها.</p><button class="btn btn-sun btn-wide" data-go="st${p.s.id}">${ic('palm')} ازرعها الآن</button>`
      : p.thirsty ? `<p class="warn">فات موعد سقيها منذ ${fmtDay(next)}.</p><button class="btn btn-sun btn-wide" data-water="${p.s.id}">${ic('drop')} اسقها بالمراجعة</button>`
        : `<p class="muted">موعد السقي القادم: ${fmtDay(next)}${p.lvl === 4 ? ' · نخلةٌ مثمرة، ما شاء الله' : ''}</p>`}
    <button class="btn btn-line btn-wide" data-plisten="${p.n}">${ic('play')} اسمع الآية</button>
  </div>`;
}
