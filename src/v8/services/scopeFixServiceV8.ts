/**
 * @file scopeFixServiceV8.ts
 * @module v8/services
 * @description Service to help users fix scope configuration issues in PingOne
 * @version 8.0.0
 * @since 2024-11-16
 */

export interface ScopeFixOptions {
	currentScopes: string;
	flowType: 'client-credentials' | 'oauth' | 'oidc';
	environmentId?: string;
	applicationId?: string;
}

export interface ScopeFixResult {
	fixedScopes: string;
	reason: string;
	requiresPingOneConfig: boolean;
	pingOneInstructions?: string;
}

/**
 * Service to help fix scope configuration issues
 */
export class ScopeFixServiceV8 {
	/**
	 * Analyze and fix scope configuration issues
	 */
	static analyzeAndFixScopes(options: ScopeFixOptions): ScopeFixResult {
		const { currentScopes, flowType, environmentId, applicationId } = options;
		const scopesList = currentScopes.split(/\s+/).filter((s) => s.trim());

		// Client Credentials flow specific fixes
		if (flowType === 'client-credentials') {
			return ScopeFixServiceV8.fixClientCredentialsScopes(scopesList, environmentId, applicationId);
		}

		// OAuth/OIDC flow specific fixes
		return ScopeFixServiceV8.fixOAuthScopes(scopesList, flowType);
	}

	/**
	 * Fix client credentials flow scopes
	 */
	private static fixClientCredentialsScopes(
		scopesList: string[],
		environmentId?: string,
		applicationId?: string
	): ScopeFixResult {
		// Check for invalid OIDC scopes
		const invalidOidcScopes = scopesList.filter((scope) =>
			['openid', 'profile', 'email', 'address', 'phone', 'offline_access'].includes(scope)
		);

		// Check for invalid self-management scopes
		const invalidSelfMgmtScopes = scopesList.filter(
			(scope) => scope.startsWith('p1:') || scope.startsWith('pingone:')
		);

		// If there are invalid scopes, suggest replacements
		if (invalidOidcScopes.length > 0 || invalidSelfMgmtScopes.length > 0) {
			const validScopes = scopesList.filter(
				(scope) => !invalidOidcScopes.includes(scope) && !invalidSelfMgmtScopes.includes(scope)
			);

			// Suggest default resource server scopes if no valid ones remain
			const suggestedScopes =
				validScopes.length > 0 ? validScopes.join(' ') : 'ClaimScope my-api:read';

			return {
				fixedScopes: suggestedScopes,
				reason: `Removed invalid scopes (${[...invalidOidcScopes, ...invalidSelfMgmtScopes].join(', ')}) and suggested resource server scopes`,
				requiresPingOneConfig: true,
				pingOneInstructions: ScopeFixServiceV8.generatePingOneInstructions(
					environmentId,
					applicationId,
					suggestedScopes
				),
			};
		}

		// Check if using CLAIMICFACILITY (which may not exist)
		if (scopesList.includes('CLAIMICFACILITY')) {
			return {
				fixedScopes: 'ClaimScope',
				reason:
					'CLAIMICFACILITY is not a default scope. Suggested ClaimScope as a common resource server scope.',
				requiresPingOneConfig: true,
				pingOneInstructions: ScopeFixServiceV8.generatePingOneInstructions(
					environmentId,
					applicationId,
					'ClaimScope'
				),
			};
		}

		return {
			fixedScopes: scopesList.join(' '),
			reason: 'Scopes appear to be correctly configured for client credentials flow',
			requiresPingOneConfig: false,
		};
	}

	/**
	 * Fix OAuth/OIDC flow scopes
	 */
	private static fixOAuthScopes(scopesList: string[], flowType: string): ScopeFixResult {
		// For OAuth/OIDC flows, ensure 'openid' is included for OIDC
		if (flowType === 'oidc' && !scopesList.includes('openid')) {
			const fixedScopes = ['openid', ...scopesList].join(' ');
			return {
				fixedScopes,
				reason: 'Added "openid" scope for OIDC flow',
				requiresPingOneConfig: false,
			};
		}

		return {
			fixedScopes: scopesList.join(' '),
			reason: 'Scopes appear to be correctly configured for OAuth/OIDC flow',
			requiresPingOneConfig: false,
		};
	}

