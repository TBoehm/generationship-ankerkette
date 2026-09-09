import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createStage } from './stage.js';
import { TRANSITION_DURATION_MS } from '../../domain/usecases/viewTransition.js';

function makeRenderer() {
  return {
    domElement: document.createElement('canvas'),
    render: vi.fn(),
    clear: vi.fn(),
    clearDepth: vi.fn(),
    setSize: vi.fn(),
    setViewport: vi.fn(),
    dispose: vi.fn(),
    autoClear: true,
  };
}

function makeScene(name) {
  return {
    name,
    root: { name: `${name}-root` },
    camera: { name: `${name}-camera`, aspect: 1, updateProjectionMatrix: vi.fn() },
    setOpacity: vi.fn(),
    update: vi.fn(),
    handleDrag: vi.fn(),
    handleZoom: vi.fn(),
    handleTap: vi.fn(),
    resize: vi.fn(),
    dispose: vi.fn(),
  };
}

function setup(options = {}) {
  const renderer = makeRenderer();
  const ship = makeScene('ship');
  const flight = makeScene('flight');
  const created = { renderer: 0, ship: 0, flight: 0 };
  const stage = createStage({
    host: document.createElement('div'),
    createRenderer: () => {
      created.renderer += 1;
      return renderer;
    },
    createShipScene: () => {
      created.ship += 1;
      return ship;
    },
    createFlightScene: () => {
      created.flight += 1;
      return flight;
    },
    reducedMotion: false,
    ...options,
  });
  return { stage, renderer, ship, flight, created };
}

describe('createStage', () => {
  let ctx;
  beforeEach(() => {
    ctx = setup();
  });

  it('creates exactly one renderer and one of each scene', () => {
    expect(ctx.created).toEqual({ renderer: 1, ship: 1, flight: 1 });
  });

  it('mounts the single canvas into the host', () => {
    expect(ctx.renderer.domElement.parentElement).not.toBeNull();
  });

  it('turns off automatic clearing, the two passes clear by hand', () => {
    expect(ctx.renderer.autoClear).toBe(false);
  });

  it('starts on the flight side', () => {
    expect(ctx.stage.focus()).toBe('flight');
  });
});

describe('step', () => {
  it('draws only the flight while at rest on the flight side', () => {
    const { stage, renderer, ship, flight } = setup();
    stage.step(0);
    expect(renderer.render).toHaveBeenCalledTimes(1);
    expect(renderer.render).toHaveBeenCalledWith(flight.root, flight.camera);
    expect(renderer.render).not.toHaveBeenCalledWith(ship.root, ship.camera);
  });

  it('never updates the scene it is not drawing, which is the whole idle budget', () => {
    const { stage, ship, flight } = setup();
    stage.step(0);
    stage.step(16);
    stage.step(32);
    expect(flight.update).toHaveBeenCalled();
    expect(ship.update).not.toHaveBeenCalled();
  });

  it('clears once per frame and separates the two passes with a depth clear', () => {
    const { stage, renderer } = setup();
    stage.setFocus('ship');
    stage.step(0);
    // The first frame still sits at progress zero, so it draws the journey
    // alone. Only the second frame, mid transition, draws both.
    expect(renderer.render).toHaveBeenCalledTimes(1);
    stage.step(TRANSITION_DURATION_MS / 2);
    expect(renderer.render).toHaveBeenCalledTimes(3);
    expect(renderer.clear).toHaveBeenCalledTimes(2);
    expect(renderer.clearDepth).toHaveBeenCalledTimes(2);
  });

  it('draws the journey before the ship, so the ship is never behind the stars', () => {
    const { stage, renderer, ship, flight } = setup();
    stage.setFocus('ship');
    stage.step(0);
    stage.step(TRANSITION_DURATION_MS / 2);
    const order = renderer.render.mock.calls.map((call) => call[0].name);
    expect(order.slice(-2)).toEqual(['flight-root', 'ship-root']);
    expect(flight.root.name).toBe('flight-root');
    expect(ship.root.name).toBe('ship-root');
  });

  it('settles on the ship alone once the transition has run out', () => {
    const { stage, renderer, ship, flight } = setup();
    stage.setFocus('ship');
    stage.step(0);
    stage.step(TRANSITION_DURATION_MS + 1);
    renderer.render.mockClear();
    flight.update.mockClear();
    stage.step(TRANSITION_DURATION_MS + 100);
    expect(renderer.render).toHaveBeenCalledTimes(1);
    expect(renderer.render).toHaveBeenCalledWith(ship.root, ship.camera);
    expect(flight.update).not.toHaveBeenCalled();
  });

  it('hands the opacity to both scenes so the crossfade is theirs to apply', () => {
    const { stage, ship, flight } = setup();
    stage.setFocus('ship');
    stage.step(0);
    stage.step(TRANSITION_DURATION_MS / 2);
    expect(ship.setOpacity).toHaveBeenCalled();
    expect(flight.setOpacity).toHaveBeenCalled();
    const shipOpacity = ship.setOpacity.mock.calls.at(-1)[0];
    const flightOpacity = flight.setOpacity.mock.calls.at(-1)[0];
    expect(shipOpacity + flightOpacity).toBeCloseTo(1, 9);
  });

  it('reports a frame delta to the scene rather than letting it read a clock', () => {
    const { stage, flight } = setup();
    stage.step(1000);
    stage.step(1016);
    expect(flight.update.mock.calls.at(-1)[0]).toBeCloseTo(16, 6);
  });

  it('survives a backwards timestamp without a negative delta', () => {
    const { stage, flight } = setup();
    stage.step(1000);
    stage.step(500);
    expect(flight.update.mock.calls.at(-1)[0]).toBeGreaterThanOrEqual(0);
  });

  it('jumps the transition when the viewer asked for reduced motion', () => {
    const { stage, renderer, ship } = setup({ reducedMotion: true });
    stage.setFocus('ship');
    stage.step(0);
    expect(renderer.render).toHaveBeenCalledTimes(1);
    expect(renderer.render).toHaveBeenCalledWith(ship.root, ship.camera);
  });
});

