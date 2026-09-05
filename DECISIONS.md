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

> **Superseded by [ADR-0019](#adr-0019--the-repository-is-public-with-a-source-available-licence).**
> The premise below — that the repository stays private — no longer holds.

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
| `--text-primary` on `--accent` | **2.96:1** | **Fails AA large.** The reason `--text-on-accent` exists |
| `--text-on-accent` on `--accent` | 5.33:1 | AA body |
| `--text-muted` on `--bg-elevated` | 4.52:1 | AA body — worst of the four surfaces |
| `--text-primary` on `--danger` | 5.68:1 | AA body |

Light text on the accent orange fails badly enough that the primary button — the
most-pressed control in the app — would have been unreadable for a meaningful
number of users. Dark ink on the same orange reaches 5.33:1. This changes which
token the Button reaches for, not the palette itself.

**Two tokens were retuned, with the owner's approval, so every text pairing in
the app now clears AA body:**

1. **`--text-muted`: `#8a8880` → `#99978f`.** The original was 4.27:1 on
   `--bg-surface` — fine for large text, short of AA for body copy. `#949289`
   was the obvious bump and reaches 4.86:1 there, but it still fails on
   `--bg-elevated` at 4.24:1 — and `--bg-elevated` is what sheets and modals are
   made of, which is exactly where secondary labels live. `#99978f` is the
   smallest step that clears AA body on **all four** surfaces (worst case 4.52:1
   on `--bg-elevated`) while staying visibly dimmer than `--text-secondary`, so
   the three text tiers do not collapse into one grey. A test asserts both
   properties.
2. **`--danger`: `#c4614c` → `#a34734`.** The original reached only 4.09:1 with
   its best available foreground. The darker red is 5.68:1 with
   `--text-primary`, which also restores the conventional white-on-red
   destructive button instead of the dark ink it briefly used.

**Why the two filled variants take opposite foregrounds.** `Button` uses
`--text-on-accent` (dark) on `accent` and `--text-primary` (light) on `danger`.
That reads as an inconsistency until you check the numbers: `--accent` is a
light orange and `--danger` is a dark red, so each needs the ink the other
cannot use. A test pins that relationship so nobody "fixes" it later.

---

## ADR-0009 — The anatomy asset is fetched, never committed

**Chosen:** `packages/anatomy/assets/licensed/` is gitignored. A licensed GLB is
pulled at build time from private storage by a fetch script, and loaded through
the `AnatomyModelSource` adapter (§6) so the viewer never names a specific file.

**Rejected:** committing the model and relying on the repository staying private.

> **Amended by [ADR-0019](#adr-0019--the-repository-is-public-with-a-source-available-licence).**
> The repository is public, so this is no longer a precaution against a
> hypothetical future — it is the only thing standing between us and a
> licence violation. The fetch script is a hard Phase 5 requirement, and a
> pre-commit guard now refuses the directory even under `git add -f`.

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

---

## ADR-0016 — The PowerSync fallback is not what the brief assumed

**Supersedes the fallback described in
[ADR-0014](#adr-0014--the-powersync-ios-spike-is-split-and-half-of-it-is-deferred).**

**Finding:** `@powersync/web` does not hard-depend on OPFS. It ships four
virtual filesystems, and one of them — `IDBBatchAtomicVFS` — is backed by
IndexedDB and touches OPFS not at all.

**Why this matters:** the brief treats §3's risk as binary. Either OPFS works
inside a WKWebView, or we abandon PowerSync for `@capacitor-community/sqlite`
plus a hand-rolled sync queue. That is not the shape of the problem. The real
decision tree has three outcomes:

1. An OPFS backend works on iOS → ship it.
2. Every OPFS backend fails but `IDBBatchAtomicVFS` works → **still PowerSync**,
   with one different config line on iOS. Slower, but sync rules, conflict
   handling and the whole client stay. This is a far better worst case than the
   brief anticipated.
3. Nothing works → only then the hand-rolled queue.

The spike harness on `spike/powersync-ios` therefore probes all four backends
independently, each in its own database file so a corrupt database from one
cannot mask another passing.

**Verified in Chromium** (Playwright, headless): all four backends open, write
1,000 rows and persist across a reload. This validates the harness, not iOS —
OPFS in Chromium was never in doubt. Full numbers in
[`docs/spikes/powersync-ios.md`](./docs/spikes/powersync-ios.md).

**Two things that will matter in Phase 2 regardless of which backend wins:**

- No `SharedArrayBuffer` and no cross-origin isolation was needed. Good news:
  setting COOP/COEP headers inside a Capacitor WebView is awkward, and it turns
  out we do not have to.
- `navigator.storage.persisted()` returns `false` — the local database is
  **evictable**. On iOS, Safari clears unused origin storage after roughly seven
  days of no use. A user coming back from a two-week holiday could open the app
  to an empty local database. Whatever the VFS answer is, Phase 2 has to call
  `navigator.storage.persist()` and design for the case where it is refused.
  That is a real requirement the brief does not mention.

---

## ADR-0017 — Answers to the brief's §12 open questions

Decided with the owner at the Phase 0 → Phase 1 boundary, while migrations are
still cheap. Recorded before implementation so Phase 1 has a spec rather than a
memory.

### §12.1 — Offline conflict resolution

**Chosen:** Row-level last-write-wins for `profiles`, `routines`,
`routine_exercises`, `workout_sessions` and `session_exercises`.
**`session_sets` are treated as append-mostly and effectively conflict-free.**

**Rejected:** field-level merge everywhere (needs per-column timestamps on every
user table and real merge logic in `packages/db` — more Phase 2 surface than the
problem justifies); plain last-write-wins on everything including sets.

**Why the exception for sets:** a completed set is a *fact that happened*, not a
field to be overwritten. Under whole-row LWW, two devices logging different sets
in the same session can have the stale write erase a set the lifter actually
did. Losing a logged set is the single worst thing this app can do — it is the
entire reason the advanced user opens it. Rows are keyed so concurrent inserts
coexist; editing an existing set stays LWW on that row alone.

### §12.2 — Shareable routines

**Chosen:** out of scope for v1, matching the brief's own instinct. No sharing
tables, no public routine IDs, and no abstraction added "for when we add
sharing".

### §12.3 — Rest timer defaults

**Chosen:** derived from `mechanic`, overridable per exercise, with one global
fallback in settings. Roughly 180s for compounds, 90s for isolation.

**Rejected:** a single global default (90s after a heavy squat is wrong, 180s
after a lateral raise is dead time); per-exercise only (means setting a
considered number on all 50 seeded exercises and every one added after).

**Consequence for Phase 1:** `exercises` gets a nullable
`default_rest_seconds int`, where null means "derive from mechanic". The
derivation constants live in `packages/core` as a single exported map, next to
the heat-map thresholds, so they are tunable without hunting through the logger.

### §12.4 — Onboarding depth

**Chosen:** lazy. Infer equipment, and prompt only when a generated workout
would otherwise be blocked. No first-run equipment audit.

**Why:** an equipment audit is a wall of checkboxes in front of a user who has
not yet seen the app do anything, and the beginner it is aimed at does not
reliably know what half the items are. Asking at the moment of need is both a
smaller question and a better-motivated one.

### §12.5 — Schema problems, all five accepted

The brief invited these while migrations are cheap. All five are adopted for
Phase 1:

1. **`exercise_equipment` join table** replaces `equipment_id` +
   `secondary_equipment_id`. Two slots cannot express a barbell hip thrust
   (barbell + bench + pad), "which slot is which" is unenforced, and §8's
   "avoid two consecutive exercises on the same station" rule needs to know
   which item *is* the station. The table carries `is_primary boolean`.
2. **Bodyweight load gets a representation.** `weight_kg` alone cannot say
   whether a pull-up was bodyweight, weighted or assisted, so §9's volume maths
   attributes zero volume to every pull-up ever logged. Adding
   `session_sets.load_type ('external' | 'bodyweight' | 'bodyweight_plus' |
   'assisted')`, with `weight_kg` meaning *added or assisted* load, plus the
   user's bodyweight snapshotted on `workout_sessions` so historical volume
   stays correct as they gain or lose weight.
3. **`personal_records.formula`**, because §5 already says to store the formula
   name alongside the value and the table as specified has nowhere to put it.
   Without it, `estimated_1rm` rows become mystery numbers the day the formula
   changes. See [ADR-0015](#adr-0015--a-single-rep-set-is-its-own-one-rep-max).
4. **Fractional ordering keys instead of integer `order_index`.** Two devices
   reordering the same routine offline produce duplicate indices that row-level
   LWW cannot repair. A fractional or lexicographic key makes an insert between
   two items a single-row write with no renumbering — which is also what makes
   reordering cheap online.
5. **`muscles.mesh_node_names text[]`, not a single `mesh_node_name`.** §6
   specifies `_l` / `_r` meshes per muscle while §5 makes muscle rows
   side-agnostic, so one row maps to one *or two* GLB nodes. A single column
   cannot hold both, and the Phase 5 startup validation has to check every node
   it expects to exist — otherwise it passes while a muscle is silently
   unclickable, which is exactly the failure the brief warns about.

---

## ADR-0018 — Secret-scan exceptions go in `.gitleaksignore`, by fingerprint

**Chosen:** A `.gitleaksignore` file at the repository root listing individual
finding *fingerprints*, each with a comment explaining why it is safe.

**Rejected:** allowlisting `.env.example` by path in a `.gitleaks.toml`;
rewriting history to remove the offending commit; dropping the full-history
scan in favour of scanning only the pull request diff.

**Why this came up.** The first CI run after merging Phase 0 failed. `.env.example`
used `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy.dummy` as its dummy Supabase
anon key. That string is a base64 JWT *header* decoding to
`{"alg":"HS256","typ":"JWT"}`, with the literal word `dummy` as both payload and
signature — it grants nothing and never did. But at 4.59 bits of entropy it
trips gitleaks' `generic-api-key` rule, and the rule is right to be suspicious:
it cannot tell a decorative JWT from a real one.

Worth noting that the local pre-commit hook did *not* flag it, and was correct
not to: its JWT pattern requires all three segments to be long, so `.dummy.dummy`
falls outside it. The two scanners disagreeing is the system working — the cheap
local check stays quiet on obvious non-secrets, and the thorough CI check
catches everything and gets an explicit, reviewed exception.

**Why by fingerprint rather than by path.** `.env.example` is precisely the file
where someone will one day paste a real key by mistake — it sits next to
`.env.local` and it is the one env file that *is* committed. Allowlisting the
path would switch off scanning at exactly the point of highest risk. A
fingerprint exception covers one known finding in one known commit and nothing
else, and the file becomes a short, auditable list of every exception ever
granted.

**Why not rewrite history.** The finding lives in commit `c6a31f8`, which is
already on `main` and already tagged `v0.1.0-phase-0`. Rewriting it would
invalidate the tag and every existing clone, to remove a string that is not a
secret. Not worth it.

**Also fixed forward:** the placeholder is now
`paste-the-anon-key-from-your-supabase-dashboard`, which no scanner will ever
flag, so no future commit needs an exception.

---

## ADR-0019 — The repository is public, with a source-available licence

**Supersedes [ADR-0005](#adr-0005--no-license-file).**

**Chosen:** the repository stays **public**, and carries a `LICENSE` file that
grants no rights: source-available, all rights reserved, explicitly not open
source.

**Rejected:** making it private (ADR-0005's assumption); MIT or any other
permissive licence.

**Why:** the owner wants the work to be readable — a portfolio piece and
something to discuss. That is a legitimate goal and it is worth more than the
mild secrecy of a private repo, given there is no proprietary algorithm here,
just careful engineering. What it is *not* worth is ambiguity about who may use
it. A public repository with no licence is the worst of both worlds: GitHub's
Terms of Service let anyone view and fork it, while copyright law grants no
permission to use it, so nobody can tell what they are allowed to do. The
`LICENSE` file removes that ambiguity in the direction we want — read it, learn
from it, ask before using it.

MIT was rejected for the reason ADR-0005 already gave and which public
visibility makes sharper: it cannot be taken back. Every commit made under MIT
stays MIT forever, and this may become commercial.

**What changes as a consequence.** Three things that were precautions are now
load-bearing:

1. **Row Level Security is the only thing protecting user data.** It always was
   in principle — the Supabase anon key is public by design and ships in the
   client bundle — but with a public repo, an attacker also has the schema, the
   policies and the query shapes. Every user-owned table gets RLS in Phase 1 and
   there is no "we'll add the policy later" for any of them.
2. **The anatomy asset can never be committed.** See the amendment on
   [ADR-0009](#adr-0009--the-anatomy-asset-is-fetched-never-committed). A
   commercially licensed GLB in a public repo is a licence violation and git
   history is permanent. `.gitignore` covers the directory, and the pre-commit
   hook now refuses it even under `git add -f`, because `.gitignore` alone is a
   suggestion.
3. **Binary assets must actually reach Git LFS.** A collaborator who clones
   without running `git lfs install` gets no clean filter and commits raw bytes,
   putting an 8 MB model in every future clone forever. The pre-commit hook now
   checks that staged `.glb` / `.gltf` / `.ktx2` / `.hdr` / `.bin` / video files
   are LFS pointers and refuses them if not.

**One incidental benefit:** GitHub Actions minutes are free on public
repositories, so the tag-triggered native builds in `release.yml` cost nothing.

**Still true, and worth restating:** the service role key and the Anthropic API
key must never appear in this repository or in the client bundle. That was
already the rule; a public repo means a mistake is public immediately and
permanently, rather than merely recorded. Two independent scanners enforce it —
see [ADR-0004](#adr-0004--git-hooks-without-husky-or-lint-staged) and
[ADR-0018](#adr-0018--secret-scan-exceptions-go-in-gitleaksignore-by-fingerprint).

**Open, for the owner:** the copyright line reads `tinkekodira`. Replace it with
your legal name if you ever want to enforce it — a GitHub handle is weaker
evidence of ownership than a name.

---

## ADR-0020 — Enumerated values are `text` with a CHECK, not Postgres enums

**Chosen:** `mechanic text not null check (mechanic in ('compound','isolation'))`
and the same shape for every other enumerated column.

**Rejected:** native `create type ... as enum`.

**Why:** two reasons, both about the road ahead rather than today.

1. **Enums are hard to shrink.** Postgres can add a value to an enum but not
   remove or rename one without recreating the type and rewriting every column
   that uses it. `set_type`, `load_type` and `record_type` are all things a v1
   is likely to get slightly wrong. A CHECK constraint is dropped and re-added
   in one statement.
2. **PowerSync replicates to SQLite, which has no enums.** They arrive as text
   at the other end regardless, so the native type buys type safety only on the
   half of the system that already has the strictest guarantees.

**Cost accepted:** slightly weaker introspection, and Drizzle will type these as
`string` unless we narrow them by hand in Phase 2. Narrowing them in TypeScript
is a one-line union per column and gives us the same safety at the layer that
actually writes the queries.

---

## ADR-0021 — `user_id` is denormalised onto child tables, kept honest by composite foreign keys

**Chosen:** `routine_exercises`, `session_exercises`, `session_sets` and
`personal_records` each carry their own `user_id`, and each child declares a
composite foreign key onto `(id, user_id)` of its parent.

**Rejected:** reaching the owner through a join in the RLS policy, e.g.
`using (exists (select 1 from workout_sessions s where s.id = session_id and
s.user_id = auth.uid()))`.

**Why:** the joining form is evaluated **per row**. On the logger's hot path —
a session with a few hundred sets, read on every screen open — that is the
difference between instant and noticeable, and it degrades as history grows.
PowerSync sync rules also want a direct column to bucket on; deriving the bucket
through a join is possible but slower and more fragile.

**Why it is safe.** Denormalised ownership is normally a bug waiting to happen:
nothing stops a child row claiming a different owner than its parent, and now
the two disagree. The composite foreign key removes that possibility
structurally rather than by convention — the parent declares `unique (id,
user_id)`, the child references *both* columns, and Postgres refuses any insert
where they do not match. There is no trigger to forget and no application code
to get wrong.

Verified by a test: inserting a `routine_exercise` owned by Judy that points at
Ivan's routine is rejected by the database.

---

## ADR-0022 — The schema is tested against real Postgres, in-process, with PGlite

**Chosen:** `@electric-sql/pglite` — Postgres compiled to WebAssembly — as a dev
dependency of `packages/db`. A harness applies the real migration files to a
fresh database and the tests assert against it.

**Rejected:** `supabase start` with Docker; testing against a shared hosted
Supabase project; not testing the schema at all and finding out at `db push`.

**Why:** the development machine has no Docker, so the alternative was writing
several hundred lines of SQL that could not be executed until a Supabase project
existed. That is exactly the situation where a subtle mistake — a policy that
never fires, a constraint that is not quite what the comment claims — survives
into production.

PGlite needs no Docker, no network and no `supabase` binary. The whole suite
runs in about two seconds, so it gates every pull request rather than being a
thing someone remembers to run.

**What it is not.** PGlite is Postgres, not Supabase. There is no GoTrue, no
PostgREST, no Realtime. The harness stubs the pieces the migrations actually
touch: the `anon` / `authenticated` / `service_role` roles, an `auth.users`
table, and `auth.uid()` implemented the way Supabase implements it — reading the
`sub` claim from the `request.jwt.claims` setting. That is faithful enough to
exercise RLS as a genuinely signed-in user, which is the part worth testing.

It also runs a different Postgres major than the hosted project — PGlite 0.5 is
Postgres 18, the linked Supabase project is 17.6 — so it can in principle accept
syntax the real one rejects. `supabase db push` remains the final word; this
catches the mistakes long before that. In practice the migrations applied to the
real project unchanged on the first attempt, which is the outcome this harness
exists to produce.

**One trap worth recording**, because it made the RLS tests silently vacuous
before it was caught: PGlite runs each `exec()` in its own implicit transaction,
so `SET LOCAL ROLE authenticated` is reverted before the next statement and
every query runs as the superuser — which bypasses RLS entirely. The harness
uses session-scoped `SET ROLE` instead. A test that asserts isolation while
running as a superuser passes for the wrong reason and protects nothing.

---

## ADR-0023 — Exercise search uses a generated column, because `array_to_string` is not IMMUTABLE

**Chosen:** an IMMUTABLE helper, `public.exercise_search_text(name, aliases)`, a
stored generated column `exercises.search_text` built from it, and one GIN
trigram index on that column.

**Rejected:** a trigram index directly on the expression
`array_to_string(aliases, ' ')`; a trigger-maintained plain column; separate
indexes on `name` and `aliases`.

**Why:** Brief §7 wants fuzzy search across `name` **and** `aliases`, so that
"bp" finds bench press and "incline db" finds incline dumbbell press. The
obvious implementation does not compile: `array_to_string` is not marked
IMMUTABLE, and Postgres refuses non-immutable functions in both index
expressions and generated columns. It is genuinely immutable for `text[]` input,
so a thin declared-immutable wrapper is correct rather than a lie.

A generated column was preferred over a trigger because it cannot drift — there
is no ordering of triggers to reason about and no path that updates the row
without updating the search text.

**Note for Phase 2/3:** Postgres logical replication does not carry generated
columns, so `search_text` stays server-side. The offline mirror the brief asks
for is a SQLite FTS5 index built locally over the same two fields — same
behaviour, different mechanism, and the two must be kept deliberately in step.

Verified by tests using the brief's own examples.

---

## ADR-0024 — Seed data ships as migrations, and six things seeding taught us

**Chosen:** the muscle groups, muscles, equipment and 50 exercises are
**migrations** under `supabase/migrations/`, not files under `supabase/seed/`.
Every insert is idempotent on `slug` with an `on conflict do update`.

**Rejected:** `supabase/seed/*.sql` with `supabase db seed`.

**Why:** this is data the application cannot run without — an app with no
muscles has no anatomy model and no exercise panel. `db seed` only runs during
a local `db reset`, which needs Docker, and there is no Docker here. Migrations
deploy through `db push`, which is the only path we have to the real project.
The idempotent form means correcting a cue later is a one-line follow-up
migration rather than a delete-and-reinsert that would break foreign keys from
anyone's logged sessions.

`supabase/seed/` stays for what it is actually good at: development-only
fixtures — fake users, fake sessions — that must never reach production.

### What writing the seed data found

Seeding is where a schema meets reality. Six things surfaced that reading the
brief could not have:

**1. `is_time_based`, a missing column.** A plank and a farmer carry are
prescribed in seconds, not repetitions, and nothing in §5 could say so. Writing
`60` into a reps column produces a personal record of "60 reps of plank" and a
volume calculation that is nonsense. One boolean fixes it: the logger shows a
timer, 1RM estimation is skipped, and volume treats the set as time under
tension.

**2. The §5 equipment list is missing a back extension bench.** Without it the
back extension had to be mapped to "bodyweight only", which would have the
generator prescribe it to someone training in a hotel room. Added as a 29th
item, flagged in the migration.

**3. Nothing in the 50 exercises trains the neck.** `sternocleidomastoid` is
seeded so the model is anatomically complete but marked `is_selectable = false`,
which is exactly what the flag exists for (§5). A selectable muscle with no
exercises opens an empty panel, and a user cannot tell that from a bug.

**4. Rotation was missing as a movement pattern**, and the obliques had no
exercise anywhere as a primary mover. Swapped the dumbbell curl — the fourth of
four biceps exercises — for a cable woodchop. Biceps keep three, the obliques
get a panel, and anti-rotation joins the covered patterns.

**5. Trigram search ranks the wrong squat.** Ordering by `similarity()` alone is
length-sensitive: "Front Squat" scores higher than "Barbell Back Squat" simply
for being shorter, so a beginner typing "squat" is handed the harder, rarer
lift. The ranking contract is now tiered — exact match, then prefix, then
substring, with `popularity_rank` breaking ties inside a tier, and fuzzy
similarity only as a last resort for genuine typos. Pinned by tests; Phase 3
implements it in the repository layer.

**6. Five pieces of equipment have no exercise yet** — decline bench, hip thrust
machine, kettlebell, power rack, resistance bands, smith machine. Kept anyway,
because the equipment list is the user's "my gym has this" vocabulary, which is
broader than 50 exercises. Pinned by a test so the set cannot grow unnoticed.

### `video_provider` is 'none' on all fifty

**Rejected:** the brief's "v1 = YouTube placeholders".

**Why:** a made-up video ID renders as a broken player, which is strictly worse
than the text-only state the offline path already handles well. Every exercise
carries at least two coaching cues and three instruction steps, enforced by a
CHECK constraint, so the detail view is genuinely useful with no video at all.
Real IDs go in when someone has actually watched each video and confirmed it
teaches the lift — which is a different kind of work from writing a schema.

### On `recruitment_weight`

The values are informed estimates, not EMG measurements. They exist to order
the muscle panel sensibly (§6) and nothing else depends on their exact
magnitude — the heat map counts whole sets by role (§9), deliberately. They are
therefore cheap to tune later, and should be tuned by someone who trains rather
than by someone reading a table.

---

## ADR-0025 — Auth: email and Google, no Apple, and a trap in `config push`

### Sign in with Apple is dropped from v1

**Chosen:** email/password and Google. No Apple.

**Rejected:** the brief's §11 "email/password plus Sign in with Apple and Google".

**Why:** Apple's provider needs a **paid Apple Developer Program membership**
($99/year) to create the Service ID and signing key. The owner's decision is
that v1 is never published to the App Store — it goes from a PC to a phone for
personal testing — so the membership buys nothing at this stage.

**The consequence to remember before any public iOS release:** Apple's App
Store Review Guidelines *require* Sign in with Apple on any app that offers a
third-party social login. Offering Google without Apple is grounds for
rejection. This is not a "nice to add later" — it is a hard gate on shipping to
the App Store, and it needs the membership plus a Mac.

Recorded in `supabase/config.toml` as a comment above the commented-out
`[auth.external.apple]` block, so whoever tries to enable it finds the reason.

### `supabase config push` applies your *local dev* config to production

**This is the finding worth reading.** `config.toml` is generated by
`supabase init` with defaults tuned for a local Docker stack. `config push`
sends the whole file to the linked project. Ours quietly weakened two live
settings on the first push:

| Setting | Was (remote) | CLI default pushed | Restored to |
| --- | --- | --- | --- |
| `auth.email.max_frequency` | `1m0s` | **`1s`** | `60s` |
| `auth.email.otp_length` | `8` | **`6`** | `8` |

A one-second floor on `max_frequency` lets anyone spam a password-reset inbox.
Neither change was intended, and neither would have been noticed without reading
the diff `config push` prints — which is easy to skim past because most of it is
noise.

**The rule this establishes:** `config.toml` in this repository is a
**production** config that happens to also run locally, not the reverse. Before
any `config push`, read the diff. `secure_password_change` was also turned on
while fixing these, since it costs nothing and stops a hijacked session locking
the real owner out.

### PKCE, not the implicit flow

The OAuth redirect returns to a public client that holds no secret, so there is
nothing to prove the code was issued to *us*. PKCE's code verifier is what stops
an intercepted redirect being exchanged by someone else. It is also the only
flow that behaves correctly inside a WebView, which matters from Phase 2.

### A token refresh that returns nothing is not a sign-out

`nextAuthState` deliberately holds the current session when `TOKEN_REFRESHED`
arrives with a null session. Supabase emits that on a transient network failure,
and the refresh retries on its own. Treating it as a sign-out would eject
someone **mid-workout** because the gym wifi dropped for a second — which, in an
app whose entire premise is working offline in a basement, would be the worst
possible bug. `INITIAL_SESSION` with null *is* a genuine signed-out answer, and
is handled as one.

This is why the mapping lives in `auth-state.ts` as a pure function rather than
inline in the store: it is the part with real decisions in it, and it can be
tested without a browser.

### No router yet

One gate and one screen do not need route matching. React Router is installed
but unused; it lands in Phase 3 with the first real navigation, along with the
WebView caveat from [ADR-0013](#adr-0013--react-router-and-zustand-deferred).

### Verified against the live project, not assumed

A script exercised the real stack end to end and all fifteen checks passed:
signup returns a session with confirmations off, the profile trigger fires on a
real GoTrue user with the right defaults, an authenticated user reads all 50
exercises and 37 muscles, **Bob sees none of Alice's routines and gets a 403
trying to write one owned by her**, and an anonymous caller reads nothing.

Two throwaway accounts on `@example.com` (IANA-reserved, undeliverable) remain
in the project and can be deleted from Dashboard → Authentication → Users.
