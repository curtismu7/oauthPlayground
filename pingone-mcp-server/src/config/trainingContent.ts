export interface TrainingResource {
  name: string;
  uri: string;
  title: string;
  summary: string;
  body: string;
}

export interface TrainingPrompt {
  name: string;
  description: string;
  args: {
    name: string;
    schema: {
      description: string;
      examples: string[];
    };
    zod: 'string';
    optional?: boolean;
  }[];
  template: (args: Record<string, string>) => string[];
}

export interface PracticeTool {
  name: string;
  description: string;
  scenario: string;
  guidance: string[];
}

export const trainingResources: TrainingResource[] = [
  {
    name: 'pingone-training.overview',
    uri: 'mcp://training/pingone/overview',
    title: 'PingOne MCP Server Overview',
    summary: 'High-level walkthrough of the dual educational and operational PingOne MCP server.',
    body: `# PingOne MCP Server Overview

Welcome to the PingOne MCP server. This project is designed with two parallel goals:

1. **Educational Mode** – teach developers how the PingOne APIs work, how OAuth and OIDC flows come together, and how to translate the concepts into Model Context Protocol tools.
2. **Operational Mode** – expose real tools that call PingOne APIs for authentication, worker tokens, application discovery, MFA, and redirectless flows.

The server lives entirely in the \`pingone-mcp-server\` folder so it never interferes with the OAuth playground UI. You can explore the educational resources, run practice tools, and when ready, execute the production tools using your PingOne sandbox credentials.
`
  },
  {
    name: 'pingone-training.auth-flow',
    uri: 'mcp://training/pingone/auth-flow',
    title: 'Authorization & Token Exchange',
    summary: 'Explains PingOne authentication, token exchange, and how the MCP login tool wraps these APIs.',
    body: `# PingOne Authorization & Token Exchange

PingOne supports multiple OAuth 2.0 grant types. For developer training we focus on:

- Authorization Code + PKCE (interactive user login)
- Resource Owner Password (teachable example – not for production)
- Client Credentials (worker tokens for administrative APIs)

The MCP server exposes tools such as \`pingone.auth.login\` and \`pingone.auth.refresh\`. The educational flow walks you through creating requests, understanding the response payloads, and mapping them onto MCP tool results.
`
  },
  {
    name: 'pingone-training.worker-token',
    uri: 'mcp://training/pingone/worker-token',
    title: 'Worker Token & Application Discovery',
    summary: 'Shows how client credentials map to worker tokens and application listing APIs.',
    body: `# Worker Token & Application Discovery

Worker tokens use the **client credentials** grant type. In PingOne, this is the basis for automating administrative operations such as listing applications or rotating credentials.

The MCP server includes:

- \`pingone.workerToken.issue\` – exchanges client credentials for a worker token.
- \`pingone.applications.list\` – fetches PingOne applications using either a worker token or client credentials.

Practice tools mirror these operations so you can experiment without real secrets.
`
  },
  {
    name: 'pingone-training.mfa-redirectless',
    uri: 'mcp://training/pingone/mfa-redirectless',
    title: 'MFA & Redirectless Login',
    summary: 'Guides learners through MFA challenge handling and redirectless authorization flows.',
    body: `# MFA & Redirectless Login

PingOne supports redirectless authorization, allowing browserless devices to obtain tokens. The flow relies on:

1. Initiating an authorization request (PAR optional).
2. Polling for login completion.
3. Handling MFA challenges when the user approves them on another device.

The MCP tools expose helper endpoints so you can orchestrate the entire flow from scripts or agents.
`
  }
];

export const trainingPrompts: TrainingPrompt[] = [
  {
    name: 'pingone.training.lesson',
    description: 'Generate a guided explanation for a specific PingOne concept.',
    args: [
      {
        name: 'topic',
        schema: {
          description: 'Training topic (e.g., auth, worker-token, mfa, redirectless).',
          examples: ['auth', 'worker-token', 'mfa', 'redirectless']
        },
        zod: 'string'
      }
    ],
    template: (args) => [
      '# PingOne Training Lesson',
      `**Topic:** ${args.topic}`,
      '## Learning Objectives',
      '- Understand the sequence of API calls.',
      '- Review payload fields and typical errors.',
      '- Identify which MCP tools implement the concept.',
      '## Suggested Next Steps',
      '- Read the matching training resource (see resources list).',
      '- Run the practice tool to simulate a call.',
      '- Try the production tool with real credentials (optional).'
    ]
  }
];

export const practiceTools: PracticeTool[] = [
  {
    name: 'pingone.training.practice-auth',
    description: 'Simulate a PingOne authentication call and inspect the typical response payload.',
    scenario: 'Simulates a user logging in with username/password + PKCE.',
    guidance: [
      'Practice Mode: No real API calls are made.',
      'Review the response shape to understand what the real \`pingone.auth.login\` tool returns.',
      'Move to the production tool when you are ready to test with real credentials.'
    ]
  },
  {
    name: 'pingone.training.practice-worker-token',
    description: 'Walk through the worker token request steps with canned data.',
    scenario: 'Demonstrates client credentials exchange for a worker token.',
    guidance: [
      'Practice Mode: Uses placeholder client ID/secret.',
      'Observe the token metadata that comes back (scopes, expires_in).',
      'Switch to \`pingone.workerToken.issue\` with sandbox credentials when comfortable.'
    ]
  }
];
