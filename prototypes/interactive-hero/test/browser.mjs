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
const settle = (p) => p.waitForTimeout(1700);
// The phone answer bar shows the whole outcome: nothing clipped, at most two lines, a full-size button.
const peekFits = (p) => p.evaluate(() => {
  const bar = document.querySelector('.peek'), t = document.querySelector('.peek__title'), go = document.querySelector('.peek__go');
  const cs = getComputedStyle(t), lh = parseFloat(cs.lineHeight);
  const tr = t.getBoundingClientRect(), br = bar.getBoundingClientRect(), gr = go.getBoundingClientRect();
  const lines = Math.round(tr.height / lh);
  const ok = t.scrollWidth <= t.clientWidth + 1 && t.scrollHeight <= t.clientHeight + 1 && cs.textOverflow !== 'ellipsis' && lines <= 2 &&
    tr.right <= gr.left && gr.height >= 44 && gr.right <= innerWidth && tr.top >= br.top && tr.bottom <= br.bottom;
  return { ok, lines, barH: Math.round(br.height), goH: Math.round(gr.height) };
});
const choice = (key, value) => `#tune-${key} label:has(input[value="${value}"])`;
// After everything settles, nothing should still be animating and the sweep must be gone.
// Waits (up to 3 s) for every script animation to end, then reports any still running.
const quiet = (p) => p.evaluate(async () => {
  const mine = () => document.getAnimations().filter((a) => a.playState === 'running' && !(a instanceof CSSAnimation) && !(a instanceof CSSTransition));
  await Promise.race([Promise.allSettled(mine().map((a) => a.finished)), new Promise((r) => setTimeout(r, 3000))]);
  const wipe = getComputedStyle(document.querySelector('.wipe')).transform;
  return { running: mine().length, wipe };
});
const titleMatchesEngine = (p) => p.evaluate(() => {
  const r = window.__planic.result;
  const want = r.plan ? r.plan.title : 'Nothing fits all four yet';
  const shown = document.querySelector('.plan__title .sr-only').textContent;
  const letters = [...document.querySelectorAll('.plan__title .ch')].map((c) => c.textContent).join('');
  return shown === want && letters === want.replace(/ /g, '');
});

