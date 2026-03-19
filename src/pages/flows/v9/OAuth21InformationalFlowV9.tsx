// src/pages/flows/v9/OAuth21InformationalFlowV9.tsx

import React from 'react';
import styled from 'styled-components';
import { Card, CardBody } from '../../../components/Card';
import { SpecCard } from '../../../components/SpecCard';
import { showGlobalSuccess } from '../../../contexts/NotificationSystem';
import { FiCheck, FiInfo, FiShield, FiX } from '../../../icons';
import { V9_COLORS } from '../../../services/v9/V9ColorStandards';
import V9FlowHeader from '../../../services/v9/v9FlowHeaderService';

// ─── Styled Components (V9 Color Standards) ───────────────────────────────────

const Container = styled.div`
	max-width: 90rem;
	margin: 0 auto;
	padding: 1.5rem;
`;

const ChangesGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
	gap: 1.5rem;
	margin-top: 2rem;
`;

const CodeBlock = styled.pre`
	background-color: ${V9_COLORS.BG.GRAY_LIGHT};
	border: 1px solid ${V9_COLORS.BORDER.GRAY};
	border-radius: 0.375rem;
	padding: 1rem;
	font-size: 0.875rem;
	line-height: 1.5;
	overflow-x: auto;
	margin: 1rem 0;
`;

const PingOneNote = styled.div`
	background-color: ${V9_COLORS.BG.INFO_LIGHT};
	border: 1px solid ${V9_COLORS.BORDER.INFO};
	border-radius: 0.5rem;
	padding: 1rem;
	margin: 1rem 0;
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;

	svg {
		color: ${V9_COLORS.TEXT.INFO};
		flex-shrink: 0;
		margin-top: 0.1rem;
	}

	h4 {
		color: ${V9_COLORS.TEXT.INFO};
		margin: 0 0 0.5rem 0;
		font-size: 1rem;
		font-weight: 600;
	}

	p {
		margin: 0;
		color: ${V9_COLORS.TEXT.INFO};
		font-size: 0.9rem;
	}
`;

const InfoBox = styled.div`
	background: ${V9_COLORS.BG.INFO_LIGHT};
	border: 1px solid ${V9_COLORS.BORDER.INFO};
	border-radius: 0.5rem;
	padding: 1rem;
	margin: 1rem 0;
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;

	svg {
		color: ${V9_COLORS.TEXT.INFO};
		flex-shrink: 0;
		margin-top: 0.1rem;
	}

	h4 {
		color: ${V9_COLORS.TEXT.INFO};
		margin: 0 0 0.5rem 0;
		font-size: 1rem;
		font-weight: 600;
	}

	p {
		margin: 0;
		color: ${V9_COLORS.TEXT.INFO};
		font-size: 0.9rem;
	}
