#!/usr/bin/env python3
"""
Fix UserTokenStatusDisplayV8U.tsx:
1. Delete dead _TokenIcon styled component
2. Change all `catch (_e) {` and `catch (_error) {` → `catch {`
3. Delete the unused _getTokenIcon function
"""
import re

path = '/Users/cmuir/P1Import-apps/oauth-playground/src/v8u/components/UserTokenStatusDisplayV8U.tsx'

with open(path, 'r', encoding='utf-8') as f:
    src = f.read()

# 1. Remove _TokenIcon styled component block
START = '\nconst _TokenIcon = styled.div<{'
END = '`;\n\nconst TokenText = styled.div`'
start_idx = src.index(START)
end_idx = src.index(END) + len('`;\n')
src = src[:start_idx] + '\n' + src[end_idx:]

# 2. Replace all catch (_e) and catch (_error) with catch
src = re.sub(r'\} catch \(_e\) \{', '} catch {', src)
src = re.sub(r'\} catch \(_error\) \{', '} catch {', src)

# 3. Remove the _getTokenIcon function
# It starts with `\n\tconst _getTokenIcon = (type: string) => {` and ends with `\t};\n`
# Find the function and delete it
func_pattern = r'\n\tconst _getTokenIcon = \(type: string\) => \{.*?\n\t\};\n'
old_len = len(src)
src = re.sub(func_pattern, '\n', src, count=1, flags=re.DOTALL)
assert len(src) < old_len, '_getTokenIcon function not removed'

with open(path, 'w', encoding='utf-8') as f:
    f.write(src)

print('Done UserTokenStatusDisplayV8U.tsx')
