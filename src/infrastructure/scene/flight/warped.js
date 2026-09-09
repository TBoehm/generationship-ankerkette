import * as THREE from 'three';
import { warpFactor } from '../../../domain/usecases/spatialWarp.js';

/**
 * Everything drawn from a list of points, clouds and lines alike, keeps two
 * buffers: the true positions in astronomical units, which never change, and
 * the compressed ones the card draws, which are rewritten whenever the ship
 * moves or the centre of the compression changes.
 *
 * Keeping the truth means the compression is applied once to an untouched
 * source rather than repeatedly to its own output, so eight orders of
 * magnitude cannot creep.
 */
export function createWarpedGeometry(resources, source) {
  const array = new Float32Array(source.length);
  const geometry = resources.geometry(new THREE.BufferGeometry());
  geometry.setAttribute('position', new THREE.BufferAttribute(array, 3));
  return { geometry, source, array };
}

export function warpInto(entry, centre, parameters) {
  const { source, array, geometry } = entry;
  for (let index = 0; index < source.length; index += 3) {
    const x = source[index] - centre.x;
    const y = source[index + 1] - centre.y;
    const z = source[index + 2] - centre.z;
    const factor = warpFactor(Math.hypot(x, y, z), parameters);
    array[index] = x * factor;
    array[index + 1] = y * factor;
    array[index + 2] = z * factor;
  }
  geometry.attributes.position.needsUpdate = true;
  geometry.computeBoundingSphere();
}
