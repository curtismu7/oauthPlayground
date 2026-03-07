import re

path = 'src/components/CompleteMFAFlowV7.tsx'
with open(path, 'r') as f:
    content = f.read()

original_len = len(content)

# Fix 1: Props destructuring - add eslint-disable-next-line for each flagged prop
content = content.replace(
    '\t\trequireMFA: _requireMFA = true,',
    '\t\t// eslint-disable-next-line @typescript-eslint/no-unused-vars\n\t\trequireMFA: _requireMFA = true,'
)
content = content.replace(
    '\t\tonFlowComplete: _onFlowComplete,',
    '\t\t// eslint-disable-next-line @typescript-eslint/no-unused-vars\n\t\tonFlowComplete: _onFlowComplete,'
)
content = content.replace(
    '\t\tonFlowError: _onFlowError,',
    '\t\t// eslint-disable-next-line @typescript-eslint/no-unused-vars\n\t\tonFlowError: _onFlowError,'
)
content = content.replace(
    '\t\tshowNetworkStatus: _showNetworkStatus = true,',
    '\t\t// eslint-disable-next-line @typescript-eslint/no-unused-vars\n\t\tshowNetworkStatus: _showNetworkStatus = true,'
)

# Fix 2: useState value→[, setter]
content = content.replace(
    '\tconst [_isSaving, setIsSaving] = useState(false);',
    '\tconst [, setIsSaving] = useState(false);'
)
content = content.replace(
    '\tconst [_hasUnsavedChanges, setHasUnsavedChanges] = useState(false);',
    '\tconst [, setHasUnsavedChanges] = useState(false);'
)

# Fix 3: Delete hasUnsavedAuthCodeChanges useState + void expression
content = content.replace(
    '\tconst [hasUnsavedAuthCodeChanges, setHasUnsavedAuthCodeChanges] = useState(false);\n',
    ''
)
content = content.replace(
    '\tvoid hasUnsavedAuthCodeChanges;\n',
    ''
)

# Fix 4: Delete _showPassword useState
content = content.replace(
    '\tconst [_showPassword, _setShowPassword] = useState(false);\n',
    ''
)

# Fix 5: Delete _handleSaveAuthCodeCredentials block (comment + function)
pattern = r'\n\t// Save Authorization Code credentials using credential manager\n\tconst _handleSaveAuthCodeCredentials = useCallback\(async \(\) => \{.*?\}, \[authCodeCredentials\]\);'
before = len(content)
content = re.sub(pattern, '', content, flags=re.DOTALL)
print(f"Block _handleSaveAuthCodeCredentials: removed {before - len(content)} chars")

# Fix 6: Delete _handleSaveCredentials block (comment + function)
pattern = r'\n\t// Legacy save function for backward compatibility \(username/password\)\n\tconst _handleSaveCredentials = useCallback\(async \(\) => \{.*?\}, \[credentials\]\);'
before = len(content)
content = re.sub(pattern, '', content, flags=re.DOTALL)
print(f"Block _handleSaveCredentials: removed {before - len(content)} chars")

# Fix 7: Delete _handleWorkerTokenCredentialsChange block (with preceding comments)
pattern = r'\n\t// Handle credential changes and track unsaved changes\n\t// Worker Token Credentials Handlers\n\tconst _handleWorkerTokenCredentialsChange = useCallback\(.*?\t\);'
before = len(content)
content = re.sub(pattern, '', content, flags=re.DOTALL)
print(f"Block _handleWorkerTokenCredentialsChange: removed {before - len(content)} chars")

# Fix 8: Delete Authorization Code Credentials Handlers block (comment + all auth code handlers)
# From the comment through the final _handleAuthCodeTokenEndpointAuthMethodChange
pattern = r'\n\t// Authorization Code Credentials Handlers\n\tconst _handleAuthCodeEnvironmentIdChange.*?_handleAuthCodeTokenEndpointAuthMethodChange = useCallback\(.*?\t\);'
before = len(content)
content = re.sub(pattern, '', content, flags=re.DOTALL)
print(f"Block AuthCode handlers: removed {before - len(content)} chars")

# Fix 9: Delete legacy handlers section (comment + 4 handlers)
pattern = r'\n\t// Legacy handlers for backward compatibility \(will be removed\)\n\tconst _handleEnvironmentIdChange.*?_handleRedirectUriChange = useCallback\(.*?\}, \[\]\);'
before = len(content)
content = re.sub(pattern, '', content, flags=re.DOTALL)
print(f"Block legacy handlers: removed {before - len(content)} chars")

# Fix 10: Delete _handleRestart block
content = content.replace(
    '\n\tconst _handleRestart = useCallback(() => {\n\t\thandleResetFlow();\n\t}, [handleResetFlow]);',
    ''
)

print(f"Total chars removed: {original_len - len(content)}")

with open(path, 'w') as f:
    f.write(content)

print("Done")
