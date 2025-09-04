// src/utils/errorHandler.ts
import { FiAlertTriangle, FiInfo, FiCheckCircle, FiXCircle } from 'react-icons/fi';

export interface ErrorDetails {
  originalError: string;
  userFriendlyMessage: string;
  possibleCauses: string[];
  solutions: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'authentication' | 'authorization' | 'configuration' | 'network' | 'token' | 'unknown';
}

export interface PingOneErrorMapping {
  [key: string]: ErrorDetails;
}

// PingOne-specific error mappings with user-friendly guidance
export const PINGONE_ERROR_MAPPINGS: PingOneErrorMapping = {
  // Authentication Errors
  'invalid_client_credentials': {
    originalError: 'invalid_client_credentials',
    userFriendlyMessage: 'Invalid Client Credentials',
    possibleCauses: [
      'Client ID or Client Secret is incorrect',
      'Using PKCE with Basic Authentication (not allowed)',
      'Client Secret has expired or been regenerated',
      'Application type mismatch (SPA vs Confidential)'
    ],
    solutions: [
      'Verify your Client ID and Client Secret in PingOne Admin',
      'If using PKCE, change your app type to "Single Page Application (SPA)"',
      'If using Basic Auth, ensure your app type is "Confidential" and disable PKCE',
      'Check if your Client Secret has been regenerated recently',
      'Ensure the application is enabled in PingOne'
    ],
    severity: 'high',
    category: 'authentication'
  },

  'invalid_client': {
    originalError: 'invalid_client',
    userFriendlyMessage: 'Invalid Client Application',
    possibleCauses: [
      'Client ID does not exist',
      'Application is disabled',
      'Application is not properly configured'
    ],
    solutions: [
      'Verify your Client ID in PingOne Admin',
      'Check if the application is enabled',
      'Ensure the application is properly configured with correct redirect URIs'
    ],
    severity: 'high',
    category: 'authentication'
  },

  'unauthorized_client': {
    originalError: 'unauthorized_client',
    userFriendlyMessage: 'Client Not Authorized for This Flow',
    possibleCauses: [
      'Application type does not support the requested flow',
      'Grant type not enabled for this application',
      'Response type not allowed for this application'
    ],
    solutions: [
      'Check your application type in PingOne Admin',
      'Enable the required grant types (Authorization Code, Implicit, etc.)',
      'Enable the required response types (code, token, id_token)',
      'For Hybrid Flow, ensure all response types are enabled'
    ],
    severity: 'high',
    category: 'authorization'
  },

  // Authorization Errors
  'invalid_grant': {
    originalError: 'invalid_grant',
    userFriendlyMessage: 'Invalid Authorization Grant',
    possibleCauses: [
      'Authorization code has expired (typically 10 minutes)',
      'Authorization code has already been used',
      'Code verifier does not match code challenge',
      'Redirect URI does not match the one used in authorization request'
    ],
    solutions: [
      'Try the authorization flow again to get a fresh code',
      'Ensure you are using the same redirect URI in both requests',
      'Verify your PKCE code verifier matches the code challenge',
      'Check that the authorization code hasn\'t expired'
    ],
    severity: 'medium',
    category: 'authorization'
  },

  'invalid_request': {
    originalError: 'invalid_request',
    userFriendlyMessage: 'Invalid Request Parameters',
    possibleCauses: [
      'Missing required parameters',
      'Invalid parameter values',
      'Unsupported response type',
      'Invalid scope values'
    ],
    solutions: [
      'Check that all required parameters are included',
      'Verify parameter values are correct',
      'Ensure response type is supported by your application',
      'Check that requested scopes are enabled'
    ],
    severity: 'medium',
    category: 'configuration'
  },

  'unsupported_response_type': {
    originalError: 'unsupported_response_type',
    userFriendlyMessage: 'Response Type Not Supported',
    possibleCauses: [
      'Response type not enabled for your application',
      'Application type does not support this response type',
      'Invalid response type format'
    ],
    solutions: [
      'Enable the response type in PingOne Admin',
      'Check your application type supports this response type',
      'For Hybrid Flow, ensure all required response types are enabled',
      'Verify response type format (e.g., "code id_token token")'
    ],
    severity: 'high',
    category: 'configuration'
  },

  'invalid_scope': {
    originalError: 'invalid_scope',
    userFriendlyMessage: 'Invalid or Unauthorized Scope',
    possibleCauses: [
      'Requested scope is not available',
      'Scope is not enabled for your application',
      'Invalid scope format'
    ],
    solutions: [
      'Check available scopes in PingOne Admin',
      'Enable the required scopes for your application',
      'Use standard OIDC scopes: openid, profile, email',
      'Verify scope format (space-separated)'
    ],
    severity: 'medium',
    category: 'configuration'
  },

  // Token Errors
  'invalid_token': {
    originalError: 'invalid_token',
    userFriendlyMessage: 'Invalid or Expired Token',
    possibleCauses: [
      'Token has expired',
      'Token is malformed',
      'Token has been revoked',
      'Invalid token signature'
    ],
    solutions: [
      'Try refreshing the token',
      'Re-authenticate to get a new token',
      'Check token expiration time',
      'Verify token format and signature'
    ],
    severity: 'medium',
    category: 'token'
  },

  'insufficient_scope': {
    originalError: 'insufficient_scope',
    userFriendlyMessage: 'Insufficient Token Scope',
    possibleCauses: [
      'Token does not have required scope',
      'Scope was not requested during authorization',
      'Token was issued with limited scope'
    ],
    solutions: [
      'Request the required scope during authorization',
      'Re-authenticate with the correct scopes',
      'Check what scopes your token actually contains'
    ],
    severity: 'medium',
    category: 'token'
  },

  // Network/Connection Errors
  'ERR_CONNECTION_REFUSED': {
    originalError: 'ERR_CONNECTION_REFUSED',
    userFriendlyMessage: 'Cannot Connect to Backend Server',
    possibleCauses: [
      'Backend server is not running',
      'Wrong port or URL configuration',
      'Firewall blocking the connection',
      'Backend server crashed or stopped'
    ],
    solutions: [
      'Start the backend server: npm run start:backend',
      'Check if the server is running on the correct port (3001)',
      'Verify your network connection',
      'Check server logs for errors'
    ],
    severity: 'critical',
    category: 'network'
  },

  'Failed to fetch': {
    originalError: 'Failed to fetch',
    userFriendlyMessage: 'Network Request Failed',
    possibleCauses: [
      'Backend server is not running',
      'Network connectivity issues',
      'CORS configuration problems',
      'Server is overloaded or down'
    ],
    solutions: [
      'Check if the backend server is running',
      'Verify your internet connection',
      'Try refreshing the page',
      'Check server status and logs'
    ],
    severity: 'high',
    category: 'network'
  },

  'unsupported_authentication_method': {
    originalError: 'Request denied: Unsupported authentication method',
    userFriendlyMessage: 'Authentication Method Not Supported',
    possibleCauses: [
      'PingOne application is configured as SPA (Single Page Application)',
      'Client Secret Basic authentication is disabled',
      'Application type does not support backend client flows',
      'PKCE is required but not being used properly'
    ],
    solutions: [
      'Check your PingOne application type in Admin console',
      'If using PKCE, ensure your app is configured as "Single Page Application (SPA)"',
      'If using Client Secret Basic, ensure your app is configured as "Backend Application"',
      'Enable "Client Secret Basic" authentication method in PingOne Admin',
      'Verify that your application supports the authorization_code grant type',
      'Check that your redirect URI matches exactly in PingOne configuration'
    ],
    severity: 'high',
    category: 'authentication'
  }
};

