# Fix for MFA Device Selection Not Showing

## Problem
When MFA authentication is initialized and returns `DEVICE_SELECTION_REQUIRED`, the device list is not being displayed to the user.

## Root Cause
In `src/v8/flows/MFAAuthenticationMainPageV8.tsx`, around line 1387, when `needsDeviceSelection` is true, the code doesn't show any UI for device selection. It only handles OTP, Push, FIDO2, and Completed statuses.

## Solution

### Step 1: Find this code (around line 1387):
```typescript
// Show appropriate modal
if (needsOTP) {
    setShowOTPModal(true);
} else if (needsPush) {
    setShowPushModal(true);
    toastV8.success('Please approve the sign-in on your phone.');
} else if (needsAssertion) {
    setShowFIDO2Modal(true);
} else if (status === 'COMPLETED') {
    toastV8.success('Authentication completed successfully!');
} else {
    toastV8.success('Authentication started successfully');
}
```

### Step 2: Replace with this code:
```typescript
// Show appropriate modal
if (needsDeviceSelection) {
    // Device selection is needed - the UI will show the device list automatically
    // based on authState.showDeviceSelection being true
    toastV8.success('Please select a device to continue');
} else if (needsOTP) {
    setShowOTPModal(true);
} else if (needsPush) {
    setShowPushModal(true);
    toastV8.success('Please approve the sign-in on your phone.');
} else if (needsAssertion) {
    setShowFIDO2Modal(true);
} else if (status === 'COMPLETED') {
    toastV8.success('Authentication completed successfully!');
} else {
    toastV8.success('Authentication started successfully');
}
```

### Step 3: Add Device Selection UI

Find the section with `{/* Authentication Status */}` (around line 3670) and add this BEFORE it:

```typescript
{/* Device Selection Section - Show when authentication requires device selection */}
{authState.showDeviceSelection && authState.devices.length > 0 && (
    <div
        style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '2px solid #3b82f6',
        }}
    >
        <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
            Select Device for Authentication
        </h2>
        <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#6b7280' }}>
            Multiple devices are available. Please select one to continue authentication.
        </p>
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '16px',
            }}
        >
            {authState.devices.map((device) => (
                <button
                    key={device.id}
                    type="button"
                    onClick={async () => {
                        if (!authState.authenticationId || !authState.userId) {
                            toastV8.error('Authentication session not found');
                            return;
                        }

                        try {
                            setAuthState((prev) => ({ ...prev, isLoading: true }));

                            const data = await MfaAuthenticationServiceV8.selectDeviceForAuthentication({
                                environmentId: credentials.environmentId,
                                username: usernameInput.trim(),
                                userId: authState.userId,
                                authenticationId: authState.authenticationId,
                                deviceId: device.id,
                                region: credentials.region,
                                customDomain: credentials.customDomain,
                            });

                            const status = data.status || '';
                            const nextStep = data.nextStep || '';
                            const challengeId = (data.challengeId as string) || null;

                            setAuthState((prev) => ({
                                ...prev,
                                isLoading: false,
                                status,
                                nextStep,
                                selectedDeviceId: device.id,
                                challengeId,
                                showDeviceSelection: false,
                            }));

                            // Handle next step
                            if (status === 'OTP_REQUIRED' || nextStep === 'OTP_REQUIRED') {
                                setShowOTPModal(true);
                                toastV8.success('OTP has been sent');
                            } else if (status === 'ASSERTION_REQUIRED' || nextStep === 'ASSERTION_REQUIRED') {
                                setShowFIDO2Modal(true);
                            } else if (status === 'PUSH_CONFIRMATION_REQUIRED') {
                                setShowPushModal(true);
                            } else if (status === 'COMPLETED') {
                                toastV8.success('Authentication completed!');
                            }
                        } catch (error) {
                            console.error(`${MODULE_TAG} Failed to select device:`, error);
                            toastV8.error(error instanceof Error ? error.message : 'Failed to select device');
                            setAuthState((prev) => ({ ...prev, isLoading: false }));
                        }
                    }}
                    style={{
                        padding: '16px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        background: '#f9fafb',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'left',
                        width: '100%',
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.background = '#eff6ff';
                        e.currentTarget.style.borderColor = '#3b82f6';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.2)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.background = '#f9fafb';
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <div
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '8px',
                                background: '#3b82f6',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '20px',
                            }}
                        >
                            {device.type === 'SMS' || device.type === 'VOICE' ? (
                                <FiPhone color="white" />
                            ) : device.type === 'EMAIL' ? (
                                <FiMail color="white" />
                            ) : device.type === 'FIDO2' ? (
                                <FiKey color="white" />
                            ) : (
                                <FiShield color="white" />
                            )}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                                {device.nickname || device.type}
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                {device.type}
                                {device.phone && ` • ${device.phone}`}
                                {device.email && ` • ${device.email}`}
                            </div>
                        </div>
                    </div>
                </button>
            ))}
        </div>
    </div>
)}
```

## Testing
1. Start MFA authentication with a user that has multiple devices
2. When PingOne returns `DEVICE_SELECTION_REQUIRED`, you should now see a blue-bordered section titled "Select Device for Authentication"
3. Click on a device to select it and continue authentication
4. The appropriate modal (OTP, FIDO2, Push) should appear based on the device type

## Summary
The fix ensures that when `needsDeviceSelection` is true, the UI displays the available devices from `authState.devices` and allows the user to select one to continue authentication.
