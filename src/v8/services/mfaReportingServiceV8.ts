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
				throw new Error(`Failed to get reports: ${response.statusText}`);
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
}

export default MFAReportingServiceV8;
