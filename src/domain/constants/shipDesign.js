import { STANDARD_GRAVITY } from './astronomy.js';

/**
 * Hull figures. Derived values live in the use cases, this file only carries
 * what the design fixes. Changing a number here changes the ship, so
 * CLAUDE.md has to be recalculated along with it.
 */
export const HULL = Object.freeze({
  length: 790,
  diameter: 280,
  dryMassTonnes: 539_000,
  fuelledMassTonnes: 779_000,
  crew: 1000,
});

/** Radii of the five decks, outermost first. Each deck has its own radius. */
export const DECK_RADII = Object.freeze([125, 120, 115, 110, 105]);

export const HABITAT = Object.freeze({
  outerRadius: 125,
  innerRadius: 105,
  axialWidth: 30,
  radialHeight: 25,
  deckHeight: 5,
  corridorWidth: 4,
  sectorsPerRing: 4,
  ringCount: 2,
  spinRpm: 1.89,
  walkingSpeed: 1.5,
  standardGravity: STANDARD_GRAVITY,
});

/** Angular velocity of both counter-rotating rings, in radians per second. */
export const SPIN_RATE = (HABITAT.spinRpm * 2 * Math.PI) / 60;
