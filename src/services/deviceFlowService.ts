// Device Authorization Grant Service for PingOne Auth API
import { logger } from '../utils/logger';

export interface DeviceAuthorizationRequest {
	client_id: string;
	scope?: string;
	audience?: string;
	acr_values?: string;
	prompt?: string;
	max_age?: number;
	ui_locales?: string;
	claims?: string;
	app_identifier?: string;
}

export interface DeviceAuthorizationResponse {
	device_code: string;
	user_code: string;
	verification_uri: string;
	verification_uri_complete: string;
	expires_in: number;
	interval: number;
	message?: string;
}

export interface DeviceTokenRequest {
	grant_type: 'urn:ietf:params:oauth:grant-type:device_code';
	device_code: string;
	client_id: string;
	client_secret?: string;
}

export interface DeviceTokenResponse {
	access_token?: string;
	id_token?: string;
	refresh_token?: string;
	token_type?: string;
	expires_in?: number;
	scope?: string;
	error?: string;
	error_description?: string;
}

export interface DeviceFlowState {
	deviceCode: string;
	userCode: string;
	verificationUri: string;
	verificationUriComplete: string;
	expiresIn: number;
	interval: number;
	expiresAt: Date;
	status: 'pending' | 'authorized' | 'expired' | 'denied';
	tokens?: DeviceTokenResponse;
	lastPolled?: Date;
	pollCount: number;
}

class DeviceFlowService {
	private readonly STORAGE_KEY = 'pingone_playground_device_flow_state';
	private readonly MAX_POLL_ATTEMPTS = 100;
	private readonly DEFAULT_POLL_INTERVAL = 5; // 5 seconds (RFC 8628 — stored in seconds, not ms)
	private activePollingTimerId: ReturnType<typeof setTimeout> | null = null;

	/**
	 * Start device authorization flow
	 */
	async startDeviceFlow(
		environmentId: string,
		request: DeviceAuthorizationRequest
	): Promise<DeviceAuthorizationResponse> {
		try {
			// Use relative URL to go through Vite proxy (avoids certificate issues)
			const deviceEndpoint = '/api/device-authorization';

			logger.info('DeviceFlowService', 'Starting device authorization flow', {
				environmentId,
				clientId: request.client_id,
				scope: request.scope,
			});

			const response = await fetch(deviceEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
				body: JSON.stringify({
					environment_id: environmentId,
					client_id: request.client_id,
					scope: request.scope,
					audience: request.audience,
					acr_values: request.acr_values,
					prompt: request.prompt,
					max_age: request.max_age,
					ui_locales: request.ui_locales,
					claims: request.claims,
					app_identifier: request.app_identifier,
				}),
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(
					`Device authorization failed: ${response.status} ${response.statusText} - ${errorText}`
				);
			}

			const deviceResponse: DeviceAuthorizationResponse = await response.json();

			// Store device flow state
			const state: DeviceFlowState = {
				deviceCode: deviceResponse.device_code,
				userCode: deviceResponse.user_code,
				verificationUri: deviceResponse.verification_uri,
				verificationUriComplete: deviceResponse.verification_uri_complete,
				expiresIn: deviceResponse.expires_in,
				interval: deviceResponse.interval || this.DEFAULT_POLL_INTERVAL, // seconds (RFC 8628)
				expiresAt: new Date(Date.now() + deviceResponse.expires_in * 1000),
				status: 'pending',
				pollCount: 0,
			};

			this.saveDeviceFlowState(state);

			logger.success('DeviceFlowService', 'Device authorization started', {
				userCode: deviceResponse.user_code,
				verificationUri: deviceResponse.verification_uri,
				expiresIn: deviceResponse.expires_in,
			});

			return deviceResponse;
		} catch (error) {
			logger.error('DeviceFlowService', 'Failed to start device flow', error);
			throw error;
		}
	}

