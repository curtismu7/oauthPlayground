// src/utils/implicitFlowSecurity.ts - Security utilities for Implicit Flow V3
import { jwtVerify, createRemoteJWKSet, JWTPayload } from 'jose';
import { logger } from './logger';
import { discoveryService } from '../services/discoveryService';

export interface ImplicitFlowSecurityOptions {
  environmentId: string;
  clientId: string;
  expectedNonce?: string;
  expectedState?: string;
}

export interface TokenValidationResult {
  success: boolean;
  error?: string;
  payload?: JWTPayload;
  validatedClaims?: {
    iss?: string;
    aud?: string | string[];
    exp?: number;
    iat?: number;
    nonce?: string;
    sub?: string;
    azp?: string;
  };
}

/**
 * Validate ID token for OIDC Implicit Flow
 * Performs full JWT verification including signature, claims, and nonce validation
 */
export async function validateIdToken(
  idToken: string,
  options: ImplicitFlowSecurityOptions
): Promise<TokenValidationResult> {
  try {
    console.log(' [ImplicitFlowSecurity] Starting ID token validation...');
    logger.security('ImplicitFlowSecurity', 'Starting ID token validation', {
      environmentId: options.environmentId,
      clientId: options.clientId,
      hasExpectedNonce: !!options.expectedNonce,
      hasExpectedState: !!options.expectedState
    });

    // Step 1: Discover OpenID configuration to get JWKS endpoint
    const discoveryResult = await discoveryService.discoverConfiguration(options.environmentId);
    
    if (!discoveryResult.success || !discoveryResult.configuration) {
      const error = 'Failed to discover OpenID configuration';
      logger.error('ImplicitFlowSecurity', error, { environmentId: options.environmentId });
      return { success: false, error };
    }

    const config = discoveryResult.configuration;
    console.log(' [ImplicitFlowSecurity] OpenID configuration discovered:', {
      issuer: config.issuer,
      jwksUri: config.jwks_uri
    });

    // Step 2: Create remote JWKS set for signature verification
    const JWKS = createRemoteJWKSet(new URL(config.jwks_uri));
    
    // Step 3: Verify JWT signature and decode payload
    // Handle multiple possible issuer formats for PingOne compatibility
    const expectedIssuer = config.issuer.replace(/\/$/, ''); // Remove trailing slash
    const expectedIssuerWithAs = expectedIssuer.endsWith('/as') ? expectedIssuer : `${expectedIssuer}/as`;
    const expectedIssuerBase = expectedIssuer.endsWith('/as') ? expectedIssuer.replace('/as', '') : expectedIssuer;
    
    console.log(' [ImplicitFlowSecurity] Issuer validation options:', {
      expectedBase: expectedIssuerBase,
      expectedWithAs: expectedIssuerWithAs,
      configIssuer: config.issuer
    });

    const { payload } = await jwtVerify(idToken, JWKS, {
      issuer: [expectedIssuerBase, expectedIssuerWithAs], // Allow both formats
      audience: options.clientId,
      clockTolerance: 300 // 5 minutes tolerance for clock skew
    });

    console.log(' [ImplicitFlowSecurity] JWT signature verified successfully');
    logger.security('ImplicitFlowSecurity', 'JWT signature verified', {
      kid: payload.kid,
      issuer: payload.iss,
      audience: payload.aud,
      subject: payload.sub,
      expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'unknown'
    });

    // Step 4: Validate required claims
    const validationErrors: string[] = [];

    // Validate issuer (flexible validation for PingOne compatibility)
    const receivedIssuer = payload.iss;
    const isValidIssuer = receivedIssuer === expectedIssuerBase || 
                         receivedIssuer === expectedIssuerWithAs ||
                         receivedIssuer === config.issuer;
    
    if (!isValidIssuer) {
      validationErrors.push(`Invalid issuer: expected one of [${expectedIssuerBase}, ${expectedIssuerWithAs}, ${config.issuer}], got ${receivedIssuer}`);
    }

    // Validate audience (can be string or array)
    const aud = payload.aud;
    if (!aud || (Array.isArray(aud) && !aud.includes(options.clientId)) || (!Array.isArray(aud) && aud !== options.clientId)) {
      validationErrors.push(`Invalid audience: expected ${options.clientId}, got ${JSON.stringify(aud)}`);
    }

    // Validate expiration
    if (!payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) {
      validationErrors.push(`Token expired: exp=${payload.exp}, now=${Math.floor(Date.now() / 1000)}`);
    }

    // Validate issued at
    if (!payload.iat || payload.iat > Math.floor(Date.now() / 1000)) {
      validationErrors.push(`Invalid issued at: iat=${payload.iat}, now=${Math.floor(Date.now() / 1000)}`);
    }

    // Validate nonce (critical for implicit flow security)
    if (options.expectedNonce && payload.nonce !== options.expectedNonce) {
      validationErrors.push(`Invalid nonce: expected ${options.expectedNonce}, got ${payload.nonce}`);
    }

    // Validate subject
    if (!payload.sub) {
      validationErrors.push('Missing required claim: sub (subject)');
    }

    // Validate authorized party (azp) if present
    if (payload.azp && payload.azp !== options.clientId) {
      validationErrors.push(`Invalid authorized party: expected ${options.clientId}, got ${payload.azp}`);
    }

    if (validationErrors.length > 0) {
      const error = `Token validation failed: ${validationErrors.join(', ')}`;
      logger.error('ImplicitFlowSecurity', 'ID token validation failed', {
        errors: validationErrors,
        payload: {
          iss: payload.iss,
          aud: payload.aud,
          exp: payload.exp,
          iat: payload.iat,
          nonce: payload.nonce,
          sub: payload.sub,
          azp: payload.azp
        }
      });
      return { success: false, error };
    }

    console.log(' [ImplicitFlowSecurity] ID token validation successful');
    logger.security('ImplicitFlowSecurity', 'ID token validation successful', {
      subject: payload.sub,
      issuer: payload.iss,
      audience: payload.aud,
      expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'unknown'
    });

    return {
      success: true,
      payload,
      validatedClaims: {
        iss: payload.iss,
        aud: payload.aud,
        exp: payload.exp,
        iat: payload.iat,
        nonce: payload.nonce,
        sub: payload.sub,
        azp: payload.azp
      }
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
    console.error(' [ImplicitFlowSecurity] ID token validation error:', errorMessage);
    logger.error('ImplicitFlowSecurity', 'ID token validation error', { error: errorMessage });
    
    return { success: false, error: errorMessage };
  }
}

/**
 * Validate state parameter for CSRF protection
 */
export function validateStateParameter(
  receivedState: string | null,
  expectedState: string | null
): { success: boolean; error?: string } {
  if (!receivedState) {
    return { success: false, error: 'State parameter is missing from callback' };
  }

  if (!expectedState) {
    return { success: false, error: 'Expected state parameter not found in session storage' };
  }

  if (receivedState !== expectedState) {
    return { 
      success: false, 
      error: `State parameter mismatch: received '${receivedState.substring(0, 8)}...', expected '${expectedState.substring(0, 8)}...'` 
    };
  }

  console.log(' [ImplicitFlowSecurity] State parameter validated successfully');
  logger.security('ImplicitFlowSecurity', 'State parameter validated', {
    receivedLength: receivedState.length,
    expectedLength: expectedState.length
  });

  return { success: true };
}

/**
 * Clear security-sensitive data from session storage
 */
export function clearSecurityData(flowType: 'oauth2' | 'oidc'): void {
  const stateKey = flowType === 'oidc' ? 'oidc_implicit_v3_state' : 'oauth2_implicit_v3_state';
  const nonceKey = 'oidc_implicit_v3_nonce';
  const flowContextKey = flowType === 'oidc' ? 'oidc_implicit_v3_flow_context' : 'oauth2_implicit_v3_flow_context';

  sessionStorage.removeItem(stateKey);
  sessionStorage.removeItem(nonceKey);
  sessionStorage.removeItem(flowContextKey);

  console.log(' [ImplicitFlowSecurity] Security data cleared from session storage');
  logger.security('ImplicitFlowSecurity', 'Security data cleared', { flowType });
}

/**
 * Generate secure random values for state and nonce
 */
export function generateSecurityParameters(length: number = 32): {
  state: string;
  nonce: string;
} {
  const state = generateRandomString(length);
  const nonce = generateRandomString(length);

  console.log(' [ImplicitFlowSecurity] Generated security parameters:', {
    stateLength: state.length,
    nonceLength: nonce.length
  });

  return { state, nonce };
}

/**
 * Generate a secure random string
 */
function generateRandomString(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  
  // Use crypto.getRandomValues for secure random generation
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  for (let i = 0; i < length; i++) {
    result += charset[array[i] % charset.length];
  }
  
  return result;
}

/**
 * Store security parameters in session storage
 */
export function storeSecurityParameters(
  flowType: 'oauth2' | 'oidc',
  state: string,
  nonce?: string
): void {
  const stateKey = flowType === 'oidc' ? 'oidc_implicit_v3_state' : 'oauth2_implicit_v3_state';
  const nonceKey = 'oidc_implicit_v3_nonce';

  sessionStorage.setItem(stateKey, state);
  if (nonce && flowType === 'oidc') {
    sessionStorage.setItem(nonceKey, nonce);
  }

  console.log(' [ImplicitFlowSecurity] Security parameters stored:', {
    flowType,
    stateLength: state.length,
    nonceLength: nonce?.length || 0
  });

  logger.security('ImplicitFlowSecurity', 'Security parameters stored', {
    flowType,
    hasState: !!state,
    hasNonce: !!nonce
  });
}
