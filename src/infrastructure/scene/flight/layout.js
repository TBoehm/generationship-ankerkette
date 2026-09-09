import {
  DESTINATIONS,
  ORBIT_PLANE_NORMALS,
  PLANETS,
} from '../../../domain/constants/starSystem.js';
import {
  orbitPlaneBasis,
  starPositionOf,
  vector,
} from '../../../domain/usecases/flightGeometry.js';

/**
 * The fixed points of the journey, worked out once at module load: three
 * centres and three orbit planes, all in ecliptic astronomical units. Bodies,
 * lines and clouds all hang off these, so a single table decides where the
 * two systems sit and nothing recomputes it per frame.
 */
export const SUN_POSITION = vector(0, 0, 0);
export const PROXIMA_POSITION = starPositionOf(DESTINATIONS.proxima);
export const ALPHA_CENTAURI_POSITION = starPositionOf(DESTINATIONS.alphaCentauri);

export const ECLIPTIC_PLANE = orbitPlaneBasis(ORBIT_PLANE_NORMALS.ecliptic);
export const PROXIMA_PLANE = orbitPlaneBasis(ORBIT_PLANE_NORMALS.proxima);
export const ALPHA_CENTAURI_B_PLANE = orbitPlaneBasis(ORBIT_PLANE_NORMALS.alphaCentauriB);

/** The yardstick for the exaggerated body sizes of the system view. */
export const EARTH_RADIUS_KM = PLANETS.find((planet) => planet.id === 'earth').radiusKm;
