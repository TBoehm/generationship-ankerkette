import * as THREE from 'three';

/**
 * The one axis swap of this project. The domain works in the right handed
 * ecliptic frame, x towards the vernal equinox and z towards the ecliptic
 * north pole; the scene is y up. `starSystem.js` names this file's job: the
 * conversion lives here and nowhere else.
 */
export function toScene({ x, y, z }, target = new THREE.Vector3()) {
  return target.set(x, z, -y);
}

/** The same swap, straight into a flat buffer of scene coordinates. */
export function writeScene(array, index, { x, y, z }) {
  array[index * 3] = x;
  array[index * 3 + 1] = z;
  array[index * 3 + 2] = -y;
  return array;
}
