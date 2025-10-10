const DEFAULT_DOMAIN = 'https://auth.pingone.com';

const DEFAULT_STORAGE_KEYS = {
	local: ['token_to_analyze', 'token_type', 'flow_source'],
	session: ['hybrid_state', 'hybrid_nonce', 'hybrid_tokens'],
};

type MaybeString = string | undefined | null;

type StorageClearOptions = {
	clearAllLocal?: boolean;
	clearAllSession?: boolean;
	localKeys?: string[];
	sessionKeys?: string[];
};

export interface BuildLogoutUrlOptions {
	issuer?: MaybeString;
	environmentId?: MaybeString;
	clientId?: MaybeString;
	idToken?: MaybeString;
	postLogoutRedirectUri?: MaybeString;
	allowPlaceholders?: boolean;
}

export interface SessionTerminationOptions extends BuildLogoutUrlOptions {
	clientSecret?: MaybeString;
	managementScopes?: string;
	attemptManagementApi?: boolean;
	callLogoutEndpoint?: boolean;
	clearClientStorage?: boolean;
	storageOptions?: StorageClearOptions;
}

export interface SessionTerminationCallResult {
	attempted: boolean;
	success: boolean;
	status?: number;
	statusText?: string;
	endpoint?: string;
	error?: string;
	message?: string;
	payload?: unknown;
}

export interface SessionTerminationResult {
	timestamp: string;
	logoutUrl: string | null;
	userId?: string | null;
	management: SessionTerminationCallResult;
	logout: SessionTerminationCallResult;
	clearedStorageKeys: {
		local: string[];
		session: string[];
	};
	summary: string;
}

const hasWindow = typeof window !== 'undefined';

const decodeBase64 = (value: string): string => {
	if (typeof atob === 'function') {
		return atob(value);
	}
	if (hasWindow && typeof window.atob === 'function') {
		return window.atob(value);
	}
	if (typeof Buffer !== 'undefined') {
		return Buffer.from(value, 'base64').toString('binary');
	}
	throw new Error('No available base64 decoder.');
};

