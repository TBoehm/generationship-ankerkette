import { deckAt } from '../../../domain/constants/deckLayout.js';
import { usableRoomArea } from '../../../domain/usecases/deckGeometry.js';
import { packDeckPlan } from '../../../domain/usecases/deckPlan.js';

/**
 * The rolled out deck, for the sheet the React layer draws next to the scene.
 *
 * Pure, and deliberately not a method on the scene: the sheet is the same
 * whether the scene exists or not, so a server render, a test or a print view
 * can call it without a WebGL context anywhere in sight.
 *
 * The share of a room is taken against the room area of the deck, not against
 * the whole sector floor. The legacy document divided by the sector floor,
 * which includes the longitudinal corridor, so its shares summed to 86.7 per
 * cent and never to a whole deck.
 */
export function deckPlanFor(selection) {
  if (!selection?.section) return null;
  const deckIndex = selection.deck;
  if (deckIndex === null || deckIndex === undefined) return null;

  const deck = deckAt(selection.section, deckIndex);
  if (!deck) return null;

  const roomArea = usableRoomArea(deck.radius);
  const plan = packDeckPlan(deck.rooms, deck.radius);

  return {
    ring: selection.section,
    deck: deckIndex,
    radius: deck.radius,
    roomArea,
    ...plan,
    rows: plan.rows.map((row) => ({
      ...row,
      rooms: row.rooms.map((room) => ({ ...room, share: room.area / roomArea })),
    })),
  };
}
