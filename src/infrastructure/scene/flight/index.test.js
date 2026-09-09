import * as THREE from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { collectResources, mountFlightScene } from './testing.js';
import { toScene } from './coordinates.js';
import { PROXIMA_POSITION, SUN_POSITION } from './layout.js';
import { FAR_PLANE, FIELD_OF_VIEW, INITIAL_SYSTEM_DISTANCE, NEAR_PLANE } from './camera.js';
import { MISSION } from '../../../domain/constants/missionProfile.js';
import { DESTINATIONS, PLANETS, PX_PLANETS, STARS } from '../../../domain/constants/starSystem.js';
import { pathPositionAt } from '../../../domain/usecases/flightGeometry.js';

const BURNOUT = MISSION.accelerationDistance;
const BRAKING_START = MISSION.totalDistance - MISSION.brakingDistance;
const ARRIVAL = MISSION.totalDistance - MISSION.endDistance;

let mounted = null;

function mount(options) {
  mounted = mountFlightScene(options);
  return mounted;
}

afterEach(() => {
  if (mounted) mounted.scene.dispose();
  mounted = null;
});

describe('the tree the factory builds', () => {
  it('answers with the shape the stage calls', () => {
    const { scene } = mount();
    for (const member of [
      'setOpacity',
      'update',
      'handleDrag',
      'handleZoom',
      'handleTap',
      'resize',
      'dispose',
      'setDistance',
      'setCameraMode',
      'setBoostSizes',
      'setShowLabels',
      'labels',
    ]) {
      expect(scene[member]).toBeTypeOf('function');
    }
    expect(scene.root.isObject3D).toBe(true);
    expect(scene.camera.isPerspectiveCamera).toBe(true);
  });

  it('builds the camera the compression asks for, near 0.05 rather than 0.02', () => {
    const { scene } = mount();
    expect(scene.camera.fov).toBe(FIELD_OF_VIEW);
    expect(scene.camera.near).toBe(NEAR_PLANE);
    expect(scene.camera.far).toBe(FAR_PLANE);
    expect(NEAR_PLANE).toBeGreaterThan(0.02);
  });

  it('carries the four groups and the four lights', () => {
    const { scene } = mount();
    for (const name of ['fields', 'traces', 'bodies', 'ship-proxy']) {
      expect(scene.root.getObjectByName(name)).toBeDefined();
    }
    const lights = scene.root.children.filter((child) => child.isLight);
    expect(lights).toHaveLength(4);
  });

  it('draws every body of the star table and nothing else', () => {
    const { scene } = mount();
    const bodies = scene.root.getObjectByName('bodies');
    const meshes = bodies.children.filter((child) => child.isMesh);
    const expected = [...PLANETS, ...PX_PLANETS, ...Object.values(STARS)];
    expect(meshes).toHaveLength(expected.length);
    for (const body of expected) {
      expect(scene.root.getObjectByName(body.id)).toBeDefined();
      expect(scene.root.getObjectByName(`${body.id}-glow`)).toBeDefined();
    }
  });

  it('does not draw proxima c, which the same measurements disproved', () => {
    const { scene } = mount();
    expect(scene.root.getObjectByName('proximaC')).toBeUndefined();
    expect(scene.root.getObjectByName('orbit-proximaC')).toBeUndefined();
  });

  it('draws an orbit for every planet, the zone, the pair and the path', () => {
    const { scene } = mount();
    const traces = scene.root.getObjectByName('traces');
    expect(traces.children).toHaveLength(PLANETS.length + PX_PLANETS.length + 4);
    expect(scene.root.getObjectByName('flight-path')).toBeDefined();
    expect(scene.root.getObjectByName('habitable-zone-inner')).toBeDefined();
    expect(scene.root.getObjectByName('habitable-zone-outer')).toBeDefined();
    expect(scene.root.getObjectByName('orbit-alphaCentauriB')).toBeDefined();
  });

  it('draws the fixed stars and the four shells around them', () => {
    const { scene } = mount();
    const fields = scene.root.getObjectByName('fields');
    expect(fields.children.map((child) => child.name)).toEqual([
      'star-field',
      'kuiperBelt',
      'heliosphere',
      'innerOortCloud',
      'outerOortCloud',
      'alphaCentauriCloud',
    ]);
  });

  it('points the ship proxy down the path rather than along an axis', () => {
    const { scene } = mount();
    const proxy = scene.root.getObjectByName('ship-proxy');
    const bow = new THREE.Vector3(0, 0, 1).applyQuaternion(proxy.quaternion);
    const heading = toScene(DESTINATIONS.proxima.direction).normalize();
    expect(bow.x).toBeCloseTo(heading.x, 6);
    expect(bow.y).toBeCloseTo(heading.y, 6);
    expect(bow.z).toBeCloseTo(heading.z, 6);
  });
});

