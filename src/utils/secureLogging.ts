// src/utils/secureLogging.ts
// Secure logging utility for V7 flows - prevents sensitive data exposure

/**
 * Sanitizes sensitive data for secure logging
 * @param data - The data to sanitize
 * @returns Sanitized data with sensitive fields masked
 */
export const sanitizeSensitiveData = (data: any): any => {
  if (typeof data === 'object' && data !== null) {
    const sanitized = { ...data };
    
    // Mask sensitive credential fields
    if (sanitized.clientSecret) sanitized.clientSecret = '***';
    if (sanitized.client_secret) sanitized.client_secret = '***';
    if (sanitized.access_token) sanitized.access_token = '***';
    if (sanitized.refresh_token) sanitized.refresh_token = '***';
    if (sanitized.id_token) sanitized.id_token = '***';
    if (sanitized.authorization_code) sanitized.authorization_code = '***';
    if (sanitized.code) sanitized.code = '***';
    
    // Mask sensitive URL parameters
    if (sanitized.url && typeof sanitized.url === 'string') {
      sanitized.url = sanitized.url.replace(/[?&](client_secret|code|access_token|refresh_token|id_token)=[^&]*/g, '$1=***');
    }
    
    // Mask sensitive nested objects
    if (sanitized.credentials) {
      sanitized.credentials = sanitizeSensitiveData(sanitized.credentials);
    }
    
    if (sanitized.tokens) {
      sanitized.tokens = sanitizeSensitiveData(sanitized.tokens);
    }
    
    if (sanitized.tokenResponse) {
      sanitized.tokenResponse = sanitizeSensitiveData(sanitized.tokenResponse);
    }
    
    return sanitized;
  }
  
  return data;
};

/**
 * Secure logging function that sanitizes sensitive data
 * @param message - The log message
 * @param data - Optional data to log (will be sanitized)
 */
export const secureLog = (message: string, data?: any): void => {
  if (process.env.NODE_ENV === 'development') {
    const sanitizedData = data ? sanitizeSensitiveData(data) : undefined;
    console.log(message, sanitizedData);
  }
};

/**
 * Secure error logging function
 * @param message - The error message
 * @param error - The error object (will be sanitized)
 */
export const secureErrorLog = (message: string, error?: any): void => {
  if (process.env.NODE_ENV === 'development') {
    const sanitizedError = error ? sanitizeSensitiveData(error) : undefined;
    console.error(message, sanitizedError);
  }
};

/**
 * Secure warning logging function
 * @param message - The warning message
 * @param data - Optional data to log (will be sanitized)
 */
export const secureWarnLog = (message: string, data?: any): void => {
  if (process.env.NODE_ENV === 'development') {
    const sanitizedData = data ? sanitizeSensitiveData(data) : undefined;
    console.warn(message, sanitizedData);
  }
};
