# V6 Services Registry

**Created**: October 7, 2025  
**Status**: ✅ Restored and Active  
**Purpose**: Track all V6 services and their integration

---

## ✅ V6 Services - Restored & Active

### Core V6 Services

#### 1. **comprehensiveCredentialsService.tsx** ⭐ NEW V6 SERVICE
**Status**: ✅ Created  
**Purpose**: All-in-one configuration service combining OIDC Discovery, Credentials Input, and PingOne Advanced Configuration

**Features**:
- OIDC Discovery with comprehensive provider support
- Basic credentials management (Environment ID, Client ID, Client Secret, Scopes)
- PingOne Advanced Configuration with collapsible sections
- Unified configuration experience
- Reusable across all OAuth/OIDC flows
- Configurable title, subtitle, and advanced settings visibility

**Props**:
```typescript
{
  // Discovery props
  onDiscoveryComplete?: (result: DiscoveryResult) => void;
  initialDiscoveryInput?: string;
  discoveryPlaceholder?: string;
  showProviderInfo?: boolean;

  // Credentials props
  environmentId?: string;
  clientId?: string;
  clientSecret?: string;
  scopes?: string;
  postLogoutRedirectUri?: string;
  onEnvironmentIdChange?: (newEnvId: string) => void;
  onClientIdChange?: (newClientId: string) => void;
  onClientSecretChange?: (newSecret: string) => void;
  onScopesChange?: (newScopes: string) => void;
  onPostLogoutRedirectUriChange?: (newUri: string) => void;
  onSave?: () => void;
  hasUnsavedChanges?: boolean;
  isSaving?: boolean;
  requireClientSecret?: boolean;

  // PingOne Advanced Configuration props
  pingOneAppState?: PingOneApplicationState;
  onPingOneAppStateChange?: (newState: PingOneApplicationState) => void;

  // Service configuration
  title?: string;
  subtitle?: string;
  showAdvancedConfig?: boolean;
  defaultCollapsed?: boolean;
}
```

**Used By**:
- **V6 Flows**: OIDCAuthorizationCodeFlowV6 (1 usage - replaces 3 separate components)
- **Future**: All OAuth/OIDC flows can use this service

**Benefits**:
- ✅ Single service for complete configuration
- ✅ Reduces code duplication across flows
- ✅ Consistent UX across all flows
- ✅ Easy to maintain and update
- ✅ Configurable for different use cases

#### 2. **copyButtonService.tsx** ⭐ NEW V6 SERVICE
**Status**: ✅ Created  
**Purpose**: Standardized copy button service with black popup and green checkmark feedback

**Features**:
- Black tooltip popup that says "Copy item" on hover
- Green "Copied!" message with checkmark when clicked
- Multiple size variants (sm, md, lg)
- Multiple style variants (primary, secondary, outline)
- Smooth animations and transitions
- Accessible with ARIA labels
- Fallback for older browsers without clipboard API
- Pre-configured variants for common use cases (identifier, url, token)

**Props**:
```typescript
{
  text: string;           // Text to copy
  label?: string;         // Label for tooltip (default: 'Copy')
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
  showLabel?: boolean;    // Show label text on button
  className?: string;
}
```

**Usage Examples**:
```typescript
// Basic usage
<CopyButtonService text="environment-id-123" label="Environment ID" />

// Pre-configured variants
{CopyButtonVariants.identifier(envId, 'Environment ID')}
{CopyButtonVariants.url(url, 'Authorization URL')}
{CopyButtonVariants.token(token, 'Access Token')}
```

**Used By**:
- **V6 Flows**: ComprehensiveCredentialsService (Environment ID copy button)
- **Future**: All flows can use this for copying tokens, URLs, IDs, etc.

**Benefits**:
- ✅ Consistent copy UX across entire application
- ✅ Clear visual feedback (black → green)
- ✅ Accessible and keyboard-friendly
- ✅ Works on all browsers
- ✅ Easy to integrate anywhere

#### 3. **collapsibleHeaderService.tsx** ⭐ V6 SERVICE
**Status**: ✅ Restored & Enhanced  
**Purpose**: Consistent collapsible headers with blue gradient background and white arrows

