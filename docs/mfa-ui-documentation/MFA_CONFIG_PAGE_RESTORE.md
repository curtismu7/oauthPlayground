# MFA Configuration Page Restore Document

**Last Updated:** 2026-01-06 14:30:00  
**Version:** 1.0.0  
**Purpose:** Implementation details for restoring the MFA Configuration Page if it breaks or drifts  
**Usage:** Use this document to restore correct implementations when the configuration page breaks or regresses

---

## Related Documentation

- [MFA Configuration Page UI Contract](./MFA_CONFIG_PAGE_UI_CONTRACT.md) - UI behavior contracts
- [MFA Configuration Page UI Documentation](./MFA_CONFIG_PAGE_UI_DOC.md) - Complete UI structure

---

## Overview

This document provides implementation details, code snippets, and restoration guidance for the MFA Configuration Page (`MFAConfigurationPageV8.tsx`).

---

## File Location

**Component:** `src/v8/flows/MFAConfigurationPageV8.tsx`

---

## Critical Implementation Details

### 1. Section Order (MUST BE MAINTAINED)

**Contract:** Sections must appear in this exact order:

1. **Worker Token Settings** (ALWAYS FIRST)
2. **Device Authentication Policy Settings** (if `environmentId` exists)
3. **PingOne MFA Settings** (if `environmentId` exists)
4. **Default Policies**
5. **OTP Settings**
6. **FIDO2/WebAuthn Settings**
7. **Push Notification Settings**
8. **UI/UX Settings**
9. **Security Settings**

**Implementation:**
```typescript
<div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
  {/* 1. Worker Token Settings - ALWAYS FIRST */}
  <ConfigSection title="Worker Token Settings" description="...">
    {/* Worker token settings */}
  </ConfigSection>

  {/* 2. Device Authentication Policy Settings - SECOND (if environmentId exists) */}
  {environmentId && (
    <ConfigSection title="Device Authentication Policy Settings" description="...">
      {/* Policy selector at top */}
      {/* Policy settings */}
    </ConfigSection>
  )}

  {/* 3. PingOne MFA Settings - THIRD (if environmentId exists) */}
  {environmentId && (
    <ConfigSection title="PingOne MFA Settings" description="...">
      {/* PingOne settings */}
    </ConfigSection>
  )}

  {/* 4-9. Other sections */}
</div>
```

---

### 2. Policy Selector Position (CRITICAL)

**Contract:** Policy selector MUST be at the top of Device Authentication Policy Settings section, BEFORE the info box.

**Correct Implementation:**
```typescript
<ConfigSection title="Device Authentication Policy Settings" description="...">
  {/* Policy Selector - AT TOP */}
  <div style={{ marginBottom: '20px' }}>
    <label>Select Policy</label>
    <select value={selectedPolicyId} onChange={...}>
      {deviceAuthPolicies.map((policy) => (
        <option key={policy.id} value={policy.id}>
          {policy.name} {policy.description ? `- ${policy.description}` : ''}
        </option>
      ))}
    </select>
    <p>Select a policy to view and edit its settings...</p>
  </div>

  {/* Info Box - AFTER Policy Selector */}
  <div style={{ marginBottom: '20px', padding: '12px', background: '#eff6ff', ... }}>
    {/* Info box content */}
  </div>

  {/* Policy Settings - AFTER Info Box */}
  {selectedPolicy && (
    <>
      {/* Policy settings */}
    </>
  )}
</ConfigSection>
```

**Incorrect Implementation (DO NOT DO THIS):**
```typescript
// ❌ WRONG: Info box before policy selector
<ConfigSection>
  <InfoBox /> {/* WRONG POSITION */}
  <PolicySelector /> {/* Should be first */}
</ConfigSection>
```

---

### 3. Region Parameter (CRITICAL)

**Contract:** `updateDeviceAuthenticationPolicy()` MUST receive `credentials.region` parameter.

**Correct Implementation:**
```typescript
const handleSavePolicy = async () => {
  // ... validation ...
  
  const credentials = await workerTokenServiceV8.loadCredentials();
  if (!credentials) {
    toastV8.error('Worker token credentials are missing...');
    return;
  }
  
  await MFAServiceV8.updateDeviceAuthenticationPolicy(
    environmentId,
    selectedPolicyId,
    policyUpdate,
    credentials.region // ✅ CRITICAL: Must pass region
  );
};
```

