"""
Add missing Fi* icon imports to files that use them without importing.
Uses the @icons barrel alias (src/icons/index.ts) as the single source.

Skip:
  - src/icons/index.ts  (it IS the barrel)
  - commonImportsService.ts files (they re-export everything)
  - Any file that only mentions Fi* inside comments/strings
"""
import re, glob

FI_RE = re.compile(r'\bFi[A-Z][a-zA-Z]+\b')
IMPORT_FI_RE = re.compile(r'^import\b.*\bFi[A-Z]', re.MULTILINE)
# Line-level pattern to find actual JSX/JS usages (not purely in comments)
STRING_OR_COMMENT = re.compile(
    r'//[^\n]*|/\*.*?\*/|"[^"\\]*(?:\\.[^"\\]*)*"|\'[^\'\\]*(?:\\.[^\'\\]*)*\'',
    re.DOTALL
)

SKIP_FILES = {
    'src/icons/index.ts',
    'src/locked/email-v8/dependencies/services/commonImportsService.ts',
    'src/locked/fido2-v8/dependencies/services/commonImportsService.ts',
    'src/constants/errorMessages.ts',  # uses Fi* as values in type objects — would need different fix
}

def strip_non_code(text):
    """Remove strings and comments to avoid false positives."""
    return STRING_OR_COMMENT.sub(' ', text)

files = (
    glob.glob('src/**/*.tsx', recursive=True) +
    glob.glob('src/**/*.ts', recursive=True)
)

changed = []
for fp in files:
    if fp in SKIP_FILES:
        continue
    with open(fp) as f:
        text = f.read()

    code_only = strip_non_code(text)
    used = set(FI_RE.findall(code_only))
    if not used:
        continue

    # Find what's already imported
    imported = set()
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith('import') and 'Fi' in stripped:
            imported.update(FI_RE.findall(stripped))

    missing = sorted(used - imported)
    if not missing:
        continue

    # Build the new import line
    new_import = f"import {{ {', '.join(missing)} }} from '@icons';\n"

    # Insert after the last existing import line
    lines = text.splitlines(keepends=True)
    last_import_idx = -1
    for i, line in enumerate(lines):
        if line.strip().startswith('import '):
            last_import_idx = i
    
    if last_import_idx >= 0:
        lines.insert(last_import_idx + 1, new_import)
    else:
        lines.insert(0, new_import)

    new_text = ''.join(lines)
    with open(fp, 'w') as f:
        f.write(new_text)
    changed.append((fp, missing))

for fp, names in sorted(changed):
    print(f'  {fp}: +{len(names)} icons ({", ".join(names[:4])}{"..." if len(names) > 4 else ""})')

print(f'\nFixed {len(changed)} files.')
