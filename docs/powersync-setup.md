# Setting up the PowerSync instance

This is the one part of Phase 2 that cannot be done from the repository, because
it needs the database password — which must never be pasted into a chat, a
commit, or a CI variable.

Everything the instance needs from the codebase is already generated and
committed. You are connecting it up, not configuring it by hand.

**Time:** about twenty minutes.
**You will need:** the Supabase project, and its database password.

---

## What PowerSync actually does here

Worth ten seconds before clicking anything, because it explains why some of the
steps below look paranoid.

PowerSync does not call the API. It attaches to a Postgres **logical replication
slot** and follows the write-ahead log directly — which is how a set logged on
one device appears on another in about a second. Reading the WAL happens
underneath Postgres' permission system, so **row level security does not apply
to it**. Every row in every published table is visible to PowerSync.

What keeps one user's training history away from another is therefore not RLS.
It is the `user_data` bucket in `powersync/sync-rules.yaml`, which filters on
the user id inside the signed Supabase JWT that each device presents. That file
is generated from the client schema and checked by tests for exactly this
reason.

RLS still does its job everywhere else — direct PostgREST reads, and the writes
PowerSync sends back up through the API.

---

## Step 1 — Push the publication migration

A publication is the list of tables whose changes go onto the replication
stream. It is already written and version-controlled; it just needs to reach the
live database.

In the repository root:

```
pnpm db:push
```

That applies `supabase/migrations/20260905140000_powersync_publication.sql`,
which creates a publication named `powersync` covering the fourteen tables the
app syncs — and nothing else. It does not include the `auth` schema.

Confirm it landed. In the Supabase dashboard, **SQL Editor**, run:

```sql
select tablename from pg_publication_tables where pubname = 'powersync' order by 1;
```

You should get fourteen rows. If you get zero, the migration did not apply and
nothing after this point will work.

---

## Step 2 — Make a login for PowerSync

You could hand PowerSync the `postgres` connection string and be done in one
step. Don't. That credential can read every table in the database including
`auth.users`, can drop things, and cannot be revoked without changing the
password your own tooling uses.

A dedicated role costs four lines and can be revoked on its own.

In the Supabase **SQL Editor**, run this — with your own password substituted:

```sql
create role powersync_replication with replication login password 'PUT-A-LONG-RANDOM-PASSWORD-HERE';
grant usage on schema public to powersync_replication;
grant select on all tables in schema public to powersync_replication;
```

Notes on that password:

- Generate something long and random. It is typed twice — here and in the
  PowerSync dashboard — and never again.
- **Do not send it to me, and do not put it in the repository.** This SQL is
  deliberately not a migration for that reason: a committed migration is public.
- `replication` is the privilege that lets it read the WAL. `select` is what
  lets PowerSync read the initial snapshot of each table.

> If you would rather use the plain `postgres` connection string to get moving,
> it will work. It is a worse position to be in and worth coming back to.

---

## Step 3 — Create the PowerSync instance

1. Sign up at **https://accounts.journeyapps.com/portal/powersync** — the free
   tier is enough for this.
2. Create a new instance. Pick the region closest to your Supabase project,
   which is **Frankfurt / eu-central**. Region matters here: every write makes a
   round trip, and putting the instance on another continent from the database
   is a latency cost you pay forever.
3. When it asks for the database connection, give it:

   | Field | Value |
   | --- | --- |
   | Host / URI | from Supabase → **Project Settings → Database → Connection string** |
   | Port | **5432** — the direct connection, *not* the 6543 pooler |
   | Database | `postgres` |
   | Username | `powersync_replication` (from step 2) |
   | Password | the one you generated |

   **Port 5432, not 6543.** The pooler multiplexes connections and cannot carry
   a replication slot. Pointing PowerSync at it produces a connection error that
   does not mention pooling.

4. Run its connection test. It should report that it can connect and that
   logical replication is available. Supabase ships with `wal_level = logical`
   already set, so there is nothing to change.

---

## Step 4 — Tell PowerSync how to trust a Supabase login

PowerSync has to verify that the JWT a device presents really came from your
Supabase project, and pull the user id out of it. In the instance settings there
is a client-authentication section with a Supabase option.

Supabase issues JWTs in one of two ways, and which one you have decides what to
paste:

- **Asymmetric keys (newer projects, and what you should prefer).** Supabase
  publishes a JWKS endpoint at
  `https://<your-project-ref>.supabase.co/auth/v1/.well-known/jwks.json`.
  Give PowerSync that URL. Nothing secret is involved — it is a public key.
- **A shared HS256 secret (older projects).** Supabase → **Project Settings →
  API → JWT Settings → JWT Secret**. Paste that into PowerSync.
  **This one is a secret.** Same rule as the database password: dashboard only,
  never chat, never the repository.

Check Supabase → **Project Settings → API → JWT Keys** to see which you have.
If a JWKS URL is offered, use it.

---

## Step 5 — Deploy the sync rules

Open `powersync/sync-rules.yaml` from the repository, copy the whole file, and
paste it into the instance's **Sync rules** editor, then deploy.

Do not hand-edit it there. It is generated from the client schema — the same
schema the app compiles against — and a test fails the build if the committed
file and the schema disagree. If you need it changed, it changes in
`packages/db/src/schema/app-schema.ts` and you run:

```
pnpm sync-rules
```

then paste and redeploy.

If the editor rejects `SELECT request.user_id() AS user_id`, your instance is on
an older sync-rules dialect: replace that one line with
`SELECT token_parameters.user_id AS user_id`, and tell me so I can change the
generator.

---

## Step 6 — Send me the instance URL

The dashboard shows an instance URL that looks like:

```
https://<something>.powersync.journeyapps.com
```

**That URL is safe to share and safe to commit.** It is not a credential — a
device still has to present a valid Supabase JWT to get anything out of it, and
the sync rules decide what that is. It is the same category of public as the
Supabase anon key.

Paste it to me and I will wire it in: `VITE_POWERSYNC_URL` in `.env.local` for
local development, and the GitHub Actions variable that builds the Pages
deployment.

---

## Your turn — the short version

1. `pnpm db:push`
2. Run the `create role` SQL from step 2 in the Supabase SQL editor, with a
   password you generate.
3. Create a PowerSync instance in Frankfurt, connected on **port 5432** as
   `powersync_replication`.
4. Point its Supabase auth at your JWKS URL (or paste the JWT secret).
5. Paste `powersync/sync-rules.yaml` into Sync rules and deploy.
6. Send me the instance URL.

**Never send me:** the database password, the `powersync_replication` password,
or the Supabase JWT secret. If one is ever pasted into a chat or a commit,
rotate it rather than hoping.

---

## If it will not connect

| Symptom | Cause |
| --- | --- |
| Connection times out | Pooler port. Use 5432, not 6543. |
| Authentication failed | The role was created in a different project, or the password has a character the URI form mangles — prefer the separate-fields form over a single URI. |
| Connects, replicates nothing | The publication is missing. Re-run the check query in step 1. |
| Sync rules rejected | Older dialect — see the `token_parameters` note in step 5. |
| Devices sync reference data but no user data | Auth is misconfigured: PowerSync is not extracting a user id from the JWT, so the `user_data` bucket matches nothing. Check step 4. |

That last row is the one worth memorising, because it looks like a data problem
and is not.
