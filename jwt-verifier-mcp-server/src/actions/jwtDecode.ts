import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { JwtVerifierService, DecodedJwtParts } from "../services/jwtVerifierService.js";
import { buildToolErrorResult, ToolErrorResult } from "../services/mcpErrors.js";
import { logger } from "../services/logger.js";

export const jwtDecodeToolDefinition: Tool = {
  name: "jwt_decode_full",
  description:
    "Decodes a JWT token into header, payload, and signature without verifying the signature. Useful for inspecting token contents.",
  inputSchema: {
    type: "object",
    properties: {
      token: {
        type: "string",
        description: "The JWT token to decode (required). Must be a valid JWT format with 3 parts separated by dots.",
      },
    },
    required: ["token"],
  },
};

const JwtDecodeInput = z.object({
  token: z.string().min(10, "Token must be at least 10 characters"),
});

export async function handleJwtDecode(input: unknown): Promise<ToolErrorResult | { content: Array<{ type: "text"; text: string }> }> {
  try {
    const parsed = JwtDecodeInput.parse(input);
    logger.debug("Decoding JWT", { tokenLength: parsed.token.length });

    const decoded: DecodedJwtParts = JwtVerifierService.decodeJwtParts(parsed.token);

    const result = {
      header: decoded.header,
      payload: decoded.payload,
      signature: decoded.signature,
      summary: {
        algorithm: decoded.header.alg || "unknown",
        keyId: decoded.header.kid || "not specified",
        tokenType: decoded.header.typ || "JWT",
        subject: decoded.payload.sub || "not specified",
        issuer: decoded.payload.iss || "not specified",
        expiresAt: decoded.payload.exp ? new Date((decoded.payload.exp as number) * 1000).toISOString() : "never",
      },
    };

    logger.info("JWT decoded successfully");

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    logger.error("JWT decode failed", { error: error instanceof Error ? error.message : String(error) });
    return buildToolErrorResult(error, "jwt_decode_full");
  }
}