describe('setDistance', () => {
  it('holds the direction to every body exactly, only the length is compressed', () => {
    const { scene } = mount();
    for (const distance of [1, 500, MISSION.totalDistance / 2, ARRIVAL]) {
      scene.setDistance(distance);
      const ship = toScene(pathPositionAt(distance));
      for (const [id, truth] of [
        ['sun', toScene(SUN_POSITION)],
        ['proxima', toScene(PROXIMA_POSITION)],
      ]) {
        const drawn = scene.root.getObjectByName(id).position.clone().normalize();
        const real = truth.clone().sub(ship).normalize();
        expect(drawn.x).toBeCloseTo(real.x, 9);
        expect(drawn.y).toBeCloseTo(real.y, 9);
        expect(drawn.z).toBeCloseTo(real.z, 9);
      }
    }
  });

  it('keeps the whole journey inside the frustum, the cap is about 115 units', () => {
    const { scene } = mount();
    const bodies = scene.root.getObjectByName('bodies');
    for (const distance of [MISSION.startDistance, 30, 9487, 100000, BRAKING_START, ARRIVAL]) {
      scene.setDistance(distance);
      for (const child of bodies.children) {
        expect(child.position.length()).toBeLessThan(120);
      }
    }
  });

  it('turns the planets, the phase follows the mission time', () => {
    const { scene } = mount();
    scene.setDistance(MISSION.startDistance);
    const start = scene.root.getObjectByName('earth').position.clone();
    scene.setDistance(30);
    const later = scene.root.getObjectByName('earth').position.clone();
    expect(later.distanceTo(start)).toBeGreaterThan(0);
  });

  it('burns the plume only while the drive burns', () => {
    const { scene } = mount();
    const plume = scene.root.getObjectByName('plume');
    scene.setDistance(100);
    expect(plume.visible).toBe(true);
    scene.setDistance(BURNOUT + 1);
    expect(plume.visible).toBe(false);
  });

  it('unfurls the magsail only for the fifty years of braking', () => {
    const { scene } = mount();
    const sail = scene.root.getObjectByName('magsail');
    scene.setDistance(BURNOUT);
    expect(sail.visible).toBe(false);
    scene.setDistance(BRAKING_START + 1);
    expect(sail.visible).toBe(true);
  });

  it('brightens the star it is approaching and dims the one it left', () => {
    const { scene } = mount();
    const glow = scene.root.getObjectByName('proxima-glow');
    scene.setDistance(1);
    const far = glow.material.size;
    scene.setDistance(ARRIVAL);
    expect(glow.material.size).toBeGreaterThan(far);
  });

  it('ignores a distance that is not a number rather than poisoning the scene', () => {
    const { scene } = mount();
    scene.setDistance(30);
    const before = scene.root.getObjectByName('sun').position.clone();
    scene.setDistance(Number.NaN);
    expect(scene.root.getObjectByName('sun').position.x).toBeCloseTo(before.x, 12);
  });

  it('stays inside the journey however far it is pushed', () => {
    const { scene } = mount();
    scene.setDistance(-5);
    const before = scene.root.getObjectByName('sun').position.length();
    scene.setDistance(MISSION.totalDistance * 2);
    const after = scene.root.getObjectByName('sun').position.length();
    expect(Number.isFinite(before)).toBe(true);
    expect(Number.isFinite(after)).toBe(true);
  });
});

