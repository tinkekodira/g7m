import { describe, expect, it } from 'vitest';
import {
  BOUT_FIELDS,
  CARDIO_KINDS,
  EMPTY_BOUT,
  boutCalories,
  boutPace,
  distanceUnitFor,
  formatDistance,
  formatDuration,
  isCardioKind,
  kmhToUnit,
  parseDuration,
  speedUnitFor,
  unitToKmh,
  unitToMetres,
  wattsFromPace,
  type Bout,
} from './cardio.js';

/** A bout with only what the test says; everything else unrecorded. */
function bout(fields: Partial<Bout>): Bout {
  return { ...EMPTY_BOUT, ...fields };
}

const HALF_HOUR = 30 * 60;

describe('the machines', () => {
  it('knows its kinds', () => {
    expect(isCardioKind('rower')).toBe(true);
    expect(isCardioKind('elliptical')).toBe(false);
    expect(isCardioKind(null)).toBe(false);
  });

  it('offers every machine its own fields, and none it does not have', () => {
    for (const kind of CARDIO_KINDS) expect(BOUT_FIELDS[kind].length).toBeGreaterThan(0);
    expect(BOUT_FIELDS.stair_climber).not.toContain('distance');
    expect(BOUT_FIELDS.treadmill).toEqual(['distance', 'speed', 'incline']);
    expect(BOUT_FIELDS.rower).toContain('watts');
  });
});

/**
 * Worked by hand from the ACSM equations, 80 kg throughout: VO2 in ml/kg/min,
 * × 80 kg / 1000 × 5 kcal/L = kcal a minute.
 */
describe('boutCalories', () => {
  it('walks: 5 km/h on the flat for half an hour', () => {
    // 83.3 m/min → 0.1 × 83.3 + 3.5 = 11.83 → 4.73 kcal/min × 30.
    expect(
      boutCalories('treadmill', bout({ durationSeconds: HALF_HOUR, speedKmh: 5 }), 80),
    ).toEqual({ kcal: 142, method: 'treadmill', rough: false });
  });

  it('walks uphill: the incline more than doubles it', () => {
    // + 1.8 × 83.3 × 0.10 = +15 ml/kg/min → 26.83 → 10.73 × 30.
    expect(
      boutCalories(
        'treadmill',
        bout({ durationSeconds: HALF_HOUR, speedKmh: 5, inclinePercent: 10 }),
        80,
      )?.kcal,
    ).toBe(322);
  });

  it('runs: 10 km/h switches to the running equation', () => {
    // 166.7 m/min → 0.2 × 166.7 + 3.5 = 36.83 → 14.73 × 30.
    expect(
      boutCalories('treadmill', bout({ durationSeconds: HALF_HOUR, speedKmh: 10 }), 80)?.kcal,
    ).toBe(442);
  });

  it('takes the speed from distance and time when no speed was typed', () => {
    expect(
      boutCalories('treadmill', bout({ durationSeconds: HALF_HOUR, distanceM: 5000 }), 80)?.kcal,
    ).toBe(442);
  });

  it('scores a decline as flat, not as a discount', () => {
    expect(
      boutCalories(
        'treadmill',
        bout({ durationSeconds: HALF_HOUR, speedKmh: 5, inclinePercent: -3 }),
        80,
      )?.kcal,
    ).toBe(142);
  });

  it('bikes from watts', () => {
    // 1.8 × 150 W × 6.12 / 80 + 7 = 27.66 → 11.06 × 30.
    expect(boutCalories('bike', bout({ durationSeconds: HALF_HOUR, avgWatts: 150 }), 80)).toEqual({
      kcal: 332,
      method: 'power',
      rough: false,
    });
  });

  it('rows from pace when the display gave no watts', () => {
    // 2,000 m in 8:00 is a 2:00 split: 2.8 / 0.24³ = 202.5 W → 34.89 → 13.96 × 8.
    expect(boutCalories('rower', bout({ durationSeconds: 480, distanceM: 2000 }), 80)).toEqual({
      kcal: 112,
      method: 'pace',
      rough: false,
    });
  });

  it('does not invent watts from a bike display’s distance', () => {
    expect(
      boutCalories('bike', bout({ durationSeconds: HALF_HOUR, distanceM: 15000 }), 80)?.method,
    ).toBe('met');
  });

  it('climbs from floors a minute', () => {
    // 30 floors in 10 min = 48 steps/min of 0.2 m:
    // 0.2 × 48 + 1.33 × 1.8 × 0.2 × 48 + 3.5 = 36.08 → 14.43 × 10.
    expect(boutCalories('stair_climber', bout({ durationSeconds: 600, floors: 30 }), 80)).toEqual({
      kcal: 144,
      method: 'stairs',
      rough: false,
    });
  });

  it('falls back to the machine’s MET, and says it is rough', () => {
    // 6.8 MET × 80 kg × 0.5 h.
    expect(boutCalories('bike', bout({ durationSeconds: HALF_HOUR }), 80)).toEqual({
      kcal: 272,
      method: 'met',
      rough: true,
    });
    expect(boutCalories('stair_climber', bout({ durationSeconds: HALF_HOUR }), 80)?.kcal).toBe(360);
  });

  it('never uses resistance level, which means nothing between brands', () => {
    const plain = boutCalories('bike', bout({ durationSeconds: HALF_HOUR }), 80);
    const levelled = boutCalories(
      'bike',
      bout({ durationSeconds: HALF_HOUR, resistanceLevel: 18 }),
      80,
    );
    expect(levelled).toEqual(plain);
  });

  it('takes the machine’s own figure over any estimate', () => {
    expect(
      boutCalories(
        'treadmill',
        bout({ durationSeconds: HALF_HOUR, speedKmh: 10, caloriesKcal: 380 }),
        80,
      ),
    ).toEqual({ kcal: 380, method: 'machine', rough: false });
    // Even with nothing else known about the bout.
    expect(boutCalories('rower', bout({ caloriesKcal: 90 }), null)?.kcal).toBe(90);
  });

  it('says nothing without a time or a bodyweight', () => {
    expect(boutCalories('bike', bout({ avgWatts: 150 }), 80)).toBeNull();
    expect(boutCalories('bike', bout({ durationSeconds: HALF_HOUR }), null)).toBeNull();
    expect(boutCalories('bike', bout({ durationSeconds: HALF_HOUR }), 0)).toBeNull();
  });

  it('scales with bodyweight', () => {
    const light = boutCalories('treadmill', bout({ durationSeconds: HALF_HOUR, speedKmh: 5 }), 60);
    const heavy = boutCalories('treadmill', bout({ durationSeconds: HALF_HOUR, speedKmh: 5 }), 100);
    expect(light?.kcal).toBeLessThan(heavy?.kcal ?? 0);
  });
});

