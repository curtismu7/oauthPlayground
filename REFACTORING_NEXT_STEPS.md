# MFA Refactoring - Next Steps Guide

**Current Status**: ✅ Phase 1 Complete - Hooks Extracted (Jan 31, 2026)

---

## 🎯 What We Accomplished

Created 4 production-ready custom hooks that extract business logic from MFAAuthenticationMainPageV8.tsx:

1. **useMFAAuthentication.ts** (197 lines) - Auth flow management
2. **useMFADevices.ts** (223 lines) - Device operations  
3. **useMFAPolicy.ts** (239 lines) - Policy management
4. **useFIDO2Authentication.ts** (138 lines) - Passkey auth

**Build Status**: ✅ Verified passing

---

## 📋 Recommended Next Steps

### Option A: Integrate Hooks (Safest, High Impact)

**Goal**: Replace ~800 lines of business logic in main component with hook calls

**Steps**:

1. **Create integration branch**
   ```bash
   git checkout -b refactor/integrate-mfa-hooks
   ```

2. **Start with useMFADevices (Easiest)**
   - Import hook at top of file
   - Replace device-related state declarations
   - Replace `handleDeviceFailureError` function
   - Replace device loading effects
   - Test device loading functionality

3. **Continue with useMFAPolicy**
   - Import hook
   - Replace policy state and functions
   - Update component to use hook's return values
   - Test policy selection

4. **Then useMFAAuthentication**
   - Import hook
   - Replace auth state and modals
   - Replace `handleStartMFA` function
   - Test full authentication flow

5. **Finally useFIDO2Authentication**
   - Import hook
   - Replace passkey state
   - Replace `handleUsernamelessFIDO2` function
   - Test passkey flow

6. **Verify everything works**
   ```bash
   npm run build
   npm run dev
   # Test all authentication flows
   ```

7. **Commit and create PR**

**Estimated Time**: 4-6 hours  
**Risk Level**: Low (incremental changes)  
**Impact**: Reduces main component by ~800 lines

---

### Option B: Extract Modal Components (Medium Priority)

**Goal**: Create reusable modal components from inline JSX

**Components to Extract**:

1. **UsernameDecisionModal** (~150 lines)
   - Located around lines 3700-3850
   - Handles username vs passkey choice
   - Includes registration mode

2. **DeviceRegistrationModal** (~200 lines)
   - Located around lines 3850-4050
   - Device type selection
   - Search functionality

3. **DeviceSelectionModal** (~150 lines)
   - Located throughout device selection code
   - Shows available devices
   - Handles device choice

**Estimated Time**: 3-4 hours  
**Risk Level**: Low  
**Impact**: Further improves main component readability

---

### Option C: Extract Dashboard Section (Lower Priority)

**Goal**: Move device list/dashboard UI to separate component

**Component**: `MFADashboardSection.tsx` (~300 lines)

Includes:
- Device list display
- Device status indicators
- Policy summary
- User information

**Estimated Time**: 2-3 hours  
**Risk Level**: Very Low  
**Impact**: Modest improvement

---

## 🛠️ Integration Example

### Before (Current - Lines 300-370):
```tsx
const [authState, setAuthState] = useState<AuthenticationState>({
  isLoading: false,
  authenticationId: null,
  // ... 10 more properties
});
const [loadingMessage, setLoadingMessage] = useState('');
const [showOTPModal, setShowOTPModal] = useState(false);
const [showFIDO2Modal, setShowFIDO2Modal] = useState(false);
const [showPushModal, setShowPushModal] = useState(false);
const [otpCode, setOtpCode] = useState('');
const [isValidatingOTP, setIsValidatingOTP] = useState(false);
const [otpError, setOtpError] = useState<string | null>(null);
const [isAuthenticatingFIDO2, setIsAuthenticatingFIDO2] = useState(false);
const [fido2Error, setFido2Error] = useState<string | null>(null);
const [userDevices, setUserDevices] = useState<Array<Record<string, unknown>>>([]);
const [isLoadingDevices, setIsLoadingDevices] = useState(false);
const [devicesError, setDevicesError] = useState<string | null>(null);
// ... plus 500 more lines of effects and handlers
```

