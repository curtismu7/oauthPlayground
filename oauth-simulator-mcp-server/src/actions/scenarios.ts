import { z } from 'zod';
import { logger } from '../services/logger.js';

export const GenerateScenariosRequestSchema = z.object({
  flowType: z.enum(['authorization_code', 'implicit', 'client_credentials', 'device_code', 'password']),
});

export type GenerateScenariosRequest = z.infer<typeof GenerateScenariosRequestSchema>;

export interface TestStep {
  action: string;
  expectedResult: string;
}

export interface TestScenario {
  name: string;
  description: string;
  input: Record<string, unknown>;
  expectedOutcome: string;
  testSteps: TestStep[];
  rfcReferences: string[];
}

export interface GenerateScenariosResponse {
  scenarios: TestScenario[];
  scenarioCount: number;
  flowType: string;
}

export async function generateTestScenarios(request: GenerateScenariosRequest): Promise<GenerateScenariosResponse> {
  const { flowType } = request;

  logger.info('Generating test scenarios', { flowType });

  const scenariosByFlow: Record<string, TestScenario[]> = {
    authorization_code: [
      {
        name: 'Happy Path - Authorization Code Flow',
        description: 'Complete authorization code flow with PKCE and state validation',
        input: {
          clientId: 'my-client-id',
          redirectUri: 'https://app.example.com/callback',
          scope: 'openid profile email',
          enablePkce: true,
          state: 'random_state_12345',
        },
        expectedOutcome: 'User authenticated, authorization code issued, token exchanged successfully',
        testSteps: [
          { action: 'Generate PKCE pair', expectedResult: 'code_verifier and code_challenge generated' },
          { action: 'Build authorization URL with code_challenge and state', expectedResult: 'URL contains challenge and state' },
          { action: 'User authenticates and consents', expectedResult: 'Redirect with authorization code and state' },
          { action: 'Validate state parameter', expectedResult: 'State matches initial value' },
          { action: 'Exchange code with code_verifier', expectedResult: 'Access token received' },
        ],
        rfcReferences: ['RFC 6749 §4.1', 'RFC 7636', 'OpenID Connect Core 1.0'],
      },
      {
        name: 'State Mismatch Detection',
        description: 'State parameter mismatch should be detected and flow rejected',
        input: {
          clientId: 'my-client-id',
          redirectUri: 'https://app.example.com/callback',
          scope: 'openid',
          state: 'original_state',
          mismatchedState: 'different_state',
        },
        expectedOutcome: 'Flow rejected due to state mismatch (CSRF protection)',
        testSteps: [
          { action: 'Build authorization URL with state', expectedResult: 'state parameter set' },
          { action: 'Receive authorization code with different state', expectedResult: 'State mismatch detected' },
          { action: 'Reject flow without exchanging code', expectedResult: 'User not authenticated' },
        ],
        rfcReferences: ['RFC 6749 §4.1.3.3', 'RFC 6749 §10.12'],
      },
      {
        name: 'PKCE Verifier Mismatch',
        description: 'Token exchange should fail if code_verifier does not match code_challenge',
        input: {
          clientId: 'my-client-id',
          redirectUri: 'https://app.example.com/callback',
          enablePkce: true,
          correctVerifier: 'original_verifier_abcdefghij',
          incorrectVerifier: 'wrong_verifier_xyz123',
        },
        expectedOutcome: 'Token request rejected due to invalid code_verifier',
        testSteps: [
          { action: 'Generate PKCE pair with original verifier', expectedResult: 'Challenge computed from original' },
          { action: 'Exchange code with incorrect verifier', expectedResult: 'Token server rejects request' },
          { action: 'Verify error response', expectedResult: 'error: invalid_grant' },
        ],
        rfcReferences: ['RFC 7636 §4.5'],
      },
    ],
    implicit: [
      {
        name: 'Implicit Flow Token Response',
        description: 'Tokens returned in URL fragment (client-side only)',
        input: {
          clientId: 'my-client-id',
          redirectUri: 'https://app.example.com/callback',
          responseType: 'token id_token',
          nonce: 'random_nonce_12345',
        },
        expectedOutcome: 'Tokens present in URL fragment, nonce validated',
        testSteps: [
          { action: 'Build authorization URL with nonce', expectedResult: 'nonce parameter included' },
          { action: 'User authenticates and consents', expectedResult: 'Redirect with fragment #access_token=...' },
          { action: 'Extract tokens from fragment', expectedResult: 'Tokens available in browser memory' },
          { action: 'Validate ID token nonce claim', expectedResult: 'Nonce matches original value' },
        ],
        rfcReferences: ['RFC 6749 §4.2', 'OpenID Connect Core 1.0 §3.2.2'],
      },
      {
        name: 'Security Warning - Implicit Flow Limitations',
        description: 'Tokens exposed in browser history, URL, and potentially logs',
        input: {
          clientId: 'legacy-client',
          flowType: 'implicit',
        },
        expectedOutcome: 'Recognition of security implications and recommendation to migrate',
        testSteps: [
          { action: 'Review implicit flow tokens in browser history', expectedResult: 'Token visible in URL' },
          { action: 'Check browser local storage/sessionStorage', expectedResult: 'Tokens in accessible JavaScript' },
          { action: 'Recommend Authorization Code + PKCE', expectedResult: 'Migration path identified' },
        ],
        rfcReferences: ['OAuth 2.0 Security Best Practices', 'RFC 6749 §10'],
      },
    ],
    client_credentials: [
      {
        name: 'Happy Path - Client Credentials Flow',
        description: 'Backend-to-backend authentication without user involvement',
        input: {
          clientId: 'backend-service-client',
          clientSecret: 'secret_key_value',
          scope: 'api:read api:write',
        },
        expectedOutcome: 'Access token issued directly for backend API calls',
        testSteps: [
          { action: 'POST /token with client credentials', expectedResult: 'Token endpoint receives request' },
          { action: 'Validate client credentials', expectedResult: 'Client authenticated' },
          { action: 'Issue access token', expectedResult: 'Token returned in response' },
          { action: 'Use token to call protected API', expectedResult: 'API request succeeds' },
        ],
        rfcReferences: ['RFC 6749 §4.4', 'RFC 6750'],
      },
      {
        name: 'Client Secret Management',
        description: 'Client secret must be securely stored and transmitted',
        input: {
          clientId: 'secure-backend-client',
          scenario: 'secret_exposure_prevention',
        },
        expectedOutcome: 'Confirmation of secure secret handling practices',
        testSteps: [
          { action: 'Store secret in secure vault/environment', expectedResult: 'Secret not in code or logs' },
          { action: 'Transmit over HTTPS POST body', expectedResult: 'Secret encrypted in transit' },
          { action: 'Validate secret rotation practices', expectedResult: 'Regular rotation enabled' },
        ],
        rfcReferences: ['RFC 6749 §2.3', 'RFC 6749 §10.2'],
      },
    ],
    device_code: [
      {
        name: 'Happy Path - Device Code Flow',
        description: 'Authentication for TV/IoT devices with user code entry on secondary device',
        input: {
          clientId: 'smart-tv-client',
          scope: 'video watch_history',
        },
        expectedOutcome: 'Device authenticated after user approves on secondary device',
        testSteps: [
          { action: 'Device requests device code', expectedResult: 'Receives device_code and user_code (ABC123)' },
          { action: 'Device displays user code', expectedResult: 'User sees ABC123 on screen' },
          { action: 'User visits verification URI on phone', expectedResult: 'Verification page loaded' },
          { action: 'User enters code ABC123 and approves', expectedResult: 'Authorization granted' },
          { action: 'Device polls with device_code', expectedResult: 'Receives access_token' },
        ],
        rfcReferences: ['RFC 8628', 'RFC 8628 §3.1-3.5'],
      },
      {
        name: 'Polling Interval Compliance',
        description: 'Device must respect polling interval to avoid rate limiting',
        input: {
          clientId: 'iot-device-client',
          pollingInterval: 5,
          maxAttempts: 360,
        },
        expectedOutcome: 'Successful token acquisition while respecting intervals',
        testSteps: [
          { action: 'Start polling at device code endpoint', expectedResult: 'Initial authorization_pending error' },
          { action: 'Wait for specified interval', expectedResult: 'Interval timer respected' },
          { action: 'Retry after interval', expectedResult: 'No rate limit errors' },
          { action: 'Continue polling until approval or expiry', expectedResult: 'Eventual success or timeout' },
        ],
        rfcReferences: ['RFC 8628 §3.4', 'RFC 8628 §3.5'],
      },
    ],
    password: [
      {
        name: 'Resource Owner Password Credentials Flow',
        description: 'Direct username/password exchange (NOT RECOMMENDED)',
        input: {
          clientId: 'legacy-first-party-app',
          username: 'user@example.com',
          password: 'user_password',
          scope: 'api',
        },
        expectedOutcome: 'Access token issued directly without authorization server UI',
        testSteps: [
          { action: 'Collect username and password from user', expectedResult: 'Credentials captured' },
          { action: 'POST /token with credentials', expectedResult: 'Token endpoint receives request' },
          { action: 'Validate username and password', expectedResult: 'User authenticated' },
          { action: 'Issue access token', expectedResult: 'Token returned directly' },
        ],
        rfcReferences: ['RFC 6749 §4.3', 'OAuth 2.0 Security Best Practices'],
      },
      {
        name: 'Migration from Password Flow',
        description: 'Strategy for migrating to Authorization Code flow',
        input: {
          clientId: 'app-being-modernized',
          currentFlow: 'password',
          targetFlow: 'authorization_code',
        },
        expectedOutcome: 'Migration plan to eliminate password grant',
        testSteps: [
          { action: 'Evaluate current password flow usage', expectedResult: 'Identify all clients' },
          { action: 'Implement authorization_code + PKCE flow', expectedResult: 'New flow available' },
          { action: 'Update applications to use new flow', expectedResult: 'No password collection' },
          { action: 'Deprecate password flow', expectedResult: 'Legacy flow disabled' },
        ],
        rfcReferences: ['OAuth 2.0 Security Best Practices', 'RFC 6749 §4.3.2'],
      },
    ],
  };

  const scenarios = scenariosByFlow[flowType] || [];

  logger.debug('Test scenarios generated', { flowType, scenarioCount: scenarios.length });

  return {
    scenarios,
    scenarioCount: scenarios.length,
    flowType,
  };
}
