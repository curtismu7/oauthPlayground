// src/utils/testExportImport.ts
// Test utilities for export/import functionality

import { exportImportService, exportUtils } from '../services/exportImportService';
import type { FormDataState, BuilderAppType } from '../services/presetManagerService';

export function testExportImportFunctionality() {
  console.log('🧪 Testing Export/Import Functionality...');
  
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
      signoffUrls: []
    };

    const testAppType: BuilderAppType = 'SINGLE_PAGE_APP';

    // Test 1: Create shareable configuration
    const shareableConfig = exportUtils.createShareableConfig(testConfig, testAppType);
    console.log('✅ Shareable configuration created');
    console.log('   - Version:', shareableConfig.version);
    console.log('   - App Type:', shareableConfig.appType);
    console.log('   - Name:', shareableConfig.metadata.name);

    // Test 2: Validate configuration structure
    const validation = exportImportService.validateImportedConfiguration(shareableConfig);
    console.log('✅ Configuration validation:', validation.isValid ? 'PASSED' : 'FAILED');
    
    if (!validation.isValid) {
      console.log('   - Errors:', validation.errors);
    }
    
    if (validation.warnings && validation.warnings.length > 0) {
      console.log('   - Warnings:', validation.warnings);
    }

    // Test 3: Create configuration blob
    const blob = exportImportService.createConfigurationBlob(shareableConfig);
    console.log('✅ Configuration blob created');
    console.log('   - Size:', blob.size, 'bytes');
    console.log('   - Type:', blob.type);

    // Test 4: Test file validation
    const testFile = new File([blob], 'test-config.json', { type: 'application/json' });
    
    // Simulate import validation
    exportImportService.importConfiguration(testFile).then(importResult => {
      console.log('✅ Import validation completed');
      console.log('   - Valid:', importResult.isValid);
      console.log('   - Errors:', importResult.errors.length);
      console.log('   - Warnings:', importResult.warnings.length);
      
      if (importResult.configuration) {
        console.log('   - Imported name:', importResult.configuration.name);
        console.log('   - Imported scopes:', importResult.configuration.scopes);
      }
    }).catch(error => {
      console.error('❌ Import test failed:', error);
    });

    console.log('🎉 Export/Import tests completed!');
    return true;
    
  } catch (error) {
    console.error('❌ Export/Import test failed:', error);
    return false;
  }
}

// Auto-run test in development
if (process.env.NODE_ENV === 'development') {
  // Delay to ensure DOM is ready
  setTimeout(() => {
    testExportImportFunctionality();
  }, 2000);
}