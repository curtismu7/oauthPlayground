import { logger } from './logger.js';
import { FlowError } from './mcpErrors.js';

export type FlowType = 'authorization_code' | 'implicit' | 'client_credentials' | 'device_code' | 'password';

export interface FlowStep {
  stepNumber: number;
  title: string;
  description: string;
  method: string;
  endpoint?: string;
  parameters: Record<string, string>;
  expectedResponse?: Record<string, string>;
  notes?: string[];
  rfcSection?: string;
}

export interface FlowConfig {
  clientId: string;
  redirectUri?: string;
  scope?: string;
  enablePkce?: boolean;
  issuerUrl?: string;
  username?: string;
  deviceId?: string;
}

/**
 * Generate stateless mock steps for OAuth 2.0 flows
 */
export class FlowEngine {
  static generateAuthorizationCodeFlow(config: FlowConfig): FlowStep[] {
    if (!config.clientId) {
      throw new FlowError('clientId is required');
    }
    if (!config.redirectUri) {
      throw new FlowError('redirectUri is required for authorization_code flow');
    }

    const steps: FlowStep[] = [
      {
        stepNumber: 1,
        title: 'User Initiates Login',
        description: 'User clicks login on application',
        method: 'USER_ACTION',
        parameters: {
          action: 'click_login',
        },
        rfcSection: 'RFC 6749 §1.3.1',
      },
      {
        stepNumber: 2,
        title: 'Application Redirects to Authorization Endpoint',
        description: 'Application redirects user to OAuth provider authorization endpoint',
        method: 'GET',
        endpoint: '/authorize',
        parameters: {
          response_type: 'code',
          client_id: config.clientId,
          redirect_uri: config.redirectUri,
          scope: config.scope || 'openid profile email',
          state: 'random_state_value',
          ...(config.enablePkce && {
            code_challenge: 'computed_challenge_value',
            code_challenge_method: 'S256',
          }),
        },
        rfcSection: 'RFC 6749 §4.1.1, RFC 7636 §4.1',
      },
      {
        stepNumber: 3,
        title: 'User Authenticates',
        description: 'User enters credentials and authenticates with the authorization server',
        method: 'USER_ACTION',
        parameters: {
          action: 'provide_credentials',
          username: 'user@example.com',
        },
        rfcSection: 'RFC 6749 §4.1.2',
      },
      {
        stepNumber: 4,
        title: 'User Grants Consent',
        description: 'User reviews and grants consent to requested scopes',
        method: 'USER_ACTION',
        parameters: {
          action: 'grant_consent',
          scopes: config.scope || 'openid profile email',
        },
        rfcSection: 'RFC 6749 §4.1.2',
      },
      {
        stepNumber: 5,
        title: 'Authorization Code Issued',
        description: 'Authorization server issues authorization code',
        method: 'RESPONSE',
        parameters: {
          response_format: 'redirect',
          location: `${config.redirectUri}?code=auth_code_value&state=random_state_value`,
        },
        expectedResponse: {
          code: 'auth_code_value',
          state: 'random_state_value',
        },
        rfcSection: 'RFC 6749 §4.1.2',
      },
      {
        stepNumber: 6,
        title: 'Application Exchanges Code for Token',
        description: 'Application backend exchanges authorization code for access token',
        method: 'POST',
        endpoint: '/token',
        parameters: {
          grant_type: 'authorization_code',
          code: 'auth_code_value',
          client_id: config.clientId,
          client_secret: 'client_secret_value',
          redirect_uri: config.redirectUri,
          ...(config.enablePkce && {
            code_verifier: 'original_verifier_value',
          }),
        },
        expectedResponse: {
          access_token: 'access_token_value',
          token_type: 'Bearer',
          expires_in: '3600',
          ...(config.scope?.includes('openid') && {
            id_token: 'id_token_jwt_value',
          }),
        },
        rfcSection: 'RFC 6749 §4.1.3, RFC 7636 §4.5',
      },
      {
        stepNumber: 7,
        title: 'Token Response Validated',
        description: 'Application validates token response and state parameter',
        method: 'VALIDATION',
        parameters: {
          validate_state: 'true',
          validate_signature: config.scope?.includes('openid') ? 'true' : 'false',
        },
        rfcSection: 'RFC 6749 §4.1.3, OpenID Connect Core 1.0',
      },
      {
        stepNumber: 8,
        title: 'User Logged In',
        description: 'User is authenticated and logged in to the application',
        method: 'COMPLETION',
        parameters: {
          status: 'authenticated',
          session_created: 'true',
        },
        rfcSection: 'RFC 6749 §1.3.1',
      },
    ];

    logger.debug('Generated authorization_code flow', { stepCount: steps.length });
    return steps;
  }

