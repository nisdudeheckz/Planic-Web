// Planic scroll story. Scroll is the clock; every chapter reads in its finished state without this file.
// Uses GSAP + ScrollTrigger (self-hosted in vendor/) for scroll-linked motion, and the frozen
// talk-back engine for the "your turn" chapter.
import { evaluate, explainChange, sameAsks, DEFAULT_ASKS, PEOPLE } from '../interactive-hero/engine.js';
import { whyRowsHTML, tradeHTML, bendsHTML, NO_PLAN, esc } from '../interactive-hero/view.js';
import { pointerLife, splitHeads } from './life.js';
import { threads, liveWords, photoDump } from './alive.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const G = window.gsap;
const ST = window.ScrollTrigger;
const MOTION = !reduce && !!G && !!ST;
// On touch screens the finger and the phone's own momentum already make scrolling smooth. Extra scrub smoothing
// on top makes the page keep moving after you stop, which feels like drag, so there it follows the scroll exactly.
const TOUCH = matchMedia('(pointer: coarse)').matches;
const SMOOTH = TOUCH ? true : .6;
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
// During the opening film the clock shows your own time. When the chat starts it flips back to
// Wednesday afternoon: from there on it is the story's clock, and your scroll moves it.
const clockEl = $('.clock');
let realTime = true;
function showRealTime() {
  const d = new Date();
  setClock(d.toLocaleDateString('en-US', { weekday: 'short' }), d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }));
}
function useStoryTime(on, day, time) {
  if (on === !realTime) return;
  realTime = !on;
  clockEl.classList.remove('is-flip');
  void clockEl.offsetWidth; // restart the flip
  clockEl.classList.add('is-flip');
  clockEl.title = on ? 'The group chat’s time in the story. Scrolling moves it.' : 'Your time';
  if (on) setClock(day, time); else showRealTime();
}
setInterval(() => { if (realTime) showRealTime(); }, 20000);
showRealTime();
const navBg = document.querySelector('.nav__bg');
let filmST = null; // the film's pin, so the sky can follow it
let filmClosed = false; // once the film has closed into a card, the page around it is already daylight
// On the hosted page (not the preview or a local file) signups are saved and a few moments are counted.
// SITE is set by the hosted build; track() only does anything when Umami's script is on the page. No cookies.
const SITE = document.querySelector('meta[name="planic:site"]')?.content || '';
const counted = new Set();
function track(event, data, once = true) {
  if (once && counted.has(event)) return;
  counted.add(event);
  try { window.umami?.track(event, data); } catch { /* counting never breaks the page */ }
}

function enterChapter(sec) {
  if (sec.id === 'four') track('reached-the-four');
  if (sec.id === 'share') track('reached-share');
  document.body.dataset.ink = sec.id === 'film' && filmClosed ? 'dark' : sec.dataset.ink;
  document.body.dataset.ch = sec.id;
  if (sec.id !== 'try') $('.twist.on')?.classList.remove('on'); // Meera's note leaves with her chapter
  if (!MOTION) navBg.style.backgroundColor = sec.dataset.sky;
  if (sec.id === 'film') { if (!filmClosed) useStoryTime(false); return; }
  useStoryTime(true, sec.dataset.day, sec.dataset.time);
  if (sec.id !== 'top') setClock(sec.dataset.day, sec.dataset.time);
}
const chapterIO = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) enterChapter(e.target);
}, { rootMargin: '-50% 0px -50% 0px' });
sections.forEach((s) => chapterIO.observe(s));

