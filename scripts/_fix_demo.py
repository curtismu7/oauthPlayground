import re

path = 'src/components/EnhancedSecurityFeaturesDemo.tsx'
with open(path, 'r') as f:
    content = f.read()

# Delete dead styled components (all have _prefix, are never used in JSX)
dead_components = [
    '_Section',
    '_SectionHeader',
    '_SectionContent',
    '_ParameterGrid',
    '_ParamLabel',
    '_ParamValue',
    '_CollapsibleHeader',
    '_CollapsibleTitle',
    '_CollapsibleContent',
    '_ActionRow',
    '_List',
]

for comp in dead_components:
    # Match: \nconst _Xxx = styled.xxx`...`;\n
    pattern = r'\nconst ' + re.escape(comp) + r' = styled\.[^\`]+`[^`]*`;\n'
    before = len(content)
    content = re.sub(pattern, '\n', content, flags=re.DOTALL)
    removed = before - len(content)
    print(f"Removed {comp}: {removed} chars")

# Delete dead useState pairs (both elements unused)
dead_states = [
    '\tconst [_validationResults, _setValidationResults] = useState<string | null>(null);\n',
    '\tconst [_revokeResults, _setRevokeResults] = useState<string | null>(null);\n',
    '\tconst [_collapsedSecurityReport, _setCollapsedSecurityReport] = useState(false);\n',
    '\tconst [_collapsedSecurityTest, _setCollapsedSecurityTest] = useState(false);\n',
    '\tconst [_sessionResults, _setSessionResults] = useState<string | null>(null);\n',
]

for line in dead_states:
    if line in content:
        content = content.replace(line, '')
        print(f"Removed: {line.strip()[:60]}")
    else:
        print(f"NOT FOUND: {line.strip()[:60]}")

with open(path, 'w') as f:
    f.write(content)
print("Done")
