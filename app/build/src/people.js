/* ===== Voice and people: the listening engine, your voice before/after, a screenless course, challenge codes, pass-and-play, cards, wallpaper, certificate ===== */
const IN_CLAUDE = !!window.claude;
const prng = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const pshuffle = (a, r) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = r() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const memorizedVerses = () => [1, 2, 3, 4].filter(stDone).flatMap(id => STATIONS[id - 1].verses).sort((a, b) => a - b);

const PEOPLE = [
  { id: 'listen', t: 'التسميع الحيّ', d: 'سمّع من حفظك، وكل كلمة تقولها تظهر ذهبًا', ic: 'mic' },
  { id: 'rec', t: 'صوتك قبل وبعد', d: 'سجّل اليوم، وبعد أيام اسمع الفرق', ic: 'voice' },
  { id: 'course', t: 'دورة بلا شاشة', d: 'للمشي والسيارة: تلاوة، تكرار، شرح', ic: 'headphones' },
  { id: 'chal', t: 'رمز التحدي', d: 'تحدَّ صديقك بنفس الأسئلة، بلا إنترنت', ic: 'bolt' },
  { id: 'duo', t: 'المناوبة', d: 'اثنان على جوال واحد: يبدأ واحد ويحكم الآخر', ic: 'twins' },
  { id: 'card', t: 'ابعث الضحى لقلبٍ حزين', d: 'بطاقة بآية ومشهد حقيقي', ic: 'share' },
  { id: 'wall', t: 'خلفية الأسبوع', d: 'آيتك هذا الأسبوع على شاشة جوالك', ic: 'expand' },
  { id: 'cert', t: 'شهادتك', d: 'شهادة حفظ باسمك حين تُتمّ السورة', ic: 'crown' },
];

/* ---------- canvas helpers ---------- */
async function fontsReady() {
  try { await Promise.all(['700 80px "Scheherazade New"', '700 80px "Aref Ruqaa"', '500 40px "Readex Pro"', '700 40px "Readex Pro"'].map(f => document.fonts.load(f, 'وَٱلضُّحَىٰ رحلة'))); } catch (e) { }
}
const loadImg = src => new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
function drawCover(g, im, x, y, w, h) {
  if (!im) return;
  const s = Math.max(w / im.width, h / im.height), sw = w / s, sh = h / s;
  g.drawImage(im, (im.width - sw) / 2, (im.height - sh) / 2, sw, sh, x, y, w, h);
}
function wrapLines(g, text, maxW) {
  const words = text.split(' '), lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur); return lines;
}
function balancedLines(g, text, maxW) {  // the fewest lines that fit, split as evenly as possible
  const w = text.split(' '), n = w.length, M = s => g.measureText(s).width;
  for (let k = 1; k <= Math.min(4, n); k++) {
    let best = null;
    const rec = (i, left, acc) => {
      if (left === 1) { const L = [...acc, w.slice(i).join(' ')]; const mx = Math.max(...L.map(M)); if (mx <= maxW && (!best || mx < best.mx)) best = { L, mx }; return; }
      for (let j = i + 1; j <= n - left + 1; j++) rec(j, left - 1, [...acc, w.slice(i, j).join(' ')]);
    };
    rec(0, k, []); if (best) return best.L;
  }
  return wrapLines(g, text, maxW);
}
function fitText(g, text, font, maxW, maxLines, start, min) {  // returns {size, lines}
  for (let s = start; s >= min; s -= 4) { g.font = font(s); const L = wrapLines(g, text, maxW); if (L.length <= maxLines) return { size: s, lines: L }; }
  g.font = font(min); return { size: min, lines: wrapLines(g, text, maxW) };
}
function star8(g, cx, cy, r, color, lw = 2) {
  g.save(); g.translate(cx, cy); g.strokeStyle = color; g.lineWidth = lw; g.beginPath();
  for (let i = 0; i <= 16; i++) { const a = i * Math.PI / 8 - Math.PI / 2, rr = i % 2 ? r * .62 : r; const x = Math.cos(a) * rr, y = Math.sin(a) * rr; i ? g.lineTo(x, y) : g.moveTo(x, y); }
  g.closePath(); g.stroke(); g.restore();
}
function brandMark(g, x, y, color = 'rgba(255,233,184,.75)') {
  g.save(); g.fillStyle = color; g.font = '700 30px "Aref Ruqaa"'; g.textAlign = 'center'; g.direction = 'rtl'; g.fillText('رحلة الضحى', x, y); g.restore();
}

