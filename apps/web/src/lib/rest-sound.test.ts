import { describe, expect, it } from 'vitest';
import { REST_CHIME, playChime, playRestSound, type ChimeContext } from './rest-sound.js';

/** Records what the chime asked the audio graph for. */
function fakeContext(state = 'running') {
  const started: number[] = [];
  const stopped: number[] = [];
  const frequencies: number[] = [];
  let resumed = 0;
  const param = (onSet?: (value: number) => void) => ({
    setValueAtTime: (value: number) => {
      onSet?.(value);
    },
    exponentialRampToValueAtTime: () => undefined,
  });
  const context = {
    currentTime: 10,
    state,
    destination: {} as AudioNode,
    resume: () => {
      resumed += 1;
      return Promise.resolve();
    },
    createOscillator: () =>
      ({
        type: 'sine',
        frequency: param((value) => frequencies.push(value)),
        connect: () => undefined,
        start: (at: number) => started.push(at),
        stop: (at: number) => stopped.push(at),
      }) as unknown as OscillatorNode,
    createGain: () => ({ gain: param(), connect: () => undefined }) as unknown as GainNode,
  } satisfies ChimeContext;
  return { context, started, stopped, frequencies, resumed: () => resumed };
}

describe('playChime', () => {
  it('schedules every note, in order, from now', () => {
    const fake = fakeContext();
    expect(playChime(fake.context)).toBe(true);
    expect(fake.frequencies).toEqual(REST_CHIME.map((note) => note.frequency));
    expect(fake.started).toHaveLength(REST_CHIME.length);
    // Each note after the last, none before the context's own clock.
    fake.started.slice(1).forEach((at, index) => {
      expect(at).toBeGreaterThan(fake.started[index] ?? Number.POSITIVE_INFINITY);
    });
    expect(Math.min(...fake.started)).toBeGreaterThanOrEqual(10);
  });

  it('stops every note it starts, so nothing hums on', () => {
    const fake = fakeContext();
    playChime(fake.context);
    expect(fake.stopped).toHaveLength(fake.started.length);
    fake.stopped.forEach((at, index) => {
      expect(at).toBeGreaterThan(fake.started[index] ?? Number.POSITIVE_INFINITY);
    });
  });

  it('wakes a context the system put to sleep', () => {
    const fake = fakeContext('suspended');
    playChime(fake.context);
    expect(fake.resumed()).toBe(1);
  });

  it('lasts about a second, short of a ringtone', () => {
    const last = REST_CHIME[REST_CHIME.length - 1];
    expect(last === undefined ? 0 : last.at + last.duration).toBeLessThan(1.2);
  });
});

describe('playRestSound', () => {
  it('does nothing, and says so, where there is no Web Audio', () => {
    // Node has no AudioContext: the same as an old WebView without one.
    expect(playRestSound()).toBe(false);
  });
});
