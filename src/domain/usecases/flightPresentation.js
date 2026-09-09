import { CHAPTERS } from '../constants/chapters.js';
import { MISSION } from '../constants/missionProfile.js';
import { flightStateAt, missionPhaseAt } from './flightState.js';
import { distanceToSlider, sliderToDistance } from './timelineScale.js';

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
 * Playback ends where the slider ends, at the closest approach to Proxima b,
 * not at the raw target distance. Those are not the same number, and checking
 * against the wrong one leaves the play button stuck on forever.
 */
const PLAYBACK_EPSILON = 1e-9;

/** How long the whole journey takes when it plays by itself. */
export const PLAYBACK_DURATION_SECONDS = 90;

/**
 * Playback runs at a constant rate along the logarithmic scale, not along the
 * distance. That is what the scale is for: the departure through the planetary
 * system and the arrival at Proxima are where there is something to see, and
 * the empty middle is where there is not.
 *
 * Pacing it by mission time instead does the opposite. The ship is slow while
 * it accelerates, so it covers little distance, but little distance near the
 * sun is a large stretch of a logarithmic scale. The solar system would flash
 * past in a few seconds and the empty middle would crawl for a minute.
 */
export function isPlaybackComplete(distance) {
  return distanceToSlider(distance) >= 1 - PLAYBACK_EPSILON;
}

export function advancePlayback(distance, seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return distance;
  const position = distanceToSlider(distance) + seconds / PLAYBACK_DURATION_SECONDS;
  return sliderToDistance(Math.min(position, 1));
}
