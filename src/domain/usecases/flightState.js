import { AU_M } from '../constants/astronomy.js';
import { MISSION } from '../constants/missionProfile.js';

const {
  accelerationDistance,
  accelerationRate,
  brakingDistance,
  brakingRate,
  cruiseDistance,
  cruiseSpeed,
  totalDistance,
  towDuration,
  yearInSeconds,
} = MISSION;

const ACCELERATION_YEARS = cruiseSpeed / accelerationRate / yearInSeconds;
const BRAKING_YEARS = cruiseSpeed / brakingRate / yearInSeconds;
const CRUISE_YEARS = (cruiseDistance * AU_M) / cruiseSpeed / yearInSeconds;

export function phaseDurations() {
  return {
    tow: towDuration,
    acceleration: ACCELERATION_YEARS,
    cruise: CRUISE_YEARS,
    braking: BRAKING_YEARS,
    total: towDuration + ACCELERATION_YEARS + CRUISE_YEARS + BRAKING_YEARS,
  };
}

export function missionPhaseAt(distance) {
  if (distance <= accelerationDistance) return 'acceleration';
  if (distance <= totalDistance - brakingDistance) return 'cruise';
  return 'braking';
}

/**
 * Two clocks run on this flight and they differ by the 1.5 year tow out of
 * the Earth-Moon system. timeSinceIgnition starts at the first pulse,
 * missionTime starts when the ship casts off. Published figures such as
 * "Neptune after 1.7 years" are quoted against ignition.
 */
function withClocks(speed, yearsSinceIgnition) {
  return {
    speed,
    timeSinceIgnition: yearsSinceIgnition,
    missionTime: yearsSinceIgnition + towDuration,
    time: yearsSinceIgnition + towDuration,
  };
}

/**
 * Speed in m/s and elapsed years at a given distance from the sun, measured
 * in AU along the flight path.
 */
export function flightStateAt(distance) {
  if (distance <= accelerationDistance) {
    const seconds = Math.sqrt((2 * Math.max(distance, 0) * AU_M) / accelerationRate);
    return withClocks(accelerationRate * seconds, seconds / yearInSeconds);
  }
  if (distance <= totalDistance - brakingDistance) {
    return withClocks(
      cruiseSpeed,
      ACCELERATION_YEARS + ((distance - accelerationDistance) * AU_M) / cruiseSpeed / yearInSeconds
    );
  }
  const travelled = (distance - (totalDistance - brakingDistance)) * AU_M;
  const speed = Math.sqrt(Math.max(cruiseSpeed * cruiseSpeed - 2 * brakingRate * travelled, 0));
  return withClocks(
    speed,
    ACCELERATION_YEARS + CRUISE_YEARS + (cruiseSpeed - speed) / brakingRate / yearInSeconds
  );
}
