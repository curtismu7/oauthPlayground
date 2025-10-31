// Browser-compatible base64 encoding
const base64Encode = (str: string): string => {
	return btoa(unescape(encodeURIComponent(str)));
};

/**
 * PingOne API Client
 * Handles authentication and requests to the PingOne API
 */
class PingOneAPI {
	constructor(config = {}) {
		this.config = {
			baseUrl: 'https://api.pingone.com',
			authUrl: 'https://auth.pingone.com',
			...config,
		};
		this.accessToken = null;
		this.tokenExpiresAt = null;
	}

	/**
	 * Authenticate with PingOne using client credentials
	 * @param {string} clientId - The client ID
	 * @param {string} clientSecret - The client secret
	 * @param {string} environmentId - The environment ID
	 * @returns {Promise<Object>} The authentication response
	 */
	async authenticate(clientId, clientSecret, environmentId) {
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

	/**
	 * Check if the current access token is expired
	 * @returns {boolean} True if token is expired or about to expire soon
	 */
	isTokenExpired() {
		if (!this.accessToken || !this.tokenExpiresAt) return true;
		// Consider token expired if it will expire in the next 60 seconds
		return Date.now() >= this.tokenExpiresAt - 60000;
	}

	/**
	 * Make an authenticated request to the PingOne API
	 * @param {string} endpoint - The API endpoint
	 * @param {Object} options - Fetch options
	 * @returns {Promise<Object>} The API response
	 */
	async request(endpoint, options = {}) {
		if (this.isTokenExpired()) {
			throw new Error('Not authenticated or token expired');
		}

		const url = `${this.config.baseUrl}${endpoint}`;
		const headers = {
			Authorization: `Bearer ${this.accessToken}`,
			'Content-Type': 'application/json',
			...options.headers,
		};

		const response = await fetch(url, {
			...options,
			headers,
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({}));
			throw new Error(error.message || 'API request failed');
		}

		// For DELETE requests that return 204 No Content
		if (response.status === 204) {
			return { success: true };
		}

		return response.json();
	}

	// Environment Management
	async getEnvironments() {
		return this.request('/v1/environments');
	}

	async getEnvironment(environmentId) {
		return this.request(`/v1/environments/${environmentId}`);
	}

	// Application Management
	async getApplications(environmentId) {
		return this.request(`/v1/environments/${environmentId}/applications`);
	}

	async getApplication(environmentId, applicationId) {
		return this.request(`/v1/environments/${environmentId}/applications/${applicationId}`);
	}

	async createApplication(environmentId, application) {
		return this.request(`/v1/environments/${environmentId}/applications`, {
			method: 'POST',
			body: JSON.stringify(application),
		});
	}

	async updateApplication(environmentId, applicationId, updates) {
		return this.request(`/v1/environments/${environmentId}/applications/${applicationId}`, {
			method: 'PUT',
			body: JSON.stringify(updates),
		});
	}

	async deleteApplication(environmentId, applicationId) {
		return this.request(`/v1/environments/${environmentId}/applications/${applicationId}`, {
			method: 'DELETE',
		});
	}

	// User Management
	async getUsers(environmentId, filter) {
		const query = filter ? `?filter=${encodeURIComponent(filter)}` : '';
		return this.request(`/v1/environments/${environmentId}/users${query}`);
	}

	async getUser(environmentId, userId) {
		return this.request(`/v1/environments/${environmentId}/users/${userId}`);
	}

	async createUser(environmentId, user) {
		return this.request(`/v1/environments/${environmentId}/users`, {
			method: 'POST',
			body: JSON.stringify(user),
		});
	}

	async updateUser(environmentId, userId, updates) {
		return this.request(`/v1/environments/${environmentId}/users/${userId}`, {
			method: 'PUT',
			body: JSON.stringify(updates),
		});
	}

	async deleteUser(environmentId, userId) {
		return this.request(`/v1/environments/${environmentId}/users/${userId}`, {
			method: 'DELETE',
		});
	}

	// Token Management
	async revokeToken(environmentId, token, tokenTypeHint = 'access_token') {
		return this.request(`/v1/environments/${environmentId}/as/revoke`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: new URLSearchParams({
				token,
				token_type_hint: tokenTypeHint,
			}),
		});
	}

	async introspectToken(environmentId, token, tokenTypeHint = 'access_token') {
		return this.request(`/v1/environments/${environmentId}/as/introspect`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: new URLSearchParams({
				token,
				token_type_hint: tokenTypeHint,
			}),
		});
	}
}

export default new PingOneAPI();
