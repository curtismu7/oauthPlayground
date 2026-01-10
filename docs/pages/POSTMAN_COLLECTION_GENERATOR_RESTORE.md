# Postman Collection Generator Restore Document

**Last Updated:** 2026-01-27  
**Version:** 1.1.0  
**Purpose:** Implementation details for restoring the Postman Collection Generator page if it breaks or drifts  
**Usage:** Use this document to restore correct implementations when the Postman Collection Generator breaks or regresses

---

## Related Documentation

- [Postman Collection Generator UI Contract](./POSTMAN_COLLECTION_GENERATOR_UI_CONTRACT.md) - UI behavior contracts
- [Postman Collection Generator UI Documentation](./POSTMAN_COLLECTION_GENERATOR_UI_DOC.md) - Complete UI structure

---

## Overview

This document provides implementation details, code snippets, and restoration guidance for the Postman Collection Generator page (`PostmanCollectionGenerator.tsx`).

---

## File Location

**Component:** `src/pages/PostmanCollectionGenerator.tsx`

---

## Critical Implementation Details

### 1. Collection Type Selection State

**Contract:** Both Unified and MFA must default to `true`.

**Correct Implementation:**
```typescript
const [includeUnified, setIncludeUnified] = useState(true);
const [includeMFA, setIncludeMFA] = useState(true);
```

**Incorrect Implementation (DO NOT DO THIS):**
```typescript
// ❌ WRONG: Defaulting to false
const [includeUnified, setIncludeUnified] = useState(false);
const [includeMFA, setIncludeMFA] = useState(false);
```

---

### 2. Unified Spec Version Selection

**Contract:** All three spec versions must default to `true`, and button labels MUST use correct protocol terminology.

**Correct Implementation:**
```typescript
const [includeOAuth20, setIncludeOAuth20] = useState(true);
const [includeOAuth21, setIncludeOAuth21] = useState(true); // Represents "OAuth 2.1 / OIDC 2.1"
const [includeOIDC, setIncludeOIDC] = useState(true); // Represents "OIDC Core 1.0"

// In the UI, buttons must be ordered left to right and labeled correctly:
// 1. "OAuth 2.0" - OAuth 2.0 Authorization Framework (RFC 6749)
// 2. "OIDC Core 1.0" - OpenID Connect Core 1.0 (renamed from "OpenID Connect (OIDC)")
// 3. "OAuth 2.1 / OIDC 2.1" - OAuth 2.1 Authorization Framework (draft) / OIDC Core 1.0 using Authorization Code + PKCE (OAuth 2.1 / RFC 9700 baseline) (renamed from "OAuth 2.1")

// Example JSX:
<label>
  <input type="checkbox" checked={includeOAuth20} onChange={(e) => handleSpecVersionChange('oauth2.0', e.target.checked)} />
  <span>OAuth 2.0</span>
</label>
<label>
  <input type="checkbox" checked={includeOIDC} onChange={(e) => handleSpecVersionChange('oidc', e.target.checked)} />
  <span>OIDC Core 1.0</span>
</label>
<label>
  <input type="checkbox" checked={includeOAuth21} onChange={(e) => handleSpecVersionChange('oauth2.1', e.target.checked)} />
  <span>OAuth 2.1 / OIDC 2.1</span>
</label>
```

**Critical Protocol Terminology:**
- **OAuth 2.0**: Must use "OAuth 2.0 Authorization Framework (RFC 6749)" in educational content
- **OIDC Core 1.0**: Must use "OpenID Connect Core 1.0" (was "OpenID Connect (OIDC)")
- **OAuth 2.1 / OIDC 2.1**: Must use "OAuth 2.1 Authorization Framework (draft)" for OAuth 2.1, and clarify that "OIDC 2.1" means "OIDC Core 1.0 using Authorization Code + PKCE (OAuth 2.1 / RFC 9700 baseline)"

