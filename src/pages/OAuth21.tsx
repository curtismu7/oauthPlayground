import {
	FiAlertTriangle,
	FiCheck,
	FiInfo,
	FiKey,
	FiRefreshCw,
	FiShield,
	FiUsers,
	FiX,
} from '@icons';
import styled from 'styled-components';
import { Card, CardBody } from '../components/Card';
import { SpecCard } from '../components/SpecCard';
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
import PageLayoutService from '../services/pageLayoutService';

const _Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem;
`;

const _Header = styled.div`
  margin-bottom: 2rem;

  h1 {
    font-size: 2.5rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray900};
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  p {
    color: ${({ theme }) => theme.colors.gray600};
    font-size: 1.1rem;
    line-height: 1.6;
  }
`;

const OverviewCard = styled(Card)`
  margin-bottom: 2rem;
  border-left: 4px solid ${({ theme }) => theme.colors.primary};
`;

const ChangesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
`;

const _ChangeCard = styled(Card)<{ $type: 'improvement' | 'deprecation' | 'requirement' }>`
  border-left: 4px solid ${({ $type, theme }) => {
		switch ($type) {
			case 'improvement':
				return theme.colors.success;
			case 'deprecation':
				return theme.colors.warning;
			case 'requirement':
				return theme.colors.primary;
			default:
				return theme.colors.gray300;
		}
	}};
`;

const _ChangeIcon = styled.div<{ $type: 'improvement' | 'deprecation' | 'requirement' }>`
  font-size: 1.5rem;
  color: ${({ $type, theme }) => {
		switch ($type) {
			case 'improvement':
				return theme.colors.success;
			case 'deprecation':
				return theme.colors.warning;
			case 'requirement':
				return theme.colors.primary;
			default:
				return theme.colors.gray300;
		}
	}};
  margin-bottom: 1rem;
`;

const _ChangeTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: ${({ theme }) => theme.colors.gray900};
`;

const _ChangeDescription = styled.p`
  color: ${({ theme }) => theme.colors.gray600};
  line-height: 1.6;
  margin-bottom: 1rem;
`;

const _CodeBlock = styled.pre`
  background-color: ${({ theme }) => theme.colors.gray100};
  border: 1px solid ${({ theme }) => theme.colors.gray300};
  border-radius: 0.375rem;
  padding: 1rem;
  font-size: 0.875rem;
  line-height: 1.5;
  overflow-x: auto;
  margin: 1rem 0;
`;

const PingOneNote = styled.div`
  background-color: ${({ theme }) => theme.colors.info}10;
  border: 1px solid ${({ theme }) => theme.colors.info}30;
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 1rem 0;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;

  svg {
    color: ${({ theme }) => theme.colors.info};
    flex-shrink: 0;
    margin-top: 0.1rem;
  }

  h4 {
    color: ${({ theme }) => theme.colors.info};
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.info};
    font-size: 0.9rem;
  }
