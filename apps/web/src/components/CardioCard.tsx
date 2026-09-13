import { useEffect, useState } from 'react';
import { Button, TextField } from '@g7m/ui';
import {
  BOUT_FIELDS,
  boutCalories,
  boutPace,
  distanceUnitFor,
  formatDuration,
  kmhToUnit,
  metresToUnit,
  parseDuration,
  speedUnitFor,
  unitToKmh,
  unitToMetres,
  type Bout,
  type BoutField,
  type CardioKind,
  type UnitSystem,
} from '@g7m/core';
import type { SessionSet } from '@g7m/db';
import {
  caloriesText,
  describeCalorieSource,
  fieldLabel,
  parseNumberField,
} from '../screens/bout-copy.js';
import { clearTimer, elapsedSeconds, readTimer, startTimer } from '../screens/bout-timer.js';

/**
 * A cardio machine in a workout: bouts instead of sets. ADR-0069.
 *
 * A bout is one stretch on the machine. Its time comes from the timer — start
 * when you get on, stop when you get off — or from the display, typed in; the
 * other fields are the ones this machine's display shows, and nothing else.
 * Calories are estimated as the numbers go in, and the machine's own figure
 * replaces the estimate when typed.
 *
 * What it deliberately has not got: a rest timer after a bout (intervals are
 * timed by the machine, not by the phone), the effort question, and records.
 */
export function CardioCard({
  name,
  kind,
  sets,
  anchorId,
  unitSystem,
  bodyweightKg,
  past,
  busy,
  onAddBout,
  onSave,
  onComplete,
  onUncomplete,
  onRemoveBout,
  onRemove,
}: {
  readonly name: string;
  readonly kind: CardioKind;
  readonly sets: readonly SessionSet[];
  readonly anchorId: string;
  readonly unitSystem: UnitSystem;
  readonly bodyweightKg: number | null;
  /** A workout logged afterwards: no timer, only the display's numbers. */
  readonly past: boolean;
  readonly busy: boolean;
  readonly onAddBout: () => void;
  readonly onSave: (setId: string, bout: Partial<Bout>) => void;
  readonly onComplete: (setId: string, bout: Partial<Bout>) => void;
  readonly onUncomplete: (setId: string) => void;
  readonly onRemoveBout: (setId: string) => void;
  readonly onRemove: () => void;
}) {
  return (
    <section id={anchorId} className="scroll-mt-4 rounded-card bg-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-primary">{name}</h2>
          <p className="text-xs text-muted">Cardio</p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={onRemove}
          className="inline-flex min-h-tap shrink-0 items-center rounded-control border border-subtle bg-elevated px-3 text-sm font-medium text-secondary select-none active:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50"
        >
          Remove
        </button>
      </div>

      {bodyweightKg === null && (
        <p className="mb-3 text-sm text-muted">
          Calories need your bodyweight. Add it in Your profile and they will be worked out.
        </p>
      )}

      {sets.length === 0 ? (
        <p className="mb-3 text-sm text-muted">No bouts yet. Add one when you get on.</p>
      ) : (
        <ul className="mb-3 flex flex-col gap-3">
          {sets.map((set, index) => (
            <li key={set.id}>
              <BoutRow
                key={set.id}
                index={index}
                set={set}
                kind={kind}
                unitSystem={unitSystem}
                bodyweightKg={bodyweightKg}
                past={past}
                onSave={(bout) => {
                  onSave(set.id, bout);
                }}
                onComplete={(bout) => {
                  onComplete(set.id, bout);
                }}
                onUncomplete={() => {
                  onUncomplete(set.id);
                }}
                onRemove={() => {
                  clearTimer(set.id);
                  onRemoveBout(set.id);
                }}
              />
            </li>
          ))}
        </ul>
      )}

      {/* Not disabled while saving, for the reason BoutRow gives: it is the
          next thing tapped after typing, and a swallowed tap reads as broken. */}
      <Button variant="secondary" fullWidth onClick={onAddBout}>
        Add bout
      </Button>
    </section>
  );
}

type Drafts = Record<BoutField | 'time' | 'calories', string>;

/** The bout as the fields show it: in this unit system, empty where unrecorded. */
function draftsFrom(bout: Bout, kind: CardioKind, unitSystem: UnitSystem): Drafts {
  const text = (value: number | null, decimals: number): string =>
    value === null ? '' : String(Number(value.toFixed(decimals)));
  const distanceUnit = distanceUnitFor(kind, unitSystem);
  return {
    time: bout.durationSeconds === null ? '' : formatDuration(bout.durationSeconds),
    distance:
      bout.distanceM === null
        ? ''
        : text(metresToUnit(bout.distanceM, distanceUnit), distanceUnit === 'm' ? 0 : 2),
    speed:
      bout.speedKmh === null ? '' : text(kmhToUnit(bout.speedKmh, speedUnitFor(unitSystem)), 1),
    incline: text(bout.inclinePercent, 1),
    level: text(bout.resistanceLevel, 1),
    watts: text(bout.avgWatts, 0),
    floors: text(bout.floors, 0),
    calories: text(bout.caloriesKcal, 0),
  };
}

