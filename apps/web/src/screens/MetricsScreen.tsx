import { useMemo, useState } from 'react';
import {
  ACTIVITY_DESCRIPTIONS,
  ACTIVITY_LABELS,
  ACTIVITY_LEVELS,
  ageOn,
  describeWhen,
  fromDisplayHeight,
  fromDisplayWeight,
  startOfDay,
  toDisplayHeight,
  toDisplayWeight,
  weighInStatus,
  weightTrend,
  type ActivityLevel,
  type UnitSystem,
} from '@g7m/core';
import type { BodyMetric } from '@g7m/db';
import { Button, Chip, TextField } from '@g7m/ui';
import { HeaderLink } from '../components/HeaderLink.js';
import { TrendChart } from '../components/Charts.js';
import { useCatalogue, useWrite } from '../lib/db/use-catalogue.js';
import { describeChange, weighInPrompt } from './metrics-prompt.js';

/**
 * Weight, height, age and how active the week is.
 *
 * The four inputs the coaching loop runs on (ADR-0032), and the screen that
 * keeps the first of them current — "prompt for a weight at least weekly" is
 * the requirement this exists to meet.
 *
 * Everything measurable is written to `body_metrics` as a new row rather than
 * edited in place, which is what makes the trend below reconstructable. Age is
 * the exception and stays on `profiles`: a birth year is one value that does
 * not change, and a series of it would be a row with extra steps.
 */

/** As long a window as the progress screen shows, for the same reason. */
const HISTORY_WEEKS = 12;

export function MetricsScreen() {
  // Fixed at mount. A `new Date()` read during render would make every
  // `useCatalogue` key different on every render and re-query forever.
  const now = useMemo(() => new Date(), []);
  const from = useMemo(() => {
    const start = startOfDay(now);
    start.setDate(start.getDate() - HISTORY_WEEKS * 7);
    return start;
  }, [now]);

  const profile = useCatalogue('profile', (r) => r.profile.current());
  const current = useCatalogue('body-metrics-current', (r) => r.bodyMetrics.current());
  const history = useCatalogue(`body-metrics-${from.toISOString()}`, (r) =>
    r.bodyMetrics.between({ from }),
  );

  const unitSystem: UnitSystem = profile.data?.unitSystem ?? 'metric';
  const readings = history.data ?? [];

  const weighIns = readings
    .filter((entry): entry is BodyMetric & { weightKg: number } => entry.weightKg !== null)
    .map((entry) => ({ at: entry.recordedAt, weightKg: entry.weightKg }));

  const trend = weightTrend(weighIns);
  const status = weighInStatus(current.data?.weightAt ?? null, now);
  const prompt = weighInPrompt(status);
  const age = ageOn(profile.data?.birthYear ?? null, now);

  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col gap-4 px-4 pt-safe-top pb-safe-bottom">
      <header className="flex items-start justify-between gap-3 pt-6 pb-2">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-primary">You</h1>
          <p className="mt-1 text-sm text-secondary">
            What the plan gets built from. Nothing here is shared anywhere.
          </p>
        </div>
        <HeaderLink to="/">Home</HeaderLink>
      </header>

      {(profile.error ?? current.error ?? history.error) !== null && (
        <p role="alert" className="rounded-card bg-surface p-4 text-sm text-danger">
          {profile.error ?? current.error ?? history.error}
        </p>
      )}

      <WeightSection
        prompt={prompt}
        unitSystem={unitSystem}
        currentKg={current.data?.weightKg ?? null}
        weightAt={current.data?.weightAt ?? null}
        now={now}
        values={weighIns.map((entry) => entry.weightKg)}
        change={describeChange(trend, unitSystem)}
      />

      <AboutYou
        unitSystem={unitSystem}
        heightCm={current.data?.heightCm ?? null}
        birthYear={profile.data?.birthYear ?? null}
        age={age}
        activityLevel={current.data?.activityLevel ?? null}
      />

      <Readings entries={readings} unitSystem={unitSystem} now={now} />

      <p className="py-6 text-xs text-muted">
        Educational content, not medical advice. These numbers shape a training plan, nothing more.
      </p>
    </main>
  );
}

