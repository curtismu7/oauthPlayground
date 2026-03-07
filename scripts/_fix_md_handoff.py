#!/usr/bin/env python3
"""
Fix markdownlint issues in STANDARDIZATION_HANDOFF.md.
Handles all four rule types in a single careful pass.
"""
import re

path = 'A-Migration/STANDARDIZATION_HANDOFF.md'
with open(path, encoding='utf-8') as f:
    original = f.readlines()

def is_blank(line): return line.strip() == ''
def is_heading(line): return bool(re.match(r'^#{1,6} ', line))
def is_fence(line): return bool(re.match(r'^\s*```', line))
def is_list_item(line): return bool(re.match(r'^(\s*[-*+]|\s*\d+\.)\s', line))

# Classify each line as inside/outside a code block
in_fence = False
fence_state = []  # True = inside code block
for line in original:
    fence_state.append(in_fence)
    if is_fence(line):
        in_fence = not in_fence

# Now build the new file line by line
result = []
n = len(original)

for i, line in enumerate(original):
    inside = fence_state[i]
    is_closing_fence = inside and is_fence(line)  # closing ``` while inside block

    if inside and not is_closing_fence:
        # Inside code block body — emit as-is
        result.append(line)
        continue

    # === Opening fence or content outside code blocks ===

    # MD040: bare opening fence with no language
    if not inside and is_fence(line) and re.match(r'^\s*```\s*$', line):
        line = line.replace('```', '```text', 1)

    # MD031: blank line BEFORE opening fence
    if not inside and is_fence(line):
        if result and not is_blank(result[-1]):
            result.append('\n')

    # MD032: blank line BEFORE first list item
    if not inside and is_list_item(line):
        if result and not is_blank(result[-1]) and not is_heading(result[-1]):
            result.append('\n')

    # Append the current line
    result.append(line)

    # === Post-line insertion rules ===

    # MD022: blank line AFTER heading (if next is not blank)
    if not inside and is_heading(line):
        if i + 1 < n and not is_blank(original[i + 1]):
            result.append('\n')

    # MD031: blank line AFTER closing fence
    if is_closing_fence:
        if i + 1 < n and not is_blank(original[i + 1]):
            result.append('\n')

    # MD032: blank line AFTER last list item (next is not blank, not list item)
    if not inside and is_list_item(line):
        if i + 1 < n and not is_blank(original[i + 1]) and not is_list_item(original[i + 1]):
            result.append('\n')

# Collapse triple+ blank lines to single
result2 = []
blank_count = 0
for line in result:
    if is_blank(line):
        blank_count += 1
        if blank_count <= 1:
            result2.append(line)
    else:
        blank_count = 0
        result2.append(line)

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(result2)

print(f'Lines: {len(original)} \u2192 {len(result2)}')
print('Done.')


path = 'A-Migration/STANDARDIZATION_HANDOFF.md'
with open(path, encoding='utf-8') as f:
    lines = f.readlines()

def is_blank(line):
    return line.strip() == ''

def is_heading(line):
    return re.match(r'^#{1,6} ', line)

def is_fence_start(line):
    return re.match(r'^```', line.strip())

def is_fence_open(line):
    """Opening fence (optionally with language)."""
    return re.match(r'^```', line.strip()) and not re.match(r'^```\s*$', line.strip()) or re.match(r'^```\s*$', line.strip())

def is_list_item(line):
    return re.match(r'^(\s*[-*+]|\s*\d+\.)\s', line)

def is_blockquote(line):
    return line.startswith('>')

result = []
i = 0
in_code_block = False

while i < len(lines):
    line = lines[i]
    stripped = line.rstrip('\n')

    # Track code block state
    if is_fence_start(line):
        in_code_block = not in_code_block

    if not in_code_block:
        # MD040: bare ``` opening fences (no language)
        if re.match(r'^```\s*$', stripped):
            line = '```text\n'

        # MD031: blank line BEFORE opening fence (if prev line is not blank and not in code)
        if re.match(r'^```', line.strip()) and in_code_block and result and not is_blank(result[-1]):
            result.append('\n')

        # MD022: blank line AFTER heading
        if is_heading(line) and i + 1 < len(lines) and not is_blank(lines[i + 1]):
            result.append(line)
            result.append('\n')
            i += 1
            continue

    else:
        # We're inside a code block. After the closing ```, check if blank line follows.
        if is_fence_start(line) and not in_code_block:
            # This is a closing fence (in_code_block was toggled at top)
            # Already handled above by toggling state - but let's check next line
            result.append(line)
            if i + 1 < len(lines) and not is_blank(lines[i + 1]):
                result.append('\n')
            i += 1
            continue

    result.append(line)
    i += 1

# Second pass: MD031 - blank after closing fences
result2 = []
in_code_block = False
for i, line in enumerate(result):
    if re.match(r'^```', line.strip()):
        if in_code_block:
            # This is a closing fence
            in_code_block = False
            result2.append(line)
            # Add blank line after closing fence if next line is not blank
            if i + 1 < len(result) and not is_blank(result[i + 1]):
                result2.append('\n')
            continue
        else:
            in_code_block = True
    result2.append(line)

# Third pass: MD032 - blank lines around list blocks
result3 = []
in_code_block = False
for i, line in enumerate(result2):
    if re.match(r'^```', line.strip()):
        in_code_block = not in_code_block
    
    if not in_code_block and is_list_item(line):
        # Before first list item: add blank line if prev isn't blank and isn't a heading
        if result3 and not is_blank(result3[-1]) and not is_heading(result3[-1]):
            result3.append('\n')
    
    result3.append(line)
    
    if not in_code_block and is_list_item(line):
        # After last list item: add blank if next isn't list/blank
        if i + 1 < len(result2) and not is_blank(result2[i + 1]) and not is_list_item(result2[i + 1]):
            result3.append('\n')

# Collapse multiple consecutive blank lines to one
result_final = []
prev_blank = False
for line in result3:
    is_this_blank = is_blank(line)
    if is_this_blank and prev_blank:
        continue  # Skip duplicate blanks
    result_final.append(line)
    prev_blank = is_this_blank

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(result_final)

print(f'Done. Lines: {len(lines)} -> {len(result_final)}')
