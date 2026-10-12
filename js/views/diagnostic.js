import { h } from '../lib/dom.js';
import { norm, plural, hasWordStart } from '../lib/text.js';

export function render(el, ctx) {
  const { ui, model } = ctx;
  ctx.setTitle(ui.diag.title);
  const items = model.lessons.filter((l) => l.diagnostico).map((l) => ({
    l, key: norm([l.titulo, l.resumen, ...l.diagnostico.causasProbables, ...l.diagnostico.revisarPrimero, l.diagnostico.pararYLlamar].join(' '))
  }));
  const status = h('p', { class: 'status', role: 'status', 'aria-live': 'polite' }, ui.diag.all);
  const input = h('input', { id: 'dg-q', type: 'search', placeholder: ui.diag.filterPlaceholder, autocomplete: 'off', enterkeyhint: 'search' });
  const list = h('ul', { class: 'symptoms' }, items.map(({ l }) => h('li', { class: 'symptom', id: `sy-${l.id}` },
    h('article', { 'aria-labelledby': `syt-${l.id}` },
      h('h2', { id: `syt-${l.id}` }, h('a', { href: `#/leccion/${l.id}` }, l.titulo)),
      h('ol', { class: 'flow' },
        h('li', { class: 'frame symptom-a' }, h('h3', null, `A · ${ui.diag.symptom}`), h('p', null, l.resumen),
          h('p', null, h('a', { href: `#/leccion/${l.id}` }, ui.diag.openLesson))),
        h('li', { class: 'frame' }, h('h3', null, `B · ${ui.labels.probableCauses}`), h('ul', null, l.diagnostico.causasProbables.map((t) => h('li', null, t)))),
        h('li', { class: 'frame' }, h('h3', null, `C · ${ui.labels.checkFirst}`), h('ul', null, l.diagnostico.revisarPrimero.map((t) => h('li', null, t)))),
        h('li', { class: 'frame go' }, h('h3', null, `D · ${ui.labels.stopAndCall}`), h('p', null, l.diagnostico.pararYLlamar)))))));
  const none = h('p', { hidden: true }, ui.diag.none);
  const apply = () => {
    const tk = norm(input.value).split(/\s+/).filter(Boolean);
    let n = 0;
    items.forEach(({ l, key }) => {
      const ok = tk.every((t) => hasWordStart(key, t));
      list.querySelector(`#sy-${l.id}`).hidden = !ok;
      if (ok) n++;
    });
    none.hidden = n > 0;
    status.textContent = !tk.length ? ui.diag.all : n ? plural(n, ui.diag.shown) : ui.diag.none;
  };
  input.addEventListener('input', apply);
  el.replaceChildren(h('div', { class: 'wrap view' },
    h('nav', { 'aria-label': ui.nav.home }, h('p', { class: 'crumbs' }, h('a', { href: '#/' }, ui.nav.home), ' / ', h('span', { 'aria-current': 'page' }, ui.diag.title))),
    h('p', { class: 'block-tag' }, `${ui.module.code}-04`),
    h('h1', null, ui.diag.title), h('p', null, ui.diag.intro),
    h('div', { class: 'filter' }, h('label', { class: 'label', for: 'dg-q' }, ui.diag.filter), input),
    status, list, none));
  return () => {};
}
