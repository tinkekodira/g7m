-- ============================================================================
-- The language the app speaks to this lifter. ADR-0181.
-- ============================================================================
--
-- Null until somebody picks one, and null is an answer: it means "follow this
-- phone". A device reads its own language when the column is null, so a
-- lifter who never touches the setting gets German on a German phone and
-- English on an English laptop, and nobody is asked a question to get there.
--
-- Once picked — in the first onboarding question or in Settings — it is the
-- account's language on every device, which is the point of keeping it here
-- rather than only on the phone: somebody who reads no English should not
-- meet English again on a tablet they sign in to later.
--
-- The CHECK lists the languages the app has words for. Adding one is a new
-- migration, the same way adding an exercise is.
--
-- The column is on a table already in the `powersync` publication and synced
-- by the `user_data` bucket, so the only other change is the column list in
-- `powersync/sync-rules.yaml`.
-- ============================================================================

alter table public.profiles
  add column language text
    check (language in ('en', 'de', 'es', 'fr', 'pt', 'it'));
