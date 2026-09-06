import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import type { Exercise, MuscleRole } from '@g7m/db';
import { useCatalogue } from '../lib/db/use-catalogue.js';

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

  const detail = useCatalogue(`exercise:${slug}`, async (repositories) => {
    const exercise = await repositories.exercises.bySlug(slug);
    if (exercise === null) return null;

    const [involvement, equipment, muscles] = await Promise.all([
      repositories.exercises.musclesFor(exercise.id),
      repositories.exercises.equipmentFor(exercise.id),
      repositories.muscles.list(),
    ]);

    const nameById = new Map(muscles.map((muscle) => [muscle.id, muscle.commonName]));
    return {
      exercise,
      equipment,
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
        <Link
          to="/exercises"
          className="inline-flex min-h-tap items-center text-sm text-secondary underline-offset-4 hover:underline"
        >
          ← All exercises
        </Link>
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
}: {
  readonly exercise: Exercise;
  readonly muscles: readonly Involvement[];
  readonly equipment: readonly { readonly equipmentId: string; readonly name: string }[];
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
