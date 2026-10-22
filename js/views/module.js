import { h, svg } from '../lib/dom.js?v=5';
import { MODULE_ICONS } from '../lib/icons.js?v=5';
import { gauge } from '../lib/components.js?v=5';

export function render(el, ctx) {
  const { ui, model, params } = ctx;
  const m = model.modulesById.get(params[0]);
  if (!m) return ctx.notFound(el);
  if (m.id === 'glosario') { ctx.go('#/glosario'); return () => {}; }
  ctx.setTitle(m.title);
  const code = `${ui.module.code}-${String(m.n).padStart(2, '0')}`;
  const root = h('div', { class: 'wrap view' },
    h('nav', { 'aria-label': ui.nav.modules }, h('p', { class: 'crumbs' },
      h('a', { href: '#/' }, ui.nav.home), ' / ', h('span', { 'aria-current': 'page' }, `${code} ${m.title}`))),
    h('header', { class: 'module-head' },
      h('span', { class: 'ico-lg' }, svg(MODULE_ICONS[m.id])),
      h('div', null, h('h1', null, m.title), h('p', null, m.description), gauge(m.nivel, ui))),
    m.id === 'diagnostico' ? h('div', { class: 'callout frame' }, h('p', null, ui.module.bySymptom),
      h('a', { class: 'btn btn-primary', href: '#/diagnostico' }, ui.module.bySymptomCta)) : null,
    m.lessons.length
      ? h('ol', { class: 'lesson-list' }, m.lessons.map((l, i) => h('li', null,
        h('a', { class: 'lesson-row frame', href: `#/leccion/${l.id}` },
          h('span', { class: 'num' }, `${ui.lesson.code}-${String(i + 1).padStart(2, '0')}`),
          h('div', null, h('h2', { style: 'font-size:1.35rem;margin:0 0 4px' }, l.titulo), h('p', null, l.resumen))))))
      : h('p', null, ui.module.empty));
  el.replaceChildren(root);
  return () => {};
}
