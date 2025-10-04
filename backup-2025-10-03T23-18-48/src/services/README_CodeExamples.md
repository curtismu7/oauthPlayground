# Code Examples Service

A comprehensive service for displaying language-specific code examples for OAuth 2.0 and OpenID Connect flows.

## Features

- **Multi-language Support**: JavaScript, TypeScript, Go, Ruby, Python
- **Flow-specific Examples**: Authorization Code, Implicit, Client Credentials, Device Authorization
- **Interactive Components**: Language selection, copy to clipboard, download code
- **Configurable**: Customize base URLs, client credentials, scopes
- **TypeScript Support**: Fully typed with comprehensive interfaces

## Quick Start

### 1. Basic Usage

```tsx
import { CodeExamplesDisplay } from '../components/CodeExamplesDisplay';

function MyFlowStep() {
  return (
    <CodeExamplesDisplay
      flowType="authorization-code"
      stepId="step1"
      config={{
        baseUrl: 'https://auth.pingone.com',
        clientId: 'your-client-id',
        clientSecret: 'your-client-secret',
        redirectUri: 'https://your-app.com/callback',
        scopes: ['openid', 'profile', 'email'],
        environmentId: 'your-environment-id',
      }}
    />
  );
}
```

### 2. Inline Integration

```tsx
import { CodeExamplesInline } from '../components/CodeExamplesInline';

function MyFlowStep() {
  return (
    <div>
      <h3>Step 1: Generate Authorization URL</h3>
      <p>Your step content here...</p>
      
      <CodeExamplesInline
        flowType="authorization-code"
        stepId="step1"
        config={flowConfig}
        compact={true} // Collapsible view
      />
    </div>
  );
}
```

### 3. Using the Hook

```tsx
import { useCodeExamples } from '../hooks/useCodeExamples';

function MyFlowStep() {
  const {
    stepData,
    selectedLanguages,
    toggleLanguage,
    filteredExamples,
    isLoading,
    error
  } = useCodeExamples({
    flowType: 'authorization-code',
    stepId: 'step1',
    config: flowConfig,
    initialLanguages: ['javascript', 'typescript']
  });

  if (isLoading) return <div>Loading examples...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {/* Your custom UI using the hook data */}
    </div>
  );
}
```

## API Reference

### CodeExamplesService

Main service class for managing code examples.

```typescript
class CodeExamplesService {
  constructor(config?: Partial<CodeExamplesConfig>);
  
  // Get examples for a specific step
  getExamplesForStep(flowType: string, stepId: string): FlowStepCodeExamples | null;
  
  // Get all steps for a flow
  getAllStepsForFlow(flowType: string): FlowStepCodeExamples[];
  
  // Get supported languages
  getSupportedLanguages(): SupportedLanguage[];
  
  // Filter examples by language
  filterExamplesByLanguage(examples: CodeExample[], languages: SupportedLanguage[]): CodeExample[];
  
  // Update configuration
  updateConfig(config: Partial<CodeExamplesConfig>): void;
}
```

### Supported Flow Types

- `authorization-code`: OAuth 2.0 Authorization Code Flow
- `implicit`: OAuth 2.0 Implicit Flow
- `client-credentials`: OAuth 2.0 Client Credentials Flow
- `device-authorization`: OAuth 2.0 Device Authorization Flow

### Supported Languages

- `javascript`: JavaScript/Node.js examples
- `typescript`: TypeScript examples
- `go`: Go examples
- `ruby`: Ruby examples
- `python`: Python examples

### Configuration

```typescript
interface CodeExamplesConfig {
  baseUrl: string;           // OAuth server base URL
  clientId: string;          // OAuth client ID
  clientSecret: string;      // OAuth client secret
  redirectUri: string;       // OAuth redirect URI
  scopes: string[];          // OAuth scopes
  environmentId: string;     // PingOne environment ID
}
```

## Components

### CodeExamplesDisplay

Full-featured code examples display with language selection and copy/download functionality.

