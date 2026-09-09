import { easeInOutCubic } from './viewTransition.js';

/**
 * Moving the eye from one subject to another. Cutting straight there loses
 * the one thing the journey view is for: where the new subject sits in
 * relation to the old one. Flying there keeps it.
 */
export const FLY_TO_DURATION_MS = 900;

export function flyProgress(elapsedMs, options) {
  if (options && options.reducedMotion) return 1;
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) return 0;
  if (elapsedMs >= FLY_TO_DURATION_MS) return 1;
  return easeInOutCubic(elapsedMs / FLY_TO_DURATION_MS);
}

export function mix(from, to, t) {
  if (t <= 0) return from;
  if (t >= 1) return to;
  return from + (to - from) * t;
}