const extractUserIdFromIdToken = (idToken?: MaybeString): string | null => {
	if (!idToken || typeof idToken !== 'string') {
		return null;
	}
	const parts = idToken.split('.');
	if (parts.length < 2) {
		return null;
	}
	try {
		const payloadJson = decodeBase64(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
		const payload = JSON.parse(payloadJson) as { sub?: string };
		return payload?.sub ?? null;
	} catch (error) {
		console.warn('[sessionTerminationService] Failed to parse ID token payload', error);
		return null;
	}
};

const normalizeIssuer = (issuer?: MaybeString, environmentId?: MaybeString): string | null => {
	const trimmedIssuer = typeof issuer === 'string' ? issuer.trim() : '';
	if (trimmedIssuer) {
		const sanitized = trimmedIssuer.replace(/\/+$/, '');
		return sanitized.endsWith('/as') ? sanitized : `${sanitized}/as`;
	}
	if (environmentId) {
		return `${DEFAULT_DOMAIN}/${environmentId}/as`;
	}
	return null;
};

const buildManagementBase = (issuerWithAs: string): string => issuerWithAs.replace(/\/as$/, '');

const buildBasicAuthHeader = (clientId: string, clientSecret: string): string => {
	const credentialString = `${clientId}:${clientSecret}`;
	if (typeof btoa === 'function') {
		return btoa(credentialString);
	}
	if (hasWindow && typeof window.btoa === 'function') {
		return window.btoa(credentialString);
	}
	if (typeof Buffer !== 'undefined') {
		return Buffer.from(credentialString, 'utf8').toString('base64');
	}
	throw new Error('No available base64 encoder.');
};

const resolveLogoutUrl = (options: BuildLogoutUrlOptions, usePlaceholders = false): string | null => {
	const issuerBase = normalizeIssuer(options.issuer, options.environmentId);
	const finalIssuer = issuerBase ?? (usePlaceholders ? `${DEFAULT_DOMAIN}/{environmentId}/as` : null);
	if (!finalIssuer) {
		return null;
	}

	const idToken = options.idToken ?? (usePlaceholders ? '{{idToken}}' : undefined);
	if (!idToken) {
		return null;
	}

	try {
		const url = new URL(`${finalIssuer}/signoff`);
		url.searchParams.set('id_token_hint', idToken);

		const clientId = options.clientId ?? (usePlaceholders ? '{{clientId}}' : undefined);
		if (clientId) {
			url.searchParams.set('client_id', clientId);
		}

		const redirectUri = options.postLogoutRedirectUri ?? (usePlaceholders ? '{{post_logout_redirect_uri}}' : undefined);
		if (redirectUri) {
			url.searchParams.set('post_logout_redirect_uri', redirectUri);
		}

		return url.toString();
	} catch (error) {
		console.warn('[sessionTerminationService] Failed to build logout URL', error);
		return null;
	}
};

const clearClientStorage = (options?: StorageClearOptions) => {
	const cleared = {
		local: [] as string[],
		session: [] as string[],
	};

	if (typeof window === 'undefined') {
		return cleared;
	}

	const localKeys = options?.clearAllLocal
		? Object.keys({ ...(window.localStorage ?? {}) })
		: options?.localKeys ?? DEFAULT_STORAGE_KEYS.local;

	const sessionKeys = options?.clearAllSession
		? Object.keys({ ...(window.sessionStorage ?? {}) })
		: options?.sessionKeys ?? DEFAULT_STORAGE_KEYS.session;

	if (window.localStorage) {
		localKeys.forEach((key) => {
			if (window.localStorage.getItem(key) !== null) {
				window.localStorage.removeItem(key);
				cleared.local.push(key);
			}
		});
	}

	if (window.sessionStorage) {
		sessionKeys.forEach((key) => {
			if (window.sessionStorage.getItem(key) !== null) {
				window.sessionStorage.removeItem(key);
				cleared.session.push(key);
			}
		});
	}

	return cleared;
};

const buildSummary = (result: Omit<SessionTerminationResult, 'summary'>): string => {
	const managementStatus = result.management.attempted
		? result.management.success
			? 'SUCCESS'
			: 'FAILED'
		: 'NOT ATTEMPTED';

	const logoutStatus = result.logout.attempted
		? result.logout.success
			? 'COMPLETED'
			: 'FAILED'
		: 'NOT ATTEMPTED';

	const clearedLocal = result.clearedStorageKeys.local.length
		? result.clearedStorageKeys.local.join(', ')
		: 'None';
	const clearedSession = result.clearedStorageKeys.session.length
		? result.clearedStorageKeys.session.join(', ')
		: 'None';

	const managementDetails = result.management.payload
		? JSON.stringify(result.management.payload, null, 2)
		: result.management.error ?? 'No session termination attempted (missing user context or credentials)';

	const logoutDetails = result.logout.payload
		? JSON.stringify(result.logout.payload, null, 2)
		: result.logout.error ?? 'Logout endpoint not called (missing ID token or issuer)';

	return `🚪 SESSION TERMINATION REPORT\nExecuted: ${new Date(result.timestamp).toLocaleString()}\n\n✅ ACTIONS PERFORMED:\n• PingOne Session Termination: ${managementStatus}\n• Browser Logout: ${logoutStatus}\n• Local storage cleared: ${clearedLocal}\n• Session storage cleared: ${clearedSession}\n\n🔌 MANAGEMENT API RESPONSE:\n${managementDetails}\n\n🌐 OIDC LOGOUT RESPONSE:\n${logoutDetails}\n\n🌐 LOGOUT URL:\n${result.logoutUrl ?? 'No logout URL generated'}\n\n🔐 USER CONTEXT:\n• Subject: ${result.userId ?? 'Unknown'}\n• Environment ID: ${result.management.endpoint ?? 'n/a'}\n\n⚠️ NEXT STEPS:\n• User must re-authenticate to regain access\n• All previous tokens should be considered invalid\n• New authorization flow is required for continued use`;
};

export const buildLogoutUrl = (options: BuildLogoutUrlOptions): string | null =>
	resolveLogoutUrl(options, options.allowPlaceholders ?? false);

const attemptManagementTermination = async (
	issuerWithAs: string,
	environmentId: string,
	clientId: string,
	clientSecret: string,
	userId: string,
	scopes: string
): Promise<SessionTerminationCallResult> => {
	try {
		const tokenEndpoint = `${issuerWithAs}/token`;
		const authHeader = buildBasicAuthHeader(clientId, clientSecret);

		const tokenResponse = await fetch(tokenEndpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Authorization: `Basic ${authHeader}`,
			},
			body: new URLSearchParams({
				grant_type: 'client_credentials',
				scope: scopes,
			}).toString(),
		});

		if (!tokenResponse.ok) {
			return {
				attempted: true,
				success: false,
				status: tokenResponse.status,
				statusText: tokenResponse.statusText,
				error: 'Failed to obtain management access token',
				payload: await tokenResponse.json().catch(() => tokenResponse.statusText),
			};
		}

		const tokenData = await tokenResponse.json();
		const managementToken = tokenData.access_token as string | undefined;

		if (!managementToken) {
			return {
				attempted: true,
				success: false,
				error: 'Management access token missing in response',
			};
		}

		const managementBase = buildManagementBase(issuerWithAs);
		const endpoint = `${managementBase}/v1/environments/${environmentId}/users/${userId}/sessions`;
		const sessionResponse = await fetch(endpoint, {
			method: 'DELETE',
			headers: {
				Authorization: `Bearer ${managementToken}`,
				'Content-Type': 'application/json',
			},
		});

		const payload = {
			status: sessionResponse.status,
			statusText: sessionResponse.statusText,
			response: await sessionResponse.json().catch(() => sessionResponse.statusText),
		};

		return {
			attempted: true,
			success: sessionResponse.ok,
			status: sessionResponse.status,
			statusText: sessionResponse.statusText,
			endpoint,
			payload,
		};
	} catch (error) {
		return {
			attempted: true,
			success: false,
			error: (error as Error).message,
		};
	}
};

