// src/utils/jwtValidation.ts - JWT validation utilities for multi-flow reuse
import { JWTPayload } from 'jose';
import { logger } from './logger';
import { validateJWT, JWKSConfig, TokenValidationOptions, ValidationResult } from './jwks';

/**
 * Extended validation options for different flow types
 */
export interface ExtendedValidationOptions extends TokenValidationOptions {
  /** Flow-specific validations */
  flowType?: 'authorization_code' | 'implicit' | 'hybrid' | 'client_credentials' | 'device_code';
  /** Required claims for the flow */
  requiredClaims?: string[];
  /** Required scopes */
  requiredScopes?: string[];
  /** Custom claim validators */
  customValidators?: Array<(payload: JWTPayload) => string | null>;
}

/**
 * Result of extended JWT validation
 */
export interface ExtendedValidationResult extends ValidationResult {
  /** Flow-specific validation results */
  flowValidation?: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
  /** Claim validation results */
  claimValidation?: {
    valid: boolean;
    missingClaims: string[];
    invalidClaims: string[];
  };
  /** Scope validation results */
  scopeValidation?: {
    valid: boolean;
    missingScopes: string[];
    availableScopes: string[];
  };
}

/**
 * Verify JWT signature with extended validation
 */
export async function verifyJWTSignature(
  token: string, 
  config: JWKSConfig, 
  options: ExtendedValidationOptions = {}
): Promise<ExtendedValidationResult> {
  try {
    logger.info('JWTValidation', 'Starting extended JWT validation', {
      flowType: options.flowType,
      hasRequiredClaims: !!options.requiredClaims?.length,
      hasRequiredScopes: !!options.requiredScopes?.length
    });

    // Perform basic JWT validation
    const basicResult = await validateJWT(token, config, options);
    
    if (!basicResult.valid) {
      return {
        ...basicResult,
        flowValidation: { valid: false, errors: [basicResult.error || 'Basic validation failed'], warnings: [] },
        claimValidation: { valid: false, missingClaims: [], invalidClaims: [] },
        scopeValidation: { valid: false, missingScopes: [], availableScopes: [] }
      };
    }

    const payload = basicResult.payload!;
    const flowErrors: string[] = [];
    const flowWarnings: string[] = [];

    // Flow-specific validations
    if (options.flowType) {
      const flowValidation = validateFlowSpecificClaims(payload, options.flowType);
      flowErrors.push(...flowValidation.errors);
      flowWarnings.push(...flowValidation.warnings);
    }

    // Required claims validation
    const claimValidation = validateRequiredClaims(payload, options.requiredClaims || []);
    
    // Scope validation
    const scopeValidation = validateScopes(payload, options.requiredScopes || []);

    // Custom validators
    if (options.customValidators) {
      for (const validator of options.customValidators) {
        const error = validator(payload);
        if (error) {
          flowErrors.push(error);
        }
      }
    }

    const isValid = flowErrors.length === 0 && claimValidation.valid && scopeValidation.valid;

    logger.info('JWTValidation', 'Extended validation completed', {
      valid: isValid,
      flowErrors: flowErrors.length,
      claimErrors: claimValidation.invalidClaims.length,
      scopeErrors: scopeValidation.missingScopes.length,
      warnings: flowWarnings.length
    });

    return {
      ...basicResult,
      valid: isValid,
      flowValidation: {
        valid: flowErrors.length === 0,
        errors: flowErrors,
        warnings: flowWarnings
      },
      claimValidation,
      scopeValidation
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
    logger.error('JWTValidation', 'Extended JWT validation failed', error);
    return {
      valid: false,
      error: errorMessage,
      flowValidation: { valid: false, errors: [errorMessage], warnings: [] },
      claimValidation: { valid: false, missingClaims: [], invalidClaims: [] },
      scopeValidation: { valid: false, missingScopes: [], availableScopes: [] }
    };
  }
}

/**
 * Validate JWT claims
 */
export function validateJWTClaims(payload: JWTPayload, options: TokenValidationOptions): ValidationResult {
  const errors: string[] = [];

  // Validate issuer
  if (options.issuer) {
    const expectedIssuers = Array.isArray(options.issuer) ? options.issuer : [options.issuer];
    if (!payload.iss || !expectedIssuers.includes(payload.iss)) {
      errors.push(`Invalid issuer: expected one of [${expectedIssuers.join(', ')}], got ${payload.iss}`);
    }
  }

  // Validate audience
  if (options.audience) {
    const expectedAudiences = Array.isArray(options.audience) ? options.audience : [options.audience];
    const aud = payload.aud;
    if (!aud || (Array.isArray(aud) && !aud.some(a => expectedAudiences.includes(a))) || 
        (!Array.isArray(aud) && !expectedAudiences.includes(aud))) {
      errors.push(`Invalid audience: expected one of [${expectedAudiences.join(', ')}], got ${JSON.stringify(aud)}`);
    }
  }

  // Validate expiration
  if (!payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) {
    errors.push(`Token expired: exp=${payload.exp}, now=${Math.floor(Date.now() / 1000)}`);
  }

  // Validate issued at
  if (!payload.iat || typeof payload.iat !== 'number') {
    errors.push('Missing or invalid iat (issued at) claim');
  }

  // Validate not before
  if (payload.nbf && payload.nbf > Math.floor(Date.now() / 1000)) {
    errors.push(`Token not valid yet: nbf=${payload.nbf}, now=${Math.floor(Date.now() / 1000)}`);
  }

  return {
    valid: errors.length === 0,
    error: errors.length > 0 ? errors.join('; ') : undefined,
    payload
  };
}

/**
 * Check if token is expired
 */
export function checkTokenExpiry(payload: JWTPayload, clockTolerance: number = 0): boolean {
  if (!payload.exp) return true;
  
  const now = Math.floor(Date.now() / 1000);
  return payload.exp - clockTolerance <= now;
}

/**
 * Validate flow-specific claims
 */
function validateFlowSpecificClaims(payload: JWTPayload, flowType: string): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  switch (flowType) {
    case 'authorization_code':
      // Authorization Code flow specific validations
      if (!payload.sub) {
        errors.push('Missing sub (subject) claim required for authorization code flow');
      }
      break;

    case 'implicit':
      // Implicit flow specific validations
      if (!payload.sub) {
        errors.push('Missing sub (subject) claim required for implicit flow');
      }
      if (!payload.nonce) {
        warnings.push('Missing nonce claim - reduces security against replay attacks');
      }
      break;

    case 'hybrid':
      // Hybrid flow specific validations
      if (!payload.sub) {
        errors.push('Missing sub (subject) claim required for hybrid flow');
      }
      if (!payload.c_hash && !payload.at_hash) {
        warnings.push('Missing c_hash or at_hash - reduces security');
      }
      break;

    case 'client_credentials':
      // Client credentials flow specific validations
      if (!payload.sub) {
        errors.push('Missing sub (subject) claim required for client credentials flow');
      }
      break;

    case 'device_code':
      // Device code flow specific validations
      if (!payload.sub) {
        errors.push('Missing sub (subject) claim required for device code flow');
      }
      break;

    default:
      warnings.push(`Unknown flow type: ${flowType}`);
  }

  return { errors, warnings };
}