`;

// ─── Component ─────────────────────────────────────────────────────────────

const OAuth21InformationalFlowV9: React.FC = () => {
	const handleCopySpecLink = async (url: string, title: string) => {
		try {
			await navigator.clipboard.writeText(url);
			showGlobalSuccess(`Copied ${title} link to clipboard`);
		} catch {
			// Fallback for browsers that don't support clipboard API
			const textArea = document.createElement('textarea');
			textArea.value = url;
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand('copy');
			document.body.removeChild(textArea);
			showGlobalSuccess(`Copied ${title} link to clipboard`);
		}
	};

	return (
		<Container>
			<V9FlowHeader
				flowId="oauth-2-1"
				customConfig={{
					flowType: 'oauth',
					title: 'OAuth 2.1',
					subtitle: 'Evolution of OAuth 2.0 with built-in security improvements and best practices',
				}}
			/>

			{/* Overview Section */}
			<Card>
				<CardBody>
					<h3>What is OAuth 2.1?</h3>
					<p>
						OAuth 2.1 consolidates the changes published in later specifications to simplify the
						core document. It represents the evolution of OAuth 2.0 with security improvements and
						best practices built-in.
					</p>
					<p>
						<strong>Status:</strong> Currently in draft (draft-ietf-oauth-v2-1-13) —{' '}
						<button
							type="button"
							onClick={() =>
								handleCopySpecLink('https://oauth.net/2.1/', 'OAuth 2.1 Specification')
							}
							style={{
								background: 'none',
								border: 'none',
								color: V9_COLORS.PRIMARY.BLUE,
								textDecoration: 'underline',
								cursor: 'pointer',
								fontSize: 'inherit',
							}}
						>
							View on oauth.net
						</button>
						{' · '}
						<button
							type="button"
							onClick={() => handleCopySpecLink('https://oauth.net/specs/', 'OAuth Specifications')}
							style={{
								background: 'none',
								border: 'none',
								color: V9_COLORS.PRIMARY.BLUE,
								textDecoration: 'underline',
								cursor: 'pointer',
								fontSize: 'inherit',
							}}
						>
							Browse all OAuth specs
						</button>
					</p>
				</CardBody>
			</Card>

			{/* Removed Features Section */}
			<Card>
				<CardBody>
					<h3>Flows and Features Removed from OAuth 2.1</h3>
					<p>Deprecated patterns that no longer appear in the consolidated specification</p>

					<ChangesGrid>
						<SpecCard title="Implicit Grant (response_type=token)">
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
									marginBottom: '1rem',
								}}
							>
								<FiX style={{ color: V9_COLORS.STATUS.WARNING, fontSize: '1.25rem' }} />
								<span style={{ fontWeight: 600, color: V9_COLORS.STATUS.WARNING }}>REMOVED</span>
							</div>
							<p>
								<code>response_type=token</code> no longer appears in OAuth 2.1. Browsers should use
								Authorization Code + PKCE, which prevents token leakage through URL fragments and
								enables sender-constrained access tokens.
							</p>
							<p style={{ fontSize: '0.9rem', color: V9_COLORS.TEXT.GRAY_DARK }}>
								Reference: draft-ietf-oauth-v2-1 §4 (Implicit grant omitted).
							</p>
						</SpecCard>

						<SpecCard title="Resource Owner Password Credentials (ROPC)">
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
									marginBottom: '1rem',
								}}
							>
								<FiX style={{ color: V9_COLORS.STATUS.WARNING, fontSize: '1.25rem' }} />
								<span style={{ fontWeight: 600, color: V9_COLORS.STATUS.WARNING }}>REMOVED</span>
							</div>
							<p>
								The password grant encouraged first-party apps to collect user credentials. OAuth
								2.1 removes it entirely. Modern replacements include Authorization Code + PKCE or
								token exchange patterns for highly trusted backends.
							</p>
							<p style={{ fontSize: '0.9rem', color: V9_COLORS.TEXT.GRAY_DARK }}>
								Reference: draft-ietf-oauth-v2-1 §4.3 (ROPC omitted).
							</p>
						</SpecCard>

						<SpecCard title="Redirects without HTTPS or Strict Validation">
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
									marginBottom: '1rem',
								}}
							>
								<FiShield style={{ color: V9_COLORS.PRIMARY.BLUE, fontSize: '1.25rem' }} />
								<span style={{ fontWeight: 600, color: V9_COLORS.PRIMARY.BLUE }}>ENFORCED</span>
							</div>
							<p>
								Native and browser-based apps must use <code>https</code> URIs (with loopback
								exceptions) and exact matching. Lenient schemes tolerated in early OAuth 2.0
								deployments are no longer acceptable.
							</p>
							<p style={{ fontSize: '0.9rem', color: V9_COLORS.TEXT.GRAY_DARK }}>
								Reference: draft-ietf-oauth-v2-1 §6.1 (redirect URI requirements).
							</p>
						</SpecCard>
					</ChangesGrid>

					<PingOneNote>
						<span>ℹ️</span>
						<div>
							<h4>PingOne guidance</h4>
							<p>
								Existing PingOne tenants should migrate any legacy implicit or password integrations
								to Authorization Code + PKCE. The platform already enforces strict redirect URI
								validation, so review client registrations for lingering insecure URLs.
							</p>
						</div>
					</PingOneNote>
				</CardBody>
			</Card>

			{/* Key Changes Section */}
			<Card>
				<CardBody>
					<h3>Key Changes from OAuth 2.0 to OAuth 2.1</h3>
					<p>Major security improvements and deprecations in OAuth 2.1</p>

					<ChangesGrid>
						{/* PKCE Requirement */}
						<SpecCard title="PKCE Required for Authorization Code Flow">
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
									marginBottom: '1rem',
								}}
							>
								<FiCheck style={{ color: V9_COLORS.STATUS.SUCCESS, fontSize: '1.25rem' }} />
								<span style={{ fontWeight: '600', color: V9_COLORS.STATUS.SUCCESS }}>REQUIRED</span>
							</div>
							<p>
								PKCE (Proof Key for Code Exchange) is now <strong>required</strong> for all OAuth
								clients using the authorization code flow, not just public clients.
							</p>
							<CodeBlock>{`// OAuth 2.1 REQUIRES PKCE for all clients
