# PingOne OAuth/OIDC Sample Flows - Project Structure

## Overview
This is a comprehensive React + TypeScript application demonstrating OAuth 2.0 and OpenID Connect flows with PingOne integration.

## Root Directory Structure

### Configuration Files
- **package.json** - Node.js dependencies and scripts
- **vite.config.ts** - Vite build configuration
- **tsconfig.json** - TypeScript configuration
- **biome.json** - Code formatting/linting with Biome
- **playwright.config.ts** - E2E testing configuration
- **.env** - Environment variables (PingOne credentials)

### Key Directories
- **src/** - Main application source code
- **public/** - Static assets
- **docs/** - Documentation
- **tests/** - Test suites
- **scripts/** - Build and utility scripts
- **backups/** - Backup files
- **.kiro/** - Kiro AI assistant configuration

## Source Code Structure (`src/`)

### Core Application Files
- **main.tsx** - Application entry point
- **App.tsx** - Root component with routing
- **version.ts** - Version tracking

### Components (`src/components/`)
Organized into subdirectories:
- **callbacks/** - OAuth callback handlers
- **device/** - Device authorization flow components
- **display/** - Display/UI components
- **flow/** - Flow-specific components
- **layout/** - Layout components (Navbar, Sidebar, Footer)
- **mfa/** - Multi-factor authentication components
- **password-reset/** - Password reset flow components
- **RAR/** - Rich Authorization Requests components
- **response-modes/** - Response mode selectors
- **result-page/** - Result display components
- **steps/** - Step-by-step flow components
- **token/** - Token display and management
- **ui/** - Reusable UI components
- **worker/** - Worker token components

### Key Component Files
- **ComprehensiveCredentialsService.tsx** - Unified credential management (NEWLY FIXED)
- **CredentialsInput.tsx** - Credential input fields with edit capability
- **ComprehensiveDiscoveryInput.tsx** - OIDC discovery interface
- **PingOneApplicationPicker.tsx** - Application selection
- **SmartSpeakerDeviceFlow.tsx** - Device flow UI (NEWLY FIXED)
- **DynamicDeviceFlow.tsx** - Dynamic device type selector

### Pages (`src/pages/`)
Organized by feature:
- **flows/** - OAuth/OIDC flow implementations
  - AuthorizationCodeFlowV7.tsx
  - ImplicitFlowV7.tsx (NEWLY FIXED)
  - DeviceAuthorizationFlowV7.tsx
  - ClientCredentialsFlowV7.tsx
  - HybridFlowV7.tsx
  - CIBAFlowV7.tsx
  - etc.
- **callbacks/** - Callback handlers
- **docs/** - Documentation pages
- **learn/** - Educational content
- **security/** - Security features
- **user-guides/** - User documentation

### Services (`src/services/`)
Business logic and utilities:
- **comprehensiveCredentialsService.tsx** - Credential management (NEWLY FIXED)
- **comprehensiveDiscoveryService.ts** - OIDC discovery
- **callbackUriService.ts** - Callback URI management (NEWLY FIXED)
- **flowHeaderService.tsx** - Flow headers
- **flowCompletionService.tsx** - Flow completion handling
- **tokenIntrospectionService.ts** - Token introspection
- **pingOneApplicationService.ts** - PingOne app management
- **oidcDiscoveryService.ts** - OIDC discovery
- **deviceFlowService.ts** - Device authorization
- **codeGeneration/** - Code generation services
- **contracts/** - Service contracts
- **flowContext/** - Flow context management

### Hooks (`src/hooks/`)
Custom React hooks:
- **useImplicitFlowController.ts** - Implicit flow logic (NEWLY FIXED)
- **useAuthorizationCodeFlowController.ts** - Authorization code flow
- **useDeviceAuthorizationFlow.ts** - Device flow
- **useClientCredentialsFlowController.ts** - Client credentials
- **useHybridFlowController.ts** - Hybrid flow
- **useCibaFlow.ts** - CIBA flow
- **useCredentialBackup.ts** - Credential backup
- **useFlowInfo.ts** - Flow information

### Contexts (`src/contexts/`)
React context providers:
- **NewAuthContext.tsx** - Authentication state
- **NotificationSystem.tsx** - Toast notifications
- **PageStyleContext.tsx** - Page styling
- **UISettingsContext.tsx** - UI preferences

### Utils (`src/utils/`)
Utility functions:
- **credentialManager.ts** - Credential storage
- **tokenStorage.ts** - Token management
- **oauth.ts** - OAuth utilities
- **jwt.ts** - JWT handling
- **pkceService.tsx** - PKCE generation
- **errorHandler.ts** - Error handling
- **logger.ts** - Logging
- **v4ToastMessages.ts** - Toast notifications

### Types (`src/types/`)
TypeScript type definitions:
- **auth.ts** - Authentication types
- **credentials.ts** - Credential types
- **oauth.ts** - OAuth types
- **flowTypes.ts** - Flow types
- **token-inspector.ts** - Token types

### Styles (`src/styles/`)
- **global.ts** - Global styles
- **enhanced-flow.css** - Flow-specific styles
- **ui-settings.css** - UI settings styles

## Recent Fixes Applied

### 1. SmartSpeakerDeviceFlow.tsx
- **Issue**: Missing FiHome and FiSettings imports
- **Fix**: Added imports from react-icons/fi
- **Status**: ✅ Fixed

### 2. comprehensiveCredentialsService.tsx
- **Issue**: Missing credential input fields (not editable)
- **Fix**: Added CredentialsInput component with proper onChange handlers
- **Status**: ✅ Fixed
- **Impact**: ALL flows using this service now have editable credentials

### 3. callbackUriService.ts
- **Issue**: Method name mismatch (getRedirectUriForFlow vs getCallbackUriForFlow)
- **Fix**: Corrected method call in comprehensiveCredentialsService
- **Status**: ✅ Fixed

### 4. useImplicitFlowController.ts
- **Issue**: Strict validation throwing errors when credentials not yet populated
- **Fix**: Made validation more lenient, allows partial saves
- **Status**: ✅ Fixed

## Key Features

### OAuth/OIDC Flows Supported
1. Authorization Code Flow (with PKCE)
2. Implicit Flow (OAuth + OIDC variants)
3. Hybrid Flow
4. Device Authorization Flow (RFC 8628)
5. Client Credentials Flow
6. CIBA (Client Initiated Backchannel Authentication)
7. Resource Owner Password Credentials
8. JWT Bearer Flow
9. SAML Bearer Flow
10. Token Introspection
11. Token Revocation

### Advanced Features
- OIDC Discovery
- PAR (Pushed Authorization Requests)
- RAR (Rich Authorization Requests)
- DPoP (Demonstrating Proof of Possession)
- JWKS management
- MFA integration
- Worker token management
- Config checker
- Token introspection
- Security analytics

## Development Workflow

### Running the Application
```bash
npm install
npm run dev
```

### Building for Production
```bash
npm run build
```

### Running Tests
```bash
npm test
npm run test:e2e
```

## Architecture Patterns

### Service-Oriented Architecture
- Services handle business logic
- Components focus on UI
- Hooks manage state and side effects
- Contexts provide global state

### Component Organization
- Atomic design principles
- Reusable components in `src/components/ui/`
- Feature-specific components in subdirectories
- Flow components in `src/pages/flows/`

### State Management
- React Context for global state
- Custom hooks for local state
- Service layer for data persistence

## Configuration

### Environment Variables (.env)
```
VITE_PINGONE_ENVIRONMENT_ID=
VITE_PINGONE_CLIENT_ID=
VITE_PINGONE_CLIENT_SECRET=
VITE_PINGONE_REGION=
```

### PingOne Setup Required
- PingOne environment
- OAuth/OIDC applications configured
- Redirect URIs whitelisted
- Worker application for management API

## Documentation

### Key Documentation Files
- **README.md** - Project overview
- **docs/** - Detailed documentation
- **CHANGELOG.md** - Version history
- **COMPREHENSIVE_CREDENTIALS_FIX.md** - Recent credential fix details

## Testing

### Test Structure
- **tests/unit/** - Unit tests
- **tests/integration/** - Integration tests
- **e2e/** - End-to-end tests with Playwright
- **puppeteer-tests/** - Puppeteer-based tests

## Build & Deployment

### Build Output
- **dist/** - Production build
- Optimized with Vite
- Code splitting enabled
- Lazy loading for routes

### Deployment Targets
- Vercel (configured)
- Netlify (configured)
- Static hosting compatible

## Notes

### Recent Changes
- Fixed credential editing across all flows
- Improved error handling in implicit flow
- Fixed import issues in device flow components
- Enhanced callback URI service

### Known Issues
- Vite HMR 404 errors (temporary, resolve on reload)
- Some TypeScript warnings (non-blocking)

### Future Improvements
- Complete field rules system implementation
- Enhanced AI assistant integration
- Additional flow variants
- Improved documentation
