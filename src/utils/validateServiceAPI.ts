// src/utils/validateServiceAPI.ts
/**
 * Service API Validation Script
 *
 * This script validates that the ComprehensiveFlowDataService API interface
 * is rock solid and ready for production use.
 */

import type { FlowSpecificCredentials } from '../services/comprehensiveFlowDataService';
import { comprehensiveFlowDataService } from '../services/comprehensiveFlowDataService';

import { logger } from '../utils/logger';
export const validateServiceAPI = (): {
	success: boolean;
	issues: string[];
	summary: string;
} => {
	logger.info('🔍 [API VALIDATION] Validating ComprehensiveFlowDataService API Interface', "Logger info");

	const issues: string[] = [];

	// Test 1: Validate all required methods exist
	const requiredMethods = [
		'saveFlowCredentialsIsolated',
		'loadFlowCredentialsIsolated',
		'saveFlowDataComprehensive',
		'loadFlowDataComprehensive',
		'testCredentialIsolation',
		'backupCredentialsToEnv',
		'restoreCredentialsFromEnv',
		'auditAllFlowData',
		'clearFlowData',
		'clearAllFlowData',
		'clearAllSharedData',
	];

	requiredMethods.forEach((method) => {
		if (typeof comprehensiveFlowDataService[method] !== 'function') {
			issues.push(`Missing required method: ${method}`);
		}
	});

	// Test 2: Validate method signatures
	try {
		// Test saveFlowCredentialsIsolated signature
		const testCreds: FlowSpecificCredentials = {
			clientId: 'test',
			clientSecret: 'test',
			redirectUri: 'https://test.com',
			scopes: ['openid'],
			lastUpdated: Date.now(),
		};

		// Should not throw
		comprehensiveFlowDataService.saveFlowCredentialsIsolated('api-test', testCreds, {
			showToast: false,
		});
	} catch (error) {
		issues.push(`saveFlowCredentialsIsolated signature issue: ${error}`);
	}

	try {
		// Test loadFlowCredentialsIsolated signature
		comprehensiveFlowDataService.loadFlowCredentialsIsolated('api-test');
	} catch (error) {
		issues.push(`loadFlowCredentialsIsolated signature issue: ${error}`);
	}

	try {
		// Test loadFlowDataComprehensive signature
		comprehensiveFlowDataService.loadFlowDataComprehensive({ flowKey: 'api-test' });
	} catch (error) {
		issues.push(`loadFlowDataComprehensive signature issue: ${error}`);
	}

	try {
		// Test testCredentialIsolation signature
		comprehensiveFlowDataService.testCredentialIsolation('flow1', 'flow2');
	} catch (error) {
		issues.push(`testCredentialIsolation signature issue: ${error}`);
	}

	try {
		// Test auditAllFlowData signature
		comprehensiveFlowDataService.auditAllFlowData();
	} catch (error) {
		issues.push(`auditAllFlowData signature issue: ${error}`);
	}

	// Test 3: Validate return types
	const auditResult = comprehensiveFlowDataService.auditAllFlowData();
	if (typeof auditResult !== 'object' || auditResult === null) {
		issues.push('auditAllFlowData should return an object');
	}

	const isolationResult = comprehensiveFlowDataService.testCredentialIsolation('test1', 'test2');
	if (typeof isolationResult !== 'boolean') {
		issues.push('testCredentialIsolation should return a boolean');
	}

	// Test 4: Validate error handling
	try {
		// Test with invalid flow key
		comprehensiveFlowDataService.saveFlowCredentialsIsolated('', testCreds, { showToast: false });
		// Should handle gracefully, not throw
	} catch (error) {
		issues.push(`Error handling issue with empty flow key: ${error}`);
	}

	// Test 5: Validate global availability
	if (typeof window !== 'undefined') {
		if (!window.ComprehensiveFlowDataService) {
			issues.push('Service not available globally in development');
		}
	}

	const success = issues.length === 0;
	const summary = `
🔍 COMPREHENSIVE FLOW DATA SERVICE API VALIDATION
================================================
${success ? '✅ API INTERFACE IS ROCK SOLID' : '❌ API INTERFACE HAS ISSUES'}

${issues.length > 0 ? `Issues Found (${issues.length}):` : 'No issues found'}
${issues.map((issue) => `  - ${issue}`).join('\n')}

${success ? '🚀 READY FOR PRODUCTION USE' : '⚠️ NEEDS FIXES BEFORE PRODUCTION'}
	`.trim();

	logger.info(summary, "Logger info");

	return {
		success,
		issues,
		summary,
	};
};

declare global {
	interface Window {
		ComprehensiveFlowDataService?: typeof comprehensiveFlowDataService;
		validateServiceAPI?: typeof validateServiceAPI;
	}
}

// Make it available globally
if (typeof window !== 'undefined') {
	window.validateServiceAPI = validateServiceAPI;
	logger.info('🔍 validateServiceAPI() available globally');
}

export default validateServiceAPI;
