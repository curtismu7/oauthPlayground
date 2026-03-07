#!/usr/bin/env python3
"""
Fix SDKExamplesHome.tsx:
1. Delete dead styled components block (_APIDisplayToggle through _ErrorMessage)
2. Delete unused interface Environment
3. Delete const _workerToken = ...
"""

path = '/Users/cmuir/P1Import-apps/oauth-playground/src/pages/sdk-examples/SDKExamplesHome.tsx'

with open(path, 'r', encoding='utf-8') as f:
    src = f.read()

# 1. Remove the dead styled components block
START = '\nconst _APIDisplayToggle = styled.div`'
END_MARKER = '\nconst DocumentationTitle = styled.h2`'

start_idx = src.index(START)
end_idx = src.index(END_MARKER)
src = src[:start_idx] + '\n' + src[end_idx:]

# 2. Remove unused interface Environment block
IFACE_OLD = '\ninterface Environment {\n\tid: string;\n\tname: string;\n\tdescription?: string;\n}\n'
assert IFACE_OLD in src, 'interface Environment not found'
src = src.replace(IFACE_OLD, '\n', 1)

# 3. Remove the _workerToken line
import re
src = re.sub(r'\n\tconst _workerToken = globalTokenStatus\.token \|\| \'\';\n', '\n', src)

with open(path, 'w', encoding='utf-8') as f:
    f.write(src)

print('Done SDKExamplesHome.tsx')
