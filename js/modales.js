// Ventanas modales cuyo contenido vive en modales/<nombre>.html y se carga al hacer clic en [data-modal="nombre"].
(() => {
  const modal = document.createElement("div");
  modal.className = "auth-modal";
  modal.hidden = true;
  modal.innerHTML = '<div class="auth-box" role="dialog" aria-modal="true"><button type="button" class="auth-close" aria-label="Cerrar">&times;</button><div class="modal-body"></div></div>';
  const body = modal.querySelector(".modal-body");
  const cerrar = () => { modal.hidden = true; body.innerHTML = ""; };
  modal.querySelector(".auth-close").addEventListener("click", cerrar); // solo se cierra con la X
  document.addEventListener("DOMContentLoaded", () => document.body.appendChild(modal));

  const esSi = v => ["si", "s", "x", "true", "1", "virtual"].includes(norm(v));
  const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo", "Festivos"];
  const BASICOS = [["direccion", "Dirección"], ["barrio", "Barrio"], ["localidad", "Localidad"], ["virtual", "Virtual"], ["link maps", "Link de Google Maps"]];

  // Convierte "7:00 PM", "19:00:00" o "8:00 p.m." a HH:MM para <input type="time">
  const aHHMM = s => {
    const m = String(s || "").match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*([ap])?/i);
    if (!m) return "";
    let h = +m[1];
    if (m[3]) { const pm = m[3].toLowerCase() === "p"; if (pm && h < 12) h += 12; if (!pm && h === 12) h = 0; }
    return String(h).padStart(2, "0") + ":" + m[2];
  };

  // Panel de edición: pregunta si el cambio es de datos básicos (todo el grupo) o de una reunión (una sola fila)
  function editor(panel, api, grupo, clave) {
    const base = `${api}?grupo=${encodeURIComponent(grupo)}&clave=${encodeURIComponent(clave)}`;
    let filas = [];
    const aviso = (t, x) => `<p class="msg ${t}">${esc(x)}</p>`;
    const titulo = `<h3>${esc(grupo)}</h3>`;

    async function cargar() {
      panel.innerHTML = titulo + "<p>Cargando…</p>";
      try {
        const j = await (await fetch(`${base}&accion=datos`)).json();
        if (!j.ok) throw new Error();
        filas = j.filas;
        inicio();
      } catch { panel.innerHTML = titulo + aviso("err", "No se pudieron cargar los datos del grupo."); }
    }

    function inicio(ok) {
      panel.innerHTML = titulo + (ok ? aviso("ok", ok) : "") +
        '<p><strong>¿Qué deseas modificar?</strong></p>' +
        '<button type="button" class="btn" data-a="basicos">Datos básicos del grupo</button> ' +
        '<button type="button" class="btn" data-a="reuniones">Modificar horario o reunión existente</button> ' +
        '<button type="button" class="btn" data-a="nueva">Agregar nueva reunión</button>';
      panel.querySelector('[data-a=basicos]').onclick = basicos;
      panel.querySelector('[data-a=reuniones]').onclick = lista;
      panel.querySelector('[data-a=nueva]').onclick = () => reunion({}, true);
    }

    function basicos() {
      const f0 = filas[0] || {};
      panel.innerHTML = titulo + '<p><strong>Datos básicos</strong> (se aplican a todo el grupo)</p><form class="ed">' +
        BASICOS.map(([k, t]) => k === "virtual"
          ? `<label>${t}<select name="virtual" required><option value="">Selecciona…</option><option value="TRUE" ${esSi(f0[k]) ? "selected" : ""}>TRUE</option><option value="FALSE" ${f0[k] && !esSi(f0[k]) ? "selected" : ""}>FALSE</option></select></label>`
          : `<label>${t}<input name="${k}" required value="${esc(f0[k] || "")}"></label>`).join("") +
        '<button class="btn" type="submit">Guardar</button> <button class="btn sec" type="button" data-v>Volver</button><div class="res"></div></form>';
      panel.querySelector("[data-v]").onclick = () => inicio();
      panel.querySelector("form").onsubmit = ev => { ev.preventDefault(); guardar("basicos", "", ev.target, BASICOS.map(b => b[0]), "Datos básicos actualizados en todo el grupo."); };
    }

    function lista() {
      panel.innerHTML = titulo + '<p><strong>Modificar horario o reunión existente</strong></p>' +
        (filas.length ? filas.map((f, i) => `<button type="button" class="btn fila" data-i="${i}">${esc(f.dia || "—")} · ${esc(f["hora inicio"] || "")} – ${esc(f["hora fin"] || "")} · ${esc(f.tipo || "")}</button>`).join("") : "<p>Este grupo no tiene reuniones.</p>") +
        '<button class="btn sec" type="button" data-v>Volver</button>';
      panel.querySelector("[data-v]").onclick = () => inicio();
      panel.querySelectorAll(".fila").forEach(b => b.onclick = () => reunion(filas[b.dataset.i]));
    }

    function reunion(f, nueva) {
      const dn = norm(f.dia);
      const horas = [];
      for (let m = 0; m < 1440; m += 30) horas.push(String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"));
      const h = n => {
        const v = aHHMM(f[n]);
        const lista = v && !horas.includes(v) ? [...horas, v].sort() : horas; // conserva una hora existente que no sea múltiplo de 30
        return `<select name="${n}" required><option value="">Selecciona…</option>${lista.map(x => `<option ${x === v ? "selected" : ""}>${x}</option>`).join("")}</select>`;
      };
      panel.innerHTML = titulo + `<p><strong>${nueva ? "Agregar nueva reunión" : "Modificar horario o reunión existente"}</strong> ${nueva ? "(usa los datos básicos del grupo)" : ""}</p><form class="ed">` +
        `<label>Día<select name="dia" required>${nueva ? '<option value="">Selecciona…</option>' : ""}${DIAS.map(d => `<option ${norm(d) === dn ? "selected" : ""}>${d}</option>`).join("")}</select></label>` +
        `<label>Hora inicio (24 h)${h("hora inicio")}</label>` +
        `<label>Hora fin (24 h)${h("hora fin")}</label>` +
        `<label>Tipo<select name="tipo" required><option value="">Selecciona…</option>${["Abierta", "Cerrada"].map(t => `<option ${norm(t) === norm(f.tipo) ? "selected" : ""}>${t}</option>`).join("")}</select></label>` +
        `<label>Intereses comunes (opcional)<input name="intereses comunes" value="${esc(f["intereses comunes"] || "")}"></label>` +
        `<label>Formato (opcional)<input name="formato" value="${esc(f.formato || "")}"></label>` +
        '<button class="btn" type="submit">Guardar</button> <button class="btn sec" type="button" data-v>Volver</button><div class="res"></div></form>';
      panel.querySelector("[data-v]").onclick = () => nueva ? inicio() : lista();
      panel.querySelector("form").onsubmit = ev => { ev.preventDefault(); guardar(nueva ? "nueva" : "fila", f.fila || 0, ev.target, ["dia", "hora inicio", "hora fin", "tipo", "intereses comunes", "formato"], nueva ? "Reunión agregada." : "Reunión actualizada."); };
    }

    async function guardar(modo, fila, form, campos, okMsg) {
      const res = form.querySelector(".res"), btn = form.querySelector("[type=submit]");
      const datos = {};
      campos.forEach(c => datos[c] = form.elements[c].value.trim());
      btn.disabled = true;
      try {
        const j = await (await fetch(`${base}&accion=editar&modo=${modo}&fila=${fila}&datos=${encodeURIComponent(JSON.stringify(datos))}`)).json();
        if (!j.ok) throw new Error();
        // La lista pública se guarda en caché local: se borra para ver el cambio de inmediato
        Object.keys(localStorage).filter(k => k.startsWith("na_sheet_")).forEach(k => localStorage.removeItem(k));
        const nuevo = await (await fetch(`${base}&accion=datos`)).json();
        if (nuevo.ok) filas = nuevo.filas;
        inicio(okMsg);
      } catch { res.innerHTML = aviso("err", "No se pudo guardar. Intenta de nuevo."); btn.disabled = false; }
    }

    cargar();
  }

  const iniciadores = {
    literatura() {
      const form = body.querySelector("form");
      if (!form) return;
      const msg = form.querySelector(".msg");
      const show = (t, x) => { msg.className = "msg " + t; msg.textContent = x; };
      form.addEventListener("submit", async e => {
        e.preventDefault();
        if (form.website.value) return; // honeypot anti-spam
        if (!window.NA_USER) { show("err", "Debes ingresar con tu cuenta."); return; }
        if (!CONFIG.ORDERS_URL) { show("err", "El envío de pedidos aún no está configurado."); return; }
        const btn = form.querySelector("[type=submit]");
        btn.disabled = true;
        const u = window.NA_USER;
        try {
          // text/plain evita el preflight CORS con Apps Script
          await fetch(CONFIG.ORDERS_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ nombre: u.nombre, contacto: form.telefono.value.trim(), cuenta: u.email || u.uid, items: [], grupo: "", notas: "" }) });
          show("ok", "¡Pedido enviado! Nos pondremos en contacto contigo.");
          form.reset();
        } catch { show("err", "No se pudo enviar el pedido. Intenta nuevamente."); }
        finally { btn.disabled = false; }
      });
    },
    ajustes() {
      const u = window.NA_USER;
      const el = body.querySelector("#ajustes-cuenta");
      if (u && el) el.textContent = [u.nombre, u.email].filter(Boolean).join(" · ");

      const form = body.querySelector("#ajustes-acceso");
      const panel = body.querySelector("#ajustes-panel");
      if (!form) return;
      accesoGrupo(form, (grupo, clave) => {
        body.querySelector("#ajustes-grupo").textContent = grupo;
        panel.hidden = false;
        editor(panel, CONFIG.ORDERS_URL, grupo, clave);
      });
    },
    evento() {
      if (!window.NA_USER) { cerrar(); return; }
      const form = body.querySelector("#evento-acceso");
      const panel = body.querySelector("#evento-panel");
      if (!form) return;
      accesoGrupo(form, (grupo, clave) => eventosPanel(panel, grupo, clave));
    }
  };

  // Panel de eventos del grupo: crear, editar o eliminar (todo pasa por el Apps Script con grupo+clave)
  function eventosPanel(panel, grupo, clave) {
    const api = CONFIG.ORDERS_URL;
    const titulo = `<h3>${esc(grupo)}</h3>`;
    const aviso = (t, x) => `<p class="msg ${t}">${esc(x)}</p>`;
    const iso = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    const minD = new Date(); minD.setDate(minD.getDate() + 15);
    const min = iso(minD);
    const aISO = s => { const m = String(s || "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/); return m ? `${m[3]}-${m[2]}-${m[1]}` : ""; };
    panel.hidden = false;

    // text/plain evita el preflight CORS con Apps Script
    async function llamar(cuerpo) {
      const r = await fetch(api, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ accion: "evento", grupo, clave, ...cuerpo }) });
      const txt = await r.text();
      console.log("[evento] respuesta del servidor:", r.status, txt);
      let j;
      try { j = JSON.parse(txt); } catch { throw new Error("respuesta inválida (¿publicaste la nueva versión del Apps Script?)"); }
      if (!j.ok) { const er = new Error(j.error || "error"); er.cruce = j.cruce; throw er; }
      return j;
    }
    const refrescar = () => {
      Object.keys(localStorage).filter(k => k.startsWith("na_sheet_")).forEach(k => localStorage.removeItem(k));
      if (typeof window.cargarEventos === "function") window.cargarEventos();
    };

    // Reduce la imagen (máx. 1000 px, JPEG) para poder enviarla al servidor
    const comprimir = file => new Promise((ok, ko) => {
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => {
        const k = Math.min(1, 1000 / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        ok(c.toDataURL("image/jpeg", 0.8).split(",")[1]);
      };
      img.onerror = () => ko(new Error("no se pudo leer la imagen"));
      img.src = url;
    });

    function inicio(ok) {
      panel.innerHTML = titulo + (ok ? aviso("ok", ok) : "") + '<p><strong>¿Qué deseas hacer?</strong></p>' +
        '<button type="button" class="btn" data-a="nuevo">Agregar evento</button> <button type="button" class="btn" data-a="editar">Editar o eliminar un evento</button>';
      panel.querySelector("[data-a=nuevo]").onclick = () => formulario(null);
      panel.querySelector("[data-a=editar]").onclick = lista;
    }

    async function lista() {
      panel.innerHTML = titulo + "<p>Cargando…</p>";
      try {
        const { eventos } = await llamar({ modo: "listar" });
        panel.innerHTML = titulo + "<p><strong>Tus eventos</strong></p>" +
          (eventos.length ? eventos.map((e, i) => `<button type="button" class="btn fila" data-i="${i}">${esc(e["fecha inicio"])} · ${esc(e.nombre)}</button>`).join("") : "<p>Tu grupo no tiene eventos.</p>") +
          '<button class="btn sec" type="button" data-v>Volver</button>';
        panel.querySelector("[data-v]").onclick = () => inicio();
        panel.querySelectorAll(".fila").forEach(b => b.onclick = () => formulario(eventos[b.dataset.i]));
      } catch (e) { panel.innerHTML = titulo + aviso("err", "No se pudieron cargar los eventos: " + e.message); }
    }

    function formulario(ev) {
      const nuevo = !ev, v = ev || {};
      panel.innerHTML = titulo + `<p><strong>${nuevo ? "Agregar evento" : "Editar evento"}</strong></p><p>La fecha de inicio debe ser con al menos 15 días de anticipación${nuevo ? "" : " (solo si la cambias)"}.</p><form class="ed">` +
        `<label>Fecha inicio<input type="date" name="fecha inicio" ${nuevo ? `min="${min}"` : ""} value="${esc(aISO(v["fecha inicio"]))}" required></label>` +
        `<label>Fecha fin<input type="date" name="fecha fin" value="${esc(aISO(v["fecha fin"]))}" required></label>` +
        `<label>Nombre del evento<input name="nombre" required maxlength="150" value="${esc(v.nombre || "")}"></label>` +
        `<label>Mensaje (aparece debajo del evento)<textarea name="mensaje" rows="3" maxlength="500" required>${esc(v.mensaje || "")}</textarea></label>` +
        `<label>Flyer (imagen)${nuevo ? "" : " — déjalo vacío para conservar el actual"}<input type="file" name="flyer" accept="image/*" ${nuevo ? "required" : ""}></label>` +
        `<label>Dirección<input name="direccion" required maxlength="200" value="${esc(v.direccion || "")}"></label>` +
        `<label>Número de contacto<input type="tel" name="contacto" required maxlength="30" pattern="[0-9+\\(\\)\\s\\-]{7,30}" value="${esc(v.contacto || "")}"></label>` +
        '<button class="btn" type="submit">Guardar</button> ' + (nuevo ? "" : '<button class="btn sec" type="button" data-del>Eliminar evento</button> ') +
        '<button class="btn sec" type="button" data-v>Volver</button><div class="res"></div></form>';
      const f = panel.querySelector("form"), res = f.querySelector(".res");
      const err = t => { res.innerHTML = aviso("err", t); };
      panel.querySelector("[data-v]").onclick = () => nuevo ? inicio() : lista();
      const del = panel.querySelector("[data-del]");
      if (del) del.onclick = async () => {
        if (!confirm("¿Eliminar este evento? No se puede deshacer.")) return;
        del.disabled = true;
        try { const r = await llamar({ modo: "eliminar", fila: v.fila }); refrescar(); inicio(r.errorCalendario ? "Evento eliminado, pero NO del calendario: " + r.errorCalendario : "Evento eliminado."); }
        catch (e) { console.error("[evento] error al eliminar:", e); err("No se pudo eliminar: " + e.message); del.disabled = false; }
      };
      f.onsubmit = async e => {
        e.preventDefault();
        const ini = f.elements["fecha inicio"].value, fin = f.elements["fecha fin"].value;
        if ((nuevo || ini !== aISO(v["fecha inicio"])) && ini < min) return err("El evento debe empezar con al menos 15 días de anticipación.");
        if (fin < ini) return err("La fecha fin no puede ser anterior a la fecha inicio.");
        const btn = f.querySelector("[type=submit]");
        btn.disabled = true;
        res.innerHTML = "<p>Guardando…</p>";
        try {
          const datos = {};
          ["fecha inicio", "fecha fin", "nombre", "mensaje", "direccion", "contacto"].forEach(c => datos[c] = f.elements[c].value.trim());
          const file = f.elements.flyer.files[0];
          if (file) datos.flyer = await comprimir(file);
          const r = await llamar({ modo: nuevo ? "crear" : "editar", fila: v.fila || 0, datos, confirmarCruce: !!(f.elements.cruce && f.elements.cruce.checked) });
          refrescar();
          if (r.errorCalendario) console.error("[evento] calendario:", r.errorCalendario);
          const base = nuevo ? "Evento agregado." : "Evento actualizado.";
          inicio(r.errorCalendario ? `${base} Pero NO se pudo agregar al calendario: ${r.errorCalendario}` : base);
        } catch (e2) {
          btn.disabled = false;
          if (e2.cruce) {
            const c = e2.cruce, fechas = c.fin && c.fin !== c.inicio ? `del ${c.inicio} al ${c.fin}` : `el ${c.inicio}`;
            res.innerHTML = aviso("err", `Se sugiere crear el evento en otra fecha, ya que el grupo ${c.grupo} tiene el evento "${c.nombre}" ${fechas}.`) +
              '<label class="chk"><input type="checkbox" name="cruce"> Comprendí el mensaje y deseo crear el evento de todos modos</label>';
            f.elements.cruce.onchange = () => { btn.disabled = !f.elements.cruce.checked; };
            btn.disabled = true;
            return;
          }
          console.error("[evento] error al guardar:", e2);
          err(e2.message === "fecha" ? "El evento debe empezar con al menos 15 días de anticipación." : "No se pudo guardar: " + e2.message);
        }
      };
    }

    inicio();
  }

  // Formulario grupo + clave: carga los grupos, verifica en el servidor y llama onOk(grupo, clave)
  function accesoGrupo(form, onOk) {
    form.querySelector(".ojo").addEventListener("click", ev => {
      const ver = form.clave.type === "password";
      form.clave.type = ver ? "text" : "password";
      ev.currentTarget.style.opacity = ver ? "1" : ".6";
      ev.currentTarget.setAttribute("aria-label", ver ? "Ocultar clave" : "Mostrar clave");
    });
    const msg = form.querySelector(".msg");
    const sel = form.grupo;
    const api = CONFIG.ORDERS_URL;

    // Las claves nunca llegan al navegador: el servidor (Apps Script) solo lista grupos y verifica.
    if (!api) sel.innerHTML = '<option value="">Servicio no configurado</option>';
    else fetchGrupos(true)
      .then(gs => {
        sel.innerHTML = '<option value="">Selecciona tu grupo</option>' +
          gs.map(g => `<option value="${esc(g)}">${esc(g)}</option>`).join("");
      })
      .catch(() => { sel.innerHTML = '<option value="">No se pudieron cargar los grupos</option>'; });

    form.addEventListener("submit", async e => {
      e.preventDefault();
      const btn = form.querySelector("[type=submit]");
      btn.disabled = true;
      msg.className = "msg";
      try {
        const r = await fetch(`${api}?accion=verificar&grupo=${encodeURIComponent(sel.value)}&clave=${encodeURIComponent(form.clave.value)}`);
        const j = await r.json();
        if (j.ok) {
          form.hidden = true;
          onOk(sel.value, form.clave.value);
        } else {
          msg.className = "msg err";
          msg.textContent = j.bloqueado ? "Demasiados intentos. Espera unos minutos." : "Grupo o clave incorrectos.";
          form.clave.value = "";
        }
      } catch {
        msg.className = "msg err";
        msg.textContent = "No se pudo verificar. Intenta de nuevo.";
      } finally { btn.disabled = false; }
    });
  }

  document.addEventListener("click", async e => {
    const a = e.target.closest("[data-modal]");
    if (!a) return;
    e.preventDefault();
    const nombre = a.dataset.modal;
    if (!/^[a-z0-9_-]+$/i.test(nombre)) return;
    // Agregar/editar eventos exige sesión iniciada: si no la hay, abre el inicio de sesión
    if (nombre === "evento" && !window.NA_USER) {
      const entrar = document.getElementById("entrar");
      if (entrar) entrar.click(); else alert("Inicia sesión para agregar o editar eventos.");
      return;
    }
    document.querySelector(".nav")?.classList.remove("open");
    document.querySelector(".menu-toggle")?.classList.remove("open");
    try {
      const res = await fetch(`modales/${nombre}.html`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      body.innerHTML = await res.text();
      modal.hidden = false;
      iniciadores[nombre]?.();
    } catch {
      body.innerHTML = "<p>No se pudo cargar la ventana. Abre el sitio desde un servidor (http://localhost).</p>";
      modal.hidden = false;
    }
  });
})();
