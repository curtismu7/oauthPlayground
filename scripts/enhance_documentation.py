#!/usr/bin/env python3
"""
Documentation Enhancement Script

This script enhances project documentation by:
1. Generating comprehensive API documentation
2. Creating component documentation
3. Adding developer guides
4. Improving README and setup guides
5. Creating architecture documentation
"""

import os
import re
import json
from pathlib import Path
from typing import Dict, List, Any, Optional

# Configuration
PROJECT_ROOT = Path(".")
SRC_DIR = PROJECT_ROOT / "src"
DOCS_DIR = PROJECT_ROOT / "docs"

class DocumentationEnhancer:
    def __init__(self):
        self.api_endpoints = []
        self.components = []
        self.services = []
        self.hooks = []
        
    def analyze_project_structure(self) -> Dict[str, Any]:
        """Analyze project structure for documentation"""
        analysis = {
            "api_endpoints": [],
            "components": [],
            "services": [],
            "hooks": [],
            "pages": [],
            "utils": []
        }
        
        if not SRC_DIR.exists():
            print(f"❌ Source directory {SRC_DIR} not found")
            return analysis
            
        # Find API endpoints
        for file_path in SRC_DIR.rglob("*.ts"):
            if file_path.is_file():
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                    # Look for API endpoints
                    if 'fetch(' in content or 'axios.' in content:
                        api_matches = re.findall(r'(?:fetch|axios\.(?:get|post|put|delete|patch))\s*\(\s*[\'"`]([^\'"`]+)[\'"`]', content)
                        for match in api_matches:
                            if match.startswith('/'):
                                analysis["api_endpoints"].append({
                                    "path": match,
                                    "file": str(file_path.relative_to(SRC_DIR))
                                })
                                
                except Exception as e:
                    print(f"❌ Error analyzing {file_path}: {e}")
                    
        # Find components
        for file_path in SRC_DIR.rglob("*.tsx"):
            if file_path.is_file() and "components" in str(file_path):
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                    # Extract component name
                    component_match = re.search(r'export\s+(?:default\s+)?(?:const|function)\s+(\w+)', content)
                    if component_match:
                        component_name = component_match.group(1)
                        
                        # Extract props interface
                        props_match = re.search(r'interface\s+(\w*Props)\s*{([^}]+)}', content, re.DOTALL)
                        props = {}
                        if props_match:
                            props_content = props_match.group(2)
                            prop_lines = [line.strip() for line in props_content.split('\n') if line.strip()]
                            for line in prop_lines:
                                if ':' in line and not line.strip().startswith('//'):
                                    prop_parts = line.split(':')
                                    if len(prop_parts) >= 2:
                                        prop_name = prop_parts[0].strip().rstrip(';')
                                        prop_type = prop_parts[1].strip().rstrip(';')
                                        props[prop_name] = prop_type
                        
                        analysis["components"].append({
                            "name": component_name,
                            "file": str(file_path.relative_to(SRC_DIR)),
                            "props": props
                        })
                        
                except Exception as e:
                    print(f"❌ Error analyzing component {file_path}: {e}")
                    
        # Find services
        for file_path in SRC_DIR.rglob("*.ts"):
            if file_path.is_file() and "services" in str(file_path):
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                    # Extract service functions
                    function_matches = re.findall(r'(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(|(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\(', content)
                    functions = []
                    for match in function_matches:
                        func_name = match[0] if match[0] else match[1]
                        functions.append(func_name)
                    
                    if functions:
                        analysis["services"].append({
                            "name": file_path.stem,
                            "file": str(file_path.relative_to(SRC_DIR)),
                            "functions": functions
                        })
                        
                except Exception as e:
                    print(f"❌ Error analyzing service {file_path}: {e}")
                    
        return analysis
    
    def create_api_documentation(self, analysis: Dict[str, Any]) -> str:
        """Create comprehensive API documentation"""
        doc = """# MasterFlow API Documentation

## Overview

MasterFlow API is a comprehensive PingOne integration platform that provides OAuth 2.0, OIDC, and MFA testing capabilities.

## Base URL

```
https://api.pingone.com
```

## Authentication

Most endpoints require Bearer token authentication:

```http
Authorization: Bearer <access_token>
```

## API Endpoints

"""
        
        for endpoint in analysis["api_endpoints"]:
            doc += f"""
### {endpoint["path"]}

**File**: `{endpoint["file"]}`

**Description**: API endpoint for {endpoint["path"].replace('/', ' ').title()}

**Request Method**: GET, POST, PUT, DELETE (varies by usage)

**Authentication**: Required

**Example**:
```http
{endpoint["path"]}
```

"""
        
        return doc
    
    def create_component_documentation(self, analysis: Dict[str, Any]) -> str:
        """Create component documentation"""
        doc = """# Component Documentation

## Overview

MasterFlow API uses a component-based architecture with React and TypeScript.

## Components

"""
        
        for component in analysis["components"][:20]:  # Limit to first 20 components
            doc += f"""
### {component["name"]}

**File**: `{component["file"]}`

**Props**:
"""
            
            if component["props"]:
                for prop_name, prop_type in component["props"].items():
                    doc += f"- `{prop_name}`: `{prop_type}`\n"
            else:
                doc += "- No props defined\n"
            
            doc += """
**Usage**:
```tsx
import { """ + component["name"] + """ } from '@/components/""" + component["name"] + """'

<""" + component["name"] + """ />
```

"""
        
        return doc
    
    def create_service_documentation(self, analysis: Dict[str, Any]) -> str:
        """Create service documentation"""
        doc = """# Service Documentation

## Overview

Services handle business logic, API calls, and data management in MasterFlow API.

## Services

"""
        
        for service in analysis["services"][:15]:  # Limit to first 15 services
            doc += f"""
### {service["name"]}

**File**: `{service["file"]}`

**Functions**:
"""
            
            for func in service["functions"]:
                doc += f"- `{func}()`\n"
            
            doc += """
**Usage**:
```typescript
import { """ + service["name"] + """ } from '@/services/""" + service["name"] + """'

// Example usage
""" + service["name"] + """."""
            
            if service["functions"]:
                doc += service["functions"][0] + """()
```

"""
        
        return doc
    
    def create_developer_guide(self) -> str:
        """Create comprehensive developer guide"""
        guide = """# MasterFlow API Developer Guide

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- PingOne developer account
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/masterflow-api.git
cd masterflow-api

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm start
```

### Environment Configuration

Create a `.env` file with the following variables:

```env
# PingOne Configuration
PINGONE_CLIENT_ID=your_client_id
PINGONE_CLIENT_SECRET=your_client_secret
PINGONE_ENVIRONMENT_ID=your_environment_id
PINGONE_DOMAIN=your_domain

# Application Configuration
VITE_APP_VERSION=9.13.4
VITE_API_BASE_URL=https://api.pingone.com
```

## Architecture

### Directory Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
├── services/           # Business logic and API calls
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
├── v8/                 # V8 legacy components
├── v8u/                # V8 unified components
└── styles/             # CSS and styled-components
```

### Component Architecture

Components follow these principles:

1. **Single Responsibility**: Each component has one clear purpose
2. **Composition**: Build complex UIs from simple components
3. **Props Interface**: All components have TypeScript prop interfaces
4. **Accessibility**: Components follow WCAG guidelines

### Service Architecture

Services handle:

1. **API Communication**: HTTP requests to PingOne APIs
2. **Data Transformation**: Format and validate data
3. **Error Handling**: Consistent error management
4. **Caching**: Local storage and session management

## Development Workflow

### 1. Feature Development

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes
# ... develop feature ...

# Run tests
npm test

# Run linting
npm run lint

# Build project
npm run build

# Commit changes
git add .
git commit -m "feat: add new feature"

# Push branch
git push origin feature/new-feature
```

### 2. Code Quality

Run these commands before committing:

```bash
# Format code
npm run format

# Run linting
npm run lint

# Run type checking
npm run type-check

# Run tests
npm test

# Check build
npm run build
```

### 3. Testing

#### Unit Tests

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import MyComponent from '@/components/MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })
})
```

#### Integration Tests

```typescript
import { describe, it, expect } from 'vitest'
import { myService } from '@/services/myService'

describe('myService', () => {
  it('makes API calls correctly', async () => {
    const result = await myService.getData()
    expect(result).toBeDefined()
  })
})
```

#### E2E Tests

```typescript
import { test, expect } from '@playwright/test'

test('user can login', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[data-testid="username"]', 'testuser')
  await page.fill('[data-testid="password"]', 'password')
  await page.click('[data-testid="login-button"]')
  
  await expect(page).toHaveURL('/dashboard')
})
```

## OAuth Flow Implementation

### Authorization Code Flow

```typescript
import { useOAuthFlow } from '@/hooks/useOAuthFlow'

const AuthorizationCodeFlow = () => {
  const { authorize, exchangeCode, isLoading, error } = useOAuthFlow({
    clientId: 'your_client_id',
    redirectUri: 'http://localhost:3000/callback',
    scope: 'openid profile email'
  })

  const handleAuthorize = () => {
    authorize()
  }

  return (
    <div>
      <button onClick={handleAuthorize} disabled={isLoading}>
        Authorize
      </button>
      {error && <div>Error: {error.message}</div>}
    </div>
  )
}
```

### MFA Integration

```typescript
import { useMFAFlow } from '@/hooks/useMFAFlow'

const MFAFlow = () => {
  const { initiateMFA, verifyCode, isLoading, error } = useMFAFlow()

  const handleMFAInitiate = async () => {
    await initiateMFA({
      userId: 'user123',
      deviceType: 'MOBILE'
    })
  }

  const handleVerifyCode = async (code: string) => {
    await verifyCode(code)
  }

  return (
    <div>
      <button onClick={handleMFAInitiate}>Start MFA</button>
      {/* MFA verification UI */}
    </div>
  )
}
```

## Styling Guidelines

### Styled Components

```typescript
import styled from 'styled-components'

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  
  ${({ variant = 'primary', theme }) => {
    switch (variant) {
      case 'primary':
        return css`
          background: ${theme.colors.primary};
          color: white;
        `
      case 'secondary':
        return css`
          background: ${theme.colors.secondary};
          color: white;
        `
    }
  }}
`
```

### Theme Usage

```typescript
import { useTheme } from 'styled-components'

const ThemedComponent = () => {
  const theme = useTheme()
  
  return (
    <div style={{ color: theme.colors.primary }}>
      Themed content
    </div>
  )
}
```

## Error Handling

### Service Errors

```typescript
import { logger } from '@/utils/logger'

export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export const handleAPIError = (error: unknown) => {
  if (error instanceof APIError) {
    logger.error('API Error:', error)
    return error.message
  }
  
  logger.error('Unexpected error:', error)
  return 'An unexpected error occurred'
}
```

### Component Error Boundaries

```typescript
import { Component, ErrorBoundary, ReactNode } from 'react'

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong.</div>
    }

    return this.props.children
  }
}
```

## Performance Optimization

### Code Splitting

```typescript
import { lazy, Suspense } from 'react'

const HeavyComponent = lazy(() => import('./HeavyComponent'))

const App = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <HeavyComponent />
  </Suspense>
)
```

### Memoization

```typescript
import { memo, useMemo, useCallback } from 'react'

const ExpensiveComponent = memo(({ data, onUpdate }) => {
  const processedData = useMemo(() => {
    return data.map(item => expensiveTransform(item))
  }, [data])

  const handleClick = useCallback((id: string) => {
    onUpdate(id)
  }, [onUpdate])

  return (
    <div>
      {processedData.map(item => (
        <Item key={item.id} item={item} onClick={handleClick} />
      ))}
    </div>
  )
})
```

## Deployment

### Build Process

```bash
# Build for production
npm run build

# Preview build
npm run preview

# Build with analysis
npm run build && npm run analyze:bundle
```

### Environment Variables

Production environment variables:

```env
NODE_ENV=production
VITE_API_BASE_URL=https://api.pingone.com
VITE_APP_VERSION=9.13.4
```

## Contributing

### Pull Request Process

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Ensure all tests pass
5. Submit pull request

### Code Review Checklist

- [ ] Code follows style guidelines
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] TypeScript types are correct
- [ ] Performance impact is considered

## Troubleshooting

### Common Issues

1. **Build Failures**: Check TypeScript errors and missing dependencies
2. **Test Failures**: Verify mocks and test setup
3. **API Errors**: Check authentication and network connectivity
4. **Styling Issues**: Verify theme provider and styled components

### Debug Tools

- React Developer Tools
- Redux DevTools (if using Redux)
- Browser DevTools Network tab
- Vitest test runner
- Playwright test inspector

## Resources

- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Styled Components Documentation](https://styled-components.com/)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [PingOne API Documentation](https://apidocs.pingidentity.com/pingone/platform/v1/api/)
"""
        
        return guide
    
    def create_architecture_documentation(self) -> str:
        """Create architecture documentation"""
        doc = """# MasterFlow API Architecture

## Overview

MasterFlow API is a modern React application that provides comprehensive PingOne integration testing capabilities.

## System Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   PingOne API   │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (OAuth 2.0)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Frontend Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        React App                           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Pages     │  │ Components  │  │   Hooks     │        │
│  │             │  │             │  │             │        │
│  │ - OAuth     │  │ - Forms     │  │ - Auth      │        │
│  │ - MFA       │  │ - Buttons   │  │ - API       │        │
│  │ - Admin     │  │ - Modals    │  │ - Storage   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Services   │  │   Utils     │  │   Types     │        │
│  │             │  │             │  │             │        │
│  │ - OAuth     │  │ - Helpers   │  │ - Interfaces│        │
│  │ - MFA       │  │ - Validators │  │ - Enums     │        │
│  │ - Storage   │  │ - Formatters │  │ - Schemas   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Component Hierarchy

```
App
├── Router
├── ThemeProvider
├── GlobalStyle
└── Routes
    ├── OAuthFlows
    │   ├── AuthorizationCodeFlow
    │   ├── ImplicitFlow
    │   ├── ClientCredentialsFlow
    │   └── DeviceFlow
    ├── MFAFlows
    │   ├── DeviceManagement
    │   ├── Registration
    │   └── Authentication
    ├── Admin
    │   ├── Dashboard
    │   ├── UserManagement
    │   └── Settings
    └── Common
        ├── Header
        ├── Sidebar
        └── Footer
```

### Component Patterns

#### 1. Container/Presentational Pattern

```typescript
// Container Component
const OAuthFlowContainer = () => {
  const { credentials, setCredentials, error, isLoading } = useOAuthFlow()
  
  return (
    <OAuthFlowPresentational
      credentials={credentials}
      onCredentialsChange={setCredentials}
      error={error}
      isLoading={isLoading}
    />
  )
}

// Presentational Component
interface OAuthFlowPresentationalProps {
  credentials: OAuthCredentials
  onCredentialsChange: (creds: OAuthCredentials) => void
  error: string | null
  isLoading: boolean
}

const OAuthFlowPresentational: React.FC<OAuthFlowPresentationalProps> = ({
  credentials,
  onCredentialsChange,
  error,
  isLoading
}) => {
  return (
    <div>
      {/* UI implementation */}
    </div>
  )
}
```

#### 2. Compound Component Pattern

```typescript
const Form = ({ children }: { children: ReactNode }) => {
  const [values, setValues] = useState({})
  
  return (
    <FormContext.Provider value={{ values, setValues }}>
      {children}
    </FormContext.Provider>
  )
}

Form.Field = ({ name, label }: { name: string; label: string }) => {
  const { values, setValues } = useContext(FormContext)
  
  return (
    <div>
      <label>{label}</label>
      <input
        value={values[name] || ''}
        onChange={(e) => setValues({ ...values, [name]: e.target.value })}
      />
    </div>
  )
}

Form.Button = ({ children }: { children: ReactNode }) => {
  const { values } = useContext(FormContext)
  
  const handleSubmit = () => {
    console.log('Form values:', values)
  }
  
  return <button onClick={handleSubmit}>{children}</button>
}

// Usage
<Form>
  <Form.Field name="username" label="Username" />
  <Form.Field name="password" label="Password" />
  <Form.Button>Submit</Form.Button>
</Form>
```

## Service Architecture

### Service Layer

```
Services
├── API Services
│   ├── OAuthService
│   ├── MFAService
│   └── UserService
├── Business Logic Services
│   ├── FlowService
│   ├── ValidationService
│   └── StorageService
└── Integration Services
    ├── PingOneService
    ├── LoggerService
    └── AnalyticsService
```

### Service Pattern

```typescript
interface ServiceResponse<T> {
  data: T
  success: boolean
  error?: string
}

class OAuthService {
  private baseURL: string
  private client: PingOneClient
  
  constructor(config: OAuthConfig) {
    this.baseURL = config.baseURL
    this.client = new PingOneClient(config)
  }
  
  async authorize(params: AuthorizeParams): Promise<ServiceResponse<AuthorizeResponse>> {
    try {
      const response = await this.client.post('/oauth/authorize', params)
      return {
        data: response.data,
        success: true
      }
    } catch (error) {
      logger.error('OAuth authorize failed:', error)
      return {
        data: null,
        success: false,
        error: error.message
      }
    }
  }
  
  async exchangeCode(code: string): Promise<ServiceResponse<TokenResponse>> {
    try {
      const response = await this.client.post('/oauth/token', { code })
      return {
        data: response.data,
        success: true
      }
    } catch (error) {
      logger.error('Token exchange failed:', error)
      return {
        data: null,
        success: false,
        error: error.message
      }
    }
  }
}
```

## State Management

### State Architecture

```
State Management
├── Local State
│   ├── useState (component state)
│   ├── useReducer (complex state)
│   └── Context API (global state)
├── Server State
│   ├── React Query (caching)
│   ├── SWR (data fetching)
│   └── Custom hooks
└── Persistent State
    ├── localStorage
    ├── sessionStorage
    └── IndexedDB
```

### State Patterns

#### 1. Custom Hook Pattern

```typescript
const useOAuthFlow = (config: OAuthConfig) => {
  const [credentials, setCredentials] = useState<OAuthCredentials>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const authorize = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await OAuthService.authorize(config)
      if (response.success) {
        setCredentials(response.data)
      } else {
        setError(response.error || 'Authorization failed')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [config])
  
  return {
    credentials,
    setCredentials,
    isLoading,
    error,
    authorize
  }
}
```

#### 2. Context Provider Pattern

```typescript
interface AppContextType {
  user: User | null
  theme: Theme
  notifications: Notification[]
  setUser: (user: User | null) => void
  setTheme: (theme: Theme) => void
  addNotification: (notification: Notification) => void
}

const AppContext = createContext<AppContextType | null>(null)

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [theme, setTheme] = useState<Theme>('light')
  const [notifications, setNotifications] = useState<Notification[]>([])
  
  const addNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [...prev, notification])
  }, [])
  
  const value = {
    user,
    theme,
    notifications,
    setUser,
    setTheme,
    addNotification
  }
  
  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}
```

## Data Flow

### OAuth Flow Data Flow

```
User Action
    ↓
Component Event Handler
    ↓
Custom Hook
    ↓
Service Layer
    ↓
API Call
    ↓
Response Processing
    ↓
State Update
    ↓
Component Re-render
```

### MFA Flow Data Flow

```
Device Registration
    ↓
MFA Service
    ↓
PingOne API
    ↓
QR Code Generation
    ↓
Device Registration
    ↓
Authentication
    ↓
Token Exchange
    ↓
Session Management
```

## Security Architecture

### Security Layers

```
Security
├── Authentication
│   ├── OAuth 2.0
│   ├── OpenID Connect
│   └── MFA
├── Authorization
│   ├── RBAC
│   ├── Permissions
│   └── Scopes
├── Data Protection
│   ├── Encryption
│   ├── Hashing
│   └── Tokens
└── Audit & Logging
    ├── Access Logs
    ├── Error Tracking
    └── Performance Metrics
```

### Security Implementation

```typescript
// Token Management
class TokenManager {
  private static instance: TokenManager
  private tokens: Map<string, Token> = new Map()
  
  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager()
    }
    return TokenManager.instance
  }
  
  setToken(key: string, token: Token): void {
    this.tokens.set(key, token)
    
    // Auto-expire token
    if (token.expiresAt) {
      setTimeout(() => {
        this.tokens.delete(key)
      }, token.expiresAt.getTime() - Date.now())
    }
  }
  
  getToken(key: string): Token | null {
    const token = this.tokens.get(key)
    if (!token) return null
    
    // Check if expired
    if (token.expiresAt && token.expiresAt < new Date()) {
      this.tokens.delete(key)
      return null
    }
    
    return token
  }
}

// Secure Storage
class SecureStorage {
  private static instance: SecureStorage
  
  static getInstance(): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage()
    }
    return SecureStorage.instance
  }
  
  setItem(key: string, value: string): void {
    // Encrypt before storing
    const encrypted = this.encrypt(value)
    localStorage.setItem(key, encrypted)
  }
  
  getItem(key: string): string | null {
    const encrypted = localStorage.getItem(key)
    if (!encrypted) return null
    
    // Decrypt after retrieving
    return this.decrypt(encrypted)
  }
  
  private encrypt(data: string): string {
    // Implementation using Web Crypto API
    return btoa(data) // Simplified for example
  }
  
  private decrypt(data: string): string {
    // Implementation using Web Crypto API
    return atob(data) // Simplified for example
  }
}
```

## Performance Architecture

### Performance Optimization

```
Performance
├── Code Splitting
│   ├── Route-based
│   ├── Component-based
│   └── Feature-based
├── Caching
│   ├── API Response Cache
│   ├── Component Memoization
│   └── Asset Caching
├── Bundle Optimization
│   ├── Tree Shaking
│   ├── Minification
│   └── Compression
└── Runtime Optimization
    ├── Lazy Loading
    ├── Virtual Scrolling
    └── Debouncing
```

### Performance Implementation

```typescript
// Route-based code splitting
const OAuthFlow = lazy(() => import('./pages/OAuthFlow'))
const MFAFlow = lazy(() => import('./pages/MFAFlow'))
const AdminPanel = lazy(() => import('./pages/AdminPanel'))

// Component memoization
const ExpensiveComponent = memo(({ data }: { data: Data[] }) => {
  const processedData = useMemo(() => {
    return data.map(item => expensiveTransform(item))
  }, [data])
  
  return <DataList data={processedData} />
})

// API caching
class APICache {
  private cache = new Map<string, { data: any; timestamp: number }>()
  private ttl = 5 * 60 * 1000 // 5 minutes
  
  get(key: string): any | null {
    const cached = this.cache.get(key)
    if (!cached) return null
    
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return cached.data
  }
  
  set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }
}
```

## Testing Architecture

### Testing Strategy

```
Testing
├── Unit Tests
│   ├── Components
│   ├── Services
│   ├── Utils
│   └── Hooks
├── Integration Tests
│   ├── API Integration
│   ├── Component Integration
│   └── Service Integration
├── E2E Tests
│   ├── User Flows
│   ├── OAuth Flows
│   └── MFA Flows
└── Performance Tests
    ├── Load Testing
    ├── Bundle Analysis
    └── Memory Profiling
```

## Deployment Architecture

### Deployment Strategy

```
Deployment
├── Development
│   ├── Local Development
│   ├── Feature Branches
│   └── Pull Request
├── Staging
│   ├── Pre-production
│   ├── Integration Testing
│   └── User Acceptance
└── Production
    ├── Blue-Green Deployment
    ├── Canary Releases
    └── Rollback Strategy
```

### CI/CD Pipeline

```yaml
# GitHub Actions Workflow
name: Deploy MasterFlow API

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to production
        run: |
          # Deployment commands
```

## Monitoring Architecture

### Monitoring Strategy

```
Monitoring
├── Application Monitoring
│   ├── Performance Metrics
│   ├── Error Tracking
│   └── User Analytics
├── Infrastructure Monitoring
│   ├── Server Health
│   ├── Database Performance
│   └── Network Status
└── Business Monitoring
    ├── OAuth Flow Success Rate
    ├── MFA Adoption Rate
    └── User Engagement
```

This architecture documentation provides a comprehensive overview of the MasterFlow API system architecture, including component design patterns, service architecture, state management, security, performance, testing, deployment, and monitoring strategies.
"""
        
        return doc
    
    def run(self) -> None:
        """Run the documentation enhancement"""
        print("📚 Enhancing Documentation")
        print("=" * 40)
        
        # Create docs directory
        DOCS_DIR.mkdir(exist_ok=True)
        
        # Analyze project structure
        print("🔍 Analyzing project structure...")
        analysis = self.analyze_project_structure()
        
        print(f"📊 Analysis Results:")
        print(f"  API Endpoints: {len(analysis['api_endpoints'])}")
        print(f"  Components: {len(analysis['components'])}")
        print(f"  Services: {len(analysis['services'])}")
        print(f"  Hooks: {len(analysis['hooks'])}")
        
        # Create documentation files
        print("\n📝 Creating documentation files...")
        
        # API Documentation
        api_doc = self.create_api_documentation(analysis)
        with open(DOCS_DIR / "API.md", 'w') as f:
            f.write(api_doc)
        print("  ✅ Created API.md")
        
        # Component Documentation
        component_doc = self.create_component_documentation(analysis)
        with open(DOCS_DIR / "COMPONENTS.md", 'w') as f:
            f.write(component_doc)
        print("  ✅ Created COMPONENTS.md")
        
        # Service Documentation
        service_doc = self.create_service_documentation(analysis)
        with open(DOCS_DIR / "SERVICES.md", 'w') as f:
            f.write(service_doc)
        print("  ✅ Created SERVICES.md")
        
        # Developer Guide
        dev_guide = self.create_developer_guide()
        with open(DOCS_DIR / "DEVELOPER_GUIDE.md", 'w') as f:
            f.write(dev_guide)
        print("  ✅ Created DEVELOPER_GUIDE.md")
        
        # Architecture Documentation
        arch_doc = self.create_architecture_documentation()
        with open(DOCS_DIR / "ARCHITECTURE.md", 'w') as f:
            f.write(arch_doc)
        print("  ✅ Created ARCHITECTURE.md")
        
        # Update README
        self.update_readme()
        
        print(f"\n🎯 Documentation Enhancement Complete!")
        print(f"📁 Documentation files created in {DOCS_DIR}")
        print(f"📖 View docs: docs/DEVELOPER_GUIDE.md")
        print(f"🏗️ Architecture: docs/ARCHITECTURE.md")
        print(f"🔌 API Reference: docs/API.md")
    
    def update_readme(self) -> None:
        """Update main README with documentation links"""
        readme_path = PROJECT_ROOT / "README.md"
        
        if readme_path.exists():
            with open(readme_path, 'r') as f:
                content = f.read()
            
            # Add documentation section
            doc_section = """
## Documentation

### 📚 Comprehensive Documentation

- **[Developer Guide](docs/DEVELOPER_GUIDE.md)** - Complete development guide
- **[Architecture](docs/ARCHITECTURE.md)** - System architecture overview
- **[API Reference](docs/API.md)** - API endpoints and usage
- **[Components](docs/COMPONENTS.md)** - Component documentation
- **[Services](docs/SERVICES.md)** - Service layer documentation

### 🛠️ Development

- **[Testing Guide](docs/DEVELOPER_GUIDE.md#testing)** - Testing strategies and examples
- **[Contributing](docs/DEVELOPER_GUIDE.md#contributing)** - How to contribute
- **[Troubleshooting](docs/DEVELOPER_GUIDE.md#troubleshooting)** - Common issues and solutions

"""
            
            # Add before existing sections
            if "## Documentation" not in content:
                content = content.replace("## Quick Start", doc_section + "## Quick Start")
            
            with open(readme_path, 'w') as f:
                f.write(content)
            
            print("  ✅ Updated README.md")

if __name__ == "__main__":
    enhancer = DocumentationEnhancer()
    enhancer.run()
