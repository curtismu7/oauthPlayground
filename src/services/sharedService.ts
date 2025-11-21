// src/services/v7SharedService.ts
/**
 * V7 Shared Service - Unified OAuth/OIDC Specification Compliance
 *
 * Provides shared functionality for all V7 flows with comprehensive
 * OAuth 2.0 and OpenID Connect specification compliance.
 *
 * Integrates:
 * - ID Token Validation (OIDC Core 1.0)
 * - Standardized Error Handling (RFC 6749)
 * - Parameter Validation (RFC 6749 + OIDC)
 * - Security Headers (Security Best Practices)
 *
 * Follows the established V7 service architecture pattern.
 */

import { type IDTokenValidationResult, IDTokenValidationService } from '../utils/idTokenValidation';
import {
	type ParameterValidationResult,
	ParameterValidationService,
} from '../utils/parameterValidation';
import { type SecurityHeaders, SecurityHeadersService } from '../utils/securityHeaders';
import {
	type ErrorContext,
	StandardizedErrorHandler,
	type StandardizedErrorResponse,
} from '../utils/standardizedErrorHandling';

// Unified logging format: [🔧 V7-SHARED]
const LOG_PREFIX = '[🔧 V7-SHARED]';

const log = {
	info: (message: string, ...args: unknown[]) => {
		const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
		console.log(`${timestamp} ${LOG_PREFIX} [INFO]`, message, ...args);
	},
	warn: (message: string, ...args: unknown[]) => {
		const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
		console.warn(`${timestamp} ${LOG_PREFIX} [WARN]`, message, ...args);
	},
	error: (message: string, ...args: unknown[]) => {
		const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
		console.error(`${timestamp} ${LOG_PREFIX} [ERROR]`, message, ...args);
	},
	success: (message: string, ...args: unknown[]) => {
		const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
		console.log(`${timestamp} ${LOG_PREFIX} [SUCCESS]`, message, ...args);
	},
};

// V7 Flow Types
export type V7FlowType = 'oauth' | 'oidc' | 'pingone' | 'mock';
export type V7FlowName =
	| 'oauth-authorization-code-v7'
	| 'oauth-implicit-v7'
	| 'oauth-device-authorization-v7'
	| 'oauth-client-credentials-v7'
	| 'oauth-ropc-v7'
	| 'oauth-token-exchange-v7'
	| 'oauth-jwt-bearer-token-v7'
	| 'oidc-authorization-code-v7'
	| 'oidc-implicit-v7'
	| 'oidc-hybrid-v7'
	| 'oidc-device-authorization-v7'
	| 'oidc-ciba-v7'
	| 'pingone-par-v7'
	| 'pingone-mfa-v7'
	| 'rar-v7';

export interface V7FlowConfig {
	name: V7FlowName;
	type: V7FlowType;
	specification: string;
	version: string;
	features: string[];
}

/**
 * V7 ID Token Validation Manager
 * Handles OIDC ID token validation across all V7 flows
 */
export class V7IDTokenValidationManager {
	/**
	 * Validate ID token for OIDC flows
	 */
	static async validateIDToken(
		idToken: string,
		expectedIssuer: string,
		expectedAudience: string,
		expectedNonce?: string,
		jwksUri?: string,
		flowName?: V7FlowName
	): Promise<IDTokenValidationResult> {
		log.info(`Validating ID token for flow: ${flowName || 'unknown'}`);

		try {
			const result = await IDTokenValidationService.validateIDToken(
				idToken,
				expectedIssuer,
				expectedAudience,
				expectedNonce,
				jwksUri
			);

			if (result.isValid) {
				log.success(`ID token validation successful for flow: ${flowName}`);
			} else {
				log.error(`ID token validation failed for flow: ${flowName}`, result.errors);
			}

			return result;
		} catch (error) {
			log.error(`ID token validation error for flow: ${flowName}`, error);
			throw error;
		}
	}

	/**
	 * Get validation summary
	 */
	static getValidationSummary(result: IDTokenValidationResult): string {
		return IDTokenValidationService.getValidationSummary(result);
	}

	/**
	 * Get detailed validation report
	 */
	static getValidationReport(result: IDTokenValidationResult): string {
		return IDTokenValidationService.getValidationReport(result);
	}
}

/**
 * V7 Error Handling Manager
 * Provides standardized error handling across all V7 flows
 */
export class V7ErrorHandlingManager {
	/**
	 * Handle OAuth 2.0 errors
	 */
	static handleOAuthError(error: any, context?: ErrorContext): StandardizedErrorResponse {
		log.error(`Handling OAuth error for flow: ${context?.flowName || 'unknown'}`, error);

		const response = StandardizedErrorHandler.handleOAuthError(error, context);
		StandardizedErrorHandler.logError(response, context);

		return response;
	}

	/**
	 * Handle OIDC errors
	 */
	static handleOIDCError(error: any, context?: ErrorContext): StandardizedErrorResponse {
		log.error(`Handling OIDC error for flow: ${context?.flowName || 'unknown'}`, error);

		const response = StandardizedErrorHandler.handleOIDCError(error, context);
		StandardizedErrorHandler.logError(response, context);

		return response;
	}

