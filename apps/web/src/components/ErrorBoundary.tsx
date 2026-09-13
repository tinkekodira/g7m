import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { CrashScreen } from './CrashScreen.js';

/**
 * Catches a screen that throws, so the app does not go blank.
 *
 * React's answer to an uncaught render error is to unmount everything, which
 * on a Home Screen web app means a white page with no address bar to reload
 * from. A boundary is still a class component in React 19 — there is no hook
 * for this — so this is the one class in the app.
 *
 * What it cannot catch, by React's design: errors in event handlers and in
 * async code. Those do not unmount anything, and the screens already show
 * their own errors for them (`useWrite`, the sync alarm).
 */

interface ErrorBoundaryProps {
  /**
   * Changing this clears a caught error. The route's path, where there is a
   * route, so that leaving a broken screen — by the tab bar, or Back — leaves
   * the error behind with it rather than showing it on every screen after.
   */
  readonly resetKey?: string;
  readonly fallback: (error: unknown, reset: () => void) => ReactNode;
  readonly children: ReactNode;
}

interface ErrorBoundaryState {
  readonly failed: boolean;
  readonly error: unknown;
  readonly resetKey: string | undefined;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = {
    failed: false,
    error: null,
    resetKey: this.props.resetKey,
  };

  static getDerivedStateFromError(error: unknown): Partial<ErrorBoundaryState> {
    return { failed: true, error };
  }

  static getDerivedStateFromProps(
    props: ErrorBoundaryProps,
    state: ErrorBoundaryState,
  ): Partial<ErrorBoundaryState> | null {
    if (props.resetKey === state.resetKey) return null;
    return { resetKey: props.resetKey, failed: false, error: null };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo): void {
    // The console is the only log there is (no crash reporting service — v1
    // costs nothing to run), and on a phone it is reachable from a desktop
    // Safari. The component stack is the part the report cannot carry.
    console.error('A screen crashed.', error, info.componentStack);
  }

  private readonly reset = (): void => {
    this.setState({ failed: false, error: null });
  };

  override render(): ReactNode {
    return this.state.failed
      ? this.props.fallback(this.state.error, this.reset)
      : this.props.children;
  }
}

/**
 * A boundary around one route, inside the router.
 *
 * Inside rather than around it for what that buys: the tab bar stays, so a
 * broken Progress screen costs Progress and not the app, and "Go to Home" can
 * navigate instead of reloading everything.
 */
export function RouteBoundary({ children }: { readonly children: ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <ErrorBoundary
      resetKey={pathname}
      fallback={(error, reset) => (
        <CrashScreen
          error={error}
          inWorkout={pathname === '/workout'}
          onRetry={reset}
          onHome={
            pathname === '/'
              ? undefined
              : () => {
                  void navigate('/');
                }
          }
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
