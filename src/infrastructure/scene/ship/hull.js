import * as THREE from 'three';
import { HULL } from '../../../domain/constants/shipDesign.js';
import { sectionColor } from '../palette.js';
import { ALONG_Z } from './builder.js';
import { centerZ, figureValue, lengthZ, sectionById } from './figures.js';
import { shade } from './resources.js';

/**
 * The chain of hull sections from bow to stern, everything except the two
 * habitat rings.
 *
 * Every position along the flight axis comes from the z extent the section
 * table carries, and the radii come from the figures wherever the table has
 * one: the shadow shield is 124 m across because that is its figure, the
 * pusher plate is 210 m across because that is its figure, the bow shield is
 * 130 m in radius because its frontal area is 53,100 m². What is left in this
 * file are proportions of the drawing that no figure fixes, and those are
 * named.
 */
const TURN = Math.PI * 2;

const BOW = { tipRadius: 112, coneLength: 14, layerGap: 7, layerStep: 3, layerThickness: 1.2 };
const TANKS = { radius: 120, pipeRadius: 15, pipeCircle: 100, pipeCount: 8, pipeOverhang: 2 };
const MANTLE = { opacity: 0.13, ribCount: 7, ribTube: 1.6, ribInset: 5 };
const AXIS = { collarCount: 12, collarClearance: 1.5, collarTube: 1.3, collarInset: 10 };
const CRYO = { radius: 23, podSize: 9, podLength: 30, podCircle: 29, podPhase: 0.5 };
const WORKSHOP = { radius: 42, hoopClearance: 0.5, hoopTube: 1.6 };
const LIFE = { radius: 46, pipeRadius: 7, pipeCircle: 40, pipeCount: 6, pipeInset: 2 };
const REACTOR = { radius: 26, capRadius: 30, capThickness: 8 };
const RADIATOR = { panelCount: 4, panelLength: 150, panelThickness: 1.6, panelCircle: 102 };
const MAGAZINE = { radius: 36, railSize: 10, railCount: 4, railCircle: 30, railInset: 4 };
const DRIVE = {
  plateThickness: 12,
  throatRadius: 40,
  throatLength: 20,
  nozzleRadius: 5,
  nozzleLength: 48,
  nozzleCircle: 34,
  nozzleCount: 8,
};
const MAGSAIL = { tube: 2.2, strutCount: 6, strutSize: 2.4, strutCircle: 95 };

const SMOOTH = 64;
const ROUND = 32;
const COARSE = 16;

export function buildHull({ add, resources }) {
  const geometry = (instance) => resources.geometry(instance);
  const material = (color, options) => resources.material(color, options);

  buildBowShield(add, geometry, material);
  buildSupplyTanks(add, geometry, material);
  buildHabitatMantle(add, geometry, material);
  buildCentralAxis(add, geometry, material);
  buildCryobank(add, geometry, material);
  buildWorkshop(add, geometry, material);
  buildLifeSupport(add, geometry, material);
  buildReactor(add, geometry, material);
  buildRadiators(add, geometry, material);
  buildShadowShield(add, geometry, material);
  buildPropellantMagazine(add, geometry, material);
  buildPropulsion(add, geometry, material);
  buildMagsail(add, geometry, material);
}

function ringOf(count, index, phase = 0) {
  const angle = (index / count) * TURN + phase;
  return { angle, cos: Math.cos(angle), sin: Math.sin(angle) };
}

function buildBowShield(add, geometry, material) {
  const section = sectionById('bowShield');
  const base = Math.sqrt(figureValue(section, 'frontalArea', 0) / Math.PI);
  const face = material(sectionColor(section.colorKey), { metalness: 0.2, roughness: 0.85 });

  add(
    section.id,
    geometry(new THREE.CylinderGeometry(BOW.tipRadius, base, BOW.coneLength, SMOOTH)),
    face,
    { z: section.z.to - BOW.coneLength / 2, rx: ALONG_Z }
  );

  // The Whipple stack behind the ice: each layer catches what the one in
  // front of it broke up, so they thin out towards the back.
  const layers = figureValue(section, 'whippleLayers', 0);
  const layerFace = material(sectionColor(section.colorKey), {
    metalness: 0.6,
    roughness: 0.4,
    opacity: 0.42,
  });
  const first = section.z.to - BOW.coneLength - BOW.layerGap * 0.5;
  for (let i = 0; i < layers; i += 1) {
    const radius = BOW.tipRadius + BOW.layerStep * (layers - 1 - i);
    add(
      section.id,
      geometry(new THREE.CylinderGeometry(radius, radius, BOW.layerThickness, SMOOTH)),
      layerFace,
      { z: first - i * BOW.layerGap, rx: ALONG_Z }
    );
  }
}

