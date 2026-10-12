// Recorrido 3D por scroll (#/recorrido). El contenido (tarjetas, lecciones, índice) y el minimapa funcionan sin WebGL;
// three.js y la escena se descargan recién acá (import dinámico) y, si fallan, queda la lista de lecciones.
import { h, svg as svgEl } from '../lib/dom.js';
import { STATIONS, ROAD, ROAD2, NK, clamp, ease, camTarget } from '../lib/recorrido-datos.js';

const THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.170.0/three.module.min.js';
const NS = 'http://www.w3.org/2000/svg';

function webglOK() {
  try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch { return false; }
}

// Posición de scroll al salir hacia una lección: al volver atrás se retoma (en memoria; se descarta si se navega a otra cosa).
let resume = null;
addEventListener('hashchange', () => { if (resume && location.hash !== resume.dest && !/^#\/recorrido/.test(location.hash)) resume = null; });

export function render(el, ctx) {
  const { ui, model } = ctx;
  const R = ui.recorrido;
  ctx.setTitle(R.title);

  const qs = new URLSearchParams(location.search), hq = new URLSearchParams(location.hash.split('?')[1] || '');
  const flag = (k) => qs.has(k) || hq.has(k); // ?nowebgl simula sin WebGL; ?sombras activa sombras en escritorio
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const cleanups = [];
  const on = (t, ev, fn, opt) => { t.addEventListener(ev, fn, opt); cleanups.push(() => t.removeEventListener(ev, fn, opt)); };
  let dead = false, scene = null, fell = false;

  // Estaciones con las lecciones que existen en los datos (título completo sale de content.json)
  const stations = R.stations.map((s) => ({ ...s, items: s.lessons.map(([id, short]) => ({ id, short, l: model.lessonsById.get(id) })).filter((x) => x.l) }));
  const total = stations.reduce((n, s) => n + s.items.length, 0);
  const fill = (t) => t.replace('{stations}', stations.length).replace('{lessons}', total);

  const lessonList = (s) => h('ol', { class: 'rc-lessons' }, s.items.map((it, i) => h('li', null,
    h('a', { href: `#/leccion/${it.id}`, 'data-id': it.id },
      h('span', { class: 'rc-num', 'aria-hidden': 'true' }, String(i + 1)),
      h('span', { class: 'rc-short' }, it.short),
      h('span', { class: 'rc-full' }, h('span', { class: 'vh' }, ': '), it.l.titulo)))));

  const goto = (id, label) => h('a', { class: label.cls, href: '#/recorrido', 'data-goto': id }, label.text);

  const stationStep = (s, i) => h('section', { class: 'rc-step rc-station', id: `rc-est-${s.id}`, 'data-st': i, 'aria-labelledby': `rc-t-${s.id}` },
    h('div', { class: 'rc-card' },
      h('p', { class: 'rc-kicker' }, `${R.stationWord} ${i + 1} · ${s.kicker}`),
      h('h2', { id: `rc-t-${s.id}` }, s.title),
      h('p', { class: 'rc-lead' }, s.lead),
      lessonList(s),
      h('p', { class: 'rc-hint' }, s.hint)));

  const fb = R.fallback;
  const stage = h('div', { class: 'rc-stage' },
    h('canvas', { class: 'rc-gl', 'aria-hidden': 'true' }),
    h('div', { class: 'rc-pins', 'aria-hidden': 'true' }),
    h('p', { class: 'rc-loading', 'aria-hidden': 'true' }, R.loading),
    h('p', { class: 'rc-fallback', role: 'status' }, fb[0], h('a', { href: '#/recorrido', 'data-goto': 'rc-indice' }, fb[1]), fb[2]));

  const map = h('nav', { class: 'rc-map', 'aria-label': R.mapAria },
    svgEl('<svg class="rc-map-svg" viewBox="-16 -36 112 50" aria-hidden="true" focusable="false"></svg>'),
    h('ol', { class: 'rc-map-list' }, stations.map((s) => h('li', null,
      h('a', { href: '#/recorrido', 'data-goto': `rc-est-${s.id}` }, h('span', { class: 'rc-dot', 'aria-hidden': 'true' }), s.map)))),
    h('div', { class: 'rc-track' }, h('span', { class: 'rc-fill' })));

  const tour = h('div', { class: 'rc-tour' },
    h('a', { class: 'rc-skip', href: '#/recorrido', 'data-goto': 'rc-indice' }, R.skip),
    map, stage,
    h('div', { class: 'rc-steps' },
      h('section', { class: 'rc-step rc-step--intro', 'aria-labelledby': 'rc-t-intro' },
        h('div', { class: 'rc-card' },
          h('p', { class: 'rc-kicker' }, R.intro.kicker),
          h('h1', { id: 'rc-t-intro' }, R.intro.title),
          h('p', { class: 'rc-lead' }, R.intro.lead),
          h('div', { class: 'rc-btns' },
            goto(stations[0] ? `rc-est-${stations[0].id}` : 'rc-indice', { cls: 'btn btn-primary', text: R.intro.start }),
            goto('rc-indice', { cls: 'btn', text: R.intro.all })),
          h('ul', { class: 'rc-chips', 'aria-label': R.intro.chipsAria }, R.intro.chips.map((c) => h('li', { class: 'rc-chip' }, fill(c)))),
          h('p', { class: 'rc-hint' }, R.intro.hint))),
      stations.map(stationStep),
      h('section', { class: 'rc-step rc-step--outro', 'aria-labelledby': 'rc-t-fin' },
        h('div', { class: 'rc-card' },
          h('p', { class: 'rc-kicker' }, R.outro.kicker),
          h('h2', { id: 'rc-t-fin' }, R.outro.title),
          h('p', { class: 'rc-lead' }, R.outro.lead),
          h('div', { class: 'rc-btns' },
            h('a', { class: 'btn btn-primary', href: '#/' }, R.outro.site),
            goto('rc-top', { cls: 'btn', text: R.outro.top }))))));

  const indice = h('section', { class: 'rc-indice wrap', id: 'rc-indice', tabindex: '-1', 'aria-labelledby': 'rc-indice-t' },
    h('h2', { id: 'rc-indice-t' }, R.index.title), h('p', null, R.index.text),
    h('div', { class: 'rc-indice-grid' }, stations.map((s) => h('div', null,
      h('h3', null, s.title),
      h('ol', { class: 'rc-indice-list' }, s.items.map((it) => h('li', null, h('a', { href: `#/leccion/${it.id}` }, it.l.titulo))))))));

  el.replaceChildren(tour, indice);

  /* ---------- Anclas internas (el hash lo usa el router: nada de #id) ---------- */
  on(el, 'click', (e) => {
    const a = e.target.closest && e.target.closest('[data-goto]');
    if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    const behavior = RM.matches ? 'auto' : 'smooth';
    const id = a.dataset.goto;
    if (id === 'rc-top') { scrollTo({ top: 0, behavior }); return; }
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ behavior, block: 'start' });
    if (id === 'rc-indice') target.focus({ preventScroll: true });
  });

  /* ---------- Estado del scroll ---------- */
  const steps = Array.from(tour.querySelectorAll('.rc-step'));
  const mmLinks = Array.from(map.querySelectorAll('.rc-map-list a'));
  const mmFill = map.querySelector('.rc-fill');
  const svg = map.querySelector('svg');
  let vh = innerHeight, tops = [], tourEnd = 0, active = -1, focusSt = -1;
  function measure() {
    vh = innerHeight;
    tops = steps.map((n) => n.getBoundingClientRect().top + scrollY);
    tops.push(steps[steps.length - 1].getBoundingClientRect().bottom + scrollY);
    tourEnd = tops[tops.length - 1];
  }
  function gNow() { // posición continua: 0 = intro, 1..3 = estaciones, 4 = cierre
    const s = scrollY + vh * 0.5;
    if (s <= tops[0]) return 0;
    for (let i = 0; i < steps.length; i++) if (s < tops[i + 1]) return i + (s - tops[i]) / (tops[i + 1] - tops[i]);
    return steps.length - 1 + 0.999;
  }
  function camParam(g) { // viaje centrado en el límite entre pasos; quieto en el medio de cada estación
    if (RM.matches) return clamp(Math.floor(g + 0.35), 0, NK);
    const k = g + 0.35, i = Math.floor(k), fr = k - i;
    return clamp(fr < 0.5 ? i - 1 + ease(fr / 0.5) : i, 0, NK);
  }
  function explodeAt(g, st) { // 0..1 para la estación st (paso st+1)
    const k = st + 1;
    if (RM.matches) return Math.floor(g + 0.35) === k ? 1 : 0;
    const l = g - k;
    if (l < 0.15 || l > 0.68) return 0;
    if (l < 0.3) return ease((l - 0.15) / 0.15);
    if (l > 0.56) return ease(1 - (l - 0.56) / 0.12);
    return 1;
  }

  /* Minimapa: vista desde arriba con las mismas coordenadas que la escena */
  const mk = (tag, at) => { const n = document.createElementNS(NS, tag); for (const k in at) n.setAttribute(k, at[k]); svg.appendChild(n); return n; };
  mk('polyline', { class: 'rc-mm-road', points: ROAD.map((p) => p.join(',')).join(' ') });
  mk('polyline', { class: 'rc-mm-road', points: ROAD2.map((p) => [Math.min(p[0], 96), p[1]].join(',')).join(' ') });
  const mmSt = STATIONS.map((s) => mk('rect', { class: 'rc-mm-st', x: s.x - s.w / 2, y: s.z - s.d / 2, width: s.w, height: s.d, rx: 1 }));
  const mmMk = mk('circle', { class: 'rc-mm-mk', r: 3, cx: 0, cy: 0 });

  function setActive(i) {
    if (i === active) return; active = i;
    mmLinks.forEach((a, k) => { if (k === i) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current'); });
    mmSt.forEach((r, k) => r.classList.toggle('is-on', k === i));
  }
  const state = { g: 0, p: 0, ex: [0, 0, 0] };
  function onScroll() {
    if (!tops.length) return;
    const g = gNow(); state.g = g;
    let p = camParam(g);
    if (focusSt >= 0) p = focusSt + 1;
    state.p = p;
    state.ex = [0, 1, 2].map((s) => (focusSt === s ? Math.max(explodeAt(g, s), RM.matches ? 1 : 0) : explodeAt(g, s)));
    const t = camTarget(p); mmMk.setAttribute('cx', t[0].toFixed(1)); mmMk.setAttribute('cy', t[2].toFixed(1));
    if (mmFill) mmFill.style.transform = `scaleX(${clamp(g / NK).toFixed(3)})`;
    const near = Math.round(p) - 1; setActive(near >= 0 && near <= 2 && Math.abs(p - Math.round(p)) < 0.3 ? near : -1);
    // El minimapa solo se muestra mientras el escenario está fijo en pantalla
    map.classList.toggle('is-off', fell || scrollY < tops[0] - 2 || scrollY + vh * 0.6 > tourEnd);
    if (scene) scene.kick();
  }

  /* Resaltado lista <-> punto; el foco de teclado lleva la cámara a la estación (se suelta al usar rueda, dedo o teclas de scroll) */
  const hot = (id, v) => el.querySelectorAll(`[data-id="${id}"]`).forEach((n) => n.classList.toggle('is-hot', v));
  on(el, 'pointerover', (e) => { const a = e.target.closest && e.target.closest('[data-id]'); if (a) hot(a.dataset.id, true); });
  on(el, 'pointerout', (e) => { const a = e.target.closest && e.target.closest('[data-id]'); if (a) hot(a.dataset.id, false); });
  on(el, 'focusin', (e) => {
    const a = e.target.closest && e.target.closest('.rc-lessons [data-id]'); if (a) hot(a.dataset.id, true);
    const sec = e.target.closest && e.target.closest('.rc-station'); focusSt = sec ? +sec.dataset.st : -1; onScroll();
  });
  on(el, 'focusout', (e) => {
    const a = e.target.closest && e.target.closest('.rc-lessons [data-id]'); if (a) hot(a.dataset.id, false);
    focusSt = -1; requestAnimationFrame(onScroll);
  });
  const release = () => { if (focusSt >= 0) { focusSt = -1; onScroll(); } };
  on(window, 'wheel', release, { passive: true });
  on(window, 'touchmove', release, { passive: true });
  on(window, 'keydown', (e) => { if ([' ', 'PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown'].includes(e.key) && !e.target.closest('input,select,textarea')) release(); });

  measure(); onScroll();
  on(window, 'scroll', onScroll, { passive: true });
  let lastY = scrollY; // solo mientras la URL es la del recorrido (ignora el scroll que restaura el navegador al cambiar de entrada)
  on(window, 'scroll', () => { if (/^#\/recorrido/.test(location.hash)) lastY = scrollY; }, { passive: true });
  on(window, 'resize', () => { measure(); onScroll(); });
  RM.addEventListener('change', onScroll); cleanups.push(() => RM.removeEventListener('change', onScroll));
  if (typeof ResizeObserver === 'function') { // el alto cambia al cargar las tipografías o al girar el teléfono
    const ro = new ResizeObserver(() => { measure(); onScroll(); }); ro.observe(tour); cleanups.push(() => ro.disconnect());
  }

  /* ---------- Escena 3D (carga diferida) ---------- */
  function fallback(why) {
    fell = true; tour.classList.add('is-fallback'); stage.classList.add('is-fallback');
    window.__recorrido = { ok: false, why }; measure(); onScroll();
  }
  // Si el navegador pierde el contexto WebGL (GPU reiniciada, demasiadas pestañas), pasar a la lista en vez de quedar en blanco
  on(stage.querySelector('.rc-gl'), 'webglcontextlost', () => {
    if (dead || fell) return;
    if (scene) scene.dispose();
    scene = null; fallback('se perdió el contexto WebGL');
  });
  (async () => {
    if (flag('nowebgl') || !webglOK()) { fallback('sin WebGL'); return; }
    try {
      const THREE = await import(THREE_URL);
      if (dead) return;
      const { createScene } = await import('../lib/recorrido-escena.js');
      if (dead) return;
      // los letreros de la escena usan Barlow Condensed: esperar un poco a que esté lista
      await Promise.race([document.fonts && document.fonts.load ? document.fonts.load('700 64px "Barlow Condensed"') : null, new Promise((r) => setTimeout(r, 1500))]).catch(() => {});
      if (dead) return;
      scene = createScene(THREE, {
        root: el, tour, stage, canvas: stage.querySelector('.rc-gl'), pinsBox: stage.querySelector('.rc-pins'),
        state, RM, labels: R.labels, signs: R.signs, shadows: flag('sombras')
      });
      window.__recorrido = { ok: true, ...scene };
    } catch (e) {
      console.warn('Recorrido 3D:', e);
      if (!dead) fallback('no se pudo armar la escena');
    }
  })();

  if (resume) { // el router lleva el scroll a 0 después de render: restaurar recién entonces
    const y = resume.y; resume = null;
    const t = setTimeout(() => { if (dead) return; scrollTo(0, y); measure(); onScroll(); if (scene) scene.sync(); }, 80);
    cleanups.push(() => clearTimeout(t));
  }

  return () => {
    // lastY y no scrollY: con atrás/adelante el navegador ya movió el scroll al de la otra entrada antes de este cleanup
    if (/^#\/leccion\//.test(location.hash)) resume = { y: lastY, dest: location.hash };
    dead = true;
    cleanups.forEach((f) => f());
    if (scene) scene.dispose();
    scene = null;
    delete window.__recorrido;
  };
}
