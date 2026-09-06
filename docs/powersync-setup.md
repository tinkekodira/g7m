# Setting up the PowerSync instance

**Status: done once, on 2026-09-05.** The `Development` instance for the `g7m`
project is live and connected. This document is now two things: the record of
how it was done, and the procedure for doing it again — a production instance,
or a rebuild after something is torn down.

It stays a manual procedure because it needs the database password, which must
never be pasted into a chat, a commit, or a CI variable.

**Time:** about twenty minutes.
**You will need:** the Supabase project, and its database password.

Everything the instance needs from the codebase is already generated and
committed. You are connecting it up, not configuring it by hand.

---

## What PowerSync actually does here

Worth ten seconds before clicking anything, because it explains why some of the
steps below look paranoid.

PowerSync does not call the API. It attaches to a Postgres **logical replication
slot** and follows the write-ahead log directly — which is how a set logged on
one device appears on another in about a second.

Two consequences, and they pull in opposite directions:

- **Streaming changes are not filtered by row level security.** Logical decoding
  reads the WAL underneath the permission system. Every change to every
  published table is visible to PowerSync.
- **The initial snapshot of each table _is_.** Before it can stream changes,
  PowerSync reads each table once with an ordinary `SELECT`, over an ordinary
  connection, as an ordinary role — and that read obeys RLS like any other.

So the role needs `BYPASSRLS` (step 2), or the first read returns nothing and
sync appears to work while delivering empty tables.

And what keeps one user's training history away from another is therefore **not
RLS**. It is the `user_data` bucket in `powersync/sync-rules.yaml`, which filters
on the user id inside the signed Supabase JWT that each device presents. That
file is generated from the client schema and checked by tests for exactly this
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

> `pnpm` is not on PATH on the development machine. Use Corepack, which ships
> with Node:
>
> ```
> "C:\Program Files\nodejs\corepack.cmd" pnpm db:push
> ```

That applies `supabase/migrations/20260905140000_powersync_publication.sql`,
which creates a publication named `powersync` covering the fourteen tables the
app syncs — and nothing else. It does not include the `auth` schema.