**Incorrect Implementation (DO NOT DO THIS):**
```typescript
// ❌ WRONG: Missing region parameter
await MFAServiceV8.updateDeviceAuthenticationPolicy(
  environmentId,
  selectedPolicyId,
  policyUpdate
  // Missing: credentials.region
);
```

---

### 4. DOM Nesting (CRITICAL)

**Contract:** `MFAInfoButtonV8` must NOT be nested inside `<p>` tags.

**Correct Implementation:**
```typescript
// ✅ CORRECT: MFAInfoButtonV8 in div, not p
<div style={{ margin: 0, fontSize: '13px', color: '#1e40af', lineHeight: '1.5' }}>
  Device Authentication Policies control policy-specific settings...
  <MFAInfoButtonV8 contentKey="device.authentication.policy" displayMode="tooltip" />
</div>
```

**Incorrect Implementation (DO NOT DO THIS):**
```typescript
// ❌ WRONG: MFAInfoButtonV8 nested in <p>
<p style={{ margin: 0, fontSize: '13px', color: '#1e40af' }}>
  Device Authentication Policies control policy-specific settings...
  <MFAInfoButtonV8 contentKey="device.authentication.policy" displayMode="tooltip" />
</p>
```

**Fix:**
- Replace `<p>` with `<div>` when containing `MFAInfoButtonV8`
- Or move `MFAInfoButtonV8` outside `<p>` tag

---

### 5. Policy Update Object Structure

**Contract:** Policy update must include all relevant fields, even if they are defaults.

**Correct Implementation:**
```typescript
const policyUpdate = {
  otp: {
    failure: {
      coolDown: {
        duration: selectedPolicy.otp?.failure?.coolDown?.duration ?? 0,
        timeUnit: selectedPolicy.otp?.failure?.coolDown?.timeUnit ?? 'MINUTES',
      },
    },
  },
  authentication: {
    deviceSelection: selectedPolicy.authentication?.deviceSelection ?? 'PROMPT_TO_SELECT_DEVICE',
  },
  pairingDisabled: selectedPolicy.pairingDisabled ?? false,
  promptForNicknameOnPairing: selectedPolicy.promptForNicknameOnPairing ?? false,
  skipUserLockVerification: selectedPolicy.skipUserLockVerification ?? false,
};
```

**Notes:**
- All fields must be explicitly included (not just changed fields)
- Use nullish coalescing (`??`) for defaults
- This ensures API Display shows complete request body

---

### 6. Change Tracking

**Contract:** Each section must track changes independently.

**Implementation:**
```typescript
// Local configuration changes
const [hasChanges, setHasChanges] = useState(false);

// PingOne settings changes
const [hasPingOneSettingsChanges, setHasPingOneSettingsChanges] = useState(false);

// Policy changes
const [hasPolicyChanges, setHasPolicyChanges] = useState(false);

// Update handlers
const updateConfig = (key: string, value: unknown) => {
  setConfig((prev) => ({ ...prev, [key]: value }));
  setHasChanges(true); // ✅ Track local config changes
};

const updatePingOneSettings = (updates: Partial<MFASettings>) => {
  setPingOneSettings((prev) => ({ ...prev, ...updates }));
  setHasPingOneSettingsChanges(true); // ✅ Track PingOne settings changes
};

const updatePolicy = (updates: Partial<DeviceAuthenticationPolicy>) => {
  setSelectedPolicy((prev) => ({ ...prev, ...updates }));
  setHasPolicyChanges(true); // ✅ Track policy changes
};
```

---

### 7. Environment ID Loading

**Contract:** Environment ID must be loaded from worker token credentials, and PingOne sections should only load if worker token is valid.

**Correct Implementation:**
```typescript
useEffect(() => {
  const loadEnvironmentAndSettings = async () => {
    try {
      const credentials = await workerTokenServiceV8.loadCredentials();
      if (credentials?.environmentId) {
        setEnvironmentId(credentials.environmentId);
        
        // Only try to load PingOne settings if worker token is available
        const tokenStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
        if (tokenStatus.isValid) {
          await loadPingOneSettings(credentials.environmentId);
          await loadDeviceAuthPolicies(credentials.environmentId);
        } else {
          // Silently skip loading settings if no worker token is available
          console.log(`${MODULE_TAG} Skipping PingOne MFA settings load - worker token not available`);
        }
      }
    } catch (error) {
      console.error(`${MODULE_TAG} Failed to load environment ID:`, error);
    }
  };
  loadEnvironmentAndSettings();
}, [loadPingOneSettings, loadDeviceAuthPolicies]);
```

