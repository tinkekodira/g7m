import { describe, expect, it } from 'vitest';
import { createWakeLockController, type WakeLockHandle } from './wake-lock.js';

interface FakeHandle extends WakeLockHandle {
  readonly releases: () => number;
  /** What the browser does by itself when the page goes away. */
  readonly releaseFromOutside: () => void;
}

function fakeHandle(): FakeHandle {
  let released = 0;
  const listeners: (() => void)[] = [];
  return {
    releases: () => released,
    release: () => {
      released += 1;
      for (const listener of listeners) listener();
      return Promise.resolve();
    },
    addEventListener: (_type, listener) => {
      listeners.push(listener);
    },
    releaseFromOutside: () => {
      for (const listener of listeners) listener();
    },
  };
}

/** A request whose answer is handed over on demand, so late arrivals are testable. */
function deferredRequest() {
  const pending: ((handle: WakeLockHandle | null) => void)[] = [];
  let asked = 0;
  return {
    asked: () => asked,
    request: () => {
      asked += 1;
      return new Promise<WakeLockHandle | null>((resolve) => {
        pending.push(resolve);
      });
    },
    settle: async (handle: WakeLockHandle | null): Promise<void> => {
      pending.shift()?.(handle);
      // Let the controller's own `.then` run before anything is asserted.
      await Promise.resolve();
      await Promise.resolve();
    },
  };
}

describe('createWakeLockController', () => {
  it('asks for the lock only once something wants it', async () => {
    const requests = deferredRequest();
    const controller = createWakeLockController(requests.request);
    expect(requests.asked()).toBe(0);

    controller.setActive(true);
    await requests.settle(fakeHandle());
    expect(requests.asked()).toBe(1);
    expect(controller.held()).toBe(true);
  });

  it('gives it back when nothing wants it any more', async () => {
    const requests = deferredRequest();
    const handle = fakeHandle();
    const controller = createWakeLockController(requests.request);

    controller.setActive(true);
    await requests.settle(handle);
    controller.setActive(false);
    expect(handle.releases()).toBe(1);
    expect(controller.held()).toBe(false);
  });

  it('holds one lock, not one per state change', async () => {
    const requests = deferredRequest();
    const controller = createWakeLockController(requests.request);

    controller.setActive(true);
    controller.setActive(true);
    controller.setVisible(true);
    await requests.settle(fakeHandle());
    expect(requests.asked()).toBe(1);
  });

  /**
   * The bug this file exists for. The browser takes the lock back whenever the
   * page is hidden and does not give it back, so a controller that asks once
   * works until the first phone call and never again.
   */
  it('asks again after the page comes back', async () => {
    const requests = deferredRequest();
    const first = fakeHandle();
    const controller = createWakeLockController(requests.request);

    controller.setActive(true);
    await requests.settle(first);

    controller.setVisible(false);
    expect(first.releases()).toBe(1);

    controller.setVisible(true);
    await requests.settle(fakeHandle());
    expect(requests.asked()).toBe(2);
    expect(controller.held()).toBe(true);
  });

  it('asks again after the browser drops the lock on its own', async () => {
    const requests = deferredRequest();
    const dropped = fakeHandle();
    const controller = createWakeLockController(requests.request);

    controller.setActive(true);
    await requests.settle(dropped);

    // No visibility event, just the sentinel going away underneath.
    dropped.releaseFromOutside();
    expect(controller.held()).toBe(false);

    controller.setVisible(false);
    controller.setVisible(true);
    await requests.settle(fakeHandle());
    expect(requests.asked()).toBe(2);
  });

  /**
   * The other one. `request()` is async, so a lock can arrive for a workout
   * that has already finished — and a lock nobody released keeps the screen
   * lit until the battery is flat.
   */
  it('hands back a lock that arrives after the workout ended', async () => {
    const requests = deferredRequest();
    const late = fakeHandle();
    const controller = createWakeLockController(requests.request);

    controller.setActive(true);
    controller.setActive(false);
    await requests.settle(late);

    expect(late.releases()).toBe(1);
    expect(controller.held()).toBe(false);
  });

  it('hands back a lock that arrives after the page was hidden', async () => {
    const requests = deferredRequest();
    const late = fakeHandle();
    const controller = createWakeLockController(requests.request);

    controller.setActive(true);
    controller.setVisible(false);
    await requests.settle(late);

    expect(late.releases()).toBe(1);
  });

  it('hands back a lock that arrives after disposal', async () => {
    const requests = deferredRequest();
    const late = fakeHandle();
    const controller = createWakeLockController(requests.request);

    controller.setActive(true);
    controller.dispose();
    await requests.settle(late);

    expect(late.releases()).toBe(1);
  });

  it('treats a refusal as routine and carries on', async () => {
    const requests = deferredRequest();
    const controller = createWakeLockController(requests.request);

    // Refused: a low battery, or a page the browser did not think was visible.
    controller.setActive(true);
    await requests.settle(null);
    expect(controller.held()).toBe(false);

    // And it asks again on the next thing that could have changed the answer.
    controller.setVisible(false);
    controller.setVisible(true);
    await requests.settle(fakeHandle());
    expect(controller.held()).toBe(true);
  });

  it('survives a request that rejects', async () => {
    const controller = createWakeLockController(() => Promise.reject(new Error('denied')));
    controller.setActive(true);
    await Promise.resolve();
    await Promise.resolve();
    expect(controller.held()).toBe(false);
  });

  it('releases on disposal and stops asking', async () => {
    const requests = deferredRequest();
    const handle = fakeHandle();
    const controller = createWakeLockController(requests.request);

    controller.setActive(true);
    await requests.settle(handle);
    controller.dispose();

    expect(handle.releases()).toBe(1);
    controller.setActive(false);
    controller.setActive(true);
    expect(requests.asked()).toBe(1);
  });
});