describe('input routing', () => {
  it('sends a drag to the scene that currently owns the input', () => {
    const { stage, ship, flight } = setup();
    stage.step(0);
    stage.handleDrag(10, 5);
    expect(flight.handleDrag).toHaveBeenCalledWith(10, 5);
    expect(ship.handleDrag).not.toHaveBeenCalled();
  });

  it('moves the input across with the focus', () => {
    const { stage, ship, flight } = setup({ reducedMotion: true });
    stage.setFocus('ship');
    stage.step(0);
    stage.handleDrag(10, 5);
    expect(ship.handleDrag).toHaveBeenCalledWith(10, 5);
    expect(flight.handleDrag).not.toHaveBeenCalled();
  });

  it('keeps accepting input during the transition, it never blocks', () => {
    const { stage, ship, flight } = setup();
    stage.setFocus('ship');
    stage.step(0);
    stage.step(TRANSITION_DURATION_MS / 2);
    stage.handleDrag(1, 1);
    const handled = ship.handleDrag.mock.calls.length + flight.handleDrag.mock.calls.length;
    expect(handled).toBe(1);
  });
});

describe('resize', () => {
  it('sizes the one renderer and both cameras', () => {
    const { stage, renderer, ship, flight } = setup();
    stage.resize(800, 600);
    expect(renderer.setSize).toHaveBeenCalledWith(800, 600);
    expect(ship.resize).toHaveBeenCalledWith(800, 600);
    expect(flight.resize).toHaveBeenCalledWith(800, 600);
  });

  it('ignores a zero sized host instead of dividing by zero', () => {
    const { stage, renderer } = setup();
    stage.resize(0, 0);
    expect(renderer.setSize).not.toHaveBeenCalled();
  });
});

describe('dispose', () => {
  it('disposes both scenes and the renderer', () => {
    const { stage, renderer, ship, flight } = setup();
    stage.dispose();
    expect(ship.dispose).toHaveBeenCalledTimes(1);
    expect(flight.dispose).toHaveBeenCalledTimes(1);
    expect(renderer.dispose).toHaveBeenCalledTimes(1);
  });

  it('takes the canvas back out of the document', () => {
    const { stage, renderer } = setup();
    stage.dispose();
    expect(renderer.domElement.parentElement).toBeNull();
  });

  it('stops drawing after disposal, however often it is stepped', () => {
    const { stage, renderer } = setup();
    stage.dispose();
    renderer.render.mockClear();
    stage.step(0);
    stage.step(100);
    expect(renderer.render).not.toHaveBeenCalled();
  });

  it('is safe to call twice', () => {
    const { stage, renderer } = setup();
    stage.dispose();
    stage.dispose();
    expect(renderer.dispose).toHaveBeenCalledTimes(1);
  });
});
