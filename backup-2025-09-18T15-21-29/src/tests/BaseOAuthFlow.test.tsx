/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseOAuthFlow, useOAuthFlowBase, getPingOneEnvVars } from '../components/BaseOAuthFlow';

// Mock the auth context
vi.mock('../contexts/NewAuthContext', () => ({
  useAuth: () => ({
    user: { email: 'test@example.com' },
    isAuthenticated: true
  })
}));

// Mock the logger
vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    success: vi.fn()
  }
}));

// Mock window object
const mockWindow = {
  __PINGONE_ENVIRONMENT_ID__: 'test-env-id',
  __PINGONE_API_URL__: 'https://test-api.com',
  __PINGONE_CLIENT_ID__: 'test-client-id'
};

Object.defineProperty(window, '__PINGONE_ENVIRONMENT_ID__', {
  value: mockWindow.__PINGONE_ENVIRONMENT_ID__,
  writable: true
});

Object.defineProperty(window, '__PINGONE_API_URL__', {
  value: mockWindow.__PINGONE_API_URL__,
  writable: true
});

Object.defineProperty(window, '__PINGONE_CLIENT_ID__', {
  value: mockWindow.__PINGONE_CLIENT_ID__,
  writable: true
});

describe('BaseOAuthFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with basic props', () => {
    render(
      <BaseOAuthFlow
        title="Test Flow"
        description="Test description"
        flowType="test-flow"
      >
        <div>Test content</div>
      </BaseOAuthFlow>
    );

    expect(screen.getByText('Test Flow')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should render with security warning', () => {
    render(
      <BaseOAuthFlow
        title="Test Flow"
        description="Test description"
        flowType="test-flow"
        securityWarning={{
          title: 'Security Warning',
          message: 'This is a security warning'
        }}
      >
        <div>Test content</div>
      </BaseOAuthFlow>
    );

    expect(screen.getByText('Security Warning')).toBeInTheDocument();
    expect(screen.getByText('This is a security warning')).toBeInTheDocument();
  });

  it('should render with use case highlight', () => {
    render(
      <BaseOAuthFlow
        title="Test Flow"
        description="Test description"
        flowType="test-flow"
        useCaseHighlight={{
          title: 'Use Case',
          message: 'This is a use case'
        }}
      >
        <div>Test content</div>
      </BaseOAuthFlow>
    );

    expect(screen.getByText('Use Case')).toBeInTheDocument();
    expect(screen.getByText('This is a use case')).toBeInTheDocument();
  });

  it('should render with info highlight', () => {
    render(
      <BaseOAuthFlow
        title="Test Flow"
        description="Test description"
        flowType="test-flow"
        infoHighlight={{
          title: 'Info',
          message: 'This is info'
        }}
      >
        <div>Test content</div>
      </BaseOAuthFlow>
    );

    expect(screen.getByText('Info')).toBeInTheDocument();
    expect(screen.getByText('This is info')).toBeInTheDocument();
  });

  it('should hide credentials when showCredentials is false', () => {
    render(
      <BaseOAuthFlow
        title="Test Flow"
        description="Test description"
        flowType="test-flow"
        showCredentials={false}
      >
        <div>Test content</div>
      </BaseOAuthFlow>
    );

    // FlowCredentials should not be rendered
    expect(screen.queryByText('Flow Credentials')).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <BaseOAuthFlow
        title="Test Flow"
        description="Test description"
        flowType="test-flow"
        className="custom-class"
      >
        <div>Test content</div>
      </BaseOAuthFlow>
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('useOAuthFlowBase', () => {
  it('should return initial state', () => {
    const TestComponent = () => {
      const { isLoading, error, user, isAuthenticated } = useOAuthFlowBase('test-flow');
      
      return (
        <div>
          <div data-testid="loading">{isLoading.toString()}</div>
          <div data-testid="error">{error || 'no-error'}</div>
          <div data-testid="user">{user?.email || 'no-user'}</div>
          <div data-testid="authenticated">{isAuthenticated.toString()}</div>
        </div>
      );
    };

    render(<TestComponent />);

    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
  });

  it('should handle error', () => {
    const TestComponent = () => {
      const { handleError, _error } = useOAuthFlowBase('test-flow');
      
      const handleClick = () => {
        handleError(new Error('Test error'), 'test context');
      };
      
      return (
        <div>
          <button onClick={handleClick}>Trigger Error</button>
          <div data-testid="error">{error || 'no-error'}</div>
        </div>
      );
    };

    render(<TestComponent />);

    expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    
    fireEvent.click(screen.getByText('Trigger Error'));
    
    expect(screen.getByTestId('error')).toHaveTextContent('Test error');
  });

  it('should clear error', () => {
    const TestComponent = () => {
      const { handleError, clearError, _error } = useOAuthFlowBase('test-flow');
      
      const handleErrorClick = () => {
        handleError(new Error('Test error'), 'test context');
      };
      
      const handleClearClick = () => {
        clearError();
      };
      
      return (
        <div>
          <button onClick={handleErrorClick}>Trigger Error</button>
          <button onClick={handleClearClick}>Clear Error</button>
          <div data-testid="error">{error || 'no-error'}</div>
        </div>
      );
    };

    render(<TestComponent />);

    fireEvent.click(screen.getByText('Trigger Error'));
    expect(screen.getByTestId('error')).toHaveTextContent('Test error');
    
    fireEvent.click(screen.getByText('Clear Error'));
    expect(screen.getByTestId('error')).toHaveTextContent('no-error');
  });

  it('should handle loading state', () => {
    const TestComponent = () => {
      const { startLoading, stopLoading, isLoading } = useOAuthFlowBase('test-flow');
      
      return (
        <div>
          <button onClick={startLoading}>Start Loading</button>
          <button onClick={stopLoading}>Stop Loading</button>
          <div data-testid="loading">{isLoading.toString()}</div>
        </div>
      );
    };

    render(<TestComponent />);

    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    
    fireEvent.click(screen.getByText('Start Loading'));
    expect(screen.getByTestId('loading')).toHaveTextContent('true');
    
    fireEvent.click(screen.getByText('Stop Loading'));
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
  });
});

describe('getPingOneEnvVars', () => {
  it('should return window environment variables when available', () => {

    expect(result).toEqual({
      environmentId: 'test-env-id',
      apiUrl: 'https://test-api.com',
      clientId: 'test-client-id'
    });
  });

  it('should return config fallback when window variables are not available', () => {
    // Clear window variables
    delete (window as unknown).__PINGONE_ENVIRONMENT_ID__;
    delete (window as unknown).__PINGONE_API_URL__;
    delete (window as unknown).__PINGONE_CLIENT_ID__;

    // Should fall back to config values (mocked)
    expect(result).toHaveProperty('environmentId');
    expect(result).toHaveProperty('apiUrl');
    expect(result).toHaveProperty('clientId');
  });
});
