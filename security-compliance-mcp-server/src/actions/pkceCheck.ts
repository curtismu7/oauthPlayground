/**
 * PKCE compliance checking
 */

import { z } from 'zod';
import { complianceRules } from '../services/complianceRules.js';
import { logger } from '../services/logger.js';

const PKCECheckSchema = z.object({
  codeVerifier: z.string().optional(),
  codeChallenge: z.string().optional(),
  codeChallengeMethod: z.enum(['plain', 'S256']).optional(),
});

type PKCECheckInput = z.infer<typeof PKCECheckSchema>;

export interface PKCECheckResult {
  checks: Array<{
    passed: boolean;
    ruleId: string;
    severity: string;
    description: string;
  }>;
  verifierEntropy?: number;
  isCompliant: boolean;
}

function calculateEntropy(str: string): number {
  const freq: Record<string, number> = {};
  for (const char of str) {
    freq[char] = (freq[char] || 0) + 1;
  }
  let entropy = 0;
  const len = str.length;
  for (const count of Object.values(freq)) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

export async function checkPKCECompliance(input: PKCECheckInput): Promise<PKCECheckResult> {
  logger.debug('Checking PKCE compliance', { input });

  const validatedInput = PKCECheckSchema.parse(input);

  const checks = [];
  const rulesToCheck = ['RFC7636_VERIFIER_LENGTH', 'RFC7636_CHALLENGE_S256_PREFERRED'];

  for (const ruleId of rulesToCheck) {
    const rule = complianceRules[ruleId];
    if (!rule) continue;

    const passed = rule.check(validatedInput as Record<string, unknown>);
    checks.push({
      passed,
      ruleId,
      severity: rule.severity,
      description: rule.description,
    });
  }

  let verifierEntropy: number | undefined;
  if (validatedInput.codeVerifier) {
    verifierEntropy = calculateEntropy(validatedInput.codeVerifier);
  }

  const isCompliant = checks.every((c) => c.passed);

  return {
    checks,
    verifierEntropy,
    isCompliant,
  };
}
