import { describe, expect, it } from 'vitest';
import { cacheName, isImmutable, staleCaches, strategyFor, type RequestFacts } from './policy.js';

const SCOPE = 'https://tinkekodira.github.io/g7m/';

function request(over: Partial<RequestFacts> & Pick<RequestFacts, 'url'>): RequestFacts {
  return { method: 'GET', isNavigation: false, ...over };
}

describe('strategyFor', () => {
  it('serves the page network-first, so a deploy is never masked by a cache', () => {
    expect(strategyFor(request({ url: SCOPE, isNavigation: true }), SCOPE)).toBe('network-first');
  });

  it('serves fingerprinted assets cache-first', () => {
    expect(strategyFor(request({ url: `${SCOPE}assets/index-CPghq-kv.js` }), SCOPE)).toBe(
      'cache-first',
    );
  });

  it('leaves Supabase alone', () => {
    // A cached auth response is a signed-in user who cannot sign out.
    expect(
      strategyFor(request({ url: 'https://egtphhmnbnxiohxdnscz.supabase.co/auth/v1/user' }), SCOPE),
    ).toBe('passthrough');
  });

  it('leaves the PowerSync sync stream alone', () => {
    expect(
      strategyFor(
        request({ url: 'https://6a9c806aa77ca1231d25bca7.powersync.journeyapps.com/sync/stream' }),
        SCOPE,
      ),
    ).toBe('passthrough');
  });

  it('leaves every non-GET alone, whatever the URL', () => {
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'HEAD']) {
      expect(strategyFor(request({ url: `${SCOPE}assets/app.js`, method }), SCOPE)).toBe(
        'passthrough',
      );
    }
  });

  it('leaves a navigation to another site alone', () => {
    // Scope is checked before the navigation branch on purpose: an outbound
    // link must not fall back to our shell when the network is down.
    expect(
      strategyFor(request({ url: 'https://supabase.com/docs', isNavigation: true }), SCOPE),
    ).toBe('passthrough');
  });

  it('does not treat a sibling path on the same origin as ours', () => {
    // GitHub Pages hosts every repository under one origin. `/g7m-old/` is
    // somebody else's app as far as this worker is concerned.
    expect(
      strategyFor(request({ url: 'https://tinkekodira.github.io/g7m-old/app.js' }), SCOPE),
    ).toBe('passthrough');
  });

  it('handles the localhost scope the dev server uses', () => {
    const dev = 'http://localhost:5173/';
    expect(strategyFor(request({ url: `${dev}assets/app.js` }), dev)).toBe('cache-first');
  });
});

describe('isImmutable', () => {
  it('trusts fingerprinted assets to be reusable across builds', () => {
    expect(isImmutable('assets/index-CPghq-kv.js')).toBe(true);
    expect(isImmutable('assets/wa-sqlite-async-DCIP8kAx.wasm')).toBe(true);
  });

  it('does not trust the files whose names never change', () => {
    // Fetch these or serve the previous build forever.
    expect(isImmutable('index.html')).toBe(false);
    expect(isImmutable('manifest.webmanifest')).toBe(false);
    expect(isImmutable('icon-512.png')).toBe(false);
  });

  it('is not fooled by a path that merely mentions assets', () => {
    expect(isImmutable('vendor/assets/app.js')).toBe(false);
  });
});

describe('staleCaches', () => {
  it('returns this app\u2019s older caches and nothing else', () => {
    const existing = ['g7m-app-9f2c1a', 'g7m-app-0b7e44', 'workbox-precache', 'powersync-assets'];
    expect(staleCaches(existing, cacheName('9f2c1a'))).toEqual(['g7m-app-0b7e44']);
  });

  it('leaves the current cache alone when it is the only one', () => {
    expect(staleCaches(['g7m-app-9f2c1a'], 'g7m-app-9f2c1a')).toEqual([]);
  });

  it('never proposes deleting a cache it does not own', () => {
    // The whole point: `caches` is shared across the origin.
    expect(staleCaches(['some-library-cache', 'v1'], 'g7m-app-9f2c1a')).toEqual([]);
  });
});
