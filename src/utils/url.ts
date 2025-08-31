/**
 * URL utility functions for handling OAuth 2.0 and OpenID Connect URLs
 */

import { QueryParams, HashParams, URLParseOptions, URLBuildOptions } from '../types/url';

/**
 * Parse query parameters from a URL
 * @param url - The URL to parse
 * @returns Parsed query parameters as key-value pairs
 */
export const parseQueryParams = (url: string): QueryParams => {
  const params: QueryParams = {};
  const queryString = url.split('?')[1] || '';
  const pairs = queryString.split('&');
  
  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (key) {
      params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    }
  }
  
  return params;
};

/**
 * Parse hash fragment from a URL
 * @param url - The URL to parse
 * @returns Parsed hash parameters as key-value pairs
 */
export const parseHashFragment = (url: string): HashParams => {
  const params: HashParams = {};
  const hash = url.split('#')[1] || '';
  const pairs = hash.split('&');
  
  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (key) {
      params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    }
  }
  
  return params;
};

/**
 * Build a URL with query parameters
 * @param baseUrl - The base URL
 * @param params - Query parameters as key-value pairs
 * @returns The constructed URL with query parameters
 */
export const buildUrl = (baseUrl: string, params: QueryParams = {}): string => {
  const url = new URL(baseUrl);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(v => url.searchParams.append(key, String(v)));
      } else {
        url.searchParams.append(key, String(value));
      }
    }
  });
  
  return url.toString();
};

/**
 * Add query parameters to a URL
 * @param url - The base URL
 * @param params - Query parameters to add
 * @returns The URL with added query parameters
 */
export const addQueryParams = (url: string, params: QueryParams = {}): string => {
  const urlObj = new URL(url, window.location.origin);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        // Remove existing parameters with the same name
        urlObj.searchParams.delete(key);
        value.forEach(v => urlObj.searchParams.append(key, String(v)));
      } else {
        urlObj.searchParams.set(key, String(value));
      }
    }
  });
  
  return urlObj.toString();
};

/**
 * Remove query parameters from a URL
 * @param url - The URL to modify
 * @param paramNames - Parameter name(s) to remove
 * @returns The URL with specified query parameters removed
 */
export const removeQueryParams = (url: string, paramNames: string | string[]): string => {
  const urlObj = new URL(url, window.location.origin);
  const paramsToRemove = Array.isArray(paramNames) ? paramNames : [paramNames];
  
  paramsToRemove.forEach(param => {
    urlObj.searchParams.delete(param);
  });
  
  return urlObj.toString();
};

/**
 * Get the current URL with or without query parameters
 * @param includeSearch - Whether to include query parameters
 * @param includeHash - Whether to include hash fragment
 * @returns The current URL
 */
export const getCurrentUrl = (includeSearch = true, includeHash = true): string => {
  let url = window.location.pathname;
  
  if (includeSearch && window.location.search) {
    url += window.location.search;
  }
  
  if (includeHash && window.location.hash) {
    url += window.location.hash;
  }
  
  return url;
};

/**
 * Check if a URL is absolute
 * @param url - The URL to check
 * @returns True if the URL is absolute
 */
export const isAbsoluteUrl = (url: string): boolean => {
  return /^[a-z][a-z0-9+.-]*:/.test(url);
};

/**
 * Ensure a URL is absolute by prepending the current origin if needed
 * @param url - The URL to ensure is absolute
 * @returns An absolute URL
 */
export const ensureAbsoluteUrl = (url: string): string => {
  if (!url) return '';
  if (isAbsoluteUrl(url)) return url;
  
  // Handle protocol-relative URLs (e.g., //example.com)
  if (url.startsWith('//')) {
    return `${window.location.protocol}${url}`;
  }
  
  // Handle root-relative URLs (e.g., /path)
  if (url.startsWith('/')) {
    return `${window.location.origin}${url}`;
  }
  
  // Handle relative URLs (e.g., path)
  const base = window.location.href.replace(/[^/]*$/, '');
  return new URL(url, base).href;
};

/**
 * Get the base URL (origin + pathname) without query parameters or hash
 * @param url - The URL to process (defaults to current URL)
 * @returns The base URL
 */
export const getBaseUrl = (url?: string): string => {
  const urlObj = url ? new URL(url, window.location.origin) : new URL(window.location.href);
  return `${urlObj.origin}${urlObj.pathname}`.replace(/\/$/, '');
};

/**
 * Check if two URLs have the same origin
 * @param url1 - First URL
 * @param url2 - Second URL
 * @returns True if the URLs have the same origin
 */
export const sameOrigin = (url1: string, url2: string): boolean => {
  try {
    const a = new URL(url1, window.location.href);
    const b = new URL(url2, window.location.href);
    return a.origin === b.origin;
  } catch (e) {
    return false;
  }
};

/**
 * Check if the current page is loaded over HTTPS
 * @returns True if the page is loaded over HTTPS
 */
export const isHttps = (): boolean => {
  return window.location.protocol === 'https:';
};

/**
 * Check if the current page is loaded on localhost
 * @returns True if the page is loaded on localhost
 */
export const isLocalhost = (): boolean => {
  return window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' || 
         window.location.hostname === '[::1]';
};

const urlUtils = {
  parseQueryParams,
  parseHashFragment,
  buildUrl,
  addQueryParams,
  removeQueryParams,
  getCurrentUrl,
  isAbsoluteUrl,
  ensureAbsoluteUrl,
  getBaseUrl,
  sameOrigin,
  isHttps,
  isLocalhost
};

export default urlUtils;
