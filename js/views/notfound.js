import { h } from '../lib/dom.js?v=7';

export function render(el, ctx) {
  const { ui } = ctx;
  ctx.setTitle(ui.notFound.title);
  el.replaceChildren(h('div', { class: 'wrap view notfound' },
    h('p', { class: 'big', 'aria-hidden': 'true' }, ui.notFound.code),
    h('h1', null, ui.notFound.title), h('p', null, ui.notFound.text),
    h('a', { class: 'btn btn-primary', href: '#/' }, ui.notFound.home)));
  return () => {};
}