/**
 * The drafts back into a bout, or the name of the first field that is not a
 * number — which is not saved, because an empty box and a typo mean different
 * things: the first clears the field, the second must not.
 */
function boutFrom(
  drafts: Drafts,
  kind: CardioKind,
  unitSystem: UnitSystem,
): { readonly bout: Partial<Bout> } | { readonly invalid: string } {
  const numbers: Partial<Record<BoutField | 'calories', number | null>> = {};
  for (const field of [...BOUT_FIELDS[kind], 'calories'] as const) {
    const parsed = parseNumberField(drafts[field]);
    if (parsed === 'invalid') return { invalid: field };
    numbers[field] = parsed;
  }
  const time = drafts.time.trim() === '' ? null : parseDuration(drafts.time);
  if (drafts.time.trim() !== '' && time === null) return { invalid: 'time' };

  const offered = new Set(BOUT_FIELDS[kind]);
  const distance = numbers.distance ?? null;
  const speed = numbers.speed ?? null;
  return {
    bout: {
      durationSeconds: time,
      ...(offered.has('distance')
        ? {
            distanceM:
              distance === null ? null : unitToMetres(distance, distanceUnitFor(kind, unitSystem)),
          }
        : {}),
      ...(offered.has('speed')
        ? { speedKmh: speed === null ? null : unitToKmh(speed, speedUnitFor(unitSystem)) }
        : {}),
      ...(offered.has('incline') ? { inclinePercent: numbers.incline ?? null } : {}),
      ...(offered.has('level') ? { resistanceLevel: numbers.level ?? null } : {}),
      ...(offered.has('watts') ? { avgWatts: numbers.watts ?? null } : {}),
      ...(offered.has('floors') ? { floors: numbers.floors ?? null } : {}),
      caloriesKcal: numbers.calories ?? null,
    },
  };
}

/**
 * One bout's fields and buttons.
 *
 * Nothing in it is disabled while a save is in flight, on purpose. Leaving a
 * box saves the bout, and the next thing touched is already on its way: a
 * disabled box drops what is typed into it, and a disabled tick swallows the
 * tap that follows straight after typing — on an iPhone, where tapping a
 * button does not move focus first, that was every tap. The tick sends the
 * whole bout, so it cannot race the save before it into a wrong answer.
 */
