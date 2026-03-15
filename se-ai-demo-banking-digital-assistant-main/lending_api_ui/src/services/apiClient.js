import axios from 'axios';

class ApiClient {
  constructor() {
    this.client = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3002',
      timeout: 10000,
      withCredentials: true, // Include session cookies
    });

    this.loadingRequests = new Set();
    this.loadingCallbacks = new Set();
    this.setupInterceptors();
  }

  setupInterceptors() {
    // Request interceptor to add OAuth token and track loading
    this.client.interceptors.request.use(
      async (config) => {
        console.log('🔍 [ApiClient] Request interceptor - starting request:', {
          method: config.method,
          url: config.url,
          baseURL: config.baseURL
        });
        
        // Add request to loading tracker
        const requestId = `${config.method}-${config.url}`;
        this.loadingRequests.add(requestId);
        this.notifyLoadingChange();

        // Add OAuth token to Authorization header
        const token = await this.getValidToken();
        console.log('🔍 [ApiClient] Token retrieved:', {
          hasToken: !!token,
          tokenLength: token ? token.length : 0,
          tokenPreview: token ? token.substring(0, 20) + '...' : 'none'
        });
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('✅ [ApiClient] Authorization header added');
        } else {
          console.log('⚠️ [ApiClient] No token available - proceeding without auth header');
        }
        
        // Add request ID for tracking
        config.metadata = { requestId };
        
        console.log('🔍 [ApiClient] Final request config:', {
          method: config.method,
          url: config.url,
          hasAuthHeader: !!config.headers.Authorization,
          headers: Object.keys(config.headers)
        });
        
        return config;
      },
      (error) => {
        console.error('❌ [ApiClient] Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token expiration and track loading
    this.client.interceptors.response.use(
      (response) => {
        console.log('✅ [ApiClient] Response received:', {
          status: response.status,
          url: response.config.url,
          method: response.config.method,
          dataKeys: response.data ? Object.keys(response.data) : []
        });
        
        // Remove request from loading tracker
        if (response.config.metadata?.requestId) {
          this.loadingRequests.delete(response.config.metadata.requestId);
          this.notifyLoadingChange();
        }
        return response;
      },
      async (error) => {
        console.error('❌ [ApiClient] Response error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          method: error.config?.method,
          data: error.response?.data,
          message: error.message
        });
        
        const originalRequest = error.config;

        // Remove request from loading tracker
        if (originalRequest.metadata?.requestId) {
          this.loadingRequests.delete(originalRequest.metadata.requestId);
          this.notifyLoadingChange();
        }

        // Check if error is due to token expiration (401) and we haven't already tried to refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          console.log('🔄 [ApiClient] 401 error - attempting token refresh...');
          originalRequest._retry = true;

          try {
            // Try to get a fresh token from the session
            const sessionStatus = await this.getSessionStatus();
            console.log('🔍 [ApiClient] Session status:', sessionStatus);
            
            if (sessionStatus && sessionStatus.authenticated && sessionStatus.accessToken) {
              console.log('✅ [ApiClient] Fresh token obtained, retrying request...');
              // Update stored token
              localStorage.setItem('access_token', sessionStatus.accessToken);
              if (sessionStatus.expiresAt) {
                localStorage.setItem('token_expires_at', sessionStatus.expiresAt.toString());
              }
              
              // Update the authorization header and retry the request
              originalRequest.headers.Authorization = `Bearer ${sessionStatus.accessToken}`;
              return this.client(originalRequest);
            } else {
              console.log('❌ [ApiClient] No valid session available');
              // No valid session, redirect to login
              this.handleAuthFailure();
              return Promise.reject(new Error('Authentication required'));
            }
          } catch (refreshError) {
            console.error('❌ [ApiClient] Token refresh failed:', refreshError);
            this.handleAuthFailure();
            return Promise.reject(refreshError);
          }
        }

        // Check for insufficient scope errors (403)
        if (error.response?.status === 403) {
          console.error('❌ [ApiClient] Insufficient scope for request:', error.response.data);
          
          // Add more detailed error information for scope issues
          if (error.response.data?.error === 'insufficient_scope') {
            const scopeError = new Error('Insufficient permissions for this operation');
            scopeError.response = error.response;
            scopeError.requiredScopes = error.response.data?.required_scopes;
            scopeError.providedScopes = error.response.data?.provided_scopes;
            return Promise.reject(scopeError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async getValidToken() {
    console.log('🔍 [ApiClient] getValidToken() called');
    
    try {
      // First try to get token from localStorage
      const accessToken = localStorage.getItem('access_token');
      console.log('🔍 [ApiClient] localStorage token check:', {
        hasToken: !!accessToken,
        tokenLength: accessToken ? accessToken.length : 0,
        isExpired: accessToken ? this.isTokenExpired(accessToken) : 'N/A'
      });
      
      if (accessToken && !this.isTokenExpired(accessToken)) {
        console.log('✅ [ApiClient] Using localStorage token');
        return accessToken;
      }

      // If no token in localStorage, check the OAuth session
      console.log('🔍 [ApiClient] Checking OAuth session...');
      const sessionStatus = await this.getSessionStatus();
      console.log('🔍 [ApiClient] Session status result:', sessionStatus);
      
      if (sessionStatus && sessionStatus.authenticated && sessionStatus.accessToken) {
        console.log('✅ [ApiClient] Got token from session, storing in localStorage');
        // Store the token for future use
        localStorage.setItem('access_token', sessionStatus.accessToken);
        if (sessionStatus.expiresAt) {
          localStorage.setItem('token_expires_at', sessionStatus.expiresAt.toString());
        }
        return sessionStatus.accessToken;
      }

      console.log('❌ [ApiClient] No valid token available');
      return null;
    } catch (error) {
      console.error('❌ [ApiClient] Error getting valid token:', error);
      return null;
    }
  }

  async getSessionStatus() {
    console.log('🔍 [ApiClient] getSessionStatus() called');
    
    try {
      const url = '/api/auth/oauth/status';
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3002';
      
      console.log('🔍 [ApiClient] Making session status request:', {
        url,
        baseURL,
        fullUrl: `${baseURL}${url}`
      });
      
      // Check OAuth session status from the backend
      const response = await axios.get(url, {
        baseURL,
        withCredentials: true,
        timeout: 5000
      });
      
      console.log('✅ [ApiClient] Session status response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [ApiClient] Error getting session status:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url
      });
      return null;
    }
  }

  isTokenExpired(token) {
    if (!token) return true;
    
    const expiresAt = localStorage.getItem('token_expires_at');
    if (expiresAt) {
      return Date.now() > parseInt(expiresAt);
    }
    
    // If no expiration info, assume token is valid
    return false;
  }

  isTokenExpired(token) {
    // For OAuth tokens, we can't decode them like JWTs
    // Instead, we'll rely on the server to tell us if they're expired
    if (!token) return true;
    return false;
  }

  async refreshToken() {
    try {
      // Get fresh token from OAuth session
      const sessionStatus = await this.getSessionStatus();
      if (sessionStatus && sessionStatus.authenticated && sessionStatus.accessToken) {
        // Update stored token
        localStorage.setItem('access_token', sessionStatus.accessToken);
        if (sessionStatus.expiresAt) {
          localStorage.setItem('token_expires_at', sessionStatus.expiresAt.toString());
        }
        return sessionStatus.accessToken;
      }
      
      throw new Error('No valid OAuth session available');
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }

  handleAuthFailure() {
    console.log('🚨 [ApiClient] Authentication failed, clearing tokens');
    
    // Set logout flag with timestamp to prevent auto-login (use both storage types)
    const logoutTimestamp = Date.now().toString();
    localStorage.setItem('userLoggedOut', logoutTimestamp);
    sessionStorage.setItem('userLoggedOut', logoutTimestamp);
    
    // Clear stored tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_expires_at');
    
    // Clear any cached tokens
    delete axios.defaults.headers.common['Authorization'];
    
    // Dispatch logout event
    window.dispatchEvent(new CustomEvent('userLoggedOut'));
    
    console.log('🔄 [ApiClient] Redirecting to login due to auth failure');
    
    // Redirect to login (don't redirect to OAuth login to avoid loops)
    setTimeout(() => {
      window.location.href = '/';
    }, 100);
  }

  // Loading state management
  isLoading() {
    return this.loadingRequests.size > 0;
  }

  onLoadingChange(callback) {
    this.loadingCallbacks.add(callback);
    return () => this.loadingCallbacks.delete(callback);
  }

  notifyLoadingChange() {
    const isLoading = this.isLoading();
    this.loadingCallbacks.forEach(callback => callback(isLoading));
  }

  // Enhanced error handling
  createError(message, code, details = {}) {
    const error = new Error(message);
    error.code = code;
    error.details = details;
    return error;
  }

  handleApiError(error) {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          return this.createError(
            data.error_description || 'Invalid request',
            'BAD_REQUEST',
            { status, data }
          );
        case 401:
          return this.createError(
            'Authentication required',
            'UNAUTHORIZED',
            { status, data }
          );
        case 403:
          return this.createError(
            data.error_description || 'Insufficient permissions',
            'FORBIDDEN',
            { 
              status, 
              data,
              requiredScopes: data.required_scopes,
              providedScopes: data.provided_scopes
            }
          );
        case 404:
          return this.createError(
            data.error_description || 'Resource not found',
            'NOT_FOUND',
            { status, data }
          );
        case 429:
          return this.createError(
            'Too many requests. Please try again later.',
            'RATE_LIMITED',
            { status, data }
          );
        case 500:
          return this.createError(
            'Internal server error. Please try again later.',
            'SERVER_ERROR',
            { status, data }
          );
        default:
          return this.createError(
            data.error_description || `Request failed with status ${status}`,
            'API_ERROR',
            { status, data }
          );
      }
    } else if (error.request) {
      // Network error
      return this.createError(
        'Network error. Please check your connection.',
        'NETWORK_ERROR',
        { originalError: error }
      );
    } else {
      // Other error
      return this.createError(
        error.message || 'An unexpected error occurred',
        'UNKNOWN_ERROR',
        { originalError: error }
      );
    }
  }

  // Convenience methods that use the configured client with enhanced error handling
  async get(url, config = {}) {
    try {
      const response = await this.client.get(url, config);
      return response;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  async post(url, data, config = {}) {
    try {
      const response = await this.client.post(url, data, config);
      return response;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  async put(url, data, config = {}) {
    try {
      const response = await this.client.put(url, data, config);
      return response;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  async delete(url, config = {}) {
    try {
      const response = await this.client.delete(url, config);
      return response;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  async patch(url, data, config = {}) {
    try {
      const response = await this.client.patch(url, data, config);
      return response;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }
}

// Create and export a singleton instance
const apiClient = new ApiClient();
export default apiClient;