import * as THREE from 'three';
import { proxyColor } from './palette.js';

/**
 * The ship as the journey needs it: a proxy, not the hull view. It is drawn
 * hugely out of scale, because at the true 790 m it would be a thousandth of
 * a pixel at every point of the path, and it is built from the sections it
 * has in the hull view, in their colours, bow to stern along its own z axis.
 *
 * Two details carry meaning rather than decoration. The rings turn against
 * each other, which is why the ship has no gyroscopic resistance to steering.
 * The plume burns only while the drive does, the magsail is out only while it
 * brakes, so the phase of the flight is readable from the model alone.
 */
const QUARTER_TURN = Math.PI / 2;
const FULL_TURN = Math.PI * 2;
const SPOKES_PER_RING = 6;
const CHARGE_COUNT = 6;
const SAIL_SPOKES = 6;

/** Radians per second. The rings counter rotate at the same rate. */
export const RING_SPIN_RATE = 0.96;
export const PLUME_PULSE_RATE = 11;
export const SAIL_PULSE_RATE = 3;
export const PLUME_OPACITY = { base: 0.28, swing: 0.16 };
export const SAIL_OPACITY = { base: 0.5, swing: 0.28 };

const HULL_METALNESS = 0.6;
const HULL_ROUGHNESS = 0.42;

