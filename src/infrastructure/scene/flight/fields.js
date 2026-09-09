import * as THREE from 'three';
import { fieldColor } from './palette.js';
import { toScene } from './coordinates.js';
import { ALPHA_CENTAURI_POSITION, SUN_POSITION } from './layout.js';
import { createWarpedGeometry, warpInto } from './warped.js';

/**
 * The four shells and the belt: the Kuiper belt as a flat ring in the
 * ecliptic, the heliopause as a thin shell at 120 AU, the Oort cloud as two
 * shells that reach to the edge of the gravitational hold of the sun, and one
 * more shell around the pair, so the far end of the journey is not empty
 * space with two dots in it.
 *
 * Every shell is drawn from a distribution, not from data. They stand for a
 * density, which is why the seed of the drawing is injected: a test wants the
 * same cloud twice.
 */
const TWO_PI = Math.PI * 2;

const KUIPER = { count: 520, inner: 30, outer: 50, thickness: 3.5, size: 1.7, opacity: 0.6 };
const HELIOSPHERE = { count: 420, inner: 117, outer: 124, size: 1.6, opacity: 0.55 };
const INNER_OORT = { count: 700, inner: 2000, outer: 20000, size: 1.5, opacity: 0.45 };
const OUTER_OORT = { count: 880, inner: 20000, outer: 100000, size: 1.3, opacity: 0.34 };
const ALPHA_CLOUD = { count: 520, inner: 2000, outer: 90000, size: 1.3, opacity: 0.34 };

/** The fixed stars: a backdrop, far outside anything the warp touches. */
const STAR_FIELD = { count: 3200, inner: 2600, outer: 3400, size: 1.5, opacity: 0.6 };

/**
 * A shell of points, logarithmic in radius so the inner edge is as well
 * populated as the outer one, and uniform on the sphere.
 */
function shell({ count, inner, outer }, centre, random) {
  const points = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    const radius = inner * Math.pow(outer / inner, random());
    const azimuth = random() * TWO_PI;
    const polar = Math.acos(2 * random() - 1);
    points[index * 3] = centre.x + radius * Math.sin(polar) * Math.cos(azimuth);
    points[index * 3 + 1] = centre.y + radius * Math.cos(polar);
    points[index * 3 + 2] = centre.z + radius * Math.sin(polar) * Math.sin(azimuth);
  }
  return points;
}

/** A flat ring in the ecliptic, with a little thickness across it. */
function eclipticBelt({ count, inner, outer, thickness }, random) {
  const points = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    const radius = inner + random() * (outer - inner);
    const angle = random() * TWO_PI;
    points[index * 3] = radius * Math.cos(angle);
    points[index * 3 + 1] = (random() - 0.5) * thickness;
    points[index * 3 + 2] = -radius * Math.sin(angle);
  }
  return points;
}

function pointsMaterial(resources, colorKey, { size, opacity }) {
  return resources.material(
    new THREE.PointsMaterial({
      color: fieldColor(colorKey),
      size,
      sizeAttenuation: false,
      transparent: true,
      depthWrite: false,
    }),
    opacity
  );
}

export function createFields(resources, random) {
  const group = new THREE.Group();
  group.name = 'fields';

  const backdrop = new THREE.Points(
    resources.geometry(
      new THREE.BufferGeometry().setAttribute(
        'position',
        new THREE.BufferAttribute(shell(STAR_FIELD, new THREE.Vector3(), random), 3)
      )
    ),
    pointsMaterial(resources, 'starField', STAR_FIELD)
  );
  backdrop.name = 'star-field';
  group.add(backdrop);

  const sun = toScene(SUN_POSITION);
  const pair = toScene(ALPHA_CENTAURI_POSITION);
  const sources = [
    { colorKey: 'kuiperBelt', spec: KUIPER, points: eclipticBelt(KUIPER, random) },
    { colorKey: 'heliosphere', spec: HELIOSPHERE, points: shell(HELIOSPHERE, sun, random) },
    { colorKey: 'innerOortCloud', spec: INNER_OORT, points: shell(INNER_OORT, sun, random) },
    { colorKey: 'outerOortCloud', spec: OUTER_OORT, points: shell(OUTER_OORT, sun, random) },
    { colorKey: 'alphaCentauriCloud', spec: ALPHA_CLOUD, points: shell(ALPHA_CLOUD, pair, random) },
  ];

  const fields = sources.map(({ colorKey, spec, points }) => {
    const entry = createWarpedGeometry(resources, points);
    const object = new THREE.Points(entry.geometry, pointsMaterial(resources, colorKey, spec));
    object.name = colorKey;
    group.add(object);
    return entry;
  });

  return { group, fields };
}

export function warpFields(fields, centre, parameters) {
  for (const field of fields) warpInto(field, centre, parameters);
}
