import { describe, expect, it } from 'vitest';
import { findGermanIn } from './lang-check.mjs';

describe('findGermanIn', () => {
  it('passes plain English prose', () => {
    expect(findGermanIn('// Speed in metres per second at a given distance')).toEqual([]);
  });

  it('flags an umlaut', () => {
    const hits = findGermanIn('const sektorlaenge = 0; // Sektorlänge'); // lang-check-ignore
    expect(hits).toHaveLength(1);
    expect(hits[0].reason).toMatch(/umlaut/i);
  });

  it('flags the sharp s', () => {
    expect(findGermanIn('// Randgeschwindigkeit in Metern pro Sekunde, groß')).not.toEqual([]); // lang-check-ignore
  });

  it('flags German function words that carry no umlaut', () => {
    const hits = findGermanIn('// Das ist die Rotation und nicht die Beschleunigung'); // lang-check-ignore
    expect(hits).not.toEqual([]);
    expect(hits[0].reason).toMatch(/word/i);
  });

  it('reports the line number', () => {
    const hits = findGermanIn('line one\nline two\n// keine Ahnung'); // lang-check-ignore
    expect(hits[0].line).toBe(3);
  });

  it('does not flag English words that merely contain a German word', () => {
    expect(findGermanIn('const border = 1; const distance = 2; const wisdom = 3;')).toEqual([]);
  });

  it('does not flag the English verb die, which German shares as an article', () => {
    expect(findGermanIn('// the worker may die before the queue drains')).toEqual([]);
  });

  it('honours an explicit opt-out on the line', () => {
    expect(findGermanIn('const label = "Übersicht"; // lang-check-ignore')).toEqual([]);
  });

  it('collects every offending line, not just the first', () => {
    expect(findGermanIn('// Größe\nok\n// und weiter')).toHaveLength(2); // lang-check-ignore
  });
});