/**
 * Validate required claims
 */
function validateRequiredClaims(payload: JWTPayload, requiredClaims: string[]): {
  valid: boolean;
  missingClaims: string[];
  invalidClaims: string[];
} {
  const missingClaims: string[] = [];
  const invalidClaims: string[] = [];

  for (const claim of requiredClaims) {
    if (!(claim in payload)) {
      missingClaims.push(claim);
    } else {
      // Basic validation for common claims
      const value = payload[claim];
      if (value === null || value === undefined || value === '') {
        invalidClaims.push(claim);
      }
    }
  }

  return {
    valid: missingClaims.length === 0 && invalidClaims.length === 0,
    missingClaims,
    invalidClaims
  };
}

/**
 * Validate scopes
 */
function validateScopes(payload: JWTPayload, requiredScopes: string[]): {
  valid: boolean;
  missingScopes: string[];
  availableScopes: string[];
} {
  const availableScopes: string[] = [];
  const missingScopes: string[] = [];

  // Extract scopes from payload
  if (payload.scope && typeof payload.scope === 'string') {
    availableScopes.push(...payload.scope.split(' '));
  }

  // Check required scopes
  for (const scope of requiredScopes) {
    if (!availableScopes.includes(scope)) {
      missingScopes.push(scope);
    }
  }

  return {
    valid: missingScopes.length === 0,
    missingScopes,
    availableScopes
  };
}

/**
 * Create a validator for specific claim values
 */
export function createClaimValidator(claim: string, expectedValue: any): (payload: JWTPayload) => string | null {
  return (payload: JWTPayload) => {
    const actualValue = payload[claim];
    if (actualValue !== expectedValue) {
      return `Invalid ${claim}: expected ${JSON.stringify(expectedValue)}, got ${JSON.stringify(actualValue)}`;
    }
    return null;
  };
}

/**
 * Create a validator for claim presence
 */
export function createClaimPresenceValidator(claim: string): (payload: JWTPayload) => string | null {
  return (payload: JWTPayload) => {
    if (!(claim in payload) || payload[claim] === null || payload[claim] === undefined) {
      return `Missing required claim: ${claim}`;
    }
    return null;
  };
}

/**
 * Create a validator for claim type
 */
export function createClaimTypeValidator(claim: string, expectedType: string): (payload: JWTPayload) => string | null {
  return (payload: JWTPayload) => {
    const value = payload[claim];
    if (value !== null && value !== undefined && typeof value !== expectedType) {
      return `Invalid ${claim} type: expected ${expectedType}, got ${typeof value}`;
    }
    return null;
  };
}

/**
 * Create a validator for numeric claim range
 */
export function createNumericRangeValidator(claim: string, min?: number, max?: number): (payload: JWTPayload) => string | null {
  return (payload: JWTPayload) => {
    const value = payload[claim];
    if (typeof value !== 'number') {
      return `Invalid ${claim}: expected number, got ${typeof value}`;
    }
    if (min !== undefined && value < min) {
      return `Invalid ${claim}: value ${value} is below minimum ${min}`;
    }
    if (max !== undefined && value > max) {
      return `Invalid ${claim}: value ${value} is above maximum ${max}`;
    }
    return null;
  };
}

/**
 * Create a validator for string claim pattern
 */
export function createStringPatternValidator(claim: string, pattern: RegExp): (payload: JWTPayload) => string | null {
  return (payload: JWTPayload) => {
    const value = payload[claim];
    if (typeof value !== 'string') {
      return `Invalid ${claim}: expected string, got ${typeof value}`;
    }
    if (!pattern.test(value)) {
      return `Invalid ${claim}: value "${value}" does not match pattern ${pattern}`;
    }
    return null;
  };
}

