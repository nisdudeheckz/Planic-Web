// Two things that make the page feel alive. Loaded by story.js only when motion is on.
//   threads():   four coloured threads, one per friend, that wander apart through the chat and the options,
//                braid into one line when the plan lands, and part again for Friday night.
//   liveWords(): the big words (headlines, the opening line, the night line) float a little, sway with
//                your scroll, lean away from the pointer and can be flicked; they always spring home.
//                Reading text (paragraphs, plan details) never moves this way.

const ORDER = ['a', 'r', 'm', 'k'];
const HUE = { a: '#FF6B61', r: '#B8AEFF', m: '#F5C76B', k: '#9ED9B8' };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (t) => t * t * (3 - 2 * t);

/* ---------- the four threads ---------- */
export function threads(G, ST, addAmbient) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'threads');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const paths = ORDER.map((who) => {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('class', 'thread');
    p.setAttribute('stroke', HUE[who]);
    p.dataset.who = who;
    svg.append(p);
    return p;
  });
  const one = document.createElementNS(NS, 'path');
  one.setAttribute('class', 'thread thread--one');
  svg.append(one);
  const knot = document.createElementNS(NS, 'circle');
  knot.setAttribute('class', 'thread__knot');
  knot.setAttribute('r', '5');
  svg.append(knot);
  document.body.append(svg);

  // Where each chapter sits on the page, and how far apart the four are there.
  // spread 1 = four separate people, 0 = one plan. chaos = how much they wander and cross.
  const PLAN = {
    'ch--chat': [1, 1], 'ch--four': [1, .15], 'ch--weigh': [.85, .8], 'ch--try': [.3, .35],
    'ch--night': [1, .55], 'ch--share': [.55, .3], 'ch--join': [0, 0],
  };
  let keys = [];
  let showFrom = 0;
  let gutter = 60;
  let H = innerHeight;
  function measure() {
    H = innerHeight;
    gutter = parseFloat(getComputedStyle(document.querySelector('.ch--four')).paddingLeft) || 16;
    svg.setAttribute('viewBox', `0 0 ${gutter} ${H}`);
    svg.style.width = `${gutter}px`;
    const box = (sec) => {
      const b = sec.parentElement.classList.contains('pin-spacer') ? sec.parentElement : sec;
      const r = b.getBoundingClientRect();
      return { top: r.top + scrollY, bottom: r.bottom + scrollY };
    };
    keys = [];
    for (const sec of document.querySelectorAll('main > .ch, main > .pin-spacer > .ch')) {
      const { top, bottom } = box(sec);
      if (sec.id === 'film') { showFrom = bottom - H * .3; continue; }
      if (sec.classList.contains('ch--plan')) {
        // the braid: they come together while the plan is revealed, and stay one through it
        keys.push([top, .85, .6], [top + (bottom - top) * .45, 0, 0], [bottom - H * .2, 0, 0]);
        continue;
      }
      const v = Object.entries(PLAN).find(([c]) => sec.classList.contains(c));
      if (!v) continue;
      const [s, c] = v[1];
      const pad = Math.min(H * .35, (bottom - top) * .3);
      keys.push([top + pad, s, c], [bottom - pad, s, c]);
    }
    keys.sort((a, b) => a[0] - b[0]);
  }
  function at(P) {
    if (!keys.length) return [1, 1];
    if (P <= keys[0][0]) return [keys[0][1], keys[0][2]];
    for (let i = 1; i < keys.length; i++) {
      if (P <= keys[i][0]) {
        const [p0, s0, c0] = keys[i - 1];
        const [p1, s1, c1] = keys[i];
        const t = smooth(clamp((P - p0) / Math.max(1, p1 - p0), 0, 1));
        return [s0 + (s1 - s0) * t, c0 + (c1 - c0) * t];
      }
    }
    const k = keys[keys.length - 1];
    return [k[1], k[2]];
  }

  const N = 36;
  let time = 0;
  let wasOne = false;
  function draw() {
    const y0 = scrollY;
    const cx = gutter / 2;
    const gap = Math.max(2.5, gutter * .16);
    const ds = paths.map(() => []);
    const dOne = [];
    let midSpread = 1;
    for (let j = 0; j <= N; j++) {
      const y = (j / N) * H;
      const P = y0 + y;
      const [spread, chaos] = at(P);
      if (j === N / 2) midSpread = spread;
      ORDER.forEach((_, i) => {
        const lane = (i - 1.5) * gap;
        const weave = Math.cos(P / 380 + i * 1.7 + time * .25) * chaos; // lanes drift and cross
        const wander = Math.sin(P / (95 + i * 23) + i * 2.1 + time * (.5 + i * .07)) * gap * 1.1 * chaos;
        const braid = Math.sin(P / 24 + i * Math.PI / 2 + time * 1.4) * 2.2; // a twisted rope when they're one
        const x = cx + spread * (lane * (1 - chaos * .6) + lane * weave * .6 + wander) + (1 - spread) * braid;
        ds[i].push(`${j ? 'L' : 'M'}${clamp(x, 2, gutter - 2).toFixed(1)} ${y.toFixed(1)}`);
      });
      dOne.push(`${j ? 'L' : 'M'}${cx.toFixed(1)} ${y.toFixed(1)}`);
    }
    paths.forEach((p, i) => p.setAttribute('d', ds[i].join('')));
    one.setAttribute('d', dOne.join(''));
    // after the film, the threads draw themselves in
    const show = clamp((y0 + H - showFrom) / (H * .5), 0, 1);
    svg.style.opacity = String(show);
    const oneness = clamp(1 - midSpread / .12, 0, 1);
    one.style.opacity = String(oneness);
    knot.setAttribute('cx', String(cx));
    knot.setAttribute('cy', String(H / 2));
    // the moment they become one, a small knot pulses where they meet
    const isOne = midSpread < .03;
    if (isOne && !wasOne && show > .5) G.fromTo(knot, { attr: { r: 3 }, opacity: 1 }, { attr: { r: 16 }, opacity: 0, duration: .9, ease: 'power2.out' });
    wasOne = isOne;
  }

  let running = false;
  const tick = (_, dt) => { time += Math.min(dt, 50) / 1000; draw(); };
  addAmbient(document.querySelector('main'), {
    play() { if (!running) { running = true; G.ticker.add(tick); } },
    pause() { running = false; G.ticker.remove(tick); draw(); },
  });
  ST.addEventListener('refresh', () => { measure(); draw(); });
  addEventListener('scroll', () => { if (!running) draw(); }, { passive: true });
  measure();
  draw();
}

