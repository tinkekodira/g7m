import { describe, expect, it } from 'vitest';
import {
  ACTIVITY_DESCRIPTIONS,
  ACTIVITY_LABELS,
  ACTIVITY_LEVELS,
  BASE_HEALTHY_HIGH,
  BASE_HEALTHY_LOW,
  MIN_TREND_DAYS,
  ageFrom,
  ageOn,
  bodyIndex,
  parseBirthDate,
  toDateOnly,
  weighInStatus,
  weightTrend,
  type BodyIndexInput,
  type WeighIn,
} from './body.js';

const DAY = 86_400_000;
const START = new Date('2026-01-05T08:00:00.000Z');

/** A series counted forward in days from `START`, oldest first. */
function series(entries: readonly (readonly [number, number])[]): WeighIn[] {
  return entries.map(([day, weightKg]) => ({
    at: new Date(START.getTime() + day * DAY),
    weightKg,
  }));
}

describe('activity levels', () => {
  it('labels and describes every level', () => {
    // A level added to the union without a label would render as blank in the
    // picker, which is a screen bug that TypeScript can catch here instead.
    for (const level of ACTIVITY_LEVELS) {
      expect(ACTIVITY_LABELS[level]).not.toBe('');
      expect(ACTIVITY_DESCRIPTIONS[level]).not.toBe('');
    }
  });

  it('describes the week outside the gym, not the training in it', () => {
    // The session log already knows about training. Asking twice would double
    // count the one thing the app measures directly.
    expect(ACTIVITY_DESCRIPTIONS.sedentary).toMatch(/desk|driving|walking/i);
  });
});

describe('ageOn', () => {
  it('is the difference in calendar years', () => {
    expect(ageOn(1998, new Date('2026-09-07T00:00:00.000Z'))).toBe(28);
  });

  it('is null when there is no birth year', () => {
    expect(ageOn(null, new Date('2026-09-07T00:00:00.000Z'))).toBeNull();
  });

  it('refuses a year that cannot be right rather than returning a number', () => {
    // A stray digit produces an age of 1926, and a plan generator downstream
    // has no way to tell that from a very old lifter.
    expect(ageOn(19998, new Date('2026-09-07T00:00:00.000Z'))).toBeNull();
    expect(ageOn(2050, new Date('2026-09-07T00:00:00.000Z'))).toBeNull();
  });
});

describe('weighInStatus', () => {
  const now = new Date('2026-01-20T09:00:00.000Z');

  it('is never before the first weigh-in', () => {
    expect(weighInStatus(null, now)).toEqual({ state: 'never', days: null });
  });

  it('is fresh inside the week', () => {
    const status = weighInStatus(new Date('2026-01-17T09:00:00.000Z'), now);
    expect(status).toEqual({ state: 'fresh', days: 3 });
  });

  it('comes due on the seventh day', () => {
    expect(weighInStatus(new Date('2026-01-13T09:00:00.000Z'), now).state).toBe('due');
    expect(weighInStatus(new Date('2026-01-14T09:00:00.000Z'), now).state).toBe('fresh');
  });

  it('is overdue after a fortnight', () => {
    expect(weighInStatus(new Date('2026-01-06T09:00:00.000Z'), now).state).toBe('overdue');
  });

  /**
   * A calendar-week rule would fire here, and it would be wrong: somebody who
   * weighed in on Sunday evening does not need asking again on Monday morning.
   */
  it('counts elapsed days, so a weekend weigh-in is not re-asked on Monday', () => {
    const sundayEvening = new Date('2026-01-18T21:00:00.000Z');
    const mondayMorning = new Date('2026-01-19T07:00:00.000Z');
    expect(weighInStatus(sundayEvening, mondayMorning).state).toBe('fresh');
  });

  it('treats a reading from the future as fresh', () => {
    // A wrong device clock is not a reason to nag.
    expect(weighInStatus(new Date('2026-02-01T09:00:00.000Z'), now)).toEqual({
      state: 'fresh',
      days: 0,
    });
  });
});

