// Script to clear test credentials from localStorage
console.log('🧹 Clearing test credentials from localStorage...');

// Clear all PingOne related localStorage items
const keysToCheck = [
  'pingone_permanent_credentials',
  'pingone_session_credentials', 
  'pingone_config',
  'login_credentials',
  'enhanced-flow-authorization-code'
];

keysToCheck.forEach(key => {
  const value = localStorage.getItem(key);
  if (value) {
    try {
      const parsed = JSON.parse(value);
      if (parsed.clientId === 'test-client-123' || parsed.environmentId === 'test-env-123') {
        console.log(`🗑️ Removing test credentials from ${key}`);
        localStorage.removeItem(key);
      }
    } catch (e) {
      // Not JSON, check if it contains test values
      if (value.includes('test-client-123') || value.includes('test-env-123')) {
        console.log(`🗑️ Removing test credentials from ${key}`);
        localStorage.removeItem(key);
      }
    }
  }
});

console.log('✅ Test credentials cleared from localStorage');
console.log('🔄 Please refresh the page to reload with clean credentials');
