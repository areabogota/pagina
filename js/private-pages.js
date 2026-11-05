document.addEventListener("na-auth", e => {
  const autorizado = !!e.detail;
  const contenido = document.getElementById("private-content");
  const bloqueo = document.getElementById("private-lock");
  if (contenido) contenido.hidden = !autorizado;
  if (bloqueo) bloqueo.hidden = autorizado;
});

document.addEventListener("click", e => {
  const login = e.target.closest("#private-login");
  if (!login) return;
  const entrar = document.getElementById("entrar");
  if (entrar) entrar.dataset.motivo = document.getElementById("private-lock")?.dataset.motivo || "";
  entrar?.click();
});
