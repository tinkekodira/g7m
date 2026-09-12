import { describe, expect, it } from 'vitest';
import { TABS, tabFor } from './navigation.js';

describe('TABS', () => {
  it('puts Home in the middle, with Profile beside it and Settings on the bar', () => {
    const ids = TABS.map((tab) => tab.id);
    expect(ids).toHaveLength(5);
    expect(ids[2]).toBe('home');
    expect(ids[3]).toBe('profile');
    expect(ids).toContain('settings');
    expect(ids).toContain('progress');
  });

  it('gives every tab a path the router knows how to find', () => {
    for (const tab of TABS) {
      expect(tab.path.startsWith('/')).toBe(true);
      expect(tabFor(tab.path)).toBe(tab.id);
    }
  });
});

describe('tabFor', () => {
  it('lights each tab on its own screen', () => {
    expect(tabFor('/')).toBe('home');
    expect(tabFor('/learn')).toBe('learn');
    expect(tabFor('/progress')).toBe('progress');
    expect(tabFor('/profile')).toBe('profile');
    expect(tabFor('/settings')).toBe('settings');
  });

  it('lights the tab a deeper screen belongs under', () => {
    expect(tabFor('/progress/session/abc')).toBe('progress');
    expect(tabFor('/progress/exercise/abc')).toBe('progress');
    expect(tabFor('/exercises')).toBe('learn');
    expect(tabFor('/exercises/barbell-bench-press')).toBe('learn');
    expect(tabFor('/you')).toBe('profile');
    expect(tabFor('/goal')).toBe('profile');
    expect(tabFor('/plan')).toBe('home');
  });

  /** The logger is somewhere you are in, not somewhere you pass through. */
  it('has no tab for the workout itself', () => {
    expect(tabFor('/workout')).toBeNull();
    expect(tabFor('/workout/')).toBeNull();
  });

  it('does not mistake a longer word for a section', () => {
    expect(tabFor('/progressive')).toBe('home');
    expect(tabFor('/youth')).toBe('home');
    expect(tabFor('/workouts')).toBe('home');
  });

  it('ignores a trailing slash, and sends anything unknown home', () => {
    expect(tabFor('/progress/')).toBe('progress');
    expect(tabFor('')).toBe('home');
    expect(tabFor('/nowhere')).toBe('home');
  });
});
