// Íconos originales (trazo de plano). Decorativos: aria-hidden.
const S = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true" focusable="false"';
export const MODULE_ICONS = {
  'como-funciona': `<svg width="40" height="40" viewBox="0 0 40 40" ${S}><path d="M12 6v18M28 6v18M12 6h16"/><rect x="14" y="14" width="12" height="6"/><path d="M20 20l-4 9"/><circle cx="20" cy="31" r="5"/><path d="M6 20h4M30 20h4" stroke-dasharray="2 2"/></svg>`,
  herramientas: `<svg width="40" height="40" viewBox="0 0 40 40" ${S}><path d="M8 32l14-14"/><path d="M22 18a7 7 0 109-9l-4 4-4-1-1-4 4-4a7 7 0 00-4 14z"/><path d="M32 32L21 21M30 34l4-4"/></svg>`,
  mantenimiento: `<svg width="40" height="40" viewBox="0 0 40 40" ${S}><path d="M8 30a13 13 0 1124 0"/><path d="M20 28l7-9"/><circle cx="20" cy="28" r="2"/><path d="M11 22h2M27 22h2M20 12v2"/></svg>`,
  diagnostico: `<svg width="40" height="40" viewBox="0 0 40 40" ${S}><rect x="6" y="6" width="28" height="22"/><path d="M10 20h5l3-7 4 12 3-5h5"/><path d="M14 34h12M20 28v6"/></svg>`,
  glosario: `<svg width="40" height="40" viewBox="0 0 40 40" ${S}><rect x="8" y="6" width="24" height="28"/><path d="M13 13h14M13 19h14M13 25h8"/><path d="M8 6l-2 2v28h24"/></svg>`
};
export const WARN = `<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2L23 21H1z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/><path d="M12 9v5M12 17v1" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>`;
export const HERO_ART = `<svg viewBox="0 0 300 200" fill="none" stroke="var(--ink)" stroke-width="1.5" aria-hidden="true" focusable="false"><path d="M40 170a110 110 0 01220 0" stroke-width="2"/><g stroke="var(--grid-strong)"><path d="M150 60v14M72 92l10 10M228 92l-10 10M50 140h14M250 140h-14"/></g><path d="M200 76a110 110 0 0160 94" stroke="var(--alert)" stroke-width="6"/><path d="M150 170L104 98" stroke="var(--line)" stroke-width="4" stroke-linecap="round"/><circle cx="150" cy="170" r="8" fill="var(--ink)"/><g font-family="JetBrains Mono, monospace" font-size="12" fill="var(--muted)" stroke="none"><text x="44" y="192">01</text><text x="142" y="52">03</text><text x="244" y="192">05</text></g></svg>`;

// Iconografía del sistema «Taller a la luz»: trazo 1,6 en grilla de 20, puntas redondeadas, dibujo propio. Decorativos: aria-hidden.
const P = {
  mark: '<path d="M10 1.8 17.1 5.9v8.2L10 18.2 2.9 14.1V5.9z"/><circle cx="10" cy="10" r="3.1"/><path d="M10 1.8v3M17.1 14.1l-2.6-1.5M2.9 14.1l2.6-1.5"/>',
  search: '<circle cx="8.6" cy="8.6" r="5.6"/><path d="m13 13 4.6 4.6"/>',
  theme: '<circle cx="10" cy="10" r="6.6"/><path d="M10 3.4v13.2A6.6 6.6 0 0 0 10 3.4z" fill="currentColor" stroke="none"/>',
  menu: '<path d="M3.5 6h13M3.5 10h13M3.5 14h13"/>',
  plus: '<path d="M10 4v12M4 10h12"/>', close: '<path d="m5 5 10 10M15 5 5 15"/>', arrow: '<path d="M4 10h11M11 5.5 15.5 10 11 14.5"/>',
  warn: '<path d="M10 2.8 18 17H2z"/><path d="M10 8v4.2M10 14.6v.2"/>',
  book: '<path d="M3 4.2c2.6-.8 4.8-.6 7 .9 2.2-1.5 4.4-1.7 7-.9V16c-2.6-.8-4.8-.6-7 .9-2.2-1.5-4.4-1.7-7-.9z"/><path d="M10 5.1v11.8"/>',
  doc: '<path d="M5 2.5h7l3.5 3.5v11.5H5z"/><path d="M12 2.5V6h3.5M7.5 10h5M7.5 13h5"/>',
  tag: '<path d="M2.8 10.6V3h7.6l7 7-7.6 7.6z"/><circle cx="6.6" cy="6.8" r="1.2"/>',
  route: '<circle cx="5" cy="15" r="2"/><circle cx="15" cy="5" r="2"/><path d="M7 15h5a3 3 0 0 0 0-6H8a3 3 0 0 1 0-6h5"/>'
};
export const iconSvg = (n) => `<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">${P[n]}</svg>`;
/** Ícono decorativo (span.ico con el SVG adentro). */
export const ico = (n) => { const s = document.createElement('span'); s.className = 'ico'; s.setAttribute('aria-hidden', 'true'); s.innerHTML = iconSvg(n); return s; };
export const LOGO = iconSvg('mark');
