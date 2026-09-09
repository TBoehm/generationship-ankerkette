import { SECTION_COLORS } from '../palette.js';

/**
 * The colours of the journey. They sit here rather than in the shared
 * `palette.js` for one reason: that file is the ship's, and this scene must
 * not edit it. Anything the two have in common is imported from there instead
 * of restated, which is why the ship proxy is painted straight out of
 * `SECTION_COLORS`: it is the same ship, seen from far enough away that a
 * section is a single cylinder.
 *
 * The keys match the `colorKey` of `starSystem.js`, so a body added to the
 * table is a body this file already knows how to paint.
 */
export const BODY_COLORS = Object.freeze({
  sun: 0xfff0c4,
  mercury: 0xa5988a,
  venus: 0xe0c68c,
  earth: 0x74a6cf,
  mars: 0xcc7248,
  jupiter: 0xd8ae78,
  saturn: 0xe4cd9c,
  uranus: 0xa4d8de,
  neptune: 0x7188d4,
  proxima: 0xff9070,
  proximaD: 0x9c8a7c,
  proximaB: 0xb56d52,
  alphaCentauriA: 0xfff4d6,
  alphaCentauriB: 0xffcc92,
});

/** Only the four stars burn, so only the four stars carry an emissive tint. */
export const EMISSIVE_COLORS = Object.freeze({
  sun: 0xffe0a0,
  proxima: 0xff7a55,
  alphaCentauriA: 0xffeaba,
  alphaCentauriB: 0xffbb78,
});

/** The point fields: the fixed stars behind everything, and the four shells. */
export const FIELD_COLORS = Object.freeze({
  starField: 0xa8b6c2,
  kuiperBelt: 0x93a8b6,
  heliosphere: 0x5fb0cc,
  innerOortCloud: 0x818f76,
  outerOortCloud: 0x717d6b,
  alphaCentauriCloud: 0x8f8472,
});

/** The drawn lines: orbits, the habitable zone, and the path itself. */
export const TRACE_COLORS = Object.freeze({
  planetOrbit: 0x54636f,
  proximaOrbit: 0xa5705a,
  habitableZone: 0x4f8f5c,
  alphaCentauriBOrbit: 0x6a6255,
  flightPath: 0xc9a253,
});

export const LIGHT_COLORS = Object.freeze({
  ambient: 0x9dabb8,
  sun: 0xfff0d0,
  proxima: 0xff8a5a,
  camera: 0xc9d6e2,
});

/**
 * The ship proxy. Every part takes the colour its section already has, so the
 * model in the journey and the model in the hull view cannot drift apart. The
 * plume is the one colour the ship view has no use for.
 */
export const PROXY_COLORS = Object.freeze({
  ...SECTION_COLORS,
  exhaust: 0xff9a4a,
  // The mark that keeps the ship findable once it is smaller than a pixel.
  marker: 0xc9a253,
});

function lookUp(table, key, fallback) {
  return Object.prototype.hasOwnProperty.call(table, key) ? table[key] : fallback;
}

export function bodyColor(key) {
  return lookUp(BODY_COLORS, key, FIELD_COLORS.starField);
}

/** Null for anything that only reflects, which is every planet. */
export function emissiveColor(key) {
  return lookUp(EMISSIVE_COLORS, key, null);
}

export function fieldColor(key) {
  return lookUp(FIELD_COLORS, key, FIELD_COLORS.starField);
}

export function traceColor(key) {
  return lookUp(TRACE_COLORS, key, TRACE_COLORS.planetOrbit);
}

export function lightColor(key) {
  return lookUp(LIGHT_COLORS, key, LIGHT_COLORS.ambient);
}

export function proxyColor(key) {
  return lookUp(PROXY_COLORS, key, PROXY_COLORS.hull);
}
