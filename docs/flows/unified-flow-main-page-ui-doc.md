# Unified Flow Main Page UI Documentation

**Last Updated:** 2026-01-23  
**Version:** 1.1.0  
**Status:** ✅ IMPLEMENTED

---

## Related Documentation

- [Unified Flow Main Page UI Contract](./unified-flow-main-page-ui-contract.md) - UI behavior contracts
- [Unified Flow Main Page Restore Document](./unified-flow-main-page-restore.md) - Implementation details for restoration
- [Unified Flow Architecture](../UNIFIED_FLOW_ARCHITECTURE.md) - Architecture overview
- [Collapsible Sections Guide](../COLLAPSIBLE_SECTIONS_GUIDE.md) - Collapsible UI components guide

---

## Overview

This document provides a complete reference for the UI structure, components, styling, and layout of the Unified OAuth/OIDC Flow main page (`UnifiedOAuthFlowV8U.tsx`). This page serves as the entry point for all Unified OAuth 2.0 and OpenID Connect flows, providing specification version selection, flow type selection, and educational content.

**Recent Updates (v1.1.0):**
- ✅ **Collapsible Sections**: All educational and setup sections now collapsible
- ✅ **Enhanced Toggle Icons**: 48px prominent blue toggle icons with hover effects
- ✅ **Step-Based Visibility**: Setup sections only shown on step 0 (configuration)
- ✅ **Professional Styling**: Gradient backgrounds and smooth animations

---

## Page Layout

**Location:** `/v8u/oauth`  
**Component:** `UnifiedOAuthFlowV8U.tsx`

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  UnifiedFlowNavigationV8U (Top Navigation Bar)          │
├─────────────────────────────────────────────────────────┤
│  Unified Flow Header                                     │
│  - Title: "Unified OAuth & OIDC"                        │
│  - Subtitle: "Test all OAuth 2.0 and OpenID Connect..." │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐  │
│  │  Specification Version Selector                  │  │
│  │  - Title: "Specification Version"                │  │
│  │  - Guidance text (blue box)                      │  │
│  │  - Radio buttons (3 options):                    │  │
│  │    • OAuth 2.0                                   │  │
│  │    • OpenID Connect Core 1.0                     │  │
│  │    • OAuth 2.1 / OIDC 2.1                       │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Flow Type Selection                             │  │
│  │  - Flow type cards/buttons                       │  │
│  │  - Available flows based on spec version         │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Flow Steps (UnifiedFlowSteps)                   │  │
│  │  - Step-by-step flow execution                   │  │
│  │  - Educational content                           │  │
│  │  - API call displays                             │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Collapsible Sections (NEW v1.1.0)

### Overview

All educational and setup sections on the main page are now collapsible with enhanced visibility and professional styling. This provides users with better control over their interface experience while maintaining easy access to important information.

### Collapsible Components

#### ✅ FlowGuidanceSystem
- **Purpose**: Help users choose the right OAuth flow
- **Location**: Step 0 (configuration page) only
- **Features**:
  - Use case selection cards
  - Personalized recommendations  
  - Educational guidance
- **Toggle**: 48px blue chevron icon with gradient background

#### ✅ SecurityScorecard  
- **Purpose**: Visual security compliance feedback
- **Location**: Step 0 (configuration page) only
- **Features**:
  - Security scoring (A-F grades)
  - Compliance checks by category
  - Recommendations for improvement
- **Toggle**: 48px blue chevron icon with gradient background

#### ✅ AdvancedOAuthFeatures
- **Purpose**: Advanced OAuth 2.1 and OIDC features
- **Location**: Step 0 (configuration page) only  
- **Features**:
  - PAR (Pushed Authorization Request)
  - JAR (JWT Authorization Request)
  - MTLS (Mutual TLS) support
- **Toggle**: 48px blue chevron icon with gradient background

### Step-Based Visibility

**Step 0 (Configuration Page)** - All sections visible and collapsible:
- ✅ FlowGuidanceSystem
- ✅ SecurityScorecard  
- ✅ AdvancedOAuthFeatures

