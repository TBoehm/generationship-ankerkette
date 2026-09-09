import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createDisposalRegistry } from '../disposal.js';
import { createResources } from './resources.js';
import {
  STAR_COUNT,
  STAR_INNER_RADIUS,
  STAR_OUTER_RADIUS,
  buildStarfield,
  createRandom,
  starPositions,
} from './starfield.js';

function radii(positions) {
  const out = [];
  for (let i = 0; i < positions.length; i += 3) {
    out.push(Math.hypot(positions[i], positions[i + 1], positions[i + 2]));
  }
  return out;
}

describe('createRandom', () => {
  it('stays inside the unit interval', () => {
    const random = createRandom(1);
    for (let i = 0; i < 1000; i += 1) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('gives the same sequence for the same seed', () => {
    const a = createRandom(7);
    const b = createRandom(7);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('gives a different sequence for a different seed', () => {
    expect(createRandom(7)()).not.toBe(createRandom(8)());
  });
});

describe('starPositions', () => {
  it('has three coordinates per star', () => {
    expect(starPositions().length).toBe(STAR_COUNT * 3);
  });

  it('puts every star in the shell, behind anything the camera can reach', () => {
    for (const radius of radii(starPositions())) {
      expect(radius).toBeGreaterThanOrEqual(STAR_INNER_RADIUS - 1e-3);
      expect(radius).toBeLessThanOrEqual(STAR_OUTER_RADIUS + 1e-3);
    }
  });

  it('spreads the stars over the whole sky, not just one side', () => {
    const positions = starPositions();
    const octants = new Set();
    for (let i = 0; i < positions.length; i += 3) {
      octants.add(`${positions[i] > 0}${positions[i + 1] > 0}${positions[i + 2] > 0}`);
    }
    expect(octants.size).toBe(8);
  });

  it('gives the same sky twice, so a viewer who comes back finds it unchanged', () => {
    expect(Array.from(starPositions(64))).toEqual(Array.from(starPositions(64)));
  });
});

describe('buildStarfield', () => {
  it('is one points object with the positions on it', () => {
    const resources = createResources(createDisposalRegistry());
    const stars = buildStarfield({ resources });
    expect(stars).toBeInstanceOf(THREE.Points);
    expect(stars.geometry.getAttribute('position').count).toBe(STAR_COUNT);
  });

  it('registers its geometry and its material for disposal', () => {
    const registry = createDisposalRegistry();
    const resources = createResources(registry);
    buildStarfield({ resources });
    expect(registry.size()).toBe(2);
  });

  it('fades with the rest of the scene', () => {
    const resources = createResources(createDisposalRegistry());
    const stars = buildStarfield({ resources });
    expect(stars.material.transparent).toBe(true);
    expect(stars.material.userData.baseOpacity).toBeLessThan(1);
  });
});
