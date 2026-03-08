#!/usr/bin/env python3
"""
Scan all .ts/.tsx files for V9_COLORS import corruption.

Two known corruption patterns:
Pattern A (old): The V9_COLORS import was expanded inline:
    import {
    import
    {
        V9_COLORS;
    }
    from;
    ('path');
    (already fixed by _fix_v9colors_corruption.py)

Pattern B (new): V9_COLORS standalone import was injected INSIDE another import block:
    import {
    import { V9_COLORS } from '../services/v9/V9ColorStandards';
        DEFAULT_CONFIG,
    ...
    } from '...'

This script detects and fixes Pattern B.
"""
import os
import re

BASE = '/Users/cmuir/P1Import-apps/oauth-playground'

# Pattern B: "import {\n" immediately followed by "import { V9_COLORS } from 'path';\n"
PATTERN_B = re.compile(
    r'(import \{[^\n]*\n)'            # opening: "import {\n" or "import someDefault, {\n"
    r'import \{ V9_COLORS \} from ([^\n]+);\n',  # injected V9_COLORS line
    re.MULTILINE
)

corrupted = []
for root, dirs, files in os.walk(os.path.join(BASE, 'src')):
    # Skip locked and test dirs (we only fix sidebar-reachable files)
    dirs[:] = [d for d in dirs if d not in ('node_modules',)]
    for fname in files:
        if not fname.endswith(('.ts', '.tsx')):
            continue
        fp = os.path.join(root, fname)
        with open(fp) as f:
            src = f.read()
        if PATTERN_B.search(src):
            rel = fp.replace(BASE + '/', '')
            corrupted.append((fp, rel))

print(f'Found {len(corrupted)} corrupted files:')
for fp, rel in corrupted:
    print(f'  {rel}')

print()

# Fix them
fixed = 0
for fp, rel in corrupted:
    with open(fp) as f:
        src = f.read()

    # The fix: remove just the injected "import { V9_COLORS } from ...;\n" line
    # but keep the outer "import {" open (it still needs its content below)
    # Check if V9_COLORS is actually used as a value in the file
    v9_path = None
    def replacer(m):
        global v9_path
        v9_path = m.group(2)  # capture the path
        return m.group(1)  # keep opening "import {", drop V9_COLORS line

    new_src = PATTERN_B.sub(replacer, src)

    # Now check if V9_COLORS is used as a JS value anywhere else in the file
    # (strip quoted strings to avoid false positives)
    stripped = re.sub(r"'[^']*'|\"[^\"]*\"|`[^`]*`", '""', new_src)
    used = bool(re.search(r'\bV9_COLORS\b', stripped))

    if used and v9_path:
        # Need to add it back as a proper standalone import
        # Insert after the last import line at top
        new_src = re.sub(
            r'^((?:import [^\n]+\n)*)',
            lambda m: m.group(1) + f'import {{ V9_COLORS }} from {v9_path};\n',
            new_src,
            count=1,
            flags=re.MULTILINE
        )
        print(f'FIXED + re-added V9_COLORS: {rel}')
    else:
        print(f'FIXED (dropped unused V9_COLORS): {rel}')

    with open(fp, 'w') as f:
        f.write(new_src)
    fixed += 1

print(f'\nFixed {fixed} files.')