`;

const OAuth21 = () => {
	// Use V6 pageLayoutService for consistent dimensions and FlowHeader integration
	const pageConfig = {
		flowType: 'documentation' as const,
		theme: 'blue' as const,
		maxWidth: '72rem', // Wider for OAuth 2.1 content (1152px)
		showHeader: true,
		showFooter: false,
		responsive: true,
		flowId: 'oauth-2-1', // Enables FlowHeader integration
	};

	const { PageContainer, ContentWrapper, PageHeader } =
		PageLayoutService.createPageLayout(pageConfig);

	return (
		<PageContainer>
			{PageHeader ? (
				<PageHeader>
					<h1>OAuth 2.1</h1>
					<p>Evolution of OAuth 2.0 with built-in security improvements and best practices</p>
				</PageHeader>
			) : (
				<header
					style={{
						padding: '2rem',
						background: '#1d4ed8',
						color: 'white',
						borderRadius: '1rem 1rem 0 0',
					}}
				>
					<h1>OAuth 2.1</h1>
					<p>Evolution of OAuth 2.0 with built-in security improvements and best practices</p>
				</header>
			)}
			<ContentWrapper>
				<CollapsibleHeader
					title="What is OAuth 2.1?"
					subtitle="Evolution of OAuth 2.0 with built-in security improvements and best practices"
					icon={<FiShield />}
					defaultCollapsed={false}
				>
					<OverviewCard>
						<CardBody>
							<p>
								OAuth 2.1 consolidates the changes published in later specifications to simplify the
								core document. It represents the evolution of OAuth 2.0 with security improvements
								and best practices built-in.
							</p>
							<p>
								<strong>Status:</strong> Currently in draft (draft-ietf-oauth-v2-1-13) -
								<a
									href="https://oauth.net/2.1/"
									target="_blank"
									rel="noopener noreferrer"
									style={{ color: '#3b82f6', marginLeft: '0.5rem' }}
								>
									View on oauth.net
								</a>
							</p>
						</CardBody>
					</OverviewCard>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="Flows and Features Removed from OAuth 2.1"
					subtitle="Deprecated patterns that no longer appear in the consolidated specification"
					icon={<FiAlertTriangle />}
					defaultCollapsed={false}
				>
					<Card>
						<CardBody>
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
										<FiX style={{ color: '#f59e0b', fontSize: '1.25rem' }} />
										<span style={{ fontWeight: 600, color: '#f59e0b' }}>REMOVED</span>
									</div>
									<p>
										`response_type=token` no longer appears in OAuth 2.1. Browsers should use
										Authorization Code + PKCE, which prevents token leakage through URL fragments
										and enables sender-constrained access tokens.
									</p>
									<p style={{ fontSize: '0.9rem', color: '#64748b' }}>
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
										<FiX style={{ color: '#f59e0b', fontSize: '1.25rem' }} />
										<span style={{ fontWeight: 600, color: '#f59e0b' }}>REMOVED</span>
									</div>
									<p>
										The password grant encouraged first-party apps to collect user credentials.
										OAuth 2.1 removes it entirely. Modern replacements include Authorization Code +
										PKCE or token exchange patterns for highly trusted backends.
									</p>
									<p style={{ fontSize: '0.9rem', color: '#64748b' }}>
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
										<FiShield style={{ color: '#0ea5e9', fontSize: '1.25rem' }} />
										<span style={{ fontWeight: 600, color: '#0ea5e9' }}>ENFORCED</span>
									</div>
									<p>
										Native and browser-based apps must use `https` URIs (with loopback exceptions)
										and exact matching. Lenient schemes tolerated in early OAuth 2.0 deployments are
										no longer acceptable.
									</p>
									<p style={{ fontSize: '0.9rem', color: '#64748b' }}>
										Reference: draft-ietf-oauth-v2-1 §6.1 (redirect URI requirements).
									</p>
								</SpecCard>
							</ChangesGrid>
							<PingOneNote>
								<FiInfo />
								<div>
									<h4>PingOne guidance</h4>
									<p>
										Existing PingOne tenants should migrate any legacy implicit or password
										integrations to Authorization Code + PKCE. The platform already enforces strict
										redirect URI validation, so review client registrations for lingering insecure
										URLs.
									</p>
								</div>
							</PingOneNote>
						</CardBody>
					</Card>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="Key Changes from OAuth 2.0 to OAuth 2.1"
					subtitle="Major security improvements and deprecations in OAuth 2.1"
					icon={<FiKey />}
					defaultCollapsed={false}
				>
					<Card>
						<CardBody>
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
										<FiCheck style={{ color: '#10b981', fontSize: '1.25rem' }} />
										<span style={{ fontWeight: '600', color: '#10b981' }}>REQUIRED</span>
									</div>
									<p>
										PKCE (Proof Key for Code Exchange) is now <strong>required</strong> for all
										OAuth clients using the authorization code flow, not just public clients.
									</p>
									<pre>{`// OAuth 2.1 REQUIRES PKCE for all clients
