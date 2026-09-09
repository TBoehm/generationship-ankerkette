import * as THREE from 'three';

/**
 * The hull is one group per section, all fifteen of them under one ship
 * group. Two reasons: a group can be hidden as a whole, which is what the
 * cutaway of the mantle does, and a group can be turned as a whole, which is
 * what the two counter-rotating rings do.
 *
 * Groups are named by their section id, so a viewer of the object tree, and a
 * test, can find one without holding a reference into the factory.
 */

/** Rotation that lays a cylinder built along +y down along +z, the flight axis. */
export const ALONG_Z = Math.PI / 2;

export function createBuilder(sections) {
  const ship = new THREE.Group();
  ship.name = 'ship';

  const groups = new Map();
  for (const section of sections) {
    const group = new THREE.Group();
    group.name = section.id;
    groups.set(section.id, group);
    ship.add(group);
  }

  /** Every mesh a tap can land on, flat, in the order it was built. */
  const pickables = [];

  function add(sectionId, geometry, material, placement = {}, selection = {}) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(placement.x ?? 0, placement.y ?? 0, placement.z ?? 0);
    mesh.rotation.set(placement.rx ?? 0, placement.ry ?? 0, placement.rz ?? 0);
    mesh.userData = {
      section: sectionId,
      deck: selection.deck ?? null,
      room: selection.room ?? null,
    };
    groups.get(sectionId).add(mesh);
    pickables.push(mesh);
    return mesh;
  }

  return { ship, groups, pickables, add };
}
