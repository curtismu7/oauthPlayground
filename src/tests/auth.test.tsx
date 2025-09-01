import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from '../contexts/NewAuthContext';
import { useAuth } from '../contexts/NewAuthContext';
import { BrowserRouter as Router } from 'react-router-dom';

describe('AuthContext', () => {
  const TestComponent = () => {
    const { isAuthenticated, login, logout } = useAuth();
    
    return (
      <div>
        <div data-testid="status">
          {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
        </div>
        <button onClick={() => login()}>Login</button>
        <button onClick={logout}>Logout</button>
      </div>
    );
  };

  const renderWithAuth = (config = {}) => {
    const defaultConfig = {
      disableLogin: false,
      ...config
    };

    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    
    global.localStorage = localStorageMock as any;

    return render(
      <Router>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </Router>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default state', () => {
    renderWithAuth();
    expect(screen.getByTestId('status')).toHaveTextContent('Not Authenticated');
  });

  it('should handle login when disableLogin is true', async () => {
    renderWithAuth({ disableLogin: true });
    
    fireEvent.click(screen.getByText('Login'));
    
    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('Authenticated');
    });
  });

  it('should handle logout', async () => {
    renderWithAuth({ disableLogin: true });
    
    // Login first
    fireEvent.click(screen.getByText('Login'));
    
    // Then logout
    fireEvent.click(screen.getByText('Logout'));
    
    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('Not Authenticated');
    });
  });

  // Add more test cases as needed
});
