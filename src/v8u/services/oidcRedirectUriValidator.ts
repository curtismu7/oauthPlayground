/**
 * OIDC Redirect URI Validation Service
 * Validates redirect URIs against PingOne client configuration
 */

export const OIDCRedirectUriValidator = {
	/**
	 * Validate redirect URI against client configuration
	 */
	async validateRedirectUri(
		redirectUri: string,
		clientId: string,
		environmentId: string
	): Promise<boolean> {
		try {
			// Get client configuration from PingOne
			const response = await fetch(
				`https://auth.pingone.com/${environmentId}/as/clients/${clientId}`,
				{
					headers: {
						Authorization: `Bearer ${await OIDCRedirectUriValidator.getAccessToken()}`,
						'Content-Type': 'application/json',
					},
				}
			);

			if (!response.ok) {
				console.error('Failed to fetch client configuration');
				return false;
			}

			const clientConfig = await response.json();
			const validRedirectUris = clientConfig.redirectUris || [];

			return validRedirectUris.includes(redirectUri);
		} catch (error) {
			console.error('Error validating redirect URI:', error);
			return false;
		}
	},

	async getAccessToken(): Promise<string> {
		// Implementation for getting admin access token
		// This would use the worker token or admin credentials
		return '';
	},
};
