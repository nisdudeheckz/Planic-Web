// Planic scroll story. Scroll is the clock; every chapter reads in its finished state without this file.
// Uses GSAP + ScrollTrigger (self-hosted in vendor/) for scroll-linked motion, and the frozen
// talk-back engine for the "your turn" chapter.
import { evaluate, explainChange, sameAsks, DEFAULT_ASKS, PEOPLE } from '../interactive-hero/engine.js';
import { whyRowsHTML, tradeHTML, bendsHTML, NO_PLAN, esc } from '../interactive-hero/view.js';
import { pointerLife, splitHeads } from './life.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const G = window.gsap;
const ST = window.ScrollTrigger;
const MOTION = !reduce && !!G && !!ST;
if (MOTION) root.classList.add('motion');

const sections = $$('main > .ch');
const ROLE = { a: 'the Aanya', r: 'the Rohan', m: 'the Meera', k: 'the Kabir' };
const SAID = { a: 'veg options pls', r: 'somewhere new!!', m: '₹600 max, coming from far', k: 'anything works, free after 7' };

/* ---------- clock + nav ink: which chapter are we in ---------- */
const clockDay = $('.clock__day');
const clockTime = $('.clock__time');
function setClock(day, time) {
  if (clockDay.textContent !== day) clockDay.textContent = day;
  if (clockTime.textContent !== time) clockTime.textContent = time;
}
const navBg = document.querySelector('.nav__bg');
let filmClosed = false; // once the film has closed into a card, the page around it is already daylight
function enterChapter(sec) {
  document.body.dataset.ink = sec.id === 'film' && filmClosed ? 'dark' : sec.dataset.ink;
  if (!MOTION) navBg.style.backgroundColor = sec.dataset.sky;
  if (sec.id !== 'top') setClock(sec.dataset.day, sec.dataset.time);
}
const chapterIO = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) enterChapter(e.target);
}, { rootMargin: '-50% 0px -50% 0px' });
sections.forEach((s) => chapterIO.observe(s));

/* ---------- ambient motion: runs only while its chapter is on screen ---------- */
const ambient = []; // [{ el, tweens: [] }]
const stillBtn = $('.still');
let still = false;
const offIO = new IntersectionObserver((entries) => {
  for (const e of entries) {
    e.target.classList.toggle('off', !e.isIntersecting);
    const a = ambient.find((x) => x.el === e.target);
    if (a) a.tweens.forEach((t) => (e.isIntersecting && !still ? t.play() : t.pause()));
  }
}, { rootMargin: '10% 0px' });
function addAmbient(el, tween) {
  let a = ambient.find((x) => x.el === el);
  if (!a) { a = { el, tweens: [] }; ambient.push(a); offIO.observe(el); }
  a.tweens.push(tween);
}

