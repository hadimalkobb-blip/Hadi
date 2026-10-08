// «ليل الأنبياء وضحاهم»: every screen opens, the Yunus experience and the stories run to their end.
import { launch, closeAll, report, sleep } from './lib.mjs';
import fs from 'fs';
const OUT = new URL('./out/', import.meta.url).pathname; fs.mkdirSync(OUT, { recursive: true });
const { browser, page, errors } = await launch();
const bad = [];
const shot = n => page.screenshot({ path: OUT + n + '.png' });
// real audio once: a verse file and a narration file load and play
const real = await page.evaluate(async () => { const ok1 = await fetch('extra/ayat/021087.mp3').then(r => r.ok); const ok2 = await fetch('extra/narr2/yunus-0.mp3').then(r => r.ok); return ok1 && ok2; });
if (!real) bad.push('verse or narration audio missing');
await page.evaluate(() => { prPlay = () => new Promise(r => setTimeout(() => r(true), 40)); });
await page.evaluate(() => go('prophets')); await sleep(600); await shot('pr_main');
await page.evaluate(() => document.querySelector('.prduasc').scrollIntoView()); await sleep(200); await shot('pr_main2');
await page.evaluate(() => prYusuf()); await sleep(400); await shot('pr_yusuf'); await page.evaluate(() => Gx.close());
await page.evaluate(() => prYunus()); 
for (let i = 0; i < 40; i++) { await sleep(500); const b = await page.$('.pyb'); if (b) { if (i < 25) { const t = await b.textContent(); if (/قلتُها/.test(t) && !(await page.evaluate(() => window.__shotDua))) { await shot('pr_yunus_dua'); await page.evaluate(() => window.__shotDua = 1); } } await b.click(); } if (!(await page.$('.pyv'))) break; }
if (await page.$('.pyv')) bad.push('yunus did not finish');
if (!(await page.evaluate(() => !!S.badges.yunus))) bad.push('no yunus badge');
await page.evaluate(() => prHijra()); await sleep(400); await shot('pr_hijra'); await page.click('[data-pl="thawr"]'); await sleep(200); await page.evaluate(() => Gx.close());
await page.evaluate(() => prIbrahim()); await sleep(400); await shot('pr_ibrahim'); await page.evaluate(() => Gx.close());
await page.evaluate(() => prMusa()); await sleep(300); await page.evaluate(() => Gx.close());
await page.evaluate(() => prAyyub()); await sleep(300); await page.evaluate(() => Gx.close());
await page.evaluate(() => prDua('nuh')); await sleep(300); await page.click('#pdTry'); await sleep(200); await page.click('#pdShow'); await sleep(200); await shot('pr_dua'); await page.click('[data-ok="1"]'); await sleep(300);
if (!(await page.evaluate(() => !!(S.pr && S.pr.duas && S.pr.duas.nuh)))) bad.push('dua not collected');
await page.evaluate(() => closeSheet());
await page.evaluate(() => prStory('yunus', 'bed')); await sleep(300); await shot('pr_story'); await page.click('#psPlay');
for (let i = 0; i < 60 && !(await page.$('.psend')); i++) await sleep(300);
await shot('pr_story_end'); if (!(await page.$('.psend'))) bad.push('bedtime story did not end');
await page.evaluate(() => Gx.close());
await page.evaluate(() => prStory('ghar', 'fri')); await sleep(300); await page.click('#psPlay');
for (let i = 0; i < 40 && !(await page.$('.psq2')); i++) await sleep(300);
await shot('pr_friday_end'); if (!(await page.$('.psq2'))) bad.push('friday story did not end');
await closeAll(page);
await page.evaluate(() => showTab('heart')); await sleep(400); await page.evaluate(() => document.querySelector('[data-go="prophets"]').scrollIntoView()); await sleep(200); await shot('pr_heart');
const n = report('ليل الأنبياء وضحاهم', errors, bad);
await browser.close(); process.exit(n ? 1 : 0);
