/* ===== New games: geometric puzzles, out-of-the-box games and art =====
   Each one strengthens the memory from a new angle; every verse shown is the exact text. */
const rnd = n => Math.random() * n | 0;
const allWordsOf = n => QD.verses[n].map((w, i) => ({ n, i, w }));
const surahWords = () => verseRange(1, NV).flatMap(allWordsOf);
function distractors(right, k, near) {
  const pool = shuffle([...new Set(surahWords().map(x => x.w))].filter(w => w !== right));
  const same = near ? pool.filter(w => w.slice(-2) === right.slice(-2)) : [];
  return [...new Set([...same.slice(0, 1), ...pool])].slice(0, k);
}
const qw = (n, i) => wordHTML(n, i);
const vText = n => `<div class="qt night qbig">${verseHTML(n)}</div>`;
const shortVerses = () => verseRange(2, NV).filter(n => QD.verses[n].length >= 3 && QD.verses[n].length <= 5);

/* ---------- 1. شعاع الضحى: rotate mirrors so the morning light reads the verse in order ---------- */
const REFL = { '/': ([r, c]) => [-c, -r], '\\': ([r, c]) => [c, r] };
function genBeam(words) {
  const N = 5;
  for (let t = 0; t < 600; t++) {
    const r0 = rnd(N); let r = r0, c = N - 1, d = [0, -1];
    const path = [], seen = new Set(), mir = new Map(); let ok = true, since = 0;
    while (r >= 0 && r < N && c >= 0 && c < N) {
      const k = r * N + c; if (seen.has(k)) { ok = false; break; }
      seen.add(k); path.push(k); since++;
      if (path.length > 1 && since > 1 && mir.size < 4 && Math.random() < .42) {
        const opts = d[0] === 0 ? [[1, 0], [-1, 0]] : [[0, 1], [0, -1]];
        const nd = opts[rnd(2)], ty = (nd[0] === -d[1] && nd[1] === -d[0]) ? '/' : '\\';
        mir.set(k, ty); d = nd; since = 0;
      }
      r += d[0]; c += d[1];
      if (path.length > 20) { ok = false; break; }
    }
    if (!ok || mir.size < 2) continue;
    const straight = path.filter(k => !mir.has(k));
    if (straight.length < words.length + 1) continue;
    const idx = shuffle(straight.map((_, i) => i)).slice(0, words.length).sort((a, b) => a - b);
    const wc = idx.map(i => straight[i]);
    return { N, r0, path, mir, wc };
  }
  return null;
}
function traceBeam(L, rot) {
  const N = L.N; let r = L.r0, c = N - 1, d = [0, -1]; const vis = [];
  for (let s = 0; s < 60 && r >= 0 && r < N && c >= 0 && c < N; s++) {
    const k = r * N + c; vis.push(k);
    if (rot.has(k)) d = REFL[rot.get(k)](d);
    r += d[0]; c += d[1];
  }
  return { vis, exit: [r, c] };
}
async function gameBeam() {
  const vs = shuffle(shortVerses()).slice(0, 3); let solved = 0;
  for (let lv = 0; lv < vs.length; lv++) {
    setProg(lv, vs.length);
    const n = vs[lv], words = QD.verses[n], L = genBeam(words); if (!L) continue;
    const rot = new Map();
    for (const [k, ty] of L.mir) rot.set(k, Math.random() < .5 ? ty : (ty === '/' ? '\\' : '/'));
    if ([...L.mir].every(([k, ty]) => rot.get(k) === ty)) { const k0 = [...L.mir.keys()][0]; rot.set(k0, rot.get(k0) === '/' ? '\\' : '/'); }
    const free = shuffle([...Array(L.N * L.N).keys()].filter(k => !L.path.includes(k))).slice(0, 2);
    free.forEach(k => rot.set(k, Math.random() < .5 ? '/' : '\\'));
    html(Run.body, `${stepHead('شعاع الضحى', `الآية ${ARN(n)} · دوّر المرايا ليقرأ الضوءُ كلماتِ الآية بالترتيب`)}
      <div class="beam"><span class="bsun" style="top:${((L.r0 + .5) / L.N * 100).toFixed(2)}%">${ic('sun')}</span>
        <div class="bgrid" style="grid-template-columns:repeat(${L.N},1fr)">${[...Array(L.N * L.N).keys()].map(k => {
          const wi = L.wc.indexOf(k);
          return rot.has(k) ? `<button class="bc mir" data-k="${k}"><i></i></button>` : wi >= 0 ? `<div class="bc wd" data-k="${k}"><span class="qt">${qw(n, wi)}</span></div>` : `<div class="bc"></div>`;
        }).join('')}</div><svg class="bray" viewBox="0 0 ${L.N} ${L.N}" preserveAspectRatio="none"><polyline id="bRay" points=""/></svg></div>
      <div class="feedback" id="bFb"></div><button class="btn btn-line btn-wide" id="bSkip">تخطَّ</button>`);
    const draw = () => {
      $$('.bc.mir', Run.body).forEach(b => b.classList.toggle('bk', rot.get(+b.dataset.k) === '\\'));
      const { vis, exit } = traceBeam(L, rot);
      const pts = [[L.N, L.r0 + .5], ...vis.map(k => [k % L.N + .5, Math.floor(k / L.N) + .5])];
      const last = vis[vis.length - 1]; if (last != null) pts.push([(last % L.N + .5) + (exit[1] - last % L.N) * .5, (Math.floor(last / L.N) + .5) + (exit[0] - Math.floor(last / L.N)) * .5]);
      $('#bRay').setAttribute('points', pts.map(p => p.join(',')).join(' '));
      const lit = vis.filter(k => L.wc.includes(k)).map(k => L.wc.indexOf(k));
      $$('.bc.wd', Run.body).forEach(el => el.classList.toggle('lit', vis.includes(+el.dataset.k)));
      return lit.length === L.wc.length && lit.every((v, i) => v === i);
    };
    draw();
    const ok = await pend(res => {
      $('.bgrid', Run.body).onclick = e => {
        const b = e.target.closest('.mir'); if (!b) return; const k = +b.dataset.k;
        rot.set(k, rot.get(k) === '/' ? '\\' : '/'); Sfx.tap(); buzz(8);
        if (draw()) { $('.bgrid', Run.body).onclick = null; hit(); $('#bFb').className = 'feedback good'; $('#bFb').textContent = 'أشرق الضوء على الآية!'; playSeq([n]); setTimeout(() => res(true), 2600); }
      };
      $('#bSkip').onclick = () => res(false);
    });
    stopAll(); if (ok) solved++;
  }
  S.best.beam = Math.max(S.best.beam || 0, solved); save(); gain(25);
  await celebrate({ title: `أنرتَ ${ARN(solved)} من ٣`, sub: 'شعاع الضحى', stars: solved === 3 ? 3 : solved === 2 ? 2 : 1, gemReward: false, again: again('beam') });
}