function WeightSection({
  prompt,
  unitSystem,
  currentKg,
  weightAt,
  now,
  values,
  change,
}: {
  readonly prompt: ReturnType<typeof weighInPrompt>;
  readonly unitSystem: UnitSystem;
  readonly currentKg: number | null;
  readonly weightAt: Date | null;
  readonly now: Date;
  readonly values: readonly number[];
  readonly change: string | null;
}) {
  const { write, busy } = useWrite();
  const [draft, setDraft] = useState('');
  const [problem, setProblem] = useState<string | null>(null);

  const unit = unitSystem === 'imperial' ? 'lb' : 'kg';
  const shown = currentKg === null ? null : toDisplayWeight(currentKg, unitSystem);
  const chartValues = values.map((kg) => toDisplayWeight(kg, unitSystem).value);

  async function save(): Promise<void> {
    const typed = Number(draft.replace(',', '.'));
    if (!Number.isFinite(typed) || typed <= 0) {
      setProblem('Enter a weight.');
      return;
    }
    const kg = fromDisplayWeight(typed, unitSystem);
    // Mirrors the CHECK on the column. Caught here so the person sees why,
    // rather than at upload where the row would be discarded silently.
    if (kg <= 0 || kg >= 1000) {
      setProblem('That is outside the range this can store.');
      return;
    }

    setProblem(null);
    await write(async (r) => {
      await r.bodyMetrics.record({ weightKg: kg });
      // `profiles.bodyweight_kg` stays the current value the logger reads at
      // the start of a session, so a pull-up gets attributed real load. The
      // history is this table; the working number is still there.
      await r.profile.update({ bodyweightKg: kg });
    });
    setDraft('');
  }

  return (
    <section className="rounded-card bg-surface p-4">
      {prompt !== null && (
        <div
          className={`mb-4 rounded-control border p-3 ${
            prompt.tone === 'urgent' ? 'border-danger/40 bg-danger/10' : 'border-subtle bg-elevated'
          }`}
        >
          <p className="text-sm font-semibold text-primary">{prompt.title}</p>
          <p className="mt-1 text-sm text-secondary">{prompt.body}</p>
        </div>
      )}

      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold text-primary">Weight</h2>
        {weightAt !== null && (
          <span className="text-xs text-muted">{describeWhen(weightAt, now)}</span>
        )}
      </div>

      <p className="numeric mt-1 text-3xl text-primary">
        {shown === null ? '—' : `${String(shown.value)} ${shown.unit}`}
      </p>

      {chartValues.length > 1 && (
        <div className="mt-4">
          {/* A fitted baseline, not zero. On an axis running from nothing, four
              kilograms lost over three months is a flat line. */}
          <TrendChart
            values={chartValues}
            baseline="fit"
            summary={`Weight over the last ${String(HISTORY_WEEKS)} weeks, ${String(chartValues.length)} readings.`}
            format={(value) => `${value.toFixed(1)} ${unit}`}
          />
        </div>
      )}

      {change !== null && <p className="mt-3 text-sm text-secondary">{change}</p>}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <TextField
            label={`Today’s weight (${unit})`}
            inputMode="decimal"
            value={draft}
            error={problem ?? undefined}
            onChange={(event) => {
              setDraft(event.target.value);
            }}
          />
        </div>
        <Button
          disabled={busy || draft.trim() === ''}
          onClick={() => {
            void save();
          }}
        >
          Save
        </Button>
      </div>
    </section>
  );
}

