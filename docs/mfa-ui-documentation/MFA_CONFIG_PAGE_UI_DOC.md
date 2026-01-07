# MFA Configuration Page UI Documentation

**Last Updated:** 2026-01-06 14:30:00  
**Version:** 1.0.0  
**Status:** ✅ IMPLEMENTED  
**Purpose:** Complete UI structure and component documentation for the MFA Configuration Page

---

## Related Documentation

- [MFA Configuration Page UI Contract](./MFA_CONFIG_PAGE_UI_CONTRACT.md) - UI behavior contracts
- [MFA Configuration Page Restore Document](./MFA_CONFIG_PAGE_RESTORE.md) - Implementation details for restoration

---

## Overview

This document provides a complete reference for the UI structure, components, styling, and layout of the MFA Configuration Page (`MFAConfigurationPageV8.tsx`).

---

## Page Layout

### Container Structure

```typescript
<div
  style={{
    padding: '24px',
    paddingBottom: isApiDisplayVisible ? '450px' : '24px',
    maxWidth: '1200px',
    margin: '0 auto',
    transition: 'padding-bottom 0.3s ease',
  }}
>
  {/* Navigation */}
  <MFANavigationV8 currentPage="settings" showBackToMain={true} />
  
  {/* Back Button (conditional) */}
  {returnPath && <BackButton />}
  
  {/* API Display */}
  <SuperSimpleApiDisplayV8 flowFilter="mfa" />
  
  {/* Header */}
  <Header />
  
  {/* Action Buttons */}
  <ActionButtonsBar />
  
  {/* Configuration Sections */}
  <ConfigurationSections />
</div>
```

### Header

**Location:** Top of page, below navigation

**Styling:**
- Background: `linear-gradient(135deg, #f59e0b 0%, #d97706 100%)` (orange gradient)
- Border radius: `12px`
- Padding: `32px`
- Margin bottom: `24px`
- Box shadow: `0 4px 6px rgba(0, 0, 0, 0.1)`

**Content:**
- Title: "MFA Configuration" (28px, fontWeight: 700, white)
- Subtitle: "Manage MFA-specific settings for authentication flows, device management, and user experience" (16px, white, 90% opacity)

---

## Helper Components

### ConfigSection

**Purpose:** Wrapper component for configuration sections

**Props:**
- `title: string` - Section title
- `description: string` - Section description
- `children: React.ReactNode` - Section content

**Styling:**
- Background: `white`
- Border radius: `12px`
- Padding: `24px`
- Box shadow: `0 1px 3px rgba(0, 0, 0, 0.1)`
- Border: `1px solid #e5e7eb`
- Title: `20px`, `fontWeight: 600`, color: `#1f2937`
- Description: `14px`, color: `#6b7280`, margin bottom: `20px`
- Children container: Flex column, gap: `20px`

### ToggleSetting

**Purpose:** Toggle switch for boolean settings

**Props:**
- `label: string` - Setting label
- `description?: string` - Setting description
- `value: boolean` - Current value
- `onChange: (value: boolean) => void` - Change handler

**Styling:**
- Toggle button:
  - Width: `44px`
  - Height: `24px`
  - Border radius: `12px`
  - Background: `#10b981` (green) when `value === true`, `#d1d5db` (gray) when `false`
  - Toggle circle: `20px` diameter, white, positioned left (`2px`) when off, right (`22px`) when on
  - Transition: `left 0.2s ease`, `background 0.2s ease`
- Label: `14px`, `fontWeight: 500`, color: `#374151`
- Description: `12px`, color: `#6b7280`, margin top: `4px`

### NumberSetting

**Purpose:** Number input for numeric settings

**Props:**
- `label: string` - Setting label
- `description?: string` - Setting description
- `value: number` - Current value
- `onChange: (value: number) => void` - Change handler
- `min?: number` - Minimum value
- `max?: number` - Maximum value

**Styling:**
- Input:
  - Width: `100%`
  - Padding: `8px 12px`
  - Border: `1px solid #d1d5db`
  - Border radius: `6px`
  - Font size: `14px`
- Label: `14px`, `fontWeight: 500`, color: `#374151`, margin bottom: `8px`
- Description: `12px`, color: `#6b7280`, margin top: `8px`

**Behavior:**
- Clamps value to min/max range on change
- Only updates if value is valid number

### SelectSetting

**Purpose:** Dropdown select for option-based settings

