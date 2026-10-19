document.addEventListener("na-auth", e => {
  const autorizado = !!e.detail;
  const contenido = document.getElementById("private-content");
  const bloqueo = document.getElementById("private-lock");
  if (contenido) contenido.hidden = !autorizado;
  if (bloqueo) bloqueo.hidden = autorizado;
});

document.addEventListener("click", e => {
  if (e.target.closest("#private-login")) document.getElementById("entrar")?.click();
});
