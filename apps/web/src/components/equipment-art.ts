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

const EQUIPMENT_ART: Readonly<Record<string, EquipmentArt>> = {
  'barbell-bench-press': BENCH,

  // A rack is what the bar comes off, not what it is made of.
  'barbell-back-squat': SQUAT_RACK,
  'barbell-front-squat': SQUAT_RACK,
  'overhead-press': SQUAT_RACK,

  // Lifted off the floor or held standing — no rack, no bench.
  'barbell-row': BARBELL,
  'barbell-shrug': BARBELL,
  'barbell-curl': BARBELL,
  'conventional-deadlift': BARBELL,
  'romanian-deadlift': BARBELL,
  'barbell-hip-thrust': BARBELL,

  // A chrome frame fills the span between the plates where the barbell has
  // one thin line — its own render, not a barbell variant.
  'trap-bar-deadlift': TRAP_BAR,

  'lat-pulldown': LAT_PULLDOWN,

  'leg-press': LEG_PRESS,

  'dumbbell-bench-press': DUMBBELL,
  'incline-dumbbell-press': DUMBBELL,
  'dumbbell-shoulder-press': DUMBBELL,
  'lateral-raise': DUMBBELL,
  'rear-delt-fly': DUMBBELL,
  'single-arm-dumbbell-row': DUMBBELL,
  'goblet-squat': DUMBBELL,
  'bulgarian-split-squat': DUMBBELL,
  'walking-lunge': DUMBBELL,
  'hammer-curl': DUMBBELL,
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

  // The fixed-weight urethane curl bar, not a loadable Olympic EZ bar.
  'preacher-curl': EZ_BAR,
  'skull-crusher': EZ_BAR,

  // One upright bike render covers all three — the silhouette does not
  // survive at 56px between upright and spin. Recumbent is the compromise.
  'upright-bike': EXERCISE_BIKE,
  'recumbent-bike': EXERCISE_BIKE,
  'spin-bike': EXERCISE_BIKE,

  // The dual Life Fitness Axiom station — one seat, one carriage, both pads.
  'leg-extension': LEG_CURL_EXTENSION,
  'seated-leg-curl': LEG_CURL_EXTENSION,

  'back-extension': BACK_EXTENSION,

  // Incline dumbbell press stays on DUMBBELL: the implement is what it
  // needs, and the bench is secondary. This is the one exercise whose
  // distinguishing station is the bench itself.
  'incline-barbell-press': ADJUSTABLE_BENCH,

  'machine-chest-press': CHEST_PRESS_MACHINE,

  treadmill: TREADMILL,

  // Two icons, one machine: same frame, pads and arrows swung the other way.
  'hip-abduction-machine': ABDUCTOR_MACHINE,
  'hip-adduction-machine': ADDUCTOR_MACHINE,
};

/** What this exercise has been drawn with, or null if it has not been. */
export function equipmentArt(slug: string): EquipmentArt | null {
  return EQUIPMENT_ART[slug] ?? null;
}