/* ---------- 2. النجمة الثمانية: rotate the pieces of a real scene until the star closes ---------- */
const STAR_SVG = `<svg viewBox="0 0 300 300" class="starpat"><g fill="none" stroke="#ffd27a" stroke-width="3" stroke-linejoin="round">
  <rect x="62" y="62" width="176" height="176"/><rect x="62" y="62" width="176" height="176" transform="rotate(45 150 150)"/>
  <circle cx="150" cy="150" r="54"/><circle cx="150" cy="150" r="124" stroke-dasharray="6 7" opacity=".7"/>
  <path d="M150 0v26M150 274v26M0 150h26M274 150h26M0 0l40 40M300 0l-40 40M0 300l40-40M300 300l-40-40" opacity=".8"/></g></svg>`;
async function gameStar() {
  const vs = shuffle(verseRange(1, NV).filter(n => hasScene('v' + n))).slice(0, 3); let solved = 0;
  for (let lv = 0; lv < vs.length; lv++) {
    setProg(lv, vs.length);
    const n = vs[lv], rot = [...Array(9)].map(() => [90, 180, 270][rnd(3)]);
    html(Run.body, `${stepHead('النجمة الثمانية', 'المس القطع لتدور حتى تكتمل الصورة والنجمة')}
      <div class="star9">${rot.map((r, i) => `<button class="s9" data-i="${i}" style="--r:${r}deg"><span class="s9in" style="background-image:url('${posterUrl('v' + n)}');background-position:${(i % 3) * 50}% ${Math.floor(i / 3) * 50}%">${STAR_SVG.replace('viewBox="0 0 300 300"', `viewBox="${(i % 3) * 100} ${Math.floor(i / 3) * 100} 100 100"`)}</span></button>`).join('')}</div>
      <div id="sRes"></div><button class="btn btn-line btn-wide" id="sSkip">تخطَّ</button>`);
    const ok = await pend(res => {
      $('.star9', Run.body).onclick = e => {
        const b = e.target.closest('.s9'); if (!b) return; const i = +b.dataset.i;
        rot[i] += 90; b.style.setProperty('--r', rot[i] + 'deg'); Sfx.tap();
        if (rot.every(r => r % 360 === 0)) {
          $('.star9', Run.body).onclick = null; $('.star9', Run.body).classList.add('done'); hit();
          $('#sRes').innerHTML = `<div class="panel reveal">${vText(n)}</div>`; playSeq([n]); setTimeout(() => res(true), 3200);
        }
      };
      $('#sSkip').onclick = () => res(false);
    });
    stopAll(); if (ok) solved++;
  }
  gain(25); await celebrate({ title: `${ARN(solved)} نجوم اكتملت`, sub: 'النجمة الثمانية', stars: Math.max(1, solved), gemReward: false, again: again('star') });
}

/* ---------- 3. أحجية المشهد: a sliding puzzle of the verse's real scene ---------- */
async function gameSlide() {
  const n = pick(verseRange(1, NV).filter(n => hasScene('v' + n)));
  let tiles = [...Array(9).keys()], empty = 8, moves = 0;
  const nb = e => [e - 3, e + 3, e % 3 ? e - 1 : -1, e % 3 < 2 ? e + 1 : -1].filter(x => x >= 0 && x < 9);
  for (let s = 0; s < 80; s++) { const o = pick(nb(empty)); [tiles[empty], tiles[o]] = [tiles[o], tiles[empty]]; empty = o; }
  html(Run.body, `${stepHead('أحجية المشهد', `الآية ${ARN(n)} · حرّك القطع لتعيد المشهد الحقيقي`)}<div class="slide" id="slide"></div><div id="slRes"></div><button class="btn btn-line btn-wide" id="slSkip">تخطَّ</button>`);
  const draw = () => { $('#slide').innerHTML = tiles.map((t, i) => t === 8 ? `<span class="sl empty"></span>` : `<button class="sl" data-i="${i}" style="background-image:url('${posterUrl('v' + n)}');background-position:${(t % 3) * 50}% ${Math.floor(t / 3) * 50}%"></button>`).join(''); };
  draw(); setProg(0, 1);
  const ok = await pend(res => {
    $('#slide').onclick = e => {
      const b = e.target.closest('.sl:not(.empty)'); if (!b) return; const i = +b.dataset.i;
      if (!nb(empty).includes(i)) { Sfx.bad(); return; }
      [tiles[empty], tiles[i]] = [tiles[i], tiles[empty]]; empty = i; moves++; Sfx.tap(); draw();
      if (tiles.every((t, k) => t === k)) { $('#slide').onclick = null; $('#slide').classList.add('done'); hit(); $('#slRes').innerHTML = `<div class="panel reveal">${vText(n)}</div>`; playSeq([n]); setTimeout(() => res(true), 3000); }
    };
    $('#slSkip').onclick = () => res(false);
  });
  stopAll(); gain(ok ? 30 : 5);
  if (ok && (S.best.slide == null || moves < S.best.slide)) { S.best.slide = moves; save(); }
  await celebrate({ title: ok ? `اكتمل المشهد في ${ARN(moves)} نقلة` : 'جرّب مشهدًا آخر', sub: 'أحجية المشهد', stars: ok ? (moves < 40 ? 3 : moves < 80 ? 2 : 1) : 1, gemReward: false, again: again('slide') });
}

