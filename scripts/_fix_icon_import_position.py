"""
Move misplaced @icons import lines that ended up inside a multi-line import block.
Moves them to just after the closing line of that block.
"""
import re, glob

def fix_file(fp):
    with open(fp) as f:
        lines = f.readlines()

    changed = False
    i = 0
    result = []
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        # Detect start of multi-line import block (no closing on same line)
        if re.match(r'^import\s+(type\s+)?\{', stripped) and not re.search(r'\}\s*from\s*["\']', stripped):
            # Collect the block
            block = [line]
            j = i + 1
            injected_icons = []
            while j < len(lines):
                bl = lines[j]
                bstripped = bl.strip()
                # Check if this is the injected @icons import
                if bstripped.startswith('import') and '@icons' in bstripped:
                    injected_icons.append(bl)
                    changed = True
                    j += 1
                    continue
                block.append(bl)
                j += 1
                if re.search(r'\}\s*from\s*["\']', bstripped):
                    break
            result.extend(block)
            # Place the icon imports AFTER the closed block
            result.extend(injected_icons)
            i = j
        else:
            result.append(line)
            i += 1

    if changed:
        with open(fp, 'w') as f:
            f.writelines(result)
    return changed

files = (
    glob.glob('src/**/*.tsx', recursive=True) +
    glob.glob('src/**/*.ts', recursive=True)
)

fixed = [fp for fp in files if fix_file(fp)]
print(f'Fixed {len(fixed)} files:')
for fp in fixed:
    print(f'  {fp}')
