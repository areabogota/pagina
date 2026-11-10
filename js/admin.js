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
  const cards = content.querySelector(".admin-cards");
  const volverPanel = document.getElementById("admin-volver-panel");
  const proximamente = document.getElementById("admin-proximamente");
  const carpetasPanel = document.getElementById("admin-carpetas-panel");
  const carpetasRuta = document.getElementById("admin-carpetas-ruta");
  const carpetasLista = document.getElementById("admin-carpetas-lista");
  const carpetasMensaje = document.getElementById("admin-carpetas-mensaje");
  const carpetasVolver = document.getElementById("admin-carpetas-volver");
  const carpetasCrear = document.getElementById("admin-carpetas-crear");
  const carpetasForm = document.getElementById("admin-carpetas-form");
  const carpetasNombreLabel = document.getElementById("admin-carpetas-nombre-label");
  const carpetasDestino = document.getElementById("admin-carpetas-destino");
  const carpetasCancelar = document.getElementById("admin-carpetas-cancelar");
  const actaSeccion = document.getElementById("admin-acta-subida");
  const actaActual = document.getElementById("admin-acta-actual");
  const actaForm = document.getElementById("admin-acta-form");
  let archivoActa = null;
  const actas = document.getElementById("admin-actas");
  let rutaCarpetas = [];
  let carpetasOcupado = false;
  let solicitudCarpetas = 0;
  let solicitudEventos = 0;
  let botonAnterior = null;
  let clave = "";
  let authVersion = 0;

  async function llamar(claveAdmin, cuerpo, accion = "admin") {
    const r = await fetch(CONFIG.API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ accion, clave: claveAdmin, ...cuerpo })
    });
    if (!r.ok) throw new Error("No se pudo conectar con el servidor. Intenta de nuevo.");
    let j;
    try { j = await r.json(); } catch { throw new Error("Respuesta inválida del servidor."); }
    if (j.bloqueado) throw new Error("Demasiados intentos. Espera unos minutos.");
    if (!j.ok) {
      if (["admin_carpetas_v2", "admin_actas"].includes(accion) && j.error === "accion no valida") {
        throw new Error("Actualiza y despliega la nueva versión de Apps Script para administrar las actas.");
      }
      throw new Error(j.error || "Clave incorrecta.");
    }
    return j;
  }

  function mostrarError(elemento, texto) {
    elemento.textContent = texto;
    elemento.hidden = !texto;
  }

  function mostrarSeccion(seccion, boton) {
    botonAnterior = boton;
    cards.hidden = true;
    volverPanel.hidden = false;
    panel.hidden = seccion !== panel;
    carpetasPanel.hidden = seccion !== carpetasPanel;
    proximamente.hidden = seccion !== proximamente;
    volverPanel.focus();
  }

  function mostrarPanel(restaurarFoco) {
    solicitudEventos++;
    solicitudCarpetas++;
    carpetasOcupado = false;
    actas.disabled = false;
    carpetasForm.hidden = true;
    carpetasForm.reset();
    actaSeccion.hidden = true;
    actaForm.reset();
    archivoActa = null;
    panel.hidden = true;
    carpetasPanel.hidden = true;
    proximamente.hidden = true;
    volverPanel.hidden = true;
    volverPanel.disabled = false;
    cards.hidden = false;
    if (restaurarFoco && botonAnterior) botonAnterior.focus();
    botonAnterior = null;
  }

  volverPanel.addEventListener("click", () => mostrarPanel(true));
  cards.addEventListener("click", e => {
    const tarjeta = e.target.closest(".card");
    if (!tarjeta) return;
    const boton = tarjeta.querySelector("button");
    if (e.target.closest("button")) {
      if (boton.hasAttribute("data-admin-proximamente") && clave) {
        proximamente.querySelector("h2").textContent = tarjeta.querySelector("h3").textContent;
        mostrarSeccion(proximamente, boton);
      }
    } else if (boton && !boton.disabled) {
      boton.click();
    }
  });

  document.addEventListener("na-auth", e => {
    authVersion++;
    clave = "";
    password.value = "";
    content.hidden = true;
    mostrarPanel(false);
    panel.hidden = true;
    list.innerHTML = "";
    solicitudCarpetas++;
    carpetasPanel.hidden = true;
    carpetasForm.hidden = true;
    carpetasForm.reset();
    carpetasLista.innerHTML = "";
    carpetasRuta.textContent = "";
    carpetasMensaje.textContent = "";
    rutaCarpetas = [];
    carpetasOcupado = false;
    actas.disabled = false;
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
    const solicitud = ++solicitudEventos;
    const btn = e.currentTarget;
    btn.disabled = true;
    mostrarSeccion(panel, btn);
    list.textContent = "Cargando eventos…";
    try {
      const resultado = await llamar(clave, { modo: "listar" });
      if (version !== authVersion || solicitud !== solicitudEventos || !clave) return;
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
      if (version === authVersion && solicitud === solicitudEventos) list.textContent = error.message || "No se pudieron cargar los eventos. Intenta de nuevo.";
    } finally {
      btn.disabled = false;
    }
  });

  function estadoCarpetas(ocupado) {
    carpetasOcupado = ocupado;
    actas.disabled = ocupado;
    carpetasVolver.disabled = ocupado || rutaCarpetas.length <= 1;
    carpetasCrear.disabled = ocupado || !rutaCarpetas.length;
    carpetasForm.querySelector('button[type="submit"]').disabled = ocupado;
    carpetasCancelar.disabled = ocupado;
    actaForm.querySelector('button[type="submit"]').disabled = ocupado;
    actaForm.elements.archivo.disabled = ocupado;
    carpetasLista.querySelectorAll("button").forEach(btn => { btn.disabled = ocupado; });
  }

  async function cargarCarpetas(ruta) {
    if (!clave || carpetasOcupado) return;
    const version = authVersion;
    const solicitud = ++solicitudCarpetas;
    estadoCarpetas(true);
    carpetasMensaje.textContent = "Cargando carpetas…";
    try {
      const actual = ruta[ruta.length - 1];
      const resultado = await llamar(clave, { modo: "listar", carpeta: actual ? actual.id : "" }, "admin_carpetas_v2");
      if (version !== authVersion || solicitud !== solicitudCarpetas || !clave) return;
      if (!resultado.carpeta || typeof resultado.carpeta.id !== "string" ||
          typeof resultado.carpeta.nombre !== "string" || !Array.isArray(resultado.carpetas) ||
          resultado.carpetas.some(c => !c || typeof c.id !== "string" || typeof c.nombre !== "string")) {
        throw new Error("La lista de carpetas recibida no es válida.");
      }
      rutaCarpetas = actual ? ruta : [resultado.carpeta];
      actaSeccion.hidden = true;
      actaForm.reset();
      archivoActa = null;
      carpetasRuta.textContent = rutaCarpetas.map(c => c.nombre).join(" / ");
      carpetasCrear.textContent = rutaCarpetas.length === 1 ? "Crear año/carpeta" : "Crear mes/carpeta";
      carpetasNombreLabel.textContent = rutaCarpetas.length === 1 ? "Nombre del año o carpeta" : "Nombre del mes o carpeta";
      carpetasDestino.textContent = `La carpeta se creará dentro de: ${rutaCarpetas[rutaCarpetas.length - 1].nombre}.`;
      carpetasLista.innerHTML = "";
      resultado.carpetas.forEach(carpeta => {
        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "btn";
        boton.textContent = carpeta.nombre;
        boton.addEventListener("click", () => {
          carpetasForm.hidden = true;
          cargarCarpetas([...rutaCarpetas, carpeta]);
        });
        carpetasLista.appendChild(boton);
      });
      carpetasMensaje.textContent = resultado.carpetas.length ? "" : "Esta carpeta no contiene subcarpetas.";
      if (rutaCarpetas.length === 3) {
        const respuesta = await llamar(clave, { modo: "consultar", carpeta: resultado.carpeta.id }, "admin_actas");
        if (version !== authVersion || solicitud !== solicitudCarpetas || !clave) return;
        if (respuesta.archivo !== null && (!respuesta.archivo || typeof respuesta.archivo.id !== "string" || typeof respuesta.archivo.nombre !== "string")) {
          throw new Error("La información del acta recibida no es válida.");
        }
        archivoActa = respuesta.archivo;
        actualizarActa();
        actaSeccion.hidden = false;
      }
    } catch (error) {
      if (version === authVersion && solicitud === solicitudCarpetas) {
        carpetasMensaje.textContent = error.message || "No se pudieron cargar las carpetas. Intenta de nuevo.";
      }
    } finally {
      if (version === authVersion && solicitud === solicitudCarpetas) estadoCarpetas(false);
    }
  }

  function actualizarActa() {
    actaActual.textContent = archivoActa ? `PDF actual: ${archivoActa.nombre}` : "Esta carpeta aún no tiene un acta PDF.";
    actaForm.querySelector('button[type="submit"]').textContent = archivoActa ? "Reemplazar acta" : "Subir acta";
  }

  function leerArchivo(archivo) {
    return new Promise((resolve, reject) => {
      const lector = new FileReader();
      lector.onerror = () => reject(new Error("No se pudo leer el archivo seleccionado."));
      lector.onload = () => {
        if (typeof lector.result !== "string" || !lector.result.includes(",")) {
          reject(new Error("No se pudo leer el archivo seleccionado."));
          return;
        }
        resolve(lector.result.slice(lector.result.indexOf(",") + 1));
      };
      lector.readAsDataURL(archivo);
    });
  }

  actaForm.addEventListener("submit", async e => {
    e.preventDefault();
    if (!clave || carpetasOcupado || rutaCarpetas.length !== 3 || actaSeccion.hidden) return;
    const archivo = actaForm.elements.archivo.files[0];
    if (!archivo || !/\.pdf$/i.test(archivo.name) || archivo.size > 5 * 1024 * 1024 || !archivo.size) {
      carpetasMensaje.textContent = "Selecciona un archivo PDF de máximo 5 MB.";
      return;
    }
    if (archivoActa && !confirm(`¿Reemplazar "${archivoActa.nombre}"? El archivo anterior se moverá a la papelera de Drive.`)) return;
    const version = authVersion;
    const solicitud = ++solicitudCarpetas;
    const carpeta = rutaCarpetas[rutaCarpetas.length - 1].id;
    estadoCarpetas(true);
    volverPanel.disabled = true;
    carpetasMensaje.textContent = "Subiendo acta…";
    try {
      const contenido = await leerArchivo(archivo);
      if (version !== authVersion || solicitud !== solicitudCarpetas || !clave) return;
      const resultado = await llamar(clave, { modo: "subir", carpeta, nombre: archivo.name, contenido, anterior: archivoActa ? archivoActa.id : "" }, "admin_actas");
      if (version !== authVersion || solicitud !== solicitudCarpetas || !clave) return;
      if (!resultado.archivo || typeof resultado.archivo.id !== "string" || typeof resultado.archivo.nombre !== "string") {
        throw new Error("Respuesta de subida inválida. Revisa la carpeta en Drive antes de intentarlo nuevamente.");
      }
      archivoActa = resultado.archivo;
      actaForm.reset();
      actualizarActa();
      carpetasMensaje.textContent = "Acta guardada correctamente.";
    } catch (error) {
      if (version === authVersion && solicitud === solicitudCarpetas) {
        carpetasMensaje.textContent = error.message || "No se pudo subir el acta. Revisa la carpeta en Drive antes de intentarlo nuevamente.";
      }
    } finally {
      if (version === authVersion && solicitud === solicitudCarpetas) {
        estadoCarpetas(false);
        volverPanel.disabled = false;
      }
    }
  });

  actas.addEventListener("click", () => {
    if (!clave) return;
    mostrarSeccion(carpetasPanel, actas);
    carpetasForm.hidden = true;
    rutaCarpetas = [];
    carpetasLista.innerHTML = "";
    carpetasRuta.textContent = "";
    cargarCarpetas([]);
  });

  carpetasVolver.addEventListener("click", () => {
    if (rutaCarpetas.length > 1) {
      carpetasForm.hidden = true;
      cargarCarpetas(rutaCarpetas.slice(0, -1));
    }
  });

  carpetasCrear.addEventListener("click", () => {
    if (!rutaCarpetas.length || carpetasOcupado) return;
    carpetasForm.hidden = false;
    carpetasForm.elements.nombre.focus();
  });
  carpetasCancelar.addEventListener("click", () => {
    carpetasForm.hidden = true;
    carpetasForm.reset();
  });

  carpetasForm.addEventListener("submit", async e => {
    e.preventDefault();
    if (!clave || carpetasOcupado || !rutaCarpetas.length) return;
    const nombre = carpetasForm.elements.nombre.value.trim();
    if (!nombre) {
      carpetasMensaje.textContent = "Ingresa un nombre para la carpeta.";
      return;
    }
    const version = authVersion;
    const solicitud = ++solicitudCarpetas;
    estadoCarpetas(true);
    volverPanel.disabled = true;
    carpetasMensaje.textContent = "Creando carpeta…";
    try {
      const resultado = await llamar(clave, { modo: "crear", nombre, carpeta: rutaCarpetas[rutaCarpetas.length - 1].id }, "admin_carpetas_v2");
      if (version !== authVersion || solicitud !== solicitudCarpetas || !clave) return;
      if (!resultado.carpeta || typeof resultado.carpeta.id !== "string" || typeof resultado.carpeta.nombre !== "string") {
        throw new Error("La respuesta de creación no es válida. Revisa la carpeta principal antes de intentar nuevamente.");
      }
      carpetasForm.reset();
      carpetasForm.hidden = true;
      estadoCarpetas(false);
      await cargarCarpetas(rutaCarpetas);
    } catch (error) {
      if (version === authVersion && solicitud === solicitudCarpetas) {
        carpetasMensaje.textContent = error.message || "No se pudo crear la carpeta. Comprueba si ya existe antes de intentar nuevamente.";
      }
    } finally {
      if (version === authVersion && clave) volverPanel.disabled = false;
      if (version === authVersion && solicitud === solicitudCarpetas) estadoCarpetas(false);
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
