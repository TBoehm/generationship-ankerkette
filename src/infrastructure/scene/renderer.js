import * as THREE from 'three';

/**
 * The only place in the code base that constructs a WebGL context. Everything
 * else receives one, which is what lets the stage assert that exactly one
 * exists. Browsers cap contexts at eight to sixteen and drop the oldest
 * silently, so a second one does not throw, it just turns an earlier view
 * black.
 */
const MAX_PIXEL_RATIO = 2;

export function createRenderer({ devicePixelRatio = 1 } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, MAX_PIXEL_RATIO));
  return renderer;
}
