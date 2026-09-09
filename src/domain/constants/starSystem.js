import { LIGHT_YEAR_IN_AU } from './astronomy.js';

/**
 * Every body the flight scene draws, transcribed from the legacy single file
 * draft and cross checked against the target system section of the design
 * notes. Four things were left behind on purpose:
 *
 * - the hex colors, replaced by a stable key that palette.js resolves,
 * - the German names, replaced by i18n keys of the shape
 *   `flight.body.<id>.name`,
 * - the three.js vectors, replaced by plain triples, so the scene layer keeps
 *   the axis convention to itself,
 * - the ready made scene positions, which are a function of the mission time
 *   and belong in a use case, not in a table.
 *
 * Coordinate convention: right handed ecliptic, x towards the vernal equinox,
 * z towards the ecliptic north pole, lengths in astronomical units. The scene
 * is y up and maps (x, y, z) to (x, z, -y), which is the only place that
 * conversion may live.
 *
 * Angles are radians unless the name says degrees, periods are years unless
 * the name says days, radii are kilometres, distances are astronomical units.
 */

/** Days of a Julian year, the divisor that turns an orbital period into years. */
const JULIAN_YEAR_IN_DAYS = 365.25;

function body({ id, colorKey, radiusKm, absoluteMagnitude = null }) {
  return Object.freeze({
    id,
    nameKey: `flight.body.${id}.name`,
    colorKey,
    radiusKm,
    absoluteMagnitude,
  });
}

function planet({ id, colorKey, semiMajorAxis, phaseAtEpoch, period, radiusKm }) {
  return Object.freeze({
    ...body({ id, colorKey, radiusKm }),
    semiMajorAxis,
    phaseAtEpoch,
    period,
  });
}

/**
 * A planet whose published period is a figure in days. The year follows from
 * the day, not the other way round, and both are kept.
 */
function shortPeriodPlanet({ periodDays, ...rest }) {
  return Object.freeze({
    ...planet({ ...rest, period: periodDays / JULIAN_YEAR_IN_DAYS }),
    periodDays,
  });
}

/**
 * The eight planets, outward from the sun. `phaseAtEpoch` is the true anomaly
 * at the moment the ship casts off, chosen so the inner planets are spread
 * around the sun rather than lined up, the rest is measured.
 */
export const PLANETS = Object.freeze([
  planet({
    id: 'mercury',
    colorKey: 'mercury',
    semiMajorAxis: 0.387,
    phaseAtEpoch: 0.4,
    period: 0.2408,
    radiusKm: 2440,
  }),
  planet({
    id: 'venus',
    colorKey: 'venus',
    semiMajorAxis: 0.723,
    phaseAtEpoch: 2.1,
    period: 0.6152,
    radiusKm: 6052,
  }),
  planet({
    id: 'earth',
    colorKey: 'earth',
    semiMajorAxis: 1.0,
    phaseAtEpoch: 0.0,
    period: 1.0,
    radiusKm: 6371,
  }),
  planet({
    id: 'mars',
    colorKey: 'mars',
    semiMajorAxis: 1.524,
    phaseAtEpoch: 3.6,
    period: 1.8808,
    radiusKm: 3390,
  }),
  planet({
    id: 'jupiter',
    colorKey: 'jupiter',
    semiMajorAxis: 5.204,
    phaseAtEpoch: 1.2,
    period: 11.862,
    radiusKm: 69911,
  }),
  planet({
    id: 'saturn',
    colorKey: 'saturn',
    semiMajorAxis: 9.583,
    phaseAtEpoch: 4.4,
    period: 29.457,
    radiusKm: 58232,
  }),
  planet({
    id: 'uranus',
    colorKey: 'uranus',
    semiMajorAxis: 19.19,
    phaseAtEpoch: 2.7,
    period: 84.021,
    radiusKm: 25362,
  }),
  planet({
    id: 'neptune',
    colorKey: 'neptune',
    semiMajorAxis: 30.07,
    phaseAtEpoch: 5.3,
    period: 164.79,
    radiusKm: 24622,
  }),
]);

/**
 * The two planets of Proxima, both confirmed by NIRPS in 2025.
 *
 * The 2020 candidate at roughly 1.5 AU was disproved by the same measurements.
 * It is absent here and a test keeps it absent, because a drawn planet that
 * does not exist is the one error a viewer cannot check.
 *
 * The published period is a figure in days, so it is kept as such and the year
 * follows from it, not the other way round.
 */