/* ---------- ambient motion: runs only while its chapter is on screen ---------- */
const ambient = []; // [{ el, tweens: [] }]
const pauseBtn = $('.pause');
let still = false;
const offIO = new IntersectionObserver((entries) => {
  for (const e of entries) {
    e.target.classList.toggle('off', !e.isIntersecting);
    const a = ambient.find((x) => x.el === e.target);
    if (a) a.tweens.forEach((t) => (e.isIntersecting && !still ? t.play() : t.pause()));
  }
}, { rootMargin: '10% 0px' });
// Every chapter's CSS loops (photo drift, pings, the striped "four") pause while that chapter is off screen.
document.querySelectorAll('main .ch').forEach((el) => offIO.observe(el));
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
      trigger: sec, start: 'top top', end: () => `+=${innerHeight * .8}`, pin: true, scrub: SMOOTH, invalidateOnRefresh: true, anticipatePin: 1,
      onUpdate(self) {
        const closed = self.progress > .55;
        if (closed !== filmClosed) {
          filmClosed = closed;
          document.body.dataset.ink = closed ? 'dark' : 'light';
          useStoryTime(closed, 'Wed', '4:11 PM');
        }
      },
    },
  });
  tl.to('.film__copy', { y: -70, opacity: 0, duration: .45 }, 0)
    .to('.toasts', { y: -50, opacity: 0, duration: .45 }, .08)
    .fromTo(film, { clipPath: 'inset(0% 0% 0% 0% round 0px)' }, { clipPath: () => (innerWidth < 900 ? 'inset(7% 4% 7% 4% round 24px)' : 'inset(9% 6% 9% 6% round 32px)'), duration: 1 }, 0)
    .to(video, { scale: 1.08, duration: 1 }, 0)
    .to('.film__shade', { opacity: .6, duration: 1 }, 0);
  filmST = tl.scrollTrigger;
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
  G.from('.open__title .w', { yPercent: -140, rotation: () => G.utils.random(-12, 12), autoAlpha: 0, duration: 1.1, stagger: { each: .07, from: 'random' }, ease: 'bounce.out', scrollTrigger: arrive });
  // yPercent and opacity, so it never fights the pinned timeline below, which moves the thread by y
  G.from([thread], { yPercent: 10, opacity: 0, duration: 1, ease: 'power3.out', delay: .25, scrollTrigger: arrive });

  const tl = G.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: sec, start: 'top top', end: () => `+=${innerHeight * (phone() ? 1.6 : 1.3)}`,
      pin: true, scrub: SMOOTH, invalidateOnRefresh: true, anticipatePin: 1,
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
    let lastV = 1;
    ST.create({
      trigger: tk, start: 'top bottom', end: 'bottom top',
      onUpdate(self) {
        const v = Math.min(6, 1 + Math.abs(self.getVelocity()) / 400);
        if (Math.abs(v - lastV) < .3) return; // no new tween on every scroll event
        lastV = v;
        G.to(loop, { timeScale: v, duration: .2, overwrite: true, onComplete: () => { lastV = 1; G.to(loop, { timeScale: 1, duration: 1.2 }); } });
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
    // The day comes up around the film while it closes, so the chat arrives in daylight. Unsmoothed (scrub: true)
    // like every other sky change, so a jump down the page can't let it land last and paint the night white.
    const st = prev.id === 'film' && filmST
      ? { start: () => filmST.start + innerHeight * .24, end: () => filmST.start + innerHeight * .68, scrub: true }
      : { trigger: sec, start: 'top 85%', end: 'top 35%', scrub: true };
    G.fromTo(el, { backgroundColor: prev.dataset.sky }, { backgroundColor: sec.dataset.sky, ease: 'none', immediateRender: false, scrollTrigger: st });
  });
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
  const enter = G.timeline({ scrollTrigger: { trigger: sec, start: 'top 85%', end: 'top 5%', scrub: TOUCH ? true : .5, invalidateOnRefresh: true } });
  enter.from('.ch--weigh .ch__head > *', { y: 40, opacity: 0, stagger: .1, duration: .4, ease: 'power2.out' }, 0);
  enter.from(opts, { y: 90, opacity: 0, rotation: (i) => [-4, 3, -2, 4, -3, 2][i], stagger: .07, duration: .5, ease: 'power2.out' }, .15);
  const tl = G.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: sec, start: 'top top', end: () => `+=${innerHeight * 1.3}`, pin: true, scrub: SMOOTH, invalidateOnRefresh: true, anticipatePin: 1 },
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
    scrollTrigger: { trigger: sec, start: 'top top', end: () => `+=${innerHeight * 1.5}`, pin: true, scrub: SMOOTH, invalidateOnRefresh: true, anticipatePin: 1 },
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

