import { apiCallTrackerService } from '../../services/apiCallTrackerService';
import { unifiedWorkerTokenServiceV2 } from '../../services/unifiedWorkerTokenServiceV2';
import type { WorkerAccessToken, WorkerTokenStatus } from '../../services/unifiedWorkerTokenTypes';
export interface TokenInfo {
	id: string;
	type: 'access_token' | 'refresh_token' | 'id_token' | 'worker_token';
	value: string;
	expiresAt: number | null;
	issuedAt: number | null;
	scope: string[];
	status: 'active' | 'expiring' | 'expired' | 'error';
	introspectionData: Record<string, unknown> | null;
	isVisible: boolean;
	source?: 'oauth_flow' | 'worker_token';
}

export type RevocationMethod = 'oauth_revoke' | 'sso_signoff' | 'session_delete';

export interface RevocationOptions {
	method?: RevocationMethod;
	userId?: string;
	sessionId?: string;
	idTokenHint?: string;
}

export interface ApiCall {
	id: string;
	timestamp: number;
	method: string;
	url: string;
	headers: Record<string, string>;
	body?: string;
	response: {
		status: number;
		statusText: string;
		headers: Record<string, string>;
		body?: string;
	};
	duration: number;
	type: 'oauth_revoke' | 'sso_signoff' | 'session_delete' | 'introspect' | 'worker_refresh';
	success: boolean;
}

export interface TokenMonitoringServiceConfig {
	refreshThreshold?: number; // milliseconds before expiry to trigger refresh
	pollingInterval?: number; // milliseconds between status checks
	enableNotifications?: boolean;
	enableApiLogging?: boolean; // enable API call logging
}

export class TokenMonitoringService {
	private static instance: TokenMonitoringService;
	private tokens: Map<string, TokenInfo> = new Map();
	private listeners: Set<(tokens: TokenInfo[]) => void> = new Set();
	private apiCallListeners: Set<(apiCalls: ApiCall[]) => void> = new Set();
	private config: TokenMonitoringServiceConfig;
	private pollingTimer: NodeJS.Timeout | null = null;
	private notificationPermission: NotificationPermission = 'default';
	private readonly STORAGE_KEY = 'v8u.tokenMonitoring.tokens';
	private readonly API_CALLS_KEY = 'v8u.tokenMonitoring.apiCalls';
	private apiCalls: ApiCall[] = [];
	private maxApiCalls: number = 100; // Keep only last 100 API calls

	private constructor(config: TokenMonitoringServiceConfig = {}) {
		this.config = {
			refreshThreshold: 5 * 60 * 1000, // 5 minutes
			pollingInterval: 5000, // 5 seconds (reduced from 1 second to prevent flashing)
			enableNotifications: true,
			enableApiLogging: true,
			...config,
		};

		this.loadTokensFromStorage();
		this.loadApiCallsFromStorage();
		this.initializeNotifications();
		this.startPolling();
		this.setupTokenSync();
		this.setupApiCallTrackerSync();

		// Log initial state for debugging
		console.log(`[TokenMonitoring] Service initialized with ${this.tokens.size} tokens`);
	}

	static getInstance(config?: TokenMonitoringServiceConfig): TokenMonitoringService {
		if (!TokenMonitoringService.instance) {
			TokenMonitoringService.instance = new TokenMonitoringService(config);
		}
		return TokenMonitoringService.instance;
	}

	static resetInstance(): void {
		if (TokenMonitoringService.instance) {
			// Clean up existing instance
			if (TokenMonitoringService.instance.pollingTimer) {
				clearInterval(TokenMonitoringService.instance.pollingTimer);
			}
			TokenMonitoringService.instance = null;
			console.log('[TokenMonitoring] Service instance reset');
		}
	}

	static clearStorage(): void {
		if (typeof window !== 'undefined') {
			// Clear token monitoring storage
			window.localStorage.removeItem('v8u.tokenMonitoring.tokens');
			window.localStorage.removeItem('v8u.tokenMonitoring.apiCalls');
			console.log('[TokenMonitoring] Storage cleared');
		}
	}

	private async initializeNotifications(): Promise<void> {
		if ('Notification' in window && this.config.enableNotifications) {
			this.notificationPermission = await Notification.requestPermission();
		}
	}

	private startPolling(): void {
		if (this.pollingTimer) {
			clearInterval(this.pollingTimer);
		}

		this.pollingTimer = setInterval(() => {
			this.updateTokenStates();
			this.checkExpiryNotifications();
		}, this.config.pollingInterval);
	}