**Incorrect Implementation (DO NOT DO THIS):**
```typescript
// ❌ WRONG: Using old labels
<span>OAuth 2.1</span> // Should be "OAuth 2.1 / OIDC 2.1"
<span>OpenID Connect (OIDC)</span> // Should be "OIDC Core 1.0"

// ❌ WRONG: Incorrect button order (must be OAuth 2.0, OIDC Core 1.0, OAuth 2.1 / OIDC 2.1)
```

---

### 3. Unified Flow Variations Default State

**Contract:** All 11 flow variations must be selected by default.

**Correct Implementation:**
```typescript
const [selectedUnifiedVariations, setSelectedUnifiedVariations] = useState<Set<UnifiedVariation>>(
  new Set([
    'authz-client-secret-post',
    'authz-client-secret-basic',
    'authz-client-secret-jwt',
    'authz-private-key-jwt',
    'authz-pi-flow',
    'authz-pkce',
    'authz-pkce-par',
    'implicit',
    'client-credentials',
    'device-code',
    'hybrid',
  ])
);
```

**Incorrect Implementation (DO NOT DO THIS):**
```typescript
// ❌ WRONG: Empty set by default
const [selectedUnifiedVariations, setSelectedUnifiedVariations] = useState<Set<UnifiedVariation>>(new Set());
```

---

### 4. Unified Flow Variations Collapsible Section

**Contract:** Section must be collapsed by default.

**Correct Implementation:**
```typescript
const [expandedUnifiedVariations, setExpandedUnifiedVariations] = useState(false);
```

**Incorrect Implementation (DO NOT DO THIS):**
```typescript
// ❌ WRONG: Expanded by default
const [expandedUnifiedVariations, setExpandedUnifiedVariations] = useState(true);
```

---

### 5. MFA Device Types Default State

**Contract:** All 6 device types must be selected by default.

**Correct Implementation:**
```typescript
const deviceTypes: DeviceType[] = ['SMS', 'EMAIL', 'WHATSAPP', 'TOTP', 'FIDO2', 'MOBILE'];

const [selectedDeviceTypes, setSelectedDeviceTypes] = useState<Set<DeviceType>>(
  new Set(deviceTypes)
);
```

**Incorrect Implementation (DO NOT DO THIS):**
```typescript
// ❌ WRONG: Empty set by default
const [selectedDeviceTypes, setSelectedDeviceTypes] = useState<Set<DeviceType>>(new Set());
```

---

### 6. MFA Device List Collapsible Section

**Contract:** Device list must be collapsed by default.

**Correct Implementation:**
```typescript
const [expandedMFADeviceList, setExpandedMFADeviceList] = useState(false);
```

**Incorrect Implementation (DO NOT DO THIS):**
```typescript
// ❌ WRONG: Expanded by default
const [expandedMFADeviceList, setExpandedMFADeviceList] = useState(true);
```

---

### 7. MFA Use Cases Default State

**Contract:** All 4 use cases must be selected by default for each device type.

**Correct Implementation:**
```typescript
const [selectedMFAUseCases, setSelectedMFAUseCases] = useState<Map<DeviceType, Set<MFAUseCase>>>(
  new Map(
    ['SMS', 'EMAIL', 'WHATSAPP', 'TOTP', 'FIDO2', 'MOBILE'].map((dt) => [
      dt as DeviceType,
      new Set<MFAUseCase>(['user-flow', 'admin-flow', 'registration', 'authentication']),
    ])
  )
);
```

**Incorrect Implementation (DO NOT DO THIS):**
```typescript
// ❌ WRONG: Empty sets by default
const [selectedMFAUseCases, setSelectedMFAUseCases] = useState<Map<DeviceType, Set<MFAUseCase>>>(
  new Map(['SMS', 'EMAIL', 'WHATSAPP', 'TOTP', 'FIDO2', 'MOBILE'].map((dt) => [dt as DeviceType, new Set()]))
);
```

---

### 8. MFA Use Cases Collapsible State

**Contract:** Use cases must be collapsed by default for all device types.

**Correct Implementation:**
```typescript
const [expandedMFAUseCases, setExpandedMFAUseCases] = useState<Map<DeviceType, boolean>>(
  new Map(['SMS', 'EMAIL', 'WHATSAPP', 'TOTP', 'FIDO2', 'MOBILE'].map((dt) => [dt as DeviceType, false]))
);
```

