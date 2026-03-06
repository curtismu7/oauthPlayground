#!/usr/bin/env python3
"""Migrate remaining Batch 1 hooks: useCredentialBackup, useGlobalWorkerToken,
useOAuth2CompliantImplicitFlow, useHybridFlow."""

import os, sys
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

LOGGER_IMPORT = "import { logger } from '../utils/logger';\n"


def add_logger_import(content):
    if "import { logger } from '../utils/logger'" in content:
        return content
    lines = content.split('\n')
    last_import = -1
    for i, line in enumerate(lines):
        if line.strip().startswith('import '):
            last_import = i
    if last_import >= 0:
        lines.insert(last_import + 1, "import { logger } from '../utils/logger';")
    return '\n'.join(lines)


def migrate(path, replacements):
    with open(path) as f:
        content = f.read()
    content = add_logger_import(content)
    ok = True
    for old, new in replacements:
        if old in content:
            content = content.replace(old, new, 1)
        else:
            print(f"  !! NOT FOUND in {path}: {repr(old[:80])}")
            ok = False
    with open(path, 'w') as f:
        f.write(content)
    print(f"  {'OK' if ok else 'PARTIAL'}: {path}")
    return ok


all_ok = True

# ─── useCredentialBackup.ts ───────────────────────────────────────────────────
all_ok &= migrate('src/hooks/useCredentialBackup.ts', [
    # L31-L37: saving backup (multi-line)
    (
        "\t\t\tconsole.log(`🔧 [CredentialBackup] Saving backup for flow: ${flowKey}`, {\n"
        "\t\t\t\tflowKey,\n"
        "\t\t\t\thasEnvironmentId: !!credentials.environmentId,\n"
        "\t\t\t\thasClientId: !!credentials.clientId,\n"
        "\t\t\t\thasRedirectUri: !!credentials.redirectUri,\n"
        "\t\t\t\tscopes: credentials.scopes?.length || 0,\n"
        "\t\t\t});",
        "\t\t\tlogger.info('useCredentialBackup', 'Saving backup for flow', {\n"
        "\t\t\t\tflowKey,\n"
        "\t\t\t\thasEnvironmentId: !!credentials.environmentId,\n"
        "\t\t\t\thasClientId: !!credentials.clientId,\n"
        "\t\t\t\thasRedirectUri: !!credentials.redirectUri,\n"
        "\t\t\t\tscopes: credentials.scopes?.length || 0,\n"
        "\t\t\t});"
    ),
    # L52-L61: restoring backup (multi-line)
    (
        "\t\t\t\tconsole.log(\n"
        "\t\t\t\t\t`🔧 [CredentialBackup] Restoring credentials from backup for flow: ${flowKey}`,\n"
        "\t\t\t\t\t{\n"
        "\t\t\t\t\t\tflowKey,\n"
        "\t\t\t\t\t\thasEnvironmentId: !!backupCredentials.environmentId,\n"
        "\t\t\t\t\t\thasClientId: !!backupCredentials.clientId,\n"
        "\t\t\t\t\t\thasRedirectUri: !!backupCredentials.redirectUri,\n"
        "\t\t\t\t\t\tscopes: backupCredentials.scopes?.length || 0,\n"
        "\t\t\t\t\t}\n"
        "\t\t\t\t);",
        "\t\t\t\tlogger.info('useCredentialBackup', `Restoring credentials from backup for flow: ${flowKey}`, {\n"
        "\t\t\t\t\tflowKey,\n"
        "\t\t\t\t\thasEnvironmentId: !!backupCredentials.environmentId,\n"
        "\t\t\t\t\thasClientId: !!backupCredentials.clientId,\n"
        "\t\t\t\t\thasRedirectUri: !!backupCredentials.redirectUri,\n"
        "\t\t\t\t\tscopes: backupCredentials.scopes?.length || 0,\n"
        "\t\t\t\t});"
    ),
    # L81: clearing backup (single-line)
    (
        "\t\t\tconsole.log(`🔧 [CredentialBackup] Cleared backup for flow: ${flowKey}`);",
        "\t\t\tlogger.info('useCredentialBackup', `Cleared backup for flow: ${flowKey}`);"
    ),
])

