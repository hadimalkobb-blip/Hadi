// Tajweed academy + the coach: screens open, every game plays to its end, nothing throws.
import { launch, closeAll, report, sleep } from './lib.mjs';
import fs from 'fs';

const OUT = new URL('./out/', import.meta.url).pathname; fs.mkdirSync(OUT, { recursive: true });
const day = d => { const x = new Date(Date.now() - d * 864e5); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
const state = {
  v: 1, xp: 600, days: {}, streak: { n: 2, last: day(1), best: 3 }, badges: {}, best: {}, ideas: [], seen: [], ears: [], reviews: 2, plan: [], played: 4,
  st: { 1: { done: day(20), stars: 3, stage: 2, next: day(-3) }, 2: { done: day(15), stars: 2, stage: 1, next: day(1) }, 3: { done: day(9), stars: 3, stage: 1, next: day(-1) } },
  settings: { reciter: 'alafasy', rate: 1, goal: 50, sfx: true, haptic: true, bism: true, m2: false, tj: true, fs: 1, meaning: true, textMode: 'full', echo: false, rep: 1, reduce: true, narr: 'tap', narrRate: 1, caps: true, nature: true },
  weak: { '3:1': { c: 2, d: day(2) }, '7:1': { c: 1, d: day(3) } },
  mem: { 1: { s: 9, d: 5, last: Date.now() - 12 * 864e5, reps: 3, lapses: 0, lg: 3 }, 2: { s: 30, d: 4, last: Date.now() - 5 * 864e5, reps: 4, lapses: 0, lg: 3 }, 6: { s: 2, d: 7, last: Date.now() - 4 * 864e5, reps: 2, lapses: 1, lg: 2 } },
  created: Date.now() - 30 * 864e5, updated: Date.now(),
};
const { browser, page, errors } = await launch({ state });
const bad = [];
const shot = async n => page.screenshot({ path: OUT + n + '.png' });
const click = async (sel, t = 250) => { const el = await page.$(sel); if (!el) { bad.push('missing ' + sel); return false; } await el.click(); await sleep(t); return true; };
const exists = async sel => !!(await page.$(sel));

await page.evaluate(() => showTab('home')); await sleep(500); await shot('home');
if (!(await exists('.coachc'))) bad.push('coach card missing on home');
await page.evaluate(() => go('tja')); await sleep(600); await shot('tj_academy');
await page.evaluate(() => tjLesson('madd')); await sleep(500); await shot('tj_lesson_madd');
await page.evaluate(() => Gx.close()); await sleep(200);
await page.evaluate(() => tjWhy('dalla6')); await sleep(500); await shot('tj_why_dalla');
await page.evaluate(() => closeSheet()); await sleep(200);
await page.evaluate(() => tjWhy('khayr')); await sleep(400); await shot('tj_why_khayr');
await closeAll(page);

// «ليش هيك؟»
await page.evaluate(() => startGame('tjwhy')); await sleep(500); await shot('tj_game_why');
for (let i = 0; i < 10; i++) { if (!(await click('.opts .opt', 300))) break; if (i === 0) await shot('tj_game_why_answer'); await click('#tjN', 300); }
await sleep(400); if (!(await exists('#cDone'))) bad.push('why game: no result'); else { await shot('tj_game_why_end'); await click('#cDone'); }
// «ميزان المدّ» — hold the scale once, then use the picks
await page.evaluate(() => startGame('tjmadd')); await sleep(500);
{ const b = await page.$('#tjHold'); const box = await b.boundingBox(); await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await sleep(2900); await shot('tj_madd_hold'); await page.mouse.up(); await sleep(400); await shot('tj_madd_after'); await click('#tjN', 300); }
for (let i = 1; i < 8; i++) { await click('.tjpicks [data-p="0"]', 300); await click('#tjN', 250); }
await sleep(300); if (!(await exists('#cDone'))) bad.push('madd game: no result'); else await click('#cDone');
// «شمسية أم قمرية؟»
await page.evaluate(() => startGame('tjsun')); await sleep(400); await shot('tj_sun');
for (let i = 0; i < 10; i++) { await click('.tjsm [data-a="1"]', 2100); }
for (let i = 0; i < 6; i++) { await click('.tjsm [data-a="0"]', 300); await click('#tjN', 250); }
await sleep(300); if (!(await exists('#cDone'))) bad.push('sun game: no result'); else await click('#cDone');
// «نون وتنوين»
await page.evaluate(() => startGame('tjnun')); await sleep(400); await shot('tj_nun');
for (let i = 0; i < 16; i++) { await click('.opts .opt', 2500); }
for (let i = 0; i < 3; i++) { await click('.opts .opt', 300); await click('#tjN', 250); }
await sleep(300); if (!(await exists('#cDone'))) bad.push('nun game: no result'); else await click('#cDone');
// «أذن المجوّد»
await page.evaluate(() => startGame('tjear')); await sleep(600); await shot('tj_ear');
for (let i = 0; i < 8; i++) { await click('.opts .opt', 300); await click('#tjN', 250); }
await sleep(300); if (!(await exists('#cDone'))) bad.push('ear game: no result'); else await click('#cDone');
// «لوّن الآية» — paint every spot correctly
await page.evaluate(() => startGame('tjpaint')); await sleep(500); await shot('tj_paint');
for (let v = 0; v < 3; v++) {
  const plan = await page.evaluate(() => {
    const words = [...document.querySelectorAll('#tjPv .w')].map(x => x.textContent);
    let n = 0; for (let k = 1; k <= NV; k++) if (QD.verses[k].join('|') === words.join('|')) n = k;
    return TJD.spots.filter(s => s.n === n && s.r !== 'plain' && s.f !== 'isti').map(s => ({ r: s.r, w: s.hl.find(h => h[0] === n)[1] }));
  });
  if (!plan.length) { bad.push('paint: verse not identified'); break; }
  for (const p of plan) { await click(`.tjpc[data-k="${p.r}"]`, 120); await click(`#tjPv .w[data-w="${p.w}"]`, 200); }
  if (v === 0) await shot('tj_paint_done');
  await click('#tjN', 300);
}
await sleep(300); if (!(await exists('#cDone'))) bad.push('paint game: no result'); else await click('#cDone');
const tj = await page.evaluate(() => ({ s: Object.keys(S.tja.s).length, best: S.tja.best, badges: Object.keys(S.badges) }));
if (!tj.badges.includes('tjpaint')) bad.push('paint badge not awarded');

// the coach
await page.evaluate(() => go('coach')); await sleep(500); await shot('coach_room');
await closeAll(page);
await page.evaluate(() => runCoach(5)); await sleep(500); await shot('coach_session');
for (let i = 0; i < 12; i++) {
  if (await exists('#rShow')) { await click('#rShow', 300); await click('#rGrade [data-ok="1"]', 300); continue; }
  if (await exists('.opts .opt')) { await click('.opts .opt', 900); if (await exists('#qGo:not([hidden])')) await click('#qGo', 300); continue; }
  break;
}
await sleep(300); await shot('coach_end');
if (!(await exists('#cDone'))) bad.push('coach: no end card'); else await click('#cDone');
const mem = await page.evaluate(() => ({ mem: Object.keys(S.mem || {}).length, due: memDue().map(x => x.n), adapt: S.adapt, hours: S.hours, dlog: Object.keys(S.dlog || {}).length }));
console.log('state:', JSON.stringify(tj.best), JSON.stringify(mem).slice(0, 300));
await page.evaluate(() => openOasis()); await sleep(500); await shot('oasis'); await closeAll(page);
const n = report('tajweed academy + coach', errors, bad);
await browser.close();
process.exit(n ? 1 : 0);
