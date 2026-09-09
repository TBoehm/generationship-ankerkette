import { describe, expect, it } from 'vitest';
import { SURFACE_STYLES, polarCapStrength, surfaceShade, surfaceTexel } from './planetSurface.js';

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

describe('surfaceTexel', () => {
  const plain = { style: 'mottled', seed: 3 };

  it('returns a multiplier per channel', () => {
    const texel = surfaceTexel(plain, 0.3, 0.6);
    for (const channel of ['r', 'g', 'b']) {
      expect(texel[channel]).toBeGreaterThanOrEqual(0);
      expect(texel[channel]).toBeLessThanOrEqual(1);
    }
  });

  it('is grey where nothing else is asked for, so the palette decides the hue', () => {
    const texel = surfaceTexel(plain, 0.3, 0.6);
    expect(texel.r).toBe(texel.g);
    expect(texel.g).toBe(texel.b);
  });

  it('agrees with the plain shade when there is no cap and no spot', () => {
    expect(surfaceTexel(plain, 0.42, 0.18).r).toBeCloseTo(
      surfaceShade('mottled', 3, 0.42, 0.18),
      9
    );
  });

  it('is deterministic', () => {
    const look = {
      style: 'banded',
      seed: 2,
      capExtent: 0.2,
      spot: { u: 0.4, v: 0.6, radius: 0.1 },
    };
    expect(surfaceTexel(look, 0.4, 0.6)).toEqual(surfaceTexel(look, 0.4, 0.6));
  });
});

describe('polar caps', () => {
  const capped = { style: 'cratered', seed: 4, capExtent: 0.18 };

  it('brightens both poles and leaves the equator alone', () => {
    const equator = surfaceTexel(capped, 0.5, 0.5);
    const north = surfaceTexel(capped, 0.5, 0.99);
    const south = surfaceTexel(capped, 0.5, 0.01);
    expect(north.r).toBeGreaterThan(equator.r);
    expect(south.r).toBeGreaterThan(equator.r);
  });

  it('washes the cap towards white rather than merely brightening the ground', () => {
    const cap = surfaceTexel({ ...capped, style: 'mottled' }, 0.5, 0.995);
    expect(cap.b).toBeGreaterThanOrEqual(cap.r);
    expect(cap.b).toBeGreaterThan(0.9);
  });

  it('fades in rather than drawing a hard rim', () => {
    // The blended value carries the ground under the cap, which varies on its
    // own, so the falloff is asserted on the cap strength itself.
    const extent = 0.18;
    const at = (v) => polarCapStrength(v, extent);
    expect(at(0.995)).toBeGreaterThanOrEqual(at(0.95));
    expect(at(0.95)).toBeGreaterThan(at(0.9));
    expect(at(0.9)).toBeGreaterThan(at(0.85));
    expect(at(0.85)).toBeGreaterThan(0);
  });

  it('does nothing without an extent', () => {
    const texel = surfaceTexel({ style: 'cratered', seed: 4 }, 0.5, 0.99);
    expect(texel.r).toBe(texel.b);
  });
});

describe('polarCapStrength', () => {
  it('is full at the pole and gone at the equator', () => {
    expect(polarCapStrength(1, 0.2)).toBe(1);
    expect(polarCapStrength(0, 0.2)).toBe(1);
    expect(polarCapStrength(0.5, 0.2)).toBe(0);
  });

  it('is zero everywhere without an extent', () => {
    for (let i = 0; i <= 20; i += 1) expect(polarCapStrength(i / 20, 0)).toBe(0);
  });

  it('never leaves the unit range', () => {
    for (let i = 0; i <= 40; i += 1) {
      const value = polarCapStrength(i / 40, 0.3);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  it('reaches exactly as far as the extent asks and no further', () => {
    // The boundary itself is a float coin toss, so it is checked either side.
    expect(polarCapStrength(0.81, 0.18)).toBe(0);
    expect(polarCapStrength(0.83, 0.18)).toBeGreaterThan(0);
  });

  it('is symmetric between the two poles', () => {
    for (let i = 0; i <= 20; i += 1) {
      const v = i / 20;
      expect(polarCapStrength(v, 0.25)).toBeCloseTo(polarCapStrength(1 - v, 0.25), 12);
    }
  });
});

describe('a storm spot', () => {
  const look = {
    style: 'banded',
    seed: 6,
    spot: { u: 0.35, v: 0.62, radius: 0.09, warmth: 0.55 },
  };

  it('runs warm at its centre, red up and blue down', () => {
    const centre = surfaceTexel(look, 0.35, 0.62);
    expect(centre.r).toBeGreaterThan(centre.b);
  });

  it('leaves the far side of the world untouched', () => {
    const away = surfaceTexel(look, 0.85, 0.3);
    expect(away.r).toBe(away.b);
  });

  it('reaches across the seam, a spot near the edge is still round', () => {
    const near = { ...look, spot: { ...look.spot, u: 0.01 } };
    const left = surfaceTexel(near, 0.99, 0.62);
    expect(left.r).toBeGreaterThan(left.b);
  });

  it('fades outwards instead of stamping a disc', () => {
    const warmth = (u) => {
      const texel = surfaceTexel(look, u, 0.62);
      return texel.r - texel.b;
    };
    expect(warmth(0.35)).toBeGreaterThan(warmth(0.39));
    expect(warmth(0.39)).toBeGreaterThan(warmth(0.44));
  });
});
