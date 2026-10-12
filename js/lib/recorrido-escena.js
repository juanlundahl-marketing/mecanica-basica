// Escena 3D del recorrido (maqueta low-poly con three.js). Se carga de forma diferida desde views/recorrido.js,
// recién cuando se entra a #/recorrido. Toda la geometría es procedural: sin modelos ni texturas externas.
import { STATIONS, ROAD, ROAD2, KEYS, NK, clamp, ease, lerp } from './recorrido-datos.js';

/**
 * @param THREE  módulo three.js (ya importado)
 * @param o      { root, tour, stage, canvas, pinsBox, state, RM, labels, signs, shadows, onMissing }
 * @returns      { kick, dispose, sync, cost, info }
 */
export function createScene(THREE, o) {
  const { root: viewRoot, tour, stage, canvas, pinsBox, state, RM, labels, signs } = o;
  const root = document.documentElement;
  const disposers = [];
  let disposed = false;
    const small = () => matchMedia('(max-width: 719px), (max-width: 1024px) and (orientation: portrait)').matches; // igual que el @media de recorrido.css
    const DPR_CAP = small() ? 1.25 : 1.5;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: (devicePixelRatio || 1) < 2, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, DPR_CAP));
    const SHADOWS = !small() && !!o.shadows; // apagadas por defecto: en una GPU integrada triplican el costo por cuadro
    renderer.shadowMap.enabled = SHADOWS; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.5, 400);
    const hemi = new THREE.HemisphereLight(0xffffff, 0x8a96a0, 1.5);
    const sun = new THREE.DirectionalLight(0xffffff, 2.1);
    sun.castShadow = SHADOWS;
    if (SHADOWS) { sun.shadow.mapSize.set(1024, 1024); const sc = sun.shadow.camera; sc.left = -20; sc.right = 20; sc.top = 20; sc.bottom = -20; sc.near = 1; sc.far = 100; sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.04; }
    scene.add(hemi, sun, sun.target);

    /* Paleta desde tokens CSS */
    const PAL = {}; const mats = {}; let dirty = true;
    function readPal() { const cs = getComputedStyle(root); ['bg', 'ground', 'base', 'floor', 'white', 'light', 'mid', 'dark', 'accent', 'blue', 'glass', 'grass', 'tree', 'road', 'line'].forEach((k) => { PAL[k] = cs.getPropertyValue('--s-' + k).trim() || '#888888'; }); PAL.hemi = parseFloat(cs.getPropertyValue('--s-hemi')) || 1.5; PAL.sun = parseFloat(cs.getPropertyValue('--s-sun')) || 2; }
    readPal();
    function M(k) { if (!mats[k]) mats[k] = new THREE.MeshLambertMaterial({ color: PAL[k], flatShading: true }); return mats[k]; }
    function applyPal() {
      readPal();
      for (const k in mats) mats[k].color.set(PAL[k]);
      scene.background = new THREE.Color(PAL.bg);
      scene.fog = new THREE.Fog(PAL.bg, 95, 230);
      hemi.intensity = PAL.hemi; sun.intensity = PAL.sun;
      hemi.groundColor.set(PAL.base);
      dirty = true; kick();
    }

    /* Geometria procedural compartida */
    const BOX = new THREE.BoxGeometry(1, 1, 1);
    const CYL = {}; const cylG = (n) => CYL[n] || (CYL[n] = new THREE.CylinderGeometry(1, 1, 1, n));
    const FRUST = new THREE.CylinderGeometry(0.62, 1, 1, 4, 1); FRUST.rotateY(Math.PI / 4);
    const CONE = new THREE.ConeGeometry(1, 1, 7);
    function add(p, geo, m, x, y, z, sx, sy, sz) {
      const me = new THREE.Mesh(geo, M(m)); me.position.set(x, y, z); me.scale.set(sx, sy, sz);
      me.castShadow = SHADOWS; me.receiveShadow = SHADOWS; p.add(me); return me;
    }
    const box = (p, m, x, y, z, w, h, d) => add(p, BOX, m, x, y + h / 2, z, w, h, d); // y = base
    function cyl(p, m, x, y, z, r, h, n = 12, axis = 'y') {
      if (axis === 'y') return add(p, cylG(n), m, x, y + h / 2, z, r, h, r);
      const me = add(p, cylG(n), m, x, y, z, r, h, r); if (axis === 'x') me.rotation.z = Math.PI / 2; else me.rotation.x = Math.PI / 2; return me;
    }
    const grp = (p, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); p.add(g); return g; };
    function tree(p, x, z, s = 1) { cyl(p, 'mid', x, 0, z, 0.12 * s, 0.6 * s, 6); add(p, CONE, 'tree', x, 0.6 * s + 1.1 * s, z, 0.8 * s, 2.2 * s, 0.8 * s); }

    // Letreros: canvas propio, material sin luz (se leen igual de dia y de noche)
    function sign(p, text, x, y, z, w, h, bg, ry = 0) {
      const c = document.createElement('canvas'); c.width = Math.round(256 * w / h); c.height = 256;
      const ctx = c.getContext('2d'); ctx.fillStyle = bg; ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = '#FFFFFF'; ctx.font = '700 170px "Barlow Condensed", "Arial Narrow", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(text, c.width / 2, c.height / 2 + 8, c.width * 0.9);
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
      const me = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
      me.position.set(x, y, z); me.rotation.y = ry; p.add(me); return me;
    }

    // Auto low-poly: carroceria, habitaculo (tronco de piramide), ruedas
    function car(p, x, z, ry, m, o = {}) {
      const g = grp(p, x, o.y || 0, z); g.rotation.y = ry || 0;
      const L = 4.2, W = 1.8;
      const body = grp(g), cab = grp(g);
      box(body, m, 0, 0.32, 0, L, 0.7, W);
      box(body, m, 0.95, 1.02, 0, 1.4, 0.06, W * 0.96); // capot
      add(cab, FRUST, 'glass', -0.35, 1.02 + 0.32, 0, 2.3 / 1.414, 0.64, W * 0.92 / 1.414);
      box(cab, m, -0.42, 1.64, 0, 1.4, 0.08, W * 0.62);
      const wheels = [];
      [[L * 0.32, 1, 'fl'], [L * 0.32, -1, 'fr'], [-L * 0.32, 1, 'rl'], [-L * 0.32, -1, 'rr']].forEach(([wx, s, k]) => {
        if (o.skip === k) return;
        wheels.push(cyl(body, 'dark', wx, 0.38, s * W * 0.47, 0.38, 0.3, 12, 'z'));
        cyl(body, 'light', wx, 0.38, s * (W * 0.47 + 0.155), 0.17, 0.02, 8, 'z');
      });
      const tail = o.brake ? 'accent' : 'mid';
      box(body, tail, -L / 2 - 0.02, 0.8, W * 0.32, 0.06, 0.14, 0.34); box(body, tail, -L / 2 - 0.02, 0.8, -W * 0.32, 0.06, 0.14, 0.34);
      box(body, 'line', L / 2 + 0.02, 0.78, W * 0.32, 0.06, 0.14, 0.3); box(body, 'line', L / 2 + 0.02, 0.78, -W * 0.32, 0.06, 0.14, 0.3);
      return { g, body, cab };
    }

    /* Mundo base: suelo, camino, ciudad de volumenes (instanciada), bases de estaciones */
    const world = new THREE.Group(); scene.add(world);
    const GY = -1.4;
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), M('ground')); ground.rotation.x = -Math.PI / 2; ground.position.y = GY; ground.receiveShadow = SHADOWS; world.add(ground);
    function ribbon(pts2, width, m) {
      const curve = new THREE.CatmullRomCurve3(pts2.map(([x, z]) => new THREE.Vector3(x, GY + 0.02, z)), false, 'centripetal');
      const N = 120, pos = [], idx = [];
      for (let i = 0; i <= N; i++) { const t = i / N, c = curve.getPointAt(t), d = curve.getTangentAt(t); const nx = -d.z, nz = d.x, l = Math.hypot(nx, nz) || 1; pos.push(c.x + nx / l * width / 2, c.y, c.z + nz / l * width / 2, c.x - nx / l * width / 2, c.y, c.z - nz / l * width / 2); if (i < N) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
      const me = new THREE.Mesh(geo, M(m)); me.receiveShadow = SHADOWS; world.add(me); return curve;
    }
    const roadCurve = ribbon(ROAD, 3.4, 'road'); ribbon(ROAD2, 3.4, 'road');
    (function city() { // volumenes blancos y arboles alrededor, generados con semilla fija
      let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
      const samples = roadCurve.getSpacedPoints(80);
      const free = (x, z, r) => STATIONS.every((s) => Math.abs(x - s.x) > s.w / 2 + r + 3 || Math.abs(z - s.z) > s.d / 2 + r + 3) && samples.every((q) => Math.hypot(q.x - x, q.z - z) > r + 3.2) && !(x > 86 && Math.abs(z + 6) < r + 3.2);
      const blocks = [], trees = [];
      for (let i = 0; i < 900 && (blocks.length < 150 || trees.length < 140); i++) {
        const x = -70 + rnd() * 230, z = -90 + rnd() * 140, isTree = rnd() < 0.5, r = isTree ? 1 : 1 + rnd() * 1.6;
        if (!free(x, z, r)) continue;
        if (isTree && trees.length < 140) trees.push([x, z, 0.7 + rnd() * 0.6]); else if (!isTree && blocks.length < 150) blocks.push([x, z, r * 2, r * (1.4 + rnd()), 0.8 + rnd() * rnd() * 5]);
      }
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3();
      const bi = new THREE.InstancedMesh(BOX, M('white'), blocks.length);
      blocks.forEach(([x, z, w, d, h], i) => { bi.setMatrixAt(i, m4.compose(v.set(x, GY + h / 2, z), q, sc.set(w, h, d))); });
      bi.receiveShadow = SHADOWS; world.add(bi);
      const ti = new THREE.InstancedMesh(CONE, M('tree'), trees.length);
      trees.forEach(([x, z, s], i) => { ti.setMatrixAt(i, m4.compose(v.set(x, GY + 1.1 * s, z), q, sc.set(0.8 * s, 2.2 * s, 0.8 * s))); });
      world.add(ti);
    })();

    const stG = STATIONS.map((s, i) => {
      const g = grp(world, s.x, 0, s.z);
      box(g, 'base', 0, GY, 0, s.w, -GY - 0.06, s.d);
      box(g, i === 2 ? 'grass' : 'floor', 0, -0.06, 0, s.w, 0.06, s.d);
      return g;
    });

    /* Puntos (DOM) y despieces */
    const pins = [[], [], []], parts = [[], [], []], tags = [[], [], []];
    function pin(st, id, obj, x, y, z) {
      const src = viewRoot.querySelector('.rc-lessons a[data-id="' + id + '"]'); if (!src) return;
      const a = document.createElement('a'); a.className = 'rc-pin'; a.href = src.getAttribute('href'); a.tabIndex = -1; a.dataset.id = id;
      a.innerHTML = '<span class="rc-pin-n">' + src.querySelector('.rc-num').textContent + '</span><span class="rc-pin-l">' + src.querySelector('.rc-short').textContent + '</span>';
      pinsBox.appendChild(a); pins[st].push({ el: a, obj, local: new THREE.Vector3(x, y, z) });
    }
    function part(st, obj, off, label, lx = 0, ly = 0, lz = 0) {
      parts[st].push({ obj, base: obj.position.clone(), off: new THREE.Vector3(...off) });
      if (label) { const el = document.createElement('span'); el.className = 'rc-ex-tag'; el.textContent = label; pinsBox.appendChild(el); tags[st].push({ el, obj, local: new THREE.Vector3(lx, ly, lz) }); }
    }

    /* Estacion 1: taller */
    function taller(G) {
      box(G, 'white', 0, 0, -7.8, 22, 4.4, 0.4); box(G, 'white', -10.8, 0, 0, 0.4, 4.4, 16);
      box(G, 'light', -2, 0.002, 0, 6.2, 0.01, 3.6);
      [-1.55, 1.55].forEach((z) => { box(G, 'blue', -2, 0, z * 1.05, 0.36, 3.6, 0.36); box(G, 'mid', -2, 1.5, z * 0.55, 0.26, 0.12, 1.7); });
      const c = car(G, -2, 0, 0, 'light', { y: 1.67 });
      box(G, 'dark', -1.1, 1.66, 0, 1.2, 0.32, 0.55); // caja bajo el auto
      box(G, 'dark', -2, 1.74, 0, 2.6, 0.08, 0.12); // cardan
      // Motor sobre soporte, con despiece
      box(G, 'mid', 5.6, 0, 2.6, 2, 0.12, 1.3); box(G, 'mid', 5.6, 0, 2.6, 0.3, 0.9, 0.3);
      const carter = grp(G, 5.6, 0.9, 2.6); box(carter, 'dark', 0, 0, 0, 1.6, 0.35, 1.0);
      const bloque = grp(G, 5.6, 1.25, 2.6); box(bloque, 'light', 0, 0, 0, 1.6, 1.0, 1.0); [-0.6, -0.2, 0.2, 0.6].forEach((x) => cyl(bloque, 'mid', x, 1.0, 0, 0.16, 0.02, 10));
      const junta = grp(G, 5.6, 2.25, 2.6); box(junta, 'accent', 0, 0, 0, 1.6, 0.06, 1.0);
      const culata = grp(G, 5.6, 2.31, 2.6); box(culata, 'light', 0, 0, 0, 1.6, 0.45, 1.0); box(culata, 'blue', 0, 0.45, 0, 1.3, 0.22, 0.6);
      part(0, carter, [0, 0, 0], labels.engine.sump, 0.9, 0.18, 0.5); part(0, bloque, [0, 0.55, 0], labels.engine.block, 0.9, 0.5, 0.5);
      part(0, junta, [0, 1.15, 0], labels.engine.gasket, 0.9, 0.03, 0.5); part(0, culata, [0, 1.75, 0], labels.engine.head, 0.9, 0.3, 0.5);
      // Banco con bateria, panel de herramientas, cubiertas apiladas, carro
      box(G, 'mid', -7.4, 0, -6.6, 4, 0.92, 1.3); box(G, 'white', -7.4, 0.92, -6.6, 4.1, 0.08, 1.4);
      const bat = grp(G, -7.8, 1.0, -6.6); box(bat, 'dark', 0, 0, 0, 0.9, 0.55, 0.55); cyl(bat, 'accent', 0.25, 0.55, 0, 0.06, 0.08, 8); cyl(bat, 'light', -0.25, 0.55, 0, 0.06, 0.08, 8);
      box(G, 'light', 5, 1.3, -7.56, 4.8, 2.2, 0.08);
      [[3.4, 0.9], [3.9, 1.1], [4.4, 1.3], [4.9, 1.5]].forEach(([x, h]) => box(G, 'dark', x, 2.3 - h / 2, -7.48, 0.12, h, 0.05));
      box(G, 'dark', 5.9, 1.7, -7.48, 0.12, 1.1, 0.05); box(G, 'dark', 5.66, 2.6, -7.48, 0.6, 0.22, 0.06);
      box(G, 'blue', 6.9, 1.6, -7.48, 0.9, 0.9, 0.05);
      [0, 0.34, 0.68].forEach((y) => cyl(G, 'dark', -9, y, 5.6, 0.62, 0.32, 14));
      box(G, 'blue', 8.6, 0, -5.9, 1.4, 1.1, 0.8); box(G, 'light', 8.6, 1.1, -5.9, 1.42, 0.05, 0.82);
      pin(0, 'motor-4-tiempos', culata, 0, 1.0, 0);
      pin(0, 'frenos', c.g, 1.34, 0.9, 1.1);
      pin(0, 'transmision', G, 0.4, 0.7, 0.2);
      pin(0, 'suspension', c.g, -1.34, 0.6, 1.1);
      pin(0, 'sistema-electrico', bat, 0, 0.9, 0);
      pin(0, 'herr-kit-basico', G, 5, 3.0, -7.4);
    }

    /* Estacion 2: concesionaria y surtidor */
    function conces(G) {
      box(G, 'white', -5, 0, -7.8, 14, 4.2, 0.4); box(G, 'white', -11.8, 0, 0, 0.4, 4.2, 16);
      box(G, 'light', -5, 0.002, 0, 13.6, 0.01, 15.6);
      sign(G, signs.dealer, -5, 3.1, -7.58, 6.4, 0.9, '#1B4F8A');
      box(G, 'white', -8, 0, -3.6, 4.8, 0.16, 2.6); // tarima
      const ca = car(G, -8, -3.6, 0, 'white', { y: 0.16 });
      // Auto electrificado con despiece: bateria, carroceria, habitaculo
      const hv = car(G, -4.2, 2.4, 0, 'light');
      const pack = grp(hv.g, 0, 0, 0); box(pack, 'dark', 0, 0.12, 0, 2.6, 0.2, 1.4); box(pack, 'accent', 0, 0.32, 0.705, 2.6, 0.04, 0.02);
      part(1, pack, [0, 0, 2.6], labels.car.battery, 1.4, 0.2, 0.7);
      part(1, hv.body, [0, 0, 0], labels.car.body, 2.1, 1.0, 0.9);
      part(1, hv.cab, [0, 1.5, 0], labels.car.cabin, 0.4, 1.7, 0.9);
      // Cargador con cable
      box(G, 'white', -0.8, 0, 0.6, 0.55, 1.7, 0.4); box(G, 'blue', -0.8, 1.15, 0.81, 0.4, 0.4, 0.02);
      const cable = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.8, 1.0, 0.82), new THREE.Vector3(-1.0, 0.25, 1.25), new THREE.Vector3(-1.5, 0.4, 1.6), new THREE.Vector3(-2.6, 0.85, 1.5)]);
      const cm = new THREE.Mesh(new THREE.TubeGeometry(cable, 24, 0.05, 6), M('dark')); G.add(cm);
      // Escritorio de servicio
      box(G, 'white', 0.4, 0, 5.8, 2.6, 1.0, 0.9); box(G, 'dark', 0.1, 1.0, 5.6, 0.8, 0.5, 0.06);
      sign(G, signs.service, 0.4, 0.55, 6.26, 1.8, 0.45, '#1B4F8A');
      // Surtidor con techo y carteles
      box(G, 'road', 7.4, 0.002, 0.5, 9, 0.01, 15.6);
      [[5, -2.6], [10, -2.6], [5, 3.6], [10, 3.6]].forEach(([x, z]) => cyl(G, 'white', x, 0, z, 0.14, 3.4, 8));
      box(G, 'white', 5, 3.4, 0.5, 0.36, 0.36, 6.6); box(G, 'white', 10, 3.4, 0.5, 0.36, 0.36, 6.6); box(G, 'blue', 7.5, 3.4, 3.8, 5.4, 0.36, 0.2); box(G, 'blue', 7.5, 3.4, -2.8, 5.4, 0.36, 0.2);
      const pumps = [-0.6, 2.2].map((z) => { const pg = grp(G, 7.5, 0, z); box(pg, 'light', 0, 0, 0, 1.0, 0.2, 0.8); box(pg, 'white', 0, 0.2, 0, 0.8, 1.45, 0.55); box(pg, 'dark', 0, 1.15, 0.28, 0.55, 0.3, 0.02); box(pg, 'blue', 0, 0.2, 0.28, 0.8, 0.12, 0.02); return pg; });
      cyl(G, 'mid', 4.2, 0, -6.6, 0.12, 4.0, 8); sign(G, signs.cng, 4.2, 4.4, -6.5, 1.9, 1.0, '#C2410C'); box(G, 'mid', 4.2, 3.85, -6.6, 2.0, 1.1, 0.12);
      pin(1, 'he-tipos-hev-phev-bev-mild', ca.g, -0.4, 2.0, 0);
      pin(1, 'he-alta-tension-componentes', pack, 0, 0.5, 0.7);
      pin(1, 'he-carga-segura-casa-publica', G, -0.8, 2.1, 0.6);
      pin(1, 'ar-combustibles-nafta-gasoil', pumps[0], 0, 2.0, 0);
      pin(1, 'ar-gnc-uso-seguro', G, 4.2, 5.4, -6.5);
      pin(1, 'mant-intervalos-uso-severo', G, 0.4, 1.9, 5.8);
    }

    /* Estacion 3: la ruta */
    function ruta(G) {
      box(G, 'road', 0, 0, 0.5, 30, 0.03, 6.2);
      for (let x = -14; x < 15; x += 3) box(G, 'line', x + 0.7, 0.03, 0.5, 1.4, 0.01, 0.14);
      box(G, 'light', 0, 0, 4.5, 30, 0.04, 1.8);
      box(G, 'white', 8, 0, -6, 8, 3.2, 3.2); box(G, 'blue', 8, 3.2, -6, 8.1, 0.25, 3.3);
      box(G, 'dark', 10.2, 0, -4.38, 2.2, 2.2, 0.04); sign(G, signs.vtv, 6.2, 2.1, -4.37, 2.4, 0.9, '#1B4F8A');
      cyl(G, 'mid', -6, 0, -3.2, 0.08, 2.6, 6); box(G, 'blue', -6, 2.3, -3.2, 1.2, 0.7, 0.06);
      const c1 = car(G, -10, -0.9, 0, 'white');
      const c2 = car(G, -1.5, -0.9, 0, 'light');
      [0.5, 0.85, 1.2].forEach((r) => { const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.05, 4, 14, Math.PI / 2), M('blue')); t.rotation.z = -Math.PI / 4; t.position.set(0.9, 1.1, 0); c2.g.add(t); });
      const c3 = car(G, 8.5, 1.9, Math.PI, 'white', { brake: true });
      // Auto con pinchadura en la banquina: rueda delantera derecha en despiece
      const c4 = car(G, 1.2, 4.9, 0, 'light', { skip: 'fl' });
      const wx = 1.2 + 4.2 * 0.32, wz = 4.9 + 1.8 * 0.47;
      const disco = grp(G, wx, 0.38, wz + 0.05); cyl(disco, 'mid', 0, 0, 0, 0.26, 0.05, 14, 'z'); box(disco, 'accent', 0.1, 0.12, 0.03, 0.1, 0.14, 0.08);
      const llanta = grp(G, wx, 0.38, wz + 0.12); cyl(llanta, 'light', 0, 0, 0, 0.27, 0.22, 10, 'z');
      const cubierta = grp(G, wx, 0.38, wz + 0.12); cyl(cubierta, 'dark', 0, 0, 0, 0.38, 0.26, 14, 'z');
      part(2, disco, [0.5, 0, 0.8], labels.wheel.disc, 0, 0.3, 0); part(2, llanta, [1.5, 0, 1.6], labels.wheel.rim, 0, 0.3, 0); part(2, cubierta, [2.6, 0, 2.4], labels.wheel.tire, 0, 0.4, 0);
      const bal = add(G, new THREE.ConeGeometry(0.35, 0.6, 3), 'accent', -2.4, 0.3, 5.0, 1, 1, 0.25); bal.rotation.x = 0;
      const c5 = car(G, 0.5, -5.8, 0, 'white'); box(c5.g, 'mid', -0.4, 1.72, 0, 1.2, 0.3, 0.9);
      [[-13.5, -6.5], [-11.5, -7], [13.5, 6.8], [-13.6, 6.6], [3.5, -7.2]].forEach(([x, z], i) => tree(G, x, z, 0.9 + (i % 2) * 0.3));
      pin(2, 'diag-luces-colores-airbag-tpms', c1.g, -0.3, 2.0, 0);
      pin(2, 'diag-ruidos-pistas', c2.g, 0.6, 2.0, 0);
      pin(2, 'frenos-senales-no-manejar', c3.g, -2.0, 1.4, 0);
      pin(2, 'susp-pinchadura-cambio-rueda', c4.g, -0.6, 2.0, 0);
      pin(2, 'ar-vtv-rto-revision-tecnica', G, 8, 4.1, -6);
      pin(2, 'ar-papeles-y-revision-antes-de-viajar', c5.g, -0.4, 2.4, 0);
    }

    // Carga diferida: cada estacion se arma cuando la camara se acerca
    const BUILD = [taller, conces, ruta]; const built = [false, false, false]; const buildMs = [0, 0, 0];
    function ensure(i) { if (built[i]) return; const t = performance.now(); BUILD[i](stG[i]); built[i] = true; buildMs[i] = +(performance.now() - t).toFixed(1); dirty = true; }

    /* Camara, tamano y viewOffset (deja la escena libre de la tarjeta) */
    let W = 1, H = 1, FREE = 1; // FREE: ancho libre a la derecha de la tarjeta
    function resize() {
      W = stage.clientWidth || innerWidth; H = stage.clientHeight || innerHeight; FREE = W;
      renderer.setSize(W, H, false); camera.aspect = W / H;
      if (small()) camera.setViewOffset(W, H, 0, Math.round(H * 0.17), W, H);
      else { const cw = Math.min(440, W * 0.38) + 32; FREE = W - cw; camera.setViewOffset(W, H, -Math.round(cw / 2), 0, W, H); }
      camera.updateProjectionMatrix(); dirty = true;
    }
    const v = new THREE.Vector3(), tgtV = new THREE.Vector3();
    function placeCamera(p) {
      const i = Math.min(Math.floor(p), NK - 1), e = ease(clamp(p - i)), a = KEYS[i], b = KEYS[i + 1];
      // alejar la cámara si la pantalla es vertical o si el espacio libre junto a la tarjeta es angosto (p. ej. 1024×768)
      const asp = W / H, fa = FREE / H, far = asp < 1 ? 1 + (1 - asp) * 2.1 : fa < 0.95 ? 1 + (0.95 - fa) * 1.4 : 1;
      const lift = Math.sin(Math.PI * e) * (i === 0 || i === NK - 1 ? 0 : 1);
      tgtV.set(lerp(a.t[0], b.t[0], e), lerp(a.t[1], b.t[1], e), lerp(a.t[2], b.t[2], e));
      const k = far * (1 + lift * 0.55);
      camera.position.set(tgtV.x + lerp(a.o[0], b.o[0], e) * k, tgtV.y + lerp(a.o[1], b.o[1], e) * k + lift * 6, tgtV.z + lerp(a.o[2], b.o[2], e) * k);
      camera.lookAt(tgtV);
      sun.position.set(tgtV.x + 14, tgtV.y + 26, tgtV.z + 9); sun.target.position.copy(tgtV); sun.target.updateMatrixWorld();
    }

    function project(list, on) {
      for (const it of list) {
        it.obj.updateWorldMatrix(true, false); v.copy(it.local).applyMatrix4(it.obj.matrixWorld).project(camera);
        const x = (v.x + 1) / 2 * W, y = (1 - v.y) / 2 * H;
        const vis = on && v.z < 1 && x > 8 && x < W - 8 && y > 8 && y < H - 8;
        it.el.classList.toggle('is-on', vis);
        if (vis) {
          it.el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
          if (it.el.classList.contains('rc-pin')) { if (!it.w) it.w = it.el.offsetWidth; it.el.classList.toggle('is-flip', x + it.w > W - 8); } // rótulo a la izquierda si no entra
        }
      }
    }

    /* Bucle: solo dibuja cuando algo cambia; se pausa fuera de pantalla o con la pestaña oculta */
    const cur = { p: state.p, ex: state.ex.slice() };
    let raf = 0, last = 0, visible = true;
    const perf = { renders: 0 };
    function kick() { if (!disposed && !raf && visible && !document.hidden) raf = requestAnimationFrame(frame); }
    function frame(t) {
      raf = 0; const dt = last ? Math.min(0.1, (t - last) / 1000) : 1 / 60; last = t;
      const tp = state.p, tex = state.ex;
      const k = RM.matches ? 1 : 1 - Math.exp(-dt * 6);
      let moving = false;
      const dp = tp - cur.p; cur.p = Math.abs(dp) < 1e-4 ? tp : cur.p + dp * k; if (cur.p !== tp) moving = true;
      for (let s = 0; s < 3; s++) { const d = tex[s] - cur.ex[s]; cur.ex[s] = Math.abs(d) < 1e-3 ? tex[s] : cur.ex[s] + d * (RM.matches ? 1 : 1 - Math.exp(-dt * 8)); if (cur.ex[s] !== tex[s]) moving = true; }
      for (let s = 0; s < 3; s++) if (Math.abs(cur.p - (s + 1)) < 1.25) ensure(s);
      for (let s = 0; s < 3; s++) for (const pt of parts[s]) pt.obj.position.copy(pt.base).addScaledVector(pt.off, cur.ex[s]);
      placeCamera(cur.p);
      renderer.render(scene, camera); perf.renders++;
      const near = Math.round(cur.p) - 1, settled = Math.abs(cur.p - Math.round(cur.p)) < 0.12;
      for (let s = 0; s < 3; s++) { project(pins[s], s === near && settled); project(tags[s], s === near && cur.ex[s] > 0.6); }
      dirty = false;
      if (moving) kick(); else last = 0;
    }

    /* Oyentes (todos se quitan en dispose) */
    const listen = (target, ev, fn, opt) => { target.addEventListener(ev, fn, opt); disposers.push(() => target.removeEventListener(ev, fn, opt)); };
    // Tema: el sitio cambia data-theme o el sistema cambia prefers-color-scheme
    const mo = new MutationObserver(applyPal); mo.observe(root, { attributes: true, attributeFilter: ['data-theme'] }); disposers.push(() => mo.disconnect());
    const mq = matchMedia('(prefers-color-scheme: dark)'); listen(mq, 'change', applyPal);
    listen(window, 'resize', () => { resize(); kick(); });
    const io = new IntersectionObserver((en) => { visible = en[0].isIntersecting; if (visible) { dirty = true; kick(); } }, { rootMargin: '0px' }); io.observe(tour); disposers.push(() => io.disconnect());
    listen(document, 'visibilitychange', () => { if (!document.hidden) { last = 0; kick(); } });

    ensure(0); applyPal(); resize();
    stage.classList.add('is-ready');
    kick();

    // Ayudas de verificación: dibujar ya (sin esperar rAF) y medir el costo por cuadro con render sincrónico
    function sync() { cur.p = state.p; cur.ex = state.ex.slice(); frame(performance.now()); }
    function cost(n = 90) {
      [0, 1, 2].forEach(ensure); const gl = renderer.getContext(), px = new Uint8Array(4);
      renderer.render(scene, camera); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      const t = performance.now();
      for (let i = 0; i < n; i++) { const p = i / (n - 1) * NK; for (let s = 0; s < 3; s++) { const e = clamp(1 - Math.abs(p - (s + 1)) * 3); for (const pt of parts[s]) pt.obj.position.copy(pt.base).addScaledVector(pt.off, e); } placeCamera(p); renderer.render(scene, camera); const near = Math.round(p) - 1; for (let s = 0; s < 3; s++) project(pins[s], s === near); }
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      const ms = (performance.now() - t) / n; sync();
      return { msPorCuadro: +ms.toFixed(2), fpsTope: +(1000 / ms).toFixed(0), lienzo: W + 'x' + H, pixelRatio: renderer.getPixelRatio(), sombras: SHADOWS, llamadas: renderer.info.render.calls, triangulos: renderer.info.render.triangles };
    }
    const info = () => ({ calls: renderer.info.render.calls, tris: renderer.info.render.triangles, geos: renderer.info.memory.geometries, pixelRatio: renderer.getPixelRatio(), shadows: SHADOWS, built: built.slice(), renders: perf.renders, version: THREE.REVISION, buildMs });

    function dispose() {
      if (disposed) return; disposed = true;
      cancelAnimationFrame(raf); raf = 0;
      disposers.forEach((f) => f());
      scene.traverse((n) => {
        if (n.geometry) n.geometry.dispose();
        const m = n.material; if (m) (Array.isArray(m) ? m : [m]).forEach((x) => { if (x.map) x.map.dispose(); x.dispose(); });
      });
      Object.values(mats).forEach((m) => m.dispose());
      renderer.dispose();
      try { if (!renderer.getContext().isContextLost()) renderer.forceContextLoss(); } catch (e) { /* ya perdido */ }
      pinsBox.replaceChildren();
    }
    return { kick, dispose, sync, cost, info };
}
