// Mecánica Básica: arranque, idioma, tema, router por hash y búsqueda global.
import { h } from './lib/dom.js?v=5';
import { buildModel, search } from './lib/model.js?v=5';
import { plural } from './lib/text.js?v=5';
import { ico } from './lib/icons.js?v=5';
import { buildStops } from './lib/recorrido-paradas.js?v=5';
import { closeDetail } from './lib/hoja-detalle.js?v=5';
import { EXTRA } from './ui-strings.js?v=5';
import { resultGroups, totalOf } from './views/search.js?v=5';
import * as home from './views/home.js?v=5';
import * as moduleView from './views/module.js?v=5';
import * as lesson from './views/lesson.js?v=5';
import * as diagnostic from './views/diagnostic.js?v=5';
import * as glossary from './views/glossary.js?v=5';
import * as searchView from './views/search.js?v=5';
import * as credits from './views/creditos.js?v=5';
import * as notfound from './views/notfound.js?v=5';
import * as recorrido from './views/recorrido-continuo.js?v=5';

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
    const r = await fetch('data/content.json?v=5');
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
    closeDetail();
    const path = decodeURI(location.hash.replace(/^#/, '').split('?')[0]) || '/';
    let view = notfound, params = [], key = '';
    for (const [re, mod, k] of ROUTES) {
      const m = re.exec(path);
      if (m) { view = mod; params = m.slice(1); key = k; break; }
    }
    ctx.params = params;
    document.body.dataset.route = key; // antes de montar: la cabecera cambia de posición y eso mueve el layout
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

/* ---------- Cabecera (HUD), menú, paleta de búsqueda, pie ---------- */
let closePanel = () => {};
function markNav(key) {
  document.querySelectorAll('.main-nav a, .nav-panel a').forEach((a) => {
    if (a.dataset.key === key) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
}
function buildChrome(ui, lang, meta, model) {
  const root = document.documentElement;
  const isDark = () => { const t = root.getAttribute('data-theme'); return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; };
  const liveRoute = document.getElementById('live-route');
  const themeBtn = h('button', { class: 'nav-btn', type: 'button', id: 'theme' }, ico('theme'));
  const syncTheme = () => { themeBtn.setAttribute('aria-label', `${ui.theme.aria}: ${isDark() ? ui.theme.toLight : ui.theme.toDark}`); };
  themeBtn.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    store.set('mb-theme', next);
    syncTheme();
    liveRoute.textContent = next === 'dark' ? ui.theme.toDark : ui.theme.toLight;
    window.dispatchEvent(new Event('mb-theme')); // el recorrido relee el color del papel
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { syncTheme(); window.dispatchEvent(new Event('mb-theme')); });
  syncTheme();

  const langSel = meta.langs.length > 1 ? h('select', { 'aria-label': ui.langLabel, onchange: (e) => { store.set('mb-lang', e.target.value); location.reload(); } },
    meta.langs.map((l) => h('option', { value: l, selected: l === lang }, l.toUpperCase()))) : null;

  const links = (cls) => h('div', { class: cls },
    h('a', { href: `#/modulo/${meta.modulos[0]}`, 'data-key': 'lessons' }, ui.nav.lessons),
    h('a', { href: '#/diagnostico', 'data-key': 'diagnostic' }, ui.nav.diagnostic),
    h('a', { href: '#/glosario', 'data-key': 'glossary' }, ui.nav.glossary));

  // Menú desplegable (pantallas angostas): botón con aria-expanded + lista de secciones
  const menuBtn = h('button', { class: 'nav-btn nav-menu-btn', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'nav-panel', 'aria-label': ui.menu.aria }, ico('menu'));
  const menuPanel = h('nav', { class: 'nav-panel', id: 'nav-panel', 'aria-label': ui.navAria, hidden: true }, links('nav-panel-links'));
  const setMenu = (open, back) => {
    menuPanel.hidden = !open; menuBtn.setAttribute('aria-expanded', String(open));
    if (!open && back) menuBtn.focus();
  };
  menuBtn.addEventListener('click', () => setMenu(menuPanel.hidden));
  menuPanel.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menuPanel.hidden) { e.preventDefault(); setMenu(false, true); } });
  document.addEventListener('click', (e) => { if (!menuPanel.hidden && !menuPanel.contains(e.target) && !menuBtn.contains(e.target)) setMenu(false); });
  addEventListener('hashchange', () => setMenu(false));

  // Paleta de búsqueda (diálogo modal): Esc cierra, flechas recorren resultados, el recorrido sigue donde estaba
  const F = ui.find;
  const input = h('input', { id: 'q', type: 'search', placeholder: ui.search.placeholder, autocomplete: 'off', enterkeyhint: 'search' });
  const res = h('div', { class: 'find-res', id: 'q-panel' });
  const flive = h('p', { class: 'vh', role: 'status', 'aria-live': 'polite' });
  const form = h('form', { role: 'search', class: 'find-form' },
    h('label', { class: 'field', for: 'q' }, ico('search'), h('span', { class: 'vh' }, ui.search.label), input, h('span', { class: 'kbd', 'aria-hidden': 'true' }, F.hint)));
  const dlg = h('dialog', { class: 'find', 'aria-label': F.dialogLabel }, form, res, flive);
  document.body.append(dlg);
  const lessonLinks = (list) => h('section', { class: 'results-group' }, h('h3', null, F.start),
    h('ul', { class: 'results' }, list.map((s) => h('li', null, h('a', { href: `#/leccion/${s.id}` }, h('strong', null, s.l.titulo), h('small', null, s.l.resumen.length > 140 ? `${s.l.resumen.slice(0, 137)}…` : s.l.resumen))))));
  const update = () => {
    const q = input.value.trim();
    if (q.length < 2) {
      res.replaceChildren(lessonLinks(buildStops({ ui, model }).slice(0, 5)), h('p', { class: 'panel-status' }, ui.search.typeMore));
      flive.textContent = ''; return;
    }
    const r = search(model, q), n = totalOf(r), msg = n ? plural(n, ui.search.count) : ui.search.noResults;
    flive.textContent = msg;
    res.replaceChildren(h('p', { class: 'panel-status', 'aria-hidden': 'true' }, msg), ...resultGroups(r, ui, 6),
      n ? h('p', { class: 'panel-status' }, h('a', { href: `#/buscar/${encodeURIComponent(q)}` }, ui.search.viewAll)) : null);
  };
  const openFind = () => { if (dlg.open) return; setMenu(false); root.classList.add('is-locked'); dlg.showModal(); input.value = ''; update(); input.focus(); };
  closePanel = () => { if (dlg.open) dlg.close(); };
  const findBtn = h('button', { class: 'nav-btn', type: 'button', 'aria-haspopup': 'dialog', 'aria-label': F.openAria }, ico('search'), h('span', { class: 'only-wide' }, F.open), h('span', { class: 'kbd only-wide', 'aria-hidden': 'true' }, '/'));
  findBtn.addEventListener('click', openFind);
  input.addEventListener('input', update);
  dlg.addEventListener('close', () => root.classList.remove('is-locked'));
  dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.closest('a')) dlg.close(); });
  form.addEventListener('submit', (e) => { e.preventDefault(); const q = input.value.trim(); if (q) { dlg.close(); location.hash = `#/buscar/${encodeURIComponent(q)}`; } });
  dlg.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const items = [...res.querySelectorAll('a')]; if (!items.length) return;
    e.preventDefault();
    const i = items.indexOf(document.activeElement);
    items[e.key === 'ArrowDown' ? (i + 1) % items.length : (i <= 0 ? items.length - 1 : i - 1)].focus();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !/input|textarea|select/i.test(document.activeElement.tagName) && !document.querySelector('dialog[open]')) { e.preventDefault(); openFind(); }
  });

  document.getElementById('site-head').replaceChildren(
    h('div', { class: 'pill' }, h('a', { class: 'brand', href: '#/', 'aria-label': ui.brandHome }, ico('mark'), h('span', null, ui.siteTitle))),
    h('div', { class: 'head-right' },
      h('div', { class: 'pill nav' }, h('nav', { class: 'main-nav', 'aria-label': ui.navAria }, links('main-nav-links')), menuBtn, findBtn, themeBtn, langSel),
      menuPanel));

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
