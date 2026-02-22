/**
 * Test script to verify domain configuration saving
 * Run this in the browser console on the OAuth Playground
 */

// Test domain configuration
console.log('=== Testing Domain Configuration ===');

// Get the domain configuration service
const domainService = window.domainConfigurationService || 
  (window.oauthPlayground?.domainConfigurationService);

if (domainService) {
  console.log('✅ Domain service found');
  
  // Get current config
  const currentConfig = domainService.getConfig();
  console.log('Current config:', currentConfig);
  
  // Test saving a custom domain
  console.log('Testing save with auth.curtis.com...');
  try {
    const result = domainService.saveConfig({
      customDomain: 'https://auth.curtis.com',
      useCustomDomain: true,
      enforceHttps: true
    });
    console.log('✅ Save result:', result);
    
    // Verify it was saved
    const updatedConfig = domainService.getConfig();
    console.log('✅ Updated config:', updatedConfig);
    
    // Check localStorage directly
    const stored = localStorage.getItem('oauth-playground-domain-config');
    console.log('✅ Raw localStorage:', stored);
    
    // Test effective domain
    const effectiveDomain = domainService.getEffectiveDomain();
    console.log('✅ Effective domain:', effectiveDomain);
    
  } catch (error) {
    console.error('❌ Error saving config:', error);
  }
} else {
  console.log('❌ Domain service not found');
  console.log('Available window properties:', Object.keys(window).filter(k => k.includes('domain') || k.includes('config')));
}

// Check localStorage directly
console.log('\n=== Direct localStorage check ===');
console.log('Domain config key:', localStorage.getItem('oauth-playground-domain-config'));
console.log('Previous domain:', localStorage.getItem('oauth-playground-previous-domain'));

// List all localStorage keys
console.log('\n=== All localStorage keys ===');
Object.keys(localStorage).forEach(key => {
  if (key.includes('domain') || key.includes('oauth')) {
    console.log(`${key}:`, localStorage.getItem(key));
  }
});
