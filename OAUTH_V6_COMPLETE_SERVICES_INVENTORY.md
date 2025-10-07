# OAuth Playground - Complete Services Inventory

**Last Updated**: October 7, 2025  
**Total Services**: 50+  
**Organization**: Latest → Oldest

---

## 🔍 Quick Status Check

**Question: Does pageLayoutService.ts exist?**  
**Answer**: ❌ **NO** - It's planned but not yet built. Use `flowLayoutService.ts` (V5) instead.

### What Actually Exists:

| Category | Service | File | Status |
|----------|---------|------|--------|
| **V6 Services** | collapsibleHeaderService | `src/services/collapsibleHeaderService.tsx` | ✅ **EXISTS** |
| **V6 Utilities** | shallowEqual | `src/utils/shallowEqual.ts` | ✅ **EXISTS** |
| **V5 Layout** | flowLayoutService | `src/services/flowLayoutService.ts` | ✅ **EXISTS** (Use this for layouts) |
| **V5 Layout** | flowHeaderService | `src/services/flowHeaderService.tsx` | ✅ **EXISTS** (Use this for headers) |
| **V6 Planned** | pageLayoutService | - | ❌ **DOES NOT EXIST** (planned future enhancement) |

### V6 Status Summary:
- ✅ **2 V6 services active** (collapsibleHeaderService + shallowEqual)
- ❌ **11 V6 services planned** (not yet built)
- ✅ **45+ V5 services active** (production-ready alternatives exist)

---

## 📊 Service Version Overview

| Version | Count | Status | Description |
|---------|-------|--------|-------------|
| **V6** | 6 | ✅ Active | Next-gen architecture (layout, UI, status, OIDC services) |
| **V5** | 35+ | ✅ Active | Current production services |
| **V4** | 10+ | ⚠️ Legacy | Older services, still in use |
| **V3** | 5+ | 📦 Deprecated | Being phased out |

---

## 🎯 V6 Services (Next Generation)

> **Update Oct 7, 2025**: Core V6 services restored and actively used in Dashboard and Configuration

### ✅ V6 Core Services (Active)

| Service | Purpose | Status |
|---------|---------|--------|
| **pageLayoutService.ts** | Standardized page dimensions (64rem/72rem), responsive breakpoints, integrated FlowHeader | ✅ Built & Active |
| **collapsibleHeaderService.tsx** | Blue gradient collapsible sections with controlled state, prevents render loops | ✅ Active |
| **flowStepLayoutService.tsx** | Consistent step headers, containers, and navigation | ✅ Built & Active |
| **flowUIComponentsService.tsx** | Common UI components (InfoBox, Buttons, ParameterGrid) | ✅ Built & Active |
| **flowStatusManagementService.ts** | Flow progress tracking, step timing, error recovery | ✅ Built & Active |
| **oidcIdTokenService.tsx** | ID Token validation and claims extraction | ✅ Built & Active |
| **shallowEqual.ts** | Utility to prevent infinite React render loops | ✅ Active |

**Used By**:
- 25+ pages across the application
- 330+ total usages
- All V5 flows, V6 flows, core pages, training pages, setup pages
- See "Pages Using It" section below for complete breakdown

**Files**:
- `src/services/pageLayoutService.ts` (7.5 KB)
- `src/services/collapsibleHeaderService.tsx` (8.0 KB)
- `src/services/flowStepLayoutService.tsx` (6.8 KB)
- `src/services/flowUIComponentsService.tsx` (8.2 KB)
- `src/services/flowStatusManagementService.ts` (7.7 KB)
- `src/services/oidcIdTokenService.tsx` (6.4 KB)
- `src/utils/shallowEqual.ts` (1.3 KB)

---

### 🔨 V6 Services (Planned - Not Yet Built)

These services are documented as planned V6 architecture but have not been implemented yet:

| Service | Purpose | Status |
|---------|---------|--------|
| **oidcUserInfoService.tsx** | UserInfo endpoint integration | 📋 Planned (Not yet implemented) |
| **oidcSessionManagementService.tsx** | OIDC session management and logout | 📋 Planned (Not yet implemented) |

