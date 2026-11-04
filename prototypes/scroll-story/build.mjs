// Builds the scroll-story prototype from index.src.html.
//   index.html            links story.css, vendor scripts and story.js (open it from a local server at prototypes/)
//   dist/scroll-story.html one file with CSS and JS inlined; photos stay as files in img/
//   dist/artifact.html     the same, without the document skeleton, for a claude.ai Artifact page
// The decision engine is reused unchanged from the frozen talk-back prototype.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { evaluate, DEFAULT_ASKS, PEOPLE } from '../interactive-hero/engine.js';
import { whyRowsHTML, tradeHTML, esc } from '../interactive-hero/view.js';

const here = new URL('.', import.meta.url);
const read = (f) => readFileSync(new URL(f, here), 'utf8');

// Photos: img/<id>.webp when present, otherwise an art-directed placeholder that names the shot.
const PHOTO_EXT = ['webp', 'jpg'];
let photos = 0;
const ALIAS = { rooftop: 'o-rooftop', 'o-board': 'board' }; // one file, used twice
function photo(id, alt, label) {
  const file = ALIAS[id] || id;
  const ext = PHOTO_EXT.find((e) => existsSync(new URL(`img/${file}.${e}`, here)));
  if (ext) {
    photos++;
    return `<figure class="ph" data-ph="${id}" data-label="${esc(label)}"><img src="img/${file}.${ext}" alt="${esc(alt)}" decoding="async" /></figure>`;
  }
  return `<figure class="ph ph--empty" data-ph="${id}" role="img" aria-label="${esc(alt)}"><span class="ph__label">photo · ${esc(label)}</span></figure>`;
}

const r = evaluate(DEFAULT_ASKS);
const ORDER = ['rooftop', 'cafe', 'board', 'brunch', 'crawl', 'kebab'];
const OPT_PHOTO = {
  rooftop: ['A rooftop restaurant at night, warm lamps over low tables and the city lights behind', 'rooftop at night'],
  cafe: ['Three glasses of cutting chai and a samosa on a small table', 'the usual chai spot'],
  board: ['A board game seen from above on a wooden table, cards, dice and a bowl of chips', 'board-game café'],
  brunch: ['Brunch bowls with pancakes and berries on a pink table', 'brunch in daylight'],
  crawl: ['A hand holding a foil bowl of aloo chaat with a toothpick', 'aloo chaat on the street'],
  kebab: ['Chicken skewers on a charcoal grill, people standing around it', 'kebabs on the grill'],
};
const opts = ORDER.map((id, n) => {
  const o = r.board.find((x) => x.id === id);
  const fail = Object.entries(o.people).find(([, f]) => f);
  const verdict = o.picked
    ? `<p class="opt__yes">Works for all four</p>`
    : `<p class="opt__no" data-who="${fail[0]}"><i aria-hidden="true">${PEOPLE[fail[0]].name[0]}</i>${esc(fail[1].text)}</p>`;
  return `          <li class="opt${o.picked ? ' is-pick' : ''}" data-id="${id}" style="--n:${n}">` +
    photo(`o-${id}`, ...OPT_PHOTO[id]) +
    `<p class="opt__name">${esc(o.name)}</p><p class="opt__price">${esc(o.price)} each</p>${verdict}</li>`;
}).join('\n');

let html = read('index.src.html')
  .replace(/\{\{PH:([^|]+)\|([^|]+)\|([^}]+)\}\}/g, (_, id, alt, label) => photo(id, alt, label))
  .replace('{{OPTS}}', opts)
  .replaceAll('{{TITLE}}', esc(r.plan.title))
  .replaceAll('{{META}}', esc(r.plan.meta))
  .replace('{{THEN}}', esc(r.plan.then))
  .replaceAll('{{WHY}}', whyRowsHTML(r))
  .replaceAll('{{TRADE}}', tradeHTML(r.plan));
const credits = existsSync(new URL('img/CREDITS.json', here)) ? JSON.parse(read('img/CREDITS.json')) : null;
const byPerson = credits ? [...new Map(Object.values(credits).map((c) => [c.username, c])).values()] : [];
const creditLine = byPerson.map((c) => `<a href="https://unsplash.com/@${esc(c.username)}?utm_source=planic&amp;utm_medium=referral">${esc(c.photographer)}</a>`).join(', ');
html = html.replace('{{PHOTO_NOTE}}', !photos ? 'Photo slots are placeholders.'
  : credits ? `Photos from <a href="https://unsplash.com/?utm_source=planic&amp;utm_medium=referral">Unsplash</a> by ${creditLine}. They show real places, but not the venues in the example.`
  : 'The photos are generated stand-ins, not real places or people.');

writeFileSync(new URL('index.html', here), html
  .replace('{{STYLE}}', '<link rel="stylesheet" href="story.css" />')
  .replace('{{VENDOR}}', '<script src="vendor/gsap.min.js" defer></script>\n  <script src="vendor/ScrollTrigger.min.js" defer></script>')
  .replace('{{SCRIPT}}', '<script type="module" src="story.js"></script>'));

const strip = (src) => src.replace(/^import [\s\S]*?;$/gm, '').replace(/^export /gm, '');
const bundle = ['../interactive-hero/engine.js', '../interactive-hero/view.js', 'life.js', 'story.js']
  .map((f) => `// ${f.split('/').pop()}\n${strip(read(f))}`).join('\n');
const single = html
  .replace('{{STYLE}}', () => `<style>\n${read('story.css')}</style>`)
  .replace('{{VENDOR}}', () => `<script>\n${read('vendor/gsap.min.js')}\n</script>\n<script>\n${read('vendor/ScrollTrigger.min.js')}\n</script>`)
  .replace('{{SCRIPT}}', () => `<script type="module">\n${bundle}</script>`);
mkdirSync(new URL('dist/', here), { recursive: true });
writeFileSync(new URL('dist/scroll-story.html', here), single);
// The Artifact page loads GSAP from cdnjs (an allowed host) instead of inlining it; photos are published beside it in img/.
const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0';
writeFileSync(new URL('dist/artifact.html', here), html
  .replace('{{STYLE}}', () => `<style>\n${read('story.css')}</style>`)
  .replace('{{VENDOR}}', `<script src="${CDN}/gsap.min.js"></script>\n<script src="${CDN}/ScrollTrigger.min.js"></script>`)
  .replace('{{SCRIPT}}', () => `<script type="module">\n${bundle}</script>`)
  .replace(/<title>[^<]*<\/title>/, '<title>Planic scroll story</title>\n  <meta name="claude:viewport-fit-sides" content="cover" />')
  .replace(/<!doctype html>\s*/i, '')
  .replace(/<\/?html[^>]*>\s*/g, '')
  .replace(/<\/?head>\s*/g, '')
  .replace(/<\/?body>\s*/g, '')
  .replace(/\s*<meta charset="utf-8" \/>/, '')
  .replace(/\s*<meta name="viewport"[^>]*>/, ''));

console.log(`built index.html and dist/ (${photos} photos, ${ORDER.length} options)`);
