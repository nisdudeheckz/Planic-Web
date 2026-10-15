// Browser checks for the prototype. Usage: node test/browser.mjs <url> <screenshot-dir>
// Needs Playwright with Chromium; serve the folder first (e.g. python3 -m http.server).
import { chromium, devices } from 'playwright';
import { mkdirSync } from 'node:fs';

const url = process.argv[2] || 'http://127.0.0.1:8765/index.html';
const out = (process.argv[3] || './shots') + '/';
mkdirSync(out, { recursive: true });
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok: !!ok, detail }); };
const b = await chromium.launch();
const errors = [];

async function open(opts = {}, label = '', waitUntil = 'networkidle') {
  const ctx = await b.newContext(opts);
  const p = await ctx.newPage();
  p.on('console', (m) => { if (m.type() === 'error') errors.push(`${label}: ${m.text()}`); });
  p.on('pageerror', (e) => errors.push(`${label}: ${e}`));
  await p.goto(url, { waitUntil });
  return { p, ctx };
}
const title = (p) => p.locator('.plan__title .sr-only').textContent();
const change = (p) => p.locator('.change__text').textContent();
const settle = (p) => p.waitForTimeout(1100);

/* ---------- desktop, mouse and keyboard ---------- */
{
  const { p, ctx } = await open({ viewport: { width: 1440, height: 900 } }, 'desktop', 'domcontentloaded');
  await p.waitForTimeout(500);
  check('desktop: intro shows "so… where?" before the plan', (await title(p)) === 'so… where?');
  await p.screenshot({ path: out + 'd1-intro.png' });
  await p.waitForTimeout(2600);
  check('desktop: default plan after intro', (await title(p)) === 'Board games, then momos');
  await p.screenshot({ path: out + 'd2-default.png' });

  await p.click('button.live[data-ask="free"]');
  check('desktop: Kabir tuner opens', await p.isVisible('#tune-free'));
  await p.hover('#tune-free label:nth-child(2)'); // "free after 5" (legend is child 1)
  await p.waitForTimeout(150);
  const prev = await change(p);
  check('desktop: hover previews the outcome before committing', /street-food crawl/.test(prev) && await p.locator('.plan__change.is-preview').count() === 1, prev);
  check('desktop: preview does not change the plan', (await title(p)) === 'Board games, then momos');
  await p.screenshot({ path: out + 'd3-hover-preview.png' });

  await p.click('#tune-free label:nth-child(2)');
  await p.waitForTimeout(260);
  await p.screenshot({ path: out + 'd4-retypeset-midway.png' });
  await settle(p);
  check('desktop: Kabir free at 5 → street-food crawl', (await title(p)) === 'A street-food crawl', await title(p));
  check('desktop: change line explains it', /Kabir’s free after 5 now, so the street-food crawl fits all four, and it’s ₹200 cheaper each\./.test(await change(p)), await change(p));
  await p.mouse.move(10, 10);
  await p.screenshot({ path: out + 'd5-crawl.png' });

  await p.click('.undo');
  await settle(p);
  check('desktop: undo returns to board games', (await title(p)) === 'Board games, then momos');

  await p.click('button.live[data-ask="budget"]');
  await p.focus('#budget');
  for (let i = 0; i < 4; i++) await p.keyboard.press('ArrowLeft');
  await settle(p);
  check('desktop: keyboard on the budget slider to ₹400 → no plan', (await title(p)) === 'Not without someone bending', await title(p));
  check('desktop: no-plan state offers bends', await p.locator('.bend').count() >= 1);
  check('desktop: token text follows the slider', (await p.locator('button.live[data-ask="budget"]').innerText()).startsWith('₹400 max'));
  await p.mouse.move(10, 10);
  await p.screenshot({ path: out + 'd6-no-plan.png' });
  await p.screenshot({ path: out + 'd6-no-plan-full.png', fullPage: true });

  await p.locator('.bend .try').first().click();
  await settle(p);
  const afterBend = await title(p);
  check('desktop: "Try it" on a bend produces a plan', afterBend !== 'Not without someone bending', afterBend);

  await p.click('.reset');
  await settle(p);
  check('desktop: reset returns to what they said', (await title(p)) === 'Board games, then momos' && /^Back to what they actually said/.test(await change(p)), await change(p));

  await p.locator('.other[data-id="rooftop"] .try').click();
  await settle(p);
  check('desktop: rooftop "Try it" holds the plan and says why', (await title(p)) === 'Board games, then momos' && /The rooftop fits too, but it costs more, so the plan holds\./.test(await change(p)), await change(p));
  await p.screenshot({ path: out + 'd7-rooftop-holds.png' });

  // Keyboard only: Escape closes and returns focus; arrows pick a radio.
  await p.click('.reset');
  await p.focus('button.live[data-ask="novelty"]');
  await p.keyboard.press('Enter');
  check('keyboard: Enter opens the tuner', await p.isVisible('#tune-novelty'));
  await p.keyboard.press('Escape');
  check('keyboard: Escape closes it and returns focus', !(await p.isVisible('#tune-novelty')) && await p.evaluate(() => document.activeElement.dataset.ask === 'novelty'));
  await p.keyboard.press('Enter');
  await p.keyboard.press('Tab');
  await p.keyboard.press('ArrowRight');
  await settle(p);
  check('keyboard: arrow to "the usual’s fine" commits', (await p.evaluate(() => window.__planic.asks.novelty)) === 'usual');

  // Hover linking: a reason lights its person.
  await p.click('.reset');
  await p.hover('.why[data-who="m"]');
  check('desktop: hovering a reason lights the person who asked', await p.locator('.msg[data-who="m"].is-lit').count() === 1);
  await ctx.close();
}

