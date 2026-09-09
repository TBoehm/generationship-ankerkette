import { describe, expect, it } from 'vitest';
import { FLY_TO_DURATION_MS, flyProgress, mix } from './cameraFlight.js';

describe('flyProgress', () => {
  it('starts at the old place and ends at the new one', () => {
    expect(flyProgress(0)).toBe(0);
    expect(flyProgress(FLY_TO_DURATION_MS)).toBe(1);
  });

  it('holds at the end instead of overshooting', () => {
    expect(flyProgress(FLY_TO_DURATION_MS * 4)).toBe(1);
  });

  it('never runs backwards on a stalled or reversed frame', () => {
    expect(flyProgress(-100)).toBe(0);
    expect(flyProgress(Number.NaN)).toBe(0);
  });

  it('eases in and out, so the approach neither jerks off nor slams shut', () => {
    expect(flyProgress(FLY_TO_DURATION_MS * 0.1)).toBeLessThan(0.1);
    expect(flyProgress(FLY_TO_DURATION_MS * 0.9)).toBeGreaterThan(0.9);
    expect(flyProgress(FLY_TO_DURATION_MS * 0.5)).toBeCloseTo(0.5, 6);
  });

  it('is monotonic across the whole flight', () => {
    const samples = [];
    for (let i = 0; i <= 40; i += 1) samples.push(flyProgress((FLY_TO_DURATION_MS * i) / 40));
    expect(samples).toEqual([...samples].sort((a, b) => a - b));
  });

  it('arrives at once when the viewer asked for reduced motion', () => {
    expect(flyProgress(0, { reducedMotion: true })).toBe(1);
  });
});

describe('mix', () => {
  it('returns the ends exactly', () => {
    expect(mix(4, 10, 0)).toBe(4);
    expect(mix(4, 10, 1)).toBe(10);
  });

  it('interpolates in between', () => {
    expect(mix(0, 8, 0.25)).toBeCloseTo(2, 9);
  });

  it('clamps rather than extrapolating past either end', () => {
    expect(mix(2, 6, -1)).toBe(2);
    expect(mix(2, 6, 3)).toBe(6);
  });
});
