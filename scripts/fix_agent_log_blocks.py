"""Remove malformed '#region agent log' instrumentation blocks from locked files.
These blocks were injected by an automated tool and contain invalid TypeScript
(bare object properties like `method: 'POST', headers: 'Content-Type':...`).
"""
import os
import re

ROOT = "/Users/cmuir/P1Import-apps/oauth-playground/src"
LOCKED_DIRS = ["locked", "v8/lockdown", "v8u/lockdown"]

# Pattern: // #region agent log[...]  ...(malformed block)...  // #endregion
# We only remove blocks that contain CLEARLY malformed code (bare 'method: POST')
REGION_START = re.compile(r"[ \t]*//[ \t]*#region agent log")
REGION_END = re.compile(r"[ \t]*//[ \t]*#endregion")

def has_malformed_code(block_lines):
    """Returns True if the block contains malformed instrumentation code."""
    text = "\n".join(block_lines)
    # Indicators of malformed fake-fetch blocks
    indicators = [
        "method: 'POST',",
        "headers: 'Content-Type':",
        "headers: \"Content-Type\":",
        "hypothesisId:",
        "sessionId: 'debug-session'",
        "runId: 'request-hang'",
        ".catch(() => )",
        "body: JSON.stringify(",
    ]
    return any(ind in text for ind in indicators)

fixed_files = 0
fixed_blocks = 0

for locked_subdir in LOCKED_DIRS:
    locked_path = os.path.join(ROOT, locked_subdir)
    if not os.path.exists(locked_path):
        continue
    for dirpath, dirs, filenames in os.walk(locked_path):
        dirs[:] = [d for d in dirs if d != 'node_modules']
        for fname in filenames:
            if not (fname.endswith('.ts') or fname.endswith('.tsx')):
                continue
            fpath = os.path.join(dirpath, fname)
            with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
                lines = f.readlines()

            new_lines = []
            i = 0
            file_fixed = False
            while i < len(lines):
                if REGION_START.match(lines[i].rstrip()):
                    # Found a region block - collect until #endregion
                    block_start = i
                    block = []
                    j = i + 1
                    while j < len(lines) and not REGION_END.match(lines[j].rstrip()):
                        block.append(lines[j])
                        j += 1
                    # Check if malformed
                    if j < len(lines) and has_malformed_code(block):
                        # Remove the entire block (start + content + end)
                        rel = fpath.replace(ROOT + '/', '')
                        print(f"  Removed malformed block in {rel}:{block_start+1}-{j+1}")
                        fixed_blocks += 1
                        file_fixed = True
                        i = j + 1  # skip to line after #endregion
                        continue
                    else:
                        # Keep the block (not malformed or no #endregion found)
                        new_lines.append(lines[i])
                        i += 1
                        continue
                new_lines.append(lines[i])
                i += 1

            if file_fixed:
                with open(fpath, 'w', encoding='utf-8') as f:
                    f.writelines(new_lines)
                fixed_files += 1

print(f"\nFixed {fixed_blocks} malformed blocks across {fixed_files} files")
