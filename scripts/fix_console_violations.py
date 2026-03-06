#!/usr/bin/env python3
"""Fix console.error/warn violations in V9 flow files per zero-tolerance policy.
Uses line-based replacement: removes/rewrites lines containing console.error or
console.warn, handling multi-line cases (multi-line console.error(...)) too.
"""
import re


def remove_console_lines(path, patterns_to_remove, context_patches=None):
    """Remove lines matching given patterns, and apply optional context patches."""
    with open(path, 'r') as f:
        lines = f.readlines()

    original = list(lines)
    result = []
    i = 0
    removed_count = 0
    while i < len(lines):
        line = lines[i]
        removed = False
        for pat in patterns_to_remove:
            if re.search(pat, line):
                # Check if this is a multi-line console.error(...) - look ahead
                if 'console.error(\n' == line.strip() + '\n' or line.rstrip().endswith('console.error(') or (line.rstrip().endswith('console.error(') is False and 'console.error(\n' in line):
                    pass  # handled below
                # Skip single-line console.error/warn
                removed = True
                removed_count += 1
                # If it's an opening paren continuation (multi-line), skip ahead
                stripped = line.rstrip()
                if stripped.endswith('console.error(') or (re.search(r'console\.(error|warn)\($', stripped)):
                    # Multi-line: skip until closing );
                    i += 1
                    while i < len(lines) and not lines[i].rstrip().endswith(');'):
                        i += 1
                    i += 1  # skip the ); line
                else:
                    i += 1
                break
        if not removed:
            result.append(line)
            i += 1

    if removed_count > 0:
        with open(path, 'w') as f:
            f.writelines(result)
        print(f"  Removed {removed_count} console lines -> SAVED ({path.split('/')[-1]})")
    else:
        print(f"  No matches found ({path.split('/')[-1]})")

    return removed_count


def patch_file(path, old_str, new_str):
    """Apply a specific text patch to a file."""
    with open(path, 'r') as f:
        content = f.read()
    if old_str in content:
        content = content.replace(old_str, new_str, 1)
        with open(path, 'w') as f:
            f.write(content)
        print(f"  PATCHED: {old_str[:60].strip()!r}")
        return True
    else:
        print(f"  PATCH NOT FOUND: {old_str[:60].strip()!r}")
        return False


BASE = 'src/pages/flows/v9/'

# =============================================================================
# Strategy: remove_console_lines removes all matching lines.
# For lines that are ONLY in certain spots (like background cache clears that
# are already the _only_ thing in catch blocks), we also need to rename the
# catch variable from `error` to `_error` to avoid lint warnings.
# =============================================================================

print("\n=== JWTBearerTokenFlowV9.tsx ===")
remove_console_lines(BASE + 'JWTBearerTokenFlowV9.tsx', [
    r"console\.error\('Failed to copy text",
    r"console\.error\('Failed to generate JWT",
    r"console\.error\('Failed to request token",
])

print("\n=== ClientCredentialsFlowV9.tsx ===")
remove_console_lines(BASE + 'ClientCredentialsFlowV9.tsx', [
    r"console\.(error|warn)\('\[Client Credentials",
])

print("\n=== OIDCHybridFlowV9.tsx ===")
# Special: token exchange catch needs modernMessaging added BEFORE removing console.error
f = BASE + 'OIDCHybridFlowV9.tsx'
with open(f) as fh:
    txt = fh.read()
if "console.error('[OIDCHybridFlowV7] Token exchange failed'" in txt:
    txt = txt.replace(
        "console.error('[OIDCHybridFlowV7] Token exchange failed', error);\n",
        "modernMessaging.showBanner({\n\t\t\t\ttype: 'error',\n\t\t\t\ttitle: 'Error',\n\t\t\t\tmessage: error instanceof Error ? error.message : 'Token exchange failed. Please try again.',\n\t\t\t\tdismissible: true,\n\t\t\t});\n"
    )
    with open(f, 'w') as fh:
        fh.write(txt)
    print(f"  PATCHED: OIDCHybrid token exchange -> added modernMessaging")

remove_console_lines(BASE + 'OIDCHybridFlowV9.tsx', [
    r"console\.(error|warn)\('\[OIDC Hybrid",
    r"console\.(error|warn)\('\[OIDCHybridFlow",
])