	private updateTokenStates(): void {
		const currentTime = Date.now();
		let hasChanges = false;

		this.tokens.forEach((token, id) => {
			if (!token.expiresAt) return;

			const timeUntilExpiry = token.expiresAt - currentTime;
			const fiveMinutes = 5 * 60 * 1000;

			let newStatus: TokenInfo['status'] = 'active';
			if (timeUntilExpiry <= 0) {
				newStatus = 'expired';
			} else if (timeUntilExpiry <= fiveMinutes) {
				newStatus = 'expiring';
			}

			if (token.status !== newStatus) {
				this.tokens.set(id, { ...token, status: newStatus });
				hasChanges = true;
			}
		});

		if (hasChanges) {
			this.notifyListeners();
		}
	}

	private checkExpiryNotifications(): void {
		if (!this.config.enableNotifications || this.notificationPermission !== 'granted') {
			return;
		}

		const currentTime = Date.now();
		const threshold = this.config.refreshThreshold || 5 * 60 * 1000;

		this.tokens.forEach((token) => {
			if (!token.expiresAt) return;

			const timeUntilExpiry = token.expiresAt - currentTime;

			// Notify when token is about to expire
			if (
				timeUntilExpiry > 0 &&
				timeUntilExpiry <= threshold &&
				timeUntilExpiry > threshold - 1000
			) {
				this.showNotification(
					'Token Expiring Soon',
					`${token.type.replace('_', ' ').toUpperCase()} will expire in ${Math.floor(timeUntilExpiry / 60000)} minutes`
				);
			}

			// Notify when token has expired
			if (timeUntilExpiry <= 0 && timeUntilExpiry > -1000) {
				this.showNotification(
					'Token Expired',
					`${token.type.replace('_', ' ').toUpperCase()} has expired and needs refresh`
				);
			}
		});
	}

	private showNotification(title: string, body: string): void {
		if (this.notificationPermission === 'granted' && 'Notification' in window) {
			new Notification(title, {
				body,
				icon: '/favicon.ico',
				badge: '/favicon.ico',
				tag: 'token-monitoring',
			});
		}
	}

	private notifyListeners(): void {
		const tokens = Array.from(this.tokens.values());
		this.listeners.forEach((listener) => listener(tokens));
		this.saveTokensToStorage();
	}

	private notifyApiCallListeners(): void {
		this.apiCallListeners.forEach((listener) => listener(this.apiCalls));
		this.saveApiCallsToStorage();
	}

	// Token persistence methods
	private loadTokensFromStorage(): void {
		try {
			const stored =
				typeof window !== 'undefined' ? window.localStorage.getItem(this.STORAGE_KEY) : null;
			if (stored) {
				const tokenData = JSON.parse(stored) as TokenInfo[];
				tokenData.forEach((token) => {
					this.tokens.set(token.id, token);
				});
				console.log(`[TokenMonitoring] Loaded ${tokenData.length} tokens from storage`);

				// Notify listeners immediately after loading from storage
				if (tokenData.length > 0) {
					this.notifyListeners();
				}
			}
		} catch (error) {
			console.warn('[TokenMonitoring] Failed to load tokens from storage:', error);
		}
	}

