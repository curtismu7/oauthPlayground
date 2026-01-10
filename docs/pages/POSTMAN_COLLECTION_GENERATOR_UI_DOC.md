# Postman Collection Generator UI Documentation

**Last Updated:** 2026-01-27  
**Version:** 1.1.0  
**Status:** ✅ IMPLEMENTED

---

## Related Documentation

- [Postman Collection Generator UI Contract](./POSTMAN_COLLECTION_GENERATOR_UI_CONTRACT.md) - UI behavior contracts
- [Postman Collection Generator Restore Document](./POSTMAN_COLLECTION_GENERATOR_RESTORE.md) - Implementation details for restoration

---

## Overview

This document provides a complete reference for the UI structure, components, styling, and layout of the Postman Collection Generator page.

---

## Page Layout

**Location:** `/postman-collection-generator`  
**Component:** `PostmanCollectionGenerator.tsx`

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  Header (Purple Gradient)                                │
│  - Package Icon (FiPackage)                             │
│  - Title: "Postman Collection Generator"                │
│  - Subtitle: "Generate custom Postman collections..."   │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐  │
│  │  Collection Type Selection                     │  │
│  │  - Unified OAuth/OIDC Flows (checkbox)        │  │
│  │  - MFA Flows (checkbox)                        │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Unified Spec Versions (if Unified selected)   │  │
│  │  - Select All / Unselect All buttons           │  │
│  │  - OAuth 2.0 (checkbox)                        │  │
│  │  - OIDC Core 1.0 (checkbox)                    │  │
│  │  - OAuth 2.1 / OIDC 2.1 (checkbox)             │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │  Select Specific Flow Variations        │  │  │
│  │  │  (Collapsible, collapsed by default)    │  │  │
│  │  │  - Select All / Unselect All            │  │  │
│  │  │  - 11 flow variation checkboxes          │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  MFA Device Types (if MFA selected)            │  │
│  │  - Select All / Unselect All buttons           │  │
│  │  - Device Types (Collapsible, collapsed)       │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │  Device Type Checkboxes (6 types)        │  │  │
│  │  │  - SMS, EMAIL, WHATSAPP, TOTP, FIDO2,   │  │  │
│  │  │    MOBILE                                │  │  │
│  │  │  - "Use Cases" button per device        │  │  │
│  │  │  ┌───────────────────────────────────┐ │  │  │
│  │  │  │  Use Cases (per device, expanded) │ │  │  │
│  │  │  │  - Select All / Unselect All      │ │  │  │
│  │  │  │  - 4 use case checkboxes          │ │  │  │
│  │  │  └───────────────────────────────────┘ │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Download Buttons                               │  │
│  │  - Download Collection + Variables (purple)    │  │
│  │  - Download Collection Only (blue)             │  │
│  │  - Download Variables Only (green)              │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  What's Included Info Section                   │  │
│  │  - Bulleted list of features                   │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Component Details

### 1. Header Section

**Location:** Top of page  
**Component:** Inline styled `div`

#### Styling

```typescript
{
  background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
  color: 'white',
  padding: '2rem',
  borderRadius: '12px',
  marginBottom: '2rem',
  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
}
```

#### Elements

- **Icon:** `FiPackage` (size: 32px)
- **Title:** "Postman Collection Generator" (fontSize: '2rem', fontWeight: '700')
- **Subtitle:** "Generate custom Postman collections for PingOne OAuth/OIDC and MFA flows" (fontSize: '1.1rem', opacity: 0.9)

---

### 2. Collection Type Selection

**Location:** First section after header  
**Component:** White card container

#### Styling

```typescript
{
  background: 'white',
  padding: '2rem',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  marginBottom: '2rem',
}
```

#### Elements

- **Title:** "Collection Type" (fontSize: '1.5rem', fontWeight: '600')
- **Checkboxes:**
  - "Unified OAuth/OIDC Flows" (default: checked)
  - "MFA Flows" (default: checked)
- **Checkbox Styling:**
  - Border: `2px solid` (purple when checked: `#8b5cf6`, gray when unchecked: `#e5e7eb`)
  - Background: light gray when checked (`#f3f4f6`), white when unchecked
  - Padding: `12px 20px`
  - Border radius: `8px`
  - Checkbox size: `20px × 20px`

---

### 3. Unified Spec Versions Section

