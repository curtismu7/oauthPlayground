#!/usr/bin/env python3
import re

with open('/Users/cmuir/P1Import-apps/oauth-playground/src/v8/flows/MFAConfigurationPageV8.tsx') as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    if re.search(r'\bsetIsSaving\b', line) and 'PingOne' not in line:
        print(f'setIsSaving L{i}: {line.rstrip()[:100]}')

print('---')
for i, line in enumerate(lines, 1):
    if re.search(r'\bsetHasChanges\b', line):
        print(f'setHasChanges L{i}: {line.rstrip()[:100]}')
