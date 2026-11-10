
const SHEET_ID = "1sy6R4HxHgFEsAkOjt_H-f0i5X8XUdHjE0y0Cha5EREI";


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


function validarReunion_(d) {
  for (const c of ["dia", "hora inicio", "hora fin", "tipo"]) if (!String(d[c] == null ? "" : d[c]).trim()) return false;
  if (DIAS_.indexOf(norm_(d.dia)) < 0) return false;
  const h = /^([01]\d|2[0-3]):[0-5]\d$/;
  return h.test(String(d["hora inicio"]).trim()) && h.test(String(d["hora fin"]).trim());
}


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

// Tokens temporales: se emiten tras validar la clave y vencen a las 12 horas.
function nuevoToken_(grupo) {
  const t = Utilities.getUuid();
  PropertiesService.getScriptProperties().setProperty("tok_v2_" + t, JSON.stringify({ g: String(grupo).trim(), exp: Date.now() + 12 * 3600000 }));
  return t;
}

function grupoDeToken_(token) {
  const props = PropertiesService.getScriptProperties();
  const key = "tok_v2_" + String(token || "");
  const raw = props.getProperty(key);
  if (!raw) return "";
  const o = JSON.parse(raw);
  if (o.exp > Date.now()) return o.g;
  props.deleteProperty(key);
  return "";
}

