// HTML string builders shared by the build step (no-JS page) and the live page.
import { PEOPLE } from './engine.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function reasonsHTML(plan) {
  return plan.reasons.map((r) =>
    `<li class="why" data-who="${r.who}"><span class="why__who">${PEOPLE[r.who].name}</span><span class="why__text">${esc(r.text)}</span></li>`
  ).join('');
}

export function tradeHTML(plan) {
  return plan.trade.map((t, i) => `<p class="trade">${i === 0 ? '<b>Trade-off.</b> ' : ''}${esc(t)}</p>`).join('');
}

export function othersHTML(result, { interactive = true } = {}) {
  return result.others.map((o) => {
    const fix = o.fix
      ? `<p class="other__fix">${esc(o.fix.text)}${o.fix.patch && interactive ? ` <button type="button" class="try" data-patch='${esc(JSON.stringify(o.fix.patch))}'>Try it</button>` : ''}</p>`
      : '';
    const strike = o.fails.length ? ` style="--strike: var(--${PEOPLE[o.fails[0].who].tone})"` : '';
    return `<li class="other${o.fits ? ' other--fits' : ''}" data-id="${o.id}"${strike}>` +
      `<p class="other__name"><s>${esc(o.name)}</s></p>` +
      `<p class="other__why">${esc(o.why)}</p>${fix}</li>`;
  }).join('');
}

export function bendsHTML(result, { interactive = true } = {}) {
  return result.bends.map((b) =>
    `<li class="bend" data-id="${b.id}"><b>${esc(b.name)}</b> <span>${esc(b.text)}</span>` +
    (interactive ? ` <button type="button" class="try" data-patch='${esc(JSON.stringify(b.patch))}'>Try it</button>` : '') +
    `</li>`
  ).join('');
}

export const NO_PLAN = {
  title: 'Not without someone bending',
  meta: 'Nothing fits all four. Planic won’t pick one and pretend. Each of these needs just one person to give a little:',
};