/* ---------- 0. the film: phones lighting up, until the chat takes over ---------- */
function filmMotion() {
  const sec = $('.ch--film');
  const film = $('.film');
  const video = $('.film__video');
  const toasts = $$('.toast');
  const at = toasts.map((t) => Number(t.dataset.at));
  let shown = -2;
  function show(n) {
    if (n === shown) return;
    shown = n;
    toasts.forEach((t, i) => {
      const age = n - i;
      t.style.setProperty('--age', String(Math.max(0, age)));
      t.classList.toggle('on', age >= 0 && age < 3);
      t.classList.toggle('gone', age >= 3);
    });
  }
  // The notifications follow the film's own clock, so they land on the right shot every loop.
  let raf = 0;
  const sync = () => {
    const ct = video.currentTime;
    let n = -1;
    at.forEach((a, i) => { if (ct >= a) n = i; });
    show(n);
    raf = requestAnimationFrame(sync);
  };
  video.addEventListener('playing', () => { cancelAnimationFrame(raf); sync(); });
  video.addEventListener('pause', () => cancelAnimationFrame(raf));
  // A portrait cut for portrait screens.
  let tall = null;
  function pick() {
    const t = innerWidth / innerHeight < .8;
    if (t === tall) return;
    const time = video.currentTime || 0;
    const wasPlaying = !video.paused;
    tall = t;
    video.poster = t ? video.dataset.posterTall : video.dataset.posterWide;
    video.src = t ? video.dataset.tall : video.dataset.wide;
    if (time) video.currentTime = time;
    if (wasPlaying) video.play().catch(() => {});
  }
  pick();
  addEventListener('resize', pick);
  video.preload = 'auto';
  addAmbient(sec, {
    play() {
      const p = video.play();
      // If the browser won't autoplay (data saver, low power), the poster stays and the first three messages sit still.
      if (p) p.catch(() => show(2));
    },
    pause() { video.pause(); },
  });

  // Scrolling on: the words lift away and the film closes down into a card as the chat arrives.
  const tl = G.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: sec, start: 'top top', end: () => `+=${innerHeight * .8}`, pin: true, scrub: .6, invalidateOnRefresh: true, anticipatePin: 1,
      onUpdate(self) {
        const closed = self.progress > .55;
        if (closed !== filmClosed) { filmClosed = closed; document.body.dataset.ink = closed ? 'dark' : 'light'; }
      },
    },
  });
  tl.to('.film__copy', { y: -70, opacity: 0, duration: .45 }, 0)
    .to('.toasts', { y: -50, opacity: 0, duration: .45 }, .08)
    .fromTo(film, { clipPath: 'inset(0% 0% 0% 0% round 0px)' }, { clipPath: () => (innerWidth < 900 ? 'inset(7% 4% 7% 4% round 24px)' : 'inset(9% 6% 9% 6% round 32px)'), duration: 1 }, 0)
    .to(video, { scale: 1.08, duration: 1 }, 0)
    .to('.film__shade', { opacity: .6, duration: 1 }, 0)
    // the day comes up around the film as it closes, so the chat arrives in daylight
    .fromTo([$('.sky'), navBg], { backgroundColor: sec.dataset.sky }, { backgroundColor: $('.ch--chat').dataset.sky, duration: .55, immediateRender: false }, .3);
}

/* ---------- 1. the chat ---------- */
const TIMES = ['Wed 4:12 PM', 'Wed 4:12 PM', 'Wed 4:14 PM', 'Wed 4:15 PM', 'Wed 4:31 PM', 'Wed 4:33 PM', 'Wed 6:02 PM', 'Wed 9:47 PM', 'Thu 11:48 PM', 'Thu 11:48 PM', 'Thu 11:49 PM'];

