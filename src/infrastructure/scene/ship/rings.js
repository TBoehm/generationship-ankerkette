import * as THREE from 'three';
import { deckAt } from '../../../domain/constants/deckLayout.js';
import { DECK_RADII, HABITAT } from '../../../domain/constants/shipDesign.js';
import { roomBlocks, sectorOffset } from '../../../domain/usecases/ringLayout.js';
import { roomColor, sectionColor } from '../palette.js';
import { ALONG_Z } from './builder.js';
import { figureValue, sectionById } from './figures.js';
import { shade } from './resources.js';

/**
 * The two habitat rings, each with its five decks and the rooms on them.
 *
 * A quarter of each ring is left out so the decks can be seen from outside:
 * 270 degrees of wall stand, 90 degrees are open. The rooms are drawn into
 * three of the four pressure sectors, the fourth being the one the cutaway
 * removed, which is also why the drawing shows three identical sectors rather
 * than four.
 *
 * Everything built here goes into the ring's own group, and that group is
 * what turns in update(). Its sense comes from the section table, so the two
 * rings cancel by construction rather than by two sign literals here.
 */

/** Where the standing wall begins, and how far it reaches. */
export const CUT_START = -Math.PI * 0.3;
export const CUT_LENGTH = Math.PI * 1.5;

/** Radius the deck five floor sits at, one deck height below its ceiling. */
const INNER_WALL_RADIUS = HABITAT.innerRadius - HABITAT.deckHeight;

const WALL_SEGMENTS = 72;
const BULKHEAD_THICKNESS = 1.5;
const ROOM_BLOCK = { inset: 2.6, height: 3.6, depth: 23 };
const SPOKE = { width: 4.5, thickness: 7, innerRadius: 13 };
const HUB = { radius: 20, length: 34 };
const VISIBLE_SECTORS = 3;

export function buildRings({ add, resources }) {
  for (const section of [sectionById('ringA'), sectionById('ringB')]) {
    buildRing(section, add, resources);
  }
}

function buildRing(section, add, resources) {
  const geometry = (instance) => resources.geometry(instance);
  const material = (color, options) => resources.material(color, options);
  const id = section.id;
  const z = section.z.from;
  const width = HABITAT.axialWidth;
  const base = sectionColor(section.colorKey);

  // Outer wall. It is also the floor of deck one, which is why it carries
  // that deck rather than being untagged structure.
  add(
    id,
    geometry(
      new THREE.CylinderGeometry(
        HABITAT.outerRadius,
        HABITAT.outerRadius,
        width,
        WALL_SEGMENTS,
        1,
        true,
        CUT_START,
        CUT_LENGTH
      )
    ),
    material(base, { metalness: 0.5, roughness: 0.55, side: THREE.DoubleSide }),
    { z, rx: ALONG_Z },
    { deck: 1 }
  );

  add(
    id,
    geometry(
      new THREE.CylinderGeometry(
        INNER_WALL_RADIUS,
        INNER_WALL_RADIUS,
        width,
        WALL_SEGMENTS,
        1,
        true,
        CUT_START,
        CUT_LENGTH
      )
    ),
    material(roomColor('reserve'), {
      metalness: 0.6,
      roughness: 0.5,
      side: THREE.DoubleSide,
    }),
    { z, rx: ALONG_Z }
  );

  // End walls, one at each side of the ring.
  const endWall = geometry(
    new THREE.RingGeometry(
      INNER_WALL_RADIUS,
      HABITAT.outerRadius,
      WALL_SEGMENTS,
      1,
      CUT_START,
      CUT_LENGTH
    )
  );
  const endWallFace = material(shade(sectionColor('hull'), 0.8), {
    metalness: 0.6,
    roughness: 0.55,
    side: THREE.DoubleSide,
  });
  for (const offset of [-width / 2, width / 2]) {
    add(id, endWall, endWallFace, { z: z + offset });
  }

  // Deck floors. Deck one already has the outer wall, the other four get one.
  const floorFace = material(shade(sectionColor('hull'), 1.4), {
    metalness: 0.5,
    roughness: 0.6,
    side: THREE.DoubleSide,
  });
  for (const [index, radius] of DECK_RADII.entries()) {
    if (index === 0) continue;
    add(
      id,
      geometry(
        new THREE.CylinderGeometry(
          radius,
          radius,
          width,
          WALL_SEGMENTS,
          1,
          true,
          CUT_START,
          CUT_LENGTH
        )
      ),
      floorFace,
      { z, rx: ALONG_Z },
      { deck: index + 1 }
    );
  }

  const structureFace = material(shade(sectionColor('circulation'), 0.87), {
    metalness: 0.85,
    roughness: 0.35,
  });

  // Sector bulkheads: four pressure sectors, four walls between them.
  const bulkhead = geometry(new THREE.BoxGeometry(HABITAT.radialHeight, BULKHEAD_THICKNESS, width));
  const bulkheadRadius = (HABITAT.outerRadius + INNER_WALL_RADIUS) / 2;
  for (let sector = 0; sector < HABITAT.sectorsPerRing; sector += 1) {
    const angle = CUT_START + sectorOffset(sector);
    add(id, bulkhead, structureFace, {
      x: Math.cos(angle) * bulkheadRadius,
      y: Math.sin(angle) * bulkheadRadius,
      z,
      rz: angle,
    });
  }

  buildRooms(section, add, geometry, material, z);

  // Spokes from the hub out to the ring, the ring's own lift shafts.
  const spokeCount = figureValue(sectionById('centralAxis'), 'spokesPerRing', 0);
  const spokeLength = INNER_WALL_RADIUS - SPOKE.innerRadius;
  const spokeCircle = (INNER_WALL_RADIUS + SPOKE.innerRadius) / 2;
  const spoke = geometry(new THREE.BoxGeometry(SPOKE.width, spokeLength, SPOKE.thickness));
  for (let i = 0; i < spokeCount; i += 1) {
    const angle = (i / spokeCount) * Math.PI * 2;
    add(id, spoke, structureFace, {
      x: Math.cos(angle) * spokeCircle,
      y: Math.sin(angle) * spokeCircle,
      z,
      rz: angle - Math.PI / 2,
    });
  }

  add(
    id,
    geometry(new THREE.CylinderGeometry(HUB.radius, HUB.radius, HUB.length, 24)),
    material(base, { metalness: 0.7, roughness: 0.4 }),
    { z, rx: ALONG_Z }
  );
}

function buildRooms(section, add, geometry, material, z) {
  for (const [index, radius] of DECK_RADII.entries()) {
    const deckIndex = index + 1;
    const deck = deckAt(section.id, deckIndex);
    if (!deck) continue;

    for (const block of roomBlocks(deck.rooms, radius - ROOM_BLOCK.inset)) {
      // One geometry and one material per room, shared by the sectors it is
      // repeated in: the sectors are identical, and a selected room has to
      // light up in all of them at once.
      const box = geometry(new THREE.BoxGeometry(block.chord, ROOM_BLOCK.height, ROOM_BLOCK.depth));
      const face = material(roomColor(block.colorKey), { metalness: 0.4, roughness: 0.7 });

      for (let sector = 0; sector < VISIBLE_SECTORS; sector += 1) {
        const angle = CUT_START + sectorOffset(sector) + block.centerAngle;
        add(
          section.id,
          box,
          face,
          {
            x: Math.cos(angle) * block.radius,
            y: Math.sin(angle) * block.radius,
            z,
            rz: angle + Math.PI / 2,
          },
          { deck: deckIndex, room: block.roomId }
        );
      }
    }
  }
}
