"""Pass three, diagnostic half: paint the labels on and look at them.

    blender --background --factory-startup --python render-labels.py -- <fit.obj> <labels.json> <prefix>

Numbers cannot say whether a bicep is in the right place. ADR-0039 was written
after three rounds of chasing seams that a GPU would never have drawn, and the
lesson was to calibrate the instrument before trusting what it measures — so
the labelling gets looked at before anything is built on it.

The mesh is rebuilt from the OBJ by hand rather than imported, because the
labels are indexed by vertex and Blender's importer is free to renumber.
"""

import colorsys
import json
import os
import math
import sys
import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1 :]
obj_path, labels_path, prefix = argv[0], argv[1], argv[2]

positions = []
faces = []
with open(obj_path, encoding='utf-8') as fh:
    for line in fh:
        if line.startswith('v '):
            _, x, y, z = line.split()
            positions.append((float(x), float(y), float(z)))
        elif line.startswith('f '):
            corners = [int(p.split('/')[0]) - 1 for p in line.split()[1:]]
            faces.append(tuple(corners))

data = json.loads(open(labels_path, encoding='utf-8').read())
names = data['names']
labels = data['labels']
print(f'MESH verts={len(positions)} faces={len(faces)} labels={len(labels)} names={len(names)}')
assert len(labels) == len(positions), 'labels and vertices have parted company'

bpy.ops.wm.read_factory_settings(use_empty=True)
mesh = bpy.data.meshes.new('body')
mesh.from_pydata(positions, [], faces)
mesh.update()
body = bpy.data.objects.new('body', mesh)
bpy.context.scene.collection.objects.link(body)


# Which group each muscle belongs to, mirroring `muscle_groups` in Postgres.
#
# Used by G7M_BY_GROUP=1, and the distinction it draws is the one that matters:
# the heat map colours by muscle, so a boundary *inside* a group is invisible in
# practice — upper and middle trapezius trained together look the same — while a
# boundary between traps and lats is a visible edge that has to be in the right
# place.
GROUPS = {
    'sternocleidomastoid': 'neck',
    'pec-major-clavicular': 'chest',
    'pec-major-sternal': 'chest',
    'serratus-anterior': 'core',
    'rectus-abdominis': 'core',
    'external-obliques': 'core',
    'anterior-deltoid': 'shoulders',
    'lateral-deltoid': 'shoulders',
    'posterior-deltoid': 'shoulders',
    'biceps-brachii': 'biceps',
    'brachialis': 'biceps',
    'triceps-long-head': 'triceps',
    'triceps-lateral-head': 'triceps',
    'triceps-medial-head': 'triceps',
    'brachioradialis': 'forearms',
    'wrist-flexors': 'forearms',
    'wrist-extensors': 'forearms',
    'upper-trapezius': 'traps',
    'middle-trapezius': 'traps',
    'lower-trapezius': 'traps',
    'rhomboids': 'back',
    'latissimus-dorsi': 'back',
    'teres-major': 'back',
    'infraspinatus': 'back',
    'erector-spinae': 'back',
    'gluteus-maximus': 'glutes',
    'gluteus-medius': 'glutes',
    'rectus-femoris': 'quads',
    'vastus-lateralis': 'quads',
    'vastus-medialis': 'quads',
    'hip-adductors': 'adductors',
    'biceps-femoris': 'hamstrings',
    'semitendinosus': 'hamstrings',
    'semimembranosus': 'hamstrings',
    'gastrocnemius': 'calves',
    'soleus': 'calves',
    'tibialis-anterior': 'calves',
}


def group_of(node_name: str) -> str:
    # Bare skin is one group, not four. A head, two hands, two feet and a
    # groin are all the same answer to "which muscle is this" — none — and
    # showing them apart would invite reading a boundary into them.
    if node_name.startswith('skin_'):
        return 'bare'

    slug = node_name.removeprefix('muscle_')
    for suffix in ('_l', '_r'):
        if slug.endswith(suffix):
            slug = slug[: -len(suffix)]
    return GROUPS.get(slug, slug)


if os.environ.get('G7M_BY_GROUP') == '1':
    order = []
    for name in names:
        group = group_of(name)
        if group not in order:
            order.append(group)
    labels = [order.index(group_of(names[label])) if label >= 0 else -1 for label in labels]
    names = order
    print('BY GROUP', ' '.join(order))


