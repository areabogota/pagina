// Pegar en Extensiones > Apps Script de la hoja de Google Sheets.
// Implementar > Nueva implementación > Aplicación web
//   Ejecutar como: Yo | Quién tiene acceso: Cualquier persona
// Copiar la URL resultante en js/config.js (ORDERS_URL).
const SHEET_ID = "1sy6R4HxHgFEsAkOjt_H-f0i5X8XUdHjE0y0Cha5EREI";
const TAB = "Pedidos";

// Las claves viven en OTRO libro de Google Sheets que NO se comparte con nadie
// (pestaña CLAVES: col A = grupo, col B = clave). Pega aquí el ID de ese libro privado.
const CLAVES_SHEET_ID = "1vEa1xMXnRZaMH-XmJoXtmqQRe9H34c63umbo1NyjuDs";

function claves_() {
  const sh = SpreadsheetApp.openById(CLAVES_SHEET_ID).getSheetByName("CLAVES");
  return sh.getDataRange().getValues()
    .map(r => ({ grupo: String(r[0]).trim(), clave: String(r[1]).trim() }))
    .filter(x => x.grupo && x.clave && x.grupo.toUpperCase() !== "GRUPO");
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

const norm_ = s => String(s == null ? "" : s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s*&\s*/g, " y ").replace(/\s+/g, " ").trim();
const clean_ = v => String(v == null ? "" : v).slice(0, 500).replace(/^[=+\-@]/, "'$&"); // evita fórmulas
const BASICOS = ["direccion", "barrio", "localidad", "virtual", "link maps"];
const REUNION = ["dia", "hora inicio", "hora fin", "tipo", "intereses comunes", "formato"];
const DIAS_ = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo", "festivos"];

// Obligatorios: día, horas (24 h HH:MM) y tipo; intereses comunes y formato son opcionales
function validarReunion_(d) {
  for (const c of ["dia", "hora inicio", "hora fin", "tipo"]) if (!String(d[c] == null ? "" : d[c]).trim()) return false;
  if (DIAS_.indexOf(norm_(d.dia)) < 0) return false;
  const h = /^([01]\d|2[0-3]):[0-5]\d$/;
  return h.test(String(d["hora inicio"]).trim()) && h.test(String(d["hora fin"]).trim());
}

// Escribe la reunión en una fila; las horas se guardan como hora real con formato 24 h
function escribirReunion_(t, fila, d) {
  REUNION.forEach(c => {
    const j = t.cols.indexOf(c);
    if (j < 0) return;
    const cell = t.sh.getRange(fila, j + 1);
    if (c === "hora inicio" || c === "hora fin") {
      const [hh, mm] = String(d[c]).trim().split(":").map(Number);
      cell.setNumberFormat("HH:mm").setValue(new Date(1899, 11, 30, hh, mm, 0));
    } else cell.setValue(clean_(d[c]));
  });
}

// Verifica grupo+clave (con freno ante intentos repetidos)
function verificar_(grupo, clave) {
  const cache = CacheService.getScriptCache();
  const k = "int_" + Utilities.base64EncodeWebSafe(String(grupo || "")).slice(0, 80);
  const n = Number(cache.get(k) || 0);
  if (n >= 5) return { ok: false, bloqueado: true };
  const x = claves_().filter(c => c.grupo === String(grupo || "").trim())[0];
  const ok = !!x && x.clave === String(clave || "").trim();
  if (!ok) cache.put(k, String(n + 1), 600);
  return { ok: ok };
}

function tabla_() {
  const sh = SpreadsheetApp.openById(SHEET_ID).getSheetByName("GRUPOS");
  const v = sh.getDataRange().getDisplayValues();
  return { sh: sh, v: v, cols: v[0].map(norm_) };
}

function filasDe_(t, grupo) {
  const iN = t.cols.indexOf("nombre"), out = [];
  for (let i = 1; i < t.v.length; i++) if (norm_(t.v[i][iN]) === norm_(grupo)) out.push(i);
  return out; // índices en t.v (fila de hoja = i + 1)
}

function doGet(e) {
  try {
    const p = e.parameter || {};
    if (p.accion === "version") return json_({ version: "2026-10-16-calendario" });
    if (p.accion === "grupos") return json_({ grupos: claves_().map(x => x.grupo) });
    if (p.accion === "verificar") return json_(verificar_(p.grupo, p.clave));

    if (p.accion === "datos" || p.accion === "editar") {
      const auth = verificar_(p.grupo, p.clave);
      if (!auth.ok) return json_(auth);
      const t = tabla_();
      const propias = filasDe_(t, p.grupo);

      if (p.accion === "datos") {
        return json_({ ok: true, filas: propias.map(i => {
          const o = { fila: i + 1 };
          t.cols.forEach((c, j) => o[c] = t.v[i][j]);
          return o;
        }) });
      }

      const lock = LockService.getScriptLock();
      lock.waitLock(10000);
      try {
        const d = JSON.parse(p.datos || "{}");
        if (p.modo === "basicos") {
          if (BASICOS.some(c => !String(d[c] == null ? "" : d[c]).trim()) || ["TRUE", "FALSE"].indexOf(String(d.virtual)) < 0) return json_({ ok: false, error: "datos incompletos" });
          d.virtual = String(d.virtual) === "TRUE";
          // Cambia en TODAS las filas que comparten el ID del grupo
          const iId = t.cols.indexOf("id");
          const ids = propias.map(i => String(t.v[i][iId]).trim()).filter(Boolean);
          const objetivo = [];
          for (let i = 1; i < t.v.length; i++) {
            const mismoId = iId >= 0 && ids.indexOf(String(t.v[i][iId]).trim()) >= 0 && String(t.v[i][iId]).trim() !== "";
            if (mismoId || propias.indexOf(i) >= 0) objetivo.push(i);
          }
          BASICOS.forEach(c => {
            const j = t.cols.indexOf(c);
            if (j < 0 || !(c in d)) return;
            objetivo.forEach(i => t.sh.getRange(i + 1, j + 1).setValue(typeof d[c] === "boolean" ? d[c] : clean_(d[c])));
          });
          return json_({ ok: true, filas: objetivo.length });
        }
        if (p.modo === "fila") {
          const i = Number(p.fila) - 1;
          if (propias.indexOf(i) < 0) return json_({ ok: false, error: "fila invalida" }); // solo filas del propio grupo
          if (!validarReunion_(d)) return json_({ ok: false, error: "datos incompletos" });
          escribirReunion_(t, i + 1, d);
          return json_({ ok: true, filas: 1 });
        }
        if (p.modo === "nueva") {
          if (!validarReunion_(d)) return json_({ ok: false, error: "datos incompletos" });
          // Copia ID, nombre, sector y datos básicos de la primera fila del grupo
          const base = propias.length ? t.v[propias[0]] : [];
          const fila = t.cols.map((c, j) => {
            if (REUNION.indexOf(c) >= 0) return "";
            if (c === "nombre") return base[j] || clean_(p.grupo);
            return base[j] || "";
          });
          t.sh.appendRow(fila);
          escribirReunion_(t, t.sh.getLastRow(), d);
          return json_({ ok: true, filas: 1 });
        }
        return json_({ ok: false, error: "modo invalido" });
      } finally { lock.releaseLock(); }
    }
    return json_({ error: "accion invalida" });
  } catch (err) {
    return json_({ error: "error" });
  }
}

// Evento nuevo (POST con grupo+clave). Columnas de la pestaña "Eventos":
// Fecha inicio, Fecha fin, Nombre, Mensaje, Flyer, Direccion, Contacto, Grupo
// Ejecutar UNA vez desde el editor (botón Ejecutar) para autorizar Drive y Sheets
function autorizar() {
  const c = DriveApp.getFolderById(CARPETA_FLYERS_ID);
  const s = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Eventos");
  const cal = CalendarApp.getCalendarById(CALENDARIO_ID);
  Logger.log("OK carpeta: " + c.getName() + " | hoja: " + s.getName() + " | calendario: " + (cal ? cal.getName() : "SIN ACCESO"));
}

const CARPETA_FLYERS_ID = "15AXKrIPjVMjH4fHJDYkOiDA_6H3y_216";
const aDMY_ = m => m[3] + "/" + m[2] + "/" + m[1];
const ISO_ = /^(\d{4})-(\d{2})-(\d{2})$/;

function guardarFlyer_(b64) {
  if (String(b64).length > 6000000) throw new Error("flyer: imagen demasiado pesada");
  const bytes = Utilities.base64Decode(String(b64));
  const b0 = bytes[0] & 0xFF, b1 = bytes[1] & 0xFF; // Apps Script devuelve bytes con signo
  if (bytes.length < 4 || b0 !== 0xFF || b1 !== 0xD8) throw new Error("flyer: no es un JPEG válido"); // solo JPEG
  const blob = Utilities.newBlob(bytes, "image/jpeg", "flyer_" + Date.now() + ".jpg");
  const archivo = DriveApp.getFolderById(CARPETA_FLYERS_ID).createFile(blob);
  archivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return "https://lh3.googleusercontent.com/d/" + archivo.getId() + "=w1000";
}

// Calendario de Google del área: cada evento se refleja ahí (el dueño del script debe poder editarlo)
const CALENDARIO_ID = "areabogota@nacolombia.org";
const aFecha_ = m => Utilities.parseDate(m[0], "America/Bogota", "yyyy-MM-dd");
const dmy_ = s => { const m = String(s || "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/); return m ? Utilities.parseDate(m[3] + "-" + m[2] + "-" + m[1], "America/Bogota", "yyyy-MM-dd") : null; };

const tituloCal_ = (nombre, grupo) => nombre + " – " + grupo;

function buscarEnCalendario_(cal, previo, idCal) {
  if (idCal) { try { const e = cal.getEventById(idCal); if (e) return e; } catch (x) {} }
  const ini = dmy_(previo["fecha inicio"]);
  if (!ini) return null;
  const fin = new Date(ini.getTime() + 400 * 86400000);
  const t = tituloCal_(previo.nombre, previo.grupo);
  const n = s => String(s || "").replace(/[–—-]/g, "-").replace(/\s+/g, " ").trim().toLowerCase();
  const posibles = [n(t), n(previo.nombre)];
  return cal.getEvents(new Date(ini.getTime() - 86400000), fin)
    .filter(e => posibles.indexOf(n(e.getTitle())) >= 0)[0] || null;
}

// accion: "crear" | "editar" | "eliminar". Devuelve el id del evento de calendario (o "" si falla)
function sincronizarCalendario_(accion, previo, d, ini, fin, grupo, idCal) {
  try {
    const cal = CalendarApp.getCalendarById(CALENDARIO_ID);
    if (!cal) return { id: "", error: "sin acceso al calendario " + CALENDARIO_ID + " (compártelo con la cuenta del script)" };
    if (accion === "eliminar") { const e = buscarEnCalendario_(cal, previo, idCal); if (!e) return { id: "", error: "no se encontró el evento en el calendario (bórralo a mano ahí)" }; e.deleteEvent(); return { id: "" }; }
    const inicio = aFecha_(ini), finExcl = new Date(aFecha_(fin).getTime() + 86400000); // fin exclusivo en eventos de día completo
    const opts = { location: String(d.direccion || ""), description: String(d.mensaje || "") + "\nContacto: " + d.contacto + "\nGrupo: " + grupo };
    const titulo = tituloCal_(d.nombre, grupo);
    let e = accion === "editar" ? buscarEnCalendario_(cal, previo, idCal) : null;
    if (e) { e.setTitle(titulo); e.setAllDayDates(inicio, finExcl); e.setLocation(opts.location); e.setDescription(opts.description); }
    else e = cal.createAllDayEvent(titulo, inicio, finExcl, opts);
    return { id: e.getId() };
  } catch (x) { return { id: "", error: String(x && x.message || x) }; }
}

// Eventos (POST con grupo+clave). modo: listar | crear | editar | eliminar
// Columnas de la pestaña "Eventos": Fecha inicio, Fecha fin, Nombre, Mensaje, Flyer, Direccion, Contacto, Grupo
function evento_(b) {
  const auth = verificar_(b.grupo, b.clave);
  if (!auth.ok) return auth;
  const modo = b.modo || "crear";
  const sh = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Eventos");
  const cols = sh.getRange(1, 1, 1, sh.getLastColumn()).getDisplayValues()[0].map(norm_);
  const iG = cols.indexOf("grupo");
  const propias = () => {
    const v = sh.getDataRange().getDisplayValues(), out = [];
    for (let i = 1; i < v.length; i++) if (norm_(v[i][iG]) === norm_(b.grupo)) {
      const o = { fila: i + 1 };
      cols.forEach((c, j) => o[c] = v[i][j]);
      out.push(o);
    }
    return out;
  };
  if (modo === "listar") return { ok: true, eventos: propias() };

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    let fila = 0, previo = null;
    if (modo === "editar" || modo === "eliminar") {
      fila = Number(b.fila);
      previo = propias().filter(x => x.fila === fila)[0]; // solo eventos del propio grupo
      if (!previo) return { ok: false, error: "evento no encontrado" };
      if (modo === "eliminar") {
        const cs = sincronizarCalendario_("eliminar", previo, null, null, null, b.grupo, previo["calendario id"]);
        sh.deleteRow(fila);
        return { ok: true, errorCalendario: cs.error || "" };
      }
    } else if (modo !== "crear") return { ok: false, error: "modo invalido" };

    const d = b.datos || {};
    const ini = String(d["fecha inicio"] || "").match(ISO_), fin = String(d["fecha fin"] || "").match(ISO_);
    if (!ini || !fin) return { ok: false, error: "datos incompletos" };
    for (const c of ["nombre", "mensaje", "direccion", "contacto"]) if (!String(d[c] || "").trim()) return { ok: false, error: "datos incompletos" };
    if (!/^[0-9+()\s-]{7,30}$/.test(String(d.contacto).trim())) return { ok: false, error: "contacto invalido" };
    if (fin[0] < ini[0]) return { ok: false, error: "la fecha fin es anterior al inicio" };
    // Mínimo 15 días de anticipación (hora de Bogotá); al editar solo si cambia la fecha de inicio
    const lim = new Date(); lim.setDate(lim.getDate() + 15);
    const cambiaIni = !previo || previo["fecha inicio"] !== aDMY_(ini);
    if (cambiaIni && ini[0] < Utilities.formatDate(lim, "America/Bogota", "yyyy-MM-dd")) return { ok: false, error: "fecha" };

    // Cruce de fechas con eventos de otros (o del mismo grupo): se avisa y solo se crea si confirman
    if (!b.confirmarCruce) {
      const iN = cols.indexOf("nombre"), iI = cols.indexOf("fecha inicio"), iF = cols.indexOf("fecha fin");
      const todas = sh.getDataRange().getDisplayValues();
      const aIso = s => { const m = String(s || "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/); return m ? m[3] + "-" + m[2] + "-" + m[1] : ""; };
      for (let i = 1; i < todas.length; i++) {
        if (i + 1 === fila) continue;
        const oi = aIso(todas[i][iI]), of = aIso(todas[i][iF]) || oi;
        if (oi && ini[0] <= of && fin[0] >= oi) {
          return { ok: false, cruce: { grupo: todas[i][iG], nombre: todas[i][iN], inicio: todas[i][iI], fin: todas[i][iF] } };
        }
      }
    }

    let flyer = previo ? previo.flyer : "";
    if (d.flyer) flyer = guardarFlyer_(d.flyer);
    else if (!previo) return { ok: false, error: "flyer: no llegó la imagen al servidor" };

    const cs = sincronizarCalendario_(modo, previo, d, ini, fin, b.grupo, previo && previo["calendario id"]);
    const idCal = cs.id;
    const val = {
      "fecha inicio": aDMY_(ini), "fecha fin": aDMY_(fin), nombre: d.nombre, mensaje: d.mensaje,
      flyer: flyer, direccion: d.direccion, contacto: d.contacto, grupo: b.grupo, "calendario id": idCal
    };
    if (!fila) fila = sh.getLastRow() + 1;
    Object.keys(val).forEach(c => {
      const j = cols.indexOf(c);
      if (j >= 0) sh.getRange(fila, j + 1).setNumberFormat("@").setValue(clean_(val[c]));
    });
    return { ok: true, calendario: !!idCal, errorCalendario: cs.error || "" };
  } finally { lock.releaseLock(); }
}

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.accion === "evento") {
      try { return json_(evento_(d)); }
      catch (err2) { return json_({ ok: false, error: "servidor: " + err2.message }); }
    }
    const clean = v => String(v == null ? "" : v).slice(0, 500).replace(/^[=+\-@]/, "'$&"); // evita fórmulas
    const items = (Array.isArray(d.items) ? d.items.slice(0, 50) : [])
      .map(i => clean(i.titulo) + " x" + (Number(i.cantidad) || 1)).join("\n");
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let sh = ss.getSheetByName(TAB);
    if (!sh) {
      sh = ss.insertSheet(TAB);
      sh.appendRow(["Fecha", "Nombre", "Grupo/Área", "Contacto", "Pedido", "Notas", "Cuenta"]);
    }
    sh.appendRow([new Date(), clean(d.nombre), clean(d.grupo), clean(d.contacto), items, clean(d.notas), clean(d.cuenta)]);
    return ContentService.createTextOutput("ok");
  } catch (err) {
    return ContentService.createTextOutput("error");
  }
}
