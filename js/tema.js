// Modo claro/oscuro y botón flotante de WhatsApp (se inyectan en todas las páginas)
(() => {
  const KEY = "na_tema";
  const aplicar = t => { document.documentElement.dataset.tema = t; };
  aplicar(localStorage.getItem(KEY) || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));

  document.addEventListener("DOMContentLoaded", () => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "tema-btn";
    const pintar = () => {
      const osc = document.documentElement.dataset.tema === "dark";
      b.innerHTML = osc ? ICO.sol : ICO.luna;
      b.title = b.ariaLabel = osc ? "Cambiar a modo claro" : "Cambiar a modo oscuro";
    };
    b.onclick = () => {
      const t = document.documentElement.dataset.tema === "dark" ? "light" : "dark";
      localStorage.setItem(KEY, t); aplicar(t); pintar();
    };
    pintar();
    document.body.appendChild(b);

    const nums = (typeof WHATSAPP_NUMEROS !== "undefined" && WHATSAPP_NUMEROS) || [];
    if (!nums.length) return;
    const a = document.createElement("a");
    a.className = "wa-fab"; a.target = "_blank"; a.rel = "noopener";
    a.title = a.ariaLabel = "Escríbenos por WhatsApp";
    a.innerHTML = '<svg viewBox="0 0 24 24" width="30" height="30" fill="#fff" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.200 8.200 0 0 1-4.200-1.200l-.3-.2-3 .8.8-2.900-.2-.3A8.200 8.200 0 1 1 12 20.200Zm4.500-6.100c-.2-.1-1.500-.7-1.700-.8s-.4-.1-.6.100-.6.800-.8 1-.3.200-.6.100a6.700 6.700 0 0 1-3.300-2.900c-.2-.4.200-.4.700-1.300.1-.1 0-.3 0-.4l-.8-1.900c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.300 3 3 0 0 0-.9 2.200 5.200 5.200 0 0 0 1.100 2.800 11.900 11.900 0 0 0 4.600 4.100c1.700.7 2.300.8 3.200.6a2.700 2.700 0 0 0 1.800-1.300 2.200 2.200 0 0 0 .2-1.300c-.1-.1-.2-.2-.5-.3Z"/></svg>';
    // El número se sortea en cada clic para repartir los mensajes entre las dos líneas
    a.addEventListener("click", () => {
      const n = nums[Math.floor(Math.random() * nums.length)];
      a.href = "https://wa.me/" + n + "?text=" + encodeURIComponent(WHATSAPP_MENSAJE);
    });
    a.href = "https://wa.me/" + nums[0] + "?text=" + encodeURIComponent(WHATSAPP_MENSAJE);
    document.body.appendChild(a);
  });
})();
