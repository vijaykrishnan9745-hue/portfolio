// Field of flowing lines. The pointer bends them; they pause when off screen.
export function initWaves(el, { lines = 34, alpha = 0.16, amp = 38 } = {}) {
  const canvas = el.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-color-scheme: no-preference) and (prefers-reduced-motion: reduce)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w = 0, h = 0, dpr = 1, visible = true, raf = 0;
  const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999 };

  function resize() {
    const r = el.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function frame(t) {
    ctx.clearRect(0, 0, w, h);
    mouse.x += (mouse.tx - mouse.x) * 0.08;
    mouse.y += (mouse.ty - mouse.y) * 0.08;
    const time = t * 0.00035;
    const step = Math.max(10, w / 120);
    for (let i = 0; i < lines; i++) {
      const k = i / (lines - 1);
      const base = h * (0.08 + k * 0.92);
      ctx.beginPath();
      for (let x = 0; x <= w + step; x += step) {
        let y = base
          + Math.sin(x * 0.0042 + time * 2 + i * 0.22) * amp * (0.4 + k)
          + Math.sin(x * 0.0091 - time * 3 + i * 0.5) * amp * 0.35;
        const dx = x - mouse.x, dy = base - mouse.y;
        const d = Math.hypot(dx, dy);
        if (d < 220) y += (1 - d / 220) ** 2 * -60 * Math.sign(dy || 1);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(170,195,255,${alpha * (0.35 + k * 0.9)})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    if (visible && !reduce) raf = requestAnimationFrame(frame);
  }

  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    cancelAnimationFrame(raf);
    if (visible) raf = requestAnimationFrame(frame);
  }).observe(el);
  addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    mouse.tx = e.clientX - r.left; mouse.ty = e.clientY - r.top;
  }, { passive: true });
  new ResizeObserver(resize).observe(el);
  resize();
  requestAnimationFrame(frame);
}
