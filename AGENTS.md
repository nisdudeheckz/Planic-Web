# AGENTS.md

## What this is
The static marketing/landing site for Planic, an early-stage group going-out decision product. It is **not** the app. Do not add auth, dashboards, databases or AI integrations here unless the owner explicitly asks.

## Architecture
- `public/` is the publish directory, served as-is (`netlify.toml`, with no build command).
  - `index.html` is the landing page, with sections in order: nav, hero, problem, how, preview, diff, early access, footer.
  - `privacy.html` and `contact.html` copy the nav and footer markup from `index.html`. If you change the nav or footer, update all three.
  - `assets/styles.css` is the single stylesheet. Brand tokens live in `:root`.
  - `assets/main.js` is a single IIFE with no dependencies.
- Forms use Netlify Forms (`data-netlify="true"` plus a `form-name` hidden input and a honeypot). JS submits them as urlencoded POST to `/`. The Forms feature was enabled through the netlify-forms skill's `enable.cjs` script.

## Conventions
- Brand palette only: ink `#111216`, periwinkle `#7567F8` (primary), coral `#FF6B61` (CTAs and confirmation), lavender `#B8AEFF`, off-white `#F7F4EE`, text `#17171A`, neutral `#E9E5DE`. Coral buttons use ink text for contrast.
- Animate only `transform` and `opacity`. Hidden-until-revealed states are scoped under `html.js`, so the page renders fully without JS. Honour `prefers-reduced-motion` (already handled globally).
- Scroll reveal: add the `.reveal` class. JS adds `.in` when the element is visible. A `--i` variable staggers the delay.
- Content integrity: never add invented traction, testimonials, investors, partners, user counts or launch dates. Product UI is labelled as a concept or early preview. Venue examples are generic place types, not real businesses.