describe('weightTrend', () => {
  it('is null with nothing to read', () => {
    expect(weightTrend([])).toBeNull();
  });

  it('reports the latest reading unsmoothed', () => {
    // The headline number has to match the scale, or the screen is arguing
    // with the thing the user is standing on.
    const trend = weightTrend(
      series([
        [0, 84],
        [7, 83.4],
        [21, 82],
      ]),
    );
    expect(trend?.latestKg).toBe(82);
  });

  it('measures the change between averaged ends', () => {
    const trend = weightTrend(
      series([
        [0, 84],
        [3, 83],
        [28, 81],
        [31, 80],
      ]),
    );
    // (84 + 83) / 2 down to (81 + 80) / 2.
    expect(trend?.startKg).toBe(83.5);
    expect(trend?.endKg).toBe(80.5);
    expect(trend?.changeKg).toBe(-3);
  });

  /**
   * The reason both ends are averaged at all. Weigh in dehydrated after a
   * long Friday, then again after a big Sunday lunch, and endpoint-to-endpoint
   * turns a successful cut into a gain.
   */
  it('does not let one heavy morning reverse the story', () => {
    const trend = weightTrend(
      series([
        [0, 82],
        [1, 84],
        [2, 83.5],
        [28, 80],
        [29, 79.5],
        [30, 82.5],
      ]),
    );
    expect(trend?.changeKg).toBeLessThan(0);
  });

  it('states a weekly rate once there is a fortnight to divide by', () => {
    const trend = weightTrend(
      series([
        [0, 84],
        [28, 80],
      ]),
    );
    expect(trend?.spanDays).toBe(28);
    expect(trend?.perWeekKg).toBe(-1);
  });

  /**
   * Below two weeks the two windows overlap, so the same readings would appear
   * on both sides of the subtraction and the rate would be noise with a
   * decimal point on it.
   */
  it('refuses a weekly rate over too short a span', () => {
    const trend = weightTrend(
      series([
        [0, 84],
        [10, 82],
      ]),
    );
    expect(trend?.spanDays).toBeLessThan(MIN_TREND_DAYS);
    expect(trend?.perWeekKg).toBeNull();
    // The change itself is still worth showing; only the extrapolation is not.
    expect(trend?.changeKg).toBe(-2);
  });

  it('handles a single reading without dividing by zero', () => {
    const trend = weightTrend(series([[0, 84]]));
    expect(trend).toEqual({
      latestKg: 84,
      startKg: 84,
      endKg: 84,
      changeKg: 0,
      perWeekKg: null,
      spanDays: 0,
      samples: 1,
    });
  });

  it('sorts a series given out of order', () => {
    // `between()` returns oldest first, but a backfilled reading entered today
    // for last month is exactly the case that would arrive unsorted.
    const trend = weightTrend([
      { at: new Date(START.getTime() + 28 * DAY), weightKg: 80 },
      { at: START, weightKg: 84 },
    ]);
    expect(trend?.latestKg).toBe(80);
    expect(trend?.changeKg).toBe(-4);
  });

  it('ignores readings that carry no usable weight', () => {
    const trend = weightTrend([
      { at: START, weightKg: 84 },
      { at: new Date(START.getTime() + 14 * DAY), weightKg: Number.NaN },
      { at: new Date(START.getTime() + 28 * DAY), weightKg: 80 },
    ]);
    expect(trend?.samples).toBe(2);
  });
});

describe('parseBirthDate', () => {
  it('reads a date out of the field', () => {
    const date = parseBirthDate('2001-05-14');
    expect(date?.getUTCFullYear()).toBe(2001);
    expect(date?.getUTCMonth()).toBe(4);
    expect(date?.getUTCDate()).toBe(14);
  });

  /**
   * `new Date(2001, 1, 31)` is quietly the 3rd of March. A regex alone accepts
   * it, so the parts are read back — a day that rolled over is a typo.
   */
  it('refuses a date that does not exist', () => {
    expect(parseBirthDate('2001-02-31')).toBeNull();
    expect(parseBirthDate('2001-13-01')).toBeNull();
    expect(parseBirthDate('2001-00-10')).toBeNull();
  });

  it('keeps the 29th of February in a year that has one', () => {
    expect(parseBirthDate('2000-02-29')?.getUTCDate()).toBe(29);
    expect(parseBirthDate('2001-02-29')).toBeNull();
  });

  it('is null for anything that is not a date at all', () => {
    for (const bad of ['', '  ', 'yesterday', '14/05/2001', '2001-5-14']) {
      expect(parseBirthDate(bad), bad).toBeNull();
    }
  });
});

