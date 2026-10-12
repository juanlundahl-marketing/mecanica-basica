import { h } from '../lib/dom.js';
import { norm, firstLetter, plural, hasWordStart } from '../lib/text.js';

export function render(el, ctx) {
  const { ui, model, params } = ctx;
  const focusId = params[0];
  if (focusId && !model.termsById.has(focusId)) return ctx.notFound(el);
  const g = ui.glossary;
  ctx.setTitle(focusId ? model.termsById.get(focusId).termino : g.title);

  const groups = new Map();
  model.terms.forEach((t) => { const k = firstLetter(t.termino); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(t); });
  const letters = [...groups.keys()].sort();

  const status = h('p', { class: 'status', role: 'status', 'aria-live': 'polite' }, plural(model.terms.length, g.count));
  const input = h('input', { id: 'gl-q', type: 'search', placeholder: g.filterPlaceholder, autocomplete: 'off', enterkeyhint: 'search' });
  const az = h('ul', { class: 'az' }, letters.map((L) => h('li', null,
    h('button', { type: 'button', 'data-l': L, 'aria-label': `${g.jump} ${L}` }, L))));

  const entry = (t) => {
    const rel = (t.relacionado || []).map((id) => model.termsById.get(id)).filter(Boolean);
    const used = model.usage.get(t.id) || [];
    return h('li', null, h('article', { class: 'gl-entry frame', id: `gl-${t.id}`, 'data-key': norm(`${t.termino} ${t.definicion}`) },
      h('span', { class: 'gl-code' }, `${g.code}-${String(model.terms.indexOf(t) + 1).padStart(2, '0')}`),
      h('h3', { tabindex: '-1' }, t.termino), h('p', null, t.definicion),
      rel.length || used.length ? h('dl', null,
        rel.length ? [h('dt', null, g.related), h('dd', null, rel.map((r) => h('a', { class: 'chip', href: `#/glosario/${r.id}` }, r.termino)))] : null,
        used.length ? [h('dt', null, g.usedIn), h('dd', null, used.map((l) => h('a', { class: 'chip', href: `#/leccion/${l.id}` }, l.titulo)))] : null) : null));
  };

  const sections = letters.map((L) => h('section', { class: 'letter-group', id: `gl-L-${L}`, 'data-l': L, 'aria-labelledby': `gl-h-${L}` },
    h('h2', { id: `gl-h-${L}` }, L), h('ul', { class: 'gl-list' }, groups.get(L).map(entry))));
  const none = h('p', { hidden: true }, g.none);

  const apply = () => {
    const tk = norm(input.value).split(/\s+/).filter(Boolean);
    let n = 0;
    sections.forEach((s) => {
      let vis = 0;
      s.querySelectorAll('article').forEach((a) => {
        const ok = tk.every((t) => hasWordStart(a.dataset.key, t));
        a.parentElement.hidden = !ok;
        if (ok) { vis++; n++; }
      });
      s.hidden = !vis;
      const b = az.querySelector(`[data-l="${s.dataset.l}"]`);
      if (b) b.disabled = !vis;
    });
    none.hidden = n > 0;
    status.textContent = n ? plural(n, g.count) : g.none;
  };
  input.addEventListener('input', apply);
  az.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const s = document.getElementById(`gl-L-${b.dataset.l}`);
    s.scrollIntoView({ block: 'start' });
    s.querySelector('h2').setAttribute('tabindex', '-1');
    s.querySelector('h2').focus({ preventScroll: true });
  });

  el.replaceChildren(h('div', { class: 'wrap view' },
    h('nav', { 'aria-label': ui.nav.home }, h('p', { class: 'crumbs' }, h('a', { href: '#/' }, ui.nav.home), ' / ', h('span', { 'aria-current': 'page' }, g.title))),
    h('p', { class: 'block-tag' }, `${ui.module.code}-05`),
    h('h1', null, g.title), h('p', null, g.intro),
    h('div', { class: 'filter' }, h('label', { class: 'label', for: 'gl-q' }, g.filter), input),
    h('nav', { 'aria-label': g.jump }, az), status, sections, none));

  if (focusId) {
    const a = document.getElementById(`gl-${focusId}`);
    if (a) {
      a.classList.add('target');
      a.scrollIntoView({ block: 'center' });
      a.querySelector('h3').focus({ preventScroll: true });
    }
  }
  return () => {};
}
