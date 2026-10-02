import benchIcon from '../assets/equipment/bench-press.png';
import benchHero from '../assets/equipment/bench-press-hero.webp';
import squatRackIcon from '../assets/equipment/squat-rack.png';
import squatRackHero from '../assets/equipment/squat-rack-hero.webp';
import barbellIcon from '../assets/equipment/barbell.png';
import barbellHero from '../assets/equipment/barbell-hero.webp';
import latPulldownIcon from '../assets/equipment/lat-pulldown.png';
import latPulldownHero from '../assets/equipment/lat-pulldown-hero.webp';
import legPressIcon from '../assets/equipment/leg-press.png';
import legPressHero from '../assets/equipment/leg-press-hero.webp';
import dumbbellIcon from '../assets/equipment/dumbbell.png';
import dumbbellHero from '../assets/equipment/dumbbell-hero.webp';
import cableMachineIcon from '../assets/equipment/cable-machine.png';
import cableMachineHero from '../assets/equipment/cable-machine-hero.webp';
import pullUpBarIcon from '../assets/equipment/pull-up-bar.png';
import pullUpBarHero from '../assets/equipment/pull-up-bar-hero.webp';
import ezBarIcon from '../assets/equipment/ez-bar.png';
import ezBarHero from '../assets/equipment/ez-bar-hero.webp';
import exerciseBikeIcon from '../assets/equipment/exercise-bike.png';
import exerciseBikeHero from '../assets/equipment/exercise-bike-hero.webp';
import legCurlExtensionIcon from '../assets/equipment/leg-curl-extension.png';
import legCurlExtensionHero from '../assets/equipment/leg-curl-extension-hero.webp';
import backExtensionIcon from '../assets/equipment/back-extension.png';
import backExtensionHero from '../assets/equipment/back-extension-hero.webp';
import adjustableBenchIcon from '../assets/equipment/adjustable-bench.png';
import adjustableBenchHero from '../assets/equipment/adjustable-bench-hero.webp';
import abductorMachineIcon from '../assets/equipment/abductor-machine.png';
import abductorMachineHero from '../assets/equipment/abductor-machine-hero.webp';
import adductorMachineIcon from '../assets/equipment/adductor-machine.png';
import adductorMachineHero from '../assets/equipment/adductor-machine-hero.webp';
import chestPressMachineIcon from '../assets/equipment/chest-press-machine.png';
import chestPressMachineHero from '../assets/equipment/chest-press-machine-hero.webp';
import trapBarIcon from '../assets/equipment/trap-bar.png';
import trapBarHero from '../assets/equipment/trap-bar-hero.webp';
import treadmillIcon from '../assets/equipment/treadmill.png';
import treadmillHero from '../assets/equipment/treadmill-hero.webp';
import seatedRowMachineIcon from '../assets/equipment/seated-row-machine.png';
import seatedRowMachineHero from '../assets/equipment/seated-row-machine-hero.webp';
import hackSquatIcon from '../assets/equipment/hack-squat.png';
import hackSquatHero from '../assets/equipment/hack-squat-hero.webp';
import pecDeckIcon from '../assets/equipment/pec-deck.png';
import pecDeckHero from '../assets/equipment/pec-deck-hero.webp';
import calfRaiseMachineIcon from '../assets/equipment/calf-raise-machine.png';
import calfRaiseMachineHero from '../assets/equipment/calf-raise-machine-hero.webp';
import dipBarIcon from '../assets/equipment/dip-bar.png';
import dipBarHero from '../assets/equipment/dip-bar-hero.webp';
import lyingLegCurlIcon from '../assets/equipment/lying-leg-curl.png';
import lyingLegCurlHero from '../assets/equipment/lying-leg-curl-hero.webp';
import exerciseMatIcon from '../assets/equipment/exercise-mat.png';
import inclineBenchIcon from '../assets/equipment/incline-bench.png';
import inclineBenchHero from '../assets/equipment/incline-bench-hero.webp';
import tBarIcon from '../assets/equipment/t-bar.png';
import tBarHero from '../assets/equipment/t-bar-hero.webp';
import standingCalfRaiseIcon from '../assets/equipment/standing-calf-raise.png';
import standingCalfRaiseHero from '../assets/equipment/standing-calf-raise-hero.webp';
import seatedCableRowIcon from '../assets/equipment/seated-cable-row.png';
import seatedCableRowHero from '../assets/equipment/seated-cable-row-hero.webp';
import rowingMachineIcon from '../assets/equipment/rowing-machine.png';
import rowingMachineHero from '../assets/equipment/rowing-machine-hero.webp';
import skiErgIcon from '../assets/equipment/ski-erg.png';
import skiErgHero from '../assets/equipment/ski-erg-hero.webp';
import stairClimberIcon from '../assets/equipment/stair-climber.png';
import stairClimberHero from '../assets/equipment/stair-climber-hero.webp';

