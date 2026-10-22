# Sistema de diseño · «Taller a la luz»

La interfaz se pinta con los materiales de las escenas renderizadas del recorrido (hormigón, zócalo azul, ladrillo, salvia de la pista) y usa el **naranja de seguridad** (crique, balizas, matafuego) como único acento. Tono de catálogo de repuestos y cartel de taller. La portada es el recorrido; las vistas internas (lección, glosario, diagnóstico, créditos) comparten cabecera, tipografía de lectura y componentes.

Los valores salen de `css/tokens.css`; si hay diferencia, manda el archivo. La especificación completa, con las referencias estudiadas y las mediciones, está en la carpeta de proceso del proyecto (`_proceso/rediseno-v2/ESPECIFICACION.md`, no publicada).

## Archivos CSS

| Archivo | Contenido |
|---|---|
| `tokens.css` | Variables (color, tipografía, medidas, forma, movimiento) y los dos temas |
| `base.css` | Reset, tipografía, rótulos (`.code`, `.cartel`, `.block-tag`), botones, cabecera (HUD de dos píldoras), paleta de búsqueda (`dialog.find`), pie, `prefers-reduced-motion`, impresión |
| `components.css` | Despiece (`.parts`, `.part`, `.chip`), cajas (`.box`), lección (`.l-head`, `.l-fig`, `.l-grid`, `.toc`, `.prose`, `.side`, `.steps`, `.spec`, `.related`, `.pager`), barra de filtro (`.g-tools`, `.az`, `.field`), estado vacío (`.empty`), diagnóstico (`.symptoms`), glosario (`.letter-group`, `.gl-entry`), módulos, resultados, créditos |
| `recorrido-continuo.css` | Portada: `.tr-stage`, título, tarjeta de parada, riel, láminas fijas, hoja de detalle (`dialog.sheet`), notas (`.note`) |
| `diagrams.css` | Clases `dg-*` de los esquemas SVG |

## Tokens

Los nombres son estables; para re-estilizar cambiá valores, no nombres.

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--paper` | `#F2EDE6` | `#0F1419` | Fondo; también el «cielo» transparente del fotograma 1 |
| `--surface` / `--surface-2` | `#FBF9F6` / `#E8E1D7` | `#171E25` / `#212A33` | Tarjetas, hojas, campos / bandas, notas, filas abiertas |
| `--hairline` / `--hairline-strong` | tinta al 12 % / 24 % | tinta clara al 12 % / 26 % | Filetes de 1 px |
| `--ink` / `--ink-2` / `--muted` | `#13202B` / `#2E3D4A` / `#55606A` | `#EDE7DE` / `#CFC7BB` / `#A3ACB4` | Texto principal, bajadas, secundario |
| `--line` / `--line-ink` | `#1D3A57` / `#FFFFFF` | `#8DB4DA` / `#0B1622` | Marca, botón primario, letras del glosario / texto sobre él |
| `--signal` | `#A63E0D` | `#FF8A4C` | Acento como **texto** (enlaces activos, códigos, subtítulos) |
| `--signal-fill` | `#E85A1C` | `#FF7A3A` | Acento **no textual** (punto del riel, filetes, marcas) |
| `--signal-ink` | `#FFFFFF` | `#1A0A02` | Texto sobre `--signal` |
| `--alert` / `--ok` | `#B3261E` / `#2F6B3F` | `#FF8A80` / `#7CC98E` | Seguridad y «parar» / confirmaciones |
| `--focus` | `#C2410C` | `#FF8A4C` | Anillo de foco: 2 px + 2 px de separación |
| `--st-taller`, `--st-concesionaria`, `--st-pista` | `#9A4430`, `#36617F`, `#45694A` | `#E3937A`, `#8DB4DA`, `#9CC39A` | Estaciones del recorrido (siempre con texto) |
| `--glass`, `--glass-strong`, `--glass-edge`, `--glass-blur` | superficie al 90 % / 94 % | ídem oscuro | Vidrio: solo sobre la escena (HUD, tarjeta, hoja) |
| `--shadow-1`, `--shadow-2` | luz cenital corta | sombra profunda | Elevación |

