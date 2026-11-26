# Gang sign-up site (waitlist)

A separate Netlify site for the "Save your gang's spot" waitlist page. Not the stop-panic site.

- `index.html`: the page (built from the painted draft).
- `netlify/functions/send-confirm.mjs`, `confirm.mjs`: the confirm-your-email link. Signed link, nothing stored;
  a tapped link records the sign-up in the `confirmed` Netlify form.
- Netlify settings for this site: base directory `gang-site`, no build command.
- Environment variables (placed by Nischal in Netlify, never in this repo): `CONFIRM_SECRET`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`.
- Counting: download both form exports (`early-access`, `confirmed`) and run
  `python3 gang_tracker.py early-access.csv --confirmed confirmed.csv` (script in the Planic project files, planic/web/tools/).
