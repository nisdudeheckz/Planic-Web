// Records a scripted walk through the page: scrolls at reading pace, pauses on each chapter,
// and uses the pointer (desktop) or taps (phone) the way a visitor would.
//   node test/record.mjs <url> <outdir> desktop|phone
import { chromium, devices } from 'playwright';
import { mkdirSync, renameSync } from 'node:fs';

const [url, out, kind = 'desktop'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const phone = kind === 'phone';
const size = phone ? { width: 390, height: 844 } : { width: 1440, height: 900 };
const browser = await chromium.launch();
const ctx = await browser.newContext({
  ...(phone ? devices['iPhone 13'] : {}),
  viewport: size,
  ...(phone ? {} : { deviceScaleFactor: 1 }),
  recordVideo: { dir: out, size },
});
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
await page.goto(url, { waitUntil: 'networkidle' });
const wait = (ms) => page.waitForTimeout(ms);

// Smooth scroll by `px` over `ms`.
async function glide(px, ms) {
  await page.evaluate(([px, ms]) => new Promise((done) => {
    const y0 = scrollY; const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / ms);
      scrollTo(0, y0 + px * (k < .5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2));
      k < 1 ? requestAnimationFrame(step) : done();
    };
    requestAnimationFrame(step);
  }), [px, ms]);
}
const top = (sel) => page.evaluate((s) => document.querySelector(s).getBoundingClientRect().top + scrollY, sel);
async function glideTo(sel, offset = 0, ms = 1800) {
  const y = (await top(sel)) - offset;
  await glide(y - (await page.evaluate(() => scrollY)), ms);
}
async function point(sel, fx = .5, fy = .5) {
  if (phone) return;
  const b = await page.locator(sel).first().boundingBox();
  if (b) await page.mouse.move(b.x + b.width * fx, b.y + b.height * fy, { steps: 18 });
}
async function press(sel) {
  const loc = page.locator(sel).first();
  if (phone) await loc.tap(); else { await point(sel); await loc.click(); }
}
const H = size.height;

await wait(1800);
await point('.open__title .w--four', .4, .5); await wait(500);
await point('.floater--1 .ph', .5, .5); await wait(900);
await point('.thread .b:nth-child(3)', .5, .5); await wait(600);
// 1. the chat fills up
for (let i = 0; i < 9; i++) { await glide(H * (phone ? .25 : .2), 700); await wait(150); }
await wait(800);
// ticker + deck
await glide(H * .8, 1600); await wait(400);
for (const w of ['a', 'r', 'm', 'k']) {
  await glideTo(`.card[data-who="${w}"]`, phone ? 140 : 100, 1600);
  await point(`.card[data-who="${w}"] .ph`, .6, .45); await wait(700);
  if (w === 'm') { await press(`.card[data-who="m"] .me`); await wait(900); }
}
// 3. weigh (pinned)
await glideTo('.ch--weigh', 0, 1600);
for (let i = 0; i < 8; i++) { await glide(H * .2, 600); await wait(180); }
await point('.opt.is-pick .ph', .5, .5); await wait(900);
// 4. plan (pinned reveal)
await glideTo('.ch--plan', 0, 1600);
for (let i = 0; i < 9; i++) { await glide(H * .2, 600); await wait(160); }
await point('.plan .why:nth-child(3)', .3, .5); await wait(1000);
// 5. your turn
await glideTo('.ch--try .ch__head', phone ? 80 : 90, 1800); await wait(500);
await glideTo('.try', phone ? 90 : 120, 1200); await wait(400);
if (phone) {
  await press('.ask[data-who="m"] label:nth-of-type(1)'); await wait(400);
  await glideTo('.answer', 90, 800); await wait(2200);
  await glideTo('.ask[data-who="k"]', 300, 800);
  await press('.ask[data-who="k"] label:nth-of-type(3)'); await wait(400);
  await glideTo('.answer', 90, 800); await wait(2200);
  await glideTo('.answer', 90, 300);
  await press('.reset'); await wait(1600);
} else {
  await press('.ask[data-who="m"] label:nth-of-type(1)'); await wait(2400);
  await press('.ask[data-who="k"] label:nth-of-type(3)'); await wait(2400);
  await press('.ask[data-who="m"] label:nth-of-type(2)'); await wait(2400);
  await press('.reset'); await wait(1600);
}
// 6. night
await glideTo('.ch--night', 0, 1800);
for (let i = 0; i < 7; i++) { await glide(H * .25, 700); await wait(120); }
await point('.snap:nth-child(2) .ph', .5, .5); await wait(800);
// 7. share
await glideTo('.ch--share', 0, 1800); await wait(600);
await glideTo('.decode', phone ? 90 : 160, 1200); await wait(400);
const type = async (sel, text) => { await press(sel); await page.keyboard.type(text, { delay: 90 }); };
await type('#n-m', 'Nisha');
await type('#n-a', 'Priya');
await type('#n-r', 'Arjun');
await type('#n-k', 'Dev');
await page.keyboard.press('Tab');
await glideTo('.send', phone ? 120 : 260, 900); await wait(2200);
await point('#send-wa'); await wait(900);
// 8. join
await glideTo('#early-access', 0, 1800); await wait(500);
await type('#email', 'nisha@example.com');
await press('.join__row button'); await wait(2200);

const video = page.video();
await ctx.close();
const p = await video.path();
renameSync(p, `${out}/${kind}.webm`);
await browser.close();
console.log(JSON.stringify({ errs, file: `${out}/${kind}.webm` }));
