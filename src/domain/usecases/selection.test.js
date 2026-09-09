import { describe, expect, it } from 'vitest';
import {
  EMPTY_SELECTION,
  breadcrumbOf,
  decksOf,
  goBack,
  levelOf,
  roomsAt,
  select,
} from './selection.js';
import { SHIP_SECTIONS } from '../constants/shipSections.js';

const ringSection = SHIP_SECTIONS.find((s) => s.carriesRing);
const plainSection = SHIP_SECTIONS.find((s) => !s.carriesRing);

describe('levelOf', () => {
  it('starts at the index', () => {
    expect(levelOf(EMPTY_SELECTION)).toBe('index');
  });

  it('names each level as it deepens', () => {
    expect(levelOf({ section: ringSection.id, deck: null, room: null })).toBe('section');
    expect(levelOf({ section: ringSection.id, deck: 1, room: null })).toBe('deck');
    expect(levelOf({ section: ringSection.id, deck: 1, room: 'x' })).toBe('room');
  });
});

describe('select', () => {
  it('opens a section', () => {
    expect(select(EMPTY_SELECTION, { section: plainSection.id })).toEqual({
      section: plainSection.id,
      deck: null,
      room: null,
    });
  });

  it('clears the deck and room when the section changes', () => {
    const deep = { section: ringSection.id, deck: 2, room: 'anything' };
    expect(select(deep, { section: plainSection.id })).toEqual({
      section: plainSection.id,
      deck: null,
      room: null,
    });
  });

  it('refuses a deck on a section that carries no ring', () => {
    const state = select(EMPTY_SELECTION, { section: plainSection.id });
    expect(select(state, { deck: 1 }).deck).toBeNull();
  });

  it('accepts a deck on a ring section', () => {
    const state = select(EMPTY_SELECTION, { section: ringSection.id });
    expect(select(state, { deck: 3 }).deck).toBe(3);
  });

  it('refuses a deck index the ring does not have', () => {
    const state = select(EMPTY_SELECTION, { section: ringSection.id });
    expect(select(state, { deck: 0 }).deck).toBeNull();
    expect(select(state, { deck: 99 }).deck).toBeNull();
  });

  it('clears the room when the deck changes', () => {
    let state = select(EMPTY_SELECTION, { section: ringSection.id });
    state = select(state, { deck: 1 });
    const room = roomsAt(state)[0].id;
    state = select(state, { room });
    expect(select(state, { deck: 2 }).room).toBeNull();
  });

  it('refuses a room that is not on the selected deck', () => {
    let state = select(EMPTY_SELECTION, { section: ringSection.id });
    state = select(state, { deck: 1 });
    expect(select(state, { room: 'nosuchroom' }).room).toBeNull();
  });

  it('refuses a room while no deck is open', () => {
    const state = select(EMPTY_SELECTION, { section: ringSection.id });
    expect(select(state, { room: 'anything' }).room).toBeNull();
  });

  it('ignores an unknown section instead of showing an empty sheet', () => {
    expect(select(EMPTY_SELECTION, { section: 'nosuchsection' })).toEqual(EMPTY_SELECTION);
  });
});

describe('goBack', () => {
  it('walks back one level at a time and stops at the index', () => {
    let state = select(EMPTY_SELECTION, { section: ringSection.id });
    state = select(state, { deck: 1 });
    state = select(state, { room: roomsAt(state)[0].id });
    expect(levelOf(state)).toBe('room');
    state = goBack(state);
    expect(levelOf(state)).toBe('deck');
    state = goBack(state);
    expect(levelOf(state)).toBe('section');
    state = goBack(state);
    expect(levelOf(state)).toBe('index');
    expect(goBack(state)).toEqual(EMPTY_SELECTION);
  });
});

describe('decksOf and roomsAt', () => {
  it('gives five decks for a ring section and none for the others', () => {
    expect(decksOf(ringSection.id)).toHaveLength(5);
    expect(decksOf(plainSection.id)).toHaveLength(0);
  });

  it('gives the rooms of the open deck', () => {
    let state = select(EMPTY_SELECTION, { section: ringSection.id });
    state = select(state, { deck: 1 });
    expect(roomsAt(state).length).toBeGreaterThan(0);
    expect(roomsAt(EMPTY_SELECTION)).toEqual([]);
  });
});

describe('breadcrumbOf', () => {
  it('grows one crumb per level, index first', () => {
    let state = EMPTY_SELECTION;
    expect(breadcrumbOf(state).map((c) => c.level)).toEqual(['index']);
    state = select(state, { section: ringSection.id });
    expect(breadcrumbOf(state).map((c) => c.level)).toEqual(['index', 'section']);
    state = select(state, { deck: 2 });
    expect(breadcrumbOf(state).map((c) => c.level)).toEqual(['index', 'section', 'deck']);
    state = select(state, { room: roomsAt(state)[0].id });
    expect(breadcrumbOf(state).map((c) => c.level)).toEqual(['index', 'section', 'deck', 'room']);
  });

  it('carries the identifier each crumb navigates back to', () => {
    const state = select(EMPTY_SELECTION, { section: ringSection.id });
    expect(breadcrumbOf(state).at(-1).id).toBe(ringSection.id);
  });
});
