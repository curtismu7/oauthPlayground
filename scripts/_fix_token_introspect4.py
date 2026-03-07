#!/usr/bin/env python3
"""Remove [key: string]: unknown index signature from onIntrospectToken return type."""
path = 'src/components/TokenIntrospect.tsx'
with open(path, encoding='utf-8') as f:
    content = f.read()

old = (
    '\tonIntrospectToken?: (token: string) => Promise<{\n'
    '\t\tactive?: boolean;\n'
    '\t\tscope?: string;\n'
    '\t\tclient_id?: string;\n'
    '\t\tsub?: string;\n'
    '\t\ttoken_type?: string;\n'
    '\t\taud?: string;\n'
    '\t\tiss?: string;\n'
    '\t\texp?: number;\n'
    '\t\tiat?: number;\n'
    '\t\t[key: string]: unknown;\n'
    '\t} | null>;\n'
)
new = (
    '\tonIntrospectToken?: (token: string) => Promise<{\n'
    '\t\tactive?: boolean;\n'
    '\t\tscope?: string;\n'
    '\t\tclient_id?: string;\n'
    '\t\tsub?: string;\n'
    '\t\ttoken_type?: string;\n'
    '\t\taud?: string;\n'
    '\t\tiss?: string;\n'
    '\t\texp?: number;\n'
    '\t\tiat?: number;\n'
    '\t} | null>;\n'
)
assert old in content, 'Could not find old block!'
content = content.replace(old, new, 1)
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done.')
