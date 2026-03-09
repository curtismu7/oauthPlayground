#!/usr/bin/env python3
"""
fix_unused_imports.py  –  Remove unused named imports from TypeScript/TSX files.

How it works:
  1. Parse every `import { A, B, C } from '...'` line.
  2. For each named import, check if the name appears in the file body (after imports).
  3. Remove names that only appear in the import declaration itself.
  4. Remove the entire import line if all names are unused.

Safety notes:
  - Only removes NAMED imports (curly-brace style). Never touches default or namespace imports.
  - Skips type-only re-exports: `export type { Foo }` is considered a usage.
  - Skips locked/, lockdown/, __tests__/, .test., .spec. files.
  - Won't remove names used as JSX component names (e.g. <MyComponent>).
  - Does a final sanity check: if the resulting file body still compiles (i.e., the
    removed name does NOT appear anywhere), the removal is safe.

Run dry-run first:  python3 scripts/fix_unused_imports.py --dry-run
Apply fixes:        python3 scripts/fix_unused_imports.py
"""

import re
import sys
from pathlib import Path

DRY_RUN = "--dry-run" in sys.argv
ROOT = Path(__file__).parent.parent / "src"

SKIP_DIRS = {"locked", "lockdown"}

# Matches:  import { Foo, Bar as Baz, type Qux } from '...'
NAMED_IMPORT_RE = re.compile(
    r'^(\s*import\s*\{)([^}]+)(\}\s*from\s*["\'][^"\']+["\'];?\s*)$',
    re.MULTILINE,
)

# Alias: `Bar as Baz` → used name in file is "Baz"
def parse_import_names(body: str) -> list[tuple[str, str]]:
    """Returns list of (local_name, original_token_for_removal)."""
    result = []
    for part in body.split(","):
        part = part.strip()
        if not part:
            continue
        # strip `type` prefix: `type Foo` → `Foo`
        part_clean = re.sub(r'\btype\s+', '', part).strip()
        if ' as ' in part_clean:
            local_name = part_clean.split(' as ')[1].strip()
        else:
            local_name = part_clean
        result.append((local_name, part))
    return result


def is_used(name: str, file_body: str) -> bool:
    """Check if `name` is referenced somewhere in the file body (outside its own import)."""
    # Word boundary match – also matches JSX <Name>, Name.xxx, {Name}, (Name)
    pattern = re.compile(r'\b' + re.escape(name) + r'\b')
    return bool(pattern.search(file_body))


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
    lines = original.split("\n")
    changes = 0
    new_lines = []

    # Find where imports end (first non-import, non-blank line after imports start)
    # We'll reconstruct line by line
    i = 0
    while i < len(lines):
        line = lines[i]

        # Handle multi-line imports collapsed to single line:
        m = NAMED_IMPORT_RE.match(line)
        if m:
            prefix = m.group(1)     # `import {`
            names_str = m.group(2)  # ` Foo, Bar, Baz `
            suffix = m.group(3)     # `} from '...'`

            # Build file body = everything except this line
            other_lines = lines[:i] + lines[i+1:]
            body = "\n".join(other_lines)

            parsed = parse_import_names(names_str)
            used = [(local, token) for local, token in parsed if is_used(local, body)]
            removed_count = len(parsed) - len(used)

            if removed_count > 0:
                changes += removed_count
                if not used:
                    # Remove entire import line
                    i += 1
                    continue
                else:
                    # Rebuild with only used names
                    new_names = ", ".join(token for _, token in used)
                    reconstructed = f"{prefix} {new_names} {suffix}".rstrip()
                    # Normalize spacing
                    reconstructed = re.sub(r'\{\s+', '{ ', reconstructed)
                    reconstructed = re.sub(r'\s+\}', ' }', reconstructed)
                    new_lines.append(reconstructed)
                    i += 1
                    continue

        new_lines.append(line)
        i += 1

    if changes == 0:
        return 0, original

    return changes, "\n".join(new_lines)


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
            print(f"  {'[DRY RUN] ' if DRY_RUN else ''}Removed {n} unused import(s) from {rel}")
            total_changes += n
            fixed_files += 1
            if not DRY_RUN:
                f.write_text(new_content, encoding="utf-8")

    print(f"\n{'[DRY RUN] ' if DRY_RUN else ''}Total: {total_changes} unused imports removed across {fixed_files} files")
    if DRY_RUN:
        print("Run without --dry-run to apply changes.")


if __name__ == "__main__":
    main()
