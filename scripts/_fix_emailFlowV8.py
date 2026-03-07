"""Fix EmailFlowV8.tsx: remove dead code, fix any types."""
import re

path = '/Users/cmuir/P1Import-apps/oauth-playground/src/v8/flows/types/EmailFlowV8.tsx'
with open(path) as f:
    src = f.read()

original = src

# 1. Remove unused _MODULE_TAG const
src = src.replace("\nconst _MODULE_TAG = '[📧 EMAIL-FLOW-V8]';\n", '\n')

# 2. Remove unused ValidationState type
src = src.replace(
    '\ntype ValidationState = {\n\tvalidationAttempts: number;\n\tlastValidationError: string | null;\n};\n',
    '\n'
)

# 3. Fix 'mfa' as any -> 'mfa' (all 6 occurrences across error handlers)
src = src.replace("'mfa' as any", "'mfa'")

# 4. Remove unused 'nav' from destructuring at createRenderStep0 (L354 context)
src = src.replace(
    "\t\tconst { nav, credentials, setCredentials } = props;\n\t\tconst locationState",
    "\t\tconst { credentials, setCredentials } = props;\n\t\tconst locationState"
)

# 5. Remove updateValidationState from flow destructuring
src = src.replace(
    '\t\tupdateValidationState,\n\t\tshowModal,',
    '\t\tshowModal,'
)

# 6. Remove isCheckingCredentials from flow destructuring
src = src.replace(
    '\t\tisCheckingCredentials,\n\t\tcontroller,',
    '\t\tcontroller,'
)

# 7. Remove getContactDisplay, getContactLabel, getDeviceTypeDisplay from flow destructuring
src = src.replace(
    '\t\tgetContactDisplay,\n\t\tgetContactLabel,\n\t\tgetDeviceTypeDisplay,\n\t\tMODULE_TAG,',
    '\t\tMODULE_TAG,'
)

# 8. Remove _step4PropsRef (unused ref)
src = src.replace(
    '\n\t// Ref to store step 4 props for potential use at component level\n\tconst _step4PropsRef = React.useRef<MFAFlowBaseRenderProps | null>(null);\n',
    '\n'
)

# 9. Remove setShowWorkerTokenModal from step2 props destructuring
src = src.replace(
    '\t\t\t\tsetShowDeviceLimitModal,\n\t\t\t\ttokenStatus,\n\t\t\t\tsetShowWorkerTokenModal,\n\t\t\t} = props;',
    '\t\t\t\tsetShowDeviceLimitModal,\n\t\t\t\ttokenStatus,\n\t\t\t} = props;'
)

# 10. Remove _deviceIsActive const
src = src.replace(
    '\n\t\t\t\t\tconst _deviceIsActive = deviceStatus === \'ACTIVE\' && !hasDeviceActivateUri;\n',
    '\n'
)

# 11. Remove _otpState and _setOtpState from createRenderStep4 signature
src = src.replace(
    "\t\tsetLastValidationError: (value: string | null) => void,\n\t\t_otpState: { otpSent: boolean; sendError: string | null; sendRetryCount: number },\n\t\t_setOtpState: (\n\t\t\tstate: Partial<typeof otpState> | ((prev: typeof otpState) => Partial<typeof otpState>)\n\t\t) => void\n\t) => {",
    "\t\tsetLastValidationError: (value: string | null) => void\n\t) => {"
)

# 12. Remove the otpState and update-function arguments from the call site
src = src.replace(
    "\t\t\t\t\tvalidationState.lastValidationError,\n\t\t\t\t\t(v) => setValidationState({ ...validationState, lastValidationError: v }),\n\t\t\t\t\totpState,\n\t\t\t\t\t(\n\t\t\t\t\t\tupdate: Partial<typeof otpState> | ((prev: typeof otpState) => Partial<typeof otpState>)\n\t\t\t\t\t) => {\n\t\t\t\t\t\tsetOtpState((prev) => {\n\t\t\t\t\t\t\tconst patch = typeof update === 'function' ? update(prev) : update;\n\t\t\t\t\t\t\treturn { ...prev, ...patch };\n\t\t\t\t\t\t});\n\t\t\t\t\t}\n\t\t\t\t)}",
    "\t\t\t\t\tvalidationState.lastValidationError,\n\t\t\t\t\t(v) => setValidationState({ ...validationState, lastValidationError: v })\n\t\t\t\t)}"
)

assert src != original, 'No changes made'
with open(path, 'w') as f:
    f.write(src)
print('Done')