const attemptLogoutEndpoint = async (logoutUrl: string): Promise<SessionTerminationCallResult> => {
	try {
		const response = await fetch(logoutUrl, {
			method: 'GET',
			redirect: 'manual',
		});

		const payload = {
			status: response.status,
			statusText: response.statusText,
			redirected: response.redirected,
			headers: Object.fromEntries(response.headers.entries()),
		};

		return {
			attempted: true,
			success: response.status >= 200 && response.status < 400,
			status: response.status,
			statusText: response.statusText,
			payload,
		};
	} catch (error) {
		return {
			attempted: true,
			success: false,
			error: (error as Error).message,
		};
	}
};

export const terminateSession = async (
	options: SessionTerminationOptions
): Promise<SessionTerminationResult> => {
	const timestamp = new Date().toISOString();
	const issuerWithAs = normalizeIssuer(options.issuer, options.environmentId);
	const logoutUrl = resolveLogoutUrl(options, false);
	const userId = extractUserIdFromIdToken(options.idToken);

	let management: SessionTerminationCallResult = {
		attempted: false,
		success: false,
	};

	let logout: SessionTerminationCallResult = {
		attempted: false,
		success: false,
	};

	if (
		options.attemptManagementApi !== false &&
		issuerWithAs &&
		userId &&
		options.clientId &&
		options.clientSecret &&
		options.environmentId
	) {
		management = await attemptManagementTermination(
			issuerWithAs,
			options.environmentId,
			options.clientId,
			options.clientSecret,
			userId,
			options.managementScopes ?? 'p1:read:user p1:delete:user-session'
		);
	} else if (options.attemptManagementApi !== false) {
		management = {
			attempted: false,
			success: false,
			error: 'Insufficient data to call management API',
		};
	}

	if (options.callLogoutEndpoint !== false && logoutUrl && options.idToken) {
		logout = await attemptLogoutEndpoint(logoutUrl);
	} else if (options.callLogoutEndpoint !== false) {
		logout = {
			attempted: false,
			success: false,
			error: 'Logout endpoint not invoked (missing logout URL or ID token)',
		};
	}

	const clearedStorageKeys = options.clearClientStorage === false
		? { local: [], session: [] }
		: clearClientStorage(options.storageOptions);

	const resultWithoutSummary: Omit<SessionTerminationResult, 'summary'> = {
		timestamp,
		logoutUrl,
		userId,
		management,
		logout,
		clearedStorageKeys,
	};

	const summary = buildSummary(resultWithoutSummary);

	return {
		...resultWithoutSummary,
		summary,
	};
};

export const SessionTerminationService = {
	buildLogoutUrl,
	terminateSession,
	clearClientStorage,
};

export default SessionTerminationService;