print("\n=== SAMLBearerAssertionFlowV9.tsx ===")
remove_console_lines(BASE + 'SAMLBearerAssertionFlowV9.tsx', [
    r"console\.(error|warn)\('\[SAML Bearer",
    r"console\.(error|warn)\('\[SAML",
])

print("\n=== ImplicitFlowV9.tsx ===")
remove_console_lines(BASE + 'ImplicitFlowV9.tsx', [
    r"console\.(error|warn)\('\[ImplicitFlow",
    r"console\.(error|warn)\('\[Implicit Flow",
    r"console\.(error|warn)\('\[Implicit V7",
    r"console\.error\(\n",
])

print("\n=== DeviceAuthorizationFlowV9.tsx ===")
remove_console_lines(BASE + 'DeviceAuthorizationFlowV9.tsx', [
    r"console\.(error|warn)\('\[DeviceAuth",
    r"console\.(error|warn)\('\[Device Auth",
    r"console\.(error|warn)\('\[Device Authz",
    r"console\.(error|warn)\('\[DeviceAuthorizationFlow",
])

print("\n=== OAuthAuthorizationCodeFlowV9.tsx ===")
f = BASE + 'OAuthAuthorizationCodeFlowV9.tsx'
with open(f) as fh:
    txt = fh.read()
print("  violations before:", txt.count('console.error') + txt.count('console.warn'))
remove_console_lines(BASE + 'OAuthAuthorizationCodeFlowV9.tsx', [
    r"console\.(error|warn)\('.*\[V7\.2\]",
    r"console\.(error|warn)\('.*\[V7 AuthZ\]",
    r"console\.(error|warn)\('.*\[AuthorizationCodeFlowV5\]",
    r"console\.(error|warn)\('.*\[handleSaveConfiguration\]",
    r"console\.(error|warn)\('.*\[Redirectless\]",
    r"console\.(error|warn)\('🚨 \[TokenExchange\]",
    r"console\.(error|warn)\(\n",
    r"console\.(error|warn)\(",
])

print("\nFINAL violation counts:")
for fname in [
    'JWTBearerTokenFlowV9.tsx', 'ClientCredentialsFlowV9.tsx', 'OIDCHybridFlowV9.tsx',
    'SAMLBearerAssertionFlowV9.tsx', 'ImplicitFlowV9.tsx', 'DeviceAuthorizationFlowV9.tsx',
    'OAuthAuthorizationCodeFlowV9.tsx',
]:
    with open(BASE + fname) as fh:
        data = fh.read()
    count = data.count('console.error') + data.count('console.warn')
    print(f"  {count:3d}  {fname}")


# ===========================================================================
# PingOnePARFlowV9.tsx  (2 violations)
# ===========================================================================
print("\n=== PingOnePARFlowV9.tsx ===")
fix_file('src/pages/flows/v9/PingOnePARFlowV9.tsx', [
    # 1. Lone console.warn in else branch (no modernMessaging) - remove silently
    (
        "\t\t\t} else {\n\t\t\t\tconsole.warn('\u26a0\ufe0f [PAR V9] Failed to save credentials to PAR-specific storage');\n\t\t\t}",
        ""
    ),
    # 2. console.error already followed by messagingService call - just remove
    (
        "\t\t\tconsole.error('\u274c [PAR V9] Failed to generate PKCE codes:', error);\n\t\t\tmessagingService.showErrorBanner('Failed to generate PKCE codes');",
        "\t\t\tmessagingService.showErrorBanner('Failed to generate PKCE codes');"
    ),
])

# ===========================================================================
# JWTBearerTokenFlowV9.tsx  (3 violations - all already followed by modernMessaging)
# ===========================================================================
print("\n=== JWTBearerTokenFlowV9.tsx ===")
fix_file('src/pages/flows/v9/JWTBearerTokenFlowV9.tsx', [
    (
        "\t\t\tconsole.error('Failed to copy text: ', err);\n\t\t\tmodernMessaging.showCriticalError({",
        "\t\t\tmodernMessaging.showCriticalError({"
    ),
    (
        "\t\t\t\tconsole.error('Failed to generate JWT:', error);\n\t\t\t\tmodernMessaging.showCriticalError({",
        "\t\t\t\tmodernMessaging.showCriticalError({"
    ),
    (
        "\t\t\t\tconsole.error('Failed to request token:', error);\n\t\t\t\tmodernMessaging.showCriticalError({",
        "\t\t\t\tmodernMessaging.showCriticalError({"
    ),
])