/**
 * The renders an exercise wears, by exercise slug.
 *
 * Keyed by exercise, filed by *equipment*: a flat barbell bench press, an
 * incline press and a close-grip press are three exercises on one bench, and
 * drawing the bench three times would be three files to keep in step. So the
 * art is a named constant and the map is the join — adding an exercise to an
 * existing piece of kit is one line, and adding a new piece of kit is one asset
 * (or two) and one constant.
 *
 * One map rather than one per surface, so a piece of equipment cannot end up
 * with a square in the list and no hero on its own page by being added to one
 * table and forgotten in the other.
 *
 * ## Why the hero is a `.webp` and the icon a `.png`
 *
 * Everything in `dist` is precached (see `service-worker/precache.ts`), so a
 * hero is bytes every install pays for before it opens anything. At 1200px the
 * same render is 243 KB as a quantised PNG and 51 KB as a WebP at quality 82,
 * and it is displayed dimmed behind a gradient, which is the last place a
 * lossless encode earns its size. The icon stays a PNG because at 168px the
 * difference is under 10 KB and the sharp edges are the whole point of it.
 */
export interface EquipmentArt {
  /** The square in an exercise list row. 168px, padded square, transparent. */
  readonly icon: string;
  /**
   * The full-bleed render behind the title on the exercise's own page.
   *
   * Null for equipment that has an icon and no hero yet: a hero is a much
   * bigger render to make, and half the pair is worth shipping on its own.
   */
  readonly hero: string | null;
}