**Location:** Second section (only visible when `includeUnified` is `true`)  
**Component:** White card container

#### Styling

Same as Collection Type Selection section.

#### Elements

- **Header Row:**
  - Title: "Unified Spec Versions" (left-aligned)
  - "Select All" button (blue border, `#3b82f6`)
  - "Unselect All" button (red border, `#ef4444`)
  - Buttons positioned right-aligned

- **Description:** "Select which OAuth/OIDC specification versions to include:" (gray text, `#6b7280`)

- **Spec Version Checkboxes (Ordered Left to Right):**
  - "OAuth 2.0" (default: checked) - OAuth 2.0 Authorization Framework (RFC 6749)
  - "OIDC Core 1.0" (default: checked, renamed from "OpenID Connect (OIDC)") - OpenID Connect Core 1.0
  - "OAuth 2.1 / OIDC 2.1" (default: checked, renamed from "OAuth 2.1") - OAuth 2.1 Authorization Framework (draft) / OIDC Core 1.0 using Authorization Code + PKCE (OAuth 2.1 / RFC 9700 baseline)
  - Border: `2px solid` (blue when checked: `#3b82f6`, gray when unchecked: `#e5e7eb`)
  - Background: light blue when checked (`#eff6ff`), white when unchecked
  - Padding: `10px 16px`
  - Checkbox size: `18px × 18px`

- **Flow Variations Section (Collapsible):**
  - Header: "Select Specific Flow Variations" with chevron icon
  - Collapsed by default (`expandedUnifiedVariations: false`)
  - "Select All" / "Unselect All" buttons (visible when expanded)
  - 11 flow variation checkboxes:
    1. Authorization Code - Client Secret Post
    2. Authorization Code - Client Secret Basic
    3. Authorization Code - Client Secret JWT
    4. Authorization Code - Private Key JWT
    5. Authorization Code - with pi.flow
    6. Authorization Code - with PKCE
    7. Authorization Code - with PKCE and PAR
    8. Implicit Flow
    9. Client Credentials Flow
    10. Device Code Flow
    11. Hybrid Flow
  - Checkbox size: `16px × 16px`
  - Padding: `8px 12px`

---

### 4. MFA Device Types Section

**Location:** Third section (only visible when `includeMFA` is `true`)  
**Component:** White card container

#### Styling

Same as Collection Type Selection section.

#### Elements

- **Header Row:**
  - Title: "MFA Device Types" (left-aligned)
  - "Select All" button (green border, `#10b981`)
  - "Unselect All" button (red border, `#ef4444`)
  - Buttons positioned right-aligned

- **Description:** "Select which MFA device types to include:" (gray text)

- **Device Types Collapsible Section:**
  - Header: "Device Types" with chevron icon
  - Collapsed by default (`expandedMFADeviceList: false`)

- **Device Type Checkboxes (when expanded):**
  - SMS (default: checked)
  - EMAIL (default: checked)
  - WHATSAPP (default: checked)
  - TOTP (default: checked)
  - FIDO2 (default: checked)
  - MOBILE (default: checked)
  - Border: `1px solid` (green when checked: `#10b981`, gray when unchecked: `#e5e7eb`)
  - Background: light green when checked (`#ecfdf5`), white when unchecked
  - Padding: `8px 12px`
  - Checkbox size: `16px × 16px`

- **Use Cases Button (per device):**
  - Visible only when device is selected
  - Text: "Use Cases" with chevron icon
  - Green border (`#10b981`), white background
  - Padding: `4px 8px`
  - Font size: `0.75rem`

- **Use Cases Section (per device, when expanded):**
  - "Select All" / "Unselect All" buttons (green/red borders)
  - 4 use case checkboxes:
    1. User Flow (OAuth login, ACTIVATION_REQUIRED)
    2. Admin Flow (Worker token, ACTIVE)
    3. Registration
    4. Authentication
  - All checked by default
  - Border: `1px solid` (green when checked, gray when unchecked)
  - Background: light green when checked, white when unchecked
  - Padding: `6px 10px`
  - Checkbox size: `16px × 16px`
  - Font size: `0.85rem`

---

### 5. Download Buttons Section

**Location:** Bottom section, centered  
**Component:** Flex container

#### Styling