/* ---------- 4. خلية النحل: connect the verse's words through neighbouring cells ---------- */
function hexNb(r, c, R, C) {
  const d = r % 2 ? [[0, -1], [0, 1], [-1, 0], [-1, 1], [1, 0], [1, 1]] : [[0, -1], [0, 1], [-1, -1], [-1, 0], [1, -1], [1, 0]];
  return d.map(([a, b]) => [r + a, c + b]).filter(([a, b]) => a >= 0 && a < R && b >= 0 && b < C);
}
async function gameHive() {
  const vs = shuffle(verseRange(2, NV)).slice(0, 3); let good = 0;
  for (let lv = 0; lv < vs.length; lv++) {
    setProg(lv, vs.length);
    const n = vs[lv], words = QD.verses[n], R = 5, C = 4;
    let path = null;
    for (let t = 0; t < 300 && !path; t++) {
      let r = rnd(R), c = rnd(C); const p = [[r, c]], seen = new Set([r * C + c]);
      while (p.length < words.length) { const opts = hexNb(r, c, R, C).filter(([a, b]) => !seen.has(a * C + b)); if (!opts.length) break; [r, c] = pick(opts); seen.add(r * C + c); p.push([r, c]); }
      if (p.length === words.length) path = p;
    }
    const cells = [...Array(R * C)].map(() => null);
    path.forEach(([r, c], i) => cells[r * C + c] = { w: words[i], i });
    const fill = distractors(words[0], R * C, false);
    let fi = 0; for (let k = 0; k < cells.length; k++) if (!cells[k]) cells[k] = { w: fill[fi++ % fill.length], i: -1 };
    html(Run.body, `${stepHead('خلية النحل', `الآية ${ARN(n)} · صِل كلماتها بالترتيب عبر الخلايا المتجاورة`)}
      <div class="hive">${[...Array(R).keys()].map(r => `<div class="hrow ${r % 2 ? 'odd' : ''}">${[...Array(C).keys()].map(c => { const x = cells[r * C + c]; return `<button class="hex" data-r="${r}" data-c="${c}"><span class="qt">${esc(x.w)}</span></button>`; }).join('')}</div>`).join('')}</div>
      <div class="feedback" id="hvFb"></div>`);
    let step = 0, last = null, errs = 0;
    const ok = await pend(res => {
      $('.hive', Run.body).onclick = e => {
        const b = e.target.closest('.hex'); if (!b) return; const r = +b.dataset.r, c = +b.dataset.c, x = cells[r * C + c];
        const adj = !last || hexNb(last[0], last[1], R, C).some(([a, bb]) => a === r && bb === c);
        if (x.i === step && adj) {
          b.classList.add('on'); last = [r, c]; step++; Sfx.ok(); playWord(n, x.i);
          if (step === words.length) { $('.hive', Run.body).onclick = null; hit(); $('#hvFb').className = 'feedback good'; $('#hvFb').innerHTML = vText(n); setTimeout(() => { playSeq([n]); setTimeout(() => res(errs < 3), 2400); }, 900); }
        } else { errs++; miss(); b.animate([{ transform: 'scale(1)' }, { transform: 'scale(.9)' }, { transform: 'scale(1)' }], { duration: 220 }); $('#hvFb').className = 'feedback bad'; $('#hvFb').textContent = adj ? 'ليست الكلمة التالية' : 'اختر خلية ملاصقة'; }
      };
    });
    stopAll(); if (ok) good++;
  }
  gain(25); S.best.hive = Math.max(S.best.hive || 0, good); save();
  await celebrate({ title: `${ARN(good)} من ٣ بلا أخطاء كثيرة`, sub: 'خلية النحل', stars: good === 3 ? 3 : good ? 2 : 1, gemReward: false, again: again('hive') });
}

