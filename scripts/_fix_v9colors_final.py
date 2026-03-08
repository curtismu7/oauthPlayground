#!/usr/bin/env python3
"""
Final minimal fix: remove injected 'import { V9_COLORS }' line from inside
other import blocks. Since V9_COLORS is only used as CSS string literals
(not actual JS interpolation), the import can be safely dropped entirely.
"""
import re

BASE = '/Users/cmuir/P1Import-apps/oauth-playground'

files = [
    'src/pages/OIDCSessionManagement.tsx',
    'src/pages/AdvancedConfiguration.tsx',
    'src/pages/AIAgentOverview.tsx',
    'src/pages/TokenInspector.tsx',
    'src/pages/docs/PingViewOnAI.tsx',
    'src/pages/docs/ScopesBestPractices.tsx',
    'src/pages/flows/JWTBearerFlow.tsx',
]

INJECTED = re.compile(r'^import \{ V9_COLORS \} from [^\n]+;\n', re.MULTILINE)

for rel in files:
    fp = f'{BASE}/{rel}'
    with open(fp) as f:
        src = f.read()
    
    # Find all V9_COLORS import lines
    matches = list(INJECTED.finditer(src))
    if not matches:
        print(f'CLEAN: {rel}')
        continue
    
    # For each match, check if it's inside an open import block (corrupted)
    # or standalone (valid)
    new_src = src
    removed = 0
    for m in reversed(matches):  # reverse to preserve offsets
        pos = m.start()
        before = new_src[:pos]
        # Get the previous line
        prev_lines = before.rstrip('\n').split('\n')
        prev_line = prev_lines[-1] if prev_lines else ''
        # If previous line is "import {" or ends with a comma (inside block), it's corrupted
        if prev_line.rstrip() == 'import {' or prev_line.rstrip().endswith('{') or \
           (prev_line.rstrip().endswith(',') and 'import' not in prev_line):
            new_src = new_src[:pos] + new_src[m.end():]
            removed += 1
    
    if removed:
        with open(fp, 'w') as f:
            f.write(new_src)
        print(f'FIXED (removed {removed} injected line(s)): {rel}')
    else:
        print(f'OK (standalone imports only): {rel}')

print('\nDone.')
