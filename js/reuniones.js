// Pestaña "GRUPOS": ID, NOMBRE, SECTOR, DIRECCIÓN, BARRIO, LOCALIDAD, VIRTUAL, LINK MAPS, DIA, HORA INICIO, HORA FIN, TIPO, INTERESES COMUNES, FORMATO
// Una fila por grupo y día. Las filas con el mismo ID (o nombre) se unen en una sola card con varios horarios.
const DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo", "festivos"];
const diaIdx = d => { const i = DIAS.indexOf(norm(d)); return i < 0 ? 99 : i; };
const esSi = v => ["si", "s", "x", "true", "1", "virtual"].includes(norm(v));

// Convierte "18:00", "18:00:00", "6:00 PM" o "Date(1899,11,30,18,0,0)" a "6 pm", "6:30 pm"
function horaHumana(v) {
  const s = String(v || "").trim();
  if (!s) return "";
  let h, m;
  const d = s.match(/^Date\(\d+,\d+,\d+,(\d+),(\d+)/i);
  const t = s.match(/^(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*([ap])?\.?\s*m?\.?$/i);
  if (d) { h = +d[1]; m = +d[2]; }
  else if (t) {
    h = +t[1]; m = +(t[2] || 0);
    const p = (t[3] || "").toLowerCase();
    if (p === "p" && h < 12) h += 12;
    if (p === "a" && h === 12) h = 0;
  } else return s;
  if (h > 23 || m > 59) return s;
  const suf = h >= 12 ? "p.m." : "a.m.";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suf}`;
}

function horario(r) {
  const ini = horaHumana(r["hora inicio"]), fin = horaHumana(r["hora fin"]);
  return ini && fin ? `${ini} - ${fin}` : ini || fin;
}

// Mini mapa: solo se muestra si el link de la hoja trae coordenadas exactas (evita mapas con error)
function miniMapa(g) {
  const link = String(g.maps || "");
  const c = link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
    || link.match(/[?&](?:q|ll|query|destination)=(-?\d+\.\d+)(?:,|%2C)(-?\d+\.\d+)/i)
    || link.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (!c) return "";
  const src = `https://maps.google.com/maps?q=${c[1]},${c[2]}&z=16&output=embed`;
  const href = safeUrl(link) || `https://www.google.com/maps/search/?api=1&query=${c[1]},${c[2]}`;
  return `<div class="minimapa"><iframe src="${esc(src)}" title="Mapa de ${esc(g.nombre)}" loading="lazy" tabindex="-1" referrerpolicy="no-referrer-when-downgrade"></iframe>
    <a href="${href}" target="_blank" rel="noopener noreferrer" aria-label="Abrir ${esc(g.nombre)} en Google Maps"></a></div>`;
}

const ABREV = { lunes: "Lun", martes: "Mar", miercoles: "Mié", jueves: "Jue", viernes: "Vie", sabado: "Sáb", domingo: "Dom", festivos: "Fest." };
const diaCorto = d => ABREV[norm(d)] || String(d || "");

// Enlace de reunión virtual: la dirección (o el link de Maps) cuando es una URL con dominio
const esLink = s => /^https?:\/\/[^\s\/]+\.[^\s]+/i.test(String(s || "").trim());
const linkVirtual = g => [g.direccion, g.virtual ? g.maps : ""].map(s => String(s || "").trim()).find(esLink) || "";

function cardGrupo(g) {
  const vlink = linkVirtual(g);
  const filas = g.horarios.map(h => `<tr><td>${esc(diaCorto(h.dia))}</td><td>${esc(h.hora)}</td><td>${h.tipo ? `<span class="tag tag-${norm(h.tipo).startsWith("cerr") ? "cerrada" : "abierta"}">${esc(h.tipo)}</span>` : ""}</td><td>${esc(h.formato)}</td><td>${esc(h.intereses)}</td></tr>`).join("");
  const dir = esLink(g.direccion) ? `<a class="link-virtual" href="${safeUrl(g.direccion)}" target="_blank" rel="noopener noreferrer">🔗 ${esc(String(g.direccion).trim().replace(/^https?:\/\//i, ""))}</a>` : /^https?:\/\/?$/i.test(String(g.direccion || "").trim()) ? "" : esc(g.direccion);
  const lugar = [dir, esc(g.barrio), esc(g.localidad)].filter(Boolean).join(" · ");
  const bare = /^https?:\/\/?$/i.test(String(g.direccion || "").trim()); // "https://" sin dirección real
  return `<article class="card grupo${safeUrl(vlink) ? " clicable" : ""}"${safeUrl(vlink) ? ` data-href="${safeUrl(vlink)}"` : ""}>
    <div class="grupo-head">
      <div class="grupo-info">
        <h3>${esc(g.nombre)}</h3>
        ${lugar && !(bare && !g.barrio && !g.localidad) ? `<p class="direccion">${vlink ? "" : "📍 "}${lugar}</p>` : ""}
        ${g.virtual ? '<p><span class="tag tag-virtual">Virtual</span></p>' : ""}
      </div>
      ${miniMapa(g)}
    </div>
    <table class="horarios">
      <thead><tr><th>Día</th><th>Horario</th><th>Tipo</th><th>Formato</th><th>Intereses comunes</th></tr></thead>
      <tbody>${filas}</tbody>
    </table>
  </article>`;
}

let todos = [];

// Tocar la card de un grupo con link virtual abre el link (sin interferir con otros enlaces o texto seleccionado)
document.addEventListener("click", e => {
  const card = e.target.closest(".card.clicable");
  if (!card || e.target.closest("a, iframe") || String(getSelection())) return;
  window.open(card.dataset.href, "_blank", "noopener");
});

// Periodo (am/pm) de la hora de inicio, derivado de la hora ya convertida
const periodo = h => h.inicio.includes("a.m.") ? "am" : h.inicio.includes("p.m.") ? "pm" : "";
const ubicacion = g => String(g.localidad || g.barrio || "").trim();

function llenarSelects() {
  const llena = (id, valores) => {
    const sel = document.getElementById(id);
    valores.forEach(([v, t]) => sel.add(new Option(t, v)));
  };
  llena("fGrupo", todos.map(g => [norm(g.nombre), g.nombre]).sort((a, b) => a[1].localeCompare(b[1], "es")));
  const dias = [...new Set(todos.flatMap(g => g.horarios.map(h => norm(h.dia))).filter(Boolean))].sort((a, b) => diaIdx(a) - diaIdx(b));
  llena("fDia", dias.map(d => [d, (ABREV[d] ? { lunes: "Lunes", martes: "Martes", miercoles: "Miércoles", jueves: "Jueves", viernes: "Viernes", sabado: "Sábado", domingo: "Domingo", festivos: "Festivos" }[d] : d)]));
  const ubic = new Map(todos.map(g => [norm(ubicacion(g)), ubicacion(g)]).filter(([k]) => k));
  llena("fUbic", [...ubic].sort((a, b) => a[1].localeCompare(b[1], "es")));
}

// Aplica los 4 filtros; en cada grupo solo deja los horarios que cumplen día y am/pm
function render() {
  const box = document.getElementById("lista");
  const fg = document.getElementById("fGrupo").value, fd = document.getElementById("fDia").value;
  const fh = document.getElementById("fHora").value, fu = document.getElementById("fUbic").value;
  const res = [];
  todos.forEach(g => {
    if (fg && norm(g.nombre) !== fg) return;
    if (fu && norm(ubicacion(g)) !== fu) return;
    const hs = g.horarios.filter(h => (!fd || norm(h.dia) === fd) && (!fh || periodo(h) === fh));
    if (hs.length) res.push({ ...g, horarios: hs });
  });
  if (!res.length) { box.innerHTML = '<p class="status">No hay reuniones con esos filtros.</p>'; return; }
  const zonas = new Map();
  res.sort((a, b) => a.nombre.localeCompare(b.nombre, "es")).forEach(g => {
    if (!zonas.has(g.sector)) zonas.set(g.sector, []);
    zonas.get(g.sector).push(g);
  });
  box.innerHTML = [...zonas.entries()].sort((a, b) => a[0].localeCompare(b[0], "es")).map(([zona, gs]) =>
    `<section class="zona"><h2 class="zona-titulo">${esc(zona)}</h2><div class="grid">${gs.map(cardGrupo).join("")}</div></section>`).join("");
}

(async () => {
  const box = document.getElementById("lista");
  try {
    const rows = await fetchSheet(CONFIG.TAB_REUNIONES);
    const grupos = new Map();
    rows.filter(r => r.nombre).forEach(r => {
      const key = r.id ? "id:" + r.id : "n:" + norm(r.nombre);
      if (!grupos.has(key)) grupos.set(key, {
        nombre: r.nombre, sector: String(r.sector || "").trim() || "Otros", direccion: r.direccion, barrio: r.barrio,
        localidad: r.localidad, virtual: esSi(r.virtual),         maps: r["link maps"],
                intereses: r["intereses comunes"], horarios: []
              });
              grupos.get(key).horarios.push({ dia: r.dia, hora: horario(r), inicio: horaHumana(r["hora inicio"]), tipo: String(r.tipo || "").trim(), formato: r.formato, intereses: r["intereses comunes"] });
    });
    if (!grupos.size) { box.innerHTML = '<p class="status">No hay reuniones para mostrar.</p>'; return; }

    todos = [...grupos.values()];
    todos.forEach(g => g.horarios.sort((a, b) => diaIdx(a.dia) - diaIdx(b.dia)));
    llenarSelects();
    ["fGrupo", "fDia", "fHora", "fUbic"].forEach(id => document.getElementById(id).addEventListener("change", render));
    render();
  } catch (e) {
    box.innerHTML = `<p class="status error">No se pudieron cargar las reuniones. ${esc(e.message)}</p>`;
  }
})();
