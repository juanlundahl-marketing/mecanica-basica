# Método de investigación

Cómo se produjo el contenido de Mecánica Básica, para repetirlo con otro tema. La idea central: **el modelo no afirma de memoria** datos técnicos, cifras ni normativa; todo sale de fuentes consultadas y se puede rastrear.

## Flujo

1. **Plan de investigación.** Por cada bloque temático (motor, frenos, eléctrico, transmisión, suspensión, herramientas, mantenimiento, diagnóstico, híbridos y eléctricos, contexto argentino) se define qué hace falta saber y qué no debe afirmarse sin fuente. Se redactan preguntas con alcance y formato de salida.
2. **Investigación en Perplexity.** Quien documenta (la persona, no el asistente) pega cada consulta en Perplexity u otro buscador con citas y guarda la respuesta completa, con sus enlaces, en una carpeta de entrada privada. El asistente no investiga «de memoria» lo que falta.
3. **Extracción.** Se pasa cada respuesta a un JSON de afirmaciones: texto, fuente citada, tipo de fuente (organismo oficial, fabricante, diccionario, otro) y observaciones. Tarea mecánica: no se agrega ni se corrige nada. Resultado por bloque: `*-extraccion.json`.
4. **Verificación de fuentes.** Para cada URL citada se prueba el estado HTTP (`curl -sIL`, y GET si HEAD falla) y se arma una tabla de trazabilidad: afirmación, veredicto, fuente, lecciones afectadas, fecha. Se marcan las afirmaciones con fuente débil (solo un fabricante, diccionario no verificable, medio no oficial) y las que ninguna fuente respalda. Resultado: `*-fuentes.md`.
5. **Redacción.** Un borrador por bloque (`*-lecciones-borrador.json`) escrito solo con afirmaciones respaldadas, con las reglas editoriales de [PERSONALIZAR.md](PERSONALIZAR.md): sin valores universales, seguridad con fuente de fabricante u oficial, vocabulario argentino. Las dudas de vocabulario quedan anotadas en el borrador.
6. **Integración.** Se pasan las lecciones y términos a `data/content.json`, con `fuentes`, `verificado` y `notaFuentes`; se cruzan ids (`relacionados`, `glosario`).
7. **QA.** Por bloque, un informe `qa-*.md`: totales, referencias rotas, scroll horizontal, contraste, teclado, consola, enlaces externos y honestidad del contenido. Las correcciones son ediciones mínimas.
8. **Pendientes antes de publicar.** Lista de lo que quedó sin confirmar (`pendientes-antes-de-publicar.md`, en la carpeta de proceso del proyecto, no publicada).

## Reglas de honestidad

- Nada inventado: ni datos, ni cifras, ni fuentes, ni títulos de nadie.
- Un valor numérico solo entra si una fuente lo da, y se atribuye a esa fuente («según el manual del Onix 2024»), con el modelo como ejemplo y no como regla general.
- Un HTTP 200 prueba que la página existe, **no** que respalde la afirmación. Un 403 no prueba nada: se marca como no verificable. Solo se verificó el estado HTTP, no el contenido de cada página, salvo lectura puntual registrada.
- Si la respuesta de Perplexity no cita, o cita una fuente que no dice eso, la afirmación se descarta o se rotula («no verificada con fuente de fabricante»).
- Fuentes de un solo modelo o de otro país se presentan como ejemplo, no como norma local.
- Normativa (VTV/RTO, GNC, combustibles) cambia: se remite a la fuente oficial vigente y se deja una `notaFuentes`.
- Vocabulario local sin fuente escrita se confirma con un mecánico argentino antes de publicar.

## Qué se midió y qué fue a ojo

| Se midió (script, DOM o cálculo) | Fue criterio o lectura |
|---|---|
| Totales de lecciones y términos | Elección de qué entra en cada nivel |
| Ids duplicados y referencias rotas (script) | Calidad y claridad de la redacción |
| Estado HTTP de las URLs (`curl`) | Si una fuente realmente respalda una afirmación (lectura puntual) |
| Scroll horizontal, contraste AA y foco (medición del DOM, 3 anchos × 2 temas) | Tono, orden pedagógico, criterios de «parar y llamar» |
| Consola sin errores propios, atributos de enlaces externos | Elección de vocabulario argentino |

Las mediciones de QA corresponden al contenido de ese momento (110 lecciones y 187 términos en el último informe); el sitio hoy tiene 117 y 201, y la cobertura de las lecciones agregadas después no está registrada en esos informes.

## Estado de la verificación

- 116 de 117 lecciones tienen `verificado` y `fuentes`. Las 7 de la primera tanda (vision-general, motor-4-tiempos, lubricacion, refrigeracion, escape, encendido y transmision) se respaldaron en octubre de 2026 con fuentes leídas, y cada una aclara en `notaFuentes` qué parte es explicación general del sitio. `linterna` no tiene fuente: solo `notaFuentes`, sin fecha.
- Pendientes editoriales vigentes: términos locales de transmisión y motor (prensa, volante de inercia, convertidor, palier, sincro, aros, riel, centralita), uso de «crique», criterio de parada en síntomas de transmisión, normativa VTV/RTO/GNC, y la orientación sobre autos inundados en híbridos y eléctricos.

## Repetirlo con otro tema

1. Definí bloques y preguntas; pedí a Perplexity respuestas con citas.
2. Extraé afirmaciones a JSON sin interpretar.
3. Verificá las URLs y armá la tabla de trazabilidad.
4. Redactá solo con lo respaldado, citando la fuente en el texto cuando haya cifras.
5. Integrá en `content.json`, corré `python docs/validar-contenido.py`, hacé QA y dejá la lista de pendientes.

Los archivos de proceso (extracciones, borradores, tablas de fuentes) se guardan fuera del sitio publicado; no los subas junto con él.