function buildSupplyTanks(add, geometry, material) {
  const section = sectionById('supplyTanks');
  const length = lengthZ(section);
  const face = material(sectionColor(section.colorKey), { metalness: 0.5, roughness: 0.5 });
  const pipeFace = material(shade(sectionColor(section.colorKey), 0.8), {
    metalness: 0.6,
    roughness: 0.45,
  });

  add(
    section.id,
    geometry(new THREE.CylinderGeometry(TANKS.radius, TANKS.radius, length, 48)),
    face,
    { z: centerZ(section), rx: ALONG_Z }
  );

  const pipe = geometry(
    new THREE.CylinderGeometry(
      TANKS.pipeRadius,
      TANKS.pipeRadius,
      length + TANKS.pipeOverhang,
      COARSE
    )
  );
  for (let i = 0; i < TANKS.pipeCount; i += 1) {
    const { cos, sin } = ringOf(TANKS.pipeCount, i);
    add(section.id, pipe, pipeFace, {
      x: cos * TANKS.pipeCircle,
      y: sin * TANKS.pipeCircle,
      z: centerZ(section),
      rx: ALONG_Z,
    });
  }
}

function buildHabitatMantle(add, geometry, material) {
  const section = sectionById('habitatMantle');
  const radius = HULL.diameter / 2;
  const length = lengthZ(section);

  add(
    section.id,
    geometry(new THREE.CylinderGeometry(radius, radius, length, SMOOTH, 1, true)),
    material(sectionColor(section.colorKey), {
      metalness: 0.7,
      roughness: 0.45,
      opacity: MANTLE.opacity,
      side: THREE.DoubleSide,
    }),
    { z: centerZ(section), rx: ALONG_Z }
  );

  const rib = geometry(new THREE.TorusGeometry(radius, MANTLE.ribTube, 8, SMOOTH));
  const ribFace = material(shade(sectionColor(section.colorKey), 1.45), {
    metalness: 0.8,
    roughness: 0.35,
  });
  const span = length - 2 * MANTLE.ribInset;
  for (let i = 0; i < MANTLE.ribCount; i += 1) {
    const z = section.z.from + MANTLE.ribInset + (span * i) / (MANTLE.ribCount - 1);
    add(section.id, rib, ribFace, { z });
  }
}

function buildCentralAxis(add, geometry, material) {
  const section = sectionById('centralAxis');
  const radius = figureValue(section, 'diameter', 0) / 2;
  const length = lengthZ(section);
  const face = material(sectionColor(section.colorKey), { metalness: 0.8, roughness: 0.35 });

  add(section.id, geometry(new THREE.CylinderGeometry(radius, radius, length, 28)), face, {
    z: centerZ(section),
    rx: ALONG_Z,
  });

  const collar = geometry(
    new THREE.TorusGeometry(radius + AXIS.collarClearance, AXIS.collarTube, 8, 24)
  );
  const collarFace = material(shade(sectionColor(section.colorKey), 0.75), {
    metalness: 0.9,
    roughness: 0.3,
  });
  const span = length - 2 * AXIS.collarInset;
  for (let i = 0; i < AXIS.collarCount; i += 1) {
    const z = section.z.from + AXIS.collarInset + (span * i) / (AXIS.collarCount - 1);
    add(section.id, collar, collarFace, { z });
  }
}

function buildCryobank(add, geometry, material) {
  const section = sectionById('cryobank');
  const length = lengthZ(section);
  const z = centerZ(section);

  add(
    section.id,
    geometry(new THREE.CylinderGeometry(CRYO.radius, CRYO.radius, length, ROUND)),
    material(sectionColor(section.colorKey), { metalness: 0.55, roughness: 0.45 }),
    { z, rx: ALONG_Z }
  );

  // Three depots, so no single failure can take the whole gene bank.
  const depots = figureValue(section, 'depots', 0);
  const pod = geometry(new THREE.BoxGeometry(CRYO.podSize, CRYO.podSize, CRYO.podLength));
  const podFace = material(shade(sectionColor(section.colorKey), 0.77), {
    metalness: 0.7,
    roughness: 0.4,
  });
  for (let i = 0; i < depots; i += 1) {
    const { cos, sin } = ringOf(depots, i, CRYO.podPhase);
    add(section.id, pod, podFace, { x: cos * CRYO.podCircle, y: sin * CRYO.podCircle, z });
  }
}

