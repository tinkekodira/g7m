import { useMemo, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import {
  CURRENT_STRENGTH_WEEKS,
  strengthEstimate,
  toDisplayWeight,
  type OneRepMaxReading,
  type StrengthEstimate,
  type UnitSystem,
} from '@g7m/core';
import type { Exercise, MuscleRole } from '@g7m/db';
import { HeaderLink } from '../components/HeaderLink.js';
import { ChevronRightIcon } from '../components/icons.js';
import { monthName } from '../lib/date-words.js';
import { useCatalogue } from '../lib/db/use-catalogue.js';
import { describeMark } from './review-copy.js';

/**
 * One exercise, in full.
 *
 * The text is the product here, not a caption for a video. Brief §7: the cues
 * are the offline answer to "how do I do this lift", and a basement is exactly
 * where somebody needs it. So the written instructions come first and stand
 * alone, and the video — when there is one — is an extra.
 */
export function ExerciseDetailScreen() {
  const { slug = '' } = useParams();
  const now = useMemo(() => new Date(), []);

  const detail = useCatalogue(`exercise:${slug}`, async (repositories) => {
    const exercise = await repositories.exercises.bySlug(slug);
    if (exercise === null) return null;

    const [involvement, equipment, muscles, sets, profile] = await Promise.all([
      repositories.exercises.musclesFor(exercise.id),
      repositories.exercises.equipmentFor(exercise.id),
      repositories.muscles.list(),
      // Everything ever logged on it: the best-ever estimate needs all of it,
      // and one exercise's history is a few hundred rows at the most.
      repositories.history.completedSets({ exerciseId: exercise.id }),
      repositories.profile.current(),
    ]);

    const nameById = new Map(muscles.map((muscle) => [muscle.id, muscle.commonName]));
    const unitSystem: UnitSystem = profile?.unitSystem ?? 'metric';
    return {
      exercise,
      equipment,
      // A hold is timed, and seconds are not reps: no estimate for a plank.
      strength: exercise.isTimeBased ? null : strengthEstimate(sets, now),
      unitSystem,
      muscles: involvement.map((entry) => ({
        name: nameById.get(entry.muscleId) ?? 'Unknown muscle',
        role: entry.role,
        share: entry.recruitmentWeight,
      })),
    };
  });

  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col gap-4 px-4 pt-safe-top pb-safe-bottom">
      <header className="pt-6 pb-2">
        <HeaderLink to="/exercises">← All exercises</HeaderLink>
      </header>

      {detail.error !== null ? (
        <p role="alert" className="text-sm text-danger">
          {detail.error}
        </p>
      ) : detail.loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : detail.data === null ? (
        <p className="max-w-prose text-sm text-secondary">
          There is no exercise called <span className="text-primary">{slug}</span> on this device.
          It may have been renamed, or it may not have synced yet.
        </p>
      ) : (
        <ExerciseDetail
          exercise={detail.data.exercise}
          muscles={detail.data.muscles}
          equipment={detail.data.equipment}
          strength={detail.data.strength}
          unitSystem={detail.data.unitSystem}
          now={now}
        />
      )}
    </main>
  );
}

interface Involvement {
  readonly name: string;
  readonly role: MuscleRole;
  readonly share: number;
}

const ROLE_LABELS: Record<MuscleRole, string> = {
  primary: 'Prime mover',
  secondary: 'Assists',
  stabilizer: 'Stabilises',
};

