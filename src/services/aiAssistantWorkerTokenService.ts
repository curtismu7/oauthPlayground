/**
 * AI Assistant Worker Token Service
 * Used by the AI Assistant to check worker token status and refresh (with user confirmation).
 * All token storage goes through unifiedWorkerTokenService so the rest of the app shares the same token.
 */

import { logger } from '../utils/logger';
import { unifiedWorkerTokenService } from './unifiedWorkerTokenService';

const MODULE_TAG = '[AI-Assistant-WorkerToken]';
const PROXY_ENDPOINT = '/api/pingone/token';
const DEFAULT_SCOPES = 'p1:read:environment p1:read:application p1:read:resource p1:read:user';

export interface WorkerTokenStatus {
	hasCredentials: boolean;
	tokenValid: boolean;
	needsRefresh: boolean;
}

/**
 * Returns whether the assistant has credentials, a valid token, or needs a refresh.
 * needsRefresh is true when we have credentials but no valid token (expired or missing).
 */
export async function getTokenStatus(): Promise<WorkerTokenStatus> {
	const credResult = await unifiedWorkerTokenService.loadCredentials();
	const hasCredentials = credResult.success && !!credResult.data;
	const status = await unifiedWorkerTokenService.getStatus();
	const tokenValid = status.tokenValid;
	const needsRefresh = hasCredentials && !tokenValid;
	return {
		hasCredentials: !!hasCredentials,
		tokenValid,
		needsRefresh,
	};
}

/**
 * Fetches a new worker token from PingOne via the backend proxy and stores it
 * using unifiedWorkerTokenService. Call only after user has confirmed (for security).
 * @returns The new access token
 * @throws Error if credentials missing or token request fails
 */
export async function refreshAndStoreToken(): Promise<string> {
	const credResult = await unifiedWorkerTokenService.loadCredentials();
	if (!credResult.success || !credResult.data) {
		throw new Error(
			'No worker token credentials saved. Save credentials in Configuration or Client Generator first.'
		);
	}
	const credentials = credResult.data;
	const region = credentials.region || 'us';
	const scopes =
		credentials.scopes && credentials.scopes.length > 0
			? credentials.scopes.join(' ')
			: DEFAULT_SCOPES;
	const authMethod = credentials.tokenEndpointAuthMethod || 'client_secret_post';

	const params = new URLSearchParams({
		grant_type: 'client_credentials',
		client_id: credentials.clientId,
		scope: scopes,
	});
	if (authMethod === 'client_secret_post') {
		params.set('client_secret', credentials.clientSecret);
	}

	const requestBody: Record<string, unknown> = {
		environment_id: credentials.environmentId,
		region,
		body: params.toString(),
		auth_method: authMethod,
	};
	if (authMethod === 'client_secret_basic') {
		requestBody.headers = {
			Authorization: `Basic ${btoa(`${credentials.clientId}:${credentials.clientSecret}`)}`,
		};
	}

	logger.info(
		'aiAssistantWorkerTokenService',
		`${MODULE_TAG} Requesting new worker token (user confirmed)`
	);

	const response = await fetch(PROXY_ENDPOINT, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(requestBody),
	});

	if (!response.ok) {
		const text = await response.text();
		logger.error(
			'aiAssistantWorkerTokenService',
			`${MODULE_TAG} Token request failed`,
			undefined,
			new Error(`${response.status} ${text}`)
		);
		throw new Error(`Failed to get worker token: ${response.status} ${text.slice(0, 200)}`);
	}

	const data = (await response.json()) as {
		access_token?: string;
		expires_in?: number;
		error?: string;
		error_description?: string;
	};

	if (data.error) {
		throw new Error(data.error_description || data.error || 'Token request failed');
	}
	if (!data.access_token) {
		throw new Error('No access token in response');
	}

	const expiresIn = data.expires_in ?? 3600;
	const expiresAt = Date.now() + expiresIn * 1000;
	await unifiedWorkerTokenService.saveToken(data.access_token, expiresAt);

	logger.info(
		'aiAssistantWorkerTokenService',
		`${MODULE_TAG} New worker token obtained and stored`
	);
	return data.access_token;
}
