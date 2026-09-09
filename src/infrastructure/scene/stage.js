import {
  TRANSITION_DURATION_MS,
  transitionProgress,
  transitionState,
} from '../../domain/usecases/viewTransition.js';

/**
 * The director. It owns the one renderer, both scenes, the one loop and the
 * single set of input listeners, and it decides every frame which scene is
 * drawn, how strongly, and which one receives input.
 *
 * Everything TASK-001 can fail on lives here rather than in either scene: how
 * many contexts exist, how many loops run, whether the abandoned scene still
 * costs anything, whether teardown is complete, whether the transition blocks
 * the controls. The renderer and both scene factories are injected, so all of
 * that is asserted in jsdom against a double instead of being argued about in
 * review. This module therefore imports no three.js at all.
 */
const MAX_FRAME_MS = 100;

export function createStage({
  host,
  createRenderer,
  createShipScene,
  createFlightScene,
  reducedMotion = false,
}) {
  const renderer = createRenderer();
  renderer.autoClear = false;
  host.appendChild(renderer.domElement);

  const scenes = {
    ship: createShipScene({ renderer }),
    flight: createFlightScene({ renderer }),
  };

  let focus = 'flight';
  let progress = 0;
  let transitionStartedAt = null;
  let direction = null;
  let lastTimestamp = null;
  let disposed = false;
  let frameHandle = null;
  const listeners = { select: [], focusSettled: [] };

  function emit(event, payload) {
    for (const listener of listeners[event]) listener(payload);
  }

  function advance(timestamp) {
    if (direction === null) return;
    const elapsed = timestamp - transitionStartedAt;
    progress = transitionProgress(elapsed, direction, { reducedMotion });
    if (reducedMotion || elapsed >= TRANSITION_DURATION_MS) {
      direction = null;
      transitionStartedAt = null;
      emit('focusSettled', focus);
    }
  }

  function step(timestamp) {
    if (disposed) return;

    const delta =
      lastTimestamp === null ? 0 : Math.min(MAX_FRAME_MS, Math.max(0, timestamp - lastTimestamp));
    lastTimestamp = timestamp;

    advance(timestamp);
    const state = transitionState(progress);

    scenes.flight.setOpacity(state.flightOpacity);
    scenes.ship.setOpacity(state.shipOpacity);

    if (state.flightActive) scenes.flight.update(delta);
    if (state.shipActive) scenes.ship.update(delta);

    renderer.clear();
    if (state.flightActive) renderer.render(scenes.flight.root, scenes.flight.camera);
    // No shared depth range means the two unit systems cannot fight over it.
    renderer.clearDepth();
    if (state.shipActive) renderer.render(scenes.ship.root, scenes.ship.camera);
  }

  function inputScene() {
    return scenes[transitionState(progress).inputTarget];
  }

  return {
    step,

    start() {
      if (disposed || frameHandle !== null) return;
      const loop = (timestamp) => {
        if (disposed) return;
        step(timestamp);
        frameHandle = requestAnimationFrame(loop);
      };
      frameHandle = requestAnimationFrame(loop);
    },

    stop() {
      if (frameHandle !== null) {
        cancelAnimationFrame(frameHandle);
        frameHandle = null;
      }
    },

    focus: () => focus,

    setFocus(next) {
      if (next !== 'ship' && next !== 'flight') return;
      if (next === focus) return;
      focus = next;
      direction = next === 'ship' ? 'toShip' : 'toFlight';
      transitionStartedAt = lastTimestamp === null ? 0 : lastTimestamp;
      if (reducedMotion) progress = next === 'ship' ? 1 : 0;
    },

    handleDrag: (dx, dy) => inputScene().handleDrag(dx, dy),
    handleZoom: (factor) => inputScene().handleZoom(factor),
    handleTap: (x, y) => inputScene().handleTap(x, y, (selection) => emit('select', selection)),

    setDistance: (au) => scenes.flight.setDistance(au),
    setCameraMode: (mode) => scenes.flight.setCameraMode(mode),
    setBoostSizes: (on) => scenes.flight.setBoostSizes(on),
    setShowLabels: (on) => scenes.flight.setShowLabels(on),
    setSelection: (selection) => scenes.ship.setSelection(selection),

    onSelect: (callback) => listeners.select.push(callback),
    onFocusSettled: (callback) => listeners.focusSettled.push(callback),

    resize(width, height) {
      if (!width || !height) return;
      renderer.setSize(width, height);
      scenes.ship.resize(width, height);
      scenes.flight.resize(width, height);
    },

    dispose() {
      if (disposed) return;
      disposed = true;
      if (frameHandle !== null) {
        cancelAnimationFrame(frameHandle);
        frameHandle = null;
      }
      scenes.ship.dispose();
      scenes.flight.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
      listeners.select.length = 0;
      listeners.focusSettled.length = 0;
    },
  };
}
