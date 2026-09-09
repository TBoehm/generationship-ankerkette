import { describe, expect, it } from 'vitest';
import { SECTION_PLACEMENT, SHIP_SECTIONS } from './shipSections.js';
import { DECK_RADII, HABITAT, HULL } from './shipDesign.js';

/** The order of the index list in the section sheet, bow first. */
const EXPECTED_ORDER = [
  'bowShield',
  'supplyTanks',
  'habitatMantle',
  'ringA',
  'ringB',
  'centralAxis',
  'cryobank',
  'workshop',
  'lifeSupport',
  'reactor',
  'radiators',
  'shadowShield',
  'propellantMagazine',
  'propulsion',
  'magsail',
];

const SECTION_KEYS = ['id', 'placement', 'z', 'carriesRing', 'spinSense', 'colorKey', 'figures'];

const inline = () => SHIP_SECTIONS.filter((s) => s.placement === SECTION_PLACEMENT.inline);
const byId = (id) => SHIP_SECTIONS.find((s) => s.id === id);
const spanOf = (section) => section.z.to - section.z.from;

describe('SHIP_SECTIONS', () => {
  it('lists fifteen sections in the order the index renders', () => {
    expect(SHIP_SECTIONS).toHaveLength(15);
    expect(SHIP_SECTIONS.map((s) => s.id)).toEqual(EXPECTED_ORDER);
  });

  it('gives every section a unique id', () => {
    const ids = SHIP_SECTIONS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('carries exactly the agreed fields, no prose, no hex color', () => {
    for (const section of SHIP_SECTIONS) {
      expect(Object.keys(section).sort()).toEqual([...SECTION_KEYS].sort());
    }
    // Printable ASCII only: no prose, no umlaut, no superscript unit symbol.
    const serialized = JSON.stringify(SHIP_SECTIONS);
    expect(serialized).toMatch(/^[ -~]*$/);
    expect(serialized).not.toMatch(/0x[0-9a-f]{6}/i);
  });

  it('is frozen down to the extents', () => {
    expect(Object.isFrozen(SHIP_SECTIONS)).toBe(true);
    for (const section of SHIP_SECTIONS) {
      expect(Object.isFrozen(section)).toBe(true);
      expect(Object.isFrozen(section.z)).toBe(true);
    }
  });
});

describe('z extents', () => {
  it('runs every extent from the stern side to the bow side', () => {
    for (const section of SHIP_SECTIONS) {
      expect(Number.isFinite(section.z.from)).toBe(true);
      expect(Number.isFinite(section.z.to)).toBe(true);
      expect(section.z.from).toBeLessThanOrEqual(section.z.to);
    }
  });

  it('orders the inline sections bow to stern', () => {
    const bowEdges = inline().map((s) => s.z.to);
    const descending = [...bowEdges].sort((a, b) => b - a);
    expect(bowEdges).toEqual(descending);
    expect(new Set(bowEdges).size).toBe(bowEdges.length);
  });

  it('never overlaps two inline sections, touching is allowed', () => {
    const chain = inline();
    for (let i = 1; i < chain.length; i += 1) {
      expect(chain[i].z.to).toBeLessThanOrEqual(chain[i - 1].z.from);
    }
  });

  it('keeps the whole ship inside the 790 m hull', () => {
    const stern = Math.min(...SHIP_SECTIONS.map((s) => s.z.from));
    const bow = Math.max(...SHIP_SECTIONS.map((s) => s.z.to));
    expect(bow - stern).toBeLessThanOrEqual(HULL.length);
    expect(bow - stern).toBeGreaterThan(0.98 * HULL.length);
  });

  it('seats both rings inside the habitat mantle', () => {
    const mantle = byId('habitatMantle');
    for (const ring of SHIP_SECTIONS.filter((s) => s.carriesRing)) {
      expect(ring.placement).toBe(SECTION_PLACEMENT.internal);
      expect(ring.z.from).toBeGreaterThanOrEqual(mantle.z.from);
      expect(ring.z.to).toBeLessThanOrEqual(mantle.z.to);
    }
  });

  it('mounts the radiators on the reactor bay instead of behind it', () => {
    const radiators = byId('radiators');
    const reactor = byId('reactor');
    expect(radiators.placement).toBe(SECTION_PLACEMENT.external);
    expect(radiators.z).toEqual(reactor.z);
  });

  it('runs the central axis through most of the hull', () => {
    const axis = byId('centralAxis');
    expect(axis.placement).toBe(SECTION_PLACEMENT.spanning);
    expect(spanOf(axis)).toBeGreaterThan(0.5 * HULL.length);
  });
});

describe('rings', () => {
  it('has as many ring sections as the habitat has rings', () => {
    const rings = SHIP_SECTIONS.filter((s) => s.carriesRing);
    expect(rings).toHaveLength(HABITAT.ringCount);
    expect(rings.map((s) => s.id)).toEqual(['ringA', 'ringB']);
    expect(DECK_RADII.length).toBeGreaterThan(0);
  });

  it('turns the two rings against each other so the spin cancels', () => {
    const senses = SHIP_SECTIONS.map((s) => s.spinSense);
    expect(senses.reduce((sum, value) => sum + value, 0)).toBe(0);
    expect(byId('ringA').spinSense).toBe(1);
    expect(byId('ringB').spinSense).toBe(-1);
  });

  it('leaves every other section at rest', () => {
    for (const section of SHIP_SECTIONS.filter((s) => !s.carriesRing)) {
      expect(section.spinSense).toBe(0);
    }
  });
});

describe('color keys', () => {
  it('replaces each legacy hex with its own stable key', () => {
    const keys = SHIP_SECTIONS.map((s) => s.colorKey);
    expect(new Set(keys).size).toBe(keys.length);
    for (const key of keys) {
      expect(key).toMatch(/^[a-z][A-Za-z]+$/);
    }
  });
});

describe('figures', () => {
  it('keeps numbers, never formatted strings', () => {
    for (const section of SHIP_SECTIONS) {
      expect(Array.isArray(section.figures)).toBe(true);
      for (const figure of section.figures) {
        expect(typeof figure.value).toBe('number');
        expect(Number.isFinite(figure.value)).toBe(true);
        expect(Number.isInteger(figure.decimals)).toBe(true);
        expect(typeof figure.approximate).toBe('boolean');
        expect(figure.unit === '' || figure.unit.startsWith('units.')).toBe(true);
      }
    }
  });

  it('names every figure once inside its section', () => {
    for (const section of SHIP_SECTIONS) {
      const ids = section.figures.map((f) => f.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('restates nothing the ring geometry already derives', () => {
    expect(byId('ringA').figures).toEqual([]);
    expect(byId('habitatMantle').figures).toEqual([]);
    expect(byId('propellantMagazine').figures).toEqual([]);
  });

  it('holds the bow shield figures that exist nowhere else', () => {
    const figures = Object.fromEntries(byId('bowShield').figures.map((f) => [f.id, f.value]));
    expect(figures.frontalArea).toBe(53100);
    expect(figures.iceThickness).toBe(3);
    expect(figures.whippleLayers).toBe(4);
    expect(figures.mass).toBe(150000);
  });

  it('marks an estimate as an estimate', () => {
    const mass = byId('bowShield').figures.find((f) => f.id === 'mass');
    const thickness = byId('bowShield').figures.find((f) => f.id === 'iceThickness');
    expect(mass.approximate).toBe(true);
    expect(thickness.approximate).toBe(false);
  });
});
