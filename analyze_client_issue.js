console.log('🔍 Analyzing Client Credentials Issue...');

// From the logs, we can see the current client being used
const currentClientId = 'a4f963ea-0736-456a-be72-b1fa4f63f81f';
console.log('Current client ID:', currentClientId);

// Check what other clients are available in your stored credentials
const allKeys = Object.keys(localStorage);
const clientIds = new Set();

allKeys.forEach(key => {
  try {
    const data = JSON.parse(localStorage.getItem(key));
    if (data.credentials?.clientId) {
      clientIds.add(data.credentials.clientId);
    }
    if (data.clientId) {
      clientIds.add(data.clientId);
    }
  } catch (e) {
    // Ignore parse errors
  }
});

console.log('
📋 Available Client IDs in your stored credentials:');
Array.from(clientIds).forEach((clientId, index) => {
  console.log(`${index + 1}. ${clientId}`);
});

console.log('
💡 Solution:');
console.log('The client "a4f963ea-0736-456a-be72-b1fa4f63f81f" is not configured for Authorization Code flow.');
console.log('You need to either:');
console.log('1. Use a different client that supports Authorization Code flow');
console.log('2. Configure the current client in PingOne to support Authorization Code flow');
console.log('3. Create a new client in PingOne specifically for Authorization Code flow');

console.log('
🔧 To fix this:');
console.log('1. Go to your PingOne Admin Console');
console.log('2. Navigate to Applications → [Your Application]');
console.log('3. Check the "Grant Types" section');
console.log('4. Make sure "Authorization Code" is enabled');
console.log('5. Or create a new application with Authorization Code grant type enabled');

console.log('
📝 Alternative: Use a different client');
console.log('If you have other clients available, you can update the Authorization Code V7 flow');
console.log('to use a client that supports Authorization Code flow.');
