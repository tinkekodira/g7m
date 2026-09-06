import { Link } from 'react-router';
import type { ReactNode } from 'react';

/**
 * The way out of a screen, in its header.
 *
 * A bordered control rather than a text link, because the text version read as
 * a caption: grey, small, and the same weight as the "0:22 elapsed" line
 * underneath it. On a screen whose other controls are all filled buttons,
 * anything unbordered looks like a label rather than something to press —
 * and this is the only way back from a workout without finishing it.
 *
 * A `Link`, not a button, so the browser's own back gesture and a long-press
 * both behave the way they look like they should.
 */
export function HeaderLink({
  to,
  children,
}: {
  readonly to: string;
  readonly children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className="inline-flex min-h-tap shrink-0 items-center gap-1 rounded-control border border-subtle bg-elevated px-4 text-sm font-medium text-primary select-none active:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {children}
    </Link>
  );
}
