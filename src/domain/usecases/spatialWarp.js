import { MISSION } from '../constants/missionProfile.js';

const REFERENCE_MIN = 0.002;
const REFERENCE_MAX = 300;
const SYSTEM_REFERENCE = 0.002;
const SYSTEM_SCALE = 12.6;
const BOOST_COEFFICIENT = 0.0042;
const BOOST_FLOOR = 1e-9;

/**
 * Eight orders of magnitude do not fit a scene linearly, so lengths are
 * compressed logarithmically about the centre of projection. Directions
 * survive untouched, radial and tangential magnification do not, which is
 * why circles off the centre flatten into ellipses.
 *
 * The reference length follows the distance to the nearer end of the
 * journey: the planetary system resolves at the start, the Oort cloud in
 * the middle, the Proxima system at the target. System view pins it so
 * every orbit shares one centre and stays circular.
 */
export function warpParameters(distance, mode) {
  if (mode === 'system') {
    return { referenceLength: SYSTEM_REFERENCE, scale: SYSTEM_SCALE };
  }
  const toNearerEnd = Math.min(distance, MISSION.totalDistance - distance);
  const referenceLength = Math.min(REFERENCE_MAX, Math.max(REFERENCE_MIN, toNearerEnd / 2000));
  return { referenceLength, scale: 115 / Math.log10(1 + 1e6 / referenceLength) };
}

export function warpLength(length, { referenceLength, scale }) {
  if (length < 1e-12) return 0;
  return scale * Math.log10(1 + length / referenceLength);
}

/** Warped length per unit of true length, for scaling a direction vector. */
export function warpFactor(length, parameters) {
  if (length < 1e-12) return 0;
  return warpLength(length, parameters) / length;
}

/**
 * Radii are scaled by the same factor as distances, which keeps the angular
 * diameter seen from the ship exact. Everything then falls below a pixel, so
 * small angles are lifted logarithmically.
 *
 * The lift is a maximum against the true angle, never a branch on a hand
 * written threshold: the two curves meet at 0.031492 rad, and any constant
 * rounded off that crossing silently returns radii too small just below it.
 */
export function displayRadius(radiusInAu, trueLength, warpedLength, boost) {
  const angle = radiusInAu / Math.max(trueLength, 1e-12);
  const shown = boost
    ? Math.max(angle, BOOST_COEFFICIENT * Math.log10(1 + angle / BOOST_FLOOR))
    : angle;
  return shown * warpedLength;
}
