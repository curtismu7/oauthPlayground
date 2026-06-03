import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { JwtVerifierService, JWKSResponse } from "../services/jwtVerifierService.js";
import { buildToolErrorResult, ToolErrorResult } from "../services/mcpErrors.js";
import { logger } from "../services/logger.js";

export const jwtFetchJwksToolDefinition: Tool = {
  name: "jwt_fetch_jwks",
  description:
    "Fetches the JSON Web Key Set (JWKS) from a remote URL. Returns all available public keys used by the issuer for signing tokens.",
  inputSchema: {
    type: "object",
    properties: {
      jwksUrl: {
        type: "string",
        description:
          "The URL to the JWKS endpoint (required). Example: https://auth.example.com/.well-known/jwks.json",
      },
    },
    required: ["jwksUrl"],
  },
};

export const jwtInspectKeyToolDefinition: Tool = {
  name: "jwt_inspect_key",
  description:
    "Inspects a specific key from a JWKS endpoint by key ID (kid). Useful for understanding the properties and algorithm of a specific signing key.",
  inputSchema: {
    type: "object",
    properties: {
      jwksUrl: {
        type: "string",
        description: "The URL to the JWKS endpoint (required).",
      },
      keyId: {
        type: "string",
        description:
          "The key ID (kid) to search for (required). If not found in JWKS, an error is returned.",
      },
    },
    required: ["jwksUrl", "keyId"],
  },
};

const JwtFetchJwksInput = z.object({
  jwksUrl: z.string().url("Invalid JWKS URL format"),
});

const JwtInspectKeyInput = z.object({
  jwksUrl: z.string().url("Invalid JWKS URL format"),
  keyId: z.string().min(1, "Key ID must not be empty"),
});

export async function handleJwtFetchJwks(
  input: unknown,
): Promise<ToolErrorResult | { content: Array<{ type: "text"; text: string }> }> {
  try {
    const parsed = JwtFetchJwksInput.parse(input);
    logger.debug("Fetching JWKS", { url: parsed.jwksUrl });

    const jwks: JWKSResponse = await JwtVerifierService.fetchJwks(parsed.jwksUrl);

    const keySummary = jwks.keys.map((key) => ({
      keyId: key.kid || "no-id",
      keyType: key.kty || "unknown",
      algorithm: key.alg || "unspecified",
      usage: key.use || "unknown",
      hasPublicComponents: {
        rsa: !!(key.n && key.e),
        ec: !!(key.x && key.y && key.crv),
        rsa_or_ec: !!(key.n && key.e) || !!(key.x && key.y),
      },
    }));

    const output = {
      jwksUrl: parsed.jwksUrl,
      totalKeys: jwks.keys.length,
      keys: jwks.keys,
      summary: keySummary,
    };

    logger.info("JWKS fetched and processed successfully", { keyCount: jwks.keys.length });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(output, null, 2),
        },
      ],
    };
  } catch (error) {
    logger.error("Failed to fetch JWKS", { error: error instanceof Error ? error.message : String(error) });
    return buildToolErrorResult(error, "jwt_fetch_jwks");
  }
}

export async function handleJwtInspectKey(
  input: unknown,
): Promise<ToolErrorResult | { content: Array<{ type: "text"; text: string }> }> {
  try {
    const parsed = JwtInspectKeyInput.parse(input);
    logger.debug("Inspecting JWKS key", { keyId: parsed.keyId, url: parsed.jwksUrl });

    const jwks: JWKSResponse = await JwtVerifierService.fetchJwks(parsed.jwksUrl);

    const key = jwks.keys.find((k) => k.kid === parsed.keyId);

    if (!key) {
      const availableKeys = jwks.keys.map((k) => k.kid || "no-id");
      return buildToolErrorResult(
        new Error(
          `Key ID '${parsed.keyId}' not found in JWKS. Available keys: [${availableKeys.join(", ")}]`,
        ),
        "jwt_inspect_key",
      );
    }

    const output = {
      keyId: key.kid,
      key,
      keyInfo: {
        keyType: key.kty,
        algorithm: key.alg || "unspecified",
        usage: key.use || "unspecified",
        operations: key.key_ops || [],
        certificateChain: (key as Record<string, unknown>).x5c ? "present" : "absent",
      },
      publicComponentsAvailable: {
        rsa: !!(key.n && key.e),
        ec: !!(key.x && key.y && key.crv),
      },
    };

    logger.info("JWKS key inspected successfully", { keyId: parsed.keyId });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(output, null, 2),
        },
      ],
    };
  } catch (error) {
    logger.error("Failed to inspect JWKS key", { error: error instanceof Error ? error.message : String(error) });
    return buildToolErrorResult(error, "jwt_inspect_key");
  }
}
