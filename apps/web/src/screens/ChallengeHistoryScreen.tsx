import { Link, useSearchParams } from 'react-router';
import { Button, SegmentedControl } from '@g7m/ui';
import { ChallengeCard } from '../components/Challenges.js';
import { Panel } from '../components/Panel.js';
import { ChevronRightIcon, TrophyIcon } from '../components/icons.js';
import { fetchChallengeHistory, type ChallengeFilter } from '../lib/friends/api.js';
import { useRemote } from '../lib/friends/use-friends-data.js';
import { useCatalogue } from '../lib/db/use-catalogue.js';
import { useOnline } from '../lib/use-online.js';
import { challengeCard } from './challenges-view.js';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'win', label: 'Wins' },
  { value: 'loss', label: 'Losses' },
  { value: 'draw', label: 'Draws' },
] as const;
const noop = () => {
  /* History cards have no mutation controls. */
};

export function ChallengeRecordLink() {
  const online = useOnline();
  const state = useRemote('challenge-record', online, fetchChallengeHistory);
  return (
    <Link
      to="/profile/challenges"
      className="block rounded-sheet focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
    >
      <Panel title="Challenge record">
        <div className="flex items-center gap-3 py-2">
          <TrophyIcon aria-hidden className="challenge-gold size-9 shrink-0" />
          <div className="min-w-0 flex-1">
            {state.data ? (
              <RecordTotals
                wins={state.data.wins}
                losses={state.data.losses}
                draws={state.data.draws}
              />
            ) : (
              <p className="text-sm text-secondary">
                {!online
                  ? 'Connect to see your record'
                  : state.error
                    ? 'Open to retry loading your record'
                    : 'Loading your record…'}
              </p>
            )}
          </div>
          <ChevronRightIcon aria-hidden className="size-5 shrink-0 text-muted" />
        </div>
      </Panel>
    </Link>
  );
}

function RecordTotals({
  wins,
  losses,
  draws,
}: {
  readonly wins: number;
  readonly losses: number;
  readonly draws: number;
}) {
  return (
    <dl className="grid grid-cols-3 gap-3">
      {[
        { label: 'Wins', value: wins },
        { label: 'Losses', value: losses },
        { label: 'Draws', value: draws },
      ].map(({ label, value }) => (
        <div key={label}>
          <dt className="text-xs text-muted">{label}</dt>
          <dd className="numeric text-xl font-bold text-primary">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ChallengeHistoryScreen() {
  const [params, setParams] = useSearchParams();
  const candidate = params.get('result');
  const filter: ChallengeFilter =
    candidate === 'win' || candidate === 'loss' || candidate === 'draw' ? candidate : 'all';
  const page = Number(params.get('page') ?? 1);
  const offset = Number.isSafeInteger(page) && page > 0 ? (Math.min(page, 100_000) - 1) * 20 : 0;
  return (
    <ChallengeHistoryPage
      key={`${filter}:${offset}`}
      filter={filter}
      offset={offset}
      onFilter={(value) => {
        setParams(value === 'all' ? {} : { result: value });
      }}
      onPage={(value) => {
        globalThis.scrollTo(0, 0);
        setParams({
          ...(filter === 'all' ? {} : { result: filter }),
          page: String(value / 20 + 1),
        });
      }}
    />
  );
}

function ChallengeHistoryPage({
  filter,
  offset,
  onFilter,
  onPage,
}: {
  readonly filter: ChallengeFilter;
  readonly offset: number;
  readonly onFilter: (value: ChallengeFilter) => void;
  readonly onPage: (value: number) => void;
}) {
  const online = useOnline();
  const profile = useCatalogue('challenge-history-units', (r) => r.profile.current());
  const state = useRemote(`challenge-history:${filter}:${offset}`, online, () =>
    fetchChallengeHistory(filter, offset),
  );
  // Page navigation intentionally shows one page at a time: no unbounded list,
  // and a failed next-page request cannot mix rows from two filters.
  const current = state.data;
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-5 px-4 pt-safe-top pb-safe-bottom">
      <header className="pt-6">
        <Link
          to="/profile"
          className="inline-flex min-h-tap items-center text-sm text-secondary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-accent"
        >
          Your profile
        </Link>
        <h1 className="text-3xl font-bold text-primary">Challenge history</h1>
        <p className="mt-2 text-sm text-secondary">
          Your finished challenges. Scores lock 24 hours after each challenge ends.
        </p>
      </header>
      {!online ? (
        <p role="status" className="text-secondary">
          Connect to see your challenge history.
        </p>
      ) : (
        <>
          {current && (
            <Panel title="Your record">
              <RecordTotals wins={current.wins} losses={current.losses} draws={current.draws} />
            </Panel>
          )}
          <SegmentedControl
            label="Challenge results"
            options={FILTERS}
            value={filter}
            onChange={onFilter}
          />
          {state.error && (
            <div role="alert">
              <p className="text-secondary">{state.error}</p>
              <Button variant="secondary" onClick={state.reload}>
                Try again
              </Button>
            </div>
          )}
          {state.loading && (
            <p role="status" className="text-muted">
              Loading challenges…
            </p>
          )}
          {current && !state.loading && !state.error && (
            <>
              {current.challenges.length === 0 ? (
                <Panel
                  title={filter === 'all' ? 'No finished challenges yet' : 'No results here yet'}
                >
                  <p className="text-sm text-secondary">
                    {filter === 'all'
                      ? 'Challenge a friend and your results will appear here.'
                      : 'Try another result filter.'}
                  </p>
                  {filter === 'all' && (
                    <Link
                      to="/friends"
                      className="inline-flex min-h-tap items-center text-accent underline underline-offset-4"
                    >
                      Find a friend
                    </Link>
                  )}
                </Panel>
              ) : (
                <ul className="flex flex-col gap-4">
                  {current.challenges.map((challenge) => (
                    <li key={challenge.id}>
                      <ChallengeCard
                        history
                        card={challengeCard(challenge, [], {
                          now: new Date(),
                          unitSystem: profile.data?.unitSystem ?? 'metric',
                        })}
                        onChanged={noop}
                      />
                    </li>
                  ))}
                </ul>
              )}
              {(offset > 0 || current.hasMore) && (
                <nav
                  aria-label="Challenge history pages"
                  className="flex justify-between gap-4 pb-4"
                >
                  <Button
                    variant="secondary"
                    disabled={offset === 0}
                    onClick={() => onPage(Math.max(0, offset - 20))}
                  >
                    Previous
                  </Button>
                  <span className="self-center text-sm text-muted">Page {offset / 20 + 1}</span>
                  <Button
                    variant="secondary"
                    disabled={!current.hasMore}
                    onClick={() => onPage(offset + 20)}
                  >
                    Next
                  </Button>
                </nav>
              )}
            </>
          )}
        </>
      )}
    </main>
  );
}
