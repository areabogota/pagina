document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("qr-modal");
  const abrir = document.querySelector(".septima-qr");
  const cerrar = modal && modal.querySelector(".qr-close");
  if (!modal || !abrir || !cerrar) return;

  abrir.addEventListener("click", () => {
    modal.hidden = false;
    cerrar.focus();
  });
  cerrar.addEventListener("click", () => {
    modal.hidden = true;
    abrir.focus();
  });
});
