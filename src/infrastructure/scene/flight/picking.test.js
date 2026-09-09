import * as THREE from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mountFlightScene } from './testing.js';
import { isVisibleThrough } from './picking.js';

let mounted = null;

/**
 * The system view is the one that can be aimed by hand: the compression is
 * centred on the star, the camera looks at that centre, so the star is at the
 * middle of the screen and a tap there must land on it.
 */
function mountAimedAtTheSun() {
  mounted = mountFlightScene();
  const { scene, width, height } = mounted;
  scene.setCameraMode('system');
  scene.setDistance(1);
  return { scene, centre: [width / 2, height / 2], width, height };
}

function rawHits(scene, [x, y], width, height) {
  const raycaster = new THREE.Raycaster();
  raycaster.params.Points.threshold = 1;
  raycaster.setFromCamera(
    new THREE.Vector2((x / width) * 2 - 1, -(y / height) * 2 + 1),
    scene.camera
  );
  scene.root.updateMatrixWorld(true);
  return raycaster.intersectObjects(scene.root.getObjectByName('bodies').children, false);
}

afterEach(() => {
  if (mounted) mounted.scene.dispose();
  mounted = null;
});

describe('isVisibleThrough', () => {
  it('accepts an object whose whole chain up to the root is visible', () => {
    const root = new THREE.Group();
    const branch = new THREE.Group();
    const leaf = new THREE.Object3D();
    root.add(branch);
    branch.add(leaf);
    expect(isVisibleThrough(leaf, root)).toBe(true);
  });

  it('refuses an object hidden by itself', () => {
    const root = new THREE.Group();
    const leaf = new THREE.Object3D();
    root.add(leaf);
    leaf.visible = false;
    expect(isVisibleThrough(leaf, root)).toBe(false);
  });

  it('refuses an object hidden by a parent, which is what r128 misses', () => {
    const root = new THREE.Group();
    const branch = new THREE.Group();
    const leaf = new THREE.Object3D();
    root.add(branch);
    branch.add(leaf);
    branch.visible = false;
    expect(isVisibleThrough(leaf, root)).toBe(false);
  });

  it('refuses an object hidden by the root itself', () => {
    const root = new THREE.Group();
    const leaf = new THREE.Object3D();
    root.add(leaf);
    root.visible = false;
    expect(isVisibleThrough(leaf, root)).toBe(false);
  });
});

describe('handleTap', () => {
  it('selects the body under the finger', () => {
    const { scene, centre } = mountAimedAtTheSun();
    const onSelect = vi.fn();
    scene.handleTap(...centre, onSelect);
    expect(onSelect).toHaveBeenCalledWith({
      kind: 'body',
      id: 'sun',
      nameKey: 'flight.body.sun.name',
    });
  });

  it('does nothing at all when the tap hits empty sky', () => {
    const { scene } = mountAimedAtTheSun();
    const onSelect = vi.fn();
    scene.handleTap(2, 2, onSelect);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('walks the parents, a hidden group is not selectable', () => {
    const { scene, centre, width, height } = mountAimedAtTheSun();
    const onSelect = vi.fn();
    scene.root.getObjectByName('bodies').visible = false;
    // The raycaster still reports the hit, which is the r128 behaviour the
    // legacy filter on the object's own flag never caught.
    expect(rawHits(scene, centre, width, height).length).toBeGreaterThan(0);
    scene.handleTap(...centre, onSelect);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('respects the visibility of the body itself as well', () => {
    const { scene, centre } = mountAimedAtTheSun();
    const onSelect = vi.fn();
    scene.root.getObjectByName('sun').visible = false;
    scene.root.getObjectByName('sun-glow').visible = false;
    scene.handleTap(...centre, onSelect);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('picks a body up by its glow, which is all there is to hit at range', () => {
    const { scene, width, height } = mountAimedAtTheSun();
    const onSelect = vi.fn();
    const glow = scene.root.getObjectByName('neptune-glow');
    scene.root.getObjectByName('neptune').visible = false;
    scene.camera.updateMatrixWorld();
    const projected = glow.position.clone().project(scene.camera);
    scene.handleTap(
      (projected.x * 0.5 + 0.5) * width,
      (-projected.y * 0.5 + 0.5) * height,
      onSelect
    );
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ kind: 'body', id: 'neptune' }));
  });

  it('says nothing before the host has a size', () => {
    const onSelect = vi.fn();
    mounted = mountFlightScene({ width: 0, height: 0 });
    mounted.scene.setCameraMode('system');
    mounted.scene.setDistance(1);
    mounted.scene.handleTap(10, 10, onSelect);
    expect(onSelect).not.toHaveBeenCalled();
  });
});
