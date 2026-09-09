import { AU_KM } from '../constants/astronomy.js';
import { CHAPTERS } from '../constants/chapters.js';
import { MISSION } from '../constants/missionProfile.js';
import { flightStateAt, missionPhaseAt } from './flightState.js';

/**
 * Screen level aggregation for the journey. The view asks for one distance and
 * gets everything it shows, so no figure is ever computed twice or written as
 * a literal in a component.
 */
export function chapterAt(distance) {
  let current = CHAPTERS[0];
  for (const chapter of CHAPTERS) {
    if (distance >= chapter.distance) current = chapter;
  }
  return current;
}

export function readoutAt(distance) {
  const clamped = Math.min(Math.max(distance, 0), MISSION.totalDistance);
  const state = flightStateAt(clamped);

  return {
    distanceFromSunAu: clamped,
    distanceToTargetAu: Math.max(0, MISSION.totalDistance - clamped),
    speedKmS: state.speed / 1000,
    missionYears: state.missionTime,
    yearsSinceIgnition: state.timeSinceIgnition,
    generation: Math.max(1, Math.ceil(state.missionTime / MISSION.generationGap)),
    phase: missionPhaseAt(clamped),
  };
}

/**
 * How far the ship travels while the given number of mission years pass. Taken
 * from the profile rather than from a constant speed, so the burn and the
 * braking read as slow and the coast as fast. The floor keeps the very first
 * moments moving, where the speed is still zero.
 */
export function advanceDistance(distance, years) {
  const { speedKmS } = readoutAt(distance);
  const auPerYear = (speedKmS * MISSION.yearInSeconds) / AU_KM;
  return Math.max(auPerYear * years, MISSION.startDistance * years);
}
