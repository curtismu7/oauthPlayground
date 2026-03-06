# Developer Guide

## 🎯 Overview

Welcome to the OAuth Playground Developer Guide! This comprehensive guide will help you understand, contribute to, and extend the OAuth Playground application.

## 🏗️ Architecture Overview

### Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Styled Components with CSS-in-JS
- **State Management**: React Context + Custom Hooks
- **Build Tool**: Vite with advanced optimizations
- **Testing**: Vitest + Jest for unit tests
- **Code Quality**: ESLint, Biome, and TypeScript strict mode

### Project Structure

```
oauth-playground/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── flow/           # Flow-specific components
│   │   ├── token/          # Token display components
│   │   ├── mfa/            # MFA-related components
│   │   └── ui/             # Base UI components
│   ├── pages/              # Page components
│   │   ├── flows/          # OAuth flow implementations
│   │   ├── docs/           # Documentation pages
│   │   └── test/           # Testing utilities
│   ├── v8/                 # V8 architecture components
│   │   ├── components/     # V8-specific components
│   │   ├── services/       # V8 business logic
│   │   ├── flows/          # V8 flow implementations
│   │   └── utils/          # V8 utilities
│   ├── v8u/                # V8U (unified) components
│   ├── services/           # Shared services
│   ├── contexts/           # React contexts
│   ├── hooks/              # Custom hooks
│   ├── utils/              # Utility functions
│   └── types/              # TypeScript type definitions
├── docs/                   # Documentation
├── tests/                  # Test files
└── public/                 # Static assets
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### Development Setup

```bash
# Clone the repository
git clone https://github.com/curtismu7/oauthPlayground.git
cd oauthPlayground

# Install dependencies
npm install

# Start development server
npm start

# Run tests
npm test

# Build for production
npm run build
```

### Environment Configuration

The project includes a pre-configured `.env.example` file:

```bash
# Copy environment template
cp .env.example .env

# Edit with your PingOne credentials
PINGONE_ENVIRONMENT_ID=your-environment-id
PINGONE_CLIENT_ID=your-client-id
PINGONE_CLIENT_SECRET=your-client-secret
PINGONE_REDIRECT_URI=https://localhost:3000/callback
```

## 🧠 Core Concepts

### V8 Architecture

The V8 architecture represents the latest evolution of the OAuth Playground:

```typescript
// V8 Service Example
export class ValidationServiceV8 {
  static validateCredentials(
    credentials: OAuthCredentials,
    flowType: 'oauth' | 'oidc' | 'client_credentials'
  ): ValidationResult {
    // Comprehensive validation logic
  }
}
```

### Flow State Management

```typescript
// Flow state context
interface FlowState {
  currentStep: number;
  completedSteps: Set<number>;
  validationResults: Record<string, ValidationResult>;
  tokens: TokenResponse | null;
}

// Usage in components
const { flowState, updateFlowState } = useFlowState();
```

### Token Management

```typescript
// Unified token storage
export interface UnifiedToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  refresh_token?: string;
  id_token?: string;
}

// Token service
export class TokenServiceV8 {
  static async exchangeToken(request: TokenExchangeRequest): Promise<TokenResponse> {
    // Token exchange implementation
  }
}
```

## 🔧 Development Workflow

### 1. Feature Development

When adding a new OAuth flow:

```typescript
// 1. Create flow component
export const NewFlowV9: React.FC = () => {
  const { credentials } = useAuth();
  const [flowState, setFlowState] = useState<FlowState>();
  
  return (
    <FlowContainer>
      <FlowHeader title="New OAuth Flow" />
      <FlowSteps currentStep={flowState?.currentStep} />
      {/* Flow implementation */}
    </FlowContainer>
  );
};

// 2. Add route configuration
<Route path="/flows/new-flow-v9" element={<NewFlowV9 />} />

// 3. Add tests
describe('NewFlowV9', () => {
  it('should handle new flow correctly', () => {
    // Test implementation
  });
});
```

### 2. Service Development

When creating a new service:

```typescript
// 1. Define service interface
export interface INewService {
  processData(data: unknown): Promise<ProcessedData>;
  validateInput(input: unknown): ValidationResult;
}

// 2. Implement service
export class NewServiceV8 implements INewService {
  static async processData(data: unknown): Promise<ProcessedData> {
    // Implementation
  }
  
  static validateInput(input: unknown): ValidationResult {
    // Validation logic
  }
}

