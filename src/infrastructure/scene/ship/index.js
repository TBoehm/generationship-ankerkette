import * as THREE from 'three';
import { SHIP_SECTIONS } from '../../../domain/constants/shipSections.js';
import {
  SHIP_ORBIT_LIMITS,
  createOrbitState,
  orbitAfterDrag,
  orbitAfterZoom,
  orbitPosition,
} from '../../../domain/usecases/cameraOrbit.js';
import { advanceSpin } from '../../../domain/usecases/ringLayout.js';
import { SHIP_FRAMING, approach, framingFor } from '../../../domain/usecases/shipFraming.js';
import { createDisposalRegistry } from '../disposal.js';
import { createBuilder } from './builder.js';
import { deckPlanFor } from './deckSheet.js';
import { applyHighlight, applyOpacity } from './highlight.js';
import { buildHull } from './hull.js';
import { buildLighting } from './lighting.js';
import { createPicker } from './picking.js';
import { createResources } from './resources.js';
import { buildRings } from './rings.js';
import { buildStarfield } from './starfield.js';

/**
 * The ship scene: one metre is one world unit, the whole hull is 784 m long,
 * and nothing in here knows about the journey, the renderer or React.
 *
 * The stage owns the loop, the context and the listeners. This factory owns
 * an object tree, a camera and a selection, and it is told when to move and
 * how strongly to show itself. That is what makes every part of it testable
 * in jsdom: three.js builds geometry, materials, matrices and raycasts with
 * no drawing context at all, so everything below is asserted rather than
 * looked at.
 */
const CAMERA = Object.freeze({ fov: 42, near: 1, far: 9000 });
const START_ORBIT = Object.freeze({ theta: 0.85, phi: 1.15 });
const EMPTY_SELECTION = Object.freeze({ section: null, deck: null, room: null });

/** What stands between the viewer and the rings, and can be taken away. */
const OUTER_SKIN = Object.freeze(['habitatMantle', 'supplyTanks']);

function normalize(selection) {
  if (!selection) return { ...EMPTY_SELECTION };
  return {
    section: selection.section ?? null,
    deck: selection.deck ?? null,
    room: selection.room ?? null,
  };
}

export function createShipScene({
  registry = createDisposalRegistry(),
  reducedMotion = false,
} = {}) {
  const resources = createResources(registry);
  const root = new THREE.Scene();
  root.name = 'ship-scene';

  // No background: the stage draws the journey first and the ship over it,
  // and a background would paint the journey out during the crossfade.
  for (const light of buildLighting()) root.add(light);
  root.add(buildStarfield({ resources }));

  const { ship, groups, pickables, add } = createBuilder(SHIP_SECTIONS);
  buildHull({ add, resources });
  buildRings({ add, resources });
  root.add(ship);

  const spinning = SHIP_SECTIONS.filter((section) => section.spinSense !== 0).map((section) => ({
    group: groups.get(section.id),
    spinSense: section.spinSense,
  }));

  const camera = new THREE.PerspectiveCamera(CAMERA.fov, 1, CAMERA.near, CAMERA.far);
  const target = new THREE.Vector3(0, 0, SHIP_FRAMING.overviewTargetZ);
  let orbit = createOrbitState(
    { ...START_ORBIT, distance: SHIP_FRAMING.overviewDistance },
    SHIP_ORBIT_LIMITS
  );
  let goal = { ...framingFor(null) };

  const picker = createPicker();
  const viewport = { width: 1, height: 1 };
  let selection = { ...EMPTY_SELECTION };
  let opacity = 0;

  function place() {
    const position = orbitPosition(orbit, target);
    camera.position.set(position.x, position.y, position.z);
    camera.lookAt(target);
  }

  function setSelection(next) {
    selection = normalize(next);
    applyHighlight(pickables, selection);
    applyOpacity(resources.materials, opacity);
    goal = framingFor(selection);
  }

  applyHighlight(pickables, selection);
  applyOpacity(resources.materials, opacity);
  place();

  return {
    root,
    camera,

    setOpacity(value) {
      if (value === opacity) return;
      opacity = value;
      applyOpacity(resources.materials, value);
    },

    update(deltaMs) {
      // The rings hold still while a deck is open, so its rooms can be read.
      const readingADeck = selection.deck !== null;
      if (!reducedMotion && !readingADeck) {
        for (const ring of spinning) {
          ring.group.rotation.z = advanceSpin(ring.group.rotation.z, ring.spinSense, deltaMs);
        }
      }

      target.z = approach(target.z, goal.targetZ, deltaMs);
      orbit = { ...orbit, distance: approach(orbit.distance, goal.distance, deltaMs) };
      place();
    },

    handleDrag(dx, dy) {
      orbit = orbitAfterDrag(orbit, dx, dy, SHIP_ORBIT_LIMITS);
      place();
    },

    handleZoom(factor) {
      // The dolly has a goal of its own, so a pinch is eased like a fly-to
      // instead of snapping the camera to the new distance.
      goal = {
        ...goal,
        distance: orbitAfterZoom({ ...orbit, distance: goal.distance }, factor, SHIP_ORBIT_LIMITS)
          .distance,
      };
    },

    handleTap(x, y, onSelect) {
      // The renderer refreshes the world matrices once per frame, and a tap
      // can arrive between two of them. The raycast reads those matrices, so
      // it brings them up to date itself rather than picking against where
      // the ship stood last frame.
      root.updateMatrixWorld();
      camera.updateMatrixWorld();

      const hit = picker.pick({
        x,
        y,
        width: viewport.width,
        height: viewport.height,
        camera,
        targets: pickables,
      });
      if (!hit) return;
      setSelection(hit);
      if (onSelect) onSelect({ ...hit });
    },

    setSelection,

    /**
     * Takes the outer skin off, so the two rings inside it can be seen. This
     * is the toggle the legacy document had, and the reason the picker walks
     * the parent chain: hiding a group has to hide it from the finger too.
     */
    setHullOpen(open) {
      for (const id of OUTER_SKIN) {
        const group = groups.get(id);
        if (group) group.visible = !open;
      }
    },

    /** What is selected right now, as a copy. */
    selection: () => ({ ...selection }),

    /** The rolled out plan of the selected deck, or null. */
    deckPlan: () => deckPlanFor(selection),

    resize(width, height) {
      if (!width || !height) return;
      viewport.width = width;
      viewport.height = height;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    },

    dispose() {
      registry.disposeAll();
      while (root.children.length) root.remove(root.children[0]);
      while (ship.children.length) ship.remove(ship.children[0]);
      pickables.length = 0;
      resources.materials.length = 0;
      groups.clear();
    },
  };
}

/**
 * The deck sheet without a scene: the React layer draws the same plan whether
 * WebGL is available or not.
 */
export { deckPlanFor } from './deckSheet.js';
