import { describe, expect, it } from 'vitest';
import { distanceToSlider, sliderToDistance } from './timelineScale.js';
import { MISSION } from '../constants/missionProfile.js';

describe('sliderToDistance', () => {
  it('starts inside the solar system and ends at the target planet', () => {
    expect(sliderToDistance(0)).toBeCloseTo(MISSION.startDistance, 6);
    expect(sliderToDistance(1)).toBeCloseTo(MISSION.totalDistance - MISSION.endDistance, 6);
  });

  it('puts the halfway mark of the slider at half the track', () => {
    expect(sliderToDistance(0.5)).toBeCloseTo(MISSION.totalDistance / 2, 6);
  });

  it('is strictly increasing', () => {
    const samples = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1].map(sliderToDistance);
    expect(samples).toEqual([...samples].sort((a, b) => a - b));
  });

  it('resolves the near field finely enough to separate the inner planets', () => {
    expect(sliderToDistance(0.05)).toBeLessThan(1);
  });
});

describe('distanceToSlider', () => {
  it('inverts sliderToDistance across both halves', () => {
    for (const s of [0, 0.05, 0.2, 0.5, 0.8, 0.95, 1]) {
      expect(distanceToSlider(sliderToDistance(s))).toBeCloseTo(s, 6);
    }
  });

  it('clamps distances short of the start', () => {
    expect(distanceToSlider(0)).toBe(0);
  });
});
