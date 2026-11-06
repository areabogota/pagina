(() => {
  const login = document.getElementById("admin-login");
  const signIn = document.getElementById("admin-sign-in");
  const status = document.getElementById("admin-auth-status");
  const form = document.getElementById("admin-acceso");
  const password = form.elements.clave;
  const eye = form.querySelector(".ojo");
  const message = form.querySelector(".msg");
  const content = document.getElementById("admin-content");
  const panel = document.getElementById("admin-panel");
  const list = document.getElementById("admin-eventos-lista");
  let clave = "";
  let authVersion = 0;

  async function llamar(claveAdmin, cuerpo) {
    const r = await fetch(CONFIG.API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ accion: "admin", clave: claveAdmin, ...cuerpo })
    });
    if (!r.ok) throw new Error("No se pudo conectar con el servidor. Intenta de nuevo.");
    let j;
    try { j = await r.json(); } catch { throw new Error("Respuesta inválida del servidor."); }
    if (j.bloqueado) throw new Error("Demasiados intentos. Espera unos minutos.");
    if (!j.ok) throw new Error(j.error || "Clave incorrecta.");
    return j;
  }

  function mostrarError(elemento, texto) {
    elemento.textContent = texto;
    elemento.hidden = !texto;
  }

  document.addEventListener("na-auth", e => {
    authVersion++;
    clave = "";
    password.value = "";
    content.hidden = true;
    panel.hidden = true;
    list.innerHTML = "";
    login.hidden = false;
    form.hidden = !e.detail;
    signIn.hidden = !!e.detail;
    status.textContent = e.detail ? "Ingresa la clave de administrador." : "Inicia sesión y luego ingresa la clave de administrador.";
    mostrarError(message, "");
  });

  signIn.addEventListener("click", () => {
    const entrar = document.getElementById("entrar");
    if (entrar) entrar.click();
    else status.textContent = "No se pudo iniciar sesión. Recarga la página e intenta de nuevo.";
  });

  eye.addEventListener("click", () => {
    const mostrar = password.type === "password";
    password.type = mostrar ? "text" : "password";
    eye.setAttribute("aria-label", mostrar ? "Ocultar clave" : "Mostrar clave");
    eye.title = mostrar ? "Ocultar clave" : "Mostrar clave";
  });

  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (!window.NA_USER) return;
    const btn = form.querySelector("[type=submit]");
    const version = authVersion;
    const intento = password.value;
    btn.disabled = true;
    mostrarError(message, "");
    try {
      await llamar(intento, { modo: "listar" });
      if (version !== authVersion || !window.NA_USER) return;
      clave = intento;
      password.value = "";
      login.hidden = true;
      content.hidden = false;
    } catch (error) {
      if (version === authVersion) mostrarError(message, error.message || "No se pudo verificar la clave. Intenta de nuevo.");
    } finally {
      btn.disabled = false;
    }
  });

  document.getElementById("admin-eventos").addEventListener("click", async e => {
    if (!clave) return;
    const version = authVersion;
    const btn = e.currentTarget;
    btn.disabled = true;
    panel.hidden = false;
    list.textContent = "Cargando eventos…";
    try {
      const resultado = await llamar(clave, { modo: "listar" });
      if (version !== authVersion || !clave) return;
      if (!Array.isArray(resultado.eventos)) throw new Error("La lista de eventos no es válida.");
      const fechas = evento => evento["fecha fin"] && evento["fecha fin"] !== evento["fecha inicio"] ? `${esc(evento["fecha inicio"])} al ${esc(evento["fecha fin"])}` : esc(evento["fecha inicio"]);
      const pendientes = resultado.eventos.filter(evento => !["activo", "archivado"].includes(norm(evento.estado)));
      list.innerHTML = `<div class="admin-wrap"><table class="admin-tabla">
        <thead><tr><th>Flyer</th><th>Evento</th><th>Información</th><th>Estado</th></tr></thead>
        <tbody>${pendientes.map(evento => {
          const img = safeUrl(evento.flyer);
          return `<tr data-fila="${Number(evento.fila)}">
            <td>${img ? `<img src="${img}" alt="Flyer" loading="lazy" referrerpolicy="no-referrer">` : "—"}</td>
            <td><strong>${esc(evento.nombre)}</strong><br>${esc(evento.grupo)}<br>${fechas(evento)}</td>
            <td>${esc(evento.mensaje)}<br><small>${ICO.pin} ${esc(evento.direccion)}<br>${ICO.tel} ${esc(evento.contacto)}</small></td>
            <td class="admin-estado"><span class="chip pendiente">Pendiente</span><br><button type="button" class="btn" data-aprobar>Aprobar</button></td>
          </tr>`;
        }).join("") || '<tr><td colspan="4">No hay eventos pendientes.</td></tr>'}</tbody></table></div><p class="msg err" role="alert" hidden></p>`;
    } catch (error) {
      if (version === authVersion) list.textContent = error.message || "No se pudieron cargar los eventos. Intenta de nuevo.";
    } finally {
      btn.disabled = false;
    }
  });

  list.addEventListener("click", async e => {
    const img = e.target.closest(".admin-tabla img");
    if (img) {
      const lightbox = document.createElement("div");
      lightbox.className = "auth-modal admin-lightbox";
      lightbox.innerHTML = `<img src="${img.src}" alt="Flyer ampliado" referrerpolicy="no-referrer"><button type="button" class="auth-close" aria-label="Cerrar">&times;</button>`;
      lightbox.addEventListener("click", () => lightbox.remove());
      document.body.appendChild(lightbox);
      return;
    }
    const btn = e.target.closest("[data-aprobar]");
    if (!btn || !clave) return;
    const version = authVersion;
    const row = btn.closest("tr");
    const msg = list.querySelector(".msg");
    btn.disabled = true;
    mostrarError(msg, "");
    try {
      await llamar(clave, { modo: "aprobar", fila: Number(row.dataset.fila) });
      if (version !== authVersion || !clave) return;
      row.querySelector(".admin-estado").innerHTML = '<span class="chip aprobado">Aprobado</span>';
      Object.keys(localStorage).filter(k => k.startsWith("na_sheet_")).forEach(k => localStorage.removeItem(k));
    } catch (error) {
      if (version === authVersion) mostrarError(msg, error.message || "No se pudo aprobar el evento. Intenta de nuevo.");
      btn.disabled = false;
    }
  });
})();
