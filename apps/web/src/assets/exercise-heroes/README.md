# Exercise detail illustrations

The 130 transparent WebP files are resized from the same selected originals in
Milan's `Desktop/exercise-images` collection as the existing exercise thumbnails.
The originals and list thumbnails are preserved. `sources.json` records each
source path (relative to that collection), its SHA-256, and exported dimensions
and size. The four initial exercises use `illustration.png`; the remaining
exercises use their direct folder's finished `_FINAL.png` illustration, with the
same folder-to-slug aliases documented in `../exercises/README.md`.

Exported using sharp 0.34.4: fit inside 960 × 960, preserve aspect ratio, never
enlarge, WebP quality 82, alpha quality 100, effort 6. No cropping, recoloring,
redrawing or source replacement.
The 130 exports total 6,481,058 bytes; the largest is 93,850 bytes.

Vite emits them into `assets/exercise-heroes/`. They are fetched per detail page
and runtime-cached rather than precached. If unavailable, `ExerciseHero` displays
the existing precached 320px thumbnail; written coaching stays available with
neither image. See ADR-0172 and the approved reference in `docs/design/`.