/* ---------- desktop, mouse and keyboard ---------- */
{
  const { p, ctx } = await open({ viewport: { width: 1440, height: 900 } }, 'desktop', 'domcontentloaded');
  await p.waitForTimeout(600);
  check('desktop: intro asks "so… where?" before the plan answers', (await title(p)) === 'so… where?');
  await p.screenshot({ path: out + 'd1-intro.png' });
  await p.waitForTimeout(3400);
  check('desktop: default plan after intro', (await title(p)) === 'Board games, then momos');
  check('desktop: all four people and their lines are on the first screen', await p.evaluate(() => {
    const k = document.querySelector('.msg[data-who="k"]').getBoundingClientRect();
    const paths = [...document.querySelectorAll('.routes .rt')].map((x) => x.getAttribute('d'));
    return k.bottom <= innerHeight && paths.length === 4 && paths.every((d) => d && d.startsWith('M'));
  }));
  check('desktop: each line ends at its person’s row in the plan', await p.evaluate(() => ['a', 'r', 'm', 'k'].every((w) => {
    const path = document.querySelector(`.routes g[data-who="${w}"] .rt`);
    const end = path.getPointAtLength(path.getTotalLength());
    const dot = document.querySelector(`.why[data-who="${w}"] .why__dot`).getBoundingClientRect();
    const hero = document.querySelector('.hero').getBoundingClientRect();
    return Math.abs(end.x - (dot.left + dot.width / 2 - hero.left)) < 2 && Math.abs(end.y - (dot.top + dot.height / 2 - hero.top)) < 2;
  })));
  await p.screenshot({ path: out + 'd2-default.png' });
  const titleTop = await p.evaluate(() => document.querySelector('.plan__title').getBoundingClientRect().top + scrollY);

  await p.click('button.live[data-ask="free"]');
  check('desktop: Kabir tuner opens', await p.isVisible('#tune-free'));
  await p.hover(choice('free', 1020));
  await p.waitForTimeout(150);
  const prev = await change(p);
  check('desktop: hover previews the outcome before committing', /street-food crawl/.test(prev) && await p.locator('.plan__change.is-preview').count() === 1, prev);
  check('desktop: hover readies Kabir’s line', await p.locator('.routes g[data-who="k"] .rt.is-armed').count() === 1);
  check('desktop: preview does not change the plan', (await title(p)) === 'Board games, then momos');
  await p.screenshot({ path: out + 'd3-hover-preview.png' });

  await p.click(choice('free', 1020));
  await p.waitForTimeout(250);
  check('desktop: the signal runs along Kabir’s line before the plan changes', await p.locator('.routes g[data-who="k"] .pulse').count() >= 1 && (await title(p)) === 'Board games, then momos');
  await p.screenshot({ path: out + 'd4-signal.png' });
  await p.waitForTimeout(420);
  await p.screenshot({ path: out + 'd4b-sweep.png' });
  await settle(p);
  check('desktop: Kabir free at 5 → street-food crawl', (await title(p)) === 'A street-food crawl', await title(p));
  check('desktop: change line explains it', /Kabir’s free after 5 now, so the street-food crawl fits all four, and it’s ₹200 cheaper each\./.test(await change(p)), await change(p));
  check('desktop: the plan title did not move when the plan changed', Math.abs(titleTop - await p.evaluate(() => document.querySelector('.plan__title').getBoundingClientRect().top + scrollY)) < 1);
  check('desktop: the clock behind the plan shows the new start', (await p.locator('.clock').textContent()) === '5:30');
  await p.mouse.move(10, 10);
  await p.screenshot({ path: out + 'd5-crawl.png' });

  await p.click('.undo');
  await settle(p);
  check('desktop: undo returns to board games', (await title(p)) === 'Board games, then momos');

  // Awkward state: two changes in quick succession must end on the second, with nothing stuck.
  await p.click(choice('free', 1020));
  await p.waitForTimeout(90);
  await p.click(choice('free', 1260));
  await settle(p);
  const q = await quiet(p);
  check('desktop: an interrupted change ends on the latest answer', (await title(p)) === 'Board games till close' && await titleMatchesEngine(p), await title(p));
  check('desktop: nothing left animating or covering the title after an interruption', q.running === 0 && (q.wipe === 'none' || q.wipe.startsWith('matrix(0')), JSON.stringify(q));
  await p.click('.reset');
  await settle(p);

  await p.click('button.live[data-ask="budget"]');
  await p.focus('#budget');
  for (let i = 0; i < 4; i++) await p.keyboard.press('ArrowLeft');
  await settle(p);
  check('desktop: keyboard on the budget slider to ₹400 → nothing fits', (await title(p)) === 'Nothing fits all four yet' && await titleMatchesEngine(p), await title(p));
  check('desktop: no-plan turns the plan’s surface to night', await p.locator('.plan.is-noplan').count() === 1);
  check('desktop: no-plan shows what each person’s ask rules out', /₹400 max rules out the board-game café/.test(await p.locator('.why[data-who="m"] .why__text').textContent()));
  check('desktop: lines stop short of the plan when nothing fits', await p.evaluate(() => [...document.querySelectorAll('.routes .tm')].every((t) => t.getAttribute('d'))));
  check('desktop: no-plan state offers bends', await p.locator('.bend').count() >= 1);
  check('desktop: the price chips show which options are within Meera’s budget', await p.locator('.chip.is-in').count() === 2);
  check('desktop: token text follows the slider', (await p.locator('button.live[data-ask="budget"] .say').innerText()) === '₹400 max');
  await p.mouse.move(10, 10);
  await p.screenshot({ path: out + 'd6-no-plan.png' });

  await p.locator('.bend .try').first().click();
  await settle(p);
  const afterBend = await title(p);
  check('desktop: "Try it" on a bend produces a plan', afterBend !== 'Nothing fits all four yet' && await p.locator('.plan.is-noplan').count() === 0, afterBend);

  await p.click('.reset');
  await settle(p);
  check('desktop: reset returns to what they said', (await title(p)) === 'Board games, then momos' && /^Back to what they actually said/.test(await change(p)), await change(p));

  await p.locator('.opt[data-id="rooftop"] .try').click();
  await settle(p);
  check('desktop: rooftop "Try it" (from the options board) holds the plan and says why', (await title(p)) === 'Board games, then momos' && /The rooftop fits too, but it costs more, so the plan holds\./.test(await change(p)), await change(p));
  check('desktop: a held plan is stamped as still the plan', await p.isVisible('.stamp'));
  check('desktop: "Try it" on the board answers in place, under its row, without leaving the board', await p.locator('.opt[data-id="rooftop"] + .opt-echo .echo__kind').innerText().catch(() => '') === 'Plan holds'
    && /The rooftop fits too, but it costs more/.test(await p.locator('.opt-echo .echo__why').innerText())
    && await p.evaluate(() => { const r = document.querySelector('.opt-echo .echo').getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; }),
    await p.evaluate(() => { const e = document.querySelector('.opt-echo'); if (!e) return 'no answer row'; const r = e.getBoundingClientRect(); return `${e.innerText.replace(/\n/g, ' / ')} @ ${Math.round(r.top)}–${Math.round(r.bottom)} of ${innerHeight}`; }));
  await p.screenshot({ path: out + 'd7-rooftop-holds.png' });
  await p.click('.opt-echo .echo__see');
  await p.waitForTimeout(1400);
  check('desktop: "See it in the plan" goes up to the plan and offers a way back', await p.evaluate(() => document.querySelector('.plan__title').getBoundingClientRect().top >= 0) && await p.isVisible('.return'));
  await p.click('.return');
  await p.waitForTimeout(1400);
  check('desktop: the way back returns to the answer on the board', await p.evaluate(() => { const r = document.querySelector('.opt-echo .echo').getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; }) && !(await p.isVisible('.return')));
  await p.click('.opt-echo .echo__undo');
  await settle(p);
  check('desktop: "Put it back" undoes the board change and clears the answer', (await p.evaluate(() => window.__planic.asks.budget)) === 600 && await p.locator('.opt-echo').count() === 0);
  await p.locator('.opt[data-id="rooftop"] .try').click();
  await settle(p);
  await p.click('.reset');
  await settle(p);
  check('desktop: going back to ₹600 holds too, and stays stamped', await p.isVisible('.stamp'));
  await p.click('button.live[data-ask="free"]');
  await p.click(choice('free', 1020));
  await settle(p);
  check('desktop: the stamp goes when the plan really changes', (await title(p)) === 'A street-food crawl' && !(await p.isVisible('.stamp')));
  await p.click('button.live[data-ask="free"]');
  await p.click('.reset');
  await settle(p);

  // Keyboard only: Escape closes and returns focus; arrows pick a radio.
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
  check('desktop: rule 2 in action: the usual café fits but isn’t new, so the plan holds', /isn’t new, so the plan holds/.test(await change(p)), await change(p));

  // Hover linking: a reason lights its person, and the other lines step back.
  await p.click('.reset');
  await settle(p);
  await p.hover('.why[data-who="m"]');
  check('desktop: hovering a reason lights the person who asked', await p.locator('.msg[data-who="m"].is-lit').count() === 1 && await p.locator('.routes .rt.is-dim').count() === 3);

  // The rest of the page.
  await p.locator('.list').scrollIntoViewIfNeeded();
  await p.click('.list__toggle button[data-order="ranked"]');
  await p.waitForTimeout(900);
  check('page: "for the usual four" puts Planic’s pick first', (await p.locator('.list__items li').first().getAttribute('data-id')) === 'board');
  await p.screenshot({ path: out + 'd8-list-ranked.png' });
  await p.locator('.how').scrollIntoViewIfNeeded();
  await p.click('button.rule__go[data-patch*="400"]');
  await p.waitForTimeout(1600);
  const ruleEcho = p.locator('.rule[data-expect="none-fits"] .echo');
  check('page: rule 3 plays out in place: nothing fits, said beside the rule, and the plan agrees', await ruleEcho.isVisible() && /Nothing fits all four yet/.test(await ruleEcho.innerText()) && (await title(p)) === 'Nothing fits all four yet'
    && await p.locator('.rule[data-expect="none-fits"].is-applied').count() === 1 && await p.locator('button.rule__go[data-patch*="400"]:disabled').count() === 1);
  await p.click('.rule[data-expect="none-fits"] .echo__undo');
  await settle(p);
  check('page: putting rule 3 back restores the plan and the button', (await title(p)) !== 'Nothing fits all four yet' && !(await ruleEcho.isVisible()) && await p.locator('button.rule__go[data-patch*="400"]:disabled').count() === 0);
  await p.locator('.join').scrollIntoViewIfNeeded();
  await p.fill('#email', 'not an email');
  await p.click('.join__row button');
  check('page: the form rejects a bad email and says so', await p.locator('#email[aria-invalid="true"]').count() === 1 && /doesn’t look like an email/.test(await p.locator('.join__msg').textContent()));
  await p.fill('#email', 'someone@example.com');
  await p.click('.join__row button');
  check('page: the prototype form says nothing was sent, and stays on the page', /prototype, so nothing was sent/.test(await p.locator('.join__msg').textContent()) && p.url() === url);
  await p.screenshot({ path: out + 'd9-full.png', fullPage: true });
  await ctx.close();
}

