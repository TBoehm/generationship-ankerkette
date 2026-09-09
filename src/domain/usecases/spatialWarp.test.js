import { describe, expect, it } from 'vitest';
import { displayRadius, warpFactor, warpParameters, warpLength } from './spatialWarp.js';
import { MISSION } from '../constants/missionProfile.js';

describe('warpParameters', () => {
  it('pins the reference length in system view so orbits stay circular', () => {
    const p = warpParameters(MISSION.totalDistance / 4, 'system');
    expect(p.referenceLength).toBe(0.002);
  });

  it('grows the reference length towards the middle of the journey', () => {
    const near = warpParameters(1, 'chase').referenceLength;
    const middle = warpParameters(MISSION.totalDistance / 2, 'chase').referenceLength;
    expect(middle).toBeGreaterThan(near);
  });

  it('is symmetric about the midpoint, so both ends resolve alike', () => {
    const fromStart = warpParameters(5000, 'chase');
    const fromEnd = warpParameters(MISSION.totalDistance - 5000, 'chase');
    expect(fromStart.referenceLength).toBeCloseTo(fromEnd.referenceLength, 9);
  });

  it('clamps to the lower bound at either end of the journey', () => {
    expect(warpParameters(0, 'chase').referenceLength).toBe(0.002);
    expect(warpParameters(MISSION.totalDistance, 'chase').referenceLength).toBe(0.002);
  });

  it('never reaches the upper clamp, the midpoint peaks well below it', () => {
    const peak = warpParameters(MISSION.totalDistance / 2, 'chase').referenceLength;
    expect(peak).toBeCloseTo(MISSION.totalDistance / 2 / 2000, 6);
    expect(peak).toBeLessThan(300);
  });
});

describe('warpLength', () => {
  it('maps zero to zero', () => {
    expect(warpLength(0, warpParameters(1, 'chase'))).toBe(0);
  });

  it('is monotonic, so ordering along a ray survives the compression', () => {
    const p = warpParameters(1, 'chase');
    const samples = [0.01, 0.1, 1, 10, 1000, 1e5].map((l) => warpLength(l, p));
    expect(samples).toEqual([...samples].sort((a, b) => a - b));
  });

  it('compresses: eight orders of magnitude collapse into a bounded scene', () => {
    const p = warpParameters(1, 'chase');
    expect(warpLength(MISSION.totalDistance, p) / warpLength(0.0026, p)).toBeLessThan(1000);
  });
});

describe('warpFactor', () => {
  it('is the warped length per unit of true length', () => {
    const p = warpParameters(1, 'chase');
    expect(warpFactor(42, p) * 42).toBeCloseTo(warpLength(42, p), 9);
  });

  it('returns zero for a degenerate length instead of dividing by zero', () => {
    expect(warpFactor(0, warpParameters(1, 'chase'))).toBe(0);
  });
});

describe('displayRadius', () => {
  it('keeps the true angular size when sizes are not boosted', () => {
    expect(displayRadius(0.1, 1, 10, false)).toBeCloseTo(1, 9);
  });

  it('lifts sub-pixel angles so distant bodies stay visible', () => {
    expect(displayRadius(1e-7, 1, 1, true)).toBeGreaterThan(displayRadius(1e-7, 1, 1, false));
  });

  it('leaves angles above the crossover untouched', () => {
    const trueAngle = 0.05;
    expect(displayRadius(trueAngle, 1, 1, true)).toBeCloseTo(trueAngle, 9);
  });

  it('never returns less than the true angular size, at any angle', () => {
    for (let exponent = -9; exponent <= 0; exponent += 0.05) {
      const angle = Math.pow(10, exponent);
      expect(displayRadius(angle, 1, 1, true)).toBeGreaterThanOrEqual(
        displayRadius(angle, 1, 1, false) - 1e-15
      );
    }
  });

  it('boosts right up to the crossover at 1.8044 degrees, not to 1.6', () => {
    // The two branches meet where angle equals the lifted value. Solved
    // numerically that is 0.031492 rad. An angle just below it must still be
    // lifted, which a crossover taken from the rounded 1.6 degrees would miss.
    const belowCrossover = 0.0279;
    expect(displayRadius(belowCrossover, 1, 1, true)).toBeGreaterThan(belowCrossover);
    const aboveCrossover = 0.0316;
    expect(displayRadius(aboveCrossover, 1, 1, true)).toBeCloseTo(aboveCrossover, 9);
  });
});
