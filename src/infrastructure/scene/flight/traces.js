import * as THREE from 'three';
import { MISSION } from '../../../domain/constants/missionProfile.js';
import {
  ALPHA_CENTAURI_B_ORBIT,
  PLANETS,
  PROXIMA_HABITABLE_ZONE,
  PX_PLANETS,
} from '../../../domain/constants/starSystem.js';
import {
  addScaled,
  ellipticOrbitPoint,
  pathPositionAt,
} from '../../../domain/usecases/flightGeometry.js';
import { traceColor } from './palette.js';
import { writeScene } from './coordinates.js';
import {
  ALPHA_CENTAURI_B_PLANE,
  ALPHA_CENTAURI_POSITION,
  ECLIPTIC_PLANE,
  PROXIMA_PLANE,
  PROXIMA_POSITION,
  SUN_POSITION,
} from './layout.js';
import { createWarpedGeometry, warpInto } from './warped.js';

/**
 * The drawn lines: the eight planetary orbits, the two orbits of proxima with
 * the habitable zone between them, the ellipse of the pair, and the path
 * itself.
 *
 * The path is sampled logarithmically. Linear samples would put every one of
 * them in the last percent of the way and leave the departure as a single
 * segment, which is the half of the journey the viewer looks at first.
 */
const TWO_PI = Math.PI * 2;
const ORBIT_SEGMENTS = 150;
const ELLIPSE_SEGMENTS = 160;
const PATH_SEGMENTS = 260;

const PLANET_ORBIT_OPACITY = 0.7;
const PROXIMA_ORBIT_OPACITY = 0.85;
const HABITABLE_ZONE_OPACITY = 0.55;
const PAIR_ORBIT_OPACITY = 0.6;
const PATH_OPACITY = 0.45;

function circleSource(centre, plane, radius, segments = ORBIT_SEGMENTS) {
  const points = new Float32Array((segments + 1) * 3);
  for (let step = 0; step <= segments; step += 1) {
    const angle = (step / segments) * TWO_PI;
    writeScene(
      points,
      step,
      addScaled(
        addScaled(centre, plane.first, radius * Math.cos(angle)),
        plane.second,
        radius * Math.sin(angle)
      )
    );
  }
  return points;
}

function ellipseSource(orbit, plane, centre, segments = ELLIPSE_SEGMENTS) {
  const points = new Float32Array((segments + 1) * 3);
  for (let step = 0; step <= segments; step += 1) {
    writeScene(points, step, ellipticOrbitPoint(orbit, plane, centre, (step / segments) * TWO_PI));
  }
  return points;
}

function pathSource(segments = PATH_SEGMENTS) {
  const points = new Float32Array((segments + 1) * 3);
  const { startDistance, totalDistance } = MISSION;
  const growth = totalDistance / startDistance;
  for (let step = 0; step <= segments; step += 1) {
    writeScene(points, step, pathPositionAt(startDistance * Math.pow(growth, step / segments)));
  }
  return points;
}

export function createTraces(resources) {
  const group = new THREE.Group();
  group.name = 'traces';

  const sources = [
    ...PLANETS.map((planet) => ({
      name: `orbit-${planet.id}`,
      colorKey: 'planetOrbit',
      opacity: PLANET_ORBIT_OPACITY,
      points: circleSource(SUN_POSITION, ECLIPTIC_PLANE, planet.semiMajorAxis),
    })),
    ...PX_PLANETS.map((planet) => ({
      name: `orbit-${planet.id}`,
      colorKey: 'proximaOrbit',
      opacity: PROXIMA_ORBIT_OPACITY,
      points: circleSource(PROXIMA_POSITION, PROXIMA_PLANE, planet.semiMajorAxis),
    })),
    ...[PROXIMA_HABITABLE_ZONE.inner, PROXIMA_HABITABLE_ZONE.outer].map((radius, index) => ({
      name: index === 0 ? 'habitable-zone-inner' : 'habitable-zone-outer',
      colorKey: 'habitableZone',
      opacity: HABITABLE_ZONE_OPACITY,
      points: circleSource(PROXIMA_POSITION, PROXIMA_PLANE, radius),
    })),
    {
      name: 'orbit-alphaCentauriB',
      colorKey: 'alphaCentauriBOrbit',
      opacity: PAIR_ORBIT_OPACITY,
      points: ellipseSource(
        ALPHA_CENTAURI_B_ORBIT,
        ALPHA_CENTAURI_B_PLANE,
        ALPHA_CENTAURI_POSITION
      ),
    },
    {
      name: 'flight-path',
      colorKey: 'flightPath',
      opacity: PATH_OPACITY,
      points: pathSource(),
    },
  ];

  const traces = sources.map(({ name, colorKey, opacity, points }) => {
    const entry = createWarpedGeometry(resources, points);
    const line = new THREE.Line(
      entry.geometry,
      resources.material(
        new THREE.LineBasicMaterial({ color: traceColor(colorKey), transparent: true }),
        opacity
      )
    );
    line.name = name;
    group.add(line);
    return entry;
  });

  return { group, traces };
}

export function warpTraces(traces, centre, parameters) {
  for (const trace of traces) warpInto(trace, centre, parameters);
}
