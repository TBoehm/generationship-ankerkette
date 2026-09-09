import { describe, expect, it } from 'vitest';
import { createDisposalRegistry } from '../disposal.js';
import { ROOM_COLORS } from '../palette.js';
import { DIM_FACTOR, DIM_OPACITY, applyHighlight, applyOpacity } from './highlight.js';
import { createResources } from './resources.js';

function makeMesh(resources, userData, opacity = 1) {
  const material = resources.material(ROOM_COLORS.quarters, { opacity });
  return { material, userData: { section: null, deck: null, room: null, ...userData } };
}

function setup() {
  const resources = createResources(createDisposalRegistry());
  const meshes = {
    reactor: makeMesh(resources, { section: 'reactor' }),
    ringWall: makeMesh(resources, { section: 'ringA', deck: 1 }),
    deckOneRoom: makeMesh(resources, { section: 'ringA', deck: 1, room: 'canteen' }),
    deckTwoRoom: makeMesh(resources, { section: 'ringA', deck: 2, room: 'park' }),
    ringStructure: makeMesh(resources, { section: 'ringA' }),
    glass: makeMesh(resources, { section: 'habitatMantle' }, 0.13),
  };
  return { resources, meshes, all: Object.values(meshes) };
}

const NOTHING = { section: null, deck: null, room: null };

describe('applyHighlight', () => {
  it('leaves every colour alone while nothing is selected', () => {
    const { all } = setup();
    applyHighlight(all, NOTHING);
    for (const mesh of all) {
      expect(mesh.material.color.getHex()).toBe(mesh.material.userData.baseColor.getHex());
      expect(mesh.material.userData.dim).toBe(1);
    }
  });

  it('dims everything outside the selected section', () => {
    const { meshes } = setup();
    applyHighlight(Object.values(meshes), { ...NOTHING, section: 'reactor' });
    expect(meshes.reactor.material.userData.dim).toBe(1);
    expect(meshes.ringWall.material.userData.dim).toBe(DIM_OPACITY);
    expect(meshes.ringWall.material.color.r).toBeCloseTo(
      meshes.ringWall.material.userData.baseColor.r * DIM_FACTOR,
      9
    );
  });

  it('keeps the untagged structure of a ring lit when a deck is chosen', () => {
    const { meshes } = setup();
    applyHighlight(Object.values(meshes), { section: 'ringA', deck: 2, room: null });
    expect(meshes.ringStructure.material.userData.dim).toBe(1);
    expect(meshes.deckTwoRoom.material.userData.dim).toBe(1);
    expect(meshes.deckOneRoom.material.userData.dim).toBe(DIM_OPACITY);
  });

  it('lights the whole ring when no deck is chosen', () => {
    const { meshes } = setup();
    applyHighlight(Object.values(meshes), { section: 'ringA', deck: null, room: null });
    expect(meshes.deckOneRoom.material.userData.dim).toBe(1);
    expect(meshes.deckTwoRoom.material.userData.dim).toBe(1);
    expect(meshes.reactor.material.userData.dim).toBe(DIM_OPACITY);
  });

  it('makes only the selected room glow', () => {
    const { meshes } = setup();
    applyHighlight(Object.values(meshes), { section: 'ringA', deck: 2, room: 'park' });
    expect(meshes.deckTwoRoom.material.emissive.getHex()).toBeGreaterThan(0);
    expect(meshes.deckOneRoom.material.emissive.getHex()).toBe(0);
    expect(meshes.reactor.material.emissive.getHex()).toBe(0);
  });

  it('takes the glow back when the room is deselected', () => {
    const { meshes, all } = setup();
    applyHighlight(all, { section: 'ringA', deck: 2, room: 'park' });
    applyHighlight(all, NOTHING);
    expect(meshes.deckTwoRoom.material.emissive.getHex()).toBe(0);
  });

  it('is idempotent, so repeating it never darkens twice', () => {
    const { meshes, all } = setup();
    const selection = { ...NOTHING, section: 'reactor' };
    applyHighlight(all, selection);
    const once = meshes.ringWall.material.color.getHex();
    applyHighlight(all, selection);
    applyHighlight(all, selection);
    expect(meshes.ringWall.material.color.getHex()).toBe(once);
  });
});

describe('applyOpacity', () => {
  it('scales every material by its own base opacity', () => {
    const { resources, meshes } = setup();
    applyOpacity(resources.materials, 1);
    expect(meshes.reactor.material.opacity).toBe(1);
    expect(meshes.glass.material.opacity).toBeCloseTo(0.13, 12);
  });

  it('takes the whole scene to nothing at zero', () => {
    const { resources, all } = setup();
    applyOpacity(resources.materials, 0);
    for (const mesh of all) expect(mesh.material.opacity).toBe(0);
  });

  it('multiplies the fade with the selection instead of replacing it', () => {
    const { resources, meshes, all } = setup();
    applyHighlight(all, { ...NOTHING, section: 'reactor' });
    applyOpacity(resources.materials, 0.5);
    expect(meshes.reactor.material.opacity).toBe(0.5);
    expect(meshes.ringWall.material.opacity).toBeCloseTo(0.5 * DIM_OPACITY, 12);
  });
});
