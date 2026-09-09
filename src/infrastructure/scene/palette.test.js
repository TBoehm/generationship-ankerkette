import { describe, expect, it } from 'vitest';
import { ROOM_COLORS, SECTION_COLORS, roomColor, sectionColor } from './palette.js';
import { ROOM_COLOR_KEYS } from '../../domain/constants/deckLayout.js';
import { SHIP_SECTIONS } from '../../domain/constants/shipSections.js';

const sectionKeys = [...new Set(SHIP_SECTIONS.map((section) => section.colorKey))];

describe('coverage', () => {
  it('colours every room key the deck layout uses', () => {
    for (const key of ROOM_COLOR_KEYS) expect(ROOM_COLORS[key]).toBeTypeOf('number');
  });

  it('colours every section key the hull uses', () => {
    for (const key of sectionKeys) expect(SECTION_COLORS[key]).toBeTypeOf('number');
  });

  it('carries no colour the data does not ask for', () => {
    expect(Object.keys(ROOM_COLORS).sort()).toEqual([...ROOM_COLOR_KEYS].sort());
    expect(Object.keys(SECTION_COLORS).sort()).toEqual([...sectionKeys].sort());
  });
});

describe('the two namespaces are separate on purpose', () => {
  it('keeps the three keys that mean different colours apart', () => {
    // A room corridor is not a hull circulation bay, a room reserve is not the
    // hull's reserve volume, and room shielding water is not the shadow shield.
    // A single flat table would have silently recoloured all three.
    for (const key of ['circulation', 'reserve', 'shielding']) {
      expect(ROOM_COLORS[key]).not.toBe(SECTION_COLORS[key]);
    }
  });

  it('agrees where the originals agreed', () => {
    for (const key of ['quarters', 'agriculture', 'water', 'lifeSupport']) {
      expect(ROOM_COLORS[key]).toBe(SECTION_COLORS[key]);
    }
  });
});

describe('lookup', () => {
  it('resolves a known key', () => {
    expect(roomColor('quarters')).toBe(ROOM_COLORS.quarters);
    expect(sectionColor('magsail')).toBe(SECTION_COLORS.magsail);
  });

  it('falls back to a neutral rather than rendering black on an unknown key', () => {
    expect(roomColor('nosuchthing')).toBe(ROOM_COLORS.circulation);
    expect(sectionColor('nosuchthing')).toBe(SECTION_COLORS.hull);
  });
});

describe('values', () => {
  it('stays inside the 24 bit range', () => {
    for (const value of [...Object.values(ROOM_COLORS), ...Object.values(SECTION_COLORS)]) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(0xffffff);
    }
  });
});
