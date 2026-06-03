/**
 * OIDC discovery endpoint validation
 */

import { z } from 'zod';
import { fetchOIDCDiscovery, OIDCDiscoveryDocument } from '../services/discoveryFetcher.js';
import { complianceRules } from '../services/complianceRules.js';
import { logger } from '../services/logger.js';

const OIDCDiscoveryCheckSchema = z.object({
  issuerUrl: z.string().url('Invalid issuer URL'),
});

type OIDCDiscoveryCheckInput = z.infer<typeof OIDCDiscoveryCheckSchema>;

export interface OIDCDiscoveryCheckResult {
  checks: Array<{
    passed: boolean;
    ruleId: string;
    severity: string;
    description: string;
  }>;
  score: number;
  discoveryUrl: string;
  rawDiscovery?: OIDCDiscoveryDocument;
}

export async function checkOIDCDiscovery(input: OIDCDiscoveryCheckInput): Promise<OIDCDiscoveryCheckResult> {
  logger.debug('Checking OIDC discovery', { issuerUrl: input.issuerUrl });

  const validatedInput = OIDCDiscoveryCheckSchema.parse(input);

  // Fetch discovery document
  const discovery = await fetchOIDCDiscovery(validatedInput.issuerUrl);

  const checks = [];
  const rulesToCheck = ['OIDC_REQUIRED_FIELDS'];

  for (const ruleId of rulesToCheck) {
    const rule = complianceRules[ruleId];
    if (!rule) continue;

    const passed = rule.check({ discovery });
    checks.push({
      passed,
      ruleId,
      severity: rule.severity,
      description: rule.description,
    });
  }

  // Calculate score
  let score = 0;
  for (const check of checks) {
    if (check.passed) {
      score += check.severity === 'error' ? 10 : 5;
    } else {
      score += check.severity === 'error' ? -15 : -5;
    }
  }

  const normalizedScore = Math.max(0, Math.min(100, 50 + (score / 10) * 10));

  const discoveryUrl = `${validatedInput.issuerUrl.replace(/\/$/, '')}/.well-known/openid-configuration`;

  return {
    checks,
    score: Math.round(normalizedScore),
    discoveryUrl,
    rawDiscovery: discovery,
  };
}
