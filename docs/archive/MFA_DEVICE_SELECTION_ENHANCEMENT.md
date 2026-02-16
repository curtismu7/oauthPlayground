# MFA Device Selection Enhancement

## Overview
Enhance Step 1 of the MFA flow to show existing devices and allow users to either:
1. Select an existing device
2. Register a new device

## State Changes Needed

Add to component state:
```typescript
const [existingDevices, setExistingDevices] = useState<Array<Record<string, unknown>>>([]);
const [loadingDevices, setLoadingDevices] = useState(false);
const [selectedExistingDevice, setSelectedExistingDevice] = useState<string>(''); // 'new' or deviceId
const [showRegisterForm, setShowRegisterForm] = useState(false);
```

## New Function: loadExistingDevices

```typescript
const loadExistingDevices = async () => {
  if (!credentials.environmentId || !credentials.username) {
    return;
  }
  
  setLoadingDevices(true);
  try {
    const devices = await MFAServiceV8.getAllDevices({
      environmentId: credentials.environmentId,
      username: credentials.username,
    });
    
    setExistingDevices(devices);
    
    // If no devices, show register form by default
    if (devices.length === 0) {
      setShowRegisterForm(true);
      setSelectedExistingDevice('new');
    }
  } catch (error) {
    console.error('Failed to load devices', error);
    setShowRegisterForm(true);
    setSelectedExistingDevice('new');
  } finally {
    setLoadingDevices(false);
  }
};
```

## UI Components

### 1. Loading State
Show spinner while loading devices

### 2. Existing Devices List
- Radio button selection
- Show device type icon (📱 SMS, 📧 EMAIL, 🔐 TOTP, 🔑 FIDO2)
- Show device nickname
- Show device status
- Show phone/email if available

### 3. Register New Device Option
- Dashed border card
- "➕ Register New Device" text
- Shows registration form when selected

### 4. Use Selected Device Button
- Only shown when existing device is selected
- Marks step as complete
- Moves to next step

### 5. Register Form
- Only shown when "new" is selected
- Same form as current implementation

## Benefits

✅ Better UX - users can reuse existing devices
✅ Faster flow - no need to register every time
✅ Device management - see all registered devices
✅ Realistic - matches real-world MFA flows

## Implementation Status

Need to modify `src/v8/flows/MFAFlowV8.tsx`:
1. Add state variables
2. Add loadExistingDevices function
3. Modify renderStep1 to show device selection UI
4. Load devices when entering Step 1

