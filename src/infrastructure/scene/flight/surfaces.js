import * as THREE from 'three';
import { SURFACE_STYLES, surfaceShade } from '../../../domain/usecases/planetSurface.js';

/**
 * A sphere whose vertices carry their own shading, generated from the pure
 * field in the domain. No image is loaded and none is shipped: the whole
 * surface is arithmetic over the sphere's own texture coordinates.
 *
 * Which world wears which style is appearance, so the table lives here rather
 * than in the domain, next to the palette that decides their colours.
 */
const SEGMENTS = 64;
const RINGS = 40;

const SURFACE_LOOK = {
  sun: { style: 'smooth', seed: 1 },
  mercury: { style: 'cratered', seed: 2 },
  venus: { style: 'smooth', seed: 3 },
  earth: { style: 'mottled', seed: 4 },
  mars: { style: 'cratered', seed: 5 },
  jupiter: { style: 'banded', seed: 6 },
  saturn: { style: 'banded', seed: 7 },
  uranus: { style: 'smooth', seed: 8 },
  neptune: { style: 'smooth', seed: 9 },
  proxima: { style: 'mottled', seed: 10 },
  proximaB: { style: 'mottled', seed: 11 },
  proximaD: { style: 'cratered', seed: 12 },
  alphaCentauriA: { style: 'smooth', seed: 13 },
  alphaCentauriB: { style: 'smooth', seed: 14 },
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
  const { style, seed } = lookFor(id);
  const colors = new Float32Array(uv.count * 3);

  for (let i = 0; i < uv.count; i += 1) {
    const shade = surfaceShade(style, seed, uv.getX(i), uv.getY(i));
    colors[i * 3] = shade;
    colors[i * 3 + 1] = shade;
    colors[i * 3 + 2] = shade;
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return resources.geometry(geometry);
}

export { SURFACE_STYLES };
