console.log('🧹 Clearing Client Credentials V7 cached credentials...');

// Clear client credentials specific storage
const keysToRemove = [
  'client-credentials-v7',
  'client_credentials_config',
  'client_credentials_tokens',
  'client_credentials_v7_auth_method'
];

let removedCount = 0;
keysToRemove.forEach(key => {
  if (localStorage.getItem(key)) {
    localStorage.removeItem(key);
    removedCount++;
    console.log('✅ Removed:', key);
  }
});

// Also clear any flow-specific storage
Object.keys(localStorage).forEach(key => {
  if (key.includes('client-credentials') || key.includes('client_credentials')) {
    localStorage.removeItem(key);
    removedCount++;
    console.log('✅ Removed:', key);
  }
});

console.log(`🎉 Cleared ${removedCount} client credentials cache entries`);
console.log('🔄 Please refresh the page to see the new default scopes (openid)');
