import { useState, type FormEvent } from 'react';
import { Button, TextField, cx } from '@g7m/ui';
import { useAuthStore } from './auth-store.js';

type Mode = 'sign-in' | 'sign-up' | 'reset';

/**
 * Email and password, or Google.
 *
 * The same form serves every mode rather than three routes: the fields are
 * nearly identical, and switching keeps whatever was already typed, which is
 * the difference between a small annoyance and retyping your email.
 *
 * **The mode switch is at the top, and it used to be at the bottom.** Below
 * the password field, below the error, below a divider, below the Google
 * button — off the bottom of a phone screen. Somebody with no account saw a
 * form headed "Sign in", filled it in, and was told their email and password
 * did not match, which is true and useless. That happened to the only person
 * using this app, and it cost them a day.
 */
export function SignInScreen() {
  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const busy = useAuthStore((s) => s.busy);
  const error = useAuthStore((s) => s.error);
  const notice = useAuthStore((s) => s.notice);
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const requestPasswordReset = useAuthStore((s) => s.requestPasswordReset);
  const clearError = useAuthStore((s) => s.clearError);

  const needsPassword = mode !== 'reset';
  const canSubmit = email.trim().length > 0 && (!needsPassword || password.length > 0) && !busy;

  function switchTo(next: Mode): void {
    setMode(next);
    clearError();
  }

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!canSubmit) return;

    if (mode === 'reset') {
      void requestPasswordReset(email.trim());
      return;
    }
    void (mode === 'sign-in' ? signIn : signUp)(email.trim(), password);
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-sm flex-col justify-center gap-6 px-4 pt-safe-top pb-safe-bottom">
      <header>
        <h1 className="text-2xl font-semibold text-primary">g7m</h1>
        <p className="mt-1 text-sm text-secondary">
          Your training history syncs across every device you sign in on.
        </p>
      </header>

      {mode === 'reset' ? (
        <p className="text-sm text-secondary">
          Enter the email you signed up with and we will send a link to set a new password.
        </p>
      ) : (
        /* Two tabs, above the fields, so both options are visible without
           scrolling and neither is hidden behind the other. */
        <div
          role="tablist"
          aria-label="Sign in or create an account"
          className="flex rounded-control bg-elevated p-1"
        >
          <ModeTab
            selected={mode === 'sign-in'}
            onSelect={() => {
              switchTo('sign-in');
            }}
          >
            Sign in
          </ModeTab>
          <ModeTab
            selected={mode === 'sign-up'}
            onSelect={() => {
              switchTo('sign-up');
            }}
          >
            Create account
          </ModeTab>
        </div>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <TextField
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clearError();
          }}
          disabled={busy}
        />

        {needsPassword && (
          <TextField
            label="Password"
            type="password"
            autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearError();
            }}
            disabled={busy}
            {...(mode === 'sign-up' ? { hint: 'At least 8 characters.' } : {})}
          />
        )}

        {error !== null && (
          <div
            role="alert"
            className="rounded-control bg-accent-subtle px-3 py-2 text-sm text-primary"
          >
            <p>{error}</p>
            {/* The action the message just named, next to the message. Being
                told to create an account and then having to find where is the
                same defect one step further along. */}
            {mode === 'sign-in' && (
              <div className="mt-2 flex flex-wrap gap-4">
                <button
                  type="button"
                  className="text-accent underline underline-offset-2"
                  onClick={() => {
                    switchTo('sign-up');
                  }}
                >
                  Create an account
                </button>
                <button
                  type="button"
                  className="text-accent underline underline-offset-2"
                  onClick={() => {
                    switchTo('reset');
                  }}
                >
                  Reset my password
                </button>
              </div>
            )}
          </div>
        )}

        {notice !== null && (
          <p role="status" className="rounded-control bg-surface px-3 py-2 text-sm text-secondary">
            {notice}
          </p>
        )}

        <Button type="submit" size="lg" fullWidth disabled={!canSubmit}>
          {busy
            ? 'Working…'
            : mode === 'sign-in'
              ? 'Sign in'
              : mode === 'sign-up'
                ? 'Create account'
                : 'Send reset link'}
        </Button>
      </form>

      {mode === 'reset' ? (
        <p className="text-center text-sm text-secondary">
          <button
            type="button"
            className="min-h-tap text-accent underline underline-offset-2"
            onClick={() => {
              switchTo('sign-in');
            }}
          >
            Back to sign in
          </button>
        </p>
      ) : (
        <>
          <div className="flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-subtle" />
            <span className="text-xs text-muted">or</span>
            <span className="h-px flex-1 bg-subtle" />
          </div>

          <Button
            variant="secondary"
            size="lg"
            fullWidth
            disabled={busy}
            onClick={() => {
              void signInWithGoogle();
            }}
          >
            Continue with Google
          </Button>

          {mode === 'sign-in' && (
            <p className="text-center text-sm text-secondary">
              <button
                type="button"
                className="min-h-tap text-accent underline underline-offset-2 disabled:text-muted"
                disabled={busy}
                onClick={() => {
                  switchTo('reset');
                }}
              >
                Forgot your password?
              </button>
            </p>
          )}
        </>
      )}
    </main>
  );
}

function ModeTab({
  selected,
  onSelect,
  children,
}: {
  readonly selected: boolean;
  readonly onSelect: () => void;
  readonly children: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onSelect}
      className={cx(
        'min-h-tap flex-1 rounded-control text-sm font-medium transition-colors duration-150',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        selected ? 'bg-surface text-primary' : 'text-secondary',
      )}
    >
      {children}
    </button>
  );
}
