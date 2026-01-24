# MFA UI Documentation

**Last Updated:** 2026-01-23  
**Version:** 1.1.0  

This folder contains all UI contracts, UI documentation, and restore/master documents for MFA components.

> **📖 New to the documentation?** See the [Documentation Guide](../DOCUMENTATION_GUIDE.md) for an overview of all documentation types.
> **🔄 Recent Changes:** See [Collapsible Sections Guide](../COLLAPSIBLE_SECTIONS_GUIDE.md) for new collapsible UI features.

## Recent Updates (v1.1.0)

- ✅ **Collapsible Sections**: MFA Hub sections now collapsible with enhanced visibility
- ✅ **Enhanced Toggle Icons**: 48px prominent blue toggle icons with hover effects  
- ✅ **Professional Styling**: Gradient backgrounds and smooth animations
- ✅ **Consistent Design**: Same collapsible system as Unified flows
- ✅ **Documentation Updated**: All MFA docs reflect new collapsible features

## Documentation Structure

Each MFA device type has three documentation files:

- **UI Contract** (`MFA_{DEVICE_TYPE}_UI_CONTRACT.md`) - Technical specification for developers
- **UI Documentation** (`MFA_{DEVICE_TYPE}_UI_DOC.md`) - End-user guide
- **Restore Documentation** (`MFA_{DEVICE_TYPE}_RESTORE.md`) - Implementation details for restoration

## Available Device Types

| Device Type | UI Contract | UI Doc | Restore | Collapsible Sections |
|-------------|-------------|--------|---------|----------------------|
| SMS | ✅ | ✅ | ✅ | ✅ (Documentation Page) |
| Email | ✅ | ✅ | ✅ | ✅ (Documentation Page) |
| WhatsApp | ✅ | ✅ | ✅ | ✅ (Documentation Page) |
| TOTP | ✅ | ✅ | ✅ | ✅ (Documentation Page) |
| FIDO2 | ✅ | ✅ | ✅ | ✅ (Documentation Page) |
| Mobile | ✅ | ✅ | ✅ | ✅ (Documentation Page) |
| Config Page | ✅ | ✅ | ✅ | ✅ (Hub Sections) |
| Success Page | ✅ | ✅ | - | ✅ (Documentation Page) |

## Collapsible Sections Implementation

### MFA Hub Collapsible Sections

#### ✅ MFA Features Section
- **Location**: `src/v8/flows/MFAHubV8.tsx`
- **Purpose**: Main navigation to MFA features
- **Features**:
  - Device Registration
  - Device Management  
  - MFA Reporting
  - Settings
- **Toggle**: 48px blue chevron icon with gradient background

#### ✅ About PingOne MFA Section
- **Location**: `src/v8/flows/MFAHubV8.tsx`
- **Purpose**: Educational information about MFA capabilities
- **Features**:
  - Security overview
  - Flexibility information
  - Analytics insights
  - Performance highlights
- **Toggle**: 48px blue chevron icon with gradient background

### MFA Documentation Page Collapsible Sections

#### ✅ API Documentation Sections
- **Location**: `src/v8/components/MFADocumentationPageV8.tsx`
- **Purpose**: Detailed API call documentation
- **Features**:
  - MFA Flow API calls
  - Pre-flight validation calls
  - Real-time API tracking
  - Download capabilities
- **Toggle**: 20px chevron icons (smaller for dense content)

### Enhanced Toggle Features

