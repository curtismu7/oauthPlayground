#!/usr/bin/env python3
"""
Migrate toastV8 calls to V9 Modern Messaging (modernMessaging).

Mapping:
  toastV8.success(msg)        → modernMessaging.showFooterMessage({ type: 'info', message: MSG, duration: 3000 })
  toastV8.info(msg)           → modernMessaging.showFooterMessage({ type: 'info', message: MSG, duration: 3000 })
  toastV8.error(msg)          → modernMessaging.showBanner({ type: 'error', title: 'Error', message: MSG, dismissible: true })
  toastV8.warning(msg)        → modernMessaging.showBanner({ type: 'warning', title: 'Warning', message: MSG, dismissible: true })
  toastV8.warn(msg)           → same as warning
  toastV8.formattedSuccess(…) → showFooterMessage
  toastV8.formattedError(…)   → showBanner error
  toastV8.formattedWarning(…) → showBanner warning
  toastV8.formattedInfo(…)    → showFooterMessage
  zero-arg convenience methods → fixed messages
  toastV8.stepCompleted(n)    → showFooterMessage with step number
"""

import re
import sys
import os
from pathlib import Path

ROOT = Path("/Users/cmuir/P1Import-apps/oauth-playground/src")

# Files to migrate (exclude locked/ and __tests__)
TARGET_DIRS = [
    ROOT / "pages",
    ROOT / "components",
    ROOT / "services",
    ROOT / "v8",
    ROOT / "v8u",
    ROOT / "hooks",
    ROOT / "utils",
    ROOT / "contexts",
]

# Zero-arg convenience methods → (type, title, message)
ZERO_ARG_MAP = {
    "tokenExchangeSuccess":  ("footer", None, "Tokens exchanged successfully"),
    "tokenIntrospectionSuccess": ("footer", None, "Token introspection completed successfully"),
    "userInfoFetched":       ("footer", None, "User information retrieved successfully"),
    "appDiscoverySuccess":   ("footer", None, "Application discovered successfully"),
    "configurationChecked":  ("footer", None, "Configuration check completed"),
    "flowCompleted":         ("footer", None, "Flow completed successfully"),
    "flowReset":             ("footer", None, "Flow reset"),
    "credentialsSaved":      ("footer", None, "Credentials saved successfully"),
    "credentialsLoaded":     ("footer", None, "Credentials loaded successfully"),
    "pkceGenerated":         ("footer", None, "PKCE parameters generated"),
    "authUrlGenerated":      ("footer", None, "Authorization URL generated"),
    "discoveryEndpointLoaded": ("footer", None, "Discovery endpoint loaded"),
    "environmentIdExtracted": ("footer", None, "Environment ID extracted"),
    "mfaDeviceRegistered":   ("footer", None, "MFA device registered successfully"),
    "mfaAuthenticationSuccess": ("footer", None, "MFA authentication successful"),
    "copiedToClipboard":     ("footer", None, "Copied to clipboard"),
    "scopeRequired":         ("banner_warning", "Warning", "Required scope is missing"),
    "validationError":       ("banner_error", "Validation Error", "Validation failed"),
    "networkError":          ("banner_error", "Network Error", "A network error occurred"),
    "processing":            ("footer", None, None),  # has arg
    "unifiedFlowSuccess":    ("footer", None, None),  # has optional arg
    "unifiedFlowError":      ("banner_error", "Error", None),  # has optional arg
    "mfaOperationError":     ("banner_error", "MFA Error", None),  # has optional arg
}

# Import old → new
OLD_IMPORT_RE = re.compile(
    r"import\s*\{[^}]*\btoastV8\b[^}]*\}\s*from\s*['\"]@/v8/utils/toastNotificationsV8['\"];?",
)
NEW_IMPORT = "import { modernMessaging } from '@/services/v9/V9ModernMessagingService';"


def extract_args(text, start):
    """Extract content inside balanced parentheses starting at index `start` (the opening paren).
    Returns (inner_content, end_index) where end_index is right after closing paren."""
    assert text[start] == '(', f"Expected '(' at position {start}, got '{text[start]}'"
    depth = 0
    i = start
    in_single = False
    in_double = False
    in_template = False
    template_depth = 0
    while i < len(text):
        c = text[i]
        prev = text[i-1] if i > 0 else ''
        if c == '\\' and (in_single or in_double or in_template):
            i += 2
            continue
        if c == "'" and not in_double and not in_template:
            in_single = not in_single
        elif c == '"' and not in_single and not in_template:
            in_double = not in_double
        elif c == '`' and not in_single and not in_double:
            in_template = not in_template
            if in_template:
                template_depth += 1
            else:
                template_depth -= 1
        elif not in_single and not in_double and not in_template:
            if c == '(':
                depth += 1
            elif c == ')':
                depth -= 1
                if depth == 0:
                    return text[start+1:i], i+1
        i += 1
    return text[start+1:], len(text)


