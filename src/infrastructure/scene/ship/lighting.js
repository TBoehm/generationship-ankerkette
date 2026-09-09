import * as THREE from 'three';
import { sectionColor } from '../palette.js';
import { centerZ, sectionById } from './figures.js';
import { tint } from './resources.js';

/**
 * Six lights, and every colour among them is a palette colour lifted towards
 * white rather than a value of its own.
 *
 * The two point lights over the rings are the reason: each ring is lit in its
 * own colour, warm over the living ring and green over the agricultural one,
 * so the two read apart at a distance where no detail is left. Taking that
 * colour from the ring's own palette entry means the light follows the ring
 * if the ring is ever recoloured. The rim light behind the drive does the
 * same for the stern.
 */
const AMBIENT_INTENSITY = 0.8;
const KEY_INTENSITY = 1;
const FILL_INTENSITY = 0.5;
const GLOW_INTENSITY = 1.1;
const GLOW_RANGE = 420;
const RIM_INTENSITY = 1.5;
const RIM_RANGE = 900;

/** The star the ship has not left yet: white, and the only colour not tinted. */
const SUNLIGHT = new THREE.Color(1, 1, 1);

const KEY_POSITION = { x: 600, y: 500, z: 700 };
const FILL_POSITION = { x: -700, y: -300, z: -500 };

export function buildLighting() {
  const lights = [];

  const ambient = new THREE.AmbientLight(tint(sectionColor('thermal'), 0.1), AMBIENT_INTENSITY);
  lights.push(ambient);

  const key = new THREE.DirectionalLight(SUNLIGHT, KEY_INTENSITY);
  key.position.set(KEY_POSITION.x, KEY_POSITION.y, KEY_POSITION.z);
  lights.push(key);

  const fill = new THREE.DirectionalLight(tint(sectionColor('magsail'), 0.1), FILL_INTENSITY);
  fill.position.set(FILL_POSITION.x, FILL_POSITION.y, FILL_POSITION.z);
  lights.push(fill);

  for (const id of ['ringA', 'ringB']) {
    const section = sectionById(id);
    const glow = new THREE.PointLight(
      tint(sectionColor(section.colorKey), 0.55),
      GLOW_INTENSITY,
      GLOW_RANGE
    );
    glow.position.set(0, 0, centerZ(section));
    lights.push(glow);
  }

  const drive = sectionById('propulsion');
  const rim = new THREE.PointLight(
    tint(sectionColor(drive.colorKey), 0.3),
    RIM_INTENSITY,
    RIM_RANGE
  );
  rim.position.set(0, 0, drive.z.from);
  lights.push(rim);

  return lights;
}
