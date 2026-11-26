// The link in the email lands here. A valid link records the sign-up in the "confirmed" Netlify form
// (the tracker counts only those), then sends the person back to the page, which shows their spot is confirmed.
import { FIELDS, readToken } from '../lib/confirm-lib.mjs';

export default async (req) => {
  const site = process.env.URL || new URL(req.url).origin;
  const d = readToken(new URL(req.url).searchParams.get('t'));
  if (!d) return Response.redirect(`${site}/?confirmed=0`, 302);
  const body = new URLSearchParams({ 'form-name': 'confirmed', ...Object.fromEntries(FIELDS.map(k => [k, d[k] || ''])) });
  const r = await fetch(`${site}/`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() }).catch(() => null);
  if (!r || !r.ok) return Response.redirect(`${site}/?confirmed=0`, 302);
  return Response.redirect(`${site}/?confirmed=1`, 302);
};
