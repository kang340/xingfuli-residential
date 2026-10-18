# -*- coding: utf-8 -*-
"""Render the final presentation stills from the saved scene."""
import bpy
import os
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'renders')
os.makedirs(OUT, exist_ok=True)

bpy.ops.wm.open_mainfile(filepath=os.path.join(ROOT, '中国居民楼_幸福里.blend'))
sc = bpy.context.scene
sc.render.image_settings.file_format = 'PNG'
sc.render.image_settings.color_mode = 'RGB'
sc.render.image_settings.color_depth = '8'
sc.render.image_settings.compression = 15
sc.render.use_persistent_data = True
sc.cycles.use_denoising = True
sc.cycles.adaptive_threshold = 0.03
sc.cycles.use_adaptive_sampling = True
sc.cycles.max_bounces = 4
sc.cycles.diffuse_bounces = 2
sc.cycles.glossy_bounces = 2
sc.cycles.transmission_bounces = 3
sc.cycles.transparent_max_bounces = 6

jobs = [
    ('01_主视角',   '相机_主视角',   1600,  900, 64),
    ('02_立面细节', '相机_立面细节', 1280,  720, 48),
    ('03_单元入口', '相机_单元入口', 1280,  720, 48),
    ('04_街景',     '相机_街景',     1280,  720, 48),
    ('05_屋顶',     '相机_屋顶',     1280,  720, 48),
]

for stem, cam_name, w, h, samples in jobs:
    t0 = time.time()
    sc.camera = bpy.data.objects[cam_name]
    sc.render.resolution_x = w
    sc.render.resolution_y = h
    sc.render.resolution_percentage = 100
    sc.cycles.samples = samples
    sc.render.filepath = os.path.join(OUT, stem + '.png')
    bpy.ops.render.render(write_still=True)
    print('FINAL %s %dx%d %d samples %.1fs' % (stem, w, h, samples, time.time() - t0))

print('ALL FINAL RENDERS DONE')