	/**
	 * Poll for device authorization completion
	 */
	async pollForTokens(
		environmentId: string,
		deviceCode: string,
		clientId: string,
		clientSecret?: string
	): Promise<DeviceTokenResponse> {
		try {
			const tokenEndpoint = `https://auth.pingone.com/${environmentId}/as/token`;

			logger.info('DeviceFlowService', 'Polling for device tokens', {
				deviceCode: `${deviceCode.substring(0, 8)}...`,
				clientId,
			});

			const formData = new FormData();
			formData.append('grant_type', 'urn:ietf:params:oauth:grant-type:device_code');
			formData.append('device_code', deviceCode);
			formData.append('client_id', clientId);
			if (clientSecret) formData.append('client_secret', clientSecret);

			const response = await fetch(tokenEndpoint, {
				method: 'POST',
				body: formData,
				headers: {
					Accept: 'application/json',
				},
			});

			const tokenResponse: DeviceTokenResponse = await response.json();

			if (response.ok) {
				logger.success('DeviceFlowService', 'Device tokens received', {
					hasAccessToken: !!tokenResponse.access_token,
					hasIdToken: !!tokenResponse.id_token,
					hasRefreshToken: !!tokenResponse.refresh_token,
				});
			} else {
				logger.warn('DeviceFlowService', 'Device token request failed', {
					error: tokenResponse.error,
					description: tokenResponse.error_description,
				});
			}

			return tokenResponse;
		} catch (error) {
			logger.error('DeviceFlowService', 'Failed to poll for device tokens', error);
			throw error;
		}
	}

	/**
	 * Stop active polling (cancellation handle — call on unmount)
	 */
	stopPolling(): void {
		if (this.activePollingTimerId !== null) {
			clearTimeout(this.activePollingTimerId);
			this.activePollingTimerId = null;
			logger.info('DeviceFlowService', 'Polling stopped');
		}
	}

	/**
	 * Start polling for device authorization completion
	 */
	async startPolling(
		environmentId: string,
		deviceCode: string,
		clientId: string,
		clientSecret?: string,
		onUpdate?: (state: DeviceFlowState) => void,
		onComplete?: (tokens: DeviceTokenResponse) => void,
		onError?: (error: Error) => void
	): Promise<void> {
		const state = this.getDeviceFlowState();
		if (!state || state.deviceCode !== deviceCode) {
			throw new Error('Device flow state not found');
		}

		// state.interval is always stored in seconds (RFC 8628)
		const pollInterval = state.interval * 1000; // convert to ms for setTimeout
		let pollCount = 0;
		// Clear any existing polling timer before starting a new one
		this.stopPolling();

		const schedule = () => {
			this.activePollingTimerId = setTimeout(poll, pollInterval);
		};

		const poll = async () => {
			this.activePollingTimerId = null;
			try {
				// Check if expired
				if (new Date() > state.expiresAt) {
					state.status = 'expired';
					this.saveDeviceFlowState(state);
					onError?.(new Error('Device authorization expired'));
					return;
				}

				// Check max poll attempts
				if (pollCount >= this.MAX_POLL_ATTEMPTS) {
					state.status = 'expired';
					this.saveDeviceFlowState(state);
					onError?.(new Error('Maximum poll attempts reached'));
					return;
				}

				pollCount++;
				state.pollCount = pollCount;
				state.lastPolled = new Date();

				const tokenResponse = await this.pollForTokens(
					environmentId,
					deviceCode,
					clientId,
					clientSecret
				);

				if (tokenResponse.access_token || tokenResponse.id_token) {
					// Authorization successful
					// eslint-disable-next-line require-atomic-updates
					state.status = 'authorized';
					// eslint-disable-next-line require-atomic-updates
					state.tokens = tokenResponse;
					this.saveDeviceFlowState(state);
					onComplete?.(tokenResponse);
					return;
				}

				if (tokenResponse.error) {
					if (tokenResponse.error === 'authorization_pending') {
						// Still pending, continue polling
						// eslint-disable-next-line require-atomic-updates
						state.status = 'pending';
						this.saveDeviceFlowState(state);
						onUpdate?.(state);
						schedule();
					} else if (
						tokenResponse.error === 'authorization_declined' ||
						tokenResponse.error === 'access_denied'
					) {
						// User denied authorization — definitive, do not retry
						// eslint-disable-next-line require-atomic-updates
						state.status = 'denied';
						this.saveDeviceFlowState(state);
						onError?.(new Error('User denied authorization'));
					} else if (tokenResponse.error === 'expired_token') {
						// Device code expired — definitive, do not retry
						// eslint-disable-next-line require-atomic-updates
						state.status = 'expired';
						this.saveDeviceFlowState(state);
						onError?.(new Error('Device code expired'));
					} else {
						// Other protocol error — definitive
						// eslint-disable-next-line require-atomic-updates
						state.status = 'expired';
						this.saveDeviceFlowState(state);
						onError?.(new Error(tokenResponse.error_description || tokenResponse.error));
					}
				} else {
					// Continue polling
					// eslint-disable-next-line require-atomic-updates
					state.status = 'pending';
					this.saveDeviceFlowState(state);
					onUpdate?.(state);
					schedule();
				}
			} catch (error) {
				// Transient network/fetch error — retry unless we've hit limits or the code is expired
				logger.warn('DeviceFlowService', 'Transient polling error, will retry', error);
				if (pollCount < this.MAX_POLL_ATTEMPTS && new Date() <= state.expiresAt) {
					schedule();
				} else {
					logger.error('DeviceFlowService', 'Polling error — giving up', error);
					onError?.(error instanceof Error ? error : new Error('Unknown polling error'));
				}
			}
		};

		// Start polling
		schedule();
	}

