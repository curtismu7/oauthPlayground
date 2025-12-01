/**
 * @file protectServiceV8.ts
 * @module v8/services
 * @description PingOne Protect API Service - Handles all Protect API interactions
 * @version 8.1.0
 * @since 2024-12-01
 *
 * This service provides a clean interface for interacting with PingOne Protect APIs,
 * including risk evaluations, policy management, and feedback mechanisms.
 * It handles authentication, error handling, and response formatting.
 */

import { apiCallTrackerService } from '@/services/apiCallTrackerService';
import { workerTokenServiceV8 } from '@/v8/services/workerTokenServiceV8';

const MODULE_TAG = '[🛡️ PROTECT-SERVICE-V8]';

// Types for PingOne Protect
export interface ProtectCredentials {
	environmentId: string;
	workerToken: string;
	region: 'us' | 'eu' | 'ap' | 'ca';
}

export interface RiskEvaluationEvent {
	ip: string;
	user: {
		id: string;
		name?: string;
		type: 'PING_ONE' | 'EXTERNAL';
		groups?: Array<{ name: string }>;
	};
	targetResource?: {
		id?: string;
		name?: string;
	};
	browser?: {
		userAgent: string;
		cookie?: string;
	};
	device?: {
		externalId?: string;
	};
	session?: {
		id?: string;
	};
	flow: {
		type: 'REGISTRATION' | 'AUTHENTICATION' | 'ACCESS' | 'AUTHORIZATION' | 'TRANSACTION';
		subtype?: string;
	};
	origin?: string;
	sdk?: {
		name?: string;
		version?: string;
		signals?: {
			data?: Record<string, unknown>;
		};
	};
	completionStatus?: 'IN_PROGRESS' | 'SUCCESS' | 'FAILED';
}

export interface RiskEvaluationResult {
	id: string;
	environment: { id: string };
	riskPolicySet: {
		id: string;
		name: string;
		targeted: boolean;
	};
	result: {
		level: 'LOW' | 'MEDIUM' | 'HIGH';
		recommendedAction: string;
		type: 'VALUE';
	};
	details: Record<string, unknown>;
	createdAt: string;
	updatedAt: string;
}

export interface RiskPolicy {
	id: string;
	name: string;
	description?: string;
	targeted: boolean;
	enabled: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface RiskEvaluationFeedback {
	feedback: 'POSITIVE' | 'NEGATIVE';
}

export interface ProtectApiResponse<T = unknown> {
	data: T;
	status: number;
	statusText: string;
	headers: Record<string, string>;
}

/**
 * PingOne Protect API Service
 * Provides methods for interacting with PingOne Protect APIs
 */
export class ProtectServiceV8 {
	private static readonly API_BASE_URLS = {
		us: 'https://api.pingone.com',
		eu: 'https://api.pingone.eu',
		ap: 'https://api.pingone.asia',
		ca: 'https://api.pingone.ca',
	} as const;

	/**
	 * Get the base URL for the specified region
	 */
	private static getBaseUrl(region: ProtectCredentials['region']): string {
		return this.API_BASE_URLS[region];
	}

	/**
	 * Make an authenticated API call to PingOne Protect
	 */
	private static async makeApiCall<T>(
		credentials: ProtectCredentials,
		method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
		endpoint: string,
		body?: Record<string, unknown>,
		description?: string
	): Promise<ProtectApiResponse<T>> {
		if (!credentials.environmentId || !credentials.workerToken) {
			throw new Error('Environment ID and worker token are required');
		}

		const baseUrl = this.getBaseUrl(credentials.region);
		const url = `${baseUrl}/v1/environments/${credentials.environmentId}${endpoint}`;
		
		const startTime = Date.now();
		
		try {
			const callId = apiCallTrackerService.trackApiCall({
				method,
				url,
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${credentials.workerToken}`,
				},
				body,
				step: description || 'Protect API Call',
				flowType: 'protect',
			});

			const response = await fetch(url, {
				method,
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${credentials.workerToken}`,
				},
				body: body ? JSON.stringify(body) : undefined,
			});

			const responseClone = response.clone();
			let data: T;
			
			try {
				data = await responseClone.json() as T;
			} catch {
				const text = await response.text();
				data = { 
					error: 'Failed to parse response', 
					rawResponse: text.substring(0, 500) 
				} as T;
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: Object.fromEntries(response.headers.entries()),
					data,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = data as Record<string, unknown>;
				throw new Error(`Protect API Error: ${response.status} ${response.statusText} - ${errorData.message || errorData.error || 'Unknown error'}`);
			}

			return {
				data,
				status: response.status,
				statusText: response.statusText,
				headers: Object.fromEntries(response.headers.entries()),
			};
		} catch (error) {
			console.error(`${MODULE_TAG} API call failed:`, error);
			throw error;
		}
	}

