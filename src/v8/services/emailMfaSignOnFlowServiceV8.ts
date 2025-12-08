/**
 * @file emailMfaSignOnFlowServiceV8.ts
 * @module v8/services
 * @description Service for Email MFA Sign-On Flow operations
 * @version 8.0.0
 */

import { apiCallTrackerService } from '@/services/apiCallTrackerService';
import { workerTokenServiceV8 } from '@/v8/services/workerTokenServiceV8';

const MODULE_TAG = '[📧 EMAIL-MFA-SIGNON-SERVICE-V8]';

export interface CreateApplicationParams {
	environmentId: string;
	name: string;
	description?: string;
	type?: string;
	redirectUris?: string[];
	grantTypes?: string[];
	responseTypes?: string[];
	tokenEndpointAuthMethod?: string;
}

export interface CreateSignOnPolicyParams {
	environmentId: string;
	name: string;
	description?: string;
	default?: boolean;
}

export interface CreateEmailMFAActionParams {
	environmentId: string;
	signOnPolicyId: string;
	priority?: number;
	configuration?: {
		attempts?: number;
		resendInterval?: number;
	};
}

export interface CreateUserParams {
	environmentId: string;
	populationId: string;
	username: string;
	email?: string;
	givenName?: string;
	familyName?: string;
}

export interface CreateDeviceAuthPolicyParams {
	environmentId: string;
	name: string;
	description?: string;
	rememberDevice?: boolean;
	rememberDeviceForSeconds?: number;
}

export interface RegisterEmailDeviceParams {
	environmentId: string;
	userId: string;
	email: string;
	name?: string;
	nickname?: string;
	status?: 'ACTIVE' | 'ACTIVATION_REQUIRED';
}

export interface FlowCheckParams {
	environmentId: string;
	flowId: string;
	action: string;
	data?: Record<string, unknown>;
	cookies?: string[];
}

export interface ResumeFlowParams {
	environmentId: string;
	flowId: string;
	state?: string;
	codeVerifier?: string;
}

/**
 * Email MFA Sign-On Flow Service
 * Handles all API operations for the Email MFA sign-on flow
 */
export class EmailMFASignOnFlowServiceV8 {
	/**
	 * Get worker token
	 */
	private static async getWorkerToken(): Promise<string> {
		const token = await workerTokenServiceV8.getToken();
		if (!token) {
			throw new Error('Worker token is required. Please generate a worker token first.');
		}
		return token.trim().replace(/^Bearer\s+/i, '');
	}

	/**
	 * Make API request to PingOne via backend proxy
	 */
	private static async pingOneFetch(
		endpoint: string,
		options: RequestInit = {}
	): Promise<Response> {
		const response = await fetch(endpoint, {
			...options,
			credentials: 'include',
		});
		return response;
	}

