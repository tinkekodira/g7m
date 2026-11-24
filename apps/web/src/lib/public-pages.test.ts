import { describe, expect, it } from 'vitest';
import { PUBLIC_PAGE_HREF, publicPageFor } from './public-pages.js';

describe('publicPageFor', () => {
  it('finds both pages by the links the app and the stores use', () => {
    expect(publicPageFor(PUBLIC_PAGE_HREF.privacy)).toBe('privacy');
    expect(publicPageFor(PUBLIC_PAGE_HREF['delete-account'])).toBe('delete-account');
  });

  it('allows a trailing slash and a query, which people and stores add', () => {
    expect(publicPageFor('#/privacy/')).toBe('privacy');
    expect(publicPageFor('#/delete-account?utm_source=play')).toBe('delete-account');
  });

  it('leaves every other address to the app', () => {
    expect(publicPageFor('')).toBeNull();
    expect(publicPageFor('#/')).toBeNull();
    expect(publicPageFor('#/settings')).toBeNull();
    expect(publicPageFor('#/privacy-settings')).toBeNull();
    expect(publicPageFor('#/settings/privacy')).toBeNull();
  });

  it('never claims an auth callback, which arrives in the same fragment (ADR-0034)', () => {
    expect(publicPageFor('#access_token=abc&type=recovery')).toBeNull();
    expect(publicPageFor('#error=access_denied')).toBeNull();
  });
});
