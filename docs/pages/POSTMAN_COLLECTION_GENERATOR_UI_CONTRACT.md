# Postman Collection Generator UI Contract

**Last Updated:** 2026-01-27  
**Version:** 1.1.0  
**Status:** ✅ IMPLEMENTED

---

## Related Documentation

- [Postman Collection Generator UI Documentation](./POSTMAN_COLLECTION_GENERATOR_UI_DOC.md) - Complete UI structure and components
- [Postman Collection Generator Restore Document](./POSTMAN_COLLECTION_GENERATOR_RESTORE.md) - Implementation details for restoration

---

## Overview

This document defines the UI contract for the Postman Collection Generator page. This contract ensures consistent behavior, error handling, and user experience across all Postman collection generation features.

---

## Scope

**Applies To:**
- ✅ Postman Collection Generator Page
- ✅ Collection Type Selection (Unified/MFA)
- ✅ Unified Spec Version Selection
- ✅ Unified Flow Variation Selection
- ✅ MFA Device Type Selection
- ✅ MFA Use Case Selection
- ✅ Collection Generation and Download

---

## UI Component Contracts

### 1. Page Header

**Component:** `PostmanCollectionGenerator.tsx`  
**Route:** `/postman-collection-generator`

#### Required UI Elements

1. **Header Section**
   - Must display purple gradient background (`linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)`)
   - Must display "Postman Collection Generator" title with package icon (`FiPackage`)
   - Must display subtitle: "Generate custom Postman collections for PingOne OAuth/OIDC and MFA flows"
   - Must have white text color
   - Must have rounded corners (`borderRadius: '12px'`)
   - Must have shadow (`boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'`)

#### Layout Contract

- Header must be full width within container
- Header must have `2rem` padding
- Header must have `2rem` bottom margin

---

### 2. Collection Type Selection

**Contract:** Users must be able to select which collection types to include.

#### Required UI Elements

1. **Collection Type Checkboxes**
   - Must display "Unified OAuth/OIDC Flows" checkbox
   - Must display "MFA Flows" checkbox
   - Both must be checked by default
   - Must be styled with purple border when checked (`#8b5cf6`)
   - Must have gray background when checked (`#f3f4f6`)
   - Must be in a white card container with padding and shadow

#### State Management

- `includeUnified` state must default to `true`
- `includeMFA` state must default to `true`
- Changes must update state immediately
- State must control visibility of subsequent sections

#### Validation Rules

- At least one collection type must be selected
- If both are unchecked, download buttons must be disabled or show error

---

### 3. Unified Spec Version Selection

**Contract:** When Unified is selected, users must be able to select specification versions.

#### Required UI Elements

1. **Spec Version Checkboxes (Ordered Left to Right)**
   - Must display "OAuth 2.0" checkbox - OAuth 2.0 Authorization Framework (RFC 6749)
   - Must display "OIDC Core 1.0" checkbox (renamed from "OpenID Connect (OIDC)") - OpenID Connect Core 1.0
   - Must display "OAuth 2.1 / OIDC 2.1" checkbox (renamed from "OAuth 2.1") - OAuth 2.1 Authorization Framework (draft) / OIDC Core 1.0 using Authorization Code + PKCE (OAuth 2.1 / RFC 9700 baseline)
   - All must be checked by default
   - Must be styled with blue border when checked (`#3b82f6`)
   - Must have light blue background when checked (`#eff6ff`)
   - **MUST** use correct protocol terminology as specified above

2. **Select All / Unselect All Buttons**
   - Must display "Select All" button (blue border, white background)
   - Must display "Unselect All" button (red border, white background)
   - Must be positioned in the header row, right-aligned
   - Must update all spec version checkboxes when clicked

#### State Management

- `includeOAuth20` must default to `true`
- `includeOAuth21` must default to `true`
- `includeOIDC` must default to `true`
- Changes must update state immediately

#### Visibility Contract

- Section must only be visible when `includeUnified` is `true`
- Section must be hidden when `includeUnified` is `false`

---

### 4. Unified Flow Variations Selection

**Contract:** Users must be able to select specific flow variations within Unified flows.

#### Required UI Elements

1. **Collapsible Section Header**
   - Must display "Select Specific Flow Variations" text
   - Must display chevron icon (right when collapsed, down when expanded)
   - Must be clickable to expand/collapse
   - Section must be collapsed by default (`expandedUnifiedVariations: false`)

2. **Select All / Unselect All Buttons**
   - Must display "Select All" button (blue border)
   - Must display "Unselect All" button (red border)
   - Must be visible only when section is expanded
   - Must be positioned in the header row, right-aligned

3. **Flow Variation Checkboxes**
   - Must display all 11 variations:
     - Authorization Code - Client Secret Post
     - Authorization Code - Client Secret Basic
     - Authorization Code - Client Secret JWT
     - Authorization Code - Private Key JWT
     - Authorization Code - with pi.flow
     - Authorization Code - with PKCE
     - Authorization Code - with PKCE and PAR
     - Implicit Flow
     - Client Credentials Flow
     - Device Code Flow
     - Hybrid Flow
   - All must be checked by default
   - Must be styled with blue border when checked
   - Must have light blue background when checked

