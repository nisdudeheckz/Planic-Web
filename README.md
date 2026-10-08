# Planic — landing site

The public marketing site for **Planic**, a consumer product (in early development, built in New Delhi) that helps groups turn "let's go somewhere" into a plan everyone actually wants to do.

This repository is only the landing page. It is not the Planic app.

## What's here

- `public/index.html` is the single-page landing site: hero, problem, how it works, product preview, differentiator, early-access signup and footer
- `public/privacy.html` and `public/contact.html` are the simple supporting pages
- `public/assets/styles.css` holds all styles, with the brand palette as CSS variables
- `public/assets/main.js` adds the progressive enhancements: mobile menu, scroll reveals and AJAX form submission

## Technology

- Plain HTML, CSS and a small amount of vanilla JS. There is no framework, no build step and no runtime dependencies.
- **Netlify Forms** stores early-access emails (`early-access` form) and contact messages (`contact` form). Submissions appear in the Netlify UI under **Forms**, and you can export them as CSV.
- Fonts: Bricolage Grotesque (display) and Instrument Sans (body), loaded from Google Fonts.

## Run locally

```bash
netlify dev
```

Or open `public/index.html` directly, or serve the folder with any static server (`npx serve public`). Form submissions only work when the site is deployed on Netlify, or under `netlify dev`.

## Deploy

Netlify publishes the `public/` directory with no build command (see `netlify.toml`). To use a custom domain, add it under **Domain management** in Netlify.
