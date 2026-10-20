# Resolved — recap overflow with wider system fonts and a double Done click in tests

PR #187's Linux screenshots showed the history heading wrapping onto a second
line at 320px. That reduced the totals grid's height enough for its four values
to extend below their cells during a level-up. Scale history headings to phone
width and reduce compact-grid spacing, preserving the individual-value overflow
checks. Their failures now identify the affected stats.

The offline workout-upgrade scenario also clicked Done and immediately called
the tab helper, which could still see the outgoing recap and attempt Done a
second time. Wait for the recap to disappear and Main navigation to return
before using tabs. This keeps the test on the same visible navigation path as
the user and avoids force-clicking a detached element.

# Resolved — stale assertions after the workout recap redesign

PR #186's full browser run caught an older offline recap test still requiring
the removed “Logged training” explanation and the old “First logged session”
label. Update that test to verify the explanation is absent, three working
sets remain, the comparison shows its best set and first-session previous
state, and there is exactly one Done action. Retain its offline finish,
history reopening, reload and upload checks. The recap's focused browser tests
passed; validation must also include this existing workout-upgrade scenario.

# Resolved — offline cold start in the browser test build

ADR-0147 identifies the cause: `Vary: Origin` on preview assets made module and
worker requests miss copies cached by install-time fetches without an Origin
header. Scoped build-asset cache reads now ignore Vary. Regression coverage
finishes a workout, revisits its recap and reloads offline. Auth, sync and
external requests keep their existing behavior. The original investigation:

During ADR-0141 validation on 2026-10-17, the restored training review rendered
correctly at phone and desktop widths, but a full offline reload of the test
build produced a blank screen. This also happened after awaiting
`navigator.serviceWorker.ready`. Chrome reported `net::ERR_FAILED` loading the
entry JavaScript, achievements chunk and stylesheet from `/assets/`.

Reproduction: run the production build against the fake backend, sign in,
open Progress, wait for the service worker, set the browser context offline,
then reload the page. Investigate asset caching and service-worker control
separately from the review's goal-history cutoff. Whether this also affects
the deployed phone app has not been established. The review regression tests
exercise local queries by navigating Home → review while offline instead.

# Cosmetic notes — plate calculator rebuild

Nothing here blocks the feature; everything below is a suggestion, not a bug
report. Screenshotted against the fake-backend e2e build (Chromium, Pixel 7
viewport).

## "Available plates" selected/deselected contrast is opacity-only

A deselected plate button drops to `opacity-45` and nothing else changes —
same colour disc, same border, same text colour, just fainter. In a
screenshot it reads clearly enough, but it's the *only* visual signal for a
sighted user (the ARIA `aria-pressed` state covers screen readers). Worth a
look on an actual phone in bright light — if it's too subtle there, a small
check mark or a border-colour change on the selected state would make the
difference more certain without needing much contrast headroom.

## Five-plus plate rows wrap the trailing "on a 20 kg bar" onto its own line

At a heavy weight (five plates a side, e.g. 185 kg), the "Each end" row's
chips fill the card width and "on a 20 kg bar" drops to a second line on its
own. It still reads fine, just worth a glance on a real narrow phone (this
was checked at a Pixel-7-width viewport) to confirm it doesn't look like a
stray orphaned line.

## The 2.5 kg and 1.25 kg plates all but disappear against the sleeve

Re-checked after the sprite re-import (bars redesigned, transparent bores
added, `manifest.json`'s `layers` order now followed exactly — see the git
log for the commit this note landed in). The layering itself is correct: a
25+20+2.5+1.25-per-side load stacks flush, in the right order, with no hub
or bar drawn over a plate face. But `plate_kg_2.5` (dark grey) and
`plate_kg_1.25` (light grey) are close enough in tone to the sleeve's own
metal that on a real screen they read as part of the hub rather than as
their own discs — a pixel sample along the bar axis on that load shows a
smooth gray gradient from the sleeve straight into the blue 20, with no
perceptible step where the two grey plates sit. Red, blue, yellow, green and
black are all fine; only the two lightest plates and the collar (also
silver) are affected. Not something layout or draw order can fix — it would
need a tone or rim-highlight change in the 3D source (`3d-models/plate-calculator/`)
to give `plate_kg_2.5` and `plate_kg_1.25` more contrast against the sleeve.