describe('the two legacy switches', () => {
  it('shrinks the bodies to their true angle when the boost is turned off', () => {
    const { scene } = mount();
    scene.setDistance(5);
    const boosted = scene.root.getObjectByName('jupiter').scale.x;
    scene.setBoostSizes(false);
    expect(scene.root.getObjectByName('jupiter').scale.x).toBeLessThan(boosted);
  });

  it('drops the labels when they are turned off and brings them back', () => {
    const { scene } = mount();
    scene.setCameraMode('system');
    scene.setDistance(1);
    expect(scene.update(16).length).toBeGreaterThan(0);
    scene.setShowLabels(false);
    expect(scene.update(16)).toHaveLength(0);
    expect(scene.labels()).toHaveLength(0);
    scene.setShowLabels(true);
    expect(scene.update(16).length).toBeGreaterThan(0);
  });
});

describe('labels', () => {
  it('reports positions in css pixels of the viewport it was resized to', () => {
    const { scene, width, height } = mount({ width: 1024, height: 768 });
    scene.setCameraMode('system');
    scene.setDistance(1);
    const labels = scene.update(16);
    expect(labels.length).toBeGreaterThan(0);
    for (const label of labels) {
      expect(label.nameKey).toBe(`flight.body.${label.id}.name`);
      expect(label.x).toBeGreaterThan(-width * 0.1);
      expect(label.x).toBeLessThan(width * 1.1);
      expect(label.y).toBeGreaterThan(-height * 0.1);
      expect(label.y).toBeLessThan(height * 1.1);
    }
  });

  it('keeps the last frame available without recomputing it', () => {
    const { scene } = mount();
    scene.setCameraMode('system');
    scene.setDistance(1);
    const drawn = scene.update(16);
    expect(scene.labels()).toEqual(drawn);
  });

  it('creates no dom element of its own, the view draws the names', () => {
    const before = document.body.childElementCount;
    const { scene } = mount();
    scene.setDistance(1);
    scene.update(16);
    expect(document.body.childElementCount).toBe(before);
  });

  it('says nothing while it is faded out', () => {
    const { scene } = mount();
    scene.setCameraMode('system');
    scene.setDistance(1);
    scene.setOpacity(0);
    expect(scene.update(16)).toHaveLength(0);
  });
});

describe('the crossfade the stage drives', () => {
  it('halves every material at half opacity', () => {
    const { scene } = mount();
    const { materials } = collectResources(scene.root);
    const before = [...materials].map((material) => material.opacity);
    scene.setOpacity(0.5);
    const after = [...materials].map((material) => material.opacity);
    after.forEach((value, index) => expect(value).toBeCloseTo(before[index] / 2, 9));
  });

  it('turns transparency on only where it is needed', () => {
    const { scene } = mount();
    const sun = scene.root.getObjectByName('sun');
    expect(sun.material.transparent).toBe(false);
    scene.setOpacity(0.4);
    expect(sun.material.transparent).toBe(true);
    expect(sun.material.opacity).toBeCloseTo(0.4, 9);
    scene.setOpacity(1);
    expect(sun.material.transparent).toBe(false);
  });

  it('fades the pulsing plume too, an animation cannot escape it', () => {
    const { scene } = mount();
    scene.setDistance(100);
    scene.setOpacity(0.25);
    scene.update(120);
    const plume = scene.root.getObjectByName('plume');
    expect(plume.material.opacity).toBeLessThanOrEqual(0.25);
    expect(plume.material.opacity).toBeGreaterThan(0);
  });
});

describe('update', () => {
  it('turns the two rings against each other, so the drawn ship has no gyroscope', () => {
    const { scene } = mount();
    const proxy = scene.root.getObjectByName('ship-proxy');
    const rings = proxy.children.filter((child) => child.geometry?.type === 'TorusGeometry');
    const first = rings.find((ring) => ring.children.length > 0);
    const second = rings.filter((ring) => ring !== first).find((ring) => ring.children.length > 0);
    scene.update(1000);
    expect(first.rotation.z).toBeGreaterThan(0);
    expect(second.rotation.z).toBeCloseTo(-first.rotation.z, 9);
  });

  it('ignores a negative frame rather than turning backwards', () => {
    const { scene } = mount();
    const proxy = scene.root.getObjectByName('ship-proxy');
    const ring = proxy.children.find((child) => child.geometry?.type === 'TorusGeometry');
    scene.update(-50);
    expect(ring.rotation.z).toBe(0);
  });
});

