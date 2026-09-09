import { DECK_RADII, HABITAT, SPIN_RATE } from '../constants/shipDesign.js';

/** Centrifugal acceleration at a radius, expressed in multiples of g. */
export function gravityAt(radius) {
  return (SPIN_RATE * SPIN_RATE * radius) / HABITAT.standardGravity;
}

export function rimSpeed(radius) {
  return SPIN_RATE * radius;
}

/**
 * Coriolis acceleration felt by someone walking across the spin direction.
 * Independent of radius, which is why it dominates on the inner decks.
 */
export function coriolisAcceleration(speed) {
  return 2 * SPIN_RATE * speed;
}

/** Arc length of one of the four pressure sectors on a deck. */
export function sectorLength(radius) {
  return (2 * Math.PI * radius) / HABITAT.sectorsPerRing;
}

export function sectorArea(radius) {
  return sectorLength(radius) * HABITAT.axialWidth;
}

/** Sector floor minus the longitudinal corridor that runs its whole length. */
export function usableRoomArea(radius) {
  return sectorLength(radius) * (HABITAT.axialWidth - HABITAT.corridorWidth);
}

export function deckAreas() {
  return DECK_RADII.map((radius, index) => ({
    index: index + 1,
    radius,
    gravity: gravityAt(radius),
    sectorLength: sectorLength(radius),
    sectorArea: sectorArea(radius),
    usableRoomArea: usableRoomArea(radius),
  }));
}

/** Floor area of one ring: every deck at its own radius, times four sectors. */
export function ringArea() {
  return DECK_RADII.reduce((sum, radius) => sum + HABITAT.sectorsPerRing * sectorArea(radius), 0);
}

export function totalDeckArea() {
  return HABITAT.ringCount * ringArea();
}

export function areaPerCrewMember(crew) {
  return totalDeckArea() / crew;
}
