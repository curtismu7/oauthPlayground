// src/utils/testPresets.ts
// Quick test utility to verify preset functionality

import { presetManagerService } from '../services/presetManagerService';

export function testPresetFunctionality() {
	try {
		// Test 1: Load built-in presets
		const _builtInPresets = presetManagerService.getBuiltInPresets();

		// Test 2: Test preset filtering by app type
		const _webAppPresets = presetManagerService.getPresetsByAppType('OIDC_WEB_APP');
		const _workerPresets = presetManagerService.getPresetsByAppType('WORKER');
		const _spaPresets = presetManagerService.getPresetsByAppType('SINGLE_PAGE_APP');

		// Test 3: Test preset application - Worker App
		const workerPreset = presetManagerService.getPresetById('worker-app-basic');
		if (workerPreset) {
			presetManagerService.applyPreset('worker-app-basic');
		}

		// Test 4: Test OIDC Enterprise preset
		const oidcPreset = presetManagerService.getPresetById('oidc-web-enterprise');
		if (oidcPreset) {
			presetManagerService.applyPreset('oidc-web-enterprise');
		}

		// Test 5: Test Device Authorization preset
		const devicePreset = presetManagerService.getPresetById('device-auth-tv');
		if (devicePreset) {
			presetManagerService.applyPreset('device-auth-tv');
		}

		// Test 6: Test custom preset creation
		const testCustomPreset = presetManagerService.saveCustomPreset({
			name: 'Test Custom Preset',
			description: 'A test preset for validation',
			appType: 'SINGLE_PAGE_APP',
			configuration: {
				name: 'Test App',
				description: 'Test Description',
				enabled: true,
				redirectUris: ['http://localhost:3000/test'],
				postLogoutRedirectUris: ['http://localhost:3000'],
				grantTypes: ['authorization_code'],
				responseTypes: ['code'],
				tokenEndpointAuthMethod: 'none',
				pkceEnforcement: 'REQUIRED',
				scopes: ['openid', 'profile'],
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
			},
		});

		// Test 7: Test custom preset retrieval
		presetManagerService.getCustomPresets();

		// Test 8: Test preset deletion
		presetManagerService.deleteCustomPreset(testCustomPreset.id);

		return true;
	} catch (error) {
		console.error('❌ Preset test failed:', error);
		return false;
	}
}

// Auto-run test in development (silently)
if (process.env.NODE_ENV === 'development') {
	// Delay to ensure DOM is ready
	setTimeout(() => {
		testPresetFunctionality();
	}, 1000);
}
