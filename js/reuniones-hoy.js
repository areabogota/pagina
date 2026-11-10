// Tarjeta "Reuniones" del inicio: fecha y hora actuales, reuniones abiertas ahora y próximas a abrir hoy
(() => {
  const box = document.getElementById("reuniones-hoy");
  if (!box) return;
  const DIAS = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
  const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const LEMA = "Para que ningún adicto, dondequiera que esté, tenga que morir a causa de los horrores de la adicción.";
  let filas = null;

  function pintar() {
    const ahora = new Date();
    const dia = DIAS[ahora.getDay()];
    const min = ahora.getHours() * 60 + ahora.getMinutes();
    const abiertas = [], proxHora = [];
    let quedan = 0;
    (filas || []).forEach(r => {
      if (!r.nombre || norm(r.nombre).includes("grupo movil") || norm(r.dia) !== dia) return;
      const ini = ReunionesTiempo.minutos(r["hora inicio"]);
      if (ini === null) return;
      if (ReunionesTiempo.estaEnCurso(r.dia, r["hora inicio"], r["hora fin"], ahora)) abiertas.push(r);
      else if (ini > min) {
        quedan++;
        if (ini - min <= 60) proxHora.push(r);
      }
    });
    const fecha = `${dia}, ${ahora.getDate()} de ${MESES[ahora.getMonth()]} de ${ahora.getFullYear()}`;
    const hora = ahora.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit", hour12: true }).replace(/\s/g, " ").toLowerCase();
    const nBold = n => `<strong>${n}</strong>`;
    const reun = n => `${nBold(n)} ${n === 1 ? "reunión" : "reuniones"}`;
    const abre = n => n === 1 ? `abre ${reun(1)}` : `abren ${reun(n)}`;
    let frase;
    if (!abiertas.length) frase = proxHora.length ? `No hay reuniones en curso, pero en la próxima hora ${abre(proxHora.length)}.` : "No hay reuniones en curso ni abren en la próxima hora.";
    else {
      const curso = abiertas.length === 1 ? `Hay ${reun(1)} en curso` : `Hay ${reun(abiertas.length)} en curso`;
      frase = proxHora.length ? `${curso} y en la próxima hora ${abre(proxHora.length)}.` : `${curso}. En la próxima hora no abre ninguna.`;
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
