# supabase/seed

**Development-only fixtures.** Fake users, fake sessions, anything that must
never reach production.

The muscle, equipment and exercise data is **not** here — it lives in
`supabase/migrations/`, because the application cannot run without it and
`supabase db seed` only runs during a local `db reset`. See
[ADR-0024](../../DECISIONS.md#adr-0024--seed-data-ships-as-migrations-and-six-things-seeding-taught-us).

Nothing in this directory is applied by `supabase db push`.
