// Overlay de diagnóstico de fluidez del recorrido. Solo se carga con ?perf=1 (import dinámico desde recorrido-continuo.js): apagado no pesa nada.
// Muestra intervalo entre cuadros, ms de dibujo, fotogramas dibujados distintos al objetivo, colas de red/decodificación, canvas y DPR;
// guarda una instantánea cada 5 s (window.__mbPerfLog) y copia el resumen al portapapeles (botón o Alt+Mayús+P).
import { h } from './dom.js?v=7';

const st = (a) => {
  if (!a || !a.length) return '—';
  const s = [...a].sort((x, y) => x - y), m = a.reduce((x, y) => x + y, 0) / a.length;
  return `${m.toFixed(1)} / ${s[Math.floor((s.length - 1) * 0.95)].toFixed(1)} / ${s[s.length - 1].toFixed(1)}`;
};

export function mountPerf(mb, L) {
  const pre = h('pre', { class: 'perf-pre' });
  const msg = h('span', { class: 'perf-msg', role: 'status', 'aria-live': 'polite' });
  const bCopy = h('button', { type: 'button', class: 'btn' }, L.copy), bReset = h('button', { type: 'button', class: 'btn' }, L.reset);
  const box = h('section', { class: 'perf', 'aria-label': L.aria }, h('p', { class: 'perf-t' }, L.title), pre, h('div', { class: 'perf-acts' }, bCopy, bReset, msg), h('p', { class: 'perf-hint' }, L.hint));
  document.body.append(box);
  const log = (window.__mbPerfLog = []);
  const s0 = { drawn: 0, miss: 0, lag: 0, lo: 0, full: 0 };
  const summary = () => {
    const S = mb.stats, d = S.drawn - s0.drawn, m = S.miss - s0.miss, [c, cw] = [mb.size(), mb.css()], [nb, bytes, need, nf] = mb.blobs(), dl = S.lo - s0.lo, df = S.full - s0.full;
    return [
      `${L.frame} (${L.stat}): ${st(S.dts)}  ·  >25 ms: ${S.dts.filter((x) => x > 25).length}/${S.dts.length}`,
      `${L.draw} (${L.stat}): ${st(S.draws)}  ·  ${L.hs} (${L.stat}): ${st(S.hss)}`,
      `${L.stalls}: ${m}/${d} (${d ? (100 * m / d).toFixed(1) : 0} %)  ·  ${L.lag}: ${d ? ((S.lag - s0.lag) / d).toFixed(2) : 0}`,
      `${L.seq}: ${L.light} ${d ? (100 * dl / d).toFixed(1) : 0} % · ${L.fullSeq} ${d ? (100 * df / d).toFixed(1) : 0} %  ·  ${L.settle} (${L.stat}): ${st(S.settle)}`,
      `${L.canvas}: ${c[0]}×${c[1]} (CSS ${cw[0]}×${cw[1]})  ·  DPR ${devicePixelRatio}  ·  ${mb.lite ? 'lite' : 'full'}`,
      `${L.cache}: bitmaps ${L.light} ${mb.bm()}/${mb.cap()} · ${L.fullSeq} ${mb.kf()} · blobs ${L.light} ${nb}/${need} (${(bytes / 1048576).toFixed(1)} MB) · ${L.fullSeq} ${nf}`,
      `${L.queue}: ${L.net} ${mb.inflight()} · ${L.decode} ${mb.decoding()}  ·  ${L.speed}: ${mb.speed().toFixed(2)}`,
      `${L.decode} (${L.stat}): ${st(S.dec)}  ·  ${L.net} (${L.stat}): ${st(S.net)}`,
      `${L.frameNow}: ${mb.frame().toFixed(1)} · ${navigator.userAgent.match(/(Chrome|Firefox|Version)\/[\d.]+/)?.[0] || ''} · ${screen.width}×${screen.height}`
    ].join('\n');
  };
  const paint = () => { pre.textContent = summary(); };
  const iv = setInterval(paint, 500), lv = setInterval(() => { log.push({ t: Math.round(performance.now()), s: summary() }); if (log.length > 60) log.shift(); }, 5000);
  paint();
  async function copy() {
    const text = `${L.title}\n${summary()}\n\n${log.slice(-6).map((x) => `[${(x.t / 1000).toFixed(0)} s]\n${x.s}`).join('\n\n')}`;
    try { await navigator.clipboard.writeText(text); }
    catch (e) { const ta = h('textarea', null, text); document.body.append(ta); ta.select(); try { document.execCommand('copy'); } catch (e2) { /* sin portapapeles */ } ta.remove(); }
    msg.textContent = L.copied; setTimeout(() => { msg.textContent = ''; }, 2000);
  }
  const reset = () => { const S = mb.stats; for (const k of ['dts', 'draws', 'hss', 'dec', 'net', 'settle']) S[k].length = 0; Object.assign(s0, { drawn: S.drawn, miss: S.miss, lag: S.lag, lo: S.lo, full: S.full }); S.settle.length = 0; paint(); };
  const onKey = (e) => { if (e.altKey && e.shiftKey && e.code === 'KeyP') { e.preventDefault(); copy(); } };
  bCopy.addEventListener('click', copy); bReset.addEventListener('click', reset); document.addEventListener('keydown', onKey);
  return () => { clearInterval(iv); clearInterval(lv); document.removeEventListener('keydown', onKey); box.remove(); };
}
