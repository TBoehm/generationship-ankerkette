import { describe, expect, it } from 'vitest';
import {
  ALPHA_CENTAURI_B_ORBIT,
  DEPARTURE_POSITION,
  DESTINATIONS,
  ORBIT_PLANE_NORMALS,
  PLANETS,
  PROXIMA_HABITABLE_ZONE,
  PX_PLANETS,
  STARS,
} from './starSystem.js';
import { LIGHT_YEAR_IN_AU } from './astronomy.js';
import { MISSION } from './missionProfile.js';

const DEGREE = Math.PI / 180;
const PARSEC_IN_AU = 206264.8;
const length = (v) => Math.hypot(v.x, v.y, v.z);
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;

/**
 * Apparent magnitude of a body of absolute magnitude M seen from a distance
 * given in astronomical units. Absolute magnitude is defined at ten parsec.
 */
const apparentMagnitude = (absolute, distanceAu) =>
  absolute + 5 * Math.log10(distanceAu / PARSEC_IN_AU / 10);

/** Unit vector from ecliptic latitude and longitude, both in degrees. */
function fromEcliptic(latitude, longitude) {
  const lat = latitude * DEGREE;
  const lon = longitude * DEGREE;
  return {
    x: Math.cos(lat) * Math.cos(lon),
    y: Math.cos(lat) * Math.sin(lon),
    z: Math.sin(lat),
  };
}

describe('PLANETS', () => {
  const EXPECTED_ORDER = [
    'mercury',
    'venus',
    'earth',
    'mars',
    'jupiter',
    'saturn',
    'uranus',
    'neptune',
  ];

  it('lists the eight planets outward from the sun', () => {
    expect(PLANETS.map((p) => p.id)).toEqual(EXPECTED_ORDER);
  });

  it('orders them by increasing orbit and increasing period', () => {
    for (let i = 1; i < PLANETS.length; i += 1) {
      expect(PLANETS[i].semiMajorAxis).toBeGreaterThan(PLANETS[i - 1].semiMajorAxis);
      expect(PLANETS[i].period).toBeGreaterThan(PLANETS[i - 1].period);
    }
  });

  it('obeys the third law of Kepler within two percent', () => {
    for (const planet of PLANETS) {
      const ratio = Math.pow(planet.semiMajorAxis, 3) / Math.pow(planet.period, 2);
      expect(ratio).toBeGreaterThan(0.98);
      expect(ratio).toBeLessThan(1.02);
    }
  });

  it('keeps the reference figures of earth, jupiter and neptune', () => {
    const byId = (id) => PLANETS.find((p) => p.id === id);
    expect(byId('earth').semiMajorAxis).toBe(1);
    expect(byId('earth').period).toBe(1);
    expect(byId('earth').radiusKm).toBe(6371);
    expect(byId('jupiter').radiusKm).toBe(69911);
    // The flight passes the orbit of neptune after 1.7 years counted from ignition.
    expect(byId('neptune').semiMajorAxis).toBeCloseTo(30.07, 2);
  });

  it('carries a start angle in radians for every planet', () => {
    for (const planet of PLANETS) {
      expect(planet.phaseAtEpoch).toBeGreaterThanOrEqual(0);
      expect(planet.phaseAtEpoch).toBeLessThan(2 * Math.PI);
      expect(planet.radiusKm).toBeGreaterThan(0);
    }
  });
});

describe('PX_PLANETS', () => {
  it('holds exactly the two planets confirmed by NIRPS in 2025', () => {
    expect(PX_PLANETS).toHaveLength(2);
    expect(PX_PLANETS.map((p) => p.id)).toEqual(['proximaD', 'proximaB']);
  });

  /**
   * The 2020 candidate at roughly 1.5 AU was disproved by the same NIRPS
   * measurements that confirmed d and b. It must never be drawn, so the guard
   * sits in the data, not in a review comment.
   */
  it('holds no candidate near 1.5 AU', () => {
    for (const planet of PX_PLANETS) {
      expect(Math.abs(planet.semiMajorAxis - 1.5)).toBeGreaterThan(0.5);
      expect(planet.semiMajorAxis).toBeLessThan(0.1);
    }
    expect(PX_PLANETS.some((p) => p.id.toLowerCase().includes('proximac'))).toBe(false);
  });

  it('matches the published orbits, in days and in years', () => {
    const [d, b] = PX_PLANETS;
    expect(d.semiMajorAxis).toBe(0.02881);
    expect(d.periodDays).toBe(5.12338);
    expect(b.semiMajorAxis).toBe(0.04856);
    expect(b.periodDays).toBe(11.186);
    for (const planet of PX_PLANETS) {
      expect(planet.period).toBeCloseTo(planet.periodDays / 365.25, 12);
    }
  });

  it('puts b in the habitable zone and d inside its inner edge', () => {
    const [d, b] = PX_PLANETS;
    expect(b.semiMajorAxis).toBeGreaterThanOrEqual(PROXIMA_HABITABLE_ZONE.inner);
    expect(b.semiMajorAxis).toBeLessThanOrEqual(PROXIMA_HABITABLE_ZONE.outer);
    expect(d.semiMajorAxis).toBeLessThan(PROXIMA_HABITABLE_ZONE.inner);
  });

  it('gives d the radius of 0.81 earth radii quoted in the design notes', () => {
    expect(PX_PLANETS[0].radiusKm / 6371).toBeCloseTo(0.81, 2);
  });

  /** The target orbit is where the mission clock stops, see MISSION.endDistance. */
  it('agrees with the end distance of the mission profile', () => {
    expect(PX_PLANETS[1].semiMajorAxis).toBe(MISSION.endDistance);
  });
});

