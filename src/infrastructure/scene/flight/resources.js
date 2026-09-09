/**
 * Two jobs that always travel together: nothing is created without being
 * registered for disposal, and nothing is created without its share of the
 * crossfade.
 *
 * The stage hands this scene an opacity every frame and expects the fade to
 * be rendered here. Every material therefore keeps the opacity it was built
 * with as its base, and the shown value is that base times the stage's. A
 * material whose base changes per frame, a star glow or the exhaust plume,
 * updates its base and is multiplied by the same factor, so a pulsing plume
 * cannot escape the fade.
 */
export function createResources(registry) {
  const entries = new Map();
  let sceneOpacity = 1;

  function applyTo(entry) {
    const opacity = entry.base * sceneOpacity;
    const transparent = opacity < 1;
    if (entry.material.transparent !== transparent) {
      entry.material.transparent = transparent;
      entry.material.needsUpdate = true;
    }
    entry.material.opacity = opacity;
  }

  return {
    /** Register a geometry for disposal and hand it straight back. */
    geometry(geometry) {
      registry.add(() => geometry.dispose());
      return geometry;
    },

    /**
     * Register a material for disposal and enrol it in the crossfade. The
     * base opacity defaults to the one the material was built with.
     */
    material(material, base = material.opacity ?? 1) {
      registry.add(() => material.dispose());
      const entry = { material, base };
      entries.set(material, entry);
      applyTo(entry);
      return material;
    },

    /** Change what a material shows at full scene opacity. */
    setBase(material, base) {
      const entry = entries.get(material);
      if (!entry) return;
      entry.base = base;
      applyTo(entry);
    },

    baseOf(material) {
      return entries.get(material)?.base ?? null;
    },

    setOpacity(value) {
      sceneOpacity = Math.min(1, Math.max(0, value));
      for (const entry of entries.values()) applyTo(entry);
    },

    opacity() {
      return sceneOpacity;
    },

    count() {
      return entries.size;
    },
  };
}
