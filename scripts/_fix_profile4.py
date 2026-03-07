#!/usr/bin/env python3
import re, sys

path = 'src/pages/PingOneUserProfile.tsx'
content = open(path).read()
orig = content

# 1. Delete collectAuthMethods function (top-level, line ~108)
content = re.sub(
    r'\nconst collectAuthMethods = [\s\S]*?\};\n',
    '\n',
    content,
    count=1
)

# 2. Delete buildConsentMap function (top-level, line ~120)
content = re.sub(
    r'\nconst buildConsentMap = [\s\S]*?\};\n',
    '\n',
    content,
    count=1
)

# 3. mfaStatus and userConsents: keep state but remove value (setter IS used)
content = re.sub(
    r'\bconst \[mfaStatus, setMfaStatus\]',
    'const [, setMfaStatus]',
    content
)
content = re.sub(
    r'\bconst \[userConsents, setUserConsents\]',
    'const [, setUserConsents]',
    content
)

# 4. Delete comparisonMfaStatus and comparisonConsents useState lines (both elements unused)
content = re.sub(
    r'[ \t]*const \[comparisonMfaStatus\][^\n]+\n',
    '',
    content
)
content = re.sub(
    r'[ \t]*const \[comparisonConsents\][^\n]+\n',
    '',
    content
)

if content == orig:
    print('WARNING: no changes made!')
    sys.exit(1)

open(path, 'w').write(content)
print('Done')