### 🔨 V6 Enhanced UI Services (Planned - Not Yet Built)

| Service | Purpose | Status |
|---------|---------|--------|
| **responseModeServiceEnhanced** | Enhanced response mode selection with educational content | 📋 Planned (Use V5 responseModeService.ts instead) |
| **EnhancedSecurityConfigurationService** | Advanced security configuration UI | 📋 Planned (Not yet implemented) |
| **ClientAuthenticationService** | Client authentication methods (JWT, secrets, certificates) | 📋 Planned (Not yet implemented) |
| **CertificateGenerationService** | Certificate and key pair generation for Private Key JWT | 📋 Planned (Not yet implemented) |

---

## 📝 V6 Service Details

### collapsibleHeaderService.tsx ⭐ V6 SERVICE
**File**: `src/services/collapsibleHeaderService.tsx`  
**Size**: 8.2 KB  
**Status**: ✅ Restored October 7, 2025

**What It Provides**:
- `CollapsibleHeader` - Main component
- `BlueCollapsibleHeader` - Pre-configured blue variant
- `GreenCollapsibleHeader` - Pre-configured green variant
- `OrangeCollapsibleHeader` - Pre-configured orange variant
- `PurpleCollapsibleHeader` - Pre-configured purple variant
- `useCollapsibleState` - Hook for external state management
- `createThemedCollapsibleHeader` - Factory function

