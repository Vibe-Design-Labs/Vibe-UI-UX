"""Rebuild self-hosted OFL web fonts from local, upstream TTF files. No model calls.

Optional authoring dependency: pip install fonttools brotli
Usage: python scripts/subset-fonts.py /path/to/original-fonts
See docs/FONTS.md for upstream download URLs and licenses.
"""
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont
import hashlib
import json
import sys

root = Path(__file__).resolve().parents[1]
originals = Path(sys.argv[1]).resolve()
chars = set()
for folder in ('public', 'content', 'compiler'):
    for path in (root / folder).rglob('*'):
        if path.suffix in ('.html', '.js', '.json'):
            chars.update(path.read_text(encoding='utf-8'))
for start, end in ((0x20, 0x24f), (0x2000, 0x206f), (0x2190, 0x21ff), (0x3000, 0x30ff)):
    chars.update(chr(cp) for cp in range(start, end + 1))
chars.update('自然野趣呼吸意译让感觉长出语言')
unicodes = {ord(c) for c in chars}
out = root / 'public/fonts'
out.mkdir(exist_ok=True)
specs = [
    ('MaShanZheng-Regular.ttf', 'intentkit-brush.woff2', 'IntentKit Brush'),
    ('LXGWWenKai-Regular.ttf', 'intentkit-notes.woff2', 'IntentKit Notes'),
    ('Caveat.ttf', 'intentkit-script.woff2', 'IntentKit Script'),
]
report = []
for source, target, family in specs:
    file = originals / source
    font = TTFont(file, recalcTimestamp=False)
    options = subset.Options()
    options.flavor = 'woff2'
    options.layout_features = ['*']
    options.name_IDs = ['*']
    options.name_legacy = True
    options.name_languages = ['*']
    options.recalc_timestamp = False
    sub = subset.Subsetter(options=options)
    sub.populate(unicodes=unicodes)
    sub.subset(font)
    # Modified fonts have new family names, respecting reserved upstream names.
    # Copyright/license records remain intact and full OFL files ship alongside.
    for record in font['name'].names:
        name = {1: family, 2: 'Regular', 3: family.replace(' ', '') + '-Web-1',
                4: family, 6: family.replace(' ', '') + '-Regular',
                16: family, 17: 'Regular'}.get(record.nameID)
        if name is not None:
            record.string = name.encode(record.getEncoding(), errors='replace')
    font.flavor = 'woff2'
    destination = out / target
    font.save(destination)
    report.append({'file': target, 'family': family, 'bytes': destination.stat().st_size,
                   'source_sha256': hashlib.sha256(file.read_bytes()).hexdigest(),
                   'glyphs': len(font.getBestCmap())})
(out / 'manifest.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print(json.dumps(report, indent=2))
