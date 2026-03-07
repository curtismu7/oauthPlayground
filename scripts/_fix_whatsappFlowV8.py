"""Fix WhatsAppFlowV8.tsx: remove dead code, fix any types."""
import re

path = '/Users/cmuir/P1Import-apps/oauth-playground/src/v8/flows/types/WhatsAppFlowV8.tsx'
with open(path) as f:
    src = f.read()

original = src

# 1. Fix 'mfa' as any -> 'mfa'
src = src.replace("'mfa' as any", "'mfa'")

# 2. Remove unused 'nav' from createRenderStep0 destructuring
src = src.replace(
    "\t\tconst { nav, credentials, setCredentials } = props;\n\t\tconst locationState",
    "\t\tconst { credentials, setCredentials } = props;\n\t\tconst locationState"
)

# 3. Remove updateValidationState from flow destructuring
src = src.replace(
    '\t\tupdateValidationState,\n\t\tshowModal,',
    '\t\tshowModal,'
)

# 4. Remove isCheckingCredentials from flow destructuring
src = src.replace(
    '\t\tisCheckingCredentials,\n\t\tcontroller,',
    '\t\tcontroller,'
)

# 5. Remove getContactLabel, getDeviceTypeDisplay from flow destructuring
src = src.replace(
    '\t\tgetContactLabel,\n\t\tgetDeviceTypeDisplay,\n\t\tMODULE_TAG,',
    '\t\tMODULE_TAG,'
)

# 6. Remove _setCredentialsForModal from useState (keep read side)
src = src.replace(
    'const [credentialsForModal, _setCredentialsForModal] = useState<MFACredentials>(',
    'const [credentialsForModal] = useState<MFACredentials>('
)

# 7. Blank _lastTokenType read side in useState
src = src.replace(
    'const [_lastTokenType, setLastTokenType] = useState<string | undefined>(undefined);',
    'const [, setLastTokenType] = useState<string | undefined>(undefined);'
)

# 8. Remove eslint-disable-next-line react-hooks/exhaustive-deps comments (3 occurrences)
src = src.replace(
    '\t\t// eslint-disable-next-line react-hooks/exhaustive-deps\n\t}, [registrationFlowType, MODULE_TAG]);',
    '\t}, [registrationFlowType, MODULE_TAG]);'
)
src = src.replace(
    '\t\t// eslint-disable-next-line react-hooks/exhaustive-deps\n\t}, [registrationFlowType, setRegistrationFlowType, MODULE_TAG]);',
    '\t}, [registrationFlowType, setRegistrationFlowType, MODULE_TAG]);'
)
src = src.replace(
    '\t\t// eslint-disable-next-line react-hooks/exhaustive-deps\n\t}, [deviceRegisteredActive, setDeviceRegisteredActive]);',
    '\t}, [deviceRegisteredActive, setDeviceRegisteredActive]);'
)

# 9. Delete _step2ModalDrag - draggable modal hook
src = src.replace(
    '\n\t// Draggable modal hooks\n\tconst _step2ModalDrag = useDraggableModal(showModal);\n\tconst step4ModalDrag',
    '\n\t// Draggable modal hooks\n\tconst step4ModalDrag'
)

# 10. Delete _currentDeviceType const
src = src.replace(
    "\n\t\t\t// Ensure deviceType is set correctly - default to WHATSAPP for WhatsApp flow\n\t\t\tconst _currentDeviceType = credentials.deviceType || 'WHATSAPP';\n\n\t\t\t// Handle device registration",
    "\n\t\t\t// Handle device registration"
)

# 11. Delete hasDeviceActivateUri and _deviceIsActive consts
src = src.replace(
    "\t\t\t\t\tconst hasDeviceActivateUri = !!deviceActivateUri;\n\t\t\t\t\tconst _deviceIsActive = actualDeviceStatus === 'ACTIVE' && !hasDeviceActivateUri;\n\n\t\t\t\t\tif (actualDeviceStatus === 'ACTIVATION_REQUIRED') {",
    "\t\t\t\t\tif (actualDeviceStatus === 'ACTIVATION_REQUIRED') {"
)

