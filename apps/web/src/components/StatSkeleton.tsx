/**
 * A month card's own shape while it is on its way, so nothing below it jumps.
 *
 * Two waits share it: the cards' code arriving (they are their own chunk, kept
 * out of the entry Home is drawn from, ADR-0120) and the month being read.
 * Its own file so the first can show it without loading the second.
 */
import { Skeleton } from '@g7m/ui';
import { LoadingRegion } from './LoadingRegion.js';

export function StatSkeleton() {
  return (
    <LoadingRegion label="Loading this month…">
      <div className="skeleton-card flex min-h-[18.5rem] flex-col">
        <div className="flex items-start gap-3">
          <Skeleton className="size-10 rounded-card" />
          <div className="flex-1 space-y-2 pt-1">
            <Skeleton className="h-2.5 w-24 rounded-full" />
            <Skeleton className="h-4 w-28 rounded-full" />
          </div>
          <Skeleton className="h-7 w-10" />
        </div>
        <Skeleton className="mt-4 flex-1 rounded-card" />
        <Skeleton className="mt-4 h-[3.25rem] rounded-card" />
      </div>
    </LoadingRegion>
  );
}
