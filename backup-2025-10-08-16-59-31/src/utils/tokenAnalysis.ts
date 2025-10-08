import { logger } from './logger';

// Token analysis types
export interface TokenAnalysisResult {
	isValid: boolean;
	tokenType: 'access_token' | 'refresh_token' | 'id_token' | 'unknown';
	format: 'jwt' | 'opaque' | 'unknown';
	expiration?: Date;
	issuedAt?: Date;
	issuer?: string;
	audience?: string[];
	subject?: string;
	scopes?: string[];
	claims?: Record<string, unknown>;
	securityIssues: SecurityIssue[];
	validationErrors: ValidationError[];
	recommendations: string[];
	riskScore: number;
}

export interface SecurityIssue {
	type:
		| 'weak_algorithm'
		| 'missing_claims'
		| 'expired_token'
		| 'invalid_signature'
		| 'weak_key'
		| 'suspicious_claims'
		| 'token_reuse'
		| 'insecure_transport';
	severity: 'low' | 'medium' | 'high' | 'critical';
	description: string;
	recommendation: string;
	evidence?: string;
}

export interface ValidationError {
	field: string;
	error: string;
	expected?: unknown;
	actual?: unknown;
	severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface TokenRefreshInfo {
	canRefresh: boolean;
	refreshToken?: string;
	refreshEndpoint?: string;
	lastRefresh?: Date;
	refreshCount: number;
	maxRefreshAttempts: number;
	refreshErrors: RefreshError[];
}

export interface RefreshError {
	timestamp: Date;
	error: string;
	statusCode?: number;
	retryAfter?: number;
}

export interface TokenSecurityAnalysis {
	overallScore: number;
	algorithmSecurity: number;
	keySecurity: number;
	claimSecurity: number;
	transportSecurity: number;
	lifecycleSecurity: number;
	issues: SecurityIssue[];
	recommendations: string[];
}

// Token analysis utility class
export class TokenAnalyzer {
	private static instance: TokenAnalyzer;

	private constructor() {}

	public static getInstance(): TokenAnalyzer {
		if (!TokenAnalyzer.instance) {
			TokenAnalyzer.instance = new TokenAnalyzer();
		}
		return TokenAnalyzer.instance;
	}

	// Analyze a token
	public analyzeToken(token: string): TokenAnalysisResult {
		try {
			const result: TokenAnalysisResult = {
				isValid: false,
				tokenType: 'unknown',
				format: 'unknown',
				securityIssues: [],
				validationErrors: [],
				recommendations: [],
				riskScore: 0,
			};

			// Determine token format
			result.format = this.detectTokenFormat(token);

			if (result.format === 'jwt') {
				this.analyzeJWTToken(token, result);
			} else {
				this.analyzeOpaqueToken(token, result);
			}

			// Calculate risk score
			result.riskScore = this.calculateRiskScore(result);

			// Generate recommendations
			result.recommendations = this.generateRecommendations(result);

			logger.info('[TokenAnalyzer] Token analysis completed', {
				isValid: result.isValid,
				format: result.format,
				riskScore: result.riskScore,
			});

			return result;
		} catch (error) {
			logger.error('[TokenAnalyzer] Token analysis failed:', error);
			return {
				isValid: false,
				tokenType: 'unknown',
				format: 'unknown',
				securityIssues: [
					{
						type: 'invalid_signature',
						severity: 'critical',
						description: 'Token analysis failed',
						recommendation: 'Check token format and validity',
					},
				],
				validationErrors: [
					{
						field: 'token',
						error: 'Analysis failed',
						severity: 'critical',
					},
				],
				recommendations: ['Verify token format and try again'],
				riskScore: 100,
			};
		}
	}

	// Detect token format
	private detectTokenFormat(token: string): 'jwt' | 'opaque' | 'unknown' {
		if (!token || typeof token !== 'string') {
			return 'unknown';
		}

		// JWT tokens have 3 parts separated by dots
		const parts = token.split('.');
		if (parts.length === 3) {
			try {
				// Try to decode the header to verify it's a JWT
				const header = JSON.parse(atob(parts[0]));
				if (header.typ === 'JWT' || header.alg) {
					return 'jwt';
				}
			} catch (_error) {
				// Not a valid JWT
			}
		}

		// Check if it looks like an opaque token (alphanumeric, longer than 20 chars)
		if (token.length > 20 && /^[a-zA-Z0-9\-_]+$/.test(token)) {
			return 'opaque';
		}

		return 'unknown';
	}

