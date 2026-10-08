#!/usr/bin/env python3
"""Assembles the Android app's web folder: android/build/assets/www.

  index.html   build.py app  (local fonts, pack thumbnails inside)
  fonts/       android/www/fonts
  scenes/      media/scenes_app  (1080p verse scenes, lighter than the web ones)
  amb audio data img narr pano  from docs/ (the web deploy)
  packs/       only the *_t.jpg thumbnails; full pack media stays on GitHub and is fetched once on demand
"""
import os, shutil, subprocess, sys, glob

P = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # app/
R = os.path.dirname(P)                                               # repo root
DOCS = os.path.join(R, 'docs')
OUT = os.path.join(P, 'android', 'build', 'assets', 'www')


def main():
    if os.path.exists(OUT):
        shutil.rmtree(OUT)
    os.makedirs(OUT)
    subprocess.check_call([sys.executable, os.path.join(P, 'build', 'build.py'), 'app', os.path.join(OUT, 'index.html')])
    shutil.copytree(os.path.join(P, 'android', 'www', 'fonts'), os.path.join(OUT, 'fonts'))
    shutil.copytree(os.path.join(P, 'media', 'scenes_app'), os.path.join(OUT, 'scenes'))
    for d in ('amb', 'audio', 'data', 'img', 'narr', 'pano', 'extra'):
        src = os.path.join(DOCS, d)
        if os.path.isdir(src):
            shutil.copytree(src, os.path.join(OUT, d))
    n = 0
    for f in glob.glob(os.path.join(DOCS, 'packs', '*', '*_t.jpg')):
        rel = os.path.relpath(f, DOCS)
        dst = os.path.join(OUT, rel)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(f, dst)
        n += 1
    total = sum(os.path.getsize(os.path.join(a, f)) for a, _, fs in os.walk(OUT) for f in fs)
    print(f'www: {total / 1e6:.1f} MB, {n} pack thumbnails')


if __name__ == '__main__':
    main()
