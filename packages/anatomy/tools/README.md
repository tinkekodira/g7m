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

Two knobs, both environment variables, because they are worth sweeping:

- `G7M_MAX_DISTANCE` (default `0.06`) — how far a skin vertex may be from a
  muscle and still be claimed by it. Six centimetres sounds enormous until you
  remember the sculpt is a heavier figure than the procedural one.
- `G7M_SMOOTHING` (default `3`) — majority-vote rounds.

## Pass three — look at it

```
blender --background --factory-startup --python packages/anatomy/tools/render-labels.py -- \
  packages/anatomy/assets/licensed/full_body/body_fit.obj \
  packages/anatomy/assets/licensed/full_body/body_labels.json \
  <prefix>
```

Paints each label a distinct colour and renders the front and the back.

This is not optional. No number in pass two's report can tell you whether a
bicep is in the right place, and ADR-0039 was written after three rounds of
chasing rendering seams that a GPU would never have drawn. Look at the body
before building anything on the labels.
