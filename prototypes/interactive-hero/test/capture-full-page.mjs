// Trustworthy full-page capture: scroll the real page a screen at a time, as a visitor would,
// and stitch the screens. Nothing in the page is changed. Also writes Playwright's one-shot
// full-page capture, plain and with content-visibility forced on, to show where blank bands came from.
import { chromium, devices } from 'playwright';
import { execFileSync } from 'node:child_process';
const url = process.argv[2] || 'http://127.0.0.1:8765/index.html';
const out = process.argv[3] || './shots/full';
const b = await chromium.launch();
for (const [tag, opts] of [['desktop-1440', { viewport: { width: 1440, height: 900 } }], ['phone-390', { ...devices['iPhone 13'], viewport: { width: 390, height: 750 }, deviceScaleFactor: 2 }]]) {
  const ctx = await b.newContext(opts); const p = await ctx.newPage();
  await p.goto(url); await p.waitForTimeout(3800);
  await p.screenshot({ path: `${out}-${tag}-oneshot.png`, fullPage: true });
  // Sections below the fold only take their real height once rendered, so re-measure the page
  // after every step; screens already taken stay valid because rendered sections keep their size.
  const H = await p.evaluate(() => innerHeight);
  const totalNow = () => p.evaluate(() => document.documentElement.scrollHeight);
  const parts = [];
  let total = await totalNow();
  for (let y = 0, i = 0; ; i++) {
    let top = Math.min(y, total - H);
    await p.evaluate((t) => scrollTo({ top: t, behavior: 'instant' }), top);
    await p.waitForTimeout(1400); // let reveals (route diagrams drawing in) finish
    total = await totalNow();
    const actual = await p.evaluate(() => scrollY);
    const f = `${out}-${tag}-part${i}.png`;
    await p.screenshot({ path: f });
    parts.push([f, actual]);
    if (actual + H >= total) break;
    y = actual + H;
  }
  execFileSync('python3', ['-c', `
import json,sys
from PIL import Image
parts=json.loads(sys.argv[1]); total=${'${total}'}
first=Image.open(parts[0][0]); s=first.width/${opts.viewport.width}
canvas=Image.new('RGB',(first.width,int(total*s)),'white')
for f,top in parts: canvas.paste(Image.open(f).convert('RGB'),(0,int(top*s)))
canvas.save(sys.argv[2])
print(sys.argv[2], canvas.size)
`.replace('${total}', total), JSON.stringify(parts), `${out}-${tag}-stitched.png`], { stdio: 'inherit' });
  await p.addStyleTag({ content: '*{content-visibility:visible!important}' });
  await p.evaluate(() => scrollTo({ top: 0, behavior: 'instant' })); await p.waitForTimeout(400);
  await p.screenshot({ path: `${out}-${tag}-oneshot-forced.png`, fullPage: true });
  await ctx.close();
}
await b.close();
