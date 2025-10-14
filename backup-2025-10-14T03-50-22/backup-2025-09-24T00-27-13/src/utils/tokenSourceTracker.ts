// Token source tracking utility
export interface TokenSource {
	source:
		| 'login'
		| 'auth-code-flow'
		| 'implicit-flow'
		| 'pkce-flow'
		| 'client-credentials'
		| 'device-code'
		| 'userinfo'
		| 'manual';
	timestamp: number;
	description: string;
	tokens: {
		access_token?: string;
		id_token?: string;
		refresh_token?: string;
		token_type?: string;
		expires_in?: number;
		scope?: string;
	};
}

class TokenSourceTracker {
	private readonly STORAGE_KEY = 'oauth_token_sources';
	private readonly MAX_HISTORY = 50;

	// Store a new token source
	storeTokenSource(source: Omit<TokenSource, 'timestamp'>): void {
		try {
			const tokenSource: TokenSource = {
				...source,
				timestamp: Date.now(),
			};

			const existing = this.getTokenSources();
			existing.unshift(tokenSource); // Add to beginning

			// Keep only the most recent tokens
			if (existing.length > this.MAX_HISTORY) {
				existing.splice(this.MAX_HISTORY);
			}

			localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existing));

			console.log(
				'🔍 [TokenSourceTracker] Stored token source:',
				source.source,
				source.description
			);
		} catch (error) {
			console.error('❌ [TokenSourceTracker] Error storing token source:', error);
		}
	}

	// Get all stored token sources
	getTokenSources(): TokenSource[] {
		try {
			const stored = localStorage.getItem(this.STORAGE_KEY);
			return stored ? JSON.parse(stored) : [];
		} catch (error) {
			console.error('❌ [TokenSourceTracker] Error getting token sources:', error);
			return [];
		}
	}

	// Get the most recent token source
	getLatestTokenSource(): TokenSource | null {
		const sources = this.getTokenSources();
		return sources.length > 0 ? sources[0] : null;
	}

	// Get tokens from the most recent source
	getLatestTokens(): TokenSource['tokens'] | null {
		const latest = this.getLatestTokenSource();
		return latest ? latest.tokens : null;
	}

	// Clear all token sources
	clearTokenSources(): void {
		try {
			localStorage.removeItem(this.STORAGE_KEY);
			console.log('🔍 [TokenSourceTracker] Cleared all token sources');
		} catch (error) {
			console.error('❌ [TokenSourceTracker] Error clearing token sources:', error);
		}
	}

	// Get source description for display
	getSourceDescription(source: TokenSource['source']): string {
		const descriptions = {
			login: 'OAuth Login Flow',
			'auth-code-flow': 'Authorization Code Flow',
			'implicit-flow': 'Implicit Grant Flow',
			'pkce-flow': 'PKCE Flow',
			'client-credentials': 'Client Credentials Flow',
			'device-code': 'Device Code Flow',
			userinfo: 'UserInfo Endpoint',
			manual: 'Manually Entered',
		};
		return descriptions[source] || 'Unknown Source';
	}
}

export const tokenSourceTracker = new TokenSourceTracker();
