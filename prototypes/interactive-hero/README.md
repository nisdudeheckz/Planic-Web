# "Talk back" hero prototype

An isolated prototype of an interactive Planic hero: change what one of four friends said, and the illustrative plan rewrites itself and says why (or says why it held). It lives outside `public/`, so it is not part of the Netlify site and nothing here is deployed.

Storyboard, art direction and research notes: `/mnt/project-files/planic-redesign/interactive/` in the project, summarised in the prototype thread.

## Files

| File | What it is |
|---|---|
| `engine.js` | The demo's whole decision model: four asks, six made-up options, three rules. Pure functions, no DOM. |
| `view.js` | HTML string builders shared by the build step and the live page. |
| `hero.js` | Interaction: routes, tuners, price rail, signal and recompose motion, hover preview, phone peek bar, See why and back, the options board, rule buttons, list re-rank, sign-up validation. No dependencies. |
| `hero.css` | All styles. Animates only `transform` and `opacity`. |
| `index.src.html` | Page source: hero, options board, chat spiral, how it decides, list, sign-up, footer. `build.mjs` fills in the default plan and board so the page reads without JavaScript. |
| `test/engine.test.mjs` | Every one of the 564 input states, plus the copy rules (no scores, consensus claims or travel minutes). |
| `test/browser.mjs` | 71 Playwright checks at desktop and phone sizes: mouse, keyboard, touch drag, interruption, hold and nothing-fits states, in-place answers, the phone answer bar at 320 px, reduced motion, no JS, overflow at six widths, console errors. |
| `test/capture-full-page.mjs` | Full-page screenshots that can be trusted: scrolls the real page a screen at a time and stitches the screens (a one-shot capture leaves off-screen sections blank because of `content-visibility`). |

## Run it

```sh
node build.mjs                 # writes index.html, dist/talk-back.html (single file), dist/artifact.html
npm test                       # engine tests
python3 -m http.server 8765    # then open http://127.0.0.1:8765/index.html
node test/browser.mjs http://127.0.0.1:8765/index.html ./shots   # needs `playwright` resolvable from this folder
```

## Deliberate departures from the current site

- Palette (decided by mona): `#FBFBFA` only where it sharpens the hero's contrast; the brand's `#F7F4EE` stays for the wider page. Planic's plan is a deep violet field (`#3A2FC0`), with ink and coral sections below.
- Two options (street-food crawl, kebab place) extend `docs/redesign/SCENARIO.md` inside the labelled illustrative demo (approved by mona). The default state is unchanged from the scenario.
- The sign-up form is a prototype: it validates but never submits.

## Status (release candidate, 2026-10-15)

Awaiting mona's review. Nothing has been opened as a PR or deployed. Test results, performance notes and untested gaps (real phones, real screen readers, Safari/Firefox, the shared Artifact as a viewer sees it) are in `/mnt/project-files/planic-redesign/interactive/TEST_REPORT.md`.
