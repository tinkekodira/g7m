/**
 * A month card's own shape while it is on its way, so nothing below it jumps.
 *
 * Two waits share it: the cards' code arriving (they are their own chunk, kept
 * out of the entry Home is drawn from, ADR-0120) and the month being read.
 * Its own file so the first can show it without loading the second.
 */
export function StatSkeleton() {
  return (
    <div className="flex min-h-[18.5rem] flex-col rounded-sheet border border-subtle bg-surface p-4">
      <div className="flex items-start gap-3">
        <div className="size-10 animate-pulse rounded-card bg-elevated" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-2.5 w-24 animate-pulse rounded-full bg-elevated" />
          <div className="h-4 w-28 animate-pulse rounded-full bg-elevated" />
        </div>
        <div className="h-7 w-10 animate-pulse rounded-control bg-elevated" />
      </div>
      <div className="mt-4 flex-1 animate-pulse rounded-card bg-elevated/60" />
      <div className="mt-4 h-[3.25rem] animate-pulse rounded-card bg-elevated/60" />
    </div>
  );
}
