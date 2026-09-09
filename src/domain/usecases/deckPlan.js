import { HABITAT } from '../constants/shipDesign.js';
import { sectorLength } from './deckGeometry.js';

/**
 * A sector rolled out flat: two rows of rooms with the longitudinal corridor
 * running between them for the whole length of the ring.
 *
 * The original packed greedily into whichever row was shorter and then widened
 * the frame with max(top, bottom, sectorLength). That let the drawing claim
 * more sector than the sector has. Here the split is chosen to balance the two
 * rows while keeping the given order, which is meaningful, and any remaining
 * imbalance is reported as an overshoot instead of being hidden in the frame.
 */
export const ROW_HEIGHT = (HABITAT.axialWidth - HABITAT.corridorWidth) / 2;

function layRow(rooms) {
  let cursor = 0;
  return rooms.map((room) => {
    const width = room.area / ROW_HEIGHT;
    const placed = { ...room, x: cursor, width };
    cursor += width;
    return placed;
  });
}

/** The contiguous split point where the two rows come out closest in length. */
function bestSplit(widths) {
  const total = widths.reduce((sum, w) => sum + w, 0);
  let best = 0;
  let bestImbalance = Infinity;
  let top = 0;
  for (let split = 0; split <= widths.length; split += 1) {
    if (split > 0) top += widths[split - 1];
    const imbalance = Math.abs(top - (total - top));
    // On a tie the later split wins, so a lone room fills the top row rather
    // than sitting under an empty one.
    if (imbalance <= bestImbalance) {
      bestImbalance = imbalance;
      best = split;
    }
  }
  return best;
}

export function packDeckPlan(rooms, radius) {
  const widths = rooms.map((room) => room.area / ROW_HEIGHT);
  const split = bestSplit(widths);
  const rows = [
    { y: 0, rooms: layRow(rooms.slice(0, split)) },
    { y: ROW_HEIGHT + HABITAT.corridorWidth, rooms: layRow(rooms.slice(split)) },
  ];

  const rowLengths = rows.map((row) => row.rooms.reduce((sum, room) => sum + room.width, 0));
  const sector = sectorLength(radius);
  const drawnLength = Math.max(sector, ...rowLengths);

  return {
    rows,
    corridor: { y: ROW_HEIGHT, width: HABITAT.corridorWidth },
    sectorLength: sector,
    deckWidth: HABITAT.axialWidth,
    drawnLength,
    overshoot: Math.max(0, Math.max(...rowLengths) - sector),
  };
}
