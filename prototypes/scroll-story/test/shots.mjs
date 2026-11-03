// Scrolls the page in steps and saves a screenshot at each stop. Usage:
//   node test/shots.mjs <url> <outdir> <w> <h> [steps-per-screen] [reduced]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const [url, out, w = '1440', h = '900', per = '1', rm] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1, reducedMotion: rm ? 'reduce' : 'no-preference', hasTouch: +w < 900, isMobile: +w < 900 });
const errs = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); });
page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const total = await page.evaluate(() => document.documentElement.scrollHeight);
const step = Math.round(+h / +per);
let i = 0;
for (let y = 0; y < total; y += step) {
  await page.evaluate((y) => window.scrollTo(0, y), y);
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${out}/s${String(i++).padStart(3, '0')}.jpg`, quality: 70, type: 'jpeg' });
}
const ow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
console.log(JSON.stringify({ total, shots: i, overflowX: ow, errs }, null, 1));
await browser.close();
