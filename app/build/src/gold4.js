/* ===== The golden features, part four (v4.3)
   «استوديو الضحى» (105): a vertical film of the verses — a real scene behind, the words lighting with the recitation,
   the reciter's voice or your own (cleaned, with a gentle mosque echo) — ready for a status or a story.
   «مشغّل الحفظ الاحترافي» (106): the hafiz's repetition plans, a pause to repeat after each verse, speeds, a sleep timer;
   it keeps going with the screen off (an Android service with lock-screen, headset and car buttons).
   «ساحة الأمة الحية» (109): a living map of everyone sharing this page — an anonymous city dot for whoever recited
   today, a weekly goal together, and live rooms to review in the same moment. ===== */

/* ---------- shared: save or share a file the app made ---------- */
async function saveFile(blob, name, mime) {
  try { if (window.DuhaApp && window.DuhaApp.shareFile) { window.DuhaApp.shareFile(await blobB64(blob), name, mime); return true; } } catch (e) { }
  if (window.claude && typeof window.claude.use === 'function') {
    let dl = null; try { dl = await window.claude.use('downloads'); } catch (e) { }
    if (dl) { try { await dl.save({ filename: name, data: blob }); toast('حُفظ الملف', 'check'); return true; } catch (e) { if (e && e.code === 'declined') return false; } }
  }
  try { const f = new File([blob], name, { type: mime }); if (!window.claude && navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: 'رحلة الضحى' }); return true; } } catch (e) { if (e && e.name === 'AbortError') return false; }
  const u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 10000); return true;
}
const decodeBuf = (ctx, ab) => new Promise((res, rej) => { const p = ctx.decodeAudioData(ab, res, rej); if (p && p.then) p.then(res, rej); });
const vRangeSel = (id, v) => `<select id="${id}">${verseRange(1, NV).map(n => `<option value="${n}"${n === v ? ' selected' : ''}>${ARN(n)}</option>`).join('')}</select>`;

/* =====================================================================================
   105 · استوديو الضحى
   ===================================================================================== */