  static generateImplicitFlow(config: FlowConfig): FlowStep[] {
    if (!config.clientId || !config.redirectUri) {
      throw new FlowError('clientId and redirectUri are required for implicit flow');
    }

    const steps: FlowStep[] = [
      {
        stepNumber: 1,
        title: 'User Initiates Login',
        description: 'User clicks login on application',
        method: 'USER_ACTION',
        parameters: {
          action: 'click_login',
        },
        rfcSection: 'RFC 6749 §1.3.2',
      },
      {
        stepNumber: 2,
        title: 'Application Redirects to Authorization Endpoint',
        description: 'Application redirects user to OAuth provider authorization endpoint',
        method: 'GET',
        endpoint: '/authorize',
        parameters: {
          response_type: 'token id_token',
          client_id: config.clientId,
          redirect_uri: config.redirectUri,
          scope: config.scope || 'openid profile email',
          nonce: 'random_nonce_value',
        },
        notes: [
          'Implicit flow is NOT RECOMMENDED for new applications',
          'Consider using authorization_code + PKCE instead',
          'Tokens are returned in URL fragment (client-side only)',
        ],
        rfcSection: 'RFC 6749 §4.2, OAuth 2.0 Security Best Practices',
      },
      {
        stepNumber: 3,
        title: 'User Authenticates and Consents',
        description: 'User authenticates and grants consent directly at authorization endpoint',
        method: 'USER_ACTION',
        parameters: {
          action: 'authenticate_and_consent',
        },
        rfcSection: 'RFC 6749 §4.2.1',
      },
      {
        stepNumber: 4,
        title: 'Tokens Issued in Fragment',
        description: 'Authorization server issues tokens and redirects with fragment',
        method: 'RESPONSE',
        parameters: {
          response_format: 'fragment',
          location: `${config.redirectUri}#access_token=access_token_value&token_type=Bearer&expires_in=3600&id_token=id_token_jwt_value&state=random_state_value`,
        },
        expectedResponse: {
          access_token: 'access_token_value',
          token_type: 'Bearer',
          expires_in: '3600',
          id_token: 'id_token_jwt_value',
        },
        rfcSection: 'RFC 6749 §4.2.2',
      },
      {
        stepNumber: 5,
        title: 'Tokens Validated by Client JavaScript',
        description: 'Client-side JavaScript extracts and validates tokens from fragment',
        method: 'VALIDATION',
        parameters: {
          validate_nonce: 'true',
          validate_signature: 'true',
        },
        rfcSection: 'OpenID Connect Core 1.0',
      },
      {
        stepNumber: 6,
        title: 'User Logged In',
        description: 'User is authenticated with tokens stored in browser memory',
        method: 'COMPLETION',
        parameters: {
          status: 'authenticated',
          token_location: 'browser_memory',
        },
        rfcSection: 'RFC 6749 §1.3.2',
      },
    ];

    logger.debug('Generated implicit flow', { stepCount: steps.length });
    return steps;
  }

