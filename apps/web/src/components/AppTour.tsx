import { lazy, Suspense, type ReactNode } from 'react';

const Host = lazy(() => import('./TourInvitation.js').then((m) => ({ default: m.TourHost })));
const Invitation = lazy(() => import('./TourInvitation.js'));

/** Tour code arrives beside the app, never in front of its first screen. */
export function AppTourProvider({ children }: { readonly children: ReactNode }) {
  return (
    <>
      {children}
      <Suspense fallback={null}>
        <Host />
      </Suspense>
    </>
  );
}

export function TourInvitation() {
  return (
    <Suspense fallback={null}>
      <Invitation />
    </Suspense>
  );
}
