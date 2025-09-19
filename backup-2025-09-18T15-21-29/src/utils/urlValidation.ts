 
import { logger } from './logger';

/**
 * Validates a URL string for OAuth callback processing
 * @param url - The URL string to validate
 * @param context - Context for logging (e.g., 'AuthzCallback', 'WorkerTokenCallback')
 * @returns The validated URL string
 * @throws Error if URL is invalid
 */
export const validateCallbackUrl = (url: string, context: string): string => {
  // Log the URL parameter for debugging
  logger.info(context, 'Validating callback URL', { 
    url, 
    urlType: typeof url, 
    urlLength: url?.length,
    isNull: url === null,
    isUndefined: url === undefined
  });
  
  // Check if URL is provided and is a string
  if (!url || typeof url !== 'string') {
    logger.error(context, 'Invalid URL provided', { 
      url, 
      urlType: typeof url,
      isNull: url === null,
      isUndefined: url === undefined
    });
    throw new Error('Invalid URL provided to callback handler');
  }
  
  // Check for invalid URL patterns
  if (url === 'about:blank' || url === 'data:' || url.trim() === '') {
    logger.error(context, 'Invalid URL pattern detected', { url });
    throw new Error('Invalid callback URL detected. Please ensure you are accessing this page through a proper OAuth redirect.');
  }
  
  // Validate URL format by attempting to construct URL object
  try {
    new URL(url);
  } catch (urlError) {
    logger.error(context, 'Invalid URL format', { url, error: String(urlError) });
    throw new Error(`Invalid URL format: ${url}`);
  }
  
  logger.info(context, 'URL validation successful', { url });
  return url;
};

/**
 * Validates and processes a callback URL for OAuth flows
 * @param url - The URL string to validate and process
 * @param context - Context for logging
 * @returns Object with validated URL and parsed parameters
 * @throws Error if URL is invalid
 */
export const validateAndParseCallbackUrl = (url: string, context: string) => {
  const validatedUrl = validateCallbackUrl(url, context);
  
  try {
    const urlObj = new URL(validatedUrl);
    const params = new URLSearchParams(urlObj.search);
    
    // Extract common OAuth parameters
    const code = params.get('code');
    const state = params.get('state');

    const errorDescription = params.get('error_description');
    
    logger.info(context, 'URL parsed successfully', {
      hasCode: !!code,
      hasState: !!state,
      hasError: !!error,
      errorType: error
    });
    
    return {
      url: validatedUrl,
      urlObj,
      params,
      code,
      state,
      error,
      errorDescription
    };
  } catch (parseError) {
    logger.error(context, 'Failed to parse URL parameters', { 
      url: validatedUrl, 
      error: String(parseError) 
    });
    throw new Error(`Failed to parse callback URL: ${String(parseError)}`);
  }
};

/**
 * Gets the current page URL and validates it for callback processing
 * @param context - Context for logging
 * @returns The validated current URL
 * @throws Error if current URL is invalid
 */
export const getValidatedCurrentUrl = (context: string): string => {
  const currentUrl = window.location.href;
  return validateCallbackUrl(currentUrl, context);
};

export default {
  validateCallbackUrl,
  validateAndParseCallbackUrl,
  getValidatedCurrentUrl
};
