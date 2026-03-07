// src/pages/flows/OAuthAuthorizationCodeFlowV7_1/hooks/useCredentialPersistence.ts
// V7.1 Credential Persistence Hook - Ensures proper credential storage in NewAuthContext

import { useCallback, useEffect } from 'react';
import { FLOW_CONSTANTS } from '../constants/flowConstants';
import type { FlowCredentials } from '../types/flowTypes';
import { saveFlowCredentialsIsolated } from '../../../../services/flowCredentialService';
import { logger } from '../../../../utils/logger';

interface UseCredentialPersistenceProps {
	credentials: FlowCredentials;
	onCredentialsChange?: (credentials: FlowCredentials) => void;
}

export const useCredentialPersistence = ({
	credentials,
	onCredentialsChange,
}: UseCredentialPersistenceProps) => {
	// Validate required credential fields
	const validateCredentials = useCallback((creds: FlowCredentials): boolean => {
		const requiredFields = ['environmentId', 'clientId', 'clientSecret', 'redirectUri', 'scope'];
		const missingFields = requiredFields.filter(field => !creds[field as keyof FlowCredentials]);
		
		if (missingFields.length > 0) {
			logger.warn('CredentialPersistence', 'Missing required fields:', missingFields);
			return false;
		}
		
		return true;
	}, []);

	// Ensure PingOne-specific scopes are included
	const ensurePingOneScopes = useCallback((scope: string): string => {
		const pingOneScopes = ['openid', 'profile', 'email', 'consents'];
		const currentScopes = scope.split(' ').map(s => s.trim());
		
		// Add missing PingOne scopes
		const missingScopes = pingOneScopes.filter(
			pingScope => !currentScopes.includes(pingScope)
		);
		
		if (missingScopes.length > 0) {
			const updatedScopes = [...currentScopes, ...missingScopes];
			const newScope = updatedScopes.join(' ');
			logger.info('CredentialPersistence', 'Updated scope to include PingOne permissions:', {
				original: scope,
				updated: newScope,
				added: missingScopes,
			});
			return newScope;
		}
		
		return scope;
	}, []);

	// Persist credentials to NewAuthContext storage
	const persistCredentials = useCallback(async (creds: FlowCredentials) => {
		try {
			// Validate credentials first
			if (!validateCredentials(creds)) {
				logger.error('CredentialPersistence', 'Credential validation failed', {});
				return false;
			}

			// Ensure PingOne scopes are included
			const updatedCredentials = {
				...creds,
				scope: ensurePingOneScopes(creds.scope),
			};

			// Save to V7 FlowCredentialService (isolated storage)
			await saveFlowCredentialsIsolated(
				FLOW_CONSTANTS.FLOW_KEY,
				updatedCredentials,
				undefined, // flowConfig
				undefined, // additionalState
				{ showToast: false, useSharedFallback: false } // Important: Don't share with other flows
			);

			// Also save to NewAuthContext compatible storage
			const newAuthContextKey = `oauth-authorization-code-v7-credentials`;
			sessionStorage.setItem(newAuthContextKey, JSON.stringify(updatedCredentials));

			logger.info('CredentialPersistence', 'Credentials persisted successfully', {
				flowKey: FLOW_CONSTANTS.FLOW_KEY,
				environmentId: updatedCredentials.environmentId,
				clientId: updatedCredentials.clientId,
				scope: updatedCredentials.scope,
			});

			return true;
		} catch (error) {
			logger.error('CredentialPersistence', 'Failed to persist credentials', { error: String(error) });
			return false;
		}
	}, [validateCredentials, ensurePingOneScopes]);

	// Load credentials from storage
	const loadCredentials = useCallback(async (): Promise<FlowCredentials | null> => {
		try {
			// Try NewAuthContext compatible storage first
			const newAuthContextKey = `oauth-authorization-code-v7-credentials`;
			const stored = sessionStorage.getItem(newAuthContextKey);
			
			if (stored) {
				const credentials = JSON.parse(stored) as FlowCredentials;
				
				// Validate loaded credentials
				if (validateCredentials(credentials)) {
					logger.info('CredentialPersistence', 'Credentials loaded from NewAuthContext storage');
					return credentials;
				}
			}

			// Fallback to V7 FlowCredentialService
			const v7Stored = sessionStorage.getItem(`${FLOW_CONSTANTS.STORAGE_KEYS.APP_CONFIG}`);
			if (v7Stored) {
				const credentials = JSON.parse(v7Stored) as FlowCredentials;
				
				if (validateCredentials(credentials)) {
					// Migrate to NewAuthContext storage
					await persistCredentials(credentials);
					logger.info('CredentialPersistence', 'Credentials migrated from V7 to NewAuthContext');
					return credentials;
				}
			}

			logger.info('CredentialPersistence', 'No stored credentials found');
			return null;
		} catch (error) {
			logger.error('CredentialPersistence', 'Failed to load credentials', { error: String(error) });
			return null;
		}
	}, [validateCredentials, persistCredentials]);

	// Auto-persist credentials when they change
	useEffect(() => {
		if (credentials && validateCredentials(credentials)) {
			persistCredentials(credentials);
		}
	}, [credentials, validateCredentials, persistCredentials]);

	// Initialize credentials on mount
	useEffect(() => {
		const initializeCredentials = async () => {
			const stored = await loadCredentials();
			
			if (stored && onCredentialsChange) {
				// Only update if stored credentials are different
				const hasChanged = 
					stored.environmentId !== credentials.environmentId ||
					stored.clientId !== credentials.clientId ||
					stored.clientSecret !== credentials.clientSecret ||
					stored.redirectUri !== credentials.redirectUri ||
					stored.scope !== credentials.scope;

				if (hasChanged) {
					onCredentialsChange(stored);
				}
			}
		};

		initializeCredentials();
	}, [loadCredentials, credentials, onCredentialsChange]);

	return {
		persistCredentials,
		loadCredentials,
		validateCredentials,
		ensurePingOneScopes,
	};
};
