// Iconos SVG (en lugar de emojis); heredan el color del texto
const _svg = p => `<svg class="ico" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const ICO = {
  pin: _svg('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.800 12 21 12 21Z"/><circle cx="12" cy="9.500" r="2.500"/>'),
  tel: _svg('<path d="M22 16.900v3a2 2 0 0 1-2.200 2 19.800 19.800 0 0 1-8.600-3.100 19.500 19.500 0 0 1-6-6A19.800 19.800 0 0 1 2.100 4.200 2 2 0 0 1 4.100 2h3a2 2 0 0 1 2 1.700c.1 1 .4 1.900.7 2.800a2 2 0 0 1-.5 2.100L8.100 9.900a16 16 0 0 0 6 6l1.300-1.300a2 2 0 0 1 2.100-.4c.9.300 1.800.6 2.800.7a2 2 0 0 1 1.700 2Z"/>'),
  link: _svg('<path d="M10 13a5 5 0 0 0 7.500.5l3-3a5 5 0 0 0-7-7l-1.700 1.700"/><path d="M14 11a5 5 0 0 0-7.500-.5l-3 3a5 5 0 0 0 7 7l1.700-1.700"/>'),
  ojo: _svg('<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z"/><circle cx="12" cy="12" r="3"/>'),
  sol: _svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.900 4.900l1.400 1.400M17.700 17.700l1.400 1.400M2 12h2M20 12h2M4.900 19.100l1.400-1.400M17.700 6.300l1.400-1.400"/>'),
  luna: _svg('<path d="M21 12.800A9 9 0 1 1 11.200 3a7 7 0 0 0 9.800 9.800Z"/>')
};

// Menú hamburguesa
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav");
  if (btn && nav) {
    btn.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      btn.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", open);
    });
    nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
      nav.classList.remove("open");
      btn.classList.remove("open");
    }));
    const lectura = nav.querySelector(".nav-dropdown-toggle");
    const submenu = nav.querySelector(".nav-submenu");
    if (lectura && submenu) lectura.addEventListener("click", () => {
      const abierto = lectura.getAttribute("aria-expanded") !== "true";
      lectura.setAttribute("aria-expanded", String(abierto));
      submenu.hidden = !abierto;
    });
  }
  const redes = document.getElementById("redes-lista");
  if (redes && typeof REDES !== "undefined") {
    const svgDe = d => `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="${esc(d)}"/></svg>`;
    redes.innerHTML = REDES.map(r => {
      const url = /^https?:/i.test(r.url || "") ? esc(r.url) : "";
      return url
        ? `<a class="red" href="${url}" target="_blank" rel="noopener noreferrer" aria-label="${esc(r.nombre)}">${svgDe(r.icono)}${esc(r.nombre)}</a>`
        : `<span class="red red-off" title="Próximamente">${svgDe(r.icono)}${esc(r.nombre)}</span>`;
    }).join("");

    // Líneas de atención (teléfonos): debajo de los enlaces
    const ICO_TEL = "M6.6 10.8a15 15 0 0 0 6.600 6.600l2.200-2.200a1 1 0 0 1 1-.2 11 11 0 0 0 3.500.6 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.500a1 1 0 0 1 1 1c0 1.200.2 2.400.6 3.500a1 1 0 0 1-.2 1l-2.300 2.300Z";
    if (typeof TELEFONOS !== "undefined" && TELEFONOS.length) {
      const box = document.createElement("div");
      box.className = "lineas";
      const grupos = TELEFONOS.map(t => {
        const num = String(t.numero || "").replace(/[^\d+]/g, "");
        const ok = /^\+?\d{7,15}$/.test(num);
        const txt = `${svgDe(ICO_TEL)}${esc(t.numero)}`;
        return ok ? `<a class="red" href="tel:${num}">${txt}</a>` : `<span class="red red-off">${txt}</span>`;
      }).join("");
      box.innerHTML = `<h2>Líneas de atención</h2><div class="redes-lista">${grupos}</div>`;
      (redes.closest(".foot-inner") || redes.parentNode).appendChild(box);
    }
  }  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
});

const norm = s => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Solo permite enlaces http(s)
const safeUrl = u => /^https?:\/\//i.test(String(u || "").trim()) ? esc(String(u).trim()) : "";

// Lee una pestaña de Google Sheets (la hoja debe estar compartida como "cualquiera con el enlace puede ver")
// Caché local con "stale-while-revalidate": si hay copia guardada se usa al instante y,
// si ya venció (CACHE_MIN), se actualiza en segundo plano para la próxima visita.
const CACHE_MIN = 5;
let pendientes = 0;

function ocultarLoader() {
  const l = document.getElementById("loader");
  if (!l) return;
  l.classList.add("oculto");
  setTimeout(() => l.remove(), 400);
}

// El loader se cierra cuando la página cargó y no quedan consultas pendientes
function revisarLoader() {
  if (document.readyState === "complete" && pendientes === 0) setTimeout(() => pendientes === 0 && ocultarLoader(), 150);
}
window.addEventListener("load", () => setTimeout(revisarLoader, 0));
setTimeout(ocultarLoader, 12000);

// Consulta con caché genérica: carga(): Promise<datos>. silencioso = no retiene el loader
async function conCache(key, carga, silencioso, alActualizar) {
  let guardado = null;
  try { guardado = JSON.parse(localStorage.getItem(key)); } catch (e) {}
  const refrescar = async () => {
    let datos;
    try { datos = await carga(); } catch (e) { datos = await carga(); } // un reintento ante fallos de red
    // No se guarda una respuesta vacía (a veces la hoja responde sin filas por error)
    if (!(Array.isArray(datos) && !datos.length)) {
      try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), datos })); } catch (e) {}
    }
    return datos;
  };
  if (guardado && guardado.datos && !(Array.isArray(guardado.datos) && !guardado.datos.length)) {
    if (Date.now() - guardado.t >= CACHE_MIN * 60000) {
      refrescar().then(d => { if (alActualizar && JSON.stringify(d) !== JSON.stringify(guardado.datos)) alActualizar(d); }).catch(() => {});
    }
    return guardado.datos;
  }
  if (!silencioso) pendientes++;
  try { return await refrescar(); }
  finally { if (!silencioso) { pendientes--; revisarLoader(); } }
}

const fetchSheet = (tab, silencioso, alActualizar) => conCache(`na_sheet_${CONFIG.SHEET_ID}_${tab}`, () => leerHoja(tab), silencioso, alActualizar);

// Lista de grupos (solo nombres) del Apps Script
const fetchGrupos = silencioso => conCache("na_grupos", async () => {
  const j = await (await fetch(`${CONFIG.API_URL}?accion=grupos`)).json();
  if (!j.grupos) throw new Error();
  return j.grupos;
}, silencioso);

// Precarga en segundo plano en todas las páginas para que Reuniones y Ajustes abran al instante
window.addEventListener("load", () => setTimeout(() => {
  fetchSheet(CONFIG.TAB_REUNIONES, true).catch(() => {});
  fetchSheet(CONFIG.TAB_EVENTOS, true).catch(() => {}); // eventos disponibles en todas las páginas
  if (CONFIG.API_URL) fetchGrupos(true).catch(() => {});
}, 300));
async function leerHoja(tab) {
  const url = `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/gviz/tq?tqx=out:json&headers=1&sheet=${encodeURIComponent(tab)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("No se pudo leer la hoja");
  const text = await res.text();
  const json = JSON.parse(text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1));
  if (json.status === "error") throw new Error("Pestaña no encontrada o sin permisos");
  const cols = json.table.cols.map(c => norm(c.label));
  return json.table.rows.filter(r => r).map(r => {
    const o = {};
    cols.forEach((c, i) => {
      const cell = r.c[i];
      o[c] = cell ? (cell.f ?? cell.v ?? "") : "";
    });
    return o;
  });
}
