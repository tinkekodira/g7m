import { useEffect, useState } from 'react';
import { Button } from '@g7m/ui';
import { applyUpdate, watchForUpdates } from '../lib/service-worker/register.js';

/**
 * "A new version is ready. Reload."
 *
 * Deliberately a prompt rather than an automatic reload. The app is used with a
 * barbell loaded and a rest timer running; taking the screen away mid-set to
 * swap the JavaScript is a worse failure than running yesterday's build for
 * another ten minutes. The user picks the moment.
 *
 * It sits above the safe area at the bottom, where a thumb already is, and
 * above everything else — but it does not block the page, so ignoring it costs
 * nothing. Where there is a tab bar it stands on top of the bar instead of
 * covering it: a banner over the navigation would make ignoring it cost the
 * whole app. The offset comes from the stylesheet, not from a route check.
 */
export function UpdateBanner() {
  const [ready, setReady] = useState(false);

  useEffect(() => watchForUpdates(() => setReady(true)), []);

  if (!ready) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-(--tab-bar-offset) z-50 border-t border-subtle bg-elevated pb-(--pinned-inset)"
    >
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-3">
        <p className="text-sm text-secondary">A new version of g7m is ready.</p>
        <Button
          onClick={() => {
            applyUpdate();
          }}
        >
          Reload
        </Button>
      </div>
    </div>
  );
}
