// Recorrido continuo (#/recorrido): el scroll controla un fotograma prerrenderizado (1..1640); las 18 paradas son lecciones.
// Contenido accesible = lista de paradas (panel) + índice al final. Con prefers-reduced-motion: una foto fija por parada.
import { h } from '../lib/dom.js';
import { FRAMES as N, FRAME_URL, ESTACIONES, PARADAS } from '../lib/recorrido-paradas.js';

const PX_TRAVEL = 3, PX_STOP = 16; // píxeles de scroll por fotograma: viaje / dentro de una parada
const STATION_OF = { taller: 'taller', concesionaria: 'concesionaria', pista: 'ruta' }; // id del render -> id en ui-strings
const mid = (p) => Math.round((p[2] + p[3]) / 2);

let resume = null; // retomar el scroll al volver atrás desde una lección
addEventListener('hashchange', () => { if (resume && location.hash !== resume.dest && !/^#\/recorrido/.test(location.hash)) resume = null; });

export function render(el, ctx) {
  const { ui, model } = ctx;
  const C = ui.recorrido.cont, R = ui.recorrido;
  ctx.setTitle(C.title);
  const fill = (t, o) => t.replace(/\{(\w+)\}/g, (_, k) => o[k]);
  const stOf = (id) => R.stations.find((s) => s.id === STATION_OF[id]);
  const stops = PARADAS.map(([id, est, desde, hasta]) => ({ id, est, desde, hasta, l: model.lessonsById.get(id) })).filter((s) => s.l);
  const stationList = Object.keys(ESTACIONES);
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const cleanups = [];
  const on = (t, ev, fn, opt) => { t.addEventListener(ev, fn, opt); cleanups.push(() => t.removeEventListener(ev, fn, opt)); };
  let dead = false, teardown = () => {};

  const goto = (a) => h('a', { class: a.cls, href: '#/recorrido', 'data-goto': a.id }, a.text);
  const head = h('header', { class: 'wrap rf-head' },
    h('p', { class: 'label' }, C.kicker), h('h1', null, C.h1), h('p', { class: 'lead' }, C.lead),
    goto({ cls: 'btn', id: 'rc-indice', text: C.toList }));
  const skip = h('a', { class: 'rc-skip', href: '#/recorrido', 'data-goto': 'rc-indice' }, C.skip);
  const slot = h('div', { class: 'rf-slot' });
  const indice = h('section', { class: 'rc-indice wrap', id: 'rc-indice', tabindex: '-1', 'aria-labelledby': 'rc-indice-t' },
    h('h2', { id: 'rc-indice-t' }, R.index.title), h('p', null, R.index.text),
    h('div', { class: 'rc-indice-grid' }, stationList.map((e) => h('div', null,
      h('h3', null, stOf(e).title),
      h('ol', { class: 'rc-indice-list' }, stops.filter((s) => s.est === e).map((s) => h('li', null, h('a', { href: `#/leccion/${s.id}` }, s.l.titulo))))))));
  el.replaceChildren(skip, head, slot, indice);

  on(el, 'click', (e) => { // anclas internas (el hash lo usa el router)
    const a = e.target.closest && e.target.closest('[data-goto]');
    if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    const t = document.getElementById(a.dataset.goto); if (!t) return;
    t.scrollIntoView({ behavior: RM.matches ? 'auto' : 'smooth', block: 'start' });
    t.focus({ preventScroll: true });
  });

  /* ---------- Modo estático: una foto por parada ---------- */
  function buildStatic() {
    const sec = h('section', { class: 'wrap rf-static', 'aria-labelledby': 'rf-st-t' },
      h('h2', { id: 'rf-st-t' }, C.staticTitle), h('p', null, C.staticText),
      stationList.map((e) => h('div', { class: 'rf-st-group' }, h('h3', null, stOf(e).title),
        h('ol', { class: 'rf-st-list' }, stops.filter((s) => s.est === e).map((s) => h('li', null, h('figure', null,
          h('img', { src: FRAME_URL(mid([0, 0, s.desde, s.hasta])), width: 1920, height: 1080, loading: 'lazy', decoding: 'async', alt: fill(C.imgAlt, { station: stOf(e).title, lesson: s.l.titulo }) }),
          h('figcaption', null, h('a', { href: `#/leccion/${s.id}` }, s.l.titulo)))))))));
    slot.replaceChildren(sec);
    return () => slot.replaceChildren();
  }

  /* ---------- Modo continuo: canvas + scroll ---------- */
  function buildTour() {
    const lite = matchMedia('(max-width: 760px)').matches || !!(navigator.connection && (navigator.connection.saveData || /(^|-)2g$/.test(navigator.connection.effectiveType || '')));
    // scroll acumulado por fotograma: más lento dentro de las paradas
    const cum = new Float32Array(N + 2), inStop = new Uint8Array(N + 2);
    stops.forEach((s) => { for (let f = s.desde; f <= s.hasta; f++) inStop[f] = 1; });
    for (let f = 1; f <= N; f++) cum[f + 1] = cum[f] + (inStop[f] ? PX_STOP : PX_TRAVEL);
    const total = cum[N];

    const cv = h('canvas', { role: 'img', 'aria-label': C.canvasAria });
    const lbar = h('i'), ltxt = h('span', null, fill(C.loading, { p: 0 }));
    const loader = h('div', { class: 'rf-loader', 'aria-hidden': 'true' }, ltxt, h('span', { class: 'rf-bar' }, lbar));
    const capA = h('a', { href: '#/recorrido' }), capT = h('span');
    const caption = h('p', { class: 'rf-caption' }, capT, capA);
    const pbar = h('i'), progress = h('div', { class: 'rf-progress', role: 'progressbar', 'aria-label': C.progressAria, 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': 0 }, pbar);
    const stBtns = stationList.map((e) => h('li', null, h('button', { type: 'button', 'data-f': ESTACIONES[e][0], 'aria-label': `${C.goTo}: ${stOf(e).title}` }, stOf(e).map)));
    const stopLis = stops.map((s, k) => h('li', null, h('a', { href: `#/leccion/${s.id}`, 'data-k': k },
      h('b', { 'aria-hidden': 'true' }, String(k + 1)), h('span', null, s.l.titulo))));
    const panel = h('details', { class: 'rf-side' }, h('summary', null, C.panel),
      h('h2', null, C.stationsTitle), h('ul', { class: 'rf-stations' }, stBtns),
      h('h2', null, C.stopsTitle), h('ol', { class: 'rf-stops' }, stopLis));
    if (!matchMedia('(max-width: 760px)').matches) panel.open = true;
    const stage = h('div', { class: 'rf-stage' }, cv, loader, caption, panel, progress);
    const tour = h('section', { class: 'rf-tour', 'aria-label': C.title }, stage);
    slot.replaceChildren(tour);

    const ctx2d = cv.getContext('2d');
    const imgs = new Array(N + 2), ok = new Uint8Array(N + 2);
    let loaded = 0, active = 0, coarsePtr = 0, cur = 1, target = 1, last = -1, lastY = -1, dir = 1, raf = 0, stopped = false, goal = N;
    const coarse = []; { const seen = new Set(); (lite ? [16, 8, 4] : [16, 8, 4, 2, 1]).forEach((st) => { for (let i = 1; i <= N; i += st) if (!seen.has(i)) { seen.add(i); coarse.push(i); } }); if (!seen.has(N)) coarse.push(N); }
    if (lite) goal = coarse.length; // en móvil / ahorro de datos: carga gruesa (1 de cada 4) y, bajo demanda, los vecinos del fotograma actual
    const WIN = lite ? 6 : 0;
    const asked = new Uint8Array(N + 2);
    function pick() {
      const c = Math.round(cur);
      for (let d = 0; d <= WIN; d++) for (const i of [c + d, c - d]) if (i >= 1 && i <= N && !asked[i]) return i;
      while (coarsePtr < coarse.length) { const i = coarse[coarsePtr++]; if (!asked[i]) return i; }
      if (lite) return 0;
      for (let d = 0; d < N; d++) for (const i of [c + d, c - d]) if (i >= 1 && i <= N && !asked[i]) return i; // el resto, de cerca a lejos
      return 0;
    }
    function pump() {
      while (!stopped && active < 6) {
        const i = pick(); if (!i) break;
        asked[i] = 1; active++;
        const im = new Image(); im.decoding = 'async';
        im.onload = () => { ok[i] = 1; loaded++; active--; prog(); if (Math.abs(i - Math.round(cur)) < 3) draw(true); pump(); };
        im.onerror = () => { active--; pump(); };
        im.src = FRAME_URL(i); imgs[i] = im;
      }
    }
    function prog() {
      const p = Math.min(1, loaded / goal);
      lbar.style.transform = `scaleX(${p})`;
      ltxt.textContent = p >= 1 ? C.ready : fill(C.loading, { p: Math.round(p * 100) });
      if (p >= 1) loader.classList.add('is-done');
    }
    const nearest = (i) => { for (let d = 0; d < N; d++) { if (ok[i - d]) return i - d; if (ok[i + d]) return i + d; } return 0; };
    function size() { const dpr = Math.min(devicePixelRatio || 1, 2); cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientHeight * dpr); draw(true); }
    function draw(force) {
      const k = nearest(Math.round(cur));
      if (!force && k === last) return; last = k;
      const W = cv.width, H = cv.height;
      ctx2d.fillStyle = getComputedStyle(document.body).backgroundColor; ctx2d.fillRect(0, 0, W, H);
      if (!k) return;
      const im = imgs[k], iw = im.naturalWidth || 1920, ih = im.naturalHeight || 1080, s = Math.max(W / iw, H / ih);
      ctx2d.drawImage(im, (W - iw * s) / 2, (H - ih * s) / 2, iw * s, ih * s);
      for (let j = 1; j <= 3; j++) { const n = imgs[Math.round(cur) + dir * j]; if (n && n.decode) n.decode().catch(() => {}); } // calienta la decodificación de los próximos
    }
    function frameFromScroll() {
      const y = Math.min(total, Math.max(0, scrollY - (tour.getBoundingClientRect().top + scrollY)));
      let lo = 1, hi = N; // mayor f con cum[f] <= y
      while (lo < hi) { const m = (lo + hi + 1) >> 1; if (cum[m] <= y) lo = m; else hi = m - 1; }
      return Math.min(N, lo + (y - cum[lo]) / (cum[lo + 1] - cum[lo] || 1));
    }
    function scrollOfFrame(f) { return tour.getBoundingClientRect().top + scrollY + cum[f]; }
    let uiStop = -2, uiEst = '';
    function ui_() {
      const f = Math.round(cur);
      const k = stops.findIndex((s) => f >= s.desde && f <= s.hasta);
      const est = stationList.find((e) => f >= ESTACIONES[e][0] && f <= ESTACIONES[e][1]) || stationList[0];
      if (k !== uiStop || est !== uiEst) {
        uiStop = k; uiEst = est;
        stopLis.forEach((li, j) => { const a = li.firstChild; if (j === k) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current'); });
        stBtns.forEach((li, j) => { const b = li.firstChild; if (stationList[j] === est) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
        if (k >= 0) { capT.textContent = fill(C.stopOf, { n: k + 1, total: stops.length }) + ' · '; capA.textContent = stops[k].l.titulo; capA.href = `#/leccion/${stops[k].id}`; capA.hidden = false; }
        else { capT.textContent = `${stOf(est).title} · ${C.onTheWay}`; capA.hidden = true; }
      }
      const pct = (f - 1) / (N - 1);
      pbar.style.transform = `scaleX(${pct.toFixed(4)})`; progress.setAttribute('aria-valuenow', Math.round(pct * 100));
      progress.setAttribute('aria-valuetext', `${Math.round(pct * 100)} %. ${(capT.textContent + (capA.hidden ? '' : capA.textContent)).trim()}`);
    }
    function tick() {
      raf = 0; target = frameFromScroll();
      if (document.visibilityState !== 'visible') cur = target; else cur += (target - cur) * 0.22;
      if (Math.abs(target - cur) < 0.05) cur = target;
      if (cur !== target) dir = target > cur ? 1 : -1;
      draw(); ui_();
      if (cur !== target) raf = requestAnimationFrame(tick);
    }
    const kick = () => { if (!raf && !stopped) raf = requestAnimationFrame(tick); };
    function goFrame(f, smooth) { scrollTo({ top: scrollOfFrame(f), behavior: smooth && !RM.matches ? 'smooth' : 'auto' }); }

    const setH = () => { tour.style.setProperty('--rf-total', total); };
    setH();
    const bind = (t, ev, fn, opt) => { t.addEventListener(ev, fn, opt); tcl.push(() => t.removeEventListener(ev, fn, opt)); };
    const tcl = [];
    bind(window, 'scroll', kick, { passive: true });
    bind(window, 'resize', () => { size(); kick(); });
    bind(document, 'visibilitychange', kick);
    const redraw = () => draw(true);
    const mq = matchMedia('(prefers-color-scheme: dark)'); bind(mq, 'change', redraw);
    const mo = new MutationObserver(redraw); mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    stBtns.forEach((li) => bind(li.firstChild, 'click', () => goFrame(+li.firstChild.dataset.f, true)));
    stopLis.forEach((li, k) => bind(li.firstChild, 'focus', () => { const s = stops[k]; // diferido: el navegador desplaza el foco hacia el panel después del evento
      setTimeout(() => { if (!stopped && !(cur >= s.desde && cur <= s.hasta)) goFrame(mid([0, 0, s.desde, s.hasta]), false); }, 30); }));
    // depuración / verificación
    window.__recorrido = { ok: true, N, total, lite, frame: () => Math.round(cur), loaded: () => loaded, goal, goFrame: (f) => { goFrame(f, false); cur = target = f; draw(true); ui_(); } };

    size(); pump(); target = cur = frameFromScroll(); draw(true); ui_(); prog();
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); tcl.forEach((f) => f()); mo.disconnect(); imgs.length = 0; slot.replaceChildren(); delete window.__recorrido; };
  }

  function mount() {
    teardown(); window.scrollTo(0, 0);
    teardown = RM.matches ? buildStatic() : buildTour();
    el.classList.toggle('rf-is-static', RM.matches);
  }
  mount();
  const onRM = () => { if (!dead) mount(); };
  RM.addEventListener('change', onRM); cleanups.push(() => RM.removeEventListener('change', onRM));

  let lastY = scrollY;
  on(window, 'scroll', () => { if (/^#\/recorrido/.test(location.hash)) lastY = scrollY; }, { passive: true });
  on(el, 'click', (e) => { if (e.target.closest && e.target.closest('a[href^="#/leccion/"]')) lastY = scrollY; }, true); // no depender de que el evento scroll ya haya corrido
  if (resume && !RM.matches) { // el router lleva el scroll a 0 después de render: restaurar recién entonces
    const y = resume.y; resume = null;
    const t = setTimeout(() => { if (!dead) scrollTo(0, y); }, 80);
    cleanups.push(() => clearTimeout(t));
  }

  return () => {
    if (/^#\/leccion\//.test(location.hash)) resume = { y: lastY, dest: location.hash };
    dead = true; cleanups.forEach((f) => f()); teardown();
  };
}
