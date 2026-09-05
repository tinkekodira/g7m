# Architecture decision log

One entry per non-obvious technical decision: what was chosen, what was
rejected, and why. Newest at the bottom. Entries are append-only — if a decision
is reversed, add a new entry that supersedes the old one rather than editing
history.

The spec lives in [`CLAUDE_CODE_BRIEF.md`](./CLAUDE_CODE_BRIEF.md). This file
records the calls the brief left open, or where reality pushed back.

---

## ADR-0001 — pnpm workspaces, no build orchestrator

**Chosen:** pnpm workspaces with plain `pnpm -r` scripts.

**Rejected:** Turborepo, Nx.

**Why:** Seven packages, one real application, one developer. A build
orchestrator earns its keep on cache reuse across dozens of packages and long
CI matrices; here it would add a config surface and a daemon to debug in
exchange for saving a few seconds. `pnpm -r --parallel typecheck` is enough.
Revisit if CI passes three minutes.

---

## ADR-0002 — Supabase project in the EU region

**Chosen:** EU region (specified in the brief).

**Why:** The developer and the initial users are in the EU. Keeping personal
data — training history is health-adjacent — inside the EU avoids a transfer
basis being needed under GDPR, and makes the §14 data-export and deletion
obligations straightforward. Recorded here because it is a decision that becomes
extremely expensive to change once there is user data.

---

## ADR-0003 — TypeScript strictness beyond `strict: true`

**Chosen:** `strict` plus `noUncheckedIndexedAccess`,
`exactOptionalPropertyTypes`, `noImplicitOverride`,
`noFallthroughCasesInSwitch`, `noUnusedLocals`, `noUnusedParameters`,
`verbatimModuleSyntax`. `@typescript-eslint/no-explicit-any` is an error, along
with the whole `no-unsafe-*` family.

**Rejected:** plain `strict: true`.

**Why:** The two flags that cost the most friction are the two that pay the
most here.

- `noUncheckedIndexedAccess` makes `array[i]` yield `T | undefined`. The
  generator (§8) is almost entirely array indexing over exercise pools, and a
  silent `undefined` there produces a workout with a hole in it rather than a
  crash.
- `exactOptionalPropertyTypes` stops `{ rpe: undefined }` being assignable to
  `{ rpe?: number }`. The database distinguishes "no RPE recorded" from "RPE
  column absent", and so should the types.

If a flag turns out to cost more than it returns, remove it in a `chore/` PR
with a note here — not silently in the middle of a feature branch.

---

## ADR-0004 — Git hooks without husky or lint-staged

**Chosen:** A plain POSIX `sh` script in `.githooks/`, activated by
`git config core.hooksPath .githooks`, which the root `prepare` script runs on
every `pnpm install`.

**Rejected:** husky + lint-staged.

**Why:** The brief calls every package a maintenance liability (§0.3). Two
packages, a `.husky/` directory and a lint-staged config block is a lot of
apparatus for "run one script before commit". `core.hooksPath` is a native Git
feature that does the same thing with no dependency and no install step beyond
the `prepare` script.

Git LFS installs its own `pre-push`, `post-checkout`, `post-commit` and
`post-merge` hooks into the same directory and the two coexist — verified.

**Consequence:** hooks are skippable with `--no-verify`, which is exactly why
the same scan also runs in CI (`.github/workflows/ci.yml`), where it cannot be
skipped.

---

## ADR-0005 — No LICENSE file

**Chosen:** No `LICENSE` file. The repository is private.

**Rejected:** MIT; an explicit proprietary licence file.

**Why:** With no licence, default copyright applies: all rights reserved, no
permission granted to anyone. That is the correct posture for something that may
become commercial. MIT was rejected because it is irreversible on a public
repository — every commit made under it stays licensed under it forever, even
after the file is deleted.

**Consequence:** the repository must stay private. If it is ever made public,
that decision needs its own ADR and a licence chosen deliberately.

---

## ADR-0006 — One Vitest config at the root, not one per package

**Chosen:** A single `vitest.config.ts` at the repository root, collecting
tests from every package.

**Rejected:** Per-package Vitest configs with a workspace file.

**Why:** One runner, one coverage report, one place to change the gate. Per-
package configs mean the coverage threshold for `packages/core` lives somewhere
different from the threshold for everything else, and drift is invisible.

The §4.5 gate is expressed as `coverage.include: ['packages/core/src/**/*.ts']`
with 90% thresholds on lines, functions, branches and statements. Other packages
run their tests but do not gate on coverage — Playwright covers the UI later.