function chatMotion() {
  const sec = $('.ch--chat');
  const stage = $('.chat-stage');
  const open = $('.open');
  const thread = $('.thread');
  const win = $('.thread__win');
  const list = $('.thread__list');
  const items = [...list.children];
  const unread = $('.unread');
  const FIRST = 5; // day label + four messages (one a photo) are there when you arrive
  const phone = () => innerWidth < 900;
  const shiftFor = (i) => Math.max(0, items[i].offsetTop + items[i].offsetHeight - win.clientHeight + 18);

  G.set(items.slice(FIRST), { autoAlpha: 0, y: 26 });
  G.set('.tally', { visibility: 'visible' });
  G.set('.tally span', { autoAlpha: 0, y: 20 });
  // The headline and chat arrive as the film hands over to them.
  const arrive = { trigger: sec, start: 'top 70%', toggleActions: 'play none none none' };
  G.from('.open__title .w', { yPercent: 60, autoAlpha: 0, duration: .9, stagger: .07, ease: 'power3.out', scrollTrigger: arrive });
  // yPercent and opacity, so it never fights the pinned timeline below, which moves the thread by y
  G.from([thread], { yPercent: 10, opacity: 0, duration: 1, ease: 'power3.out', delay: .25, scrollTrigger: arrive });

  const tl = G.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: sec, start: 'top top', end: () => `+=${innerHeight * (phone() ? 1.6 : 1.3)}`,
      pin: true, scrub: .6, invalidateOnRefresh: true, anticipatePin: 1,
      onUpdate(self) {
        const shown = Math.min(items.length - 1, FIRST - 1 + Math.floor(self.progress * 1.18 * (items.length - FIRST + 1)));
        setClock(...TIMES[Math.max(0, shown)].split(/ (.+)/));
        unread.textContent = String(Math.round(3 + self.progress * 44));
      },
    },
  });
  // On phones the headline gives the screen to the chat first.
  tl.to(open, { y: () => (phone() ? -open.offsetHeight - 30 : 0), autoAlpha: () => (phone() ? 0 : 1), duration: () => (phone() ? 1 : .001) }, 0);
  tl.to(thread, { y: () => (phone() ? -open.offsetHeight - 30 : 0), duration: () => (phone() ? 1 : .001) }, 0);
  let t = phone() ? .6 : 0;
  for (let i = FIRST; i < items.length; i++) {
    const last = i === items.length - 1;
    tl.to(items[i], { autoAlpha: 1, y: 0, duration: .5, ease: 'power2.out' }, t);
    tl.to(list, { y: () => -shiftFor(i), duration: .5, ease: 'power1.inOut' }, t);
    if (last) tl.fromTo(items[i].querySelector('p'), { scale: .6, transformOrigin: '0% 100%' }, { scale: 1, duration: .6, ease: 'back.out(2.2)' }, t);
    t += .55;
  }
  tl.to('.tally span', { autoAlpha: 1, y: 0, stagger: .18, duration: .5, ease: 'power2.out' }, t + .1);
  tl.from('.count[data-to]', { textContent: 0, snap: { textContent: 1 }, duration: .8, stagger: .15 }, t + .1);
  tl.to({}, { duration: .2 });

  // The floating photos drift out as the chat takes over, and bob while they wait.
  $$('.floater').forEach((f, i) => {
    tl.to(f, { y: i ? 140 : -160, autoAlpha: 0, rotation: i ? 14 : -14, duration: 2 }, .2);
    addAmbient(sec, G.to($('.ph', f), { y: i ? -10 : 12, rotation: i ? -3 : 3, duration: 3 + i, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
  });
  G.from($$('.floater .ph'), { scale: .4, opacity: 0, duration: 1, stagger: .15, ease: 'back.out(1.8)', delay: .5, scrollTrigger: arrive });

  // Ambient: someone is always typing.
  const who = $('.typing__who');
  const names = ['Meera', 'Rohan', 'Aanya', 'Kabir'];
  let n = 0;
  const typing = G.to({}, { duration: 2.6, repeat: -1, onRepeat() { n = (n + 1) % names.length; who.textContent = names[n]; } });
  addAmbient(sec, typing);
}

/* ---------- tickers: always moving, faster when you scroll ---------- */
function tickers() {
  $$('.ticker').forEach((tk) => {
    const row = $('.ticker__row', tk);
    row.innerHTML += row.innerHTML; // two copies, so the loop is seamless
    const dir = Number(tk.dataset.dir) || -1;
    const loop = G.fromTo(row, { xPercent: dir < 0 ? 0 : -50 }, { xPercent: dir < 0 ? -50 : 0, duration: 38, ease: 'none', repeat: -1 });
    addAmbient(tk, loop);
    ST.create({
      trigger: tk, start: 'top bottom', end: 'bottom top',
      onUpdate(self) {
        const v = Math.min(6, 1 + Math.abs(self.getVelocity()) / 400);
        G.to(loop, { timeScale: v, duration: .2, overwrite: true, onComplete: () => G.to(loop, { timeScale: 1, duration: 1.2 }) });
      },
    });
  });
}

/* ---------- the sky: one colour field that turns with the day ---------- */
function sky() {
  const el = [$('.sky'), navBg];
  G.set(el, { backgroundColor: sections[0].dataset.sky });
  sections.slice(1).forEach((sec, i) => {
    const prev = sections[i];
    if (prev.id === 'film') return; // the film turns the day up itself, while it closes
    G.fromTo(el, { backgroundColor: prev.dataset.sky }, {
      backgroundColor: sec.dataset.sky, ease: 'none', immediateRender: false,
      scrollTrigger: { trigger: sec, start: 'top 85%', end: 'top 35%', scrub: true },
    });
  });
  G.fromTo('.lanes', { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: 'main', start: 'top top', end: 'bottom bottom', scrub: true } });
}

/* ---------- 2. the four: a deck that stacks as you scroll ---------- */
function deckMotion() {
  const cards = $$('.card');
  cards.forEach((card, i) => {
    const shade = document.createElement('i');
    shade.className = 'card__shade';
    shade.setAttribute('aria-hidden', 'true');
    card.append(shade);
    const ph = $('.ph', card);
    G.fromTo(ph, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true } });
    G.from([$('.card__name', card), $('.card__said', card)], {
      yPercent: 50, autoAlpha: 0, stagger: .08, duration: .8, ease: 'power3.out',
      scrollTrigger: { trigger: card, start: 'top 70%', toggleActions: 'play none none reverse' },
    });
    const next = cards[i + 1];
    if (!next) return;
    G.timeline({ scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 30%', scrub: true } })
      .to(card, { scale: .92, ease: 'none' }, 0)
      .to(shade, { opacity: .28, ease: 'none' }, 0);
  });
}

/* ---------- 3. weigh: every option checked, then set aside with its reason ---------- */
function weighMotion() {
  const sec = $('.ch--weigh');
  const opts = $$('.opt');
  const pick = $('.opt.is-pick');
  const out = ['rooftop', 'cafe', 'brunch', 'crawl', 'kebab'].map((id) => $(`.opt[data-id="${id}"]`));
  G.set($$('.opt__no, .opt__yes'), { autoAlpha: 0 });
  // The heading and the six options arrive while the chapter scrolls in, so there is never an empty screen;
  // the pin then holds them while the reasons are stamped on.
  const enter = G.timeline({ scrollTrigger: { trigger: sec, start: 'top 85%', end: 'top 5%', scrub: .5, invalidateOnRefresh: true } });
  enter.from('.ch--weigh .ch__head > *', { y: 40, opacity: 0, stagger: .1, duration: .4, ease: 'power2.out' }, 0);
  enter.from(opts, { y: 90, opacity: 0, rotation: (i) => [-4, 3, -2, 4, -3, 2][i], stagger: .07, duration: .5, ease: 'power2.out' }, .15);
  const tl = G.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: sec, start: 'top top', end: () => `+=${innerHeight * 1.3}`, pin: true, scrub: .6, invalidateOnRefresh: true, anticipatePin: 1 },
  });
  let t = .1;
  out.forEach((o) => {
    tl.fromTo($('.opt__no', o), { autoAlpha: 0, scale: 1.5, rotation: -10 }, { autoAlpha: 1, scale: 1, rotation: -2, duration: .3, ease: 'back.out(2)' }, t);
    tl.to(o, { '--dim': .62, y: 10, scale: .97, duration: .3 }, t + .1);
    t += .38;
  });
  tl.fromTo($('.opt__yes', pick), { autoAlpha: 0, y: -10 }, { autoAlpha: 1, y: 0, duration: .3, ease: 'power2.out' }, t);
  tl.to(pick, { scale: 1.06, zIndex: 3, duration: .4, ease: 'power2.out' }, t);
  tl.to({}, { duration: .55 }); // a beat to read the reasons before the page moves on
}

