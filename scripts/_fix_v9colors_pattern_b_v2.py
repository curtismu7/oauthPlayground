#!/usr/bin/env python3
"""
Fix Pattern B V9_COLORS corruption: injected 'import { V9_COLORS } from path;'
line inside another import block.

Approach: simply remove the injected line. If V9_COLORS is used as a real 
JS value (interpolated in template literals or used as object), add proper 
standalone import. Otherwise just drop it.
"""
import os
import re

BASE = '/Users/cmuir/P1Import-apps/oauth-playground'

# Pattern B: inline injection of V9_COLORS import inside another import block
# Matches: any "import {..." block that has V9_COLORS line injected inside it
# We look for: <existing import line(s)>\nimport { V9_COLORS } from 'path';
INJECTED = re.compile(r'^import \{ V9_COLORS \} from ([^\n]+);\n', re.MULTILINE)

def is_v9_used_as_value(src_without_imports):
    """Return True if V9_COLORS is used as actual JS, not just inside strings."""
    # Remove string literals to avoid false positives
    stripped = re.sub(r"'[^']*'|\"[^\"]*\"|`[^`]*`", '""', src_without_imports)
    return bool(re.search(r'\bV9_COLORS\b', stripped))

def is_corrupted(src):
    """Check if this file has the V9_COLORS injection corruption."""
    for m in INJECTED.finditer(src):
        pos = m.start()
        # The line before must start with "import {" pattern (open import block)
        # Check the previous non-empty characters leading up to this
        before = src[:pos]
        # Find the last line before this match
        last_line = before.rstrip('\n').rsplit('\n', 1)[-1] if '\n' in before.rstrip('\n') else before.rstrip('\n')
        # It's corrupted if the previous line opens an import block
        if last_line.rstrip() == 'import {' or (last_line.rstrip().endswith(',') and 'import' in last_line):
            return True
        # Also corrupted if it appears at start of file with just "import {"
        if before.strip() == 'import {':
            return True
    return False

corrupted_files = []
for root, dirs, files in os.walk(os.path.join(BASE, 'src')):
    dirs[:] = [d for d in dirs if d != 'node_modules']
    for fname in files:
        if not fname.endswith(('.ts', '.tsx')):
            continue
        fp = os.path.join(root, fname)
        with open(fp) as f:
            src = f.read()
        if INJECTED.search(src) and is_corrupted(src):
            corrupted_files.append(fp)

print(f'Found {len(corrupted_files)} corrupted files:')
for fp in corrupted_files:
    print(f'  {fp.replace(BASE+"/", "")}')

print()
fixed = 0
for fp in corrupted_files:
    with open(fp) as f:
        src = f.read()
    
    # Collect paths from all injected imports before removing
    paths = []
    for m in INJECTED.finditer(src):
        paths.append(m.group(1))
    
    # Remove all injected V9_COLORS lines
    new_src = INJECTED.sub('', src)
    
    # Check if V9_COLORS is actually used as real JS value
    used = is_v9_used_as_value(new_src)
    
    if used and paths:
        path = paths[0]
        # Add a proper standalone import after existing import lines
        # Find the end of the import block at top of file
        lines = new_src.split('\n')
        insert_at = 0
        for i, line in enumerate(lines):
            if line.startswith('import ') or line.startswith('} from '):
                insert_at = i + 1
            elif line and not line.startswith('import') and not line.startswith('}') and insert_at > 0:
                break
        lines.insert(insert_at, f'import {{ V9_COLORS }} from {path};')
        new_src = '\n'.join(lines)
        action = f'FIXED + kept V9_COLORS import'
    else:
        action = 'FIXED (dropped unused V9_COLORS)'
    
    with open(fp, 'w') as f:
        f.write(new_src)
    
    rel = fp.replace(BASE + '/', '')
    print(f'{action}: {rel}')
    fixed += 1

print(f'\nFixed {fixed} files.')
