// Secuencia prerrenderizada del recorrido continuo: fotogramas y paradas (copiado de recorrido.json; sin texto visible).
// Cada parada = [id de lección, estación, fotograma desde, fotograma hasta]. Los títulos salen de content.json.
export const FRAMES = 1640;
export const FRAME_URL = (i) => `assets/recorrido/f_${String(i).padStart(4, '0')}.webp?v=3`;
export const ESTACIONES = {
  taller: [1, 800],
  concesionaria: [801, 1250],
  pista: [1251, 1640]
};
export const PARADAS = [
  ['motor-4-tiempos', 'taller', 85, 112],
  ['suspension', 'taller', 284, 302],
  ['transmision', 'taller', 314, 332],
  ['sistema-electrico', 'taller', 439, 457],
  ['herr-kit-basico', 'taller', 469, 487],
  ['frenos', 'taller', 509, 527],
  ['he-carga-segura-casa-publica', 'concesionaria', 874, 892],
  ['he-mantenimiento-basico-vs-convencional', 'concesionaria', 909, 927],
  ['he-tipos-hev-phev-bev-mild', 'concesionaria', 949, 967],
  ['he-alta-tension-componentes', 'concesionaria', 989, 1007],
  ['ar-combustibles-nafta-gasoil', 'concesionaria', 1114, 1132],
  ['ar-gnc-uso-seguro', 'concesionaria', 1144, 1162],
  ['ar-vtv-rto-revision-tecnica', 'pista', 1324, 1342],
  ['frenos-normativa-ar', 'pista', 1364, 1382],
  ['diag-vibraciones-pistas', 'pista', 1424, 1442],
  ['ar-equipamiento-obligatorio-auto', 'pista', 1469, 1487],
  ['susp-pinchadura-cambio-rueda', 'pista', 1504, 1522],
  ['diag-luces-colores-airbag-tpms', 'pista', 1544, 1562]
];
