#!/usr/bin/env python3
"""Fix PingOneUserProfile.tsx no-unused-vars warnings.
Uses line-number + brace-tracking to find exact extent of each statement.
"""
import re, sys

path = 'src/pages/PingOneUserProfile.tsx'
lines = open(path).readlines()
orig_content = ''.join(lines)

def find_stmt_end(start_line_0based, open_char, close_char):
    """Find the line index where a block statement ends (0-based). Returns last line index."""
    depth = 0
    started = False
    for i in range(start_line_0based, len(lines)):
        depth += lines[i].count(open_char) - lines[i].count(close_char)
        if depth > 0:
            started = True
        if started and depth <= 0:
            return i
    return start_line_0based

def delete_lines(to_delete: set):
    global lines
    lines = [l for i, l in enumerate(lines) if i not in to_delete]

def delete_stmt_from(line_1based, also_preceding_empty=True, also_preceding_comment=False):
    """Delete statement starting at line_1based (1-based). Returns set of 0-based indices to delete."""
    start = line_1based - 1
    # Find the end by tracking multiple possible delimiters
    end = start
    content = ''.join(lines[start:])
    # Try to find end of statement including multi-line expressions
    depth_braces = 0
    depth_parens = 0
    depth_brackets = 0
    started = False
    for i in range(start, len(lines)):
        l = lines[i]
        depth_braces += l.count('{') - l.count('}')
        depth_parens += l.count('(') - l.count(')')
        depth_brackets += l.count('[') - l.count(']')
        if depth_braces > 0 or depth_parens > 0 or depth_brackets > 0:
            started = True
        if started and depth_braces <= 0 and depth_parens <= 0 and depth_brackets <= 0:
            end = i
            break
        if not started and l.rstrip().endswith(';'):
            end = i
            break
    to_delete = set(range(start, end + 1))
    # Also delete blank line immediately after
    if end + 1 < len(lines) and lines[end + 1].strip() == '':
        to_delete.add(end + 1)
    # Also delete preceding comment lines
    if also_preceding_comment:
        c = start - 1
        while c >= 0 and (lines[c].strip().startswith('//') or lines[c].strip() == ''):
            if lines[c].strip().startswith('//'):
                to_delete.add(c)
            c -= 1
    return to_delete

to_delete = set()

# ============================================================
# 1. State declarations - delete/fix (lines 658, 697-705)
# ============================================================

# Line 658: const [, setActiveTab] = useState<...> - BOTH unused, delete entire line
for i, l in enumerate(lines):
    if ', setActiveTab]' in l:
        to_delete.update(delete_stmt_from(i+1))
        break

# Lines 697-698: compareIdentifier / comparisonResolvedId (both elements unused, delete)
for i, l in enumerate(lines):
    if 'compareIdentifier, setCompareIdentifier' in l:
        to_delete.update(delete_stmt_from(i+1))
        break
for i, l in enumerate(lines):
    if 'comparisonResolvedId, setComparisonResolvedId' in l:
        to_delete.update(delete_stmt_from(i+1))
        break

# Line 701: comparisonRoles, setComparisonRoles - both unused, delete
for i, l in enumerate(lines):
    if 'comparisonRoles, setComparisonRoles' in l:
        to_delete.update(delete_stmt_from(i+1))
        break

# Lines 704-705: [, setIsComparisonLoading] / [, setComparisonError] - delete
for i, l in enumerate(lines):
    if ', setIsComparisonLoading]' in l:
        to_delete.update(delete_stmt_from(i+1))
        break
for i, l in enumerate(lines):
    if ', setComparisonError]' in l:
        to_delete.update(delete_stmt_from(i+1))
        break

# Fix: remove setter only (keep value) for comparisonProfile, comparisonGroups, comparisonMfaStatus, comparisonConsents
# These are handled by string replacement below, not deletion

# ============================================================
# 2. Render-time derived vars (lines ~1645-1902)
# ============================================================

render_vars = [
    'userName',               # IIFE
    'getPopulationName',      # function
    'getComparisonPopulationName',  # function
    'nameDetails',            # multiline ternary
    'accountStatusText',      # single line
    'syncStatusText',         # multiline
    'identityProfileName',    # IIFE
    'primaryAuthMethodText',  # expression
    'mfaStatusText',          # expression
    'consentDisplay',         # expression
    'comparisonAccountStatusText',
    'comparisonSyncStatusText',
    'comparisonIdentityProfileName',
    'comparisonPrimaryAuthMethodText',
    'comparisonMfaText',
    'comparisonConsentDisplay',
    'primaryGroupNames',      # .map().filter().map()
    'comparisonGroupNames',
    'primaryUsername',
    'comparisonUsername',
]

for var in render_vars:
    for i, l in enumerate(lines):
        if f'const {var} ' in l or f'const {var}=' in l:
            to_delete.update(delete_stmt_from(i+1, also_preceding_comment=True))
            break

# Apply deletions
delete_lines(to_delete)

# ============================================================
# 3. String replacements for setter-only removals
# ============================================================
content = ''.join(lines)

# setComparisonProfile unused, comparisonProfile used
content = re.sub(
    r'const \[comparisonProfile, setComparisonProfile\]',
    'const [comparisonProfile]',
    content
)
# setComparisonGroups unused, comparisonGroups used
content = re.sub(
    r'const \[comparisonGroups, setComparisonGroups\]',
    'const [comparisonGroups]',
    content
)
# setComparisonMfaStatus unused, comparisonMfaStatus used
content = re.sub(
    r'const \[comparisonMfaStatus, setComparisonMfaStatus\]',
    'const [comparisonMfaStatus]',
    content
)
# setComparisonConsents unused, comparisonConsents used
content = re.sub(
    r'const \[comparisonConsents, setComparisonConsents\]',
    'const [comparisonConsents]',
    content
)

if content == orig_content:
    print('WARNING: no changes made!')
    sys.exit(1)

open(path, 'w').write(content)
print('Done')
