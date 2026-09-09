import { describe, expect, it } from 'vitest';
import {
  addScaled,
  circularOrbitAngle,
  circularOrbitPosition,
  cross,
  dot,
  eccentricAnomaly,
  ellipticOrbitPoint,
  ellipticOrbitPosition,
  length,
  meanAnomaly,
  normalize,
  orbitPlaneBasis,
  pathPositionAt,
  starPositionOf,
  subtract,
  vector,
} from './flightGeometry.js';
import {
  ALPHA_CENTAURI_B_ORBIT,
  DEPARTURE_POSITION,
  DESTINATIONS,
  ORBIT_PLANE_NORMALS,
  PLANETS,
  PX_PLANETS,
} from '../constants/starSystem.js';
import { MISSION } from '../constants/missionProfile.js';

const TWO_PI = Math.PI * 2;
const earth = PLANETS.find((planet) => planet.id === 'earth');
const eclipticPlane = orbitPlaneBasis(ORBIT_PLANE_NORMALS.ecliptic);

describe('vector helpers', () => {
  it('adds a scaled second vector without touching the first', () => {
    const base = vector(1, 0, 0);
    const moved = addScaled(base, vector(0, 2, 0), 3);
    expect(moved).toEqual({ x: 1, y: 6, z: 0 });
    expect(base).toEqual({ x: 1, y: 0, z: 0 });
  });

  it('measures length and normalises to it', () => {
    expect(length(vector(3, 4, 0))).toBeCloseTo(5, 12);
    expect(length(normalize(vector(3, 4, 0)))).toBeCloseTo(1, 12);
  });

  it('leaves a zero vector alone rather than dividing by zero', () => {
    expect(normalize(vector(0, 0, 0))).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('crosses right handed, x by y gives z', () => {
    expect(cross(vector(1, 0, 0), vector(0, 1, 0))).toEqual({ x: 0, y: 0, z: 1 });
  });

  it('subtracts and dots', () => {
    expect(subtract(vector(2, 3, 4), vector(1, 1, 1))).toEqual({ x: 1, y: 2, z: 3 });
    expect(dot(vector(1, 2, 3), vector(4, 5, 6))).toBe(32);
  });
});

describe('orbitPlaneBasis', () => {
  it('spans the ecliptic with the two axes of the ecliptic itself', () => {
    expect(eclipticPlane.first.x).toBeCloseTo(1, 12);
    expect(eclipticPlane.first.y).toBeCloseTo(0, 12);
    expect(eclipticPlane.second.x).toBeCloseTo(0, 12);
    expect(eclipticPlane.second.y).toBeCloseTo(1, 12);
  });

  it('returns an orthonormal pair for a tilted plane', () => {
    const plane = orbitPlaneBasis(ORBIT_PLANE_NORMALS.proxima);
    expect(length(plane.first)).toBeCloseTo(1, 12);
    expect(length(plane.second)).toBeCloseTo(1, 12);
    expect(dot(plane.first, plane.second)).toBeCloseTo(0, 12);
    expect(dot(plane.first, plane.normal)).toBeCloseTo(0, 12);
    expect(dot(plane.second, plane.normal)).toBeCloseTo(0, 12);
  });

  it('normalises the incoming normal, the tables carry unnormalised triples', () => {
    expect(length(orbitPlaneBasis(ORBIT_PLANE_NORMALS.alphaCentauriB).normal)).toBeCloseTo(1, 12);
  });

  it('measures every plane of this system from the x axis', () => {
    for (const normal of Object.values(ORBIT_PLANE_NORMALS)) {
      expect(dot(orbitPlaneBasis(normal).first, vector(1, 0, 0))).toBeGreaterThan(0.9);
    }
  });

  it('falls back to a second reference axis when the normal is the x axis itself', () => {
    const plane = orbitPlaneBasis(vector(1, 0, 0));
    expect(length(plane.first)).toBeCloseTo(1, 12);
    expect(dot(plane.first, plane.normal)).toBeCloseTo(0, 12);
    expect(dot(plane.second, plane.normal)).toBeCloseTo(0, 12);
  });
});

describe('circularOrbitAngle', () => {
  it('starts at the phase of the epoch', () => {
    expect(circularOrbitAngle(earth, 0)).toBeCloseTo(earth.phaseAtEpoch, 12);
  });

  it('turns once per period', () => {
    expect(circularOrbitAngle(earth, earth.period)).toBeCloseTo(earth.phaseAtEpoch + TWO_PI, 12);
  });

  it('runs backwards before the cast off, a negative time is a valid time', () => {
    expect(circularOrbitAngle(earth, -earth.period / 2)).toBeCloseTo(
      earth.phaseAtEpoch - Math.PI,
      12
    );
  });
});

describe('circularOrbitPosition', () => {
  const sun = vector(0, 0, 0);

  it('places the earth on its own axis at the epoch, phase zero', () => {
    const position = circularOrbitPosition(earth, eclipticPlane, sun, 0);
    expect(position.x).toBeCloseTo(1, 9);
    expect(position.y).toBeCloseTo(0, 9);
    expect(position.z).toBeCloseTo(0, 9);
  });

  it('keeps the orbit radius at every time, the orbits are circles', () => {
    for (const time of [0, 0.3, 7, 260]) {
      for (const planet of PLANETS) {
        const position = circularOrbitPosition(planet, eclipticPlane, sun, time);
        expect(length(position)).toBeCloseTo(planet.semiMajorAxis, 9);
      }
    }
  });

  it('closes after one period', () => {
    const start = circularOrbitPosition(earth, eclipticPlane, sun, 3);
    const later = circularOrbitPosition(earth, eclipticPlane, sun, 3 + earth.period);
    expect(later.x).toBeCloseTo(start.x, 9);
    expect(later.y).toBeCloseTo(start.y, 9);
    expect(later.z).toBeCloseTo(start.z, 9);
  });

  it('stays in its own plane, the proxima planets ride the tilted one', () => {
    const plane = orbitPlaneBasis(ORBIT_PLANE_NORMALS.proxima);
    const centre = starPositionOf(DESTINATIONS.proxima);
    for (const planet of PX_PLANETS) {
      const offset = subtract(circularOrbitPosition(planet, plane, centre, 12), centre);
      expect(dot(offset, plane.normal)).toBeCloseTo(0, 9);
      expect(length(offset)).toBeCloseTo(planet.semiMajorAxis, 9);
    }
  });

  it('turns four times over the last forty six days before proxima b', () => {
    const planet = PX_PLANETS.find((body) => body.id === 'proximaB');
    const turns = (46 / 365.25) * (1 / planet.period);
    expect(turns).toBeGreaterThan(4);
    expect(turns).toBeLessThan(4.2);
  });
});

describe('meanAnomaly', () => {
  it('reads the phase of the epoch as a fraction of one revolution', () => {
    expect(meanAnomaly(ALPHA_CENTAURI_B_ORBIT, 0)).toBeCloseTo(
      TWO_PI * ALPHA_CENTAURI_B_ORBIT.phaseAtEpoch,
      12
    );
  });

  it('wraps into a single turn, however many centuries have passed', () => {
    const late = meanAnomaly(ALPHA_CENTAURI_B_ORBIT, 466.1);
    expect(late).toBeGreaterThanOrEqual(0);
    expect(late).toBeLessThan(TWO_PI);
  });

  it('wraps a negative time forwards instead of returning a negative angle', () => {
    expect(meanAnomaly(ALPHA_CENTAURI_B_ORBIT, -300)).toBeGreaterThanOrEqual(0);
  });
});

describe('eccentricAnomaly', () => {
  it('solves the equation it was given', () => {
    const eccentricity = ALPHA_CENTAURI_B_ORBIT.eccentricity;
    for (const mean of [0, 0.4, 1.7, Math.PI, 4.9, 6.1]) {
      const solved = eccentricAnomaly(mean, eccentricity);
      expect(solved - eccentricity * Math.sin(solved)).toBeCloseTo(mean, 9);
    }
  });

  it('is the identity on a circle', () => {
    expect(eccentricAnomaly(1.3, 0)).toBeCloseTo(1.3, 12);
  });
});

describe('ellipticOrbitPosition', () => {
  const centre = starPositionOf(DESTINATIONS.alphaCentauri);
  const plane = orbitPlaneBasis(ORBIT_PLANE_NORMALS.alphaCentauriB);
  const { semiMajorAxis, eccentricity, period } = ALPHA_CENTAURI_B_ORBIT;

  it('swings the separation between eleven and thirty six astronomical units', () => {
    let min = Infinity;
    let max = 0;
    for (let step = 0; step <= 400; step += 1) {
      const separation = length(
        subtract(
          ellipticOrbitPosition(ALPHA_CENTAURI_B_ORBIT, plane, centre, (step / 400) * period),
          centre
        )
      );
      min = Math.min(min, separation);
      max = Math.max(max, separation);
    }
    expect(min).toBeCloseTo(semiMajorAxis * (1 - eccentricity), 2);
    expect(max).toBeCloseTo(semiMajorAxis * (1 + eccentricity), 2);
  });

  it('closes after one revolution of seventy nine years', () => {
    const start = ellipticOrbitPosition(ALPHA_CENTAURI_B_ORBIT, plane, centre, 5);
    const later = ellipticOrbitPosition(ALPHA_CENTAURI_B_ORBIT, plane, centre, 5 + period);
    expect(later.x).toBeCloseTo(start.x, 6);
    expect(later.y).toBeCloseTo(start.y, 6);
    expect(later.z).toBeCloseTo(start.z, 6);
  });

  it('lands on the drawn ellipse, the line and the star cannot drift apart', () => {
    const time = 33;
    const eccentric = eccentricAnomaly(
      meanAnomaly(ALPHA_CENTAURI_B_ORBIT, time),
      ALPHA_CENTAURI_B_ORBIT.eccentricity
    );
    const onCurve = ellipticOrbitPoint(ALPHA_CENTAURI_B_ORBIT, plane, centre, eccentric);
    const moving = ellipticOrbitPosition(ALPHA_CENTAURI_B_ORBIT, plane, centre, time);
    expect(onCurve.x).toBeCloseTo(moving.x, 12);
    expect(onCurve.y).toBeCloseTo(moving.y, 12);
    expect(onCurve.z).toBeCloseTo(moving.z, 12);
  });

  it('stays in the plane of the pair', () => {
    const offset = subtract(
      ellipticOrbitPosition(ALPHA_CENTAURI_B_ORBIT, plane, centre, 61),
      centre
    );
    expect(dot(offset, plane.normal)).toBeCloseTo(0, 9);
  });
});

describe('pathPositionAt', () => {
  it('starts at the departure position, one astronomical unit from the sun', () => {
    expect(pathPositionAt(0)).toEqual({ ...DEPARTURE_POSITION });
  });

  it('ends at proxima, the path is the whole journey', () => {
    const arrival = pathPositionAt(MISSION.totalDistance);
    const proxima = starPositionOf(DESTINATIONS.proxima);
    expect(arrival.x).toBeCloseTo(proxima.x, 9);
    expect(arrival.y).toBeCloseTo(proxima.y, 9);
    expect(arrival.z).toBeCloseTo(proxima.z, 9);
  });

  it('holds the published direction, only the length grows', () => {
    // The published triple is five decimals, so its own length is 1.0000015.
    // That is kept verbatim rather than renormalised, which is why the
    // heading matches to five places and the travelled length to three.
    const heading = normalize(subtract(pathPositionAt(4321), DEPARTURE_POSITION));
    expect(heading.x).toBeCloseTo(DESTINATIONS.proxima.direction.x, 5);
    expect(heading.y).toBeCloseTo(DESTINATIONS.proxima.direction.y, 5);
    expect(heading.z).toBeCloseTo(DESTINATIONS.proxima.direction.z, 5);
  });

  it('advances by the distance it was given', () => {
    expect(length(subtract(pathPositionAt(1000), pathPositionAt(400)))).toBeCloseTo(600, 2);
  });
});

describe('starPositionOf', () => {
  it('puts the pair twelve thousand astronomical units off proxima', () => {
    const separation = length(
      subtract(starPositionOf(DESTINATIONS.alphaCentauri), starPositionOf(DESTINATIONS.proxima))
    );
    expect(separation).toBeGreaterThan(11500);
    expect(separation).toBeLessThan(12500);
  });
});
