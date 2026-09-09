import * as THREE from 'three';
import { afterEach, describe, expect, it } from 'vitest';
import { mountFlightScene } from './testing.js';
import { toScene } from './coordinates.js';
import { INITIAL_ORBIT, INITIAL_SYSTEM_DISTANCE } from './camera.js';
import { DESTINATIONS } from '../../../domain/constants/starSystem.js';
import {
  FLIGHT_ORBIT_LIMITS,
  FLIGHT_SYSTEM_ORBIT_LIMITS,
} from '../../../domain/usecases/cameraOrbit.js';

const heading = toScene(DESTINATIONS.proxima.direction).normalize();

let mounted = null;

function mount() {
  mounted = mountFlightScene();
  return mounted.scene;
}

function viewDirection(camera) {
  return camera.getWorldDirection(new THREE.Vector3());
}

afterEach(() => {
  if (mounted) mounted.scene.dispose();
  mounted = null;
});

describe('chase, the mode it starts in', () => {
  it('orbits the ship at the dolly distance and looks back at it', () => {
    const scene = mount();
    expect(scene.camera.position.length()).toBeCloseTo(INITIAL_ORBIT.distance, 6);
    const towardsShip = scene.camera.position.clone().negate().normalize();
    expect(viewDirection(scene.camera).angleTo(towardsShip)).toBeCloseTo(0, 6);
  });

  it('shows the ship, which is the point of watching from outside', () => {
    const scene = mount();
    expect(scene.root.getObjectByName('ship-proxy').visible).toBe(true);
  });
});

describe('system, the mode that keeps the orbits round', () => {
  it('pulls back to the distance the whole system needs', () => {
    const scene = mount();
    scene.setCameraMode('system');
    expect(scene.camera.position.length()).toBeCloseTo(INITIAL_SYSTEM_DISTANCE, 6);
    expect(viewDirection(scene.camera).angleTo(scene.camera.position.clone().negate())).toBeCloseTo(
      0,
      6
    );
  });

  it('centres the compression on the sun before the halfway point', () => {
    const scene = mount();
    scene.setCameraMode('system');
    scene.setDistance(5);
    expect(scene.root.getObjectByName('sun').position.length()).toBeCloseTo(0, 9);
  });

  it('and on proxima after it, so the far system is the round one', () => {
    const scene = mount();
    scene.setCameraMode('system');
    scene.setDistance(268000);
    expect(scene.root.getObjectByName('proxima').position.length()).toBeCloseTo(0, 9);
  });

  it('draws the ship larger, it would be a speck at this range', () => {
    const scene = mount();
    const chase = scene.root.getObjectByName('ship-proxy').scale.x;
    scene.setCameraMode('system');
    expect(scene.root.getObjectByName('ship-proxy').scale.x).toBeGreaterThan(chase);
  });
});

describe('front, the view along the path', () => {
  it('sits at the ship and looks down the heading', () => {
    const scene = mount();
    scene.setCameraMode('front');
    expect(scene.camera.position.length()).toBeCloseTo(0, 9);
    expect(viewDirection(scene.camera).angleTo(heading)).toBeCloseTo(0, 6);
  });

  it('hides the ship, the eye is inside it', () => {
    const scene = mount();
    scene.setCameraMode('front');
    expect(scene.root.getObjectByName('ship-proxy').visible).toBe(false);
  });

  it('turns the heading about the vertical when dragged', () => {
    const scene = mount();
    scene.setCameraMode('front');
    scene.handleDrag(120, 0);
    const turned = viewDirection(scene.camera);
    expect(turned.angleTo(heading)).toBeGreaterThan(0.1);
    expect(turned.y).toBeCloseTo(heading.y, 6);
  });
});

describe('back, the view of what is left behind', () => {
  it('looks the other way from the same place', () => {
    const scene = mount();
    scene.setCameraMode('back');
    expect(scene.camera.position.length()).toBeCloseTo(0, 9);
    expect(viewDirection(scene.camera).angleTo(heading.clone().negate())).toBeCloseTo(0, 6);
  });

  it('hides the ship as well', () => {
    const scene = mount();
    scene.setCameraMode('back');
    expect(scene.root.getObjectByName('ship-proxy').visible).toBe(false);
  });
});

describe('drag and dolly', () => {
  it('keeps the dolly distance while dragging', () => {
    const scene = mount();
    scene.handleDrag(40, 25);
    expect(scene.camera.position.length()).toBeCloseTo(INITIAL_ORBIT.distance, 6);
  });

  it('never tips over the pole, the drag is clamped', () => {
    const scene = mount();
    scene.handleDrag(0, -100000);
    const up = scene.camera.position.clone().normalize().y;
    expect(Math.abs(up)).toBeLessThan(1);
    expect(Number.isFinite(scene.camera.position.x)).toBe(true);
  });

  it('holds the dolly inside the limits of the chase view', () => {
    const scene = mount();
    scene.handleZoom(0.001);
    expect(scene.camera.position.length()).toBeCloseTo(FLIGHT_ORBIT_LIMITS.minDistance, 6);
    scene.handleZoom(1e6);
    expect(scene.camera.position.length()).toBeCloseTo(FLIGHT_ORBIT_LIMITS.maxDistance, 6);
  });

  it('holds it inside the wider limits of the system view', () => {
    const scene = mount();
    scene.setCameraMode('system');
    scene.handleZoom(1e6);
    expect(scene.camera.position.length()).toBeCloseTo(FLIGHT_SYSTEM_ORBIT_LIMITS.maxDistance, 6);
    scene.handleZoom(1e-6);
    expect(scene.camera.position.length()).toBeCloseTo(FLIGHT_SYSTEM_ORBIT_LIMITS.minDistance, 6);
  });

  it('carries the angle across a mode change but keeps the two dollies apart', () => {
    const scene = mount();
    scene.handleZoom(2);
    const chase = scene.camera.position.length();
    scene.handleDrag(30, 0);
    const angle = scene.camera.position.clone().normalize();
    scene.setCameraMode('system');
    expect(scene.camera.position.length()).toBeCloseTo(INITIAL_SYSTEM_DISTANCE, 6);
    expect(scene.camera.position.clone().normalize().angleTo(angle)).toBeCloseTo(0, 6);
    scene.setCameraMode('chase');
    expect(scene.camera.position.length()).toBeCloseTo(chase, 6);
  });

  it('ignores a mode it does not know', () => {
    const scene = mount();
    scene.setCameraMode('nothing');
    expect(scene.root.getObjectByName('ship-proxy').visible).toBe(true);
    expect(scene.camera.position.length()).toBeCloseTo(INITIAL_ORBIT.distance, 6);
  });
});