# ─── useGlobalWorkerToken.ts ──────────────────────────────────────────────────
all_ok &= migrate('src/hooks/useGlobalWorkerToken.ts', [
    # L74-L78: debug stored token in localStorage
    (
        "\t\t\tconsole.log('[useGlobalWorkerToken] 🔍 Debug - Stored token in localStorage:', {\n"
        "\t\t\t\thasToken: !!storedToken,\n"
        "\t\t\t\ttokenLength: storedToken?.length || 0,\n"
        "\t\t\t\ttokenPreview: storedToken ? `${storedToken.substring(0, 100)}...` : 'none',\n"
        "\t\t\t});",
        "\t\t\tlogger.debug('useGlobalWorkerToken', 'Stored token in localStorage', {\n"
        "\t\t\t\thasToken: !!storedToken,\n"
        "\t\t\t\ttokenLength: storedToken?.length || 0,\n"
        "\t\t\t\ttokenPreview: storedToken ? `${storedToken.substring(0, 100)}...` : 'none',\n"
        "\t\t\t});"
    ),
    # L82-L86: token retrieved successfully
    (
        "\t\t\tconsole.log('[useGlobalWorkerToken] ✅ Token retrieved successfully:', {\n"
        "\t\t\t\thasToken: !!token,\n"
        "\t\t\t\ttokenLength: token?.length || 0,\n"
        "\t\t\t\ttokenPrefix: token ? `${token.substring(0, 20)}...` : 'none',\n"
        "\t\t\t});",
        "\t\t\tlogger.info('useGlobalWorkerToken', 'Token retrieved successfully', {\n"
        "\t\t\t\thasToken: !!token,\n"
        "\t\t\t\ttokenLength: token?.length || 0,\n"
        "\t\t\t\ttokenPrefix: token ? `${token.substring(0, 20)}...` : 'none',\n"
        "\t\t\t});"
    ),
    # L102: worker token not configured (single-line)
    (
        "\t\t\t\tconsole.debug('[useGlobalWorkerToken] Worker Token not configured (optional).');",
        "\t\t\t\tlogger.debug('useGlobalWorkerToken', 'Worker Token not configured (optional)');"
    ),
    # L104-L108: failed to get token (multi-line)
    (
        "\t\t\t\tconsole.error('[useGlobalWorkerToken] ❌ Failed to get token:', {\n"
        "\t\t\t\t\terror: errorMessage,\n"
        "\t\t\t\t\terrorType: error?.constructor?.name,\n"
        "\t\t\t\t\tstack: error instanceof Error ? error.stack : undefined,\n"
        "\t\t\t\t});",
        "\t\t\t\tlogger.error('useGlobalWorkerToken', 'Failed to get token', {\n"
        "\t\t\t\t\terrorType: error instanceof Error ? error.constructor?.name : undefined,\n"
        "\t\t\t\t}, error instanceof Error ? error : undefined);"
    ),
])

