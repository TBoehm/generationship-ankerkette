import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { DECK_LAYOUT, allRooms } from '../../../domain/constants/deckLayout.js';
import { DECK_RADII, SPIN_RATE } from '../../../domain/constants/shipDesign.js';
import { SHIP_SECTIONS } from '../../../domain/constants/shipSections.js';
import { SHIP_ORBIT_LIMITS } from '../../../domain/usecases/cameraOrbit.js';
import { SHIP_FRAMING } from '../../../domain/usecases/shipFraming.js';
import { createDisposalRegistry } from '../disposal.js';
import { DIM_FACTOR } from './highlight.js';
import { createShipScene } from './index.js';

const VIEWPORT = { width: 800, height: 600 };
const TWO_PI = Math.PI * 2;

function setup(options = {}) {
  const registry = createDisposalRegistry();
  const scene = createShipScene({ registry, ...options });
  scene.resize(VIEWPORT.width, VIEWPORT.height);
  return { scene, registry };
}

/** Every mesh below the ship group, whatever it is nested in. */
function meshesOf(scene) {
  const meshes = [];
  scene.root.traverse((object) => {
    if (object.isMesh) meshes.push(object);
  });
  return meshes;
}

function settle(scene, seconds = 20) {
  for (let i = 0; i < seconds * 60; i += 1) scene.update(1000 / 60);
}

function distanceToTarget(scene, targetZ) {
  return scene.camera.position.distanceTo(new THREE.Vector3(0, 0, targetZ));
}

describe('the object tree', () => {
  let ctx;
  beforeEach(() => {
    ctx = setup();
  });

  it('is one root the stage can render, with the ship under it', () => {
    expect(ctx.scene.root).toBeInstanceOf(THREE.Object3D);
    expect(ctx.scene.root.getObjectByName('ship')).toBeInstanceOf(THREE.Group);
  });

  it('paints no background, the journey is drawn underneath it', () => {
    expect(ctx.scene.root.background).toBeNull();
  });

  it('has one group per section of the hull chain, named by its id', () => {
    const ship = ctx.scene.root.getObjectByName('ship');
    expect(ship.children).toHaveLength(SHIP_SECTIONS.length);
    for (const section of SHIP_SECTIONS) {
      expect(ship.getObjectByName(section.id), section.id).toBeInstanceOf(THREE.Group);
    }
  });

  it('gives every section at least one mesh, so none of the fifteen is missing', () => {
    const ship = ctx.scene.root.getObjectByName('ship');
    for (const section of SHIP_SECTIONS) {
      expect(ship.getObjectByName(section.id).children.length, section.id).toBeGreaterThan(0);
    }
  });

  it('lights the scene and gives it a starfield', () => {
    const lights = ctx.scene.root.children.filter((child) => child.isLight);
    expect(lights.length).toBeGreaterThanOrEqual(5);
    expect(ctx.scene.root.getObjectByName('starfield')).toBeInstanceOf(THREE.Points);
  });

  it('places every section mesh inside the extent the section table gives it', () => {
    const ship = ctx.scene.root.getObjectByName('ship');
    ship.updateMatrixWorld(true);
    const slack = 30;
    for (const section of SHIP_SECTIONS) {
      const box = new THREE.Box3().setFromObject(ship.getObjectByName(section.id));
      expect(box.min.z, section.id).toBeGreaterThanOrEqual(section.z.from - slack);
      expect(box.max.z, section.id).toBeLessThanOrEqual(section.z.to + slack);
    }
  });
});

