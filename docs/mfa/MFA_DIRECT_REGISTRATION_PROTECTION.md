# MFA Direct Registration Flow - Protection Document

## CRITICAL: Do Not Break This Implementation

**Date Created**: January 31, 2026  
**Component**: `UnifiedConfigurationStep.modern.tsx`  
**Purpose**: Direct registration for MFA OTP and TOTP devices

---

## Overview

MFA OTP (EMAIL, SMS, WHATSAPP) and TOTP devices MUST always register directly from the configuration step. This is not a bug - this is the correct, required behavior.

---

## Flow Types (CRITICAL)

### 1. Admin - Active (`admin-active`)
```
Configuration → Register Device (status: ACTIVE) → Skip Activation → Success
```
- Device is immediately ready to use
- **NO OTP activation required**
- Goes directly to success page (Step 2)

### 2. Admin - Activation Required (`admin-activation`)
```
Configuration → Register Device (status: ACTIVATION_REQUIRED) → OTP Activation → Success
```
- Device requires activation
- **OTP activation IS required** (Step 1)
- PingOne automatically sends OTP
- User must enter OTP code to activate

### 3. User Flow (`user`)
```
Configuration → Register Device → PingOne Login → OTP Activation → Success
```
- Requires PingOne authentication
- **MUST go through activation** (Step 1)
- User authenticates with PingOne
- Then completes OTP activation

---

## Protected Devices

These devices MUST ALWAYS register directly:

```typescript
const DIRECT_REGISTRATION_DEVICES = ['EMAIL', 'SMS', 'WHATSAPP', 'TOTP'];
```

**Never remove devices from this list!**

---

## Critical Validation Rules

### Rule 1: Flow Type Validation
```typescript
// CRITICAL: Only admin-active flow creates ACTIVE devices
const deviceStatus = selectedFlowType === 'admin-active' ? 'ACTIVE' : 'ACTIVATION_REQUIRED';
```

### Rule 2: Registration Result Validation
```typescript
// CRITICAL VALIDATION: Ensure activation flow is followed correctly
if (result.status === 'ACTIVATION_REQUIRED' && selectedFlowType === 'admin-active') {
    console.error(`${MODULE_TAG} ERROR: Expected ACTIVE but got ACTIVATION_REQUIRED`);
    throw new Error('Device registration flow mismatch - expected ACTIVE device');
}
```

### Rule 3: Routing Logic
```typescript
/**
 * ROUTING LOGIC - CRITICAL:
 * - ACTIVE devices: Skip activation → Go to success (Step 2)
 * - ACTIVATION_REQUIRED: MUST go to activation step (Step 1) for OTP entry
 * - User flow: MUST go to activation (Step 1) even if device shows as ACTIVE
 */
if (result.status === 'ACTIVE' && selectedFlowType === 'admin-active') {
    nav.goToStep(2); // Skip activation
} else {
    nav.goToNext(); // Go to activation
}
```

---

## Common Mistakes to Avoid

### ❌ WRONG: Removing direct registration
```typescript
// This breaks the flow - devices will go to unnecessary form step
if (deviceType === 'EMAIL') {
    nav.goToNext(); // Wrong! Should register directly
}
```

### ✅ CORRECT: Direct registration
```typescript
if (DIRECT_REGISTRATION_DEVICES.includes(deviceType)) {
    await MFAServiceV8.registerDevice(params);
    // Handle routing based on status
}
```

### ❌ WRONG: Skipping activation for ACTIVATION_REQUIRED
```typescript
// This breaks OTP flow - activation is required!
if (result.status === 'ACTIVATION_REQUIRED') {
    nav.goToStep(2); // Wrong! Should go to activation
}
```

### ✅ CORRECT: Always activate when required
```typescript
if (result.status === 'ACTIVATION_REQUIRED') {
    nav.goToNext(); // Correct - go to activation step
}
```

### ❌ WRONG: Not checking flow type
```typescript
// This breaks admin-active flow - should skip activation!
if (result.status === 'ACTIVE') {
    nav.goToNext(); // Wrong! Should skip to success
}
```

### ✅ CORRECT: Check flow type AND status
```typescript
if (result.status === 'ACTIVE' && selectedFlowType === 'admin-active') {
    nav.goToStep(2); // Correct - skip activation
}
```

---

## Testing Checklist

Before making changes, verify ALL these scenarios work:

### EMAIL Device
- [ ] Admin-Active: Register → Success (no activation)
- [ ] Admin-Activation: Register → OTP sent → Enter OTP → Success
- [ ] User Flow: Register → PingOne login → OTP → Success

### SMS Device
- [ ] Admin-Active: Register → Success (no activation)
- [ ] Admin-Activation: Register → OTP sent → Enter OTP → Success
- [ ] User Flow: Register → PingOne login → OTP → Success

### WHATSAPP Device
- [ ] Admin-Active: Register → Success (no activation)
- [ ] Admin-Activation: Register → OTP sent → Enter OTP → Success
- [ ] User Flow: Register → PingOne login → OTP → Success

### TOTP Device
- [ ] Admin-Active: Register → Success (no activation)
- [ ] Admin-Activation: Register → Scan QR → Enter code → Success
- [ ] User Flow: Register → PingOne login → Scan QR → Enter code → Success

---

## File Locations

**Primary File**: 
```
src/v8/flows/unified/components/UnifiedConfigurationStep.modern.tsx
```

**Related Files**:
- `src/v8/flows/unified/UnifiedMFARegistrationFlowV8.tsx`
- `src/v8/flows/unified/components/UnifiedActivationStep.tsx`
- `src/v8/services/mfaServiceV8.ts`

---

## Debug Logging

All critical operations are logged with `[⚙️ UNIFIED-CONFIG-MODERN]` tag:

```typescript
console.log(`${MODULE_TAG} Registering ${deviceType} device directly with flow type: ${selectedFlowType}`);
console.log(`${MODULE_TAG} Device registered with status:`, result.status);
console.log(`${MODULE_TAG} Admin Active flow: Skipping activation, going to success`);
console.log(`${MODULE_TAG} Activation required: Going to activation step`);
```

Always check console logs when debugging flow issues.

---

## Emergency Rollback

If changes break the flow, revert to commit with this message:
```
"Fix MFA direct registration with proper flow type handling"
```

Or restore from this protection document.

---

## Questions?

If unsure about changes to this flow:
1. Check this document first
2. Test ALL flow types (admin-active, admin-activation, user)
3. Verify ALL device types (EMAIL, SMS, WHATSAPP, TOTP)
4. Check console logs for validation errors

**When in doubt, don't change it!**
