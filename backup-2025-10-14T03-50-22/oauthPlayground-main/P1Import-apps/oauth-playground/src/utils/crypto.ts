/**
 * Generates a random string of specified length
 * @param {number} length - Length of the random string to generate
 * @returns {string} Random string
 */
export const generateRandomString = (length) => {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Hashes a string using SHA-256
 * @param {string} message - The string to hash
 * @returns {Promise<ArrayBuffer>} The hashed message
 */
export const sha256 = async (message) => {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
  return hashBuffer;
};

/**
 * Decodes a JWT token without validation
 * @param {string} token - The JWT token to decode
 * @returns {Object} The decoded token payload
 */
export const decodeJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
};

/**
 * Validates an ID token according to OIDC spec
 * @param {string} idToken - The ID token to validate
 * @param {string} clientId - The client ID
 * @param {string} issuer - The expected token issuer
 * @param {string} nonce - The nonce used in the authentication request
 * @returns {boolean} True if the token is valid, false otherwise
 */
export const validateIdToken = (idToken, clientId, issuer, nonce) => {
  try {
    const decoded = decodeJwt(idToken);
    if (!decoded) return false;

    const now = Math.floor(Date.now() / 1000);
    
    // Check expiration
    if (decoded.exp < now) {
      console.error('Token expired');
      return false;
    }
    
    // Check issuer
    if (decoded.iss !== issuer) {
      console.error('Invalid issuer');
      return false;
    }
    
    // Check audience
    if (decoded.aud !== clientId) {
      console.error('Invalid audience');
      return false;
    }
    
    // Check nonce
    if (nonce && decoded.nonce !== nonce) {
      console.error('Invalid nonce');
      return false;
    }
    
    // Check issued at time
    if (decoded.iat > now) {
      console.error('Token issued in the future');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
};

/**
 * Parses query parameters from a URL
 * @param {string} url - The URL to parse
 * @returns {Object} The parsed query parameters
 */
export const parseQueryParams = (url) => {
  const params = {};
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
 * Parses hash fragment from a URL
 * @param {string} url - The URL to parse
 * @returns {Object} The parsed hash parameters
 */
export const parseHashFragment = (url) => {
  const params = {};
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
}
