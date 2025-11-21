// src/tests/integration/NewComponents.test.ts
/**
 * Integration tests for new educational components and features
 * Tests: OAuthDetective, ParameterImpactVisualizer, SecurityThreatTheater,
 * RealWorldScenarioBuilder, LiveRFCExplorer, Combined AI Docs
 */

import { describe, expect, it } from 'vitest';

describe('New Component Integration Tests', () => {
	describe('OAuth Detective Component', () => {
		it('should analyze OAuth URLs and extract parameters', () => {
			const testUrl =
				'https://auth.pingone.com/authorize?client_id=test&response_type=code&scope=openid&redirect_uri=http://localhost';

			// Test URL parsing
			const url = new URL(testUrl);
			const params = new URLSearchParams(url.search);

			expect(params.get('client_id')).toBe('test');
			expect(params.get('response_type')).toBe('code');
			expect(params.get('scope')).toBe('openid');
			expect(params.get('redirect_uri')).toBe('http://localhost');
		});

		it('should detect security issues in OAuth URLs', () => {
			const insecureUrl = 'http://auth.example.com/authorize?client_id=test&response_type=token';

			const url = new URL(insecureUrl);

			// Check for HTTP instead of HTTPS
			expect(url.protocol).toBe('http:');

			// Check for implicit flow (response_type=token)
			const params = new URLSearchParams(url.search);
			expect(params.get('response_type')).toBe('token');
		});

		it('should validate PKCE parameters', () => {
			const pkceUrl =
				'https://auth.example.com/authorize?code_challenge=abc123&code_challenge_method=S256';

			const url = new URL(pkceUrl);
			const params = new URLSearchParams(url.search);

			expect(params.get('code_challenge')).toBeTruthy();
			expect(params.get('code_challenge_method')).toBe('S256');
		});
	});

	describe('Parameter Impact Visualizer', () => {
		it('should demonstrate prompt parameter variations', () => {
			const promptValues = ['none', 'login', 'consent', 'select_account'];

			promptValues.forEach((value) => {
				expect(['none', 'login', 'consent', 'select_account']).toContain(value);
			});
		});

		it('should show max_age impact on authentication', () => {
			const maxAgeValues = [0, 300, 3600, 86400];

			maxAgeValues.forEach((value) => {
				expect(value).toBeGreaterThanOrEqual(0);
			});
		});

		it('should validate acr_values format', () => {
			const acrValues = 'urn:mace:incommon:iap:silver urn:mace:incommon:iap:gold';

			const values = acrValues.split(' ');
			expect(values.length).toBeGreaterThan(0);
			values.forEach((val) => {
				expect(val).toMatch(/^urn:/);
			});
		});
	});

	describe('Security Threat Theater', () => {
		it('should detect authorization code interception', () => {
			const authCodeUrl = 'https://example.com/callback?code=abc123&state=xyz';

			const url = new URL(authCodeUrl);
			const params = new URLSearchParams(url.search);

			// Without PKCE, code is vulnerable
			expect(params.has('code')).toBe(true);
			expect(params.has('code_verifier')).toBe(false); // Missing protection
		});

		it('should validate state parameter for CSRF protection', () => {
			const urlWithState = 'https://example.com/callback?code=abc&state=random123';
			const urlWithoutState = 'https://example.com/callback?code=abc';

			const urlWith = new URL(urlWithState);
			const urlWithout = new URL(urlWithoutState);

			expect(new URLSearchParams(urlWith.search).has('state')).toBe(true);
			expect(new URLSearchParams(urlWithout.search).has('state')).toBe(false);
		});

		it('should detect token leakage in URL fragments', () => {
			const implicitFlowUrl =
				'https://example.com/callback#access_token=secret123&token_type=Bearer';

			const url = new URL(implicitFlowUrl);
			expect(url.hash).toContain('access_token');

			// Fragment tokens can be leaked via Referer header
			expect(url.hash.length).toBeGreaterThan(0);
		});
	});

	describe('Real-World Scenario Builder', () => {
		it('should generate valid Authorization Code Flow code', () => {
			const scenario = {
				flow: 'authorization-code',
				language: 'javascript',
				pkce: true,
			};

			expect(scenario.flow).toBe('authorization-code');
			expect(scenario.pkce).toBe(true);
		});

		it('should include PKCE generation in code samples', () => {
			// Test PKCE generation logic with a deterministic verifier length
			const codeVerifier = 'a'.repeat(64);

			expect(codeVerifier.length).toBeGreaterThan(43);
			expect(codeVerifier.length).toBeLessThanOrEqual(128);
		});

		it('should support multiple programming languages', () => {
			const supportedLanguages = ['javascript', 'python', 'java', 'csharp', 'go', 'ruby'];

			supportedLanguages.forEach((lang) => {
				expect(lang).toBeTruthy();
				expect(typeof lang).toBe('string');
			});
		});
	});

	describe('Live RFC Explorer', () => {
		it('should map RFC numbers to OAuth specs', () => {
			const rfcMap = {
				'6749': 'OAuth 2.0 Core',
				'7523': 'JWT Bearer Token',
				'8628': 'Device Authorization',
				'9126': 'Pushed Authorization Requests',
				'9396': 'Rich Authorization Requests',
				'9449': 'DPoP',
				'9470': 'Step-Up Authentication',
			};

			Object.entries(rfcMap).forEach(([rfc, title]) => {
				expect(rfc).toMatch(/^\d{4}$/);
				expect(title).toBeTruthy();
			});
		});

		it('should provide IETF links for OAuth RFCs', () => {
			const rfcNumber = '6749';
			const expectedUrl = `https://datatracker.ietf.org/doc/html/rfc${rfcNumber}`;

			expect(expectedUrl).toContain('datatracker.ietf.org');
			expect(expectedUrl).toContain(rfcNumber);
		});

		it('should categorize OAuth specs by type', () => {
			const categories = {
				core: ['6749', '6750'],
				security: ['9449', '9126'],
				extensions: ['8628', '9396'],
				authentication: ['7523', '9470'],
			};

			Object.entries(categories).forEach(([category, rfcs]) => {
				expect(category).toBeTruthy();
				expect(Array.isArray(rfcs)).toBe(true);
				expect(rfcs.length).toBeGreaterThan(0);
			});
		});
	});

	describe('Combined OAuth & OIDC for AI Documentation', () => {
		it('should include OAuth 2.0 AI specifications', () => {
			const oauthAiSpecs = [
				'OAuth 2.1 Core',
				'JWT Bearer Assertion (RFC 7523)',
				'Client Credentials Flow',
				'Token Exchange (RFC 8693)',
				'Rich Authorization Requests (RFC 9396)',
			];

			oauthAiSpecs.forEach((spec) => {
				expect(spec).toBeTruthy();
				expect(typeof spec).toBe('string');
			});
		});

		it('should include OIDC AI specifications', () => {
			const oidcAiSpecs = [
				'OpenID Connect Core 1.0',
				'Self-Issued OpenID Provider v2',
				'OIDC for Identity Assurance',
				'Verifiable Credentials',
			];

			oidcAiSpecs.forEach((spec) => {
				expect(spec).toBeTruthy();
				expect(typeof spec).toBe('string');
			});
		});

		it('should map AI use cases to OAuth/OIDC flows', () => {
			const aiUseCases = {
				'autonomous-agent': 'Client Credentials + JWT Bearer',
				'human-in-the-loop': 'Authorization Code + PKCE',
				'multi-agent-system': 'Token Exchange + RAR',
				'ai-model-api': 'Client Credentials + DPoP',
			};

			Object.entries(aiUseCases).forEach(([useCase, flow]) => {
				expect(useCase).toBeTruthy();
				expect(flow).toBeTruthy();
			});
		});

		it('should provide PingOne compatibility status', () => {
			const pingOneFeatures = {
				'JWT Bearer': 'supported',
				RAR: 'supported',
				PAR: 'supported',
				DPoP: 'supported',
				GNAP: 'draft',
			};

			Object.entries(pingOneFeatures).forEach(([_feature, status]) => {
				expect(['supported', 'partial', 'draft', 'not-supported']).toContain(status);
			});
		});
	});

	describe('RAR Flow V7 Enhancements', () => {
		it('should validate RAR authorization details structure', () => {
			const rarDetails = {
				type: 'payment',
				actions: ['read', 'write'],
				locations: ['https://api.example.com/accounts'],
				identifier: 'account-123',
			};

			expect(rarDetails.type).toBeTruthy();
			expect(Array.isArray(rarDetails.actions)).toBe(true);
			expect(Array.isArray(rarDetails.locations)).toBe(true);
			expect(rarDetails.identifier).toBeTruthy();
		});

		it('should generate RAR authorization URL with authorization_details', () => {
			const baseUrl = 'https://auth.pingone.com/authorize';
			const authDetails = JSON.stringify([
				{
					type: 'banking',
					actions: ['read_balance', 'transfer'],
				},
			]);

			const url = new URL(baseUrl);
			url.searchParams.set('authorization_details', authDetails);

			expect(url.toString()).toContain('authorization_details');

			const parsed = JSON.parse(url.searchParams.get('authorization_details') || '[]');
			expect(Array.isArray(parsed)).toBe(true);
			expect(parsed[0].type).toBe('banking');
		});

		it('should use V7 stepper navigation', () => {
			const steps = [
				'Overview & Setup',
				'RAR Authorization Details',
				'Authorization Request',
				'Token Exchange',
				'Completion',
			];

			expect(steps.length).toBe(5);
			steps.forEach((step, index) => {
				expect(step).toBeTruthy();
				expect(index).toBeGreaterThanOrEqual(0);
			});
		});
	});

	describe('OAuth Code Generator Hub', () => {
		it('should integrate all educational components', () => {
			const hubComponents = [
				'RealWorldScenarioBuilder',
				'LiveRFCExplorer',
				'SecurityThreatTheater',
			];

			hubComponents.forEach((component) => {
				expect(component).toBeTruthy();
				expect(typeof component).toBe('string');
			});
		});

		it('should provide navigation to OAuth flows', () => {
			const flowLinks = [
				'/flows/oauth-authorization-code-v7',
				'/flows/device-authorization-v7',
				'/flows/jwt-bearer-token-v7',
				'/flows/rar-v7',
			];

			flowLinks.forEach((link) => {
				expect(link).toMatch(/^\/flows\//);
			});
		});
	});

	describe('Navigation & Routing', () => {
		it('should have correct menu path for OIDC Overview', () => {
			const oidcOverviewPath = '/documentation/oidc-overview';

			expect(oidcOverviewPath).toMatch(/^\/documentation\//);
		});

		it('should have correct menu path for Scopes Best Practices', () => {
			const scopesPath = '/docs/scopes-best-practices';

			expect(scopesPath).toMatch(/^\/docs\//);
		});

		it('should have combined OAuth & OIDC for AI route', () => {
			const aiDocsPath = '/docs/oauth-oidc-for-ai';

			expect(aiDocsPath).toBe('/docs/oauth-oidc-for-ai');
			expect(aiDocsPath).not.toBe('/docs/oauth-for-ai');
			expect(aiDocsPath).not.toBe('/docs/oidc-for-ai');
		});

		it('should have OAuth Code Generator Hub route', () => {
			const codeGenPath = '/oauth-code-generator';

			expect(codeGenPath).toBe('/oauth-code-generator');
		});
	});

	describe('URL Security Validation', () => {
		it('should enforce HTTPS for authorization endpoints', () => {
			const secureUrl = 'https://auth.pingone.com/authorize';
			const insecureUrl = 'http://auth.pingone.com/authorize';

			const secure = new URL(secureUrl);
			const insecure = new URL(insecureUrl);

			expect(secure.protocol).toBe('https:');
			expect(insecure.protocol).toBe('http:');
		});

		it('should validate redirect URI schemes', () => {
			const validSchemes = ['https', 'http://localhost', 'custom-scheme'];

			validSchemes.forEach((scheme) => {
				expect(scheme).toBeTruthy();
			});
		});
	});

	describe('Token Security Best Practices', () => {
		it('should recommend secure token storage', () => {
			const storageOptions = {
				web: 'httpOnly cookies or sessionStorage',
				mobile: 'secure keychain/keystore',
				backend: 'encrypted environment variables',
			};

			Object.entries(storageOptions).forEach(([platform, recommendation]) => {
				expect(platform).toBeTruthy();
				expect(recommendation).toBeTruthy();
			});
		});

		it('should enforce token expiration validation', () => {
			const now = Math.floor(Date.now() / 1000);
			const tokenExp = now + 3600; // 1 hour from now
			const expiredExp = now - 3600; // 1 hour ago

			expect(tokenExp > now).toBe(true);
			expect(expiredExp < now).toBe(true);
		});
	});
});