	private saveTokensToStorage(): void {
		try {
			if (typeof window !== 'undefined') {
				const tokenData = Array.from(this.tokens.values());
				window.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tokenData));
			}
		} catch (error) {
			console.warn('[TokenMonitoring] Failed to save tokens to storage:', error);
		}
	}

	// API call logging methods
	private loadApiCallsFromStorage(): void {
		try {
			const stored =
				typeof window !== 'undefined' ? window.localStorage.getItem(this.API_CALLS_KEY) : null;
			if (stored) {
				this.apiCalls = JSON.parse(stored) as ApiCall[];
				console.log(`[TokenMonitoring] Loaded ${this.apiCalls.length} API calls from storage`);
			}
		} catch (error) {
			console.warn('[TokenMonitoring] Failed to load API calls from storage:', error);
			this.apiCalls = [];
		}
	}

	private saveApiCallsToStorage(): void {
		try {
			if (typeof window !== 'undefined') {
				window.localStorage.setItem(this.API_CALLS_KEY, JSON.stringify(this.apiCalls));
			}
		} catch (error) {
			console.warn('[TokenMonitoring] Failed to save API calls to storage:', error);
		}
	}

	private logApiCall(call: Omit<ApiCall, 'id' | 'timestamp'>): void {
		if (!this.config.enableApiLogging) {
			return;
		}

		const apiCall: ApiCall = {
			id: this.generateApiCallId(),
			timestamp: Date.now(),
			...call,
		};

		// Add to the beginning of the array (most recent first)
		this.apiCalls.unshift(apiCall);

		// Keep only the last maxApiCalls
		if (this.apiCalls.length > this.maxApiCalls) {
			this.apiCalls = this.apiCalls.slice(0, this.maxApiCalls);
		}

		this.saveApiCallsToStorage();
		console.log(`[TokenMonitoring] Logged API call: ${call.method} ${call.url}`);
	}

	private generateApiCallId(): string {
		return `api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	public getApiCalls(): ApiCall[] {
		return [...this.apiCalls];
	}

	public clearApiCalls(): void {
		this.apiCalls = [];
		this.saveApiCallsToStorage();
		console.log('[TokenMonitoring] Cleared API call history');
	}

	// Token sync with OAuth flows
	private setupTokenSync(): void {
		// Listen for token changes from OAuth flows
		if (typeof window !== 'undefined') {
			window.addEventListener('storage', (e) => {
				if (e.key === 'tokenManagementFlowContext') {
					this.syncTokensFromFlowContext();
				}
			});

			// Listen for worker token updates
			window.addEventListener('worker-token-refreshed', () => {
				console.log('[TokenMonitoring] worker-token-refreshed event received');
				this.syncWorkerToken();
			});

			// Also listen for any other worker token events
			window.addEventListener('workerTokenUpdated', () => {
				console.log('[TokenMonitoring] workerTokenUpdated event received');
				this.syncWorkerToken();
			});

			// Initial sync
			this.syncTokensFromFlowContext();
			this.syncWorkerToken();
		}
	}

	private setupApiCallTrackerSync(): void {
		// Subscribe to API call tracker service to capture all API calls
		try {
			apiCallTrackerService.subscribe((trackedCalls) => {
				// Convert tracked API calls to our ApiCall format
				trackedCalls.forEach((trackedCall) => {
					// Only track calls that look like OAuth/token-related calls
					if (
						trackedCall.url?.includes('/token') ||
						trackedCall.url?.includes('/authorize') ||
						trackedCall.url?.includes('/revoke') ||
						trackedCall.url?.includes('/introspect') ||
						trackedCall.url?.includes('/signoff') ||
						trackedCall.step?.includes('token') ||
						trackedCall.flowType === 'unified'
					) {
						// Convert to our ApiCall format
						const apiCall: ApiCall = {
							id: `tracked-${trackedCall.id}`,
							timestamp: trackedCall.timestamp
								? new Date(trackedCall.timestamp).getTime()
								: Date.now(),
							method: trackedCall.method || 'GET',
							url: trackedCall.actualPingOneUrl || trackedCall.url || '',
							headers: trackedCall.headers || {},
							body: trackedCall.body ? JSON.stringify(trackedCall.body) : undefined,
							response: {
								status: trackedCall.response?.status || 0,
								statusText: trackedCall.response?.statusText || '',
								headers: trackedCall.response?.headers || {},
								body: trackedCall.response?.data
									? JSON.stringify(trackedCall.response.data)
									: undefined,
							},
							duration: trackedCall.duration || 0,
							type: this.getApiCallType(trackedCall.url),
							success:
								(trackedCall.response?.status || 0) >= 200 &&
								(trackedCall.response?.status || 0) < 300,
						};

						// Check if we already have this call (by ID)
						const existingIndex = this.apiCalls.findIndex((call) => call.id === apiCall.id);
						if (existingIndex === -1) {
							// Add new call
							this.apiCalls.push(apiCall);

							// Keep only the last maxApiCalls
							if (this.apiCalls.length > this.maxApiCalls) {
								this.apiCalls = this.apiCalls.slice(-this.maxApiCalls);
							}

							// Save to storage
							this.saveApiCallsToStorage();

							// Notify listeners
							this.notifyApiCallListeners();
						}
					}
				});
			});
		} catch (error) {
			console.warn('[TokenMonitoring] Failed to setup API call tracker sync:', error);
		}
	}

	private getApiCallType(url: string): ApiCall['type'] {
		if (url?.includes('/token')) return 'oauth_revoke'; // Using existing type for token endpoint
		if (url?.includes('/revoke')) return 'oauth_revoke';
		if (url?.includes('/introspect')) return 'introspect';
		if (url?.includes('/signoff')) return 'sso_signoff';
		return 'oauth_revoke'; // Default type
	}

	private syncTokensFromFlowContext(): void {
		try {
			const flowContext =
				typeof window !== 'undefined'
					? window.sessionStorage.getItem('tokenManagementFlowContext')
					: null;
			if (flowContext) {
				const context = JSON.parse(flowContext);
				if (context.tokens) {
					this.syncTokensFromOAuthFlow(context.tokens, context.flow || 'unknown');
				}
			}
		} catch (error) {
			console.warn('[TokenMonitoring] Failed to sync tokens from flow context:', error);
		}
	}

	private syncTokensFromOAuthFlow(oauthTokens: Record<string, string>, flowSource: string): void {
		console.log('[TokenMonitoring] Syncing tokens from OAuth flow:', {
			flowSource,
			tokenTypes: Object.keys(oauthTokens),
		});

		// Clear existing tokens of the same types before adding new ones
		if (oauthTokens.access_token) {
			this.clearTokensByType('access_token');
		}
		if (oauthTokens.refresh_token) {
			this.clearTokensByType('refresh_token');
		}
		if (oauthTokens.id_token) {
			this.clearTokensByType('id_token');
		}

		// Add access token
		if (oauthTokens.access_token) {
			const expiresIn = oauthTokens.expires_in
				? parseInt(oauthTokens.expires_in) * 1000
				: 60 * 60 * 1000; // Default 1 hour
			const expiresAt = Date.now() + expiresIn;

			this.addToken({
				type: 'access_token',
				value: oauthTokens.access_token,
				expiresAt,
				issuedAt: Date.now(),
				scope: oauthTokens.scope ? oauthTokens.scope.split(' ') : [],
			});
		}

		// Add refresh token
		if (oauthTokens.refresh_token) {
			const refreshExpiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days from now

			this.addToken({
				type: 'refresh_token',
				value: oauthTokens.refresh_token,
				expiresAt: refreshExpiresAt,
				issuedAt: Date.now(),
				scope: oauthTokens.scope ? oauthTokens.scope.split(' ') : [],
			});
		}

		// Add ID token
		if (oauthTokens.id_token) {
			this.addToken({
				type: 'id_token',
				value: oauthTokens.id_token,
				expiresAt: null, // ID tokens typically don't have explicit expiry in the response
				issuedAt: Date.now(),
				scope: ['openid'],
			});
		}
	}

	private clearTokensFromFlow(flowSource: string): void {
		const tokensToRemove: string[] = [];

		this.tokens.forEach((token, id) => {
			// For now, we'll clear all tokens when syncing from any flow
			// In a more sophisticated implementation, we could track flow sources per token
			tokensToRemove.push(id);
		});

		tokensToRemove.forEach((id) => this.removeToken(id));
	}

	private clearTokensByType(tokenType: string): void {
		const tokensToRemove: string[] = [];

		this.tokens.forEach((token, id) => {
			if (token.type === tokenType) {
				tokensToRemove.push(id);
			}
		});

		tokensToRemove.forEach((id) => this.removeToken(id));
		console.log(`[TokenMonitoring] Cleared ${tokensToRemove.length} tokens of type: ${tokenType}`);
	}

	public manualSyncWorkerToken(): void {
		console.log('[TokenMonitoring] Manual worker token sync triggered');
		this.syncWorkerToken();
	}

	private async syncWorkerToken(): Promise<void> {
		try {
			console.log('[TokenMonitoring] Syncing worker token...');

			// Get worker token status
			const status = await unifiedWorkerTokenServiceV2.getStatus();
			console.log('[TokenMonitoring] Worker token status:', status);

			if (!status.hasToken || !status.tokenValid) {
				console.log('[TokenMonitoring] No valid worker token, removing existing...');
				// Remove existing worker token if it's invalid
				this.removeWorkerToken();
				return;
			}

			// Get the actual worker token
			const workerTokenString = await unifiedWorkerTokenServiceV2.getToken();
			console.log(
				'[TokenMonitoring] Got worker token string:',
				workerTokenString ? 'SUCCESS' : 'FAILED'
			);

			if (workerTokenString) {
				// Get stored worker token details to extract metadata
				const storedToken = await this.getStoredWorkerToken();

				// Remove existing worker token
				this.removeWorkerToken();

				// Add updated worker token
				this.addToken({
					type: 'worker_token',
					value: workerTokenString,
					expiresAt:
						storedToken?.expiresAt ||
						(status.tokenExpiresIn ? Date.now() + status.tokenExpiresIn * 1000 : null),
					issuedAt: storedToken?.fetchedAt || status.lastFetchedAt || Date.now(),
					scope: storedToken?.scope ? storedToken.scope.split(' ') : [],
					source: 'worker_token',
				});

				console.log('[TokenMonitoring] Worker token added successfully');
			}
		} catch (error) {
			console.error('[TokenMonitoring] Failed to sync worker token:', error);
		}
	}

	private removeWorkerToken(): void {
		const tokensToRemove: string[] = [];

		this.tokens.forEach((token, id) => {
			if (token.type === 'worker_token' || token.source === 'worker_token') {
				tokensToRemove.push(id);
			}
		});

		tokensToRemove.forEach((id) => this.removeToken(id));
	}

	private async getStoredWorkerToken(): Promise<WorkerAccessToken | null> {
		try {
			// This is a simplified approach - in a real implementation, we might need
			// to access the worker token manager's internal storage or add a method to expose it
			const status = await unifiedWorkerTokenServiceV2.getStatus();

			if (status.hasToken && status.lastFetchedAt) {
				// Create a minimal WorkerAccessToken-like object
				return {
					access_token: '', // We'll get this from getWorkerToken()
					token_type: 'Bearer',
					expires_in: status.tokenExpiresIn || 3600,
					scope: 'worker',
					fetchedAt: status.lastFetchedAt,
					expiresAt: status.lastFetchedAt + (status.tokenExpiresIn || 3600) * 1000,
				};
			}

			return null;
		} catch (error) {
			console.warn('[TokenMonitoring] Failed to get stored worker token:', error);
			return null;
		}
	}

	// Public API methods
	public addToken(
		token: Omit<TokenInfo, 'id' | 'status' | 'isVisible' | 'introspectionData'>
	): string {
		// Check for existing tokens of the same type to prevent duplicates
		const existingTokensOfSameType = Array.from(this.tokens.values()).filter(
			(existingToken) => existingToken.type === token.type
		);

		if (existingTokensOfSameType.length > 0) {
			console.log(
				`[TokenMonitoring] Found ${existingTokensOfSameType.length} existing tokens of type ${token.type}, removing them first`
			);
			// Remove existing tokens of the same type
			existingTokensOfSameType.forEach((existingToken) => {
				this.removeToken(existingToken.id);
			});
		}

		const id = this.generateTokenId();
		const currentTime = Date.now();

		let status: TokenInfo['status'] = 'active';
		if (token.expiresAt) {
			const timeUntilExpiry = token.expiresAt - currentTime;
			const fiveMinutes = 5 * 60 * 1000;

			if (timeUntilExpiry <= 0) {
				status = 'expired';
			} else if (timeUntilExpiry <= fiveMinutes) {
				status = 'expiring';
			}
		}

		const fullToken: TokenInfo = {
			...token,
			id,
			status,
			isVisible: false,
			introspectionData: null,
		};

		this.tokens.set(id, fullToken);
		this.notifyListeners();

		console.log(`[TokenMonitoring] Added new token: ${token.type} with ID: ${id}`);
		return id;
	}

	public removeToken(tokenId: string): boolean {
		const removed = this.tokens.delete(tokenId);
		if (removed) {
			this.notifyListeners();
		}
		return removed;
	}

	public updateToken(tokenId: string, updates: Partial<TokenInfo>): boolean {
		const token = this.tokens.get(tokenId);
		if (!token) return false;

		const updatedToken = { ...token, ...updates };
		this.tokens.set(tokenId, updatedToken);
		this.notifyListeners();

		return true;
	}

	public getToken(tokenId: string): TokenInfo | undefined {
		return this.tokens.get(tokenId);
	}

	public getAllTokens(): TokenInfo[] {
		return Array.from(this.tokens.values());
	}

	public getTokensByType(type: TokenInfo['type']): TokenInfo[] {
		return this.getAllTokens().filter((token) => token.type === type);
	}

	public getActiveTokens(): TokenInfo[] {
		return this.getAllTokens().filter((token) => token.status === 'active');
	}

	public getExpiringTokens(): TokenInfo[] {
		return this.getAllTokens().filter((token) => token.status === 'expiring');
	}

	public getExpiredTokens(): TokenInfo[] {
		return this.getAllTokens().filter((token) => token.status === 'expired');
	}

	public subscribe(listener: (tokens: TokenInfo[]) => void): () => void {
		this.listeners.add(listener);

		// Immediately call listener with current state
		listener(this.getAllTokens());

		// Return unsubscribe function
		return () => {
			this.listeners.delete(listener);
		};
	}

	public async introspectToken(tokenId: string): Promise<Record<string, unknown>> {
		const token = this.tokens.get(tokenId);
		if (!token) {
			throw new Error('Token not found');
		}

		const startTime = Date.now();
		let response: Response | null = null;
		let success = false;
		let responseBody: string | undefined;

		try {
			// Get credentials from flow context for introspection
			const flowContext =
				typeof window !== 'undefined'
					? window.sessionStorage.getItem('tokenManagementFlowContext')
					: null;
			if (flowContext) {
				const context = JSON.parse(flowContext);
				const credentials = context.credentials;

				if (credentials?.authHost && credentials?.environmentId && credentials?.clientId) {
					// Perform real token introspection
					const introspectUrl = `https://${credentials.authHost}/${credentials.environmentId}/as/introspect`;

					const formData = new URLSearchParams();
					formData.append('token', token.value);
					formData.append('token_type_hint', token.type);
					formData.append('client_id', credentials.clientId);

					if (credentials.clientSecret) {
						formData.append('client_secret', credentials.clientSecret);
					}

					const headers: Record<string, string> = {
						'Content-Type': 'application/x-www-form-urlencoded',
					};

					response = await fetch(introspectUrl, {
						method: 'POST',
						headers,
						body: formData.toString(),
					});

					if (!response.ok) {
						throw new Error(`Introspection failed: ${response.status} ${response.statusText}`);
					}

					const introspectionData = await response.json();
					responseBody = JSON.stringify(introspectionData, null, 2);

					// Update token with real introspection data
					this.updateToken(tokenId, { introspectionData });

					console.log(`[TokenMonitoring] Successfully introspected ${token.type} via API`);
					success = true;

					// Log the API call
					this.logApiCall({
						method: 'POST',
						url: introspectUrl,
						headers,
						body: formData.toString(),
						response: {
							status: response.status,
							statusText: response.statusText,
							headers: Object.fromEntries(response.headers.entries()),
							body: responseBody,
						},
						duration: Date.now() - startTime,
						type: 'introspect',
						success,
					});

					return introspectionData;
				} else {
					console.warn(
						'[TokenMonitoring] No credentials available for real introspection, using mock'
					);
				}
			} else {
				console.warn('[TokenMonitoring] No flow context available, using mock introspection');
			}

			// Fallback to mock introspection
			const mockIntrospectionData = {
				active: token.status === 'active',
				scope: token.scope.join(' '),
				client_id: 'mock-client-id',
				username: 'mock-user',
				token_type: token.type,
				exp: token.expiresAt ? Math.floor(token.expiresAt / 1000) : null,
				iat: token.issuedAt ? Math.floor(token.issuedAt / 1000) : null,
				nbf: token.issuedAt ? Math.floor(token.issuedAt / 1000) : null,
				sub: 'mock-subject',
				aud: 'mock-audience',
				iss: 'mock-issuer',
				jti: tokenId,
			};

			responseBody = JSON.stringify(mockIntrospectionData, null, 2);
			this.updateToken(tokenId, { introspectionData: mockIntrospectionData });
			success = true;

			return mockIntrospectionData;
		} catch (error) {
			console.error('[TokenMonitoring] Token introspection failed:', error);

			// Log failed API call if we attempted one
			if (response) {
				this.logApiCall({
					method: 'POST',
					url: response.url,
					headers: Object.fromEntries(response.headers.entries()),
					response: {
						status: response.status,
						statusText: response.statusText,
						headers: Object.fromEntries(response.headers.entries()),
						body: responseBody || undefined,
					},
					duration: Date.now() - startTime,
					type: 'introspect',
					success: false,
				});
			}

			throw error;
		}
	}

	public async refreshToken(tokenId: string): Promise<string> {
		const token = this.tokens.get(tokenId);
		if (!token) {
			throw new Error('Token not found');
		}

		if (token.type !== 'refresh_token') {
			throw new Error('Only refresh tokens can be refreshed');
		}

		try {
			// Mock token refresh - in real implementation, this would call the token endpoint
			const newAccessToken = this.generateMockToken();
			const newExpiresAt = Date.now() + 60 * 60 * 1000; // 1 hour from now

			// Add new access token
			const newTokenId = this.addToken({
				type: 'access_token',
				value: newAccessToken,
				expiresAt: newExpiresAt,
				issuedAt: Date.now(),
				scope: token.scope,
			});

			// Update refresh token issued time
			this.updateToken(tokenId, { issuedAt: Date.now() });

			return newTokenId;
		} catch (error) {
			console.error('Token refresh failed:', error);
			throw error;
		}
	}

	public async revokeToken(tokenId: string, options: RevocationOptions = {}): Promise<void> {
		const token = this.tokens.get(tokenId);
		if (!token) {
			throw new Error('Token not found');
		}

		const method = options.method || 'oauth_revoke';

		try {
			switch (method) {
				case 'oauth_revoke':
					await this.revokeTokenOAuth(token);
					break;
				case 'sso_signoff':
					await this.revokeTokenSSOSignoff(token, options);
					break;
				case 'session_delete':
					await this.revokeTokenSessionDelete(token, options);
					break;
				default:
					throw new Error(`Unsupported revocation method: ${method}`);
			}

			// Remove token from monitoring regardless of revocation method
			this.removeToken(tokenId);
		} catch (error) {
			console.error('[TokenMonitoring] Token revocation failed:', error);

			// Still remove the token from monitoring even if revocation failed
			this.removeToken(tokenId);

			throw error;
		}
	}

	private async revokeTokenOAuth(token: TokenInfo): Promise<void> {
		// Get credentials from flow context for revocation
		const flowContext =
			typeof window !== 'undefined'
				? window.sessionStorage.getItem('tokenManagementFlowContext')
				: null;
		if (flowContext) {
			const context = JSON.parse(flowContext);
			const credentials = context.credentials;

			if (credentials?.authHost && credentials?.environmentId && credentials?.clientId) {
				// Perform real token revocation
				const revokeUrl = `https://${credentials.authHost}/${credentials.environmentId}/as/revoke`;

				const formData = new URLSearchParams();
				formData.append('token', token.value);
				formData.append('token_type_hint', token.type);
				formData.append('client_id', credentials.clientId);

				if (credentials.clientSecret) {
					formData.append('client_secret', credentials.clientSecret);
				}

				const response = await fetch(revokeUrl, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
					},
					body: formData.toString(),
				});

				if (!response.ok) {
					throw new Error(`OAuth revocation failed: ${response.status} ${response.statusText}`);
				}

				console.log(`[TokenMonitoring] Successfully revoked ${token.type} via OAuth API`);
			} else {
				console.warn('[TokenMonitoring] No credentials available for OAuth revocation');
			}
		} else {
			console.warn('[TokenMonitoring] No flow context available for OAuth revocation');
		}
	}

	private async revokeTokenSSOSignoff(token: TokenInfo, options: RevocationOptions): Promise<void> {
		const flowContext =
			typeof window !== 'undefined'
				? window.sessionStorage.getItem('tokenManagementFlowContext')
				: null;
		if (flowContext) {
			const context = JSON.parse(flowContext);
			const credentials = context.credentials;

			if (credentials?.authHost && credentials?.environmentId) {
				// Perform SSO sign-off
				const signoffUrl = `https://${credentials.authHost}/${credentials.environmentId}/as/signoff`;
				const idTokenHint = options.idTokenHint || this.findIdToken();

				if (!idTokenHint) {
					throw new Error('ID token hint required for SSO sign-off');
				}

				const url = new URL(signoffUrl);
				url.searchParams.append('id_token_hint', idTokenHint);

				const response = await fetch(url.toString(), {
					method: 'GET',
					headers: {
						Accept: 'application/json',
					},
				});

				if (!response.ok) {
					throw new Error(`SSO sign-off failed: ${response.status} ${response.statusText}`);
				}

				console.log(`[TokenMonitoring] Successfully performed SSO sign-off`);
			} else {
				console.warn('[TokenMonitoring] No credentials available for SSO sign-off');
			}
		} else {
			console.warn('[TokenMonitoring] No flow context available for SSO sign-off');
		}
	}

	private async revokeTokenSessionDelete(
		token: TokenInfo,
		options: RevocationOptions
	): Promise<void> {
		if (!options.userId || !options.sessionId) {
			throw new Error('userId and sessionId required for session deletion');
		}

		// Get worker token for Management API
		try {
			const workerToken = await unifiedWorkerTokenServiceV2.getToken();
			const flowContext =
				typeof window !== 'undefined'
					? window.sessionStorage.getItem('tokenManagementFlowContext')
					: null;

			if (flowContext) {
				const context = JSON.parse(flowContext);
				const credentials = context.credentials;

				if (credentials?.authHost && credentials?.environmentId) {
					// Perform session deletion via Management API
					const sessionUrl = `https://${credentials.authHost}/${credentials.environmentId}/v1/environments/${credentials.environmentId}/users/${options.userId}/sessions/${options.sessionId}`;

					const response = await fetch(sessionUrl, {
						method: 'DELETE',
						headers: {
							Authorization: `Bearer ${workerToken}`,
							Accept: 'application/json',
						},
					});

					if (!response.ok) {
						throw new Error(`Session deletion failed: ${response.status} ${response.statusText}`);
					}

					console.log(
						`[TokenMonitoring] Successfully deleted session ${options.sessionId} for user ${options.userId}`
					);
				} else {
					console.warn('[TokenMonitoring] No credentials available for session deletion');
				}
			} else {
				console.warn('[TokenMonitoring] No flow context available for session deletion');
			}
		} catch (error) {
			console.warn('[TokenMonitoring] Failed to get worker token for session deletion:', error);
			throw error;
		}
	}

	private findIdToken(): string | null {
		// Look for an ID token in the current tokens
		for (const token of this.tokens.values()) {
			if (token.type === 'id_token') {
				return token.value;
			}
		}
		return null;
	}

	public clearAllTokens(): void {
		this.tokens.clear();
		this.notifyListeners();
	}

	public exportTokenData(): string {
		const exportData = this.getAllTokens().map((token) => ({
			type: token.type,
			status: token.status,
			expiresAt: token.expiresAt ? new Date(token.expiresAt).toISOString() : null,
			issuedAt: token.issuedAt ? new Date(token.issuedAt).toISOString() : null,
			scope: token.scope,
			introspectionData: token.introspectionData,
		}));

		return JSON.stringify(exportData, null, 2);
	}

	public importTokenData(data: string): void {
		try {
			const importData = JSON.parse(data);

			importData.forEach((tokenData: any) => {
				this.addToken({
					type: tokenData.type,
					value: 'imported-token-placeholder',
					expiresAt: tokenData.expiresAt ? new Date(tokenData.expiresAt).getTime() : null,
					issuedAt: tokenData.issuedAt ? new Date(tokenData.issuedAt).getTime() : null,
					scope: tokenData.scope || [],
				});
			});
		} catch (error) {
			console.error('Failed to import token data:', error);
			throw error;
		}
	}

	public updateConfig(config: Partial<TokenMonitoringServiceConfig>): void {
		this.config = { ...this.config, ...config };

		// Restart polling if interval changed
		if (config.pollingInterval) {
			this.startPolling();
		}
	}

	public destroy(): void {
		if (this.pollingTimer) {
			clearInterval(this.pollingTimer);
			this.pollingTimer = null;
		}

		this.listeners.clear();
		this.tokens.clear();
	}

	// Helper methods
	private generateTokenId(): string {
		return `token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	private generateMockToken(): string {
		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		let token = '';
		for (let i = 0; i < 64; i++) {
			token += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return token;
	}

	// Utility methods for token management
	public getTokenStatistics(): {
		total: number;
		active: number;
		expiring: number;
		expired: number;
		byType: Record<string, number>;
	} {
		const tokens = this.getAllTokens();

		return {
			total: tokens.length,
			active: this.getActiveTokens().length,
			expiring: this.getExpiringTokens().length,
			expired: this.getExpiredTokens().length,
			byType: tokens.reduce(
				(acc, token) => {
					acc[token.type] = (acc[token.type] || 0) + 1;
					return acc;
				},
				{} as Record<string, number>
			),
		};
	}

	public getTokensExpiringWithin(milliseconds: number): TokenInfo[] {
		const currentTime = Date.now();
		return this.getAllTokens().filter(
			(token) =>
				token.expiresAt &&
				token.expiresAt > currentTime &&
				token.expiresAt - currentTime <= milliseconds
		);
	}
}