# Group colours, borrowed from the printed anatomy charts everybody has seen.
#
# Not decoration. Golden-angle hues put `core` at 0.236 and `quads` at 0.180 —
# two yellows a shade apart — and a reader looking at that render concluded the
# abdomen and the thigh had been labelled as one group. They had not. Matching
# a chart people already know means a boundary can be compared against one
# rather than puzzled over.
GROUP_COLOURS = {
    'traps': (0.88, 0.13, 0.14),
    'chest': (0.95, 0.55, 0.50),
    'shoulders': (0.98, 0.58, 0.08),
    # Brown, where the chart uses a second orange. Deltoid and lat meet along a
    # long border across the whole upper back, and two oranges a shade apart
    # made that border invisible in the first attempt at this palette.
    'back': (0.52, 0.28, 0.10),
    'biceps': (0.98, 0.88, 0.20),
    'triceps': (0.60, 0.58, 0.12),
    'forearms': (0.25, 0.80, 0.28),
    'core': (0.10, 0.42, 0.16),
    'glutes': (0.35, 0.80, 0.92),
    'quads': (0.13, 0.45, 0.85),
    'hamstrings': (0.38, 0.34, 0.80),
    # Pink, where the chart uses a dark blue that is a shade off the
    # hamstrings. The two share a border down the inner thigh.
    'adductors': (0.90, 0.35, 0.60),
    'calves': (0.62, 0.25, 0.80),
    'neck': (0.96, 0.82, 0.74),
    # Skin over no muscle. Bone-white, which is what a printed plate does with
    # a skull and a hand for exactly the same reason.
    'bare': (0.87, 0.83, 0.75),
}


def hue_for(index: int) -> tuple:
    """A colour per label. Distinct is the only requirement."""
    if index < 0:
        return (1.0, 0.0, 1.0)

    known = GROUP_COLOURS.get(names[index]) if index < len(names) else None
    if known is not None:
        return known

    # Golden-angle hues for the sixty-four individual muscles, where no chart
    # exists to borrow from and neighbours in the list must not be neighbours
    # in colour.
    h = (index * 0.61803398875) % 1.0
    v = 0.95 if index % 2 == 0 else 0.62
    return colorsys.hsv_to_rgb(h, 0.78, v)


colour = mesh.color_attributes.new(name='label', type='FLOAT_COLOR', domain='POINT')
for i, label in enumerate(labels):
    r, g, b = hue_for(label)
    colour.data[i].color = (r, g, b, 1.0)

mat = bpy.data.materials.new('labels')
mat.use_nodes = True
tree = mat.node_tree
attribute = tree.nodes.new('ShaderNodeVertexColor')
attribute.layer_name = 'label'
bsdf = tree.nodes['Principled BSDF']
bsdf.inputs['Roughness'].default_value = 0.6
tree.links.new(attribute.outputs['Color'], bsdf.inputs['Base Color'])
mesh.materials.append(mat)

for polygon in mesh.polygons:
    polygon.use_smooth = True

corners = [body.matrix_world @ v.co for v in mesh.vertices]
lo = Vector([min(c[i] for c in corners) for i in range(3)])
hi = Vector([max(c[i] for c in corners) for i in range(3)])
mid = (lo + hi) / 2
size = hi - lo

scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE'
scene.render.resolution_x = 760
scene.render.resolution_y = 1300
scene.world = bpy.data.worlds.new('w')
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs[0].default_value = (0.05, 0.05, 0.05, 1)

reach = max(size) * 2
cam_data = bpy.data.cameras.new('cam')
cam_data.type = 'ORTHO'
# The figure's height is along y in the atlas frame, not z.
# G7M_ORTHO and G7M_CENTER zoom in on one limb, because a whole-body render at
# 760 pixels cannot answer a question about an upper arm.
cam_data.ortho_scale = float(os.environ.get('G7M_ORTHO') or max(size.y, size.x) * 1.05)
if os.environ.get('G7M_CENTER'):
    mid = Vector([float(v) for v in os.environ['G7M_CENTER'].split(',')])
cam_data.clip_start = 0.001
cam_data.clip_end = reach * 6
cam = bpy.data.objects.new('cam', cam_data)
scene.collection.objects.link(cam)
scene.camera = cam


def sun(name, direction, energy):
    light = bpy.data.lights.new(name, type='SUN')
    light.energy = energy
    obj = bpy.data.objects.new(name, light)
    obj.rotation_euler = Vector(direction).normalized().to_track_quat('-Z', 'Y').to_euler()
    scene.collection.objects.link(obj)


# The mesh is in the atlas frame: +y up, +z front. Blender is z-up, so the
# figure is lying on its back here — which is fine, the camera is placed in the
# same frame the vertices are.
VIEWS = {
    'front': (Vector((0, 0, 1)), (0, 0, 0)),
    # Rolled as well as turned, or the figure comes out upside down.
    'back': (Vector((0, 0, -1)), (math.pi, 0, math.pi)),
}

for name, (towards, rotation) in VIEWS.items():
    cam.location = mid + towards * reach
    cam.rotation_euler = rotation
    for old in [o for o in scene.objects if o.type == 'LIGHT']:
        bpy.data.objects.remove(old, do_unlink=True)
    # Flat, even light: this render is read for colour, not for form.
    sun('key', -towards, 3.0)
    sun('fill', -towards + Vector((1, 0, 0)), 1.2)
    sun('fill2', -towards + Vector((-1, 0, 0)), 1.2)

    scene.render.filepath = f'{prefix}_{name}.png'
    bpy.ops.render.render(write_still=True)
    print('WROTE', scene.render.filepath)
