"""Fix bare emoji used as JSX expression values (not inside strings/JSX text).

Patterns fixed:
  ? EMOJI :    →  ? <span>EMOJI</span> :
  ? EMOJI}     →  ? <span>EMOJI</span>}
  icon: EMOJI, →  icon: <span>EMOJI</span>,
  {EMOJI}      →  {/* only standalone expression */}
"""
import re, glob, sys

# Match a bare emoji token used as a JS expression value:
#   ...? EMOJI : ...    or    ...? EMOJI}    or    : EMOJI}
# The emoji must NOT be inside quotes and NOT already inside > ... <
EMOJI_CHARS = (
    '\U0001F000-\U0001FAFF'   # main emoji block
    '\u2600-\u27FF'           # misc symbols / arrows
    '\u2B00-\u2BFF'           # misc technical
    '\u23E0-\u23FF'           # clock/watch
    '\u2500-\u25FF'           # box drawing / geometric
)
EMOJI_RE = re.compile(
    r'([\?:,]\s*)'            # operator before the emoji
    r'([' + EMOJI_CHARS + r'][\uFE0F\u20E3\u200D\U0001F3FB-\U0001F3FF\U0001F000-\U0001FAFF]*)'  # emoji (possibly multi-codepoint)
    r'(\s*[,:}\n])'           # operator/end after
)

def needs_wrap(m, line):
    """Return True if the emoji is bare (not inside a string or JSX text)."""
    emoji = m.group(2)
    pos = m.start(2)
    before = line[:pos]
    # Count unescaped quotes — if odd, we're inside a string
    sq = before.count("'") - before.count("\\'")
    dq = before.count('"') - before.count('\\"')
    if sq % 2 != 0 or dq % 2 != 0:
        return False
    # If preceded immediately by >, it's already JSX text
    if re.search(r'>\s*$', before.rstrip()):
        return False
    return True

def fix_line(line):
    def replacer(m):
        if not needs_wrap(m, line):
            return m.group(0)
        return f'{m.group(1)}<span>{m.group(2)}</span>{m.group(3)}'
    return EMOJI_RE.sub(replacer, line)

files = (
    glob.glob('src/**/*.tsx', recursive=True)
)

changed = []
for fp in files:
    with open(fp, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    new_lines = [fix_line(l) for l in lines]
    if new_lines != lines:
        with open(fp, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        fixes = sum(1 for a, b in zip(lines, new_lines) if a != b)
        changed.append((fp, fixes))
        for i, (a, b) in enumerate(zip(lines, new_lines), 1):
            if a != b:
                print(f'  {fp}:{i}')
                print(f'    - {a.rstrip()}')
                print(f'    + {b.rstrip()}')

print(f'\nFixed {sum(n for _, n in changed)} lines across {len(changed)} files.')
