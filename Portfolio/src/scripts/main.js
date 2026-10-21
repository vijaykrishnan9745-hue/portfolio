import Lenis from 'lenis';
import { initWaves } from './waves.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover)').matches;

/* Smooth scroll */
let lenis = null;
if (!reduce) {
  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.95 });
  const loop = (t) => { lenis.raf(t); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
}
$$('a[href*="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const u = new URL(a.href, location.href);
    if (u.pathname !== location.pathname) return;
    const target = u.hash && $(u.hash);
    if (!target) return;
    e.preventDefault();
    lenis ? lenis.scrollTo(target, { offset: u.hash === '#top' ? 0 : -20, duration: 1.4 }) : target.scrollIntoView();
    history.replaceState(null, '', u.hash);
  });
});

/* Theme */
$('#theme')?.addEventListener('click', () => {
  const root = document.documentElement;
  const next = root.dataset.theme === 'light' ? 'dark' : 'light';
  root.dataset.theme = next;
  try { localStorage.setItem('portfolio.theme', next); } catch (_) {}
});

/* Header: glass after scroll, tucks away when scrolling down */
const hd = $('#hd');
let lastY = 0;
addEventListener('scroll', () => {
  const y = scrollY;
  hd.classList.toggle('is-scrolled', y > 40);
  hd.classList.toggle('is-hidden', y > 500 && y > lastY + 4);
  if (y < lastY - 4) hd.classList.remove('is-hidden');
  lastY = y;
}, { passive: true });

