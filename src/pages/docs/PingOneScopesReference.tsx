// src/pages/docs/PingOneScopesReference.tsx
// Educational reference for PingOne OAuth and OIDC scopes, including catalog, usage tips, and best practices

import React from 'react';
import styled from 'styled-components';
import { CollapsibleHeader } from '../../services/collapsibleHeaderService';
import {
	FiBook,
	FiCheckCircle,
	FiInfo,
	FiShield,
	FiTarget,
} from '../../services/commonImportsService';
import PageLayoutService from '../../services/pageLayoutService';

const pageConfig = PageLayoutService.getDefaultConfig('documentation');

const {
	PageContainer,
	ContentWrapper,
	MainCard,
	PageHeader,
	PageFooter,
	SectionContainer,
	ContentGrid,
	Spacing,
} = PageLayoutService.createPageLayout(pageConfig);

const HeroIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 48px;
	height: 48px;
	border-radius: 16px;
	background: rgba(59, 130, 246, 0.15);
	color: #2563eb;
	font-size: 24px;
	margin-right: 1rem;
`;

const HeroTitle = styled.h1`
	font-size: 2rem;
	margin: 0;
`;

const HeroSubtitle = styled.p`
	font-size: 1rem;
	color: #e0e7ff;
	margin: 0.5rem 0 0;
	line-height: 1.6;
`;

const Pill = styled.span<{ $variant?: 'default' | 'critical' }>`
	display: inline-flex;
	align-items: center;
	gap: 0.4rem;
	padding: 0.35rem 0.8rem;
	border-radius: 9999px;
	font-size: 0.8rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.04em;
	color: ${({ $variant }) => ($variant === 'critical' ? '#b91c1c' : '#1d4ed8')};
	background: ${({ $variant }) =>
		$variant === 'critical' ? 'rgba(248, 113, 113, 0.18)' : 'rgba(59, 130, 246, 0.15)'};
`;

const ScopeTable = styled.table`
	width: 100%;
	border-collapse: collapse;
	margin-top: 1.5rem;

	th,
	td {
		padding: 0.9rem 1rem;
		text-align: left;
		border-bottom: 1px solid #e2e8f0;
		vertical-align: top;
	}

	th {
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #475569;
		background: #f8fafc;
	}

	tr:hover td {
		background: #f1f5f9;
	}

	code {
		padding: 0.2rem 0.4rem;
		border-radius: 0.35rem;
		background: #0f172a;
		color: #e2e8f0;
		font-size: 0.75rem;
	}
`;

const Callout = styled.div<{ $variant?: 'info' | 'warning' | 'success' }>`
	padding: 1.25rem 1.5rem;
	border-radius: 0.75rem;
	margin: 1rem 0;
	background: ${({ $variant }) => {
		switch ($variant) {
			case 'warning':
				return 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)';
			case 'success':
				return 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)';
			default:
				return 'linear-gradient(135deg, #e0e7ff 0%, #bfdbfe 100%)';
		}
	}};
	border-left: 4px solid ${({ $variant }) => ($variant === 'warning' ? '#f59e0b' : '#2563eb')};
	color: #1e293b;
	display: flex;
	gap: 0.75rem;
	align-items: flex-start;
`;

const CalloutIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	border-radius: 9999px;
	background: rgba(15, 23, 42, 0.1);
`;

const BestPracticeList = styled.ul`
	margin: 0.75rem 0 0 1.25rem;
	padding: 0;

	li {
		margin-bottom: 0.5rem;
		line-height: 1.6;
	}
`;

const ScopeCategoryCard = styled.div`
	padding: 1.5rem;
	border-radius: 1rem;
	border: 1px solid #e2e8f0;
	background: #ffffff;
	box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);

	h3 {
		margin: 0 0 0.75rem 0;
		display: flex;
		align-items: center;
		gap: 0.6rem;
		font-size: 1.2rem;
		color: #1d4ed8;
	}

	p {
		color: #475569;
		margin: 0;
		line-height: 1.6;
	}

	ul {
		margin: 1rem 0 0 1.25rem;
		padding: 0;

		li {
			margin-bottom: 0.6rem;
			line-height: 1.5;
		}
	}
`;

const ScopeBadge = styled.span`
	display: inline-flex;
	align-items: center;
	padding: 0.2rem 0.6rem;
	border-radius: 9999px;
	background: rgba(14, 165, 233, 0.12);
	color: #0369a1;
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.05em;
`;

