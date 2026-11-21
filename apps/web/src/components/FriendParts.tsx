import { t } from '@g7m/i18n';
import { useState } from 'react';
import { describeDot, type Presence, type WeekDot } from '@g7m/core';
import { Button, TextField, cx } from '@g7m/ui';
import { appBaseUrl } from '../lib/app-url.js';
import { useWrite } from '../lib/db/use-catalogue.js';
import { CopyIcon, FlameIcon, FriendsIcon, ShareIcon } from './icons.js';

/**
 * The pieces the Friends screens share: presence, the week's dots, the streak,
 * your code with its two buttons, and the two states that come before any of
 * that — no connection, and no name yet.
 */

/** "● Online now" or "● Last seen 2h ago". The dot is a colour; the words say the same. */
export function PresenceLine({ presence }: { readonly presence: Presence }) {
  return (
    <p className="flex items-center gap-1.5 text-sm text-secondary">
      <span
        aria-hidden
        className={cx('size-2 rounded-full', presence.online ? 'bg-success' : 'bg-strong')}
      />
      {presence.label}
    </p>
  );
}

/**
 * This week, a dot a day, in your own week order. Accent on a day they
 * trained, a ring on today. Each dot is labelled in words — "Tuesday:
 * trained" — so colour is never the only way to read it.
 */
export function WeekDots({ dots }: { readonly dots: readonly WeekDot[] }) {
  return (
    <ol aria-label={t().friends.card.thisWeek} className="flex items-center justify-between gap-1">
      {dots.map((dot) => (
        <li
          key={dot.date.toISOString()}
          aria-label={`${describeDot(dot)}${dot.isToday ? t().friends.card.today : ''}`}
          className="flex flex-col items-center gap-1"
        >
          <span
            aria-hidden
            className={cx(
              'size-3.5 rounded-full',
              dot.trained ? 'bg-accent' : 'bg-elevated ring-1 ring-strong',
              dot.isToday && 'outline-2 outline-offset-2 outline-accent/60',
            )}
          />
          <span
            aria-hidden
            className={cx('text-[11px] leading-none', dot.isToday ? 'text-primary' : 'text-muted')}
          >
            {dot.initial}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** "🔥 4 weeks" — drawn with the app's own flame rather than an emoji. */
export function Streak({ streak }: { readonly streak: string | null }) {
  if (streak === null) return null;
  return (
    <p className="flex items-center gap-1 text-sm font-medium text-primary">
      <FlameIcon className="size-4 text-accent" />
      <span className="sr-only">{t().friends.card.streak}</span>
      {streak}
    </p>
  );
}

/**
 * Hand the code to somebody: the share sheet where there is one, a copy where
 * there is not — the same order of preference the data export uses for its
 * file (ADR-0064).
 */
async function shareCode(code: string): Promise<'shared' | 'copied' | 'cancelled' | 'failed'> {
  const text = t().friends.code.shareText(code);
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: t().friends.code.shareTitle, text, url: appBaseUrl() });
      return 'shared';
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
    }
  }
  return (await copyCode(code)) ? 'copied' : 'failed';
}

async function copyCode(code: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(code);
    return true;
  } catch {
    return false;
  }
}

/** Your code, big enough to read across a gym, with Copy and Share under it. */
export function YourCode({ code }: { readonly code: string }) {
  const [said, setSaid] = useState<string | null>(null);

  return (
    <div>
      <p className="text-[11px] leading-4 font-semibold tracking-[0.08em] text-muted uppercase">
        {t().friends.code.yours}
      </p>
      <p
        className="numeric mt-1 font-mono text-4xl font-bold tracking-[0.25em] text-primary"
        aria-label={t().friends.code.yoursLabel(code.split('').join(' '))}
      >
        {code}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Button
          variant="secondary"
          onClick={() => {
            void copyCode(code).then((copied) => {
              setSaid(copied ? t().friends.code.copied : t().friends.code.couldNotCopy(code));
            });
          }}
        >
          <CopyIcon className="size-5" />
          {t().friends.code.copy}
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            void shareCode(code).then((outcome) => {
              setSaid(
                outcome === 'copied'
                  ? t().friends.code.copiedToPaste
                  : outcome === 'failed'
                    ? t().friends.code.couldNotShare(code)
                    : null,
              );
            });
          }}
        >
          <ShareIcon className="size-5" />
          {t().friends.code.share}
        </Button>
      </div>
      <p role="status" className="mt-2 min-h-5 text-sm text-secondary">
        {said}
      </p>
    </div>
  );
}

/** Friends live on the server, so with no connection there is nothing to show. */
export function FriendsOffline() {
  return (
    <section className="rounded-sheet border border-subtle bg-surface p-5 text-center">
      <FriendsIcon className="mx-auto size-8 text-muted" />
      <h2 className="mt-2 text-base font-semibold text-primary">{t().friends.offline.title}</h2>
      <p className="mx-auto mt-1 max-w-prose text-sm text-secondary">{t().friends.offline.body}</p>
    </section>
  );
}

const missingProfile = (): string => t().friends.name.missingProfile;

/**
 * The name friends will see, asked for once, before anything else.
 *
 * Saved to the profile like any other edit — synced, offline-safe — and the
 * same field "Your details" changes later. A friend list of "Your friend",
 * "Your friend" and "Your friend" is the thing this prevents.
 */
export function NamePrompt() {
  const { write, busy, error } = useWrite();
  const [name, setName] = useState('');
  const [missing, setMissing] = useState(false);
  const trimmed = name.trim();

  return (
    <section className="rounded-sheet border border-subtle bg-surface p-5">
      <h2 className="text-lg font-semibold text-primary">{t().friends.name.title}</h2>
      <p className="mt-1 text-sm text-secondary">{t().friends.name.body}</p>
      <form
        className="mt-4 flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (trimmed === '' || busy) return;
          void write((r) => r.profile.update({ displayName: trimmed })).then((updated) => {
            // Null: no profile row on this phone to write to. Said rather
            // than swallowed, so the button does not look broken.
            setMissing(updated === null);
          });
        }}
      >
        <TextField
          label={t().friends.name.label}
          value={name}
          autoComplete="given-name"
          maxLength={40}
          onChange={(event) => {
            setName(event.target.value);
          }}
        />
        <Button type="submit" fullWidth disabled={trimmed === '' || busy}>
          {busy ? t().common.saving : t().common.continue}
        </Button>
        {(error ?? (missing ? missingProfile() : null)) !== null && (
          <p role="alert" className="text-sm text-destructive">
            {error ?? missingProfile()}
          </p>
        )}
      </form>
    </section>
  );
}
