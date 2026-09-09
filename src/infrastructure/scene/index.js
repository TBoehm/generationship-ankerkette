import { createStage } from './stage.js';
import { createRenderer } from './renderer.js';
import { createShipScene } from './ship/index.js';
import { createFlightScene } from './flight/index.js';

/**
 * The composition point. stage.js takes the renderer and both scene factories
 * as arguments so that it can be driven by doubles in jsdom, which is what
 * makes "one context, one loop, no idle cost, complete teardown" assertable
 * rather than merely claimed. Binding the real implementations belongs here
 * and nowhere else, so that the injection stays honest.
 */
export function createPresentationStage({ host, reducedMotion = false }) {
  return createStage({
    host,
    reducedMotion,
    createRenderer: () =>
      createRenderer({
        devicePixelRatio: typeof window === 'undefined' ? 1 : window.devicePixelRatio,
      }),
    createShipScene: () => createShipScene({ reducedMotion }),
    createFlightScene: () => createFlightScene({ reducedMotion }),
  });
}
