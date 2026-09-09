import { MISSION } from './missionProfile.js';

/**
 * The twelve chapters of the journey, transcribed from the legacy single file
 * draft. They do two jobs at once: they are the chips of the dock, so every
 * chapter carries the distance the chip jumps to, and they are the running
 * commentary, so every chapter carries the span in which its text applies.
 *
 * Prose is prose, so the title and the text reach the view as i18n keys of
 * the shape `flight.chapter.<id>.title` and `flight.chapter.<id>.text`.
 *
 * Two departures from the legacy file, both deliberate:
 *
 * - The legacy chips jumped to the closing distance of their chapter, which
 *   selected the following chapter for four of them. A chapter is marked at
 *   its opening distance here, so the chip and the text always agree.
 * - The last chapter closed at 1e12 AU, a sentinel that stood in for the end
 *   of the slider. It closes at the arrival now.
 *
 * Distances are astronomical units, measured from the sun along the path.
 * `stage` is the coarse label the dock shows, one to five, the tow being one.
 */

const TOTAL = MISSION.totalDistance;
const HALF = TOTAL / 2;
const BURNOUT = MISSION.accelerationDistance;
const BRAKING_START = TOTAL - MISSION.brakingDistance;

/** Where the heliosphere ends and the ship is in interstellar space. */
const HELIOPAUSE = 120;
/** Where the sun loses its gravitational hold, the outer edge of the cloud. */
const OUTER_CLOUD = 100000;

function chapter(id, stage, distance, endDistance) {
  return Object.freeze({
    id,
    stage,
    distance,
    endDistance,
    titleKey: `flight.chapter.${id}.title`,
    textKey: `flight.chapter.${id}.text`,
  });
}

export const CHAPTERS = Object.freeze([
  chapter('departure', 1, MISSION.startDistance, 1),
  chapter('planetaryZone', 2, 1, 30.1),
  chapter('kuiperBelt', 2, 30.1, HELIOPAUSE),
  chapter('interstellarMedium', 2, HELIOPAUSE, 2000),
  chapter('innerOortCloud', 2, 2000, BURNOUT),
  chapter('cruise', 3, BURNOUT, OUTER_CLOUD),
  chapter('outerOortCloud', 3, OUTER_CLOUD, HALF),
  chapter('betweenStars', 3, HALF, MISSION.nakedEyeDistance),
  chapter('proximaVisible', 3, MISSION.nakedEyeDistance, BRAKING_START),
  chapter('braking', 4, BRAKING_START, TOTAL - 1000),
  chapter('approach', 4, TOTAL - 1000, TOTAL - 0.5),
  chapter('arrival', 5, TOTAL - 0.5, TOTAL),
]);
