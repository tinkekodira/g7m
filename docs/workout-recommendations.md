# Workout recommendations

Recommendations offer optional additions in the active workout's picker. They
do not score a workout or estimate individual recovery. No AI service, server
endpoint, stored recommendation or new sync schema is involved.

## Intent and personal patterns

Three distinct strength exercises must have completed working work and no
unfinished non-warm-up rows. Warm-ups, drops alone, zero reps and cardio cannot
satisfy the gate. Adding or undoing a set can close it again. Repeated entries of
one exercise count once.

Only direct groups with at least two completed working sets establish intent.
Assistance does not turn a chest session into Push. Expanding beyond observed
groups needs at least two anchors in the same training family. Inspect the latest
three comparable finished sessions from the preceding 90 days: each must directly
train those anchors and remain in the same family. Mixed/full-body work cannot
manufacture a narrower split. An extra group needs two votes and two-thirds of
the available votes. With fewer than two comparable sessions, do not expand.

Thus chest and triceps do not automatically require shoulders. Shoulders become
eligible only when this user's comparable sessions reliably include them.

## Coverage and budgets

`RECOMMENDATION_PROFILES` explicitly audits every active strength slug. A database
integrity test compares the full active catalogue against that map. Names are
never parsed; unknown slugs fail closed. Complex or uncertain exercises can be
audited without assigning them a recommendation emphasis.

These are tunable product heuristics, not measured activation or growth:

- Direct work counts as one set, assistance as one-half; stabilization does not
  close a gap. Two direct-equivalent sets are the meaningful-coverage reference.
- Queued exercises reserve their emphasis even with one planned set. Empty
  queued exercises and proposed additions reserve three working sets.
  Pending superset selections reserve the same budget before Confirm is pressed.
- Completed and queued work must leave room under both existing session caps:
  beginner 15 sets / 5 exercises, intermediate 20 / 6, advanced 24 / 7.
- Drops remain part of their parent set; warm-ups do not spend these budgets.
- Existing goal/experience weekly targets guard projected primary-group work
  over rolling seven days, including today's queued work. They are not individual
  recovery measurements. Nothing resets abruptly on Monday.
- Suppress optional variety represented by two direct emphasis sets in those
  seven days. Caps stop promotion, never manual exercise logging.

## Scientific boundaries

- [Attarieh et al., 2025](https://pubmed.ncbi.nlm.nih.gov/40082069/) measured both
  biceps and brachialis growth after supinated curls. Ordinary curls do not leave
  brachialis untouched. Hammer curls offer neutral-grip variety; no curl is
  classified as “peak only.”
- [Flat/incline pressing trial](https://pubmed.ncbi.nlm.nih.gov/32922646/) supports
  useful regional differences. Incline pressing offers upper-chest emphasis;
  flat pressing is not classified as providing zero upper-chest work.
- [Maeo et al.](https://pubmed.ncbi.nlm.nih.gov/35819335/) compared overhead and
  neutral-arm elbow extension. Overhead extension offers regional variety;
  pushdowns still train the triceps. Its heads are long, lateral and medial.

Other mappings describe conventional catalogue movements: horizontal/vertical
pulling, knee-dominant work, hip hinges, knee flexion/extension, calf positions,
hip abduction/adduction and trunk movements. They do not claim precise head
stimulation or identical execution across machines. Rows do not receive invented
upper/lower-lat percentages. The back extension instructions teach a neutral-spine
hip hinge, so its recommendation mapping does not call it dynamic lumbar work.
Clean, snatch and Turkish get-up remain unclassified for regional suggestions.

The coefficients remain separate from existing anatomy recruitment weights,
statistics and heat-map calculations. A workout never needs every head isolated.

## Picker behavior

Search and muscle, Gym/Home and equipment filters apply before promotion.
Exclude already-present exercises and pending superset selections. Prefer
equipment used today without assuming other equipment is unavailable.

Rank supported missing groups, complementary movements and then optional regional
variety. Break ties by relevant remaining workload, familiar equipment,
favourites and stable catalogue order. Promote one exercise per distinct emphasis,
at most three total. Strength-focused users receive at most one regional-only
suggestion. Do not fill slots when there is no useful recommendation.

Only promoted rows receive the readable muted “Recommended” label. Keep normal
tap-to-add behavior, the remaining list's order, scrolling and selection state.
Ordinary browsing, routine editing and backdated logging stay unchanged. A failed
recommendation read falls back to the ordinary picker. Evaluation is local and
refreshes after local writes or synced changes.
