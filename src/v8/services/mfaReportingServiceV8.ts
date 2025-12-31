/**
 * @file mfaReportingServiceV8.ts
 * @module v8/services
 * @description PingOne MFA Reporting Service
 * @version 8.0.0
 * @since 2024-11-19
 *
 * Implements PingOne MFA Reporting API:
 * - User authentication reports
 * - Device authentication reports
 * - FIDO2 device reports
 *
 * API Reference: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#reporting
 */

import { apiCallTrackerService } from '@/services/apiCallTrackerService';
import { workerTokenServiceV8 } from './workerTokenServiceV8';

const MODULE_TAG = '[📊 MFA-REPORTING-V8]';

export interface ReportParams {
	environmentId: string;
	startDate?: string; // ISO 8601 format
	endDate?: string; // ISO 8601 format
	limit?: number;
	filter?: string;
}

export interface UserAuthenticationReport {
	id: string;
	user: {
		id: string;
		username?: string;
	};
	device: {
		id: string;
		type: string;
	};
	status: string;
	createdAt: string;
	[key: string]: unknown;
}

export interface DeviceAuthenticationReport {
	id: string;
	device: {
		id: string;
		type: string;
	};
	status: string;
	createdAt: string;
	[key: string]: unknown;
}

export interface FIDO2DeviceReport {
	id: string;
	user: {
		id: string;
	};
	device: {
		id: string;
		type: string;
		name?: string;
	};
	createdAt: string;
	[key: string]: unknown;
}

/**
 * MFAReportingServiceV8
 *
 * Service for PingOne MFA reporting operations
 */