### After (With Hooks):
```tsx
import {
  useMFAAuthentication,
  useMFADevices,
  useMFAPolicy,
  useFIDO2Authentication
} from './hooks';

// Authentication
const {
  authState,
  loadingMessage,
  showOTPModal,
  showFIDO2Modal,
  showPushModal,
  otpCode,
  isValidatingOTP,
  otpError,
  isAuthenticatingFIDO2,
  fido2Error,
  handleStartMFA,
  setAuthState,
  setLoadingMessage,
  // ... other values/setters as needed
} = useMFAAuthentication({
  onDeviceFailureError: handleDeviceFailureError
});

// Devices
const {
  userDevices,
  isLoadingDevices,
  devicesError,
  showDeviceFailureModal,
  deviceFailureError,
  unavailableDevices,
  handleDeviceFailureError,
  // ... other values/setters
} = useMFADevices({
  environmentId: credentials.environmentId,
  username: usernameInput,
  tokenStatus
});

// Policy
const {
  deviceAuthPolicies,
  isLoadingPolicies,
  loadPolicies,
  handlePolicySelect,
  extractAllowedDeviceTypes
} = useMFAPolicy({
  environmentId: credentials.environmentId,
  tokenStatus,
  currentPolicyId: credentials.deviceAuthenticationPolicyId,
  onAutoSelect: (policyId) => {
    setCredentials(prev => ({ ...prev, deviceAuthenticationPolicyId: policyId }))
  }
});

// FIDO2
const {
  showUsernameDecisionModal,
  isPasskeyRegistrationMode,
  handleUsernamelessFIDO2,
  setShowUsernameDecisionModal,
  setIsPasskeyRegistrationMode
} = useFIDO2Authentication();
```

**Result**: Same functionality, ~60 lines instead of ~870 lines

---

## ✅ Success Criteria

### For Hook Integration:
- [ ] Build passes without errors
- [ ] All authentication flows work (SMS, Email, TOTP, FIDO2, Push)
- [ ] Device loading works correctly
- [ ] Policy selection works correctly
- [ ] No TypeScript errors
- [ ] No console errors during testing
- [ ] Passkey authentication works

### For Modal Extraction:
- [ ] Modals open/close correctly
- [ ] Form submissions work
- [ ] Styling preserved
- [ ] Build passes

---

## 🚨 Important Notes

### Before Making Changes:
1. ✅ Ensure you're on a feature branch
2. ✅ Commit current working state
3. ✅ Make incremental changes (one hook at a time)
4. ✅ Test after each integration
5. ✅ Keep original code until fully tested

### Testing Checklist:
- [ ] Start authentication with username
- [ ] Select device
- [ ] Complete OTP flow
- [ ] Complete FIDO2 flow
- [ ] Complete Push flow
- [ ] Test usernameless passkey auth
- [ ] Test device failure scenarios
- [ ] Test policy selection
- [ ] Test worker token refresh
- [ ] Verify error handling

---

## 📚 Reference Files

- **Hooks**: `src/v8/flows/MFAAuthenticationMainPageV8/hooks/`
- **Main Component**: `src/v8/flows/MFAAuthenticationMainPageV8.tsx` (5,543 lines)
- **Plan Document**: `REFACTORING_PLAN.md`
- **Session Summary**: `REFACTORING_SESSION_1.md`

---

## 🎯 Recommended Path Forward

**Start with Option A (Hook Integration)** because:
1. ✅ Highest impact (reduces ~800 lines)
2. ✅ Lowest risk (hooks are tested, just need to connect)
3. ✅ Improves testability immediately
4. ✅ Makes future refactoring easier
5. ✅ Can be done incrementally

**Timeline**: 1 day of focused work

**If you need help**, reference:
- Hook documentation in the hook files themselves
- TypeScript interfaces for required parameters
- Example usage in hook JSDoc comments

---

## 💡 Tips

- **Start small**: Integrate one hook, test it, commit it
- **Use TypeScript**: Let the compiler guide you
- **Keep console open**: Watch for errors during testing
- **Test incrementally**: Don't wait until all hooks are integrated
- **Ask for help**: If stuck, the hooks have clear interfaces

Good luck! 🚀