// Common error patterns and their mappings
export const ERROR_PATTERNS = [
  { pattern: /invalid_client_credentials/i, key: 'invalid_client_credentials' },
  { pattern: /invalid_client/i, key: 'invalid_client' },
  { pattern: /unauthorized_client/i, key: 'unauthorized_client' },
  { pattern: /invalid_grant/i, key: 'invalid_grant' },
  { pattern: /invalid_request/i, key: 'invalid_request' },
  { pattern: /unsupported_response_type/i, key: 'unsupported_response_type' },
  { pattern: /invalid_scope/i, key: 'invalid_scope' },
  { pattern: /invalid_token/i, key: 'invalid_token' },
  { pattern: /insufficient_scope/i, key: 'insufficient_scope' },
  { pattern: /ERR_CONNECTION_REFUSED/i, key: 'ERR_CONNECTION_REFUSED' },
  { pattern: /Failed to fetch/i, key: 'Failed to fetch' },
  { pattern: /unsupported authentication method/i, key: 'unsupported_authentication_method' }
];

/**
 * Analyzes an error and returns user-friendly error details
 */
export function analyzeError(error: any): ErrorDetails {
  const errorString = error?.message || error?.toString() || String(error);
  
  // Try to match against known error patterns
  for (const { pattern, key } of ERROR_PATTERNS) {
    if (pattern.test(errorString)) {
      return PINGONE_ERROR_MAPPINGS[key];
    }
  }

  // Check for OAuth error responses
  if (error?.error) {
    const oauthError = error.error.toLowerCase().replace(/[_\s]/g, '_');
    if (PINGONE_ERROR_MAPPINGS[oauthError]) {
      return PINGONE_ERROR_MAPPINGS[oauthError];
    }
  }

  // Default error for unknown cases
  return {
    originalError: errorString,
    userFriendlyMessage: 'An unexpected error occurred',
    possibleCauses: [
      'Unknown error type',
      'Network connectivity issues',
      'Server-side problems'
    ],
    solutions: [
      'Try refreshing the page',
      'Check your internet connection',
      'Contact support if the problem persists'
    ],
    severity: 'medium',
    category: 'unknown'
  };
}

/**
 * Gets the appropriate icon for error severity
 */
export function getErrorIcon(severity: ErrorDetails['severity']) {
  switch (severity) {
    case 'critical':
      return FiXCircle;
    case 'high':
      return FiAlertTriangle;
    case 'medium':
      return FiInfo;
    case 'low':
      return FiCheckCircle;
    default:
      return FiInfo;
  }
}

/**
 * Gets the appropriate color for error severity
 */
export function getErrorColor(severity: ErrorDetails['severity']): string {
  switch (severity) {
    case 'critical':
      return '#dc2626'; // red-600
    case 'high':
      return '#ea580c'; // orange-600
    case 'medium':
      return '#d97706'; // amber-600
    case 'low':
      return '#059669'; // emerald-600
    default:
      return '#6b7280'; // gray-500
  }
}

/**
 * Formats error details for display
 */
export function formatErrorForDisplay(error: any): {
  details: ErrorDetails;
  icon: any;
  color: string;
} {
  const details = analyzeError(error);
  const icon = getErrorIcon(details.severity);
  const color = getErrorColor(details.severity);

  return { details, icon, color };
}
