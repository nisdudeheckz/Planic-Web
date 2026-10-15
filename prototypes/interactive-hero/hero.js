// Planic "talk back" hero: the visitor changes what a friend said, the plan answers.
import { evaluate, explainChange, sameAsks, DEFAULT_ASKS, OPTIONS, BUDGET, PEOPLE, rupees, sayFood, sayNovelty, sayBudget, sayFree } from './engine.js';
import { reasonsHTML, tradeHTML, othersHTML, bendsHTML, NO_PLAN } from './view.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const EASE_OUT = 'cubic-bezier(.23, 1, .32, 1)';
const EASE_IN_OUT = 'cubic-bezier(.77, 0, .175, 1)';
const WHO = { food: 'a', novelty: 'r', budget: 'm', free: 'k' };
const SAY = { food: sayFood, novelty: sayNovelty, budget: sayBudget, free: sayFree };

let asks = { ...DEFAULT_ASKS };
let result = evaluate(asks);
const history = [];
let dragBase = null;
let introRunning = false;
let titleJob = 0;

const hero = $('.hero');
const plan = $('.plan');
const titleEl = $('.plan__title');
const changeBox = $('.plan__change');
const changeText = $('.change__text');
const peek = $('.peek');

/* ---------- title: retypeset letter by letter ---------- */

function lettersHTML(text) {
  const words = text.split(' ').map((w) => `<span class="w">${[...w].map((c) => `<span class="ch">${c}</span>`).join('')}</span>`);
  return `<span class="sr-only">${text}</span><span aria-hidden="true">${words.join(' ')}</span>`;
}

function setTitle(text, { animate = true } = {}) {
  const current = titleEl.dataset.text;
  if (current === text) {
    // The plan held: a brief nod instead of a rewrite (unless a rewrite is still landing).
    if (animate && !reduced.matches && !titleEl.getAnimations({ subtree: true }).length) {
      titleEl.animate(
        [{ transform: 'none' }, { transform: 'scaleX(.94)' }, { transform: 'none' }],
        { duration: 420, easing: EASE_IN_OUT },
      );
    }
    return;
  }
  const job = ++titleJob;
  titleEl.getAnimations({ subtree: true }).forEach((a) => a.cancel());
  titleEl.dataset.text = text;
  if (!animate || !current) { titleEl.innerHTML = lettersHTML(text); return; }
  if (reduced.matches) {
    titleEl.innerHTML = lettersHTML(text);
    titleEl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150 });
    return;
  }
  const old = $$('.ch', titleEl);
  const outStagger = Math.min(6, 80 / Math.max(old.length, 1));
  const outs = old.map((ch, i) => ch.animate(
    [{ transform: 'none', opacity: 1 }, { transform: 'translateY(-.35em)', opacity: 0 }],
    { duration: 150, delay: i * outStagger, easing: EASE_OUT, fill: 'forwards' },
  ).finished.catch(() => {}));
  Promise.all(outs).then(() => {
    if (job !== titleJob) return;
    titleEl.innerHTML = lettersHTML(text);
    const fresh = $$('.ch', titleEl);
    const inStagger = Math.min(16, 260 / Math.max(fresh.length, 1));
    fresh.forEach((ch, i) => ch.animate(
      [
        // Letters arrive condensed and settle to full width. scaleX rather than the font's width
        // axis: animating the axis per letter forced layout every frame (long tasks on phones).
        { transform: 'translateY(.5em) scaleX(.72)', opacity: 0 },
        { transform: 'none', opacity: 1 },
      ],
      { duration: 460, delay: i * inStagger, easing: EASE_OUT, fill: 'backwards' },
    ));
  });
}

/* ---------- render ---------- */

function syncControls() {
  for (const key of Object.keys(WHO)) {
    const btn = $(`.live[data-ask="${key}"]`);
    if (btn) btn.firstChild.textContent = SAY[key](asks[key]);
  }
  $$('.tune input[type="radio"]').forEach((r) => { r.checked = String(asks[r.name]) === r.value; });
  const range = $('#budget');
  range.value = asks.budget;
  range.setAttribute('aria-valuetext', rupees(asks.budget));
  const pct = ((asks.budget - BUDGET.min) / (BUDGET.max - BUDGET.min)) * 100;
  range.style.setProperty('--pct', pct + '%');
  // Bigger budget, heavier number: the value's weight follows it.
  const budgetBtn = $('.live[data-ask="budget"]');
  if (budgetBtn) budgetBtn.style.fontWeight = Math.round(520 + pct * 2.8);
  $$('.ticks i').forEach((t) => t.classList.toggle('is-in', +t.dataset.price <= asks.budget));
  $('.reset').hidden = sameAsks(asks, DEFAULT_ASKS);
}

