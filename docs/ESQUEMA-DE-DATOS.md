# Esquema de datos

Todo el contenido está en `data/content.json`. Estructura de primer nivel:

```json
{ "meta": { ... }, "es": { "ui": { ... }, "lecciones": [ ... ], "glosario": [ ... ] } }
```

Un idioma nuevo es un bloque hermano de `es` con las mismas claves. **Los ids no se traducen.** Medido sobre el contenido actual: 117 lecciones, 201 términos.

## `meta`

| Clave | Uso |
|---|---|
| `langs` | Idiomas disponibles (`["es"]`). Si hay más de uno aparece el selector. |
| `defaultLang` | Idioma por defecto. |
| `modulos` | Orden de los módulos en inicio y navegación: `como-funciona`, `herramientas`, `mantenimiento`, `diagnostico`, `glosario`. |
| `siteId`, `version`, `nivelesDisponibles`, `nota` | Informativas: el código no las lee. |

Reglas del código sobre `modulos`: el primer id es el destino de «Lecciones» y del botón de inicio; `glosario` se trata como módulo especial (muestra el conteo de términos y enlaza a `#/glosario`); `diagnostico` hace que sus lecciones aparezcan en el grupo «Diagnóstico» del buscador. Cada id necesita `ui.modules[id]` (título y descripción) y, para el ícono, una entrada en `MODULE_ICONS` de `js/lib/icons.js` (si falta, usa el del glosario).

## Lección (`lecciones[]`)

Obligatorios (el script `docs/validar-contenido.py` los verifica):

| Campo | Tipo | Notas |
|---|---|---|
| `id` | string | Único; va en la URL `#/leccion/<id>`. Solo letras, números, guion y guion bajo. |
| `modulo` | string | Uno de `meta.modulos`. |
| `titulo`, `resumen` | string | |
| `nivel` | `basico` \| `intermedio` \| `avanzado` | Define el indicador de nivel; el módulo muestra el nivel más alto de sus lecciones. |
| `secciones` | `[{titulo, texto}]` | Cuerpo. Aquí se resaltan los términos del glosario. |
| `pasos`, `tips`, `erroresComunes` | `string[]` | Pueden ir vacíos. |
| `seguridad` | `string[]` | Se muestra en caja de alerta. |
| `verificarEnManual` | `{requerido: bool, nota: string}` | Si `nota` falta se usa `ui.verifyManualDefault`. |
| `relacionados` | `string[]` | Ids de otras lecciones. |
| `glosario` | `string[]` | Ids de términos que usa la lección (alimenta «dónde se usa» en el glosario). |

Opcionales:

| Campo | Notas |
|---|---|
| `fuentes` | `[{texto, url}]`. También acepta strings sueltos; sin `url` se muestra como texto. Los enlaces abren en pestaña nueva con `rel="noopener noreferrer"`. |
| `verificado` | `"AAAA-MM"`. Se muestra como «Verificado en <mes> de <año>». |
| `notaFuentes` | Texto libre bajo las fuentes: limitaciones, normativa que puede haber cambiado. |
| `mantenimiento` | `{frecuencia, principiante, profesional}`. Bloque de mantenimiento. |
| `diagnostico` | `{causasProbables[], revisarPrimero[], pararYLlamar}`. Convierte la lección en ficha de síntoma y la suma a `#/diagnostico`. |

Estado actual: 116 lecciones con `verificado` (`2026-10`), 116 con `fuentes`, 30 con `mantenimiento`, 28 con `diagnostico` y 26 con `notaFuentes`. La lección `linterna` no tiene fuentes ni fecha: lleva solo una `notaFuentes` que lo aclara (el sitio la muestra igual). El validador no avisa si falta `fuentes` cuando hay `notaFuentes`.

### Ejemplo mínimo

```json
{
  "id": "ejemplo-leccion-1",
  "modulo": "como-funciona",
  "titulo": "Lección de ejemplo",
  "nivel": "basico",
  "resumen": "Una o dos oraciones.",
  "secciones": [{ "titulo": "Qué es", "texto": "Texto sin valores universales." }],
  "pasos": [],
  "seguridad": [],
  "verificarEnManual": { "requerido": true, "nota": "Qué confirmar en el manual del auto." },
  "tips": [],
  "erroresComunes": [],
  "relacionados": [],
  "glosario": ["aceite-ejemplo"]
}
```

## Término (`glosario[]`)

| Campo | Notas |
|---|---|
| `id` | Único; ruta `#/glosario/<id>`. |
| `termino` | Nombre visible. **Es también lo que se busca en el texto para resaltar**: no le pongas aclaraciones entre paréntesis. |
| `definicion` | Una o dos oraciones. |
| `relacionado` | Ids de otros términos. |
| `sinonimos` | Opcional. Variantes que también se resaltan y se buscan (148 de 201 términos tienen). |

```json
{ "id": "aceite-ejemplo", "termino": "Aceite", "sinonimos": ["lubricante"], "definicion": "Definición corta.", "relacionado": ["bujia-ejemplo"] }
```

## `ui` (textos del sitio)

El código fusiona de forma recursiva `EXTRA[lang]` (en `js/ui-strings.js`) con `content[lang].ui`; lo del JSON gana. Claves que vive en el JSON: `siteTitle`, `siteTagline`, `nav`, `search`, `labels` (rótulos de las secciones de lección), `modules` (título y descripción por módulo), `footer`, `legal` (aviso del pie), `verifyManualDefault`. Claves de `EXTRA`: hero, textos de inicio, diagnóstico, glosario, 404, fuentes (`sources`) y textos de los 4 esquemas (`diagrams`).

Totales calculados: en las descripciones de `ui.modules` y en `hero.block` (`ui-strings.js`) podés usar los marcadores `{modules}`, `{lessons}` y `{terms}`; `fillCounts` (`js/lib/model.js`) los reemplaza por la cantidad real de módulos, lecciones y términos, así no hay que actualizar números a mano. El módulo `glosario` y el bloque del plano de la portada ya los usan.

## Plantilla

`docs/plantilla/content.example.json` tiene la misma estructura con datos ficticios (5 lecciones, 2 términos). Para probarla en una copia: copiá el sitio, reemplazá `data/content.json` por la plantilla y levantá el servidor. En esta documentación se probó así que las rutas de inicio, módulos, lección, diagnóstico, glosario y búsqueda renderizan y que el resaltado funciona.

## Validar

```bash
python docs/validar-contenido.py                          # data/content.json
python docs/validar-contenido.py docs/plantilla/content.example.json
```

Revisa ids duplicados, campos obligatorios, módulos desconocidos, `relacionados`/`glosario`/`relacionado` rotos y el formato de `verificado`. No verifica que las URLs respondan ni que las fuentes respalden la afirmación.