function BoutRow({
  index,
  set,
  kind,
  unitSystem,
  bodyweightKg,
  past,
  onSave,
  onComplete,
  onUncomplete,
  onRemove,
}: {
  readonly index: number;
  readonly set: SessionSet;
  readonly kind: CardioKind;
  readonly unitSystem: UnitSystem;
  readonly bodyweightKg: number | null;
  readonly past: boolean;
  readonly onSave: (bout: Partial<Bout>) => void;
  readonly onComplete: (bout: Partial<Bout>) => void;
  readonly onUncomplete: () => void;
  readonly onRemove: () => void;
}) {
  const [drafts, setDrafts] = useState<Drafts>(() => draftsFrom(set.bout, kind, unitSystem));
  const [problem, setProblem] = useState<string | null>(null);
  const [timer, setTimer] = useState(() => (past ? null : readTimer(set.id)));
  const [now, setNow] = useState(() => Date.now());
  const label = `bout ${String(index + 1)}`;

  // Ticks only while the timer runs; the time itself comes from the clock.
  useEffect(() => {
    if (timer === null) return;
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 500);
    return () => {
      clearInterval(interval);
    };
  }, [timer]);

  const running = timer !== null ? elapsedSeconds(timer, now) : null;
  const shown: Drafts = running === null ? drafts : { ...drafts, time: formatDuration(running) };

  const parsed = boutFrom(shown, kind, unitSystem);
  const live: Bout = 'bout' in parsed ? { ...set.bout, ...parsed.bout } : set.bout;
  const estimate = boutCalories(kind, { ...live, caloriesKcal: null }, bodyweightKg);
  const pace = boutPace(kind, live, unitSystem);

  /** Save what the fields say, or say which one is not a number. */
  const commit = (then: (bout: Partial<Bout>) => void): void => {
    const result = boutFrom(shown, kind, unitSystem);
    if ('invalid' in result) {
      setProblem(
        result.invalid === 'time'
          ? 'Time is minutes, or minutes:seconds like 25:30.'
          : `${fieldName(result.invalid, kind, unitSystem)} is not a number.`,
      );
      return;
    }
    setProblem(null);
    then(result.bout);
  };

  const stopTimer = (): void => {
    if (running === null) return;
    clearTimer(set.id);
    setTimer(null);
    const next = { ...drafts, time: formatDuration(running) };
    setDrafts(next);
    const result = boutFrom(next, kind, unitSystem);
    if ('bout' in result) onSave(result.bout);
  };

  const field = (name: keyof Drafts, labelText: string) => (
    <TextField
      label={labelText}
      inputMode={name === 'time' ? 'text' : 'decimal'}
      value={shown[name]}
      // Never disabled for a save. Leaving a box saves the bout, and the next
      // box is already focused by then: disabling it for the write dropped
      // what was typed into it, and on an iPhone closes the keyboard. Only
      // the time locks, and only while the timer is writing it.
      disabled={name === 'time' && running !== null}
      placeholder={name === 'time' ? 'mm:ss' : undefined}
      onChange={(event) => {
        setDrafts((current) => ({ ...current, [name]: event.target.value }));
      }}
      onBlur={() => {
        commit(onSave);
      }}
    />
  );

  return (
    <div className="rounded-control border border-subtle p-3">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-secondary">Bout {String(index + 1)}</span>
        {pace !== null && <span className="numeric text-xs text-muted">{pace}</span>}
      </div>

      <div className="flex items-stretch gap-2">
        <div
          className={`grid min-w-0 flex-1 grid-cols-2 gap-2 ${set.isCompleted ? 'opacity-60' : ''}`}
        >
          <div className="col-span-2 flex items-end gap-2">
            <div className="min-w-0 flex-1">{field('time', 'Time')}</div>
            {!past && !set.isCompleted && (
              <button
                type="button"
                onClick={() => {
                  if (running !== null) {
                    stopTimer();
                    return;
                  }
                  setTimer(startTimer(set.id, parseDuration(drafts.time) ?? 0, Date.now()));
                  setNow(Date.now());
                }}
                className={
                  running === null
                    ? 'min-h-tap shrink-0 rounded-control border border-strong px-4 text-sm font-medium text-primary active:bg-elevated'
                    : 'min-h-tap shrink-0 rounded-control bg-accent px-4 text-sm font-medium text-on-accent'
                }
              >
                {running === null ? 'Start' : 'Stop'}
              </button>
            )}
          </div>
          {BOUT_FIELDS[kind].map((name) => (
            <div key={name} className="min-w-0">
              {field(name, fieldLabel(name, kind, unitSystem))}
            </div>
          ))}
          <div className="col-span-2">
            <TextField
              label="Calories"
              inputMode="numeric"
              value={shown.calories}
              placeholder={estimate === null ? '' : `≈ ${String(estimate.kcal)}`}
              hint={
                shown.calories.trim() !== ''
                  ? 'From the machine. Clear it to use the estimate.'
                  : estimate === null
                    ? 'Add the time to estimate them, or type what the machine says.'
                    : `${caloriesText(estimate)}. ${describeCalorieSource(estimate.method, kind)} Type the machine’s figure to use it instead.`
              }
              onChange={(event) => {
                setDrafts((current) => ({ ...current, calories: event.target.value }));
              }}
              onBlur={() => {
                commit(onSave);
              }}
            />
          </div>
        </div>

        <button
          type="button"
          aria-label={set.isCompleted ? `Undo ${label}` : `Complete ${label}`}
          aria-pressed={set.isCompleted}
          onClick={() => {
            if (set.isCompleted) {
              onUncomplete();
              return;
            }
            if (running !== null) {
              clearTimer(set.id);
              setTimer(null);
              setDrafts((current) => ({ ...current, time: formatDuration(running) }));
            }
            commit(onComplete);
          }}
          className={
            set.isCompleted
              ? 'flex w-tap shrink-0 items-center justify-center self-stretch rounded-control bg-accent text-2xl text-on-accent'
              : 'flex w-tap shrink-0 items-center justify-center self-stretch rounded-control border border-strong text-2xl text-secondary active:bg-elevated'
          }
        >
          ✓
        </button>
      </div>

      {problem !== null && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {problem}
        </p>
      )}

      <div className="mt-2 flex items-center justify-end gap-4">
        {!set.isCompleted && (
          <button
            type="button"
            onClick={() => {
              commit(onSave);
            }}
            className="text-xs text-muted underline-offset-4 hover:underline"
          >
            Save without ticking
          </button>
        )}
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-muted underline-offset-4 hover:underline"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

/** A field's name without its unit, for an error message. */
function fieldName(field: string, kind: CardioKind, unitSystem: UnitSystem): string {
  if (field === 'calories') return 'Calories';
  return fieldLabel(field as BoutField, kind, unitSystem).replace(/\s*\(.*\)$/, '');
}
