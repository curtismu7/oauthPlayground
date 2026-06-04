import { randomBytes, createHash } from 'node:crypto';
import { logger } from './logger.js';
import { ValidationError } from './mcpErrors.js';

const DEFAULT_VERIFIER_LENGTH = 128;
const MIN_VERIFIER_LENGTH = 43;
const MAX_VERIFIER_LENGTH = 128;

/**
 * Generate a PKCE code verifier using Node.js crypto
 * @param length - Length of verifier (43-128 chars). Defaults to 128.
 * @returns Base64URL-encoded verifier string
 */
export function generateVerifier(length: number = DEFAULT_VERIFIER_LENGTH): string {
  if (length < MIN_VERIFIER_LENGTH || length > MAX_VERIFIER_LENGTH) {
    throw new ValidationError(
      `PKCE verifier length must be between ${MIN_VERIFIER_LENGTH} and ${MAX_VERIFIER_LENGTH}`
    );
  }

  // PKCE uses unreserved characters: [A-Z] [a-z] [0-9] - . _ ~
  const unreserved = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  
  let verifier = '';
  const bytes = randomBytes(length); // one byte consumed per character below

  for (let i = 0; i < length; i++) {
    verifier += unreserved[bytes[i] % unreserved.length];
  }

  logger.debug('Generated PKCE verifier', { length: verifier.length });
  return verifier;
}

/**
 * Compute PKCE code challenge from verifier using SHA-256
 * @param verifier - The PKCE code verifier
 * @returns Base64URL-encoded challenge string
 */
export function computeChallenge(verifier: string): string {
  if (!verifier || verifier.length === 0) {
    throw new ValidationError('Verifier cannot be empty');
  }

  const hash = createHash('sha256').update(verifier).digest();
  const base64url = hash
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  logger.debug('Computed PKCE challenge', { 
    verifierLength: verifier.length, 
    challengeLength: base64url.length 
  });

  return base64url;
}

/**
 * Validate a PKCE verifier and challenge pair
 * @param verifier - The code verifier
 * @param challenge - The code challenge
 * @returns True if valid pair
 */
export function validatePkcePair(verifier: string, challenge: string): boolean {
  try {
    const computedChallenge = computeChallenge(verifier);
    const isValid = computedChallenge === challenge;
    logger.debug('Validated PKCE pair', { isValid });
    return isValid;
  } catch (error) {
    logger.error('Error validating PKCE pair', { error });
    return false;
  }
}
