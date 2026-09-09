# Turning a licensed sculpt into a model the app can use

The anatomy model g7m was given is a ZBrush sculpt: 726,631 vertices,
1,453,242 triangles, no normals, no UVs, no materials, and — the part that
matters — **one welded surface**. A connected-components pass finds five
pieces: the body, and four small blobs that are the eyes. The musculature is
sculpted *into* the skin, not built from separate objects.

So it cannot be dropped in. `node-names.ts` needs a node per muscle to tap, and
there are none. These three passes make some.

Nothing here runs in CI. The sculpt is not in the repository and never will be
(ADR-0009, ADR-0019), so `build-model.test.ts` skips itself when the input is
absent rather than failing.

## Pass one — fit

```
blender --background --factory-startup --python packages/anatomy/tools/fit.py -- \
  <sculpt>.OBJ packages/anatomy/assets/licensed/full_body/body_fit.obj 120000
```

Drops the eyes, decimates to roughly 120k triangles, and moves the result into
the frame `atlas.ts` describes — a 1.8 m figure, feet on y = 0, facing +z, with
+x the figure's own right. Writes a plain OBJ by hand, because Blender's
exporter applies its own axis convention on the way out and would undo the fit
with no error and no warning.

## Pass two — label

```
pnpm model:label
```

Runs `build-model.test.ts`, which gives every vertex the name of whichever
procedural muscle is nearest, smooths the result, and writes
`body_labels.json`. It prints a report: how many vertices each muscle got, and
which got none. Read it — a muscle with no geometry is a part of the body that
cannot be tapped, and nothing else in the app will ever mention it.

Three knobs, all environment variables, because they are worth sweeping:

- `G7M_MAX_DISTANCE` (default `0.06`) — how far a skin vertex may be from a
  muscle and still be claimed by it. Six centimetres sounds enormous until you
  remember the sculpt is a heavier figure than the procedural one. Sweeping it
  from 0.06 to 0.30 changes almost nothing, which is worth knowing before you
  spend an afternoon on it.
- `G7M_MAX_TENDON` (default `0.4`) — how much tendon a source vertex may be and
  still claim skin. **The one that matters.** At 1.0 the deltoid's insertion
  cord runs a third of the way down the humerus and takes the bicep's
  territory; at 0.4 the bicep has four times the surface and the deltoid is
  back on the shoulder. Above 0.5 some parts end up with no geometry at all.
- `G7M_SMOOTHING` (default `3`) — majority-vote rounds. Raising it to 10 or 12
  changes nothing visible, which is itself the finding: what looks like
  confetti on the back is stable, not noise.

## Pass three — look at it

```
blender --background --factory-startup --python packages/anatomy/tools/render-labels.py -- \
  packages/anatomy/assets/licensed/full_body/body_fit.obj \
  packages/anatomy/assets/licensed/full_body/body_labels.json \
  <prefix>
```

Paints each label a distinct colour and renders the front and the back.

- `G7M_BY_GROUP=1` collapses muscles into their `muscle_groups` row first.
  **Use this one first.** The heat map colours by muscle, so a boundary inside
  a group is invisible in practice — upper against middle trapezius, trained
  together, shaded alike — while a boundary between traps and lats is an edge
  somebody can see. The mottled back that survives every amount of smoothing is
  almost entirely within-group, and this is how you find that out.
- `G7M_ORTHO` and `G7M_CENTER="x,y,z"` zoom in. A whole body at 760 pixels
  cannot answer a question about an upper arm, and two wrong guesses were made
  before anybody zoomed in on one.

This is not optional. No number in pass two's report can tell you whether a
bicep is in the right place, and ADR-0039 was written after three rounds of
chasing rendering seams that a GPU would never have drawn. Look at the body
before building anything on the labels.