// Once you've said which one you are, the rest of the page knows: your thread, your ask, your row in the plan.
const FOR_YOU = {
  a: 'For you, Aanya: a veg menu, and nobody had to ask twice.',
  r: 'For you, Rohan: somewhere none of you had been.',
  m: 'For you, Meera: about ₹550, and home on the last metro.',
  k: 'For you, Kabir: it started after 7, like you said.',
};
function celebrate(btn, who) {
  if (navigator.vibrate) try { navigator.vibrate(12); } catch { /* not allowed here */ }
  if (!MOTION) return;
  const r = btn.getBoundingClientRect();
  for (let i = 0; i < 10; i++) {
    const d = document.createElement('i');
    d.className = 'burst';
    d.dataset.who = who;
    d.style.left = `${r.left + r.width / 2}px`;
    d.style.top = `${r.top + r.height / 2}px`;
    document.body.append(d);
    const a = (i / 10) * Math.PI * 2 + Math.random() * .4;
    const dist = 50 + Math.random() * 40;
    G.fromTo(d, { x: 0, y: 0, scale: 1, opacity: 1 }, {
      x: Math.cos(a) * dist, y: Math.sin(a) * dist + 20, scale: .3, opacity: 0, duration: .8, ease: 'power3.out',
      onComplete: () => d.remove(),
    });
  }
}
function pickMe(who, btn) {
  me = me === who ? null : who;
  if (me) document.body.dataset.me = me; else delete document.body.dataset.me;
  $('.night__you').textContent = me ? FOR_YOU[me] : '';
  if (me && btn) { celebrate(btn, me); track('picked', { who: ROLE[me] }, false); }
  $$('.me').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.who === me)));
  $$('.decode__rows input').forEach((inp) => {
    const w = inp.closest('li').dataset.who;
    inp.placeholder = w === me ? 'Your name' : 'Their name';
    inp.closest('li').classList.toggle('is-me', w === me);
  });
  updateShare();
}
$$('.me').forEach((b) => b.addEventListener('click', () => pickMe(b.dataset.who, b)));
$('#send-wa').addEventListener('click', () => track('sent', { how: 'whatsapp' }, false));

function readInvite() {
  const names = Object.fromEntries(Object.keys(PEOPLE).map((w) => [w, clean(params.get(w))]));
  const from = params.get('me');
  if (!Object.values(names).some(Boolean)) return;
  track('invite-opened', { from: ROLE[from] || 'unknown' });
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
  retell(names);
}

// An invite link retells the whole story with your group's names: the chat, the cards, the plan,
// the night out. Everything that names someone is rewritten, including text the page writes later
// (the plan's reasons, talk back, the typing line), so a MutationObserver keeps it going.
// The roles stay as they are ("the Aanya"), because that is what the page is about.
const KEEP = '.invite, .ticker, .me__on, .card__tag, .share, .foot, script, style, noscript';
const PRONOUNS = [
  [/\bon her way\b/g, 'on their way'], [/\bfor her\b/g, 'for them'], [/\bher limit\b/g, 'their limit'],
  [/\bunder her\b/g, 'under their'], [/\bhe saw\b/g, 'they saw'], [/\bhe’s\b/g, 'they’re'],
];
let renamed = (t) => t; // the same swap, for text written outside main
function retell(names) {
  const swap = {};
  for (const w of Object.keys(PEOPLE)) if (names[w] && !isMe(names[w])) swap[PEOPLE[w].name] = names[w];
  if (!Object.keys(swap).length) return;
  const re = new RegExp(`\\b(${Object.keys(swap).join('|')})\\b`, 'g');
  const done = new WeakMap(); // text node -> what we wrote, so a name is never swapped twice
  const fix = (node) => {
    if (done.get(node) === node.data) return;
    const el = node.parentElement;
    if (!el || el.closest(KEEP)) return;
    let t = node.data.replace(re, (m) => swap[m]);
    for (const [p, q] of PRONOUNS) t = t.replace(p, q);
    if (t !== node.data) node.data = t;
    done.set(node, node.data);
  };
  const walk = (root) => {
    if (root.nodeType === 3) return fix(root);
    if (root.nodeType !== 1) return;
    const it = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = it.nextNode(); n; n = it.nextNode()) fix(n);
  };
  renamed = (t) => t.replace(re, (m) => swap[m]);
  const main = $('main');
  walk(main);
  for (const w of Object.keys(PEOPLE)) {
    const n = names[w];
    if (!n || isMe(n)) continue;
    const ini = [...n][0].toUpperCase(); // their initial in every avatar
    $$(`.toast[data-who="${w}"] > i, .thread__faces i[data-who="${w}"]`).forEach((i) => { i.textContent = ini; });
    document.body.style.setProperty(`--ini-${w}`, JSON.stringify(ini));
  }
  new MutationObserver((list) => list.forEach((m) => {
    if (m.type === 'characterData') fix(m.target); else m.addedNodes.forEach(walk);
  })).observe(main, { childList: true, subtree: true, characterData: true });
  // Keep the disclosure honest: the names are theirs, the words are still the example.
  const note = document.createElement('span');
  note.textContent = 'Your group’s names come from the link you were sent; what they “say” here is still the example, not their messages.';
  $('.foot__small span').after(' ', note);
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
  shareBtn.addEventListener('click', () => { track('sent', { how: 'share' }, false); const { text, link } = updateShare(); navigator.share({ text, url: link }).catch(() => {}); });
}
$('#send-copy').addEventListener('click', async (e) => {
  const btn = e.currentTarget; // currentTarget is gone after the await
  const { text, link } = updateShare();
  track('sent', { how: 'copy' }, false);
  try { await navigator.clipboard.writeText(`${text} ${link}`); btn.textContent = 'Copied'; }
  catch { btn.textContent = 'Couldn’t copy'; }
  setTimeout(() => { btn.textContent = 'Copy link'; }, 2200);
});

