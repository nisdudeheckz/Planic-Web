import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, explainChange, DEFAULT_ASKS, FREE_STOPS, BUDGET, OPTIONS, TRIP_BUFFER, MIN_STAY } from '../engine.js';

function allAsks() {
  const out = [];
  for (const food of ['veg', 'any']) for (const novelty of ['new', 'usual'])
    for (let budget = BUDGET.min; budget <= BUDGET.max; budget += BUDGET.step)
      for (const free of FREE_STOPS) out.push({ food, novelty, budget, free });
  return out;
}

test('default state matches SCENARIO.md', () => {
  const r = evaluate(DEFAULT_ASKS);
  assert.equal(r.pick.id, 'board');
  assert.equal(r.plan.title, 'Board games, then momos');
  assert.equal(r.plan.meta, 'Friday at 7:30 PM in Hauz Khas, about ₹550 each.');
  assert.match(r.plan.trade[0], /Meera has the longest trip, so it starts at 7:30 rather than 7\./);
  const why = Object.fromEntries(r.others.map((o) => [o.id, o.why]));
  assert.equal(why.rooftop, '₹2,000+ each, over Meera’s ₹600');
  assert.equal(why.cafe, 'Not new for Rohan');
  assert.equal(why.brunch, 'Closes at 6 PM, before Kabir is free');
});

test('every one of the 564 states gives a plan or an honest "nothing fits"', () => {
  const states = allAsks();
  assert.equal(states.length, 2 * 2 * 47 * 3);
  for (const a of states) {
    const r = evaluate(a);
    if (r.pick) {
      // the pick really satisfies every ask
      assert.ok(r.pick.price <= a.budget, JSON.stringify(a));
      if (a.food === 'veg') assert.ok(r.pick.veg);
      if (a.novelty === 'new') assert.ok(r.pick.isNew);
      assert.ok(a.free + TRIP_BUFFER + MIN_STAY <= r.pick.closes);
      assert.equal(r.plan.reasons.length, 4);
      assert.equal(r.bends.length, 0);
    } else {
      assert.ok(r.bends.length >= 1, 'no-plan state must offer a bend ' + JSON.stringify(a));
      for (const b of r.bends) {
        const fixed = evaluate({ ...a, ...b.patch });
        assert.ok(fixed.pick, 'bend must lead to a plan ' + JSON.stringify(a) + b.text);
      }
    }
    assert.equal(r.others.length, r.pick ? OPTIONS.length - 1 : OPTIONS.length);
    for (const o of r.others) {
      assert.ok(o.why.length > 0);
      if (o.fix && o.fix.patch) {
        const t = evaluate({ ...a, ...o.fix.patch });
        const row = t.pick && t.pick.id === o.id ? null : t.others.find((x) => x.id === o.id);
        assert.ok(!row || row.fits, `"Try it" for ${o.id} must make it fit: ${JSON.stringify(a)}`);
      }
    }
  }
});

test('copy never uses scores, consensus claims or travel minutes', () => {
  const banned = /%|\b4\/4\b|everyone’s in|everybody|\bmin\b|minutes|perfect|guarantee/i;
  for (const a of allAsks()) {
    const r = evaluate(a);
    const text = JSON.stringify([r.plan, r.others.map((o) => [o.why, o.fix && o.fix.text]), r.bends.map((b) => b.text)]);
    assert.doesNotMatch(text, banned, JSON.stringify(a));
  }
});

test('change explanations for the headline moves', () => {
  const d = DEFAULT_ASKS;
  const cases = [
    [{ budget: 2500 }, /The rooftop fits too, but it costs more, so the plan holds/],
    [{ free: 17 * 60 }, /street-food crawl fits all four, and it’s ₹200 cheaper each/],
    [{ food: 'any' }, /kebab place fits all four, and it’s ₹150 cheaper each/],
    [{ novelty: 'usual' }, /The usual café fits too, but it isn’t new, so the plan holds/],
    [{ free: 21 * 60 }, /Still the board-game café, now starting at 9:30 PM/],
    [{ budget: 400 }, /Nothing fits all four, so Planic won’t guess/],
  ];
  for (const [patch, re] of cases) {
    const e = explainChange(d, { ...d, ...patch });
    assert.match(e.text, re, JSON.stringify(patch) + ' → ' + e.text);
  }
  assert.match(explainChange({ ...d, budget: 400 }, d, { reset: true }).text, /^Back to what they actually said, so the board-game café fits all four\.$/);
});

test('every single-step change from every state has an explanation', () => {
  for (const a of allAsks()) {
    const moves = [{ food: a.food === 'veg' ? 'any' : 'veg' }, { novelty: a.novelty === 'new' ? 'usual' : 'new' }, ...FREE_STOPS.filter((f) => f !== a.free).map((free) => ({ free }))];
    if (a.budget < BUDGET.max) moves.push({ budget: a.budget + BUDGET.step });
    for (const m of moves) {
      const e = explainChange(a, { ...a, ...m });
      assert.ok(e.text.length > 20 && !/undefined|NaN/.test(e.text), JSON.stringify([a, m, e.text]));
    }
  }
});