/* Active nav link */
const links = $$('.hd__nav a');
const secs = ['works', 'about', 'contacts'].map((id) => document.getElementById(id));
if (secs.every(Boolean)) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      links.forEach((l) => l.classList.toggle('is-active', l.hash === `#${en.target.id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  secs.forEach((s) => io.observe(s));
}

/* Reveals */
const revealIO = new IntersectionObserver((entries) => {
  entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); revealIO.unobserve(en.target); } });
}, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
$$('.reveal, [data-case]').forEach((el) => revealIO.observe(el));

/* Pointer glow, cursor label, magnetic buttons */
const label = $('.cursor-label');
const pos = { x: 0, y: 0, tx: 0, ty: 0 };
if (fine) {
  addEventListener('pointermove', (e) => {
    pos.tx = e.clientX; pos.ty = e.clientY;
    document.documentElement.style.setProperty('--mx', `${e.clientX}px`);
    document.documentElement.style.setProperty('--my', `${e.clientY}px`);
  }, { passive: true });
  (function tick() {
    pos.x += (pos.tx - pos.x) * 0.2; pos.y += (pos.ty - pos.y) * 0.2;
    label.style.setProperty('--cx', `${pos.x}px`);
    label.style.setProperty('--cy', `${pos.y}px`);
    requestAnimationFrame(tick);
  })();
  $$('[data-cursor]').forEach((el) => {
    el.addEventListener('pointerenter', () => { label.textContent = el.dataset.cursor; label.classList.add('is-on'); });
    el.addEventListener('pointerleave', () => label.classList.remove('is-on'));
  });
  $$('[data-magnet]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transition = 'transform 0.6s cubic-bezier(.22,1,.36,1)'; el.style.transform = ''; setTimeout(() => (el.style.transition = ''), 600); });
  });
}

/* Hero + closing canvases */
const sphere = $('#sphere');
if (sphere) import('./sphere3d.js').then((m) => m.initSphere3d(sphere));

/* Hero headline: letters lift and glow near the cursor, halves part as you scroll */
const heroEl = $('.hero');
const chars = $$('.hero__title .ch');
if (heroEl && chars.length) {
  setTimeout(() => heroEl.classList.add('intro-done'), 2400);
  const pts = chars.map(() => ({ f: 0, cx: 0, cy: 0 }));
  const measure = () => chars.forEach((c, i) => {
    const r = c.getBoundingClientRect();
    pts[i].cx = r.left + r.width / 2 + scrollX; pts[i].cy = r.top + r.height / 2 + scrollY;
  });
  const m = { x: -9999, y: -9999, on: false };
  addEventListener('resize', measure);
  setTimeout(measure, 2200);
  addEventListener('pointermove', (e) => { m.x = e.clientX + scrollX; m.y = e.clientY + scrollY; m.on = true; }, { passive: true });
  let heroVisible = true;
  new IntersectionObserver(([e]) => (heroVisible = e.isIntersecting)).observe(heroEl);
  if (fine && !reduce) (function tick() {
    if (heroVisible && m.on) {
      chars.forEach((c, i) => {
        const p = pts[i];
        const d = Math.hypot(m.x - p.cx, (m.y - p.cy) * 1.3);
        const t = Math.max(0, 1 - d / 190) ** 2;
        p.f += (t - p.f) * 0.14;
        if (Math.abs(p.f - (+c.dataset.f || 0)) > 0.004) { c.style.setProperty('--f', p.f.toFixed(3)); c.dataset.f = p.f; }
      });
    }
    requestAnimationFrame(tick);
  })();
  addEventListener('scroll', () => heroEl.style.setProperty('--ts', Math.min(1, scrollY / (innerHeight * 0.7)).toFixed(3)), { passive: true });
}
$$('[data-waves]').forEach((el) => initWaves(el, el.dataset.waves === 'hero' ? { lines: 26, alpha: 0.09, amp: 30 } : { lines: 38, alpha: 0.2, amp: 42 }));

/* Timeline progress */
const tl = $('#tl');
if (tl) {
  const items = $$('.tl__item', tl);
  const update = () => {
    const r = tl.getBoundingClientRect();
    const line = innerHeight * 0.62;
    const p = Math.min(1, Math.max(0, (line - r.top) / r.height));
    tl.style.setProperty('--p', p.toFixed(3));
    items.forEach((it) => it.classList.toggle('is-on', it.getBoundingClientRect().top < line));
  };
  addEventListener('scroll', update, { passive: true });
  update();
}

/* Photo carousel dots */
const car = $('#carousel');
if (car) {
  const vp = $('.carousel__vp', car), dots = $$('.carousel__dot', car);
  vp.addEventListener('scroll', () => {
    const i = Math.round(vp.scrollLeft / vp.clientWidth);
    dots.forEach((d, n) => d.classList.toggle('is-active', n === i));
  }, { passive: true });
  dots.forEach((d, n) => d.addEventListener('click', () => vp.scrollTo({ left: n * vp.clientWidth, behavior: 'smooth' })));
}

/* Lightbox: works on a list of images, with previous / next */
const lb = $('#lightbox'), lbImg = $('#lb-img'), lbCap = $('#lb-cap'), lbCount = $('#lb-count');
let lbList = [], lbIdx = 0;
function showLb() {
  const it = lbList[lbIdx];
  lbImg.src = it.src; lbImg.alt = it.cap || ''; lbCap.textContent = it.cap || '';
  const many = lbList.length > 1;
  lbCount.textContent = many ? `${lbIdx + 1} / ${lbList.length}` : '';
  $('#lb-prev').hidden = $('#lb-next').hidden = !many;
}
function openLb(list, i) { lbList = list; lbIdx = i; showLb(); lb.classList.add('is-open'); lenis?.stop(); $('#lb-close').focus(); }
function stepLb(n) { if (lbList.length > 1) { lbIdx = (lbIdx + n + lbList.length) % lbList.length; showLb(); } }
function closeLb() { lb.classList.remove('is-open'); lenis?.start(); }
$('#lb-close')?.addEventListener('click', closeLb);
$('#lb-prev')?.addEventListener('click', () => stepLb(-1));
$('#lb-next')?.addEventListener('click', () => stepLb(1));
lb?.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });
addEventListener('keydown', (e) => {
  if (!lb?.classList.contains('is-open')) return;
  if (e.key === 'Escape') closeLb();
  if (e.key === 'ArrowLeft') stepLb(-1);
  if (e.key === 'ArrowRight') stepLb(1);
});
const shots = $$('[data-lb]');
const shotList = shots.map((b) => ({ src: b.dataset.src, cap: b.dataset.cap }));
shots.forEach((b, i) => b.addEventListener('click', () => openLb(shotList, i)));

/* Case study: contents list follows the section in view, sliders have arrows */
const tocLinks = $$('#toc a');
if (tocLinks.length) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) tocLinks.forEach((l) => l.classList.toggle('is-active', l.hash === `#${en.target.id}`));
    });
  }, { rootMargin: '-35% 0px -60% 0px' });
  $$('[data-sec]').forEach((sec) => io.observe(sec));
}
$$('[data-slider]').forEach((sl) => {
  const track = $('.slider__track', sl), prev = $('[data-prev]', sl), next = $('[data-next]', sl);
  const step = () => (track.firstElementChild?.getBoundingClientRect().width || 300) + 16;
  const sync = () => { prev.disabled = track.scrollLeft < 4; next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4; };
  prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
  next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
  track.addEventListener('scroll', sync, { passive: true });
  sync();
});

