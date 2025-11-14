/**
 * Protocol utilities for handling HTTP/HTTPS compatibility
 */

/**
 * Get the current protocol (http or https) based on the environment
 */
export function getCurrentProtocol(): 'http' | 'https' {
  if (typeof window === 'undefined') {
    return 'https'; // Server-side default
  }
  
  return window.location.protocol === 'https:' ? 'https' : 'http';
}

/**
 * Get the backend URL based on the current protocol and environment
 */
export function getBackendUrl(): string {
  if (process.env.NODE_ENV === 'production') {
    return 'https://oauth-playground.vercel.app';
  }
  
  // In development, use relative URLs to leverage Vite proxy
  return '';
}

/**
 * Get the frontend URL based on the current protocol
 */
export function getFrontendUrl(): string {
  if (typeof window === 'undefined') {
    return 'https://localhost:3000'; // Server-side default
  }
  
  const protocol = getCurrentProtocol();
  const port = window.location.port || (protocol === 'https' ? '3000' : '3000');
  return `${protocol}//localhost:${port}`;
}

/**
 * Check if the current environment supports HTTPS
 */
export function supportsHttps(): boolean {
  if (typeof window === 'undefined') {
    return true; // Server-side default
  }
  
  return window.location.protocol === 'https:';
}

/**
 * Get the appropriate redirect URI based on the current protocol
 */
export function getRedirectUri(): string {
  const frontendUrl = getFrontendUrl();
  return `${frontendUrl}/authz-callback`;
}

/**
 * Get the appropriate logout redirect URI based on the current protocol
 */
export function getLogoutRedirectUri(): string {
  const frontendUrl = getFrontendUrl();
  return `${frontendUrl}/logout-callback`;
}