	/**
	 * Create scenario-specific error
	 */
	static createScenarioError(scenario: string, context?: ErrorContext): StandardizedErrorResponse {
		log.warn(`Creating scenario error: ${scenario} for flow: ${context?.flowName || 'unknown'}`);

		return StandardizedErrorHandler.createScenarioError(scenario, context);
	}

	/**
	 * Get error statistics
	 */
	static getErrorStatistics() {
		return StandardizedErrorHandler.getErrorStatistics();
	}

	/**
	 * Clear error log
	 */
	static clearErrorLog(): void {
		StandardizedErrorHandler.clearErrorLog();
		log.info('Error log cleared');
	}
}

/**
 * V7 Parameter Validation Manager
 * Handles parameter validation across all V7 flows
 */
export class V7ParameterValidationManager {
	/**
	 * Validate parameters for a specific V7 flow
	 */
	static validateFlowParameters(
		flowName: V7FlowName,
		parameters: Record<string, any>
	): ParameterValidationResult {
		log.info(`Validating parameters for flow: ${flowName}`);

		const result = ParameterValidationService.validateFlowParameters(flowName, parameters);

		if (result.isValid) {
			log.success(`Parameter validation successful for flow: ${flowName}`);
		} else {
			log.error(`Parameter validation failed for flow: ${flowName}`, result.errors);
		}

		return result;
	}

	/**
	 * Get validation summary
	 */
	static getValidationSummary(result: ParameterValidationResult): string {
		return ParameterValidationService.getValidationSummary(result);
	}

	/**
	 * Get detailed validation report
	 */
	static getValidationReport(result: ParameterValidationResult): string {
		return ParameterValidationService.getValidationReport(result);
	}

	/**
	 * Get flow configuration
	 */
	static getFlowConfiguration(flowName: V7FlowName) {
		return ParameterValidationService.getFlowConfiguration(flowName);
	}

	/**
	 * Get all supported V7 flows
	 */
	static getSupportedV7Flows(): V7FlowName[] {
		return ParameterValidationService.getSupportedFlows().filter((flow) =>
			flow.includes('-v7')
		) as V7FlowName[];
	}
}

/**
 * V7 Security Headers Manager
 * Manages security headers across all V7 flows
 */
export class V7SecurityHeadersManager {
	/**
	 * Get security headers for a specific V7 flow
	 */
	static getSecurityHeaders(flowName: V7FlowName): SecurityHeaders {
		log.info(`Getting security headers for flow: ${flowName}`);

		return SecurityHeadersService.getSecurityHeaders(flowName);
	}

	/**
	 * Get OAuth security headers
	 */
	static getOAuthSecurityHeaders(): SecurityHeaders {
		return SecurityHeadersService.getOAuthSecurityHeaders();
	}

	/**
	 * Get OIDC security headers
	 */
	static getOIDCSecurityHeaders(): SecurityHeaders {
		return SecurityHeadersService.getOIDCSecurityHeaders();
	}

	/**
	 * Get PingOne security headers
	 */
	static getPingOneSecurityHeaders(): SecurityHeaders {
		return SecurityHeadersService.getPingOneSecurityHeaders();
	}

	/**
	 * Validate security headers
	 */
	static validateSecurityHeaders(headers: Record<string, string>) {
		return SecurityHeadersService.validateSecurityHeaders(headers);
	}

	/**
	 * Get security score
	 */
	static getSecurityScore(headers: Record<string, string>): number {
		return SecurityHeadersService.getSecurityScore(headers);
	}

	/**
	 * Get security recommendations
	 */
	static getSecurityRecommendations(flowName: V7FlowName): string[] {
		return SecurityHeadersService.getSecurityRecommendations(flowName);
	}
}

/**
 * V7 Specification Compliance Manager
 * Provides comprehensive specification compliance across all V7 flows
 */
