#!/usr/bin/env python3
"""Second pass fix for PingOneUserProfile - handle cascade of unused vars."""
import re, sys

path = 'src/pages/PingOneUserProfile.tsx'
content = open(path).read()
orig = content

# Fix state vars where setter IS used but value is not
content = content.replace(
    'const [populationDetails, setPopulationDetails]',
    'const [, setPopulationDetails]'
)
content = content.replace(
    'const [comparisonPopulationDetails, setComparisonPopulationDetails]',
    'const [, setComparisonPopulationDetails]'
)

# Delete comparisonGroups useState line (both value and setter unused)
content = re.sub(
    r'[ \t]*const \[comparisonGroups\] = useState<PingOneUserGroup\[\]>\(\[\]\);\n',
    '',
    content
)

# Delete enabledStatusText (single ternary)
content = re.sub(
    r'[ \t]*const enabledStatusText =\n[ \t]*[^\n]+\n',
    '',
    content
)

# Delete authenticationMethodsDisplay (single line)
content = re.sub(
    r'[ \t]*const authenticationMethodsDisplay = [^\n]+\n',
    '',
    content
)

# Delete the entire determineMfaStatus local function + its calls
content = re.sub(
    r'[ \t]*// Determine MFA status[^\n]*\n[ \t]*const determineMfaStatus = \([\s\S]*?\};\n\n',
    '',
    content
)

# Delete mfaStatusResult and primaryConsentMap (both single lines)
content = re.sub(r'[ \t]*const mfaStatusResult = [^\n]+\n', '', content)
content = re.sub(r'[ \t]*const primaryConsentMap = [^\n]+\n', '', content)

# Delete comparisonEnabledStatusText (multiline ternary)
content = re.sub(
    r'[ \t]*const comparisonEnabledStatusText =\n[\s\S]*?;\n',
    '',
    content,
    count=1
)

# Delete comparisonAuthMethodsDisplay, comparisonMfaResult, comparisonConsentMap
content = re.sub(r'[ \t]*const comparisonAuthMethodsDisplay = [^\n]+\n', '', content)
content = re.sub(r'[ \t]*const comparisonMfaResult = [^\n]+\n', '', content)
content = re.sub(r'[ \t]*const comparisonConsentMap = [^\n]+\n', '', content)

# Delete comparisonLoaded
content = re.sub(r'[ \t]*const comparisonLoaded = [^\n]+\n', '', content)

if content == orig:
    print('WARNING: no changes made!')
    sys.exit(1)

open(path, 'w').write(content)
print('Done')
