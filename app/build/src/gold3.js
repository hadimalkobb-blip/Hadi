/* ===== The golden features, part three (v4.2)
   «الضحى الغامر ٣٦٠°» (102): real 360° photographs to stand inside — look around by dragging or by moving the phone, the
   reciter in front of you in 3-D sound, nature around you between the verses, and a cardboard-viewer mode.
   «كنز الضحى في بيتك» (110): printed symbol cards (never the verse text) hidden around the house; the child scans them in
   order, each opens its verse in the reciter's voice, and the last one reveals where the parents hid a real treasure. ===== */

/* =====================================================================================
   102 · الضحى الغامر ٣٦٠°
   ===================================================================================== */
/* front = the longitude (0..1 across the photo) that faces you first; the reciter stands there */
const IMM = [
  { k: 'duha', t: 'ضحى الصحراء', d: 'شمسٌ عالية فوق صحراء صخرية', img: 'pano/duha.jpg', front: .47, pitch: 4, vs: [1, 6, 7, 8, 9, 10, 11], amb: [['dawn', 85, .5], ['palms', 180, .32]] },
  { k: 'layl', t: 'الليل إذا سجى', d: 'ليلٌ ساكن تحت درب التبانة', img: 'pano/layl.jpg', front: .62, pitch: 16, vs: [2], amb: [['night', -95, .5], ['night', 100, .32], ['palms', 180, .14]] },
  { k: 'fajr', t: 'فجرٌ بعد ليل', d: 'النور يعود بعد الظلام', img: 'pano/fajr.jpg', front: .6, pitch: 6, vs: [3, 4, 5], amb: [['dawn', 95, .5], ['palms', 180, .26]] },
];
/* the surah's journey: the sky each verse lives under — the forenoon, the still night, the dawn of reassurance,
   then the daylight of blessings remembered */
const IMM_SKY = n => n === 2 ? 'layl' : n >= 3 && n <= 5 ? 'fajr' : 'duha';
const Imm = { L: null, gl: null, scene: null, yaw: 0, pitch: 0, fov: 72, vr: false, gyro: false, q: null, off: 0, mix: 1, tex: [], vel: [0, 0], raf: 0, cap: true };
const ImmA = { ctx: null, bufs: new Map(), amb: [], tok: 0, cur: null, playing: false };

/* ---------- small quaternion helpers for the phone's orientation ---------- */
const qMul = (a, b) => [a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1], a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0], a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3], a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]];
const qAxis = (x, y, z, a) => { const s = Math.sin(a / 2); return [x * s, y * s, z * s, Math.cos(a / 2)]; };
function qRot(q, v) {  // rotate vector v by quaternion q
  const [x, y, z, w] = q, ix = w * v[0] + y * v[2] - z * v[1], iy = w * v[1] + z * v[0] - x * v[2], iz = w * v[2] + x * v[1] - y * v[0], iw = -x * v[0] - y * v[1] - z * v[2];
  return [ix * w + iw * -x + iy * -z - iz * -y, iy * w + iw * -y + iz * -x - ix * -z, iz * w + iw * -z + ix * -y - iy * -x];
}
/* device orientation → camera (as browsers report it: alpha, beta, gamma in degrees; screen angle) */
function qDevice(al, be, ga, orient) {
  const r = Math.PI / 180, x = be * r, y = al * r, z = -ga * r;
  const c1 = Math.cos(x / 2), c2 = Math.cos(y / 2), c3 = Math.cos(z / 2), s1 = Math.sin(x / 2), s2 = Math.sin(y / 2), s3 = Math.sin(z / 2);
  let q = [s1 * c2 * c3 + c1 * s2 * s3, c1 * s2 * c3 - s1 * c2 * s3, c1 * c2 * s3 - s1 * s2 * c3, c1 * c2 * c3 + s1 * s2 * s3];  // Euler YXZ
  q = qMul(q, [-Math.SQRT1_2, 0, 0, Math.SQRT1_2]);   // the camera looks out of the back of the phone
  return qMul(q, qAxis(0, 0, 1, -orient * r));
}
const yawOf = f => Math.atan2(f[0], -f[2]);

/* ---------- the renderer: one full-screen triangle pair, the photo sampled by direction ---------- */
const IMM_VS = 'attribute vec2 p;varying vec2 v;void main(){v=p;gl_Position=vec4(p,0.,1.);}';
const IMM_FS = `precision highp float;varying vec2 v;
uniform sampler2D t0,t1;uniform float mx,f0,f1,vr,asp,th;uniform mat3 R;
vec4 smp(sampler2D t,vec3 d,float f){float u=fract(atan(d.x,-d.z)/6.2831853+f);float w=acos(clamp(d.y,-1.,1.))/3.1415927;return texture2D(t,vec2(u,w));}
void main(){vec2 p=v;float a=asp;
 if(vr>.5){float e=p.x<0.?-1.:1.;p.x=(p.x-e*.5)*2.;a=asp*.5;vec2 q=vec2(p.x*a,p.y);float r2=dot(q,q)*.62;q*=1.+.34*r2+.55*r2*r2;
  if(length(vec2(p.x*a,p.y))>1.22){gl_FragColor=vec4(0.,0.,0.,1.);return;}p=vec2(q.x/a,q.y);}
 vec3 d=normalize(R*vec3(p.x*th*a,p.y*th,-1.));
 vec4 c=smp(t0,d,f0);if(mx<.999)c=mix(smp(t1,d,f1),c,mx);gl_FragColor=c;}`;
