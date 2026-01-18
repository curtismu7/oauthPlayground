# Unified Flow Main Page UI Contract

**Last Updated:** 2026-01-27  
**Version:** 1.0.0  
**Status:** ✅ IMPLEMENTED

---

## Related Documentation

- [Unified Flow Main Page UI Documentation](./unified-flow-main-page-ui-doc.md) - Complete UI structure
- [Unified Flow Main Page Restore Document](./unified-flow-main-page-restore.md) - Implementation details for restoration

---

## Overview

This document defines the UI contract for the Unified OAuth/OIDC Flow main page. This contract ensures consistent behavior, error handling, and user experience across all Unified flow features.

---

## Scope

**Applies To:**
- ✅ Unified Flow Main Page (`UnifiedOAuthFlowV8U.tsx`)
- ✅ Specification Version Selector (`SpecVersionSelector.tsx`)
- ✅ Flow Type Selection
- ✅ Flow Steps (`UnifiedFlowSteps.tsx`)
- ✅ Educational Content Display
- ✅ Protocol Terminology Usage

---

## UI Component Contracts

### 1. Specification Version Selector

**Component:** `SpecVersionSelector.tsx`  
**Location:** Unified Flow Main Page

#### Required UI Elements

1. **Title**
   - Must display "Specification Version" as section title
   - Must be left-aligned
   - Must use font size `18px`, font weight `600`, color `#1f2937`

2. **Guidance Text Box**
   - **MUST** display educational content about the selected specification version
   - **MUST** include "When to use" guidance
   - **MUST** use correct protocol terminology
   - **MUST** have blue background (`#eff6ff`), blue border (`1px solid #bfdbfe`), padding `16px`, border radius `8px`

3. **Radio Button Group (Ordered Left to Right)**
   - **MUST** display "OAuth 2.0" radio button - OAuth 2.0 Authorization Framework (RFC 6749)
   - **MUST** display "OIDC Core 1.0" radio button - OpenID Connect Core 1.0 (renamed from "OpenID Connect (OIDC)")
   - **MUST** display "OAuth 2.1 / OIDC 2.1" radio button - OAuth 2.1 Authorization Framework (draft) / OIDC Core 1.0 using Authorization Code + PKCE (OAuth 2.1 / RFC 9700 baseline) (renamed from "OAuth 2.1")
   - **MUST** use correct protocol terminology as specified above
   - **MUST** be styled consistently (blue border when selected: `#3b82f6`, light blue background when selected: `#eff6ff`)

#### Protocol Terminology Requirements

**MUST** use the following terminology in all educational content and UI labels:

1. **OAuth 2.0:**
   - User-facing label: "OAuth 2.0"
   - Educational/explanatory label: "OAuth 2.0 Authorization Framework (RFC 6749)"
   - Description: Baseline OAuth framework for authorization (no ID tokens)

2. **OpenID Connect Core 1.0:**
   - User-facing label: "OIDC Core 1.0" or "OpenID Connect Core 1.0"
   - Educational/explanatory label: "OpenID Connect Core 1.0" or "OpenID Connect (OIDC)"
   - Description: Authentication layer built on top of OAuth 2.0 (ID tokens, openid scope, UserInfo endpoint)

3. **OAuth 2.1 / OIDC 2.1:**
   - User-facing label: "OAuth 2.1 / OIDC 2.1"
   - Educational/explanatory label: "OAuth 2.1 Authorization Framework (IETF draft-ietf-oauth-v2-1)" or "OAuth 2.1 (draft)"
   - Description: Consolidated OAuth 2.0 specification (still an Internet-Draft, not an RFC yet). OIDC 2.1 refers to "OIDC Core 1.0 using Authorization Code + PKCE (OAuth 2.1 / RFC 9700 baseline)"
   - **IMPORTANT:** Always mention "OAuth 2.1 (draft)" because it's still an Internet-Draft (not an RFC yet)

#### State Management

