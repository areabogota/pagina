(async () => {
  const root = document.getElementById("carrusel");
  if (!root) return;

  let grupos = GRUPOS;
  try {
    const rows = await fetchSheet(CONFIG.TAB_CARRUSEL);
    const fromSheet = rows.filter(r => safeUrl(r.imagen)).map(r => ({ nombre: r.nombre, imagen: r.imagen }));
    if (fromSheet.length) grupos = fromSheet;
  } catch { /* usa la lista de config.js */ }
  grupos = grupos.filter(g => safeUrl(g.imagen));
  if (!grupos.length) { root.hidden = true; return; }

  const track = root.querySelector(".car-track");
  const dots = root.querySelector(".car-dots");
  track.innerHTML = grupos.map((g, i) => `<figure class="car-slide">
      <div class="car-bg" style="background-image:url('${safeUrl(g.imagen)}')"></div>
      <img src="${safeUrl(g.imagen)}" alt="${esc(g.nombre)}" ${i ? 'loading="lazy"' : ""}>
      <figcaption>${esc(g.nombre)}</figcaption>
    </figure>`).join("");
  dots.innerHTML = grupos.map((g, i) => `<button type="button" aria-label="Ir a ${esc(g.nombre)}"></button>`).join("");

  const slides = [...track.children];
  const btns = [...dots.children];
  const ms = Math.max(1, Number(CONFIG.CARRUSEL_SEGUNDOS) || 2) * 1000;
  document.documentElement.style.setProperty("--car-ms", ms + "ms");
  let cur = 0, timer;

  function go(n) {
    cur = (n + slides.length) % slides.length;
    slides.forEach((s, i) => s.classList.toggle("active", i === cur));
    btns.forEach((b, i) => b.classList.toggle("active", i === cur));
  }
  const start = () => { stop(); if (slides.length > 1) timer = setInterval(() => go(cur + 1), ms); };
  const stop = () => clearInterval(timer);

  root.querySelector(".car-prev").addEventListener("click", () => { go(cur - 1); start(); });
  root.querySelector(".car-next").addEventListener("click", () => { go(cur + 1); start(); });
  btns.forEach((b, i) => b.addEventListener("click", () => { go(i); start(); }));
  root.addEventListener("mouseenter", stop);
  root.addEventListener("mouseleave", start);
  root.addEventListener("touchstart", e => { root._x = e.touches[0].clientX; }, { passive: true });
  root.addEventListener("touchend", e => {
    const d = e.changedTouches[0].clientX - root._x;
    if (Math.abs(d) > 40) { go(cur + (d < 0 ? 1 : -1)); start(); }
  });
  document.addEventListener("visibilitychange", () => document.hidden ? stop() : start());

  go(0);
  start();
})();
