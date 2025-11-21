// src/services/advancedSecuritySettingsService.ts
// Service for managing advanced security settings for OAuth/OIDC applications

import { logger } from '../utils/logger';

export interface AdvancedSecuritySettings {
	// Request Parameter Signature
	requestParameterSignature: 'default' | 'require_signed' | 'allow_unsigned';

	// JWT Token Settings
	includeX5tParameter: boolean;

	// Scope Management
	requestScopesForMultipleResources: boolean;

	// Token Security
	additionalRefreshTokenReplayProtection: boolean;

	// Session Management
	openIdConnectSessionManagement: boolean;
	terminateUserSessionByIdToken: boolean;

	// Additional Security Features
	requirePushedAuthorizationRequests?: boolean;
	enforcePKCE?: boolean;
	tokenBindingRequired?: boolean;
	requireClientAuthentication?: boolean;
}

export interface SecuritySettingOption {
	id: string;
	label: string;
	description: string;
	options?: Array<{
		value: string;
		label: string;
		description: string;
	}>;
	type: 'checkbox' | 'dropdown' | 'toggle';
	category: 'authentication' | 'authorization' | 'session' | 'token' | 'request';
	recommended?: boolean;
	securityLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface SecurityCategory {
	id: string;
	name: string;
	description: string;
	icon: string;
	settings: SecuritySettingOption[];
}

class AdvancedSecuritySettingsService {
	private readonly STORAGE_KEY = 'pingone_advanced_security_settings';
	private cache: AdvancedSecuritySettings | null = null;
	private cacheTimestamp: number = 0;
	private readonly CACHE_DURATION = 300000; // 5 minutes

	/**
	 * Get all available security settings with their options
	 */
	getAvailableSettings(): SecurityCategory[] {
		return [
			{
				id: 'authentication',
				name: 'Authentication Security',
				description: 'Configure authentication methods and security requirements',
				icon: '🔐',
				settings: [
					{
						id: 'requestParameterSignature',
						label: 'Request Parameter Signature',
						description:
							'Controls whether request parameters must be cryptographically signed for enhanced security and integrity.',
						type: 'dropdown',
						category: 'authentication',
						securityLevel: 'high',
						options: [
							{
								value: 'default',
								label: 'Default',
								description: "Uses PingOne's default signature requirements",
							},
							{
								value: 'require_signed',
								label: 'Require Signed',
								description: 'All requests must include valid signatures',
								recommended: true,
							},
							{
								value: 'allow_unsigned',
								label: 'Allow Unsigned',
								description: 'Permits requests without signatures (less secure)',
							},
						],
					},
					{
						id: 'includeX5tParameter',
						label: 'Include x5t Parameter',
						description:
							'Includes the x5t (X.509 certificate thumbprint) parameter in JWT tokens for certificate-based authentication validation.',
						type: 'checkbox',
						category: 'authentication',
						securityLevel: 'medium',
						recommended: true,
					},
					{
						id: 'requireClientAuthentication',
						label: 'Require Client Authentication',
						description:
							'Enforces that all clients must authenticate using supported methods (client_secret_basic, client_secret_post, etc.)',
						type: 'checkbox',
						category: 'authentication',
						securityLevel: 'high',
						recommended: true,
					},
				],
			},
			{
				id: 'authorization',
				name: 'Authorization & Scopes',
				description: 'Manage authorization flows and scope permissions',
				icon: '🛡️',
				settings: [
					{
						id: 'requestScopesForMultipleResources',
						label: 'Request Scopes for Multiple Resources',
						description:
							'Allows requesting permissions across multiple resource servers in a single authorization request, useful for microservices architectures.',
						type: 'checkbox',
						category: 'authorization',
						securityLevel: 'medium',
					},
					{
						id: 'enforcePKCE',
						label: 'Enforce PKCE (Proof Key for Code Exchange)',
						description:
							'Requires PKCE for all authorization code flows to prevent authorization code interception attacks.',
						type: 'checkbox',
						category: 'authorization',
						securityLevel: 'high',
						recommended: true,
					},
				],
			},
			{
				id: 'session',
				name: 'Session Management',
				description: 'Configure user session handling and security',
				icon: '👤',
				settings: [
					{
						id: 'openIdConnectSessionManagement',
						label: 'OpenID Connect Session Management',
						description:
							'Enables OIDC session management features including session state and logout functionality for better user session handling.',
						type: 'checkbox',
						category: 'session',
						securityLevel: 'medium',
						recommended: true,
					},
					{
						id: 'terminateUserSessionByIdToken',
						label: 'Terminate User Session by ID Token',
						description:
							'Allows terminating user sessions using the ID token, providing a way to logout users across all applications.',
						type: 'checkbox',
						category: 'session',
						securityLevel: 'high',
						recommended: true,
					},
				],
			},
			{
				id: 'token',
				name: 'Token Security',
				description: 'Configure token security and lifecycle management',
				icon: '🎫',
				settings: [
					{
						id: 'additionalRefreshTokenReplayProtection',
						label: 'Additional Refresh Token Replay Protection',
						description:
							'Prevents refresh tokens from being used multiple times, enhancing security by ensuring each token can only be used once.',
						type: 'checkbox',
						category: 'token',
						securityLevel: 'high',
						recommended: true,
					},
					{
						id: 'tokenBindingRequired',
						label: 'Token Binding Required',
						description:
							'Requires token binding to prevent token theft and replay attacks across different clients.',
						type: 'checkbox',
						category: 'token',
						securityLevel: 'critical',
					},
				],
			},
			{
				id: 'request',
				name: 'Request Security',
				description: 'Configure request-level security features',
				icon: '📡',
				settings: [
					{
						id: 'requirePushedAuthorizationRequests',
						label: 'Require Pushed Authorization Requests (PAR)',
						description:
							'Forces all authorization requests to use PAR, preventing request parameter leakage and improving security.',
						type: 'checkbox',
						category: 'request',
						securityLevel: 'high',
						recommended: true,
					},
				],
			},
		];
	}