function verificar_(grupo, clave, token) {
  const g = String(grupo || "").trim();
  if (token) return { ok: !!g && grupoDeToken_(token) === g };
  const cache = CacheService.getScriptCache();
  const k = "int_" + Utilities.base64EncodeWebSafe(g).slice(0, 80);
  const n = Number(cache.get(k) || 0);
  if (n >= 5) return { ok: false, bloqueado: true };
  const x = claves_().filter(c => c.grupo === g)[0];
  const ok = !!x && x.clave === String(clave || "").trim();
  if (!ok) { cache.put(k, String(n + 1), 600); return { ok: false }; }
  return { ok: true, token: nuevoToken_(g) };
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

function grupo_(d) {
  const grupo = String(d.grupo || "").trim();
  if (d.modo === "verificar") return verificar_(grupo, d.clave, "");
  if (d.modo !== "datos" && d.modo !== "editar") return { ok: false, error: "accion invalida" };

  const auth = d.token ? verificar_(grupo, "", d.token) : { ok: false };
  if (!auth.ok) return auth;
  const t = tabla_();
  const propias = filasDe_(t, grupo);

  if (d.modo === "datos") {
    return { ok: true, filas: propias.map(i => {
      const o = { fila: i + 1 };
      t.cols.forEach((c, j) => o[c] = t.v[i][j]);
      return o;
    }) };
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const datos = d.datos || {};
    if (d.tipo === "basicos") {
      if (BASICOS.some(c => !String(datos[c] == null ? "" : datos[c]).trim()) || ["TRUE", "FALSE"].indexOf(String(datos.virtual)) < 0) return { ok: false, error: "datos incompletos" };
      datos.virtual = String(datos.virtual) === "TRUE";
      const iId = t.cols.indexOf("id");
      const ids = propias.map(i => String(t.v[i][iId]).trim()).filter(Boolean);
      const objetivo = [];
      for (let i = 1; i < t.v.length; i++) {
        const mismoId = iId >= 0 && ids.indexOf(String(t.v[i][iId]).trim()) >= 0 && String(t.v[i][iId]).trim() !== "";
        if (mismoId || propias.indexOf(i) >= 0) objetivo.push(i);
      }
      BASICOS.forEach(c => {
        const j = t.cols.indexOf(c);
        if (j < 0 || !(c in datos)) return;
        objetivo.forEach(i => t.sh.getRange(i + 1, j + 1).setValue(typeof datos[c] === "boolean" ? datos[c] : clean_(datos[c])));
      });
      return { ok: true, filas: objetivo.length };
    }
    if (d.tipo === "fila") {
      const i = Number(d.fila) - 1;
      if (propias.indexOf(i) < 0) return { ok: false, error: "fila invalida" };
      if (!validarReunion_(datos)) return { ok: false, error: "datos incompletos" };
      escribirReunion_(t, i + 1, datos);
      return { ok: true, filas: 1 };
    }
    if (d.tipo === "nueva") {
      if (!validarReunion_(datos)) return { ok: false, error: "datos incompletos" };
      const base = propias.length ? t.v[propias[0]] : [];
      const fila = t.cols.map((c, j) => {
        if (REUNION.indexOf(c) >= 0) return "";
        if (c === "nombre") return base[j] || clean_(grupo);
        return base[j] || "";
      });
      t.sh.appendRow(fila);
      escribirReunion_(t, t.sh.getLastRow(), datos);
      return { ok: true, filas: 1 };
    }
    return { ok: false, error: "modo invalido" };
  } finally { lock.releaseLock(); }
}

function doGet(e) {
  try {
    const p = e.parameter || {};
    if (p.accion === "version") return json_({ version: "2026-11-09-auth-post" });
    if (p.accion === "grupos") return json_({ grupos: claves_().map(x => x.grupo) });
    if (["verificar", "datos", "editar"].indexOf(p.accion) >= 0) return json_({ ok: false, error: "use_post" });
    return json_({ error: "accion invalida" });
  } catch (err) {
    return json_({ error: "error" });
  }
}

function autorizar() {
  const c = DriveApp.getFolderById(CARPETA_FLYERS_ID);
  const s = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Eventos");
  const cal = CalendarApp.getCalendarById(CALENDARIO_ID);
  Logger.log("OK carpeta: " + c.getName() + " | hoja: " + s.getName() + " | calendario: " + (cal ? cal.getName() : "SIN ACCESO"));
}

const CARPETA_FLYERS_ID = "15AXKrIPjVMjH4fHJDYkOiDA_6H3y_216";
const aDMY_ = m => m[3] + "/" + m[2] + "/" + m[1];
const ISO_ = /^(\d{4})-(\d{2})-(\d{2})$/;

function archivarEventos() {
  const sh = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Eventos");
  const v = sh.getDataRange().getDisplayValues();
  const cols = v[0].map(norm_);
  const iE = cols.indexOf("estado"), iI = cols.indexOf("fecha inicio"), iF = cols.indexOf("fecha fin");
  if (iE < 0) throw new Error('Falta la columna "Estado" en la pestaña Eventos');
  const hoy = Utilities.formatDate(new Date(), "America/Bogota", "yyyy-MM-dd");
  const aIso = s => { const m = String(s || "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/); return m ? m[3] + "-" + m[2] + "-" + m[1] : ""; };
  let n = 0;
  for (let i = 1; i < v.length; i++) {
    const fin = aIso(v[i][iF]) || aIso(v[i][iI]);
    if (!fin) continue;
    // Solo archiva vencidos; nunca aprueba (Pendiente sigue Pendiente hasta que el admin lo apruebe)
    const nuevo = fin < hoy ? "Archivado" : (v[i][iE] === "" ? "Pendiente" : v[i][iE]);
    if (v[i][iE] !== nuevo) { sh.getRange(i + 1, iE + 1).setNumberFormat("@").setValue(nuevo); n++; }
  }
  Logger.log("Eventos actualizados: " + n);
}

// Ejecutar una vez: asigna ID único y aleatorio a las filas de Eventos que no lo tienen
function generarIdsEventos() {
  const sh = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Eventos");
  const v = sh.getDataRange().getDisplayValues();
  const iId = v[0].map(norm_).indexOf("id");
  if (iId < 0) throw new Error('Falta la columna "Id" en la pestaña Eventos');
  let n = 0;
  for (let i = 1; i < v.length; i++) if (!String(v[i][iId]).trim() && v[i].join("").trim()) { sh.getRange(i + 1, iId + 1).setNumberFormat("@").setValue(Utilities.getUuid()); n++; }
  Logger.log("IDs generados: " + n);
}

function migrarAPendiente() {
  const sh = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Eventos");
  const v = sh.getDataRange().getDisplayValues();
  const iE = v[0].map(norm_).indexOf("estado");
  if (iE < 0) throw new Error('Falta la columna "Estado" en la pestaña Eventos');
  let n = 0;
  for (let i = 1; i < v.length; i++) if (norm_(v[i][iE]) !== "archivado" && norm_(v[i][iE]) !== "pendiente") { sh.getRange(i + 1, iE + 1).setNumberFormat("@").setValue("Pendiente"); n++; }
  Logger.log("Eventos pasados a Pendiente: " + n);
}


function verificarAdmin_(clave) {
  const cache = CacheService.getScriptCache();
  const n = Number(cache.get("int_admin") || 0);
  if (n >= 5) return { ok: false, bloqueado: true };
  const real = String(SpreadsheetApp.openById(CLAVES_SHEET_ID).getSheetByName("ADMIN").getRange("A1").getValue()).trim();
  const ok = !!real && real === String(clave || "").trim();
  if (!ok) cache.put("int_admin", String(n + 1), 600);
  return { ok: ok };
}

const CARPETA_ACTAS_ID = "1NKvw6qkbdinNgoacZ6byNcCwJdon2xuU";

function carpetaActas_(id) {
  const carpeta = DriveApp.getFolderById(id);
  const pendientes = [carpeta];
  const vistos = {};
  while (pendientes.length) {
    const actual = pendientes.pop();
    const actualId = actual.getId();
    if (vistos[actualId]) continue;
    vistos[actualId] = true;
    if (actual.isTrashed()) continue;
    if (actualId === CARPETA_ACTAS_ID) return carpeta;
    const padres = actual.getParents();
    while (padres.hasNext()) pendientes.push(padres.next());
  }
  throw new Error("La carpeta no pertenece a la carpeta de actas.");
}

function carpetaMesActas_(id) {
  const mes = carpetaActas_(id);
  if (mes.getId() === CARPETA_ACTAS_ID) throw new Error("Selecciona primero una carpeta de año y después una de mes.");
  const padres = mes.getParents();
  while (padres.hasNext()) {
    const anio = padres.next();
    if (anio.isTrashed() || anio.getId() === CARPETA_ACTAS_ID) continue;
    const abuelos = anio.getParents();
    while (abuelos.hasNext()) {
      const abuelo = abuelos.next();
      if (abuelo.getId() === CARPETA_ACTAS_ID && !abuelo.isTrashed()) return mes;
    }
  }
  throw new Error("Solo se pueden subir actas en una carpeta de mes dentro de un año.");
}

function pdfsActas_(carpeta) {
  const archivos = carpeta.getFiles();
  const pdfs = [];
  while (archivos.hasNext()) {
    const archivo = archivos.next();
    if (!archivo.isTrashed() && (archivo.getMimeType() === "application/pdf" || /\.pdf$/i.test(archivo.getName()))) pdfs.push(archivo);
  }
  return pdfs;
}

function adminActas_(b) {
  const auth = verificarAdmin_(b.clave);
  if (!auth.ok) return auth;
  const carpeta = carpetaMesActas_(String(b.carpeta || ""));
  if (b.modo === "consultar") {
    const pdfs = pdfsActas_(carpeta);
    if (pdfs.length > 1) return { ok: false, error: "Hay varios PDF en esta carpeta. Revísalos en Drive antes de subir otro." };
    return { ok: true, archivo: pdfs.length ? { id: pdfs[0].getId(), nombre: pdfs[0].getName() } : null };
  }
  if (b.modo === "subir") {
    const nombre = String(b.nombre || "").trim();
    const base64 = String(b.contenido || "");
    if (!nombre || nombre.length > 200 || !/\.pdf$/i.test(nombre) || /[\/\\\u0000-\u001f\u007f]/.test(nombre)) {
      return { ok: false, error: "El nombre del archivo PDF no es válido." };
    }
    if (!base64 || base64.length > 6990508 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(base64)) {
      return { ok: false, error: "El archivo debe ser un PDF válido de máximo 5 MB." };
    }
    const bytes = Utilities.base64Decode(base64);
    if (bytes.length > 5 * 1024 * 1024 || bytes.length < 5 ||
        String.fromCharCode(...bytes.slice(0, 5).map(x => x & 255)) !== "%PDF-") {
      return { ok: false, error: "El archivo debe ser un PDF válido de máximo 5 MB." };
    }
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const destino = carpetaMesActas_(String(b.carpeta || ""));
      const pdfs = pdfsActas_(destino);
      if (pdfs.length > 1) return { ok: false, error: "Hay varios PDF en esta carpeta. Revísalos en Drive antes de subir otro." };
      const anterior = pdfs[0];
      if ((anterior ? anterior.getId() : "") !== String(b.anterior || "")) {
        return { ok: false, error: "El acta de esta carpeta cambió. Vuelve a abrir la carpeta antes de intentarlo." };
      }
      const nuevo = destino.createFile(Utilities.newBlob(bytes, "application/pdf", nombre));
      if (anterior) {
        try {
          anterior.setTrashed(true);
        } catch (error) {
          try { nuevo.setTrashed(true); }
          catch (limpieza) { throw new Error("No se pudo reemplazar ni retirar el nuevo archivo. Revisa la carpeta en Drive: " + limpieza.message); }
          throw new Error("No se pudo reemplazar el acta anterior: " + error.message);
        }
      }
      return { ok: true, archivo: { id: nuevo.getId(), nombre: nuevo.getName() } };
    } finally { lock.releaseLock(); }
  }
  return { ok: false, error: "Acción de actas no válida." };
}

function adminCarpetas_(b, permitirSubcarpetas) {
  const auth = verificarAdmin_(b.clave);
  if (!auth.ok) return auth;
  if (b.modo === "listar") {
    const carpeta = carpetaActas_(String(b.carpeta || CARPETA_ACTAS_ID));
    const iter = carpeta.getFolders();
    const carpetas = [];
    while (iter.hasNext()) {
      const hija = iter.next();
      if (!hija.isTrashed()) carpetas.push({ id: hija.getId(), nombre: hija.getName() });
    }
    carpetas.sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { numeric: true, sensitivity: "base" }));
    return { ok: true, carpeta: { id: carpeta.getId(), nombre: carpeta.getName() }, carpetas: carpetas };
  }
  if (b.modo === "crear") {
    const nombre = String(b.nombre || "").trim();
    if (!nombre || nombre.length > 100 || /[\u0000-\u001f\u007f]/.test(nombre)) {
      return { ok: false, error: "Ingresa un nombre válido de hasta 100 caracteres." };
    }
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const carpeta = carpetaActas_(permitirSubcarpetas ? String(b.carpeta || CARPETA_ACTAS_ID) : CARPETA_ACTAS_ID);
      const existentes = carpeta.getFoldersByName(nombre);
      while (existentes.hasNext()) {
        if (!existentes.next().isTrashed()) return { ok: false, error: "Ya existe una carpeta con ese nombre." };
      }
      const creada = carpeta.createFolder(nombre);
      return { ok: true, carpeta: { id: creada.getId(), nombre: creada.getName() } };
    } finally { lock.releaseLock(); }
  }
  return { ok: false, error: "Acción de carpetas no válida." };
}

