import * as THREE from 'three';
import { sectionColor } from '../palette.js';
import { tint } from './resources.js';

/**
 * The stars behind the ship. A shell, not a sphere: the points sit between
 * two radii well outside the far end of the dolly, so the field never gets
 * between the camera and the hull however far the viewer pulls back.
 *
 * The distribution is seeded rather than random. The same seed gives the same
 * sky on every load and in every test, which is what lets the field be
 * asserted at all, and a viewer who returns to the ship finds the sky they
 * left rather than a new one.
 */
export const STAR_COUNT = 2400;
export const STAR_INNER_RADIUS = 2800;
export const STAR_OUTER_RADIUS = 4800;
const STAR_SIZE = 3;
const STAR_OPACITY = 0.5;
export const STAR_SEED = 0x5eed;

/** Mulberry32: small, fast, and good enough for a sky. */
export function createRandom(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Positions of the star shell, three floats per star. Evenly distributed over
 * the sphere: the polar angle comes from an inverse cosine, otherwise the
 * points would crowd at the poles.
 */
export function starPositions(count = STAR_COUNT, seed = STAR_SEED) {
  const positions = new Float32Array(count * 3);
  const random = createRandom(seed);
  for (let i = 0; i < count; i += 1) {
    const radius = STAR_INNER_RADIUS + random() * (STAR_OUTER_RADIUS - STAR_INNER_RADIUS);
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);
  }
  return positions;
}

export function buildStarfield({ resources }) {
  const geometry = resources.geometry(new THREE.BufferGeometry());
  geometry.setAttribute('position', new THREE.BufferAttribute(starPositions(), 3));

  const material = resources.pointsMaterial(tint(sectionColor('magsail'), 0.2), {
    size: STAR_SIZE,
    opacity: STAR_OPACITY,
  });

  const stars = new THREE.Points(geometry, material);
  stars.name = 'starfield';
  return stars;
}
