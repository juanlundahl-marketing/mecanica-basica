// Portada = recorrido. Debajo: índice accesible de las paradas, catálogo de módulos y «cómo usar este sitio».
import { h, svg } from '../lib/dom.js?v=8';
import { MODULE_ICONS } from '../lib/icons.js?v=8';
import { gauge } from '../lib/components.js?v=8';
import { buildStops, ESTACIONES, stationNum } from '../lib/recorrido-paradas.js?v=8';
import { mountTour, mountStatic, forcedStatic } from './recorrido-continuo.js?v=8';

export const styles = [];

export function moduleCard(m, ctx) {
  const { ui } = ctx;
  const isGlossary = m.id === 'glosario';
  const href = isGlossary ? '#/glosario' : `#/modulo/${m.id}`;
  const code = `${ui.module.code}-${String(m.n).padStart(2, '0')}`;
  const meta = isGlossary
    ? h('span', { class: 'gauge' }, `${ctx.model.terms.length} ${ui.module.terms}`)
    : gauge(m.nivel, ui, `${m.lessons.length} ${ui.labels.lessons}`);
  return h('a', { class: 'card frame', href },
    h('span', { class: 'top' }, h('span', { class: 'ico-lg' }, svg(MODULE_ICONS[m.id] || MODULE_ICONS.glosario)), h('span', { class: 'code' }, code)),
    h('h3', null, m.title), h('p', null, m.description), meta);
}

export function render(el, ctx) {
  const { ui, model } = ctx;
  const T = ui.tour, R = ui.recorrido;
  ctx.setTitle(null);
  const stops = buildStops(ctx);
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const q = /[?&]parada=(\d+)/.exec(location.hash);
  const stop = q ? +q[1] - 1 : null;

  const stOf = (e) => R.stations.find((x) => x.id === (e === 'pista' ? 'ruta' : e));
  const after = h('div', { class: 'tr-after' },
    h('section', { class: 'wrap', id: 'indice', tabindex: '-1', 'aria-labelledby': 'idx-t' },
      h('p', { class: 'code' }, T.indexKicker),
      h('h2', { id: 'idx-t' }, T.indexTitle.replace('{n}', stops.length)),
      h('p', { class: 'lead' }, T.indexLead),
      h('div', { class: 'idx' }, Object.keys(ESTACIONES).map((e) => h('div', { style: `--st:var(${stops.find((s) => s.est === e)?.cvar})` },
        h('h3', null, h('span', { class: 'swatch', 'aria-hidden': 'true' }), `${stationNum(e)} · ${stOf(e).title}`),
        h('ol', null, stops.filter((s) => s.est === e).map((s) => h('li', null, h('span', { class: 'code' }, String(s.k + 1).padStart(2, '0')),
          h('a', { href: `#/leccion/${s.id}` }, s.l.titulo)))))))),
    h('section', { class: 'wrap section-gap', 'aria-labelledby': 'cat' },
      h('p', { class: 'block-tag' }, '01'), h('h2', { id: 'cat' }, ui.home.catalog),
      h('ul', { class: 'cards' }, model.modules.map((m) => h('li', null, moduleCard(m, ctx))))),
    h('section', { class: 'wrap section-gap', 'aria-labelledby': 'how' },
      h('p', { class: 'block-tag' }, '02'), h('h2', { id: 'how' }, ui.home.howTitle),
      h('ol', { class: 'how' }, ui.home.how.map((s) => h('li', { class: 'frame' }, h('h3', null, s.t), h('p', null, s.d))))));

  const host = h('div', { class: 'tr-host' });
  let teardown = () => {};
  const mount = () => {
    teardown(); host.replaceChildren();
    teardown = (forcedStatic() || RM.matches) ? mountStatic(host, ctx, stops) : mountTour(host, ctx, stops, { stop });
  };
  el.replaceChildren(host, after);
  mount();
  // «Saltar el recorrido»: lleva al índice de paradas
  const skip = (e) => {
    const a = e.target.closest('[data-goto]'); if (!a) return;
    e.preventDefault(); const t = document.getElementById(a.dataset.goto);
    t.scrollIntoView({ behavior: 'auto', block: 'start' }); t.focus({ preventScroll: true });
  };
  el.addEventListener('click', skip);
  const onRM = () => mount();
  RM.addEventListener('change', onRM);
  return () => { teardown(); el.removeEventListener('click', skip); RM.removeEventListener('change', onRM); };
}
