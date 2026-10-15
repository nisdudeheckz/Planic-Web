// Planic landing — small progressive enhancements. Everything works without JS.
(() => {
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.nav__toggle');

  // Sticky nav border once the page scrolls
  const onScroll = () => nav && nav.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile menu
  if (toggle && nav) {
    const setOpen = (open) => {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
    nav.querySelectorAll('.nav__links a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => e.key === 'Escape' && setOpen(false));
  }

  // Reveal sections as they enter the viewport
  const items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });
    items.forEach((el) => io.observe(el));
  } else {
    items.forEach((el) => el.classList.add('in'));
  }

  // Hero story: many signals → one plan. The markup is the finished state; with motion
  // allowed it plays once, when it comes into view. The step buttons switch states directly.
  const story = document.querySelector('.story');
  if (story) {
    const steps = story.querySelectorAll('[data-go]');
    const replay = document.querySelector('.story__replay');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sequence = [[60, 'heard'], [2100, 'weighed'], [5000, 'planned']];
    let timers = [];
    let seen = null;

    const stop = () => { timers.forEach(clearTimeout); timers = []; };
    const setPhase = (phase) => {
      story.dataset.phase = phase;
      steps.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.go === phase)));
    };
    const play = () => {
      stop();
      story.classList.remove('is-manual');
      story.classList.add('is-resetting');
      setPhase('pre');
      void story.offsetWidth; // commit the reset before transitions come back
      story.classList.remove('is-resetting');
      sequence.forEach(([t, phase]) => timers.push(setTimeout(() => setPhase(phase), t)));
    };

    steps.forEach((b) => b.addEventListener('click', () => {
      stop();
      if (seen) seen.disconnect(); // the visitor took over; don't autoplay later
      story.classList.add('is-manual');
      setPhase(b.dataset.go);
    }));

    if (!reduce.matches) {
      if (replay) { replay.hidden = false; replay.addEventListener('click', play); }
      setPhase('pre');
      if ('IntersectionObserver' in window) {
        seen = new IntersectionObserver((entries) => {
          if (!entries.some((e) => e.isIntersecting)) return;
          seen.disconnect();
          play();
        }, { threshold: 0.35 });
        seen.observe(story);
      } else {
        play();
      }
    }
  }

  // The preview rail is a keyboard stop only while it actually scrolls (narrow screens)
  const rail = document.querySelector('.rail');
  if (rail) {
    const syncRail = () => {
      if (rail.scrollWidth > rail.clientWidth + 1) rail.setAttribute('tabindex', '0');
      else rail.removeAttribute('tabindex');
    };
    syncRail();
    window.addEventListener('resize', syncRail, { passive: true });
  }

  // Footer year
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  // Netlify Forms via AJAX: urlencoded POST to a static page (forms are detected at deploy)
  const encode = (form) => new URLSearchParams(new FormData(form)).toString();
  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

  document.querySelectorAll('form[data-netlify]').forEach((form) => {
    const done = form.parentElement.querySelector('[role="status"]');
    const error = form.querySelector('[role="alert"]');
    const email = form.querySelector('input[type="email"]');
    const button = form.querySelector('button[type="submit"]');

    const showError = (msg) => {
      form.classList.add('is-invalid');
      if (error) { error.textContent = msg; error.hidden = false; }
    };

    email && email.addEventListener('input', () => {
      form.classList.remove('is-invalid');
      if (error) error.hidden = true;
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (email && !isEmail(email.value.trim())) {
        showError('Please enter a valid email address.');
        email.focus();
        return;
      }
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      form.classList.add('is-loading');
      if (button) button.disabled = true;
      try {
        const res = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: encode(form),
        });
        if (!res.ok) throw new Error(String(res.status));
        form.hidden = true;
        if (done) { done.hidden = false; done.focus?.(); }
      } catch {
        showError('Something went wrong. Please try again in a moment.');
      } finally {
        form.classList.remove('is-loading');
        if (button) button.disabled = false;
      }
    });
  });
})();
