import { t } from '@g7m/i18n';
import { Skeleton } from '@g7m/ui';
import { Link } from 'react-router';
import {
  BodySkeleton,
  ExerciseRowsSkeleton,
  FriendsSkeleton,
  NumbersSkeleton,
  TextSkeleton,
  SkeletonLines,
} from './ContentSkeletons.js';
import { LoadingRegion } from './LoadingRegion.js';

export function StartupSkeleton() {
  return (
    <main className="account-screen">
      <TextSkeleton label={t().app.loadingStates.account} />
    </main>
  );
}

export function WorkoutSkeleton() {
  return (
    <main className="skeleton-screen pb-32">
      <header className="flex items-baseline justify-between gap-4 pt-6 pb-2">
        <h1 className="text-2xl font-semibold text-primary">{t().app.loadingStates.train}</h1>
        <Link
          to="/"
          className="inline-flex min-h-tap items-center text-sm font-medium text-accent focus-visible:outline-2 focus-visible:outline-accent"
        >
          Home
        </Link>
      </header>
      <LoadingRegion label={t().app.loadingStates.workout}>
        <div className="space-y-4">
          {[0, 1].map((index) => (
            <div key={index} className="skeleton-card space-y-4">
              <SkeletonLines />
              {[0, 1, 2].map((row) => (
                <Skeleton key={row} className="h-12 w-full" />
              ))}
            </div>
          ))}
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
      </LoadingRegion>
    </main>
  );
}

/** Only lightweight shapes: never import the destination's screen or charts. */
export function RouteSkeleton({
  pathname,
  tab,
}: {
  readonly pathname: string;
  readonly tab: string | null;
}) {
  const title =
    pathname === '/learn'
      ? t().app.tabs.learn
      : pathname === '/friends'
        ? t().app.tabs.friends
        : pathname === '/profile'
          ? t().app.loadingStates.yourProfile
          : t().app.loadingStates.exercises;
  return (
    <main className={`skeleton-screen pb-safe-bottom skeleton-${pathname.slice(1)}`}>
      <header className="pt-6">
        <h1 className="text-3xl font-bold text-primary">{title}</h1>
      </header>
      {pathname === '/learn' ? (
        <BodySkeleton className="h-[52vh]" />
      ) : pathname === '/friends' ? (
        <FriendsSkeleton tab={tab ?? 'friends'} />
      ) : pathname === '/profile' ? (
        <>
          <TextSkeleton label={t().app.loadingStates.profile} className="skeleton-card" />
          <NumbersSkeleton />
          <BodySkeleton />
        </>
      ) : (
        <ExerciseRowsSkeleton charts />
      )}
    </main>
  );
}
