import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { createDisposalRegistry } from '../disposal.js';
import { SECTION_COLORS } from '../palette.js';
import { createResources, shade, tint } from './resources.js';

describe('shade', () => {
  it('keeps the hue and takes the light away', () => {
    const base = new THREE.Color(SECTION_COLORS.water);
    const darker = shade(SECTION_COLORS.water, 0.5);
    expect(darker.r).toBeCloseTo(base.r * 0.5, 9);
    expect(darker.g).toBeCloseTo(base.g * 0.5, 9);
    expect(darker.b).toBeCloseTo(base.b * 0.5, 9);
  });

  it('leaves the colour untouched at a factor of one', () => {
    expect(shade(SECTION_COLORS.water, 1).getHex()).toBe(SECTION_COLORS.water);
  });

  it('does not modify the palette entry it was given', () => {
    const before = SECTION_COLORS.water;
    shade(SECTION_COLORS.water, 0.1);
    tint(SECTION_COLORS.water, 0.9);
    expect(SECTION_COLORS.water).toBe(before);
  });
});

describe('tint', () => {
  it('moves the colour towards white', () => {
    const base = new THREE.Color(SECTION_COLORS.propulsion);
    const lighter = tint(SECTION_COLORS.propulsion, 0.5);
    expect(lighter.r).toBeGreaterThan(base.r);
    expect(lighter.g).toBeGreaterThan(base.g);
    expect(lighter.b).toBeGreaterThan(base.b);
  });

  it('reaches white at one and stays put at zero', () => {
    const white = new THREE.Color(1, 1, 1).getHex();
    expect(tint(SECTION_COLORS.propulsion, 1).getHex()).toBe(white);
    expect(tint(SECTION_COLORS.propulsion, 0).getHex()).toBe(SECTION_COLORS.propulsion);
  });
});

describe('createResources', () => {
  it('registers one disposer per geometry', () => {
    const registry = createDisposalRegistry();
    const resources = createResources(registry);
    resources.geometry(new THREE.BoxGeometry(1, 1, 1));
    resources.geometry(new THREE.BoxGeometry(2, 2, 2));
    expect(registry.size()).toBe(2);
  });

  it('registers one disposer per material and collects it for the fade', () => {
    const registry = createDisposalRegistry();
    const resources = createResources(registry);
    resources.material(SECTION_COLORS.hull);
    resources.pointsMaterial(SECTION_COLORS.ice);
    expect(registry.size()).toBe(2);
    expect(resources.materials).toHaveLength(2);
  });

  it('makes every material fadeable and remembers what it started as', () => {
    const resources = createResources(createDisposalRegistry());
    const material = resources.material(SECTION_COLORS.hull, { opacity: 0.4 });
    expect(material.transparent).toBe(true);
    expect(material.opacity).toBe(0.4);
    expect(material.userData.baseOpacity).toBe(0.4);
    expect(material.userData.baseColor.getHex()).toBe(SECTION_COLORS.hull);
    expect(material.userData.dim).toBe(1);
  });

  it('actually disposes what it registered', () => {
    const registry = createDisposalRegistry();
    const resources = createResources(registry);
    const geometry = resources.geometry(new THREE.BoxGeometry(1, 1, 1));
    const material = resources.material(SECTION_COLORS.hull);
    const geometrySpy = vi.spyOn(geometry, 'dispose');
    const materialSpy = vi.spyOn(material, 'dispose');
    registry.disposeAll();
    expect(geometrySpy).toHaveBeenCalledTimes(1);
    expect(materialSpy).toHaveBeenCalledTimes(1);
    expect(registry.size()).toBe(0);
  });
});