	// Analyze JWT token
	private analyzeJWTToken(token: string, result: TokenAnalysisResult): void {
		try {
			const parts = token.split('.');
			if (parts.length !== 3) {
				result.validationErrors.push({
					field: 'format',
					error: 'Invalid JWT format',
					expected: '3 parts separated by dots',
					actual: `${parts.length} parts`,
					severity: 'critical',
				});
				return;
			}

			// Decode header
			const header = JSON.parse(atob(parts[0]));
			const payload = JSON.parse(atob(parts[1]));

			// Analyze header
			this.analyzeJWTHeader(header, result);

			// Analyze payload
			this.analyzeJWTPayload(payload, result);

			// Check signature (basic validation)
			this.validateJWTSignature(parts, result);

			result.isValid = result.validationErrors.length === 0;
			result.format = 'jwt';
		} catch (_error) {
			result.validationErrors.push({
				field: 'jwt',
				error: 'JWT parsing failed',
				severity: 'critical',
			});
		}
	}

	// Analyze JWT header
	private analyzeJWTHeader(header: Record<string, unknown>, result: TokenAnalysisResult): void {
		// Check algorithm
		if (!header.alg) {
			result.validationErrors.push({
				field: 'header.alg',
				error: 'Missing algorithm',
				severity: 'critical',
			});
		} else {
			// Check for weak algorithms
			const weakAlgorithms = ['none', 'HS256'];
			if (weakAlgorithms.includes(header.alg)) {
				result.securityIssues.push({
					type: 'weak_algorithm',
					severity: header.alg === 'none' ? 'critical' : 'medium',
					description: `Weak algorithm: ${header.alg}`,
					recommendation: 'Use RS256 or stronger algorithm',
					evidence: header.alg,
				});
			}
		}

		// Check type
		if (header.typ && header.typ !== 'JWT') {
			result.validationErrors.push({
				field: 'header.typ',
				error: 'Invalid token type',
				expected: 'JWT',
				actual: header.typ,
				severity: 'medium',
			});
		}

		// Check for key ID
		if (!header.kid) {
			result.securityIssues.push({
				type: 'missing_claims',
				severity: 'low',
				description: 'Missing key ID (kid)',
				recommendation: 'Include key ID for key rotation support',
			});
		}
	}

	// Analyze JWT payload
	private analyzeJWTPayload(payload: Record<string, unknown>, result: TokenAnalysisResult): void {
		result.claims = payload;

		// Check expiration
		if (payload.exp && typeof payload.exp === 'number') {
			const expiration = new Date(payload.exp * 1000);
			result.expiration = expiration;

			if (expiration < new Date()) {
				result.securityIssues.push({
					type: 'expired_token',
					severity: 'high',
					description: 'Token has expired',
					recommendation: 'Refresh the token or obtain a new one',
					evidence: expiration.toISOString(),
				});
			}
		} else {
			result.securityIssues.push({
				type: 'missing_claims',
				severity: 'high',
				description: 'Missing expiration claim (exp)',
				recommendation: 'Include expiration claim for security',
			});
		}

		// Check issued at
		if (payload.iat) {
			result.issuedAt = new Date(payload.iat * 1000);
		}

		// Check issuer
		if (payload.iss) {
			result.issuer = payload.iss;
		} else {
			result.securityIssues.push({
				type: 'missing_claims',
				severity: 'medium',
				description: 'Missing issuer claim (iss)',
				recommendation: 'Include issuer claim for validation',
			});
		}

		// Check audience
		if (payload.aud) {
			result.audience = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
		} else {
			result.securityIssues.push({
				type: 'missing_claims',
				severity: 'medium',
				description: 'Missing audience claim (aud)',
				recommendation: 'Include audience claim for validation',
			});
		}

		// Check subject
		if (payload.sub) {
			result.subject = payload.sub;
		}

		// Check scopes
		if (payload.scope) {
			result.scopes = payload.scope.split(' ');
		}

		// Determine token type
		if (payload.token_use === 'access') {
			result.tokenType = 'access_token';
		} else if (payload.token_use === 'refresh') {
			result.tokenType = 'refresh_token';
		} else if (payload.token_use === 'id') {
			result.tokenType = 'id_token';
		} else if (payload.scope) {
			result.tokenType = 'access_token';
		}

		// Check for suspicious claims
		this.checkSuspiciousClaims(payload, result);
	}

	// Check for suspicious claims
	private checkSuspiciousClaims(
		payload: Record<string, unknown>,
		result: TokenAnalysisResult
	): void {
		// Check for admin claims
		if (payload.admin === true || payload.role === 'admin') {
			result.securityIssues.push({
				type: 'suspicious_claims',
				severity: 'medium',
				description: 'Token contains admin privileges',
				recommendation: 'Verify admin access is necessary and properly authorized',
			});
		}

		// Check for overly broad scopes
		if (payload.scope?.includes('*')) {
			result.securityIssues.push({
				type: 'suspicious_claims',
				severity: 'high',
				description: 'Token has wildcard scope',
				recommendation: 'Use specific scopes instead of wildcards',
			});
		}

		// Check for long expiration
		if (payload.exp && payload.iat) {
			const duration = payload.exp - payload.iat;
			if (duration > 86400) {
				// More than 24 hours
				result.securityIssues.push({
					type: 'suspicious_claims',
					severity: 'medium',
					description: 'Token has long expiration time',
					recommendation: 'Consider shorter token lifetimes for better security',
				});
			}
		}
	}