export class MFAReportingServiceV8 {
	/**
	 * Get worker token from WorkerTokenServiceV8
	 * @returns Access token
	 */
	private static async getWorkerToken(): Promise<string> {
		console.log(`${MODULE_TAG} Getting worker token`);

		const cachedToken = await workerTokenServiceV8.getToken();
		if (cachedToken) {
			return cachedToken;
		}

		const credentials = await workerTokenServiceV8.loadCredentials();
		if (!credentials) {
			throw new Error('No worker token credentials found');
		}

		const tokenEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/token`;
		const requestBody = {
			grant_type: 'client_credentials',
			client_id: credentials.clientId,
			client_secret: credentials.clientSecret,
		};

		const response = await fetch(tokenEndpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: new URLSearchParams(requestBody),
		});

		if (!response.ok) {
			throw new Error('Failed to get worker token');
		}

		const data = await response.json();
		const expiresAt = data.expires_in ? Date.now() + data.expires_in * 1000 : undefined;
		await workerTokenServiceV8.saveToken(data.access_token, expiresAt);

		return data.access_token;
	}

	/**
	 * Get user authentication reports
	 * @param params - Report parameters
	 * @returns List of user authentication reports
	 */
	static async getUserAuthenticationReports(
		params: ReportParams
	): Promise<UserAuthenticationReport[]> {
		console.log(`${MODULE_TAG} Getting user authentication reports`, params);

		try {
			const accessToken = await MFAReportingServiceV8.getWorkerToken();

			// Build query parameters
			const queryParams = new URLSearchParams();
			if (params.startDate) queryParams.append('filter', `createdAt ge "${params.startDate}"`);
			if (params.endDate) queryParams.append('filter', `createdAt le "${params.endDate}"`);
			if (params.limit) queryParams.append('limit', params.limit.toString());

			// Use backend proxy to avoid CORS issues
			const proxyEndpoint = '/api/pingone/mfa/user-authentication-reports';
			const requestBody = {
				environmentId: params.environmentId,
				queryParams: queryParams.toString(),
				workerToken: accessToken,
			};

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: proxyEndpoint,
				body: {
					...requestBody,
					workerToken: '***REDACTED***',
				},
				step: 'Get User Authentication Reports',
			});

			let response: Response;
			try {
				response = await fetch(proxyEndpoint, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(requestBody),
				});
			} catch (error) {
				apiCallTrackerService.updateApiCallResponse(
					callId,
					{
						status: 0,
						statusText: 'Network Error',
						error: error instanceof Error ? error.message : String(error),
					},
					Date.now() - startTime
				);
				throw error;
			}

			const responseClone = response.clone();
			let reportsData: unknown;
			try {
				reportsData = await responseClone.json();
			} catch {
				reportsData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: Object.fromEntries(response.headers.entries()),
					data: reportsData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = reportsData as { 
					error?: string; 
					message?: string; 
					details?: unknown;
					endpoint?: string;
				};
				
				// Use the enhanced error message from backend if available
				const errorMessage = errorData.message || errorData.error || response.statusText;
				
				// Provide more helpful error messages for common issues
				if (response.status === 403) {
					// Check if backend provided enhanced error message
					if (errorData.message && errorData.message.includes('403 Forbidden')) {
						throw new Error(errorData.message);
					}
					
					// Otherwise, provide our own enhanced message
					throw new Error(
						`Access denied (403 Forbidden). Your worker token may not have the required permissions. ` +
						`Required scope: p1:read:environment or p1:read:report. ` +
						`Note: User authentication reports may require additional MFA reporting permissions. ` +
						`Original error: ${errorMessage}`
					);
				}
				
				throw new Error(`Failed to get reports: ${errorMessage}`);
			}

			const reports = (reportsData as { _embedded?: { userMfaDeviceAuthentications?: UserAuthenticationReport[] } })._embedded?.userMfaDeviceAuthentications || [] as UserAuthenticationReport[];

			console.log(`${MODULE_TAG} Retrieved ${reports.length} user authentication reports`);
			return reports;
		} catch (error) {
			console.error(`${MODULE_TAG} Get user authentication reports error`, error);
			throw error;
		}
	}

	/**
	 * Get device authentication reports
	 * @param params - Report parameters
	 * @returns List of device authentication reports
	 */
	static async getDeviceAuthenticationReports(
		params: ReportParams
	): Promise<DeviceAuthenticationReport[]> {
		console.log(`${MODULE_TAG} Getting device authentication reports`, params);

		try {
			const accessToken = await MFAReportingServiceV8.getWorkerToken();

			const queryParams = new URLSearchParams();
			if (params.startDate) queryParams.append('filter', `createdAt ge "${params.startDate}"`);
			if (params.endDate) queryParams.append('filter', `createdAt le "${params.endDate}"`);
			if (params.limit) queryParams.append('limit', params.limit.toString());

			// Use backend proxy to avoid CORS issues
			const proxyEndpoint = '/api/pingone/mfa/device-authentication-reports';
			const requestBody = {
				environmentId: params.environmentId,
				queryParams: queryParams.toString(),
				workerToken: accessToken,
			};

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: proxyEndpoint,
				body: {
					...requestBody,
					workerToken: '***REDACTED***',
				},
				step: 'Get Device Authentication Reports',
			});

			let response: Response;
			try {
				response = await fetch(proxyEndpoint, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(requestBody),
				});
			} catch (error) {
				apiCallTrackerService.updateApiCallResponse(
					callId,
					{
						status: 0,
						statusText: 'Network Error',
						error: error instanceof Error ? error.message : String(error),
					},
					Date.now() - startTime
				);
				throw error;
			}

			const responseClone = response.clone();
			let reportsData: unknown;
			try {
				reportsData = await responseClone.json();
			} catch {
				reportsData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: Object.fromEntries(response.headers.entries()),
					data: reportsData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				throw new Error(`Failed to get reports: ${response.statusText}`);
			}

			const reports = (reportsData as { _embedded?: { mfaDeviceAuthentications?: DeviceAuthenticationReport[] } })._embedded?.mfaDeviceAuthentications || [];

			console.log(`${MODULE_TAG} Retrieved ${reports.length} device authentication reports`);
			return reports;
		} catch (error) {
			console.error(`${MODULE_TAG} Get device authentication reports error`, error);
			throw error;
		}
	}

	/**
	 * Get FIDO2 device reports
	 * @param params - Report parameters
	 * @returns List of FIDO2 device reports
	 */
	static async getFIDO2DeviceReports(params: ReportParams): Promise<FIDO2DeviceReport[]> {
		console.log(`${MODULE_TAG} Getting FIDO2 device reports`, params);

		try {
			const accessToken = await MFAReportingServiceV8.getWorkerToken();

			const queryParams = new URLSearchParams();
			if (params.limit) queryParams.append('limit', params.limit.toString());

			// Use backend proxy to avoid CORS issues
			const proxyEndpoint = '/api/pingone/mfa/fido2-device-reports';
			const requestBody = {
				environmentId: params.environmentId,
				queryParams: queryParams.toString(),
				workerToken: accessToken,
			};

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: proxyEndpoint,
				body: {
					...requestBody,
					workerToken: '***REDACTED***',
				},
				step: 'Get FIDO2 Device Reports',
			});

			let response: Response;
			try {
				response = await fetch(proxyEndpoint, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(requestBody),
				});
			} catch (error) {
				apiCallTrackerService.updateApiCallResponse(
					callId,
					{
						status: 0,
						statusText: 'Network Error',
						error: error instanceof Error ? error.message : String(error),
					},
					Date.now() - startTime
				);
				throw error;
			}

			const responseClone = response.clone();
			let reportsData: unknown;
			try {
				reportsData = await responseClone.json();
			} catch {
				reportsData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: Object.fromEntries(response.headers.entries()),
					data: reportsData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				throw new Error(`Failed to get reports: ${response.statusText}`);
			}

			const reports = (reportsData as { _embedded?: { fido2Devices?: FIDO2DeviceReport[] } })._embedded?.fido2Devices || [] as FIDO2DeviceReport[];

		console.log(`${MODULE_TAG} Retrieved ${reports.length} FIDO2 device reports`);
		return reports;
	} catch (error) {
		console.error(`${MODULE_TAG} Get FIDO2 device reports error`, error);
		throw error;
	}
	}

	/**
	 * Create report of SMS devices - entries in response
	 * POST /v1/environments/{envID}/reports/smsDevices
	 * API Reference: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-create-report-of-sms-devices---entries-in-response
	 * @param params - Report parameters
	 * @returns Report data with embedded entries
	 */
	static async createSMSDevicesReport(
		params: ReportParams & { 
			filter?: string;
			dataExplorationTemplateId?: string;
			fields?: Array<{ name: string }>;
			sync?: string;
			deliverAs?: string;
		}
	): Promise<Record<string, unknown>> {
		console.log(`${MODULE_TAG} Creating SMS devices report`, params);

		try {
			const accessToken = await MFAReportingServiceV8.getWorkerToken();

			const proxyEndpoint = '/api/pingone/mfa/reports/create-sms-devices-report';
			const requestBody = {
				environmentId: params.environmentId,
				workerToken: accessToken,
				...(params.dataExplorationTemplateId && { dataExplorationTemplateId: params.dataExplorationTemplateId }),
				...(params.fields && { fields: params.fields }),
				...(params.filter && { filter: params.filter }),
				...(params.sync !== undefined && { sync: params.sync }),
				...(params.deliverAs && { deliverAs: params.deliverAs }),
			};

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: proxyEndpoint,
				body: {
					...requestBody,
					workerToken: '***REDACTED***',
				},
				step: 'Create SMS Devices Report',
			});

			let response: Response;
			try {
				response = await fetch(proxyEndpoint, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(requestBody),
				});
			} catch (error) {
				apiCallTrackerService.updateApiCallResponse(
					callId,
					{
						status: 0,
						statusText: 'Network Error',
						error: error instanceof Error ? error.message : String(error),
					},
					Date.now() - startTime
				);
				throw error;
			}

			const responseClone = response.clone();
			let reportData: unknown;
			try {
				reportData = await responseClone.json();
			} catch {
				reportData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: Object.fromEntries(response.headers.entries()),
					data: reportData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = reportData as { error?: string; message?: string; details?: unknown };
				const errorMessage = errorData.message || errorData.error || response.statusText;
				
				if (response.status === 403) {
					throw new Error(
						`Access denied (403 Forbidden). Your worker token may not have the required permissions. ` +
						`Required scope: p1:read:report or p1:read:environment. ` +
						`Original error: ${errorMessage}`
					);
				}
				
				throw new Error(`Failed to create SMS devices report: ${errorMessage}`);
			}

			console.log(`${MODULE_TAG} SMS devices report created successfully`);
			return reportData as Record<string, unknown>;
		} catch (error) {
			console.error(`${MODULE_TAG} Create SMS devices report error`, error);
			throw error;
		}
	}

	/**
	 * Get report results - entries in response
	 * GET /v1/environments/{envID}/reports/{reportID}
	 * API Reference: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#get-get-report-results---entries-in-response
	 * @param params - Report parameters including reportId
	 * @returns Report data with embedded entries
	 */
	static async getReportResults(
		params: ReportParams & { reportId: string }
	): Promise<Record<string, unknown>> {
		console.log(`${MODULE_TAG} Getting report results`, params);

		try {
			const accessToken = await MFAReportingServiceV8.getWorkerToken();

			const proxyEndpoint = '/api/pingone/mfa/reports/get-report-results';
			const requestBody = {
				environmentId: params.environmentId,
				reportId: params.reportId,
				workerToken: accessToken,
			};

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: proxyEndpoint,
				body: {
					...requestBody,
					workerToken: '***REDACTED***',
				},
				step: 'Get Report Results',
			});

			let response: Response;
			try {
				response = await fetch(proxyEndpoint, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(requestBody),
				});
			} catch (error) {
				apiCallTrackerService.updateApiCallResponse(
					callId,
					{
						status: 0,
						statusText: 'Network Error',
						error: error instanceof Error ? error.message : String(error),
					},
					Date.now() - startTime
				);
				throw error;
			}

			const responseClone = response.clone();
			let reportData: unknown;
			try {
				reportData = await responseClone.json();
			} catch {
				reportData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: Object.fromEntries(response.headers.entries()),
					data: reportData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = reportData as { error?: string; message?: string; details?: unknown };
				const errorMessage = errorData.message || errorData.error || response.statusText;
				
				if (response.status === 403) {
					throw new Error(
						`Access denied (403 Forbidden). Your worker token may not have the required permissions. ` +
						`Required scope: p1:read:report or p1:read:environment. ` +
						`Original error: ${errorMessage}`
					);
				}
				
				throw new Error(`Failed to get report results: ${errorMessage}`);
			}

			console.log(`${MODULE_TAG} Report results retrieved successfully`);
			return reportData as Record<string, unknown>;
		} catch (error) {
			console.error(`${MODULE_TAG} Get report results error`, error);
			throw error;
		}
	}

	/**
	 * Create report of MFA-enabled devices - results in file
	 * POST /v1/environments/{envID}/reports/mfaEnabledDevices
	 * API Reference: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-create-report-of-mfa-enabled-devices---results-in-file
	 * @param params - Report parameters
	 * @returns Report job ID and status (requires polling)
	 */
	static async createMFAEnabledDevicesReport(
		params: ReportParams & { 
			filter?: string;
			dataExplorationTemplateId?: string;
			fields?: Array<{ name: string }>;
			sync?: string;
			deliverAs?: string;
		}
	): Promise<Record<string, unknown>> {
		console.log(`${MODULE_TAG} Creating MFA-enabled devices report`, params);

		try {
			const accessToken = await MFAReportingServiceV8.getWorkerToken();

			const proxyEndpoint = '/api/pingone/mfa/reports/create-mfa-enabled-devices-report';
			const requestBody = {
				environmentId: params.environmentId,
				workerToken: accessToken,
				...(params.dataExplorationTemplateId && { dataExplorationTemplateId: params.dataExplorationTemplateId }),
				...(params.fields && { fields: params.fields }),
				...(params.filter && { filter: params.filter }),
				...(params.sync !== undefined && { sync: params.sync }),
				...(params.deliverAs && { deliverAs: params.deliverAs }),
			};

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: proxyEndpoint,
				body: {
					...requestBody,
					workerToken: '***REDACTED***',
				},
				step: 'Create MFA-Enabled Devices Report',
			});

			let response: Response;
			try {
				response = await fetch(proxyEndpoint, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(requestBody),
				});
			} catch (error) {
				apiCallTrackerService.updateApiCallResponse(
					callId,
					{
						status: 0,
						statusText: 'Network Error',
						error: error instanceof Error ? error.message : String(error),
					},
					Date.now() - startTime
				);
				throw error;
			}

			const responseClone = response.clone();
			let reportData: unknown;
			try {
				reportData = await responseClone.json();
			} catch {
				reportData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: Object.fromEntries(response.headers.entries()),
					data: reportData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = reportData as { error?: string; message?: string; details?: unknown };
				const errorMessage = errorData.message || errorData.error || response.statusText;
				
				if (response.status === 403) {
					throw new Error(
						`Access denied (403 Forbidden). Your worker token may not have the required permissions. ` +
						`Required scope: p1:read:report or p1:read:environment. ` +
						`Original error: ${errorMessage}`
					);
				}
				
				throw new Error(`Failed to create MFA-enabled devices report: ${errorMessage}`);
			}

			console.log(`${MODULE_TAG} MFA-enabled devices report created successfully`, {
				reportId: (reportData as { id?: string })?.id,
				status: (reportData as { status?: string })?.status,
			});
			return reportData as Record<string, unknown>;
		} catch (error) {
			console.error(`${MODULE_TAG} Create MFA-enabled devices report error`, error);
			throw error;
		}
	}

	/**
	 * Poll report results - results in file
	 * GET /v1/environments/{envID}/reports/{reportID}
	 * Polls for report results when stored in a file
	 * @param params - Report parameters including reportId
	 * @param maxAttempts - Maximum number of polling attempts (default: 10)
	 * @param pollInterval - Polling interval in milliseconds (default: 2000)
	 * @returns Report data with download link when ready
	 */
	static async pollReportResults(
		params: ReportParams & { reportId: string },
		maxAttempts: number = 10,
		pollInterval: number = 2000
	): Promise<Record<string, unknown>> {
		console.log(`${MODULE_TAG} Polling report results`, { reportId: params.reportId, maxAttempts, pollInterval });

		let attempts = 0;
		while (attempts < maxAttempts) {
			try {
				const reportData = await MFAReportingServiceV8.getReportResults(params);
				const status = (reportData as { status?: string })?.status;

				if (status === 'COMPLETED') {
					console.log(`${MODULE_TAG} Report completed successfully`);
					return reportData;
				}

				if (status === 'FAILED') {
					throw new Error('Report generation failed');
				}

				// Status is PENDING or IN_PROGRESS, continue polling
				attempts++;
				if (attempts < maxAttempts) {
					console.log(`${MODULE_TAG} Report status: ${status}, polling again in ${pollInterval}ms (attempt ${attempts}/${maxAttempts})`);
					await new Promise((resolve) => setTimeout(resolve, pollInterval));
				}
			} catch (error) {
				// If it's a non-retryable error, throw immediately
				if (error instanceof Error && error.message.includes('403 Forbidden')) {
					throw error;
				}
				// Otherwise, retry
				attempts++;
				if (attempts >= maxAttempts) {
					throw error;
				}
				await new Promise((resolve) => setTimeout(resolve, pollInterval));
			}
		}

		throw new Error(`Report polling timed out after ${maxAttempts} attempts`);
	}

	/**
	 * Get devices filtered by type (for FIDO2, Email, TOTP reports)
	 * Uses GET /v1/environments/{envID}/users/{userID}/devices with SCIM filter
	 * API Reference: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#get-read-all-mfa-user-devices
	 * @param params - Report parameters including username
	 * @param deviceType - Device type to filter (FIDO2, EMAIL, TOTP)
	 * @returns List of devices filtered by type
	 */
	static async getDevicesByType(
		params: ReportParams & { username: string },
		deviceType: 'FIDO2' | 'EMAIL' | 'TOTP'
	): Promise<Array<Record<string, unknown>>> {
		console.log(`${MODULE_TAG} Getting devices by type`, { deviceType, username: params.username });

		try {
			const accessToken = await MFAReportingServiceV8.getWorkerToken();

			// First, lookup user by username to get userId
			const { MFAServiceV8 } = await import('./mfaServiceV8');
			const user = await MFAServiceV8.lookupUserByUsername(params.environmentId, params.username);

			// Use the get-all-devices endpoint with SCIM filter
			const proxyEndpoint = '/api/pingone/mfa/get-all-devices';
			const requestBody = {
				environmentId: params.environmentId,
				userId: user.id,
				workerToken: accessToken,
				filter: `type eq "${deviceType}"`,
			};

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: proxyEndpoint,
				body: {
					...requestBody,
					workerToken: '***REDACTED***',
				},
				step: `Get ${deviceType} Devices Report`,
			});

			let response: Response;
			try {
				response = await fetch(proxyEndpoint, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(requestBody),
				});
			} catch (error) {
				apiCallTrackerService.updateApiCallResponse(
					callId,
					{
						status: 0,
						statusText: 'Network Error',
						error: error instanceof Error ? error.message : String(error),
					},
					Date.now() - startTime
				);
				throw error;
			}

			const responseClone = response.clone();
			let devicesData: unknown;
			try {
				devicesData = await responseClone.json();
			} catch {
				devicesData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: Object.fromEntries(response.headers.entries()),
					data: devicesData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = devicesData as { error?: string; message?: string; details?: unknown };
				const errorMessage = errorData.message || errorData.error || response.statusText;
				throw new Error(`Failed to get ${deviceType} devices: ${errorMessage}`);
			}

			const devicesResponse = devicesData as { _embedded?: { devices?: Array<Record<string, unknown>> } };
			const devices = devicesResponse._embedded?.devices || [];

			console.log(`${MODULE_TAG} Retrieved ${devices.length} ${deviceType} devices`);
			return devices;
		} catch (error) {
			console.error(`${MODULE_TAG} Get ${deviceType} devices error`, error);
			throw error;
		}
	}
}

export default MFAReportingServiceV8;
