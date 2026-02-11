/**
 * @file riskEvaluationService.ts
 * @module protect-portal/services
 * @description Risk evaluation service for Protect Portal
 * @version 9.6.5
 * @since 2026-02-10
 *
 * This service handles risk evaluation using PingOne Protect API
 * with custom risk policies and secure implementation.
 */

import { getActiveRiskThresholds } from '../../../config/protect-portal/riskPolicies.config';
import { PingOneSignalsService } from './pingOneSignalsService';
import type {
	LoginContext,
	ProtectCredentials,
	RiskEvaluationError,
	RiskEvaluationEventData,
	RiskEvaluationResult,
	RiskThresholds,
	ServiceResponse,
	UserContext,
} from '../types/protectPortal.types';

const MODULE_TAG = '[🛡️ RISK-EVALUATION-SERVICE]';

// ============================================================================
// RISK EVALUATION SERVICE
// ============================================================================

export class RiskEvaluationService {
	private static readonly PROXY_BASE_URL = '/api/pingone';

	/**
	 * Evaluate user risk using PingOne Protect API
	 */
	static async evaluateRisk(
		userContext: UserContext,
		loginContext: LoginContext,
		credentials: ProtectCredentials,
		customThresholds?: RiskThresholds
	): Promise<ServiceResponse<RiskEvaluationResult>> {
		const startTime = Date.now();
		const requestId = `risk-eval-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

		try {
			console.log(`${MODULE_TAG} Starting risk evaluation for user:`, userContext.id);

			// Validate inputs
			const validationError = RiskEvaluationService.validateInputs(
				userContext,
				loginContext,
				credentials
			);
			if (validationError) {
				return {
					success: false,
					error: validationError,
					metadata: {
						timestamp: new Date().toISOString(),
						requestId,
						processingTime: Date.now() - startTime,
					},
				};
			}

			// Get configurable thresholds (use provided custom thresholds or get from config)
			const activeThresholds = customThresholds || getActiveRiskThresholds();
			console.log(`${MODULE_TAG} Using risk thresholds:`, activeThresholds);

			// Build risk event data
			const riskEvent = await RiskEvaluationService.buildRiskEvent(userContext, loginContext);

			// Call proxy endpoint for risk evaluation
			const response = await fetch(`${RiskEvaluationService.PROXY_BASE_URL}/risk-evaluations`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${credentials.workerToken}`,
				},
				body: JSON.stringify({
					environmentId: credentials.environmentId,
					riskEvent: riskEvent,
				}),
			});

			if (!response.ok) {
				throw new Error(`Proxy API error: ${response.status} ${response.statusText}`);
			}

			const evaluationResult = await response.json();

			// Apply configurable thresholds
			const finalResult = RiskEvaluationService.applyCustomThresholds(
				evaluationResult,
				activeThresholds
			);

			console.log(`${MODULE_TAG} Risk evaluation completed`, {
				riskLevel: finalResult.result?.level,
				recommendedAction: finalResult.result?.recommendedAction,
				thresholdsApplied: !customThresholds, // Using config thresholds
			});

			return {
				success: true,
				data: finalResult,
				metadata: {
					timestamp: new Date().toISOString(),
					requestId,
					processingTime: Date.now() - startTime,
				},
			};
		} catch (error) {
			console.error(`${MODULE_TAG} Risk evaluation failed:`, error);

			const riskError: RiskEvaluationError = {
				code: 'RISK_EVALUATION_FAILED',
				message: error instanceof Error ? error.message : 'Risk evaluation failed',
				type: RiskEvaluationService.getErrorType(error),
				details: {
					originalError: error instanceof Error ? error.message : 'Unknown error',
					userId: userContext.id,
					requestId,
				},
				recoverable: true,
				suggestedAction: 'Please try again or contact support if the issue persists',
			};

			return {
				success: false,
				error: riskError,
				metadata: {
					timestamp: new Date().toISOString(),
					requestId,
					processingTime: Date.now() - startTime,
				},
			};
		}
	}

	/**
	 * Validate input parameters
	 */
	private static validateInputs(
		userContext: UserContext,
		loginContext: LoginContext,
		credentials: ProtectCredentials
	): RiskEvaluationError | null {
		// Validate user context
		if (!userContext.id || !userContext.email || !userContext.username) {
			return {
				code: 'INVALID_USER_CONTEXT',
				message: 'User context is incomplete',
				type: 'VALIDATION_ERROR',
				recoverable: false,
				suggestedAction: 'Please provide complete user information',
			};
		}

		// Validate login context
		if (!loginContext.ipAddress || !loginContext.userAgent) {
			return {
				code: 'INVALID_LOGIN_CONTEXT',
				message: 'Login context is incomplete',
				type: 'VALIDATION_ERROR',
				recoverable: false,
				suggestedAction: 'Please provide complete login information',
			};
		}

		// Validate credentials
		if (!credentials.environmentId || !credentials.workerToken) {
			return {
				code: 'INVALID_CREDENTIALS',
				message: 'Protect credentials are missing',
				type: 'VALIDATION_ERROR',
				recoverable: false,
				suggestedAction: 'Please configure Protect API credentials',
			};
		}

		return null;
	}

	/**
	 * Build risk evaluation event from user and login context
	 */
	private static async buildRiskEvent(
		userContext: UserContext,
		loginContext: LoginContext
	): Promise<RiskEvaluationEventData> {
		// Try to get device payload from PingOne Signals
		let devicePayload = null;
		try {
			const signalsResult = await PingOneSignalsService.getDevicePayload();
			if (signalsResult.success && signalsResult.payload) {
				devicePayload = signalsResult.payload;
				console.log(`${RiskEvaluationService.MODULE_TAG} Device payload collected`, {
					deviceId: devicePayload.deviceId,
					hasBehavioralData: !!devicePayload.behavioralData,
				});
			}
		} catch (error) {
			console.warn(`${RiskEvaluationService.MODULE_TAG} Failed to collect device payload`, error);
		}

		return {
			ip: loginContext.ipAddress,
			user: {
				id: userContext.id,
				name: userContext.name || undefined,
				type: userContext.type,
				groups: userContext.groups || undefined,
			},
			targetResource: {
				name: 'Protect Portal',
				id: 'protect-portal',
			},
			browser: {
				userAgent: loginContext.userAgent,
			},
			device: {
				...userContext.device,
				...(devicePayload && {
					deviceId: devicePayload.deviceId,
					deviceAttributes: devicePayload.deviceAttributes,
					behavioralData: devicePayload.behavioralData,
					tags: devicePayload.tags,
				}),
			},
			session: userContext.session,
			flow: {
				type: 'AUTHENTICATION',
				subtype: loginContext.flowSubtype,
			},
			origin: loginContext.origin,
			timestamp: loginContext.timestamp,
			completionStatus: 'IN_PROGRESS',
		};
	}

	/**
	 * Apply custom risk thresholds to evaluation result
	 */
	private static applyCustomThresholds(
		result: RiskEvaluationResult,
		customThresholds?: RiskThresholds
	): RiskEvaluationResult {
		if (!customThresholds) {
			return result;
		}

		// Extract risk score from result details (implementation depends on Protect API response)
		const riskScore = RiskEvaluationService.extractRiskScore(result);

		// Determine risk level based on custom thresholds
		let newLevel: 'LOW' | 'MEDIUM' | 'HIGH';
		let newAction: string;

		if (riskScore <= customThresholds.low.maxScore) {
			newLevel = 'LOW';
			newAction = customThresholds.low.action;
		} else if (
			riskScore >= customThresholds.medium.minScore &&
			riskScore <= customThresholds.medium.maxScore
		) {
			newLevel = 'MEDIUM';
			newAction = customThresholds.medium.action;
		} else {
			newLevel = 'HIGH';
			newAction = customThresholds.high.action;
		}

		// Return modified result
		return {
			...result,
			result: {
				...result.result,
				level: newLevel,
				recommendedAction: newAction,
			},
			details: {
				...result.details,
				originalScore: riskScore,
				customThresholdsApplied: true,
				thresholds: customThresholds,
			},
		};
	}

	/**
	 * Extract risk score from evaluation result
	 */
	private static extractRiskScore(result: RiskEvaluationResult): number {
		// This implementation depends on the actual Protect API response structure
		// For now, we'll use a default score based on the risk level
		switch (result.result.level) {
			case 'LOW':
				return 20;
			case 'MEDIUM':
				return 50;
			case 'HIGH':
				return 85;
			default:
				return 50; // Default to medium if unknown
		}
	}

	/**
	 * Determine error type from caught error
	 */
	private static getErrorType(error: unknown): RiskEvaluationError['type'] {
		if (error instanceof Error) {
			if (error.message.includes('fetch')) {
				return 'NETWORK_ERROR';
			}
			if (error.message.includes('401') || error.message.includes('403')) {
				return 'PROTECT_API_ERROR';
			}
			if (error.message.includes('400') || error.message.includes('422')) {
				return 'VALIDATION_ERROR';
			}
		}
		return 'PROTECT_API_ERROR';
	}

	/**
	 * Get risk level description for user display
	 */
	static getRiskLevelDescription(level: 'LOW' | 'MEDIUM' | 'HIGH'): {
		title: string;
		description: string;
		color: string;
		icon: string;
	} {
		switch (level) {
			case 'LOW':
				return {
					title: 'Low Risk',
					description: 'Your login appears to be from a trusted source and location.',
					color: '#10b981', // Green
					icon: '✅',
				};
			case 'MEDIUM':
				return {
					title: 'Medium Risk',
					description: 'Additional verification is recommended to protect your account.',
					color: '#f59e0b', // Amber
					icon: '⚠️',
				};
			case 'HIGH':
				return {
					title: 'High Risk',
					description: 'This login attempt shows suspicious patterns and has been blocked.',
					color: '#ef4444', // Red
					icon: '🚫',
				};
			default:
				return {
					title: 'Unknown Risk',
					description: 'Risk level could not be determined.',
					color: '#6b7280', // Gray
					icon: '❓',
				};
		}
	}

	/**
	 * Get recommended action description
	 */
	static getActionDescription(action: string): string {
		switch (action) {
			case 'ALLOW':
				return 'You can proceed with normal login.';
			case 'CHALLENGE_MFA':
				return 'Multi-factor authentication is required for additional security.';
			case 'BLOCK':
				return 'This login attempt has been blocked for security reasons.';
			default:
				return 'Please follow the recommended security measures.';
		}
	}

	/**
	 * Validate risk evaluation result
	 */
	static validateRiskResult(result: RiskEvaluationResult): boolean {
		try {
			// Check required fields
			if (!result.id || !result.environment?.id || !result.riskPolicySet?.id) {
				return false;
			}

			// Check result structure
			if (!result.result || !result.result.level || !result.result.recommendedAction) {
				return false;
			}

			// Validate risk level
			const validLevels = ['LOW', 'MEDIUM', 'HIGH'];
			if (!validLevels.includes(result.result.level)) {
				return false;
			}

			// Check timestamps
			if (!result.createdAt || !result.updatedAt) {
				return false;
			}

			return true;
		} catch (error) {
			console.error(`${MODULE_TAG} Risk result validation failed:`, error);
			return false;
		}
	}
}

// ============================================================================
// EXPORTS
// ============================================================================

export default RiskEvaluationService;