/* ---------- phone, touch ---------- */
{
  const { p, ctx } = await open({ ...devices['iPhone 13'] }, 'phone');
  await p.waitForTimeout(3800);
  await p.screenshot({ path: out + 'm1-first-screen.png' });
  await p.evaluate(() => window.scrollTo(0, document.querySelector('.chat').getBoundingClientRect().top + scrollY - 40));
  await p.waitForTimeout(300);
  check('phone: the answer bar stays out of the way until you change something', !(await p.isVisible('.peek')));
  await p.tap('button.live[data-ask="budget"]');
  await p.waitForTimeout(500);
  check('phone: tap opens Meera’s budget tuner', await p.isVisible('#tune-budget'));

  // A real touch drag on the slider thumb, through the DevTools protocol.
  const box = await p.locator('#budget').boundingBox();
  const cdp = await ctx.newCDPSession(p);
  const y = box.y + box.height / 2;
  const X = (v) => box.x + 16 + (box.width - 32) * (v - 200) / 2300;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: X(600), y }] });
  for (let i = 1; i <= 12; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: X(600) + (X(2400) - X(600)) * i / 12, y }] });
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
  check('phone: the lines run down the lane strip to the plan', await p.evaluate(() => {
    const x = document.querySelector('.xchg').getBoundingClientRect();
    const hero = document.querySelector('.hero').getBoundingClientRect();
    return [...document.querySelectorAll('.routes .rt')].every((path) => {
      const end = path.getPointAtLength(path.getTotalLength());
      return Math.abs(end.y - (x.top - hero.top + 8)) < 2 && end.x >= x.left - hero.left && end.x <= x.right - hero.left;
    });
  }));
  await p.screenshot({ path: out + 'm3-after-drag.png' });

  // Drag all the way down: nothing fits, the bar says so.
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: X(b2), y }] });
  for (let i = 1; i <= 12; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: X(b2) + (X(250) - X(b2)) * i / 12, y }] });
    await p.waitForTimeout(30);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await settle(p);
  check('phone: dragging to ₹250 → nothing fits, said in full in the bar', (await p.locator('.peek__title').innerText()) === 'Nothing fits all four yet' && await p.locator('.peek.is-noplan').count() === 1 && (await peekFits(p)).ok, JSON.stringify(await peekFits(p)));
  check('phone: the bar never covers the open price rail', await p.evaluate(() => { const t = document.querySelector('#tune-budget').getBoundingClientRect(); const b = document.querySelector('.peek'); return b.hidden || t.bottom <= b.getBoundingClientRect().top + 1; }));
  await p.screenshot({ path: out + 'm3b-nothing-fits.png' });
  await p.tap('.peek__go');
  await p.waitForTimeout(1400);
  check('phone: "See why" brings the plan title fully into view', await p.evaluate(() => { const r = document.querySelector('.plan__title').getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; }));
  check('phone: after "See why", the title is readable (not covered, not stale)', await titleMatchesEngine(p) && (await quiet(p)).running === 0);
  await p.screenshot({ path: out + 'm4-see-why.png' });
  await p.locator('.back').scrollIntoViewIfNeeded();
  await p.tap('.back');
  await p.waitForTimeout(1300);
  check('phone: "Change what they said" goes back to Meera with her tuner open', await p.isVisible('#tune-budget') && await p.evaluate(() => { const r = document.querySelector('.msg[data-who="m"]').getBoundingClientRect(); return r.top >= 0 && r.top < innerHeight; }));
  await p.screenshot({ path: out + 'm5-back.png' });

  await p.tap('button.live[data-ask="free"]');
  await p.waitForTimeout(300);
  await p.tap(choice('free', 1260));
  await settle(p);
  await p.tap('button.live[data-ask="budget"]');
  await p.waitForTimeout(300);
  await p.evaluate(() => window.__planic.commit({ ...window.__planic.asks, budget: 600 }));
  await settle(p);
  check('phone: Kabir free at 9 → board games till close', (await title(p)) === 'Board games till close', await title(p));
  await p.screenshot({ path: out + 'm6-full.png', fullPage: true });
  await ctx.close();
}

