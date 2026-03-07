path = 'src/components/CompleteMFAFlowV7.tsx'
with open(path, 'r') as f:
    content = f.read()

replacements = [
    ('\trequireMFA: _requireMFA = true,',
     '\t// eslint-disable-next-line @typescript-eslint/no-unused-vars\n\trequireMFA: _requireMFA = true,'),
    ('\tonFlowComplete: _onFlowComplete,',
     '\t// eslint-disable-next-line @typescript-eslint/no-unused-vars\n\tonFlowComplete: _onFlowComplete,'),
    ('\tonFlowError: _onFlowError,',
     '\t// eslint-disable-next-line @typescript-eslint/no-unused-vars\n\tonFlowError: _onFlowError,'),
    ('\tshowNetworkStatus: _showNetworkStatus = true,',
     '\t// eslint-disable-next-line @typescript-eslint/no-unused-vars\n\tshowNetworkStatus: _showNetworkStatus = true,'),
]

for old, new in replacements:
    if old in content:
        content = content.replace(old, new)
        print(f"Replaced: {old[:60]}")
    else:
        print(f"NOT FOUND: {old[:60]}")

with open(path, 'w') as f:
    f.write(content)
print("Done")
