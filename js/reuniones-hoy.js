// Tarjeta "Reuniones" del inicio: fecha y hora actuales, reuniones abiertas ahora y próximas a abrir hoy
(() => {
  const box = document.getElementById("reuniones-hoy");
  if (!box) return;
  const DIAS = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
  const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const LEMA = "Para que ningún adicto, dondequiera que esté, tenga que morir a causa de los horrores de la adicción.";
  let filas = null;

  // "18:00", "6:00:00 PM" o "Date(1899,11,30,18,0,0)" -> minutos desde medianoche
  function minutos(v) {
    const s = String(v || "").trim();
    if (!s) return null;
    const d = s.match(/^Date\(\d+,\d+,\d+,(\d+),(\d+)/i);
    if (d) return +d[1] * 60 + +d[2];
    const t = s.match(/^(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*([ap])?\.?\s*m?\.?$/i);
    if (!t) return null;
    let h = +t[1];
    const p = (t[3] || "").toLowerCase();
    if (p === "p" && h < 12) h += 12;
    if (p === "a" && h === 12) h = 0;
    return h > 23 ? null : h * 60 + +(t[2] || 0);
  }

  function pintar() {
    const ahora = new Date();
    const dia = DIAS[ahora.getDay()];
    const min = ahora.getHours() * 60 + ahora.getMinutes();
    let abiertas = 0, proxHora = 0, quedan = 0;
    (filas || []).forEach(r => {
      if (!r.nombre || norm(r.nombre).includes("grupo movil") || norm(r.dia) !== dia) return;
      const ini = minutos(r["hora inicio"]);
      if (ini === null) return;
      let fin = minutos(r["hora fin"]);
      if (fin === null) fin = ini + 90;
      if (fin <= ini) fin += 1440;
      if (min >= ini && min < fin) abiertas++;
      else if (ini > min) { quedan++; if (ini - min <= 60) proxHora++; }
    });
    const fecha = `${dia}, ${ahora.getDate()} de ${MESES[ahora.getMonth()]} de ${ahora.getFullYear()}`;
    const hora = ahora.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit", hour12: true }).replace(/\s/g, " ").toLowerCase();
    const nBold = n => `<strong>${n}</strong>`;
    const reun = n => `${nBold(n)} ${n === 1 ? "reunión" : "reuniones"}`;
    const abre = n => n === 1 ? `abre ${reun(1)}` : `abren ${reun(n)}`;
    let frase;
    if (!abiertas) frase = proxHora ? `No hay reuniones en curso, pero en la próxima hora ${abre(proxHora)}.` : "No hay reuniones en curso ni abren en la próxima hora.";
    else {
      const curso = abiertas === 1 ? `Hay ${reun(1)} en curso` : `Hay ${reun(abiertas)} en curso`;
      frase = proxHora ? `${curso} y en la próxima hora ${abre(proxHora)}.` : `${curso}. En la próxima hora no abre ninguna.`;
    }
    const resto = quedan === 0 ? "Hoy no quedan más reuniones por abrir." : quedan === 1 ? `Hoy queda ${reun(1)} por abrir.` : `Hoy quedan ${reun(quedan)} por abrir.`;
    box.innerHTML = `<p class="reuniones-hoy-fecha">Hoy ${esc(fecha)}, ${esc(hora)}</p>` +
      `<p>${frase} ${resto}</p>` +
      `<p class="reuniones-hoy-lema">${LEMA}</p>`;
  }

  fetchSheet(CONFIG.TAB_REUNIONES, true, d => { filas = d; pintar(); })
    .then(d => { filas = d; pintar(); setInterval(pintar, 30000); })
    .catch(() => {});
})();
