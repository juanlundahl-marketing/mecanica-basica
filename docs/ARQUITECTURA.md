# Arquitectura

Sitio de una sola página: `index.html` carga `js/main.js` como módulo ES, que baja `data/content.json`, arma un modelo en memoria y pinta la vista según el hash de la URL. No hay build, bundler ni dependencias de código (solo una hoja de tipografías de Google Fonts).

## Arranque (`js/main.js`)

1. `fetch('data/content.json')`; si falla muestra un mensaje en `<main>`.
2. **Idioma**: `?lang=` en la URL, luego `localStorage['mb-lang']`, luego el idioma del navegador, luego `meta.defaultLang`. Solo se acepta si está en `meta.langs`. Se ajusta `<html lang>` (`es` → `es-AR`).
3. **Textos**: `ui = merge(EXTRA[lang], content[lang].ui)` (fusión recursiva; gana el JSON).
4. `buildModel(meta, data)` crea los índices.
5. `buildChrome`: cabecera con navegación, selector de idioma (solo si hay más de uno) y botón de tema; barra de búsqueda con panel de resultados; pie con aviso legal.
6. Router y primer render.

## Rutas (por hash)

Definidas en `ROUTES` de `main.js`. Al usar hash no hace falta configuración del servidor y funciona en cualquier subcarpeta.

| Ruta | Vista | Archivo |
|---|---|---|
| `#/` | Portada | `views/home.js` |
| `#/modulo/<id>` | Lista de lecciones del módulo | `views/module.js` |
| `#/leccion/<id>` | Lección | `views/lesson.js` |
| `#/diagnostico` | Diagnóstico por síntomas con filtro | `views/diagnostic.js` |
| `#/glosario` y `#/glosario/<id>` | Glosario A-Z; la segunda enfoca un término | `views/glossary.js` |
| `#/buscar/<texto>` | Resultados completos | `views/search.js` |
| cualquier otra | 404 | `views/notfound.js` |

Cada vista exporta `render(el, ctx)` y puede devolver una función de limpieza. `ctx` trae `data`, `meta`, `ui`, `lang`, `model`, `params`, `setTitle()`, `go()` y `notFound()`. En cada cambio de ruta: limpieza, cierre del panel de búsqueda, render, marca `aria-current` en la navegación, scroll arriba y foco en `<main>` (salvo glosario, que posiciona su propio foco), y anuncio del título en una región `aria-live`.

## Módulos de `js/lib/`

- `model.js`: `buildModel` (índices por id, glosario ordenado en español, uso de cada término por lección, módulos con nivel y lecciones, documentos de búsqueda), `lessonPos` (anterior/siguiente), `search`.
- `text.js`: `norm` (minúsculas sin tildes), `hasWordStart`, `makeHighlighter`, `firstLetter`, `plural`.
- `dom.js`: helper `h()` para crear nodos y `svg()` para insertar SVG como string.
- `components.js`: indicador de nivel, cajas de seguridad, de «verificá en el manual» y listas.
- `icons.js`: logo, ícono por módulo, ilustración de portada.
- `diagrams.js`: los 4 esquemas SVG y `diagramFor(lessonId)`.

## Buscador

Índice construido una vez por carga. Cada lección y cada término es un documento con tres campos normalizados: título (`t`), resumen o definición (`s`) y cuerpo (`b`: secciones, pasos, seguridad, tips, errores, bloque de diagnóstico y sinónimos de sus términos). En los términos, `t` incluye los sinónimos.

- La consulta se parte en palabras; **todas** deben aparecer (AND).
- Coincide por **inicio de palabra** (`hasWordStart`): «bat» encuentra «batería» pero «ria» no.
- Puntaje por palabra: 6 si el título empieza con ella, 4 si aparece al inicio de otra palabra del título, 2 en resumen, 1 en cuerpo; se suman. Orden: puntaje descendente y luego alfabético.
- Resultados agrupados: lecciones, diagnóstico (lecciones del módulo `diagnostico`) y glosario.
- Panel desplegable desde 2 letras (muestra hasta 5 por grupo), «ver todos» lleva a `#/buscar/<texto>`; Escape cierra, flecha abajo pasa a los resultados, y un `aria-live` anuncia la cantidad.

## Glosario y resaltado

`makeHighlighter(terms, mk)` arma una expresión regular por término con el nombre y los `sinonimos`, ordenados del más largo al más corto. Es insensible a mayúsculas, tolera tildes (clases como `[eéèêë]`, y `ñ`), acepta plural simple (-s/-es) y exige límites de palabra con Unicode. En cada texto elige la coincidencia más temprana (a igual posición, la más larga) y **enlaza cada término una sola vez** por lección. Los enlaces (`a.term`) van a `#/glosario/<id>`. La vista de glosario lista por letra, con filtro, navegación A-Z, términos relacionados y las lecciones que lo usan.

## Accesibilidad (lo que el código implementa)

- Enlace «Saltar al contenido» que mueve el foco a `<main>`.
- `<main tabindex="-1">` recibe el foco en cada ruta; título de página actualizado y anunciado.
- Regiones `aria-live` para búsqueda, glosario, diagnóstico y rutas.
- Migas con `aria-current="page"`; navegación principal etiquetada.
- Foco visible (`:focus-visible` con color `--focus`); objetivos táctiles de al menos 44 px en botones, navegación, pager y A-Z.
- Esquemas SVG con `role="img"`, `<title>` y `<desc>`.
- Enlaces externos con `rel="noopener noreferrer"` y etiqueta que avisa de pestaña nueva.
- `prefers-reduced-motion`: se anulan transiciones y animaciones (`css/base.css`).
- Tema: respeta `prefers-color-scheme`; el botón guarda la elección en `localStorage` (siempre dentro de `try/catch`).
- `<noscript>` avisa que se necesita JavaScript.

Las notas de QA del proyecto (carpeta de proceso, no publicada) registran mediciones de contraste AA, scroll horizontal a 375/768/1280 px y teclado sobre el contenido de ese momento; no se repitieron para esta documentación.

## Estado y almacenamiento

Solo `localStorage`: `mb-theme` (`light`/`dark`) y `mb-lang`. Todo el resto es estado derivado de la URL. No hay cookies, analítica ni llamadas a servicios, salvo la hoja de Google Fonts.

## Puntos de extensión y de fragilidad

- Los esquemas dependen de 4 ids de lección (`MAP` en `diagrams.js`).
- Los módulos `glosario` y `diagnostico` tienen tratamiento especial en código.
- `data/content.json` pesa unos 780 KB y se baja entero: razonable para este tamaño; con miles de lecciones habría que partirlo.