	/**
	 * Fetch all risk policy sets for the environment
	 */
	static async fetchRiskPolicies(credentials: ProtectCredentials): Promise<RiskPolicy[]> {
		console.log(`${MODULE_TAG} Fetching risk policies for environment:`, credentials.environmentId);

		try {
			const response = await this.makeApiCall<{ _embedded: { riskPolicySets: RiskPolicy[] } }>(
				credentials,
				'GET',
				'/riskPolicySets',
				undefined,
				'Fetch Risk Policies'
			);

			const policies = response.data._embedded?.riskPolicySets || [];
			console.log(`${MODULE_TAG} Retrieved ${policies.length} risk policies`);
			
			return policies;
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to fetch risk policies:`, error);
			throw error;
		}
	}

	/**
	 * Create a new risk evaluation
	 */
	static async createRiskEvaluation(
		credentials: ProtectCredentials,
		event: RiskEvaluationEvent
	): Promise<RiskEvaluationResult> {
		console.log(`${MODULE_TAG} Creating risk evaluation for user:`, event.user.id);

		// Validate required fields
		if (!event.ip || !event.user?.id) {
			throw new Error('IP address and User ID are required for risk evaluation');
		}

		try {
			const response = await this.makeApiCall<RiskEvaluationResult>(
				credentials,
				'POST',
				'/riskEvaluations',
				event as unknown as Record<string, unknown>,
				'Create Risk Evaluation'
			);

			const result = response.data;
			console.log(`${MODULE_TAG} Risk evaluation completed:`, {
				id: result.id,
				level: result.result.level,
				recommendedAction: result.result.recommendedAction,
			});

			return result;
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to create risk evaluation:`, error);
			throw error;
		}
	}

	/**
	 * Update an existing risk evaluation with completion status
	 */
	static async updateRiskEvaluation(
		credentials: ProtectCredentials,
		evaluationId: string,
		completionStatus: 'SUCCESS' | 'FAILED'
	): Promise<RiskEvaluationResult> {
		console.log(`${MODULE_TAG} Updating risk evaluation ${evaluationId} with status:`, completionStatus);

		try {
			const response = await this.makeApiCall<RiskEvaluationResult>(
				credentials,
				'PATCH',
				`/riskEvaluations/${evaluationId}`,
				{ completionStatus },
				'Update Risk Evaluation'
			);

			console.log(`${MODULE_TAG} Risk evaluation updated successfully`);
			return response.data;
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to update risk evaluation:`, error);
			throw error;
		}
	}

	/**
	 * Provide feedback for a risk evaluation
	 * This helps the system learn and improve future risk assessments
	 */
	static async provideFeedback(
		credentials: ProtectCredentials,
		evaluationId: string,
		feedback: 'POSITIVE' | 'NEGATIVE'
	): Promise<{ message: string }> {
		console.log(`${MODULE_TAG} Providing feedback for evaluation ${evaluationId}:`, feedback);

		try {
			const response = await this.makeApiCall<{ message: string }>(
				credentials,
				'POST',
				`/riskEvaluations/${evaluationId}/feedback`,
				{ feedback },
				'Provide Risk Evaluation Feedback'
			);

			console.log(`${MODULE_TAG} Feedback provided successfully`);
			return response.data;
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to provide feedback:`, error);
			throw error;
		}
	}

	/**
	 * Get detailed information about a specific risk evaluation
	 */
	static async getRiskEvaluation(
		credentials: ProtectCredentials,
		evaluationId: string
	): Promise<RiskEvaluationResult> {
		console.log(`${MODULE_TAG} Fetching risk evaluation details for:`, evaluationId);

		try {
			const response = await this.makeApiCall<RiskEvaluationResult>(
				credentials,
				'GET',
				`/riskEvaluations/${evaluationId}`,
				undefined,
				'Get Risk Evaluation Details'
			);

			return response.data;
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to fetch risk evaluation details:`, error);
			throw error;
		}
	}

	/**
	 * Get risk evaluation history for a specific user
	 */
	static async getUserRiskHistory(
		credentials: ProtectCredentials,
		userId: string,
		limit: number = 50
	): Promise<RiskEvaluationResult[]> {
		console.log(`${MODULE_TAG} Fetching risk history for user:`, userId);

		try {
			const response = await this.makeApiCall<{ _embedded: { riskEvaluations: RiskEvaluationResult[] } }>(
				credentials,
				'GET',
				`/riskEvaluations?filter=user.id%20eq%20"${userId}"&size=${limit}`,
				undefined,
				'Get User Risk History'
			);

			const evaluations = response.data._embedded?.riskEvaluations || [];
			console.log(`${MODULE_TAG} Retrieved ${evaluations.length} risk evaluations for user`);
			
			return evaluations;
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to fetch user risk history:`, error);
			throw error;
		}
	}

	/**
	 * Create a targeted risk policy for specific users or groups
	 */
	static async createTargetedRiskPolicy(
		credentials: ProtectCredentials,
		policyData: {
			name: string;
			description?: string;
			targeted: true;
			targets: Array<{
				type: 'USER' | 'GROUP';
				id: string;
			}>;
			policy: {
				combiningType: 'WEIGHTED' | 'SCORE';
				predictors: Array<{
					id: string;
					weight?: number;
					threshold?: number;
				}>;
			};
		}
	): Promise<RiskPolicy> {
		console.log(`${MODULE_TAG} Creating targeted risk policy:`, policyData.name);

		try {
			const response = await this.makeApiCall<RiskPolicy>(
				credentials,
				'POST',
				'/riskPolicySets',
				policyData,
				'Create Targeted Risk Policy'
			);

			console.log(`${MODULE_TAG} Targeted risk policy created successfully`);
			return response.data;
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to create targeted risk policy:`, error);
			throw error;
		}
	}

	/**
	 * Get available risk predictors for the environment
	 */
	static async getRiskPredictors(credentials: ProtectCredentials): Promise<Array<{
		id: string;
		name: string;
		type: 'BASE' | 'COMPOSITE' | 'TRAFFIC_ANOMALY' | 'VELOCITY' | 'CUSTOM';
		enabled: boolean;
		description?: string;
	}>> {
		console.log(`${MODULE_TAG} Fetching risk predictors`);

		try {
			const response = await this.makeApiCall<{ _embedded: { riskPredictors: unknown[] } }>(
				credentials,
				'GET',
				'/riskPredictors',
				undefined,
				'Get Risk Predictors'
			);

			const predictors = response.data._embedded?.riskPredictors || [];
			console.log(`${MODULE_TAG} Retrieved ${predictors.length} risk predictors`);
			
			return predictors as Array<{
				id: string;
				name: string;
				type: 'BASE' | 'COMPOSITE' | 'TRAFFIC_ANOMALY' | 'VELOCITY' | 'CUSTOM';
				enabled: boolean;
				description?: string;
			}>;
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to fetch risk predictors:`, error);
			throw error;
		}
	}

	/**
	 * Validate credentials and test API connectivity
	 */
	static async validateCredentials(credentials: ProtectCredentials): Promise<boolean> {
		console.log(`${MODULE_TAG} Validating Protect API credentials`);

		try {
			// Try to fetch risk policies as a simple connectivity test
			await this.fetchRiskPolicies(credentials);
			console.log(`${MODULE_TAG} Credentials validated successfully`);
			return true;
		} catch (error) {
			console.error(`${MODULE_TAG} Credential validation failed:`, error);
			return false;
		}
	}

	/**
	 * Helper method to get worker token with automatic renewal
	 */
	private static async getWorkerToken(): Promise<string> {
		const token = await workerTokenServiceV8.getToken();
		if (!token) {
			throw new Error('Worker token not found. Please generate a worker token first.');
		}
		return token.trim().replace(/^Bearer\s+/i, '');
	}

	/**
	 * Convenience method to perform a complete risk evaluation workflow
	 * This includes creating the evaluation and optionally updating it based on the result
	 */
	static async performRiskEvaluationWorkflow(
		credentials: ProtectCredentials,
		event: RiskEvaluationEvent,
		options: {
			autoUpdate?: boolean;
			autoFeedback?: boolean;
			successCallback?: (result: RiskEvaluationResult) => void;
			failureCallback?: (result: RiskEvaluationResult) => void;
		} = {}
	): Promise<{
		evaluation: RiskEvaluationResult;
		action: 'ALLOW' | 'CHALLENGE' | 'BLOCK';
		reason: string;
	}> {
		console.log(`${MODULE_TAG} Starting risk evaluation workflow`);

		// Step 1: Create risk evaluation
		const evaluation = await this.createRiskEvaluation(credentials, event);
		
		// Step 2: Determine action based on risk level
		let action: 'ALLOW' | 'CHALLENGE' | 'BLOCK';
		let reason: string;

		switch (evaluation.result.level) {
			case 'LOW':
				action = 'ALLOW';
				reason = 'Low risk detected - allowing access';
				break;
			case 'MEDIUM':
				action = 'CHALLENGE';
				reason = 'Medium risk detected - requiring additional verification';
				break;
			case 'HIGH':
				action = 'BLOCK';
				reason = 'High risk detected - blocking access';
				break;
			default:
				action = 'ALLOW';
				reason = 'Unknown risk level - defaulting to allow';
		}

		console.log(`${MODULE_TAG} Risk evaluation result:`, {
			level: evaluation.result.level,
			action,
			reason,
		});

		// Step 3: Execute callbacks
		if (action === 'ALLOW' && options.successCallback) {
			options.successCallback(evaluation);
		} else if (action !== 'ALLOW' && options.failureCallback) {
			options.failureCallback(evaluation);
		}

		return {
			evaluation,
			action,
			reason,
		};
	}
}

export default ProtectServiceV8;