GET /authorize?
  response_type=code
  &client_id=your_client_id
  &code_challenge=YOUR_CODE_CHALLENGE
  &code_challenge_method=S256`}</pre>
									<div
										style={{
											background: '#eff6ff',
											border: '1px solid #bfdbfe',
											borderRadius: '0.5rem',
											padding: '1rem',
											margin: '1rem 0',
											display: 'flex',
											alignItems: 'flex-start',
											gap: '0.75rem',
										}}
									>
										<FiInfo style={{ color: '#3b82f6', flexShrink: 0, marginTop: '0.1rem' }} />
										<div>
											<h4
												style={{
													color: '#3b82f6',
													margin: '0 0 0.5rem 0',
													fontSize: '1rem',
													fontWeight: '600',
												}}
											>
												PingOne Support
											</h4>
											<p style={{ margin: '0', color: '#3b82f6', fontSize: '0.9rem' }}>
												PingOne fully supports PKCE and recommends its use for all OAuth flows.
											</p>
										</div>
									</div>
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
										<FiCheck style={{ color: '#10b981', fontSize: '1.25rem' }} />
										<span style={{ fontWeight: '600', color: '#10b981' }}>REQUIRED</span>
									</div>
									<p>
										Redirect URIs must be compared using exact string matching, eliminating the
										previous substring matching behavior that could lead to security
										vulnerabilities.
									</p>
									<pre>{`// OAuth 2.1: Exact string matching required
//  Correct - exact match
redirect_uri=https://app.example.com/callback