/* ---------- living words ---------- */
export function liveWords(G, addAmbient) {
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const words = [...document.querySelectorAll('.open__title .w, main h2:not(.plan__title) .split, .film__line .split')]
    .map((el, i) => ({ el, i, x: 0, y: 0, r: 0, vx: 0, vy: 0, vr: 0, cx: 0, cy: 0, w: 0, drag: null }));
  if (!words.length) return;
  words.forEach((w) => w.el.classList.add('alive'));

  // Only words on screen take part.
  const live = new Set();
  const heads = new Map();
  words.forEach((w) => {
    const h = w.el.closest('h1, h2, p');
    if (!heads.has(h)) heads.set(h, []);
    heads.get(h).push(w);
  });
  const io = new IntersectionObserver((es) => es.forEach((e) => heads.get(e.target).forEach((w) => {
    if (e.isIntersecting) live.add(w);
    else { live.delete(w); Object.assign(w, { x: 0, y: 0, r: 0, vx: 0, vy: 0, vr: 0 }); paint(w); }
  })), { rootMargin: '10% 0px' });
  heads.forEach((_, h) => io.observe(h));

  const ptr = { x: -9999, y: -9999, on: false };
  addEventListener('pointermove', (e) => { ptr.x = e.clientX; ptr.y = e.clientY; ptr.on = e.pointerType === 'mouse'; }, { passive: true });
  document.addEventListener('pointerleave', () => { ptr.on = false; });

  // Flick a word with the mouse; tap one on a touch screen and it hops.
  const pick = (e) => words.find((w) => w.el === e.target.closest('.alive'));
  addEventListener('pointerdown', (e) => {
    const w = pick(e);
    if (!w) return;
    if (e.pointerType !== 'mouse') {
      w.vy -= 520; w.vr += (Math.random() - .5) * 260;
      live.forEach((o) => { if (o !== w && Math.abs(o.i - w.i) === 1) o.vy -= 220; });
      return;
    }
    e.preventDefault();
    w.drag = { sx: e.clientX - w.x, sy: e.clientY - w.y, lx: e.clientX, ly: e.clientY, lt: performance.now(), vx: 0, vy: 0 };
    w.el.classList.add('is-held');
    document.documentElement.classList.add('holding');
  });
  addEventListener('pointermove', (e) => {
    const w = words.find((o) => o.drag);
    if (!w) return;
    const d = w.drag;
    const now = performance.now();
    const dt = Math.max(8, now - d.lt) / 1000;
    d.vx = (e.clientX - d.lx) / dt; d.vy = (e.clientY - d.ly) / dt;
    d.lx = e.clientX; d.ly = e.clientY; d.lt = now;
    w.x = e.clientX - d.sx; w.y = e.clientY - d.sy;
    w.r = clamp(w.x * .08, -25, 25);
  }, { passive: true });
  addEventListener('pointerup', () => {
    const w = words.find((o) => o.drag);
    if (!w) return;
    w.vx = clamp(w.drag.vx, -3000, 3000); w.vy = clamp(w.drag.vy, -3000, 3000); w.vr = w.vx * .05;
    w.drag = null;
    w.el.classList.remove('is-held');
    document.documentElement.classList.remove('holding');
  });

  let lastY = scrollY;
  let t = 0;
  function paint(w) {
    w.el.style.translate = w.x || w.y ? `${w.x.toFixed(2)}px ${w.y.toFixed(2)}px` : '';
    w.el.style.rotate = w.r ? `${w.r.toFixed(2)}deg` : '';
  }
  function step(_, dtMs) {
    const dt = Math.min(dtMs, 40) / 1000;
    t += dt;
    const sv = (scrollY - lastY) / Math.max(dt, .001); // scroll speed, px/s
    lastY = scrollY;
    // read positions first, then write, so layout is measured once per frame
    if (fine && ptr.on) live.forEach((w) => {
      const r = w.el.getBoundingClientRect();
      w.cx = r.left + r.width / 2 - w.x; w.cy = r.top + r.height / 2 - w.y; w.w = r.width;
    });
    live.forEach((w) => {
      if (w.drag) { paint(w); return; }
      // home drifts a touch: the words float
      const hx = 0;
      const hy = Math.sin(t * 1.25 + w.i * .9) * 1.6;
      let ax = (hx - w.x) * 140 - w.vx * 11;
      let ay = (hy - w.y) * 140 - w.vy * 11;
      let ar = (0 - w.r) * 120 - w.vr * 10;
      // your scroll makes them sway, staggered so the line ripples
      ay += sv * (.9 + (w.i % 3) * .25); // they lag behind the page a moment, then catch up
      // the pointer pushes them aside
      if (fine && ptr.on) {
        const dx = w.cx + w.x - ptr.x;
        const dy = w.cy + w.y - ptr.y;
        const R = 90 + w.w * .5;
        const d = Math.hypot(dx, dy);
        if (d < R && d > .1) {
          const f = (1 - d / R) ** 2 * 9000;
          ax += (dx / d) * f; ay += (dy / d) * f; ar += (dx / d) * f * .03;
        }
      }
      w.vx += ax * dt; w.vy += ay * dt; w.vr += ar * dt;
      w.x = clamp(w.x + w.vx * dt, -220, 220);
      w.y = clamp(w.y + w.vy * dt, -220, 220);
      w.r = clamp(w.r + w.vr * dt, -40, 40);
      paint(w);
    });
  }

  let running = false;
  addAmbient(document.querySelector('main'), {
    play() { if (!running) { running = true; G.ticker.add(step); } },
    pause() {
      running = false; G.ticker.remove(step);
      words.forEach((w) => { Object.assign(w, { x: 0, y: 0, r: 0, vx: 0, vy: 0, vr: 0, drag: null }); paint(w); });
    },
  });
}