**Props:**
- `label: string` - Setting label
- `description?: string` - Setting description
- `value: string | number` - Current value
- `onChange: (value: string | number) => void` - Change handler
- `options: Array<{ value: string | number; label: string }>` - Available options

**Styling:**
- Select:
  - Width: `100%`
  - Padding: `8px 12px`
  - Border: `1px solid #d1d5db`
  - Border radius: `6px`
  - Font size: `14px`
  - Background: `white`
- Label: `14px`, `fontWeight: 500`, color: `#374151`, margin bottom: `8px`
- Description: `12px`, color: `#6b7280`, margin top: `8px`

### TextSetting

**Purpose:** Text input for string settings

**Props:**
- `label: string` - Setting label
- `description?: string` - Setting description
- `value: string` - Current value
- `onChange: (value: string) => void` - Change handler

**Styling:**
- Input:
  - Width: `100%`
  - Padding: `8px 12px`
  - Border: `1px solid #d1d5db`
  - Border radius: `6px`
  - Font size: `14px`
- Label: `14px`, `fontWeight: 500`, color: `#374151`, margin bottom: `8px`
- Description: `12px`, color: `#6b7280`, margin top: `8px`

---

## Section Details

### 1. Worker Token Settings Section

**Position:** First section (always at top)

**Structure:**
```
<ConfigSection title="Worker Token Settings" description="...">
  <ToggleSetting label="Auto-Renewal" ... />
  <NumberSetting label="Renewal Threshold (seconds)" ... />
  <NumberSetting label="Retry Attempts" ... />
  <NumberSetting label="Retry Delay (milliseconds)" ... />
  <ToggleSetting label="Show Token After Generation" ... />
  <ToggleSetting label="Silent API Token Retrieval" ... />
</ConfigSection>
```

**Settings Paths:**
- `config.workerToken.autoRenewal`
- `config.workerToken.renewalThreshold`
- `config.workerToken.retryAttempts`
- `config.workerToken.retryDelay`
- `config.workerToken.showTokenAtEnd`
- `config.workerToken.silentApiRetrieval`

---

### 2. Device Authentication Policy Settings Section

**Position:** Second section (if `environmentId` exists)

**Structure:**
```
<ConfigSection title="Device Authentication Policy Settings" description="...">
  {/* Policy Selector - AT TOP */}
  <PolicySelector />
  
  {/* Info Box */}
  <InfoBox>
    <MFAInfoButtonV8 contentKey="device.authentication.policy" />
    <Link to="PingOne API docs" />
  </InfoBox>
  
  {/* Policy Settings (conditional) */}
  {selectedPolicy && (
    <>
      <OTPFailureCooldownSubsection />
      <MethodSelectionSubsection />
      <PairingSettingsSubsection />
      <SavePolicyButton />
    </>
  )}
</ConfigSection>
```

**Policy Selector:**
- Label: "Select Policy" (14px, fontWeight: 600)
- Dropdown: Full width, blue border (`2px solid #3b82f6`)
- Helper text: "Select a policy to view and edit its settings. Changes will be saved to PingOne."

**Info Box:**
- Background: `#eff6ff`
- Border: `1px solid #bfdbfe`
- Icon: `FiInfo` (16px, blue)
- Title: "About Device Authentication Policies"
- Content: Includes `MFAInfoButtonV8` and link to PingOne API docs

**OTP Failure Cooldown Subsection:**
- Background: `#f9fafb`
- Border: `1px solid #e5e7eb`
- Padding: `16px`
- Title: "OTP Failure Cooldown" with `MFAInfoButtonV8`
- Fields:
  - Cooldown Duration (Number, 0-30)
  - Time Unit (Select: MINUTES | SECONDS)

**Method Selection Subsection:**
- Background: `#f9fafb`
- Border: `1px solid #e5e7eb`
- Padding: `16px`
- Title: "Method Selection" with `MFAInfoButtonV8`
- Dropdown: `DEFAULT_TO_FIRST` | `PROMPT_TO_SELECT_DEVICE` | `ALWAYS_DISPLAY_DEVICES`

**Pairing Settings Subsection:**
- Background: `#f9fafb`
- Border: `1px solid #e5e7eb`
- Padding: `16px`
- Title: "Pairing Settings"
- Toggles:
  - Pairing Disabled
  - Prompt for Nickname on Pairing
  - Skip User Lock Verification

