// Planic "talk back": change what a friend said, and the plan answers.
// One connected event per change: the phrase rewrites itself, a signal runs down that person's
// line, and where it arrives the plan recomposes (or holds, or says nothing fits).
import { evaluate, explainChange, sameAsks, DEFAULT_ASKS, OPTIONS, BUDGET, PEOPLE, rupees, priceLabel, timeShort, sayFood, sayNovelty, sayBudget, sayFree } from './engine.js';
import { whyText, tradeHTML, bendsHTML, boardHTML, NO_PLAN } from './view.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const wide = matchMedia('(min-width: 960px)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const E_OUT = 'cubic-bezier(.23, 1, .32, 1)';
const E_IO = 'cubic-bezier(.77, 0, .175, 1)';
const E_BACK = 'cubic-bezier(.34, 1.56, .64, 1)';
const WHO = { food: 'a', novelty: 'r', budget: 'm', free: 'k' };
const KEYS = Object.keys(WHO);
const SAY = { food: sayFood, novelty: sayNovelty, budget: sayBudget, free: sayFree };
const TONE = { a: '--coral', r: '--lav', m: '--sun', k: '--mint' };
const CHIP = { crawl: 'Street-food crawl', kebab: 'Kebab place', cafe: 'Usual café', brunch: 'Brunch spot', board: 'Board-game café', rooftop: 'Rooftop' };
const ms = (n) => (reduced.matches ? 0 : n);

let asks = { ...DEFAULT_ASKS };
let result = evaluate(asks);
const history = [];
let dragBase = null;
let introRunning = false;
let lastChange = '';
let lastEdited = null;
let seq = 0;
let engaged = false;
const running = new Set();

const hero = $('.hero');
const plan = $('.plan');
const svg = $('.routes');
const titleBox = $('.plan__titlebox');
const titleEl = $('.plan__title');
const wipe = $('.wipe');
const stamp = $('.stamp');
const changeBox = $('.plan__change');
const changeText = $('.change__text');
const peek = $('.peek');
const light = $('.stage__light');
const clockEl = $('.clock');

/* ---------- small animation helpers ---------- */

function anim(el, frames, opts) {
  if (!el) return null;
  const a = el.animate(frames, opts);
  running.add(a);
  const done = () => running.delete(a);
  a.finished.then(done, done);
  return a;
}
function stopAll() { for (const a of [...running]) a.cancel(); running.clear(); }
function later(fn, t) {
  const mine = seq;
  if (!t) { fn(); return; }
  setTimeout(() => { if (mine === seq) fn(); }, t);
}
function center(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, r };
}
function inView(el, margin = 0) {
  const r = el.getBoundingClientRect();
  return r.bottom > margin && r.top < innerHeight - margin && r.width > 0;
}

/* ---------- title: set as letters so it can recompose ---------- */

function lettersHTML(text) {
  const words = text.split(' ').map((w) => `<span class="w">${[...w].map((c) => `<span class="ch">${c}</span>`).join('')}</span>`);
  return `<span class="sr-only">${text}</span><span aria-hidden="true">${words.join(' ')}</span>`;
}
function setTitleNow(text) { titleEl.dataset.text = text; titleEl.innerHTML = lettersHTML(text); }

// A band in the colour of whoever caused the change sweeps across, the new title is set
// underneath it, and the band pulls away to reveal it.
function recomposeTitle(text, tone) {
  if (titleEl.dataset.text === text) return false;
  titleEl.dataset.text = text;
  if (reduced.matches) {
    titleEl.innerHTML = lettersHTML(text);
    anim(titleEl, [{ opacity: 0 }, { opacity: 1 }], { duration: 160 });
    return true;
  }
  wipe.style.setProperty('--wipe', tone);
  // One animation: the band covers from the left, then pulls away to the right. The new words
  // are set at the moment it covers. If a newer change interrupts, the words are still swapped
  // and nothing is left covering the title.
  const DUR = 620;
  const AT = .37;
  const swap = () => {
    if (titleEl.dataset.text !== text || titleEl.querySelector('.sr-only')?.textContent === text) return;
    titleEl.innerHTML = lettersHTML(text);
    $$('.ch', titleEl).forEach((ch, i) => anim(ch,
      [{ transform: 'translateY(.28em)', opacity: 0 }, { transform: 'none', opacity: 1 }],
      { duration: 420, delay: 40 + i * 11, easing: E_OUT, fill: 'backwards' }));
  };
  const band = anim(wipe, [
    { transform: 'scaleX(0)', transformOrigin: '0 50%', easing: E_IO },
    { transform: 'scaleX(1)', transformOrigin: '0 50%', offset: AT },
    { transform: 'scaleX(1)', transformOrigin: '100% 50%', offset: AT + .001, easing: E_OUT },
    { transform: 'scaleX(0)', transformOrigin: '100% 50%' },
  ], { duration: DUR });
  const t = setTimeout(swap, DUR * AT);
  band.finished.catch(() => { clearTimeout(t); swap(); });
  return true;
}

/* ---------- the clock: start time, huge, behind the plan ---------- */