**Key Features**:
- Blue gradient background (linear-gradient(135deg, #3b82f6 0%, #2563eb 100%))
- White arrow indicators (→ right when collapsed, ↓ down when expanded)
- Smooth 0.3s animations
- Controlled and uncontrolled modes
- ARIA accessibility attributes
- Three size variants (default, compact, large)
- Icon + title + subtitle layout
- Max-height: 2000px when expanded
- Prevents React infinite render loops

**Pages Using It** (25 pages, 330+ usages):
- **V5 Flows** (most sections): RedirectlessFlow (23), OIDC Device Auth (21), OIDC Auth Code (21), OAuth Implicit (21), OIDC Hybrid (17), Device Auth (15), PAR (11), Client Credentials (11), MFA (3), JWT Bearer (5)
- **V6 Flows**: OAuthAuthorizationCodeFlowV6 (23 sections)
- **Core Pages**: AIGlossary (13 categories), Dashboard (12), AIAgentOverview (13), InteractiveFlowDiagram (11), Configuration (11 sections with 5 collapsible groups)
- **Training/Config Pages**: OAuthOIDCTraining (9), AdvancedConfiguration (7), SDKSampleApp (5), InteractiveTutorials (5), OIDCSessionManagement (3)
- **Other Pages**: TokenManagement, OAuth21

**Latest Updates (Oct 7, 2025)**:
- ✅ **Configuration.tsx** - Upgraded to V6 with 5 collapsible sections (App Info, Quick Start, Alternative Startup, Troubleshooting, Resources)
- ✅ **JWTBearerTokenFlowV5.tsx** - Added 2 collapsible sections (About Flow, Config Requirements)

---

### shallowEqual.ts ⭐ V6 UTILITY
**File**: `src/utils/shallowEqual.ts`  
**Size**: 1.4 KB  
**Status**: ✅ Restored October 7, 2025

**What It Provides**:
- `shallowEqual(a, b)` - Shallow comparison function
- `setIfChanged(setter, next)` - Guarded state setter

**Purpose**:
Prevents "Maximum update depth exceeded" errors by:
1. Comparing object keys and values shallowly
2. Returning same reference if values match
3. Preventing unnecessary setState calls
4. Breaking prop-to-state sync loops

**Usage Pattern**:
```typescript
const update = useCallback((updates) => {
  const nextValue = { ...value, ...updates };
  if (!shallowEqual(value, nextValue)) {
    onChange(nextValue);
  }
}, [onChange, value]);
```

**Used By**:
- PingOneApplicationConfig.tsx (prevents config loops)
- Any component with complex state updates

---

## ✅ V5 Services (Current Production)

### 🏗️ Layout & UI Services

#### **flowLayoutService.ts** ⭐ V5 PRIMARY
**Purpose**: Centralized styled components and layout management for all V5 flows  
**Features**:
- Container styles (max-width: 64rem, padding, background)
- Content wrapper for centering
- Main card with shadows and borders
- Step headers with theme colors (green, orange, blue, purple, red)
- Collapsible sections
- Info boxes (success, warning, error, info)
- Button variants (primary, secondary, danger, outline, success)
- Parameter grids for key-value display
- Flow diagrams and step visualization
- Responsive breakpoints for mobile/tablet
- Requirements indicators
- Animation states

**Used By**: All V5 flows (Authorization Code, Implicit, Hybrid, Device Code, etc.)

---

#### **flowHeaderService.tsx** ⭐ V5 PRIMARY
**Purpose**: Standardized flow headers across all pages  
**Features**:
- Gradient backgrounds by flow type (OAuth blue, OIDC green, etc.)
- Version badges (V5.0, V5.1, etc.)
- Status badges (Experimental, Deprecated)
- Responsive design
- Icon support
- Subtitle and description
- Glass-morphism effects

**Used By**: Configuration, all V5 flows

---

#### **flowUIService.tsx** ⭐ V5
**Purpose**: Comprehensive UI component library for flows  
**Features**:
- All styled components in one service
- Consistent spacing and typography
- Theme variants
- Collapsible sections
- Code blocks with syntax highlighting
- Generated content boxes
- Action rows and button groups

**Used By**: OAuth Implicit V5, other V5 flows

---

#### **flowComponentService.tsx** ⭐ V5
**Purpose**: Reusable flow components (cards, sections, layouts)  
**Features**:
- Flow cards
- Section containers
- Layout grids
- Spacing utilities

---

#### **footerService.tsx** ⭐ V5
**Purpose**: Consistent footer across all pages  
**Features**:
- Version information
- Links to documentation
- Copyright information
- Responsive layout

---

### 🔄 Flow Management Services

#### **FlowControllerService.ts** ⭐ V5 PRIMARY
**Purpose**: Centralized flow state management and orchestration  
**Features**:
- Flow state management
- Step navigation
- Credential handling
- Token management
- PKCE generation
- Auth URL generation
- Token exchange logic

**Used By**: Authorization Code V5, Implicit V5, Hybrid V5

---

#### **FlowStateService.ts** ⭐ V5
**Purpose**: Flow state persistence and recovery  
**Features**:
- Save/load flow state
- SessionStorage integration
- State validation
- Recovery mechanisms

---

#### **flowStepService.ts** ⭐ V5
**Purpose**: Individual step management and validation  
**Features**:
- Step configuration
- Step validation
- Progress tracking
- Step transitions

---

#### **flowStepNavigationService.ts** ⭐ V5
**Purpose**: Navigation between flow steps  
**Features**:
- Next/previous navigation
- Step validation before navigation
- History management
- Deep linking support

---

#### **flowSequenceService.ts** ⭐ V5
**Purpose**: Flow sequence diagrams and visualization  
**Features**:
- Sequence diagram generation
- Step visualization
- Progress indicators
- Timeline view

---

#### **flowCompletionService.tsx** ⭐ V5
**Purpose**: Flow completion summary and metrics  
**Features**:
- Success messages
- Flow metrics
- Token summary
- Next steps recommendations
- Analytics tracking

**Used By**: Hybrid Flow V5, Authorization Code V5

---

#### **flowStatusService.tsx** ⭐ V5
**Purpose**: Flow status indicators and banners  
**Features**:
- Status banners
- Progress bars
- Step indicators
- Error displays

---

### ⚙️ Configuration & Setup Services

#### **FlowConfigurationService.ts** ⭐ V5 PRIMARY
**Purpose**: Flow configuration management  
**Features**:
- Credential management
- Environment setup
- Default configurations
- Config validation
- Import/export configurations

**Used By**: All V5 flows

---

#### **FlowConfigService.ts** ⭐ V5
**Purpose**: Flow-specific configuration  
**Features**:
- Per-flow settings
- Feature flags
- Advanced options
- Configuration presets

---

#### **flowConfigService.ts** (different from above)
**Purpose**: Alternative config service (legacy compatibility)

---

#### **flowCredentialService.ts** ⭐ V5
**Purpose**: Credential storage and retrieval  
**Features**:
- Secure credential storage
- Credential validation
- Multi-environment support
- Credential templates

---

### 🔍 Discovery & OIDC Services

#### **oidcDiscoveryService.ts** ⭐ V5 PRIMARY
**Purpose**: OIDC Discovery implementation (RFC 8414)  
**Features**:
- Automatic endpoint discovery from issuer URL
- PingOne environment ID extraction
- Discovery document parsing
- Endpoint validation
- Supported features detection
- Error handling and fallbacks

**Used By**: All flows with OIDC discovery support

---

#### **discoveryService.ts** (Legacy)
**Purpose**: Older discovery implementation  
**Status**: Being replaced by oidcDiscoveryService

---

### 🔐 Security & Token Services

#### **tokenIntrospectionService.ts** ⭐ V5
**Purpose**: OAuth token introspection (RFC 7662)  
**Features**:
- Token introspection API calls
- Token validation
- Token metadata display
- Active/inactive status

---

#### **tokenManagementService.ts** ⭐ V5
**Purpose**: Token storage and lifecycle management  
**Features**:
- Token storage
- Token refresh
- Token expiration tracking
- Token revocation

---

#### **tokenRefreshService.ts** ⭐ V5
**Purpose**: Automatic token refresh  
**Features**:
- Refresh token handling
- Automatic refresh before expiry
- Refresh error handling

---

#### **sessionTerminationService.ts** ⭐ V5
**Purpose**: Session and logout management  
**Features**:
- RP-initiated logout
- End session endpoint
- Session cleanup
- Post-logout redirect

---

#### **jwtAuthService.ts** ⭐ V5
**Purpose**: JWT-based client authentication  
**Features**:
- Private key JWT generation
- JWT signing
- Client assertion creation
- Algorithm support (RS256, ES256)

---

#### **jwksService.ts** ⭐ V5
**Purpose**: JSON Web Key Set management  
**Features**:
- JWKS fetching
- Key rotation
- Public key extraction
- Key validation

---

#### **keyStorageService.ts** ⭐ V5
**Purpose**: Secure key storage  
**Features**:
- Private key storage
- Public key management
- Key generation
- Key import/export

---

#### **rsaKeyGenerationService.ts** ⭐ V5
**Purpose**: RSA key pair generation  
**Features**:
- RSA key generation
- PKCS8 format
- PEM encoding
- Key size options (2048, 4096)

---

### 🔀 OAuth-Specific Services

#### **authorizationRequestService.ts** ⭐ V5
**Purpose**: Authorization request building  
**Features**:
- Authorization URL construction
- Parameter encoding
- State generation
- PKCE integration
- Response mode handling

---

#### **parService.ts** ⭐ V5
**Purpose**: Pushed Authorization Requests (RFC 9126)  
**Features**:
- PAR endpoint calls
- Request URI handling
- Timeout management
- Error handling

---

#### **deviceFlowService.ts** ⭐ V5
**Purpose**: Device Authorization Grant (RFC 8628)  
**Features**:
- Device code generation
- User code display
- Polling logic
- Timeout handling

---

#### **responseModeService.ts** ⭐ V5
**Purpose**: Response mode handling  
**Features**:
- Query response mode
- Fragment response mode
- Form post response mode
- Custom response modes (pi.flow)

---

#### **responseModeIntegrationService.ts** ⭐ V5
**Purpose**: Response mode integration with flows  
**Features**:
- Response mode selection
- Mode-specific UI
- Validation per mode

---

### 📊 Analytics & Display Services

#### **flowAnalyticsService.ts** ⭐ V5
**Purpose**: Flow usage analytics and tracking  
**Features**:
- Flow completion tracking
- Error tracking
- Performance metrics
- User journey analysis

---

#### **FlowWalkthroughService.ts** ⭐ V5
**Purpose**: Interactive flow walkthroughs  
**Features**:
- Step-by-step guides
- Interactive tutorials
- Progress tracking
- Educational content

---

#### **FlowInfoService.ts** ⭐ V5 PRIMARY
**Purpose**: Comprehensive flow information cards  
**Features**:
- Flow descriptions
- Security notes
- Use cases
- Implementation guidance
- Common issues and solutions
- Related flows
- Documentation links
- Searchable flow catalog

**Used By**: All V5 flows

---

#### **enhancedApiCallDisplayService.ts** ⭐ V5
**Purpose**: API call visualization with request/response  
**Features**:
- Request display (headers, body, method)
- Response display (status, headers, body)
- JSON formatting
- Copy to clipboard
- Syntax highlighting
- OAuth template generation

**Used By**: RAR Flow V5, other flows

---

#### **apiCallDisplayService.ts** (Legacy)
**Purpose**: Older API call display  
**Status**: Replaced by enhancedApiCallDisplayService

---

#### **apiCallDisplayService.example.ts**
**Purpose**: Example/template for API display service

---

### 📝 Code & Examples Services

#### **codeExamplesService.ts** ⭐ V5
**Purpose**: Code example generation for multiple languages  
**Features**:
- Language support (JavaScript, Python, Java, C#, cURL)
- OAuth flow examples
- OIDC examples
- Token exchange examples
- Syntax highlighting
- Copy to clipboard

---

### 🎨 Theme & UI Services

#### **themeService.ts** ⭐ V5
**Purpose**: Theme management and customization  
**Features**:
- Light/dark mode
- Color schemes
- Custom themes
- Theme persistence

---

#### **flowThemeService.ts** ⭐ V5
**Purpose**: Flow-specific theming  
**Features**:
- Per-flow color schemes
- Step colors
- Status colors
- Brand colors

---

### 🔧 Utility Services

#### **flowCopyService.ts** ⭐ V5
**Purpose**: Copy-to-clipboard functionality  
**Features**:
- Copy text
- Copy code blocks
- Copy URLs
- Copy tokens
- Success feedback

---

#### **flowValidationService.ts** ⭐ V5
**Purpose**: Flow step validation logic  
**Features**:
- Required field validation
- Step completion checks
- Configuration validation
- Error messages
- Validation rules per flow type

---

#### **flowFactory.ts** ⭐ V5
**Purpose**: Factory pattern for flow creation  
**Features**:
- Dynamic flow instantiation
- Flow type detection
- Default configuration
- Flow registration

---

### ⚙️ Configuration & System Services

#### **config.ts** ⭐ V5
**Purpose**: Global application configuration  
**Features**:
- Environment settings
- Feature flags
- API endpoints
- Default values

---

#### **pingoneConfigService.ts** ⭐ V5
**Purpose**: PingOne-specific configuration  
**Features**:
- Environment ID management
- Application settings
- PingOne API integration
- Region handling

---

#### **pingOneAppCreationService.ts** ⭐ V5
**Purpose**: PingOne application creation wizard  
**Features**:
- Application setup
- Credential generation
- Configuration templates
- Setup validation

---

## 📈 Service Usage Statistics

### Most Used Services (V5)
1. **flowLayoutService.ts** - Used by 15+ flows
2. **FlowInfoService.ts** - Used by 12+ flows  
3. **flowHeaderService.tsx** - Used by all pages
4. **FlowControllerService.ts** - Used by 8+ flows
5. **oidcDiscoveryService.ts** - Used by 10+ flows

### Service Categories
- **Layout & UI**: 6 services
- **Flow Management**: 7 services
- **Configuration**: 5 services
- **Discovery & OIDC**: 2 services
- **Security & Tokens**: 8 services
- **OAuth-Specific**: 5 services
- **Analytics & Display**: 5 services
- **Code & Examples**: 1 service
- **Theme & UI**: 2 services
- **Utilities**: 3 services
- **System**: 3 services

---

## 🔄 Service Evolution

### V3 → V4 → V5 → V6 Progression

**V3 (Legacy)**
- Individual styled components in each flow
- Duplicated code
- No standardization

**V4 (Transition)**
- Started extracting common components
- Basic service pattern
- Still much duplication

**V5 (Current - Production)**
- Fully service-based architecture
- Comprehensive service coverage
- Standardized patterns
- Reusable components
- Excellent documentation

**V6 (Next Generation - Planned)**
- Enhanced integration (FlowHeader in pageLayoutService)
- Prevented render loops (shallowEqual utility)
- Controlled components everywhere
- Even more type safety
- Better performance
- Single source of truth for dimensions

---

## 🚀 Migration Path

### From V4 to V5
- Replace inline styles with `FlowLayoutService`
- Use `FlowControllerService` for state management
- Adopt `FlowInfoService` for flow cards
- Switch to `oidcDiscoveryService` for discovery

### From V5 to V6 (When Available)
- Replace `flowLayoutService` imports with `pageLayoutService`
- Use integrated FlowHeader (no separate import needed)
- Apply `shallowEqual` guards for state updates
- Convert to controlled components
- Use new dimension standards (64rem/72rem)

---

## 📚 Documentation

### Service Documentation Files
- **README.md** - General services overview
- **README_CodeExamples.md** - Code examples service guide
- **RESPONSE_MODE_INTEGRATION_GUIDE.md** - Response mode integration
- **flowCompletionIntegrationGuide.md** - Flow completion guide

---

## ✅ Service Quality Standards

### All V5 Services Follow:
- ✅ TypeScript with proper types
- ✅ Comprehensive JSDoc comments
- ✅ Export both class and default
- ✅ Static methods for stateless services
- ✅ Instance methods for stateful services
- ✅ Error handling
- ✅ Validation logic
- ✅ Unit test coverage (where applicable)

### V6 Services Will Add:
- ✅ Memoization where appropriate
- ✅ Controlled component patterns
- ✅ Shallow equality guards
- ✅ No setState during render
- ✅ Minimal dependency arrays
- ✅ Performance optimizations

---

## 🎯 Service Architecture Principles

### Design Patterns Used
1. **Service Pattern**: Static utility methods
2. **Factory Pattern**: Dynamic object creation
3. **Controller Pattern**: Flow orchestration
4. **Facade Pattern**: Simplified interfaces
5. **Strategy Pattern**: Different flow strategies

### Best Practices
- **Single Responsibility**: Each service does one thing well
- **DRY**: Don't repeat yourself
- **SOLID**: Follow SOLID principles
- **Type Safety**: Full TypeScript support
- **Documentation**: Comprehensive docs
- **Testing**: Unit test coverage
- **Versioning**: Clear version progression

---

## 🔍 Finding the Right Service

### By Purpose
- **Need page layout?** → `flowLayoutService.ts`
- **Need headers?** → `flowHeaderService.tsx`
- **Need discovery?** → `oidcDiscoveryService.ts`
- **Need tokens?** → `tokenManagementService.ts`
- **Need validation?** → `flowValidationService.ts`
- **Need API display?** → `enhancedApiCallDisplayService.ts`
- **Need flow info?** → `FlowInfoService.ts`
- **Need code examples?** → `codeExamplesService.ts`

### By Flow Type
- **Authorization Code** → FlowControllerService, flowLayoutService
- **Implicit** → FlowControllerService, flowLayoutService, flowUIService
- **Device Code** → deviceFlowService, flowLayoutService
- **Hybrid** → FlowControllerService, flowStepService
- **PAR** → parService, authorizationRequestService

---

## 🎓 Learning Path

### New Developer Onboarding
1. Start with `flowLayoutService.ts` (understand layouts)
2. Read `flowHeaderService.tsx` (headers everywhere)
3. Study `FlowInfoService.ts` (flow information)
4. Learn `FlowControllerService.ts` (flow orchestration)
5. Explore `oidcDiscoveryService.ts` (discovery pattern)
6. Review any V5 flow implementation

---

**Total Services Documented**: 47+ services  
**Ready for Production**: ✅ V5 Services  
**In Development**: 🔨 V6 Services (needs rebuild)  
**Last Inventory**: October 7, 2025

CleanShot 2025-10-07 at 07.13.15.png