import { describe, expect, it } from 'vitest';
import { advanceDistance, chapterAt, readoutAt } from './flightPresentation.js';
import { CHAPTERS } from '../constants/chapters.js';
import { MISSION } from '../constants/missionProfile.js';
import { phaseDurations } from './flightState.js';

describe('chapterAt', () => {
  it('returns the first chapter at the start of the journey', () => {
    expect(chapterAt(MISSION.startDistance).id).toBe(CHAPTERS[0].id);
  });

  it('returns the last chapter at the target', () => {
    expect(chapterAt(MISSION.totalDistance).id).toBe(CHAPTERS.at(-1).id);
  });

  it('never returns nothing, at any distance along the path', () => {
    for (let i = 0; i <= 200; i += 1) {
      const distance = (MISSION.totalDistance * i) / 200;
      expect(chapterAt(distance)).toBeTruthy();
    }
  });

  it('advances monotonically, it never steps back as the ship moves on', () => {
    const order = CHAPTERS.map((chapter) => chapter.id);
    let previous = -1;
    for (let i = 0; i <= 400; i += 1) {
      const distance = (MISSION.totalDistance * i) / 400;
      const index = order.indexOf(chapterAt(distance).id);
      expect(index).toBeGreaterThanOrEqual(previous);
      previous = index;
    }
  });

  it('holds the first chapter for a distance short of the start', () => {
    expect(chapterAt(0).id).toBe(CHAPTERS[0].id);
  });
});

describe('readoutAt', () => {
  it('reads zero speed and the tow clock at the very start', () => {
    const readout = readoutAt(0);
    expect(readout.speedKmS).toBe(0);
    expect(readout.missionYears).toBeCloseTo(MISSION.towDuration, 6);
  });

  it('reads cruise speed in kilometres per second during the coast', () => {
    expect(readoutAt(MISSION.totalDistance / 2).speedKmS).toBeCloseTo(
      MISSION.cruiseSpeed / 1000,
      6
    );
  });

  it('counts the distance still to run to the target', () => {
    const readout = readoutAt(1000);
    expect(readout.distanceFromSunAu).toBe(1000);
    expect(readout.distanceToTargetAu).toBeCloseTo(MISSION.totalDistance - 1000, 6);
  });

  it('never reports a negative distance to go', () => {
    expect(readoutAt(MISSION.totalDistance * 1.5).distanceToTargetAu).toBe(0);
  });

  it('starts on the first generation and ends on the eighteenth', () => {
    expect(readoutAt(0).generation).toBe(1);
    expect(readoutAt(MISSION.totalDistance).generation).toBe(18);
  });

  it('advances a generation every 26 years, never faster', () => {
    const total = phaseDurations().total;
    expect(Math.ceil(total / MISSION.generationGap)).toBe(18);
  });

  it('names the phase the ship is in', () => {
    expect(readoutAt(0).phase).toBe('acceleration');
    expect(readoutAt(MISSION.totalDistance / 2).phase).toBe('cruise');
    expect(readoutAt(MISSION.totalDistance - 1).phase).toBe('braking');
  });
});

describe('advanceDistance', () => {
  it('moves at all even at a standstill, so playback never stalls at the start', () => {
    expect(advanceDistance(0, 1)).toBeGreaterThan(0);
  });

  it('covers a light year in far less time during the coast than during the burn', () => {
    const duringBurn = advanceDistance(100, 1);
    const duringCoast = advanceDistance(MISSION.totalDistance / 2, 1);
    expect(duringCoast).toBeGreaterThan(duringBurn);
  });

  it('matches the cruise speed exactly while coasting', () => {
    const perYear = advanceDistance(MISSION.totalDistance / 2, 1);
    const expected = ((MISSION.cruiseSpeed / 1000) * MISSION.yearInSeconds) / 1.495978707e8;
    expect(perYear).toBeCloseTo(expected, 3);
  });

  it('scales linearly with the elapsed years', () => {
    const one = advanceDistance(MISSION.totalDistance / 2, 1);
    const three = advanceDistance(MISSION.totalDistance / 2, 3);
    expect(three).toBeCloseTo(one * 3, 6);
  });
});