function setClock(text, animate) {
  const old = clockEl.textContent;
  if (old === text) return;
  clockEl.innerHTML = [...text].map((c) => `<span class="dg">${c}</span>`).join('');
  if (!animate || reduced.matches) return;
  $$('.dg', clockEl).forEach((d, i) => {
    if (old[i] === text[i]) return;
    anim(d, [{ transform: 'translateY(.35em)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 620, delay: 120 + i * 50, easing: E_OUT, fill: 'backwards' });
  });
}

/* ---------- routes: four lines, one per person ---------- */

const routes = {};
function buildRoutes() {
  svg.innerHTML = KEYS.map((k) => `<g data-who="${WHO[k]}"><path class="rt"/><path class="tm"/></g>`).join('');
  for (const k of KEYS) {
    const g = $(`g[data-who="${WHO[k]}"]`, svg);
    routes[WHO[k]] = { g, path: $('.rt', g), tm: $('.tm', g) };
  }
}

let layoutQueued = false;
function queueLayout() {
  if (layoutQueued) return;
  layoutQueued = true;
  requestAnimationFrame(() => { layoutQueued = false; layoutRoutes(); });
}

function layoutRoutes() {
  const hb = hero.getBoundingClientRect();
  svg.setAttribute('width', hb.width);
  svg.setAttribute('height', hb.height);
  svg.setAttribute('viewBox', `0 0 ${hb.width} ${hb.height}`);
  const noplan = !result.plan;
  const xb = $('.xchg').getBoundingClientRect();
  const planLeft = plan.getBoundingClientRect().left - hb.left;
  for (const who of Object.keys(PEOPLE)) {
    const s = center($(`.msg[data-who="${who}"] .stn`));
    const sx = s.x - hb.left;
    const sy = s.y - hb.top;
    const rt = routes[who];
    let d;
    let tm = '';
    if (wide.matches) {
      if (noplan) {
        const stop = planLeft - 22;
        d = `M${sx} ${sy}H${stop}`;
        tm = `M${stop} ${sy - 9}V${sy + 9}`;
      } else {
        const t = center($(`.why[data-who="${who}"] .why__dot`));
        const tx = t.x - hb.left;
        const ty = t.y - hb.top;
        const dy = ty - sy;
        if (Math.abs(dy) < 1.5) d = `M${sx} ${sy}H${tx}`;
        else {
          const x0 = Math.max(sx + 8, tx - 30 - Math.abs(dy));
          d = `M${sx} ${sy}H${x0}L${x0 + Math.abs(dy)} ${ty}H${tx}`;
        }
      }
    } else {
      const top = xb.top - hb.top;
      if (noplan) {
        const stop = top - 34;
        d = `M${sx} ${sy}V${stop}`;
        tm = `M${sx - 8} ${stop}H${sx + 8}`;
      } else {
        d = `M${sx} ${sy}V${top + 8}`;
      }
    }
    rt.path.setAttribute('d', d);
    rt.tm.setAttribute('d', tm);
  }
}

// A bright signal runs along a person's line from what they said to where the plan answers.
function pulse(who, delay = 0) {
  const rt = routes[who];
  if (reduced.matches || !rt) return 0;
  const len = rt.path.getTotalLength();
  if (!len) return 0;
  const dur = Math.max(380, Math.min(860, len / 1.5));
  const dash = Math.min(120, len * .4);
  const mk = (cls) => {
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', rt.path.getAttribute('d'));
    p.setAttribute('class', cls);
    p.style.strokeDasharray = `${dash} ${len + dash}`;
    p.style.strokeDashoffset = dash;
    rt.g.append(p);
    const a = anim(p, [{ strokeDashoffset: dash }, { strokeDashoffset: -len }], { duration: dur, delay, easing: E_IO, fill: 'both' });
    const rm = () => p.remove();
    a.finished.then(rm, rm);
  };
  mk('pulse pulse--glow');
  mk('pulse');
  anim($(`.msg[data-who="${who}"] .stn`), [{ transform: 'scale(1)' }, { transform: 'scale(1.5)' }, { transform: 'scale(1)' }], { duration: 360, delay, easing: E_OUT });
  return delay + dur;
}

function arrive(who) {
  if (reduced.matches) return;
  if (wide.matches) {
    const dot = $(`.why[data-who="${who}"] .why__dot`);
    anim(dot, [{ transform: 'scale(1)' }, { transform: 'scale(1.8)' }, { transform: 'scale(1)' }], { duration: 420, easing: E_OUT });
    flare(dot);
  } else if (inView($('.xchg'))) {
    hit($('.xchg'));
    flare($('.xchg'));
  } else if (!peek.hidden) {
    hit(peek);
  }
}
function hit(el) { el.classList.remove('is-hit'); void el.offsetWidth; el.classList.add('is-hit'); }

// The light inside the plan moves to wherever something just happened.
function flare(el) {
  if (reduced.matches) return;
  const sb = $('.stage').getBoundingClientRect();
  const c = center(el);
  light.style.transform = `translate(${c.x - sb.left}px, ${c.y - sb.top}px)`;
  anim(light, [{ opacity: .7 }, { opacity: 1 }, { opacity: .7 }], { duration: 900, easing: E_OUT });
}

/* ---------- phrase: the words someone said, rewritten in place ---------- */

function morphPhrase(key, text) {
  const btn = $(`button.live[data-ask="${key}"]`);
  if (!btn) return;
  const say = $('.say', btn);
  if (say.textContent === text) return;
  if (reduced.matches) { say.textContent = text; return; }
  const ghost = say.cloneNode(true);
  ghost.classList.add('say--ghost');
  ghost.style.cssText = `position:absolute;left:${say.offsetLeft}px;top:${say.offsetTop}px;`;
  btn.append(ghost);
  say.textContent = text;
  const out = anim(ghost, [{ transform: 'none', opacity: 1 }, { transform: 'translateY(-.75em)', opacity: 0 }], { duration: 220, easing: E_OUT, fill: 'forwards' });
  const rm = () => ghost.remove();
  if (out) out.finished.then(rm, rm); else rm();
  anim(say, [{ transform: 'translateY(.85em)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 420, delay: 70, easing: E_BACK, fill: 'backwards' });
  anim($('.mk', btn), [{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)', offset: .3 }, { transform: 'scaleX(1)' }], { duration: 560, easing: E_IO });
}

/* ---------- controls ---------- */

function upgradeTokens() {
  for (const span of $$('span.live')) {
    const key = span.dataset.ask;
    const who = PEOPLE[WHO[key]].name;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'live';
    btn.dataset.ask = key;
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', `tune-${key}`);
    btn.innerHTML = `<span class="mk" aria-hidden="true"></span><span class="say"></span><i class="chev" aria-hidden="true"></i><span class="sr-only">, change what ${who} said</span>`;
    $('.say', btn).textContent = span.textContent;
    span.replaceWith(btn);
  }
  for (const seg of $$('.tune--seg, .list__toggle')) {
    const ind = document.createElement('span');
    ind.className = 'seg__ind';
    ind.setAttribute('aria-hidden', 'true');
    seg.prepend(ind);
  }
}

function placeSeg(seg, instant = false) {
  const ind = $('.seg__ind', seg);
  const on = $('input:checked', seg)?.closest('label') || $('[aria-pressed="true"]', seg);
  if (!ind || !on || !on.offsetWidth) return;
  if (instant) ind.style.transition = 'none';
  ind.style.width = `${on.offsetWidth}px`;
  ind.style.transform = `translateX(${on.offsetLeft}px)`;
  if (instant) { void ind.offsetWidth; ind.style.transition = ''; }
}

function buildPrice() {
  const byPrice = [...OPTIONS].sort((x, y) => x.price - y.price);
  $('.pins').innerHTML = byPrice.map((o) => `<i data-id="${o.id}" style="left:${((o.price - BUDGET.min) / (BUDGET.max - BUDGET.min)) * 100}%"></i>`).join('');
  $('.price__chips').innerHTML = byPrice.map((o) => `<li class="chip" data-id="${o.id}"><b>${CHIP[o.id]}</b>${priceLabel(o)}</li>`).join('');
}

let lastBudgetShown = DEFAULT_ASKS.budget;
function updatePrice(animate) {
  const b = asks.budget;
  const num = $('.price__num');
  if (num.textContent !== rupees(b)) {
    num.textContent = rupees(b);
    if (animate && !reduced.matches) {
      const up = b > lastBudgetShown;
      anim(num, [{ transform: `translateY(${up ? '.22em' : '-.22em'})`, opacity: .35 }, { transform: 'none', opacity: 1 }], { duration: 160, easing: E_OUT });
    }
  }
  lastBudgetShown = b;
  let crossed = false;
  for (const o of OPTIONS) {
    const inNow = o.price <= b;
    const chip = $(`.chip[data-id="${o.id}"]`);
    const pin = $(`.pins i[data-id="${o.id}"]`);
    if (chip.classList.contains('is-in') === inNow) continue;
    chip.classList.toggle('is-in', inNow);
    pin.classList.toggle('is-in', inNow);
    if (animate && !reduced.matches) {
      crossed = true;
      anim(chip, [{ transform: 'rotateX(90deg)' }, { transform: 'none' }], { duration: 340, easing: E_BACK });
      anim(pin, [{ transform: 'scaleY(1.9)' }, { transform: 'none' }], { duration: 420, easing: E_OUT });
    }
  }
  if (crossed) navigator.vibrate?.(6);
}

function syncControls({ morph = [], animate = false } = {}) {
  for (const key of KEYS) {
    const text = SAY[key](asks[key]);
    if (morph.includes(key)) morphPhrase(key, text);
    else { const say = $(`button.live[data-ask="${key}"] .say`); if (say) say.textContent = text; }
  }
  $$('.tune input[type="radio"]').forEach((r) => { r.checked = String(asks[r.name]) === r.value; });
  $$('.tune--seg:not([hidden])').forEach((s) => placeSeg(s));
  const range = $('#budget');
  range.value = asks.budget;
  range.setAttribute('aria-valuetext', `${rupees(asks.budget)} per person`);
  range.style.setProperty('--pct', `${((asks.budget - BUDGET.min) / (BUDGET.max - BUDGET.min)) * 100}%`);
  updatePrice(animate);
  $('.reset').hidden = sameAsks(asks, DEFAULT_ASKS);
}

/* ---------- the plan ---------- */

const KIND_LABEL = { hold: 'Plan holds', new: 'New plan', 'none-fits': 'Nothing fits yet', none: 'Planic’s plan' };

function setText(el, text, animate) {
  if (el.textContent === text) return false;
  el.textContent = text;
  if (animate && !reduced.matches) anim(el, [{ transform: 'translateY(8px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 380, delay: 60, easing: E_OUT, fill: 'backwards' });
  return true;
}

function renderBoard(prev, animate) {
  $('.board__rows').innerHTML = boardHTML(result);
  if (!prev || !animate || reduced.matches) return;
  for (const o of result.board) {
    const before = prev.board.find((p) => p.id === o.id);
    const row = $(`.opt[data-id="${o.id}"]`);
    if (before.picked !== o.picked || before.fits !== o.fits) row.classList.add('is-new');
    for (const w of Object.keys(PEOPLE)) {
      if (!!before.people[w] !== !!o.people[w]) $(`.mk[data-who="${w}"]`, row).classList.add('is-flip');
    }
  }
}

// Everything the plan shows, recomposed. `tone` is the colour of whoever caused the change.
function renderPlan(prev, { animate = true, tone = 'var(--lav)', kind = 'new', changed = [] } = {}) {
  const r = result;
  const noplan = !r.plan;
  const wasNoplan = plan.classList.contains('is-noplan');
  plan.classList.toggle('is-noplan', noplan);
  peek.classList.toggle('is-noplan', noplan);

  const title = noplan ? NO_PLAN.title : r.plan.title;
  const rewrote = animate ? recomposeTitle(title, noplan ? 'var(--night)' : tone) : (setTitleNow(title), true);
  const delay = rewrote && animate ? 260 : 0;
  later(() => {
    plan.classList.toggle('shows-noplan', noplan);
    setText($('.plan__meta'), noplan ? NO_PLAN.meta : r.plan.meta, animate);
    setText($('.plan__then'), noplan ? '' : r.plan.then, animate);
    $('.plan__for').textContent = noplan ? 'What each of them rules out' : 'What it means for each of them';
    $$('.why').forEach((row, i) => {
      const changedRow = setText($('.why__text', row), whyText(r, row.dataset.who), false);
      if (changedRow && animate && !reduced.matches) {
        anim($('.why__text', row), [{ transform: 'translateY(10px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 420, delay: i * 70, easing: E_OUT, fill: 'backwards' });
      }
    });
    if (!noplan) $('.plan__trade').innerHTML = tradeHTML(r.plan);
    const bends = $('.plan__bends');
    bends.innerHTML = noplan ? bendsHTML(r) : '';
    bends.hidden = !noplan;
    if (noplan && animate && !reduced.matches && !wasNoplan) {
      $$('.bend', bends).forEach((b, i) => anim(b, [{ transform: 'translateY(14px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 460, delay: 120 + i * 90, easing: E_OUT, fill: 'backwards' }));
    }
    setClock(noplan ? '?' : timeShort(r.start), animate);
    renderBoard(prev, animate);
    renderList(animate);
    $('.peek__title').textContent = title;
    queueLayout();
    if (animate && !reduced.matches) rollCall(kind, changed);
  }, ms(delay));

  // The plan held: say so visibly, then say why (in the change line).
  const holds = kind === 'hold' && !noplan;
  if (holds) {
    const was = !stamp.hidden;
    stamp.hidden = false;
    if (animate && !reduced.matches) {
      anim(stamp, [
        { transform: 'scale(1.7) rotate(-14deg)', opacity: 0 },
        { transform: 'scale(.94) rotate(-4deg)', opacity: 1, offset: .65 },
        { transform: 'rotate(-5deg)', opacity: 1 },
      ], { duration: was ? 360 : 460, easing: E_OUT });
      anim(titleEl, [{ transform: 'none' }, { transform: 'scale(.975)' }, { transform: 'none' }], { duration: 380, easing: E_IO });
    }
  } else {
    stamp.hidden = true;
  }
}

// Each person's row answers in turn: checked again with everyone.
function rollCall(kind, changed) {
  const whoChanged = changed.map((k) => WHO[k]);
  $$('.why').forEach((row, i) => {
    const dot = $('.why__dot', row);
    anim(dot, [{ transform: 'scale(1)' }, { transform: 'scale(1.45)' }, { transform: 'scale(1)' }], { duration: 360, delay: 80 + i * 75, easing: E_OUT });
    // Animated rather than re-triggering a CSS class, which would force a layout here.
    if (whoChanged.includes(row.dataset.who)) anim($('.why__text', row), [{ color: 'var(--c)' }, { color: 'var(--on-plan)' }], { duration: 900, easing: E_OUT });
  });
}

function showChange(text, { preview = false, tone = null, animate = false } = {}) {
  if (!text) return;
  changeBox.hidden = false;
  changeBox.classList.remove('is-idle');
  changeBox.classList.toggle('is-preview', preview);
  if (tone) changeBox.style.setProperty('--tick', tone);
  changeText.textContent = text;
  $('.undo').hidden = preview || !history.length;
  if (animate && !reduced.matches) {
    anim(changeText, [{ clipPath: 'inset(0 100% 0 0)', transform: 'translateX(-6px)' }, { clipPath: 'inset(0 0 0 0)', transform: 'none' }], { duration: 520, easing: E_OUT });
  }
}
const IDLE = 'Checked with all four. Change what anyone said and the plan answers here.';
function restoreChange() {
  if (lastChange) showChange(lastChange);
  else idleChange();
}
function idleChange() {
  changeBox.hidden = false;
  changeBox.classList.remove('is-preview');
  changeBox.classList.add('is-idle');
  changeText.textContent = IDLE;
  $('.undo').hidden = true;
}
function peekLabel(kind) { $('.peek__label').textContent = KIND_LABEL[kind] || KIND_LABEL.none; }

/* ---------- commits ---------- */

function commit(next, { reset = false, undo = false, from = null } = {}) {
  finishIntro();
  if (sameAsks(next, asks) && !from) return;
  const base = from || asks;
  if (!undo && !sameAsks(base, next)) history.push({ ...base });
  const prev = from ? evaluate(from) : result;
  const changed = KEYS.filter((k) => base[k] !== next[k]);
  // During a drag the phrase already follows the slider; don't rewrite it again on release.
  const morph = from ? [] : changed;
  asks = { ...next };
  result = evaluate(asks);
  seq++;
  stopAll();
  syncControls({ morph, animate: true });
  const ex = explainChange(base, asks, { reset });
  if (changed.length) lastEdited = changed[0];
  $('.back').hidden = false;
  engaged = true;
  peekLabel(ex.kind);
  const tone = reset || !changed.length ? 'var(--lav)' : `var(${TONE[WHO[changed[0]]]})`;
  queueLayout();

  // Wait one frame so the routes follow any re-wrapped phrase, then run the signal.
  requestAnimationFrame(() => {
    let arrival = 0;
    changed.forEach((k, i) => { arrival = Math.max(arrival, pulse(WHO[k], (morph.length ? 140 : 0) + i * 80)); });
    later(() => {
      changed.forEach((k) => arrive(WHO[k]));
      renderPlan(prev, { animate: true, tone, kind: ex.kind, changed });
      // The explanation lands with the plan, not before it.
      lastChange = ex.text;
      showChange(lastChange, { tone, animate: true });
    }, ms(arrival));
  });
}

/* Live update while the budget slider moves; committed on release. Big moments only when an
   option crosses Meera's budget, not on every step. */
function live(next) {
  finishIntro();
  const before = result;
  asks = { ...next };
  result = evaluate(asks);
  syncControls({ animate: true });
  const pickChanged = (result.pick && result.pick.id) !== (before.pick && before.pick.id);
  if (pickChanged) {
    seq++;
    stopAll();
    renderPlan(before, { animate: true, tone: 'var(--sun)', kind: result.pick ? 'new' : 'none-fits', changed: ['budget'] });
    navigator.vibrate?.(10);
  } else {
    $('.why[data-who="m"] .why__text').textContent = whyText(result, 'm');
    if (!result.pick) $$('.why').forEach((row) => { $('.why__text', row).textContent = whyText(result, row.dataset.who); });
    $('.plan__meta').textContent = result.plan ? result.plan.meta : NO_PLAN.meta;
    renderBoard(null, false);
    queueLayout();
  }
  const ex = explainChange(dragBase, asks);
  if (ex.text) showChange(ex.text, { tone: 'var(--sun)' });
  peekLabel(ex.kind);
}

/* ---------- tuners ---------- */

function openTune(key, open) {
  for (const btn of $$('button.live')) {
    const isThis = btn.dataset.ask === key && open;
    btn.setAttribute('aria-expanded', String(isThis));
    const tune = $(`#tune-${btn.dataset.ask}`);
    const wasHidden = tune.hidden;
    tune.hidden = !isThis;
    if (isThis && wasHidden) {
      if (tune.classList.contains('tune--seg')) placeSeg(tune, true);
      if (!reduced.matches) anim(tune, [{ transform: 'translateY(-6px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 300, easing: E_OUT });
    }
  }
  queueLayout();
  if (open) {
    // Keep the whole tuner above the fold, and above the phone peek bar if it's showing.
    const r = $(`#tune-${key}`).getBoundingClientRect();
    const peekH = wide.matches ? 0 : peek.offsetHeight || 72;
    const over = r.bottom - (innerHeight - peekH - 16);
    if (over > 0) scrollBy({ top: over, behavior: reduced.matches ? 'auto' : 'smooth' });
  }
}

const isMouse = (e) => e.pointerType === 'mouse';
const candidate = (input) => ({ ...asks, [input.name]: input.name === 'free' ? +input.value : input.value });

function fullyInView(el) {
  const r = el.getBoundingClientRect();
  return r.top >= 0 && r.bottom <= innerHeight - (peek.hidden ? 0 : peek.offsetHeight);
}
function scrollThen(el, block, fn) {
  if (fullyInView(el)) { fn(); return; }
  el.scrollIntoView({ block, behavior: reduced.matches ? 'auto' : 'smooth' });
  if (reduced.matches) { fn(); return; }
  let done = false;
  const go = () => { if (!done) { done = true; fn(); } };
  addEventListener('scrollend', go, { once: true });
  setTimeout(go, 900);
}

function tryPatch(btn) {
  const next = { ...asks, ...JSON.parse(btn.dataset.patch) };
  if (!reduced.matches) anim(btn, [{ transform: 'scale(.92)' }, { transform: 'none' }], { duration: 260, easing: E_BACK });
  if (btn.closest('.board, .how')) {
    // Take the visitor to where the answer happens, then make the change in front of them.
    const target = wide.matches ? hero : $('.plan__head');
    scrollThen(target, 'start', () => commit(next));
  } else {
    commit(next);
  }
}

function wire() {
  hero.addEventListener('click', (e) => {
    const live = e.target.closest('button.live');
    if (live) { openTune(live.dataset.ask, live.getAttribute('aria-expanded') !== 'true'); return; }
    const tryBtn = e.target.closest('.try');
    if (tryBtn) { tryPatch(tryBtn); return; }
    if (e.target.closest('.reset')) { commit({ ...DEFAULT_ASKS }, { reset: true }); return; }
    if (e.target.closest('.undo') && history.length) { commit(history.pop(), { undo: true }); return; }
    if (e.target.closest('.back')) backToChat();
  });
  $('.board').addEventListener('click', (e) => { const t = e.target.closest('.try'); if (t) tryPatch(t); });
  $('.how').addEventListener('click', (e) => { const t = e.target.closest('button.rule__go'); if (t) tryPatch(t); });

  hero.addEventListener('change', (e) => {
    const t = e.target;
    if (t.type === 'radio') commit(candidate(t));
    if (t.id === 'budget') {
      const base = dragBase || asks;
      dragBase = null;
      commit({ ...asks, budget: +t.value }, { from: base });
    }
  });
  $('#budget').addEventListener('input', (e) => {
    if (!dragBase) dragBase = { ...asks };
    live({ ...asks, budget: +e.target.value });
  });

  hero.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = $('button.live[aria-expanded="true"]');
    if (open) { openTune(open.dataset.ask, false); open.focus(); }
  });

  // Desktop: point at a choice to see what it would do before you pick it; its line gets ready.
  hero.addEventListener('pointerover', (e) => {
    if (!isMouse(e)) return;
    const label = e.target.closest('.tune--seg label');
    const tryBtn = e.target.closest('.try');
    let cand = null;
    if (label) cand = candidate($('input', label));
    else if (tryBtn) cand = { ...asks, ...JSON.parse(tryBtn.dataset.patch) };
    if (cand && !sameAsks(cand, asks)) {
      showChange(explainChange(asks, cand).text.replace(/ now(?=[,.])/g, ''), { preview: true });
      for (const k of KEYS) routes[WHO[k]].path.classList.toggle('is-armed', cand[k] !== asks[k]);
    }
    const chip = e.target.closest('.chip');
    $$('.pins i.is-hot').forEach((p) => p.classList.remove('is-hot'));
    if (chip) $(`.pins i[data-id="${chip.dataset.id}"]`)?.classList.add('is-hot');

  });
  // Point at a person or their row: both light up and the other lines step back. Listened for on
  // the whole document, so leaving the hero by any route clears it.
  let litWho = null;
  document.addEventListener('pointerover', (e) => {
    if (!isMouse(e)) return;
    const who = (e.target.closest?.('.why') || e.target.closest?.('.msg'))?.dataset.who || null;
    if (who === litWho) return;
    litWho = who;
    $$('.is-lit').forEach((el) => el.classList.remove('is-lit'));
    for (const w of Object.keys(PEOPLE)) routes[w].path.classList.toggle('is-dim', !!who && w !== who);
    if (who) $$(`.msg[data-who="${who}"], .why[data-who="${who}"]`).forEach((el) => el.classList.add('is-lit'));
  });
  hero.addEventListener('pointerout', (e) => {
    if (!isMouse(e)) return;
    if (e.target.closest('.tune--seg label, .try') && changeBox.classList.contains('is-preview')) {
      restoreChange();
      $$('.rt.is-armed').forEach((p) => p.classList.remove('is-armed'));
    }
  });
  hero.addEventListener('focusout', () => { if (changeBox.classList.contains('is-preview')) restoreChange(); });

  // The light in the plan follows a mouse, softly. Touch gets it on each change instead.
  if (finePointer.matches && !reduced.matches) {
    let raf = 0;
    let px = 0;
    let py = 0;
    const stage = $('.stage');
    plan.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      px = e.clientX - r.left;
      py = e.clientY - r.top;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        light.style.transform = `translate(${px}px, ${py}px)`;
        $('.stage__clock').style.transform = `translate(${(px - r.width / 2) * -0.02}px, ${(py - r.height / 2) * -0.02}px)`;
      });
    });
    plan.addEventListener('pointerleave', () => { light.style.transform = ''; $('.stage__clock').style.transform = ''; });
  }

  new ResizeObserver(queueLayout).observe(hero);
  wide.addEventListener('change', queueLayout);
  document.fonts?.ready.then(queueLayout);

  // Phones: keep the answer in sight while the plan itself is off-screen.
  let titleSeen = true;
  let chatSeen = true;
  // Only once the visitor has started changing things; before that it would just cover the chat.
  const updatePeek = () => { peek.hidden = !(engaged && !wide.matches && chatSeen && !titleSeen); };
  hero.addEventListener('click', (e) => { if (!engaged && e.target.closest('button.live')) { engaged = true; updatePeek(); } });
  new IntersectionObserver(([en]) => { titleSeen = en.intersectionRatio >= .6; updatePeek(); }, { threshold: [0, .6, 1] }).observe(titleEl);
  new IntersectionObserver(([en]) => { chatSeen = en.isIntersecting; updatePeek(); }, { rootMargin: '0px 0px -80px 0px' }).observe($('.chat'));
  wide.addEventListener('change', updatePeek);
  $('.peek__go').addEventListener('click', seeWhy);
}

// "See why": go to the reasoning, and let each person's row answer in turn.
function seeWhy() {
  scrollThen($('.plan__head'), 'start', () => {
    if (!reduced.matches) rollCall('see', lastEdited ? [lastEdited] : []);
  });
}
// And back again, to the line that was changed last, ready to change it again.
function backToChat() {
  const key = lastEdited || 'food';
  const msg = $(`.msg[data-who="${WHO[key]}"]`);
  scrollThen(msg, 'center', () => {
    const btn = $(`button.live[data-ask="${key}"]`);
    btn.focus({ preventScroll: true });
    if (btn.getAttribute('aria-expanded') !== 'true') openTune(key, true);
    if (!reduced.matches) anim(msg, [{ backgroundColor: 'color-mix(in srgb, var(--c) 22%, transparent)' }, { backgroundColor: 'transparent' }], { duration: 900, easing: E_OUT });
  });
}

/* ---------- not another list ---------- */

const POPULAR = ['rooftop', 'brunch', 'kebab', 'board', 'crawl', 'cafe'];
let listOrder = 'popular';
function rankedOrder() {
  const rows = result.board;
  const idx = (id) => OPTIONS.findIndex((o) => o.id === id);
  const opt = (id) => OPTIONS.find((o) => o.id === id);
  const score = (b) => (b.picked ? 0 : b.fits ? 1 : 2);
  return [...rows].sort((x, y) => score(x) - score(y)
    || (score(x) === 1 ? (opt(x.id).isNew === opt(y.id).isNew ? opt(x.id).price - opt(y.id).price : opt(x.id).isNew ? -1 : 1) : 0)
    || Object.values(x.people).filter(Boolean).length - Object.values(y.people).filter(Boolean).length
    || idx(x.id) - idx(y.id)).map((b) => b.id);
}
function renderList(animate) {
  const list = $('.list');
  const box = $('.list__items');
  if (!list) return;
  list.dataset.order = listOrder;
  for (const li of $$('li', box)) {
    const o = OPTIONS.find((x) => x.id === li.dataset.id);
    const b = result.board.find((x) => x.id === li.dataset.id);
    const fail = Object.entries(b.people).find(([, f]) => f);
    li.classList.toggle('is-pick', b.picked);
    li.classList.toggle('is-out', !b.fits);
    li.style.setProperty('--strike', fail ? `var(${TONE[fail[0]]})` : '');
    $('.li__note', li).textContent = listOrder === 'popular'
      ? `${priceLabel(o)} each`
      : b.picked ? b.why : b.fits ? 'Fits all four, not picked' : fail[1].text;
  }
  const order = listOrder === 'popular' ? POPULAR : rankedOrder();
  const items = order.map((id) => $(`li[data-id="${id}"]`, box));
  const same = items.every((li, i) => box.children[i] === li);
  if (same) return;
  // Only measure for the re-sort animation when someone can see it.
  if (!animate || reduced.matches || !inView(box)) { items.forEach((li) => box.append(li)); return; }
  const first = new Map(items.map((li) => [li, li.getBoundingClientRect().top]));
  items.forEach((li) => box.append(li));
  items.forEach((li, i) => {
    const dy = first.get(li) - li.getBoundingClientRect().top;
    if (dy) anim(li, [{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 640, delay: i * 30, easing: E_IO });
  });
}
function wireList() {
  const tog = $('.list__toggle');
  tog.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    listOrder = b.dataset.order;
    $$('button', tog).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    placeSeg(tog);
    renderList(true);
  });
  placeSeg(tog, true);
  new ResizeObserver(() => placeSeg(tog, true)).observe(tog);
}

/* ---------- the rest of the page ---------- */

function wirePage() {
  const io = new IntersectionObserver((ens) => ens.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-seen'); io.unobserve(en.target); } }), { threshold: .35 });
  $$('.rule').forEach((r) => io.observe(r));

  const rules = $('#rules');
  rules.addEventListener('toggle', () => {
    if (!rules.open || reduced.matches) return;
    $$('li, p', rules).forEach((el, i) => el.animate([{ transform: 'translateY(8px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 380, delay: i * 70, easing: E_OUT, fill: 'backwards' }));
  });

  const form = $('.join__form');
  const email = $('#email');
  const msg = $('.join__msg');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    msg.classList.remove('is-error', 'is-done');
    if (!email.value.trim() || !email.checkValidity()) {
      email.setAttribute('aria-invalid', 'true');
      msg.textContent = 'That doesn’t look like an email address yet.';
      msg.classList.add('is-error');
      if (!reduced.matches) email.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(-3px)' }, { transform: 'none' }], { duration: 360, easing: E_OUT });
      email.focus();
      return;
    }
    email.removeAttribute('aria-invalid');
    msg.textContent = 'This is a prototype, so nothing was sent. The form on the live site is unchanged.';
    msg.classList.add('is-done');
  });
  email.addEventListener('input', () => { if (email.getAttribute('aria-invalid')) { email.removeAttribute('aria-invalid'); msg.classList.remove('is-error'); msg.textContent = 'No account needed. We’ll only email you about Planic.'; } });
}

/* ---------- intro: scattered words settle, lines draw, the plan answers ---------- */

let introAnims = [];
function finishIntro() {
  if (!introRunning) return;
  introRunning = false;
  introAnims.forEach((a) => a.cancel());
  introAnims = [];
  hero.classList.remove('is-intro');
  setTitleNow(result.plan.title);
  queueLayout();
}

function splitQuote() {
  const q = $('.h1__quote');
  const words = q.textContent.split(' ');
  q.innerHTML = words.map((w) => `<span class="wd">${w}</span>`).join(' ');
}

function intro() {
  if (reduced.matches) return;
  if (hero.getBoundingClientRect().top < -40) return;
  introRunning = true;
  hero.classList.add('is-intro');
  setTitleNow('so… where?');
  const push = (a) => { if (a) introAnims.push(a); return a; };
  const tilt = [[-14, -.5, -10], [10, .35, 8], [-6, -.3, -6]];
  $$('.h1__quote .wd').forEach((w, i) => push(w.animate(
    [{ transform: `translate(${tilt[i % 3][0]}px, ${tilt[i % 3][1]}em) rotate(${tilt[i % 3][2]}deg)`, opacity: .2 }, { transform: 'none', opacity: 1 }],
    { duration: 760, delay: 120 + i * 90, easing: E_BACK, fill: 'backwards' })));
  try { push($('.h1__plan').animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 700, delay: 520, easing: E_IO, fill: 'backwards', pseudoElement: '::after' })); } catch { /* older browsers: no underline draw */ }
  $$('.msg').forEach((m, i) => push(m.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 380, delay: 260 + i * 150, easing: E_OUT, fill: 'both' })));
  layoutRoutes();
  for (const w of Object.keys(PEOPLE)) {
    const p = routes[w].path;
    const len = p.getTotalLength() || 1;
    push(p.animate([{ strokeDasharray: `${len} ${len}`, strokeDashoffset: len }, { strokeDasharray: `${len} ${len}`, strokeDashoffset: 0 }], { duration: 700, delay: 760 + Object.keys(PEOPLE).indexOf(w) * 90, easing: E_IO, fill: 'backwards' }));
  }
  setTimeout(() => {
    if (!introRunning) return;
    recomposeTitle(result.plan.title, 'var(--lav)');
    const rest = [$('.plan__meta'), $('.plan__then'), $('.plan__for'), ...$$('.why'), $('.plan__foot')];
    rest.forEach((el, i) => push(el.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: 300 + i * 70, easing: E_OUT, fill: 'both' })));
    setTimeout(() => {
      if (!introRunning) return;
      introRunning = false;
      hero.classList.remove('is-intro');
      introAnims.forEach((a) => a.cancel());
      introAnims = [];
      invite();
    }, 1250);
  }, 1500);
  const skip = () => finishIntro();
  addEventListener('pointerdown', skip, { once: true });
  addEventListener('keydown', skip, { once: true });
}

// Once, after the intro: each phrase's marker redraws in turn, so it reads as something you can move.
function invite() {
  if (reduced.matches) return;
  $$('button.live').forEach((btn, i) => {
    btn.animate([{ transform: 'none' }, { transform: 'translateY(-5px)' }, { transform: 'none' }], { duration: 440, delay: 200 + i * 150, easing: E_IO });
    $('.mk', btn).animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)', offset: .35 }, { transform: 'scaleX(1)' }], { duration: 560, delay: 200 + i * 150, easing: E_IO });
  });
}

/* ---------- start ---------- */

upgradeTokens();
buildPrice();
buildRoutes();
splitQuote();
$('.hint').hidden = false;
idleChange();
setTitleNow(titleEl.textContent.trim());
setClock(timeShort(result.start), false);
syncControls();
renderBoard(null, false);
renderList(false);
wire();
wireList();
wirePage();
layoutRoutes();
intro();

// For tests and debugging only.
window.__planic = { get asks() { return { ...asks }; }, get result() { return result; }, commit, layoutRoutes };
