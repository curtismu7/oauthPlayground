import re

path = 'src/pages/flows/v9/ImplicitFlowV9.tsx'
with open(path, 'r') as f:
    content = f.read()

original_len = len(content)

# Remove unused icons from @icons import block
for icon in ['FiAlertTriangle', 'FiCheckCircle', 'FiCode', 'FiExternalLink', 'FiGlobe']:
    content = content.replace(f'\t{icon},\n', '')

# Remove useMemo from react import
content = content.replace(
    "import { useCallback, useEffect, useMemo, useState } from 'react';",
    "import { useCallback, useEffect, useState } from 'react';"
)

# Delete unused import lines
for imp in [
    "import ColoredUrlDisplay from '../../../components/ColoredUrlDisplay';\n",
    "import { LearningTooltip } from '../../../components/LearningTooltip';\n",
    "import SecurityFeaturesDemo from '../../../components/SecurityFeaturesDemo';\n",
    "import { useCredentialBackup } from '../../../hooks/useCredentialBackup';\n",
    "import { CopyButtonService } from '../../../services/copyButtonService';\n",
    "import { UnifiedTokenDisplayService } from '../../../services/unifiedTokenDisplayService';\n",
]:
    if imp in content:
        content = content.replace(imp, '')
        print(f"Removed import: {imp[:60]}")
    else:
        print(f"NOT FOUND: {imp[:60]}")

# Delete FlowCompletionConfigs + FlowCompletionService import block
block = "import {\n\tFlowCompletionConfigs,\n\tFlowCompletionService,\n} from '../../../services/flowCompletionService';\n"
if block in content:
    content = content.replace(block, '')
    print("Removed FlowCompletion imports")
else:
    print("NOT FOUND: FlowCompletion imports")

# Remove more unused elements from FlowUIService destructuring
for name in ['StepHeader', 'VersionBadge', 'StepHeaderTitle', 'StepNumber',
             'InfoList', 'ActionRow', 'Button', 'HighlightedActionButton', 'CodeBlock',
             'SectionDivider', 'ResultsSection', 'ResultsHeading', 'HelperText', 'HighlightBadge']:
    content = content.replace(f'\t{name},\n', '')

# Delete maskToken function (comment + function)
block = (
    "/**\n"
    " * Utility function to mask tokens for security\n"
    " * Shows first 8 characters, masks middle, shows last 4 characters\n"
    " */\n"
    "const maskToken = (token: string): string => {\n"
    "\tif (!token || token.length <= 12) {\n"
    "\t\treturn '\u00b7\u00b7\u00b7\u00b7\u00b7\u00b7\u00b7\u00b7';\n"
    "\t}\n"
    "\treturn `${token.slice(0, 8)}...${token.slice(-4)}`;\n"
    "};\n"
    "\n"
)
if block in content:
    content = content.replace(block, '')
    print("Removed maskToken")
else:
    # Try without unicode
    pattern = r'/\*\*\n \* Utility function to mask tokens for security\n.*?const maskToken = .*?\};\n\n'
    before = len(content)
    content = re.sub(pattern, '', content, flags=re.DOTALL)
    if before != len(content):
        print(f"Removed maskToken via regex: {before - len(content)} chars")
    else:
        print("NOT FOUND: maskToken")

# Delete VariantSelector styled component block (with comment)
block = "// Styled components\n"
if block in content:
    # Delete from "// Styled components\n" through VariantDescription closing
    pattern = r'// Styled components\nconst VariantSelector.*?const VariantDescription = styled\.div`.*?`;\n\n'
    before = len(content)
    content = re.sub(pattern, '', content, flags=re.DOTALL)
    print(f"Removed VariantSelector block: {before - len(content)} chars")
else:
    print("NOT FOUND: VariantSelector block")

# Delete handleVariantChange useCallback
pattern = r'\n\tconst handleVariantChange = useCallback\(.*?\n\t\);\n'
before = len(content)
content = re.sub(pattern, '\n', content, count=1, flags=re.DOTALL)
print(f"Removed handleVariantChange: {before - len(content)} chars")

# Delete renderStep0 useCallback (it's large - ends with \t]); and is before return()
pattern = r'\n\tconst renderStep0 = useCallback\(\(\) => \{.*?\n\t\]\);\n'
before = len(content)
content = re.sub(pattern, '\n', content, count=1, flags=re.DOTALL)
print(f"Removed renderStep0: {before - len(content)} chars")

print(f"\nTotal chars removed from cascade: {original_len - len(content)}")

with open(path, 'w') as f:
    f.write(content)
print("Done")