export function createShipProxy(resources) {
  const group = new THREE.Group();
  group.name = 'ship-proxy';

  const shell = (colorKey, options = {}) =>
    resources.material(
      new THREE.MeshStandardMaterial({
        color: proxyColor(colorKey),
        metalness: HULL_METALNESS,
        roughness: HULL_ROUGHNESS,
        ...options,
      }),
      options.opacity ?? 1
    );

  const glowing = (colorKey, opacity, options = {}) =>
    resources.material(
      new THREE.MeshBasicMaterial({
        color: proxyColor(colorKey),
        transparent: true,
        depthWrite: false,
        ...options,
      }),
      opacity
    );

  /** A body of revolution, laid along the ship axis at the given station. */
  const section = (geometry, material, station, parent = group) => {
    const mesh = new THREE.Mesh(resources.geometry(geometry), material);
    mesh.position.z = station;
    mesh.rotation.x = QUARTER_TURN;
    parent.add(mesh);
    return mesh;
  };

  section(
    new THREE.CylinderGeometry(0.4, 0.52, 0.11, 28),
    shell('ice', { roughness: 0.85, metalness: 0.15 }),
    1.5
  );
  const whipple = shell('ice', { opacity: 0.55 });
  section(new THREE.CylinderGeometry(0.46, 0.46, 0.02, 28), whipple, 1.4);
  section(new THREE.CylinderGeometry(0.44, 0.44, 0.02, 28), whipple, 1.33);
  section(new THREE.CylinderGeometry(0.44, 0.44, 0.3, 28), shell('water'), 1.14);
  section(
    new THREE.CylinderGeometry(0.055, 0.055, 2.95, 14),
    shell('circulation', { metalness: 0.85 }),
    0.1
  );
  section(
    new THREE.CylinderGeometry(0.5, 0.5, 1.02, 32, 1, true),
    shell('hull', { opacity: 0.15, side: THREE.DoubleSide, metalness: 0.7 }),
    0.56
  );

  const ringGeometry = resources.geometry(new THREE.TorusGeometry(0.45, 0.075, 10, 44));
  const spokeGeometry = resources.geometry(new THREE.BoxGeometry(0.022, 0.4, 0.05));
  const spokeMaterial = shell('circulation', { metalness: 0.85 });
  const ring = (colorKey, station) => {
    const mesh = new THREE.Mesh(ringGeometry, shell(colorKey));
    mesh.position.z = station;
    for (let index = 0; index < SPOKES_PER_RING; index += 1) {
      const angle = (index / SPOKES_PER_RING) * FULL_TURN;
      const spoke = new THREE.Mesh(spokeGeometry, spokeMaterial);
      spoke.position.set(Math.cos(angle) * 0.25, Math.sin(angle) * 0.25, 0);
      spoke.rotation.z = angle - QUARTER_TURN;
      mesh.add(spoke);
    }
    group.add(mesh);
    return mesh;
  };
  const ringA = ring('quarters', 0.31);
  const ringB = ring('agriculture', 0.81);

  section(new THREE.CylinderGeometry(0.17, 0.17, 0.24, 20), shell('technical'), -0.1);
  section(new THREE.CylinderGeometry(0.19, 0.19, 0.24, 20), shell('lifeSupport'), -0.32);
  section(new THREE.CylinderGeometry(0.11, 0.11, 0.28, 18), shell('power'), -0.58);

  const radiatorGeometry = resources.geometry(new THREE.BoxGeometry(0.72, 0.012, 0.26));
  const radiatorMaterial = shell('thermal', { roughness: 0.8, side: THREE.DoubleSide });
  for (const side of [-1, 1]) {
    const panel = new THREE.Mesh(radiatorGeometry, radiatorMaterial);
    panel.position.set(side * 0.42, 0, -0.58);
    group.add(panel);
  }

  section(
    new THREE.CylinderGeometry(0.27, 0.27, 0.035, 28),
    shell('shielding', { roughness: 0.9, metalness: 0.2 }),
    -0.76
  );
  section(new THREE.CylinderGeometry(0.16, 0.16, 0.34, 20), shell('propellant'), -0.99);

  const chargeGeometry = resources.geometry(new THREE.CylinderGeometry(0.016, 0.016, 0.22, 8));
  const chargeMaterial = shell('propulsion');
  for (let index = 0; index < CHARGE_COUNT; index += 1) {
    const angle = (index / CHARGE_COUNT) * FULL_TURN;
    const charge = new THREE.Mesh(chargeGeometry, chargeMaterial);
    charge.position.set(Math.cos(angle) * 0.13, Math.sin(angle) * 0.13, -1.26);
    charge.rotation.x = QUARTER_TURN;
    group.add(charge);
  }
  section(new THREE.CylinderGeometry(0.44, 0.27, 0.05, 28), shell('propulsion'), -1.4);

  const plumeMaterial = glowing('exhaust', PLUME_OPACITY.base, {
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const plume = new THREE.Mesh(
    resources.geometry(new THREE.ConeGeometry(0.3, 1.5, 20, 1, true)),
    plumeMaterial
  );
  plume.name = 'plume';
  plume.rotation.x = -QUARTER_TURN;
  plume.position.z = -2.2;
  group.add(plume);

  const sailMaterial = glowing('magsail', SAIL_OPACITY.base, {
    blending: THREE.AdditiveBlending,
  });
  const sail = new THREE.Mesh(
    resources.geometry(new THREE.TorusGeometry(1.15, 0.014, 8, 96)),
    sailMaterial
  );
  sail.name = 'magsail';
  sail.position.z = -1.55;
  const sailSpokeGeometry = resources.geometry(new THREE.BoxGeometry(0.012, 1.1, 0.012));
  const sailSpokeMaterial = glowing('magsail', 0.45);
  for (let index = 0; index < SAIL_SPOKES; index += 1) {
    const angle = (index / SAIL_SPOKES) * FULL_TURN;
    const spoke = new THREE.Mesh(sailSpokeGeometry, sailSpokeMaterial);
    spoke.position.set(Math.cos(angle) * 0.58, Math.sin(angle) * 0.58, 0);
    spoke.rotation.z = angle - QUARTER_TURN;
    sail.add(spoke);
  }
  group.add(sail);

  return { group, ringA, ringB, plume, sail, plumeMaterial, sailMaterial };
}

/** One frame of the two counter rotating rings, in seconds. */
export function spinRings({ ringA, ringB }, seconds) {
  ringA.rotation.z += RING_SPIN_RATE * seconds;
  ringB.rotation.z -= RING_SPIN_RATE * seconds;
}
