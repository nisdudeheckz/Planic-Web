# "Talk back" hero prototype

An isolated prototype of an interactive Planic hero: change what one of four friends said, and the illustrative plan rewrites itself and says why (or says why it held). It lives outside `public/`, so it is not part of the Netlify site and nothing here is deployed.

Storyboard, art direction and research notes: `/mnt/project-files/planic-redesign/interactive/` in the project, summarised in the prototype thread.

## Files

| File | What it is |
|---|---|
| `engine.js` | The demo's whole decision model: four asks, six made-up options, three rules. Pure functions, no DOM. |
| `view.js` | HTML string builders shared by the build step and the live page. |
| `hero.js` | Interaction: tuners, live slider, carry and retypeset motion, hover preview, phone peek bar, intro. No dependencies. |
| `hero.css` | All styles. Animates only `transform` and `opacity`. |
| `index.src.html` | Page source. `build.mjs` fills in the default plan so the page reads without JavaScript. |
| `test/engine.test.mjs` | Every one of the 564 input states, plus the copy rules (no scores, consensus claims or travel minutes). |
| `test/browser.mjs` | Playwright checks at desktop and phone sizes: mouse, keyboard, touch drag, reduced motion, no JS, overflow at six widths, console errors. |

## Run it

```sh
node build.mjs                 # writes index.html, dist/talk-back.html (single file), dist/artifact.html
npm test                       # engine tests
python3 -m http.server 8765    # then open http://127.0.0.1:8765/index.html
node test/browser.mjs http://127.0.0.1:8765/index.html ./shots   # needs `playwright` resolvable from this folder
```

## Deliberate departures from the current site

- Background is a neutral near-white (`#FBFBFA`), not the brand's warm `#F7F4EE`, and Planic's side is a deep violet field (`#3A2FC0`). Needs the owner's decision before it goes anywhere near `public/`.
- Two options (street-food crawl, kebab place) extend `docs/redesign/SCENARIO.md`. The default state is unchanged from the scenario.