describe('PROXIMA_HABITABLE_ZONE', () => {
  it('spans 0.042 to 0.082 AU', () => {
    expect(PROXIMA_HABITABLE_ZONE.inner).toBe(0.042);
    expect(PROXIMA_HABITABLE_ZONE.outer).toBe(0.082);
    expect(PROXIMA_HABITABLE_ZONE.inner).toBeLessThan(PROXIMA_HABITABLE_ZONE.outer);
  });
});

describe('ALPHA_CENTAURI_B_ORBIT', () => {
  it('matches the published elements', () => {
    expect(ALPHA_CENTAURI_B_ORBIT.semiMajorAxis).toBe(23.52);
    expect(ALPHA_CENTAURI_B_ORBIT.eccentricity).toBe(0.5179);
    expect(ALPHA_CENTAURI_B_ORBIT.period).toBe(79.91);
  });

  it('swings between 11 and 36 AU', () => {
    const { semiMajorAxis: a, eccentricity: e } = ALPHA_CENTAURI_B_ORBIT;
    expect(a * (1 - e)).toBeCloseTo(11.34, 2);
    expect(a * (1 + e)).toBeCloseTo(35.7, 1);
  });

  it('starts at a fraction of one revolution, not at an angle', () => {
    expect(ALPHA_CENTAURI_B_ORBIT.phaseAtEpoch).toBeGreaterThanOrEqual(0);
    expect(ALPHA_CENTAURI_B_ORBIT.phaseAtEpoch).toBeLessThan(1);
  });
});

describe('STARS', () => {
  it('describes the four stars of the journey', () => {
    expect(Object.keys(STARS)).toEqual(['sun', 'proxima', 'alphaCentauriA', 'alphaCentauriB']);
    for (const star of Object.values(STARS)) {
      expect(star.radiusKm).toBeGreaterThan(0);
      expect(Number.isFinite(star.absoluteMagnitude)).toBe(true);
    }
  });

  it('gives proxima 107000 km, that is 0.154 solar radii', () => {
    expect(STARS.proxima.radiusKm).toBe(107000);
    expect(STARS.proxima.radiusKm / STARS.sun.radiusKm).toBeCloseTo(0.154, 3);
  });

  it('makes proxima invisible to the naked eye from earth, at 11.17 mag', () => {
    expect(STARS.proxima.absoluteMagnitude).toBe(15.6);
    expect(apparentMagnitude(STARS.proxima.absoluteMagnitude, DESTINATIONS.proxima.distance)) //
      .toBeCloseTo(11.17, 2);
  });

  /** Magnitude 6 is the naked eye limit, and the profile puts it at 24798 AU to go. */
  it('reaches magnitude 6 exactly at the naked eye distance of the profile', () => {
    const remaining = DESTINATIONS.proxima.distance - MISSION.nakedEyeDistance;
    expect(apparentMagnitude(STARS.proxima.absoluteMagnitude, remaining)).toBeCloseTo(6, 3);
  });

  it('lets alpha centauri A shine at -6.8 mag seen from proxima', () => {
    const separation = 12058;
    expect(apparentMagnitude(STARS.alphaCentauriA.absoluteMagnitude, separation)) //
      .toBeCloseTo(-6.8, 1);
  });
});

