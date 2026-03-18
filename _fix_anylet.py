"""Fix noImplicitAnyLet: add explicit `: any` type annotation to untyped let variables."""
import json, re
from pathlib import Path

BASE = Path('/Users/cmuir/P1Import-apps/oauth-playground')

# Load biome errors
with open('/tmp/biome_out.json') as f:
    data = json.load(f)

errors = [e for e in data.get('diagnostics', []) if e.get('severity') == 'error'
          and 'noImplicitAnyLet' in e.get('category', '')]

from collections import defaultdict
file_lines = defaultdict(set)
for e in errors:
    loc = e.get('location', {})
    path = loc.get('path', '')
    line_num = loc.get('start', {}).get('line')
    if path and line_num:
        file_lines[path].add(line_num)

def fix_let_line(line):
    """Add ': any' to a `let varname;` declaration without type annotation."""
    # Match: <whitespace>let <identifier>; (no type annotation, no initializer)
    m = re.match(r'^(\s*let\s+)([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*;)', line)
    if m:
        return m.group(1) + m.group(2) + ': any' + m.group(3) + '\n', True
    # Also match: let identifier\n (with just newline, no semicolon)
    m2 = re.match(r'^(\s*let\s+)([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*\n)', line)
    if m2:
        return m2.group(1) + m2.group(2) + ': any' + m2.group(3), True
    return line, False

total_fixed = 0
for rel_path, line_nums in sorted(file_lines.items()):
    full_path = BASE / rel_path
    if not full_path.exists():
        print(f'  MISSING: {rel_path}')
        continue

    lines = full_path.read_text(encoding='utf-8').splitlines(keepends=True)
    changed = False
    for ln in sorted(line_nums):
        idx = ln - 1
        if idx >= len(lines):
            print(f'  OUT OF RANGE: {rel_path}:{ln}')
            continue
        new_line, did_change = fix_let_line(lines[idx])
        if did_change:
            print(f'  Fixed {rel_path}:{ln}: {lines[idx].rstrip()} -> {new_line.rstrip()}')
            lines[idx] = new_line
            changed = True
            total_fixed += 1
        else:
            print(f'  SKIP {rel_path}:{ln}: {lines[idx].rstrip()[:80]}')

    if changed:
        full_path.write_text(''.join(lines), encoding='utf-8')

print(f'\nTotal fixed: {total_fixed}')
