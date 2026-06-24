// src/flows2/services/samlBearerService.ts
//
// SAML Bearer Assertion grant (RFC 7522) as an OAuthFlowService.
// real mode → POST the BFF /api/pingone/token with SAML assertion (would call real PingOne).
// mock mode → generate a mock SAML assertion, simulate token response (no network).

import type { FlowMode, TokenResult } from '../framework/types';
import { pingoneHost } from './pingone';
import { tokenIntrospectionService } from './tokenIntrospectionService';

export interface SAMLBearerAssertionData {
	issuer: string;
	subject: string;
	audience: string;
	notBefore?: string;
	notOnOrAfter?: string;
}

export interface SAMLBearerParams {
	environmentId: string;
	region: string;
	clientId: string;
	assertion: SAMLBearerAssertionData;
	scopes?: string;
}

/** Generate a mock SAML 2.0 assertion in XML form (educational, not cryptographically signed). */
function generateMockSAMLAssertion(data: SAMLBearerAssertionData): string {
	const assertionId = `_${Math.random().toString(36).substring(2, 11)}`;
	const now = new Date().toISOString();
	const notBefore = data.notBefore || now;
	const notOnOrAfter = data.notOnOrAfter || new Date(Date.now() + 3600000).toISOString();

	return `<?xml version="1.0" encoding="UTF-8"?>
<saml:Assertion xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                xmlns:xs="http://www.w3.org/2001/XMLSchema"
                ID="${assertionId}"
                IssueInstant="${now}"
                Version="2.0">
  <saml:Issuer>${data.issuer}</saml:Issuer>
  <saml:Subject>
    <saml:NameID Format="urn:oasis:names:tc:SAML:2.0:nameid-format:entity">${data.subject}</saml:NameID>
    <saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
      <saml:SubjectConfirmationData NotOnOrAfter="${notOnOrAfter}"/>
    </saml:SubjectConfirmation>
  </saml:Subject>
  <saml:Conditions NotBefore="${notBefore}" NotOnOrAfter="${notOnOrAfter}">
    <saml:AudienceRestriction>
      <saml:Audience>${data.audience}</saml:Audience>
    </saml:AudienceRestriction>
  </saml:Conditions>
  <saml:AttributeStatement>
    <saml:Attribute Name="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name">
      <saml:AttributeValue>${data.subject}</saml:AttributeValue>
    </saml:Attribute>
  </saml:AttributeStatement>
</saml:Assertion>`;
}

function toTokenResult(data: Record<string, unknown>): TokenResult {
	return {
		accessToken: typeof data.access_token === 'string' ? data.access_token : undefined,
		tokenType: typeof data.token_type === 'string' ? data.token_type : undefined,
		expiresIn: typeof data.expires_in === 'number' ? data.expires_in : undefined,
		scope: typeof data.scope === 'string' ? data.scope : undefined,
		raw: data,
	};
}

async function introspect(
	accessToken: string,
	environmentId: string,
	region: string,
	mode: FlowMode
): Promise<Record<string, unknown>> {
	return tokenIntrospectionService
		.run(
			{
				credentials: {
					environmentId,
					region,
					clientId: '',
					scope: '',
				},
				token: accessToken,
			},
			mode
		)
		.catch((e) => e as Record<string, unknown>);
}

export const samlBearerService = {
	generateAssertion: generateMockSAMLAssertion,
	introspect,

	async run(params: SAMLBearerParams, mode: FlowMode): Promise<TokenResult> {
		if (mode === 'mock') {
			// Generate assertion in mock mode (discarded but validates input)
			const _mockAssertion = generateMockSAMLAssertion(params.assertion);
			await new Promise((resolve) => setTimeout(resolve, 500));

			const now = Math.floor(Date.now() / 1000);
			const fakeClaims = {
				sub: params.assertion.subject,
				aud: params.assertion.audience,
				scope: params.scopes || 'mock:read',
				iat: now,
				exp: now + 3600,
				iss: params.assertion.issuer,
				token_use: 'Bearer',
			};
			const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
			const payload = btoa(JSON.stringify(fakeClaims));
			const data = {
				access_token: `${header}.${payload}.`,
				token_type: 'Bearer',
				expires_in: 3600,
				scope: fakeClaims.scope,
				_mock: true,
			};
			return toTokenResult(data);
		}

		const assertion = generateMockSAMLAssertion(params.assertion);
		const assertionB64 = btoa(assertion);

		const res = await fetch('/api/pingone/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				environment_id: params.environmentId,
				region: params.region,
				grant_type: 'urn:ietf:params:oauth:grant-type:saml2-bearer',
				assertion: assertionB64,
				...(params.scopes ? { scope: params.scopes } : {}),
			}),
		});

		const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
		if (!res.ok || data.error) {
			throw {
				error: (data.error as string) || 'saml_bearer_token_request_failed',
				error_description:
					(data.error_description as string) || `SAML Bearer token request failed (HTTP ${res.status})`,
				status: res.status,
			};
		}
		return toTokenResult(data);
	},
};
