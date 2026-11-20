/**
 * The gym a set is compared within, in SQL. ADR-0179.
 *
 * One expression, used by every read that feeds a comparison, so the rule in
 * `@g7m/core`'s `lift-key.ts` is decided in exactly one place: the workout's
 * gym, when its owner trains at more than one *and* the exercise's main
 * equipment is a machine or a cable stack; null otherwise. Null means "compared
 * everywhere", which is what everybody with one gym has always had.
 */
import { GYM_DEPENDENT_CATEGORIES } from '@g7m/core';

const CATEGORIES = GYM_DEPENDENT_CATEGORIES.map((category) => `'${category}'`).join(', ');

/**
 * `session` is the alias of a `workout_sessions` row; `exercise` is an SQL
 * expression for the exercise id — a column, or `?` for a parameter.
 */
export function gymScopeSql(session: string, exercise: string): string {
  return `(CASE WHEN ${session}.gym_id IS NOT NULL
      AND EXISTS (SELECT 1 FROM profiles gp
                   WHERE gp.user_id = ${session}.user_id AND gp.multiple_gyms = 1)
      AND EXISTS (SELECT 1 FROM exercise_equipment gxe
                    JOIN equipment geq ON geq.id = gxe.equipment_id
                   WHERE gxe.exercise_id = ${exercise} AND gxe.is_primary = 1
                     AND geq.category IN (${CATEGORIES}))
    THEN ${session}.gym_id END)`;
}
