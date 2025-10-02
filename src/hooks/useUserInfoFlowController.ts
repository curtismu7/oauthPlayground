// src/hooks/useUserInfoFlowController.ts
// UserInfo Flow state management and logic

import { useCallback, useState } from 'react';

export interface UserInfoConfig {
	environmentId: string;
	accessToken: string;
	userInfoEndpoint?: string;
}

export interface UserInfoResult {
	sub: string;
	name?: string;
	given_name?: string;
	family_name?: string;
	middle_name?: string;
	nickname?: string;
	preferred_username?: string;
	profile?: string;
	picture?: string;
	website?: string;
	email?: string;
	email_verified?: boolean;
	gender?: string;
	birthdate?: string;
	zoneinfo?: string;
	locale?: string;
	phone_number?: string;
	phone_number_verified?: boolean;
	address?: {
		formatted?: string;
		street_address?: string;
		locality?: string;
		region?: string;
		postal_code?: string;
		country?: string;
	};
	updated_at?: number;
	[key: string]: unknown;
}

interface UseUserInfoFlowControllerReturn {
	// State
	credentials: UserInfoConfig;
	userInfo: UserInfoResult | null;
	isRequesting: boolean;
	error: string | null;

	// Actions
	updateCredentials: (credentials: Partial<UserInfoConfig>) => void;
	fetchUserInfo: () => Promise<UserInfoResult>;
	clearResults: () => void;
}

const LOG_PREFIX = '[👤 USER-INFO]';

export const useUserInfoFlowController = (): UseUserInfoFlowControllerReturn => {
	const [credentials, setCredentials] = useState<UserInfoConfig>({
		environmentId: '',
		accessToken: '',
		userInfoEndpoint: '',
	});
	const [userInfo, setUserInfo] = useState<UserInfoResult | null>(null);
	const [isRequesting, setIsRequesting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const updateCredentials = useCallback((newCredentials: Partial<UserInfoConfig>) => {
		setCredentials(prev => ({ ...prev, ...newCredentials }));
	}, []);

	const fetchUserInfo = useCallback(async (): Promise<UserInfoResult> => {
		if (!credentials.environmentId || !credentials.accessToken) {
			throw new Error('Missing required credentials');
		}

		setIsRequesting(true);
		setError(null);

		try {
			const userInfoEndpoint = credentials.userInfoEndpoint || 
				`https://auth.pingone.com/${credentials.environmentId}/as/userinfo`;

			const response = await fetch(userInfoEndpoint, {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${credentials.accessToken}`,
					'Accept': 'application/json',
				},
			});

			if (!response.ok) {
				throw new Error(`UserInfo request failed: ${response.status} ${response.statusText}`);
			}

			const result: UserInfoResult = await response.json();
			setUserInfo(result);
			
			console.log(`${LOG_PREFIX} [SUCCESS] UserInfo fetched:`, result);
			return result;

		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'UserInfo request failed';
			setError(errorMessage);
			console.error(`${LOG_PREFIX} [ERROR] UserInfo request failed:`, err);
			throw err;
		} finally {
			setIsRequesting(false);
		}
	}, [credentials]);

	const clearResults = useCallback(() => {
		setUserInfo(null);
		setError(null);
	}, []);

	return {
		credentials,
		userInfo,
		isRequesting,
		error,
		updateCredentials,
		fetchUserInfo,
		clearResults,
	};
};
