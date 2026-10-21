// Mecánica Básica: arranque, idioma, tema, router por hash y búsqueda global.
import { h, svg } from './lib/dom.js';
import { buildModel, search } from './lib/model.js';
import { plural } from './lib/text.js';
import { LOGO } from './lib/icons.js';
import { EXTRA } from './ui-strings.js';
import { resultGroups, totalOf } from './views/search.js';
import * as home from './views/home.js';
import * as moduleView from './views/module.js';
import * as lesson from './views/lesson.js';
import * as diagnostic from './views/diagnostic.js';
import * as glossary from './views/glossary.js';
import * as searchView from './views/search.js';
import * as credits from './views/creditos.js';
import * as notfound from './views/notfound.js';
import * as recorrido from './views/recorrido-continuo.js';

const ROUTES = [
  [/^\/?$/, home, 'home'],
  [/^\/modulo\/([\w-]+)\/?$/, moduleView, 'lessons'],
  [/^\/leccion\/([\w-]+)\/?$/, lesson, 'lessons'],
  [/^\/recorrido\/?$/, recorrido, 'tour'],
  [/^\/diagnostico\/?$/, diagnostic, 'diagnostic'],
  [/^\/glosario(?:\/([\w-]+))?\/?$/, glossary, 'glossary'],
  [/^\/creditos\/?$/, credits, 'credits'],
  [/^\/buscar(?:\/(.*))?$/, searchView, 'search']
];

const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } }
};
const merge = (a, b) => {
  const out = { ...a };
  for (const [k, v] of Object.entries(b || {})) out[k] = v && typeof v === 'object' && !Array.isArray(v) ? merge(a?.[k], v) : v;
  return out;
};