  static generateClientCredentialsFlow(config: FlowConfig): FlowStep[] {
    if (!config.clientId) {
      throw new FlowError('clientId is required');
    }

    const steps: FlowStep[] = [
      {
        stepNumber: 1,
        title: 'Application Prepares Credentials',
        description: 'Backend application prepares client ID and secret',
        method: 'APPLICATION_ACTION',
        parameters: {
          client_id: config.clientId,
          client_secret: 'client_secret_value',
        },
        rfcSection: 'RFC 6749 §4.4',
      },
      {
        stepNumber: 2,
        title: 'Token Request',
        description: 'Application directly requests access token from token endpoint',
        method: 'POST',
        endpoint: '/token',
        parameters: {
          grant_type: 'client_credentials',
          client_id: config.clientId,
          client_secret: 'client_secret_value',
          scope: config.scope || 'api',
        },
        rfcSection: 'RFC 6749 §4.4.2',
      },
      {
        stepNumber: 3,
        title: 'Token Issued',
        description: 'Authorization server issues access token for application',
        method: 'RESPONSE',
        parameters: {
          access_token: 'access_token_value',
          token_type: 'Bearer',
          expires_in: '3600',
        },
        expectedResponse: {
          access_token: 'access_token_value',
          token_type: 'Bearer',
          expires_in: '3600',
        },
        rfcSection: 'RFC 6749 §4.4.3',
      },
      {
        stepNumber: 4,
        title: 'Application Accesses Protected Resource',
        description: 'Application uses access token to call protected API',
        method: 'GET',
        endpoint: '/api/resource',
        parameters: {
          authorization: 'Bearer access_token_value',
        },
        rfcSection: 'RFC 6750 §2.1',
      },
      {
        stepNumber: 5,
        title: 'Protected Resource Accessed',
        description: 'Resource server validates token and returns requested resource',
        method: 'COMPLETION',
        parameters: {
          status: 'authorized',
          resource_access: 'granted',
        },
        rfcSection: 'RFC 6749 §6',
      },
    ];

    logger.debug('Generated client_credentials flow', { stepCount: steps.length });
    return steps;
  }

  static generateDeviceCodeFlow(config: FlowConfig): FlowStep[] {
    if (!config.clientId) {
      throw new FlowError('clientId is required');
    }

    const steps: FlowStep[] = [
      {
        stepNumber: 1,
        title: 'Device Requests Device Code',
        description: 'Device (TV, IoT device) requests device code from authorization server',
        method: 'POST',
        endpoint: '/device_authorization',
        parameters: {
          client_id: config.clientId,
          scope: config.scope || 'openid profile',
        },
        rfcSection: 'RFC 8628 §3.1',
      },
      {
        stepNumber: 2,
        title: 'Device Code Issued',
        description: 'Authorization server issues device code and user code',
        method: 'RESPONSE',
        parameters: {
          device_code: 'device_code_value',
          user_code: 'ABC123',
          verification_uri: 'https://example.com/device',
          verification_uri_complete: 'https://example.com/device?user_code=ABC123',
          expires_in: '1800',
          interval: '5',
        },
        expectedResponse: {
          device_code: 'device_code_value',
          user_code: 'ABC123',
        },
        rfcSection: 'RFC 8628 §3.2',
      },
      {
        stepNumber: 3,
        title: 'Device Displays User Code',
        description: 'Device displays user code for user to enter on another device',
        method: 'DISPLAY',
        parameters: {
          user_code: 'ABC123',
          message: 'Visit https://example.com/device and enter code ABC123',
        },
        rfcSection: 'RFC 8628 §3.2',
      },
      {
        stepNumber: 4,
        title: 'User Opens Verification URI',
        description: 'User opens verification URI on another device (phone, computer)',
        method: 'USER_ACTION',
        parameters: {
          action: 'visit_verification_uri',
        },
        rfcSection: 'RFC 8628 §3.3',
      },
      {
        stepNumber: 5,
        title: 'User Enters Code and Authenticates',
        description: 'User enters user code and authenticates with credentials',
        method: 'USER_ACTION',
        parameters: {
          user_code: 'ABC123',
          username: 'user@example.com',
        },
        rfcSection: 'RFC 8628 §3.3',
      },
      {
        stepNumber: 6,
        title: 'User Grants Consent',
        description: 'User reviews and grants consent to requested scopes',
        method: 'USER_ACTION',
        parameters: {
          action: 'grant_consent',
        },
        rfcSection: 'RFC 8628 §3.3',
      },
      {
        stepNumber: 7,
        title: 'Device Polls for Token',
        description: 'Device polls token endpoint with device code',
        method: 'POST',
        endpoint: '/token',
        parameters: {
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
          device_code: 'device_code_value',
          client_id: config.clientId,
        },
        notes: [
          'Device must wait for interval specified in device_code response',
          'Authorization server responds with error_code: authorization_pending until user approves',
        ],
        rfcSection: 'RFC 8628 §3.4',
      },
      {
        stepNumber: 8,
        title: 'Token Issued to Device',
        description: 'Authorization server issues access token to device',
        method: 'RESPONSE',
        parameters: {
          access_token: 'access_token_value',
          token_type: 'Bearer',
          expires_in: '3600',
        },
        expectedResponse: {
          access_token: 'access_token_value',
          token_type: 'Bearer',
        },
        rfcSection: 'RFC 8628 §3.5',
      },
      {
        stepNumber: 9,
        title: 'Device Now Authenticated',
        description: 'Device uses token to access protected resources',
        method: 'COMPLETION',
        parameters: {
          status: 'authenticated',
          can_access_resources: 'true',
        },
        rfcSection: 'RFC 8628 §3',
      },
    ];

    logger.debug('Generated device_code flow', { stepCount: steps.length });
    return steps;
  }

