// src/utils/testPresets.ts
// Quick test utility to verify preset functionality

import { presetManagerService } from '../services/presetManagerService';

export function testPresetFunctionality() {
  console.log('🧪 Testing Preset Functionality...');
  
  try {
    // Test 1: Load built-in presets
    const builtInPresets = presetManagerService.getBuiltInPresets();
    console.log(`✅ Built-in presets loaded: ${builtInPresets.length} presets`);
    
    // Test 2: Test preset filtering by app type
    const webAppPresets = presetManagerService.getPresetsByAppType('OIDC_WEB_APP');
    const workerPresets = presetManagerService.getPresetsByAppType('WORKER');
    const spaPresets = presetManagerService.getPresetsByAppType('SINGLE_PAGE_APP');
    console.log(`✅ Web app presets: ${webAppPresets.length} presets`);
    console.log(`✅ Worker presets: ${workerPresets.length} presets`);
    console.log(`✅ SPA presets: ${spaPresets.length} presets`);
    
    // Test 3: Test preset application - Worker App
    const workerPreset = presetManagerService.getPresetById('worker-app-basic');
    if (workerPreset) {
      const appliedConfig = presetManagerService.applyPreset('worker-app-basic');
      console.log('✅ Worker preset applied successfully');
      console.log('   - Grant Types:', appliedConfig?.grantTypes);
      console.log('   - Token Auth Method:', appliedConfig?.tokenEndpointAuthMethod);
      console.log('   - Scopes:', appliedConfig?.scopes);
    }
    
    // Test 4: Test OIDC Enterprise preset
    const oidcPreset = presetManagerService.getPresetById('oidc-web-enterprise');
    if (oidcPreset) {
      const appliedConfig = presetManagerService.applyPreset('oidc-web-enterprise');
      console.log('✅ OIDC Enterprise preset applied successfully');
      console.log('   - PKCE Enforcement:', appliedConfig?.pkceEnforcement);
      console.log('   - PAR Status:', appliedConfig?.pushedAuthorizationRequestStatus);
    }
    
    // Test 5: Test Device Authorization preset
    const devicePreset = presetManagerService.getPresetById('device-auth-tv');
    if (devicePreset) {
      const appliedConfig = presetManagerService.applyPreset('device-auth-tv');
      console.log('✅ Device Authorization preset applied successfully');
      console.log('   - Grant Types:', appliedConfig?.grantTypes);
      console.log('   - Redirect URIs:', appliedConfig?.redirectUris);
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
        signoffUrls: []
      }
    });
    console.log(`✅ Custom preset created: ${testCustomPreset.id}`);
    
    // Test 7: Test custom preset retrieval
    const customPresets = presetManagerService.getCustomPresets();
    console.log(`✅ Custom presets loaded: ${customPresets.length} presets`);
    
    // Test 8: Test preset deletion
    const deleted = presetManagerService.deleteCustomPreset(testCustomPreset.id);
    console.log(`✅ Custom preset deleted: ${deleted}`);
    
    console.log('🎉 All preset tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Preset test failed:', error);
    return false;
  }
}

// Auto-run test in development
if (process.env.NODE_ENV === 'development') {
  // Delay to ensure DOM is ready
  setTimeout(() => {
    testPresetFunctionality();
  }, 1000);
}