**Features**:
- Blue gradient header with hover effects
- White arrow indicators (→ right when collapsed, ↓ down when expanded)
- White circle border around arrows for enhanced visibility on white backgrounds
- Subtle shadow effects for depth
- Smooth expand/collapse animations
- Controlled and uncontrolled component modes
- Prevents infinite render loops
- ARIA accessible
- Icon + title + subtitle layout
- Fixed arrow rotation (no more pointing up)

**Props**:
```typescript
{
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  defaultCollapsed?: boolean;
  collapsed?: boolean;        // For controlled mode
  onToggle?: () => void;      // For controlled mode
  showArrow?: boolean;
  variant?: 'default' | 'compact' | 'large';
}
```

**Used By** (25+ pages, 330+ usages):
- **V5 Flows**: RedirectlessFlow (23), OIDC Device Auth (21), OIDC Auth Code (21), OAuth Implicit (21), OIDC Hybrid (17), Device Auth (15), PAR (11), Client Credentials (11), JWT Bearer (5), MFA (3)
- **V6 Flows**: OAuthAuthorizationCodeFlowV6 (23)
- **Core Pages**: AIGlossary (13 categories), Dashboard (12), AIAgentOverview (13), InteractiveFlowDiagram (11), Configuration (11 - upgraded Oct 7)
- **Training/Config**: OAuthOIDCTraining (9), AdvancedConfiguration (7), SDKSampleApp (5), InteractiveTutorials (5), OIDCSessionManagement (3)
- **Other**: TokenManagement (1), OAuth21 (1)

**Fixed Issues**:
- ✅ Prevented "Maximum update depth exceeded" errors
- ✅ Added controlled component support
- ✅ Stable effect dependencies

---

#### 2. **shallowEqual.ts** ⭐ V6 UTILITY
**Status**: ✅ Restored  
**Purpose**: Utility for shallow equality comparison to prevent unnecessary re-renders

**Functions**:
```typescript
// Compare two objects/arrays shallowly
shallowEqual(a: any, b: any): boolean

// Set state only if changed
setIfChanged<T>(setter, next: T): void
```

**Used By**:
- PingOneApplicationConfig (prevents prop-to-state loops)
- Any component needing to guard state updates

**Purpose**: Part of React "Maximum update depth exceeded" fix strategy

---

### Integration with Existing V5 Services

The V6 services integrate seamlessly with existing V5 services:

#### **flowLayoutService.ts** (V5)
**Status**: ✅ Active  
**Purpose**: Page layout and dimensions  
**Features**:
- Container styles (max-width: 64rem)
- Content wrapper
- Main card
- Step headers
- Responsive breakpoints

**Note**: V6 services work alongside V5 layout service

---

#### **flowHeaderService.tsx** (V5)
**Status**: ✅ Active  
**Purpose**: Standardized flow headers

**Used By**: All pages (Dashboard, Configuration, all flows)

---

## 📊 Dashboard Integration

The Dashboard now uses collapsibleHeaderService for all 5 sections:

| Section | Icon | Default State | Purpose |
|---------|------|---------------|---------|
| System Status | 🖥️ FiServer | Expanded | Server health monitoring |
| V5 Flow Credential Status | 🔑 FiKey | Expanded | Credential configuration status |
| Available API Endpoints | 🔗 FiLink | **Collapsed** | Backend API documentation |
| Quick Access Flows | ⚡ FiZap | Expanded | Flow navigation shortcuts |
| Recent Activity | 📊 FiActivity | Expanded | Activity timeline |

---

## 📊 Configuration Integration

The Configuration page uses collapsibleHeaderService for all 5 sections:

| Section | Icon | Default State | Purpose |
|---------|------|---------------|---------|
| Application Information | 📦 FiPackage | **Collapsed** | Version and requirements |
| Quick Start Setup | 🖥️ FiTerminal | Expanded | Setup instructions |
| Alternative Startup Options | 🌐 FiGlobe | Expanded | Different startup methods |
| Troubleshooting | ℹ️ FiInfo | **Collapsed** | Common issues and solutions |
| Additional Resources | 🔗 FiExternalLink | **Collapsed** | External links |

