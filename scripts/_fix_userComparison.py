#!/usr/bin/env python3
"""Fix userComparisonService.tsx:
 1. Remove 13 dead `_` styled components (lines 39-152)
 2. Fix any -> unknown in UserState, ComparisonResult, and all utility fns
 3. Drop unused `title` from UserComparisonDisplay destructuring
"""
import re

path = '/Users/cmuir/P1Import-apps/oauth-playground/src/services/userComparisonService.tsx'

with open(path, 'r', encoding='utf-8') as f:
    src = f.read()

# ── 1. Remove the block of dead styled components ─────────────────────────────
# They start after the ComparisonResult interface and end before compareUserStates()
DEAD_BLOCK_START = '\nconst _ComparisonContainer = styled.div`'
DEAD_BLOCK_END = '`;\n\n/**\n * Compare two user states'

start_idx = src.index(DEAD_BLOCK_START)
end_idx   = src.index(DEAD_BLOCK_END) + len('`;\n')   # keep the \n before the jsdoc

src = src[:start_idx] + '\n' + src[end_idx:]

# ── 2. Fix UserState index signature ─────────────────────────────────────────
src = src.replace('\t[key: string]: any;\n}', '\t[key: string]: unknown;\n}', 1)

# ── 3. Fix ComparisonResult field types ────────────────────────────────────────
src = src.replace('\tbefore: any;\n\tafter: any;\n\tchanged: boolean;',
                  '\tbefore: unknown;\n\tafter: unknown;\n\tchanged: boolean;', 1)

# ── 4. Fix getNestedValue ──────────────────────────────────────────────────────
OLD_GET = (
    'function getNestedValue(obj: any, path: string): any {\n'
    '\treturn path.split(\'.\').reduce((current, key) => current?.[key], obj);\n'
    '}'
)
NEW_GET = (
    'function getNestedValue(obj: Record<string, unknown>, path: string): unknown {\n'
    '\treturn path.split(\'.\').reduce<unknown>((current, key) => {\n'
    '\t\tif (current !== null && typeof current === \'object\') {\n'
    '\t\t\treturn (current as Record<string, unknown>)[key];\n'
    '\t\t}\n'
    '\t\treturn undefined;\n'
    '\t}, obj);\n'
    '}'
)
assert OLD_GET in src, 'getNestedValue not found'
src = src.replace(OLD_GET, NEW_GET, 1)

# ── 5. Fix isEqual ─────────────────────────────────────────────────────────────
OLD_IS = 'function isEqual(a: any, b: any): boolean {'
NEW_IS = 'function isEqual(a: unknown, b: unknown): boolean {'
assert OLD_IS in src, 'isEqual not found'
src = src.replace(OLD_IS, NEW_IS, 1)

# ── 6. Fix formatValue ────────────────────────────────────────────────────────
OLD_FMT = 'function formatValue(value: any): string {'
NEW_FMT = 'function formatValue(value: unknown): string {'
assert OLD_FMT in src, 'formatValue not found'
src = src.replace(OLD_FMT, NEW_FMT, 1)

# ── 7. Fix isCriticalPasswordChange ──────────────────────────────────────────
OLD_CRIT = 'function isCriticalPasswordChange(field: string, value: any): boolean {'
NEW_CRIT = 'function isCriticalPasswordChange(field: string, value: unknown): boolean {'
assert OLD_CRIT in src, 'isCriticalPasswordChange not found'
src = src.replace(OLD_CRIT, NEW_CRIT, 1)

# ── 8. Remove unused `title` from UserComparisonDisplay destructuring ─────────
OLD_DEST = '}> = ({ before, after, title, operationName }) => {'
NEW_DEST = '}> = ({ before, after, operationName }) => {'
assert OLD_DEST in src, 'UserComparisonDisplay destructuring not found'
src = src.replace(OLD_DEST, NEW_DEST, 1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(src)

print('Done. Patched userComparisonService.tsx')
