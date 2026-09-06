import { describe, expect, it } from 'vitest';
import {
  readBoolean,
  readDate,
  readEnum,
  readJson,
  readNumber,
  readOptionalNumber,
  readOptionalString,
  readRequiredDate,
  readString,
  readStringArray,
  writeBoolean,
  writeStringArray,
} from './rows.js';

describe('readString', () => {
  it('reads a string', () => {
    expect(readString({ a: 'x' }, 'a', 'fallback')).toBe('x');
  });

  it('falls back for null, undefined and the wrong type', () => {
    expect(readString({ a: null }, 'a', 'fallback')).toBe('fallback');
    expect(readString({}, 'a', 'fallback')).toBe('fallback');
    expect(readString({ a: 7 }, 'a', 'fallback')).toBe('fallback');
  });

  it('keeps an empty string, which is a legitimate value', () => {
    expect(readString({ a: '' }, 'a', 'fallback')).toBe('');
  });
});

describe('readOptionalString', () => {
  it('is null for absent, null and empty', () => {
    expect(readOptionalString({ a: null }, 'a')).toBeNull();
    expect(readOptionalString({}, 'a')).toBeNull();
    // Empty is treated as absent here: a nullable Postgres text column that
    // round-trips through an empty form field arrives as '' and means "unset".
    expect(readOptionalString({ a: '' }, 'a')).toBeNull();
  });

  it('reads a value', () => {
    expect(readOptionalString({ a: 'notes' }, 'a')).toBe('notes');
  });
});

describe('readNumber', () => {
  it('reads a number', () => {
    expect(readNumber({ a: 42.5 }, 'a', 0)).toBe(42.5);
    expect(readNumber({ a: 0 }, 'a', 99)).toBe(0);
  });

  /**
   * SQLite is dynamically typed and PowerSync's views convert nothing, so a
   * numeric value can arrive as text. Parsing it beats reporting a lift of zero.
   */
  it('parses a number that arrived as text', () => {
    expect(readNumber({ a: '82.5' }, 'a', 0)).toBe(82.5);
  });

  it('falls back for null, nonsense and non-finite values', () => {
    expect(readNumber({ a: null }, 'a', 7)).toBe(7);
    expect(readNumber({ a: 'heavy' }, 'a', 7)).toBe(7);
    expect(readNumber({ a: '' }, 'a', 7)).toBe(7);
    expect(readNumber({ a: Number.NaN }, 'a', 7)).toBe(7);
    expect(readNumber({ a: Number.POSITIVE_INFINITY }, 'a', 7)).toBe(7);
  });
});

describe('readOptionalNumber', () => {
  it('distinguishes absent from zero', () => {
    expect(readOptionalNumber({ a: null }, 'a')).toBeNull();
    expect(readOptionalNumber({}, 'a')).toBeNull();
    // The one that matters: an RPE of 0 is not "no RPE", and a bodyweight of 0
    // is not "unknown". Collapsing them would be a silent data change.
    expect(readOptionalNumber({ a: 0 }, 'a')).toBe(0);
  });

  it('is null for unparseable text rather than NaN', () => {
    expect(readOptionalNumber({ a: 'heavy' }, 'a')).toBeNull();
  });
});

describe('readBoolean', () => {
  it('reads SQLite integers', () => {
    expect(readBoolean({ a: 1 }, 'a')).toBe(true);
    expect(readBoolean({ a: 0 }, 'a')).toBe(false);
  });

  /**
   * The trap this function exists for. `Boolean('0')` is `true`, so a flag that
   * round-tripped through text would invert — and on `is_completed` that means
   * a set the lifter never did appearing in their history.
   */
  it('does not treat the string "0" as true', () => {
    expect(readBoolean({ a: '0' }, 'a')).toBe(false);
    expect(readBoolean({ a: 'false' }, 'a')).toBe(false);
  });

  it('reads text booleans the other way too', () => {
    expect(readBoolean({ a: '1' }, 'a')).toBe(true);
    expect(readBoolean({ a: 'true' }, 'a')).toBe(true);
  });

  it('falls back for null and anything unrecognised', () => {
    expect(readBoolean({ a: null }, 'a')).toBe(false);
    expect(readBoolean({ a: null }, 'a', true)).toBe(true);
    expect(readBoolean({ a: 'maybe' }, 'a', true)).toBe(true);
  });

  it('accepts a real boolean, which some adapters do return', () => {
    expect(readBoolean({ a: true }, 'a')).toBe(true);
    expect(readBoolean({ a: false }, 'a', true)).toBe(false);
  });
});

