import benchIcon from '../assets/equipment/bench-press.png';
import benchHero from '../assets/equipment/bench-press-hero.webp';
import squatRackIcon from '../assets/equipment/squat-rack.png';
import squatRackHero from '../assets/equipment/squat-rack-hero.webp';
import barbellIcon from '../assets/equipment/barbell.png';
import barbellHero from '../assets/equipment/barbell-hero.webp';
import latPulldownIcon from '../assets/equipment/lat-pulldown.png';
import latPulldownHero from '../assets/equipment/lat-pulldown-hero.webp';

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

  'lat-pulldown': LAT_PULLDOWN,
};

/** What this exercise has been drawn with, or null if it has not been. */
export function equipmentArt(slug: string): EquipmentArt | null {
  return EQUIPMENT_ART[slug] ?? null;
}