- Must track selected spec version in state
- Must update flow availability based on selected spec version
- Must update educational content based on selected spec version
- Must persist selection in `localStorage` via `CredentialsServiceV8`

#### Locked State Behavior

**CRITICAL:** Once a flow has started (currentStep > 0), the specification version selector **MUST** be locked and disabled.

**Locked State Requirements:**
- **When Locked:** After Step 0 (Configuration step) is completed
- **Visual Indication:**
  - Radio buttons must be grayed out (color: `#9ca3af`)
  - Radio buttons must have reduced opacity (0.6)
  - Cursor must be `not-allowed` when hovering
  - Help buttons must be disabled
- **Label Text:** Must display "(Locked - flow in progress)" next to the title
- **Tooltip:** Must show tooltip: "Specification version cannot be changed after starting the flow. Use 'Restart Flow' to change specification version."
- **User Guidance:** Must inform user that they can use "Restart Flow" button to change specification version

**Implementation:**
- Component must accept `disabled` prop
- When `disabled={true}`, all interactive elements must be disabled
- Locked state is determined by `currentStep > 0` in parent component

#### Validation Rules

- At least one spec version must be selected
- Selection must match available flows
- Flow availability must be validated against selected spec version
- Spec version cannot be changed after flow has started (Step 0 completed)

---

### 2. Flow Type Selection

**Component:** `FlowTypeSelector.tsx`  
**Location:** Unified Flow Main Page

**Contract:** Flow types available must be filtered by selected spec version.

#### Flow Availability by Spec Version

**OAuth 2.0:**
- ✅ Authorization Code (all variations)
- ✅ Implicit (URL Fragment, Form POST)
- ✅ Client Credentials
- ✅ Device Code
- ❌ Hybrid (OIDC-only)
- ❌ PKCE-only flows (recommended but not required)

**OpenID Connect Core 1.0:**
- ✅ Authorization Code (all variations)
- ✅ Hybrid
- ✅ Device Code (with openid scope)
- ❌ Implicit (deprecated in OAuth 2.1)
- ❌ Client Credentials (OAuth-only, no ID tokens)

**OAuth 2.1 / OIDC 2.1:**
- ✅ Authorization Code (PKCE, PKCE+PAR only - PKCE is required)
- ✅ Client Credentials
- ✅ Device Code
- ❌ Implicit (deprecated in OAuth 2.1)
- ❌ Authorization Code without PKCE (PKCE is required in OAuth 2.1)
- ❌ Hybrid (OIDC-only, not in OAuth 2.1 baseline)

#### Locked State Behavior

**CRITICAL:** Once a flow has started (currentStep > 0), the flow type selector **MUST** be locked and disabled.

**Locked State Requirements:**
- **When Locked:** After Step 0 (Configuration step) is completed
- **Visual Indication:**
  - Select dropdown must be grayed out (color: `#9ca3af`)
  - Background must be `#f3f4f6` (light gray)
  - Cursor must be `not-allowed` when hovering
  - Opacity must be reduced to 0.6
- **Label Text:** Must display "(Locked - flow in progress)" next to the title
- **Tooltip:** Must show tooltip: "Flow type cannot be changed after starting the flow. Use 'Restart Flow' to change flow type."
- **User Guidance:** Must inform user that they can use "Restart Flow" button to change flow type

**Implementation:**
- Component must accept `disabled` prop
- When `disabled={true}`, select dropdown must be disabled
- Locked state is determined by `currentStep > 0` in parent component

#### Validation Rules

- Flows not available in selected spec version must be hidden or disabled
- User must be informed why certain flows are not available
- Flow selection must validate against spec version compliance
- Flow type cannot be changed after flow has started (Step 0 completed)

---

### 3. Educational Content Display

**Contract:** Educational content MUST use correct protocol terminology.

#### Requirements

