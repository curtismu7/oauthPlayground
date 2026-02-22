/**
 * @file mfaReportingServiceV8.ts
 * @module v8/services
 * @description PingOne MFA Reporting Service
 * @version 8.0.0
 * @since 2024-11-19
 *
 * Implements PingOne MFA Reporting API using official dataExplorations endpoints:
 * - User authentication reports
 * - Device authentication reports
 * - FIDO2 device reports
 * - Async file generation with polling
 * - Paginated results
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
	region?: 'us' | 'eu' | 'ap' | 'ca' | 'na'; // PingOne region
	customDomain?: string; // Custom domain for PingOne API
}

export interface DataExplorationParams extends ReportParams {
	fields?: Array<{ name: string }>;
	deliverAs?: 'ENTRIES' | 'ASYNC_FILE';
	expand?: string;
}

export interface DataExplorationResponse {
	id: string;
	status: 'IN_PROGRESS' | 'SUCCESS' | 'FAILED';
	deliverAs: 'ENTRIES' | 'ASYNC_FILE';
	_embedded?: {
		entries: Array<Record<string, unknown>>;
	};
	_links?: {
		self: { href: string };
		next?: { href: string };
		csv?: { href: string };
		json?: { href: string };
	};
	password?: string; // For zip file extraction
	createdAt: string;
	updatedAt: string;
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
			scope: 'p1:read:report p1:read:environment', // Required scopes for reporting endpoints
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
					if (errorData.message?.includes('403 Forbidden')) {
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

			const reports =
				(
					reportsData as {
						_embedded?: { userMfaDeviceAuthentications?: UserAuthenticationReport[] };
					}
				)._embedded?.userMfaDeviceAuthentications || ([] as UserAuthenticationReport[]);

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

			const reports =
				(reportsData as { _embedded?: { mfaDeviceAuthentications?: DeviceAuthenticationReport[] } })
					._embedded?.mfaDeviceAuthentications || [];

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

			const reports =
				(reportsData as { _embedded?: { fido2Devices?: FIDO2DeviceReport[] } })._embedded
					?.fido2Devices || ([] as FIDO2DeviceReport[]);

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
			// Clean token - remove Bearer prefix if present and trim whitespace
			const cleanToken = accessToken.trim().replace(/^Bearer\s+/i, '');

			const proxyEndpoint = '/api/pingone/mfa/reports/create-sms-devices-report';
			const requestBody: {
				environmentId: string;
				workerToken: string;
				dataExplorationTemplateId?: string;
				fields?: Array<{ name: string }>;
				filter?: string;
				sync?: string;
				deliverAs?: string;
				region?: 'us' | 'eu' | 'ap' | 'ca' | 'na';
				customDomain?: string;
			} = {
				environmentId: params.environmentId,
				workerToken: cleanToken,
				...(params.dataExplorationTemplateId && {
					dataExplorationTemplateId: params.dataExplorationTemplateId,
				}),
				...(params.fields && { fields: params.fields }),
				...(params.filter && { filter: params.filter }),
				...(params.sync !== undefined && { sync: params.sync }),
				...(params.deliverAs && { deliverAs: params.deliverAs }),
			};

			// Include region and customDomain if provided (backend needs these to construct correct PingOne URL)
			if (params.region) {
				requestBody.region = params.region;
			}
			if (params.customDomain) {
				requestBody.customDomain = params.customDomain;
			}

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
			// Clean token - remove Bearer prefix if present and trim whitespace
			const cleanToken = accessToken.trim().replace(/^Bearer\s+/i, '');

			const proxyEndpoint = '/api/pingone/mfa/reports/create-mfa-enabled-devices-report';
			const requestBody: {
				environmentId: string;
				workerToken: string;
				dataExplorationTemplateId?: string;
				fields?: Array<{ name: string }>;
				filter?: string;
				sync?: string;
				deliverAs?: string;
				region?: 'us' | 'eu' | 'ap' | 'ca' | 'na';
				customDomain?: string;
			} = {
				environmentId: params.environmentId,
				workerToken: cleanToken,
				...(params.dataExplorationTemplateId && {
					dataExplorationTemplateId: params.dataExplorationTemplateId,
				}),
				...(params.fields && { fields: params.fields }),
				...(params.filter && { filter: params.filter }),
				...(params.sync !== undefined && { sync: params.sync }),
				...(params.deliverAs && { deliverAs: params.deliverAs }),
			};

			// Include region and customDomain if provided (backend needs these to construct correct PingOne URL)
			if (params.region) {
				requestBody.region = params.region;
			}
			if (params.customDomain) {
				requestBody.customDomain = params.customDomain;
			}

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
		console.log(`${MODULE_TAG} Polling report results`, {
			reportId: params.reportId,
			maxAttempts,
			pollInterval,
		});

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
					console.log(
						`${MODULE_TAG} Report status: ${status}, polling again in ${pollInterval}ms (attempt ${attempts}/${maxAttempts})`
					);
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

			const devicesResponse = devicesData as {
				_embedded?: { devices?: Array<Record<string, unknown>> };
			};
			const devices = devicesResponse._embedded?.devices || [];

			console.log(`${MODULE_TAG} Retrieved ${devices.length} ${deviceType} devices`);
			return devices;
		} catch (error) {
			console.error(`${MODULE_TAG} Get devices by type error:`, error);
			throw error;
		}
	}

	// ============================================================================
	// OFFICIAL DATA EXPLORATIONS API METHODS
	// ============================================================================

	/**
	 * Create a data exploration with entries returned in response
	 * @param params - Data exploration parameters
	 * @returns Data exploration with embedded entries
	 */
	static async createDataExploration(
		params: DataExplorationParams
	): Promise<DataExplorationResponse> {
		console.log(`${MODULE_TAG} Creating data exploration with entries`, params);

		try {
			const accessToken = await MFAReportingServiceV8.getWorkerToken();

			const requestBody = {
				environmentId: params.environmentId,
				workerToken: accessToken,
				fields: params.fields,
				filter: params.filter,
				deliverAs: params.deliverAs || 'ENTRIES',
				expand: params.expand || 'entries',
				region: params.region,
				customDomain: params.customDomain,
			};

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: '/api/pingone/mfa/dataExplorations',
				body: {
					...requestBody,
					workerToken: '***REDACTED***',
				},
				step: 'Create Data Exploration',
			});

			const proxyEndpoint = '/api/pingone/mfa/dataExplorations';

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
			let explorationData: DataExplorationResponse;
			try {
				explorationData = await responseClone.json();
			} catch {
				explorationData = { error: 'Failed to parse response' } as DataExplorationResponse;
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: Object.fromEntries(response.headers.entries()),
					body: explorationData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				throw new Error(
					`Failed to create data exploration: ${response.status} ${response.statusText}`
				);
			}

			console.log(`${MODULE_TAG} Data exploration created successfully`);
			return explorationData;
		} catch (error) {
			console.error(`${MODULE_TAG} Create data exploration error:`, error);
			throw error;
		}
	}

	/**
	 * Create a data exploration with results delivered as file
	 * @param params - Data exploration parameters
	 * @returns Data exploration ID for polling
	 */
	static async createAsyncDataExploration(
		params: DataExplorationParams
	): Promise<DataExplorationResponse> {
		console.log(`${MODULE_TAG} Creating async data exploration`, params);

		try {
			const accessToken = await MFAReportingServiceV8.getWorkerToken();

			const requestBody = {
				environmentId: params.environmentId,
				workerToken: accessToken,
				fields: params.fields,
				filter: params.filter,
				deliverAs: 'ASYNC_FILE',
				region: params.region,
				customDomain: params.customDomain,
			};

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: '/api/pingone/mfa/dataExplorations-async',
				body: {
					...requestBody,
					workerToken: '***REDACTED***',
				},
				step: 'Create Async Data Exploration',
			});

			const proxyEndpoint = '/api/pingone/mfa/dataExplorations-async';

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
			let explorationData: DataExplorationResponse;
			try {
				explorationData = await responseClone.json();
			} catch {
				explorationData = { error: 'Failed to parse response' } as DataExplorationResponse;
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: Object.fromEntries(response.headers.entries()),
					body: explorationData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				throw new Error(
					`Failed to create async data exploration: ${response.status} ${response.statusText}`
				);
			}

			console.log(
				`${MODULE_TAG} Async data exploration created successfully, status:`,
				explorationData.status
			);
			return explorationData;
		} catch (error) {
			console.error(`${MODULE_TAG} Create async data exploration error:`, error);
			throw error;
		}
	}

	/**
	 * Get data exploration status and results
	 * @param params - Parameters including dataExplorationId
	 * @returns Data exploration status and results
	 */
	static async getDataExplorationStatus(
		params: ReportParams & { dataExplorationId: string }
	): Promise<DataExplorationResponse> {
		console.log(`${MODULE_TAG} Getting data exploration status`, params);

		try {
			const accessToken = await MFAReportingServiceV8.getWorkerToken();

			const requestBody = {
				environmentId: params.environmentId,
				dataExplorationId: params.dataExplorationId,
				workerToken: accessToken,
				region: params.region,
				customDomain: params.customDomain,
			};

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: '/api/pingone/mfa/dataExplorations-status',
				body: {
					...requestBody,
					workerToken: '***REDACTED***',
				},
				step: 'Get Data Exploration Status',
			});

			const proxyEndpoint = '/api/pingone/mfa/dataExplorations-status';

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
			let statusData: DataExplorationResponse;
			try {
				statusData = await responseClone.json();
			} catch {
				statusData = { error: 'Failed to parse response' } as DataExplorationResponse;
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: Object.fromEntries(response.headers.entries()),
					body: statusData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				throw new Error(
					`Failed to get data exploration status: ${response.status} ${response.statusText}`
				);
			}

			console.log(`${MODULE_TAG} Data exploration status retrieved:`, statusData.status);
			return statusData;
		} catch (error) {
			console.error(`${MODULE_TAG} Get data exploration status error:`, error);
			throw error;
		}
	}

	/**
	 * Get data exploration entries (for paginated results)
	 * @param params - Parameters including dataExplorationId
	 * @returns Data exploration entries
	 */
	static async getDataExplorationEntries(
		params: ReportParams & { dataExplorationId: string }
	): Promise<{ _embedded: { entries: Array<Record<string, unknown>> }; _links?: any }> {
		console.log(`${MODULE_TAG} Getting data exploration entries`, params);

		try {
			const accessToken = await MFAReportingServiceV8.getWorkerToken();

			const requestBody = {
				environmentId: params.environmentId,
				dataExplorationId: params.dataExplorationId,
				workerToken: accessToken,
				region: params.region,
				customDomain: params.customDomain,
			};

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: '/api/pingone/mfa/dataExplorations-entries',
				body: {
					...requestBody,
					workerToken: '***REDACTED***',
				},
				step: 'Get Data Exploration Entries',
			});

			const proxyEndpoint = '/api/pingone/mfa/dataExplorations-entries';

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
			let entriesData: { _embedded: { entries: Array<Record<string, unknown>> }; _links?: any };
			try {
				entriesData = await responseClone.json();
			} catch {
				entriesData = { _embedded: { entries: [] }, error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: Object.fromEntries(response.headers.entries()),
					body: entriesData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				throw new Error(
					`Failed to get data exploration entries: ${response.status} ${response.statusText}`
				);
			}

			console.log(`${MODULE_TAG} Data exploration entries retrieved successfully`);
			return entriesData;
		} catch (error) {
			console.error(`${MODULE_TAG} Get data exploration entries error:`, error);
			throw error;
		}
	}

	/**
	 * Poll async data exploration until completion
	 * @param params - Parameters including dataExplorationId
	 * @param maxAttempts - Maximum polling attempts (default: 30)
	 * @param pollInterval - Polling interval in milliseconds (default: 2000)
	 * @returns Completed data exploration with download links
	 */
	static async pollAsyncDataExploration(
		params: ReportParams & { dataExplorationId: string },
		maxAttempts: number = 30,
		pollInterval: number = 2000
	): Promise<DataExplorationResponse> {
		console.log(`${MODULE_TAG} Starting async data exploration polling`, {
			dataExplorationId: params.dataExplorationId,
			maxAttempts,
			pollInterval,
		});

		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			try {
				const status = await MFAReportingServiceV8.getDataExplorationStatus(params);

				console.log(`${MODULE_TAG} Poll attempt ${attempt}/${maxAttempts}, status:`, status.status);

				if (status.status === 'SUCCESS') {
					console.log(`${MODULE_TAG} Data exploration completed successfully`);
					return status;
				}

				if (status.status === 'FAILED') {
					throw new Error('Data exploration failed');
				}

				// Still IN_PROGRESS, wait and poll again
				if (attempt < maxAttempts) {
					await new Promise((resolve) => setTimeout(resolve, pollInterval));
				}
			} catch (error) {
				console.error(`${MODULE_TAG} Poll attempt ${attempt} failed:`, error);
				if (attempt === maxAttempts) {
					throw error;
				}
				// Continue polling on error unless it's the last attempt
				if (attempt < maxAttempts) {
					await new Promise((resolve) => setTimeout(resolve, pollInterval));
				}
			}
		}

		throw new Error(`Data exploration polling timed out after ${maxAttempts} attempts`);
	}

	/**
	 * Create MFA devices report using official dataExplorations API
	 * @param params - Report parameters
	 * @returns MFA devices report data
	 */
	static async createMFADevicesReport(
		params: DataExplorationParams & {
			deviceType?: string;
			mfaEnabled?: boolean;
		}
	): Promise<DataExplorationResponse> {
		console.log(`${MODULE_TAG} Creating MFA devices report`, params);

		// Build filter based on parameters
		let filter = '';
		const filters = [];

		if (params.deviceType) {
			filters.push(`(deviceType eq "${params.deviceType}")`);
		}

		if (params.mfaEnabled !== undefined) {
			filters.push(`(mfaEnabled eq "${params.mfaEnabled}")`);
		}

		if (params.filter) {
			filters.push(params.filter);
		}

		if (filters.length > 0) {
			filter = filters.join(' and ');
		}

		// Default fields for MFA devices report
		const defaultFields = [
			{ name: 'userId' },
			{ name: 'username' },
			{ name: 'givenName' },
			{ name: 'familyName' },
			{ name: 'mfaEnabled' },
			{ name: 'deviceId' },
			{ name: 'deviceType' },
			{ name: 'deviceStatus' },
			{ name: 'deviceNickname' },
			{ name: 'phone' },
			{ name: 'email' },
			{ name: 'deviceCreatedAt' },
			{ name: 'deviceUpdatedAt' },
		];

		return await MFAReportingServiceV8.createDataExploration({
			...params,
			fields: params.fields || defaultFields,
			filter: filter || undefined,
		});
	}
}

export default MFAReportingServiceV8;
