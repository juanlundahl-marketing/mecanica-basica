import { h } from '../lib/dom.js?v=6';
import { search } from '../lib/model.js?v=6';
import { plural } from '../lib/text.js?v=6';

/** Lista agrupada de resultados; la usan el panel del buscador y la vista completa. */
export function resultGroups(res, ui, limit) {
  const groups = [['lessons', ui.search.groupLessons], ['diagnostic', ui.search.groupDiagnostic], ['glossary', ui.search.groupGlossary]];
  return groups.filter(([k]) => res[k].length).map(([k, label]) => {
    const items = limit ? res[k].slice(0, limit) : res[k];
    return h('section', { class: 'results-group' }, h('h3', null, `${label} (${res[k].length})`),
      h('ul', { class: 'results' }, items.map((r) => h('li', null,
        h('a', { href: r.href }, h('strong', null, r.title), h('small', null, r.sub.length > 140 ? `${r.sub.slice(0, 137)}…` : r.sub))))));
  });
}
export const totalOf = (res) => res.lessons.length + res.diagnostic.length + res.glossary.length;

export function render(el, ctx) {
  const { ui, model } = ctx;
  let q = ctx.params[0] || '';
  try { q = decodeURIComponent(q); } catch { /* ya decodificado */ }
  q = q.trim();
  ctx.setTitle(`${ui.search.pageTitle} «${q}»`);
  const res = search(model, q);
  const n = totalOf(res);
  el.replaceChildren(h('div', { class: 'wrap view search-view' },
    h('nav', { 'aria-label': ui.nav.home }, h('p', { class: 'crumbs' }, h('a', { href: '#/' }, ui.nav.home), ' / ', h('span', { 'aria-current': 'page' }, ui.search.results))),
    h('h1', null, `${ui.search.pageTitle} «${q}»`),
    h('p', { class: 'status', role: 'status' }, n ? plural(n, ui.search.count) : ui.search.noResults),
    resultGroups(res, ui)));
  return () => {};
}
