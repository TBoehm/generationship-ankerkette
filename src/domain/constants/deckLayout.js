import { DECK_RADII } from './shipDesign.js';

/**
 * Room layout of the two counter-rotating habitat rings, transcribed from the
 * legacy general plan. Ring A is the living ring, ring B the agricultural one.
 * Each ring carries five decks, each deck is described for one of the four
 * identical pressure sectors, and the five decks together hold 59 rooms.
 *
 * The binding invariant: the room areas of a deck add up to the sector floor
 * minus the longitudinal corridor, that is usableRoomArea(radius) from
 * usecases/deckGeometry.js. The last room of a deck is the balancing entry,
 * which is why the storage, circulation and reserve rooms carry the odd
 * figures. Changing any area means changing that last entry as well.
 *
 * Areas are square metres per sector. Radii are not restated here, they come
 * from DECK_RADII, so deck one of both rings sits at 125 m and deck five at
 * 105 m. Names, uses and notes are prose and live in the locale files under
 * the keys built by deckKey(); colour is appearance and reaches the scene as
 * the colour key of a room, resolved in infrastructure/scene/palette.js.
 */

/** The two rings, outermost structure of the layout. */
export const RING_IDS = Object.freeze(['ringA', 'ringB']);

/** Rooms per ring, one entry per deck, ordered from the outermost deck inwards. */
const ROOMS = {
  ringA: [
    [
      { id: 'dwellingBlockA', area: 1300, colorKey: 'quarters' },
      { id: 'dwellingBlockB', area: 1300, colorKey: 'quarters' },
      { id: 'dwellingBlockC', area: 1300, colorKey: 'quarters' },
      { id: 'communalKitchen', area: 420, colorKey: 'domestic' },
      { id: 'stairAndLiftNode', area: 180, colorKey: 'transit' },
      { id: 'sectorAirlock', area: 120, colorKey: 'airlock' },
      { id: 'storageAndUtilities', area: 485, colorKey: 'circulation' },
    ],
    [
      { id: 'canteen', area: 780, colorKey: 'quarters' },
      { id: 'assemblyHall', area: 560, colorKey: 'assembly' },
      { id: 'sportsHall', area: 620, colorKey: 'recreation' },
      { id: 'park', area: 1150, colorKey: 'agriculture' },
      { id: 'library', area: 300, colorKey: 'knowledge' },
      { id: 'hobbyWorkshops', area: 380, colorKey: 'workshop' },
      { id: 'sanitaryAndChangingRooms', area: 250, colorKey: 'lifeSupport' },
      { id: 'circulationAndAncillary', area: 861, colorKey: 'circulation' },
    ],
    [
      { id: 'school', area: 820, colorKey: 'knowledge' },
      { id: 'infirmary', area: 640, colorKey: 'critical' },
      { id: 'laboratories', area: 520, colorKey: 'lifeSupport' },
      { id: 'controlAndAdministration', area: 300, colorKey: 'transit' },
      { id: 'precisionWorkshops', area: 700, colorKey: 'workshop' },
      { id: 'consumablesStore', area: 780, colorKey: 'circulation' },
      { id: 'circulationAndAncillary', area: 936, colorKey: 'circulation' },
    ],
    [
      { id: 'airProcessing', area: 980, colorKey: 'lifeSupport' },
      { id: 'waterProcessing', area: 820, colorKey: 'water' },
      { id: 'shieldingWaterTanks', area: 1150, colorKey: 'shielding' },
      { id: 'powerDistribution', area: 340, colorKey: 'critical' },
      { id: 'materialRecovery', area: 620, colorKey: 'agriculture' },
      { id: 'maintenanceGalleries', area: 583, colorKey: 'circulation' },
    ],
    [
      { id: 'spokeHead', area: 260, colorKey: 'transit' },
      { id: 'runningTrack', area: 900, colorKey: 'recreation' },
      { id: 'longTermStore', area: 1400, colorKey: 'circulation' },
      { id: 'hubAirlock', area: 180, colorKey: 'airlock' },
      { id: 'expansionReserve', area: 1548, colorKey: 'reserve' },
    ],
  ],
  ringB: [
    [
      { id: 'grainTerracesNorth', area: 1500, colorKey: 'agriculture' },
      { id: 'grainTerracesSouth', area: 1500, colorKey: 'agriculture' },
      { id: 'irrigationAndNutrients', area: 560, colorKey: 'water' },
      { id: 'harvestGallery', area: 700, colorKey: 'circulation' },
      { id: 'dryingAndRipening', area: 520, colorKey: 'workshop' },
      { id: 'technicalBay', area: 325, colorKey: 'reserve' },
    ],
    [
      { id: 'vegetableHydroponics', area: 2400, colorKey: 'agriculture' },
      { id: 'fruitTrees', area: 1100, colorKey: 'orchard' },
      { id: 'pollinatorInsectary', area: 260, colorKey: 'workshop' },
      { id: 'seedlingNursery', area: 480, colorKey: 'recreation' },
      { id: 'circulation', area: 661, colorKey: 'circulation' },
    ],
    [
      { id: 'algaeReactors', area: 1400, colorKey: 'lifeSupport' },
      { id: 'aquacultureTanks', area: 1050, colorKey: 'water' },
      { id: 'insectFarming', area: 780, colorKey: 'workshop' },
      { id: 'culturedMeat', area: 600, colorKey: 'quarters' },
      { id: 'circulationAndPlant', area: 866, colorKey: 'circulation' },
    ],
    [
      { id: 'foodProcessing', area: 1050, colorKey: 'workshop' },
      { id: 'coldStore', area: 900, colorKey: 'shielding' },
      { id: 'dryStore', area: 780, colorKey: 'circulation' },
      { id: 'seedPropagation', area: 520, colorKey: 'knowledge' },
      { id: 'circulation', area: 1243, colorKey: 'circulation' },
    ],
    [
      { id: 'compostingAndBioreactors', area: 1250, colorKey: 'agriculture' },
      { id: 'nutrientRecovery', area: 800, colorKey: 'water' },
      { id: 'mushroomCultures', area: 700, colorKey: 'substrate' },
      { id: 'substrateStore', area: 620, colorKey: 'substrate' },
      { id: 'circulationAndHubAirlock', area: 918, colorKey: 'circulation' },
    ],
  ],
};

