import { useMemo } from 'react';
import { Link } from 'react-router';
import {
  DEFAULT_WEEK_START,
  describeWhen,
  personalRecords,
  recentWeeks,
  weeklyVolume,
  type PersonalRecord,
  type WeekStart,
} from '@g7m/core';
import type { SessionSummary } from '@g7m/db';
import { HeaderLink } from '../components/HeaderLink.js';
import { BarChart } from '../components/Charts.js';
import { formatVolume } from '../components/chart-scale.js';
import { useCatalogue } from '../lib/db/use-catalogue.js';

/** Three months. Long enough to show a pattern, short enough to read on a phone. */
const WEEKS_SHOWN = 12;

/**
 * Progress.
 *
 * Reads only finished sessions, so nothing here moves while somebody is
 * mid-workout — a week's bar growing under you as you train reads as a bug
 * even when the arithmetic is right.
 */
export function ProgressScreen() {
  const now = useMemo(() => new Date(), []);

  const state = useCatalogue('progress', async (repositories) => {
    const profile = await repositories.profile.current();
    const weekStartsOn = (profile?.weekStartsOn ?? DEFAULT_WEEK_START) as WeekStart;
    const weeks = recentWeeks(now, WEEKS_SHOWN, weekStartsOn);

    const [sets, summaries, exerciseNames] = await Promise.all([
      // The window starts at the first week shown, so the chart reads exactly
      // the rows it draws rather than a year of history to plot three months.
      repositories.history.completedSets({ from: weeks[0] ?? now }),
      repositories.history.sessionSummaries(20),
      repositories.history.trainedExercises(),
    ]);

    return {
      weekStartsOn,
      weeks,
      // Records are computed over the visible window, not all time. Said out
      // loud on screen, because "best ever" and "best in three months" are
      // different claims and only one of them is true here.
      records: personalRecords(sets),
      volume: weeklyVolume(sets, weeks, weekStartsOn),
      summaries,
      names: new Map(exerciseNames.map((entry) => [entry.exerciseId, entry.name])),
    };
  });

  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col gap-4 px-4 pt-safe-top pb-safe-bottom">
      <header className="flex items-baseline justify-between gap-4 pt-6 pb-2">
        <h1 className="text-2xl font-semibold text-primary">Progress</h1>
        <HeaderLink to="/">Home</HeaderLink>
      </header>

      {state.error !== null ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : state.loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : state.data === null || state.data.summaries.length === 0 ? (
        <p className="rounded-card bg-surface p-4 text-sm text-secondary">
          Nothing here yet. Finish a workout and it will show up — the charts need completed
          sessions, so the one you are part-way through does not count until you tap Finish.
        </p>
      ) : (
        <>
          <section className="rounded-card bg-surface p-4">
            <h2 className="mb-1 text-lg font-semibold text-primary">Volume</h2>
            <p className="mb-3 text-xs text-muted">
              Load times reps, over the last {String(WEEKS_SHOWN)} weeks. The final bar is the week
              you are in.
            </p>
            <BarChart
              data={state.data.volume.map((week) => ({
                label: week.week,
                value: week.volumeKg,
                caption: captionFor(week.week),
              }))}
              summary={describeVolume(state.data.volume)}
            />
          </section>

          <section className="rounded-card bg-surface p-4">
            <h2 className="mb-3 text-lg font-semibold text-primary">Recent workouts</h2>
            <ul className="flex flex-col">
              {state.data.summaries.map((summary) => (
                <li key={summary.sessionId}>
                  <SessionRow summary={summary} now={now} />
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-card bg-surface p-4">
            <h2 className="mb-1 text-lg font-semibold text-primary">Bests</h2>
            <p className="mb-3 text-xs text-muted">
              Over the last {String(WEEKS_SHOWN)} weeks, not all time.
            </p>
            <Records records={state.data.records} names={state.data.names} />
          </section>
        </>
      )}
    </main>
  );
}

function SessionRow({ summary, now }: { readonly summary: SessionSummary; readonly now: Date }) {
  const minutes =
    summary.endedAt === null
      ? null
      : Math.round((summary.endedAt.getTime() - summary.startedAt.getTime()) / 60000);

  return (
    <Link
      to={`/progress/session/${summary.sessionId}`}
      className="flex min-h-tap items-center justify-between gap-3 border-b border-subtle py-2 last:border-b-0"
    >
      <span className="text-base text-primary">
        {summary.name ?? describeWhen(summary.startedAt, now)}
      </span>
      <span className="numeric shrink-0 text-sm text-secondary">
        {summary.setCount} {summary.setCount === 1 ? 'set' : 'sets'}
        {minutes !== null && ` · ${String(minutes)} min`}
      </span>
    </Link>
  );
}

const RECORD_LABELS: Record<PersonalRecord['recordType'], string> = {
  max_weight: 'Heaviest',
  estimated_1rm: 'Best estimated 1RM',
  max_session_volume: 'Most in one session',
};

function Records({
  records,
  names,
}: {
  readonly records: readonly PersonalRecord[];
  readonly names: ReadonlyMap<string, string>;
}) {
  // One line per exercise, showing its heaviest — the whole list is three
  // entries per exercise and reads as a spreadsheet.
  const heaviest = records.filter((record) => record.recordType === 'max_weight');

  if (heaviest.length === 0) {
    return <p className="text-sm text-muted">Nothing measurable yet.</p>;
  }

  return (
    <ul className="flex flex-col">
      {heaviest.map((record) => (
        <li
          key={`${record.exerciseId}-${record.recordType}`}
          className="flex items-baseline justify-between gap-3 border-b border-subtle py-2 last:border-b-0"
        >
          <Link
            to={`/progress/exercise/${record.exerciseId}`}
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            {names.get(record.exerciseId) ?? 'Unknown exercise'}
          </Link>
          <span className="numeric shrink-0 text-sm text-secondary">
            <span className="text-muted">{RECORD_LABELS[record.recordType]} </span>
            {formatVolume(record.value)} kg
          </span>
        </li>
      ))}
    </ul>
  );
}

/** `7 Sep` becomes `7/9`, because twelve of these share a phone's width. */
function captionFor(weekKey: string): string {
  const [, month, day] = weekKey.split('-');
  if (month === undefined || day === undefined) return '';
  return `${String(Number(day))}/${String(Number(month))}`;
}

function describeVolume(weeks: readonly { week: string; volumeKg: number; sessions: number }[]) {
  const trained = weeks.filter((week) => week.sessions > 0).length;
  const total = weeks.reduce((sum, week) => sum + week.volumeKg, 0);
  return `Weekly training volume. ${String(trained)} of the last ${String(weeks.length)} weeks had a workout in them, ${formatVolume(total)} kg in total.`;
}
