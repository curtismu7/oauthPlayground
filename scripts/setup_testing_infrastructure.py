#!/usr/bin/env python3
"""
Testing Infrastructure Setup Script

This script sets up a comprehensive testing infrastructure including:
1. Unit testing framework configuration
2. Integration testing setup
3. E2E testing capabilities
4. Test coverage reporting
5. CI/CD integration
"""

import os
import subprocess
import json
from pathlib import Path
from typing import Dict, List, Any

# Configuration
PROJECT_ROOT = Path(".")
SRC_DIR = PROJECT_ROOT / "src"
TESTS_DIR = PROJECT_ROOT / "tests"

class TestingInfrastructureSetup:
    def __init__(self):
        self.test_configs = {}
        self.packages_to_install = []
        
    def analyze_project_structure(self) -> Dict[str, Any]:
        """Analyze project structure to determine testing needs"""
        analysis = {
            "react_components": 0,
            "services": 0,
            "utils": 0,
            "pages": 0,
            "hooks": 0,
            "types": 0
        }
        
        if SRC_DIR.exists():
            for file_path in SRC_DIR.rglob("*"):
                if file_path.is_file() and file_path.suffix in {".ts", ".tsx"}:
                    if "components" in str(file_path):
                        analysis["react_components"] += 1
                    elif "services" in str(file_path):
                        analysis["services"] += 1
                    elif "utils" in str(file_path):
                        analysis["utils"] += 1
                    elif "pages" in str(file_path):
                        analysis["pages"] += 1
                    elif "hooks" in str(file_path):
                        analysis["hooks"] += 1
                    elif "types" in str(file_path):
                        analysis["types"] += 1
                        
        return analysis
    
    def create_jest_config(self) -> str:
        """Create Jest configuration for React + TypeScript testing"""
        config = {
            "preset": "ts-jest",
            "testEnvironment": "jsdom",
            "setupFilesAfterEnv": ["<rootDir>/tests/setup.ts"],
            "moduleNameMapping": {
                "^@/(.*)$": "<rootDir>/src/$1",
                "^@components/(.*)$": "<rootDir>/src/components/$1",
                "^@services/(.*)$": "<rootDir>/src/services/$1",
                "^@utils/(.*)$": "<rootDir>/src/utils/$1",
                "^@hooks/(.*)$": "<rootDir>/src/hooks/$1",
                "^@types/(.*)$": "<rootDir>/src/types/$1"
            },
            "collectCoverageFrom": [
                "src/**/*.{ts,tsx}",
                "!src/**/*.d.ts",
                "!src/**/*.stories.{ts,tsx}",
                "!src/**/index.ts"
            ],
            "coverageThreshold": {
                "global": {
                    "branches": 70,
                    "functions": 70,
                    "lines": 70,
                    "statements": 70
                }
            },
            "testMatch": [
                "<rootDir>/tests/**/__tests__/**/*.{ts,tsx}",
                "<rootDir>/tests/**/*.{test,spec}.{ts,tsx}"
            ],
            "transform": {
                "^.+\\.(ts|tsx)$": "ts-jest"
            },
            "moduleFileExtensions": ["ts", "tsx", "js", "jsx", "json"]
        }
        
        return json.dumps(config, indent=2)
    
    def create_vitest_config(self) -> str:
        """Create Vitest configuration (modern alternative to Jest)"""
        config = """import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.stories.{ts,tsx}',
        '**/index.ts'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@types': path.resolve(__dirname, './src/types')
    }
  }
})"""
        
        return config
    
    def create_test_setup_file(self) -> str:
        """Create test setup file with global configurations"""
        setup = """import '@testing-library/jest-dom'
import { configure } from '@testing-library/react'

// Configure React Testing Library
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 5000,
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock console methods in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}"""
        
        return setup
    
    def create_package_json_test_scripts(self) -> Dict[str, str]:
        """Create test scripts for package.json"""
        return {
            "test": "vitest",
            "test:ui": "vitest --ui",
            "test:coverage": "vitest --coverage",
            "test:watch": "vitest --watch",
            "test:run": "vitest run",
            "test:e2e": "playwright test",
            "test:e2e:ui": "playwright test --ui",
            "test:e2e:debug": "playwright test --debug"
        }
    
    def create_test_directories(self) -> List[str]:
        """Create test directory structure"""
        directories = [
            "tests",
            "tests/unit",
            "tests/integration",
            "tests/e2e",
            "tests/__mocks__",
            "tests/fixtures",
            "tests/utils"
        ]
        
        return directories
    
    def create_component_test_template(self) -> str:
        """Create template for component testing"""
        template = """import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ComponentName } from '@/components/ComponentName'

// Mock dependencies
vi.mock('@/services/someService', () => ({
  default: {
    someMethod: vi.fn()
  }
}))

describe('ComponentName', () => {
  const defaultProps = {
    // Define default props here
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(<ComponentName {...defaultProps} />)
    // Add assertions
  })

  it('displays correct content', () => {
    render(<ComponentName {...defaultProps} />)
    expect(screen.getByText('some text')).toBeInTheDocument()
  })

  it('handles user interactions correctly', async () => {
    const mockCallback = vi.fn()
    render(<ComponentName {...defaultProps} onClick={mockCallback} />)
    
    fireEvent.click(screen.getByRole('button'))
    
    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalledOnce()
    })
  })

  it('shows loading state', () => {
    render(<ComponentName {...defaultProps} loading={true} />)
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('handles error state', () => {
    render(<ComponentName {...defaultProps} error="Something went wrong" />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })
})"""
        
        return template
    
    def create_service_test_template(self) -> str:
        """Create template for service testing"""
        template = """import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ServiceName } from '@/services/ServiceName'

// Mock external dependencies
vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}))

describe('ServiceName', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('methodName', () => {
    it('should return expected result', async () => {
      // Arrange
      const input = 'test input'
      const expected = 'expected output'

      // Act
      const result = await ServiceName.methodName(input)

      // Assert
      expect(result).toBe(expected)
    })

    it('should handle errors gracefully', async () => {
      // Arrange
      const errorInput = 'invalid input'

      // Act & Assert
      await expect(ServiceName.methodName(errorInput)).rejects.toThrow()
    })

    it('should call logger with correct parameters', async () => {
      // Arrange
      const { logger } = await import('@/utils/logger')

      // Act
      await ServiceName.methodName('test')

      // Assert
      expect(logger.info).toHaveBeenCalledWith('ServiceName.methodName called', expect.any(Object))
    })
  })

  describe('anotherMethod', () => {
    it('should perform correctly', () => {
      // Test implementation
    })
  })
})"""
        
        return template
    
    def create_playwright_config(self) -> str:
        """Create Playwright configuration for E2E testing"""
        config = """import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})"""
        
        return config
    
    def create_e2e_test_template(self) -> str:
        """Create template for E2E testing"""
        template = """import { test, expect } from '@playwright/test'

test.describe('OAuth Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should load main page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('MasterFlow API')
  })

  test('should navigate to OAuth flow', async ({ page }) => {
    await page.click('[data-testid="oauth-flow-link"]')
    await expect(page).toHaveURL('/oauth/authorization-code')
    await expect(page.locator('h2')).toContainText('Authorization Code Flow')
  })

  test('should handle form validation', async ({ page }) => {
    await page.goto('/oauth/authorization-code')
    
    // Try to submit without required fields
    await page.click('[data-testid="submit-button"]')
    
    // Should show validation errors
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible()
  })

  test('should complete OAuth flow successfully', async ({ page }) => {
    await page.goto('/oauth/authorization-code')
    
    // Fill in credentials
    await page.fill('[data-testid="client-id-input"]', 'test-client-id')
    await page.fill('[data-testid="environment-id-input"]', 'test-env-id')
    
    // Submit form
    await page.click('[data-testid="submit-button"]')
    
    // Should redirect to authorization page
    await expect(page).toHaveURL(/authorization/)
    
    // Should show authorization form
    await expect(page.locator('[data-testid="auth-form"]')).toBeVisible()
  })
})

test.describe('MFA Flow', () => {
  test('should load MFA device management', async ({ page }) => {
    await page.goto('/mfa/device-management')
    await expect(page.locator('h1')).toContainText('MFA Device Management')
  })

  test('should add new MFA device', async ({ page }) => {
    await page.goto('/mfa/device-management')
    
    await page.click('[data-testid="add-device-button"]')
    await page.selectOption('[data-testid="device-type-select"]', 'MOBILE')
    await page.fill('[data-testid="phone-number-input"]', '+1234567890')
    await page.click('[data-testid="register-device-button"]')
    
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Device registered successfully')
  })
})"""
        
        return template
    
    def create_ci_cd_workflow(self) -> str:
        """Create GitHub Actions workflow for CI/CD"""
        workflow = """name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run linting
      run: npm run lint

    - name: Run type checking
      run: npm run type-check

    - name: Run unit tests
      run: npm run test:coverage

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info

  e2e:
    runs-on: ubuntu-latest
    needs: test

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20.x'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Install Playwright
      run: npx playwright install --with-deps

    - name: Build application
      run: npm run build

    - name: Run E2E tests
      run: npm run test:e2e

    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: playwright-report
        path: playwright-report/"""
        
        return workflow
    
    def run(self) -> None:
        """Run the testing infrastructure setup"""
        print("🧪 Setting up Testing Infrastructure")
        print("=" * 50)
        
        # Analyze project structure
        analysis = self.analyze_project_structure()
        print(f"\n📊 Project Analysis:")
        for key, value in analysis.items():
            print(f"  {key}: {value}")
        
        # Create test directories
        print(f"\n📁 Creating test directories...")
        for directory in self.create_test_directories():
            dir_path = PROJECT_ROOT / directory
            dir_path.mkdir(parents=True, exist_ok=True)
            print(f"  ✅ Created {directory}")
        
        # Create configuration files
        print(f"\n⚙️ Creating configuration files...")
        
        # Vitest config
        vitest_config = PROJECT_ROOT / "vitest.config.ts"
        with open(vitest_config, 'w') as f:
            f.write(self.create_vitest_config())
        print(f"  ✅ Created vitest.config.ts")
        
        # Playwright config
        playwright_config = PROJECT_ROOT / "playwright.config.ts"
        with open(playwright_config, 'w') as f:
            f.write(self.create_playwright_config())
        print(f"  ✅ Created playwright.config.ts")
        
        # Test setup file
        setup_file = TESTS_DIR / "setup.ts"
        with open(setup_file, 'w') as f:
            f.write(self.create_test_setup_file())
        print(f"  ✅ Created tests/setup.ts")
        
        # Test templates
        component_template = TESTS_DIR / "unit" / "component.test.template.tsx"
        with open(component_template, 'w') as f:
            f.write(self.create_component_test_template())
        print(f"  ✅ Created component test template")
        
        service_template = TESTS_DIR / "unit" / "service.test.template.ts"
        with open(service_template, 'w') as f:
            f.write(self.create_service_test_template())
        print(f"  ✅ Created service test template")
        
        e2e_template = TESTS_DIR / "e2e" / "oauth-flow.spec.ts.template"
        with open(e2e_template, 'w') as f:
            f.write(self.create_e2e_test_template())
        print(f"  ✅ Created E2E test template")
        
        # CI/CD workflow
        workflow_dir = PROJECT_ROOT / ".github" / "workflows"
        workflow_dir.mkdir(parents=True, exist_ok=True)
        workflow_file = workflow_dir / "test.yml"
        with open(workflow_file, 'w') as f:
            f.write(self.create_ci_cd_workflow())
        print(f"  ✅ Created .github/workflows/test.yml")
        
        print(f"\n📦 Required packages to install:")
        packages = [
            "vitest",
            "@vitest/ui",
            "@vitest/coverage-v8",
            "@testing-library/react",
            "@testing-library/jest-dom",
            "@testing-library/user-event",
            "@playwright/test",
            "jsdom"
        ]
        
        for package in packages:
            print(f"  npm install --save-dev {package}")
        
        print(f"\n🎯 Next Steps:")
        print("1. Install required packages")
        print("2. Update package.json with test scripts")
        print("3. Run initial tests: npm run test")
        print("4. Write tests for critical components")
        print("5. Set up CI/CD pipeline")
        
        print(f"\n✅ Testing infrastructure setup complete!")

if __name__ == "__main__":
    setup = TestingInfrastructureSetup()
    setup.run()
