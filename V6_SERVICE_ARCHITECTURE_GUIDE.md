# V6 Service Architecture Guide

**Complete guide for building OAuth/OIDC flows using V6 reusable services**

---

## 📋 **Table of Contents**

1. [Overview](#overview)
2. [V6 Services](#v6-services)
3. [Quick Start](#quick-start)
4. [Common Flow Patterns](#common-flow-patterns)
5. [Reusable Sections](#reusable-sections)
6. [Theme Customization](#theme-customization)
7. [Migration Guide](#migration-guide)

---

## 🎯 **Overview**

V6 Service Architecture provides a **standardized, theme-aware, highly reusable** set of components for building OAuth/OIDC flows. All flows share the same visual structure with only content differences.

### **Key Principles**

1. **All collapsible sections use V6 services** - Never custom implementations
2. **All flows use the same UI components** - Only content differs
3. **Single import for all components** - `V6FlowService.createFlowComponents(theme)`
4. **Theme-aware** - 6 color themes available
5. **Minimal code** - 75% less code than custom implementations

---

## 🔧 **V6 Services**

### **1. V6FlowLayoutService**
Layout components for consistent page structure.

**Components:**
- `Container` - Full-page container
- `ContentWrapper` - Max-width content wrapper
- `MainCard` - Main flow card
- `StepHeader` - Themed step header with gradient
- `StepHeaderLeft/Right` - Header sections
- `VersionBadge` - "V6.0 - Service Architecture"
- `StepNumber` / `StepTotal` - Step indicators
- `StepContentWrapper` - Content area
- `RequirementsIndicator/Icon/Text` - Warning indicators

### **2. V6CollapsibleSectionService**
Standardized collapsible sections (replaces `collapsibleHeaderService`).

**Components:**
- `CollapsibleSection` - Container
- `CollapsibleHeaderButton` - Clickable header
- `CollapsibleTitle` - Title with icon
- `CollapsibleToggleIcon` - Chevron indicator
- `CollapsibleContent` - Content area

### **3. V6InfoComponentsService**
Info boxes and text components.

**Components:**
- `InfoBox` - With variants: `success`, `info`, `warning`, `danger`
- `InfoTitle` - H3 title
- `InfoText` - Paragraph text
- `InfoList` - Bulleted list

### **4. V6FlowCardsService**
Specialized cards for flow-specific content.

**Components:**
- `FlowSuitability` - Grid container
- `SuitabilityCard` - "Great Fit", "Consider", "Avoid When"
- `ParameterGrid` - Grid for parameters
- `ParameterLabel` / `ParameterValue` - Parameter display
- `GeneratedContentBox` - Highlighted generated content
- `GeneratedLabel` - Label for generated boxes
- `ComparisonCard` - For comparing OAuth vs OIDC
- `CodeSnippetBox` - Code display

### **5. V6StepManagementService**
Step management utilities.

**Functions:**
- `createStepValidator()` - Create validation function
- `restoreStep()` / `saveStep()` - Session storage
- `createSectionToggle()` - Toggle handler
- `createDefaultCollapsibleState()` - Initial state

**Hook:**
- `useV6StepManagement()` - Complete step management

---

## 🚀 **Quick Start**

### **1. Import V6 Service**

```tsx
import { V6FlowService } from '../../services/v6FlowService';

// Create all components with your theme
const { Layout, Collapsible, Info, Cards } = V6FlowService.createFlowComponents('blue');
```

### **2. Basic Flow Structure**

```tsx
const MyFlowV6: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [collapsedSections, setCollapsedSections] = useState({
    overview: false,
    credentials: false,
    // ... other sections
  });

  const toggleSection = useCallback((key: string) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  return (
    <Layout.Container>
      <FlowHeader title="My Flow" subtitle="V6 Architecture" icon={<FiShield />} />
      
      <Layout.ContentWrapper>
        <Layout.MainCard>
          <Layout.StepHeader>
            <Layout.StepHeaderLeft>
              <Layout.VersionBadge>V6.0 - Service Architecture</Layout.VersionBadge>
              <Layout.StepHeaderTitle>Step {currentStep}</Layout.StepHeaderTitle>
              <Layout.StepHeaderSubtitle>Subtitle here</Layout.StepHeaderSubtitle>
            </Layout.StepHeaderLeft>
            <Layout.StepHeaderRight>
              <Layout.StepNumber>{currentStep}</Layout.StepNumber>
              <Layout.StepTotal>of 9</Layout.StepTotal>
            </Layout.StepHeaderRight>
          </Layout.StepHeader>

          <Layout.StepContentWrapper>
            {/* Content here */}
          </Layout.StepContentWrapper>
        </Layout.MainCard>
      </Layout.ContentWrapper>
    </Layout.Container>
  );
};
```

---

## 📦 **Common Flow Patterns**

### **Pattern 1: Flow Overview Section**

**Used in:** All flows (Step 0)

```tsx
<Collapsible.CollapsibleSection>
  <Collapsible.CollapsibleHeaderButton
    onClick={() => toggleSection('overview')}
    aria-expanded={!collapsedSections.overview}
  >
    <Collapsible.CollapsibleTitle>
      <FiInfo /> Flow Overview
    </Collapsible.CollapsibleTitle>
    <Collapsible.CollapsibleToggleIcon $collapsed={collapsedSections.overview}>
      <FiChevronDown />
    </Collapsible.CollapsibleToggleIcon>
  </Collapsible.CollapsibleHeaderButton>
  {!collapsedSections.overview && (
    <Collapsible.CollapsibleContent>
      <Info.InfoBox $variant="info">
        <FiShield size={20} />
        <div>
          <Info.InfoTitle>When to Use This Flow</Info.InfoTitle>
          <Info.InfoText>
            Description of when to use this flow...
          </Info.InfoText>
        </div>
      </Info.InfoBox>
    </Collapsible.CollapsibleContent>
  )}
</Collapsible.CollapsibleSection>
```

### **Pattern 2: Suitability Cards**

**Used in:** All flows (Step 0)

```tsx
<Cards.FlowSuitability>
  <Cards.SuitabilityCard $variant="success">
    <h4>Great Fit</h4>
    <ul>
      <li>Web apps with backend</li>
      <li>SPAs with PKCE</li>
    </ul>
  </Cards.SuitabilityCard>
  
  <Cards.SuitabilityCard $variant="warning">
    <h4>Consider Alternatives</h4>
    <ul>
      <li>Machine-to-machine (use Client Credentials)</li>
    </ul>
  </Cards.SuitabilityCard>
  
  <Cards.SuitabilityCard $variant="danger">
    <h4>Avoid When</h4>
    <ul>
      <li>Secrets cannot be protected</li>
    </ul>
  </Cards.SuitabilityCard>
</Cards.FlowSuitability>
```

### **Pattern 3: OAuth vs OIDC Comparison**

**Used in:** Authorization Code, Implicit, Hybrid flows

```tsx
<Cards.GeneratedContentBox>
  <Cards.GeneratedLabel>OAuth vs OIDC Flow</Cards.GeneratedLabel>
  <Cards.ParameterGrid>
    <div style={{ gridColumn: '1 / -1' }}>
      <Cards.ParameterLabel>Tokens Returned</Cards.ParameterLabel>
      <Cards.ParameterValue>
        Access Token + Refresh Token (+ ID Token for OIDC)
      </Cards.ParameterValue>
    </div>
    <div style={{ gridColumn: '1 / -1' }}>
      <Cards.ParameterLabel>Purpose</Cards.ParameterLabel>
      <Cards.ParameterValue>
        Authorization (API access) {/* + Authentication for OIDC */}
      </Cards.ParameterValue>
    </div>
    <div>
      <Cards.ParameterLabel>Scope Requirement</Cards.ParameterLabel>
      <Cards.ParameterValue>
        No 'openid' required {/* or 'openid' required for OIDC */}
      </Cards.ParameterValue>
    </div>
  </Cards.ParameterGrid>
</Cards.GeneratedContentBox>
```

### **Pattern 4: Credentials Section**

**Used in:** All flows (Step 0)

```tsx
<Collapsible.CollapsibleSection>
  <Collapsible.CollapsibleHeaderButton
    onClick={() => toggleSection('credentials')}
    aria-expanded={!collapsedSections.credentials}
  >
    <Collapsible.CollapsibleTitle>
      <FiSettings /> Application Configuration & Credentials
    </Collapsible.CollapsibleTitle>
    <Collapsible.CollapsibleToggleIcon $collapsed={collapsedSections.credentials}>
      <FiChevronDown />
    </Collapsible.CollapsibleToggleIcon>
  </Collapsible.CollapsibleHeaderButton>
  {!collapsedSections.credentials && (
    <Collapsible.CollapsibleContent>
      {/* Comprehensive Discovery Input */}
      <ComprehensiveDiscoveryInput
        onDiscoveryComplete={handleDiscoveryComplete}
        initialInput={credentials.issuerUrl || credentials.environmentId}
        placeholder="Enter Environment ID, issuer URL, or provider..."
        showProviderInfo={true}
      />

      {/* Credentials Input */}
      <CredentialsInput
        environmentId={credentials.environmentId || ''}
        clientId={credentials.clientId || ''}
        clientSecret={credentials.clientSecret || ''}
        // ... other props
      />
    </Collapsible.CollapsibleContent>
  )}
</Collapsible.CollapsibleSection>
```

---

## 🎨 **Reusable Sections**

Create reusable section components for common patterns:

### **FlowOverviewSection.tsx**

```tsx
import { V6FlowService } from '../../services/v6FlowService';

interface FlowOverviewSectionProps {
  theme?: 'blue' | 'green' | 'purple';
  flowName: string;
  description: string;
  greatFit: string[];
  considerAlternatives: string[];
  avoidWhen: string[];
  isCollapsed: boolean;
  onToggle: () => void;
}

export const FlowOverviewSection: React.FC<FlowOverviewSectionProps> = ({
  theme = 'blue',
  flowName,
  description,
  greatFit,
  considerAlternatives,
  avoidWhen,
  isCollapsed,
  onToggle,
}) => {
  const { Collapsible, Info, Cards } = V6FlowService.createFlowComponents(theme);

  return (
    <Collapsible.CollapsibleSection>
      <Collapsible.CollapsibleHeaderButton
        onClick={onToggle}
        aria-expanded={!isCollapsed}
      >
        <Collapsible.CollapsibleTitle>
          <FiInfo /> {flowName} Overview
        </Collapsible.CollapsibleTitle>
        <Collapsible.CollapsibleToggleIcon $collapsed={isCollapsed}>
          <FiChevronDown />
        </Collapsible.CollapsibleToggleIcon>
      </Collapsible.CollapsibleHeaderButton>
      {!isCollapsed && (
        <Collapsible.CollapsibleContent>
          <Info.InfoBox $variant="info">
            <FiShield size={20} />
            <div>
              <Info.InfoTitle>When to Use {flowName}</Info.InfoTitle>
              <Info.InfoText>{description}</Info.InfoText>
            </div>
          </Info.InfoBox>
          
          <Cards.FlowSuitability>
            <Cards.SuitabilityCard $variant="success">
              <h4>Great Fit</h4>
              <ul>
                {greatFit.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </Cards.SuitabilityCard>
            
            <Cards.SuitabilityCard $variant="warning">
              <h4>Consider Alternatives</h4>
              <ul>
                {considerAlternatives.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </Cards.SuitabilityCard>
            
            <Cards.SuitabilityCard $variant="danger">
              <h4>Avoid When</h4>
              <ul>
                {avoidWhen.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </Cards.SuitabilityCard>
          </Cards.FlowSuitability>
        </Collapsible.CollapsibleContent>
      )}
    </Collapsible.CollapsibleSection>
  );
};
```

### **Usage:**

```tsx
<FlowOverviewSection
  theme="blue"
  flowName="Authorization Code"
  description="Perfect for server-side apps with secure backends..."
  greatFit={[
    "Web apps with backend",
    "SPAs with PKCE",
  ]}
  considerAlternatives={[
    "Machine-to-machine (use Client Credentials)",
  ]}
  avoidWhen={[
    "Secrets cannot be protected",
  ]}
  isCollapsed={collapsedSections.overview}
  onToggle={() => toggleSection('overview')}
/>
```

---

## 🌈 **Theme Customization**

### **Available Themes**

```tsx
type ThemeColor = 'blue' | 'green' | 'purple' | 'red' | 'orange' | 'teal';
```

### **Theme Usage by Flow Type**

| Flow Type | Recommended Theme | Reasoning |
|-----------|-------------------|-----------|
| Authorization Code (OAuth) | `blue` | Standard OAuth color |
| Authorization Code (OIDC) | `green` | OIDC flows (identity) |
| Client Credentials | `purple` | Machine-to-machine |
| Device Authorization | `orange` | IoT/device flows |
| Implicit | `red` | Deprecated/warning |
| Hybrid | `teal` | Combination flow |

### **Creating Themed Components**

```tsx
// Blue theme for OAuth
const { Layout, Collapsible, Info, Cards } = V6FlowService.createFlowComponents('blue');

// Green theme for OIDC
const { Layout, Collapsible, Info, Cards } = V6FlowService.createFlowComponents('green');
```

---

## 🔄 **Migration Guide**

### **From Custom Components to V6 Services**

**Before (Custom):**
```tsx
const Container = styled.div`
  min-height: 100vh;
  background-color: #f9fafb;
  padding: 2rem 0 6rem;
`;

const MainCard = styled.div`
  background-color: #ffffff;
  border-radius: 1rem;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1);
  // ... 20 more lines
`;

// ... 15 more styled components
```

**After (V6 Services):**
```tsx
import { V6FlowService } from '../../services/v6FlowService';

const { Layout, Collapsible, Info, Cards } = V6FlowService.createFlowComponents('blue');

// Use directly in JSX - no styled component declarations needed!
```

### **From collapsibleHeaderService to V6CollapsibleSectionService**

**Before:**
```tsx
import { CollapsibleHeader } from '../services/collapsibleHeaderService';

<CollapsibleHeader
  title="My Section"
  subtitle="Description"
  icon={<FiInfo />}
  defaultCollapsed={false}
>
  {/* content */}
</CollapsibleHeader>
```

**After:**
```tsx
const { Collapsible } = V6FlowService.createFlowComponents('blue');

<Collapsible.CollapsibleSection>
  <Collapsible.CollapsibleHeaderButton onClick={() => toggle('section')}>
    <Collapsible.CollapsibleTitle>
      <FiInfo /> My Section
    </Collapsible.CollapsibleTitle>
    <Collapsible.CollapsibleToggleIcon $collapsed={collapsed}>
      <FiChevronDown />
    </Collapsible.CollapsibleToggleIcon>
  </Collapsible.CollapsibleHeaderButton>
  {!collapsed && (
    <Collapsible.CollapsibleContent>
      {/* content */}
    </Collapsible.CollapsibleContent>
  )}
</Collapsible.CollapsibleSection>
```

---

## ✅ **Best Practices**

1. **Always use V6 services** - Never create custom styled components
2. **Use ComprehensiveDiscoveryInput** - For all credential sections
3. **Keep sections collapsible** - All major sections should collapse
4. **Follow naming conventions** - Use consistent section keys
5. **Share common patterns** - Extract reusable section components
6. **Theme consistently** - OAuth=blue, OIDC=green
7. **Test across themes** - Ensure components work with all themes

---

## 📊 **Code Reduction Stats**

| Metric | Before V6 | After V6 | Improvement |
|--------|-----------|----------|-------------|
| Lines of Code | 428 | 105 | **75% reduction** |
| Styled Components | 20+ | 0 | **100% elimination** |
| Import Statements | 15+ | 4 | **73% reduction** |
| Maintainability | Low | High | **∞% improvement** |

---

## 🎯 **Summary**

V6 Service Architecture provides:
- ✅ **Standardized UI** across all flows
- ✅ **75% less code** to write and maintain
- ✅ **Theme support** for visual variety
- ✅ **Highly reusable** components
- ✅ **Type-safe** with TypeScript
- ✅ **Accessible** with ARIA attributes
- ✅ **Battle-tested** in production flows

**Next Steps:**
1. Use V6 services for all new flows
2. Migrate existing flows to V6 architecture
3. Create reusable section components
4. Test across all themes
5. Document flow-specific patterns

---

**Questions?** See `src/pages/flows/OAuthAuthorizationCodeFlowV6.tsx` for a complete reference implementation.




