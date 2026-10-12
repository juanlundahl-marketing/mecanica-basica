// Normalización de búsqueda y resaltado de términos del glosario.
export function norm(s) {
  return String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}
/** true si `tk` (ya normalizado) aparece al INICIO de alguna palabra de `hay` (ya normalizado). */
export function hasWordStart(hay, tk) {
  let i = hay.indexOf(tk);
  while (i !== -1) {
    if (i === 0 || !/[a-z0-9]/.test(hay[i - 1])) return true;
    i = hay.indexOf(tk, i + 1);
  }
  return false;
}
const CLASSES = { a: 'aáàâä', e: 'eéèêë', i: 'iíìîï', o: 'oóòôö', u: 'uúùûü', n: 'nñ' };
const alt = (term) => norm(term).split('').map((c) => {
  if (CLASSES[c]) return `[${CLASSES[c]}]`;
  return c.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
}).join('');
// Nombre + sinónimos opcionales (t.sinonimos); acepta plural simple (-s/-es) y acentos; sin palabras sueltas salvo las declaradas.
function accentRe(t) {
  const names = [t.termino, ...(t.sinonimos || [])].sort((a, b) => b.length - a.length);
  return new RegExp(`(?<![\\p{L}\\p{N}])(?:${names.map(alt).join('|')})(?:e?s)?(?![\\p{L}\\p{N}])`, 'iu');
}
/** Devuelve una función texto -> nodos; cada término se enlaza solo la primera vez que aparece. */
export function makeHighlighter(terms, mk) {
  const pending = terms.map((t) => ({ t, re: accentRe(t) }));
  return (text) => {
    const out = [];
    let rest = String(text);
    while (rest && pending.length) {
      let best = null;
      for (const p of pending) {
        const m = p.re.exec(rest);
        if (m && (!best || m.index < best.m.index || (m.index === best.m.index && m[0].length > best.m[0].length))) best = { p, m };
      }
      if (!best) break;
      if (best.m.index) out.push(rest.slice(0, best.m.index));
      out.push(mk(best.p.t, best.m[0]));
      rest = rest.slice(best.m.index + best.m[0].length);
      pending.splice(pending.indexOf(best.p), 1);
    }
    if (rest) out.push(rest);
    return out;
  };
}
export function firstLetter(s) {
  const c = norm(s).trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(c) ? c : '#';
}
export function plural(n, pair) {
  return n === 1 ? pair[0] : pair[1].replace('{n}', n);
}
