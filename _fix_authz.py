"""Fix dead unreachable code block in AuthzCallback.tsx"""
with open('/Users/cmuir/P1Import-apps/oauth-playground/src/components/callbacks/AuthzCallback.tsx') as f:
    content = f.read()

old = (
    '\t\t\t\t\t}\n'
    '\n'
    '\t\t\t\t\t// For OAuth V3 flows, we should ONLY handle popups, not full redirects\n'
    '\t\t\t\t\t// OAuth V3 full redirects should be handled by the OAuth V3 flow itself\n'
    '\t\t\t\t\tif (isOAuthV3) {\n'
    '\t\t\t\t\t\tlogger.info(\n'
    "\t\t\t\t\t\t\t' [AuthzCallback] OAuth V3 flow should only use popup authorization',\n"
    "\t\t\t\t\t\t\t'Logger info'\n"
    '\t\t\t\t\t\t);\n'
    "\t\t\t\t\t\tsetStatus('error');\n"
    '\t\t\t\t\t\tsetMessage(\n'
    "\t\t\t\t\t\t\t'OAuth V3 flow detected but not in popup mode. Please use popup authorization.'\n"
    '\t\t\t\t\t\t);\n'
    '\t\t\t\t\t\treturn;\n'
    '\t\t\t\t\t}\n'
    '\t\t\t\t}\n'
)
new = '\t\t\t\t\t}\n\t\t\t\t}\n'

if old in content:
    content = content.replace(old, new, 1)
    with open('/Users/cmuir/P1Import-apps/oauth-playground/src/components/callbacks/AuthzCallback.tsx', 'w') as f:
        f.write(content)
    print("Fixed!")
else:
    # Find approx location
    idx = content.find('For OAuth V3 flows, we should ONLY handle popups')
    if idx >= 0:
        print(f"Found at char {idx}, context:")
        # Print surrounding lines
        lines = content.splitlines()
        for i, line in enumerate(lines):
            if 'For OAuth V3 flows, we should ONLY handle popups' in line:
                for j in range(max(0, i-2), min(len(lines), i+15)):
                    print(f'  [{j+1}]: {repr(lines[j])}')
                break
    else:
        print("Pattern not found at all")