function admin_(b) {
  const auth = verificarAdmin_(b.clave);
  if (!auth.ok) return auth;
  const sh = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Eventos");
  const cols = sh.getRange(1, 1, 1, sh.getLastColumn()).getDisplayValues()[0].map(norm_);
  const iE = cols.indexOf("estado");
  if (iE < 0) return { ok: false, error: 'falta la columna "Estado"' };
  if (b.modo === "aprobar") {
    const fila = Number(b.fila);
    if (!(fila >= 2 && fila <= sh.getLastRow())) return { ok: false, error: "evento no encontrado" };
    sh.getRange(fila, iE + 1).setNumberFormat("@").setValue("Activo");
    return { ok: true };
  }
  const v = sh.getDataRange().getDisplayValues(), out = [];
  for (let i = 1; i < v.length; i++) {
    if (!v[i].join("").trim()) continue;
    const st = norm_(v[i][iE]);
    if (st === "activo" || st === "archivado") continue;
    const o = { fila: i + 1 };
    cols.forEach((c, j) => o[c] = v[i][j]);
    out.push(o);
  }
  return { ok: true, eventos: out };
}

function programarArchivo() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === "archivarEventos").forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("archivarEventos").timeBased().everyDays(1).atHour(3).inTimezone("America/Bogota").create();
  archivarEventos();
}

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


