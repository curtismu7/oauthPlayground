#!/usr/bin/env python3
"""Fix unused props in TokenIntrospect.tsx — use _ prefix destructuring alias."""
path = 'src/components/TokenIntrospect.tsx'
with open(path, encoding='utf-8') as f:
    content = f.read()

# Replace the props block — remove eslint-disable comments and use _ alias pattern
old = (
    '\tflowName,\n'
    '\t// eslint-disable-next-line @typescript-eslint/no-unused-vars\n'
    "\tflowVersion = 'V5',\n"
    '\ttokens,\n'
    '\t// eslint-disable-next-line @typescript-eslint/no-unused-vars\n'
    '\tcredentials,\n'
    '\tuserInfo,\n'
    '\tonFetchUserInfo,\n'
    '\tisFetchingUserInfo,\n'
    '\t// eslint-disable-next-line @typescript-eslint/no-unused-vars\n'
    '\tonResetFlow,\n'
    '\t// eslint-disable-next-line @typescript-eslint/no-unused-vars\n'
    '\tonNavigateToTokenManagement,\n'
    '\tonIntrospectToken,\n'
)
new = (
    '\tflowName,\n'
    "\tflowVersion: _flowVersion = 'V5',\n"
    '\ttokens,\n'
    '\tcredentials: _credentials,\n'
    '\tuserInfo,\n'
    '\tonFetchUserInfo,\n'
    '\tisFetchingUserInfo,\n'
    '\tonResetFlow: _onResetFlow,\n'
    '\tonNavigateToTokenManagement: _onNavigateToTokenManagement,\n'
    '\tonIntrospectToken,\n'
)
assert old in content, f'Could not find old block!'
content = content.replace(old, new, 1)
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done.')