**Consequence:** packages resolve `vitest` from the root `node_modules` rather
than declaring it themselves. Acceptable because there is exactly one runner by
design; if that ever stops being true, this ADR is what to revisit.

---

## ADR-0007 — Inter, and only Inter

**Chosen:** Inter, with a system-font fallback stack.

**Rejected:** Geist (the brief offered either); any pairing of a display face
with a UI face.

**Why:** Inter's numerals are the deciding factor. `font-variant-numeric:
tabular-nums` is a functional requirement in this app — set columns in the
logger have to align vertically or the screen looks broken — and Inter's
tabular figures are unusually well drawn, with a slashed zero and a
one that does not collapse at 12px. Geist is a fine face; this is a coin flip
decided on numerals.

The `.numeric` utility in `tokens.css` applies `tabular-nums` and is mandatory
on every weight, rep count, timer and volume total.

> **Open:** the font file is not yet bundled. The stack currently falls through
> to the system UI font, which renders correctly but is not Inter. Self-hosting
> it (rather than Google Fonts) is needed before Phase 4, because the logger has
> to render correctly offline in a basement.

---

## ADR-0008 — `--text-on-accent`, and two contrast findings

**Chosen:** Add one token, `--text-on-accent: #1f1e1d`, used as the foreground
of filled `accent` and `danger` buttons. The §10 palette is otherwise unchanged.

**Why:** §10 asks for contrast to be verified rather than assumed, so it is
verified in `packages/ui/src/tokens.test.ts` as an executable check. The
measured ratios:

| Pair | Ratio | Verdict |
| --- | --- | --- |
| `--text-primary` on `--bg-surface` | 14.39:1 | AAA |
| `--text-secondary` on `--bg-surface` | 8.31:1 | AAA — clears the brief's requirement comfortably |
| `--text-primary` on `--accent` | **2.96:1** | **Fails AA large** |
| `--text-on-accent` on `--accent` | 5.33:1 | AA body |
| `--text-muted` on `--bg-surface` | **4.27:1** | AA large only |
| `--text-on-accent` on `--danger` | **4.09:1** | AA large only |

Light text on the accent orange fails badly enough that the primary button — the
most-pressed control in the app — would have been unreadable for a meaningful
number of users. Dark ink on the same orange reaches 5.33:1. This changes which
token the Button reaches for, not the palette itself.

**Two gaps remain open, both pinned by tests so they cannot silently worsen:**

1. `--text-muted` at 4.27:1 is restricted to large text and non-essential labels
   until the token is retuned. `#949289` would reach 4.86:1 if we want it usable
   for body copy.
2. `--danger` fills reach only 4.09:1 with the best available foreground
   (light text on the same fill is worse, at 3.86:1). Darkening `--danger` to
   `#a34734` reaches 5.68:1 with `--text-primary` and would restore the
   conventional white-on-red destructive button. Left alone for now because
   destructive fills are rare and always carry a text label.

Both need a palette decision from the owner.

---

## ADR-0009 — The anatomy asset is fetched, never committed

**Chosen:** `packages/anatomy/assets/licensed/` is gitignored. A licensed GLB is
pulled at build time from private storage by a fetch script, and loaded through
the `AnatomyModelSource` adapter (§6) so the viewer never names a specific file.

**Rejected:** committing the model and relying on the repository staying private.

**Why:** Git history is permanent and permission is not. "The repository is
private" is a policy, not a mechanism — a single day of it being public, or one
collaborator with a clone, redistributes a commercially licensed asset in
violation of its terms. Keeping the binary out of history entirely means that
mistake cannot be made.

Git LFS is configured (`.gitattributes`) for `*.glb`, `*.gltf`, `*.ktx2`,
`*.hdr`, `*.bin` and video, set up in Phase 0 before any binary exists, because
retrofitting LFS rewrites history.

**Still open (§6):** Z-Anatomy is CC-BY-SA, and share-alike inside a commercial
product is legally murky. Treat it as development-only and budget for a
commercial licence before any public release.

---

## ADR-0010 — A real Content Security Policy in the Tauri shell

**Chosen:** An explicit CSP in `apps/desktop/src-tauri/tauri.conf.json` allowing
`self`, Tauri IPC, Supabase, PowerSync and `youtube-nocookie.com` frames.

**Rejected:** `"csp": null`, which is what `tauri init` generates and which
disables CSP entirely.

**Why:** The desktop shell is the only one of the five targets that enforces a
CSP, so it is the only place a mistake is catchable at all. Starting permissive
and tightening later never happens.

**Consequence — read this before debugging a blank panel:** a CSP-blocked
request fails *silently* in a WebView. When a new external host appears
(Supabase Storage for hosted video, an analytics endpoint, a font CDN), it must
be added here or it will simply not load, with no error the user can see.

