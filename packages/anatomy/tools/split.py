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
"""

import json
import sys
import bpy
import numpy as np

argv = sys.argv[sys.argv.index('--') + 1 :]
obj_path, labels_path, out_path = argv[0], argv[1], argv[2]
DRACO = len(argv) > 3 and argv[3] == 'draco'

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


def label_of(face: tuple[int, ...]) -> int:
    """A face belongs to whichever muscle most of its corners do.

    Ties go to the lowest label, so a face straddling a border lands on the
    same side every time this is run.
    """
    counts: dict[int, int] = {}
    for vertex in face:
        counts[labels[vertex]] = counts.get(labels[vertex], 0) + 1
    best = max(counts.values())
    return min(label for label, count in counts.items() if count == best)


by_label: dict[int, list[tuple[int, ...]]] = {}
for face in faces:
    by_label.setdefault(label_of(face), []).append(face)

bpy.ops.wm.read_factory_settings(use_empty=True)

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
    for face in own_faces:
        remapped = []
        for vertex in face:
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

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    made += 1

print(f'SPLIT {made} objects, {sum(len(f) for f in by_label.values())} faces placed')

missing = [names[i] for i in range(len(names)) if i not in by_label]
if missing:
    print('NO GEOMETRY:', ' '.join(missing))

bpy.ops.export_scene.gltf(
    filepath=out_path,
    export_format='GLB',
    use_selection=False,
    export_normals=True,
    export_texcoords=False,
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
print('WROTE', out_path)