function renderPlan(prev, { animate = true } = {}) {
  const r = result;
  plan.classList.toggle('is-noplan', !r.plan);
  if (r.plan) {
    setTitle(r.plan.title, { animate });
    $('.plan__meta').textContent = r.plan.meta;
    $('.plan__then').textContent = r.plan.then;
    $('.plan__why').innerHTML = reasonsHTML(r.plan);
    $('.plan__trade').innerHTML = tradeHTML(r.plan);
    $('.plan__bends').hidden = true;
  } else {
    setTitle(NO_PLAN.title, { animate });
    $('.plan__meta').textContent = NO_PLAN.meta;
    $('.plan__bends').innerHTML = bendsHTML(r);
    $('.plan__bends').hidden = false;
  }
  $('.others__list').innerHTML = othersHTML(r);
  // Rows whose verdict changed get a brief flash so the eye finds them.
  if (prev && animate) {
    for (const o of r.others) {
      const before = prev.others.find((p) => p.id === o.id);
      if (!before || before.why !== o.why) $(`.other[data-id="${o.id}"]`)?.classList.add('is-flip');
    }
  }
  $('.peek__title').textContent = r.plan ? r.plan.title : NO_PLAN.title;
}

function showChange(text, { preview = false } = {}) {
  if (!text) return;
  changeBox.hidden = false;
  changeBox.classList.toggle('is-preview', preview);
  changeText.textContent = text;
  $('.undo').hidden = preview || !history.length;
}

let lastChange = '';
function restoreChange() {
  if (lastChange) showChange(lastChange);
  else { changeBox.hidden = true; changeBox.classList.remove('is-preview'); }
}

const PEEK_LABEL = { hold: 'Plan holds', new: 'New plan', 'none-fits': 'Nothing fits yet', none: 'Planic’s plan' };
function peekLabel(kind) { $('.peek__label').textContent = PEEK_LABEL[kind] || PEEK_LABEL.none; }

/* ---------- carry: the changed value travels to the line it affects ---------- */

function inView(rect) { return rect.bottom > 0 && rect.top < innerHeight && rect.width > 0; }

function carry(key) {
  if (reduced.matches) return;
  const who = WHO[key];
  const from = $(`.live[data-ask="${key}"]`);
  const peekOn = !peek.hidden && getComputedStyle(peek).display !== 'none';
  const to = peekOn ? $('.peek__title') : (result.plan ? $(`.why[data-who="${who}"]`) : titleEl);
  if (!from || !to) return;
  const a = from.getBoundingClientRect();
  const b = to.getBoundingClientRect();
  if (!inView(a) || !inView(b)) { hit(to, peekOn); return; }
  const chip = document.createElement('span');
  chip.className = 'carry';
  chip.dataset.who = who;
  chip.textContent = SAY[key](asks[key]);
  document.body.appendChild(chip);
  const dx = b.left - a.left;
  const dy = b.top + Math.min(b.height, 40) / 2 - (a.top + a.height / 2);
  chip.animate(
    [
      { transform: `translate(${a.left}px, ${a.top + a.height / 2 - 16}px) scale(1)`, opacity: 1 },
      { transform: `translate(${a.left + dx * .6}px, ${a.top + a.height / 2 - 16 + dy * .6 - 40}px) scale(.95)`, opacity: 1, offset: .6 },
      { transform: `translate(${a.left + dx}px, ${a.top + a.height / 2 - 16 + dy}px) scale(.8)`, opacity: 0 },
    ],
    { duration: 560, easing: EASE_IN_OUT },
  ).finished.then(() => { chip.remove(); hit(to, peekOn); }, () => chip.remove());
}

function hit(el, peekOn) {
  const target = peekOn ? peek : el;
  const cls = peekOn ? 'is-hit' : (el.classList.contains('why') ? 'is-hit' : null);
  if (!cls) return;
  target.classList.remove(cls);
  void target.offsetWidth;
  target.classList.add(cls);
}