/* ---------- phone, touch ---------- */
{
  const { p, ctx } = await open({ ...devices['iPhone 13'] }, 'phone');
  await p.waitForTimeout(3000);
  await p.screenshot({ path: out + 'm1-first-screen.png' });
  await p.tap('button.live[data-ask="budget"]');
  await p.waitForTimeout(500);
  check('phone: tap opens Meera’s budget tuner', await p.isVisible('#tune-budget'));

  // A real touch drag on the slider thumb, through the DevTools protocol.
  const box = await p.locator('#budget').boundingBox();
  const cdp = await ctx.newCDPSession(p);
  const y = box.y + box.height / 2;
  const x0 = box.x + 15 + (box.width - 30) * (600 - 200) / 2300;
  const x1 = box.x + 15 + (box.width - 30) * (2400 - 200) / 2300;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y }] });
  for (let i = 1; i <= 12; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + (x1 - x0) * i / 12, y }] });
    await p.waitForTimeout(30);
  }
  await p.screenshot({ path: out + 'm2-dragging.png' });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await settle(p);
  const b2 = await p.evaluate(() => window.__planic.asks.budget);
  check('phone: touch drag moves Meera’s budget', b2 >= 2000, `budget ${b2}`);
  check('phone: plan holds at a big budget', (await title(p)) === 'Board games, then momos');
  check('phone: the answer stays in sight while tuning', await p.isVisible('.peek') && (await p.locator('.peek__title').innerText()).length > 0);
  check('phone: the peek says the plan held', (await p.locator('.peek__label').innerText()) === 'Plan holds', await p.locator('.peek__label').innerText());
  await p.screenshot({ path: out + 'm3-after-drag.png' });

  await p.tap('button.live[data-ask="free"]');
  await p.waitForTimeout(300);
  await p.tap('#tune-free label:nth-child(4)'); // free after 9
  await settle(p);
  check('phone: Kabir free at 9 → board games till close', (await title(p)) === 'Board games till close', await title(p));
  await p.screenshot({ path: out + 'm4-kabir-9.png' });
  if (await p.isVisible('.peek')) { await p.tap('.peek__go'); await p.waitForTimeout(900); }
  check('phone: the plan title is fully in view after "See why" (or already)', await p.evaluate(() => { const r = document.querySelector('.plan__title').getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; }));
  await p.screenshot({ path: out + 'm5-plan.png' });
  await p.screenshot({ path: out + 'm6-full.png', fullPage: true });
  await ctx.close();
}

/* ---------- reduced motion, no JS, widths ---------- */
{
  const { p, ctx } = await open({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' }, 'reduced');
  check('reduced motion: no intro, plan shown at once', (await title(p)) === 'Board games, then momos');
  await p.click('button.live[data-ask="food"]');
  await p.click('#tune-food label:nth-child(3)');
  await p.waitForTimeout(250);
  check('reduced motion: change lands without letter animation', (await title(p)) === 'Kebabs and a live set' && await p.locator('.carry').count() === 0);
  await ctx.close();
}
{
  const { p, ctx } = await open({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false }, 'nojs');
  const t = await p.locator('.plan__title').innerText();
  check('no JS: the default plan is readable', t === 'Board games, then momos', t);
  check('no JS: no dead buttons', await p.locator('button.live, .try').count() === 0);
  await p.screenshot({ path: out + 'n1-nojs.png', fullPage: true });
  await ctx.close();
}
for (const w of [320, 390, 768, 1024, 1440, 1920]) {
  const { p, ctx } = await open({ viewport: { width: w, height: 900 } }, `w${w}`);
  await p.waitForTimeout(2800);
  for (const k of ['food', 'budget', 'free']) await p.click(`button.live[data-ask="${k}"]`);
  const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  check(`width ${w}: no horizontal overflow`, over <= 0, `overflow ${over}px`);
  await ctx.close();
}

check('no console errors anywhere', errors.length === 0, errors.join(' | '));
await b.close();
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail && !r.ok ? '  — ' + r.detail : ''}`);
console.log(`\n${results.filter((r) => r.ok).length}/${results.length} passed`);
process.exitCode = results.every((r) => r.ok) ? 0 : 1;
