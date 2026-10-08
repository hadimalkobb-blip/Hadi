#!/usr/bin/env python3
"""Builds «رحلة الضحى» into one HTML page.

    python3 build/build.py            -> site/index.html   (local tests and the Claude page)
    python3 build/build.py web OUT    -> OUT               (GitHub Pages: PWA tags, every pack file beside the page)
    python3 build/build.py app OUT    -> OUT               (Android: local fonts, pack thumbnails inside the app)

The page is: shell + style.css + vendor.js (qrcode, jsQR, three.js) + the modules in ORDER,
with the data files injected into content.js (__QD__, __MEDIA__, __PACKS__, __GOLDD__).
"""
import json, os, re, sys

P = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = os.path.join(P, 'build')

ORDER = ['icons', 'content', 'deep', 'scenes', 'core', 'media', 'heart', 'day', 'life', 'people', 'polish',
         'gold', 'gold2', 'gold3', 'gold4', 'gold5', 'views', 'runner', 'games',
         'tajweed', 'gold6', 'brain', 'prophets', 'games2', 'v50', 'main']
# data injected into a module as __NAME__ (file build/data/<name>.json); content.js holds the original four
EXTRA_DATA = {'tajweed': ['TJD'], 'prophets': ['PRD', 'PRN']}

FONTS_WEB = ('<link rel="preconnect" href="https://fonts.googleapis.com">\n'
             '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
             '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Scheherazade+New:wght@400;700'
             '&family=Aref+Ruqaa:wght@400;700&family=Readex+Pro:wght@300;400;500;600;700&display=swap">\n')
FONTS_APP = '<link rel="stylesheet" href="fonts/fonts.css">\n'
PWA = ('<meta name="theme-color" content="#080c1d">\n'
       '<meta property="og:title" content="رحلة الضحى">\n'
       '<meta property="og:description" content="{desc}">\n'
       '<meta property="og:type" content="website">\n'
       '<meta name="apple-mobile-web-app-capable" content="yes">\n'
       '<meta name="mobile-web-app-capable" content="yes">\n'
       '<meta name="apple-mobile-web-app-title" content="الضحى">\n'
       '<link rel="manifest" href="manifest.webmanifest">\n'
       '<link rel="icon" href="icon-192.png" type="image/png">\n'
       '<link rel="apple-touch-icon" href="icon-180.png">\n')
OG_DESC = 'احفظ سورة الضحى بمتعة: مصحفك المذهّب، ١٧ قارئًا، مشهد حقيقي لكل آية، وأكثر من ٢٥ لعبة.'
BASE_STYLE = ('<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}'
              'body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>\n')


def read(p):
    with open(p, encoding='utf-8') as f:
        return f.read()


def data_js(name):
    d = json.load(open(os.path.join(S, 'data', name.lower() + '.json'), encoding='utf-8'))
    if name == 'PACKS':
        for p in d:
            p['b'] = 1
    return json.dumps(d, ensure_ascii=False, separators=(',', ':'))


def main_js(flags):
    parts = []
    for m in ORDER:
        f = os.path.join(S, 'src', m + '.js')
        if not os.path.exists(f):
            continue
        t = read(f)
        if m == 'content':
            for k in ('QD', 'MEDIA', 'PACKS', 'GOLDD'):
                t = t.replace(f'__{k}__', data_js(k), 1)
        for k in EXTRA_DATA.get(m, []):
            t = t.replace(f'__{k}__', data_js(k), 1)
        if m == 'gold5':
            for k, v in flags.items():
                t, n = re.subn(rf'^const {k} = (true|false);', f'const {k} = {"true" if v else "false"};', t, count=1, flags=re.M)
                assert n == 1, k
        parts.append(t.rstrip('\n') + '\n')
    return '\n'.join(parts)


def page(kind='site'):
    flags = {'PACKS_BUNDLED': kind == 'web', 'PACKS_THUMBS': kind in ('web', 'app')}
    head = ['<!doctype html>\n<html lang="ar" dir="rtl">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n']
    if kind == 'web':
        head.append(PWA.format(desc=OG_DESC))
    head.append(BASE_STYLE)
    head.append('<title>رحلة الضحى</title>\n<meta name="description" content="لعبة تفاعلية لحفظ سورة الضحى">\n')
    head.append(FONTS_APP if kind == 'app' else FONTS_WEB)
    css = read(os.path.join(S, 'src', 'style.css'))
    for extra in ('style50.css',):
        f = os.path.join(S, 'src', extra)
        if os.path.exists(f):
            css += '\n' + read(f)
    vendor = read(os.path.join(S, 'vendor', 'vendor.js'))
    out = ''.join(head)
    out += '<style>\n' + css.rstrip('\n') + '\n\n</style>\n</head>\n<body>\n<div id="skybg"></div>\n<div id="app" dir="rtl" lang="ar"></div>\n'
    out += '<script>\n' + vendor.rstrip('\n') + '\n\n</script>\n'
    out += '<script>\n' + main_js(flags) + '\n</script>\n</body>\n</html>\n'
    return out


if __name__ == '__main__':
    kind = sys.argv[1] if len(sys.argv) > 1 else 'site'
    dest = sys.argv[2] if len(sys.argv) > 2 else os.path.join(P, 'site', 'index.html')
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    html = page(kind)
    open(dest, 'w', encoding='utf-8').write(html)
    print(f'{kind}: {dest} ({len(html.encode()) / 1e6:.2f} MB)')
