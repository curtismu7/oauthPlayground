/**
 * @file postmanScripts.ts
 * @description Pre-request and test script generators for Postman collections
 * @version 9.0.0
 */

/**
 * Generate Postman pre-request script to randomly select a baseball player
 */
export const generateRandomBaseballPlayerScript = (prefix: string = 'SignUp'): string[] => {
	return [
		'// Randomly select a historical baseball player for user data',
		'const players = [',
		'	{ name: "Babe Ruth", email: "baberuth@baseball.com" },',
		'	{ name: "Lou Gehrig", email: "lougehrig@baseball.com" },',
		'	{ name: "Ty Cobb", email: "tycobb@baseball.com" },',
		'	{ name: "Walter Johnson", email: "walterjohnson@baseball.com" },',
		'	{ name: "Honus Wagner", email: "honuswagner@baseball.com" },',
		'];',
		'',
		'const randomPlayer = players[Math.floor(Math.random() * players.length)];',
		`pm.variables.set("${prefix}Name", randomPlayer.name);`,
		`pm.variables.set("${prefix}Email", randomPlayer.email);`,
		`console.log("Selected player:", randomPlayer.name);`,
	];
};

/**
 * Generate Postman pre-request script to set password with default "2Federate!"
 */
export const generatePasswordScript = (): string[] => {
	return [
		'// Generate password: default "2Federate!" with random suffix',
		'const basePassword = "2Federate!";',
		'const randomSuffix = Math.floor(Math.random() * 10000);',
		'const password = basePassword + randomSuffix;',
		'pm.variables.set("password", password);',
		'console.log("Generated password with suffix:", randomSuffix);',
	];
};

/**
 * Generate token extraction script based on spec version
 */
export const generateTokenExtractionScript = (
	specVersion: 'oauth2.0' | 'oidc' | 'oidc2.1'
): string[] => {
	const baseScript = [
		'// ============================================',
		'// Token Extraction Script',
		'// ============================================',
		'var jsonData = pm.response.json();',
		'',
		'// Extract access_token',
		'if (jsonData.access_token) {',
		'    pm.environment.set("access_token", jsonData.access_token);',
		'    console.log("✓ access_token extracted");',
		'}',
	];

	if (specVersion === 'oauth2.0') {
		return [
			...baseScript,
			'',
			'// OAuth 2.0: Extract refresh_token only',
			'if (jsonData.refresh_token) {',
			'    pm.environment.set("refresh_token", jsonData.refresh_token);',
			'    console.log("✓ refresh_token extracted");',
			'}',
		];
	}

	return [
		...baseScript,
		'',
		'// OIDC: Extract id_token',
		'if (jsonData.id_token) {',
		'    pm.environment.set("id_token", jsonData.id_token);',
		'    console.log("✓ id_token extracted");',
		'}',
		'',
		'// Extract refresh_token',
		'if (jsonData.refresh_token) {',
		'    pm.environment.set("refresh_token", jsonData.refresh_token);',
		'    console.log("✓ refresh_token extracted");',
		'}',
	];
};

/**
 * Get default scopes based on spec version
 */
export const getDefaultScopes = (specVersion: 'oauth2.0' | 'oidc' | 'oidc2.1'): string => {
	if (specVersion === 'oauth2.0') {
		return 'profile email';
	}
	if (specVersion === 'oidc') {
		return 'openid profile email';
	}
	return 'openid profile email offline_access';
};
