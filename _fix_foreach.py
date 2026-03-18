"""Fix useIterableCallbackReturn: forEach callbacks must not return values.
Fix: convert arrow functions from `=> expr` to `=> { expr; }`
"""
import json
from pathlib import Path

BASE = Path('/Users/cmuir/P1Import-apps/oauth-playground')

def find_expr_end(line, start):
    """Find end index of the expression in forEach callback starting at `start`.
    Returns the index of the ')' that closes .forEach(), or -1 on failure.
    """
    depth = 0
    i = start
    while i < len(line):
        ch = line[i]
        if ch == '(':
            depth += 1
        elif ch == ')':
            if depth == 0:
                return i
            depth -= 1
        i += 1
    return -1

def fix_line(line):
    """Convert `=>  expr)` in forEach to `=> { expr; })`.
    Returns (new_line, changed: bool)
    """
    arrow = ' => '
    arrow_pos = line.find(arrow)
    if arrow_pos == -1:
        return line, False

    after_arrow = arrow_pos + len(arrow)
    rest = line[after_arrow:].lstrip()

    # Already a block arrow function — skip
    if rest.startswith('{'):
        return line, False

    expr_end = find_expr_end(line, after_arrow)
    if expr_end == -1:
        return line, False

    expr = line[after_arrow:expr_end].strip()

    # Remove outer parens like (expr) → expr  (only if outermost parens match)
    if expr.startswith('(') and expr.endswith(')'):
        inner = expr[1:-1]
        # Verify balanced: ensure removing outer parens leaves balanced expression
        depth = 0
        ok = True
        for ch in inner:
            if ch == '(':
                depth += 1
            elif ch == ')':
                depth -= 1
                if depth < 0:
                    ok = False
                    break
        if ok and depth == 0:
            expr = inner

    new_line = line[:after_arrow] + '{ ' + expr + '; }' + line[expr_end:]
    return new_line, new_line != line

# Load biome errors
with open('/tmp/biome_out.json') as f:
    data = json.load(f)

errors = [e for e in data.get('diagnostics', []) if e.get('severity') == 'error'
          and 'useIterableCallbackReturn' in e.get('category', '')]

# Group by file
from collections import defaultdict
file_lines = defaultdict(set)
for e in errors:
    loc = e.get('location', {})
    path = loc.get('path', '')
    line_num = loc.get('start', {}).get('line')
    if path and line_num:
        file_lines[path].add(line_num)

total_fixed = 0
for rel_path, line_nums in sorted(file_lines.items()):
    full_path = BASE / rel_path
    if not full_path.exists():
        print(f'  MISSING: {rel_path}')
        continue

    lines = full_path.read_text(encoding='utf-8').splitlines(keepends=True)
    changed = False
    for ln in sorted(line_nums):
        idx = ln - 1  # 0-indexed
        if idx >= len(lines):
            print(f'  OUT OF RANGE: {rel_path}:{ln}')
            continue
        new_line, did_change = fix_line(lines[idx])
        if did_change:
            print(f'  Fixed {rel_path}:{ln}')
            print(f'    Before: {lines[idx].rstrip()}')
            print(f'    After:  {new_line.rstrip()}')
            lines[idx] = new_line
            changed = True
            total_fixed += 1
        else:
            print(f'  NO CHANGE: {rel_path}:{ln}  → {lines[idx].rstrip()[:80]}')

    if changed:
        full_path.write_text(''.join(lines), encoding='utf-8')

print(f'\nTotal fixed: {total_fixed}')
