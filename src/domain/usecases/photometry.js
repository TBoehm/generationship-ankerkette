/**
 * How bright a star looks from where the ship is. The absolute magnitude in
 * the star table is the brightness at ten parsec by definition, so the only
 * thing this adds is the inverse square law written in magnitudes.
 *
 * It is what decides the one fact the journey turns on: proxima stays below
 * the sixth magnitude, and therefore invisible to the naked eye, until the
 * last 24798 astronomical units. The bright point ahead is alpha Centauri A
 * for the whole crossing.
 */
export const PARSEC_IN_AU = 206264.8;

/** Below this the logarithm would run away at the centre of a star. */
const MINIMUM_DISTANCE = 1e-6;

export function apparentMagnitude(absoluteMagnitude, distanceInAu) {
  const parsecs = Math.max(distanceInAu, MINIMUM_DISTANCE) / PARSEC_IN_AU;
  return absoluteMagnitude + 5 * Math.log10(parsecs / 10);
}