	// Validate JWT signature (basic check)
	private validateJWTSignature(parts: string[], result: TokenAnalysisResult): void {
		// This is a basic validation - in a real implementation, you would verify the signature
		if (parts[2].length < 10) {
			result.securityIssues.push({
				type: 'invalid_signature',
				severity: 'critical',
				description: 'Signature appears to be too short',
				recommendation: 'Verify token signature with proper key',
			});
		}
	}

	// Analyze opaque token
	private analyzeOpaqueToken(token: string, result: TokenAnalysisResult): void {
		result.format = 'opaque';
		result.isValid = true; // Assume valid if it's a reasonable format

		// Check token length
		if (token.length < 32) {
			result.securityIssues.push({
				type: 'weak_key',
				severity: 'medium',
				description: 'Token appears to be too short',
				recommendation: 'Use longer tokens for better security',
			});
		}

		// Check for patterns that might indicate weak generation
		if (token.length < 64) {
			result.securityIssues.push({
				type: 'weak_key',
				severity: 'low',
				description: 'Consider using longer tokens',
				recommendation: 'Use tokens with at least 64 characters',
			});
		}
	}

	// Calculate risk score
	private calculateRiskScore(result: TokenAnalysisResult): number {
		// If token is explicitly marked as invalid, return maximum risk score
		if (result.isValid === false) {
			return 100;
		}

		let score = 0;

		// Check for critical validation errors
		const hasCriticalErrors = result.validationErrors.some(
			(error) => error.severity === 'critical'
		);

		// If there are critical errors, return maximum risk score
		if (hasCriticalErrors) {
			return 100;
		}

		// Base score for validation errors
		result.validationErrors.forEach((error) => {
			switch (error.severity) {
				case 'critical':
					score += 40;
					break;
				case 'high':
					score += 25;
					break;
				case 'medium':
					score += 15;
					break;
				case 'low':
					score += 5;
					break;
			}
		});

		// Add score for security issues
		result.securityIssues.forEach((issue) => {
			switch (issue.severity) {
				case 'critical':
					score += 30;
					break;
				case 'high':
					score += 20;
					break;
				case 'medium':
					score += 10;
					break;
				case 'low':
					score += 3;
					break;
			}
		});

		// Bonus for expired tokens
		if (result.expiration && result.expiration < new Date()) {
			score += 20;
		}

		// Ensure score is between 0 and 100
		return Math.min(Math.max(score, 0), 100);
	}

	// Generate recommendations
	private generateRecommendations(result: TokenAnalysisResult): string[] {
		const recommendations: string[] = [];

		if (result.securityIssues.length > 0) {
			recommendations.push('Address security issues identified in the analysis');
		}

		if (result.validationErrors.length > 0) {
			recommendations.push('Fix validation errors before using the token');
		}

		if (result.riskScore > 70) {
			recommendations.push('High risk score - consider refreshing the token');
		}

		if (result.format === 'jwt' && !result.expiration) {
			recommendations.push('Add expiration claim to the token');
		}

		if (result.format === 'jwt' && !result.issuer) {
			recommendations.push('Add issuer claim to the token');
		}

		if (result.format === 'jwt' && !result.audience) {
			recommendations.push('Add audience claim to the token');
		}

		return recommendations;
	}

	// Perform security analysis
	public performSecurityAnalysis(token: string): TokenSecurityAnalysis {
		const analysis = this.analyzeToken(token);
		const result: TokenSecurityAnalysis = {
			overallScore: 0,
			algorithmSecurity: 0,
			keySecurity: 0,
			claimSecurity: 0,
			transportSecurity: 0,
			lifecycleSecurity: 0,
			issues: [],
			recommendations: [],
		};

		// If token is invalid, return minimum scores
		if (!analysis.isValid) {
			result.overallScore = 0;
			result.algorithmSecurity = 0;
			result.keySecurity = 0;
			result.claimSecurity = 0;
			result.transportSecurity = 0;
			result.lifecycleSecurity = 0;
			result.issues = [
				{
					type: 'invalid_signature',
					severity: 'critical',
					description: 'Token validation failed',
					recommendation: 'Use a valid token',
				},
			];
			result.recommendations = [
				'The provided token is invalid. Please check the token and try again.',
			];
			return result;
		}
		return 100;
	}
}

// Create global token analyzer instance
export const tokenAnalyzer = TokenAnalyzer.getInstance();

// Utility functions
export const analyzeToken = (token: string): TokenAnalysisResult => {
	return tokenAnalyzer.analyzeToken(token);
};

export const getTokenRefreshInfo = (token: string, refreshToken?: string): TokenRefreshInfo => {
	return tokenAnalyzer.getTokenRefreshInfo(token, refreshToken);
};

export const performSecurityAnalysis = (token: string): TokenSecurityAnalysis => {
	return tokenAnalyzer.performSecurityAnalysis(token);
};

export default tokenAnalyzer;