// 3. Add tests
describe('NewServiceV8', () => {
  it('should process data correctly', async () => {
    const result = await NewServiceV8.processData(testData);
    expect(result).toBeDefined();
  });
});
```

### 3. Component Development

When creating reusable components:

```typescript
// 1. Define component interface
interface NewComponentProps {
  title: string;
  data: unknown;
  onAction?: (action: string) => void;
}

// 2. Implement component with proper typing
export const NewComponent: React.FC<NewComponentProps> = ({
  title,
  data,
  onAction
}) => {
  return (
    <ComponentContainer>
      <h2>{title}</h2>
      {/* Component implementation */}
    </ComponentContainer>
  );
};

// 3. Add storybook documentation (if applicable)
export default {
  title: 'Components/NewComponent',
  component: NewComponent,
};
```

## 🧪 Testing Strategy

### Unit Testing

```typescript
// Service testing example
describe('ValidationServiceV8', () => {
  describe('validateCredentials', () => {
    it('should validate complete credentials', () => {
      const credentials = {
        environmentId: '123e4567-e89b-12d3-a456-426614174000',
        clientId: 'test-client',
        redirectUri: 'https://localhost:3000/callback',
        scopes: 'openid profile email'
      };
      
      const result = ValidationServiceV8.validateCredentials(credentials, 'oidc');
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
```

### Integration Testing

```typescript
// Flow integration testing
describe('TokenExchangeFlow Integration', () => {
  it('should complete token exchange flow', async () => {
    render(<TokenExchangeFlowV8 />);
    
    // Fill form
    fireEvent.change(screen.getByLabelText('Subject Token'), {
      target: { value: 'test-token' }
    });
    
    // Submit form
    fireEvent.click(screen.getByText('Exchange Token'));
    
    // Wait for completion
    await waitFor(() => {
      expect(screen.getByText('🎉 Token Exchange Flow Complete')).toBeInTheDocument();
    });
  });
});
```

### Performance Testing

```typescript
// Performance testing example
describe('Performance Tests', () => {
  it('should load components within acceptable time', async () => {
    const startTime = performance.now();
    
    const { container } = render(<HeavyComponent />);
    
    const loadTime = performance.now() - startTime;
    expect(loadTime).toBeLessThan(1000); // 1 second threshold
  });
});
```

## 🎨 Styling Guidelines

### Styled Components

```typescript
// Use styled-components with proper typing
const Container = styled.div<{ $variant?: 'primary' | 'secondary' }>`
  padding: 1rem;
  border-radius: 0.5rem;
  background-color: ${({ theme, $variant }) => 
    $variant === 'primary' ? theme.colors.primary : theme.colors.secondary
  };
`;

// Component usage
const MyComponent: React.FC = () => {
  return (
    <Container $variant="primary">
      Content
    </Container>
  );
};
```

### Theme Usage

```typescript
// Access theme properties
const StyledComponent = styled.div`
  color: ${({ theme }) => theme.colors.text};
  background-color: ${({ theme }) => theme.colors.background};
  font-size: ${({ theme }) => theme.fontSizes.md};
`;
```

### Responsive Design

```typescript
// Responsive breakpoints
const ResponsiveContainer = styled.div`
  width: 100%;
  
  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    max-width: 768px;
  }
  
  @media (min-width: ${({ theme }) => theme.breakpoints.desktop}) {
    max-width: 1024px;
  }
`;
```

## 🔒 Security Best Practices

### Token Security

```typescript
// Secure token handling
export class SecureTokenService {
  static storeToken(token: string): void {
    // Use secure storage
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('access_token', token);
    }
  }
  
  static getToken(): string | null {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('access_token');
    }
    return null;
  }
  
  static clearToken(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('access_token');
    }
  }
}
```

### Input Validation

```typescript
// Comprehensive input validation
export const validateInput = (input: unknown, type: string): ValidationResult => {
  if (!input || typeof input !== 'string') {
    return {
      valid: false,
      errors: [{ field: type, message: 'Invalid input type' }],
      warnings: [],
      canProceed: false
    };
  }
  
  // Additional validation logic
  return { valid: true, errors: [], warnings: [], canProceed: true };
};
```

### CSRF Protection

```typescript
// CSRF protection implementation
export class CSRFProtection {
  static generateState(): string {
    return Math.random().toString(36).substring(2, 15);
  }
  
  static validateState(receivedState: string, storedState: string): boolean {
    return receivedState === storedState;
  }
}
```

## ⚡ Performance Optimization

### Lazy Loading

```typescript
// Lazy loading implementation
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// Usage with Suspense
const App: React.FC = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <HeavyComponent />
    </Suspense>
  );
};
```

### Memoization

```typescript
// Component memoization
export const OptimizedComponent = React.memo(({ data }: Props) => {
  const processedData = useMemo(() => {
    return expensiveDataProcessing(data);
  }, [data]);
  
  return <div>{processedData}</div>;
});

// Hook memoization
export const useOptimizedHook = (dependency: unknown) => {
  return useMemo(() => {
    return expensiveCalculation(dependency);
  }, [dependency]);
};
```

### Bundle Optimization

```typescript
// Dynamic imports for code splitting
const loadModule = async (moduleName: string) => {
  const module = await import(`./modules/${moduleName}`);
  return module.default;
};

// Route-based code splitting
const routes = [
  {
    path: '/flows/auth-code',
    component: lazy(() => import('./pages/flows/AuthCodeFlow'))
  },
  {
    path: '/flows/implicit',
    component: lazy(() => import('./pages/flows/ImplicitFlow'))
  }
];
```

## 🐛 Debugging

### Development Tools

```typescript
// Debug logging
export const debugLog = (message: string, data?: unknown) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[OAuth Playground] ${message}`, data);
  }
};

// Error boundaries
export class ErrorBoundary extends React.Component<Props, State> {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Send to error tracking service
  }
}
```

### Performance Monitoring

```typescript
// Performance monitoring
export const performanceMonitor = {
  startTime: (label: string) => {
    if (typeof performance !== 'undefined') {
      performance.mark(`${label}-start`);
    }
  },
  
  endTime: (label: string) => {
    if (typeof performance !== 'undefined') {
      performance.mark(`${label}-end`);
      performance.measure(label, `${label}-start`, `${label}-end`);
    }
  }
};
```

## 📚 Code Standards

### TypeScript Guidelines

1. **Strict Typing**: Always use proper TypeScript types
2. **No `any` Types**: Use `unknown` or specific types instead
3. **Interface First**: Define interfaces before implementation
4. **Generic Usage**: Use generics for reusable components

```typescript
// Good example
interface UserData {
  id: string;
  name: string;
  email: string;
}

const processUser = (user: UserData): ProcessedUser => {
  return {
    ...user,
    processed: true
  };
};

// Avoid this
const processUser = (user: any): any => {
  return user;
};
```

### Component Guidelines

1. **Functional Components**: Use functional components with hooks
2. **Props Interface**: Always define props interfaces
3. **Default Props**: Use default parameters instead of defaultProps
4. **Destructuring**: Destructure props and context values

```typescript
// Good example
interface MyComponentProps {
  title: string;
  data: UserData[];
  onAction?: (action: string) => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({
  title,
  data,
  onAction
}) => {
  return (
    <div>
      <h1>{title}</h1>
      {/* Component implementation */}
    </div>
  );
};
```

### Service Guidelines

1. **Static Methods**: Use static methods for stateless services
2. **Error Handling**: Always include proper error handling
3. **Validation**: Validate inputs before processing
4. **Type Safety**: Return properly typed results

```typescript
// Good example
export class DataServiceV8 {
  static async fetchData(id: string): Promise<DataResult> {
    try {
      if (!id || typeof id !== 'string') {
        throw new Error('Invalid ID provided');
      }
      
      const data = await api.get(`/data/${id}`);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
```

## 🔄 Continuous Integration

### Pre-commit Hooks

```bash
#!/bin/sh
# .husky/pre-commit
npm run lint
npm run test
npm run type-check
```

### GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

## 📖 Contributing

### Pull Request Process

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Code Review Guidelines

1. **Functionality**: Does the code work as intended?
2. **Type Safety**: Are all types properly defined?
3. **Performance**: Is the code optimized?
4. **Testing**: Are there adequate tests?
5. **Documentation**: Is the code well-documented?

### Release Process

1. **Update** version in package.json
2. **Update** CHANGELOG.md
3. **Create** release tag: `git tag v9.15.3`
4. **Push** tag: `git push origin v9.15.3`
5. **Create** GitHub release

## 🤝 Community

### Getting Help

- **GitHub Issues**: Report bugs and request features
- **Discussions**: Ask questions and share ideas
- **Documentation**: Check the docs folder for detailed guides

### Contributing Guidelines

- **Code Style**: Follow the established code style
- **Testing**: Write tests for new features
- **Documentation**: Update documentation for changes
- **Performance**: Consider performance implications

## 📞 Support

For developer support:

- Check the [Developer Guide](./DEVELOPER_GUIDE.md)
- Review the [API Documentation](./API_DOCUMENTATION.md)
- Browse the [Issues](https://github.com/curtismu7/oauthPlayground/issues)
- Join the [Discussions](https://github.com/curtismu7/oauthPlayground/discussions)

---

Happy coding! 🚀
