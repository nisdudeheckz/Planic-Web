// Pointer and touch reactions, and headings that rise out of their own lines.
// Loaded by story.js only when motion is on.

const TONE = { a: '#FF6B61', r: '#B8AEFF', m: '#F5C76B', k: '#9ED9B8' };

/* Wherever the pointer goes, something answers. On touch: a ripple where you tap. */
export function pointerLife(G) {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (!fine) {
    addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') return;
      const who = e.target.closest('[data-who]');
      const dot = document.createElement('i');
      dot.className = 'ripple';
      dot.style.left = `${e.clientX}px`;
      dot.style.top = `${e.clientY}px`;
      if (who) dot.style.setProperty('--cur', TONE[who.dataset.who]);
      document.body.append(dot);
      dot.addEventListener('animationend', () => dot.parentNode && dot.parentNode.removeChild(dot));
    }, { passive: true });
    return;
  }

  document.documentElement.classList.add('fine');
  const cur = $('.cursor');
  const label = $('.cursor__label');
  const ring = $('.cursor__ring');
  const dot = $('.cursor__dot');
  const xR = G.quickTo(ring, 'x', { duration: .45, ease: 'power3' });
  const yR = G.quickTo(ring, 'y', { duration: .45, ease: 'power3' });
  const xD = G.quickTo(dot, 'x', { duration: .08 });
  const yD = G.quickTo(dot, 'y', { duration: .08 });
  addEventListener('pointermove', (e) => {
    xR(e.clientX); yR(e.clientY); xD(e.clientX); yD(e.clientY);
    document.body.style.setProperty('--mx', `${e.clientX}px`);
    document.body.style.setProperty('--my', `${e.clientY}px`);
  }, { passive: true });
  addEventListener('pointerover', (e) => {
    const t = e.target;
    const ph = t.closest('.ph');
    const act = t.closest('a, button, label, input');
    const who = t.closest('[data-who]');
    cur.className = 'cursor';
    cur.style.removeProperty('--cur');
    if (who) cur.style.setProperty('--cur', TONE[who.dataset.who]);
    if (act) cur.classList.add('is-act');
    else if (ph && ph.dataset.label) { cur.classList.add('is-ph'); label.textContent = ph.dataset.label; }
    else if (who) cur.classList.add('is-who');
    else if (t.closest('h1, h2, p')) cur.classList.add('is-text');
  });
  document.addEventListener('pointerleave', () => G.to(cur, { autoAlpha: 0, duration: .2 }));
  document.addEventListener('pointerenter', () => G.to(cur, { autoAlpha: 1, duration: .2 }));

  // Buttons lean toward the pointer.
  $$('.btn, .nav__cta, .me, .reset').forEach((b) => {
    const bx = G.quickTo(b, 'x', { duration: .4, ease: 'power3' });
    const by = G.quickTo(b, 'y', { duration: .4, ease: 'power3' });
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      bx((e.clientX - r.left - r.width / 2) * .25);
      by((e.clientY - r.top - r.height / 2) * .35);
    });
    b.addEventListener('pointerleave', () => { bx(0); by(0); });
  });

  // Photos tilt toward the pointer, like picking up a print.
  $$('.card .ph, .opt .ph, .snap .ph, .b--photo .ph').forEach((ph) => {
    G.set(ph, { transformPerspective: 700 });
    const rx = G.quickTo(ph, 'rotationX', { duration: .5, ease: 'power3' });
    const ry = G.quickTo(ph, 'rotationY', { duration: .5, ease: 'power3' });
    ph.addEventListener('pointermove', (e) => {
      const r = ph.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - .5) * 10);
      rx(-((e.clientY - r.top) / r.height - .5) * 8);
    });
    ph.addEventListener('pointerleave', () => { rx(0); ry(0); });
  });
}

/* Chapter headings: each word drops in under gravity and lands as the chapter arrives. */
export function splitHeads(G) {
  const heads = [...document.querySelectorAll('main h2:not(.plan__title), .film__line')];
  heads.forEach((h) => {
    const walk = (node) => {
      for (const n of [...node.childNodes]) {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(part); return; }
            const outer = document.createElement('span');
            outer.className = 'split';
            const inner = document.createElement('span');
            inner.textContent = part;
            outer.append(inner);
            frag.append(outer);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      }
    };
    walk(h);
    // the pinned weigh timeline and the scrubbed night line bring their own headings in
    if (h.closest('.ch--weigh') || h.classList.contains('night__title')) return;
    G.from([...h.querySelectorAll('.split > span')], {
      yPercent: -160, rotation: () => G.utils.random(-14, 14), opacity: 0, duration: 1.1, ease: 'bounce.out',
      stagger: { each: .07, from: 'random' },
      scrollTrigger: { trigger: h, start: 'top 85%', toggleActions: 'play none none reverse' },
    });
  });
}