def make_footer(msg_expr, duration=3000):
    return f"modernMessaging.showFooterMessage({{ type: 'info', message: {msg_expr}, duration: {duration} }})"


def make_banner_error(msg_expr, title="Error"):
    return f"modernMessaging.showBanner({{ type: 'error', title: '{title}', message: {msg_expr}, dismissible: true }})"


def make_banner_warning(msg_expr, title="Warning"):
    return f"modernMessaging.showBanner({{ type: 'warning', title: '{title}', message: {msg_expr}, dismissible: true }})"


def make_banner_info(msg_expr, title="Information"):
    return f"modernMessaging.showBanner({{ type: 'info', title: '{title}', message: {msg_expr}, dismissible: true }})"


def replace_toast_calls(content):
    """Replace all toastV8.method(...) calls in content string."""
    result = []
    i = 0
    pattern = re.compile(r'toastV8\.([a-zA-Z]+)\s*\(')
    
    while i < len(content):
        m = pattern.search(content, i)
        if not m:
            result.append(content[i:])
            break
        
        # Append everything up to the match
        result.append(content[i:m.start()])
        method = m.group(1)
        paren_start = m.end() - 1  # position of '('
        
        args_content, after = extract_args(content, paren_start)
        args_stripped = args_content.strip()
        
        replacement = None
        
        # ---- Core 4 methods ----
        if method == 'success':
            if args_stripped:
                # May have second arg: toastV8.success('msg', { duration: N })
                # Find first comma not inside strings/parens
                first_arg = get_first_arg(args_content)
                opts = args_content[len(first_arg):].strip().lstrip(',').strip()
                duration = 3000
                if opts:
                    dur_m = re.search(r'duration\s*:\s*(\d+)', opts)
                    if dur_m:
                        duration = int(dur_m.group(1))
                replacement = make_footer(first_arg.strip(), duration)
            else:
                replacement = make_footer("''", 3000)

        elif method == 'error':
            if args_stripped:
                first_arg = get_first_arg(args_content)
                replacement = make_banner_error(first_arg.strip())
            else:
                replacement = make_banner_error("'An error occurred'")

        elif method in ('warning', 'warn'):
            if args_stripped:
                first_arg = get_first_arg(args_content)
                replacement = make_banner_warning(first_arg.strip())
            else:
                replacement = make_banner_warning("'Warning'")

        elif method == 'info':
            if args_stripped:
                first_arg = get_first_arg(args_content)
                replacement = make_footer(first_arg.strip(), 3000)
            else:
                replacement = make_footer("''", 3000)

        # ---- formatted variants (first arg is typically title/header, second is message) ----
        elif method in ('formattedSuccess', 'formattedInfo'):
            if args_stripped:
                first_arg = get_first_arg(args_content)
                replacement = make_footer(first_arg.strip(), 3000)
            else:
                replacement = make_footer("''", 3000)

        elif method in ('formattedError',):
            if args_stripped:
                first_arg = get_first_arg(args_content)
                replacement = make_banner_error(first_arg.strip())
            else:
                replacement = make_banner_error("'An error occurred'")

        elif method in ('formattedWarning',):
            if args_stripped:
                first_arg = get_first_arg(args_content)
                replacement = make_banner_warning(first_arg.strip())
            else:
                replacement = make_banner_warning("'Warning'")

        # ---- stepCompleted(n) ----
        elif method == 'stepCompleted':
            if args_stripped:
                replacement = make_footer(f"`Step ${{{args_stripped}}} completed`", 3000)
            else:
                replacement = make_footer("'Step completed'", 3000)

        # ---- processing(operation) ----
        elif method == 'processing':
            if args_stripped:
                first_arg = get_first_arg(args_content).strip()
                replacement = make_footer(f"`${{{first_arg}}}…`", 3000)
            else:
                replacement = make_footer("'Processing…'", 3000)

        # ---- unifiedFlowSuccess/unifiedFlowError ----
        elif method == 'unifiedFlowSuccess':
            msg = args_stripped or "'Flow completed successfully'"
            if args_stripped:
                first_arg = get_first_arg(args_content).strip()
                replacement = make_footer(first_arg, 3000)
            else:
                replacement = make_footer("'Flow completed successfully'", 3000)

        elif method == 'unifiedFlowError':
            if args_stripped:
                first_arg = get_first_arg(args_content).strip()
                replacement = make_banner_error(first_arg)
            else:
                replacement = make_banner_error("'Flow error'")

        elif method == 'mfaOperationError':
            if args_stripped:
                first_arg = get_first_arg(args_content).strip()
                replacement = make_banner_error(first_arg, "MFA Error")
            else:
                replacement = make_banner_error("'MFA operation failed'", "MFA Error")

        # ---- Zero-arg convenience methods ----
        elif method in ZERO_ARG_MAP:
            info = ZERO_ARG_MAP[method]
            kind, title, msg = info
            if msg is None:
                # has arg - use the first arg as message
                if args_stripped:
                    first_arg = get_first_arg(args_content).strip()
                    msg_expr = first_arg
                else:
                    msg_expr = f"'{method}'"
            else:
                msg_expr = f"'{msg}'"
            
            if kind == 'footer':
                replacement = make_footer(msg_expr, 3000)
            elif kind == 'banner_error':
                replacement = make_banner_error(msg_expr, title or "Error")
            elif kind == 'banner_warning':
                replacement = make_banner_warning(msg_expr, title or "Warning")
            else:
                replacement = make_footer(msg_expr, 3000)

        # ---- Unknown method - keep as comment + footer fallback ----
        else:
            if args_stripped:
                first_arg = get_first_arg(args_content).strip()
                replacement = make_footer(first_arg, 3000)
            else:
                replacement = make_footer(f"'[{method}]'", 3000)

        result.append(replacement)
        i = after
    
    return ''.join(result)


