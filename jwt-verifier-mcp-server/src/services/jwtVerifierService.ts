import { jwtVerify, createRemoteJWKSet, decodeJwt, JWTPayload } from "jose";
import axios from "axios";
import { logger } from "./logger.js";

export interface DecodedJwtParts {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
}

export interface JWKSResponse {
  keys: Array<{
    kty: string;
    kid?: string;
    use?: string;
    alg?: string;
    n?: string;
    e?: string;
    crv?: string;
    x?: string;
    y?: string;
    [key: string]: unknown;
  }>;
}

export interface VerifyResult {
  valid: boolean;
  payload?: JWTPayload;
  error?: string;
}

export interface ClaimsValidationResult {
  valid: boolean;
  errors: string[];
}

export class JwtVerifierService {
  /**
   * Decodes JWT into header, payload, and signature parts (no verification)
   */
  static decodeJwtParts(token: string): DecodedJwtParts {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid JWT format: expected 3 parts separated by dots");
    }

    const [headerB64, payloadB64, signatureB64] = parts;

    try {
      const header = JSON.parse(
        Buffer.from(headerB64, "base64url").toString("utf-8"),
      ) as Record<string, unknown>;

      const payload = JSON.parse(
        Buffer.from(payloadB64, "base64url").toString("utf-8"),
      ) as Record<string, unknown>;

      return {
        header,
        payload,
        signature: signatureB64,
      };
    } catch (error) {
      throw new Error(`Failed to decode JWT parts: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Fetches JWKS from a remote URL
   */
  static async fetchJwks(jwksUrl: string): Promise<JWKSResponse> {
    try {
      logger.debug("Fetching JWKS", { url: jwksUrl });
      const response = await axios.get<JWKSResponse>(jwksUrl, {
        timeout: 10000,
      });

      if (!response.data.keys || !Array.isArray(response.data.keys)) {
        throw new Error("Invalid JWKS response: missing 'keys' array");
      }

      logger.info("JWKS fetched successfully", { keyCount: response.data.keys.length });
      return response.data;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error("Failed to fetch JWKS", { url: jwksUrl, error: errorMsg });
      throw new Error(`Failed to fetch JWKS from ${jwksUrl}: ${errorMsg}`);
    }
  }

  /**
   * Verifies JWT signature using a JWKS URL
   */
  static async verifyJwtSignature(
    token: string,
    jwksUrl: string,
  ): Promise<VerifyResult> {
    try {
      logger.debug("Verifying JWT signature", { jwksUrl });

      const JWKS = createRemoteJWKSet(new URL(jwksUrl));
      const verified = await jwtVerify(token, JWKS, {
        // Allow skipping algorithm check if needed for debugging
      });

      logger.info("JWT signature verified successfully");
      return {
        valid: true,
        payload: verified.payload,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.warn("JWT signature verification failed", { error: errorMsg });
      return {
        valid: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Validates specific claims in a JWT payload
   */
  static validateClaims(
    payload: Record<string, unknown>,
    expectedClaims: Record<string, unknown>,
  ): ClaimsValidationResult {
    const errors: string[] = [];

    for (const [key, expectedValue] of Object.entries(expectedClaims)) {
      const actualValue = payload[key];

      if (actualValue === undefined) {
        errors.push(`Missing claim: ${key}`);
        continue;
      }

      // For audience (aud), handle both string and array formats
      if (key === "aud") {
        const expectedStr = String(expectedValue);
        if (Array.isArray(actualValue)) {
          if (!actualValue.includes(expectedStr)) {
            errors.push(
              `Audience mismatch: expected ${expectedStr}, got [${actualValue.join(", ")}]`,
            );
          }
        } else if (actualValue !== expectedStr) {
          errors.push(`Audience mismatch: expected ${expectedStr}, got ${actualValue}`);
        }
      } else if (actualValue !== expectedValue) {
        errors.push(
          `Claim mismatch for ${key}: expected ${expectedValue}, got ${actualValue}`,
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Checks if JWT is expired
   */
  static isTokenExpired(payload: JWTPayload): boolean {
    if (!payload.exp) {
      return false; // No expiration claim
    }

    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();

    return currentTime > expirationTime;
  }

  /**
   * Gets time until JWT expires (in seconds, negative if already expired)
   */
  static getTimeUntilExpiration(payload: JWTPayload): number | null {
    if (!payload.exp) {
      return null;
    }

    const expirationTime = payload.exp;
    const currentTime = Math.floor(Date.now() / 1000);

    return expirationTime - currentTime;
  }
}
