#!/usr/bin/env python3
"""
Fix MobilePhoneDeviceFlow.tsx:
1. Delete 4 dead styled components (_StatusBar, _StatusBarLeft, _StatusBarRight, _BatteryIcon)
2. Remove onStateUpdate, onComplete, onError from component destructuring
3. Replace const [_currentTime, setCurrentTime] with const [, setCurrentTime]
4. Delete unused _handleCopyVerificationUri function
"""
import re

path = '/Users/cmuir/P1Import-apps/oauth-playground/src/components/MobilePhoneDeviceFlow.tsx'

with open(path, 'r', encoding='utf-8') as f:
    src = f.read()

# 1. Remove the dead styled components block (from '// Status Bar' to IOSStatusBar)
START = '\n// Status Bar\nconst _StatusBar = styled.div`'
END_MARKER = '\n// iOS 18 Status Bar Indicators\nconst IOSStatusBar = styled.div`'
start_idx = src.index(START)
end_idx = src.index(END_MARKER)
src = src[:start_idx] + '\n' + src[end_idx:]

# 2. Remove onStateUpdate, onComplete, onError from destructuring
OLD_DEST = ('\tstate,\n'
            '\tonStateUpdate,\n'
            '\tonComplete,\n'
            '\tonError,\n'
            '}) => {')
NEW_DEST = '\tstate,\n}) => {'
assert OLD_DEST in src, 'MobilePhoneDeviceFlow destructuring not found'
src = src.replace(OLD_DEST, NEW_DEST, 1)

# 3. Replace [_currentTime, setCurrentTime] with [, setCurrentTime]
src = src.replace('\tconst [_currentTime, setCurrentTime] = useState(new Date());',
                  '\tconst [, setCurrentTime] = useState(new Date());', 1)

# 4. Delete _handleCopyVerificationUri function
func_pattern = r'\n\tconst _handleCopyVerificationUri = \(\) => \{.*?\n\t\};\n'
old_len = len(src)
src = re.sub(func_pattern, '\n', src, count=1, flags=re.DOTALL)
assert len(src) < old_len, '_handleCopyVerificationUri not removed'

with open(path, 'w', encoding='utf-8') as f:
    f.write(src)

print('Done MobilePhoneDeviceFlow.tsx')
