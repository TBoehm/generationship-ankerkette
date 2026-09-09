import { describe, expect, it } from 'vitest';
import { DECK_LAYOUT, roomsOf } from '../../../domain/constants/deckLayout.js';
import { HABITAT } from '../../../domain/constants/shipDesign.js';
import { sectorLength, usableRoomArea } from '../../../domain/usecases/deckGeometry.js';
import { deckPlanFor } from './deckSheet.js';

describe('deckPlanFor', () => {
  it('has nothing for no selection at all', () => {
    expect(deckPlanFor(null)).toBeNull();
    expect(deckPlanFor(undefined)).toBeNull();
  });

  it('has nothing while only a section is selected', () => {
    expect(deckPlanFor({ section: 'ringA', deck: null, room: null })).toBeNull();
  });

  it('has nothing for a section that carries no decks', () => {
    expect(deckPlanFor({ section: 'reactor', deck: 1, room: null })).toBeNull();
  });

  it('has nothing for a deck number the ring does not have', () => {
    expect(deckPlanFor({ section: 'ringA', deck: 9, room: null })).toBeNull();
  });

  it('rolls the deck out into two rows and the corridor between them', () => {
    const plan = deckPlanFor({ section: 'ringA', deck: 1, room: null });
    expect(plan.rows).toHaveLength(2);
    expect(plan.corridor.width).toBe(HABITAT.corridorWidth);
    expect(plan.deckWidth).toBe(HABITAT.axialWidth);
  });

  it('places every room of the deck exactly once', () => {
    const rooms = roomsOf('ringB', 3);
    const plan = deckPlanFor({ section: 'ringB', deck: 3, room: null });
    const placed = plan.rows.flatMap((row) => row.rooms).map((room) => room.id);
    expect(placed.sort()).toEqual(rooms.map((room) => room.id).sort());
  });

  it('carries the ring, the deck and the radius the sheet needs', () => {
    const plan = deckPlanFor({ section: 'ringB', deck: 5, room: null });
    expect(plan.ring).toBe('ringB');
    expect(plan.deck).toBe(5);
    expect(plan.radius).toBe(105);
    expect(plan.sectorLength).toBeCloseTo(sectorLength(105), 12);
  });

  it('takes the share of a room against the room area, not the sector floor', () => {
    // The legacy sheet divided by the whole sector floor, corridor included,
    // and its shares therefore summed to 86.7 per cent. Against the room area
    // they sum to a whole deck, up to the rounding the layout table carries.
    for (const ring of DECK_LAYOUT) {
      for (const deck of ring.decks) {
        const plan = deckPlanFor({ section: ring.id, deck: deck.index, room: null });
        const shares = plan.rows.flatMap((row) => row.rooms).map((room) => room.share);
        const area = deck.rooms.reduce((sum, room) => sum + room.area, 0);
        const roomArea = usableRoomArea(deck.radius);
        expect(plan.roomArea).toBeCloseTo(roomArea, 9);
        expect(shares.reduce((sum, share) => sum + share, 0)).toBeCloseTo(area / roomArea, 12);
        // The layout table balances its last room by hand, to under a square
        // metre out of several thousand, so a whole deck it is.
        expect(Math.abs(area - roomArea), `${ring.id} ${deck.index}`).toBeLessThan(1);
      }
    }
  });

  it('reports how far a row runs past the sector instead of widening the frame', () => {
    for (const ring of DECK_LAYOUT) {
      for (const deck of ring.decks) {
        const plan = deckPlanFor({ section: ring.id, deck: deck.index, room: null });
        const longest = Math.max(
          ...plan.rows.map((row) => row.rooms.reduce((sum, room) => sum + room.width, 0))
        );
        expect(plan.overshoot, `${ring.id} ${deck.index}`).toBeGreaterThanOrEqual(0);
        expect(plan.drawnLength).toBeCloseTo(Math.max(plan.sectorLength, longest), 9);
        expect(plan.overshoot).toBeCloseTo(Math.max(0, longest - plan.sectorLength), 9);
      }
    }
  });
});
