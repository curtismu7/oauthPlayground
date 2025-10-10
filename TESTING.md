# OAuth Playground - Comprehensive Testing Suite

This document describes the comprehensive testing setup for the OAuth Playground application, covering backend API tests, frontend unit tests, E2E tests, UI interaction tests, and integration tests.

## Test Structure

```
tests/
├── backend/                    # Backend API tests (Jest)
│   ├── setup.js               # Test setup and utilities
│   ├── health.test.js         # Health endpoint tests
│   ├── env-config.test.js     # Environment config tests
│   ├── token-exchange.test.js # Token exchange endpoint tests
│   ├── client-credentials.test.js # Client credentials tests
│   ├── introspect-token.test.js   # Token introspection tests
│   ├── userinfo-validation.test.js # UserInfo and validation tests
│   └── jwks-discovery.test.js     # JWKS and discovery tests
├── test-data.js               # Test fixtures and mock data
e2e/                           # End-to-End tests (Playwright)
├── tests/
│   ├── comprehensive-flows.spec.ts    # General app functionality
│   ├── oauth-authorization-code.spec.ts # OAuth auth code flow
│   ├── ui-interactions.spec.ts        # UI component interactions
│   └── integration.spec.ts            # Frontend-backend integration
src/
├── utils/__tests__/           # Frontend utility tests (Vitest)
│   ├── oauth.test.ts          # OAuth utility functions
│   └── jwks.test.ts           # JWKS utilities (existing)
├── components/__tests__/      # Component tests (Vitest)
│   ├── Card.test.tsx          # Card component tests
│   └── Spinner.test.tsx       # Spinner component tests
```

## Running Tests

### Backend API Tests
```bash
# Run backend tests with Jest
npm run test:backend

# Run with coverage
npm run test:backend -- --coverage
```

### Frontend Unit Tests
```bash
# Run frontend unit tests with Vitest
npm test

# Run with UI
npm run test:ui

# Run once (CI mode)
npm run test:run
```

### End-to-End Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run in debug mode
npm run test:e2e:debug

# Run headed (visible browser)
npm run test:e2e:headed

# View test report
npm run test:e2e:report
```

### All Tests
```bash
# Run all test suites
npm run test:all
```

## Test Categories

### Backend API Tests
- **Health Endpoint**: Server health and system metrics
- **Environment Config**: Configuration loading from environment variables
- **Token Exchange**: OAuth 2.0 token exchange flows (authorization code, refresh token)
- **Client Credentials**: Client credentials grant flow
- **Token Introspection**: Token validation and introspection
- **UserInfo**: OpenID Connect UserInfo endpoint
- **Token Validation**: Access token validation
- **Device Authorization**: OAuth 2.0 device authorization flow
- **PAR**: Pushed Authorization Requests
- **JWKS**: JSON Web Key Sets
- **Discovery**: OpenID Connect discovery

### Frontend Unit Tests
- **OAuth Utilities**: Random string generation, PKCE, URL parsing
- **JWT Utilities**: JWT validation and processing
- **JWKS Utilities**: Key set handling and conversion
- **Component Tests**: Card, Spinner, and other UI components

### E2E Tests
- **Comprehensive Flows**: General application functionality and navigation
- **OAuth Authorization Code**: Complete OAuth authorization code flow
- **UI Interactions**: Component interactions, forms, buttons, modals
- **Integration**: Frontend-backend communication and API calls

## Test Data and Fixtures

The `tests/test-data.js` file contains comprehensive mock data for testing:

- OAuth configuration objects
- Mock tokens (access, refresh, ID tokens)
- PingOne API response mocks
- Error response scenarios
- Test user data
- Form data for different flows
- UI selectors for testing

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci-cd.yml`) includes:

