// Datos del mundo del recorrido (coordenadas) y utilidades de interpolación, compartidos por el minimapa
// (views/recorrido.js) y la escena 3D (lib/recorrido-escena.js). Sin texto visible: los textos viven en ui-strings.js.
export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const ease = (t) => t * t * (3 - 2 * t);
export const lerp = (a, b, t) => a + (b - a) * t;

// Centro (x, z) y tamaño de la base de cada estación
export const STATIONS = [
  { x: 0, z: 0, w: 22, d: 16 },
  { x: 36, z: -24, w: 24, d: 16 },
  { x: 74, z: -6, w: 30, d: 16 }
];
export const ROAD = [[-44, 12], [0, 12], [15, 11], [20, -4], [30, -12], [50, -12], [56, -6], [59, -6]];
export const ROAD2 = [[89, -6], [140, -6]];

// Encuadres por paso: intro, taller, concesionaria, ruta, cierre. t = punto mirado, o = desplazamiento de la cámara
export const KEYS = [
  { t: [37, 0, -10], o: [44, 70, 84] },
  { t: [0.5, 1.4, -0.5], o: [16, 14, 23.5] },
  { t: [37, 1.2, -24], o: [16.5, 14.5, 24] },
  { t: [75.5, 1, -5.5], o: [19, 17, 29] },
  { t: [37, 0, -10], o: [-40, 66, 80] }
];
export const NK = KEYS.length - 1;

export const camTarget = (p) => {
  const i = Math.min(Math.floor(p), NK - 1), e = ease(p - i), a = KEYS[i].t, b = KEYS[i + 1].t;
  return [lerp(a[0], b[0], e), lerp(a[1], b[1], e), lerp(a[2], b[2], e)];
};
