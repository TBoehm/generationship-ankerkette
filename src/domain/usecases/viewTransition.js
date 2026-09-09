/**
 * The ship and the journey cannot share one scene. warpLength maps the whole
 * 268553 AU journey onto 107.45 units and the 790 m hull onto 1.516e-5, which
 * is 1300 times below the flight camera's near plane. Lowering the reference
 * length to room scale destroys the proportions instead: a 3.6 m room would
 * draw at 2.083 units inside a 16.216 unit ship, a ratio of 7.79 where the
 * truth is 219.4.
 *
 * So there are two scenes, and this module is the whole of what the user sees
 * as one view: which scene is drawn, how strongly, which one receives input.
 * It is pure, so every claim the stage makes about idle cost, about a complete
 * handover and about input never being dropped is an assertion, not a promise.
 */
export const TRANSITION_DURATION_MS = 700;

const SHIP = 'ship';
const FLIGHT = 'flight';
const INPUT_SWITCH = 0.5;

function clampUnit(value) {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export function easeInOutCubic(t) {
  const p = clampUnit(t);
  return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
}

/**
 * @param progress 0 is the journey alone, 1 is the ship alone.
 */
export function transitionState(progress) {
  const p = clampUnit(progress);
  const eased = easeInOutCubic(p);
  const shipOpacity = eased;
  const flightOpacity = 1 - eased;

  return {
    progress: p,
    eased,
    shipOpacity,
    flightOpacity,
    shipActive: shipOpacity > 0,
    flightActive: flightOpacity > 0,
    inputTarget: p >= INPUT_SWITCH ? SHIP : FLIGHT,
  };
}

/**
 * @param direction 'toShip' runs the progress up, 'toFlight' runs it down.
 */
export function transitionProgress(elapsedMs, direction, options) {
  const toShip = direction === 'toShip';
  if (options && options.reducedMotion) return toShip ? 1 : 0;
  const t = clampUnit(elapsedMs / TRANSITION_DURATION_MS);
  return toShip ? t : 1 - t;
}
