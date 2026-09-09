-- ============================================================================
-- "Rectus femoris" was the only muscle in the picker still wearing its Latin
-- name in the slot reserved for a name people use.
--
-- Every other entry in the taxonomy already does this: tibialis anterior is
-- "Shin", gastrocnemius is "Calf", extensores carpi are "Wrist extensors", and
-- the two vastus heads either side of this one are "Outer quad" and "Inner
-- quad". The Latin is not lost — `latin_name` carries it, and the exercise
-- panel prints it under the common name.
--
-- "Front quad" rather than "Quadriceps", which was the first suggestion: the
-- quadriceps is the whole group of four, and three of them are separate rows
-- in this table. Naming one head after the group would leave the picker
-- offering "Quadriceps", "Outer quad" and "Inner quad" side by side, as though
-- the first contained the other two.
--
-- A follow-up migration rather than an edit to the seed, which is what the
-- seed itself asks for: "correcting a name later is a one-line change in a
-- follow-up migration rather than a delete-and-reinsert that would break
-- foreign keys."
-- ============================================================================

update public.muscles
   set common_name = 'Front quad'
 where slug = 'rectus-femoris';
