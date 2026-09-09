/**
 * Loading the sculpted body, if this build has one.
 *
 * The model is licensed and the repository is public (ADR-0009, ADR-0019), so
 * it is not committed and most checkouts will not have it. **Absent is the
 * normal case**, not an error: the hook returns null, the Learn screen falls
 * back to the generated body, and the user is told nothing. A missing optional
 * asset that shouts is worse than one that is quietly not there.
 *
 * Where it comes from is still open — ADR-0009 says "fetched at build time"
 * and that has not been built. For now it is a path a developer drops a file
 * at, and `apps/web/public/anatomy/` is ignored so it cannot be committed by
 * accident. The pre-commit hook refuses a raw `.glb` as well, which is the
 * second lock on the same door.
 */
import { useEffect, useState } from 'react';
import { loadBodyParts, type BodyPart } from '@g7m/anatomy';

/** Where a local copy goes. See `packages/anatomy/tools/README.md`. */
export const MODEL_URL = '/anatomy/body.glb';

export interface SculptedBody {
  /** Null while loading, and null for good when there is no model to load. */
  readonly parts: readonly BodyPart[] | null;
  readonly loading: boolean;
}

export function useSculptedBody(): SculptedBody {
  const [parts, setParts] = useState<readonly BodyPart[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void loadBodyParts(MODEL_URL)
      .then((loaded) => {
        if (!cancelled && loaded !== null) setParts(loaded);
      })
      .catch((cause: unknown) => {
        // Worth a line for whoever put the file there, and nothing at all for
        // everybody else.
        console.warn('Could not load the anatomy model; using the generated body.', cause);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { parts, loading };
}
