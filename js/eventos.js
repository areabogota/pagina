// Columnas esperadas en la pestaña "Eventos": Fecha inicio, Fecha fin, Nombre, Mensaje, Flyer, Direccion, Contacto, Grupo
let eventosTimer;
const parseDMY = s => { const m = String(s || "").match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null; };

window.cargarEventos = async () => {
  const box = document.getElementById("lista");
  clearInterval(eventosTimer);
  try {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    // Solo eventos que no han terminado, ordenados por fecha de inicio
    const eventos = (await fetchSheet(CONFIG.TAB_EVENTOS, false, () => window.cargarEventos()))
      .filter(e => e.nombre)
      .filter(e => { const f = parseDMY(e["fecha fin"]) || parseDMY(e["fecha inicio"]); return !f || f >= hoy; })
      .sort((a, b) => (parseDMY(a["fecha inicio"]) || 0) - (parseDMY(b["fecha inicio"]) || 0));
    if (!eventos.length) { box.innerHTML = '<p class="status">No hay eventos próximos.</p>'; return; }

    const imgUrl = e => {
      const id = String(e.flyer || "").match(/[?&]id=([\w-]+)|\/d\/([\w-]+)/);
      return id ? `https://lh3.googleusercontent.com/d/${id[1] || id[2]}=w1000` : safeUrl(e.flyer);
    };
    const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
    const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    const larga = s => { const d = parseDMY(s); return d ? `${DIAS[d.getDay()]}, ${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}` : String(s || ""); };
    const fechas = e => {
      const ini = e["fecha inicio"] || "", fin = e["fecha fin"] || "";
      return ini ? larga(ini) + (fin && fin !== ini ? " al " + larga(fin) : "") : "";
    };

    // Mismo carrusel (clases car-*) que el de inicio
    box.innerHTML = `<section class="carousel" style="padding:0" aria-label="Eventos">
      <div class="car-frame">
        <div class="car-track">${eventos.map((e, i) => {
          const src = imgUrl(e);
          return `<figure class="car-slide">
            ${src ? `<div class="car-bg" style="background-image:url('${src}')"></div><img src="${src}" referrerpolicy="no-referrer" alt="Flyer de ${esc(e.nombre)}" ${i ? 'loading="lazy"' : ""}>` : ""}
            <figcaption>${esc(e.nombre)}</figcaption>
          </figure>`;
        }).join("")}</div>
        ${eventos.length > 1 ? '<button type="button" class="car-arrow car-prev" aria-label="Anterior">&#10094;</button><button type="button" class="car-arrow car-next" aria-label="Siguiente">&#10095;</button>' : ""}
        <div class="car-dots">${eventos.length > 1 ? eventos.map((e, i) => `<button type="button" aria-label="Ir a ${esc(e.nombre)}"></button>`).join("") : ""}</div>
      </div>
    </section>
    <div class="ev-detalle" aria-live="polite"></div>`;

    const slides = [...box.querySelectorAll(".car-slide")];
    const btns = [...box.querySelectorAll(".car-dots button")];
    const detalle = box.querySelector(".ev-detalle");
    const ms = 6000;
    document.documentElement.style.setProperty("--car-ms", ms + "ms");
    let cur = 0;

    function go(n) {
      cur = (n + slides.length) % slides.length;
      slides.forEach((s, i) => s.classList.toggle("active", i === cur));
      btns.forEach((b, i) => b.classList.toggle("active", i === cur));
      const e = eventos[cur];
      const tel = String(e.contacto || "").replace(/[^\d+]/g, "");
      detalle.innerHTML = `${fechas(e) ? `<span class="tag">${esc(fechas(e))}</span>` : ""}
        ${e.mensaje ? `<p>${esc(e.mensaje)}</p>` : ""}
        ${e.direccion ? `<p>📍 ${esc(e.direccion)}</p>` : ""}
        ${e.contacto ? `<p>📞 <a href="tel:${esc(tel)}">${esc(e.contacto)}</a></p>` : ""}`;
    }
    const stop = () => clearInterval(eventosTimer);
    const start = () => { stop(); if (slides.length > 1) eventosTimer = setInterval(() => go(cur + 1), ms); };

    box.querySelector(".car-prev")?.addEventListener("click", () => { go(cur - 1); start(); });
    box.querySelector(".car-next")?.addEventListener("click", () => { go(cur + 1); start(); });
    btns.forEach((b, i) => b.addEventListener("click", () => { go(i); start(); }));
    const frame = box.querySelector(".car-frame");
    frame.addEventListener("mouseenter", stop);
    frame.addEventListener("mouseleave", start);
    frame.addEventListener("touchstart", e => { frame._x = e.touches[0].clientX; }, { passive: true });
    frame.addEventListener("touchend", e => {
      const d = e.changedTouches[0].clientX - frame._x;
      if (Math.abs(d) > 40) { go(cur + (d < 0 ? 1 : -1)); start(); }
    });
    go(0);
    start();
  } catch (e) {
    box.innerHTML = `<p class="status error">No se pudieron cargar los eventos. ${esc(e.message)}</p>`;
  }
};
window.cargarEventos();