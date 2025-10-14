# FlowInfoService - Comprehensive Flow Information for V5 Flows

The FlowInfoService provides a comprehensive, reusable service for generating detailed flow information cards that can be used across all V5 flows. This service is designed to match the structure shown in your reference image and provides extensive information about each OAuth/OIDC flow.

## Features

- **Comprehensive Flow Information**: Detailed information about tokens, purpose, security, and use cases
- **Reusable Components**: Easy-to-use components that can be integrated into any V5 flow
- **Dynamic Configuration**: Support for custom flow configurations and templates
- **Rich UI Components**: Beautiful, collapsible information cards with icons and styling
- **TypeScript Support**: Full TypeScript support with comprehensive type definitions
- **Search and Filtering**: Built-in search and filtering capabilities for flows
- **Documentation Links**: Automatic generation of relevant documentation links
- **Common Issues & Solutions**: Built-in troubleshooting information for each flow

## Quick Start

### Basic Usage

```tsx
import EnhancedFlowInfoCard from '../components/EnhancedFlowInfoCard';

// Simple usage with default options
<EnhancedFlowInfoCard flowType="oauth-authorization-code" />

// With custom options
<EnhancedFlowInfoCard 
  flowType="oidc-authorization-code"
  showAdditionalInfo={true}
  showDocumentation={true}
  showCommonIssues={true}
  showImplementationNotes={true}
/>
```

### Using the Hook

```tsx
import { useFlowInfo } from '../hooks/useFlowInfo';

const MyComponent = () => {
  const {
    flowInfo,
    flowInfoCard,
    relatedFlows,
    commonIssues,
    implementationNotes,
    documentationLinks
  } = useFlowInfo('oauth-authorization-code', {
    showAdditionalInfo: true,
    showDocumentation: true,
    showCommonIssues: true,
    showImplementationNotes: true
  });

  // Use the flow information in your component
  return (
    <div>
      <h1>{flowInfo?.flowName}</h1>
      <p>{flowInfo?.purpose}</p>
      {/* ... */}
    </div>
  );
};
```

## Components

### EnhancedFlowInfoCard

The main component for displaying flow information cards.

**Props:**
- `flowType: string` - The type of flow (e.g., 'oauth-authorization-code')
- `showAdditionalInfo?: boolean` - Show additional information section (default: true)
- `showDocumentation?: boolean` - Show documentation links (default: true)
- `showCommonIssues?: boolean` - Show common issues and solutions (default: false)
- `showImplementationNotes?: boolean` - Show implementation notes (default: false)

### FlowInfoService

The core service for accessing flow information.

**Methods:**
- `getFlowInfo(flowType: string)` - Get detailed flow information
- `generateFlowInfoCard(flowType: string)` - Generate card data for display
- `getAvailableFlowTypes()` - Get all available flow types
- `getFlowsByCategory(category)` - Get flows by category
- `getFlowsByComplexity(complexity)` - Get flows by complexity
- `getFlowsBySecurityLevel(securityLevel)` - Get flows by security level
- `searchFlows(criteria)` - Search flows by multiple criteria
- `getRelatedFlows(flowType)` - Get related flows
- `getCommonIssues(flowType)` - Get common issues and solutions
- `getImplementationNotes(flowType)` - Get implementation notes
- `getDocumentationLinks(flowType)` - Get documentation links

### FlowInfoGenerator

Utility for creating custom flow information.

**Methods:**
- `generateFromTemplate(template)` - Generate from a template
- `generateCustomFlow(config)` - Generate custom flow information
- `generateCardData(flowInfo)` - Generate card data from flow info
- `createTemplate(pattern)` - Create a template for common patterns

## Available Flow Types

### Standard OAuth 2.0 Flows
- `oauth-authorization-code` - Authorization Code Flow
- `client-credentials` - Client Credentials Flow
- `device-code` - Device Authorization Flow
- `par` - Pushed Authorization Request (PAR)

### OIDC Flows
- `oidc-authorization-code` - OIDC Authorization Code Flow
- `oidc-ciba-v5` - OIDC CIBA Flow

### Experimental Flows
- `redirectless` - Redirectless Flow (Custom implementation)

## Flow Information Structure

Each flow includes:

### Basic Information
- **Flow Type**: OAuth 2.0 or OIDC
- **Flow Name**: Human-readable name
- **Flow Version**: Version identifier
- **Flow Category**: Standard, Experimental, Deprecated, or PingOne-specific

