// HTML string builders shared by the build step (no-JS page) and the live page.
import { PEOPLE, listOf, cap, sayBudget, sayFree } from './engine.js';

export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// One row per person, beside what they said. With a plan: what the plan does for them.
// With no plan: what their ask rules out, so the blocking constraints are visible.
export function whyText(result, who) {
  if (result.plan) return result.plan.reasons.find((r) => r.who === who).text;
  const out = result.limits[who];
  const a = result.asks;
  const said = { a: a.food === 'veg' ? 'Veg options' : null, r: a.novelty === 'new' ? 'Somewhere new' : null, m: sayBudget(a.budget), k: cap(sayFree(a.free)) }[who];
  if (!said || !out.length) return 'Rules nothing out';
  return `${said} rules out ${listOf(out)}`;
}

export function whyRowsHTML(result) {
  return Object.keys(PEOPLE).map((w) =>
    `<li class="why" data-who="${w}"><i class="why__dot" aria-hidden="true"></i><span class="why__who">${PEOPLE[w].name}</span><span class="why__text">${esc(whyText(result, w))}</span></li>`
  ).join('');
}

export function tradeHTML(plan) {
  return plan.trade.map((t, i) => `<p class="trade">${i === 0 ? '<b>Trade-off</b> ' : ''}${esc(t)}</p>`).join('');
}

export function bendsHTML(result, { interactive = true } = {}) {
  return result.bends.map((b) =>
    `<li class="bend" data-id="${b.id}"><b class="bend__name">${esc(b.name)}</b> <span class="bend__text">${esc(b.text)}</span>` +
    (interactive ? ` <button type="button" class="try" data-patch='${esc(JSON.stringify(b.patch))}' data-name="${esc(b.name)}">Try it</button>` : '') +
    `</li>`
  ).join('');
}

// The options board: every option against every person, in a fixed order.
export function boardHTML(result, { interactive = true } = {}) {
  return result.board.map((o) => {
    const cells = Object.keys(PEOPLE).map((w) => {
      const f = o.people[w];
      const name = PEOPLE[w].name;
      return `<td class="mk ${f ? 'mk--no' : 'mk--ok'}" data-who="${w}"><i aria-hidden="true">${name[0]}</i>` +
        `<span class="sr-only">${f ? `No for ${name}: ${esc(f.text)}` : `Works for ${name}`}</span></td>`;
    }).join('');
    const fix = o.fix
      ? `<p class="opt__fix">${esc(o.fix.text)}${o.fix.patch && interactive ? ` <button type="button" class="try" data-patch='${esc(JSON.stringify(o.fix.patch))}' data-name="${esc(o.name)}">Try it</button>` : ''}</p>`
      : '';
    const tag = o.picked ? '<span class="opt__tag">Planic’s pick</span>' : (o.fits ? '<span class="opt__tag opt__tag--fits">Fits, not picked</span>' : '');
    return `<tr class="opt${o.picked ? ' is-picked' : ''}${o.fits ? ' is-fit' : ''}" data-id="${o.id}">` +
      `<th scope="row"><span class="opt__name">${esc(o.name)}</span> <span class="opt__price">${esc(o.price)}</span>${tag}</th>` +
      cells +
      `<td class="opt__why"><p>${esc(o.why)}</p>${fix}</td></tr>`;
  }).join('');
}

export const NO_PLAN = {
  title: 'Nothing fits all four yet',
  meta: 'Planic won’t pick one and pretend it works. Each of these needs one person to give a little:',
};
