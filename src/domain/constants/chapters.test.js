import { describe, expect, it } from 'vitest';
import { CHAPTERS } from './chapters.js';
import { MISSION } from './missionProfile.js';
import { missionPhaseAt } from '../usecases/flightState.js';

/**
 * The order of the chips in the dock, bow of the journey first. Every id is
 * also the middle segment of its two i18n keys, `flight.chapter.<id>.title`
 * and `flight.chapter.<id>.text`.
 */
const EXPECTED_ORDER = [
  'departure',
  'planetaryZone',
  'kuiperBelt',
  'interstellarMedium',
  'innerOortCloud',
  'cruise',
  'outerOortCloud',
  'betweenStars',
  'proximaVisible',
  'braking',
  'approach',
  'arrival',
];

/**
 * The phase a chapter sits in, measured in the middle of its own span rather
 * than at its first metre. The cruise chapter opens at burnout and the
 * braking chapter opens at the moment the sail is deployed, so both open
 * exactly on a phase boundary. missionPhaseAt closes its intervals to the
 * left, which makes the first metre of each of them report the phase before.
 */
const EXPECTED_PHASE = {
  departure: 'acceleration',
  planetaryZone: 'acceleration',
  kuiperBelt: 'acceleration',
  interstellarMedium: 'acceleration',
  innerOortCloud: 'acceleration',
  cruise: 'cruise',
  outerOortCloud: 'cruise',
  betweenStars: 'cruise',
  proximaVisible: 'cruise',
  braking: 'braking',
  approach: 'braking',
  arrival: 'braking',
};

const byId = (id) => CHAPTERS.find((chapter) => chapter.id === id);
const middleOf = (chapter) => (chapter.distance + chapter.endDistance) / 2;

describe('CHAPTERS', () => {
  it('lists the twelve chapters of the journey in order', () => {
    expect(CHAPTERS).toHaveLength(12);
    expect(CHAPTERS.map((chapter) => chapter.id)).toEqual(EXPECTED_ORDER);
  });

  it('gives every chapter a unique id', () => {
    const ids = CHAPTERS.map((chapter) => chapter.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('marks strictly increasing distances', () => {
    for (let i = 1; i < CHAPTERS.length; i += 1) {
      expect(CHAPTERS[i].distance).toBeGreaterThan(CHAPTERS[i - 1].distance);
    }
  });

  it('starts no earlier than the slider and ends no later than the target', () => {
    expect(CHAPTERS[0].distance).toBeGreaterThanOrEqual(MISSION.startDistance);
    expect(CHAPTERS[CHAPTERS.length - 1].distance).toBeLessThanOrEqual(MISSION.totalDistance);
  });

  it('covers the whole flight without a gap and without an overlap', () => {
    for (let i = 1; i < CHAPTERS.length; i += 1) {
      expect(CHAPTERS[i].distance).toBe(CHAPTERS[i - 1].endDistance);
    }
    expect(CHAPTERS[CHAPTERS.length - 1].endDistance).toBe(MISSION.totalDistance);
  });

  it('opens every chapter before it closes it', () => {
    for (const chapter of CHAPTERS) {
      expect(chapter.endDistance).toBeGreaterThan(chapter.distance);
    }
  });

  it('maps every chapter to a sensible mission phase', () => {
    for (const chapter of CHAPTERS) {
      expect(missionPhaseAt(middleOf(chapter))).toBe(EXPECTED_PHASE[chapter.id]);
    }
  });

  it('cuts the chapters on the physical marks of the profile', () => {
    expect(byId('departure').distance).toBe(MISSION.startDistance);
    expect(byId('cruise').distance).toBe(MISSION.accelerationDistance);
    expect(byId('outerOortCloud').endDistance).toBe(MISSION.totalDistance / 2);
    expect(byId('proximaVisible').distance).toBe(MISSION.nakedEyeDistance);
    expect(byId('braking').distance).toBe(MISSION.totalDistance - MISSION.brakingDistance);
    expect(byId('arrival').endDistance - byId('arrival').distance).toBeCloseTo(0.5, 6);
  });

  it('runs its five stages upward, one stage per chapter', () => {
    expect(CHAPTERS.map((chapter) => chapter.stage)).toEqual([1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 5]);
    for (let i = 1; i < CHAPTERS.length; i += 1) {
      expect(CHAPTERS[i].stage).toBeGreaterThanOrEqual(CHAPTERS[i - 1].stage);
    }
  });

  it('leaves the tow stage before the pulse drive is allowed to fire', () => {
    // The treaty of 1963 forbids a nuclear detonation in space near earth.
    expect(byId('departure').stage).toBe(1);
    expect(byId('planetaryZone').stage).toBe(2);
  });

  it('carries no prose, only ids, keys and numbers', () => {
    const serialized = JSON.stringify(CHAPTERS);
    expect(serialized).toMatch(/^[ -~]*$/);
    for (const chapter of CHAPTERS) {
      expect(Object.keys(chapter).sort()).toEqual([
        'distance',
        'endDistance',
        'id',
        'stage',
        'textKey',
        'titleKey',
      ]);
      expect(chapter.titleKey).toBe(`flight.chapter.${chapter.id}.title`);
      expect(chapter.textKey).toBe(`flight.chapter.${chapter.id}.text`);
    }
  });

  it('is frozen', () => {
    expect(Object.isFrozen(CHAPTERS)).toBe(true);
    for (const chapter of CHAPTERS) expect(Object.isFrozen(chapter)).toBe(true);
  });
});
