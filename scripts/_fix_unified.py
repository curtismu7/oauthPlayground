#!/usr/bin/env python3
import re, sys

path = 'src/v8u/components/UnifiedFlowSteps.tsx'
content = open(path).read()
orig = content

# 1. All catch bindings → catch (no binding)
content = re.sub(r'catch \(_\w+\)', 'catch', content)

# 2. useState destructures where only value is unused (setter used)
content = content.replace(
    'const [_passwordChangeUsername, setPasswordChangeUsername] = useState<string | null>(null);',
    'const [, setPasswordChangeUsername] = useState<string | null>(null);'
)
content = content.replace(
    "const [_loadingMessage, setLoadingMessage] = useState('');",
    "const [, setLoadingMessage] = useState('');"
)
content = content.replace(
    'const [_isFetchingUserInfo, setIsFetchingUserInfo] = useState(false);',
    'const [, setIsFetchingUserInfo] = useState(false);'
)

# 3. Delete fully-unused useState pairs (both elements unused)
for line in [
    '\tconst [_isRestartingFlow, _setIsRestartingFlow] = useState(false);\n',
    '\tconst [_isIntrospectingToken, _setIsIntrospectingToken] = useState(false);\n',
    '\tconst [_isRefreshingToken, _setIsRefreshingToken] = useState(false);\n',
    '\tconst [_isPollingDeviceCode, _setIsPollingDeviceCode] = useState(false);\n',
]:
    # Try tab-indented variants (the file uses tabs)
    content = content.replace(line, '')

# 4. Delete unused _backendUrl block (4 lines)
content = re.sub(
    r'\t+const _backendUrl =\n\t+process\.env\.NODE_ENV === .production.\n\t+\? .https://oauth-playground\.vercel\.app.\n\t+: .https://localhost:3002.;\n',
    '',
    content
)

# 5. eslint-disable for appConfig: _appConfig in props destructure
content = content.replace(
    '\tappConfig: _appConfig, // Unused but kept for API compatibility',
    '\t// eslint-disable-next-line @typescript-eslint/no-unused-vars\n\tappConfig: _appConfig, // Unused but kept for API compatibility'
)

# 6. eslint-disable for codeVerifier: _codeVerifier / codeChallenge: _codeChallenge destructure-to-omit
content = re.sub(
    r'(\t+)(codeVerifier: _codeVerifier,)',
    r'\1// eslint-disable-next-line @typescript-eslint/no-unused-vars\n\1\2',
    content
)
content = re.sub(
    r'(\t+)(codeChallenge: _codeChallenge,)',
    r'\1// eslint-disable-next-line @typescript-eslint/no-unused-vars\n\1\2',
    content
)

if content == orig:
    print('WARNING: no changes made!')
    sys.exit(1)

open(path, 'w').write(content)
print('Done — changes written.')
