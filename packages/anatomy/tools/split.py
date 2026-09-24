"""Pass four: cut the labelled skin into one named object per muscle.

    blender --background --factory-startup --python split.py -- <fit.obj> <labels.json> <out.glb>

The output is what `node-names.ts` has been describing since before there was a
model: a GLB whose nodes are `muscle_<slug>_l`, `muscle_<slug>_r` and
`muscle_<slug>`. Nothing in the viewer has to learn anything new — a tap
resolves to a node name, and a node name resolves to a muscle.

Two things are done by hand rather than by Blender's own tools, both for the
same reason: a seam that shows.

**Normals are computed once, on the whole body, and then carried onto the
pieces as custom split normals.** Splitting a mesh duplicates the vertices
along every cut. If each piece is left to average its own face normals
afterwards, the two sides of a cut disagree about which way the surface faces,
and a smooth shoulder acquires a hard line exactly where the deltoid meets the
pec. The body is one continuous surface and has to keep shading like one.

**The pieces are built directly rather than separated.** `mesh.separate` gives
no way to say which original vertex a duplicate came from, which is precisely
what the paragraph above needs.

**The highlight is not drawn by the pieces.** Their edges are triangle edges,
and a highlight that follows them is a zig-zag. The body is unwrapped, the
labels are smoothed into regions whose borders run *through* triangles, and
those regions are painted into a map in UV space that travels inside the GLB —
see `regions.py`. The pieces are still cut, from the same smoothed regions, and
still named the way `node-names.ts` says: a tap still lands on a node, and a
node still names a muscle.

Two knobs, both environment variables:

- `G7M_REGION_SMOOTHING` (default 30) — rounds of averaging. Each round
  spreads a label about one edge further; the mean edge is 7 mm, so the default
  rounds off anything smaller than two centimetres or so. More makes rounder
  regions and starts to eat narrow ones.
- `G7M_REGION_SIZE` (default 2048) — the map's side, in texels.
"""

import json
import math
import os
import sys
import bpy
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import regions  # noqa: E402

argv = sys.argv[sys.argv.index('--') + 1 :]
obj_path, labels_path, out_path = argv[0], argv[1], argv[2]
DRACO = len(argv) > 3 and argv[3] == 'draco'
SMOOTHING = int(os.environ.get('G7M_REGION_SMOOTHING') or 30)
SIZE = int(os.environ.get('G7M_REGION_SIZE') or 2048)

positions: list[tuple[float, float, float]] = []
faces: list[tuple[int, ...]] = []
with open(obj_path, encoding='utf-8') as fh:
    for line in fh:
        if line.startswith('v '):
            _, x, y, z = line.split()
            positions.append((float(x), float(y), float(z)))
        elif line.startswith('f '):
            faces.append(tuple(int(p.split('/')[0]) - 1 for p in line.split()[1:]))

data = json.loads(open(labels_path, encoding='utf-8').read())
names: list[str] = data['names']
labels: list[int] = data['labels']
assert len(labels) == len(positions), 'labels and vertices have parted company'
print(f'MESH verts={len(positions)} faces={len(faces)} names={len(names)}')

verts = np.array(positions, dtype=np.float64)
tris = np.array([f[:3] for f in faces], dtype=np.int32)

# Area-weighted vertex normals over the whole body, before anything is cut.
# The cross product's length is twice the triangle's area, so not normalising
# it is what does the weighting: a big face should pull a shared vertex further
# than a sliver does.
edge1 = verts[tris[:, 1]] - verts[tris[:, 0]]
edge2 = verts[tris[:, 2]] - verts[tris[:, 0]]
face_normals = np.cross(edge1, edge2)

normals = np.zeros_like(verts)
for corner in range(3):
    np.add.at(normals, tris[:, corner], face_normals)
lengths = np.linalg.norm(normals, axis=1)
# A vertex with no area around it keeps a unit normal rather than a NaN.
lengths[lengths == 0] = 1.0
normals /= lengths[:, None]


bpy.ops.wm.read_factory_settings(use_empty=True)


