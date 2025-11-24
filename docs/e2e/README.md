# Automated UI Testing for OAuth Playground

This directory contains comprehensive automated UI tests for the OAuth Playground application using Playwright.

## Test Structure

```
e2e/
├── fixtures/           # Page object models and test fixtures
│   └── page-objects.ts # Reusable page object classes
├── tests/              # Test suites organized by functionality
│   ├── oauth-flows/    # OAuth and OIDC flow tests
│   │   ├── oauth-2-flows.spec.ts     # OAuth 2.0 flows
│   │   ├── oidc-flows.spec.ts        # OpenID Connect flows
│   │   └── pingone-flows.spec.ts     # PingOne-specific flows
│   ├── navigation/     # UI navigation and interaction tests
│   │   └── ui-navigation.spec.ts
│   └── configuration/  # Configuration and settings tests
│       └── config-validation.spec.ts
└── utils/              # Test utilities and helpers
    └── test-helpers.ts # Common test functions and mocks
```

## Running Tests

### Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install
```

### Test Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI mode (visual test runner)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug

# View test reports
npm run test:e2e:report

# Run specific test file
npx playwright test e2e/tests/oauth-flows/oauth-2-flows.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium
```

## Test Coverage

### OAuth 2.0 Flows
- ✅ Authorization Code Flow (with/without PKCE)
- ✅ Implicit Flow (ID Token, Access Token, Hybrid)
- ✅ Client Credentials Flow
- ✅ Device Authorization Flow
- ✅ Token refresh and revocation

### OpenID Connect Flows
- ✅ OIDC Authorization Code Flow
- ✅ OIDC Implicit Flow variants
- ✅ OIDC Hybrid Flow
- ✅ OIDC Device Authorization Flow
- ✅ OIDC Resource Owner Password Flow
- ✅ OIDC Session Management
- ✅ OIDC Discovery

### PingOne-Specific Flows
- ✅ PAR (Pushed Authorization Requests) Flow
- ✅ Worker Token Flow
- ✅ CIBA (Client-Initiated Backchannel Authentication) Flow
- ✅ Redirectless Flow
- ✅ MFA Test Flow
- ✅ RAR (Rich Authorization Requests) Flow

### UI and Navigation
- ✅ Sidebar menu persistence across refreshes
- ✅ Navigation between flow categories
- ✅ Responsive design (mobile/desktop)
- ✅ Dashboard functionality
- ✅ Search and filter features
- ✅ Error handling and user feedback
- ✅ Loading states and performance

### Configuration
- ✅ PingOne configuration validation
- ✅ Configuration persistence
- ✅ Environment variable overrides
- ✅ Security settings (PKCE, state, nonce)
- ✅ Advanced configuration options

## Test Configuration

The tests are configured in `playwright.config.ts` with:

- **Base URL**: `http://localhost:3000`
- **Automatic server startup**: Both frontend (port 3000) and backend (port 3001)
- **Multiple browsers**: Chromium, Firefox, WebKit
- **Mobile testing**: Pixel 5 and iPhone 12 viewports
- **Parallel execution**: Tests run in parallel for speed
- **Artifacts**: Screenshots, videos, and traces on failure

## Mock OAuth Server

Tests use a mock OAuth server that intercepts and responds to OAuth endpoints:

- `/oauth2/token` - Returns mock access tokens
- `/oauth2/authorize` - Handles authorization redirects
- Custom responses for different flow types

## Page Object Model

The tests use a Page Object Model pattern for maintainability:

- `BasePage` - Common functionality
- `DashboardPage` - Dashboard interactions
- `ConfigurationPage` - Settings management
- `OAuthFlowPage` - Generic OAuth flow interactions
- `AuthorizationCodeFlowPage` - Specific flow implementations
- `SidebarPage` - Navigation controls

## Test Data

Tests use realistic but mock data:
- Environment IDs: `test-env-123`
- Client IDs: `test-client-123`
- Redirect URIs: `http://localhost:3000/callback`
- Scopes: `openid profile email`

## CI/CD Integration

The test suite is designed for CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run E2E Tests
  run: npm run test:e2e
- name: Upload test results
  uses: actions/upload-artifact@v3
  with:
    name: test-results
    path: test-results/
```

## Debugging Tests

### Visual Debugging
```bash
# Run with browser visible
npm run test:e2e:headed

# Use Playwright UI mode
npm run test:e2e:ui
```

### Debug Mode
```bash
# Step through tests
npm run test:e2e:debug
```

### Test Reports
```bash
# View HTML report
npm run test:e2e:report
```

## Best Practices

1. **Isolation**: Each test is independent with proper setup/teardown
2. **Realistic Data**: Use realistic test data that matches production
3. **Page Objects**: Use page objects for reusable UI interactions
4. **Mock Services**: Mock external dependencies for reliable tests
5. **Parallel Execution**: Tests run in parallel for efficiency
6. **Cross-Browser**: Test across multiple browsers
7. **Mobile Testing**: Include mobile viewport tests
8. **Accessibility**: Tests verify basic accessibility features

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000 and 3001 are available
2. **Slow tests**: Check network connectivity for browser downloads
3. **Flaky tests**: Use proper wait strategies and stable selectors
4. **Browser issues**: Clear browser cache or reinstall browsers

### Performance Tips

1. Use `page.waitForLoadState('networkidle')` for dynamic content
2. Prefer `data-testid` attributes over CSS selectors
3. Use `page.locator()` for better performance
4. Run tests in parallel when possible

## Contributing

When adding new tests:

1. Follow the existing file structure
2. Use page objects for UI interactions
3. Add appropriate test data
4. Include both positive and negative test cases
5. Update this README with new test coverage