# 12. Delete _isDeviceRegisteredActive const (3-line)
src = src.replace(
    "\n\t\t\t// Check if device was successfully registered with ACTIVE status\n\t\t\t// We'll hide the register button and show Next button instead\n\t\t\tconst _isDeviceRegisteredActive =\n\t\t\t\t(deviceRegisteredActive && deviceRegisteredActive.status === 'ACTIVE') ||\n\t\t\t\t(mfaState.deviceId && mfaState.deviceStatus === 'ACTIVE' && !showModal);\n\n\t\t\t// Use phone validation",
    "\n\t\t\t// Use phone validation"
)

# 13. Delete entire _createRenderStep3 function
old_step3_start = "\n\t// Step 3: Send OTP (using controller) - Renumbered from Step 2\n\tconst _createRenderStep3 = ("
old_step3_end = "\n\t// Step 4: Validate OTP (using controller) - Renumbered from Step 3\n\tconst createRenderStep4 = ("
new_step4_header = "\n\t// Step 3 (Send OTP) removed - handled inline. Step 4: Validate OTP (using controller)\n\tconst createRenderStep4 = ("

idx_start = src.find(old_step3_start)
idx_end = src.find(old_step3_end)
assert idx_start != -1, 'Step3 start not found'
assert idx_end != -1, 'Step4 start not found'
src = src[:idx_start] + new_step4_header + src[idx_end + len(old_step3_end):]

# 14. Remove _otpState and _setOtpState from createRenderStep4 signature
src = src.replace(
    "\t\tsetLastValidationError: (value: string | null) => void,\n\t\t_otpState: { otpSent: boolean; sendError: string | null; sendRetryCount: number },\n\t\t_setOtpState: (\n\t\t\tstate: Partial<typeof otpState> | ((prev: typeof otpState) => Partial<typeof otpState>)\n\t\t) => void\n\t) => {",
    "\t\tsetLastValidationError: (value: string | null) => void\n\t) => {"
)

# 15. Remove 5th+6th args from renderStep3 call site
src = src.replace(
    "\t\t\t\t\tvalidationState.validationError,\n\t\t\t\t\t(v) => setValidationState({ ...validationState, validationError: v }),\n\t\t\t\t\tvalidationState.showValidationModal,\n\t\t\t\t\tsetShowValidationModal\n\t\t\t\t)}",
    "\t\t\t\t\tvalidationState.validationError,\n\t\t\t\t\t(v) => setValidationState({ ...validationState, validationError: v })\n\t\t\t\t)}"
)

# 16. Remove 5th+6th args from renderStep4 call site
src = src.replace(
    "\t\t\t\t\tvalidationState.lastValidationError,\n\t\t\t\t\t(v) => setValidationState({ ...validationState, lastValidationError: v }),\n\t\t\t\t\totpState,\n\t\t\t\t\t(\n\t\t\t\t\t\tupdate: Partial<typeof otpState> | ((prev: typeof otpState) => Partial<typeof otpState>)\n\t\t\t\t\t) => {\n\t\t\t\t\t\tsetOtpState((prev) => {\n\t\t\t\t\t\t\tconst patch = typeof update === 'function' ? update(prev) : update;\n\t\t\t\t\t\t\treturn { ...prev, ...patch };\n\t\t\t\t\t\t});\n\t\t\t\t\t}\n\t\t\t\t)}",
    "\t\t\t\t\tvalidationState.lastValidationError,\n\t\t\t\t\t(v) => setValidationState({ ...validationState, lastValidationError: v })\n\t\t\t\t)}"
)

assert src != original, 'No changes made'
with open(path, 'w') as f:
    f.write(src)
print('Done')
