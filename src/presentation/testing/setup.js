import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

/**
 * jsdom has no ResizeObserver, and the canvas host uses one to keep the
 * renderer in step with its box. A stub is enough: the suite never lays
 * anything out, it only needs the constructor to exist.
 */
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

afterEach(cleanup);
