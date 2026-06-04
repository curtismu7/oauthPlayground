import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import 'dotenv/config';
import { logger } from './services/logger.js';
import { ValidationError } from './services/mcpErrors.js';

import { generatePkcePair, PkceRequestSchema } from './actions/pkce.js';
import { buildAuthorizationUrl, UrlBuilderRequestSchema } from './actions/urlBuilder.js';
import { simulateFlow, SimulatorRequestSchema } from './actions/simulator.js';
import { validateTokenResponse, ValidateTokenResponseRequestSchema, checkFlowConfig, CheckFlowConfigRequestSchema } from './actions/validator.js';
import { generateTestScenarios, GenerateScenariosRequestSchema } from './actions/scenarios.js';

interface ToolInput {
  verifierLength?: number;
  baseUrl?: string;
  clientId?: string;
  redirectUri?: string;
  scope?: string;
  responseType?: string;
  state?: string;
  nonce?: string;
  codeChallenge?: string;
  extraParams?: Record<string, string>;
  flowType?: string;
  config?: Record<string, unknown>;
  response?: Record<string, unknown>;
}

class OAuthSimulatorServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'oauth-simulator-mcp-server',
        version: '1.0.0',
      },
      {
        // tools capability must be declared before registering tools/list +
        // tools/call handlers, or the SDK throws on startup.
        capabilities: { tools: {} },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      logger.info('Listing available tools');
      return {
        tools: this.getTools(),
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      logger.info('Tool call received', { tool: request.params.name });
      return this.handleToolCall(request.params.name, request.params.arguments as ToolInput);
    });
  }

  private getTools(): Tool[] {
    return [
      {
        name: 'generate_pkce_pair',
        description:
          'Generate a PKCE (Proof Key for Public Clients) code verifier and challenge pair using SHA-256. Returns codeVerifier (43-128 characters), codeChallenge (base64url-encoded SHA-256 hash), and codeChallengeMethod (S256).',
        inputSchema: {
          type: 'object' as const,
          properties: {
            verifierLength: {
              type: 'integer',
              minimum: 43,
              maximum: 128,
              description: 'Length of the code verifier in characters (43-128). Defaults to 128.',
            },
          },
        },
      },
      {
        name: 'build_authorization_url',
        description:
          'Build an OAuth 2.0 authorization URL with parameters. Returns the full URL and extracted parameters for verification.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            baseUrl: {
              type: 'string',
              description: 'Base URL of the OAuth provider (e.g., https://auth.example.com)',
            },
            clientId: {
              type: 'string',
              description: 'OAuth client ID',
            },
            redirectUri: {
              type: 'string',
              description: 'Redirect URI for the OAuth callback',
            },
            scope: {
              type: 'string',
              description: 'Space-separated list of scopes (default: "openid profile email")',
            },
            responseType: {
              type: 'string',
              enum: ['code', 'token', 'id_token', 'code id_token', 'token id_token', 'code token id_token'],
              description: 'OAuth response type',
            },
            state: {
              type: 'string',
              description: 'CSRF protection state parameter',
            },
            nonce: {
              type: 'string',
              description: 'Nonce for OpenID Connect (prevents replay attacks)',
            },
            codeChallenge: {
              type: 'string',
              description: 'PKCE code challenge (base64url-encoded SHA-256 hash)',
            },
            extraParams: {
              type: 'object',
              description: 'Additional query parameters',
            },
          },
          required: ['baseUrl', 'clientId', 'responseType'],
        },
      },
      {
        name: 'simulate_flow',
        description:
          'Simulate an OAuth 2.0 or OpenID Connect flow step-by-step. Supports: authorization_code, implicit, client_credentials, device_code, password. Returns detailed steps with descriptions, methods, parameters, and RFC references.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            flowType: {
              type: 'string',
              enum: ['authorization_code', 'implicit', 'client_credentials', 'device_code', 'password'],
              description: 'Type of OAuth 2.0 flow to simulate',
            },
            config: {
              type: 'object',
              properties: {
                clientId: {
                  type: 'string',
                  description: 'OAuth client ID',
                },
                redirectUri: {
                  type: 'string',
                  description: 'Redirect URI (required for authorization_code and implicit flows)',
                },
                scope: {
                  type: 'string',
                  description: 'Requested scopes (default: "openid profile email")',
                },
                enablePkce: {
                  type: 'boolean',
                  description: 'Enable PKCE for additional security',
                },
                issuerUrl: {
                  type: 'string',
                  description: 'OAuth provider issuer URL',
                },
                username: {
                  type: 'string',
                  description: 'Username for password flow',
                },
              },
              required: ['clientId'],
            },
          },
          required: ['flowType', 'config'],
        },
      },
      {
        name: 'validate_token_response',
        description:
          'Validate an OAuth token response for required fields and correct formats. Checks for access_token, token_type, expires_in, scope, and id_token (if present).',
        inputSchema: {
          type: 'object' as const,
          properties: {
            response: {
              type: 'object',
              description: 'Token response object to validate',
            },
          },
          required: ['response'],
        },
      },
      {
        name: 'check_flow_config',
        description:
          'Validate OAuth flow configuration for completeness and best practices. Identifies errors and warnings, provides recommendations.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            flowType: {
              type: 'string',
              enum: ['authorization_code', 'implicit', 'client_credentials', 'device_code', 'password'],
              description: 'OAuth flow type',
            },
            config: {
              type: 'object',
              description: 'Flow configuration to validate',
            },
          },
          required: ['flowType', 'config'],
        },
      },
      {
        name: 'generate_test_scenarios',
        description:
          'Generate comprehensive test scenarios for a specific OAuth flow. Includes happy path, security checks, edge cases, and RFC references.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            flowType: {
              type: 'string',
              enum: ['authorization_code', 'implicit', 'client_credentials', 'device_code', 'password'],
              description: 'OAuth flow type to generate scenarios for',
            },
          },
          required: ['flowType'],
        },
      },
    ];
  }

  private async handleToolCall(toolName: string, args: ToolInput): Promise<{ content: Array<{ type: string; text: string }> }> {
    try {
      let result: unknown;

      switch (toolName) {
        case 'generate_pkce_pair': {
          const validated = PkceRequestSchema.parse(args);
          result = await generatePkcePair(validated);
          break;
        }

        case 'build_authorization_url': {
          const validated = UrlBuilderRequestSchema.parse(args);
          result = await buildAuthorizationUrl(validated);
          break;
        }

        case 'simulate_flow': {
          const validated = SimulatorRequestSchema.parse(args);
          result = await simulateFlow(validated);
          break;
        }

        case 'validate_token_response': {
          const validated = ValidateTokenResponseRequestSchema.parse(args);
          result = await validateTokenResponse(validated);
          break;
        }

        case 'check_flow_config': {
          const validated = CheckFlowConfigRequestSchema.parse(args);
          result = await checkFlowConfig(validated);
          break;
        }

        case 'generate_test_scenarios': {
          const validated = GenerateScenariosRequestSchema.parse(args);
          result = await generateTestScenarios(validated);
          break;
        }

        default:
          throw new ValidationError(`Unknown tool: ${toolName}`);
      }

      logger.info('Tool execution successful', { tool: toolName });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      logger.error('Tool execution failed', { tool: toolName, error });

      const errorMessage = error instanceof Error ? error.message : String(error);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: true,
                message: errorMessage,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info('OAuth Simulator MCP Server started');
  }
}

const server = new OAuthSimulatorServer();
server.run().catch((error) => {
  logger.error('Server error', { error });
  process.exit(1);
});