# ─── useOAuth2CompliantImplicitFlow.ts ────────────────────────────────────────
all_ok &= migrate('src/hooks/useOAuth2CompliantImplicitFlow.ts', [
    # L258-L262: authorization URL generated
    (
        "\t\t\tconsole.log('[ImplicitCompliantFlow] Authorization URL generated:', {\n"
        "\t\t\t\turl: authorizationUrl,\n"
        "\t\t\t\tstate: `${secureState.substring(0, 10)}...`,\n"
        "\t\t\t\tresponseType: authRequest.response_type,\n"
        "\t\t\t});",
        "\t\t\tlogger.info('useOAuth2CompliantImplicitFlow', 'Authorization URL generated', {\n"
        "\t\t\t\turl: authorizationUrl,\n"
        "\t\t\t\tstate: `${secureState.substring(0, 10)}...`,\n"
        "\t\t\t\tresponseType: authRequest.response_type,\n"
        "\t\t\t});"
    ),
    # L326-L333: token response processed
    (
        "\t\t\tconsole.log('[ImplicitCompliantFlow] Token response processed:', {\n"
        "\t\t\t\thasAccessToken: !!tokens.access_token,\n"
        "\t\t\t\thasIdToken: !!tokens.id_token,\n"
        "\t\t\t\ttokenType: tokens.token_type,\n"
        "\t\t\t\texpiresIn: tokens.expires_in,\n"
        "\t\t\t\tscope: tokens.scope,\n"
        "\t\t\t\tvalidationPassed: tokenValidation.valid,\n"
        "\t\t\t});",
        "\t\t\tlogger.info('useOAuth2CompliantImplicitFlow', 'Token response processed', {\n"
        "\t\t\t\thasAccessToken: !!tokens.access_token,\n"
        "\t\t\t\thasIdToken: !!tokens.id_token,\n"
        "\t\t\t\ttokenType: tokens.token_type,\n"
        "\t\t\t\texpiresIn: tokens.expires_in,\n"
        "\t\t\t\tscope: tokens.scope,\n"
        "\t\t\t\tvalidationPassed: tokenValidation.valid,\n"
        "\t\t\t});"
    ),
])