function sincronizarCalendario_(accion, previo, d, ini, fin, grupo, idCal, hIni, hFin) {
  try {
    const cal = CalendarApp.getCalendarById(CALENDARIO_ID);
    if (!cal) return { id: "", error: "sin acceso al calendario " + CALENDARIO_ID + " (compártelo con la cuenta del script)" };
    if (accion === "eliminar") { const e = buscarEnCalendario_(cal, previo, idCal); if (!e) return { id: "", error: "no se encontró el evento en el calendario (bórralo a mano ahí)" }; e.deleteEvent(); return { id: "" }; }
    const inicio = aFecha_(ini), finExcl = new Date(aFecha_(fin).getTime() + 86400000); // fin exclusivo en eventos de día completo
    const conHora = !!hIni;
    const tIni = conHora ? Utilities.parseDate(ini[0] + " " + hIni, "America/Bogota", "yyyy-MM-dd HH:mm") : null;
    const tFin = conHora ? Utilities.parseDate(fin[0] + " " + hFin, "America/Bogota", "yyyy-MM-dd HH:mm") : null;
    const opts = { location: String(d.direccion || ""), description: String(d.mensaje || "") + "\nContacto: " + d.contacto + "\nGrupo: " + grupo };
    const titulo = tituloCal_(d.nombre, grupo);
    let e = accion === "editar" ? buscarEnCalendario_(cal, previo, idCal) : null;
    if (e) {
      e.setTitle(titulo);
      if (conHora) e.setTime(tIni, tFin); else e.setAllDayDates(inicio, finExcl);
      e.setLocation(opts.location); e.setDescription(opts.description);
    } else e = conHora ? cal.createEvent(titulo, tIni, tFin, opts) : cal.createAllDayEvent(titulo, inicio, finExcl, opts);
    return { id: e.getId() };
  } catch (x) { return { id: "", error: String(x && x.message || x) }; }
}


