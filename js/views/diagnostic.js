import { h } from '../lib/dom.js?v=7';
import { norm, plural, hasWordStart } from '../lib/text.js?v=7';
import { disclosure } from '../lib/components.js?v=7';
import { ico } from '../lib/icons.js?v=7';

export function render(el, ctx) {
  const { ui, model } = ctx;
  ctx.setTitle(ui.diag.title);
  const items = model.lessons.filter((l) => l.diagnostico).map((l) => ({
    l, key: norm([l.titulo, l.resumen, ...l.diagnostico.causasProbables, ...l.diagnostico.revisarPrimero, l.diagnostico.pararYLlamar].join(' '))
  }));
  const status = h('p', { class: 'status code', role: 'status', 'aria-live': 'polite' }, ui.diag.all);
  const input = h('input', { id: 'dg-q', type: 'search', placeholder: ui.diag.filterPlaceholder, autocomplete: 'off', enterkeyhint: 'search' });
  // Cada síntoma es una fila del componente Despiece: el botón despliega causas, qué revisar y cuándo parar.
  const rows = new Map();
  const list = h('ol', { class: 'parts symptoms' }, items.map(({ l }, i) => {
    const mod = model.modulesById.get(l.modulo);
    const li = disclosure({ n: i + 1, title: l.titulo, sub: l.resumen, level: 'h2', body: [ // el resumen ya va como bajada del botón: no se repite adentro
      h('div', { class: 'dg-cols' },
        h('div', null, h('h3', { class: 'cartel dg-h' }, ui.labels.probableCauses), h('ul', null, l.diagnostico.causasProbables.map((t) => h('li', null, t)))),
        h('div', null, h('h3', { class: 'cartel dg-h' }, ui.labels.checkFirst), h('ol', { class: 'dg-steps' }, l.diagnostico.revisarPrimero.map((t) => h('li', null, t))))),
      l.diagnostico.pararYLlamar ? h('div', { class: 'note note--warn', style: 'margin-top:16px' }, ico('warn'), h('div', null, h('h3', { class: 'cartel' }, ui.labels.stopAndCall), h('p', null, l.diagnostico.pararYLlamar))) : null,
      h('a', { class: 'go', href: `#/leccion/${l.id}` }, ui.diag.openLesson, ico('arrow'))] });
    if (mod) li.querySelector('.tt').before(h('span', { class: 'code dg-mod' }, mod.title));
    li.id = `sy-${l.id}`; rows.set(l.id, li); return li;
  }));
  const clear = h('button', { class: 'btn', type: 'button' }, ui.diag.clear);
  const none = h('div', { class: 'empty', hidden: true }, h('p', { class: 'big' }, ui.diag.none), h('p', null, ui.diag.noneHint), clear);
  const apply = () => {
    const tk = norm(input.value).split(/\s+/).filter(Boolean);
    let n = 0;
    items.forEach(({ l, key }) => {
      const ok = tk.every((t) => hasWordStart(key, t));
      rows.get(l.id).hidden = !ok;
      if (ok) n++;
    });
    status.textContent = !tk.length ? ui.diag.all : n ? plural(n, ui.diag.shown) : ui.diag.none;
    none.hidden = n > 0;
  };
  input.addEventListener('input', apply);
  clear.addEventListener('click', () => { input.value = ''; apply(); input.focus(); });
  el.replaceChildren(
    h('header', { class: 'wrap l-head' },
      h('nav', { 'aria-label': ui.nav.home }, h('p', { class: 'crumbs' }, h('a', { href: '#/' }, ui.nav.home), ' / ', h('span', { 'aria-current': 'page' }, ui.diag.title))),
      h('p', { class: 'eyebrow' }, h('span', { class: 'cartel' }, `${ui.module.code}-04`), h('span', { class: 'code' }, plural(items.length, ui.diag.shown))),
      h('h1', null, ui.diag.title), h('p', { class: 'summary' }, ui.diag.intro)),
    h('div', { class: 'g-tools' }, h('div', { class: 'wrap' },
      h('label', { class: 'field', for: 'dg-q' }, ico('search'), h('span', { class: 'vh' }, ui.diag.filter), input), status)),
    h('div', { class: 'wrap g-body' }, list, none)); // el estado vacío repite el aviso del aria-live con ayuda para salir
  return () => {};
}