const BENCH: EquipmentArt = { icon: benchIcon, hero: benchHero };
const SQUAT_RACK: EquipmentArt = { icon: squatRackIcon, hero: squatRackHero };
const BARBELL: EquipmentArt = { icon: barbellIcon, hero: barbellHero };
const LAT_PULLDOWN: EquipmentArt = { icon: latPulldownIcon, hero: latPulldownHero };
const LEG_PRESS: EquipmentArt = { icon: legPressIcon, hero: legPressHero };
const DUMBBELL: EquipmentArt = { icon: dumbbellIcon, hero: dumbbellHero };
const CABLE_MACHINE: EquipmentArt = { icon: cableMachineIcon, hero: cableMachineHero };
const PULL_UP_BAR: EquipmentArt = { icon: pullUpBarIcon, hero: pullUpBarHero };
const EZ_BAR: EquipmentArt = { icon: ezBarIcon, hero: ezBarHero };
const EXERCISE_BIKE: EquipmentArt = { icon: exerciseBikeIcon, hero: exerciseBikeHero };
const LEG_CURL_EXTENSION: EquipmentArt = { icon: legCurlExtensionIcon, hero: legCurlExtensionHero };
const BACK_EXTENSION: EquipmentArt = { icon: backExtensionIcon, hero: backExtensionHero };
const ADJUSTABLE_BENCH: EquipmentArt = { icon: adjustableBenchIcon, hero: adjustableBenchHero };
const ABDUCTOR_MACHINE: EquipmentArt = { icon: abductorMachineIcon, hero: abductorMachineHero };
const ADDUCTOR_MACHINE: EquipmentArt = { icon: adductorMachineIcon, hero: adductorMachineHero };
const CHEST_PRESS_MACHINE: EquipmentArt = {
  icon: chestPressMachineIcon,
  hero: chestPressMachineHero,
};
const TRAP_BAR: EquipmentArt = { icon: trapBarIcon, hero: trapBarHero };
const TREADMILL: EquipmentArt = { icon: treadmillIcon, hero: treadmillHero };
const SEATED_ROW_MACHINE: EquipmentArt = { icon: seatedRowMachineIcon, hero: seatedRowMachineHero };
const HACK_SQUAT: EquipmentArt = { icon: hackSquatIcon, hero: hackSquatHero };
const PEC_DECK: EquipmentArt = { icon: pecDeckIcon, hero: pecDeckHero };
const CALF_RAISE_MACHINE: EquipmentArt = { icon: calfRaiseMachineIcon, hero: calfRaiseMachineHero };
const DIP_BAR: EquipmentArt = { icon: dipBarIcon, hero: dipBarHero };
const LYING_LEG_CURL: EquipmentArt = { icon: lyingLegCurlIcon, hero: lyingLegCurlHero };
// Icon only. At about 4:1 the mat is too flat to carry a name: on a phone it
// is a band under 100px tall, and the name sat on bare page above it.
const EXERCISE_MAT: EquipmentArt = { icon: exerciseMatIcon, hero: null };
const INCLINE_BENCH: EquipmentArt = { icon: inclineBenchIcon, hero: inclineBenchHero };
const T_BAR: EquipmentArt = { icon: tBarIcon, hero: tBarHero };
const STANDING_CALF_RAISE: EquipmentArt = {
  icon: standingCalfRaiseIcon,
  hero: standingCalfRaiseHero,
};
const SEATED_CABLE_ROW: EquipmentArt = { icon: seatedCableRowIcon, hero: seatedCableRowHero };
const ROWING_MACHINE: EquipmentArt = { icon: rowingMachineIcon, hero: rowingMachineHero };
const SKI_ERG: EquipmentArt = { icon: skiErgIcon, hero: skiErgHero };
const STAIR_CLIMBER: EquipmentArt = { icon: stairClimberIcon, hero: stairClimberHero };

