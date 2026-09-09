import * as THREE from 'three';

/**
 * Turning a tap into a selection.
 *
 * The legacy document filtered the raycast hits with `hit.object.visible`.
 * That is the bug this module exists to not repeat. In r128 the raycaster
 * walks the graph itself and skips a subtree whose root is invisible only
 * when it is asked to; `intersectObjects(list, false)` is handed a flat list
 * of meshes and never sees their parents at all. Hiding the hull mantle
 * therefore hid it from the eye and left it in front of everything for the
 * finger. The fix is to walk the parent chain up to the root.
 *
 * The opacity floor is the second half of the same idea: something faded to
 * nearly nothing must not swallow the tap either.
 */
export const MIN_PICK_OPACITY = 0.06;

/** True only when the object and every ancestor above it are visible. */
export function isVisibleInTree(object) {
  for (let node = object; node; node = node.parent) {
    if (!node.visible) return false;
  }
  return true;
}

/** The selection an object stands for, in the shape the stage passes around. */
export function selectionOf(object) {
  const { section = null, deck = null, room = null } = object.userData ?? {};
  return { section, deck, room };
}

/** The nearest hit that is actually on screen, or undefined if none is. */
export function firstVisibleHit(hits) {
  return hits.find(
    (hit) => isVisibleInTree(hit.object) && (hit.object.material?.opacity ?? 1) > MIN_PICK_OPACITY
  );
}

export function createPicker() {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  return {
    /**
     * `x` and `y` are CSS pixels inside a viewport of `width` by `height`.
     * Returns the selection that was hit, or null.
     */
    pick({ x, y, width, height, camera, targets }) {
      if (!width || !height) return null;
      pointer.set((x / width) * 2 - 1, -(y / height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hit = firstVisibleHit(raycaster.intersectObjects(targets, false));
      return hit ? selectionOf(hit.object) : null;
    },
  };
}
