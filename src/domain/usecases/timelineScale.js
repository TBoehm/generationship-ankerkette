import { MISSION } from '../constants/missionProfile.js';

const { endDistance, startDistance, totalDistance } = MISSION;
const HALF_DISTANCE = totalDistance / 2;

/**
 * The slider is logarithmic in both halves: the first half opens up the
 * departure, the second the arrival, and the empty middle passes quickly.
 * Roughly 7.7 decades per half.
 */
export function sliderToDistance(position) {
  if (position <= 0.5) {
    return startDistance * Math.pow(HALF_DISTANCE / startDistance, position / 0.5);
  }
  return (
    totalDistance - HALF_DISTANCE * Math.pow(endDistance / HALF_DISTANCE, (position - 0.5) / 0.5)
  );
}

export function distanceToSlider(distance) {
  if (distance <= HALF_DISTANCE) {
    return (
      (0.5 * Math.log(Math.max(distance, startDistance) / startDistance)) /
      Math.log(HALF_DISTANCE / startDistance)
    );
  }
  return (
    0.5 +
    (0.5 * Math.log(HALF_DISTANCE / Math.max(totalDistance - distance, endDistance))) /
      Math.log(HALF_DISTANCE / endDistance)
  );
}
