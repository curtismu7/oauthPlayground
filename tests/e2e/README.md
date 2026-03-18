# Playwright Testing Guide

## Quick Start

### 1. Run Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test tests/e2e/unified-mfa.spec.ts

# Run with UI for debugging
npm run test:e2e:ui
```

### 2. Development Mode
```bash
# UI Mode - Interactive testing
npx playwright test --ui

# Debug Mode - Step through tests
npx playwright test --debug

# Headed Mode - See browser actions
npx playwright test --headed
```

### 3. Test Reports
```bash
# View HTML report
npm run test:e2e:report

# Generate coverage report
npx playwright test --coverage
```

## Writing Tests

### Basic Test Structure
```typescript
import { test, expect } from '@playwright/test';

test('my test', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page).toHaveTitle(/My App/);
});
```

### Common Actions
```typescript
// Navigation
await page.goto('/login');

// Click elements
await page.getByText('Submit').click();
await page.locator('button[type="submit"]').click();

// Fill forms
await page.getByLabel('Email').fill('test@example.com');
await page.locator('input[name="password"]').fill('password123');

// Wait for elements
await expect(page.getByText('Success')).toBeVisible();
await page.waitForSelector('.loading', { state: 'hidden' });
```

### Best Practices
1. **Use data-testid** for stable selectors
2. **Wait for elements** instead of fixed timeouts
3. **Group related tests** with test.describe()
4. **Use beforeEach** for common setup
5. **Test multiple browsers** (Chrome, Firefox, Safari)

## Configuration

### playwright.config.ts
```typescript
export default defineConfig({
  testDir: './tests/e2e',
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm start',
    url: 'http://localhost:3000',
  },
});
```

## Debugging

### UI Mode
```bash
npx playwright test --ui
```
- Interactive test runner
- Click any test to run it
- See live browser actions
- Inspect DOM and network

### Debug Mode
```bash
npx playwright test --debug
```
- Pauses at each step
- Shows browser devtools
- Step through code line by line

### VS Code Integration
- Install Playwright VS Code extension
- Run tests directly from editor
- Set breakpoints in test files

## Common Patterns

### Form Testing
```typescript
test('form submission', async ({ page }) => {
  await page.goto('/contact');
  
  // Fill form
  await page.getByLabel('Name').fill('John Doe');
  await page.getByLabel('Email').fill('john@example.com');
  await page.getByLabel('Message').fill('Hello World');
  
  // Submit
  await page.getByRole('button', { name: 'Send' }).click();
  
  // Verify success
  await expect(page.getByText('Message sent!')).toBeVisible();
});
```

### API Testing
```typescript
test('API integration', async ({ page }) => {
  // Mock API response
  await page.route('/api/users', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ id: 1, name: 'John' }])
    });
  });
  
  await page.goto('/users');
  await expect(page.getByText('John')).toBeVisible();
});
```

### Mobile Testing
```typescript
test('mobile view', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  
  // Test mobile-specific behavior
  await expect(page.getByRole('button', { name: 'Menu' })).toBeVisible();
});
```

## Troubleshooting

### Common Issues
1. **Timeout errors** - Increase timeout or use better selectors
2. **Element not found** - Use waitForSelector() instead of immediate checks
3. **Flaky tests** - Add proper waits and avoid race conditions
4. **Server not running** - Start dev server before running tests

### Debug Tips
```typescript
// Take screenshot on failure
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    await page.screenshot({ path: `failure-${testInfo.title}.png` });
  }
});

// Console logging
test('debug test', async ({ page }) => {
  page.on('console', msg => console.log(msg.text()));
  await page.goto('/');
});
```

## Advanced Features

### Page Object Model
```typescript
export class LoginPage {
  constructor(private page: Page) {}

  async login(username: string, password: string) {
    await this.page.getByLabel('Username').fill(username);
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: 'Login' }).click();
  }
}

test('login with POM', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('admin', 'password');
});
```

### Custom Matchers
```typescript
import { expect } from '@playwright/test';

expect.extend({
  async toHaveAccessibleError(received: Page) {
    const error = received.getByRole('alert');
    const isVisible = await error.isVisible();
    return {
      pass: isVisible,
      message: () => `Expected ${isVisible ? 'not ' : ''}to have accessible error`,
    };
  }
});

test('accessibility', async ({ page }) => {
  await page.goto('/form');
  await expect(page).toHaveAccessibleError();
});
```

## Running Tests

### Before Running Tests
1. **Start dev server**: `npm start`
2. **Install browsers**: `npx playwright install`
3. **Check configuration**: Verify playwright.config.ts

### CI/CD Integration
```yaml
# GitHub Actions example
- name: Playwright Tests
  run: npx playwright test
- uses: actions/upload-artifact@v3
  if: always()
  with:
    name: playwright-report
    path: playwright-report/
```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [VS Code Extension](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Trace Viewer](https://playwright.dev/docs/trace-viewer)
