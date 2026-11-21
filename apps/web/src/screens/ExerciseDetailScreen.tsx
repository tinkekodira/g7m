import { formatNumber, live, t } from '@g7m/i18n';
import { useMemo, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { heatColour } from '@g7m/anatomy';
import {
  BOUT_FIELDS,
  CURRENT_STRENGTH_WEEKS,
  strengthEstimate,
  toDisplayWeight,
  type CardioKind,
  type OneRepMaxReading,
  type Sex,
  type StrengthEstimate,
  type UnitSystem,
} from '@g7m/core';
import type { Exercise, MuscleRole } from '@g7m/db';
import { ExerciseDemo } from '../components/ExerciseDemo.js';
import { ExerciseHero } from '../components/ExerciseHero.js';
import { ExerciseCueIcon } from '../components/ExerciseCueIcon.js';
import ExerciseMuscleBody from '../components/ExerciseMuscleBody.js';
import { FavouriteButton } from '../components/Favourite.js';
import { exerciseDemo } from '../components/exercise-demos.js';
import { ChevronRightIcon, DumbbellIcon, TrendIcon } from '../components/icons.js';
import { monthName } from '../lib/date-words.js';
import { scopesIn, setsAtGym } from '../lib/gym-filter.js';
import { useCatalogue, useWrite } from '../lib/db/use-catalogue.js';
import { describeMark } from './review-copy.js';
import { fieldLabel } from './bout-copy.js';

export function ExerciseDetailScreen() {
  const { slug = '' } = useParams();
  const now = useMemo(() => new Date(), []);
  const { write, busy } = useWrite();
  const detail = useCatalogue(`exercise:${slug}`, async (repositories) => {
    const exercise = await repositories.exercises.bySlug(slug);
    if (exercise === null) return null;
    const [involvement, equipment, muscles, sets, profile] = await Promise.all([
      repositories.exercises.musclesFor(exercise.id),
      repositories.exercises.equipmentFor(exercise.id),
      repositories.muscles.list(),
      repositories.history.completedSets({ exerciseId: exercise.id }),
      repositories.profile.current(),
    ]);
    const muscleById = new Map(muscles.map((muscle) => [muscle.id, muscle]));
    const unitSystem: UnitSystem = profile?.unitSystem ?? 'metric';
    return {
      exercise,
      favourite: profile?.favouriteExercises.includes(exercise.slug) ?? false,
      sex: profile?.sex ?? null,
      equipment,
      // A machine's estimate at the gym it was last done at (ADR-0179); the
      // trend screen offers the others.
      strength: exercise.isTimeBased
        ? null
        : strengthEstimate(setsAtGym(sets, scopesIn(sets)[0] ?? null), now),
      unitSystem,
      muscles: involvement.map((entry): Involvement => {
        const muscle = muscleById.get(entry.muscleId);
        return {
          name: muscle?.commonName ?? t().library.detail.unknownMuscle,
          slug: muscle?.slug ?? '',
          role: entry.role,
          share: entry.recruitmentWeight,
        };
      }),
    };
  });
  const data = detail.data;
  return (
    <main className="exercise-details mx-auto flex min-h-full max-w-2xl flex-col gap-6 px-4 pt-safe-top pb-safe-bottom">
      <header className="flex min-h-tap items-center justify-between gap-3 pt-4">
        <Link to="/exercises" className="exercise-back-link">
          ← All exercises
        </Link>
      </header>
      {detail.error !== null ? (
        <p role="alert" className="text-sm text-destructive">
          {detail.error}
        </p>
      ) : detail.loading ? (
        <p role="status" className="text-sm text-muted">
          {t().common.loading}
        </p>
      ) : data === null ? (
        <p className="max-w-prose text-sm text-secondary">{t().library.detail.missing(slug)}</p>
      ) : (
        <ExerciseDetail
          exercise={data.exercise}
          muscles={data.muscles}
          equipment={data.equipment}
          strength={data.strength}
          unitSystem={data.unitSystem}
          now={now}
          sex={data.sex}
          favourite={
            <FavouriteButton
              favourite={data.favourite}
              disabled={busy}
              onToggle={() => {
                void write((r) => r.profile.setFavourite(data.exercise.slug, !data.favourite));
              }}
            />
          }
        />
      )}
    </main>
  );
}

interface Involvement {
  readonly name: string;
  readonly slug: string;
  readonly role: MuscleRole;
  readonly share: number;
}

const ROLE_LABELS: Readonly<Record<MuscleRole, string>> = live(() => t().library.detail.roles);

function ExerciseDetail({
  exercise,
  muscles,
  equipment,
  strength,
  unitSystem,
  now,
  sex,
  favourite,
}: {
  readonly exercise: Exercise;
  readonly muscles: readonly Involvement[];
  readonly equipment: readonly { readonly equipmentId: string; readonly name: string }[];
  readonly strength: StrengthEstimate | null;
  readonly unitSystem: UnitSystem;
  readonly now: Date;
  readonly sex: Sex | null;
  readonly favourite: ReactNode;
}) {
  return (
    <>
      <div className="exercise-heading">
        <h1 className="exercise-title">{exercise.name}</h1>
        <div className="mt-3">{favourite}</div>
        {exercise.aliases.length > 0 && (
          <p className="mt-2 text-sm text-secondary">
            {t().library.detail.alsoCalled(exercise.aliases.join(', '))}
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="exercise-badge exercise-badge-primary">
            {exercise.cardioKind !== null
              ? t().library.cardio
              : exercise.mechanic === 'compound'
                ? t().library.compound
                : t().library.isolation}
          </span>
          <span className="exercise-badge">
            {t().library.detail.difficulty[exercise.difficulty]}
          </span>
          {exercise.isUnilateral && (
            <span className="exercise-badge">{t().library.detail.oneSide}</span>
          )}
          {exercise.isTimeBased && (
            <span className="exercise-badge">{t().library.detail.timed}</span>
          )}
        </div>
        <ExerciseHero slug={exercise.slug} name={exercise.name} />
      </div>

      {exercise.cardioKind === null && (
        <section aria-labelledby="exercise-starting-point" className="exercise-starting-point">
          <h2 id="exercise-starting-point" className="sr-only">
            {t().library.detail.startingPoint}
          </h2>
          <div>
            <p className="numeric exercise-starting-value">
              {exercise.defaultRepLow}–{exercise.defaultRepHigh}
              {exercise.isTimeBased && (
                <span className="text-lg">{t().library.detail.seconds}</span>
              )}
            </p>
            <p className="text-sm text-secondary">
              {exercise.isTimeBased
                ? t().library.detail.suggestedHold
                : t().library.detail.suggestedReps}
            </p>
          </div>
          <div>
            <p
              className={`numeric exercise-starting-value${exercise.defaultRestSeconds === null ? ' exercise-rest-derived' : ''}`}
            >
              {restLabel(exercise)}
            </p>
            <p className="text-sm text-secondary">{t().library.detail.rest}</p>
          </div>
        </section>
      )}

      {strength?.best != null && (
        <OneRepMax exerciseId={exercise.id} strength={strength} unitSystem={unitSystem} now={now} />
      )}

      {exercise.cues.length > 0 && (
        <section className="exercise-cues">
          <h2 className="exercise-section-title">{t().library.detail.cues}</h2>
          <ul className="divide-y divide-strong/50">
            {exercise.cues.map((cue, index) => (
              <li
                key={cue}
                className="flex items-center gap-4 py-3 text-base font-medium text-primary"
              >
                <ExerciseCueIcon slug={exercise.slug} index={index} />
                <span>{cue}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Section title={t().library.detail.muscles}>
        {exercise.cardioKind !== null ? (
          <p className="max-w-prose text-sm text-secondary">{t().library.detail.cardioMuscles}</p>
        ) : muscles.length === 0 ? (
          <p className="text-sm text-muted">{t().library.detail.notRecorded}</p>
        ) : (
          <div className="exercise-muscles">
            <ExerciseMuscleBody sex={sex} muscles={muscles} />
            <ul className="flex min-w-0 flex-col gap-4">
              {muscles.map((muscle) => (
                <li
                  key={`${muscle.slug}-${muscle.role}`}
                  style={{
                    color: heatColour(muscle.share, true),
                  }}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-primary">
                      <span
                        aria-hidden
                        className="size-2.5 shrink-0 rounded-full"
                        style={{
                          background: 'currentColor',
                          color: heatColour(muscle.share, true),
                        }}
                      />
                      {muscle.name}
                    </span>
                    <span className="shrink-0 text-xs text-muted">{ROLE_LABELS[muscle.role]}</span>
                  </div>
                  <div aria-hidden className="mt-2 h-1.5 rounded-full bg-strong">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${String(Math.round(clamp(muscle.share) * 100))}%`,
                        background: 'currentColor',
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      {(exercise.instructions.length > 0 || exerciseDemo(exercise.slug) !== null) && (
        <section className="exercise-how-to">
          <h2 className="exercise-section-title">{t().library.detail.howTo}</h2>
          <ExerciseDemo slug={exercise.slug} name={exercise.name} />
          <ol className="flex min-w-0 flex-col gap-4">
            {exercise.instructions.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm leading-relaxed text-secondary">
                <span className="numeric flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-on-accent">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {exercise.commonMistakes.length > 0 && (
        <section className="exercise-mistakes">
          <h2 className="exercise-section-title">{t().library.detail.mistakes}</h2>
          <ul className="flex flex-col gap-2">
            {exercise.commonMistakes.map((mistake) => (
              <li key={mistake} className="flex gap-2 text-sm text-secondary">
                <span aria-hidden className="text-warning">
                  •
                </span>
                {mistake}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="border-t border-subtle pt-4">
        <h2 className="mb-2 flex items-center gap-2 text-base font-semibold text-primary">
          <DumbbellIcon className="size-5 text-muted" />
          {t().library.detail.equipment}
        </h2>
        <p className="text-sm text-secondary">
          {equipment.length === 0
            ? t().library.detail.noEquipment
            : equipment.map((item) => item.name).join(', ')}
        </p>
      </section>
      {exercise.cardioKind !== null && (
        <Section title={t().library.detail.whatYouLog}>
          <p className="max-w-prose text-sm text-secondary">
            {t().library.detail.logged(loggedFields(exercise.cardioKind, unitSystem))}
          </p>
        </Section>
      )}
      {exercise.videoProvider !== 'none' && exercise.videoRef !== null && (
        <Section title={t().library.detail.video}>
          <p className="text-sm text-secondary">{t().library.detail.videoNeedsConnection}</p>
        </Section>
      )}
      <footer className="pt-2 pb-6 text-xs text-muted">{t().settings.disclaimer}</footer>
    </>
  );
}

function restLabel(exercise: Exercise): string {
  const seconds = exercise.defaultRestSeconds;
  if (seconds === null)
    return exercise.mechanic === 'compound'
      ? t().library.detail.restCompound
      : t().library.detail.restIsolation;
  return seconds % 60 === 0
    ? t().library.detail.restMinutes(seconds / 60)
    : t().library.detail.restSeconds(seconds);
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
    return `${formatNumber(display.value)} ${display.unit}`;
  };
  // An estimate does not get hundredths: to the half kilo, or the whole pound.
  const estimate = (kg: number): string => {
    const display = toDisplayWeight(kg, unitSystem);
    const rounded =
      display.unit === 'kg' ? Math.round(display.value * 2) / 2 : Math.round(display.value);
    return `${formatNumber(rounded)} ${display.unit}`;
  };
  const source = (reading: OneRepMaxReading): string =>
    t().library.detail.on(describeMark(reading, false, show), shortDate(reading.at, now));
  const shown = current ?? best;
  // Worth a second line only when the best ever is actually higher.
  const olderBest =
    best !== null && current !== null && best.estimate.valueKg > current.estimate.valueKg
      ? best
      : null;

  if (shown === null) return null;

  return (
    <section className="exercise-strength">
      <TrendIcon className="exercise-strength-icon size-7 text-accent" />
      <h2 className="text-sm font-medium text-secondary">{t().library.detail.oneRepMax}</h2>
      <p className="numeric mt-1 text-2xl font-bold text-primary">
        {estimate(shown.estimate.valueKg)}
      </p>
      <p className="mt-1 text-sm text-secondary">
        {current === null
          ? t().library.detail.nothingRecent(CURRENT_STRENGTH_WEEKS, source(shown))
          : t().library.detail.from(source(shown))}
        {shown.loadType === 'bodyweight_plus' && t().library.detail.bodyweightIncluded}
      </p>
      {olderBest !== null && (
        <p className="mt-1 text-sm text-muted">
          {t().library.detail.bestEver(estimate(olderBest.estimate.valueKg), source(olderBest))}
        </p>
      )}
      <p className="mt-3 text-xs text-muted">{t().library.detail.epley}</p>
      <Link
        to={`/progress/exercise/${exerciseId}`}
        className="exercise-trend-link inline-flex min-h-tap items-center gap-1 text-sm font-medium text-accent"
      >
        {t().library.detail.seeTrend}
        <ChevronRightIcon className="size-4" />
      </Link>
    </section>
  );
}

/** "3 September", with the year when it is not this one. */
function shortDate(date: Date, now: Date): string {
  const day = t().common.dates.dayMonth(date.getDate(), monthName(date));
  return date.getFullYear() === now.getFullYear() ? day : `${day} ${String(date.getFullYear())}`;
}

function Section({ title, children }: { readonly title: string; readonly children: ReactNode }) {
  return (
    <section>
      <h2 className="exercise-section-title">{title}</h2>
      {children}
    </section>
  );
}

/** Recruitment weight is meant to be 0–1, and nothing enforces that locally. */
function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** "Each bout records its time, distance, speed and incline." */
function loggedFields(kind: CardioKind, unitSystem: UnitSystem): string {
  const names = BOUT_FIELDS[kind].map((field) =>
    fieldLabel(field, kind, unitSystem)
      .replace(/\s*\(.*\)$/, '')
      .toLowerCase(),
  );
  return t().library.detail.eachBout([t().library.detail.itsTime, ...names]);
}