### Automated Testing
- **Multi-Node Testing**: Tests run on Node.js 18.x and 20.x
- **Backend Tests**: API endpoint testing with Jest
- **Frontend Tests**: Unit tests with Vitest and coverage reporting
- **E2E Tests**: Full user flow testing with Playwright
- **UI Tests**: Component interaction testing
- **Integration Tests**: Frontend-backend communication

### Quality Assurance
- **Linting**: Code quality checks with Biome
- **Formatting**: Code formatting validation
- **Security Audit**: NPM audit and Semgrep security scanning
- **Performance Testing**: Lighthouse performance metrics

### Deployment
- **Staging Deployment**: Automatic deployment to staging on develop branch
- **Production Deployment**: Automatic deployment to production on main branch
- **Smoke Tests**: Basic functionality tests post-deployment

## Test Configuration

### Jest (Backend)
- **Environment**: Node.js
- **Setup**: `tests/backend/setup.js`
- **Coverage**: Backend code coverage reporting
- **Test Match**: `**/tests/backend/**/*.test.js`

### Vitest (Frontend)
- **Environment**: jsdom
- **Setup**: `src/tests/setup.ts`
- **Coverage**: Frontend code coverage reporting
- **Test Match**: `src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}`

### Playwright (E2E)
- **Browsers**: Chromium, Firefox, WebKit
- **Base URL**: `http://localhost:3000`
- **Server Setup**: Automatic backend and frontend server startup
- **Artifacts**: Screenshots, videos, and traces on failure

## Mocking Strategy

### Backend Tests
- **Fetch API**: Globally mocked for external API calls
- **Environment Variables**: Controlled test environment
- **File System**: Mocked for certificate generation
- **Crypto**: Web Crypto API mocked for deterministic testing

### Frontend Tests
- **React Testing Library**: Component testing utilities
- **User Event**: Realistic user interaction simulation
- **Crypto API**: Mocked for OAuth utilities
- **Fetch API**: Mocked for API calls

### E2E Tests
- **Real Servers**: Tests run against actual backend and frontend servers
- **Network Monitoring**: API call interception and validation
- **Browser Context**: Isolated browser sessions for each test

## Running Tests Locally

1. **Install Dependencies**:
   ```bash
   npm install
   npx playwright install
   ```

2. **Start Servers** (for E2E testing):
   ```bash
   npm run start:full-stack
   ```

3. **Run Specific Test Suites**:
   ```bash
   # Backend tests
   npm run test:backend

   # Frontend tests
   npm test

   # E2E tests (requires servers running)
   npm run test:e2e
   ```

## Debugging Tests

### Backend Tests
```bash
# Debug specific test
npm run test:backend -- --testNamePattern="token exchange"

# Run with verbose output
npm run test:backend -- --verbose
```

### Frontend Tests
```bash
# Debug with UI
npm run test:ui

# Run specific test file
npm test Card.test.tsx
```

### E2E Tests
```bash
# Debug mode
npm run test:e2e:debug

# Run headed (visible browser)
npm run test:e2e:headed -- --grep "specific test name"
```

## Test Coverage

The testing suite provides comprehensive coverage:

- **Backend APIs**: All 13 API endpoints tested
- **Frontend Components**: Core UI components tested
- **OAuth Flows**: All major OAuth 2.0 and OIDC flows
- **Error Handling**: Error scenarios and edge cases
- **UI Interactions**: User interaction patterns
- **Integration**: Frontend-backend communication
- **Performance**: Lighthouse performance metrics
- **Security**: Basic security scanning

## Contributing to Tests

When adding new features:

1. Add corresponding unit tests
2. Add E2E tests for user-facing features
3. Update test data fixtures as needed
4. Ensure CI/CD pipeline passes
5. Update this documentation

For backend API changes:
- Add tests in `tests/backend/`
- Mock external dependencies
- Test error scenarios

For frontend changes:
- Add tests in `src/**/__tests__/`
- Use React Testing Library
- Test accessibility features

For E2E changes:
- Add tests in `e2e/tests/`
- Test complete user workflows
- Include error handling scenarios
