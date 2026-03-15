import { useState, useEffect } from 'react';
import { authService } from '../services';

/**
 * Custom hook for managing authentication state
 */
export function useAuth() {
  const [authStatus, setAuthStatus] = useState(authService.getAuthStatus());

  useEffect(() => {
    // Subscribe to auth changes
    const unsubscribe = authService.onAuthChange((status) => {
      setAuthStatus(status);
    });

    // Initialize auth status
    authService.initialize();

    return unsubscribe;
  }, []);

  const login = async (redirectUri) => {
    try {
      await authService.login(redirectUri);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  const handleCallback = async (code, state) => {
    try {
      await authService.handleCallback(code, state);
    } catch (error) {
      console.error('OAuth callback failed:', error);
      throw error;
    }
  };

  const refreshToken = async () => {
    try {
      await authService.refreshToken();
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  };

  const clearError = () => {
    authService.clearError();
  };

  return {
    // Auth status
    isAuthenticated: authStatus.isAuthenticated,
    isLoading: authStatus.isLoading,
    error: authStatus.error,
    scopes: authStatus.scopes,
    
    // User info
    user: authService.getCurrentUser(),
    
    // Auth methods
    login,
    logout,
    handleCallback,
    refreshToken,
    clearError,
    
    // Scope checking
    hasScope: authService.hasScope.bind(authService),
    hasAnyScope: authService.hasAnyScope.bind(authService),
    hasAllScopes: authService.hasAllScopes.bind(authService),
    
    // Utility
    shouldAutoLogin: authService.shouldAutoLogin.bind(authService)
  };
}

export default useAuth;