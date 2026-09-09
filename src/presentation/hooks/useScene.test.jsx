import { describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { useRef } from 'react';
import { useScene } from './useScene.js';

function deferred() {
  let resolve;
  const promise = new Promise((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

function makeStage() {
  return {
    start: vi.fn(),
    stop: vi.fn(),
    dispose: vi.fn(),
    resize: vi.fn(),
    onSelect: vi.fn(),
    onFocusSettled: vi.fn(),
    setFocus: vi.fn(),
  };
}

function Harness({ loadStage, onReady }) {
  const hostRef = useRef(null);
  useScene({ hostRef, loadStage, onReady });
  return <div ref={hostRef} data-testid="host" />;
}

describe('useScene', () => {
  it('builds the stage once and starts it', async () => {
    const stage = makeStage();
    const createPresentationStage = vi.fn(() => stage);
    render(<Harness loadStage={async () => ({ createPresentationStage })} />);
    await waitFor(() => expect(createPresentationStage).toHaveBeenCalledTimes(1));
    expect(stage.start).toHaveBeenCalledTimes(1);
  });

  it('disposes the stage when the component goes away', async () => {
    const stage = makeStage();
    const { unmount } = render(
      <Harness loadStage={async () => ({ createPresentationStage: () => stage })} />
    );
    await waitFor(() => expect(stage.start).toHaveBeenCalled());
    unmount();
    expect(stage.dispose).toHaveBeenCalledTimes(1);
  });

  it('never builds a stage whose module arrives after the cleanup', async () => {
    // The strict mode leak: the effect is cleaned up while the dynamic import
    // is still in flight. The cheapest correct answer is not to construct the
    // context at all, because a constructed one is a context the browser counts
    // against its cap even if it is disposed a tick later.
    const stage = makeStage();
    const createPresentationStage = vi.fn(() => stage);
    const gate = deferred();
    const { unmount } = render(
      <Harness
        loadStage={async () => {
          await gate.promise;
          return { createPresentationStage };
        }}
      />
    );
    unmount();
    gate.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(createPresentationStage).not.toHaveBeenCalled();
    expect(stage.start).not.toHaveBeenCalled();
  });

  it('never leaves two stages alive across a remount', async () => {
    const stages = [];
    const loadStage = async () => ({
      createPresentationStage: () => {
        const stage = makeStage();
        stages.push(stage);
        return stage;
      },
    });
    const { unmount } = render(<Harness loadStage={loadStage} />);
    await waitFor(() => expect(stages).toHaveLength(1));
    unmount();
    render(<Harness loadStage={loadStage} />);
    await waitFor(() => expect(stages).toHaveLength(2));
    const alive = stages.filter((s) => s.dispose.mock.calls.length === 0);
    expect(alive).toHaveLength(1);
  });

  it('sizes the stage as soon as it arrives, not only on a later resize', async () => {
    // The observer in the canvas host fires once when it starts observing,
    // which is before the dynamic import resolves. If the stage is not sized
    // here it keeps the renderer default and the view draws into 300 by 150.
    const stage = makeStage();
    render(<Harness loadStage={async () => ({ createPresentationStage: () => stage })} />);
    await waitFor(() => expect(stage.resize).toHaveBeenCalled());
    expect(stage.resize.mock.invocationCallOrder[0]).toBeLessThan(
      stage.start.mock.invocationCallOrder[0]
    );
  });

  it('reports the stage upward once it is running', async () => {
    const stage = makeStage();
    const onReady = vi.fn();
    render(
      <Harness
        loadStage={async () => ({ createPresentationStage: () => stage })}
        onReady={onReady}
      />
    );
    await waitFor(() => expect(onReady).toHaveBeenCalledWith(stage));
  });

  it('survives a scene module that fails to load', async () => {
    const loadStage = async () => {
      throw new Error('chunk missing');
    };
    expect(() => render(<Harness loadStage={loadStage} />)).not.toThrow();
  });
});
