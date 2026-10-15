// Builds the prototype page from index.src.html.
//   index.html            links hero.css and hero.js (open it from a local server)
//   dist/talk-back.html   one self-contained file (CSS and JS inlined) for sharing
// The default state is rendered at build time, so the page reads correctly without JavaScript.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { evaluate, DEFAULT_ASKS, timeShort } from './engine.js';
import { whyRowsHTML, tradeHTML, boardHTML } from './view.js';

const here = new URL('.', import.meta.url);
const read = (f) => readFileSync(new URL(f, here), 'utf8');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const r = evaluate(DEFAULT_ASKS);
const filled = read('index.src.html')
  .replaceAll('{{TITLE}}', esc(r.plan.title))
  .replace('{{META}}', esc(r.plan.meta))
  .replace('{{THEN}}', esc(r.plan.then))
  .replace('{{WHY}}', whyRowsHTML(r))
  .replace('{{TRADE}}', tradeHTML(r.plan))
  .replace('{{CLOCK}}', timeShort(r.start))
  .replace('{{BOARD}}', boardHTML(r, { interactive: false }));

writeFileSync(new URL('index.html', here), filled
  .replace('{{STYLE}}', '<link rel="stylesheet" href="hero.css" />')
  .replace('{{SCRIPT}}', '<script type="module" src="hero.js"></script>'));

const strip = (src) => src.replace(/^import .*$/gm, '').replace(/^export /gm, '');
const bundle = ['engine.js', 'view.js', 'hero.js'].map((f) => `// ${f}\n${strip(read(f))}`).join('\n');
mkdirSync(new URL('dist/', here), { recursive: true });
writeFileSync(new URL('dist/talk-back.html', here), filled
  .replace('{{STYLE}}', () => `<style>\n${read('hero.css')}</style>`)
  .replace('{{SCRIPT}}', () => `<script type="module">\n${bundle}</script>`));

// Variant for a claude.ai Artifact page: the host adds the document skeleton and meta tags.
const page = readFileSync(new URL('dist/talk-back.html', here), 'utf8')
  .replace(/<!doctype html>\s*/i, '')
  .replace(/<\/?html[^>]*>\s*/g, '')
  .replace(/<\/?head>\s*/g, '')
  .replace(/<\/?body>\s*/g, '')
  .replace(/\s*<meta charset="utf-8" \/>/, '')
  .replace(/\s*<meta name="viewport"[^>]*>/, '')
  ;
writeFileSync(new URL('dist/artifact.html', here), page);

console.log('built index.html, dist/talk-back.html and dist/artifact.html');
