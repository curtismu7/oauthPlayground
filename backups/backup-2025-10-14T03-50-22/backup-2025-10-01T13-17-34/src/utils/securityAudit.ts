// Security Audit Utility for OAuth Playground

import { tokenLifecycleManager } from './tokenLifecycle';
import { getOAuthTokens } from './tokenStorage';

export interface SecurityVulnerability {
	id: string;
	severity: 'low' | 'medium' | 'high' | 'critical';
	category: 'token' | 'storage' | 'transmission' | 'validation' | 'configuration';
	title: string;
	description: string;
	recommendation: string;
	affectedTokens?: string[];
}

export interface SecurityAuditReport {
	auditId: string;
	timestamp: Date;
	overallScore: number; // 0-100
	vulnerabilities: SecurityVulnerability[];
	summary: {
		totalVulnerabilities: number;
		criticalCount: number;
		highCount: number;
		mediumCount: number;
		lowCount: number;
	};
	recommendations: string[];
}

class SecurityAuditor {
	private readonly AUDIT_HISTORY_KEY = 'pingone_playground_security_audits';

	/**
	 * Perform comprehensive security audit
	 */
	async performSecurityAudit(): Promise<SecurityAuditReport> {
		const auditId = this.generateAuditId();
		const timestamp = new Date();
		const vulnerabilities: SecurityVulnerability[] = [];

		// Check token storage security
		vulnerabilities.push(...this.auditTokenStorage());

		// Check token transmission security
		vulnerabilities.push(...this.auditTokenTransmission());

		// Check input validation
		vulnerabilities.push(...this.auditInputValidation());

		// Check configuration security
		vulnerabilities.push(...this.auditConfigurationSecurity());

		// Check token lifecycle security
		vulnerabilities.push(...this.auditTokenLifecycle());

		// Calculate overall score
		const overallScore = this.calculateSecurityScore(vulnerabilities);

		// Generate summary
		const summary = this.generateSummary(vulnerabilities);

		// Generate recommendations
		const recommendations = this.generateRecommendations(vulnerabilities);

		const report: SecurityAuditReport = {
			auditId,
			timestamp,
			overallScore,
			vulnerabilities,
			summary,
			recommendations,
		};

		// Store audit report
		this.storeAuditReport(report);

		return report;
	}

	/**
	 * Audit token storage security
	 */
	private auditTokenStorage(): SecurityVulnerability[] {
		const vulnerabilities: SecurityVulnerability[] = [];

		try {
			const tokens = getOAuthTokens();

			if (tokens) {
				// Check for token exposure in localStorage
				if (typeof window !== 'undefined' && window.localStorage) {
					const localStorageKeys = Object.keys(window.localStorage);
					const tokenKeys = localStorageKeys.filter(
						(key) => key.includes('token') || key.includes('auth') || key.includes('oauth')
					);

					if (tokenKeys.length > 0) {
						vulnerabilities.push({
							id: 'token-storage-exposure',
							severity: 'high',
							category: 'storage',
							title: 'Tokens stored in localStorage',
							description:
								'OAuth tokens are stored in browser localStorage, which can be accessed by any script on the domain',
							recommendation:
								'Consider using httpOnly cookies or secure session storage for sensitive tokens',
							affectedTokens: [tokens.access_token?.substring(0, 8) + '...'],
						});
					}
				}

				// Check token expiration
				if (tokens.timestamp && tokens.expires_in) {
					const now = Date.now();
					const expiresAt = tokens.timestamp + tokens.expires_in * 1000;
					const timeUntilExpiry = expiresAt - now;

					if (timeUntilExpiry < 0) {
						vulnerabilities.push({
							id: 'token-expired',
							severity: 'medium',
							category: 'token',
							title: 'Expired tokens in storage',
							description: 'Expired tokens are still stored and could be used for replay attacks',
							recommendation: 'Implement automatic token cleanup for expired tokens',
							affectedTokens: [tokens.access_token?.substring(0, 8) + '...'],
						});
					} else if (timeUntilExpiry < 300000) {
						// Less than 5 minutes
						vulnerabilities.push({
							id: 'token-expiring-soon',
							severity: 'low',
							category: 'token',
							title: 'Tokens expiring soon',
							description:
								'Tokens will expire within 5 minutes, which may cause authentication failures',
							recommendation:
								'Implement token refresh mechanism or warn users about impending expiration',
							affectedTokens: [tokens.access_token?.substring(0, 8) + '...'],
						});
					}
				}

				// Check for weak token types
				if (tokens.token_type !== 'Bearer') {
					vulnerabilities.push({
						id: 'weak-token-type',
						severity: 'medium',
						category: 'token',
						title: 'Non-standard token type',
						description: `Token type '${tokens.token_type}' is not the standard 'Bearer' type`,
						recommendation: 'Use standard Bearer token type for better compatibility and security',
						affectedTokens: [tokens.access_token?.substring(0, 8) + '...'],
					});
				}
			}
		} catch (error) {
			vulnerabilities.push({
				id: 'token-storage-error',
				severity: 'medium',
				category: 'storage',
				title: 'Token storage access error',
				description: 'Error occurred while accessing stored tokens',
				recommendation: 'Implement proper error handling for token storage operations',
			});
		}

		return vulnerabilities;
	}