const FooterNote = styled.p`
	margin: 0;
	color: #64748b;
	font-size: 0.85rem;
	line-height: 1.6;
`;

const PingOneScopesReference: React.FC = () => {
	const documentationUrl =
		'https://apidocs.pingidentity.com/pingone/platform/v1/api/#authorization-scopes';

	return (
		<PageContainer>
			<ContentWrapper>
				<MainCard>
					{PageHeader && (
						<PageHeader>
							<div style={{ display: 'flex', alignItems: 'center' }}>
								<HeroIcon>
									<FiBook />
								</HeroIcon>
								<div>
									<HeroTitle>PingOne OAuth & OIDC Scope Reference</HeroTitle>
									<HeroSubtitle>
										Curated catalog of PingOne scopes, including least-privilege guidance, scope
										combinations, and real-world authorization advice.
									</HeroSubtitle>
								</div>
							</div>
						</PageHeader>
					)}

					<SectionContainer>
						<Pill>
							<FiInfo /> Updated for PingOne Platform v2025.11
						</Pill>
						<Spacing $size="sm" />
						<p>
							Scopes define the exact resources and operations that an access token may use. PingOne
							ships with a mix of <strong>standard OpenID Connect scopes</strong>,{' '}
							<strong>PingOne-specific API scopes</strong>, and{' '}
							<strong>granular service scopes</strong>
							for MFA, Risk, and Directory APIs. Use the tables below to assemble precise scope
							bundles for your applications.
						</p>

						<Callout>
							<CalloutIcon>
								<FiShield />
							</CalloutIcon>
							<div>
								<strong>Security first:</strong> Always apply the principle of least privilege. Only
								grant the scopes that the calling application genuinely needs, and review them
								during every release cycle.
							</div>
						</Callout>
					</SectionContainer>

					<SectionContainer>
						<h2>1. Standard OpenID Connect Scopes</h2>
						<p>
							These scopes conform to the OIDC Core specification. They control which identity
							claims are returned in the ID token and the /userinfo endpoint.
						</p>
						<ScopeTable>
							<thead>
								<tr>
									<th style={{ width: '18%' }}>Scope</th>
									<th style={{ width: '32%' }}>Grants</th>
									<th>Usage Tips</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td>
										<code>openid</code>
									</td>
									<td>
										Required for any OIDC request. Enables ID token issuance and /userinfo access.
									</td>
									<td>
										Always include. Without it, the request becomes plain OAuth and PingOne will
										reject OIDC features.
									</td>
								</tr>
								<tr>
									<td>
										<code>profile</code>
									</td>
									<td>
										Basic identity claims: name, family_name, given_name, locale, updated_at, etc.
									</td>
									<td>
										Combine with <code>openid</code> when your app needs to display a friendly name
										or avatar.
									</td>
								</tr>
								<tr>
									<td>
										<code>email</code>
									</td>
									<td>Email address and verification status.</td>
									<td>
										Useful for apps that rely on email notifications or must confirm the user’s
										email ownership.
									</td>
								</tr>
								<tr>
									<td>
										<code>address</code>
									</td>
									<td>Structured postal address claim.</td>
									<td>
										Request only for applications that manage shipping, invoicing, or regulated
										customer data.
									</td>
								</tr>
								<tr>
									<td>
										<code>phone</code>
									</td>
									<td>Phone number and verification flag.</td>
									<td>Pair with MFA enrollment experiences or SMS-based alerts.</td>
								</tr>
								<tr style={{ background: '#fef3c7' }}>
									<td>
										<code>offline_access</code>
										<br />
										<Pill $variant="critical" style={{ marginTop: '0.5rem', fontSize: '0.7rem' }}>
											REFRESH TOKEN
										</Pill>
									</td>
									<td>
										<strong>Enables refresh token issuance.</strong> Allows the application to
										obtain new access tokens without requiring the user to re-authenticate. The
										refresh token can be used to maintain long-term access to user resources.
										<br />
										<br />
										<strong>PingOne Behavior:</strong>
										<ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
											<li>
												Refresh tokens are only ever issued when the <em>Refresh Token</em> grant is
												enabled for the application. If that grant is off, no scope combination will
												yield a refresh token.
											</li>
											<li>
												If <code>offline_access</code> is <em>not</em> listed under Allowed Scopes,
												PingOne will return a refresh token automatically on every successful
												Authorization Code exchange once the grant is enabled.
											</li>
											<li>
												If <code>offline_access</code> <em>is</em> listed under Allowed Scopes,
												clients must explicitly request it during authorization. Without the scope
												in the request, PingOne withholds the refresh token even though the grant is
												enabled.
											</li>
											<li>Supports refresh token rotation (recommended)</li>
											<li>Configurable token lifetime (default: 30 days)</li>
											<li>Idle timeout can be configured</li>
											<li>Tokens can be revoked via admin console or API</li>
										</ul>
									</td>
									<td>
										<strong>✅ Use for:</strong>
										<ul style={{ margin: '0.25rem 0', paddingLeft: '1.5rem' }}>
											<li>Mobile applications</li>
											<li>Background sync services</li>
											<li>Long-running desktop apps</li>
											<li>Scheduled tasks requiring user context</li>
										</ul>
										<strong>❌ Avoid for:</strong>
										<ul style={{ margin: '0.25rem 0', paddingLeft: '1.5rem' }}>
											<li>Browser-based SPAs (unless using BFF pattern)</li>
											<li>Short-lived sessions</li>
											<li>Public clients without secure storage</li>
										</ul>
										<strong>🔒 Security:</strong> Store refresh tokens securely using
										platform-specific secure storage (iOS Keychain, Android Keystore, encrypted
										database). Never store in localStorage or sessionStorage. Always enable token
										rotation in PingOne for enhanced security.
									</td>
								</tr>
							</tbody>
						</ScopeTable>

						<Callout $variant="warning" style={{ marginTop: '1.5rem' }}>
							<CalloutIcon>
								<FiShield />
							</CalloutIcon>
							<div>
								<strong>offline_access Security Best Practices:</strong>
								<ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem', lineHeight: '1.7' }}>
									<li>
										<strong>Enable Token Rotation:</strong> Configure PingOne to issue a new refresh
										token with each refresh request, limiting the impact of token theft.
									</li>
									<li>
										<strong>Secure Storage:</strong> Use platform-specific secure storage
										mechanisms. On iOS use Keychain, on Android use Keystore, for web apps use
										Backend-for-Frontend (BFF) pattern.
									</li>
									<li>
										<strong>Handle Revocation:</strong> Implement proper error handling for revoked
										or expired refresh tokens. Prompt users to re-authenticate rather than retrying
										indefinitely.
									</li>
									<li>
										<strong>Monitor Usage:</strong> Track refresh token usage patterns to detect
										anomalies that might indicate token theft or misuse.
									</li>
									<li>
										<strong>Set Appropriate Lifetimes:</strong> Configure refresh token lifetimes
										based on your security requirements. Shorter lifetimes reduce risk but require
										more frequent re-authentication.
									</li>
								</ul>
							</div>
						</Callout>
					</SectionContainer>

					<SectionContainer>
						<h2>2. PingOne Directory & Authentication Scopes</h2>
						<Callout $variant="info">
							<CalloutIcon>
								<FiTarget />
							</CalloutIcon>
							<div>
								Scopes prefixed with <code>p1:</code> follow the pattern{' '}
								<code>
									p1:{'<resource>'}:{'<action>'}:{'<entity>'}
								</code>
								. They map directly to PingOne Management API permissions.
							</div>
						</Callout>

						<ContentGrid $columns={2}>
							<ScopeCategoryCard>
								<h3>
									<FiCheckCircle /> User Directory
								</h3>
								<p>
									Grant read/write access to PingOne user profiles. These scopes are typically used
									by admin portals, HR sync processes, or customer service tools.
								</p>
								<ul>
									<li>
										<ScopeBadge>Read</ScopeBadge> <code>p1:read:user</code> – view directory users
										and core attributes.
									</li>
									<li>
										<ScopeBadge>Write</ScopeBadge> <code>p1:update:user</code> – modify profile
										data.
									</li>
									<li>
										<ScopeBadge>Write</ScopeBadge> <code>p1:create:user</code> – provision new
										users.
									</li>
									<li>
										<ScopeBadge>Write</ScopeBadge> <code>p1:delete:user</code> – remove users.
									</li>
								</ul>
							</ScopeCategoryCard>

							<ScopeCategoryCard>
								<h3>
									<FiShield /> Credentials & Secrets
								</h3>
								<p>
									Handle credentials, passwords, and user secrets. Apply strict controls and audit
									access to applications that receive these scopes.
								</p>
								<ul>
									<li>
										<ScopeBadge>Write</ScopeBadge> <code>p1:update:userCredentials</code> – reset or
										rotate user passwords.
									</li>
									<li>
										<ScopeBadge>Read</ScopeBadge> <code>p1:read:userCredentials</code> – retrieve
										credential metadata (never raw passwords).
									</li>
									<li>
										<ScopeBadge>Write</ScopeBadge> <code>p1:update:secret</code> – manage
										application or environment secrets.
									</li>
								</ul>
							</ScopeCategoryCard>

							<ScopeCategoryCard>
								<h3>
									<FiInfo /> MFA & Device Management
								</h3>
								<p>
									Allow applications to enroll, read, or disable MFA devices. Required for
									self-service security portals and helpdesk tooling.
								</p>
								<ul>
									<li>
										<ScopeBadge>Read</ScopeBadge> <code>p1:read:device</code> – list MFA devices.
									</li>
									<li>
										<ScopeBadge>Write</ScopeBadge> <code>p1:update:device</code> – register,
										activate/deactivate devices.
									</li>
								</ul>
							</ScopeCategoryCard>

							<ScopeCategoryCard>
								<h3>
									<FiTarget /> Risk & Intelligence
								</h3>
								<p>
									Use these scopes for adaptive authentication, fraud analytics, or risk dashboards.
								</p>
								<ul>
									<li>
										<ScopeBadge>Read</ScopeBadge> <code>p1:read:riskEvaluation</code> – retrieve
										risk scores generated during authentication.
									</li>
									<li>
										<ScopeBadge>Write</ScopeBadge> <code>p1:update:riskEvaluation</code> – submit
										risk feedback loops.
									</li>
								</ul>
							</ScopeCategoryCard>
						</ContentGrid>
					</SectionContainer>

					<SectionContainer>
						<h2>3. Scope Bundles for Common Applications</h2>
						<p>Starter templates you can adapt to your environment.</p>

						<ScopeTable>
							<thead>
								<tr>
									<th style={{ width: '25%' }}>Scenario</th>
									<th style={{ width: '35%' }}>Suggested Scope Set</th>
									<th>Notes</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td>Employee SSO Portal</td>
									<td>
										<code>openid profile email</code>
									</td>
									<td>
										Delivers core identity claims for session personalization; no directory write
										access.
									</td>
								</tr>
								<tr>
									<td>Helpdesk Tool</td>
									<td>
										<code>openid profile</code> + <code>p1:read:user</code>{' '}
										<code>p1:update:user</code> <code>p1:read:device</code>{' '}
										<code>p1:update:device</code>
									</td>
									<td>Allows support agents to reset MFA and update profile fields.</td>
								</tr>
								<tr>
									<td>Automation / API Client</td>
									<td>
										<code>p1:read:user</code> <code>p1:create:user</code>{' '}
										<code>p1:update:user</code> <code>p1:read:group</code>
									</td>
									<td>
										Provisioning bots often run under client credentials grant; rotate secrets
										regularly.
									</td>
								</tr>
								<tr>
									<td>Analytics / Risk Dashboard</td>
									<td>
										<code>openid</code> <code>profile</code> <code>p1:read:riskEvaluation</code>{' '}
										<code>p1:read:activity</code>
									</td>
									<td>
										Read-only visibility into behavioral signals without mutating directory data.
									</td>
								</tr>
							</tbody>
						</ScopeTable>
					</SectionContainer>

					<SectionContainer>
						<h2>4. Best Practices & Governance Checklist</h2>
						<Callout $variant="warning">
							<CalloutIcon>
								<FiInfo />
							</CalloutIcon>
							<div>
								<strong>Governance reminders:</strong> PingOne scopes map directly to powerful API
								operations. Establish scope review gates within your SDLC.
							</div>
						</Callout>

						<BestPracticeList>
							<li>
								<strong>Inventory every client:</strong> document which scopes each application uses
								and why. Review quarterly.
							</li>
							<li>
								<strong>Prefer role-based tokens:</strong> rather than granting broad scopes to many
								clients, centralize privileged operations in controlled services.
							</li>
							<li>
								<strong>Split machine vs. human clients:</strong> automation typically needs client
								credentials grant with management scopes; interactive clients should receive minimal
								user scopes.
							</li>
							<li>
								<strong>Monitor access tokens:</strong> log introspection requests and flag tokens
								that request unexpected scopes.
							</li>
							<li>
								<strong>Use environment roles:</strong> pair scopes with PingOne environment-level
								access control to reduce blast radius.
							</li>
						</BestPracticeList>
					</SectionContainer>

					<SectionContainer>
						<CollapsibleHeader
							title="Reference & Further Reading"
							subtitle="Official documentation and deep dives"
							theme="highlight"
							icon={<FiBook />}
						>
							<ul style={{ margin: '0 0 0 1.25rem', lineHeight: 1.6 }}>
								<li>
									<a
										href={documentationUrl}
										target="_blank"
										rel="noopener noreferrer"
										style={{ color: '#2563eb', fontWeight: 600 }}
									>
										PingOne Authorization Scopes
									</a>{' '}
									– Official API reference with the latest scope catalog.
								</li>
								<li>
									<a
										href="https://docs.pingidentity.com/bundle/pingone/page/kqb1664025065516.html"
										target="_blank"
										rel="noopener noreferrer"
										style={{ color: '#2563eb', fontWeight: 600 }}
									>
										PingOne Access Management – Scopes Overview
									</a>{' '}
									– Conceptual overview of directory, MFA, and risk scopes.
								</li>
								<li>
									<a
										href="https://docs.pingidentity.com/pingfederate/12.2/developers_reference_guide/pf_dev_ref.html"
										target="_blank"
										rel="noopener noreferrer"
										style={{ color: '#2563eb', fontWeight: 600 }}
									>
										PingFederate Developer’s Reference Guide
									</a>{' '}
									– Full catalog of PingFederate OAuth, OIDC, and federation endpoints to pair with
									PingOne.
								</li>
								<li>
									<a
										href="https://www.pingidentity.com/content/dam/developer/downloads/Resources/OAuth2%20Developers%20Guide%20(1).pdf"
										target="_blank"
										rel="noopener noreferrer"
										style={{ color: '#2563eb', fontWeight: 600 }}
									>
										Ping Identity OAuth 2.0 Developer’s Guide (PDF)
									</a>{' '}
									– Deep dive into grant flows, token models, and Ping implementation guidance.
								</li>
								<li>
									<a
										href="https://docs.pingidentity.com/developer-resources/openid_connect_developer_guide/index.html"
										target="_blank"
										rel="noopener noreferrer"
										style={{ color: '#2563eb', fontWeight: 600 }}
									>
										Ping Identity OpenID Connect Developer Guide
									</a>{' '}
									– Implementation tutorial for ID token, UserInfo, and hybrid OIDC patterns.
								</li>
								<li>
									<a
										href="https://datatracker.ietf.org/doc/html/rfc6749#section-3.3"
										target="_blank"
										rel="noopener noreferrer"
										style={{ color: '#2563eb', fontWeight: 600 }}
									>
										RFC 6749 Section 3.3
									</a>{' '}
									– OAuth 2.0 scope definition and recommendations.
								</li>
								<li>
									<a
										href="https://tools.ietf.org/html/rfc6749"
										target="_blank"
										rel="noopener noreferrer"
										style={{ color: '#2563eb', fontWeight: 600 }}
									>
										RFC 6749 (Full Specification)
									</a>{' '}
									– Canonical OAuth 2.0 framework specification covering all grant types and
									endpoints.
								</li>
								<li>
									<a
										href="https://openid.net/developers/how-connect-works/"
										target="_blank"
										rel="noopener noreferrer"
										style={{ color: '#2563eb', fontWeight: 600 }}
									>
										OpenID Connect – How Connect Works
									</a>{' '}
									– Primer on OIDC identity flows, tokens, and trust relationships.
								</li>
							</ul>
						</CollapsibleHeader>
					</SectionContainer>

					{PageFooter && (
						<PageFooter>
							<FooterNote>
								Need deeper access modeling? Pair this guide with the{' '}
								<a
									href="/docs/oauth2-security-best-practices"
									style={{ color: '#2563eb', fontWeight: 600 }}
								>
									OAuth 2.0 Security Best Practices
								</a>{' '}
								document for a full governance playbook.
							</FooterNote>
						</PageFooter>
					)}
				</MainCard>
			</ContentWrapper>
		</PageContainer>
	);
};

export default PingOneScopesReference;
