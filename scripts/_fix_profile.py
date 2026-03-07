#!/usr/bin/env python3
import re, sys

path = 'src/pages/PingOneUserProfile.tsx'
content = open(path).read()
orig = content

# 1. Delete _isAffirmativeStatus function (top-level, lines ~131-144)
content = re.sub(
    r'\nconst _isAffirmativeStatus = \(status: string\): boolean => \{[\s\S]*?\};\n',
    '\n',
    content
)

# 2. Fix useState pairs where only state var unused
content = re.sub(
    r"([ \t]*)const \[_activeTab, setActiveTab\] = useState<[^>]+>\(\n\s*'profile'\n\s*\);",
    r"\1const [, setActiveTab] = useState<'profile' | 'user-status' | 'compare-access'>('profile');",
    content
)
content = content.replace(
    "const [_showServerErrorModal, setShowServerErrorModal] = useState(false);",
    "const [, setShowServerErrorModal] = useState(false);"
)
content = re.sub(
    r"([ \t]*)const \[_savedWorkerCredentials, setSavedWorkerCredentials\] = useState\(\(\) =>\n\s+credentialManager\.getAllCredentials\(\)\n\s+\);",
    r"\1const [, setSavedWorkerCredentials] = useState(() =>\n            credentialManager.getAllCredentials()\n    );",
    content
)
content = content.replace(
    "const [_isComparisonLoading, setIsComparisonLoading] = useState(false);",
    "const [, setIsComparisonLoading] = useState(false);"
)
content = content.replace(
    "const [_comparisonError, setComparisonError] = useState<string | null>(null);",
    "const [, setComparisonError] = useState<string | null>(null);"
)

# 3. Delete _handleStartOver useCallback (with comment above)
content = re.sub(
    r'[ \t]*// Start over function[^\n]*\n[ \t]*const _handleStartOver = useCallback\(\(\) => \{[\s\S]*?\}, \[\]\);\n',
    '',
    content
)

# 4. Delete _handleLoadComparisonUser useCallback
content = re.sub(
    r'[ \t]*const _handleLoadComparisonUser = useCallback\(async \(\) => \{[\s\S]*?\}, \[[^\]]*\]\);\n',
    '',
    content
)

# 5. Delete _handleClearComparison useCallback (with comment)
content = re.sub(
    r'[ \t]*const _handleClearComparison = useCallback\(\(\) => \{[\s\S]*?\}, \[\]\);\n',
    '',
    content
)

# 6. Delete _copyToClipboard function
content = re.sub(
    r'[ \t]*const _copyToClipboard = \(text: string\) => \{[\s\S]*?\};\n\n',
    '\n',
    content
)

# 7. Delete _getInitials function (calls itself recursively, safe to delete)
content = re.sub(
    r'[ \t]*const _getInitials = \(nameInput: unknown\): string => \{[\s\S]*?\};\n\n',
    '\n',
    content
)

# 8. Delete _formatDate function
content = re.sub(
    r'[ \t]*const _formatDate = \(dateString: string\) => \{[\s\S]*?\};\n\n',
    '\n',
    content
)

# 9. Delete the 3-line _workerTokenStatus derived vars block
content = re.sub(
    r'[ \t]*// Worker token state derived from global hook\n[ \t]*const hasValidWorkerToken[^\n]+\n[ \t]*const _workerTokenStatusVariant[\s\S]*?'
    r'const _workerTokenStatusDetail = \'\';\n',
    "    const hasValidWorkerToken = globalTokenStatus.isValid && !!globalTokenStatus.token;\n",
    content
)

# 10. Delete inline vars _givenNameValue through _emailVerified (lines ~1909-1915)
content = re.sub(
    r'[ \t]*const _givenNameValue =\n[\s\S]*?\)?;\n[ \t]*const _formattedNameValue[^\n]+\n[ \t]*const _email[^\n]+\n[ \t]*const _emailVerified[^\n]+\n',
    '',
    content
)

# 11. Delete _comparisonUserName IIFE
content = re.sub(
    r'[ \t]*const _comparisonUserName = \(\(\) => \{[\s\S]*?\}\)\(\);\n',
    '',
    content
)

# 12. Delete _allGroupNames, _allAuthMethods, _allConsentLabels
content = re.sub(
    r'[ \t]*const _allGroupNames = Array\.from\([^;]+\);\n',
    '',
    content
)
content = re.sub(
    r'[ \t]*const _allAuthMethods = Array\.from\([\s\S]*?\);\n',
    '',
    content
)
content = re.sub(
    r'[ \t]*const _allConsentLabels = Array\.from\([\s\S]*?\);\n',
    '',
    content
)

# 13. Delete _comparisonSummaryRows array
content = re.sub(
    r'[ \t]*const _comparisonSummaryRows = \[[\s\S]*?\];\n',
    '',
    content
)

if content == orig:
    print('WARNING: no changes made!')
    sys.exit(1)

open(path, 'w').write(content)
print('Done')
