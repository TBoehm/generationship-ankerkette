/**
 * Colour is appearance, so it lives here rather than in the domain. The values
 * are the ones the two legacy documents used, keyed by the stable names the
 * data tables carry.
 *
 * The two tables are deliberately separate. Three keys occur in both and mean
 * different colours: a room corridor is not the hull's circulation bay, a room
 * left as reserve is not the hull's reserve volume, and the shielding water on
 * a deck is not the shadow shield behind the reactor. One flat table would
 * have recoloured all three without anyone noticing.
 */
export const ROOM_COLORS = Object.freeze({
  quarters: 0xc4703c,
  domestic: 0xd18f5e,
  transit: 0xa08b5a,
  airlock: 0x8c9aa4,
  circulation: 0x6f7a84,
  assembly: 0xb2604a,
  recreation: 0x8f9e5a,
  agriculture: 0x6e8f4e,
  knowledge: 0x7c6fa6,
  workshop: 0xb08a4a,
  lifeSupport: 0x4f9184,
  critical: 0xc25b4e,
  water: 0x4e7a8c,
  shielding: 0x8fa6b2,
  orchard: 0x5c7a41,
  substrate: 0x8c7f6a,
  reserve: 0x39434d,
});

export const SECTION_COLORS = Object.freeze({
  ice: 0x8fa6b2,
  water: 0x4e7a8c,
  hull: 0x3a424b,
  quarters: 0xc4703c,
  agriculture: 0x6e8f4e,
  circulation: 0xa08b5a,
  reserve: 0x7c6fa6,
  technical: 0xb08a4a,
  lifeSupport: 0x4f9184,
  power: 0xc25b4e,
  thermal: 0x6b7480,
  shielding: 0x5c6570,
  propellant: 0x7a8290,
  propulsion: 0x9a5a46,
  magsail: 0x9fb8c4,
});

export function roomColor(key) {
  return ROOM_COLORS[key] ?? ROOM_COLORS.circulation;
}

export function sectionColor(key) {
  return SECTION_COLORS[key] ?? SECTION_COLORS.hull;
}
