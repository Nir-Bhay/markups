"""Render real browser exports and reject blank pages in the mixed-content fixture."""
from pathlib import Path
import json
import sys
import fitz

root = Path(sys.argv[1] if len(sys.argv) > 1 else 'test-results/built-production')
output = root / 'pdf-review'
output.mkdir(parents=True, exist_ok=True)
results = []
for name in ['export-smoke.pdf', 'export-multipage.pdf']:
    files = list(root.rglob(name))
    if len(files) != 1:
        raise SystemExit(f'Expected one {name}, found {len(files)}')
    document = fitz.open(files[0])
    if name == 'export-multipage.pdf' and len(document) < 2:
        raise SystemExit('Long fixture did not paginate.')
    for index, page in enumerate(document):
        clip = fitz.Rect(30, 30, page.rect.width - 30, page.rect.height - 40)
        pixels = page.get_pixmap(colorspace=fitz.csGRAY, clip=clip)
        ink = sum(value < 180 for value in pixels.samples)
        if ink < 40:
            raise SystemExit(f'{name} page {index + 1} is blank apart from its footer.')
        page.get_pixmap(matrix=fitz.Matrix(1.2, 1.2)).save(output / f'{name[:-4]}-{index + 1}.png')
    results.append({'file': name, 'pages': len(document), 'nonblank_content': True})
(output / 'summary.json').write_text(json.dumps(results, indent=2), encoding='utf-8')
print(json.dumps(results, indent=2))
