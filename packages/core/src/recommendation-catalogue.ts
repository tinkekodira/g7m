/**
 * Curated training emphases, not measured activation percentages. ADR-0146.
 * Every active strength slug is audited by the database catalogue test.
 * New/unknown exercises fail closed until reviewed. Names are never parsed.
 */
export interface TrainingEmphasis {
  readonly group: string;
  readonly key: string;
  readonly kind: 'movement' | 'regional';
}
export interface TrainingProfile {
  readonly direct: readonly string[];
  readonly assistance: readonly string[];
  readonly emphases: readonly TrainingEmphasis[];
}

function profile(
  direct: string[],
  assistance: string[],
  group: string,
  key: string,
  kind: TrainingEmphasis['kind'] = 'movement',
): TrainingProfile {
  return { direct, assistance, emphases: [{ group, key, kind }] };
}

const flat = profile(['chest'], ['shoulders', 'triceps'], 'chest', 'horizontal-press');
const incline = profile(['chest'], ['shoulders', 'triceps'], 'chest', 'upper-chest', 'regional');
const fly = profile(['chest'], [], 'chest', 'chest-adduction');
const press = profile(['shoulders'], ['triceps'], 'shoulders', 'overhead-press');
const row = profile(['back'], ['biceps', 'rear_delts'], 'back', 'horizontal-pull');
const vertical = profile(['back'], ['biceps'], 'back', 'vertical-pull');
const squat = profile(['quads', 'glutes'], [], 'quads', 'knee-dominant');
const hinge = profile(['hamstrings', 'glutes'], [], 'hamstrings', 'hip-hinge');
const curl = profile(['biceps'], [], 'biceps', 'supinated-curl');
const crunch = profile(['core'], [], 'core', 'trunk-flexion');

