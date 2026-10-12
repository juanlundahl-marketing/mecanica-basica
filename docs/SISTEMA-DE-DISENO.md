# Sistema de diseño

Estilo «manual técnico»: fondo de papel milimetrado, marcos de plano con cuadro de rotulación, tipografía condensada en mayúsculas para títulos, monoespaciada para etiquetas y códigos (MB-01, L-03, FIG.), y un acento azul de línea de plano con una señal ámbar. Sobrio, sin ilustración decorativa fuera de la portada y los esquemas.

Los valores salen de `css/tokens.css`; si hay diferencia, manda el archivo.

## Archivos CSS

| Archivo | Contenido |
|---|---|
| `tokens.css` | Variables (color, tipografía, espaciado) y los dos temas |
| `base.css` | Reset, tipografía, fondo cuadriculado, cabecera, buscador, pie, botones, foco, `prefers-reduced-motion`, impresión |
| `components.css` | Portada, tarjetas, cajas (`.box`), pasos, fichas técnicas, glosario, diagnóstico, fuentes |
| `diagrams.css` | Clases `dg-*` de los esquemas SVG |

## Tokens de color

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--paper` | `#EEF2F3` | `#0B1218` | Fondo de página |
| `--surface` / `--surface-2` | `#FFFFFF` / `#E3E9EC` | `#111C25` / `#172530` | Tarjetas, cajas / rellenos de esquemas |
| `--ink` / `--ink-2` / `--muted` | `#0E1A24` / `#2C3B47` / `#4E5D69` | `#E3EAF0` / `#C3CFD8` / `#93A3B0` | Texto principal, secundario, auxiliar |
| `--grid` / `--grid-strong` | `#D2DCE2` / `#8FA1AE` | `#1A2833` / `#4A6174` | Cuadrícula de fondo / bordes finos |
| `--line` / `--line-ink` | `#1B4F8A` / `#FFFFFF` | `#6CC3E0` / `#0B1218` | Acento (enlaces, botón primario) y texto sobre él |
| `--signal`, `--signal-fill`, `--signal-ink` | `#8A5A00`, `#F2B33D`, `#0E1A24` | `#F2B33D`, `#F2B33D`, `#0B1218` | Señal ámbar (tips, resaltados) |
| `--alert` / `--alert-ink` | `#B3261E` / `#FFFFFF` | `#EF6A62` / `#0B1218` | Seguridad y «parar» |
| `--ok` | `#1F6B45` | `#5CC48A` | Confirmaciones |
| `--focus` | `#C2410C` | `#FFB86B` | Anillo de foco |

Para rehacer la identidad cambiá estos valores en **ambos** temas (bloque claro `:root`, bloque oscuro de `prefers-color-scheme` y bloque `:root[data-theme="dark"]`, que repiten las mismas variables). Los componentes no usan colores fijos: todo pasa por variables, incluso los esquemas.

## Tipografías

- `--font-display`: Barlow Condensed (500/600/700), títulos en mayúsculas.
- `--font-body`: IBM Plex Sans (400/500/600), texto corrido a 1.0625rem y interlineado 1.6.
- `--font-mono`: IBM Plex Mono (400/500/600), etiquetas, navegación, botones, códigos.

Se cargan desde Google Fonts en `index.html` (`preconnect` + hoja con `display=swap`). Fallbacks: `Arial Narrow`, `system-ui`, `ui-monospace`. Para evitar la dependencia externa, descargá los archivos de fuente, ponelos en una carpeta `fonts/`, declará `@font-face` con rutas relativas y quitá los `<link>` de Google (revisá las licencias de cada tipografía).

## Espaciado, medida y radios

`--space-1` a `--space-7` = 4, 8, 12, 16, 24, 40, 64 px. `--gutter` 16 px (32 px desde 768 px). `--measure: 104ch` es el ancho máximo de texto y cajas. `--radius: 2px` (casi cuadrado, a propósito).

## Tema claro/oscuro

1. Sin preferencia guardada manda `prefers-color-scheme`.
2. El botón de la cabecera fuerza `data-theme="light|dark"` en `<html>` y lo guarda en `localStorage['mb-theme']`.
3. Un script en el `<head>` de `index.html` aplica el tema guardado antes del primer pintado para evitar el parpadeo.
4. `color-scheme` se declara en ambos temas para que los controles nativos coincidan.

## Componentes y patrones

- **Marco (`.frame`)**: borde y fondo de plano; lleva las tarjetas de módulo, la portada, los esquemas.
- **Cuadro de rotulación (`.titleblock`)**: tabla de pares etiqueta/valor en la portada.
- **Cajas (`.box`)**: `safety` (relleno `--alert` con rayado diagonal), `manual` (borde punteado `--line`, «verificá en el manual»), `tip` (borde izquierdo ámbar), `stop` (borde `--alert`, «cuándo parar y llamar»).
- **Indicador de nivel (`.gauge`)**: aguja de reloj, de 1 a 3.
- **Pasos (`.steps`)**: lista numerada con contador CSS.
- **Ficha técnica (`.spec`)**: pares etiqueta/valor para el bloque de mantenimiento.
- **Etiquetas (`.label`, `.block-tag`)**: mono en mayúsculas.
- **Término resaltado (`a.term`)** y **chips** de relacionados.
- **Esquemas**: clases `dg-ink`, `dg-fill`, `dg-line`, `dg-hot`, `dg-thin`, `dg-flame`, `dg-arrow`, `dg-mark`, `dg-text`.

## Accesibilidad de diseño

- Mínimo 44 px de alto en elementos interactivos principales; 48 px en campos de búsqueda.
- Foco: contorno de 2 px más halo (`--focus`), visible en ambos temas.
- Contraste: las notas de QA del proyecto registran 0 fallas AA sobre el contenido de ese momento (mediciones por cálculo WCAG en 9 vistas × 2 temas). No se repitió al cambiar tokens: si tocás colores, volvé a medir.
- Movimiento: transiciones cortas, anuladas con `prefers-reduced-motion`.
- Responsive: una columna en móvil; lección en dos columnas desde 1000 px; la cabecera y la navegación se reacomodan sin scroll horizontal (medido a 375, 768 y 1280 px en QA).
- Impresión: se ocultan cabecera, buscador y botones del pie; fondo blanco.

## Alternativas exploradas

Antes de implementar se compararon dos tableros (carpeta de proceso del proyecto, no publicada): «Taller de barrio» y «Manual técnico». Se eligió el segundo. Si querés otra identidad, el cambio se concentra en `tokens.css`, `icons.js` y el fondo de `base.css`.
