import { useEffect, useId, useMemo, useState, type FormEvent } from 'react';
import {
  ACTIVITY_DESCRIPTIONS,
  ACTIVITY_LABELS,
  ACTIVITY_LEVELS,
  SEXES,
  SEX_LABELS,
  ageFrom,
  describeWhen,
  startOfDay,
  toDateOnly,
  toDisplayHeight,
  toDisplayWeight,
  weighInStatus,
  weightTrend,
  type ActivityLevel,
  type Sex,
  type UnitSystem,
} from '@g7m/core';
import type { BodyMetric } from '@g7m/db';
import { Button, Chip, TextField, cx } from '@g7m/ui';
import { HeaderLink } from '../components/HeaderLink.js';
import { CountryPicker } from '../components/CountryPicker.js';
import { Panel } from '../components/Panel.js';
import { StatValue } from '../components/StatValue.js';
import { TrendChart } from '../components/Charts.js';
import { CheckIcon, ScaleIcon, TrashIcon } from '../components/icons.js';
import { useCatalogue, useWrite } from '../lib/db/use-catalogue.js';
import { useLogWeight } from '../lib/db/use-log-weight.js';
import { describeChange, weighInPrompt } from './metrics-prompt.js';
import { isEdited, readBirthDate, readHeight } from './edit-profile.js';

/**
 * Edit profile: weight, height, age, sex, country and how active the week is.
 *
 * The inputs the coaching loop runs on (ADR-0032), and the screen that keeps
 * the first of them current — "prompt for a weight at least weekly" is the
 * requirement this exists to meet.
 *
 * Laid out as Profile is, in Home's cards (ADR-0136): the weight first, as the
 * one number that changes, with its trend and one field to log it; then who
 * you are as a single form with the stored answers already in it and one Save;
 * then the week outside the gym as a list to pick from; then the readings.
 * It used to be a Save button under every field and a goal link at the end,
 * which Profile's goal card had already made redundant.
 *
 * Everything measurable is written to `body_metrics` as a new row rather than
 * edited in place, which is what makes the trend reconstructable. Age is the
 * exception and stays on `profiles`: a birth date is one value that does not
 * change, and a series of it would be a row with extra steps.
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
  const error = profile.error ?? current.error ?? history.error;

  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col gap-4 px-4 pt-safe-top pb-safe-bottom">
      <header className="flex items-start justify-between gap-3 pt-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-primary">Edit profile</h1>
          <p className="mt-1 text-sm text-secondary">
            What your plan is built from. None of it is shared.
          </p>
        </div>
        {/* Back to Profile, which is the only way in here. Home is one tap
            away in the tab bar regardless. */}
        <HeaderLink to="/profile">Back</HeaderLink>
      </header>

      {error !== null && (
        <p role="alert" className="rounded-card bg-surface p-4 text-sm text-danger">
          {error}
        </p>
      )}

      <WeightPanel
        prompt={weighInPrompt(status)}
        unitSystem={unitSystem}
        currentKg={current.data?.weightKg ?? null}
        weightAt={current.data?.weightAt ?? null}
        now={now}
        values={weighIns.map((entry) => entry.weightKg)}
        change={describeChange(trend, unitSystem)}
      />

      {/* Not drawn until the stored answers are read, so the form never opens
          blank and then fills in under somebody's thumb. */}
      {profile.data !== null && (
        <AboutYou
          unitSystem={unitSystem}
          displayName={profile.data.displayName}
          heightCm={current.data?.heightCm ?? null}
          birthDate={profile.data.birthDate}
          sex={profile.data.sex}
          country={profile.data.country}
          now={now}
        />
      )}

      <Activity level={current.data?.activityLevel ?? null} />

      <Readings entries={readings} unitSystem={unitSystem} now={now} />

      <p className="py-4 text-xs text-muted">
        Educational content, not medical advice. These numbers shape a training plan, nothing more.
      </p>
    </main>
  );
}

/**
 * The weight, the screen's hero: the last reading large on the right, the
 * trend under it, and the field that adds today's.
 */