---

## 🎯 V6 Service Architecture Principles

### Design Goals
1. **Consistency**: Same UI/UX across all pages
2. **Performance**: Prevent render loops and unnecessary re-renders
3. **Maintainability**: Single source of truth for common patterns
4. **Type Safety**: Full TypeScript support
5. **Accessibility**: ARIA attributes and keyboard navigation

### Anti-Patterns Prevented
- ❌ No setState during render
- ❌ No unstable effect dependencies
- ❌ No prop-to-state sync loops
- ❌ No service mutations in render
- ❌ No unguarded state updates

### Best Practices
- ✅ Use `useMemo` for derived values
- ✅ Use `useCallback` for event handlers
- ✅ Guard state updates with `shallowEqual`
- ✅ Controlled components for complex state
- ✅ Minimal effect dependencies

---

## 🚀 Usage Examples

### Collapsible Section (Uncontrolled)
```typescript
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
import { FiSettings } from 'react-icons/fi';

<CollapsibleHeader
  title="Settings"
  subtitle="Configure your application"
  icon={<FiSettings />}
  defaultCollapsed={false}
>
  {/* Your content here */}
</CollapsibleHeader>
```

### Collapsible Section (Controlled)
```typescript
const [collapsed, setCollapsed] = useState(false);

<CollapsibleHeader
  title="Settings"
  subtitle="Configure your application"
  icon={<FiSettings />}
  collapsed={collapsed}
  onToggle={() => setCollapsed(!collapsed)}
>
  {/* Your content here */}
</CollapsibleHeader>
```

### With State Management
```typescript
const [sections, setSections] = useState({
  section1: false,
  section2: true,
});

const toggleSection = useCallback((key: keyof typeof sections) => {
  setSections(prev => ({ ...prev, [key]: !prev[key] }));
}, []);

<CollapsibleHeader
  title="Section 1"
  collapsed={sections.section1}
  onToggle={() => toggleSection('section1')}
>
  {/* Content */}
</CollapsibleHeader>
```

---

## ✅ Quality Checklist

All V6 services meet these standards:

- [x] TypeScript with proper types
- [x] JSDoc comments for functions
- [x] No linter errors
- [x] No React warnings
- [x] Prevents infinite loops
- [x] Memoized where appropriate
- [x] Accessible (ARIA attributes)
- [x] Responsive design
- [x] Consistent styling
- [x] Service pattern architecture

---

## 📈 Impact Metrics

### Code Reduction
- **Before**: Each page implemented own collapsible logic (~50 lines each)
- **After**: Import and use CollapsibleHeader (~10 lines)
- **Savings**: ~40 lines per section per page

### Pages Updated
- ✅ Dashboard (5 sections collapsified)
- ✅ Configuration (5 sections collapsified)
- 🎯 OAuthAuthorizationCodeFlowV6 (when rebuilt)

### Total Sections Collapsible
- **Current**: 10 sections across 2 pages
- **Potential**: 50+ sections across all pages

---

## 🔄 Service Dependencies

```
Dashboard & Configuration
├── collapsibleHeaderService (V6)
│   └── Uses controlled component pattern
├── flowHeaderService (V5)
│   └── Page headers
└── flowLayoutService (V5)
    └── Page dimensions and containers
```

---

## 🎓 Developer Guide

### Adding Collapsible Sections to a Page

**Step 1**: Import the service
```typescript
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
import { FiSettings } from 'react-icons/fi';
```

**Step 2**: Add state management
```typescript
const [collapsedSections, setCollapsedSections] = useState({
  section1: false,
  section2: true,
});

const toggleSection = useCallback((key: keyof typeof collapsedSections) => {
  setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));
}, []);
```

**Step 3**: Wrap your content
```typescript
<CollapsibleHeader
  title="Your Section Title"
  subtitle="Description of the section"
  icon={<FiSettings />}
  collapsed={collapsedSections.section1}
  onToggle={() => toggleSection('section1')}
>
  {/* Your existing content */}
</CollapsibleHeader>
```

---

## 🔍 **stepValidationService.tsx** (V6)

**Status**: ✅ Active  
**Purpose**: Reusable step validation service with modal integration