function buildWorkshop(add, geometry, material) {
  const section = sectionById('workshop');
  const z = centerZ(section);

  add(
    section.id,
    geometry(new THREE.CylinderGeometry(WORKSHOP.radius, WORKSHOP.radius, lengthZ(section), 40)),
    material(sectionColor(section.colorKey), { metalness: 0.6, roughness: 0.5 }),
    { z, rx: ALONG_Z }
  );

  add(
    section.id,
    geometry(
      new THREE.TorusGeometry(WORKSHOP.radius + WORKSHOP.hoopClearance, WORKSHOP.hoopTube, 8, 44)
    ),
    material(shade(sectionColor(section.colorKey), 0.79), { metalness: 0.9, roughness: 0.3 }),
    { z }
  );
}

function buildLifeSupport(add, geometry, material) {
  const section = sectionById('lifeSupport');
  const length = lengthZ(section);
  const z = centerZ(section);

  add(
    section.id,
    geometry(new THREE.CylinderGeometry(LIFE.radius, LIFE.radius, length, 40)),
    material(sectionColor(section.colorKey), { metalness: 0.55, roughness: 0.5 }),
    { z, rx: ALONG_Z }
  );

  const pipe = geometry(
    new THREE.CylinderGeometry(
      LIFE.pipeRadius,
      LIFE.pipeRadius,
      length - LIFE.pipeInset,
      COARSE - 2
    )
  );
  const pipeFace = material(shade(sectionColor(section.colorKey), 0.78), {
    metalness: 0.7,
    roughness: 0.4,
  });
  for (let i = 0; i < LIFE.pipeCount; i += 1) {
    const { cos, sin } = ringOf(LIFE.pipeCount, i);
    add(section.id, pipe, pipeFace, {
      x: cos * LIFE.pipeCircle,
      y: sin * LIFE.pipeCircle,
      z,
      rx: ALONG_Z,
    });
  }
}

function buildReactor(add, geometry, material) {
  const section = sectionById('reactor');

  add(
    section.id,
    geometry(new THREE.CylinderGeometry(REACTOR.radius, REACTOR.radius, lengthZ(section), ROUND)),
    material(sectionColor(section.colorKey), { metalness: 0.65, roughness: 0.4 }),
    { z: centerZ(section), rx: ALONG_Z }
  );

  const cap = geometry(
    new THREE.CylinderGeometry(REACTOR.capRadius, REACTOR.capRadius, REACTOR.capThickness, ROUND)
  );
  const capFace = material(shade(sectionColor(section.colorKey), 0.75), {
    metalness: 0.85,
    roughness: 0.3,
  });
  const inset = REACTOR.capThickness / 2 + 1;
  for (const z of [section.z.from + inset, section.z.to - inset]) {
    add(section.id, cap, capFace, { z, rx: ALONG_Z });
  }
}

function buildRadiators(add, geometry, material) {
  const section = sectionById('radiators');
  // Four panels, radiating from both faces: the eight segments of the figure.
  const panel = geometry(
    new THREE.BoxGeometry(RADIATOR.panelLength, RADIATOR.panelThickness, lengthZ(section))
  );
  const face = material(sectionColor(section.colorKey), {
    metalness: 0.4,
    roughness: 0.75,
    side: THREE.DoubleSide,
  });

  for (let i = 0; i < RADIATOR.panelCount; i += 1) {
    const { angle, cos, sin } = ringOf(RADIATOR.panelCount, i, Math.PI / RADIATOR.panelCount);
    add(section.id, panel, face, {
      x: cos * RADIATOR.panelCircle,
      y: sin * RADIATOR.panelCircle,
      z: centerZ(section),
      rz: angle,
    });
  }
}

