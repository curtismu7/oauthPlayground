import { z } from 'zod';
import { logger } from '../services/logger.js';

export const ValidateTokenResponseRequestSchema = z.object({
  response: z.record(z.unknown()),
});

export type ValidateTokenResponseRequest = z.infer<typeof ValidateTokenResponseRequestSchema>;

export interface TokenIssue {
  severity: 'error' | 'warning';
  field: string;
  message: string;
}

export interface ValidateTokenResponseResponse {
  valid: boolean;
  issues: TokenIssue[];
  description?: string;
}

export async function validateTokenResponse(request: ValidateTokenResponseRequest): Promise<ValidateTokenResponseResponse> {
  const { response } = request;

  logger.info('Validating token response');

  const issues: TokenIssue[] = [];

  if (!response.access_token) {
    issues.push({
      severity: 'error',
      field: 'access_token',
      message: 'access_token is required in token response',
    });
  }

  if (!response.token_type) {
    issues.push({
      severity: 'error',
      field: 'token_type',
      message: 'token_type is required in token response',
    });
  } else if (response.token_type !== 'Bearer') {
    issues.push({
      severity: 'warning',
      field: 'token_type',
      message: `token_type should be "Bearer", got "${response.token_type}"`,
    });
  }

  if (response.expires_in !== undefined) {
    if (typeof response.expires_in !== 'number' && typeof response.expires_in !== 'string') {
      issues.push({
        severity: 'error',
        field: 'expires_in',
        message: 'expires_in should be a number',
      });
    }
  } else {
    issues.push({
      severity: 'warning',
      field: 'expires_in',
      message: 'expires_in not provided; token expiration unknown',
    });
  }

  if (response.scope && typeof response.scope !== 'string') {
    issues.push({
      severity: 'warning',
      field: 'scope',
      message: 'scope should be a space-separated string of granted scopes',
    });
  }

  if (response.id_token && typeof response.id_token !== 'string') {
    issues.push({
      severity: 'error',
      field: 'id_token',
      message: 'id_token should be a JWT string',
    });
  }

  const valid = !issues.some((issue) => issue.severity === 'error');

  logger.debug('Token validation complete', { valid, issueCount: issues.length });

  return {
    valid,
    issues,
    description: valid ? 'Token response is valid' : 'Token response has errors',
  };
}

export const CheckFlowConfigRequestSchema = z.object({
  flowType: z.enum(['authorization_code', 'implicit', 'client_credentials', 'device_code', 'password']),
  config: z.record(z.unknown()),
});

export type CheckFlowConfigRequest = z.infer<typeof CheckFlowConfigRequestSchema>;

export interface ConfigError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface CheckFlowConfigResponse {
  valid: boolean;
  errors: ConfigError[];
  warnings: ConfigError[];
  recommendation: string;
}

export async function checkFlowConfig(request: CheckFlowConfigRequest): Promise<CheckFlowConfigResponse> {
  const { flowType, config } = request;

  logger.info('Checking flow configuration', { flowType });

  const errors: ConfigError[] = [];
  const warnings: ConfigError[] = [];

  if (!config.clientId) {
    errors.push({
      field: 'clientId',
      message: 'clientId is required for all flows',
      severity: 'error',
    });
  }

  const flowsRequiringRedirectUri = ['authorization_code', 'implicit'];
  if (flowsRequiringRedirectUri.includes(flowType) && !config.redirectUri) {
    errors.push({
      field: 'redirectUri',
      message: `redirectUri is required for ${flowType} flow`,
      severity: 'error',
    });
  }

  if (flowType === 'implicit') {
    warnings.push({
      field: 'flowType',
      message: 'Implicit flow is NOT RECOMMENDED. Use Authorization Code flow with PKCE instead.',
      severity: 'warning',
    });
  }

  if (flowType === 'password') {
    warnings.push({
      field: 'flowType',
      message: 'Resource Owner Password Credentials grant is NOT RECOMMENDED. Use Authorization Code flow instead.',
      severity: 'warning',
    });
  }

  if (config.enablePkce && !['authorization_code'].includes(flowType)) {
    warnings.push({
      field: 'enablePkce',
      message: `PKCE is only recommended for ${flowType}; it is primarily for Authorization Code flow.`,
      severity: 'warning',
    });
  }

  const valid = errors.length === 0;

  const recommendations: Record<string, string> = {
    authorization_code: 'Authorization Code flow with PKCE is the recommended flow for most applications.',
    implicit: 'Switch to Authorization Code flow with PKCE. Implicit flow has security limitations.',
    client_credentials: 'Suitable for backend-to-backend authentication. Ensure client_secret is securely stored.',
    device_code: 'Suitable for devices without a browser. User completes authentication on a secondary device.',
    password: 'Only use for highly trusted first-party applications. Consider Authorization Code flow instead.',
  };

  logger.debug('Flow configuration check complete', { valid, errorCount: errors.length, warningCount: warnings.length });

  return {
    valid,
    errors,
    warnings,
    recommendation: recommendations[flowType] || 'Verify your configuration matches the OAuth 2.0 specification.',
  };
}