```typescript
{
  display: 'flex',
  justifyContent: 'center',
  gap: '16px',
  marginTop: '2rem',
  flexWrap: 'wrap',
}
```

#### Buttons

1. **Download Collection + Variables**
   - Background: `#8b5cf6` (purple)
   - Icon: `FiDownload` (size: 20px)
   - Text: "Download Collection + Variables"
   - Padding: `16px 32px`
   - Border radius: `10px`
   - Font size: `1.1rem`
   - Font weight: `600`
   - Box shadow: `0 4px 12px rgba(139, 92, 246, 0.3)`
   - Hover: Background `#7c3aed`, shadow `0 6px 16px rgba(139, 92, 246, 0.4)`
   - Disabled: Background `#9ca3af` (gray), no shadow

2. **Download Collection Only**
   - Background: `#3b82f6` (blue)
   - Icon: `FiPackage` (size: 20px)
   - Text: "Download Collection Only"
   - Same styling as above (different colors)
   - Box shadow: `0 4px 12px rgba(59, 130, 246, 0.3)`
   - Hover: Background `#2563eb`, shadow `0 6px 16px rgba(59, 130, 246, 0.4)`

3. **Download Variables Only**
   - Background: `#10b981` (green)
   - Icon: `FiPackage` (size: 20px)
   - Text: "Download Variables Only"
   - Same styling as above (different colors)
   - Box shadow: `0 4px 12px rgba(16, 185, 129, 0.3)`
   - Hover: Background `#059669`, shadow `0 6px 16px rgba(16, 185, 129, 0.4)`

#### Loading State

- All buttons show loading spinner when `isGenerating` is `true`
- Spinner: White circular border with rotating animation
- Text changes to "Generating..." when loading
- Buttons are disabled during generation

---

### 6. Info Section

**Location:** Bottom of page  
**Component:** White card container

#### Styling

Same as Collection Type Selection section.

#### Elements

- **Title:** "What's Included" (fontSize: '1.2rem', fontWeight: '600')
- **Bulleted List:**
  - Educational comments on every API request
  - Automatic variable extraction scripts
  - Complete OAuth login steps for user flows
  - Validated API calls matching PingOne documentation
  - Both collection and environment files for easy import
- **List Styling:**
  - Color: `#6b7280` (gray)
  - Line height: `1.8`
  - Padding left: `1.5rem`

---

## State Management

### Collection Type State

```typescript
const [includeUnified, setIncludeUnified] = useState(true);
const [includeMFA, setIncludeMFA] = useState(true);
```

### Unified Spec Version State

```typescript
// Note: Labels updated to reflect correct protocol terminology
// OAuth 2.0: OAuth 2.0 Authorization Framework (RFC 6749)
// OIDC Core 1.0: OpenID Connect Core 1.0 (was "OpenID Connect (OIDC)")
// OAuth 2.1 / OIDC 2.1: OAuth 2.1 Authorization Framework (draft) / OIDC Core 1.0 using Authorization Code + PKCE (OAuth 2.1 / RFC 9700 baseline) (was "OAuth 2.1")
const [includeOAuth20, setIncludeOAuth20] = useState(true);
const [includeOAuth21, setIncludeOAuth21] = useState(true); // Represents "OAuth 2.1 / OIDC 2.1"
const [includeOIDC, setIncludeOIDC] = useState(true); // Represents "OIDC Core 1.0"
```

