// src/utils/securityHeaders.ts
// Security headers implementation for OAuth/OIDC flows

export interface SecurityHeaders {
	'Content-Security-Policy': string;
	'X-Content-Type-Options': string;
	'X-Frame-Options': string;
	'X-XSS-Protection': string;
	'Strict-Transport-Security': string;
	'Referrer-Policy': string;
	'Permissions-Policy': string;
}

export interface SecurityHeaderConfig {
	name: string;
	value: string;
	description: string;
	required: boolean;
	flowTypes: string[];
}

/**
 * Security Headers Service
 * Implements security best practices for OAuth/OIDC flows
 */
export class SecurityHeadersService {
	private static securityConfigs: SecurityHeaderConfig[] = [
		{
			name: 'Content-Security-Policy',
			value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';",
			description: 'Content Security Policy to prevent XSS attacks',
			required: true,
			flowTypes: ['all']
		},
		{
			name: 'X-Content-Type-Options',
			value: 'nosniff',
			description: 'Prevent MIME type sniffing',
			required: true,
			flowTypes: ['all']
		},
		{
			name: 'X-Frame-Options',
			value: 'DENY',
			description: 'Prevent clickjacking attacks',
			required: true,
			flowTypes: ['all']
		},
		{
			name: 'X-XSS-Protection',
			value: '1; mode=block',
			description: 'Enable XSS filtering',
			required: true,
			flowTypes: ['all']
		},
		{
			name: 'Strict-Transport-Security',
			value: 'max-age=31536000; includeSubDomains; preload',
			description: 'Enforce HTTPS',
			required: true,
			flowTypes: ['all']
		},
		{
			name: 'Referrer-Policy',
			value: 'strict-origin-when-cross-origin',
			description: 'Control referrer information',
			required: true,
			flowTypes: ['all']
		},
		{
			name: 'Permissions-Policy',
			value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
			description: 'Control browser permissions',
			required: false,
			flowTypes: ['all']
		}
	];

	/**
	 * Get security headers for a specific flow
	 */
	static getSecurityHeaders(flowName: string): SecurityHeaders {
		const headers: SecurityHeaders = {} as SecurityHeaders;

		for (const config of this.securityConfigs) {
			if (config.flowTypes.includes('all') || config.flowTypes.includes(flowName)) {
				headers[config.name as keyof SecurityHeaders] = config.value;
			}
		}

		return headers;
	}

	/**
	 * Get security headers for OAuth flows
	 */
	static getOAuthSecurityHeaders(): SecurityHeaders {
		return this.getSecurityHeaders('oauth');
	}

	/**
	 * Get security headers for OIDC flows
	 */
	static getOIDCSecurityHeaders(): SecurityHeaders {
		return this.getSecurityHeaders('oidc');
	}

	/**
	 * Get security headers for PingOne flows
	 */
	static getPingOneSecurityHeaders(): SecurityHeaders {
		return this.getSecurityHeaders('pingone');
	}

	/**
	 * Apply security headers to response
	 */
	static applySecurityHeaders(response: Response, flowName: string): void {
		const headers = this.getSecurityHeaders(flowName);
		
		Object.entries(headers).forEach(([name, value]) => {
			response.headers.set(name, value);
		});
	}

	/**
	 * Validate security headers
	 */
	static validateSecurityHeaders(headers: Record<string, string>): {
		isValid: boolean;
		errors: string[];
		warnings: string[];
		missingHeaders: string[];
	} {
		const result = {
			isValid: true,
			errors: [] as string[],
			warnings: [] as string[],
			missingHeaders: [] as string[]
		};

		for (const config of this.securityConfigs) {
			if (config.required) {
				const headerValue = headers[config.name];
				if (!headerValue) {
					result.missingHeaders.push(config.name);
					result.errors.push(`Missing required security header: ${config.name}`);
					result.isValid = false;
				} else if (headerValue !== config.value) {
					result.warnings.push(`Security header ${config.name} has non-standard value: ${headerValue}`);
				}
			}
		}

		return result;
	}

	/**
	 * Get security header configuration
	 */
	static getSecurityHeaderConfig(headerName: string): SecurityHeaderConfig | undefined {
		return this.securityConfigs.find(config => config.name === headerName);
	}

	/**
	 * Get all security header configurations
	 */
	static getAllSecurityHeaderConfigs(): SecurityHeaderConfig[] {
		return [...this.securityConfigs];
	}

	/**
	 * Generate security headers report
	 */
	static generateSecurityHeadersReport(headers: Record<string, string>): string {
		const validation = this.validateSecurityHeaders(headers);
		
		let report = `Security Headers Report\n`;
		report += `=====================\n\n`;
		
		report += `Overall Status: ${validation.isValid ? '✅ SECURE' : '❌ INSECURE'}\n\n`;
		
		if (validation.errors.length > 0) {
			report += `Errors:\n`;
			validation.errors.forEach(error => report += `  ❌ ${error}\n`);
			report += `\n`;
		}
		
		if (validation.warnings.length > 0) {
			report += `Warnings:\n`;
			validation.warnings.forEach(warning => report += `  ⚠️ ${warning}\n`);
			report += `\n`;
		}
		
		if (validation.missingHeaders.length > 0) {
			report += `Missing Headers:\n`;
			validation.missingHeaders.forEach(header => report += `  ❌ ${header}\n`);
			report += `\n`;
		}
		
		report += `Present Headers:\n`;
		Object.entries(headers).forEach(([name, value]) => {
			const config = this.getSecurityHeaderConfig(name);
			if (config) {
				report += `  ✅ ${name}: ${value}\n`;
			} else {
				report += `  ⚠️ ${name}: ${value} (unknown header)\n`;
			}
		});
		
		return report;
	}

	/**
	 * Get security recommendations
	 */
	static getSecurityRecommendations(flowName: string): string[] {
		const recommendations: string[] = [];
		
		// General recommendations
		recommendations.push('Always use HTTPS in production');
		recommendations.push('Implement proper CORS policies');
		recommendations.push('Use secure session management');
		recommendations.push('Implement rate limiting');
		
		// Flow-specific recommendations
		if (flowName.includes('oauth')) {
			recommendations.push('Use PKCE for public clients');
			recommendations.push('Validate state parameter');
			recommendations.push('Use secure redirect URIs');
		}
		
		if (flowName.includes('oidc')) {
			recommendations.push('Validate ID token signature');
			recommendations.push('Check token expiration');
			recommendations.push('Validate nonce parameter');
		}
		
		if (flowName.includes('pingone')) {
			recommendations.push('Use PingOne security features');
			recommendations.push('Implement MFA when required');
			recommendations.push('Use secure client credentials');
		}
		
		return recommendations;
	}

	/**
	 * Check if headers are secure
	 */
	static isSecure(headers: Record<string, string>): boolean {
		const validation = this.validateSecurityHeaders(headers);
		return validation.isValid && validation.missingHeaders.length === 0;
	}

	/**
	 * Get security score
	 */
	static getSecurityScore(headers: Record<string, string>): number {
		const validation = this.validateSecurityHeaders(headers);
		const totalRequired = this.securityConfigs.filter(config => config.required).length;
		const presentRequired = totalRequired - validation.missingHeaders.length;
		
		return Math.round((presentRequired / totalRequired) * 100);
	}
}