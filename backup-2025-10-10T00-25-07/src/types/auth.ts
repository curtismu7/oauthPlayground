import { OAuthTokenResponse, UserInfo } from './storage';

export interface User {
	sub: string;
	id?: string;
	email?: string;
	name?: string;
	given_name?: string;
	family_name?: string;
	picture?: string;
	[key: string]: unknown;
}

export interface LoginResult {
	success: boolean;
	error?: string;
	redirectUrl?: string;
}

export interface AuthState {
	isAuthenticated: boolean;
	user: UserInfo | null;
	tokens: OAuthTokenResponse | null;
	isLoading: boolean;
	error: string | null;
}

export interface AuthContextType extends AuthState {
	config: {
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
	} | null;
	login: (
		redirectAfterLogin?: string,
		callbackType?: 'dashboard' | 'oauth'
	) => Promise<LoginResult>;
	logout: () => void;
	handleCallback: (url: string) => Promise<LoginResult>;
	setAuthState: (updates: Partial<AuthState>) => void;
	showAuthModal: boolean;
	authRequestData: {
		authorizationUrl: string;
		requestParams: Record<string, string>;
	} | null;
	proceedWithOAuth: () => void;
	closeAuthModal: () => void;
	updateTokens: (tokens: OAuthTokenResponse | null) => void;
	dismissError: () => void;
}

export interface AuthProviderProps {
	children: React.ReactNode;
}
