// src/contexts/__tests__/NewAuthContext.enhanced.test.tsx
// Tests for enhanced NewAuthContext with FlowContextService integration

import React from 'react';
import { render, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth } from '../NewAuthContext';
import FlowContextUtils from '../../services/flowContextUtils';

// Mock FlowContextUtils
jest.mock('../../services/flowContextUtils');
const mockFlowContextUtils = FlowContextUtils as jest.Mocked<typeof FlowContextUtils>;

// Mock sessionStorage
const mockSessionStorage = {
  store: {} as Record<string, string>,
  getItem: jest.fn((key: string) => mockSessionStorage.store[key] || null),
  setItem: jest.fn((key: string, value: string) => {
    mockSessionStorage.store[key] = value;
  }),
  removeItem: jest.fn((key: string) => {
    delete mockSessionStorage.store[key];
  }),
  clear: jest.fn(() => {
    mockSessionStorage.store = {};
  })
};

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    origin: 'https://localhost:3000',
    href: 'https://localhost:3000'
  }
});

// Test component to access auth context
const TestComponent: React.FC = () => {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="auth-status">{auth.isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      <div data-testid="has-flow-helpers">{auth.initializeFlowContext ? 'yes' : 'no'}</div>
      <button 
        data-testid="init-flow" 
        onClick={() => auth.initializeFlowContext('test-flow', 1, {})}
      >
        Initialize Flow
      </button>
      <button 
        data-testid="complete-flow" 
        onClick={() => auth.completeFlow('test-flow')}
      >
        Complete Flow
      </button>
    </div>
  );
};