Los tres bloques de color (`:root`, `prefers-color-scheme: dark` con `:root:not([data-theme="light"])` y `:root[data-theme="dark"]`) repiten las mismas variables: al cambiar un valor, cambialo en los tres. Compatibilidad con nombres anteriores: `--grid`, `--grid-strong`, `--card-border`, `--panel-border`, `--field-border`, `--btn-*`, `--head-*`, `--bg-art*`.

### Tipografía y medidas

| Token | Valor | Uso |
|---|---|---|
| `--font-display` / `--font-ui` | Bricolage Grotesque (eje de ancho 75–100) | Títulos, interfaz. Rótulos «cartel»: `wdth 78`, mayúsculas; título de portada: `wdth 86` |
| `--font-body` | Source Serif 4 | Lectura (lecciones, definiciones, resúmenes) |
| `--font-mono` | JetBrains Mono | Códigos y contadores (`PARADA 06 DE 18`, `GL-01`) |
| `--fs-hero` / `--fs-1` / `--fs-2` / `--fs-3` | `clamp(3.25rem…9rem)` / `clamp(2.25rem…3.75rem)` / `clamp(1.5rem…2.125rem)` / `1.25rem` | Escala de títulos |
| `--fs-body` / `--fs-ui` / `--fs-label` | 1.125rem / .9375rem / .75rem | Lectura 18 px, interfaz 15 px, rótulo mono 12 px |
| `--lh-body` / `--lh-tight` | 1.62 / 1.02 | Interlineados |
| `--measure` / `--measure-prose` | 104ch / 72ch | Tope del contenedor / párrafos largos |
| `--gutter` | 16, 32 (≥ 900 px), 48 px (≥ 1280 px) | Margen lateral |
| `--space-1` … `--space-8` | 4, 8, 12, 16, 24, 40, 64, 104 px | Espaciado |
| `--radius`, `--r-sm`, `--r-md`, `--r-lg`, `--r-btn`, `--r-chip` | 6, 4, 6, 10, 6, 999 px | «Chapa plegada», chips en píldora |
| `--ease-out`, `--ease-in-out`, `--t-fast`, `--t-med`, `--t-slow` | `cubic-bezier(.2,.7,.2,1)`, 140 / 260 / 520 ms | Movimiento; con `prefers-reduced-motion` los tiempos pasan a 0 |

Las fuentes se cargan desde Google Fonts en `index.html` (licencia OFL). Para evitar la dependencia externa, descargá los archivos, declará `@font-face` con rutas relativas y quitá los `<link>`.

## Tema claro/oscuro

1. Sin preferencia guardada manda `prefers-color-scheme`.
2. El botón de la cabecera fuerza `data-theme="light|dark"` en `<html>` y lo guarda en `localStorage['mb-theme']` (dentro de `try/catch`).
3. Un script en el `<head>` aplica el tema guardado antes del primer pintado.
4. El recorrido relee el color del papel con el evento `mb-theme`.

## Componentes y patrones

