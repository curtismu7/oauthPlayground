/**
 * @file authConfigTypes.ts
 * @description Type definitions for Auth Configuration Context
 * @version 9.16.24
 */

// Define window interface for PingOne environment variables
declare global {
	interface Window {
		__PINGONE_ENVIRONMENT_ID__?: string;
		__PINGONE_API_URL__?: string;
		__PINGONE_CLIENT_ID__?: string;
		__PINGONE_CLIENT_SECRET__?: string;
		__PINGONE_REDIRECT_URI__?: string;
	}
}

// Define the complete config type with all required properties
export interface AppConfig {
	disableLogin: boolean;
	clientId: string;
	clientSecret: string;
	redirectUri: string;
	authorizationEndpoint: string;
	tokenEndpoint: string;
	userInfoEndpoint: string;
	endSessionEndpoint: string;
	scopes: string[];
	environmentId: string;
	hasConfigError?: boolean;
	[key: string]: unknown;
}

export interface AuthConfigContextType {
	config: AppConfig;
	refreshConfig: () => Promise<void>;
	isLoading: boolean;
	configError: string | null;
}
