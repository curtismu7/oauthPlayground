import apiClient from './apiClient';

class AuthService {
  constructor() {
    this.authCallbacks = new Set();
    this.currentUser = null;
    this.authStatus = {
      isAuthenticated: false,
      isLoading: false,
      error: null,
      scopes: []
    };
  }

  // Authentication status management
  getAuthStatus() {
    return { ...this.authStatus };
  }

  onAuthChange(callback) {
    this.authCallbacks.add(callback);
    return () => this.authCallbacks.delete(callback);
  }

  notifyAuthChange() {
    this.authCallbacks.forEach(callback => callback(this.authStatus));
  }

  setAuthStatus(updates) {
    this.authStatus = { ...this.authStatus, ...updates };
    this.notifyAuthChange();
  }

  // OAuth authentication methods
  async checkAuthStatus() {
    this.setAuthStatus({ isLoading: true, error: null });

    try {
      const response = await apiClient.get('/api/auth/oauth/status');
      const { authenticated, user, scopes, accessToken } = response.data;

      if (authenticated && accessToken) {
        this.currentUser = user;
        this.setAuthStatus({
          isAuthenticated: true,
          isLoading: false,
          error: null,
          scopes: scopes || []
        });
        return true;
      } else {
        this.currentUser = null;
        this.setAuthStatus({
          isAuthenticated: false,
          isLoading: false,
          error: null,
          scopes: []
        });
        return false;
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      this.currentUser = null;
      this.setAuthStatus({
        isAuthenticated: false,
        isLoading: false,
        error: error.message || 'Failed to check authentication status',
        scopes: []
      });
      return false;
    }
  }

  async login(redirectUri = window.location.origin) {
    try {
      this.setAuthStatus({ isLoading: true, error: null });

      // Clear any previous logout flags
      localStorage.removeItem('userLoggedOut');

      // Get OAuth authorization URL
      const response = await apiClient.get('/api/auth/oauth/authorize', {
        params: { redirect_uri: redirectUri }
      });

      if (response.data.authorizationUrl) {
        // Redirect to OAuth provider
        window.location.href = response.data.authorizationUrl;
      } else {
        throw new Error('No authorization URL received');
      }
    } catch (error) {
      console.error('Login error:', error);
      this.setAuthStatus({
        isLoading: false,
        error: error.message || 'Login failed'
      });
      throw error;
    }
  }

  async logout() {
    try {
      this.setAuthStatus({ isLoading: true, error: null });

      // Set logout flag to prevent auto-login
      localStorage.setItem('userLoggedOut', 'true');

      // Call logout endpoint
      await apiClient.post('/api/auth/oauth/logout');

      // Clear local state
      this.currentUser = null;
      this.setAuthStatus({
        isAuthenticated: false,
        isLoading: false,
        error: null,
        scopes: []
      });

      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state
      this.currentUser = null;
      this.setAuthStatus({
        isAuthenticated: false,
        isLoading: false,
        error: null,
        scopes: []
      });
      window.location.href = '/';
    }
  }

  async handleCallback(code, state) {
    try {
      this.setAuthStatus({ isLoading: true, error: null });

      const response = await apiClient.post('/api/auth/oauth/callback', {
        code,
        state
      });

      if (response.data.success) {
        await this.checkAuthStatus();
        return true;
      } else {
        throw new Error(response.data.error || 'OAuth callback failed');
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      this.setAuthStatus({
        isLoading: false,
        error: error.message || 'Authentication failed'
      });
      throw error;
    }
  }

  // User and scope management
  getCurrentUser() {
    return this.currentUser;
  }

  hasScope(requiredScope) {
    return this.authStatus.scopes.includes(requiredScope);
  }

  hasAnyScope(requiredScopes) {
    return requiredScopes.some(scope => this.hasScope(scope));
  }

  hasAllScopes(requiredScopes) {
    return requiredScopes.every(scope => this.hasScope(scope));
  }

  getScopes() {
    return [...this.authStatus.scopes];
  }

  // Token management
  async refreshToken() {
    try {
      const response = await apiClient.post('/api/auth/oauth/refresh');
      
      if (response.data.accessToken) {
        // Update auth status after successful refresh
        await this.checkAuthStatus();
        return response.data.accessToken;
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      
      // If refresh fails, user needs to re-authenticate
      this.setAuthStatus({
        isAuthenticated: false,
        error: 'Session expired. Please log in again.'
      });
      
      throw error;
    }
  }

  // Utility methods
  isAuthenticated() {
    return this.authStatus.isAuthenticated;
  }

  isLoading() {
    return this.authStatus.isLoading;
  }

  getError() {
    return this.authStatus.error;
  }

  clearError() {
    this.setAuthStatus({ error: null });
  }

  // Auto-login check (for development convenience)
  shouldAutoLogin() {
    // Don't auto-login if user explicitly logged out
    return !localStorage.getItem('userLoggedOut');
  }

  // Initialize authentication on app start
  async initialize() {
    try {
      // Check if user is already authenticated
      const isAuthenticated = await this.checkAuthStatus();
      
      // If not authenticated and should auto-login, redirect to login
      if (!isAuthenticated && this.shouldAutoLogin()) {
        // Don't auto-login immediately, let the user decide
        console.log('User not authenticated. Login required.');
      }
      
      return isAuthenticated;
    } catch (error) {
      console.error('Auth initialization error:', error);
      return false;
    }
  }
}

// Create and export singleton instance
const authService = new AuthService();
export default authService;