#!/usr/bin/env python3
"""Fix mfaCredentialManagerV8.ts — replace (stored as any).field."""

path = '/Users/cmuir/P1Import-apps/oauth-playground/src/v8/services/mfaCredentialManagerV8.ts'
with open(path) as f:
    src = f.read()

original = src

# The two identical cast blocks (3-tab indent inside try inside method)
OLD_CAST_BODY = (
    "\t\t\t\tusername: (stored as any).username || '',\n"
    "\t\t\t\tdeviceType: (stored as any).deviceType || 'SMS',\n"
    "\t\t\t\tcountryCode: (stored as any).countryCode || '+1',\n"
    "\t\t\t\tphoneNumber: (stored as any).phoneNumber || '',\n"
    "\t\t\t\temail: (stored as any).email || '',\n"
    "\t\t\t\tdeviceName: (stored as any).deviceName || '',\n"
    '\t\t\t\tdeviceStatus: (stored as any).deviceStatus,\n'
    '\t\t\t\tdeviceAuthenticationPolicyId: (stored as any).deviceAuthenticationPolicyId,\n'
    '\t\t\t\tregistrationPolicyId: (stored as any).registrationPolicyId,\n'
    '\t\t\t\tfido2PolicyId: (stored as any).fido2PolicyId,\n'
    "\t\t\t\ttokenType: (stored as any).tokenType || 'worker',\n"
    '\t\t\t\tuserToken: (stored as any).userToken,\n'
    "\t\t\t\tregion: (stored as any).region || 'na',\n"
    '\t\t\t\tcustomDomain: (stored as any).customDomain,\n'
)

NEW_CAST_BODY = (
    "\t\t\t\tusername: ((stored as Record<string, unknown>).username as string) || '',\n"
    "\t\t\t\tdeviceType: ((stored as Record<string, unknown>).deviceType as string) || 'SMS',\n"
    "\t\t\t\tcountryCode: ((stored as Record<string, unknown>).countryCode as string) || '+1',\n"
    "\t\t\t\tphoneNumber: ((stored as Record<string, unknown>).phoneNumber as string) || '',\n"
    "\t\t\t\temail: ((stored as Record<string, unknown>).email as string) || '',\n"
    "\t\t\t\tdeviceName: ((stored as Record<string, unknown>).deviceName as string) || '',\n"
    '\t\t\t\tdeviceStatus: (stored as Record<string, unknown>).deviceStatus as string | undefined,\n'
    '\t\t\t\tdeviceAuthenticationPolicyId: (stored as Record<string, unknown>).deviceAuthenticationPolicyId as string | undefined,\n'
    '\t\t\t\tregistrationPolicyId: (stored as Record<string, unknown>).registrationPolicyId as string | undefined,\n'
    '\t\t\t\tfido2PolicyId: (stored as Record<string, unknown>).fido2PolicyId as string | undefined,\n'
    "\t\t\t\ttokenType: ((stored as Record<string, unknown>).tokenType as string) || 'worker',\n"
    '\t\t\t\tuserToken: (stored as Record<string, unknown>).userToken as string | undefined,\n'
    "\t\t\t\tregion: ((stored as Record<string, unknown>).region as string) || 'na',\n"
    '\t\t\t\tcustomDomain: (stored as Record<string, unknown>).customDomain as string | undefined,\n'
)

assert OLD_CAST_BODY in src, 'Cast body not found in file'
count = src.count(OLD_CAST_BODY)
print(f'Found {count} occurrence(s) of cast body')
src = src.replace(OLD_CAST_BODY, NEW_CAST_BODY)
assert '(stored as any)' not in src, 'Remaining (stored as any) found'

# saveCredentials: credentials as any
old_save = '\t\t\tCredentialsServiceV8.saveCredentials(flowKey, credentials as any);\n'
new_save = '\t\t\tCredentialsServiceV8.saveCredentials(flowKey, credentials as unknown as Parameters<typeof CredentialsServiceV8.saveCredentials>[1]);\n'
assert old_save in src, 'saveCredentials line not found'
src = src.replace(old_save, new_save)
assert 'credentials as any' not in src, 'Remaining credentials as any found'

assert src != original
with open(path, 'w') as f:
    f.write(src)
print('Done')

