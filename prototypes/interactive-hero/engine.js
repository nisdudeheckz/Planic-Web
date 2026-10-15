// Planic "talk back" demo engine: a small, fixed, explainable model.
// Pure functions only (no DOM), so the same code renders the no-JS page at build time,
// drives the live page, and runs under `node --test`.

export const PEOPLE = {
  a: { name: 'Aanya', tone: 'coral' },
  r: { name: 'Rohan', tone: 'lav' },
  m: { name: 'Meera', tone: 'sun' },
  k: { name: 'Kabir', tone: 'mint' },
};

// What the group actually said (docs/redesign/SCENARIO.md).
export const DEFAULT_ASKS = Object.freeze({ food: 'veg', novelty: 'new', budget: 600, free: 19 * 60 });

export const FREE_STOPS = [17 * 60, 19 * 60, 21 * 60];
export const BUDGET = { min: 200, max: 2500, step: 50 };
export const TRIP_BUFFER = 30; // Meera has the longest trip, so the plan starts 30 min after Kabir is free.
export const MIN_STAY = 120;   // An option needs at least two hours before it closes.

// Illustrative options. No real venues; prices and hours are made up for the demo.
export const OPTIONS = [
  { id: 'board', name: 'Board-game café', area: 'Hauz Khas', short: 'the board-game café', price: 550, veg: true, isNew: true, closes: 23 * 60 + 30 },
  { id: 'rooftop', name: 'Rooftop lounge', short: 'the rooftop', price: 2000, plus: true, veg: true, isNew: true, closes: 25 * 60 },
  { id: 'cafe', name: 'Our usual café', short: 'the usual café', price: 450, veg: true, isNew: false, closes: 23 * 60 },
  { id: 'brunch', name: 'Brunch spot', short: 'the brunch spot', price: 500, veg: true, isNew: true, closes: 18 * 60 },
  { id: 'crawl', name: 'Street-food crawl', short: 'the street-food crawl', price: 350, veg: true, isNew: true, closes: 21 * 60 },
  { id: 'kebab', name: 'Kebab place with live music', short: 'the kebab place', price: 400, veg: false, isNew: true, closes: 24 * 60 },
];

/* ---------- formatting ---------- */

export const rupees = (n) => '₹' + n.toLocaleString('en-IN');
export const priceLabel = (o) => rupees(o.price) + (o.plus ? '+' : '');

function clock(m) {
  const h24 = Math.floor(m / 60) % 24;
  const mm = m % 60;
  const h = h24 % 12 || 12;
  return { h, mm, pm: h24 >= 12 };
}
export function timeShort(m) {
  const { h, mm } = clock(m);
  return mm ? `${h}:${String(mm).padStart(2, '0')}` : `${h}`;
}
export function timeLong(m) {
  const { pm } = clock(m);
  return `${timeShort(m)} ${pm ? 'PM' : 'AM'}`;
}
export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/* ---------- the asks, as the group would say them ---------- */

export function sayFood(v) { return v === 'veg' ? 'veg options pls' : 'I’ll eat anything'; }
export function sayNovelty(v) { return v === 'new' ? 'somewhere new!!' : 'the usual’s fine'; }
export function sayBudget(v) { return `${rupees(v)} max`; }
export function sayFree(v) { return `free after ${timeShort(v)}`; }

/* ---------- evaluation ---------- */

function startOf(asks) { return asks.free + TRIP_BUFFER; }

function failsFor(o, asks) {
  const start = startOf(asks);
  const fails = [];
  if (asks.food === 'veg' && !o.veg) fails.push({ key: 'food', who: 'a', text: 'Few veg options for Aanya' });
  if (asks.novelty === 'new' && !o.isNew) fails.push({ key: 'novelty', who: 'r', text: 'Not new for Rohan' });
  if (o.price > asks.budget) fails.push({ key: 'budget', who: 'm', text: `${priceLabel(o)} each, over Meera’s ${rupees(asks.budget)}` });
  if (start + MIN_STAY > o.closes) {
    const text = o.closes <= asks.free
      ? `Closes at ${timeLong(o.closes)}, before Kabir is free`
      : `Closes at ${timeLong(o.closes)}, too early for a ${timeShort(start)} start`;
    fails.push({ key: 'time', who: 'k', text });
  }
  return fails;
}