	/**
	 * Get current security settings
	 */
	getCurrentSettings(): AdvancedSecuritySettings {
		// Check cache first
		const now = Date.now();
		if (this.cache && now - this.cacheTimestamp < this.CACHE_DURATION) {
			return this.cache;
		}

		try {
			const stored = localStorage.getItem(this.STORAGE_KEY);
			if (stored) {
				const parsed = JSON.parse(stored);
				this.cache = parsed;
				this.cacheTimestamp = now;
				logger.info('AdvancedSecuritySettings', 'Loaded settings from storage', parsed);
				return parsed;
			}
		} catch (error) {
			logger.warn('AdvancedSecuritySettings', 'Failed to load settings from storage', error);
		}

		// Return default settings
		const defaultSettings: AdvancedSecuritySettings = {
			requestParameterSignature: 'default',
			includeX5tParameter: false,
			requestScopesForMultipleResources: false,
			additionalRefreshTokenReplayProtection: false,
			openIdConnectSessionManagement: false,
			terminateUserSessionByIdToken: true, // Default to true for security
			requirePushedAuthorizationRequests: false,
			enforcePKCE: false,
			tokenBindingRequired: false,
			requireClientAuthentication: false,
		};

		this.cache = defaultSettings;
		this.cacheTimestamp = now;
		return defaultSettings;
	}

	/**
	 * Update security settings
	 */
	updateSettings(settings: Partial<AdvancedSecuritySettings>): boolean {
		try {
			const currentSettings = this.getCurrentSettings();
			const updatedSettings = { ...currentSettings, ...settings };

			localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedSettings));

			// Update cache
			this.cache = updatedSettings;
			this.cacheTimestamp = Date.now();

			logger.success('AdvancedSecuritySettings', 'Settings updated successfully', updatedSettings);
			return true;
		} catch (error) {
			logger.error('AdvancedSecuritySettings', 'Failed to update settings', error);
			return false;
		}
	}

	/**
	 * Reset to default settings
	 */
	resetToDefaults(): boolean {
		try {
			localStorage.removeItem(this.STORAGE_KEY);
			this.cache = null;
			this.cacheTimestamp = 0;

			logger.info('AdvancedSecuritySettings', 'Settings reset to defaults');
			return true;
		} catch (error) {
			logger.error('AdvancedSecuritySettings', 'Failed to reset settings', error);
			return false;
		}
	}

	/**
	 * Get security level assessment
	 */
	getSecurityLevelAssessment(): {
		overall: 'low' | 'medium' | 'high' | 'critical';
		score: number;
		recommendations: string[];
		warnings: string[];
	} {
		const settings = this.getCurrentSettings();
		const categories = this.getAvailableSettings();

		let score = 0;
		let maxScore = 0;
		const recommendations: string[] = [];
		const warnings: string[] = [];

		categories.forEach((category) => {
			category.settings.forEach((setting) => {
				maxScore += this.getSecurityLevelWeight(setting.securityLevel);

				const key = setting.id as keyof AdvancedSecuritySettings;
				const currentValue = settings[key];

				if (setting.type === 'checkbox') {
					if (currentValue === true) {
						score += this.getSecurityLevelWeight(setting.securityLevel);
					} else if (setting.recommended) {
						recommendations.push(`Enable "${setting.label}" for enhanced security`);
					}
				} else if (setting.type === 'dropdown') {
					const option = setting.options?.find((opt) => opt.value === currentValue);
					if (option?.recommended) {
						score += this.getSecurityLevelWeight(setting.securityLevel);
					} else if (setting.securityLevel === 'high' || setting.securityLevel === 'critical') {
						recommendations.push(`Consider using "${setting.label}" for better security`);
					}
				}
			});
		});

		const percentage = Math.round((score / maxScore) * 100);

		let overall: 'low' | 'medium' | 'high' | 'critical';
		if (percentage >= 80) overall = 'critical';
		else if (percentage >= 60) overall = 'high';
		else if (percentage >= 40) overall = 'medium';
		else overall = 'low';

		// Add specific warnings
		if (!settings.terminateUserSessionByIdToken) {
			warnings.push(
				'Session termination by ID token is disabled - this may impact logout functionality'
			);
		}

		if (settings.requestParameterSignature === 'allow_unsigned') {
			warnings.push('Allowing unsigned requests reduces security - consider requiring signatures');
		}

		return {
			overall,
			score: percentage,
			recommendations,
			warnings,
		};
	}

	/**
	 * Get security level weight for scoring
	 */
	private getSecurityLevelWeight(level: 'low' | 'medium' | 'high' | 'critical'): number {
		switch (level) {
			case 'low':
				return 1;
			case 'medium':
				return 2;
			case 'high':
				return 3;
			case 'critical':
				return 4;
			default:
				return 1;
		}
	}

	/**
	 * Export settings for backup
	 */
	exportSettings(): string {
		const settings = this.getCurrentSettings();
		return JSON.stringify(
			{
				settings,
				timestamp: new Date().toISOString(),
				version: '1.0.0',
			},
			null,
			2
		);
	}

	/**
	 * Import settings from backup
	 */
	importSettings(settingsJson: string): boolean {
		try {
			const parsed = JSON.parse(settingsJson);
			if (parsed.settings) {
				return this.updateSettings(parsed.settings);
			}
			return false;
		} catch (error) {
			logger.error('AdvancedSecuritySettings', 'Failed to import settings', error);
			return false;
		}
	}
}

export const advancedSecuritySettingsService = new AdvancedSecuritySettingsService();