/* ---------- 5. هندسة السورة: connect each favour to its command ---------- */
async function gameGeo() {
  setProg(0, 1);
  const L = shuffle([6, 7, 8]), Rr = shuffle([9, 10, 11]), pair = { 6: 9, 7: 10, 8: 11 };
  html(Run.body, `${stepHead('هندسة السورة', 'صِل كل نعمة بالوصية التي تقابلها')}
    <div class="geo"><div class="gcol" id="gL">${L.map(n => `<button class="gv" data-n="${n}"><span class="qt">${verseHTML(n, { marker: false })}</span></button>`).join('')}</div>
    <svg class="glines" id="gLines"></svg>
    <div class="gcol" id="gR">${Rr.map(n => `<button class="gv" data-n="${n}"><span class="qt">${verseHTML(n, { marker: false })}</span></button>`).join('')}</div></div>
    <div class="feedback" id="gFb"></div>`);
  let sel = null, done = 0, errs = 0;
  const line = (a, b) => {
    const box = $('.geo', Run.body).getBoundingClientRect(), A = a.getBoundingClientRect(), B = b.getBoundingClientRect();
    const x1 = (A.left + A.right) / 2 - box.left, y1 = (A.top + A.bottom) / 2 - box.top, x2 = (B.left + B.right) / 2 - box.left, y2 = (B.top + B.bottom) / 2 - box.top;
    $('#gLines').insertAdjacentHTML('beforeend', `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`);
  };
  await pend(res => {
    $('.geo', Run.body).onclick = e => {
      const b = e.target.closest('.gv'); if (!b || b.classList.contains('ok')) return; const n = +b.dataset.n;
      if (n <= 8) { $$('#gL .gv').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); sel = b; Sfx.tap(); return; }
      if (!sel) { $('#gFb').textContent = 'ابدأ بنعمة من العمود الأول'; return; }
      if (pair[+sel.dataset.n] === n) { sel.classList.add('ok'); b.classList.add('ok'); line(sel, b); hit(); done++; sel.classList.remove('sel'); sel = null; if (done === 3) { $('#gFb').className = 'feedback good'; $('#gFb').innerHTML = 'كما أنعم عليك… أحسِن أنت. هكذا قابل ابن كثير كل نعمة بوصية.'; setTimeout(() => res(true), 2200); } }
      else { errs++; miss(); b.animate([{ transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'none' }], { duration: 220 }); }
    };
  });
  html(Run.body, `${stepHead('هندسة السورة', 'أربعة أجزاء: ٢ ثم ٣ ثم ٣ ثم ٣')}<div class="struct2">${STRUCTURE.map(s => `<div class="sb2"><b>${s.name}</b><span>${ARN(s.r[0])}–${ARN(s.r[1])}</span><small>${s.d}</small></div>`).join('')}</div><button class="btn btn-sun btn-wide" id="gDone">تابع</button>`);
  await until($('#gDone'));
  gain(errs ? 15 : 30); await celebrate({ title: errs ? 'أتممت المرآة' : 'مرآة بلا خطأ!', sub: 'هندسة السورة', stars: errs ? (errs < 3 ? 2 : 1) : 3, gemReward: true, again: again('geo') });
}

