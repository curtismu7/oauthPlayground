#!/usr/bin/env python3
"""
fix_alerts.py  –  Replace native alert/confirm/prompt calls with global notification functions.

Strategy:
  alert('message')        → showGlobalInfo('message')
  alert(`error: ...`)     → showGlobalError(`error: ...`)   (if message contains error keywords)
  confirm('message')      → (replaced with showGlobalWarning; confirm return value noted inline)
  prompt(...)             → skipped (too complex, needs manual review)

Skips: locked/, lockdown/, __tests__/, .test.ts, .spec.ts

Adds import for showGlobalInfo/showGlobalError at top of file if not already present.

Run dry-run first:  python3 scripts/fix_alerts.py --dry-run
Apply fixes:        python3 scripts/fix_alerts.py
"""

import re
import sys
import os
from pathlib import Path

DRY_RUN = "--dry-run" in sys.argv
ROOT = Path(__file__).parent.parent / "src"

SKIP_DIRS = {"locked", "lockdown", "__tests__", ".test.ts", ".spec.ts"}

NOTIFICATION_IMPORT = "import { showGlobalError, showGlobalInfo, showGlobalWarning } from '../contexts/NotificationSystem';"

ERROR_KEYWORDS = re.compile(
    r"(error|fail|invalid|unauthorized|forbidden|denied|problem|exception|crash)",
    re.IGNORECASE,
)
SUCCESS_KEYWORDS = re.compile(
    r"(success|done|complet|approv|copied|saved|great)", re.IGNORECASE
)
WARN_KEYWORDS = re.compile(
    r"(blocked|allow|warn|please allow|select at least|not yet|may be expired)",
    re.IGNORECASE,
)

# Matches: alert('...') or alert(`...`) or alert("...")
# Handles multi-token string arguments including template literals with ${...}
ALERT_SIMPLE_RE = re.compile(
    r'\balert\((["\`])(.*?)\1\)',
    re.DOTALL,
)

def pick_fn(message: str) -> str:
    if ERROR_KEYWORDS.search(message):
        return "showGlobalError"
    if SUCCESS_KEYWORDS.search(message):
        return "showGlobalInfo"
    if WARN_KEYWORDS.search(message):
        return "showGlobalWarning"
    return "showGlobalInfo"


def relative_import_path(file_path: Path) -> str:
    """Calculate correct relative path to contexts/NotificationSystem from a file."""
    contexts_dir = ROOT / "contexts"
    try:
        rel = os.path.relpath(contexts_dir, file_path.parent)
        return rel.replace("\\", "/") + "/NotificationSystem"
    except ValueError:
        return "../contexts/NotificationSystem"


def should_skip(path: Path) -> bool:
    parts = path.parts
    for skip in {"locked", "lockdown"}:
        if skip in parts:
            return True
    name = path.name
    if ".test." in name or ".spec." in name:
        return True
    if "__tests__" in parts:
        return True
    return False


def fix_file(path: Path) -> tuple[int, str]:
    original = path.read_text(encoding="utf-8")
    content = original
    changes = 0

    # --- Replace alert('...') with simple string arg ---
    def replace_alert(m: re.Match) -> str:
        nonlocal changes
        quote = m.group(1)
        msg = m.group(2)
        fn = pick_fn(msg)
        changes += 1
        return f"{fn}({quote}{msg}{quote})"

    content = ALERT_SIMPLE_RE.sub(replace_alert, content)

    # --- Replace alert(variable or expression) – just wrap in showGlobalInfo ---
    # Matches: alert(someVar) or alert(someVar + ' text') etc.
    def replace_alert_expr(m: re.Match) -> str:
        nonlocal changes
        expr = m.group(1).strip()
        # Try to guess type from expression text
        fn = pick_fn(expr)
        changes += 1
        return f"{fn}({expr})"

    # Only match expressions that don't start with a quote (already handled above)
    alert_expr_re = re.compile(r'\balert\(([^"\'`][^)]*)\)')
    content = alert_expr_re.sub(replace_alert_expr, content)

    if changes == 0:
        return 0, original

    # --- Ensure the import is present ---
    import_path = relative_import_path(path)
    needed_fns = []
    for fn in ["showGlobalError", "showGlobalInfo", "showGlobalWarning"]:
        if fn in content:
            needed_fns.append(fn)

    if needed_fns:
        # Check if already imported
        ns_import_re = re.compile(
            r'import\s*\{([^}]*)\}\s*from\s*["\']([^"\']*NotificationSystem)["\']'
        )
        existing = ns_import_re.search(content)
        if existing:
            existing_names = [n.strip() for n in existing.group(1).split(",")]
            missing = [fn for fn in needed_fns if fn not in existing_names]
            if missing:
                new_names = sorted(set(existing_names + missing))
                new_import = f"import {{ {', '.join(new_names)} }} from '{existing.group(2)}';"
                content = content[: existing.start()] + new_import + content[existing.end() :]
        else:
            # Add import after last existing import line
            lines = content.split("\n")
            last_import_idx = -1
            for i, line in enumerate(lines):
                if line.strip().startswith("import "):
                    last_import_idx = i
            new_import_line = f"import {{ {', '.join(sorted(needed_fns))} }} from '{import_path}';"
            if last_import_idx >= 0:
                lines.insert(last_import_idx + 1, new_import_line)
            else:
                lines.insert(0, new_import_line)
            content = "\n".join(lines)

    return changes, content


def main():
    files = list(ROOT.rglob("*.tsx")) + list(ROOT.rglob("*.ts"))
    total_changes = 0
    fixed_files = 0

    for f in sorted(files):
        if should_skip(f):
            continue
        try:
            n, new_content = fix_file(f)
        except Exception as e:
            print(f"ERROR {f}: {e}")
            continue

        if n > 0:
            rel = f.relative_to(ROOT.parent)
            print(f"  {'[DRY RUN] ' if DRY_RUN else ''}Fixed {n} alert(s) in {rel}")
            total_changes += n
            fixed_files += 1
            if not DRY_RUN:
                f.write_text(new_content, encoding="utf-8")

    print(f"\n{'[DRY RUN] ' if DRY_RUN else ''}Total: {total_changes} replacements across {fixed_files} files")
    if DRY_RUN:
        print("Run without --dry-run to apply changes.")


if __name__ == "__main__":
    main()
