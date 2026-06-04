/**
 * Security Compliance Checker MCP Server
 * Registers 6 tools for OAuth 2.0 and OIDC compliance validation
 */

import 'dotenv/config';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, Tool } from '@modelcontextprotocol/sdk/types.js';
import { checkOAuthConfig } from './actions/oauthRfc.js';
import { checkPKCECompliance } from './actions/pkceCheck.js';
import { checkOIDCDiscovery } from './actions/oidcDiscovery.js';
import { checkRedirectUri } from './actions/redirectUri.js';
import { checkTokenSecurity } from './actions/tokenSecurity.js';
import { generateComplianceReport } from './actions/reporter.js';
import { logger } from './services/logger.js';
import { handleError } from './services/mcpErrors.js';

const server = new Server(
  {
    name: 'security-compliance-mcp-server',
    version: '1.0.0',
  },
  {
    // tools capability must be declared before registering tools/list +
    // tools/call handlers, or the SDK throws on startup.
    capabilities: { tools: {} },
  },
);

// Define all 6 tools
const tools: Tool[] = [
  {
    name: 'check_oauth_config',
    description: 'Validate OAuth 2.0 configuration against RFC compliance rules',
    inputSchema: {
      type: 'object',
      properties: {
        grantTypes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Supported grant types (e.g., authorization_code, implicit, client_credentials)',
        },
        redirectUris: {
          type: 'array',
          items: { type: 'string' },
          description: 'Registered redirect URIs',
        },
        clientType: {
          type: 'string',
          enum: ['confidential', 'public', 'native', 'spa'],
          description: 'Client type classification',
        },
        pkceEnabled: {
          type: 'boolean',
          description: 'Whether PKCE is enabled',
        },
        tokenLifetimeSeconds: {
          type: 'number',
          description: 'Access token lifetime in seconds',
        },
        responseTypes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Supported response types',
        },
      },
    },
  },
  {
    name: 'check_pkce_compliance',
    description: 'Validate PKCE (RFC 7636) implementation',
    inputSchema: {
      type: 'object',
      properties: {
        codeVerifier: {
          type: 'string',
          description: 'Code verifier string (43-128 characters)',
        },
        codeChallenge: {
          type: 'string',
          description: 'Code challenge string (base64url encoded)',
        },
        codeChallengeMethod: {
          type: 'string',
          enum: ['plain', 'S256'],
          description: 'Code challenge method',
        },
      },
    },
  },
  {
    name: 'check_oidc_discovery',
    description: 'Validate OIDC discovery endpoint and configuration',
    inputSchema: {
      type: 'object',
      required: ['issuerUrl'],
      properties: {
        issuerUrl: {
          type: 'string',
          description: 'OIDC issuer URL',
        },
      },
    },
  },
  {
    name: 'check_redirect_uri',
    description: 'Validate redirect URIs for specific client types',
    inputSchema: {
      type: 'object',
      required: ['redirectUris', 'clientType'],
      properties: {
        redirectUris: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of redirect URIs to validate',
        },
        clientType: {
          type: 'string',
          enum: ['native', 'web', 'spa'],
          description: 'Client type (native, web, or spa)',
        },
      },
    },
  },
  {
    name: 'check_token_security',
    description: 'Analyze token payload for security claims and risk level',
    inputSchema: {
      type: 'object',
      required: ['payload'],
      properties: {
        payload: {
          type: 'object',
          description: 'JWT payload claims object',
          additionalProperties: true,
        },
      },
    },
  },
  {
    name: 'generate_compliance_report',
    description: 'Generate comprehensive OAuth 2.0 and OIDC compliance report with grade',
    inputSchema: {
      type: 'object',
      properties: {
        grantTypes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Supported grant types',
        },
        redirectUris: {
          type: 'array',
          items: { type: 'string' },
          description: 'Registered redirect URIs',
        },
        clientType: {
          type: 'string',
          enum: ['confidential', 'public', 'native', 'spa'],
          description: 'Client type',
        },
        pkceEnabled: {
          type: 'boolean',
          description: 'PKCE enabled status',
        },
        issuerUrl: {
          type: 'string',
          description: 'OIDC issuer URL',
        },
        tokenPayload: {
          type: 'object',
          description: 'Token payload for security analysis',
          additionalProperties: true,
        },
      },
    },
  },
];

// Register list tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  logger.debug('Listing available tools');
  return { tools };
});

// Register call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  logger.info(`Executing tool: ${name}`, { args });

  try {
    let result;

    switch (name) {
      case 'check_oauth_config':
        result = await checkOAuthConfig(args as Parameters<typeof checkOAuthConfig>[0]);
        break;

      case 'check_pkce_compliance':
        result = await checkPKCECompliance(args as Parameters<typeof checkPKCECompliance>[0]);
        break;

      case 'check_oidc_discovery':
        result = await checkOIDCDiscovery(args as Parameters<typeof checkOIDCDiscovery>[0]);
        break;

      case 'check_redirect_uri':
        result = await checkRedirectUri(args as Parameters<typeof checkRedirectUri>[0]);
        break;

      case 'check_token_security':
        result = await checkTokenSecurity(args as Parameters<typeof checkTokenSecurity>[0]);
        break;

      case 'generate_compliance_report':
        result = await generateComplianceReport(args as Parameters<typeof generateComplianceReport>[0]);
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    logger.info(`Tool ${name} completed successfully`);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    logger.error(`Tool ${name} failed`, { error: String(error) });
    const errorResponse = handleError(error);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(errorResponse, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('Security Compliance Checker MCP Server started');
}

main().catch((error) => {
  logger.error('Server startup failed', { error: String(error) });
  process.exit(1);
});
