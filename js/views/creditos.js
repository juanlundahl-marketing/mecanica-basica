import { h } from '../lib/dom.js?v=5';

// Página de créditos: atribución CC BY 4.0 de los modelos 3D. Todo el texto sale de ui.credits.
export function render(el, ctx) {
  const C = ctx.ui.credits;
  ctx.setTitle(C.title);
  const link = (href, text) => h('a', { href, target: '_blank', rel: 'noopener noreferrer', 'aria-label': `${text} ${C.newTab}` }, text);
  el.replaceChildren(h('div', { class: 'wrap view credits' },
    h('h1', null, C.title),
    h('p', null, C.intro),
    h('section', { 'aria-labelledby': 'cr-models' },
      h('h2', { id: 'cr-models' }, C.modelsTitle),
      h('ul', { class: 'credits-list' }, C.models.map((m) => h('li', { class: 'credit' },
        h('h3', null, `«${m.title}»`),
        h('dl', null,
          h('dt', null, C.labels.author), h('dd', null, link(m.authorUrl, m.author)),
          h('dt', null, C.labels.source), h('dd', null, link(m.url, C.sourceLink)),
          h('dt', null, C.labels.license), h('dd', null, link(C.license.url, C.license.name)),
          h('dt', null, C.labels.changes), h('dd', null, m.changes)))))),
    h('section', { 'aria-labelledby': 'cr-cc0' },
      h('h2', { id: 'cr-cc0' }, C.cc0Title),
      h('p', null, C.cc0Intro),
      h('ul', { class: 'credits-cc0' }, C.cc0.map((r) => h('li', null, `${r.text} `, link(r.url, r.host))))),
    h('p', { class: 'credits-note' }, C.note)));
  return () => {};
}