**Steps 1+ (Execution Steps)** - Focused interface:
- ✅ Educational sections only (Spec Compliance, OIDC Tokens, etc.)
- ❌ Setup sections hidden to maintain focus

### Enhanced Toggle Icons

#### Visual Design
- **Size**: 48px × 48px (large and prominent)
- **Border**: 3px solid blue (#3b82f6)
- **Background**: White to light gray gradient
- **Icon**: FiChevronDown (24px, stroke-width: 3px)
- **Shadow**: Drop shadow for depth

#### Interactive Effects
- **Hover**: Scale to 1.1x, enhanced shadow, color change
- **Active**: Scale to 0.95x, reduced shadow
- **Rotation**: -90° when collapsed, 0° when expanded
- **Animation**: Smooth 0.3s transitions

#### Header Button Styling
- **Background**: Green gradient (#f0fdf4 to #ecfdf3)
- **Hover**: Enhanced green with elevation effect
- **Text**: Dark green (#14532d), bold weight
- **Border**: Transparent, shows green on hover
- **Shadow**: Subtle shadow that enhances on hover

### User Experience Benefits

#### Progressive Disclosure
- **Reduced Cognitive Load**: Users can hide sections they don't need
- **Better Focus**: Show only relevant content for current task
- **Clean Interface**: Less visual clutter when sections are collapsed

#### Enhanced Visibility
- **Easy to Find**: 48px icons are impossible to miss
- **Clear Interaction**: Large click targets and hover feedback
- **Professional Appearance**: Consistent styling across all sections

#### Accessibility
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Support**: Proper ARIA attributes
- **High Contrast**: Strong color differentiation
- **Touch Friendly**: Large targets for mobile devices

### Technical Implementation

#### Component Structure
```typescript
<CollapsibleSection>
  <CollapsibleHeaderButton onClick={() => setIsCollapsed(!isCollapsed)}>
    <CollapsibleTitle>
      <Icon />
      Section Title
    </CollapsibleTitle>
    <CollapsibleToggleIcon $collapsed={isCollapsed}>
      <FiChevronDown />
    </CollapsibleToggleIcon>
  </CollapsibleHeaderButton>
  {!isCollapsed && (
    <CollapsibleContent>
      {/* Section content */}
    </CollapsibleContent>
  )}
</CollapsibleSection>
```

#### State Management
- **useState**: `const [isCollapsed, setIsCollapsed] = useState(false)`
- **Conditional Rendering**: Content only shown when not collapsed
- **Animation**: Fade-in effect when expanding

#### Styled Components
- **CollapsibleSection**: Container with white background and shadow
- **CollapsibleHeaderButton**: Interactive header with gradient background
- **CollapsibleTitle**: Title with icon and proper spacing
- **CollapsibleToggleIcon**: Large, prominent toggle with rotation animation
- **CollapsibleContent**: Content area with fade-in animation

---

## Component Details

### 1. Header Section

**Location:** Top of page  
**Component:** Inline styled `div`

#### Styling

- Background: `linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)` (blue gradient)
- Color: White
- Padding: `2rem`
- Border radius: `12px`
- Margin bottom: `2rem`
- Box shadow: `0 4px 12px rgba(59, 130, 246, 0.3)`

#### Elements

- **Title:** "Unified OAuth & OIDC" (fontSize: `2rem`, fontWeight: `700`)
- **Subtitle:** "Test all OAuth 2.0 and OpenID Connect flows with real PingOne APIs" (fontSize: `1.1rem`, opacity: `0.9`)

---

### 2. Specification Version Selector

**Location:** First section after header  
**Component:** `SpecVersionSelector.tsx`

#### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  Specification Version                                   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Guidance Text (Blue Box)                       │  │
│  │  - Educational content about selected spec      │  │
│  │  - When to use guidance                         │  │
│  │  - Protocol terminology explanations            │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  Radio Button Group:                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ OAuth 2.0│  │OIDC Core │  │OAuth 2.1 │           │
│  │          │  │   1.0    │  │/ OIDC 2.1│           │
│  └──────────┘  └──────────┘  └──────────┘           │
└─────────────────────────────────────────────────────────┘
```

#### Specification Version Options

1. **OAuth 2.0**
   - **Full Name:** OAuth 2.0 Authorization Framework (RFC 6749)
   - **Description:** The baseline OAuth framework for authorization
   - **When to Use:** When you need authorization without authentication (no ID tokens)
   - **Available Flows:** Authorization Code, Implicit, Client Credentials, Device Code

2. **OpenID Connect Core 1.0** (renamed from "OpenID Connect (OIDC)")
   - **Full Name:** OpenID Connect Core 1.0
   - **Description:** Authentication layer built on top of OAuth 2.0, adding ID tokens, UserInfo endpoint, and openid scope
   - **When to Use:** When you need authentication (ID tokens, user information)
   - **Available Flows:** Authorization Code, Hybrid, Device Code (with openid scope)

3. **OAuth 2.1 / OIDC 2.1** (renamed from "OAuth 2.1")
   - **Full Name:** OAuth 2.1 Authorization Framework (IETF draft-ietf-oauth-v2-1) / OIDC Core 1.0 using Authorization Code + PKCE (OAuth 2.1 / RFC 9700 baseline)
   - **Description:** Consolidated OAuth 2.0 specification (still an Internet-Draft, not an RFC yet). OIDC 2.1 refers to OIDC Core 1.0 using Authorization Code + PKCE as the baseline
   - **When to Use:** When you want to use the latest consolidated OAuth spec with PKCE (required for Authorization Code flows)
   - **Available Flows:** Authorization Code (PKCE required), Client Credentials, Device Code
   - **Important Note:** OAuth 2.1 (draft) is safest to say because it's still an Internet-Draft (not an RFC yet)

#### Guidance Text Box

**Styling:**
- Background: `#eff6ff` (light blue)
- Border: `1px solid #bfdbfe` (blue border)
- Border radius: `8px`
- Padding: `16px`
- Margin bottom: `16px`

**Content:**
- Educational content about the selected specification version
- When to use guidance
- Protocol terminology explanations
- Clarification about draft status (for OAuth 2.1)

#### Locked State (After Step 0)

**Important:** Once you start a flow (move past Step 0), the specification version selector becomes locked and cannot be changed.

**Visual Indicators:**
- Radio buttons appear grayed out
- Help buttons are disabled
- Label shows "(Locked - flow in progress)"
- Tooltip explains: "Specification version cannot be changed after starting the flow. Use 'Restart Flow' to change specification version."

**To Change Specification Version:**
1. Click the "Restart Flow" button
2. This will reset you to Step 0
3. You can then change the specification version
4. Note: Changing specification version may require different credentials or flow configuration

---

### 3. Flow Type Selection

**Location:** After specification version selector  
**Component:** Dynamic flow list based on selected spec version

#### Available Flows by Spec Version

**OAuth 2.0:**
- Authorization Code (Client Secret Post, Basic, JWT, Private Key JWT, PKCE, PKCE+PAR, Redirectless)
- Implicit (URL Fragment, Form POST)
- Client Credentials
- Device Code

**OpenID Connect Core 1.0:**
- Authorization Code (Client Secret Post, Basic, JWT, Private Key JWT, PKCE, PKCE+PAR, Redirectless)
- Hybrid
- Device Code (with openid scope)

**OAuth 2.1 / OIDC 2.1:**
- Authorization Code (PKCE, PKCE+PAR only - PKCE is required)
- Client Credentials
- Device Code

#### Locked State (After Step 0)

**Important:** Once you start a flow (move past Step 0), the flow type selector becomes locked and cannot be changed.

**Visual Indicators:**
- Select dropdown appears grayed out
- Background changes to light gray
- Label shows "(Locked - flow in progress)"
- Tooltip explains: "Flow type cannot be changed after starting the flow. Use 'Restart Flow' to change flow type."

**To Change Flow Type:**
1. Click the "Restart Flow" button
2. This will reset you to Step 0
3. You can then change the flow type
4. Note: Changing flow type may require different credentials or configuration

**Why Locked?**
- Prevents configuration errors mid-flow
- Ensures flow consistency
- Prevents token/state mismatches
- Maintains educational flow integrity

---

### 4. Flow Steps

**Location:** After flow selection  
**Component:** `UnifiedFlowSteps.tsx`

#### Step Structure

Each flow consists of multiple steps (varies by flow type):

1. **Step 0:** Configure Credentials
2. **Step 1:** Build Authorization URL
3. **Step 2:** Handle Callback
4. **Step 3:** Exchange Code for Tokens
5. **Step 4:** Token Response Display
6. **Step 5:** Introspection & UserInfo (OIDC flows)
7. **Step 6:** Documentation (varies by flow)

#### Educational Content

Each step includes educational content explaining:
- What the step does
- Protocol specifications (RFC references)
- Security considerations
- Best practices

**Protocol Terminology in Educational Content:**
- **OAuth 2.0:** Referred to as "OAuth 2.0 Authorization Framework (RFC 6749)" or simply "OAuth 2.0"
- **OpenID Connect:** Referred to as "OpenID Connect (OIDC)" or "OpenID Connect Core 1.0"
- **OAuth 2.1:** Referred to as "OAuth 2.1 Authorization Framework (IETF draft-ietf-oauth-v2-1)" or "OAuth 2.1 (draft)"
- **OIDC 2.1:** Clarified as "OIDC Core 1.0 using Authorization Code + PKCE (OAuth 2.1 / RFC 9700 baseline)"

---

## Protocol Terminology Reference

### Correct Usage

**OAuth 2.0:**
- **User-facing label:** "OAuth 2.0"
- **Educational/explanatory label:** "OAuth 2.0 Authorization Framework (RFC 6749)"
- **When to use:** Baseline OAuth framework for authorization (no ID tokens)

**OpenID Connect Core 1.0:**
- **User-facing label:** "OIDC Core 1.0" or "OpenID Connect Core 1.0"
- **Educational/explanatory label:** "OpenID Connect Core 1.0" or "OpenID Connect (OIDC)"
- **When to use:** Authentication layer (ID tokens, openid scope, UserInfo endpoint)

**OAuth 2.1:**
- **User-facing label:** "OAuth 2.1 / OIDC 2.1"
- **Educational/explanatory label:** "OAuth 2.1 Authorization Framework (IETF draft-ietf-oauth-v2-1)" or "OAuth 2.1 (draft)"
- **When to use:** Newer consolidated OAuth spec (still an Internet-Draft, not an RFC yet)

**OIDC 2.1 (Clarification):**
- **Precise term:** "OIDC Core 1.0 using Authorization Code + PKCE (OAuth 2.1 / RFC 9700 baseline)"
- **When to use:** OIDC flows using OAuth 2.1 as the baseline (PKCE required for Authorization Code)

---

## Styling Conventions

- **Primary Actions:** Blue (`#3b82f6`)
- **Secondary Actions:** Gray (`#6b7280`)
- **Error Messages:** Red (`#dc2626`)
- **Success Messages:** Green (`#10b981`)
- **Warning Messages:** Yellow (`#f59e0b`)
- **Backgrounds:** Light gray (`#f9fafb`), white (`#ffffff`)
- **Text:** Dark gray (`#1f2937`), medium gray (`#6b7280`)

---

## Version History

- **v1.0.0** (2026-01-27): Initial Unified Flow Main Page UI documentation with protocol terminology updates (OAuth 2.0, OIDC Core 1.0, OAuth 2.1 / OIDC 2.1)

---

## Notes

- **Protocol Terminology:** All educational content and UI labels must use correct protocol terminology as specified above
- **Spec Version Selection:** Selecting a spec version determines which flows are available
- **Flow Availability:** Not all flows are available in all spec versions (e.g., Hybrid is OIDC-only, Implicit is deprecated in OAuth 2.1)
- **Educational Content:** Each step includes educational content explaining protocol specifications and best practices
