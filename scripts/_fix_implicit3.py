import re

path = 'src/pages/flows/v9/ImplicitFlowV9.tsx'
with open(path, 'r') as f:
    content = f.read()

original_len = len(content)

# 1. Remove more unused icons
for icon in ['FiAlertCircle', 'FiChevronDown']:
    content = content.replace(f'\t{icon},\n', '')

# 2. Delete import lines
imports_to_delete = [
    "import { modernMessaging } from '@/services/v9/V9ModernMessagingService';\n",
    "import ComprehensiveCredentialsService from '../../../services/comprehensiveCredentialsService';\n",
    "import { oidcDiscoveryService } from '../../../services/oidcDiscoveryService';\n",
    "import { CompactAppPickerV8U } from '../../../v8u/components/CompactAppPickerV8U';\n",
    "import type { DiscoveredApp } from '../../../v8/components/AppPickerV8';\n",
]
for imp in imports_to_delete:
    if imp in content:
        content = content.replace(imp, '')
        print(f"Removed: {imp[:70]}")
    else:
        print(f"NOT FOUND: {imp[:70]}")

# 3. Remove OAuthErrorHandlingService from the shared import block
content = content.replace(
    "import {\n\ttype OAuthErrorDetails,\n\tOAuthErrorHandlingService,\n} from '../../../services/oauthErrorHandlingService';",
    "import {\n\ttype OAuthErrorDetails,\n} from '../../../services/oauthErrorHandlingService';"
)

# 4. Remove more FlowUIService destructuring elements
for name in ['CollapsibleSection', 'CollapsibleHeaderButton', 'CollapsibleTitle',
             'CollapsibleContent', 'InfoBox', 'InfoTitle', 'InfoText', 'StrongText',
             'GeneratedContentBox', 'GeneratedLabel', 'ParameterGrid', 'ParameterLabel',
             'ParameterValue', 'FlowDiagram', 'FlowStep', 'FlowStepNumber', 'FlowStepContent']:
    content = content.replace(f'\t{name},\n', '')

# 5. Delete CollapsibleToggleIcon styled component
pattern = r'// Local CollapsibleToggleIcon that accepts children\nconst CollapsibleToggleIcon = styled\.span.*?`;\n'
before = len(content)
content = re.sub(pattern, '', content, flags=re.DOTALL)
print(f"Removed CollapsibleToggleIcon: {before - len(content)} chars")

# 6. Fix selectedVariant useState: drop unused setter
content = content.replace(
    "const [selectedVariant, setSelectedVariant] = useState<'oauth' | 'oidc'>(getDefaultVariant());",
    "const [selectedVariant] = useState<'oauth' | 'oidc'>(getDefaultVariant());"
)

# 7. Fix workerToken useState: value unused, setter used
content = content.replace(
    "\tconst [workerToken, setWorkerToken] = useState<string>('');",
    "\tconst [, setWorkerToken] = useState<string>('');"
)

# 8. Delete handleImplicitAppSelected useCallback
pattern = r'\n\tconst handleImplicitAppSelected = useCallback\(.*?\n\t\);\n'
before = len(content)
content = re.sub(pattern, '\n', content, count=1, flags=re.DOTALL)
print(f"Removed handleImplicitAppSelected: {before - len(content)} chars")

# 9. Delete setErrorDetails useState line
content = content.replace(
    '\tconst [, setErrorDetails] = useState<OAuthErrorDetails | null>(null);\n',
    ''
)

# 10. Delete collapsedSections useState block (both elements dead after toggleSection deletion)
content = content.replace(
    '\tconst [collapsedSections, setCollapsedSections] = useState(\n'
    '\t\tImplicitFlowSharedService.CollapsibleSections.getDefaultState\n'
    '\t);\n',
    ''
)

# 11. Delete toggleSection const (2 lines + following empty lines)
content = content.replace(
    '\tconst toggleSection =\n'
    '\t\tImplicitFlowSharedService.CollapsibleSections.createToggleHandler(setCollapsedSections);\n',
    ''
)

print(f"\nTotal chars removed in pass 3: {original_len - len(content)}")

with open(path, 'w') as f:
    f.write(content)
print("Done")
