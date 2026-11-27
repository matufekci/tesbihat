#!/usr/bin/env python3
"""Import selected verses from the Diyanet Word edition; do not distribute the DOCX.

Usage: python3 scripts/import-diyanet-docx.py /path/to/kuran.docx
The document uses Shaikh Hamdullah codepoints for its marks; the app uses
Scheherazade New and therefore the corresponding Unicode encodings.
"""
import hashlib
import json
import re
import sys
from pathlib import Path
from xml.etree import ElementTree as ET
from zipfile import ZipFile

EXPECTED_SHA256 = '84a97f8455a660ee0b6559bbb8d76fc4031d341a43341183637af59f9abac8e6'
OUT = Path(__file__).resolve().parents[1] / 'src/data/diyanet-arabic.js'
SELECTION = {
    1: range(1, 8), 2: (255, 285, 286), 4: (103,), 7: (196,), 9: (129,),
    11: (56,), 17: (45, 46), 36: range(1, 84), 56: range(1, 97),
    59: range(20, 25), 67: range(1, 31), 71: range(1, 29),
    78: range(1, 41), 112: range(1, 5),
}
# Reverse of the mapping documented by alperenugus/Kuran, for a Unicode font.
# Arabic yeh is deliberately mapped to the dotless-final-yah variant used by
# the Diyanet Unicode source; the other characters encode printed marks.
HAMDULLAH = 'ي۪ۜۘۖ۟ۗ۠ۢۨ۬۫'
UNICODE =   'یٖ࣑࣒ؕؗࣕࣖࣗࣞۘࣙ'
TO_UNICODE = str.maketrans(HAMDULLAH, UNICODE)
TO_HAMDULLAH = str.maketrans(UNICODE, HAMDULLAH)
# Word represents 1:1 as a single ﷽ ligature. Use its expanded version as
# used in the previous Diyanet-derived data so it is readable with our font.
BASMALA = 'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحٖیمِ'


def clean(text):
    return re.sub(r'\s+', ' ', text.replace('ـ', '')).strip()


def main(path):
    raw = Path(path).read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    if digest != EXPECTED_SHA256:
        raise ValueError('Unexpected Word file; inspect the new edition before importing: ' + digest)
    with ZipFile(path) as doc:
        root = ET.fromstring(doc.read('word/document.xml'))
    ns = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
    paragraphs = [''.join(t.text or '' for t in p.iter(ns + 't')) for p in root.iter(ns + 'p')]
    text = ' '.join(paragraphs)
    headings = list(re.finditer(r'\ufdcd\s*﴿(\d+)﴾.*?\ufdcc', text))
    if [int(h.group(1)) for h in headings] != list(range(1, 115)):
        raise ValueError('Sura headings are incomplete or not sequential')
    out = {}
    for i, heading in enumerate(headings):
        sura = int(heading.group(1))
        chunk = text[heading.end():headings[i + 1].start() if i + 1 < len(headings) else len(text)]
        if sura != 1:
            chunk = chunk.lstrip().removeprefix('﷽')
        marks = list(re.finditer(r'﴿(\d+)﴾', chunk))
        actual = [int(m.group(1)) for m in marks]
        if actual != list(range(1, len(actual) + 1)):
            raise ValueError(f'Non-sequential verse numbering in sura {sura}')
        if sura not in SELECTION:
            continue
        wanted = set(SELECTION[sura])
        verses = {}
        start = 0
        for m in marks:
            number = int(m.group(1))
            verse = clean(chunk[start:m.start()])
            start = m.end()
            if number not in wanted:
                continue
            if sura == 1 and number == 1:
                if verse != '﷽':
                    raise ValueError('Unexpected Fatiha basmala representation')
                converted = BASMALA
            else:
                converted = verse.translate(TO_UNICODE)
                if converted.translate(TO_HAMDULLAH) != verse:
                    raise ValueError(f'Non-reversible character mapping in {sura}:{number}')
            if not converted:
                raise ValueError(f'Empty verse {sura}:{number}')
            verses[number] = converted
        if set(verses) != wanted:
            raise ValueError(f'Missing verses in sura {sura}: {wanted - set(verses)}')
        out[sura] = verses
    if len(out) != len(SELECTION) or sum(map(len, out.values())) != 302:
        raise ValueError('Selection count mismatch')
    payload = json.dumps(out, ensure_ascii=False, indent=2)
    OUT.write_text('// Diyanet Word edition, Unicode transcription; see tests/QURAN_SOURCES.md.\nexport const DIYANET_ARABIC = ' + payload + '\n', encoding='utf-8')
    print(f'Imported 302 verses from {digest}; check marks and verify on device.')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('Usage: python3 scripts/import-diyanet-docx.py /path/to/kuran.docx')
    main(sys.argv[1])
