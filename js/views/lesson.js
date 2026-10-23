import { h, svg } from '../lib/dom.js?v=8';
import { makeHighlighter, plural } from '../lib/text.js?v=8';
import { ico, MODULE_ICONS } from '../lib/icons.js?v=8';
import { lessonPos } from '../lib/model.js?v=8';
import { gauge, safetyBox, manualBox, listBox, despiece } from '../lib/components.js?v=8';
import { buildStops, FRAME_URL as FR } from '../lib/recorrido-paradas.js?v=9';
import { diagramFor } from '../lib/diagrams.js?v=8';

function srcItem(f, s) {
  const texto = typeof f === 'string' ? f : f.texto;
  const url = typeof f === 'string' ? '' : f.url;
  if (!url) return texto;
  return h('a', { href: url, target: '_blank', rel: 'noopener noreferrer', 'aria-label': `${texto} ${s.newTab}` }, texto);
}

function sourcesBlock(l, ui) {
  const s = ui.sources;
  if (!s || (!l.verificado && !l.notaFuentes && !(l.fuentes && l.fuentes.length))) return null;
  let date = l.verificado;
  const m = /^(\d{4})-(\d{2})$/.exec(l.verificado || '');
  if (m && s.months[+m[2] - 1]) date = s.date.replace('{month}', s.months[+m[2] - 1]).replace('{year}', m[1]);
  return h('section', { class: 'sources l-sec', id: 'src', tabindex: '-1', 'aria-labelledby': 'src-t' },
    h('h2', { id: 'src-t' }, s.title),
    l.fuentes && l.fuentes.length ? h('ul', null, l.fuentes.map((f) => h('li', null, srcItem(f, s)))) : null,
    date ? h('p', { class: 'sources-date' }, s.verified.replace('{date}', date)) : null,
    l.notaFuentes ? h('p', { class: 'sources-date' }, l.notaFuentes) : null);
}