/* ---------- 6. الليل يزحف (and the big challenge): pick each next word before darkness covers the surah ---------- */
async function gameNight(hard) {
  const seq = surahWords(); let dark = 8, i = 0, good = 0, alive = true, last = performance.now();
  html(Run.body, `${stepHead(hard ? 'التحدي الأكبر' : 'الليل يزحف', hard ? 'السورة كلها، أربعة خيارات، والليل أسرع' : 'اختر الكلمة التالية… كل إجابة صحيحة تعيد الفجر')}
    <div class="nightbox"><div class="ntext qt night" id="nText"></div><div class="ndark" id="nDark"></div></div>
    <div class="opts two" id="nOpts"></div><div class="feedback" id="nFb"></div>`);
  const opts = () => {
    const x = seq[i], ds = distractors(x.w, hard ? 3 : 2, true), o = shuffle([x.w, ...ds]);
    $('#nOpts').innerHTML = o.map(w => `<button class="opt qt night" data-w="${esc(w)}">${esc(w)}</button>`).join('');
    $('#nText').innerHTML = seq.slice(Math.max(0, i - 8), i).map(y => `<span class="w">${qw(y.n, y.i)}</span>`).join(' ') + ' <span class="w slot">؟</span>';
    setProg(i, seq.length);
  };
  opts();
  const loop = () => {
    if (!alive || !Run.el) return;
    const now = performance.now(); dark += (now - last) / 1000 * (hard ? 3.4 : 2.2); last = now;
    $('#nDark').style.width = clamp(dark / 100) * 100 + '%';
    if (dark >= 100) { alive = false; return; }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  await pend(res => {
    const iv = setInterval(() => { if (!Run.el) { clearInterval(iv); return; } if (!alive) { clearInterval(iv); res(false); } }, 120);
    $('#nOpts').onclick = e => {
      const b = e.target.closest('.opt'); if (!b || !alive) return;
      if (b.dataset.w === seq[i].w) { good++; dark = Math.max(0, dark - (hard ? 9 : 12)); Sfx.tap(); i++; if (i >= seq.length) { alive = false; clearInterval(iv); res(true); return; } opts(); }
      else { dark += 10; miss(); b.classList.add('wrong'); }
    };
  }).then(win => {
    S.best[hard ? 'big' : 'night'] = Math.max(S.best[hard ? 'big' : 'night'] || 0, i); save(); gain(Math.round(i * (hard ? 1.6 : 1)));
    return celebrate({ title: win ? 'طلع الفجر على السورة كلها!' : `وصلتَ إلى الكلمة ${ARN(i)} من ٤٠`, sub: win ? `${ARN(good)} كلمة صحيحة` : 'غطّى الليل الآيات… أعد المحاولة لتبعد العتمة أكثر', stars: win ? 3 : i > 25 ? 2 : 1, gemReward: win, again: again(hard ? 'big' : 'night') });
  });
}

/* ---------- 7. سر الواوات: the rhythm of the verses' first letters ---------- */
async function gameWaw() {
  const first = verseRange(1, NV).map(n => bareLetter(QD.verses[n][0]));
  let i = 0, errs = 0; const t0 = performance.now();
  html(Run.body, `${stepHead('سر الواوات', 'اضغط الحرف الأول لكل آية بالترتيب، من الأولى إلى الحادية عشرة')}
    <div class="wawrow" id="wRow">${first.map((_, k) => `<span class="wl" data-k="${k}">${ARN(k + 1)}</span>`).join('')}</div>
    <div class="wawpad">${['و', 'م', 'أ', 'ف'].map(l => `<button class="wk" data-l="${l}">${l}</button>`).join('')}</div><div class="feedback" id="wFb"></div>`);
  setProg(0, 11);
  await pend(res => {
    $('.wawpad', Run.body).onclick = e => {
      const b = e.target.closest('.wk'); if (!b) return;
      const want = first[i] === 'ا' ? 'أ' : first[i];
      if (b.dataset.l === want) {
        const el = $(`.wl[data-k="${i}"]`, Run.body); el.textContent = want; el.classList.add('ok'); if ((i + 1) % 3 === 0) el.classList.add('beat');
        Sfx.tone(want === 'و' ? 520 : 780, .12, 'triangle', .05); buzz(10); i++; setProg(i, 11);
        if (i === 11) { $('.wawpad', Run.body).onclick = null; res(true); }
      } else { errs++; miss(); }
    };
  });
  const secs = (performance.now() - t0) / 1000;
  html(Run.body, `${stepHead('سر الواوات', 'هذا هو النمط')}
    <div class="wawreveal"><span>و و <b>م</b></span><span>و و <b>أ</b></span><span>و و <b>ف</b></span><span>و و</span></div>
    <div class="panel"><p class="big" style="text-align:center">كل واوين يأتي بعدهما حرفٌ جديد: م، ثم أ، ثم ف.</p><p class="muted" style="text-align:center">احفظ «م أ ف» فلن تتلخبط في ترتيب الآيات أبدًا.</p></div>
    <button class="btn btn-sun btn-wide" id="wDone">تابع</button>`);
  await until($('#wDone'));
  if (S.best.waw == null || secs < S.best.waw) { S.best.waw = Math.round(secs); save(); }
  gain(errs ? 15 : 30);
  await celebrate({ title: `${fmtTime(secs)}`, sub: `سر الواوات · الأخطاء: ${ARN(errs)}`, stars: errs === 0 ? 3 : errs < 3 ? 2 : 1, gemReward: false, again: again('waw') });
}

/* ---------- 8. مين القارئ؟: guess the reciter (and hear the surah again and again) ---------- */
async function gameWho() {
  const pool = RECITERS.filter(r => r.style === 'مرتّل' && QD.timing[r.id]);
  let good = 0; const R = 6;
  for (let k = 0; k < R; k++) {
    setProg(k, R);
    const r = pick(pool), n = 1 + rnd(NV), names = shuffle([r, ...shuffle(pool.filter(x => x.name !== r.name)).slice(0, 2)]);
    html(Run.body, `${stepHead('مين القارئ؟', `${ARN(k + 1)} من ${ARN(R)} · استمع ثم اختر`)}
      <div class="panel" style="display:grid;gap:12px;justify-items:center"><div class="whoav">${ic('headphones')}</div>${vText(n)}<button class="btn btn-line" id="wPlay">${ic('repeat')} أعد الاستماع</button></div>
      <div class="opts" id="wOpts">${names.map(x => `<button class="opt ui" data-id="${x.id}">${esc(x.name)}</button>`).join('')}</div><div class="feedback" id="wwFb"></div>`);
    const play = () => playSeq([n], { rid: r.id }); play(); $('#wPlay').onclick = play;
    const ok = await pend(res => {
      $('#wOpts').onclick = e => {
        const b = e.target.closest('.opt'); if (!b) return; $('#wOpts').onclick = null;
        const right = b.dataset.id === r.id; $(`.opt[data-id="${r.id}"]`, Run.body).classList.add('right');
        if (right) { hit(); $('#wwFb').className = 'feedback good'; $('#wwFb').textContent = `${r.name}: ${r.note}`; } else { b.classList.add('wrong'); miss(); $('#wwFb').className = 'feedback bad'; $('#wwFb').textContent = `إنه ${r.name}`; }
        setTimeout(() => res(right), 1700);
      };
    });
    stopAll(); if (ok) good++;
  }
  S.best.who = Math.max(S.best.who || 0, good); save(); gain(20);
  await celebrate({ title: `${ARN(good)} من ${ARN(R)}`, sub: 'مين القارئ؟ · وسمعت السورة بأصوات كثيرة', stars: good >= 5 ? 3 : good >= 3 ? 2 : 1, gemReward: false, again: again('who') });
}

/* ---------- 9. اكتبها بإصبعك: trace the words in naskh ---------- */
async function gameTrace() {
  const n = 2 + rnd(NV - 1), ws = QD.verses[n].slice(0, 4); let passed = 0;
  for (let k = 0; k < ws.length; k++) {
    setProg(k, ws.length);
    html(Run.body, `${stepHead('اكتبها بإصبعك', `الآية ${ARN(n)} · تتبّع الكلمة ${ARN(k + 1)} من ${ARN(ws.length)}`)}
      <div class="tracebox"><canvas id="tC" width="680" height="380"></canvas></div>
      <div class="row" style="justify-content:center;gap:10px"><button class="btn btn-line" id="tClr">${ic('repeat')} امسح</button><button class="btn btn-sun" id="tChk">تحقّق</button></div><div class="feedback" id="tFb"></div>`);
    const cv = $('#tC'), g = cv.getContext('2d'), W = cv.width, H = cv.height;
    const mask = document.createElement('canvas'); mask.width = W; mask.height = H; const mg = mask.getContext('2d');
    const font = `${Math.min(220, Math.floor(1500 / Math.max(3, ws[k].length)))}px 'Scheherazade New', serif`;
    [mg, g].forEach(c => { c.font = font; c.textAlign = 'center'; c.textBaseline = 'middle'; c.direction = 'rtl'; });
    mg.fillStyle = '#fff'; mg.fillText(ws[k], W / 2, H / 2 + 10);
    const base = () => { g.clearRect(0, 0, W, H); g.fillStyle = 'rgba(255,220,150,.22)'; g.fillText(ws[k], W / 2, H / 2 + 10); };
    base();
    const ink = document.createElement('canvas'); ink.width = W; ink.height = H; const ig = ink.getContext('2d');
    ig.lineCap = 'round'; ig.lineJoin = 'round'; ig.lineWidth = 34; ig.strokeStyle = '#000';
    let drawing = false, lx = 0, ly = 0;
    const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height]; };
    cv.onpointerdown = e => { drawing = true; cv.setPointerCapture(e.pointerId); [lx, ly] = pos(e); };
    cv.onpointermove = e => {
      if (!drawing) return; const [x, y] = pos(e);
      ig.beginPath(); ig.moveTo(lx, ly); ig.lineTo(x, y); ig.stroke();
      g.save(); g.lineCap = 'round'; g.lineWidth = 16; g.strokeStyle = '#ffd27a'; g.shadowColor = '#f7b844'; g.shadowBlur = 12; g.beginPath(); g.moveTo(lx, ly); g.lineTo(x, y); g.stroke(); g.restore();
      lx = x; ly = y;
    };
    cv.onpointerup = () => drawing = false;
    $('#tClr').onclick = () => { ig.clearRect(0, 0, W, H); base(); };
    const ok = await pend(res => {
      $('#tChk').onclick = () => {
        const m = mg.getImageData(0, 0, W, H).data, d = ig.getImageData(0, 0, W, H).data;
        let gl = 0, cov = 0, inkN = 0, inkIn = 0;
        for (let p = 3; p < m.length; p += 16) { const a = m[p] > 100, b = d[p] > 100; if (a) { gl++; if (b) cov++; } if (b) { inkN++; if (a) inkIn++; } }
        const c = gl ? cov / gl : 0, prec = inkN ? inkIn / inkN : 0;
        if (c >= .5 && prec >= .3) { hit(); $('#tFb').className = 'feedback good'; $('#tFb').textContent = `أحسنت! التغطية ${ARN(Math.round(c * 100))}٪`; playWord(n, k); setTimeout(() => res(true), 1300); }
        else { miss(); $('#tFb').className = 'feedback bad'; $('#tFb').textContent = c < .5 ? 'تتبّع الحروف كلها بإصبعك' : 'ابقَ على خطوط الكلمة'; }
      };
    });
    if (ok) passed++;
  }
  gain(25); await celebrate({ title: `كتبتَ ${ARN(passed)} كلمات`, sub: `الآية ${ARN(n)}`, stars: passed >= ws.length ? 3 : 2, gemReward: false, again: again('trace') });
}