**Notes:**
- Do NOT show errors when worker token is missing
- Silently skip loading PingOne settings if token is invalid
- This prevents error spam when worker token hasn't been configured yet

---

### 8. API Display Padding

**Contract:** Page padding bottom must adjust based on API display visibility.

**Implementation:**
```typescript
const [isApiDisplayVisible, setIsApiDisplayVisible] = useState(
  apiDisplayServiceV8.isVisible()
);

useEffect(() => {
  const unsubscribe = apiDisplayServiceV8.subscribe((visible) => {
    setIsApiDisplayVisible(visible);
  });
  return () => unsubscribe();
}, []);

// In JSX
<div
  style={{
    padding: '24px',
    paddingBottom: isApiDisplayVisible ? '450px' : '24px',
    maxWidth: '1200px',
    margin: '0 auto',
    transition: 'padding-bottom 0.3s ease',
  }}
>
```

---

### 9. Helper Component Implementations

**ToggleSetting:**
```typescript
const ToggleSetting: React.FC<ToggleSettingProps> = ({ label, description, value, onChange }) => {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
        <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', cursor: 'pointer' }}>
          {label}
        </label>
        <button
          type="button"
          onClick={() => onChange(!value)}
          style={{
            width: '44px',
            height: '24px',
            borderRadius: '12px',
            border: 'none',
            background: value ? '#10b981' : '#d1d5db',
            cursor: 'pointer',
            position: 'relative',
            transition: 'background 0.2s ease',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '2px',
              left: value ? '22px' : '2px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: 'white',
              transition: 'left 0.2s ease',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            }}
          />
        </button>
      </div>
      {description && (
        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>{description}</p>
      )}
    </div>
  );
};
```

**NumberSetting:**
```typescript
const NumberSetting: React.FC<NumberSettingProps> = ({
  label,
  description,
  value,
  onChange,
  min,
  max,
}) => {
  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '500',
          color: '#374151',
          marginBottom: '8px',
        }}
      >
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const num = parseInt(e.target.value, 10);
          if (!Number.isNaN(num)) {
            const clamped =
              min !== undefined && max !== undefined ? Math.max(min, Math.min(max, num)) : num;
            onChange(clamped);
          }
        }}
        min={min}
        max={max}
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          fontSize: '14px',
        }}
      />
      {description && (
        <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#6b7280' }}>{description}</p>
      )}
    </div>
  );
};
```

**SelectSetting:**
```typescript
const SelectSetting: React.FC<SelectSettingProps> = ({
  label,
  description,
  value,
  onChange,
  options,
}) => {
  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '500',
          color: '#374151',
          marginBottom: '8px',
        }}
      >
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => {
          const selectedOption = options.find((opt) => String(opt.value) === e.target.value);
          if (selectedOption) {
            onChange(selectedOption.value);
          }
        }}
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          fontSize: '14px',
          background: 'white',
        }}
      >
        {options.map((option) => (
          <option key={String(option.value)} value={String(option.value)}>
            {option.label}
          </option>
        ))}
      </select>
      {description && (
        <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#6b7280' }}>{description}</p>
      )}
    </div>
  );
};
```

**TextSetting:**
```typescript
const TextSetting: React.FC<TextSettingProps> = ({ label, description, value, onChange }) => {
  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '500',
          color: '#374151',
          marginBottom: '8px',
        }}
      >
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          fontSize: '14px',
        }}
      />
      {description && (
        <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#6b7280' }}>{description}</p>
      )}
    </div>
  );
};
```

**ConfigSection:**
```typescript
const ConfigSection: React.FC<ConfigSectionProps> = ({ title, description, children }) => {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
      }}
    >
      <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
        {title}
      </h2>
      <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#6b7280' }}>{description}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>{children}</div>
    </div>
  );
};
```

---

## Common Issues and Fixes

### Issue 1: Policy Selector Not at Top

