# -*- coding: utf-8 -*-
"""Build the complete scene and save it as a .blend.

Run:
    blender -b --factory-startup --python build_scene.py -- [--preview]
"""
import bpy
import os
import sys
import math
from mathutils import Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "scripts"))

import scene_lib as L
scene = L.setup_scene()
L.load_fonts()

import parts_building as B
B.MATS = B.init_materials()

import parts_ground as G
G.init_materials()

import parts_street as S
S.init_materials()

print("=== building shell ===")
B.build_shell()
print("=== facade ===")
B.build_facade()
print("=== balconies ===")
B.build_balconies()
print("=== side details ===")
B.build_side_details()
print("=== roof ===")
B.build_roof()

print("=== ground floor ===")
G.build_ground_shell()
for s in G.SHOPS:
    print(" shop", s['name'])
    G.build_shop(s)
for st in G.STAIRS:
    print(" entrance", st['name'])
    G.build_entrance(st)
G.build_wall_details()
G.build_front_details()

print("=== street ===")
S.build_street()

# make sure all watertight custom meshes are facing outward
L.recalc_closed_normals()

# ---------------------------------------------------------------------------
# world / lighting
# ---------------------------------------------------------------------------
def make_world():
    world = bpy.data.worlds.new('黄昏天空')
    world.use_nodes = True
    nt = world.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputWorld')
    out.location = (500, 0)
    bg = nt.nodes.new('ShaderNodeBackground')
    bg.location = (250, 0)
    bg.inputs['Strength'].default_value = 0.14
    sky = nt.nodes.new('ShaderNodeTexSky')
    sky.location = (0, 0)
    sky.sky_type = 'MULTIPLE_SCATTERING'
    sky.sun_elevation = math.radians(4.5)
    sky.sun_rotation = math.radians(205.0)
    sky.sun_disc = False
    sky.sun_intensity = 1.0
    sky.altitude = 120.0
    sky.air_density = 1.25
    sky.aerosol_density = 2.4
    sky.ozone_density = 1.0
    nt.links.new(sky.outputs['Color'], bg.inputs['Color'])
    nt.links.new(bg.outputs['Background'], out.inputs['Surface'])
    return world

scene.world = make_world()

def add_sun():
    data = bpy.data.lights.new('夕阳', 'SUN')
    data.energy = 6.4
    data.color = (1.0, 0.82, 0.66)
    data.angle = math.radians(2.8)
    ob = bpy.data.objects.new('夕阳', data)
    L.C('灯光').objects.link(ob)
    # low afternoon sun from the front-left; long shadows across the street
    direction = Vector((0.60, 0.72, -0.34)).normalized()
    ob.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
    ob.location = (-25, -35, 20)
    return ob

add_sun()

def add_fill():
    data = bpy.data.lights.new('天空补光', 'AREA')
    data.energy = 750
    data.color = (0.64, 0.76, 1.0)
    data.shape = 'RECTANGLE'
    data.size = 18
    data.size_y = 12
    ob = bpy.data.objects.new('天空补光', data)
    L.C('灯光').objects.link(ob)
    ob.location = (26, -38, 15)
    L.look_at(ob, (0, 0, 8))
    return ob

add_fill()

# a warm bounce at street level, like light reflected from the pavement
def add_bounce():
    data = bpy.data.lights.new('地面反弹光', 'AREA')
    data.energy = 230
    data.color = (1.0, 0.68, 0.46)
    data.shape = 'RECTANGLE'
    data.size = 12
    data.size_y = 4
    ob = bpy.data.objects.new('地面反弹光', data)
    L.C('灯光').objects.link(ob)
    ob.location = (6, -12.5, 0.8)
    ob.rotation_euler = (math.radians(85), 0, 0)
    return ob

add_bounce()

# ---------------------------------------------------------------------------
# cameras
# ---------------------------------------------------------------------------
def make_camera(name, loc, target, lens=35, sensor=36, fstop=8.0, focus=None):
    data = bpy.data.cameras.new(name)
    data.lens = lens
    data.sensor_width = sensor
    data.sensor_fit = 'HORIZONTAL'
    data.clip_start = 0.1
    data.clip_end = 500
    data.dof.use_dof = fstop > 0
    data.dof.aperture_fstop = fstop
    if focus is not None:
        data.dof.focus_distance = focus
    elif fstop > 0:
        data.dof.focus_distance = (Vector(target) - Vector(loc)).length
    ob = bpy.data.objects.new(name, data)
    L.C('相机').objects.link(ob)
    ob.location = loc
    L.look_at(ob, target)
    return ob

