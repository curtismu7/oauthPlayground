#!/usr/bin/env python3
"""
Replace @icons imports with emoji equivalents across 29 files listed in
REMAINING_ICONS_CLEANUP_LIST.md

Handles:
  1. Single-line self-closing: <FiIcon /> → <span>emoji</span>
  2. Single-line with inline props: <FiIcon size={16} /> → <span style={{fontSize:'16px'}}>emoji</span>
     (props are dropped for inline — emoji is already self-describing)
  3. Multi-line with props block: <FiIcon\n  style={{...}}\n/> → <span\n  style={{...}}\n>emoji</span>
  4. Remove the @icons import line entirely
"""

import re
import sys

EMOJI_MAP = {
    'FiAlertCircle':    '⚠️',
    'FiAlertTriangle':  '⚠️',
    'FiArrowRight':     '➡️',
    'FiBook':           '📚',
    'FiBookOpen':       '📖',
    'FiCheckCircle':    '✅',
    'FiChevronDown':    '🔽',
    'FiChevronRight':   '▶️',
    'FiClock':          '⏰',
    'FiCopy':           '📋',
    'FiExternalLink':   '🔗',
    'FiGlobe':          '🌐',
    'FiInfo':           'ℹ️',
    'FiKey':            '🔑',
    'FiLink':           '🔗',
    'FiLoader':         '⏳',
    'FiLock':           '🔒',
    'FiPackage':        '📦',
    'FiPlay':           '▶️',
    'FiRefreshCw':      '🔄',
    'FiSend':           '➡️',
    'FiSettings':       '⚙️',
    'FiShield':         '🛡️',
    'FiSmartphone':     '📱',
    'FiTarget':         '🎯',
    'FiTool':           '🔧',
    'FiTrash2':         '🗑️',
    'FiTrendingUp':     '📈',
    'FiUnlock':         '🔓',
    'FiUpload':         '⬆️',
    'FiUser':           '👤',
    'FiUsers':          '👥',
    'FiX':              '❌',
    'FiXCircle':        '❌',
    'FiZap':            '⚡',
}

FILES = [
    'src/pages/JWKSTroubleshooting.tsx',
    'src/pages/PingOneAuditActivities.tsx',
    'src/pages/AIIdentityArchitectures.tsx',
    'src/pages/EnvironmentManagementPageV8.tsx',
    'src/pages/PingAIResources.tsx',
    'src/pages/PingOneIdentityMetrics.tsx',
    'src/pages/flows/SAMLServiceProviderFlowV1.tsx',
    'src/pages/CompactAppPickerDemo.tsx',
    'src/pages/DpopAuthorizationCodeFlowV8.tsx',
    'src/pages/ComprehensiveOAuthEducation.tsx',
    'src/pages/PingProductComparison.tsx',
    'src/pages/flows/DPoPFlow.tsx',
    'src/pages/flows/AdvancedOAuthParametersDemoFlow.tsx',
    'src/pages/flows/OAuth2ResourceOwnerPasswordFlow.tsx',
    'src/pages/PingOneScopesReference.tsx',
    'src/pages/flows/JWTBearerFlow.tsx',
    'src/pages/flows/CIBAFlowV9.tsx',
    'src/pages/flows/RedirectlessFlowV9_Real.tsx',
    'src/pages/flows/OAuth2CompliantAuthorizationCodeFlow.tsx',
    'src/pages/flows/OAuthImplicitFlowCompletion.tsx',
    'src/pages/PingOneMockFeatures.tsx',
    'src/pages/HybridCallback.tsx',
    'src/pages/EnvironmentIdInputDemo.tsx',
    'src/pages/flows/v9/RARFlowV9.tsx',
    'src/pages/flows/v9/OAuthAuthorizationCodeFlowV9.tsx',
    'src/pages/flows/v9/ClientCredentialsFlowV9.tsx',
    'src/pages/flows/v9/MFAWorkflowLibraryFlowV9.tsx',
    'src/pages/flows/v9/ImplicitFlowV9.tsx',
    'src/pages/flows/v9/OAuthAuthorizationCodeFlowV9_Condensed.tsx',
]


