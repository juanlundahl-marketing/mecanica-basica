import { h } from '../lib/dom.js?v=8';
import { ico } from '../lib/icons.js?v=8';
import { norm, firstLetter, plural, hasWordStart } from '../lib/text.js?v=8';

export function render(el, ctx) {
  const { ui, model, params } = ctx;
  const focusId = params[0];
  if (focusId && !model.termsById.has(focusId)) return ctx.notFound(el);
  const g = ui.glossary;
  ctx.setTitle(focusId ? model.termsById.get(focusId).termino : g.title);

  const groups = new Map();
  model.terms.forEach((t) => { const k = firstLetter(t.termino); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(t); });
  const letters = [...groups.keys()].sort();

  const status = h('p', { class: 'status code', role: 'status', 'aria-live': 'polite' }, plural(model.terms.length, g.count));
  const input = h('input', { id: 'gl-q', type: 'search', placeholder: g.filterPlaceholder, autocomplete: 'off', enterkeyhint: 'search' });
  // A–Z completo: las letras sin términos quedan atenuadas y no enfocables (button disabled)
  const alphabet = [...new Set([...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), ...letters])];
  const az = h('ul', { class: 'az' }, alphabet.map((L) => h('li', null,
    h('button', { type: 'button', 'data-l': L, 'aria-label': `${g.jump} ${L}`, disabled: !groups.has(L) }, L))));

  const entry = (t) => {
    const rel = (t.relacionado || []).map((id) => model.termsById.get(id)).filter(Boolean);
    const used = model.usage.get(t.id) || [];
    const link = (l) => h('a', { href: `#/leccion/${l.id}` }, l.titulo.split(':')[0]);
    const usedIds = [h('span', { class: 'uses-l' }, g.inLessons[used.length === 1 ? 0 : 1].replace('{n}', used.length), ': ')];
    used.slice(0, 3).forEach((l, i) => usedIds.push(i ? ' · ' : '', link(l)));
    const more = used.slice(3);
    return h('li', null, h('article', { class: 'gl-entry', id: `gl-${t.id}`, 'data-key': norm(`${t.termino} ${(t.sinonimos || []).join(' ')} ${t.definicion}`) },
      h('span', { class: 'gl-code' }, `${g.code}-${String(model.terms.indexOf(t) + 1).padStart(2, '0')}`),
      h('h3', { tabindex: '-1' }, t.termino), h('p', { class: 'def' }, t.definicion),
      t.sinonimos?.length ? h('p', { class: 'syn' }, `${g.synonyms}: ${t.sinonimos.join(', ')}`) : null,
      rel.length ? h('div', { class: 'rel' }, h('span', { class: 'rel-l' }, g.related), h('ul', null, rel.map((r) => h('li', null, h('a', { class: 'chip', href: `#/glosario/${r.id}` }, r.termino))))) : null,
      used.length ? h('p', { class: 'uses' }, usedIds,
        more.length ? [' · ', h('details', null, h('summary', null, g.andMore.replace('{n}', more.length)), h('span', null, more.map((l, i) => [i ? ' · ' : '', link(l)])))] : null) : null));
  };

  const sections = letters.map((L) => h('section', { class: 'letter-group', id: `gl-L-${L}`, 'data-l': L, 'aria-labelledby': `gl-h-${L}` },
    h('h2', { id: `gl-h-${L}` }, L), h('ul', { class: 'gl-list' }, groups.get(L).map(entry))));
  const clear = h('button', { class: 'btn', type: 'button' }, g.clear);
  const none = h('div', { class: 'empty', hidden: true }, h('p', { class: 'big' }, g.none), h('p', null, g.noneHint), clear);

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
  clear.addEventListener('click', () => { input.value = ''; apply(); input.focus(); });
  az.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const s = document.getElementById(`gl-L-${b.dataset.l}`);
    s.scrollIntoView({ block: 'start' });
    s.querySelector('h2').setAttribute('tabindex', '-1');
    s.querySelector('h2').focus({ preventScroll: true });
  });

  el.replaceChildren(
    h('header', { class: 'wrap l-head' },
      h('nav', { 'aria-label': ui.nav.home }, h('p', { class: 'crumbs' }, h('a', { href: '#/' }, ui.nav.home), ' / ', h('span', { 'aria-current': 'page' }, g.title))),
      h('p', { class: 'eyebrow' }, h('span', { class: 'cartel' }, `${ui.module.code}-05`), h('span', { class: 'code' }, plural(model.terms.length, g.count))),
      h('h1', null, g.title), h('p', { class: 'summary' }, g.intro)),
    h('div', { class: 'g-tools' }, h('div', { class: 'wrap' },
      h('label', { class: 'field', for: 'gl-q' }, ico('search'), h('span', { class: 'vh' }, g.filter), input),
      h('nav', { 'aria-label': g.jump }, az), status)),
    h('div', { class: 'wrap g-body' }, sections, none));

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
