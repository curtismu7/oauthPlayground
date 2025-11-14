// Debug script to check redirect URI configuration
console.log('=== REDIRECT URI DEBUG ===');

// Check localStorage for credentials
const pingoneConfig = localStorage.getItem('pingone_config');
const loginCredentials = localStorage.getItem('login_credentials');
const enhancedFlowConfig = localStorage.getItem('enhanced-flow-authorization-code');

console.log('1. pingone_config:', pingoneConfig ? JSON.parse(pingoneConfig) : 'Not found');
console.log('2. login_credentials:', loginCredentials ? JSON.parse(loginCredentials) : 'Not found');
console.log(
	'3. enhanced-flow-authorization-code:',
	enhancedFlowConfig ? JSON.parse(enhancedFlowConfig) : 'Not found'
);

// Check sessionStorage for any redirect URI overrides
const sessionKeys = Object.keys(sessionStorage).filter(
	(key) => key.includes('redirect') || key.includes('uri')
);
console.log('4. SessionStorage redirect/uri keys:', sessionKeys);
sessionKeys.forEach((key) => {
	console.log(`   ${key}:`, sessionStorage.getItem(key));
});

// Check what getCallbackUrlForFlow would return
const currentOrigin = window.location.origin;
const expectedCallback = `${currentOrigin}/authz-callback`;
console.log('5. Expected callback URL:', expectedCallback);
console.log('6. Current origin:', currentOrigin);

// Check credential manager if available
if (typeof credentialManager !== 'undefined') {
	try {
		const authzCredentials = credentialManager.loadAuthzFlowCredentials();
		console.log('7. Credential Manager authz credentials:', authzCredentials);
	} catch (e) {
		console.log('7. Credential Manager not available:', e.message);
	}
}

console.log('=== END DEBUG ===');
