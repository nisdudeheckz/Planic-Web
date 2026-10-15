# Pass 0 — Audit and staged plan

Audit of `main` at `8981933`, read against `docs/PLANIC_WEBSITE_REDESIGN_BRIEF.md`. Screenshots were taken locally with headless Chromium (Playwright) at 320, 375, 430, 768, 1024 and 1440px, with and without `prefers-reduced-motion`. The live Netlify site was not inspected: from this environment I can't confirm which deploy is connected, only that the first commit came from Netlify.

## 1. Current site, file by file

### `public/index.html` (380 lines)
- The structure is sound: skip link, `header` / `main` / `footer` landmarks, one `h1`, an `h2` for each section, and a labelled form.
- **Hero visual (lines 60–119).** A phone mockup sits between two blurred blobs, and four floating "say" bubbles are absolutely positioned around it. At 1440px and at 375px the bubbles cover the phone's own text ("The usual four", "Bowling & arcade", the "4/4 in" pill). The bubbles never visibly *become* anything: the transformation happens inside a 290px phone, in 11px type. This is the "phone floating in gradient blobs" pattern the brief asks us to avoid.
- The hero visual is `role="img"` with a one-line label, so screen-reader users get none of the scenario.
- Scenario details disagree between sections. The hero says "~₹700 each" and Meera says "Under ₹800", while the preview says Meera is "Under ₹600" and the budget is "Up to ₹800". The rooftop is "Too far for 2 of you" in the hero but "Over budget for 3 of 4" in the comparison. Step 3 shows a different plan (Saturday street food, Chandni Chowk) from the hero and the preview (Friday board games, Hauz Khas).
- The form markup is correct for Netlify Forms: `data-netlify`, a `form-name` hidden input, and a honeypot with `netlify-honeypot`. It has `novalidate` hard-coded, so with JavaScript off the browser skips its own email validation. That's minor (Netlify still accepts the post) and is left for Pass 3.

### `public/assets/styles.css` (578 lines)
- Tokens in `:root` are tidy, but two avatar colours (`#F5C76B`, `#9ED9B8`) and several dark tints (`#4a3fd0`, `#3c33b0`, `#c8463d`, `#b8382f`) are hard-coded where they're used.
- **Continuous, purposeless motion in the hero:** `float` (7s, infinite) on the phone, `bob` (6s, infinite) on each bubble, `ping` (infinite) on the location dot, and two `filter: blur(50px)` blobs. Blur is expensive to composite on mobile, and none of this motion carries meaning.
- Reduced motion is handled with a global override (durations go to 0.01ms and delays to 0). Because the entrance animations use `forwards`, content ends visible. That's correct and is kept.
- `.mark { white-space: nowrap }` forces "Turn" onto a line of its own at desktop widths.
- `.js .problem__answer.reveal { transition-delay: 2.6s }` makes readers wait for the answer line (Pass 2).
- `.step--2` uses a translate offset that fights the `.reveal` transform (Pass 2).
- `.page .ea__error` sits after the reduced-motion block, which is harmless but out of place.

### `public/assets/main.js` (92 lines)
- Clean and dependency-free.
- The mobile menu closes on Escape but doesn't return focus to the toggle, and it doesn't close on an outside tap (Pass 3).
- The form handler covers validation, loading, success and error. It doesn't guard against a double submit beyond disabling the button, which is adequate.

### `netlify.toml`
- Publishes `public/` with no build step, and sets sensible security headers.
- **Concrete issue:** `/assets/*` is cached for 7 days (`max-age=604800`), but the file names aren't fingerprinted. After any redesign deploy, a returning visitor can get the new HTML with last week's CSS and JS, which would leave the new hero unstyled. Fix in Pass 1: version the asset URLs in `index.html` (`?v=…`). This changes nothing in the Netlify configuration.

## 2. Three highest-impact opportunities

1. **Make the hero visual *be* the thesis.** Replace the phone and blobs with a single authored composition in which the group's own words become the criteria that options are judged against, and one plan comes out with its reasons. This is the one image only Planic could own.
2. **Show trade-offs instead of scores.** The current percentages ("94%", "81%", "74") imply a ranking engine we can't explain. A visible per-person check (veg ✓, new ✓, budget ✕) explains *why* an option fits, which is the brief's core differentiator, and it's honest.
3. **One scenario, one visual grammar across the page.** Use the same four people, the same constraints and the same Friday plan in the hero, the problem chat, the steps and the preview, so the page reads as one story. The hero sets the grammar in Pass 1, and Pass 2 reuses it.

