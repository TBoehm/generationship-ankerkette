import { AU_M, LIGHT_YEAR_IN_AU, YEAR_IN_SECONDS } from './astronomy.js';

const TOTAL_DISTANCE = 4.2465 * LIGHT_YEAR_IN_AU;
const ACCELERATION_DISTANCE = 9487;
const BRAKING_DISTANCE = 15800;
const CRUISE_SPEED = 2.998e6;

export const MISSION = Object.freeze({
  targetDistanceLightYears: 4.2465,
  totalDistance: TOTAL_DISTANCE,
  accelerationDistance: ACCELERATION_DISTANCE,
  brakingDistance: BRAKING_DISTANCE,
  cruiseDistance: TOTAL_DISTANCE - ACCELERATION_DISTANCE - BRAKING_DISTANCE,
  cruiseSpeed: CRUISE_SPEED,
  accelerationRate: (CRUISE_SPEED * CRUISE_SPEED) / (2 * ACCELERATION_DISTANCE * AU_M),
  brakingRate: (CRUISE_SPEED * CRUISE_SPEED) / (2 * BRAKING_DISTANCE * AU_M),
  towDuration: 1.5,
  generationGap: 26,
  startDistance: 0.0026,
  endDistance: 0.04856,
  nakedEyeDistance: TOTAL_DISTANCE - 24798,
  yearInSeconds: YEAR_IN_SECONDS,
});