/* ---------- 10. خمّن قبل ما تسمع: guess, then hear (wrong guesses still help memory) ---------- */
async function gameGuess() {
  const vs = shuffle(verseRange(3, NV)).slice(0, 2); let tot = 0, good = 0;
  for (const n of vs) {
    const ws = QD.verses[n];
    for (let i = 1; i < ws.length; i++) {
      tot++; setProg(tot, vs.reduce((a, x) => a + QD.verses[x].length - 1, 0));
      const o = shuffle([ws[i], ...distractors(ws[i], 2, true)]);
      html(Run.body, `${stepHead('خمّن قبل ما تسمع', 'الأبحاث تقول: التخمين قبل الجواب يثبّت الحفظ حتى لو أخطأت')}
        <div class="panel"><div class="qt night qbig">${ws.slice(0, i).map((_, k) => `<span class="w">${qw(n, k)}</span>`).join(' ')} <span class="w slot">؟</span></div></div>
        <div class="opts two" id="gOpts">${o.map(w => `<button class="opt qt night" data-w="${esc(w)}">${esc(w)}</button>`).join('')}</div><div class="feedback" id="gFb"></div>`);
      await pend(res => {
        $('#gOpts').onclick = e => {
          const b = e.target.closest('.opt'); if (!b) return; $('#gOpts').onclick = null;
          const right = b.dataset.w === ws[i]; $$('.opt', Run.body).forEach(x => { if (x.dataset.w === ws[i]) x.classList.add('right'); });
          if (right) { good++; hit(); } else { b.classList.add('wrong'); Sfx.tap(); $('#gFb').className = 'feedback'; $('#gFb').textContent = 'لا بأس، الآن ستتذكرها أكثر.'; }
          playWord(n, i); setTimeout(() => res(), 1500);
        };
      });
    }
    stopAll(); playSeq([n]); await sleep(300);
  }
  gain(20); await celebrate({ title: `${ARN(good)} من ${ARN(tot)}`, sub: 'خمّن قبل ما تسمع', stars: good / tot > .8 ? 3 : good / tot > .5 ? 2 : 1, gemReward: false, again: again('guess') });
}

