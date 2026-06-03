import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { JwtVerifierService } from "../services/jwtVerifierService.js";
import { buildToolErrorResult, ToolErrorResult } from "../services/mcpErrors.js";
import { logger } from "../services/logger.js";

export const jwtVerifySignatureToolDefinition: Tool = {
  name: "jwt_verify_signature",
  description:
    "Verifies the cryptographic signature of a JWT using the provided JWKS URL. Ensures the token was issued and signed by a trusted issuer.",
  inputSchema: {
    type: "object",
    properties: {
      token: {
        type: "string",
        description: "The JWT token to verify (required).",
      },
      jwksUrl: {
        type: "string",
        description:
          "The URL to the JSON Web Key Set (JWKS) endpoint used for signature verification (required). Example: https://auth.example.com/.well-known/jwks.json",
      },
    },
    required: ["token", "jwksUrl"],
  },
};

export const jwtValidateClaimsToolDefinition: Tool = {
  name: "jwt_validate_claims",
  description:
    "Validates specific claims in a JWT payload without verifying the signature. Useful for checking claim values without cryptographic verification.",
  inputSchema: {
    type: "object",
    properties: {
      token: {
        type: "string",
        description: "The JWT token to validate (required).",
      },
      expectedClaims: {
        type: "object",
        description:
          "Object containing claim names and expected values to validate against. Example: {\"aud\": \"my-audience\", \"iss\": \"https://issuer.example.com\"}",
        additionalProperties: true,
      },
    },
    required: ["token"],
  },
};

const JwtVerifySignatureInput = z.object({
  token: z.string().min(10),
  jwksUrl: z.string().url("Invalid JWKS URL format"),
});

const JwtValidateClaimsInput = z.object({
  token: z.string().min(10),
  expectedClaims: z.record(z.unknown()).optional(),
});

export async function handleJwtVerifySignature(
  input: unknown,
): Promise<ToolErrorResult | { content: Array<{ type: "text"; text: string }> }> {
  try {
    const parsed = JwtVerifySignatureInput.parse(input);
    logger.debug("Verifying JWT signature", { jwksUrl: parsed.jwksUrl });

    const result = await JwtVerifierService.verifyJwtSignature(parsed.token, parsed.jwksUrl);

    const output = {
      valid: result.valid,
      error: result.error || null,
      payload: result.payload || null,
      expiration: result.payload
        ? {
            expiresAt: result.payload.exp
              ? new Date((result.payload.exp as number) * 1000).toISOString()
              : "never",
            secondsUntilExpiration: JwtVerifierService.getTimeUntilExpiration(result.payload),
            isExpired: JwtVerifierService.isTokenExpired(result.payload),
          }
        : null,
    };

    logger.info("JWT signature verification completed", { valid: result.valid });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(output, null, 2),
        },
      ],
    };
  } catch (error) {
    logger.error("JWT signature verification failed", { error: error instanceof Error ? error.message : String(error) });
    return buildToolErrorResult(error, "jwt_verify_signature");
  }
}

export async function handleJwtValidateClaims(
  input: unknown,
): Promise<ToolErrorResult | { content: Array<{ type: "text"; text: string }> }> {
  try {
    const parsed = JwtValidateClaimsInput.parse(input);
    logger.debug("Validating JWT claims", { claimCount: Object.keys(parsed.expectedClaims || {}).length });

    const decoded = JwtVerifierService.decodeJwtParts(parsed.token);

    const validation = JwtVerifierService.validateClaims(
      decoded.payload as Record<string, unknown>,
      (parsed.expectedClaims as Record<string, unknown>) || {},
    );

    const output = {
      valid: validation.valid,
      errors: validation.errors,
      claimsChecked: Object.keys(parsed.expectedClaims || {}),
      expiration: {
        expiresAt: decoded.payload.exp
          ? new Date((decoded.payload.exp as number) * 1000).toISOString()
          : "never",
        isExpired: decoded.payload.exp
          ? Date.now() > ((decoded.payload.exp as number) * 1000)
          : false,
      },
    };

    logger.info("JWT claims validation completed", { valid: validation.valid });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(output, null, 2),
        },
      ],
    };
  } catch (error) {
    logger.error("JWT claims validation failed", { error: error instanceof Error ? error.message : String(error) });
    return buildToolErrorResult(error, "jwt_validate_claims");
  }
}
