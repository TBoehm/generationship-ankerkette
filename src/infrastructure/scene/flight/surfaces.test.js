import { describe, expect, it, vi } from 'vitest';
import {
  SURFACE_STYLES,
  createRingGeometry,
  createSurfaceGeometry,
  hasRing,
  knownSurfaceStyles,
  lookFor,
  ringOpacity,
} from './surfaces.js';
import { PLANETS, PX_PLANETS, STARS } from '../../../domain/constants/starSystem.js';

const resources = () => ({ geometry: vi.fn((value) => value) });

const everyId = [
  ...Object.values(STARS).map((star) => star.id),
  ...PLANETS.map((planet) => planet.id),
  ...PX_PLANETS.map((planet) => planet.id),
];

describe('lookFor', () => {
  it('has a look for every body the journey draws', () => {
    for (const id of everyId) {
      expect(lookFor(id), id).toBeTruthy();
      expect(SURFACE_STYLES, id).toContain(lookFor(id).style);
    }
  });

  it('gives every body its own seed, so no two share a face', () => {
    const seeds = everyId.map((id) => lookFor(id).seed);
    expect(new Set(seeds).size).toBe(seeds.length);
  });

  it('uses only styles the domain knows', () => {
    for (const style of knownSurfaceStyles()) expect(SURFACE_STYLES).toContain(style);
  });

  it('falls back for an id it has never seen', () => {
    expect(SURFACE_STYLES).toContain(lookFor('nosuchbody').style);
  });
});

describe('createSurfaceGeometry', () => {
  it('carries one colour per vertex', () => {
    const geometry = createSurfaceGeometry('jupiter', resources());
    const color = geometry.getAttribute('color');
    expect(color).toBeTruthy();
    expect(color.count).toBe(geometry.getAttribute('position').count);
    expect(color.itemSize).toBe(3);
  });

  it('registers with the disposal registry', () => {
    const registry = resources();
    createSurfaceGeometry('earth', registry);
    expect(registry.geometry).toHaveBeenCalledTimes(1);
  });

  it('shades grey on a world with neither cap nor storm, so the palette decides the hue', () => {
    const color = createSurfaceGeometry('mercury', resources()).getAttribute('color');
    for (let i = 0; i < color.count; i += 1) {
      expect(color.getX(i)).toBeCloseTo(color.getY(i), 6);
      expect(color.getY(i)).toBeCloseTo(color.getZ(i), 6);
    }
  });

  it('tints only where a cap or a storm asks for it', () => {
    const geometry = createSurfaceGeometry('mars', resources());
    const color = geometry.getAttribute('color');
    const uv = geometry.getAttribute('uv');
    let tintedNearPole = 0;
    for (let i = 0; i < color.count; i += 1) {
      const grey = Math.abs(color.getX(i) - color.getZ(i)) < 1e-6;
      const nearPole = Math.min(uv.getY(i), 1 - uv.getY(i)) < lookFor('mars').capExtent;
      if (!grey) {
        expect(nearPole, `tinted away from the pole at v=${uv.getY(i)}`).toBe(true);
        tintedNearPole += 1;
      }
    }
    expect(tintedNearPole).toBeGreaterThan(0);
  });

  it('actually varies, a flat attribute would be a wasted buffer', () => {
    const color = createSurfaceGeometry('jupiter', resources()).getAttribute('color');
    const values = [];
    for (let i = 0; i < color.count; i += 1) values.push(color.getX(i));
    expect(Math.max(...values) - Math.min(...values)).toBeGreaterThan(0.15);
  });

  it('gives two different worlds two different surfaces', () => {
    const a = createSurfaceGeometry('mars', resources()).getAttribute('color').array;
    const b = createSurfaceGeometry('mercury', resources()).getAttribute('color').array;
    expect(Array.from(a)).not.toEqual(Array.from(b));
  });

  it('stays inside the unit range at every vertex', () => {
    for (const id of everyId) {
      const color = createSurfaceGeometry(id, resources()).getAttribute('color');
      for (let i = 0; i < color.count; i += 1) {
        expect(color.getX(i)).toBeGreaterThanOrEqual(0);
        expect(color.getX(i)).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('ring systems', () => {
  it('gives saturn a ring and nobody else', () => {
    expect(hasRing('saturn')).toBe(true);
    for (const id of everyId.filter((entry) => entry !== 'saturn')) {
      expect(hasRing(id), id).toBe(false);
    }
  });

  it('returns nothing to build for a body without one', () => {
    expect(createRingGeometry('earth', resources())).toBeNull();
  });

  it('builds an annulus that clears the planet and does not run away', () => {
    const geometry = createRingGeometry('saturn', resources());
    const position = geometry.getAttribute('position');
    let smallest = Infinity;
    let largest = 0;
    for (let i = 0; i < position.count; i += 1) {
      const radius = Math.hypot(position.getX(i), position.getY(i), position.getZ(i));
      smallest = Math.min(smallest, radius);
      largest = Math.max(largest, radius);
    }
    expect(smallest).toBeGreaterThan(1);
    expect(largest).toBeLessThan(4);
  });

  it('lies in the equatorial plane rather than standing on edge', () => {
    const position = createRingGeometry('saturn', resources()).getAttribute('position');
    for (let i = 0; i < position.count; i += 1) {
      expect(Math.abs(position.getY(i))).toBeLessThan(1e-6);
    }
  });

  it('carries banding, a flat ring reads as a disc', () => {
    const color = createRingGeometry('saturn', resources()).getAttribute('color');
    const values = [];
    for (let i = 0; i < color.count; i += 1) values.push(color.getX(i));
    expect(Math.max(...values) - Math.min(...values)).toBeGreaterThan(0.3);
  });

  it('is translucent, the planet has to show through it', () => {
    expect(ringOpacity('saturn')).toBeGreaterThan(0);
    expect(ringOpacity('saturn')).toBeLessThan(1);
    expect(ringOpacity('earth')).toBe(0);
  });
});
