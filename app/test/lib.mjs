// Shared helpers for the headless tests (Playwright from the global npm tools).
import { createRequire } from 'module';
const require = createRequire('/opt/npm-tools/node_modules/');
const { chromium } = require('playwright');

export const BASE = process.env.BASE || 'http://127.0.0.1:8765/';

export async function launch({ mobile = true, state = null, url = BASE } = {}) {
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const ctx = await browser.newContext(mobile ? { viewport: { width: 400, height: 860 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'ar' } : { viewport: { width: 1280, height: 900 } });
  const errors = [];
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push('pageerror: ' + (e.stack || e.message)));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|ERR_|net::|Failed to load resource|404|fonts.g/.test(m.text())) errors.push('console: ' + m.text()); });
  if (state) await page.addInitScript(s => { try { localStorage.setItem('duha-journey-v1', JSON.stringify(s)); } catch (e) { } }, state);
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(900);
  return { browser, ctx, page, errors };
}

export const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function closeAll(page) {
  await page.evaluate(() => { try { while (Gx.top()) Gx.close(); if (Run.el) closeRunner(true); closeSheet(); closePop(); } catch (e) { } });
}

export function report(name, errors, extra = []) {
  const fails = [...errors, ...extra];
  if (fails.length) { console.log(`✗ ${name}`); for (const f of fails) console.log('   ' + String(f).slice(0, 600)); }
  else console.log(`✓ ${name}`);
  return fails.length;
}
