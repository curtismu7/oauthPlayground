// src/utils/testExportImport.ts
// Test utilities for export/import functionality

import { exportImportService, exportUtils } from '../services/exportImportService';
import type { BuilderAppType, FormDataState } from '../services/presetManagerService';

export function testExportImportFunctionality() {
	try {
		// Test configuration for testing
		const testConfig: FormDataState = {
			name: 'Test Application',
			description: 'Test application for export/import testing',
			enabled: true,
			redirectUris: ['http://localhost:3000/callback'],
			postLogoutRedirectUris: ['http://localhost:3000'],
			grantTypes: ['authorization_code', 'refresh_token'],
			responseTypes: ['code'],
			tokenEndpointAuthMethod: 'client_secret_basic',
			pkceEnforcement: 'REQUIRED',
			scopes: ['openid', 'profile', 'email'],
			accessTokenValiditySeconds: 3600,
			refreshTokenValiditySeconds: 86400,
			idTokenValiditySeconds: 3600,
			refreshTokenDuration: 1,
			refreshTokenRollingDuration: 7,
			refreshTokenRollingGracePeriod: 0,
			allowRedirectUriPatterns: false,
			jwksUrl: '',
			pushedAuthorizationRequestStatus: 'OPTIONAL',
			parReferenceTimeout: 60,
			initiateLoginUri: '',
			targetLinkUri: '',
			signoffUrls: [],
		};

		const testAppType: BuilderAppType = 'SINGLE_PAGE_APP';

		// Test 1: Create shareable configuration
		const shareableConfig = exportUtils.createShareableConfig(testConfig, testAppType);

		// Test 2: Validate configuration structure
		exportImportService.validateImportedConfiguration(shareableConfig);

		// Test 3: Create configuration blob
		const blob = exportImportService.createConfigurationBlob(shareableConfig);

		// Test 4: Test file validation
		const testFile = new File([blob], 'test-config.json', { type: 'application/json' });

		// Simulate import validation
		exportImportService
			.importConfiguration(testFile)
			.catch((error) => {
				console.error('❌ Import test failed:', error);
			});

		return true;
	} catch (error) {
		console.error('❌ Export/Import test failed:', error);
		return false;
	}
}

// Auto-run test in development (silently)
if (process.env.NODE_ENV === 'development') {
	// Delay to ensure DOM is ready
	setTimeout(() => {
		testExportImportFunctionality();
	}, 2000);
}