// The smallest change to the asks that would make this option fit everyone, or null if none can.
function fixFor(o, fails, asks) {
  const patch = {};
  const words = [];
  for (const f of fails) {
    if (f.key === 'food') { patch.food = 'any'; words.push('Aanya’s fine without a veg menu'); }
    if (f.key === 'novelty') { patch.novelty = 'usual'; words.push('Rohan’s fine with the usual'); }
    if (f.key === 'budget') { patch.budget = o.price; words.push(`Meera stretches to ${rupees(o.price)}`); }
    if (f.key === 'time') {
      const ok = FREE_STOPS.filter((t) => t + TRIP_BUFFER + MIN_STAY <= o.closes && t < asks.free);
      if (!ok.length) return null;
      patch.free = ok[ok.length - 1];
      words.push(`Kabir’s free by ${timeShort(patch.free)}`);
    }
  }
  return { patch, text: words.join(' and ') };
}

function rank(a, b) {
  if (a.isNew !== b.isNew) return a.isNew ? -1 : 1; // prefer somewhere new
  return a.price - b.price;                          // then the cheaper one
}

export function planFor(o, asks) {
  const start = startOf(asks);
  const meta = `Friday at ${timeLong(start)}${o.area ? ` in ${o.area}` : ''}, about ${priceLabel(o)} each.`;
  let title = o.name;
  let then = `Meet there at ${timeLong(start)}.`;
  const trade = [`Meera has the longest trip, so it starts at ${timeShort(start)} rather than ${timeShort(asks.free)}.`];

  if (o.id === 'board') {
    if (start <= 20 * 60) {
      title = 'Board games, then momos';
      then = `Meet near the metro at ${timeLong(start - 10)}. Momos nearby from ${timeLong(start + 120)}.`;
    } else {
      title = 'Board games till close';
      then = `Meet near the metro at ${timeLong(start - 10)}. Play till ${timeLong(o.closes)}.`;
      trade.push('It starts late, so there’s no time for momos.');
    }
  } else if (o.id === 'crawl') {
    title = 'A street-food crawl';
    then = `Meet at ${timeLong(start - 10)}. Done by ${timeLong(o.closes)}.`;
    trade.push(`It’s an early night: the stalls wind down by ${timeShort(o.closes)}.`);
  } else if (o.id === 'kebab') {
    title = 'Kebabs and a live set';
    then = `Meet at ${timeLong(start - 10)}. Music till late.`;
  } else if (o.id === 'cafe') {
    title = 'The usual café';
  } else if (o.id === 'rooftop') {
    title = 'A rooftop evening';
  }

  const reasons = [
    { who: 'a', text: asks.food === 'veg' ? 'Veg menu' : (o.veg ? 'Veg menu anyway' : 'Few veg dishes, and Aanya’s fine with that') },
    { who: 'r', text: o.isNew ? 'New to all four' : 'The usual, which Rohan’s fine with' },
    { who: 'm', text: o.price === asks.budget ? `${priceLabel(o)}, right at her limit` : `About ${priceLabel(o)}, under her ${rupees(asks.budget)}` },
    { who: 'k', text: `Starts ${timeShort(start)}, after he’s free at ${timeShort(asks.free)}` },
  ];
  return { id: o.id, title, meta, then, reasons, trade };
}

// Why the pick beat the other options that also fit (rule 2: new first, then cheaper).
function pickWhy(o, alsoFit) {
  if (!alsoFit.length) return 'The only option that works for all four';
  const parts = [];
  if (o.isNew && alsoFit.some((x) => !x.isNew)) parts.push('it’s new');
  if (alsoFit.some((x) => x.isNew === o.isNew)) parts.push(o.isNew ? 'it’s the cheapest new one' : 'it’s the cheapest');
  return `Works for all four, and ${parts.join(', and ')}`;
}

