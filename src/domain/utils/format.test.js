import { describe, expect, it } from 'vitest';
import { formatDecimal, formatInteger } from './format.js';

describe('formatInteger', () => {
  it('groups thousands the German way', () => {
    expect(formatInteger(216770, 'de')).toBe('216.770');
    expect(formatInteger(539000, 'de')).toBe('539.000');
  });

  it('groups thousands the English way', () => {
    expect(formatInteger(216770, 'en')).toBe('216,770');
  });

  it('rounds to whole numbers', () => {
    expect(formatInteger(108385.4, 'de')).toBe('108.385');
  });
});

describe('formatDecimal', () => {
  it('uses a comma as the decimal separator in German', () => {
    expect(formatDecimal(4.2465, 'de', 4)).toBe('4,2465');
  });

  it('keeps the requested number of decimals', () => {
    expect(formatDecimal(0.5, 'de', 2)).toBe('0,50');
  });

  it('falls back to German for an unsupported locale', () => {
    expect(formatDecimal(1.5, 'fr', 1)).toBe('1,5');
  });
});
