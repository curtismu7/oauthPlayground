/**
 * @file jest.config.mfa.js
 * @module apps/mfa
 * @description Jest configuration for MFA testing
 * @version 8.0.0
 * @since 2026-02-20
 */

export default {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/src/apps/mfa/tests/setup.ts'
  ],
  
  // Test file patterns
  testMatch: [
    '<rootDir>/src/apps/mfa/**/*.test.ts',
    '<rootDir>/src/apps/mfa/**/*.test.tsx',
    '<rootDir>/src/apps/mfa/**/*.spec.ts',
    '<rootDir>/src/apps/mfa/**/*.spec.tsx'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/apps/mfa/**/*.{ts,tsx}',
    '!src/apps/mfa/**/*.d.ts',
    '!src/apps/mfa/**/*.test.{ts,tsx}',
    '!src/apps/mfa/**/*.spec.{ts,tsx}',
    '!src/apps/mfa/**/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/apps/mfa/services/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/apps/mfa/components/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  
  // Module path mapping
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/apps/(.*)$': '<rootDir>/src/apps/$1',
    '^@/shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@/v8/(.*)$': '<rootDir>/src/v8/$1'
  },
  
  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Test timeout
  testTimeout: 10000,
  
  // Verbose output
  verbose: true,
  
  // Global setup and teardown
  globalSetup: '<rootDir>/src/apps/mfa/tests/globalSetup.ts',
  globalTeardown: '<rootDir>/src/apps/mfa/tests/globalTeardown.ts',
  
  // Mock configuration
  clearMocks: true,
  restoreMocks: true,
  
  // Environment variables
  testEnvironmentOptions: {
    url: 'http://localhost:3000'
  }
};