/* Design garden: scatter, drag with a little inertia, click to enlarge */
const board = $('#board');
if (board) {
  const cards = $$('.gcard', board);
  const gardenList = cards.map((c) => ({ src: c.dataset.src, cap: c.dataset.alt }));
  const state = cards.map(() => ({ x: 0, y: 0, r: 0, vx: 0, vy: 0 }));
  let z = 1;
  const bounds = () => ({ w: board.clientWidth, h: board.clientHeight });
  const paint = (i) => { cards[i].style.transform = `translate3d(${state[i].x}px, ${state[i].y}px, 0) rotate(${state[i].r}deg)`; };
  function scatter() {
    const { w, h } = bounds();
    const cw = cards[0].offsetWidth, ch = cards[0].offsetHeight;
    const cols = w < 640 ? 2 : 4, rows = Math.ceil(cards.length / cols);
    cards.forEach((c, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const jx = Math.sin(i * 12.9898) * 0.5 + 0.5, jy = Math.sin(i * 78.233) * 0.5 + 0.5;
      state[i].x = Math.max(8, Math.min(w - cw - 8, (w - cw) * ((col + 0.15 + jx * 0.7) / cols)));
      state[i].y = Math.max(8, Math.min(h - ch - 8, (h - ch) * ((row + 0.1 + jy * 0.8) / rows)));
      state[i].r = (jx - 0.5) * 14;
      c.style.zIndex = i + 1;
      paint(i);
    });
    z = cards.length + 1;
  }
  let lastW = 0;
  new ResizeObserver(() => { if (board.clientWidth !== lastW) { lastW = board.clientWidth; scatter(); } }).observe(board);

  cards.forEach((c, i) => {
    let sx, sy, ox, oy, moved, lt, down = false;
    c.addEventListener('pointerdown', (e) => {
      down = true; moved = 0; sx = e.clientX; sy = e.clientY; ox = state[i].x; oy = state[i].y; lt = performance.now();
      state[i].vx = state[i].vy = 0; c.style.zIndex = ++z; c.classList.add('is-drag'); c.setPointerCapture(e.pointerId);
    });
    c.addEventListener('pointermove', (e) => {
      if (!down) return;
      const { w, h } = bounds();
      const nx = Math.max(0, Math.min(w - c.offsetWidth, ox + e.clientX - sx));
      const ny = Math.max(0, Math.min(h - c.offsetHeight, oy + e.clientY - sy));
      const now = performance.now(), dt = Math.max(now - lt, 8); lt = now;
      state[i].vx = ((nx - state[i].x) / dt) * 16; state[i].vy = ((ny - state[i].y) / dt) * 16;
      state[i].x = nx; state[i].y = ny; moved = Math.max(moved, Math.hypot(e.clientX - sx, e.clientY - sy));
      paint(i);
    });
    const end = () => {
      if (!down) return; down = false; c.classList.remove('is-drag');
      if (moved < 6) { openLb(gardenList, i); return; }
      const s = state[i];
      (function glide() {
        const { w, h } = bounds();
        s.x += s.vx; s.y += s.vy; s.vx *= 0.92; s.vy *= 0.92;
        if (s.x < 0 || s.x > w - c.offsetWidth) { s.vx *= -0.5; s.x = Math.max(0, Math.min(w - c.offsetWidth, s.x)); }
        if (s.y < 0 || s.y > h - c.offsetHeight) { s.vy *= -0.5; s.y = Math.max(0, Math.min(h - c.offsetHeight, s.y)); }
        paint(i);
        if (!down && Math.hypot(s.vx, s.vy) > 0.2) requestAnimationFrame(glide);
      })();
    };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);
    c.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLb(gardenList, i); } });
  });
}

/* Copy email */
const mail = $('#copy-email');
mail?.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(mail.dataset.email); } catch (_) { location.href = `mailto:${mail.dataset.email}`; return; }
  mail.classList.add('is-copied');
  setTimeout(() => mail.classList.remove('is-copied'), 1800);
});

const yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();