**Save Policy Button:**
- Disabled when: `!hasPolicyChanges || isSavingPolicy`
- Background: `#10b981` (green) when enabled, `#9ca3af` (gray) when disabled
- Text: "Saving..." when `isSavingPolicy`, "Save Policy Settings" otherwise

---

### 3. PingOne MFA Settings Section

**Position:** Third section (if `environmentId` exists)

**Structure:**
```
<ConfigSection title="PingOne MFA Settings" description="...">
  <InfoBox>
    <MFAInfoButtonV8 contentKey="mfa.settings" />
  </InfoBox>
  
  {pingOneSettings && (
    <>
      <PairingSettingsSubsection />
      <LockoutSettingsSubsection />
      <OTPSettingsSubsection />
      <SavePingOneSettingsButton />
      <ResetPingOneSettingsButton />
    </>
  )}
</ConfigSection>
```

**Subsections:**
- Pairing Settings: Max Allowed Devices, Pairing Key Format, Pairing Key Length, Pairing Timeout
- Lockout Settings: Failure Count, Lockout Duration, Progressive Lockout
- OTP Settings: OTP Length, OTP Validity

---

### 4. Default Policies Section

**Position:** Fourth section

**Structure:**
```
<ConfigSection title="Default Policies" description="...">
  <ToggleSetting label="Auto-Select Default Policies" ... />
</ConfigSection>
```

---

### 5. OTP Settings Section

**Position:** Fifth section

**Structure:**
```
<ConfigSection title="OTP Settings" description="...">
  <SelectSetting label="OTP Code Length" options={[6, 7, 8, 9, 10]} ... />
  <ToggleSetting label="OTP Input Auto-Focus" ... />
  <ToggleSetting label="OTP Input Auto-Submit" ... />
  <NumberSetting label="OTP Validation Timeout (seconds)" min={60} max={1800} ... />
  <NumberSetting label="OTP Resend Delay (seconds)" min={10} max={300} ... />
</ConfigSection>
```

---

### 6. FIDO2/WebAuthn Settings Section

**Position:** Sixth section

**Structure:**
```
<ConfigSection title="FIDO2/WebAuthn Settings" description="...">
  <SelectSetting label="Preferred Authenticator Type" ... />
  <SelectSetting label="User Verification" ... />
  <SelectSetting label="Discoverable Credentials" ... />
  <SelectSetting label="Relying Party ID Type" ... />
  {relyingPartyIdType !== 'pingone' && (
    <TextSetting label="Relying Party ID" ... />
  )}
  <ToggleSetting label="FIDO Device Aggregation" ... />
  <SelectSetting label="Backup Eligibility" ... />
  <ToggleSetting label="Enforce Backup Eligibility During Authentication" ... />
  <SelectSetting label="Attestation Request" ... />
  <ToggleSetting label="Include Environment Name" ... />
  <ToggleSetting label="Include Organization Name" ... />
</ConfigSection>
```

---

### 7. Push Notification Settings Section

**Position:** Seventh section

**Structure:**
```
<ConfigSection title="Push Notification Settings" description="...">
  <NumberSetting label="Push Notification Timeout (seconds)" min={30} max={600} ... />
  <NumberSetting label="Push Polling Interval (seconds)" min={1} max={10} ... />
  <ToggleSetting label="Auto-Start Push Polling" ... />
  <ToggleSetting label="Show Push Notification Instructions" ... />
</ConfigSection>
```

---

### 8. UI/UX Settings Section

**Position:** Eighth section

**Structure:**
```
<ConfigSection title="UI/UX Settings" description="...">
  <ToggleSetting label="Show Device Icons" ... />
  <ToggleSetting label="Show Device Status Badges" ... />
  <NumberSetting label="Modal Animation Duration (milliseconds)" min={0} max={1000} ... />
  <ToggleSetting label="Show Loading Spinners" ... />
</ConfigSection>
```

---

### 9. Security Settings Section

**Position:** Ninth section

**Structure:**
```
<ConfigSection title="Security Settings" description="...">
  <ToggleSetting label="Require Username for Authentication" ... />
  <ToggleSetting label="Allow Usernameless FIDO2" ... />
  <ToggleSetting label="Validate Device IDs" ... />
  <ToggleSetting label="Sanitize Device Names" ... />
</ConfigSection>
```

---

## State Management

### Configuration State

**Variable:** `config` (type: `MFAConfiguration`)