def get_first_arg(args_content):
    """Get the first argument from a comma-separated argument list,
    respecting balanced parens, strings, and template literals."""
    depth = 0
    in_single = False
    in_double = False
    in_template = False
    
    for idx, c in enumerate(args_content):
        if c == '\\' and (in_single or in_double or in_template):
            continue
        if c == "'" and not in_double and not in_template:
            in_single = not in_single
        elif c == '"' and not in_single and not in_template:
            in_double = not in_double
        elif c == '`' and not in_single and not in_double:
            in_template = not in_template
        elif not in_single and not in_double and not in_template:
            if c in ('(', '[', '{'):
                depth += 1
            elif c in (')', ']', '}'):
                depth -= 1
            elif c == ',' and depth == 0:
                return args_content[:idx]
    return args_content


def update_import(content):
    """Replace toastV8 import with modernMessaging import."""
    # Already has modernMessaging import?
    has_modern = 'modernMessaging' in content and 'V9ModernMessagingService' in content
    has_toast_import = OLD_IMPORT_RE.search(content)
    
    if has_toast_import:
        if has_modern:
            # Just remove the toastV8 import
            content = OLD_IMPORT_RE.sub('', content)
        else:
            # Replace with modernMessaging import
            content = OLD_IMPORT_RE.sub(NEW_IMPORT, content)
    
    # Handle relative import variants too
    content = re.sub(
        r"import\s*\{[^}]*\btoastV8\b[^}]*\}\s*from\s*['\"][^'\"]*toastNotificationsV8['\"];?\n?",
        NEW_IMPORT + "\n" if not has_modern else "",
        content
    )
    
    # Clean up double blank lines from removed import
    content = re.sub(r'\n{3,}', '\n\n', content)
    
    return content


def process_file(filepath):
    path = Path(filepath)
    
    # Skip locked and test files
    parts = str(path).split(os.sep)
    if 'locked' in parts or '__tests__' in parts:
        return False
    
    content = path.read_text(encoding='utf-8')
    
    # Only process files that have toastV8 usage
    if 'toastV8' not in content:
        return False
    
    original = content
    
    # Step 1: Replace import
    content = update_import(content)
    
    # Step 2: Replace calls
    content = replace_toast_calls(content)
    
    if content != original:
        path.write_text(content, encoding='utf-8')
        print(f"  Updated: {path.relative_to(ROOT.parent)}")
        return True
    return False


def find_files():
    files = []
    for d in TARGET_DIRS:
        for ext in ('*.tsx', '*.ts'):
            files.extend(d.rglob(ext))
    return sorted(set(files))


if __name__ == '__main__':
    files = find_files()
    updated = 0
    for f in files:
        if process_file(f):
            updated += 1
    print(f"\nDone. Updated {updated} files.")
