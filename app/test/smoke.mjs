// Opens every tab and every route of the app and fails on any script error.
import { launch, closeAll, report, sleep } from './lib.mjs';

const ROUTES = (process.env.ROUTES || '').split(',').filter(Boolean);
const DEFAULT = ['meanings', 'tajweed', 'mushaf', 'reciters', 'badges', 'settings', 'share', 'credits', 'world', 'calm', 'grat', 'acts', 'seal', 'orphan', 'oasis', 'live', 'mirror', 'imm', 'treasure', 'studio', 'pp', 'square', 'library', 'nature', 'kawkaba', 'scenes', 'rhythm', 'rec', 'chal', 'duo', 'card', 'cert', 'gallery', 'gold', 'sky', 'palace', 'g-build', 'g-missing', 'g-hunter', 'g-memory', 'g-audio', 'st1', 'rv1'];

const { browser, page, errors } = await launch();
const bad = [];
for (const t of ['home', 'watch', 'read', 'heart', 'play', 'ideas']) {
  await page.evaluate(t => showTab(t), t); await sleep(250);
}
for (const r of (ROUTES.length ? ROUTES : DEFAULT)) {
  try { await page.evaluate(r => go(r), r); } catch (e) { bad.push(r + ': ' + e.message); }
  await sleep(450);
  await closeAll(page); await sleep(120);
}
await page.evaluate(() => showTab('home')); await sleep(300);
const n = report('smoke: tabs and routes', errors, bad);
await browser.close();
process.exit(n ? 1 : 0);
