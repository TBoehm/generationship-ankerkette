import { DECK_LAYOUT, ringById } from '../constants/deckLayout.js';
import { SHIP_SECTIONS } from '../constants/shipSections.js';

/**
 * Walking the ship: index, then a section, then a deck, then a room. Only the
 * two ring sections carry decks, so the machine refuses a deck anywhere else
 * rather than letting the sheet open on nothing.
 *
 * Every transition is validated against the real tables, which means an
 * identifier that no longer exists cannot survive a reload of a shared link.
 */
export const EMPTY_SELECTION = Object.freeze({ section: null, deck: null, room: null });

const sectionById = (id) => SHIP_SECTIONS.find((section) => section.id === id) ?? null;

export function decksOf(sectionId) {
  const section = sectionById(sectionId);
  if (!section || !section.carriesRing) return [];
  const ring = ringById(section.id);
  return ring ? ring.decks : [];
}

export function roomsAt({ section, deck }) {
  if (!section || !deck) return [];
  const decks = decksOf(section);
  const found = decks.find((entry) => entry.index === deck);
  return found ? found.rooms : [];
}

export function levelOf({ section, deck, room }) {
  if (room) return 'room';
  if (deck) return 'deck';
  if (section) return 'section';
  return 'index';
}

export function select(state, change) {
  let next = { ...state };

  if ('section' in change) {
    if (!sectionById(change.section)) return state;
    if (change.section !== state.section)
      next = { section: change.section, deck: null, room: null };
  }

  if ('deck' in change) {
    const available = decksOf(next.section).some((entry) => entry.index === change.deck);
    next = available
      ? { ...next, deck: change.deck, room: change.deck === next.deck ? next.room : null }
      : { ...next, deck: null, room: null };
  }

  if ('room' in change) {
    const available = roomsAt(next).some((entry) => entry.id === change.room);
    next = { ...next, room: available ? change.room : null };
  }

  return next;
}

export function goBack(state) {
  if (state.room) return { ...state, room: null };
  if (state.deck) return { ...state, deck: null };
  if (state.section) return { ...EMPTY_SELECTION };
  return EMPTY_SELECTION;
}

export function breadcrumbOf(state) {
  const crumbs = [{ level: 'index', id: null }];
  if (state.section) crumbs.push({ level: 'section', id: state.section });
  if (state.deck) crumbs.push({ level: 'deck', id: state.deck });
  if (state.room) crumbs.push({ level: 'room', id: state.room });
  return crumbs;
}

export function ringSectionIds() {
  return SHIP_SECTIONS.filter((section) => section.carriesRing).map((section) => section.id);
}

export const RING_COUNT = DECK_LAYOUT.length;
