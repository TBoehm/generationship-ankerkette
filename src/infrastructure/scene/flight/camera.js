import * as THREE from 'three';
import {
  FLIGHT_ORBIT_LIMITS,
  FLIGHT_SYSTEM_ORBIT_LIMITS,
  orbitPosition,
} from '../../../domain/usecases/cameraOrbit.js';

/**
 * Four ways of watching the journey, all four from the legacy draft.
 *
 * chase and system orbit a target and show the ship. front and back put the
 * eye at the ship and look along the path, which is the only way to see what
 * the crew sees: nothing ahead but alpha Centauri for four centuries.
 *
 * The near plane is 0.05 rather than the 0.02 of the draft. The compression
 * caps everything at about 115 units, so nothing is lost at the far end and
 * the depth buffer is spread over a range it can actually resolve.
 */
export const FIELD_OF_VIEW = 50;
export const NEAR_PLANE = 0.05;
export const FAR_PLANE = 6000;

export const CAMERA_MODES = Object.freeze(['chase', 'system', 'front', 'back']);
export const DEFAULT_CAMERA_MODE = 'chase';

/** Where the eye starts, and the azimuth the two aimed modes measure from. */
export const INITIAL_ORBIT = Object.freeze({ theta: 2.35, phi: 1.28, distance: 8.5 });
export const INITIAL_SYSTEM_DISTANCE = 150;

/** The ship is drawn larger in system view, where the scale is pinned. */
export const SYSTEM_SHIP_SCALE = 2.6;
/** Any point far enough down the line of sight serves as the look target. */
const LOOK_DISTANCE = 200;

export function isCameraMode(mode) {
  return CAMERA_MODES.includes(mode);
}

export function orbitsAroundTarget(mode) {
  return mode === 'chase' || mode === 'system';
}

export function limitsFor(mode) {
  return mode === 'system' ? FLIGHT_SYSTEM_ORBIT_LIMITS : FLIGHT_ORBIT_LIMITS;
}

export function createFlightCamera() {
  return new THREE.PerspectiveCamera(FIELD_OF_VIEW, 1, NEAR_PLANE, FAR_PLANE);
}

const axis = new THREE.Vector3(0, 1, 0);
const turn = new THREE.Quaternion();
const target = new THREE.Vector3();

/**
 * Place the eye. In the two orbiting modes the target is the origin of the
 * compressed scene, which is the ship in chase view and the central star in
 * system view. In the two aimed modes the eye sits at the origin, which is
 * the ship, and the drag turns the heading about the vertical.
 */
export function placeCamera(camera, { mode, orbit, heading }) {
  if (orbitsAroundTarget(mode)) {
    const { x, y, z } = orbitPosition(orbit, { x: 0, y: 0, z: 0 });
    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);
  } else {
    camera.position.set(0, 0, 0);
    turn.setFromAxisAngle(axis, orbit.theta - INITIAL_ORBIT.theta);
    target.copy(heading);
    if (mode === 'back') target.negate();
    camera.lookAt(target.applyQuaternion(turn).multiplyScalar(LOOK_DISTANCE));
  }
  camera.updateMatrixWorld();
  return camera;
}
