import * as THREE from 'three';
import { AU_KM } from '../../../domain/constants/astronomy.js';
import {
  ALPHA_CENTAURI_B_ORBIT,
  PLANETS,
  PX_PLANETS,
  STARS,
} from '../../../domain/constants/starSystem.js';
import {
  circularOrbitPosition,
  ellipticOrbitPosition,
} from '../../../domain/usecases/flightGeometry.js';
import { bodyColor, emissiveColor } from './palette.js';
import { toScene } from './coordinates.js';
import {
  ALPHA_CENTAURI_B_PLANE,
  ALPHA_CENTAURI_POSITION,
  EARTH_RADIUS_KM,
  ECLIPTIC_PLANE,
  PROXIMA_PLANE,
  PROXIMA_POSITION,
  SUN_POSITION,
} from './layout.js';

/**
 * The fourteen bodies the journey passes or aims at: the sun, the eight
 * planets, proxima with its two confirmed planets, and the pair. Each one is
 * a sphere plus a single point of glow, because at almost every distance on
 * this path the sphere is far below one pixel and the glow is all there is
 * to see.
 *
 * The sphere geometry and the one point of the glow are shared by every body
 * and every glow. Only the materials differ, since the glow carries its size
 * and its brightness in the material.
 */
const SPHERE_SEGMENTS = 28;
const SPHERE_RINGS = 18;
const SURFACE_ROUGHNESS = 0.8;
const SURFACE_METALNESS = 0.05;
const GLOW_SIZE = 4;
const GLOW_OPACITY = 0.9;

function sphereGeometry(resources) {
  return resources.geometry(new THREE.SphereGeometry(1, SPHERE_SEGMENTS, SPHERE_RINGS));
}

function pointGeometry(resources) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3), 3));
  geometry.computeBoundingSphere();
  return resources.geometry(geometry);
}

/**
 * A body carries where it is in true ecliptic units, how big it really is,
 * and how to move it. Everything the warp does to it is undone next frame
 * from these, so the compression never accumulates.
 */
function createBody({ definition, resources, geometries, orbit = null }) {
  const emissive = emissiveColor(definition.colorKey);
  // A material that is left alone emits nothing, which is what a planet does.
  const surface = new THREE.MeshStandardMaterial({
    color: bodyColor(definition.colorKey),
    roughness: SURFACE_ROUGHNESS,
    metalness: SURFACE_METALNESS,
  });
  if (emissive !== null) surface.emissive.setHex(emissive);
  const mesh = new THREE.Mesh(geometries.sphere, resources.material(surface, 1));
  const glow = new THREE.Points(
    geometries.point,
    resources.material(
      new THREE.PointsMaterial({
        color: bodyColor(definition.colorKey),
        size: GLOW_SIZE,
        sizeAttenuation: false,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
      GLOW_OPACITY
    )
  );
  mesh.name = definition.id;
  glow.name = `${definition.id}-glow`;
  return {
    id: definition.id,
    nameKey: definition.nameKey,
    radiusAu: definition.radiusKm / AU_KM,
    /** Cube root of the volume ratio, the exaggeration of the system view. */
    cubeRadius: Math.cbrt(definition.radiusKm / EARTH_RADIUS_KM),
    absoluteMagnitude: definition.absoluteMagnitude ?? null,
    position: new THREE.Vector3(),
    orbit,
    mesh,
    glow,
  };
}

export function createBodies(resources) {
  const geometries = { sphere: sphereGeometry(resources), point: pointGeometry(resources) };
  const group = new THREE.Group();
  group.name = 'bodies';

  const definitions = [
    { definition: STARS.sun, at: () => SUN_POSITION },
    ...PLANETS.map((planet) => ({
      definition: planet,
      orbit: (time) => circularOrbitPosition(planet, ECLIPTIC_PLANE, SUN_POSITION, time),
    })),
    { definition: STARS.proxima, at: () => PROXIMA_POSITION },
    ...PX_PLANETS.map((planet) => ({
      definition: planet,
      orbit: (time) => circularOrbitPosition(planet, PROXIMA_PLANE, PROXIMA_POSITION, time),
    })),
    { definition: STARS.alphaCentauriA, at: () => ALPHA_CENTAURI_POSITION },
    {
      definition: STARS.alphaCentauriB,
      orbit: (time) =>
        ellipticOrbitPosition(
          ALPHA_CENTAURI_B_ORBIT,
          ALPHA_CENTAURI_B_PLANE,
          ALPHA_CENTAURI_POSITION,
          time
        ),
    },
  ];

  const bodies = definitions.map(({ definition, orbit, at }) => {
    const body = createBody({ definition, resources, geometries, orbit: orbit ?? null });
    toScene(orbit ? orbit(0) : at(), body.position);
    group.add(body.mesh, body.glow);
    return body;
  });

  return { group, bodies };
}

/** Where every moving body stands, `time` in years since the cast off. */
export function moveBodies(bodies, time) {
  for (const body of bodies) {
    if (body.orbit) toScene(body.orbit(time), body.position);
  }
}