# ─── useHybridFlow.ts — replace wrapper + all log.* usages ───────────────────
all_ok &= migrate('src/hooks/useHybridFlow.ts', [
    # Remove the local log wrapper and LOG_PREFIX constant
    (
        "// Unified logging format: [🔀 OIDC-HYBRID]\n"
        "const LOG_PREFIX = '[🔀 OIDC-HYBRID]';\n"
        "\n"
        "const log = {\n"
        "\tinfo: (message: string, ...args: any[]) => {\n"
        "\t\tconst timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);\n"
        "\t\tconsole.log(`${timestamp} ${LOG_PREFIX} [INFO]`, message, ...args);\n"
        "\t},\n"
        "\twarn: (message: string, ...args: any[]) => {\n"
        "\t\tconst timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);\n"
        "\t\tconsole.warn(`${timestamp} ${LOG_PREFIX} [WARN]`, message, ...args);\n"
        "\t},\n"
        "\terror: (message: string, ...args: any[]) => {\n"
        "\t\tconst timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);\n"
        "\t\tconsole.error(`${timestamp} ${LOG_PREFIX} [ERROR]`, message, ...args);\n"
        "\t},\n"
        "\tsuccess: (message: string, ...args: any[]) => {\n"
        "\t\tconst timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);\n"
        "\t\tconsole.log(`${timestamp} ${LOG_PREFIX} [SUCCESS]`, message, ...args);\n"
        "\t},\n"
        "};",
        "// logging handled via logger utility"
    ),
    # log.info calls (2 args: message, data)
    (
        "\t\tlog.info('Loaded saved credentials from credential manager');",
        "\t\tlogger.info('useHybridFlow', 'Loaded saved credentials from credential manager');"
    ),
    (
        "\t\tlog.info('Credentials updated', {\n"
        "\t\t\tenvironmentId: creds.environmentId,\n"
        "\t\t\tclientId: `${creds.clientId.substring(0, 8)}...`,\n"
        "\t\t\tresponseType: creds.responseType,\n"
        "\t\t});",
        "\t\tlogger.info('useHybridFlow', 'Credentials updated', {\n"
        "\t\t\tenvironmentId: creds.environmentId,\n"
        "\t\t\tclientId: `${creds.clientId.substring(0, 8)}...`,\n"
        "\t\t\tresponseType: creds.responseType,\n"
        "\t\t});"
    ),
    (
        "\t\tlog.success('Tokens received', {\n"
        "\t\t\thasAccessToken: !!newTokens.access_token,\n"
        "\t\t\thasIdToken: !!newTokens.id_token,\n"
        "\t\t\thasRefreshToken: !!newTokens.refresh_token,\n"
        "\t\t\thasCode: !!newTokens.code,\n"
        "\t\t});",
        "\t\tlogger.success('useHybridFlow', 'Tokens received', {\n"
        "\t\t\thasAccessToken: !!newTokens.access_token,\n"
        "\t\t\thasIdToken: !!newTokens.id_token,\n"
        "\t\t\thasRefreshToken: !!newTokens.refresh_token,\n"
        "\t\t\thasCode: !!newTokens.code,\n"
        "\t\t});"
    ),
    (
        "\t\t\tlog.error(errorMsg);\n"
        "\t\t\tsetError(errorMsg);\n"
        "\t\t\tthrow new Error(errorMsg);",
        "\t\t\tlogger.error('useHybridFlow', errorMsg);\n"
        "\t\t\tsetError(errorMsg);\n"
        "\t\t\tthrow new Error(errorMsg);"
    ),
    (
        "\t\tlog.info('Authorization URL generated', {\n"
        "\t\t\tresponseType: credentials.responseType,\n"
        "\t\t\tscopes: credentials.scopes,\n"
        "\t\t\tredirectUri,\n"
        "\t\t});",
        "\t\tlogger.info('useHybridFlow', 'Authorization URL generated', {\n"
        "\t\t\tresponseType: credentials.responseType,\n"
        "\t\t\tscopes: credentials.scopes,\n"
        "\t\t\tredirectUri,\n"
        "\t\t});"
    ),
    (
        "\t\t\tlog.error(errorMsg, err);\n"
        "\t\t\tsetError(errorMsg);\n"
        "\t\t\tthrow err;",
        "\t\t\tlogger.error('useHybridFlow', errorMsg, undefined, err instanceof Error ? err : undefined);\n"
        "\t\t\tsetError(errorMsg);\n"
        "\t\t\tthrow err;"
    ),
    (
        "\t\t\t\tlog.error(errorMsg);\n"
        "\t\t\t\tsetError(errorMsg);\n"
        "\t\t\t\tthrow new Error(errorMsg);",
        "\t\t\t\tlogger.error('useHybridFlow', errorMsg);\n"
        "\t\t\t\tsetError(errorMsg);\n"
        "\t\t\t\tthrow new Error(errorMsg);"
    ),
    (
        "\t\t\t\tlog.info('Exchanging authorization code for tokens...');",
        "\t\t\t\tlogger.info('useHybridFlow', 'Exchanging authorization code for tokens...');"
    ),
    (
        "\t\t\t\tlog.success('Code exchanged successfully', {\n"
        "\t\t\t\t\thasAccessToken: !!tokenData.access_token,\n"
        "\t\t\t\t\thasIdToken: !!tokenData.id_token,\n"
        "\t\t\t\t\thasRefreshToken: !!tokenData.refresh_token,\n"
        "\t\t\t\t});",
        "\t\t\t\tlogger.success('useHybridFlow', 'Code exchanged successfully', {\n"
        "\t\t\t\t\thasAccessToken: !!tokenData.access_token,\n"
        "\t\t\t\t\thasIdToken: !!tokenData.id_token,\n"
        "\t\t\t\t\thasRefreshToken: !!tokenData.refresh_token,\n"
        "\t\t\t\t});"
    ),
    (
        "\t\t\t\tlog.error('Code exchange failed', err);\n"
        "\t\t\t\tsetError(errorMsg);",
        "\t\t\t\tlogger.error('useHybridFlow', 'Code exchange failed', undefined, err instanceof Error ? err : undefined);\n"
        "\t\t\t\tsetError(errorMsg);"
    ),
    (
        "\t\tlog.info('Resetting hybrid flow state');",
        "\t\tlogger.info('useHybridFlow', 'Resetting hybrid flow state');"
    ),
])

print("\nBatch 1b complete:", "ALL OK" if all_ok else "SOME WARNINGS")
sys.exit(0 if all_ok else 1)
