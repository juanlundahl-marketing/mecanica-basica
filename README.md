# Mecánica Básica

Material de estudio para entender cómo funciona un auto, qué mantener y qué mirar cuando algo no anda bien. Sitio estático en español rioplatense: HTML, CSS y JavaScript puros, sin build ni dependencias.

Contenido actual: 117 lecciones en 4 módulos (Cómo funciona un auto, Herramientas, Mantenimiento básico, Diagnóstico por síntomas), un glosario de 201 términos con sinónimos, buscador, 4 esquemas SVG y tema claro/oscuro (sigue al sistema y tiene un botón para elegirlo).

> **Aviso importante.** Es material educativo de carácter general. No reemplaza el manual de tu auto ni a un profesional. Torques, presiones, capacidades e intervalos varían según marca, modelo y año: consultá siempre el manual del fabricante. Trabajar en un vehículo implica riesgos; si no estás seguro de una tarea, no la hagas y consultá a un mecánico. Airbags, aire acondicionado, combustible a presión y alta tensión de híbridos y eléctricos son tareas para un profesional.

## Para quién es

- Quien quiere aprender mecánica básica desde cero.
- Quien quiere **replicar el sitio con su propio contenido** (otro tema, otra región, otro idioma). La estructura está pensada para eso: todo el contenido vive en un solo archivo, `data/content.json`.

## Correrlo localmente

Necesita un servidor HTTP (el sitio hace `fetch` de `data/content.json`; abrir `index.html` con doble clic no funciona).

```bash
cd sitio
python -m http.server 8000
# abrir http://localhost:8000
```

Cualquier otro servidor estático sirve (`npx serve`, la extensión Live Server, etc.).

## Estructura

```
index.html            esqueleto: cabecera, buscador, <main>, pie
.nojekyll             evita que GitHub Pages procese el sitio con Jekyll
css/                  tokens (colores, tipografías), base, componentes, esquemas
js/main.js            arranque, idioma, tema, router por hash, buscador
js/ui-strings.js      textos de interfaz (bloque por idioma)
js/lib/               model (índices y búsqueda), text (normalización y resaltado), dom, iconos, esquemas SVG
js/views/             una vista por ruta: home, module, lesson, diagnostic, glossary, search, notfound
data/content.json     TODO el contenido: lecciones, glosario, textos del sitio
docs/                 documentación (ver abajo) y plantilla de ejemplo
```

## Documentación

| Documento | Para qué |
|---|---|
| [docs/PERSONALIZAR.md](docs/PERSONALIZAR.md) | Cambiar contenido, agregar lecciones, términos, sinónimos y fuentes; convenciones editoriales |
| [docs/ESQUEMA-DE-DATOS.md](docs/ESQUEMA-DE-DATOS.md) | Todos los campos de `content.json`, con ejemplos mínimos |
| [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md) | Módulos, rutas, buscador, resaltado, accesibilidad |
| [docs/SISTEMA-DE-DISENO.md](docs/SISTEMA-DE-DISENO.md) | Tokens, tipografías, tema y estilo «manual técnico» |
| [docs/METODO-DE-INVESTIGACION.md](docs/METODO-DE-INVESTIGACION.md) | Cómo se produjo y verificó el contenido |
| [docs/FAQ.md](docs/FAQ.md) | Preguntas frecuentes y límites conocidos |
| [docs/plantilla/content.example.json](docs/plantilla/content.example.json) | Contenido de ejemplo ficticio con la misma estructura |
| [docs/validar-contenido.py](docs/validar-contenido.py) | Script que revisa ids duplicados y referencias rotas |

## Publicar en GitHub Pages

Todas las rutas son relativas (`css/...`, `js/...`, `data/content.json`) y la navegación usa hash (`#/leccion/...`), así que funciona bajo `https://usuario.github.io/repo/` sin configuración. `.nojekyll` ya está incluido.

1. Subí el contenido de la carpeta `sitio` a un repositorio (la raíz del repo debe tener `index.html`).
2. En el repositorio: Settings → Pages → Build and deployment → Source: *Deploy from a branch*, rama `main`, carpeta `/ (root)`.
3. Esperá un minuto y abrí la URL que muestra Pages.

Antes de publicar, revisá la lista de pendientes editoriales (ver [FAQ](docs/FAQ.md)) y corré `python docs/validar-contenido.py`.

## Licencia

Código y estructura: MIT, ver [LICENSE](LICENSE). El texto de las lecciones y del glosario es contenido original de este proyecto, con fuentes citadas por lección; si lo reutilizás, mantené las fuentes y el aviso de arriba. Las marcas y manuales citados pertenecen a sus titulares.

## Limitaciones conocidas

- Las tipografías (Barlow Condensed, IBM Plex Sans y Mono) se cargan desde Google Fonts; sin conexión se usan tipografías del sistema.
- Solo hay un idioma (`es`); la estructura admite más, pero no hay traducciones.
- Todo el contenido está en nivel «básico».
- Varias afirmaciones dependen de fuentes de ejemplo de un solo modelo de auto o de normativa que cambia (VTV/RTO, GNC). Están rotuladas como ejemplo en cada lección.
