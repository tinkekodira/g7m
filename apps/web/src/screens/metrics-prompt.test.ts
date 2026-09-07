import { describe, expect, it } from 'vitest';
import type { WeightTrend } from '@g7m/core';
import { describeChange, weighInPrompt } from './metrics-prompt.js';

function trend(over: Partial<WeightTrend> = {}): WeightTrend {
  return {
    latestKg: 82,
    startKg: 85,
    endKg: 82,
    changeKg: -3,
    perWeekKg: -0.5,
    spanDays: 42,
    samples: 6,
    ...over,
  };
}

describe('weighInPrompt', () => {
  /**
   * The card is absent while the weight is fresh, not present and reassuring.
   * A banner that says "nothing to do" every day is one people stop reading,
   * and this one still has to work in eight weeks.
   */
  it('says nothing when the weight is fresh', () => {
    expect(weighInPrompt({ state: 'fresh', days: 2 })).toBeNull();
  });

  it('asks for a first weight in terms of what it unlocks', () => {
    const prompt = weighInPrompt({ state: 'never', days: null });
    expect(prompt?.body).toMatch(/pull-ups|trend/i);
    expect(prompt?.tone).toBe('neutral');
  });

  it('is still calm at a week', () => {
    const prompt = weighInPrompt({ state: 'due', days: 8 });
    expect(prompt?.tone).toBe('neutral');
    expect(prompt?.body).toContain('8 days');
  });

  it('escalates once the trend has actually broken', () => {
    expect(weighInPrompt({ state: 'overdue', days: 21 })?.tone).toBe('urgent');
  });

  /**
   * "21 days" is a number to decode; "3 weeks" is the thing being said. The
   * switch happens at a fortnight, where days stop being countable at a glance.
   */
  it('counts in weeks once days stop being readable', () => {
    expect(weighInPrompt({ state: 'overdue', days: 21 })?.body).toContain('3 weeks');
    expect(weighInPrompt({ state: 'due', days: 9 })?.body).toContain('9 days');
  });

  it('does not scold', () => {
    for (const state of ['never', 'due', 'overdue'] as const) {
      const prompt = weighInPrompt({ state, days: 30 });
      expect(prompt?.body).not.toMatch(/should|forgot|failed|missed/i);
    }
  });
});

describe('describeChange', () => {
  it('has nothing to say about a single reading', () => {
    expect(describeChange(trend({ samples: 1 }), 'metric')).toBeNull();
    expect(describeChange(null, 'metric')).toBeNull();
  });

  it('states the direction, the size and the rate', () => {
    expect(describeChange(trend(), 'metric')).toBe(
      'Down 3.0 kg over 6 weeks — about 0.5 kg a week.',
    );
  });

  it('counts up as well as down', () => {
    const gaining = trend({ changeKg: 2.1, perWeekKg: 0.35 });
    expect(describeChange(gaining, 'metric')).toMatch(/^Up 2\.1 kg/);
  });

  /**
   * Calling a 200 g swing a loss teaches somebody to read noise as progress,
   * which is the habit that makes them quit in week three.
   */
  it('calls a small change what it is, which is nothing', () => {
    const flat = trend({ changeKg: -0.2, perWeekKg: -0.03 });
    expect(describeChange(flat, 'metric')).toBe('Holding steady over 6 weeks.');
  });

  it('refuses to state a rate it does not have', () => {
    const short = trend({ spanDays: 10, changeKg: -1.5, perWeekKg: null });
    expect(describeChange(short, 'metric')).toBe(
      'Down 1.5 kg over 10 days — too soon to call a rate.',
    );
  });

  it('speaks pounds to an imperial user', () => {
    const sentence = describeChange(trend(), 'imperial');
    expect(sentence).toContain('lb');
    expect(sentence).not.toContain('kg');
  });

  /**
   * There is no goal yet, so there is no such thing as the right direction.
   * Praising a loss would be guessing at somebody who is trying to bulk.
   */
  it('passes no judgement on the direction', () => {
    for (const change of [-3, 3]) {
      const sentence = describeChange(trend({ changeKg: change }), 'metric');
      expect(sentence).not.toMatch(/good|great|well done|careful|worry/i);
    }
  });
});