function ExerciseDetail({
  exercise,
  muscles,
  equipment,
  strength,
  unitSystem,
  now,
}: {
  readonly exercise: Exercise;
  readonly muscles: readonly Involvement[];
  readonly equipment: readonly { readonly equipmentId: string; readonly name: string }[];
  readonly strength: StrengthEstimate | null;
  readonly unitSystem: UnitSystem;
  readonly now: Date;
}) {
  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold text-primary">{exercise.name}</h1>
        {exercise.aliases.length > 0 && (
          <p className="mt-1 text-sm text-secondary">Also called {exercise.aliases.join(', ')}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge>{exercise.mechanic === 'compound' ? 'Compound' : 'Isolation'}</Badge>
          <Badge>{capitalise(exercise.difficulty)}</Badge>
          {exercise.isUnilateral && <Badge>One side at a time</Badge>}
          {exercise.isTimeBased && <Badge>Held for time</Badge>}
        </div>
      </div>

      {strength?.best != null && (
        <OneRepMax exerciseId={exercise.id} strength={strength} unitSystem={unitSystem} now={now} />
      )}

      {/* First, and never behind a tap. This is what the app is for when the
          phone has no signal and the barbell is already loaded. */}
      {exercise.cues.length > 0 && (
        <Section title="Cues">
          <ul className="flex flex-col gap-2">
            {exercise.cues.map((cue) => (
              <li key={cue} className="flex gap-2 text-base text-primary">
                <span aria-hidden className="text-accent">
                  •
                </span>
                {cue}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {exercise.instructions.length > 0 && (
        <Section title="How to do it">
          <ol className="flex flex-col gap-2">
            {exercise.instructions.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm text-secondary">
                <span className="numeric shrink-0 text-muted">{index + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </Section>
      )}

      {exercise.commonMistakes.length > 0 && (
        <Section title="Common mistakes">
          <ul className="flex flex-col gap-2">
            {exercise.commonMistakes.map((mistake) => (
              <li key={mistake} className="text-sm text-secondary">
                {mistake}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Muscles worked">
        {muscles.length === 0 ? (
          <p className="text-sm text-muted">Not recorded for this exercise.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {muscles.map((muscle) => (
              <li key={`${muscle.name}-${muscle.role}`}>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-sm text-primary">{muscle.name}</span>
                  <span className="text-xs text-muted">{ROLE_LABELS[muscle.role]}</span>
                </div>
                {/* A bar rather than a percentage: recruitment weight is a
                    relative ranking, and printing "70%" would claim a
                    precision the number does not have. */}
                <div className="mt-1 h-1 w-full rounded-full bg-strong">
                  <div
                    className="h-1 rounded-full bg-accent"
                    style={{ width: `${String(Math.round(clamp(muscle.share) * 100))}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Equipment">
        {equipment.length === 0 ? (
          <p className="text-sm text-muted">Nothing at all.</p>
        ) : (
          <p className="text-sm text-secondary">{equipment.map((item) => item.name).join(', ')}</p>
        )}
      </Section>

      <Section title="Starting point">
        <div className="flex items-baseline justify-between gap-4 border-b border-subtle py-2">
          <span className="text-sm text-secondary">
            {exercise.isTimeBased ? 'Suggested hold' : 'Suggested reps'}
          </span>
          <span className="numeric text-base text-primary">
            {exercise.defaultRepLow}–{exercise.defaultRepHigh}
            {exercise.isTimeBased ? ' seconds' : ''}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-4 py-2">
          <span className="text-sm text-secondary">Rest between sets</span>
          <span className="numeric text-base text-primary">
            {exercise.defaultRestSeconds === null
              ? // Null means "derive from mechanic", and the derivation lives in
                // @g7m/core with the generator. Saying so beats printing a
                // number this screen invented.
                exercise.mechanic === 'compound'
                ? 'Longer — it is a compound'
                : 'Shorter — it is an isolation'
              : `${String(exercise.defaultRestSeconds)} seconds`}
          </span>
        </div>
      </Section>

      {/*
        Every seeded row is `none` today, deliberately: a made-up YouTube id
        renders as a broken player, which is worse than the text above, which
        stands on its own (ADR-0024). The branch exists so that adding real ids
        is a data change rather than a code change.
      */}
      {exercise.videoProvider !== 'none' && exercise.videoRef !== null && (
        <Section title="Video">
          <p className="text-sm text-secondary">
            Needs a connection. Everything above this line does not.
          </p>
        </Section>
      )}

      <footer className="py-6 text-xs text-muted">
        Educational content, not medical advice. Consult a professional before starting a program.
      </footer>
    </>
  );
}

/**
 * Roughly how much could be lifted once, from what was lifted for reps.
 *
 * Above the cues, because it is the one thing on this page that is about the
 * person reading it, and it is small. Only for an exercise somebody has
 * logged sets on that the formula means something for (see `strengthEstimate`);
 * for everything else there is no card, rather than an empty one.
 *
 * Called an estimate and treated as one. It is for choosing working weights
 * from a percentage, not a number to go and test.
 */
function OneRepMax({
  exerciseId,
  strength,
  unitSystem,
  now,
}: {
  readonly exerciseId: string;
  readonly strength: StrengthEstimate;
  readonly unitSystem: UnitSystem;
  readonly now: Date;
}) {
  const { current, best } = strength;
  const show = (kg: number): string => {
    const display = toDisplayWeight(Math.abs(kg), unitSystem);
    return `${String(display.value)} ${display.unit}`;
  };
  // An estimate does not get hundredths: to the half kilo, or the whole pound.
  const estimate = (kg: number): string => {
    const display = toDisplayWeight(kg, unitSystem);
    const rounded =
      display.unit === 'kg' ? Math.round(display.value * 2) / 2 : Math.round(display.value);
    return `${String(rounded)} ${display.unit}`;
  };
  const source = (reading: OneRepMaxReading): string =>
    `${describeMark(reading, false, show)} on ${shortDate(reading.at, now)}`;
  const shown = current ?? best;
  // Worth a second line only when the best ever is actually higher.
  const olderBest =
    best !== null && current !== null && best.estimate.valueKg > current.estimate.valueKg
      ? best
      : null;

  if (shown === null) return null;

  return (
    <section className="rounded-card border border-accent/30 bg-surface p-4">
      <h2 className="text-sm font-medium text-secondary">Your estimated one-rep max</h2>
      <p className="numeric mt-1 text-3xl font-bold text-primary">
        {estimate(shown.estimate.valueKg)}
      </p>
      <p className="mt-1 text-sm text-secondary">
        {current === null
          ? `Nothing in the last ${String(CURRENT_STRENGTH_WEEKS)} weeks, so this is your best ever, from ${source(shown)}.`
          : `From ${source(shown)}.`}
        {shown.loadType === 'bodyweight_plus' && ' Your bodyweight is included.'}
      </p>
      {olderBest !== null && (
        <p className="mt-1 text-sm text-muted">
          Best ever: {estimate(olderBest.estimate.valueKg)}, from {source(olderBest)}.
        </p>
      )}
      <p className="mt-3 text-xs text-muted">
        Worked out with the Epley formula from your best set of 12 reps or fewer. An estimate to
        pick working weights from, not a number to go and test.
      </p>
      <Link
        to={`/progress/exercise/${exerciseId}`}
        className="mt-2 inline-flex min-h-tap items-center gap-1 text-sm font-medium text-accent"
      >
        See the trend
        <ChevronRightIcon className="size-4" />
      </Link>
    </section>
  );
}

/** "3 September", with the year when it is not this one. */
function shortDate(date: Date, now: Date): string {
  const day = `${String(date.getDate())} ${monthName(date)}`;
  return date.getFullYear() === now.getFullYear() ? day : `${day} ${String(date.getFullYear())}`;
}

function Section({ title, children }: { readonly title: string; readonly children: ReactNode }) {
  return (
    <section className="rounded-card bg-surface p-4">
      <h2 className="mb-3 text-lg font-semibold text-primary">{title}</h2>
      {children}
    </section>
  );
}

function Badge({ children }: { readonly children: ReactNode }) {
  return (
    <span className="rounded-full bg-elevated px-3 py-1 text-xs text-secondary">{children}</span>
  );
}

function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Recruitment weight is meant to be 0–1, and nothing enforces that locally. */
function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}
