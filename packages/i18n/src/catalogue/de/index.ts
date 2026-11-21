import type { CatalogueText } from '../types.js';
import { exercises1 } from './exercises-1.js';
import { exercises2 } from './exercises-2.js';
import { exercises3 } from './exercises-3.js';
import { equipment, muscleGroups, muscles } from './names.js';

export const catalogue: CatalogueText = {
  exercises: { ...exercises1, ...exercises2, ...exercises3 },
  muscles,
  muscleGroups,
  equipment,
};