	/**
	 * Audit token transmission security
	 */
	private auditTokenTransmission(): SecurityVulnerability[] {
		const vulnerabilities: SecurityVulnerability[] = [];

		// Check if running over HTTPS
		if (typeof window !== 'undefined') {
			const isHttps = window.location.protocol === 'https:';

			if (!isHttps) {
				vulnerabilities.push({
					id: 'insecure-transmission',
					severity: 'critical',
					category: 'transmission',
					title: 'Insecure HTTP transmission',
					description:
						'Application is running over HTTP, making token transmission vulnerable to interception',
					recommendation: 'Always use HTTPS in production environments',
				});
			}
		}

		// Check for secure cookie settings (if applicable)
		if (typeof document !== 'undefined') {
			const cookies = document.cookie.split(';');
			const authCookies = cookies.filter(
				(cookie) => cookie.includes('token') || cookie.includes('auth') || cookie.includes('oauth')
			);

			authCookies.forEach((cookie) => {
				if (!cookie.includes('Secure') && !cookie.includes('HttpOnly')) {
					vulnerabilities.push({
						id: 'insecure-cookie',
						severity: 'high',
						category: 'transmission',
						title: 'Insecure cookie configuration',
						description: 'Authentication cookies lack Secure and HttpOnly flags',
						recommendation: 'Set Secure and HttpOnly flags on authentication cookies',
					});
				}
			});
		}

		return vulnerabilities;
	}

	/**
	 * Audit input validation
	 */
	private auditInputValidation(): SecurityVulnerability[] {
		const vulnerabilities: SecurityVulnerability[] = [];

		// Check for XSS vulnerabilities in token display
		const tokenElements = document.querySelectorAll('[data-token]');
		tokenElements.forEach((element) => {
			const tokenValue = element.getAttribute('data-token');
			if (tokenValue && this.containsScriptTags(tokenValue)) {
				vulnerabilities.push({
					id: 'xss-vulnerability',
					severity: 'high',
					category: 'validation',
					title: 'Potential XSS vulnerability in token display',
					description: 'Token values may contain script tags that could be executed',
					recommendation: 'Sanitize token values before displaying them in the DOM',
				});
			}
		});

		// Check for CSRF protection
		const forms = document.querySelectorAll('form');
		let hasCsrfProtection = false;

		forms.forEach((form) => {
			const csrfInput = form.querySelector(
				'input[name*="csrf"], input[name*="token"], input[name*="_token"]'
			);
			if (csrfInput) {
				hasCsrfProtection = true;
			}
		});

		if (forms.length > 0 && !hasCsrfProtection) {
			vulnerabilities.push({
				id: 'missing-csrf-protection',
				severity: 'medium',
				category: 'validation',
				title: 'Missing CSRF protection',
				description: 'Forms lack CSRF protection tokens',
				recommendation: 'Implement CSRF protection for all forms that modify state',
			});
		}

		return vulnerabilities;
	}

	/**
	 * Audit configuration security
	 */
	private auditConfigurationSecurity(): SecurityVulnerability[] {
		const vulnerabilities: SecurityVulnerability[] = [];

		// Check for hardcoded secrets in localStorage
		if (typeof window !== 'undefined' && window.localStorage) {
			const localStorageKeys = Object.keys(window.localStorage);
			const secretKeys = localStorageKeys.filter(
				(key) =>
					key.toLowerCase().includes('secret') ||
					key.toLowerCase().includes('password') ||
					key.toLowerCase().includes('key')
			);

			if (secretKeys.length > 0) {
				vulnerabilities.push({
					id: 'hardcoded-secrets',
					severity: 'critical',
					category: 'configuration',
					title: 'Hardcoded secrets in localStorage',
					description: 'Sensitive secrets are stored in localStorage',
					recommendation:
						'Remove hardcoded secrets and use environment variables or secure configuration management',
				});
			}
		}

		// Check for debug mode in production
		if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
			const debugElements = document.querySelectorAll('[data-debug], .debug, #debug');
			if (debugElements.length > 0) {
				vulnerabilities.push({
					id: 'debug-mode-production',
					severity: 'medium',
					category: 'configuration',
					title: 'Debug mode enabled in production',
					description: 'Debug elements are present in production environment',
					recommendation: 'Disable debug mode and remove debug elements in production',
				});
			}
		}

