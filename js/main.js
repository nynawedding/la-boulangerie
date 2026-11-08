// La Boulangerie — interactions & effets
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- Navigation ---------- */
  const nav = $('#nav');
  const toggle = $('.nav__toggle', nav);
  const progress = $('.progress');
  const toTop = $('.to-top');
  let lastY = window.scrollY;

  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    // iPhone : on ignore le rebond (scrollY négatif ou au-delà du bas de page)
    const y = Math.min(Math.max(window.scrollY, 0), Math.max(max, 0));
    nav.classList.toggle('is-solid', y > 40 || document.body.classList.contains('page-plain'));
    const dy = y - lastY;
    if (nav.classList.contains('is-open')) {
      lastY = y;
    } else if (Math.abs(dy) > 10) {
      // seuil de 10 px : la barre d'adresse mobile qui se replie ne fait plus clignoter le menu
      nav.classList.toggle('is-hidden', dy > 0 && y > 400);
      lastY = y;
    }
    if (y <= 400) nav.classList.remove('is-hidden');
    if (progress) progress.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    if (toTop) toTop.classList.toggle('is-visible', y > 700);
  };
  onScroll();
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  const closeMenu = () => {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Ouvrir le menu');
    document.body.style.overflow = '';
  };
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    document.body.style.overflow = open ? 'hidden' : '';
  });
  $$('.sub-toggle').forEach(btn => btn.addEventListener('click', () => {
    const li = btn.parentElement;
    const open = !li.classList.contains('is-open');
    $$('.has-sub.is-open').forEach(o => { if (o !== li) { o.classList.remove('is-open'); $('.sub-toggle', o).setAttribute('aria-expanded', 'false'); } });
    li.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', open);
  }));
  document.addEventListener('click', e => {
    if (!e.target.closest('.has-sub')) $$('.has-sub.is-open').forEach(o => { o.classList.remove('is-open'); $('.sub-toggle', o).setAttribute('aria-expanded', 'false'); });
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeMenu(); $$('.has-sub.is-open').forEach(o => o.classList.remove('is-open')); } });

  /* ---------- Page transitions ---------- */
  const curtain = $('.curtain');
  if (curtain && !reduce) {
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('tel:') || href.startsWith('mailto:') || /^https?:/.test(href)) return;
      if (a.pathname === location.pathname && a.hash) return;
      e.preventDefault();
      curtain.classList.add('is-leaving');
      setTimeout(() => { location.href = a.href; }, 520);
    });
    addEventListener('pageshow', e => { if (e.persisted) curtain.classList.remove('is-leaving'); });
  }

  /* ---------- Split text ---------- */
  $$('.split').forEach(el => {
    const chars = el.classList.contains('script');
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/([ \t\n]+)/).forEach(part => {
            if (!part) return;
            if (/^[ \t\n]+$/.test(part)) { frag.append(document.createTextNode(' ')); return; }
            if (chars) {
              const w = document.createElement('span'); w.style.whiteSpace = 'nowrap'; w.style.display = 'inline-block';
              [...part].forEach(ch => { const c = document.createElement('span'); c.className = 'c'; c.style.setProperty('--i', i++); c.textContent = ch; w.append(c); });
              frag.append(w);
            } else {
              const w = document.createElement('span'); w.className = 'w';
              const s = document.createElement('span'); s.style.setProperty('--i', i++); s.textContent = part;
              w.append(s); frag.append(w);
            }
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'SUP') walk(n);
      });
    };
    el.setAttribute('aria-label', el.textContent.trim());
    walk(el);
    [...el.children].forEach(c => c.setAttribute('aria-hidden', 'true'));
  });

  /* ---------- Reveal on scroll ---------- */
  const reveals = $$('.reveal, .reveal-img');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    reveals.forEach(el => io.observe(el));
  } else reveals.forEach(el => el.classList.add('is-visible'));

  /* ---------- Counters ---------- */
  const counters = $$('[data-count]');
  if (counters.length && 'IntersectionObserver' in window && !reduce) {
    const co = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, end = +el.dataset.count, start = end > 1000 ? end - 40 : 0, t0 = performance.now(), dur = 1600;
      const tick = t => {
        const k = Math.min(1, (t - t0) / dur), v = Math.round(start + (end - start) * (1 - Math.pow(1 - k, 3)));
        el.textContent = v; if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick); co.unobserve(el);
    }), { threshold: 0.6 });
    counters.forEach(c => co.observe(c));
  }

  /* ---------- Parallax ---------- */
  const para = $$('[data-parallax]');
  if (para.length && !reduce) {
    let ticking = false;
    const run = () => {
      para.forEach(el => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        const limit = Math.max(0, (el.offsetHeight - r.height) / 2);
        let shift = (r.top + r.height / 2 - innerHeight / 2) * -parseFloat(el.dataset.parallax);
        shift = Math.max(-limit, Math.min(limit, shift));
        el.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0)`;
      });
      ticking = false;
    };
    addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(run); ticking = true; } }, { passive: true });
    run();
  }

  /* ---------- Hero slideshow ---------- */
  const slides = $$('.hero__slide');
  if (slides.length > 1 && !reduce) {
    let cur = 0;
    setInterval(() => {
      slides[cur].classList.remove('is-active');
      cur = (cur + 1) % slides.length;
      slides[cur].classList.add('is-active');
    }, 6500);
  }

  /* ---------- Magnetic buttons & tilt (desktop) ---------- */
  if (fine && !reduce) {
    $$('.magnetic').forEach(b => {
      b.addEventListener('mousemove', e => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px, ${(e.clientY - r.top - r.height / 2) * .3}px)`;
      });
      b.addEventListener('mouseleave', () => { b.style.transform = ''; });
    });
    $$('.card, .pcard, .univers').forEach(c => {
      c.addEventListener('mousemove', e => {
        const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        c.style.transform = `perspective(900px) rotateY(${x * 5}deg) rotateX(${-y * 5}deg)`;
      });
      c.addEventListener('mouseleave', () => { c.style.transform = ''; });
    });
  }

  /* ---------- Filters (pâtisseries) ---------- */
  const filters = $$('.filter');
  filters.forEach(f => f.addEventListener('click', () => {
    filters.forEach(x => { x.classList.toggle('is-active', x === f); x.setAttribute('aria-pressed', x === f); });
    const cat = f.dataset.filter;
    $$('.pcard').forEach(p => {
      const show = cat === 'all' || p.dataset.cat === cat;
      p.classList.toggle('is-hidden', !show);
      p.classList.remove('is-filtering');
      if (show) { void p.offsetWidth; p.classList.add('is-filtering', 'is-visible'); }
    });
  }));

  /* ---------- Lightbox ---------- */
  const box = $('#lightbox');
  if (box && box.showModal) {
    const img = $('img', box), cap = $('.lightbox__caption', box);
    let list = [], idx = 0;
    const show = i => {
      idx = (i + list.length) % list.length;
      const b = list[idx], thumb = $('img', b);
      img.style.animation = 'none'; void img.offsetWidth; img.style.animation = '';
      img.src = b.dataset.full; img.alt = thumb ? thumb.alt : '';
      cap.textContent = b.dataset.caption || '';
    };
    $$('[data-full]').forEach(b => b.addEventListener('click', () => {
      list = $$('[data-full]').filter(x => !x.closest('.is-hidden'));
      show(list.indexOf(b)); box.showModal();
    }));
    $('.lightbox__close', box).addEventListener('click', () => box.close());
    $('.lightbox__prev', box).addEventListener('click', () => show(idx - 1));
    $('.lightbox__next', box).addEventListener('click', () => show(idx + 1));
    box.addEventListener('click', e => { if (e.target === box) box.close(); });
    box.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') show(idx - 1); if (e.key === 'ArrowRight') show(idx + 1); });
    let sx = null;
    box.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', e => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1)); sx = null; });
  }

  $$('[data-year]').forEach(y => { y.textContent = new Date().getFullYear(); });
})();
