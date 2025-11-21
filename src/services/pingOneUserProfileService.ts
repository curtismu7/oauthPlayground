// src/services/pingOneUserProfileService.ts
// Helper utilities for resolving PingOne users by identifier (ID, username, email)

import { trackedFetch } from '../utils/trackedFetch';

export type LookupMatchType = 'id' | 'username' | 'email';

interface LookupPingOneUserParams {
	environmentId: string;
	accessToken: string;
	identifier: string;
}

interface LookupPingOneUserResult {
	user?: Record<string, unknown> | null;
	matchType?: LookupMatchType;
}

const parseErrorResponse = async (response: Response) => {
	try {
		return await response.json();
	} catch {
		return {};
	}
};

export const lookupPingOneUser = async ({
	environmentId,
	accessToken,
	identifier,
}: LookupPingOneUserParams): Promise<LookupPingOneUserResult> => {
	// Validate inputs before making the request
	if (!environmentId || environmentId.trim() === '') {
		console.error('[lookupPingOneUser] ❌ Missing environmentId:', {
			environmentId: environmentId || '(empty)',
			type: typeof environmentId,
		});
		throw new Error('Environment ID is required');
	}
	if (!accessToken || accessToken.trim() === '') {
		console.error('[lookupPingOneUser] ❌ Missing accessToken:', {
			hasToken: !!accessToken,
			tokenLength: accessToken ? accessToken.length : 0,
		});
		throw new Error('Access token is required');
	}
	if (!identifier || identifier.trim() === '') {
		console.error('[lookupPingOneUser] ❌ Missing identifier:', {
			identifier: identifier || '(empty)',
			type: typeof identifier,
		});
		throw new Error('User identifier is required');
	}

	// Construct the actual PingOne API URL for display purposes
	// The backend may make different calls (direct ID lookup or filter-based search),
	// but we show the base users endpoint to represent the PingOne Users API
	const actualPingOneUrl = `https://api.pingone.com/v1/environments/${encodeURIComponent(environmentId)}/users`;

	console.log('[lookupPingOneUser] 📤 Sending user lookup request:', {
		environmentId: `${environmentId.substring(0, 20)}...`,
		accessToken: `${accessToken.substring(0, 20)}...`,
		identifier: identifier.substring(0, 30),
		actualPingOneUrl,
	});

	const response = await trackedFetch('/api/pingone/users/lookup', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ environmentId, accessToken, identifier }),
		actualPingOneUrl, // Show the actual PingOne API endpoint
	});

	if (!response.ok) {
		if (response.status === 500) {
			const error = new Error('BACKEND_SERVER_ERROR');
			(error as Error & { isServerError?: boolean }).isServerError = true;
			throw error;
		}

		if (response.status === 401) {
			throw new Error(
				'Worker token is unauthorized or expired. Generate a new worker token with p1:read:user scope.'
			);
		}

		if (response.status === 403) {
			throw new Error(
				'Worker token lacks required permissions. Ensure it includes p1:read:user scope.'
			);
		}

		if (response.status === 400) {
			throw new Error(
				'PingOne rejected the lookup request. Verify the user identifier format and try again.'
			);
		}

		const errorBody = await parseErrorResponse(response);
		const message =
			errorBody?.error_description ||
			errorBody?.message ||
			errorBody?.error ||
			'Unable to locate user with the provided identifier.';
		throw new Error(message);
	}

	return (await response.json()) as LookupPingOneUserResult;
};
