#!/usr/bin/env python3
import subprocess, re, os
from collections import defaultdict

env = {**os.environ, 'PATH': '/bin:/usr/bin:/usr/local/bin:/opt/homebrew/bin:/Users/cmuir/.nvm/versions/node/v22.14.0/bin'}
r = subprocess.run(
    ['node', 'node_modules/.bin/eslint', 'src/', '--format', 'compact', '--no-ignore'],
    capture_output=True, text=True, env=env,
    cwd='/Users/cmuir/P1Import-apps/oauth-playground'
)
counts = defaultdict(int)
warnings = [l for l in r.stdout.splitlines() if 'Warning' in l]
locked = [l for l in warnings if 'locked' in l or 'lockdown' in l or 'snapshot' in l]
non_locked_lines = [l for l in warnings if 'locked' not in l and 'lockdown' not in l and 'snapshot' not in l]
print(f'Total warnings: {len(warnings)}')
print(f'Locked: {len(locked)}')
print(f'Non-locked: {len(non_locked_lines)}')
print()

for line in non_locked_lines:
    if 'no-unused-vars' in line or 'no_unused_vars' in line or 'unused' in line.lower():
        m = re.match(r'^(.+?):\s*line\s*\d+', line)
        if not m:
            m = re.match(r'^(.+?):(\d+):', line)
        if m:
            counts[m.group(1)] += 1
top20 = sorted(counts.items(), key=lambda x: -x[1])[:20]
print('Top 20 files (non-locked) by warning count:')
for f, c in top20:
    short = f.replace('/Users/cmuir/P1Import-apps/oauth-playground/', '')
    print(f'  {c:3d}  {short}')