### Unified Flow Variation State

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
const [expandedUnifiedVariations, setExpandedUnifiedVariations] = useState(false);
```

### MFA Device Type State

```typescript
const [selectedDeviceTypes, setSelectedDeviceTypes] = useState<Set<DeviceType>>(
  new Set(['SMS', 'EMAIL', 'WHATSAPP', 'TOTP', 'FIDO2', 'MOBILE'])
);
const [expandedMFADeviceList, setExpandedMFADeviceList] = useState(false);
```

### MFA Use Case State

```typescript
const [selectedMFAUseCases, setSelectedMFAUseCases] = useState<Map<DeviceType, Set<MFAUseCase>>>(
  new Map(
    ['SMS', 'EMAIL', 'WHATSAPP', 'TOTP', 'FIDO2', 'MOBILE'].map((dt) => [
      dt as DeviceType,
      new Set<MFAUseCase>(['user-flow', 'admin-flow', 'registration', 'authentication']),
    ])
  )
);
const [expandedMFAUseCases, setExpandedMFAUseCases] = useState<Map<DeviceType, boolean>>(
  new Map(['SMS', 'EMAIL', 'WHATSAPP', 'TOTP', 'FIDO2', 'MOBILE'].map((dt) => [dt as DeviceType, false]))
);
```

### Generation State

```typescript
const [isGenerating, setIsGenerating] = useState(false);
```

---

## Color Scheme

### Primary Colors

- **Purple (Unified):** `#8b5cf6` (primary), `#7c3aed` (hover), `#6366f1` (gradient end)
- **Blue (Unified Specs):** `#3b82f6` (primary), `#2563eb` (hover), `#eff6ff` (background)
- **Green (MFA):** `#10b981` (primary), `#059669` (hover), `#ecfdf5` (background)
- **Red (Unselect):** `#ef4444` (primary), `#fef2f2` (hover background)
- **Gray (Neutral):** `#6b7280` (text), `#e5e7eb` (borders), `#9ca3af` (disabled)

### Background Colors

- **Page Background:** `#f8fafc` (light gray)
- **Card Background:** `white`
- **Selected Checkbox Background:** Light tint of primary color

---

## Typography

### Font Sizes

- **Page Title:** `2rem` (32px)
- **Section Title:** `1.5rem` (24px)
- **Subsection Title:** `1rem` (16px)
- **Info Section Title:** `1.2rem` (19.2px)
- **Button Text:** `1.1rem` (17.6px)
- **Checkbox Label:** `0.95rem` - `1rem` (15.2px - 16px)
- **Small Text:** `0.75rem` - `0.85rem` (12px - 13.6px)

### Font Weights

- **Titles:** `600` - `700`
- **Button Text:** `600`
- **Labels:** `500`
- **Body Text:** `400` (default)

---

## Spacing

### Padding

- **Page Container:** `2rem` (32px)
- **Card Sections:** `2rem` (32px)
- **Header:** `2rem` (32px)
- **Buttons:** `16px 32px` (vertical horizontal)
- **Checkboxes:** `8px 12px` - `12px 20px`

### Margins

- **Section Bottom Margin:** `2rem` (32px)
- **Header Bottom Margin:** `2rem` (32px)
- **Button Section Top Margin:** `2rem` (32px)
- **Info Section Top Margin:** `2rem` (32px)

### Gaps

- **Button Gap:** `16px`
- **Checkbox Gap:** `0.75rem` - `1.5rem`
- **Flex Gap:** `12px` - `2rem`

---

## Animations

### Loading Spinner

```css
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

### Transitions

- **Button Hover:** `all 0.2s`
- **Checkbox Border/Background:** `all 0.2s`

---

## Responsive Design

### Desktop (≥768px)

- Container max width: `1200px`
- All sections visible
- Buttons in horizontal row
- Checkboxes in horizontal flex wrap

### Mobile (<768px)

- Container padding: `1rem`
- Sections stack vertically
- Buttons wrap to multiple lines
- Checkboxes may stack vertically

---

## File Locations

**Component:** `src/pages/PostmanCollectionGenerator.tsx`

**Services:**
- `src/services/postmanCollectionGeneratorV8.ts` - Collection generation logic
- `src/v8/services/credentialsServiceV8.ts` - Credential loading
- `src/v8/services/environmentIdServiceV8.ts` - Environment ID service
- `src/v8/services/specVersionServiceV8.ts` - Spec version utilities

**Utilities:**
- `src/v8/utils/toastNotificationsV8.ts` - Toast notifications
- `src/hooks/usePageScroll.ts` - Page scroll management

---

## Version History

- **v1.1.0** (2026-01-27): Updated spec version button labels to use correct protocol terminology: "OAuth 2.0" (OAuth 2.0 Authorization Framework RFC 6749), "OIDC Core 1.0" (renamed from "OpenID Connect (OIDC)"), and "OAuth 2.1 / OIDC 2.1" (renamed from "OAuth 2.1", with clarification as OAuth 2.1 Authorization Framework draft / OIDC Core 1.0 using Authorization Code + PKCE). Updated button order to OAuth 2.0, OIDC Core 1.0, OAuth 2.1 / OIDC 2.1.
- **v1.0.0** (2026-01-27): Initial Postman Collection Generator UI documentation