/* ---------- the decoded card as a story-sized picture (1080 x 1920) ---------- */
const TONES = { a: '#FF6B61', r: '#B8AEFF', m: '#F5C76B', k: '#9ED9B8' };
async function drawCard() {
  const W = 1080, H = 1920;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d');
  const D = '"Bricolage Grotesque", system-ui, sans-serif';
  const B = '"Instrument Sans", system-ui, sans-serif';
  try { await Promise.all([document.fonts.load(`800 120px ${D}`), document.fonts.load(`500 40px ${B}`)]); } catch { /* system fonts then */ }
  x.fillStyle = '#111216'; x.fillRect(0, 0, W, H);
  // four soft lights, one per friend
  [['a', 120, 260], ['r', 980, 520], ['m', 140, 1500], ['k', 960, 1760]].forEach(([w, cx, cy]) => {
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, 520);
    g.addColorStop(0, `${TONES[w]}55`); g.addColorStop(1, `${TONES[w]}00`);
    x.fillStyle = g; x.fillRect(0, 0, W, H);
  });
  // the four threads, coming together at the bottom
  ['a', 'r', 'm', 'k'].forEach((w, i) => {
    x.strokeStyle = TONES[w]; x.lineWidth = 6; x.lineCap = 'round';
    x.beginPath();
    for (let y = 0; y <= H; y += 20) {
      const s = Math.max(0, 1 - y / (H * .92));
      const px = 56 + (i - 1.5) * 14 * s + Math.sin(y / 90 + i * 2) * 16 * s;
      if (y) x.lineTo(px, y); else x.moveTo(px, y);
    }
    x.stroke();
  });
  // mark: the chat bubble that is also a pin (same paths as favicon.svg), then planic!!
  x.save(); x.translate(110, 108); x.scale(2.1, 2.1);
  x.lineWidth = 3; x.lineCap = 'round'; x.lineJoin = 'round';
  [['a', 'M16 29.5 L 12.6 23.5 H 10 A 7 7 0 0 1 3 16.5 V 12'], ['r', 'M3 9 A 7 7 0 0 1 10 2 H 14.5'],
    ['m', 'M17.5 2 H 22 A 7 7 0 0 1 29 9 V 12'], ['k', 'M29 15 V 16.5 A 7 7 0 0 1 22 23.5 H 19.4 L 16 29.5']].forEach(([w, d]) => {
    x.strokeStyle = TONES[w]; x.stroke(new Path2D(d));
  });
  x.fillStyle = '#FBFBFA'; x.beginPath(); x.arc(16, 12.8, 3.6, 0, 7); x.fill();
  x.restore();
  x.fillStyle = '#FBFBFA'; x.font = `800 50px ${D}`; x.textBaseline = 'middle';
  x.fillText('planic', 192, 142);
  x.fillStyle = '#FF6B61'; x.fillText('!!', 192 + x.measureText('planic').width + 2, 142);
  // title
  x.textBaseline = 'alphabetic';
  x.font = `800 124px ${D}`; x.fillStyle = '#FBFBFA';
  x.fillText('Our group chat,', 110, 400);
  x.fillStyle = '#FF6B61'; x.fillText('decoded.', 110, 520);
  // the four
  const names = Object.fromEntries($$('.decode__rows li').map((li) => [li.dataset.who, clean($('input', li).value)]));
  ['a', 'r', 'm', 'k'].forEach((w, i) => {
    const top = 640 + i * 250;
    x.fillStyle = TONES[w];
    x.beginPath(); x.roundRect(110, top, 860, 220, 36); x.fill();
    x.fillStyle = '#111216';
    x.font = `600 34px ${B}`;
    x.fillText($(`.decode__rows li[data-who="${w}"] .decode__role`).textContent, 150, top + 62);
    const n = names[w] && !isMe(names[w]) ? names[w] : (w === me ? 'Me' : '???');
    const label = n + (w === me && n !== 'Me' ? ' (me)' : '');
    let size = 92; // long names shrink to fit the card
    do { x.font = `800 ${size}px ${D}`; size -= 4; } while (x.measureText(label).width > 780 && size > 44);
    x.fillText(label, 150, top + 156);
    x.font = `500 30px ${B}`; x.globalAlpha = .7;
    x.fillText(`“${SAID[w]}”`, 150, top + 198); x.globalAlpha = 1;
  });
  x.fillStyle = '#FBFBFA'; x.font = `800 76px ${D}`;
  x.fillText('Which one are you?', 110, 1720);
  x.font = `500 34px ${B}`; x.fillStyle = 'rgba(251,251,250,.7)';
  x.fillText('Planic · plans for the group chat · early access', 110, 1790);
  return new Promise((res) => c.toBlob(res, 'image/png'));
}
const cardBtn = $('#send-card');
// Only the claude.ai preview has window.claude; on the real site this stays null and the browser saves directly.
const hostDownloads = window.claude && window.claude.use ? window.claude.use('downloads').catch(() => null) : Promise.resolve(null);
if (HTMLCanvasElement.prototype.toBlob && CanvasRenderingContext2D.prototype.roundRect) {
  cardBtn.hidden = false;
  cardBtn.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    track('sent', { how: 'image' }, false);
    btn.textContent = 'Making it…';
    try {
      const blob = await drawCard();
      const file = new File([blob], 'our-group-chat-decoded.png', { type: 'image/png' });
      // Inside a claude.ai preview the page can't download by itself; the viewer's app offers the save instead.
      const host = await hostDownloads;
      if (host) {
        try { await host.save({ filename: file.name, data: blob }); }
        catch (err) { btn.textContent = err && err.code === 'declined' ? 'Save as image' : 'Couldn’t save it here'; setTimeout(() => { btn.textContent = 'Save as image'; }, 2400); return; }
      } else if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text: updateShare().text }).catch(() => {});
      } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = file.name;
        document.body.append(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      }
      btn.textContent = 'Saved ✓';
    } catch { btn.textContent = 'Couldn’t make it'; }
    setTimeout(() => { btn.textContent = 'Save as image'; }, 2400);
  });
}

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
asksForm.addEventListener('change', (e) => {
  if (e.isTrusted) track('talked-back');
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

// The twist. The first time you reach your turn, before you've touched anything, Meera's budget
// drops, the way a real group's plan breaks on Friday. Planic won't guess: it says nothing fits
// and what would. The note comes in like the messages in the opening film did.
function twist() {
  const ans = $('.answer');
  let done = false;
  let seen = false; // only while the answer is on screen; scrolling straight past saves it for later
  const io = new IntersectionObserver(([e]) => {
    seen = e.isIntersecting;
    if (!seen || done) return;
    if (!sameAsks(asks, DEFAULT_ASKS)) { done = true; io.disconnect(); return; } // they're already talking back
    setTimeout(() => {
      if (done || !seen || !sameAsks(asks, DEFAULT_ASKS)) return;
      done = true;
      io.disconnect();
      const name = renamed('Meera');
      const note = document.createElement('div');
      note.className = 'twist';
      note.dataset.who = 'm';
      note.setAttribute('aria-hidden', 'true'); // the answer line below says it out loud
      note.innerHTML = '<i></i><span class="toast__top"><b></b> · the usual four · now</span><span class="toast__msg">sorry guys, ₹400 max this week 🙈</span>';
      $('i', note).textContent = [...name][0].toUpperCase();
      $('b', note).textContent = name;
      document.body.append(note);
      requestAnimationFrame(() => note.classList.add('on'));
      setTimeout(() => { note.classList.remove('on'); setTimeout(() => note.remove(), 600); }, 5200);
      if (navigator.vibrate) try { navigator.vibrate([10, 60, 10]); } catch { /* not allowed here */ }
      const meera = $('.ask[data-who="m"]');
      meera.classList.add('is-twist');
      setTimeout(() => meera.classList.remove('is-twist'), 2400);
      track('twist-seen');
      writeAsks({ budget: 400 });
      asksForm.dispatchEvent(new Event('change'));
    }, MOTION ? 900 : 300);
  }, { threshold: .55 });
  io.observe(ans);
}
twist();

/* ---------- 8. join: saved by Netlify Forms on the hosted page; the preview only checks the address ---------- */
const join = $('.join__form');
join.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = $('#email');
  const msg = $('.join__msg');
  const btn = $('button[type="submit"]', join);
  const ok = email.checkValidity() && email.value.trim();
  join.classList.toggle('is-bad', !ok);
  if (!ok) { msg.textContent = 'That email doesn’t look right. Check it and try again.'; return; }
  if (!SITE) {
    msg.textContent = 'Prototype only: this form doesn’t send anything yet. On the live site you’d be on the list now.';
    welcome();
    return;
  }
  btn.disabled = true;
  msg.textContent = 'Saving…';
  try {
    const res = await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(new FormData(join)).toString(),
    });
    if (!res.ok) throw new Error(res.status);
    msg.textContent = 'You’re on the list. We’ll email you when the first plans open.';
    email.value = '';
    track('signed-up', { me: me ? ROLE[me] : 'not picked' });
    welcome();
  } catch {
    msg.textContent = 'That didn’t save. Check your connection and try again.';
  } finally {
    btn.disabled = false;
  }
});

