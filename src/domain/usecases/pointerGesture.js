/**
 * Telling a tap from a drag decides whether a pointer release selects a deck
 * or merely ends a camera move. Both originals use the same rule, seven
 * pixels of accumulated Manhattan travel, which is forgiving enough for a
 * thumb on a moving vehicle and tight enough not to swallow a deliberate
 * turn of the model.
 */
export const TAP_THRESHOLD_PX = 7;

export function travelled(accumulated, dx, dy) {
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) return accumulated;
  return accumulated + Math.abs(dx) + Math.abs(dy);
}

export function isTap(accumulated) {
  return accumulated < TAP_THRESHOLD_PX;
}

/**
 * Ratio to multiply the dolly distance by. A first touch has no previous
 * spread to compare against and must not move the camera.
 */
export function pinchFactor(previousSpread, currentSpread) {
  if (!previousSpread || !currentSpread) return 1;
  if (!Number.isFinite(previousSpread) || !Number.isFinite(currentSpread)) return 1;
  return previousSpread / currentSpread;
}
