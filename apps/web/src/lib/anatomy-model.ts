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
 * There are two bodies now, male and female, chosen by the profile's sex
 * (ADR-0096). Each is optional on its own.
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
import type { Sex } from '@g7m/core';
import type { BodyPart } from '@g7m/anatomy';

/** Names the model files. Written by `scripts/install-anatomy-model.mjs`. */
export const MANIFEST_URL = 'anatomy/manifest.json';

/**
 * The sculpted bodies a build can carry.
 *
 * Two files rather than one body with a switch in it: the female is her own
 * mesh, cut by the same `split.py` to the same node contract, so everything
 * after the loader draws either without knowing which it has.
 */
export const BODIES = ['male', 'female'] as const;
export type BodyKind = (typeof BODIES)[number];

/**
 * Which body a profile is drawn on.
 *
 * Female gets the female body and everybody else the male. Somebody who has
 * not said is shown the body the app has always shown, rather than a guess.
 */
export function bodyFor(sex: Sex | null): BodyKind {
  return sex === 'female' ? 'female' : 'male';
}

/**
 * Resolved against the page, not the domain root.
 *
 * Exported for the test: getting this wrong is invisible in development and
 * breaks only once deployed under a path.
 */
export function anatomyUrl(file: string, baseUri: string): string {
  return new URL(file, baseUri).href;
}

interface ManifestEntry {
  readonly model?: unknown;
}

/**
 * The manifest, in both the shapes it has had.
 *
 * It was `{ "model", "bytes" }`, one body. It is now that plus `bodies`, one
 * entry per body installed. The top-level `model` is still written, as the
 * male's, so a phone still running the previous build reads the new manifest
 * and gets exactly what it got before.
 */
interface ModelManifest extends ManifestEntry {
  readonly bodies?: Partial<Record<BodyKind, ManifestEntry>>;
}

function fileIn(entry: ManifestEntry | null | undefined): string | null {
  const model = entry?.model;
  return typeof model === 'string' && model !== '' ? model : null;
}

/**
 * The file to draw a body from, or null if there is nothing to draw it with.
 *
 * Never worse than a build with one body: a female profile on a build that
 * has only the male is shown the male sculpt, which is what it was shown
 * before there was a choice. The reverse does not happen. A male profile on a
 * build carrying only the female gets the generated body, as it did before
 * either existed.
 *
 * Takes the parsed JSON as `unknown` because it is whatever the server sent.
 */
export function modelFileFor(manifest: unknown, body: BodyKind): string | null {
  if (typeof manifest !== 'object' || manifest === null) return null;
  const { bodies } = manifest as ModelManifest;
  const own = typeof bodies === 'object' && bodies !== null ? fileIn(bodies[body]) : null;
  if (own !== null) return own;

  // The old single-model form, and the male slot of the new one.
  return body === 'female' ? modelFileFor(manifest, 'male') : fileIn(manifest);
}

/**
 * The manifest, fetched once per page whichever bodies are asked for.
 *
 * Absent is the normal case and reads as null all the way through: no
 * manifest, an unreadable one, or one naming nothing.
 */
let manifest: Promise<unknown> | null = null;

function readManifest(baseUri: string): Promise<unknown> {
  manifest ??= fetch(anatomyUrl(MANIFEST_URL, baseUri)).then((response) =>
    // A dev server that falls back to its index page answers 200 with HTML,
    // so the status alone is not enough to know a manifest arrived.
    response.ok ? response.json().catch(() => null) : null,
  );
  return manifest;
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
 *
 * Kept per body, so changing the sex on a profile and changing it back fetches
 * nothing twice. And per file underneath that, so a female profile shown the
 * male sculpt shares his parse rather than making a second one.
 */
const pending = new Map<BodyKind, Promise<readonly BodyPart[] | null>>();
const settled = new Map<BodyKind, readonly BodyPart[] | null>();
const files = new Map<string, Promise<readonly BodyPart[] | null>>();

function partsAt(url: string): Promise<readonly BodyPart[] | null> {
  const known = files.get(url);
  if (known !== undefined) return known;

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
  const parts = import('@g7m/anatomy').then(({ loadBodyParts }) => loadBodyParts(url));
  files.set(url, parts);
  return parts;
}

function loadOnce(body: BodyKind): Promise<readonly BodyPart[] | null> {
  const existing = pending.get(body);
  if (existing !== undefined) return existing;

  const load = readManifest(document.baseURI)
    .then((parsed) => {
      const file = modelFileFor(parsed, body);
      return file === null ? null : partsAt(anatomyUrl(`anatomy/${file}`, document.baseURI));
    })
    .then(
      (parts) => {
        // Kept, including "this build has no model", which is the normal
        // answer and will not change until the page does.
        settled.set(body, parts);
        return parts;
      },
      (cause: unknown) => {
        // Worth a line for whoever put the file there, and nothing at all for
        // everybody else. Not kept: a fetch that failed on a bad connection
        // gets another go the next time a screen asks, manifest and all.
        console.warn('Could not load the anatomy model; using the generated body.', cause);
        pending.delete(body);
        manifest = null;
        files.clear();
        return null;
      },
    );
  pending.set(body, load);
  return load;
}

/**
 * The sculpted body to draw.
 *
 * `null` means the body is not known yet — the profile that says which is
 * still being read — and loads nothing. Guessing the male meanwhile would draw
 * him and swap him out a moment later, the same flash the placeholder exists
 * to prevent, and would download a body a female lifter never sees.
 */
export function useSculptedBody(body: BodyKind | null): SculptedBody {
  const [loaded, setLoaded] = useState<{
    readonly body: BodyKind;
    readonly parts: readonly BodyPart[] | null;
  } | null>(null);

  useEffect(() => {
    if (body === null || settled.has(body)) return;
    let cancelled = false;

    void loadOnce(body).then((parts) => {
      if (!cancelled) setLoaded({ body, parts });
    });

    return () => {
      cancelled = true;
    };
  }, [body]);

  if (body === null) return { parts: null, loading: true };
  const cached = settled.get(body);
  if (cached !== undefined) return { parts: cached, loading: false };
  if (loaded?.body === body) return { parts: loaded.parts, loading: false };
  return { parts: null, loading: true };
}
