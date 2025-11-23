# MFA Device Selector Integration Steps

## ✅ Completed
1. Created `MFADeviceSelectorV8` component
2. Fixed OTP sending for SMS/EMAIL devices

## 🔄 Next Steps - Integration into MFAFlowV8.tsx

### 1. Add Import
```typescript
import { MFADeviceSelectorV8 } from '@/v8/components/MFADeviceSelectorV8';
```

### 2. Add State Variables (after line ~120)
```typescript
const [existingDevices, setExistingDevices] = useState<Array<Record<string, unknown>>>([]);
const [loadingDevices, setLoadingDevices] = useState(false);
const [selectedExistingDevice, setSelectedExistingDevice] = useState<string>('');
const [showRegisterForm, setShowRegisterForm] = useState(false);
```

### 3. Add Load Devices Function (before renderStep1)
```typescript
const loadExistingDevices = async () => {
  if (!credentials.environmentId || !credentials.username || !tokenStatus.isValid) {
    return;
  }
  
  console.log(`${MODULE_TAG} Loading existing devices`);
  setLoadingDevices(true);
  
  try {
    const devices = await MFAServiceV8.getAllDevices({
      environmentId: credentials.environmentId,
      username: credentials.username,
    });
    
    console.log(`${MODULE_TAG} Loaded ${devices.length} devices`);
    setExistingDevices(devices);
    
    if (devices.length === 0) {
      setShowRegisterForm(true);
      setSelectedExistingDevice('new');
    }
  } catch (error) {
    console.error(`${MODULE_TAG} Failed to load devices`, error);
    setShowRegisterForm(true);
    setSelectedExistingDevice('new');
  } finally {
    setLoadingDevices(false);
  }
};
```

### 4. Modify renderStep1 Function

Add at the beginning of renderStep1:
```typescript
// Load devices when entering step 1
React.useEffect(() => {
  if (nav.currentStep === 1 && existingDevices.length === 0 && !loadingDevices) {
    loadExistingDevices();
  }
}, [nav.currentStep]);
```

Add device selector before the registration form:
```typescript
<MFADeviceSelectorV8
  devices={existingDevices}
  loading={loadingDevices}
  selectedDeviceId={selectedExistingDevice}
  onSelectDevice={(deviceId) => {
    setSelectedExistingDevice(deviceId);
    setShowRegisterForm(false);
    
    // Find and set device info
    const device = existingDevices.find(d => d.id === deviceId);
    if (device) {
      setMfaState({
        ...mfaState,
        deviceId: device.id as string,
        deviceStatus: device.status as string,
        nickname: device.nickname as string,
      });
    }
  }}
  onUseDevice={() => {
    console.log(`${MODULE_TAG} Using existing device`, { deviceId: selectedExistingDevice });
    nav.markStepComplete();
    toastV8.success('Device selected successfully!');
  }}
  onRegisterNew={() => {
    setSelectedExistingDevice('new');
    setShowRegisterForm(true);
    setMfaState({
      ...mfaState,
      deviceId: '',
      deviceStatus: '',
    });
  }}
  deviceType={credentials.deviceType}
  disabled={!tokenStatus.isValid}
/>
```

Wrap existing registration form in conditional:
```typescript
{showRegisterForm && (
  <>
    {/* Existing registration form code */}
  </>
)}
```

## Benefits

✅ **Better UX** - Users can reuse existing devices
✅ **Faster** - No need to register every time  
✅ **Realistic** - Matches real-world MFA flows
✅ **Device Management** - See all registered devices
✅ **Accessible** - Proper color contrast and keyboard navigation

## Testing

1. Navigate to `/v8/mfa`
2. Complete Step 0 with valid credentials
3. On Step 1, should see:
   - Loading spinner while fetching devices
   - List of existing devices (if any)
   - "Register New Device" option
   - Can select existing device and click "Use Selected Device"
   - Can select "Register New Device" to show registration form

## Status

- ✅ Component created
- ✅ Follows V8 naming conventions
- ✅ Follows accessibility rules (color contrast)
- ⏳ Integration pending (manual step due to file size)

