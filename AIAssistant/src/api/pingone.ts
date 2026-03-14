/**
 * AIAssistant/src/api/pingone.ts
 * Standalone copy of PingOne API client for worker token validation.
 * Uses same endpoints as main app (auth.pingone.com, api.pingone.com).
 */

const base64Encode = (str: string): string => {
	return btoa(unescape(encodeURIComponent(str)));
};

class PingOneAPI {
	config: { baseUrl: string; authUrl: string };
	accessToken: string | null;
	tokenExpiresAt: number | null;

	constructor(config: Record<string, string> = {}) {
		this.config = {
			baseUrl: 'https://api.pingone.com',
			authUrl: 'https://auth.pingone.com',
			...config,
		};
		this.accessToken = null;
		this.tokenExpiresAt = null;
	}

	async authenticate(clientId: string, clientSecret: string, environmentId: string) {
		const credentials = base64Encode(`${clientId}:${clientSecret}`);
		const response = await fetch(`${this.config.authUrl}/${environmentId}/as/token`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Authorization: `Basic ${credentials}`,
			},
			body: new URLSearchParams({
				grant_type: 'client_credentials',
			}),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error_description || 'Authentication failed');
		}

		const data = await response.json();
		this.accessToken = data.access_token;
		this.tokenExpiresAt = Date.now() + data.expires_in * 1000;
		return data;
	}

	isTokenExpired() {
		if (!this.accessToken || !this.tokenExpiresAt) return true;
		return Date.now() >= this.tokenExpiresAt - 60000;
	}

	async request(endpoint: string, options: RequestInit = {}) {
		if (this.isTokenExpired()) {
			throw new Error('Not authenticated or token expired');
		}

		const url = `${this.config.baseUrl}${endpoint}`;
		const headers = {
			Authorization: `Bearer ${this.accessToken}`,
			'Content-Type': 'application/json',
			...((options.headers as Record<string, string>) ?? {}),
		};

		const response = await fetch(url, {
			...options,
			headers,
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({}));
			throw new Error((error as { message?: string }).message || 'API request failed');
		}

		if (response.status === 204) {
			return { success: true };
		}

		return response.json();
	}

	async getEnvironments() {
		return this.request('/v1/environments');
	}

	async getEnvironment(environmentId: string) {
		return this.request(`/v1/environments/${environmentId}`);
	}
}

export default new PingOneAPI();
