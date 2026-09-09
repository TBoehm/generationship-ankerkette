import { describe, expect, it, vi } from 'vitest';
import { createDisposalRegistry } from './disposal.js';

describe('createDisposalRegistry', () => {
  it('runs every registered disposer once', () => {
    const registry = createDisposalRegistry();
    const a = vi.fn();
    const b = vi.fn();
    registry.add(a);
    registry.add(b);
    registry.disposeAll();
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });

  it('empties itself, so a second pass disposes nothing twice', () => {
    const registry = createDisposalRegistry();
    const disposer = vi.fn();
    registry.add(disposer);
    registry.disposeAll();
    registry.disposeAll();
    expect(disposer).toHaveBeenCalledTimes(1);
    expect(registry.size()).toBe(0);
  });

  it('reports what it is holding, so a leak is countable', () => {
    const registry = createDisposalRegistry();
    expect(registry.size()).toBe(0);
    registry.add(() => {});
    registry.add(() => {});
    expect(registry.size()).toBe(2);
  });

  it('disposes in reverse order, children before the parents that hold them', () => {
    const order = [];
    const registry = createDisposalRegistry();
    registry.add(() => order.push('first'));
    registry.add(() => order.push('second'));
    registry.disposeAll();
    expect(order).toEqual(['second', 'first']);
  });

  it('keeps going when one disposer throws, a leak must not stop the rest', () => {
    const registry = createDisposalRegistry();
    const after = vi.fn();
    registry.add(after);
    registry.add(() => {
      throw new Error('broken');
    });
    expect(() => registry.disposeAll()).not.toThrow();
    expect(after).toHaveBeenCalledTimes(1);
  });

  it('takes a three.js style object and disposes its geometry and material', () => {
    const registry = createDisposalRegistry();
    const geometry = { dispose: vi.fn() };
    const material = { dispose: vi.fn() };
    registry.track({ geometry, material });
    registry.disposeAll();
    expect(geometry.dispose).toHaveBeenCalledTimes(1);
    expect(material.dispose).toHaveBeenCalledTimes(1);
  });

  it('disposes every material of a multi material mesh', () => {
    const registry = createDisposalRegistry();
    const materials = [{ dispose: vi.fn() }, { dispose: vi.fn() }];
    registry.track({ geometry: { dispose: vi.fn() }, material: materials });
    registry.disposeAll();
    for (const material of materials) expect(material.dispose).toHaveBeenCalledTimes(1);
  });

  it('ignores an object that owns neither, such as a group', () => {
    const registry = createDisposalRegistry();
    expect(() => registry.track({})).not.toThrow();
    expect(() => registry.disposeAll()).not.toThrow();
  });
});