**Symptom:** Policy selector appears after info box or policy settings

**Fix:**
```typescript
// Move policy selector div to be the first child of ConfigSection
<ConfigSection>
  {/* Policy Selector - FIRST */}
  <div style={{ marginBottom: '20px' }}>
    <label>Select Policy</label>
    <select>...</select>
  </div>
  
  {/* Info Box - SECOND */}
  <div>...</div>
  
  {/* Policy Settings - THIRD */}
  {selectedPolicy && <>...</>}
</ConfigSection>
```

### Issue 2: Region Parameter Missing

**Symptom:** Policy update fails or region defaults to 'us'

**Fix:**
```typescript
// Load credentials and pass region
const credentials = await workerTokenServiceV8.loadCredentials();
if (!credentials) {
  toastV8.error('Worker token credentials are missing...');
  return;
}

await MFAServiceV8.updateDeviceAuthenticationPolicy(
  environmentId,
  selectedPolicyId,
  policyUpdate,
  credentials.region // ✅ Add this
);
```

### Issue 3: DOM Nesting Warnings

**Symptom:** React warnings: `<h4> cannot appear as a descendant of <p>`

**Fix:**
```typescript
// Replace <p> with <div> when containing MFAInfoButtonV8
// ❌ WRONG:
<p>
  Text here
  <MFAInfoButtonV8 />
</p>

// ✅ CORRECT:
<div>
  Text here
  <MFAInfoButtonV8 />
</div>
```

### Issue 4: Worker Token Settings Not First

**Symptom:** Worker Token Settings section appears after other sections

**Fix:**
```typescript
// Ensure Worker Token Settings is the first ConfigSection
<div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
  {/* 1. Worker Token Settings - FIRST */}
  <ConfigSection title="Worker Token Settings">...</ConfigSection>
  
  {/* 2. Device Authentication Policy Settings - SECOND */}
  {environmentId && (
    <ConfigSection title="Device Authentication Policy Settings">...</ConfigSection>
  )}
  
  {/* Other sections... */}
</div>
```

### Issue 5: Policy Update Missing Fields

**Symptom:** API Display doesn't show all policy fields in request body

**Fix:**
```typescript
// Include ALL fields in policyUpdate, even defaults
const policyUpdate = {
  otp: {
    failure: {
      coolDown: {
        duration: selectedPolicy.otp?.failure?.coolDown?.duration ?? 0,
        timeUnit: selectedPolicy.otp?.failure?.coolDown?.timeUnit ?? 'MINUTES',
      },
    },
  },
  authentication: {
    deviceSelection: selectedPolicy.authentication?.deviceSelection ?? 'PROMPT_TO_SELECT_DEVICE',
  },
  pairingDisabled: selectedPolicy.pairingDisabled ?? false,
  promptForNicknameOnPairing: selectedPolicy.promptForNicknameOnPairing ?? false,
  skipUserLockVerification: selectedPolicy.skipUserLockVerification ?? false,
};
```

---

## Testing Checklist

- [ ] Worker Token Settings section appears first
- [ ] Policy selector appears at top of Device Authentication Policy Settings section
- [ ] Policy selector appears before info box
- [ ] Policy update includes region parameter
- [ ] No DOM nesting warnings (MFAInfoButtonV8 not in <p>)
- [ ] Change tracking works for all sections independently
- [ ] API Display padding adjusts when visible
- [ ] PingOne sections only load when worker token is valid
- [ ] No error spam when worker token is missing
- [ ] Policy update includes all fields (even defaults)
- [ ] Save buttons disabled when no changes
- [ ] Loading states disable buttons appropriately

---

## Version History

- **v1.0.0** (2025-01-27): Initial restore document for MFA Configuration Page

---

## Notes

- **Section Order:** Worker Token Settings MUST be first, Device Authentication Policy Settings second (if environmentId exists)
- **Policy Selector:** MUST be at the top of Device Authentication Policy Settings section, before info box
- **Region Parameter:** `updateDeviceAuthenticationPolicy()` MUST receive `credentials.region` parameter
- **DOM Nesting:** `MFAInfoButtonV8` must NOT be nested inside `<p>` tags
- **Policy Update:** Must include all fields (even defaults) for educational completeness
- **Error Handling:** Missing worker token must not show errors (silently skip loading)

