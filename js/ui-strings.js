// Textos de interfaz que complementan data/content.json (bloque ui de cada idioma).
// i18n-ready: para sumar un idioma, agregar un bloque hermano de "es" con las mismas claves.
export const EXTRA = {
  es: {
    skip: 'Saltar al contenido',
    brandHome: 'Mecánica Básica, ir al inicio',
    navAria: 'Principal',
    nav: { diagnostic: 'Diagnóstico', lessons: 'Lecciones' },
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
      termHint: 'Ver en el glosario', glossaryKind: 'GLOSARIO', diagKind: 'DIAG', toTerm: 'Ir al término'
    },
    diag: {
      title: 'Diagnóstico por síntomas',
      intro: 'Elegí o buscá lo que le pasa a tu auto. Es una guía orientativa: no reemplaza la revisión de un mecánico.',
      filter: 'Filtrar síntomas', filterPlaceholder: 'luz, ruido, olor, no arranca…',
      symptom: 'Síntoma', all: 'Mostrando todos los síntomas', shown: ['Mostrando 1 síntoma', 'Mostrando {n} síntomas'], none: 'Ningún síntoma coincide. Probá con otra palabra.', openLesson: 'Ver la lección completa'
    },
    glossary: {
      title: 'Glosario', intro: 'Términos de mecánica explicados de forma simple.',
      filter: 'Buscar en el glosario', filterPlaceholder: 'bujía, freno, aceite…',
      jump: 'Saltar a la letra', related: 'Ver también', usedIn: 'Aparece en', count: ['1 término', '{n} términos'], none: 'Ningún término coincide.', code: 'GL'
    },
    notFound: { code: '404', title: 'No encontramos esa página', text: 'La dirección no existe o cambió. Volvé al inicio o usá el buscador.', home: 'Volver al inicio' },
    footer: { legalTitle: 'Aviso legal', sources: 'El contenido es orientativo y se verifica con fuentes externas; no reemplaza al manual de tu auto ni a un profesional.' },
    sources: {
      title: 'Fuentes consultadas',
      verified: 'Verificado: {date}',
      newTab: '(se abre en una pestaña nueva)',
      date: '{month} de {year}',
      months: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
    },
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
