import re

path = 'src/pages/flows/v9/ImplicitFlowV9.tsx'
with open(path, 'r') as f:
    content = f.read()

original_len = len(content)

# 1. Delete unused imports
content = content.replace(
    "import EnhancedFlowInfoCard from '../../../components/EnhancedFlowInfoCard';\n",
    ''
)
content = content.replace(
    "import OAuthErrorDisplay from '../../../components/OAuthErrorDisplay';\n",
    ''
)

# 2. Remove unused elements from FlowUIService destructuring
for name in ['MainCard', 'StepHeaderLeft', 'StepHeaderSubtitle', 'StepHeaderRight', 'StepTotal', 'StepContentWrapper']:
    content = content.replace(f'\t{name},\n', '')

# 3a. Delete DynamicStepHeader + DynamicStepHeaderTitle + DynamicStepNumber block + leading comment
block = (
    "// Local styled components with dynamic colors\n"
    "const DynamicStepHeader = styled(StepHeader)<{ $variant: 'oauth' | 'oidc' }>`\n"
    "\tbackground: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);\n"
    "\tcolor: #ffffff;\n"
    "`;\n"
    "\n"
    "// Ensure title and number are white on dark background\n"
    "const DynamicStepHeaderTitle = styled(StepHeaderTitle)`\n"
    "\tcolor: #ffffff;\n"
    "`;\n"
    "\n"
    "const DynamicStepNumber = styled(StepNumber)`\n"
    "\tcolor: #ffffff;\n"
    "`;\n"
    "\n"
)
if block in content:
    content = content.replace(block, '')
    print("Removed DynamicStepHeader + Title + Number block")
else:
    print("NOT FOUND: DynamicStepHeader block")

# 3b. Delete DynamicVersionBadge
block = (
    "const DynamicVersionBadge = styled(VersionBadge)<{ $variant: 'oauth' | 'oidc' }>`\n"
    "\tbackground: rgba(59, 130, 246, 0.2);\n"
    "\tborder: 1px solid #60a5fa;\n"
    "\tcolor: #dbeafe;\n"
    "`;\n"
    "\n"
)
if block in content:
    content = content.replace(block, '')
    print("Removed DynamicVersionBadge")
else:
    print("NOT FOUND: DynamicVersionBadge block")

# 4. Fix errorDetails useState: value unused, setter used
content = content.replace(
    '\tconst [errorDetails, setErrorDetails] = useState<OAuthErrorDetails | null>(null);',
    '\tconst [, setErrorDetails] = useState<OAuthErrorDetails | null>(null);'
)

# 5. Fix catch (_error) at line 382 context (3-tab indent)
content = content.replace(
    '\t\t\t} catch (_error) {\n'
    '\t\t\t\t// Fallback to legacy method on error\n',
    '\t\t\t} catch {\n'
    '\t\t\t\t// Fallback to legacy method on error\n'
)

# 6. Delete useCredentialBackup block (clearBackup: _clearBackup is the only destructured value)
block = (
    '\t// Use credential backup hook for automatic backup and restoration\n'
    '\tconst { clearBackup: _clearBackup } = useCredentialBackup({\n'
    "\t\tflowKey: 'implicit-v9',\n"
    '\t\tcredentials: controller.credentials,\n'
    '\t\tsetCredentials: controller.setCredentials,\n'
    '\t\tenabled: true,\n'
    '\t});\n'
)
if block in content:
    content = content.replace(block, '')
    print("Removed useCredentialBackup block")
else:
    print("NOT FOUND: useCredentialBackup block")

# 7. Delete renderVariantSelector function
pattern = r'\n\tconst renderVariantSelector = \(\) => \(\n.*?\n\t\);\n'
before = len(content)
content = re.sub(pattern, '\n', content, flags=re.DOTALL)
print(f"Removed renderVariantSelector: {before - len(content)} chars")

# 8. Fix .catch((_err: unknown) => line
content = content.replace(
    '\t\t\t\t\t\t\t.catch((_err: unknown) => {\n',
    '\t\t\t\t\t\t\t.catch(() => {\n'
)

# 9. Fix catch (_error) at line 1935 context (9-tab indent)
content = content.replace(
    '\t\t\t\t\t\t\t\t\t} catch (_error) {\n'
    '\t\t\t\t\t\t\t\t\t\t// Background cache clear — non-critical\n',
    '\t\t\t\t\t\t\t\t\t} catch {\n'
    '\t\t\t\t\t\t\t\t\t\t// Background cache clear — non-critical\n'
)

# 10. Delete STEP_METADATA array (search from declaration to closing ];)
pattern = r'\n\tconst STEP_METADATA = \[.*?\n\t\];\n'
before = len(content)
content = re.sub(pattern, '\n', content, flags=re.DOTALL)
print(f"Removed STEP_METADATA: {before - len(content)} chars")

# 11. Delete renderStepContent useMemo — use line-based deletion
# Read current state as lines, find and remove lines 911-1956 (0-indexed: 910-1955)
# But line numbers shifted from deletions above. Use marker-based instead.
pattern = r'\n\tconst renderStepContent = useMemo\(\(\) => \{.*?\n\t\]\);\n'
before = len(content)
content = re.sub(pattern, '\n', content, count=1, flags=re.DOTALL)
removed = before - len(content)
print(f"Removed renderStepContent: {removed} chars")

print(f"\nTotal chars removed: {original_len - len(content)}")

with open(path, 'w') as f:
    f.write(content)
print("Done")