/* ---------- Friday night: a photo dump you can throw around ---------- */
// Grab a snapshot and throw it; it slides to a stop like a print on a table, and someone in the group reacts.
// On a touch screen, a tap tosses it a little instead, so the page still scrolls under your finger.
const REACT = [
  ['a', 'send pics!!'], ['r', 'who took this 😂'], ['m', 'best friday'], ['k', 'same time next week?'],
  ['a', 'the momos tho'], ['r', 'I was winning'], ['m', 'made the last metro'], ['k', '10/10'],
];
export function photoDump(G) {
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const stage = document.querySelector('.night-stage');
  const snaps = [...document.querySelectorAll('.snap')].map((el) => ({ el, x: 0, y: 0, r: 0, vx: 0, vy: 0, vr: 0, held: null }));
  if (!stage || !snaps.length) return;
  let n = 0;
  let z = 10;
  function react(s) {
    const [who, text] = REACT[n++ % REACT.length];
    const b = document.createElement('p');
    b.className = 'react';
    b.dataset.who = who;
    b.textContent = text;
    b.setAttribute('aria-hidden', 'true');
    const r = s.el.getBoundingClientRect();
    const sr = stage.getBoundingClientRect();
    b.style.left = `${r.left - sr.left + r.width * .5}px`;
    b.style.top = `${r.top - sr.top}px`;
    stage.append(b);
    G.fromTo(b, { y: 10, scale: .6, opacity: 0 }, { y: -40, scale: 1, opacity: 1, duration: .45, ease: 'back.out(2)' });
    G.to(b, { y: -90, opacity: 0, duration: .6, delay: 1.4, ease: 'power2.in', onComplete: () => b.remove() });
  }
  const paint = (s) => {
    s.el.style.translate = `${s.x.toFixed(1)}px ${s.y.toFixed(1)}px`;
    s.el.style.rotate = `${s.r.toFixed(2)}deg`;
  };
  let running = false;
  const glide = (_, dtMs) => {
    const dt = Math.min(dtMs, 40) / 1000;
    let moving = false;
    snaps.forEach((s) => {
      const out = s.b && (s.x < s.b.minX - 1 || s.x > s.b.maxX + 1 || s.y < s.b.minY - 1 || s.y > s.b.maxY + 1);
      if (s.held || (!out && Math.abs(s.vx) < 4 && Math.abs(s.vy) < 4 && Math.abs(s.vr) < 2)) return;
      moving = true;
      const f = Math.exp(-4 * dt); // friction: a print sliding on a table
      s.vx *= f; s.vy *= f; s.vr *= f;
      s.x += s.vx * dt; s.y += s.vy * dt; s.r += s.vr * dt;
      // stay on the table: past an edge, it eases back in
      const b = s.b;
      if (b) {
        if (s.x < b.minX) s.vx = Math.max(s.vx, (b.minX - s.x) * 5);
        if (s.x > b.maxX) s.vx = Math.min(s.vx, (b.maxX - s.x) * 5);
        if (s.y < b.minY) s.vy = Math.max(s.vy, (b.minY - s.y) * 5);
        if (s.y > b.maxY) s.vy = Math.min(s.vy, (b.maxY - s.y) * 5);
      }
      paint(s);
    });
    if (!moving) { running = false; G.ticker.remove(glide); }
  };
  // how far each print may travel: inside the chapter, a little past the sides
  function bounds(s) {
    const r = s.el.getBoundingClientRect();
    const sr = stage.getBoundingClientRect();
    s.b = {
      minX: s.x + (sr.left - r.left) - r.width * .25, maxX: s.x + (sr.right - r.right) + r.width * .25,
      minY: s.y + (sr.top - r.top), maxY: s.y + (sr.bottom - r.bottom),
    };
  }
  const go = () => { if (!running) { running = true; G.ticker.add(glide); } };

  snaps.forEach((s) => {
    s.el.classList.add('is-loose');
    s.el.addEventListener('pointerdown', (e) => {
      s.el.style.zIndex = String(++z);
      if (e.pointerType !== 'mouse' || !fine) {
        const a = Math.random() * Math.PI * 2;
        s.vx = Math.cos(a) * 520; s.vy = Math.sin(a) * 380; s.vr = (Math.random() - .5) * 120;
        bounds(s); react(s); go();
        return;
      }
      e.preventDefault();
      s.held = { lx: e.clientX, ly: e.clientY, lt: performance.now(), vx: 0, vy: 0 };
      s.el.classList.add('is-held');
      s.el.setPointerCapture(e.pointerId);
    });
    s.el.addEventListener('pointermove', (e) => {
      const h = s.held;
      if (!h) return;
      const now = performance.now();
      const dt = Math.max(8, now - h.lt) / 1000;
      h.vx = (e.clientX - h.lx) / dt; h.vy = (e.clientY - h.ly) / dt;
      s.x += e.clientX - h.lx; s.y += e.clientY - h.ly;
      s.r += (e.clientX - h.lx) * .04;
      h.lx = e.clientX; h.ly = e.clientY; h.lt = now;
      paint(s);
    });
    const drop = () => {
      const h = s.held;
      if (!h) return;
      s.held = null;
      s.el.classList.remove('is-held');
      s.vx = Math.max(-1800, Math.min(1800, h.vx)); s.vy = Math.max(-1800, Math.min(1800, h.vy)); s.vr = s.vx * .06;
      if (Math.hypot(s.vx, s.vy) > 250) react(s);
      bounds(s); go();
    };
    s.el.addEventListener('pointerup', drop);
    s.el.addEventListener('pointercancel', drop);
  });
}
