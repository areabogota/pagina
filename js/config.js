// Configuración del backend (Google Sheets)
const CONFIG = {
  SHEET_ID: "1sy6R4HxHgFEsAkOjt_H-f0i5X8XUdHjE0y0Cha5EREI",
  // Nombres de las pestañas en la hoja
  TAB_REUNIONES: "GRUPOS",
  TAB_EVENTOS: "Eventos",
  // URL de la Web App de Google Apps Script (ver apps-script/Code.gs). Pegar aquí tras desplegarla.
  ORDERS_URL: "https://script.google.com/macros/s/AKfycby1AblCA0XEQ2tiO3jD26oiPUuP6OnQ-HB1IsGFDW_P8IMegJwppMkmq3xW-CpSbxag/exec",
  // Pestaña opcional con columnas: Nombre, Imagen. Si tiene filas, reemplaza la lista de abajo.
  TAB_CARRUSEL: "Carrusel",
  // Segundos entre imágenes
  CARRUSEL_SEGUNDOS: 2,
  // Firebase Console > Configuración del proyecto > Tus apps > App web. Pegar aquí los valores.
  FIREBASE: {
    apiKey: "AIzaSyDO-vFKSKRVkc1LlSGrteR_2zjd4YT1kl8",
    authDomain: "na-area-bogota.firebaseapp.com",
    projectId: "na-area-bogota",
    appId: "1:194373368782:web:93f9d14d9f2e7dab2f099f",
    // Proveedores visibles: "google", "facebook", "microsoft", "twitter"
    PROVEEDORES: ["google"]
  }
};


// Dos botones de contacto en el footer. tipo: "whatsapp" (abre WhatsApp) o "llamada" (marca el número).
// Incluye indicativo de país, ej. "573001234567".
// Líneas de atención que se muestran en el footer
const TELEFONOS = [
  { nombre: "NA BOGOTÁ - 24 HORAS", numero: "314 246 82 89" },
  { nombre: "", numero: "315 370 70 31" }
];

// Redes sociales (sección "Enlaces de Interés"). Las que tengan url vacía no se muestran.
const REDES = [
  { nombre: "nacolombia.org", url: "https://www.nacolombia.org", icono: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.9 9h-3a15.700 15.700 0 0 0-1.300-5.100A8 8 0 0 1 18.900 11ZM12 4c.8 1 1.700 3.100 2 7H10c.3-3.900 1.200-6 2-7ZM4.300 13h3a15.700 15.700 0 0 0 1.300 5.100A8 8 0 0 1 4.300 13Zm3-2h-3a8 8 0 0 1 4.300-5.100A15.700 15.700 0 0 0 7.300 11ZM12 20c-.8-1-1.700-3.100-2-7h4c-.3 3.900-1.200 6-2 7Zm2.700-1.900A15.700 15.700 0 0 0 16 13h3a8 8 0 0 1-4.300 5.100Z" },
  { nombre: "Instagram", url: "https://www.instagram.com/narcoticosanonimosbogota/", icono: "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5Zm0 2A2.5 2.5 0 1 0 14.5 12 2.5 2.5 0 0 0 12 9.5ZM17.3 5.7a1 1 0 1 1-1 1 1 1 0 0 1 1-1Z" },
  { nombre: "Facebook", url: "https://www.facebook.com/NARCOTICOSANONIMOSBOGOTA", icono: "M13.5 22v-8.2h2.8l.5-3.3h-3.3V8.4c0-.9.3-1.6 1.7-1.6h1.7V3.9c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.2v2.5H7.5v3.3h2.8V22h3.2Z" }
];

const GRUPOS = [
  { nombre: "El Camino", imagen: "https://res.cloudinary.com/dlspk9ipi/image/upload/v1792012674/EL_CAMINO_bqvpzx.avif" },
  { nombre: "Nuevo Amanecer", imagen: "https://res.cloudinary.com/dlspk9ipi/image/upload/v1792012674/NUEVO_AMANECER_bpv6cz.avif" },
  { nombre: "Nuevo Comienzo", imagen: "https://res.cloudinary.com/dlspk9ipi/image/upload/v1792012674/NUEVO_COMIENZO_egvtx7.avif" },
  { nombre: "Solo Por Hoy", imagen: "https://res.cloudinary.com/dlspk9ipi/image/upload/v1792012674/SOLO_POR_HOY_ov814e.avif" },
  { nombre: "Nuevo Amanecer", imagen: "https://res.cloudinary.com/dlspk9ipi/image/upload/v1792012674/NUEVO_AMANECER2_pv9yya.avif" }
];