function buildShadowShield(add, geometry, material) {
  const section = sectionById('shadowShield');
  const radius = figureValue(section, 'diameter', 0) / 2;
  const thickness = figureValue(section, 'thickness', 0);

  add(
    section.id,
    geometry(new THREE.CylinderGeometry(radius, radius, thickness, 48)),
    material(sectionColor(section.colorKey), { metalness: 0.3, roughness: 0.85 }),
    { z: section.z.from, rx: ALONG_Z }
  );
}

function buildPropellantMagazine(add, geometry, material) {
  const section = sectionById('propellantMagazine');
  const length = lengthZ(section);
  const z = centerZ(section);

  add(
    section.id,
    geometry(new THREE.CylinderGeometry(MAGAZINE.radius, MAGAZINE.radius, length, ROUND)),
    material(sectionColor(section.colorKey), { metalness: 0.7, roughness: 0.4 }),
    { z, rx: ALONG_Z }
  );

  const rail = geometry(
    new THREE.BoxGeometry(MAGAZINE.railSize, MAGAZINE.railSize, length - MAGAZINE.railInset)
  );
  const railFace = material(shade(sectionColor(section.colorKey), 0.79), {
    metalness: 0.85,
    roughness: 0.3,
  });
  for (let i = 0; i < MAGAZINE.railCount; i += 1) {
    const { cos, sin } = ringOf(MAGAZINE.railCount, i);
    add(section.id, rail, railFace, {
      x: cos * MAGAZINE.railCircle,
      y: sin * MAGAZINE.railCircle,
      z,
    });
  }
}

function buildPropulsion(add, geometry, material) {
  const section = sectionById('propulsion');
  const plateRadius = figureValue(section, 'pusherPlateDiameter', 0) / 2;
  const plateZ = section.z.from + DRIVE.plateThickness / 2;
  const throatZ = section.z.to - DRIVE.throatLength / 2;
  const face = material(sectionColor(section.colorKey), { metalness: 0.75, roughness: 0.35 });
  const inner = material(shade(sectionColor(section.colorKey), 0.78), {
    metalness: 0.85,
    roughness: 0.3,
  });

  // The plate takes the pulse, the shock absorbers behind it carry it into
  // the ship, and the throat is where the charges leave.
  add(
    section.id,
    geometry(
      new THREE.CylinderGeometry(plateRadius, DRIVE.throatRadius + 20, DRIVE.plateThickness, 48)
    ),
    face,
    { z: plateZ, rx: ALONG_Z }
  );

  const nozzle = geometry(
    new THREE.CylinderGeometry(DRIVE.nozzleRadius, DRIVE.nozzleRadius, DRIVE.nozzleLength, 12)
  );
  for (let i = 0; i < DRIVE.nozzleCount; i += 1) {
    const { cos, sin } = ringOf(DRIVE.nozzleCount, i);
    add(section.id, nozzle, inner, {
      x: cos * DRIVE.nozzleCircle,
      y: sin * DRIVE.nozzleCircle,
      z: (plateZ + throatZ) / 2,
      rx: ALONG_Z,
    });
  }

  add(
    section.id,
    geometry(
      new THREE.CylinderGeometry(DRIVE.throatRadius, DRIVE.throatRadius, DRIVE.throatLength, ROUND)
    ),
    inner,
    { z: throatZ, rx: ALONG_Z }
  );
}

function buildMagsail(add, geometry, material) {
  const section = sectionById('magsail');
  const radius = figureValue(section, 'diameter', 0) / 2;
  const z = section.z.from;

  add(
    section.id,
    geometry(new THREE.TorusGeometry(radius, MAGSAIL.tube, 10, 96)),
    material(sectionColor(section.colorKey), { metalness: 0.9, roughness: 0.2 }),
    { z }
  );

  const strut = geometry(
    new THREE.BoxGeometry(MAGSAIL.strutSize, (radius - MAGSAIL.strutCircle) * 2, MAGSAIL.strutSize)
  );
  const strutFace = material(shade(sectionColor(section.colorKey), 0.79), {
    metalness: 0.85,
    roughness: 0.3,
  });
  for (let i = 0; i < MAGSAIL.strutCount; i += 1) {
    const { angle, cos, sin } = ringOf(MAGSAIL.strutCount, i);
    add(section.id, strut, strutFace, {
      x: cos * MAGSAIL.strutCircle,
      y: sin * MAGSAIL.strutCircle,
      z,
      rz: angle - Math.PI / 2,
    });
  }
}
