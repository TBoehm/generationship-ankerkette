import { describe, expect, it } from 'vitest';
import {
  coriolisAcceleration,
  deckAreas,
  gravityAt,
  rimSpeed,
  ringArea,
  sectorArea,
  sectorLength,
  totalDeckArea,
  usableRoomArea,
} from './deckGeometry.js';
import { DECK_RADII, HABITAT } from '../constants/shipDesign.js';

describe('gravityAt', () => {
  it('yields 0.50 g on the outermost deck and 0.42 g on the innermost', () => {
    expect(gravityAt(125)).toBeCloseTo(0.5, 2);
    expect(gravityAt(105)).toBeCloseTo(0.42, 2);
  });

  it('scales linearly with radius', () => {
    expect(gravityAt(250)).toBeCloseTo(2 * gravityAt(125), 6);
  });

  it('is zero on the spin axis', () => {
    expect(gravityAt(0)).toBe(0);
  });
});

describe('rimSpeed', () => {
  it('is 24.7 m/s at the outer radius', () => {
    expect(rimSpeed(125)).toBeCloseTo(24.7, 1);
  });
});

describe('coriolisAcceleration', () => {
  it('reaches 12 percent of local gravity at walking pace', () => {
    const a = coriolisAcceleration(HABITAT.walkingSpeed);
    expect(a).toBeCloseTo(0.59, 2);
    expect(a / (gravityAt(125) * 9.81)).toBeCloseTo(0.12, 2);
  });
});

describe('sector geometry', () => {
  it('splits every deck into four sectors', () => {
    expect(sectorLength(125)).toBeCloseTo(196.3, 1);
    expect(sectorLength(105)).toBeCloseTo(164.9, 1);
  });

  it('multiplies sector length by the axial ring width', () => {
    expect(sectorArea(125)).toBeCloseTo(5890, 0);
    expect(sectorArea(105)).toBeCloseTo(4948, 0);
  });

  it('subtracts the four metre longitudinal corridor from the usable area', () => {
    expect(usableRoomArea(125)).toBeCloseTo(26 * sectorLength(125), 6);
    expect(usableRoomArea(125)).toBeLessThan(sectorArea(125));
  });
});

describe('ringArea', () => {
  it('sums all five decks at their own radius', () => {
    expect(ringArea()).toBeCloseTo(108385, -1);
  });

  it('is smaller than the common mistake of using the outer radius throughout', () => {
    const allAtOuterRadius = DECK_RADII.length * HABITAT.sectorsPerRing * sectorArea(125);
    expect(allAtOuterRadius).toBeCloseTo(117810, -1);
    expect(allAtOuterRadius / ringArea() - 1).toBeGreaterThan(0.08);
  });
});

describe('totalDeckArea', () => {
  it('covers both counter-rotating rings', () => {
    expect(totalDeckArea()).toBeCloseTo(2 * ringArea(), 6);
    expect(totalDeckArea()).toBeCloseTo(216770, -1);
  });

  it('leaves about 217 square metres per crew member', () => {
    expect(totalDeckArea() / 1000).toBeCloseTo(217, 0);
  });
});

describe('deckAreas', () => {
  it('reports one entry per deck, outermost first', () => {
    const decks = deckAreas();
    expect(decks).toHaveLength(5);
    expect(decks[0].radius).toBe(125);
    expect(decks[4].radius).toBe(105);
  });

  it('decreases monotonically towards the spin axis', () => {
    const areas = deckAreas().map((d) => d.sectorArea);
    expect(areas).toEqual([...areas].sort((a, b) => b - a));
  });
});
