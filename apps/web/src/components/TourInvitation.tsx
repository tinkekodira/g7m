import { t } from '@g7m/i18n';
import { lazy, Suspense, useEffect, useState } from 'react';
import { Button } from '@g7m/ui';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../auth/auth-store.js';
import { useTourStore } from '../lib/app-tour.js';

const keyFor = (user: string) => `g7m.app-tour.${user}`;
// Keep this visit usable even if a WebView refuses persistent storage.
const remembered = new Set<string>();
const Overlay = lazy(() => import('./TourOverlay.js'));

export function TourHost() {
  const user = useAuthStore((s) => s.session?.user.id);
  const owner = useTourStore((s) => s.user);
  useEffect(() => () => useTourStore.getState().close(), [user]);
  return owner !== null && owner === user ? (
    <Suspense fallback={null}>
      <Overlay />
    </Suspense>
  ) : null;
}

function wasOffered(user: string): boolean {
  if (remembered.has(user)) return true;
  try {
    return localStorage.getItem(keyFor(user)) === 'handled';
  } catch {
    return false;
  }
}

function rememberTour(user: string) {
  remembered.add(user);
  try {
    localStorage.setItem(keyFor(user), 'handled');
  } catch {
    /* Replay stays available when storage is unavailable. */
  }
}

function useStartTour() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.session?.user.id);
  return () => {
    if (!user || document.querySelector('dialog[open], [role="dialog"], [role="alertdialog"]'))
      return;
    rememberTour(user);
    void navigate('/', { replace: true });
    useTourStore.getState().open(user);
  };
}

export function TourReplay() {
  const start = useStartTour();
  return (
    <Button variant="secondary" onClick={start}>
      {t().tour.replay}
    </Button>
  );
}

export default function TourInvitation() {
  const user = useAuthStore((s) => s.session?.user.id);
  const owner = useTourStore((s) => s.user);
  return user && owner !== user ? <AccountInvitation key={user} user={user} /> : null;
}

function AccountInvitation({ user }: { readonly user: string }) {
  const onStart = useStartTour();
  const [handled, setHandled] = useState(() => wasOffered(user));
  if (handled) return null;
  return (
    <section
      aria-labelledby="tour-invitation"
      className="rounded-sheet border border-subtle bg-surface p-4"
    >
      <h2 id="tour-invitation" className="text-lg font-semibold text-primary">
        {t().tour.invitationTitle}
      </h2>
      <p className="mt-1 text-sm text-secondary">{t().tour.invitationBody}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={onStart}>
          {t().tour.take}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            rememberTour(user);
            setHandled(true);
          }}
          aria-label={t().tour.dismissLabel}
        >
          {t().tour.dismiss}
        </Button>
      </div>
    </section>
  );
}