function AboutYou({
  unitSystem,
  heightCm,
  birthYear,
  age,
  activityLevel,
}: {
  readonly unitSystem: UnitSystem;
  readonly heightCm: number | null;
  readonly birthYear: number | null;
  readonly age: number | null;
  readonly activityLevel: ActivityLevel | null;
}) {
  const { write, busy } = useWrite();
  const heightUnit = unitSystem === 'imperial' ? 'in' : 'cm';
  const shownHeight = heightCm === null ? null : toDisplayHeight(heightCm, unitSystem);

  const [height, setHeight] = useState('');
  const [year, setYear] = useState('');
  const [problem, setProblem] = useState<string | null>(null);

  async function saveHeight(): Promise<void> {
    const typed = Number(height.replace(',', '.'));
    const cm = Number.isFinite(typed) ? fromDisplayHeight(typed, unitSystem) : Number.NaN;
    if (!Number.isFinite(cm) || cm <= 50 || cm >= 300) {
      setProblem(`Enter a height in ${heightUnit}.`);
      return;
    }
    setProblem(null);
    // A new row rather than an edit, like every other measurement. Height
    // rarely changes, but somebody who is still growing has a real series.
    await write((r) => r.bodyMetrics.record({ heightCm: cm }));
    setHeight('');
  }

  async function saveYear(): Promise<void> {
    const typed = Number(year);
    if (!Number.isInteger(typed) || typed < 1900 || typed > new Date().getFullYear()) {
      setProblem('Enter the year you were born.');
      return;
    }
    setProblem(null);
    // On `profiles`, not here: one value that does not change. The deliberate
    // deviation from ADR-0032 is recorded in the body_metrics migration.
    await write((r) => r.profile.update({ birthYear: typed }));
    setYear('');
  }

  return (
    <section className="rounded-card bg-surface p-4">
      <h2 className="mb-3 text-lg font-semibold text-primary">About you</h2>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <TextField
            label={`Height (${heightUnit})`}
            inputMode="decimal"
            value={height}
            placeholder={shownHeight === null ? '' : String(shownHeight.value)}
            hint={shownHeight === null ? 'Not set yet' : undefined}
            onChange={(event) => {
              setHeight(event.target.value);
            }}
          />
        </div>
        <Button
          variant="secondary"
          disabled={busy || height.trim() === ''}
          onClick={() => {
            void saveHeight();
          }}
        >
          Save
        </Button>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <TextField
            label="Year of birth"
            inputMode="numeric"
            value={year}
            placeholder={birthYear === null ? '' : String(birthYear)}
            hint={age === null ? 'Used to set sensible starting loads' : `You are ${String(age)}`}
            onChange={(event) => {
              setYear(event.target.value);
            }}
          />
        </div>
        <Button
          variant="secondary"
          disabled={busy || year.trim() === ''}
          onClick={() => {
            void saveYear();
          }}
        >
          Save
        </Button>
      </div>

      {problem !== null && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {problem}
        </p>
      )}

      <fieldset className="mt-5 border-0 p-0">
        <legend className="text-sm font-medium text-secondary">Your week outside the gym</legend>
        {/* Outside the gym, on purpose. Training is already counted, by the
            session log — asking about it here would count it twice. */}
        <div className="mt-2 flex flex-wrap gap-2">
          {ACTIVITY_LEVELS.map((level) => (
            <Chip
              key={level}
              selected={activityLevel === level}
              disabled={busy}
              onClick={() => {
                void write((r) => r.bodyMetrics.record({ activityLevel: level }));
              }}
            >
              {ACTIVITY_LABELS[level]}
            </Chip>
          ))}
        </div>
        <p className="mt-2 text-sm text-muted">
          {activityLevel === null
            ? 'Pick the one that sounds most like your average week.'
            : ACTIVITY_DESCRIPTIONS[activityLevel]}
        </p>
      </fieldset>
    </section>
  );
}

function Readings({
  entries,
  unitSystem,
  now,
}: {
  readonly entries: readonly BodyMetric[];
  readonly unitSystem: UnitSystem;
  readonly now: Date;
}) {
  const { write, busy } = useWrite();
  // Newest first here, though the series is stored oldest first — a list is
  // read from the top, and the top should be the most recent thing.
  const recent = [...entries].reverse().slice(0, 10);

  if (recent.length === 0) return null;

  return (
    <section className="rounded-card bg-surface p-4">
      <h2 className="mb-1 text-lg font-semibold text-primary">Recent readings</h2>
      <p className="mb-3 text-sm text-muted">
        Nothing here is overwritten. Remove a reading only if it was typed wrong — a deleted one
        leaves a gap in the trend.
      </p>

      <ul className="flex flex-col">
        {recent.map((entry) => (
          <li
            key={entry.id}
            className="flex items-center justify-between gap-3 border-b border-subtle py-2 last:border-b-0"
          >
            <div className="min-w-0">
              <p className="numeric text-base text-primary">{summarise(entry, unitSystem)}</p>
              <p className="text-xs text-muted">{describeWhen(entry.recordedAt, now)}</p>
            </div>
            <Button
              variant="secondary"
              size="md"
              disabled={busy}
              onClick={() => {
                void write((r) => r.bodyMetrics.remove(entry.id));
              }}
            >
              Remove
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** One line for a reading, listing only the fields it actually carries. */
function summarise(entry: BodyMetric, unitSystem: UnitSystem): string {
  const parts: string[] = [];

  if (entry.weightKg !== null) {
    const weight = toDisplayWeight(entry.weightKg, unitSystem);
    parts.push(`${String(weight.value)} ${weight.unit}`);
  }
  if (entry.heightCm !== null) {
    const height = toDisplayHeight(entry.heightCm, unitSystem);
    parts.push(`${String(height.value)} ${height.unit}`);
  }
  if (entry.activityLevel !== null) parts.push(ACTIVITY_LABELS[entry.activityLevel]);
  if (entry.bodyFatPercent !== null) parts.push(`${String(entry.bodyFatPercent)}% fat`);

  return parts.join(' · ');
}
