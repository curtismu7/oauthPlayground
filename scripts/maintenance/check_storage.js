// Quick script to check localStorage
console.log('Checking localStorage for flow-specific credentials...');
const key 'implicit-v7';
const stored localStorage.getItem(key);
if (stored) {
 console.log('Found:', key);
 const parsed JSON.parse(stored);
 console.log('Credentials:', {
 environmentId: parsed.credentials?.environmentId,
 clientId: parsed.credentials?.clientId?.substring(0, 20) '...',
 redirectUri: parsed.credentials?.redirectUri
 });
} else {
 console.log('No credentials found for:', key);
}