- **Despiece (`disclosure()` / `despiece()` en `js/lib/components.js`)**: lista numerada `01…NN`; cada fila es `h > button[aria-expanded][aria-controls]` con «+/−» y un panel `role="region"`. Se usa en la hoja de detalle del recorrido, en la lección (columna lateral), y, con `level: 'h2'`, en el diagnóstico (cada síntoma es una fila). El panel muestra definición, «También», chips de relacionados y enlace al glosario.
- **Hoja de detalle (`dialog.sheet`, `js/lib/hoja-detalle.js`)**: `<dialog>` nativo con `showModal()`; hoja lateral de 480 px (escritorio) o inferior de hasta 88 dvh (≤ 700 px). `html.is-locked` ancla la página.
- **Tarjeta de parada (`.tr-card`)**: vidrio sobre la escena en escritorio; **sólida** (`--surface`) en retrato (`max-aspect-ratio: 4/5`), debajo de la lámina.
- **Riel (`.tr-rail`)**: tres estaciones proporcionales al scroll, línea de progreso, punto naranja y 18 marcas-botón.
- **Lección**: `header.l-head` (migas, rótulo-cartel del módulo, nivel, `h1`, resumen en serif, metadatos mono) · `figure.l-fig` (lámina 21:9 con el fotograma de la parada y «Ver en el recorrido»; las lecciones sin parada llevan el ícono del módulo) · `.l-grid`: desde 1240 px índice fijo `.toc` | `.prose` | `.side` (176 / flexible / 300 px); de 900 a 1239 px `.prose` | `.side`; en móvil una columna. Secciones numeradas `.l-sec`; pasos (`.steps`) con contador mono naranja; pager «anterior / siguiente».
- **Cajas (`.box`)**: `safety` (filete y fondo naranja suave), `manual` (filete `--line`), `tip`, `stop` (`--alert`), `mistakes`. En la hoja de detalle y el diagnóstico, el equivalente es `.note` / `.note--warn`.
- **Glosario y diagnóstico**: cabecera `.l-head` igual a la lección; barra pegajosa `.g-tools` con campo `.field`, cuenta en vivo (`role="status"`) y, en el glosario, A–Z (`.az`; las letras sin términos quedan atenuadas y deshabilitadas). Entradas `.gl-entry` con definición, «También», chips de relacionados y «En N lecciones» (las tres primeras y el resto en `<details>`). Estado vacío `.empty` con mensaje, ayuda y botón «Borrar filtro».
- **Indicador de nivel (`.gauge`)**, **chips (`.chip`)**, **término resaltado (`a.term`)** con tooltip, **ficha técnica (`.spec`)**, **fuentes (`.sources`)**.
- **Rótulos**: `.code` (mono, mayúsculas), `.cartel` (ancho condensado, mayúsculas), `.block-tag` (con filete naranja).
- **Esquemas**: clases `dg-ink`, `dg-fill`, `dg-line`, `dg-hot`, `dg-thin`, `dg-flame`, `dg-arrow`, `dg-mark`, `dg-text`.

## Accesibilidad de diseño

- Objetivos interactivos de al menos 44 px (las marcas del riel miden 24 px solo en escritorio); campos de 48 px.
- Foco: 2 px `--focus` + 2 px de separación; los encabezados enfocados por código no muestran anillo.
- Contraste medido por cálculo WCAG 2.x (colores compuestos sobre sus fondos reales) en lección, glosario, diagnóstico y créditos, claro y oscuro, a 375 y 1280 px: 0 fallas AA (los controles deshabilitados, como las letras sin términos, quedan fuera de la regla). Si tocás colores, volvé a medir.
- Movimiento: con `prefers-reduced-motion` no hay canvas ni inercia; el recorrido pasa a láminas fijas (en demos, `?rm=1`).
- Responsive: sin scroll horizontal a 375 px; en retrato, la escena es una lámina arriba y la tarjeta sólida va debajo (nunca texto sobre la imagen).
- Impresión: se ocultan cabecera, diálogos y botones del pie; fondo blanco.

## Caché

Los módulos JS (`import … from './x.js?v=N'`), los CSS y `main.js` del `index.html`, y `data/content.json` llevan `?v=N` (hoy `4`); los fotogramas usan `?v=3`. Al desplegar un cambio, subí el número en todos a la vez (los `import` de `js/` deben coincidir entre sí para que cada módulo se cargue una sola vez). Un reemplazo masivo sirve: buscar `?v=5` en `index.html` y `js/` y cambiarlo por `?v=5`.

## Alternativas exploradas

Se descartaron las identidades «Taller de barrio» y «Manual técnico» (papel milimetrado, acento azul y ámbar). La dirección actual se eligió tras estudiar referencias (Emons, Apple, Linear, Stripe, Igloo, The Pudding) documentadas en la especificación del proceso. Si querés otra identidad, el cambio se concentra en `tokens.css`, `icons.js` y los fotogramas del recorrido.
