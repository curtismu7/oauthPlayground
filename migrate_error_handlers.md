# Error Handler Migration Script

## Completed
- ✅ WhatsAppFlowV8.tsx - 1 of 6 catch blocks migrated
  - Line 213: authenticateExistingDevice ✅

## Remaining in WhatsAppFlowV8.tsx

### Line 121: loadExistingDevices (Silent failure)
```typescript
// Current
} catch (error) {
  if (cancelled) return;
  console.error(`${MODULE_TAG} Failed to load devices`, error);
  setDeviceSelection(prev => ({...prev, loadingDevices: false, selectedExistingDevice: 'new'}));
}

// Replace with
} catch (error) {
  if (cancelled) return;
  UnifiedFlowErrorHandler.handleError(error, {
    flowType: 'mfa' as any,
    deviceType: 'WHATSAPP',
    operation: 'loadExistingDevices',
  }, {
    showToast: false,
    logError: true,
  });
  setDeviceSelection(prev => ({...prev, loadingDevices: false, selectedExistingDevice: 'new'}));
}
```

### Line 911: fetchUserPhone (Silent failure)
```typescript
// Current
} catch (error) {
  console.error(`${MODULE_TAG} Failed to fetch user phone from PingOne:`, error);
}

// Replace with  
} catch (error) {
  UnifiedFlowErrorHandler.handleError(error, {
    flowType: 'mfa' as any,
    deviceType: 'WHATSAPP',
    operation: 'fetchUserPhone',
  }, {
    showToast: false,
    logError: true,
  });
}
```

### Line 1257: registerDevice
Needs detailed review - has WhatsApp not enabled check

### Line 2317: activateDevice
Needs toast error handling

### Line 2447: resendOTP  
Needs toast error handling

## MobileFlowV8.tsx
Similar pattern - needs all catch blocks migrated

## Services
- mfaServiceV8.ts
- mfaAuthenticationServiceV8.ts

## Estimated Time Remaining
- WhatsAppFlowV8: 15 minutes (5 catch blocks)
- MobileFlowV8: 15 minutes
- Services: 30 minutes
- **Total: 1 hour**