		return vulnerabilities;
	}

	/**
	 * Audit token lifecycle security
	 */
	private auditTokenLifecycle(): SecurityVulnerability[] {
		const vulnerabilities: SecurityVulnerability[] = [];

		try {
			const analytics = tokenLifecycleManager.getTokenUsageAnalytics();

			// Check for excessive token usage
			if (analytics.totalTokens > 100) {
				vulnerabilities.push({
					id: 'excessive-token-usage',
					severity: 'low',
					category: 'token',
					title: 'Excessive number of stored tokens',
					description: `Application has ${analytics.totalTokens} stored tokens, which may indicate inefficient token management`,
					recommendation: 'Implement token cleanup policies to remove unused tokens',
				});
			}

			// Check for long-lived tokens
			if (analytics.averageTokenLifetime > 1440) {
				// More than 24 hours
				vulnerabilities.push({
					id: 'long-lived-tokens',
					severity: 'medium',
					category: 'token',
					title: 'Long-lived tokens detected',
					description: `Average token lifetime is ${Math.round(analytics.averageTokenLifetime)} minutes`,
					recommendation: 'Consider implementing shorter token lifetimes and refresh mechanisms',
				});
			}

			// Check for expired tokens
			if (analytics.expiredTokens > 0) {
				vulnerabilities.push({
					id: 'expired-tokens-stored',
					severity: 'medium',
					category: 'token',
					title: 'Expired tokens still stored',
					description: `${analytics.expiredTokens} expired tokens are still stored`,
					recommendation: 'Implement automatic cleanup of expired tokens',
				});
			}
		} catch (error) {
			vulnerabilities.push({
				id: 'lifecycle-audit-error',
				severity: 'low',
				category: 'token',
				title: 'Token lifecycle audit error',
				description: 'Error occurred while auditing token lifecycle',
				recommendation: 'Fix token lifecycle management system',
			});
		}

		return vulnerabilities;
	}

	/**
	 * Calculate overall security score
	 */
	private calculateSecurityScore(vulnerabilities: SecurityVulnerability[]): number {
		let score = 100;

		vulnerabilities.forEach((vuln) => {
			switch (vuln.severity) {
				case 'critical':
					score -= 25;
					break;
				case 'high':
					score -= 15;
					break;
				case 'medium':
					score -= 10;
					break;
				case 'low':
					score -= 5;
					break;
			}
		});

		return Math.max(0, score);
	}

	/**
	 * Generate vulnerability summary
	 */
	private generateSummary(vulnerabilities: SecurityVulnerability[]) {
		return {
			totalVulnerabilities: vulnerabilities.length,
			criticalCount: vulnerabilities.filter((v) => v.severity === 'critical').length,
			highCount: vulnerabilities.filter((v) => v.severity === 'high').length,
			mediumCount: vulnerabilities.filter((v) => v.severity === 'medium').length,
			lowCount: vulnerabilities.filter((v) => v.severity === 'low').length,
		};
	}

	/**
	 * Generate security recommendations
	 */
	private generateRecommendations(vulnerabilities: SecurityVulnerability[]): string[] {
		const recommendations: string[] = [];

		const criticalVulns = vulnerabilities.filter((v) => v.severity === 'critical');
		const highVulns = vulnerabilities.filter((v) => v.severity === 'high');

		if (criticalVulns.length > 0) {
			recommendations.push(' URGENT: Address critical vulnerabilities immediately');
		}

		if (highVulns.length > 0) {
			recommendations.push(' HIGH PRIORITY: Fix high-severity vulnerabilities');
		}

		if (vulnerabilities.some((v) => v.category === 'storage')) {
			recommendations.push(' Implement secure token storage mechanisms');
		}

		if (vulnerabilities.some((v) => v.category === 'transmission')) {
			recommendations.push(' Ensure all token transmission uses HTTPS');
		}

		if (vulnerabilities.some((v) => v.category === 'validation')) {
			recommendations.push(' Implement comprehensive input validation and sanitization');
		}

		if (vulnerabilities.some((v) => v.category === 'configuration')) {
			recommendations.push(' Review and secure application configuration');
		}

		if (vulnerabilities.length === 0) {
			recommendations.push(' No security vulnerabilities detected');
		}

		return recommendations;
	}

	/**
	 * Check if string contains script tags
	 */
	private containsScriptTags(str: string): boolean {
		return /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(str);
	}

	/**
	 * Generate unique audit ID
	 */
	private generateAuditId(): string {
		return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	/**
	 * Store audit report
	 */
	private storeAuditReport(report: SecurityAuditReport): void {
		try {
			const existingReports = this.getAuditHistory();
			existingReports.push(report);

			// Keep only last 10 reports
			if (existingReports.length > 10) {
				existingReports.splice(0, existingReports.length - 10);
			}

			localStorage.setItem(this.AUDIT_HISTORY_KEY, JSON.stringify(existingReports));
		} catch (error) {
			console.error('Failed to store audit report:', error);
		}
	}

	/**
	 * Get audit history
	 */
	getAuditHistory(): SecurityAuditReport[] {
		try {
			const stored = localStorage.getItem(this.AUDIT_HISTORY_KEY);
			if (!stored) return [];

			const reports = JSON.parse(stored);
			return reports.map((report: Record<string, unknown>) => ({
				...report,
				timestamp: new Date(report.timestamp),
			}));
		} catch (error) {
			console.error('Failed to get audit history:', error);
			return [];
		}
	}
}

export const securityAuditor = new SecurityAuditor();
export default securityAuditor;
