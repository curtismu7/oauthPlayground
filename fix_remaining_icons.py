import os, re

root = 'src'
EXCLUDE = {'locked'}

# attr value can be {expr}, {{ obj }}, or "string" — handle one level of nesting
_attr_val = r'(?:\{(?:[^{}]|\{[^{}]*\})*\}|"[^"]*")'
_attr     = r'(?:\s+[a-zA-Z][a-zA-Z0-9]*=' + _attr_val + r')'
pattern_styled = re.compile(r'<span(' + _attr + r'+)\s*>\u2753</span>')
pattern_plain  = re.compile(r'<span>\u2753</span>')

replace_plain = '<i className="bi bi-question-circle"></i>'

def replace_styled(m):
    attrs = m.group(1)
    return f'<i className="bi bi-question-circle"{attrs}></i>'

total_files = 0
total_subs  = 0

for dirpath, dirnames, filenames in os.walk(root):
    dirnames[:] = [d for d in dirnames if d not in EXCLUDE]
    for fn in filenames:
        if not fn.endswith(('.tsx', '.ts')):
            continue
        path = os.path.join(dirpath, fn)
        with open(path, encoding='utf-8') as f:
            text = f.read()
        if '\u2753' not in text:
            continue
        new_text, n1 = pattern_styled.subn(replace_styled, text)
        new_text, n2 = pattern_plain.subn(replace_plain, new_text)
        n = n1 + n2
        if n:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(new_text)
            total_files += 1
            total_subs  += n
            print(f'  {n:3d}  {path}')

print(f'\nTotal: {total_subs} replacements in {total_files} files')
