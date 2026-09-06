/**
 * The repositories, bound to this device's database.
 *
 * Brief §0.5: no component touches the database directly. This is the one
 * place the app turns a PowerSync connection into the objects screens are
 * allowed to call, so a component that wants a row has exactly one door.
 *
 * PowerSync's database satisfies `QueryableDatabase` structurally — the
 * narrow interface in `@g7m/db` was chosen for that reason, and it is why the
 * same repository code runs against `node:sqlite` in the tests.
 */
import { EquipmentRepository, ExerciseRepository, MuscleRepository } from '@g7m/db';
import { openDatabase } from '../powersync/database.js';

export interface Repositories {
  readonly exercises: ExerciseRepository;
  readonly muscles: MuscleRepository;
  readonly equipment: EquipmentRepository;
}

let opening: Promise<Repositories> | null = null;

/**
 * Open the database once, and hand out the same repositories to everyone.
 *
 * The promise is cached rather than the result, so several screens mounting at
 * once share one `openDatabase()` rather than racing to open the same OPFS
 * file. A failure clears the cache: a first attempt made before storage was
 * ready should not permanently poison every later one.
 */
export function getRepositories(): Promise<Repositories> {
  opening ??= openDatabase().then(
    (db) => ({
      exercises: new ExerciseRepository(db),
      muscles: new MuscleRepository(db),
      equipment: new EquipmentRepository(db),
    }),
    (error: unknown) => {
      opening = null;
      throw error;
    },
  );
  return opening;
}
