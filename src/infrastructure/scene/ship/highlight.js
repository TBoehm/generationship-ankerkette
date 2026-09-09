import * as THREE from 'three';

/**
 * What a selection looks like: the chosen part keeps its colour, everything
 * else is pushed back, and the chosen room glows.
 *
 * The legacy version mixed the dimmed colour towards one fixed slate value,
 * which is a hex literal in the middle of the scene code and pulls every hue
 * towards the same grey. Multiplying instead keeps the hue and only takes the
 * light away, which reads as depth rather than as a wash.
 */
const BLACK = new THREE.Color(0, 0, 0);

/** How much light is left on a part that is not selected. */
export const DIM_FACTOR = 0.24;

/** How much of its own opacity a dimmed part keeps. */
export const DIM_OPACITY = 0.35;

/** Emissive strength of the selected room, as a fraction of its own colour. */
export const HIGHLIGHT_GLOW = 0.35;

function isLit(userData, selection) {
  if (!selection.section) return true;
  if (userData.section !== selection.section) return false;
  if (selection.deck === null || userData.deck === null) return true;
  return userData.deck === selection.deck;
}

function isSelectedRoom(userData, selection) {
  return (
    selection.room !== null &&
    userData.section === selection.section &&
    userData.deck === selection.deck &&
    userData.room === selection.room
  );
}

/**
 * Recolours every pickable mesh for the given selection. The material keeps
 * its base colour and base opacity, so this is idempotent and reversible.
 */
export function applyHighlight(meshes, selection) {
  for (const mesh of meshes) {
    const material = mesh.material;
    const lit = isLit(mesh.userData, selection);
    material.color.copy(material.userData.baseColor);
    if (!lit) material.color.multiplyScalar(DIM_FACTOR);
    material.userData.dim = lit ? 1 : DIM_OPACITY;

    if (isSelectedRoom(mesh.userData, selection)) {
      material.emissive.copy(material.userData.baseColor).multiplyScalar(HIGHLIGHT_GLOW);
    } else {
      material.emissive.copy(BLACK);
    }
  }
}

/**
 * The crossfade, applied on top of the selection. Two factors, one for the
 * selection and one for the fade, so neither can undo the other.
 */
export function applyOpacity(materials, value) {
  for (const material of materials) {
    material.opacity = material.userData.baseOpacity * material.userData.dim * value;
  }
}
