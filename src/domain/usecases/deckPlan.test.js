import { describe, expect, it } from 'vitest';
import { ROW_HEIGHT, packDeckPlan } from './deckPlan.js';
import { HABITAT } from '../constants/shipDesign.js';
import { sectorLength, usableRoomArea } from './deckGeometry.js';

const RADIUS = 125;

/** A deck whose areas add up to the usable room area, as every real deck does. */
function balancedRooms(count) {
  const total = usableRoomArea(RADIUS);
  const share = total / count;
  return Array.from({ length: count }, (_, i) => ({ id: `room${i}`, area: share }));
}

function widths(plan) {
  return plan.rows.map((row) => row.rooms.reduce((sum, r) => sum + r.width, 0));
}

describe('ROW_HEIGHT', () => {
  it('is derived from the ring, not written down twice', () => {
    expect(ROW_HEIGHT).toBe((HABITAT.axialWidth - HABITAT.corridorWidth) / 2);
    expect(ROW_HEIGHT).toBe(13);
  });
});

describe('packDeckPlan', () => {
  it('rolls the sector out into two rows either side of the corridor', () => {
    const plan = packDeckPlan(balancedRooms(6), RADIUS);
    expect(plan.rows).toHaveLength(2);
    expect(plan.corridor.width).toBe(HABITAT.corridorWidth);
    expect(plan.corridor.y).toBe(ROW_HEIGHT);
  });

  it('reports the sector it is drawing, from the geometry not from a literal', () => {
    const plan = packDeckPlan(balancedRooms(6), RADIUS);
    expect(plan.sectorLength).toBeCloseTo(sectorLength(RADIUS), 9);
    expect(plan.deckWidth).toBe(HABITAT.axialWidth);
  });

  it('conserves area: every square metre put in comes out as width times height', () => {
    const rooms = balancedRooms(7);
    const plan = packDeckPlan(rooms, RADIUS);
    const drawn = plan.rows.flatMap((r) => r.rooms).reduce((s, r) => s + r.width * ROW_HEIGHT, 0);
    expect(drawn).toBeCloseTo(
      rooms.reduce((s, r) => s + r.area, 0),
      6
    );
  });

  it('fills both rows to the sector length when the deck is balanced', () => {
    const plan = packDeckPlan(balancedRooms(8), RADIUS);
    for (const width of widths(plan)) {
      expect(width).toBeCloseTo(sectorLength(RADIUS), 6);
    }
  });

  it('keeps the given order, the rooms are listed bow to stern for a reason', () => {
    const rooms = balancedRooms(5);
    const plan = packDeckPlan(rooms, RADIUS);
    const order = plan.rows.flatMap((r) => r.rooms).map((r) => r.id);
    expect(order).toEqual(rooms.map((r) => r.id));
  });

  it('lays rooms end to end without gaps or overlaps inside a row', () => {
    const plan = packDeckPlan(balancedRooms(9), RADIUS);
    for (const row of plan.rows) {
      let cursor = 0;
      for (const room of row.rooms) {
        expect(room.x).toBeCloseTo(cursor, 9);
        cursor += room.width;
      }
    }
  });

  it('splits where the two rows come out closest, not wherever greed lands', () => {
    const rooms = [
      { id: 'a', area: 13 * 40 },
      { id: 'b', area: 13 * 10 },
      { id: 'c', area: 13 * 45 },
      { id: 'd', area: 13 * 55 },
    ];
    const plan = packDeckPlan(rooms, RADIUS);
    const [top, bottom] = widths(plan);
    // Contiguous splits give 150, 70, 50, 40, 150. The best is 40, at a|b|c.
    expect(Math.abs(top - bottom)).toBe(40);
    expect(plan.rows[0].rooms.map((r) => r.id)).toEqual(['a', 'b', 'c']);
  });

  it('never claims more sector length than the sector has', () => {
    const plan = packDeckPlan(balancedRooms(6), RADIUS);
    expect(plan.drawnLength).toBeCloseTo(sectorLength(RADIUS), 6);
  });

  it('reports an overshoot rather than silently widening the frame', () => {
    const lopsided = [
      { id: 'a', area: 13 * 10 },
      { id: 'b', area: 13 * 300 },
    ];
    const plan = packDeckPlan(lopsided, RADIUS);
    expect(plan.overshoot).toBeGreaterThan(0);
    expect(plan.drawnLength).toBeGreaterThan(sectorLength(RADIUS));
  });

  it('handles a deck with a single room', () => {
    const plan = packDeckPlan([{ id: 'only', area: 13 * 50 }], RADIUS);
    expect(plan.rows[0].rooms).toHaveLength(1);
    expect(plan.rows[1].rooms).toHaveLength(0);
  });

  it('handles a deck with no rooms at all', () => {
    const plan = packDeckPlan([], RADIUS);
    expect(plan.rows[0].rooms).toHaveLength(0);
    expect(plan.rows[1].rooms).toHaveLength(0);
    expect(plan.overshoot).toBe(0);
  });
});