const EQUIPMENT_ART: Readonly<Record<string, EquipmentArt>> = {
  'barbell-bench-press': BENCH,
  // Same flat bench and rack, hands closer together on the bar.
  'close-grip-bench-press': BENCH,

  // A fixed Olympic incline bench with its own J-hooks, not the adjustable one.
  'incline-barbell-press': INCLINE_BENCH,

  // A rack is what the bar comes off, not what it is made of.
  'barbell-back-squat': SQUAT_RACK,
  'barbell-front-squat': SQUAT_RACK,
  'overhead-press': SQUAT_RACK,

  // Lifted off the floor or held standing — no rack, no bench.
  'barbell-row': BARBELL,
  'barbell-shrug': BARBELL,
  'barbell-curl': BARBELL,
  'barbell-preacher-curl': BARBELL,
  'conventional-deadlift': BARBELL,
  'romanian-deadlift': BARBELL,
  'barbell-hip-thrust': BARBELL,

  // A chrome frame fills the span between the plates where the barbell has
  // one thin line — its own render, not a barbell variant.
  'trap-bar-deadlift': TRAP_BAR,

  'lat-pulldown': LAT_PULLDOWN,

  'leg-press': LEG_PRESS,

  'hack-squat': HACK_SQUAT,

  'dumbbell-bench-press': DUMBBELL,
  'dumbbell-shoulder-press': DUMBBELL,
  'lateral-raise': DUMBBELL,
  'rear-delt-fly': DUMBBELL,
  'single-arm-dumbbell-row': DUMBBELL,
  'goblet-squat': DUMBBELL,
  'bulgarian-split-squat': DUMBBELL,
  'walking-lunge': DUMBBELL,
  'hammer-curl': DUMBBELL,
  'dumbbell-curl': DUMBBELL,
  'dumbbell-preacher-curl': DUMBBELL,
  'concentration-curl': DUMBBELL,
  'incline-dumbbell-curl': DUMBBELL,
  'farmer-carry': DUMBBELL,
  'dumbbell-pullover': DUMBBELL,

  // A fixed bar, not a stack-and-cable machine — separate from the lat pulldown.
  'pull-up': PULL_UP_BAR,
  'chin-up': PULL_UP_BAR,
  'hanging-leg-raise': PULL_UP_BAR,

  'cable-fly': CABLE_MACHINE,
  'face-pull': CABLE_MACHINE,
  'straight-arm-pulldown': CABLE_MACHINE,
  'triceps-pushdown': CABLE_MACHINE,
  'overhead-triceps-extension': CABLE_MACHINE,
  'cable-crunch': CABLE_MACHINE,
  'cable-woodchop': CABLE_MACHINE,
  'cable-lat-pullover': CABLE_MACHINE,
  'cable-curl': CABLE_MACHINE,
  // A selectorised low row: its own stack, bench and footplates. Not the
  // cable crossover, and not the plate-loaded row machine below.
  'seated-cable-row': SEATED_CABLE_ROW,

  // Plate-loaded rather than cable-driven, the seated, chest-supported pull —
  // its own machine, not the cable machine's low pulley.
  'seated-row-machine': SEATED_ROW_MACHINE,

  // The fixed-weight urethane curl bar, not a loadable Olympic EZ bar.
  'preacher-curl': EZ_BAR,
  'ez-bar-curl': EZ_BAR,
  'skull-crusher': EZ_BAR,

  // One upright bike render covers all three — the silhouette does not
  // survive at 56px between upright and spin. Recumbent is the compromise.
  'upright-bike': EXERCISE_BIKE,
  'recumbent-bike': EXERCISE_BIKE,
  'spin-bike': EXERCISE_BIKE,

  // The dual Life Fitness Axiom station — one seat, one carriage, both pads.
  'leg-extension': LEG_CURL_EXTENSION,
  'seated-leg-curl': LEG_CURL_EXTENSION,

  // Prone on a cranked pad, not seated — its own machine, not the station above.
  'lying-leg-curl': LYING_LEG_CURL,

  'back-extension': BACK_EXTENSION,

  // The back set to an incline is what tells this press from the flat one.
  'incline-dumbbell-press': ADJUSTABLE_BENCH,

  // A chest-supported T-bar station. The row is filed under `barbell` in the
  // equipment picker (a landmine does it too), but this is what it looks like.
  't-bar-row': T_BAR,

  'machine-chest-press': CHEST_PRESS_MACHINE,
  'pec-deck': PEC_DECK,

  // A wall-mounted dip bar, not a free-standing dip station.
  'chest-dip': DIP_BAR,

  treadmill: TREADMILL,
  'rowing-machine': ROWING_MACHINE,
  'ski-erg': SKI_ERG,
  'stair-climber': STAIR_CLIMBER,

  'seated-calf-raise': CALF_RAISE_MACHINE,
  // Shoulder pads and no seat — a different machine from the seated one.
  'standing-calf-raise': STANDING_CALF_RAISE,

  // Two icons, one machine: same frame, pads and arrows swung the other way.
  'hip-abduction-machine': ABDUCTOR_MACHINE,
  'hip-adduction-machine': ADDUCTOR_MACHINE,

  // Bodyweight, so no catalogue kit: the mat is what they are done on. The
  // wall sit needs a wall rather than a mat and wears this until it has one.
  'push-up': EXERCISE_MAT,
  plank: EXERCISE_MAT,
  'wall-sit': EXERCISE_MAT,
};

/** What this exercise has been drawn with, or null if it has not been. */
export function equipmentArt(slug: string): EquipmentArt | null {
  return EQUIPMENT_ART[slug] ?? null;
}