export const PX_PLANETS = Object.freeze([
  shortPeriodPlanet({
    id: 'proximaD',
    colorKey: 'proximaD',
    semiMajorAxis: 0.02881,
    phaseAtEpoch: 1.1,
    periodDays: 5.12338,
    radiusKm: 5160,
  }),
  shortPeriodPlanet({
    id: 'proximaB',
    colorKey: 'proximaB',
    semiMajorAxis: 0.04856,
    phaseAtEpoch: 4.0,
    periodDays: 11.186,
    radiusKm: 7000,
  }),
]);

/** Habitable zone of Proxima, drawn as the pair of green rings. */
export const PROXIMA_HABITABLE_ZONE = Object.freeze({ inner: 0.042, outer: 0.082 });

/**
 * Alpha Centauri B around A. The eccentricity of 0.52 swings the separation
 * between 11.3 and 35.7 AU, which is why the pair is drawn as an ellipse and
 * not as a circle. `phaseAtEpoch` is a fraction of one revolution, added to
 * the mean anomaly, not an angle.
 */
export const ALPHA_CENTAURI_B_ORBIT = Object.freeze({
  semiMajorAxis: 23.52,
  eccentricity: 0.5179,
  period: 79.91,
  phaseAtEpoch: 0.18,
});

/**
 * Radii and absolute magnitudes. The absolute magnitude is what the flight
 * readout turns into an apparent one, and it is the reason Proxima stays
 * invisible to the naked eye until the last twenty thousand astronomical
 * units: 15.60 at ten parsec is 11.17 seen from earth.
 */
export const STARS = Object.freeze({
  sun: body({ id: 'sun', colorKey: 'sun', radiusKm: 696000, absoluteMagnitude: 4.83 }),
  proxima: body({ id: 'proxima', colorKey: 'proxima', radiusKm: 107000, absoluteMagnitude: 15.6 }),
  alphaCentauriA: body({
    id: 'alphaCentauriA',
    colorKey: 'alphaCentauriA',
    radiusKm: 851000,
    absoluteMagnitude: 4.38,
  }),
  alphaCentauriB: body({
    id: 'alphaCentauriB',
    colorKey: 'alphaCentauriB',
    radiusKm: 600000,
    absoluteMagnitude: 5.71,
  }),
});

function destination({ id, eclipticLatitude, eclipticLongitude, distanceLightYears, direction }) {
  return Object.freeze({
    id,
    eclipticLatitude,
    eclipticLongitude,
    distanceLightYears,
    distance: distanceLightYears * LIGHT_YEAR_IN_AU,
    direction: Object.freeze(direction),
  });
}

/**
 * The two points the flight aims at. The unit vectors are the published five
 * decimal figures derived from right ascension and declination, kept verbatim
 * rather than recomputed, so the drawn line matches the one in the design
 * notes. They are 2.185 degrees apart on the sky and 12058 AU apart in space.
 *
 * The path runs 44.8 degrees below the ecliptic. That is why no planet ever
 * comes near it, and why the planet orbits stay off to one side.
 */
export const DESTINATIONS = Object.freeze({
  proxima: destination({
    id: 'proxima',
    eclipticLatitude: -44.76,
    eclipticLongitude: 239.11,
    distanceLightYears: 4.2465,
    direction: { x: -0.36447, y: -0.60934, z: -0.70418 },
  }),
  alphaCentauri: destination({
    id: 'alphaCentauri',
    eclipticLatitude: -42.59,
    eclipticLongitude: 239.48,
    distanceLightYears: 4.3441,
    direction: { x: -0.37386, y: -0.63417, z: -0.6768 },
  }),
});

/**
 * Where the flight path starts: one astronomical unit from the sun, on the
 * x axis. The ship is towed out of the earth and moon system, so the first
 * point of the path is the orbit of earth, not the centre of the sun.
 */
export const DEPARTURE_POSITION = Object.freeze({ x: 1, y: 0, z: 0 });

/**
 * Normals of the three orbit planes, as ecliptic triples that the consumer
 * normalises. The ecliptic itself is flat by definition. The tilt of the
 * Proxima system and of the pair are not measured, they are a legibility
 * choice of the drawing: seen edge on, a system of two planets is a line.
 */
export const ORBIT_PLANE_NORMALS = Object.freeze({
  ecliptic: Object.freeze({ x: 0, y: 0, z: 1 }),
  proxima: Object.freeze({ x: 0.26, y: 0.42, z: 1 }),
  alphaCentauriB: Object.freeze({ x: 0.28, y: -0.22, z: 1 }),
});