describe('Enhanced NewAuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionStorage.clear();
    
    // Setup default mock implementations
    mockFlowContextUtils.handleOAuthCallback.mockReturnValue({
      success: true,
      redirectUrl: '/flows/test-flow'
    });
    
    mockFlowContextUtils.initializeOAuthFlow.mockReturnValue('test-flow-id');
    mockFlowContextUtils.updateFlowStep.mockReturnValue(true);
    mockFlowContextUtils.completeFlow.mockImplementation(() => {});
    mockFlowContextUtils.getCurrentFlow.mockReturnValue({
      flowType: 'test-flow',
      currentStep: 1,
      returnPath: '/flows/test-flow',
      age: 1000
    });
    mockFlowContextUtils.emergencyCleanup.mockImplementation(() => {});
  });

  describe('Flow Context Helper Functions', () => {
    it('should provide flow context helper functions', () => {
      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(getByTestId('has-flow-helpers')).toHaveTextContent('yes');
    });

    it('should initialize flow context', async () => {
      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await act(async () => {
        getByTestId('init-flow').click();
      });

      expect(mockFlowContextUtils.initializeOAuthFlow).toHaveBeenCalledWith(
        'test-flow',
        1,
        {},
        undefined
      );
    });

    it('should complete flow', async () => {
      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await act(async () => {
        getByTestId('complete-flow').click();
      });

      expect(mockFlowContextUtils.completeFlow).toHaveBeenCalledWith('test-flow');
    });
  });

  describe('Enhanced Callback Handling', () => {
    it('should use FlowContextUtils for callback handling', async () => {
      let authContext: any;
      
      const TestCallbackComponent: React.FC = () => {
        authContext = useAuth();
        return <div>Test</div>;
      };

      render(
        <AuthProvider>
          <TestCallbackComponent />
        </AuthProvider>
      );

      // Simulate OAuth callback
      const callbackUrl = 'https://localhost:3000/authz-callback?code=test-code&state=test-state';
      
      await act(async () => {
        const result = await authContext.handleCallback(callbackUrl);
        expect(result.success).toBe(true);
        expect(result.redirectUrl).toBe('/flows/test-flow');
      });

      expect(mockFlowContextUtils.handleOAuthCallback).toHaveBeenCalledWith({
        code: 'test-code',
        state: 'test-state',
        error: undefined,
        error_description: undefined,
        session_state: null,
        iss: null
      });
    });

    it('should handle FlowContextUtils errors gracefully', async () => {
      // Mock FlowContextUtils to throw an error
      mockFlowContextUtils.handleOAuthCallback.mockImplementation(() => {
        throw new Error('FlowContextService error');
      });

      // Mock legacy flow context
      mockSessionStorage.store['flowContext'] = JSON.stringify({
        returnPath: '/flows/legacy-flow',
        flowType: 'legacy'
      });

      let authContext: any;
      
      const TestCallbackComponent: React.FC = () => {
        authContext = useAuth();
        return <div>Test</div>;
      };

      render(
        <AuthProvider>
          <TestCallbackComponent />
        </AuthProvider>
      );

      const callbackUrl = 'https://localhost:3000/authz-callback?code=test-code&state=test-state';
      
      await act(async () => {
        const result = await authContext.handleCallback(callbackUrl);
        expect(result.success).toBe(true);
        expect(result.redirectUrl).toBe('/flows/legacy-flow');
      });

      // Should have attempted FlowContextUtils first
      expect(mockFlowContextUtils.handleOAuthCallback).toHaveBeenCalled();
    });

    it('should fallback to dashboard for invalid flow context', async () => {
      // Mock FlowContextUtils to throw an error
      mockFlowContextUtils.handleOAuthCallback.mockImplementation(() => {
        throw new Error('FlowContextService error');
      });

      // Mock invalid flow context
      mockSessionStorage.store['flowContext'] = 'invalid-json';

      let authContext: any;
      
      const TestCallbackComponent: React.FC = () => {
        authContext = useAuth();
        return <div>Test</div>;
      };

      render(
        <AuthProvider>
          <TestCallbackComponent />
        </AuthProvider>
      );

      const callbackUrl = 'https://localhost:3000/authz-callback?code=test-code&state=test-state';
      
      await act(async () => {
        const result = await authContext.handleCallback(callbackUrl);
        expect(result.success).toBe(true);
        expect(result.redirectUrl).toBe('/dashboard');
      });
    });

    it('should handle OAuth errors in callback', async () => {
      let authContext: any;
      
      const TestCallbackComponent: React.FC = () => {
        authContext = useAuth();
        return <div>Test</div>;
      };

      render(
        <AuthProvider>
          <TestCallbackComponent />
        </AuthProvider>
      );

      const callbackUrl = 'https://localhost:3000/authz-callback?error=access_denied&error_description=User%20denied%20access';
      
      await act(async () => {
        const result = await authContext.handleCallback(callbackUrl);
        expect(result.success).toBe(false);
        expect(result.error).toBe('User denied access');
      });
    });
  });

  describe('Enhanced Logout', () => {
    it('should cleanup flow context during logout', async () => {
      let authContext: any;
      
      const TestLogoutComponent: React.FC = () => {
        authContext = useAuth();
        return <div>Test</div>;
      };

      render(
        <AuthProvider>
          <TestLogoutComponent />
        </AuthProvider>
      );

      await act(async () => {
        authContext.logout();
      });

      expect(mockFlowContextUtils.emergencyCleanup).toHaveBeenCalled();
    });

    it('should handle flow cleanup errors gracefully', async () => {
      // Mock emergency cleanup to throw an error
      mockFlowContextUtils.emergencyCleanup.mockImplementation(() => {
        throw new Error('Cleanup error');
      });

      let authContext: any;
      
      const TestLogoutComponent: React.FC = () => {
        authContext = useAuth();
        return <div>Test</div>;
      };

      render(
        <AuthProvider>
          <TestLogoutComponent />
        </AuthProvider>
      );

      // Should not throw error
      await act(async () => {
        expect(() => authContext.logout()).not.toThrow();
      });

      expect(mockFlowContextUtils.emergencyCleanup).toHaveBeenCalled();
    });
  });

  describe('Security Features', () => {
    it('should reject dangerous flow context content', async () => {
      // Mock FlowContextUtils to throw an error to test fallback
      mockFlowContextUtils.handleOAuthCallback.mockImplementation(() => {
        throw new Error('FlowContextService error');
      });

      // Mock dangerous flow context
      mockSessionStorage.store['flowContext'] = JSON.stringify({
        returnPath: 'javascript:alert("xss")',
        flowType: 'malicious'
      });

      let authContext: any;
      
      const TestCallbackComponent: React.FC = () => {
        authContext = useAuth();
        return <div>Test</div>;
      };

      render(
        <AuthProvider>
          <TestCallbackComponent />
        </AuthProvider>
      );

      const callbackUrl = 'https://localhost:3000/authz-callback?code=test-code&state=test-state';
      
      await act(async () => {
        const result = await authContext.handleCallback(callbackUrl);
        expect(result.success).toBe(true);
        expect(result.redirectUrl).toBe('/dashboard'); // Should fallback to safe default
      });
    });

    it('should reject oversized flow context', async () => {
      // Mock FlowContextUtils to throw an error to test fallback
      mockFlowContextUtils.handleOAuthCallback.mockImplementation(() => {
        throw new Error('FlowContextService error');
      });

      // Mock oversized flow context
      const largeContext = {
        returnPath: '/flows/test',
        flowType: 'test',
        largeData: 'x'.repeat(15000) // Large data
      };
      mockSessionStorage.store['flowContext'] = JSON.stringify(largeContext);

      let authContext: any;
      
      const TestCallbackComponent: React.FC = () => {
        authContext = useAuth();
        return <div>Test</div>;
      };

      render(
        <AuthProvider>
          <TestCallbackComponent />
        </AuthProvider>
      );

      const callbackUrl = 'https://localhost:3000/authz-callback?code=test-code&state=test-state';
      
      await act(async () => {
        const result = await authContext.handleCallback(callbackUrl);
        expect(result.success).toBe(true);
        expect(result.redirectUrl).toBe('/dashboard'); // Should fallback to safe default
      });
    });
  });
});