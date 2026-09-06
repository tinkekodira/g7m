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

---

## ADR-0026 — iOS ships as a Home Screen web app, and the spike resolves to "keep PowerSync"

**Supersedes the fallback plan in [ADR-0014](#adr-0014--the-powersync-ios-spike-is-split-and-half-of-it-is-deferred)
and [ADR-0016](#adr-0016--the-powersync-fallback-is-not-what-the-brief-assumed).**

### The spike is resolved: outcome 1

`OPFSCoopSyncVFS`, `AccessHandlePoolVFS` and `IDBBatchAtomicVFS` all open, write
1,000 rows and survive process death on **Chromium, WebView2 and WebKit on iOS
18.7**. `OPFSWriteAheadVFS` fails on WebKit and is excluded on every platform.

**PowerSync stays.** The `@capacitor-community/sqlite` plus hand-rolled sync
queue that §3 prepared for is not needed. Full numbers in
[`docs/spikes/powersync-ios.md`](./docs/spikes/powersync-ios.md).

Phase 2 configuration, decided:

- Default `OPFSCoopSyncVFS`; runtime-fall back to `IDBBatchAtomicVFS` when OPFS
  is unavailable; never select `OPFSWriteAheadVFS`.
- Call `navigator.storage.persist()` at startup. The harness only *queried*
  `persisted()`, which returned false on all three engines — that records "we
  never asked", not "refused". iOS clears unrequested storage after about a
  week, and this app is explicitly for people who may not train for a fortnight.

### iOS is delivered as a Home Screen web app, not a native build

**Chosen:** ship the web build as an installable PWA. Users add it to the iPhone
Home Screen.

**Rejected:** a Capacitor iOS build (needs a Mac, which does not exist here);
waiting for Mac access before shipping anything to a phone.

**Why:** the owner develops on Windows and owns an iPhone. A Capacitor iOS app
cannot be built without macOS and Xcode — no amount of paying Apple changes
that. So the choice was between a usable app on the actual phone today, and a
native app on nobody's phone indefinitely. For a private v1 that is not on the
App Store, the Home Screen route costs nothing and works now. The spike above
was run this way and behaved correctly.

**`apps/mobile` is parked, not deleted.** The Capacitor shell still builds in CI
and remains the path to a native app whenever a Mac appears — or to Android, if
an Android device ever does. It is simply not the delivery mechanism for v1.

### What this costs, and what Phase 4 has to do about it

Three §8 requirements for the logger are affected. None is fatal; all need
designing around rather than discovering later.

| §8 requirement | On an iOS Home Screen app |
| --- | --- |
| Keep the screen awake during a session | ✅ Screen Wake Lock API, WebKit 16.4+ |
| Haptic feedback on set completion | ❌ **No Vibration API on iOS**, at all |
| Rest timer fires a notification when it ends | ⚠️ **No local scheduled notifications** |

**Haptics** simply do not exist on iOS in a web context. Android and desktop
browsers have the Vibration API; WebKit has never shipped it and shows no sign
of doing so. Set-completion feedback on iOS has to be visual and audible
instead. That is a real downgrade for a screen used one-handed in poor light,
and it should be designed for deliberately rather than left as a silent no-op.

**Notifications** are the sharper problem. iOS 16.4+ supports Web Push for
Home Screen apps, but there is **no way to schedule a local notification** — the
Notifications API can only fire while the page is running, and a backgrounded
web app is suspended. So "rest timer continues in the background and fires a
notification" cannot work as written. The workable design is: hold a wake lock
for the duration of an active session so the app stays foreground and the timer
stays visible and audible. That is a bigger change to the Phase 4 design than it
sounds, and is flagged here so it is not discovered while building the logger.

**A web app manifest is now required**, not optional — name, icons,
`display: standalone`, `theme_color` matching `--bg-base`. Phase 2 work.

### One caveat on the spike result

A Home Screen web app and a Capacitor WKWebView both run WebKit but do not share
a storage context. This result is strong evidence that WebKit's OPFS is sound on
iOS 18, which was the risk the brief identified. It is not proof about the
Capacitor shell. Since Home Screen *is* the shipping target for v1, that gap
does not block anything — but re-run the harness in a real Capacitor build the
first time a Mac is available.

---

## ADR-0027 — The PWA build: relative base, generated icons, storage asked for

Implementation notes for [ADR-0026](#adr-0026--ios-ships-as-a-home-screen-web-app-and-the-spike-resolves-to-keep-powersync).

### `base: './'`, not `--base` per deployment

**Chosen:** a relative base in `vite.config.ts`, so one build artefact works at
the root in development, under `/g7m/` on GitHub Pages, and at the custom
origins Capacitor and Tauri serve from.

**Rejected:** passing `--base=/g7m/` in the Pages workflow.

**Why:** a build that differs per target is a class of bug diagnosed from a
blank white screen and a console full of 404s. One artefact, deployable
anywhere, removes the question. It also survived an accident that made the point
nicely — Git Bash silently rewrote `--base=/g7m/` into a Windows path during
local verification, producing `href="/Program Files/Git/g7m/…"`. On a Linux
runner it would have worked, so the flag was doing nothing except creating a
difference between my machine and CI.

**Consequence for Phase 3:** relative asset URLs resolve against the current
path, so a nested route would break them. `HashRouter` avoids this entirely and
is already the recommendation in
[ADR-0013](#adr-0013--react-router-and-zustand-deferred) for WebView reasons.
Two independent arguments for the same choice.

### Icons are generated, not committed as binaries

`scripts/generate-icons.mjs` draws the mark from `--bg-base` and `--accent` and
encodes the PNGs directly — PNG is a container around zlib-compressed
scanlines, and a flat-colour glyph is about sixty lines of arithmetic. No image
dependency, the palette stays the single source of truth, and anyone can read
what the mark is without opening an editor.

Every part of the dumbbell sits inside the central circle of radius 0.4, the
`maskable` safe zone, so Android can crop to a circle or a squircle without
clipping it.

### Storage persistence is requested, not merely observed

`ensurePersistentStorage()` runs once at startup and the result is shown on the
home screen. The spike measured `persisted() === false` on all three engines,
which recorded "nobody asked" — the app now asks, and carries the answer.

A refusal is a real state the app must handle rather than treat as failure: it
means the local database is evictable, so the synced copy is the durable one.
The user-facing wording says exactly that, because "your data may be deleted" is
alarming and wrong when a server copy exists.

---

## ADR-0028 — The local schema is hand-written PowerSync, not Drizzle, and a test stops it drifting

**Chosen:** define the device's SQLite schema with PowerSync's own
`Schema`/`Table`/`column` API in `packages/db/src/schema/app-schema.ts`, and
prove it still matches Postgres with a test that reads the real migrations.

**Rejected:** Drizzle plus `@powersync/drizzle-driver`, which the Phase 1 notes
in `packages/db/src/index.ts` had assumed.

**Why the reversal.** PowerSync needs its own schema object regardless — the
local tables are views over a JSON-backed store, and the SDK builds them from
that object. Drizzle would therefore be a *second* schema definition, and
`@powersync/drizzle-driver` exists to derive the first from it. That driver is
at 0.8.0. Putting a pre-1.0 package between the repository layer and the
database that holds logged sets buys typed query building and costs a dependency
on the one code path where ADR-0017 says failure is unacceptable.

The typing argument also turns out to be weaker than it looks. SQLite has three
types and Postgres has hundreds, so a mapping layer between the stored row and
the domain object is needed either way — `numeric` arrives as a double,
`boolean` as 0 or 1, `text[]` as JSON. That layer is where the real work is, and
Drizzle does not remove it.

**What replaces the safety Drizzle was meant to provide.** Neither approach
would have caught the actual risk, which is Postgres and the client drifting
apart: Drizzle does not read the migrations either. `app-schema.test.ts` does.
It loads every migration into PGlite — the harness from
[ADR-0022](#adr-0022--the-schema-is-tested-against-real-postgres-in-process-with-pglite)
— and compares, column by column, in both directions:

- every local column exists in Postgres, with a type SQLite can hold;
- every Postgres column is either synced, or listed in `UNSYNCED_COLUMNS` with a
  written reason.

The second direction is the valuable one. It found a real omission on its first
run: `exercises.is_time_based`, added during seeding
([ADR-0024](#adr-0024--seed-data-ships-as-migrations-and-six-things-seeding-taught-us)),
was not being synced. Nothing would have failed. Every plank and farmer carry
would simply have rendered a rep stepper instead of a timer, and earned a
personal record of "60 reps of plank" — discovered by a user, months later, with
no error anywhere to explain it.

**Reversible.** The Drizzle question can be reopened when the driver reaches
1.0; the change would be contained to `packages/db`, and the drift test is worth
keeping either way.

---

## ADR-0029 — Ordering is a base-36 fractional key, and the alphabet is not arbitrary

**Chosen:** `order_key text`, generated by `packages/core/src/order-key.ts`,
over the alphabet `0-9a-z`. Ties break on `id`.

**Why not integers,** restating [ADR-0017 §12.5.4](#adr-0017--answers-to-the-briefs-12-open-questions)
now that it is built: an integer index makes every insert a rewrite of all its
siblings, so dragging one exercise to the top of a routine becomes ten row
updates, ten rows to sync, and ten chances for row-level last-write-wins to lose
one. A fractional key makes it a single-row write.

**Why base 36 and not base 62.** Base 62 packs more order into fewer
characters, and it is a trap. Postgres compares `text` under the database
collation, where `'a' < 'B'`; SQLite compares bytes. A mixed-case alphabet
would mean the server and the device disagree about the order of the same list,
which is a bug that appears only after a sync and only for some lists. Digits
plus lowercase has no case to fold and sorts identically under both. The cost is
5.2 bits per character instead of 5.95, which for lists of tens of items is
nothing.

**Why ties break on id.** The column is deliberately not unique — two devices
editing offline can mint the same key, and a unique constraint would turn that
into a failed sync rather than a cosmetic tie. So the key alone is a partial
order, and something has to complete it or the same data renders differently on
each device. `id` is arbitrary and identical everywhere, which is all that is
required.

**Key growth is accepted.** Appending repeatedly bisects the remaining space, so
a key grows one character per five or so appends: a hundred sets on a single
exercise reaches about twenty characters. The "integer part" refinement that
holds appends at constant length is not worth its complexity here. A thousand
random inserts are tested and stay under twenty characters.

---

## ADR-0030 — Sync rules, the publication and the client schema are one source of truth

Three lists have to agree for a row to reach a device, and they live in three
places that cannot see each other:

| Where | What it decides | Lives in |
| --- | --- | --- |
| Publication | which tables are on the replication stream | Postgres |
| Sync rules | which rows each device receives | the PowerSync dashboard |
| Client schema | where the device puts them | the app bundle |

A disagreement between any two produces **no error anywhere**. The build passes,
sync reports healthy, and one table is simply always empty on every phone.

**Chosen:** generate `powersync/sync-rules.yaml` from the client schema and
commit it; write the publication as a migration; and test all three against each
other in CI.

- `sync-rules.test.ts` renders the YAML from `AppSchema` and asserts the
  committed file matches, via `toMatchFileSnapshot`. `pnpm sync-rules`
  regenerates it. This replaced a standalone generator script, which Node could
  not run: type stripping does not resolve a `.js` import specifier to a `.ts`
  file, and vitest's file snapshots do the same job with no new dependency.
- `powersync-publication.test.ts` reads `pg_publication_tables` out of PGlite
  and asserts it is exactly the set of synced tables — not a superset, not
  `FOR ALL TABLES`, and never the `auth` schema.

**Columns are named, never `SELECT *`.** Beyond keeping the file an exact
statement of the contract, `SELECT *` on `exercises` would try to carry
`search_text`, which is `GENERATED ALWAYS`. Postgres logical replication does
not deliver generated columns before Postgres 18, so that column would arrive as
nulls and offline search would silently return nothing.

**So `search_text` is rebuilt on the device instead.** It is
`lower(name || ' ' || aliases)`, and both of those are already synced.
`exerciseSearchText()` in `@g7m/core` reproduces the SQL function exactly, which
removes the dependency on replication behaviour and makes the matching testable
without a database. The tiered ranking from
[ADR-0023](#adr-0023--exercise-search-uses-a-generated-column-because-array_to_string-is-not-immutable)
is reproduced with it — `similarity()` is length-sensitive and ranked Front
Squat above Back Squat for "squat", and the offline path must not reintroduce
that.

**PowerSync bypasses RLS, and this is the part to remember.** Replication reads
the write-ahead log, underneath the permission system. Row level security does
not apply to it. What keeps one user's history away from another is the
`user_data` bucket parameter, not RLS — so a mistake in the sync rules is a data
breach and not a bug. `sync-rules.test.ts` asserts every user-owned table
carries `WHERE user_id = bucket.user_id` and that none of them appear in the
shared `catalogue` bucket.

**Consequence:** PowerSync connects as a dedicated `powersync_replication` role
with `replication` and `select`, not as `postgres`. The credential is revocable
on its own and cannot drop anything. The `create role` statement is in
`docs/powersync-setup.md` rather than in a migration, because it carries a
password and this repository is public.

---

## ADR-0031 — Setting up the instance, and a correction to how PowerSync meets RLS

The `Development` instance was provisioned on 2026-09-05 and is connected to the
Supabase project. `docs/powersync-setup.md` is rewritten from what actually
happened rather than from what the documentation implied; five things were
wrong, and two of them would have failed silently.

### The correction: RLS does apply, once

[ADR-0030](#adr-0030--sync-rules-the-publication-and-the-client-schema-are-one-source-of-truth)
says replication "reads the write-ahead log, underneath the permission system.
Row level security does not apply to it." The security conclusion drawn from
that — that the `user_data` bucket parameter is the access control, not RLS — is
correct and unchanged. The mechanism was stated too broadly.

PowerSync does two different reads:

- **Streaming changes** come from logical decoding of the WAL, which is not
  filtered by RLS. This is the part ADR-0030 described.
- **The initial snapshot** of each table is an ordinary `SELECT` on an ordinary
  connection, and it obeys RLS like anything else.

So the replication role needs `BYPASSRLS`, which the first version of the guide
did not grant. Deploying without it produces fourteen `PSYNC_S1145` warnings —
one per table — and **lets you deploy anyway**. The result would not have been a
restricted view of the data. It would have been zero rows in every table,
because `powersync_replication` is not the `authenticated` role, so even the
`for select to authenticated using (true)` policies on the reference tables do
not match it. Sync would have reported healthy and delivered nothing.

`BYPASSRLS` is not a weakening. It grants the snapshot read the same reach the
streaming path already had.

### The other four

**The sign-up URL was invented.** `accounts.journeyapps.com/portal/powersync`
returns 404. The guide now says to navigate from `powersync.com`, and says why:
guessing portal subpaths produced one 404, and searching for the product name
landed on an unrelated low-code platform's trial dashboard.

**"Sync rules" is called "Sync Streams" in the dashboard.** Same
`bucket_definitions:` YAML, different sidebar label — and a reader who cannot
find "Sync rules" will conclude the instance does not support them.

**The Sync Streams editor autosaves a draft that looks deployed.** It says "Saved
locally" and keeps the pasted YAML across reloads, while Health continues to
report *No Sync Streams Configured*. This is the second silent failure of the
five: everything reads as configured and no device receives anything. The guide
now insists on **Validate, then Deploy**, and names the symptom in the
troubleshooting table.

**Connection details come from Supabase's "Direct" tab**, reached from the
Connect button — not from a Project Settings page. The URI it shows embeds the
`postgres` user, which is exactly the credential step 2 exists to avoid using,
so the guide now says to take the host and discard the rest.

### On the placeholder password

The guide's `create role` statement carried the literal placeholder
`PUT-A-LONG-RANDOM-PASSWORD-HERE`, and it was run verbatim. Because
`docs/powersync-setup.md` is committed to a public repository, that briefly made
the replication role's password a published string. It was rotated with
`alter role … with password` before the role was used for anything.

A placeholder that is *valid input* is a trap in a document meant to be
copy-pasted. The guide now puts the rotation command next to the creation
command rather than in a note underneath, and gives a one-line generator so
there is something to paste that is not the placeholder.

---

## ADR-0032 — Body metrics, goals and the coaching loop are v1 scope

**Chosen:** the app collects height, weight, age and weekly activity level,
turns those plus a stated goal into a training plan, and keeps commenting on how
the plan is going — including when the user wrote the plan themselves.

**Recorded before it is built**, on request, because it is not in
`CLAUDE_CODE_BRIEF.md` and it changes decisions in phases that come first.

### What the app has to do

1. Ask for **height, weight, age and how active the week is**.
2. Offer a **goal** on the back of those numbers: lose fat, build muscle, both
   at once, get stronger.
3. **Write the plan** from metrics plus goal.
4. Let an experienced lifter — or one with a coach in real life — **build their
   own workouts instead**, and after a handful of sessions tell them, unasked,
   how it is actually going by our own measures.
5. **Ask for a new weight at least weekly.** Every number above decays without
   it, and a plan built on a figure from March is worse than no plan.

### The three things this forces on work that lands sooner

**Body metrics are an append-only history, not columns on `profiles`.** Point 5
is the whole reason: the app asks for weight weekly *so that it has a series*.
Overwriting `profiles.weight_kg` each Sunday throws away the only signal that
says whether "lose fat" is working, and it cannot be reconstructed afterwards.
So this is a `body_metrics` table — one row per measurement, `recorded_at`,
never updated in place — and it needs to exist before the first screen asks for
a weight, not after.

Height and age are near-constant and could live on `profiles`; they will go in
the same table anyway, because a single shape is cheaper than two, and because
"age" is really date of birth, which is a fact with an as-of date like the rest.

**Phase 6's generator is not what the brief's phase name suggests.** "Rules
engine, then the Claude layer" reads as *pick exercises for these muscle
groups*. Point 3 makes it *pick exercises for this person and this goal*, which
takes different inputs, produces a multi-week plan rather than one session, and
has to survive the user ignoring it. Building the muscle-group generator first
and generalising later would mean writing it twice.

**Advice is a read over logged sessions, not a mode the user opts into.**
Point 4 says the feedback exists for self-built plans too, so it cannot be a
branch inside the generator. It is an analysis that runs on session history and
says the same kind of thing whoever wrote the plan — which puts it next to
Phase 7's trends rather than inside Phase 6.

### What is deliberately not decided here

The actual coaching logic: which formula estimates maintenance calories, what
weekly volume a goal implies, how many sessions before the app has standing to
comment, and where the line sits between a rules engine and the Claude layer.
Those need the logged data from Phase 4 to be worth arguing about.

### Not medical advice

The footer disclaimer already on the home screen becomes load-bearing here. An
app that reads a bodyweight trend and recommends an intake is closer to health
advice than one that counts sets, and §14's obligations — export, deletion,
plain statements about what is stored — apply to the metrics history in full.

---

## ADR-0033 — A hand-written service worker, because a deploy was not arriving

**Chosen:** a service worker built by a small Vite plugin, plus a Reload prompt
the user can ignore.

**Rejected:** Workbox (`vite-plugin-pwa`); doing nothing and force-quitting the
app after each deploy.

### The bug it fixes

A new build could sit on GitHub Pages for hours while the phone showed the old
one. Two causes stacked:

- Pages serves everything with `Cache-Control: max-age=600`, so the shell is ten
  minutes stale by default.
- An iOS Home Screen web app **resumes from memory**. It does not reload when
  reopened, so the ten minutes never even start counting until something forces
  a navigation.

The workaround was to force-quit the app from the switcher after every deploy.
That is fine for one developer and unacceptable for anyone else, and it means
a fix for a bug someone reported cannot be delivered to them.

The second half of the same problem is the reverse: without a worker, a cold
start with no signal is a **blank screen**. The device holds a full SQLite
database of the user's sets and there is no code to open it with. Calling that
offline-first would be a lie.

### How it works

`sw.ts` is about a hundred lines and does three things:

1. **Precaches every file in `dist`** at install, so a cold start with no
   network has the whole app — including the wa-sqlite WebAssembly, without
   which the page loads and the database does not open.
2. **Serves the document network-first, with the HTTP cache bypassed**
   (`fetch(url, { cache: 'no-store' })`). This is the line that fixes the ten
   minutes.
3. **Serves everything else under its scope cache-first**, which is always
   correct because Vite fingerprints those names.

Everything outside the scope is passed through untouched — no `respondWith`
call at all. Supabase auth, PostgREST and the PowerSync sync stream must never
meet a cache: a cached token response is a user who cannot sign out, and a
cached sync checkpoint is a sync bug that takes weeks to attribute.

### `skipWaiting` is not called, and the reload is a prompt

A worker that activates the moment it downloads swaps the JavaScript under a
running page. In a workout logger that can mean the chunk which was about to
save a set is gone. So the new build waits, a bar appears saying a new version
is ready, and the user picks the moment — during rest, not mid-set.

The check runs on `visibilitychange`, throttled to a minute, not on a timer. An
iOS Home Screen app spends most of its life suspended, so an interval fires
when nobody is looking and not when they come back; visibility fires exactly on
the return, which is the moment this whole feature exists for.

### An update carries the old cache forward

Four wa-sqlite binaries account for about eight of this app's nine megabytes.
Refetching them on every deploy would mean an eight megabyte download over
cellular to ship a corrected label, so install copies anything under `assets/`
out of the previous cache instead of fetching it. That is sound rather than
merely fast: Vite fingerprints those names with a content hash, so a matching
path is matching bytes. `index.html`, `manifest.webmanifest` and the icons keep
their names across builds and are always refetched.

**The cost accepted:** a first install still fetches all four wa-sqlite variants
even though the device will use one, because which one depends on a runtime VFS
choice. About five megabytes, once, on first install only. Trimming the list by
guessing at the VFS would trade that for a blank screen in a basement, which is
the wrong trade.

### Why not Workbox

`vite-plugin-pwa` would have done this in a dozen lines of config, and it pulls
in Workbox to generate a worker that would be the least inspectable code in the
repository — on the one code path where a mistake **persists on the user's
device after the fix has shipped**. A worker that caches the wrong thing keeps
serving it, on a phone that is not in the room. The whole of what was wanted
here is a precache manifest and two strategies. §0.3 says to ask before adding a
dependency; the answer to "is a hundred lines worth a dependency" was no.

The build step is a Vite plugin rather than a checked-in worker because the
precache list is fingerprinted filenames, which do not exist until the bundle is
written. It compiles `sw.ts` in `closeBundle` with the manifest and a build id
substituted in.

### Two things worth knowing about the build id

It is a hash of the precached files **and their contents**, not a timestamp or
the commit sha. A rebuild producing byte-identical output produces the same id,
so nobody is prompted to reload for a README change. Contents rather than names,
because most of `dist` is fingerprinted but the manifest and the icons are not.

`sw.js` is excluded from its own precache list. A cached worker is a worker that
cannot be replaced, which would make a bad deploy permanent on every device that
installed it. The browser fetches it outside this cache, with
`updateViaCache: 'none'` set at registration so no HTTP cache can answer either.

### What this does not do

No offline page for content that was never loaded, no background sync, no push.
PowerSync already owns durable data; this owns the code that reads it.

---

## ADR-0034 — `HashRouter`, mounted inside the auth gate, with filters in the URL

**Resolves the deferral in [ADR-0013](#adr-0013--react-router-and-zustand-deferred).**

### `HashRouter`, not `BrowserRouter`

**Chosen:** `HashRouter` from `react-router`.

**Why:** two independent arguments, already written down before the router
existed, which happen to agree.

ADR-0013 flagged that embedded WebViews serve from custom schemes —
`capacitor://localhost`, `tauri://localhost` — and that `BrowserRouter`'s
history handling is the classic thing that works in Chrome and then does not
work in a WKWebView. ADR-0027 flagged that `base: './'` means asset URLs resolve
against the current path, so a nested route like `/exercises/back-squat` would
send the browser looking for `/exercises/assets/index-abc.js`.

Either one on its own would be enough. A third would have been needed anyway:
GitHub Pages has no rewrite rule, so a deep link to a real path is a 404 from
the server before any JavaScript runs. The ugly `#/exercises` is the price, and
there is no SEO to pay it out of.

### The router is inside the gate, not around it

**Chosen:** `HashRouter` wraps only the signed-in tree. The sign-in screen
renders with no router at all.

**Why:** a `HashRouter` owns `location.hash`, and the signed-out half of the app
is precisely where a hash can arrive carrying something that is not a route.
Auth is PKCE (ADR-0025), so the ordinary Google round trip comes back with
`?code=` in the query string and there is no conflict today — but recovery and
confirmation links have historically arrived as `#access_token=…`, and the
catch-all route below would answer one of those by replacing the URL with `#/`
before anything had read it.

The cost is that the sign-in screen cannot use `<Link>`. It has one screen and
no navigation, so it does not want one.

There is a catch-all `*` route that redirects home with `replace`. A leftover
fragment, a bookmark from a build that named things differently, or a typo
should land on the home screen rather than a blank page, and `replace` keeps the
bad URL out of the back button.

### The library's filters live in the URL, not in component state

**Chosen:** search text, muscle group and equipment are read from and written to
the query string, with the round trip tested in `library-filters.ts`.

**Why:** three reasons that all come from this being a phone app. The back
button undoes a filter instead of leaving the screen. The state survives the
page reload the update banner asks for (ADR-0033). And a filtered list becomes
something you can send to somebody.

Two details are load-bearing:

**Defaults are omitted, and updates `replace` rather than push.** Writing
`?q=&muscle=` for the unfiltered library gives it a URL distinct from the one
you arrived at, and pushing a history entry per keystroke means the back button
spends eleven presses spelling "deadlift" backwards before it leaves the screen.

**An empty selection means "no constraint" on screen and "needs nothing at all"
in the repository, and the translation between them is explicit.**
`ExerciseFilter`'s `equipmentIds: []` is the hotel-room question. No chips lit
plainly means "I have not narrowed by equipment". Conflating the two would empty
the list the moment somebody cleared a filter, so `toExerciseFilter` omits the
field instead, and a test pins it.

Unknown slugs are dropped rather than passed through. An id that matches nothing
would filter the whole library away with no explanation, and links from a newer
build or bookmarks from before a rename produce exactly that.

### Reading the catalogue from a component

`getRepositories()` in `apps/web/src/lib/db` is the only place the app turns a
PowerSync connection into repository objects, and `useCatalogue` is the only way
a screen runs one. Brief §0.5 in practice: a component that wants a row has one
door.

`useCatalogue` returns loading, error and data — always all three. A hook that
returns only the data forces every screen to invent the other two, and they get
invented differently each time.

Its dependency is an explicit **string key** rather than a dependency array. The
callback is a new closure on every render, so depending on it would re-run the
query forever; passing what the query depends on as one readable string makes
the re-run condition something you can see rather than infer.

Queries re-run when sync completes. On a first launch the catalogue arrives a
second or two after the screen does, and a library that renders "No exercises"
and stays that way until the user navigates twice is the most obvious possible
bug in an app that advertises working offline.

### `react-router` was already installed

It arrived in the auth work (#6) and was never used. ADR-0013's statement that
neither dependency was installed stopped being true then. Nothing new is added
here; §0.3's question was answered by accident and is recorded now.
