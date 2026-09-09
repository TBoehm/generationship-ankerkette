import { DEPARTURE_POSITION, DESTINATIONS } from '../constants/starSystem.js';

/**
 * The pure geometry of the journey: where a body sits at a given mission time
 * and where the ship sits at a given distance, all of it in the right handed
 * ecliptic frame of `starSystem.js` and all of it in astronomical units.
 *
 * Vectors are plain triples on purpose. The scene layer turns them into
 * three.js vectors and applies the one axis swap it owns, so this file can be
 * read and checked without a renderer, and the compression of `spatialWarp`
 * never meets a half converted coordinate.
 */
const TWO_PI = Math.PI * 2;
const KEPLER_ITERATIONS = 6;
/**
 * The plane spanning axis. The x axis is the reference every plane of this
 * system is measured from, and the y axis stands in for the one case where
 * that would collapse, a plane seen face on from the x axis.
 */
const REFERENCE_AXIS = { x: 1, y: 0, z: 0 };
const FALLBACK_AXIS = { x: 0, y: 1, z: 0 };
const NEARLY_PARALLEL = 0.9;

export function vector(x, y, z) {
  return { x, y, z };
}

export function add(a, b) {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function subtract(a, b) {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function scale(v, factor) {
  return { x: v.x * factor, y: v.y * factor, z: v.z * factor };
}

/** a + b * factor, the one operation orbits and paths are built from. */
export function addScaled(a, b, factor) {
  return { x: a.x + b.x * factor, y: a.y + b.y * factor, z: a.z + b.z * factor };
}

export function dot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function cross(a, b) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

export function length(v) {
  return Math.hypot(v.x, v.y, v.z);
}

export function normalize(v) {
  const size = length(v);
  return size < 1e-12 ? vector(0, 0, 0) : scale(v, 1 / size);
}

/**
 * Two orthonormal axes spanning the plane a normal defines. The first axis is
 * a reference axis with the normal component taken out, the second closes the
 * right handed set, so a growing angle turns the same way in every plane.
 */
export function orbitPlaneBasis(normal) {
  const unit = normalize(normal);
  const reference =
    Math.abs(dot(REFERENCE_AXIS, unit)) > NEARLY_PARALLEL ? FALLBACK_AXIS : REFERENCE_AXIS;
  const first = normalize(addScaled(reference, unit, -dot(reference, unit)));
  return { normal: unit, first, second: cross(unit, first) };
}

/**
 * Angle on a circular orbit. `phaseAtEpoch` is an angle in radians, measured
 * at the moment the ship casts off, and `time` counts years from there.
 */
export function circularOrbitAngle({ phaseAtEpoch, period }, time) {
  return phaseAtEpoch + (TWO_PI * time) / period;
}

export function circularOrbitPosition(orbit, plane, centre, time) {
  const angle = circularOrbitAngle(orbit, time);
  const radius = orbit.semiMajorAxis;
  return addScaled(
    addScaled(centre, plane.first, radius * Math.cos(angle)),
    plane.second,
    radius * Math.sin(angle)
  );
}

/**
 * Mean anomaly of an eccentric orbit, wrapped into one turn. Here
 * `phaseAtEpoch` is a fraction of a revolution rather than an angle, which is
 * how the published element of the pair is quoted.
 */
export function meanAnomaly({ phaseAtEpoch, period }, time) {
  const turns = TWO_PI * (time / period + phaseAtEpoch);
  return ((turns % TWO_PI) + TWO_PI) % TWO_PI;
}

/**
 * Newton on Kepler's equation. Six passes are what the legacy draft used and
 * they are plenty at an eccentricity of 0.52: the residual is below 1e-12
 * from the third pass on.
 */
export function eccentricAnomaly(mean, eccentricity, iterations = KEPLER_ITERATIONS) {
  let eccentric = mean;
  for (let pass = 0; pass < iterations; pass += 1) {
    eccentric -=
      (eccentric - eccentricity * Math.sin(eccentric) - mean) /
      (1 - eccentricity * Math.cos(eccentric));
  }
  return eccentric;
}

/** A point on the drawn ellipse, addressed by its eccentric anomaly. */
export function ellipticOrbitPoint(orbit, plane, centre, eccentric) {
  const { semiMajorAxis, eccentricity } = orbit;
  const semiMinor = semiMajorAxis * Math.sqrt(1 - eccentricity * eccentricity);
  return addScaled(
    addScaled(centre, plane.first, semiMajorAxis * (Math.cos(eccentric) - eccentricity)),
    plane.second,
    semiMinor * Math.sin(eccentric)
  );
}

export function ellipticOrbitPosition(orbit, plane, centre, time) {
  return ellipticOrbitPoint(
    orbit,
    plane,
    centre,
    eccentricAnomaly(meanAnomaly(orbit, time), orbit.eccentricity)
  );
}

/**
 * Where the ship is, given how far along the path it has come. The path is a
 * straight ray from the departure position towards proxima, which is why the
 * heading is the published unit vector and not a recomputed one.
 */
export function pathPositionAt(distance) {
  return addScaled(DEPARTURE_POSITION, DESTINATIONS.proxima.direction, distance);
}

/** Where a destination star sits, on the same ray convention as the path. */
export function starPositionOf(destination) {
  return addScaled(DEPARTURE_POSITION, destination.direction, destination.distance);
}
