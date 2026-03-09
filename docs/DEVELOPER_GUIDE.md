# MasterFlow API Developer Guide

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
