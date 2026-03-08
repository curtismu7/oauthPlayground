#!/usr/bin/env python3
with open('src/v8/flows/shared/MFAConfigurationStepV8.tsx') as f:
    src = f.read()

# Find the require lines to fix
idx = src.find("require('@/v8/services/mfaConfigurationServiceV8')")
print(f"require() found at index: {idx}")
if idx >= 0:
    print(repr(src[idx-80:idx+80]))

count = 0

# Pattern 1: replace the require+return for silentApiRetrieval
old1 = "const { MFAConfigurationServiceV8 } = require('@/v8/services/mfaConfigurationServiceV8');\n\t\t\treturn MFAConfigurationServiceV8.loadConfiguration().workerToken.silentApiRetrieval"
new1 = "return MFAConfigurationServiceV8.loadConfiguration().workerToken.silentApiRetrieval"
if old1 in src:
    src = src.replace(old1, new1)
    count += 1
    print("Fixed pattern 1 (silentApiRetrieval)")
else:
    print(f"NOT FOUND p1: {repr(old1[:80])}")

# Pattern 2: replace the require+return for showTokenAtEnd
old2 = "const { MFAConfigurationServiceV8 } = require('@/v8/services/mfaConfigurationServiceV8');\n\t\t\treturn MFAConfigurationServiceV8.loadConfiguration().workerToken.showTokenAtEnd"
new2 = "return MFAConfigurationServiceV8.loadConfiguration().workerToken.showTokenAtEnd"
if old2 in src:
    src = src.replace(old2, new2)
    count += 1
    print("Fixed pattern 2 (showTokenAtEnd)")
else:
    print(f"NOT FOUND p2: {repr(old2[:80])}")

print(f"\nTotal fixed: {count}")
remaining = src.count("require('@/v8/services/mfaConfigurationServiceV8')")
print(f"require() occurrences remaining: {remaining}")

with open('src/v8/flows/shared/MFAConfigurationStepV8.tsx', 'w') as f:
    f.write(src)
print("Written.")
