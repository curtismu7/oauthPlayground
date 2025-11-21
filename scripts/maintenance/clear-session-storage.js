// Quick script to clear all OAuth/OIDC flow sessionStorage
console.log('Clearing all OAuth/OIDC flow sessionStorage...');

const keysToRemove = [
	'oauth_auth_code',
	'oauth_state',
	'flowContext',
	'oauth-authorization-code-v5-current-step',
	'oidc-authorization-code-v5-current-step',
	'oidc-authorization-code-v6-current-step',
	'oauth-authorization-code-v5-app-config',
	'oidc-authorization-code-v5-app-config',
	'oidc-authorization-code-v6-app-config',
	'restore_step',
];

keysToRemove.forEach((key) => {
	if (sessionStorage.getItem(key)) {
		console.log(`Removing: ${key}`);
		sessionStorage.removeItem(key);
	}
});

console.log('✅ SessionStorage cleared!');
console.log('📝 To use: Copy this script and paste it in browser console (F12)');
