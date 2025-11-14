console.log('🔧 Clearing Authorization Code V7 Configuration Cache...');

// Clear the cached configuration to force reload with new defaults
const keysToClear = [
  'oauth-authorization-code-v7',
  'oauth-authorization-code-v7-app-config',
  'oauth-authorization-code-v7-step-results',
  'oauth-authorization-code-v7-current-step',
  'oauth-authorization-code-v7-pkce-codes'
];

let clearedCount = 0;
keysToClear.forEach(key => {
  // Clear from localStorage
  if (localStorage.getItem(key)) {
    localStorage.removeItem(key);
    clearedCount++;
    console.log('✅ Cleared localStorage:', key);
  }
  
  // Clear from sessionStorage
  if (sessionStorage.getItem(key)) {
    sessionStorage.removeItem(key);
    clearedCount++;
    console.log('✅ Cleared sessionStorage:', key);
  }
});

console.log(`
🎉 Cleared ${clearedCount} cached configuration entries`);
console.log('
📝 What was fixed:');
console.log('1. ✅ Changed default response_type from "code" to "code id_token" for OIDC variant');
console.log('2. ✅ Enabled responseTypeIdToken by default for OIDC variant');
console.log('3. ✅ Fixed ResponseTypeEnforcer to use OIDC mode instead of OAuth mode');
console.log('4. ✅ Cleared cached configuration to force reload with new defaults');

console.log('
🔄 Next steps:');
console.log('1. Refresh the Authorization Code V7 flow page');
console.log('2. The flow should now request "code id_token" response type');
console.log('3. You should get ID tokens in the token response');
console.log('4. Check for UserInfo and Introspection endpoints');

console.log('
🎯 Expected result:');
console.log('- Authorization URL should include response_type=code+id_token');
console.log('- Token response should include id_token field');
console.log('- UserInfo endpoint should be available for user profile data');
