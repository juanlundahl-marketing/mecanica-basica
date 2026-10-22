// Textos de interfaz que complementan data/content.json (bloque ui de cada idioma).
// i18n-ready: para sumar un idioma, agregar un bloque hermano de "es" con las mismas claves.
export const EXTRA = {
  es: {
    skip: 'Saltar al contenido',
    brandHome: 'Mecánica Básica, ir al inicio',
    navAria: 'Principal',
    nav: { diagnostic: 'Diagnóstico', lessons: 'Lecciones', tour: 'Recorrido' },
    theme: { toDark: 'Modo oscuro', toLight: 'Modo claro', aria: 'Cambiar tema de color' },
    langLabel: 'Idioma',
    search: { label: 'Buscar en el manual', submit: 'Buscar', count: ['1 resultado', '{n} resultados'], groupLessons: 'Lecciones', groupDiagnostic: 'Diagnóstico', groupGlossary: 'Glosario', viewAll: 'Ver todos los resultados', typeMore: 'Escribí al menos 2 letras para buscar.', pageTitle: 'Resultados para' },
    levels: { basico: 'Básico', intermedio: 'Intermedio', avanzado: 'Avanzado' },
    hero: {
      eyebrow: 'Manual de uso · nivel inicial',
      title: 'Entendé tu auto,', titleEm: 'pieza por pieza.',
      startCta: 'Empezar por cómo funciona', diagCta: 'Ir al diagnóstico por síntomas',
      block: ['Plano', 'MB-00 · Índice', 'Módulos', '{modules}', 'Escala', 'Sin escala'],
      artAria: 'Ilustración decorativa de un reloj de tablero'
    },
    home: {
      tour: { label: 'Recorrido', title: 'Del taller a la ruta', text: 'Un recorrido por scroll con tres escenas: en cada una, las paradas abren una lección.', cta: 'Hacer el recorrido' },
      catalog: 'Catálogo de módulos',
      howTitle: 'Cómo usar este sitio',
      how: [
        { t: 'Seguí el orden', d: 'Empezá por «Cómo funciona un auto»: cada módulo se apoya en el anterior, pero podés saltar a lo que necesites.' },
        { t: 'Buscá lo que te pasa', d: 'Usá el buscador o el diagnóstico por síntomas cuando algo no anda. Cada ficha te dice qué mirar primero y cuándo parar.' },
        { t: 'Verificá en tu manual', d: 'Los valores cambian según marca, modelo y año. Las lecciones te avisan cuándo hay que confirmar en el manual de tu auto.' }
      ]
    },
    module: { code: 'MB', lesson: 'L', terms: 'términos', bySymptom: 'Probá la herramienta de diagnóstico por síntomas', bySymptomCta: 'Abrir diagnóstico', empty: 'Este módulo todavía no tiene lecciones.' },
    lesson: {
      code: 'L', figure: 'FIG.', maintenance: 'Mantenimiento', diagnosis: 'Diagnóstico',
      aside: 'Navegación de la lección', sameModule: 'En este módulo',
      termHint: 'Ver en el glosario', glossaryKind: 'GLOSARIO', diagKind: 'DIAG', toTerm: 'Ir al término', seeInTour: 'Ver en el recorrido', stopOf: 'Parada {n} de {total}',
      toc: 'En esta lección', pagerAria: 'Lecciones vecinas', verifiedShort: 'Verificado {date}', sourcesCount: ['1 fuente', '{n} fuentes']
    },
    diag: {
      title: 'Diagnóstico por síntomas', expand: 'Ver causas y qué revisar',
      intro: 'Elegí o buscá lo que le pasa a tu auto. Es una guía orientativa: no reemplaza la revisión de un mecánico.',
      filter: 'Filtrar síntomas', filterPlaceholder: 'luz, ruido, olor, no arranca…',
      symptom: 'Síntoma', all: 'Mostrando todos los síntomas', shown: ['Mostrando 1 síntoma', 'Mostrando {n} síntomas'], none: 'Ningún síntoma coincide. Probá con otra palabra.', noneHint: 'Probá con un síntoma más corto (por ejemplo «ruido» o «luz») o borrá el filtro para ver todos.', clear: 'Borrar filtro', openLesson: 'Ver la lección completa'
    },
    glossary: {
      title: 'Glosario', intro: 'Términos de mecánica explicados de forma simple.',
      filter: 'Buscar en el glosario', filterPlaceholder: 'bujía, freno, aceite…',
      jump: 'Saltar a la letra', related: 'Ver también', usedIn: 'Aparece en', count: ['1 término', '{n} términos'], none: 'Ningún término coincide.', noneHint: 'Probá con otra palabra o con menos letras, o borrá el filtro para ver los términos.', clear: 'Borrar filtro', code: 'GL', inLessons: ['En 1 lección', 'En {n} lecciones'], andMore: 'y {n} más', synonyms: 'También'
    },
    notFound: { code: '404', title: 'No encontramos esa página', text: 'La dirección no existe o cambió. Volvé al inicio o usá el buscador.', home: 'Volver al inicio' },
    // Página de créditos (#/creditos). Fuente: _proceso/realismo/creditos.md (v3). Atribución CC BY 4.0 de los modelos 3D usados en el recorrido.
    credits: {
      title: 'Créditos',
      intro: 'Las escenas del recorrido usan modelos 3D de terceros publicados en Sketchfab con licencia Creative Commons Atribución 4.0 (CC BY 4.0). Acá van sus autores, fuentes y las modificaciones que les hicimos.',
      newTab: '(se abre en una pestaña nueva)',
      modelsTitle: 'Modelos 3D (CC BY 4.0)',
      labels: { author: 'Autor', source: 'Fuente', license: 'Licencia', changes: 'Modificaciones' },
      sourceLink: 'Ver en Sketchfab',
      license: { name: 'CC BY 4.0', url: 'https://creativecommons.org/licenses/by/4.0/' },
      models: [
        { title: "Ace '11 - Low Poly model", author: 'Daniel Zhabotinsky', authorUrl: 'https://sketchfab.com/DanielZhabotinsky', url: 'https://sketchfab.com/3d-models/ace-11-low-poly-model-055ff8a21b8d4d279debca089e2fafcd', changes: 'Insignias y textos de patente quitados, una rueda quitada y otra acostada como auxilio, materiales rehechos.' },
        { title: 'Tesla M3 model', author: 'wintrez', authorUrl: 'https://sketchfab.com/wintrez', url: 'https://sketchfab.com/3d-models/tesla-m3-model-3a602469d7874d1397efa67182198705', changes: 'Emblemas y textos de patente quitados, logo de llantas cubierto, materiales y escala ajustados.' },
        { title: '2010s Compact SUV', author: 'MaG80', authorUrl: 'https://sketchfab.com/MaG80', url: 'https://sketchfab.com/3d-models/2010s-compact-suv-4d5566ec52ec4385a0d2d2754c189490', changes: 'Textura de rejilla reemplazada, sombra horneada quitada, materiales y escala ajustados.' },
        { title: 'Compact sedan', author: 'MaG80', authorUrl: 'https://sketchfab.com/MaG80', url: 'https://sketchfab.com/3d-models/compact-sedan-2ce316358582406691fcea73d15009ef', changes: 'Textura de rejilla reemplazada, sombra horneada quitada, materiales y escala ajustados.' },
        { title: "Lightbody '90 MD Pickup - Low poly model", author: 'Daniel Zhabotinsky', authorUrl: 'https://sketchfab.com/DanielZhabotinsky', url: 'https://sketchfab.com/3d-models/lightbody-90-md-pickup-low-poly-model-3b3ac59245c44872b06ad85673be9643', changes: 'Insignias y textos de patente quitados, materiales rehechos.' }
      ],
      cc0Title: 'Otros recursos (CC0)',
      cc0Intro: 'Estos recursos son de dominio público (CC0 1.0) y no exigen atribución; los mencionamos como cortesía.',
      cc0: [
        { text: 'Iluminación (HDRI) y objetos del taller de Poly Haven, como autoshop_01, metal_toolbox, tool_cart y old_tyre.', url: 'https://polyhaven.com/', host: 'polyhaven.com' },
        { text: 'Texturas de ambientCG, como Concrete034, PaintedMetal004, Metal027 y Asphalt033.', url: 'https://ambientcg.com/', host: 'ambientcg.com' }
      ],
      note: 'Los modelos de esta página son versiones modificadas de los originales.'
    },
    footer: { creditsLink: 'Créditos', legalTitle: 'Aviso legal', sources: 'El contenido es orientativo y se verifica con fuentes externas; no reemplaza al manual de tu auto ni a un profesional.' },
    sources: {
      title: 'Fuentes consultadas',
      verified: 'Verificado: {date}',
      newTab: '(se abre en una pestaña nueva)',
      date: '{month} de {year}',
      months: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
    },
    // Recorrido por scroll (#/recorrido). Los títulos de las lecciones salen de content.json; acá solo van los textos del recorrido.
    recorrido: {
      stations: [
        { id: 'taller', map: 'Taller', title: 'El taller' },
        { id: 'concesionaria', map: 'Concesionaria', title: 'Concesionaria y surtidor' },
        { id: 'ruta', map: 'Ruta', title: 'La ruta' }
      ],
      index: { title: 'Índice del recorrido', text: 'Las mismas lecciones, sin animación ni 3D.' },
      // Recorrido continuo con fotogramas (#/recorrido). Los nombres de estación salen de stations[] (id 'ruta' = pista del render).
      cont: {
        title: 'Recorrido: del taller a la ruta',
        skip: 'Saltar el recorrido e ir a la lista de lecciones',
        kicker: 'Recorrido por scroll', h1: 'Del taller a la ruta',
        lead: 'Bajá con la ruedita, el teclado o el dedo: la cámara pasa por tres escenas y en cada parada se abre una lección de Mecánica Básica.',
        toList: 'Ver la lista de lecciones',
        canvasAria: 'Animación del recorrido: la cámara avanza por el taller, la concesionaria y la ruta. La lista de paradas es equivalente.',
        loading: 'Cargando {p} %', ready: 'Listo',
        panel: 'Estaciones y paradas', stationsTitle: 'Estaciones', stopsTitle: 'Paradas',
        stopOf: 'Parada {n} de {total}', onTheWay: 'En camino', lesson: 'Lección',
        goTo: 'Ir a la estación', progressAria: 'Avance del recorrido',
        staticTitle: 'Paradas del recorrido', staticText: 'Una imagen fija por parada, sin animación de scroll.',
        imgAlt: '{station}: escena de la parada «{lesson}»'
      },
    },
    // Portada = recorrido («Taller a la luz»). Nombres de estación: recorrido.stations; títulos y resúmenes de parada: content.json.
    tour: {
      aria: 'Recorrido: del taller a la ruta',
      canvasAria: 'Escena renderizada de un taller, una concesionaria con surtidor y una ruta, que avanza con el scroll. La lista de paradas al pie de la página es equivalente.',
      stats: { lessons: 'lecciones', terms: 'términos', stops: 'paradas' },
      cue: 'Deslizá para entrar al taller',
      stopCode: '{station} // Parada {n} de {total}',
      detail: 'Ver detalle', lesson: 'Lección', terms: ['1 término', '{n} términos'],
      railAria: 'Progreso del recorrido', tickAria: 'Parada {n} de {total}: {title}',
      live: 'Parada {n} de {total}: {title}',
      indexKicker: 'Índice del recorrido', indexTitle: 'Las {n} paradas, de un vistazo',
      indexLead: 'Cada parada abre una lección. Si preferís leer sin scroll, este índice tiene lo mismo que el recorrido.',
      staticNote: 'Tenés activado «reducir movimiento»: el recorrido se muestra como láminas fijas.',
      loadFail: 'No se pudieron cargar las escenas. La lista de paradas al pie funciona igual.'
    },
    hotspots: {
      group: 'En esta escena', aria: 'Ver detalle de {term}', ariaIll: 'Ver detalle de {term}. La escena solo lo ilustra: no es la pieza.',
      kindPiece: 'Pieza', kindIll: 'Ilustra el término'
    },
    perf: {   // overlay de diagnóstico (?perf=1)
      title: 'Diagnóstico de fluidez', stat: 'ms: media / p95 / máx.', aria: 'Panel de diagnóstico de fluidez del recorrido', copy: 'Copiar resumen', reset: 'Reiniciar', copied: 'Resumen copiado',
      hint: 'Alt+Mayús+P copia el resumen. Scrolleá unos segundos, copiá y pegá los números.',
      frame: 'Intervalo entre cuadros', draw: 'Dibujo', hs: 'Puntos', stalls: 'Cuadros fuera del objetivo (o de su celda al ir rápido)', lag: 'desfase medio por cuadro (fotogramas)',
      seq: 'Cuadros por secuencia', light: 'liviana', fullSeq: 'completa', settle: 'Latencia al detenerse hasta la 1920',
      canvas: 'Canvas', cache: 'Caché', keys: 'claves', queue: 'En vuelo', net: 'red', decode: 'decodificación', speed: 'velocidad (fotogramas/cuadro)', frameNow: 'Fotograma'
    },
    sheet: {
      partsTitle: 'Despiece de esta parada', partsNote: 'Términos del glosario que usa la lección. Tocá uno para ver qué es.',
      lessonPartsTitle: 'Despiece', lessonPartsNote: 'Términos del glosario que aparecen en esta lección. Tocá uno para ver qué es.',
      terms: ['1 término', '{n} términos'], also: 'También', related: 'Relacionados',
      inGlossary: 'Ver en el glosario', inLessons: 'aparece en {n} lecciones',
      close: 'Cerrar detalle y seguir el recorrido', openLesson: 'Abrir la lección completa', keepGoing: 'Seguir el recorrido'
    },
    find: {
      dialogLabel: 'Buscar en Mecánica Básica', open: 'Buscar', openAria: 'Buscar (atajo: barra)', hint: 'Esc', start: 'Para empezar', term: 'término',
      count: ['1 resultado', '{n} resultados']
    },
    menu: { open: 'Menú', aria: 'Abrir el menú de secciones' },
    diagrams: {
      figure: 'FIG.',
      sketch: 'Esquema simplificado, sin escala.',
      cycle: {
        caption: 'Las cuatro etapas del ciclo (720° = dos vueltas del cigüeñal). Elegí una para resaltarla.',
        highlight: 'Resaltar etapa', clear: 'Quitar resalte',
        wheelTitle: 'Cuadrante del ciclo', wheelDesc: 'Un círculo dividido en cuatro sectores iguales de 180 grados: admisión, compresión, combustión y escape.',
        wheelCenter: ['720°', '2 vueltas'], wheelAbbr: ['ADM', 'COMP', 'COMB', 'ESC'],
        stages: [
          { name: 'Admisión', deg: '0–180°', desc: 'El pistón baja con la válvula de admisión abierta y entra aire o mezcla.' },
          { name: 'Compresión', deg: '180–360°', desc: 'Las dos válvulas están cerradas y el pistón sube comprimiendo la mezcla.' },
          { name: 'Combustión', deg: '360–540°', desc: 'La mezcla se enciende y empuja el pistón hacia abajo; ambas válvulas cerradas.' },
          { name: 'Escape', deg: '540–720°', desc: 'El pistón sube con la válvula de escape abierta y salen los gases quemados.' }
        ]
      },
      brakes: {
        title: 'Sistema de frenos hidráulico simple',
        desc: 'Esquema de un freno de disco. El pedal empuja el cilindro maestro, que presuriza el líquido en la cañería hasta el pistón de la pinza; la pinza aprieta las pastillas contra el disco.',
        caption: 'Camino de la fuerza: del pie al disco. Se repite en cada rueda.',
        legend: ['Pedal de freno', 'Servofreno y cilindro maestro', 'Depósito de líquido de frenos', 'Cañería con líquido a presión', 'Pistón de la pinza', 'Pastillas', 'Disco']
      },
      electric: {
        title: 'Circuito eléctrico básico',
        desc: 'Esquema con batería, motor de arranque y alternador unidos por cables y por la masa del chasis. En el arranque la corriente va de la batería al motor de arranque; con el motor en marcha el alternador recarga la batería.',
        caption: 'Línea llena: arranque. Línea de trazos: carga con el motor en marcha.',
        legend: ['Batería', 'Motor de arranque', 'Alternador', 'Cable positivo', 'Masa (chasis y cable negativo)', 'Correa que mueve al alternador'],
        flowStart: 'Arranque', flowCharge: 'Carga'
      },
      cooling: {
        title: 'Circuito de refrigeración',
        desc: 'Esquema del circuito: la bomba de agua hace circular el líquido por el motor; el termostato lo deja pasar al radiador cuando está caliente; el radiador lo enfría con el aire y el ventilador; el depósito de expansión compensa la presión.',
        caption: 'Trazo grueso: líquido caliente hacia el radiador. Trazo fino: líquido enfriado de vuelta al motor.',
        legend: ['Motor (camisas de agua)', 'Termostato', 'Radiador', 'Ventilador', 'Bomba de agua', 'Depósito de expansión', 'Mangueras']
      }
    }
  }
};