export function listOf(items) {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

export function evaluate(asks) {
  const rows = OPTIONS.map((o) => {
    const fails = failsFor(o, asks);
    return { o, fails, fix: fails.length ? fixFor(o, fails, asks) : null };
  });
  const fits = rows.filter((r) => !r.fails.length).sort((x, y) => rank(x.o, y.o));
  const pick = fits[0] || null;

  // Rows for "why not": everything except the pick, with a plain reason.
  const others = rows.filter((r) => r !== pick).map((r) => {
    let why;
    if (r.fails.length) {
      why = r.fails.map((f) => f.text).join('; ');
    } else if (pick.o.isNew && !r.o.isNew) {
      why = 'Fits everyone, but it isn’t new';
    } else {
      why = `Fits everyone, but costs ${rupees(r.o.price - pick.o.price)}${r.o.plus ? '+' : ''} more each`;
    }
    const fix = r.fails.length
      ? (r.fix ? { text: `Fits everyone if ${r.fix.text}.`, patch: r.fix.patch } : { text: 'Can’t fit a Friday evening.', patch: null })
      : null;
    return { id: r.o.id, name: r.o.name, price: priceLabel(r.o), fits: !r.fails.length, fails: r.fails, why, fix };
  });

  let bends = [];
  if (!pick) {
    const fixable = rows.filter((r) => r.fix);
    const least = Math.min(...fixable.map((r) => r.fails.length));
    bends = fixable
      .filter((r) => r.fails.length === least)
      .sort((x, y) => rank(x.o, y.o))
      .slice(0, 3)
      .map((r) => ({ id: r.o.id, name: r.o.name, text: `${cap(r.fix.text)}.`, patch: r.fix.patch }));
  }

  // Every option in a fixed order, with who it works for: the "options board".
  const board = rows.map((r) => {
    const row = r === pick ? null : others.find((x) => x.id === r.o.id);
    return {
      id: r.o.id, name: r.o.name, price: priceLabel(r.o), picked: r === pick,
      fits: !r.fails.length,
      people: Object.fromEntries(Object.keys(PEOPLE).map((w) => [w, r.fails.find((f) => f.who === w) || null])),
      why: row ? row.why : pickWhy(r.o, fits.filter((f) => f !== r).map((f) => f.o)),
      fix: row ? row.fix : null,
    };
  });

  // What each person's ask rules out, for the "nothing fits" view.
  const limits = Object.fromEntries(Object.keys(PEOPLE).map((w) => {
    const out = rows.filter((r) => r.fails.some((f) => f.who === w)).map((r) => r.o.short);
    return [w, out];
  }));

  return {
    asks: { ...asks },
    start: startOf(asks),
    board,
    limits,
    pick: pick ? pick.o : null,
    plan: pick ? planFor(pick.o, asks) : null,
    others,
    bends,
  };
}

/* ---------- explaining a change ---------- */

function changePhrases(prev, next) {
  const out = [];
  if (prev.food !== next.food) out.push(next.food === 'veg' ? 'Aanya wants veg options again' : 'Aanya’s open to anything now');
  if (prev.novelty !== next.novelty) out.push(next.novelty === 'new' ? 'Rohan wants somewhere new again' : 'Rohan’s fine with the usual now');
  if (prev.budget !== next.budget) out.push(`Meera’s budget is ${rupees(next.budget)} now`);
  if (prev.free !== next.free) out.push(`Kabir’s free after ${timeShort(next.free)} now`);
  return out;
}

export function sameAsks(x, y) {
  return x.food === y.food && x.novelty === y.novelty && x.budget === y.budget && x.free === y.free;
}

export function explainChange(prevAsks, nextAsks, { reset = false } = {}) {
  const prev = evaluate(prevAsks);
  const next = evaluate(nextAsks);
  const phrases = changePhrases(prevAsks, nextAsks);
  if (!phrases.length) return { kind: 'none', text: '' };
  const joined = phrases.map((t, i) => (i < phrases.length - 1 ? t.replace(/ now$/, '') : t)).join(' and ');
  const lead = reset ? 'Back to what they actually said' : cap(joined);

  if (!next.pick) {
    return { kind: 'none-fits', text: `${lead}. Nothing fits all four, so Planic won’t guess.` };
  }
  const name = next.pick.short;
  if (!prev.pick) {
    return { kind: 'new', text: `${lead}, so ${name} fits all four.` };
  }
  if (prev.pick.id === next.pick.id) {
    if (prev.start !== next.start) {
      return { kind: 'hold', text: `${lead}. Still ${name}, now starting at ${timeLong(next.start)}.` };
    }
    const newlyFit = next.others.filter((r) => r.fits && !prev.others.find((p) => p.id === r.id && p.fits));
    if (newlyFit.length) {
      const r = newlyFit[0];
      const o = OPTIONS.find((x) => x.id === r.id);
      const why = next.pick.isNew && !o.isNew ? 'it isn’t new' : 'it costs more';
      return { kind: 'hold', text: `${lead}. ${cap(o.short)} fits too, but ${why}, so the plan holds.` };
    }
    return { kind: 'hold', text: `${lead}. ${cap(name)} still fits everyone, so the plan holds.` };
  }
  const prevRow = next.others.find((r) => r.id === prev.pick.id);
  if (prevRow && !prevRow.fits) {
    return { kind: 'new', text: `${lead}, so ${prev.pick.short} is out (${prevRow.fails[0].text.charAt(0).toLowerCase() + prevRow.fails[0].text.slice(1)}). ${cap(name)} fits all four.` };
  }
  const better = next.pick.isNew && !prev.pick.isNew
    ? 'it’s somewhere new'
    : `it’s ${rupees(prev.pick.price - next.pick.price)} cheaper each`;
  return { kind: 'new', text: `${lead}, so ${name} fits all four, and ${better}.` };
}
