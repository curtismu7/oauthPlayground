console.log('🔧 Quick Fix: Update Authorization Code V7 Client Credentials...');

// Function to update the Authorization Code V7 flow credentials
const updateAuthzV7Credentials = (newClientId, newClientSecret) => {
  const authzV7Key = 'oauth-authorization-code-v7';
  const currentData = JSON.parse(localStorage.getItem(authzV7Key) || '{}');
  
  // Update the credentials
  if (currentData.credentials) {
    currentData.credentials.clientId = newClientId;
    if (newClientSecret) {
      currentData.credentials.clientSecret = newClientSecret;
    }
    
    // Save back to localStorage
    localStorage.setItem(authzV7Key, JSON.stringify(currentData));
    
    console.log('✅ Updated Authorization Code V7 credentials:');
    console.log('   Client ID:', newClientId);
    console.log('   Client Secret:', newClientSecret ? 'Updated' : 'Unchanged');
    
    return true;
  } else {
    console.log('❌ No existing Authorization Code V7 credentials found');
    return false;
  }
};

// Example usage - replace with your actual client credentials
console.log('
📝 To update the client credentials, run:');
console.log('updateAuthzV7Credentials("YOUR_NEW_CLIENT_ID", "YOUR_NEW_CLIENT_SECRET");');
console.log('
Example:');
console.log('updateAuthzV7Credentials("12345678-1234-1234-1234-123456789012", "your-secret-here");');

// Make the function available globally
window.updateAuthzV7Credentials = updateAuthzV7Credentials;

console.log('
🔄 After updating, refresh the page and try the Authorization Code V7 flow again.');
