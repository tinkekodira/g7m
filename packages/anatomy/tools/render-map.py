"""Look at a map on the body: any UV-space picture, drawn on the GLB it belongs to.

    blender --background --factory-startup --python render-map.py -- <body.glb> <prefix> <picture.png>...

Renders each picture from the front, the back and both sides, as
`<prefix>_<picture>_<view>.png`. Made for `repaint.py`, whose `_view_new.png`
and `_view_old.png` put the new and old region maps in the painting's own
colours, so the three can be laid side by side — but anything drawn in the
model's UV layout works, the painting included.

The picture is sampled at the nearest texel, never blended: a region map is
data, and a blend of two muscles' colours is a third muscle that is not there.
Colour management is off for the same reason, so a palette colour comes out
the colour it was painted.
"""

import math
import os
import sys

import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1 :]
glb_path, prefix, pictures = argv[0], argv[1], argv[2:]
# Blender resolves a relative render path against the drive's root, not the
# working directory: `packages/x` lands in `C:\packages\x`.
prefix = os.path.abspath(prefix)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb_path)
meshes = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
print(f'MESHES {len(meshes)}')

points = [obj.matrix_world @ Vector(corner) for obj in meshes for corner in obj.bound_box]
lo = Vector([min(p[i] for p in points) for i in range(3)])
hi = Vector([max(p[i] for p in points) for i in range(3)])
mid = (lo + hi) / 2
size = hi - lo

scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE'
scene.render.resolution_x = 760
scene.render.resolution_y = 1400
scene.view_settings.view_transform = 'Standard'
scene.world = bpy.data.worlds.new('w')
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs[0].default_value = (0.08, 0.08, 0.08, 1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value = 0.6

# glTF's +y up and +z front arrive as Blender's +z up and -y front.
reach = max(size) * 2
camera = bpy.data.objects.new('camera', bpy.data.cameras.new('camera'))
camera.data.type = 'ORTHO'
camera.data.ortho_scale = size.z * 1.04
camera.data.clip_end = reach * 4
scene.collection.objects.link(camera)
scene.camera = camera

sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', type='SUN'))
sun.data.energy = 2.2
scene.collection.objects.link(sun)

VIEWS = {
    'front': (Vector((0, -1, 0)), (math.pi / 2, 0, 0)),
    'back': (Vector((0, 1, 0)), (math.pi / 2, 0, math.pi)),
    # Named for where the camera stands, not for a side of the body: the `_r`
    # parts are at +x (`atlas.ts`), but whether +x is anatomically the
    # figure's right is a question for the atlas, not for this script.
    'side-plus-x': (Vector((1, 0, 0)), (math.pi / 2, 0, math.pi / 2)),
    'side-minus-x': (Vector((-1, 0, 0)), (math.pi / 2, 0, -math.pi / 2)),
}

for picture in pictures:
    image = bpy.data.images.load(os.path.abspath(picture))
    material = bpy.data.materials.new(os.path.basename(picture))
    material.use_nodes = True
    tree = material.node_tree
    texture = tree.nodes.new('ShaderNodeTexImage')
    texture.image = image
    texture.interpolation = 'Closest'
    bsdf = tree.nodes['Principled BSDF']
    bsdf.inputs['Roughness'].default_value = 0.9
    tree.links.new(texture.outputs['Color'], bsdf.inputs['Base Color'])
    # Some of the colour as light of its own, so the shadowed side still
    # reads as the colour that was painted.
    tree.links.new(texture.outputs['Color'], bsdf.inputs['Emission Color'])
    bsdf.inputs['Emission Strength'].default_value = 0.35
    for obj in meshes:
        obj.data.materials.clear()
        obj.data.materials.append(material)

    stem = os.path.splitext(os.path.basename(picture))[0]
    for view, (towards, rotation) in VIEWS.items():
        camera.location = mid + towards * reach
        camera.rotation_euler = rotation
        # Light from over the camera's shoulder.
        sun.rotation_euler = (-towards + Vector((0.3, 0, 0.5))).to_track_quat('Z', 'Y').to_euler()
        scene.render.filepath = f'{prefix}_{stem}_{view}.png'
        bpy.ops.render.render(write_still=True)
        print('WROTE', scene.render.filepath)
