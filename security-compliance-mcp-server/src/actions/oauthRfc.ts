/**
 * Check OAuth 2.0 RFC compliance
 */

import { z } from 'zod';
import { complianceRules } from '../services/complianceRules.js';
import { logger } from '../services/logger.js';

const OAuthConfigSchema = z.object({
  grantTypes: z.array(z.string()).optional(),
  redirectUris: z.array(z.string()).optional(),
  clientType: z.enum(['confidential', 'public', 'native', 'spa']).optional(),
  pkceEnabled: z.boolean().optional(),
  tokenLifetimeSeconds: z.number().optional(),
  responseTypes: z.array(z.string()).optional(),
});

type OAuthConfig = z.infer<typeof OAuthConfigSchema>;

export interface CheckResult {
  passed: boolean;
  ruleId: string;
  severity: string;
  description: string;
  remediation: string;
}

export interface OAuthConfigCheckResult {
  checks: CheckResult[];
  score: number;
  summary: string;
}

export async function checkOAuthConfig(input: OAuthConfig): Promise<OAuthConfigCheckResult> {
  logger.debug('Checking OAuth config', { input });

  // Validate input
  const validatedInput = OAuthConfigSchema.parse(input);

  const checks: CheckResult[] = [];
  const rulesToCheck = [
    'RFC6749_NO_WILDCARD_REDIRECT',
    'RFC8252_LOCALHOST_REDIRECT',
    'RFC9700_PKCE_REQUIRED_PUBLIC',
    'RFC9700_NO_IMPLICIT',
    'TOKEN_EXP_TOO_LONG',
    'RESPONSE_TYPE_CODE_PREFERRED',
  ];

  for (const ruleId of rulesToCheck) {
    const rule = complianceRules[ruleId];
    if (!rule) continue;

    const passed = rule.check(validatedInput as Record<string, unknown>);
    checks.push({
      passed,
      ruleId,
      severity: rule.severity,
      description: rule.description,
      remediation: rule.remediation,
    });
  }

  // Calculate score: error pass +10, error fail -15, warn pass +5, warn fail -5
  let score = 0;
  for (const check of checks) {
    if (check.passed) {
      score += check.severity === 'error' ? 10 : 5;
    } else {
      score += check.severity === 'error' ? -15 : -5;
    }
  }

  // Normalize to 0-100
  const normalizedScore = Math.max(0, Math.min(100, 50 + (score / 10) * 10));

  const failedCount = checks.filter((c) => !c.passed).length;
  const summary = failedCount === 0 ? 'All OAuth configuration checks passed' : `${failedCount} compliance issues found`;

  return {
    checks,
    score: Math.round(normalizedScore),
    summary,
  };
}