#### State Management

- `selectedUnifiedVariations` must be a `Set<UnifiedVariation>`
- Must default to all 11 variations selected
- Changes must update state immediately

#### Visibility Contract

- Section must only be visible when `includeUnified` is `true`
- Section must be collapsed by default
- Section must be expandable/collapsible via click

---

### 5. MFA Device Type Selection

**Contract:** Users must be able to select which MFA device types to include.

#### Required UI Elements

1. **Select All / Unselect All Buttons**
   - Must display "Select All" button (green border, `#10b981`)
   - Must display "Unselect All" button (red border, `#ef4444`)
   - Must be positioned in the header row, right-aligned

2. **Collapsible Device List**
   - Must display "Device Types" text with chevron icon
   - Must be clickable to expand/collapse
   - Section must be collapsed by default (`expandedMFADeviceList: false`)

3. **Device Type Checkboxes**
   - Must display all 6 device types:
     - SMS
     - EMAIL
     - WHATSAPP
     - TOTP
     - FIDO2
     - MOBILE
   - All must be checked by default
   - Must be styled with green border when checked (`#10b981`)
   - Must have light green background when checked (`#ecfdf5`)

4. **Use Cases Button (per device)**
   - Must display "Use Cases" button for each selected device
   - Must show chevron icon (right when collapsed, down when expanded)
   - Must be clickable to expand/collapse use cases for that device
   - Must be visible only when device is selected

#### State Management

- `selectedDeviceTypes` must be a `Set<DeviceType>`
- Must default to all 6 device types selected
- `selectedMFAUseCases` must be a `Map<DeviceType, Set<MFAUseCase>>`
- Must default to all 4 use cases selected per device:
  - `user-flow`
  - `admin-flow`
  - `registration`
  - `authentication`
- Changes must update state immediately

#### Visibility Contract

- Section must only be visible when `includeMFA` is `true`
- Device list must be collapsed by default
- Use cases must be collapsed by default per device

---

### 6. MFA Use Case Selection

**Contract:** For each selected device type, users must be able to select specific use cases.

#### Required UI Elements

1. **Select All / Unselect All Buttons (per device)**
   - Must display "Select All" button (green border)
   - Must display "Unselect All" button (red border)
   - Must be visible only when device's use cases are expanded

2. **Use Case Checkboxes**
   - Must display all 4 use cases:
     - User Flow (OAuth login, ACTIVATION_REQUIRED)
     - Admin Flow (Worker token, ACTIVE)
     - Registration
     - Authentication
   - All must be checked by default
   - Must be styled with green border when checked
   - Must have light green background when checked

#### State Management

- Use cases must be stored per device type in `Map<DeviceType, Set<MFAUseCase>>`
- Must default to all 4 use cases selected per device
- Changes must update state immediately

#### Visibility Contract

- Use cases must only be visible when:
  - Device type is selected (`selectedDeviceTypes.has(deviceType)`)
  - Use cases section is expanded (`expandedMFAUseCases.get(deviceType) === true`)

---

### 7. Download Buttons

**Contract:** Users must be able to download collections in different formats.

#### Required UI Elements

1. **Download Collection + Variables Button**
   - Must display "Download Collection + Variables" text with download icon (`FiDownload`)
   - Must be purple (`#8b5cf6`)
   - Must show loading spinner when generating
   - Must be disabled when `isGenerating` is `true`
   - Must download both collection and environment files
   - Must show success toast after download

2. **Download Collection Only Button**
   - Must display "Download Collection Only" text with package icon (`FiPackage`)
   - Must be blue (`#3b82f6`)
   - Must show loading spinner when generating
   - Must be disabled when `isGenerating` is `true`
   - Must download only the collection file
   - Must show success toast after download

3. **Download Variables Only Button**
   - Must display "Download Variables Only" text with package icon (`FiPackage`)
   - Must be green (`#10b981`)
   - Must show loading spinner when generating
   - Must be disabled when `isGenerating` is `true`
   - Must download only the environment file
   - Must show success toast after download

#### State Management

- `isGenerating` must be set to `true` when generation starts
- `isGenerating` must be set to `false` when generation completes (success or error)
- All buttons must be disabled when `isGenerating` is `true`

#### Validation Rules

- At least one collection type must be selected (Unified or MFA)
- If Unified is selected, at least one spec version must be selected
- If Unified is selected, at least one flow variation must be selected
- If MFA is selected, at least one device type must be selected
- If MFA is selected, at least one use case must be selected per device

#### Error Handling

- Must show error toast if generation fails
- Must show error toast if no collections are selected
- Must show error toast if credentials are missing

---

### 8. Info Section

**Contract:** Must display information about what's included in the generated collections.

#### Required UI Elements

1. **What's Included List**
   - Must display bulleted list with:
     - Educational comments on every API request
     - Automatic variable extraction scripts
     - Complete OAuth login steps for user flows
     - Validated API calls matching PingOne documentation
     - Both collection and environment files for easy import
   - Must be in a white card container
   - Must have gray text color (`#6b7280`)