hero = make_camera('相机_主视角', (32.0, -53.0, 6.8), (0.0, -1.0, 11.2),
                   lens=33, fstop=0.0)
facade = make_camera('相机_立面细节', (10.0, -30.0, 3.2), (0.0, -6.0, 7.2),
                     lens=35, fstop=5.6)
entrance = make_camera('相机_单元入口', (-2.4, -15.8, 1.8), (0.0, -6.0, 2.45),
                       lens=32, fstop=4.0)
street_view = make_camera('相机_街景', (-29.0, -17.0, 2.2), (12.0, -6.4, 6.0),
                          lens=38, fstop=5.6)
roof_view = make_camera('相机_屋顶', (28.0, -38.0, 33.0), (-1.0, 0.5, 22.7),
                        lens=42, fstop=0.0)
scene.camera = hero

# ---------------------------------------------------------------------------
# a very light grade: soft highlight bloom and warm/cool split
# ---------------------------------------------------------------------------
def setup_compositor():
    ng = bpy.data.node_groups.new('暖光调色', 'CompositorNodeTree')
    ng.interface.new_socket(name='Image', in_out='OUTPUT', socket_type='NodeSocketColor')
    out = ng.nodes.new('NodeGroupOutput'); out.location = (900, 0)
    rl = ng.nodes.new('CompositorNodeRLayers'); rl.location = (-400, 0)
    gl = ng.nodes.new('CompositorNodeGlare'); gl.location = (0, 0)
    cb = ng.nodes.new('CompositorNodeColorBalance'); cb.location = (400, 0)
    gl.inputs[1].default_value = 'Fog Glow'
    gl.inputs[2].default_value = 'High'
    gl.inputs[3].default_value = 1.15
    gl.inputs[7].default_value = 0.14
    gl.inputs[10].default_value = 0.55
    cb.inputs[1].default_value = 0.8
    cb.inputs[4].default_value = (0.995, 1.0, 1.012, 1.0)
    cb.inputs[8].default_value = (1.02, 1.0, 0.988, 1.0)
    ng.links.new(rl.outputs['Image'], gl.inputs['Image'])
    ng.links.new(gl.outputs['Image'], cb.inputs['Image'])
    ng.links.new(cb.outputs['Image'], out.inputs['Image'])
    scene.compositing_node_group = ng
    scene.render.use_compositing = True

setup_compositor()

# ---------------------------------------------------------------------------
# render / save
# ---------------------------------------------------------------------------
preview = '--preview' in sys.argv
scene.view_settings.exposure = 0.02
if preview:
    scene.render.resolution_x = 960
    scene.render.resolution_y = 540
    scene.cycles.samples = 48
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.adaptive_threshold = 0.035
else:
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.cycles.samples = 192
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.adaptive_threshold = 0.02

scene.render.filepath = os.path.join(ROOT, 'renders', '_preview_hero.png' if preview else 'hero.png')

# friendly scene metadata
scene['项目'] = '幸福里 · 典型中国居民楼'
scene['说明'] = '程序化建模的中国城市老旧居民楼街景，包含住宅楼、底商、阳台生活痕迹、街道与植被。'
scene['作者'] = 'DeepSeek V4.1 Flash 1017'

blend_path = os.path.join(ROOT, '中国居民楼_幸福里.blend')
bpy.ops.wm.save_as_mainfile(filepath=blend_path)
print('SAVED', blend_path)

# count objects for the log
mesh_count = sum(1 for o in bpy.data.objects if o.type == 'MESH')
curve_count = sum(1 for o in bpy.data.objects if o.type == 'CURVE')
print('OBJECTS', len(bpy.data.objects), 'MESH', mesh_count, 'CURVE', curve_count)

if preview:
    print('=== preview render ===')
    bpy.ops.render.render(write_still=True)
    print('RENDERED', scene.render.filepath)
