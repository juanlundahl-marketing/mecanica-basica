// Modelo derivado del bloque de idioma: índices por id, módulos, uso del glosario y búsqueda.
import { norm, hasWordStart } from './text.js?v=8';

const LEVEL_NUM = { basico: 1, intermedio: 2, avanzado: 3 };
export const levelNum = (n) => LEVEL_NUM[n] || 1;

// Sustituye {modules}, {lessons} y {terms} en un texto por los totales reales.
export const fillCounts = (s, c) => (typeof s === 'string' ? s.replace(/\{(modules|lessons|terms)\}/g, (_, k) => c[k]) : s);

export function buildModel(meta, data) {
  const lessons = data.lecciones;
  const lessonsById = new Map(lessons.map((l) => [l.id, l]));
  const terms = [...data.glosario].sort((a, b) => a.termino.localeCompare(b.termino, 'es'));
  const termsById = new Map(terms.map((t) => [t.id, t]));
  const usage = new Map();
  for (const l of lessons) for (const id of l.glosario || []) {
    if (!usage.has(id)) usage.set(id, []);
    usage.get(id).push(l);
  }
  const modules = meta.modulos.map((id, i) => {
    const ls = lessons.filter((l) => l.modulo === id);
    const level = ls.reduce((m, l) => Math.max(m, levelNum(l.nivel)), 0) || 1;
    const nivel = ls.find((l) => levelNum(l.nivel) === level)?.nivel || 'basico';
    return { id, n: i + 1, lessons: ls, level, nivel, ...data.ui.modules[id] };
  });
  const counts = { modules: modules.length, lessons: lessons.length, terms: terms.length };
  for (const m of modules) m.description = fillCounts(m.description, counts);
  const modulesById = new Map(modules.map((m) => [m.id, m]));
  const syn = (t) => (t.sinonimos || []).join(' ');
  const searchDocs = [
    ...lessons.map((l) => ({
      kind: l.modulo === 'diagnostico' ? 'diagnostic' : 'lessons', href: `#/leccion/${l.id}`, title: l.titulo, sub: l.resumen,
      t: norm(l.titulo), s: norm(l.resumen),
      b: norm([...(l.secciones || []).map((s) => `${s.titulo} ${s.texto}`), ...(l.pasos || []), ...(l.seguridad || []), ...(l.tips || []), ...(l.erroresComunes || []),
        ...(l.diagnostico ? [...l.diagnostico.causasProbables, ...l.diagnostico.revisarPrimero, l.diagnostico.pararYLlamar || ''] : []),
        ...(l.glosario || []).map((id) => termsById.get(id)).filter(Boolean).map(syn)].join(' '))
    })),
    ...terms.map((t) => ({ kind: 'glossary', href: `#/glosario/${t.id}`, title: t.termino, sub: t.definicion, t: norm(`${t.termino} ${syn(t)}`), s: norm(t.definicion), b: '' }))
  ];
  return { counts, lessons, lessonsById, terms, termsById, usage, modules, modulesById, searchDocs };
}

export function lessonPos(model, lesson) {
  const m = model.modulesById.get(lesson.modulo);
  const idx = m ? m.lessons.indexOf(lesson) : -1;
  return { module: m, idx, prev: idx > 0 ? m.lessons[idx - 1] : null, next: m && idx < m.lessons.length - 1 ? m.lessons[idx + 1] : null };
}

/** Búsqueda AND por palabras; devuelve resultados agrupados y ordenados por relevancia. */
export function search(model, q) {
  const tokens = norm(q).split(/\s+/).filter(Boolean);
  const out = { lessons: [], diagnostic: [], glossary: [] };
  if (!tokens.length) return out;
  for (const d of model.searchDocs) {
    let score = 0;
    let ok = true;
    for (const tk of tokens) {
      let s = 0;
      if (hasWordStart(d.t, tk)) s += d.t.startsWith(tk) ? 6 : 4;
      if (hasWordStart(d.s, tk)) s += 2;
      if (hasWordStart(d.b, tk)) s += 1;
      if (!s) { ok = false; break; }
      score += s;
    }
    if (ok) out[d.kind].push({ ...d, score });
  }
  for (const k of Object.keys(out)) out[k].sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, 'es'));
  return out;
}
