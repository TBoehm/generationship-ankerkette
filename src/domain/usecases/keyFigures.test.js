import { describe, expect, it } from 'vitest';
import { overviewKeyFigures } from './keyFigures.js';

describe('overviewKeyFigures', () => {
  const figures = overviewKeyFigures();
  const byId = Object.fromEntries(figures.map((f) => [f.id, f]));

  it('aggregates hull, habitat and mission into one list', () => {
    expect(Object.keys(byId).sort()).toEqual(
      [
        'crew',
        'cruiseSpeed',
        'deckArea',
        'distance',
        'dryMass',
        'duration',
        'generations',
        'hullDiameter',
        'length',
      ].sort()
    );
  });

  it('carries the documented hull figures', () => {
    expect(byId.length.value).toBe(790);
    expect(byId.hullDiameter.value).toBe(280);
    expect(byId.dryMass.value).toBe(539000);
    expect(byId.crew.value).toBe(1000);
  });

  it('derives deck area rather than repeating it', () => {
    expect(byId.deckArea.value).toBeCloseTo(216770, -1);
  });

  it('derives duration and generations from the flight profile', () => {
    expect(byId.duration.value).toBeCloseTo(466.1, 1);
    expect(byId.generations.value).toBe(18);
  });

  it('reports cruise speed in kilometres per second', () => {
    expect(byId.cruiseSpeed.value).toBeCloseTo(2998, 0);
  });

  it('gives every figure a unit key and a decimal precision', () => {
    for (const figure of figures) {
      expect(typeof figure.unit).toBe('string');
      expect(Number.isInteger(figure.decimals)).toBe(true);
    }
  });
});
