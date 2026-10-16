import { describe, expect, it } from 'vitest';
import { isEdited, readBirthDate, readHeight, readWeight } from './edit-profile.js';

describe('readWeight', () => {
  it('reads kilograms, with a comma as the decimal point', () => {
    expect(readWeight('75.4', 'metric')).toEqual({ value: 75.4 });
    expect(readWeight(' 75,4 ', 'metric')).toEqual({ value: 75.4 });
  });

  it('stores pounds as kilograms', () => {
    const read = readWeight('180', 'imperial');
    expect('value' in read ? read.value : null).toBeCloseTo(81.65, 2);
  });

  it('asks for a weight when there is none, or it is not one', () => {
    for (const text of ['', '   ', 'abc', '0', '-3']) {
      expect(readWeight(text, 'metric')).toEqual({ problem: 'Enter a weight.' });
    }
  });

  it('refuses what the column cannot hold', () => {
    expect(readWeight('1000', 'metric')).toEqual({
      problem: 'That is outside the range this can store.',
    });
  });
});

describe('readHeight', () => {
  it('reads centimetres, and inches as centimetres', () => {
    expect(readHeight('170', 'metric')).toEqual({ value: 170 });
    expect(readHeight('70', 'imperial')).toEqual({ value: 177.8 });
  });

  it('names the unit it wants when the height is not one', () => {
    expect(readHeight('20', 'metric')).toEqual({ problem: 'Enter a height in cm.' });
    expect(readHeight('', 'imperial')).toEqual({ problem: 'Enter a height in in.' });
  });
});

describe('readBirthDate', () => {
  const now = new Date(2026, 9, 16);

  it('reads a date field', () => {
    expect(readBirthDate('1995-06-15', now)).toEqual({ value: new Date(Date.UTC(1995, 5, 15)) });
  });

  it('refuses a date outside the ages the app is for', () => {
    expect(readBirthDate('2020-01-01', now)).toHaveProperty('problem');
    expect(readBirthDate('1900-01-01', now)).toHaveProperty('problem');
    expect(readBirthDate('', now)).toHaveProperty('problem');
  });
});

describe('isEdited', () => {
  it('is not a change until the field is touched', () => {
    expect(isEdited(null, 'Milan')).toBe(false);
  });

  it('is not a change when put back as it was', () => {
    expect(isEdited('Milan ', 'Milan')).toBe(false);
  });

  it('is a change when the text differs, including emptied', () => {
    expect(isEdited('Tin', 'Milan')).toBe(true);
    expect(isEdited('', 'Milan')).toBe(true);
  });
});
