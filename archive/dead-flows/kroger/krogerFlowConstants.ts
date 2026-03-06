// src/pages/flows/kroger/krogerFlowConstants.ts

export const FLOW_KEY = 'kroger-grocery-store-mfa';
export const WORKER_TOKEN_STORAGE_KEY = `pingone_worker_token_${FLOW_KEY}`;
export const WORKER_TOKEN_EXPIRY_KEY = `pingone_worker_token_expires_at_${FLOW_KEY}`;
export const USERNAME_STORAGE_KEY = `${FLOW_KEY}_login_username`;

export const KROGER_DEFAULT_USERNAME = 'curtis7';
export const KROGER_DEFAULT_PASSWORD = 'Coffee7&';

export const DEFAULT_SCOPE = 'openid profile email';
export const DEFAULT_REDIRECT_PATH = '/kroger-authz-callback';

export const SUCCESS_MESSAGES = {
	redirectlessComplete: 'Authentication successful! Redirecting to MFA configuration...',
	tokenExchangeComplete: 'Tokens retrieved successfully. Loading Kroger MFA experience...',
};

export const ERROR_MESSAGES = {
	missingCredentials:
		'Client ID and Client Secret are required. Configure your Authorization Code client first.',
	missingEnvironment: 'Configure your PingOne environment before attempting authentication.',
	missingWorkerToken: 'Generate a PingOne worker token before managing MFA devices.',
	redirectlessFailed: 'Redirectless authentication failed. Please try again.',
	tokenExchangeFailed:
		'Failed to exchange authorization code for tokens. Verify your client credentials.',
	userLookupFailed:
		'Unable to locate the PingOne user. Ensure the account exists and your worker token includes user read scope.',
};