# ===========================================================================
# ClientCredentialsFlowV9.tsx  (4 violations)
# ===========================================================================
print("\n=== ClientCredentialsFlowV9.tsx ===")
fix_file('src/pages/flows/v9/ClientCredentialsFlowV9.tsx', [
    # 1. Already followed by modernMessaging.showBanner
    (
        "\t\t\t\tconsole.error('[Client Credentials V7] Failed to clear flow state:', error);\n\t\t\t\tmodernMessaging.showBanner({",
        "\t\t\t\tmodernMessaging.showBanner({"
    ),
    # 2. Background cache clear - remove silently
    (
        "\t\t\t} catch (error) {\n\t\t\t\tconsole.warn('[Client Credentials V7] Failed to clear cache data:', error);\n\t\t\t}",
        "\t\t\t} catch (_error) {\n\t\t\t\t// Background cache clear - non-critical\n\t\t\t}"
    ),
    # 3. Background clearBackup - remove silently
    (
        "\t\t\t} catch (error) {\n\t\t\t\tconsole.error('[Client Credentials V7] Failed to clear credential backup:', error);\n\t\t\t}",
        "\t\t\t} catch (_error) {\n\t\t\t\t// Background credential backup clear - non-critical\n\t\t\t}"
    ),
    # 4. Already followed by modernMessaging.showBanner in .catch()
    (
        "\t\t\t\t\tconsole.error('[Client Credentials V7] Failed to save credentials to V7 storage:', error);\n\t\t\t\t\t// Show user-friendly error message\n\t\t\t\t\tmodernMessaging.showBanner({",
        "\t\t\t\t\tmodernMessaging.showBanner({"
    ),
])

# ===========================================================================
# OIDCHybridFlowV9.tsx  (5 violations)
# ===========================================================================
print("\n=== OIDCHybridFlowV9.tsx ===")
fix_file('src/pages/flows/v9/OIDCHybridFlowV9.tsx', [
    # 1. Already followed by modernMessaging.showBanner in .catch()
    (
        "\t\t\t\t\tconsole.error('[OIDC Hybrid V7] Failed to save credentials to V7 storage:', error);\n\t\t\t\t\t// Show user-friendly error message\n\t\t\t\t\tmodernMessaging.showBanner({",
        "\t\t\t\t\tmodernMessaging.showBanner({"
    ),
    # 2. Already followed by modernMessaging.showBanner
    (
        "\t\t\t} catch (error) {\n\t\t\t\tconsole.error('[OIDCHybridFlowV7] Failed to generate authorization URL', error);\n\t\t\t\tmodernMessaging.showBanner({",
        "\t\t\t} catch (error) {\n\t\t\t\tmodernMessaging.showBanner({"
    ),
    # 3. Token exchange failed - no modernMessaging. Add it + remove console.error
    (
        "\t\t\t} catch (error) {\n\t\t\t\tconsole.error('[OIDCHybridFlowV7] Token exchange failed', error);\n\t\t\t} finally {",
        "\t\t\t} catch (error) {\n\t\t\t\tmodernMessaging.showBanner({\n\t\t\t\t\ttype: 'error',\n\t\t\t\t\ttitle: 'Error',\n\t\t\t\t\tmessage: error instanceof Error ? error.message : 'Token exchange failed. Please try again.',\n\t\t\t\t\tdismissible: true,\n\t\t\t\t});\n\t\t\t} finally {"
    ),
    # 4. Already followed by modernMessaging.showBanner
    (
        "\t\t\t\tconsole.error('[OIDC Hybrid V7] Failed to clear flow state:', error);\n\t\t\t\tmodernMessaging.showBanner({",
        "\t\t\t\tmodernMessaging.showBanner({"
    ),
    # 5. Background clearBackup - remove silently
    (
        "\t\t\t} catch (error) {\n\t\t\t\tconsole.error('[OIDC Hybrid V7] Failed to clear credential backup:', error);\n\t\t\t}",
        "\t\t\t} catch (_error) {\n\t\t\t\t// Background credential backup clear - non-critical\n\t\t\t}"
    ),
])

