import { describe, expect, it } from 'vitest';
import { flightStateAt, missionPhaseAt, phaseDurations } from './flightState.js';
import { MISSION } from '../constants/missionProfile.js';

describe('phaseDurations', () => {
  it('matches the flight profile documented for the mission', () => {
    const d = phaseDurations();
    expect(d.tow).toBeCloseTo(1.5, 6);
    expect(d.acceleration).toBeCloseTo(30.0, 1);
    expect(d.cruise).toBeCloseTo(384.6, 1);
    expect(d.braking).toBeCloseTo(50.0, 1);
    expect(d.total).toBeCloseTo(466.1, 1);
  });

  it('spans 18 generations at a 26 year generational gap', () => {
    expect(Math.round(phaseDurations().total / MISSION.generationGap)).toBe(18);
  });
});

describe('flightStateAt', () => {
  it('starts from rest', () => {
    expect(flightStateAt(0).speed).toBe(0);
  });

  it('reaches cruise speed exactly at the end of the burn', () => {
    expect(flightStateAt(MISSION.accelerationDistance).speed).toBeCloseTo(MISSION.cruiseSpeed, 0);
  });

  it('holds cruise speed through the coast', () => {
    const mid = MISSION.totalDistance / 2;
    expect(flightStateAt(mid).speed).toBeCloseTo(MISSION.cruiseSpeed, 6);
  });

  it('arrives at rest', () => {
    expect(flightStateAt(MISSION.totalDistance).speed).toBeCloseTo(0, 6);
  });

  it('never returns a negative speed beyond the target', () => {
    expect(flightStateAt(MISSION.totalDistance * 1.1).speed).toBe(0);
  });

  it('increases elapsed time monotonically along the track', () => {
    const samples = [0, 100, 9487, 50000, 200000, 260000, 268553].map((d) => flightStateAt(d).time);
    expect(samples).toEqual([...samples].sort((a, b) => a - b));
  });

  it('passes the orbit of Neptune at 169 km/s, 1.7 years after ignition', () => {
    const state = flightStateAt(30.07);
    expect(state.speed / 1000).toBeCloseTo(169, 0);
    expect(state.timeSinceIgnition).toBeCloseTo(1.7, 1);
  });

  it('separates the ignition clock from the mission clock by the tow', () => {
    const state = flightStateAt(30.07);
    expect(state.missionTime - state.timeSinceIgnition).toBeCloseTo(MISSION.towDuration, 9);
    expect(state.time).toBe(state.missionTime);
  });
});

describe('missionPhaseAt', () => {
  it('names the phase for a given distance', () => {
    expect(missionPhaseAt(0)).toBe('acceleration');
    expect(missionPhaseAt(MISSION.totalDistance / 2)).toBe('cruise');
    expect(missionPhaseAt(MISSION.totalDistance - 1)).toBe('braking');
  });
});
