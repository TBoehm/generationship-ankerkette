import { HULL } from '../constants/shipDesign.js';
import { MISSION } from '../constants/missionProfile.js';
import { phaseDurations } from './flightState.js';
import { totalDeckArea } from './deckGeometry.js';

/**
 * Screen level aggregation for the overview. Every value is derived here so
 * the view never restates a figure that the design already fixes.
 */
export function overviewKeyFigures() {
  const durations = phaseDurations();

  return [
    { id: 'length', value: HULL.length, unit: 'units.metre', decimals: 0 },
    { id: 'hullDiameter', value: HULL.diameter, unit: 'units.metre', decimals: 0 },
    { id: 'dryMass', value: HULL.dryMassTonnes, unit: 'units.tonne', decimals: 0 },
    { id: 'deckArea', value: totalDeckArea(), unit: 'units.squareMetre', decimals: 0 },
    { id: 'crew', value: HULL.crew, unit: 'units.persons', decimals: 0 },
    {
      id: 'distance',
      value: MISSION.targetDistanceLightYears,
      unit: 'units.lightYear',
      decimals: 4,
    },
    {
      id: 'cruiseSpeed',
      value: MISSION.cruiseSpeed / 1000,
      unit: 'units.kilometrePerSecond',
      decimals: 0,
    },
    { id: 'duration', value: durations.total, unit: 'units.year', decimals: 1 },
    {
      id: 'generations',
      value: Math.round(durations.total / MISSION.generationGap),
      unit: '',
      decimals: 0,
    },
  ];
}
