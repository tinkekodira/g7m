/**
 * The exercise catalogue in another language.
 *
 * The catalogue itself lives in Postgres, in English, and reaches devices
 * through sync like any other row. Its translations live here instead, keyed
 * by slug, and are laid over each row as the repositories read it. ADR-0181
 * has the argument; the short version is that the words are part of the app
 * release that shows them, and syncing six copies of every instruction to
 * every phone would make each phone carry five languages it never reads.
 *
 * Every field is optional so that a missing translation shows the English row
 * rather than an empty card. The coverage test in `catalogue.test.ts` is what
 * stops a missing translation from shipping.
 */
export interface ExerciseText {
  readonly name: string;
  readonly aliases: readonly string[];
  readonly instructions: readonly string[];
  readonly cues: readonly string[];
  readonly commonMistakes: readonly string[];
}

export interface CatalogueText {
  /** By exercise slug. */
  readonly exercises: Readonly<Record<string, ExerciseText>>;
  /** By muscle slug: the common name. Latin names are the same everywhere. */
  readonly muscles: Readonly<Record<string, string>>;
  /** By muscle group slug. */
  readonly muscleGroups: Readonly<Record<string, string>>;
  /** By equipment slug. */
  readonly equipment: Readonly<Record<string, string>>;
}