## 3. Claims that are misleading or unverified

| Where | Claim | Issue | Pass |
|---|---|---|---|
| Hero phone, preview screen 3 | "94%", "81%", "74" fit scores | No real calculation exists behind them | Hero: 1 · Preview: 2 |
| Hero, preview screen 4 | "4/4 in", "4 of 4 are in" | Implies guaranteed consensus or live voting | Hero: 1 · Preview: 2 |
| Preview caption | "One plan. Everybody's in." | Absolute agreement | 2 |
| Hero lede | "Planic understands what your group is actually looking for" | States capability as fact for an unbuilt product | 1 |
| Step 3 | "Yes! / I'm in / Perfect" reactions | Implies social proof and consensus | 2 |
| Diff copy | "something you're unlikely to regret" | Soft promise; acceptable but worth softening | 2 |
| Hero, preview | "22 min avg", "28 min avg", "Keeping it central so no one travels over 30 min" | Implies live travel-time computation | Hero: 1 · Preview: 2 |
| Hero location dot | Pulsing "live" ping | Visually signals a live service | 1 |

Fine as they are: "Early access · In development", "Concept preview", "Screens are concepts", neighbourhood names used as areas only (no real businesses), and no user counts, logos or dates.

## 4. Staged plan

**Pass 1 (this PR): design system and hero**
- `styles.css`: add tokens for person colours, accessible dark tints, motion durations and surfaces. Remove the hero-only phone, bubble and blob styles. Add the hero composition and the story component.
- `index.html`: rewrite the hero visual as the "many signals → one plan" story (§5). Soften the lede so it matches the visual. Make the location dot static. Version the asset URLs.
- `main.js`: add a small story controller (about 60 lines) that plays once when visible, with stepper controls and a replay button. No dependencies.
- Leave every other section, the nav, the form and `netlify.toml` untouched.

**Pass 2: connect the narrative**
- Problem chat uses the same four people and the same messages, with no 2.6s wait.
- How it works reuses the signal chips, the check grid and the plan ticket instead of three unrelated illustrations.
- Preview drops to fewer, stronger screens, replaces fit scores with reasons, removes "4 of 4 are in" and aligns budgets and times.
- Diff becomes one focused comparison.

**Pass 3: polish and validate**
- Nav focus return and outside tap.
- `novalidate` set from JS only.
- Section rhythm and timing.
- A full form test on a Netlify deploy preview.
- Keyboard pass, and contrast checks across the page.

## 5. Signature interaction: how it's meant to work

The scenario: four friends on Friday night.
- Aanya: "veg options pls"
- Rohan: "somewhere new!"
- Meera: "nothing over ₹600, coming from Noida"
- Kabir: "anything works, free after 7"

The demo runs in three states:
1. **Heard.** The messages arrive as scattered, tilted chat bubbles.
2. **Weighed.** The bubbles straighten into four tidy criteria chips (Veg-friendly · Somewhere new · Under ₹600 · After 7 PM), each tagged with its person. Three options are checked against each person in turn, column by column. The rooftop fails Meera's budget. The usual café fails Rohan's "new". The board-game café passes all four.
3. **Planned.** The poor fits recede, and a plan ticket rises from the winning row: Friday 7:30, board games then momos, Hauz Khas, about ₹550 each. It shows one reason per person and one honest trade-off ("Meera has the longest ride, so it starts at 7:30, not 7").

How it behaves:
- It plays once, when the visual is at least 35% in view, and lasts about 5 seconds. It's never scroll-linked and never loops.
- The three step labels are buttons, and a replay button sits in the caption.
- **Static state** (no JS, reduced motion, slow device): the finished, organised state, with everything readable.
- **Reduced motion:** no autoplay and no transitions. The step buttons still switch states instantly.
- **Screen readers:** the visual is hidden, and a plain-language summary of the same scenario is read instead.
- The whole thing is labelled "Concept demo".