describe('DESTINATIONS', () => {
  it('carries proxima and the pair alpha centauri AB', () => {
    expect(Object.keys(DESTINATIONS)).toEqual(['proxima', 'alphaCentauri']);
  });

  it('holds unit vectors, to the rounding of the published five decimals', () => {
    for (const destination of Object.values(DESTINATIONS)) {
      expect(length(destination.direction)).toBeCloseTo(1, 5);
    }
  });

  it('derives every direction from its ecliptic latitude and longitude', () => {
    for (const destination of Object.values(DESTINATIONS)) {
      const expected = fromEcliptic(destination.eclipticLatitude, destination.eclipticLongitude);
      expect(destination.direction.x).toBeCloseTo(expected.x, 3);
      expect(destination.direction.y).toBeCloseTo(expected.y, 3);
      expect(destination.direction.z).toBeCloseTo(expected.z, 3);
    }
  });

  it('converts light years to astronomical units with the shared factor', () => {
    for (const destination of Object.values(DESTINATIONS)) {
      expect(destination.distance).toBeCloseTo(
        destination.distanceLightYears * LIGHT_YEAR_IN_AU,
        6
      );
    }
    expect(DESTINATIONS.proxima.distanceLightYears).toBe(4.2465);
    expect(DESTINATIONS.alphaCentauri.distanceLightYears).toBe(4.3441);
  });

  it('agrees with the total distance of the mission profile', () => {
    expect(DESTINATIONS.proxima.distance).toBe(MISSION.totalDistance);
    expect(DESTINATIONS.alphaCentauri.distance).toBeGreaterThan(DESTINATIONS.proxima.distance);
  });

  it('separates the two by 2.185 degrees on the sky', () => {
    const a = DESTINATIONS.proxima.direction;
    const b = DESTINATIONS.alphaCentauri.direction;
    const cosine = dot(a, b) / (length(a) * length(b));
    expect((Math.acos(cosine) / DEGREE).toFixed(3)).toBe('2.185');
  });

  it('separates the two by 12058 AU in space', () => {
    const a = DESTINATIONS.proxima;
    const b = DESTINATIONS.alphaCentauri;
    const separation = Math.hypot(
      a.direction.x * a.distance - b.direction.x * b.distance,
      a.direction.y * a.distance - b.direction.y * b.distance,
      a.direction.z * a.distance - b.direction.z * b.distance
    );
    expect(Math.round(separation)).toBe(12058);
  });

  it('runs 45 degrees below the ecliptic, so no planet comes near the path', () => {
    const belowEcliptic = -Math.asin(DESTINATIONS.proxima.direction.z) / DEGREE;
    expect(belowEcliptic).toBeGreaterThan(44);
    expect(belowEcliptic).toBeLessThan(46);
  });
});

describe('DEPARTURE_POSITION', () => {
  it('sits one astronomical unit from the sun', () => {
    expect(length(DEPARTURE_POSITION)).toBeCloseTo(1, 12);
  });
});

describe('ORBIT_PLANE_NORMALS', () => {
  it('carries one normal per orbit family', () => {
    expect(Object.keys(ORBIT_PLANE_NORMALS)).toEqual(['ecliptic', 'proxima', 'alphaCentauriB']);
    for (const normal of Object.values(ORBIT_PLANE_NORMALS)) {
      expect(length(normal)).toBeGreaterThan(0);
    }
  });

  it('leaves the ecliptic itself flat', () => {
    expect(ORBIT_PLANE_NORMALS.ecliptic).toEqual({ x: 0, y: 0, z: 1 });
  });
});

describe('the data as a whole', () => {
  it('is frozen', () => {
    expect(Object.isFrozen(PLANETS)).toBe(true);
    expect(Object.isFrozen(PX_PLANETS)).toBe(true);
    expect(Object.isFrozen(STARS)).toBe(true);
    expect(Object.isFrozen(DESTINATIONS)).toBe(true);
    for (const planet of [...PLANETS, ...PX_PLANETS]) {
      expect(Object.isFrozen(planet)).toBe(true);
    }
  });

  it('carries no prose and no hex colour, only ids, keys and numbers', () => {
    const serialized = JSON.stringify({ PLANETS, PX_PLANETS, STARS, DESTINATIONS });
    // Printable ASCII only, so no German name survived the transcription.
    expect(serialized).toMatch(/^[ -~]*$/);
    expect(serialized).not.toMatch(/0x[0-9a-f]{6}/i);
    expect(serialized).not.toMatch(/#[0-9a-f]{6}/i);
  });

  it('names an i18n key and a colour key for every body', () => {
    const bodies = [...PLANETS, ...PX_PLANETS, ...Object.values(STARS)];
    for (const body of bodies) {
      expect(body.nameKey).toBe(`flight.body.${body.id}.name`);
      expect(body.colorKey).toMatch(/^[a-zA-Z]+$/);
    }
    const ids = bodies.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
