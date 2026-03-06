#!/usr/bin/env python3
"""Migrate console.* to logger.* in small utility hooks (Batch 1)."""

import os
import sys

os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

LOGGER_IMPORT = "import { logger } from '../utils/logger';\n"


def add_logger_import(lines):
    """Add logger import after last existing import line."""
    if any("import { logger } from '../utils/logger'" in l for l in lines):
        return lines  # Already has it
    last_import = -1
    for i, line in enumerate(lines):
        if line.strip().startswith('import '):
            last_import = i
    if last_import >= 0:
        lines.insert(last_import + 1, LOGGER_IMPORT)
    return lines


def migrate_file(path, replacements):
    with open(path) as f:
        content = f.read()
    lines = content.splitlines(keepends=True)
    lines = add_logger_import(lines)
    content = ''.join(lines)
    ok = True
    for old, new in replacements:
        if old in content:
            content = content.replace(old, new, 1)
        else:
            print(f"  WARNING: Could not find in {path}:")
            print(f"    {repr(old[:100])}")
            ok = False
    with open(path, 'w') as f:
        f.write(content)
    status = "OK" if ok else "PARTIAL"
    print(f"  [{status}] {path}")
    return ok


all_ok = True

# useCibaFlow.ts: 1 console.warn with LOG_PREFIX template
all_ok &= migrate_file('src/hooks/useCibaFlow.ts', [
    (
        "\t\t\tconsole.warn(`${LOG_PREFIX} Failed to restore mock state:`, loadError);\n",
        "\t\t\tlogger.warn('useCibaFlow', 'Failed to restore mock state');\n"
    )
])

# useDavinciBranding.ts: 2 console.warn
all_ok &= migrate_file('src/hooks/useDavinciBranding.ts', [
    (
        "\t\tconsole.warn('[useDavinciBranding] Failed to parse stored branding payload', error);\n",
        "\t\tlogger.warn('useDavinciBranding', 'Failed to parse stored branding payload');\n"
    ),
    (
        "\t\t\tconsole.warn('[useDavinciBranding] Failed to persist branding payload', error);\n",
        "\t\t\tlogger.warn('useDavinciBranding', 'Failed to persist branding payload');\n"
    )
])

# useTokenRevocationFlowController.ts: success + error
all_ok &= migrate_file('src/hooks/useTokenRevocationFlowController.ts', [
    (
        "\t\t\tconsole.log(`${LOG_PREFIX} [SUCCESS] Token revocation completed:`, result);\n",
        "\t\t\tlogger.success('useTokenRevocationFlowController', 'Token revocation completed', result);\n"
    ),
    (
        "\t\t\tconsole.error(`${LOG_PREFIX} [ERROR] Token revocation failed:`, err);\n",
        "\t\t\tlogger.error('useTokenRevocationFlowController', 'Token revocation failed', undefined, err instanceof Error ? err : undefined);\n"
    )
])

# useTokenIntrospectionFlowController.ts: success + error
all_ok &= migrate_file('src/hooks/useTokenIntrospectionFlowController.ts', [
    (
        "\t\t\t\tconsole.log(`${LOG_PREFIX} [SUCCESS] Token introspection completed:`, result);\n",
        "\t\t\t\tlogger.success('useTokenIntrospectionFlowController', 'Token introspection completed', result);\n"
    ),
    (
        "\t\t\t\tconsole.error(`${LOG_PREFIX} [ERROR] Token introspection failed:`, err);\n",
        "\t\t\t\tlogger.error('useTokenIntrospectionFlowController', 'Token introspection failed', undefined, err instanceof Error ? err : undefined);\n"
    )
])

# useUserInfoFlowController.ts: success + error
all_ok &= migrate_file('src/hooks/useUserInfoFlowController.ts', [
    (
        "\t\t\tconsole.log(`${LOG_PREFIX} [SUCCESS] UserInfo fetched:`, result);\n",
        "\t\t\tlogger.success('useUserInfoFlowController', 'UserInfo fetched', result);\n"
    ),
    (
        "\t\t\tconsole.error(`${LOG_PREFIX} [ERROR] UserInfo request failed:`, err);\n",
        "\t\t\tlogger.error('useUserInfoFlowController', 'UserInfo request failed', undefined, err instanceof Error ? err : undefined);\n"
    )
])

# useOAuthFlow.ts: 3 calls, no prefix
all_ok &= migrate_file('src/hooks/useOAuthFlow.ts', [
    (
        "\t\t\tconsole.error('Error initializing OAuth flow:', error);\n",
        "\t\t\tlogger.error('useOAuthFlow', 'Error initializing OAuth flow', undefined, error instanceof Error ? error : undefined);\n"
    ),
    (
        "\t\t\t\t\t\tconsole.warn('Failed to fetch user info:', error);\n",
        "\t\t\t\t\t\tlogger.warn('useOAuthFlow', 'Failed to fetch user info');\n"
    ),
    (
        "\t\t\t\tconsole.error('Error handling OAuth callback:', error);\n",
        "\t\t\t\tlogger.error('useOAuthFlow', 'Error handling OAuth callback', undefined, error instanceof Error ? error : undefined);\n"
    )
])

print("\nBatch 1a complete:", "ALL OK" if all_ok else "SOME WARNINGS")
sys.exit(0 if all_ok else 1)
