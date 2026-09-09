import { createDisposalRegistry } from '../disposal.js';
import { createFlightScene } from './index.js';

/**
 * The scene draws its clouds from a distribution, so the tests seed it. A
 * linear congruential generator is enough: the only thing asked of it is that
 * two runs agree.
 */
export function seededRandom(seed = 1) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function mountFlightScene({ width = 800, height = 600, ...options } = {}) {
  const registry = createDisposalRegistry();
  const scene = createFlightScene({ registry, random: seededRandom(), ...options });
  scene.resize(width, height);
  return { scene, registry, width, height };
}

/** Every geometry and material hanging off a tree, each one only once. */
export function collectResources(root) {
  const geometries = new Set();
  const materials = new Set();
  root.traverse((object) => {
    if (object.geometry) geometries.add(object.geometry);
    if (Array.isArray(object.material)) {
      for (const material of object.material) materials.add(material);
    } else if (object.material) {
      materials.add(object.material);
    }
  });
  return { geometries, materials };
}
