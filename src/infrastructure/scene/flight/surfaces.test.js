import { describe, expect, it, vi } from 'vitest';
import { SURFACE_STYLES, createSurfaceGeometry, knownSurfaceStyles, lookFor } from './surfaces.js';
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

  it('shades grey, so the palette colour is only scaled and never tinted', () => {
    const color = createSurfaceGeometry('mars', resources()).getAttribute('color');
    for (let i = 0; i < color.count; i += 1) {
      expect(color.getX(i)).toBe(color.getY(i));
      expect(color.getY(i)).toBe(color.getZ(i));
    }
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
