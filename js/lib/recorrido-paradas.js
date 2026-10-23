// Secuencia prerrenderizada del recorrido continuo: fotogramas y paradas (copiado de recorrido.json; sin texto visible).
// Cada parada = [id de lección, estación, fotograma desde, fotograma hasta]. Los títulos salen de content.json.
export const FRAMES = 1640;
export const FRAME_URL = (i) => `assets/recorrido/f_${String(i).padStart(4, '0')}.webp?v=${i >= 922 && i <= 988 ? 4 : 3}`; // v4: parada 09 reencuadrada (922-988)
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

// ---- Derivados para la portada (sin texto propio: nombres de estación en ui-strings, títulos en content.json) ----
export const STATION_UI = { taller: 'taller', concesionaria: 'concesionaria', pista: 'ruta' }; // id del render -> id en ui.recorrido.stations
export const ST_VAR = { taller: '--st-taller', concesionaria: '--st-concesionaria', pista: '--st-pista' };
/** Paradas con su lección, estación y número (k = índice base 0). Las que no tengan lección en content.json se omiten. */
export function buildStops(ctx) {
  const list = ctx.ui.recorrido.stations;
  const st = (e) => list.find((s) => s.id === STATION_UI[e]);
  const rows = PARADAS.map(([id, est, desde, hasta]) => ({ id, est, desde, hasta, l: ctx.model.lessonsById.get(id) })).filter((s) => s.l);
  return rows.map((s, k) => ({ ...s, k, total: rows.length, mid: Math.round((s.desde + s.hasta) / 2), short: st(s.est).map, name: st(s.est).title, cvar: ST_VAR[s.est] }));
}
export const stationNum = (est) => String(Object.keys(ESTACIONES).indexOf(est) + 1).padStart(2, '0');
