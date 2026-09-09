import { SHIP_SECTIONS } from '../constants/shipSections.js';

/**
 * Where the ship camera should look and how far away it should stand for a
 * given selection, and how fast it eases there.
 *
 * The legacy document flew to four framings: the whole ship, one section, a
 * ring, and a single deck of a ring. Keeping that is what makes the fly-to
 * read as a move rather than as a cut, so the distances stay, named.
 *
 * The easing is the one real change. The original moved a fixed fraction of
 * the remaining distance per frame, which ties the speed of the move to the
 * frame rate: the same fly-to takes twice as long at 120 Hz as at 60 Hz.
 * Here the fraction follows from the elapsed time, so the move takes the same
 * wall clock time on every machine and matches the original at 60 Hz.
 */

/** Distances in metres, the world unit of the ship scene. */
export const SHIP_FRAMING = Object.freeze({
  overviewTargetZ: 60,
  overviewDistance: 1250,
  sectionDistance: 900,
  ringDistance: 600,
  deckDistance: 330,
});

/** Fraction of the remaining distance covered per second, as a rate. */
export const APPROACH_RATE = 5;

function sectionById(id) {
  return SHIP_SECTIONS.find((section) => section.id === id);
}

/** Midpoint of a section along the flight axis. */
export function sectionCenterZ(id) {
  const section = sectionById(id);
  return section ? (section.z.from + section.z.to) / 2 : SHIP_FRAMING.overviewTargetZ;
}

/**
 * The goal the camera eases towards for a selection of the shape
 * `{ section, deck, room }`. An unknown or missing section frames the whole
 * ship, which is also the state the view starts in.
 */
export function framingFor(selection) {
  const section = selection ? sectionById(selection.section) : undefined;
  if (!section) {
    return {
      targetZ: SHIP_FRAMING.overviewTargetZ,
      distance: SHIP_FRAMING.overviewDistance,
    };
  }

  const targetZ = (section.z.from + section.z.to) / 2;
  if (!section.carriesRing) return { targetZ, distance: SHIP_FRAMING.sectionDistance };

  const hasDeck = selection.deck !== null && selection.deck !== undefined;
  return { targetZ, distance: hasDeck ? SHIP_FRAMING.deckDistance : SHIP_FRAMING.ringDistance };
}

/**
 * One frame of exponential easing towards `goal`. Frame rate independent:
 * the same elapsed time covers the same fraction, however it is cut up.
 */
export function approach(current, goal, deltaMs) {
  if (!Number.isFinite(deltaMs) || deltaMs <= 0) return current;
  return current + (goal - current) * (1 - Math.exp((-APPROACH_RATE * deltaMs) / 1000));
}
