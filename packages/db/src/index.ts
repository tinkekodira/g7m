/**
 * @g7m/db — the only place in the codebase that talks to a database.
 *
 * Brief §0.5: every database write goes through a repository layer. No
 * component touches the DB directly. That rule is what makes the offline story
 * testable and the sync story swappable.
 *
 * Filled in by:
 *   Phase 1 — Drizzle schema mirroring the Supabase tables in Brief §5.
 *   Phase 2 — PowerSync client, sync rules, and the repository implementations.
 *
 * Deliberately empty until then: an abstraction written before its first two
 * call sites is a guess.
 */
export {};
