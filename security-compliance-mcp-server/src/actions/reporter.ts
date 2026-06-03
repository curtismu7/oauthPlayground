/**
 * Comprehensive compliance report generator
 */

import { z } from 'zod';
import { checkOAuthConfig } from './oauthRfc.js';
import { checkPKCECompliance } from './pkceCheck.js';
import { checkTokenSecurity } from './tokenSecurity.js';
import { complianceRules } from '../services/complianceRules.js';
import { logger } from '../services/logger.js';

const ComplianceReportSchema = z.object({
  grantTypes: z.array(z.string()).optional(),
  redirectUris: z.array(z.string()).optional(),
  clientType: z.enum(['confidential', 'public', 'native', 'spa']).optional(),
  pkceEnabled: z.boolean().optional(),
  issuerUrl: z.string().url().optional(),
  tokenPayload: z.record(z.unknown()).optional(),
});

type ComplianceReportInput = z.infer<typeof ComplianceReportSchema>;

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface ComplianceReportSection {
  title: string;
  score: number;
  issues: number;
  summary: string;
}

export interface RemediationItem {
  ruleId: string;
  description: string;
  remediation: string;
  severity: string;
}

export interface ComplianceReport {
  reportId: string;
  timestamp: string;
  score: number;
  grade: Grade;
  sections: ComplianceReportSection[];
  remediationPlan: RemediationItem[];
}

function getGrade(score: number): Grade {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 45) return 'D';
  return 'F';
}

function generateReportId(): string {
  return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function generateComplianceReport(input: ComplianceReportInput): Promise<ComplianceReport> {
  logger.debug('Generating compliance report');

  const validatedInput = ComplianceReportSchema.parse(input);

  const sections: ComplianceReportSection[] = [];
  const allRemediations: RemediationItem[] = [];
  const scores: number[] = [];

  // OAuth Config Check
  if (
    validatedInput.grantTypes ||
    validatedInput.redirectUris ||
    validatedInput.clientType ||
    validatedInput.pkceEnabled !== undefined
  ) {
    try {
      const oauthResult = await checkOAuthConfig({
        grantTypes: validatedInput.grantTypes,
        redirectUris: validatedInput.redirectUris,
        clientType: validatedInput.clientType,
        pkceEnabled: validatedInput.pkceEnabled,
      });

      scores.push(oauthResult.score);
      const failedChecks = oauthResult.checks.filter((c) => !c.passed);

      sections.push({
        title: 'OAuth 2.0 Configuration',
        score: oauthResult.score,
        issues: failedChecks.length,
        summary: oauthResult.summary,
      });

      for (const check of failedChecks) {
        const rule = complianceRules[check.ruleId];
        allRemediations.push({
          ruleId: check.ruleId,
          description: check.description,
          remediation: rule?.remediation || 'No remediation available',
          severity: check.severity,
        });
      }
    } catch (error) {
      logger.warn('OAuth config check failed', { error: String(error) });
    }
  }

  // PKCE Check
  if (validatedInput.pkceEnabled !== undefined) {
    try {
      const pkceResult = await checkPKCECompliance({
        codeVerifier: undefined,
        codeChallengeMethod: undefined,
      });

      const failedChecks = pkceResult.checks.filter((c) => !c.passed);

      sections.push({
        title: 'PKCE Compliance',
        score: pkceResult.isCompliant ? 100 : 50,
        issues: failedChecks.length,
        summary: pkceResult.isCompliant ? 'PKCE implementation is compliant' : 'PKCE has compliance issues',
      });
    } catch (error) {
      logger.warn('PKCE check failed', { error: String(error) });
    }
  }

  // Token Security Check
  if (validatedInput.tokenPayload) {
    try {
      const tokenResult = await checkTokenSecurity({
        payload: validatedInput.tokenPayload,
      });

      const riskScores = { low: 100, medium: 60, high: 30 };
      const score = riskScores[tokenResult.riskLevel];
      scores.push(score);

      const failedChecks = tokenResult.checks.filter((c) => !c.passed);

      sections.push({
        title: 'Token Security',
        score,
        issues: failedChecks.length,
        summary: `Token security risk level: ${tokenResult.riskLevel}`,
      });

      for (const check of failedChecks) {
        const rule = complianceRules[check.ruleId];
        allRemediations.push({
          ruleId: check.ruleId,
          description: check.description,
          remediation: rule?.remediation || 'No remediation available',
          severity: check.severity,
        });
      }
    } catch (error) {
      logger.warn('Token security check failed', { error: String(error) });
    }
  }

  // Calculate overall score
  const overallScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 50;
  const grade = getGrade(overallScore);

  return {
    reportId: generateReportId(),
    timestamp: new Date().toISOString(),
    score: overallScore,
    grade,
    sections,
    remediationPlan: allRemediations,
  };
}
