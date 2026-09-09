import { describe, expect, it } from 'vitest';
import {
  FLIGHT_ORBIT_LIMITS,
  SHIP_ORBIT_LIMITS,
  orbitAfterDrag,
  orbitAfterZoom,
  orbitPosition,
  createOrbitState,
} from './cameraOrbit.js';

const shipState = () =>
  createOrbitState({ theta: 0.85, phi: 1.15, distance: 1250 }, SHIP_ORBIT_LIMITS);

describe('createOrbitState', () => {
  it('keeps a state inside its limits from the start', () => {
    const s = createOrbitState({ theta: 0, phi: 0, distance: 0 }, SHIP_ORBIT_LIMITS);
    expect(s.phi).toBe(SHIP_ORBIT_LIMITS.minPhi);
    expect(s.distance).toBe(SHIP_ORBIT_LIMITS.minDistance);
  });

  it('carries the two documents apart, they were never tuned alike', () => {
    expect(SHIP_ORBIT_LIMITS.dragSensitivity).toBe(0.005);
    expect(FLIGHT_ORBIT_LIMITS.dragSensitivity).toBe(0.006);
    expect(SHIP_ORBIT_LIMITS.minPhi).toBeCloseTo(0.12, 9);
    expect(FLIGHT_ORBIT_LIMITS.minPhi).toBeCloseTo(0.15, 9);
  });
});

describe('orbitAfterDrag', () => {
  it('turns the camera against the drag, as both originals do', () => {
    const s = orbitAfterDrag(shipState(), 100, 0, SHIP_ORBIT_LIMITS);
    expect(s.theta).toBeLessThan(shipState().theta);
  });

  it('never tips past the poles, however hard it is dragged', () => {
    let s = shipState();
    for (let i = 0; i < 500; i += 1) s = orbitAfterDrag(s, 0, 100, SHIP_ORBIT_LIMITS);
    expect(s.phi).toBeGreaterThanOrEqual(SHIP_ORBIT_LIMITS.minPhi);
    expect(s.phi).toBeLessThanOrEqual(SHIP_ORBIT_LIMITS.maxPhi);
    for (let i = 0; i < 500; i += 1) s = orbitAfterDrag(s, 0, -100, SHIP_ORBIT_LIMITS);
    expect(s.phi).toBeGreaterThanOrEqual(SHIP_ORBIT_LIMITS.minPhi);
    expect(s.phi).toBeLessThanOrEqual(SHIP_ORBIT_LIMITS.maxPhi);
  });

  it('keeps the azimuth bounded over a long session instead of drifting', () => {
    let s = shipState();
    for (let i = 0; i < 5000; i += 1) s = orbitAfterDrag(s, -400, 0, SHIP_ORBIT_LIMITS);
    expect(s.theta).toBeGreaterThanOrEqual(0);
    expect(s.theta).toBeLessThan(2 * Math.PI);
  });

  it('leaves the distance alone', () => {
    expect(orbitAfterDrag(shipState(), 30, 30, SHIP_ORBIT_LIMITS).distance).toBe(1250);
  });
});

describe('orbitAfterZoom', () => {
  it('clamps to the dolly range of the ship', () => {
    let s = shipState();
    for (let i = 0; i < 200; i += 1) s = orbitAfterZoom(s, 0.5, SHIP_ORBIT_LIMITS);
    expect(s.distance).toBe(SHIP_ORBIT_LIMITS.minDistance);
    for (let i = 0; i < 200; i += 1) s = orbitAfterZoom(s, 2, SHIP_ORBIT_LIMITS);
    expect(s.distance).toBe(SHIP_ORBIT_LIMITS.maxDistance);
  });

  it('ignores a factor that is not a usable number', () => {
    const s = shipState();
    expect(orbitAfterZoom(s, 0, SHIP_ORBIT_LIMITS).distance).toBe(s.distance);
    expect(orbitAfterZoom(s, Number.NaN, SHIP_ORBIT_LIMITS).distance).toBe(s.distance);
  });

  it('leaves the angles alone', () => {
    const s = orbitAfterZoom(shipState(), 1.12, SHIP_ORBIT_LIMITS);
    expect(s.theta).toBe(shipState().theta);
    expect(s.phi).toBe(shipState().phi);
  });
});

describe('orbitPosition', () => {
  const target = { x: 0, y: 0, z: 60 };

  it('sits exactly the dolly distance away from the target', () => {
    for (const theta of [0, 1, 2.5, 6]) {
      for (const phi of [0.2, 1, 2.9]) {
        const p = orbitPosition({ theta, phi, distance: 1250 }, target);
        const d = Math.hypot(p.x - target.x, p.y - target.y, p.z - target.z);
        expect(d).toBeCloseTo(1250, 6);
      }
    }
  });

  it('uses the convention both legacy documents share, y from the polar angle', () => {
    const p = orbitPosition({ theta: 0, phi: Math.PI / 2, distance: 100 }, { x: 0, y: 0, z: 0 });
    expect(p.x).toBeCloseTo(100, 6);
    expect(p.y).toBeCloseTo(0, 6);
    expect(p.z).toBeCloseTo(0, 6);
  });

  it('puts the camera overhead at a small polar angle', () => {
    const p = orbitPosition({ theta: 0, phi: 0.001, distance: 100 }, { x: 0, y: 0, z: 0 });
    expect(p.y).toBeGreaterThan(99);
  });
});
