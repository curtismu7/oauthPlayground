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
  tokenEndpointAuthMethod: 'client_secret_basic'
};

const mockPingOneApp = {
  name: 'Test Application',
  clientId: 'test-client-id',
  grant_types: ['authorization_code'],
  response_types: ['code'],
  redirect_uris: ['https://example.com/callback'],
  scopes: ['openid', 'profile', 'email'],
  token_endpoint_auth_method: 'client_secret_basic'
};

// Test the normalization function
export function testConfigChecker() {
  console.log('🧪 Testing Config Checker...');
  
  try {
    // Create a mock service instance
    const service = new ConfigComparisonService('mock-token', 'mock-env', 'NA');
    
    // Test normalization
    const normalizedForm = (service as any).normalize(mockFormData);
    const normalizedApp = (service as any).normalize(mockPingOneApp);
    
    console.log('✅ Form data normalized:', normalizedForm);
    console.log('✅ PingOne app normalized:', normalizedApp);
    
    // Test diff function
    const diffs = (service as any).diff(normalizedForm, normalizedApp);
    console.log('✅ Differences found:', diffs);
    
    if (diffs.length === 0) {
      console.log('✅ No differences detected - normalization working correctly');
    } else {
      console.log('⚠️ Differences detected:', diffs);
    }
    
    console.log('🎉 Config Checker test completed successfully!');
    
  } catch (error) {
    console.error('❌ Config Checker test failed:', error);
  }
}

// Auto-run test in development
if (process.env.NODE_ENV === 'development') {
  testConfigChecker();
}