function immGL(cv) {
  const gl = cv.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: false }) || cv.getContext('experimental-webgl');
  if (!gl) return null;
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, IMM_VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, IMM_FS)); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
  gl.useProgram(pr);
  const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = {}; for (const k of ['t0', 't1', 'mx', 'f0', 'f1', 'vr', 'asp', 'th', 'R']) U[k] = gl.getUniformLocation(pr, k);
  gl.uniform1i(U.t0, 0); gl.uniform1i(U.t1, 1);
  return { gl, U, max: gl.getParameter(gl.MAX_TEXTURE_SIZE) };
}
function immTexture(G, img) {
  const gl = G.gl; let src = img;
  if (img.naturalWidth > G.max) { const c = document.createElement('canvas'); c.width = G.max; c.height = G.max / 2; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); src = c; }
  const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, src);
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  return t;
}
const immImgs = new Map();
function immLoadImg(url) {
  if (!immImgs.has(url)) immImgs.set(url, new Promise((res, rej) => { const im = new Image(); im.decoding = 'async'; im.onload = () => res(im); im.onerror = rej; im.src = url; }));
  return immImgs.get(url);
}
/* the camera basis: from the phone's orientation, or from dragging (yaw, pitch) */
function immBasis() {
  let q;
  if (Imm.gyro && Imm.q) q = qMul(qAxis(0, 1, 0, -Imm.off), Imm.q);
  else q = qMul(qAxis(0, 1, 0, -Imm.yaw), qAxis(1, 0, 0, Imm.pitch));
  return { r: qRot(q, [1, 0, 0]), u: qRot(q, [0, 1, 0]), b: qRot(q, [0, 0, 1]), f: qRot(q, [0, 0, -1]) };
}
function immDraw() {
  const G = Imm.G, cv = Imm.cv; if (!G || !cv || !Imm.tex[0]) return;
  const gl = G.gl, dpr = Math.min(2, window.devicePixelRatio || 1), w = Math.round(cv.clientWidth * dpr), h = Math.round(cv.clientHeight * dpr);
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  gl.viewport(0, 0, w, h);
  const B = immBasis(); Imm.B = B;
  gl.uniformMatrix3fv(G.U.R, false, new Float32Array([...B.r, ...B.u, ...B.b]));
  gl.uniform1f(G.U.asp, w / h); gl.uniform1f(G.U.vr, Imm.vr ? 1 : 0);
  gl.uniform1f(G.U.th, Math.tan((Imm.vr ? 48 : Imm.fov / 2) * Math.PI / 180));
  gl.uniform1f(G.U.mx, Imm.mix); gl.uniform1f(G.U.f0, Imm.f[0]); gl.uniform1f(G.U.f1, Imm.f[1] ?? Imm.f[0]);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, Imm.tex[0]);
  gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, Imm.tex[1] || Imm.tex[0]);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function openImmersive(k) {
  libImm();
  const L = Gx.open('imv', 'الضحى الغامر ٣٦٠°', 'globe'); Imm.L = L;
  S.imm = S.imm || {};
  const canGyro = typeof DeviceOrientationEvent !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
  html(L.body, `<div class="imwrap">
    <canvas id="imCv" aria-label="مشهدٌ حقيقي بزاوية ٣٦٠ درجة"></canvas>
    <div class="imcomp" id="imComp" aria-hidden="true"><i></i><b></b></div>
    <div class="imhint" id="imHint">${canGyro ? 'حرّك جوالك أو اسحب لتلتفت حولك' : 'اسحب لتلتفت حولك'}</div>
    <div class="imcap" id="imCap" hidden></div>
    <div class="imbar">
      <div class="chips imsc" id="imSc">${IMM.map(s => `<button class="chip" data-sc="${s.k}">${s.t}</button>`).join('')}</div>
      <div class="imctl">
        <button class="btn btn-sun" id="imJ">${ic('play')} رحلة السورة</button>
        <button class="btn btn-line" id="imV">${ic('sound')} آيات المشهد</button>
        ${canGyro ? `<button class="iconbtn" id="imG" aria-label="حرّك جوالك">${ic('phone')}</button>` : ''}
        <button class="iconbtn" id="imVR" aria-label="نظارة الواقع الافتراضي">${ic('vr')}</button>
        <button class="iconbtn on" id="imT" aria-label="نص الآيات">${ic('text')}</button>
      </div>
      <p class="imnote">${ic('headphones')} ضع السمّاعات: القارئ أمامك، والعصافير عن يمينك، والريح خلفك. وأصوات الطبيعة تسكن حين يتلو القارئ.</p>
    </div>
    <div class="imfail" id="imFail" hidden></div>
    <button class="imvrx" id="imVRx" hidden>${ic('x')} خروج من النظارة</button>
  </div>`);
  const cv = Imm.cv = $('#imCv', L.body);
  try { Imm.G = immGL(cv); } catch (e) { console.error(e); Imm.G = null; }
  if (!Imm.G) { const f = $('#imFail', L.body); f.hidden = false; f.textContent = 'جهازك لا يدعم العرض ثلاثي الأبعاد (WebGL) هنا.'; }
  Imm.yaw = 0; Imm.pitch = 0; Imm.fov = 72; Imm.vr = false; Imm.gyro = false; Imm.q = null; Imm.tex = []; Imm.f = [.5]; Imm.mix = 1; Imm.scene = null;
  immBindLook(cv);
  const loop = t => {
    if (!Imm.L) return;
    if (!Imm.gyro && !Imm.drag && (Imm.vel[0] || Imm.vel[1])) {
      Imm.yaw += Imm.vel[0]; Imm.pitch = clamp(Imm.pitch + Imm.vel[1], -1.45, 1.45);
      Imm.vel = Imm.vel.map(x => Math.abs(x) < 1e-4 ? 0 : x * .92);
    }
    if (!document.hidden) { immDraw(); immTick(); }
    Imm.raf = requestAnimationFrame(loop);
  };
  Imm.raf = requestAnimationFrame(loop);
  L.onClose = () => {
    cancelAnimationFrame(Imm.raf); immStopRecite(); immAmbStop(); immGyro(false); immVR(false);
    if (Imm.G) { const ext = Imm.G.gl.getExtension('WEBGL_lose_context'); for (const t of Imm.tex) if (t) Imm.G.gl.deleteTexture(t); if (ext) ext.loseContext(); }
    Imm.G = null; Imm.L = null; Imm.tex = [];
    if (ImmA.ctx) { try { ImmA.ctx.suspend(); } catch (e) { } }
  };
  L.body.onclick = e => {
    const sc = e.target.closest('[data-sc]'); if (sc) { immStopRecite(); immScene(sc.dataset.sc); return; }
    const id = e.target.closest('button')?.id;
    if (id === 'imJ') { if (ImmA.playing) immStopRecite(); else immRecite([0, ...verseRange(1, NV)], true); return; }
    if (id === 'imV') { if (ImmA.playing) immStopRecite(); else immRecite(Imm.scene.vs, false); return; }
    if (id === 'imG') { immGyro(!Imm.gyro); return; }
    if (id === 'imVR') { immVR(true); return; }
    if (id === 'imVRx') { immVR(false); return; }
    if (id === 'imT') { Imm.cap = !Imm.cap; e.target.closest('button').classList.toggle('on', Imm.cap); immCap(); return; }
  };
  immAudio();
  immScene(k || S.imm.last || 'duha', true);
}
/* look around: drag with inertia, pinch or wheel to zoom */
function immBindLook(cv) {
  const pts = new Map(); let last = null, pinch = 0;
  cv.onpointerdown = e => {
    if (Imm.vr) { $('#imVRx', Imm.L.body).hidden = false; clearTimeout(Imm.vxT); Imm.vxT = setTimeout(() => { const x = Imm.L && $('#imVRx', Imm.L.body); if (x) x.hidden = true; }, 3500); return; }
    cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); Imm.drag = true; Imm.vel = [0, 0]; last = [e.clientX, e.clientY, performance.now()];
    if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); }
    const h = $('#imHint', Imm.L.body); if (h) h.classList.add('gone');
  };
  cv.onpointermove = e => {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 2) { const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch) Imm.fov = clamp(Imm.fov * pinch / d, 40, 100); pinch = d; return; }
    const k = (Imm.fov * Math.PI / 180) / Math.max(200, cv.clientHeight), dx = e.clientX - last[0], dy = e.clientY - last[1];
    if (Imm.gyro) Imm.off -= dx * k; else { Imm.yaw -= dx * k; Imm.pitch = clamp(Imm.pitch + dy * k, -1.45, 1.45); }
    const now = performance.now(), dt = Math.max(8, now - last[2]);
    Imm.vel = reduceMotion() || Imm.gyro ? [0, 0] : [-dx * k * 16 / dt, dy * k * 16 / dt];
    last = [e.clientX, e.clientY, now];
  };
  const up = e => { pts.delete(e.pointerId); if (!pts.size) Imm.drag = false; pinch = 0; };
  cv.onpointerup = up; cv.onpointercancel = up;
  cv.onwheel = e => { e.preventDefault(); Imm.fov = clamp(Imm.fov * (e.deltaY > 0 ? 1.06 : .94), 40, 100); };
}
async function immScene(k, first) {
  const s = IMM.find(x => x.k === k) || IMM[0], L = Imm.L; if (!L) return;
  if (Imm.scene === s && !first) return;
  const prev = Imm.scene; Imm.scene = s; S.imm.last = s.k; save();
  $$('#imSc .chip', L.body).forEach(x => x.classList.toggle('on', x.dataset.sc === s.k));
  if (!S.imm.seen || !S.imm.seen.includes(s.k)) { S.imm.seen = [...new Set([...(S.imm.seen || []), s.k])]; save(); }
  immAmb(s);
  if (!Imm.G) return;
  const my = Imm.ld = (Imm.ld || 0) + 1;
  let img; try { img = await immLoadImg(s.img || await s.get()); } catch (e) { const f = $('#imFail', L.body); if (f) { f.hidden = false; f.textContent = 'تعذّر تحميل صورة المشهد'; } return; }
  if (my !== Imm.ld || !Imm.L || !Imm.G) return;
  const t = immTexture(Imm.G, img), old = Imm.tex[0];
  if (!prev || !old) { Imm.tex = [t]; Imm.f = [s.front]; Imm.mix = 1; Imm.yaw = 0; Imm.pitch = s.pitch * Math.PI / 180; return; }
  /* cross-fade from the old sky to the new one */
  if (Imm.tex[1] && Imm.tex[1] !== old) Imm.G.gl.deleteTexture(Imm.tex[1]);
  Imm.tex = [t, old]; Imm.f = [s.front, prev.front]; Imm.mix = 0;
  const t0 = performance.now(), dur = reduceMotion() ? 1 : 1600;
  const step = now => { if (my !== Imm.ld) return; Imm.mix = clamp((now - t0) / dur); if (Imm.mix < 1) requestAnimationFrame(step); else { if (Imm.G && Imm.tex[1]) Imm.G.gl.deleteTexture(Imm.tex[1]); Imm.tex = [Imm.tex[0]]; Imm.f = [s.front]; } };
  requestAnimationFrame(step);
}
/* the phone becomes the window: its orientation steers the view */
async function immGyro(on) {
  const b = Imm.L && $('#imG', Imm.L.body);
  if (!on) { if (Imm.gyroH) window.removeEventListener('deviceorientation', Imm.gyroH); Imm.gyroH = null; if (Imm.gyro && Imm.B) { Imm.yaw = yawOf(Imm.B.f); Imm.pitch = Math.asin(clamp(Imm.B.f[1], -1, 1)); } Imm.gyro = false; Imm.q = null; if (b) b.classList.remove('on'); return; }
  try { if (typeof DeviceOrientationEvent.requestPermission === 'function' && (await DeviceOrientationEvent.requestPermission()) !== 'granted') { toast('لم يُسمح باستعمال حركة الجوال', 'x'); return; } } catch (e) { }
  let got = false;
  Imm.gyroH = e => {
    if (e.alpha == null) return;
    const orient = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
    Imm.q = qDevice(e.alpha, e.beta || 0, e.gamma || 0, orient);
    if (!got) { got = true; Imm.gyro = true; Imm.off = Imm.yaw - yawOf(qRot(Imm.q, [0, 0, -1])); if (b) b.classList.add('on'); }
  };
  window.addEventListener('deviceorientation', Imm.gyroH);
  setTimeout(() => { if (!got && Imm.gyroH) { immGyro(false); toast('جوالك لا يرسل حركته هنا. اسحب بإصبعك لتلتفت', 'phone'); } }, 1500);
}
/* cardboard viewer: two eyes, landscape, the phone's motion steers */
function immVR(on) {
  const L = Imm.L; if (!L) { Imm.vr = false; return; }
  if (on === Imm.vr) return;
  Imm.vr = on; L.el.classList.toggle('imvr', on);
  try { if (window.DuhaApp && window.DuhaApp.immersive) window.DuhaApp.immersive(on); } catch (e) { }
  if (on) {
    const el = document.documentElement;
    try { const p = el.requestFullscreen && el.requestFullscreen(); if (p && p.then) p.then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => { })).catch(() => { }); } catch (e) { }
    if (!Imm.gyro && $('#imG', L.body)) immGyro(true);
    toast('ضع الجوال بالعرض داخل النظارة. المس الشاشة للخروج', 'vr');
  } else {
    try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) { }
    $('#imVRx', L.body).hidden = true;
  }
}
/* ---------- 3-D sound: the reciter in front, nature around you ---------- */
function immAudio() {
  if (!ImmA.ctx) {
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
    ImmA.ctx = new C(); ImmA.master = ImmA.ctx.createGain(); ImmA.master.connect(ImmA.ctx.destination);
    ImmA.rec = ImmA.ctx.createGain(); ImmA.recP = immPanner(0, 1.4); ImmA.rec.connect(ImmA.recP).connect(ImmA.master);
  }
  if (ImmA.ctx.state === 'suspended') ImmA.ctx.resume().catch(() => { });
  return ImmA.ctx;
}
function immPanner(az, dist) {
  const c = ImmA.ctx, p = c.createPanner(); p.panningModel = 'HRTF'; p.distanceModel = 'inverse'; p.refDistance = 1; p.rolloffFactor = .6;
  const a = az * Math.PI / 180, x = Math.sin(a) * dist, z = -Math.cos(a) * dist;
  if (p.positionX) { p.positionX.value = x; p.positionY.value = 0; p.positionZ.value = z; } else p.setPosition(x, 0, z);
  return p;
}
function immBuf(url) {
  if (!ImmA.bufs.has(url)) ImmA.bufs.set(url, fetch(AC.blobs.get(url) || url).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
    .then(b => new Promise((res, rej) => { const p = ImmA.ctx.decodeAudioData(b, res, rej); if (p && p.then) p.then(res, rej); })).catch(e => { ImmA.bufs.delete(url); throw e; }));
  return ImmA.bufs.get(url);
}
/* an endless loop without a seam: the tail is folded over the head with an equal-power cross-fade */
function immLoopBuf(b) {
  if (b.__loop) return b.__loop;
  const sr = b.sampleRate, F = Math.min(Math.floor(sr * 1.5), Math.floor(b.length / 3)), N = b.length - F, out = ImmA.ctx.createBuffer(b.numberOfChannels, N, sr);
  for (let c = 0; c < b.numberOfChannels; c++) {
    const x = b.getChannelData(c), y = out.getChannelData(c);
    for (let i = 0; i < N; i++) y[i] = i < F ? x[i] * Math.sqrt(i / F) + x[N + i] * Math.sqrt(1 - i / F) : x[i];
  }
  return (b.__loop = out);
}
const immNatureOn = () => S.settings.nature !== false && !ImmA.playing;
async function immAmb(s) {
  if (!immAudio()) return;
  const my = ImmA.ambTok = (ImmA.ambTok || 0) + 1, c = ImmA.ctx;
  immAmbStop(.9);
  if (!MEDIA.amb) return;
  const nodes = [];
  for (const [k, az, vol] of s.amb) {
    if (!MEDIA.amb[k]) continue;
    let b; try { b = immLoopBuf(await immBuf(`amb/${k}.mp3`)); } catch (e) { continue; }
    if (my !== ImmA.ambTok || !Imm.L) return;
    const src = c.createBufferSource(), g = c.createGain(); src.buffer = b; src.loop = true;
    g.gain.value = 0; src.connect(g).connect(immPanner(az, 2.4)).connect(ImmA.master);
    src.start(0, (nodes.length * 17.3) % b.duration);
    nodes.push({ src, g, vol });
  }
  ImmA.amb = nodes; immAmbLevel();
}
function immAmbLevel(sec = 1.2) {
  const c = ImmA.ctx; if (!c) return;
  for (const n of ImmA.amb) { n.g.gain.cancelScheduledValues(c.currentTime); n.g.gain.setTargetAtTime(immNatureOn() ? n.vol : 0, c.currentTime, sec / 3); }
}
function immAmbStop(sec = .3) {
  const c = ImmA.ctx; if (!c) return;
  for (const n of ImmA.amb) { try { n.g.gain.setTargetAtTime(0, c.currentTime, sec / 3); n.src.stop(c.currentTime + sec + .2); } catch (e) { } }
  ImmA.amb = [];
}
/* the recitation, verse by verse, from the reciter's own files; the journey moves the sky with the verses */
async function immRecite(list, journey) {
  const c = immAudio(); if (!c) return;
  stopAll(); const my = ++ImmA.tok, rid = Player.rid;
  ImmA.playing = true; ImmA.journey = journey; immAmbLevel(.8); immButtons();
  try {
    for (let i = 0; i < list.length; i++) {
      const n = list[i];
      if (journey) immScene(n === 0 ? 'duha' : IMM_SKY(n));
      let b; try { b = await immBuf(aurl(rid, n)); } catch (e) { toast('تعذّر تحميل التلاوة', 'sound'); break; }
      if (my !== ImmA.tok) return;
      const t = tim(rid, n), a = Math.max(0, t.t0 - 120), e = Math.min(t.d, t.t1 + 220);
      const src = c.createBufferSource(); src.buffer = b; src.connect(ImmA.rec);
      const at = c.currentTime + (i ? .55 : .15);
      src.start(at, a / 1000, (e - a) / 1000);
      ImmA.cur = { n, at, a, src, rid };
      await new Promise(res => { src.onended = res; });
      if (my !== ImmA.tok) return;
      if (journey && n >= 1) { S.imm.heard = [...new Set([...(S.imm.heard || []), n])]; }
    }
    if (journey && my === ImmA.tok) { addXP(15); award('imm'); save(); }
    else if (my === ImmA.tok) addXP(5);
  } finally {
    if (my === ImmA.tok) { ImmA.playing = false; ImmA.cur = null; immAmbLevel(2); immButtons(); immCap(); }
  }
}
function immStopRecite() {
  ImmA.tok++; const cur = ImmA.cur; ImmA.cur = null;
  if (cur) { try { cur.src.onended = null; cur.src.stop(); } catch (e) { } }
  if (ImmA.playing) { ImmA.playing = false; immAmbLevel(1.5); }
  immButtons(); immCap();
}
function immButtons() {
  const L = Imm.L; if (!L) return;
  const j = $('#imJ', L.body), v = $('#imV', L.body);
  if (j) j.innerHTML = ImmA.playing && ImmA.journey ? `${ic('pause')} أوقف` : `${ic('play')} رحلة السورة`;
  if (v) v.innerHTML = ImmA.playing && !ImmA.journey ? `${ic('pause')} أوقف` : `${ic('sound')} آيات المشهد`;
}
/* the verse being recited, its word lit, under the view */
function immCap() {
  const box = Imm.L && $('#imCap', Imm.L.body); if (!box) return;
  const cur = ImmA.cur;
  if (!cur || !Imm.cap || Imm.vr) { box.hidden = true; box.dataset.n = ''; return; }
  if (box.dataset.n !== String(cur.n)) { box.dataset.n = cur.n; box.hidden = false; box.innerHTML = `<div class="qt night">${cur.n ? verseHTML(cur.n) : QD.verses[0].map((w, i) => `<span class="w" data-v="0" data-w="${i}">${esc(w)}</span>`).join(' ')}</div>`; }
}
function immTick() {
  const L = Imm.L, B = Imm.B; if (!L || !B) return;
  const c = ImmA.ctx;
  /* the listener turns with the view; the sounds stay where they are in the scene */
  if (c) {
    const li = c.listener, f = B.f, u = B.u;
    if (li.forwardX) { li.forwardX.value = f[0]; li.forwardY.value = f[1]; li.forwardZ.value = f[2]; li.upX.value = u[0]; li.upY.value = u[1]; li.upZ.value = u[2]; }
    else if (li.setOrientation) li.setOrientation(f[0], f[1], f[2], u[0], u[1], u[2]);
  }
  /* compass: where you look, and where the reciter stands */
  const ang = -yawOf(B.f) * 180 / Math.PI, comp = $('#imComp', L.body);
  if (comp) { comp.style.setProperty('--a', ang.toFixed(1) + 'deg'); const off = Math.abs(((ang + 540) % 360) - 180) > 70; comp.classList.toggle('away', off); }
  const cur = ImmA.cur;
  if (cur && c) {
    immCap();
    const ms = (c.currentTime - cur.at) * 1000 + cur.a, w = c.currentTime < cur.at ? -1 : wordAt(cur.rid, cur.n, ms);
    if (w !== Imm.hw) { Imm.hw = w; $$('#imCap .w', L.body).forEach(x => x.classList.toggle('on', +x.dataset.w === w)); }
  }
}