**Loading:**
```typescript
const [config, setConfig] = useState<MFAConfiguration>(() =>
  MFAConfigurationServiceV8.loadConfiguration()
);
```

**Saving:**
```typescript
const handleSave = async () => {
  setIsSaving(true);
  try {
    MFAConfigurationServiceV8.saveConfiguration(config);
    setHasChanges(false);
    toastV8.success('Configuration saved successfully');
  } catch (error) {
    toastV8.error('Failed to save configuration');
  } finally {
    setIsSaving(false);
  }
};
```

**Change Tracking:**
```typescript
const [hasChanges, setHasChanges] = useState(false);

const updateConfig = (key: string, value: unknown) => {
  setConfig((prev) => ({ ...prev, [key]: value }));
  setHasChanges(true);
};

const updateNestedConfig = (parent: string, key: string, value: unknown) => {
  setConfig((prev) => ({
    ...prev,
    [parent]: { ...prev[parent as keyof MFAConfiguration], [key]: value },
  }));
  setHasChanges(true);
};
```

### PingOne Settings State

**Variables:**
- `pingOneSettings: MFASettings | null`
- `isLoadingPingOneSettings: boolean`
- `isSavingPingOneSettings: boolean`
- `hasPingOneSettingsChanges: boolean`

**Loading:**
```typescript
const loadPingOneSettings = useCallback(async (envId: string) => {
  setIsLoadingPingOneSettings(true);
  try {
    const settings = await MFAServiceV8.getMFASettings(envId);
    setPingOneSettings(settings);
    setHasPingOneSettingsChanges(false);
  } catch (error) {
    toastV8.error('Failed to load PingOne MFA settings...');
  } finally {
    setIsLoadingPingOneSettings(false);
  }
}, []);
```

### Device Authentication Policy State

**Variables:**
- `deviceAuthPolicies: DeviceAuthenticationPolicy[]`
- `selectedPolicyId: string`
- `selectedPolicy: DeviceAuthenticationPolicy | null`
- `isLoadingPolicies: boolean`
- `isLoadingPolicy: boolean`
- `isSavingPolicy: boolean`
- `hasPolicyChanges: boolean`

**Loading Policies:**
```typescript
const loadDeviceAuthPolicies = useCallback(async (envId: string) => {
  setIsLoadingPolicies(true);
  try {
    const policies = await MFAServiceV8.listDeviceAuthenticationPolicies(envId);
    setDeviceAuthPolicies(policies);
    if (policies.length > 0 && !selectedPolicyId) {
      setSelectedPolicyId(policies[0].id);
    }
  } catch (error) {
    toastV8.error('Failed to load device authentication policies...');
  } finally {
    setIsLoadingPolicies(false);
  }
}, [selectedPolicyId]);
```

**Loading Selected Policy:**
```typescript
const loadSelectedPolicy = useCallback(async (envId: string, policyId: string) => {
  if (!policyId) {
    setSelectedPolicy(null);
    return;
  }
  setIsLoadingPolicy(true);
  try {
    const policy = await MFAServiceV8.readDeviceAuthenticationPolicy(envId, policyId);
    setSelectedPolicy(policy);
    setHasPolicyChanges(false);
  } catch (error) {
    toastV8.error('Failed to load device authentication policy...');
  } finally {
    setIsLoadingPolicy(false);
  }
}, []);
```

**Saving Policy:**
```typescript
const handleSavePolicy = async () => {
  if (!environmentId || !selectedPolicyId || !selectedPolicy) return;
  
  setIsSavingPolicy(true);
  try {
    const credentials = await workerTokenServiceV8.loadCredentials();
    if (!credentials) {
      toastV8.error('Worker token credentials are missing...');
      return;
    }
    
    const policyUpdate = {
      otp: selectedPolicy.otp,
      authentication: selectedPolicy.authentication,
      pairingDisabled: selectedPolicy.pairingDisabled,
      promptForNicknameOnPairing: selectedPolicy.promptForNicknameOnPairing,
      skipUserLockVerification: selectedPolicy.skipUserLockVerification,
    };
    
    await MFAServiceV8.updateDeviceAuthenticationPolicy(
      environmentId,
      selectedPolicyId,
      policyUpdate,
      credentials.region // CRITICAL: Must pass region
    );
    
    setHasPolicyChanges(false);
    toastV8.success('Policy settings saved successfully');
  } catch (error) {
    toastV8.error('Failed to save policy settings');
  } finally {
    setIsSavingPolicy(false);
  }
};
```