describe('the habitat rings', () => {
  let ctx;
  beforeEach(() => {
    ctx = setup();
  });

  it('draws the rooms of every deck in three of the four sectors', () => {
    const rooms = meshesOf(ctx.scene).filter((mesh) => mesh.userData.room !== null);
    expect(rooms).toHaveLength(allRooms().length * 3);
  });

  it('shares one material per room across the sectors it repeats in', () => {
    const rooms = meshesOf(ctx.scene).filter((mesh) => mesh.userData.room !== null);
    const materials = new Set(rooms.map((mesh) => mesh.material));
    expect(materials.size).toBe(allRooms().length);
  });

  it('tags every deck of both rings, from the outer wall inwards', () => {
    for (const ring of DECK_LAYOUT) {
      const group = ctx.scene.root.getObjectByName(ring.id);
      const decks = new Set(
        group.children.map((mesh) => mesh.userData.deck).filter((deck) => deck !== null)
      );
      expect([...decks].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
    }
  });

  it('keeps every room block inside the ring it belongs to', () => {
    const ship = ctx.scene.root.getObjectByName('ship');
    ship.updateMatrixWorld(true);
    const rooms = meshesOf(ctx.scene).filter((mesh) => mesh.userData.room !== null);
    for (const mesh of rooms) {
      const radius = Math.hypot(mesh.position.x, mesh.position.y);
      expect(radius).toBeLessThan(DECK_RADII[0]);
      expect(radius).toBeGreaterThan(DECK_RADII.at(-1) - DECK_RADII[0]);
    }
  });

  it('leaves a quarter of the ring open, so the decks can be seen', () => {
    const ringA = ctx.scene.root.getObjectByName('ringA');
    const wall = ringA.children.find((mesh) => mesh.geometry?.type === 'CylinderGeometry');
    expect(wall.geometry.parameters.thetaLength).toBeCloseTo(Math.PI * 1.5, 12);
  });
});

describe('update', () => {
  it('turns the two rings in opposite senses, so the momenta cancel', () => {
    const { scene } = setup();
    const ringA = scene.root.getObjectByName('ringA');
    const ringB = scene.root.getObjectByName('ringB');
    scene.update(1000);
    expect(ringA.rotation.z).toBeCloseTo(SPIN_RATE, 9);
    expect(ringB.rotation.z).toBeCloseTo(TWO_PI - SPIN_RATE, 9);
    expect(Math.sin(ringA.rotation.z) + Math.sin(ringB.rotation.z)).toBeCloseTo(0, 9);
  });

  it('turns at the design spin rate, driven by the delta and not by a clock', () => {
    const { scene } = setup();
    const ringA = scene.root.getObjectByName('ringA');
    for (let i = 0; i < 10; i += 1) scene.update(100);
    expect(ringA.rotation.z).toBeCloseTo(SPIN_RATE, 9);
  });

  it('holds the rings still while a deck is open, so its rooms can be read', () => {
    const { scene } = setup();
    scene.setSelection({ section: 'ringA', deck: 2, room: null });
    const ringA = scene.root.getObjectByName('ringA');
    scene.update(1000);
    expect(ringA.rotation.z).toBe(0);
  });

  it('holds the rings still when the viewer asked for reduced motion', () => {
    const { scene } = setup({ reducedMotion: true });
    scene.update(1000);
    expect(scene.root.getObjectByName('ringA').rotation.z).toBe(0);
  });

  it('never lets the ring angle grow without bound', () => {
    const { scene } = setup();
    const ringA = scene.root.getObjectByName('ringA');
    for (let i = 0; i < 600; i += 1) scene.update(1000);
    expect(ringA.rotation.z).toBeGreaterThanOrEqual(0);
    expect(ringA.rotation.z).toBeLessThan(TWO_PI);
  });
});

describe('the camera', () => {
  it('is a perspective camera in metres, near enough for the hull and far enough for the sky', () => {
    const { scene } = setup();
    expect(scene.camera).toBeInstanceOf(THREE.PerspectiveCamera);
    expect(scene.camera.fov).toBe(42);
    expect(scene.camera.near).toBe(1);
    expect(scene.camera.far).toBe(9000);
  });

  it('starts framing the whole ship', () => {
    const { scene } = setup();
    expect(distanceToTarget(scene, SHIP_FRAMING.overviewTargetZ)).toBeCloseTo(
      SHIP_FRAMING.overviewDistance,
      6
    );
  });

  it('always looks at the point it orbits', () => {
    const { scene } = setup();
    scene.handleDrag(120, -40);
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(scene.camera.quaternion);
    const toTarget = new THREE.Vector3(0, 0, SHIP_FRAMING.overviewTargetZ)
      .sub(scene.camera.position)
      .normalize();
    expect(forward.dot(toTarget)).toBeCloseTo(1, 6);
  });

  it('flies to a plain section, target and distance both', () => {
    const { scene } = setup();
    scene.setSelection({ section: 'reactor', deck: null, room: null });
    settle(scene);
    expect(distanceToTarget(scene, -120)).toBeCloseTo(SHIP_FRAMING.sectionDistance, 3);
  });

  it('flies closer to a deck than to the whole ring', () => {
    const { scene } = setup();
    scene.setSelection({ section: 'ringB', deck: null, room: null });
    settle(scene);
    const ring = distanceToTarget(scene, 270);
    scene.setSelection({ section: 'ringB', deck: 3, room: null });
    settle(scene);
    const deck = distanceToTarget(scene, 270);
    expect(ring).toBeCloseTo(SHIP_FRAMING.ringDistance, 3);
    expect(deck).toBeCloseTo(SHIP_FRAMING.deckDistance, 3);
  });

  it('returns to the overview when the selection is cleared', () => {
    const { scene } = setup();
    scene.setSelection({ section: 'magsail', deck: null, room: null });
    settle(scene);
    scene.setSelection(null);
    settle(scene);
    expect(distanceToTarget(scene, SHIP_FRAMING.overviewTargetZ)).toBeCloseTo(
      SHIP_FRAMING.overviewDistance,
      3
    );
  });

  it('eases towards the goal rather than cutting to it', () => {
    const { scene } = setup();
    scene.setSelection({ section: 'reactor', deck: null, room: null });
    scene.update(1000 / 60);
    const distance = distanceToTarget(scene, -120);
    expect(distance).toBeGreaterThan(SHIP_FRAMING.sectionDistance);
    expect(distance).toBeLessThan(SHIP_FRAMING.overviewDistance + Math.abs(-120 - 60));
  });

  it('turns with a drag, in the sense the orbit defines', () => {
    const { scene } = setup();
    const before = scene.camera.position.clone();
    scene.handleDrag(100, 0);
    expect(scene.camera.position.distanceTo(before)).toBeGreaterThan(1);
  });

  it('keeps the dolly inside the limits however hard it is pinched', () => {
    const { scene } = setup();
    for (let i = 0; i < 50; i += 1) scene.handleZoom(0.5);
    settle(scene);
    expect(distanceToTarget(scene, SHIP_FRAMING.overviewTargetZ)).toBeCloseTo(
      SHIP_ORBIT_LIMITS.minDistance,
      3
    );
    for (let i = 0; i < 50; i += 1) scene.handleZoom(2);
    settle(scene);
    expect(distanceToTarget(scene, SHIP_FRAMING.overviewTargetZ)).toBeCloseTo(
      SHIP_ORBIT_LIMITS.maxDistance,
      3
    );
  });

  it('ignores a zoom factor that is not a factor', () => {
    const { scene } = setup();
    settle(scene, 1);
    const before = scene.camera.position.clone();
    scene.handleZoom(0);
    scene.handleZoom(Number.NaN);
    settle(scene, 1);
    expect(scene.camera.position.distanceTo(before)).toBeLessThan(1);
  });

  it('takes the aspect from the viewport and ignores a collapsed one', () => {
    const { scene } = setup();
    expect(scene.camera.aspect).toBeCloseTo(VIEWPORT.width / VIEWPORT.height, 12);
    scene.resize(0, 0);
    expect(scene.camera.aspect).toBeCloseTo(VIEWPORT.width / VIEWPORT.height, 12);
  });
});

describe('picking', () => {
  /** A tap only reaches what is on screen, so the ship has to be faded in. */
  function visible(options) {
    const ctx = setup(options);
    ctx.scene.setOpacity(1);
    return ctx;
  }

  it('selects what a tap in the middle of the screen lands on', () => {
    const { scene } = visible();
    const onSelect = vi.fn();
    scene.handleTap(VIEWPORT.width / 2, VIEWPORT.height / 2, onSelect);
    expect(onSelect).toHaveBeenCalledTimes(1);
    const selection = onSelect.mock.calls[0][0];
    expect(SHIP_SECTIONS.map((section) => section.id)).toContain(selection.section);
  });

  it('never returns a part hidden by its own group, which the legacy filter did', () => {
    const { scene } = visible();
    const first = vi.fn();
    scene.handleTap(VIEWPORT.width / 2, VIEWPORT.height / 2, first);
    const hidden = first.mock.calls[0][0].section;

    const group = scene.root.getObjectByName(hidden);
    group.visible = false;
    expect(group.children.every((mesh) => mesh.visible)).toBe(true);

    const second = vi.fn();
    scene.handleTap(VIEWPORT.width / 2, VIEWPORT.height / 2, second);
    for (const call of second.mock.calls) expect(call[0].section).not.toBe(hidden);
  });

  it('does nothing at all when the tap hits empty space', () => {
    const { scene } = visible();
    scene.setSelection({ section: 'reactor', deck: null, room: null });
    const onSelect = vi.fn();
    scene.handleTap(1, 1, onSelect);
    expect(onSelect).not.toHaveBeenCalled();
    expect(scene.selection().section).toBe('reactor');
  });

  it('adopts what it picked, so the scene and the sheet agree', () => {
    const { scene } = visible();
    const onSelect = vi.fn();
    scene.handleTap(VIEWPORT.width / 2, VIEWPORT.height / 2, onSelect);
    expect(scene.selection()).toEqual(onSelect.mock.calls[0][0]);
  });

  it('cannot pick the hull skin once it has been taken off', () => {
    const { scene } = visible();
    scene.setHullOpen(true);
    const onSelect = vi.fn();
    for (let x = 0.2; x < 0.9; x += 0.05) {
      for (let y = 0.2; y < 0.9; y += 0.05) {
        scene.handleTap(VIEWPORT.width * x, VIEWPORT.height * y, onSelect);
      }
    }
    expect(onSelect).toHaveBeenCalled();
    for (const call of onSelect.mock.calls) {
      expect(['habitatMantle', 'supplyTanks']).not.toContain(call[0].section);
    }
  });

  it('selects nothing while the ship is faded out, it is not on screen', () => {
    const { scene } = setup();
    const onSelect = vi.fn();
    scene.handleTap(VIEWPORT.width / 2, VIEWPORT.height / 2, onSelect);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('hands out a copy, so the caller cannot reach into the scene', () => {
    const { scene } = setup();
    scene.setSelection({ section: 'reactor', deck: null, room: null });
    const taken = scene.selection();
    taken.section = 'magsail';
    expect(scene.selection().section).toBe('reactor');
  });
});

describe('the selection', () => {
  it('keeps the chosen section lit and pushes everything else back', () => {
    const { scene } = setup();
    scene.setSelection({ section: 'reactor', deck: null, room: null });
    const meshes = meshesOf(scene);
    const reactor = meshes.find((mesh) => mesh.userData.section === 'reactor');
    const other = meshes.find((mesh) => mesh.userData.section === 'magsail');
    expect(reactor.material.color.getHex()).toBe(reactor.material.userData.baseColor.getHex());
    expect(other.material.color.r).toBeCloseTo(other.material.userData.baseColor.r * DIM_FACTOR, 5);
  });

  it('narrows to one deck of a ring and dims the other four', () => {
    const { scene } = setup();
    scene.setSelection({ section: 'ringA', deck: 2, room: null });
    const rooms = meshesOf(scene).filter((mesh) => mesh.userData.section === 'ringA');
    const onDeck = rooms.find((mesh) => mesh.userData.deck === 2 && mesh.userData.room !== null);
    const elsewhere = rooms.find((mesh) => mesh.userData.deck === 4 && mesh.userData.room !== null);
    expect(onDeck.material.color.getHex()).toBe(onDeck.material.userData.baseColor.getHex());
    expect(elsewhere.material.color.r).toBeLessThan(elsewhere.material.userData.baseColor.r);
  });

  it('makes the chosen room glow, and only that one', () => {
    const { scene } = setup();
    scene.setSelection({ section: 'ringA', deck: 1, room: 'communalKitchen' });
    const rooms = meshesOf(scene).filter((mesh) => mesh.userData.room !== null);
    const chosen = rooms.filter((mesh) => mesh.userData.room === 'communalKitchen');
    expect(chosen.length).toBe(3);
    for (const mesh of chosen) expect(mesh.material.emissive.getHex()).toBeGreaterThan(0);
    const others = rooms.filter((mesh) => mesh.userData.room !== 'communalKitchen');
    for (const mesh of others) expect(mesh.material.emissive.getHex()).toBe(0);
  });

  it('is reversible, clearing it puts every colour back', () => {
    const { scene } = setup();
    const before = meshesOf(scene).map((mesh) => mesh.material.color.getHex());
    scene.setSelection({ section: 'ringB', deck: 3, room: null });
    scene.setSelection(null);
    expect(meshesOf(scene).map((mesh) => mesh.material.color.getHex())).toEqual(before);
  });

  it('survives a selection that names only a section', () => {
    const { scene } = setup();
    scene.setSelection({ section: 'workshop' });
    expect(scene.selection()).toEqual({ section: 'workshop', deck: null, room: null });
  });
});

describe('the crossfade', () => {
  it('starts fully faded out, the journey has the screen', () => {
    const { scene } = setup();
    for (const mesh of meshesOf(scene)) expect(mesh.material.opacity).toBe(0);
  });

  it('fades every material up together', () => {
    const { scene } = setup();
    scene.setOpacity(1);
    const mantle = scene.root.getObjectByName('habitatMantle').children[0];
    const reactor = scene.root.getObjectByName('reactor').children[0];
    expect(reactor.material.opacity).toBe(1);
    expect(mantle.material.opacity).toBeCloseTo(mantle.material.userData.baseOpacity, 12);
  });

  it('halves every material at half opacity, base opacity included', () => {
    const { scene } = setup();
    scene.setOpacity(0.5);
    const mantle = scene.root.getObjectByName('habitatMantle').children[0];
    expect(mantle.material.opacity).toBeCloseTo(mantle.material.userData.baseOpacity * 0.5, 12);
  });

  it('keeps the fade and the selection apart, neither undoes the other', () => {
    const { scene } = setup();
    scene.setOpacity(1);
    scene.setSelection({ section: 'reactor', deck: null, room: null });
    const magsail = scene.root.getObjectByName('magsail').children[0];
    expect(magsail.material.opacity).toBeLessThan(1);
    scene.setOpacity(0.5);
    expect(magsail.material.opacity).toBeLessThan(0.5);
    scene.setSelection(null);
    expect(magsail.material.opacity).toBeCloseTo(0.5, 12);
  });

  it('is transparent throughout, so the fade actually shows', () => {
    const { scene } = setup();
    for (const mesh of meshesOf(scene)) expect(mesh.material.transparent).toBe(true);
  });
});

describe('the cutaway', () => {
  it('starts closed, the ship is whole', () => {
    const { scene } = setup();
    expect(scene.root.getObjectByName('habitatMantle').visible).toBe(true);
    expect(scene.root.getObjectByName('supplyTanks').visible).toBe(true);
  });

  it('takes the outer skin off and puts it back', () => {
    const { scene } = setup();
    scene.setHullOpen(true);
    expect(scene.root.getObjectByName('habitatMantle').visible).toBe(false);
    expect(scene.root.getObjectByName('supplyTanks').visible).toBe(false);
    scene.setHullOpen(false);
    expect(scene.root.getObjectByName('habitatMantle').visible).toBe(true);
  });

  it('leaves the rings alone, they are what the cutaway is for', () => {
    const { scene } = setup();
    scene.setHullOpen(true);
    expect(scene.root.getObjectByName('ringA').visible).toBe(true);
    expect(scene.root.getObjectByName('ringB').visible).toBe(true);
  });
});

describe('the deck sheet', () => {
  it('has nothing to show while no deck is selected', () => {
    const { scene } = setup();
    expect(scene.deckPlan()).toBeNull();
    scene.setSelection({ section: 'ringA', deck: null, room: null });
    expect(scene.deckPlan()).toBeNull();
  });

  it('rolls the selected deck out into two rows and a corridor', () => {
    const { scene } = setup();
    scene.setSelection({ section: 'ringA', deck: 1, room: null });
    const plan = scene.deckPlan();
    expect(plan.ring).toBe('ringA');
    expect(plan.deck).toBe(1);
    expect(plan.rows).toHaveLength(2);
    expect(plan.corridor.width).toBeGreaterThan(0);
  });

  it('has nothing to show for a section that carries no decks', () => {
    const { scene } = setup();
    scene.setSelection({ section: 'reactor', deck: 1, room: null });
    expect(scene.deckPlan()).toBeNull();
  });
});

describe('dispose', () => {
  it('registers exactly one disposer per geometry and per material, no more', () => {
    const { scene, registry } = setup();
    const resources = new Set();
    scene.root.traverse((object) => {
      if (object.geometry) resources.add(object.geometry);
      if (object.material) resources.add(object.material);
    });
    expect(resources.size).toBeGreaterThan(100);
    expect(registry.size()).toBe(resources.size);
  });

  it('disposes every geometry and material it built', () => {
    const { scene } = setup();
    const spies = [];
    scene.root.traverse((object) => {
      if (object.geometry) spies.push(vi.spyOn(object.geometry, 'dispose'));
      if (object.material) spies.push(vi.spyOn(object.material, 'dispose'));
    });
    scene.dispose();
    for (const spy of spies) expect(spy).toHaveBeenCalled();
  });

  it('leaves the registry empty', () => {
    const { scene, registry } = setup();
    expect(registry.size()).toBeGreaterThan(0);
    scene.dispose();
    expect(registry.size()).toBe(0);
  });

  it('empties the object tree, so nothing holds the scene alive', () => {
    const { scene } = setup();
    scene.dispose();
    expect(scene.root.children).toHaveLength(0);
  });

  it('is safe to call twice', () => {
    const { scene, registry } = setup();
    scene.dispose();
    scene.dispose();
    expect(registry.size()).toBe(0);
  });

  it('builds a second scene without touching the first registry', () => {
    const first = setup();
    const second = setup();
    first.scene.dispose();
    expect(first.registry.size()).toBe(0);
    expect(second.registry.size()).toBeGreaterThan(0);
  });
});
