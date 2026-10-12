// Componentes compartidos entre vistas.
import { h, svg } from './dom.js';
import { WARN } from './icons.js';
import { levelNum } from './model.js';

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
