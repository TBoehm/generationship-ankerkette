import * as THREE from 'three';

/**
 * Every geometry and every material of the ship scene is born here, so that
 * "dispose is complete" is a count rather than a claim: one disposer per
 * resource, registered at the moment the resource exists, never afterwards
 * and never twice.
 *
 * Colour is the second reason this module exists. The palette carries one
 * colour per section and per room, while the drawing needs three shades of
 * each: the face, the darker fitting on it, and the lighter ring around it.
 * Deriving them from the palette entry keeps the family together and keeps
 * hex literals out of the scene, which is what the language gate checks for.
 */
const WHITE = new THREE.Color(1, 1, 1);

/** A darker relative of a palette colour, for fittings and shadowed parts. */
export function shade(color, factor) {
  return new THREE.Color(color).multiplyScalar(factor);
}

/** A lighter relative of a palette colour, for lights and highlights. */
export function tint(color, amount) {
  return new THREE.Color(color).lerp(WHITE, amount);
}

export function createResources(registry) {
  const materials = [];

  return {
    /** Materials in creation order, for the crossfade and the highlight. */
    materials,

    geometry(instance) {
      registry.add(() => instance.dispose());
      return instance;
    },

    /**
     * A standard material that remembers what it looked like before the
     * selection dimmed it and before the crossfade faded it. The two factors
     * are separate, so neither undoes the other.
     */
    material(color, { metalness = 0.55, roughness = 0.62, opacity = 1, side } = {}) {
      const instance = new THREE.MeshStandardMaterial({
        color,
        metalness,
        roughness,
        opacity,
        side: side ?? THREE.FrontSide,
        // Always on: the stage crossfades this scene against the journey by
        // handing it an opacity, so every material has to be able to fade.
        transparent: true,
        depthWrite: true,
      });
      return remember(instance, color, opacity);
    },

    /**
     * Points ignore lighting, so the starfield needs the one material in this
     * scene that carries its own brightness.
     */
    pointsMaterial(color, { size = 3, opacity = 1 } = {}) {
      const instance = new THREE.PointsMaterial({
        color,
        size,
        sizeAttenuation: false,
        opacity,
        transparent: true,
      });
      return remember(instance, color, opacity);
    },
  };

  function remember(instance, color, opacity) {
    instance.userData.baseColor = new THREE.Color(color);
    instance.userData.baseOpacity = opacity;
    instance.userData.dim = 1;
    registry.add(() => instance.dispose());
    materials.push(instance);
    return instance;
  }
}
