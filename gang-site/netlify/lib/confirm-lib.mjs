// Shared by send-confirm and confirm. Nothing is stored: the confirm link itself carries the sign-up, signed with a secret,
// so only a link we emailed can confirm a spot. Keys live in Netlify environment variables, never in this code:
//   CONFIRM_SECRET   a long random string (placed by Nischal)
//   GMAIL_USER          Planic's own Gmail address that sends the confirm emails (placed by Nischal)
//   GMAIL_APP_PASSWORD  an app password for that Gmail account, never its real password (placed by Nischal)
import { createHmac, timingSafeEqual } from 'node:crypto';

export const FIELDS = ['first_name', 'college', 'college_other', 'email', 'gang', 'role', 'invited_by'];
const b64 = s => Buffer.from(s).toString('base64url');
const sign = s => createHmac('sha256', process.env.CONFIRM_SECRET || '').update(s).digest('base64url');

export function makeToken(data, days = 7) {
  const body = b64(JSON.stringify({ ...data, exp: Date.now() + days * 864e5 }));
  return body + '.' + sign(body);
}

export function readToken(t) {
  const [body, mac] = String(t || '').split('.');
  if (!body || !mac || !process.env.CONFIRM_SECRET) return null;
  const want = Buffer.from(sign(body)), got = Buffer.from(mac);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  try { const d = JSON.parse(Buffer.from(body, 'base64url').toString()); return d.exp > Date.now() ? d : null; } catch { return null; }
}

export const clean = (v, n = 80) => String(v || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, n);
export const esc = t => t.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