async function boot() {
  const main = document.getElementById('main');
  let content;
  try {
    const r = await fetch('data/content.json');
    if (!r.ok) throw new Error(r.status);
    content = await r.json();
  } catch (e) {
    main.replaceChildren(h('p', { class: 'wrap view' }, 'No se pudo cargar el contenido. Probá recargar la página.'));
    console.error(e);
    return;
  }
  const { meta } = content;

  // Idioma: ?lang= > localStorage > navegador > default
  const wanted = new URLSearchParams(location.search).get('lang') || store.get('mb-lang') || (navigator.language || '').slice(0, 2);
  const lang = meta.langs.includes(wanted) ? wanted : meta.defaultLang;
  document.documentElement.lang = lang === 'es' ? 'es-AR' : lang;
  const data = content[lang];
  const ui = merge(EXTRA[lang] || EXTRA[meta.defaultLang], data.ui);
  data.ui = ui;
  const model = buildModel(meta, data);

  buildChrome(ui, lang, meta, model);
  const live = document.getElementById('live-route');
  const siteTitle = ui.siteTitle;
  let cleanup = () => {};
  let first = true;

  const ctx = {
    data, meta, ui, lang, model, params: [],
    setTitle(t) { document.title = t ? `${t} · ${siteTitle}` : siteTitle; },
    go(hash) { location.replace(hash); },
    notFound(el) { return notfound.render(el, ctx); }
  };

  function route() {
    cleanup();
    cleanup = () => {};
    document.body.dataset.route = '';
    closePanel();
    const path = decodeURI(location.hash.replace(/^#/, '').split('?')[0]) || '/';
    let view = notfound, params = [], key = '';
    for (const [re, mod, k] of ROUTES) {
      const m = re.exec(path);
      if (m) { view = mod; params = m.slice(1); key = k; break; }
    }
    ctx.params = params;
    const result = view.render(main, ctx);
    cleanup = typeof result === 'function' ? result : () => {};
    markNav(key);
    document.querySelectorAll('.reveal').forEach((n) => n.classList.add('in'));
    if (!first) {
      if (!path.startsWith('/glosario/')) { window.scrollTo(0, 0); main.focus({ preventScroll: true }); } // el glosario posiciona su propio foco
      live.textContent = document.title;
    }
    first = false;
  }
  window.addEventListener('hashchange', route);
  route();
}

/* ---------- Cabecera, búsqueda, pie ---------- */
let closePanel = () => {};
function markNav(key) {
  document.querySelectorAll('.main-nav a').forEach((a) => {
    if (a.dataset.key === key) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
}
function buildChrome(ui, lang, meta, model) {
  const root = document.documentElement;
  const isDark = () => { const t = root.getAttribute('data-theme'); return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; };
  const themeBtn = h('button', { class: 'btn', type: 'button', id: 'theme', 'aria-label': ui.theme.aria }, '');
  const syncTheme = () => { themeBtn.textContent = isDark() ? ui.theme.toLight : ui.theme.toDark; themeBtn.setAttribute('aria-label', `${ui.theme.aria}: ${themeBtn.textContent}`); };
  themeBtn.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    store.set('mb-theme', next);
    syncTheme();
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', syncTheme);
  syncTheme();

  const langSel = meta.langs.length > 1 ? h('select', { 'aria-label': ui.langLabel, onchange: (e) => { store.set('mb-lang', e.target.value); location.reload(); } },
    meta.langs.map((l) => h('option', { value: l, selected: l === lang }, l.toUpperCase()))) : null;

  const nav = h('nav', { class: 'main-nav', 'aria-label': ui.navAria },
    h('a', { href: '#/', 'data-key': 'home' }, ui.nav.home),
    h('a', { href: `#/modulo/${meta.modulos[0]}`, 'data-key': 'lessons' }, ui.nav.lessons),
    h('a', { href: '#/recorrido', 'data-key': 'tour' }, ui.nav.tour),
    h('a', { href: '#/diagnostico', 'data-key': 'diagnostic' }, ui.nav.diagnostic),
    h('a', { href: '#/glosario', 'data-key': 'glossary' }, ui.nav.glossary));

  document.getElementById('site-head').replaceChildren(h('div', { class: 'wrap head-row' },
    h('a', { class: 'logo', href: '#/', 'aria-label': ui.brandHome }, svg(LOGO), ui.siteTitle), nav,
    h('div', { class: 'head-tools' }, langSel, themeBtn)));

  // Búsqueda
  const input = h('input', { id: 'q', type: 'search', placeholder: ui.search.placeholder, autocomplete: 'off', enterkeyhint: 'search', 'aria-controls': 'q-panel' });
  const panel = h('div', { class: 'search-panel', id: 'q-panel', hidden: true });
  const live = document.getElementById('live-search');
  const form = h('form', { class: 'search-form', role: 'search' },
    h('label', { class: 'label', for: 'q' }, ui.search.label), input,
    h('button', { class: 'btn btn-primary', type: 'submit' }, ui.search.submit), panel);
  document.getElementById('search-bar').replaceChildren(h('div', { class: 'wrap' }, form));
  closePanel = () => { panel.hidden = true; };
  const update = () => {
    const q = input.value.trim();
    if (q.length < 2) { panel.hidden = true; live.textContent = ''; return; }
    const res = search(model, q);
    const n = totalOf(res);
    const msg = n ? plural(n, ui.search.count) : ui.search.noResults;
    live.textContent = msg;
    panel.replaceChildren(...[h('p', { class: 'panel-status', 'aria-hidden': 'true' }, msg),
      ...resultGroups(res, ui, 5),
      n ? h('p', { class: 'panel-status' }, h('a', { href: `#/buscar/${encodeURIComponent(q)}` }, ui.search.viewAll)) : null].filter(Boolean));
    panel.hidden = false;
  };
  input.addEventListener('input', update);
  input.addEventListener('focus', () => { if (input.value.trim().length >= 2) update(); });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (q) location.hash = `#/buscar/${encodeURIComponent(q)}`;
  });
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) { input.focus(); closePanel(); } // foco primero: el handler de focus reabriría el panel
    if (e.key === 'ArrowDown' && !panel.hidden && e.target === input) { e.preventDefault(); panel.querySelector('a')?.focus(); }
  });
  document.addEventListener('click', (e) => { if (!form.contains(e.target)) closePanel(); });
  form.addEventListener('focusout', (e) => { if (e.relatedTarget && !form.contains(e.relatedTarget)) closePanel(); });
  panel.addEventListener('click', (e) => { if (e.target.closest('a')) { closePanel(); } });

  // Pie
  document.getElementById('site-foot').replaceChildren(h('div', { class: 'wrap' },
    h('section', { 'aria-labelledby': 'legal-t' },
      h('h2', { id: 'legal-t' }, ui.legal.title || ui.footer.legalTitle), h('p', { class: 'legal' }, ui.legal.text)),
    h('p', { class: 'legal-small' }, `${ui.footer.text} ${ui.footer.rights}`),
    h('p', { class: 'legal-small' }, h('a', { href: '#/creditos' }, ui.footer.creditsLink)),
    ui.footer.sources ? h('p', { class: 'legal-small' }, ui.footer.sources) : null));
  document.getElementById('skip').textContent = ui.skip;
}

boot();
