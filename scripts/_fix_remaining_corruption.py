#!/usr/bin/env python3
"""
Fix remaining Pattern B V9_COLORS injection corruption.
Simply removes the injected standalone import line from inside import blocks.
"""
import re

BASE = '/Users/cmuir/P1Import-apps/oauth-playground'

files = [
    'src/pages/Configuration.tsx',
    'src/pages/protect-portal/ProtectPortalApp.tsx',
    'src/pages/protect-portal/components/RiskEvaluationDisplay.tsx',
    'src/pages/protect-portal/services/educationalContentService.ts',
    'src/pages/protect-portal/services/mfaAuthenticationService.ts',
    'src/pages/protect/ProtectPortalApp.tsx',
    'src/pages/protect/components/RiskEvaluationDisplay.tsx',
    'src/pages/protect/services/educationalContentService.ts',
    'src/pages/protect/services/mfaAuthenticationService.ts',
    'src/pages/flows/OAuthAuthorizationCodeFlowV7_1/hooks/useFlowStateManagement.ts',
]

INJECTED = re.compile(r'^import \{ V9_COLORS \} from [^\n]+;\n', re.MULTILINE)

for rel in files:
    fp = f'{BASE}/{rel}'
    with open(fp) as f:
        src = f.read()

    new_src = src
    removed = 0
    for m in reversed(list(INJECTED.finditer(src))):
        pos = m.start()
        before = new_src[:pos]
        prev_line = before.rstrip('\n').rsplit('\n', 1)[-1] if '\n' in before.rstrip('\n') else before.rstrip('\n')
        # Corrupted: V9_COLORS line is inside an import block (prev line opened with 'import {' or 'import type {' etc.)
        stripped = prev_line.strip()
        if (stripped.endswith('{') and 'import' in stripped) or stripped == 'import {':
            new_src = new_src[:pos] + new_src[m.end():]
            removed += 1

    if removed:
        with open(fp, 'w') as f:
            f.write(new_src)
        print(f'FIXED ({removed} removed): {rel}')
    else:
        print(f'SKIPPED (no match): {rel}')

print('\nDone.')