/* =====================================================================================
   110 · كنز الضحى في بيتك
   ===================================================================================== */
const TR_TAG = 'DUHA-KANZ-';
const trParse = s => { const m = /^DUHA-KANZ-(\d{1,2})$/.exec(String(s || '').trim()); return m && +m[1] >= 1 && +m[1] <= NV ? +m[1] : 0; };
const Tr = { L: null, scan: null };
function trState() {
  S.treasure = S.treasure || {};
  const T = S.treasure; T.clues = T.clues || {}; T.vs = T.vs && T.vs.length ? T.vs : verseRange(1, NV); T.found = T.found || [];
  return T;
}
function openTreasure() {
  const L = Gx.open('trv', 'كنز الضحى في بيتك', 'chest'); Tr.L = L;
  L.onClose = () => { trScanStop(); if (Tr.hl) Ticks.delete(Tr.hl); Tr.L = null; Tr.tok = (Tr.tok || 0) + 1; };
  trHome();
}
function trHome() {
  const L = Tr.L, T = trState(); trScanStop(); stopAll();
  const ready = !!T.ready, inGame = ready && T.found.length > 0 && T.found.length < T.vs.length;
  L.stat.textContent = ready ? `${ARN(T.found.length)} / ${ARN(T.vs.length)}` : '';
  html(L.body, `<div class="trwrap">
    <div class="trhero"><div class="trchest">${ic('chest')}</div><p>لعبة عيلة حقيقية: بطاقاتٌ مطبوعة مخبّأة في البيت، كل بطاقة تفتح آيةً بصوت القارئ، وآخر بطاقة تكشف مكان كنزٍ حقيقي خبّأه الأهل.</p></div>
    <div class="trsteps">${['اطبعوا البطاقات', 'اكتبوا أماكن الإخفاء والكنز', 'خبّئوها في البيت', 'البطل يبحث ويصوّر بالترتيب'].map((t, i) => `<span><b>${ARN(i + 1)}</b>${t}</span>`).join('')}</div>
    <button class="btn btn-line btn-wide" data-t="parents">${ic('lock')} للأهل: جهّزوا الكنز</button>
    <button class="btn btn-sun btn-wide" data-t="play" ${ready ? '' : 'disabled'}>${ic('star')} ${inGame ? `تابع البحث (${ARN(T.found.length)} من ${ARN(T.vs.length)})` : 'للبطل: ابدأ البحث'}</button>
    ${ready ? '' : '<p class="dim trsmall">يجهّز الأهل اللعبة أولًا، ثم يبدأ البحث.</p>'}
    ${T.wins ? `<p class="trwins">${ic('crown')} وجدتم الكنز ${cnt(T.wins, ['مرةً واحدة', 'مرتين', 'مرات', 'مرة'])}</p>` : ''}
    <p class="dim trsmall">احترامًا للقرآن لا تحمل البطاقات نصّ الآيات: عليها رموزٌ ورسوم فقط، والآية تظهر على الشاشة بصوت القارئ.</p>
  </div>`);
  L.body.onclick = e => {
    const t = e.target.closest('[data-t]')?.dataset.t;
    if (t === 'parents') trParents();
    if (t === 'play' && T.ready) { if (T.found.length >= T.vs.length) { T.found = []; save(); } trFind(); }
  };
}
/* ---------- parents: print, choose the cards, write the hiding places and the treasure ---------- */
function trParents() {
  const L = Tr.L, T = trState(), mem = memorizedVerses();
  const R = [{ k: 'all', t: 'السورة كاملة', vs: verseRange(1, NV) }, ...STATIONS.slice(0, 4).map(s => ({ k: 'st' + s.id, t: `${s.name} (${ARN(s.verses[0])}–${ARN(s.verses[s.verses.length - 1])})`, vs: s.verses })), ...(mem.length ? [{ k: 'mem', t: `ما حفظه (${ARN(mem.length)})`, vs: mem }] : [])];
  let sel = R.find(r => r.vs.join() === T.vs.join()) || R[0];
  const rows = () => sel.vs.map(n => `<label class="trrow"><span class="trsym">${sy(VERSES[n].sym)}<b>${ARN(n)}</b></span><span class="grow"><small>البطاقة ${ARN(n)}: ${esc(VERSES[n].symName)}</small><input type="text" data-c="${n}" maxlength="80" placeholder="أين تخبّئونها؟ مثلًا: تحت المخدّة" value="${esc(T.clues[n] || '')}"></span></label>`).join('');
  html(L.body, `<div class="trwrap">
    <h3 class="trh">${ic('download')} ١. اطبعوا البطاقات</h3>
    <p class="dim">١١ بطاقة بالرموز والرسوم وبطاقة دليل للأهل، على ٣ صفحات A4. قصّوها على الخطوط.</p>
    <div class="row trbtns"><button class="btn btn-sun" data-p="save">${ic('download')} احفظ ملف البطاقات (PDF)</button>${window.DuhaApp && window.DuhaApp.printPdf ? `<button class="btn btn-line" data-p="print">${ic('copy')} اطبع الآن</button>` : ''}</div>
    <div class="trprev" id="trPrev"></div>
    <h3 class="trh">${ic('target')} ٢. كم بطاقة في اللعبة؟</h3>
    <div class="chips" id="trR">${R.map(r => `<button class="chip${r === sel ? ' on' : ''}" data-r="${r.k}">${r.t}</button>`).join('')}</div>
    <h3 class="trh">${ic('pin')} ٣. أين تخبّئونها؟ <small>(اختياري: يظهر للبطل تلميحًا)</small></h3>
    <div class="trrows" id="trRows">${rows()}</div>
    <h3 class="trh">${ic('chest')} ٤. أين الكنز الحقيقي؟</h3>
    <input type="text" class="trprize" id="trPrize" maxlength="100" placeholder="مثلًا: في الدرج الأعلى في المطبخ" value="${esc(T.prize || '')}">
    <p class="dim trsmall">هديةٌ صغيرة أو حلوى أو رسالة حب. يظهر مكانها بعد آخر بطاقة.</p>
    <button class="btn btn-sun btn-wide" data-p="done">${ic('check')} جاهز! أعطوا الجوال للبطل</button>
    <button class="btn btn-line btn-wide" data-p="back">رجوع</button>
  </div>`);
  trPreview();
  const keep = () => { $$('[data-c]', L.body).forEach(i => { const v = i.value.trim(); if (v) T.clues[i.dataset.c] = v; else delete T.clues[i.dataset.c]; }); T.prize = $('#trPrize', L.body).value.trim(); };
  L.body.onclick = async e => {
    const r = e.target.closest('[data-r]'); if (r) { keep(); sel = R.find(x => x.k === r.dataset.r); $$('#trR .chip', L.body).forEach(x => x.classList.toggle('on', x === r)); $('#trRows', L.body).innerHTML = rows(); return; }
    const p = e.target.closest('[data-p]')?.dataset.p; if (!p) return;
    if (p === 'save' || p === 'print') { const b = e.target.closest('button'); b.disabled = true; try { await trPdf(p); } finally { b.disabled = false; } return; }
    if (p === 'back') { keep(); save(); trHome(); return; }
    if (p === 'done') { keep(); if (T.vs.join() !== sel.vs.join()) T.found = []; T.vs = sel.vs; T.ready = dayKey(); save(); trHome(); toast('الكنز جاهز! خبّئوا البطاقات ثم ابدأوا', 'chest'); }
  };
}
async function trPreview() {
  const box = Tr.L && $('#trPrev', Tr.L.body); if (!box) return;
  const cv = await trSheet(0, 600); if (!Tr.L || !box.isConnected) return;
  cv.className = 'trsheet'; box.appendChild(cv);
}
/* ---------- the printed cards ---------- */
function trQR(text) { const q = qrcode(2, 'M'); q.addData(text); q.make(); return q; }
async function trSymImg(sym, color, w) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="${w}" height="${w}"><g fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${ICONS_SYM[sym]}</g></svg>`;
  return svgToImage(svg);
}
function trStar(c, x, y, r, fill) {
  c.beginPath(); for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8 - Math.PI / 2, rr = i % 2 ? r * .55 : r; c[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); c.fillStyle = fill; c.fill();
}
async function trCard(c, x, y, w, h, n) {
  const ink = '#6b4a12', gold = '#c8952e', k = w / 560;
  c.save(); c.translate(x, y);
  c.fillStyle = '#fffdf7'; c.fillRect(0, 0, w, h);
  c.strokeStyle = gold; c.lineWidth = 6 * k; c.beginPath(); c.roundRect ? c.roundRect(18 * k, 18 * k, w - 36 * k, h - 36 * k, 26 * k) : c.rect(18 * k, 18 * k, w - 36 * k, h - 36 * k); c.stroke();
  c.strokeStyle = ink; c.lineWidth = 1.6 * k; c.beginPath(); c.roundRect ? c.roundRect(30 * k, 30 * k, w - 60 * k, h - 60 * k, 20 * k) : c.rect(30 * k, 30 * k, w - 60 * k, h - 60 * k); c.stroke();
  for (const [sx, sy2] of [[42, 42], [w / k - 42, 42], [42, h / k - 42], [w / k - 42, h / k - 42]]) trStar(c, sx * k, sy2 * k, 14 * k, gold);
  c.textAlign = 'center'; c.direction = 'rtl';
  if (!n) {
    /* the parents' guide card */
    c.fillStyle = ink; c.font = `700 ${46 * k}px "Aref Ruqaa", serif`; c.fillText('دليل الأهل', w / 2, 120 * k);
    c.font = `500 ${25 * k}px "Readex Pro", sans-serif`; c.textAlign = 'right';
    const lines = ['١. اكتبوا في التطبيق أين تخبّئون', 'كل بطاقة، ومكان الكنز الحقيقي.', '٢. خبّئوا البطاقات في البيت.', '٣. يبدأ البطل من «كنز الضحى»،', 'ويبحث عن البطاقات بالترتيب.', '٤. يصوّر كل بطاقة فيسمع آيتها', 'بصوت القارئ ويردّدها.', '٥. بعد آخر بطاقة يظهر مكان الكنز.'];
    lines.forEach((t, i) => c.fillText(t, w - 64 * k, (200 + i * 50) * k));
    c.textAlign = 'center'; c.font = `500 ${21 * k}px "Readex Pro", sans-serif`; c.fillStyle = '#8a6526';
    c.fillText('احترامًا للقرآن لا تحمل البطاقات نصّ الآيات', w / 2, h - 110 * k);
    c.fillText('كنز الضحى · رحلة الضحى', w / 2, h - 70 * k);
    c.restore(); return;
  }
  const V = VERSES[n];
  /* the number */
  c.fillStyle = gold; c.beginPath(); c.arc(w - 92 * k, 96 * k, 46 * k, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#fffdf7'; c.font = `700 ${54 * k}px "Readex Pro", sans-serif`; c.fillText(ARN(n), w - 92 * k, 116 * k);
  /* the symbol in a soft sun */
  const u = h / k, cy = u * .31, g = c.createRadialGradient(w / 2, cy * k, 10 * k, w / 2, cy * k, 170 * k); g.addColorStop(0, 'rgba(247,200,110,.45)'); g.addColorStop(1, 'rgba(247,200,110,0)');
  c.fillStyle = g; c.beginPath(); c.arc(w / 2, cy * k, 170 * k, 0, Math.PI * 2); c.fill();
  const im = await trSymImg(V.sym, ink, 260); c.drawImage(im, w / 2 - 130 * k, (cy - 130) * k, 260 * k, 260 * k);
  c.fillStyle = ink; c.font = `700 ${34 * k}px "Aref Ruqaa", serif`; c.fillText(V.symName, w / 2, (cy + 178) * k);
  /* the code the camera reads (it carries only the card number) */
  const q = trQR(TR_TAG + n), m = q.getModuleCount(), qs = 220 * k, cell = qs / (m + 8), q0x = w / 2 - qs / 2, q0y = h - qs - 84 * k;
  c.fillStyle = '#fff'; c.fillRect(q0x, q0y, qs, qs); c.fillStyle = '#1b1206';
  for (let r = 0; r < m; r++) for (let cc = 0; cc < m; cc++) if (q.isDark(r, cc)) c.fillRect(q0x + (cc + 4) * cell, q0y + (r + 4) * cell, Math.ceil(cell), Math.ceil(cell));
  c.fillStyle = '#8a6526'; c.font = `500 ${21 * k}px "Readex Pro", sans-serif`; c.fillText('صوِّرني بالترتيب · كنز الضحى', w / 2, h - 50 * k);
  c.restore();
}
/* one A4 sheet of four cards (page 0: cards 1–4, 1: 5–8, 2: 9–11 + the guide) at the given width in pixels */
async function trSheet(page, W = 1240) {
  await fontsReady();
  const H = Math.round(W * 297 / 210), cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, W, H);
  const m = W * .04, cw = (W - 3 * m) / 2, ch = (H - 3 * m) / 2;
  const slots = [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 0]][page];
  for (let i = 0; i < 4; i++) await trCard(c, W - m - cw - (i % 2) * (cw + m), m + Math.floor(i / 2) * (ch + m), cw, ch, slots[i]);
  c.strokeStyle = '#bba57a'; c.setLineDash([10, 8]); c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(W / 2, 8); c.lineTo(W / 2, H - 8); c.moveTo(8, H / 2); c.lineTo(W - 8, H / 2); c.stroke();
  return cv;
}
/* a small PDF writer: one full-page JPEG per page */
async function trPdfBlob() {
  const enc = new TextEncoder(), parts = [], offs = []; let len = 0;
  const put = x => { const b = typeof x === 'string' ? enc.encode(x) : x; parts.push(b); len += b.length; };
  const obj = (i, body) => { offs[i] = len; put(`${i} 0 obj\n`); for (const b of [].concat(body)) put(b); put('\nendobj\n'); };
  const pages = [];
  for (let p = 0; p < 3; p++) { const cv = await trSheet(p, 1240), bl = await new Promise(r => cv.toBlob(r, 'image/jpeg', .9)); pages.push({ w: cv.width, h: cv.height, data: new Uint8Array(await bl.arrayBuffer()) }); }
  put('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  const n = pages.length, kids = pages.map((_, i) => `${3 + i * 3} 0 R`).join(' ');
  obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
  obj(2, `<< /Type /Pages /Kids [${kids}] /Count ${n} >>`);
  pages.forEach((pg, i) => {
    const P = 3 + i * 3, content = 'q 595.28 0 0 841.89 0 0 cm /Im0 Do Q';
    obj(P, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 ${P + 2} 0 R >> >> /Contents ${P + 1} 0 R >>`);
    obj(P + 1, [`<< /Length ${content.length} >>\nstream\n`, content, '\nendstream']);
    obj(P + 2, [`<< /Type /XObject /Subtype /Image /Width ${pg.w} /Height ${pg.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${pg.data.length} >>\nstream\n`, pg.data, '\nendstream']);
  });
  const xref = len, count = 3 + n * 3;
  put(`xref\n0 ${count}\n0000000000 65535 f \n`);
  for (let i = 1; i < count; i++) put(String(offs[i]).padStart(10, '0') + ' 00000 n \n');
  put(`trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(parts, { type: 'application/pdf' });
}
const blobB64 = b => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(b); });
window.__fileSaved = ok => toast(ok ? 'حُفظ في التنزيلات' : 'اختر أين تحفظه', 'check');
async function trPdf(mode) {
  toast('أجهّز البطاقات…', 'timer');
  let blob; try { blob = await trPdfBlob(); } catch (e) { console.error(e); toast('تعذّر تجهيز البطاقات', 'x'); return; }
  const name = 'kanz-al-duha-cards.pdf';
  Tr.lastPdf = blob;
  try {
    if (window.DuhaApp && window.DuhaApp.shareFile) { const b64 = await blobB64(blob); if (mode === 'print' && window.DuhaApp.printPdf) window.DuhaApp.printPdf(b64, 'كنز الضحى'); else window.DuhaApp.shareFile(b64, name, 'application/pdf'); return; }
  } catch (e) { }
  if (window.claude && typeof window.claude.use === 'function') {
    let dl = null; try { dl = await window.claude.use('downloads'); } catch (e) { }
    if (dl) { try { await dl.save({ filename: name, data: blob }); toast('حُفظ ملف البطاقات', 'check'); return; } catch (e) { if (e && e.code === 'declined') return; } }
  }
  const u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 8000);
}
/* ---------- the hero's hunt ---------- */
function trPath(T) { return `<div class="trpath">${T.vs.map(n => `<i class="${T.found.includes(n) ? 'on' : ''}${n === T.vs[T.found.length] ? ' cur' : ''}">${sy(VERSES[n].sym)}</i>`).join('')}</div>`; }
function trFind(msg) {
  const L = Tr.L, T = trState(); trScanStop();
  const n = T.vs[T.found.length]; if (n == null) return trFinale();
  L.stat.textContent = `${ARN(T.found.length)} / ${ARN(T.vs.length)}`;
  html(L.body, `<div class="trwrap">
    ${trPath(T)}
    <div class="trgoal"><span class="dim">ابحث عن البطاقة</span><b>${ARN(n)}</b>${T.clues[n] ? `<p class="trclue">${ic('pin')} ${esc(T.clues[n])}</p>` : '<p class="dim">ابحث عنها في أنحاء البيت!</p>'}</div>
    ${msg ? `<p class="trmsg">${msg}</p>` : ''}
    <button class="btn btn-sun btn-wide trbig" data-f="scan">${ic('camera')} وجدتها! صوّرها</button>
    <button class="btn btn-line btn-wide" data-f="pick">ما في كاميرا؟ اختر رمز البطاقة</button>
    <button class="linkb" data-f="sym">تلميح: كيف يبدو رمزها؟</button>
    <div id="trSym" hidden><div class="trsymbig">${sy(VERSES[n].sym)}<span>${esc(VERSES[n].symName)}</span></div></div>
  </div>`);
  L.body.onclick = e => {
    const f = e.target.closest('[data-f]')?.dataset.f;
    if (f === 'scan') trScanUI(n);
    if (f === 'pick') trPick(n);
    if (f === 'sym') $('#trSym', L.body).hidden = false;
  };
}
function trPick(n) {
  const L = Tr.L;
  html(L.body, `<div class="trwrap"><h3 class="trh">أيّ رمزٍ على البطاقة التي وجدتها؟</h3>
    <div class="trgrid">${verseRange(1, NV).map(k => `<button data-k="${k}">${sy(VERSES[k].sym)}<span>${esc(VERSES[k].symName)}</span><b>${ARN(k)}</b></button>`).join('')}</div>
    <button class="btn btn-line btn-wide" data-k="back">رجوع</button></div>`);
  L.body.onclick = e => { const b = e.target.closest('[data-k]'); if (!b) return; if (b.dataset.k === 'back') return trFind(); trGot(+b.dataset.k); };
}
async function trScanUI(n) {
  const L = Tr.L;
  html(L.body, `<div class="trwrap"><div class="trcam"><video id="trVid" playsinline muted></video><span class="trframe"></span><p id="trCamMsg">وجّه الكاميرا نحو المربّع المطبوع أسفل البطاقة</p></div>
    <button class="btn btn-line btn-wide" data-s="pick">اختر الرمز بدل التصوير</button><button class="btn btn-line btn-wide" data-s="back">رجوع</button></div>`);
  L.body.onclick = e => { const s = e.target.closest('[data-s]')?.dataset.s; if (s === 'pick') { trScanStop(); trPick(n); } if (s === 'back') trFind(); };
  const msg = t => { const m = $('#trCamMsg', L.body); if (m) m.textContent = t; };
  if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) { msg('الكاميرا غير متاحة هنا. اختر الرمز بدلها.'); return; }
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false }); }
  catch (e) { msg(e && e.name === 'NotAllowedError' ? 'لم يُسمح باستعمال الكاميرا. اختر الرمز بدلها.' : 'الكاميرا غير متاحة هنا. اختر الرمز بدلها.'); return; }
  if (!Tr.L || !$('#trVid', L.body)) { stream.getTracks().forEach(t => t.stop()); return; }
  const v = $('#trVid', L.body); v.srcObject = stream; try { await v.play(); } catch (e) { }
  const S2 = Tr.scan = { stream, on: true, cv: document.createElement('canvas'), det: null, last: '', lastAt: 0 };
  try { if ('BarcodeDetector' in window && (await BarcodeDetector.getSupportedFormats()).includes('qr_code')) S2.det = new BarcodeDetector({ formats: ['qr_code'] }); } catch (e) { S2.det = null; }
  const tick = async () => {
    if (!S2.on || Tr.scan !== S2) return;
    let txt = null;
    try {
      if (v.readyState >= 2 && v.videoWidth) {
        if (S2.det) { const r = await S2.det.detect(v); if (r && r[0]) txt = r[0].rawValue; }
        else if (typeof jsQR === 'function') {
          const sc = Math.min(1, 720 / v.videoWidth), w = Math.round(v.videoWidth * sc), h = Math.round(v.videoHeight * sc);
          S2.cv.width = w; S2.cv.height = h; const c = S2.cv.getContext('2d', { willReadFrequently: true }); c.drawImage(v, 0, 0, w, h);
          const r = jsQR(c.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'dontInvert' }); if (r) txt = r.data;
        }
      }
    } catch (e) { }
    if (!S2.on || Tr.scan !== S2) return;
    const k = trParse(txt);
    if (txt && !k) { if (txt !== S2.last) msg('هذا الرمز ليس من بطاقات كنز الضحى'); S2.last = txt; }
    else if (k === n) { buzz([20, 40, 20]); trScanStop(); trGot(k); return; }
    else if (k && (k !== +S2.last || performance.now() - S2.lastAt > 4000)) { S2.last = String(k); S2.lastAt = performance.now(); buzz(30); msg(`هذه بطاقة ${VERSES[k].symName} (رقم ${ARN(k)})، ونحن نبحث عن رقم ${ARN(n)}. أعِدها مكانها وتابع البحث!`); }
    S2.t = setTimeout(tick, S2.det ? 160 : 220);
  };
  tick();
}
function trScanStop() { const s = Tr.scan; if (!s) return; s.on = false; clearTimeout(s.t); try { s.stream.getTracks().forEach(t => t.stop()); } catch (e) { } Tr.scan = null; }
function trGot(k) {
  const L = Tr.L, T = trState(), n = T.vs[T.found.length];
  if (k !== n) { Sfx.bad(); return trFind(`هذه بطاقة «${esc(VERSES[k].symName)}» رقم ${ARN(k)}، لكننا نبحث عن رقم ${ARN(n)}. أعِدها مكانها وتابع!`); }
  T.found.push(n); save(); addXP(6); Sfx.init(); sqNote([n]);
  const last = T.found.length >= T.vs.length, nx = T.vs[T.found.length];
  html(L.body, `<div class="trwrap trgot">
    <div class="trburst" aria-hidden="true">${'<i></i>'.repeat(14)}</div>
    ${trPath(T)}
    <div class="trsymbig win">${sy(VERSES[n].sym)}<span>${esc(VERSES[n].symName)}</span></div>
    <p class="trwin">وجدتها! هذه آية البطاقة ${ARN(n)}، اسمعها وردّدها مع القارئ:</p>
    <div class="panel"><div class="qt night qbig trq">${verseHTML(n)}</div></div>
    <div class="row trbtns"><button class="btn btn-line" data-g="hear">${ic('repeat')} اسمعها مرة أخرى</button>
    <button class="btn btn-sun" data-g="next">${last ? `${ic('chest')} إلى الكنز!` : `${ic('chev')} البطاقة التالية`}</button></div>
    ${!last && T.clues[nx] ? `<p class="trclue">${ic('pin')} تلميح البطاقة ${ARN(nx)}: ${esc(T.clues[nx])}</p>` : ''}
  </div>`);
  L.stat.textContent = `${ARN(T.found.length)} / ${ARN(T.vs.length)}`;
  const my = Tr.tok = (Tr.tok || 0) + 1;
  setTimeout(() => { if (Tr.L === L && Tr.tok === my) playSeq([n], { repeat: 2, gap: 900 }); }, 700);
  const hl = t => { if (!Tr.L || t.n !== n) return; $$('.trq .w', L.body).forEach(x => x.classList.toggle('on', +x.dataset.w === t.w)); };
  if (Tr.hl) Ticks.delete(Tr.hl); Tr.hl = hl; Ticks.add(hl);
  L.body.onclick = e => {
    const g = e.target.closest('[data-g]')?.dataset.g;
    if (g === 'hear') { Sfx.init(); playSeq([n]); }
    if (g === 'next') { Ticks.delete(hl); Tr.tok++; stopAll(); if (last) trFinale(); else trFind(); }
  };
}
function trFinale() {
  const L = Tr.L, T = trState(); stopAll();
  T.wins = (T.wins || 0) + 1; T.lastWin = dayKey(); save(); award('treasure'); addXP(30);
  html(L.body, `<div class="trwrap trend">
    <div class="trburst big" aria-hidden="true">${'<i></i>'.repeat(22)}</div>
    <div class="trchest open">${ic('chest')}</div>
    <h2>اكتملت ${T.vs.length === NV ? 'السورة' : 'آياتك'}! ما شاء الله</h2>
    <div class="trprizebox"><span>الكنز الحقيقي تجده في:</span><b>${T.prize ? esc(T.prize) : 'اسأل أهلك عن الكنز!'}</b></div>
    ${trPath(T)}
    <div class="row trbtns"><button class="btn btn-sun" data-e="all">${ic('play')} اسمع ${T.vs.length === NV ? 'السورة' : 'الآيات'} كاملة</button><button class="btn btn-line" data-e="again">${ic('repeat')} لعبة جديدة</button></div>
  </div>`);
  Sfx.win(); buzz([30, 50, 30, 50, 80]);
  L.body.onclick = e => {
    const x = e.target.closest('[data-e]')?.dataset.e;
    if (x === 'all') { Sfx.init(); playSeq(T.vs, { gap: 500 }); }
    if (x === 'again') { stopAll(); T.found = []; T.ready = null; save(); trHome(); toast('خبّئوا البطاقات من جديد، ثم «جاهز»', 'chest'); }
  };
}