/* ---------- share card (4:5) and weekly wallpaper (9:16) ---------- */
const CARD_MSG = ['إلى قلبٍ أتعبه الطريق', 'تذكّر: ربّك لم يتركك', 'أهديك هذه الآية', ''];
async function renderCard(cv, { kind, n, msg }) {
  const wall = kind === 'wall', W = 1080, H = wall ? 1920 : 1350, BG = '#05070f'; cv.width = W; cv.height = H;
  const g = cv.getContext('2d'); await fontsReady();
  g.fillStyle = BG; g.fillRect(0, 0, W, H);
  const glow = g.createRadialGradient(W / 2, H * .62, 40, W / 2, H * .62, W * .8); glow.addColorStop(0, 'rgba(40,52,120,.55)'); glow.addColorStop(1, 'rgba(5,7,15,0)'); g.fillStyle = glow; g.fillRect(0, 0, W, H);
  const im = await loadImg(posterUrl('v' + n));
  const py = wall ? 420 : 0, ph = 760;
  const off = document.createElement('canvas'); off.width = W; off.height = ph; const o = off.getContext('2d');
  drawCover(o, im, 0, 0, W, ph);
  o.globalCompositeOperation = 'destination-in';
  const m = o.createLinearGradient(0, 0, 0, ph); if (wall) { m.addColorStop(0, 'rgba(0,0,0,0)'); m.addColorStop(.22, '#000'); } else m.addColorStop(0, '#000');
  m.addColorStop(.5, '#000'); m.addColorStop(1, 'rgba(0,0,0,0)'); o.fillStyle = m; o.fillRect(0, 0, W, ph);
  g.drawImage(off, 0, py);
  g.direction = 'rtl'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  // vertical budget between the photo and the footer
  let top = py + ph - 30; const bottom = H - (wall ? 330 : 190);
  if (msg && !wall) { g.font = '700 56px "Aref Ruqaa"'; g.fillStyle = '#ffffff'; g.shadowColor = 'rgba(0,0,0,.7)'; g.shadowBlur = 18; g.fillText(msg, W / 2, top + 20); g.shadowBlur = 0; top += 70; }
  const verse = '﴿' + plainVerse(n) + '﴾', REF = 76;
  let fit = null;
  for (let sz = 116; sz >= 58; sz -= 4) { g.font = `700 ${sz}px "Scheherazade New"`; const L = balancedLines(g, verse, W - 150); const hgt = L.length * sz * 1.7 + REF; if (hgt <= bottom - top) { fit = { sz, L, hgt }; break; } }
  if (!fit) { const sz = 58; g.font = `700 ${sz}px "Scheherazade New"`; const L = wrapLines(g, verse, W - 150); fit = { sz, L, hgt: L.length * sz * 1.7 + REF }; }
  const lh = fit.sz * 1.7; let y = top + (bottom - top - fit.hgt) / 2 + fit.sz * 1.15;
  g.font = `700 ${fit.sz}px "Scheherazade New"`; g.fillStyle = '#ffe3a3'; g.shadowColor = 'rgba(247,184,68,.45)'; g.shadowBlur = 24;
  fit.L.forEach((l, i) => g.fillText(l, W / 2, y + i * lh)); g.shadowBlur = 0;
  y += (fit.L.length - 1) * lh + REF;
  g.font = '500 36px "Readex Pro"'; g.fillStyle = 'rgba(255,255,255,.78)'; g.fillText(`سورة الضحى، الآية ${ARN(n)}`, W / 2, y);
  if (wall) { g.font = '500 34px "Readex Pro"'; g.fillStyle = 'rgba(255,233,184,.7)'; g.fillText('آية هذا الأسبوع', W / 2, py - 40); }
  const fy = H - (wall ? 250 : 120);
  star8(g, W / 2, fy, 26, 'rgba(247,184,68,.55)', 3); brandMark(g, W / 2, fy + 68);
  return cv;
}
function weekVerse() { const nx = nextStation(), mem = memorizedVerses(); return nx && nx.id <= 4 ? nx.verses[0] : mem.length ? mem[dayIdx() % mem.length] : 1; }
function openCard(kind = 'card', n) {
  const b = openRunner(kind === 'wall' ? 'خلفية الأسبوع' : 'بطاقة لقلبٍ حزين'); lifeTone(kind === 'wall' ? 'sky' : 'love');
  const st = { kind, n: n || (kind === 'wall' ? weekVerse() : 3), msg: kind === 'wall' ? '' : CARD_MSG[0] };
  html(b, hx({ ic: kind === 'wall' ? 'expand' : 'share', t: kind === 'wall' ? 'خلفية الأسبوع' : 'ابعث الضحى لقلبٍ حزين' }, `
    <p class="muted" style="text-align:center">${kind === 'wall' ? 'الآية التي تحفظها هذا الأسبوع على مشهدها الحقيقي. اجعلها خلفية جوالك، فتراها عشرات المرات كل يوم.' : 'آيةٌ على مشهدٍ حقيقي لمن تحب. ﴿مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ﴾ قد تكون أجمل ما يصله اليوم.'}</p>
    <div class="cardprev ${kind}"><canvas id="cdC"></canvas></div>
    <div class="chips cdv">${verseRange(1, NV).map(x => `<button class="chip ${x === st.n ? 'on' : ''}" data-cv="${x}">الآية ${ARN(x)}</button>`).join('')}</div>
    ${kind === 'wall' ? '' : `<div class="chips cdm">${CARD_MSG.map((m, i) => `<button class="chip ${i === 0 ? 'on' : ''}" data-cm="${i}">${m || 'بلا رسالة'}</button>`).join('')}</div>`}
    <button class="btn btn-sun btn-wide" id="cdSave">${ic('share')} ${kind === 'wall' ? 'احفظ الخلفية' : 'احفظ البطاقة أو شاركها'}</button>
    ${kind === 'wall' ? '' : `<button class="btn btn-line btn-wide" id="cdTxt">${ic('copy')} أرسل الآية نصًّا</button>`}`));
  const cv = $('#cdC');
  const draw = async () => { await renderCard(cv, st); };
  draw();
  b.onclick = e => {
    const v = e.target.closest('[data-cv]'); if (v) { st.n = +v.dataset.cv; $$('[data-cv]', b).forEach(x => x.classList.toggle('on', x === v)); draw(); return; }
    const m = e.target.closest('[data-cm]'); if (m) { st.msg = CARD_MSG[+m.dataset.cm]; $$('[data-cm]', b).forEach(x => x.classList.toggle('on', x === m)); draw(); return; }
    if (e.target.closest('#cdSave')) { saveImage(cv, kind === 'wall' ? `duha-wallpaper-${st.n}.png` : `duha-ayah-${st.n}.png`).then(ok => { if (ok) { addXP(5); if (kind !== 'wall') award('share'); } }); return; }
    if (e.target.closest('#cdTxt')) { const t = `${st.msg ? st.msg + '\n' : ''}﴿${plainVerse(st.n)}﴾\n[الضحى: ${ARN(st.n)}]`; gratShareText('ابعث الآية', t); }
  };
}
/* a text share sheet (WhatsApp + copy), shared with the journal */
function gratShareText(title, txt) {
  openSheet(title, `<textarea id="gsT" rows="6">${esc(txt)}</textarea>
    <div class="row wrap" style="margin-top:10px"><a class="btn btn-sun" id="gsW" target="_blank" rel="noopener">${ic('share')} واتساب</a><button class="btn btn-line" id="gsC">${ic('copy')} انسخ</button></div>`, sh => {
    const t = $('#gsT', sh), w = $('#gsW', sh);
    const upd = () => { w.href = 'https://wa.me/?text=' + encodeURIComponent(t.value); }; upd(); t.oninput = upd;
    $('#gsC', sh).onclick = async () => { try { await navigator.clipboard.writeText(t.value); toast('نُسخ', 'check'); } catch (e) { t.select(); toast('حدّد النص وانسخه', 'copy'); } };
  });
}