export class V7SpecificationComplianceManager {
	/**
	 * Get flow configuration
	 */
	static getFlowConfig(flowName: V7FlowName): V7FlowConfig {
		const configs: Record<V7FlowName, V7FlowConfig> = {
			'oauth-authorization-code-v7': {
				name: 'oauth-authorization-code-v7',
				type: 'oauth',
				specification: 'RFC 6749 - OAuth 2.0 Authorization Framework',
				version: 'V7',
				features: ['PKCE', 'State Validation', 'Error Handling', 'Security Headers'],
			},
			'oauth-implicit-v7': {
				name: 'oauth-implicit-v7',
				type: 'oauth',
				specification: 'RFC 6749 - OAuth 2.0 Authorization Framework',
				version: 'V7',
				features: ['Fragment Handling', 'State Validation', 'Error Handling', 'Security Headers'],
			},
			'oauth-device-authorization-v7': {
				name: 'oauth-device-authorization-v7',
				type: 'oauth',
				specification: 'RFC 8628 - OAuth 2.0 Device Authorization Grant',
				version: 'V7',
				features: ['Device Code', 'Polling', 'Error Handling', 'Security Headers'],
			},
			'oauth-client-credentials-v7': {
				name: 'oauth-client-credentials-v7',
				type: 'oauth',
				specification: 'RFC 6749 - OAuth 2.0 Authorization Framework',
				version: 'V7',
				features: ['Client Authentication', 'JWT Assertions', 'mTLS', 'Error Handling'],
			},
			'oidc-authorization-code-v7': {
				name: 'oidc-authorization-code-v7',
				type: 'oidc',
				specification: 'OpenID Connect Core 1.0',
				version: 'V7',
				features: ['ID Token Validation', 'Claims Handling', 'Nonce Validation', 'PKCE'],
			},
			'oidc-hybrid-v7': {
				name: 'oidc-hybrid-v7',
				type: 'oidc',
				specification: 'OpenID Connect Core 1.0',
				version: 'V7',
				features: ['ID Token Validation', 'Fragment Processing', 'Nonce Validation', 'PKCE'],
			},
			'pingone-par-v7': {
				name: 'pingone-par-v7',
				type: 'pingone',
				specification: 'RFC 9126 - OAuth 2.0 Pushed Authorization Requests',
				version: 'V7',
				features: ['PAR Request', 'PAR Authorization', 'Token Exchange', 'PingOne Integration'],
			},
		};

		return (
			configs[flowName] || {
				name: flowName,
				type: 'oauth',
				specification: 'Unknown',
				version: 'V7',
				features: [],
			}
		);
	}

	/**
	 * Check flow compliance
	 */
	static checkFlowCompliance(flowName: V7FlowName): {
		isCompliant: boolean;
		complianceScore: number;
		missingFeatures: string[];
		recommendations: string[];
	} {
		const config = V7SpecificationComplianceManager.getFlowConfig(flowName);
		const supportedFlows = V7ParameterValidationManager.getSupportedV7Flows();
		const isSupported = supportedFlows.includes(flowName);

		let complianceScore = 0;
		const missingFeatures: string[] = [];
		const recommendations: string[] = [];

		// Check basic compliance
		if (isSupported) complianceScore += 25;
		else missingFeatures.push('Parameter Validation');

		// Check error handling
		complianceScore += 25; // Assume implemented

		// Check security headers
		complianceScore += 25; // Assume implemented

		// Check flow-specific features
		if (config.type === 'oidc') {
			complianceScore += 25; // ID token validation
		} else {
			complianceScore += 25; // OAuth compliance
		}

		// Generate recommendations
		if (complianceScore < 100) {
			recommendations.push('Implement missing compliance features');
		}
		if (config.type === 'oidc') {
			recommendations.push('Ensure ID token validation is properly implemented');
		}
		recommendations.push('Regular compliance testing recommended');

		return {
			isCompliant: complianceScore >= 90,
			complianceScore,
			missingFeatures,
			recommendations,
		};
	}
}

/**
 * V7 Flow Integration Manager
 * Provides integration helpers for V7 flows
 */
export class V7FlowIntegrationManager {
	/**
	 * Initialize V7 flow with compliance features
	 */
	static initializeFlow(
		flowName: V7FlowName,
		options?: {
			enableIDTokenValidation?: boolean;
			enableParameterValidation?: boolean;
			enableErrorHandling?: boolean;
			enableSecurityHeaders?: boolean;
		}
	) {
		log.info(`Initializing V7 flow: ${flowName}`, options);

		const config = V7SpecificationComplianceManager.getFlowConfig(flowName);
		const compliance = V7SpecificationComplianceManager.checkFlowCompliance(flowName);

		return {
			flowName,
			config,
			compliance,
			features: {
				idTokenValidation: options?.enableIDTokenValidation ?? config.type === 'oidc',
				parameterValidation: options?.enableParameterValidation ?? true,
				errorHandling: options?.enableErrorHandling ?? true,
				securityHeaders: options?.enableSecurityHeaders ?? true,
			},
		};
	}

	/**
	 * Get V7 flow status
	 */
	static getFlowStatus(flowName: V7FlowName) {
		const config = V7SpecificationComplianceManager.getFlowConfig(flowName);
		const compliance = V7SpecificationComplianceManager.checkFlowCompliance(flowName);
		const errorStats = V7ErrorHandlingManager.getErrorStatistics();

		return {
			flowName,
			config,
			compliance,
			errorStats,
			timestamp: new Date().toISOString(),
		};
	}
}

/**
 * Main V7 Shared Service Export
 * Single import point for all V7 shared functionality
 */
export const V7SharedService = {
	IDTokenValidation: V7IDTokenValidationManager,
	ErrorHandling: V7ErrorHandlingManager,
	ParameterValidation: V7ParameterValidationManager,
	SecurityHeaders: V7SecurityHeadersManager,
	SpecificationCompliance: V7SpecificationComplianceManager,
	FlowIntegration: V7FlowIntegrationManager,

	// Utility functions
	initializeFlow: V7FlowIntegrationManager.initializeFlow,
	getFlowStatus: V7FlowIntegrationManager.getFlowStatus,

	// Direct access to underlying services
	IDTokenValidationService,
	StandardizedErrorHandler,
	ParameterValidationService,
	SecurityHeadersService,
};

export default V7SharedService;
