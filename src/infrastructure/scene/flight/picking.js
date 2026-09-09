import * as THREE from 'three';

/**
 * Raycast picking with the one fix the legacy drafts needed: in r128
 * `intersectObjects` reports hits under a hidden group, because it tests the
 * object and never asks about its parents. Filtering on `hit.object.visible`
 * catches only half of that. The walk goes up the chain to the root.
 *
 * The glow of a body is a point and an orbit is a line, and neither has an
 * extent to hit, so the raycaster is given a threshold. It is a world length,
 * taken from the dolly distance, which keeps the tap target at roughly a
 * constant angle: about two degrees, a thumb on a phone.
 *
 * The line threshold is the narrower of the two. An orbit is long, and a
 * generous one would have it swallow taps meant for whatever lies in front
 * of it.
 */
export const LINE_PICK_FACTOR = 0.35;
export const PICK_ANGLE = 0.035;

export function isVisibleThrough(object, root) {
  let node = object;
  while (node) {
    if (!node.visible) return false;
    if (node === root) return true;
    node = node.parent;
  }
  return true;
}

export function createPicker() {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  return function pick({ x, y, viewport, camera, root, targets, threshold }) {
    if (!viewport.width || !viewport.height) return null;
    pointer.set((x / viewport.width) * 2 - 1, -(y / viewport.height) * 2 + 1);
    raycaster.params.Points.threshold = threshold;
    raycaster.params.Line.threshold = threshold * LINE_PICK_FACTOR;
    raycaster.setFromCamera(pointer, camera);
    for (const hit of raycaster.intersectObjects(targets, false)) {
      if (isVisibleThrough(hit.object, root)) return hit.object;
    }
    return null;
  };
}
