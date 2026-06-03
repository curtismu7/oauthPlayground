import dotenv from "dotenv";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { logger } from "./services/logger.js";
import { buildToolErrorResult } from "./services/mcpErrors.js";

// Load environment variables
dotenv.config();

// Import tool definitions and handlers
import { jwtDecodeToolDefinition, handleJwtDecode } from "./actions/jwtDecode.js";
import {
  jwtVerifySignatureToolDefinition,
  jwtValidateClaimsToolDefinition,
  handleJwtVerifySignature,
  handleJwtValidateClaims,
} from "./actions/jwtVerify.js";
import {
  jwtFetchJwksToolDefinition,
  jwtInspectKeyToolDefinition,
  handleJwtFetchJwks,
  handleJwtInspectKey,
} from "./actions/jwksTools.js";

const server = new Server({
  name: "jwt-verifier-mcp-server",
  version: "1.0.0",
});

// Tool registry
const tools = [
  {
    definition: jwtDecodeToolDefinition,
    handler: handleJwtDecode,
  },
  {
    definition: jwtVerifySignatureToolDefinition,
    handler: handleJwtVerifySignature,
  },
  {
    definition: jwtValidateClaimsToolDefinition,
    handler: handleJwtValidateClaims,
  },
  {
    definition: jwtFetchJwksToolDefinition,
    handler: handleJwtFetchJwks,
  },
  {
    definition: jwtInspectKeyToolDefinition,
    handler: handleJwtInspectKey,
  },
];

// Handle ListTools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  logger.debug("ListTools request received");
  return {
    tools: tools.map((t) => t.definition),
  };
});

// Handle CallTool request
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  logger.debug("CallTool request received", { toolName: name, args });

  const tool = tools.find((t) => t.definition.name === name);

  if (!tool) {
    logger.error("Unknown tool requested", { toolName: name });
    return buildToolErrorResult(
      new Error(`Unknown tool: ${name}`),
      name,
    );
  }

  try {
    const result = await tool.handler(args);
    logger.debug("Tool executed successfully", { toolName: name });
    return result;
  } catch (error) {
    logger.error("Tool execution failed", {
      toolName: name,
      error: error instanceof Error ? error.message : String(error),
    });
    return buildToolErrorResult(error, name);
  }
});

// Start server
async function main() {
  logger.info("JWT Verifier MCP Server starting");
  logger.info("Registered tools", {
    toolCount: tools.length,
    toolNames: tools.map((t) => t.definition.name),
  });

  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logger.info("JWT Verifier MCP Server connected and ready");
  } catch (error) {
    logger.error("Failed to start server", {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error("Fatal error", { error: error instanceof Error ? error.message : String(error) });
  process.exit(1);
});