function WeightPanel({
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
  const { log, busy } = useLogWeight(unitSystem);
  const [draft, setDraft] = useState('');
  const [problem, setProblem] = useState<string | null>(null);

  const unit = unitSystem === 'imperial' ? 'lb' : 'kg';
  const shown = currentKg === null ? null : toDisplayWeight(currentKg, unitSystem);
  const chartValues = values.map((kg) => toDisplayWeight(kg, unitSystem).value);

  async function save(event: FormEvent): Promise<void> {
    event.preventDefault();
    const failed = await log(draft);
    setProblem(failed);
    if (failed === null) setDraft('');
  }

  return (
    <Panel
      tone="hero"
      title="Weight"
      aside={
        shown !== null && (
          <>
            <StatValue text={`${String(shown.value)} ${shown.unit}`} />
            {weightAt !== null && (
              <span className="block text-xs text-muted">{describeWhen(weightAt, now)}</span>
            )}
          </>
        )
      }
    >
      {prompt !== null && (
        <div
          className={cx(
            'mt-3 flex gap-3 rounded-card p-3',
            prompt.tone === 'urgent' ? 'bg-danger/10' : 'bg-base/70',
          )}
        >
          <ScaleIcon
            aria-hidden
            className={cx(
              'mt-0.5 size-5 shrink-0',
              prompt.tone === 'urgent' ? 'text-danger' : 'text-accent',
            )}
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary">{prompt.title}</p>
            <p className="mt-0.5 text-sm text-secondary">{prompt.body}</p>
          </div>
        </div>
      )}

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

      <form
        className="mt-4 border-t border-subtle/70 pt-4"
        onSubmit={(event) => {
          void save(event);
        }}
      >
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <TextField
              label={`Today’s weight (${unit})`}
              inputMode="decimal"
              enterKeyHint="done"
              autoComplete="off"
              value={draft}
              placeholder={shown === null ? '' : String(shown.value)}
              aria-invalid={problem !== null}
              onChange={(event) => {
                setDraft(event.target.value);
                setProblem(null);
              }}
            />
          </div>
          <Button type="submit" disabled={busy || draft.trim() === ''}>
            Save weight
          </Button>
        </div>
        {/* Under the row rather than inside the field, so the button stays
            level with the box it saves. */}
        {problem !== null && (
          <p role="alert" className="mt-1.5 text-sm text-danger">
            {problem}
          </p>
        )}
      </form>
    </Panel>
  );
}

/**
 * Who you are, as one form: the stored answers already in the fields, one
 * Save for whatever was changed.
 *
 * Each field holds null until it is touched and shows what is stored, so Save
 * lights up only once something differs, and saves only what does. After a
 * save every field goes back to null and shows the newly stored answer. Height
 * is a new `body_metrics` row, like every measurement; the rest are `profiles`.
 */
function AboutYou({
  unitSystem,
  displayName,
  heightCm,
  birthDate,
  sex,
  country,
  now,
}: {
  readonly unitSystem: UnitSystem;
  readonly displayName: string | null;
  readonly heightCm: number | null;
  readonly birthDate: Date | null;
  readonly sex: Sex | null;
  readonly country: string | null;
  readonly now: Date;
}) {
  const { write, busy } = useWrite();
  const heightUnit = unitSystem === 'imperial' ? 'in' : 'cm';

  const stored = {
    name: displayName ?? '',
    height: heightCm === null ? '' : String(toDisplayHeight(heightCm, unitSystem).value),
    dob: birthDate === null ? '' : toDateOnly(birthDate),
  };

  const [name, setName] = useState<string | null>(null);
  const [height, setHeight] = useState<string | null>(null);
  const [dob, setDob] = useState<string | null>(null);
  // Boxed, because "Rather not say" is a real answer and it is null.
  const [place, setPlace] = useState<{ readonly value: string | null } | null>(null);
  const [chosenSex, setChosenSex] = useState<Sex | null>(null);
  const [problems, setProblems] = useState<{ height?: string; dob?: string }>({});
  const [saved, setSaved] = useState(false);

  const changed = {
    name: isEdited(name, stored.name),
    height: isEdited(height, stored.height),
    dob: isEdited(dob, stored.dob),
    country: place !== null && place.value !== country,
    sex: chosenSex !== null && chosenSex !== sex,
  };
  const dirty = Object.values(changed).some(Boolean);

  // "Saved" is said once, beside the button, and then goes.
  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => {
      setSaved(false);
    }, 2500);
    return () => {
      clearTimeout(timer);
    };
  }, [saved]);

  // The age under the date follows what is typed, before it is saved.
  const typedBorn = changed.dob && dob !== null ? readBirthDate(dob, now) : null;
  const age = ageFrom(
    typedBorn !== null && 'value' in typedBorn ? typedBorn.value : birthDate,
    now,
  );

  async function save(event: FormEvent): Promise<void> {
    event.preventDefault();
    const readH = changed.height && height !== null ? readHeight(height, unitSystem) : null;
    const readD = typedBorn;
    const found = {
      ...(readH !== null && 'problem' in readH ? { height: readH.problem } : {}),
      ...(readD !== null && 'problem' in readD ? { dob: readD.problem } : {}),
    };
    setProblems(found);
    if (Object.keys(found).length > 0) return;

    const result = await write(async (r) => {
      await r.profile.update({
        ...(changed.name && name !== null ? { displayName: name } : {}),
        ...(readD !== null && 'value' in readD ? { birthDate: readD.value } : {}),
        ...(changed.country && place !== null ? { country: place.value } : {}),
        ...(changed.sex && chosenSex !== null ? { sex: chosenSex } : {}),
      });
      // A new row rather than an edit, like every other measurement. Height
      // rarely changes, but somebody who is still growing has a real series.
      if (readH !== null && 'value' in readH) {
        await r.bodyMetrics.record({ heightCm: readH.value });
      }
      return true;
    });
    if (result === null) return;
    setName(null);
    setHeight(null);
    setDob(null);
    setPlace(null);
    setChosenSex(null);
    setSaved(true);
  }

  return (
    <Panel title="About you">
      <form
        className="mt-3 flex flex-col gap-4"
        onSubmit={(event) => {
          void save(event);
        }}
      >
        <TextField
          label="Your name"
          autoComplete="given-name"
          value={name ?? stored.name}
          hint="What the home screen greets you by, and what friends see."
          onChange={(event) => {
            setName(event.target.value);
          }}
        />

        {/* Side by side: two short answers, and the date field's own picker
            needs no more width than half the card. */}
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label={`Height (${heightUnit})`}
            inputMode="decimal"
            autoComplete="off"
            value={height ?? stored.height}
            error={problems.height}
            onChange={(event) => {
              setHeight(event.target.value);
              setProblems(({ dob: kept }) => (kept === undefined ? {} : { dob: kept }));
            }}
          />
          <TextField
            label="Date of birth"
            type="date"
            value={dob ?? stored.dob}
            max={toDateOnly(now)}
            error={problems.dob}
            hint={age === null ? undefined : `You are ${String(age)}`}
            onChange={(event) => {
              setDob(event.target.value);
              setProblems(({ height: kept }) => (kept === undefined ? {} : { height: kept }));
            }}
          />
        </div>

        {/* Answered at signup, changeable here: somebody who skipped it then,
            or who has moved, should not need a new account. The only place a
            country is set, since the flag beside the name says it (ADR-0080). */}
        <CountryPicker
          value={place === null ? country : place.value}
          disabled={busy}
          label="Where you are from"
          hint="Your flag on your profile, and a hello in your language on Home."
          onChange={(next) => {
            setPlace({ value: next });
          }}
        />

        {/* Answered once, at signup, and not editable afterwards. Anybody with
            no answer on file — accounts from before the welcome flow — is
            still offered the choice. What it is for is said where it is
            asked: it changes the rates quoted back, never how much training. */}
        {sex === null ? (
          <fieldset className="border-0 p-0">
            <legend className="text-sm font-medium text-secondary">Sex</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {SEXES.map((option) => (
                <Chip
                  key={option}
                  selected={chosenSex === option}
                  disabled={busy}
                  onClick={() => {
                    setChosenSex(option);
                  }}
                >
                  {SEX_LABELS[option]}
                </Chip>
              ))}
            </div>
            <p className="mt-2 text-sm text-muted">
              Used to quote realistic rates of gain and loss. It never changes how much training you
              are given.
            </p>
          </fieldset>
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-control bg-base/70 px-3 py-2.5">
            <span className="text-sm font-medium text-secondary">Sex</span>
            <span className="text-right">
              <span className="block text-base font-medium text-primary">{SEX_LABELS[sex]}</span>
              <span className="block text-xs text-muted">Set when you signed up</span>
            </span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-subtle/70 pt-4">
          {/* Polite, so the confirmation is read out without moving focus. */}
          <p aria-live="polite" className="min-w-0 flex-1 text-sm text-success">
            {saved && !dirty && (
              <span className="inline-flex items-center gap-1.5">
                <CheckIcon aria-hidden className="size-4" />
                Saved
              </span>
            )}
          </p>
          <Button type="submit" disabled={busy || !dirty}>
            Save changes
          </Button>
        </div>
      </form>
    </Panel>
  );
}

/**
 * The week outside the gym, as a list with what each answer means under it.
 *
 * Saved as soon as it is picked, as a choice in Settings is: there is nothing
 * to type and nothing to get wrong. Outside the gym on purpose — training is
 * already counted by the log, and asking about it here would count it twice.
 */
function Activity({ level }: { readonly level: ActivityLevel | null }) {
  const { write, busy } = useWrite();
  const name = useId();

  return (
    <Panel title="Outside the gym">
      <p className="mt-1 text-sm text-muted">
        Your average week away from training. Workouts are counted from your log.
      </p>
      <div
        role="radiogroup"
        aria-label="Your week outside the gym"
        className="mt-3 flex flex-col gap-2"
      >
        {ACTIVITY_LEVELS.map((option) => {
          const selected = level === option;
          return (
            <label
              key={option}
              className={cx(
                'flex min-h-tap cursor-pointer items-center gap-3 rounded-card border px-3 py-2.5 transition-colors duration-150',
                'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent',
                selected ? 'border-accent/60 bg-accent/10' : 'border-subtle active:bg-elevated',
              )}
            >
              <input
                type="radio"
                name={name}
                value={option}
                checked={selected}
                disabled={busy}
                onChange={() => {
                  void write((r) => r.bodyMetrics.record({ activityLevel: option }));
                }}
                className="sr-only"
              />
              <span
                aria-hidden
                className={cx(
                  'flex size-5 shrink-0 items-center justify-center rounded-full border-2',
                  selected ? 'border-accent' : 'border-strong',
                )}
              >
                {selected && <span className="size-2.5 rounded-full bg-accent" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-medium text-primary">
                  {ACTIVITY_LABELS[option]}
                </span>
                <span className="block text-xs text-muted">{ACTIVITY_DESCRIPTIONS[option]}</span>
              </span>
            </label>
          );
        })}
      </div>
    </Panel>
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
    <Panel title="Recent readings">
      <p className="mt-1 text-sm text-muted">
        Nothing here is overwritten. Remove a reading only if it was typed wrong: a removed one
        leaves a gap in the trend.
      </p>

      <ul className="mt-2 flex flex-col">
        {recent.map((entry) => {
          const line = summarise(entry, unitSystem);
          const when = describeWhen(entry.recordedAt, now);
          return (
            <li
              key={entry.id}
              className="flex items-center justify-between gap-3 border-b border-subtle/70 py-1.5 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="numeric truncate text-base text-primary">{line}</p>
                <p className="text-xs text-muted">{when}</p>
              </div>
              <button
                type="button"
                aria-label={`Remove ${line}, ${when}`}
                disabled={busy}
                onClick={() => {
                  void write((r) => r.bodyMetrics.remove(entry.id));
                }}
                className="inline-flex size-tap shrink-0 items-center justify-center rounded-full text-destructive transition-colors duration-150 active:bg-danger/15 focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50"
              >
                <TrashIcon aria-hidden className="size-5" />
              </button>
            </li>
          );
        })}
      </ul>
    </Panel>
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