**Incorrect Implementation (DO NOT DO THIS):**
```typescript
// ❌ WRONG: Expanded by default
const [expandedMFAUseCases, setExpandedMFAUseCases] = useState<Map<DeviceType, boolean>>(
  new Map(['SMS', 'EMAIL', 'WHATSAPP', 'TOTP', 'FIDO2', 'MOBILE'].map((dt) => [dt as DeviceType, true]))
);
```

---

### 9. Credential Loading

**Contract:** Must load credentials from both Unified and MFA sources with proper fallbacks.

**Correct Implementation:**
```typescript
const getCredentials = () => {
  const environmentId = EnvironmentIdServiceV8.getEnvironmentId();
  const flowKey = 'oauth-authz-v8u';
  
  // Get flow config with proper fallback
  let config = CredentialsServiceV8.getFlowConfig(flowKey);
  if (!config) {
    config = {
      flowKey,
      flowType: 'oauth' as const,
      includeClientSecret: true,
      includeScopes: true,
      includeRedirectUri: true,
      includeLogoutUri: false,
    };
  }
  
  const unifiedCreds = CredentialsServiceV8.loadCredentials(flowKey, config);
  
  // Load MFA credentials with proper flowKey and config
  const mfaFlowKey = 'mfa-flow-v8';
  const mfaConfig = CredentialsServiceV8.getFlowConfig(mfaFlowKey) || {
    flowKey: mfaFlowKey,
    flowType: 'oidc' as const,
    includeClientSecret: false,
    includeRedirectUri: false,
    includeLogoutUri: false,
    includeScopes: false,
  };
  const mfaCreds = CredentialsServiceV8.loadCredentials(mfaFlowKey, mfaConfig);

  return {
    environmentId: environmentId || unifiedCreds?.environmentId || mfaCreds?.environmentId,
    clientId: unifiedCreds?.clientId,
    clientSecret: unifiedCreds?.clientSecret,
    username: mfaCreds?.username,
  };
};
```

**Incorrect Implementation (DO NOT DO THIS):**
```typescript
// ❌ WRONG: Missing fallback config
const getCredentials = () => {
  const unifiedCreds = CredentialsServiceV8.loadCredentials('oauth-authz-v8u');
  // Missing config parameter - will fail
};
```

---

### 10. Collection Generation Validation

**Contract:** Must validate selections before generating collection.

**Correct Implementation:**
```typescript
const handleGenerateCollection = async () => {
  if (!includeUnified && !includeMFA) {
    toastV8.error('Please select at least one collection type (Unified or MFA)');
    return;
  }

  if (includeUnified && !includeOAuth20 && !includeOAuth21 && !includeOIDC) {
    toastV8.error('Please select at least one Unified spec version (OAuth 2.0, OAuth 2.1, or OIDC)');
    return;
  }

  if (includeMFA && selectedDeviceTypes.size === 0) {
    toastV8.error('Please select at least one MFA device type');
    return;
  }

  // ... generation logic
};
```

**Incorrect Implementation (DO NOT DO THIS):**
```typescript
// ❌ WRONG: No validation
const handleGenerateCollection = async () => {
  // Missing validation - will fail silently or with cryptic errors
  const collection = generateCompletePostmanCollection(credentials);
};
```

---

### 11. Download Sequence for Collection + Variables

**Contract:** Environment file must be generated and downloaded first, then collection file with 100ms delay.

**Correct Implementation:**
```typescript
// In downloadPostmanCollectionWithEnvironment function (postmanCollectionGeneratorV8.ts)
// Environment file is generated and downloaded first
const environment = generatePostmanEnvironment(collection, environmentName);
downloadPostmanEnvironment(environment, environmentFilename);

// Then collection file with delay
setTimeout(() => {
  downloadPostmanCollection(collection, collectionFilename);
}, 100);
```

