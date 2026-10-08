// the new games, played to their end with real taps and drags.
import { launch, closeAll, report, sleep } from './lib.mjs';
import fs from 'fs';
const OUT = new URL('./out/', import.meta.url).pathname; fs.mkdirSync(OUT, { recursive: true });
const { browser, page, errors } = await launch();
const bad = [];
const shot = n => page.screenshot({ path: OUT + n + '.png' });
const click = async (sel, t = 200) => { const el = await page.$(sel); if (!el) { bad.push('missing ' + sel); return false; } await el.click(); await sleep(t); return true; };
// escape room
await page.evaluate(() => go('escape')); await sleep(400); await shot('g2_escape');
const D = await page.evaluate(() => ER.g.digits);
await click('[data-o="lantern"]', 300); await shot('g2_escape_lantern');
const order = await page.evaluate(n => [...document.querySelectorAll('#erP .tile')].map(b => b.textContent), D.lantern);
const words = await page.evaluate(n => QD.verses[n], D.lantern);
for (const w of words) { const j = order.indexOf(w); await page.click(`#erP .tile[data-j="${j}"]`); order[j] = null; await sleep(120); }
await sleep(900);
await click('[data-o="chest"]', 300); const qk = await page.evaluate(() => ER.g.qk); await click(`#erP .opt[data-i="${qk}"]`, 900);
await click('[data-o="window"]', 300); await click(`#erP .opt[data-n="${D.window}"]`, 900);
await click('[data-o="door"]', 300);
for (const d of [D.lantern, D.chest, D.window]) await click(`#erP [data-d="${d}"]`, 120);
await sleep(600); await shot('g2_escape_win');
if (!(await page.evaluate(() => !!S.badges.escape))) bad.push('escape not won');
await closeAll(page);
// caravan: steer to the right lantern each time
await page.evaluate(() => go('caravan')); await sleep(300); await click('#cvGo', 300);
for (let i = 0; i < 300; i++) { await page.evaluate(() => { const g = CV.g; const w = g.z.find(x => !x.done); if (w && w.z < .6) g.lane = w.ok; }); await sleep(100); if (i === 30) await shot('g2_caravan'); if (await page.evaluate(() => CV.g.state === 'end')) break; }
const cv = await page.evaluate(() => ({ st: CV.g.state, vi: CV.g.vi, got: CV.g.got, miss: CV.g.miss }));
if (cv.got < 4 || cv.miss > 0) bad.push('caravan: ' + JSON.stringify(cv));
await closeAll(page);
// heads-up
await page.evaluate(() => go('headsup')); await sleep(300); await click('[data-sec="60"]', 3400); await shot('g2_headsup');
await click('[data-r="1"]', 800); await click('[data-r="0"]', 800);
await closeAll(page);
// letters: drag across the cells of every hidden word
await page.evaluate(() => go('letters2')); await sleep(400); await shot('g2_letters');
const B = await page.evaluate(() => window.__bg.placed.map(p => p.path));
for (const path of B) {
  const pts = await page.evaluate(path => path.map(j => { const r = document.querySelector(`.bgc[data-j="${j}"]`).getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }), path);
  await page.mouse.move(pts[0][0], pts[0][1]); await page.mouse.down();
  for (const [x, y] of pts.slice(1)) { await page.mouse.move(x, y, { steps: 4 }); await sleep(30); }
  await page.mouse.up(); await sleep(350);
}
await shot('g2_letters_done');
if (!(await page.evaluate(() => !!S.badges.letters2))) bad.push('letters: not all words found');
await closeAll(page);
// crossword: type every answer
await page.evaluate(() => go('crossword')); await sleep(400); await shot('g2_crossword');
const X = await page.evaluate(() => window.__cw.placed.map(p => ({ i: p.i, L: p.L })));
for (const p of X) { await click(`.cwlist [data-s="${p.i}"]`, 120); for (const ch of p.L) await click(`.wdk[data-k="${ch}"]`, 40); await sleep(150); }
await sleep(300); await shot('g2_crossword_done');
if (!(await page.evaluate(() => !!S.badges.crossword))) bad.push('crossword not completed');
await closeAll(page);
const n = report('new games', errors, bad);
await browser.close(); process.exit(n ? 1 : 0);
