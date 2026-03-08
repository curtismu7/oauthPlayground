import React from 'react';
import { Navigate } from 'react-router-dom';

// Re-export types that are imported by other components
export interface PlaygroundResult {
	success: boolean;
	data?: unknown;
	error?: string;
	timestamp: number;
}

export const RESPONSE_TYPES = {
	SUCCESS: 'success',
	ERROR: 'error',
	INFO: 'info',
} as const;

export const RESULT_STORAGE_KEY = 'pingone_auth_result';
export const STORAGE_KEY = 'pingone_auth_config';
export const FLOW_CONTEXT_KEY = 'pingone_flow_context';
export const REDIRECT_FLOW_CONTEXT_KEY = 'pingone_redirect_flow_context';

// Default configuration for PingOne authentication
export const DEFAULT_CONFIG = {
	environmentId: '',
	clientId: '',
	clientSecret: '',
	redirectUri: `${window.location.origin}/p1-callback`,
	scopes: 'openid profile email',
	responseType: 'code' as const,
	tokenEndpointAuthMethod: 'client_secret_post' as const,
};

/**
 * PingOne Authentication Page
 *
 * This is a placeholder component that redirects to the main authentication flow.
 * The original implementation appears to be missing, so this provides a minimal
 * fallback to prevent build failures.
 */
const PingOneAuthentication: React.FC = () => {
	// Redirect to the main OAuth flow or authentication callback
	return <Navigate to="/flows/pingone-complete-mfa-v7" replace />;
};

export default PingOneAuthentication;
