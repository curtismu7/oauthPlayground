import { describe, expect, it } from 'vitest';
import { aiAgentService } from '../aiAgentService';

describe('AIAgentService', () => {
	describe('search', () => {
		it('should find Authorization Code flow', () => {
			const results = aiAgentService.search('authorization code');
			expect(results.length).toBeGreaterThan(0);
			expect(results[0].title).toContain('Authorization Code');
		});

		it('should find device flows', () => {
			const results = aiAgentService.search('device tv iot');
			expect(results.length).toBeGreaterThan(0);
			expect(results[0].type).toBe('flow');
		});

		it('should find security features', () => {
			const results = aiAgentService.search('security best practices');
			expect(results.length).toBeGreaterThan(0);
			const securityResult = results.find((r) => r.title.includes('Security'));
			expect(securityResult).toBeDefined();
		});

		it('should return empty array for no matches', () => {
			const results = aiAgentService.search('xyzabc123nonexistent');
			expect(results).toEqual([]);
		});

		it('should rank exact matches higher', () => {
			const results = aiAgentService.search('token management');
			expect(results[0].title).toContain('Token Management');
		});
	});

	describe('getAnswer', () => {
		it('should answer authorization code configuration question', () => {
			const { answer, relatedLinks } = aiAgentService.getAnswer(
				'How do I configure authorization code flow?'
			);
			expect(answer).toContain('Authorization Code');
			expect(answer).toContain('PingOne');
			expect(relatedLinks.length).toBeGreaterThan(0);
		});

		it('should explain OAuth vs OIDC', () => {
			const { answer } = aiAgentService.getAnswer("What's the difference between OAuth and OIDC?");
			expect(answer).toContain('OAuth');
			expect(answer).toContain('OIDC');
			expect(answer).toContain('authorization');
			expect(answer).toContain('authentication');
		});

		it('should provide device flow guidance', () => {
			const { answer } = aiAgentService.getAnswer('How can I test device flows?');
			expect(answer).toContain('Device');
			expect(answer).toContain('code');
		});

		it('should explain PKCE', () => {
			const { answer } = aiAgentService.getAnswer('What is PKCE?');
			expect(answer).toContain('PKCE');
			expect(answer).toContain('security');
		});

		it('should provide token inspection help', () => {
			const { answer } = aiAgentService.getAnswer('How do I decode a token?');
			expect(answer).toContain('Token Management');
			expect(answer).toContain('JWT');
		});

		it('should recommend flows', () => {
			const { answer } = aiAgentService.getAnswer('Which flow should I use?');
			expect(answer).toContain('flow');
			expect(answer.toLowerCase()).toContain('authorization code');
		});

		it('should help with redirect URI errors', () => {
			const { answer } = aiAgentService.getAnswer('redirect uri mismatch error');
			expect(answer).toContain('redirect');
			expect(answer).toContain('URI');
		});

		it('should provide code generation help', () => {
			const { answer } = aiAgentService.getAnswer('How do I generate code examples?');
			expect(answer).toContain('code');
			expect(answer).toContain('examples');
		});

		it('should provide fallback for unknown questions', () => {
			const { answer } = aiAgentService.getAnswer('xyzabc123nonexistent random gibberish');
			expect(answer).toContain("couldn't find");
		});
	});

	describe('relevance scoring', () => {
		it('should prioritize exact title matches', () => {
			const results = aiAgentService.search('Client Credentials Flow');
			expect(results[0].title).toBe('Client Credentials Flow');
			expect(results[0].relevance).toBeGreaterThan(100);
		});

		it('should score keyword matches', () => {
			const results = aiAgentService.search('m2m machine');
			const clientCredsResult = results.find((r) => r.title.includes('Client Credentials'));
			expect(clientCredsResult).toBeDefined();
			expect(clientCredsResult!.relevance).toBeGreaterThan(0);
		});
	});

	describe('API docs search', () => {
		it('should not include API docs by default', () => {
			const results = aiAgentService.search('pingone api users');
			const apiResults = results.filter((r) => r.type === 'api');
			expect(apiResults.length).toBe(0);
		});

		it('should include API docs when enabled', () => {
			const results = aiAgentService.search('pingone api users', { includeApiDocs: true });
			const apiResults = results.filter((r) => r.type === 'api');
			expect(apiResults.length).toBeGreaterThan(0);
		});

		it('should mark API docs as external', () => {
			const results = aiAgentService.search('pingone api', { includeApiDocs: true });
			const apiResults = results.filter((r) => r.type === 'api');
			expect(apiResults.length).toBeGreaterThan(0);
			expect(apiResults[0].external).toBe(true);
		});

		it('should find PingOne Users API', () => {
			const results = aiAgentService.search('users api management', { includeApiDocs: true });
			const usersApi = results.find((r) => r.title.includes('Users API'));
			expect(usersApi).toBeDefined();
			expect(usersApi?.external).toBe(true);
		});

		it('should find PingOne MFA API', () => {
			const results = aiAgentService.search('mfa api totp', { includeApiDocs: true });
			const mfaApi = results.find((r) => r.title.includes('MFA API'));
			expect(mfaApi).toBeDefined();
		});

		it('should respect includeApiDocs in getAnswer', () => {
			const { relatedLinks } = aiAgentService.getAnswer('pingone api', { includeApiDocs: true });
			const apiLinks = relatedLinks.filter((r) => r.type === 'api');
			expect(apiLinks.length).toBeGreaterThan(0);
		});
	});
});

