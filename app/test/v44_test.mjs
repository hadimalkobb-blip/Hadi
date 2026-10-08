// «أول المئة»: the daily word, deeds, the Duha prayer counter, celebrations and the backup.
import { launch, closeAll, report, sleep } from './lib.mjs';
import fs from 'fs';
const OUT = new URL('./out/', import.meta.url).pathname; fs.mkdirSync(OUT, { recursive: true });
const day = d => { const x = new Date(Date.now() - d * 864e5); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
const state = { v: 1, xp: 300, days: {}, streak: { n: 1, last: day(0), best: 1 }, badges: {}, best: {}, ideas: [], seen: [], ears: [], reviews: 0, plan: [], played: 0,
  st: { 1: { done: day(3), stars: 2, stage: 0, next: day(-2) } }, duhaPr: { [day(1)]: 1, [day(3)]: 1, [day(4)]: 1 },
  settings: { reciter: 'alafasy', rate: 1, goal: 50, sfx: true, haptic: true, bism: true, m2: false, tj: true, fs: 1, meaning: true, textMode: 'full', echo: false, rep: 1, reduce: false, narr: 'tap', narrRate: 1, caps: true, nature: true }, created: Date.now(), updated: Date.now() };
const { browser, page, errors } = await launch({ state });
const bad = [];
const shot = n => page.screenshot({ path: OUT + n + '.png' });

await page.evaluate(() => showTab('home')); await sleep(500);
if (!(await page.$('.wdcard'))) bad.push('no daily word card on home');
if (!(await page.$('.deedc'))) bad.push('no deed card on home');
await page.evaluate(() => document.querySelector('.deedc').scrollIntoView()); await sleep(200); await shot('v44_home_deed');
// the daily word
await page.evaluate(() => go('wordle')); await sleep(500); await shot('v44_wordle');
const T = await page.evaluate(() => wdToday());
const wrong = T.L.map((c, i) => (i % 2 ? 'ب' : 'م'));
for (const c of wrong) await page.click(`.wdk[data-k="${c}"]`);
await page.click('.wdk[data-k="⏎"]'); await sleep(700); await shot('v44_wordle_guess1');
for (const c of T.L) await page.click(`.wdk[data-k="${c}"]`);
await page.click('.wdk[data-k="⏎"]'); await sleep(1200); await shot('v44_wordle_win');
const wd = await page.evaluate(() => { const st = wdSt(); return { st: st.d[dayKey()].st, wins: st.wins, streak: st.streak, badge: !!S.badges.wordle }; });
if (wd.st !== 'win' || !wd.badge) bad.push('wordle not won: ' + JSON.stringify(wd));
await page.evaluate(() => { const T = wdToday(); wdShare(T, wdSt().d[T.key]); }); await sleep(300);
await closeAll(page);
// deeds
await page.evaluate(() => go('deeds')); await sleep(400); await shot('v44_deeds');
await page.click('[data-deed="smile"]'); await sleep(300);
if (!(await page.evaluate(() => !!(S.deeds && S.deeds.smile)))) bad.push('deed not recorded');
await closeAll(page);
// duha prayer
await page.evaluate(() => go('duhapr')); await sleep(400); await shot('v44_duhapr'); await closeAll(page);
// celebrations: a burst on a right answer, the seal of a station
await page.evaluate(() => startGame('missing')); await sleep(500);
await page.evaluate(() => hit());
await sleep(60); const fx = await page.$('.fxb'); await sleep(900);
if (!fx) bad.push('no light burst on an answer');
await closeAll(page);
await page.evaluate(() => { sealMoment(STATIONS[1], 3); }); await sleep(1500); await shot('v44_seal'); await page.click('.sealm'); await sleep(600);
// backup: make, then bring it back into a fresh journey
const ok = await page.evaluate(async () => {
  const json = await backupMake(false);
  const before = JSON.stringify(S.st), f = new File([json], 'b.json', { type: 'application/json' });
  S = fresh(); save();
  const r = await backupRestore(f, 'replace');
  return r && JSON.stringify(S.st) === before && !!S.wordle && !!S.deeds;
});
if (!ok) bad.push('backup round trip failed');
await page.evaluate(() => go('settings')); await sleep(400); await page.evaluate(() => document.querySelector('#bkSave').scrollIntoView()); await sleep(200); await shot('v44_settings_backup');
await closeAll(page);
const n = report('4.4 «أول المئة»', errors, bad);
await browser.close(); process.exit(n ? 1 : 0);
