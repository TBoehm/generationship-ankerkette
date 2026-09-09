import { describe, expect, it } from 'vitest';
import {
  DECK_LAYOUT,
  RING_IDS,
  ROOM_COLOR_KEYS,
  allRooms,
  deckAt,
  deckKey,
  roomKey,
} from './deckLayout.js';
import { DECK_RADII, HABITAT } from './shipDesign.js';
import { sectorLength, usableRoomArea } from '../usecases/deckGeometry.js';

/**
 * The room areas are whole square metres, the target is 13 * PI * radius and
 * therefore irrational. The widest legitimate gap in the transcribed data is
 * 0.69 m2 on the 115 m deck, so a threshold below one square metre still
 * leaves the rounding intact while refusing a balancing entry that drifts by
 * a whole unit.
 */
const AREA_TOLERANCE = 0.7;

/** Every deck of both rings, flattened, with the ring it belongs to. */
function everyDeck() {
  return DECK_LAYOUT.flatMap((ring) => ring.decks.map((deck) => ({ ring, deck })));
}

describe('DECK_LAYOUT shape', () => {
  it('has the two rings used elsewhere in the codebase', () => {
    expect(RING_IDS).toEqual(['ringA', 'ringB']);
    expect(DECK_LAYOUT.map((ring) => ring.id)).toEqual(RING_IDS);
    expect(DECK_LAYOUT).toHaveLength(HABITAT.ringCount);
  });

  it('gives each ring five decks, numbered one to five', () => {
    for (const ring of DECK_LAYOUT) {
      expect(ring.decks.map((deck) => deck.index)).toEqual([1, 2, 3, 4, 5]);
    }
  });

  it('takes the radii from DECK_RADII rather than restating them', () => {
    for (const ring of DECK_LAYOUT) {
      expect(ring.decks.map((deck) => deck.radius)).toEqual([...DECK_RADII]);
    }
  });

  it('holds 59 rooms in total', () => {
    expect(allRooms()).toHaveLength(59);
  });
});

describe('room area invariant', () => {
  it.each(everyDeck())('$ring.id deck $deck.index fills its usable room area', ({ deck }) => {
    const measured = deck.rooms.reduce((sum, room) => sum + room.area, 0);
    const target = usableRoomArea(deck.radius);
    expect(Math.abs(measured - target)).toBeLessThan(AREA_TOLERANCE);
  });

  it('measures the target as the corridor-free sector floor', () => {
    for (const radius of DECK_RADII) {
      expect(usableRoomArea(radius)).toBeCloseTo(sectorLength(radius) * 26, 9);
    }
  });

  /**
   * Both rings share the same geometry, so their decks at equal radius must
   * add up to the same integer. A slip of one square metre in a single deck
   * breaks this even where it would still sit inside AREA_TOLERANCE.
   */
  it('sums identically for both rings at every radius', () => {
    const [ringA, ringB] = DECK_LAYOUT;
    const total = (deck) => deck.rooms.reduce((sum, room) => sum + room.area, 0);
    DECK_RADII.forEach((radius, index) => {
      expect(ringA.decks[index].radius).toBe(radius);
      expect(total(ringA.decks[index])).toBe(total(ringB.decks[index]));
    });
  });

  it('records the transcribed totals unchanged', () => {
    const totals = DECK_LAYOUT.map((ring) =>
      ring.decks.map((deck) => deck.rooms.reduce((sum, room) => sum + room.area, 0))
    );
    expect(totals).toEqual([
      [5105, 4901, 4696, 4493, 4288],
      [5105, 4901, 4696, 4493, 4288],
    ]);
  });
});

describe('rooms', () => {
  it('carries a unique id inside every deck', () => {
    for (const { ring, deck } of everyDeck()) {
      const ids = deck.rooms.map((room) => room.id);
      expect(new Set(ids).size, `${ring.id} deck ${deck.index}`).toBe(ids.length);
    }
  });

  it('has a positive, finite area everywhere', () => {
    for (const room of allRooms()) {
      expect(Number.isFinite(room.area)).toBe(true);
      expect(room.area).toBeGreaterThan(0);
    }
  });

  it('never exceeds the sector floor with a single room', () => {
    for (const { deck } of everyDeck()) {
      for (const room of deck.rooms) {
        expect(room.area).toBeLessThan(usableRoomArea(deck.radius));
      }
    }
  });

  it('names a colour key instead of a colour', () => {
    for (const room of allRooms()) {
      expect(typeof room.colorKey).toBe('string');
      expect(room.colorKey).not.toBe('');
      expect(ROOM_COLOR_KEYS).toContain(room.colorKey);
    }
  });

  it('publishes the colour keys as a sorted set of the keys in use', () => {
    const used = [...new Set(allRooms().map((room) => room.colorKey))].sort();
    expect([...ROOM_COLOR_KEYS]).toEqual(used);
  });

  it('keeps every value free of appearance and prose', () => {
    for (const room of allRooms()) {
      expect(Object.keys(room).sort()).toEqual(['area', 'colorKey', 'id']);
    }
  });
});

describe('lookup', () => {
  it('finds a deck by ring and index', () => {
    const deck = deckAt('ringB', 3);
    expect(deck.radius).toBe(115);
    expect(deck.rooms.map((room) => room.id)).toContain('algaeReactors');
  });

  it('returns undefined for an unknown ring or index', () => {
    expect(deckAt('ringC', 1)).toBeUndefined();
    expect(deckAt('ringA', 6)).toBeUndefined();
    expect(deckAt('ringA', 0)).toBeUndefined();
  });
});

describe('translation keys', () => {
  it('builds the deck key from ring and index', () => {
    expect(deckKey('ringA', 1)).toBe('ship.deck.ringA.1');
  });

  it('builds the room key from ring, index and room id', () => {
    expect(roomKey('ringA', 1, 'dwellingBlockA')).toBe('ship.room.ringA.1.dwellingBlockA');
  });

  it('yields a distinct key for every room on board', () => {
    const keys = DECK_LAYOUT.flatMap((ring) =>
      ring.decks.flatMap((deck) => deck.rooms.map((room) => roomKey(ring.id, deck.index, room.id)))
    );
    expect(new Set(keys).size).toBe(59);
  });
});

describe('immutability', () => {
  it('freezes the layout, its decks and its rooms', () => {
    expect(Object.isFrozen(DECK_LAYOUT)).toBe(true);
    for (const { ring, deck } of everyDeck()) {
      expect(Object.isFrozen(ring)).toBe(true);
      expect(Object.isFrozen(deck)).toBe(true);
      expect(Object.isFrozen(deck.rooms)).toBe(true);
      for (const room of deck.rooms) expect(Object.isFrozen(room)).toBe(true);
    }
  });
});
