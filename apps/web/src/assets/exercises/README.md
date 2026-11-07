# Exercise thumbnails

The 130 transparent 320 × 320 exercise illustrations come from Milan's
`Desktop/exercise-images` collection (2026-10-31, 2026-11-01 and 2026-11-07). Use each direct exercise
folder's `<folder>_thumbnail_FINAL.png`; the four original exercises
(`barbell-curl`, `lat-pulldown`, `push-up`, `romanian-deadlift`) use their selected
`thumbnail.png`. Archived versions and full-resolution illustrations are not
bundled. Originals remain unchanged in the source collection.

The 2026-11-01 additions are `smith-machine-bench-press`, `smith-machine-squat`,
`smith-machine-shrug` and `dumbbell-shrug`, using their matching
`<slug>_thumbnail_FINAL.png` from `SMITH_SHRUG_BATCH_2026-11-01_manifest.json`.

`smith-machine-incline-bench-press` also uses its matching finished thumbnail
from the same collection, recorded in that exercise folder's `manifest.json`.

The 2026-11-07 expansion adds 38 illustrations from the matching direct folders,
including separate `spider-curl-ez-bar` and `spider-curl-dumbbell` thumbnails.
`barbell-calf-raise` uses `barbell-calf-raise-on-plate_thumbnail_FINAL.png` from
`barbell-calf-raise-on-plate`. `wrist-curl-dumbbell` uses the matching dumbbell
variation; `strict-curl` depicts an EZ bar, `neck-curl` is unweighted, and
`muscle-up` depicts the kipping straight-bar turnover. Coaching follows those
specifications. Source-folder READMEs retain generation provenance and revisions.

The app copies are WebP at quality 90, alpha quality 100, effort 6, with no
additional resizing, cropping or palette edits. Each filename matches the database slug.
Source-folder aliases:

| Source folder | App slug |
| --- | --- |
| abductor-machine | hip-abduction-machine |
| adductor-machine | hip-adduction-machine |
| front-squat | barbell-front-squat |
| incline-barbell-bench-press | incline-barbell-press |
| dips-chest-focused | chest-dip |
| dips-triceps-focused | triceps-dip |
| preacher-curl-barbell | barbell-preacher-curl |
| preacher-curl-dumbbell | dumbbell-preacher-curl |
| preacher-curl-ez-bar | preacher-curl |
| barbell-calf-raise-on-plate | barbell-calf-raise |

`exercise-icon-art.ts` imports these assets for the shared `ExerciseIcon` used
by Browse, the workout exercise picker and recap rows. Vite fingerprints the
files and the existing service worker precaches them. Equipment heroes and
demonstration media remain in their existing collections.
