import { describe, expect, it } from 'vitest';
import { TABS, tabFor } from './navigation.js';

describe('TABS', () => {
  it('runs Learn, Friends, Home, Profile, Settings, with Home in the middle', () => {
    expect(TABS.map((tab) => tab.id)).toEqual(['learn', 'friends', 'home', 'profile', 'settings']);
  });

  it('has no Progress tab: Progress is a tile on Home', () => {
    expect(TABS.map((tab) => tab.id)).not.toContain('progress');
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
    expect(tabFor('/friends')).toBe('friends');
    expect(tabFor('/profile')).toBe('profile');
    expect(tabFor('/settings')).toBe('settings');
  });

  it('lights the tab a deeper screen belongs under', () => {
    expect(tabFor('/friends/abc')).toBe('friends');
    expect(tabFor('/friends/abc/session/def')).toBe('friends');
    expect(tabFor('/exercises')).toBe('learn');
    expect(tabFor('/exercises/barbell-bench-press')).toBe('learn');
    expect(tabFor('/you')).toBe('profile');
    expect(tabFor('/goal')).toBe('profile');
    expect(tabFor('/achievements')).toBe('profile');
    expect(tabFor('/plan')).toBe('home');
    expect(tabFor('/calendar')).toBe('home');
  });

  it('lights Home for Progress and everything under it, since Home is where it is opened', () => {
    expect(tabFor('/progress')).toBe('home');
    expect(tabFor('/progress/session/abc')).toBe('home');
    expect(tabFor('/progress/exercise/abc')).toBe('home');
  });

  /** The logger is somewhere you are in, not somewhere you pass through. */
  it('has no tab for the workout itself', () => {
    expect(tabFor('/workout')).toBeNull();
    expect(tabFor('/workout/')).toBeNull();
  });

  it('does not mistake a longer word for a section', () => {
    expect(tabFor('/friendship')).toBe('home');
    expect(tabFor('/youth')).toBe('home');
    expect(tabFor('/workouts')).toBe('home');
  });

  it('ignores a trailing slash, and sends anything unknown home', () => {
    expect(tabFor('/friends/')).toBe('friends');
    expect(tabFor('')).toBe('home');
    expect(tabFor('/nowhere')).toBe('home');
  });
});