**Incorrect Implementation (DO NOT DO THIS):**
```typescript
// ❌ WRONG: Downloading both simultaneously
downloadPostmanCollection(collection, collectionFilename);
downloadPostmanEnvironment(environment, environmentFilename);
// Browser may block the second download
```

---

### 12. Filename Generation

**Contract:** Filenames must include collection type, spec versions/devices, and date.

**Correct Implementation:**
```typescript
const date = new Date().toISOString().split('T')[0];
let filename = 'pingone';
if (includeUnified && includeMFA) {
  filename += '-complete-unified-mfa';
} else if (includeUnified) {
  filename += '-unified';
  if (includeOAuth20 && !includeOAuth21 && !includeOIDC) {
    filename += '-oauth20';
  } else if (includeOAuth21 && !includeOAuth20 && !includeOIDC) {
    filename += '-oauth21';
  } else if (includeOIDC && !includeOAuth20 && !includeOAuth21) {
    filename += '-oidc';
  } else {
    filename += '-custom';
  }
} else if (includeMFA) {
  filename += '-mfa';
  if (selectedDeviceTypes.size < 6) {
    filename += `-${Array.from(selectedDeviceTypes).join('-').toLowerCase()}`;
  }
}
filename += `-${date}-collection.json`;
```

**Incorrect Implementation (DO NOT DO THIS):**
```typescript
// ❌ WRONG: Generic filename
const filename = 'postman-collection.json';
// Doesn't indicate what's included
```

---

### 13. Select All / Unselect All Handlers

**Contract:** Must update all related checkboxes correctly.

**Correct Implementation:**
```typescript
// Unified Spec Versions
const selectAllUnifiedSpecs = () => {
  setIncludeOAuth20(true);
  setIncludeOAuth21(true);
  setIncludeOIDC(true);
};

const unselectAllUnifiedSpecs = () => {
  setIncludeOAuth20(false);
  setIncludeOAuth21(false);
  setIncludeOIDC(false);
};

// Unified Flow Variations
const selectAllUnifiedVariations = () => {
  setSelectedUnifiedVariations(
    new Set([
      'authz-client-secret-post',
      'authz-client-secret-basic',
      'authz-client-secret-jwt',
      'authz-private-key-jwt',
      'authz-pi-flow',
      'authz-pkce',
      'authz-pkce-par',
      'implicit',
      'client-credentials',
      'device-code',
      'hybrid',
    ])
  );
};

const unselectAllUnifiedVariations = () => {
  setSelectedUnifiedVariations(new Set());
};

// MFA Device Types
const selectAllDeviceTypes = () => {
  setSelectedDeviceTypes(new Set(deviceTypes));
};

const unselectAllDeviceTypes = () => {
  setSelectedDeviceTypes(new Set());
};

// MFA Use Cases (per device)
const selectAllMFAUseCases = (deviceType: DeviceType) => {
  setSelectedMFAUseCases((prev) => {
    const newMap = new Map(prev);
    newMap.set(deviceType, new Set<MFAUseCase>(['user-flow', 'admin-flow', 'registration', 'authentication']));
    return newMap;
  });
};

const unselectAllMFAUseCases = (deviceType: DeviceType) => {
  setSelectedMFAUseCases((prev) => {
    const newMap = new Map(prev);
    newMap.set(deviceType, new Set<MFAUseCase>());
    return newMap;
  });
};
```

**Incorrect Implementation (DO NOT DO THIS):**
```typescript
// ❌ WRONG: Not updating all related state
const selectAllUnifiedSpecs = () => {
  setIncludeOAuth20(true);
  // Missing includeOAuth21 and includeOIDC
};
```

---

## Common Issues and Fixes

### Issue: Collections Not Generating

**Symptoms:**
- Clicking download buttons does nothing
- Error toast appears
- Console errors

**Debug Steps:**
1. Check browser console for errors
2. Verify credentials are loaded correctly
3. Verify at least one collection type is selected
4. Verify spec versions/device types are selected

**Fix:**
- Ensure `getCredentials()` returns valid values
- Ensure validation checks pass before generation
- Ensure `generateComprehensiveUnifiedPostmanCollection` or `generateComprehensiveMFAPostmanCollection` are called correctly

