import { describe, expect, it } from 'vitest';
import {
  PLAYBACK_DURATION_SECONDS,
  advancePlayback,
  chapterAt,
  isPlaybackComplete,
  readoutAt,
} from './flightPresentation.js';
import { distanceToSlider } from './timelineScale.js';
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

describe('advancePlayback', () => {
  const sliderStep = (from, seconds) =>
    distanceToSlider(advancePlayback(from, seconds)) - distanceToSlider(from);

  it('runs the whole journey in the playback duration', () => {
    let distance = MISSION.startDistance;
    for (let i = 0; i < PLAYBACK_DURATION_SECONDS; i += 1) {
      distance = advancePlayback(distance, 1);
    }
    expect(distanceToSlider(distance)).toBeCloseTo(1, 6);
  });

  it('moves at a constant rate along the logarithmic scale, not along the distance', () => {
    const expected = 1 / PLAYBACK_DURATION_SECONDS;
    for (const at of [0.05, 0.2, 0.5, 0.8, 0.95]) {
      const from = advancePlayback(MISSION.startDistance, at * PLAYBACK_DURATION_SECONDS);
      expect(sliderStep(from, 1)).toBeCloseTo(expected, 9);
    }
  });

  it('crawls out of the solar system, which is the whole point of the log scale', () => {
    const covered = advancePlayback(MISSION.startDistance, 1) - MISSION.startDistance;
    expect(covered).toBeLessThan(0.01);
  });

  it('crosses the empty middle in a rush', () => {
    const middle = MISSION.totalDistance / 2;
    const covered = advancePlayback(middle, 1) - middle;
    expect(covered).toBeGreaterThan(1000);
  });

  it('slows down again on the approach to Proxima', () => {
    const nearTarget = MISSION.totalDistance - 1;
    const covered = advancePlayback(nearTarget, 1) - nearTarget;
    expect(covered).toBeLessThan(1);
  });

  it('covers far more ground per second in the middle than at either end', () => {
    const atStart = advancePlayback(MISSION.startDistance, 1) - MISSION.startDistance;
    const atMiddle = advancePlayback(MISSION.totalDistance / 2, 1) - MISSION.totalDistance / 2;
    const atEnd = advancePlayback(MISSION.totalDistance - 1, 1) - (MISSION.totalDistance - 1);
    expect(atMiddle / atStart).toBeGreaterThan(1e6);
    expect(atMiddle / atEnd).toBeGreaterThan(1e3);
  });

  it('stops at the target instead of running past it', () => {
    expect(advancePlayback(MISSION.totalDistance, 10)).toBeLessThanOrEqual(MISSION.totalDistance);
    // The round trip through the two logarithms costs a few ulps, so the
    // slider lands on one to within float precision, not on the exact bit.
    const end = advancePlayback(MISSION.startDistance, PLAYBACK_DURATION_SECONDS * 3);
    expect(distanceToSlider(end)).toBeCloseTo(1, 9);
    expect(end).toBeLessThanOrEqual(MISSION.totalDistance);
  });

  it('never runs backwards on a stalled or reversed frame', () => {
    const from = MISSION.totalDistance / 4;
    expect(advancePlayback(from, 0)).toBeCloseTo(from, 6);
    expect(advancePlayback(from, -5)).toBeCloseTo(from, 6);
  });
});

describe('isPlaybackComplete', () => {
  it('is false at the start and along the way', () => {
    expect(isPlaybackComplete(MISSION.startDistance)).toBe(false);
    expect(isPlaybackComplete(MISSION.totalDistance / 2)).toBe(false);
  });

  it('is true once playback has run its course', () => {
    const end = advancePlayback(MISSION.startDistance, PLAYBACK_DURATION_SECONDS * 2);
    expect(isPlaybackComplete(end)).toBe(true);
  });

  it('does not wait for the raw target distance, which the slider never reaches', () => {
    // The slider stops at the closest approach, MISSION.endDistance short of
    // the target. Waiting for totalDistance would leave playback running.
    const end = advancePlayback(MISSION.startDistance, PLAYBACK_DURATION_SECONDS * 2);
    expect(end).toBeLessThan(MISSION.totalDistance);
    expect(isPlaybackComplete(end)).toBe(true);
  });
});
