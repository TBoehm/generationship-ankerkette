import { describe, expect, it } from 'vitest';
import { DECK_LAYOUT, deckAt, roomsOf } from '../constants/deckLayout.js';
import { HABITAT, SPIN_RATE } from '../constants/shipDesign.js';
import {
  BLOCK_GAP,
  MIN_BLOCK_HALF_ANGLE,
  SECTOR_ANGLE,
  SECTOR_MARGIN,
  advanceSpin,
  roomBlocks,
  sectorOffset,
} from './ringLayout.js';

const TWO_PI = Math.PI * 2;
const ROOM_SPAN = SECTOR_ANGLE - 2 * SECTOR_MARGIN;

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

describe('SECTOR_ANGLE', () => {
  it('is a full turn split over the pressure sectors of a ring', () => {
    expect(SECTOR_ANGLE).toBeCloseTo(TWO_PI / HABITAT.sectorsPerRing, 12);
    expect(SECTOR_ANGLE).toBeCloseTo(Math.PI / 2, 12);
  });
});

describe('sectorOffset', () => {
  it('spaces the four sectors evenly around the ring', () => {
    const offsets = [0, 1, 2, 3].map(sectorOffset);
    expect(offsets).toEqual([0, SECTOR_ANGLE, 2 * SECTOR_ANGLE, 3 * SECTOR_ANGLE]);
  });

  it('closes the circle after the last sector', () => {
    expect(sectorOffset(HABITAT.sectorsPerRing)).toBeCloseTo(TWO_PI, 12);
  });
});

describe('roomBlocks', () => {
  const rooms = roomsOf('ringA', 1);
  const blockRadius = 122.4;

  it('returns one block per room, in layout order', () => {
    const blocks = roomBlocks(rooms, blockRadius);
    expect(blocks).toHaveLength(rooms.length);
    expect(blocks.map((block) => block.roomId)).toEqual(rooms.map((room) => room.id));
  });

  it('fills the sector minus its two margins, no more and no less', () => {
    const blocks = roomBlocks(rooms, blockRadius);
    expect(sum(blocks.map((block) => block.width))).toBeCloseTo(ROOM_SPAN, 12);
    expect(blocks[0].startAngle).toBeCloseTo(SECTOR_MARGIN, 12);
    expect(blocks.at(-1).endAngle).toBeCloseTo(SECTOR_ANGLE - SECTOR_MARGIN, 12);
  });

  it('lays the blocks end to end without a gap or an overlap', () => {
    const blocks = roomBlocks(rooms, blockRadius);
    for (let i = 1; i < blocks.length; i += 1) {
      expect(blocks[i].startAngle).toBeCloseTo(blocks[i - 1].endAngle, 12);
    }
  });

  it('gives every room an angular share of its floor area', () => {
    const blocks = roomBlocks(rooms, blockRadius);
    const total = sum(rooms.map((room) => room.area));
    for (const [index, block] of blocks.entries()) {
      expect(block.width).toBeCloseTo((ROOM_SPAN * rooms[index].area) / total, 12);
    }
  });

  it('centres each block inside its own span', () => {
    for (const block of roomBlocks(rooms, blockRadius)) {
      expect(block.centerAngle).toBeCloseTo((block.startAngle + block.endAngle) / 2, 12);
    }
  });

  it('carries the radius the block sits at, so the scene places it without recomputing', () => {
    for (const block of roomBlocks(rooms, blockRadius)) {
      expect(block.radius).toBe(blockRadius);
    }
  });

  it('shortens the chord by the gap, so neighbouring blocks stay apart', () => {
    const blocks = roomBlocks(rooms, blockRadius);
    for (const block of blocks) {
      const full = 2 * blockRadius * Math.sin(block.width / 2);
      expect(block.chord).toBeLessThan(full);
      expect(block.chord).toBeGreaterThan(0);
    }
  });

  it('keeps a hairline block visible rather than collapsing it to nothing', () => {
    const tiny = [
      { id: 'wide', area: 1000 },
      { id: 'hairline', area: 0.001 },
    ];
    const blocks = roomBlocks(tiny, blockRadius);
    const hairline = blocks[1];
    expect(hairline.width).toBeLessThan(BLOCK_GAP);
    expect(hairline.chord).toBeCloseTo(2 * blockRadius * Math.sin(MIN_BLOCK_HALF_ANGLE), 12);
  });

  it('has no blocks for an empty deck', () => {
    expect(roomBlocks([], blockRadius)).toEqual([]);
  });

  it('has no blocks when the rooms carry no area at all, rather than dividing by zero', () => {
    const blocks = roomBlocks([{ id: 'void', area: 0 }], blockRadius);
    expect(blocks).toEqual([]);
  });

  it('passes the colour key through, the palette resolves it in the scene', () => {
    const blocks = roomBlocks(rooms, blockRadius);
    expect(blocks.map((block) => block.colorKey)).toEqual(rooms.map((room) => room.colorKey));
  });

  it('lays out every deck of both rings without leaving the sector', () => {
    for (const ring of DECK_LAYOUT) {
      for (const deck of ring.decks) {
        const blocks = roomBlocks(deckAt(ring.id, deck.index).rooms, deck.radius - 2.6);
        expect(blocks).toHaveLength(deck.rooms.length);
        expect(blocks[0].startAngle).toBeGreaterThanOrEqual(0);
        expect(blocks.at(-1).endAngle).toBeLessThanOrEqual(SECTOR_ANGLE);
      }
    }
  });
});

describe('advanceSpin', () => {
  it('turns the ring by the design spin rate over one second', () => {
    expect(advanceSpin(0, 1, 1000)).toBeCloseTo(SPIN_RATE, 12);
  });

  it('turns the counter-rotating ring the other way, so the momenta cancel', () => {
    const forward = advanceSpin(0, 1, 1000);
    const backward = advanceSpin(0, -1, 1000);
    expect(forward + (backward - TWO_PI)).toBeCloseTo(0, 12);
  });

  it('wraps into a single turn instead of growing without bound', () => {
    let angle = 0;
    for (let i = 0; i < 1000; i += 1) angle = advanceSpin(angle, 1, 1000);
    expect(angle).toBeGreaterThanOrEqual(0);
    expect(angle).toBeLessThan(TWO_PI);
  });

  it('holds still for a section that does not spin', () => {
    expect(advanceSpin(1.2, 0, 1000)).toBe(1.2);
  });

  it('holds still for a frame of no length', () => {
    expect(advanceSpin(1.2, 1, 0)).toBe(1.2);
  });

  it('never runs backwards on a backwards timestamp', () => {
    expect(advanceSpin(1.2, 1, -500)).toBe(1.2);
  });

  it('ignores a delta that is not a number', () => {
    expect(advanceSpin(1.2, 1, Number.NaN)).toBe(1.2);
  });
});
