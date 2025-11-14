// src/components/password-reset/shared/useUserLookup.ts
// Shared hook for user lookup functionality used across password reset tabs

import { useState, useCallback } from 'react';
import { lookupPingOneUser } from '../../../services/pingOneUserProfileService';
import { v4ToastManager } from '../../../utils/v4ToastMessages';
// PingOneUser type definition
export interface PingOneUser {
	id: string;
	username?: string;
	email?: string;
	emails?: Array<{ value: string; primary?: boolean }>;
	name?: string;
	[key: string]: unknown;
}

interface UseUserLookupResult {
	user: PingOneUser | null;
	loading: boolean;
	lookupUser: (identifier: string) => Promise<void>;
	resetUser: () => void;
}

export const useUserLookup = (
	environmentId: string,
	workerToken: string
): UseUserLookupResult => {
	const [user, setUser] = useState<PingOneUser | null>(null);
	const [loading, setLoading] = useState(false);

	const lookupUser = useCallback(async (identifier: string) => {
		if (!identifier || !workerToken || !environmentId) {
			const missing = [];
			if (!identifier) missing.push('identifier');
			if (!workerToken) missing.push('worker token');
			if (!environmentId) missing.push('environment ID');
			console.error('[useUserLookup] Missing required parameters:', missing, {
				identifier: identifier ? `${identifier.substring(0, 10)}...` : 'empty',
				workerToken: workerToken ? `${workerToken.substring(0, 10)}...` : 'empty',
				environmentId: environmentId || 'empty',
				identifierLength: identifier?.length || 0,
				workerTokenLength: workerToken?.length || 0,
			});
			v4ToastManager.showError(`Please configure: ${missing.join(', ')}`);
			return;
		}

		const trimmedIdentifier = identifier.trim();
		if (!trimmedIdentifier) {
			v4ToastManager.showError('Please enter a username, email, or user ID');
			return;
		}

		setLoading(true);
		try {
			console.log('[useUserLookup] Looking up user:', {
				hasEnvironmentId: !!environmentId,
				hasWorkerToken: !!workerToken,
				identifierLength: trimmedIdentifier.length,
				identifierPreview: trimmedIdentifier.substring(0, 20),
			});
			
			const result = await lookupPingOneUser({
				environmentId,
				accessToken: workerToken,
				identifier: trimmedIdentifier,
			});

			if (result.user) {
				setUser(result.user);
				v4ToastManager.showSuccess('User found successfully');
			} else {
				v4ToastManager.showError('User not found');
				setUser(null);
			}
		} catch (error) {
			v4ToastManager.showError(error instanceof Error ? error.message : 'Failed to lookup user');
			setUser(null);
		} finally {
			setLoading(false);
		}
	}, [environmentId, workerToken]);

	const resetUser = useCallback(() => {
		setUser(null);
	}, []);

	return {
		user,
		loading,
		lookupUser,
		resetUser,
	};
};

