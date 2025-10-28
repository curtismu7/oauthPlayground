export const sampleHybridTokens = {
	code: 'AUTH_CODE_SAMPLE',
	id_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.sample-id-token',
	access_token: 'sample-access-token',
	token_type: 'Bearer',
	expires_in: 600,
	scope: 'openid profile email',
	state: 'fixture-state-value',
};

export type SampleHybridTokens = typeof sampleHybridTokens;
