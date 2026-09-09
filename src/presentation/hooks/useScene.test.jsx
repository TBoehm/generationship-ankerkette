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
    const createStage = vi.fn(() => stage);
    render(<Harness loadStage={async () => ({ createStage })} />);
    await waitFor(() => expect(createStage).toHaveBeenCalledTimes(1));
    expect(stage.start).toHaveBeenCalledTimes(1);
  });

  it('disposes the stage when the component goes away', async () => {
    const stage = makeStage();
    const { unmount } = render(<Harness loadStage={async () => ({ createStage: () => stage })} />);
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
    const createStage = vi.fn(() => stage);
    const gate = deferred();
    const { unmount } = render(
      <Harness
        loadStage={async () => {
          await gate.promise;
          return { createStage };
        }}
      />
    );
    unmount();
    gate.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(createStage).not.toHaveBeenCalled();
    expect(stage.start).not.toHaveBeenCalled();
  });

  it('never leaves two stages alive across a remount', async () => {
    const stages = [];
    const loadStage = async () => ({
      createStage: () => {
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

  it('reports the stage upward once it is running', async () => {
    const stage = makeStage();
    const onReady = vi.fn();
    render(<Harness loadStage={async () => ({ createStage: () => stage })} onReady={onReady} />);
    await waitFor(() => expect(onReady).toHaveBeenCalledWith(stage));
  });

  it('survives a scene module that fails to load', async () => {
    const loadStage = async () => {
      throw new Error('chunk missing');
    };
    expect(() => render(<Harness loadStage={loadStage} />)).not.toThrow();
  });
});