### Features
- Configurable validation rules for any step
- Toast notifications for validation errors
- Modal display with detailed error messages
- Prevents navigation when validation fails
- Reusable across different flows and steps
- Built-in validation rules for common scenarios

### Components
- `StepValidationModal`: Modal component for displaying validation errors
- `useStepValidation`: Hook for managing validation state and logic
- `StepValidationService`: Service with predefined validation rule creators

### Usage Example
```typescript
const { validateAndProceed, StepValidationModal } = useStepValidation();

const handleNext = () => {
  const validationRules = StepValidationService.createStep0ValidationRules(credentials);
  const config = {
    stepIndex: 0,
    stepName: 'Introduction & Setup',
    rules: validationRules
  };

  validateAndProceed(config, () => {
    // Proceed to next step only if validation passes
    setCurrentStep(prev => prev + 1);
  });
};

// In JSX
return (
  <>
    {/* Your component content */}
    {StepValidationModal}
  </>
);
```

### Predefined Validation Rules
- `createStep0ValidationRules()`: Environment ID, Client ID, Client Secret, Redirect URI
- `createPKCEValidationRules()`: Code Verifier, Code Challenge
- `createAuthorizationValidationRules()`: Authorization URL, Code Verifier

### Benefits
- ✅ Consistent validation UX across all flows
- ✅ Reusable across different flows and steps
- ✅ Prevents invalid navigation
- ✅ Clear error messaging with toast + modal
- ✅ Stops user on current step until validation passes

---

## 🔐 **pkceService.tsx** (V6)

**Status**: ✅ Active  
**Purpose**: Comprehensive PKCE (Proof Key for Code Exchange) parameter generation and management

### Features
- Secure code verifier and challenge generation
- Visual PKCE parameter display with show/hide functionality
- Copy buttons for code verifier and challenge
- Loading states and error handling
- Educational information about PKCE security
- Reusable across all OAuth/OIDC flows requiring PKCE
- Programmatic PKCE utilities

### Components
- `PKCEService`: Main component for PKCE parameter management
- `PKCEServiceUtils`: Utility functions for programmatic PKCE operations
- `PKCECodes`: TypeScript interface for PKCE data structure

### Usage Example
```typescript
import PKCEService from '../services/pkceService';

<PKCEService
  value={controller.pkceCodes}
  onChange={(codes) => controller.setPkceCodes(codes)}
  onGenerate={controller.generatePkceCodes}
  isGenerating={false}
  showDetails={true}
  title="Generate PKCE Codes"
  subtitle="Create secure code verifier and challenge"
/>
```

### Props
```typescript
interface PKCEServiceProps {
  value: PKCECodes;
  onChange: (codes: PKCECodes) => void;
  onGenerate?: () => Promise<void>;
  isGenerating?: boolean;
  showDetails?: boolean;
  title?: string;
  subtitle?: string;
}
```

### Utility Functions
- `PKCEServiceUtils.generatePKCECodes()`: Programmatic generation
- `PKCEServiceUtils.validatePKCECodes()`: Validation
- `PKCEServiceUtils.verifyCodeChallenge()`: Challenge verification

### Benefits
- ✅ Secure PKCE parameter generation using crypto.subtle
- ✅ User-friendly interface with educational content
- ✅ Consistent copy functionality with visual feedback
- ✅ Reusable across all OAuth/OIDC flows
- ✅ Built-in security best practices and validation

---

## 🐛 Common Issues & Solutions

### Issue: "Maximum update depth exceeded"
**Solution**: Use controlled mode with `useCallback` for toggleSection

### Issue: Section doesn't remember state
**Solution**: Use `defaultCollapsed` for uncontrolled mode or manage state in parent

### Issue: Icon not showing
**Solution**: Import icon from `react-icons/fi` and pass as JSX element

### Issue: Double borders
**Solution**: Remove border/shadow from inner cards:
```typescript
<Card style={{ border: 'none', boxShadow: 'none', borderRadius: 0 }}>
```

---

**Last Updated**: October 7, 2025  
**Status**: ✅ Production Ready  
**Maintained By**: V6 Architecture Team