describe('resize', () => {
  it('takes the aspect from the host', () => {
    const { scene } = mount();
    scene.resize(1200, 400);
    expect(scene.camera.aspect).toBeCloseTo(3, 9);
  });

  it('ignores a zero sized host', () => {
    const { scene } = mount();
    const before = scene.camera.aspect;
    scene.resize(0, 0);
    expect(scene.camera.aspect).toBe(before);
  });
});

describe('dispose', () => {
  it('disposes every geometry and every material the tree holds', () => {
    const { scene, registry } = mount();
    const { geometries, materials } = collectResources(scene.root);
    expect(geometries.size).toBeGreaterThan(0);
    expect(materials.size).toBeGreaterThan(0);
    const spies = [...geometries, ...materials].map((resource) => {
      const spy = vi.fn();
      resource.dispose = spy;
      return spy;
    });
    scene.dispose();
    mounted = null;
    for (const spy of spies) expect(spy).toHaveBeenCalled();
    expect(registry.size()).toBe(0);
  });

  it('empties the tree, so nothing holds a buffer alive', () => {
    const { scene } = mount();
    scene.dispose();
    mounted = null;
    expect(scene.root.children).toHaveLength(0);
    expect(scene.update(16)).toHaveLength(0);
  });
});

describe('circling a body', () => {
  const bodyOf = (scene, id) => {
    let found = null;
    scene.root.traverse((object) => {
      if (object.name === id) found = object;
    });
    return found;
  };

  it('starts circling nothing', () => {
    const { scene } = mount();
    expect(scene.focusBody()).toBeNull();
  });

  it('accepts a body it draws and reports that it took it', () => {
    const { scene } = mount();
    expect(scene.setFocusBody('jupiter')).toBe(true);
    expect(scene.focusBody()).toBe('jupiter');
  });

  it('refuses an id it does not draw rather than staring into nothing', () => {
    const { scene } = mount();
    expect(scene.setFocusBody('deathstar')).toBe(false);
    expect(scene.focusBody()).toBeNull();
  });

  it('releases on null', () => {
    const { scene } = mount();
    scene.setFocusBody('mars');
    expect(scene.setFocusBody(null)).toBe(false);
    expect(scene.focusBody()).toBeNull();
  });

  it('puts the eye near the body rather than near the ship', () => {
    const { scene } = mount();
    scene.setDistance(30);
    const target = bodyOf(scene, 'jupiter');
    const beforeFocus = scene.camera.position.distanceTo(target.position);
    scene.setFocusBody('jupiter');
    const afterFocus = scene.camera.position.distanceTo(target.position);
    expect(afterFocus).toBeLessThan(beforeFocus);
  });

  it('looks at the body it circles', () => {
    const { scene } = mount();
    scene.setDistance(30);
    scene.setFocusBody('saturn');
    const target = bodyOf(scene, 'saturn');
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(scene.camera.quaternion);
    const toTarget = target.position.clone().sub(scene.camera.position).normalize();
    expect(forward.dot(toTarget)).toBeCloseTo(1, 4);
  });

  it('keeps the same distance in radii however far the warp has stretched space', () => {
    const { scene } = mount();
    const radii = (au) => {
      scene.setDistance(au);
      scene.setFocusBody('neptune');
      const target = bodyOf(scene, 'neptune');
      return scene.camera.position.distanceTo(target.position) / target.scale.x;
    };
    expect(radii(200)).toBeCloseTo(radii(4000), 3);
  });

  it('turns around the body when dragged, and keeps looking at it', () => {
    const { scene } = mount();
    scene.setDistance(30);
    scene.setFocusBody('mars');
    const target = bodyOf(scene, 'mars');
    const before = scene.camera.position.clone();
    scene.handleDrag(120, 40);
    expect(scene.camera.position.distanceTo(before)).toBeGreaterThan(0);
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(scene.camera.quaternion);
    const toTarget = target.position.clone().sub(scene.camera.position).normalize();
    expect(forward.dot(toTarget)).toBeCloseTo(1, 4);
  });

  it('zooms towards the body without ever entering it', () => {
    const { scene } = mount();
    scene.setDistance(30);
    scene.setFocusBody('venus');
    const target = bodyOf(scene, 'venus');
    for (let i = 0; i < 60; i += 1) scene.handleZoom(0.8);
    expect(scene.camera.position.distanceTo(target.position) / target.scale.x).toBeGreaterThan(1);
  });

  it('follows the body as it moves, instead of letting it drift away', () => {
    const { scene } = mount();
    scene.setDistance(30);
    scene.setFocusBody('mars');
    const target = bodyOf(scene, 'mars');
    for (const au of [40, 120, 900]) {
      scene.setDistance(au);
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(scene.camera.quaternion);
      const toTarget = target.position.clone().sub(scene.camera.position).normalize();
      expect(forward.dot(toTarget), `at ${au} AU`).toBeCloseTo(1, 4);
    }
  });

  it('hands the eye back to the ship in the two aimed modes', () => {
    const { scene } = mount();
    scene.setFocusBody('jupiter');
    scene.setCameraMode('front');
    expect(scene.camera.position.length()).toBe(0);
  });

  it('picks the focus back up when an orbiting mode returns', () => {
    const { scene } = mount();
    scene.setDistance(30);
    scene.setFocusBody('jupiter');
    scene.setCameraMode('front');
    scene.setCameraMode('chase');
    const target = bodyOf(scene, 'jupiter');
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(scene.camera.quaternion);
    const toTarget = target.position.clone().sub(scene.camera.position).normalize();
    expect(forward.dot(toTarget)).toBeCloseTo(1, 4);
  });
});