---

## Event Handlers

### handleSave

**Purpose:** Save local configuration to localStorage

**Implementation:**
```typescript
const handleSave = async () => {
  setIsSaving(true);
  try {
    MFAConfigurationServiceV8.saveConfiguration(config);
    setHasChanges(false);
    toastV8.success('Configuration saved successfully');
  } catch (error) {
    console.error(`${MODULE_TAG} Failed to save configuration:`, error);
    toastV8.error('Failed to save configuration');
  } finally {
    setIsSaving(false);
  }
};
```

### handleReset

**Purpose:** Reset configuration to defaults

**Implementation:**
```typescript
const handleReset = () => {
  if (confirm('Are you sure you want to reset all settings to defaults?')) {
    const defaultConfig = MFAConfigurationServiceV8.getDefaultConfiguration();
    setConfig(defaultConfig);
    MFAConfigurationServiceV8.saveConfiguration(defaultConfig);
    setHasChanges(false);
    toastV8.success('Configuration reset to defaults');
  }
};
```

### handleExport

**Purpose:** Export configuration as JSON file

**Implementation:**
```typescript
const handleExport = () => {
  const dataStr = JSON.stringify(config, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `mfa-config-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
  toastV8.success('Configuration exported successfully');
};
```

### handleImport

**Purpose:** Import configuration from JSON file

**Implementation:**
```typescript
const handleImport = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        setConfig(imported);
        MFAConfigurationServiceV8.saveConfiguration(imported);
        setHasChanges(false);
        toastV8.success('Configuration imported successfully');
      } catch (error) {
        toastV8.error('Failed to import configuration. Invalid JSON file.');
      }
    };
    reader.readAsText(file);
  };
  input.click();
};
```

### handleManualWorkerTokenRefresh

**Purpose:** Manually refresh worker token

**Implementation:**
```typescript
const handleManualWorkerTokenRefresh = async () => {
  setIsRefreshingToken(true);
  try {
    const tokenStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
    if (!tokenStatus.isValid) {
      toastV8.error('Worker token is not valid. Please generate a new token.');
      return;
    }
    
    // Trigger token refresh logic
    await workerTokenServiceV8.refreshWorkerToken();
    toastV8.success('Worker token refreshed successfully');
  } catch (error) {
    toastV8.error('Failed to refresh worker token');
  } finally {
    setIsRefreshingToken(false);
  }
};
```

---

## Loading States

### Policy Loading States

**Contract:**
- `isLoadingPolicies`: Shows "Loading device authentication policies..." when true
- `isLoadingPolicy`: Shows "Loading policy details..." when true
- `isSavingPolicy`: Disables save button, shows "Saving..." text when true

**UI:**
```typescript
{isLoadingPolicies ? (
  <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
    Loading device authentication policies...
  </div>
) : deviceAuthPolicies.length === 0 ? (
  <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
    No device authentication policies found...
  </div>
) : (
  // Policy selector and settings
)}
```

---

## Error Handling

**Contract:**
- All errors displayed via `toastV8.error()`
- Success messages via `toastV8.success()`
- Loading states disable relevant buttons
- API errors must not crash the page
- Missing worker token must not show errors (silently skip loading)

**Error Messages:**
- "Failed to load PingOne MFA settings. Please ensure you have a valid worker token."
- "Failed to load device authentication policies. Please ensure you have a valid worker token."
- "Failed to load device authentication policy. Please ensure you have a valid worker token."
- "Failed to save PingOne MFA settings."
- "Failed to save device authentication policy."
- "Worker token credentials are missing. Open the worker token modal to save them first."

---

## Version History

- **v1.0.0** (2025-01-27): Initial UI documentation for MFA Configuration Page

---

## Notes

- **Section Order:** Worker Token Settings MUST be first, Device Authentication Policy Settings second (if environmentId exists)
- **Policy Selector:** MUST be at the top of Device Authentication Policy Settings section, before info box
- **Region Parameter:** `updateDeviceAuthenticationPolicy()` MUST receive `credentials.region` parameter
- **Change Tracking:** All sections must track changes independently
- **API Display:** Page padding must adjust based on API display visibility
- **DOM Nesting:** `MFAInfoButtonV8` must NOT be nested inside `<p>` tags (use `<div>` instead)