function evento_(b) {
  const auth = verificar_(b.grupo, b.clave, b.token);
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
  if (modo === "listar") return { ok: true, eventos: propias().filter(x => norm_(x.estado) !== "archivado") };

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
    // Horas solo para eventos de un mismo día; en varios días quedan vacías (día completo)
    const mismoDia = ini[0] === fin[0];
    const hIni = mismoDia ? String(d["hora inicio"] || "") : "", hFin = mismoDia ? String(d["hora fin"] || "") : "";
    if (mismoDia && (!/^\d{2}:\d{2}$/.test(hIni) || !/^\d{2}:\d{2}$/.test(hFin) || hFin <= hIni)) return { ok: false, error: "horas invalidas" };
    // Mínimo 15 días de anticipación (hora de Bogotá); al editar solo si cambia la fecha de inicio
    const lim = new Date(); lim.setDate(lim.getDate() + 15);
    const cambiaIni = !previo || previo["fecha inicio"] !== aDMY_(ini);
    if (cambiaIni && ini[0] < Utilities.formatDate(lim, "America/Bogota", "yyyy-MM-dd")) return { ok: false, error: "fecha" };


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

    const cs = sincronizarCalendario_(modo, previo, d, ini, fin, b.grupo, previo && previo["calendario id"], hIni, hFin);
    const idCal = cs.id;
    // Al editar, un evento ya aprobado sigue aprobado; solo vuelve a Pendiente si se sube un flyer nuevo
    const estado = modo === "editar" && previo && norm_(previo.estado) === "activo" && !d.flyer ? "Activo" : "Pendiente";
    const val = {
      id: previo && previo.id ? previo.id : Utilities.getUuid(),
      "fecha inicio": aDMY_(ini), "hora inicio": hIni, "fecha fin": aDMY_(fin), "hora fin": hFin, nombre: d.nombre, mensaje: d.mensaje,
      flyer: flyer, direccion: d.direccion, contacto: d.contacto, grupo: b.grupo, "calendario id": idCal, estado: estado
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
    if (d.accion === "grupo") {
      try { return json_(grupo_(d)); }
      catch (err1) { return json_({ ok: false, error: "servidor: " + err1.message }); }
    }
    if (d.accion === "evento") {
      try { return json_(evento_(d)); }
      catch (err2) { return json_({ ok: false, error: "servidor: " + err2.message }); }
    }
    if (d.accion === "admin") {
      try { return json_(admin_(d)); }
      catch (err3) { return json_({ ok: false, error: "servidor: " + err3.message }); }
    }
    if (d.accion === "admin_carpetas") {
      try { return json_(adminCarpetas_(d)); }
      catch (err4) { return json_({ ok: false, error: "servidor: " + err4.message }); }
    }
    if (d.accion === "admin_carpetas_v2") {
      try { return json_(adminCarpetas_(d, true)); }
      catch (err5) { return json_({ ok: false, error: "servidor: " + err5.message }); }
    }
    if (d.accion === "admin_actas") {
      try { return json_(adminActas_(d)); }
      catch (err6) { return json_({ ok: false, error: "servidor: " + err6.message }); }
    }
    return json_({ ok: false, error: "accion no valida" });
  } catch (err) {
    return json_({ ok: false, error: "solicitud invalida" });
  }
}