	/**
	 * Step 1: Create Application
	 * POST /environments/{envID}/applications
	 */
	static async createApplication(params: CreateApplicationParams): Promise<Record<string, unknown>> {
		const workerToken = await this.getWorkerToken();
		const startTime = Date.now();

		const actualPingOneUrl = `https://api.pingone.com/v1/environments/${params.environmentId}/applications`;

		const callId = apiCallTrackerService.trackApiCall({
			method: 'POST',
			url: '/api/pingone/email-mfa-signon/create-application',
			actualPingOneUrl,
			headers: { 'Content-Type': 'application/json' },
			body: params,
			step: 'Step 0: Create Application',
			flowType: 'email-mfa-signon',
		});

		try {
			const response = await this.pingOneFetch('/api/pingone/email-mfa-signon/create-application', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					...params,
					workerToken,
				}),
			});

			const responseClone = response.clone();
			let responseData: unknown;
			try {
				responseData = await responseClone.json();
			} catch {
				responseData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: (() => {
						const headers: Record<string, string> = {};
						response.headers.forEach((value, key) => {
							headers[key] = value;
						});
						return headers;
					})(),
					data: responseData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = responseData as { message?: string; error?: string };
				throw new Error(
					`Failed to create application: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			console.log(`${MODULE_TAG} Application created successfully`, responseData);
			return responseData as Record<string, unknown>;
		} catch (error) {
			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: 0,
					statusText: 'Error',
					error: error instanceof Error ? error.message : String(error),
				},
				Date.now() - startTime
			);
			console.error(`${MODULE_TAG} Error creating application:`, error);
			throw error;
		}
	}

	/**
	 * Step 2: Get Resources
	 * GET /environments/{envID}/resources
	 */
	static async getResources(environmentId: string): Promise<Record<string, unknown>> {
		const workerToken = await this.getWorkerToken();
		const startTime = Date.now();

		const actualPingOneUrl = `https://api.pingone.com/v1/environments/${environmentId}/resources`;

		const callId = apiCallTrackerService.trackApiCall({
			method: 'GET',
			url: '/api/pingone/email-mfa-signon/get-resources',
			actualPingOneUrl,
			step: 'Step 0: Get Resources',
			flowType: 'email-mfa-signon',
		});

		try {
			const response = await this.pingOneFetch(
				`/api/pingone/email-mfa-signon/get-resources?environmentId=${environmentId}&workerToken=${encodeURIComponent(workerToken)}`,
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
				}
			);

			const responseClone = response.clone();
			let responseData: unknown;
			try {
				responseData = await responseClone.json();
			} catch {
				responseData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					data: responseData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = responseData as { message?: string; error?: string };
				throw new Error(
					`Failed to get resources: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			return responseData as Record<string, unknown>;
		} catch (error) {
			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: 0,
					statusText: 'Error',
					error: error instanceof Error ? error.message : String(error),
				},
				Date.now() - startTime
			);
			throw error;
		}
	}

	/**
	 * Step 3: Get Resource Scopes
	 * GET /environments/{envID}/resources/{resourceID}/scopes
	 */
	static async getResourceScopes(
		environmentId: string,
		resourceId: string
	): Promise<Record<string, unknown>> {
		const workerToken = await this.getWorkerToken();
		const startTime = Date.now();

		const actualPingOneUrl = `https://api.pingone.com/v1/environments/${environmentId}/resources/${resourceId}/scopes`;

		const callId = apiCallTrackerService.trackApiCall({
			method: 'GET',
			url: '/api/pingone/email-mfa-signon/get-resource-scopes',
			actualPingOneUrl,
			step: 'Step 0: Get Resource Scopes',
			flowType: 'email-mfa-signon',
		});

		try {
			const response = await this.pingOneFetch(
				`/api/pingone/email-mfa-signon/get-resource-scopes?environmentId=${environmentId}&resourceId=${resourceId}&workerToken=${encodeURIComponent(workerToken)}`,
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
				}
			);

			const responseClone = response.clone();
			let responseData: unknown;
			try {
				responseData = await responseClone.json();
			} catch {
				responseData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					data: responseData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = responseData as { message?: string; error?: string };
				throw new Error(
					`Failed to get resource scopes: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			return responseData as Record<string, unknown>;
		} catch (error) {
			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: 0,
					statusText: 'Error',
					error: error instanceof Error ? error.message : String(error),
				},
				Date.now() - startTime
			);
			throw error;
		}
	}

	/**
	 * Step 4: Create Resource Access Grant
	 * POST /environments/{envID}/applications/{appID}/grants
	 */
	static async createResourceGrant(
		environmentId: string,
		applicationId: string,
		resourceId: string,
		scopes?: string[]
	): Promise<Record<string, unknown>> {
		const workerToken = await this.getWorkerToken();
		const startTime = Date.now();

		const actualPingOneUrl = `https://api.pingone.com/v1/environments/${environmentId}/applications/${applicationId}/grants`;

		const callId = apiCallTrackerService.trackApiCall({
			method: 'POST',
			url: '/api/pingone/email-mfa-signon/create-resource-grant',
			actualPingOneUrl,
			step: 'Step 0: Create Resource Grant',
			flowType: 'email-mfa-signon',
		});

		try {
			const response = await this.pingOneFetch('/api/pingone/email-mfa-signon/create-resource-grant', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					environmentId,
					applicationId,
					resourceId,
					scopes: scopes || [],
					workerToken,
				}),
			});

			const responseClone = response.clone();
			let responseData: unknown;
			try {
				responseData = await responseClone.json();
			} catch {
				responseData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					data: responseData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = responseData as { message?: string; error?: string };
				throw new Error(
					`Failed to create resource grant: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			return responseData as Record<string, unknown>;
		} catch (error) {
			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: 0,
					statusText: 'Error',
					error: error instanceof Error ? error.message : String(error),
				},
				Date.now() - startTime
			);
			throw error;
		}
	}

	/**
	 * Step 5: Create Sign-On Policy
	 * POST /environments/{envID}/signOnPolicies
	 */
	static async createSignOnPolicy(
		params: CreateSignOnPolicyParams
	): Promise<Record<string, unknown>> {
		const workerToken = await this.getWorkerToken();
		const startTime = Date.now();

		const actualPingOneUrl = `https://api.pingone.com/v1/environments/${params.environmentId}/signOnPolicies`;

		const callId = apiCallTrackerService.trackApiCall({
			method: 'POST',
			url: '/api/pingone/email-mfa-signon/create-signon-policy',
			actualPingOneUrl,
			step: 'Step 1: Create Sign-On Policy',
			flowType: 'email-mfa-signon',
		});

		try {
			const response = await this.pingOneFetch('/api/pingone/email-mfa-signon/create-signon-policy', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					...params,
					workerToken,
				}),
			});

			const responseClone = response.clone();
			let responseData: unknown;
			try {
				responseData = await responseClone.json();
			} catch {
				responseData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					data: responseData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = responseData as { message?: string; error?: string };
				throw new Error(
					`Failed to create sign-on policy: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			return responseData as Record<string, unknown>;
		} catch (error) {
			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: 0,
					statusText: 'Error',
					error: error instanceof Error ? error.message : String(error),
				},
				Date.now() - startTime
			);
			throw error;
		}
	}

	/**
	 * Step 6: Create Email MFA Sign-On Policy Action
	 * POST /environments/{envID}/signOnPolicies/{signOnPolicyID}/actions
	 */
	static async createEmailMFAAction(
		params: CreateEmailMFAActionParams
	): Promise<Record<string, unknown>> {
		const workerToken = await this.getWorkerToken();
		const startTime = Date.now();

		const actualPingOneUrl = `https://api.pingone.com/v1/environments/${params.environmentId}/signOnPolicies/${params.signOnPolicyId}/actions`;

		const callId = apiCallTrackerService.trackApiCall({
			method: 'POST',
			url: '/api/pingone/email-mfa-signon/create-email-mfa-action',
			actualPingOneUrl,
			step: 'Step 1: Create Email MFA Action',
			flowType: 'email-mfa-signon',
		});

		try {
			const response = await this.pingOneFetch('/api/pingone/email-mfa-signon/create-email-mfa-action', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					...params,
					workerToken,
				}),
			});

			const responseClone = response.clone();
			let responseData: unknown;
			try {
				responseData = await responseClone.json();
			} catch {
				responseData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					data: responseData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = responseData as { message?: string; error?: string };
				throw new Error(
					`Failed to create Email MFA action: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			return responseData as Record<string, unknown>;
		} catch (error) {
			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: 0,
					statusText: 'Error',
					error: error instanceof Error ? error.message : String(error),
				},
				Date.now() - startTime
			);
			throw error;
		}
	}

	/**
	 * Step 7: Assign Sign-On Policy to Application
	 * POST /environments/{envID}/applications/{appID}/signOnPolicyAssignments
	 */
	static async assignSignOnPolicy(
		environmentId: string,
		applicationId: string,
		signOnPolicyId: string
	): Promise<Record<string, unknown>> {
		const workerToken = await this.getWorkerToken();
		const startTime = Date.now();

		const actualPingOneUrl = `https://api.pingone.com/v1/environments/${environmentId}/applications/${applicationId}/signOnPolicyAssignments`;

		const callId = apiCallTrackerService.trackApiCall({
			method: 'POST',
			url: '/api/pingone/email-mfa-signon/assign-signon-policy',
			actualPingOneUrl,
			step: 'Step 1: Assign Sign-On Policy',
			flowType: 'email-mfa-signon',
		});

		try {
			const response = await this.pingOneFetch('/api/pingone/email-mfa-signon/assign-signon-policy', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					environmentId,
					applicationId,
					signOnPolicyId,
					workerToken,
				}),
			});

			const responseClone = response.clone();
			let responseData: unknown;
			try {
				responseData = await responseClone.json();
			} catch {
				responseData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					data: responseData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = responseData as { message?: string; error?: string };
				throw new Error(
					`Failed to assign sign-on policy: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			return responseData as Record<string, unknown>;
		} catch (error) {
			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: 0,
					statusText: 'Error',
					error: error instanceof Error ? error.message : String(error),
				},
				Date.now() - startTime
			);
			throw error;
		}
	}

	/**
	 * Step 8: Create Population
	 * POST /environments/{envID}/populations
	 */
	static async createPopulation(
		environmentId: string,
		name: string,
		description?: string
	): Promise<Record<string, unknown>> {
		const workerToken = await this.getWorkerToken();
		const startTime = Date.now();

		const actualPingOneUrl = `https://api.pingone.com/v1/environments/${environmentId}/populations`;

		const callId = apiCallTrackerService.trackApiCall({
			method: 'POST',
			url: '/api/pingone/email-mfa-signon/create-population',
			actualPingOneUrl,
			step: 'Step 2: Create Population',
			flowType: 'email-mfa-signon',
		});

		try {
			const response = await this.pingOneFetch('/api/pingone/email-mfa-signon/create-population', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					environmentId,
					name,
					description,
					workerToken,
				}),
			});

			const responseClone = response.clone();
			let responseData: unknown;
			try {
				responseData = await responseClone.json();
			} catch {
				responseData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					data: responseData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = responseData as { message?: string; error?: string };
				throw new Error(
					`Failed to create population: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			return responseData as Record<string, unknown>;
		} catch (error) {
			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: 0,
					statusText: 'Error',
					error: error instanceof Error ? error.message : String(error),
				},
				Date.now() - startTime
			);
			throw error;
		}
	}

	/**
	 * Step 9: Create User
	 * POST /environments/{envID}/users
	 */
	static async createUser(params: CreateUserParams): Promise<Record<string, unknown>> {
		const workerToken = await this.getWorkerToken();
		const startTime = Date.now();

		const actualPingOneUrl = `https://api.pingone.com/v1/environments/${params.environmentId}/users`;

		const callId = apiCallTrackerService.trackApiCall({
			method: 'POST',
			url: '/api/pingone/email-mfa-signon/create-user',
			actualPingOneUrl,
			step: 'Step 2: Create User',
			flowType: 'email-mfa-signon',
		});

		try {
			const response = await this.pingOneFetch('/api/pingone/email-mfa-signon/create-user', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					...params,
					workerToken,
				}),
			});

			const responseClone = response.clone();
			let responseData: unknown;
			try {
				responseData = await responseClone.json();
			} catch {
				responseData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					data: responseData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = responseData as { message?: string; error?: string };
				throw new Error(
					`Failed to create user: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			return responseData as Record<string, unknown>;
		} catch (error) {
			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: 0,
					statusText: 'Error',
					error: error instanceof Error ? error.message : String(error),
				},
				Date.now() - startTime
			);
			throw error;
		}
	}

	/**
	 * Step 10: Set User Password
	 * POST /environments/{envID}/users/{userID}/password
	 */
	static async setUserPassword(
		environmentId: string,
		userId: string,
		password: string,
		forceChange?: boolean
	): Promise<Record<string, unknown>> {
		const workerToken = await this.getWorkerToken();
		const startTime = Date.now();

		const actualPingOneUrl = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/password`;

		const callId = apiCallTrackerService.trackApiCall({
			method: 'POST',
			url: '/api/pingone/email-mfa-signon/set-user-password',
			actualPingOneUrl,
			step: 'Step 2: Set User Password',
			flowType: 'email-mfa-signon',
		});

		try {
			const response = await this.pingOneFetch('/api/pingone/email-mfa-signon/set-user-password', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					environmentId,
					userId,
					password,
					forceChange: forceChange || false,
					workerToken,
				}),
			});

			const responseClone = response.clone();
			let responseData: unknown;
			try {
				responseData = await responseClone.json();
			} catch {
				responseData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					data: responseData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = responseData as { message?: string; error?: string };
				throw new Error(
					`Failed to set user password: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			return responseData as Record<string, unknown>;
		} catch (error) {
			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: 0,
					statusText: 'Error',
					error: error instanceof Error ? error.message : String(error),
				},
				Date.now() - startTime
			);
			throw error;
		}
	}

	/**
	 * Step 11: Enable MFA for User
	 * POST /environments/{envID}/users/{userID}/mfaEnabled
	 */
	static async enableMFAForUser(
		environmentId: string,
		userId: string
	): Promise<Record<string, unknown>> {
		const workerToken = await this.getWorkerToken();
		const startTime = Date.now();

		const actualPingOneUrl = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/mfaEnabled`;

		const callId = apiCallTrackerService.trackApiCall({
			method: 'POST',
			url: '/api/pingone/email-mfa-signon/enable-mfa',
			actualPingOneUrl,
			step: 'Step 2: Enable MFA',
			flowType: 'email-mfa-signon',
		});

		try {
			const response = await this.pingOneFetch('/api/pingone/email-mfa-signon/enable-mfa', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					environmentId,
					userId,
					workerToken,
				}),
			});

			const responseClone = response.clone();
			let responseData: unknown;
			try {
				responseData = await responseClone.json();
			} catch {
				responseData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					data: responseData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = responseData as { message?: string; error?: string };
				throw new Error(
					`Failed to enable MFA: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			return responseData as Record<string, unknown>;
		} catch (error) {
			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: 0,
					statusText: 'Error',
					error: error instanceof Error ? error.message : String(error),
				},
				Date.now() - startTime
			);
			throw error;
		}
	}

	/**
	 * Step 12: Create Device Authentication Policy
	 * POST /environments/{envID}/deviceAuthenticationPolicies
	 */
	static async createDeviceAuthPolicy(
		params: CreateDeviceAuthPolicyParams
	): Promise<Record<string, unknown>> {
		const workerToken = await this.getWorkerToken();
		const startTime = Date.now();

		const actualPingOneUrl = `https://api.pingone.com/v1/environments/${params.environmentId}/deviceAuthenticationPolicies`;

		const callId = apiCallTrackerService.trackApiCall({
			method: 'POST',
			url: '/api/pingone/email-mfa-signon/create-device-auth-policy',
			actualPingOneUrl,
			step: 'Step 3: Create Device Auth Policy',
			flowType: 'email-mfa-signon',
		});

		try {
			const response = await this.pingOneFetch('/api/pingone/email-mfa-signon/create-device-auth-policy', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					...params,
					workerToken,
				}),
			});

			const responseClone = response.clone();
			let responseData: unknown;
			try {
				responseData = await responseClone.json();
			} catch {
				responseData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					data: responseData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = responseData as { message?: string; error?: string };
				throw new Error(
					`Failed to create device auth policy: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			return responseData as Record<string, unknown>;
		} catch (error) {
			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: 0,
					statusText: 'Error',
					error: error instanceof Error ? error.message : String(error),
				},
				Date.now() - startTime
			);
			throw error;
		}
	}

	/**
	 * Step 13: Register Email Device
	 * POST /environments/{envID}/users/{userID}/devices
	 */
	static async registerEmailDevice(
		params: RegisterEmailDeviceParams
	): Promise<Record<string, unknown>> {
		const workerToken = await this.getWorkerToken();
		const startTime = Date.now();

		const actualPingOneUrl = `https://api.pingone.com/v1/environments/${params.environmentId}/users/${params.userId}/devices`;

		const callId = apiCallTrackerService.trackApiCall({
			method: 'POST',
			url: '/api/pingone/email-mfa-signon/register-email-device',
			actualPingOneUrl,
			step: 'Step 3: Register Email Device',
			flowType: 'email-mfa-signon',
		});

		try {
			const response = await this.pingOneFetch('/api/pingone/email-mfa-signon/register-email-device', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					...params,
					workerToken,
				}),
			});

			const responseClone = response.clone();
			let responseData: unknown;
			try {
				responseData = await responseClone.json();
			} catch {
				responseData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					data: responseData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = responseData as { message?: string; error?: string };
				throw new Error(
					`Failed to register email device: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			return responseData as Record<string, unknown>;
		} catch (error) {
			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: 0,
					statusText: 'Error',
					error: error instanceof Error ? error.message : String(error),
				},
				Date.now() - startTime
			);
			throw error;
		}
	}

	/**
	 * Step 14: Initiate Authorization Request
	 * POST /{envID}/as/authorize
	 */
	static async initiateAuthorization(
		environmentId: string,
		clientId: string,
		redirectUri: string,
		responseType: string = 'code',
		scope: string = 'openid profile email',
		state?: string,
		codeChallenge?: string,
		codeChallengeMethod?: string
	): Promise<Record<string, unknown>> {
		const startTime = Date.now();

		const actualPingOneUrl = `https://auth.pingone.com/${environmentId}/as/authorize`;

		const callId = apiCallTrackerService.trackApiCall({
			method: 'POST',
			url: '/api/pingone/email-mfa-signon/initiate-authorization',
			actualPingOneUrl,
			step: 'Step 4: Initiate Authorization',
			flowType: 'email-mfa-signon',
		});

		try {
			const response = await this.pingOneFetch('/api/pingone/email-mfa-signon/initiate-authorization', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					environmentId,
					clientId,
					redirectUri,
					responseType,
					scope,
					state,
					codeChallenge,
					codeChallengeMethod,
				}),
			});

			const responseClone = response.clone();
			let responseData: unknown;
			try {
				responseData = await responseClone.json();
			} catch {
				responseData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					data: responseData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = responseData as { message?: string; error?: string };
				throw new Error(
					`Failed to initiate authorization: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			return responseData as Record<string, unknown>;
		} catch (error) {
			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: 0,
					statusText: 'Error',
					error: error instanceof Error ? error.message : String(error),
				},
				Date.now() - startTime
			);
			throw error;
		}
	}

	/**
	 * Step 15: Get Flow Status
	 * GET /{envID}/flows/{flowID}
	 */
	static async getFlowStatus(
		environmentId: string,
		flowId: string,
		cookies?: string[]
	): Promise<Record<string, unknown>> {
		const startTime = Date.now();

		const actualPingOneUrl = `https://auth.pingone.com/${environmentId}/flows/${flowId}`;

		const callId = apiCallTrackerService.trackApiCall({
			method: 'GET',
			url: '/api/pingone/email-mfa-signon/get-flow-status',
			actualPingOneUrl,
			step: 'Step 4: Get Flow Status',
			flowType: 'email-mfa-signon',
		});

		try {
			const response = await this.pingOneFetch('/api/pingone/email-mfa-signon/get-flow-status', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					environmentId,
					flowId,
					cookies: cookies || [],
				}),
			});

			const responseClone = response.clone();
			let responseData: unknown;
			try {
				responseData = await responseClone.json();
			} catch {
				responseData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					data: responseData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = responseData as { message?: string; error?: string };
				throw new Error(
					`Failed to get flow status: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			return responseData as Record<string, unknown>;
		} catch (error) {
			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: 0,
					statusText: 'Error',
					error: error instanceof Error ? error.message : String(error),
				},
				Date.now() - startTime
			);
			throw error;
		}
	}

	/**
	 * Step 16: Complete Flow Action (User Lookup or OTP Check)
	 * POST /{envID}/flows/{flowID}
	 */
	static async completeFlowAction(params: FlowCheckParams): Promise<Record<string, unknown>> {
		const startTime = Date.now();

		const actualPingOneUrl = `https://auth.pingone.com/${params.environmentId}/flows/${params.flowId}`;
		const stepName = params.action === 'usernamePassword.check' 
			? 'Step 5: Complete User Lookup'
			: params.action === 'otp.check'
			? 'Step 5: Complete OTP Validation'
			: `Step 5: Complete Flow Action (${params.action})`;

		const callId = apiCallTrackerService.trackApiCall({
			method: 'POST',
			url: '/api/pingone/email-mfa-signon/complete-flow-action',
			actualPingOneUrl,
			step: stepName,
			flowType: 'email-mfa-signon',
		});

		try {
			const response = await this.pingOneFetch('/api/pingone/email-mfa-signon/complete-flow-action', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(params),
			});

			const responseClone = response.clone();
			let responseData: unknown;
			try {
				responseData = await responseClone.json();
			} catch {
				responseData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					data: responseData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = responseData as { message?: string; error?: string };
				throw new Error(
					`Failed to complete flow action: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			return responseData as Record<string, unknown>;
		} catch (error) {
			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: 0,
					statusText: 'Error',
					error: error instanceof Error ? error.message : String(error),
				},
				Date.now() - startTime
			);
			throw error;
		}
	}

	/**
	 * Step 17: Resume Flow
	 * GET /{envID}/as/resume?flowId={flowID}
	 */
	static async resumeFlow(params: ResumeFlowParams): Promise<Record<string, unknown>> {
		const startTime = Date.now();

		const actualPingOneUrl = `https://auth.pingone.com/${params.environmentId}/as/resume?flowId=${params.flowId}`;

		const callId = apiCallTrackerService.trackApiCall({
			method: 'GET',
			url: '/api/pingone/email-mfa-signon/resume-flow',
			actualPingOneUrl,
			step: 'Step 6: Resume Flow',
			flowType: 'email-mfa-signon',
		});

		try {
			const response = await this.pingOneFetch('/api/pingone/email-mfa-signon/resume-flow', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(params),
			});

			const responseClone = response.clone();
			let responseData: unknown;
			try {
				responseData = await responseClone.json();
			} catch {
				responseData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					data: responseData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = responseData as { message?: string; error?: string };
				throw new Error(
					`Failed to resume flow: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			return responseData as Record<string, unknown>;
		} catch (error) {
			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: 0,
					statusText: 'Error',
					error: error instanceof Error ? error.message : String(error),
				},
				Date.now() - startTime
			);
			throw error;
		}
	}

	/**
	 * Step 18: Get Application Secret
	 * GET /environments/{envID}/applications/{appID}/secret
	 */
	static async getApplicationSecret(
		environmentId: string,
		applicationId: string
	): Promise<Record<string, unknown>> {
		const workerToken = await this.getWorkerToken();
		const startTime = Date.now();

		const actualPingOneUrl = `https://api.pingone.com/v1/environments/${environmentId}/applications/${applicationId}/secret`;

		const callId = apiCallTrackerService.trackApiCall({
			method: 'GET',
			url: '/api/pingone/email-mfa-signon/get-application-secret',
			actualPingOneUrl,
			step: 'Step 6: Get Application Secret',
			flowType: 'email-mfa-signon',
		});

		try {
			const response = await this.pingOneFetch(
				`/api/pingone/email-mfa-signon/get-application-secret?environmentId=${environmentId}&applicationId=${applicationId}&workerToken=${encodeURIComponent(workerToken)}`,
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
				}
			);

			const responseClone = response.clone();
			let responseData: unknown;
			try {
				responseData = await responseClone.json();
			} catch {
				responseData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					data: responseData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = responseData as { message?: string; error?: string };
				throw new Error(
					`Failed to get application secret: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			return responseData as Record<string, unknown>;
		} catch (error) {
			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: 0,
					statusText: 'Error',
					error: error instanceof Error ? error.message : String(error),
				},
				Date.now() - startTime
			);
			throw error;
		}
	}

	/**
	 * Step 19: Exchange Auth Code for Token
	 * POST /{envID}/as/token
	 */
	static async exchangeCodeForToken(
		environmentId: string,
		code: string,
		clientId: string,
		clientSecret: string,
		redirectUri: string,
		codeVerifier?: string
	): Promise<Record<string, unknown>> {
		const startTime = Date.now();

		const actualPingOneUrl = `https://auth.pingone.com/${environmentId}/as/token`;

		const callId = apiCallTrackerService.trackApiCall({
			method: 'POST',
			url: '/api/pingone/email-mfa-signon/exchange-code-for-token',
			actualPingOneUrl,
			step: 'Step 6: Exchange Code for Token',
			flowType: 'email-mfa-signon',
		});

		try {
			const response = await this.pingOneFetch('/api/pingone/email-mfa-signon/exchange-code-for-token', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					environmentId,
					code,
					clientId,
					clientSecret,
					redirectUri,
					codeVerifier,
				}),
			});

			const responseClone = response.clone();
			let responseData: unknown;
			try {
				responseData = await responseClone.json();
			} catch {
				responseData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					data: responseData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = responseData as { message?: string; error?: string };
				throw new Error(
					`Failed to exchange code for token: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			return responseData as Record<string, unknown>;
		} catch (error) {
			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: 0,
					statusText: 'Error',
					error: error instanceof Error ? error.message : String(error),
				},
				Date.now() - startTime
			);
			throw error;
		}
	}
}

