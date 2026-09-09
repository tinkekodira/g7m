# g7m

A strength training app for iOS, Android, Windows and macOS. One account, one
set of data, synced across every device — and fully usable with no internet
connection, because gyms are concrete basements.

Three things it does:

- **Learn.** An interactive 3D anatomy model. Spin it, tap a muscle, and see
  every exercise that trains it, split into compound and isolation work.
- **Train.** Log a session set by set — fast, one-handed, offline — or pick a
  few muscle groups and have a complete workout generated for you.
- **Coach.** Give it your height, weight, age and how active your week is, pick
  a goal — lose fat, build muscle, both, get stronger — and it writes the plan.
  Prefer to program your own? Do that; it will still tell you how the plan is
  actually going after a few sessions. See
  [ADR-0032](./DECISIONS.md#adr-0032--body-metrics-goals-and-the-coaching-loop-are-v1-scope).

The full specification is [`CLAUDE_CODE_BRIEF.md`](./CLAUDE_CODE_BRIEF.md).
This README is the on-ramp; the brief is the spec. Non-obvious technical calls
are recorded in [`DECISIONS.md`](./DECISIONS.md).

> **Status: Phase 3.** Auth, the Postgres schema and its seed data, PowerSync,
> the on-device SQLite copy and the repository layer are all in place and
> running on a real phone with the network off. There is no exercise library
> screen, no logger and no 3D model yet. See [Build phases](#build-phases).

---

## Stack

| Layer | Choice |
| --- | --- |
| Language | TypeScript 5.9, `strict` plus [extra flags](./DECISIONS.md#adr-0003--typescript-strictness-beyond-strict-true) |
| UI | React 19 + Vite 7 |
| Styling | Tailwind CSS v4, CSS-first token layer in `packages/ui` |
| 3D | three.js via `@react-three/fiber` + `@react-three/drei` *(Phase 5)* |
| Client state | Zustand — UI state only |
| Routing | React Router, [`HashRouter`](./DECISIONS.md#adr-0034--hashrouter-mounted-inside-the-auth-gate-with-filters-in-the-url) |
| Mobile shell | Capacitor 7 — iOS, Android |
| Desktop shell | Tauri 2 — Windows, macOS |
| Backend | Supabase (Postgres, Auth, Storage, Edge Functions), Frankfurt |
| Local DB | SQLite *(Phase 2)* |
| Sync | PowerSync — OPFS-backed SQLite, [verified on 3 engines](./docs/spikes/powersync-ios.md) *(Phase 2)* |
| Local query typing | Drizzle ORM, SQLite mode *(Phase 2)* |
| Validation | Zod at every boundary |
| Testing | Vitest (unit) + Playwright (E2E on the web build) |

One React codebase renders in a WKWebView on iOS and macOS, an Android WebView,
and WebView2 on Windows. WebGL and pointer events work in all four, which is
what makes the 3D anatomy model viable everywhere without a rewrite.

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

- **Git LFS** — `git lfs install`. Binary assets (`.glb`, `.mp4`, …) are stored
  through LFS; cloning without it gives you pointer files instead of models.

**Per target, only if you are building for it:**

| Target | Also needs |
| --- | --- |
| Web | nothing further |
| Android | Android Studio, JDK 21, Android SDK 34+ |
| iOS | Delivered as a Home Screen web app — no Mac needed. A native Capacitor build still requires macOS + Xcode (ADR-0026) |
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

Then fill in `.env.local`. Every variable is documented inline in
[`.env.example`](./.env.example). Nothing there is required to run the Phase 0
smoke screen.

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
pnpm check          # lint + typecheck + test + build — what CI runs
pnpm lint
pnpm typecheck
pnpm test           # pnpm test:watch while working
pnpm test:coverage  # enforces the 90% gate on packages/core
pnpm format
```

---

## Repository layout

```
apps/
  web/          The application. Runs standalone in a browser.
  mobile/       Capacitor shell — iOS + Android. Thin.
  desktop/      Tauri shell — Windows + macOS. Thin.
packages/
  core/         Domain logic. Zero UI, zero platform imports, pure functions.
  db/           Drizzle schema, migrations, repository layer, PowerSync setup.
  ui/           Design tokens and shared primitives.
  anatomy/      The 3D viewer, self-contained.
supabase/
  migrations/   SQL migrations.
  functions/    Edge Functions — the Claude proxy lives here.
  seed/         Exercise, muscle and equipment seed data.
docs/
  spikes/       Findings from throwaway spikes.
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
git switch -c feat/p4-workout-logging
# ... work, committing as you go ...
git rebase main
git push -u origin feat/p4-workout-logging
# open a PR, let CI pass, squash merge, delete the branch
```

Branch prefixes: `feat/`, `fix/`, `chore/`, `refactor/`, `spike/`. Spikes are
explicitly disposable — the finding goes in `DECISIONS.md`, the code does not go
in `main`. Commits within a branch follow conventional commits, scoped to the
package: `feat(anatomy): add muscle raycasting`.

Squash merge, one commit per feature. That is what makes a bad feature
`git revert <sha>` instead of an archaeology project. Tag each completed phase
(`v0.1.0-phase-1`) as a known-good point to return to.

**Secrets.** The Supabase anon key is public by design and safe to ship — Row
Level Security is what protects the data. Because this repository is public, an
attacker has the schema and the policies too, so RLS is not a formality: every
user-owned table gets a policy in the same migration that creates it. The **service role key and the
Anthropic API key are not**, and must never reach the client bundle or Git. They
live in Supabase Edge Function secrets. A pre-commit hook and a CI job both scan
for them; see [ADR-0004](./DECISIONS.md#adr-0004--git-hooks-without-husky-or-lint-staged).

### Continuous integration

Every pull request runs lint, format check, typecheck, unit tests with the
coverage gate, a web build, and a full-history secret scan. Native builds run on
tag pushes only — they are slow and burn runner minutes.

### One-time GitHub setup

Not scriptable from here. In **Settings → Branches**, add a protection rule for
`main`:

- [ ] Require a pull request before merging
- [ ] Require status checks to pass — select `verify` and `secrets`
- [ ] Block force pushes
- [ ] Block deletions
- [ ] Allow squash merging only (**Settings → General → Pull Requests**)
- [ ] Automatically delete head branches

---

## Build phases

Work proceeds one phase at a time, stopping at each boundary.

| # | Phase | State |
| --- | --- | --- |
| 0 | Foundation and de-risking | **Complete** |
| 1 | Data — schema, RLS, seed, auth | **Complete** |
| 2 | Offline — PowerSync, local SQLite, repositories | **Complete** — [spike resolved](./docs/spikes/powersync-ios.md), PowerSync stays |
| 3 | Exercise library — search, filters, detail, video | **In progress** |
| 4 | Logging — the hot path | Not started |
| 5 | 3D anatomy — viewer, raycasting, exercise panel | Not started |
| 6 | Generator — body metrics, goals, rules engine, then the Claude layer | Not started |
| 7 | Progress — history, 1RM trends, volume heat map, how your own plan is going | Not started |
| 8 | Desktop polish | Not started |
| 9 | Hardening — errors, GDPR, accessibility, performance | Not started |

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