/* ---------- commits ---------- */

function commit(next, { reset = false, undo = false, from = null } = {}) {
  finishIntro();
  if (sameAsks(next, asks) && !from) return;
  const base = from || asks;
  if (!undo && !sameAsks(base, next)) history.push({ ...base });
  const prevResult = from ? evaluate(from) : result;
  const changed = Object.keys(WHO).filter((k) => base[k] !== next[k]);
  asks = { ...next };
  result = evaluate(asks);
  syncControls();
  renderPlan(prevResult);
  const ex = explainChange(base, asks, { reset });
  lastChange = ex.text;
  showChange(lastChange);
  peekLabel(ex.kind);
  changed.forEach((k, i) => setTimeout(() => carry(k), i * 90));
}

/* Live update while the budget slider moves; committed on release. */
function live(next) {
  finishIntro();
  const prevPick = result.pick && result.pick.id;
  const prevFits = result.others.filter((o) => o.fits).map((o) => o.id).join();
  asks = { ...next };
  result = evaluate(asks);
  syncControls();
  const pickChanged = (result.pick && result.pick.id) !== prevPick;
  renderPlan(null, { animate: pickChanged });
  if (pickChanged || prevFits !== result.others.filter((o) => o.fits).map((o) => o.id).join()) navigator.vibrate?.(8);
  const ex = explainChange(dragBase, asks);
  if (ex.text) showChange(ex.text);
  peekLabel(ex.kind);
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
    btn.append(document.createTextNode(span.textContent));
    const hint = document.createElement('span');
    hint.className = 'sr-only';
    hint.textContent = `, change what ${who} said`;
    btn.append(hint);
    span.replaceWith(btn);
  }
}

function openTune(key, open) {
  for (const btn of $$('button.live')) {
    const isThis = btn.dataset.ask === key && open;
    btn.setAttribute('aria-expanded', String(isThis));
    $(`#tune-${btn.dataset.ask}`).hidden = !isThis;
  }
  if (open) {
    // Keep the whole tuner above the fold, and above the phone peek bar if it's showing.
    const r = $(`#tune-${key}`).getBoundingClientRect();
    const peekH = matchMedia('(max-width: 959px)').matches ? peek.offsetHeight || 72 : 0;
    const over = r.bottom - (innerHeight - peekH - 16);
    if (over > 0) scrollBy({ top: over, behavior: reduced.matches ? 'auto' : 'smooth' });
  }
}

function buildTicks() {
  const box = $('.ticks');
  const labelled = new Set([550, 2000]);
  box.innerHTML = OPTIONS
    .filter((o) => o.price >= BUDGET.min && o.price <= BUDGET.max)
    .map((o) => `<i data-price="${o.price}" style="left:${((o.price - BUDGET.min) / (BUDGET.max - BUDGET.min)) * 100}%">${labelled.has(o.price) ? rupees(o.price) : ''}</i>`)
    .join('');
}

const isMouse = (e) => e.pointerType === 'mouse';