describe('emphasised against true sizes', () => {
  const scaleOf = (scene, id) => {
    let found = null;
    scene.root.traverse((object) => {
      if (object.name === id) found = object;
    });
    return found.scale.x;
  };

  it('changes the bodies in chase view', () => {
    const { scene } = mount();
    scene.setDistance(30);
    scene.setBoostSizes(false);
    const trueSize = scaleOf(scene, 'jupiter');
    scene.setBoostSizes(true);
    expect(scaleOf(scene, 'jupiter')).toBeGreaterThan(trueSize * 10);
  });

  it('changes the bodies in system view as well, where it used to do nothing', () => {
    // Measured on Mercury, not on Jupiter: the largest planet is the anchor
    // both settings share, so it is the one body that must not move.
    const { scene } = mount();
    scene.setDistance(30);
    scene.setCameraMode('system');
    scene.setBoostSizes(true);
    const emphasised = scaleOf(scene, 'mercury');
    scene.setBoostSizes(false);
    expect(scaleOf(scene, 'mercury')).not.toBeCloseTo(emphasised, 6);
  });

  it('shows the real radius ratio in system view when sizes are true', () => {
    const { scene } = mount();
    scene.setDistance(30);
    scene.setCameraMode('system');
    scene.setBoostSizes(false);
    const jupiter = PLANETS.find((planet) => planet.id === 'jupiter');
    const earth = PLANETS.find((planet) => planet.id === 'earth');
    expect(scaleOf(scene, 'jupiter') / scaleOf(scene, 'earth')).toBeCloseTo(
      jupiter.radiusKm / earth.radiusKm,
      3
    );
  });

  it('compresses that ratio when sizes are emphasised, or Mercury would vanish', () => {
    const { scene } = mount();
    scene.setDistance(30);
    scene.setCameraMode('system');
    scene.setBoostSizes(true);
    const spread = scaleOf(scene, 'jupiter') / scaleOf(scene, 'mercury');
    scene.setBoostSizes(false);
    expect(scaleOf(scene, 'jupiter') / scaleOf(scene, 'mercury')).toBeGreaterThan(spread * 5);
  });

  it('shrinks the earth along with everything below the largest planet', () => {
    // Earth used to be the yardstick, which is what made true sizes inflate
    // every world above it. The yardstick is the largest planet now.
    const { scene } = mount();
    scene.setDistance(30);
    scene.setCameraMode('system');
    scene.setBoostSizes(true);
    const emphasised = scaleOf(scene, 'earth');
    scene.setBoostSizes(false);
    expect(scaleOf(scene, 'earth')).toBeLessThan(emphasised);
  });
});

