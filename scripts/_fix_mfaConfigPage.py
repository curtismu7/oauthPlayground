#!/usr/bin/env python3
"""
Fix MFAConfigurationPageV8.tsx:
1. Change [_hasChanges, setHasChanges] → [, setHasChanges] (setter used in active code)
2. Delete const [_isSaving, setIsSaving] entirely (setter only used in dead _handleSave)
3. Delete const [_isRefreshingToken, ...] entirely (setter only used in dead function)
4. Change [_deviceAuthPolicies, setDeviceAuthPolicies] → [, setDeviceAuthPolicies]
5. Change [_isLoadingPolicies, setIsLoadingPolicies] → [, setIsLoadingPolicies]
6. Change [_isLoadingPolicy, setIsLoadingPolicy] → [, setIsLoadingPolicy]
7. Change [_newPolicyName, setNewPolicyName] → [, setNewPolicyName]
8. Change [_newPolicyDescription, setNewPolicyDescription] → [, setNewPolicyDescription]
9. Delete _handleSave, _handleReset, _handleManualWorkerTokenRefresh, _handleExport, _handleImport
"""
import re

path = '/Users/cmuir/P1Import-apps/oauth-playground/src/v8/flows/MFAConfigurationPageV8.tsx'

with open(path, 'r', encoding='utf-8') as f:
    src = f.read()

# 1. useState blanking — read value unused, setter used in active code
replacements = [
    ('\tconst [_hasChanges, setHasChanges] = useState(false);\n',
     '\tconst [, setHasChanges] = useState(false);\n'),
    ('\tconst [_deviceAuthPolicies, setDeviceAuthPolicies] = useState<DeviceAuthenticationPolicy[]>([]);\n',
     '\tconst [, setDeviceAuthPolicies] = useState<DeviceAuthenticationPolicy[]>([]);\n'),
    ('\tconst [_isLoadingPolicies, setIsLoadingPolicies] = useState(false);\n',
     '\tconst [, setIsLoadingPolicies] = useState(false);\n'),
    ('\tconst [_isLoadingPolicy, setIsLoadingPolicy] = useState(false);\n',
     '\tconst [, setIsLoadingPolicy] = useState(false);\n'),
    ('\tconst [_newPolicyName, setNewPolicyName] = useState(\'\');\n',
     '\tconst [, setNewPolicyName] = useState(\'\');\n'),
    ('\tconst [_newPolicyDescription, setNewPolicyDescription] = useState(\'\');\n',
     '\tconst [, setNewPolicyDescription] = useState(\'\');\n'),
]

for old, new in replacements:
    assert old in src, f'Not found: {old[:60]}'
    src = src.replace(old, new, 1)

# 2. Delete entire lines for useState where setter is ONLY used in dead functions
for dead_line in [
    '\tconst [_isSaving, setIsSaving] = useState(false);\n',
    '\tconst [_isRefreshingToken, setIsRefreshingToken] = useState(false);\n',
]:
    assert dead_line in src, f'Not found: {dead_line[:60]}'
    src = src.replace(dead_line, '', 1)

# 3. Delete the 5 dead handler functions
# Each ends with `\t};\n` — use regex to capture the full function body
dead_funcs = [
    r'\n\tconst _handleSave = \(\) => \{.*?\n\t\};\n',
    r'\n\tconst _handleReset = async \(\) => \{.*?\n\t\};\n',
    r'\n\tconst _handleManualWorkerTokenRefresh = async \(\) => \{.*?\n\t\};\n',
    r'\n\tconst _handleExport = \(\) => \{.*?\n\t\};\n',
    r'\n\tconst _handleImport = \(\) => \{.*?\n\t\};\n',
]

for pattern in dead_funcs:
    old_len = len(src)
    src = re.sub(pattern, '\n', src, count=1, flags=re.DOTALL)
    assert len(src) < old_len, f'Function not removed: {pattern[:50]}'

with open(path, 'w', encoding='utf-8') as f:
    f.write(src)

print('Done MFAConfigurationPageV8.tsx')
