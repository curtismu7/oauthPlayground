#!/usr/bin/env python3
import re
with open('A-Migration/STANDARDIZATION_HANDOFF.md', encoding='utf-8') as f:
    lines = f.readlines()
print('Total lines:', len(lines))
max_blank = 0
cur = 0
for l in lines:
    if l.strip() == '':
        cur += 1
        max_blank = max(max_blank, cur)
    else:
        cur = 0
print('Max consecutive blanks:', max_blank)
# Find bare ``` markers (MD040)
in_fence = False
bare_opens = []
for i, l in enumerate(lines):
    stripped = l.strip()
    if re.match(r'^```', stripped):
        if not in_fence:
            if stripped == '```':
                bare_opens.append(i + 1)
            in_fence = True
        else:
            in_fence = False
print('Bare ``` openings (MD040 violations):', len(bare_opens), bare_opens[:10])
