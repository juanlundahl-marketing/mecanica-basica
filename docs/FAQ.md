# Preguntas frecuentes

## Abrí `index.html` y dice que no se pudo cargar el contenido
El sitio hace `fetch` de `data/content.json`, y los navegadores lo bloquean desde `file://`. Levantá un servidor: `python -m http.server 8000` dentro de la carpeta del sitio.

## ¿Necesito instalar algo?
No. No hay build ni `npm`. Alcanza con un servidor estático y un navegador moderno (usa módulos ES, `color-mix`, expresiones regulares con propiedades Unicode y lookbehind).

## En GitHub Pages veo la página en blanco o sin estilos
Revisá que `index.html` esté en la raíz de lo publicado (o en `/docs` si elegiste esa carpeta) y que las rutas no empiecen con `/`: son relativas a propósito. Mirá la consola del navegador por 404.

## Cambié `content.json` y no pasa nada
Recargá sin caché (Ctrl+F5). Si la página muestra «No se pudo cargar», hay un error de sintaxis JSON: corré `python docs/validar-contenido.py` o pegá el archivo en un validador.

## Una lección da «no encontrado»
El `id` de la URL no existe o tiene caracteres no admitidos (solo letras, números, guion y guion bajo). Revisá `relacionados` y los enlaces escritos a mano.

## ¿Por qué un término no se resalta en el texto?
Se busca el campo `termino` y sus `sinonimos` completos, sin importar tildes ni mayúsculas, con plural simple. Si el término lleva paréntesis o aclaraciones, no coincide. Además se resalta solo la primera aparición por lección y solo en el cuerpo (`secciones`).

## ¿Por qué el buscador no encuentra una parte de una palabra?
Busca por **inicio de palabra** a propósito: «frenos» se encuentra con «fre», no con «nos».

## ¿Cómo cambio los textos de la portada?
Están en `js/ui-strings.js` (`hero`, `home`), no en `content.json`. Ver [PERSONALIZAR.md](PERSONALIZAR.md).

## ¿Puedo usarlo para otro tema (bicicletas, cocina, electricidad)?
Sí: la estructura es genérica (módulos, lecciones, glosario, diagnóstico). Hay que reemplazar el contenido y los textos de `ui-strings.js`, y quitar o rehacer los 4 esquemas SVG, que son de autos. Cuidado con las convenciones de seguridad: si el tema implica riesgo, exigí fuente oficial.

## ¿Cómo agrego otro idioma?
Bloque hermano de `es` en `content.json` y `en: {...}` en `ui-strings.js`. Ver [PERSONALIZAR.md](PERSONALIZAR.md). No hay idiomas adicionales probados.

## ¿Funciona sin conexión?
El contenido sí si lo servís localmente; las tipografías se piden a Google Fonts y sin conexión caen a las del sistema.

## ¿Es una guía para reparar el auto?
No. Es material educativo general. No reemplaza el manual del auto ni a un profesional; los valores cambian por marca, modelo y año, y varios sistemas (airbags, aire acondicionado, combustible a presión, alta tensión) son solo para profesionales.

## Pendientes antes de publicar una versión propia
Del proyecto original, en lo que queda como trabajo editorial:
- Confirmar con un mecánico argentino el vocabulario local sin fuente escrita (prensa, volante de inercia, convertidor de torque, palier, sincro, aros, riel, centralita, crique, goma/gomería, maletero, carter).
- Verificar la normativa vigente (VTV/RTO, combustibles, GNC) antes de publicar: cambia.
- Respaldar con fuentes las 8 lecciones de la primera tanda que no tienen `verificado` (6 sin `fuentes`).
- Revisar el tono de los criterios de parada en síntomas de transmisión.
- La fuente argentina de transmisión es el manual de un solo modelo; el contenido de motor se apoya en manuales de modelos de otros mercados, presentados como ejemplo.

## ¿Qué no se verificó en esta documentación?
- No se repitió el QA visual ni de contraste; se cita lo medido en los informes de proceso.
- Solo se probó la plantilla (`docs/plantilla/content.example.json`) renderizando en una copia temporal: portada, módulo, lección, diagnóstico, glosario, término y búsqueda; términos resaltados. No se probó en GitHub Pages real ni en otros navegadores.
- No se verificó la agregación de un segundo idioma.
- Los pasos de GitHub Pages están descritos desde el procedimiento habitual; no se ejecutaron.