---

### Issue: Download Buttons Not Working

**Symptoms:**
- Buttons are disabled
- Buttons don't trigger downloads
- Browser blocks downloads

**Debug Steps:**
1. Check if `isGenerating` is stuck at `true`
2. Check browser console for errors
3. Verify file download permissions
4. Check if browser is blocking multiple downloads

**Fix:**
- Ensure `setIsGenerating(false)` is called in `finally` block
- Ensure download sequence has 100ms delay between files
- Check browser download settings

---

### Issue: Wrong Collections Generated

**Symptoms:**
- Generated collection doesn't match selections
- Missing flows/variations
- Extra flows/variations

**Debug Steps:**
1. Verify state values match UI selections
2. Check filtering logic in `generateFilteredUnifiedCollection` and `generateFilteredMFACollection`
3. Verify collection generation functions receive correct parameters

**Fix:**
- Ensure state updates immediately when checkboxes change
- Ensure filtering logic correctly checks `selectedUnifiedVariations` and `selectedDeviceTypes`
- Ensure `generateComprehensiveUnifiedPostmanCollection` and `generateComprehensiveMFAPostmanCollection` are called with correct parameters

---

### Issue: Credentials Not Loading

**Symptoms:**
- Environment ID is empty
- Client ID/Secret missing
- Username missing

**Debug Steps:**
1. Check `CredentialsServiceV8.loadCredentials` calls
2. Verify flow configs are correct
3. Check fallback logic in `getCredentials()`

**Fix:**
- Ensure `getCredentials()` has proper fallbacks
- Ensure `CredentialsServiceV8.getFlowConfig()` is called before `loadCredentials()`
- Ensure MFA credentials use `flowType: 'oidc'` in config

---

## Related Files

- `src/pages/PostmanCollectionGenerator.tsx` - Main component
- `src/services/postmanCollectionGeneratorV8.ts` - Collection generation service
- `src/v8/services/credentialsServiceV8.ts` - Credential service
- `src/v8/services/environmentIdServiceV8.ts` - Environment ID service
- `src/v8/services/specVersionServiceV8.ts` - Spec version service
- `src/v8/utils/toastNotificationsV8.ts` - Toast notifications

---

## Version History

- **v1.1.0** (2026-01-27): Updated Unified spec version selection with correct protocol terminology. Changed button labels from "OAuth 2.1" to "OAuth 2.1 / OIDC 2.1", "OpenID Connect (OIDC)" to "OIDC Core 1.0". Updated button order to OAuth 2.0, OIDC Core 1.0, OAuth 2.1 / OIDC 2.1. Added protocol terminology requirements: OAuth 2.0 Authorization Framework (RFC 6749), OIDC Core 1.0, OAuth 2.1 Authorization Framework (draft) / OIDC Core 1.0 using Authorization Code + PKCE (OAuth 2.1 / RFC 9700 baseline).
- **v1.0.0** (2026-01-27): Initial Postman Collection Generator restore documentation

---

## Testing Checklist

- [ ] All default states are correct (all checkboxes checked, sections collapsed)
- [ ] Collection type selection works (Unified/MFA checkboxes)
- [ ] Unified spec version selection works (OAuth 2.0, OIDC Core 1.0, OAuth 2.1 / OIDC 2.1) with correct labels
- [ ] Button order is correct (OAuth 2.0, OIDC Core 1.0, OAuth 2.1 / OIDC 2.1)
- [ ] Unified flow variations selection works (all 11 variations)
- [ ] MFA device type selection works (all 6 device types)
- [ ] MFA use case selection works (all 4 use cases per device)
- [ ] Select All / Unselect All buttons work for all sections
- [ ] Collapsible sections expand/collapse correctly
- [ ] Download Collection + Variables downloads both files
- [ ] Download Collection Only downloads only collection
- [ ] Download Variables Only downloads only environment
- [ ] Validation errors show correct messages
- [ ] Credentials load correctly with fallbacks
- [ ] Generated collections match selections
- [ ] Filenames are correct and descriptive
