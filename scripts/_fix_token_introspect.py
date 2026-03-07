#!/usr/bin/env python3
"""Fix type errors in TokenIntrospect.tsx."""
import re

path = 'src/components/TokenIntrospect.tsx'
with open(path, encoding='utf-8') as f:
    lines = f.readlines()

# Fix 1: CollapsibleToggleIcon lines — add ?? false
toggles = {
    488: ('\t\t\t\t\t', 'completionOverview'),
    510: ('\t\t\t\t\t', 'completionDetails'),
    536: ('\t\t\t\t\t\t', 'introspectionDetails'),
    663: ('\t\t\t\t\t\t\t\t\t\t\t\t', 'rawJson'),
    735: ('\t\t\t\t\t\t', 'userInfo'),
}
for lineno, (indent, section) in toggles.items():
    old = f'{indent}<CollapsibleToggleIcon $collapsed={{collapsedSections.{section}}}>\n'
    new = f'{indent}<CollapsibleToggleIcon $collapsed={{collapsedSections.{section} ?? false}}>\n'
    assert lines[lineno - 1] == old, f'Line {lineno} mismatch: {repr(lines[lineno-1])}'
    lines[lineno - 1] = new
    print(f'Fixed line {lineno}: {section}')

# Fix 2: Garbled HighlightedActionButton line 751
# Current: single line with onClick, $priority, disabled all jammed together with tabs
garbled_line = '\t\t\t\t\t\t\t\t\t\tonClick={onFetchUserInfo}\t\t\t\t\t\t\t\t\t$priority="primary"\t\t\t\t\t\t\t\t\t\tdisabled={!tokens?.access_token || isFetchingUserInfo}\n'
assert lines[750] == garbled_line, f'Line 751 mismatch: {repr(lines[750])}'
lines[750] = (
    '\t\t\t\t\t\t\t\t\t\tonClick={onFetchUserInfo}\n'
    '\t\t\t\t\t\t\t\t\t\t$priority="primary"\n'
    '\t\t\t\t\t\t\t\t\t\tdisabled={!tokens?.access_token || isFetchingUserInfo}\n'
)
print('Fixed line 751: garbled HighlightedActionButton props')

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done.')
