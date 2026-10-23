// Esquemas SVG originales y accesibles. Los textos salen de ui-strings (ui.diagrams).
// Cada función devuelve { el, cleanup }; las referencias numéricas se explican en una leyenda HTML.
import { h, svg } from './dom.js?v=8';

let uid = 0;
const nid = (p) => `${p}-${++uid}`;

// marcador numerado con línea guía (decoración; el significado está en la leyenda)
const mk = (n, x, y, lx, ly) =>
  `${lx != null ? `<path class="dg-thin" d="M${x} ${y}L${lx} ${ly}"/>` : ''}<g class="dg-mark"><circle cx="${x}" cy="${y}" r="11"/><text x="${x}" y="${y}">${n}</text></g>`;
const ground = (x, y) => `<path class="dg-ink" d="M${x} ${y}v6M${x - 10} ${y + 6}h20M${x - 6} ${y + 10}h12M${x - 2} ${y + 14}h4"/>`;

function figure(cls, caption, children, legend) {
  return h('figure', { class: `diagram frame ${cls || ''}` }, children,
    h('figcaption', null, caption),
    legend ? h('ol', { class: 'legend' }, legend.map((t, i) => h('li', null, h('b', { 'aria-hidden': 'true' }, i + 1), h('span', null, t)))) : null);
}
function wrapSvg(vb, title, desc, inner) {
  const t = nid('t'), d = nid('d');
  return svg(`<svg class="dg-svg" viewBox="${vb}" role="img" aria-labelledby="${t} ${d}" focusable="false"><title id="${t}">${title}</title><desc id="${d}">${desc}</desc>${inner}</svg>`);
}
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

/* ---------- Ciclo de 4 tiempos ---------- */
function cylinder(stage, i, k) {
  // k: posición del pistón y estados de válvulas por etapa
  const S = [
    { py: 90, intake: 1, exhaust: 0, flame: 0, dir: 'down', inflow: 1 },
    { py: 62, intake: 0, exhaust: 0, flame: 0, dir: 'up' },
    { py: 62, intake: 0, exhaust: 0, flame: 1, dir: 'down' },
    { py: 90, intake: 0, exhaust: 1, flame: 0, dir: 'up', outflow: 1 }
  ][i];
  const valve = (x, open) => `<path class="dg-ink" d="M${x} 6V${open ? 34 : 22}" /><path class="dg-ink" stroke-width="4" d="M${x - 10} ${open ? 34 : 22}H${x + 10}"/>`;
  const arrow = S.dir === 'down'
    ? '<path class="dg-line" d="M148 70V104"/><path class="dg-arrow" d="M142 102L148 116L154 102Z"/>'
    : '<path class="dg-line" d="M148 116V82"/><path class="dg-arrow" d="M142 84L148 70L154 84Z"/>';
  const flow = S.inflow ? '<path class="dg-line" d="M58 40V70"/><path class="dg-arrow" d="M52 68L58 80L64 68Z"/>'
    : S.outflow ? '<path class="dg-hot" d="M102 70V44"/><path class="dg-arrow-hot" d="M96 46L102 34L108 46Z"/>' : '';
  const flame = S.flame ? '<path class="dg-flame" d="M80 28C68 40 70 50 80 54C90 50 92 40 80 28Z"/><path class="dg-hot" d="M62 30l-8-6M98 30l8-6M80 24v-8"/>' : '';
  const t = nid('t'), d = nid('d');
  return svg(`<svg viewBox="0 0 170 190" role="img" aria-labelledby="${t} ${d}" focusable="false"><title id="${t}">${i + 1}. ${esc(stage.name)}</title><desc id="${d}">${esc(stage.desc)}</desc>
    <path class="dg-ink" d="M30 20V150M130 20V150M30 20H130"/>
    <path class="dg-ink" d="M80 4V20"/><rect x="75" y="2" width="10" height="9" class="dg-fill"/>
    ${valve(58, S.intake)}${valve(102, S.exhaust)}
    <rect x="32" y="${S.py}" width="96" height="24" class="dg-fill"/><path class="dg-thin" d="M32 ${S.py + 7}H128M32 ${S.py + 13}H128"/>
    <path class="dg-ink" stroke-width="3" d="M80 ${S.py + 24}V162"/><circle cx="80" cy="172" r="10" class="dg-fill"/><circle cx="80" cy="166" r="2.5" fill="var(--ink)"/>
    ${flow}${flame}${arrow}</svg>`);
}
function wheel(c) {
  const t = nid('t'), d = nid('d');
  const lab = c.wheelAbbr;
  return svg(`<svg viewBox="0 0 240 240" role="img" aria-labelledby="${t} ${d}" focusable="false"><title id="${t}">${esc(c.wheelTitle)}</title><desc id="${d}">${esc(c.wheelDesc)}</desc>
    <g stroke="var(--surface)" stroke-width="3">
      <path class="sector" data-i="0" d="M120 120V20A100 100 0 01220 120Z" fill="var(--line)" fill-opacity=".35"/>
      <path class="sector" data-i="1" d="M120 120H220A100 100 0 01120 220Z" fill="var(--line)" fill-opacity=".6"/>
      <path class="sector" data-i="2" d="M120 120V220A100 100 0 0120 120Z" fill="var(--signal-fill)"/>
      <path class="sector" data-i="3" d="M120 120H20A100 100 0 01120 20Z" fill="var(--line)" fill-opacity=".2"/>
    </g>
    <circle cx="120" cy="120" r="44" fill="var(--surface)" stroke="var(--ink)" stroke-width="1.5"/>
    <g class="dg-wheel-text"><text x="120" y="117" font-size="15">${esc(c.wheelCenter[0])}</text><text x="120" y="134" font-size="10" font-weight="400">${esc(c.wheelCenter[1])}</text>
    <text x="172" y="72">${esc(lab[0])}</text><text x="172" y="176">${esc(lab[1])}</text><text x="68" y="176" fill="var(--signal-ink)">${esc(lab[2])}</text><text x="68" y="72">${esc(lab[3])}</text></g></svg>`);
}
function cycle(ui) {
  const c = ui.diagrams.cycle;
  const fig = figure('cycle', c.caption, []);
  const grid = h('div', { class: 'stage-grid' }, c.stages.map((s, i) =>
    h('div', { class: 'stage', 'data-i': i }, cylinder(s, i), h('p', { class: 'st-name' }, `${i + 1}. ${s.name}`), h('span', { class: 'st-deg' }, s.deg))));
  const wh = h('div', { class: 'cycle-wheel' }, wheel(c));
  const btns = h('div', { class: 'phase-btns', role: 'group', 'aria-label': c.highlight },
    c.stages.map((s, i) => h('button', { class: 'btn', type: 'button', 'data-i': i, 'aria-pressed': 'false' }, s.name)));
  fig.prepend(h('div', { class: 'cycle-top' }, grid, wh), btns);
  let cur = -1;
  const set = (i) => {
    cur = i === cur ? -1 : i;
    fig.classList.toggle('dim', cur >= 0);
    fig.querySelectorAll('.stage').forEach((e) => e.classList.toggle('hl', +e.dataset.i === cur));
    fig.querySelectorAll('.sector').forEach((e) => e.classList.toggle('hl', +e.dataset.i === cur));
    btns.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.i === cur)));
    fig.dispatchEvent(new CustomEvent('cyclechange', { detail: cur }));
  };
  btns.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) set(+b.dataset.i); });
  fig.querySelectorAll('.sector').forEach((s) => s.addEventListener('click', () => set(+s.dataset.i)));
  return { el: fig, cleanup() {} };
}

