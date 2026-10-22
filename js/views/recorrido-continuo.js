// Recorrido «Taller a la luz» (portada): un canvas a pantalla completa que dibuja el fotograma (1..1640) que marca el scroll.
// Motor: decodificación fuera del hilo (createImageBitmap, recortado al área visible), precarga priorizada alrededor del fotograma
// actual, un solo rAF con inercia independiente de los FPS, canvas a DPR acotado. Con prefers-reduced-motion: láminas fijas por parada.
// El contenido es accesible sin el canvas: tarjeta/riel con teclado + índice de paradas al pie (en home.js).
import { h } from '../lib/dom.js?v=6';
import { ico } from '../lib/icons.js?v=6';
import { plural } from '../lib/text.js?v=6';
import { FRAMES as N, FRAME_URL as FR, ESTACIONES, buildStops, stationNum } from '../lib/recorrido-paradas.js?v=6';
import { openDetail } from '../lib/hoja-detalle.js?v=6';
import { loadHotspots, pointsOf, hsAt, hsButton } from '../lib/hotspots.js?v=6';

const pad = (n) => String(n).padStart(2, '0');
const fill = (t, o) => t.replace(/\{(\w+)\}/g, (_, k) => o[k]);
let savedY = 0; // para volver al punto del recorrido al regresar de una lección
// Al recargar, el alto del recorrido se arma después de cargar content.json y el navegador ya restauró (a 0): se retoma desde sessionStorage.
try { if (performance.getEntriesByType('navigation')[0]?.type === 'reload') savedY = +sessionStorage.getItem('mb:y') || 0; sessionStorage.removeItem('mb:y'); } catch (e) { /* sin storage: sin restauración */ }

/** #/recorrido ya no es una página: la portada es el recorrido. */
export function render(el, ctx) { ctx.go('#/'); return () => {}; }

export function forcedStatic() { return /[?&]rm=1/.test(location.search + location.hash); } // ?rm=1: modo sin movimiento (demo/QA)

/* ---------- Tarjeta de parada (compartida entre el recorrido y las láminas fijas) ---------- */
function cardContent(stop, ctx) {
  const T = ctx.ui.tour, l = stop.l, n = (l.glosario || []).length;
  return [
    h('p', { class: 'meta code' }, h('span', { class: 'swatch', 'aria-hidden': 'true' }), fill(T.stopCode, { station: stop.short, n: pad(stop.k + 1), total: stop.total })),
    h('h2', null, l.titulo), h('p', { class: 'res' }, l.resumen),
    h('div', { class: 'acts' },
      h('button', { class: 'btn btn--primary', type: 'button', 'data-detail': stop.k, 'aria-haspopup': 'dialog' }, ico('plus'), T.detail),
      h('a', { class: 'btn', href: `#/leccion/${stop.id}` }, T.lesson, h('span', { class: 'arr' }, ico('arrow'))),
      n ? h('span', { class: 'count code' }, plural(n, T.terms)) : null)
  ];
}

/* ---------- Modo sin movimiento: una lámina fija por parada, mismo contenido y mismo «Ver detalle» ---------- */
export function mountStatic(host, ctx, stops) {
  const { ui } = ctx, T = ui.tour;
  const stats = ['lessons', 'terms', 'stops'].map((k, i) => [k, [ctx.model.counts.lessons, ctx.model.counts.terms, stops.length][i]]);
  host.append(h('div', { class: 'wrap tr-static' },
    h('h1', null, ui.siteTitle),
    h('p', { class: 'tag' }, ui.siteTagline),
    h('p', { class: 'code' }, stats.map(([k, v], i) => [i ? ' · ' : '', h('b', null, v), ` ${T.stats[k]}`])),
    h('p', { class: 'code', style: 'margin-top:12px' }, T.staticNote),
    h('ol', { class: 'tr-static-list' }, stops.map((s) => h('li', { style: `--st:var(${s.cvar})` },
      h('div', { class: 'plate' }, h('img', { src: FR(s.mid), width: 1920, height: 1080, loading: s.k < 1 ? 'eager' : 'lazy', decoding: 'async',
        alt: fill(ui.recorrido.cont.imgAlt, { station: s.name, lesson: s.l.titulo }) })),
      h('article', { class: 'tr-card' }, cardContent(s, ctx)))))));
  const onClick = (e) => {
    const hs = e.target.closest('[data-hs]'); if (hs) { openDetail(stops[+hs.dataset.detail], ctx, hs, hs.dataset.hs); return; }
    const b = e.target.closest('[data-detail]'); if (b) openDetail(stops[+b.dataset.detail], ctx, b);
  };
  host.addEventListener('click', onClick);
  // Puntos «+» fijos: posición del fotograma medio de la parada (la lámina es el fotograma 16:9 completo), sin animación.
  let gone = false;
  loadHotspots().then((data) => {
    if (gone) return;
    const plates = host.querySelectorAll('.tr-static-list .plate'), layers = new Map();
    for (const pt of pointsOf(data, stops, ctx)) {
      const a = hsAt(pt.k, stops[pt.stop].mid); if (!a || a.o < 0.5 || !plates[pt.stop]) continue;
      if (!layers.has(pt.stop)) { const L = h('div', { class: 'hs-layer is-static', role: 'group', 'aria-label': ui.hotspots.group }); layers.set(pt.stop, L); plates[pt.stop].append(L); }
      const b = hsButton(pt, stops[pt.stop], ctx); b.style.left = `${(a.x * 100).toFixed(2)}%`; b.style.top = `${(a.y * 100).toFixed(2)}%`;
      if (a.x < 0.14) b.dataset.side = 'l'; else if (a.x > 0.86) b.dataset.side = 'r'; else if (a.y < 0.2) b.dataset.side = 'b';
      layers.get(pt.stop).append(b);
    }
  });
  return () => { gone = true; host.removeEventListener('click', onClick); };
}

