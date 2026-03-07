#!/usr/bin/env python3
import re, sys

path = 'src/pages/flows/KrogerGroceryStoreMFA.tsx'
content = open(path).read()
orig = content

# 1. Delete unused color constants (single lines)
content = content.replace("\nconst _KROGER_LIGHT_BLUE = '#4DA3FF';\n", "\n")
content = content.replace("\nconst _KROGER_RED = '#E31837'; // For accent colors\n", "\n")

# 2. Delete maskToken function (lines 37-42 = 6 lines + blank)
# Comment above is "Shows first 8 characters..." 3-line block
content = re.sub(
    r'\n/\*\*\n \* Utility function to mask tokens for security\n \* Shows first 8 characters, masks middle, shows last 4 characters\n \*/\nconst maskToken = \(token: string\): string => \{[\s\S]*?\};\n',
    '\n',
    content
)

# 3. Delete unused styled components (each: const _Xxx = styled.xxx` ... `;)
styled_to_delete = [
    '_Header', '_HeaderContent', '_Logo', '_SearchBar',
    '_HeaderActions', '_HeaderButton', '_HeroBanner',
    '_LoginPageContainer', '_ApiCallTableContainer', '_FormGroup',
]
for name in styled_to_delete:
    # Match: \nconst _Name = styled.anything` ... `;
    content = re.sub(
        r'\nconst ' + re.escape(name) + r' = styled\.[a-zA-Z.]+`[\s\S]*?`;\n',
        '\n',
        content
    )

# 4. Fix useState pairs (value unused, setter used) → drop first element
content = content.replace(
    'const [_showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);',
    'const [, setShowWorkerTokenModal] = useState(false);'
)
content = content.replace(
    "const [phoneNumber, _setPhoneNumber] = useState('');",
    "const [phoneNumber] = useState('');"
)
content = content.replace(
    'const [_selectedDevice, setSelectedDevice] = useState<string | null>(null);',
    'const [, setSelectedDevice] = useState<string | null>(null);'
)
content = content.replace(
    'const [_userInfo, setUserInfo] = useState<UserInfo | null>(null);',
    'const [, setUserInfo] = useState<UserInfo | null>(null);'
)
content = content.replace(
    'const [_userInfoLoading, setUserInfoLoading] = useState(false);',
    'const [, setUserInfoLoading] = useState(false);'
)
content = content.replace(
    'const [_userInfoError, setUserInfoError] = useState<string | null>(null);',
    'const [, setUserInfoError] = useState<string | null>(null);'
)
content = content.replace(
    "const [_authorizationCode, setAuthorizationCode] = useState('');",
    "const [, setAuthorizationCode] = useState('');"
)
# _loginStep - might have tab indent, try both
content = re.sub(
    r"([ \t]*)const \[_loginStep, setLoginStep\] = useState<'login' \| 'device-setup' \| 'mfa' \| 'success'>\(\n\s*'login'\n\s*\);",
    r"\1const [, setLoginStep] = useState<'login' | 'device-setup' | 'mfa' | 'success'>('login');",
    content
)
content = re.sub(
    r"([ \t]*)const \[_loginStep, setLoginStep\] = useState<'login' \| 'device-setup' \| 'mfa' \| 'success'>\('login'\);",
    r"\1const [, setLoginStep] = useState<'login' | 'device-setup' | 'mfa' | 'success'>('login');",
    content
)

# 5. Delete fully unused useState pair (_activeView, _setActiveView both unused)
content = re.sub(
    r"[ \t]*const \[_activeView, _setActiveView\] = useState<'profile' \| 'dashboard'>\('profile'\);\n",
    '',
    content
)

# 6. Delete _loginFormRef (completely unused ref)
content = re.sub(
    r'[ \t]*const _loginFormRef = useRef<HTMLDivElement \| null>\(null\);\n',
    '',
    content
)

# 7. Delete _registerMobilePhone function (includes comment line above)
content = re.sub(
    r'[ \t]*// Step 11: Register Mobile Phone Device\n[ \t]*const _registerMobilePhone = useCallback\(async \(\) => \{[\s\S]*?\}, \[[^\]]*\]\);\n',
    '',
    content
)

if content == orig:
    print('WARNING: no changes made!')
    sys.exit(1)

open(path, 'w').write(content)
print('Done')
