console.log('🔧 Fixing Authorization Code V7 to Enable ID Tokens...');

// The issue: Authorization Code V7 flow is only requesting 'code' response type
// For proper OpenID Connect, we need 'code id_token' response type

const fixAuthzV7ResponseType = () => {
  const authzV7Key = 'oauth-authorization-code-v7';
  const currentData = JSON.parse(localStorage.getItem(authzV7Key) || '{}');
  
  if (currentData.credentials) {
    // Enable ID token response type for proper OpenID Connect
    currentData.credentials.responseTypeIdToken = true;
    currentData.credentials.responseType = 'code id_token';
    
    // Also update the flow config if it exists
    if (currentData.flowConfig) {
      currentData.flowConfig.responseTypeIdToken = true;
    }
    
    // Save back to localStorage
    localStorage.setItem(authzV7Key, JSON.stringify(currentData));
    
    console.log('✅ Updated Authorization Code V7 to request ID tokens');
    console.log('Response Type:', currentData.credentials.responseType);
    console.log('ID Token enabled:', currentData.credentials.responseTypeIdToken);
    
    return true;
  } else {
    console.log('❌ No Authorization Code V7 credentials found');
    return false;
  }
};

// Also check the PingOne app config
const fixPingOneAppConfig = () => {
  const appConfigKey = 'oauth-authorization-code-v7-app-config';
  const currentConfig = JSON.parse(sessionStorage.getItem(appConfigKey) || '{}');
  
  // Enable ID token in PingOne app config
  currentConfig.responseTypeIdToken = true;
  currentConfig.responseTypeCode = true;
  
  // Save back to sessionStorage
  sessionStorage.setItem(appConfigKey, JSON.stringify(currentConfig));
  
  console.log('✅ Updated PingOne app config to enable ID tokens');
  console.log('Response Type Code:', currentConfig.responseTypeCode);
  console.log('Response Type ID Token:', currentConfig.responseTypeIdToken);
  
  return true;
};

// Run the fixes
console.log('
🔧 Applying fixes...');
const credentialsFixed = fixAuthzV7ResponseType();
const configFixed = fixPingOneAppConfig();

if (credentialsFixed && configFixed) {
  console.log('
🎉 All fixes applied successfully!');
  console.log('
📝 What was fixed:');
  console.log('1. ✅ Enabled ID token response type in Authorization Code V7 flow');
  console.log('2. ✅ Updated PingOne app configuration');
  console.log('3. ✅ Set response_type to "code id_token" for proper OpenID Connect');
  
  console.log('
🔄 Next steps:');
  console.log('1. Refresh the Authorization Code V7 flow page');
  console.log('2. Try the flow again - you should now get ID tokens');
  console.log('3. Check for UserInfo and Introspection endpoints');
} else {
  console.log('
❌ Some fixes failed - check the errors above');
}

// Make functions available globally for manual use
window.fixAuthzV7ResponseType = fixAuthzV7ResponseType;
window.fixPingOneAppConfig = fixPingOneAppConfig;
