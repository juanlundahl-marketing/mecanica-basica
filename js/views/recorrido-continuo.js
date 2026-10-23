// Recorrido «Taller a la luz» (portada): un canvas a pantalla completa que dibuja el fotograma (1..1640) que marca el scroll.
// Motor: decodificación fuera del hilo (createImageBitmap, recortado al área visible), precarga priorizada alrededor del fotograma
// actual, un solo rAF con inercia independiente de los FPS, canvas a DPR acotado. Con prefers-reduced-motion: láminas fijas por parada.
// El contenido es accesible sin el canvas: tarjeta/riel con teclado + índice de paradas al pie (en home.js).
import { h } from '../lib/dom.js?v=8';
import { ico } from '../lib/icons.js?v=8';
import { plural } from '../lib/text.js?v=8';
import { FRAMES as N, FRAME_URL as FR, ESTACIONES, buildStops, stationNum } from '../lib/recorrido-paradas.js?v=9';
import { openDetail } from '../lib/hoja-detalle.js?v=8';
import { loadHotspots, pointsOf, hsAt, hsButton } from '../lib/hotspots.js?v=9';

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
  const saver = !!(navigator.connection && (navigator.connection.saveData || /(^|-)2g$/.test(navigator.connection.effectiveType || '')));
  const lite = matchMedia('(max-width: 760px)').matches || saver;
  const STEP = lite ? 2 : 1;                       // modo ligero: 1 de cada 2 fotogramas, solo secuencia liviana
  /* Con la cámara rápida se muestra 1 de cada G fotogramas (G = 2 desde 1 fotograma/cuadro, 3 desde 2,5; vuelve a 1 por debajo de 0,7, con
     histéresis): el objetivo se cuantiza a esa grilla, así siempre es un fotograma liviano exacto ya decodificado, sin desfase. */
  let G = 1, QS = STEP;
  const snap = (f) => 1 + Math.floor((Math.max(1, Math.min(N, f)) - 1) / QS) * QS;
  const rec = (a, v) => { a.push(v); if (a.length > 1500) a.splice(0, 500); };   // muestras acotadas (costo O(1) amortizado)
  const stats = { why: {}, loaded: 0, drawn: 0, miss: 0, lag: 0, lo: 0, full: 0, jumps: 0, dts: [], draws: [], hss: [], dec: [], net: [], settle: [], gen: 0 };
  let W = 1, H = 1, tourTop = 0, total = 0, HPX = 1, railW = 1, paper = '#F2EDE6';
  let portrait = false, heroRect = null, tourRect = null, band = null, paperA0 = 'rgba(242,237,230,0)'; // rectángulos de dibujo
  let dead = false;
  /* Dos secuencias. LIVIANA (assets/recorrido-lo, 960×540, ~20 kB): se precarga entera (blobs en memoria, por cercanía al fotograma actual)
     y se decodifica bajo demanda a ImageBitmap (~2 MB c/u, caché por distancia): es la que se ve mientras la cámara se mueve, siempre el
     fotograma exacto. COMPLETA (assets/recorrido, 1920×1080): solo cuando la cámara se detiene (velocidad < SLOW durante SETTLE ms) se pide
     y decodifica el fotograma exacto y se funde en 80 ms. Modo ligero: solo la liviana. */
  const LO_URL = (i) => `assets/recorrido-lo/f_${String(i).padStart(4, '0')}.webp?v=${i >= 922 && i <= 988 ? 2 : 1}`; // v2: parada 09 (922-988)
  const FULL = !lite;
  const lo = new Map(), full = new Map(), loBlob = new Map(), fullBlob = new Map(), net = new Map(), dec = new Set();
  const LO_CAP = lite ? 30 : 150, FULL_CAP = 1, FULL_BLOB_CAP = 6;         // ≈ 150 × 2,07 MB + 8,3 MB + blobs (~31 MB) ≈ 350 MB en escritorio
  const LO_A = lite ? 20 : 105, LO_B = lite ? 8 : 40;                      // ventana de bitmaps livianos (en pasos): adelante / atrás
  const NET_A = saver ? 120 : N, NET_B = saver ? 30 : N;                   // precarga de blobs livianos: total, salvo ahorro de datos
  const MAXNET = lite ? 4 : 8, MAXDEC = lite ? 2 : 4, canFetch = location.protocol.startsWith('http');
  const SLOW = 0.2, SETTLE = 130, FADE = 80;                               // fotogramas/cuadro, ms
  let loNeed = 0; for (let i = 1; i <= N; i += STEP) loNeed++;
  let loBytes = 0, decN = 0, vf = 0, slowSince = -1e9, settleT = 0, fadeF = -1, fadeT0 = 0, idleT = 0;
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
  async function source(i, kind, signal, prio) {
    const url = kind === 'l' ? LO_URL(i) : FR(i);
    if (canFetch) {
      let r = null; if (kind === 'f' && i === 1 && window.__mbF1) { r = await window.__mbF1; window.__mbF1 = null; if (r && !r.ok) r = null; } // respuesta pedida desde el <head>
      if (!r) r = await fetch(url, { signal, priority: prio });
      if (!r.ok) throw new Error(r.status); return r.blob();
    }
    const im = new Image(); im.src = url; await im.decode(); return im;   // respaldo file:// (sin fetch)
  }
  const inRange = (i) => i >= 1 && i <= N;
  const settled = () => slowSince !== null && performance.now() - slowSince >= SETTLE;   // null: en movimiento
  /** Fotogramas que se van a dibujar en los próximos cuadros: se simula la inercia (misma fórmula que tick, a 60 Hz) desde yC hasta yT. */
  function predict() {
    const L = [], k = 1 - Math.exp(-(1 / 60) / TAU); let y = yC, prev = -1;
    for (let n = 0; n < 48; n++) {
      const f = snap(Math.floor(frameOfY(y))); if (f !== prev) { L.push(f); prev = f; }
      if (Math.abs(yT - y) < 0.4) break; y += (yT - y) * k;
    }
    const fT = snap(Math.floor(frameOfY(yT))); if (fT !== prev) L.push(fT);
    return L;
  }
  function* around(c, A, B, s = STEP) {             // por cercanía: 2 adelante por cada 1 atrás, de a s fotogramas
    for (let d = 0; d <= Math.max(A, B * 2); d++) {
      if (d <= A) { const a = c + dir * d * s; if (inRange(a)) yield a; }
      if (d && d % 2 === 0 && d / 2 <= B) { const b = c - dir * (d / 2) * s; if (inRange(b)) yield b; }
    }
  }
  const bg = new Set();                             // pedidos livianos de fondo (prioridad baja): los primeros en cederle lugar a la trayectoria
  function victim(c) { let k = null, d = -1; for (const x of bg) { if (!net.has(x)) { bg.delete(x); continue; } const e = Math.abs(+x.slice(1) - c); if (e > d) { d = e; k = x; } } return k; }
  async function fetchBlob(i, kind, prio) {
    const key = kind + i, ac = new AbortController(), t0 = performance.now(); net.set(key, ac); if (kind === 'l' && prio === 'low') bg.add(key);
    try {
      const b = await source(i, kind, ac.signal, prio);
      if (dead) return;
      if (kind === 'l') { loBlob.set(i, b); loBytes += b.size || 20e3; } else { fullBlob.set(i, b); trim(fullBlob, FULL_BLOB_CAP, false); }
      rec(stats.net, performance.now() - t0);
    } catch (e) { if (!(e && e.name === 'AbortError')) { failed++; if (failed === 8 && !stats.loaded) live.textContent = T.loadFail; } }
    finally { if (net.get(key) === ac) net.delete(key); bg.delete(key); pump(); }
  }
  async function decode(i, kind) {
    const key = kind + i, src = (kind === 'l' ? loBlob : fullBlob).get(i), t0 = performance.now(); dec.add(key); decN++;
    try {
      // sin redimensionar (medido: el redimensionado bloquea el hilo principal); colorSpaceConversion 'none' da píxeles idénticos (medido);
      // premultiplyAlpha 'none' NO: cambia hasta 2 niveles los bordes de los fotogramas con transparencia
      const b = await createImageBitmap(src, { colorSpaceConversion: 'none' });
      if (dead) { b.close(); return; }
      (kind === 'l' ? lo : full).set(i, b); stats.loaded++;
      rec(stats.dec, performance.now() - t0);
      if (kind === 'l') trim(lo, LO_CAP, true); else trim(full, FULL_CAP, true);
      const a = snap(Math.floor(curF)); if (Math.abs(i - a) <= 2 * STEP || kind === 'f') { dirty = true; kick(); }
    } catch (e) { if (!(e && e.name === 'AbortError')) failed++; }
    finally { dec.delete(key); decN--; pump(); }
  }
  function trim(m, cap, close) {                    // desalojo por distancia al fotograma actual (atrás pesa el doble)
    if (m.size <= cap) return;
    const c = curF, w = (i) => (i - c) * dir < 0 ? 2 * Math.abs(i - c) : Math.abs(i - c);
    for (const i of [...m.keys()].sort((a, b) => w(b) - w(a)).slice(0, m.size - cap)) { if (close) m.get(i).close(); m.delete(i); }
  }
  function pump() {
    if (dead) return;
    const a = snap(Math.floor(curF)), c = a, P = predict();
    // 1) completa: solo con la cámara detenida, el fotograma exacto (con un cupo de decodificación propio)
    if (FULL && settled()) {
      if (!full.has(a)) {
        if (fullBlob.has(a)) { if (!dec.has('f' + a) && decN <= MAXDEC) decode(a, 'f'); }
        else if (!net.has('f' + a)) fetchBlob(a, 'f', 'high');
      }
      for (const i of [a + dir * STEP, a - dir * STEP]) if (inRange(i) && !fullBlob.has(i) && !net.has('f' + i) && net.size < MAXNET) fetchBlob(i, 'f', 'low');
    }
    // 2) liviana: decodificar primero la trayectoria prevista; después la anticipada (el mismo patrón un paso más allá, y la velocidad
    //    actual extrapolada desde el destino); la ventana por cercanía solo con la cámara lenta (rápido, no da abasto y quita cupo)
    const D = P[P.length - 1] - P[0], fT = P[P.length - 1], v = Math.max(1, vf), Q = [...P];
    for (let k = 1; k <= 12; k++) { const i = c + dir * k * QS; if (inRange(i)) Q.push(i); }   // grilla densa por delante: el próximo paso de rueda arranca acá
    if (D) for (const f of P) { const i = f + D; if (inRange(i)) Q.push(i); }
    for (let k = 1; k <= 8; k++) { const i = snap(fT + dir * Math.round(k * v)); if (inRange(i)) Q.push(i); }
    let n = 0;
    for (const i of Q) { if (decN >= MAXDEC) break; if (!lo.has(i) && !dec.has('l' + i) && loBlob.has(i)) decode(i, 'l'); }
    if (decN < MAXDEC && vf < 1) for (const i of around(c, LO_A, LO_B, QS)) {
      if (decN >= MAXDEC || ++n > 400) break;
      if (!lo.has(i) && !dec.has('l' + i) && loBlob.has(i)) decode(i, 'l');
    }
    // 3) red: blobs livianos, la trayectoria primero y después todo por cercanía (precarga total)
    if (net.size >= MAXNET || loBlob.size >= loNeed) return;
    for (const i of Q) {                            // la trayectoria desplaza a la precarga de fondo: se cancela el pedido de fondo más lejano
      if (loBlob.has(i) || net.has('l' + i)) continue;
      if (net.size >= MAXNET) { const v = victim(c); if (!v) return; bg.delete(v); const ac = net.get(v); if (ac) { ac.abort(); net.delete(v); } else continue; }
      fetchBlob(i, 'l', 'high');
    }
    for (const i of around(c, NET_A, NET_B)) { if (net.size >= MAXNET) return; if (!loBlob.has(i) && !net.has('l' + i)) fetchBlob(i, 'l', 'low'); }
  }
  function abortStale() {                           // completos que ya no son el objetivo; livianos lejanos (se vuelven a pedir en orden)
    const a = snap(Math.floor(curF)), far = (saver ? 150 : 220) * STEP;
    for (const [k, ac] of net) {
      const i = +k.slice(1), d = Math.abs(i - a);
      if ((k[0] === 'f' && (d > 2 * STEP || !settled())) || (k[0] === 'l' && d > far)) { ac.abort(); net.delete(k); bg.delete(k); }
    }
  }

  // ---------- Dibujo ----------
  /** Imagen para el fotograma i: la liviana exacta; si todavía no está, la completa exacta; si no, la liviana más cercana (cuenta como «stall»). */
  function bestFor(i, cell = STEP) {
    const L = lo.get(i); if (L) return [L, i];
    for (let j = i - STEP; j > i - cell && j >= 1; j -= STEP) { const v = lo.get(j); if (v) return [v, j]; }   // dentro de la celda de la grilla rápida
    const F = full.get(i); if (F) return [F, i];
    let best = null, bd = 1e9, bk = 0;
    for (const [k, v] of lo) { const d = Math.abs(k - i); if (d < bd) { bd = d; best = v; bk = k; } }
    if (!best) for (const [k, v] of full) { const d = Math.abs(k - i); if (d < bd) { bd = d; best = v; bk = k; } }
    return best ? [best, bk] : null;
  }
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeIO = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const sceneRect = (e) => ({ x: lerp(heroRect.x, tourRect.x, e), y: lerp(heroRect.y, tourRect.y, e), w: lerp(heroRect.w, tourRect.w, e), h: lerp(heroRect.h, tourRect.h, e) });
  function draw() {
    dirty = false;
    const t0 = performance.now();
    const a = 1 + Math.floor((Math.max(1, Math.min(N, Math.floor(curF))) - 1) / STEP) * STEP, e = easeIO(hp);   // objetivo real (sin grilla)
    g.fillStyle = paper; g.fillRect(0, 0, W, H);                          // el cielo transparente del fotograma 1 se funde con el papel
    const P = bestFor(a, QS);                       // rápido: el último fotograma de la celda de G (1 de cada G), nunca uno viejo
    if (!P || !tourRect) return;
    // La escena pasa de «contenida» bajo el título (portada) a «cubrir» el viewport (o la lámina, en retrato) con el primer scroll
    const r = sceneRect(e);
    g.save();
    if (band && e > 0) { g.beginPath(); g.rect(0, lerp(0, band[1], e), W, lerp(H, band[3], e)); g.clip(); }
    g.drawImage(P[0], r.x, r.y, r.w, r.h);
    // completa encima de la liviana (mismo fotograma), con fundido de FADE ms; nunca durante el movimiento
    const F = FULL && P[1] === a && settled() ? full.get(a) : null;
    let fa = 0;
    if (F && F !== P[0]) {
      if (fadeF !== a) { fadeF = a; fadeT0 = t0; }
      fa = Math.min(1, (t0 - fadeT0) / FADE);
      if (fa > 0) { g.globalAlpha = fa; g.drawImage(F, r.x, r.y, r.w, r.h); g.globalAlpha = 1; }
      if (fa < 1) dirty = true;                     // seguir el bucle hasta terminar el fundido
    } else if (F) fa = 1;
    if (fa > 0 && settleT) { rec(stats.settle, t0 - settleT); settleT = 0; }   // latencia: velocidad baja → aparece la 1920
    if (e < 1) { // en la portada el piso del diorama (el fotograma lo corta) se funde con el papel
      const y0 = r.y + r.h * 0.78, gr = g.createLinearGradient(0, y0, 0, r.y + r.h);
      gr.addColorStop(0, paperA0); gr.addColorStop(1, paper);
      g.globalAlpha = 1 - e; g.fillStyle = gr; g.fillRect(r.x - 2, y0, r.w + 4, r.y + r.h - y0 + 2); g.globalAlpha = 1;
    }
    g.restore();
    stats.drawn++; stats.lag += Math.abs(P[1] - a); if (P[1] > a || a - P[1] >= QS) { stats.miss++; const w = stats.why; const k = dec.has('l' + a) ? 'dec' : !loBlob.has(a) ? 'blob' : 'cola'; w[k] = (w[k] || 0) + 1; }   // «stall»: se dibujó otro fotograma que el objetivo
    if (fa > 0) stats.full++; else stats.lo++;
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
    if (last) rec(stats.dts, now - last); else { vf = 0; clearTimeout(idleT); }   // intervalo real entre cuadros (sin contar el primero tras una pausa)
    const dt = Math.min(0.064, last ? (now - last) / 1000 : 0.016); last = now;
    yT = Math.max(0, Math.min(total, scrollY - tourTop));
    if (Math.abs(yT - yC) > innerHeight * 3) { yC = yT; stats.jumps++; canvas.classList.add('is-jump'); requestAnimationFrame(() => canvas.classList.remove('is-jump')); } // salto largo: fundido, no barrido
    else { yC += (yT - yC) * (1 - Math.exp(-dt / TAU)); if (Math.abs(yT - yC) < 0.4) yC = yT; }
    const nf = frameOfY(yC);
    vf += (Math.abs(nf - curF) - vf) * (1 - Math.exp(-dt / 0.12));   // velocidad en fotogramas por cuadro (≈ 120 ms de memoria)
    let ng = G; if (vf >= 2.5) ng = 3; else if (vf >= 1) ng = Math.max(ng, 2);
    if (ng === 3 && vf < 1.8) ng = 2; if (ng >= 2 && vf < 0.7) ng = 1;
    if (ng !== G) { G = ng; QS = STEP * G; dirty = true; }
    if (vf >= SLOW) { slowSince = null; settleT = 0; } else if (slowSince === null) slowSince = settleT = now;
    if (nf !== curF) { dir = nf > curF ? 1 : -1; curF = nf; dirty = true; }
    const nhp = Math.max(0, Math.min(1, yC / HPX)); if (nhp !== hp) { hp = nhp; dirty = true; }
    if (Math.round(curF) !== lastF) { lastF = Math.round(curF); abortStale(); pump(); }
    if (dirty) draw();
    hud();
    hsUpdate();
    if (yC !== yT || dirty) raf = requestAnimationFrame(tick);
    else {                                          // quieto: velocidad 0; la completa se pide al cumplirse SETTLE ms
      last = 0; vf = 0; if (G !== 1) { G = 1; QS = STEP; dirty = true; pump(); kick(); }   // quieto: de vuelta a la grilla de 1 if (slowSince === null) slowSince = settleT = now;
      clearTimeout(idleT); if (FULL && !full.has(snap(Math.floor(curF)))) idleT = setTimeout(pump, Math.max(0, SETTLE - (performance.now() - slowSince)) + 5);
    }
  }
  function kick() { if (!raf && !dead) raf = requestAnimationFrame(tick); }
  function goStop(k) { scrollTo({ top: tourTop + yOfFrame(stops[k].mid) + 1, behavior: 'instant' }); kick(); }

  // ---------- Eventos ----------
  const off = [];
  const bind = (t, ev, fn, o) => { t.addEventListener(ev, fn, o); off.push(() => t.removeEventListener(ev, fn, o)); };
  // al llegar el scroll se recalcula el destino y se encola la decodificación ya, sin esperar al próximo cuadro
  bind(window, 'scroll', () => { yT = Math.max(0, Math.min(total, scrollY - tourTop)); pump(); kick(); }, { passive: true });
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
  window.__mb = { stats, lite, goStop, frame: () => curF, total: () => total, bm: () => lo.size, kf: () => full.size, cap: () => LO_CAP, size: () => [W, H],
    inflight: () => net.size, decoding: () => decN, blobs: () => [loBlob.size, loBytes, loNeed, fullBlob.size], speed: () => vf, css: () => [CW, CH],
    step: () => { cancelAnimationFrame(raf); raf = 0; tick(performance.now()); }, draw: () => { dirty = true; draw(); }, setFrame: (f) => { curF = f; dirty = true; }, paper: () => paper, ctx2d: g, lo, full, layout, yOf: yOfFrame, top: () => tourTop, settle: () => { yT = yC = Math.max(0, Math.min(total, scrollY - tourTop)); curF = frameOfY(yC); hp = Math.min(1, yC / HPX); dirty = true; tick(performance.now()); }, hs: () => HS, cardBox: () => cardBox, place: () => placeCache, rect: () => ({ tourRect, DP, CW, CH, band, headH }) };
  return () => {
    savedY = scrollY; dead = true; cancelAnimationFrame(raf); clearTimeout(liveT); off.forEach((f) => f());
    clearTimeout(idleT); for (const ac of net.values()) ac.abort(); net.clear(); loBlob.clear(); fullBlob.clear();
    for (const v of lo.values()) v.close(); for (const v of full.values()) v.close(); lo.clear(); full.clear(); delete window.__mb;
  };
}
