# Personalizar el sitio

Guía para cambiar el contenido y los textos. Los campos están detallados en [ESQUEMA-DE-DATOS.md](ESQUEMA-DE-DATOS.md). Después de cada cambio corré `python docs/validar-contenido.py` y recargá el sitio con el servidor local.

## Qué se cambia dónde

| Quiero cambiar | Archivo y clave |
|---|---|
| Nombre y bajada del sitio | `data/content.json` → `es.ui.siteTitle`, `es.ui.siteTagline`; además `<title>` y `<meta name="description">` en `index.html` |
| Título y descripción de un módulo | `es.ui.modules.<id>` |
| Aviso legal del pie | `es.ui.legal` (`title`, `text`) y `es.ui.footer` |
| Rótulos de las secciones de lección | `es.ui.labels` |
| Textos de portada (titular, botones, «Cómo usar este sitio») | `js/ui-strings.js` → `hero`, `home` |
| Textos de diagnóstico, glosario, 404, buscador | `js/ui-strings.js` → `diag`, `glossary`, `notFound`, `search` |
| Leyenda de las fuentes y meses | `js/ui-strings.js` → `sources` |
| Textos de los esquemas SVG | `js/ui-strings.js` → `diagrams` |
| Colores, tipografías, espaciados | `css/tokens.css` (ver [SISTEMA-DE-DISENO.md](SISTEMA-DE-DISENO.md)) |
| Logo e íconos de módulos | `js/lib/icons.js` (`LOGO`, `MODULE_ICONS`, `HERO_ART`); favicon en `index.html` |
| Clave de tema/idioma guardados | `mb-theme`, `mb-lang` en `index.html` y `js/main.js` |

Los totales de la portada («Módulos» en `hero.block`) y de la descripción del glosario se calculan solos con los marcadores `{modules}`, `{lessons}` y `{terms}` (ver ESQUEMA-DE-DATOS.md). Hardcodeado que conviene revisar al cambiar de tema: el prefijo «MB» (`module.code`) y los esquemas, que están atados a ids de lección concretos (ver abajo).

## Agregar una lección

1. Elegí un `id` único en minúsculas con guiones (`cambio-de-bujias`).
2. Agregá el objeto al array `es.lecciones` con todos los campos obligatorios (ver esquema). El orden dentro del módulo es el orden del array.
3. Cargá en `glosario` los ids de los términos que la lección usa; si falta alguno, creálo (siguiente sección).
4. Agregá `relacionados` en ambos sentidos si corresponde.
5. Cargá `fuentes` con `texto` y `url`, y `verificado` con el mes (`"2026-10"`).
6. Si es un síntoma, sumá el bloque `diagnostico` y ponela en el módulo `diagnostico`: aparece sola en `#/diagnostico`.
7. Validá y revisá la ruta `#/leccion/<id>`.

## Agregar un término, un sinónimo o una fuente

- **Término**: objeto en `es.glosario` con `id`, `termino`, `definicion` y `relacionado`. El orden de la lista es alfabético automático.
- **Sinónimo**: agregalo en `sinonimos` del término. Se resalta en el texto de las lecciones y se encuentra en el buscador. Ejemplos del contenido actual: «aceite del motor» para «Aceite de motor». Para el resaltado se admite plural simple (-s/-es) y se ignoran las tildes, pero **no se resaltan palabras sueltas** que no estén declaradas: si querés que «bujías» y «bujía» funcionen, alcanza con el término `Bujía`.
- **No** le pongas paréntesis ni aclaraciones al campo `termino`: es lo que se busca en el texto.
- **Fuente**: agregá `{ "texto": "...", "url": "https://..." }` a `fuentes`. Nombrá el documento concreto (manual, página, año), no solo el dominio.
- Un término se resalta solo la **primera vez** que aparece en el cuerpo de cada lección.

## Agregar un esquema SVG

Los 4 esquemas actuales (ciclo de 4 tiempos, frenos, sistema eléctrico, refrigeración) son funciones en `js/lib/diagrams.js` que generan SVG inline, y se asocian a una lección por su id en `MAP` (`motor-4-tiempos`, `frenos`, `sistema-electrico`, `refrigeracion`). Si cambiás los ids de esas lecciones o querés otro esquema, hay que tocar código: escribir la función, sumar sus textos a `ui.diagrams` en `js/ui-strings.js` y registrarla en `MAP`. Usá las clases `dg-*` de `css/diagrams.css`, un `<title>` y un `<desc>` accesibles, y colores solo con variables CSS.

## Agregar un módulo

Sumá el id a `meta.modulos` (antes de `glosario`, que va último), su entrada en `es.ui.modules`, un ícono en `MODULE_ICONS` y las lecciones con ese `modulo`. Los módulos nuevos se listan en portada y funcionan en `#/modulo/<id>`. La navegación superior solo enlaza al primero (`#/modulo/<primero>`).

## Agregar un idioma

1. En `meta.langs` agregá el código (`"en"`).
2. Copiá el bloque `es` completo como `en` y traducilo, **sin cambiar ids**.
3. En `js/ui-strings.js` agregá `en: { ... }` con las mismas claves que `es`.
4. Aparece el selector de idioma. Sin traducción de `EXTRA` el sitio usa el idioma por defecto para esos textos.
Estado: no hay ningún otro idioma probado; es una capacidad de la estructura, no una funcionalidad verificada.

## Convenciones editoriales

Estas reglas se aplicaron a todo el contenido; mantenelas si agregás material.

1. **Sin valores universales.** Nada de «el aceite se cambia cada X km» ni torques o presiones como si valieran para todos los autos. Remitir al manual del fabricante en `verificarEnManual` y en el texto. Un valor numérico solo va si la fuente lo da y se atribuye («según el manual del Onix 2024»).
2. **Seguridad solo con fuente de fabricante u organismo oficial.** Una advertencia nueva en `seguridad` o en `pararYLlamar` debe poder rastrearse a un manual del propietario, un organismo oficial o una norma. Si es un criterio de prudencia del sitio, rotularlo como tal («no verificada con fuente de fabricante»).
3. **Lo no verificado se dice.** Usá `notaFuentes` para limitaciones, normativa que puede haber cambiado o fuentes de un solo modelo.
4. **Vocabulario argentino**: *capot* (no «capó»), *cables puente* (no «pinzas de arranque»), *crique* para el gato, *llave crique* para la de trinquete, *cubierta*, *gomería*. Voseo en las instrucciones («consultá», «apagá»). Los términos locales sin fuente escrita figuran como pendientes de confirmar con un mecánico argentino.
5. **Tono sobrio**: oraciones cortas, sin promesas («esto arregla...»), sin alarmismo; el criterio de parada va en `pararYLlamar`.
6. **Terceros**: no copies texto de manuales ni de sitios; resumí con palabras propias y citá la fuente.
7. **Sin datos personales** en el contenido ni en las fuentes.

## Reemplazar el contenido por completo

1. Copiá `docs/plantilla/content.example.json` sobre `data/content.json`.
2. Editá `ui` (nombre, bajada, módulos, legal, pie) y reemplazá lecciones y términos.
3. Revisá los textos de `js/ui-strings.js` que siguen hablando de autos (portada, `home.how`, diagnóstico).
4. Quitá o reescribí los 4 esquemas si el tema cambia.
5. Validá, probá en local y recién entonces publicá.