  static generatePasswordFlow(config: FlowConfig): FlowStep[] {
    if (!config.clientId) {
      throw new FlowError('clientId is required');
    }

    const steps: FlowStep[] = [
      {
        stepNumber: 1,
        title: 'User Provides Credentials',
        description: 'User enters username and password in application',
        method: 'USER_ACTION',
        parameters: {
          username: config.username || 'user@example.com',
          password: 'user_password',
        },
        notes: [
          'Resource Owner Password Credentials grant is NOT RECOMMENDED',
          'Only use with highly trusted applications (first-party clients)',
          'Use authorization_code flow instead for general use cases',
        ],
        rfcSection: 'RFC 6749 §4.3, OAuth 2.0 Security Best Practices',
      },
      {
        stepNumber: 2,
        title: 'Application Requests Token',
        description: 'Application sends username and password to token endpoint',
        method: 'POST',
        endpoint: '/token',
        parameters: {
          grant_type: 'password',
          username: config.username || 'user@example.com',
          password: 'user_password',
          client_id: config.clientId,
          client_secret: 'client_secret_value',
          scope: config.scope || 'api',
        },
        rfcSection: 'RFC 6749 §4.3.2',
      },
      {
        stepNumber: 3,
        title: 'Credentials Validated',
        description: 'Authorization server validates username and password',
        method: 'VALIDATION',
        parameters: {
          validation_type: 'credentials_check',
        },
        rfcSection: 'RFC 6749 §4.3.2',
      },
      {
        stepNumber: 4,
        title: 'Access Token Issued',
        description: 'Authorization server issues access token directly',
        method: 'RESPONSE',
        parameters: {
          access_token: 'access_token_value',
          token_type: 'Bearer',
          expires_in: '3600',
        },
        expectedResponse: {
          access_token: 'access_token_value',
          token_type: 'Bearer',
          expires_in: '3600',
        },
        rfcSection: 'RFC 6749 §4.3.3',
      },
      {
        stepNumber: 5,
        title: 'User Authenticated',
        description: 'User is authenticated and can access protected resources',
        method: 'COMPLETION',
        parameters: {
          status: 'authenticated',
          resource_access: 'available',
        },
        rfcSection: 'RFC 6749 §6',
      },
    ];

    logger.debug('Generated password flow', { stepCount: steps.length });
    return steps;
  }

  static generateFlow(flowType: FlowType, config: FlowConfig): FlowStep[] {
    switch (flowType) {
      case 'authorization_code':
        return this.generateAuthorizationCodeFlow(config);
      case 'implicit':
        return this.generateImplicitFlow(config);
      case 'client_credentials':
        return this.generateClientCredentialsFlow(config);
      case 'device_code':
        return this.generateDeviceCodeFlow(config);
      case 'password':
        return this.generatePasswordFlow(config);
      default:
        throw new FlowError(`Unknown flow type: ${flowType}`);
    }
  }
}
