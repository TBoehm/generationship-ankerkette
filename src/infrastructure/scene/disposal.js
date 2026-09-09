/**
 * WebGL resources are not garbage collected. A scene that is torn down and
 * rebuilt, which is exactly what React does twice on every mount in strict
 * mode, leaks a buffer and a program each time until the browser drops the
 * context and the view goes black without an error.
 *
 * Every factory registers here, so "dispose is complete" is a number that can
 * be asserted rather than a claim made in review.
 */
export function createDisposalRegistry() {
  const disposers = [];

  return {
    add(disposer) {
      disposers.push(disposer);
    },

    /** Register a three.js object by its own geometry and material. */
    track(object) {
      if (object.geometry) disposers.push(() => object.geometry.dispose());
      if (Array.isArray(object.material)) {
        for (const material of object.material) disposers.push(() => material.dispose());
      } else if (object.material) {
        disposers.push(() => object.material.dispose());
      }
      return object;
    },

    size() {
      return disposers.length;
    },

    disposeAll() {
      // Reverse, so anything that holds a reference goes before what it holds.
      while (disposers.length) {
        const disposer = disposers.pop();
        try {
          disposer();
        } catch {
          // A single broken disposer must not strand the rest of the scene.
        }
      }
    },
  };
}
