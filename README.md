# Sitio web de Narcóticos Anónimos — Área Bogotá

Sitio web estático para publicar información de Narcóticos Anónimos del Área Bogotá: reuniones, eventos, calendario, materiales de servicio y vías de contacto. El sitio se publica con GitHub Pages y utiliza Google Sheets y una aplicación web de Google Apps Script para consultar y administrar algunos datos.

> **Alcance de este documento:** describe el comportamiento observado en el código de este repositorio y propone pautas de operación. No es una certificación de seguridad ni sustituye una política legal de privacidad revisada por la organización. Antes de presentarlo como política institucional, los servidores de confianza deben confirmar responsables, canales de contacto, plazos de conservación y requisitos legales aplicables.

## Contenido

- [Funciones del sitio](#funciones-del-sitio)
- [Tecnologías y servicios](#tecnologías-y-servicios)
- [Mapa de la estructura del proyecto](#mapa-de-la-estructura-del-proyecto)
- [Requisitos y ejecución local](#requisitos-y-ejecución-local)
- [Configuración y publicación](#configuración-y-publicación)
- [Datos y flujos de información](#datos-y-flujos-de-información)
- [Política de privacidad y manejo de datos](#política-de-privacidad-y-manejo-de-datos)
- [Política de seguridad](#política-de-seguridad)
- [Mantenimiento y solución de problemas](#mantenimiento-y-solución-de-problemas)

## Funciones del sitio

| Página | Archivo | Función |
|---|---|---|
| Inicio | `index.html` | Presentación, carrusel de grupos, reuniones y eventos del día, enlaces y líneas de contacto. |
| Reuniones | `reuniones.html` | Consulta de reuniones por grupo, día, horario y ubicación; filtro de reuniones cercanas. |
| Eventos | `eventos.html` | Publicación de eventos activos, detalles, flyers y opciones de administración según la sesión. |
| Calendario | `calendario.html` | Inserta el calendario público de Google y permite abrir la opción de suscripción. |
| ¿Soy adicto? | `soy-adicto.html` | Información para personas que buscan ayuda o conocer NA. |
| GPICSAB | `guia.html` | Publicación de la Guía de Procedimientos del Área. |
| Séptima Tradición | `septima.html` | Información y opciones relacionadas con la Séptima Tradición. |
| Actas | `actas.html` | Página destinada al contenido de miembros; actualmente muestra “UNDER CONSTRUCCIÓN”. |
| Mociones | `mociones.html` | Página destinada al historial de mociones; actualmente muestra “UNDER CONSTRUCCIÓN”. |
| Administración | `admin.html` | Herramientas de administración de eventos, carpetas y actas disponibles en el código. |
| Creación de flyers | `create_flyer.html` | Guía y herramientas para elaborar flyers. |
| Página no encontrada | `404.html` | Página personalizada para rutas que no existen. |

## Tecnologías y servicios

- HTML, CSS y JavaScript sin proceso de compilación ni dependencias de Node.js.
- Python estándar (`http.server`) para servir el sitio localmente.
- GitHub Actions y GitHub Pages para publicación estática.
- Google Sheets para reuniones, eventos y datos de grupos.
- Google Apps Script como API para validar credenciales y realizar operaciones administrativas.
- Firebase Authentication para inicio de sesión con Google en las funciones que lo requieren.
- Google Drive para archivos y flyers; Google Calendar para el calendario público y la sincronización de eventos.
- Servicios externos cargados desde las páginas o scripts: Google Analytics, Google Fonts, Firebase, Google Maps, Cloudinary y WhatsApp.

Los servicios externos pueden recibir solicitudes del navegador cuando se carga una página o se utiliza una función. Sus propias políticas de privacidad y registros también aplican.

## Mapa de la estructura del proyecto

```text
pagina/
├── .github/
│   └── workflows/
│       └── pages.yml              # Publica el contenido del repositorio en GitHub Pages
├── apps-script/
│   └── Code.gs                    # API y operaciones con Sheets, Drive y Calendar
├── css/
│   └── styles.css                 # Estilos compartidos, temas y diseño adaptable
├── js/
│   ├── admin.js                   # Interfaz de administración
│   ├── auth.js                    # Inicio/cierre de sesión Firebase
│   ├── carrusel.js                # Carrusel de grupos de la portada
│   ├── config.js                  # Identificadores, URL de API y configuración pública
│   ├── eventos-hoy.js             # Resumen de eventos en la portada
│   ├── eventos.js                 # Listado y operaciones de eventos en el navegador
│   ├── main.js                    # Utilidades comunes, lectura de Sheets y caché
│   ├── modales.js                 # Carga de modales y formularios de grupo/evento
│   ├── particulas.js              # Efectos visuales
│   ├── private-pages.js           # Muestra/oculta contenido de páginas para miembros
│   ├── qr.js                      # Funcionalidad QR de la página de Séptima Tradición
│   ├── reuniones-hoy.js           # Resumen de reuniones del día en la portada
│   ├── reuniones-tiempo.js        # Conversión y cálculo de horarios
│   ├── reuniones.js               # Listado, filtros y geolocalización de reuniones
│   └── tema.js                    # Tema claro/oscuro y acceso flotante a WhatsApp
├── modales/
│   ├── evento.html                # Formulario de eventos
│   └── suscribir-calendario.html  # Ayuda para suscribirse al calendario
├── .gitignore                     # Exclusiones de entornos locales y archivos del sistema
├── 404.html
├── actas.html
├── admin.html
├── calendario.html
├── create_flyer.html
├── eventos.html
├── guia.html
├── index.html
├── mociones.html
├── reuniones.html
├── septima.html
├── soy-adicto.html
├── servidor.py                    # Servidor local para desarrollo y pruebas
└── README.md
```

### Componentes principales

- **Páginas:** cada archivo HTML es una página independiente; los scripts compartidos se cargan mediante etiquetas `<script>`.
- **Configuración:** `js/config.js` contiene configuración que llega al navegador. No es un almacén de secretos.
- **Datos públicos:** `js/main.js` lee pestañas de Google Sheets y conserva una copia local para acelerar la siguiente visita.
- **API:** `apps-script/Code.gs` valida solicitudes y modifica datos o archivos usando los permisos de la cuenta que despliega Apps Script.
- **Diseño:** `css/styles.css` define componentes compartidos y variantes de tema claro/oscuro.

## Requisitos y ejecución local

Requisitos:

- Python 3 instalado.
- Navegador moderno.
- Acceso a Internet para consultar Google Sheets y los servicios externos.

Desde la carpeta del proyecto, ejecutar en PowerShell:

```powershell
py servidor.py
```

El servidor usa el puerto `8000` por defecto. Abrir `http://localhost:8000`. Para utilizar otro puerto:

```powershell
py servidor.py 8080
```

Detenerlo con `Ctrl+C`. No se necesita `npm install`, compilación ni base de datos local. El servidor incluido es únicamente para desarrollo; no debe exponerse como servidor de producción.

La geolocalización del navegador requiere HTTPS o un contexto local seguro como `localhost`. El navegador pedirá permiso cuando se pulse **Reuniones cerca de mí**.

## Configuración y publicación

### Configuración del sitio

1. Revisar `js/config.js` y configurar los valores propios del despliegue:
   - Identificador de la hoja de cálculo pública.
   - Nombre de las pestañas de reuniones, eventos y, opcionalmente, carrusel.
   - URL de la aplicación web de Apps Script.
   - Configuración pública de Firebase Authentication y proveedores habilitados.
   - Teléfonos, enlaces sociales, mensajes e imágenes de la organización.
2. No copiar al repositorio claves privadas, contraseñas de grupo o administración, credenciales de cuentas de servicio ni tokens.
3. En Firebase, autorizar los dominios reales del sitio y habilitar únicamente los proveedores necesarios.
4. Confirmar los permisos y las personas con acceso a las hojas, carpetas de Drive y calendario.

Los valores de Firebase que se usan en una aplicación web —por ejemplo `apiKey`, `authDomain`, `projectId` y `appId`— identifican el proyecto, pero no son una contraseña de servidor. La seguridad depende, entre otras cosas, de las reglas de Firebase y de no incluir credenciales privadas en el cliente.

### Datos esperados

- **Pestaña `GRUPOS`:** una fila por grupo y día. El código reconoce columnas como `ID`, `NOMBRE`, `SECTOR`, `DIRECCIÓN`, `BARRIO`, `LOCALIDAD`, `VIRTUAL`, `LINK MAPS`, `DIA`, `HORA INICIO`, `HORA FIN`, `TIPO`, `INTERESES COMUNES` y `FORMATO`. Los encabezados se normalizan; mantenerlos consistentes es importante.
- **Pestaña `Eventos`:** incluye información de eventos, por ejemplo fechas, horas, nombre, mensaje, flyer, dirección, contacto, grupo, estado e identificador de calendario. Los nombres de columnas deben corresponder al código de Apps Script.
- **Pestaña `Carrusel` (opcional):** columnas `Nombre` e `Imagen`. Si contiene filas, puede reemplazar la lista local de `js/config.js`.
- **Hoja de claves (Apps Script):** la pestaña `CLAVES` contiene pares de grupo y clave; la pestaña `ADMIN` contiene la clave administrativa en `A1`. No publicar ni añadir estas claves a Git.

Para el filtro de reuniones cercanas, agregar coordenadas precisas al enlace de Google Maps de cada reunión (o un valor `latitud,longitud` en el campo que el código interpreta como enlace). Si faltan coordenadas válidas, ese grupo no se puede ordenar por distancia.

### Configuración de Apps Script

1. Crear o abrir un proyecto de Google Apps Script con el código de `apps-script/Code.gs`.
2. Revisar y configurar en el propio proyecto las constantes de identificadores de hojas, carpetas y calendario para la organización. No publicar esos identificadores en documentación si no es necesario.
3. Autorizar únicamente los servicios requeridos (Sheets, Drive y Calendar).
4. Desplegar como aplicación web con una política de acceso compatible con el uso público del sitio y con la validación que aplica el servidor. Revisar con cuidado “Ejecutar como” y quién puede acceder: esos ajustes determinan los permisos efectivos del backend.
5. Copiar la URL de la implementación a `CONFIG.API_URL` en `js/config.js`.
6. Al cambiar el código, crear una nueva versión de la implementación y comprobar que el sitio está llamando a esa versión.
7. Configurar y comprobar el activador diario de archivo de eventos si se utiliza esa función.

### Publicación en GitHub Pages

`.github/workflows/pages.yml` despliega el contenido de la raíz del repositorio cuando hay un `push` a `main`; también permite ejecución manual desde GitHub Actions. El workflow concede permisos de lectura del repositorio y permisos de publicación de Pages.

Para habilitarlo, configurar GitHub Pages para usar GitHub Actions y verificar el resultado del workflow. Como se publica el contenido estático del repositorio, todo archivo incluido en el artefacto debe considerarse descargable por visitantes del sitio.

## Datos y flujos de información

| Datos o actividad | Flujo observado | Consideraciones |
|---|---|---|
| Reuniones y eventos | El navegador consulta las pestañas de Google Sheets. La lectura se almacena en `localStorage` con una caché de cinco minutos; se puede mostrar una copia anterior mientras se actualiza. | No poner en hojas públicas información personal o confidencial. La caché puede permanecer en el dispositivo después de su vencimiento. |
| Inicio de sesión de miembros | Firebase Authentication gestiona el acceso con Google. El estado se conserva localmente mediante persistencia de Firebase. | Google/Firebase procesa los datos de cuenta necesarios para autenticación, como el correo. |
| Edición de grupos | El navegador envía la clave al Apps Script solo durante la verificación por POST; después utiliza un token temporal en memoria para las operaciones del grupo. | La clave no debe compartirse ni reutilizarse como contraseña personal. |
| Administración | Las solicitudes administrativas llegan a Apps Script, que valida la clave administrativa y opera sobre Sheets o Drive. | La protección real de estas operaciones debe residir en el servidor y los permisos de Google, no solo en la interfaz. |
| Eventos y flyers | Los datos se guardan en Sheets y pueden sincronizarse con Calendar. Los flyers se guardan en Drive; el código los comparte con acceso “cualquiera con el enlace”. | Dirección y contacto pueden quedar visibles en la hoja, el calendario o el flyer. Revisar cada publicación antes de hacerla. |
| Ubicación de reuniones cercanas | Al pulsar el botón, el navegador solicita permiso y calcula distancias localmente con las coordenadas de la reunión. El código de la función no envía las coordenadas del dispositivo a Sheets o Apps Script. | La consulta de geolocalización requiere permiso del usuario. La conexión con el sitio y proveedores externos puede generar otros registros, como dirección IP; no equivale a anonimato de red. |
| Analítica | Las páginas cargan Google Analytics. | Google puede recibir información de uso y datos técnicos del navegador conforme a la configuración del servicio y sus políticas. |
| Calendario y mapas | Se insertan recursos de Google Calendar y Google Maps; sus solicitudes ocurren desde el navegador. | Al cargar o abrir recursos de terceros, el proveedor puede recibir datos técnicos de la conexión. |
| Preferencias visuales | El tema claro/oscuro se guarda en `localStorage` con la clave `na_tema`. | Es una preferencia local, no un dato de cuenta necesario para operar el servicio. |

### Datos que no deben recopilarse

El sitio no necesita historiales de consumo, diagnóstico, tratamientos, asistencia identificable a reuniones ni otra información sensible sobre recuperación. No pedir ni cargar dichos datos en hojas, flyers, formularios, calendario, repositorio o canales de contacto. Publicar solo la información de servicio necesaria y autorizada.

## Política de privacidad y manejo de datos

Estas pautas describen el manejo técnico actual y el estándar recomendado para quienes mantienen el sitio:

1. **Finalidad:** utilizar la información para comunicar horarios, eventos, materiales de servicio y formas de contacto de NA Área Bogotá.
2. **Minimización:** solicitar y publicar solo los datos necesarios para esa finalidad. Evitar datos que identifiquen a miembros o visitantes, en particular información sobre recuperación.
3. **Ubicación:** pedir permiso explícito mediante el navegador. Usar la ubicación únicamente en memoria para calcular distancias; no almacenarla ni enviarla al backend. El permiso puede negarse y la página debe seguir siendo utilizable.
4. **Transparencia:** informar cuando un dato se comparte con terceros, como Google Analytics, Firebase, Google Sheets, Drive, Calendar, Maps, Cloudinary o WhatsApp. Mantener enlaces a las políticas de esos proveedores.
5. **Publicación:** tratar las hojas que el sitio consulta directamente como información pública. Antes de publicar un evento, verificar autorización, texto, flyer, contactos, dirección, fecha y visibilidad del calendario.
6. **Acceso interno:** limitar el acceso a hojas, Apps Script, Drive, Firebase y GitHub a servidores de confianza que lo requieran. Revisar esos permisos periódicamente y al cambiar responsabilidades.
7. **Conservación:** mantener solo la información de servicio necesaria y aplicar las reglas de archivo aprobadas por el Área. La retención definitiva de Sheets, Drive, Calendar y Analytics depende también de la configuración de esas plataformas.
8. **Derechos y solicitudes:** antes de publicar una dirección de contacto para solicitudes sobre datos, designar una persona o canal institucional que realmente se supervise. Este repositorio no define un contacto oficial.

## Política de seguridad

### Controles observados en el código

- Apps Script valida claves de grupo y administración en el servidor. El código bloquea temporalmente después de cinco intentos fallidos, pero usa `CacheService`; no debe considerarse protección suficiente contra ataques distribuidos o intentos coordinados.
- Los tokens nuevos de grupo tienen una vigencia lógica de 12 horas. El token se guarda en memoria en el navegador y su registro del lado servidor está en Script Properties.
- Las operaciones de escritura usan bloqueos de Apps Script para reducir conflictos simultáneos.
- El código valida formatos y campos de reuniones/eventos, limita el tamaño de archivos y comprueba la firma inicial de JPEG o PDF antes de guardarlos.
- La interfaz escapa texto antes de insertarlo en varios componentes dinámicos y limita algunos enlaces a `http`/`https`.
- El workflow de Pages declara permisos de despliegue explícitos.

Estos controles no son una auditoría de seguridad y no garantizan por sí solos que el despliegue, las hojas o las cuentas estén correctamente configurados.

### Estado de seguridad y controles activos

La versión desplegada de la API se verificó durante esta revisión y respondió `2026-11-09-auth-post`. En el código actual están implementadas las siguientes medidas:

- **Acceso de grupos:** la clave se envía por POST solo durante la verificación. No se guarda en `localStorage` ni se incluye en la URL. Las operaciones siguientes usan un token temporal de 12 horas que permanece en memoria en el navegador; Apps Script mantiene el registro del token en Script Properties.
- **Protección contra credenciales antiguas:** la API rechaza por GET las operaciones de verificación, consulta y edición de grupos. Los tokens previos usan otro prefijo y no se aceptan. Al cargarse, `js/main.js` también elimina del navegador el antiguo valor `na_acceso`.
- **Contenido de miembros:** las páginas de actas y mociones actualmente muestran “UNDER CONSTRUCCIÓN”; no se publican allí documentos privados. El control de Firebase en `js/private-pages.js` gestiona la presentación de la interfaz, no los permisos de archivos estáticos. Si se agrega contenido confidencial, alojarlo en Drive con acceso restringido u otro backend que valide autorización en cada solicitud.
- **Datos y servicios:** las hojas consultadas públicamente y los flyers con acceso “cualquiera con el enlace” se consideran públicos. Google Analytics, Firebase, Sheets, Drive, Calendar, Maps, Cloudinary y WhatsApp son servicios externos y se deben administrar con sus permisos y políticas correspondientes.
- **Validación y operación:** Apps Script valida campos, aplica límites a archivos y usa bloqueos para operaciones de escritura. Estas medidas reducen errores y abusos comunes, sin reemplazar una evaluación independiente de seguridad.

Como toda sesión basada en un token de portador, alguien que obtenga un token válido podría usarlo hasta su vencimiento. No hay una función para revocarlo inmediatamente. La clave del grupo es compartida y no identifica qué miembro realizó una operación; debe cambiarse cuando cambian las personas responsables o si se sospecha una exposición. El POST evita colocar la clave en la URL, pero no protege un dispositivo comprometido ni código malicioso ejecutado en el mismo sitio.

Versiones anteriores podían incluir la clave en URLs o guardarla localmente. La limpieza automática alcanza el almacenamiento local de los dispositivos que cargan la versión nueva, pero no elimina historiales, capturas o copias externas que se hubieran generado anteriormente. Como buena práctica de transición, los grupos deben actualizar sus claves antiguas y no reutilizar contraseñas personales.

La geolocalización de reuniones calcula distancias en el navegador y no envía las coordenadas del dispositivo al backend. Esto no implica anonimato de red: el hosting y los servicios externos pueden procesar datos técnicos de conexión. Del mismo modo, la validación de formato y tamaño de imágenes o PDF no equivale a un análisis antivirus.

La verificación de la versión desplegada confirma el backend, pero no constituye una certificación ni una auditoría de seguridad del sitio, las cuentas, permisos de Google o proveedores externos.

### Reglas para cambios y operación segura

- Nunca incluir contraseñas, tokens, claves privadas, archivos de credenciales de Google o datos personales en Git, issues públicos, logs compartidos o capturas de pantalla.
- Las variables de `js/config.js` son visibles al público. No agregar allí secretos, contraseñas administrativas ni credenciales de servicio.
- Usar cuentas individuales con autenticación multifactor para GitHub, Google y Firebase cuando esté disponible; retirar permisos al dejar el servicio.
- Mantener protegidos los permisos de Firebase, Apps Script, Sheets, Drive, Calendar y GitHub. Revisar específicamente los permisos “cualquiera con el enlace”.
- Usar HTTPS en producción; validar entradas y permisos en el backend para toda operación de escritura.
- Antes de publicar cambios, revisar el diff, los archivos incluidos y los permisos de los recursos vinculados. Evitar introducir información de miembros en flyers, eventos o calendarios sin autorización.
- Actualizar dependencias externas fijadas por versión y revisar los cambios de permisos antes de modificar el workflow de despliegue.
- No habilitar almacenamiento adicional de datos de ubicación ni registrar coordenadas exactas del visitante.

### Reporte y respuesta ante incidentes

1. No publicar detalles explotables ni datos personales en un issue público.
2. Informar el problema de forma privada a los mantenedores del repositorio o al servidor de confianza designado por el Área. **El repositorio no define actualmente una dirección de seguridad verificada; la organización debe designar y publicar un canal supervisado.**
3. Compartir solo los pasos mínimos para reproducir el problema y evitar incluir credenciales reales.
4. Si hay una credencial expuesta, revocarla o cambiarla de inmediato, revisar registros y permisos, y retirar la copia expuesta de los canales accesibles.
5. Evaluar qué datos pudieron verse afectados, conservar evidencia necesaria sin divulgarla y notificar a las personas afectadas por un canal apropiado cuando corresponda.
6. Documentar la corrección y verificar que no queden credenciales o datos personales en el historial accesible del repositorio.

## Mantenimiento y solución de problemas

- **No aparecen reuniones o eventos:** comprobar permisos de lectura de la hoja, los nombres exactos de las pestañas y encabezados, y `CONFIG.SHEET_ID`. Borrar la caché `na_sheet_*` del navegador para forzar una recarga.
- **No funciona la edición:** comprobar que `CONFIG.API_URL` apunta a la implementación actual de Apps Script, que el despliegue tiene los permisos esperados y que las hojas/Drive/Calendar están compartidos con la cuenta que ejecuta el script.
- **No funciona el inicio de sesión:** verificar proveedores habilitados y dominios autorizados en Firebase, además de HTTPS o `localhost`.
- **No se encuentra una reunión cercana:** confirmar permiso del navegador, contexto HTTPS/localhost y coordenadas válidas en el enlace de Maps. Los grupos sin coordenadas no se incluyen en el cálculo.
- **Los cambios de estilo no aparecen:** algunas páginas agregan un parámetro de versión `?v=...` a CSS y JavaScript. Incrementarlo cuando un navegador o CDN conserve una versión anterior.
- **La página devuelve 404:** verificar el nombre/ruta del archivo y el estado del último workflow de GitHub Pages.

No se identifica en este repositorio una suite automatizada de pruebas ni un proceso de compilación. Antes de publicar, probar manualmente navegación móvil/escritorio, carga de datos, formularios, acceso administrativo, enlaces externos, filtros y comportamiento de error.

## Licencia y uso de contenidos

Este repositorio no incluye un archivo de licencia de software. No asumir permisos de reutilización o redistribución de textos, imágenes, logos, flyers o documentos publicados; confirmar las autorizaciones correspondientes con sus responsables.