**Props:**
- `flowType: string` - The OAuth flow type
- `stepId: string` - The step identifier
- `config?: Partial<CodeExamplesConfig>` - Configuration object
- `className?: string` - CSS class name

### CodeExamplesInline

Compact, collapsible code examples component for embedding in flow steps.

**Props:**
- `flowType: string` - The OAuth flow type
- `stepId: string` - The step identifier
- `config?: Partial<CodeExamplesConfig>` - Configuration object
- `className?: string` - CSS class name
- `compact?: boolean` - Show compact preview (default: false)

## Hooks

### useCodeExamples

React hook for managing code examples state and interactions.

**Parameters:**
- `flowType: string` - The OAuth flow type
- `stepId: string` - The step identifier
- `config?: Partial<CodeExamplesConfig>` - Configuration object
- `initialLanguages?: SupportedLanguage[]` - Initially selected languages

**Returns:**
- `stepData: FlowStepCodeExamples | null` - Step data and examples
- `selectedLanguages: SupportedLanguage[]` - Currently selected languages
- `setSelectedLanguages: (languages: SupportedLanguage[]) => void` - Set selected languages
- `toggleLanguage: (language: SupportedLanguage) => void` - Toggle language selection
- `filteredExamples: CodeExample[]` - Examples filtered by selected languages
- `supportedLanguages: SupportedLanguage[]` - All supported languages
- `isLoading: boolean` - Loading state
- `error: string | null` - Error message

## Examples

### Adding to Existing Flow Component

```tsx
import { CodeExamplesInline } from '../components/CodeExamplesInline';

export const MyFlowStep = () => {
  const flowConfig = {
    baseUrl: 'https://auth.pingone.com',
    clientId: 'your-client-id',
    // ... other config
  };

  return (
    <div className="flow-step">
      <h3>Step 1: Generate Authorization URL</h3>
      <p>Create the authorization URL...</p>
      
      {/* Your existing step content */}
      <div className="step-content">
        {/* Your UI components */}
      </div>
      
      {/* Add code examples */}
      <CodeExamplesInline
        flowType="authorization-code"
        stepId="step1"
        config={flowConfig}
        compact={true}
      />
    </div>
  );
};
```

### Custom Implementation

```tsx
import { useCodeExamples } from '../hooks/useCodeExamples';

export const CustomCodeExamples = () => {
  const {
    stepData,
    selectedLanguages,
    toggleLanguage,
    filteredExamples
  } = useCodeExamples({
    flowType: 'authorization-code',
    stepId: 'step1',
    config: flowConfig
  });

  return (
    <div>
      <h3>{stepData?.stepName}</h3>
      
      {/* Language selector */}
      <div className="language-selector">
        {['javascript', 'typescript', 'go', 'ruby', 'python'].map(lang => (
          <button
            key={lang}
            onClick={() => toggleLanguage(lang as SupportedLanguage)}
            className={selectedLanguages.includes(lang as SupportedLanguage) ? 'active' : ''}
          >
            {lang}
          </button>
        ))}
      </div>
      
      {/* Display examples */}
      {filteredExamples.map((example, index) => (
        <div key={index} className="code-example">
          <h4>{example.title}</h4>
          <pre><code>{example.code}</code></pre>
        </div>
      ))}
    </div>
  );
};
```

## Styling

The components use styled-components and can be customized with CSS. All components accept a `className` prop for additional styling.

### CSS Custom Properties

```css
.code-examples-container {
  --primary-color: #3b82f6;
  --background-color: #ffffff;
  --border-color: #e5e7eb;
  --text-color: #374151;
  --code-background: #1f2937;
  --code-text: #f9fafb;
}
```

## Contributing

To add new languages or flow types:

1. Add the language to `SupportedLanguage` type
2. Create language-specific example functions in `codeExamplesService.ts`
3. Update the language display names and icons in components
4. Add tests for the new functionality

## License

MIT License - see LICENSE file for details.








