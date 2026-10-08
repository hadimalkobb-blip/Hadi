#!/usr/bin/env python3
"""Narration for the bedtime and Friday stories: Piper (voice ar_JO-kareem, the app's narrator), sentence by sentence,
with captions, then checked by speech recognition so a mispronounced sentence is caught before it ships.
The narrator tells and explains; verses are never synthesized (they play in a reciter's voice).
    python3 content/narrate.py PIPER_MODEL.onnx  → docs/extra/narr2/*.mp3 + build/data/prn.json"""
import json, os, re, subprocess, sys, tempfile, wave, difflib
B = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(os.path.dirname(os.path.dirname(B)), 'docs', 'extra', 'narr2')
MODEL = sys.argv[1]
sys.path.insert(0, os.path.dirname(MODEL)); sys.path.insert(0, '/home/claude/work/piper')
prd = json.load(open(os.path.join(B, 'data', 'prd.json'), encoding='utf-8'))
os.makedirs(OUT, exist_ok=True)
old = {}
pf = os.path.join(B, 'data', 'prn.json')
if os.path.exists(pf): old = json.load(open(pf, encoding='utf-8'))

def sentences(t):
    parts = re.split(r'(?<=[.!؟?])\s+', t.strip())
    return [p for p in parts if p]

def tts(text, path, ls):
    subprocess.run([sys.executable, '-m', 'piper', '-m', MODEL, '-f', path, '--length-scale', str(ls)], input=text.encode(), capture_output=True, check=True)

def norm(t):
    t = re.sub(r'[ً-ْٰ«»"\'.,،:؛!؟?()\-]', '', t)
    for a, b in (('أ', 'ا'), ('إ', 'ا'), ('آ', 'ا'), ('ى', 'ي'), ('ة', 'ه'), ('ﷺ', '')):
        t = t.replace(a, b)
    return re.sub(r'\s+', ' ', t).strip()

from asr import asr
out, report = {}, []
jobs = [(s['id'], s, 1.12) for s in prd['stories']] + [('f-' + s['id'], s, 1.04) for s in prd['friday']]
for sid, story, ls in jobs:
    for i, part in enumerate(story['parts']):
        if 'n' not in part: continue
        key = f'{sid}-{i}'
        text = part['n'].replace('ﷺ', 'صلى الله عليه وسلم')
        mp3 = os.path.join(OUT, key + '.mp3')
        if key in old and old[key].get('t') == part['n'] and os.path.exists(mp3):
            out[key] = old[key]; continue
        caps, wavs, t = [], [], 0.25
        with tempfile.TemporaryDirectory() as td:
            for k, sen in enumerate(sentences(text)):
                w = os.path.join(td, f'{k}.wav'); tts(sen, w, ls)
                with wave.open(w) as f: d = f.getnframes() / f.getframerate()
                caps.append([round(t, 2), round(t + d, 2), sentences(part['n'])[k] if k < len(sentences(part['n'])) else sen]); t += d + .5; wavs.append(w)
            lst = os.path.join(td, 'l.txt')
            sil = os.path.join(td, 's.wav')
            subprocess.run(['ffmpeg', '-v', 'error', '-f', 'lavfi', '-i', 'anullsrc=r=22050:cl=mono', '-t', '0.5', sil], check=True)
            lead = os.path.join(td, 'lead.wav'); subprocess.run(['ffmpeg', '-v', 'error', '-f', 'lavfi', '-i', 'anullsrc=r=22050:cl=mono', '-t', '0.25', lead], check=True)
            with open(lst, 'w') as f:
                f.write(f"file '{lead}'\n")
                for k, w in enumerate(wavs):
                    f.write(f"file '{w}'\n")
                    if k < len(wavs) - 1: f.write(f"file '{sil}'\n")
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-ac', '1', '-ar', '24000', '-b:a', '48k', mp3], check=True)
        heard = asr(mp3)
        sim = difflib.SequenceMatcher(None, norm(text), norm(heard)).ratio()
        report.append((key, round(sim, 2), heard))
        out[key] = dict(t=part['n'], dur=round(t - .5 + .25, 2), caps=caps, sim=round(sim, 2))
        print(f'{key}: {sim:.2f}', flush=True)
json.dump(out, open(pf, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
low = [r for r in report if r[1] < .86]
print(len(out), 'parts;', len(low), 'below 0.86')
for k, s, h in low: print('  LOW', k, s, '|', h)
