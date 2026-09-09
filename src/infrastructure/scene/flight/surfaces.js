import * as THREE from 'three';
import { SURFACE_STYLES, surfaceTexel } from '../../../domain/usecases/planetSurface.js';

/**
 * A sphere whose vertices carry their own shading, generated from the pure
 * field in the domain. No image is loaded and none is shipped: the whole
 * surface is arithmetic over the sphere's own texture coordinates.
 *
 * Which world wears which style is appearance, so the table lives here rather
 * than in the domain, next to the palette that decides their colours.
 */
const SEGMENTS = 96;
const RINGS = 64;
const RING_SEGMENTS = 96;
const RING_BANDS = 12;

const SURFACE_LOOK = {
  sun: { style: 'smooth', seed: 1 },
  mercury: { style: 'cratered', seed: 2 },
  venus: { style: 'smooth', seed: 3 },
  earth: { style: 'mottled', seed: 4, capExtent: 0.12 },
  mars: { style: 'cratered', seed: 5, capExtent: 0.1 },
  jupiter: {
    style: 'banded',
    seed: 6,
    spot: { u: 0.32, v: 0.38, radius: 0.11, warmth: 0.6 },
  },
  saturn: { style: 'banded', seed: 7 },
  uranus: { style: 'smooth', seed: 8, capExtent: 0.07 },
  neptune: { style: 'smooth', seed: 9, capExtent: 0.06 },
  proxima: { style: 'mottled', seed: 10, spot: { u: 0.6, v: 0.55, radius: 0.18, warmth: 0.35 } },
  proximaB: { style: 'mottled', seed: 11, capExtent: 0.14 },
  proximaD: { style: 'cratered', seed: 12 },
  alphaCentauriA: { style: 'smooth', seed: 13 },
  alphaCentauriB: { style: 'smooth', seed: 14 },
};

/**
 * Ring systems, in radii of the body they surround. Indicative figures for the
 * look of the thing: Saturn's bright rings run from roughly 1.2 to 2.3 radii,
 * and that is the proportion worth getting right at the sizes drawn here.
 */
const RING_SYSTEMS = {
  saturn: { inner: 1.25, outer: 2.3, bands: 9, opacity: 0.75 },
};

const DEFAULT_LOOK = { style: 'mottled', seed: 0 };

export function lookFor(id) {
  return SURFACE_LOOK[id] ?? DEFAULT_LOOK;
}

export function knownSurfaceStyles() {
  return [...new Set(Object.values(SURFACE_LOOK).map((look) => look.style))];
}

/**
 * The shading is baked into a colour attribute rather than evaluated per
 * fragment. A shader would look better and cost a custom material in r128;
 * at sixty four by forty the vertices already carry more detail than the
 * body ever occupies on screen, since even Jupiter passes at a few pixels.
 */
export function createSurfaceGeometry(id, resources) {
  const geometry = new THREE.SphereGeometry(1, SEGMENTS, RINGS);
  const uv = geometry.getAttribute('uv');
  const look = lookFor(id);
  const colors = new Float32Array(uv.count * 3);

  for (let i = 0; i < uv.count; i += 1) {
    const texel = surfaceTexel(look, uv.getX(i), uv.getY(i));
    colors[i * 3] = texel.r;
    colors[i * 3 + 1] = texel.g;
    colors[i * 3 + 2] = texel.b;
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return resources.geometry(geometry);
}

export function hasRing(id) {
  return Boolean(RING_SYSTEMS[id]);
}

/**
 * A ring as a flat annulus with its own banding, drawn from both sides. It is
 * a child of the body, so it inherits every scale the warp puts on it.
 */
export function createRingGeometry(id, resources) {
  const system = RING_SYSTEMS[id];
  if (!system) return null;

  const geometry = new THREE.RingGeometry(system.inner, system.outer, RING_SEGMENTS, RING_BANDS);
  const position = geometry.getAttribute('position');
  const colors = new Float32Array(position.count * 3);

  for (let i = 0; i < position.count; i += 1) {
    const radius = Math.hypot(position.getX(i), position.getY(i));
    const across = (radius - system.inner) / (system.outer - system.inner);
    // Bands plus a gap a third of the way out, which is what the eye reads as
    // a ring system rather than as a disc.
    const band = 0.55 + 0.45 * Math.abs(Math.sin(across * Math.PI * system.bands));
    const gap = Math.abs(across - 0.34) < 0.045 ? 0.25 : 1;
    const shade = band * gap;
    colors[i * 3] = shade;
    colors[i * 3 + 1] = shade;
    colors[i * 3 + 2] = shade;
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.rotateX(-Math.PI / 2);
  return resources.geometry(geometry);
}

export function ringOpacity(id) {
  return RING_SYSTEMS[id]?.opacity ?? 0;
}

export { SURFACE_STYLES };