describe('readDate', () => {
  it('parses an ISO timestamp', () => {
    const date = readDate({ a: '2026-09-06T09:30:00.000Z' }, 'a');
    expect(date?.toISOString()).toBe('2026-09-06T09:30:00.000Z');
  });

  /**
   * An Invalid Date propagates silently — it formats as "Invalid Date",
   * compares false against everything, and makes arithmetic NaN. Refusing to
   * produce one keeps the failure where it can be handled.
   */
  it('is null rather than an Invalid Date', () => {
    expect(readDate({ a: 'not a date' }, 'a')).toBeNull();
    expect(readDate({ a: '' }, 'a')).toBeNull();
    expect(readDate({ a: null }, 'a')).toBeNull();
    expect(readDate({ a: 12345 }, 'a')).toBeNull();
  });

  it('takes a fallback when one is required', () => {
    const fallback = new Date('2020-01-01T00:00:00.000Z');
    expect(readRequiredDate({ a: null }, 'a', fallback)).toBe(fallback);
    expect(
      readRequiredDate({ a: '2026-09-06T00:00:00.000Z' }, 'a', fallback).getUTCFullYear(),
    ).toBe(2026);
  });
});

describe('readStringArray', () => {
  it('parses the JSON PowerSync stores a text[] as', () => {
    expect(readStringArray({ a: '["chest up","elbows tucked"]' }, 'a')).toEqual([
      'chest up',
      'elbows tucked',
    ]);
  });

  it('accepts an array that has already been parsed', () => {
    expect(readStringArray({ a: ['bench', 'bp'] }, 'a')).toEqual(['bench', 'bp']);
  });

  /**
   * These back the exercise cues, which are the offline answer to "how do I do
   * this lift". A malformed value should cost the cues, not the screen.
   */
  it('is empty for malformed JSON rather than throwing', () => {
    expect(readStringArray({ a: '{not json' }, 'a')).toEqual([]);
    expect(readStringArray({ a: '{"a":1}' }, 'a')).toEqual([]);
    expect(readStringArray({ a: null }, 'a')).toEqual([]);
    expect(readStringArray({ a: '' }, 'a')).toEqual([]);
  });

  it('drops non-string entries rather than passing them through', () => {
    expect(readStringArray({ a: '["ok",1,null,"fine"]' }, 'a')).toEqual(['ok', 'fine']);
  });

  it('round-trips through the writer', () => {
    const cues = ['chest up', 'brace'];
    expect(readStringArray({ a: writeStringArray(cues) }, 'a')).toEqual(cues);
  });
});

describe('readJson', () => {
  it('parses an object', () => {
    expect(readJson({ a: '{"muscles":["chest"]}' }, 'a')).toEqual({ muscles: ['chest'] });
  });

  it('is null for absent or malformed', () => {
    expect(readJson({ a: null }, 'a')).toBeNull();
    expect(readJson({ a: '' }, 'a')).toBeNull();
    expect(readJson({ a: '{oops' }, 'a')).toBeNull();
  });

  it('passes through a value that is already an object', () => {
    const value = { already: true };
    expect(readJson({ a: value }, 'a')).toBe(value);
  });
});

describe('readEnum', () => {
  const setTypes = ['warmup', 'working', 'dropset', 'failure', 'amrap'] as const;

  it('reads an allowed value', () => {
    expect(readEnum({ a: 'warmup' }, 'a', setTypes, 'working')).toBe('warmup');
  });

  /**
   * Postgres enforces these with check constraints; SQLite enforces nothing.
   * A value from a newer schema version should render as something sensible
   * rather than reach the UI and break a screen.
   */
  it('falls back for anything not in the set', () => {
    expect(readEnum({ a: 'wramup' }, 'a', setTypes, 'working')).toBe('working');
    expect(readEnum({ a: null }, 'a', setTypes, 'working')).toBe('working');
    expect(readEnum({ a: 3 }, 'a', setTypes, 'working')).toBe('working');
  });
});

describe('writeBoolean', () => {
  it('writes 1 and 0, because SQLite has no boolean', () => {
    expect(writeBoolean(true)).toBe(1);
    expect(writeBoolean(false)).toBe(0);
  });

  it('round-trips through the reader', () => {
    expect(readBoolean({ a: writeBoolean(true) }, 'a')).toBe(true);
    expect(readBoolean({ a: writeBoolean(false) }, 'a', true)).toBe(false);
  });
});