/* ---------- 4. the plan: the pick opens up into the whole screen ---------- */
function planMotion() {
  const sec = $('.ch--plan');
  const reveal = $('.reveal');
  const ph = $('.ph', reveal);
  const plan = $('.plan');
  const proxy = { s: .16 };
  const apply = () => { G.set(reveal, { scale: proxy.s }); G.set(ph, { scale: 1 / proxy.s }); };
  apply();
  G.set(reveal, { '--scrim': 0 });
  const tl = G.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: sec, start: 'top top', end: () => `+=${innerHeight * 1.5}`, pin: true, scrub: .6, invalidateOnRefresh: true, anticipatePin: 1 },
  });
  tl.to(proxy, { s: 1, duration: .8, ease: 'power1.inOut', onUpdate: apply }, 0);
  tl.to(reveal, { '--scrim': 1, duration: .4 }, .45);
  tl.from($$('.plan__label, .plan__title, .plan__meta, .plan__then', plan), { y: 40, autoAlpha: 0, stagger: .08, duration: .35, ease: 'power2.out' }, .58);
  tl.from($$('.why', plan), { x: 40, autoAlpha: 0, stagger: .08, duration: .3, ease: 'power2.out' }, .85);
  tl.from($$('.plan__trade, .plan__acts', plan), { y: 20, autoAlpha: 0, stagger: .08, duration: .3, ease: 'power2.out' }, 1.1);
  tl.to({}, { duration: .6 }); // a beat to read the plan
}

