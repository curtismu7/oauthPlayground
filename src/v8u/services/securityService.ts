// src/v8u/services/securityService.ts
// Comprehensive Security Service for OAuth Playground

import { logger } from './unifiedFlowLoggerServiceV8U';

export interface SecurityThreat {
	id: string;
	type: 'xss' | 'csrf' | 'injection' | 'token_leak' | 'invalid_redirect' | 'weak_crypto';
	severity: 'low' | 'medium' | 'high' | 'critical';
	description: string;
	url?: string;
	timestamp: number;
	blocked: boolean;
}

export interface SecurityScan {
	id: string;
	timestamp: number;
	threats: SecurityThreat[];
	score: number; // 0-100
	recommendations: string[];
}

export interface SecurityMetrics {
	encryptionEnabled: boolean;
	tokenMaskingEnabled: boolean;
	secureStorageEnabled: boolean;
	sessionTimeoutMinutes: number;
	requireReauth: boolean;
	auditLogCount: number;
	lastScan: SecurityScan | null;
}

export class SecurityService {
	private static instance: SecurityService;
	private auditLogs: any[] = [];
	private lastScan: SecurityScan | null = null;
	private metrics: SecurityMetrics;

	private constructor() {
		this.metrics = {
			encryptionEnabled: true,
			tokenMaskingEnabled: true,
			secureStorageEnabled: true,
			sessionTimeoutMinutes: 30,
			requireReauth: false,
			auditLogCount: 0,
			lastScan: null,
		};
	}

	static getInstance(): SecurityService {
		if (!SecurityService.instance) {
			SecurityService.instance = new SecurityService();
		}
		return SecurityService.instance;
	}

	// Token Security
	maskToken(token: string, visibleChars: number = 8): string {
		if (!token || token.length <= visibleChars * 2) {
			return token;
		}
		const start = token.substring(0, visibleChars);
		const end = token.substring(token.length - visibleChars);
		const middle = '*'.repeat(token.length - visibleChars * 2);
		return `${start}${middle}${end}`;
	}

	encryptToken(token: string): string {
		// Simple XOR encryption for demonstration
		// In production, use proper encryption libraries
		const key = 'oauth-playground-2024';
		let encrypted = '';
		for (let i = 0; i < token.length; i++) {
			encrypted += String.fromCharCode(token.charCodeAt(i) ^ key.charCodeAt(i % key.length));
		}
		return btoa(encrypted);
	}

	decryptToken(encryptedToken: string): string {
		try {
			const key = 'oauth-playground-2024';
			const decoded = atob(encryptedToken);
			let decrypted = '';
			for (let i = 0; i < decoded.length; i++) {
				decrypted += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
			}
			return decrypted;
		} catch (error) {
			logger.error('[Security] Failed to decrypt token:', error);
			return '';
		}
	}

	// Security Scanning
	async performSecurityScan(): Promise<SecurityScan> {
		logger.debug('[Security] Performing security scan...');

		const threats: SecurityThreat[] = [];
		const scanId = this.generateId();

		// Check for common security issues
		threats.push(...this.checkTokenLeakage());
		threats.push(...this.checkRedirectValidation());
		threats.push(...this.checkXssVulnerabilities());
		threats.push(...this.checkCSRFProtection());

		// Calculate security score
		const score = this.calculateSecurityScore(threats);

		// Generate recommendations
		const recommendations = this.generateRecommendations(threats);

		const scan: SecurityScan = {
			id: scanId,
			timestamp: Date.now(),
			threats,
			score,
			recommendations,
		};

		this.lastScan = scan;
		this.threats = threats;

		// Log the scan
		this.logSecurityEvent(
			'security_scan',
			{
				scanId,
				score,
				threatsFound: threats.length,
			},
			'low'
		);

		return scan;
	}

	private checkTokenLeakage(): SecurityThreat[] {
		const threats: SecurityThreat[] = [];

		// Check if tokens are exposed in localStorage
		const keys = Object.keys(localStorage);
		const tokenKeys = keys.filter(
			(key) => key.toLowerCase().includes('token') || key.toLowerCase().includes('auth')
		);

		if (tokenKeys.length > 0) {
			threats.push({
				id: this.generateId(),
				type: 'token_leak',
				severity: 'high',
				description: `Tokens found in localStorage: ${tokenKeys.join(', ')}`,
				timestamp: Date.now(),
				blocked: false,
			});
		}

		return threats;
	}

	private checkRedirectValidation(): SecurityThreat[] {
		const threats: SecurityThreat[] = [];

		// Check for open redirect vulnerabilities
		const currentUrl = window.location.href;
		if (currentUrl.includes('redirect=') && !currentUrl.includes('validate-redirect')) {
			threats.push({
				id: this.generateId(),
				type: 'invalid_redirect',
				severity: 'medium',
				description: 'Potential open redirect vulnerability detected',
				url: currentUrl,
				timestamp: Date.now(),
				blocked: false,
			});
		}

		return threats;
	}

