#!/usr/bin/env python3
"""Fix corrupted V9_COLORS import blocks across 16 component files."""
import re

files = [
    'src/components/ComprehensiveDiscoveryInput.tsx',
    'src/components/CredentialsServicesMock.tsx',
    'src/components/EnhancedApiCallDisplay.tsx',
    'src/components/ServiceDiscoveryBrowser.tsx',
    'src/components/FloatingStepperExample.tsx',
    'src/components/education/MasterEducationSection.tsx',
    'src/components/education/EducationModeToggle.tsx',
    'src/components/PingOneJWTTools.tsx',
    'src/components/password-reset/tabs/OverviewTab.tsx',
    'src/components/password-reset/tabs/ChangePasswordTab.tsx',
    'src/components/ConfigurationBackup.tsx',
    'src/components/CredentialsImportExport.tsx',
    'src/components/CompactAdvancedSecuritySettings.tsx',
    'src/components/TokenSecurityAnalysis.tsx',
    'src/components/device/DeviceVerification.tsx',
    'src/components/WorkerTokenEducationalPanel.tsx',
]

# The corruption pattern looks like:
#   import {\nimport\n{\n<ws>V9_COLORS;\n}\nfrom;\n('<path>');\n
CORRUPT_PAT = re.compile(
    r'import \{\nimport\n\{\n[ \t]+V9_COLORS;\n\}\nfrom;\n\(([^)]+)\);\n',
    re.MULTILINE
)

for fp in files:
    with open(fp) as f:
        src = f.read()
    m = CORRUPT_PAT.search(src)
    if not m:
        print(f'NO MATCH: {fp}')
        continue
    path = m.group(1)  # e.g. '../../services/v9/V9ColorStandards'
    # Check if V9_COLORS is actually used after the import block
    rest = src[m.end():]
    used = 'V9_COLORS.' in rest
    if used:
        replacement = f'import {{ V9_COLORS }} from {path};\nimport {{\n'
    else:
        replacement = 'import {\n'
    new_src = CORRUPT_PAT.sub(replacement, src, count=1)
    with open(fp, 'w') as f:
        f.write(new_src)
    status = 'KEEP V9_COLORS' if used else 'DROP V9_COLORS'
    print(f'{status}: {fp}')

print('\nDone.')
