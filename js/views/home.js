import { h, svg } from '../lib/dom.js';
import { MODULE_ICONS, HERO_ART, WARN } from '../lib/icons.js';
import { gauge } from '../lib/components.js';
import { fillCounts } from '../lib/model.js';

export const styles = [];

export function moduleCard(m, ctx) {
  const { ui } = ctx;
  const isGlossary = m.id === 'glosario';
  const href = isGlossary ? '#/glosario' : `#/modulo/${m.id}`;
  const code = `${ui.module.code}-${String(m.n).padStart(2, '0')}`;
  const meta = isGlossary
    ? h('span', { class: 'gauge' }, `${ctx.model.terms.length} ${ui.module.terms}`)
    : gauge(m.nivel, ui, `${m.lessons.length} ${ui.labels.lessons}`);
  const a = h('a', { class: 'card frame', href },
    h('span', { class: 'top' }, h('span', { class: 'ico' }, svg(MODULE_ICONS[m.id] || MODULE_ICONS.glosario)), h('span', { class: 'code' }, code)),
    h('h3', null, m.title), h('p', null, m.description), meta);
  return a;
}

export function render(el, ctx) {
  const { ui, model } = ctx;
  ctx.setTitle(null);
  const root = h('div', { class: 'wrap view' },
    h('section', { class: 'hero frame', 'aria-labelledby': 'h1' },
      h('div', null,
        h('p', { class: 'label' }, ui.hero.eyebrow),
        h('h1', { id: 'h1' }, ui.hero.title, ' ', h('em', null, ui.hero.titleEm)),
        h('p', { class: 'lead' }, ui.siteTagline),
        h('div', { class: 'hero-actions' },
          h('a', { class: 'btn btn-primary', href: `#/modulo/${model.modules[0].id}` }, ui.hero.startCta),
          h('a', { class: 'btn', href: '#/diagnostico' }, ui.hero.diagCta))),
      h('div', { class: 'hero-art', 'aria-hidden': 'true' }, svg(HERO_ART),
        h('div', { class: 'titleblock' }, ui.hero.block.map((t) => h('span', null, fillCounts(t, model.counts)))))),
    h('section', { class: 'callout frame rc-promo section-gap', 'aria-labelledby': 'rc-promo-t' },
      h('div', null, h('p', { class: 'label' }, ui.home.tour.label), h('h2', { id: 'rc-promo-t' }, ui.home.tour.title), h('p', null, ui.home.tour.text)),
      h('a', { class: 'btn btn-primary', href: '#/recorrido' }, ui.home.tour.cta)),
    h('section', { class: 'section-gap', 'aria-labelledby': 'cat' },
      h('p', { class: 'block-tag' }, '01'),
      h('h2', { id: 'cat' }, ui.home.catalog),
      h('ul', { class: 'cards' }, model.modules.map((m) => h('li', null, moduleCard(m, ctx))))),
    h('section', { class: 'section-gap', 'aria-labelledby': 'how' },
      h('p', { class: 'block-tag' }, '02'),
      h('h2', { id: 'how' }, ui.home.howTitle),
      h('ol', { class: 'how' }, ui.home.how.map((s) => h('li', { class: 'frame' }, h('h3', null, s.t), h('p', null, s.d))))),
    h('section', { class: 'box safety section-gap', 'aria-labelledby': 'aviso' },
      h('h2', { id: 'aviso' }, svg(WARN), ui.legal.title),
      h('p', null, ui.legal.text)));
  el.replaceChildren(root);
  return () => {};
}
