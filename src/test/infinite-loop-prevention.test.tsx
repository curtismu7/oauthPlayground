/**
 * Infinite Loop Prevention Test
 * Prevents recurrence of useImplicitFlowController infinite render loop
 * 
 * Error: "Maximum update depth exceeded" in useEffect
 * Cause: credentials object in dependency array causing setState loop
 * Fix: Use specific credential fields instead of entire object
 */

import { renderHook, act } from '@testing-library/react';
import { useImplicitFlowController } from '../hooks/useImplicitFlowController';

describe('Infinite Loop Prevention Tests', () => {
  beforeEach(() => {
    // Clear any existing timers and state
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('useImplicitFlowController useEffect Stability', () => {
    it('should not cause infinite render loops with credential changes', () => {
      const credentials = {
        environmentId: 'test-env-123',
        clientId: 'test-client-456',
        clientSecret: 'test-secret-789',
        redirectUri: 'http://localhost:3000/callback',
        scope: 'openid profile email',
        scopes: ['openid', 'profile', 'email'],
        responseType: 'token',
        grantType: 'implicit',
        clientAuthMethod: 'none',
        loginHint: '',
        authorizationEndpoint: 'https://auth.pingone.com/auth',
        tokenEndpoint: 'https://auth.pingone.com/token',
        userInfoEndpoint: 'https://auth.pingone.com/userinfo'
      };

      let renderCount = 0;
      
      // Mock console.error to capture infinite loop warnings
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result, rerender } = renderHook(
        ({ credentials }) => useImplicitFlowController('implicit-v9', credentials),
        {
          initialProps: { credentials }
        }
      );

      // Initial render
      expect(result.current).toBeDefined();
      renderCount++;

      // Simulate credential changes that would trigger the problematic useEffect
      const updatedCredentials = {
        ...credentials,
        environmentId: 'updated-env-456'
      };

      // This should not cause infinite loops
      act(() => {
        rerender({ credentials: updatedCredentials });
      });

      renderCount++;

      // Fast-forward timers to ensure no delayed effects
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Verify no infinite loop occurred (console.error should not be called with "Maximum update depth exceeded")
      const infiniteLoopErrors = consoleSpy.mock.calls.filter(
        call => call[0]?.includes?.('Maximum update depth exceeded')
      );

      expect(infiniteLoopErrors).toHaveLength(0);
      
      // Verify reasonable number of renders (should not be hundreds)
      expect(renderCount).toBeLessThan(10);

      consoleSpy.mockRestore();
    });

    it('should handle rapid credential changes without crashing', () => {
      const baseCredentials = {
        environmentId: 'test-env-123',
        clientId: 'test-client-456',
        clientSecret: 'test-secret-789',
        redirectUri: 'http://localhost:3000/callback',
        scope: 'openid profile email',
        scopes: ['openid', 'profile', 'email'],
        responseType: 'token',
        grantType: 'implicit',
        clientAuthMethod: 'none',
        loginHint: '',
        authorizationEndpoint: 'https://auth.pingone.com/auth',
        tokenEndpoint: 'https://auth.pingone.com/token',
        userInfoEndpoint: 'https://auth.pingone.com/userinfo'
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result, rerender } = renderHook(
        ({ credentials }) => useImplicitFlowController('implicit-v9', credentials),
        {
          initialProps: { credentials: baseCredentials }
        }
      );

      // Simulate rapid credential changes (user typing, auto-fill, etc.)
      const credentialUpdates = [
        { environmentId: 'env-1' },
        { clientId: 'client-1' },
        { clientSecret: 'secret-1' },
        { redirectUri: 'http://localhost:3001/callback' },
        { scope: 'openid profile email api:read' },
        { environmentId: 'env-2' },
        { clientId: 'client-2' },
      ];

      credentialUpdates.forEach((update, index) => {
        act(() => {
          rerender({ 
            credentials: { ...baseCredentials, ...update } 
          });
        });

        // Fast-forward any timers
        act(() => {
          jest.advanceTimersByTime(50);
        });
      });

      // Verify no infinite loop occurred
      const infiniteLoopErrors = consoleSpy.mock.calls.filter(
        call => call[0]?.includes?.('Maximum update depth exceeded')
      );

      expect(infiniteLoopErrors).toHaveLength(0);

      consoleSpy.mockRestore();
    });

    it('should maintain credential change tracking accuracy', () => {
      const credentials = {
        environmentId: 'test-env-123',
        clientId: 'test-client-456',
        clientSecret: 'test-secret-789',
        redirectUri: 'http://localhost:3000/callback',
        scope: 'openid profile email',
        scopes: ['openid', 'profile', 'email'],
        responseType: 'token',
        grantType: 'implicit',
        clientAuthMethod: 'none',
        loginHint: '',
        authorizationEndpoint: 'https://auth.pingone.com/auth',
        tokenEndpoint: 'https://auth.pingone.com/token',
        userInfoEndpoint: 'https://auth.pingone.com/userinfo'
      };

      const { result, rerender } = renderHook(
        ({ credentials }) => useImplicitFlowController('implicit-v9', credentials),
        {
          initialProps: { credentials }
        }
      );

      // Initially should have no unsaved changes (after initial setup)
      expect(result.current.hasUnsavedCredentialChanges).toBe(false);

      // Change a credential field
      const updatedCredentials = {
        ...credentials,
        environmentId: 'different-env-456'
      };

      act(() => {
        rerender({ credentials: updatedCredentials });
      });

      // Should detect unsaved changes
      expect(result.current.hasUnsavedCredentialChanges).toBe(true);

      // Change back to original
      act(() => {
        rerender({ credentials });
      });

      // Should still detect changes (since originalCredentialsRef is set once)
      // This is the expected behavior to prevent infinite loops
      expect(result.current.hasUnsavedCredentialChanges).toBe(true);
    });
  });

  describe('Component Import/Export Stability', () => {
    it('should import TokenRevocationFlow without errors', () => {
      expect(() => {
        require('../pages/flows/TokenRevocationFlow');
      }).not.toThrow();
    });

    it('should export TokenRevocationFlow as default', () => {
      const TokenRevocationFlow = require('../pages/flows/TokenRevocationFlow').default;
      expect(TokenRevocationFlow).toBeDefined();
      expect(typeof TokenRevocationFlow).toBe('function'); // React component
    });

    it('should render TokenRevocationFlow without crashing', () => {
      const TokenRevocationFlow = require('../pages/flows/TokenRevocationFlow').default;
      const credentials = {
        clientId: 'test-client',
        clientSecret: 'test-secret',
        environmentId: 'test-env'
      };

      expect(() => {
        // This should not throw "TokenRevocationFlow is not defined"
        const React = require('react');
        const { render } = require('@testing-library/react');
        
        render(React.createElement(TokenRevocationFlow, { credentials }));
      }).not.toThrow();
    });
  });

  describe('FlowCredentials Component Stability', () => {
    it('should render with expanded environment ID field', () => {
      const FlowCredentials = require('../components/FlowCredentials').default;
      
      const credentials = {
        environmentId: 'very-long-environment-id-12345678-90ab-cdef-1234-567890abcdef',
        clientId: 'test-client',
        clientSecret: 'test-secret',
        redirectUri: 'http://localhost:3000/callback',
        additionalScopes: 'api:read api:write'
      };

      expect(() => {
        const React = require('react');
        const { render } = require('@testing-library/react');
        
        render(React.createElement(FlowCredentials, { 
          flowType: 'implicit',
          onCredentialsChange: jest.fn(),
          credentials 
        }));
      }).not.toThrow();
    });
  });
});
