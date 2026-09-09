import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  MIN_PICK_OPACITY,
  createPicker,
  firstVisibleHit,
  isVisibleInTree,
  selectionOf,
} from './picking.js';

function makeMesh(name) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 1 })
  );
  mesh.name = name;
  return mesh;
}

describe('isVisibleInTree', () => {
  it('accepts a mesh whose whole chain is visible', () => {
    const root = new THREE.Group();
    const group = new THREE.Group();
    const mesh = makeMesh('mesh');
    root.add(group);
    group.add(mesh);
    expect(isVisibleInTree(mesh)).toBe(true);
  });

  it('rejects a mesh that is invisible itself', () => {
    const mesh = makeMesh('mesh');
    mesh.visible = false;
    expect(isVisibleInTree(mesh)).toBe(false);
  });

  it('rejects a visible mesh under an invisible group, the legacy bug', () => {
    const group = new THREE.Group();
    const mesh = makeMesh('mesh');
    group.add(mesh);
    group.visible = false;
    expect(mesh.visible).toBe(true);
    expect(isVisibleInTree(mesh)).toBe(false);
  });

  it('rejects a mesh under an invisible grandparent as well', () => {
    const root = new THREE.Group();
    const middle = new THREE.Group();
    const mesh = makeMesh('mesh');
    root.add(middle);
    middle.add(mesh);
    root.visible = false;
    expect(isVisibleInTree(mesh)).toBe(false);
  });
});

describe('firstVisibleHit', () => {
  function hit(object, distance) {
    return { object, distance };
  }

  it('takes the nearest hit when everything is visible', () => {
    const near = makeMesh('near');
    const far = makeMesh('far');
    expect(firstVisibleHit([hit(near, 1), hit(far, 2)]).object).toBe(near);
  });

  it('skips a hit hidden by its parent and takes what is behind it', () => {
    const hidden = makeMesh('hidden');
    const group = new THREE.Group();
    group.add(hidden);
    group.visible = false;
    const behind = makeMesh('behind');
    expect(firstVisibleHit([hit(hidden, 1), hit(behind, 2)]).object).toBe(behind);
  });

  it('skips a hit that has faded to nothing', () => {
    const ghost = makeMesh('ghost');
    ghost.material.opacity = MIN_PICK_OPACITY;
    const solid = makeMesh('solid');
    expect(firstVisibleHit([hit(ghost, 1), hit(solid, 2)]).object).toBe(solid);
  });

  it('returns nothing when every hit is hidden', () => {
    const group = new THREE.Group();
    const a = makeMesh('a');
    const b = makeMesh('b');
    group.add(a, b);
    group.visible = false;
    expect(firstVisibleHit([hit(a, 1), hit(b, 2)])).toBeUndefined();
  });

  it('returns nothing for no hits at all', () => {
    expect(firstVisibleHit([])).toBeUndefined();
  });
});

describe('selectionOf', () => {
  it('reads the three levels off the mesh', () => {
    const mesh = makeMesh('mesh');
    mesh.userData = { section: 'ringA', deck: 2, room: 'park' };
    expect(selectionOf(mesh)).toEqual({ section: 'ringA', deck: 2, room: 'park' });
  });

  it('fills the levels a plain section does not have with null', () => {
    const mesh = makeMesh('mesh');
    mesh.userData = { section: 'reactor' };
    expect(selectionOf(mesh)).toEqual({ section: 'reactor', deck: null, room: null });
  });
});

describe('createPicker', () => {
  function setup() {
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld(true);

    const group = new THREE.Group();
    const mesh = makeMesh('target');
    mesh.userData = { section: 'reactor' };
    mesh.scale.set(4, 4, 4);
    group.add(mesh);
    group.updateMatrixWorld(true);
    return { camera, group, mesh };
  }

  it('hits what is in the middle of the screen', () => {
    const { camera, mesh } = setup();
    const picker = createPicker();
    const selection = picker.pick({
      x: 100,
      y: 100,
      width: 200,
      height: 200,
      camera,
      targets: [mesh],
    });
    expect(selection).toEqual({ section: 'reactor', deck: null, room: null });
  });

  it('misses when the tap is off the object', () => {
    const { camera, mesh } = setup();
    const picker = createPicker();
    const selection = picker.pick({
      x: 2,
      y: 2,
      width: 200,
      height: 200,
      camera,
      targets: [mesh],
    });
    expect(selection).toBeNull();
  });

  it('does not pick through an invisible group, however visible the mesh is', () => {
    const { camera, group, mesh } = setup();
    group.visible = false;
    const picker = createPicker();
    const selection = picker.pick({
      x: 100,
      y: 100,
      width: 200,
      height: 200,
      camera,
      targets: [mesh],
    });
    expect(mesh.visible).toBe(true);
    expect(selection).toBeNull();
  });

  it('ignores a tap before the viewport has a size', () => {
    const { camera, mesh } = setup();
    const picker = createPicker();
    expect(picker.pick({ x: 1, y: 1, width: 0, height: 0, camera, targets: [mesh] })).toBeNull();
  });
});
