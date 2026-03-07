#!/usr/bin/env python3
import subprocess, json
files = [
    'src/v8/flows/MFAConfigurationPageV8.tsx',
    'src/v8u/components/UserTokenStatusDisplayV8U.tsx',
]
r = subprocess.run(
    ['/Users/cmuir/P1Import-apps/oauth-playground/node_modules/.bin/eslint'] + files + ['--format', 'json'],
    capture_output=True, text=True,
    cwd='/Users/cmuir/P1Import-apps/oauth-playground'
)
data = json.loads(r.stdout)
for f in data:
    short = f['filePath'].replace('/Users/cmuir/P1Import-apps/oauth-playground/', '')
    e, w = f['errorCount'], f['warningCount']
    status = 'OK' if e+w == 0 else 'FAIL'
    print(f'{status} {e}E {w}W  {short}')
    for m in f['messages'][:5]:
        print(f'   L{m["line"]}: {m["message"][:80]}')
