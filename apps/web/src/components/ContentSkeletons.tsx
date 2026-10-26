import { Skeleton } from '@g7m/ui';
import { LoadingRegion } from './LoadingRegion.js';

/** Shared copy proportions, also used inside noninteractive card shapes. */
export function SkeletonLines() {
  return (
    <div className="flex-1 space-y-2 py-1">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function TextSkeleton({
  label,
  className,
}: {
  readonly label: string;
  readonly className?: string;
}) {
  return (
    <LoadingRegion label={label} className={className}>
      <SkeletonLines />
    </LoadingRegion>
  );
}

export function ExerciseRowsSkeleton({ charts = false }: { readonly charts?: boolean }) {
  return (
    <LoadingRegion label="Loading exercises…">
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex items-center gap-3 rounded-card bg-surface px-4 py-3">
            <Skeleton className="size-14 shrink-0 rounded-card" />
            <SkeletonLines />
            {charts && <Skeleton className="h-10 w-20 shrink-0" />}
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}

export function BodySkeleton({ className = 'h-80' }: { readonly className?: string }) {
  return (
    <LoadingRegion label="Loading body view…">
      <div className={`flex items-center justify-center ${className}`}>
        <Skeleton className="skeleton-body" />
      </div>
    </LoadingRegion>
  );
}

export function FriendsSkeleton({ tab = 'friends' }: { readonly tab?: string }) {
  const rows = tab === 'leaderboard' ? 5 : 3;
  return (
    <LoadingRegion
      label={
        tab === 'leaderboard'
          ? 'Loading leaderboard…'
          : tab === 'requests'
            ? 'Loading requests…'
            : 'Loading friends…'
      }
    >
      <div className="flex flex-col gap-3">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="skeleton-card">
            <div className="flex items-center gap-3">
              <Skeleton className="size-12 shrink-0 rounded-full" />
              <SkeletonLines />
              {tab === 'leaderboard' && <Skeleton className="h-6 w-12" />}
            </div>
            {tab !== 'leaderboard' && (
              <Skeleton
                className={
                  tab === 'friends'
                    ? 'mt-4 h-16 w-full rounded-card'
                    : 'mt-3 h-10 w-32 rounded-full'
                }
              />
            )}
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}

export function NumbersSkeleton() {
  return (
    <LoadingRegion label="Loading your numbers…">
      <div className="grid grid-cols-2">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="space-y-2 py-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-24" />
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}