//  OAuth 2.0 allowed substring matching
// This is no longer permitted in OAuth 2.1`}</pre>
									<div
										style={{
											background: '#eff6ff',
											border: '1px solid #bfdbfe',
											borderRadius: '0.5rem',
											padding: '1rem',
											margin: '1rem 0',
											display: 'flex',
											alignItems: 'flex-start',
											gap: '0.75rem',
										}}
									>
										<FiInfo style={{ color: '#3b82f6', flexShrink: 0, marginTop: '0.1rem' }} />
										<div>
											<h4
												style={{
													color: '#3b82f6',
													margin: '0 0 0.5rem 0',
													fontSize: '1rem',
													fontWeight: '600',
												}}
											>
												PingOne Support
											</h4>
											<p style={{ margin: '0', color: '#3b82f6', fontSize: '0.9rem' }}>
												PingOne already enforces exact redirect URI matching for security.
											</p>
										</div>
									</div>
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
										<FiX style={{ color: '#f59e0b', fontSize: '1.25rem' }} />
										<span style={{ fontWeight: '600', color: '#f59e0b' }}>DEPRECATED</span>
									</div>
									<p>
										The Implicit grant (`response_type=token`) is omitted from OAuth 2.1
										specification due to security concerns. Use Authorization Code flow with PKCE
										instead.
									</p>
									<pre>{`//  OAuth 2.1: Implicit flow deprecated
// response_type=token is no longer supported

//  OAuth 2.1: Use Authorization Code + PKCE
response_type=code
&code_challenge=YOUR_CODE_CHALLENGE
&code_challenge_method=S256`}</pre>
									<div
										style={{
											background: '#eff6ff',
											border: '1px solid #bfdbfe',
											borderRadius: '0.5rem',
											padding: '1rem',
											margin: '1rem 0',
											display: 'flex',
											alignItems: 'flex-start',
											gap: '0.75rem',
										}}
									>
										<FiInfo style={{ color: '#3b82f6', flexShrink: 0, marginTop: '0.1rem' }} />
										<div>
											<h4
												style={{
													color: '#3b82f6',
													margin: '0 0 0.5rem 0',
													fontSize: '1rem',
													fontWeight: '600',
												}}
											>
												PingOne Support
											</h4>
											<p style={{ margin: '0', color: '#3b82f6', fontSize: '0.9rem' }}>
												PingOne still supports Implicit flow for backward compatibility but
												recommends using Authorization Code + PKCE.
											</p>
										</div>
									</div>
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
										<FiX style={{ color: '#f59e0b', fontSize: '1.25rem' }} />
										<span style={{ fontWeight: '600', color: '#f59e0b' }}>DEPRECATED</span>
									</div>
									<p>
										The Password grant is omitted from OAuth 2.1 specification. Use Authorization
										Code flow for user authentication scenarios.
									</p>
									<pre>{`//  OAuth 2.1: Password grant deprecated
// grant_type=password is no longer supported

//  OAuth 2.1: Use Authorization Code flow
// Let the authorization server handle authentication`}</pre>
									<div
										style={{
											background: '#eff6ff',
											border: '1px solid #bfdbfe',
											borderRadius: '0.5rem',
											padding: '1rem',
											margin: '1rem 0',
											display: 'flex',
											alignItems: 'flex-start',
											gap: '0.75rem',
										}}
									>
										<FiInfo style={{ color: '#3b82f6', flexShrink: 0, marginTop: '0.1rem' }} />
										<div>
											<h4
												style={{
													color: '#3b82f6',
													margin: '0 0 0.5rem 0',
													fontSize: '1rem',
													fontWeight: '600',
												}}
											>
												PingOne Support
											</h4>
											<p style={{ margin: '0', color: '#3b82f6', fontSize: '0.9rem' }}>
												PingOne still supports Password grant for legacy applications but recommends
												migrating to Authorization Code flow.
											</p>
										</div>
									</div>
								</SpecCard>

								{/* Bearer Token Security */}
								<SpecCard title="Enhanced Bearer Token Security">
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '0.5rem',
											marginBottom: '1rem',
										}}
									>
										<FiShield style={{ color: '#3b82f6', fontSize: '1.25rem' }} />
										<span style={{ fontWeight: '600', color: '#3b82f6' }}>IMPROVEMENT</span>
									</div>
									<p>
										Bearer token usage omits the use of bearer tokens in the query string of URIs,
										improving security by preventing token leakage in logs and referrer headers.
									</p>
									<pre>{`//  OAuth 2.1: No tokens in query strings
// https://api.example.com/data?access_token=TOKEN

//  OAuth 2.1: Use Authorization header
Authorization: Bearer YOUR_ACCESS_TOKEN`}</pre>
									<div
										style={{
											background: '#eff6ff',
											border: '1px solid #bfdbfe',
											borderRadius: '0.5rem',
											padding: '1rem',
											margin: '1rem 0',
											display: 'flex',
											alignItems: 'flex-start',
											gap: '0.75rem',
										}}
									>
										<FiInfo style={{ color: '#3b82f6', flexShrink: 0, marginTop: '0.1rem' }} />
										<div>
											<h4
												style={{
													color: '#3b82f6',
													margin: '0 0 0.5rem 0',
													fontSize: '1rem',
													fontWeight: '600',
												}}
											>
												PingOne Support
											</h4>
											<p style={{ margin: '0', color: '#3b82f6', fontSize: '0.9rem' }}>
												PingOne follows OAuth 2.1 best practices for bearer token usage.
											</p>
										</div>
									</div>
								</SpecCard>

								{/* Refresh Token Security */}
								<SpecCard title="Enhanced Refresh Token Security">
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '0.5rem',
											marginBottom: '1rem',
										}}
									>
										<FiShield style={{ color: '#3b82f6', fontSize: '1.25rem' }} />
										<span style={{ fontWeight: '600', color: '#3b82f6' }}>IMPROVEMENT</span>
									</div>
									<p>
										Refresh tokens for public clients must either be sender-constrained or one-time
										use, improving security for public client applications.
									</p>
									<pre>{`// OAuth 2.1: Enhanced refresh token security
// Public clients must use:
// 1. Sender-constrained refresh tokens (e.g., mTLS)
// 2. One-time use refresh tokens
// 3. Or no refresh tokens at all`}</pre>
									<div
										style={{
											background: '#fef2f2',
											border: '1px solid #fecaca',
											borderRadius: '0.5rem',
											padding: '1rem',
											margin: '1rem 0',
											display: 'flex',
											alignItems: 'flex-start',
											gap: '0.75rem',
										}}
									>
										<FiX style={{ color: '#dc2626', flexShrink: 0, marginTop: '0.1rem' }} />
										<div>
											<h4
												style={{
													color: '#dc2626',
													margin: '0 0 0.5rem 0',
													fontSize: '1rem',
													fontWeight: '600',
												}}
											>
												PingOne Support - Partial
											</h4>
											<p style={{ margin: '0', color: '#dc2626', fontSize: '0.9rem' }}>
												PingOne supports one-time use refresh tokens. Sender-constrained refresh
												tokens (mTLS, DPoP) are not currently supported.
											</p>
										</div>
									</div>
								</SpecCard>
							</ChangesGrid>
						</CardBody>
					</Card>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="Migration Guide"
					subtitle="Step-by-step guide for migrating from OAuth 2.0 to OAuth 2.1"
					icon={<FiRefreshCw />}
					defaultCollapsed={false}
				>
					<Card>
						<CardBody>
							<h3>For Existing OAuth 2.0 Applications</h3>
							<ol style={{ paddingLeft: '1.5rem', lineHeight: '1.6' }}>
								<li>
									<strong>Enable PKCE:</strong> Add PKCE to all Authorization Code flows
								</li>
								<li>
									<strong>Remove Implicit Flow:</strong> Migrate to Authorization Code + PKCE
								</li>
								<li>
									<strong>Remove Password Grant:</strong> Use Authorization Code flow instead
								</li>
								<li>
									<strong>Secure Bearer Tokens:</strong> Use Authorization headers, not query
									strings
								</li>
								<li>
									<strong>Enhance Refresh Tokens:</strong> Implement sender-constrained or one-time
									use tokens
								</li>
							</ol>

							<h3>Benefits of Migration</h3>
							<ul style={{ paddingLeft: '1.5rem', lineHeight: '1.6' }}>
								<li>
									<strong>Enhanced Security:</strong> PKCE prevents authorization code interception
								</li>
								<li>
									<strong>Better Token Handling:</strong> Prevents token leakage in logs and
									referrers
								</li>
								<li>
									<strong>Future-Proof:</strong> Aligns with industry best practices and standards
								</li>
								<li>
									<strong>Improved User Experience:</strong> More secure and reliable authentication
									flows
								</li>
							</ul>
						</CardBody>
					</Card>
				</CollapsibleHeader>

				<CollapsibleHeader
					title="PingOne OAuth 2.1 Readiness"
					subtitle="PingOne's support for OAuth 2.1 features and recommendations"
					icon={<FiUsers />}
					defaultCollapsed={false}
				>
					<Card>
						<CardBody>
							<p>
								PingOne is well-positioned for OAuth 2.1 adoption with comprehensive support for:
							</p>
							<ul style={{ paddingLeft: '1.5rem', lineHeight: '1.6' }}>
								<li>
									<strong>✓ PKCE Support:</strong> Full PKCE implementation for all flows
								</li>
								<li>
									<strong>✓ Exact URI Matching:</strong> Secure redirect URI validation
								</li>
								<li>
									<strong>✓ Bearer Token Security:</strong> Proper token handling practices
								</li>
								<li>
									<strong>⚠️ Enhanced Refresh Tokens:</strong> One-time use refresh tokens supported.
									Sender-constrained tokens (mTLS, DPoP) not yet available.
								</li>
								<li>
									<strong>✓ Backward Compatibility:</strong> Gradual migration support
								</li>
							</ul>

							<PingOneNote>
								<FiInfo />
								<div>
									<h4>Recommendation</h4>
									<p>
										Start implementing OAuth 2.1 practices now to ensure a smooth transition when
										the specification is finalized. Use one-time use refresh tokens for public
										clients as an alternative to sender-constrained tokens.
									</p>
								</div>
							</PingOneNote>
						</CardBody>
					</Card>
				</CollapsibleHeader>
			</ContentWrapper>
		</PageContainer>
	);
};

export default OAuth21;