/* ---------- certificate ---------- */
function hijriToday() { try { return ARN(new Date().toLocaleDateString('ar-SA-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' })); } catch (e) { return ''; } }
async function renderCert(cv, { name, fem }) {
  const W = 1600, H = 1130; cv.width = W; cv.height = H;
  const g = cv.getContext('2d'); await fontsReady();
  const bg = g.createRadialGradient(W / 2, H * .35, 80, W / 2, H / 2, W * .7); bg.addColorStop(0, '#16205a'); bg.addColorStop(1, '#060917'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.strokeStyle = '#e9b44c'; g.lineWidth = 6; g.strokeRect(36, 36, W - 72, H - 72); g.lineWidth = 2; g.strokeRect(56, 56, W - 112, H - 112);
  for (let x = 110; x < W - 60; x += 92) { star8(g, x, 56, 16, 'rgba(233,180,76,.75)'); star8(g, x, H - 56, 16, 'rgba(233,180,76,.75)'); }
  for (let y = 148; y < H - 100; y += 92) { star8(g, 56, y, 16, 'rgba(233,180,76,.75)'); star8(g, W - 56, y, 16, 'rgba(233,180,76,.75)'); }
  for (const [x, y] of [[56, 56], [W - 56, 56], [56, H - 56], [W - 56, H - 56]]) { g.fillStyle = '#060917'; g.beginPath(); g.arc(x, y, 34, 0, 7); g.fill(); star8(g, x, y, 30, '#e9b44c', 4); }
  g.globalAlpha = .08; star8(g, W / 2, H / 2, 420, '#ffd27a', 3); star8(g, W / 2, H / 2, 300, '#ffd27a', 2); g.globalAlpha = 1;
  g.direction = 'rtl'; g.textAlign = 'center';
  g.fillStyle = '#ffd27a'; g.font = '700 118px "Aref Ruqaa"'; g.fillText('شهادة حفظ', W / 2, 238);
  g.fillStyle = 'rgba(255,255,255,.8)'; g.font = '500 38px "Readex Pro"'; g.fillText('تشهد «رحلة الضحى» بكل محبة أنّ', W / 2, 330);
  const nm = name || (fem ? 'حافظة الضحى' : 'حافظ الضحى');
  const f = fitText(g, nm, s => `700 ${s}px "Aref Ruqaa"`, W - 360, 1, 132, 64);
  g.fillStyle = '#ffffff'; g.shadowColor = 'rgba(247,184,68,.5)'; g.shadowBlur = 26; g.fillText(f.lines[0], W / 2, 486); g.shadowBlur = 0;
  g.strokeStyle = 'rgba(233,180,76,.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(W / 2 - 330, 526); g.lineTo(W / 2 + 330, 526); g.stroke();
  g.fillStyle = '#ffe3a3'; g.font = '700 54px "Readex Pro"'; g.fillText(`${fem ? 'أتمّت' : 'أتمّ'} حفظ سورة الضحى كاملةً`, W / 2, 620);
  const days = S.created ? Math.max(1, daysBetween(dayKey(new Date(S.created)), dayKey()) + 1) : 1;
  g.fillStyle = 'rgba(255,255,255,.78)'; g.font = '400 34px "Readex Pro"';
  g.fillText(`مع القارئ ${RNAME(Player.rid)}، في رحلةٍ من ${cnt(days, ['يومٍ واحد', 'يومين', 'أيام', 'يومًا'])}، و${S.reviews ? cnt(S.reviews, ['مراجعةٍ واحدة', 'مراجعتين', 'مراجعات', 'مراجعةً']) : 'قبل أول مراجعة'}`, W / 2, 700);
  g.fillText(`${ARN(new Date().toLocaleDateString('ar-SY-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' }))}${hijriToday() ? '، الموافق ' + hijriToday() : ''}`, W / 2, 760);
  g.fillStyle = 'rgba(255,233,184,.85)'; g.font = '500 36px "Readex Pro"'; g.fillText('«خيركم من تعلّم القرآن وعلّمه» — البخاري ٥٠٢٧', W / 2, 880);
  star8(g, W / 2, 965, 30, '#e9b44c', 3); brandMark(g, W / 2, 1040, 'rgba(255,233,184,.8)');
  return cv;
}
function openCert() {
  const b = openRunner('شهادتك'); lifeTone('gold');
  const ok = [1, 2, 3, 4].every(stDone);
  if (!ok) {
    const nx = nextStation();
    html(b, hx({ ic: 'crown', t: 'شهادتك' }, `<div class="panel"><p class="big">تُفتح شهادتك حين تحفظ السورة كاملة.</p><p class="muted">أتممت ${ARN(doneCount())} من ٤ محطات. كل محطة خطوة نحو شهادةٍ باسمك.</p></div>
      ${nx ? `<button class="btn btn-sun btn-wide" data-go="st${nx.id}">${ic('play')} تابع: ${nx.name}</button>` : ''}`)); return;
  }
  const st = { name: S.certName || '', fem: !!S.certFem };
  html(b, hx({ ic: 'crown', t: 'شهادتك' }, `
    <p class="muted" style="text-align:center">ما شاء الله، أتممت حفظ الضحى. اكتب اسمك كما تحب أن يظهر.</p>
    <label class="gin"><span>${ic('name')}</span><input id="ceN" maxlength="40" placeholder="اسمك" value="${esc(st.name)}"></label>
    <div class="seg" id="ceG"><button data-f="0" aria-selected="${!st.fem}">أتمّ</button><button data-f="1" aria-selected="${st.fem}">أتمّت</button></div>
    <div class="cardprev cert"><canvas id="ceC"></canvas></div>
    <button class="btn btn-sun btn-wide" id="ceSave">${ic('share')} احفظ الشهادة أو شاركها</button>`));
  const cv = $('#ceC'); let tm = 0;
  const draw = () => { clearTimeout(tm); tm = setTimeout(() => renderCert(cv, st), 120); };
  draw();
  $('#ceN').oninput = e => { st.name = e.target.value.trim(); S.certName = st.name; save(); draw(); };
  $('#ceG').onclick = e => { const x = e.target.closest('[data-f]'); if (!x) return; st.fem = x.dataset.f === '1'; S.certFem = st.fem; save(); $$('#ceG button').forEach(y => y.setAttribute('aria-selected', y === x)); draw(); };
  $('#ceSave').onclick = async () => { clearTimeout(tm); await renderCert(cv, st); if (await saveImage(cv, 'shahadat-al-duha.png')) award('cert'); };
}

/* ---------- challenge code: same questions for both friends, no internet needed ---------- */
const B36 = n => n.toString(36).toUpperCase();
const chSum = s => B36([...s].reduce((a, c) => a + c.charCodeAt(0) * 7, 0) % 36);
function chEncode(seed, score, secs) { const body = B36(seed).padStart(4, '0') + score + B36(Math.min(secs, 1295)).padStart(2, '0'); return body + chSum(body); }
function chDecode(code) {
  const c = String(code || '').toUpperCase().replace(/[^0-9A-Z]/g, ''); if (c.length !== 8) return null;
  const body = c.slice(0, 7); if (chSum(body) !== c[7] || !/[0-6]/.test(c[4])) return null;
  return { seed: parseInt(body.slice(0, 4), 36), score: +c[4], secs: parseInt(body.slice(5, 7), 36), code: c };
}
const chPretty = c => c.slice(0, 4) + '-' + c.slice(4);
function chQuestions(seed) {
  const r = prng(seed), qs = [], used = new Set();
  for (const t of pshuffle(['next', 'next', 'miss', 'miss', 'num', 'prev'], r)) {
    let n, k = 0; do { n = 1 + (r() * NV | 0); k++; } while (k < 50 && (used.has(n) || (t === 'next' && n === NV) || (t === 'prev' && n === 1))); used.add(n);
    if (t === 'next' || t === 'prev') {
      const right = t === 'next' ? n + 1 : n - 1, opts = pshuffle([right, ...pshuffle(verseRange(1, NV).filter(x => x !== right && x !== n), r).slice(0, 2)], r);
      qs.push({ t, n, opts, ok: opts.indexOf(right) });
    } else if (t === 'miss') {
      const words = QD.verses[n], w = r() * words.length | 0, right = words[w];
      const pool = pshuffle([...new Set(verseRange(1, NV).filter(x => x !== n).flatMap(x => QD.verses[x]))].filter(x => x !== right), r).slice(0, 3);
      const opts = pshuffle([right, ...pool], r); qs.push({ t, n, w, opts, ok: opts.indexOf(right) });
    } else { const opts = pshuffle([n, ...pshuffle(verseRange(1, NV).filter(x => x !== n), r).slice(0, 3)], r); qs.push({ t, n, opts, ok: opts.indexOf(n) }); }
  }
  return qs;
}
function chLink(code) { return location.protocol === 'https:' && !IN_CLAUDE && !/appassets|claude/.test(location.host) ? `${location.origin}${location.pathname}#c=${chPretty(code)}` : ''; }
function openChal(pre) {
  const b = openRunner('رمز التحدي'); lifeTone('power');
  const rival = pre ? chDecode(pre) : null;
  html(b, hx({ ic: 'bolt', t: 'رمز التحدي' }, `
    ${rival ? `<div class="panel"><p class="big">صديقك تحدّاك!</p><p class="muted">نتيجته ${ARN(rival.score)} من ٦ في ${fmtTime(rival.secs)}. نفس الأسئلة بانتظارك.</p></div><button class="btn btn-sun btn-wide" id="chAccept">${ic('play')} اقبل التحدي</button>`
      : `<p class="muted" style="text-align:center">٦ أسئلة من الضحى. العب، ثم ابعث الرمز لصديقك: سيلعب نفس الأسئلة بالترتيب نفسه ويرى نتيجتك، ولو بلا إنترنت.</p>
      <button class="btn btn-sun btn-wide" id="chNew">${ic('bolt')} ابدأ تحديًا جديدًا</button>
      <div class="card" style="display:grid;gap:8px"><b>عندك رمز من صديق؟</b><label class="gin"><span>${ic('target')}</span><input id="chIn" maxlength="12" placeholder="مثل K3P9-5A1Q" autocomplete="off" style="direction:ltr;text-align:center;letter-spacing:.12em"></label><button class="btn btn-line btn-wide" id="chGo">ابدأ بالرمز</button></div>`}`));
  const seedNew = () => (Math.random() * 1679616) | 0;
  if (rival) $('#chAccept').onclick = () => runChal(rival.seed, rival);
  else {
    $('#chNew').onclick = () => runChal(seedNew(), null);
    $('#chGo').onclick = () => { const x = chDecode($('#chIn').value); if (!x) { toast('الرمز غير صحيح، تأكّد منه', 'x'); return; } runChal(x.seed, x); };
  }
}
async function runChal(seed, rival) {
  const b = Run.body, qs = chQuestions(seed); let score = 0; const t0 = performance.now();
  try {
    for (let i = 0; i < qs.length; i++) {
      setProg(i, qs.length); const q = qs[i];
      const head = stepHead('رمز التحدي', `${ARN(i + 1)} من ${ARN(qs.length)}${rival ? ` · صديقك ${ARN(rival.score)} من ٦` : ''}`);
      let prompt, opts, ui = false;
      if (q.t === 'next' || q.t === 'prev') { prompt = `<p class="muted">${q.t === 'next' ? 'ما الآية التي بعد هذه؟' : 'ما الآية التي قبل هذه؟'}</p><div class="panel"><div class="qt night qbig">${verseHTML(q.n)}</div></div>`; opts = q.opts.map(x => verseHTML(x, { marker: false })); }
      else if (q.t === 'miss') { prompt = `<p class="muted">ما الكلمة الناقصة؟</p><div class="panel"><div class="qt night qbig">${blankVerse(q.n, q.w)}</div></div>`; opts = q.opts.map(x => esc(x)); }
      else { prompt = `<p class="muted">ما رقم هذه الآية؟</p><div class="panel"><div class="qt night qbig">${verseHTML(q.n, { marker: false })}</div></div>`; opts = q.opts.map(x => `الآية ${ARN(x)}`); ui = true; }
      if (await mcq({ head, prompt, opts, ok: q.ok, ui })) score++;
    }
  } catch (e) { if (e === CLOSED) return; throw e; }
  setProg(1, 1);
  const secs = Math.round((performance.now() - t0) / 1000), code = chEncode(seed, score, secs), link = chLink(code);
  const verdict = !rival ? '' : score > rival.score || (score === rival.score && secs < rival.secs) ? 'فزت على صديقك! ابعث له الرمز ليرد التحدي' : score === rival.score && secs === rival.secs ? 'تعادلتما تمامًا' : 'سبقك صديقك هذه المرة… جرّب ثانيةً';
  if (rival && verdict.startsWith('فزت')) award('chal');
  const msg = `تحدّيتك في سورة الضحى! نتيجتي ${ARN(score)} من ٦ في ${fmtTime(secs)}.\nافتح «رحلة الضحى» ← العب ← رمز التحدي، واكتب الرمز: ${chPretty(code)}${link ? '\n' + link : ''}`;
  html(b, hx({ ic: 'bolt', t: 'نتيجتك' }, `<div class="bigstat"><b>${ARN(score)} من ٦</b><span>في ${fmtTime(secs)}</span></div>
    ${rival ? `<div class="panel"><p class="big">${verdict}</p><p class="muted">صديقك: ${ARN(rival.score)} من ٦ في ${fmtTime(rival.secs)}</p></div>` : ''}
    <div class="chcode">${chPretty(code)}</div>
    <button class="btn btn-sun btn-wide" id="chShare">${ic('share')} ابعث التحدي</button>
    <button class="btn btn-line btn-wide" id="chAgain">${ic('repeat')} تحدٍّ جديد</button>`));
  $('#chShare').onclick = () => gratShareText('ابعث التحدي', msg);
  $('#chAgain').onclick = () => openChal();
  gain(score * 5);
}
const START_CH = ((location.hash || '').match(/^#c=([\w-]+)/) || [])[1] || null;

/* ---------- pass-and-play: one starts the verse, the other judges ---------- */
function openDuo() {
  const b = openRunner('المناوبة'); lifeTone('power');
  const nm = S.duoNames || ['', ''];
  html(b, hx({ ic: 'twins', t: 'المناوبة' }, `<p class="muted" style="text-align:center">اثنان على جوال واحد. يرى أحدكما أول الآية فيكمّلها من حفظه بصوته، ثم يكشفها ويحكم الآخر. ٨ جولات.</p>
    <label class="gin"><span>١</span><input id="dN0" maxlength="20" placeholder="اسم اللاعب الأول" value="${esc(nm[0])}"></label>
    <label class="gin"><span>٢</span><input id="dN1" maxlength="20" placeholder="اسم اللاعب الثاني" value="${esc(nm[1])}"></label>
    <button class="btn btn-sun btn-wide" id="dGo">${ic('play')} ابدأ</button>`));
  $('#dGo').onclick = () => { const names = [0, 1].map(i => $('#dN' + i).value.trim().slice(0, 20) || `اللاعب ${ARN(i + 1)}`); S.duoNames = names; save(); duoPlay(names); };
}
async function duoPlay(names) {
  const b = Run.body, order = shuffle(verseRange(1, NV)).slice(0, 8), sc = [0, 0];
  try {
    for (let i = 0; i < order.length; i++) {
      setProg(i, order.length); const n = order[i], p = i % 2, other = 1 - p, words = QD.verses[n], show = words.length > 4 ? 2 : 1;
      html(b, `${stepHead(`دور «${esc(names[p])}»`, `الجولة ${ARN(i + 1)} من ${ARN(order.length)} · ${esc(names[0])} ${ARN(sc[0])} — ${ARN(sc[1])} ${esc(names[1])}`)}
        <p class="muted" style="text-align:center">أكمل الآية من حفظك بصوتٍ مسموع:</p>
        <div class="panel"><div class="qt night qbig duov">${words.map((w, k) => k < show ? `<span class="w">${wordHTML(n, k)}</span>` : '<span class="w mask">•••</span>').join(' ')}</div></div>
        <button class="btn btn-sun btn-wide" id="duR">${ic('eye')} اكشف الآية</button>`);
      await until($('#duR'));
      $('.duov', b).innerHTML = verseHTML(n);
      $('#duR').outerHTML = `<p class="big" style="text-align:center">«${esc(names[other])}»: هل أصاب؟</p>
        <div class="row" style="justify-content:center;gap:10px"><button class="btn btn-good" id="duY">${ic('check')} أصاب</button><button class="btn btn-line" id="duN">${ic('x')} فاته شيء</button><button class="iconbtn" id="duP" aria-label="اسمع الآية">${ic('play')}</button></div>`;
      $('#duP').onclick = () => playSeq([n]);
      const yes = await pend(res => { $('#duY').onclick = () => res(true); $('#duN').onclick = () => res(false); });
      stopAll(); if (yes) { sc[p]++; Sfx.ok(); } else Sfx.bad();
    }
  } catch (e) { if (e === CLOSED) return; throw e; }
  setProg(1, 1); gain(20);
  const win = sc[0] === sc[1] ? 'تعادل جميل! كلاكما حافظ' : `الفوز لـ«${esc(names[sc[0] > sc[1] ? 0 : 1])}»، ما شاء الله`;
  html(b, hx({ ic: 'twins', t: 'النتيجة' }, `<div class="duo-score"><div><b>${ARN(sc[0])}</b><span>${esc(names[0])}</span></div><div><b>${ARN(sc[1])}</b><span>${esc(names[1])}</span></div></div>
    <p class="big" style="text-align:center">${win}</p><button class="btn btn-sun btn-wide" id="duA">${ic('repeat')} مباراة أخرى</button>${doneBtn('تم')}`));
  $('#duA').onclick = () => duoPlay(names); bindDone(b);
}

/* ---------- your voice, before and after ---------- */
const RecDB = {
  db: null,
  open() { return this.db || (this.db = new Promise((res, rej) => { const r = indexedDB.open('duha-rec', 1); r.onupgradeneeded = () => r.result.createObjectStore('recs', { keyPath: 'id' }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); })); },
  async run(mode, fn) { const db = await this.open(); return new Promise((res, rej) => { const t = db.transaction('recs', mode), q = fn(t.objectStore('recs')); t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error); }); },
  all() { return this.run('readonly', s => s.getAll()).then(x => (x || []).sort((a, b) => a.id - b.id)).catch(() => []); },
  put(x) { return this.run('readwrite', s => s.put(x)); },
  del(id) { return this.run('readwrite', s => s.delete(id)); },
};
const canRecord = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder && window.indexedDB);
function openRec() {
  const b = openRunner('صوتك قبل وبعد'); lifeTone('love');
  const R = { mr: null, stream: null, t0: 0, iv: 0, audio: null };
  const stopAudio = () => { if (R.audio) { R.audio.pause(); R.audio = null; } };
  const fmtD = s => fmtTime(Math.round(s));
  const draw = async (msg) => {
    const recs = canRecord() ? await RecDB.all() : [];
    const first = recs[0], last = recs.length > 1 ? recs[recs.length - 1] : null;
    html(b, hx({ ic: 'voice', t: 'صوتك قبل وبعد' }, `
      <p class="muted" style="text-align:center">سجّل تلاوتك لما تحفظه اليوم. وبعد أيام سجّل مرةً أخرى، واسمع كيف تغيّر صوتك وثباتك. التسجيلات تبقى على جهازك فقط.</p>
      ${!canRecord() ? `<div class="panel"><p class="big">التسجيل غير متاح هنا.</p><p class="muted">${IN_CLAUDE ? 'هذه النسخة داخل Claude لا تصل إلى الميكروفون. جرّبه في تطبيق أندرويد أو في المتصفح.' : 'متصفحك لا يدعم التسجيل. جرّب Chrome أو تطبيق أندرويد.'}</p></div>`
        : `<button class="recbtn ${R.mr ? 'on' : ''}" id="rcGo" aria-label="${R.mr ? 'أوقف التسجيل' : 'ابدأ التسجيل'}">${ic(R.mr ? 'pause' : 'voice')}<span id="rcT">${R.mr ? fmtD((performance.now() - R.t0) / 1000) : 'سجّل'}</span></button>
      ${msg ? `<p class="warn" style="text-align:center">${msg}</p>` : ''}
      ${first && last ? `<div class="beforeafter"><div><span class="eyebrow">قبل · ${fmtDay(first.at)}</span><button class="btn btn-line" data-rp="${first.id}">${ic('play')} ${fmtD(first.dur)}</button></div><div><span class="eyebrow">بعد · ${fmtDay(last.at)}</span><button class="btn btn-sun" data-rp="${last.id}">${ic('play')} ${fmtD(last.dur)}</button></div></div>
        <p class="dim" style="text-align:center">${daysBetween(first.at, last.at) ? `بينهما ${cnt(daysBetween(first.at, last.at), ['يومٌ واحد', 'يومان', 'أيام', 'يومًا'])}` : 'سجّلت مرتين اليوم. عُد بعد أيام وسجّل من جديد.'}</p>` : ''}
      ${recs.length ? `<h4 class="ghead">تسجيلاتك</h4><div class="ghist">${recs.slice().reverse().map(r => `<div class="gday"><div class="row"><b class="grow">${fmtDay(r.at)} · ${fmtD(r.dur)}</b><button class="iconbtn sm" data-rp="${r.id}" aria-label="شغّل">${ic('play')}</button><button class="iconbtn sm" data-rx="${r.id}" aria-label="احذف">${ic('x')}</button></div></div>`).join('')}</div>` : ''}`}`));
  };
  const start = async () => {
    try {
      stopAll(); stopAudio();
      R.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: true, autoGainControl: true } });
      const mime = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find(m => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m));
      const mr = new MediaRecorder(R.stream, mime ? { mimeType: mime } : undefined), chunks = [];
      mr.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
      mr.onstop = async () => {
        const dur = (performance.now() - R.t0) / 1000; clearInterval(R.iv);
        R.stream.getTracks().forEach(t => t.stop()); R.mr = null;
        if (dur > 1.5 && chunks.length) { await RecDB.put({ id: Date.now(), at: dayKey(), dur, mime: mr.mimeType, blob: new Blob(chunks, { type: mr.mimeType }) }); addXP(10); const all = await RecDB.all(); if (all.length >= 2 && daysBetween(all[0].at, all[all.length - 1].at) >= 7) award('voice'); }
        draw();
      };
      R.mr = mr; R.t0 = performance.now(); mr.start(500); draw();
      R.iv = setInterval(() => { const t = $('#rcT'); if (t) t.textContent = fmtD((performance.now() - R.t0) / 1000); if (performance.now() - R.t0 > 180000) mr.stop(); }, 250);
    } catch (e) { R.mr = null; draw(e && e.name === 'NotAllowedError' ? 'لم يُسمح بالوصول إلى الميكروفون.' : 'تعذّر بدء التسجيل هنا.'); }
  };
  draw();
  b.onclick = async e => {
    if (e.target.closest('#rcGo')) { if (R.mr) R.mr.stop(); else start(); return; }
    const p = e.target.closest('[data-rp]');
    if (p) { const r = (await RecDB.all()).find(x => x.id === +p.dataset.rp); if (!r) return; stopAll(); stopAudio(); R.audio = new Audio(URL.createObjectURL(r.blob)); R.audio.play().catch(() => { }); return; }
    const x = e.target.closest('[data-rx]'); if (x && confirm('تحذف هذا التسجيل؟')) { await RecDB.del(+x.dataset.rx); draw(); }
  };
  Run.onClose = () => { stopAudio(); if (R.mr) R.mr.stop(); };
}

