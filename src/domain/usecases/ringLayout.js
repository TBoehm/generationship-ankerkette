import { HABITAT, SPIN_RATE } from '../constants/shipDesign.js';

/**
 * Where the rooms of a deck sit on the ring, and where the ring itself has
 * turned to.
 *
 * A deck is described once, for one of the four identical pressure sectors,
 * and drawn into every sector that the cutaway leaves standing. Inside a
 * sector the rooms take an angular share of their floor area, which is the
 * honest mapping: at a fixed radius and a fixed deck height, area and angle
 * are proportional.
 *
 * The two margins keep the blocks off the sector bulkheads, and the gap
 * shortens every chord so neighbouring rooms read as separate blocks rather
 * than as one band. A room too small to be seen keeps a hairline width
 * instead of collapsing, otherwise the smallest rooms of a deck would simply
 * be missing from the drawing.
 */
const TWO_PI = Math.PI * 2;

/** Angular width of one pressure sector, a quarter turn for four sectors. */
export const SECTOR_ANGLE = TWO_PI / HABITAT.sectorsPerRing;

/** Free angle at each end of a sector, where the bulkheads stand. */
export const SECTOR_MARGIN = 0.035;

/** Angle taken off both ends of a block, so two neighbours do not touch. */
export const BLOCK_GAP = 0.006;

/** Half angle a block keeps even when its share is smaller than the gap. */
export const MIN_BLOCK_HALF_ANGLE = 0.004;

/** Where sector `index` begins, measured from the start of the first one. */
export function sectorOffset(index) {
  return index * SECTOR_ANGLE;
}

/**
 * The room blocks of one deck within one sector, in layout order.
 *
 * Angles are measured from the start of the sector, so the scene adds the
 * cutaway offset and `sectorOffset(index)` and nothing else. `blockRadius` is
 * the radius the blocks are drawn at, which is inside the deck floor, and it
 * is what the chord is computed from.
 */
export function roomBlocks(rooms, blockRadius) {
  const total = rooms.reduce((sum, room) => sum + room.area, 0);
  if (total <= 0) return [];

  const span = SECTOR_ANGLE - 2 * SECTOR_MARGIN;
  let cursor = SECTOR_MARGIN;

  return rooms.map((room) => {
    const width = (span * room.area) / total;
    const startAngle = cursor;
    const endAngle = startAngle + width;
    cursor = endAngle;
    const halfAngle = Math.max(width / 2 - BLOCK_GAP, MIN_BLOCK_HALF_ANGLE);
    return {
      roomId: room.id,
      colorKey: room.colorKey,
      area: room.area,
      radius: blockRadius,
      startAngle,
      endAngle,
      centerAngle: (startAngle + endAngle) / 2,
      width,
      chord: 2 * blockRadius * Math.sin(halfAngle),
    };
  });
}

/**
 * The ring angle one frame later. `spinSense` is the sense the section table
 * carries, plus one for one ring and minus one for the other, so the two
 * angular momenta cancel exactly.
 */
export function advanceSpin(angle, spinSense, deltaMs) {
  if (!Number.isFinite(deltaMs) || deltaMs <= 0 || spinSense === 0) return angle;
  const next = (angle + spinSense * SPIN_RATE * (deltaMs / 1000)) % TWO_PI;
  return next < 0 ? next + TWO_PI : next;
}