/* ---------- 11. السينما الصامتة: only the real scene… you recite ---------- */
async function gameSilent() {
  const vs = shuffle(verseRange(1, NV).filter(n => hasScene('v' + n))).slice(0, 5); let good = 0;
  for (let k = 0; k < vs.length; k++) {
    setProg(k, vs.length); const n = vs[k];
    html(Run.body, `${stepHead('السينما الصامتة', 'لا نص ولا صوت. أيّ آية هذا مشهدها؟ سمّعها في سرّك ثم تحقّق')}
      <div class="uscene tall"><div class="cmedia" id="slScene"></div></div><div id="slV"></div>
      <button class="btn btn-sun btn-wide" id="slShow">${ic('eye')} أظهر الآية</button>`);
    const sc = RealScene($('#slScene'), { scene: 'v' + n, reduce: reduceMotion() }); sc.start();
    await until($('#slShow'));
    $('#slV').innerHTML = `<div class="panel reveal">${vText(n)}</div><div class="row" style="justify-content:center;gap:10px"><button class="btn btn-good" id="slY">سمّعتها صحيحة</button><button class="btn btn-line" id="slN">أحتاج مراجعة</button></div>`;
    $('#slShow').remove(); playSeq([n]);
    const y = await pend(res => { $('#slY').onclick = () => res(true); $('#slN').onclick = () => res(false); });
    sc.stop(); stopAll(); if (y) { good++; hit(); } else Sfx.tap();
  }
  gain(20); await celebrate({ title: `${ARN(good)} من ${ARN(vs.length)}`, sub: 'السينما الصامتة', stars: good >= 5 ? 3 : good >= 3 ? 2 : 1, gemReward: false, again: again('silent') });
}

/* ---------- 12. مستوى الحفّاظ: what comes before? ---------- */
async function gameHafiz() {
  const qs = shuffle(verseRange(2, NV)).slice(0, 6); let good = 0;
  for (let k = 0; k < qs.length; k++) {
    const n = qs[k], right = n - 1, o = shuffle([right, ...shuffle(verseRange(1, NV).filter(x => x !== right && x !== n)).slice(0, 2)]);
    if (await mcq({ head: stepHead('شو قبلها؟', `${ARN(k + 1)} من ${ARN(qs.length)} · مستوى الحفّاظ`), prompt: `<div class="panel"><span class="eyebrow">ما الآية التي قبل:</span>${vText(n)}</div>`, opts: o.map(x => verseHTML(x, { marker: false })), ok: o.indexOf(right) })) good++;
  }
  html(Run.body, `${stepHead('من الآخر إلى الأول', 'سمّع السورة من الآية ١١ إلى ١، ثم اكشف لتتحقق')}<div class="revlist">${verseRange(1, NV).reverse().map(n => `<button class="rv" data-n="${n}"><span>${ARN(n)}</span><span class="qt hid">${verseHTML(n, { marker: false })}</span></button>`).join('')}</div><button class="btn btn-sun btn-wide" id="hDone">تم</button>`);
  $('.revlist', Run.body).onclick = e => { const b = e.target.closest('.rv'); if (b) { b.querySelector('.qt').classList.remove('hid'); Sfx.tap(); } };
  await until($('#hDone'));
  gain(25); await celebrate({ title: `${ARN(good)} من ٦`, sub: 'مستوى الحفّاظ', stars: good >= 6 ? 3 : good >= 4 ? 2 : 1, gemReward: true, again: again('hafiz') });
}

