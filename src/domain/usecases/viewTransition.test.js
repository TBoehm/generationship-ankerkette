import { describe, expect, it } from 'vitest';
import {
  TRANSITION_DURATION_MS,
  easeInOutCubic,
  transitionProgress,
  transitionState,
} from './viewTransition.js';

const SAMPLES = Array.from({ length: 101 }, (_, i) => i / 100);

describe('easeInOutCubic', () => {
  it('pins both ends', () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
  });

  it('passes through the middle', () => {
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 9);
  });

  it('is monotonic, so the fade never reverses', () => {
    const values = SAMPLES.map(easeInOutCubic);
    expect(values).toEqual([...values].sort((a, b) => a - b));
  });
});

describe('transitionState', () => {
  it('shows only the flight at rest on the flight side', () => {
    const s = transitionState(0);
    expect(s.flightOpacity).toBe(1);
    expect(s.shipOpacity).toBe(0);
    expect(s.flightActive).toBe(true);
    expect(s.shipActive).toBe(false);
    expect(s.inputTarget).toBe('flight');
  });

  it('shows only the ship at rest on the ship side', () => {
    const s = transitionState(1);
    expect(s.shipOpacity).toBe(1);
    expect(s.flightOpacity).toBe(0);
    expect(s.shipActive).toBe(true);
    expect(s.flightActive).toBe(false);
    expect(s.inputTarget).toBe('ship');
  });

  it('never lets the two opacities exceed one, at any progress', () => {
    for (const p of SAMPLES) {
      const s = transitionState(p);
      expect(s.shipOpacity + s.flightOpacity).toBeLessThanOrEqual(1 + 1e-9);
    }
  });

  it('keeps something on screen at every progress', () => {
    for (const p of SAMPLES) {
      const s = transitionState(p);
      expect(s.shipOpacity + s.flightOpacity).toBeGreaterThan(0.99);
    }
  });

  it('marks a scene inactive exactly when it is invisible', () => {
    for (const p of SAMPLES) {
      const s = transitionState(p);
      expect(s.shipActive).toBe(s.shipOpacity > 0);
      expect(s.flightActive).toBe(s.flightOpacity > 0);
    }
  });

  it('never runs both scenes at rest, which is what keeps the idle cost at one scene', () => {
    expect(transitionState(0).shipActive).toBe(false);
    expect(transitionState(1).flightActive).toBe(false);
  });

  it('hands input to exactly one target and switches exactly once', () => {
    const targets = SAMPLES.map((p) => transitionState(p).inputTarget);
    for (const target of targets) expect(['ship', 'flight']).toContain(target);
    const switches = targets.filter((t, i) => i > 0 && t !== targets[i - 1]).length;
    expect(switches).toBe(1);
  });

  it('never leaves input unrouted, so the controls stay live during the fade', () => {
    for (const p of SAMPLES) {
      expect(transitionState(p).inputTarget).toBeTruthy();
    }
  });

  it('clamps a progress outside the unit range instead of extrapolating', () => {
    expect(transitionState(-3)).toEqual(transitionState(0));
    expect(transitionState(4)).toEqual(transitionState(1));
  });

  it('treats a broken progress as the flight side rather than blanking the screen', () => {
    const s = transitionState(Number.NaN);
    expect(s.flightOpacity).toBe(1);
    expect(s.inputTarget).toBe('flight');
  });
});

describe('transitionProgress', () => {
  it('runs from zero to one across the transition duration', () => {
    expect(transitionProgress(0, 'toShip')).toBe(0);
    expect(transitionProgress(TRANSITION_DURATION_MS, 'toShip')).toBe(1);
  });

  it('runs the other way when heading back to the flight', () => {
    expect(transitionProgress(0, 'toFlight')).toBe(1);
    expect(transitionProgress(TRANSITION_DURATION_MS, 'toFlight')).toBe(0);
  });

  it('holds at the end rather than overshooting', () => {
    expect(transitionProgress(TRANSITION_DURATION_MS * 5, 'toShip')).toBe(1);
    expect(transitionProgress(TRANSITION_DURATION_MS * 5, 'toFlight')).toBe(0);
  });

  it('jumps straight to the end when motion is reduced', () => {
    expect(transitionProgress(0, 'toShip', { reducedMotion: true })).toBe(1);
    expect(transitionProgress(0, 'toFlight', { reducedMotion: true })).toBe(0);
  });
});
