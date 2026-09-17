# g7m

A strength training app for iOS, Android, Windows and macOS. One account, one
set of data, synced across every device — and fully usable with no internet
connection, because gyms are concrete basements.

What it does:

- **Train.** Log a workout set by set — fast, one-handed, offline. Numbers are
  prefilled from last time, a rest timer runs between sets, a barbell set says
  which plates to load, and a new personal record is celebrated the moment it
  happens. Cardio machines are logged as bouts, with a timer and a calorie
  estimate ([ADR-0069](./DECISIONS.md#adr-0069--cardio-is-gym-machines-logged-as-bouts-inside-workouts)).
  A workout you forgot to log can be added to its day on the calendar.
- **Learn.** An interactive 3D body. Tap a muscle to see every exercise that
  trains it. The exercise library has search, filters by muscle, equipment and
  gym-or-home, coaching cues for every lift, and your estimated one-rep max.
- **Coach.** Answer a few questions — height, weight, age, how active your week
  is, what you are training for — and Home has today's workout written for you.
  Prefer to program your own? Do that; it will still tell you how it is going
  after a few sessions. See
  [ADR-0032](./DECISIONS.md#adr-0032--body-metrics-goals-and-the-coaching-loop-are-v1-scope).
- **Progress.** This week, this month or all time: a chart of weight lifted,
  sets, workouts, active time, cardio minutes or calories, whichever you pick; a
  calendar of the days trained; and your best lifts and trained muscles on Your
  profile.
- **Achievements.** 52 badges, from your first workout to a three-plate squat,
  a week of five workouts or a rowed 2K — and one secret. Past training counts,
  and a new one is celebrated with a banner the moment it is earned
  ([ADR-0072](./DECISIONS.md#adr-0072--achievements-are-worked-out-from-the-log-and-celebrated-once)).
- **Your data.** Light or dark, kilograms or pounds. Download everything as a
  file, or delete the account from Settings.

Non-obvious technical calls are recorded in [`DECISIONS.md`](./DECISIONS.md),
one ADR each, with what was chosen, what was rejected and why. The original
specification, `CLAUDE_CODE_BRIEF.md`, is kept outside this repository; the
decision log is where it has been interpreted.

> **Status.** Everything above works, on a phone, offline. It ships as the
> Home Screen web app on iPhone, and as a real Android app: every push builds
> an installable debug APK ([ADR-0074](./DECISIONS.md#adr-0074--the-native-shell-what-the-phone-does-that-a-browser-cannot)).
> Phases 0–7 of the plan are complete and Phase 9 is under way. Desktop polish
> (Phase 8) is parked: the phone app is being finished first. See
> [Build phases](#build-phases).

---

## Stack

| Layer | Choice |
| --- | --- |
| Language | TypeScript 5.9, `strict` plus [extra flags](./DECISIONS.md#adr-0003--typescript-strictness-beyond-strict-true) |
| UI | React 19 + Vite 7 |
| Styling | Tailwind CSS v4, a CSS-first token layer in `packages/ui`, [light and dark themes](./DECISIONS.md#adr-0062--the-light-theme-is-the-same-tokens-redefined) |
| 3D | three.js via `@react-three/fiber` + `@react-three/drei`, loaded only when a body is on screen |
| Client state | Zustand — UI state only |
| Routing | React Router, [`HashRouter`](./DECISIONS.md#adr-0034--hashrouter-mounted-inside-the-auth-gate-with-filters-in-the-url) |
| Mobile shell | Capacitor 7 — Android; iPhone ships as a [Home Screen web app](./DECISIONS.md#adr-0026--ios-ships-as-a-home-screen-web-app-and-the-spike-resolves-to-keep-powersync) |
| Desktop shell | Tauri 2 — Windows, macOS |
| Backend | Supabase (Postgres, Auth, Storage), Frankfurt |
| Local database | SQLite in the browser (wa-sqlite on OPFS), with a [hand-written schema](./DECISIONS.md#adr-0028--the-local-schema-is-hand-written-powersync-not-drizzle-and-a-test-stops-it-drifting) |
| Sync | PowerSync — [verified on three engines](./docs/spikes/powersync-ios.md) |
| Validation | Zod at every boundary |
| Testing | Vitest (unit, repository and schema tests) + Playwright ([end to end, against a fake backend](./e2e/README.md)) |

One React codebase renders in a WKWebView on iOS and macOS, an Android WebView,
and WebView2 on Windows. WebGL and pointer events work in all four, which is
what makes the 3D body viable everywhere without a rewrite.

The app costs nothing to run: no paid APIs, and no calls to a language model.
A Claude-written plan is designed in (Phase 6) and switched off
(`VITE_FEATURE_CLAUDE_GENERATOR=false`); the plan you get is the rules engine's.

---

## Prerequisites

**Everyone needs:**

- **Node** — the version in [`.nvmrc`](./.nvmrc). `nvm use` will pick it up.
- **pnpm 10** — via Corepack, which ships with Node:

  ```bash
  corepack enable
  ```

  > On Windows this writes shims into `C:\Program Files\nodejs` and needs an
  > **administrator** terminal. Without it, `pnpm` is not on your PATH and
  > scripts that call `pnpm` internally will fail. `npm install -g pnpm@10` also
  > works if you would rather not use Corepack.
  >
  > **Or neither.** [`pnpm.cmd`](./pnpm.cmd) in the repository root forwards to
  > Corepack, and `cmd.exe` looks in the current directory before it looks at
  > PATH — so `pnpm dev` typed here works with no install and no administrator.
  > It puts the root on PATH for whatever it launches, which is what stops the
  > *inner* `pnpm` in scripts like `dev` and `typecheck` failing after the outer
  > one succeeded. In PowerShell, which does not search the current directory,
  > it is `.\pnpm.cmd dev`.

- **Git LFS** — `git lfs install`. [`.gitattributes`](./.gitattributes) routes
  models and video (`.glb`, `.mp4`, …) through LFS. Nothing is stored in it
  today — the licensed 3D model is never committed (see [Licence](#licence)) —
  but it is set up so that the first binary does not land in Git history.

**Per target, only if you are building for it:**

| Target | Also needs |
| --- | --- |
| Web and iPhone | nothing further |
| Android | Android Studio, JDK 21, Android SDK 34+ |
| iOS native | macOS + Xcode. Not needed: iPhone ships as a Home Screen web app (ADR-0026) |
| Windows | [Rust](https://rustup.rs), Microsoft C++ Build Tools (WebView2 ships with Windows 11) |
| macOS | Rust, Xcode Command Line Tools |

---

## Install

```bash
git clone https://github.com/tinkekodira/g7m.git
cd g7m
pnpm install          # also wires up the git hooks via the `prepare` script
cp .env.example .env.local
```

Then fill in `.env.local`, at the repository root. Every variable is documented
inline in [`.env.example`](./.env.example). The app needs a Supabase project to
start — it checks its environment on load and says what is missing — and a
PowerSync instance to sync; without one it runs on the device alone.
[`docs/powersync-setup.md`](./docs/powersync-setup.md) walks through both.

All of these values are public by design: they are compiled into the bundle.
Row Level Security is what protects the data (see [Secrets](#secrets)).

---

## Run

```bash
pnpm dev                                # web, http://localhost:5173
pnpm --filter @g7m/mobile run:android   # Android device or emulator
pnpm --filter @g7m/mobile run:ios       # iOS device or simulator (macOS only)
pnpm --filter @g7m/desktop dev          # Windows or macOS native window
```

The mobile and desktop commands build `apps/web` first and copy the output in —
do not build the web app separately beforehand.

To open the native projects in their own IDEs:

```bash
pnpm --filter @g7m/mobile open:android  # Android Studio
pnpm --filter @g7m/mobile open:ios      # Xcode
```

## Build

```bash
pnpm build                              # web -> apps/web/dist
pnpm --filter @g7m/desktop build        # native installer for the current OS
pnpm --filter @g7m/mobile sync          # refresh both native projects, then build in the IDE
```

## Check your work

```bash
pnpm check          # lint + format check + typecheck + unit tests + build — what CI runs
pnpm e2e            # the browser tests: builds the app, runs it against the fake backend
pnpm test           # pnpm test:watch while working
pnpm test:coverage  # enforces the 90% gate on packages/core
pnpm lint
pnpm typecheck
pnpm format
```

`pnpm e2e` needs no Docker, no network and no Supabase project: the backend is
a fake built from this repository's own migrations and sync rules, and the tests
use the Chrome already installed. [`e2e/README.md`](./e2e/README.md) says what it
covers and how to write a test.

---

## Deploying

Four things live outside the repository, and a change can need any of them.
**Order matters** when a change adds columns: the database first, then the sync
rules, then the app — a phone that uploads a column the server does not have yet
has that upload refused and discarded.

1. **Database — Supabase migrations.** Every schema change is a file in
   `supabase/migrations/`, applied with:

   ```bash
   npx supabase db push
   ```

   The Supabase CLI is a dev dependency, so it is `npx supabase`, not bare
   `supabase`. The project has to be linked once (`npx supabase link`).

2. **Sync rules — PowerSync.** [`powersync/sync-rules.yaml`](./powersync/sync-rules.yaml)
   is generated from the local schema; `pnpm sync-rules` regenerates it, and a
   test fails the build when it is stale. Paste the whole file into the
   PowerSync dashboard (Sync Streams → Validate → Deploy). See
   [`docs/powersync-setup.md`](./docs/powersync-setup.md).

3. **The app — GitHub Pages.** Every merge to `main` builds and deploys the web
   app to <https://tinkekodira.github.io/g7m/>. On an iPhone, open it in Safari
   and choose **Share → Add to Home Screen**; that is the iPhone app. An open
   app offers to reload when a new version arrives.

4. **The 3D model.** The licensed model is fetched at build time from a signed
   Supabase Storage link, held in the `ANATOMY_MODEL_URL` repository secret.
   Without the secret the build uses the generated body instead. The link
   expires; when it does, create a new one and replace the secret.

**Native builds** — Tauri for Windows and macOS, and an unsigned Android debug
APK — run on tag pushes (`v*`) or by hand from the Actions tab. They are slow
and burn runner minutes, so they never run on a pull request.

---

## Repository layout

```
apps/
  web/            The application. Runs standalone in a browser.
    service-worker/ Hand-written, so a deploy reliably arrives (ADR-0033).
  mobile/         Capacitor shell — Android (and iOS, unused). Thin.
  desktop/        Tauri shell — Windows + macOS. Thin.
packages/
  core/           Domain logic. Zero UI, zero platform imports, pure functions:
                  the generator, records, progress, calories, units.
  db/             The local SQLite schema, the repositories, sync and upload
                  handling, and the PGlite harness that runs the real migrations.
  ui/             Design tokens (light and dark) and shared primitives.
  anatomy/        The 3D viewer, self-contained, and the tools that build the model.
e2e/              Playwright tests and the fake backend they run against.
supabase/
  migrations/     Every schema change, and the exercise, muscle and equipment data.
  seed/           Development-only fixtures. Never applied to production.
powersync/        The sync rules, generated from the local schema.
docs/             Setup guides, and findings from spikes.
scripts/          Build-time helpers (app icons).
```

Two rules that are enforced rather than merely stated:

- **`packages/core` may not import React, Capacitor, Tauri, three.js, or
  anything that touches a database.** An ESLint rule fails CI if it does. Domain
  logic stays portable and testable in bare Node.
- **Every database write goes through the repository layer in `packages/db`.**
  No component talks to the database directly.

---

## How we work

`main` is protected, always green, always runnable. **Never commit to it
directly.**

```bash
git switch main && git pull
git switch -c feat/cardio-progress
# ... work, committing as you go ...
git push -u origin feat/cardio-progress
# open a PR, let CI pass, squash merge, delete the branch
```

Branch from a freshly pulled `main`, never from the last feature branch — a
branch cut from another carries its commits into the next pull request.

Branch prefixes: `feat/`, `fix/`, `chore/`, `refactor/`, `test/`, `docs/`,
`ci/`, `spike/`. Spikes are explicitly disposable — the finding goes in
`DECISIONS.md`, the code does not go in `main`. Commits follow conventional
commits, scoped to the package where it helps: `feat(anatomy): add muscle
raycasting`.

Squash merge, one commit per feature. That is what makes a bad feature
`git revert <sha>` instead of an archaeology project.

### Secrets

The Supabase publishable key is public by design and safe to ship — Row Level
Security is what protects the data. Because this repository is public, an
attacker has the schema and the policies too, so RLS is not a formality: every
user-owned table gets a policy in the same migration that creates it, and the
schema tests check each one against a real Postgres.

The **service role key, the database password and any API key are not public**,
and must never reach the client bundle or Git. Nothing in the app needs them.
A pre-commit hook scans for them (and refuses the licensed model even under
`git add -f`), and CI runs gitleaks over the full history on every pull request;
see [ADR-0004](./DECISIONS.md#adr-0004--git-hooks-without-husky-or-lint-staged).

### Continuous integration

Every pull request runs three checks:

| Check | What it does |
| --- | --- |
| **Lint, typecheck, test, build** | ESLint, the Prettier check, TypeScript, every unit, repository and schema test with the coverage gate on `packages/core`, and a production build |
| **Secret scan** | gitleaks over the full history |
| **Browser tests (Playwright)** | The production build in Chromium, against the fake backend |

Merging to `main` deploys to Pages. Native builds run on tags only.

### One-time GitHub setup

In **Settings → Branches**, protect `main`:

- [ ] Require a pull request before merging
- [ ] Require status checks to pass — *Lint, typecheck, test, build*, *Secret
      scan* and *Browser tests (Playwright)*
- [ ] Require branches to be up to date before merging
- [ ] Block force pushes and deletions
- [ ] Allow squash merging only (**Settings → General → Pull Requests**)
- [ ] Automatically delete head branches

---

## Build phases

| # | Phase | State |
| --- | --- | --- |
| 0 | Foundation and de-risking | **Complete** |
| 1 | Data — schema, RLS, seed, auth | **Complete** |
| 2 | Offline — PowerSync, local SQLite, repositories | **Complete** — [spike resolved](./docs/spikes/powersync-ios.md), PowerSync stays |
| 3 | Exercise library — search, filters, detail | **Complete** — videos are placeholders until each is checked ([ADR-0024](./DECISIONS.md#adr-0024--seed-data-ships-as-migrations-and-six-things-seeding-taught-us)) |
| 4 | Logging — the hot path | **Complete** — plus plates, past workouts and cardio |
| 5 | 3D anatomy — viewer, raycasting, exercise panel | **Complete** |
| 6 | Generator — body metrics, goals, rules engine | **Complete** — the Claude layer is designed but off: v1 costs nothing to run |
| 7 | Progress — history, trends, heat map, how your plan is going | **Complete** — plus the calendar, cardio, chart views and achievements |
| 8 | Desktop polish | **Parked** — the phone app comes first ([ADR-0073](./DECISIONS.md#adr-0073--the-chart-steps-through-weeks-and-months-and-the-phone-comes-first)); the Tauri builds still run |
| 9 | Hardening — errors, GDPR, accessibility, performance | **In progress** — crash screen, data export, account deletion and browser tests done; accessibility and performance passes to come |

---

## Licence

**Source-available, not open source.** This repository is public so the work can
be read and discussed. All rights are reserved — no permission is granted to
use, copy, modify or distribute it. See [`LICENSE`](./LICENSE), and
[ADR-0019](./DECISIONS.md#adr-0019--the-repository-is-public-with-a-source-available-licence)
for the reasoning.

If you want to use any of it, ask. The answer may well be yes.

The 3D anatomy model is licensed separately and commercially. It is **not** in
this repository and is fetched at build time; its licence does not extend to
you.