/* ---------- art: your own 8-fold rosette, grown by what you memorized ---------- */
function rosette(cv, layers, seed) {
  const g = cv.getContext('2d'), W = cv.width, C = W / 2;
  let s = seed >>> 0; const rr = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  g.fillStyle = '#080c1d'; g.fillRect(0, 0, W, W);
  const pal = ['#ffd27a', '#f7b844', '#ff8fa3', '#7cc8ff', '#6aa8ff', '#ff8a4c', '#ffdc96', '#b8ccff', '#ffd0da', '#a8e6cf', '#ffe6a8', '#f6efdd'];
  g.translate(C, C); g.lineJoin = 'round'; g.lineCap = 'round';
  for (let L = 0; L <= layers; L++) {
    const R = W * (.08 + .036 * L), k = 8 * (1 + (L % 3 === 2 ? 1 : 0)), col = pal[L % pal.length], w = 1.2 + rr() * 2.2, tw = rr() * .5 + .2;
    g.strokeStyle = col; g.globalAlpha = .9 - L * .03; g.lineWidth = w;
    g.beginPath();
    for (let i = 0; i <= k * 2; i++) { const a = i / (k * 2) * Math.PI * 2, rad = i % 2 ? R * (1 - tw * .5) : R; const x = Math.cos(a) * rad, y = Math.sin(a) * rad; i ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.closePath(); g.stroke();
    if (L % 2 === 1) { for (let i = 0; i < 8; i++) { g.save(); g.rotate(i * Math.PI / 4 + rr() * .02); g.beginPath(); g.arc(R * .9, 0, R * .12, 0, Math.PI * 2); g.stroke(); g.restore(); } }
  }
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
}
function memVerses() { const m = new Set(); [1, 2, 3, 4].forEach(id => { if (stDone(id)) STATIONS[id - 1].verses.forEach(v => m.add(v)); }); return m.size; }
async function gameArt() {
  setProg(0, 1);
  const L = memVerses();
  html(Run.body, `${stepHead('زخرفتك الخاصة', `كل آية تحفظها تضيف طبقة. لديك ${ARN(L)} من ١١`)}
    <div class="artbox"><canvas id="artC" width="720" height="720"></canvas></div>
    <p class="dim" style="text-align:center">هذه اللوحة لا تتكرر: مبنية على رحلتك أنت.</p>
    <button class="btn btn-sun btn-wide" id="artSave">${ic('share')} احفظ اللوحة</button><button class="btn btn-line btn-wide" id="artDone">تم</button>`);
  const cv = $('#artC'); rosette(cv, L + 2, (S.created || 7) % 1e9);
  $('#artSave').onclick = () => saveImage(cv, 'zakhrafati.png');
  await until($('#artDone')); closeRunner();
}

/* ---------- art: a kaleidoscope while the surah plays softly ---------- */
async function gameKaleido() {
  setProg(0, 1);
  html(Run.body, `${stepHead('مرآة الزخرفة', 'ارسم بإصبعك؛ يتكرّر رسمك ثماني مرات، والسورة تُتلى')}
    <div class="artbox"><canvas id="kC" width="720" height="720"></canvas></div>
    <div class="row" style="justify-content:center;gap:10px"><button class="btn btn-line" id="kClr">${ic('repeat')} امسح</button><button class="btn btn-line" id="kSave">${ic('share')} احفظ</button><button class="btn btn-sun" id="kDone">تم</button></div>`);
  const cv = $('#kC'), g = cv.getContext('2d'), W = cv.width, C = W / 2;
  g.fillStyle = '#080c1d'; g.fillRect(0, 0, W, W);
  const cols = ['#ffd27a', '#ff8fa3', '#7cc8ff', '#ffdc96']; let hue = 0, drawing = false, last = null;
  const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width - C, (e.clientY - r.top) * W / r.height - C]; };
  const seg = (a, b) => {
    g.lineWidth = 4; g.lineCap = 'round'; g.strokeStyle = cols[hue % cols.length]; g.shadowColor = g.strokeStyle; g.shadowBlur = 8;
    for (let i = 0; i < 8; i++) for (const m of [1, -1]) { g.save(); g.translate(C, C); g.rotate(i * Math.PI / 4); g.scale(1, m); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); g.restore(); }
  };
  cv.onpointerdown = e => { drawing = true; cv.setPointerCapture(e.pointerId); last = pos(e); hue++; };
  cv.onpointermove = e => { if (!drawing) return; const p = pos(e); seg(last, p); last = p; };
  cv.onpointerup = () => drawing = false;
  $('#kClr').onclick = () => { g.fillStyle = '#080c1d'; g.fillRect(0, 0, W, W); };
  $('#kSave').onclick = () => saveImage(cv, 'mirat-al-duha.png');
  playSeq(verseRange(1, NV), { loop: true, gap: 900 });
  await until($('#kDone')); stopAll(); gain(10); closeRunner();
}

Object.assign(GAME_FNS, {
  beam: gameBeam, star: gameStar, slide: gameSlide, hive: gameHive, geo: gameGeo,
  night: () => gameNight(false), big: () => gameNight(true), waw: gameWaw, who: gameWho, trace: gameTrace,
  guess: gameGuess, silent: gameSilent, hafiz: gameHafiz, art: gameArt, kaleido: gameKaleido,
});
const GAMES_GEO = [
  { id: 'beam', name: 'شعاع الضحى', d: 'دوّر المرايا ليقرأ الضوء الآية', ic: 'sun', best: () => S.best.beam != null ? ARN(S.best.beam) + '/٣' : null },
  { id: 'star', name: 'النجمة الثمانية', d: 'أكمل النجمة والمشهد الحقيقي', ic: 'name', best: () => null },
  { id: 'slide', name: 'أحجية المشهد', d: 'أعد صورة الآية الحقيقية', ic: 'film', best: () => S.best.slide != null ? ARN(S.best.slide) + ' نقلة' : null },
  { id: 'hive', name: 'خلية النحل', d: 'صِل الكلمات عبر الخلايا', ic: 'combo', best: () => S.best.hive },
  { id: 'geo', name: 'هندسة السورة', d: 'صِل كل نعمة بوصيتها', ic: 'twins', best: () => null },
];
const GAMES_NEW = [
  { id: 'night', name: 'الليل يزحف', d: 'أبعِد العتمة بالكلمة الصحيحة', ic: 'moon', best: () => S.best.night != null ? ARN(S.best.night) + '/٤٠' : null },
  { id: 'big', name: 'التحدي الأكبر', d: 'السورة كلها، والليل أسرع', ic: 'crown', best: () => S.best.big != null ? ARN(S.best.big) + '/٤٠' : null },
  { id: 'waw', name: 'سر الواوات', d: 'إيقاع أوائل الآيات: م أ ف', ic: 'text', best: () => S.best.waw != null ? fmtTime(S.best.waw) : null },
  { id: 'who', name: 'مين القارئ؟', d: 'خمّن الصوت… واسمع السورة كثيرًا', ic: 'headphones', best: () => S.best.who },
  { id: 'trace', name: 'اكتبها بإصبعك', d: 'تتبّع الكلمات بخط النسخ', ic: 'quill', best: () => null },
  { id: 'guess', name: 'خمّن قبل ما تسمع', d: 'التخمين يثبّت الحفظ', ic: 'spark', best: () => null },
  { id: 'silent', name: 'السينما الصامتة', d: 'المشهد وحده… وأنت تسمّع', ic: 'eyeoff', best: () => null },
  { id: 'hafiz', name: 'مستوى الحفّاظ', d: '«شو قبلها؟» ومن الآخر للأول', ic: 'crown', best: () => null },
];
const GAMES_ART = [
  { id: 'art', name: 'زخرفتك الخاصة', d: 'لوحة تكبر مع حفظك', ic: 'star', best: () => null },
  { id: 'kaleido', name: 'مرآة الزخرفة', d: 'ارسم والسورة تُتلى', ic: 'sparkle', best: () => null },
];
