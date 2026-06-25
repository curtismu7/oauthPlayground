/**
 * @file workerTokenApiClient.ts
 * @description Frontend API client for worker token endpoints
 */

interface GenerateTokenRequest {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	region: 'us' | 'eu' | 'ap' | 'ca';
	authMethod: 'client_secret_basic' | 'client_secret_post';
	customDomain?: string;
	roles?: string[];
	name?: string;
}

interface TokenResponse {
	id: string;
	expiresAt: number;
	expiresIn: number;
	status: 'active' | 'expiring' | 'expired' | 'revoked';
	roles?: string[];
	name?: string;
	createdAt?: number;
}

interface HistoryItem extends TokenResponse {
	token: string;
	revokedAt?: number;
}

export const workerTokenApiClient = {
	/**
	 * Generate a new worker token
	 */
	async generateToken(request: GenerateTokenRequest): Promise<{ id: string; token: string; expiresAt: number }> {
		const response = await fetch('/api/worker-tokens', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(request),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Failed to generate token');
		}

		return response.json();
	},

	/**
	 * Get active worker token
	 */
	async getActiveToken(): Promise<TokenResponse | null> {
		const response = await fetch('/api/worker-tokens');

		if (!response.ok) {
			throw new Error('Failed to fetch active token');
		}

		const data = await response.json();
		return data.active || null;
	},

	/**
	 * Get token by ID
	 */
	async getToken(id: string): Promise<TokenResponse> {
		const response = await fetch(`/api/worker-tokens/${id}`);

		if (!response.ok) {
			throw new Error('Failed to fetch token');
		}

		return response.json();
	},

	/**
	 * Revoke a token
	 */
	async revokeToken(id: string): Promise<void> {
		const response = await fetch(`/api/worker-tokens/${id}`, {
			method: 'DELETE',
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Failed to revoke token');
		}
	},

	/**
	 * Get token history
	 */
	async getHistory(): Promise<HistoryItem[]> {
		const response = await fetch('/api/worker-tokens/history');

		if (!response.ok) {
			throw new Error('Failed to fetch history');
		}

		const data = await response.json();
		return data.history || [];
	},
};