	/**
	 * Get current device flow state
	 */
	getDeviceFlowState(): DeviceFlowState | null {
		try {
			const stored = localStorage.getItem(this.STORAGE_KEY);
			if (!stored) return null;

			const state = JSON.parse(stored);
			state.expiresAt = new Date(state.expiresAt);
			if (state.lastPolled) {
				state.lastPolled = new Date(state.lastPolled);
			}

			return state;
		} catch (error) {
			logger.warn('DeviceFlowService', 'Failed to get device flow state', error);
			return null;
		}
	}

	/**
	 * Save device flow state
	 */
	private saveDeviceFlowState(state: DeviceFlowState): void {
		try {
			localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
		} catch (error) {
			logger.warn('DeviceFlowService', 'Failed to save device flow state', error);
		}
	}

	/**
	 * Clear device flow state
	 */
	clearDeviceFlowState(): void {
		try {
			localStorage.removeItem(this.STORAGE_KEY);
			logger.info('DeviceFlowService', 'Device flow state cleared');
		} catch (error) {
			logger.warn('DeviceFlowService', 'Failed to clear device flow state', error);
		}
	}

	/**
	 * Generate QR code data for device flow
	 */
	generateQRCodeData(verificationUriComplete: string): string {
		return verificationUriComplete;
	}

	/**
	 * Format user code for display
	 */
	formatUserCode(userCode: string): string {
		// Format as XXXX-XXXX for better readability
		if (userCode.length === 8) {
			return `${userCode.substring(0, 4)}-${userCode.substring(4)}`;
		}
		return userCode;
	}

	/**
	 * Get time remaining until expiration
	 */
	getTimeRemaining(state: DeviceFlowState): number {
		const now = new Date();
		const remaining = state.expiresAt.getTime() - now.getTime();
		return Math.max(0, Math.floor(remaining / 1000));
	}

	/**
	 * Check if device flow is still active
	 */
	isDeviceFlowActive(state: DeviceFlowState): boolean {
		return state.status === 'pending' && new Date() < state.expiresAt;
	}

	/**
	 * Get device flow status message
	 */
	getStatusMessage(state: DeviceFlowState): string {
		switch (state.status) {
			case 'pending':
				return 'Waiting for user authorization...';
			case 'authorized':
				return 'Authorization successful!';
			case 'denied':
				return 'Authorization was denied by user.';
			case 'expired':
				return 'Device code has expired. Please start a new flow.';
			default:
				return 'Unknown status';
		}
	}
}

export const deviceFlowService = new DeviceFlowService();
export default deviceFlowService;
