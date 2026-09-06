import { useState, type FormEvent } from 'react';
import { Button, TextField } from '@g7m/ui';
import { useAuthStore } from './auth-store.js';

/** Matches the Supabase project's minimum. Checked here so it fails instantly. */
const MIN_PASSWORD_LENGTH = 8;

/**
 * Set a new password, after arriving through a reset link.
 *
 * This screen is the whole reason the `recovering` status exists. A recovery
 * link produces a real session, and without a screen to catch it the user is
 * dropped into the app with the password they could not remember still on the
 * account — having concluded, reasonably, that the link did nothing.
 */
export function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');

  const busy = useAuthStore((s) => s.busy);
  const error = useAuthStore((s) => s.error);
  const email = useAuthStore((s) => s.session?.user.email ?? null);
  const setNewPassword = useAuthStore((s) => s.setPassword);
  const dismissRecovery = useAuthStore((s) => s.dismissRecovery);
  const clearError = useAuthStore((s) => s.clearError);

  const tooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH;
  // Only complained about once there is something to compare against, so the
  // warning does not appear while the second field is still being typed.
  const mismatch = confirmation.length > 0 && confirmation !== password;
  const canSubmit = password.length >= MIN_PASSWORD_LENGTH && !mismatch && !busy;

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!canSubmit) return;
    void setNewPassword(password);
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-sm flex-col justify-center gap-6 px-4 pt-safe-top pb-safe-bottom">
      <header>
        <h1 className="text-2xl font-semibold text-primary">Choose a new password</h1>
        <p className="mt-1 text-sm text-secondary">
          {email === null ? 'Your account is open.' : `Signed in as ${email}.`} This link opened
          your account — set a password now and it is the one you will use from here on.
        </p>
      </header>

      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <TextField
          label="New password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            clearError();
          }}
          disabled={busy}
          {...(tooShort
            ? { error: `At least ${String(MIN_PASSWORD_LENGTH)} characters.` }
            : { hint: `At least ${String(MIN_PASSWORD_LENGTH)} characters.` })}
        />

        {/* Typed twice because there is no way back if it is wrong: the field
            is masked, and the next sign-in is the first time anyone would find
            out. Another email is the only remedy. */}
        <TextField
          label="Type it again"
          type="password"
          autoComplete="new-password"
          value={confirmation}
          onChange={(e) => {
            setConfirmation(e.target.value);
            clearError();
          }}
          disabled={busy}
          {...(mismatch ? { error: 'These do not match.' } : {})}
        />

        {error !== null && (
          <p
            role="alert"
            className="rounded-control bg-accent-subtle px-3 py-2 text-sm text-primary"
          >
            {error}
          </p>
        )}

        <Button type="submit" size="lg" fullWidth disabled={!canSubmit}>
          {busy ? 'Saving…' : 'Set password'}
        </Button>
      </form>

      <p className="text-center text-sm text-secondary">
        <button
          type="button"
          className="min-h-tap text-accent underline underline-offset-2 disabled:text-muted"
          disabled={busy}
          onClick={dismissRecovery}
        >
          Skip — keep my current password
        </button>
      </p>
    </main>
  );
}
