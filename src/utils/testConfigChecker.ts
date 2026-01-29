// src/utils/testConfigChecker.ts
// Test file for Config Checker functionality

import { ConfigComparisonService } from '../services/configComparisonService';

// Mock test data
const mockFormData = {
	name: 'Test Application',
	clientId: 'test-client-id',
	grantTypes: ['authorization_code'],
	responseTypes: ['code'],
	redirectUris: ['https://example.com/callback'],
	scopes: ['openid', 'profile', 'email'],
	tokenEndpointAuthMethod: 'client_secret_basic',
};

const mockPingOneApp = {
	name: 'Test Application',
	clientId: 'test-client-id',
	grant_types: ['authorization_code'],
	response_types: ['code'],
	redirect_uris: ['https://example.com/callback'],
	scopes: ['openid', 'profile', 'email'],
	token_endpoint_auth_method: 'client_secret_basic',
};

// Test the normalization function
export function testConfigChecker() {
	try {
		// Create a mock service instance
		const service = new ConfigComparisonService('mock-token', 'mock-env', 'NA');

		// Test normalization
		const normalizedForm = (service as any).normalize(mockFormData);
		const normalizedApp = (service as any).normalize(mockPingOneApp);

		// Test diff function
		const _diffs = (service as any).diff(normalizedForm, normalizedApp);
	} catch (error) {
		console.error('❌ Config Checker test failed:', error);
	}
}

// Auto-run test in development
if (process.env.NODE_ENV === 'development') {
	testConfigChecker();
}
