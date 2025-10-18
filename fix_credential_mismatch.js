console.log('🔧 Fix Credential Mismatch - Update Authorization Code V7 Credentials...');

// Function to update the Authorization Code V7 flow with correct credentials
const fixAuthzV7Credentials = () => {
  const authzV7Key = 'oauth-authorization-code-v7';
  const currentData = JSON.parse(localStorage.getItem(authzV7Key) || '{}');
  
  // Update with the correct values from PingOne
  if (currentData.credentials) {
    // These should match your PingOne configuration
    currentData.credentials.environmentId = 'b9817c16-9910-4415-b67e-4ac687da74d9';
    currentData.credentials.clientId = 'a4f963ea-0736-456a-be72-b1fa4f63f81f';
    
    // IMPORTANT: Update this with the actual client secret from PingOne
    // You can reveal it in PingOne and copy it here
    currentData.credentials.clientSecret = 'REPLACE_WITH_ACTUAL_CLIENT_SECRET';
    
    // Save back to localStorage
    localStorage.setItem(authzV7Key, JSON.stringify(currentData));
    
    console.log('✅ Updated Authorization Code V7 credentials');
    console.log('Environment ID:', currentData.credentials.environmentId);
    console.log('Client ID:', currentData.credentials.clientId);
    console.log('Client Secret: [UPDATED]');
    
    return true;
  } else {
    console.log('❌ No existing Authorization Code V7 credentials found');
    return false;
  }
};

// Function to get the current client secret from PingOne
const getClientSecretFromPingOne = () => {
  console.log('
📋 To get the correct Client Secret:');
  console.log('1. Go to your PingOne Admin Console');
  console.log('2. Navigate to Applications → [Your Application] → Configuration');
  console.log('3. Click the eye icon next to "Client Secret" to reveal it');
  console.log('4. Copy the full client secret');
  console.log('5. Run: fixAuthzV7Credentials() and replace the client secret');
};

// Make functions available globally
window.fixAuthzV7Credentials = fixAuthzV7Credentials;
window.getClientSecretFromPingOne = getClientSecretFromPingOne;

console.log('
🔧 To fix the credentials:');
console.log('1. Run: getClientSecretFromPingOne() for instructions');
console.log('2. Get the actual client secret from PingOne');
console.log('3. Run: fixAuthzV7Credentials() and update the client secret');
console.log('4. Refresh the page and try the Authorization Code V7 flow again');

console.log('
⚠️  Important: Make sure to use the exact client secret from PingOne!');