/* ---------- 6. night: snapshots drift past at different depths ---------- */
function nightMotion() {
  const sec = $('.ch--night');
  $$('.snap').forEach((snap, i) => {
    const d = Number(snap.dataset.depth) || 1;
    G.fromTo(snap, { yPercent: 40 * d }, { yPercent: -80 * d, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true } });
    addAmbient(sec, G.to(snap, { y: -12 - 6 * d, rotation: `+=${i % 2 ? 2.5 : -2.5}`, duration: 2.8 + i * .4, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
  });
  G.from('.night__title .l', { yPercent: 70, autoAlpha: 0, stagger: .15, ease: 'none', scrollTrigger: { trigger: sec, start: 'top 70%', end: 'top 10%', scrub: true } });
}

function sectionReveals() {
  $$('.ch--try .ch__head > :not(h2), .ch--share .ch__head > :not(h2), .ch--join > :not(h2)').forEach((el) => {
    G.from(el, { y: 36, opacity: 0, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' } });
  });
  G.from('.decode', { y: 80, rotation: -6, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.share', start: 'top 95%', end: 'top 45%', scrub: true } });
}

/* ---------- "that's me" + received invitations ---------- */
let me = null;
const params = new URLSearchParams(location.search);
const clean = (v) => (v || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 18);
const isMe = (v) => /^(me|myself|i)$/i.test(v || '');

function pickMe(who) {
  me = me === who ? null : who;
  $$('.me').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.who === me)));
  $$('.decode__rows input').forEach((inp) => {
    const w = inp.closest('li').dataset.who;
    inp.placeholder = w === me ? 'Your name' : 'Their name';
    inp.closest('li').classList.toggle('is-me', w === me);
  });
  updateShare();
}
$$('.me').forEach((b) => b.addEventListener('click', () => pickMe(b.dataset.who)));

function readInvite() {
  const names = Object.fromEntries(Object.keys(PEOPLE).map((w) => [w, clean(params.get(w))]));
  const from = params.get('me');
  if (!Object.values(names).some(Boolean)) return;
  const sender = from && names[from] && !isMe(names[from]) ? names[from] : null;
  const invite = $('.invite');
  invite.textContent = sender
    ? `${sender} sent you this. ${sender} is ${ROLE[from]}. Which one are you?`
    : `Someone in your group sent you this. Which one are you?`;
  invite.hidden = false;
  for (const w of Object.keys(PEOPLE)) {
    const name = names[w];
    if (!name) continue;
    const tag = $(`.card[data-who="${w}"] .card__tag`);
    tag.textContent = w === from ? (sender ? `${sender} says this is them` : 'The person who sent this says this is them') : `In your group, this is ${isMe(name) ? 'whoever sent it' : name}`;
    tag.hidden = false;
    const inp = $(`#n-${w}`);
    if (!isMe(name)) inp.value = name;
  }
}

/* ---------- 7. share ---------- */
function shareLink(names) {
  const base = /^https?:$/.test(location.protocol) ? location.href.split(/[?#]/)[0] : 'https://planic.example/';
  const q = new URLSearchParams();
  for (const [w, n] of Object.entries(names)) if (n || w === me) q.set(w, n && !isMe(n) ? n : 'me');
  if (me) q.set('me', me);
  const s = q.toString();
  return s ? `${base}?${s}` : base;
}
function shareText(names) {
  const lines = [];
  for (const w of Object.keys(PEOPLE)) {
    const n = names[w];
    if (w === me) lines.unshift(`${n && !isMe(n) ? `${n} here. ` : ''}I’m ${ROLE[w]} (“${SAID[w]}”).`);
    else if (n && !isMe(n)) lines.push(`${n} is ${ROLE[w]}.`);
  }
  if (!lines.length) return 'Every group chat has these four. Which one are you?';
  return `Our group chat, decoded. ${lines.join(' ')} Which one are you?`;
}
function updateShare() {
  const names = Object.fromEntries($$('.decode__rows li').map((li) => [li.dataset.who, clean($('input', li).value)]));
  const text = shareText(names);
  const link = shareLink(names);
  $('.send__preview').textContent = text;
  $('#send-wa').href = `https://wa.me/?text=${encodeURIComponent(`${text} ${link}`)}`;
  return { text, link };
}
$$('.decode__rows input').forEach((inp) => inp.addEventListener('input', updateShare));
$('.decode').addEventListener('submit', (e) => e.preventDefault());
const shareBtn = $('#send-share');
if (navigator.share) {
  shareBtn.hidden = false;
  shareBtn.addEventListener('click', () => { const { text, link } = updateShare(); navigator.share({ text, url: link }).catch(() => {}); });
}
$('#send-copy').addEventListener('click', async (e) => {
  const btn = e.currentTarget; // currentTarget is gone after the await
  const { text, link } = updateShare();
  try { await navigator.clipboard.writeText(`${text} ${link}`); btn.textContent = 'Copied'; }
  catch { btn.textContent = 'Couldn’t copy'; }
  setTimeout(() => { btn.textContent = 'Copy link'; }, 2200);
});

/* ---------- 5. your turn: talk back ---------- */
const asksForm = $('.asks');
const said = $('.answer__said');
const card = $('.answer__card');
const resetBtn = $('.reset');
const peek = $('.peek');
peek.addEventListener('click', () => card.scrollIntoView({ behavior: MOTION ? 'smooth' : 'auto', block: 'center' }));
// The peek bar is only for when the answer is off screen; it steps aside once the card itself is in view.
new IntersectionObserver(([e]) => peek.classList.toggle('is-near', e.isIntersecting), { threshold: .35 }).observe(card);
let asks = { ...DEFAULT_ASKS };
function readAsks() {
  const v = (n) => $(`.asks input[name="${n}"]:checked`).value;
  return { food: v('food'), novelty: v('novelty'), budget: Number(v('budget')), free: Number(v('free')) };
}
function writeAsks(a) {
  for (const [k, val] of Object.entries(a)) {
    const inp = $(`.asks input[name="${k}"][value="${val}"]`);
    if (inp) inp.checked = true;
  }
}
function renderAnswer(r, text) {
  $('.answer__title', card).textContent = r.plan ? r.plan.title : NO_PLAN.title;
  $('.answer__meta', card).textContent = r.plan ? r.plan.meta : NO_PLAN.meta;
  $('.answer__why', card).innerHTML = whyRowsHTML(r);
  $('.answer__trade', card).innerHTML = r.plan ? tradeHTML(r.plan) : `<ul class="bends">${bendsHTML(r, { interactive: false })}</ul>`;
  card.classList.toggle('is-none', !r.plan);
  said.textContent = text;
  resetBtn.hidden = sameAsks(asks, DEFAULT_ASKS);
  peek.hidden = false;
  $('.peek__title', peek).textContent = r.plan ? r.plan.title : NO_PLAN.title;
  $('.peek__said', peek).textContent = text;
  peek.classList.toggle('is-none', !r.plan);
  if (MOTION) G.fromTo([...card.children], { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: .05, duration: .45, ease: 'power2.out', overwrite: true });
}
asksForm.addEventListener('change', () => {
  const prev = asks;
  asks = readAsks();
  const ex = explainChange(prev, asks);
  renderAnswer(evaluate(asks), ex.text || 'Nothing changed.');
});
resetBtn.addEventListener('click', () => {
  const prev = asks;
  asks = { ...DEFAULT_ASKS };
  writeAsks(asks);
  renderAnswer(evaluate(asks), explainChange(prev, asks, { reset: true }).text);
});

/* ---------- 8. join (prototype: validates, never submits) ---------- */
const join = $('.join__form');
join.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = $('#email');
  const ok = email.checkValidity() && email.value.trim();
  join.classList.toggle('is-bad', !ok);
  $('.join__msg').textContent = ok
    ? 'Prototype only: this form doesn’t send anything yet. On the live site you’d be on the list now.'
    : 'That email doesn’t look right. Check it and try again.';
});

/* ---------- 4b. the plan's actions ---------- */
const acceptBtn = $('.act--accept');
acceptBtn.addEventListener('click', () => {
  const on = acceptBtn.getAttribute('aria-pressed') !== 'true';
  acceptBtn.setAttribute('aria-pressed', String(on));
  acceptBtn.textContent = on ? 'Accepted ✓' : 'Accept';
  $('.plan__note').textContent = on ? 'Accepted. In the app, all four would see you’re in.' : '';
  // all four dots light up in turn: everyone sees it
  if (on && MOTION) G.fromTo($$('.plan .why__dot'), { scale: 1 }, { scale: 1.9, duration: .22, yoyo: true, repeat: 1, stagger: .12, ease: 'power2.out' });
});

/* ---------- in-page links glide instead of jumping ---------- */
$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const href = a.getAttribute('href');
  if (!/^#[\w-]+$/.test(href)) return; // e.g. the WhatsApp link, whose href is set later
  const t = document.getElementById(href.slice(1));
  if (!t) return;
  e.preventDefault();
  // A pinned chapter sits at its pin's end once you've scrolled past it, so aim for its spacer.
  const box = t.parentElement.classList.contains('pin-spacer') ? t.parentElement : t;
  const y = t.id === 'film' ? 0 : box.getBoundingClientRect().top + scrollY - (t.id === 'four' ? 8 : 0);
  scrollTo({ top: y, behavior: MOTION ? 'smooth' : 'auto' });
  t.setAttribute('tabindex', '-1');
  t.focus({ preventScroll: true });
}));

/* ---------- start ---------- */
readInvite();
updateShare();
{ // the film's still frame, framed for the screen, even when the film itself doesn't play
  const v = $('.film__video');
  if (innerWidth / innerHeight < .8) v.poster = v.dataset.posterTall;
}

if (MOTION) {
  G.registerPlugin(ST);
  ST.config({ ignoreMobileResize: true });
  stillBtn.hidden = false;
  stillBtn.addEventListener('click', () => {
    still = !still;
    root.classList.toggle('still', still);
    stillBtn.setAttribute('aria-pressed', String(still));
    $('.still__label').textContent = still ? 'Play motion' : 'Pause motion';
    ambient.forEach((a) => a.tweens.forEach((t) => (still || a.el.classList.contains('off') ? t.pause() : t.play())));
  });
  splitHeads(G);
  filmMotion();
  chatMotion();
  tickers();
  deckMotion();
  weighMotion();
  planMotion();
  nightMotion();
  sectionReveals();
  pointerLife(G);
  sky(); // last: its triggers sit below every pinned chapter, so they must be measured after the pins
  // Photos load lazily; re-measure once they arrive so pinned lengths stay right.
  if (document.readyState === 'complete') ST.refresh(); else addEventListener('load', () => ST.refresh());
}
