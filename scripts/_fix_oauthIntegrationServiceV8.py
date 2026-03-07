"""Fix oauthIntegrationServiceV8.ts: replace 'as any' with typed alternatives."""
import re

path = '/Users/cmuir/P1Import-apps/oauth-playground/src/v8/services/oauthIntegrationServiceV8.ts'
with open(path) as f:
    src = f.read()
original = src

# 1. Add a PasswordChangeError interface after the MODULE_TAG line
INTERFACE = """
/**
 * Extended Error type for password change requirements.
 */
interface PasswordChangeError extends Error {
	code?: string;
	requiresPasswordChange?: boolean;
	userId?: string | null;
	errorData?: unknown;
	accessToken?: string;
	tokens?: unknown;
}

"""
src = src.replace(
    "\nconst MODULE_TAG = '[🔐 OAUTH-INTEGRATION-V8]';\n",
    "\nconst MODULE_TAG = '[🔐 OAUTH-INTEGRATION-V8]';\n" + INTERFACE
)

# 2. Fix L204: (jarRequestParams as any).login_hint -> (jarRequestParams as Record<string, unknown>)
src = src.replace(
    '(jarRequestParams as any).login_hint',
    '(jarRequestParams as Record<string, unknown>).login_hint'
)

# 3. Fix all passwordChangeError as any casts -> as PasswordChangeError
# Pattern: `const passwordChangeError = new Error(...);` then `(passwordChangeError as any).xxx = ...`
# Replace the new Error cast in each block. There are 3 blocks total.

# Block at L635 (ROPC password change)
src = src.replace(
    '\t\t\t\tconst passwordChangeError = new Error(\'MUST_CHANGE_PASSWORD\');\n\t\t\t\t(passwordChangeError as any).code = \'MUST_CHANGE_PASSWORD\';\n\t\t\t\t(passwordChangeError as any).requiresPasswordChange = true;\n\t\t\t\t(passwordChangeError as any).userId = errorData.user_id || errorData.userId;\n\t\t\t\t(passwordChangeError as any).errorData = errorData;\n\t\t\t\tthrow passwordChangeError;',
    '\t\t\t\tconst passwordChangeError = new Error(\'MUST_CHANGE_PASSWORD\') as PasswordChangeError;\n\t\t\t\tpasswordChangeError.code = \'MUST_CHANGE_PASSWORD\';\n\t\t\t\tpasswordChangeError.requiresPasswordChange = true;\n\t\t\t\tpasswordChangeError.userId = (errorData.user_id || errorData.userId) as string | null;\n\t\t\t\tpasswordChangeError.errorData = errorData;\n\t\t\t\tthrow passwordChangeError;'
)

# Block at L898 (ID token password_state check)
src = src.replace(
    '\t\t\t\t\t\tconst passwordChangeError = new Error(\'MUST_CHANGE_PASSWORD\');\n\t\t\t\t\t\t(passwordChangeError as any).code = \'MUST_CHANGE_PASSWORD\';\n\t\t\t\t\t\t(passwordChangeError as any).requiresPasswordChange = true;\n\t\t\t\t\t\t(passwordChangeError as any).userId = payload.sub || payload.user_id;\n\t\t\t\t\t\t(passwordChangeError as any).accessToken = tokens.access_token; // Store access token for password change API call\n\t\t\t\t\t\t(passwordChangeError as any).tokens = tokens; // Store tokens for after password change\n\t\t\t\t\t\tthrow passwordChangeError;',
    '\t\t\t\t\t\tconst passwordChangeError = new Error(\'MUST_CHANGE_PASSWORD\') as PasswordChangeError;\n\t\t\t\t\t\tpasswordChangeError.code = \'MUST_CHANGE_PASSWORD\';\n\t\t\t\t\t\tpasswordChangeError.requiresPasswordChange = true;\n\t\t\t\t\t\tpasswordChangeError.userId = payload.sub || payload.user_id;\n\t\t\t\t\t\tpasswordChangeError.accessToken = tokens.access_token; // Store access token for password change API call\n\t\t\t\t\t\tpasswordChangeError.tokens = tokens; // Store tokens for after password change\n\t\t\t\t\t\tthrow passwordChangeError;'
)

# Block at L911 (catch block fallback)
src = src.replace(
    '\t\t\t\t\tconst passwordChangeError = new Error(\'MUST_CHANGE_PASSWORD\');\n\t\t\t\t\t(passwordChangeError as any).code = \'MUST_CHANGE_PASSWORD\';\n\t\t\t\t\t(passwordChangeError as any).requiresPasswordChange = true;\n\t\t\t\t\t(passwordChangeError as any).userId = (responseData as Record<string, unknown>).user_id;\n\t\t\t\t\t(passwordChangeError as any).accessToken = tokens.access_token;\n\t\t\t\t\t(passwordChangeError as any).tokens = tokens;\n\t\t\t\t\tthrow passwordChangeError;',
    '\t\t\t\t\tconst passwordChangeError = new Error(\'MUST_CHANGE_PASSWORD\') as PasswordChangeError;\n\t\t\t\t\tpasswordChangeError.code = \'MUST_CHANGE_PASSWORD\';\n\t\t\t\t\tpasswordChangeError.requiresPasswordChange = true;\n\t\t\t\t\tpasswordChangeError.userId = (responseData as Record<string, unknown>).user_id as string;\n\t\t\t\t\tpasswordChangeError.accessToken = tokens.access_token;\n\t\t\t\t\tpasswordChangeError.tokens = tokens;\n\t\t\t\t\tthrow passwordChangeError;'
)

# 4. Remove unused _parseError catch variable
src = src.replace('} catch (_parseError) {', '} catch {')

assert src != original, 'No changes made'
# Verify no 'as any' remain
remaining = src.count(' as any')
print(f'Remaining "as any": {remaining}')
with open(path, 'w') as f:
    f.write(src)
print('Done')
