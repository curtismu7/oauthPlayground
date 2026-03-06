#!/usr/bin/env python3
"""Fix broken h3 and text-center styling in WorkerTokenModalV9Styled.tsx"""
path = '/Users/cmuir/P1Import-apps/oauth-playground/src/components/WorkerTokenModalV9Styled.tsx'

with open(path, 'r') as f:
    lines = f.readlines()

print(f"Original line count: {len(lines)}")

T = '\t'

# ------- Fix 1: Replace broken h3 (lines 254-262, 0-indexed 253-261) -------
# The h3 starts at line 254 with <h3> but style is never closed, no >, no text, no </h3>
# Line 262 is empty (0-indexed: 261), and line 263 has {/* Search Box */}
# We replace lines 253..261 (inclusive) with a proper h3

h3_replacement = [
    T*7 + '<h3\n',
    T*8 + 'className="text-lg font-semibold mb-4"\n',
    T*8 + 'style={{\n',
    T*9 + "color: 'var(--ping-text-color, #111827)',\n",
    T*9 + "fontSize: '0.9375rem',\n",
    T*9 + 'fontWeight: 600,\n',
    T*9 + "marginBottom: '0.75rem',\n",
    T*9 + 'marginTop: 0,\n',
    T*8 + '}}\n',
    T*7 + '>\n',
    T*8 + 'Applications\n',
    T*7 + '</h3>\n',
]

# Validate we're replacing the right lines
broken_start = lines[253]  # Should be <h3 \n
if '<h3' not in broken_start:
    print(f"ERROR: Expected <h3 at line 254, got: {repr(broken_start)}")
    exit(1)

print(f"Replacing broken h3 (lines 254-262) with {len(h3_replacement)} proper lines")
new_lines = lines[:253] + h3_replacement + lines[262:]
print(f"After h3 fix: {len(new_lines)} lines")

# ------- Fix 2: Add textAlign: 'center' to loading state text-center div -------
def find_line_after(lines_list, search_text, context_text, max_back=10):
    """Find a line containing search_text that appears before context_text"""
    ctx_idx = next((i for i, l in enumerate(lines_list) if context_text in l), -1)
    if ctx_idx < 0:
        return -1
    for j in range(ctx_idx - max_back, ctx_idx):
        if search_text in lines_list[j]:
            return j
    return -1

# Add textAlign to loading state (before "Loading applications...")
loading_padding_idx = find_line_after(new_lines, "padding: 'var(--ping-spacing-md, 1rem)',", "Loading applications...")
if loading_padding_idx >= 0:
    new_lines.insert(loading_padding_idx + 1, T*11 + "textAlign: 'center',\n")
    print(f"Added textAlign for loading state after line {loading_padding_idx + 1}")
else:
    print("WARNING: Could not find loading state padding line")

# ------- Fix 3: Add textAlign: 'center' to no-apps text-center div -------
no_apps_padding_idx = find_line_after(new_lines, "padding: 'var(--ping-spacing-md, 1rem)',", "No applications found")
if no_apps_padding_idx >= 0:
    new_lines.insert(no_apps_padding_idx + 1, T*11 + "textAlign: 'center',\n")
    print(f"Added textAlign for no-apps state after line {no_apps_padding_idx + 1}")
else:
    print("WARNING: Could not find no-apps state padding line")

# ------- Fix 4: Add style to text-center py-8 div (no-token state) -------
py8_idx = next((i for i, l in enumerate(new_lines) if 'className="text-center py-8">' in l), -1)
if py8_idx >= 0:
    new_lines[py8_idx] = new_lines[py8_idx].replace(
        'className="text-center py-8">',
        "className=\"text-center py-8\" style={{ textAlign: 'center', padding: '2rem 0' }}>"
    )
    print(f"Added inline style to text-center py-8 at line {py8_idx + 1}")
else:
    print("WARNING: text-center py-8 not found or already has style")

with open(path, 'w') as f:
    f.writelines(new_lines)

print(f"Done! Final line count: {len(new_lines)}")
print("Verification:")
for i, l in enumerate(new_lines[252:270], 253):
    print(f"  {i}: {repr(l.rstrip())[:100]}")