describe('wattsFromPace', () => {
  it('is Concept2’s formula', () => {
    expect(wattsFromPace(0.24)).toBeCloseTo(202.5, 1);
  });

  it('is zero for no pace at all', () => {
    expect(wattsFromPace(0)).toBe(0);
  });
});

describe('distance', () => {
  it('is metres on a rower or ski erg, whatever the setting', () => {
    expect(distanceUnitFor('rower', 'imperial')).toBe('m');
    expect(distanceUnitFor('ski_erg', 'metric')).toBe('m');
  });

  it('follows the unit setting everywhere else', () => {
    expect(distanceUnitFor('treadmill', 'metric')).toBe('km');
    expect(distanceUnitFor('bike', 'imperial')).toBe('mi');
  });

  it('reads the way a display does', () => {
    expect(formatDistance(5234, 'km')).toBe('5.23 km');
    expect(formatDistance(5000, 'km')).toBe('5 km');
    expect(formatDistance(12345, 'km')).toBe('12.3 km');
    expect(formatDistance(1609.344, 'mi')).toBe('1 mi');
    expect(formatDistance(2000, 'm')).toBe('2,000 m');
  });

  it('goes back to whole metres', () => {
    expect(unitToMetres(5, 'km')).toBe(5000);
    expect(unitToMetres(3.1, 'mi')).toBe(4989);
    expect(unitToMetres(2000.4, 'm')).toBe(2000);
  });
});

describe('speed', () => {
  it('follows the unit setting', () => {
    expect(speedUnitFor('metric')).toBe('km/h');
    expect(speedUnitFor('imperial')).toBe('mph');
  });

  it('converts both ways, to a tenth', () => {
    expect(kmhToUnit(16.09344, 'mph')).toBeCloseTo(10, 5);
    expect(kmhToUnit(12, 'km/h')).toBe(12);
    expect(unitToKmh(6, 'mph')).toBe(9.7);
    expect(unitToKmh(12.34, 'km/h')).toBe(12.3);
  });
});

describe('boutPace', () => {
  it('gives a rower its 500 m split', () => {
    expect(boutPace('rower', bout({ durationSeconds: 480, distanceM: 2000 }), 'metric')).toBe(
      '2:00 /500 m',
    );
  });

  it('gives a treadmill minutes per kilometre or mile', () => {
    const run = bout({ durationSeconds: 1500, distanceM: 5000 });
    expect(boutPace('treadmill', run, 'metric')).toBe('5:00 /km');
    expect(boutPace('treadmill', run, 'imperial')).toBe('8:03 /mi');
  });

  it('has nothing to say for a bike, or without both numbers', () => {
    expect(boutPace('bike', bout({ durationSeconds: 600, distanceM: 5000 }), 'metric')).toBeNull();
    expect(boutPace('rower', bout({ durationSeconds: 480 }), 'metric')).toBeNull();
  });
});

describe('formatDuration', () => {
  it('reads like a machine’s display', () => {
    expect(formatDuration(1500)).toBe('25:00');
    expect(formatDuration(3750)).toBe('1:02:30');
    expect(formatDuration(45)).toBe('0:45');
    expect(formatDuration(-5)).toBe('0:00');
  });
});

describe('parseDuration', () => {
  it('reads a bare number as minutes', () => {
    expect(parseDuration('25')).toBe(1500);
    expect(parseDuration('1,5')).toBe(90);
  });

  it('reads minutes:seconds and hours:minutes:seconds', () => {
    expect(parseDuration('25:30')).toBe(1530);
    expect(parseDuration(' 1:05:00 ')).toBe(3900);
  });

  it('refuses what is not a time', () => {
    for (const typo of ['', 'abc', '0', '0:00', '1:60', '1:2:3:4', '1:75:00', '-5']) {
      expect(parseDuration(typo), typo).toBeNull();
    }
  });
});
