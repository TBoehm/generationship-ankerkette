import { describe, expect, it } from 'vitest';
import { SURFACE_STYLES, surfaceShade } from './planetSurface.js';

const GRID = [];
for (let i = 0; i < 24; i += 1) {
  for (let j = 0; j < 16; j += 1) GRID.push([i / 24, j / 16]);
}

describe('surfaceShade', () => {
  it('offers a style for every kind of world the flight shows', () => {
    expect(SURFACE_STYLES).toEqual(
      expect.arrayContaining(['banded', 'mottled', 'smooth', 'cratered'])
    );
  });

  it('is deterministic, the same world looks the same on every visit', () => {
    for (const style of SURFACE_STYLES) {
      for (const [u, v] of GRID) {
        expect(surfaceShade(style, 7, u, v)).toBe(surfaceShade(style, 7, u, v));
      }
    }
  });

  it('stays inside the unit range, so it can only shade and never invert', () => {
    for (const style of SURFACE_STYLES) {
      for (const [u, v] of GRID) {
        const shade = surfaceShade(style, 3, u, v);
        expect(shade).toBeGreaterThanOrEqual(0);
        expect(shade).toBeLessThanOrEqual(1);
      }
    }
  });

  it('closes seamlessly around the equator', () => {
    // A sphere joins longitude one back to zero. Comparing u=0 against u=1
    // would prove nothing, the wrap maps them onto the same sample. What has
    // to hold is that the step ACROSS the seam is no larger than the steps
    // either side of it, otherwise a line runs down the planet.
    const step = 1 / 512;
    for (const style of SURFACE_STYLES) {
      for (let j = 1; j < 16; j += 1) {
        const v = j / 16;
        const at = (u) => surfaceShade(style, 5, (u + 1) % 1, v);
        const seam = Math.abs(at(-step / 2) - at(step / 2));
        let ordinary = 0;
        for (let i = 1; i < 40; i += 1) {
          ordinary = Math.max(ordinary, Math.abs(at(i * step) - at((i + 1) * step)));
        }
        expect(seam, `${style} at v=${v}`).toBeLessThanOrEqual(ordinary * 1.5 + 1e-9);
      }
    }
  });

  it('gives different worlds different faces', () => {
    const a = GRID.map(([u, v]) => surfaceShade('mottled', 1, u, v));
    const b = GRID.map(([u, v]) => surfaceShade('mottled', 2, u, v));
    expect(a).not.toEqual(b);
  });

  it('uses the whole range rather than hugging the middle', () => {
    for (const style of SURFACE_STYLES) {
      const values = GRID.map(([u, v]) => surfaceShade(style, 11, u, v));
      expect(Math.max(...values) - Math.min(...values)).toBeGreaterThan(0.15);
    }
  });
});

describe('banded', () => {
  it('varies far more across the latitudes than along them, as a gas giant does', () => {
    const spread = (values) => Math.max(...values) - Math.min(...values);
    const alongLatitude = [];
    for (let i = 0; i <= 40; i += 1) alongLatitude.push(surfaceShade('banded', 4, i / 40, 0.5));
    const acrossLatitude = [];
    for (let j = 0; j <= 40; j += 1) acrossLatitude.push(surfaceShade('banded', 4, 0.5, j / 40));
    expect(spread(acrossLatitude)).toBeGreaterThan(spread(alongLatitude) * 2);
  });
});

describe('smooth', () => {
  it('darkens towards the poles instead of speckling', () => {
    const equator = surfaceShade('smooth', 9, 0.5, 0.5);
    const pole = surfaceShade('smooth', 9, 0.5, 0.02);
    expect(equator).toBeGreaterThan(pole);
  });
});

describe('mottled', () => {
  it('varies in both directions, which is what makes a rocky world read as rocky', () => {
    const spread = (values) => Math.max(...values) - Math.min(...values);
    const alongLatitude = [];
    for (let i = 0; i <= 40; i += 1) alongLatitude.push(surfaceShade('mottled', 6, i / 40, 0.5));
    const acrossLatitude = [];
    for (let j = 0; j <= 40; j += 1) acrossLatitude.push(surfaceShade('mottled', 6, 0.5, j / 40));
    expect(spread(alongLatitude)).toBeGreaterThan(0.1);
    expect(spread(acrossLatitude)).toBeGreaterThan(0.1);
  });
});

describe('cratered', () => {
  it('leaves most of the surface alone and darkens a minority of it', () => {
    const values = GRID.map(([u, v]) => surfaceShade('cratered', 8, u, v));
    const dark = values.filter((value) => value < 0.6).length;
    expect(dark).toBeGreaterThan(0);
    expect(dark).toBeLessThan(values.length / 2);
  });
});

describe('an unknown style', () => {
  it('falls back to a flat surface rather than throwing mid frame', () => {
    expect(surfaceShade('nosuchstyle', 1, 0.3, 0.7)).toBe(1);
  });
});
