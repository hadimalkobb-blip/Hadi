/* ===== World: one living landscape that every verse re-stages (sky, dunes, light) ===== */
const World = (() => {
  const TAU = Math.PI * 2;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t * t * (3 - 2 * t);
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const rgba = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  function ramp(keys, t) {
    t = clamp(t);
    for (let i = 0; i < keys.length - 1; i++) {
      const [ta, ca] = keys[i], [tb, cb] = keys[i + 1];
      if (t <= tb) { const k = (t - ta) / (tb - ta); return ca.map((c, j) => mix(c, cb[j], ease(k))); }
    }
    return keys[keys.length - 1][1];
  }
  const SKY = [
    [0.00, ['#03050f', '#0a1030', '#1a1c45']], [0.15, ['#070b22', '#1c1f4f', '#4a2f63']],
    [0.30, ['#151d4d', '#5a3a72', '#e0795a']], [0.45, ['#2c4f95', '#9a7fb0', '#f7b47a']],
    [0.62, ['#3a7cc8', '#8cc0ea', '#f8dcae']], [0.80, ['#2f86da', '#79c0f2', '#d8eefc']],
    [1.00, ['#2a8ae6', '#93d0fb', '#f2fbff']],
  ].map(([t, cs]) => [t, cs.map(hex)]);
  const GROUND = [
    [0.00, ['#141a40', '#0d1132', '#070a22']], [0.28, ['#3b2a52', '#2a1f40', '#1a142c']],
    [0.48, ['#b47b57', '#8c583e', '#5c392a']], [0.75, ['#e0ae76', '#c78b52', '#a06838']],
    [1.00, ['#ecc08a', '#d49d62', '#b07a44']],
  ].map(([t, cs]) => [t, cs.map(hex)]);
  const GOLD = hex('#f7b844'), WARM = hex('#ffd98a'), CORAL = hex('#ff8a5c'), IVORY = hex('#fff6dc');
  const LEAF_N = hex('#0b0e24'), LEAF_D = hex('#3f7a3a'), TRUNK_D = hex('#7a5530');

  const DEF = { tod: .06, sunX: .72, sunY: -.25, moon: 0, stars: 1, lake: 0, lantern: 0, embrace: 0, hglow: 0,
    path: 0, pglow: 0, gifts: 0, bloom: 0, storm: 0, rain: 0, sapling: 0, shelter: 0, maze: 0, guide: 0, gold: 0,
    dry: 0, green: 0, palms: .35, fruit: 0, shield: 0, wind: 0, door: 0, open: 0, visitors: 0, ripple: 0, star8: 0,
    zoom: 1, travel: 0 };

  /* scene targets as a function of verse progress p (0..1) and time t */
  const SCENES = {
    0: p => ({ tod: .05, stars: 1, moon: .55, star8: ease(seg(p, 0, .5)), palms: .4 }),
    1: p => ({ tod: lerp(.2, .8, ease(p)), sunX: .68, sunY: lerp(-.14, .56, ease(p)), stars: clamp(1 - p * 1.7), hglow: Math.sin(Math.PI * clamp(p * 1.2)) * .9, palms: .5, zoom: 1 + .05 * p }),
    2: p => ({ tod: lerp(.5, .03, ease(seg(p, 0, .8))), sunX: .25, sunY: lerp(.18, -.25, ease(seg(p, 0, .6))), moon: ease(seg(p, .2, .9)), stars: ease(seg(p, .35, 1)), lake: 1, palms: .45, zoom: 1.03 - .03 * p }),
    3: p => ({ tod: .05, stars: 1, moon: .85, lake: .6, lantern: 1, embrace: ease(seg(p, .15, .95)), hglow: .35 + .25 * seg(p, .4, 1), sunX: .5, palms: .45, zoom: 1 + .08 * ease(p) }),
    4: p => ({ tod: lerp(.16, .3, p), stars: .55, path: 1, pglow: .35 + .65 * ease(p), hglow: .45 + .55 * ease(p), sunX: .5, lantern: .5, travel: 1, palms: .45, zoom: 1 + .04 * p }),
    5: p => ({ tod: .6, sunX: .76, sunY: .32, stars: 0, gifts: 1, bloom: ease(seg(p, .1, .95)), lantern: 1, embrace: .5 + .5 * p, palms: .55, hglow: .2 }),
    6: p => ({ tod: lerp(.24, .4, p), stars: 0, storm: 1 - .75 * ease(seg(p, .45, 1)), rain: 1 - .7 * ease(seg(p, .5, 1)), sapling: 1, shelter: ease(seg(p, .05, .85)), palms: .35, wind: .5 }),
    7: p => ({ tod: .1, stars: .9, maze: 1, guide: ease(seg(p, 0, .45)), gold: ease(seg(p, .3, 1)), hglow: .2 + .6 * seg(p, .55, 1), sunX: .5, palms: .3, zoom: 1 + .05 * p }),
    8: p => ({ tod: lerp(.5, .72, p), sunX: .3, sunY: .4, stars: 0, dry: 1 - ease(seg(p, .2, .7)), green: ease(seg(p, .3, .9)), rain: Math.sin(Math.PI * seg(p, 0, .55)) * .9, storm: Math.sin(Math.PI * seg(p, 0, .55)) * .4, palms: .2 + .8 * ease(seg(p, .3, .9)), fruit: ease(seg(p, .65, 1)) }),
    9: p => ({ tod: .62, sunX: .78, sunY: .34, stars: 0, sapling: 1, shield: ease(seg(p, 0, .5)), wind: 1, green: .6, palms: .7, fruit: .6 }),
    10: p => ({ tod: .42, sunX: .2, sunY: .1, stars: .1, door: 1, open: ease(seg(p, .05, .7)), visitors: ease(seg(p, .3, 1)), green: .5, palms: .7, fruit: .6 }),
    11: p => ({ tod: lerp(.66, .9, p), sunX: .5, sunY: .66, stars: 0, ripple: 1, star8: .5 * ease(seg(p, .3, 1)), green: .8, palms: .9, fruit: .9, bloom: .85, zoom: 1.04 - .04 * p }),
    12: p => ({ tod: .92, sunX: .5, sunY: .7, ripple: .8, star8: 1, green: .9, palms: 1, fruit: 1, bloom: 1, lantern: .8, embrace: 1 }),
  };

  function create(canvas, opts = {}) {
    const ctx = canvas.getContext('2d');
    const cur = { ...DEF }, tgt = { ...DEF };
    let W = 1, H = 1, dpr = 1, last = performance.now(), T = 0, raf = 0, running = false;
    let scene = opts.scene ?? 0, prog = 0, reduce = !!opts.reduce;
    const r = rng(93);
    const stars = Array.from({ length: 140 }, () => ({ x: r(), y: Math.pow(r(), 1.4) * .6, s: .4 + r() * 1.4, ph: r() * TAU, sp: .5 + r() * 2 }));
    const motes = Array.from({ length: 46 }, () => ({ x: r(), y: r(), s: .6 + r() * 1.8, ph: r() * TAU, sp: .02 + r() * .05 }));
    const drops = Array.from({ length: 140 }, () => ({ x: r(), y: r(), l: .03 + r() * .05, sp: .9 + r() * .8 }));
    const gifts = Array.from({ length: 26 }, () => ({ x: .2 + r() * .6, y: r(), s: 2 + r() * 3.5, sp: .08 + r() * .1, ph: r() * TAU }));
    const flowers = Array.from({ length: 22 }, () => ({ x: r(), y: .8 + r() * .17, s: .6 + r() * .8, c: Math.floor(r() * 3), ph: r() * TAU, d: r() * .5 }));
    const winds = Array.from({ length: 18 }, () => ({ y: .55 + r() * .4, x: r(), l: .12 + r() * .18, sp: .35 + r() * .35 }));
    const visitors = Array.from({ length: 8 }, (_, i) => ({ side: i % 2 ? 1 : -1, d: r(), y: .82 + r() * .12, s: 3 + r() * 3 }));
    const cracks = [];
    for (let i = 0; i < 16; i++) {
      let x = r(), y = .78 + r() * .2; const pts = [[x, y]];
      for (let k = 0; k < 4; k++) { x += (r() - .5) * .09; y += (r() - .5) * .025; pts.push([x, y]); }
      cracks.push(pts);
    }
    const trails = [];
    for (let i = 0; i < 9; i++) {
      const sx = .15 + r() * .7, ex = r(), ey = .66 + r() * .06;
      trails.push([[sx, 1.02], [lerp(sx, ex, .35) + (r() - .5) * .4, .88], [lerp(sx, ex, .7) + (r() - .5) * .3, .76], [ex, ey]]);
    }
    const goldTrail = [[.5, 1.02], [.3, .9], [.62, .78], [.5, .665]];
    const palms = [{ x: .1, s: 1 }, { x: .9, s: .9 }, { x: .82, s: .62 }, { x: .2, s: .55 }, { x: .97, s: .5 }];
    let moonSprite = null;

    function resize() {
      const b = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(1, b.width); H = Math.max(1, b.height);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      moonSprite = null;
    }
    function setScene(n) { scene = n; }
    function setProgress(p) { prog = clamp(p); }
    function setTargets(o) { Object.assign(tgt, DEF, o); }
    function snap() { Object.assign(cur, tgt); }

    /* ---------- painters ---------- */
    const HY = () => H * .66;
    function sky() {
      const [a, b, c] = ramp(SKY, cur.tod);
      const g = ctx.createLinearGradient(0, 0, 0, HY() + 2);
      g.addColorStop(0, rgba(a)); g.addColorStop(.55, rgba(b)); g.addColorStop(1, rgba(c));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, HY() + 4);
    }
    function drawStars() {
      const a = cur.stars * clamp(1 - (cur.tod - .25) * 3);
      if (a <= .01) return;
      for (const s of stars) {
        const tw = .55 + .45 * Math.sin(T * s.sp + s.ph);
        ctx.fillStyle = `rgba(255,248,230,${a * tw})`;
        ctx.beginPath(); ctx.arc(s.x * W, s.y * HY(), s.s, 0, TAU); ctx.fill();
      }
    }
    function glow(x, y, rad, c, a) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, rgba(c, a)); g.addColorStop(.4, rgba(c, a * .35)); g.addColorStop(1, rgba(c, 0));
      ctx.fillStyle = g; ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    function sun() {
      if (cur.sunY < -.2) return;
      const x = cur.sunX * W, y = HY() - cur.sunY * HY() * .95;
      const el = clamp(cur.sunY * 1.6 + .2);
      const col = mix(CORAL, hex('#fff1c2'), el);
      glow(x, y, H * (.42 + .1 * el), col, .55);
      if (cur.tod > .35 && !reduce) {
        ctx.save(); ctx.translate(x, y); ctx.rotate(T * .03);
        ctx.fillStyle = rgba(col, .07 * el);
        for (let i = 0; i < 12; i++) {
          ctx.rotate(TAU / 12); ctx.beginPath(); ctx.moveTo(0, 0);
          ctx.lineTo(H * .9, -H * .025); ctx.lineTo(H * .9, H * .025); ctx.fill();
        }
        ctx.restore();
      }
      ctx.fillStyle = rgba(mix(col, IVORY, .5));
      ctx.beginPath(); ctx.arc(x, y, H * .055, 0, TAU); ctx.fill();
    }
    function moon() {
      if (cur.moon < .01) return;
      const R = H * .045, x = W * .24, y = H * .17;
      if (!moonSprite) {
        moonSprite = document.createElement('canvas');
        const s = Math.ceil(R * 2.4 * dpr); moonSprite.width = moonSprite.height = s;
        const m = moonSprite.getContext('2d'); m.scale(dpr, dpr);
        m.fillStyle = '#fff4d6'; m.beginPath(); m.arc(R * 1.2, R * 1.2, R, 0, TAU); m.fill();
        m.globalCompositeOperation = 'destination-out';
        m.beginPath(); m.arc(R * 1.2 + R * .42, R * 1.2 - R * .2, R * .92, 0, TAU); m.fill();
      }
      glow(x, y, R * 5, IVORY, .22 * cur.moon);
      ctx.globalAlpha = cur.moon; ctx.drawImage(moonSprite, x - R * 1.2, y - R * 1.2, R * 2.4, R * 2.4); ctx.globalAlpha = 1;
    }
    function horizonGlow() {
      if (cur.hglow < .01) return;
      const x = (cur.path > .2 || cur.gold > .2 ? .5 : cur.sunX) * W;
      ctx.save(); ctx.translate(x, HY()); ctx.scale(1, .42);
      glow(0, 0, W * .62, mix(CORAL, WARM, clamp(cur.tod * 1.5)), .75 * cur.hglow);
      ctx.restore();
    }
    function guideStar() {
      if (cur.guide < .01) return;
      const x = W * .5, y = H * .15, s = H * .05 * (.6 + .4 * cur.guide), a = cur.guide;
      glow(x, y, H * .3, IVORY, .35 * a);
      ctx.save(); ctx.translate(x, y); ctx.globalAlpha = a;
      ctx.fillStyle = '#fffaf0';
      ctx.beginPath();
      for (let i = 0; i < 8; i++) { const rr = i % 2 ? s * .22 : s; const an = i * TAU / 8 - Math.PI / 2; ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); }
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,248,225,.45)'; ctx.lineWidth = 1;
      const fl = s * (4 + Math.sin(T * 1.3));
      ctx.beginPath(); ctx.moveTo(-fl, 0); ctx.lineTo(fl, 0); ctx.moveTo(0, -fl * .6); ctx.lineTo(0, fl * 1.3); ctx.stroke();
      ctx.restore();
    }
    function star8() {
      if (cur.star8 < .01) return;
      const x = W * .5, y = H * .34, R = Math.min(W, H) * .2 * (.55 + .45 * cur.star8), a = cur.star8;
      glow(x, y, R * 2.2, GOLD, .28 * a);
      ctx.save(); ctx.translate(x, y); ctx.rotate(T * .05); ctx.globalAlpha = a;
      ctx.strokeStyle = rgba(WARM, .95); ctx.lineWidth = 1.6;
      for (let k = 0; k < 2; k++) { ctx.save(); ctx.rotate(k * Math.PI / 4); ctx.strokeRect(-R * .7, -R * .7, R * 1.4, R * 1.4); ctx.restore(); }
      ctx.beginPath(); ctx.arc(0, 0, R * .42, 0, TAU); ctx.stroke();
      ctx.rotate(-T * .1); ctx.lineWidth = 1;
      for (let k = 0; k < 2; k++) { ctx.save(); ctx.rotate(k * Math.PI / 4 + Math.PI / 8); ctx.strokeRect(-R * .3, -R * .3, R * .6, R * .6); ctx.restore(); }
      ctx.restore();
    }
    function cloudLayer() {
      if (cur.storm < .01) return;
      const a = cur.storm, c = mix(hex('#2a2f4a'), hex('#6d7390'), clamp(cur.tod * 1.3));
      for (let i = 0; i < 7; i++) {
        const x = ((i * .19 + T * .006 * (1 + i % 3)) % 1.3 - .15) * W, y = H * (.06 + (i % 3) * .07), rr = H * (.16 + (i % 2) * .06);
        ctx.save(); ctx.translate(x, y); ctx.scale(1.9, .55);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rr);
        g.addColorStop(0, rgba(c, .95 * a)); g.addColorStop(1, rgba(c, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rr, 0, TAU); ctx.fill(); ctx.restore();
      }
      ctx.fillStyle = `rgba(10,14,32,${.25 * a})`; ctx.fillRect(0, 0, W, H);
    }
    function duneY(layer, x) {
      const e = Math.pow(Math.abs(x - .5) * 2, 1.7);
      if (layer === 0) return HY() - H * (.035 + .03 * Math.sin(x * 6.1 + 1.2) + .02 * Math.sin(x * 13.7));
      if (layer === 1) return HY() + H * (.07 - .11 * e - .012 * Math.sin(x * 9.3 + 2));
      return HY() + H * (.24 - .2 * e - .015 * Math.sin(x * 7.7 + .4));
    }
    function dune(layer, color, edge) {
      ctx.beginPath(); ctx.moveTo(0, H);
      for (let i = 0; i <= 48; i++) { const x = i / 48; ctx.lineTo(x * W, duneY(layer, x)); }
      ctx.lineTo(W, H); ctx.closePath();
      const top = layer === 0 ? HY() - H * .08 : layer === 1 ? HY() - H * .05 : HY() + H * .02;
      const g = ctx.createLinearGradient(0, top, 0, H);
      g.addColorStop(0, rgba(mix(color, edge, .35))); g.addColorStop(.3, rgba(color)); g.addColorStop(1, rgba(mix(color, [0, 0, 0], .35)));
      ctx.fillStyle = g; ctx.fill();
    }
    function groundTint(layer) {
      const ga = cur.green * (layer === 2 ? .55 : .35), da = cur.dry * .35;
      if (ga < .01 && da < .01) return;
      ctx.save(); ctx.beginPath(); ctx.moveTo(0, H);
      for (let i = 0; i <= 48; i++) { const x = i / 48; ctx.lineTo(x * W, duneY(layer, x)); }
      ctx.lineTo(W, H); ctx.closePath(); ctx.clip();
      if (ga > .01) { ctx.fillStyle = rgba(hex('#4f8a3c'), ga * clamp(cur.tod * 1.6)); ctx.fillRect(0, 0, W, H); }
      if (da > .01) { ctx.fillStyle = rgba(hex('#9a6a3e'), da); ctx.fillRect(0, 0, W, H); }
      ctx.restore();
    }
    function lake() {
      if (cur.lake < .01) return;
      const y0 = duneY(1, .5) - H * .012, hh = H * .1, [, b, c] = ramp(SKY, cur.tod);
      const g = ctx.createLinearGradient(0, y0, 0, y0 + hh);
      g.addColorStop(0, rgba(mix(c, [0, 0, 0], .15), cur.lake)); g.addColorStop(1, rgba(mix(b, [0, 0, 0], .5), cur.lake));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(W * .5, y0, W * .4, hh, 0, 0, Math.PI); ctx.fill();
      ctx.strokeStyle = `rgba(255,240,210,${.18 * cur.lake})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(W * .5, y0, W * .4, 1.2, 0, 0, TAU); ctx.stroke();
      const useMoon = cur.moon > .1;
      const mx = useMoon ? W * .3 : clamp(cur.sunX, .15, .85) * W;
      const src = useMoon ? cur.moon : clamp(cur.sunY * 3);
      for (let i = 0; i < 9; i++) {
        const yy = y0 + 4 + i * hh / 10, w = (W * .07) * (1 - i / 11) * (.7 + .3 * Math.sin(T * 1.7 + i * 1.3));
        ctx.fillStyle = `rgba(255,240,205,${.45 * src * cur.lake * (1 - i / 10)})`;
        ctx.fillRect(mx - w / 2, yy, w, 1.6);
      }
    }
    function road() {
      if (cur.path < .01) return;
      const vx = W * .5, vy = HY() + 1, a = cur.path;
      ctx.beginPath(); ctx.moveTo(vx - W * .006, vy); ctx.lineTo(vx + W * .006, vy); ctx.lineTo(W * .78, H); ctx.lineTo(W * .22, H); ctx.closePath();
      const g = ctx.createLinearGradient(0, vy, 0, H);
      g.addColorStop(0, rgba(WARM, .9 * a * cur.pglow)); g.addColorStop(.25, rgba(mix(WARM, GOLD, .5), .35 * a)); g.addColorStop(1, rgba(hex('#3a2a3e'), .6 * a));
      ctx.fillStyle = g; ctx.fill();
      for (let i = 0; i < 9; i++) {
        const u = ((i / 9) + (reduce ? 0 : T * .09 * cur.travel)) % 1, y = vy + (H - vy) * Math.pow(u, 2.1), w = 1 + 9 * Math.pow(u, 2), hh = 2 + 14 * Math.pow(u, 2);
        ctx.fillStyle = `rgba(255,236,190,${.75 * a * (.3 + u)})`;
        ctx.fillRect(vx - w / 2, y, w, hh);
      }
    }
    function trailsDraw() {
      if (cur.maze < .01) return;
      ctx.save(); ctx.setLineDash([3, 7]); ctx.lineWidth = 1.4;
      for (const tr of trails) {
        ctx.strokeStyle = `rgba(210,200,255,${.28 * cur.maze * (1 - cur.gold * .6)})`;
        ctx.beginPath(); ctx.moveTo(tr[0][0] * W, tr[0][1] * H);
        ctx.bezierCurveTo(tr[1][0] * W, tr[1][1] * H, tr[2][0] * W, tr[2][1] * H, tr[3][0] * W, tr[3][1] * H); ctx.stroke();
      }
      ctx.restore();
      if (cur.gold > .01) {
        const t = goldTrail, len = H * 1.1;
        ctx.save(); ctx.lineCap = 'round';
        ctx.setLineDash([len * cur.gold, len * 2]);
        for (const [lw, al] of [[10, .16], [3, .95]]) {
          ctx.lineWidth = lw; ctx.strokeStyle = rgba(GOLD, al);
          ctx.beginPath(); ctx.moveTo(t[0][0] * W, t[0][1] * H);
          ctx.bezierCurveTo(t[1][0] * W, t[1][1] * H, t[2][0] * W, t[2][1] * H, t[3][0] * W, t[3][1] * H); ctx.stroke();
        }
        ctx.restore();
        if (cur.gold > .7) glow(W * .5, HY(), H * .12, WARM, (cur.gold - .7) * 2);
      }
    }
    function palm(x, base, s, grow) {
      const h = H * .3 * s * (.25 + .75 * grow);
      if (h < 4) return;
      const night = clamp(1 - (cur.tod - .25) * 3.5);
      const leaf = mix(LEAF_D, LEAF_N, night), trunk = mix(TRUNK_D, LEAF_N, night);
      const sway = reduce ? 0 : Math.sin(T * .8 + x * 9) * (.02 + .05 * cur.wind) * h;
      ctx.save(); ctx.translate(x, base);
      ctx.strokeStyle = rgba(trunk); ctx.lineCap = 'round';
      ctx.lineWidth = Math.max(2, h * .055);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(h * .08, -h * .5, sway, -h); ctx.stroke();
      ctx.translate(sway, -h);
      ctx.fillStyle = rgba(leaf);
      const n = 8;
      for (let i = 0; i < n; i++) {
        const an = -Math.PI / 2 + (i - (n - 1) / 2) * .42 + (reduce ? 0 : Math.sin(T * 1.1 + i) * .04);
        const L = h * (.52 + (i % 2) * .1) * (.4 + .6 * grow);
        const ex = Math.cos(an) * L, ey = Math.sin(an) * L * .55 + L * .25;
        ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(ex * .5, ey - L * .32, ex, ey);
        ctx.quadraticCurveTo(ex * .55, ey - L * .1, 0, 0); ctx.fill();
      }
      if (cur.fruit > .02) {
        ctx.fillStyle = rgba(mix(hex('#c46a1c'), LEAF_N, night * .8), cur.fruit);
        for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc((i % 3 - 1) * h * .045, h * .05 + Math.floor(i / 3) * h * .035, h * .022, 0, TAU); ctx.fill(); }
      }
      ctx.restore();
    }
    function palmsDraw(front) {
      for (const p of palms) {
        const isFront = p.s > .8;
        if (isFront !== front) continue;
        const base = duneY(isFront ? 2 : 1, p.x) + H * .01;
        palm(p.x * W, base, p.s, clamp(cur.palms));
      }
    }
    function sapling(x, y, s) {
      if (cur.sapling < .01) return;
      const k = H * .07 * s, sway = reduce ? 0 : Math.sin(T * 2.2) * (.08 + .3 * cur.wind * (1 - cur.shield) * (1 - cur.shelter)) * k;
      const c = mix(hex('#7fd36a'), hex('#2c3a5a'), clamp(1 - (cur.tod - .2) * 2.5));
      ctx.save(); ctx.translate(x, y); ctx.globalAlpha = cur.sapling;
      ctx.strokeStyle = rgba(c); ctx.lineWidth = 2.4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(sway * .4, -k * .5, sway, -k); ctx.stroke();
      ctx.fillStyle = rgba(c);
      for (const d of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(sway * .7, -k * .7);
        ctx.quadraticCurveTo(sway * .7 + d * k * .55, -k * 1.05, sway * .7 + d * k * .7, -k * .62);
        ctx.quadraticCurveTo(sway * .7 + d * k * .3, -k * .55, sway * .7, -k * .7); ctx.fill();
      }
      ctx.restore();
    }
    function tree(x, base, g) {
      if (g < .01) return;
      const h = H * .36 * (.3 + .7 * g), night = clamp(1 - (cur.tod - .2) * 2.5);
      const trunk = mix(hex('#5d4128'), LEAF_N, night), leaf = mix(hex('#2f6b3a'), hex('#0e1430'), night);
      ctx.save(); ctx.translate(x, base);
      ctx.fillStyle = rgba(trunk);
      ctx.beginPath(); ctx.moveTo(-h * .05, 0); ctx.quadraticCurveTo(-h * .02, -h * .5, -h * .09, -h * .78); ctx.lineTo(h * .09, -h * .78); ctx.quadraticCurveTo(h * .02, -h * .5, h * .05, 0); ctx.fill();
      const blobs = [[0, -.9, .34], [-.32, -.8, .26], [.32, -.8, .26], [-.55, -.66, .2], [.55, -.66, .2], [-.16, -1.05, .24], [.18, -1.06, .24]];
      for (const [bx, by, br] of blobs) {
        const rr = h * br * g;
        const gg = ctx.createRadialGradient(bx * h, by * h - rr * .3, rr * .1, bx * h, by * h, rr);
        gg.addColorStop(0, rgba(mix(leaf, hex('#7cc46a'), .35 * (1 - night)))); gg.addColorStop(1, rgba(leaf));
        ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(bx * h, by * h, rr, 0, TAU); ctx.fill();
      }
      ctx.restore();
      return { x0: x - h * .75 * g, x1: x + h * .75 * g, y: base - h * .62 };
    }
    function lantern(x, y, s) {
      if (cur.lantern < .01) return;
      const k = H * .055 * s, a = cur.lantern, fl = reduce ? 1 : .9 + .1 * Math.sin(T * 9) * Math.sin(T * 5.3);
      glow(x, y, H * (.14 + .32 * cur.embrace) * fl, WARM, (.45 + .35 * cur.embrace) * a);
      if (cur.embrace > .05 && !reduce) {
        for (let i = 0; i < 10; i++) {
          const an = T * .6 + i * TAU / 10, rr = H * (.1 + .05 * Math.sin(T + i)) * (.5 + cur.embrace);
          ctx.fillStyle = rgba(WARM, .7 * cur.embrace * a);
          ctx.beginPath(); ctx.arc(x + Math.cos(an) * rr, y + Math.sin(an) * rr * .6, 1.6, 0, TAU); ctx.fill();
        }
      }
      ctx.save(); ctx.translate(x, y); ctx.globalAlpha = a;
      ctx.strokeStyle = '#2a1d10'; ctx.fillStyle = '#3a2814'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(-k * .25, -k * .95); ctx.quadraticCurveTo(0, -k * 1.45, k * .25, -k * .95); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(0, -k * 1.42, k * .09, 0, TAU); ctx.stroke();
      const gg = ctx.createLinearGradient(0, -k * .9, 0, k * .6);
      gg.addColorStop(0, `rgba(255,230,160,${.95 * fl})`); gg.addColorStop(1, `rgba(255,150,70,${.95 * fl})`);
      ctx.fillStyle = gg;
      ctx.beginPath(); ctx.moveTo(-k * .32, -k * .9); ctx.lineTo(k * .32, -k * .9); ctx.lineTo(k * .45, -k * .1); ctx.lineTo(k * .3, k * .55); ctx.lineTo(-k * .3, k * .55); ctx.lineTo(-k * .45, -k * .1); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -k * .9); ctx.lineTo(0, k * .55); ctx.moveTo(-k * .45, -k * .1); ctx.lineTo(k * .45, -k * .1); ctx.stroke();
      ctx.fillStyle = '#3a2814'; ctx.fillRect(-k * .36, k * .55, k * .72, k * .14);
      ctx.restore();
    }
    function giftsDraw(tx, ty) {
      if (cur.gifts < .01) return;
      for (const g of gifts) {
        const yy = ((g.y + T * g.sp) % 1), x = lerp(g.x * W, tx, Math.pow(yy, 3) * .8), y = lerp(-H * .05, ty, yy);
        const a = cur.gifts * Math.sin(Math.PI * yy);
        glow(x, y, g.s * 5, WARM, .5 * a);
        ctx.fillStyle = `rgba(255,246,214,${a})`; ctx.beginPath(); ctx.arc(x, y, g.s * .7, 0, TAU); ctx.fill();
      }
    }
    function flowersDraw() {
      if (cur.bloom < .01) return;
      const cols = [hex('#ffd36b'), hex('#ff9a7a'), hex('#fff4e8')];
      for (const f of flowers) {
        const b = clamp((cur.bloom - f.d) / (1 - f.d) * 1.6); if (b <= 0) continue;
        const x = f.x * W, y = Math.max(f.y * H, duneY(2, f.x) + 6), s = H * .012 * f.s * ease(b);
        ctx.strokeStyle = 'rgba(70,120,60,.9)'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(x, y + s * 3); ctx.lineTo(x, y); ctx.stroke();
        ctx.fillStyle = rgba(cols[f.c]);
        for (let i = 0; i < 5; i++) { const an = i * TAU / 5 + f.ph + (reduce ? 0 : Math.sin(T + f.ph) * .1); ctx.beginPath(); ctx.ellipse(x + Math.cos(an) * s, y + Math.sin(an) * s, s * .75, s * .45, an, 0, TAU); ctx.fill(); }
        ctx.fillStyle = '#f7b844'; ctx.beginPath(); ctx.arc(x, y, s * .45, 0, TAU); ctx.fill();
      }
    }
    function rainDraw(shelter) {
      if (cur.rain < .01) return;
      ctx.strokeStyle = `rgba(200,215,255,${.45 * cur.rain})`; ctx.lineWidth = 1.1;
      const wind = .12 + .2 * cur.wind;
      ctx.beginPath();
      for (const d of drops) {
        const y = ((d.y + T * d.sp * (reduce ? .2 : 1)) % 1) * H * 1.05 - H * .05, x = ((d.x + y / H * wind) % 1) * W, l = d.l * H;
        if (shelter && x > shelter.x0 && x < shelter.x1 && y > shelter.y) continue;
        ctx.moveTo(x, y); ctx.lineTo(x + l * wind, y + l);
      }
      ctx.stroke();
    }
    function cracksDraw() {
      if (cur.dry < .01) return;
      ctx.strokeStyle = `rgba(60,35,20,${.55 * cur.dry})`; ctx.lineWidth = 1.2;
      for (const c of cracks) { ctx.beginPath(); c.forEach(([x, y], i) => i ? ctx.lineTo(x * W, y * H) : ctx.moveTo(x * W, y * H)); ctx.stroke(); }
    }
    function shieldDraw(x, y) {
      if (cur.shield < .01 && cur.wind < .01) return;
      const R = H * .17;
      if (cur.wind > .01) {
        for (const w of winds) {
          const xx = (((w.x + T * w.sp * (reduce ? .2 : 1)) % 1.4) - .2) * W, yy = w.y * H, L = w.l * W;
          const dx = xx + L / 2 - x, dy = yy - y, d = Math.hypot(dx, dy);
          let a = .5 * cur.wind;
          if (cur.shield > .1 && d < R * 1.15) a *= clamp((d - R * .9) / (R * .25));
          if (a <= .01) continue;
          ctx.strokeStyle = `rgba(230,236,255,${a})`; ctx.lineWidth = 1.3;
          ctx.beginPath(); ctx.moveTo(xx, yy); ctx.quadraticCurveTo(xx + L * .5, yy - 6, xx + L, yy); ctx.stroke();
        }
      }
      if (cur.shield > .01) {
        ctx.save();
        const g = ctx.createRadialGradient(x, y, R * .2, x, y, R);
        g.addColorStop(0, rgba(WARM, .05 * cur.shield)); g.addColorStop(.85, rgba(GOLD, .16 * cur.shield)); g.addColorStop(1, rgba(GOLD, .0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R, Math.PI, 0); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = rgba(WARM, (.55 + .25 * Math.sin(T * 2.4)) * cur.shield); ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.arc(x, y, R, Math.PI, 0); ctx.stroke();
        ctx.restore();
      }
    }
    function doorDraw(x, base) {
      if (cur.door < .01) return;
      const w = Math.min(W * .22, H * .2), h = w * 1.7, a = cur.door, o = cur.open;
      ctx.save(); ctx.globalAlpha = a;
      if (o > .01) {
        ctx.beginPath(); ctx.moveTo(x - w * .42, base); ctx.lineTo(x + w * .42, base); ctx.lineTo(x + w * 1.8, H); ctx.lineTo(x - w * 1.8, H); ctx.closePath();
        const sg = ctx.createLinearGradient(0, base, 0, H);
        sg.addColorStop(0, rgba(WARM, .55 * o)); sg.addColorStop(1, rgba(WARM, 0)); ctx.fillStyle = sg; ctx.fill();
        glow(x, base - h * .45, h * .9, WARM, .45 * o);
      }
      const arch = () => { ctx.beginPath(); ctx.moveTo(x - w / 2, base); ctx.lineTo(x - w / 2, base - h * .62); ctx.quadraticCurveTo(x - w / 2, base - h, x, base - h * 1.04); ctx.quadraticCurveTo(x + w / 2, base - h, x + w / 2, base - h * .62); ctx.lineTo(x + w / 2, base); ctx.closePath(); };
      ctx.fillStyle = '#2a1c14'; ctx.save(); ctx.translate(0, 0); ctx.lineWidth = w * .12; ctx.strokeStyle = '#c9a272'; arch(); ctx.stroke(); ctx.restore();
      arch(); ctx.save(); ctx.clip();
      const ig = ctx.createLinearGradient(0, base - h, 0, base); ig.addColorStop(0, `rgba(255,244,214,${o})`); ig.addColorStop(1, `rgba(255,196,110,${o})`);
      ctx.fillStyle = o > .01 ? ig : '#2a1c14'; ctx.fillRect(x - w, base - h * 1.1, w * 2, h * 1.2);
      const lw = (w / 2) * (1 - o * .82);
      ctx.fillStyle = '#5a3a22';
      ctx.fillRect(x - w / 2, base - h * 1.1, lw, h * 1.2); ctx.fillRect(x + w / 2 - lw, base - h * 1.1, lw, h * 1.2);
      ctx.strokeStyle = 'rgba(201,162,114,.55)'; ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) { const yy = base - h * i * .25; ctx.beginPath(); ctx.moveTo(x - w / 2, yy); ctx.lineTo(x - w / 2 + lw, yy); ctx.moveTo(x + w / 2 - lw, yy); ctx.lineTo(x + w / 2, yy); ctx.stroke(); }
      ctx.restore(); ctx.restore();
      if (cur.visitors > .01) {
        for (const v of visitors) {
          const k = clamp(((T * .07 + v.d) % 1));
          const vx = lerp(x + v.side * W * .55, x, ease(k)), vy = lerp(v.y * H, base - h * .25, ease(k));
          const al = cur.visitors * Math.sin(Math.PI * k);
          glow(vx, vy, v.s * 5, WARM, .6 * al);
          ctx.fillStyle = `rgba(255,248,225,${al})`; ctx.beginPath(); ctx.arc(vx, vy, v.s * .6, 0, TAU); ctx.fill();
        }
      }
    }
    function ripplesDraw() {
      if (cur.ripple < .01) return;
      const x = W * .5, y = HY() + H * .02;
      for (let i = 0; i < 6; i++) {
        const k = ((T * .16 + i / 6) % 1), R = k * Math.max(W, H) * .9;
        ctx.strokeStyle = rgba(WARM, (1 - k) * .55 * cur.ripple); ctx.lineWidth = 2 * (1 - k) + .6;
        ctx.beginPath(); ctx.ellipse(x, y, R, R * .32, 0, 0, TAU); ctx.stroke();
      }
    }
    function motesDraw() {
      const a = Math.max(cur.ripple, cur.embrace * .6, cur.gifts * .4, cur.star8 * .5);
      if (a < .02) return;
      for (const m of motes) {
        const y = 1 - ((m.y + T * m.sp) % 1), x = m.x + Math.sin(T * .5 + m.ph) * .02;
        ctx.fillStyle = `rgba(255,236,180,${a * .7 * Math.sin(Math.PI * y)})`;
        ctx.beginPath(); ctx.arc(x * W, y * H, m.s, 0, TAU); ctx.fill();
      }
    }
    function vignette() {
      const g = ctx.createRadialGradient(W / 2, H * .52, Math.min(W, H) * .3, W / 2, H * .52, Math.max(W, H) * .78);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(3,4,14,.55)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }

    function render() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const z = cur.zoom;
      ctx.save(); ctx.translate(W / 2, H * .58); ctx.scale(z, z); ctx.translate(-W / 2, -H * .58);
      sky(); drawStars(); horizonGlow(); sun(); moon(); guideStar(); star8(); cloudLayer();
      const [far, mid, near] = ramp(GROUND, cur.tod), [, , skyLow] = ramp(SKY, cur.tod);
      dune(0, far, skyLow); groundTint(0);
      palmsDraw(false);
      dune(1, mid, skyLow); groundTint(1);
      lake();
      trailsDraw();
      road();
      const cx = W * .5, groundC = duneY(2, .5);
      const sh = tree(cx, groundC + H * .005, ease(cur.shelter));
      dune(2, near, skyLow); groundTint(2); cracksDraw();
      palmsDraw(true);
      flowersDraw();
      doorDraw(cx, groundC - H * .01);
      shieldDraw(cx, groundC);
      sapling(cx, groundC, 1);
      lantern(cx, groundC - H * .085, 1);
      giftsDraw(cx, groundC - H * .1);
      rainDraw(sh);
      ripplesDraw();
      motesDraw();
      ctx.restore();
      vignette();
    }
    function frame(now) {
      raf = 0;
      const dt = Math.min(.05, (now - last) / 1000); last = now; T += reduce ? dt * .35 : dt;
      setTargets((SCENES[scene] || SCENES[0])(prog, T));
      const k = 1 - Math.exp(-dt * 2.6);
      for (const key in cur) cur[key] += (tgt[key] - cur[key]) * k;
      render();
      if (running) raf = requestAnimationFrame(frame);
    }
    function start() { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
    function setReduce(v) { reduce = !!v; }
    function still(n, p) { scene = n; prog = p; setTargets(SCENES[n](p, 0)); snap(); render(); }
    resize();
    return { resize, setScene, setProgress, start, stop, still, setReduce, get scene() { return scene; }, render: () => render() };
  }
  return { create, SCENES };
})();