export function render(el, ctx) {
  const { ui, model, params } = ctx;
  const l = model.lessonsById.get(params[0]);
  if (!l) return ctx.notFound(el);
  ctx.setTitle(l.titulo);
  const { module: mod, idx, prev, next } = lessonPos(model, l);
  const cleanups = [];

  // Términos del glosario resaltados (solo la primera aparición en el cuerpo)
  const terms = (l.glosario || []).map((id) => model.termsById.get(id)).filter(Boolean);
  const hl = makeHighlighter(terms, (t, txt) =>
    h('a', { class: 'term', href: `#/glosario/${t.id}`, 'data-term': t.id }, txt));

  const stop = buildStops(ctx).find((s) => s.id === l.id);
  const code = mod ? `${ui.module.code}-${String(mod.n).padStart(2, '0')}` : '';
  const diagram = diagramFor(l.id, ui);
  if (diagram) cleanups.push(diagram.cleanup);

  // Secciones numeradas (01…); cada h2 con id alimenta el índice fijo. Se resaltan antes que los pasos: el enlace cae en la primera aparición visible.
  const toc = [];
  const pad2 = (n) => String(n).padStart(2, '0');
  const sec = (key, title, body, code) => {
    const id = `s-${key}`; toc.push([id, title]);
    return h('section', { class: 'l-sec', 'aria-labelledby': id }, h('h2', { id, tabindex: '-1' }, code ? h('span', { class: 'code' }, code) : null, title), body);
  };
  const secs = (l.secciones || []).map((s, i) => sec(`c${i}`, s.titulo, h('p', null, hl(s.texto)), pad2(i + 1)));
  const steps = l.pasos?.length
    ? sec('pasos', ui.labels.steps, h('ol', { class: 'steps' }, l.pasos.map((p) => h('li', null, h('span', null, hl(p))))))
    : null;

  if (diagram && l.id === 'motor-4-tiempos' && steps) {
    const lis = steps.querySelectorAll('li');
    diagram.el.addEventListener('cyclechange', (e) => lis.forEach((li, i) => li.classList.toggle('on', i === e.detail)));
  }

  const mant = l.mantenimiento && sec('mant', ui.lesson.maintenance,
    h('dl', { class: 'spec' },
      h('div', null, h('dt', null, ui.labels.frequency), h('dd', null, l.mantenimiento.frecuencia)),
      h('div', null, h('dt', null, ui.labels.beginnerCan), h('dd', null, l.mantenimiento.principiante)),
      h('div', null, h('dt', null, ui.labels.mechanicWhen), h('dd', null, l.mantenimiento.profesional))));

  const dg = l.diagnostico && sec('diag', ui.lesson.diagnosis, [
    h('h3', { class: 'cartel' }, ui.labels.probableCauses), h('ul', { class: 'plain-list' }, l.diagnostico.causasProbables.map((t) => h('li', null, t))),
    h('h3', { class: 'cartel' }, ui.labels.checkFirst), h('ul', { class: 'plain-list' }, l.diagnostico.revisarPrimero.map((t) => h('li', null, t))),
    listBox('stop', ui.labels.stopAndCall, [l.diagnostico.pararYLlamar])]);

  const tips = l.tips?.length ? sec('tips', ui.labels.tips, h('ul', { class: 'plain-list' }, l.tips.map((t) => h('li', null, t)))) : null;
  const errs = l.erroresComunes?.length ? sec('err', ui.labels.commonMistakes, h('ul', { class: 'plain-list' }, l.erroresComunes.map((t) => h('li', null, t)))) : null;
  const src = sourcesBlock(l, ui);
  if (src) toc.push(['src', ui.sources.title]);

  const related = (l.relacionados || []).map((id) => model.lessonsById.get(id)).filter(Boolean);
  const mm = (x) => { const m = model.modulesById.get(x.modulo); return `${ui.module.code}-${String(m.n).padStart(2, '0')}`; };
  const L = ui.lesson, nSrc = (l.fuentes || []).length, nTerms = terms.length;

  // Encabezado: rótulo-cartel del módulo + nivel, h1 display, resumen en serif, metadatos mono
  const head = h('header', { class: 'wrap l-head' },
    h('p', { class: 'crumbs' },
      h('a', { href: '#/' }, ui.nav.home), ' / ',
      mod ? h('a', { href: `#/modulo/${mod.id}` }, `${code} ${mod.title}`) : null, ' / ',
      h('span', { 'aria-current': 'page' }, `${L.code}-${pad2(idx + 1)}`)),
    h('p', { class: 'eyebrow' }, mod ? h('span', { class: 'cartel' }, mod.title) : null, h('span', { class: 'lesson-meta' }, gauge(l.nivel, ui))),
    h('h1', { id: 'l-t' }, l.titulo),
    h('p', { class: 'summary' }, l.resumen),
    h('p', { class: 'meta code' },
      l.verificado ? h('span', null, L.verifiedShort.replace('{date}', l.verificado)) : null,
      nSrc ? h('span', null, plural(nSrc, L.sourcesCount)) : null,
      nTerms ? h('span', null, plural(nTerms, ui.sheet.terms)) : null));

  // Lámina 21:9 con el fotograma real de su parada (las lecciones sin parada llevan el ícono del módulo)
  const fig = stop
    ? h('figure', { class: 'l-fig', style: `--st:var(${stop.cvar})` },
      h('div', { class: 'plate' }, h('img', { src: FR(stop.mid), width: 1920, height: 1080, decoding: 'async', fetchpriority: 'high',
        alt: ui.recorrido.cont.imgAlt.replace('{station}', stop.name).replace('{lesson}', l.titulo) })),
      h('figcaption', null,
        h('span', { class: 'code cap' }, h('span', { class: 'swatch', 'aria-hidden': 'true' }), ui.tour.stopCode.replace('{station}', stop.short).replace('{n}', pad2(stop.k + 1)).replace('{total}', stop.total)),
        h('a', { class: 'btn', href: `#/?parada=${stop.k + 1}` }, ico('route'), L.seeInTour)))
    : (mod ? h('figure', { class: 'l-fig l-fig--mod' },
      h('div', { class: 'plate', 'aria-hidden': 'true' }, h('span', { class: 'ico-lg' }, svg(MODULE_ICONS[mod.id] || MODULE_ICONS.glosario)), h('span', { class: 'cartel' }, mod.title))) : null);

  const prose = h('div', { class: 'prose' },
    safetyBox(l.seguridad, ui), manualBox(l.verificarEnManual, ui), diagram?.el,
    secs, steps, mant, dg, tips, errs, src);

  const side = h('aside', { class: 'side', 'aria-label': L.aside },
    despiece(l.glosario || [], { model, ui, level: 'h2', title: ui.sheet.lessonPartsTitle, note: ui.sheet.lessonPartsNote }),
    related.length ? h('section', { 'aria-labelledby': 'rl' }, h('h2', { id: 'rl', class: 'cartel' }, ui.labels.related),
      h('ul', { class: 'related' }, related.map((r) => h('li', null, h('a', { href: `#/leccion/${r.id}` }, h('span', null, r.titulo), h('small', null, `${mm(r)} · ${L.code}-${pad2(model.modulesById.get(r.modulo).lessons.indexOf(r) + 1)}`)))))) : null,
    mod ? h('section', { 'aria-labelledby': 'im' }, h('h2', { id: 'im', class: 'cartel' }, ui.labels.inModule),
      h('ul', { class: 'related' }, mod.lessons.map((r) => h('li', null,
        h('a', Object.assign({ href: `#/leccion/${r.id}` }, r === l ? { 'aria-current': 'page' } : {}), h('span', null, r.titulo)))))) : null);

  const tocEl = toc.length > 1 ? h('nav', { class: 'toc', 'aria-label': L.toc }, h('p', { class: 'cartel' }, L.toc),
    h('ol', null, toc.map(([id, t]) => h('li', null, h('a', { href: `#/leccion/${l.id}`, 'data-to': id }, t))))) : h('div', { class: 'toc' });

  const pager = h('nav', { class: 'wrap pager', 'aria-label': L.pagerAria },
    prev ? h('a', { class: 'prev', href: `#/leccion/${prev.id}`, rel: 'prev' }, h('small', null, `← ${ui.labels.prevLesson}`), h('strong', null, prev.titulo)) : h('span'),
    next ? h('a', { class: 'next', href: `#/leccion/${next.id}`, rel: 'next' }, h('small', null, `${ui.labels.nextLesson} →`), h('strong', null, next.titulo)) : null);

  const article = h('article', { class: 'lesson' }, head, fig, h('div', { class: 'wrap l-grid' }, tocEl, prose, side), pager);
  el.replaceChildren(article);
  const rm = matchMedia('(prefers-reduced-motion: reduce)');
  const toTarget = (e) => {
    const a = e.target.closest('[data-to]'); if (!a) return;
    e.preventDefault();
    const t = document.getElementById(a.dataset.to); if (!t) return;
    t.scrollIntoView({ behavior: rm.matches ? 'auto' : 'smooth', block: 'start' });
    t.focus({ preventScroll: true });
  };
  article.addEventListener('click', toTarget);
  cleanups.push(() => article.removeEventListener('click', toTarget));
  // Índice fijo: marca la sección visible (aria-current="location")
  if (toc.length > 1 && 'IntersectionObserver' in window) {
    const links = new Map(toc.map(([id]) => [id, tocEl.querySelector(`[data-to="${id}"]`)]));
    const io = new IntersectionObserver((es) => es.forEach((en) => {
      if (!en.isIntersecting) return;
      links.forEach((a) => a.removeAttribute('aria-current'));
      links.get(en.target.id)?.setAttribute('aria-current', 'location');
    }), { rootMargin: '-96px 0px -65% 0px' });
    toc.forEach(([id]) => { const n = document.getElementById(id); if (n) io.observe(n); });
    cleanups.push(() => io.disconnect());
  }

  // Tooltip con la definición (hover / foco; Esc lo cierra)
  let tip = null;
  const hide = () => { if (tip) { tip.remove(); tip = null; } };
  const show = (a) => {
    hide();
    const t = model.termsById.get(a.dataset.term);
    if (!t) return;
    tip = h('div', { class: 'tooltip', role: 'tooltip', id: 'tt' }, h('b', null, t.termino), t.definicion);
    document.body.append(tip);
    a.setAttribute('aria-describedby', 'tt');
    const r = a.getBoundingClientRect(), w = tip.offsetWidth, hh = tip.offsetHeight;
    let x = Math.min(Math.max(8, r.left), window.innerWidth - w - 8);
    let y = r.bottom + 6;
    if (y + hh > window.innerHeight - 8) y = Math.max(8, r.top - hh - 6);
    tip.style.left = `${x}px`; tip.style.top = `${y}px`;
  };
  const onIn = (e) => { const a = e.target.closest?.('a.term'); if (a) show(a); };
  const onOut = (e) => { const a = e.target.closest?.('a.term'); if (a) { a.removeAttribute('aria-describedby'); hide(); } };
  const onKey = (e) => { if (e.key === 'Escape') hide(); };
  article.addEventListener('mouseover', onIn); article.addEventListener('mouseout', onOut);
  article.addEventListener('focusin', onIn); article.addEventListener('focusout', onOut);
  document.addEventListener('keydown', onKey);
  cleanups.push(hide, () => document.removeEventListener('keydown', onKey));
  return () => cleanups.forEach((f) => f());
}