### Technical Details
- **Tokens Returned**: What tokens the flow provides
- **Purpose**: What the flow is used for
- **Spec Layer**: Which specification defines it
- **Nonce Requirement**: Whether nonce is required
- **Validation**: How to validate tokens

### Security Information
- **Security Level**: High, Medium, or Low
- **Security Notes**: Detailed security considerations
- **Complexity**: Simple, Moderate, or Complex
- **User Interaction**: Required, Optional, or None
- **Backend Required**: Whether a backend is needed

### Use Cases
- **Best Use Cases**: When to use this flow
- **Recommended For**: Specific scenarios
- **Not Recommended For**: When to avoid this flow

### Implementation Guidance
- **Implementation Notes**: Step-by-step guidance
- **Common Issues**: Known problems and solutions
- **Related Flows**: Similar or alternative flows
- **Documentation Links**: Official specifications and guides

## Customization

### Creating Custom Flows

```tsx
import { FlowInfoGenerator } from '../utils/FlowInfoGenerator';

const customFlow = FlowInfoGenerator.generateCustomFlow({
  flowType: 'oauth',
  flowName: 'Custom Flow',
  tokensReturned: 'Access Token + Custom Token',
  purpose: 'Custom authentication flow',
  specLayer: 'Custom implementation',
  nonceRequirement: 'Required',
  validation: 'Validate with custom endpoint',
  securityNotes: [
    '✅ Custom security implementation',
    'Requires custom validation logic'
  ],
  useCases: [
    'Custom authentication scenarios',
    'Specialized applications'
  ]
});
```

### Using Templates

```tsx
import { FlowInfoGenerator } from '../utils/FlowInfoGenerator';

// Create a template for authorization code pattern
const template = FlowInfoGenerator.createTemplate('authorization-code');

// Customize the template
template.flowName = 'Custom Authorization Code Flow';
template.tokensReturned = 'Access Token + Refresh Token + Custom Token';

// Generate flow info
const flowInfo = FlowInfoGenerator.generateFromTemplate(template);
```

## Integration with V5 Flows

### Replace Existing FlowInfoCard

```tsx
// Before
import FlowInfoCard from '../components/FlowInfoCard';
<FlowInfoCard flowInfo={getFlowInfo('oauth-authorization-code')!} />

// After
import EnhancedFlowInfoCard from '../components/EnhancedFlowInfoCard';
<EnhancedFlowInfoCard flowType="oauth-authorization-code" />
```

### Add to New V5 Flows

```tsx
import EnhancedFlowInfoCard from '../components/EnhancedFlowInfoCard';

const MyNewFlowV5 = () => {
  return (
    <div>
      <h1>My New Flow V5</h1>
      
      {/* Add comprehensive flow information */}
      <EnhancedFlowInfoCard 
        flowType="my-custom-flow"
        showAdditionalInfo={true}
        showDocumentation={true}
        showCommonIssues={true}
        showImplementationNotes={true}
      />
      
      {/* Rest of your flow implementation */}
    </div>
  );
};
```

## Styling and Theming

The components respect the UI settings context and support:
- **Color Schemes**: Blue, Green, Purple, Orange, Red
- **Font Sizes**: Small, Normal, Large
- **Collapsible State**: Expanded or Collapsed by default

## Examples

See `src/components/FlowInfoExample.tsx` for a comprehensive example showing all available flows and their information cards.

## Migration Guide

### From Existing FlowInfoCard

1. Replace `FlowInfoCard` import with `EnhancedFlowInfoCard`
2. Change `flowInfo` prop to `flowType` prop
3. Add any additional options as needed

```tsx
// Before
<FlowInfoCard flowInfo={getFlowInfo('oauth-authorization-code')!} />

// After
<EnhancedFlowInfoCard 
  flowType="oauth-authorization-code"
  showAdditionalInfo={true}
  showDocumentation={true}
/>
```

## Contributing

When adding new flows:

1. Add the flow configuration to `FlowInfoService.flowConfigs`
2. Include all required fields and optional enhancements
3. Add appropriate security notes and use cases
4. Include documentation links and common issues
5. Test with the `FlowInfoExample` component

## Support

For questions or issues with the FlowInfoService, please refer to the implementation files:
- `src/services/FlowInfoService.ts` - Core service
- `src/components/EnhancedFlowInfoCard.tsx` - UI component
- `src/utils/FlowInfoGenerator.ts` - Generator utilities
- `src/hooks/useFlowInfo.ts` - React hooks