/* ---------- Recorrido con canvas ---------- */
export function mountTour(host, ctx, stops, opts = {}) {
  const { ui, model } = ctx, T = ui.tour;
  const PX_T = 3, PX_S = 16;                       // px de scroll por fotograma: viaje / dentro de una parada (la cámara «retiene»)
  const cum = new Float64Array(N + 2), inStop = new Uint8Array(N + 2);
  stops.forEach((s) => { for (let f = s.desde; f <= s.hasta; f++) inStop[f] = 1; });
  for (let f = 1; f <= N; f++) cum[f + 1] = cum[f] + (inStop[f] ? PX_S : PX_T);
  const estList = Object.keys(ESTACIONES);
  const stUi = (e) => ctx.ui.recorrido.stations.find((x) => x.id === (e === 'pista' ? 'ruta' : e));
  const stOf = (e) => stops.find((s) => s.est === e);
  const counts = [model.counts.lessons, model.counts.terms, stops.length];
  const [w1, w2] = ui.siteTitle.split(' ');

  const canvas = h('canvas', { role: 'img', 'aria-label': T.canvasAria });
  const veil = h('div', { class: 'tr-veil', 'aria-hidden': 'true' });
  const hero = h('div', { class: 'tr-hero' },
    h('h1', null, h('span', null, w1), ' ', h('span', null, w2 || '')),
    h('div', { class: 'tr-hero-row' }, h('p', { class: 'tag' }, ui.siteTagline),
      h('p', { class: 'code' }, ['lessons', 'terms', 'stops'].map((k, i) => [i ? ' · ' : '', h('b', null, counts[i]), ` ${T.stats[k]}`]))));
  const cue = h('div', { class: 'tr-cue', 'aria-hidden': 'true' }, h('span', null, T.cue), h('i'));
  const card = h('article', { class: 'tr-card', 'aria-live': 'off', inert: true });
  const segsEl = h('div', { class: 'tr-segs' }, estList.map((e) => h('div', { class: 'seg', 'data-e': e, style: `--st:var(${stOf(e)?.cvar})` },
    h('span', { class: 'cartel' }, h('span', { class: 'swatch', 'aria-hidden': 'true' }), `${stationNum(e)} ${stUi(e).map}`))));
  const fillEl = h('div', { class: 'tr-fill' });
  const dot = h('div', { class: 'tr-dot', 'aria-hidden': 'true' });
  const ticksEl = h('div', { class: 'tr-ticks' }, stops.map((s) => h('button', { type: 'button', class: 'tick', 'data-k': s.k,
    'aria-label': fill(T.tickAria, { n: s.k + 1, total: s.total, title: s.l.titulo }) },
    h('span', { class: 'tip', 'aria-hidden': 'true' }, `${pad(s.k + 1)} · ${s.l.titulo.split(':')[0]}`))));
  const track = h('div', { class: 'tr-track' }, segsEl, h('div', { class: 'tr-line' }, fillEl), dot, ticksEl);
  const cst = h('span', { class: 'cst' }), cnum = h('b', null, '00');
  const rail = h('nav', { class: 'tr-rail', 'aria-label': T.railAria }, track, h('p', { class: 'tr-counter', 'aria-hidden': 'true' }, cst, cnum, ` / ${stops.length}`));
  const hsLayer = h('div', { class: 'hs-layer', role: 'group', 'aria-label': ui.hotspots.group });   // puntos «+»: después de la tarjeta y antes del riel en el orden de Tab
  const stage = h('div', { class: 'tr-stage' }, canvas, veil, hero, cue, card, hsLayer, rail);
  const live = h('p', { class: 'vh', role: 'status', 'aria-live': 'polite' });
  const tour = h('section', { class: 'tr', 'aria-label': T.aria },
    h('a', { class: 'tr-skip', href: '#/', 'data-goto': 'indice' }, ui.recorrido.cont.skip), stage, live);
  host.append(tour);
  const segs = [...segsEl.children], ticks = [...ticksEl.children];
  // alpha:false: el canvas es opaco (el compositor no mezcla). Sin desynchronized: puede cortar la imagen (tearing) y desacoplar el canvas
  // de los puntos «+» y el HUD, que se mueven en el mismo cuadro. El fotograma se decodifica ya al tamaño de dibujo (escala ≈ 1:1).
  const g = canvas.getContext('2d', { alpha: false });

  // ---------- Estado ----------
  const lite = matchMedia('(max-width: 760px)').matches || !!(navigator.connection && (navigator.connection.saveData || /(^|-)2g$/.test(navigator.connection.effectiveType || '')));
  const STEP = lite ? 4 : 1;                       // modo ligero: 1 de cada 4 fotogramas
  const snap = (f) => 1 + Math.floor((Math.max(1, Math.min(N, f)) - 1) / STEP) * STEP;
  const PERF = /[?&]perf=1/.test(location.search + location.hash);   // overlay de diagnóstico (js/lib/perf-overlay.js), solo con ?perf=1
  const rec = (a, v) => { a.push(v); if (a.length > 1500) a.splice(0, 500); };   // muestras acotadas (costo O(1) amortizado)
  const stats = { loaded: 0, drawn: 0, miss: 0, lag: 0, jumps: 0, dts: [], draws: [], hss: [], dec: [], net: [], gen: 0 };
  let W = 1, H = 1, tourTop = 0, total = 0, HPX = 1, railW = 1, paper = '#F2EDE6';
  let BW = 1920, BH = 1080, portrait = false, heroRect = null, tourRect = null, band = null, paperA0 = 'rgba(242,237,230,0)'; // fotograma completo decodificado a BW×BH; rectángulos de dibujo
  let CAP = 24, dead = false;
  /* Carga en dos niveles: (1) blobs WebP comprimidos (~53 kB c/u) en una ventana amplia sesgada hacia adelante, con tope de memoria;
     (2) ImageBitmap decodificados (8 MB c/u a 1080p) solo para los fotogramas que se van a mostrar: el actual y los siguientes sobre la
     trayectoria, espaciados según la velocidad (si la cámara avanza 6 fotogramas por cuadro, decodificar los intermedios no sirve). */
  const bm = new Map(), kf = new Map(), blobs = new Map(), net = new Map(), dec = new Set();
  const KSTEP = lite ? 24 : 12, KW = lite ? 384 : 480;
  const KEYS = []; for (let i = 1; i <= N; i += KSTEP) KEYS.push(i); stops.forEach((s) => KEYS.push(s.mid));
  const KEYSET = new Set(KEYS);
  const MAXNET = lite ? 4 : 6, MAXDEC = lite ? 2 : 3, canFetch = location.protocol.startsWith('http');
  const AHB = lite ? 60 : 240, BHB = lite ? 16 : 60;           // ventana de blobs, en pasos: adelante / atrás
  const DEC_A = lite ? 6 : 10, DEC_B = lite ? 2 : 3;            // bitmaps a tener listos sobre la trayectoria
  const BLOB_CAP = (lite ? 16 : 48) * 1048576;
  let blobBytes = 0, decN = 0, vf = 0, netMs = 120, decMs = 40;  // vf: fotogramas por cuadro (media móvil); latencias medias de red y decodificación
  let cardBox = null, placeCache = new Map();   // tarjeta: rectángulo real (con su desplazamiento) y posición elegida por parada
  let HS = [], blocks = [], blockDirty = true, DP = 1, CW = 1, CH = 1, headH = 0;   // puntos «+» y geometría cacheada (en px de CSS)
  let yT = 0, yC = 0, hp = 0, curF = 1, dir = 1, raf = 0, last = 0, dirty = true, lastF = -1, shown = -2, est = '', liveT = 0, failed = 0;

  // ---------- Geometría (todas las lecturas de layout van acá, no en el bucle) ----------
  const yOfFrame = (f) => cum[Math.max(1, Math.min(N, Math.floor(f)))];
  function frameOfY(y) {
    let lo = 1, hi = N;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (cum[m] <= y) lo = m; else hi = m - 1; }
    return Math.min(N, lo + (y - cum[lo]) / ((cum[lo + 1] - cum[lo]) || 1));
  }
  const setPaper = () => { paper = getComputedStyle(document.body).backgroundColor; paperA0 = paper.replace('rgb(', 'rgba(').replace(')', ', 0)'); };
  function layout() {
    if (!canvas.clientWidth && !dead) { requestAnimationFrame(layout); return; } // CSS todavía sin aplicar
    total = cum[N];
    HPX = Math.max(120, Math.min(Math.round(innerHeight * 0.6), Math.round(yOfFrame(stops[0].desde - 6)) - 8)); // el título se va antes de la primera parada
    tour.style.height = `${total + innerHeight}px`;
    tourTop = tour.getBoundingClientRect().top + scrollY;
    const d0 = Math.min(devicePixelRatio || 1, 1.5);                       // DPR acotado (la fuente es de 1920 px)
    const cw = canvas.clientWidth * d0, ch = canvas.clientHeight * d0, k = Math.min(1, 1920 / cw, 1080 / ch); // nunca más grande que la fuente
    const nw = Math.max(2, Math.round(cw * k)), nh = Math.max(2, Math.round(ch * k));
    if (canvas.width !== nw || canvas.height !== nh) { canvas.width = W = nw; canvas.height = H = nh; }
    const dp = W / canvas.clientWidth;                                     // px de CSS -> px de canvas
    portrait = canvas.clientWidth / canvas.clientHeight < 0.8;              // misma condición que max-aspect-ratio: 4/5
    DP = dp; CW = canvas.clientWidth; CH = canvas.clientHeight; headH = document.getElementById('site-head')?.offsetHeight || 0; blockDirty = true;
    const iw = 1920, ih = 1080;
    if (portrait) {                                                        // lámina arriba (64 px + 50 % del alto); la tarjeta sólida va debajo
      const top = 64 * dp, bh = H * 0.5, s = Math.max(W / iw, bh / ih);
      tourRect = { x: (W - iw * s) / 2, y: top + (bh - ih * s) / 2, w: iw * s, h: ih * s }; band = [0, top, W, bh];
    } else {
      const s = Math.max(W / iw, H / ih); tourRect = { x: (W - iw * s) / 2, y: (H - ih * s) / 2, w: iw * s, h: ih * s }; band = null;
    }
    const hb = (hero.offsetTop + hero.offsetHeight + 12) * dp, room = H - hb - 92 * dp;   // portada: la escena «contenida» ocupa el lugar libre bajo el título
    const s0 = Math.min((portrait ? 1.08 : 0.92) * W / iw, Math.max(room, H * 0.3) / ih);
    heroRect = portrait ? (() => { const s1 = 1.45 * W / iw; return { x: (W - iw * s1) / 2 - W * .06, y: hb + Math.max(0, (room - ih * s1) / 2), w: iw * s1, h: ih * s1 }; })()
      : { x: (W - iw * s0) / 2, y: hb, w: iw * s0, h: ih * s0 };
    // Escritorio: se decodifica a 1920 sin redimensionar (medido: resizeQuality 'high' bloquea el hilo principal, rAF de 17 a 60 ms) y el canvas
    // escala en GPU. Modo ligero (móvil): se redimensiona para cuidar memoria, con resizeQuality 'low' (medido: 'medium' también bloquea, rAF 17 a 50 ms).
    const nbw = lite ? Math.min(1920, Math.round(tourRect.w)) : 1920, nbh = Math.round(nbw * 9 / 16);
    if (Math.abs(nbw - BW) > 64 || !bm.size && !kf.size) {
      BW = nbw; BH = nbh;
      stats.gen++; for (const v of bm.values()) v.b.close(); bm.clear(); for (const v of kf.values()) v.b.close(); kf.clear();   // los blobs no dependen del tamaño: se conservan
    }
    CAP = Math.max(DEC_A + DEC_B + 4, Math.min(48, Math.floor((lite ? 60e6 : 190e6) / (BW * BH * 4))));
    segs.forEach((el, j) => {
      const [a, b] = ESTACIONES[estList[j]], y0 = j === 0 ? 0 : yOfFrame(a), y1 = j === estList.length - 1 ? total : yOfFrame(Math.min(N, b + 1));
      el.style.width = `${(y1 - y0) / total * 100}%`;
    });
    ticks.forEach((t) => { t.style.left = `${yOfFrame(stops[+t.dataset.k].mid) / total * 100}%`; });
    placeCache.clear(); if (shown >= 0 && stops[shown]) placeCard(stops[shown]);   // con tourRect ya recalculado
    veil.style.setProperty('--vh', `${hero.offsetTop + hero.offsetHeight + 16}px`); // el velo cubre solo el bloque del título
    setPaper(); railW = track.clientWidth; dirty = true; kick();
  }

  // ---------- Carga (red) y decodificación (createImageBitmap, fuera del hilo) con colas priorizadas ----------
  async function source(i, signal, prio) {
    if (canFetch) {
      let r = null; if (i === 1 && window.__mbF1) { r = await window.__mbF1; window.__mbF1 = null; if (r && !r.ok) r = null; } // respuesta pedida desde el <head>
      if (!r) r = await fetch(FR(i), { signal, priority: prio });
      if (!r.ok) throw new Error(r.status); return r.blob();
    }
    const im = new Image(); im.src = FR(i); await im.decode(); return im;   // respaldo file:// (sin fetch)
  }
  async function bitmapOf(src, w, hh, q) {
    const o = w >= 1920 ? undefined : { resizeWidth: w, resizeHeight: hh, resizeQuality: q };
    try { return await createImageBitmap(src, o); }  // decodifica fuera del hilo principal
    catch (e) { if (e && e.name === 'AbortError') throw e; return createImageBitmap(src); }
  }
  const inRange = (i) => i >= 1 && i <= N;
  /** Fotogramas a decodificar, en orden: el actual, los siguientes sobre la trayectoria (espaciados por la velocidad) y unos pocos atrás. */
  /** Paso entre fotogramas a preparar: el avance por cuadro, o más si la red/decodificación no da abasto (fotogramas por segundo que pide
      la cámara ÷ fotogramas por segundo que se pueden traer o decodificar). Así nunca se encola trabajo que va a llegar tarde. */
  const strideBy = (rate) => Math.max(1, Math.round(vf / STEP), Math.ceil(vf * 60 / STEP / rate)) * STEP;
  const strideOf = () => Math.max(1, Math.round(vf / STEP)) * STEP;                      // decodificar: el avance por cuadro
  const netStride = () => Math.min(8 * STEP, strideBy(MAXNET * 1000 / netMs));            // red: según lo que da abasto, con tope
  function want(c) {
    const s = strideOf(), L = [c];
    for (let k = 1; k <= DEC_A; k++) { const i = c + dir * k * s; if (inRange(i)) L.push(i); }
    for (let k = 1; k <= DEC_B; k++) { const i = c - dir * k * STEP; if (inRange(i)) L.push(i); }
    return L;
  }
  async function fetchBlob(i, prio) {
    const ac = new AbortController(), t0 = performance.now(); net.set(i, ac);
    try {
      const b = await source(i, ac.signal, prio);
      if (dead) return;
      blobs.set(i, b); blobBytes += b.size || 53e3; const ms = performance.now() - t0; rec(stats.net, ms); netMs += (ms - netMs) * 0.1;
      if (blobBytes > BLOB_CAP) evictBlobs();
    } catch (e) { if (!(e && e.name === 'AbortError')) { failed++; if (failed === 8 && !stats.loaded) live.textContent = T.loadFail; } }
    finally { if (net.get(i) === ac) net.delete(i); pump(); }
  }
  async function decode(i, kind) {
    const key = kind + i, gen = stats.gen, src = blobs.get(i), t0 = performance.now(); dec.add(key); decN++;
    try {
      const b = kind === 'f' ? await bitmapOf(src, BW, BH, 'low') : await bitmapOf(src, KW, Math.round(KW * 9 / 16), 'low');
      if (dead || gen !== stats.gen) { b.close(); return; }
      (kind === 'f' ? bm : kf).set(i, { b }); stats.loaded++;
      if (kind === 'f') { const ms = performance.now() - t0; rec(stats.dec, ms); decMs += (ms - decMs) * 0.1; evict(); }
      dirty = true; kick();                         // el dibujo elige el mejor disponible: que lo reconsidere
    } catch (e) { if (!(e && e.name === 'AbortError')) failed++; }
    finally { dec.delete(key); decN--; pump(); }
  }
  function evict() {                                // bitmaps: tope por memoria, se va lo más lejano (atrás pesa el triple)
    if (bm.size <= CAP) return;
    const c = curF, w = (i) => (i - c) * dir < 0 ? 3 * Math.abs(i - c) : Math.abs(i - c);
    [...bm.keys()].sort((a, b) => w(b) - w(a)).slice(0, bm.size - CAP).forEach((i) => { bm.get(i).b.close(); bm.delete(i); });
  }
  function evictBlobs() {                           // blobs: tope por bytes; se baja al 85 % para no reordenar en cada llegada
    const c = curF, w = (i) => (i - c) * dir < 0 ? 4 * Math.abs(i - c) : Math.abs(i - c);
    for (const i of [...blobs.keys()].sort((a, b) => w(b) - w(a))) {
      if (blobBytes <= BLOB_CAP * 0.85) break;
      blobBytes -= blobs.get(i).size || 53e3; blobs.delete(i);
    }
  }
  /** Orden de pedidos a la red: lo que se va a decodificar; la ventana adelante espaciada (cobertura rápida: la red no alcanza a traer cada
      fotograma si la cámara va rápido); la ventana densa (4 adelante por cada 1 atrás) y las claves de respaldo. */
  function* netOrder(c, Wl) {
    for (const i of Wl) yield i;
    const s2 = Math.max(netStride(), 3 * STEP);
    for (let d = s2; d <= AHB * STEP; d += s2) { const a = c + dir * d; if (inRange(a)) yield a; }
    for (let d = 1; d <= AHB; d++) {
      const a = c + dir * d * STEP; if (inRange(a)) yield a;
      if (d % 4 === 0 && d / 4 <= BHB) { const b = c - dir * (d / 4) * STEP; if (inRange(b)) yield b; }
    }
    yield* [...KEYS].sort((a, b) => Math.abs(a - c) - Math.abs(b - c));
  }
  function pump() {
    if (dead) return;
    const c = snap(Math.round(curF)), Wl = want(c);
    for (const i of Wl) { if (decN >= MAXDEC) break; if (!bm.has(i) && !dec.has('f' + i) && blobs.has(i)) decode(i, 'f'); }
    if (decN < MAXDEC) {                            // respaldo de baja resolución: la clave más cercana con blob y sin decodificar
      let best = 0, bd = 1e9;
      for (const k of KEYS) { if (kf.has(k) || dec.has('k' + k) || !blobs.has(k)) continue; const d = Math.abs(k - c); if (d < bd) { bd = d; best = k; } }
      if (best) decode(best, 'k');
    }
    if (net.size >= MAXNET) return;
    let n = 0;
    for (const i of netOrder(c, Wl)) {
      if (net.size >= MAXNET) break;
      if (!blobs.has(i) && !net.has(i)) fetchBlob(i, n < 3 ? 'high' : 'low');
      if (++n > 2 * AHB + BHB + 200) break;
    }
  }
  function abortStale() {                           // lo que quedó fuera de la ventana (salvo claves de respaldo) se cancela
    const c = curF, ahead = (AHB + 20) * STEP, behind = (BHB + 20) * STEP;
    for (const [i, ac] of net) { const d = (i - c) * dir; if (!KEYSET.has(i) && (d > ahead || d < -behind)) { ac.abort(); net.delete(i); } }
  }

  // ---------- Dibujo ----------
  /** Mejor imagen disponible para el fotograma i: el exacto; si no, el decodificado más cercano; la clave de baja resolución solo si está
      bastante más cerca. Nunca se espera ni se deja vacío. Devuelve [bitmap, fotograma]. */
  function bestFor(i) {
    const e = bm.get(i); if (e) return [e.b, i];
    let best = null, bd = 1e9, bk = 0;
    for (const [k, v] of bm) { const d = Math.abs(k - i); if (d < bd) { bd = d; best = v.b; bk = k; } }
    for (const [k, v] of kf) { const d = Math.abs(k - i) + 12 * STEP; if (d < bd) { bd = d; best = v.b; bk = k; } }
    return best ? [best, bk] : null;
  }
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeIO = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const sceneRect = (e) => ({ x: lerp(heroRect.x, tourRect.x, e), y: lerp(heroRect.y, tourRect.y, e), w: lerp(heroRect.w, tourRect.w, e), h: lerp(heroRect.h, tourRect.h, e) });
  function draw() {
    dirty = false;
    const t0 = performance.now();
    const a = snap(Math.floor(curF)), t = Math.min(1, (curF - a) / STEP), nx = a + STEP, e = easeIO(hp);
    g.fillStyle = paper; g.fillRect(0, 0, W, H);                          // el cielo transparente del fotograma 1 se funde con el papel
    const P = bestFor(a);
    if (!P || !tourRect) return;
    const A = P[0];
    // La escena pasa de «contenida» bajo el título (portada) a «cubrir» el viewport (o la lámina, en retrato) con el primer scroll
    const r = sceneRect(e);
    g.save();
    if (band && e > 0) { g.beginPath(); g.rect(0, lerp(0, band[1], e), W, lerp(H, band[3], e)); g.clip(); }
    g.drawImage(A, r.x, r.y, r.w, r.h);
    // fundido entre vecinos solo cuando la cámara va lenta (un fotograma dura varios cuadros, p. ej. dentro de una parada); rápido: un solo drawImage
    if (t > 0.08 && t < 0.92 && vf < 0.5 * STEP && P[1] === a && nx <= N && bm.has(nx)) { g.globalAlpha = t; g.drawImage(bm.get(nx).b, r.x, r.y, r.w, r.h); g.globalAlpha = 1; }
    if (e < 1) { // en la portada el piso del diorama (el fotograma lo corta) se funde con el papel
      const y0 = r.y + r.h * 0.78, gr = g.createLinearGradient(0, y0, 0, r.y + r.h);
      gr.addColorStop(0, paperA0); gr.addColorStop(1, paper);
      g.globalAlpha = 1 - e; g.fillStyle = gr; g.fillRect(r.x - 2, y0, r.w + 4, r.y + r.h - y0 + 2); g.globalAlpha = 1;
    }
    g.restore();
    stats.drawn++; if (P[1] !== a) { stats.miss++; stats.lag += Math.abs(P[1] - a); }   // «stall»: se dibujó otro fotograma que el objetivo
    rec(stats.draws, performance.now() - t0);
  }

  // ---------- HUD: solo transform/opacity en el bucle; textos y aria cambian al cambiar de parada o estación ----------
  const stopAt = (f) => stops.findIndex((s) => f >= s.desde - 6 && f <= s.hasta + 6);
  const sv = (el, k, v) => { const m = el._sv || (el._sv = {}); if (m[k] !== v) { m[k] = v; el.style[k] = v; } };   // escribe solo si cambió
  function hud() {
    const p = hp, q = yC / total;
    sv(hero, 'opacity', Math.max(0, 1 - p * 1.6).toFixed(3)); sv(hero, 'transform', `translate3d(0,${(-p * 56).toFixed(1)}px,0)`);
    sv(hero, 'visibility', p >= 0.99 ? 'hidden' : 'visible');
    sv(veil, 'opacity', Math.max(0, 1 - p * 1.4).toFixed(3));
    sv(cue, 'opacity', Math.max(0, 1 - p * 3).toFixed(3));
    sv(fillEl, 'transform', `scaleX(${q.toFixed(4)})`); sv(dot, 'transform', `translate3d(${(q * railW).toFixed(1)}px,0,0)`);
    const f = Math.round(curF), k = hp < 1 ? -1 : stopAt(f);
    const e = estList.find((x) => f >= ESTACIONES[x][0] && f <= ESTACIONES[x][1]) || estList[0];
    if (e !== est) { est = e; cst.textContent = stUi(e).map; segs.forEach((s) => (s.dataset.e === e ? s.setAttribute('aria-current', 'step') : s.removeAttribute('aria-current'))); }
    if (k !== shown) {
      shown = k;
      ticks.forEach((t, j) => (j === k ? t.setAttribute('aria-current', 'step') : t.removeAttribute('aria-current')));
      cnum.textContent = k >= 0 ? pad(k + 1) : '··';
      if (k >= 0) {
        const s = stops[k]; card.style.setProperty('--st', `var(${s.cvar})`); card.replaceChildren(...cardContent(s, ctx)); placeCard(s);
        card.classList.add('is-on'); card.inert = false; blockDirty = true;
        clearTimeout(liveT); liveT = setTimeout(() => { live.textContent = fill(T.live, { n: k + 1, total: stops.length, title: s.l.titulo }); }, 500);
      } else { card.classList.remove('is-on'); card.inert = true; cardBox = null; blockDirty = true; }
    }
  }

  // ---------- Puntos «+»: misma transformación que el dibujo; solo transform/opacity/visibility (nada de layout por frame) ----------
  const MAXHS = 6, EDGE = 24;
  const MG = 14;                                   // margen de seguridad alrededor de la tarjeta (el disco mide 28 px + anillos)
  function readBlocks() {                          // cabecera y tarjeta: un punto debajo de ellas no se muestra. El riel no tapa: la capa de puntos va por encima (z-index)
    blockDirty = false; blocks = [{ x: 0, y: 0, w: CW, h: headH }];
    if (cardBox) blocks.push(cardBox);
  }
  /* Posición de la tarjeta por parada: entre 5 anclajes (abajo izq./der./centro, arriba izq./der.) se elige el que menos puntos visibles tape
     durante la parada (fotogramas desde-6..hasta+6, opacidad ≥ .5, en pantalla). Si ninguno da 0, se prueba la versión compacta (sin resumen).
     Solo transform/opacity: --dx/--dy desplazan la tarjeta desde su anclaje CSS; el cálculo corre al cambiar de parada o de tamaño, nunca por frame. */
  function placeCard(s) {
    const set = (dx, dy, name, compact) => {
      card.style.setProperty('--dx', `${dx.toFixed(1)}px`); card.style.setProperty('--dy', `${dy.toFixed(1)}px`); card.dataset.pos = name; card.classList.toggle('is-compact', compact);
      cardBox = { x: card.offsetLeft + dx, y: card.offsetTop + dy, w: card.offsetWidth, h: card.offsetHeight }; blockDirty = true;
    };
    card.classList.remove('is-compact');
    if (portrait || !HS.length) { set(0, 0, 'bl', false); return; }
    const key = s.k + (CW > 0 ? '@' + CW + 'x' + CH : ''), c0 = placeCache.get(key);
    if (c0) { set(c0.dx, c0.dy, c0.name, c0.compact); return; }
    // puntos candidatos de la parada: [x, y, peso] en px de CSS
    const q = { x: tourRect.x / DP, y: tourRect.y / DP, w: tourRect.w / DP, h: tourRect.h / DP }, pts = [];
    for (let f = s.desde - 6; f <= s.hasta + 6; f++) for (const P of HS) {
      if (f < P.pt.f0 || f > P.pt.f1) continue;
      const a = hsAt(P.pt.k, f); if (!a || a.o < 0.5) continue;
      const px = q.x + a.x * q.w, py = q.y + a.y * q.h;
      if (px >= EDGE && px <= CW - EDGE && py >= headH + EDGE && py <= CH - EDGE) pts.push([px, py]);
    }
    const best = { cost: 1e9 };
    for (const compact of [false, true]) {
      card.classList.toggle('is-compact', compact);
      const bx = card.offsetLeft, by = card.offsetTop, w = card.offsetWidth, hh = card.offsetHeight, top = headH + 12;
      const right = CW - 2 * bx - w, cand = [['bl', 0, 0], ['br', right, 0], ['bc', right / 2, 0], ['tl', 0, top - by], ['tr', right, top - by]];
      for (const [name, dx, dy] of cand) {
        const x0 = bx + dx - MG, x1 = bx + dx + w + MG, y0 = by + dy - MG, y1 = by + dy + hh + MG;
        let cost = 0; for (const [px, py] of pts) if (px > x0 && px < x1 && py > y0 && py < y1) cost++;
        if (compact) cost += 0.5;                // a igualdad de solapes, preferir la tarjeta completa
        if (cost < best.cost) Object.assign(best, { cost, dx, dy, name, compact });
      }
      if (best.cost === 0) break;
    }
    placeCache.set(key, best); set(best.dx, best.dy, best.name, best.compact);
  }
  function hsUpdate() {
    if (!HS.length) return;
    const t0 = performance.now();
    if (blockDirty) readBlocks();
    const f = curF, act = hp >= 0.999;
    let r = null, y0 = 0, y1 = CH;
    if (act) {
      const e = easeIO(hp), q = sceneRect(e); r = { x: q.x / DP, y: q.y / DP, w: q.w / DP, h: q.h / DP };
      if (band) { y0 = lerp(0, band[1], e) / DP; y1 = y0 + lerp(H, band[3], e) / DP; }   // recorte de la lámina en retrato
    }
    let n = 0;
    for (const P of HS) {
      let o = 0, px = 0, py = 0;
      if (act && f >= P.pt.f0 && f <= P.pt.f1) {
        const a = hsAt(P.pt.k, f);
        if (a && a.o > 0.02) {
          px = r.x + a.x * r.w; py = r.y + a.y * r.h;
          if (px >= EDGE && px <= CW - EDGE && py >= y0 + EDGE && py <= y1 - EDGE && !blocks.some((b) => px > b.x - 14 && px < b.x + b.w + 14 && py > b.y - 14 && py < b.y + b.h + 14)) o = a.o;
        }
      }
      P.px = px; P.py = py; P.o = o; if (o > 0) n++;
    }
    if (n > MAXHS) { const on = HS.filter((P) => P.o > 0).sort((a, b) => b.o - a.o); for (let i = MAXHS; i < on.length; i++) on[i].o = 0; }
    for (const P of HS) {
      const el = P.el, vis = P.o >= 0.12;            // por debajo: ni se ve ni recibe foco ni toque (visibility)
      if (vis !== P.on) { P.on = vis; el.style.visibility = vis ? 'visible' : 'hidden'; }
      if (!vis) continue;
      if (Math.abs(P.px - P.x) > 0.04 || Math.abs(P.py - P.y) > 0.04) { P.x = P.px; P.y = P.py; el.style.transform = `translate3d(${P.px.toFixed(2)}px,${P.py.toFixed(2)}px,0)`; }
      if (Math.abs(P.o - P.oo) > 0.004) { P.oo = P.o; el.style.opacity = P.o.toFixed(3); }
      const side = P.px < 120 ? 'l' : P.px > CW - 120 ? 'r' : P.py < y0 + 96 ? 'b' : '';   // el rótulo no se corta en los bordes
      if (side !== P.side) { P.side = side; el.dataset.side = side; }
    }
    rec(stats.hss, performance.now() - t0);
  }
  loadHotspots().then((data) => {                  // si falla, HS queda vacío: solo la lista de la hoja
    if (dead) return;
    HS = pointsOf(data, stops, ctx).map((pt) => ({ pt, el: hsButton(pt, stops[pt.stop], ctx), on: false, x: -1e9, y: -1e9, o: 0, oo: -1, px: 0, py: 0, side: '' }));
    hsLayer.append(...HS.map((P) => P.el)); placeCache.clear(); if (shown >= 0 && stops[shown]) placeCard(stops[shown]); dirty = true; kick();
  });

  // ---------- Bucle único: scroll suavizado con inercia independiente de los FPS ----------
  const TAU = 0.085; // s: constante de tiempo del amortiguado (≈ 250 ms al 95 %)
  function tick(now) {
    raf = 0;
    if (last) rec(stats.dts, now - last); else vf = 0;   // intervalo real entre cuadros (sin contar el primero tras una pausa)
    const dt = Math.min(0.064, last ? (now - last) / 1000 : 0.016); last = now;
    yT = Math.max(0, Math.min(total, scrollY - tourTop));
    if (Math.abs(yT - yC) > innerHeight * 3) { yC = yT; stats.jumps++; canvas.classList.add('is-jump'); requestAnimationFrame(() => canvas.classList.remove('is-jump')); } // salto largo: fundido, no barrido
    else { yC += (yT - yC) * (1 - Math.exp(-dt / TAU)); if (Math.abs(yT - yC) < 0.4) yC = yT; }
    const nf = frameOfY(yC);
    vf += (Math.abs(nf - curF) - vf) * (1 - Math.exp(-dt / 0.12));   // velocidad en fotogramas por cuadro (≈ 120 ms de memoria)
    if (nf !== curF) { dir = nf > curF ? 1 : -1; curF = nf; dirty = true; }
    const nhp = Math.max(0, Math.min(1, yC / HPX)); if (nhp !== hp) { hp = nhp; dirty = true; }
    if (Math.round(curF) !== lastF) { lastF = Math.round(curF); abortStale(); pump(); }
    if (dirty) draw();
    hud();
    hsUpdate();
    if (yC !== yT || dirty) raf = requestAnimationFrame(tick); else last = 0;
  }
  function kick() { if (!raf && !dead) raf = requestAnimationFrame(tick); }
  function goStop(k) { scrollTo({ top: tourTop + yOfFrame(stops[k].mid) + 1, behavior: 'instant' }); kick(); }

  // ---------- Eventos ----------
  const off = [];
  const bind = (t, ev, fn, o) => { t.addEventListener(ev, fn, o); off.push(() => t.removeEventListener(ev, fn, o)); };
  bind(window, 'scroll', kick, { passive: true });
  let rz = 0; const relayout = () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(layout); };
  bind(window, 'resize', relayout);
  // Cambio de DPR sin cambio de tamaño (mover la ventana a otro monitor, zoom): no siempre dispara resize
  let dprMq = null; const onDpr = () => { relayout(); watchDpr(); };
  const watchDpr = () => { if (dprMq) dprMq.removeEventListener('change', onDpr); dprMq = matchMedia(`(resolution: ${devicePixelRatio}dppx)`); dprMq.addEventListener('change', onDpr); };
  watchDpr(); off.push(() => dprMq && dprMq.removeEventListener('change', onDpr));
  const repaint = () => { setPaper(); dirty = true; kick(); };
  bind(window, 'mb-theme', repaint); bind(matchMedia('(prefers-color-scheme: dark)'), 'change', repaint);
  bind(ticksEl, 'click', (e) => { const t = e.target.closest('.tick'); if (t) goStop(+t.dataset.k); });
  bind(hsLayer, 'click', (e) => { const b = e.target.closest('[data-hs]'); if (b) openDetail(stops[+b.dataset.detail], ctx, b, b.dataset.hs); });
  bind(card, 'click', (e) => { const b = e.target.closest('[data-detail]'); if (b) openDetail(stops[+b.dataset.detail], ctx, b); });
  bind(document, 'visibilitychange', kick);
  bind(window, 'pagehide', () => { try { sessionStorage.setItem('mb:y', String(Math.round(scrollY))); } catch (e) { /* sin storage */ } });

  layout(); pump();
  yT = yC = Math.max(0, Math.min(total, scrollY - tourTop)); curF = frameOfY(yC); hp = Math.min(1, yC / HPX);
  kick();
  if (opts.stop != null && stops[opts.stop]) setTimeout(() => goStop(opts.stop), 60);
  else if (savedY) requestAnimationFrame(() => { scrollTo(0, savedY); kick(); });  // Depuración y QA: tiempos de dibujo y de cuadro, fotogramas decodificados, cobertura del viewport.
  window.__mb = { stats, lite, goStop, frame: () => curF, total: () => total, bm: () => bm.size, kf: () => kf.size, cap: () => CAP, size: () => [W, H],
    inflight: () => net.size, decoding: () => decN, blobs: () => [blobs.size, blobBytes], speed: () => vf, css: () => [CW, CH],
    step: () => { cancelAnimationFrame(raf); raf = 0; tick(performance.now()); }, draw: () => { dirty = true; draw(); }, setFrame: (f) => { curF = f; dirty = true; }, paper: () => paper, ctx2d: g, bitmaps: bm, layout, yOf: yOfFrame, top: () => tourTop, settle: () => { yT = yC = Math.max(0, Math.min(total, scrollY - tourTop)); curF = frameOfY(yC); hp = Math.min(1, yC / HPX); dirty = true; tick(performance.now()); }, hs: () => HS, cardBox: () => cardBox, place: () => placeCache, rect: () => ({ tourRect, DP, CW, CH, band, headH }) };
  let perfOff = () => {};
  if (PERF) import('../lib/perf-overlay.js?v=6').then((m) => { if (!dead) perfOff = m.mountPerf(window.__mb, ui.perf); }).catch(() => {});
  return () => {
    savedY = scrollY; dead = true; cancelAnimationFrame(raf); clearTimeout(liveT); off.forEach((f) => f());
    for (const ac of net.values()) ac.abort(); net.clear(); blobs.clear(); perfOff();
    for (const v of bm.values()) v.b.close(); for (const v of kf.values()) v.b.close(); bm.clear(); kf.clear(); delete window.__mb;
  };
}