/* ---------- the phone answer bar: every outcome in full, at the narrowest width ---------- */
{
  const { p, ctx } = await open({ ...devices['iPhone SE'], viewport: { width: 320, height: 568 } }, 'peek-320');
  await p.waitForTimeout(3600);
  const states = [
    ['Board games, then momos', {}],
    ['Board games till close', { free: 1260 }],
    ['Kebabs and a live set', { food: 'any' }],
    ['A street-food crawl', { free: 1020 }],
    ['The usual café', { novelty: 'usual', budget: 450 }],
    ['Nothing fits all four yet', { budget: 250 }],
  ];
  const heights = new Set();
  let all = true; const bad = [];
  for (const [want, patch] of states) {
    await p.evaluate((patch) => window.__planic.commit({ food: 'veg', novelty: 'new', budget: 600, free: 1140, ...patch }), patch);
    await settle(p);
    await p.evaluate(() => { document.querySelector('.peek').hidden = false; });
    await p.waitForTimeout(350);
    const f = await peekFits(p);
    heights.add(f.barH);
    const got = await p.locator('.peek__title').innerText();
    if (got !== want || !f.ok) { all = false; bad.push(`${want}: ${got} ${JSON.stringify(f)}`); }
  }
  await p.screenshot({ path: out + 'm7-peek-320.png' });
  check('phone 320: every plan title and "nothing fits" shows in full in the bar (no cut-off, ≤ 2 lines, See why ≥ 44px)', all, bad.join(' | '));
  check('phone 320: the bar keeps one height whatever the title', heights.size === 1, [...heights].join(','));
  await ctx.close();
}