describe('Specifications search', () => {
	it('should not include specs by default', () => {
		const results = aiAgentService.search('oauth rfc 6749');
		const specResults = results.filter((r) => r.type === 'spec');
		expect(specResults.length).toBe(0);
	});

	it('should include specs when enabled', () => {
		const results = aiAgentService.search('oauth rfc', { includeSpecs: true });
		const specResults = results.filter((r) => r.type === 'spec');
		expect(specResults.length).toBeGreaterThan(0);
	});

	it('should find OAuth 2.0 RFC 6749', () => {
		const results = aiAgentService.search('oauth 2.0 rfc 6749', { includeSpecs: true });
		const oauthSpec = results.find((r) => r.title.includes('RFC 6749'));
		expect(oauthSpec).toBeDefined();
		expect(oauthSpec?.external).toBe(true);
	});

	it('should find PKCE RFC 7636', () => {
		const results = aiAgentService.search('pkce rfc', { includeSpecs: true });
		const pkceSpec = results.find((r) => r.title.includes('PKCE'));
		expect(pkceSpec).toBeDefined();
	});

	it('should find OpenID Connect Core spec', () => {
		const results = aiAgentService.search('openid connect core', { includeSpecs: true });
		const oidcSpec = results.find((r) => r.title.includes('OpenID Connect Core'));
		expect(oidcSpec).toBeDefined();
	});
});

describe('Workflows search', () => {
	it('should not include workflows by default', () => {
		const results = aiAgentService.search('mfa workflow');
		const workflowResults = results.filter((r) => r.type === 'workflow');
		expect(workflowResults.length).toBe(0);
	});

	it('should include workflows when enabled', () => {
		const results = aiAgentService.search('mfa workflow', { includeWorkflows: true });
		const workflowResults = results.filter((r) => r.type === 'workflow');
		expect(workflowResults.length).toBeGreaterThan(0);
	});

	it('should find MFA Sign-On Policy Workflow', () => {
		const results = aiAgentService.search('mfa sign-on policy', { includeWorkflows: true });
		const mfaWorkflow = results.find((r) => r.title.includes('MFA Sign-On Policy'));
		expect(mfaWorkflow).toBeDefined();
		expect(mfaWorkflow?.external).toBe(true);
	});

	it('should find Password Reset Workflow', () => {
		const results = aiAgentService.search('password reset workflow', { includeWorkflows: true });
		const passwordWorkflow = results.find((r) => r.title.includes('Password Reset Workflow'));
		expect(passwordWorkflow).toBeDefined();
	});

	it('should find User Registration Workflow', () => {
		const results = aiAgentService.search('user registration', { includeWorkflows: true });
		const regWorkflow = results.find((r) => r.title.includes('User Registration'));
		expect(regWorkflow).toBeDefined();
	});
});

describe('Combined options', () => {
	it('should support multiple options together', () => {
		const results = aiAgentService.search('oauth', {
			includeApiDocs: true,
			includeSpecs: true,
			includeWorkflows: true,
		});
		const hasApi = results.some((r) => r.type === 'api');
		const hasSpec = results.some((r) => r.type === 'spec');
		const hasWorkflow = results.some((r) => r.type === 'workflow');

		expect(hasApi || hasSpec || hasWorkflow).toBe(true);
	});

	it('should respect all options in getAnswer', () => {
		const { relatedLinks } = aiAgentService.getAnswer('oauth mfa', {
			includeApiDocs: true,
			includeSpecs: true,
			includeWorkflows: true,
		});

		expect(relatedLinks.length).toBeGreaterThan(0);
	});
});

describe('User Guide search', () => {
	it('should not include user guide by default', () => {
		const results = aiAgentService.search('how to use playground');
		const guideResults = results.filter((r) => r.type === 'guide');
		expect(guideResults.length).toBe(0);
	});

	it('should include user guide when enabled', () => {
		const results = aiAgentService.search('user guide', { includeUserGuide: true });
		const guideResults = results.filter((r) => r.type === 'guide');
		expect(guideResults.length).toBeGreaterThan(0);
	});

	it('should find Playground User Guide', () => {
		const results = aiAgentService.search('playground guide', { includeUserGuide: true });
		const playgroundGuide = results.find((r) => r.title.includes('Playground User Guide'));
		expect(playgroundGuide).toBeDefined();
		expect(playgroundGuide?.external).toBe(false);
	});

	it('should find OAuth Flows Guide', () => {
		const results = aiAgentService.search('oauth flows guide', { includeUserGuide: true });
		const flowsGuide = results.find((r) => r.title.includes('OAuth Flows Guide'));
		expect(flowsGuide).toBeDefined();
	});

	it('should find Developer Tools Guide', () => {
		const results = aiAgentService.search('developer tools', { includeUserGuide: true });
		const devGuide = results.find((r) => r.title.includes('Developer Tools Guide'));
		expect(devGuide).toBeDefined();
	});

	it('should find PingOne API Best Practices', () => {
		const results = aiAgentService.search('pingone api best practices', { includeUserGuide: true });
		const apiGuide = results.find((r) => r.title.includes('PingOne API Best Practices'));
		expect(apiGuide).toBeDefined();
	});

	it('should find Password Operations Guide', () => {
		const results = aiAgentService.search('password operations', { includeUserGuide: true });
		const passwordGuide = results.find((r) => r.title.includes('Password Operations'));
		expect(passwordGuide).toBeDefined();
	});
});

describe('All options combined', () => {
	it('should support all four options together', () => {
		const results = aiAgentService.search('oauth', {
			includeApiDocs: true,
			includeSpecs: true,
			includeWorkflows: true,
			includeUserGuide: true,
		});

		expect(results.length).toBeGreaterThan(0);
	});

	it('should respect all options in getAnswer', () => {
		const { relatedLinks } = aiAgentService.getAnswer('how to use oauth', {
			includeApiDocs: true,
			includeSpecs: true,
			includeWorkflows: true,
			includeUserGuide: true,
		});

		expect(relatedLinks.length).toBeGreaterThan(0);
	});
});