GET /authorize?
  response_type=code
  &client_id=your_client_id
  &code_challenge=YOUR_CODE_CHALLENGE
  &code_challenge_method=S256`}</CodeBlock>
							<InfoBox>
								<FiInfo
									style={{ color: V9_COLORS.TEXT.INFO, flexShrink: 0, marginTop: '0.1rem' }}
								/>
								<div>
									<h4>PingOne Support</h4>
									<p>PingOne fully supports PKCE and recommends its use for all OAuth flows.</p>
								</div>
							</InfoBox>
						</SpecCard>

						{/* Redirect URI Matching */}
						<SpecCard title="Exact String Matching for Redirect URIs">
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
									marginBottom: '1rem',
								}}
							>
								<FiCheck style={{ color: V9_COLORS.STATUS.SUCCESS, fontSize: '1.25rem' }} />
								<span style={{ fontWeight: '600', color: V9_COLORS.STATUS.SUCCESS }}>REQUIRED</span>
							</div>
							<p>
								Redirect URIs must be compared using exact string matching, eliminating the previous
								substring matching behavior that could lead to security vulnerabilities.
							</p>
							<CodeBlock>{`// OAuth 2.1: Exact string matching required
//  Correct - exact match
redirect_uri=https://app.example.com/callback

//  OAuth 2.0 allowed substring matching
// This is no longer permitted in OAuth 2.1`}</CodeBlock>
							<InfoBox>
								<FiInfo
									style={{ color: V9_COLORS.TEXT.INFO, flexShrink: 0, marginTop: '0.1rem' }}
								/>
								<div>
									<h4>PingOne Support</h4>
									<p>PingOne already enforces exact redirect URI matching for security.</p>
								</div>
							</InfoBox>
						</SpecCard>

						{/* Implicit Flow Deprecation */}
						<SpecCard title="Implicit Grant Deprecated">
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
									marginBottom: '1rem',
								}}
							>
								<FiX style={{ color: V9_COLORS.STATUS.WARNING, fontSize: '1.25rem' }} />
								<span style={{ fontWeight: 600, color: V9_COLORS.STATUS.WARNING }}>DEPRECATED</span>
							</div>
							<p>
								The Implicit grant (<code>response_type=token</code>) is omitted from OAuth 2.1
								specification due to security concerns. Use Authorization Code flow with PKCE
								instead.
							</p>
							<CodeBlock>{`//  OAuth 2.1: Implicit flow deprecated
// response_type=token is no longer supported

//  OAuth 2.1: Use Authorization Code + PKCE
response_type=code
&code_challenge=YOUR_CODE_CHALLENGE
&code_challenge_method=S256`}</CodeBlock>
							<InfoBox>
								<FiInfo
									style={{ color: V9_COLORS.TEXT.INFO, flexShrink: 0, marginTop: '0.1rem' }}
								/>
								<div>
									<h4>PingOne Support</h4>
									<p>
										PingOne still supports Implicit flow for backward compatibility but recommends
										using Authorization Code + PKCE.
									</p>
								</div>
							</InfoBox>
						</SpecCard>

						{/* Password Grant Deprecation */}
						<SpecCard title="Resource Owner Password Credentials Deprecated">
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
									marginBottom: '1rem',
								}}
							>
								<FiX style={{ color: V9_COLORS.STATUS.WARNING, fontSize: '1.25rem' }} />
								<span style={{ fontWeight: 600, color: V9_COLORS.STATUS.WARNING }}>DEPRECATED</span>
							</div>
							<p>
								The password grant is removed from OAuth 2.1. Modern applications should use
								Authorization Code + PKCE or other secure flows.
							</p>
							<CodeBlock>{`//  OAuth 2.1: Password grant removed
// grant_type=password is no longer supported

//  OAuth 2.1: Use Authorization Code + PKCE instead
GET /authorize?response_type=code&code_challenge=...`}</CodeBlock>
							<InfoBox>
								<FiInfo
									style={{ color: V9_COLORS.TEXT.INFO, flexShrink: 0, marginTop: '0.1rem' }}
								/>
								<div>
									<h4>PingOne Support</h4>
									<p>
										PingOne supports password grant for legacy applications but strongly recommends
										migrating to Authorization Code + PKCE.
									</p>
								</div>
							</InfoBox>
						</SpecCard>
					</ChangesGrid>
				</CardBody>
			</Card>

			{/* Migration Guidance */}
			<Card>
				<CardBody>
					<h3>Migration Guidance</h3>
					<p>Steps to migrate your OAuth 2.0 implementations to OAuth 2.1</p>

					<ChangesGrid>
						<SpecCard title="1. Adopt PKCE for All Clients">
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
									marginBottom: '1rem',
								}}
							>
								<FiCheck style={{ color: V9_COLORS.STATUS.SUCCESS, fontSize: '1.25rem' }} />
								<span style={{ fontWeight: '600', color: V9_COLORS.STATUS.SUCCESS }}>
									ACTION REQUIRED
								</span>
							</div>
							<p>
								Implement PKCE for all authorization code flows, including confidential clients.
								This is now mandatory in OAuth 2.1.
							</p>
							<CodeBlock>{`// Generate PKCE parameters
const codeVerifier = base64url(generateRandomBytes(32));
const codeChallenge = base64url(sha256(codeVerifier));

// Include in authorization request
GET /authorize?
  response_type=code
  &client_id=your_client_id
  &code_challenge=\${codeChallenge}
  &code_challenge_method=S256`}</CodeBlock>
						</SpecCard>

						<SpecCard title="2. Update Redirect URI Validation">
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
									marginBottom: '1rem',
								}}
							>
								<FiCheck style={{ color: V9_COLORS.STATUS.SUCCESS, fontSize: '1.25rem' }} />
								<span style={{ fontWeight: '600', color: V9_COLORS.STATUS.SUCCESS }}>
									ACTION REQUIRED
								</span>
							</div>
							<p>
								Ensure all redirect URIs use HTTPS and implement exact string matching. Update
								client registrations if needed.
							</p>
							<CodeBlock>{`// Valid OAuth 2.1 redirect URIs
https://app.example.com/callback
https://localhost:3000/callback  // Development only
http://127.0.0.1:3000/callback  // Development only

// Invalid - no HTTPS (production)
http://app.example.com/callback`}</CodeBlock>
						</SpecCard>

						<SpecCard title="3. Replace Deprecated Flows">
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
									marginBottom: '1rem',
								}}
							>
								<FiX style={{ color: V9_COLORS.STATUS.WARNING, fontSize: '1.25rem' }} />
								<span style={{ fontWeight: 600, color: V9_COLORS.STATUS.WARNING }}>
									REPLACE NEEDED
								</span>
							</div>
							<p>
								Migrate away from Implicit grant and Resource Owner Password Credentials flows to
								Authorization Code + PKCE.
							</p>
							<CodeBlock>{`// FROM: Implicit flow (deprecated)
GET /authorize?response_type=token&client_id=...

// TO: Authorization Code + PKCE
GET /authorize?response_type=code&client_id=...&code_challenge=...

// FROM: Password grant (deprecated)
POST /token grant_type=password&username=...&password=...

// TO: Authorization Code + PKCE
POST /token grant_type=authorization_code&code=...&code_verifier=...`}</CodeBlock>
						</SpecCard>
					</ChangesGrid>

					<PingOneNote>
						<span>ℹ️</span>
						<div>
							<h4>PingOne Migration Tools</h4>
							<p>
								PingOne provides migration guides and tools to help transition from legacy OAuth
								flows to OAuth 2.1 compliant implementations. Check the PingOne developer portal for
								detailed migration documentation.
							</p>
						</div>
					</PingOneNote>
				</CardBody>
			</Card>
		</Container>
	);
};

export default OAuth21InformationalFlowV9;
