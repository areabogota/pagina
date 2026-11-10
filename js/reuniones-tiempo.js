// Criterio compartido para identificar reuniones activas en las distintas vistas.
window.ReunionesTiempo = (() => {
  const DIAS = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
  const normalizar = valor => String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

  function minutos(valor) {
    const texto = String(valor || "").trim();
    if (!texto) return null;
    const fecha = texto.match(/^Date\(\d+,\d+,\d+,(\d+),(\d+)/i);
    const hora = texto.match(/^(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*([ap])?\.?\s*m?\.?$/i);
    let horas, mins;
    if (fecha) {
      horas = +fecha[1];
      mins = +fecha[2];
    } else if (hora) {
      horas = +hora[1];
      mins = +(hora[2] || 0);
      const periodo = (hora[3] || "").toLowerCase();
      if (periodo === "p" && horas < 12) horas += 12;
      if (periodo === "a" && horas === 12) horas = 0;
    } else return null;
    return horas > 23 || mins > 59 ? null : horas * 60 + mins;
  }

  function estaEnCurso(dia, horaInicio, horaFin, ahora = new Date()) {
    if (normalizar(dia) !== DIAS[ahora.getDay()]) return false;
    const inicio = minutos(horaInicio);
    if (inicio === null) return false;
    let fin = minutos(horaFin);
    if (fin === null) fin = inicio + 90;
    if (fin <= inicio) fin += 1440;
    const minutoActual = ahora.getHours() * 60 + ahora.getMinutes();
    return minutoActual >= inicio && minutoActual < fin;
  }

  function horaHumana(valor) {
    const total = minutos(valor);
    if (total === null) return String(valor || "");
    const horas = Math.floor(total / 60);
    const sufijo = horas >= 12 ? "p.m." : "a.m.";
    return `${horas % 12 || 12}:${String(total % 60).padStart(2, "0")} ${sufijo}`;
  }

  return { minutos, estaEnCurso, horaHumana };
})();
