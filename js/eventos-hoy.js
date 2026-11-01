// Tarjeta "Eventos" del inicio: cuenta los eventos activos que no han terminado
(() => {
  const box = document.getElementById("eventos-hoy");
  if (!box) return;
  const parseDMY = s => { const m = String(s || "").match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null; };
  const ev = n => `<strong>${n}</strong> ${n === 1 ? "evento" : "eventos"}`;

  function texto(semana, total) {
    if (total === 0) return "No hay eventos programados por ahora.";
    const proximos = total === 1 ? `Hay ${ev(1)} próximo` : `Hay ${ev(total)} próximos`;
    if (semana === 0) return `${proximos}, ninguno esta semana.`;
    if (semana === total) return `${proximos}${total === 1 ? ", y es esta semana" : ", todos esta semana"}.`;
    return `${proximos}: ${semana} esta semana y ${total - semana} más adelante.`;
  }

  function pintar(filas) {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const limite = new Date(hoy); limite.setDate(limite.getDate() + 7);
    let total = 0, semana = 0;
    filas.forEach(e => {
      if (!e.nombre || String(e.estado || "").trim().toLowerCase() !== "activo") return;
      const ini = parseDMY(e["fecha inicio"]);
      const fin = parseDMY(e["fecha fin"]) || ini;
      if (fin && fin < hoy) return;
      total++;
      if (!ini || ini < limite) semana++;
    });
    box.innerHTML = texto(semana, total);
  }

  fetchSheet(CONFIG.TAB_EVENTOS, true, pintar).then(pintar).catch(() => {});
})();
