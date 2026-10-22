// Puntos «+» sobre las piezas de la escena. Datos: data/hotspots.json (trayectorias x,y normalizadas sobre el fotograma 16:9 completo
// y opacidad por fotograma). Si el JSON falla, loadHotspots() devuelve null y el sitio sigue solo con la lista de la hoja.
import { h } from './dom.js?v=6';

let pending = null;
export function loadHotspots() {
  if (!pending) pending = (location.protocol.startsWith('http')
    ? fetch('data/hotspots.json?v=6').then((r) => (r.ok ? r.json() : null)).catch(() => null) : Promise.resolve(null))
    .then((d) => (d && Array.isArray(d.paradas) ? d : null));
  return pending;
}

/** Interpolación lineal de las claves [fotograma, x, y, opacidad] en el fotograma f (float). null fuera del rango. */
export function hsAt(k, f) {
  if (f < k[0][0] || f > k[k.length - 1][0]) return null;
  let i = 1; while (k[i][0] < f) i++;
  const a = k[i - 1], b = k[i], t = (f - a[0]) / ((b[0] - a[0]) || 1);
  return { x: a[1] + (b[1] - a[1]) * t, y: a[2] + (b[2] - a[2]) * t, o: a[3] + (b[3] - a[3]) * t };
}

/** Lista plana de puntos: { stop (índice), term (glosario), name, kind ('pieza'|'asociado'), k, f0, f1 }. Descarta lo que no cierra con el sitio. */
export function pointsOf(data, stops, ctx) {
  const out = [];
  if (!data) return out;
  for (const p of data.paradas) {
    const si = stops.findIndex((s) => s.id === p.leccion);
    if (si < 0) continue;
    for (const q of p.puntos || []) {
      const g = ctx.model.termsById.get(q.termino);
      if (!g || !(stops[si].l.glosario || []).includes(q.termino) || !q.k?.length) continue;
      out.push({ stop: si, term: q.termino, name: g.termino, kind: q.tipo === 'asociado' ? 'asociado' : 'pieza', k: q.k, f0: q.k[0][0], f1: q.k[q.k.length - 1][0] });
    }
  }
  return out;
}

/** Botón del punto: zona táctil de 44 px, disco con «+» y rótulo (nombre del término; aparte, si solo ilustra). */
export function hsButton(pt, stop, ctx) {
  const H = ctx.ui.hotspots, ill = pt.kind === 'asociado';
  return h('button', { type: 'button', class: `hs${ill ? ' hs--ill' : ''}`, 'data-hs': pt.term, 'data-detail': stop.k, 'aria-haspopup': 'dialog',
    'aria-label': (ill ? H.ariaIll : H.aria).replace('{term}', pt.name) },
  h('span', { class: 'hs-disc', 'aria-hidden': 'true' }, h('i')),
  h('span', { class: 'hs-tag', 'aria-hidden': 'true' }, h('small', null, ill ? H.kindIll : H.kindPiece), pt.name));
}
