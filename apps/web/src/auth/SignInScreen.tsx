import { useState, type FormEvent } from 'react';
import { Button, TextField } from '@g7m/ui';
import { useAuthStore } from './auth-store.js';

type Mode = 'sign-in' | 'sign-up';

const COPY: Record<Mode, { title: string; action: string; switchTo: string; prompt: string }> = {
  'sign-in': {
    title: 'Sign in',
    action: 'Sign in',
    switchTo: 'Create an account',
    prompt: 'No account yet?',
  },
  'sign-up': {
    title: 'Create an account',
    action: 'Create account',
    switchTo: 'Sign in instead',
    prompt: 'Already have an account?',
  },
};

/**
 * Email and password, or Google.
 *
 * The same form serves both modes rather than two routes: the fields are
 * identical, and a mode toggle keeps whatever was already typed, which is the
 * difference between a small annoyance and retyping your email.
 */
export function SignInScreen() {
  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const busy = useAuthStore((s) => s.busy);
  const error = useAuthStore((s) => s.error);
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const clearError = useAuthStore((s) => s.clearError);

  const copy = COPY[mode];
  const canSubmit = email.trim().length > 0 && password.length > 0 && !busy;

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!canSubmit) return;
    const run = mode === 'sign-in' ? signIn : signUp;
    void run(email.trim(), password);
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-sm flex-col justify-center gap-6 px-4 pt-safe-top pb-safe-bottom">
      <header>
        <h1 className="text-2xl font-semibold text-primary">{copy.title}</h1>
        <p className="mt-1 text-sm text-secondary">
          Your training history syncs across every device you sign in on.
        </p>
      </header>

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

        {error !== null && (
          <p
            role="alert"
            className="rounded-control bg-accent-subtle px-3 py-2 text-sm text-primary"
          >
            {error}
          </p>
        )}

        <Button type="submit" size="lg" fullWidth disabled={!canSubmit}>
          {busy ? 'Working…' : copy.action}
        </Button>
      </form>

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

      <p className="text-center text-sm text-secondary">
        {copy.prompt}{' '}
        <button
          type="button"
          className="min-h-tap text-accent underline underline-offset-2 disabled:text-muted"
          disabled={busy}
          onClick={() => {
            setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in');
            clearError();
          }}
        >
          {copy.switchTo}
        </button>
      </p>
    </main>
  );
}
