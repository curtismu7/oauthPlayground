// src/utils/secureJson.ts - Secure JSON parsing utilities

/**
 * Safely parse JSON with validation and XSS protection
 * @param jsonString - The JSON string to parse
 * @param maxLength - Maximum allowed length (default: 100KB)
 * @returns Parsed object or null if invalid/unsafe
 */
export const safeJsonParse = <T = unknown>(
  jsonString: string | null | undefined,
  maxLength: number = 100000
): T | null => {
  // Basic validation
  if (!jsonString || typeof jsonString !== 'string') {
    return null;
  }

  // Size validation to prevent DoS
  if (jsonString.length > maxLength) {
    console.warn('🚨 [Security] JSON string too large, rejecting parse');
    return null;
  }

  // XSS protection - check for dangerous content
  const dangerousPatterns = [
    '<script',
    'javascript:',
    'data:text/html',
    'vbscript:',
    'onload=',
    'onerror=',
    'onclick=',
    '__proto__',
    'constructor',
    'prototype'
  ];

  const lowerJson = jsonString.toLowerCase();
  for (const pattern of dangerousPatterns) {
    if (lowerJson.includes(pattern)) {
      console.warn('🚨 [Security] Blocked potentially dangerous JSON content:', pattern);
      return null;
    }
  }

  try {
    const parsed = JSON.parse(jsonString);
    
    // Additional validation for parsed object
    if (parsed && typeof parsed === 'object') {
      // Check for prototype pollution attempts
      if ('__proto__' in parsed || 'constructor' in parsed || 'prototype' in parsed) {
        console.warn('🚨 [Security] Blocked prototype pollution attempt in parsed JSON');
        return null;
      }
    }

    return parsed as T;
  } catch (error) {
    console.warn('🔍 [Security] JSON parse failed (potentially malformed):', error);
    return null;
  }
};

/**
 * Safely parse JSON from localStorage with fallback
 * @param key - localStorage key
 * @param defaultValue - Default value if parsing fails
 * @returns Parsed value or default
 */
export const safeLocalStorageParse = <T>(
  key: string,
  defaultValue: T
): T => {
  try {
    const stored = localStorage.getItem(key);
    const parsed = safeJsonParse<T>(stored);
    return parsed !== null ? parsed : defaultValue;
  } catch (error) {
    console.warn('🔍 [Security] localStorage parse failed for key:', key, error);
    return defaultValue;
  }
};

/**
 * Safely parse JSON from sessionStorage with fallback
 * @param key - sessionStorage key
 * @param defaultValue - Default value if parsing fails
 * @returns Parsed value or default
 */
export const safeSessionStorageParse = <T>(
  key: string,
  defaultValue: T
): T => {
  try {
    const stored = sessionStorage.getItem(key);
    const parsed = safeJsonParse<T>(stored);
    return parsed !== null ? parsed : defaultValue;
  } catch (error) {
    console.warn('🔍 [Security] sessionStorage parse failed for key:', key, error);
    return defaultValue;
  }
};

/**
 * Sanitize a URL path to prevent XSS in redirects
 * @param path - The path to sanitize
 * @returns Safe path or default
 */
export const sanitizePath = (path: string, defaultPath: string = '/'): string => {
  if (!path || typeof path !== 'string') {
    return defaultPath;
  }

  // Only allow internal paths starting with /
  if (!path.startsWith('/')) {
    console.warn('🚨 [Security] Blocked external redirect path:', path);
    return defaultPath;
  }

  // Block dangerous protocols and content
  if (path.includes('javascript:') || path.includes('<') || path.includes('data:')) {
    console.warn('🚨 [Security] Blocked unsafe path content:', path);
    return defaultPath;
  }

  return path;
};

export default {
  safeJsonParse,
  safeLocalStorageParse,
  safeSessionStorageParse,
  sanitizePath
};
