import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { lazyScreen, preloadWhenIdle } from './lazy-screen.js';

/** Stands in for a screen module: `lazy` never renders it here. */
const Screen = () => null;

describe('lazyScreen', () => {
  it('does not load the module until something asks for it', () => {
    const load = vi.fn(() => Promise.resolve({ Screen }));
    lazyScreen(load, 'Screen');
    expect(load).not.toHaveBeenCalled();
  });

  it('loads it when preloaded', async () => {
    const load = vi.fn(() => Promise.resolve({ Screen }));
    lazyScreen(load, 'Screen').preload();
    expect(load).toHaveBeenCalledOnce();
    await vi.waitFor(() => undefined);
  });

  /**
   * A warm-up runs on a phone that may have just lost its connection, and it
   * is asking for something nobody has requested. Rejecting here would be an
   * unhandled rejection over a screen that is not being opened; the real
   * failure, if the screen is opened, surfaces through the crash screen, which
   * knows a missing chunk means "reload".
   */
  it('swallows a failed warm-up rather than crashing the app', async () => {
    const load = vi.fn(() =>
      Promise.reject(new Error('Failed to fetch dynamically imported module')),
    );
    expect(() => {
      lazyScreen(load, 'Screen').preload();
    }).not.toThrow();
    await expect(load()).rejects.toThrow('Failed to fetch');
  });
});

describe('preloadWhenIdle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    Reflect.deleteProperty(globalThis, 'requestIdleCallback');
    Reflect.deleteProperty(globalThis, 'cancelIdleCallback');
  });

  function screenSpy() {
    const load = vi.fn(() => Promise.resolve({ Screen }));
    return { load, screen: lazyScreen(load, 'Screen') };
  }

  /**
   * Safari has no `requestIdleCallback`, and Safari is most of this app's
   * users, so the timeout is the iPhone path rather than a rare fallback.
   */
  it('falls back to a timer where there is no idle callback', () => {
    const first = screenSpy();
    const second = screenSpy();
    preloadWhenIdle([first.screen, second.screen], 2_000);

    expect(first.load).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2_000);
    expect(first.load).toHaveBeenCalledOnce();
    expect(second.load).toHaveBeenCalledOnce();
  });

  it('uses the idle callback where there is one', () => {
    const idle = vi.fn((callback: IdleRequestCallback) => {
      callback({ didTimeout: false, timeRemaining: () => 50 });
      return 7;
    });
    Object.defineProperty(globalThis, 'requestIdleCallback', { value: idle, configurable: true });

    const { load, screen } = screenSpy();
    preloadWhenIdle([screen]);

    expect(idle).toHaveBeenCalledOnce();
    expect(load).toHaveBeenCalledOnce();
  });

  /**
   * Signing out unmounts the routes. A warm-up that fired afterwards would
   * fetch screens for somebody who has left.
   */
  it('can be cancelled before it fires', () => {
    const { load, screen } = screenSpy();
    const cancel = preloadWhenIdle([screen], 2_000);
    cancel();
    vi.advanceTimersByTime(10_000);
    expect(load).not.toHaveBeenCalled();
  });

  it('cancels through the idle callback when it used one', () => {
    const cancelIdle = vi.fn();
    Object.defineProperty(globalThis, 'requestIdleCallback', {
      value: () => 42,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'cancelIdleCallback', {
      value: cancelIdle,
      configurable: true,
    });

    preloadWhenIdle([screenSpy().screen])();
    expect(cancelIdle).toHaveBeenCalledWith(42);
  });
});