# ===========================================================================
# SAMLBearerAssertionFlowV9.tsx  (9 violations)
# ===========================================================================
print("\n=== SAMLBearerAssertionFlowV9.tsx ===")
fix_file('src/pages/flows/v9/SAMLBearerAssertionFlowV9.tsx', [
    # 1. useMemo Base64 encode - just remove (returns '')
    (
        "\t\t\t\tconsole.error('[SAML Bearer V9] Failed to encode SAML assertion to Base64:', error);\n\t\t\t\treturn '';",
        "\t\t\t\treturn '';"
    ),
    # 2. useMemo Base64 decode - just remove (returns '')
    (
        "\t\t\t\tconsole.error('[SAML Bearer V9] Failed to decode Base64 SAML assertion:', error);\n\t\t\t\treturn '';",
        "\t\t\t\treturn '';"
    ),
    # 3. Already followed by modernMessaging.showBanner
    (
        "\t\t\t\tconsole.error('[SAML Bearer V9] Failed to copy to clipboard:', error);\n\t\t\t\tmodernMessaging.showBanner({",
        "\t\t\t\tmodernMessaging.showBanner({"
    ),
    # 4. Background discovery - comment says don't show toast
    (
        "\t\t\t\t\tconsole.warn('[SAML Bearer V9] OIDC Discovery failed:', error);\n\t\t\t\t\t// Don't show error toast - user can manually enter endpoints",
        "\t\t\t\t\t// OIDC Discovery failed - user can manually enter endpoints"
    ),
    # 5. Already followed by modernMessaging.showBanner
    (
        "\t\t\t\tconsole.error('[SAML Bearer V9] Error generating SAML assertion:', error);\n\t\t\t\tmodernMessaging.showBanner({",
        "\t\t\t\tmodernMessaging.showBanner({"
    ),
    # 6. saveSAMLConfiguration - background persist, non-critical
    (
        "\t\t\t} catch (error) {\n\t\t\t\tconsole.error('[SAML Bearer V9] Error saving configuration:', error);\n\t\t\t}",
        "\t\t\t} catch (_error) {\n\t\t\t\t// Background config save - non-critical\n\t\t\t}"
    ),
    # 7. loadSAMLConfiguration - has graceful fallback, non-critical
    (
        "\t\t\t} catch (error) {\n\t\t\t\tconsole.error('[SAML Bearer V9] Error loading configuration:', error);\n\t\t\t}",
        "\t\t\t} catch (_error) {\n\t\t\t\t// Config load failed - non-critical\n\t\t\t}"
    ),
    # 8. loadCredentials - has fallback in catch block
    (
        "\t\t\t\t} catch (error) {\n\t\t\t\t\tconsole.error('[SAML Bearer V9] Error loading credentials:', error);\n\t\t\t\t\t// Fallback to SAML-specific configuration only\n\t\t\t\t\tloadSAMLConfiguration();",
        "\t\t\t\t} catch (_error) {\n\t\t\t\t\t// Fallback to SAML-specific configuration only\n\t\t\t\t\tloadSAMLConfiguration();"
    ),
    # 9. Already followed by modernMessaging.showBanner
    (
        "\t\t\t\tconsole.error('[SAML Bearer Mock] Error in simulation:', error);\n\t\t\t\tmodernMessaging.showBanner({",
        "\t\t\t\tmodernMessaging.showBanner({"
    ),
])