1. **Protocol Names:**
   - **MUST** use "OAuth 2.0 Authorization Framework (RFC 6749)" for OAuth 2.0 baseline
   - **MUST** use "OpenID Connect Core 1.0" for OIDC authentication layer
   - **MUST** use "OAuth 2.1 Authorization Framework (draft)" for OAuth 2.1 (always mention "draft" because it's still an Internet-Draft)
   - **MUST** clarify "OIDC 2.1" as "OIDC Core 1.0 using Authorization Code + PKCE (OAuth 2.1 / RFC 9700 baseline)"

2. **Educational Content Sections:**
   - **MUST** explain differences between OAuth 2.0, OIDC Core 1.0, and OAuth 2.1 (draft)
   - **MUST** clarify when to use each protocol
   - **MUST** explain draft status of OAuth 2.1
   - **MUST** clarify PKCE requirement for OAuth 2.1 Authorization Code flows

3. **RFC References:**
   - **MUST** use correct RFC anchor formats (`https://datatracker.ietf.org/doc/html/rfc6749#section-4.1`)
   - **MUST** include specific section anchors for each flow
   - **MUST** reference PingOne API documentation with flow-specific anchors

---

### 4. Flow Steps Educational Content

**Contract:** Each step's educational content MUST use correct protocol terminology.

#### Step 0: Configure Credentials

- **MUST** explain protocol-specific credential requirements
- **MUST** use correct protocol names in descriptions
- **MUST** show protocol-specific options (e.g., PKCE for OAuth 2.1)

#### Step 1: Build Authorization URL

- **MUST** reference correct RFC sections based on spec version
- **MUST** explain protocol-specific parameters
- **MUST** show correct URL format examples

#### Step 2: Handle Callback

- **MUST** explain protocol-specific callback handling
- **MUST** reference correct RFC sections
- **MUST** show protocol-specific response formats

#### Step 3: Exchange Code for Tokens

- **MUST** explain protocol-specific token exchange
- **MUST** reference correct RFC sections
- **MUST** show protocol-specific token formats

#### Step 4: Token Response Display

- **MUST** explain protocol-specific token types (access_token, id_token, refresh_token)
- **MUST** show protocol-specific token validation
- **MUST** reference correct RFC sections

#### Step 5: Introspection & UserInfo (OIDC flows)

- **MUST** explain OIDC-specific endpoints (Introspection, UserInfo)
- **MUST** reference OIDC Core 1.0 specifications
- **MUST** show OIDC-specific token validation

#### Step 6: Documentation

- **MUST** include correct protocol terminology
- **MUST** reference correct RFC/OIDC specifications
- **MUST** include PingOne API documentation links with flow-specific anchors

---

## Error Handling Contract

### Error Types

1. **Invalid Spec Version Selection**
   - Must display error: "Invalid specification version selection"
   - Must allow user to correct selection

2. **Flow Not Available for Spec Version**
   - Must display warning: "This flow is not available for the selected specification version"
   - Must explain why flow is not available
   - Must suggest alternative flows or spec versions

3. **Protocol Terminology Mismatch**
   - Must validate all educational content uses correct terminology
   - Must warn if incorrect terminology is detected
   - Must provide correct terminology suggestions

---

## Version History

- **v1.1.0** (2025-01-27): Added locked selector behavior - specification version and flow type selectors are locked after Step 0
- **v1.0.0** (2026-01-27): Initial Unified Flow Main Page UI contract with protocol terminology requirements (OAuth 2.0, OIDC Core 1.0, OAuth 2.1 / OIDC 2.1)

---

## Notes

- **Protocol Terminology:** All educational content, UI labels, and documentation MUST use correct protocol terminology as specified above
- **Spec Version Selection:** Must determine flow availability and educational content
- **Educational Content:** Must be updated based on selected spec version
- **RFC References:** Must use correct RFC anchor formats and include specific section anchors
- **OAuth 2.1 Draft Status:** Must always mention "OAuth 2.1 (draft)" because it's still an Internet-Draft (not an RFC yet)
