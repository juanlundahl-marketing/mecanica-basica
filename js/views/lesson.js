import { h } from '../lib/dom.js';
import { makeHighlighter } from '../lib/text.js';
import { lessonPos } from '../lib/model.js';
import { gauge, safetyBox, manualBox, listBox, lamp } from '../lib/components.js';
import { diagramFor } from '../lib/diagrams.js';

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
  return h('section', { class: 'sources', 'aria-labelledby': 'src' },
    h('h2', { id: 'src' }, s.title),
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

  const code = mod ? `${ui.module.code}-${String(mod.n).padStart(2, '0')}` : '';
  const diagram = diagramFor(l.id, ui);
  if (diagram) cleanups.push(diagram.cleanup);

  // Las secciones se resaltan antes que los pasos: así el enlace cae en la primera aparición visible.
  const secs = (l.secciones || []).map((s) => h('section', null, h('h2', null, s.titulo), h('p', null, hl(s.texto))));
  const steps = l.pasos?.length
    ? h('section', { 'aria-labelledby': 'st' }, h('h2', { id: 'st' }, ui.labels.steps),
      h('ol', { class: 'steps' }, l.pasos.map((p) => h('li', null, h('span', null, hl(p))))))
    : null;

  if (diagram && l.id === 'motor-4-tiempos' && steps) {
    const lis = steps.querySelectorAll('li');
    diagram.el.addEventListener('cyclechange', (e) => lis.forEach((li, i) => li.classList.toggle('on', i === e.detail)));
  }

  const mant = l.mantenimiento && h('section', { 'aria-labelledby': 'mt' },
    h('h2', { id: 'mt' }, ui.lesson.maintenance),
    h('dl', { class: 'spec' },
      h('div', null, h('dt', null, ui.labels.frequency), h('dd', null, l.mantenimiento.frecuencia)),
      h('div', null, h('dt', null, ui.labels.beginnerCan), h('dd', null, l.mantenimiento.principiante)),
      h('div', null, h('dt', null, ui.labels.mechanicWhen), h('dd', null, l.mantenimiento.profesional))));

  const dg = l.diagnostico && h('section', { 'aria-labelledby': 'dg' },
    h('h2', { id: 'dg' }, ui.lesson.diagnosis),
    h('h3', null, ui.labels.probableCauses), h('ul', { class: 'plain-list' }, l.diagnostico.causasProbables.map((t) => h('li', null, t))),
    h('h3', null, ui.labels.checkFirst), h('ul', { class: 'plain-list' }, l.diagnostico.revisarPrimero.map((t) => h('li', null, t))),
    listBox('stop', ui.labels.stopAndCall, [l.diagnostico.pararYLlamar]));

  const related = (l.relacionados || []).map((id) => model.lessonsById.get(id)).filter(Boolean);
  const mm = (x) => { const m = model.modulesById.get(x.modulo); return `${ui.module.code}-${String(m.n).padStart(2, '0')}`; };

  const article = h('article', null,
    h('p', { class: 'crumbs' },
      h('a', { href: '#/' }, ui.nav.home), ' / ',
      mod ? h('a', { href: `#/modulo/${mod.id}` }, `${code} ${mod.title}`) : null, ' / ',
      h('span', { 'aria-current': 'page' }, `${ui.lesson.code}-${String(idx + 1).padStart(2, '0')}`)),
    h('h1', null, l.titulo),
    h('div', { class: 'lesson-meta' }, gauge(l.nivel, ui)),
    h('p', { class: 'summary' }, l.resumen),
    safetyBox(l.seguridad, ui),
    manualBox(l.verificarEnManual, ui),
    diagram?.el,
    secs,
    steps, mant, dg,
    listBox('tip', ui.labels.tips, l.tips, lamp()),
    listBox('mistakes', ui.labels.commonMistakes, l.erroresComunes),
    terms.length ? h('section', { 'aria-labelledby': 'gl' }, h('h2', { id: 'gl' }, ui.labels.glossaryTerms),
      h('p', null, terms.map((t) => h('a', { class: 'chip', href: `#/glosario/${t.id}` }, t.termino)))) : null,
    sourcesBlock(l, ui),
    h('nav', { class: 'pager', 'aria-label': ui.lesson.aside },
      prev ? h('a', { class: 'prev', href: `#/leccion/${prev.id}`, rel: 'prev' }, h('small', null, `← ${ui.labels.prevLesson}`), h('strong', null, prev.titulo)) : h('span'),
      next ? h('a', { class: 'next', href: `#/leccion/${next.id}`, rel: 'next' }, h('small', null, `${ui.labels.nextLesson} →`), h('strong', null, next.titulo)) : null));

  const aside = h('aside', { 'aria-label': ui.lesson.aside },
    related.length ? h('section', { 'aria-labelledby': 'rl' }, h('h2', { id: 'rl' }, ui.labels.related),
      h('ul', { class: 'related' }, related.map((r) => h('li', null,
        h('a', { href: `#/leccion/${r.id}` }, h('span', null, r.titulo), h('small', null, `${mm(r)} · ${ui.lesson.code}-${String(model.modulesById.get(r.modulo).lessons.indexOf(r) + 1).padStart(2, '0')}`)))))) : null,
    mod ? h('section', { 'aria-labelledby': 'im' }, h('h2', { id: 'im' }, ui.labels.inModule),
      h('ul', { class: 'related' }, mod.lessons.map((r) => h('li', null,
        h('a', Object.assign({ href: `#/leccion/${r.id}` }, r === l ? { 'aria-current': 'page' } : {}), h('span', null, r.titulo)))))) : null);

  el.replaceChildren(h('div', { class: 'wrap view' }, h('div', { class: 'lesson' }, article, aside)));

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
