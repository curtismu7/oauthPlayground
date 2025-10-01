// Clear localStorage script for testing
console.log('🧹 Clearing localStorage...');

// Clear old keys
localStorage.removeItem('pingone_config');
localStorage.removeItem('login_credentials');

// Clear new credential manager keys
localStorage.removeItem('pingone_permanent_credentials');
sessionStorage.removeItem('pingone_session_credentials');

// Clear any other OAuth-related keys
Object.keys(localStorage).forEach((key) => {
	if (key.includes('pingone') || key.includes('oauth') || key.includes('credential')) {
		localStorage.removeItem(key);
		console.log(`Removed: ${key}`);
	}
});

Object.keys(sessionStorage).forEach((key) => {
	if (key.includes('pingone') || key.includes('oauth') || key.includes('credential')) {
		sessionStorage.removeItem(key);
		console.log(`Removed session: ${key}`);
	}
});

console.log('✅ localStorage and sessionStorage cleared!');
console.log('🔄 Please refresh the page to test with clean storage.');