function wire() {
  hero.addEventListener('click', (e) => {
    const live = e.target.closest('button.live');
    if (live) { openTune(live.dataset.ask, live.getAttribute('aria-expanded') !== 'true'); return; }
    const tryBtn = e.target.closest('.try');
    if (tryBtn) { commit({ ...asks, ...JSON.parse(tryBtn.dataset.patch) }); return; }
    if (e.target.closest('.reset')) { commit({ ...DEFAULT_ASKS }, { reset: true }); return; }
    if (e.target.closest('.undo') && history.length) {
      commit(history.pop(), { undo: true });
    }
  });

  hero.addEventListener('change', (e) => {
    const t = e.target;
    if (t.type === 'radio') commit({ ...asks, [t.name]: t.name === 'free' ? +t.value : t.value });
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

  // Desktop: point at a choice to see what it would do before you pick it.
  hero.addEventListener('pointerover', (e) => {
    if (!isMouse(e)) return;
    const label = e.target.closest('.tune label');
    const tryBtn = e.target.closest('.try');
    let cand = null;
    if (label) {
      const input = $('input', label);
      cand = { ...asks, [input.name]: input.name === 'free' ? +input.value : input.value };
    } else if (tryBtn) {
      cand = { ...asks, ...JSON.parse(tryBtn.dataset.patch) };
    }
    if (cand && !sameAsks(cand, asks)) showChange(explainChange(asks, cand).text.replace(/ now(?=[,.])/g, ''), { preview: true });

    // Point at a reason to see who it's for, or at a person to see what they shaped.
    const why = e.target.closest('.why');
    const msg = e.target.closest('.msg');
    const who = (why || msg)?.dataset.who;
    $$('.is-lit').forEach((el) => el.classList.remove('is-lit'));
    if (who) $$(`.msg[data-who="${who}"], .why[data-who="${who}"]`).forEach((el) => el.classList.add('is-lit'));
  });
  hero.addEventListener('pointerout', (e) => {
    if (!isMouse(e)) return;
    if (e.target.closest('.tune label, .try') && changeBox.classList.contains('is-preview')) restoreChange();
    if (e.target.closest('.why, .msg') && !e.relatedTarget?.closest?.('.why, .msg')) $$('.is-lit').forEach((el) => el.classList.remove('is-lit'));
  });
  hero.addEventListener('focusout', () => { if (changeBox.classList.contains('is-preview')) restoreChange(); });

  // Mobile: keep the answer in sight while the plan itself is off-screen.
  const narrow = matchMedia('(max-width: 959px)');
  let titleSeen = true;
  let chatSeen = true;
  const updatePeek = () => { peek.hidden = !(narrow.matches && chatSeen && !titleSeen); };
  new IntersectionObserver(([en]) => { titleSeen = en.intersectionRatio >= .6; updatePeek(); }, { threshold: [0, .6, 1] }).observe(titleEl);
  new IntersectionObserver(([en]) => { chatSeen = en.isIntersecting; updatePeek(); }, { rootMargin: '0px 0px -80px 0px' }).observe($('.chat'));
  narrow.addEventListener('change', updatePeek);
  $('.peek__go').addEventListener('click', () => titleEl.scrollIntoView({ block: 'start', behavior: reduced.matches ? 'auto' : 'smooth' }));
}

/* ---------- intro: the lines arrive, then the plan answers ---------- */

let introAnims = [];
function finishIntro() {
  if (!introRunning) return;
  introRunning = false;
  introAnims.forEach((a) => a.cancel());
  introAnims = [];
  hero.classList.remove('is-intro');
  if (result.plan) setTitle(result.plan.title, { animate: false });
}

function intro() {
  if (reduced.matches) return;
  const r = hero.getBoundingClientRect();
  if (r.top > innerHeight * .5) return;
  introRunning = true;
  hero.classList.add('is-intro');
  titleEl.dataset.text = 'so… where?';
  titleEl.innerHTML = lettersHTML('so… where?');
  const fade = (el, delay) => {
    const a = el.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 340, delay, easing: EASE_OUT, fill: 'both' });
    introAnims.push(a);
    return a.finished.catch(() => {});
  };
  $$('.msg').forEach((m, i) => fade(m, 150 + i * 170));
  setTimeout(() => {
    if (!introRunning) return;
    setTitle(result.plan.title);
    const rest = [$('.plan__meta'), $('.plan__then'), ...$$('.why'), $('.plan__trade'), $('.others')];
    Promise.all(rest.map((el, i) => fade(el, 380 + i * 60))).then(() => {
      if (!introRunning) return;
      introRunning = false;
      hero.classList.remove('is-intro');
      introAnims.forEach((a) => a.cancel());
      introAnims = [];
      invite();
    });
  }, 1050);
  const skip = () => finishIntro();
  addEventListener('pointerdown', skip, { once: true });
  addEventListener('keydown', skip, { once: true });
}

// Once, after the intro: each live phrase hops in turn, so it reads as something you can move.
function invite() {
  if (reduced.matches) return;
  $$('button.live').forEach((btn, i) => btn.animate(
    [{ transform: 'none' }, { transform: 'translateY(-5px)' }, { transform: 'none' }],
    { duration: 420, delay: 300 + i * 140, easing: EASE_IN_OUT },
  ));
}

/* ---------- start ---------- */

upgradeTokens();
buildTicks();
$('.hint').hidden = false;
titleEl.dataset.text = titleEl.textContent.trim();
titleEl.innerHTML = lettersHTML(titleEl.dataset.text);
syncControls();
renderPlan(null, { animate: false });
wire();
intro();

// For tests and debugging only.
window.__planic = { get asks() { return { ...asks }; }, get result() { return result; }, commit };
