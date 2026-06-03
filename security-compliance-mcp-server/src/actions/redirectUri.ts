/**
 * Redirect URI compliance checking
 */

import { z } from 'zod';
import { complianceRules } from '../services/complianceRules.js';
import { logger } from '../services/logger.js';

const RedirectURICheckSchema = z.object({
  redirectUris: z.array(z.string()),
  clientType: z.enum(['native', 'web', 'spa']),
});

type RedirectURICheckInput = z.infer<typeof RedirectURICheckSchema>;

export interface URICheckResult {
  uri: string;
  isValid: boolean;
  issues: Array<{
    ruleId: string;
    severity: string;
    description: string;
  }>;
}

export interface RedirectURICheckResult {
  checks: Array<{
    passed: boolean;
    ruleId: string;
    severity: string;
    description: string;
  }>;
  perUriResults: URICheckResult[];
}

export async function checkRedirectUri(input: RedirectURICheckInput): Promise<RedirectURICheckResult> {
  logger.debug('Checking redirect URIs', { count: input.redirectUris.length, clientType: input.clientType });

  const validatedInput = RedirectURICheckSchema.parse(input);

  const checks = [];
  const rulesToCheck = ['RFC6749_NO_WILDCARD_REDIRECT', 'RFC8252_LOCALHOST_REDIRECT'];

  for (const ruleId of rulesToCheck) {
    const rule = complianceRules[ruleId];
    if (!rule) continue;

    const passed = rule.check({ redirectUris: validatedInput.redirectUris, clientType: validatedInput.clientType });
    checks.push({
      passed,
      ruleId,
      severity: rule.severity,
      description: rule.description,
    });
  }

  const perUriResults: URICheckResult[] = validatedInput.redirectUris.map((uri) => {
    const issues: URICheckResult['issues'] = [];

    // Check for wildcards
    if (uri.includes('*')) {
      issues.push({
        ruleId: 'RFC6749_NO_WILDCARD_REDIRECT',
        severity: 'error',
        description: 'URI contains wildcard character (*)',
      });
    }

    // Check HTTPS requirement for web/spa
    if ((validatedInput.clientType === 'web' || validatedInput.clientType === 'spa') && uri.startsWith('http://')) {
      const isLocalhost = uri.includes('localhost') || uri.includes('127.0.0.1') || uri.includes('[::1]');
      if (!isLocalhost) {
        issues.push({
          ruleId: 'RFC6749_HTTPS_REQUIRED',
          severity: 'error',
          description: 'Non-localhost URIs must use HTTPS',
        });
      }
    }

    // Check localhost for native apps
    if (validatedInput.clientType === 'native' && !uri.includes('localhost') && !uri.includes('127.0.0.1')) {
      issues.push({
        ruleId: 'RFC8252_LOCALHOST_REDIRECT',
        severity: 'warn',
        description: 'Native apps should use localhost or loopback address',
      });
    }

    return {
      uri,
      isValid: issues.length === 0,
      issues,
    };
  });

  return {
    checks,
    perUriResults,
  };
}