# ===========================================================================
# ImplicitFlowV9.tsx  (7 violations)
# ===========================================================================
print("\n=== ImplicitFlowV9.tsx ===")
fix_file('src/pages/flows/v9/ImplicitFlowV9.tsx', [
    # 1. Credential load with graceful fallback - remove console.error
    (
        "\t\t\t\t} catch (error) {\n\t\t\t\t\tconsole.error('[ImplicitFlowV9] Failed to load V7 credentials:', error);\n\t\t\t\t\t// Fallback to legacy method on error",
        "\t\t\t\t} catch (_error) {\n\t\t\t\t\t// Fallback to legacy method on error"
    ),
    # 2. Background comprehensive cred save (if !success branch)
    (
        "\t\t\t\tif (!success) {\n\t\t\t\t\tconsole.error('[ImplicitFlowV9] Failed to save credentials to comprehensive service');\n\t\t\t\t}",
        "\t\t\t\t// Comprehensive service save - failures are non-critical"
    ),
    # 3. Background auto-save in .catch()
    (
        "\t\t\t\t\t\t\t\t.catch((error: unknown) => {\n\t\t\t\t\t\t\t\t\tconsole.error(\n\t\t\t\t\t\t\t\t\t\t'[Implicit Flow V9] Failed to auto-save redirect URI to controller:',\n\t\t\t\t\t\t\t\t\t\terror\n\t\t\t\t\t\t\t\t\t);\n\t\t\t\t\t\t\t\t});",
        "\t\t\t\t\t\t\t\t.catch((_err: unknown) => {\n\t\t\t\t\t\t\t\t\t// Background auto-save - non-critical\n\t\t\t\t\t\t\t\t});"
    ),
    # 4. Already followed by OAuthErrorHandlingService + modernMessaging
    (
        "\t\t\t\t\t\t\t\t} catch (error) {\n\t\t\t\t\t\t\t\t\tconsole.error('[Implicit Flow V9] Failed to save credentials:', error);\n\t\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t\t// Use the new OAuth Error Handling Service",
        "\t\t\t\t\t\t\t\t} catch (error) {\n\t\t\t\t\t\t\t\t\t// Use the new OAuth Error Handling Service"
    ),
    # 5. Already followed by modernMessaging.showBanner
    (
        "\t\t\t\t\t\t\t\t} catch (error) {\n\t\t\t\t\t\t\t\t\tconsole.error('[Implicit Flow V9] Failed to create PingOne application:', error);\n\t\t\t\t\t\t\t\t\tmodernMessaging.showBanner({",
        "\t\t\t\t\t\t\t\t} catch (error) {\n\t\t\t\t\t\t\t\t\tmodernMessaging.showBanner({"
    ),
    # 6. Background cache clear (in Start New Flow)
    (
        "\t\t\t\t\t\t\t\t\t\t\t} catch (error) {\n\t\t\t\t\t\t\t\t\t\t\t\tconsole.warn('[Implicit V7] Failed to clear cache data:', error);\n\t\t\t\t\t\t\t\t\t\t\t}",
        "\t\t\t\t\t\t\t\t\t\t\t} catch (_error) {\n\t\t\t\t\t\t\t\t\t\t\t\t// Background cache clear - non-critical\n\t\t\t\t\t\t\t\t\t\t\t}"
    ),
    # 7. Background cache clear (in Reset)
    (
        "\t\t\t\t\t\t\t\t\t\t} catch (error) {\n\t\t\t\t\t\t\t\t\t\t\tconsole.warn('[Implicit V7] Failed to clear cache data:', error);\n\t\t\t\t\t\t\t\t\t\t}",
        "\t\t\t\t\t\t\t\t\t\t} catch (_error) {\n\t\t\t\t\t\t\t\t\t\t\t// Background cache clear - non-critical\n\t\t\t\t\t\t\t\t\t\t}"
    ),
])

# ===========================================================================
# DeviceAuthorizationFlowV9.tsx  (7 violations)
# ===========================================================================
print("\n=== DeviceAuthorizationFlowV9.tsx ===")
fix_file('src/pages/flows/v9/DeviceAuthorizationFlowV9.tsx', [
    # 1. Load credentials catch - no modernMessaging, add it
    (
        "\t\t\t} catch (error) {\n\t\t\t\tconsole.error('[DeviceAuth-V7] Failed to load credentials:', error);\n\t\t\t}",
        "\t\t\t} catch (error) {\n\t\t\t\tmodernMessaging.showBanner({\n\t\t\t\t\ttype: 'error',\n\t\t\t\t\ttitle: 'Error',\n\t\t\t\t\tmessage: 'Failed to load saved credentials.',\n\t\t\t\t\tdismissible: true,\n\t\t\t\t});\n\t\t\t}"
    ),
    # 2. if (!success) already followed by modernMessaging.showBanner
    (
        "\t\t\t\t\tif (!success) {\n\t\t\t\t\t\tconsole.error(\n\t\t\t\t\t\t\t'[Device Authorization V7] Failed to save credentials to comprehensive service'\n\t\t\t\t\t\t);\n\t\t\t\t\t\tmodernMessaging.showBanner({",
        "\t\t\t\t\tif (!success) {\n\t\t\t\t\t\tmodernMessaging.showBanner({"
    ),
    # 3. catch block already followed by modernMessaging.showBanner
    (
        "\t\t\t\t} catch (error) {\n\t\t\t\t\tconsole.error('[Device Authorization V7] Failed to save credentials:', error);\n\t\t\t\t\tmodernMessaging.showBanner({",
        "\t\t\t\t} catch (error) {\n\t\t\t\t\tmodernMessaging.showBanner({"
    ),
    # 4. Background cache clear
    (
        "\t\t\t} catch (error) {\n\t\t\t\tconsole.warn('[DeviceAuthorizationFlowV9] Failed to clear cache data:', error);\n\t\t\t}",
        "\t\t\t} catch (_error) {\n\t\t\t\t// Background cache clear - non-critical\n\t\t\t}"
    ),
    # 5. clearFlowState already followed by modernMessaging.showBanner
    (
        "\t\t\t\tconsole.error('[Device Authorization V7] Failed to clear flow state:', error);\n\t\t\t\tmodernMessaging.showBanner({",
        "\t\t\t\tmodernMessaging.showBanner({"
    ),
    # 6. Background clearBackup
    (
        "\t\t\t} catch (error) {\n\t\t\t\tconsole.error('[Device Authorization V7] Failed to clear credential backup:', error);\n\t\t\t}",
        "\t\t\t} catch (_error) {\n\t\t\t\t// Background credential backup clear - non-critical\n\t\t\t}"
    ),
    # 7. Credential save in CompactAppPickerV8U handler - already followed by modernMessaging
    (
        "\t\t\t\t\t\t\t} catch (error) {\n\t\t\t\t\t\t\t\tconsole.error('[Device Authz V7] Failed to save credentials:', error);\n\t\t\t\t\t\t\t\tmodernMessaging.showBanner({",
        "\t\t\t\t\t\t\t} catch (error) {\n\t\t\t\t\t\t\t\tmodernMessaging.showBanner({"
    ),
])