describe('toDateOnly', () => {
  it('round-trips through the field format', () => {
    const date = parseBirthDate('1998-11-03');
    expect(date === null ? null : toDateOnly(date)).toBe('1998-11-03');
  });

  /**
   * Held in UTC throughout. Reading a date of birth back with local getters
   * moves it a day west of Greenwich, which is a birthday on the wrong date
   * and an age that flickers around it.
   */
  it('does not drift a day in a western timezone', () => {
    expect(toDateOnly(new Date('2001-01-01T00:00:00.000Z'))).toBe('2001-01-01');
  });
});

describe('ageFrom', () => {
  const born = parseBirthDate('2000-06-15');

  it('counts whole years', () => {
    expect(ageFrom(born, new Date('2026-06-15T00:00:00.000Z'))).toBe(26);
  });

  /**
   * The subtraction people reach for — this year minus that year — is wrong
   * for everybody who has not had their birthday yet, which is on average half
   * of them, and it is a year of difference in the starting weights this feeds.
   */
  it('does not count a birthday that has not happened yet', () => {
    expect(ageFrom(born, new Date('2026-06-14T00:00:00.000Z'))).toBe(25);
    expect(ageFrom(born, new Date('2026-01-02T00:00:00.000Z'))).toBe(25);
    expect(ageFrom(born, new Date('2026-12-31T00:00:00.000Z'))).toBe(26);
  });

  it('has nothing to say without a date', () => {
    expect(ageFrom(null, new Date())).toBeNull();
    expect(ageFrom(new Date('nonsense'), new Date())).toBeNull();
  });

  it('rejects a date that would make somebody impossible', () => {
    expect(ageFrom(parseBirthDate('1850-01-01'), new Date('2026-01-01T00:00:00.000Z'))).toBeNull();
    expect(ageFrom(parseBirthDate('2030-01-01'), new Date('2026-01-01T00:00:00.000Z'))).toBeNull();
  });
});

const UNKNOWN: BodyIndexInput = {
  weightKg: null,
  heightCm: null,
  age: null,
  sex: null,
  activityLevel: null,
  trainingDaysPerWeek: null,
};

/** 180 cm, which makes every ratio below divisible by 3.24. */
function body(weightKg: number, rest: Partial<BodyIndexInput> = {}): BodyIndexInput {
  return { ...UNKNOWN, weightKg, heightCm: 180, ...rest };
}

