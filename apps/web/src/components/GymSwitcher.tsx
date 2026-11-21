import { t } from '@g7m/i18n';
import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router';
import { cx } from '@g7m/ui';
import { useWrite } from '../lib/db/use-catalogue.js';
import { useGyms } from '../lib/db/use-gyms.js';
import { CheckIcon, ChevronDownIcon, PinIcon } from './icons.js';

/**
 * Which gym this workout is at, under the workout's title. ADR-0178.
 *
 * Every workout starts at the last gym used, so most days this is only read.
 * Somebody who walked into the other gym taps it and picks; the sheet opens
 * from the bottom, where the thumb already is.
 */
export function GymSwitcher({
  sessionId,
  gymId,
}: {
  readonly sessionId: string;
  readonly gymId: string | null;
}) {
  const gyms = useGyms();
  const [open, setOpen] = useState(false);
  if (gyms.data === null || !gyms.data.enabled || gyms.data.gyms.length === 0) return null;

  const current = gyms.data.gyms.find((gym) => gym.id === gymId) ?? null;

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label={t().workout.gym.change(current?.name ?? null)}
        onClick={() => {
          setOpen(true);
        }}
        className="-ml-2 inline-flex min-h-tap max-w-full items-center gap-1.5 rounded-control px-2 text-sm font-medium text-secondary active:bg-elevated focus-visible:outline-2 focus-visible:outline-accent"
      >
        <PinIcon className="size-4 shrink-0 text-accent" />
        <span className="truncate">{current?.name ?? t().workout.gym.choose}</span>
        <ChevronDownIcon className="size-4 shrink-0 text-muted" />
      </button>
      {open && (
        <GymSheet
          sessionId={sessionId}
          gymId={current?.id ?? null}
          gyms={gyms.data.gyms}
          onClose={() => {
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

function GymSheet({
  sessionId,
  gymId,
  gyms,
  onClose,
}: {
  readonly sessionId: string;
  readonly gymId: string | null;
  readonly gyms: readonly { readonly id: string; readonly name: string }[];
  readonly onClose: () => void;
}) {
  const heading = useId();
  const { write, busy, error } = useWrite();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    globalThis.addEventListener('keydown', onKey);
    return () => {
      globalThis.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  async function choose(id: string): Promise<void> {
    if (id === gymId) {
      onClose();
      return;
    }
    // The sets not done yet follow the gym: a machine's numbers are the new
    // gym's machine's (ADR-0179). What was lifted stays what was lifted.
    const done = await write(async (r) => {
      await r.sessions.setGym(sessionId, id);
      await r.sessions.refillForGym(sessionId);
      return true;
    });
    if (done !== null) onClose();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <button
        type="button"
        aria-label={t().common.close}
        tabIndex={-1}
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={heading}
        className="popup relative flex w-full max-w-2xl flex-col gap-4 rounded-t-sheet border-t border-subtle bg-surface px-5 pt-5 pb-safe-bottom shadow-floating"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id={heading} className="text-xl leading-7 font-semibold text-primary">
            {t().workout.gym.where}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-tap shrink-0 items-center rounded-control px-3 text-sm font-medium text-secondary active:bg-elevated focus-visible:outline-2 focus-visible:outline-accent"
          >
            {t().common.cancel}
          </button>
        </div>
        <ul className="flex flex-col gap-2">
          {gyms.map((gym) => {
            const selected = gym.id === gymId;
            return (
              <li key={gym.id}>
                <button
                  type="button"
                  aria-pressed={selected}
                  disabled={busy}
                  // Focus starts on the gym it is at, so Enter keeps it.
                  autoFocus={selected}
                  onClick={() => {
                    void choose(gym.id);
                  }}
                  className={cx(
                    'flex min-h-tap w-full items-center gap-3 rounded-card border px-4 py-3 text-left text-base font-medium',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60',
                    selected
                      ? 'border-accent bg-accent/10 text-primary'
                      : 'border-subtle bg-elevated text-primary active:bg-surface',
                  )}
                >
                  <PinIcon
                    className={cx('size-5 shrink-0', selected ? 'text-accent' : 'text-muted')}
                  />
                  <span className="min-w-0 flex-1 break-words">{gym.name}</span>
                  {selected && <CheckIcon className="size-5 shrink-0 text-accent" />}
                </button>
              </li>
            );
          })}
        </ul>
        {error !== null && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <p className="pb-4 text-sm text-muted">
          {t().workout.gym.compared}{' '}
          <Link
            to="/settings"
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            {t().workout.gym.manage}
          </Link>
        </p>
      </section>
    </div>
  );
}
