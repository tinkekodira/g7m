# End-to-end tests

The production web build in a real browser, driven by what the screen says, against a fake backend that runs this repository's real migrations and real sync rules. ADR-0067 has the reasoning.

```sh
pnpm e2e                                  # build, start everything, run every test
pnpm --filter @g7m/e2e exec playwright test tests/workout.spec.ts   # one file
pnpm --filter @g7m/e2e exec playwright show-report                  # after a CI failure
```

Locally the tests use the Chrome you already have installed. CI installs Playwright's Chromium.

## What runs

| Piece           | What it is                                                                                                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The app         | `vite build` of `apps/web` into `apps/web/dist-e2e`, served by `vite preview` on port 4380. The only difference from the Pages build is where its environment variables point. |
| The backend     | `fake-backend/`, started by `global-setup.ts` on port 54380. It stands in for three services, described below.                                                                               |
| The database    | PGlite with every file in `supabase/migrations` applied, the same harness as the schema tests (ADR-0022). Row level security, triggers and constraints are all real. |
| The browser     | Chromium, emulating a Pixel 7: touch, a phone-sized screen, the tab bar under a thumb.                                                                                                      |

The fake backend stands in for:

- **Supabase Auth**: sign-up, password sign-in, refresh and sign-out.
- **PostgREST**: runs every request as the token's user, so row level security decides.
- **A PowerSync service**: serves the buckets in `powersync/sync-rules.yaml`, in the same wire format as the real one.

## What is tested

- **Signing up.** All eight welcome questions, landing on Home, the answers checked in Postgres, and a reload that neither signs you out nor asks again.
- **Logging a workout.** Sets ticked in the logger arrive on the server, completed and owned by the right user.
- **A workout logged for a past day.** It is saved with `source = 'past'` at noon on that day.
- **Two accounts on one phone.** Each sees only their own training. Signing back in restores the first account's workout from the server.
- **No connection.** A whole workout is logged while every request fails. Nothing reaches the server until the connection returns, then all of it does.
- **Settings.** Light mode survives a reload, and pounds are saved to the server.
- **Every tab** opens without the crash screen.

## What the fake does and does not do

It is faithful where the app's behaviour depends on it:

- **Buckets.** They come from the deployed `sync-rules.yaml` itself.
- **Value formats.** Values are rendered the way the service renders them for this edition of the rules. That includes timestamps with a space between date and time (`2026-09-13 10:00:00.123Z`), which is what phones actually hold.
- **Checksums.** They add up, so the client's own validation runs.
- **Write checkpoints.** They follow the `requests` mode the SDK uses by default, so an upload is not reflected on the device until the service confirms it.
- **Error codes.** Refused writes carry the SQLSTATE and HTTP status PostgREST would send, which the upload path uses to decide between retrying and discarding.

It does not attempt:

- compaction;
- bucket priorities;
- sync streams;
- Google sign-in or password reset emails;
- anything about scale.

A query the fake does not understand is an error, not a guess. PostgREST filters other than `eq` and sync rules of another shape both fail loudly.

`/__e2e/…` routes exist for the tests: creating a user, running SQL to check what arrived, and cutting the connection. The app never calls them.

## Writing a test

- **Give each test its own account.** Use `createUser` in `tests/support/backend.ts`. Tests share one backend for the run, and separate accounts keep them apart.
- **Check the server, not just the screen.** A row on screen proves only the local database has it. `sql()` and `eventually()` show whether it reached Postgres.
- **Find things the way a person does.** Use roles and visible text (`getByRole`, `getByLabel`), not CSS classes. If a control cannot be found that way, a screen reader cannot find it either.
