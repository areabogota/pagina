// Partículas conectadas (efecto constelación) que reaccionan al mouse.
(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const mouse = { x: -999, y: -999 };
  addEventListener("pointermove", e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });

  const hexRgb = hex => { const n = parseInt(hex.slice(1), 16); return [n >> 16, n >> 8 & 255, n & 255]; };

  function crear(canvas, { densidad, colores, linea, rect, max, dist, alphaP }) {
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const rgb = colores.map(hexRgb);
    const lineRgb = hexRgb(linea);
    let w, h, ps = [];

    function resize() {
      const b = canvas.parentElement.getBoundingClientRect();
      w = rect ? b.width : innerWidth;
      h = rect ? b.height : innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(Math.round(w * h / densidad), max);
      ps = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - .5) * .5, vy: (Math.random() - .5) * .5,
        r: 1.5 + Math.random() * 2.5,
        c: rgb[Math.floor(Math.random() * rgb.length)]
      }));
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      const o = rect ? canvas.getBoundingClientRect() : { left: 0, top: 0 };
      const mx = mouse.x - o.left, my = mouse.y - o.top;
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        // el cursor atrae suavemente las partículas cercanas
        const dx = mx - p.x, dy = my - p.y, d = Math.hypot(dx, dy);
        if (d < 140 && d > 1) { p.x += dx / d * .6; p.y += dy / d * .6; }
        for (let j = i + 1; j < ps.length; j++) {
          const q = ps[j], l = Math.hypot(p.x - q.x, p.y - q.y);
          if (l < dist) {
            ctx.strokeStyle = `rgba(${lineRgb},${(1 - l / dist) * alphaP * .6})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
        if (d < 140) {
          ctx.strokeStyle = `rgba(${lineRgb},${(1 - d / 140) * alphaP})`;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mx, my); ctx.stroke();
        }
        ctx.fillStyle = `rgba(${p.c},${alphaP})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
    }

    resize();
    addEventListener("resize", resize);
    return frame;
  }

  const frames = [];
  function montar(parent, cls, opts) {
    const c = document.createElement("canvas");
    c.className = cls;
    c.setAttribute("aria-hidden", "true");
    parent.prepend(c);
    frames.push(crear(c, opts));
  }

  document.addEventListener("DOMContentLoaded", () => {
    montar(document.body, "bubbles-bg", {
      densidad: 22000, max: 70, dist: 130, rect: false, alphaP: .3,
      colores: ["#1f3d85", "#1C76BF", "#7256A6", "#FD8775", "#B39FD5"], linea: "#1C76BF"
    });
    const hero = document.querySelector(".hero");
    if (hero) montar(hero, "bubbles-hero", {
      densidad: 7000, max: 80, dist: 120, rect: true, alphaP: .4,
      colores: ["#FFFFFF", "#FADA88", "#B39FD5", "#FD8775"], linea: "#FFFFFF"
    });

    let raf;
    const loop = () => { frames.forEach(f => f()); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    document.addEventListener("visibilitychange", () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(loop);
    });
  });
})();
