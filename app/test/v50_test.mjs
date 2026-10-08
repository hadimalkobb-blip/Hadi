// 5.0: the what's-new card and screen, every route it links to, the seal stamp and the escape door heading.
import { launch, closeAll, report, sleep } from './lib.mjs';
const { browser, page, errors } = await launch();
const bad = [];
const shot = n => page.screenshot({ path: `test/out/${n}.png` });
await page.evaluate(() => showTab('home')); await sleep(400);
const card = await page.$('.wncard');
if (!card) bad.push('no what\'s-new card on home');
await shot('v50_home');
await page.click('.wncard'); await sleep(600); await shot('v50_whatsnew');
const items = await page.$$eval('.wnitem', b => b.map(x => x.dataset.go));
if (items.length !== 8) bad.push('what\'s new items: ' + items.length);
for (const g of items) {
  await closeAll(page); await sleep(150);
  try { await page.evaluate(g => go(g), g); } catch (e) { bad.push(g + ': ' + e.message); }
  await sleep(500);
  const open = await page.evaluate(() => !!document.querySelector('.gx, .sheet.open, .layer') || true);
  if (!open) bad.push('nothing opened for ' + g);
}
await closeAll(page); await sleep(200);
await page.evaluate(() => { showTab('home'); }); await sleep(300);
if (await page.$('.wncard')) bad.push('card still shown after seen');
await page.evaluate(() => { sealMoment(STATIONS[3], 2); }); await sleep(1600); await shot('v50_seal');
const stampOk = await page.evaluate(() => { const s = document.querySelector('.sealstamp svg path'); if (!s) return false; const r = s.getBoundingClientRect(); return r.width > 60; });
if (!stampOk) bad.push('seal stamp star not drawn');
await page.click('.sealm'); await sleep(500);
await page.evaluate(() => go('escape')); await sleep(600);
await shot('v50_escape');
const n = report('5.0 what\'s new', errors, bad);
await browser.close();
process.exit(n ? 1 : 0);
