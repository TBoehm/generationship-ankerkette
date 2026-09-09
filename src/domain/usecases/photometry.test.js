import { describe, expect, it } from 'vitest';
import { PARSEC_IN_AU, apparentMagnitude } from './photometry.js';
import { STARS } from '../constants/starSystem.js';
import { MISSION } from '../constants/missionProfile.js';

describe('apparentMagnitude', () => {
  it('turns the absolute magnitude of the sun into the one seen from the earth', () => {
    expect(apparentMagnitude(STARS.sun.absoluteMagnitude, 1)).toBeCloseTo(-26.74, 2);
  });

  it('leaves the magnitude alone at ten parsec, which is what absolute means', () => {
    expect(apparentMagnitude(7, 10 * PARSEC_IN_AU)).toBeCloseTo(7, 9);
  });

  it('keeps proxima invisible from the earth at 11.17', () => {
    const seen = apparentMagnitude(STARS.proxima.absoluteMagnitude, MISSION.totalDistance);
    expect(seen).toBeCloseTo(11.17, 2);
  });

  it('reaches the sixth magnitude exactly where the notes put it, 24798 AU out', () => {
    const seen = apparentMagnitude(
      STARS.proxima.absoluteMagnitude,
      MISSION.totalDistance - MISSION.nakedEyeDistance
    );
    expect(seen).toBeCloseTo(6, 2);
  });

  it('dims with distance, five magnitudes per factor of ten', () => {
    const near = apparentMagnitude(5, 100);
    const far = apparentMagnitude(5, 1000);
    expect(far - near).toBeCloseTo(5, 9);
  });

  it('clamps the distance rather than returning minus infinity at the centre of a star', () => {
    expect(Number.isFinite(apparentMagnitude(4.83, 0))).toBe(true);
  });
});
