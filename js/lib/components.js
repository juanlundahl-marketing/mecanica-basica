// Componentes compartidos entre vistas.
import { h, svg } from './dom.js?v=7';
import { WARN, ico } from './icons.js?v=7';
import { plural } from './text.js?v=7';
import { levelNum } from './model.js?v=7';

export function gauge(nivel, ui, extra) {
  const n = levelNum(nivel);
  const col = n === 3 ? 'var(--alert)' : n === 2 ? 'var(--signal-fill)' : 'var(--line)';
  const a = -90 + n * 45;
  const label = ui.levels[nivel] || ui.labels.levelBasic;
  const g = svg(`<svg width="48" height="30" viewBox="0 0 48 30" aria-hidden="true" focusable="false"><path d="M4 26a20 20 0 0140 0" fill="none" stroke="var(--grid-strong)" stroke-width="4"/><path d="M4 26a20 20 0 0140 0" fill="none" stroke="${col}" stroke-width="4" stroke-dasharray="${n * 21} 100"/><g class="needle" style="transform:rotate(${a}deg)"><path d="M24 26V9" stroke="var(--ink)" stroke-width="2.5" stroke-linecap="round"/></g><circle cx="24" cy="26" r="3" fill="var(--ink)"/></svg>`);
  return h('span', { class: 'gauge' }, g, h('span', null, `${ui.labels.level}: ${label} (${n}/3)${extra ? ` · ${extra}` : ''}`));
}

export function safetyBox(items, ui) {
  if (!items?.length) return null;
  const id = `sf-${Math.random().toString(36).slice(2, 7)}`;
  return h('section', { class: 'box safety', 'aria-labelledby': id },
    h('h2', { id }, svg(WARN), ui.labels.safety),
    h('ul', null, items.map((t) => h('li', null, t))));
}

export function manualBox(vm, ui) {
  if (!vm || (!vm.nota && !vm.requerido)) return null;
  const id = `mn-${Math.random().toString(36).slice(2, 7)}`;
  return h('section', { class: 'box manual', 'aria-labelledby': id },
    h('h2', { id }, '↗ ', ui.labels.checkManual),
    h('p', null, vm.nota || ui.verifyManualDefault),
    null);
}

export function listBox(kind, title, items, extraIcon) {
  if (!items?.length) return null;
  const id = `bx-${Math.random().toString(36).slice(2, 7)}`;
  return h('section', { class: `box ${kind}`, 'aria-labelledby': id },
    h('h2', { id }, extraIcon, title),
    items.length === 1 ? h('p', null, items[0]) : h('ul', null, items.map((t) => h('li', null, t))));
}

export const lamp = () => h('span', { class: 'lamp', 'aria-hidden': 'true' });

const pad = (n) => String(n).padStart(2, '0');
let seq = 0;

/** Fila desplegable (patrón acordeón de la APG): h > button[aria-expanded][aria-controls] + región. Varias pueden quedar abiertas. */
export function disclosure({ n, title, sub, level = 'h4', body, open = false, onToggle, key }) {
  const u = ++seq;
  const btn = h('button', { type: 'button', 'aria-expanded': String(open), 'aria-controls': `pb-${u}`, id: `pt-${u}` },
    n != null ? h('span', { class: 'n', 'aria-hidden': 'true' }, pad(n)) : h('span'),
    h('span', null, h('span', { class: 'tt' }, title), sub ? h('span', { class: 'sub' }, sub) : null), h('span', { class: 'pm', 'aria-hidden': 'true' }));
  const panel = h('div', { class: 'part-b', id: `pb-${u}`, role: 'region', 'aria-labelledby': `pt-${u}`, hidden: !open }, body);
  btn.addEventListener('click', () => {
    const isOpen = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!isOpen));
    panel.hidden = isOpen;
    if (onToggle) onToggle(!isOpen);
  });
  return h('li', { class: 'part', 'data-term': key }, h(level, null, btn), panel);
}

/** Despiece: términos reales del glosario ligados a una lección (definición, sinónimos, relacionados, enlace al glosario). */
export function despiece(ids, { model, ui, level = 'h3', title, note }) {
  const terms = ids.map((id) => model.termsById.get(id)).filter(Boolean);
  if (!terms.length) return null;
  const S = ui.sheet, hid = `ph-${++seq}`;
  const itemLevel = level === 'h2' ? 'h3' : 'h4';
  const rows = terms.map((g, i) => {
    const uses = (model.usage.get(g.id) || []).length;
    const rel = (g.relacionado || []).map((r) => model.termsById.get(r)).filter(Boolean);
    const rid = `pr-${++seq}`;
    return disclosure({
      n: i + 1, title: g.termino, level: itemLevel, key: g.id,
      body: [
        h('p', { class: 'def' }, g.definicion),
        g.sinonimos?.length ? h('p', { class: 'syn' }, `${S.also}: ${g.sinonimos.join(', ')}`) : null,
        rel.length ? [h('p', { class: 'syn', id: rid }, S.related),
          h('ul', { class: 'rel', 'aria-labelledby': rid }, rel.map((r) => h('li', null, h('a', { class: 'chip', href: `#/glosario/${r.id}` }, r.termino))))] : null,
        h('a', { class: 'go', href: `#/glosario/${g.id}` }, `${S.inGlossary}${uses > 1 ? ` · ${S.inLessons.replace('{n}', uses)}` : ''}`, ico('arrow'))
      ]
    });
  });
  return h('section', { class: 'parts-wrap', 'aria-labelledby': hid },
    h('div', { class: 'parts-h' }, h(level, { class: 'cartel', id: hid }, title), h('span', { class: 'code' }, plural(terms.length, S.terms))),
    note ? h('p', { class: 'parts-note' }, note) : null,
    h('ol', { class: 'parts' }, rows));
}
