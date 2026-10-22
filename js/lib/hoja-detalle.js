// Hoja de detalle por parada: <dialog> nativo (foco atrapado, Esc, fondo inerte). El recorrido queda anclado (html.is-locked).
import { h } from './dom.js?v=7';
import { ico } from './icons.js?v=7';
import { despiece } from './components.js?v=7';
import { plural } from './text.js?v=7';

let dlg = null, returnTo = null, navigated = false;

function ensure() {
  if (dlg) return dlg;
  dlg = h('dialog', { class: 'sheet', id: 'sheet', 'aria-labelledby': 'sheet-t' });
  document.body.append(dlg);
  dlg.addEventListener('click', (e) => {
    if (e.target.closest('a[href^="#/"]')) { navigated = true; dlg.close(); return; }
    if (e.target.closest('[data-close]') || e.target === dlg) dlg.close();
  });
  dlg.addEventListener('close', () => {
    document.documentElement.classList.remove('is-locked');
    const to = returnTo; returnTo = null;
    if (!navigated && to && document.contains(to)) to.focus(); // el foco vuelve al botón «Ver detalle»
  });
  return dlg;
}

export function closeDetail() { if (dlg?.open) { navigated = true; dlg.close(); } }

/** stop = elemento de buildStops(); from = botón que lo abrió (recibe el foco al cerrar). */
export function openDetail(stop, ctx, from, termId) {
  const { ui, model } = ctx, S = ui.sheet, T = ui.tour, l = stop.l;
  const d = ensure();
  const seg = l.seguridad || [];
  const man = l.verificarEnManual && (l.verificarEnManual.requerido || l.verificarEnManual.nota);
  d.replaceChildren(
    h('div', { class: 'sheet-h', style: `--st:var(${stop.cvar})` },
      h('div', { class: 't' },
        h('p', { class: 'code meta' }, h('span', { class: 'swatch', 'aria-hidden': 'true' }),
          T.stopCode.replace('{station}', stop.short).replace('{n}', String(stop.k + 1).padStart(2, '0')).replace('{total}', stop.total)),
        h('h2', { id: 'sheet-t', tabindex: '-1' }, l.titulo)),
      h('button', { class: 'btn btn--icon', type: 'button', 'data-close': '', 'aria-label': S.close }, ico('close'))),
    h('div', { class: 'sheet-b' },
      h('p', { class: 'lead' }, l.resumen),
      despiece(l.glosario || [], { model, ui, level: 'h3', title: S.partsTitle, note: S.partsNote }),
      seg.length ? h('div', { class: 'note note--warn' }, ico('warn'), h('div', null, h('h3', { class: 'cartel' }, ui.labels.safety), h('ul', null, seg.map((x) => h('li', null, x))))) : null,
      man ? h('div', { class: 'note' }, ico('book'), h('div', null, h('h3', { class: 'cartel' }, ui.labels.checkManual), h('p', null, l.verificarEnManual.nota || ui.verifyManualDefault))) : null),
    h('div', { class: 'sheet-f' },
      h('a', { class: 'btn btn--primary', href: `#/leccion/${stop.id}` }, S.openLesson, h('span', { class: 'arr' }, ico('arrow'))),
      h('button', { class: 'btn', type: 'button', 'data-close': '' }, S.keepGoing)));
  returnTo = from || document.activeElement; navigated = false;
  document.documentElement.classList.add('is-locked');
  d.showModal();
  const row = termId ? [...d.querySelectorAll('li.part[data-term]')].find((li) => li.dataset.term === termId) : null;
  const tb = row && row.querySelector('button[aria-expanded]');
  if (tb) { if (tb.getAttribute('aria-expanded') !== 'true') tb.click(); tb.focus(); tb.scrollIntoView({ block: 'nearest' }); } // punto «+»: ese término, desplegado y enfocado
  else d.querySelector('#sheet-t').focus();
}