describe('tapping the ship', () => {
  const centreOf = (scene, width, height) => {
    scene.root.updateMatrixWorld(true);
    return { x: width / 2, y: height / 2 };
  };

  it('reports the ship, so the view can hand the eye back to it', () => {
    const { scene, width, height } = mount();
    scene.setDistance(30);
    scene.setFocusBody('jupiter');
    scene.setFocusBody(null);
    const picked = [];
    const { x, y } = centreOf(scene, width, height);
    scene.handleTap(x, y, (selection) => picked.push(selection));
    expect(picked.some((entry) => entry.kind === 'ship')).toBe(true);
  });

  it('does not report the ship in the two aimed modes, where the eye is inside it', () => {
    const { scene, width, height } = mount();
    scene.setDistance(30);
    scene.setCameraMode('front');
    const picked = [];
    const { x, y } = centreOf(scene, width, height);
    scene.handleTap(x, y, (selection) => picked.push(selection));
    expect(picked.some((entry) => entry.kind === 'ship')).toBe(false);
  });

  it('still reports bodies, the ship must not swallow every tap', () => {
    const { scene } = mount();
    scene.setDistance(30);
    scene.setCameraMode('system');
    let found = null;
    scene.root.traverse((object) => {
      if (object.name === 'jupiter') found = object;
    });
    scene.root.updateMatrixWorld(true);
    const projected = found.position.clone().project(scene.camera);
    const picked = [];
    scene.handleTap(
      (projected.x * 0.5 + 0.5) * 800,
      (-projected.y * 0.5 + 0.5) * 600,
      (selection) => picked.push(selection)
    );
    expect(picked.some((entry) => entry.kind === 'body' && entry.id === 'jupiter')).toBe(true);
  });
});

describe('saturn wears its rings', () => {
  const find = (scene, name) => {
    let found = null;
    scene.root.traverse((object) => {
      if (object.name === name) found = object;
    });
    return found;
  };

  it('hangs a ring on saturn and on nobody else', () => {
    const { scene } = mount();
    expect(find(scene, 'saturn-ring')).toBeTruthy();
    expect(find(scene, 'jupiter-ring')).toBeNull();
    expect(find(scene, 'earth-ring')).toBeNull();
  });

  it('carries the ring as a child, so it scales with the planet', () => {
    const { scene } = mount();
    expect(find(scene, 'saturn-ring').parent).toBe(find(scene, 'saturn'));
  });

  it('disposes the ring with everything else', () => {
    const { scene, registry } = mount();
    scene.dispose();
    expect(registry.size()).toBe(0);
  });
});

describe('true sizes must not let a star swallow the system view', () => {
  const scaleOf = (scene, id) => {
    let found = null;
    scene.root.traverse((object) => {
      if (object.name === id) found = object;
    });
    return found.scale.x;
  };

  it('keeps the sun well inside the view the camera looks at', () => {
    // The sun is 109 Earth radii. Drawn at that ratio in a view a hundred and
    // fifty units wide it is not a body any more, it is a wall the camera
    // stands inside. The toggle is about the planets.
    const { scene } = mount();
    scene.setDistance(30);
    scene.setCameraMode('system');
    scene.setBoostSizes(false);
    expect(scaleOf(scene, 'sun')).toBeLessThan(INITIAL_SYSTEM_DISTANCE / 8);
  });

  it('leaves the sun alone whichever way the toggle stands', () => {
    const { scene } = mount();
    scene.setDistance(30);
    scene.setCameraMode('system');
    scene.setBoostSizes(true);
    const emphasised = scaleOf(scene, 'sun');
    scene.setBoostSizes(false);
    expect(scaleOf(scene, 'sun')).toBeCloseTo(emphasised, 9);
  });

  it('still gives the planets their honest ratio', () => {
    const { scene } = mount();
    scene.setDistance(30);
    scene.setCameraMode('system');
    scene.setBoostSizes(false);
    const jupiter = PLANETS.find((planet) => planet.id === 'jupiter');
    const earth = PLANETS.find((planet) => planet.id === 'earth');
    expect(scaleOf(scene, 'jupiter') / scaleOf(scene, 'earth')).toBeCloseTo(
      jupiter.radiusKm / earth.radiusKm,
      3
    );
  });
});

