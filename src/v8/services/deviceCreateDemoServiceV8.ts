// src/v8/services/deviceCreateDemoServiceV8.ts
/**
 * @module v8/services
 * @description Educational service for sending custom PingOne Create Device requests
 */

import { apiCallTrackerService } from '@/services/apiCallTrackerService';
import pingOneFetch from '@/utils/pingOneFetch';

const MODULE_TAG = '[🧪 DEVICE-CREATE-DEMO-V8]';

export interface DeviceCreateDemoRequest {
	environmentId: string;
	userId: string;
	workerToken: string;
	payload: Record<string, unknown>;
	description?: string;
}

/**
 * Sends Create Device requests via the backend proxy while tracking API activity.
 */
export async function sendCreateDeviceRequest(
	request: DeviceCreateDemoRequest
): Promise<Record<string, unknown>> {
	const { environmentId, userId, workerToken, payload, description } = request;

	const trimmedEnvironment = environmentId.trim();
	const trimmedUserId = userId.trim();
	const trimmedToken = workerToken.trim();

	if (!trimmedEnvironment || !trimmedUserId || !trimmedToken) {
		throw new Error('Environment ID, User ID, and Worker Token are required.');
	}

	const startTime = Date.now();
	const callId = apiCallTrackerService.trackApiCall({
		method: 'POST',
		url: '/api/pingone/mfa/create-device-payload',
		actualPingOneUrl: `https://api.pingone.com/v1/environments/${trimmedEnvironment}/users/${trimmedUserId}/devices`,
		headers: {
			'Content-Type': 'application/json',
		},
		body: {
			environmentId: trimmedEnvironment,
			userId: trimmedUserId,
			workerToken: trimmedToken,
			payload,
			description,
		},
		step: description ? `mfa-${description}` : 'mfa-Create Device Demo',
		flowType: 'mfa',
		isProxy: true,
		source: 'frontend',
	});

	try {
		const response = await pingOneFetch('/api/pingone/mfa/create-device-payload', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				environmentId: trimmedEnvironment,
				userId: trimmedUserId,
				workerToken: trimmedToken,
				payload,
			}),
			retry: {
				maxAttempts: 2,
			},
		});

		let responseData: unknown;
		try {
			responseData = await response.json();
		} catch {
			const raw = await response.text();
			responseData = raw ? { raw } : null;
		}

		apiCallTrackerService.updateApiCallResponse(
			callId,
			{
				status: response.status,
				statusText: response.statusText,
				data: responseData ?? undefined,
			},
			Date.now() - startTime
		);

		if (!response.ok) {
			const errorData = responseData as { message?: string; error?: string } | null;
			throw new Error(
				errorData?.message ||
					errorData?.error ||
					`PingOne create device failed with status ${response.status}`
			);
		}

		console.log(`${MODULE_TAG} Device created successfully for user ${trimmedUserId}`);
		return (responseData as Record<string, unknown>) ?? {};
	} catch (error) {
		console.error(`${MODULE_TAG} Create device request failed`, error);
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
}

export const deviceCreateDemoServiceV8 = {
	sendCreateDeviceRequest,
};

export default deviceCreateDemoServiceV8;

