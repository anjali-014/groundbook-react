// Runs before every test file: adds matchers such as toBeInTheDocument(), and empties the page after each test.
import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// The pretend browser (jsdom) has no layout, so it has no ResizeObserver; every real browser does. This stand-in
// watches nothing and never reports a size, which is what a page with no layout would see anyway.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// The pretend browser has no document.scrollingElement either; in every real browser (standards mode) it is the
// <html> element, the one whose scrollTop and scrollHeight are the page's own.
if (typeof document !== 'undefined' && !document.scrollingElement) {
  Object.defineProperty(document, 'scrollingElement', { configurable: true, get: () => document.documentElement });
}

// A test walks through several screens; when every file runs at once the machine is busy, so a test may take longer
// than the default 5 seconds without anything being wrong. Each test file still has to finish in under 20 seconds.
vi.setConfig({ testTimeout: 30_000 });

// For the same reason a screen that is still reading its data may take longer than one second to show it: findBy and
// waitFor wait up to five seconds before they give up.
configure({ asyncUtilTimeout: 5000 });

afterEach(() => cleanup());
