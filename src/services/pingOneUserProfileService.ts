// src/services/pingOneUserProfileService.ts
// Helper utilities for resolving PingOne users by identifier (ID, username, email)

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
	} catch (error) {
		return {};
	}
};

export const lookupPingOneUser = async ({
	environmentId,
	accessToken,
	identifier,
}: LookupPingOneUserParams): Promise<LookupPingOneUserResult> => {
	const response = await fetch('/api/pingone/users/lookup', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ environmentId, accessToken, identifier }),
	});

	if (!response.ok) {
		if (response.status === 500) {
			const error = new Error('BACKEND_SERVER_ERROR');
			(error as any).isServerError = true;
			throw error;
		}

		if (response.status === 401) {
			throw new Error('Worker token is unauthorized or expired. Generate a new worker token with p1:read:user scope.');
		}

		if (response.status === 403) {
			throw new Error('Worker token lacks required permissions. Ensure it includes p1:read:user scope.');
		}

		if (response.status === 400) {
			throw new Error('PingOne rejected the lookup request. Verify the user identifier format and try again.');
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


