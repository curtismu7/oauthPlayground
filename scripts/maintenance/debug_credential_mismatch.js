console.log('🔍 Debugging Credential Mismatch Issue...');

// From the logs, we can see these values being used:
const currentCredentials = {
  environmentId: 'b9817c16-9910-4415-b67e-4ac687da74d9',
  clientId: 'a4f963ea-0736-456a-be72-b1fa4f63f81f',
  clientSecret: 'oihV6umR6VD-kFt~Ykb0jyHQhxcpHw49zcCk-Q7pjJpUGX3NQ5~.Ge4WKRCKUtrN'
};

console.log('Current credentials being used:');
console.log('Environment ID:', currentCredentials.environmentId);
console.log('Client ID:', currentCredentials.clientId);
console.log('Client Secret (first 20 chars):', `${currentCredentials.clientSecret.substring(0, 20)}...`);

// Check what's stored in the Authorization Code V7 flow
const authzV7Key = 'oauth-authorization-code-v7';
const authzV7Data = localStorage.getItem(authzV7Key);

if (authzV7Data) {
  const parsed = JSON.parse(authzV7Data);
  console.log('
Authorization Code V7 flow credentials:');
  console.log('Environment ID:', parsed.credentials?.environmentId);
  console.log('Client ID:', parsed.credentials?.clientId);
  console.log('Client Secret (first 20 chars):', parsed.credentials?.clientSecret ? `${parsed.credentials.clientSecret.substring(0, 20)}...` : 'Not set');
  
  // Check if there's a mismatch
  const envMatch = parsed.credentials?.environmentId === currentCredentials.environmentId;
  const clientMatch = parsed.credentials?.clientId === currentCredentials.clientId;
  const secretMatch = parsed.credentials?.clientSecret === currentCredentials.clientSecret;
  
  console.log('
🔍 Credential Comparison:');
  console.log('Environment ID match:', envMatch);
  console.log('Client ID match:', clientMatch);
  console.log('Client Secret match:', secretMatch);
  
  if (!envMatch || !clientMatch || !secretMatch) {
    console.log('
❌ MISMATCH DETECTED!');
    console.log('The Authorization Code V7 flow is using different credentials than expected.');
  } else {
    console.log('
✅ All credentials match - the issue might be elsewhere.');
  }
} else {
  console.log('
❌ No Authorization Code V7 flow credentials found');
}

console.log('
💡 Next Steps:');
console.log('1. Verify the Client Secret in PingOne matches what\'s being used');
console.log('2. Make sure the Environment ID is correct');
console.log('3. Check if there are any special characters or encoding issues');
console.log('4. Try regenerating the Client Secret in PingOne and updating the flow');