describe('bodyIndex', () => {
  it('has no answer without a weight and a height', () => {
    expect(bodyIndex(UNKNOWN)).toBeNull();
    expect(bodyIndex({ ...UNKNOWN, weightKg: 80 })).toBeNull();
    expect(bodyIndex({ ...UNKNOWN, heightCm: 180 })).toBeNull();
  });

  /**
   * The textbook band is what somebody who has answered nothing else gets, and
   * it is the harshest verdict this can give. Every optional answer widens it.
   */
  it('judges a body it knows nothing else about against the textbook band', () => {
    const index = bodyIndex(body(80));
    expect(index).toMatchObject({
      bmi: 24.7,
      band: 'healthy',
      healthyLow: BASE_HEALTHY_LOW,
      healthyHigh: BASE_HEALTHY_HIGH,
      adjustedFor: [],
    });
  });

  /**
   * ADR-0035's objection, and the case this exists to get right: 86 kg at
   * 180 cm is "overweight" on the textbook band and healthy for somebody who
   * trains five days a week and is on their feet all day.
   */
  it('calls a lifter healthy where the textbook band would not', () => {
    const lifter = bodyIndex(
      body(86, { age: 30, sex: 'male', activityLevel: 'active', trainingDaysPerWeek: 5 }),
    );

    expect(lifter?.bmi).toBe(26.5);
    expect(lifter?.bmi).toBeGreaterThan(BASE_HEALTHY_HIGH);
    expect(lifter?.healthyHigh).toBe(27.5);
    expect(lifter?.band).toBe('healthy');
    expect(lifter?.adjustedFor).toEqual(['training', 'activity']);

    // The same body, with nothing on file about how it is used.
    expect(bodyIndex(body(86))?.band).toBe('above');
  });

  /** Still above is still reported. The range moves; it does not absolve. */
  it('does not widen the band far enough to excuse anything', () => {
    const index = bodyIndex(
      body(105, { age: 30, sex: 'male', activityLevel: 'very_active', trainingDaysPerWeek: 6 }),
    );
    expect(index?.bmi).toBe(32.4);
    expect(index?.band).toBe('above');
  });

  /**
   * Both ends, because being light is its own risk later in life — the half of
   * the published adjustment that gets left out.
   */
  it('raises the whole band with age', () => {
    const old = bodyIndex({ ...body(80), heightCm: 170, age: 70 });
    expect(old).toMatchObject({ bmi: 27.7, healthyLow: 22.5, healthyHigh: 29, band: 'healthy' });
    expect(old?.adjustedFor).toEqual(['age']);

    // The same ratio at 25 is above the band.
    expect(bodyIndex({ ...body(80), heightCm: 170, age: 25 })?.band).toBe('above');

    // And the lower end bites: 20.8 is healthy at 25 and light at 70.
    expect(bodyIndex({ ...body(60), heightCm: 170, age: 25 })?.band).toBe('healthy');
    expect(bodyIndex({ ...body(60), heightCm: 170, age: 70 })?.band).toBe('below');
  });

  /**
   * The allowance is for lean tissue, and a female body carries less of it at
   * the same training. It widens her range too — just by less. Nobody's range
   * is ever narrowed for their sex.
   */
  it('credits a female body with a smaller share of the lean allowance', () => {
    const shared = { age: 30, activityLevel: 'active', trainingDaysPerWeek: 5 } as const;
    const male = bodyIndex(body(86, { ...shared, sex: 'male' }));
    const female = bodyIndex(body(86, { ...shared, sex: 'female' }));

    expect(female?.healthyHigh).toBe(26.5);
    expect(female?.healthyHigh).toBeLessThan(male?.healthyHigh ?? 0);
    expect(female?.healthyHigh).toBeGreaterThan(BASE_HEALTHY_HIGH);
    // Same body, same ratio. Only what counts as healthy for it differs.
    expect(female?.bmi).toBe(male?.bmi);
  });

  it('stops calling anything healthy past 30, however the adjustments stack', () => {
    const index = bodyIndex(
      body(100, { age: 100, sex: 'male', activityLevel: 'very_active', trainingDaysPerWeek: 7 }),
    );
    expect(index?.healthyHigh).toBe(30);
  });

  /** A goal row claiming nine training days a week buys nothing over seven. */
  it('clamps the training days to a week', () => {
    const seven = bodyIndex(body(86, { trainingDaysPerWeek: 7 }));
    expect(bodyIndex(body(86, { trainingDaysPerWeek: 99 }))?.healthyHigh).toBe(seven?.healthyHigh);
  });

  /**
   * The ratio is the ratio. A "muscle-corrected BMI" would agree with no
   * doctor, chart or other app, and would be a guess wearing a measurement's
   * clothes.
   */
  it('never adjusts the number itself', () => {
    const plain = bodyIndex(body(90))?.bmi;
    const known = bodyIndex(
      body(90, { age: 65, sex: 'male', activityLevel: 'very_active', trainingDaysPerWeek: 6 }),
    )?.bmi;
    expect(known).toBe(plain);
  });

  it('separates a little above from a long way above', () => {
    // The band tops out at 25 here, so 30.0 is the last thing called "above".
    expect(bodyIndex({ ...body(86.7), heightCm: 170 })?.band).toBe('above');
    expect(bodyIndex({ ...body(87), heightCm: 170 })?.band).toBe('well_above');
  });

  it('refuses a measurement that is a typo rather than a body', () => {
    // A height in metres, typed into a box asking for centimetres.
    expect(bodyIndex({ ...body(80), heightCm: 1.8 })).toBeNull();
    expect(bodyIndex({ ...body(80), heightCm: 300 })).toBeNull();
    expect(bodyIndex(body(0))).toBeNull();
    expect(bodyIndex(body(Number.NaN))).toBeNull();
  });
});
