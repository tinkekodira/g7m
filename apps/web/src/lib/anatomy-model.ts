/**
 * Loading the sculpted body, if this build has one.
 *
 * The model is licensed and the repository is public (ADR-0009, ADR-0019), so
 * it is not committed and most checkouts will not have it. **Absent is the
 * normal case**, not an error: the hook returns null, the Learn screen falls
 * back to the generated body, and the user is told nothing. A missing optional
 * asset that shouts is worse than one that is quietly not there.
 *
 * ADR-0009's "fetched at build time" is now built:
 * `scripts/install-anatomy-model.mjs` writes the model and a manifest naming
 * it, CI runs that with a URL from a repository secret, and
 * `apps/web/public/anatomy/` stays ignored so nothing can be committed by
 * accident. The pre-commit hook refuses a raw `.glb` as well.
 *
 * ## Two reasons this goes through a manifest
 *
 * The filename carries a content hash, so a rebuilt model is a new URL. The
 * service worker deliberately leaves `anatomy/` out of its precache — the
 * model is megabytes and only one screen wants it — and keeps it in the
 * runtime cache instead. At a fixed URL that means a device which has the
 * model never asks for it again: rebuild the geometry, deploy, and every phone
 * that has opened Learn keeps the old body for good.
 *
 * And the URL is resolved against `document.baseURI` rather than written from
 * the root. It used to be `/anatomy/body.glb`, which is correct on a dev
 * server and wrong everywhere this actually ships — on GitHub Pages the app
 * lives under `/g7m/`, so a leading slash asks the domain root for a file that
 * is not there. Same reason `base` is `./` in the Vite config (ADR-0027).
 */
import { useEffect, useState } from 'react';
import type { BodyPart } from '@g7m/anatomy';

/** Names the current model file. Written by `scripts/install-anatomy-model.mjs`. */
export const MANIFEST_URL = 'anatomy/manifest.json';

/**
 * Resolved against the page, not the domain root.
 *
 * Exported for the test: getting this wrong is invisible in development and
 * breaks only once deployed under a path.
 */
export function anatomyUrl(file: string, baseUri: string): string {
  return new URL(file, baseUri).href;
}

interface ModelManifest {
  readonly model: string;
}

/**
 * The model file this build carries, or null if it carries none.
 *
 * Absent is the normal case and reads as null all the way through: no
 * manifest, an unreadable one, or one naming nothing.
 */
async function currentModelUrl(baseUri: string): Promise<string | null> {
  const response = await fetch(anatomyUrl(MANIFEST_URL, baseUri));
  if (!response.ok) return null;

  // A dev server that falls back to its index page answers 200 with HTML, so
  // the status alone is not enough to know a manifest arrived.
  const parsed: unknown = await response.json().catch(() => null);
  const model = (parsed as ModelManifest | null)?.model;
  if (typeof model !== 'string' || model === '') return null;

  return anatomyUrl(`anatomy/${model}`, baseUri);
}

export interface SculptedBody {
  /** Null while loading, and null for good when there is no model to load. */
  readonly parts: readonly BodyPart[] | null;
  readonly loading: boolean;
}

/**
 * The body, loaded once per page rather than once per screen.
 *
 * Two screens draw it now — Learn and Profile — and they are a tab apart.
 * Loading per mount meant every hop between them fetched the manifest, parsed
 * megabytes of geometry again and showed "Loading the model…" for a second on
 * a body that was already in memory. The promise is kept so the second screen
 * waits on the first one's load instead of starting its own, and the answer is
 * kept so a screen opened afterwards can draw it on its very first render.
 */
let pending: Promise<readonly BodyPart[] | null> | null = null;
let settled: { readonly parts: readonly BodyPart[] | null } | null = null;

function loadOnce(): Promise<readonly BodyPart[] | null> {
  pending ??= currentModelUrl(document.baseURI)
    /**
     * Imported here rather than at the top of the file, and this is load-bearing.
     *
     * `@g7m/anatomy` reaches three.js, and this module is statically reachable
     * from the entry — `App.tsx` imports `LearnScreen`, which imports this. A
     * static import therefore pulled 627 KB of three into the first chunk every
     * user downloads, for a screen most of them have not opened and a model
     * most builds do not have. The viewer is already lazy; the loader has to be
     * too, or it drags the same dependency in through the back door.
     */
    .then(async (url) => {
      if (url === null) return null;
      const { loadBodyParts } = await import('@g7m/anatomy');
      return loadBodyParts(url);
    })
    .then(
      (parts) => {
        // Kept, including "this build has no model", which is the normal
        // answer and will not change until the page does.
        settled = { parts };
        return parts;
      },
      (cause: unknown) => {
        // Worth a line for whoever put the file there, and nothing at all for
        // everybody else. Not kept: a fetch that failed on a bad connection
        // gets another go the next time a screen asks.
        console.warn('Could not load the anatomy model; using the generated body.', cause);
        pending = null;
        return null;
      },
    );
  return pending;
}

export function useSculptedBody(): SculptedBody {
  const [parts, setParts] = useState<readonly BodyPart[] | null>(() => settled?.parts ?? null);
  const [loading, setLoading] = useState(() => settled === null);

  useEffect(() => {
    if (settled !== null) return;
    let cancelled = false;

    void loadOnce().then((loaded) => {
      if (cancelled) return;
      setParts(loaded);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { parts, loading };
}