/* ---------- Frenos ---------- */
function brakes(ui) {
  const c = ui.diagrams.brakes;
  const inner = `
    <rect x="286" y="62" width="14" height="196" class="dg-fill"/>
    <path class="dg-ink" stroke-width="4" d="M16 268L36 252"/><path class="dg-ink" d="M30 258L58 202"/><circle cx="58" cy="202" r="4" class="dg-fill"/>
    <path class="dg-ink" d="M50 214H70"/>
    <rect x="70" y="176" width="50" height="72" rx="10" class="dg-fill"/>
    <rect x="120" y="198" width="64" height="28" class="dg-fill"/><path class="dg-ink" d="M132 200V224"/>
    <rect x="134" y="168" width="36" height="30" class="dg-fill"/><path class="dg-thin" d="M134 180H170"/>
    <path class="dg-line" d="M184 212H228V162H254"/>
    <path class="dg-ink" d="M254 114H326V210H254Z"/>
    <rect x="258" y="142" width="14" height="40" class="dg-fill"/>
    <rect x="274" y="130" width="10" height="64" fill="var(--signal-fill)" stroke="var(--ink)" stroke-width="2"/>
    <rect x="302" y="130" width="10" height="64" fill="var(--signal-fill)" stroke="var(--ink)" stroke-width="2"/>
    <path class="dg-line" d="M262 126H284"/><path class="dg-arrow" d="M282 120L292 126L282 132Z"/>
    ${mk(1, 22, 236, 34, 252)}${mk(2, 95, 156, 95, 176)}${mk(3, 152, 146, 152, 168)}${mk(4, 206, 186, 206, 212)}${mk(5, 232, 122, 260, 148)}${mk(6, 266, 236, 279, 194)}${mk(7, 293, 40, 293, 62)}`;
  return { el: figure('brakes', c.caption, wrapSvg('0 0 360 290', esc(c.title), esc(c.desc), inner), c.legend), cleanup() {} };
}

