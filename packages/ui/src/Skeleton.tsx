import { cx } from './cx.js';

/** Decorative placeholder. A loading region owns its timing and announcement. */
export function Skeleton({ className }: { readonly className?: string }) {
  return (
    <div aria-hidden="true" className={cx('skeleton rounded-control bg-elevated', className)} />
  );
}