	private checkXssVulnerabilities(): SecurityThreat[] {
		const threats: SecurityThreat[] = [];

		// Check for unsafe innerHTML usage (simplified check)
		const scripts = document.querySelectorAll('script');
		if (scripts.length > 5) {
			// Arbitrary threshold
			threats.push({
				id: this.generateId(),
				type: 'xss',
				severity: 'low',
				description: 'High number of script tags detected - potential XSS risk',
				timestamp: Date.now(),
				blocked: false,
			});
		}

		return threats;
	}

	private checkCSRFProtection(): SecurityThreat[] {
		const threats: SecurityThreat[] = [];

		// Check for CSRF tokens in forms (simplified)
		const forms = document.querySelectorAll('form');
		const formsWithoutCSRF = Array.from(forms).filter((form) => {
			const inputs = form.querySelectorAll('input');
			return !Array.from(inputs).some(
				(input) =>
					input.name.toLowerCase().includes('csrf') || input.name.toLowerCase().includes('token')
			);
		});

		if (formsWithoutCSRF.length > 0) {
			threats.push({
				id: this.generateId(),
				type: 'csrf',
				severity: 'medium',
				description: `${formsWithoutCSRF.length} form(s) without CSRF protection`,
				timestamp: Date.now(),
				blocked: false,
			});
		}

		return threats;
	}

	private calculateSecurityScore(threats: SecurityThreat[]): number {
		let score = 100;

		threats.forEach((threat) => {
			switch (threat.severity) {
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

	private generateRecommendations(threats: SecurityThreat[]): string[] {
		const recommendations: string[] = [];

		const threatTypes = new Set(threats.map((t) => t.type));

		if (threatTypes.has('token_leak')) {
			recommendations.push('Use secure storage mechanisms for sensitive tokens');
		}

		if (threatTypes.has('invalid_redirect')) {
			recommendations.push('Implement proper URL validation for redirects');
		}

		if (threatTypes.has('xss')) {
			recommendations.push('Sanitize user input and use textContent instead of innerHTML');
		}

		if (threatTypes.has('csrf')) {
			recommendations.push('Implement CSRF tokens for all state-changing forms');
		}

		if (threatTypes.has('weak_crypto')) {
			recommendations.push('Use strong encryption algorithms for sensitive data');
		}

		if (recommendations.length === 0) {
			recommendations.push('Security posture looks good - continue monitoring');
		}

		return recommendations;
	}

	// Audit Logging
	logSecurityEvent(
		event: string,
		details: Record<string, unknown>,
		severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
	): void {
		const log = {
			id: this.generateId(),
			timestamp: Date.now(),
			event,
			details,
			severity,
			userAction: true,
			ipAddress: this.getClientIP(),
			userAgent: navigator.userAgent,
		};

		this.auditLogs.push(log);
		this.metrics.auditLogCount = this.auditLogs.length;

		// Keep only last 1000 logs
		if (this.auditLogs.length > 1000) {
			this.auditLogs = this.auditLogs.slice(-1000);
		}

		logger.debug(`[Security Audit] ${event}:`, details);
	}

	private getClientIP(): string {
		// In a real implementation, this would get the client IP from server
		return 'client-ip-unknown';
	}

	// Session Management
	checkSessionTimeout(lastActivity: number): boolean {
		const timeoutMs = this.metrics.sessionTimeoutMinutes * 60 * 1000;
		return Date.now() - lastActivity > timeoutMs;
	}

	// Public API
	getSecurityMetrics(): SecurityMetrics {
		return { ...this.metrics, lastScan: this.lastScan };
	}

	getAuditLogs(limit: number = 50): any[] {
		return this.auditLogs.slice(-limit);
	}

	getLastScan(): SecurityScan | null {
		return this.lastScan;
	}

	updateSecuritySettings(settings: Partial<SecurityMetrics>): void {
		this.metrics = { ...this.metrics, ...settings };
		this.logSecurityEvent('security_settings_updated', settings, 'low');
	}

	private generateId(): string {
		return Math.random().toString(36).substr(2, 9);
	}

	// Token Validation
	validateTokenStructure(token: string): { valid: boolean; errors: string[] } {
		const errors: string[] = [];

		if (!token) {
			errors.push('Token is empty');
			return { valid: false, errors };
		}

		// Basic JWT structure check
		const parts = token.split('.');
		if (parts.length !== 3) {
			errors.push('Token does not have 3 parts (header.payload.signature)');
		}

		// Check for common insecure patterns
		if (token.length < 20) {
			errors.push('Token appears to be too short');
		}

		if (token.includes('password') || token.includes('secret')) {
			errors.push('Token contains sensitive keywords');
		}

		return {
			valid: errors.length === 0,
			errors,
		};
	}
}

export const securityService = SecurityService.getInstance();
export default securityService;
