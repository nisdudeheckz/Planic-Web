// POST from the page right after a sign-up is saved: emails the person a link that confirms their spot.
// Errors never say why in detail, and nothing the person typed is logged.
import nodemailer from 'nodemailer';
import { FIELDS, makeToken, clean, esc } from '../lib/confirm-lib.mjs';

const EMAIL = /^[a-z0-9._%+-]{2,64}@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/;

export default async (req) => {
  if (req.method !== 'POST') return new Response('', { status: 405 });
  if (!process.env.CONFIRM_SECRET || !process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return Response.json({ ok: false }, { status: 503 });
  let d; try { d = await req.json(); } catch { return Response.json({ ok: false }, { status: 400 }); }
  const data = Object.fromEntries(FIELDS.map(k => [k, clean(d[k], k === 'email' ? 120 : 60)]));
  data.email = data.email.toLowerCase();
  if (!EMAIL.test(data.email) || !data.first_name || !/^[a-z0-9]{6,12}$/.test(data.gang)) return Response.json({ ok: false }, { status: 400 });

  const site = process.env.URL || new URL(req.url).origin;
  const link = `${site}/.netlify/functions/confirm?t=${makeToken(data)}`;
  const name = esc(data.first_name);
  const html = `<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#16130E">
<p>Hi ${name},</p>
<p>Tap below to confirm your gang's spot on planic!!</p>
<p><a href="${link}" style="display:inline-block;background:#F7C318;color:#16130E;font-weight:bold;padding:12px 20px;text-decoration:none">Confirm my spot</a></p>
<p style="color:#6b6455;font-size:14px">The link works for 7 days. If you didn't sign up, ignore this email and nothing happens.</p></div>`;
  const text = `Hi ${data.first_name},\n\nConfirm your gang's spot on planic!!:\n${link}\n\nThe link works for 7 days. If you didn't sign up, ignore this email.`;

  // Sent from Planic's own Gmail account through Gmail's own mail server, so it isn't marked as spam. Free up to about 500 a day.
  const mail = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true,
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD } });
  const sent = await mail.sendMail({ from: `planic!! <${process.env.GMAIL_USER}>`, to: data.email, subject: 'Confirm your spot on planic!!', html, text })
    .then(() => true, () => false);
  return Response.json({ ok: sent }, { status: sent ? 200 : 502 });
};