---

## State Management Contracts

### Collection Type State

- `includeUnified: boolean` - Default: `true`
- `includeMFA: boolean` - Default: `true`

### Unified Spec Version State

- `includeOAuth20: boolean` - Default: `true`
- `includeOAuth21: boolean` - Default: `true`
- `includeOIDC: boolean` - Default: `true`

### Unified Flow Variation State

- `selectedUnifiedVariations: Set<UnifiedVariation>` - Default: All 11 variations
- `expandedUnifiedVariations: boolean` - Default: `false` (collapsed)

### MFA Device Type State

- `selectedDeviceTypes: Set<DeviceType>` - Default: All 6 device types
- `expandedMFADeviceList: boolean` - Default: `false` (collapsed)

### MFA Use Case State

- `selectedMFAUseCases: Map<DeviceType, Set<MFAUseCase>>` - Default: All 4 use cases per device
- `expandedMFAUseCases: Map<DeviceType, boolean>` - Default: All `false` (collapsed)

### Generation State

- `isGenerating: boolean` - Default: `false`

---

## Credential Loading Contracts

### Unified Credentials

- Must load from `CredentialsServiceV8.loadCredentials('oauth-authz-v8u', config)`
- Must fallback to `EnvironmentIdServiceV8.getEnvironmentId()` for environment ID
- Must include: `environmentId`, `clientId`, `clientSecret`

### MFA Credentials

- Must load from `CredentialsServiceV8.loadCredentials('mfa-flow-v8', mfaConfig)`
- Must include: `environmentId`, `username`
- Must use proper flow config with `flowType: 'oidc'`

### Error Handling

- Must handle missing credentials gracefully
- Must show error toast if credentials are required but missing
- Must use fallback values when available

---

## File Generation Contracts

### Collection File

- Must be valid Postman Collection JSON format
- Must include all selected flows/variations
- Must include educational comments in request descriptions
- Must include test scripts for variable extraction
- Must include pre-request scripts for PKCE/JWT generation where applicable
- Filename format: `pingone-{type}-{specs}-{devices}-{date}-collection.json`

### Environment File

- Must be valid Postman Environment JSON format
- Must include all required variables
- Must pre-fill values from credentials where available
- Filename format: `pingone-{type}-{specs}-{devices}-{date}-environment.json`

### Download Sequence

- For "Collection + Variables": Environment file must be generated and downloaded first, then collection file with 100ms delay
- For "Collection Only": Only collection file is downloaded
- For "Variables Only": Only environment file is downloaded

---

## Toast Notification Contracts

### Success Messages

- "Postman collection and environment downloaded! Import both into Postman to test all flows."
- "Postman collection downloaded! Import into Postman to test the flows."
- "Postman environment/variables file downloaded! Import into Postman to use the variables."

### Error Messages

- "Failed to generate Postman collection. Please try again."
- "Please select at least one collection type (Unified or MFA)."
- "Please select at least one specification version."
- "Please select at least one flow variation."
- "Please select at least one device type."
- "Please select at least one use case for each selected device type."

---

## Accessibility Contracts

### Keyboard Navigation

- All checkboxes must be keyboard accessible
- All buttons must be keyboard accessible
- All collapsible sections must be keyboard accessible
- Tab order must be logical and intuitive

### Screen Reader Support

- All interactive elements must have appropriate ARIA labels
- Checkbox states must be announced
- Button states (disabled/loading) must be announced
- Collapsible section states must be announced

---

## Responsive Design Contracts

### Desktop (≥768px)

- Container max width: `1200px`
- Padding: `2rem`
- All sections visible and accessible

### Mobile (<768px)

- Container padding: `1rem`
- Sections may stack vertically
- Buttons may wrap to multiple lines
- Checkboxes and labels may stack vertically

---

## Performance Contracts

### Generation Time

- Collection generation must complete within 5 seconds for typical selections
- Large collections (all flows) may take up to 10 seconds
- Must show loading indicator during generation
- Must not block UI during generation

### File Size

- Collection files should be under 2MB for typical selections
- Environment files should be under 50KB
- Large collections (all flows) may exceed 2MB

---

## Browser Compatibility Contracts

### Required Features

- File download API (`Blob`, `URL.createObjectURL`)
- ES6 Set and Map support
- CSS Grid/Flexbox support
- Modern JavaScript (ES2017+)

### Supported Browsers

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## Version History

- **v1.1.0** (2026-01-27): Updated Unified spec version selection with correct protocol terminology requirements. Changed button labels to "OAuth 2.0" (OAuth 2.0 Authorization Framework RFC 6749), "OIDC Core 1.0" (renamed from "OpenID Connect (OIDC)"), and "OAuth 2.1 / OIDC 2.1" (renamed from "OAuth 2.1", with clarification as OAuth 2.1 Authorization Framework draft / OIDC Core 1.0 using Authorization Code + PKCE). Updated button order to OAuth 2.0, OIDC Core 1.0, OAuth 2.1 / OIDC 2.1. Added protocol terminology requirements to all contracts.
- **v1.0.0** (2026-01-27): Initial Postman Collection Generator UI contract
