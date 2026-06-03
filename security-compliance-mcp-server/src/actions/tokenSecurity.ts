/**
 * Token security and claims validation
 */

import { z } from 'zod';
import { complianceRules } from '../services/complianceRules.js';
import { logger } from '../services/logger.js';

const TokenSecurityCheckSchema = z.record(z.unknown());

type TokenPayload = Record<string, unknown>;

export type RiskLevel = 'low' | 'medium' | 'high';

export interface TokenSecurityCheckResult {
  checks: Array<{
    passed: boolean;
    ruleId: string;
    severity: string;
    description: string;
  }>;
  riskLevel: RiskLevel;
}

export async function checkTokenSecurity(input: { payload: TokenPayload }): Promise<TokenSecurityCheckResult> {
  logger.debug('Checking token security', { hasSub: 'sub' in input.payload, hasAud: 'aud' in input.payload });

  const validatedInput = TokenSecurityCheckSchema.parse(input.payload);

  const checks = [];
  const rulesToCheck = ['TOKEN_MISSING_AUD', 'TOKEN_MISSING_SUB', 'TOKEN_EXP_TOO_LONG'];

  for (const ruleId of rulesToCheck) {
    const rule = complianceRules[ruleId];
    if (!rule) continue;

    const passed = rule.check({ payload: validatedInput });
    checks.push({
      passed,
      ruleId,
      severity: rule.severity,
      description: rule.description,
    });
  }

  // Determine risk level based on failures
  const criticalFailures = checks.filter((c) => !c.passed && c.severity === 'error').length;
  const warningFailures = checks.filter((c) => !c.passed && c.severity === 'warn').length;

  let riskLevel: RiskLevel = 'low';
  if (criticalFailures > 1) {
    riskLevel = 'high';
  } else if (criticalFailures === 1 || warningFailures > 1) {
    riskLevel = 'medium';
  }

  return {
    checks,
    riskLevel,
  };
}