export const RECOMMENDATION_PROFILES: Readonly<Record<string, TrainingProfile>> = {
  'barbell-bench-press': flat,
  'smith-machine-bench-press': flat,
  'dumbbell-bench-press': flat,
  'machine-chest-press': flat,
  'push-up': flat,
  'incline-barbell-press': incline,
  'incline-dumbbell-press': incline,
  'incline-machine-chest-press': incline,
  'smith-machine-incline-bench-press': incline,
  'chest-dip': profile(['chest'], ['triceps', 'shoulders'], 'chest', 'dip-press'),
  'cable-fly': fly,
  'pec-deck': fly,
  'overhead-press': press,
  'dumbbell-shoulder-press': press,
  'shoulder-press-machine': press,
  'kettlebell-press': press,
  'lateral-raise': profile(['shoulders'], [], 'shoulders', 'side-delts', 'regional'),
  'rear-delt-fly': profile(['rear_delts'], ['back'], 'rear_delts', 'rear-delt-isolation'),
  'rear-delt-fly-machine': profile(['rear_delts'], ['back'], 'rear_delts', 'rear-delt-isolation'),
  'face-pull': profile(['rear_delts', 'back'], [], 'rear_delts', 'rear-delt-isolation'),
  'pull-up': vertical,
  'chin-up': vertical,
  'lat-pulldown': vertical,
  'straight-arm-pulldown': profile(['back'], [], 'back', 'shoulder-extension'),
  'cable-lat-pullover': profile(['back'], [], 'back', 'shoulder-extension'),
  'dumbbell-pullover': profile(['back'], ['chest'], 'back', 'shoulder-extension'),
  'barbell-row': row,
  'single-arm-dumbbell-row': row,
  'chest-supported-dumbbell-row': row,
  'seated-cable-row': row,
  'seated-row-machine': row,
  't-bar-row': row,
  'barbell-shrug': profile(['traps'], [], 'traps', 'scapular-elevation'),
  'smith-machine-shrug': profile(['traps'], [], 'traps', 'scapular-elevation'),
  'dumbbell-shrug': profile(['traps'], [], 'traps', 'scapular-elevation'),
  'barbell-back-squat': squat,
  'smith-machine-squat': squat,
  'barbell-front-squat': squat,
  'goblet-squat': squat,
  'leg-press': squat,
  'hack-squat': squat,
  'bulgarian-split-squat': squat,
  'walking-lunge': squat,
  'wall-sit': profile(['quads'], [], 'quads', 'knee-dominant'),
  'leg-extension': profile(['quads'], [], 'quads', 'knee-extension'),
  'conventional-deadlift': hinge,
  'romanian-deadlift': hinge,
  'kettlebell-deadlift': hinge,
  'trap-bar-deadlift': profile(['quads', 'glutes'], ['hamstrings'], 'glutes', 'hip-hinge'),
  'barbell-hip-thrust': profile(['glutes'], ['hamstrings'], 'glutes', 'hip-extension'),
  // The catalogue teaches a neutral-spine hip hinge, not dynamic lumbar extension.
  'back-extension': profile(['glutes', 'hamstrings'], [], 'hamstrings', 'hip-hinge'),
  'lying-leg-curl': profile(['hamstrings'], [], 'hamstrings', 'knee-flexion'),
  'seated-leg-curl': profile(['hamstrings'], [], 'hamstrings', 'knee-flexion'),
  'standing-calf-raise': profile(['calves'], [], 'calves', 'straight-knee-calf', 'regional'),
  'seated-calf-raise': profile(['calves'], [], 'calves', 'bent-knee-calf', 'regional'),
  'hip-abduction-machine': profile(['glutes'], [], 'glutes', 'hip-abduction'),
  'hip-adduction-machine': profile(['adductors'], [], 'adductors', 'hip-adduction'),
  'barbell-curl': curl,
  'dumbbell-curl': curl,
  'ez-bar-curl': curl,
  'cable-curl': curl,
  'preacher-curl': curl,
  'barbell-preacher-curl': curl,
  'dumbbell-preacher-curl': curl,
  'preacher-curl-machine': curl,
  'incline-dumbbell-curl': curl,
  'concentration-curl': curl,
  // Supinated curls also load brachialis. This is variety, never a missing muscle.
  'hammer-curl': profile(['biceps'], ['forearms'], 'biceps', 'neutral-curl', 'regional'),
  'close-grip-bench-press': profile(
    ['triceps'],
    ['chest', 'shoulders'],
    'triceps',
    'neutral-arm-extension',
  ),
  'triceps-pushdown': profile(['triceps'], [], 'triceps', 'neutral-arm-extension'),
  'triceps-dip': profile(['triceps'], ['chest', 'shoulders'], 'triceps', 'neutral-arm-extension'),
  'overhead-triceps-extension': profile(
    ['triceps'],
    [],
    'triceps',
    'overhead-extension',
    'regional',
  ),
  // Generic skull crushers do not specify shoulder angle: no long-head-only claim.
  'skull-crusher': profile(['triceps'], [], 'triceps', 'lying-extension'),
  'ab-crunch': crunch,
  'decline-ab-crunch': crunch,
  'cable-crunch': crunch,
  'hanging-leg-raise': profile(['core'], [], 'core', 'leg-raise'),
  plank: profile(['core'], [], 'core', 'anti-extension'),
  'cable-woodchop': profile(['core'], [], 'core', 'trunk-rotation'),
  'farmer-carry': profile(['forearms', 'traps'], [], 'forearms', 'loaded-carry'),
  // Ballistic/complex lifts are audited but cannot establish a regional deficit.
  'kettlebell-swing': { direct: ['glutes', 'hamstrings'], assistance: [], emphases: [] },
  'kettlebell-clean': { direct: [], assistance: [], emphases: [] },
  'kettlebell-snatch': { direct: [], assistance: [], emphases: [] },
  'turkish-get-up': { direct: [], assistance: [], emphases: [] },
};

export function trainingProfile(slug: string): TrainingProfile | undefined {
  return Object.hasOwn(RECOMMENDATION_PROFILES, slug) ? RECOMMENDATION_PROFILES[slug] : undefined;
}
