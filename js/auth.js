// Inicio de sesión con terceros (Firebase Authentication). La sesión se recuerda en el navegador.
(() => {
  const cfg = CONFIG.FIREBASE;
  const PROVEEDORES = [
    { id: "google", nombre: "Google", cls: "google", make: () => new firebase.auth.GoogleAuthProvider() },
    { id: "facebook", nombre: "Facebook", cls: "facebook", make: () => new firebase.auth.FacebookAuthProvider() },
    { id: "microsoft", nombre: "Microsoft", cls: "microsoft", make: () => new firebase.auth.OAuthProvider("microsoft.com") },
    { id: "twitter", nombre: "X (Twitter)", cls: "twitter", make: () => new firebase.auth.TwitterAuthProvider() }
  ].filter(p => !cfg.PROVEEDORES || cfg.PROVEEDORES.includes(p.id));

  // Aviso que se muestra en la ventana de inicio de sesión según la sección que lo pide
  const AVISOS = {
    general: `<p>Este inicio de sesión no es obligatorio. Está pensado para los miembros del comité y sirve únicamente para mostrar los contenidos que están a disposición del CSAB, como las actas y las mociones. Si no eres del CSAB, no necesitas iniciar sesión y puedes usar el resto del sitio con normalidad. Si aun así quieres hacerlo, no hay ningún inconveniente: en nuestro sitio no se publica quién inicia sesión.</p>
<p>Para la autenticación usamos Firebase Authentication, un servicio de Google. Firebase procesa los datos necesarios para verificar tu cuenta, como el correo con el que inicias sesión. Si quieres saber cómo maneja esa información, puedes leerlo aquí: <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer">Privacidad y seguridad en Firebase</a>.</p>`,
    evento: "Para crear eventos y publicar flyers, iniciamos sesión con una cuenta de Google. Lo hacemos para que lo que se publica venga de los grupos y servicios, y para que alguien responda por esa información. El anonimato es la base espiritual de nuestras tradiciones, y la responsabilidad con lo que compartimos también es parte de servir. Quien publica se asegura de que los datos estén correctos, de que el logo esté intacto y de que se sigan las recomendaciones para la publicación. Cuida tu cuenta y no compartas tu clave con nadie.",
    actas: "Aquí está el archivo de las actas de nuestras asambleas y reuniones: el registro de lo que hemos decidido entre todos a lo largo del tiempo. Según nuestra Guía de Procedimientos, las actas deben estar a disposición de los miembros del CSAB, y por eso para consultarlas pedimos iniciar sesión. Cada acta refleja lo que se decidió en su momento, así que al leerla ten presente su fecha y su contexto. Cuídalas y úsalas para el servicio, con la responsabilidad que merece esta información.",
    mociones: "Aquí puedes consultar el historial de mociones: qué se propuso, cuándo y qué se decidió. Es la memoria de nuestro servicio. Nos ayuda a no repetir discusiones, a entender por qué se tomó una decisión y a mantener la continuidad cuando cambian los servidores de confianza. Consúltalo con respeto y sin personalizar: como nos recuerda la Duodécima Tradición, ( [...] los principios  antes que las personalidades). Las mociones se miran por sus ideas, no por quién las presentó."
  };

  const cargar = src => new Promise((ok, fail) => {
    const s = document.createElement("script");
    s.src = src; s.onload = ok; s.onerror = fail;
    document.head.appendChild(s);
  });

  document.addEventListener("DOMContentLoaded", async () => {
    const header = document.querySelector(".header-inner");
    const ul = document.querySelector(".nav ul");
    if (!header || !ul) return;
    const li = document.createElement("div");
    li.className = "auth-item";
    header.appendChild(li);
    // Opciones de cuenta que en celular aparecen dentro del menú hamburguesa (solo con sesión iniciada)
    ul.insertAdjacentHTML("beforeend", '<li class="cuenta-movil"><a href="#" id="salir-movil">Cerrar sesión</a></li>');

    window.NA_USER = null;
    const ICONO = '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5Z"/></svg>';
    const SALIR = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>';

    if (!cfg || !cfg.apiKey) {
      li.innerHTML = `<button type="button" class="auth-btn icon" disabled title="Inicio de sesión sin configurar" aria-label="Ingresar">${ICONO}</button>`;
      return;
    }

    try {
      await cargar("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
      await cargar("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js");
    } catch { li.innerHTML = ""; return; }

    firebase.initializeApp(cfg);
    const auth = firebase.auth();
    auth.languageCode = "es";
    await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL); // "recordarme"

    // Modal
    const modal = document.createElement("div");
    modal.className = "auth-modal";
    modal.hidden = true;
    modal.innerHTML = `<div class="auth-box" role="dialog" aria-modal="true" aria-label="Ingresar">
      <button type="button" class="auth-close" aria-label="Cerrar">&times;</button>
      <h2>Ingresar</h2>
      <div class="aviso">
        <div class="aviso-texto"></div>
        <label class="aviso-leido"><input type="checkbox" id="aviso-leido"> He leído y acepto este aviso</label>
      </div>
      <p>Selecciona ingresar por google. Recordaremos tu sesión en este dispositivo.</p>
      ${PROVEEDORES.map(p => `<button type="button" class="prov ${p.cls}" data-id="${p.id}">Continuar con ${p.nombre}</button>`).join("")}
      <p class="auth-err" role="alert"></p>
    </div>`;
    document.body.appendChild(modal);
    const err = modal.querySelector(".auth-err");
    const cerrar = () => { modal.hidden = true; };
    // solo se cierra con la X
    modal.querySelector(".auth-close").addEventListener("click", cerrar);
    

    modal.querySelectorAll(".prov").forEach(b => b.addEventListener("click", async () => {
      err.textContent = "";
      const p = PROVEEDORES.find(x => x.id === b.dataset.id);
      try {
        await auth.signInWithPopup(p.make());
        cerrar();
      } catch (e) {
        if (e.code === "auth/account-exists-with-different-credential") err.textContent = "Ya tienes una cuenta con ese correo usando otro proveedor. Ingresa con ese.";
        else if (e.code !== "auth/popup-closed-by-user" && e.code !== "auth/cancelled-popup-request") {
          const causas = {
            "auth/operation-not-allowed": "Falta activar este proveedor en Firebase (Authentication > Método de acceso).",
            "auth/unauthorized-domain": "Este dominio no está autorizado en Firebase (Authentication > Configuración > Dominios autorizados).",
            "auth/popup-blocked": "El navegador bloqueó la ventana emergente. Permítela e intenta de nuevo.",
            "auth/operation-not-supported-in-this-environment": "Abre el sitio desde http://localhost o un dominio https, no desde el archivo."
          };
          err.textContent = (causas[e.code] || "No se pudo ingresar. Intenta de nuevo.") + " (" + e.code + ")";
          console.error(e);
        }
      }
    }));

    document.addEventListener("click", () => { const d = document.getElementById("user-dropdown"); if (d) d.hidden = true; });
    addEventListener("keydown", e => { if (e.key === "Escape") { const d = document.getElementById("user-dropdown"); if (d) d.hidden = true; } });

    auth.onAuthStateChanged(u => {
      window.NA_USER = u ? { uid: u.uid, nombre: u.displayName || "", email: u.email || "", foto: u.photoURL || "" } : null;
      document.body.classList.toggle("logueado", !!u);
      document.querySelectorAll(".solo-auth").forEach(el => { el.hidden = !u; });
      if (u) {
        const foto = safeUrl(u.photoURL);
        const nombre = esc(u.displayName || u.email || "Usuario");
        li.innerHTML = `<div class="user-menu">
          <button type="button" class="user-trigger" id="user-trigger" aria-haspopup="true" aria-expanded="false" title="${nombre}">
            ${foto ? `<img src="${foto}" alt="${nombre}" referrerpolicy="no-referrer">` : `<span class="auth-btn icon">${ICONO}</span>`}
            <span class="caret" aria-hidden="true">&#9662;</span>
          </button>
          <div class="user-dropdown" id="user-dropdown" hidden>
            <div class="user-name">${nombre}</div>
            <button type="button" id="salir">${SALIR} Cerrar sesión</button>
          </div></div>`;
        const trig = li.querySelector("#user-trigger"), dd = li.querySelector("#user-dropdown");
        const toggle = open => { dd.hidden = !open; trig.setAttribute("aria-expanded", open); };
        trig.addEventListener("click", e => { e.stopPropagation(); toggle(dd.hidden); });
        dd.addEventListener("click", () => toggle(false));
        li.querySelector("#salir").addEventListener("click", () => auth.signOut());
      } else {
        li.innerHTML = `<button type="button" class="auth-btn icon" id="entrar" title="Ingresar" aria-label="Ingresar">${ICONO}</button>`;
        li.querySelector("#entrar").addEventListener("click", e => {
          const texto = AVISOS[e.currentTarget.dataset.motivo] || AVISOS.general;
          modal.querySelector(".aviso-texto").innerHTML = texto;
          modal.querySelector("#aviso-leido").checked = false;
          modal.querySelectorAll(".prov").forEach(b => { b.disabled = true; });
          modal.hidden = false;
        });
        modal.querySelector("#aviso-leido").addEventListener("change", e => {
          modal.querySelectorAll(".prov").forEach(b => { b.disabled = !e.target.checked; });
        });
      }
      document.dispatchEvent(new CustomEvent("na-auth", { detail: window.NA_USER }));
      const salirMovil = document.getElementById("salir-movil");
      if (salirMovil) salirMovil.onclick = e => { e.preventDefault(); auth.signOut(); };
    });
  });
})();
