import { useMemo, useState } from 'react';
import { Button } from '@g7m/ui';
import { crashCopy, crashKind, crashReport } from '../lib/crash.js';
import { AlertIcon, SyncIcon } from './icons.js';

/**
 * What a screen that threw shows instead of nothing.
 *
 * Three things, in the order somebody needs them: that their training is safe,
 * a way out, and — folded away, for when they write to say it happened — the
 * details. A stale build gets one clear action, Reload, because that is the
 * whole fix; a bug gets Try again first, since a render that failed on
 * half-synced data often works a moment later.
 */
export interface CrashScreenProps {
  readonly error: unknown;
  readonly inWorkout?: boolean;
  /** Render the screen again. Absent at the top level, where there is nothing smaller to retry. */
  readonly onRetry?: (() => void) | undefined;
  /** Leave for Home. Absent where Home is the screen that broke. */
  readonly onHome?: (() => void) | undefined;
}

export function CrashScreen({ error, inWorkout = false, onRetry, onHome }: CrashScreenProps) {
  const kind = crashKind(error);
  const copy = crashCopy(kind, inWorkout);
  // Taken once, when the screen appears: the time and place of the crash, not
  // of whenever somebody gets round to pressing Copy.
  const report = useMemo(
    () =>
      crashReport(error, {
        at: new Date(),
        url: globalThis.location.href,
        userAgent: globalThis.navigator.userAgent,
      }),
    [error],
  );
  const [copied, setCopied] = useState<'no' | 'yes' | 'failed'>('no');

  const reload = () => {
    globalThis.location.reload();
  };

  return (
    <main
      role="alert"
      className="mx-auto flex min-h-full max-w-2xl flex-col gap-4 px-4 pt-safe-top pb-safe-bottom"
    >
      <section className="mt-10 rounded-card border border-subtle bg-surface p-5">
        <span
          aria-hidden
          className={`flex size-12 items-center justify-center rounded-full ${
            kind === 'stale-build' ? 'bg-accent/15 text-accent' : 'bg-danger/15 text-danger'
          }`}
        >
          {kind === 'stale-build' ? (
            <SyncIcon className="size-6" />
          ) : (
            <AlertIcon className="size-6" />
          )}
        </span>
        <h1 className="mt-4 text-xl font-semibold text-primary">{copy.title}</h1>
        <p className="mt-2 max-w-prose text-base text-secondary">{copy.detail}</p>

        <div className="mt-5 flex flex-col gap-2">
          {kind === 'stale-build' || onRetry === undefined ? (
            <Button fullWidth onClick={reload}>
              Reload
            </Button>
          ) : (
            <Button fullWidth onClick={onRetry}>
              Try again
            </Button>
          )}
          {onHome !== undefined && (
            <Button variant="secondary" fullWidth onClick={onHome}>
              Go to Home
            </Button>
          )}
          {/* Reload is still worth offering for a bug: it is the one reset that
              clears whatever state the screen tripped over. Second, because a
              retry is cheaper and usually enough. */}
          {kind === 'bug' && onRetry !== undefined && (
            <Button variant="ghost" fullWidth onClick={reload}>
              Reload the app
            </Button>
          )}
        </div>
      </section>

      {kind === 'bug' && (
        <details className="rounded-card border border-subtle bg-surface p-4">
          <summary className="min-h-tap cursor-pointer content-center text-sm font-medium text-secondary">
            Details for a bug report
          </summary>
          <p className="mt-2 text-sm text-muted">
            Nothing here identifies you, so it is safe to paste into a message.
          </p>
          <pre className="mt-3 max-h-64 overflow-auto rounded-control bg-input p-3 text-xs whitespace-pre-wrap text-secondary select-text">
            {report}
          </pre>
          <Button
            variant="secondary"
            className="mt-3"
            onClick={() => {
              void copyText(report).then((ok) => {
                setCopied(ok ? 'yes' : 'failed');
              });
            }}
          >
            {copied === 'yes' ? 'Copied' : 'Copy details'}
          </Button>
          {copied === 'failed' && (
            <p className="mt-2 text-sm text-muted">
              This browser would not copy it. Press and hold the text above to select it instead.
            </p>
          )}
        </details>
      )}
    </main>
  );
}

/** The clipboard, which is missing outside a secure context and can refuse inside one. */
async function copyText(text: string): Promise<boolean> {
  try {
    await globalThis.navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