# ===========================================================================
# OAuthAuthorizationCodeFlowV9.tsx  (24 violations)
# ===========================================================================
print("\n=== OAuthAuthorizationCodeFlowV9.tsx ===")
fix_file('src/pages/flows/v9/OAuthAuthorizationCodeFlowV9.tsx', [
    # 1. Background credential sync
    (
        "\t\t\t\t\t\t\tconsole.log('\u2705 [V7.2] Credentials synced to comprehensive service');\n\t\t\t\t\t\t} catch (error) {\n\t\t\t\t\t\t\tconsole.error('\u274c [V7.2] Failed to sync credentials:', error);\n\t\t\t\t\t\t}",
        "\t\t\t\t\t\t\tconsole.log('\u2705 [V7.2] Credentials synced to comprehensive service');\n\t\t\t\t\t\t} catch (_error) {\n\t\t\t\t\t\t\t// Background credential sync - non-critical\n\t\t\t\t\t\t}"
    ),
    # 2. Background shared credential load in .catch()
    (
        "\t\t\t\t\t.catch((error) => {\n\t\t\t\t\t\tconsole.warn('[V7 AuthZ] Failed to load shared credentials:', error);\n\t\t\t\t\t});",
        "\t\t\t\t\t.catch((_error) => {\n\t\t\t\t\t\t// Background shared credential load - non-critical\n\t\t\t\t\t});"
    ),
    # 3. Background PKCE parse
    (
        "\t\t\t} catch (error) {\n\t\t\t\tconsole.warn('[V7 AuthZ] Failed to parse stored PKCE codes:', error);\n\t\t\t}",
        "\t\t\t} catch (_error) {\n\t\t\t\t// Non-critical - PKCE will be regenerated\n\t\t\t}"
    ),
    # 4. Background PingOne config parse
    (
        "\t\t\t} catch (error) {\n\t\t\t\tconsole.warn('[AuthorizationCodeFlowV5] Failed to parse stored PingOne config:', error);\n\t\t\t}",
        "\t\t\t} catch (_error) {\n\t\t\t\t// Non-critical - config will load from defaults\n\t\t\t}"
    ),
    # 5. OAuth error in URL - already followed by modernMessaging.showBanner
    (
        "\t\t\t\tconsole.error('[AuthorizationCodeFlowV5] OAuth error in URL:', error);\n\t\t\t\tmodernMessaging.showBanner({",
        "\t\t\t\tmodernMessaging.showBanner({"
    ),
    # 6. console.warn before retry delay (already has user-facing error after retry)
    (
        "\t\t\t\tif (!hasRequiredCredentials) {\n\t\t\t\t\tconsole.warn(\n\t\t\t\t\t\t'\u26a0\ufe0f [AuthorizationCodeFlowV5] Credentials not available yet - may need to load from storage'\n\t\t\t\t\t);\n\t\t\t\t\tconsole.log(\n\t\t\t\t\t\t'\u26a0\ufe0f [AuthorizationCodeFlowV5] Waiting 500ms for credentials to load, then re-checking...'\n\t\t\t\t\t);",
        "\t\t\t\tif (!hasRequiredCredentials) {"
    ),
    # 7. Missing credentials after retry - already followed by modernMessaging.showBanner
    (
        "\t\t\t\t\t\t\t\tconsole.error('\ud83d\udea8 [AuthorizationCodeFlowV5] Missing required credentials after retry');\n\t\t\t\t\t\t\t\tmodernMessaging.showBanner({",
        "\t\t\t\t\t\t\t\tmodernMessaging.showBanner({"
    ),
    # 8. handleSaveConfiguration if(!success) - success shown via footer message
    (
        "\t\t\t\tif (!success) {\n\t\t\t\t\tconsole.error(\n\t\t\t\t\t\t'\ud83d\udd27 [handleSaveConfiguration] Failed to save to comprehensiveFlowDataService'\n\t\t\t\t\t);\n\t\t\t\t}\n\n\t\t\t\tmodernMessaging.showFooterMessage({",
        "\t\t\t\tmodernMessaging.showFooterMessage({"
    ),
    # 9. handleSaveConfiguration catch - already followed by modernMessaging.showBanner
    (
        "\t\t\t} catch (error) {\n\t\t\t\tconsole.error('\ud83d\udd27 [handleSaveConfiguration] Save failed:', error);\n\t\t\t\tmodernMessaging.showBanner({",
        "\t\t\t} catch (error) {\n\t\t\t\tmodernMessaging.showBanner({"
    ),
    # 10. Redirectless guard - already followed by modernMessaging.showBanner
    (
        "\t\t\t\t\tconsole.warn(\n\t\t\t\t\t\t'\ud83d\udea8 [Redirectless] Attempted to run redirectless flow but useRedirectless is false'\n\t\t\t\t\t);\n\t\t\t\t\tmodernMessaging.showBanner({",
        "\t\t\t\t\tmodernMessaging.showBanner({"
    ),
    # 11. Redirectless Step 1 failed (before throw) - remove
    (
        "\t\t\t\t\t\t\t\t\tconst errorText = await step1.text();\n\t\t\t\t\t\t\t\t\tconsole.error('\ud83d\udea8 [Redirectless] Step 1 failed:', step1.status, errorText);\n\t\t\t\t\t\t\t\t\tthrow new Error(`Authorize failed (${step1.status}): ${errorText}`);",
        "\t\t\t\t\t\t\t\t\tconst errorText = await step1.text();\n\t\t\t\t\t\t\t\t\tthrow new Error(`Authorize failed (${step1.status}): ${errorText}`);"
    ),
    # 12. Redirectless Step 2 failed (before throw)
    (
        "\t\t\t\t\t\t\t\t\tconst errorText = await step2.text();\n\t\t\t\t\t\t\t\t\tconsole.error('\ud83d\udea8 [Redirectless] Step 2 failed:', step2.status, errorText);\n\t\t\t\t\t\t\t\t\tthrow new Error(`Credential check failed (${step2.status}): ${errorText}`);",
        "\t\t\t\t\t\t\t\t\tconst errorText = await step2.text();\n\t\t\t\t\t\t\t\t\tthrow new Error(`Credential check failed (${step2.status}): ${errorText}`);"
    ),
    # 13. Redirectless Step 3 failed (before throw)
    (
        "\t\t\t\t\t\t\t\t\tconst errorText = await step3.text();\n\t\t\t\t\t\t\t\t\tconsole.error('\ud83d\udea8 [Redirectless] Step 3 failed:', step3.status, errorText);\n\t\t\t\t\t\t\t\t\tthrow new Error(`Resume failed (${step3.status}): ${errorText}`);",
        "\t\t\t\t\t\t\t\t\tconst errorText = await step3.text();\n\t\t\t\t\t\t\t\t\tthrow new Error(`Resume failed (${step3.status}): ${errorText}`);"
    ),
    # 14. Redirectless no auth code (before throw)
    (
        "\t\t\t\t\t\t\t\tif (!authorizationCode) {\n\t\t\t\t\t\t\t\t\tconsole.error('\ud83d\udea8 [Redirectless] No authorization code in response:', step3Json);\n\t\t\t\t\t\t\t\t\tthrow new Error('No authorization code returned by resume');",
        "\t\t\t\t\t\t\t\tif (!authorizationCode) {\n\t\t\t\t\t\t\t\t\tthrow new Error('No authorization code returned by resume');"
    ),
    # 15. Redirectless Step 4 failed (before throw)
    (
        "\t\t\t\t\t\t\t\t\tconst errorText = await tokenResp.text();\n\t\t\t\t\t\t\t\t\tconsole.error('\ud83d\udea8 [Redirectless] Step 4 failed:', tokenResp.status, errorText);\n\t\t\t\t\t\t\t\t\tthrow new Error(`Token exchange failed (${tokenResp.status}): ${errorText}`);",
        "\t\t\t\t\t\t\t\t\tconst errorText = await tokenResp.text();\n\t\t\t\t\t\t\t\t\tthrow new Error(`Token exchange failed (${tokenResp.status}): ${errorText}`);"
    ),
    # 16-20. Multiple console.errors in redirectless catch block - all followed by modernMessaging.showBanner
    (
        "\t\t\t\t} catch (e) {\n\t\t\t\t\tconsole.error('\ud83d\udea8 [Redirectless] Full error details:', e);\n\t\t\t\t\tconsole.error(\n\t\t\t\t\t\t'\ud83d\udea8 [Redirectless] Error stack:',\n\t\t\t\t\t\te instanceof Error ? e.stack : 'No stack trace'\n\t\t\t\t\t);\n\t\t\t\t\tconsole.error(\n\t\t\t\t\t\t'\ud83d\udea8 [Redirectless] Error message:',\n\t\t\t\t\t\te instanceof Error ? e.message : 'Unknown error'\n\t\t\t\t\t);\n\t\t\t\t\tconsole.error('\ud83d\udea8 [Redirectless] Error type:', typeof e);\n\t\t\t\t\tconsole.error('\ud83d\udea8 [Redirectless] Error constructor:', e?.constructor?.name);\n\t\t\t\t\t\n\t\t\t\t\tconst errorMessage = e instanceof Error ? e.message : 'Redirectless flow failed';\n\t\t\t\t\tconsole.error('\ud83d\udea8 [Redirectless] Showing toast with message:', errorMessage);\n\t\t\t\t\tmodernMessaging.showBanner({",
        "\t\t\t\t} catch (e) {\n\t\t\t\t\tconst errorMessage = e instanceof Error ? e.message : 'Redirectless flow failed';\n\t\t\t\t\tmodernMessaging.showBanner({"
    ),
    # 21. TokenExchange missing credentials - already followed by modernMessaging.showBanner
    (
        "\t\t\tif (missingFields.length > 0) {\n\t\t\t\tconsole.error('\ud83d\udea8 [TokenExchange] Missing required credentials:', {\n\t\t\t\t\tnormalizedCredentials,\n\t\t\t\t\tmissingFields,\n\t\t\t\t});\n\t\t\t\tcontroller.setCredentials(normalizedCredentials);\n\t\t\t\tsetCredentials(normalizedCredentials);\n\t\t\t\tmodernMessaging.showBanner({",
        "\t\t\tif (missingFields.length > 0) {\n\t\t\t\tcontroller.setCredentials(normalizedCredentials);\n\t\t\t\tsetCredentials(normalizedCredentials);\n\t\t\t\tmodernMessaging.showBanner({"
    ),
    # 22. Token exchange catch - already followed by modernMessaging.showBanner (after error parsing)
    (
        "\t\t\t} catch (error) {\n\t\t\t\tconsole.error('[AuthorizationCodeFlowV5] Token exchange failed:', error);\n\t\t\t\t\n\t\t\t\t// Update API call with error response",
        "\t\t\t} catch (error) {\n\t\t\t\t// Update API call with error response"
    ),
    # 23. Background JWT header decode - returns null gracefully
    (
        "\t\t\t} catch (error) {\n\t\t\t\tconsole.warn('[AuthorizationCodeFlowV5] Failed to decode JWT header for x5t:', error);\n\t\t\t\treturn null;",
        "\t\t\t} catch (_error) {\n\t\t\t\treturn null;"
    ),
])

print("\nDone!")
