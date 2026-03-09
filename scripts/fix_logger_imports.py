"""Fix ALL broken utils/logger imports by computing correct relative path per file depth."""
import os
import re

src_root = "/Users/cmuir/P1Import-apps/oauth-playground/src"

fixed = 0
for dirpath, dirs, filenames in os.walk(src_root):
    dirs[:] = [d for d in dirs if d not in ('locked', 'lockdown', 'node_modules')]

    for fname in filenames:
        if not (fname.endswith('.ts') or fname.endswith('.tsx')):
            continue

        fpath = os.path.join(dirpath, fname)
        rel = os.path.relpath(fpath, src_root)  # e.g. "v8/components/Foo.tsx"
        parts = rel.split('/')
        depth = len(parts) - 1  # number of directory levels from src/

        correct_prefix = "./" if depth == 0 else "../" * depth
        correct_import = f"from '{correct_prefix}utils/logger'"

        with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        pattern = r"""from ['"]([./]+utils/logger)['"]"""
        matches = re.findall(pattern, content)
        if not matches:
            continue

        needs_fix = False
        new_content = content
        for m in matches:
            if f"from '{m}'" != correct_import and f'from "{m}"' != correct_import:
                print(f"  {rel}: '{m}' -> '{correct_prefix}utils/logger'")
                new_content = new_content.replace(f"from '{m}'", correct_import)
                new_content = new_content.replace(f'from "{m}"', correct_import)
                needs_fix = True

        if needs_fix:
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            fixed += 1

print(f"\nTotal files fixed: {fixed}")