Confirm it landed. In the Supabase dashboard, **SQL Editor → New query**, run:

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
alter role powersync_replication bypassrls;
```

**Substitute the password before running it.** The placeholder above is
committed to a public repository, so running this verbatim creates a role whose
password is published on GitHub. If that happens, fix it immediately:

```sql
alter role powersync_replication with password 'A-NEW-LONG-RANDOM-ONE';
```

Generate the password rather than inventing one — in PowerShell:

```powershell
[System.Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Notes on the four statements:

- `replication` is the privilege that lets it read the WAL.
- `select` is what lets it read the initial snapshot of each table.
- **`bypassrls` is what lets that snapshot actually return rows.** Without it,
  PowerSync's first read of every table is filtered by RLS — and since this role
  is not `authenticated`, even the `for select to authenticated using (true)`
  policies on the reference tables do not match it. The result is not a
  restricted view, it is *zero rows everywhere*. The dashboard reports this as
  fourteen `PSYNC_S1145` warnings and lets you deploy anyway.
- The password is typed twice — here and in the PowerSync dashboard — and never
  again. **Do not send it to anyone, and do not put it in the repository.** This
  SQL is deliberately not a migration for that reason.

> If you would rather use the plain `postgres` connection string to get moving,
> it will work. It is a worse position to be in and worth coming back to.

---

## Step 3 — Create the PowerSync project

Go to **https://www.powersync.com/** and sign up, then follow it through to the
dashboard.

> Navigate from the front page rather than guessing a portal URL. Several
> plausible-looking `accounts.journeyapps.com/...` paths are dead, and searching
> for "PowerSync" can land you on an unrelated low-code platform's trial signup.

1. **Create a New Project.** Name it `g7m`. It opens on an environment called
   `Development` — the instance you are configuring. A separate production
   instance is a later decision, not something to set up now.
2. **Database Connections → Connect to Source Database.**

Get the connection details from Supabase: **Connect** (top of the dashboard) →
the **Direct** tab. That gives a URI of the form
`postgresql://postgres:[YOUR-PASSWORD]@db.<project-ref>.supabase.co:5432/postgres`.
Take the host out of it and ignore the rest — in particular ignore the `postgres`
username, which is not what you are using.

| Field | Value |
| --- | --- |
| Host | `db.<project-ref>.supabase.co` |
| Port | **5432** |
| Database | `postgres` |
| Username | `powersync_replication` — **not** `postgres` |
| Password | the one you generated in step 2 |

**Port 5432, not 6543.** The pooler multiplexes connections and cannot carry a
replication slot. Pointing PowerSync at it produces a connection error that does
not mention pooling.

Leave SSL required. Supabase ships with `wal_level = logical` already set, so
there is nothing to change there.

Submitting the form provisions a deployment, which takes a minute or two.

---

## Step 4 — Tell PowerSync how to trust a Supabase login

**Client Auth** in the sidebar. PowerSync has to verify that the JWT a device
presents really came from your Supabase project, and pull the user id out of it.

1. Tick **Use Supabase Auth**. It does not supply a key, and — despite what the
   name suggests — it does **not** make the Supabase audience acceptable on its
   own. Step 3 below is still required. This was established the hard way.
2. Supply the key, in **one** of two ways:

   - **JWKS URI** — the modern method, and the one to prefer. Paste:
     ```
     https://<your-project-ref>.supabase.co/auth/v1/.well-known/jwks.json
     ```
     Nothing secret is involved; it publishes a public key.
   - **Supabase JWT Secret**, marked *Legacy* — only if the project has no
     asymmetric keys. Supabase → **Project Settings → API → JWT Settings → JWT
     Secret**. **This one is a secret**: dashboard only, never chat, never the
     repository.

   Check Supabase → **Project Settings → API → JWT Keys** to see which you have.

3. **Add `authenticated` to JWT Audience.** Click **+ Add** and type it exactly.

   This one is not optional, and skipping it produces the least helpful failure
   in the whole setup: sync connects to nothing, every count stays at zero, and
   the only symptom is the word "Offline". The reason is a claim mismatch —
   Supabase issues tokens with `aud: "authenticated"`, and PowerSync accepts
   only its own instance URL until told otherwise:

   ```
   [PSYNC_S2105] Unexpected "aud" claim value: "authenticated"
   configurationDetails: Current configuration allows these audience values:
     ["https://<instance>.powersync.journeyapps.com"]
   ```

   The signature verifies fine. It is purely the audience check, and it costs an
   hour to find if you do not know to look for it.

4. Leave **HS256 authentication tokens** alone — that is for a different auth
   setup — and leave **Development tokens** unticked for now. Step 6 turns them
   on briefly, and turns them off again.

5. **Save and Deploy.**

---

## Step 5 — Deploy the sync rules

**Sync Streams** in the sidebar, which opens the **Sync Streams Editor**.

> The dashboard calls these Sync Streams; the file and the documentation call
> them sync rules. Same thing — the editor takes the `bucket_definitions:` YAML
> unchanged.

Open `powersync/sync-rules.yaml` from the repository, copy the whole file, and
paste it into the editor. Then:

1. **Validate.** Checks the YAML without deploying.
2. **Deploy.**

Both, in that order. The editor autosaves a **draft** locally and says "Saved
locally" underneath — which looks like success and is not. Until you press
Deploy, Health still reports *No Sync Streams Configured* and no device receives
anything.

Do not hand-edit the rules in the dashboard. They are generated from the client
schema — the same schema the app compiles against — and a test fails the build
if the committed file and the schema disagree. If they need to change, change
`packages/db/src/schema/app-schema.ts` and run:

```
pnpm sync-rules
```

then paste and redeploy.

If the editor rejects `SELECT request.user_id() AS user_id`, the instance is on
an older sync-rules dialect: replace that one line with
`SELECT token_parameters.user_id AS user_id`, and say so, because the generator
needs changing too.

---

## Step 6 — Check Health, then hand over the instance URL

**Health** should read **"All clear! No issues to address"**, with the source
database listed and the deploy history showing completed entries.

The instance URL is on the **Connect** screen and looks like:

```
https://<instance-id>.powersync.journeyapps.com
```

**That URL is safe to share and safe to commit.** It is not a credential — a
device still has to present a valid Supabase JWT to get anything out of it, and
the sync rules decide what that is. It is the same category of public as the
Supabase publishable key.

It goes in two places, both already wired to read it:

- `VITE_POWERSYNC_URL` in `.env.local`, for local development.
- The `VITE_POWERSYNC_URL` repository variable, which `.github/workflows/pages.yml`
  passes to the Pages build.

You can confirm an instance is up without any credentials:

```
curl -s -o /dev/null -w "%{http_code}\n" https://<instance-id>.powersync.journeyapps.com/probes/liveness
```

`200` means the service is running. The root path returns `404`; that is normal
and says nothing.

---

## The short version

1. `pnpm db:push`
2. Run the four-statement `create role` block from step 2 in the Supabase SQL
   editor, **with a password you generate**.
3. Create a PowerSync project at powersync.com, connected on **port 5432** as
   `powersync_replication`.
4. Client Auth → tick **Use Supabase Auth**, paste the JWKS URI, **add
   `authenticated` to JWT Audience**, Save and Deploy.
5. Sync Streams → paste `powersync/sync-rules.yaml` → **Validate** → **Deploy**.
6. Health should be all clear. Hand over the instance URL.

**Never share:** the database password, the `powersync_replication` password, or
the Supabase JWT secret. If one is ever pasted into a chat or a commit, rotate
it rather than hoping.

---

## If it will not connect

| Symptom | Cause |
| --- | --- |
| Connection times out | Pooler port. Use 5432, not 6543. |
| Authentication failed | The role was created in a different project, or the password has a character the URI form mangles — prefer the separate-fields form over a single URI. |
| `PSYNC_S1145`, one per table: "Row Level Security is enabled on table …" | The role has no `BYPASSRLS`. Run the `alter role` from step 2. The deploy is allowed to proceed regardless, and would sync nothing. |
| Health says *No Sync Streams Configured* after pasting the rules | The draft was saved but never deployed. Press **Deploy** in the Sync Streams Editor. |
| Connects, replicates nothing | The publication is missing. Re-run the check query in step 1. |
| Sync rules rejected | Older dialect — see the `token_parameters` note in step 5. |
| Devices sync reference data but no user data | Auth is misconfigured: PowerSync is not extracting a user id from the JWT, so the `user_data` bucket matches nothing. Check step 4. |
| The app says **Offline** and every count stays at zero, while Health is all clear | `authenticated` is missing from **JWT Audience**. The Logs page shows `PSYNC_S2105 Unexpected "aud" claim value` and a 401 on every `/sync/stream`. Step 4.3. |
| Sync Diagnostics passes but the real app will not connect | Diagnostics uses a **development token**, signed by PowerSync itself. It exercises replication, the publication and the sync rules — and none of the Supabase JWT path. A passing diagnostic says nothing about whether real logins are trusted. |

The last two rows are the ones worth remembering, because both look like data
problems and neither is.