/* ---------- the listening engine (used by «التسميع الحيّ» in gold2.js) ---------- */
const normAr = s => s.replace(/[ً-ٰٟۖ-ۭـ]/g, '').replace(/[ٱأإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/[^ء-ي]/g, '');
function lev(a, b) { const m = a.length, n = b.length; if (!m || !n) return Math.max(m, n); let p = Array.from({ length: n + 1 }, (_, j) => j); for (let i = 1; i <= m; i++) { const c = [i]; for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; } return p[n]; }
const wordSim = (a, b) => { if (!a || !b) return 0; if (a === b) return 1; return 1 - lev(a, b) / Math.max(a.length, b.length); };
function alignWords(expected, heard) {  // expected: normalized words; heard: normalized tokens → status per expected word
  const st = expected.map(() => 0); let p = 0;
  for (const h of heard) {
    if (p >= expected.length) break;
    let best = -1, bs = 0;
    for (let j = p; j < Math.min(expected.length, p + 4); j++) { const s = wordSim(h, expected[j]) - (j - p) * .04; if (s > bs) { bs = s; best = j; } }
    if (best >= 0 && bs >= .58) { for (let j = p; j < best; j++) st[j] = 2; st[best] = 1; p = best + 1; }
  }
  return st;  // 0 not yet, 1 heard, 2 skipped
}
const Listen = {
  rec: null, on: false, committed: '', partial: '', cb: null,
  kind() { if (window.DuhaApp && window.DuhaApp.listen) return 'native'; if (!IN_CLAUDE && (window.SpeechRecognition || window.webkitSpeechRecognition)) return 'web'; return null; },
  start(cb) {
    this.cb = cb; this.on = true; this.committed = ''; this.partial = '';
    if (this.kind() === 'native') { window.DuhaApp.listen(true); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition, r = new SR();
    r.lang = 'ar-SA'; r.continuous = true; r.interimResults = true; r.maxAlternatives = 1;
    r.onresult = e => { let fin = '', tmp = ''; for (let i = 0; i < e.results.length; i++) (e.results[i].isFinal ? (fin += ' ' + e.results[i][0].transcript) : (tmp += ' ' + e.results[i][0].transcript)); this.partial = (this.base || '') + fin + tmp; this.emit('text'); };
    r.onerror = e => { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { this.on = false; this.emit('error', 'denied'); } };
    r.onend = () => { if (this.on) { this.base = this.partial; try { r.start(); } catch (e) { } } else this.emit('end'); };
    this.base = ''; this.rec = r; try { r.start(); } catch (e) { this.emit('error', 'start'); }
  },
  stop() { this.on = false; if (this.kind() === 'native') { try { window.DuhaApp.listen(false); } catch (e) { } } else if (this.rec) { try { this.rec.stop(); } catch (e) { } } },
  text() { return (this.committed + ' ' + this.partial).trim(); },
  emit(ev, d) { this.cb && this.cb(ev, d); },
};
window.__sr = (ev, data) => {  // from the Android app
  if (ev === 'partial') { Listen.partial = data || ''; Listen.emit('text'); }
  else if (ev === 'final') { Listen.committed = (Listen.committed + ' ' + (data || '')).trim(); Listen.partial = ''; Listen.emit('text'); }
  else if (ev === 'error') { if (['denied', 'unavailable', 'failed', 'start'].includes(data)) { Listen.on = false; Listen.emit('error', data); } }
  else if (ev === 'end') Listen.emit('end');
};
/* ---------- a screenless course: recitation, your turn, the narrator, next ---------- */
const Course = {
  tok: 0,
  open() {
    const b = openRunner('دورة بلا شاشة'); lifeTone('sky');
    const mem = memorizedVerses(), nx = nextStation();
    const opts = [...(nx && nx.id <= 4 ? [['next', `المحطة القادمة: ${nx.name}`, nx.verses]] : []), ...(mem.length ? [['mem', `ما حفظته (${cnt(mem.length, ['آية واحدة', 'آيتان', 'آيات', 'آية'])})`, mem]] : []), ['all', 'السورة كاملة', verseRange(1, NV)]];
    let sel = opts[0], rep = 2, narr = S.settings.narr !== 'off';
    html(b, hx({ ic: 'headphones', t: 'دورة بلا شاشة' }, `
      <p class="muted" style="text-align:center">للمشي والسيارة والمطبخ: يقرأ القارئ الآية، ثم يترك لك وقتًا لتردّدها، ثم يشرحها الراوي، ثم التي بعدها. تستطيع إطفاء الشاشة.</p>
      <div class="chips" id="coS">${opts.map((o, i) => `<button class="chip ${i ? '' : 'on'}" data-s="${i}">${o[1]}</button>`).join('')}</div>
      <div class="chips" id="coR"><button class="chip" data-r="1">مرة</button><button class="chip on" data-r="2">مرتان</button><button class="chip" data-r="3">٣ مرات</button></div>
      <label class="toggle"><span>${ic('voice')} الشرح بصوت الراوي بعد كل آية</span><input type="checkbox" id="coN" ${narr ? 'checked' : ''}></label>
      <div class="coplayer"><button class="playbig" id="coGo" aria-label="ابدأ">${ic('play')}</button><div class="grow"><b id="coT">جاهز</b><span class="dim" id="coSub">${cnt(sel[2].length, ['آية واحدة', 'آيتان', 'آيات', 'آية'])}</span></div></div>
      <p class="dim" style="text-align:center">${ic('headphones')} الأفضل بسمّاعة. الأصوات تعمل والشاشة مطفأة في تطبيق أندرويد.</p>`));
    b.onclick = e => {
      const s = e.target.closest('[data-s]'); if (s) { sel = opts[+s.dataset.s]; $$('#coS .chip').forEach(x => x.classList.toggle('on', x === s)); $('#coSub').textContent = cnt(sel[2].length, ['آية واحدة', 'آيتان', 'آيات', 'آية']); return; }
      const r = e.target.closest('[data-r]'); if (r) { rep = +r.dataset.r; $$('#coR .chip').forEach(x => x.classList.toggle('on', x === r)); return; }
      if (e.target.closest('#coGo')) { if (this.live) this.stop(); else this.run(sel[2], rep, $('#coN').checked); }
    };
    Run.onClose = () => this.stop();
  },
  async run(vs, rep, narr) {
    const my = ++this.tok; this.live = true; const live = () => my === this.tok && Run.el;
    const set = (t, s) => { const a = $('#coT'), c = $('#coSub'); if (a) a.textContent = t; if (c && s != null) c.textContent = s; };
    $('#coGo').innerHTML = ic('pause'); $('#coGo').setAttribute('aria-label', 'أوقف');
    for (let k = 0; k < vs.length; k++) {
      const n = vs[k];
      set(`الآية ${ARN(n)}: استمع وردّد`, `${ARN(k + 1)} من ${ARN(vs.length)}`);
      if (!(await playSeq([n], { repeat: rep, echo: true })) || !live()) return this.end(my);
      if (narr && MEDIA.narr && MEDIA.narr['v' + n]) { set(`الآية ${ARN(n)}: الشرح`); await Narr.play('v' + n); if (!live()) return this.end(my); }
      await sleep(700); if (!live()) return this.end(my);
    }
    set('والآن كلها متصلة', 'استمع ورافق القارئ');
    await playSeq(vs, { gap: 500 }); if (!live()) return this.end(my);
    gain(15 + vs.length * 2); set('أتممت الدورة، بارك الله فيك', ''); this.end(my);
  },
  stop() { this.tok++; stopAll(); Narr.stop(); this.end(this.tok); },
  end(my) { if (my !== this.tok && this.live) return; this.live = false; const g = $('#coGo'); if (g) { g.innerHTML = ic('play'); g.setAttribute('aria-label', 'ابدأ'); } },
};
