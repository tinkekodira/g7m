"""Pass one: the licensed sculpt, cut down and moved into the atlas frame.

    blender --background --factory-startup --python fit.py -- <in.obj> <out.obj> <tris>

The sculpt arrives as 1.45M triangles in ZBrush's own coordinates: Y up but
535 units tall, standing off to one side of the origin, facing +z with +x on
the figure's left. `atlas.ts` describes a 1.8 m figure with its feet on y = 0,
facing +z, with +x the figure's own **right**. Nothing can be compared until
both are in the same room, so that conversion happens here rather than being
smuggled into the labelling.

Two things are done by hand rather than by Blender, and both for the same
reason — pass three reads labels back by vertex index, so anything that could
silently reorder or reinterpret the file is a bug waiting to happen:

  * Coordinates are read straight off the mesh data. Blender's OBJ importer
    leaves the vertices in the file's own axes and puts the Y-up-to-Z-up
    conversion in the object's matrix instead, so `v.co` is still exactly what
    the file said.
  * The OBJ is written here rather than exported. Blender's exporter applies
    its own axis convention on the way out, which would undo the fit above
    with no error and no warning.
"""

import sys
import bpy

argv = sys.argv[sys.argv.index('--') + 1 :]
src, dst, target_tris = argv[0], argv[1], int(argv[2])

# The atlas frame, from `placeholder-body.ts`: feet just above zero, top of the
# skull at 1.811. Matched on overall height rather than on a landmark, because
# the two heads come out within 3% of each other and nothing else about the
# poses agrees nearly as well.
ATLAS_FEET = 0.009
ATLAS_TOP = 1.811

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.wm.obj_import(filepath=src)

meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
ctx = bpy.context
ctx.view_layer.objects.active = meshes[0]
for o in meshes:
    o.select_set(True)
if len(meshes) > 1:
    bpy.ops.object.join()
body = ctx.view_layer.objects.active

# The sculpt is five connected components: the body, and four small blobs that
# are the eyes. They sit inside the skull where nothing can see or tap them,
# and being unreachable across the surface they are also the one thing the
# label flood cannot reach — so they leave the only unlabelled vertices in the
# mesh. Dropped here rather than handled everywhere downstream.
bpy.ops.mesh.separate(type='LOOSE')

pieces = [o for o in bpy.context.scene.objects if o.type == 'MESH']
pieces.sort(key=lambda o: len(o.data.vertices), reverse=True)
print('COMPONENTS', [len(o.data.vertices) for o in pieces])
for stray in pieces[1:]:
    bpy.data.objects.remove(stray, do_unlink=True)
body = pieces[0]
bpy.context.view_layer.objects.active = body
body.select_set(True)

before = len(body.data.polygons)
mod = body.modifiers.new(name='decimate', type='DECIMATE')
mod.decimate_type = 'COLLAPSE'
mod.ratio = min(1.0, target_tris / before)
bpy.ops.object.modifier_apply(modifier=mod.name)
print(f'DECIMATE {before} -> {len(body.data.polygons)} faces')

coords = [tuple(v.co) for v in body.data.vertices]
lo = [min(c[i] for c in coords) for i in range(3)]
hi = [max(c[i] for c in coords) for i in range(3)]
print('SOURCE bbox', [round(x, 2) for x in lo], [round(x, 2) for x in hi])

# Index 1 is the height: these are the file's own axes, not Blender's.
scale = (ATLAS_TOP - ATLAS_FEET) / (hi[1] - lo[1])
mid_x = (lo[0] + hi[0]) / 2
mid_z = (lo[2] + hi[2]) / 2
print('SCALE', round(scale, 6))

fitted = [
    (
        # Mirrored, because the sculpt's +x is the figure's left. Its
        # silhouette is symmetric to three decimal places, so the flip costs
        # nothing and keeps the convention honest.
        -(c[0] - mid_x) * scale,
        (c[1] - lo[1]) * scale + ATLAS_FEET,
        (c[2] - mid_z) * scale,
    )
    for c in coords
]

flo = [min(c[i] for c in fitted) for i in range(3)]
fhi = [max(c[i] for c in fitted) for i in range(3)]
print('FITTED bbox', [round(x, 3) for x in flo], [round(x, 3) for x in fhi])
print('VERTICES', len(fitted))

with open(dst, 'w', encoding='utf-8') as fh:
    fh.write('# g7m: licensed sculpt, decimated and fitted to the atlas frame.\n')
    fh.write(f'# vertices {len(fitted)} faces {len(body.data.polygons)}\n')
    for x, y, z in fitted:
        fh.write(f'v {x:.6f} {y:.6f} {z:.6f}\n')
    for poly in body.data.polygons:
        verts = list(poly.vertices)
        # Fan-triangulate anything the decimator left as a quad. The labelling
        # only needs the adjacency, and a fan gives every edge of the polygon.
        for i in range(1, len(verts) - 1):
            fh.write(f'f {verts[0] + 1} {verts[i] + 1} {verts[i + 1] + 1}\n')

print('WROTE', dst)
