import { describe, expect, it } from 'vitest';
import { TAP_THRESHOLD_PX, isTap, travelled, pinchFactor } from './pointerGesture.js';

describe('isTap', () => {
  it('uses the seven pixel Manhattan threshold both originals use', () => {
    expect(TAP_THRESHOLD_PX).toBe(7);
    expect(isTap(6.9)).toBe(true);
    expect(isTap(7)).toBe(false);
  });

  it('treats no movement as a tap', () => {
    expect(isTap(0)).toBe(true);
  });
});

describe('travelled', () => {
  it('accumulates Manhattan distance, not Euclidean', () => {
    expect(travelled(0, 3, 4)).toBe(7);
  });

  it('adds up across a gesture', () => {
    let d = 0;
    d = travelled(d, 2, 0);
    d = travelled(d, 0, -3);
    expect(d).toBe(5);
  });

  it('ignores a move that is not a usable number', () => {
    expect(travelled(5, Number.NaN, 2)).toBe(5);
  });
});

describe('pinchFactor', () => {
  it('spreading the fingers pulls the camera in', () => {
    expect(pinchFactor(100, 200)).toBeCloseTo(0.5, 9);
  });

  it('pinching together pushes the camera out', () => {
    expect(pinchFactor(200, 100)).toBeCloseTo(2, 9);
  });

  it('returns one for a first touch, when there is no previous spread yet', () => {
    expect(pinchFactor(0, 120)).toBe(1);
  });

  it('returns one rather than dividing by zero on a degenerate spread', () => {
    expect(pinchFactor(120, 0)).toBe(1);
  });
});