def unwrap() -> np.ndarray:
    """UVs for the whole body, per corner, before anything is cut.

    Unwrapped whole so every piece shares one layout and one map. Smart UV
    Project, because the sculpt has no seams to cut along and the map does not
    need any: a border that crosses an island's edge is drawn from both sides
    of it. The islands are many and small, and that costs texels, not
    correctness.
    """
    mesh = bpy.data.meshes.new('unwrap')
    mesh.from_pydata(positions, [], faces)
    mesh.update()
    obj = bpy.data.objects.new('unwrap', mesh)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(
        angle_limit=math.radians(66),
        island_margin=0.0,
        area_weight=0.0,
        correct_aspect=True,
        scale_to_bounds=False,
    )
    # A gutter of about five texels at 2048: the shader reads the texels
    # either side of a point, and the gutter is filled from the island's edge.
    bpy.ops.uv.pack_islands(
        rotate=True, margin_method='FRACTION', margin=0.0025, shape_method='CONCAVE'
    )
    bpy.ops.object.mode_set(mode='OBJECT')

    corner_vertices = np.zeros(len(mesh.loops), dtype=np.int64)
    mesh.loops.foreach_get('vertex_index', corner_vertices)
    assert (corner_vertices.reshape(-1, 3) == tris).all(), 'the unwrap renumbered the corners'

    uv = np.zeros(len(mesh.loops) * 2, dtype=np.float32)
    mesh.uv_layers.active.data.foreach_get('uv', uv)
    bpy.data.objects.remove(obj, do_unlink=True)
    bpy.data.meshes.remove(mesh)
    return uv.reshape(-1, 3, 2).astype(np.float64)


uv_blender = unwrap()
# glTF's v runs down the image and Blender's up. The map is drawn in glTF's,
# which is the convention the viewer receives the UVs in.
uv_gltf = uv_blender.copy()
uv_gltf[..., 1] = 1.0 - uv_gltf[..., 1]

fields = regions.smooth_fields(verts, tris, np.array(labels), len(names), SMOOTHING)
face_label = regions.face_regions(fields, tris)

by_label: dict[int, list[int]] = {}
for face_index, label in enumerate(face_label):
    by_label.setdefault(int(label), []).append(face_index)

made = 0
for index in sorted(by_label):
    name = names[index]
    own_faces = by_label[index]

    # Renumber into a local vertex list, keeping each vertex's whole-body
    # normal so the piece still shades as part of the body it came from.
    local: dict[int, int] = {}
    local_verts: list[tuple[float, float, float]] = []
    local_normals: list[tuple[float, float, float]] = []
    local_faces: list[tuple[int, ...]] = []
    for face_index in own_faces:
        remapped = []
        for vertex in faces[face_index]:
            if vertex not in local:
                local[vertex] = len(local_verts)
                local_verts.append(positions[vertex])
                local_normals.append(tuple(normals[vertex]))
            remapped.append(local[vertex])
        local_faces.append(tuple(remapped))

    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(local_verts, [], local_faces)
    mesh.update()
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    mesh.normals_split_custom_set_from_vertices(local_normals)
    # Per corner, from the whole-body unwrap, so every piece reads the map
    # exactly where the body would have.
    layer = mesh.uv_layers.new(name='UVMap')
    layer.data.foreach_set('uv', uv_blender[own_faces].reshape(-1).astype(np.float32))

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    made += 1

print(
    f'SPLIT {made} objects, {sum(len(f) for f in by_label.values())} faces placed, '
    f'smoothing {SMOOTHING}'
)

missing = [names[i] for i in range(len(names)) if i not in by_label]
if missing:
    print('NO GEOMETRY:', ' '.join(missing))

bpy.ops.export_scene.gltf(
    filepath=out_path,
    export_format='GLB',
    use_selection=False,
    export_normals=True,
    export_texcoords=True,
    export_materials='NONE',
    # The mesh is already in the atlas frame, which is glTF's own convention:
    # +y up, +z front. Blender assumes its own z-up and would rotate it.
    export_yup=False,
    # Uncompressed. Draco takes this from 2.7 MB to 438 KB and costs a decoder
    # the app would have to carry: Brief §5 says the model works offline, so it
    # cannot be fetched from a CDN on first paint, and bundling it is 200 KB of
    # wasm plus a loader path to get wrong. Worth revisiting when the file is
    # actually being downloaded by a phone; not worth it to look at it locally.
    export_draco_mesh_compression_enable=DRACO,
    export_draco_mesh_compression_level=6,
)

fine_tris, fine_uv, fine_fields = regions.refine(verts, tris, uv_gltf, fields, 10)
ids, dist = regions.rasterize(fine_uv, fine_tris, fine_fields, SIZE)
print(f'MAP {SIZE}px, {int((ids != regions.EMPTY).sum())} texels on the body')
regions.dilate(ids, dist, 6)
png = regions.png_bytes(regions.encode(ids, dist))
regions.embed(out_path, png, names, SIZE)
# Beside the model as well, for looking at. It is never shipped on its own.
with open(os.path.splitext(out_path)[0] + '_regions.png', 'wb') as fh:
    fh.write(png)
print(f'EMBEDDED the region map, {len(png) // 1024} KB')
print('WROTE', out_path)
