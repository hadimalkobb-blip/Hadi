#!/usr/bin/env python3
"""Exact Quran text for content files: Tanzil Uthmani 1.1 (vendor/tanzil-uthmani.txt, CC BY 3.0, verbatim only).
fix_quotes(text) finds every ﴿…﴾ (السورة رقم) in a text, checks that the words are really there, contiguous,
and replaces them with the exact characters of the Tanzil text (mark order included)."""
import os, re, unicodedata

B = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
T = {}
for line in open(os.path.join(B, 'vendor', 'tanzil-uthmani.txt'), encoding='utf-8'):
    p = line.rstrip('\n').split('|')
    if len(p) == 3 and p[0].isdigit():
        T[(int(p[0]), int(p[1]))] = p[2]

NAMES = ('الفاتحة البقرة آل_عمران النساء المائدة الأنعام الأعراف الأنفال التوبة يونس هود يوسف الرعد إبراهيم الحجر النحل الإسراء الكهف مريم طه '
         'الأنبياء الحج المؤمنون النور الفرقان الشعراء النمل القصص العنكبوت الروم لقمان السجدة الأحزاب سبأ فاطر يس الصافات ص الزمر غافر '
         'فصلت الشورى الزخرف الدخان الجاثية الأحقاف محمد الفتح الحجرات ق الذاريات الطور النجم القمر الرحمن الواقعة الحديد المجادلة الحشر الممتحنة '
         'الصف الجمعة المنافقون التغابن الطلاق التحريم الملك القلم الحاقة المعارج نوح الجن المزمل المدثر القيامة الإنسان المرسلات النبأ النازعات عبس '
         'التكوير الانفطار المطففين الانشقاق البروج الطارق الأعلى الغاشية الفجر البلد الشمس الليل الضحى الشرح التين العلق القدر البينة الزلزلة العاديات '
         'القارعة التكاثر العصر الهمزة الفيل قريش الماعون الكوثر الكافرون النصر المسد الإخلاص الفلق الناس').split()
SURA = {n.replace('_', ' '): i + 1 for i, n in enumerate(NAMES)}
SURA_NAME = {v: k for k, v in SURA.items()}
AR = str.maketrans('٠١٢٣٤٥٦٧٨٩', '0123456789')


def norm(t):
    out, cl = [], []
    for ch in t:
        if unicodedata.combining(ch) or ch in 'ٰٓٔ':
            cl.append(ch)
        else:
            out.extend(sorted(cl)); cl = []; out.append(ch)
    out.extend(sorted(cl))
    return ''.join(out)


LETTER_MAP = {'ٱ': 'ا', 'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ى': 'ي', 'ئ': 'ي', 'ؤ': 'و', 'ة': 'ه'}


def skel(word):
    """the bare letters of a word (no marks, no tatweel, no small Quranic signs), alef/yaa forms unified"""
    out = []
    for ch in word:
        if '\u0621' <= ch <= '\u064a' or ch == '\u0671':
            out.append(LETTER_MAP.get(ch, ch))
    return ''.join(out)


def exact(frag, s, a):
    """the exact Tanzil characters for a run of whole words of verse s:a (raises if those words are not there).
    Matching is by bare letters, so the marks in `frag` never matter: what is returned is always Tanzil's own text."""
    v = T[(s, a)]
    vw = v.split(' ')
    fw = [skel(w) for w in frag.strip().split() if skel(w)]
    vs = [skel(w) for w in vw]
    for i in range(len(vw)):
        j, k = i, 0
        while j < len(vw) and k < len(fw):
            if not vs[j]:          # a pause sign or ۞ between words
                j += 1; continue
            if vs[j] != fw[k]:
                break
            j += 1; k += 1
        if k == len(fw) and vs[i]:
            return ' '.join(vw[i:j])
    raise ValueError(f'not in {s}:{a}: {frag!r}\n  verse: {v}')


def verse(s, a):
    return T[(s, a)]


QUOTE = re.compile(r'﴿([^﴾]+)﴾\s*\(([^)٠-٩0-9]+?)\s*([٠-٩0-9]+)(?:\s*[–-]\s*([٠-٩0-9]+))?\)')


def fix_quotes(text, where=''):
    def rep(m):
        frag, name, a1, a2 = m.group(1), m.group(2).strip(), int(m.group(3).translate(AR)), m.group(4)
        s = SURA.get(name)
        if not s:
            raise ValueError(f'unknown surah {name!r} in {where}')
        ayas = [a1] if not a2 else list(range(a1, int(a2.translate(AR)) + 1))
        for a in ayas:
            try:
                return m.group(0).replace(frag, exact(frag, s, a), 1)
            except ValueError:
                pass
        raise ValueError(f'{where}: ﴿{frag}﴾ not found in {name} {ayas}')
    return QUOTE.sub(rep, text)


def fix_all(obj, where=''):
    if isinstance(obj, str):
        return fix_quotes(obj, where)
    if isinstance(obj, list):
        return [fix_all(x, where) for x in obj]
    if isinstance(obj, dict):
        return {k: fix_all(v, where + '.' + str(k)) for k, v in obj.items()}
    return obj