function buildDeck(rooms, deckIndex) {
  return Object.freeze({
    index: deckIndex + 1,
    radius: DECK_RADII[deckIndex],
    rooms: Object.freeze(rooms.map((room) => Object.freeze({ ...room }))),
  });
}

/** Both rings with their five decks, the single source for the deck plan. */
export const DECK_LAYOUT = Object.freeze(
  RING_IDS.map((id) => Object.freeze({ id, decks: Object.freeze(ROOMS[id].map(buildDeck)) }))
);

/**
 * Every colour key in use, sorted. The palette in the scene layer resolves
 * these to actual colours and can be checked against this list for gaps.
 */
export const ROOM_COLOR_KEYS = Object.freeze(
  [
    ...new Set(
      DECK_LAYOUT.flatMap((ring) => ring.decks.flatMap((deck) => deck.rooms)).map(
        (room) => room.colorKey
      )
    ),
  ].sort()
);

export function ringById(ringId) {
  return DECK_LAYOUT.find((ring) => ring.id === ringId);
}

/** One deck by ring id and one-based deck number, undefined for unknown input. */
export function deckAt(ringId, deckIndex) {
  return ringById(ringId)?.decks.find((deck) => deck.index === deckIndex);
}

export function roomsOf(ringId, deckIndex) {
  return deckAt(ringId, deckIndex)?.rooms ?? [];
}

/** All 59 rooms of both rings in layout order. */
export function allRooms() {
  return DECK_LAYOUT.flatMap((ring) => ring.decks.flatMap((deck) => deck.rooms));
}

/** Translation key prefix of a deck, extended by ".name", ".use" or ".note". */
export function deckKey(ringId, deckIndex) {
  return `ship.deck.${ringId}.${deckIndex}`;
}

/** Translation key prefix of a room, extended by ".name" or ".description". */
export function roomKey(ringId, deckIndex, roomId) {
  return `ship.room.${ringId}.${deckIndex}.${roomId}`;
}
