/**
 * Both legacy documents drive their camera the same way: a spherical orbit
 * around a target, azimuth from the horizontal drag, polar angle from the
 * vertical one, dolly from wheel and pinch. They differ only in sensitivity,
 * in how close to the poles they allow, and in the dolly range, so the shape
 * is shared here and the numbers are passed in.
 *
 * The one deliberate change: the azimuth is wrapped into a full turn. The
 * originals let it grow without bound, which costs nothing visually but makes
 * the value meaningless to read and to test after a long session.
 */
const TWO_PI = Math.PI * 2;

export const SHIP_ORBIT_LIMITS = Object.freeze({
  dragSensitivity: 0.005,
  minPhi: 0.12,
  maxPhi: Math.PI - 0.12,
  minDistance: 180,
  maxDistance: 3000,
});

export const FLIGHT_ORBIT_LIMITS = Object.freeze({
  dragSensitivity: 0.006,
  minPhi: 0.15,
  maxPhi: Math.PI - 0.15,
  minDistance: 2.6,
  maxDistance: 120,
});

export const FLIGHT_SYSTEM_ORBIT_LIMITS = Object.freeze({
  ...FLIGHT_ORBIT_LIMITS,
  minDistance: 6,
  maxDistance: 700,
});

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function wrapAzimuth(theta) {
  const wrapped = theta % TWO_PI;
  return wrapped < 0 ? wrapped + TWO_PI : wrapped;
}

export function createOrbitState({ theta, phi, distance }, limits) {
  return {
    theta: wrapAzimuth(theta),
    phi: clamp(phi, limits.minPhi, limits.maxPhi),
    distance: clamp(distance, limits.minDistance, limits.maxDistance),
  };
}

export function orbitAfterDrag(state, dx, dy, limits) {
  const s = limits.dragSensitivity;
  return {
    theta: wrapAzimuth(state.theta - dx * s),
    phi: clamp(state.phi - dy * s, limits.minPhi, limits.maxPhi),
    distance: state.distance,
  };
}

export function orbitAfterZoom(state, factor, limits) {
  if (!Number.isFinite(factor) || factor <= 0) return state;
  return {
    theta: state.theta,
    phi: state.phi,
    distance: clamp(state.distance * factor, limits.minDistance, limits.maxDistance),
  };
}

export function orbitPosition({ theta, phi, distance }, target) {
  return {
    x: target.x + distance * Math.sin(phi) * Math.cos(theta),
    y: target.y + distance * Math.cos(phi),
    z: target.z + distance * Math.sin(phi) * Math.sin(theta),
  };
}