---

## ADR-0011 — Tailwind v4, CSS-first tokens

**Chosen:** Tailwind v4 with `@theme inline` in
`packages/ui/src/tokens.css`. No `tailwind.config.js`.

**Why:** The brief asks for "Tailwind with a custom token layer", which is
precisely what v4's `@theme` is. Raw tokens keep the brief's own names
(`--bg-surface`, `--muscle-heat-3`) and are the source of truth; `@theme inline`
maps them into Tailwind's namespaces so `bg-surface` and `text-secondary`
resolve to `var(--token)` rather than to a baked-in hex. That indirection is
what makes the deferred light theme a CSS override rather than a rebuild.

Two consequences worth knowing:

- Utilities used only inside `packages/ui` or `packages/anatomy` must be
  registered with `@source` in `apps/web/src/styles.css`, or Tailwind tree-shakes
  them out of the app build — it only scans the app's own tree by default.
- `packages/ui/src/tokens.ts` duplicates the palette as TypeScript values
  because three.js materials cannot read a CSS custom property. A test parses
  `tokens.css` and fails if the two ever drift.

---

## ADR-0012 — Workspace packages resolve to source, not to built output

**Chosen:** Each package's `exports` field points at `./src/index.ts`. No build
step, no `dist/`, no `tsc --build` project references between packages.

**Rejected:** Building each package to `dist/` and consuming the output.

**Why:** Nothing here is published. Vite transpiles TypeScript across package
boundaries without complaint, `tsc --noEmit` typechecks each package against the
others' sources, and Vitest imports them directly. Adding a build step would
mean a stale-`dist` failure mode for zero benefit.

**Consequence:** if a package is ever published to a registry, it needs a real
build and this ADR is superseded.

---

## ADR-0013 — React Router and Zustand deferred

**Chosen:** Neither is installed yet, despite both being in the locked stack.

**Why:** §0.3 — ask before adding a dependency, every package is a maintenance
liability. Phase 0 has one screen and no client state worth a store. They go in
when the first route and the first piece of cross-screen UI state actually
exist, which is Phase 3.

**Note for whoever adds the router:** verify it in the Capacitor and Tauri
shells, not only in a browser tab. Embedded WebViews serve from custom schemes
(`capacitor://localhost`, `tauri://localhost`), and `BrowserRouter` history
handling is the classic thing that works in Chrome and then does not work in a
WKWebView. `HashRouter` is the boring fallback; there is no SEO cost here.

---

## ADR-0014 — The PowerSync iOS spike is split, and half of it is deferred

**Chosen:** The §3 spike is split in two. The half that can run on the
developer's Windows machine runs now, on `spike/powersync-ios`. The half that
needs a physical iPhone is written up as a runnable checklist and blocks
**Phase 2**, not Phase 0 or Phase 1.

**Rejected:** Halting all work until a Mac is available; abandoning PowerSync
pre-emptively for `@capacitor-community/sqlite`.

**Why:** The development machine is Windows 11. Building for iOS requires macOS
and Xcode, so the spike as written in §11 — "prove PowerSync can open, write to
and persist a SQLite database inside a real Capacitor iOS build on a physical
device" — is not executable here at all.

Halting was rejected because nothing in Phase 0 (tooling, tokens, CI) or Phase 1
(Postgres schema, RLS, seed data) depends on the answer. The schema is the same
whether it syncs through PowerSync or a hand-rolled queue. Abandoning PowerSync
pre-emptively was rejected because it trades a *possible* problem for a
*certain* pile of sync code we would own forever.

**What this costs if the spike fails:** Phase 2 is rewritten around
`@capacitor-community/sqlite` with a hand-rolled sync queue. Phases 0 and 1 are
unaffected. That is the risk being accepted, stated plainly.

**The gate:** do not start Phase 2 until the iOS half has actually been run on
hardware. See `docs/spikes/powersync-ios.md`.

---

## ADR-0015 — A single-rep set is its own one-rep max

**Chosen:** `estimateOneRepMax(w, 1)` returns `w` exactly, bypassing Epley.

**Rejected:** Applying Epley uniformly for all rep counts in range.

**Why:** Epley at one rep gives `w × (1 + 1/30)`, inflating a genuine single by
3.3%. A lifter who actually hits 100 kg for one would be shown 103.33 kg and
credited with a personal record they did not achieve. PRs are the emotional core
of the app (§9); awarding a fake one corrodes trust in every other number on the
screen.

The formula name is stored alongside every estimate (§5), so if the formula
changes later, historical values stay interpretable instead of becoming mystery
numbers.