	/**
	 * Generate PingOne configuration instructions
	 */
	private static generatePingOneInstructions(
		_environmentId?: string,
		applicationId?: string,
		suggestedScopes?: string
	): string {
		let instructions = '';

		instructions += '🔧 Quick Fix: Configure Resource Server Scopes in PingOne\n\n';
		instructions += 'Step 1: Create Resource Server\n';
		instructions += '1. Go to https://admin.pingone.com\n';
		instructions += '2. Navigate to: Resources → Resource Servers\n';
		instructions += '3. Click "Add Resource Server"\n';
		instructions += '4. Name: "My API Server"\n';
		instructions += '5. Click "Save"\n\n';

		instructions += 'Step 2: Add Scopes\n';
		if (suggestedScopes) {
			const scopeList = suggestedScopes.split(/\s+/).filter((s) => s.trim());
			scopeList.forEach((scope, index) => {
				instructions += `${index + 1}. Add scope: "${scope}"\n`;
			});
		} else {
			instructions += '1. Add scope: "ClaimScope"\n';
			instructions += '2. Add scope: "my-api:read"\n';
		}
		instructions += '\n';

		instructions += 'Step 3: Enable for Application\n';
		instructions += '1. Go to Applications → Your Application';
		if (applicationId) {
			instructions += ` (${applicationId.substring(0, 8)}...)`;
		}
		instructions += '\n';
		instructions += '2. Click "Resources" tab\n';
		instructions += '3. Enable your resource server\n';
		instructions += '4. Check the scopes you added\n';
		instructions += '5. Click "Save"\n\n';

		instructions += 'Step 4: Update This App\n';
		instructions += 'Use the scope name in the Scopes field above and try again.';

		return instructions;
	}

	/**
	 * Get recommended default scopes for flow type
	 */
	static getRecommendedScopes(flowType: string): string[] {
		switch (flowType) {
			case 'client-credentials':
				return ['ClaimScope', 'my-api:read'];
			case 'oidc':
				return ['openid', 'profile', 'email'];
			case 'oauth':
				return ['openid', 'profile'];
			default:
				return ['openid'];
		}
	}

	/**
	 * Validate if scopes are appropriate for flow type
	 */
	static validateScopesForFlow(
		scopes: string[],
		flowType: string
	): {
		isValid: boolean;
		issues: string[];
		suggestions: string[];
	} {
		const issues: string[] = [];
		const suggestions: string[] = [];

		if (flowType === 'client-credentials') {
			// Check for OIDC scopes
			const oidcScopes = scopes.filter((scope) =>
				['openid', 'profile', 'email', 'address', 'phone', 'offline_access'].includes(scope)
			);
			if (oidcScopes.length > 0) {
				issues.push(`OIDC scopes not allowed: ${oidcScopes.join(', ')}`);
				suggestions.push('Use resource server scopes like "ClaimScope" or "custom:read"');
			}

			// Check for self-management scopes
			const selfMgmtScopes = scopes.filter((scope) => scope.startsWith('p1:'));
			if (selfMgmtScopes.length > 0) {
				issues.push(`Self-management scopes not allowed: ${selfMgmtScopes.join(', ')}`);
				suggestions.push('Use resource server scopes instead of p1: scopes');
			}
		}

		if (flowType === 'oidc' && !scopes.includes('openid')) {
			issues.push('Missing "openid" scope for OIDC flow');
			suggestions.push('Add "openid" to your scopes');
		}

		return {
			isValid: issues.length === 0,
			issues,
			suggestions,
		};
	}
}

export default ScopeFixServiceV8;