const ST_STYLES = { gold: 'ذهبي', white: 'أبيض هادئ', night: 'لوحٌ ليلي' };
const Studio = { L: null, o: null, takes: {}, rec: null, run: null };
function openStudio() {
  const L = Gx.open('stv', 'استوديو الضحى', 'film'); Studio.L = L;
  S.studio = S.studio || {};
  const mem = memorizedVerses();
  Studio.o = Object.assign({ from: mem[0] || 1, to: Math.min(NV, (mem[0] || 1) + 2), bg: 'auto', voice: 'reciter', style: 'gold', shape: 'story', clean: true }, S.studio.o || {});
  Studio.takes = {};
  L.onClose = () => { stStopRec(true); stCancel(); Studio.L = null; for (const t of Object.values(Studio.takes)) if (t.url) URL.revokeObjectURL(t.url); Studio.takes = {}; };
  stSetup();
}
function stVerses() { const o = Studio.o, a = Math.min(o.from, o.to), b = Math.max(o.from, o.to); return verseRange(a, b); }
function stSetup(msg) {
  const L = Studio.L, o = Studio.o, canRec = canRecord() && !IN_CLAUDE;
  if (o.voice === 'me' && !canRec) o.voice = 'reciter';
  const scenes = mediaAll().map(m => m.key);
  html(L.body, `<div class="stwrap">
    <p class="muted sthint">اصنع فيلمًا قصيرًا بآياتك: مشهدٌ حقيقي، والكلمات تضيء مع التلاوة لحظةً بلحظة، جاهزٌ لحالة واتساب وستوري إنستغرام.</p>
    <div class="stprev"><canvas id="stPrev"></canvas></div>
    <h4 class="lrh">الآيات</h4>
    <div class="row strange"><label>من الآية ${vRangeSel('stFrom', o.from)}</label><label>إلى الآية ${vRangeSel('stTo', o.to)}</label></div>
    <div class="chips" id="stQ">${STATIONS.slice(0, 4).map(s => `<button class="chip" data-q="${s.verses[0]}-${s.verses[s.verses.length - 1]}">${s.name}</button>`).join('')}<button class="chip" data-q="1-${NV}">السورة كاملة</button></div>
    <h4 class="lrh">المشهد</h4>
    <div class="stbgs" id="stBg"><button class="stbg${o.bg === 'auto' ? ' on' : ''}" data-bg="auto"><span>${ic('film')}</span><b>مشهد كل آية</b></button>${mediaAll().map(m => `<button class="stbg${o.bg === m.key ? ' on' : ''}" data-bg="${m.key}" style="background-image:url('${mediaThumb(m.key)}')"><b>${esc(m.t)}</b></button>`).join('')}</div>
    <h4 class="lrh">الصوت</h4>
    <div class="seg" id="stV" role="tablist"><button role="tab" data-v="reciter" aria-selected="${o.voice === 'reciter'}">${esc(RNAME(Player.rid))}</button><button role="tab" data-v="me" aria-selected="${o.voice === 'me'}" ${canRec ? '' : 'disabled'}>صوتي</button></div>
    ${canRec ? '' : `<p class="dim stsmall">${IN_CLAUDE ? 'التسجيل بصوتك يعمل في تطبيق أندرويد والمتصفح، لا داخل Claude.' : 'متصفحك لا يدعم التسجيل.'}</p>`}
    <div id="stMe"></div>
    <h4 class="lrh">الشكل</h4>
    <div class="chips" id="stSt">${Object.entries(ST_STYLES).map(([k, t]) => `<button class="chip${o.style === k ? ' on' : ''}" data-st="${k}">${t}</button>`).join('')}</div>
    <div class="chips" id="stSh"><button class="chip${o.shape === 'story' ? ' on' : ''}" data-sh="story">طولي ٩:١٦ (حالة وستوري)</button><button class="chip${o.shape === 'square' ? ' on' : ''}" data-sh="square">مربع</button></div>
    ${msg ? `<p class="warn" style="text-align:center">${msg}</p>` : ''}
    <button class="btn btn-sun btn-wide" id="stGo">${ic('film')} اصنع الفيلم</button>
    <p class="dim stsmall">يُصنع الفيلم على جهازك وأنت تشاهده، بطول التلاوة نفسها. لا يُرسل شيءٌ إلى أي مكان.</p>
  </div>`);
  stMePanel(); stPreview();
  const sync = () => { S.studio.o = { ...o }; save(); stPreview(); };
  $('#stFrom', L.body).onchange = e => { o.from = +e.target.value; sync(); stMePanel(); };
  $('#stTo', L.body).onchange = e => { o.to = +e.target.value; sync(); stMePanel(); };
  L.body.onclick = e => {
    const q = e.target.closest('[data-q]'); if (q) { const [a, b] = q.dataset.q.split('-').map(Number); o.from = a; o.to = b; $('#stFrom', L.body).value = a; $('#stTo', L.body).value = b; sync(); stMePanel(); return; }
    const bg = e.target.closest('[data-bg]'); if (bg) { o.bg = bg.dataset.bg; $$('#stBg .stbg', L.body).forEach(x => x.classList.toggle('on', x === bg)); sync(); return; }
    const v = e.target.closest('[data-v]'); if (v && !v.disabled) { o.voice = v.dataset.v; $$('#stV button', L.body).forEach(x => x.setAttribute('aria-selected', x === v)); sync(); stMePanel(); return; }
    const st = e.target.closest('[data-st]'); if (st) { o.style = st.dataset.st; $$('#stSt .chip', L.body).forEach(x => x.classList.toggle('on', x === st)); sync(); return; }
    const sh = e.target.closest('[data-sh]'); if (sh) { o.shape = sh.dataset.sh; $$('#stSh .chip', L.body).forEach(x => x.classList.toggle('on', x === sh)); sync(); return; }
    const tk = e.target.closest('[data-take]'); if (tk) { stRecord(+tk.dataset.take); return; }
    const pl = e.target.closest('[data-tplay]'); if (pl) { const t = Studio.takes[+pl.dataset.tplay]; if (t) { stopAll(); const a = new Audio(t.url); a.play().catch(() => { }); } return; }
    if (e.target.closest('#stClean')) { o.clean = e.target.closest('#stClean').checked; S.studio.o = { ...o }; save(); stReclean(); return; }
    if (e.target.closest('#stGo')) stRender();
  };
}
/* your own voice: one take per verse, so each verse knows where it starts */
function stMePanel() {
  const box = Studio.L && $('#stMe', Studio.L.body), o = Studio.o; if (!box) return;
  if (o.voice !== 'me') { box.innerHTML = ''; return; }
  const vs = stVerses(), done = vs.filter(n => Studio.takes[n]).length;
  box.innerHTML = `<div class="sttakes"><p class="dim">سجّل كل آية وحدها: اضغط «سجّل» ثم اقرأ، ويتوقف التسجيل وحده بعد سكوتك. (${ARN(done)} من ${ARN(vs.length)})</p>
    ${vs.map(n => { const t = Studio.takes[n], on = Studio.rec && Studio.rec.n === n; return `<div class="sttake${t ? ' ok' : ''}"><b>${ARN(n)}</b><span class="qt grow">${esc(QD.verses[n].slice(0, 3).join(' '))}${QD.verses[n].length > 3 ? '…' : ''}</span>
      ${t ? `<button class="iconbtn sm" data-tplay="${n}" aria-label="اسمع">${ic('play')}</button>` : ''}<button class="btn ${on ? 'btn-sun' : 'btn-line'} sm" data-take="${n}">${on ? `${ic('pause')} أوقف` : t ? 'أعد' : `${ic('voice')} سجّل`}</button></div>`; }).join('')}
    <label class="toggle"><span>${ic('sparkle')} تنقية من الضجيج وصدى المسجد</span><input type="checkbox" id="stClean" ${o.clean ? 'checked' : ''}></label></div>`;
}
async function stRecord(n) {
  if (Studio.rec) { const was = Studio.rec.n; stStopRec(); if (was === n) return; }
  stopAll();
  let stream; try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: true } }); }
  catch (e) { toast(e && e.name === 'NotAllowedError' ? 'لم يُسمح بالوصول إلى الميكروفون' : 'تعذّر بدء التسجيل', 'x'); return; }
  if (!Studio.L) { stream.getTracks().forEach(t => t.stop()); return; }
  const C = window.AudioContext || window.webkitAudioContext, ac = new C(), an = ac.createAnalyser(); an.fftSize = 1024; ac.createMediaStreamSource(stream).connect(an);
  const mime = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find(m => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m));
  const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined), R = Studio.rec = { n, stream, ac, an, mr, chunks: [], t0: performance.now(), buf: new Float32Array(1024), floor: null, voiced: false, lastV: 0 };
  mr.ondataavailable = e => { if (e.data && e.data.size) R.chunks.push(e.data); };
  mr.onstop = () => stTakeDone(R);
  mr.start(250); stMePanel();
  const loop = () => {
    if (Studio.rec !== R) return;
    an.getFloatTimeDomainData(R.buf); let s = 0; for (const v of R.buf) s += v * v;
    const rms = Math.sqrt(s / R.buf.length), el = performance.now() - R.t0;
    if (el < 400) R.floor = R.floor == null ? rms : Math.min(R.floor, rms);
    if (rms > Math.max(.012, Math.min(R.floor || 0, .02) * 3)) { R.voiced = true; R.lastV = el; }
    if ((R.voiced && el - R.lastV > 1800) || el > 40000) { stStopRec(); return; }
    R.raf = requestAnimationFrame(loop);
  };
  R.raf = requestAnimationFrame(loop);
}
function stStopRec(cancel) { const R = Studio.rec; if (!R) return; R.cancel = !!cancel; cancelAnimationFrame(R.raf); Studio.rec = null; try { if (R.mr.state !== 'inactive') R.mr.stop(); } catch (e) { } }
async function stTakeDone(R) {
  try { R.stream.getTracks().forEach(t => t.stop()); } catch (e) { }
  if (R.cancel || !Studio.L) { try { R.ac.close(); } catch (e) { } return; }
  try {
    const blob = new Blob(R.chunks, { type: R.mr.mimeType || 'audio/webm' }), raw = await decodeBuf(R.ac, await blob.arrayBuffer());
    const buf = await stClean(raw, Studio.o.clean);
    if (!buf) { toast('لم أسمع صوتًا واضحًا، أعد المحاولة', 'voice'); }
    else { const old = Studio.takes[R.n]; if (old && old.url) URL.revokeObjectURL(old.url); Studio.takes[R.n] = { raw, buf, url: URL.createObjectURL(stWav(buf)) }; sqNote([R.n]); }
  } catch (e) { console.error(e); toast('تعذّر قراءة التسجيل', 'x'); }
  try { R.ac.close(); } catch (e) { }
  stMePanel();
}
async function stReclean() {
  for (const [n, t] of Object.entries(Studio.takes)) { const b = await stClean(t.raw, Studio.o.clean); if (b) { URL.revokeObjectURL(t.url); Studio.takes[n] = { raw: t.raw, buf: b, url: URL.createObjectURL(stWav(b)) }; } }
  stMePanel();
}
/* trim the silence, then (if chosen) a gentle noise gate, a little compression and a large-room echo */
async function stClean(raw, clean) {
  const sr = raw.sampleRate, x = raw.getChannelData(0), N = Math.floor(x.length / sr * 100), env = new Float32Array(N);
  for (let i = 0; i < N; i++) { let s = 0; const a = Math.floor(i * sr / 100), b = Math.min(x.length, Math.floor((i + 1) * sr / 100)); for (let j = a; j < b; j++) s += x[j] * x[j]; env[i] = Math.sqrt(s / Math.max(1, b - a)); }
  const an = mrAnalyze(env); if (!an.ok || an.span < 300) return null;
  const s0 = Math.max(0, Math.floor((an.a - 150) / 1000 * sr)), s1 = Math.min(x.length, Math.floor((an.b + 250) / 1000 * sr)), len = s1 - s0;
  const tail = clean ? Math.floor(sr * 1.6) : 0, OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const oc = new OAC(1, len + tail, sr), src = oc.createBuffer(1, len, sr), y = src.getChannelData(0);
  /* gate: below about 2.5× the noise floor the sound is turned down, smoothly */
  let g = 1; const thr = an.thr * 1.1;
  for (let i = 0; i < len; i++) {
    const k = Math.floor((s0 + i) / sr * 100), e = env[Math.min(N - 1, k)] || 0, want = !clean || e > thr ? 1 : .12;
    g += (want - g) * (want > g ? .02 : .0006); y[i] = x[s0 + i] * g;
  }
  const node = oc.createBufferSource(); node.buffer = src;
  if (!clean) { node.connect(oc.destination); node.start(); return oc.startRendering(); }
  const hp = oc.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 85;
  const comp = oc.createDynamicsCompressor(); comp.threshold.value = -26; comp.ratio.value = 3; comp.attack.value = .01; comp.release.value = .25;
  const ir = oc.createBuffer(2, Math.floor(sr * 1.9), sr);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < d.length; i++) { const t = i / sr; d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t / 1.9, 2.2) * Math.exp(-t * 2.4) * (t < .012 ? t / .012 : 1); } }
  const conv = oc.createConvolver(); conv.buffer = ir;
  const dry = oc.createGain(), wet = oc.createGain(), out = oc.createGain(); dry.gain.value = .9; wet.gain.value = .2; out.gain.value = 1.05;
  node.connect(hp).connect(comp); comp.connect(dry).connect(out); comp.connect(conv).connect(wet).connect(out); out.connect(oc.destination);
  node.start(); return oc.startRendering();
}
function stWav(buf) {
  const sr = buf.sampleRate, d = buf.getChannelData(0), n = d.length, b = new ArrayBuffer(44 + n * 2), v = new DataView(b);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, d[i])) * 32767, true);
  return new Blob([b], { type: 'audio/wav' });
}
/* ---------- drawing one frame of the film ---------- */
function stLayout(c, words, W, maxLines) {
  let f = Math.round(W * .085), lines;
  for (; f > W * .04; f -= 2) {
    c.font = `400 ${f}px "Scheherazade New", serif`;
    const sp = c.measureText(' ').width * 1.4, ws = words.map(t => c.measureText(t).width), max = W * .84;
    lines = []; let cur = [], cw = 0;
    ws.forEach((w, i) => { if (cur.length && cw + sp + w > max) { lines.push({ ids: cur, w: cw }); cur = []; cw = 0; } cw += (cur.length ? sp : 0) + w; cur.push(i); });
    if (cur.length) lines.push({ ids: cur, w: cw });
    if (lines.length <= maxLines) return { f, lines, ws, sp };
  }
  return { f, lines, ws: words.map(t => c.measureText(t).width), sp: c.measureText(' ').width * 1.4 };
}
function stFrame(c, W, H, st) {
  const o = st.o, P = st.pal;
  c.save(); c.fillStyle = '#05081a'; c.fillRect(0, 0, W, H);
  /* the scene, cover-cropped, cross-fading between verses */
  const drawBg = (src, a) => { if (!src || a <= 0) return; const sw = src.videoWidth || src.naturalWidth, sh = src.videoHeight || src.naturalHeight; if (!sw) return; const k = Math.max(W / sw, H / sh) * 1.04, dw = sw * k, dh = sh * k; c.globalAlpha = a; c.drawImage(src, (W - dw) / 2, (H - dh) / 2, dw, dh); c.globalAlpha = 1; };
  drawBg(st.bgPrev, st.bgMix < 1 ? 1 - st.bgMix : 0); drawBg(st.bg, st.bgMix);
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(5,8,26,.55)'); g.addColorStop(.35, 'rgba(5,8,26,.25)'); g.addColorStop(.7, 'rgba(5,8,26,.45)'); g.addColorStop(1, 'rgba(5,8,26,.85)');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.direction = 'rtl'; c.textAlign = 'center';
  /* title */
  c.fillStyle = 'rgba(255,236,190,.92)'; c.font = `700 ${Math.round(W * .06)}px "Aref Ruqaa", serif`; c.fillText('سورة الضحى', W / 2, H * .1);
  if (st.verse != null) {
    const n = st.verse, words = n ? QD.verses[n] : QD.verses[0], lay = st.lay[n] || (st.lay[n] = stLayout(c, words, W, o.shape === 'square' ? 4 : 5));
    const lh = lay.f * 1.9, top = H * (o.shape === 'square' ? .52 : .5) - (lay.lines.length * lh) / 2 + lh * .62;
    if (o.style === 'night') { c.fillStyle = 'rgba(8,12,40,.62)'; const pw = W * .92, ph = lay.lines.length * lh + lh * .5; c.beginPath(); c.roundRect ? c.roundRect((W - pw) / 2, top - lh * .95, pw, ph, 28) : c.rect((W - pw) / 2, top - lh * .95, pw, ph); c.fill(); }
    c.font = `400 ${lay.f}px "Scheherazade New", serif`; c.textAlign = 'right';
    lay.lines.forEach((ln, li) => {
      let x = W / 2 + ln.w / 2; const y = top + li * lh;
      for (const i of ln.ids) {
        const cur = i === st.word, past = st.word != null && i < st.word;
        c.shadowColor = P.glow; c.shadowBlur = cur ? lay.f * .5 : lay.f * .12;
        c.fillStyle = cur ? P.cur : past || st.word == null ? P.text : P.dim;
        c.fillText(words[i], x, y); x -= lay.ws[i] + lay.sp;
      }
    });
    c.shadowBlur = 0; c.textAlign = 'center';
    if (n) { c.fillStyle = P.cur; c.font = `600 ${Math.round(W * .038)}px "Readex Pro", sans-serif`; c.fillText(`الآية ${ARN(n)}`, W / 2, top + lay.lines.length * lh + lh * .15); }
  }
  /* footer */
  c.fillStyle = 'rgba(255,255,255,.75)'; c.font = `500 ${Math.round(W * .03)}px "Readex Pro", sans-serif`;
  c.fillText(st.voiceName, W / 2, H * .9); c.fillStyle = 'rgba(255,215,122,.8)'; c.fillText('رحلة الضحى', W / 2, H * .9 + W * .05);
  if (st.fade != null) { c.fillStyle = `rgba(5,8,26,${st.fade})`; c.fillRect(0, 0, W, H); }
  c.restore();
}
const ST_PAL = { gold: { text: '#fff7e2', dim: 'rgba(255,247,226,.62)', cur: '#ffd77a', glow: 'rgba(255,200,90,.85)' }, white: { text: '#ffffff', dim: 'rgba(255,255,255,.6)', cur: '#ffffff', glow: 'rgba(0,0,0,.65)' }, night: { text: '#e9eeff', dim: 'rgba(233,238,255,.55)', cur: '#ffd77a', glow: 'rgba(255,200,90,.7)' } };
async function stPreview() {
  const L = Studio.L, cv = L && $('#stPrev', L.body); if (!cv) return;
  await fontsReady(); if (!Studio.L) return;
  const o = Studio.o, W = 360, H = o.shape === 'square' ? 360 : 640, n = stVerses()[0];
  cv.width = W; cv.height = H; cv.style.aspectRatio = `${W} / ${H}`;
  const k = o.bg === 'auto' ? 'v' + n : o.bg, img = await new Promise(r => { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => r(im); im.onerror = () => r(null); im.src = o.bg === 'auto' ? posterUrl(k) : (isStillKey(k) ? mediaUrl(k) : mediaThumb(k)); });
  if (!Studio.L) return;
  stFrame(cv.getContext('2d'), W, H, { o, pal: ST_PAL[o.style], bg: img, bgMix: 1, verse: n, word: 1, lay: {}, voiceName: o.voice === 'me' ? 'بصوتي' : RNAME(Player.rid) });
}
function stMime() {
  if (!window.MediaRecorder || !MediaRecorder.isTypeSupported) return null;
  return ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4;codecs=avc1,mp4a', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find(m => MediaRecorder.isTypeSupported(m)) || null;
}
function stCancel() { const r = Studio.run; if (!r) return; r.dead = true; cancelAnimationFrame(r.raf); try { if (r.mr && r.mr.state !== 'inactive') r.mr.stop(); } catch (e) { } for (const s of r.srcs || []) { try { s.stop(); } catch (e) { } } for (const v of Object.values(r.vids || {})) { try { v.pause(); v.removeAttribute('src'); v.load(); } catch (e) { } } try { r.ctx.close(); } catch (e) { } Studio.run = null; }
async function stRender() {
  const L = Studio.L, o = Studio.o, vs = stVerses(), mime = stMime();
  if (!mime || !HTMLCanvasElement.prototype.captureStream) return stSetup('متصفحك لا يستطيع صناعة الفيديو. جرّب Chrome أو تطبيق أندرويد.');
  if (o.voice === 'me') { const miss = vs.filter(n => !Studio.takes[n]); if (miss.length) return stSetup(`سجّل الآيات أولًا: بقي ${miss.map(ARN).join('، ')}`); }
  stopAll(); stCancel(); await fontsReady();
  const W = 720, H = o.shape === 'square' ? 720 : 1280;
  html(L.body, `<div class="stwrap"><div class="strun"><canvas id="stCv" width="${W}" height="${H}"></canvas></div>
    <div class="gbar strbar"><i id="stBar" style="width:0%"></i></div><p class="dim stsmall" id="stMsg">أجهّز المشاهد والصوت…</p>
    <button class="btn btn-line btn-wide" id="stX">${ic('x')} إلغاء</button></div>`);
  $('#stX', L.body).onclick = () => { stCancel(); stSetup(); };
  const C = window.AudioContext || window.webkitAudioContext, ctx = new C(), run = Studio.run = { ctx, srcs: [], vids: {}, dead: false };
  const msg = t => { const m = $('#stMsg', L.body); if (m) m.textContent = t; };
  /* the audio timeline */
  const segs = []; let t = 1.4;
  try {
    for (const n of vs) {
      if (o.voice === 'me') { const b = Studio.takes[n].buf; segs.push({ n, buf: b, off: 0, dur: b.duration, at: t, b: null }); t += b.duration + .5; }
      else {
        const rid = Player.rid, tm = tim(rid, n), a = Math.max(0, tm.t0 - 120), e = Math.min(tm.d, tm.t1 + 220);
        const ab = await (await fetch(AC.blobs.get(aurl(rid, n)) || aurl(rid, n))).arrayBuffer(), b = await decodeBuf(ctx, ab);
        segs.push({ n, buf: b, off: a / 1000, dur: (e - a) / 1000, at: t, b: tm.b.map(x => (x - a) / 1000), rid }); t += (e - a) / 1000 + .55;
      }
      if (run.dead) return;
    }
  } catch (e) { console.error(e); if (!run.dead) stSetup('تعذّر تحميل التلاوة'); return; }
  const T = t + 1.6;
  /* the scenes */
  const keys = [...new Set(o.bg === 'auto' ? vs.map(n => 'v' + n).filter(hasScene) : [o.bg])];
  const stills = keys.filter(k => o.bg === 'auto' ? isStill(k) : isStillKey(k));
  /* scenes from the library: fetched once at full quality and kept on the phone, so the film never waits on the network */
  const fileOf = {}; msg('أجهّز المشاهد…'); await Promise.all(keys.map(async k => { fileOf[k] = await mediaFileUrl(o.bg === 'auto' ? sceneOf(k) : k); }));
  if (run.dead) return;
  await Promise.all(keys.filter(k => !stills.includes(k)).map(k => new Promise(res => { const v = document.createElement('video'); v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto'; v.crossOrigin = 'anonymous'; v.src = fileOf[k]; run.vids[k] = v; const done = () => res(); v.oncanplay = done; v.onerror = done; setTimeout(done, 6000); })));
  if (run.dead) return;
  const poster = {}; await Promise.all(keys.map(k => new Promise(res => { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = im.onerror = res; im.src = stills.includes(k) ? fileOf[k] : (o.bg === 'auto' ? posterUrl(k) : mediaThumb(k)); poster[k] = im; })));
  const cv = $('#stCv', L.body), c = cv.getContext('2d');
  const dest = ctx.createMediaStreamDestination(), out = ctx.createGain(); out.connect(dest); out.connect(ctx.destination);
  const stream = new MediaStream([...cv.captureStream(30).getVideoTracks(), ...dest.stream.getAudioTracks()]);
  const mr = run.mr = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 1800000, audioBitsPerSecond: 96000 }), chunks = [];
  mr.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
  const finished = new Promise(r => { mr.onstop = r; });
  if (ctx.state === 'suspended') await ctx.resume();
  const st = { o, pal: ST_PAL[o.style], lay: {}, voiceName: o.voice === 'me' ? 'بصوتي' : RNAME(Player.rid), bgMix: 1, verse: null, word: null };
  const t0 = ctx.currentTime + .25;
  for (const s of segs) { const src = ctx.createBufferSource(); src.buffer = s.buf; src.connect(out); src.start(t0 + s.at, s.off, s.dur); run.srcs.push(src); }
  mr.start(500); msg('أصنع الفيلم… شاهده وهو يُصنع');
  let curK = null;
  await new Promise(done => {
    const frame = () => {
      if (run.dead) return done();
      const now = ctx.currentTime - t0;
      const seg = [...segs].reverse().find(s => now >= s.at - .45) || null;
      st.verse = seg ? seg.n : null;
      if (seg && seg.b && now >= seg.at) { const rel = now - seg.at; let w = -1; for (let i = 0; i < seg.b.length - 1; i++) if (rel >= seg.b[i] - .04) w = i; st.word = w >= 0 ? w : null; }
      else st.word = null;
      const k = o.bg === 'auto' ? (seg ? 'v' + seg.n : keys[0]) : o.bg;
      if (k !== curK && !run.vids[k] && poster[k]) { st.bgPrev = st.bg; st.bg = poster[k]; st.mixAt = now; curK = k; }
      else if (k !== curK && run.vids[k]) { st.bgPrev = st.bg; st.bg = run.vids[k].readyState >= 2 ? run.vids[k] : poster[k]; st.mixAt = now; curK = k; try { run.vids[k].currentTime = 0; run.vids[k].play().catch(() => { }); } catch (e) { } }
      else if (k === curK && run.vids[k] && run.vids[k].readyState >= 2) st.bg = run.vids[k];
      st.bgMix = st.mixAt == null ? 1 : clamp((now - st.mixAt) / .8);
      st.fade = now < .8 ? 1 - now / .8 : now > T - .9 ? clamp((now - (T - .9)) / .9) : null;
      stFrame(c, W, H, st);
      const b = $('#stBar', L.body); if (b) b.style.width = (100 * clamp(now / T)).toFixed(1) + '%';
      if (now >= T) return done();
      run.raf = requestAnimationFrame(frame);
    };
    run.raf = requestAnimationFrame(frame);
  });
  if (run.dead) return;
  try { mr.stop(); } catch (e) { }
  await finished;
  for (const v of Object.values(run.vids)) { try { v.pause(); } catch (e) { } }
  try { ctx.close(); } catch (e) { }
  Studio.run = null;
  if (!Studio.L) return;
  const type = mime.split(';')[0], blob = new Blob(chunks, { type }), ext = type === 'video/mp4' ? 'mp4' : 'webm';
  const name = `duha-${vs[0]}-${vs[vs.length - 1]}.${ext}`, url = URL.createObjectURL(blob);
  S.studio.made = (S.studio.made || 0) + 1; save(); award('studio'); addXP(12);
  html(L.body, `<div class="stwrap"><div class="strun"><video src="${url}" controls playsinline></video></div>
    <p class="stdone">${ic('check')} فيلمك جاهز: ${cnt(Math.round(T), ['ثانية واحدة', 'ثانيتان', 'ثوانٍ', 'ثانية'])}${ext === 'webm' ? ' (بصيغة WebM، ويعرضها أغلب الجوالات؛ وقد يطلب واتساب صيغة MP4)' : ''}</p>
    <div class="row trbtns"><button class="btn btn-sun" id="stSave">${ic('share')} احفظ وشارك</button><button class="btn btn-line" id="stAgain">${ic('repeat')} فيلمٌ آخر</button></div></div>`);
  $('#stSave', L.body).onclick = () => saveFile(blob, name, type);
  $('#stAgain', L.body).onclick = () => { URL.revokeObjectURL(url); stSetup(); };
}

/* =====================================================================================
   106 · مشغّل الحفظ الاحترافي
   ===================================================================================== */
const PP_PLANS = {
  hafiz: { t: 'طريقة الحفّاظ', d: 'كل آية مرات، ثم كل آيتين معًا، ثم الكل' },
  each: { t: 'تكرار كل آية', d: 'كل آية مرات، ثم الكل مرة' },
  review: { t: 'مراجعة', d: 'الآيات كلها ثلاث مرات' },
  loop: { t: 'متواصل', d: 'الآيات تتكرر حتى توقفها' },
};
const PP = { L: null, items: [], i: -1, tok: 0, state: 'idle', native: false };
const PPA = new Audio(); PPA.preload = 'auto';
const ppNative = () => !!(window.DuhaApp && window.DuhaApp.ppStart);
function ppDur(n, rid) { const t = tim(rid, n); return Math.min(t.d, t.t1 + 220) - Math.max(0, t.t0 - 120); }
/* the plan as a flat list of recitations, each with the pause that follows it */
function ppBuild(o) {
  const rid = Player.rid, vs = verseRange(Math.min(o.from, o.to), Math.max(o.from, o.to)), out = [], rate = o.rate;
  const echo = n => o.echo ? Math.round(ppDur(n, rid) * 1.1 + 700) : 450;
  const step = (list, rep, title) => { for (let r = 1; r <= rep; r++) list.forEach((n, j) => out.push({ n, label: rep > 1 ? `${title}، المرة ${ARN(r)} من ${ARN(rep)}` : title, gap: j < list.length - 1 ? 380 : list.length === 1 ? echo(n) : (o.echo ? 1600 : 900) })); };
  const all = vs.length > 1 ? (vs.length === NV ? 'السورة كاملة' : `الآيات ${ARN(vs[0])}–${ARN(vs[vs.length - 1])}`) : `الآية ${ARN(vs[0])}`;
  if (o.plan === 'hafiz') { vs.forEach((n, i) => { step([n], o.rep, `الآية ${ARN(n)}`); if (i) step([vs[i - 1], n], 3, `ربط الآيتين ${ARN(vs[i - 1])}–${ARN(n)}`); }); if (vs.length > 2) step(vs, 2, all); }
  else if (o.plan === 'each') { vs.forEach(n => step([n], o.rep, `الآية ${ARN(n)}`)); if (vs.length > 1) step(vs, 1, all); }
  else if (o.plan === 'review') step(vs, 3, all);
  else step(vs, 1, all);
  return out.map(x => ({ ...x, file: aurl(rid, x.n), s: Math.max(0, tim(rid, x.n).t0 - 120), e: Math.min(tim(rid, x.n).d, tim(rid, x.n).t1 + 220), gap: Math.round(x.gap) }));
}
const ppTotal = (items, rate) => items.reduce((a, x) => a + (x.e - x.s) / rate + x.gap / rate, 0);
function openProPlayer() {
  const L = Gx.open('ppv', 'مشغّل الحفظ', 'headphones'); PP.L = L;
  S.pp = S.pp || {};
  const mem = memorizedVerses(), nx = nextStation();
  const o = PP.o = Object.assign({ from: nx && nx.id <= 4 ? nx.verses[0] : mem[0] || 1, to: nx && nx.id <= 4 ? nx.verses[nx.verses.length - 1] : 3, plan: 'hafiz', rep: 5, echo: true, rate: 1, sleep: 0 }, S.pp.o || {});
  const draw = () => {
    const items = ppBuild(o), total = ppTotal(items, o.rate);
    html(L.body, `<div class="ppwrap">
      <p class="muted sthint">للطريق والمطبخ والسيارة: يكرر القارئ الآيات على طريقة الحفّاظ، ويترك لك بعد كل آية وقتًا لتعيدها.${ppNative() ? ' يعمل والشاشة مطفأة، وتتحكم به من شاشة القفل وأزرار السمّاعة والسيارة.' : ''}</p>
      <div class="ppnow" id="ppNow">${ppNowHTML()}</div>
      <h4 class="lrh">الآيات</h4>
      <div class="row strange"><label>من الآية ${vRangeSel('ppFrom', o.from)}</label><label>إلى الآية ${vRangeSel('ppTo', o.to)}</label></div>
      <div class="chips">${STATIONS.slice(0, 4).map(s => `<button class="chip" data-q="${s.verses[0]}-${s.verses[s.verses.length - 1]}">${s.name}</button>`).join('')}<button class="chip" data-q="1-${NV}">السورة كاملة</button></div>
      <h4 class="lrh">الخطة</h4>
      <div class="ppplans">${Object.entries(PP_PLANS).map(([k, p]) => `<button class="ppplan${o.plan === k ? ' on' : ''}" data-plan="${k}"><b>${p.t}</b><span>${p.d}</span></button>`).join('')}</div>
      ${o.plan === 'hafiz' || o.plan === 'each' ? `<div class="chips"><span class="dim">كل آية:</span>${[3, 5, 7, 10].map(r => `<button class="chip${o.rep === r ? ' on' : ''}" data-rep="${r}">${ARN(r)} مرات</button>`).join('')}</div>` : ''}
      <label class="toggle"><span>${ic('echo')} وقتٌ بعد كل آية لتعيدها بصوتك</span><input type="checkbox" id="ppEcho" ${o.echo ? 'checked' : ''}></label>
      <div class="chips"><span class="dim">السرعة:</span>${[.75, 1, 1.25].map(r => `<button class="chip${o.rate === r ? ' on' : ''}" data-rate="${r}">${ARN(String(r).replace('.', '٫'))}×</button>`).join('')}</div>
      <div class="chips"><span class="dim">مؤقّت النوم:</span>${[0, 15, 30, 45].map(m => `<button class="chip${o.sleep === m ? ' on' : ''}" data-sleep2="${m}">${m ? ARN(m) + ' دقيقة' : 'بلا'}</button>`).join('')}</div>
      <p class="ppsum">${ic('timer')} ${o.plan === 'loop' ? `دورة واحدة نحو ${fmtTime(total / 1000)}، وتتكرر حتى توقفها` : `${cnt(items.length, ['تلاوة واحدة', 'تلاوتان', 'تلاوات', 'تلاوة'])} · نحو ${fmtTime(total / 1000)}`}</p>
      <p class="dim stsmall">${ppNative() ? 'القارئ: ' + esc(RNAME(Player.rid)) + '. تُغيّره من «القرّاء» في الإعدادات.' : 'في المتصفح قد يتوقف الصوت عند إطفاء الشاشة على بعض الأجهزة؛ تطبيق أندرويد يكمل دائمًا.'}</p>
    </div>`);
    const sync = () => { S.pp.o = { ...o }; save(); draw(); };
    $('#ppFrom', L.body).onchange = e => { o.from = +e.target.value; sync(); };
    $('#ppTo', L.body).onchange = e => { o.to = +e.target.value; sync(); };
    $('#ppEcho', L.body).onchange = e => { o.echo = e.target.checked; sync(); };
    L.body.onclick = e => {
      const q = e.target.closest('[data-q]'); if (q) { [o.from, o.to] = q.dataset.q.split('-').map(Number); sync(); return; }
      const p = e.target.closest('[data-plan]'); if (p) { o.plan = p.dataset.plan; sync(); return; }
      const r = e.target.closest('[data-rep]'); if (r) { o.rep = +r.dataset.rep; sync(); return; }
      const ra = e.target.closest('[data-rate]'); if (ra) { o.rate = +ra.dataset.rate; sync(); return; }
      const sl = e.target.closest('[data-sleep2]'); if (sl) { o.sleep = +sl.dataset.sleep2; sync(); return; }
      const a = e.target.closest('[data-pp]')?.dataset.pp; if (!a) return;
      if (a === 'play') { if (PP.state === 'idle') ppStart(ppBuild(o), o); else ppCmd(PP.state === 'paused' ? 'resume' : 'pause'); }
      else ppCmd(a);
    };
  };
  PP.draw = draw; draw();
  if (ppNative()) { try { const st = JSON.parse(window.DuhaApp.ppState() || '{}'); if (st.state) window.__pp(st); } catch (e) { } }
  L.onClose = () => { PP.L = null; };
}
function ppNowHTML() {
  const it = PP.items[PP.i], on = PP.state !== 'idle';
  return `<div class="ppcover"><span>${on && it ? ARN(it.n) : ic('headphones')}</span></div>
    <div class="grow"><b>${on && it ? `الآية ${ARN(it.n)}` : 'جاهز'}</b><small>${on && it ? esc(it.label) : 'اختر الآيات والخطة ثم ابدأ'}</small>
    <div class="gbar ppbar"><i style="width:${PP.items.length && on ? (100 * (PP.i + 1) / PP.items.length).toFixed(1) : 0}%"></i></div>${PP.gapNow && on ? '<small class="ppyour">دورك: أعدها بصوتك</small>' : ''}</div>
    <div class="ppbtns"><button class="iconbtn" data-pp="prev" aria-label="السابق">${ic('next')}</button><button class="playbig" data-pp="play" aria-label="${PP.state === 'playing' ? 'أوقف مؤقتًا' : 'شغّل'}">${ic(PP.state === 'playing' ? 'pause' : 'play')}</button><button class="iconbtn" data-pp="next" aria-label="التالي">${ic('prev')}</button>${on ? `<button class="iconbtn" data-pp="stop" aria-label="إيقاف">${ic('x')}</button>` : ''}</div>`;
}
function ppPaint() { const b = PP.L && $('#ppNow', PP.L.body); if (b) b.innerHTML = ppNowHTML(); }
/* the Android service tells the page where it is */
window.__pp = st => {
  PP.native = true; PP.state = st.state || 'idle'; PP.gapNow = !!st.gap;
  if (PP.state === 'idle') { PP.i = -1; ppPaint(); return; }
  PP.i = st.i ?? PP.i;
  if (st.total && PP.items.length !== st.total) PP.items = Array.from({ length: st.total }, () => null);   /* the page reopened while the service played */
  if (st.label) PP.items[PP.i] = { n: st.n, label: st.label };
  ppPaint();
};
function ppStart(items, o) {
  if (!items.length) return;
  stopAll(); PP.items = items; PP.i = 0; PP.o = o; S.pp.runs = (S.pp.runs || 0) + 1; save(); award('pp');
  const sleepAt = o.sleep ? Date.now() + o.sleep * 60000 : 0;
  if (ppNative()) {
    PP.native = true; PP.state = 'playing';
    window.DuhaApp.ppStart(JSON.stringify({ items: items.map(x => ({ f: x.file, s: x.s, e: x.e, g: x.gap, n: x.n, l: x.label })), rate: o.rate, sleepMs: o.sleep * 60000, loop: o.plan === 'loop', reciter: RNAME(Player.rid) }));
    ppPaint(); return;
  }
  PP.native = false; PP.loop = o.plan === 'loop'; PP.sleepAt = sleepAt; ppMediaSession(); ppGo(0);
}
/* another sound in the app takes over: the memorization player waits instead of talking over it */
function ppYield() { if (PP.state === 'playing') ppCmd('pause'); }
function ppCmd(c) {
  if (PP.native && ppNative()) { window.DuhaApp.ppCmd(c); return; }
  if (c === 'stop') { PP.tok++; PPA.pause(); PP.state = 'idle'; PP.i = -1; PP.gapNow = false; try { navigator.mediaSession.playbackState = 'none'; } catch (e) { } ppPaint(); return; }
  if (c === 'pause') { PPA.pause(); PP.state = 'paused'; try { navigator.mediaSession.playbackState = 'paused'; } catch (e) { } ppPaint(); return; }
  if (c === 'resume') { PP.state = 'playing'; PPA.play().catch(() => { }); try { navigator.mediaSession.playbackState = 'playing'; } catch (e) { } ppPaint(); return; }
  if (c === 'next') ppGo(PP.i + 1); if (c === 'prev') ppGo(Math.max(0, PP.i - 1));
}
/* the browser engine: one audio element, pauses made of silence, so nothing depends on timers that sleep with the screen */
const ppSilence = new Map();
function ppSilentUrl(ms) {
  ms = Math.max(100, Math.round(ms / 100) * 100);
  if (!ppSilence.has(ms)) {
    const sr = 8000, n = Math.round(sr * ms / 1000), b = new ArrayBuffer(44 + n), v = new DataView(b), w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, sr, true); v.setUint32(28, sr, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, 'data'); v.setUint32(40, n, true);
    for (let i = 0; i < n; i++) v.setUint8(44 + i, 128);
    ppSilence.set(ms, URL.createObjectURL(new Blob([b], { type: 'audio/wav' })));
  }
  return ppSilence.get(ms);
}
function ppGo(i) {
  const my = ++PP.tok;
  if (i >= PP.items.length) { if (PP.loop && PP.items.length) i = 0; else { ppCmd('stop'); addXP(10); toast('أتممت الخطة، بارك الله فيك', 'check'); return; } }
  if (PP.sleepAt && Date.now() > PP.sleepAt) { ppCmd('stop'); toast('انتهى مؤقّت النوم', 'moon'); return; }
  const it = PP.items[i]; PP.i = i; PP.state = 'playing'; PP.gapNow = false;
  const url = it.file, s = it.s / 1000, e = it.e / 1000;
  PPA.src = AC.blobs.get(url) || url; PPA.playbackRate = PP.o.rate;
  const go = () => { if (my !== PP.tok) return; try { PPA.currentTime = s; } catch (er) { } PPA.playbackRate = PP.o.rate; PPA.play().catch(() => { PP.state = 'paused'; ppPaint(); }); };
  if (PPA.readyState >= 1) go(); else PPA.addEventListener('loadedmetadata', go, { once: true });
  const chk = () => { if (my !== PP.tok) { PPA.removeEventListener('timeupdate', chk); clearInterval(iv); return; } if (PPA.currentTime >= e) { PPA.removeEventListener('timeupdate', chk); clearInterval(iv); ppGap(i, my); } };
  PPA.addEventListener('timeupdate', chk); const iv = setInterval(chk, 60);
  try { navigator.mediaSession.metadata = new MediaMetadata({ title: it.label, artist: RNAME(Player.rid), album: 'رحلة الضحى · مشغّل الحفظ' }); navigator.mediaSession.playbackState = 'playing'; } catch (er) { }
  ppPaint();
}
function ppGap(i, my) {
  const it = PP.items[i]; PP.gapNow = it.gap > 600; ppPaint();
  PPA.src = ppSilentUrl(it.gap / PP.o.rate); PPA.playbackRate = 1;
  PPA.onended = () => { PPA.onended = null; if (my === PP.tok) ppGo(i + 1); };
  PPA.play().catch(() => { });
}
function ppMediaSession() {
  if (!('mediaSession' in navigator)) return;
  const h = (k, f) => { try { navigator.mediaSession.setActionHandler(k, f); } catch (e) { } };
  h('play', () => ppCmd('resume')); h('pause', () => ppCmd('pause')); h('stop', () => ppCmd('stop'));
  h('nexttrack', () => ppCmd('next')); h('previoustrack', () => ppCmd('prev'));
}

/* =====================================================================================
   109 · ساحة الأمة الحية
   ===================================================================================== */
const AYA = ['آية واحدة', 'آيتان', 'آيات', 'آية'];
const sqWeek = (k = dayKey()) => addDays(k, -((keyDate(k).getDay() + 1) % 7));   // weeks start on Saturday
/* the verses you recited or reviewed today: the only number you ever share */
function sqNote(vs) {
  const d = dayKey(), w = sqWeek(d);
  S.sq = S.sq || {};
  if (S.sq.w !== w) { S.sq.w = w; S.sq.wn = 0; }
  if (S.sq.d !== d) { S.sq.d = d; S.sq.v = []; }
  let add = 0; for (const n of vs || []) if (n >= 1 && n <= NV && !S.sq.v.includes(n)) { S.sq.v.push(n); add++; }
  if (!add) return; S.sq.wn += add; save(); sqPush();
}
const Sq = { L: null, db: null, room: null, uid: null, docs: [], unsub: null, rm: null, rmUn: [], nick: '', peersN: 0, pushT: 0 };
async function sqCaps() {
  if (Sq.ready) return Sq.ready;
  Sq.ready = (async () => {
    if (!window.claude || typeof window.claude.use !== 'function') return false;
    try { const [db, user, room] = await Promise.all([window.claude.use('db'), window.claude.use('user'), window.claude.use('room')]); Sq.db = db; Sq.room = room; Sq.uid = user ? await user.id() : null; } catch (e) { }
    return !!(Sq.db && Sq.uid);
  })();
  return Sq.ready;
}
function sqPush() {
  if (!S.square || !S.square.on) return;
  clearTimeout(Sq.pushT);
  Sq.pushT = setTimeout(async () => {
    if (!(await sqCaps())) return;
    const d = dayKey(), w = sqWeek(d), sq = S.sq || {};
    const body = { c: S.square.city ?? null, d, n: sq.d === d ? (sq.v || []).length : 0, w, wn: sq.w === w ? sq.wn || 0 : 0, t: Date.now() };
    const key = JSON.stringify({ ...body, t: 0 }); if (key === Sq.lastPush) return;
    try { await Sq.db.doc('square/' + Sq.uid).set(body); Sq.lastPush = key; } catch (e) { Sq.pushErr = e && e.code; }
  }, 1500);
}
async function sqForget() { if (!(await sqCaps())) return; try { await Sq.db.doc('square/' + Sq.uid).delete(); Sq.lastPush = null; } catch (e) { } }
function openSquare() {
  const L = Gx.open('sqv', 'ساحة الأمة الحية', 'people'); Sq.L = L;
  S.square = S.square || { on: false, city: null };
  L.onClose = () => { if (Sq.unsub) Sq.unsub(); Sq.unsub = null; sqLeaveRoom(); if (Sq.lobbyUn) Sq.lobbyUn(); Sq.lobbyUn = null; try { Sq.room && Sq.room.presence({ sq: null }); } catch (e) { } Sq.L = null; };
  sqDraw();
  sqCaps().then(ok => {
    if (!Sq.L) return;
    if (ok) {
      Sq.unsub = Sq.db.collection('square').onSnapshot(snap => { Sq.docs = snap.docs.map(d => ({ id: d.id, ...d.data() })); sqDraw(); }, () => { Sq.docs = []; });
      sqPush();
    }
    if (Sq.room) {
      Sq.room.presence({ sq: 1 }).catch(() => { });
      Sq.lobbyUn = Sq.room.onPeers(ch => { Sq.peersN = ch.peers.filter(p => p.presence && p.presence.sq).length; const b = Sq.L && $('#sqNow', Sq.L.body); if (b) b.textContent = Sq.peersN > 1 ? `معك في الساحة الآن ${ARN(Sq.peersN - 1)}` : ''; });
    }
    sqDraw();
  });
}
function sqStats() {
  const d = dayKey(), w = sqWeek(d), mine = { c: S.square.on ? S.square.city : null, d: S.sq && S.sq.d === d ? (S.sq.v || []).length : 0, wn: S.sq && S.sq.w === w ? S.sq.wn || 0 : 0 };
  const docs = Sq.docs.filter(x => x.id !== Sq.uid && x.w === w);
  if (S.square.on) docs.push({ id: 'me', c: mine.c, d: mine.d ? d : null, n: mine.d, w, wn: mine.wn, me: true });
  const today = docs.filter(x => x.d === d && x.n > 0), cities = {};
  for (const x of docs) if (x.c != null && CITIES[x.c]) { const k = x.c; cities[k] = cities[k] || { k, today: 0, week: 0, me: false }; cities[k].week++; if (x.d === d && x.n > 0) cities[k].today++; if (x.me) cities[k].me = true; }
  const total = docs.reduce((a, x) => a + (x.wn || 0), 0), people = docs.length, goal = Math.max(70, people * 70);
  return { today: today.length, todayVerses: today.reduce((a, x) => a + (x.n || 0), 0), cities: Object.values(cities), total, people, goal, mine };
}
function sqMap(st) {
  const P = (lat, lon) => [lon + 180, 90 - lat];
  return `<svg class="sqmap" viewBox="0 12 360 136" role="img" aria-label="خريطة العالم">
    <defs><radialGradient id="sqg"><stop offset="0" stop-color="#fff3c4"/><stop offset=".35" stop-color="#ffd77a"/><stop offset="1" stop-color="rgba(255,190,80,0)"/></radialGradient></defs>
    <path d="${GOLDD.land}" fill="#1c2560" stroke="#3a4796" stroke-width=".35"/>
    ${st.cities.map(c => { const [x, y] = P(CITIES[c.k][1], CITIES[c.k][2]), r = c.today ? 3 + Math.min(6, c.today * 1.2) : 2.2; return `<g class="sqdot${c.today ? ' on' : ''}${c.me ? ' me' : ''}"><circle cx="${x}" cy="${y}" r="${r * 1.9}" fill="url(#sqg)" opacity="${c.today ? .9 : .35}"/><circle cx="${x}" cy="${y}" r="${c.today ? 1.2 : .8}" fill="#fff8e0"/>${c.me ? `<circle cx="${x}" cy="${y}" r="${r * 1.2}" fill="none" stroke="#bfe4ff" stroke-width=".5"/>` : ''}<title>${CITIES[c.k][0]}: ${c.today ? cnt(c.today, ["واحدٌ يسمّع اليوم", "اثنان يسمّعان اليوم", "يسمّعون اليوم", "يسمّعون اليوم"]) : "هذا الأسبوع"}</title></g>`; }).join('')}
  </svg>`;
}
function sqDraw() {
  const L = Sq.L; if (!L) return;
  if (Sq.rm) return;   // inside a live room
  const st = sqStats(), live = !!(Sq.db && Sq.uid), T = S.square, pct = clamp(st.total / st.goal);
  html(L.body, `<div class="sqwrap">
    <p class="muted sthint">نقاطٌ ذهبية تضيء في كل مدينةٍ سمّع فيها أحدٌ آيةً اليوم: بلا أسماء، ولا يظهر إلا من وافق.</p>
    <div class="sqbox">${sqMap(st)}<span class="sqnow" id="sqNow"></span></div>
    <div class="sqstats"><div><b>${ARN(st.today)}</b><span>يسمّعون اليوم</span></div><div><b>${ARN(st.cities.filter(c => c.today).length)}</b><span>مدن مضيئة</span></div><div><b>${ARN(st.todayVerses)}</b><span>آية اليوم</span></div></div>
    <div class="card sqgoal"><div class="row"><b class="grow">${ic('target')} هدفنا هذا الأسبوع</b><span>${ARN(st.total)} / ${ARN(st.goal)} آية</span></div>
      <div class="gbar"><i style="width:${(pct * 100).toFixed(1)}%"></i></div>
      <p class="dim">${st.people > 1 ? `${ARN(st.people)} مشاركين: عشر آياتٍ لكل واحدٍ في اليوم تكفي لنبلغه معًا.` : 'ادعُ أهلك وأصحابك إلى الساحة: هدفنا يكبر بعددنا.'}</p></div>
    <div class="card sqme"><h4>${ic('pin')} نقطتك</h4>
      <label class="toggle"><span>شارك نقطتي في الساحة (بلا اسم)</span><input type="checkbox" id="sqOn" ${T.on ? 'checked' : ''} ${live ? '' : 'disabled'}></label>
      <label class="sqcity">مدينتك <select id="sqCity"><option value="">لا أريد إظهار مدينة</option>${CITIES.map((c, i) => `<option value="${i}"${T.city === i ? ' selected' : ''}>${c[0]}</option>`).join('')}</select></label>
      <p class="dim stsmall">ما يُشارَك فقط: المدينة التي تختارها، وعدد الآيات التي سمّعتها أو راجعتها اليوم وهذا الأسبوع. لا اسم ولا موقع دقيق. تستطيع إيقافه في أي وقت فيُحذف.</p>
      <p class="sqmine">اليوم: ${st.mine.d ? cnt(st.mine.d, AYA) : 'لا شيء بعد'} · هذا الأسبوع: ${st.mine.wn ? cnt(st.mine.wn, AYA) : 'لا شيء بعد'}</p></div>
    <div class="card sqrooms"><h4>${ic('twins')} غرفة مراجعة حيّة</h4><p class="dim">ادعُ أصحابك إلى غرفة: تسمعون الآية نفسها في اللحظة نفسها، وتشجّعون بعضكم.</p>
      ${Sq.room ? `<input id="sqNick" maxlength="20" placeholder="اسمٌ مستعار (اختياري)" value="${esc(Sq.nick || '')}"><div class="row trbtns"><button class="btn btn-sun" data-sq="new">${ic('sparkle')} غرفة جديدة</button><input id="sqCode" inputmode="numeric" maxlength="4" placeholder="رمز الغرفة"><button class="btn btn-line" data-sq="join">ادخل</button></div>`
        : '<p class="warn">الغرف الحيّة تعمل في نسخة Claude بين من تشاركهم رابطها.</p>'}</div>
    <p class="dim stsmall">${live ? 'الساحة هنا تجمع كل من يفتح هذا الرابط ممن تشاركه معهم. أما خريطةٌ للعالم كله فتحتاج خادمًا خاصًا.' : 'الساحة الحيّة تعمل في نسخة Claude بين من تشاركهم رابطها. هنا ترى نقطتك أنت فقط، وتبقى أرقامك على جهازك.'}</p>
  </div>`);
  const on = $('#sqOn', L.body); if (on) on.onchange = e => { T.on = e.target.checked; save(); if (T.on) { award('square'); sqPush(); } else sqForget(); sqDraw(); };
  $('#sqCity', L.body).onchange = e => { T.city = e.target.value === '' ? null : +e.target.value; save(); sqPush(); sqDraw(); };
  L.body.onclick = e => {
    const a = e.target.closest('[data-sq]')?.dataset.sq; if (!a) return;
    Sq.nick = ($('#sqNick', L.body)?.value || '').trim().slice(0, 20);
    if (a === 'new') sqJoin(String(1000 + Math.floor(Math.random() * 9000)), true);
    if (a === 'join') { const c = ($('#sqCode', L.body)?.value || '').trim(); if (/^\d{4}$/.test(c)) sqJoin(c, false); else toast('اكتب رمز الغرفة: أربعة أرقام', 'x'); }
  };
}
/* a live room: everything travels as presence, which everyone may set — the host's «play» carries a moment on the clock */
async function sqJoin(code, host) {
  let rm; try { rm = await Sq.room.join('duha-' + code); } catch (e) { toast('تعذّر دخول الغرفة', 'x'); return; }
  if (!Sq.L) { rm.leave(); return; }
  Sq.rm = rm; Sq.code = code; Sq.host = host; Sq.seen = {}; Sq.react = 0; Sq.cmd = 0; Sq.done = 0;
  await rm.presence({ nick: Sq.nick || '', host: host ? 1 : 0, at: Date.now() }).catch(() => { });
  sqRoomDraw();
  Sq.rmUn.push(rm.onPeers(ch => {
    for (const p of [...ch.joined, ...ch.updated]) {
      const pr = p.presence || {}, fresh = ch.updated.includes(p);
      if (pr.react && pr.react.k && Sq.seen['r' + p.peer] !== pr.react.k) { Sq.seen['r' + p.peer] = pr.react.k; if (!p.sameTab && fresh) sqBurst(pr.react.e); }
      if (!p.sameTab && pr.host && pr.play && pr.play.k && Sq.seen['p' + p.peer] !== pr.play.k) { Sq.seen['p' + p.peer] = pr.play.k; sqPlayAt(rm, pr.play.vs, pr.play.at, fresh); Sq.done = pr.done || Sq.done; }
    }
    sqRoomPeople();
  }));
}
/* everyone starts the same verses at the same moment on the clock; the host plays its own copy instead of waiting for an echo */
function sqPlayAt(rm, vs, at, fresh = true) {
  if (!Array.isArray(vs) || !vs.length) return;
  let wait = at - Date.now();
  if (wait < -2500 || wait > 8000) { if (!fresh) return; wait = 1200; }   /* that phone's clock is far off: the command is new, so start almost at once */
  vs = vs.map(Number).filter(n => Number.isInteger(n) && n >= 1 && n <= NV); if (!vs.length) return;
  setTimeout(() => { if (Sq.rm === rm) { Sfx.init(); playSeq(vs, { gap: 500 }); sqNote(vs); } }, Math.max(0, wait));
}
function sqRoomDraw() {
  const L = Sq.L; if (!L) return;
  html(L.body, `<div class="sqwrap sqroom">
    <div class="sqcode"><span class="dim">رمز الغرفة</span><b>${ARN(Sq.code)}</b><small>أرسله لأصحابك ليدخلوا من «ساحة الأمة الحية»</small></div>
    <div class="sqpeople" id="sqPeople"></div>
    ${Sq.host ? `<h4 class="lrh">اختر ما تقرؤونه معًا</h4><div class="chips sqvs">${verseRange(1, NV).map(n => `<button class="chip" data-sv="${n}">${ARN(n)}</button>`).join('')}<button class="chip" data-sv="all">السورة كاملة</button></div><p class="dim stsmall">تبدأ التلاوة عند الجميع في اللحظة نفسها بعد ثانيتين.</p>`
      : '<p class="muted" style="text-align:center">صاحب الغرفة يختار الآيات، وتسمعونها معًا في اللحظة نفسها.</p>'}
    <div class="sqreact">${[['masha', 'ما شاء الله'], ['barak', 'بارك الله فيك'], ['star', '⭐'], ['heart', '💛']].map(([k, t]) => `<button class="chip" data-re="${k}">${t}</button>`).join('')}</div>
    <div class="sqburst" id="sqBurst" aria-hidden="true"></div>
    <button class="btn btn-line btn-wide" data-sq="leave">${ic('x')} اخرج من الغرفة</button>
  </div>`);
  sqRoomPeople();
  L.body.onclick = e => {
    const v = e.target.closest('[data-sv]'); if (v && Sq.host) { const vs = v.dataset.sv === 'all' ? verseRange(1, NV) : [+v.dataset.sv]; const at = Date.now() + 2000; Sq.cmd++; Sq.done += vs.length; Sq.rm.presence({ play: { vs, at, k: Sq.cmd }, done: Sq.done }).catch(() => { }); sqPlayAt(Sq.rm, vs, at); sqRoomPeople(); return; }
    const r = e.target.closest('[data-re]'); if (r) { Sq.react++; Sq.rm.presence({ react: { e: r.dataset.re, k: Sq.react } }).catch(() => { }); sqBurst(r.dataset.re); return; }
    if (e.target.closest('[data-sq="leave"]')) { sqLeaveRoom(); sqDraw(); }
  };
}
function sqRoomPeople() {
  const box = Sq.L && $('#sqPeople', Sq.L.body); if (!box || !Sq.rm) return;
  const ps = Sq.rm.peers(); let i = 0;
  box.innerHTML = `<span class="dim">في الغرفة ${ARN(ps.length)}${Sq.done ? `، قرأتم معًا ${cnt(Sq.done, AYA)}` : ''}</span><div class="sqpp">${ps.map(p => { const pr = p.presence || {}; i++; return `<span class="${p.sameTab ? 'me' : ''}">${pr.host ? ic('crown') : ''}${esc(String(pr.nick || '').slice(0, 20) || 'صاحب ' + ARN(i))}${p.sameTab ? ' (أنت)' : ''}</span>`; }).join('')}</div>`;
}
const SQ_RE = { masha: 'ما شاء الله', barak: 'بارك الله فيك', star: '⭐', heart: '💛' };
function sqBurst(k) {
  const b = Sq.L && $('#sqBurst', Sq.L.body); if (!b || !SQ_RE[k]) return;
  const el = node(`<span class="sqfly" style="left:${15 + Math.random() * 70}%">${SQ_RE[k]}</span>`); b.appendChild(el); setTimeout(() => el.remove(), 2600);
}
function sqLeaveRoom() { for (const u of Sq.rmUn) { try { u(); } catch (e) { } } Sq.rmUn = []; if (Sq.rm) { try { Sq.rm.leave(); } catch (e) { } } Sq.rm = null; }
