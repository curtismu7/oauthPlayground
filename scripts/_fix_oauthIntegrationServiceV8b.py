"""Fix oauthIntegrationServiceV8.ts: replace remaining 'as any' with typed casts."""
path = '/Users/cmuir/P1Import-apps/oauth-playground/src/v8/services/oauthIntegrationServiceV8.ts'
with open(path) as f:
    src = f.read()
original = src

T5 = '\t\t\t\t\t'  # 5 tabs
T6 = '\t\t\t\t\t\t'  # 6 tabs
T7 = '\t\t\t\t\t\t\t'  # 7 tabs

# Block 1 (5-tab indent)
OLD1 = (
    T5 + "const passwordChangeError = new Error('MUST_CHANGE_PASSWORD');\n"
    + T5 + "(passwordChangeError as any).code = 'MUST_CHANGE_PASSWORD';\n"
    + T5 + "(passwordChangeError as any).requiresPasswordChange = true;\n"
    + T5 + "(passwordChangeError as any).userId = errorData.user_id || errorData.userId;\n"
    + T5 + "(passwordChangeError as any).errorData = errorData;\n"
    + T5 + "throw passwordChangeError;"
)
NEW1 = (
    T5 + "const passwordChangeError = new Error('MUST_CHANGE_PASSWORD') as PasswordChangeError;\n"
    + T5 + "passwordChangeError.code = 'MUST_CHANGE_PASSWORD';\n"
    + T5 + "passwordChangeError.requiresPasswordChange = true;\n"
    + T5 + "passwordChangeError.userId = (errorData.user_id || errorData.userId) as string;\n"
    + T5 + "passwordChangeError.errorData = errorData;\n"
    + T5 + "throw passwordChangeError;"
)
assert OLD1 in src, f'Block 1 not found'
src = src.replace(OLD1, NEW1)

# Block 2 (7-tab indent)
OLD2 = (
    T7 + "const passwordChangeError = new Error('MUST_CHANGE_PASSWORD');\n"
    + T7 + "(passwordChangeError as any).code = 'MUST_CHANGE_PASSWORD';\n"
    + T7 + "(passwordChangeError as any).requiresPasswordChange = true;\n"
    + T7 + "(passwordChangeError as any).userId = payload.sub || payload.user_id;\n"
    + T7 + "(passwordChangeError as any).accessToken = tokens.access_token; // Store access token for password change API call\n"
    + T7 + "(passwordChangeError as any).tokens = tokens; // Store tokens for after password change\n"
    + T7 + "throw passwordChangeError;"
)
NEW2 = (
    T7 + "const passwordChangeError = new Error('MUST_CHANGE_PASSWORD') as PasswordChangeError;\n"
    + T7 + "passwordChangeError.code = 'MUST_CHANGE_PASSWORD';\n"
    + T7 + "passwordChangeError.requiresPasswordChange = true;\n"
    + T7 + "passwordChangeError.userId = payload.sub || payload.user_id;\n"
    + T7 + "passwordChangeError.accessToken = tokens.access_token; // Store access token for password change API call\n"
    + T7 + "passwordChangeError.tokens = tokens; // Store tokens for after password change\n"
    + T7 + "throw passwordChangeError;"
)
assert OLD2 in src, f'Block 2 not found'
src = src.replace(OLD2, NEW2)

# Block 3 (6-tab indent)
OLD3 = (
    T6 + "const passwordChangeError = new Error('MUST_CHANGE_PASSWORD');\n"
    + T6 + "(passwordChangeError as any).code = 'MUST_CHANGE_PASSWORD';\n"
    + T6 + "(passwordChangeError as any).requiresPasswordChange = true;\n"
    + T6 + "(passwordChangeError as any).userId = (responseData as Record<string, unknown>).user_id;\n"
    + T6 + "(passwordChangeError as any).accessToken = tokens.access_token;\n"
    + T6 + "(passwordChangeError as any).tokens = tokens;\n"
    + T6 + "throw passwordChangeError;"
)
NEW3 = (
    T6 + "const passwordChangeError = new Error('MUST_CHANGE_PASSWORD') as PasswordChangeError;\n"
    + T6 + "passwordChangeError.code = 'MUST_CHANGE_PASSWORD';\n"
    + T6 + "passwordChangeError.requiresPasswordChange = true;\n"
    + T6 + "passwordChangeError.userId = (responseData as Record<string, unknown>).user_id as string;\n"
    + T6 + "passwordChangeError.accessToken = tokens.access_token;\n"
    + T6 + "passwordChangeError.tokens = tokens;\n"
    + T6 + "throw passwordChangeError;"
)
assert OLD3 in src, f'Block 3 not found'
src = src.replace(OLD3, NEW3)

assert src != original
remaining = src.count(' as any')
print(f'Remaining "as any": {remaining}')
with open(path, 'w') as f:
    f.write(src)
print('Done')