/* ---------- reduced motion, no JS, widths ---------- */
{
  const { p, ctx } = await open({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' }, 'reduced');
  check('reduced motion: no intro, plan shown at once', (await title(p)) === 'Board games, then momos');
  await p.click('button.live[data-ask="food"]');
  await p.click(choice('food', 'any'));
  await p.waitForTimeout(250);
  check('reduced motion: change lands at once, with no signal or sweep', (await title(p)) === 'Kebabs and a live set' && await p.locator('.routes .pulse').count() === 0);
  check('reduced motion: the lines are still drawn, because they explain who shaped what', await p.evaluate(() => [...document.querySelectorAll('.routes .rt')].every((x) => x.getTotalLength() > 20)));
  await ctx.close();
}
{
  const { p, ctx } = await open({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false }, 'nojs');
  const t = await p.locator('.plan__title').innerText();
  check('no JS: the default plan is readable', t === 'Board games, then momos', t);
  check('no JS: the options board is filled in', await p.locator('.opt').count() === 6 && await p.locator('.opt.is-picked').count() === 1);
  check('no JS: no visible buttons that would do nothing', await p.evaluate(() => [...document.querySelectorAll('button')].every((x) => !x.checkVisibility({ visibilityProperty: true }))));
  await p.screenshot({ path: out + 'n1-nojs.png', fullPage: true });
  await ctx.close();
}
for (const w of [320, 390, 768, 1024, 1440, 1920]) {
  const { p, ctx } = await open({ viewport: { width: w, height: 900 } }, `w${w}`);
  await p.waitForTimeout(3800);
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
