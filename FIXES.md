# Resolved — browser suite outgrew its ten-minute deadline

PR #201's first browser run reached the global 600-second deadline with
147 scenarios passing, including all six new tour tests, and nine unfinished.
No assertion failed before cancellation. Build and dependency setup completed
normally; the suite itself exhausted its allowance.

Allow twelve minutes for Playwright while retaining the fifteen-minute job
ceiling, two workers, existing per-test timeouts, retries and report uploads.
This leaves room for the full 156-scenario suite without skipping coverage or
mistaking interrupted tests for application failures. See ADR-0162.

# Resolved — Home appeared before a new account's onboarding

The gate treated a missing local profile as permission to show Home. The
server-created row could take around ten seconds to sync; only then did its
null `onboarded_at` replace Home with welcome questions. Registration also
asked for country despite the same optional question existing in onboarding.

Registration now asks only for email and password and opens question one as
soon as its successful auth response arrives. Users can type their name while
the profile syncs, but Continue and Enter cannot advance before the row can
save it. Unknown profiles wait with retry/sign-out controls; cached onboarded
profiles still work offline. Only a profile with `onboarded_at` can mount the
main app. See ADR-0158 and the delayed-sync signup regression tests.

# Challenge record — missing migration and colliding versions

The “Could not find the function public.challenge_history ... in the schema
cache” screenshot came from a deployed app with an older database. On
2026-10-25, `pnpm db:status` confirmed that workout recommendations, multiple
training goals and challenge results were all still pending on the linked
database. The challenge file also reused the multiple-goals version number.

Rename the unapplied challenge migration to
`20261025130000_challenge_results.sql`; the schema suite now guards against
duplicate versions. Review `supabase db push --dry-run` before applying the
pending migrations. This code change does not deploy the database. The compact
profile record shows unavailable counts as dashes and retries automatically,
without displaying backend details or inviting the user to open another screen.

# Resolved — added-weight reload raced Save, and browser CI showed duplicate failures

PR #192's added-weight scenario clicked Save and immediately reloaded. Under
CI load the navigation could interrupt the asynchronous local write; the
reloaded set still had its old load type. Poll for the expected saved load,
weight and reps on the server before reloading, then retain the reload,
offline prefill, weight clearing and upload assertions in both unit systems.

The two red browser checks represented that one failure: one shard and its
aggregate. Replace the shards and aggregate with one Browser tests (Playwright)
job using two workers, one build and one backend. Keep the preinstalled browser
image that addressed the original installation delay. Offline scenarios now
disconnect only their own browser context; remove the backend-wide outage
switch, and use UUID-based account names across workers. Retain every scenario
and upload one report with failure traces. See ADR-0155.

The full two-worker run also exposed an existing Profile layout assertion
reading the goal's bounding box while its query refreshed and temporarily
unmounted the card. Retry the whole name/level/goal ordering assertion until
the elements are rendered; retain both positional comparisons.

All 132 scenarios then passed on GitHub, but the job took 10 min 36 s.
`retain-on-failure` was recording traces for every successful run before
discarding them. CI now uses `on-first-retry`, retaining first-failure screenshots
and error context plus a full trace from the existing retry. Local runs retain
failure traces because they do not retry automatically. Coverage is unchanged.

# Resolved — browser CI spent half its deadline installing OS packages

PR #188's timed-out run spent 10 min 10 s fetching 25.9 MB from Ubuntu's
package mirror (42.5 kB/s). Browser tests only started eleven minutes into the
job; all 91 completed scenarios passed before the twenty-minute cancellation.
Raising the old fifteen-minute deadline in PR #184 did not address this setup
bottleneck.

Use Playwright's version-matched official image with browsers and OS libraries
already installed. Split the complete suite into two isolated CI jobs, retaining
one worker per backend because outage tests affect every account. Restore the
fifteen-minute job limit and stop Playwright at ten minutes so it writes reports
before runner cancellation. Upload each shard's report on success or failure,
and preserve the existing required check with an aggregate that requires both
shards to succeed.

ADR-0155 subsequently replaces the shards and aggregate with one job and two
workers after making connection failures local to each browser context.

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