/* ---------- Circuito eléctrico ---------- */
function electric(ui) {
  const c = ui.diagrams.electric;
  const inner = `
    <rect x="30" y="50" width="70" height="56" class="dg-fill"/><rect x="42" y="44" width="14" height="6" fill="var(--ink)"/><rect x="76" y="106" width="14" height="6" fill="var(--ink)"/>
    <g class="dg-text"><text x="49" y="72" font-size="16">+</text><text x="83" y="92" font-size="16">−</text></g>
    <circle cx="290" cy="75" r="32" class="dg-fill"/><text x="290" y="82" class="dg-text" font-size="20">M</text>
    <circle cx="290" cy="215" r="32" class="dg-fill"/><text x="290" y="223" class="dg-text" font-size="22">~</text>
    <circle cx="336" cy="140" r="10" class="dg-fill"/><circle cx="336" cy="215" r="10" class="dg-fill"/>
    <path class="dg-ink" stroke-dasharray="5 4" d="M326 140V215M346 140V215"/>
    <path class="dg-line" d="M49 44V24H290V43"/>
    <path class="dg-hot" stroke-dasharray="7 5" d="M258 215H200V24"/>
    <circle cx="200" cy="24" r="4" fill="var(--ink)"/>
    <path class="dg-arrow" d="M240 18L252 24L240 30Z"/><path class="dg-arrow-hot" d="M194 140L200 128L206 140Z"/>
    <path class="dg-ink" d="M83 112V258M290 107V124M290 247V258"/>
    ${ground(83, 258)}${ground(290, 124)}${ground(290, 258)}
    ${mk(1, 14, 78, 30, 78)}${mk(2, 336, 62, 322, 70)}${mk(3, 238, 262, 266, 236)}${mk(4, 130, 46, 130, 24)}${mk(5, 130, 262, 95, 266)}${mk(6, 302, 160, 326, 170)}`;
  const el = figure('electric', c.caption, wrapSvg('0 0 360 290', esc(c.title), esc(c.desc), inner), c.legend);
  return { el, cleanup() {} };
}

/* ---------- Refrigeración ---------- */
function cooling(ui) {
  const c = ui.diagrams.cooling;
  const fins = Array.from({ length: 12 }, (_, i) => `M272 ${88 + i * 13}H312`).join('');
  const inner = `
    <rect x="30" y="100" width="110" height="110" class="dg-fill"/><rect x="44" y="116" width="82" height="78" fill="none" class="dg-thin" stroke-dasharray="5 4"/>
    <path class="dg-ink" d="M62 130V176M85 130V176M108 130V176"/>
    <rect x="270" y="76" width="44" height="164" class="dg-fill"/><path class="dg-thin" d="${fins}"/>
    <rect x="264" y="62" width="56" height="14" class="dg-fill"/><rect x="264" y="240" width="56" height="14" class="dg-fill"/>
    <circle cx="334" cy="158" r="16" class="dg-fill"/><path class="dg-ink" d="M334 144V172M320 158H348M324 148L344 168M344 148L324 168" stroke-width="1.5"/>
    <rect x="170" y="28" width="50" height="34" rx="4" class="dg-fill"/><path class="dg-thin" d="M170 42H220"/><path class="dg-thin" stroke-dasharray="4 3" d="M220 45H292V62"/>
    <path class="dg-hot" stroke-width="6" d="M140 120H230V69H264"/>
    <rect x="172" y="106" width="26" height="28" class="dg-fill"/><path class="dg-ink" d="M178 114L192 126"/>
    <path class="dg-line" d="M264 247H212M180 247H85V210"/>
    <circle cx="196" cy="247" r="16" class="dg-fill"/><path class="dg-ink" d="M184 247H208M196 235V259" stroke-width="1.5"/>
    <path class="dg-arrow-hot" d="M208 112L220 120L208 128Z"/><path class="dg-arrow" d="M246 240L234 247L246 254Z"/>
    ${mk(1, 85, 82, 85, 100)}${mk(2, 185, 84, 185, 106)}${mk(3, 292, 280, 292, 254)}${mk(4, 334, 112, 334, 142)}${mk(5, 196, 284, 196, 263)}${mk(6, 195, 12)}${mk(7, 244, 96, 230, 96)}`;
  return { el: figure('cooling', c.caption, wrapSvg('0 0 360 296', esc(c.title), esc(c.desc), inner), c.legend), cleanup() {} };
}

const MAP = { 'motor-4-tiempos': cycle, frenos: brakes, 'sistema-electrico': electric, refrigeracion: cooling };
export function diagramFor(lessonId, ui) {
  const f = MAP[lessonId];
  return f ? f(ui) : null;
}