def replace_icons_in_content(content: str) -> tuple[str, int]:
    """Return (modified_content, replacement_count)."""
    changes = 0

    # Step 1: Remove @icons import lines
    def remove_icons_import(m):
        nonlocal changes
        changes += 1
        return ''

    content = re.sub(
        r'^import\s*\{[^}]*\}\s*from\s*[\'"]@icons[\'"]\s*;\s*\n?',
        remove_icons_import,
        content,
        flags=re.MULTILINE,
    )

    # Step 2: Pre-pass — remove icon tag when its emoji already follows immediately on
    # the same line (e.g. <FiBook />📚 or <FiSettings />⚙️).
    # This avoids doubling up when the emoji was already manually placed.
    def remove_icon_if_emoji_follows(m):
        nonlocal changes
        icon_name = m.group(1)
        following = m.group(2)
        emoji = EMOJI_MAP.get(icon_name)
        if emoji and following.startswith(emoji):
            changes += 1
            return following  # drop the icon tag, keep what follows
        return m.group(0)  # leave unchanged for later passes

    content = re.sub(
        r'<(Fi\w+)\s*/>([\S\s]{0,4})',
        remove_icon_if_emoji_follows,
        content,
    )

    # Step 3: Multi-line icon tags with real props block:
    # <FiIconName\n  style={{...}}\n/> → <span\n  style={{...}}\n>emoji</span>
    # Only matches when there is a newline inside the tag (true multi-line).
    def replace_multiline(m):
        nonlocal changes
        icon_name = m.group(1)
        props_block = m.group(2)  # newline + indented props
        emoji = EMOJI_MAP.get(icon_name, f'[{icon_name}]')
        changes += 1
        return f'<span{props_block}>{emoji}</span>'

    content = re.sub(
        r'<(Fi\w+)(\s*\n[^/]+?)/>',
        replace_multiline,
        content,
        flags=re.DOTALL,
    )

    # Step 4: Remaining single-line <FiIconName /> and <FiIconName prop=x />
    def replace_simple(m):
        nonlocal changes
        icon_name = m.group(1)
        emoji = EMOJI_MAP.get(icon_name, f'[{icon_name}]')
        changes += 1
        return f'<span>{emoji}</span>'

    content = re.sub(
        r'<(Fi\w+)[^>]*/>\s*',
        replace_simple,
        content,
    )

    # Step 5: Dedup — remove <span>emoji</span> when followed (possibly across whitespace)
    # by the same emoji. Happens when icon was already accompanied by an emoji sibling.
    for emoji in set(EMOJI_MAP.values()):
        # same line or next line: <span>X</span>  X text  →  X text
        escaped = re.escape(emoji)
        content = re.sub(
            rf'<span>{escaped}</span>([ \t\n]{{0,40}}){escaped}',
            rf'{emoji}\1',
            content,
        )

    return content, changes


def process_file(path: str, dry_run: bool = False) -> bool:
    try:
        with open(path, 'r', encoding='utf-8') as f:
            original = f.read()
    except FileNotFoundError:
        print(f'  SKIP (not found): {path}')
        return False

    # Quick check — does file have @icons import?
    if '@icons' not in original:
        print(f'  SKIP (no @icons): {path}')
        return False

    modified, count = replace_icons_in_content(original)

    if modified == original:
        print(f'  NO CHANGE: {path}')
        return False

    if dry_run:
        print(f'  DRY RUN ({count} replacements): {path}')
        return True

    with open(path, 'w', encoding='utf-8') as f:
        f.write(modified)

    print(f'  FIXED ({count} replacements): {path}')
    return True


def main():
    dry_run = '--dry-run' in sys.argv
    if dry_run:
        print('=== DRY RUN MODE ===')

    fixed = 0
    for filepath in FILES:
        if process_file(filepath, dry_run=dry_run):
            fixed += 1

    print(f'\nDone. {fixed}/{len(FILES)} files {"would be" if dry_run else "were"} modified.')


if __name__ == '__main__':
    main()
