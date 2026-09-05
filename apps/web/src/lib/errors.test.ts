import { describe, expect, it, vi } from 'vitest';
import {
  describeDataError,
  isClockSkewError,
  isTransient,
  retryOnceIfTransient,
} from './errors.js';

describe('isClockSkewError', () => {
  it('recognises the message an iPhone with a fast clock produces', () => {
    expect(isClockSkewError('JWT issued at future')).toBe(true);
  });

  it('recognises the other wordings the same fault produces', () => {
    expect(isClockSkewError('Token used before issued')).toBe(true);
    expect(isClockSkewError('token used too early')).toBe(true);
  });

  it('does not claim an expired token is clock skew', () => {
    expect(isClockSkewError('JWT expired')).toBe(false);
  });
});

describe('describeDataError', () => {
  it('tells the user where the date setting actually is', () => {
    const message = describeDataError('JWT issued at future');
    expect(message).toContain('Date & Time');
    expect(message).not.toContain('JWT');
  });

  it('gives an expired session an action, not a diagnosis', () => {
    expect(describeDataError('JWT expired')).toContain('Sign out and back in');
  });

  it('reassures an offline user that their sets are not lost', () => {
    // The whole premise of the app is working in a basement, so this message
    // has to say the data is safe rather than sounding like a failure.
    expect(describeDataError('Failed to fetch')).toContain('saved on this device');
  });

  it('passes an unrecognised message through rather than swallowing it', () => {
    expect(describeDataError('something entirely new')).toBe('something entirely new');
  });

  it('is case insensitive, because wording varies by endpoint', () => {
    expect(describeDataError('jwt EXPIRED')).toContain('Sign out');
  });
});

describe('isTransient', () => {
  it.each(['JWT issued at future', 'Failed to fetch', 'NetworkError', 'gateway 502'])(
    'treats %s as worth retrying',
    (m) => {
      expect(isTransient(m)).toBe(true);
    },
  );

  it.each(['permission denied for table routines', 'JWT expired'])(
    'does not retry %s, which would just make the user wait twice',
    (m) => {
      expect(isTransient(m)).toBe(false);
    },
  );
});

describe('retryOnceIfTransient', () => {
  const sleep = () => Promise.resolve();

  it('does not retry a successful call', async () => {
    const run = vi.fn(() => Promise.resolve({ error: null, data: 'ok' }));
    const result = await retryOnceIfTransient(run, 0, sleep);
    expect(run).toHaveBeenCalledOnce();
    expect(result.data).toBe('ok');
  });

  it('retries once when the failure is transient', async () => {
    const run = vi
      .fn<() => Promise<{ error: { message: string } | null; data: string }>>()
      .mockResolvedValueOnce({ error: { message: 'JWT issued at future' }, data: '' })
      .mockResolvedValueOnce({ error: null, data: 'ok' });
    const result = await retryOnceIfTransient(run, 0, sleep);
    expect(run).toHaveBeenCalledTimes(2);
    expect(result.error).toBeNull();
  });

  it('does not retry a permission error', async () => {
    const run = vi.fn(() => Promise.resolve({ error: { message: 'permission denied' }, data: '' }));
    await retryOnceIfTransient(run, 0, sleep);
    expect(run).toHaveBeenCalledOnce();
  });

  it('gives up after exactly one retry rather than looping', async () => {
    const run = vi.fn(() => Promise.resolve({ error: { message: 'Failed to fetch' }, data: '' }));
    const result = await retryOnceIfTransient(run, 0, sleep);
    expect(run).toHaveBeenCalledTimes(2);
    expect(result.error?.message).toBe('Failed to fetch');
  });
});