describe('the ship stays findable while a planet is circled', () => {
  const find = (scene, name) => {
    let found = null;
    scene.root.traverse((object) => {
      if (object.name === name) found = object;
    });
    return found;
  };

  it('hides the mark while the ship itself is the subject', () => {
    const { scene } = mount();
    scene.setDistance(30);
    expect(find(scene, 'ship-marker').visible).toBe(false);
  });

  it('shows the mark as soon as the eye moves to a planet', () => {
    const { scene } = mount();
    scene.setDistance(30);
    scene.setFocusBody('jupiter');
    expect(find(scene, 'ship-marker').visible).toBe(true);
  });

  it('hides it again on the way back', () => {
    const { scene } = mount();
    scene.setDistance(30);
    scene.setFocusBody('jupiter');
    scene.setFocusBody(null);
    expect(find(scene, 'ship-marker').visible).toBe(false);
  });

  it('counts the mark as the ship, so tapping it comes back', () => {
    const { scene } = mount();
    scene.setDistance(30);
    scene.setFocusBody('jupiter');
    expect(find(scene, 'ship-marker')).toBeTruthy();
  });

  it('leaves the ship off screen up close, which is what the dock button is for', () => {
    // Circling a planet at a few radii puts the ship behind the camera. The
    // mark is drawn and it is a pick target, but it can only be tapped once
    // the ship is back in frame, so the way home cannot depend on it alone.
    const { scene } = mount();
    scene.setDistance(30);
    scene.setFocusBody('jupiter');
    scene.root.updateMatrixWorld(true);
    const world = find(scene, 'ship-marker').getWorldPosition(new THREE.Vector3());
    const projected = world.clone().project(scene.camera);
    const onScreen = Math.abs(projected.x) <= 1 && Math.abs(projected.y) <= 1 && projected.z < 1;
    expect(onScreen).toBe(false);
  });
});

describe('true sizes shrink the system rather than inflating it', () => {
  const scaleOf = (scene, id) => {
    let found = null;
    scene.root.traverse((object) => {
      if (object.name === id) found = object;
    });
    return found.scale.x;
  };

  const systemScene = () => {
    const { scene } = mount();
    scene.setDistance(30);
    scene.setCameraMode('system');
    return scene;
  };

  const planetIds = PLANETS.map((planet) => planet.id);

  it('keeps the largest planet the same size in both settings', () => {
    // The toggle changes how far apart the sizes are, not how big the whole
    // system is drawn. Anchoring on Earth instead made Jupiter five times
    // larger on the way to true sizes, which reads as the opposite of true.
    const scene = systemScene();
    scene.setBoostSizes(true);
    const emphasised = scaleOf(scene, 'jupiter');
    scene.setBoostSizes(false);
    expect(scaleOf(scene, 'jupiter')).toBeCloseTo(emphasised, 6);
  });

  it('makes every other planet smaller, never larger', () => {
    const scene = systemScene();
    scene.setBoostSizes(true);
    const emphasised = Object.fromEntries(planetIds.map((id) => [id, scaleOf(scene, id)]));
    scene.setBoostSizes(false);
    for (const id of planetIds) {
      expect(scaleOf(scene, id), id).toBeLessThanOrEqual(emphasised[id] + 1e-9);
    }
  });

  it('shrinks the small worlds a great deal, which is the honest picture', () => {
    const scene = systemScene();
    scene.setBoostSizes(true);
    const emphasised = scaleOf(scene, 'mercury');
    scene.setBoostSizes(false);
    expect(scaleOf(scene, 'mercury')).toBeLessThan(emphasised / 5);
  });

  it('still holds the true radius ratio between the planets', () => {
    const scene = systemScene();
    scene.setBoostSizes(false);
    const jupiter = PLANETS.find((planet) => planet.id === 'jupiter');
    const mercury = PLANETS.find((planet) => planet.id === 'mercury');
    expect(scaleOf(scene, 'jupiter') / scaleOf(scene, 'mercury')).toBeCloseTo(
      jupiter.radiusKm / mercury.radiusKm,
      3
    );
  });

  it('leaves the sun where it was, it is not part of the comparison', () => {
    const scene = systemScene();
    scene.setBoostSizes(true);
    const emphasised = scaleOf(scene, 'sun');
    scene.setBoostSizes(false);
    expect(scaleOf(scene, 'sun')).toBeCloseTo(emphasised, 9);
  });
});
