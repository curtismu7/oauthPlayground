#!/usr/bin/env python3
"""Fix unused props in TokenIntrospect.tsx — remove from destructuring entirely."""
path = 'src/components/TokenIntrospect.tsx'
with open(path, encoding='utf-8') as f:
    content = f.read()

old = (
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
new = (
    '\tflowName,\n'
    '\ttokens,\n'
    '\tuserInfo,\n'
    '\tonFetchUserInfo,\n'
    '\tisFetchingUserInfo,\n'
    '\tonIntrospectToken,\n'
)
assert old in content, 'Could not find old block!'
content = content.replace(old, new, 1)
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done.')
