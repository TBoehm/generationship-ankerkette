import { describe, expect, it } from 'vitest';
import { SHIP_SECTIONS } from '../constants/shipSections.js';
import { SHIP_ORBIT_LIMITS } from './cameraOrbit.js';
import {
  APPROACH_RATE,
  SHIP_FRAMING,
  approach,
  framingFor,
  sectionCenterZ,
} from './shipFraming.js';

const RING = SHIP_SECTIONS.find((section) => section.carriesRing);
const PLAIN = SHIP_SECTIONS.find((section) => !section.carriesRing);

describe('sectionCenterZ', () => {
  it('is the midpoint of the extent the section table carries', () => {
    expect(sectionCenterZ(PLAIN.id)).toBeCloseTo((PLAIN.z.from + PLAIN.z.to) / 2, 12);
  });

  it('is the ring plane itself for a ring, which has no extent along the axis', () => {
    expect(sectionCenterZ(RING.id)).toBe(RING.z.from);
  });

  it('falls back to the overview for an unknown id instead of returning NaN', () => {
    expect(sectionCenterZ('noSuchSection')).toBe(SHIP_FRAMING.overviewTargetZ);
  });
});

describe('framingFor', () => {
  it('frames the whole ship when nothing is selected', () => {
    expect(framingFor(null)).toEqual({
      targetZ: SHIP_FRAMING.overviewTargetZ,
      distance: SHIP_FRAMING.overviewDistance,
    });
  });

  it('frames the whole ship for a selection that names no section', () => {
    expect(framingFor({ section: null, deck: null, room: null }).distance).toBe(
      SHIP_FRAMING.overviewDistance
    );
  });

  it('frames the whole ship for a section id that does not exist', () => {
    expect(framingFor({ section: 'noSuchSection' }).distance).toBe(SHIP_FRAMING.overviewDistance);
  });

  it('flies to the middle of a plain section', () => {
    const framing = framingFor({ section: PLAIN.id, deck: null, room: null });
    expect(framing.targetZ).toBeCloseTo((PLAIN.z.from + PLAIN.z.to) / 2, 12);
    expect(framing.distance).toBe(SHIP_FRAMING.sectionDistance);
  });

  it('stands further back for a whole ring than for one of its decks', () => {
    const ring = framingFor({ section: RING.id, deck: null, room: null });
    const deck = framingFor({ section: RING.id, deck: 3, room: null });
    expect(ring.distance).toBe(SHIP_FRAMING.ringDistance);
    expect(deck.distance).toBe(SHIP_FRAMING.deckDistance);
    expect(deck.distance).toBeLessThan(ring.distance);
    expect(deck.targetZ).toBe(ring.targetZ);
  });

  it('keeps the deck framing once a room inside that deck is selected', () => {
    const room = framingFor({ section: RING.id, deck: 1, room: 'dwellingBlockA' });
    expect(room.distance).toBe(SHIP_FRAMING.deckDistance);
  });

  it('treats an undefined deck as no deck', () => {
    expect(framingFor({ section: RING.id }).distance).toBe(SHIP_FRAMING.ringDistance);
  });

  it('never asks for a distance the orbit would refuse', () => {
    const distances = [
      framingFor(null),
      framingFor({ section: PLAIN.id }),
      ...SHIP_SECTIONS.map((section) => framingFor({ section: section.id, deck: 1 })),
    ].map((framing) => framing.distance);
    for (const distance of distances) {
      expect(distance).toBeGreaterThanOrEqual(SHIP_ORBIT_LIMITS.minDistance);
      expect(distance).toBeLessThanOrEqual(SHIP_ORBIT_LIMITS.maxDistance);
    }
  });

  it('keeps every section inside the hull it belongs to', () => {
    for (const section of SHIP_SECTIONS) {
      const { targetZ } = framingFor({ section: section.id });
      expect(targetZ).toBeGreaterThanOrEqual(section.z.from);
      expect(targetZ).toBeLessThanOrEqual(section.z.to);
    }
  });
});

describe('approach', () => {
  it('moves towards the goal without overshooting it', () => {
    const next = approach(0, 100, 16);
    expect(next).toBeGreaterThan(0);
    expect(next).toBeLessThan(100);
  });

  it('matches the legacy step of eight percent at sixty hertz', () => {
    expect(approach(0, 1, 1000 / 60)).toBeCloseTo(0.08, 3);
  });

  it('covers the same fraction over the same time however it is cut up', () => {
    const oneStep = approach(0, 1, 100);
    let manySteps = 0;
    for (let i = 0; i < 10; i += 1) manySteps = approach(manySteps, 1, 10);
    expect(manySteps).toBeCloseTo(oneStep, 12);
  });

  it('arrives, given enough time', () => {
    expect(approach(0, 100, 10_000)).toBeCloseTo(100, 6);
  });

  it('stands still on a frame of no length', () => {
    expect(approach(42, 100, 0)).toBe(42);
  });

  it('stands still rather than jumping back on a backwards timestamp', () => {
    expect(approach(42, 100, -20)).toBe(42);
  });

  it('stands still on a delta that is not a number', () => {
    expect(approach(42, 100, Number.NaN)).toBe(42);
  });

  it('has a rate that is a real speed, not a per frame fraction', () => {
    expect(APPROACH_RATE).toBeGreaterThan(0);
    expect(approach(0, 1, 1000)).toBeCloseTo(1 - Math.exp(-APPROACH_RATE), 12);
  });
});