#### Visual Design
- **Size**: 48px × 48px (Hub sections), 20px (Documentation sections)
- **Border**: 3px solid blue (#3b82f6)
- **Background**: White to light gray gradient
- **Icon**: FiChevronDown with proper stroke width
- **Shadow**: Drop shadow for depth

#### Interactive Effects
- **Hover**: Scale to 1.1x, enhanced shadow, color change
- **Active**: Scale to 0.95x, reduced shadow
- **Rotation**: -90° when collapsed, 0° when expanded
- **Animation**: Smooth 0.3s transitions

## Master Documents

- **Documentation Page Master**: `MFA_DOCUMENTATION_PAGE_MASTER.md`
- **Documentation Modal Master**: `MFA_DOCUMENTATION_MODAL_MASTER.md`
- **Success Page Master**: `MFA_SUCCESS_PAGE_MASTER.md`
- **FIDO2 Master**: `MFA_FIDO2_MASTER.md`
- **Mobile Master**: `MFA_MOBILE_MASTER.md`
- **OTP/TOTP Master**: `MFA_OTP_TOTP_MASTER.md`

## Quick Start

**To move all UI documentation files to this folder, run:**
```bash
cd docs
bash move-ui-docs.sh
```

**Or manually move the following files from `docs/` to `docs/mfa-ui-documentation/`:**

## Files to Move

### UI Contracts
UI behavior contracts that define how components should behave:
- `MFA_CONFIG_PAGE_UI_CONTRACT.md` - MFA Configuration Page UI contract
- `MFA_EMAIL_UI_CONTRACT.md` - Email flow UI contract
- `MFA_FIDO2_UI_CONTRACT.md` - FIDO2 flow UI contract
- `MFA_MOBILE_UI_CONTRACT.md` - Mobile flow UI contract
- `MFA_SMS_UI_CONTRACT.md` - SMS flow UI contract
- `MFA_STATE_PRESERVATION_UI_CONTRACT.md` - State preservation UI contract
- `MFA_SUCCESS_PAGE_UI_CONTRACT.md` - Success page UI contract
- `MFA_TOTP_UI_CONTRACT.md` - TOTP flow UI contract
- `MFA_WHATSAPP_UI_CONTRACT.md` - WhatsApp flow UI contract
- `MFA_WORKER_TOKEN_UI_CONTRACT.md` - Worker token UI contract

### UI Documentation
Complete UI structure and component documentation:
- `MFA_CONFIG_PAGE_UI_DOC.md` - MFA Configuration Page UI documentation
- `MFA_EMAIL_UI_DOC.md` - Email flow UI documentation
- `MFA_FIDO2_UI_DOC.md` - FIDO2 flow UI documentation
- `MFA_MOBILE_UI_DOC.md` - Mobile flow UI documentation
- `MFA_SMS_UI_DOC.md` - SMS flow UI documentation
- `MFA_SUCCESS_PAGE_UI_DOC.md` - Success page UI documentation
- `MFA_TOTP_UI_DOC.md` - TOTP flow UI documentation
- `MFA_WHATSAPP_UI_DOC.md` - WhatsApp flow UI documentation

### Restore/Master Documents
Implementation details and restoration guides:
- `MFA_CONFIG_PAGE_RESTORE.md` - MFA Configuration Page restore document
- `MFA_DOCUMENTATION_MODAL_MASTER.md` - Documentation modal master document
- `MFA_DOCUMENTATION_PAGE_MASTER.md` - Documentation page master document
- `MFA_EMAIL_RESTORE.md` - Email flow restore document
- `MFA_FIDO2_MASTER.md` - FIDO2 master document
- `MFA_MOBILE_MASTER.md` - Mobile master document
- `MFA_MOBILE_RESTORE.md` - Mobile flow restore document
- `MFA_OTP_TOTP_MASTER.md` - OTP/TOTP master document
- `MFA_SMS_RESTORE.md` - SMS flow restore document
- `MFA_SUCCESS_PAGE_MASTER.md` - Success page master document
- `MFA_TOTP_MASTER.md` - TOTP master document
- `MFA_TOTP_RESTORE.md` - TOTP flow restore document
- `MFA_WHATSAPP_RESTORE.md` - WhatsApp flow restore document

## Purpose

These documents serve to:
1. **Prevent Drift:** Define clear contracts and structure requirements
2. **Enable Restoration:** Provide detailed implementation guides for restoring broken components
3. **Maintain Consistency:** Ensure UI behavior and structure remain consistent across updates

## Usage

When a component breaks or drifts from its intended behavior:
1. Check the relevant **UI Contract** for behavior requirements
2. Review the **UI Documentation** for structure and component details
3. Use the **Restore/Master Document** for step-by-step restoration guidance

## Documentation Update Convention

**Important:** All UI contracts, UI documentation, and restore/master documents include a timestamp in the "Last Updated" field:
- **Format:** `**Last Updated:** YYYY-MM-DD HH:MM:SS`
- **Example:** `**Last Updated:** 2026-01-06 14:30:00`
- **Requirement:** This timestamp **MUST be updated whenever the document is modified** to track when changes were made
- **Purpose:** The timestamp helps identify the currency of documentation and track when implementations were last verified

## Related Documentation

- [MFA API Reference](../MFA_API_REFERENCE.md) - Complete API endpoint documentation
- [MFA State Preservation UI Contract](./MFA_STATE_PRESERVATION_UI_CONTRACT.md) - State preservation contracts

