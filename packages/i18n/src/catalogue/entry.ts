import type { ExerciseText } from './types.js';

/**
 * One exercise in another language, written positionally so that the 151
 * entries per language read as text rather than as object syntax.
 */
export function exercise(
  name: string,
  aliases: readonly string[],
  instructions: readonly string[],
  cues: readonly string[],
  commonMistakes: readonly string[],
): ExerciseText {
  return { name, aliases, instructions, cues, commonMistakes };
}
