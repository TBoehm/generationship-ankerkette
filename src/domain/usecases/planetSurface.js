/**
 * Procedural surface shading. Every world is generated from its own seed, so
 * nothing here loads an image and nothing has to be shipped alongside the
 * bundle. The result is a brightness in the unit range that the scene
 * multiplies into the body colour, one value per vertex.
 *
 * The field wraps in longitude. It has to: a sphere joins longitude one back
 * to zero, and a field that does not close there draws a seam straight down
 * the planet.
 */
export const SURFACE_STYLES = Object.freeze(['banded', 'mottled', 'smooth', 'cratered']);

function hash(x, y, seed) {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

/**
 * Value noise on a lattice that is periodic in x, so the field meets itself
 * cleanly when longitude comes back around.
 */
function periodicNoise(u, v, seed, periodX, scaleY) {
  const x = u * periodX;
  const y = v * scaleY;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = smoothstep(x - x0);
  const fy = smoothstep(y - y0);
  const wrap = (value) => ((value % periodX) + periodX) % periodX;
  const x0w = wrap(x0);
  const x1w = wrap(x0 + 1);

  const a = hash(x0w, y0, seed);
  const b = hash(x1w, y0, seed);
  const c = hash(x0w, y0 + 1, seed);
  const d = hash(x1w, y0 + 1, seed);

  return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
}

function fbm(u, v, seed, periodX, scaleY, octaves) {
  let sum = 0;
  let amplitude = 1;
  let total = 0;
  for (let octave = 0; octave < octaves; octave += 1) {
    const factor = 2 ** octave;
    sum += amplitude * periodicNoise(u, v, seed + octave * 17, periodX * factor, scaleY * factor);
    total += amplitude;
    amplitude *= 0.5;
  }
  return sum / total;
}

function clampUnit(value) {
  return Math.min(1, Math.max(0, value));
}

/** Bands across the latitudes, the way a gas giant sorts itself. */
function banded(seed, u, v) {
  const bands = 7 + (Math.floor(seed) % 4);
  const wobble = (fbm(u, v, seed, 4, 6, 2) - 0.5) * 0.06;
  const stripe = Math.sin((v + wobble) * Math.PI * bands);
  return clampUnit(0.72 + stripe * 0.2 + (fbm(u, v, seed + 5, 6, 3, 2) - 0.5) * 0.1);
}

/** Patches in both directions, the way a rocky world weathers. */
function mottled(seed, u, v) {
  return clampUnit(0.5 + (fbm(u, v, seed, 5, 4, 3) - 0.5) * 1.5);
}

/** A gentle fall from the equator to the poles, barely broken up. */
function smooth(seed, u, v) {
  const latitude = Math.abs(v - 0.5) * 2;
  return clampUnit(0.95 - latitude * latitude * 0.35 + (fbm(u, v, seed, 3, 2, 1) - 0.5) * 0.08);
}

/** Mostly untouched, with a scatter of darker basins. */
function cratered(seed, u, v) {
  const field = fbm(u, v, seed, 8, 6, 2);
  const basin = field < 0.42 ? (0.42 - field) * 2.2 : 0;
  return clampUnit(0.86 - basin);
}

const STYLES = { banded, mottled, smooth, cratered };

/**
 * @param style one of SURFACE_STYLES
 * @param seed  a number, one per world
 * @param u     longitude, 0 to 1, wrapping
 * @param v     latitude, 0 at one pole and 1 at the other
 */
export function surfaceShade(style, seed, u, v) {
  const build = STYLES[style];
  if (!build) return 1;
  const wrapped = u - Math.floor(u);
  return build(seed, wrapped, Math.min(1, Math.max(0, v)));
}

const CAP_SOFTNESS = 0.55;
const SPOT_DARKENING = 0.18;

export function polarCapStrength(v, extent) {
  if (!extent) return 0;
  const toPole = Math.min(v, 1 - v);
  const edge = extent;
  if (toPole >= edge) return 0;
  const t = 1 - toPole / edge;
  return smoothstep(Math.min(1, t / CAP_SOFTNESS));
}

/** Distance to the spot, measured the short way around the longitude. */
function spotStrength(spot, u, v) {
  if (!spot) return 0;
  const du = Math.abs(u - spot.u);
  const wrapped = Math.min(du, 1 - du);
  const dv = v - spot.v;
  const reach = Math.hypot(wrapped, dv) / spot.radius;
  if (reach >= 1) return 0;
  return smoothstep(1 - reach);
}

/**
 * The full look of one point on a world: the style's own shading, a polar cap
 * washed towards white, and an optional storm running warm. The result is a
 * multiplier per channel, so the palette still decides the hue and this only
 * shapes it.
 */
export function surfaceTexel(look, u, v) {
  const wrapped = u - Math.floor(u);
  const clamped = Math.min(1, Math.max(0, v));
  const shade = surfaceShade(look.style, look.seed, wrapped, clamped);

  let r = shade;
  let g = shade;
  let b = shade;

  const cap = polarCapStrength(clamped, look.capExtent);
  if (cap > 0) {
    // Ice reads as bright and slightly cold, not merely as a lighter ground.
    r = r + (0.94 - r) * cap;
    g = g + (0.97 - g) * cap;
    b = b + (1 - b) * cap;
  }

  const storm = spotStrength(look.spot, wrapped, clamped);
  if (storm > 0) {
    const warmth = (look.spot.warmth ?? 0.5) * storm;
    const darken = 1 - SPOT_DARKENING * storm;
    r = clampUnit(r * darken * (1 + warmth * 0.45));
    g = clampUnit(g * darken * (1 - warmth * 0.1));
    b = clampUnit(b * darken * (1 - warmth * 0.5));
  }

  return { r: clampUnit(r), g: clampUnit(g), b: clampUnit(b) };
}
