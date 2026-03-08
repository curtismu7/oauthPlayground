#!/usr/bin/env python3
"""Remove unused 'import { V9_COLORS } from ...' lines from src/components/"""
import re
import os

files = [
    'src/components/CompactAdvancedSecuritySettings.tsx',
    'src/components/ComprehensiveDiscoveryInput.tsx',
    'src/components/CredentialsServicesMock.tsx',
    'src/components/EnhancedApiCallDisplay.tsx',
    'src/components/FloatingStepperExample.tsx',
    'src/components/PingOneJWTTools.tsx',
    'src/components/ServiceDiscoveryBrowser.tsx',
    'src/components/TokenSecurityAnalysis.tsx',
    'src/components/WorkerTokenEducationalPanel.tsx',
    'src/components/device/DeviceVerification.tsx',
    'src/components/education/EducationModeToggle.tsx',
    'src/components/education/MasterEducationSection.tsx',
    'src/components/password-reset/tabs/ChangePasswordTab.tsx',
    'src/components/password-reset/tabs/OverviewTab.tsx',
]

PAT = re.compile(r'^import \{ V9_COLORS \} from [^\n]+\n', re.MULTILINE)

for fp in files:
    with open(fp) as f:
        src = f.read()
    new_src, n = PAT.subn('', src)
    if n:
        with open(fp, 'w') as f:
            f.write(new_src)
        print(f'Removed V9_COLORS import: {fp}')
    else:
        # V9_COLORS might be in a multi-import block; check for just unused
        if 'V9_COLORS' not in src:
            print(f'Already clean: {fp}')
        else:
            print(f'MANUAL CHECK needed: {fp}')

print('Done.')
