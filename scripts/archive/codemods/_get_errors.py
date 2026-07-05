import sys, json

d = json.load(sys.stdin)
errs = [x for x in d.get('diagnostics', []) if x.get('severity') == 'error']

RULES = [
    'useIterableCallbackReturn', 'noImplicitAnyLet', 'noRedeclare', 'noCommentText',
    'noAssignInExpressions', 'noDuplicateClassMembers', 'noAsyncPromiseExecutor',
    'noMisleadingCharacterClass', 'noUnreachable', 'noConstantCondition',
    'useAriaPropsSupportedByRole', 'useGenericFontNames', 'useButtonType',
]

results = []
for e in errs:
    rule = e.get('category', '?')
    if not any(r in rule for r in RULES):
        continue
    loc = e.get('location', {})
    path = loc.get('path', {})
    if isinstance(path, dict):
        path = path.get('file', '?')
    span = loc.get('span', {})
    start = span.get('start', {})
    line = start.get('line', '?')
    results.append((rule, f'{path}:{line}'))

for rule, loc in sorted(results):
    print(f'{rule}: {loc}')