// A small hello from the group when you join (decoration only; the message above says what really happened).
function welcome() {
  const box = $('.join__hello');
  if (box.childElementCount) return;
  [['k', 'Kabir', 'welcome to the group 👋'], ['m', 'Meera', 'finally someone else plans'], ['a', 'Aanya', 'is there veg tho']].forEach(([who, name, text], i) => {
    const b = document.createElement('p');
    b.className = 'hello';
    b.dataset.who = who;
    b.innerHTML = `<b>${name}</b> ${text}`;
    box.append(b);
    if (MOTION) G.from(b, { y: 18, scale: .8, opacity: 0, duration: .5, delay: .25 + i * .55, ease: 'back.out(2)' });
  });
  if (navigator.vibrate) try { navigator.vibrate([10, 60, 10]); } catch { /* not allowed here */ }
}

/* ---------- the tab: when you look away, the group chat keeps going ---------- */
{
  const title = document.title;
  let away = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { away = Math.min(away + 3, 47); document.title = `(${away}) so… where? · Planic`; }
    else document.title = title;
  });
}

/* ---------- 4b. the plan's actions ---------- */
const acceptBtn = $('.act--accept');
acceptBtn.addEventListener('click', () => {
  const on = acceptBtn.getAttribute('aria-pressed') !== 'true';
  acceptBtn.setAttribute('aria-pressed', String(on));
  acceptBtn.textContent = on ? 'Accepted ✓' : 'Accept';
  if (on && navigator.vibrate) try { navigator.vibrate(12); } catch { /* not allowed here */ }
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
  pauseBtn.hidden = false;
  pauseBtn.addEventListener('click', () => {
    still = !still;
    root.classList.toggle('still', still);
    pauseBtn.setAttribute('aria-pressed', String(still));
    const label = still ? 'Play motion' : 'Pause motion';
    pauseBtn.setAttribute('aria-label', label);
    pauseBtn.title = label;
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
  threads(G, ST, addAmbient);
  liveWords(G, addAmbient);
  photoDump(G);
  // Photos load lazily; re-measure once they arrive so pinned lengths stay right.
  if (document.readyState === 'complete') ST.refresh(); else addEventListener('load', () => ST.refresh());
}
